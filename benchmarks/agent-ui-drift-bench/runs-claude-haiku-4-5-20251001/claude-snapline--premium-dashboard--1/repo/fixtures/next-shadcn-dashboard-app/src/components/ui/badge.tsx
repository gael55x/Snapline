import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = {
  variant: {
    default: "border-transparent bg-primary text-primary-foreground shadow",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive: "border-transparent bg-destructive text-destructive-foreground shadow",
    outline: "border-border text-foreground",
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
        "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
        badgeVariants.variant[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
