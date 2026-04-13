import { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "icon";
  asChild?: boolean;
};

const variantClasses = {
  primary: "bg-ink text-white hover:bg-brand",
  secondary: "bg-white text-ink border border-ink/10 hover:border-ink/20",
  ghost: "bg-transparent text-ink hover:bg-ink/5"
};

const sizeClasses = {
  sm: "min-h-11 px-4 py-2 text-sm",
  md: "min-h-12 px-5 py-3 text-sm",
  icon: "h-11 w-11 text-lg"
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-full font-semibold transition active:scale-[0.98]",
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (asChild) {
    return <span className={classes}>{children}</span>;
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
