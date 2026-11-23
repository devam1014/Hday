const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const userDataDir = path.join(process.cwd(), 'scratch', 'temp_puppeteer_inspect_characters');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    userDataDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5173/?stage=qna&step=final-message', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  const info100 = await page.evaluate(() => {
    const bgImg = document.querySelector('.qna-background-img');
    const stage = document.querySelector('.qna-final-surprise-stage');
    const leftCol = document.querySelector('.qna-final-left-column');
    const rightCol = document.querySelector('.qna-final-right-column');
    const card1 = document.querySelector('.qna-final-image-card');
    const card2 = document.querySelector('.qna-final-video-card');
    const layout = document.querySelector('.qna-final-content-layout');

    const getR = el => el ? {
      left: Math.round(el.getBoundingClientRect().left),
      right: Math.round(el.getBoundingClientRect().right),
      top: Math.round(el.getBoundingClientRect().top),
      bottom: Math.round(el.getBoundingClientRect().bottom),
      width: Math.round(el.getBoundingClientRect().width),
      height: Math.round(el.getBoundingClientRect().height)
    } : null;

    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      bg: getR(bgImg),
      stage: getR(stage),
      layout: getR(layout),
      leftCol: getR(leftCol),
      rightCol: getR(rightCol),
      card1: getR(card1),
      card2: getR(card2),
      gap: rightCol && leftCol ? Math.round(rightCol.getBoundingClientRect().left - leftCol.getBoundingClientRect().right) : null
    };
  });

  console.log('--- 100% ZOOM (1440x900) ---');
  console.log('Layout:', JSON.stringify(info100, null, 2));

  // At 80% zoom (1800x1125 equivalent)
  await page.setViewport({ width: 1800, height: 1125 });
  await new Promise(r => setTimeout(r, 400));
  const info80 = await page.evaluate(() => {
    const bgImg = document.querySelector('.qna-background-img');
    const stage = document.querySelector('.qna-final-surprise-stage');
    const leftCol = document.querySelector('.qna-final-left-column');
    const rightCol = document.querySelector('.qna-final-right-column');
    const card1 = document.querySelector('.qna-final-image-card');
    const card2 = document.querySelector('.qna-final-video-card');
    const layout = document.querySelector('.qna-final-content-layout');

    const getR = el => el ? {
      left: Math.round(el.getBoundingClientRect().left),
      right: Math.round(el.getBoundingClientRect().right),
      top: Math.round(el.getBoundingClientRect().top),
      bottom: Math.round(el.getBoundingClientRect().bottom),
      width: Math.round(el.getBoundingClientRect().width),
      height: Math.round(el.getBoundingClientRect().height)
    } : null;

    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      bg: getR(bgImg),
      stage: getR(stage),
      layout: getR(layout),
      leftCol: getR(leftCol),
      rightCol: getR(rightCol),
      card1: getR(card1),
      card2: getR(card2),
      gap: rightCol && leftCol ? Math.round(rightCol.getBoundingClientRect().left - leftCol.getBoundingClientRect().right) : null
    };
  });

  console.log('--- 80% ZOOM (1800x1125) ---');
  console.log('Layout:', JSON.stringify(info80, null, 2));

  await browser.close();
})();
