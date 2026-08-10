const playwright = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await playwright.chromium.launch();
  
  // Desktop screenshots
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('https://hark.ryan.ceo/', { waitUntil: 'networkidle' });
  
  // Wait a bit for any animations
  await desktopPage.waitForTimeout(3000);
  
  // Viewport screenshot
  await desktopPage.screenshot({ path: '/opt/cursor/artifacts/screenshots/hark-desktop.png' });
  
  // Full page screenshot
  await desktopPage.screenshot({ path: '/opt/cursor/artifacts/screenshots/hark-desktop-full.png', fullPage: true });
  
  // Extract HTML content for analysis
  const htmlContent = await desktopPage.content();
  fs.writeFileSync('/opt/cursor/artifacts/screenshots/hark-page-content.html', htmlContent);
  
  await desktopContext.close();
  
  // Mobile screenshots
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('https://hark.ryan.ceo/', { waitUntil: 'networkidle' });
  
  // Wait a bit for any animations
  await mobilePage.waitForTimeout(3000);
  
  await mobilePage.screenshot({ path: '/opt/cursor/artifacts/screenshots/hark-mobile.png' });
  
  await mobileContext.close();
  await browser.close();
  
  console.log('Screenshots captured successfully!');
})();
