import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge hanya untuk status/label nyata, bukan dekorasi.
 * Radius 4px, tanpa glow, tanpa dot berdenyut.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-2 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-white/[0.05] text-fog",
        accent: "bg-accent-soft text-accent",
        success: "bg-success/15 text-success",
        danger: "bg-danger/15 text-danger",
        outline: "text-fog shadow-hairline",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
