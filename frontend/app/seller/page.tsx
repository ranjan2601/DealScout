"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import SellerCreateListing from "@/components/SellerCreateListing";
import SellerListings from "@/components/SellerListings";
import { Listing } from "@/lib/types";

type TabType = "create" | "listings";

export default function SellerPage() {
  const [activeTab, setActiveTab] = useState<TabType>("create");
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handlePublish = (newListing: Listing) => {
    setMyListings((prev) => [newListing, ...prev]);
    setShowSuccessToast(true);
    setActiveTab("listings");

    // Hide toast after 3 seconds
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);
  };

  const handleUpdateListings = (updatedListings: Listing[]) => {
    setMyListings(updatedListings);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBackButton />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Seller Portal
          </h1>
          <p className="text-gray-600">
            Create and manage your listings with AI-powered negotiation
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("create")}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
                  activeTab === "create"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Listing
                </span>
              </button>
              <button
                onClick={() => setActiveTab("listings")}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
                  activeTab === "listings"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  My Listings
                  {myListings.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {myListings.length}
                    </span>
                  )}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "create" && (
            <SellerCreateListing onPublish={handlePublish} />
          )}
          {activeTab === "listings" && (
            <SellerListings
              listings={myListings}
              onUpdateListings={handleUpdateListings}
            />
          )}
        </div>
      </main>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
            <svg
              className="w-6 h-6 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold">Listing Published!</p>
              <p className="text-sm text-green-100">
                Your listing is now live on SafeMarket
              </p>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="ml-4 text-green-200 hover:text-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
