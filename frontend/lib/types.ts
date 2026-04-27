export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  baseSalary: number;
  bankAccount: string;
  ifscCode: string;
  dateOfJoining: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'PAID_LEAVE' | 'HALF_DAY' | 'HOLIDAY';
}

export type CycleStatus = 'DRAFT' | 'PROCESSED' | 'PAID' | 'LOCKED';

export interface Salary {
  id: string;
  employeeId: string;
  month: string;
  basicSalary: number;
  hra: number;
  da: number;
  specialAllowance: number;
  bonus: number;
  totalEarnings: number;
  providentFund: number;
  esi: number;
  incomeTax: number;
  professionalTax: number;
  totalDeductions: number;
  netSalary: number;
  presentDays: number;
  paidLeaveDays: number;
  absentDays: number;
  workingDays: number;
  status: 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID';
  cycleStatus: CycleStatus;
  calculatedAt: string;
}

export interface SalaryWithEmployee extends Salary {
  employee: Pick<Employee, 'firstName' | 'lastName' | 'department'>;
}

export interface PayrollSummary {
  month: string;
  totalEmployees: number;
  totalPayroll: number;
  totalDeductions: number;
  processed: number;
}
