"use client";

import React from "react";
import Image from "next/image";
import { Listing, NegotiationResult } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface NegotiationPanelProps {
  open: boolean;
  onClose: () => void;
  listing: Listing | undefined;
  negotiation: NegotiationResult | undefined;
}

export default function NegotiationPanel({
  open,
  onClose,
  listing,
  negotiation,
}: NegotiationPanelProps) {
  if (!open || !listing || !negotiation) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Negotiation Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Listing Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex gap-4">
              <div className="relative w-24 h-24 flex-shrink-0">
                <Image
                  src={listing.imageUrl}
                  alt={listing.title}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {listing.title}
                </h3>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Original Price:</span>
                    <span className="text-gray-900 line-through">
                      {formatCurrency(negotiation.originalPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Negotiated Price:</span>
                    <span className="text-green-600 font-bold">
                      {formatCurrency(negotiation.negotiatedPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">You Saved:</span>
                    <span className="text-green-600 font-semibold">
                      {formatCurrency(
                        negotiation.originalPrice - negotiation.negotiatedPrice
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Transcript */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Negotiation Transcript
            </h3>
            <div className="space-y-4">
              {negotiation.messages.map((message, index) => {
                const isSystem = message.role === "system";
                const isBuyer = message.role === "buyer";

                return (
                  <div
                    key={index}
                    className={`${
                      isSystem
                        ? "bg-blue-50 border border-blue-200"
                        : isBuyer
                        ? "bg-green-50 border border-green-200"
                        : "bg-orange-50 border border-orange-200"
                    } rounded-lg p-4`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-semibold uppercase ${
                          isSystem
                            ? "text-blue-700"
                            : isBuyer
                            ? "text-green-700"
                            : "text-orange-700"
                        }`}
                      >
                        {isSystem
                          ? "System"
                          : isBuyer
                          ? "Your AI Agent"
                          : "Seller AI Agent"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{message.content}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 pt-6 space-y-3">
            <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Proceed to Checkout
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
