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
    <Card>
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-bold">Recent activity</CardTitle>
        <CardDescription className="text-base">Latest events across your connected projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-2 border-border/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Actor</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Action</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Target</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activity.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-semibold text-foreground py-3.5">{row.actor}</TableCell>
                <TableCell className="text-foreground py-3.5">{row.action}</TableCell>
                <TableCell className="text-muted-foreground py-3.5">{row.target}</TableCell>
                <TableCell className="py-3.5">
                  <Badge variant={statusVariant(row.status)} className="font-semibold text-xs">
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground py-3.5 text-sm">{row.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
