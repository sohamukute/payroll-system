import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface UpdateEmployeeBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  baseSalary?: number;
  bankAccount?: string;
  ifscCode?: string;
  dateOfJoining?: string;
  status?: string;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    return NextResponse.json(employee);
  } catch (err) {
    console.error('[GET /api/employees/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body: UpdateEmployeeBody = await req.json();

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.baseSalary !== undefined) updateData.baseSalary = Number(body.baseSalary);
    if (body.bankAccount !== undefined) updateData.bankAccount = body.bankAccount;
    if (body.ifscCode !== undefined) updateData.ifscCode = body.ifscCode;
    if (body.dateOfJoining !== undefined) updateData.dateOfJoining = body.dateOfJoining;
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await prisma.employee.update({ where: { id }, data: updateData });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PUT /api/employees/[id]]', err);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    const updated = await prisma.employee.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[DELETE /api/employees/[id]]', err);
    return NextResponse.json({ error: 'Failed to deactivate employee' }, { status: 500 });
  }
}
