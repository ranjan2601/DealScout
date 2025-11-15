// Utility functions

import { Listing, Filters } from "./types";

/**
 * Filter listings based on the current filter state
 */
export function filterListings(listings: Listing[], filters: Filters): Listing[] {
  return listings.filter((listing) => {
    // Price filter
    if (filters.minPrice !== undefined && listing.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && listing.price > filters.maxPrice) {
      return false;
    }

    // Distance filter
    if (filters.maxDistance !== undefined && listing.distanceMiles > filters.maxDistance) {
      return false;
    }

    // Condition filter
    if (
      filters.selectedConditions &&
      filters.selectedConditions.length > 0 &&
      listing.condition &&
      !filters.selectedConditions.includes(listing.condition)
    ) {
      return false;
    }

    // Brand filter
    if (
      filters.selectedBrands &&
      filters.selectedBrands.length > 0 &&
      listing.brand &&
      !filters.selectedBrands.includes(listing.brand)
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format distance values
 */
export function formatDistance(miles: number): string {
  return `${miles.toFixed(1)} miles away`;
}

/**
 * Get badge color based on fraud status
 */
export function getFraudStatusColor(status?: "clear" | "warning" | "failed"): string {
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

/**
 * Get condition display text
 */
export function getConditionText(condition?: "new" | "like-new" | "used"): string {
  switch (condition) {
    case "new":
      return "New";
    case "like-new":
      return "Like New";
    case "used":
      return "Used";
    default:
      return "Unknown";
  }
}

