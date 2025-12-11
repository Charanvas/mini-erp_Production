# Construction ERP & Finance System

A full-stack Enterprise Resource Planning (ERP) and Finance Management system tailored for the construction industry, featuring AI-driven insights for project risk assessment.

## 🚀 Features

### Core Modules
- **User Management**: Role-based access control (Admin, Finance Manager, Project Manager, User)
- **Dashboard**: Real-time KPIs, charts, and alerts
- **Project Management**: Track budgets, progress, and timelines
- **Finance Module**: Complete accounting system with GL, journal entries, and financial statements
- **AI Insights**: Risk assessment, cash flow forecasting, and project health analysis

### Finance Features
- Chart of Accounts
- Journal Entries & Posting
- Balance Sheet, P&L, Cash Flow Statements
- Accounts Receivable/Payable
- Invoice Management
- Payment Tracking
- Multi-Currency Support

### AI Capabilities
- Project Risk Scoring
- Cash Flow Forecasting
- Budget Overrun Detection
- Schedule Delay Analysis

## 🛠️ Tech Stack

**Frontend:**
- React.js 18
- Vite
- React Router v6
- Axios
- Chart.js / React-ChartJS-2
- TailwindCSS
- React Hot Toast

**Backend:**
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- bcryptjs

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Navigate to server directory:
```bash
cd server
Install dependencies:
bash
npm install
Create .env file:
bash
cp .env.example .env
Update .env with your configuration:
env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=construction_erp
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
Create database:
bash
createdb construction_erp
Run database migrations:
bash
psql -U postgres -d construction_erp -f ./scripts/createTables.sql
Seed initial data:
bash
psql -U postgres -d construction_erp -f ./scripts/seedData.sql
Start server:
bash
npm run dev
Server will run on http://localhost:5000

Frontend Setup
Navigate to client directory:
bash
cd client
Install dependencies:
bash
npm install
Create .env file:
bash
cp .env.example .env
Update .env:
env
VITE_API_URL=http://localhost:5000/api
Start development server:
bash
npm run dev
Frontend will run on http://localhost:5173

👤 Default Users
After seeding, you can login with:

Admin:

Username: admin
Password: Admin@123
Finance Manager:

Username: finance
Password: Admin@123
Project Manager:

Username: pm1
Password: Admin@123
📁 Project Structure
text
mini-erp-construction/
├── server/                 # Backend
│   ├── config/            # Configuration files
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Auth & error handlers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── scripts/          # Database scripts
└── client/                # Frontend
    ├── public/           # Static files
    └── src/
        ├── components/   # Reusable components
        ├── context/      # React context
        ├── pages/        # Page components
        ├── services/     # API services
        └── utils/        # Utilities
🔑 API Endpoints
Authentication
POST /api/auth/register - Register new user
POST /api/auth/login - User login
GET /api/auth/me - Get current user
Dashboard
GET /api/dashboard/kpis - Get dashboard KPIs
GET /api/dashboard/financial - Get financial dashboard
Projects
GET /api/projects - List projects
POST /api/projects - Create project
GET /api/projects/:id - Get project details
PUT /api/projects/:id - Update project
POST /api/projects/:id/progress - Record progress
Finance
GET /api/finance/accounts - List accounts
POST /api/finance/accounts - Create account
GET /api/finance/journal-entries - List journal entries
POST /api/finance/journal-entries - Create entry
GET /api/finance/balance-sheet - Get balance sheet
GET /api/finance/profit-loss - Get P&L statement
Insights
GET /api/insights/risks - Get all project risks
GET /api/insights/risks/:id - Get project risk
GET /api/insights/cash-flow-forecast - Get cash flow forecast