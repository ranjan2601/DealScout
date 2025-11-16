"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";

interface SellerStats {
  totalListings: number;
  activeListings: number;
  soldListings: number;
  totalRevenue: number;
}

interface Product {
  _id: string;
  product_detail: string;
  asking_price: number;
  status: string;
  created_at: string;
  category: string;
  images: string[];
}

export default function SellerPage() {
  const [sellerId] = useState("seller_demo_001");
  const [stats, setStats] = useState<SellerStats>({
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    totalRevenue: 0,
  });
  const [recentListings, setRecentListings] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSellerData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:8001/api/seller/products/${sellerId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load seller data");
        }

        const data = await response.json();
        const products = data.products || [];

        const active = products.filter(
          (p: Product) => p.status === "active"
        ).length;
        const sold = products.filter((p: Product) => p.status === "sold").length;
        const revenue = products
          .filter((p: Product) => p.status === "sold")
          .reduce((sum: number, p: Product) => sum + (p.asking_price || 0), 0);

        setStats({
          totalListings: products.length,
          activeListings: active,
          soldListings: sold,
          totalRevenue: revenue,
        });

        setRecentListings(products.slice(0, 5));
      } catch (error) {
        console.error("Error loading seller data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSellerData();
  }, [sellerId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Header showBackButton={false} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Seller Dashboard</h1>
            <p className="text-gray-600 text-lg">Manage your products and track AI-powered negotiations</p>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Listings Card */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-7 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-2">Total Listings</p>
                <p className="text-4xl font-bold text-gray-900">
                  {stats.totalListings}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m0 0l8-4m0 0l8 4m0 0v10l-8 4m0 0l-8-4m0 0v-10m0 0l8-4"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Listings Card */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-7 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-2">Active Listings</p>
                <p className="text-4xl font-bold text-emerald-600">
                  {stats.activeListings}
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-4 rounded-2xl shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
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
              </div>
            </div>
          </div>

          {/* Sold Items Card */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-7 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-2">Sold Items</p>
                <p className="text-4xl font-bold text-violet-600">
                  {stats.soldListings}
                </p>
              </div>
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Revenue Card */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-7 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-2">Total Revenue</p>
                <p className="text-4xl font-bold text-amber-600">
                  ${stats.totalRevenue}
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Listings Section */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="border-b-2 border-gray-100 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recent Listings</h2>
                <p className="text-gray-600 text-sm mt-1">Your latest product listings</p>
              </div>
              <Link
                href="/seller/listings"
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
              >
                View All →
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600 font-medium">Loading listings...</p>
              </div>
            </div>
          ) : recentListings.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m0 0l8-4m0 0l8 4m0 0v10l-8 4m0 0l-8-4m0 0v-10m0 0l8-4" />
              </svg>
              <p className="text-gray-600 mb-6 font-medium">No listings yet. Create your first one!</p>
              <Link
                href="/seller/listings/new"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Listing
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-100 bg-gradient-to-r from-slate-50 to-blue-50">
                    <th className="text-left px-8 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="text-left px-8 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="text-left px-8 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-8 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="text-left px-8 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentListings.map((product) => (
                    <tr key={product._id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-colors duration-200">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          {product.images && product.images.length > 0 && (
                            <div className="relative">
                              <img
                                src={product.images[0]}
                                alt={product.product_detail}
                                className="w-12 h-12 rounded-lg object-cover border-2 border-gray-100 shadow-sm"
                              />
                              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 hover:opacity-10 transition-opacity"></div>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {product.product_detail}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-gray-900">
                          ${product.asking_price}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold transition-all ${
                            product.status === "active"
                              ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700"
                              : product.status === "sold"
                              ? "bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700"
                              : "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            product.status === "active"
                              ? "bg-emerald-500"
                              : product.status === "sold"
                              ? "bg-violet-500"
                              : "bg-gray-400"
                          }`}></span>
                          {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-gray-600">
                        {product.created_at ? new Date(product.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-8 py-5">
                        <Link
                          href={`/seller/listings/${product._id}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors hover:gap-2"
                        >
                          Edit
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
