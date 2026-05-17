# GoalForge — Enterprise Goal & OKR Tracking Platform

GoalForge is a professional, production-ready, full-stack enterprise OKR and goal-setting platform designed for modern HR teams to align organization-wide KPIs, validate employee objectives, automate multi-level approvals, and enforce strict audit trails.

Designed and engineered for maximum stability, visual excellence, and demo-readiness, the platform utilizes a **Light Premium SaaS design system** and a **failsafe database architecture**.

---

## 🌟 Key Architecture & Features

### 💻 Frontend
- **Framework**: React + Vite (Fast ESM builds).
- **Styling**: TailwindCSS with premium light-theme design tokens, CSS variables, glassmorphism, and responsive grids.
- **Charts & Data**: Recharts for live status distribution (PieChart) and department analytics (BarChart).
- **Animations**: Framer Motion for smooth, premium transition effects and micro-interactions.

### ⚙️ Backend
- **Core**: Node.js & Express.js.
- **Security**: Hardened with `helmet`, `cors`, and `express-rate-limit`.
- **Validation**: Strict schema validation using Zod.
- **Authentication**: JWT-based secure auth using email+password with `bcryptjs` password hashing.

### 🗄️ Failsafe Database Architecture
GoalForge implements a robust, double-failover strategy to ensure the application **never** fails during a live demonstration:
1. **Primary**: Supabase PostgreSQL.
2. **Backup**: Local Docker PostgreSQL container.
3. **In-Memory Fallback**: If no database connection can be established, the system automatically falls back to a rich, pre-seeded in-memory store.

---

## 🎯 Realistic HR Workflow & Rules

The system implements the exact standard OKR policies required for enterprise performance reviews:
1. **Draft Phase**: Employees define their quarterly goals.
2. **Strict Validations**: Goals must total **exactly 100% weightage** and each goal must have a **minimum weightage of 10%** before submission is allowed.
3. **Manager Review**: Managers review submitted goals and can approve, reject with dynamic feedback, or inline-edit target values and weightage.
4. **Auto-Locking**: Approved goals automatically lock and become immutable.
5. **Cascading KPIs**: Administrators can cascaded org-wide shared goals to multiple departments and individuals.
6. **Audit Trail**: Every action (creation, edit, approval, rejection, lock, shared-goal cascade) is tracked in the compliance log.

---

## 🚀 Quick Start (Local Run)

### Prerequisites
- Node.js (v18+)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
cd backend
npx prisma generate
cd ..
```

### 3. Start Development Servers
Run both backend (port 5000) and frontend (port 5173) concurrently using:
```bash
npm run dev
```

---

## 🔑 Seeded Demo Credentials

Use these pre-configured accounts to test all user roles. All accounts use password: `password123`.

| Role | Email | Password |
| :--- | :--- | :--- |
| **Employee** | `employee@goalforge.com` | `password123` |
| **Manager** | `manager@goalforge.com` | `password123` |
| **Admin** | `admin@goalforge.com` | `password123` |

### Additional seeded profiles for rich dashboard analytics:
- **Priya Sharma** (`priya.sharma@goalforge.com`) — Employee (Engineering)
- **Rohit Kapoor** (`rohit.kapoor@goalforge.com`) — Employee (Sales, approved/locked goals)
- **Sneha Patel** (`sneha.patel@goalforge.com`) — Employee (Product)
- **Deepak Joshi** (`deepak.joshi@goalforge.com`) — Manager (Sales)

---

## 🐳 Docker Deployment

GoalForge is fully containerized and ready for production deployment:
```bash
docker-compose up --build
```
This boots up the Node.js API, Vite client, and a local PostgreSQL container pre-configured for automated failover.
