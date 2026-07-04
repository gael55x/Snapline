import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/", label: "Overview" },
  { href: "/settings", label: "Settings" },
]

export function DashboardNav({ currentPath }: { currentPath: string }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Snapline Ops</span>
            <Badge variant="secondary">v2</Badge>
          </div>
          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={
                  link.href === currentPath
                    ? "rounded-md px-3 py-1.5 text-sm font-medium bg-muted text-foreground"
                    : "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                }
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            Feedback
          </Button>
          <Button size="sm">New report</Button>
        </div>
      </div>
    </header>
  )
}
