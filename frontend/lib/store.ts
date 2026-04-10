'use client';
import { Employee, Attendance, Salary } from './types';

const EMPLOYEES_KEY = 'payroll_employees';
const ATTENDANCE_KEY = 'payroll_attendance';
const SALARIES_KEY = 'payroll_salaries';

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, data: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

let idCounter = 1000;
function nextId(prefix: string) {
  return `${prefix}${++idCounter}`;
}

export function getEmployees(): Employee[] {
  return load<Employee[]>(EMPLOYEES_KEY, []);
}

export function saveEmployee(emp: Omit<Employee, 'id'>): Employee {
  const employees = getEmployees();
  const existing = employees.find(e => e.email === emp.email);
  if (existing) throw new Error('Employee with this email already exists');
  const newEmp: Employee = { ...emp, id: nextId('EMP') };
  employees.push(newEmp);
  save(EMPLOYEES_KEY, employees);
  return newEmp;
}

export function updateEmployee(emp: Employee): Employee {
  const employees = getEmployees();
  const idx = employees.findIndex(e => e.id === emp.id);
  if (idx === -1) throw new Error('Employee not found');
  employees[idx] = emp;
  save(EMPLOYEES_KEY, employees);
  return emp;
}

export function deleteEmployee(id: string) {
  const employees = getEmployees();
  const idx = employees.findIndex(e => e.id === id);
  if (idx !== -1) {
    employees[idx].status = 'INACTIVE';
    save(EMPLOYEES_KEY, employees);
  }
}

export function getAttendance(): Attendance[] {
  return load<Attendance[]>(ATTENDANCE_KEY, []);
}

export function getAttendanceForMonth(employeeId: string, month: string): Attendance[] {
  return getAttendance().filter(a => a.employeeId === employeeId && a.date.startsWith(month));
}

export function markAttendance(att: Omit<Attendance, 'id'>): Attendance {
  const all = getAttendance();
  const existing = all.find(a => a.employeeId === att.employeeId && a.date === att.date);
  if (existing) {
    existing.status = att.status;
    save(ATTENDANCE_KEY, all);
    return existing;
  }
  const newAtt: Attendance = { ...att, id: nextId('ATT') };
  all.push(newAtt);
  save(ATTENDANCE_KEY, all);
  return newAtt;
}

export function getSalaries(): Salary[] {
  return load<Salary[]>(SALARIES_KEY, []);
}

export function getSalaryForMonth(employeeId: string, month: string): Salary | null {
  return getSalaries().find(s => s.employeeId === employeeId && s.month === month) ?? null;
}

export function getSalariesForMonth(month: string): Salary[] {
  return getSalaries().filter(s => s.month === month);
}

export function calculateAndSaveSalary(employee: Employee, month: string): Salary {
  const attendance = getAttendanceForMonth(employee.id, month);
  const [year, mon] = month.split('-').map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();

  let presentDays = 0, paidLeaveDays = 0, absentDays = 0;
  let effectiveDays = 0;

  for (const a of attendance) {
    if (a.status === 'PRESENT') { presentDays++; effectiveDays += 1; }
    else if (a.status === 'PAID_LEAVE') { paidLeaveDays++; effectiveDays += 1; }
    else if (a.status === 'HALF_DAY') { effectiveDays += 0.5; }
    else if (a.status === 'ABSENT') { absentDays++; }
  }

  const basicSalary = Math.round((employee.baseSalary / daysInMonth) * effectiveDays * 100) / 100;
  const hra = Math.round(basicSalary * 0.40 * 100) / 100;
  const da = Math.round(basicSalary * 0.50 * 100) / 100;
  const specialAllowance = Math.round(basicSalary * 0.10 * 100) / 100;
  const totalEarnings = Math.round((basicSalary + hra + da + specialAllowance) * 100) / 100;

  const providentFund = Math.round((basicSalary + da) * 0.12 * 100) / 100;
  const esi = totalEarnings <= 21000 ? Math.round(totalEarnings * 0.0075 * 100) / 100 : 0;
  const annualTax = calculateAnnualTax(employee.baseSalary);
  const incomeTax = Math.round((annualTax / 12) * 100) / 100;
  const professionalTax = totalEarnings > 15000 ? 200 : 0;
  const totalDeductions = Math.round((providentFund + esi + incomeTax + professionalTax) * 100) / 100;
  const netSalary = Math.round((totalEarnings - totalDeductions) * 100) / 100;

  const salary: Salary = {
    id: nextId('SAL'),
    employeeId: employee.id,
    month,
    basicSalary,
    hra,
    da,
    specialAllowance,
    bonus: 0,
    totalEarnings,
    providentFund,
    esi,
    incomeTax,
    professionalTax,
    totalDeductions,
    netSalary,
    presentDays,
    paidLeaveDays,
    absentDays,
    workingDays: Math.round(effectiveDays),
    status: 'CALCULATED',
    calculatedAt: new Date().toISOString(),
  };

  const all = getSalaries();
  const idx = all.findIndex(s => s.employeeId === employee.id && s.month === month);
  if (idx !== -1) all[idx] = salary;
  else all.push(salary);
  save(SALARIES_KEY, all);
  return salary;
}

function calculateAnnualTax(annualSalary: number): number {
  if (annualSalary <= 250000) return 0;
  if (annualSalary <= 500000) return (annualSalary - 250000) * 0.05;
  if (annualSalary <= 1000000) return 12500 + (annualSalary - 500000) * 0.20;
  return 112500 + (annualSalary - 1000000) * 0.30;
}

export function seedDemoData() {
  if (getEmployees().length > 0) return;

  const demoEmployees: Omit<Employee, 'id'>[] = [
    { firstName: 'Raj', lastName: 'Kumar', email: 'raj.kumar@company.com', phone: '9876543210',
      department: 'Engineering', position: 'Software Engineer', baseSalary: 50000,
      bankAccount: 'ACC001234567890', dateOfJoining: '2024-01-15', status: 'ACTIVE' },
    { firstName: 'Priya', lastName: 'Singh', email: 'priya.singh@company.com', phone: '9876543211',
      department: 'HR', position: 'HR Manager', baseSalary: 45000,
      bankAccount: 'ACC001234567891', dateOfJoining: '2024-02-01', status: 'ACTIVE' },
    { firstName: 'Amit', lastName: 'Patel', email: 'amit.patel@company.com', phone: '9876543212',
      department: 'Finance', position: 'Finance Analyst', baseSalary: 55000,
      bankAccount: 'ACC001234567892', dateOfJoining: '2023-11-10', status: 'ACTIVE' },
    { firstName: 'Neha', lastName: 'Sharma', email: 'neha.sharma@company.com', phone: '9876543213',
      department: 'Operations', position: 'Operations Lead', baseSalary: 40000,
      bankAccount: 'ACC001234567893', dateOfJoining: '2024-03-01', status: 'ACTIVE' },
    { firstName: 'Vikram', lastName: 'Gupta', email: 'vikram.gupta@company.com', phone: '9876543214',
      department: 'Engineering', position: 'Senior Engineer', baseSalary: 60000,
      bankAccount: 'ACC001234567894', dateOfJoining: '2023-06-15', status: 'ACTIVE' },
  ];

  const saved: Employee[] = [];
  for (const e of demoEmployees) {
    const s = saveEmployee(e);
    saved.push(s);
  }

  const month = '2026-04';
  const [y, m] = month.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();

  for (const emp of saved) {
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m - 1, d);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue;
      const ds = `${month}-${String(d).padStart(2, '0')}`;
      let status: Attendance['status'] = 'PRESENT';
      if (d % 15 === 0) status = 'PAID_LEAVE';
      else if (d % 20 === 0) status = 'ABSENT';
      markAttendance({ employeeId: emp.id, date: ds, status });
    }
  }
}
