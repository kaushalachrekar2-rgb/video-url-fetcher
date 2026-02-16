const puppeteer = require("puppeteer-core");
const axios = require("axios");

// ================= CONFIG =================

const GOOGLE_SCRIPT_URL = " https://script.google.com/macros/s/AKfycbzOtTHkf8KqkyW6qzl0Jv49r_w6WyBcfp9xKWksPH-C3phCuv_a8BpRtFHwzPUjT-WAlA/exec";

const VIDEO_ITEMS = [
  {
    code: "START-464",
    links: [
      "https://jav.guru/820383/start-464-i-fell-in-love-with-a-high-achieving-young-lady-who-can-only-love-a-gross-fat-guy-and-i-immersed-myself-in-the-sexual-development-of-an-innocent-woman-in-a-messy-room-honjou-suzu/"
    ]
  }
];
// Selector for this website
const VIEW_SELECTOR = "span.javstats";

// ==========================================

async function scrapeViews(page, url) {
  try {
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 90000
    });

    // 🔴 IMPORTANT: wait for the actual element
    await page.waitForSelector(VIEW_SELECTOR, {
      timeout: 15000
    });

    const views = await page.evaluate(selector => {
      const el = document.querySelector(selector);
      if (!el) return null;

      const text = el.innerText || el.textContent || "";

      const match = text.match(/([\d,]+)\s*views/i);
      if (!match) return null;

      return match[1].replace(/,/g, "");
    }, VIEW_SELECTOR);

    return views || "NOT FOUND";
  } catch (err) {
    console.log("Failed:", url);
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
