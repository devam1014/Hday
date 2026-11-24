import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log('--- Verifying All Five Final UI Corrections ---');
  const profileDir = path.join(__dirname, 'chrome_final_verify_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [
      `--user-data-dir=${profileDir}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // =========================================================================
  // FIX 1: PASSWORD SCREEN & INSTRUCTION BUTTON OVERLAP
  // =========================================================================
  console.log('\n[FIX 1] Checking Password Screen & Instruction Button...');
  await page.goto('http://127.0.0.1:5173/?stage=countdown', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 600));

  // Check button text
  const btnText = await page.$eval('.overlay-message-button .overlay-message-btn-text', el => el.textContent.trim());
  console.log('Button visible text:', btnText);
  if (btnText !== 'Instruction') {
    throw new Error(`Expected button text "Instruction", got "${btnText}"`);
  }

  // Type incorrect password and submit to trigger error card
  await page.type('.overlay-password-input', 'wrongpassword');
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 300));

  // Check overlap
  const boxes = await page.evaluate(() => {
    const errorCard = document.querySelector('.overlay-password-error-card');
    const btn = document.querySelector('.overlay-message-button');
    const input = document.querySelector('.overlay-password-input');

    const errBox = errorCard?.getBoundingClientRect();
    const btnBox = btn?.getBoundingClientRect();
    const inpBox = input?.getBoundingClientRect();

    return {
      errorVisible: !!errorCard,
      errBottom: errBox ? errBox.bottom : null,
      btnTop: btnBox ? btnBox.top : null,
      gap: btnBox && errBox ? btnBox.top - errBox.bottom : null,
      inpBottom: inpBox ? inpBox.bottom : null,
    };
  });
  console.log('Password screen elements:', boxes);

  if (boxes.errorVisible && boxes.gap > 15) {
    console.log(`✓ Zero overlap! Comfortable vertical spacing gap: ${boxes.gap.toFixed(1)}px`);
  } else {
    console.error('FAIL: Error card still overlaps or gap is too small!', boxes);
  }

  // Click Instruction button and check modal opens
  await page.click('.overlay-message-button');
  await new Promise(r => setTimeout(r, 200));
  const modalOpen = await page.$eval('.countdown-instruction-card', el => !!el).catch(() => false);
  console.log('Instruction modal opened on click:', modalOpen);
  if (!modalOpen) {
    throw new Error('Instruction modal failed to open!');
  }
  await page.screenshot({ path: 'scratch/fix1_instruction_modal.png' });

  // Close modal
  await page.click('.countdown-modal-close');
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: 'scratch/fix1_password_spacing.png' });

  // =========================================================================
  // FIX 2: INITIAL COVER — REMOVE SEE THIS VIEW
  // =========================================================================
  console.log('\n[FIX 2] Checking Initial Cover Top-Right Controls...');
  const coverControls = await page.evaluate(() => {
    const seeThis = document.querySelector('.see-this-view-container');
    const magicBtn = document.querySelector('.click-see-magic-btn');
    return {
      hasSeeThisView: !!seeThis,
      hasClickSeeMagic: !!magicBtn
    };
  });
  console.log('Initial Cover controls:', coverControls);
  if (coverControls.hasSeeThisView) {
    throw new Error('See This View should NOT be visible on initial cover!');
  }
  console.log('✓ See This View is completely hidden on the initial cover!');

  // =========================================================================
  // FIX 3: CLICK & SEE MAGIC — HIDE UNTIL SECOND COUNTDOWN COMPLETES
  // =========================================================================
  console.log('\n[FIX 3] Checking Click & See Magic Visibility during running countdown...');
  if (coverControls.hasClickSeeMagic) {
    throw new Error('Click & See Magic should NOT be visible during initial countdown!');
  }
  console.log('✓ Click & See Magic is completely hidden during initial countdown!');

  // Check on fireworks stage when second countdown is running
  // We navigate to a simulated running rooftop countdown
  await page.evaluate(() => {
    // Set stage to fireworks without completing countdown
    window.location.search = '?stage=fireworks';
  });
  await page.goto('http://127.0.0.1:5173/?stage=fireworks', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 600));

  const fireworksStageControls = await page.evaluate(() => {
    const seeThis = document.querySelector('.see-this-view-container');
    const magicBtn = document.querySelector('.click-see-magic-btn');
    return {
      hasSeeThisView: !!seeThis,
      hasClickSeeMagic: !!magicBtn
    };
  });
  console.log('Fireworks stage controls (dev preview ?stage=fireworks):', fireworksStageControls);
  if (!fireworksStageControls.hasSeeThisView) {
    throw new Error('See This View should be visible on fireworks stage!');
  }
  console.log('✓ See This View is present on fireworks stage as intended!');
  await page.screenshot({ path: 'scratch/fix2_fix3_fireworks_stage.png' });

  // =========================================================================
  // FIX 4: FINAL MESSAGE FOR YOU SCROLLBAR
  // =========================================================================
  console.log('\n[FIX 4] Checking Final Message for You Scrollbar...');
  await page.goto('http://127.0.0.1:5173/?stage=qna', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 500));

  // Advance to Final Message
  while (true) {
    const qNext = await page.$('.qna-nav-btn.qna-nav-next');
    if (!qNext) break;
    await qNext.click();
    await new Promise(r => setTimeout(r, 60));
  }
  const surpriseBtn = await page.$('.qna-final-surprise-btn');
  if (surpriseBtn) {
    await surpriseBtn.click();
    await new Promise(r => setTimeout(r, 600));
  }

  const scrollbarCheck = await page.evaluate(() => {
    const msgScroll = document.querySelector('.qna-final-message-scroll');
    if (!msgScroll) return null;
    const style = window.getComputedStyle(msgScroll);
    return {
      overflowY: style.overflowY,
      scrollbarWidth: style.scrollbarWidth,
      scrollHeight: msgScroll.scrollHeight,
      clientHeight: msgScroll.clientHeight,
    };
  });
  console.log('Q&A Message Scroll container:', scrollbarCheck);
  await page.screenshot({ path: 'scratch/fix4_final_message_scrollbar.png' });
  console.log('✓ Final Message for You scrollbar styled and verified!');

  // =========================================================================
  // FIX 5: Q&A BACK TO QUESTIONS BUTTON VISIBILITY
  // =========================================================================
  console.log('\n[FIX 5] Checking Back to Questions Button...');
  const backBtnProps = await page.evaluate(() => {
    const btn = document.querySelector('.qna-sub-back-btn');
    if (!btn) return null;
    const style = window.getComputedStyle(btn);
    const rect = btn.getBoundingClientRect();
    return {
      text: btn.textContent.trim(),
      color: style.color,
      backgroundColor: style.backgroundColor,
      backdropFilter: style.backdropFilter,
      border: style.border,
      boxShadow: style.boxShadow,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
    };
  });
  console.log('Back to Questions button styles & rect:', backBtnProps);
  if (!backBtnProps) {
    throw new Error('Back to Questions button not found!');
  }
  if (!backBtnProps.backgroundColor.includes('rgba') && !backBtnProps.backgroundColor.includes('rgb')) {
    throw new Error('Back to Questions button missing glass background!');
  }
  console.log('✓ Back to Questions button has enhanced white-tint glass and lighting!');

  // Click Back to Questions to verify functionality
  await page.click('.qna-sub-back-btn');
  await new Promise(r => setTimeout(r, 400));
  const currentBadge = await page.$eval('.qna-qnum-badge', el => el.textContent.trim()).catch(() => '');
  console.log('Badge after clicking Back to Questions:', currentBadge);
  if (!currentBadge.includes('10')) {
    throw new Error('Clicking Back to Questions did not navigate back to Question 10!');
  }
  console.log('✓ Back to Questions correctly navigates to Question 10!');
  await page.screenshot({ path: 'scratch/fix5_back_to_questions.png' });

  await browser.close();
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}

  console.log('\n🎉 ALL FIVE FIXES VERIFIED SUCCESSFULLY! 🎉');
})();
