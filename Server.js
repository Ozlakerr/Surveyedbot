const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.post('/api/complete-survey', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Survey URL is required' });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    await autoFillForm(page);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
      page.click('input[type="submit"], button[type="submit"]').catch(() => page.keyboard.press('Enter'))
    ]);

    const finalContent = await page.content();
    const successMessage = finalContent.match(/thank you|success|completed|submitted/i)?.[0] || 'Survey completed (no confirmation message detected)';

    await browser.close();
    res.json({ success: true, result: successMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function autoFillForm(page) {
  const textInputs = await page.$$('input[type="text"], input[type="email"], input[type="tel"], input:not([type])');
  for (const input of textInputs) {
    const type = await input.evaluate(el => el.type);
    if (type === 'email') await input.type('test@example.com');
    else if (type === 'tel') await input.type('1234567890');
    else await input.type('Sample Answer');
  }

  const radios = await page.$$('input[type="radio"]');
  const radioGroups = {};
  for (const radio of radios) {
    const name = await radio.evaluate(el => el.name);
    if (!radioGroups[name]) radioGroups[name] = radio;
  }
  for (const radio of Object.values(radioGroups)) await radio.click().catch(() => {});

  const checkboxes = await page.$$('input[type="checkbox"]');
  for (const cb of checkboxes) await cb.click().catch(() => {});

  const selects = await page.$$('select');
  for (const select of selects) {
    const options = await select.$$('option:not([value=""])');
    if (options.length) {
      const value = await options[0].evaluate(opt => opt.value);
      await select.select(value);
    }
  }

  const textareas = await page.$$('textarea');
  for (const ta of textareas) await ta.type('This is a sample response.');

  await page.waitForTimeout(1000);
}

app.listen(PORT, () => console.log(`Surveyedbot running at http://localhost:${PORT}`));