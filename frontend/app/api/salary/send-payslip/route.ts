import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rules } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { salaryId } = await request.json() as { salaryId: string };
    if (!salaryId) return NextResponse.json({ error: 'salaryId required' }, { status: 400 });

    const salary = await prisma.salary.findUnique({
      where: { id: salaryId },
      include: { employee: true },
    });
    if (!salary) return NextResponse.json({ error: 'Salary not found' }, { status: 404 });

    const payslipHtml = generatePayslipHtml(salary);

    if (!rules.sendRealEmails) {
      console.log(`[DEMO] Would send payslip to ${salary.employee.email}`);
      console.log(payslipHtml);
      return NextResponse.json({ sent: true, demo: true, to: salary.employee.email });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: 'Payroll <payroll@company.com>',
      to: salary.employee.email,
      subject: `Payslip for ${salary.month} — ${salary.employee.firstName} ${salary.employee.lastName}`,
      html: payslipHtml,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ sent: true, to: salary.employee.email });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to send payslip' }, { status: 500 });
  }
}

function generatePayslipHtml(salary: any): string {
  const emp = salary.employee;
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  return `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1e293b;">
  <div style="background:#1e40af;color:white;padding:20px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0">Payslip — ${salary.month}</h2>
    <p style="margin:4px 0 0">${emp.firstName} ${emp.lastName} · ${emp.position}</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <tr><td style="padding:4px 0;color:#64748b">Department</td><td style="text-align:right">${emp.department}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Days Present</td><td style="text-align:right">${salary.presentDays}</td></tr>
    </table>
    <table style="width:100%;border-collapse:collapse">
      <tr style="background:#f8fafc"><th style="padding:8px;text-align:left">Earnings</th><th style="padding:8px;text-align:right">Amount</th></tr>
      <tr><td style="padding:6px 8px">Basic Salary</td><td style="text-align:right">${fmt(salary.basicSalary)}</td></tr>
      <tr><td style="padding:6px 8px">HRA</td><td style="text-align:right">${fmt(salary.hra)}</td></tr>
      <tr><td style="padding:6px 8px">DA</td><td style="text-align:right">${fmt(salary.da)}</td></tr>
      <tr><td style="padding:6px 8px">Special Allowance</td><td style="text-align:right">${fmt(salary.specialAllowance)}</td></tr>
      <tr style="font-weight:bold;background:#eff6ff"><td style="padding:8px">Total Earnings</td><td style="text-align:right">${fmt(salary.totalEarnings)}</td></tr>
    </table>
    <table style="width:100%;border-collapse:collapse;margin-top:12px">
      <tr style="background:#f8fafc"><th style="padding:8px;text-align:left">Deductions</th><th style="padding:8px;text-align:right">Amount</th></tr>
      <tr><td style="padding:6px 8px">Provident Fund</td><td style="text-align:right">${fmt(salary.providentFund)}</td></tr>
      <tr><td style="padding:6px 8px">ESI</td><td style="text-align:right">${fmt(salary.esi)}</td></tr>
      <tr><td style="padding:6px 8px">Income Tax</td><td style="text-align:right">${fmt(salary.incomeTax)}</td></tr>
      <tr><td style="padding:6px 8px">Professional Tax</td><td style="text-align:right">${fmt(salary.professionalTax)}</td></tr>
      <tr style="font-weight:bold;background:#fff1f2"><td style="padding:8px">Total Deductions</td><td style="text-align:right">${fmt(salary.totalDeductions)}</td></tr>
    </table>
    <div style="background:#1e40af;color:white;padding:16px;border-radius:8px;margin-top:16px;display:flex;justify-content:space-between">
      <span style="font-size:18px;font-weight:bold">Net Salary</span>
      <span style="font-size:18px;font-weight:bold">${fmt(salary.netSalary)}</span>
    </div>
  </div>
</body>
</html>`;
}
