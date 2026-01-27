const puppeteer = require("puppeteer");
const axios = require("axios");

// ================= CONFIG =================

const GOOGLE_SCRIPT_URL = "PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE";

const VIDEO_PAGES = [
  "LINK_1",
  "LINK_2"
];

// ==========================================

async function sendBatchToGoogleSheet(results) {
  try {
    await axios.post(GOOGLE_SCRIPT_URL, {
      batch: results
    });
    console.log("Batch sent to Google Sheets");
  } catch (err) {
    console.log("Sheet error:", err.message);
  }
}

async function processPage(browser, pageUrl, results) {
  const page = await browser.newPage();
  const foundUrls = new Set();

  await page.setRequestInterception(true);

  page.on("request", req => {
    const url = req.url();

    if (
      url.includes(".m3u8") ||
      url.includes(".mp4") ||
      url.includes(".ts")
    ) {
      foundUrls.add(url);
    }

    req.continue();
  });

  try {
    await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 90000 });
    await page.waitForTimeout(5000); // extra wait for late requests
  } catch (e) {
    console.log("Page load error:", pageUrl);
  }

  for (let videoUrl of foundUrls) {
    results.push({
      pageUrl,
      videoUrl
    });
  }

  await page.close();
}

async function run() {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const results = [];

  for (let link of VIDEO_PAGES) {
    console.log("Processing:", link);
    await processPage(browser, link, results);
  }

  await browser.close();

  if (results.length > 0) {
    await sendBatchToGoogleSheet(results);
  } else {
    console.log("No video URLs found");
  }
}

run();