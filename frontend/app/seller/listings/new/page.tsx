"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import Header from "@/components/Header";

const CATEGORIES = ["mountain-bike", "macbook", "electronics"];
const CONDITIONS = ["new", "like-new", "good", "fair", "poor"];
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export default function NewListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [formData, setFormData] = useState({
    product_detail: "",
    description: "",
    category: "electronics",
    asking_price: "",
    min_selling_price: "",
    location: "",
    zip_code: "",
    condition: "good",
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadError("");

    // Validate number of files
    if (files.length + selectedImages.length > MAX_IMAGES) {
      setUploadError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    // Validate file sizes and types
    for (const file of files) {
      if (file.size > MAX_IMAGE_SIZE) {
        setUploadError(`Image "${file.name}" is too large (max 5MB)`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        setUploadError(`"${file.name}" is not a valid image file`);
        return;
      }
    }

    // Add new images
    setSelectedImages((prev) => [...prev, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const convertImagesToBase64 = async (): Promise<string[]> => {
    const base64Images: string[] = [];
    for (const file of selectedImages) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      base64Images.push(base64);
    }
    return base64Images;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Convert images to base64
      const imageData = await convertImagesToBase64();

      const response = await fetch("http://localhost:8001/api/seller/product/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seller_id: "seller_demo_001",
          asking_price: parseFloat(formData.asking_price),
          min_selling_price: parseFloat(formData.min_selling_price),
          location: formData.location,
          zip_code: formData.zip_code,
          product_detail: formData.product_detail,
          condition: formData.condition,
          description: formData.description,
          category: formData.category,
          images: imageData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create listing");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/seller");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header showBackButton={true} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI-Powered Selling
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Create Your Listing</h1>
          <p className="text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
            List your product and let your AI agent automatically negotiate with buyers to maximize your returns
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-5 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-emerald-800 font-semibold text-lg">Listing created successfully! Redirecting...</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-2xl shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200 p-12 shadow-lg">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Product Title *
                </label>
                <input
                  type="text"
                  name="product_detail"
                  value={formData.product_detail}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium placeholder-gray-500 bg-gray-50"
                  placeholder="e.g., MacBook Pro 16-inch M1 Max"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium bg-gray-50"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace("-", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium placeholder-gray-500 bg-gray-50 resize-none"
                placeholder="Describe your product condition, features, etc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Condition *
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium bg-gray-50"
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond.replace("-", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Asking Price ($) *
                </label>
                <input
                  type="number"
                  name="asking_price"
                  value={formData.asking_price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium placeholder-gray-500 bg-gray-50"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Minimum Selling Price ($) *
                </label>
                <input
                  type="number"
                  name="min_selling_price"
                  value={formData.min_selling_price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium placeholder-gray-500 bg-gray-50"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium placeholder-gray-500 bg-gray-50"
                  placeholder="e.g., New York, NY"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Zip Code *
              </label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                required
                className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium placeholder-gray-500 bg-gray-50"
                placeholder="e.g., 10001"
              />
            </div>

            {/* Image Upload Section */}
            <div className="border-t-2 border-gray-100 pt-8">
              <label className="block text-lg font-bold text-gray-900 mb-6">
                <span className="inline-flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Product Images
                </span>
              </label>

              {/* Upload Error */}
              {uploadError && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-800 font-medium">{uploadError}</p>
                  </div>
                </div>
              )}

              {/* Drag & Drop Upload Area */}
              <div className="mb-8">
                <label className="block border-3 border-dashed border-blue-300 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-500 hover:bg-gradient-to-b hover:from-blue-50 hover:to-cyan-50 transition-all duration-300 bg-gradient-to-b from-slate-50 to-gray-50">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={selectedImages.length >= MAX_IMAGES}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
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
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-900 font-bold text-lg mb-2">
                      {selectedImages.length >= MAX_IMAGES
                        ? `Maximum ${MAX_IMAGES} images added`
                        : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-gray-600 text-sm mb-4">PNG, JPG, GIF up to 5MB each</p>
                    <span className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold">
                      {MAX_IMAGES - selectedImages.length} of {MAX_IMAGES} remaining
                    </span>
                  </div>
                </label>
              </div>

              {/* Image Previews Grid */}
              {imagePreviews.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-4">Selected Images ({imagePreviews.length})</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
                        <img
                          src={preview || "/placeholder.svg"}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-black/0 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-3 right-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <span className="absolute bottom-2 left-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                          #{index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Feature Info Box */}
            <div className="border-t-2 border-gray-100 pt-8">
              <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-2 border-blue-200 rounded-2xl p-8 shadow-sm">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transform -rotate-12">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-gray-900 mb-2">AI-Powered Negotiation</p>
                    <p className="text-gray-700 leading-relaxed">
                      Your AI agent will automatically negotiate with buyer agents to secure the best price within your specified range. All negotiations are transparent and you remain in control.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-10 border-t border-gray-200">
              <Link
                href="/seller"
                className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3.5 rounded-lg font-semibold transition-all duration-300"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3.5 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed duration-300"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating Listing...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Listing
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
