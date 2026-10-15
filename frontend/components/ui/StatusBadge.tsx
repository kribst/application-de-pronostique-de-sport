"use client";

import { ReactNode } from "react";

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const statusClasses: Record<string, string> = {
    nouveau: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    en_cours:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    traite:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    archive:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    actif:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    inactif:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  const label =
    status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClasses[status] ?? statusClasses.inactif} ${className}`}
    >
      {label}
    </span>
  );
}
