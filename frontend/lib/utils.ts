import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDistance(miles: number): string {
  if (miles < 1) {
    return `${(miles * 5280).toFixed(0)} ft away`;
  }
  return `${miles.toFixed(1)} mi away`;
}

export function getFraudStatusColor(status: "clear" | "warning" | "failed"): string {
  switch (status) {
    case "clear":
      return "bg-green-100 text-green-800";
    case "warning":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getConditionText(condition: "new" | "like-new" | "used" | "for-parts"): string {
  switch (condition) {
    case "new":
      return "New";
    case "like-new":
      return "Like New";
    case "used":
      return "Used";
    case "for-parts":
      return "For Parts";
    default:
      return condition;
  }
}
