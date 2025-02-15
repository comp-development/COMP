import puppeteer from "puppeteer";
import reset_db from "../db/seed.js";
import {
  setup_test,
  student_login,
  student_register,
  student_signup,
  validate_student_team_constraints,
} from "./tests.js";

console.group("RUNNING DB TESTS");
console.time("db-tests");
await reset_db();
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
});

await student_signup(browser);
const page = await student_login(browser);
await student_register(page, ids);

// // Set screen size.
// await page.setViewport({ width: 1080, height: 1024 });

console.groupEnd();
console.timeEnd("browser-tests");

console.log();

console.log("ALL TESTS PASSED");

await browser.close();
process.exit();
