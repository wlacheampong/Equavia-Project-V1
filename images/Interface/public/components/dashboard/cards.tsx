"use client"

import {
  Camera,
  CircleCheckBig,
  ChevronDown,
  Circle,
  CloudSun,
  FileText,
  Hash,
  Music,
  Play,
  Plus,
  StickyNote,
} from "lucide-react"
import { BarChart, LineChart, Ring, WaveLine } from "./charts"

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-5 ${className}`}>{children}</section>
  )
}

export function GreetingCard() {
  return (
    <Card className="flex flex-col justify-between overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Good Evening,</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Aaru</h1>
          <p className="mt-2 max-w-[15rem] text-sm text-muted-foreground text-pretty">
            Stay focused and make it happen.
          </p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          07:45 PM
        </span>
      </div>
      <LineChart className="mt-6 h-24 w-full text-foreground" />
    </Card>
  )
}

export function WeatherCard() {
  return (
    <Card className="flex flex-col justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">May 24, 2025</p>
        <p className="text-sm text-muted-foreground">Saturday</p>
      </div>
      <div className="mt-6 flex items-center gap-4">
        <CloudSun className="size-10 text-foreground" strokeWidth={1.5} />
        <div>
          <p className="text-4xl font-semibold text-foreground">27°</p>
          <p className="text-sm text-muted-foreground">Cloudy</p>
        </div>
      </div>
      <div className="mt-5 flex gap-4 text-xs text-muted-foreground">
        <span>H: 31°</span>
        <span>L: 21°</span>
      </div>
    </Card>
  )
}

export function ProductivityCard() {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Productivity</h2>
        <button className="flex items-center gap-1 text-xs text-muted-foreground" type="button">
          Today <ChevronDown className="size-3.5" />
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-4xl font-semibold text-foreground">
            78<span className="text-xl text-muted-foreground">%</span>
          </p>
          <p className="text-sm text-muted-foreground">Great Progress!</p>
          <div className="mt-6 flex gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Tasks Completed</p>
              <p className="text-lg font-semibold text-foreground">14</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
              <p className="text-lg font-semibold text-foreground">18</p>
            </div>
          </div>
        </div>
        <Ring value={78} size={120} stroke={11} progressClassName="text-foreground" trackClassName="text-muted">
          <span className="text-lg font-semibold text-foreground">78%</span>
        </Ring>
      </div>
    </Card>
  )
}

export function FocusTimerCard() {
  return (
    <Card className="flex flex-col items-center">
      <h2 className="w-full text-sm font-medium text-foreground">Focus Timer</h2>
      <Ring value={62} size={140} stroke={11} className="my-4" progressClassName="text-foreground" trackClassName="text-muted">
        <span className="text-2xl font-semibold text-foreground">25:00</span>
        <span className="text-xs text-muted-foreground">Deep Work</span>
      </Ring>
      <button
        type="button"
        className="flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Play className="size-4 fill-current" /> Start
      </button>
    </Card>
  )
}

const tasks = [
  { label: "UI/UX Research", status: "Completed", done: true },
  { label: "Design Dashboard", status: "Completed", done: true },
  { label: "Prototype App", status: "In Progress", done: false },
  { label: "User Testing", status: "Pending", done: false },
]

export function TasksCard() {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Tasks</h2>
        <button type="button" aria-label="Add task" className="text-muted-foreground hover:text-foreground">
          <Plus className="size-4" />
        </button>
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {tasks.map((t) => (
          <li key={t.label} className="flex items-center justify-between">
            <span className="flex items-center gap-3">
              {t.done ? (
                <CircleCheckBig className="size-5 text-foreground" />
              ) : (
                <Circle className="size-5 text-muted-foreground" />
              )}
              <span className={`text-sm ${t.done ? "text-foreground" : "text-muted-foreground"}`}>{t.label}</span>
            </span>
            <span
              className={`text-xs ${
                t.status === "Completed"
                  ? "text-muted-foreground"
                  : t.status === "In Progress"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground/70"
              }`}
            >
              {t.status}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function MoodCard() {
  return (
    <Card className="flex flex-col justify-between">
      <div>
        <h2 className="text-sm font-medium text-foreground">Current Mood</h2>
        <p className="mt-1 text-lg font-semibold text-foreground">Focused</p>
      </div>
      <WaveLine className="my-6 h-16 w-full text-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">Distractions</p>
        <p className="text-sm font-medium text-foreground">Low</p>
      </div>
    </Card>
  )
}

export function ActivityCard() {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Weekly Activity</h2>
        <button className="flex items-center gap-1 text-xs text-muted-foreground" type="button">
          This Week <ChevronDown className="size-3.5" />
        </button>
      </div>
      <div className="mt-6">
        <BarChart
          data={[40, 55, 48, 60, 72, 96, 52]}
          labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
          highlight={5}
        />
      </div>
    </Card>
  )
}

const shortcuts = [
  { icon: StickyNote, label: "Notes" },
  { icon: FileText, label: "Files" },
  { icon: Music, label: "Music" },
  { icon: Camera, label: "Camera" },
  { icon: Hash, label: "Slack" },
  { icon: Plus, label: "Add" },
]

export function ShortcutsCard() {
  return (
    <Card>
      <h2 className="text-sm font-medium text-foreground">Shortcuts</h2>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {shortcuts.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.label}
              type="button"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-secondary/40 py-4 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Icon className="size-5" />
              <span className="text-xs">{s.label}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

const events = [
  { day: "25", month: "MAY", title: "Project Meeting", time: "10:00 AM – 11:00 AM" },
  { day: "26", month: "MAY", title: "Design Review", time: "02:00 PM – 03:30 PM" },
  { day: "28", month: "MAY", title: "Client Call", time: "11:00 AM – 12:00 PM" },
]

export function EventsCard() {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Upcoming Events</h2>
        <button className="text-xs text-muted-foreground hover:text-foreground" type="button">
          View All
        </button>
      </div>
      <ul className="mt-4 flex flex-col gap-4">
        {events.map((e) => (
          <li key={e.title} className="flex items-center gap-4">
            <div className="flex w-12 flex-col items-center rounded-lg bg-secondary/50 py-1.5">
              <span className="text-base font-semibold text-foreground">{e.day}</span>
              <span className="text-[10px] text-muted-foreground">{e.month}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
              <p className="text-xs text-muted-foreground">{e.time}</p>
            </div>
            <span className="size-2 rounded-full bg-muted-foreground" aria-hidden="true" />
          </li>
        ))}
      </ul>
    </Card>
  )
}

const statusBars = [
  { label: "Storage", value: 78 },
  { label: "Battery", value: 82 },
  { label: "Network", value: 94 },
]

export function SystemStatusCard() {
  return (
    <Card>
      <h2 className="text-sm font-medium text-foreground">System Status</h2>
      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        <Ring value={92} size={110} stroke={10} progressClassName="text-foreground" trackClassName="text-muted">
          <span className="text-xl font-semibold text-foreground">92%</span>
          <span className="text-[10px] text-muted-foreground">Optimal</span>
        </Ring>
        <div className="w-full flex-1 space-y-3">
          {statusBars.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-16 text-xs text-muted-foreground">{b.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-foreground" style={{ width: `${b.value}%` }} />
              </div>
              <span className="w-10 text-right text-xs text-foreground">{b.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
