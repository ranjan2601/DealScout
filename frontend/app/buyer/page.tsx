"use client";

import React, { useState, useEffect } from "react";
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
  const [showPlaceholderNegotiation, setShowPlaceholderNegotiation] = useState(false);

  // Load all products on page mount
  useEffect(() => {
    const loadAllProducts = async () => {
      setIsSearching(true);
      try {
        const response = await fetch("http://localhost:8001/api/seller/products/all");

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = await response.json();
        setSearchResults(data.products || []);
        setHasSearched(true);
      } catch (error) {
        console.error("Error loading products:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    loadAllProducts();
  }, []);

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

  const startPlaceholderNegotiation = () => {
    setIsNegotiating(true);
    setShowPlaceholderNegotiation(true);
    
    const messages = [
      { role: "system", content: `Negotiation initiated. Buyer budget: $${buyerBudget} | Asking price: $${selectedProduct?.asking_price}` },
      { role: "buyer", content: `Hello! I'm the buyer's AI agent. I'm interested in the ${selectedProduct?.product_detail}. My client has authorized a maximum budget of $${buyerBudget}. Given the item's condition and market analysis, I'd like to propose an initial offer of $${Math.floor(buyerBudget * 0.85)}.` },
      { role: "seller", content: `Greetings! I represent the seller. This ${selectedProduct?.product_detail} is listed at $${selectedProduct?.asking_price} based on its ${selectedProduct?.condition} condition and current market value. Your offer of $${Math.floor(buyerBudget * 0.85)} is below our acceptable range. I can offer a counteroffer of $${selectedProduct ? selectedProduct.asking_price - 40 : 0}.` },
      { role: "buyer", content: `I understand your position. However, my market analysis shows similar items selling for lower prices. Considering the depreciation and market trends, would you consider $${Math.floor(buyerBudget * 0.92)}? This represents a fair middle ground.` },
      { role: "seller", content: `I appreciate your research. However, this unit includes original accessories and has been well-maintained. I'm willing to meet you halfway at $${Math.floor((buyerBudget * 0.92 + (selectedProduct?.asking_price || 0) - 40) / 2)}. This is a competitive price for the quality offered.` },
      { role: "buyer", content: `That's closer to acceptable. My client values the included accessories. I can agree to $${Math.floor((buyerBudget * 0.92 + (selectedProduct?.asking_price || 0) - 40) / 2)} if we can finalize the deal today. Can we proceed?` },
      { role: "seller", content: `Excellent! I accept your offer of $${Math.floor((buyerBudget * 0.92 + (selectedProduct?.asking_price || 0) - 40) / 2)}. My client is satisfied with this negotiated price. Let's finalize the transaction.` },
      { role: "system", content: `✓ Deal successfully reached! Final price: $${Math.floor((buyerBudget * 0.92 + (selectedProduct?.asking_price || 0) - 40) / 2)} | Savings: $${(selectedProduct?.asking_price || 0) - Math.floor((buyerBudget * 0.92 + (selectedProduct?.asking_price || 0) - 40) / 2)}` }
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < messages.length) {
        setNegotiationResult((prev: any) => ({
          ...prev,
          messages: messages.slice(0, currentIndex + 1)
        }));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsNegotiating(false);
        const finalPrice = Math.floor((buyerBudget * 0.92 + (selectedProduct?.asking_price || 0) - 40) / 2);
        setNegotiationResult({
          status: "success",
          agreed: true,
          final_price: finalPrice,
          original_price: selectedProduct?.asking_price || 0,
          savings: (selectedProduct?.asking_price || 0) - finalPrice,
          reasoning: `AI agents successfully negotiated from $${selectedProduct?.asking_price} to $${finalPrice}. Your AI agent saved you $${(selectedProduct?.asking_price || 0) - finalPrice} through strategic negotiation!`,
          messages: messages
        });
      }
    }, 2000); // Increased to 2 seconds for better readability
  };

  const handleNegotiate = async () => {
    if (!selectedProduct || buyerBudget <= 0) return;

    if (showPlaceholderNegotiation) {
      startPlaceholderNegotiation();
      return;
    }

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
    setShowPlaceholderNegotiation(false);
  };

  const handleBrowseReset = async () => {
    // Reset the page state and reload all products
    setSelectedProduct(null);
    setSidebarView("product");
    setNegotiationResult(null);
    setShowPlaceholderNegotiation(false);
    setQueryAnalysis(null);
    setIsSearching(true);

    try {
      const response = await fetch("http://localhost:8001/api/seller/products/all");
      if (!response.ok) {
        throw new Error("Failed to load products");
      }
      const data = await response.json();
      setSearchResults(data.products || []);
      setHasSearched(true);
    } catch (error) {
      console.error("Error loading products:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col">
      <Header showBackButton onBrowseClick={handleBrowseReset} />

      <main className="flex-1 flex overflow-hidden">
        <div className={`flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full transition-all duration-300 ${selectedProduct ? 'mr-0 sm:mr-[500px]' : ''}`}>
          {/* Search Bar at the top */}
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />

          {/* Search Results */}
          {hasSearched && (
            <div className="mt-8">
              {queryAnalysis && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg p-6 mb-8 shadow-sm">
                  <h3 className="font-bold text-blue-900 mb-3 text-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Search Analysis
                  </h3>
                  <p className="text-blue-800 mb-4">
                    Query: <span className="font-semibold">"{queryAnalysis.original_query}"</span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {queryAnalysis.category && (
                      <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-blue-100">
                        <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Category</span>
                        <p className="text-blue-900 font-semibold mt-1 capitalize">
                          {queryAnalysis.category.replace("-", " ")}
                        </p>
                      </div>
                    )}
                    {queryAnalysis.max_price && (
                      <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-blue-100">
                        <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Max Price</span>
                        <p className="text-blue-900 font-semibold mt-1">
                          ${queryAnalysis.max_price}
                        </p>
                      </div>
                    )}
                    {queryAnalysis.min_price && (
                      <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-blue-100">
                        <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Min Price</span>
                        <p className="text-blue-900 font-semibold mt-1">
                          ${queryAnalysis.min_price}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isSearching ? (
                <div className="flex justify-center items-center min-h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Searching products...</p>
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-lg">
                    No products found matching your criteria. Try a different search!
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">
                      Found <span className="text-blue-600">{searchResults.length}</span> Product{searchResults.length !== 1 ? "s" : ""}
                    </h2>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {searchResults.map((product) => (
                      <div
                        key={product.item_id}
                        onClick={() => handleProductClick(product)}
                        className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2"
                      >
                        {/* Image Container */}
                        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 h-56 overflow-hidden">
                          <img
                            src={
                              product.images[0] ||
                              "/placeholder.svg?height=400&width=400&query=product"
                             || "/placeholder.svg"}
                            alt={product.product_detail}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {product.images.length > 1 && (
                            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {product.images.length}
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-4">
                            <span
                              className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${getConditionColor(
                                product.condition
                              )}`}
                            >
                              {product.condition}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-base leading-tight group-hover:text-blue-600 transition-colors">
                            {product.product_detail}
                          </h3>

                          {/* Price */}
                          <div className="mb-4">
                            <span className="text-2xl font-bold text-blue-600">
                              ${product.asking_price}
                            </span>
                          </div>

                          {/* Location and Category */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-gray-500 text-sm">
                              <svg
                                className="w-4 h-4 mr-1.5 flex-shrink-0"
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
                              <span className="truncate">{product.location}</span>
                            </div>

                            <div className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                              {product.category.replace("-", " ").toUpperCase()}
                            </div>
                          </div>

                          {/* CTA Button */}
                          <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg group-hover:scale-105 transform duration-200">
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
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}
      
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[500px] bg-white shadow-2xl transform transition-transform duration-300 ease-out z-50 flex flex-col ${
          selectedProduct ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedProduct && (
          <>
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-cyan-600 p-6 shadow-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  {sidebarView === "product" ? "Product Details" : "Negotiate Price"}
                </h3>
                <button
                  onClick={closeSidebar}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
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
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
              {sidebarView === "product" && !negotiationResult && (
                <>
                  {/* Image Carousel */}
                  <div className="relative bg-gray-900 rounded-lg aspect-square flex items-center justify-center overflow-hidden">
                    <img
                      src={selectedProduct.images[currentImageIndex] || "/placeholder.svg"}
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
                        className={`inline-block px-3 py-1.5 rounded font-semibold text-sm ${getConditionColor(
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
                      className="w-full bg-gray-200 text-gray-900 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-all"
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
                    <p className="text-gray-700 mb-6 text-lg">
                      Asking Price: <span className="font-bold text-blue-600 text-2xl">${selectedProduct.asking_price}</span>
                    </p>

                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Your Maximum Budget
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-bold text-lg">$</span>
                        <input
                          type="number"
                          value={buyerBudget}
                          onChange={(e) => setBuyerBudget(Number(e.target.value))}
                          min={selectedProduct.min_selling_price}
                          max={selectedProduct.asking_price + 500}
                          className="w-full pl-8 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-gray-900 font-bold text-xl transition-all"
                          placeholder="0"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Min: ${selectedProduct.min_selling_price}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0V9m0 8l-8-8-4 4-6 6" />
                          </svg>
                          Max: ${selectedProduct.asking_price + 500}
                        </span>
                      </p>
                    </div>

                    <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
                      <div className="relative">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 mb-1">AI Negotiation:</p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              An AI agent will negotiate with the seller's AI agent on your behalf to get the best deal.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setSidebarView("product")}
                        className="flex-1 bg-gray-100 text-gray-700 py-3.5 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => {
                          setShowPlaceholderNegotiation(true);
                          handleNegotiate();
                        }}
                        disabled={isNegotiating || buyerBudget <= 0}
                        className="flex-1 relative bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-size-200 text-white py-3.5 px-4 rounded-xl font-bold hover:bg-pos-100 transition-all duration-500 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                        <span className="relative flex items-center justify-center gap-2">
                          {isNegotiating ? (
                            <>
                              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Negotiating...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Start Negotiation
                            </>
                          )}
                        </span>
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
                    <div className="space-y-6">
                      <h4 className="text-2xl font-bold text-gray-900">
                        Negotiation Complete
                      </h4>

                      {/* Product Info */}
                      <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                        <h5 className="font-semibold text-gray-900 mb-3 text-base">
                          Product Details
                        </h5>
                        <div className="space-y-2">
                          <p className="text-gray-700 text-sm">
                            <span className="font-medium">Item:</span> {selectedProduct?.product_detail}
                          </p>
                          <p className="text-gray-700 text-sm">
                            <span className="font-medium">Asking Price:</span> ${selectedProduct?.asking_price}
                          </p>
                          <p className="text-gray-700 text-sm">
                            <span className="font-medium">Your Budget:</span> ${buyerBudget}
                          </p>
                        </div>
                      </div>

                      {/* Negotiation Result */}
                      {negotiationResult.agreed && (
                        <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <h5 className="font-bold text-green-800 text-xl">Deal Reached!</h5>
                          </div>
                          <p className="text-3xl font-bold text-green-600 mb-2">
                            Final Price: ${negotiationResult.final_price}
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {negotiationResult.reasoning}
                          </p>
                        </div>
                      )}

                      {!negotiationResult.agreed && (
                        <div className="p-6 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300">
                          <h5 className="font-semibold text-yellow-800 mb-2 text-lg">
                            Negotiation Summary
                          </h5>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {negotiationResult.reasoning}
                          </p>
                        </div>
                      )}

                      {/* AI Negotiation Transcript */}
                      <div className="border-t border-gray-200 pt-6">
                        <h5 className="font-semibold text-gray-900 mb-4 text-base flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Full Negotiation Transcript
                        </h5>
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3 max-h-[500px] overflow-y-auto">
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
                </>
              )}
              </div>
            </div>

            {negotiationResult && (
              <div className="flex-shrink-0 p-6 bg-white border-t border-gray-200 shadow-lg">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSidebarView("product");
                      setNegotiationResult(null);
                      setShowPlaceholderNegotiation(false);
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                  >
                    Back to Product
                  </button>
                  <button
                    onClick={closeSidebar}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
