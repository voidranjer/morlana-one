import { Page } from "@playwright/test";
import fs from "fs";
import path from "path";

// Generate a timestamped filename for logging purposes (without the extension)
export function generateTimestampFilename() {
  const now = new Date();

  const pad = (n: number) => n.toString().padStart(2, '0');

  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1); // months are 0-indexed
  const year = now.getFullYear();
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return `${day}-${month}-${year}-${hours}${minutes}-${seconds}`;
}

// Store session (cookies and local storage) to a file for later use.
export async function storeSession(page: Page) {
  const authFile = path.join(__dirname, "../../playwright/.auth/user.json");
  await page.context().storageState({ path: authFile });
}

// Log response body from bank to a file
export async function logToFile(payload: object) {
  const outputDir = path.join(__dirname, 'logs');
  const outputFilename = `${outputDir}/${generateTimestampFilename()}.json`
  await fs.promises.mkdir(outputDir, { recursive: true });
  await fs.promises.writeFile(outputFilename, JSON.stringify(payload, null, 2));
  console.log(`Added logs to ${outputFilename}`);

}

// Convert 2025-05-31 to firefly format
export function parseDate(d: string) {
  return d.replace(/(\d{4}-\d{2}-\d{2})/, '$1T00:00:00Z');
}

// Convert firefly format to 2025-05-31
export function parseDateReverse(d: string) {
  return d.replace(/(\d{4}-\d{2}-\d{2})T00:00:00Z/, '$1')
}
