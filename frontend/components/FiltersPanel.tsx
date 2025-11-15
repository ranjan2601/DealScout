"use client";

import React, { useState } from "react";
import { Filters } from "@/lib/types";
import { availableBrands } from "@/lib/mockData";

interface FiltersPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onAgentQuery: (query: string) => void;
  isLoading?: boolean;
}

export default function FiltersPanel({
  filters,
  onFiltersChange,
  onAgentQuery,
  isLoading = false,
}: FiltersPanelProps) {
  const [agentQuery, setAgentQuery] = useState("");

  const handleAgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agentQuery.trim()) {
      onAgentQuery(agentQuery);
    }
  };

  const handleConditionToggle = (condition: "new" | "like-new" | "used") => {
    const current = filters.selectedConditions || [];
    const updated = current.includes(condition)
      ? current.filter((c) => c !== condition)
      : [...current, condition];
    onFiltersChange({ ...filters, selectedConditions: updated });
  };

  const handleBrandToggle = (brand: string) => {
    const current = filters.selectedBrands || [];
    const updated = current.includes(brand)
      ? current.filter((b) => b !== brand)
      : [...current, brand];
    onFiltersChange({ ...filters, selectedBrands: updated });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      {/* AI Agent Input */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Ask the AI Agent
        </h3>
        <form onSubmit={handleAgentSubmit} className="space-y-3">
          <textarea
            value={agentQuery}
            onChange={(e) => setAgentQuery(e.target.value)}
            placeholder="Find me bikes within 5 miles radius under $1000"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !agentQuery.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Processing..." : "Ask Agent"}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          You can either use filters below or ask the AI agent in natural language.
        </p>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Manual Filters
        </h3>

        {/* Price Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  minPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  maxPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Distance */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Distance (miles)
          </label>
          <input
            type="number"
            placeholder="e.g. 10"
            value={filters.maxDistance || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                maxDistance: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Condition */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condition
          </label>
          <div className="space-y-2">
            {(["new", "like-new", "used"] as const).map((condition) => (
              <label key={condition} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.selectedConditions?.includes(condition) || false}
                  onChange={() => handleConditionToggle(condition)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {condition === "like-new" ? "Like New" : condition}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Brands */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brands
          </label>
          <div className="space-y-2">
            {availableBrands.map((brand) => (
              <label key={brand} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.selectedBrands?.includes(brand) || false}
                  onChange={() => handleBrandToggle(brand)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{brand}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() =>
            onFiltersChange({
              minPrice: undefined,
              maxPrice: undefined,
              maxDistance: undefined,
              selectedConditions: [],
              selectedBrands: [],
            })
          }
          className="w-full text-sm text-gray-600 hover:text-gray-900 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}

