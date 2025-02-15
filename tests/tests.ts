import type { AsyncReturnType } from "$lib/supabaseClient";
import type { Browser, BrowserContext, Page } from "puppeteer";
import {
  adminSupabase,
  assert_eq,
  unwrap,
  unwrap_data,
  unwrap_error,
} from "./assert";

export const BASE_URL: string = "http://localhost:5173";

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
export async function student_login(browser: Browser): Promise<Page> {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.goto(BASE_URL);

  await page.locator("input[type=email]").fill("student@gmail.com");
  await page.locator("#password").fill("student123");
  await page.keyboard.press("Enter");

  // Wait for the next page to load.
  await page.locator("text/Welcome").click();

  console.log("student login passed");
  return page;
}

// Takes a logged in browser context.
export async function student_register(page: Page, ids: TestIds) {
  // Navigate to event page.

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

  console.log("student register passed");
}
