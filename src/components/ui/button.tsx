import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-normal text-center rounded-full text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground hover:bg-border",
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover before:content-['▶'] min-h-[52px] font-semibold",
        destructive: "bg-destructive text-destructive-foreground hover:bg-primary-hover",
        outline: "border-2 border-foreground bg-transparent hover:bg-muted",
        secondary: "border-2 border-foreground bg-transparent hover:bg-muted",
        ghost: "hover:bg-muted text-foreground",
        link: "text-foreground underline decoration-wavy decoration-coral underline-offset-4",
        pop: "bg-primary text-primary-foreground hover:bg-primary-hover font-semibold",
        ink: "border-2 border-foreground bg-transparent hover:bg-muted font-semibold",
      },
      size: {
        default: "min-h-10 px-5 py-2",
        sm: "min-h-10 rounded-full px-4 text-sm",
        lg: "min-h-[56px] rounded-full px-7 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
