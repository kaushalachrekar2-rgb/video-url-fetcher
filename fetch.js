const puppeteer = require("puppeteer-core");
const axios = require("axios");

// ================= CONFIG =================

// Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxMdXP20ErUjXyLj_fBNODHOu_2fp00csAKZBcOeeqD8-QADVp5QU_CUxyA2AJXVHodtQ/exec";

// Codes with multiple links (links MUST be arrays)
const VIDEO_ITEMS = [
  {
    code: "START-425",
    links: [
      "https://jav.guru/800169/start-425-minamo-were-a-couple-right-after-three-years-without-sex-officer-minamo-pretends-to-be-married-with-her-male-subordinate-leading-to-an-unexpected-real-encounter-a-week-long/"
    ]
  }
];

// Exact selector from website
const VIEW_SELECTOR = "span.javstats";

// ==========================================

async function scrapeViews(page, url) {
  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 90000
    });

    // ✅ WAIT EXPLICITLY FOR VIEWS ELEMENT
    await page.waitForSelector(VIEW_SELECTOR, {
      timeout: 15000
    });

    const views = await page.evaluate(selector => {
      const el = document.querySelector(selector);
      if (!el) return null;

      // "195,845 views"
      let text = el.innerText.toLowerCase();

      text = text
        .replace("views", "")
        .replace(/,/g, "")
        .trim();

      return text;
    }, VIEW_SELECTOR);

    return views || "NOT FOUND";
  } catch (err) {
    console.log("View fetch failed:", url);
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

  console.log("Views successfully saved to Google Sheets");
}

run();
