# Currency Exchange Rate Tracker — Live Rates & Change

Get current exchange rates for a base currency against a list of
others, plus the percent change over a chosen number of days.

Built for finance and international ops teams who want to know not
just today's rate but whether it's moved meaningfully since last week.

## Input

```json
{
  "baseCurrency": "USD",
  "targetCurrencies": "EUR,GBP,JPY",
  "daysBack": 7
}
```

| Field | Type | Description |
|---|---|---|
| `baseCurrency` | string | Three-letter ISO currency code to convert from. Default `"USD"`. |
| `targetCurrencies` | string (optional) | Comma-separated three-letter currency codes. Leave blank for all available currencies. |
| `daysBack` | number | Compute percent change versus the rate this many days ago. Default `7`, max `90`. |

## Output

One record per currency:

```json
{
  "baseCurrency": "USD",
  "currency": "EUR",
  "currentRate": 0.86453,
  "currentDate": "2026-08-14",
  "comparisonRate": 0.8707,
  "comparisonDate": "2026-07-31",
  "percentChange": -0.7085
}
```

`comparisonDate` may differ slightly from an exact `daysBack` offset —
forex markets are closed on weekends and ECB holidays, so the nearest
prior trading day is used automatically.

A request is billed once regardless of how many target currencies are
returned.

## How it works

Direct calls to the [Frankfurter API](https://frankfurter.dev/)
(`api.frankfurter.dev`), which re-serves the European Central Bank's
daily reference rates. No proxy, no key, no scraping — free for
commercial use, open source (MIT).

## Pricing note

Billed per **request**, not per currency returned — one charge whether
you check 1 currency or all of them.
