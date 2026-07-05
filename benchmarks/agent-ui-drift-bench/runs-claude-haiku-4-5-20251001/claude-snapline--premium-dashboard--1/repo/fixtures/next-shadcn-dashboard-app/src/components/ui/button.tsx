import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = {
  variant: {
    default: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg",
    destructive: "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg",
    outline: "border border-border/50 bg-background shadow-sm hover:bg-muted hover:text-foreground hover:shadow-md",
    secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md",
    ghost: "hover:bg-muted hover:text-foreground transition-colors",
    link: "text-primary underline-offset-4 hover:underline",
  },
  size: {
    default: "h-10 px-5 py-2",
    sm: "h-9 rounded-lg px-4 text-xs font-medium",
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
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
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
