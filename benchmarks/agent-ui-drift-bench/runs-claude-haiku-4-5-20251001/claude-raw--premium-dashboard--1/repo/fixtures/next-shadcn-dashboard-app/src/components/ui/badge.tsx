import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = {
  variant: {
    default: "border-transparent bg-slate-900 text-white shadow-md font-semibold",
    secondary: "border-transparent bg-blue-100 text-blue-900 font-semibold",
    destructive: "border-transparent bg-red-100 text-red-900 shadow-md font-semibold",
    outline: "border-slate-300 text-slate-700 font-semibold",
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
        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        badgeVariants.variant[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
