import { Page } from "@playwright/test";
import path from "path";

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
