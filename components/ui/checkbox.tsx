import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * Checkbox native dengan tampilan kustom. Memakai input asli supaya
 * keyboard dan screen reader bekerja tanpa kerja tambahan.
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        onChange={(e) => {
          onChange?.(e);
          onCheckedChange?.(e.target.checked);
        }}
        className={cn(
          "peer h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded-sm border border-slate bg-white/[0.02] transition-colors duration-ui",
          "checked:border-accent checked:bg-accent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-void",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Tanda centang digambar sebagai mask SVG agar tidak butuh elemen tambahan.
          "checked:bg-[length:12px] checked:bg-center checked:bg-no-repeat",
          "checked:[background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2304262b' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E\")]",
          className,
        )}
        {...props}
      />
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
