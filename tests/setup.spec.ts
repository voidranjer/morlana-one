import { expect } from "@playwright/test";
import { undetectedTest } from "./fixtures";

undetectedTest('check user agent', async ({ page }) => {
  await page.goto('https://www.whatismybrowser.com/detect/what-is-my-user-agent/');
  const uaText = await page.textContent('#detected_value');
  expect(uaText).toContain('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.2227.0 Safari/537.36');
});

// TODO: implement this (by reading in from .env.example)
undetectedTest("check env vars", async ({ page, request }) => { })
