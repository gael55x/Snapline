import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ActivityRow {
  id: string
  actor: string
  action: string
  target: string
  status: "completed" | "pending" | "failed"
  time: string
}

const activity: ActivityRow[] = [
  {
    id: "act-001",
    actor: "Gaille Amolong",
    action: "Deployed",
    target: "marketing-site",
    status: "completed",
    time: "2 minutes ago",
  },
  {
    id: "act-002",
    actor: "CI Bot",
    action: "Repaired",
    target: "checkout-form styles",
    status: "completed",
    time: "18 minutes ago",
  },
  {
    id: "act-003",
    actor: "Ana Reyes",
    action: "Updated",
    target: "billing settings",
    status: "pending",
    time: "1 hour ago",
  },
  {
    id: "act-004",
    actor: "CI Bot",
    action: "Flagged",
    target: "dashboard hex colors",
    status: "failed",
    time: "3 hours ago",
  },
]

function statusVariant(status: ActivityRow["status"]) {
  if (status === "failed") {
    return "destructive" as const
  }
  if (status === "pending") {
    return "outline" as const
  }
  return "secondary" as const
}

export function RecentActivity() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">Recent activity</CardTitle>
        <CardDescription>Latest events across your connected projects.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
              <TableHead className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actor
              </TableHead>
              <TableHead className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Action
              </TableHead>
              <TableHead className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target
              </TableHead>
              <TableHead className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="h-12 px-6 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                When
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activity.map((row, idx) => (
              <TableRow
                key={row.id}
                className="border-b border-border/40 transition-colors hover:bg-muted/40"
              >
                <TableCell className="px-6 py-4 font-semibold text-foreground">{row.actor}</TableCell>
                <TableCell className="px-6 py-4 text-foreground">{row.action}</TableCell>
                <TableCell className="px-6 py-4 text-muted-foreground">{row.target}</TableCell>
                <TableCell className="px-6 py-4">
                  <Badge variant={statusVariant(row.status)} className="font-medium">
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-right text-sm text-muted-foreground">
                  {row.time}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
