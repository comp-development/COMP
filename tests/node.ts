import puppeteer from "puppeteer";
import reset_db from "../db/seed.js";
import setup_test from "./tests.js";

await reset_db();
await setup_test();

// Launch the browser and open a new blank page
const browser = await puppeteer.launch({
  headless: false,
});
const page = await browser.newPage();

// Navigate the page to a URL.
await page.goto("http://localhost:5173/");

// Set screen size.
await page.setViewport({ width: 1080, height: 1024 });

(await page.locator("text/Sign-Up").waitHandle())?.click();

// Fill this first so that the puppeteer waits for all input elements to update.
await page.locator("#show-password2").fill("example123");
await page.locator("input[type=email]").fill("example@gmail.com");
await page.locator("#show-password1").fill("example123");
await page.locator(".profileButtons button").click();

console.log("ALL TESTS PASSED");

await browser.close();
process.exit();
