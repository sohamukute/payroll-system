import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: { email: 'admin@company.com', password: hashed, name: 'Admin', role: 'ADMIN' },
  });

  const employees = [
    { firstName: 'Raj', lastName: 'Kumar', email: 'raj.kumar@company.com', phone: '9876543210', department: 'Engineering', position: 'Software Engineer', baseSalary: 50000, bankAccount: 'ACC001234567890', ifscCode: 'SBIN0000001', dateOfJoining: '2024-01-15', status: 'ACTIVE' },
    { firstName: 'Priya', lastName: 'Singh', email: 'priya.singh@company.com', phone: '9876543211', department: 'HR', position: 'HR Manager', baseSalary: 45000, bankAccount: 'ACC001234567891', ifscCode: 'HDFC0000001', dateOfJoining: '2024-02-01', status: 'ACTIVE' },
    { firstName: 'Amit', lastName: 'Patel', email: 'amit.patel@company.com', phone: '9876543212', department: 'Finance', position: 'Finance Analyst', baseSalary: 55000, bankAccount: 'ACC001234567892', ifscCode: 'ICIC0000001', dateOfJoining: '2023-11-10', status: 'ACTIVE' },
    { firstName: 'Neha', lastName: 'Sharma', email: 'neha.sharma@company.com', phone: '9876543213', department: 'Operations', position: 'Operations Lead', baseSalary: 40000, bankAccount: 'ACC001234567893', ifscCode: 'AXIS0000001', dateOfJoining: '2024-03-01', status: 'ACTIVE' },
    { firstName: 'Vikram', lastName: 'Gupta', email: 'vikram.gupta@company.com', phone: '9876543214', department: 'Engineering', position: 'Senior Engineer', baseSalary: 60000, bankAccount: 'ACC001234567894', ifscCode: 'SBIN0000002', dateOfJoining: '2023-06-15', status: 'ACTIVE' },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { email: emp.email },
      update: {},
      create: emp,
    });
  }

  console.log('Seed complete');
}

main().catch(console.error).finally(() => prisma.$disconnect());
