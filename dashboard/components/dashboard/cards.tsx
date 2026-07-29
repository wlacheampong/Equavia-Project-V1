"use client"

import { CircleCheckBig, ChevronDown, Circle, CloudSun, Plus } from "lucide-react"
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
    <Card className="flex items-center justify-between gap-6">
      <div className="flex flex-col justify-between self-stretch">
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
      </div>

      <Ring value={62} size={116} stroke={9} progressClassName="text-foreground" trackClassName="text-muted" />
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

export function EmptyCard() {
  return <Card className="min-h-40" aria-hidden="true" />
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

export function SleepLogCard() {
  return (
    <Card className="flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-medium text-foreground">Sleep Log</h2>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            7<span className="text-lg text-muted-foreground">h</span> 32
            <span className="text-lg text-muted-foreground">m</span>
          </p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          Good
        </span>
      </div>
      <WaveLine className="my-5 h-14 w-full text-foreground" />
      <div className="flex justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Bedtime</p>
          <p className="text-sm font-medium text-foreground">11:15 PM</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Wake Up</p>
          <p className="text-sm font-medium text-foreground">6:47 AM</p>
        </div>
      </div>
    </Card>
  )
}

export function ActivityCard() {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Habit Tracker</h2>
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

const goals = [
  { label: "Read 20 books", value: 60 },
  { label: "Run 100 km", value: 45 },
  { label: "Save $5,000", value: 80 },
]

export function GoalsCard() {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Goals</h2>
        <button type="button" aria-label="Add goal" className="text-muted-foreground hover:text-foreground">
          <Plus className="size-4" />
        </button>
      </div>
      <ul className="mt-5 flex flex-col gap-4">
        {goals.map((g) => (
          <li key={g.label}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">{g.label}</span>
              <span className="text-xs text-muted-foreground">{g.value}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground" style={{ width: `${g.value}%` }} />
            </div>
          </li>
        ))}
      </ul>
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

const scoreBars = [
  { label: "Focus", value: 88 },
  { label: "Movement", value: 74 },
  { label: "Sleep", value: 91 },
]

export function DayScoreCard() {
  return (
    <Card>
      <h2 className="text-sm font-medium text-foreground">Day Score</h2>
      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        <Ring value={92} size={110} stroke={10} progressClassName="text-foreground" trackClassName="text-muted">
          <span className="text-xl font-semibold text-foreground">92</span>
          <span className="text-[10px] text-muted-foreground">Excellent</span>
        </Ring>
        <div className="w-full flex-1 space-y-3">
          {scoreBars.map((b) => (
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
