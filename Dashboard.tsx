'use client';

import React, { useState } from 'react';
import {
  Hourglass,
  HeartPulse,
  Wallet,
  Sprout,
  ClipboardList,
  Users,
  GraduationCap,
  ChevronDown,
  Sparkles,
  Folder,
  Filter,
  ArrowUpDown,
  Search,
  Sunrise,
  Sun,
  Moon,
  NotebookPen,
} from 'lucide-react';

const LABEL = 'font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500';
const CARD = 'rounded-xl border border-neutral-800 bg-neutral-900/60';
const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black';

const TABS = [
  { id: 'health', label: 'Health & Fitness', lines: ['Health &', 'Fitness'], icon: HeartPulse },
  { id: 'finance', label: 'Personal Finances', lines: ['Personal', 'Finances'], icon: Wallet },
  { id: 'growth', label: 'Personal Growth', lines: ['Personal', 'Growth'], icon: Sprout },
  { id: 'assignments', label: 'Assignments', lines: ['Assignments'], icon: ClipboardList },
  { id: 'relationships', label: 'Relationships', lines: ['Relationships'], icon: Users },
  { id: 'lectures', label: 'Lectures', lines: ['Lectures'], icon: GraduationCap },
] as const;

const GOAL_METRICS = [
  { label: 'Year', value: 54 },
  { label: 'Month', value: 48 },
  { label: 'Week', value: 42 },
  { label: 'Day', value: 95 },
  { label: 'Quarter', value: 15 },
  { label: 'Life', value: 0 },
];

const NOT_STARTED_GOALS = [
  { title: 'Read 12 books', date: 'Dec 31, 2026', value: 8 },
  { title: 'Learn Spanish', date: 'Dec 31, 2026', value: 0 },
  { title: 'Save $10,000', date: 'Dec 31, 2026', value: 22 },
  { title: 'Run a marathon', date: 'Oct 4, 2026', value: 5 },
];

const PROJECT_COLUMNS = [
  {
    id: 'not-started',
    label: 'Not started',
    tint: 'neutral' as const,
    project: { title: 'Website Redesign', value: 0, priority: 'Low' },
  },
  {
    id: 'in-progress',
    label: 'In progress',
    tint: 'blue' as const,
    project: { title: 'Vitality Dashboard', value: 62, priority: 'High' },
  },
  {
    id: 'done',
    label: 'Done',
    tint: 'green' as const,
    project: { title: 'Q2 Budget Review', value: 100, priority: 'Medium' },
  },
];

const CHECKLISTS = [
  { id: 'morning', name: 'Morning', icon: Sunrise, created: 'June 16, 2026 1:57 AM', edited: 'June 16, 2026 1:57 AM' },
  { id: 'midday', name: 'Mid-Day', icon: Sun, created: 'June 16, 2026 1:57 AM', edited: 'June 16, 2026 1:57 AM' },
  { id: 'evening', name: 'Evening', icon: Moon, created: 'June 16, 2026 1:57 AM', edited: 'June 16, 2026 1:57 AM' },
];

function Bar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
      <div className="h-full rounded-full bg-violet-500" style={{ width: `${value}%` }} />
    </div>
  );
}

function AwakeRing({ percent, phase, time }: { percent: number; phase: string; time: string }) {
  const size = 118;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - percent / 100);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#262626" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none text-white">{percent}%</span>
        <span className={`mt-1.5 ${LABEL}`}>{phase}</span>
        <span className="mt-0.5 font-mono text-[11px] text-neutral-400">{time}</span>
      </div>
    </div>
  );
}

function TodoInputRow({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`min-w-0 flex-1 rounded-lg border border-neutral-800 bg-black/40 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 ${FOCUS}`}
      />
      <button
        type="button"
        className={`rounded-lg bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 transition-opacity hover:opacity-90 ${FOCUS}`}
      >
        + Add
      </button>
      <button
        type="button"
        className={`flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:border-neutral-600 ${FOCUS}`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Polish
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>('health');
  const [notStartedOpen, setNotStartedOpen] = useState(false);
  const [todayInput, setTodayInput] = useState('');
  const [tomorrowInput, setTomorrowInput] = useState('');

  return (
    <div className="min-h-screen bg-black px-4 py-6 font-sans text-neutral-200 md:px-8">
      <div className="mx-auto max-w-[1400px]">
        {/* ===== header row ===== */}
        <div className="flex flex-col gap-5 md:flex-row">
          <div className={`flex items-center justify-center p-5 ${CARD}`}>
            <AwakeRing percent={89} phase="Evening" time="10:22 PM" />
          </div>

          <div className={`flex min-h-[118px] flex-1 items-center justify-center p-5 ${CARD}`}>
            <h1 className="text-center text-4xl font-bold text-white">William&rsquo;s Dashboard</h1>
          </div>

          <div className={`flex w-full flex-shrink-0 flex-col justify-center gap-2 p-5 md:w-[190px] ${CARD}`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Hourglass className="h-4 w-4 flex-shrink-0 text-violet-400" />
              <span>Evening &mdash; wrap up</span>
            </div>
            <p className="font-mono text-xs text-neutral-400">1h 36m awake time left</p>
            <p className="font-mono text-[11px] text-neutral-600">8:00 AM &ndash; 12:00 AM</p>
          </div>
        </div>

        {/* ===== tab row ===== */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-shrink-0 items-center gap-2.5 rounded-lg border px-3.5 py-2.5 transition-colors ${FOCUS} ${
                  active
                    ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                    : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="whitespace-nowrap text-left text-[12px] font-semibold leading-tight">
                  {tab.lines.map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        {/* ===== body ===== */}
        <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)_280px]">
          {/* ---- LEFT: Daily Goals Tracker ---- */}
          <div className="order-2 lg:order-none lg:col-start-1 lg:pt-[70px]">
            <div className={`p-4 ${CARD}`}>
              <h2 className="text-sm font-semibold text-white">Daily Goals Tracker</h2>

              <div className="mt-4 space-y-3">
                {GOAL_METRICS.map((m) => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between">
                      <span className={LABEL}>{m.label}</span>
                      <span className="font-mono text-[11px] text-neutral-300">{m.value}%</span>
                    </div>
                    <div className="mt-1.5">
                      <Bar value={m.value} />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setNotStartedOpen((o) => !o)}
                className={`mt-5 flex w-full items-center justify-between rounded-lg border border-neutral-800 px-3 py-2 transition-colors hover:border-neutral-700 ${FOCUS} ${LABEL}`}
              >
                <span>Not Started</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${notStartedOpen ? 'rotate-180' : ''}`} />
              </button>

              {notStartedOpen && (
                <div className="mt-3 space-y-2.5">
                  {NOT_STARTED_GOALS.map((g) => (
                    <div key={g.title} className="rounded-lg border border-neutral-800 bg-black/30 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-neutral-200">{g.title}</span>
                        <span className="font-mono text-[11px] text-neutral-500">{g.value}%</span>
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-neutral-600">{g.date}</p>
                      <div className="mt-2">
                        <Bar value={g.value} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ---- CENTRE: To Do List + Projects ---- */}
          <div className="order-1 space-y-5 lg:order-none lg:col-start-2">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-neutral-800" />
              <span className={LABEL}>To Do List</span>
              <span className="h-px flex-1 bg-neutral-800" />
            </div>

            <div className={CARD}>
              {/* Today */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">Today &mdash; Wed, Jul 15</h3>
                  <span
                    className={`flex-shrink-0 rounded-full border border-neutral-800 bg-black/40 px-2.5 py-1 ${LABEL}`}
                  >
                    0 Day Streak
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">0</span>
                  <span className="font-mono text-lg text-neutral-600">/ 0</span>
                  <span className={LABEL}>No Goals Yet</span>
                </div>
                <p className="mt-3 text-[13px] italic text-neutral-500">No goals for today yet &mdash; add one below.</p>
                <TodoInputRow value={todayInput} onChange={setTodayInput} placeholder="Add a goal for today&hellip;" />
              </div>

              <div className="h-px w-full bg-neutral-800" />

              {/* Plan tomorrow */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Plan Tomorrow &mdash; Thu, Jul 16</h3>
                    <p className="mt-1 text-[12px] text-neutral-500">Write tonight, locked until 6 AM.</p>
                  </div>
                  <span className={`flex-shrink-0 ${LABEL}`}>0 Planned</span>
                </div>
                <p className="mt-3 text-[13px] italic text-neutral-500">Nothing planned for tomorrow yet.</p>
                <TodoInputRow
                  value={tomorrowInput}
                  onChange={setTomorrowInput}
                  placeholder="Add a goal for tomorrow&hellip;"
                />
              </div>
            </div>

            {/* Projects */}
            <div className={`p-5 ${CARD}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-white">Projects</h3>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1 rounded-lg border border-neutral-800 p-1">
                    <span className="rounded-md bg-violet-500/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-violet-300">
                      By Status
                    </span>
                    <span className="px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-neutral-500">
                      All Projects
                    </span>
                    <span className="px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-neutral-500">
                      Gantt
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-neutral-500">
                    <button type="button" className={`rounded ${FOCUS}`} aria-label="Filter projects">
                      <Filter className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={`rounded ${FOCUS}`} aria-label="Sort projects">
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={`rounded ${FOCUS}`} aria-label="Search projects">
                      <Search className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PROJECT_COLUMNS.map((col) => (
                  <div key={col.id}>
                    <span className={LABEL}>{col.label}</span>
                    <div
                      className={`mt-2 rounded-lg border p-3 ${
                        col.tint === 'blue'
                          ? 'border-blue-500/30 bg-blue-500/5'
                          : col.tint === 'green'
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-neutral-800 bg-black/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-neutral-200">{col.project.title}</span>
                        <span className="font-mono text-[11px] text-neutral-400">{col.project.value}%</span>
                      </div>
                      <div className="mt-2">
                        <Bar value={col.project.value} />
                      </div>
                      <span className="mt-2 inline-block rounded-full border border-neutral-700 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-neutral-400">
                        {col.project.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ---- RIGHT: Checklists + Quick Note ---- */}
          <div className="order-3 space-y-3 lg:order-none lg:col-start-3 lg:pt-[70px]">
            {CHECKLISTS.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.id} className={`p-4 ${CARD}`}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-semibold text-white">{c.name}</span>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div>
                      <span className={LABEL}>Created Time</span>
                      <p className="font-mono text-[11px] text-neutral-400">{c.created}</p>
                    </div>
                    <div>
                      <span className={LABEL}>Last Edited Time</span>
                      <p className="font-mono text-[11px] text-neutral-400">{c.edited}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-center pt-1">
              <button
                type="button"
                className={`flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-4 py-2 text-xs font-semibold text-neutral-200 transition-colors hover:border-neutral-600 ${FOCUS}`}
              >
                <NotebookPen className="h-3.5 w-3.5" />
                Quick Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
