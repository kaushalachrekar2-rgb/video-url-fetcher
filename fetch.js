const puppeteer = require("puppeteer-core");
const axios = require("axios");

// ========== CONFIG ==========

// Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxMdXP20ErUjXyLj_fBNODHOu_2fp00csAKZBcOeeqD8-QADVp5QU_CUxyA2AJXVHodtQ/exec";

// 👇 ADD YOUR CODES + LINKS HERE
const VIDEO_ITEMS = [
  {
    code: "START-425",
    url: "https://jav.guru/800169/start-425-minamo-were-a-couple-right-after-three-years-without-sex-officer-minamo-pretends-to-be-married-with-her-male-subordinate-leading-to-an-unexpected-real-encounter-a-week-long/"
  },
  {
    code: "START-505",
    url: "https://jav.guru/853543/start-505-the-expressionless-female-kendo-master-unimaginably-sweet-to-her-disciples-shell-make-you-cum-endlessly-with-her-cock-flattering-gaze-honjou-suzu/"
  }
];

// ============================

// 🔧 CHANGE THIS SELECTOR BASED ON WEBSITE
const VIEW_SELECTOR = ".views, .view-count, [class*='view']";

async function scrapeViews(page, url) {
  try {
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 90000
    });

    await page.waitForTimeout(4000);

    const viewsText = await page.evaluate(selector => {
      const el = document.querySelector(selector);
      return el ? el.innerText : null;
    }, VIEW_SELECTOR);

    return viewsText || "NOT FOUND";
  } catch (err) {
    return "ERROR";
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
    console.log("Fetching views for:", item.code);

    const views = await scrapeViews(page, item.url);

    results.push({
      code: item.code,
      url: item.url,
      views: views
    });
  }

  await browser.close();

  // Send batch to Google Sheets
  await axios.post(GOOGLE_SCRIPT_URL, {
    batch: results
  });

  console.log("Views sent to Google Sheets");
}

run();
