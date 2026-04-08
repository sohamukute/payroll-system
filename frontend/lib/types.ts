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
  dateOfJoining: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'PAID_LEAVE' | 'HALF_DAY' | 'HOLIDAY';
}

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
  calculatedAt: string;
}

export interface PayrollSummary {
  month: string;
  totalEmployees: number;
  totalPayroll: number;
  totalDeductions: number;
  processed: number;
}
