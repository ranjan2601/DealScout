"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";

interface Product {
  _id: string;
  product_detail: string;
  asking_price: number;
  min_selling_price: number;
  status: string;
  created_at: string;
  category: string;
  condition: string;
  images: string[];
}

export default function ListingsPage() {
  const [sellerId] = useState("seller_demo_001");
  const [listings, setListings] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8001/api/seller/products/${sellerId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load listings");
      }

      const data = await response.json();
      setListings(data.products || []);
    } catch (error) {
      console.error("Error loading listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      const response = await fetch(
        `http://localhost:8001/api/seller/product/${itemId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setListings(listings.filter((p) => p._id !== itemId));
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
    }
  };

  const filteredListings = listings.filter((listing) => {
    if (filter === "all") return true;
    return listing.status === filter;
  });

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "new":
        return "bg-green-100 text-green-800 border-green-300";
      case "like-new":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "good":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "fair":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "poor":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50">
      <Header showBackButton={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Listings</h1>
            <p className="text-gray-600 text-lg">Manage your products and track their performance in the marketplace</p>
          </div>
          <Link
            href="/seller/listings/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 duration-300"
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
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Listing
          </Link>
        </div>

        {/* Filter Buttons */}
        <div className="mb-10 flex flex-wrap gap-3">
          {["all", "active", "sold", "delisted"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 duration-300 ${
                filter === status
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-400 hover:text-blue-600 hover:shadow-md"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 border-t-cyan-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your listings...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No {filter !== "all" ? filter : ""} listings found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {filter === "all" 
                ? "Create your first listing to start selling with AI negotiation"
                : `You don't have any ${filter} listings at the moment`}
            </p>
            <Link
              href="/seller/listings/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((product) => (
              <div
                key={product._id}
                className="group bg-white rounded-2xl border-2 border-gray-100 shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 hover:border-blue-400"
              >
                {/* Product Image */}
                <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0] || "/placeholder.svg"}
                      alt={product.product_detail}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 24 24' fill='none' stroke='%23999' strokeWidth='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='M21 15l-5-5L5 21'/%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Condition Badge */}
                  <div className="absolute bottom-3 left-3">
                    <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold border shadow-lg ${getConditionColor(product.condition)}`}>
                      {product.condition.replace("-", " ")}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
                        product.status === "active"
                          ? "bg-green-500 text-white"
                          : product.status === "sold"
                          ? "bg-purple-500 text-white"
                          : "bg-gray-500 text-white"
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  {/* Product Title */}
                  <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg leading-tight min-h-[56px]">
                    {product.product_detail}
                  </h3>

                  {/* Category */}
                  <div className="mb-4">
                    <span className="inline-flex items-center bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-cyan-200">
                      {product.category.replace("-", " ").toUpperCase()}
                    </span>
                  </div>

                  {/* Price Section */}
                  <div className="mb-5 pb-5 border-b border-gray-200">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                        ${product.asking_price}
                      </span>
                      <span className="text-gray-500 text-sm">asking</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5 font-medium">
                      Min. acceptable: ${product.min_selling_price}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Link
                      href={`/seller/listings/${product._id}`}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:from-blue-700 hover:to-cyan-700 transition-all text-center shadow-md hover:shadow-lg transform hover:scale-105 duration-300"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="flex-1 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 px-4 py-3 rounded-xl text-sm font-bold hover:from-red-100 hover:to-pink-100 transition-all border-2 border-red-200 hover:border-red-300 hover:shadow-md transform hover:scale-105 duration-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
