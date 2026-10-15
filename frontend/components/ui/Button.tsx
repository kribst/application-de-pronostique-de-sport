"use client";

import { ReactNode } from "react";

export interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  className = "",
  onClick,
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus-ring focus:outline-none";
  const variantClasses = {
    primary:
      "bg-navy text-white hover:bg-navy/90 shadow-soft active:scale-[0.98]",
    secondary:
      "bg-white text-navy border border-border hover:bg-white/90 hover:border-border/60",
    danger:
      "bg-red-500 text-white hover:bg-red-600 shadow-soft active:scale-[0.98]",
    ghost:
      "bg-transparent text-navy hover:bg-soft-gold hover:text-navy active:scale-[0.98]",
  };
  const sizeClasses = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-5 text-base",
    lg: "h-14 px-8 text-lg",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
