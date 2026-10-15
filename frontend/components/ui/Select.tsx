"use client";

import { ReactNode } from "react";

export interface SelectProps {
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  id,
  value,
  onChange,
  children,
  placeholder,
  disabled = false,
  className = "",
}: SelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-navy placeholder:text-muted focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 transition-all duration-200 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {children}
    </select>
  );
}
