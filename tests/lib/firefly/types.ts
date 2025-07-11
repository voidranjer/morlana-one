export type CategoryName =
  "Dining"
  | "Home"
  | "Transportation"
  | "Utilities and home office"
  | "Other"
  | "Entertainment"
  | "Credit Card Payments"
  | "Shopping"
  | "Health, fitness and personal care"
  | "Groceries"
  | "Insurance"
  | "Transfers"
  | "Education"
  | "Loan and mortgage"
  | "Taxes and government"
  | "Travel"
  | "Kids and Family"
  | "Savings and Investments";

export type TransactionPayload = {
  type: "withdrawal" | "deposit";
  description: string;
  category_name: CategoryName;
  amount: number;
  date: string;
  external_id: string;
  notes?: string;
  source_name?: string;
  destination_name?: string;
};

export type RogersActivitiesResponse = {
  activities: {
    referenceNumber: string,
    activityType: string,
    amount: {
      value: string,
      currency: "CAD" | string
    },
    activityStatus: "APPROVED" | string,
    activityCategory: "PURCHASE" | "PAYMENT",
    activityClassification: "PURCHASE" | "PAYMENT",
    cardNumber: string,
    merchant: {
      name: string,
      categoryCode: number,
      categoryDescription: string, // TODO: map this to "Notes" in firefly
      category: string, // TODO: replace this with a known list of mapped categories
      address: {
        city: string,
        stateProvince: string,
        postalCode: string,
        countryCode: string
      }
    },
    date: string,
    activityCategoryCode: string,
    customerId: string,
    postedDate: string,
    name: {
      nameOnCard: string
    }
  }[]
}

export type FireflyTransaction = {
  user: string;
  transaction_journal_id: string;
  type: 'withdrawal' | 'deposit' | string;
  date: string;
  order: number;
  currency_id: string;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  currency_decimal_places: number;
  foreign_currency_id: string | null;
  foreign_currency_code: string | null;
  foreign_currency_symbol: string | null;
  foreign_currency_decimal_places: number;
  amount: string;
  foreign_amount: string | null;
  description: string;
  source_id: string;
  source_name: string;
  source_iban: string;
  source_type: string;
  destination_id: string;
  destination_name: string;
  destination_iban: string | null;
  destination_type: string;
  budget_id: string | null;
  budget_name: string | null;
  category_id: string;
  category_name: string;
  bill_id: string | null;
  bill_name: string | null;
  reconciled: boolean;
  notes: string | null;
  tags: string[];
  internal_reference: string | null;
  external_id: string;
  original_source: string;
  recurrence_id: string | null;
  recurrence_total: number | null;
  recurrence_count: number | null;
  bunq_payment_id: string | null;
  external_url: string | null;
  import_hash_v2: string;
  sepa_cc: string | null;
  sepa_ct_op: string | null;
  sepa_ct_id: string | null;
  sepa_db: string | null;
  sepa_country: string | null;
  sepa_ep: string | null;
  sepa_ci: string | null;
  sepa_batch_id: string | null;
  interest_date: string | null;
  book_date: string | null;
  process_date: string | null;
  due_date: string | null;
  payment_date: string | null;
  invoice_date: string | null;
  longitude: number | null;
  latitude: number | null;
  zoom_level: number | null;
  has_attachments: boolean;
};

