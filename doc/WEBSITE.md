# Website Dashboard Guide

This document explains how the website in `site/` works and how to troubleshoot it when it does not load the live data.

## Files involved

- `site/index.html` — page structure
- `site/style.css` — page styling
- `site/script.js` — live data loading logic
- `site/n8n-code-node-source.js` — n8n code node equivalent

## What the page does

The page is a front-end for the n8n dashboard endpoint. It loads a JSON response from the webhook and renders:

- total response count
- per-role breakdown for Manufacturer, Distributor, Retailer, and Garage
- a table of recent rows for each role
- a generated-at timestamp
- a manual refresh button

## Current webhook URL

The front-end currently points to:

`https://trex4u.app.n8n.cloud/webhook/supply-chain-dashboard`

Update this value in `site/script.js` if your workflow is moved or renamed.

## Data contract

The expected JSON should look like this:

```json
{
  "generatedAt": "2026-09-17T12:00:00Z",
  "counts": {
    "total": 42,
    "manufacturer": 10,
    "distributor": 12,
    "retailer": 9,
    "garage": 11
  },
  "roles": {
    "manufacturer": [
      { "Timestamp": "...", "Email": "..." }
    ],
    "distributor": [],
    "retailer": [],
    "garage": []
  }
}
```

The script expects:

- `data.counts.total`
- `data.counts.manufacturer`
- `data.counts.distributor`
- `data.counts.retailer`
- `data.counts.garage`
- `data.roles.manufacturer`
- `data.roles.distributor`
- `data.roles.retailer`
- `data.roles.garage`

## Troubleshooting

### The page shows "Could not load dashboard"

This usually means one of the following:

1. The webhook URL is wrong.
2. The n8n workflow is inactive.
3. The endpoint requires Basic Auth and the browser is not authenticated.
4. The response is not valid JSON.
5. CORS is blocking the request.

### CORS issues

If the page is served outside the n8n domain, enable cross-origin access on the n8n webhook response using headers like:

```text
Access-Control-Allow-Origin: *
```

This allows the browser to fetch the dashboard from the page without being blocked.

### Basic Auth issues

Open the webhook URL directly in a browser to confirm the credentials are correct. The same credentials should work when the site fetches data.

## Refresh behavior

The refresh button calls `loadDashboard()` again. This re-fetches the live endpoint and re-renders the dashboard without reloading the page.

## Notes

- The page reads raw Google Form responses, not the processed inventory ledger.
- It is intended as an operational live overview, not a full user-facing portal.
- If the workflow changes field names, the script will still render them as columns automatically as long as they appear in the JSON.
