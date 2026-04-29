import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface CreateEmployeeBody {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  baseSalary: number;
  bankAccount?: string;
  ifscCode?: string;
  dateOfJoining?: string;
  status?: string;
}

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(employees);
  } catch (err) {
    console.error('[GET /api/employees]', err);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateEmployeeBody = await req.json();

    const { firstName, email, baseSalary } = body;
    if (!firstName || !email || baseSalary === undefined || baseSalary === null) {
      return NextResponse.json(
        { error: 'firstName, email, and baseSalary are required' },
        { status: 400 },
      );
    }

    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'An employee with this email already exists' },
        { status: 409 },
      );
    }

    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName: body.lastName ?? '',
        email,
        phone: body.phone ?? '',
        department: body.department ?? '',
        position: body.position ?? '',
        baseSalary: Number(baseSalary),
        bankAccount: body.bankAccount ?? '',
        ifscCode: body.ifscCode ?? 'SBIN0000001',
        dateOfJoining: body.dateOfJoining ?? new Date().toISOString().split('T')[0],
        status: body.status ?? 'ACTIVE',
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (err) {
    console.error('[POST /api/employees]', err);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
