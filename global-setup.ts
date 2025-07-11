import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

async function globalSetup(_: FullConfig) {
  const browser = await chromium.launch({ headless: true });

  // Load environment variables from a .env file
  dotenv.config({ path: path.resolve(__dirname, '.env') });

  await browser.close();
}

export default globalSetup;
