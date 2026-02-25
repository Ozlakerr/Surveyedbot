require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Stagehand } = require('@browserbase/stagehand');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.post('/api/complete-survey', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Survey URL is required' });

  try {
    // Initialize Stagehand with your API key
    const stagehand = new Stagehand({
      apiKey: process.env.BROWSERBASE_API_KEY,
      headless: true,
    });

    await stagehand.init();
    await stagehand.page.goto(url, { waitUntil: 'networkidle2' });

    // Let AI fill the form
    await stagehand.act({ action: "fill out this survey with realistic, varied answers" });

    // Try to submit
    await stagehand.act({ action: "submit the form" });

    // Wait for navigation or result
    await stagehand.page.waitForTimeout(3000);

    // Get final content
    const finalContent = await stagehand.page.content();
    const successMessage = finalContent.match(/thank you|success|completed|submitted/i)?.[0] || 'Survey completed (AI)';

    await stagehand.close();

    res.json({ success: true, result: successMessage });
  } catch (error) {
    console.error('AI automation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Surveyedbot (AI version) running on port ${PORT}`));