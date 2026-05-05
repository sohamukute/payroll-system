'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Employee, Attendance } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'PAID_LEAVE' | 'HALF_DAY' | 'HOLIDAY';

interface Toast {
  id: number;
  message: string;
  kind: 'success' | 'error';
}

interface PopoverState {
  dateStr: string;          // 'YYYY-MM-DD'
  anchorRect: DOMRect;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; short: string; bg: string; text: string; btn: string }
> = {
  PRESENT:    { label: 'Present',    short: 'P',  bg: 'bg-green-100', text: 'text-green-800', btn: 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100' },
  ABSENT:     { label: 'Absent',     short: 'A',  bg: 'bg-red-100',   text: 'text-red-800',   btn: 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100'         },
  PAID_LEAVE: { label: 'Paid Leave', short: 'PL', bg: 'bg-blue-100',  text: 'text-blue-800',  btn: 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100'     },
  HALF_DAY:   { label: 'Half Day',   short: 'HD', bg: 'bg-amber-100', text: 'text-amber-800', btn: 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100' },
  HOLIDAY:    { label: 'Holiday',    short: 'H',  bg: 'bg-gray-100',  text: 'text-gray-600',  btn: 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'     },
};

const STATUSES = Object.keys(STATUS_CONFIG) as AttendanceStatus[];

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Returns ISO week-day index 0=Mon … 6=Sun */
function isoWeekDay(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
}

function todayStr(): string {
  // Using 2026-05-10 as today per project context
  const now = new Date();
  return toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white
            transition-all duration-300 pointer-events-auto
            ${t.kind === 'success' ? 'bg-green-600' : 'bg-red-600'}
          `}
        >
          {t.kind === 'success' ? '✓' : '✕'} {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AttendancePage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const today = todayStr();
  const [todayY, todayM] = today.split('-').map(Number);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [year, setYear] = useState(todayY);
  const [month, setMonth] = useState(todayM);

  const [records, setRecords] = useState<Attendance[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [marking, setMarking] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  const popoverRef = useRef<HTMLDivElement>(null);

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const pushToast = useCallback((message: string, kind: 'success' | 'error') => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  // ── Fetch employees on mount ───────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/employees')
      .then((r) => r.json())
      .then((data: Employee[]) => {
        if (Array.isArray(data)) {
          setEmployees(data.filter((e) => e.status === 'ACTIVE'));
        }
      })
      .catch(() => pushToast('Failed to load employees', 'error'));
  }, [pushToast]);

  // ── Fetch attendance when employee or month changes ────────────────────────
  const fetchAttendance = useCallback(
    async (empId: string, y: number, m: number) => {
      setLoadingRecords(true);
      const monthStr = `${y}-${String(m).padStart(2, '0')}`;
      try {
        const r = await fetch(`/api/attendance?employeeId=${empId}&month=${monthStr}`);
        const data: Attendance[] = await r.json();
        if (Array.isArray(data)) setRecords(data);
        else setRecords([]);
      } catch {
        pushToast('Failed to load attendance', 'error');
        setRecords([]);
      } finally {
        setLoadingRecords(false);
      }
    },
    [pushToast],
  );

  useEffect(() => {
    if (selectedId) fetchAttendance(selectedId, year, month);
    else setRecords([]);
  }, [selectedId, year, month, fetchAttendance]);

  // ── Close popover on outside click ────────────────────────────────────────
  useEffect(() => {
    if (!popover) return;
    function onDown(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [popover]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const attMap: Record<string, AttendanceStatus> = {};
  for (const r of records) attMap[r.date] = r.status as AttendanceStatus;

  const filteredEmployees = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q)
    );
  });

  const selectedEmployee = employees.find((e) => e.id === selectedId) ?? null;

  // Attendance % for each employee (only current month's records for selected)
  const totalDays = daysInMonth(year, month);
  const workDays = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    return (d.getDay() !== 0 && d.getDay() !== 6) ? 1 : 0;
  }).reduce<number>((a, b) => a + b, 0);

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const absentCount  = records.filter((r) => r.status === 'ABSENT').length;
  const leaveCount   = records.filter((r) => r.status === 'PAID_LEAVE').length;
  const halfCount    = records.filter((r) => r.status === 'HALF_DAY').length;

  const attendancePct =
    workDays > 0 ? Math.round(((presentCount + halfCount * 0.5) / workDays) * 100) : 0;

  // ── Calendar grid ─────────────────────────────────────────────────────────
  const firstDay   = new Date(year, month - 1, 1);
  const offset     = isoWeekDay(firstDay); // 0=Mon blanks before day 1
  const totalCells = offset + totalDays;
  const rows       = Math.ceil(totalCells / 7);

  // ── Mark attendance ────────────────────────────────────────────────────────
  async function handleStatusClick(status: AttendanceStatus) {
    if (!selectedId || !popover) return;
    setMarking(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedId, date: popover.dateStr, status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        pushToast((err as { error?: string }).error ?? 'Failed to mark attendance', 'error');
      } else {
        pushToast(`Marked ${STATUS_CONFIG[status].label} for ${popover.dateStr}`, 'success');
        await fetchAttendance(selectedId, year, month);
      }
    } catch {
      pushToast('Network error — could not mark attendance', 'error');
    } finally {
      setMarking(false);
      setPopover(null);
    }
  }

  // ── Month navigation ───────────────────────────────────────────────────────
  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
    setPopover(null);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
    setPopover(null);
  }

  // ── Cell click ─────────────────────────────────────────────────────────────
  function handleCellClick(dayNum: number, el: HTMLElement) {
    if (!selectedId) return;
    const dateStr = toDateStr(year, month, dayNum);
    if (dateStr > today) return; // future — not clickable
    const rect = el.getBoundingClientRect();
    setPopover({ dateStr, anchorRect: rect });
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-5">
        {/* Page header */}
        <div>
          <h2 className="text-xl font-bold text-slate-800">Attendance</h2>
          <p className="text-sm text-slate-500">Click a day on the calendar to mark status</p>
        </div>

        <div className="flex gap-5 h-[calc(100vh-160px)] min-h-[520px]">
          {/* ── Left panel: employee list ── */}
          <div className="w-1/3 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Employees</h3>
              <input
                type="text"
                placeholder="Search by name or department…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500
                           placeholder-slate-400"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredEmployees.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No employees found</p>
              )}
              {filteredEmployees.map((emp) => {
                const isSelected = emp.id === selectedId;
                return (
                  <button
                    key={emp.id}
                    onClick={() => {
                      setSelectedId(emp.id);
                      setPopover(null);
                    }}
                    className={`
                      w-full text-left px-4 py-3 border-b border-slate-50
                      transition-colors duration-100
                      ${isSelected
                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                      }
                    `}
                  >
                    <p className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                      {emp.firstName} {emp.lastName}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{emp.department || 'No dept.'}</p>
                    {isSelected && (
                      <p className="text-xs text-blue-500 mt-1 font-medium">
                        {attendancePct}% attendance this month
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Right panel: calendar ── */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Month nav */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                aria-label="Previous month"
              >
                ‹
              </button>
              <h3 className="text-sm font-semibold text-slate-800">{monthLabel(year, month)}</h3>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                aria-label="Next month"
              >
                ›
              </button>
            </div>

            {/* Calendar grid */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_HEADERS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1 flex-1">
                {Array.from({ length: rows * 7 }, (_, idx) => {
                  const dayNum = idx - offset + 1;
                  const isValid = dayNum >= 1 && dayNum <= totalDays;

                  if (!isValid) {
                    return <div key={`blank-${idx}`} />;
                  }

                  const dateStr   = toDateStr(year, month, dayNum);
                  const isFuture  = dateStr > today;
                  const isToday   = dateStr === today;
                  const cellDate  = new Date(year, month - 1, dayNum);
                  const dow       = cellDate.getDay(); // 0=Sun, 6=Sat
                  const isWeekend = dow === 0 || dow === 6;
                  const status    = attMap[dateStr] as AttendanceStatus | undefined;
                  const cfg       = status ? STATUS_CONFIG[status] : null;

                  let cellBase = 'rounded-lg p-1 flex flex-col items-center justify-start min-h-[44px] transition-colors duration-100 ';

                  if (isFuture) {
                    cellBase += 'bg-slate-50 opacity-40 cursor-not-allowed ';
                  } else if (!selectedId) {
                    cellBase += isWeekend ? 'bg-slate-100 cursor-default ' : 'bg-slate-50 cursor-default ';
                  } else {
                    if (cfg) {
                      cellBase += `${cfg.bg} cursor-pointer hover:opacity-80 `;
                    } else if (isWeekend) {
                      cellBase += 'bg-slate-100 cursor-pointer hover:bg-slate-200 ';
                    } else {
                      cellBase += 'bg-slate-50 cursor-pointer hover:bg-slate-100 ';
                    }
                  }

                  if (isToday) {
                    cellBase += 'ring-2 ring-blue-400 ring-offset-1 ';
                  }

                  return (
                    <div
                      key={dateStr}
                      className={cellBase}
                      onClick={(e) => {
                        if (!isFuture && selectedId) {
                          handleCellClick(dayNum, e.currentTarget as HTMLElement);
                        }
                      }}
                    >
                      <span className={`text-xs font-semibold leading-tight mt-1 ${
                        cfg ? cfg.text : isWeekend ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {dayNum}
                      </span>
                      {cfg && (
                        <span className={`text-[9px] font-bold leading-none mt-0.5 ${cfg.text}`}>
                          {cfg.short}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {loadingRecords && (
                <p className="text-xs text-slate-400 text-center mt-2 animate-pulse">
                  Loading attendance…
                </p>
              )}
            </div>

            {/* Summary bar */}
            {selectedEmployee && (
              <div className="bg-white rounded-xl border border-slate-200 px-5 py-3 flex items-center gap-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-auto">
                  Summary — {selectedEmployee.firstName} {selectedEmployee.lastName}
                </p>
                {[
                  { label: 'Present',   count: presentCount, color: 'text-green-700' },
                  { label: 'Absent',    count: absentCount,  color: 'text-red-700'   },
                  { label: 'Leave',     count: leaveCount,   color: 'text-blue-700'  },
                  { label: 'Half Day',  count: halfCount,    color: 'text-amber-700' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="text-center">
                    <p className={`text-lg font-bold ${color}`}>{count}</p>
                    <p className="text-xs text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Prompt when no employee selected */}
            {!selectedEmployee && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                <p className="text-sm text-slate-400">
                  Select an employee from the left to view and mark attendance
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Popover ── */}
      {popover && (
        <PopoverMenu
          ref={popoverRef}
          popover={popover}
          attMap={attMap}
          marking={marking}
          onSelect={handleStatusClick}
          onClose={() => setPopover(null)}
        />
      )}

      {/* ── Toast container ── */}
      <ToastContainer toasts={toasts} />
    </>
  );
}

// ─── Popover Component ────────────────────────────────────────────────────────

const PopoverMenu = React.forwardRef<
  HTMLDivElement,
  {
    popover: PopoverState;
    attMap: Record<string, AttendanceStatus>;
    marking: boolean;
    onSelect: (s: AttendanceStatus) => void;
    onClose: () => void;
  }
>(function PopoverMenu({ popover, attMap, marking, onSelect }, ref) {
  const currentStatus = attMap[popover.dateStr] as AttendanceStatus | undefined;

  // Position the popover below the clicked cell
  const { anchorRect } = popover;
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const scrollX = window.scrollX || document.documentElement.scrollLeft;

  const top  = anchorRect.bottom + scrollY + 6;
  const left = Math.min(
    anchorRect.left + scrollX,
    window.innerWidth - 200 - 8, // keep inside viewport
  );

  // Format date for display
  const [y, m, d] = popover.dateStr.split('-');
  const displayDate = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('default', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      ref={ref}
      style={{ top, left, position: 'absolute', zIndex: 60, width: 192 }}
      className="bg-white rounded-xl border border-slate-200 shadow-xl p-3"
    >
      <p className="text-xs font-semibold text-slate-600 mb-2 truncate">{displayDate}</p>
      <div className="flex flex-col gap-1">
        {STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const isCurrent = s === currentStatus;
          return (
            <button
              key={s}
              disabled={marking}
              onClick={() => onSelect(s)}
              className={`
                flex items-center justify-between gap-2
                w-full px-3 py-1.5 rounded-lg border text-xs font-medium
                transition-colors duration-100
                ${cfg.btn}
                ${marking ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span>{cfg.label}</span>
              {isCurrent && (
                <span className="text-[10px] font-bold">✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
