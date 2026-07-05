import { DashboardNav } from "@/components/dashboard/nav"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { StatCard } from "@/components/dashboard/stat-card"

const stats = [
  {
    title: "Total revenue",
    value: "$45,231.89",
    change: "+20.1%",
    changeType: "positive" as const,
  },
  {
    title: "Active repairs",
    value: "312",
    change: "+12.4%",
    changeType: "positive" as const,
  },
  {
    title: "Violations found",
    value: "1,024",
    change: "-4.3%",
    changeType: "negative" as const,
  },
  {
    title: "Projects connected",
    value: "24",
    change: "+3",
    changeType: "positive" as const,
  },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <DashboardNav currentPath="/" />
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-8 py-12">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Overview</h1>
          <p className="text-base text-slate-600 font-medium">
            A summary of repair activity across your projects.
          </p>
        </div>
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              changeType={stat.changeType}
            />
          ))}
        </section>
        <RecentActivity />
      </main>
    </div>
  )
}
