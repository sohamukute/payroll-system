import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const month = request.nextUrl.searchParams.get('month');
    if (!month) return NextResponse.json({ error: 'month required' }, { status: 400 });

    const salaries = await prisma.salary.findMany({
      where: { month },
      include: { employee: true },
      orderBy: { employee: { firstName: 'asc' } },
    });

    const rows = [
      ['Sr No', 'Employee Name', 'Account Number', 'IFSC Code', 'Amount', 'Email', 'Reference'].join(','),
      ...salaries.map((s, i) => [
        i + 1,
        `"${s.employee.firstName} ${s.employee.lastName}"`,
        s.employee.bankAccount,
        s.employee.ifscCode,
        s.netSalary.toFixed(2),
        s.employee.email,
        `PAY-${month}-${String(i + 1).padStart(3, '0')}`,
      ].join(',')),
    ].join('\n');

    return new NextResponse(rows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="bank-transfer-${month}.csv"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to generate transfer file' }, { status: 500 });
  }
}
