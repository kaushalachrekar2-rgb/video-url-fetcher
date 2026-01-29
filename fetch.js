const puppeteer = require("puppeteer-core");
const fs = require("fs");

// ===================== CONFIG =====================

// 👉 PUT YOUR VIDEO PAGE LINKS HERE
const VIDEO_PAGES = [
 "https://javtrailers.com/video/sone00846"
];

// Output files
const JSON_FILE = "results.json";
const TXT_FILE = "results.txt";

// ==================================================

async function processPage(browser, pageUrl, resultsSet) {
  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on("request", req => {
    const url = req.url();

    // Capture only useful video streams
    if (
      url.includes(".m3u8") ||
      url.includes(".mp4")
    ) {
      resultsSet.add(url);
    }

    req.continue();
  });

  try {
    await page.goto(pageUrl, {
      waitUntil: "networkidle2",
      timeout: 90000
    });

    // Extra wait for late network requests
    await page.waitForTimeout(6000);
  } catch (err) {
    console.log("Failed to load:", pageUrl);
  }

  await page.close();
}

async function run() {
  console.log("Starting fetch job...");

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const resultsSet = new Set();

  for (const link of VIDEO_PAGES) {
    console.log("Processing:", link);
    await processPage(browser, link, resultsSet);
  }

  await browser.close();

  const results = Array.from(resultsSet);

  // Save JSON
  fs.writeFileSync(
    JSON_FILE,
    JSON.stringify(results, null, 2)
  );

  // Save TXT
  fs.writeFileSync(
    TXT_FILE,
    results.join("\n")
  );

  console.log(`Saved ${results.length} video URLs`);
}

run();