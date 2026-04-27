export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function maskAccount(account: string): string {
  if (!account || account.length < 4) return '****';
  return '*'.repeat(account.length - 4) + account.slice(-4);
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    INACTIVE: 'bg-red-100 text-red-700',
    PRESENT: 'bg-green-100 text-green-700',
    ABSENT: 'bg-red-100 text-red-700',
    PAID_LEAVE: 'bg-blue-100 text-blue-700',
    HALF_DAY: 'bg-yellow-100 text-yellow-700',
    DRAFT: 'bg-gray-100 text-gray-600',
    CALCULATED: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-indigo-100 text-indigo-700',
    PAID: 'bg-green-100 text-green-700',
    PROCESSED: 'bg-blue-100 text-blue-700',
    LOCKED: 'bg-slate-200 text-slate-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getDaysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}
