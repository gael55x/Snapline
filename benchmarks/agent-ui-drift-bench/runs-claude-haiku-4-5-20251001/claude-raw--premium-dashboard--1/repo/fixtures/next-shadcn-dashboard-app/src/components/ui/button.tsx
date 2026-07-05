import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = {
  variant: {
    default: "bg-slate-900 text-white shadow-lg hover:bg-slate-800 hover:shadow-xl",
    destructive: "bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg",
    outline: "border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-50 hover:border-slate-400",
    secondary: "bg-slate-200 text-slate-900 shadow-sm hover:bg-slate-300 font-semibold",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium",
    link: "text-slate-900 underline-offset-4 hover:underline font-semibold",
  },
  size: {
    default: "h-10 px-5 py-2 rounded-lg",
    sm: "h-9 rounded-lg px-4 text-xs font-semibold",
    lg: "h-11 rounded-lg px-8 font-semibold",
    icon: "h-10 w-10 rounded-lg",
  },
} as const

export type ButtonVariant = keyof typeof buttonVariants.variant
export type ButtonSize = keyof typeof buttonVariants.size

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
