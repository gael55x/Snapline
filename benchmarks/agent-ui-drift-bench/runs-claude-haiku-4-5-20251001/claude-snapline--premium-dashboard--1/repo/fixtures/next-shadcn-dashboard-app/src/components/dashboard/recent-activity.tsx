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
      <CardHeader className="border-b border-border/50">
        <CardTitle className="text-lg">Recent activity</CardTitle>
        <CardDescription>Latest events across your connected projects.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold">Actor</TableHead>
              <TableHead className="font-semibold">Action</TableHead>
              <TableHead className="font-semibold">Target</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activity.map((row) => (
              <TableRow key={row.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <TableCell className="font-medium py-4">{row.actor}</TableCell>
                <TableCell className="py-4">{row.action}</TableCell>
                <TableCell className="text-muted-foreground py-4">{row.target}</TableCell>
                <TableCell className="py-4">
                  <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground py-4">{row.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
