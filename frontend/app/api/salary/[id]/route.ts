import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface PatchSalaryBody {
  cycleStatus: string;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');

    // Support lookup by query params instead of path id
    if (employeeId && month) {
      const salary = await prisma.salary.findUnique({
        where: { employeeId_month: { employeeId, month } },
        include: { employee: true },
      });
      if (!salary) {
        return NextResponse.json({ error: 'Salary record not found' }, { status: 404 });
      }
      return NextResponse.json(salary);
    }

    const salary = await prisma.salary.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!salary) {
      return NextResponse.json({ error: 'Salary record not found' }, { status: 404 });
    }
    return NextResponse.json(salary);
  } catch (err) {
    console.error('[GET /api/salary/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch salary' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body: PatchSalaryBody = await req.json();
    const { cycleStatus } = body;

    if (!cycleStatus) {
      return NextResponse.json({ error: 'cycleStatus is required' }, { status: 400 });
    }

    const existing = await prisma.salary.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Salary record not found' }, { status: 404 });
    }

    const updated = await prisma.salary.update({
      where: { id },
      data: { cycleStatus },
      include: { employee: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/salary/[id]]', err);
    return NextResponse.json({ error: 'Failed to update salary status' }, { status: 500 });
  }
}
