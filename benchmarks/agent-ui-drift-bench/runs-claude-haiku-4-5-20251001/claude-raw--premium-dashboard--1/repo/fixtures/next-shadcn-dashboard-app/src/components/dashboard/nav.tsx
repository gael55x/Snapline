import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/", label: "Overview" },
  { href: "/settings", label: "Settings" },
]

export function DashboardNav({ currentPath }: { currentPath: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/40 bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-900">Snapline Ops</span>
            <Badge variant="secondary" className="font-semibold text-xs">v2</Badge>
          </div>
          <nav className="flex items-center gap-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={
                  link.href === currentPath
                    ? "rounded-lg px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                    : "rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                }
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
            Feedback
          </Button>
          <Button size="sm" className="font-semibold">New report</Button>
        </div>
      </div>
    </header>
  )
}
