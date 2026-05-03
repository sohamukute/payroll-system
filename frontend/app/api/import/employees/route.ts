import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ImportRow {
  firstName: string; lastName: string; email: string; phone: string;
  department: string; position: string; baseSalary: string;
  bankAccount: string; ifscCode: string; dateOfJoining: string; status?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { rows } = await request.json() as { rows: ImportRow[] };
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
    }

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const row of rows) {
      if (!row.firstName || !row.email || !row.baseSalary) {
        results.errors.push(`Row skipped: missing required fields (email: ${row.email || 'unknown'})`);
        continue;
      }
      const salary = parseFloat(row.baseSalary);
      if (isNaN(salary) || salary <= 0) {
        results.errors.push(`Invalid salary for ${row.email}`);
        continue;
      }
      try {
        await prisma.employee.upsert({
          where: { email: row.email },
          update: {},
          create: {
            firstName: row.firstName, lastName: row.lastName || '', email: row.email,
            phone: row.phone || '', department: row.department || 'General',
            position: row.position || 'Employee', baseSalary: salary,
            bankAccount: row.bankAccount || '', ifscCode: row.ifscCode || 'SBIN0000001',
            dateOfJoining: row.dateOfJoining || new Date().toISOString().split('T')[0],
            status: (row.status as any) || 'ACTIVE',
          },
        });
        results.created++;
      } catch {
        results.skipped++;
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
