"use client";

import React from "react";
import Image from "next/image";
import { Listing } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface SellerListingsProps {
  listings: Listing[];
  onUpdateListings?: (listings: Listing[]) => void;
}

export default function SellerListings({
  listings,
  onUpdateListings,
}: SellerListingsProps) {
  const handleUnpublish = (listingId: string) => {
    if (onUpdateListings) {
      const updated = listings.map((listing) =>
        listing.id === listingId
          ? { ...listing, status: "draft" as const }
          : listing
      );
      onUpdateListings(updated);
    }
  };

  const handleRepublish = (listingId: string) => {
    if (onUpdateListings) {
      const updated = listings.map((listing) =>
        listing.id === listingId
          ? { ...listing, status: "published" as const }
          : listing
      );
      onUpdateListings(updated);
    }
  };

  if (listings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
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
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No listings yet
        </h3>
        <p className="text-gray-600">
          Create your first listing to start selling on SafeMarket.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Listings</p>
          <p className="text-2xl font-bold text-gray-900">{listings.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Published</p>
          <p className="text-2xl font-bold text-green-600">
            {listings.filter((l) => l.status === "published").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Draft</p>
          <p className="text-2xl font-bold text-gray-600">
            {listings.filter((l) => l.status === "draft").length}
          </p>
        </div>
      </div>

      {/* Listings Table/Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={listing.imageUrl}
                          alt={listing.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {listing.title}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {listing.condition?.replace("-", " ")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {listing.category || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {listing.locationCity || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(listing.price)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {listing.minPrice
                        ? formatCurrency(listing.minPrice)
                        : "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        listing.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {listing.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {listing.status === "published" ? (
                        <button
                          onClick={() => handleUnpublish(listing.id)}
                          className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRepublish(listing.id)}
                          className="text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          Publish
                        </button>
                      )}
                      <span className="text-gray-300">|</span>
                      <button className="text-xs text-gray-400 font-medium cursor-not-allowed">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-gray-200">
          {listings.map((listing) => (
            <div key={listing.id} className="p-4 space-y-3">
              <div className="flex gap-3">
                <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={listing.imageUrl}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {listing.title}
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {listing.category}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        listing.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {listing.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Price:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {formatCurrency(listing.price)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Min:</span>{" "}
                  <span className="text-gray-700">
                    {listing.minPrice ? formatCurrency(listing.minPrice) : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Location:</span>{" "}
                  <span className="text-gray-700">
                    {listing.locationCity || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Condition:</span>{" "}
                  <span className="text-gray-700 capitalize">
                    {listing.condition?.replace("-", " ")}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                {listing.status === "published" ? (
                  <button
                    onClick={() => handleUnpublish(listing.id)}
                    className="flex-1 text-xs text-orange-600 hover:text-orange-700 font-medium py-2 px-3 border border-orange-200 rounded-lg hover:bg-orange-50"
                  >
                    Unpublish
                  </button>
                ) : (
                  <button
                    onClick={() => handleRepublish(listing.id)}
                    className="flex-1 text-xs text-green-600 hover:text-green-700 font-medium py-2 px-3 border border-green-200 rounded-lg hover:bg-green-50"
                  >
                    Publish
                  </button>
                )}
                <button className="flex-1 text-xs text-gray-400 font-medium py-2 px-3 border border-gray-200 rounded-lg cursor-not-allowed">
                  Edit Coming Soon
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

