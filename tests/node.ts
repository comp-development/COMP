import puppeteer from "puppeteer";
import reset_db from "../db/seed.js";
import {
  setup_test,
  student_register_eventbrite,
  student_register_stripe,
  student_signup,
  validate_student_team_constraints,
} from "./tests.js";
import "dotenv/config";
import { env } from "process";
import { configDotenv } from "dotenv";

configDotenv({ path: "../db/.env" });

console.group("RUNNING DB TESTS");
console.time("db-tests");

await reset_db({ eventbrite_sample_event_id: env.EVENTBRITE_SAMPLE_EVENT_ID });
const ids = await setup_test();
await validate_student_team_constraints(ids);

console.groupEnd();
console.timeEnd("db-tests");

console.log();

console.group("RUNNING BROWSER TESTS");
console.time("browser-tests");

// Launch the browser and open a new blank page
const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-startup-window"],
  waitForInitialPage: false,
});

await Promise.all([
  student_signup(browser),
  student_register_stripe(browser, ids),
  // student_register_eventbrite(browser),
]);

console.groupEnd();
console.timeEnd("browser-tests");

console.log("\nALL TESTS PASSED\n");

await browser.close();
process.exit();
