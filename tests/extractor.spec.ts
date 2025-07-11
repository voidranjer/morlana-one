import { expect } from "@playwright/test";

import { undetectedTest } from "./fixtures";
import { logToFile, parseDate, storeSession } from "./lib/utils";
import { CategoryName, TransactionPayload } from "./lib/firefly/types";
import { ApiResponse as RogersResponse } from "./lib/rogers/types";
import { ApiResponse as ScotiaResponse } from "./lib/scotiabank/types";
import { postTransactions } from "./lib/firefly";


undetectedTest("rogers bank", async ({ page, request }) => {
  /* -------------------- AUTH -------------------- */

  await page.goto("https://rbaccess.rogersbank.com/?product=ROGERSBRAND&locale=en_CA");
  await page.locator("#username").fill(process.env.ROGERS_USERNAME ?? "");
  await page.locator("#password").fill(process.env.ROGERS_PASSWORD ?? "");
  await page.locator("#loginButton").click();
  await page.waitForURL("https://rbaccess.rogersbank.com/app/accountSummary", { timeout: 300_000 }); // 5 minutes
  await storeSession(page);

  /* ---------------------------------------------- */


  await page.locator("#viewtransactionsbutton").click();
  await page.waitForURL("https://rbaccess.rogersbank.com/app/transactions")


  let resolved = false;

  const testDone = new Promise<void>((resolve) => {
    page.on('response', async (response) => {

      // Always on the 17th for some reason.
      const match = response.url().match(/activity\?cycleStartDate=(\d{4}-\d{2}-\d{2})/)

      if (match) {
        expect(response.ok()).toBeTruthy();
        const body: RogersResponse = await response.json();

        console.log(`Received ${body.activities.length} transactions for period: ${match[1]}`);

        // Log response body from bank to a file
        await logToFile(body);

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
              amount,
              date: parseDate(a.date),
              external_id: a.referenceNumber,
              source_name: isPayment ? undefined : process.env.ROGERS_FIREFLY_ACCOUNT_NAME,
              destination_name: isPayment ? process.env.ROGERS_FIREFLY_ACCOUNT_NAME : undefined
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

  await storeSession(page);
});

undetectedTest("scotiabank", async ({ page, request }) => {
  undetectedTest.setTimeout(300_000); // 5 minutes

  /* -------------------- AUTH -------------------- */

  await page.goto("https://www.scotiaonline.scotiabank.com/");
  // await page.locator("#onetrust-accept-btn-handler").click();
  // await page.locator("#usernameInput-input").fill(process.env.SCOTIA_USERNAME ?? "");
  // await page.locator("#password-input").fill(process.env.SCOTIA_PASSWORD ?? "");
  // await page.locator("#rememberMe").check();
  // await page.locator("#signIn").click();
  await page.waitForURL("https://secure.scotiabank.com/accounts?lng=en", { timeout: 300_000 }); // 5 minutes
  await storeSession(page);

  /* ---------------------------------------------- */

  expect(process.env.SCOTIA_CHEQUING_URL).toBeDefined();
  await page.goto(process.env.SCOTIA_CHEQUING_URL!);


  let resolved = false;

  const testDone = new Promise<void>((resolve) => {
    page.on('response', async (response) => {

      // Always on the 17th for some reason.
      const match = response.url().match(/deposit-accounts\/[^?]*\?fromDate=(\d{4}-\d{2}-\d{2})&toDate=(\d{4}-\d{2}-\d{2})/)

      if (match) {
        expect(response.ok()).toBeTruthy();
        const body: ScotiaResponse = await response.json();

        console.log(`Received ${body.data.length} transactions for: ${match[1]} to ${match[2]}`);

        // Log response body from bank to a file
        await logToFile(body);

        // Post transactions to Firefly
        const transactions: TransactionPayload[] = body.data
          .map(t => {
            const isWithdrawal = t.transactionType === "DEBIT"
            const type = isWithdrawal ? "withdrawal" : "deposit";
            const amount = t.transactionAmount.amount;
            const description = t.cleanDescription;
            const notes = t.userInputTag;
            const category_name = t.category.description as CategoryName;
            const date = parseDate(t.transactionDate);
            const external_id = t.key;
            const source_name = isWithdrawal ? process.env.CHEQUING_FIREFLY_ACCOUNT_NAME : undefined;
            const destination_name = isWithdrawal ? undefined : process.env.CHEQUING_FIREFLY_ACCOUNT_NAME;


            const payload: TransactionPayload = {
              type,
              description,
              notes,
              category_name,
              amount,
              date,
              external_id,
              source_name,
              destination_name
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

  await storeSession(page);
})
