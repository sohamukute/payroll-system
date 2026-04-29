import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rules } from '@/lib/config';

interface CalculateSalaryBody {
  employeeId: string;
  month: string; // YYYY-MM
}

function getDaysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

function calculateAnnualTax(annualSalary: number): number {
  if (annualSalary <= 250000) return 0;
  if (annualSalary <= 500000) return (annualSalary - 250000) * 0.05;
  if (annualSalary <= 1000000) return 12500 + (annualSalary - 500000) * 0.20;
  return 112500 + (annualSalary - 1000000) * 0.30;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');

    const salaries = await prisma.salary.findMany({
      where: month ? { month } : undefined,
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(salaries);
  } catch (err) {
    console.error('[GET /api/salary]', err);
    return NextResponse.json({ error: 'Failed to fetch salaries' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CalculateSalaryBody = await req.json();
    const { employeeId, month } = body;

    if (!employeeId || !month) {
      return NextResponse.json(
        { error: 'employeeId and month are required' },
        { status: 400 },
      );
    }

    // DEMO_MODE guard: block rerun if existing salary is not DRAFT
    if (!rules.canRerunPayroll) {
      const existing = await prisma.salary.findUnique({
        where: { employeeId_month: { employeeId, month } },
      });
      if (existing && existing.cycleStatus !== 'DRAFT') {
        return NextResponse.json(
          { error: 'Payroll has already been processed for this period and cannot be rerun' },
          { status: 403 },
        );
      }
    }

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Fetch attendance for the month
    const attendanceRecords = await prisma.attendance.findMany({
      where: { employeeId, date: { startsWith: month } },
    });

    const daysInMonth = getDaysInMonth(month);
    let presentDays = 0;
    let paidLeaveDays = 0;
    let absentDays = 0;
    let halfDays = 0;
    let effectiveDays = 0;

    for (const a of attendanceRecords) {
      if (a.status === 'PRESENT') { presentDays++; effectiveDays += 1; }
      else if (a.status === 'PAID_LEAVE') { paidLeaveDays++; effectiveDays += 1; }
      else if (a.status === 'HALF_DAY') { halfDays++; effectiveDays += 0.5; }
      else if (a.status === 'ABSENT') { absentDays++; }
    }

    const basicSalary = round2((employee.baseSalary / daysInMonth) * effectiveDays);
    const hra = round2(basicSalary * 0.40);
    const da = round2(basicSalary * 0.50);
    const specialAllowance = round2(basicSalary * 0.10);
    const totalEarnings = round2(basicSalary + hra + da + specialAllowance);

    const providentFund = round2((basicSalary + da) * 0.12);
    const esi = totalEarnings <= 21000 ? round2(totalEarnings * 0.0075) : 0;
    const incomeTax = round2(calculateAnnualTax(employee.baseSalary) / 12);
    const professionalTax = totalEarnings > 15000 ? 200 : 0;
    const totalDeductions = round2(providentFund + esi + incomeTax + professionalTax);
    const netSalary = round2(totalEarnings - totalDeductions);

    const salary = await prisma.salary.upsert({
      where: { employeeId_month: { employeeId, month } },
      update: {
        basicSalary,
        hra,
        da,
        specialAllowance,
        totalEarnings,
        providentFund,
        esi,
        incomeTax,
        professionalTax,
        totalDeductions,
        netSalary,
        presentDays,
        paidLeaveDays,
        absentDays,
        halfDays,
        cycleStatus: 'DRAFT',
      },
      create: {
        employeeId,
        month,
        basicSalary,
        hra,
        da,
        specialAllowance,
        totalEarnings,
        providentFund,
        esi,
        incomeTax,
        professionalTax,
        totalDeductions,
        netSalary,
        presentDays,
        paidLeaveDays,
        absentDays,
        halfDays,
        cycleStatus: 'DRAFT',
      },
      include: { employee: true },
    });

    return NextResponse.json(salary);
  } catch (err) {
    console.error('[POST /api/salary]', err);
    return NextResponse.json({ error: 'Failed to calculate salary' }, { status: 500 });
  }
}
