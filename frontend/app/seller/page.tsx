"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";

interface Product {
  _id?: string;
  seller_id: string;
  asking_price: number;
  min_selling_price: number;
  location: string;
  zip_code: string;
  product_detail: string;
  condition: string;
  item_id: string;
  category: string;
  images: string[];
  created_at?: string;
}

interface ModalProduct extends Product {
  currentImageIndex: number;
}

export default function SellerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ModalProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all products from the database API
      const response = await fetch("http://localhost:8001/api/seller/products/all");
      if (!response.ok) throw new Error("Database API not available");

      const data = await response.json();

      if (data.status === "success" && data.products) {
        setProducts(data.products);
      } else {
        throw new Error("Failed to parse products from API");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct({
      ...product,
      currentImageIndex: 0,
    });
  };

  const handleNextImage = () => {
    if (selectedProduct && selectedProduct.images.length > 1) {
      setSelectedProduct({
        ...selectedProduct,
        currentImageIndex: (selectedProduct.currentImageIndex + 1) % selectedProduct.images.length,
      });
    }
  };

  const handlePrevImage = () => {
    if (selectedProduct && selectedProduct.images.length > 1) {
      setSelectedProduct({
        ...selectedProduct,
        currentImageIndex:
          selectedProduct.currentImageIndex === 0
            ? selectedProduct.images.length - 1
            : selectedProduct.currentImageIndex - 1,
      });
    }
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showBackButton />

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Products</h1>
            <p className="text-gray-600">Browse all products from our sellers - click any card to view details and multiple images</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center min-h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-600">No products found</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.item_id}
                  onClick={() => handleProductClick(product)}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105"
                >
                  {/* Image Container */}
                  <div className="relative bg-gray-200 h-48 overflow-hidden">
                    <img
                      src={product.images[0] || "https://via.placeholder.com/500?text=No+Image"}
                      alt={product.product_detail}
                      className="w-full h-full object-cover"
                    />
                    {product.images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs font-semibold">
                        {product.images.length} photos
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getConditionColor(product.condition)}`}>
                        {product.condition}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">{product.product_detail}</h3>

                    {/* Price */}
                    <div className="mb-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-blue-600">${product.asking_price}</span>
                        {product.min_selling_price < product.asking_price && (
                          <span className="text-xs text-gray-500 line-through">${product.min_selling_price}</span>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center text-gray-600 text-xs mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
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
          )}
        </div>
      </main>

      {/* Right Sidebar for Product Details */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${
          selectedProduct ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedProduct && (
          <div className="h-full overflow-y-auto flex flex-col">
            {/* Close Button */}
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
              <button
                onClick={handleCloseModal}
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
              {/* Image Carousel */}
              <div className="relative bg-gray-900 rounded-lg aspect-square flex items-center justify-center overflow-hidden">
                <img
                  src={selectedProduct.images[selectedProduct.currentImageIndex]}
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
                      {selectedProduct.currentImageIndex + 1} / {selectedProduct.images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Product Info */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedProduct.product_detail}
                </h2>
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
                  <p className="text-gray-600 text-sm">Min Selling Price</p>
                  <p className="text-xl font-semibold text-gray-900">
                    ${selectedProduct.min_selling_price}
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
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Negotiate Price
                </button>
                <button
                  onClick={handleCloseModal}
                  className="w-full bg-gray-200 text-gray-900 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
