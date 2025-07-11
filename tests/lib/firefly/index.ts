import { APIRequestContext, expect } from "@playwright/test";
import { TransactionPayload } from "./types";
import { parseDateReverse } from "../utils";

export async function isDuplicate(request: APIRequestContext, external_id: string) {
  const response = await request.get(`${process.env.FIREFLY_URL}/api/v1/search/transactions`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${process.env.FIREFLY_TOKEN}`
    },
    params: {
      query: `external_id_is:'${external_id}'`
    }
  })
  expect(response.ok()).toBeTruthy();
  const body = await response.json();

  return (body.meta.pagination.total > 0);
}

export async function postTransactions(request: APIRequestContext, transactions: TransactionPayload[]) {
  console.log('\n\n--------------------------------------------------');

  // Check for duplicates before posting
  const validTransactions: TransactionPayload[] = [];
  let numDupes = 0;
  const duplicateChecks = transactions.map(async (t) => {
    const isDupe = await isDuplicate(request, t.external_id);
    if (!isDupe) {
      validTransactions.push(t);
      return;
    }
    numDupes++;
    console.log(` Duplicate |  ${parseDateReverse(t.date)}  ${t.description.padEnd(30)}  $ ${t.amount.toFixed(2).toString().padEnd(10)}  |  ${process.env.FIREFLY_URL}/search?search=external_id_is%3A%27${t.external_id}%27`)
  })
  await Promise.all(duplicateChecks);

  // Post non-duplicate transactions
  let numSuccess = 0;
  let numErrors = 0;
  const transactionsToPost = validTransactions
    .map(async (t) => {
      const response = await request.post(`${process.env.FIREFLY_URL}/api/v1/transactions`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.FIREFLY_TOKEN}`
        },
        data: {
          error_if_duplicate_hash: true,
          transactions: [t]
        }
      })

      const responseStatus = response.status();
      const responseBody = await response.json();
      if (!response.ok()) {
        console.error(`Request failed with status ${responseStatus}: ${JSON.stringify(responseBody, null, 2)}`);
        numErrors++;
        return;
      }
      numSuccess++;
      console.log(` Success   |  ${parseDateReverse(t.date)}  ${t.description.padEnd(30)}  $ ${t.amount.toFixed(2).toString().padEnd(10)}`);
    });



  await Promise.all(transactionsToPost);

  console.log('--------------------------------------------------\n\n');
  console.log(`${'Errors'.padEnd(14)}  >  ${numErrors}`);
  console.log(`${'Duplicates'.padEnd(14)}  >  ${numDupes}`);
  console.log(`${'Success'.padEnd(14)}  >  ${numSuccess}`);
  console.log('--------------------');
  console.log(`${'Total'.padEnd(14)}  >  ${transactions.length}`);
}

