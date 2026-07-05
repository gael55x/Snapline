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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
        <Badge variant={changeType === "negative" ? "destructive" : "secondary"} className="text-xs font-semibold">{change}</Badge>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-foreground tracking-tight mb-3">{value}</div>
        <p className="text-xs font-medium text-muted-foreground">compared to last month</p>
      </CardContent>
    </Card>
  )
}
