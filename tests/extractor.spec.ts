import { expect } from "@playwright/test";
import fs from "fs";
import path from "path";

import { undetectedTest } from "./fixtures";
import { generateTimestampFilename } from "./lib/utils";
import { CategoryName, RogersActivitiesResponse, TransactionPayload } from "./lib/firefly/types";
import { postTransactions } from "./lib/firefly/utils";

undetectedTest('check user agent', async ({ page }) => {
  await page.goto('https://www.whatismybrowser.com/detect/what-is-my-user-agent/');
  const uaText = await page.textContent('#detected_value');
  expect(uaText).toContain('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.2227.0 Safari/537.36');
});

undetectedTest("rogers bank", async ({ page, request }) => {
  /* -------------------- AUTH -------------------- */

  await page.goto("https://rbaccess.rogersbank.com/?product=ROGERSBRAND&locale=en_CA");
  await page.locator("#username").fill(process.env.ROGERS_USERNAME ?? "");
  await page.locator("#password").fill(process.env.ROGERS_PASSWORD ?? "");
  await page.locator("#loginButton").click();
  await page.waitForURL("https://rbaccess.rogersbank.com/app/accountSummary", { timeout: 300_000 }); // 5 minutes

  /* ---------------------------------------------- */


  await page.locator("#viewtransactionsbutton").click();
  await page.waitForURL("https://rbaccess.rogersbank.com/app/transactions")


  let resolved = false;

  const testDone = new Promise<void>((resolve) => {
    page.on('response', async (response) => {

      // Always on the 17th for some reason.
      const match = response.url().match(/https:\/\/rbaccess\.rogersbank\.com\/issuing\/digital\/account\/1303113002\/customer\/-1081833360\/activity\?cycleStartDate=(\d{4})-(\d{2})-17/)

      if (match) {
        expect(response.ok()).toBeTruthy();

        const year = match[1];
        const month = match[2];
        console.log(`Received response for transactions from ${year}-${month}-17`);

        const body: RogersActivitiesResponse = await response.json();

        // Log response body from bank to a file
        const outputDir = path.join(__dirname, 'logs');
        const outputFilename = `${outputDir}/${generateTimestampFilename()}.json`
        await fs.promises.mkdir(outputDir, { recursive: true });
        await fs.promises.writeFile(outputFilename, JSON.stringify(body, null, 2));
        console.log(`Wrote ${body.activities.length} transactions to ${outputFilename}`);

        // Post transactions to Firefly
        const transactions: TransactionPayload[] = body.activities
          .filter(a => a.activityStatus === "APPROVED")
          .map(a => {
            const isPayment = parseFloat(a.amount.value) < 0;
            const amount = Math.abs(parseFloat(a.amount.value));

            const payload: TransactionPayload = {
              type: isPayment ? "deposit" : "withdrawal",
              description: a.merchant.name,
              notes: a.merchant.categoryDescription,
              category_name: a.merchant.category as CategoryName,
              amount: amount,
              date: a.date.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$2-$3T00:00:00Z'),
              external_id: a.referenceNumber,
              // TODO: this shouldn't be hardcoded
              source_name: isPayment ? undefined : "Rogers Red Mastercard",
              destination_name: isPayment ? "Rogers Red Mastercard" : undefined
            }

            return payload;

          });

        await postTransactions(request, transactions);

        resolved = true;
        resolve(); // ✅ ends the promise, test will continue
      }
    });
  });


  // ⏱️ Timeout fallback to prevent test from hanging forever
  const timeout = new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('Response not received in time')), 300_000) // 5 minutes
  );

  // Wait until either the desired response is seen OR timeout
  await Promise.race([testDone, timeout]);

  // ✅ Optional final assertion to make the test result clear
  expect(resolved).toBeTruthy();

  // Store session (cookies and local storage) to a file for later use.
  const authFile = path.join(__dirname, "../playwright/.auth/user.json");
  await page.context().storageState({ path: authFile });

});
