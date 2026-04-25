# Payroll Management System

Payroll system built in Java with a Next.js web dashboard. Handles employees, attendance, salary calculation, and payslip generation for Indian payroll (FY 2025-26 new tax regime).

---

## What it does

- Add and manage employees
- Mark daily attendance (present, absent, leave, half day)
- Calculate monthly salary with pro-rata deductions
- PF, ESI, income tax (87A rebate), professional tax
- Generate and download payslips
- Process full company payroll at once
- Reports and charts

---

## Run the dashboard

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

---

## Tech

- Java 11, Maven, JUnit 5
- Next.js 14, TypeScript, Tailwind CSS, Recharts
