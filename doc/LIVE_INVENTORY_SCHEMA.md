# Live Inventory Workbook Schema

This document is the field-level reference for `sample-excel/Live Inventory.xlsx`. It was generated from the workbook snapshot in this repository and cross-checked against `workflows/workflow.json`.

## Workbook Summary

The workbook contains 13 sheets:

| Sheet | Responsibility | Used by workflow |
|---|---|---|
| `FORM_RESPONSES_GARAGE` | Raw Garage form submissions | Dashboard and Garage pipeline |
| `FORM_RESPONSES_RETAILER` | Raw Retailer form submissions | Dashboard and Retailer pipeline |
| `FORM_RESPONSES_DISTRIBUTOR` | Raw Distributor form submissions | Dashboard and Distributor pipeline |
| `FORM_RESPONSES_MANUFACTURER` | Raw Manufacturer form submissions | Dashboard and Manufacturer pipeline |
| `PRODUCTS` | Product catalog and role prices | Product validation and pricing |
| `ORGANIZATIONS` | Supply-chain organizations and hierarchy | Seller/buyer validation |
| `INVENTORY` | Current stock by organization and product | Stock validation and updates |
| `ORDERS` | Validated order records | Order creation and status updates |
| `TRANSACTIONS` | Completed transaction ledger | Transaction creation |
| `PRICE_HISTORY` | Historical role-specific prices | Price audit/history |
| `USERS` | Authorized users and organization membership | User validation |
| `DASHBOARD` | KPI values for spreadsheet reporting | Reporting/reference |
| `ERROR_LOG` | Rejected request and workflow errors | Failure branch and support |

## Conventions

- The first row is the header row. Keep header spelling and capitalization unchanged because n8n maps fields by name.
- `*_ID` fields are stable identifiers. Names are display values and must not replace IDs in joins.
- `Active` and `Organization Active` values are stored as `1`/`0` or `TRUE`/`FALSE`. The workflow treats inactive users, products, and organizations as invalid.
- Dates and timestamps should be ISO 8601 strings when written by n8n. Excel date serials such as `46282.5574` appear in the form-response snapshot because those cells are formatted as dates in Excel.
- Currency fields are numeric. `Tax` is a percentage, for example `18` means 18 percent.
- The first `spreadsheetId` column in several sheets is an integration/helper column and is blank in the snapshot. Keep it only if the connected Google Sheet expects it.

## Form Response Sheets

The four `FORM_RESPONSES_*` sheets have the same ten columns. They are raw input, not the processed order or transaction ledger.

| Column | Meaning | Example / rule |
|---|---|---|
| `Timestamp` | Time the form response was submitted | Excel date/time or ISO timestamp |
| `Email Address` | Submitter email from Google Forms | Must resolve to an active `USERS.Email` |
| `From (Seller) Organization` | Seller selected in the form | Usually `ORG-000001 - Manufacturer ABC` |
| `To (Buyer) Organization` | Buyer selected in the form | Usually `ORG-000002 - Distributor XYZ` |
| `Transaction Type` | Requested operation | Usually `SALE`; `RETURN` is also present in the snapshot |
| `Product` | Product selected in the form | Usually `P-000001 - Brake Pad` |
| `Quantity` | Requested quantity | Positive number |
| `Required Date` | Requested delivery date | Optional form value |
| `Priority` | Request priority | `NORMAL`, `HIGH`, or `URGENT`; optional in old rows |
| `Remarks` | Free-text request notes | Optional |

The valid route follows the chain `MANUFACTURER -> DISTRIBUTOR -> RETAILER -> GARAGE`. Invalid users, products, routes, quantities, or stock levels are written to `ERROR_LOG`.

## Master Data Sheets

### `PRODUCTS`

The intended catalog fields are:

| Column | Meaning |
|---|---|
| `spreadsheetId` | Optional integration/helper value; blank in the snapshot |
| `Product_ID` | Stable product identifier, for example `P-000001` |
| `SKU` | Short stock-keeping code, for example `BP-100` |
| `Product_Name` | Human-readable product name |
| `Category` | Product category |
| `Unit` | Quantity unit, for example `pcs` |
| `Base_Cost` | Base product cost |
| `Manufacturer_Price` | Price used for manufacturer-level sales |
| `Distributor_Price` | Price used for distributor-level sales |
| `Retailer_Price` | Price used for retailer-level sales |
| `Garage_Price` | Price used for garage-level sales |
| `MRP` | Maximum retail price |
| `Tax` | Tax percentage |
| `Reorder_Level` | Minimum desired stock level |
| `Active` | Whether the product can be ordered |
| `Updated_At` | Last catalog update timestamp |

The snapshot also contains appended registration-style fields after `Updated_At`: `User_ID`, `Name`, `Email`, `Role`, `Organization_ID`, `Organization_Name`, `Organization_Type`, and `Created_At`. These do not belong in the canonical product row and should be removed or kept in a separate sheet before production use.

### `ORGANIZATIONS`

| Column | Meaning |
|---|---|
| `spreadsheetId` | Optional integration/helper value |
| `Organization_ID` | Stable organization identifier |
| `Organization_Name` | Display name |
| `Type` | `MANUFACTURER`, `DISTRIBUTOR`, `RETAILER`, or `GARAGE` |
| `Parent_Organization_ID` | Upstream organization in the chain; blank for the manufacturer |
| `Contact` | Primary contact name |
| `Phone` | Contact phone number |
| `Email` | Organization contact email |
| `Location` | Plant, warehouse, store, or workshop location |
| `Active` | Whether the organization can participate |
| `Created_At` | Creation timestamp |
| `Updated_At` | Last update timestamp |

The snapshot also contains appended user-registration values after `Updated_At`: `User_ID`, `Name`, `Role`, and `Organization_Type`. Keep organization records and user records separate when cleaning the workbook.

### `USERS`

| Column | Meaning |
|---|---|
| `spreadsheetId` | Optional integration/helper value |
| `User_ID` | Stable user identifier |
| `Name` | User display name |
| `Email` | Login and form-submitter email; used for validation |
| `Role` | Application role, for example `SUPER_ADMIN`, `DISTRIBUTOR`, or `GARAGE` |
| `Organization_ID` | User's organization |
| `Organization_Name` | Denormalized organization display name |
| `Organization_Type` | Denormalized organization type |
| `Active` | Whether the user may submit requests |
| `Created_At` | Creation timestamp |
| `Updated_At` | Last update timestamp |

## Operational Sheets

### `INVENTORY`

The workflow expects these 11 canonical columns:

| Column | Meaning |
|---|---|
| `Inventory_ID` | Stable inventory-row identifier |
| `Organization_ID` | Organization holding the stock |
| `Organization_Name` | Display name of the stock owner |
| `Organization_Type` | Owner role |
| `Product_ID` | Product held in stock |
| `SKU` | Product SKU |
| `Product_Name` | Product display name |
| `Quantity` | Physical quantity on hand |
| `Reserved_Quantity` | Quantity reserved for pending work |
| `Available_Quantity` | Quantity available to sell; normally `Quantity - Reserved_Quantity` |
| `Unit_Price` | Current price used for this inventory row |

**Snapshot issue:** this sheet is malformed. The header and the first inventory record are stored as tab-delimited text inside cell `A1` and `A2`, rather than in separate columns. Restore the 11 headers above into `A1:K1` and split each tab-delimited record across `A:K` before connecting n8n. The workflow searches by `Organization_ID` and `Product_ID`, then updates `Quantity`, `Reserved_Quantity`, `Available_Quantity`, and `Unit_Price`.

### `ORDERS`

The workflow appends and updates these 28 canonical columns:

| Column | Meaning |
|---|---|
| `Order_ID` | Stable order identifier |
| `Request_ID` | Identifier generated for the incoming request |
| `Timestamp` | Request/creation timestamp |
| `User_Email` | Submitter email |
| `From_Organization_ID` | Seller organization ID |
| `From_Organization` | Seller display name |
| `From_Type` | Seller role |
| `To_Organization_ID` | Buyer organization ID |
| `To_Organization` | Buyer display name |
| `To_Type` | Buyer role |
| `Transaction_Type` | `SALE` or supported transaction type |
| `Product_ID` | Product identifier |
| `SKU` | Product SKU |
| `Product_Name` | Product display name |
| `Quantity` | Ordered quantity |
| `Unit` | Quantity unit |
| `Unit_Price` | Price per unit |
| `Tax` | Tax percentage |
| `Subtotal` | Quantity multiplied by unit price |
| `Tax_Amount` | Calculated tax amount |
| `Total` | Subtotal plus tax |
| `Required_Date` | Requested delivery date |
| `Priority` | Request priority |
| `Remarks` | Request notes |
| `Order_Status` | Processing state, for example `COMPLETED` |
| `Created_At` | Order creation timestamp |
| `Updated_At` | Last order update timestamp |

**Snapshot issue:** this sheet does not contain a clean canonical header row. It has inventory-style values in `A:B`, `E:K`, and appended blocks beginning at `AA`. Replace row 1 with the 28 headers above and keep each order as one row before using the `Create Order` and `Update Order Status` nodes.

### `TRANSACTIONS`

| Column | Meaning |
|---|---|
| `spreadsheetId` | Optional integration/helper value |
| `Transaction_ID` | Stable transaction identifier |
| `Request_ID` | Source request identifier |
| `Order_ID` | Related order identifier |
| `Timestamp` | Transaction timestamp |
| `User_Email` | Submitter email |
| `Transaction_Type` | Transaction operation |
| `From_Organization_ID` | Seller organization ID |
| `From_Organization` | Seller display name |
| `From_Type` | Seller role |
| `To_Organization_ID` | Buyer organization ID |
| `To_Organization` | Buyer display name |
| `To_Type` | Buyer role |
| `Product_ID` | Product identifier |
| `SKU` | Product SKU |
| `Product_Name` | Product display name |
| `Quantity` | Transacted quantity |
| `Unit_Price` | Price per unit |
| `Tax` | Tax percentage |
| `Total` | Final transaction amount |
| `Transaction_Status` | Final transaction state |
| `Created_At` | Creation timestamp |

This is the audit ledger. Do not overwrite or delete completed transaction rows during normal operation.

### `PRICE_HISTORY`

| Column | Meaning |
|---|---|
| `spreadsheetId` | Optional integration/helper value |
| `Price_ID` | Stable price-history identifier |
| `Product_ID` | Product identifier |
| `SKU` | Product SKU |
| `Effective_From` | Date from which prices apply |
| `Manufacturer_Price` | Manufacturer price at that time |
| `Distributor_Price` | Distributor price at that time |
| `Retailer_Price` | Retailer price at that time |
| `Garage_Price` | Garage price at that time |
| `Changed_By` | Email or user that changed prices |
| `Created_At` | History-row creation timestamp |

### `ERROR_LOG`

| Column | Meaning |
|---|---|
| `spreadsheetId` | Optional integration/helper value |
| `Error_ID` | Stable error identifier |
| `Timestamp` | Failure timestamp |
| `Request_ID` | Request that failed |
| `User_Email` | Request submitter |
| `Error_Type` | Machine-readable failure type |
| `Error_Message` | Human-readable failure detail |
| `From_Organization_ID` | Seller organization involved |
| `To_Organization_ID` | Buyer organization involved |
| `Product_ID` | Product involved |
| `SKU` | Product SKU when resolved |
| `Quantity` | Requested quantity |
| `Workflow_Name` | n8n workflow name |
| `Node_Name` | Node that reported the error |
| `Status` | Error state, normally `OPEN` initially |

### `DASHBOARD`

| Column | Meaning |
|---|---|
| `spreadsheetId` | Optional integration/helper value |
| `KPI` | Metric name, such as `Total Orders` or `Low Stock Items` |
| `VALUE` | Current metric value |

The current website dashboard reads the four raw form-response sheets through the n8n webhook; it does not depend on this KPI sheet.

## Relationships

- `USERS.Organization_ID` joins to `ORGANIZATIONS.Organization_ID`.
- `INVENTORY.Organization_ID` joins to `ORGANIZATIONS.Organization_ID`.
- `INVENTORY.Product_ID` joins to `PRODUCTS.Product_ID`.
- `ORDERS.Product_ID` and `TRANSACTIONS.Product_ID` join to `PRODUCTS.Product_ID`.
- `TRANSACTIONS.Order_ID` joins to `ORDERS.Order_ID`.
- `PRICE_HISTORY.Product_ID` joins to `PRODUCTS.Product_ID`.
- Form response organization and product values contain an ID plus display name; the workflow splits the ID before validation.

## Required Setup Checklist

1. Create the main spreadsheet with the four `FORM_RESPONSES_*` sheets plus `PRODUCTS`, `ORGANIZATIONS`, `USERS`, `PRICE_HISTORY`, `DASHBOARD`, and `ERROR_LOG`.
2. Create one role spreadsheet for each of Manufacturer, Distributor, Retailer, and Garage. Each role spreadsheet needs `INVENTORY`, `ORDERS`, and `TRANSACTIONS`.
3. Repair the `INVENTORY` and `ORDERS` layouts described above before importing live data.
4. Put only one header row in each sheet. Do not leave blank spacer rows, duplicate headers, or tab-delimited records in a single cell.
5. Add Google Sheets OAuth2 and Gmail OAuth2 credentials in n8n.
6. Import `workflows/workflow.json` and replace the spreadsheet IDs in the configuration, role-sheet, and response-reader nodes.
7. Create and link the four Google Forms to their matching `FORM_RESPONSES_*` tabs. Keep the ten form headers unchanged.
8. Create the n8n Basic Auth credential used by `Dashboard Webhook`.
9. Activate the workflow and submit one valid request per route.
10. Verify user/product/organization validation, inventory decrement and increment, order creation, transaction creation, success email, and dashboard visibility.
11. Submit an invalid user, invalid route, and insufficient-stock request. Confirm each creates an `ERROR_LOG` row and failure email.

## Snapshot Quality Notes

- The workbook is a local Excel snapshot, not a live Google Sheets connection. New form submissions will not appear in this file automatically.
- `FORM_RESPONSES_DISTRIBUTOR` contains a header plus blank rows only in the inspected snapshot.
- `INVENTORY` and `ORDERS` require structural repair before they can be treated as production-ready tables.
- `PRODUCTS` and `ORGANIZATIONS` contain extra appended user-registration columns in addition to their canonical fields.
- The workflow should be validated against a repaired Google Sheet before relying on current row counts or dashboard metrics.
