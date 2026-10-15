"use client";

import { ReactNode } from "react";

export interface LabelProps {
  htmlFor: string;
  children: ReactNode;
  className?: string;
}

export function Label({ htmlFor, children, className = "" }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-semibold text-navy mb-1.5 ${className}`}
    >
      {children}
    </label>
  );
}
