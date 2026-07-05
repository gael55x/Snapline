import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/", label: "Overview" },
  { href: "/settings", label: "Settings" },
]

export function DashboardNav({ currentPath }: { currentPath: string }) {
  return (
    <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900 dark:text-white">Snapline Ops</span>
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-semibold">v2</Badge>
          </div>
          <nav className="flex items-center gap-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={
                  link.href === currentPath
                    ? "rounded-lg px-4 py-2 text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "rounded-lg px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                }
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            Feedback
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-shadow">New report</Button>
        </div>
      </div>
    </header>
  )
}
