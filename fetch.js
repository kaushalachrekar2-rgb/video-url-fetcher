const puppeteer = require("puppeteer");
const fs = require("fs");

// ============ CONFIGURATION ============

// PUT YOUR VIDEO PAGE LINKS HERE
const VIDEO_PAGES = [
  "https://xhamster44.desi/videos/dad-catches-petite-teen-getting-pounded-by-her-step-brother-kenzie-reeves-xhgx3VV?utm_source=ext_shared&utm_medium=referral&utm_campaign=link",
  "https://3xchina.net/ama-549/"
];

// Output files
const JSON_FILE = "results.json";
const TXT_FILE = "results.txt";

// ======================================

async function processPage(browser, pageUrl, resultsSet) {
  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on("request", req => {
    const url = req.url();

    if (
      url.includes(".m3u8") ||
      url.includes(".mp4") ||
      url.includes(".ts")
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

    // Extra wait to catch late network calls
    await page.waitForTimeout(6000);
  } catch (e) {
    console.log("Failed to load:", pageUrl);
  }

  await page.close();
}

async function run() {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const resultsSet = new Set();

  for (const link of VIDEO_PAGES) {
    console.log("Processing:", link);
    await processPage(browser, link, resultsSet);
  }

  await browser.close();

  const resultsArray = Array.from(resultsSet);

  // Save JSON
  fs.writeFileSync(
    JSON_FILE,
    JSON.stringify(resultsArray, null, 2)
  );

  // Save TXT
  fs.writeFileSync(
    TXT_FILE,
    resultsArray.join("\n")
  );

  console.log(`Saved ${resultsArray.length} URLs`);
}

run();