"use client";

import { ReactNode } from "react";

export interface StateProps {
  title: string;
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function LoadingState({ title = "Chargement...", message = "" }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="motion-icon grid h-16 w-16 place-items-center rounded-2xl bg-soft-gold text-navy animate-spin">
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-bold text-navy">{title}</h3>
      {message && <p className="mt-1 text-sm text-muted">{message}</p>}
    </div>
  );
}

export function EmptyState({ title, message, action }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-soft-gold text-navy">
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 016.586 13H8"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-bold text-navy">{title}</h3>
      <p className="mt-1 text-sm text-muted max-w-md">{message}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, action }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300">
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-bold text-navy">Une erreur est survenue</h3>
      <p className="mt-1 text-sm text-muted max-w-md">{message}</p>
      {action}
    </div>
  );
}
