import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface StatCardProps {
  title: string
  value: string
  change: string
  changeType?: "positive" | "negative"
}

export function StatCard({ title, value, change, changeType = "positive" }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-white shadow-lg hover:shadow-xl transition-shadow duration-200">
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-blue-400/20 to-transparent" />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{title}</CardTitle>
        <Badge
          variant={changeType === "negative" ? "destructive" : "secondary"}
          className="font-semibold"
        >
          {changeType === "positive" ? "↑ " : "↓ "}{change}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold tracking-tight text-slate-900 mb-1">{value}</div>
        <p className="text-xs font-medium text-slate-500">compared to last month</p>
      </CardContent>
    </Card>
  )
}
