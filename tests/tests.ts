import type { AsyncReturnType } from "$lib/supabaseClient";
import type { Browser, BrowserContext, Page } from "puppeteer";
import {
  adminSupabase,
  assert_eq,
  sleep,
  unwrap,
  unwrap_data,
  unwrap_error,
} from "./assert";
import { assert } from "console";

export const BASE_URL: string = "https://localhost:5173";

export async function setup_test() {
  const test_student = unwrap_data(
    await adminSupabase
      .from("students")
      .select("*")
      .eq("first_name", "Test")
      .eq("last_name", "Student")
      .single(),
  );
  const student_data = await adminSupabase.auth.admin.getUserById(
    test_student!.student_id,
  );
  assert_eq(
    student_data?.data?.user?.email,
    "student@gmail.com",
    "mismatched name for seeded test student",
  );
  const new_host = unwrap_data(
    await adminSupabase
      .from("hosts")
      .insert([{ host_name: "Test Host" }])
      .select("*")
      .single(),
  );
  const new_event = unwrap_data(
    await adminSupabase
      .from("events")
      .insert([
        {
          event_name: "Test Event",
          host_id: new_host.host_id,
          ticket_price_cents: 1500,
          eventbrite_event_id: null,
        },
      ])
      .select("*")
      .single(),
  );
  const event_id = new_event.event_id;
  const new_team = unwrap_data(
    await adminSupabase
      .from("teams")
      .insert([{ event_id, team_name: "Test Team" }])
      .select("*")
      .single(),
  );
  const team_id = new_team.team_id;

  console.log("setup test passed");
  return {
    host_id: new_host.host_id,
    event_id: new_event.event_id,
    team_id: new_team.team_id,
    student_id: test_student.student_id,
  };
}

type TestIds = AsyncReturnType<typeof setup_test>;

export async function validate_student_team_constraints(ids: TestIds) {
  const { host_id, event_id, team_id, student_id } = ids;
  // Inserting just a student into student_events should succeed.
  unwrap(
    await adminSupabase
      .from("student_events")
      .insert([{ event_id, student_id, team_id: null }]),
  );
  // Putting the student onto a team without paying should fail.
  const error = unwrap_error(
    await adminSupabase
      .from("student_events")
      .update({ team_id })
      .eq("event_id", event_id)
      .eq("student_id", student_id)
      .select("*"),
  );
  assert_eq(
    error.message,
    "Student must purchase ticket to be on independent team",
  );

  // TODO: Inserting a student into a team with a mismatched org is an error.
  const new_org = unwrap_data(
    await adminSupabase.from("orgs").insert([{}]).select("*").single(),
  );
  // TODO: insert event, org into table
  // const mismatched_team = unwrap_data(
  //   await adminSupabase
  //     .from("teams")
  //     .insert([{ event_id, team_name: "Bad Team", org_id: new_org.org_id }])
  //     .select("*")
  //     .single(),
  // );

  // TODO: check that inserting student onto team with paying is not error.

  console.log("validate student team constraints passed");
}

export async function student_signup(browser: Browser) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  // Navigate the page to a URL.
  await page.goto(BASE_URL);

  (await page.locator("text/Sign Up").waitHandle())?.click();

  // Fill this first so that the puppeteer waits for all input elements to update.
  await page.locator("#first_name").fill("Testing");
  await page.locator("#last_name").fill("Student");
  await page.locator("#email").fill("example@gmail.com");
  await page.locator("#password").fill("example123");
  await page.locator("#retypePassword").fill("example123");
  await page.locator("button[type=submit]").click();

  await page.close();

  console.log("student signup passed");
}

// Test logging in with the seeded student.
async function student_login(browser: Browser): Promise<Page> {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.goto(BASE_URL);

  await page.locator("input[type=email]").fill("student@gmail.com");
  await page.locator("#password").fill("student123");
  await page.keyboard.press("Enter");

  // Wait for the next page to load.
  await page.locator("text/Welcome").click();

  return page;
}

export async function student_register_stripe(browser: Browser, ids: TestIds) {
  // Navigate to event page.
  const page = await student_login(browser);
  await page.goto(`${BASE_URL}/student/${ids.host_id}/${ids.event_id}`);
  // Register for event.
  await page.locator("button[type=submit]").click();

  await page.locator("text/Create Independent Team").click();
  await page.locator("text/Create Team!").click();

  // Payment screen
  await page.locator("input[type=text]").fill("student@gmail.com");
  // Select card payment.
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await page.keyboard.type("4242424242424242");
  await page.keyboard.press("Tab");
  await page.keyboard.type("1234");
  await page.keyboard.press("Tab");
  await page.keyboard.type("123");
  await page.keyboard.press("Tab");
  await page.keyboard.type("Test Student");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.type("12345");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");

  await page.locator("#team-name").fill("New Team");
  await page.locator("button").click();

  await page.close();

  console.log("student stripe create team passed");
}

export async function student_register_eventbrite(browser: Browser) {
  // Navigate to event page.
  const page = await student_login(browser);
  // Query for an event with an eventbrite id.
  // This should probably exist given the deterministic seeding.
  // NOTE: if this errors, instead of messing with seed script, create an event
  // in this testing script with the eventbrite event id.
  const { host_id, event_id } = unwrap_data(
    await adminSupabase
      .from("events")
      .select("event_id, host_id")
      .not("eventbrite_event_id", "is", null),
  )[0];

  await page.goto(`${BASE_URL}/student/${host_id}/${event_id}`);

  // Register for event.
  await page.locator("button[type=submit]").click();

  await page.locator("text/Create Independent Team").click();
  await page.locator("text/Create Team!").click();

  // Payment screen
  // hecking eventbrite pops up two identical embeds. only clicking the second one
  // will proceed.
  let eventbrite_page;
  const retries = 10;
  for (let i = 0; ; i++) {
    // Eventbrite, being a dynamically loaded script (via html tag), may not actually
    // be loaded. So, keep clicking until it is loaded!
    eventbrite_page = page
      .frames()
      .filter(
        (frame) =>
          frame.url().search("www.eventbrite.com/checkout-external") != -1,
      )[0];
    if (eventbrite_page) {
      break;
    }
    if (i > 3) {
      console.log(
        `waiting for eventbrite (check if you're online) (${i}/${retries})`,
      );
    }
    if (i >= retries) {
      throw Error("timed out waiting for eventbrite embed to load");
    }
    await page.locator("text/Create Team!").click();
    await sleep(300);
  }

  // Eventbrite pops up two screens, the first of which swallows user inputs.
  // So, we keep clicking register until the second screen receives input.
  await eventbrite_page.locator("text/Register").waitHandle();
  while (true) {
    // If the second screen has received our input, then we have advanced to
    // the fill-out-name-and-email page.
    if (
      await eventbrite_page.$(
        "input[data-automation=checkout-form-N-first_name]",
      )
    ) {
      break;
    }
    try {
      await eventbrite_page
        .locator("::-p-text(Register)")
        .setTimeout(100)
        .filter((e) => (e as HTMLInputElement)?.type == "button")
        .click();
    } catch {
      continue;
    }
  }

  await eventbrite_page
    .locator("input[data-automation=checkout-form-N-first_name]")
    .fill("Test");
  // Eventbrite's page sucks and doesn't take "Test" the first time.
  // So we go back and fill it out again.
  await eventbrite_page
    .locator("input[data-automation=checkout-form-N-first_name]")
    .fill("Test");
  await eventbrite_page
    .locator("input[data-automation=checkout-form-N-last_name]")
    .fill("Student");
  await eventbrite_page
    .locator("input[data-automation=checkout-form-N-email]")
    .fill("student@gmail.com");
  await eventbrite_page
    .locator("input[data-automation=checkout-form-confirmEmailAddress")
    .fill("student@gmail.com");
  await eventbrite_page.locator("button::-p-text(Register)").click();

  // For some reason, clicking event immediately and up two seconds later doesn't work.
  // But clicking, some three or so seconds later does.
  await eventbrite_page.locator("::-p-text(Complete order)").click();
  let el = await eventbrite_page.$("::-p-text(Complete order)");
  while (el) {
    await el.click();
    await sleep(1_000);
    el = await eventbrite_page.$("::-p-text(Complete order)");
  }

  await page.locator("#team-name").fill("Test Student's Team");
  await page.locator("button::-p-text(Create Team)").click();

  // Check that the page now include's the team name.
  assert(await page.$("::-p-text(Test Student's Team)"), "should be on team");

  await page.close();
  console.log("student eventbrite create team passed");
  return;
}
