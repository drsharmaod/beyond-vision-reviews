// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function formatRating(n: number): string {
  return n.toFixed(2);
}

export function formatDate(d: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-CA", opts ?? { year: "numeric", month: "short", day: "numeric" }).format(new Date(d));
}

export function relativeDelta(current: number, previous: number): { value: number; positive: boolean; neutral: boolean } {
  const value    = current - previous;
  return { value: Math.abs(value), positive: value >= 0, neutral: value === 0 };
}
