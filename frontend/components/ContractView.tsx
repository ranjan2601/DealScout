"use client";

import React from "react";

interface ContractProps {
  contract: any;
  onClose?: () => void;
  onAcceptContract?: () => void;
}

export default function ContractView({ contract, onClose, onAcceptContract }: ContractProps) {
  if (!contract) return null;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Purchase Agreement</h2>
            <p className="text-green-100 text-sm">DealScout AI-Negotiated Contract</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-green-200">Contract ID:</span>
            <p className="font-mono">{contract.contract_id}</p>
          </div>
          <div>
            <span className="text-green-200">Generated:</span>
            <p>{formatDate(contract.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto space-y-6">
        {/* Product Summary */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m0 0l8-4m0 0l8 4m0 0v10l-8 4m0 0l-8-4m0 0v-10m0 0l8-4" />
            </svg>
            Product Details
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Item</p>
              <p className="text-lg font-bold text-gray-900">{contract.product.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Condition</p>
                <p className="font-semibold text-gray-900 capitalize">{contract.product.condition}</p>
              </div>
              {contract.product.extras && contract.product.extras.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Extras Included</p>
                  <p className="font-semibold text-gray-900">{contract.product.extras.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price Agreement */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Agreed Price
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Original Asking Price:</span>
              <span className="text-gray-500 line-through">${contract.product.original_price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Negotiated Price:</span>
              <span className="text-2xl font-bold text-green-600">${contract.product.final_price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-green-200">
              <span className="text-green-700 font-semibold">You Saved:</span>
              <span className="text-xl font-bold text-green-600">${contract.product.savings.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Payment Terms
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Item Price:</span>
              <span className="font-semibold">${contract.payment_terms.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee (5%):</span>
              <span className="font-semibold">${contract.payment_terms.platform_fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-300">
              <span className="text-gray-900 font-bold">Total Due:</span>
              <span className="text-xl font-bold text-gray-900">${contract.payment_terms.buyer_total.toFixed(2)}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold text-purple-600 uppercase">{contract.payment_terms.payment_method}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-semibold">{formatDate(contract.payment_terms.due_date)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Terms */}
        <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Delivery & Pickup
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Method:</span>
              <span className="font-semibold capitalize">{contract.delivery_terms.method.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-semibold">{contract.delivery_terms.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Timeframe:</span>
              <span className="font-semibold">Within {contract.delivery_terms.timeframe_days} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Inspection Period:</span>
              <span className="font-semibold">{contract.delivery_terms.buyer_inspection_period_hours} hours</span>
            </div>
          </div>
        </div>

        {/* Return Policy */}
        <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Return Policy
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Returns Accepted:</span>
              <span className="font-semibold text-green-600">{contract.return_policy.eligible ? 'Yes' : 'No'}</span>
            </div>
            {contract.return_policy.eligible && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Return Period:</span>
                  <span className="font-semibold">{contract.return_policy.period_hours} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Refund Amount:</span>
                  <span className="font-semibold">{contract.return_policy.refund_percentage}%</span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  <p>{contract.return_policy.condition}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* AI Negotiation Summary */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Negotiation Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="bg-white/60 p-3 rounded-lg">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {contract.negotiation_summary}
              </p>
            </div>
            <div className="text-xs text-gray-600 italic">
              <p>This price was negotiated autonomously by AI agents representing both buyer and seller interests.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      {onAcceptContract && (
        <div className="border-t-2 border-gray-200 bg-gray-50 p-6">
          <div className="flex gap-4">
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Review Later
              </button>
            )}
            <button
              onClick={onAcceptContract}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              Accept & Proceed to Payment
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            By accepting, you agree to all terms and conditions outlined in this contract
          </p>
        </div>
      )}
    </div>
  );
}
