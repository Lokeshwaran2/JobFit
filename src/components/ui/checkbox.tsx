"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
        return (
            <div className="relative inline-flex items-center justify-center shrink-0">
                <input
                    type="checkbox"
                    ref={ref}
                    checked={checked}
                    onChange={(e) => {
                        onChange?.(e);
                        onCheckedChange?.(e.target.checked);
                    }}
                    className={cn(
                        "peer h-4 w-4 shrink-0 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none checked:bg-primary checked:border-primary cursor-pointer transition-all shadow-sm",
                        className
                    )}
                    {...props}
                />
                <Check className="h-3 w-3 text-primary-foreground absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity stroke-[3]" />
            </div>
        );
    }
);
Checkbox.displayName = "Checkbox";
