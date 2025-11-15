import React from "react";
import Link from "next/link";

interface HeaderProps {
  showBackButton?: boolean;
}

export default function Header({ showBackButton = false }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
            )}
            <div>
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-2xl font-bold text-gray-900">SafeMarket</h1>
              </Link>
              <p className="text-sm text-gray-600">
                AI-powered marketplace with Visa-style trust and negotiation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Secured by Visa
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

