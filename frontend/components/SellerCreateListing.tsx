"use client";

import React, { useState } from "react";
import { Listing } from "@/lib/types";
import Image from "next/image";

interface SellerCreateListingProps {
  onPublish: (listing: Listing) => void;
}

const CATEGORIES = [
  "Bikes",
  "Electronics",
  "Furniture",
  "Sports & Outdoors",
  "Other",
];

const CONDITIONS: Array<"new" | "like-new" | "used" | "for-parts"> = [
  "new",
  "like-new",
  "used",
  "for-parts",
];

const HANDLING_TIMES = [
  "Same day",
  "1-2 days",
  "3-5 days",
  "1 week",
  "2+ weeks",
];

export default function SellerCreateListing({ onPublish }: SellerCreateListingProps) {
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [category, setCategory] = useState("Bikes");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState<"new" | "like-new" | "used" | "for-parts">("like-new");
  const [imageUrl, setImageUrl] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationZip, setLocationZip] = useState("");
  const [distanceMiles, setDistanceMiles] = useState<number>(10);
  const [pickupOnly, setPickupOnly] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [handlingTime, setHandlingTime] = useState("1-2 days");
  const [listingPrice, setListingPrice] = useState<number | "">("");
  const [minPrice, setMinPrice] = useState<number | "">("");

  const isFormValid = () => {
    return (
      title.trim() !== "" &&
      description.trim() !== "" &&
      brand.trim() !== "" &&
      locationCity.trim() !== "" &&
      listingPrice !== "" &&
      listingPrice > 0 &&
      minPrice !== "" &&
      minPrice > 0 &&
      minPrice <= listingPrice
    );
  };

  const handlePreview = () => {
    if (isFormValid()) {
      setShowPreview(true);
    }
  };

  const handlePublish = () => {
    const newListing: Listing = {
      id: `listing-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      title,
      description,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=300&fit=crop",
      distanceMiles,
      price: Number(listingPrice),
      brand,
      condition,
      category,
      locationCity,
      locationZip,
      deliveryOptions: {
        pickup: pickupOnly,
        delivery: deliveryAvailable,
      },
      minPrice: Number(minPrice),
      status: "published",
      handlingTime,
      confidenceScore: Math.floor(75 + Math.random() * 20), // Mock score 75-95
      fraudStatus: "clear",
    };

    onPublish(newListing);
    setShowPreview(false);
    
    // Reset form
    setTitle("");
    setDescription("");
    setBrand("");
    setImageUrl("");
    setLocationCity("");
    setLocationZip("");
    setListingPrice("");
    setMinPrice("");
    setPickupOnly(true);
    setDeliveryAvailable(false);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Section 1: Category Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            1. What do you want to sell?
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 2: Basic Product Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            2. Basic Product Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Trek Mountain Bike - Excellent Condition"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed information about your item..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand / Manufacturer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g., Trek, Apple, IKEA"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition <span className="text-red-500">*</span>
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="used">Used</option>
                  <option value="for-parts">For Parts</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {imageUrl && (
                <div className="mt-3 relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                    onError={() => setImageUrl("")}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Paste a direct link to your product image
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Location & Logistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            3. Location & Logistics
          </h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  placeholder="e.g., New York"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP / Postal Code
                </label>
                <input
                  type="text"
                  value={locationZip}
                  onChange={(e) => setLocationZip(e.target.value)}
                  placeholder="e.g., 10001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Radius (miles)
              </label>
              <input
                type="number"
                value={distanceMiles}
                onChange={(e) => setDistanceMiles(Number(e.target.value))}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                How far are you willing to deliver or meet?
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Delivery / Pickup Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={pickupOnly}
                    onChange={(e) => setPickupOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Pickup available
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={deliveryAvailable}
                    onChange={(e) => setDeliveryAvailable(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Delivery available
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Handling Time
              </label>
              <select
                value={handlingTime}
                onChange={(e) => setHandlingTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {HANDLING_TIMES.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Pricing & Negotiation Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            4. Pricing & Negotiation Settings
          </h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Listing Price (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value ? Number(e.target.value) : "")}
                  min="0"
                  step="0.01"
                  placeholder="1200"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The price buyers will see initially
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Acceptable Price (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : "")}
                  min="0"
                  step="0.01"
                  placeholder="900"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lowest price for AI negotiation agent
                </p>
              </div>
            </div>

            {minPrice !== "" && listingPrice !== "" && minPrice > listingPrice && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  ⚠️ Minimum price cannot be higher than listing price
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 5: AI / Visa-style Info */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-sm border border-blue-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            5. Visa Confidence Score Preview
          </h2>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Estimated Confidence Score
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {Math.floor(75 + Math.random() * 20)}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${75 + Math.random() * 20}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Your listing details help improve buyer trust. Rich descriptions and
              accurate pricing can increase your score and attract more buyers.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handlePreview}
            disabled={!isFormValid()}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Preview Listing
          </button>
          <button
            disabled
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-400 cursor-not-allowed"
          >
            Save Draft
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <ListingPreviewModal
          listing={{
            id: "preview",
            title,
            description,
            imageUrl: imageUrl || "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=300&fit=crop",
            distanceMiles,
            price: Number(listingPrice),
            brand,
            condition,
            category,
            locationCity,
            locationZip,
            deliveryOptions: {
              pickup: pickupOnly,
              delivery: deliveryAvailable,
            },
            minPrice: Number(minPrice),
            handlingTime,
            confidenceScore: Math.floor(75 + Math.random() * 20),
            fraudStatus: "clear",
          }}
          onClose={() => setShowPreview(false)}
          onPublish={handlePublish}
        />
      )}
    </>
  );
}

// Inline Preview Modal Component
function ListingPreviewModal({
  listing,
  onClose,
  onPublish,
}: {
  listing: Listing;
  onClose: () => void;
  onPublish: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Listing Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image */}
          <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
            <Image src={listing.imageUrl} alt={listing.title} fill className="object-cover" />
          </div>

          {/* Title & Category */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {listing.category && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {listing.category}
                </span>
              )}
              {listing.confidenceScore && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  {listing.confidenceScore}% Confidence
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{listing.title}</h3>
          </div>

          {/* Price */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                ${listing.price.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">USD</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Negotiation range: ${listing.minPrice} - ${listing.price}
            </p>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-500 block mb-1">Brand</span>
              <span className="text-sm font-medium text-gray-900">{listing.brand}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Condition</span>
              <span className="text-sm font-medium text-gray-900 capitalize">
                {listing.condition?.replace("-", " ")}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Location</span>
              <span className="text-sm font-medium text-gray-900">
                {listing.locationCity}
                {listing.locationZip && `, ${listing.locationZip}`}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Service Radius</span>
              <span className="text-sm font-medium text-gray-900">
                {listing.distanceMiles} miles
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Delivery Options</span>
              <div className="flex gap-2">
                {listing.deliveryOptions?.pickup && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    Pickup
                  </span>
                )}
                {listing.deliveryOptions?.delivery && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    Delivery
                  </span>
                )}
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Handling Time</span>
              <span className="text-sm font-medium text-gray-900">{listing.handlingTime}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 pt-6 space-y-3">
            <button
              onClick={onPublish}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              ✓ Publish Listing
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Back to Edit
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

