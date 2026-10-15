"use client";

import { ReactNode } from "react";

export interface TextareaProps {
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Textarea({
  id,
  value,
  onChange,
  rows = 4,
  placeholder,
  disabled = false,
  className = "",
}: TextareaProps) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-navy placeholder:text-muted focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 transition-all duration-200 resize-y ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    />
  );
}
