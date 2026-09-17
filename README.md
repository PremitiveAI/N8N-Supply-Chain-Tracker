# Live Supply Chain Dashboard

This project contains a live operational dashboard for a four-role inventory and supply chain flow. It combines Google Form submissions from the Manufacturer, Distributor, Retailer, and Garage pipelines, then displays a current summary of activity in one web page.

The current front-end implementation in the `site` folder is a lightweight, static dashboard that fetches live data from an n8n webhook and renders KPI cards plus per-role response tables.

## Project overview

The system is designed around:

- a shared main spreadsheet for master data and audit tracking
- four role-specific intake pipelines
- Google Form submission sheets for raw activity
- a protected dashboard endpoint that exposes the latest combined data
- a static front-end that consumes that endpoint and displays the results

## Website files

| File | Purpose |
|---|---|
| `site/index.html` | Dashboard shell containing the KPI area, role cards, and refresh button. |
| `site/style.css` | Styling for the dashboard layout, KPI cards, badges, and tables. |
| `site/script.js` | Fetches the live JSON from the n8n webhook and renders the UI. |
| `site/n8n-code-node-source.js` | The JavaScript source used in the n8n Code node to generate the HTML dashboard. |
| `workflows/Live_Inventory___Supply_Chain_Management_MVP__fixed.json` | Full n8n workflow export. |
| `doc/ARCHITECTURE.md` | Detailed workflow and architecture explanation. |
| `doc/WEBSITE.md` | Front-end dashboard usage and troubleshooting guide. |

## Current dashboard behavior

The live website in `site/script.js` does the following:

1. Sets the webhook URL to: `https://trex4u.app.n8n.cloud/webhook/supply-chain-dashboard`
2. Calls the endpoint with a plain GET request.
3. Reads a JSON payload shaped like:

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
    "manufacturer": [ { "field": "value" } ],
    "distributor": [ { "field": "value" } ],
    "retailer": [ { "field": "value" } ],
    "garage": [ { "field": "value" } ]
  }
}
```

4. Renders KPI cards for total and per-role counts.
5. Builds a table for each role from the `roles` object.
6. Updates the display timestamp and refreshes when the button is clicked.

This is a dashboard front-end for the raw form response data, not a database viewer. It is designed to stay in sync with the latest Google Form rows exposed by the n8n workflow.

## Webhook and auth setup

The live dashboard is protected via Basic Auth. The front-end expects the same credentials used to access the n8n endpoint directly.

Important notes:

- The URL in `site/script.js` is the current live webhook target.
- A browser may prompt for username/password the first time the page loads.
- If the page is hosted outside the n8n domain, the webhook must allow cross-origin requests via a response header such as `Access-Control-Allow-Origin`.
- The page is intended to load data from the live workflow, not from local mock data.

## Local preview

You can preview the dashboard by opening `site/index.html` in a browser, or by serving the `site` folder from a local static web server. The key requirement is that the endpoint returns valid JSON and is reachable from the page.

For a local deployment, update the `WEBHOOK_URL` constant at the top of `site/script.js` to match your own n8n endpoint.

## Workflow context

The full operational flow is documented in `doc/ARCHITECTURE.md`. That file explains:

- the four independent pipelines
- Google Sheets and Forms structure
- inventory and order validation flow
- dashboard endpoint generation
- error handling and security notes

## Quick summary of roles

| Role | Purpose |
|---|---|
| Manufacturer | Produces or dispatches stock and submits inventory-related requests. |
| Distributor | Places orders and fulfills downstream movement between supply chain steps. |
| Retailer | Receives stock and serves the next layer of the chain. |
| Garage | Submits purchase requests and tracks delivery activity. |

## Notes

- The dashboard reads the raw form response sheets across all four roles.
- It is designed as a single operational view for stakeholders and admin users.
- If you need role-specific restrictions or user-level access control, that logic should be added inside the workflow or API layer.
