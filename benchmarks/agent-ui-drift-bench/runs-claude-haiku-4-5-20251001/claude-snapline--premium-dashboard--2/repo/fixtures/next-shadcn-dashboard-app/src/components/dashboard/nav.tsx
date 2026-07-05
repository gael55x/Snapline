import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/", label: "Overview" },
  { href: "/settings", label: "Settings" },
]

export function DashboardNav({ currentPath }: { currentPath: string }) {
  return (
    <header className="border-b border-border/40 bg-card backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">Snapline Ops</span>
            <Badge variant="secondary" className="text-xs font-semibold">v2</Badge>
          </div>
          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={
                  link.href === currentPath
                    ? "rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground transition-all duration-200 shadow-md hover:shadow-lg"
                    : "rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
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
          <Button size="sm" className="shadow-md hover:shadow-lg transition-all duration-200 font-semibold">
            New report
          </Button>
        </div>
      </div>
    </header>
  )
}
