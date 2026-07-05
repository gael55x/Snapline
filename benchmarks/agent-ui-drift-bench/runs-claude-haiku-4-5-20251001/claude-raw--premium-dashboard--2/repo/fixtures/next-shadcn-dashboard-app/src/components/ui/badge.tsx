import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = {
  variant: {
    default: "border-transparent bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 shadow-sm",
    secondary: "border-transparent bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100",
    destructive: "border-transparent bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 shadow-sm",
    outline: "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900",
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
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
        badgeVariants.variant[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
