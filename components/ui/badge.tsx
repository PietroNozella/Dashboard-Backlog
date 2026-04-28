import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Badge com variants para status e prioridades específicas do dashboard
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary/40 bg-primary/20 text-primary-foreground hover:bg-primary/30",
        secondary:
          "border-border/70 bg-secondary text-secondary-foreground hover:bg-secondary/85",
        destructive:
          "border-destructive/40 bg-destructive/20 text-destructive-foreground hover:bg-destructive/30",
        outline: "border-border/80 bg-background/60 text-foreground",

        priorityHigh: "border-rose-500/30 bg-rose-500/12 text-rose-200",
        priorityMedium: "border-amber-500/30 bg-amber-500/12 text-amber-200",
        priorityLow: "border-emerald-500/25 bg-emerald-500/12 text-emerald-200",

        statusPending: "border-slate-400/20 bg-slate-400/10 text-slate-200",
        statusInProgress: "border-sky-500/25 bg-sky-500/12 text-sky-200",
        statusDone: "border-primary/35 bg-primary/18 text-primary-foreground",
        statusCanceled: "border-zinc-500/25 bg-zinc-500/12 text-zinc-300 line-through",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
