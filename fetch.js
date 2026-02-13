const puppeteer = require("puppeteer-core");
const axios = require("axios");

// ================= CONFIG =================

// 🔗 Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzOtTHkf8KqkyW6qzl0Jv49r_w6WyBcfp9xKWksPH-C3phCuv_a8BpRtFHwzPUjT-WAlA/exec";

// 👇 Codes with multiple links (links MUST be arrays)
const VIDEO_ITEMS = [
  {
    code: "START-464",
    links: [
      "https://javtiful.com/video/98199/start-464",
      "https://javtiful.com/video/98088/start-464"
    ]
  }
];

// Selector for NEW website format
const VIEW_SELECTOR = "div.fw-semibold.d-flex.align-items-center";

// ==========================================

async function scrapeViews(page, url) {
  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 90000
    });

    // Explicitly wait for the view container
    await page.waitForSelector(VIEW_SELECTOR, {
      timeout: 15000
    });

    const views = await page.evaluate(selector => {
      const el = document.querySelector(selector);
      if (!el) return null;

      // Example text: "17.849 Views"
      const text = el.textContent || "";

      // Extract number (supports 17.849, 195,845, 12345)
      const match = text.match(/([\d.,]+)\s*views/i);
      if (!match) return null;

      // Normalize: remove dots & commas
      return match[1].replace(/[.,]/g, "");
    }, VIEW_SELECTOR);

    return views || "NOT FOUND";
  } catch (err) {
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

  // Send batch to Google Sheets
  await axios.post(GOOGLE_SCRIPT_URL, {
    batch: results
  });

  console.log("Views successfully saved to Google Sheets");
}

run();
