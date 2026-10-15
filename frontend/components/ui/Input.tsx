"use client";

import { ReactNode } from "react";

export interface InputProps {
  id: string;
  type?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
}

export function Input({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  className = "",
  autoComplete,
}: InputProps) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={autoComplete}
      className={`w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-navy placeholder:text-muted focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 transition-all duration-200 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    />
  );
}
