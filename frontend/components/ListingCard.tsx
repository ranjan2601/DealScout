"use client";

import React from "react";
import Image from "next/image";
import { Listing } from "@/lib/types";
import {
  formatCurrency,
  formatDistance,
  getFraudStatusColor,
  getConditionText,
} from "@/lib/utils";

interface ListingCardProps {
  listing: Listing;
  isSelected: boolean;
  onSelectionChange: (listingId: string, selected: boolean) => void;
  onViewNegotiation?: (listingId: string) => void;
}

export default function ListingCard({
  listing,
  isSelected,
  onSelectionChange,
  onViewNegotiation,
}: ListingCardProps) {
  const hasNegotiation = listing.negotiatedPrice !== undefined;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
        isSelected ? "border-blue-500 shadow-md" : "border-gray-200"
      }`}
    >
      {/* Image */}
      <div className="relative h-48 w-full">
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          fill
          className="object-cover rounded-t-lg"
        />
        {/* Selection Checkbox */}
        <div className="absolute top-3 left-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelectionChange(listing.id, e.target.checked)}
              className="w-5 h-5 text-blue-600 border-2 border-white rounded focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </label>
        </div>
        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {listing.confidenceScore && (
            <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded shadow-sm">
              {listing.confidenceScore}% confidence
            </span>
          )}
          {listing.fraudStatus && (
            <span
              className={`text-xs font-medium px-2 py-1 rounded shadow-sm ${getFraudStatusColor(
                listing.fraudStatus
              )}`}
            >
              {listing.fraudStatus === "clear" ? "✓ Verified" : listing.fraudStatus}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
          {listing.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {listing.description}
        </p>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
            📍 {formatDistance(listing.distanceMiles)}
          </span>
          {listing.condition && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {getConditionText(listing.condition)}
            </span>
          )}
          {listing.brand && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {listing.brand}
            </span>
          )}
        </div>

        {/* Price Section */}
        <div className="border-t border-gray-200 pt-3">
          {hasNegotiation ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 line-through">
                  {formatCurrency(listing.price)}
                </span>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                  You saved {formatCurrency(listing.savings || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(listing.negotiatedPrice)}
                  </span>
                  <span className="text-sm text-gray-600 ml-2">Negotiated</span>
                </div>
              </div>
              <button
                onClick={() => onViewNegotiation?.(listing.id)}
                className="w-full mt-2 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-100 transition-colors text-sm"
              >
                View Negotiation
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(listing.price)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
