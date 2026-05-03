import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const employeeId = request.nextUrl.searchParams.get('employeeId');
    const where = employeeId ? { employeeId } : {};
    const leaves = await prisma.leave.findMany({
      where,
      include: { employee: true },
      orderBy: { appliedAt: 'desc' },
    });
    return NextResponse.json(leaves);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch leaves' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    interface LeaveBody { employeeId: string; leaveType: string; startDate: string; endDate: string; days: number; reason: string; }
    const body = await request.json() as LeaveBody;
    const { employeeId, leaveType, startDate, endDate, days, reason } = body;
    if (!employeeId || !leaveType || !startDate || !endDate || !days || !reason) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }
    const leave = await prisma.leave.create({
      data: { employeeId, leaveType, startDate, endDate, days, reason, status: 'PENDING' },
      include: { employee: true },
    });
    return NextResponse.json(leave, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to apply leave' }, { status: 500 });
  }
}
