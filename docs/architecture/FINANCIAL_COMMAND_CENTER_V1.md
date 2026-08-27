# BillQyro Financial Command Center v1

## Purpose

Provide one read-only canonical aggregation for dashboard financial metrics without changing persisted business records.

## Metrics

- Total Billed: valid invoice grand totals.
- Total Collected: canonical invoice payment totals.
- Client Due: canonical invoice balances.
- Today's Billing: valid invoice totals dated today.
- Today's Collection: payment-history amounts dated today.
- Outsource Cost: agreed/current direct outsource costs when the vendor job model is supplied.
- Outsource Paid: recorded vendor payments.
- Outsource Payable: max(0, outsource cost - outsource paid).
- Other Expenses: persisted expense amounts.
- Direct Costs: outsource cost + other expenses.
- Gross Profit: billed - direct costs.
- Profit Margin: gross profit / billed * 100.

## Safety Rules

1. This aggregation performs no writes.
2. Cancelled, void, deleted and estimate documents are excluded from billed revenue.
3. Payment history is authoritative through the existing canonical payment resolver.
4. Client due is authoritative through the existing canonical balance resolver.
5. Cash collected and billed revenue remain separate concepts.
6. Outsource payable never becomes negative.
7. Existing invoice/payment/customer/bank records are not mutated by this module.

## Important Integration Note

This v1 branch adds the canonical aggregation layer and regression tests. The existing Dashboard must consume this utility before the new metrics are considered production-complete. The full Vendor/Outsource persistence workflow also remains a separate implementation step unless already present in the repository.
