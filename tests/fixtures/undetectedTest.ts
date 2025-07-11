import { test as base } from '@playwright/test';

export const undetectedTest = base.extend<{}, { context: any }>({
  context: async ({ browser }, use) => {
    const context = await browser.newContext();
    await context.addInitScript("Object.defineProperty(navigator, 'webdriver', {get: () => false})");
    await use(context);
    await context.close();
  },

  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },
});

export default undetectedTest;
