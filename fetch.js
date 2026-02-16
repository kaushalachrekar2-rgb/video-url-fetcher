const puppeteer = require("puppeteer-core");
const axios = require("axios");

// ================= CONFIG =================

// Google Apps Script URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzOtTHkf8KqkyW6qzl0Jv49r_w6WyBcfp9xKWksPH-C3phCuv_a8BpRtFHwzPUjT-WAlA/exec";

// Codes and links
const VIDEO_ITEMS = [
  {
    code: "START-464",
    links: [
      "https://jav.guru/820383/start-464-i-fell-in-love-with-a-high-achieving-young-lady-who-can-only-love-a-gross-fat-guy-and-i-immersed-myself-in-the-sexual-development-of-an-innocent-woman-in-a-messy-room-honjou-suzu/"
    ]
  }
];

// Multiple possible selectors (multi-site support)
const VIEW_SELECTORS = [
  "span.javstats",                                    // jav.guru (new site)
  "div.fw-semibold.d-flex.align-items-center",        // previous site
  "[class*='view']",                                  // generic fallback
];

// ==========================================

async function extractViewsFromText(text) {
  if (!text) return null;

  // Match numbers like:
  // 5,980 views
  // 17.849 Views
  // 12345 Views
  const match = text.match(/([\d.,]+)\s*views/i);
  if (!match) return null;

  // Remove commas and dots
  return match[1].replace(/[.,]/g, "");
}

async function scrapeViews(page, url) {
  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 90000
    });

    // Wait a bit for dynamic content
    await page.waitForTimeout(3000);

    const views = await page.evaluate((selectors) => {
      function extractNumber(text) {
        const match = text.match(/([\d.,]+)\s*views/i);
        if (!match) return null;
        return match[1].replace(/[.,]/g, "");
      }

      for (let selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.innerText || el.textContent || "";
          const number = extractNumber(text);
          if (number) return number;
        }
      }

      return null;
    }, VIEW_SELECTORS);

    return views || "NOT FOUND";
  } catch (err) {
    console.log("Error:", url);
    return "NOT FOUND";
  }
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  const results = [];

  for (const item of VIDEO_ITEMS) {
    if (!Array.isArray(item.links)) continue;

    for (const link of item.links) {
      console.log(`Fetching views → ${item.code}`);

      const views = await scrapeViews(page, link);

      results.push({
        code: item.code,
        url: link,
        views: views
      });
    }
  }

  await browser.close();

  await axios.post(GOOGLE_SCRIPT_URL, {
    batch: results
  });

  console.log("Views saved to Google Sheets");
}

run();
