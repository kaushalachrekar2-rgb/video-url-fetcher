const puppeteer = require("puppeteer-core");
const axios = require("axios");

// ================= CONFIG =================

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxMdXP20ErUjXyLj_fBNODHOu_2fp00csAKZBcOeeqD8-QADVp5QU_CUxyA2AJXVHodtQ/exec";

const VIDEO_ITEMS = [
  {
    code: "START-425",
    links: [
      "https://jav.guru/800169/start-425-minamo-were-a-couple-right-after-three-years-without-sex-officer-minamo-pretends-to-be-married-with-her-male-subordinate-leading-to-an-unexpected-real-encounter-a-week-long/"
    ]
  }
];

// ==========================================

async function scrapeViews(page, url) {
  let viewValue = null;

  // 👀 Listen to API responses
  page.on("response", async response => {
    try {
      const resUrl = response.url();

      // 🔍 Heuristic: stats / view APIs
      if (
        resUrl.includes("view") ||
        resUrl.includes("stat") ||
        resUrl.includes("api") ||
        resUrl.includes("ajax")
      ) {
        const text = await response.text();

        // Try to extract a number from JSON or text
        const match = text.match(/"views?"\s*:\s*"?([\d,]+)/i);

        if (match && !viewValue) {
          viewValue = match[1].replace(/,/g, "");
        }
      }
    } catch {}
  });

  try {
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 90000
    });

    // Wait extra for API calls
    await page.waitForTimeout(5000);
  } catch {}

  // Fallback: DOM (if API failed)
  if (!viewValue) {
    try {
      viewValue = await page.evaluate(() => {
        const el = document.querySelector("span.javstats");
        if (!el) return null;

        return el.innerText
          .toLowerCase()
          .replace("views", "")
          .replace(/,/g, "")
          .trim();
      });
    } catch {}
  }

  return viewValue || "NOT FOUND";
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
