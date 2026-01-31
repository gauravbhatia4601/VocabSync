/**
 * Daily Vocabulary Wallpaper Backend
 * ---------------------------------
 * File: server.ts
 * Purpose: Express server that serves the daily image and schedules updates.
 */

import express from 'express';
import cron from 'node-cron';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { getRandomWords } from '../services/words.js';
import { fetchWordDetails } from '../services/dictionary.js';
import { WordEntry } from '../types.js';

// Fix: Define __dirname for ES modules compatibility since it is not globally available
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DAILY_IMAGE_PATH = path.join(PUBLIC_DIR, 'daily.png');

// Ensure directory exists
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

/**
 * Generate HTML template for the wallpaper
 * Using inline styles to ensure reliable rendering in Puppeteer
 */
function generateWallpaperHTML(words: WordEntry[]): string {
  // Escape HTML entities to prevent XSS and rendering issues
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const wordsHTML = words.map((entry) => {
    return `
    <div style="margin-bottom: 46px; padding: 0 40px">
      <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 12px;">
        <span style="font-size: 72px; font-weight: 700; letter-spacing: -0.02em; color: #111827; font-family: 'Playfair Display', 'Georgia', 'Times New Roman', serif;">${escapeHtml(entry.word)}</span>
        <span style="color: #6B7280; font-size: 36px; font-style: italic; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;">(${escapeHtml(entry.partOfSpeech)})</span>
      </div>
      <p style="color: #111827; font-size: 36px; line-height: 1.5; font-weight: 400; margin-bottom: 16px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;">
        ${escapeHtml(entry.definition)}
      </p>
      <p style="color: #4B5563; font-size: 32px; font-style: italic; font-weight: 400; line-height: 1.6; padding-left: 4px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;">
        "${escapeHtml(entry.example)}"
      </p>
    </div>
  `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
      margin: 0;
      padding: 0;
      width: 1290px;
      height: 2796px;
      overflow: hidden;
      background-color: #efebe0;
    }
  </style>
</head>
<body>
  <div 
    id="wallpaper-target"
    style="
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background-color: #efebe0;
      padding: 64px 48px;
      position: relative;
      overflow: hidden;
    "
  >
    <!-- Notch / Dynamic Island Safe Area -->
    <div style="height: 120px;"></div>

    <!-- Word List - Centered vertically in the available space -->
    <div style="
      flex: 1 1 0%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0px;
      padding-top: 0px;
      padding-bottom: 0px;
    ">
      ${wordsHTML}
    </div>

    <!-- Safe Area Bottom -->
    <div style="height: 80px;"></div>
  </div>
</body>
</html>`;
}

/**
 * Image Generation Logic
 * Uses a headless browser to render the HTML template into a high-res image
 */
async function generateWallpaper() {
  console.log('--- Triggering Daily Generation ---');
  
  try {
    // Get 3 random words
    const selected = getRandomWords(3);
    console.log(`Selected words: ${selected.join(', ')}`);
    
    // Fetch word details
    const detailsPromises = selected.map(fetchWordDetails);
    const results = await Promise.all(detailsPromises);
    
    // Filter out failed fetches
    const validWords = results.filter((w): w is WordEntry => w !== null);
    
    if (validWords.length === 0) {
      console.error('No valid words fetched');
      return;
    }
    
    console.log(`Fetched ${validWords.length} word(s)`);
    
    // Launch browser
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set viewport to 9:16 aspect ratio (1290x2796)
    await page.setViewport({ width: 1290, height: 2796 });

    // Generate HTML with word data
    const content = generateWallpaperHTML(validWords);
    
    await page.setContent(content, { waitUntil: 'networkidle0' });
    
    // Wait for fonts to load
    await page.evaluateHandle(() => document.fonts.ready);
    
    // Wait for the wallpaper element to be visible
    await page.waitForSelector('#wallpaper-target', { visible: true });
    
    // Additional wait to ensure all styles and fonts are fully rendered
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot of the wallpaper element specifically
    const wallpaperElement = await page.$('#wallpaper-target');
    if (!wallpaperElement) {
      throw new Error('Wallpaper element not found');
    }
    
    await wallpaperElement.screenshot({ 
      path: DAILY_IMAGE_PATH, 
      type: 'png',
      omitBackground: false
    });
    
    await browser.close();
    console.log(`Success: Generated ${DAILY_IMAGE_PATH}`);
  } catch (err) {
    console.error('Error generating wallpaper:', err);
  }
}

// Endpoint for iOS Shortcut: Always points to the latest image
// This must be defined BEFORE any catch-all routes
app.get('/daily.png', (req: express.Request, res: express.Response) => {
  // Check if file exists
  if (!fs.existsSync(DAILY_IMAGE_PATH)) {
    res.status(404).send('Image not found. Generating...');
    generateWallpaper();
    return;
  }
  
  // Set proper content-type header for PNG image
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Send the file using absolute path
  res.sendFile(path.resolve(DAILY_IMAGE_PATH));
});

// Serve the static daily image from public directory
app.use('/public', express.static(PUBLIC_DIR) as any);

// Schedule: Run every day at Midnight GMT+4 (Asia/Dubai)
cron.schedule('0 0 * * *', () => {
  console.log(`[${new Date().toISOString()}] Cron job triggered - generating daily wallpaper`);
  generateWallpaper();
}, {
  timezone: 'Asia/Dubai'
});

app.listen(PORT, () => {
  console.log(`VocabSync Server running at http://0.0.0.0:${PORT}`);
  console.log(`Daily image endpoint: http://0.0.0.0:${PORT}/daily.png`);
  console.log(`Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  console.log(`Current time: ${new Date().toISOString()}`);
  
  // Run once on startup if image doesn't exist
  if (!fs.existsSync(DAILY_IMAGE_PATH)) {
    console.log('No daily.png found, generating initial image...');
    generateWallpaper();
  } else {
    console.log(`Daily image exists at: ${DAILY_IMAGE_PATH}`);
  }
});