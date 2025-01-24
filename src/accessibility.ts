import { chromium } from 'playwright';
import { injectAxe } from 'axe-playwright';

export async function runAccessibilityTest(url: string): Promise<any[]> {  // Changed to return an array of objects
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the desired URL
  await page.goto(url);

  // Inject Axe into the page context
  await injectAxe(page);

  // Run the accessibility check and capture the results
  const results = await page.evaluate(async () => {
    // Using `axe` in the page context
    const axeResults = await (window as any).axe.run();
    return axeResults.violations; // Returns the found violations
  });

  await browser.close();

  return results;  // Now returns the array of violations
}
