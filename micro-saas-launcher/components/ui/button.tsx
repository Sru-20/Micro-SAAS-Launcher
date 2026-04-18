import * as React from "react";

import { cn } from "./utils";

// A tiny `Slot` implementation to emulate @radix-ui/react-slot behaviour
// so that `Button` can forward props (className, etc.) to its child when
// `asChild` is used.
const Slot: React.FC<React.HTMLAttributes<HTMLElement>> = ({ children, ...props }) => {
  if (!React.isValidElement(children)) return null;
  return React.cloneElement(children, props as any);
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "sm" | "md" | "lg";
  asChild?: boolean; // allow using a custom element (e.g. <Link>) inside
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(
  (
    { className, variant = "default", size = "md", asChild = false, ...props },
    ref,
  ) => {
    const base =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-slate-950";
    const variants: Record<string, string> = {
      default: "bg-slate-100 text-slate-900 hover:bg-white",
      outline:
        "border border-slate-700 bg-transparent text-slate-100 hover:bg-slate-900",
    };
    const sizes: Record<string, string> = {
      sm: "h-8 px-3",
      md: "h-10 px-4",
      lg: "h-11 px-6 text-base",
    };

    const Component: React.ElementType = asChild ? Slot : "button";

    return (
      <Component
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

