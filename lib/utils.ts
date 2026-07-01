import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateDetails(text: string, max = 500): string {
  if (text.length <= max) return text
  return text.slice(0, max - 3) + "..."
}
