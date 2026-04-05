'use client';
import { Bell, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-sm font-semibold text-slate-800">Payroll Management System</h1>
        <p className="text-xs text-slate-500">Manage your organization payroll</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-500">
          <Bell className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-slate-700">Admin</span>
        </div>
      </div>
    </header>
  );
}
