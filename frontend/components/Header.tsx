"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface HeaderProps {
  showBackButton?: boolean;
  onBrowseClick?: () => void;
}

export default function Header({ showBackButton = false, onBrowseClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleBrowseClick = () => {
    if (pathname === "/buyer" && onBrowseClick) {
      // Already on buyer page, just reset the view
      onBrowseClick();
    } else {
      // Navigate to buyer page
      router.push("/buyer");
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
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
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">DealScout</h1>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <button
              onClick={handleBrowseClick}
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Browse
            </button>
            <Link
              href="/seller"
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Sell
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
