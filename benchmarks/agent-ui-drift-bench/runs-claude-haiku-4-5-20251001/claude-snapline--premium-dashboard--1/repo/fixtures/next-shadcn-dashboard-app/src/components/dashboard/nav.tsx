import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/", label: "Overview" },
  { href: "/settings", label: "Settings" },
]

export function DashboardNav({ currentPath }: { currentPath: string }) {
  return (
    <header className="border-b border-border/50 bg-card sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-semibold tracking-tight text-foreground">Snapline Ops</span>
            <Badge variant="secondary" className="text-xs font-semibold">v2</Badge>
          </div>
          <nav className="flex items-center gap-0.5">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={
                  link.href === currentPath
                    ? "rounded-lg px-4 py-2 text-sm font-semibold bg-muted text-foreground transition-colors"
                    : "rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                }
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Feedback
          </Button>
          <Button size="sm" className="font-semibold">New report</Button>
        </div>
      </div>
    </header>
  )
}
