// Core data types for the DealScout application

export interface Listing {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  distanceMiles: number;
  price: number;
  negotiatedPrice?: number;
  savings?: number;
  brand?: string;
  condition?: "new" | "like-new" | "used" | "for-parts";
  confidenceScore?: number;
  fraudStatus?: "clear" | "warning" | "failed";
  // Seller-specific fields
  category?: string;
  locationCity?: string;
  locationZip?: string;
  deliveryOptions?: {
    pickup: boolean;
    delivery: boolean;
  };
  minPrice?: number;
  status?: "draft" | "published";
  handlingTime?: string;
}

export interface NegotiationMessage {
  role: "buyer" | "seller" | "system";
  content: string;
}

export interface NegotiationResult {
  listingId: string;
  originalPrice: number;
  negotiatedPrice: number;
  messages: NegotiationMessage[];
}

export interface Filters {
  minPrice?: number;
  maxPrice?: number;
  maxDistance?: number;
  selectedConditions?: Array<"new" | "like-new" | "used" | "for-parts">;
  selectedBrands?: string[];
}

export type UserRole = "buyer" | "seller";
