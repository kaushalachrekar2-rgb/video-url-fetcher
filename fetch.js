const puppeteer = require('puppeteer');
const axios = require('axios');

// ====== CONFIGURATION ======

// PASTE YOUR GOOGLE SCRIPT URL HERE
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzd59CYEHds6pGPDB0n5Uiba49Ef-Tbqm19namzGLSA86XLej1TxBI_245RdNaRP4dv/exec";

// ADD YOUR VIDEO PAGE LINKS HERE
const VIDEO_PAGES = [
    "https://www.eporner.com/video-XjNQT08qPhB/schoolgirl-gangbang/"
];

// ===========================

async function sendToGoogleSheet(pageUrl, videoUrl) {
    try {
        await axios.post(GOOGLE_SCRIPT_URL, {
            pageUrl: pageUrl,
            videoUrl: videoUrl
        });
        console.log("Saved:", videoUrl);
    } catch (err) {
        console.log("Error:", err.message);
    }
}

async function processPage(pageUrl) {

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);

    page.on('request', request => {

        const url = request.url();

        if (
            url.includes(".m3u8") ||
            url.includes(".mp4") ||
            url.includes(".ts")
        ) {
            console.log("Found:", url);
            sendToGoogleSheet(pageUrl, url);
        }

        request.continue();
    });

    try {
        await page.goto(pageUrl, { waitUntil: 'networkidle2' });
    } catch (e) {
        console.log("Error loading:", pageUrl);
    }

    await browser.close();
}

async function run() {
    for (let link of VIDEO_PAGES) {
        await processPage(link);
    }
}

run();
