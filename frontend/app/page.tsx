import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        {/* Logo and Title */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="mb-6 inline-flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 text-white"
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
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-3 tracking-tight">
            DealScout
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 font-light">
            AI-Powered Negotiation for Better Deals
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-3xl mb-8">
          {/* Buyer Card */}
          <Link href="/buyer">
            <div className="group bg-white rounded-xl p-10 sm:p-12 border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 bg-blue-50 group-hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600"
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
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  I am a Buyer
                </h2>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Browse listings and negotiate the best prices with AI assistance
                </p>
              </div>
            </div>
          </Link>

          {/* Seller Card */}
          <Link href="/seller">
            <div className="group bg-white rounded-xl p-10 sm:p-12 border-2 border-gray-200 hover:border-green-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 bg-green-50 group-hover:bg-green-100 rounded-full flex items-center justify-center transition-colors">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-green-600"
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
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  I am a Seller
                </h2>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  List your items and let AI negotiate on your behalf
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Highlight */}
        <div className="grid sm:grid-cols-3 gap-4 w-full max-w-3xl mt-12 sm:mt-16 px-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 font-semibold text-sm mb-2">
              🤖
            </div>
            <p className="text-sm text-gray-600">AI Negotiation</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-600 font-semibold text-sm mb-2">
              ⚡
            </div>
            <p className="text-sm text-gray-600">Lightning Fast</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-pink-100 text-pink-600 font-semibold text-sm mb-2">
              🔒
            </div>
            <p className="text-sm text-gray-600">Secure Deals</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              © 2025 DealScout. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

