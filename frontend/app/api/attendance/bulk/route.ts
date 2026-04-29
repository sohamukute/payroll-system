import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface AttendanceRecord {
  employeeId: string;
  status: string;
}

interface BulkAttendanceBody {
  date: string;
  records: AttendanceRecord[];
}

export async function POST(req: NextRequest) {
  try {
    const body: BulkAttendanceBody = await req.json();
    const { date, records } = body;

    if (!date || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'date and a non-empty records array are required' },
        { status: 400 },
      );
    }

    const invalid = records.filter((r) => !r.employeeId || !r.status);
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: 'Each record must have employeeId and status' },
        { status: 400 },
      );
    }

    const results = await prisma.$transaction(
      records.map((r) =>
        prisma.attendance.upsert({
          where: { employeeId_date: { employeeId: r.employeeId, date } },
          update: { status: r.status },
          create: { employeeId: r.employeeId, date, status: r.status },
        }),
      ),
    );

    return NextResponse.json({ count: results.length, records: results });
  } catch (err) {
    console.error('[POST /api/attendance/bulk]', err);
    return NextResponse.json({ error: 'Failed to bulk-upsert attendance' }, { status: 500 });
  }
}
