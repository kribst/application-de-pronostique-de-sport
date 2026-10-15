"use client";

import { ReactNode } from "react";

export interface AlertProps {
  type: "success" | "error" | "info" | "warning";
  children: ReactNode;
  className?: string;
}

export function Alert({ type, children, className = "" }: AlertProps) {
  const typeClasses = {
    success:
      "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:text-green-200",
    error:
      "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:text-red-200",
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200",
    warning:
      "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${typeClasses[type]} ${className}`}
    >
      {children}
    </div>
  );
}
