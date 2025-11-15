// API client layer for backend communication
// All backend calls should go through this module

import { Filters, NegotiationResult, NegotiationMessage, Listing } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * Parse natural language query into structured filters
 * Calls FastAPI backend: POST ${API_BASE_URL}/agent/parse
 */
export async function parseAgentQuery(query: string): Promise<Filters> {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const filters = await response.json();
    return filters;
  } catch (error) {
    console.error("Error calling agent/parse API:", error);
    
    // Fallback to client-side parsing if backend is unavailable
    console.warn("Falling back to client-side parsing");
    return fallbackParseAgentQuery(query);
  }
}

/**
 * Fallback client-side parsing if backend is unavailable
 */
function fallbackParseAgentQuery(query: string): Filters {
  const filters: Filters = {};

  // Extract price patterns
  const underPriceMatch = query.match(/under \$?(\d+)/i);
  const priceRangeMatch = query.match(/\$?(\d+)\s*-\s*\$?(\d+)/);
  
  if (underPriceMatch) {
    filters.maxPrice = parseInt(underPriceMatch[1], 10);
  } else if (priceRangeMatch) {
    filters.minPrice = parseInt(priceRangeMatch[1], 10);
    filters.maxPrice = parseInt(priceRangeMatch[2], 10);
  }

  // Extract distance patterns
  const distanceMatch = query.match(/(?:within|radius of?)\s*(\d+)\s*miles?/i);
  if (distanceMatch) {
    filters.maxDistance = parseInt(distanceMatch[1], 10);
  }

  // Extract condition keywords
  const conditionKeywords: Array<"new" | "like-new" | "used"> = [];
  if (/\bnew\b/i.test(query) && !/like[- ]new/i.test(query)) {
    conditionKeywords.push("new");
  }
  if (/like[- ]new/i.test(query)) {
    conditionKeywords.push("like-new");
  }
  if (/\bused\b/i.test(query)) {
    conditionKeywords.push("used");
  }
  if (conditionKeywords.length > 0) {
    filters.selectedConditions = conditionKeywords;
  }

  // Extract brand names
  const brands = ["Trek", "Giant", "Specialized", "Cannondale"];
  const foundBrands = brands.filter((brand) =>
    new RegExp(`\\b${brand}\\b`, "i").test(query)
  );
  if (foundBrands.length > 0) {
    filters.selectedBrands = foundBrands;
  }

  return filters;
}

/**
 * Negotiate prices for selected listings
 * Calls FastAPI backend: POST ${API_BASE_URL}/negotiation
 */
export async function negotiateListings(
  listingIds: string[]
): Promise<NegotiationResult[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/negotiation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listing_ids: listingIds,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const results = await response.json();
    
    // Transform backend response to match frontend types
    return results.map((result: any) => ({
      listingId: result.listing_id,
      originalPrice: result.original_price,
      negotiatedPrice: result.negotiated_price,
      messages: result.messages,
    }));
  } catch (error) {
    console.error("Error calling negotiation API:", error);
    
    // Fallback to mock data if backend is unavailable
    console.warn("Falling back to mock data");
    return fallbackNegotiateListings(listingIds);
  }
}

/**
 * Fallback mock negotiation if backend is unavailable
 */
function fallbackNegotiateListings(listingIds: string[]): NegotiationResult[] {
  const mockPrices: Record<string, number> = {
    "listing-1": 1200,
    "listing-2": 850,
    "listing-3": 3500,
    "listing-4": 650,
    "listing-5": 450,
    "listing-6": 980,
    "listing-7": 2100,
    "listing-8": 280,
  };
  
  return listingIds.map((listingId) => {
    const discountPercent = 0.15 + Math.random() * 0.25;
    const originalPrice = mockPrices[listingId] || 1000;
    const negotiatedPrice = Math.round(originalPrice * (1 - discountPercent));

    return {
      listingId,
      originalPrice,
      negotiatedPrice,
      messages: [
        {
          role: "system",
          content: "Backend unavailable. Using mock negotiation data.",
        },
        {
          role: "buyer",
          content: `Mock negotiation: Offering $${negotiatedPrice}`,
        },
        {
          role: "seller",
          content: `Mock negotiation: Accepting $${negotiatedPrice}`,
        },
      ],
    };
  });
}

/**
 * Create a new seller listing
 * TODO: Replace with FastAPI call: POST ${API_BASE_URL}/seller/listings
 */
export async function createSellerListing(listing: Listing): Promise<Listing> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // In a real implementation, this would POST to the backend
  // For now, just return the listing with a generated ID if not present
  return Promise.resolve({
    ...listing,
    id: listing.id || `listing-${Date.now()}`,
    status: listing.status || "published",
  });
}

/**
 * Fetch all seller listings
 * TODO: Replace with FastAPI call: GET ${API_BASE_URL}/seller/listings
 */
export async function fetchSellerListings(): Promise<Listing[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  // In a real implementation, this would GET from the backend
  // For now, return empty array (seller manages state locally)
  return Promise.resolve([]);
}
