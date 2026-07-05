import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = {
  variant: {
    default: "border-transparent bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all",
    secondary: "border-border/60 bg-muted text-secondary-foreground hover:bg-muted/80 transition-colors",
    destructive: "border-transparent bg-destructive text-destructive-foreground shadow-md hover:shadow-lg transition-all",
    outline: "border-border text-foreground hover:bg-muted/40 transition-colors",
  },
} as const

export type BadgeVariant = keyof typeof badgeVariants.variant

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        badgeVariants.variant[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
