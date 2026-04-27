export const isDemoMode = process.env.DEMO_MODE === 'true';

export const rules = {
  canEditPastAttendance: isDemoMode,
  canMarkFutureAttendance: isDemoMode,
  canRerunPayroll: isDemoMode,
  canDeleteSalary: isDemoMode,
  sendRealEmails: !isDemoMode,
  payrollLocksAfterPaid: !isDemoMode,
};
