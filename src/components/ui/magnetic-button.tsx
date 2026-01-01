"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const magneticButtonVariants = cva(
  "magnetic-spotlight inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        outline:
          "border bg-background shadow-xs hover:bg-accent/50 dark:bg-input/30 dark:border-input",
        ghost: "hover:bg-accent/50",
        ripple: "ripple-border border bg-background shadow-xs",
        liquid: "liquid-morph border bg-background shadow-xs",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface MagneticButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof magneticButtonVariants> {
  asChild?: boolean;
}

function MagneticButton({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: MagneticButtonProps) {
  const Comp = asChild ? Slot : "button";
  const ref = React.useRef<HTMLButtonElement>(null);

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = ref.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      button.style.setProperty("--spotlight-x", `${x}%`);
      button.style.setProperty("--spotlight-y", `${y}%`);

      if (variant === "ripple") {
        button.style.setProperty("--ripple-x", `${x}%`);
        button.style.setProperty("--ripple-y", `${y}%`);
      }
    },
    [variant]
  );

  const handleMouseEnter = React.useCallback(() => {
    const button = ref.current;
    if (button) {
      button.style.setProperty("--spotlight-opacity", "1");
    }
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    const button = ref.current;
    if (button) {
      button.style.setProperty("--spotlight-opacity", "0");
      button.style.setProperty("--spotlight-x", "50%");
      button.style.setProperty("--spotlight-y", "50%");
    }
  }, []);

  return (
    <Comp
      ref={ref}
      data-slot="magnetic-button"
      className={cn(magneticButtonVariants({ variant, size, className }))}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </Comp>
  );
}

export { MagneticButton, magneticButtonVariants };
