import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const isDemoMode = process.env.DEMO_MODE === 'true';
const isDev = process.env.NODE_ENV === 'development';

const DEMO_EMPLOYEES = [
  { firstName: 'Raj', lastName: 'Kumar', email: 'raj.kumar@company.com', phone: '9876543210',
    department: 'Engineering', position: 'Software Engineer', baseSalary: 50000,
    bankAccount: 'ACC001234567890', ifscCode: 'SBIN0000001', dateOfJoining: '2024-01-15', status: 'ACTIVE' },
  { firstName: 'Priya', lastName: 'Singh', email: 'priya.singh@company.com', phone: '9876543211',
    department: 'HR', position: 'HR Manager', baseSalary: 45000,
    bankAccount: 'ACC001234567891', ifscCode: 'HDFC0000001', dateOfJoining: '2024-02-01', status: 'ACTIVE' },
  { firstName: 'Amit', lastName: 'Patel', email: 'amit.patel@company.com', phone: '9876543212',
    department: 'Finance', position: 'Finance Analyst', baseSalary: 55000,
    bankAccount: 'ACC001234567892', ifscCode: 'ICIC0000001', dateOfJoining: '2023-11-10', status: 'ACTIVE' },
  { firstName: 'Neha', lastName: 'Sharma', email: 'neha.sharma@company.com', phone: '9876543213',
    department: 'Operations', position: 'Operations Lead', baseSalary: 40000,
    bankAccount: 'ACC001234567893', ifscCode: 'AXIS0000001', dateOfJoining: '2024-03-01', status: 'ACTIVE' },
  { firstName: 'Vikram', lastName: 'Gupta', email: 'vikram.gupta@company.com', phone: '9876543214',
    department: 'Engineering', position: 'Senior Engineer', baseSalary: 60000,
    bankAccount: 'ACC001234567894', ifscCode: 'SBIN0000002', dateOfJoining: '2023-06-15', status: 'ACTIVE' },
];

export async function POST() {
  if (!isDemoMode && !isDev) {
    return NextResponse.json(
      { error: 'Seed is only available in DEMO_MODE or development' },
      { status: 403 },
    );
  }

  try {
    const existing = await prisma.employee.count();
    if (existing > 0) {
      return NextResponse.json({ skipped: true, message: 'Employees already exist' });
    }

    const created: { id: string; email: string }[] = [];

    for (const emp of DEMO_EMPLOYEES) {
      const employee = await prisma.employee.create({ data: emp });
      created.push({ id: employee.id, email: employee.email });

      // Seed attendance for April 2026
      const month = '2026-04';
      const [y, m] = month.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(y, m - 1, d);
        const dow = date.getDay();
        if (dow === 0 || dow === 6) continue; // skip weekends

        const ds = `${month}-${String(d).padStart(2, '0')}`;
        let status = 'PRESENT';
        if (d % 15 === 0) status = 'PAID_LEAVE';
        else if (d % 20 === 0) status = 'ABSENT';

        await prisma.attendance.create({
          data: { employeeId: employee.id, date: ds, status },
        });
      }
    }

    return NextResponse.json({ skipped: false, created });
  } catch (err) {
    console.error('[POST /api/seed]', err);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
