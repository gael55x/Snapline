import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/", label: "Overview" },
  { href: "/settings", label: "Settings" },
]

export function DashboardNav({ currentPath }: { currentPath: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-card/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10">
              <span className="text-sm font-bold text-accent">S</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground leading-tight">Snapline Ops</span>
              <Badge variant="secondary" className="w-fit text-xs">
                v2
              </Badge>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={
                  link.href === currentPath
                    ? "rounded-lg px-4 py-2 text-sm font-semibold text-foreground bg-muted transition-colors"
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
          <Button size="sm" className="bg-accent hover:bg-accent/90">
            New report
          </Button>
        </div>
      </div>
    </header>
  )
}
