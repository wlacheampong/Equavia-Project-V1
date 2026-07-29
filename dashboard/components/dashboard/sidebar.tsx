"use client"

import {
  CalendarDays,
  ChartLine,
  ChevronRight,
  Folder,
  House,
  LayoutGrid,
  Settings,
  Sun,
} from "lucide-react"
import { useState } from "react"

const navItems = [
  { icon: House, label: "Home" },
  { icon: LayoutGrid, label: "Overview" },
  { icon: ChartLine, label: "Analytics" },
  { icon: CalendarDays, label: "Calendar" },
  { icon: Folder, label: "Files" },
  { icon: Settings, label: "Settings" },
]

export function Sidebar() {
  const [active, setActive] = useState(0)

  return (
    <aside className="flex w-full shrink-0 flex-row items-center justify-between gap-2 rounded-2xl border border-border bg-sidebar p-3 md:h-full md:w-20 md:flex-col md:justify-between md:py-5">
      <nav className="flex flex-row items-center gap-1 md:flex-col md:gap-2" aria-label="Primary">
        {navItems.map((item, i) => {
          const Icon = item.icon
          const isActive = i === active
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => setActive(i)}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={`flex size-11 items-center justify-center rounded-xl transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="size-5" strokeWidth={2} />
            </button>
          )
        })}
      </nav>

      <div className="flex flex-row items-center gap-3 md:flex-col md:gap-4">
        <button
          type="button"
          className="flex flex-col items-center gap-1 rounded-xl p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Toggle light mode"
        >
          <Sun className="size-5" />
          <span className="hidden text-[10px] md:block">Light</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center gap-1"
          aria-label="Account: Aaru"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
            A
          </span>
          <span className="hidden items-center text-[10px] text-muted-foreground md:flex">
            Aaru <ChevronRight className="size-3" />
          </span>
        </button>
      </div>
    </aside>
  )
}
