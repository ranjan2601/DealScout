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
 * Intelligently parses natural language queries like:
 * - "Find me a bike within $900"
 * - "Trek bikes under $1000"
 * - "Mountain bikes under $900 within 5 miles"
 */
function fallbackParseAgentQuery(query: string): Filters {
  const filters: Filters = {};

  console.log("🤖 AI Agent: Parsing query:", query);

  // Extract price patterns (handles various formats)
  // Matches: "under $900", "under 900", "within $500", "budget of $1500", etc.
  // Negative lookahead (?!\s*miles) prevents "within 5 miles" from matching as price
  const underPriceMatch = query.match(/(?:under|below|less than|within|budget|max|maximum)(?:\s+of)?\s*\$?(\d+)(?!\s*miles)/i);
  const overPriceMatch = query.match(/(?:over|above|at least|minimum)\s*\$?(\d+)/i);
  const priceRangeMatch = query.match(/\$?(\d+)\s*(?:to|-)\s*\$?(\d+)/i);

  if (underPriceMatch) {
    filters.maxPrice = parseInt(underPriceMatch[1], 10);
    console.log(`📊 Extracted max price: $${filters.maxPrice}`);
  } else if (overPriceMatch) {
    filters.minPrice = parseInt(overPriceMatch[1], 10);
    console.log(`📊 Extracted min price: $${filters.minPrice}`);
  } else if (priceRangeMatch) {
    filters.minPrice = parseInt(priceRangeMatch[1], 10);
    filters.maxPrice = parseInt(priceRangeMatch[2], 10);
    console.log(`📊 Extracted price range: $${filters.minPrice}-$${filters.maxPrice}`);
  }

  // Extract distance patterns
  // Matches: "within 5 miles", "within 5 mile radius", "5 miles away", etc.
  const distanceMatch = query.match(/(?:within|within a|radius of?|up to|less than)[\s]*(\d+)\s*miles?/i);
  if (distanceMatch) {
    filters.maxDistance = parseInt(distanceMatch[1], 10);
    console.log(`🗺️  Extracted max distance: ${filters.maxDistance} miles`);
  }

  // Extract condition keywords with smart detection
  const conditionKeywords: Array<"new" | "like-new" | "used"> = [];

  // Check for "like new" first (before checking "new" alone)
  if (/like[- ]new/i.test(query)) {
    conditionKeywords.push("like-new");
    console.log("✨ Found: Like-new condition");
  } else {
    // Only check for "new" if "like-new" wasn't found
    if (/\bnew\b/i.test(query) && !/\bused\b/i.test(query)) {
      conditionKeywords.push("new");
      console.log("✨ Found: New condition");
    }
  }

  if (/\bused\b/i.test(query)) {
    conditionKeywords.push("used");
    console.log("✨ Found: Used condition");
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
    console.log("🏭 Found brands:", foundBrands.join(", "));
  }

  // Log parsed filters
  console.log("✅ Parsed filters:", filters);

  return filters;
}

/**
 * Negotiate prices for selected listings
 * Calls backend: POST ${API_BASE_URL}/api/negotiate
 */
export async function negotiateListings(
  listingIds: string[],
  listings: Listing[],
  buyerBudget: number = 600
): Promise<NegotiationResult[]> {
  try {
    // Get full listing objects for each selected ID
    const selectedListings = listings.filter(l => listingIds.includes(l.id));

    if (selectedListings.length === 0) {
      throw new Error("No valid listings found");
    }

    // Start negotiation for first selected listing
    const listing = selectedListings[0];

    const response = await fetch(`${API_BASE_URL}/negotiation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listing_ids: [listing.id],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const results = await response.json();

    // Transform backend response to match frontend types
    if (results && results.length > 0) {
      const result = results[0];
      return [{
        listingId: result.listing_id,
        originalPrice: result.original_price,
        negotiatedPrice: result.negotiated_price,
        messages: result.messages || [],
      }];
    }

    throw new Error("Invalid response format from backend");
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
