import {
  ActivityCard,
  DayScoreCard,
  EmptyCard,
  EventsCard,
  GoalsCard,
  GreetingCard,
  ProductivityCard,
  SleepLogCard,
  TasksCard,
  WeatherCard,
} from "@/components/dashboard/cards"
import { Sidebar } from "@/components/dashboard/sidebar"

export default function Page() {
  return (
    <main className="min-h-screen bg-background p-3 md:p-5">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row">
        <Sidebar />

        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
          <GreetingCard />
          <WeatherCard />
          <ProductivityCard />
          <EmptyCard />
          <TasksCard />
          <GoalsCard />
          <ActivityCard />
          <SleepLogCard />
          <EventsCard />
          <DayScoreCard />
        </div>
      </div>
    </main>
  )
}
