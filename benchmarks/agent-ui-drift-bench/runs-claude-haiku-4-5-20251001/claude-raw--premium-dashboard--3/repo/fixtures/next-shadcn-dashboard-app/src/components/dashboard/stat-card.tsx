import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface StatCardProps {
  title: string
  value: string
  change: string
  changeType?: "positive" | "negative"
}

export function StatCard({ title, value, change, changeType = "positive" }: StatCardProps) {
  const isPositive = changeType === "positive"

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:border-accent/20">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex flex-col gap-1 flex-1">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </CardTitle>
        </div>
        <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
          <span className="text-base font-bold text-accent">↗</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isPositive ? "secondary" : "destructive"}
              className="font-medium"
            >
              {isPositive ? "+" : ""}{change}
            </Badge>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
