const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://example.com', { waitUntil: 'networkidle2' });
    const title = await page.title();
    console.log('✅ Puppeteer works! Page title:', title);
    await browser.close();
  } catch (err) {
    console.error('❌ Puppeteer failed:', err.message);
  }
})();