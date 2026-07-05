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
    <Card className="border-0 bg-gradient-to-br from-white to-slate-50 shadow-lg">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription className="text-slate-500 font-medium">Latest events across your connected projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200/60 bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Actor</TableHead>
              <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Action</TableHead>
              <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Target</TableHead>
              <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-right text-slate-600 font-semibold text-xs uppercase tracking-wider">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activity.map((row) => (
              <TableRow key={row.id} className="border-slate-200/40 hover:bg-slate-50/40 transition-colors">
                <TableCell className="font-semibold text-slate-900">{row.actor}</TableCell>
                <TableCell className="text-slate-700">{row.action}</TableCell>
                <TableCell className="text-slate-500 font-medium">{row.target}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(row.status)} className="font-semibold">{row.status}</Badge>
                </TableCell>
                <TableCell className="text-right text-slate-500 text-sm">{row.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
