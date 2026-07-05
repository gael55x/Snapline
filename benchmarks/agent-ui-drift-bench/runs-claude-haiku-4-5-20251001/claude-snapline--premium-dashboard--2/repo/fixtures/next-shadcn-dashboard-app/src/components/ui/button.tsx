import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = {
  variant: {
    default: "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:bg-primary/95 active:scale-95 transition-all duration-200",
    destructive: "bg-destructive text-destructive-foreground shadow-md hover:shadow-lg hover:bg-destructive/90 active:scale-95 transition-all duration-200",
    outline: "border border-border/60 bg-background shadow-sm hover:shadow-md hover:bg-muted hover:border-border transition-all duration-200",
    secondary: "bg-secondary text-secondary-foreground shadow-sm hover:shadow-md hover:bg-secondary/80 transition-all duration-200",
    ghost: "hover:bg-muted hover:text-foreground transition-colors duration-150",
    link: "text-primary underline-offset-4 hover:underline transition-colors duration-150",
  },
  size: {
    default: "h-9 px-4 py-2 rounded-lg",
    sm: "h-8 rounded-lg px-3 text-xs",
    lg: "h-10 rounded-lg px-8",
    icon: "h-9 w-9 rounded-lg",
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
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50",
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
