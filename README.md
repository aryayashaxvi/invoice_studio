# Invoice Studio

A secure, database-driven invoice generator for recruitment and placement businesses. Invoice Studio provides a React administration portal, an Express/MongoDB API, JWT-based access control, and ExcelJS-generated invoices based on reusable Excel templates.

## Features

- Secure JWT authentication with `admin` and `operator` roles
- Admin management of users, companies, GST branches, and contract rates
- Dynamic company setup: no company, GST, or contract data is hardcoded
- Fixed-fee and percentage-of-CTC contract pricing
- ExcelJS invoice generation from existing `.xlsx` templates
- Automatic CGST/SGST calculation for Haryana and IGST calculation for other states
- Downloadable invoice history with immutable snapshots of the company, branch, and contract used
- Soft company deactivation, preserving historical invoice records
- Input validation, rate limiting, secure password hashing, Helmet headers, and CORS configuration

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, CSS |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT) |
| Excel output | ExcelJS |

## Project structure

```text
invoice-generator-mern/
├── client/                         # React + Vite frontend
│   ├── src/
│   │   ├── AdminWorkspace.jsx       # Company, GST, contracts, and user management
│   │   ├── App.jsx                  # Authenticated application shell
│   │   ├── InvoiceWorkspace.jsx     # Invoice generation workflow
│   │   └── LoginPage.jsx            # Login screen
│   └── .env.example
├── server/                         # Express + MongoDB API
│   ├── assets/templates/            # Original invoice templates
│   ├── src/
│   │   ├── controllers/             # Request validation and business rules
│   │   ├── middleware/auth.js       # JWT and role authorization
│   │   ├── models/                  # MongoDB schemas
│   │   ├── services/                # ExcelJS workbook generation
│   │   └── scripts/createAdmin.js   # First administrator setup
│   └── generated/                   # Generated invoices (runtime, Git-ignored)
├── .env.example
└── package.json
```

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- MongoDB Community Server **or** a MongoDB Atlas database

## Installation

1. Clone the repository.

   ```bash
   git clone https://github.com/your-username/invoice-studio.git
   cd invoice-studio
   ```

2. Create environment files.

   ```bash
   cp .env.example .env
   cp client/.env.example client/.env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   Copy-Item client/.env.example client/.env
   ```

3. Configure `.env`.

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/invoice_generator
   JWT_SECRET=replace-this-with-a-long-random-secret-of-at-least-32-characters
   JWT_EXPIRES_IN=8h
   CLIENT_URL=http://localhost:5173
   PORT=5000
   ```

   For MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

4. Configure `client/.env`.

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. Install dependencies.

   ```bash
   npm install
   npm run install:all
   ```

6. Create the first administrator account.

   ```bash
   npm run create-admin -- "Administrator Name" admin@company.com "StrongPasswordHere"
   ```

7. Start the development servers.

   ```bash
   npm run dev
   ```

   Open `http://localhost:5173` in your browser.

## User roles

| Role | Permissions |
| --- | --- |
| Admin | Create and deactivate users; create, update, activate, and deactivate companies; manage GST branches and contracts; generate and download invoices. |
| Operator | Generate and download invoices only. |

## Company setup workflow

1. Sign in as an administrator.
2. Open **Company & access management**.
3. Create a company with a unique code and legal name.
4. Add GST branches with state, state code, GSTIN, address, city, billing state, and PIN.
5. Add contract grades with either a fixed fee or a percentage rate.
6. Create operators from the **User access** area.

Companies can be deactivated rather than permanently deleted. This prevents new invoice generation while preserving historic invoices and auditability.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run install:all` | Installs frontend and backend dependencies. |
| `npm run dev` | Starts the React and Express development servers together. |
| `npm run start` | Starts the production Express server. |
| `npm run create-admin -- "Name" email password` | Creates or resets the first administrator account. |

## Security notes

- Keep `.env` private and never commit it to GitHub.
- Use a strong, unique `JWT_SECRET` in production.
- Configure `CLIENT_URL` to your deployed frontend URL before deployment.
- Use HTTPS and a managed MongoDB backup strategy in production.
- Store generated invoices in durable object storage such as S3, Azure Blob Storage, or Google Cloud Storage for production deployments.


