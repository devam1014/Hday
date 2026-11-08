import puppeteer from 'puppeteer-core';
import fs from 'fs';
import os from 'os';
import path from 'path';

async function inspectSite() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-inspect-'));
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    userDataDir: tmpDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => errors.push(err.toString()));

  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Check initial state
  const initialElements = await page.evaluate(() => {
    return {
      entranceOverlay: !!document.querySelector('.entrance-overlay-root'),
      entranceBtn: !!document.querySelector('.entrance-open-button'),
      entranceBtnText: document.querySelector('.entrance-open-button')?.innerText,
      coverPage: !!document.querySelector('.cover-page-root'),
      countdown: !!document.querySelector('.wall-countdown-positioner'),
      mainPage: !!document.querySelector('.main-page-root')
    };
  });

  console.log('Initial Elements:', JSON.stringify(initialElements, null, 2));
  await page.screenshot({ path: 'scratch/inspect-initial.png' });

  // Click the entrance button if present
  if (initialElements.entranceBtn) {
    console.log('Clicking entrance button...');
    await page.click('.entrance-open-button');
    await new Promise(r => setTimeout(r, 1000));

    const afterClickElements = await page.evaluate(() => {
      return {
        entranceOverlay: !!document.querySelector('.entrance-overlay-root'),
        coverPage: !!document.querySelector('.cover-page-root'),
        countdown: !!document.querySelector('.wall-countdown-positioner'),
        countdownText: document.querySelector('.wall-countdown-track')?.innerText,
        mainPage: !!document.querySelector('.main-page-root')
      };
    });

    console.log('After Click Elements:', JSON.stringify(afterClickElements, null, 2));
    await page.screenshot({ path: 'scratch/inspect-after-click.png' });
  }

  console.log('Console messages:', JSON.stringify(consoleMessages, null, 2));
  console.log('Errors:', JSON.stringify(errors, null, 2));

  await browser.close();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}
}

inspectSite().catch(console.error);
