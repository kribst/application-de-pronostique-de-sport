"use client";

import { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-3xl bg-white border border-border shadow-card ${className}`}
    >
      {children}
    </div>
  );
}
