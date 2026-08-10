from playwright.sync_api import sync_playwright
import time

def capture_screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # Desktop screenshots
        print("Capturing desktop screenshots...")
        desktop_context = browser.new_context(viewport={'width': 1280, 'height': 800})
        desktop_page = desktop_context.new_page()
        desktop_page.goto('https://hark.ryan.ceo/', wait_until='networkidle')
        
        # Wait for animations and interactions
        time.sleep(5)
        
        # Viewport screenshot
        desktop_page.screenshot(path='/opt/cursor/artifacts/screenshots/hark-desktop.png')
        print("✓ Desktop viewport screenshot saved")
        
        # Full page screenshot
        desktop_page.screenshot(path='/opt/cursor/artifacts/screenshots/hark-desktop-full.png', full_page=True)
        print("✓ Desktop full-page screenshot saved")
        
        # Extract HTML content
        html_content = desktop_page.content()
        with open('/opt/cursor/artifacts/screenshots/hark-page-content.html', 'w') as f:
            f.write(html_content)
        print("✓ HTML content saved")
        
        desktop_context.close()
        
        # Mobile screenshots
        print("Capturing mobile screenshots...")
        mobile_context = browser.new_context(viewport={'width': 390, 'height': 844})
        mobile_page = mobile_context.new_page()
        mobile_page.goto('https://hark.ryan.ceo/', wait_until='networkidle')
        
        # Wait for animations
        time.sleep(5)
        
        mobile_page.screenshot(path='/opt/cursor/artifacts/screenshots/hark-mobile.png')
        print("✓ Mobile screenshot saved")
        
        mobile_context.close()
        browser.close()
        
        print("\nAll screenshots captured successfully!")

if __name__ == "__main__":
    capture_screenshots()
