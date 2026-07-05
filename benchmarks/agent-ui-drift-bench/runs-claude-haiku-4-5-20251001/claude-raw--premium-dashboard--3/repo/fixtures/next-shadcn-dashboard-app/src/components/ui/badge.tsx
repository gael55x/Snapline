import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = {
  variant: {
    default: "border-transparent bg-primary text-primary-foreground shadow-md",
    secondary: "border-transparent bg-secondary/20 text-secondary shadow-none font-medium",
    destructive: "border-transparent bg-destructive/20 text-destructive shadow-none font-medium",
    outline: "border-border text-foreground bg-muted/30",
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
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        badgeVariants.variant[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
