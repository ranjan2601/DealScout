"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import AnimatedTypingBubble from "@/components/AnimatedTypingBubble";

interface Product {
  _id?: string;
  id?: string;
  seller_id: string;
  asking_price: number;
  min_selling_price: number;
  location: string;
  zip_code: string;
  product_detail: string;
  description?: string;
  condition: string;
  item_id: string;
  category: string;
  images: string[];
  created_at?: string;
}

type SidebarView = "product" | "negotiation";

export default function BuyerPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [queryAnalysis, setQueryAnalysis] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sidebarView, setSidebarView] = useState<SidebarView>("product");
  const [buyerBudget, setBuyerBudget] = useState(0);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [negotiationResult, setNegotiationResult] = useState<any>(null);

  // Handle search query
  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await fetch("http://localhost:8001/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setSearchResults(data.products || []);
      setQueryAnalysis(data.query_analysis);
    } catch (error) {
      console.error("Error performing search:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "new":
        return "bg-green-100 text-green-800";
      case "like-new":
        return "bg-blue-100 text-blue-800";
      case "good":
        return "bg-yellow-100 text-yellow-800";
      case "fair":
        return "bg-orange-100 text-orange-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
    setSidebarView("product");
    setNegotiationResult(null);
  };

  const handleNextImage = () => {
    if (selectedProduct && selectedProduct.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedProduct.images.length);
    }
  };

  const handlePrevImage = () => {
    if (selectedProduct && selectedProduct.images.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedProduct.images.length - 1 : prev - 1
      );
    }
  };

  const handleNegotiateClick = () => {
    if (selectedProduct) {
      setBuyerBudget(selectedProduct.asking_price);
      setSidebarView("negotiation");
      setNegotiationResult(null);
    }
  };

  const handleNegotiate = async () => {
    if (!selectedProduct || buyerBudget <= 0) return;

    setIsNegotiating(true);
    const streamedMessages: any[] = [];
    let finalResult: any = null;

    try {
      const response = await fetch("http://localhost:8000/negotiation/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listing_ids: [selectedProduct.item_id],
          buyer_budget: buyerBudget,
        }),
      });

      if (!response.ok) {
        throw new Error("Negotiation failed");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Process complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line) {
            try {
              const data = JSON.parse(line);

              if (data.type === "message") {
                // Add message to streamed messages
                streamedMessages.push({
                  role: data.role,
                  content: data.content,
                });

                // Update UI with the new message
                setNegotiationResult((prev: any) => ({
                  ...prev,
                  messages: streamedMessages,
                }));
              } else if (data.type === "complete") {
                // Final result
                finalResult = data;
              } else if (data.type === "error") {
                throw new Error(data.content);
              }
            } catch (e) {
              console.error("Error parsing message:", e);
            }
          }
        }

        // Keep incomplete line in buffer
        buffer = lines[lines.length - 1];
      }

      // Process final result
      if (finalResult) {
        setNegotiationResult({
          status: finalResult.status,
          agreed: finalResult.status === "success",
          final_price: finalResult.negotiated_price,
          original_price: finalResult.original_price,
          savings: finalResult.savings || 0,
          reasoning:
            finalResult.status === "success"
              ? `Successfully negotiated from $${finalResult.original_price} to $${finalResult.negotiated_price}. You saved $${finalResult.savings || 0}!`
              : "Could not reach an agreement. The seller was not willing to negotiate within your budget.",
          messages: streamedMessages,
          seller_notes: `Original: $${finalResult.original_price} | Negotiated: $${finalResult.negotiated_price}`,
        });
      }
    } catch (error) {
      console.error("Error during negotiation:", error);
      setNegotiationResult({
        status: "error",
        message: "Failed to initiate negotiation. Please try again.",
        messages: streamedMessages,
      });
    } finally {
      setIsNegotiating(false);
    }
  };

  const closeSidebar = () => {
    setSelectedProduct(null);
    setSidebarView("product");
    setNegotiationResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showBackButton />

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl mx-auto w-full">
          {/* Search Bar at the top */}
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />

          {/* Search Results */}
          {hasSearched && (
            <div className="mt-8">
              {queryAnalysis && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Search Analysis
                  </h3>
                  <p className="text-blue-800 text-sm mb-2">
                    Query: "<strong>{queryAnalysis.original_query}</strong>"
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {queryAnalysis.category && (
                      <div>
                        <span className="text-blue-700">Category:</span>
                        <span className="text-blue-900 font-medium ml-2">
                          {queryAnalysis.category.replace("-", " ")}
                        </span>
                      </div>
                    )}
                    {queryAnalysis.max_price && (
                      <div>
                        <span className="text-blue-700">Max Price:</span>
                        <span className="text-blue-900 font-medium ml-2">
                          ${queryAnalysis.max_price}
                        </span>
                      </div>
                    )}
                    {queryAnalysis.min_price && (
                      <div>
                        <span className="text-blue-700">Min Price:</span>
                        <span className="text-blue-900 font-medium ml-2">
                          ${queryAnalysis.min_price}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isSearching ? (
                <div className="flex justify-center items-center min-h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Searching products...</p>
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <p className="text-gray-600">
                    No products found matching your criteria. Try a different
                    search!
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Found {searchResults.length} Product
                    {searchResults.length !== 1 ? "s" : ""}
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {searchResults.map((product) => (
                      <div
                        key={product.item_id}
                        onClick={() => handleProductClick(product)}
                        className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105"
                      >
                        {/* Image Container */}
                        <div className="relative bg-gray-200 h-48 overflow-hidden">
                          <img
                            src={
                              product.images[0] ||
                              "https://via.placeholder.com/500?text=No+Image"
                            }
                            alt={product.product_detail}
                            className="w-full h-full object-cover"
                          />
                          {product.images.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs font-semibold">
                              {product.images.length} photos
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getConditionColor(
                                product.condition
                              )}`}
                            >
                              {product.condition}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
                            {product.product_detail}
                          </h3>

                          {/* Price */}
                          <div className="mb-3">
                            <span className="text-xl font-bold text-blue-600">
                              ${product.asking_price}
                            </span>
                          </div>

                          {/* Location */}
                          <div className="flex items-center text-gray-600 text-xs mb-2">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                            </svg>
                            {product.location}
                          </div>

                          {/* Category Badge */}
                          <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                            {product.category.replace("-", " ")}
                          </div>
                        </div>

                        {/* Click to View */}
                        <div className="px-4 pb-4 pt-0">
                          <button className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 transition-colors">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar for Product Details & Negotiation */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${
          selectedProduct ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedProduct && (
          <div className="h-full overflow-y-auto flex flex-col">
            {/* Close Button */}
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {sidebarView === "product" ? "Product Details" : "Negotiate Price"}
              </h3>
              <button
                onClick={closeSidebar}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <svg
                  className="w-6 h-6"
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

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {sidebarView === "product" && !negotiationResult && (
                <>
                  {/* Product View */}
                  {/* Image Carousel */}
                  <div className="relative bg-gray-900 rounded-lg aspect-square flex items-center justify-center overflow-hidden">
                    <img
                      src={selectedProduct.images[currentImageIndex]}
                      alt={selectedProduct.product_detail}
                      className="w-full h-full object-contain"
                    />

                    {selectedProduct.images.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>

                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs">
                          {currentImageIndex + 1} / {selectedProduct.images.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Product Info */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedProduct.product_detail}
                    </h2>
                    {selectedProduct.description && (
                      <p className="text-gray-600 text-sm">{selectedProduct.description}</p>
                    )}
                  </div>

                  {/* Price and Condition */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-600 text-sm">Asking Price</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${selectedProduct.asking_price}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Condition</p>
                      <span
                        className={`inline-block px-3 py-1 rounded font-semibold text-sm ${getConditionColor(
                          selectedProduct.condition
                        )}`}
                      >
                        {selectedProduct.condition}
                      </span>
                    </div>
                  </div>

                  {/* Category and Location */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-gray-600 text-sm">Category</p>
                      <p className="text-gray-900 capitalize">
                        {selectedProduct.category.replace("-", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Location</p>
                      <p className="text-gray-900">
                        {selectedProduct.location}, {selectedProduct.zip_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Seller ID</p>
                      <p className="text-gray-900 font-mono text-xs">
                        {selectedProduct.seller_id}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleNegotiateClick}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Negotiate Price
                    </button>
                    <button
                      onClick={closeSidebar}
                      className="w-full bg-gray-200 text-gray-900 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}

              {sidebarView === "negotiation" && !negotiationResult && (
                <>
                  {/* Negotiation Input View */}
                  <div>
                    <p className="text-gray-600 mb-6">
                      Asking Price: <span className="font-semibold text-blue-600">${selectedProduct.asking_price}</span>
                    </p>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Maximum Budget
                      </label>
                      <input
                        type="number"
                        value={buyerBudget}
                        onChange={(e) => setBuyerBudget(Number(e.target.value))}
                        min={selectedProduct.min_selling_price}
                        max={selectedProduct.asking_price + 500}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your max budget"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Min: ${selectedProduct.min_selling_price} | Max: ${selectedProduct.asking_price + 500}
                      </p>
                    </div>

                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">AI Negotiation:</span> An AI agent will negotiate with the seller's AI agent on your behalf to get the best deal.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setSidebarView("product")}
                        className="flex-1 bg-gray-200 text-gray-900 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleNegotiate}
                        disabled={isNegotiating || buyerBudget <= 0}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isNegotiating ? "Negotiating..." : "Start Negotiation"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {negotiationResult && (
                <>
                  {/* Negotiation Result View */}
                  {negotiationResult.status === "error" ? (
                    <div>
                      <h4 className="text-xl font-bold text-red-600 mb-4">
                        Negotiation Failed
                      </h4>
                      <p className="text-gray-700 mb-6">
                        {negotiationResult.message}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="text-xl font-bold text-gray-900">
                        Negotiation Complete
                      </h4>

                      {/* Product Info */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h5 className="font-semibold text-gray-900 mb-3">
                          Product Details
                        </h5>
                        <p className="text-gray-700 text-sm mb-2">
                          <span className="font-medium">Item:</span> {selectedProduct?.product_detail}
                        </p>
                        <p className="text-gray-700 text-sm mb-2">
                          <span className="font-medium">Asking Price:</span> ${selectedProduct?.asking_price}
                        </p>
                        <p className="text-gray-700 text-sm">
                          <span className="font-medium">Your Budget:</span> ${buyerBudget}
                        </p>
                      </div>

                      {/* Negotiation Result */}
                      <div className={`p-4 rounded-lg ${
                        negotiationResult.agreed ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"
                      }`}>
                        <h5 className="font-semibold mb-2">
                          {negotiationResult.agreed ? (
                            <span className="text-green-700">Deal Reached!</span>
                          ) : (
                            <span className="text-yellow-700">Negotiation Summary</span>
                          )}
                        </h5>
                        {negotiationResult.agreed && (
                          <p className={`text-lg font-bold mb-3 ${
                            negotiationResult.final_price ? "text-green-600" : "text-gray-700"
                          }`}>
                            Final Price: ${negotiationResult.final_price}
                          </p>
                        )}
                        <p className="text-gray-700 text-sm mb-3">
                          {negotiationResult.reasoning}
                        </p>
                      </div>

                      {/* AI Negotiation Transcript */}
                      <div className="p-4 bg-blue-50 rounded-lg max-h-96 overflow-y-auto">
                        <h5 className="font-semibold text-gray-900 mb-3 text-sm sticky top-0 bg-blue-50 pb-2">
                          Full Negotiation Transcript
                        </h5>
                        <div className="space-y-3">
                          {negotiationResult.messages && negotiationResult.messages.length > 0 ? (
                            negotiationResult.messages.map((msg: any, idx: number) => (
                              <AnimatedTypingBubble
                                key={idx}
                                role={msg.role}
                                content={msg.content}
                                isTyping={false}
                              />
                            ))
                          ) : (
                            <div className="text-gray-600 text-sm">
                              {isNegotiating ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                  Negotiation in progress...
                                </div>
                              ) : (
                                "No negotiation messages available"
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setSidebarView("product")}
                      className="flex-1 bg-gray-200 text-gray-900 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm"
                    >
                      Back
                    </button>
                    <button
                      onClick={closeSidebar}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
