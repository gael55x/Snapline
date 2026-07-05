import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface StatCardProps {
  title: string
  value: string
  change: string
  changeType?: "positive" | "negative"
  icon?: React.ReactNode
}

export function StatCard({ title, value, change, changeType = "positive", icon }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10" />
      <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{title}</CardTitle>
        </div>
        {icon && (
          <div className="rounded-lg bg-white dark:bg-slate-700 p-2 shadow-sm">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">{value}</div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">vs last month</p>
          <Badge variant={changeType === "negative" ? "destructive" : "secondary"} className="font-semibold">
            {change}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
