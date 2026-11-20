const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    // Open album
    await page.click('.happy-cover-bottom-nav .btn-next');
    await new Promise(r => setTimeout(r, 600));

    // Step through to last photo
    for (let i = 0; i < 15; i++) {
      const btn = await page.$('.happy-photo-bottom-nav .btn-next:not(.is-disabled)');
      if (!btn) break;
      await btn.click();
      await new Promise(r => setTimeout(r, 350));
    }
    await new Promise(r => setTimeout(r, 600));

    // Full screen capture
    await page.screenshot({ path: 'scratch/happy_gallery_full.png' });

    // Crop of top-right cluster
    const cluster = await page.$('.top-right-controls-cluster');
    if (cluster) {
      await cluster.screenshot({ path: 'scratch/top_right_cluster.png' });
    }

    // Crop of Next Page button
    const nextBtn = await page.$('.corner-nav-next');
    if (nextBtn) {
      await nextBtn.screenshot({ path: 'scratch/next_page_btn.png' });
    }

    console.log('Screenshots saved successfully');
  } finally {
    await browser.close();
  }
})();
