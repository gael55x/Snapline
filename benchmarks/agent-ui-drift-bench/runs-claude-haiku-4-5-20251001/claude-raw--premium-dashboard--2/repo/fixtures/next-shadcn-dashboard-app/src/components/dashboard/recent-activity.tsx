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
    <Card className="border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-xl" />
      <CardHeader className="relative">
        <CardTitle className="text-2xl font-bold">Recent activity</CardTitle>
        <CardDescription className="text-base">Latest events across your connected projects.</CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 dark:border-slate-700">
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Actor</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Action</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Target</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activity.map((row) => (
              <TableRow key={row.id} className="border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <TableCell className="font-semibold text-slate-900 dark:text-white">{row.actor}</TableCell>
                <TableCell className="text-slate-700 dark:text-slate-300">{row.action}</TableCell>
                <TableCell className="text-slate-600 dark:text-slate-400">{row.target}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(row.status)} className="font-semibold">
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-slate-600 dark:text-slate-400 font-medium">{row.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
