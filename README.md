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

## Who this is useful for

This project is intended for:

- supply-chain or operations teams that need a shared view of stock movement
- manufacturers, distributors, retailers, and garages that submit stock requests
- n8n administrators who automate validation, inventory updates, notifications, and audit logging
- developers who need a lightweight dashboard over Google Forms and Google Sheets

It is an operational MVP, not a full ERP, accounting system, customer portal, or replacement for access control. The dashboard is shared by design and should only expose data to authenticated users who are permitted to see the combined activity.

## Website files

| File | Purpose |
|---|---|
| `site/index.html` | Dashboard shell containing the KPI area, role cards, and refresh button. |
| `site/style.css` | Styling for the dashboard layout, KPI cards, badges, and tables. |
| `site/script.js` | Fetches the live JSON from the n8n webhook and renders the UI. |
| `site/n8n-code-node-source.js` | The JavaScript source used in the n8n Code node to generate the HTML dashboard. |
| `workflows/workflow.json` | Full n8n workflow export. |
| `doc/ARCHITECTURE.md` | Detailed workflow and architecture explanation. |
| `doc/WEBSITE.md` | Front-end dashboard usage and troubleshooting guide. |
| `doc/LIVE_INVENTORY_SCHEMA.md` | Workbook tabs, columns, relationships, setup checklist, and snapshot quality notes. |

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

## Requirements

- An n8n instance with permission to import and activate workflows
- Google Sheets OAuth2 credentials for the main and role spreadsheets
- Gmail OAuth2 credentials for success and failure notifications
- One main Google Spreadsheet and four role spreadsheets
- Four Google Forms linked to the matching `FORM_RESPONSES_*` tabs
- A Basic Auth credential for the dashboard webhook
- A browser for the dashboard and a local static server for development preview

The workbook schema and exact column contracts are documented in
[`doc/LIVE_INVENTORY_SCHEMA.md`](doc/LIVE_INVENTORY_SCHEMA.md). Review it before creating the Google Sheets. In particular, the checked-in Excel snapshot has structural problems in `INVENTORY` and `ORDERS` that must be repaired before it is used as a production template.

## Setup from scratch

1. Create the main spreadsheet with `PRODUCTS`, `ORGANIZATIONS`, `USERS`, `PRICE_HISTORY`, `DASHBOARD`, `ERROR_LOG`, and the four `FORM_RESPONSES_*` tabs.
2. Create one role spreadsheet for each Manufacturer, Distributor, Retailer, and Garage. Add `INVENTORY`, `ORDERS`, and `TRANSACTIONS` to each role spreadsheet.
3. Add the exact first-row headers from [`doc/LIVE_INVENTORY_SCHEMA.md`](doc/LIVE_INVENTORY_SCHEMA.md). Use one row per record and do not add duplicate or tab-delimited headers.
4. Add Google Sheets OAuth2 and Gmail OAuth2 credentials in n8n.
5. Import [`workflows/workflow.json`](workflows/workflow.json).
6. Replace the spreadsheet IDs in the workflow's configuration, role-sheet, and form-response reader nodes.
7. Create the Manufacturer, Distributor, Retailer, and Garage forms. Link each form to its matching response tab and preserve the ten response headers.
8. Create a Basic Auth credential in n8n and assign it to `Dashboard Webhook`.
9. Activate the workflow and submit test requests for each valid route.
10. Verify inventory changes, order and transaction rows, confirmation email, error logging, failure email, and dashboard output.

For an existing workbook, repair `INVENTORY` and `ORDERS` first, then compare every header with the schema document. The local `sample-excel/Live Inventory.xlsx` is a reference snapshot and does not update automatically from Google Sheets.

## Local preview

You can preview the dashboard by opening `site/index.html` in a browser, or by serving the `site` folder from a local static web server. The key requirement is that the endpoint returns valid JSON and is reachable from the page.

For a local deployment, update the `WEBHOOK_URL` constant at the top of `site/script.js` to match your own n8n endpoint. If the endpoint is on another origin, configure CORS on the webhook response and use HTTPS in production.

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
