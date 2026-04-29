import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rules } from '@/lib/config';

interface MarkAttendanceBody {
  employeeId: string;
  date: string;
  status: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');

    const where: { employeeId?: string; date?: { startsWith: string } } = {};
    if (employeeId) where.employeeId = employeeId;
    if (month) where.date = { startsWith: month };

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'asc' },
    });
    return NextResponse.json(records);
  } catch (err) {
    console.error('[GET /api/attendance]', err);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: MarkAttendanceBody = await req.json();
    const { employeeId, date, status } = body;

    if (!employeeId || !date || !status) {
      return NextResponse.json(
        { error: 'employeeId, date, and status are required' },
        { status: 400 },
      );
    }

    const today = new Date().toISOString().split('T')[0];

    if (!rules.canMarkFutureAttendance && date > today) {
      return NextResponse.json(
        { error: 'Marking future attendance is not allowed' },
        { status: 400 },
      );
    }

    if (!rules.canEditPastAttendance && date < today) {
      const existing = await prisma.attendance.findUnique({
        where: { employeeId_date: { employeeId, date } },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Editing past attendance records is not allowed' },
          { status: 403 },
        );
      }
    }

    const record = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date } },
      update: { status },
      create: { employeeId, date, status },
    });

    return NextResponse.json(record);
  } catch (err) {
    console.error('[POST /api/attendance]', err);
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
  }
}
