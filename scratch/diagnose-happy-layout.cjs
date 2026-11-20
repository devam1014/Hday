const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_diag_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [`--user-data-dir=${profileDir}`, '--no-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    const viewports = [
      { width: 1440, height: 900, name: '1440x900' },
      { width: 1920, height: 1080, name: '1920x1080' },
      { width: 1280, height: 800, name: '1280x800' },
      { width: 1024, height: 768, name: '1024x768' },
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await new Promise(r => setTimeout(r, 1000));

      // Inspect Top-Right Buttons
      const topButtons = await page.evaluate(() => {
        const seeView = document.querySelector('.see-this-view-container') || document.querySelector('.see-this-view-btn');
        const clickSee = document.querySelector('.dev-click-see-btn');
        const testHelper = document.querySelector('.dev-panel-toggle-btn:not(.dev-click-see-btn)');

        const getRect = el => el ? el.getBoundingClientRect().toJSON() : null;

        return {
          seeView: getRect(seeView),
          clickSee: getRect(clickSee),
          testHelper: getRect(testHelper),
        };
      });

      console.log(`\n=== Viewport: ${vp.name} ===`);
      console.log('Top Buttons Rects:');
      console.log('  See This View:', topButtons.seeView);
      console.log('  Click & See:  ', topButtons.clickSee);
      console.log('  Test Helper:  ', topButtons.testHelper);

      // Check overlap between See This View and Click & See
      if (topButtons.seeView && topButtons.clickSee) {
        const sv = topButtons.seeView;
        const cs = topButtons.clickSee;
        const overlapX = !(sv.right <= cs.left || sv.left >= cs.right);
        const overlapY = !(sv.bottom <= cs.top || sv.top >= cs.bottom);
        console.log(`  OVERLAP (SeeView & ClickSee): ${overlapX && overlapY ? 'YES, THEY OVERLAP!' : 'No overlap'}`);
        console.log(`  Gap X (cs.left - sv.right): ${cs.left - sv.right}px`);
      }

      // Navigate to last photo in Happy Gallery to reveal "Next Page" button
      // First click "Next" on cover
      const coverNextBtn = await page.$('.happy-cover-bottom-nav .btn-next');
      if (coverNextBtn) {
        await coverNextBtn.click();
        await new Promise(r => setTimeout(r, 600));
      }

      // Click "Next" until last photo
      let steps = 0;
      while (steps < 20) {
        const nextPhotoBtn = await page.$('.happy-photo-bottom-nav .btn-next:not(:disabled):not(.is-disabled)');
        if (!nextPhotoBtn) break;
        const isDisabled = await page.evaluate(el => el.disabled || el.classList.contains('is-disabled'), nextPhotoBtn);
        if (isDisabled) break;
        await nextPhotoBtn.click();
        await new Promise(r => setTimeout(r, 300));
        steps++;
      }

      await new Promise(r => setTimeout(r, 500));

      const nextNavInfo = await page.evaluate((vpW, vpH) => {
        const nextBtn = document.querySelector('.corner-nav-next');
        const musicBar = document.querySelector('.gallery-music-wrapper');
        const card = document.querySelector('.happy-photo-card');
        const photoNav = document.querySelector('.happy-photo-bottom-nav');

        const getRect = el => el ? el.getBoundingClientRect().toJSON() : null;
        const nRect = getRect(nextBtn);
        const mRect = getRect(musicBar);
        const cRect = getRect(card);
        const pRect = getRect(photoNav);

        let isCutoff = false;
        let cutOffDetails = [];
        if (nRect) {
          if (nRect.right > vpW) { isCutoff = true; cutOffDetails.push(`right exceeds viewport: ${nRect.right} > ${vpW}`); }
          if (nRect.bottom > vpH) { isCutoff = true; cutOffDetails.push(`bottom exceeds viewport: ${nRect.bottom} > ${vpH}`); }
          if (nRect.left < 0) { isCutoff = true; cutOffDetails.push(`left < 0: ${nRect.left}`); }
          if (nRect.top < 0) { isCutoff = true; cutOffDetails.push(`top < 0: ${nRect.top}`); }
        }

        return {
          nextBtn: nRect,
          musicBar: mRect,
          photoNav: pRect,
          card: cRect,
          isCutoff,
          cutOffDetails,
          distFromRightEdge: nRect ? vpW - nRect.right : null,
          distFromBottomEdge: nRect ? vpH - nRect.bottom : null,
        };
      }, vp.width, vp.height);

      console.log('Next Page Button:');
      console.log('  Rect:', nextNavInfo.nextBtn);
      console.log('  Dist from right edge:', nextNavInfo.distFromRightEdge);
      console.log('  Dist from bottom edge:', nextNavInfo.distFromBottomEdge);
      console.log('  Is Cutoff:', nextNavInfo.isCutoff, nextNavInfo.cutOffDetails);
      if (nextNavInfo.musicBar && nextNavInfo.nextBtn) {
        console.log(`  Music bar top: ${nextNavInfo.musicBar.top}, NextBtn bottom: ${nextNavInfo.nextBtn.bottom}`);
      }
      if (nextNavInfo.photoNav && nextNavInfo.nextBtn) {
        console.log(`  Photo nav Y: [${nextNavInfo.photoNav.top}, ${nextNavInfo.photoNav.bottom}], NextBtn Y: [${nextNavInfo.nextBtn.top}, ${nextNavInfo.nextBtn.bottom}]`);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
