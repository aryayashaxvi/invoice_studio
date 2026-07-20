# Invoice Studio

Invoice Studio is a secure MERN-stack application for creating recruitment and placement invoices as Excel workbooks. It replaces hardcoded company and contract data with MongoDB-managed configuration and uses ExcelJS to populate approved invoice templates.

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [First-time setup](#first-time-setup)
- [Running the application](#running-the-application)
- [Using invoice templates](#using-invoice-templates)
- [Pricing and tax rules](#pricing-and-tax-rules)
- [User roles and security](#user-roles-and-security)
- [GitHub Codespaces](#github-codespaces)
- [Available commands](#available-commands)
- [Production notes](#production-notes)

## Features

- JWT-based authentication with admin and operator roles.
- Company management through the frontend: add, update, and deactivate companies.
- Multiple GST branches per company.
- State directory stored in MongoDB; states are selected from dropdown lists rather than typed freely.
- Grade-wise contracts with either fixed charges or a percentage of CTC.
- Configurable organisation settings, including GST, HSN/SAC, bank information, PAN, IFSC, taxes, templates, and starting invoice number.
- Dynamic intra-state CGST/SGST and interstate IGST calculation based on the configured organisation home state.
- Excel invoice generation using ExcelJS and two configurable `.xlsx` templates.
- Invoice history, download, and admin-only permanent deletion.
- Invoice numbers are not reused after deletion, preventing duplicate invoice numbers.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Workbook generation | ExcelJS |
| Authentication | JSON Web Tokens, bcrypt |
| Validation | Zod |

## Project structure

```text
invoice-generator-mern/
├── client/
│   ├── src/
│   │   ├── AdminWorkspace.jsx
│   │   ├── App.jsx
│   │   ├── InvoiceWorkspace.jsx
│   │   ├── LoginPage.jsx
│   │   ├── OrganizationSettings.jsx
│   │   └── api.js
│   ├── .env.example
│   └── package.json
├── server/
│   ├── assets/templates/
│   │   ├── template1.xlsx
│   │   └── template2.xlsx
│   ├── generated/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── scripts/createAdmin.js
│   ├── .env.example
│   └── package.json
├── package.json
└── README.md
```

## Prerequisites

- Node.js **20 or later**
- npm
- A MongoDB Atlas database
- Git

Check your version:

```bash
node -v
npm -v
```

The Node version must be `v20` or newer.

### Install Node.js 20 using NVM

Use these commands on GitHub Codespaces, Linux, or macOS:

```bash
nvm install 20
nvm use 20
nvm alias default 20
```

Verify it:

```bash
node -v
```

## Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git
cd YOUR_REPOSITORY_NAME
```

Install root dependencies and all application dependencies:

```bash
npm install
npm run install:all
```

## Environment variables

Environment files are intentionally not committed. The backend environment file belongs in `server/`; the frontend environment file belongs in `client/`.

Create local environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### `server/.env`

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER.mongodb.net/invoice_generator?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:5173
PORT=5000
```

### `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

Generate a strong JWT secret if needed:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Never commit `.env` files, MongoDB credentials, or JWT secrets.

## First-time setup

### 1. Create an administrator

Run this command from the project root. Keep it on one line.

```bash
npm run create-admin -- "Administrator Name" "admin@example.com" "A_Strong_Password_123"
```

### 2. Run the application

```bash
npm run dev
```

Open the frontend at:

```text
http://localhost:5173
```

Check the backend at:

```text
http://localhost:5000/api/health
```

Expected response:

```json
{"status":"ok"}
```

### 3. Configure the application

After signing in as an administrator:

1. Open **Organisation Settings**.
2. Add the required states in **State Directory**.
3. Select the organisation home state.
4. Enter the first invoice number. This can be changed only before the first invoice is generated.
5. Configure CGST, SGST, and IGST rates as decimals. For example, `0.09` means 9%.
6. Select the intra-state and interstate workbook templates.
7. Enter organisation name, GST number, HSN/SAC code, registered address, bank details, IFSC, and PAN.
8. Save organisation settings.
9. Open **Company & access management** and add companies, GST branches, and contracts.
10. Open **Invoice workspace** to generate invoices.

Organisation settings are stored in MongoDB and remain available after browser refreshes, server restarts, Codespaces restarts, and local shutdowns. They are only lost if the database or settings collection is deleted, or if a different `MONGODB_URI` is used.

## Using invoice templates

Templates are located in:

```text
server/assets/templates/template1.xlsx
server/assets/templates/template2.xlsx
```

The selected template is read by ExcelJS and saved as a generated invoice in:

```text
server/generated/
```

The application fills the supplied template cells as follows:

| Invoice detail | Template cell |
| --- | --- |
| Issuer GST number | `B6` |
| Issuer legal name | `B7` |
| Issuer registered address | `B8` |
| Invoice number | `A9` |
| Invoice date | `A10` |
| Customer company name | `B13` |
| Customer address | `A14` |
| Customer state code | `A15` |
| Customer GSTIN | `A16` |
| HSN/SAC code | `C20` |
| CTC | `D21` |
| Contract rate | `E21` |
| Service amount | `F21` and `G21` |
| Tax totals | `G24` onward |
| Amount in words | `A29` or `A30` |
| Bank details | Template-dependent lower section |
| Signing organisation name | `A36` or `A37` |

### Editing templates

You may change wording, formatting, fonts, column widths, row heights, borders, and merged cells directly in Excel. If you move any data field to another cell, update the matching cell reference in:

```text
server/src/services/invoiceWorkbook.service.js
```

Keep the template files as `.xlsx` files and retain their filenames unless you also update Organisation Settings and the workbook service.

## Pricing and tax rules

### Fixed contracts

For a fixed contract, the contract value is the invoice service amount.

Example:

```text
Pricing type: Fixed amount
Value: 15000
Invoice service amount: ₹15,000
```

### Percentage-of-CTC contracts

For a percentage contract, use decimal values:

| Desired fee | Contract value |
| --- | --- |
| 5% | `0.05` |
| 8.33% | `0.0833` |
| 10% | `0.10` |
| 100% | `1` |

Example:

```text
Pricing type: Percentage of CTC
Contract value: 0.10
Candidate CTC: ₹600,000
Invoice service amount: ₹60,000
```

### GST calculation

The GST branch state is compared with the configured organisation home state:

| Invoice condition | Tax applied |
| --- | --- |
| Company branch is in the organisation home state | CGST + SGST |
| Company branch is in another state | IGST |

The selected template follows the same rule:

- Intra-state template for CGST/SGST invoices.
- Interstate template for IGST invoices.

## User roles and security

### Admin

- Manage users.
- Create, edit, deactivate companies.
- Manage GST branches and contracts.
- Manage states.
- Configure organisation settings.
- Generate invoices.
- Permanently delete invoices and their generated workbook files.

### Operator

- Sign in.
- View invoice history.
- Generate and download invoices.
- Cannot access organisation, user, company-management, or invoice-deletion functions.

### Security measures

- Passwords are stored as bcrypt hashes, never plain text.
- Authentication uses JSON Web Tokens.
- Protected API routes require a valid JWT.
- Role-based authorization protects admin functions.
- Express rate limiting protects the API.
- Helmet adds standard HTTP security headers.
- Request validation is handled with Zod.

## GitHub Codespaces

Set Node.js 20 if necessary:

```bash
nvm install 20
nvm use 20
nvm alias default 20
```

Install packages:

```bash
npm install
npm run install:all
```

Use Codespaces-specific URLs in environment files.

### `server/.env`

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=8h
CLIENT_URL=https://YOUR-CODESPACE-NAME-5173.app.github.dev
PORT=5000
```

### `client/.env`

```env
VITE_API_URL=https://YOUR-CODESPACE-NAME-5000.app.github.dev/api
```

Start the application:

```bash
npm run dev
```

In the **Ports** tab:

- Open port `5173` to access the frontend.
- Ensure port `5000` is accessible to the browser. Temporarily set it to **Public** if cross-origin requests fail in Codespaces.

If environment values change, stop the development server with `Ctrl + C` and run `npm run dev` again.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install root dependencies. |
| `npm run install:all` | Install server and client dependencies. |
| `npm run dev` | Start React and Express development servers together. |
| `npm run start` | Start the backend server. |
| `npm run create-admin -- "Name" "email" "password"` | Create the first administrator. |

## Troubleshooting

### `Failed to fetch` at sign in

1. Open `/api/health` on port `5000` and confirm it returns `{"status":"ok"}`.
2. Confirm `VITE_API_URL` uses the **5000** forwarded URL and ends in `/api`.
3. Confirm `CLIENT_URL` uses the **5173** forwarded URL.
4. Restart `npm run dev` after editing either `.env` file.
5. In Codespaces, make port `5000` accessible to the browser.

### `401` at `/api/auth/login`

The server is reachable, but the email/password is incorrect. Delete the test user from the MongoDB `users` collection if required, then recreate it with a single-line `create-admin` command.

### Node engine warnings

The project requires Node 20+. Switch to Node 20 with NVM, then reinstall dependencies:

```bash
nvm use 20
rm -rf node_modules server/node_modules client/node_modules
npm install
npm run install:all
```

On Windows PowerShell, use this instead of `rm -rf`:

```powershell
Remove-Item -Recurse -Force node_modules, server/node_modules, client/node_modules
```

## Production notes

- Use a long, unique production `JWT_SECRET`.
- Restrict MongoDB Atlas network access to known IP addresses or approved deployment networks.
- Use HTTPS for frontend and backend deployments.
- Set `CLIENT_URL` to the exact deployed frontend origin.
- Store environment variables in your hosting provider’s secret manager, not in Git.
- Back up MongoDB regularly.
- Review legal/accounting rules before allowing permanent invoice deletion in a real production company deployment. Many organisations prefer invoice cancellation or credit-note workflows instead.
- Consider adding audit logs, backup retention, and soft deletion before enterprise deployment.
