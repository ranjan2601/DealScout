"use client";

import React, { useState, useMemo } from "react";
import Header from "@/components/Header";
import FiltersPanel from "@/components/FiltersPanel";
import ListingCard from "@/components/ListingCard";
import NegotiationPanel from "@/components/NegotiationPanel";
import { Listing, Filters, NegotiationResult } from "@/lib/types";
import { mockListings } from "@/lib/mockData";
import { filterListings } from "@/lib/utils";
import { parseAgentQuery, negotiateListings } from "@/lib/api";

export default function BuyerPage() {
  // State management
  const [filters, setFilters] = useState<Filters>({
    minPrice: undefined,
    maxPrice: undefined,
    maxDistance: undefined,
    selectedConditions: [],
    selectedBrands: [],
  });
  const [listings, setListings] = useState<Listing[]>(mockListings);
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [negotiationResults, setNegotiationResults] = useState<
    Record<string, NegotiationResult>
  >({});
  const [activeNegotiationListingId, setActiveNegotiationListingId] = useState<
    string | null
  >(null);
  const [isNegotiationPanelOpen, setIsNegotiationPanelOpen] = useState(false);
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const [isNegotiating, setIsNegotiating] = useState(false);

  // Filtered listings based on current filters
  const filteredListings = useMemo(() => {
    return filterListings(listings, filters);
  }, [listings, filters]);

  // Handle agent query
  const handleAgentQuery = async (query: string) => {
    setIsAgentLoading(true);
    try {
      const parsedFilters = await parseAgentQuery(query);
      setFilters(parsedFilters);
    } catch (error) {
      console.error("Error parsing agent query:", error);
    } finally {
      setIsAgentLoading(false);
    }
  };

  // Handle listing selection
  const handleSelectionChange = (listingId: string, selected: boolean) => {
    setSelectedListingIds((prev) =>
      selected ? [...prev, listingId] : prev.filter((id) => id !== listingId)
    );
  };

  // Handle negotiation
  const handleNegotiate = async () => {
    if (selectedListingIds.length === 0) return;

    setIsNegotiating(true);
    try {
      const results = await negotiateListings(selectedListingIds);

      // Update listings with negotiated prices
      const updatedListings = listings.map((listing) => {
        const result = results.find((r) => r.listingId === listing.id);
        if (result) {
          return {
            ...listing,
            negotiatedPrice: result.negotiatedPrice,
            savings: result.originalPrice - result.negotiatedPrice,
          };
        }
        return listing;
      });

      setListings(updatedListings);

      // Store negotiation results
      const newResults: Record<string, NegotiationResult> = {};
      results.forEach((result) => {
        newResults[result.listingId] = result;
      });
      setNegotiationResults((prev) => ({ ...prev, ...newResults }));

      // Clear selection
      setSelectedListingIds([]);
    } catch (error) {
      console.error("Error negotiating listings:", error);
    } finally {
      setIsNegotiating(false);
    }
  };

  // Handle view negotiation
  const handleViewNegotiation = (listingId: string) => {
    setActiveNegotiationListingId(listingId);
    setIsNegotiationPanelOpen(true);
  };

  // Get active negotiation data
  const activeListing = listings.find(
    (l) => l.id === activeNegotiationListingId
  );
  const activeNegotiation = activeNegotiationListingId
    ? negotiationResults[activeNegotiationListingId]
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBackButton />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Panel - Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <FiltersPanel
                filters={filters}
                onFiltersChange={setFilters}
                onAgentQuery={handleAgentQuery}
                isLoading={isAgentLoading}
              />
            </div>
          </div>

          {/* Listings Panel - Main Content */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {filteredListings.length} Listing
                    {filteredListings.length !== 1 ? "s" : ""} Found
                  </h2>
                  {selectedListingIds.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedListingIds.length} selected for negotiation
                    </p>
                  )}
                </div>
                <button
                  onClick={handleNegotiate}
                  disabled={selectedListingIds.length === 0 || isNegotiating}
                  className="w-full sm:w-auto bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isNegotiating
                    ? "Negotiating..."
                    : `Negotiate for Selected (${selectedListingIds.length})`}
                </button>
              </div>
            </div>

            {/* Listings Grid */}
            {filteredListings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No listings found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your filters or ask the AI agent to help you find
                  what you're looking for.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isSelected={selectedListingIds.includes(listing.id)}
                    onSelectionChange={handleSelectionChange}
                    onViewNegotiation={handleViewNegotiation}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Negotiation Panel */}
      <NegotiationPanel
        open={isNegotiationPanelOpen}
        onClose={() => {
          setIsNegotiationPanelOpen(false);
          setActiveNegotiationListingId(null);
        }}
        listing={activeListing}
        negotiation={activeNegotiation}
      />
    </div>
  );
}

