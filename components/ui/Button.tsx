import { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "icon";
  asChild?: boolean;
};

const variantClasses = {
  primary: "bg-brand text-white shadow-[0_10px_24px_rgba(177,31,36,0.22)] hover:bg-[#9f1b20]",
  secondary: "bg-white text-ink border border-black/8 hover:border-black/15",
  ghost: "bg-transparent text-ink hover:bg-ink/5"
};

const sizeClasses = {
  sm: "min-h-10 px-4 py-2 text-sm",
  md: "min-h-12 px-5 py-3 text-sm",
  icon: "h-10 w-10 text-lg"
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
    "inline-flex items-center justify-center rounded-full font-semibold transition duration-200 active:scale-[0.98]",
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
