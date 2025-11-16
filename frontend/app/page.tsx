import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50 text-gray-900 relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
      
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-[120px]" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b border-gray-200 backdrop-blur-sm bg-white/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="font-semibold text-lg">DealScout</span>
            </div>
            <nav className="hidden sm:flex items-center gap-8 text-sm">
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                How it Works
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                Demo
              </a>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-300 bg-purple-100 text-xs text-purple-700 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Autonomous AI Agent Negotiation
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-center mb-6 max-w-5xl text-balance">
            Watch AI agents{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600">
              negotiate deals
            </span>
            {" "}in real-time
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 text-center max-w-2xl mb-12 text-pretty leading-relaxed">
            Two intelligent agents communicate autonomously to find the optimal price. 
            No human intervention needed—just pure AI negotiation.
          </p>

          <div className="w-full max-w-3xl mb-12 bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Buyer Agent</div>
                  <div className="text-xs text-gray-500">Seeking best price</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  Negotiating
                </div>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex gap-2">
                <div className="bg-purple-100 border border-purple-200 rounded-lg px-4 py-2 max-w-xs">
                  <p className="text-sm text-gray-700">Willing to pay $850 for this item</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="bg-cyan-100 border border-cyan-200 rounded-lg px-4 py-2 max-w-xs">
                  <p className="text-sm text-gray-700">Current asking price is $1000</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="bg-purple-100 border border-purple-200 rounded-lg px-4 py-2 max-w-xs">
                  <p className="text-sm text-gray-700">Can meet at $920?</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="bg-cyan-100 border border-cyan-200 rounded-lg px-4 py-2 max-w-xs">
                  <p className="text-sm text-gray-700">Deal at $925 ✓</p>
                </div>
              </div>
            </div>

            <div className="flex items-start justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Seller Agent</div>
                  <div className="text-xs text-gray-500">Maximizing value</div>
                </div>
              </div>
              <div className="text-xs text-green-600 font-medium">Deal Closed</div>
            </div>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-4 w-full max-w-4xl">
            {/* Buyer Card */}
            <Link href="/buyer">
              <div className="group relative bg-white rounded-xl p-8 border border-gray-200 hover:border-purple-400 hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-50/0 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="relative">
                  <div className="w-12 h-12 mb-4 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <svg
                      className="w-6 h-6 text-purple-600"
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
                  <h2 className="text-2xl font-semibold mb-2 text-gray-900">
                    Deploy Buyer Agent
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Your AI negotiates with seller agents to find the best deals automatically
                  </p>
                  <div className="mt-4 flex items-center text-purple-600 text-sm font-medium">
                    Launch agent
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* Seller Card */}
            <Link href="/seller">
              <div className="group relative bg-white rounded-xl p-8 border border-gray-200 hover:border-cyan-400 hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/0 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="relative">
                  <div className="w-12 h-12 mb-4 bg-cyan-100 rounded-lg flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
                    <svg
                      className="w-6 h-6 text-cyan-600"
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
                  <h2 className="text-2xl font-semibold mb-2 text-gray-900">
                    Deploy Seller Agent
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Your AI handles negotiations with buyer agents to maximize your returns
                  </p>
                  <div className="mt-4 flex items-center text-cyan-600 text-sm font-medium">
                    Launch agent
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>

        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 mt-auto backdrop-blur-sm bg-white/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
              <p>© 2025 DealScout. Built for autonomous negotiation.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-gray-900 transition-colors">
                  GitHub
                </a>
                <a href="#" className="hover:text-gray-900 transition-colors">
                  Docs
                </a>
                <a href="#" className="hover:text-gray-900 transition-colors">
                  Devpost
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
