"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import AnimatedTypingBubble from "@/components/AnimatedTypingBubble";

interface Product {
  _id?: string;
  id?: string;
  seller_id: string;
  asking_price: number;
  min_selling_price: number;
  location: string;
  zip_code: string;
  product_detail: string;
  description?: string;
  condition: string;
  item_id: string;
  category: string;
  images: string[];
  created_at?: string;
}

type SidebarView = "product" | "negotiation";
type PaymentStatus = "idle" | "reviewing" | "payment_modal" | "processing" | "confirmed" | "complete";

export default function BuyerPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [queryAnalysis, setQueryAnalysis] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sidebarView, setSidebarView] = useState<SidebarView>("product");
  const [buyerBudget, setBuyerBudget] = useState(0);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [negotiationResult, setNegotiationResult] = useState<any>(null);
  const [showPlaceholderNegotiation, setShowPlaceholderNegotiation] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [cardName, setCardName] = useState("");

  // Agentic Mode State
  const [agenticMode, setAgenticMode] = useState(false);
  const [agenticQuery, setAgenticQuery] = useState("");
  const [agenticStatus, setAgenticStatus] = useState("");
  const [agenticStep, setAgenticStep] = useState("");
  const [productInfo, setProductInfo] = useState<any>(null);
  const [productQuestions, setProductQuestions] = useState<string[]>([]);
  const [parallelNegotiations, setParallelNegotiations] = useState<any[]>([]);
  const [bestDeal, setBestDeal] = useState<any>(null);
  const [isAgenticSearching, setIsAgenticSearching] = useState(false);

  // Load all products on page mount
  useEffect(() => {
    const loadAllProducts = async () => {
      setIsSearching(true);
      try {
        const response = await fetch("http://localhost:8001/api/seller/products/all");

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = await response.json();
        setSearchResults(data.products || []);
        setHasSearched(true);
      } catch (error) {
        console.error("Error loading products:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    loadAllProducts();
  }, []);

  // Handle search query
  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await fetch("http://localhost:8001/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setSearchResults(data.products || []);
      setQueryAnalysis(data.query_analysis);
    } catch (error) {
      console.error("Error performing search:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
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

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
    setSidebarView("product");
    setNegotiationResult(null);
  };

  const handleNextImage = () => {
    if (selectedProduct && selectedProduct.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedProduct.images.length);
    }
  };

  const handlePrevImage = () => {
    if (selectedProduct && selectedProduct.images.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedProduct.images.length - 1 : prev - 1
      );
    }
  };

  const handleNegotiateClick = () => {
    if (selectedProduct) {
      setBuyerBudget(selectedProduct.asking_price);
      setSidebarView("negotiation");
      setNegotiationResult(null);
    }
  };

  const startPlaceholderNegotiation = () => {
    setIsNegotiating(true);
    setShowPlaceholderNegotiation(true);
    
    const messages = [
      { role: "system", content: `Negotiation initiated. Buyer budget: $${buyerBudget} | Asking price: $${selectedProduct?.asking_price}` },
      { role: "buyer", content: `Hello! I'm the buyer's AI agent. I'm interested in the ${selectedProduct?.product_detail}. My client has authorized a maximum budget of $${buyerBudget}. Given the item's condition and market analysis, I'd like to propose an initial offer of $${Math.floor(buyerBudget * 0.85)}.` },
      { role: "seller", content: `Greetings! I represent the seller. This ${selectedProduct?.product_detail} is listed at $${selectedProduct?.asking_price} based on its ${selectedProduct?.condition} condition and current market value. Your offer of $${Math.floor(buyerBudget * 0.85)} is below our acceptable range. I can offer a counteroffer of $${selectedProduct ? selectedProduct.asking_price - 40 : 0}.` },
      { role: "buyer", content: `I understand your position. However, my market analysis shows similar items selling for lower prices. Considering the depreciation and market trends, would you consider $${Math.floor(buyerBudget * 0.92)}? This represents a fair middle ground.` },
      { role: "seller", content: `I appreciate your research. However, this unit includes original accessories and has been well-maintained. I'm willing to meet you halfway at $${Math.floor((buyerBudget * 0.92 + (selectedProduct?.asking_price || 0) - 40) / 2)}. This is a competitive price for the quality offered.` },
      { role: "buyer", content: `That's closer to acceptable. My client values the included accessories. I can agree to $${Math.floor((buyerBudget * 0.92 + (selectedProduct?.asking_price || 0) - 40) / 2)} if we can finalize the deal today. Can we proceed?` },
      { role: "seller", content: `Excellent! I accept your offer of $${Math.floor((buyerBudget * 0.92 + (selectedProduct?.asking_price || 0) - 40) / 2)}. My client is satisfied with this negotiated price. Let's finalize the transaction.` },
      { role: "system", content: `✓ Deal successfully reached! Final price: $${Math.floor((buyerBudget * 0.92 + (selectedProduct?.asking_price || 0) - 40) / 2)} | Savings: $${(selectedProduct?.asking_price || 0) - Math.floor((buyerBudget * 0.92 + (selectedProduct?.asking_price || 0) - 40) / 2)}` }
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < messages.length) {
        setNegotiationResult((prev: any) => ({
          ...prev,
          messages: messages.slice(0, currentIndex + 1)
        }));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsNegotiating(false);
        const finalPrice = Math.floor((buyerBudget * 0.92 + (selectedProduct?.asking_price || 0) - 40) / 2);
        const result = {
          status: "success",
          agreed: true,
          final_price: finalPrice,
          original_price: selectedProduct?.asking_price || 0,
          savings: (selectedProduct?.asking_price || 0) - finalPrice,
          reasoning: `AI agents successfully negotiated from $${selectedProduct?.asking_price} to $${finalPrice}. Your AI agent saved you $${(selectedProduct?.asking_price || 0) - finalPrice} through strategic negotiation!`,
          messages: messages
        };
        setNegotiationResult(result);

        // Automatically trigger payment after successful negotiation
        setTimeout(() => processAutonomousPayment(finalPrice, result), 2000);
      }
    }, 2000); // Increased to 2 seconds for better readability
  };

  const handleNegotiate = async () => {
    if (!selectedProduct || buyerBudget <= 0) return;

    if (showPlaceholderNegotiation) {
      startPlaceholderNegotiation();
      return;
    }

    setIsNegotiating(true);
    const streamedMessages: any[] = [];
    let finalResult: any = null;

    try {
      const response = await fetch("http://localhost:8000/negotiation/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listing_ids: [selectedProduct.item_id],
          buyer_budget: buyerBudget,
        }),
      });

      if (!response.ok) {
        throw new Error("Negotiation failed");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Process complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line) {
            try {
              const data = JSON.parse(line);

              if (data.type === "message") {
                // Add message to streamed messages
                streamedMessages.push({
                  role: data.role,
                  content: data.content,
                });

                // Update UI with the new message
                setNegotiationResult((prev: any) => ({
                  ...prev,
                  messages: streamedMessages,
                }));
              } else if (data.type === "complete") {
                // Final result
                finalResult = data;
              } else if (data.type === "error") {
                throw new Error(data.content);
              }
            } catch (e) {
              console.error("Error parsing message:", e);
            }
          }
        }

        // Keep incomplete line in buffer
        buffer = lines[lines.length - 1];
      }

      // Process final result
      if (finalResult) {
        const result = {
          status: finalResult.status,
          agreed: finalResult.status === "success",
          final_price: finalResult.negotiated_price,
          original_price: finalResult.original_price,
          savings: finalResult.savings || 0,
          reasoning:
            finalResult.status === "success"
              ? `Successfully negotiated from $${finalResult.original_price} to $${finalResult.negotiated_price}. You saved $${finalResult.savings || 0}!`
              : "Could not reach an agreement. The seller was not willing to negotiate within your budget.",
          messages: streamedMessages,
          seller_notes: `Original: $${finalResult.original_price} | Negotiated: $${finalResult.negotiated_price}`,
        };
        setNegotiationResult(result);

        // Automatically trigger payment if deal was successful
        if (finalResult.status === "success") {
          setTimeout(() => processAutonomousPayment(result.final_price, result), 2000);
        }
      }
    } catch (error) {
      console.error("Error during negotiation:", error);
      setNegotiationResult({
        status: "error",
        message: "Failed to initiate negotiation. Please try again.",
        messages: streamedMessages,
      });
    } finally {
      setIsNegotiating(false);
    }
  };

  const processAutonomousPayment = async (finalPrice: number, negotiationData: any) => {
    if (!selectedProduct) return;

    const platformFee = finalPrice * 0.05;
    const buyerTotal = finalPrice + platformFee;
    const sellerReceives = finalPrice - platformFee;

    // Step 1: Agent reviews the deal
    setPaymentStatus("reviewing");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 2: Open Visa payment modal with AI agent auto-filling details
    setPaymentStatus("payment_modal");
    setShowPaymentModal(true);
    setTransactionDetails({
      buyerDebit: buyerTotal,
      sellerCredit: sellerReceives,
      platformFee: platformFee,
      finalPrice: finalPrice,
    });

    // AI Agent auto-fills card details
    await new Promise(resolve => setTimeout(resolve, 500));
    setCardNumber("4532 1234 5678 9010");
    await new Promise(resolve => setTimeout(resolve, 300));
    setCardName("DEALSCOUT BUYER");
    await new Promise(resolve => setTimeout(resolve, 300));
    setCardExpiry("12 / 28");
    await new Promise(resolve => setTimeout(resolve, 300));
    setCardCVV("123");

    // AI Agent automatically submits payment after 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Process payment directly
    setPaymentStatus("processing");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Payment confirmed
    setPaymentStatus("confirmed");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Close modal and auto-generate contract
    setShowPaymentModal(false);
    setPaymentStatus("complete");
    await new Promise(resolve => setTimeout(resolve, 500));

    // Automatically download contract
    await generateContract(negotiationData, {
      buyerDebit: buyerTotal,
      sellerCredit: sellerReceives,
      platformFee: platformFee,
      finalPrice: finalPrice,
    });
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + (v.length > 2 ? ' / ' + v.slice(2, 4) : '');
    }
    return v;
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Step 3: Process Visa payment
    setPaymentStatus("processing");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Payment confirmed
    setPaymentStatus("confirmed");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 5: Close modal and auto-generate contract
    setShowPaymentModal(false);
    setPaymentStatus("complete");
    await new Promise(resolve => setTimeout(resolve, 500));

    // Automatically download contract
    await generateContract();
  };

  const generateContract = async (negotiationData?: any, transactionData?: any) => {
    // Use parameters if provided, otherwise fall back to state
    const negResult = negotiationData || negotiationResult;
    const txDetails = transactionData || transactionDetails;

    console.log("🔵 generateContract called");
    console.log("🔵 negotiationData:", negotiationData);
    console.log("🔵 transactionData:", transactionData);
    console.log("🔵 negResult:", negResult);
    console.log("🔵 selectedProduct:", selectedProduct);
    console.log("🔵 txDetails:", txDetails);

    if (!negResult || !selectedProduct || negResult.status !== "success") {
      console.log("❌ Validation failed - early return");
      console.log("negResult exists:", !!negResult);
      console.log("selectedProduct exists:", !!selectedProduct);
      console.log("negResult.status:", negResult?.status);
      return;
    }

    try {
      // Generate transaction ID
      const transactionId = `VIS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Get card last 4 digits (or use placeholder if not available)
      const cardLast4 = cardNumber.replace(/\s/g, '').slice(-4) || "9010";

      const requestData = {
        negotiation_id: negResult.negotiation_id || "neg_placeholder",
        buyer_id: "buyer_demo_001",
        seller_id: selectedProduct.seller_id,
        listing_id: selectedProduct.item_id,
        result: {
          status: "success",
          final_price: negResult.final_price,
          buyer_savings: negResult.savings || 0,
          seller_gain: 0,
          turns: negResult.messages?.length || 0,
          history: negResult.messages || []
        },
        product: {
          title: selectedProduct.product_detail,
          condition: selectedProduct.condition,
          asking_price: selectedProduct.asking_price,
          location: selectedProduct.location,
          extras: []
        },
        payment_details: {
          transaction_id: transactionId,
          payment_method: "Visa",
          card_last_4: cardLast4,
          cardholder_name: cardName || "CARDHOLDER",
          transaction_timestamp: new Date().toISOString(),
          amount_paid: txDetails?.buyerDebit || negResult.final_price,
          seller_receives: txDetails?.sellerCredit || negResult.final_price * 0.95
        }
      };

      console.log("🔵 Sending contract request:", requestData);

      const response = await fetch("http://localhost:8000/api/contract/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("🔵 Response status:", response.status);
      console.log("🔵 Response ok:", response.ok);

      if (response.ok) {
        // Get PDF blob from response
        const blob = await response.blob();
        console.log("🔵 Blob size:", blob.size);
        console.log("🔵 Blob type:", blob.type);

        // Extract filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'DealScout_Contract.pdf';
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        console.log("🔵 Downloading file:", filename);

        // Create download link and trigger download automatically
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        // Cleanup after a short delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);

        console.log(`✅ Contract downloaded: ${filename}`);
      } else {
        const errorText = await response.text();
        console.error("❌ Failed to generate contract. Status:", response.status);
        console.error("❌ Error response:", errorText);
      }
    } catch (error) {
      console.error("❌ Error generating contract:", error);
      console.error("❌ Error stack:", (error as Error).stack);
    }
  };

  const closeSidebar = () => {
    setSelectedProduct(null);
    setSidebarView("product");
    setNegotiationResult(null);
    setShowPlaceholderNegotiation(false);
    setPaymentStatus("idle");
    setTransactionDetails(null);
    setShowPaymentModal(false);
    setCardNumber("");
    setCardExpiry("");
    setCardCVV("");
    setCardName("");
  };

  const handleBrowseReset = async () => {
    // Reset the page state and reload all products
    setSelectedProduct(null);
    setSidebarView("product");
    setNegotiationResult(null);
    setShowPlaceholderNegotiation(false);
    setQueryAnalysis(null);
    setIsSearching(true);

    try {
      const response = await fetch("http://localhost:8001/api/seller/products/all");
      if (!response.ok) {
        throw new Error("Failed to load products");
      }
      const data = await response.json();
      setSearchResults(data.products || []);
      setHasSearched(true);
    } catch (error) {
      console.error("Error loading products:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAgenticSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsAgenticSearching(true);
    setAgenticQuery(query);
    setAgenticStatus("Starting AI-powered search...");
    setAgenticStep("init");
    setParallelNegotiations([]);
    setBestDeal(null);

    try {
      const response = await fetch("http://localhost:8000/negotiation/parallel-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search_query: query,
          max_budget: null,
          top_n: 5,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start agentic search");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (data.type === "status") {
              setAgenticStatus(data.message);
              setAgenticStep(data.step);
            } else if (data.type === "product_info") {
              setProductInfo(data.data);
            } else if (data.type === "questions") {
              setProductQuestions(data.data);
            } else if (data.type === "products_found") {
              // Initialize parallel negotiations array
              setParallelNegotiations(
                data.data.map((product: any, index: number) => ({
                  seller_id: product.item_id,
                  product: product,
                  status: "pending",
                  messages: [],
                  final_price: null,
                  index: index,
                }))
              );
            } else if (data.type === "negotiation_start") {
              setParallelNegotiations((prev) =>
                prev.map((neg) =>
                  neg.seller_id === data.seller_id
                    ? { ...neg, status: "negotiating" }
                    : neg
                )
              );
            } else if (data.type === "negotiation_message") {
              setParallelNegotiations((prev) =>
                prev.map((neg) =>
                  neg.seller_id === data.seller_id
                    ? {
                        ...neg,
                        messages: [...neg.messages, data.message],
                      }
                    : neg
                )
              );
            } else if (data.type === "negotiation_complete") {
              setParallelNegotiations((prev) =>
                prev.map((neg) =>
                  neg.seller_id === data.seller_id
                    ? {
                        ...neg,
                        status: "complete",
                        final_price: data.final_price,
                        result: data.result,
                      }
                    : neg
                )
              );
            } else if (data.type === "best_deal") {
              setBestDeal(data.data);
              setAgenticStatus("✅ AI found the best deal for you!");
              setAgenticStep("complete");
            } else if (data.type === "error") {
              setAgenticStatus(`Error: ${data.message}`);
              setAgenticStep("error");
            }
          }
        }
      }
    } catch (error) {
      console.error("Error during agentic search:", error);
      setAgenticStatus("An error occurred during the search");
      setAgenticStep("error");
    } finally {
      setIsAgenticSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col">
      <Header showBackButton onBrowseClick={handleBrowseReset} />

      <main className="flex-1 flex overflow-hidden">
        <div className={`flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full transition-all duration-300 ${selectedProduct ? 'mr-0 sm:mr-[500px]' : ''}`}>
          {/* Agentic Mode Toggle */}
          <div className="mb-6 flex items-center justify-between bg-white rounded-xl shadow-md p-4 border-2 border-blue-100">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">AI Agent Mode</h3>
                <p className="text-sm text-gray-600">Let AI negotiate with multiple sellers simultaneously</p>
              </div>
            </div>
            <button
              onClick={() => setAgenticMode(!agenticMode)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                agenticMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  agenticMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Conditional Rendering based on mode */}
          {agenticMode ? (
            /* AGENTIC MODE UI */
            <div className="space-y-6">
              {/* Agentic Search Input */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 shadow-lg border-2 border-purple-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🤖 AI-Powered Marketplace Search</h2>
                <p className="text-gray-700 mb-4">
                  Tell me what you're looking for in natural language, and I'll negotiate with multiple sellers to find you the best deal!
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAgenticSearch(agenticQuery);
                  }}
                  className="flex gap-3"
                >
                  <input
                    type="text"
                    value={agenticQuery}
                    onChange={(e) => setAgenticQuery(e.target.value)}
                    placeholder='e.g., "Mountain bike under $1000 in good condition"'
                    className="flex-1 px-4 py-3 rounded-lg border-2 border-purple-300 focus:border-purple-500 focus:outline-none text-lg"
                    disabled={isAgenticSearching}
                  />
                  <button
                    type="submit"
                    disabled={isAgenticSearching || !agenticQuery.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isAgenticSearching ? "Searching..." : "Search"}
                  </button>
                </form>
              </div>

              {/* Status Display */}
              {agenticStatus && (
                <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
                  <div className="flex items-center gap-3">
                    {agenticStep !== "complete" && agenticStep !== "error" && (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-600"></div>
                    )}
                    <p className="text-lg font-medium text-gray-900">{agenticStatus}</p>
                  </div>
                </div>
              )}

              {/* Product Info Display */}
              {productInfo && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 shadow-md border-2 border-green-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">📦 Detected Product</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-bold text-gray-900">{productInfo.product_type}</p>
                    </div>
                    {productInfo.max_price && (
                      <div>
                        <p className="text-sm text-gray-600">Max Price</p>
                        <p className="font-bold text-gray-900">${productInfo.max_price}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Condition</p>
                      <p className="font-bold text-gray-900 capitalize">{productInfo.min_condition}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Urgency</p>
                      <p className="font-bold text-gray-900 capitalize">{productInfo.urgency}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Questions Display */}
              {productQuestions.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 shadow-md border-2 border-amber-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">❓ AI-Generated Questions</h3>
                  <p className="text-gray-700 mb-3">My buyer agent will ask these questions to evaluate the product:</p>
                  <ul className="space-y-2">
                    {productQuestions.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">{idx + 1}.</span>
                        <span className="text-gray-800">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Best Deal Recommendation */}
              {bestDeal && (
                <div className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 rounded-xl p-8 shadow-2xl border-4 border-yellow-400">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-yellow-400 p-3 rounded-full">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">🏆 Best Deal Found!</h2>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-bold text-xl text-gray-900 mb-2">{bestDeal.product.product_detail}</h3>
                        <p className="text-gray-600 mb-4">{bestDeal.product.condition}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Original Price:</span>
                            <span className="font-semibold line-through text-gray-500">${bestDeal.product.asking_price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Negotiated Price:</span>
                            <span className="font-bold text-2xl text-green-600">${bestDeal.final_price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">You Save:</span>
                            <span className="font-bold text-xl text-blue-600">${bestDeal.savings}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">Why This Deal?</h4>
                        <p className="text-gray-700">{bestDeal.recommendation_reason}</p>
                        <button className="mt-4 w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 px-6 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all">
                          Accept Best Deal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Parallel Negotiations Grid */}
              {parallelNegotiations.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    🤝 Live Negotiations ({parallelNegotiations.length} sellers)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {parallelNegotiations.map((neg) => (
                      <div
                        key={neg.seller_id}
                        className={`rounded-xl p-4 shadow-lg border-2 ${
                          neg.status === "complete"
                            ? "bg-green-50 border-green-400"
                            : neg.status === "negotiating"
                            ? "bg-blue-50 border-blue-400"
                            : "bg-gray-50 border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-gray-900 truncate">Seller #{neg.index + 1}</h4>
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded-full ${
                              neg.status === "complete"
                                ? "bg-green-200 text-green-800"
                                : neg.status === "negotiating"
                                ? "bg-blue-200 text-blue-800"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            {neg.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">{neg.product.product_detail}</p>
                        <div className="text-xs text-gray-600">
                          <p>Asking: ${neg.product.asking_price}</p>
                          {neg.final_price && (
                            <p className="font-bold text-green-600 mt-1">Final: ${neg.final_price}</p>
                          )}
                        </div>
                        {neg.messages.length > 0 && (
                          <div className="mt-2 text-xs bg-white rounded p-2 max-h-24 overflow-y-auto">
                            <p className="text-gray-600">Last: {neg.messages[neg.messages.length - 1].content}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STANDARD MODE UI (existing search) */
            <>
              <SearchBar onSearch={handleSearch} isLoading={isSearching} />

              {/* Search Results */}
              {hasSearched && (
            <div className="mt-8">
              {queryAnalysis && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg p-6 mb-8 shadow-sm">
                  <h3 className="font-bold text-blue-900 mb-3 text-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Search Analysis
                  </h3>
                  <p className="text-blue-800 mb-4">
                    Query: <span className="font-semibold">"{queryAnalysis.original_query}"</span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {queryAnalysis.category && (
                      <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-blue-100">
                        <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Category</span>
                        <p className="text-blue-900 font-semibold mt-1 capitalize">
                          {queryAnalysis.category.replace("-", " ")}
                        </p>
                      </div>
                    )}
                    {queryAnalysis.max_price && (
                      <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-blue-100">
                        <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Max Price</span>
                        <p className="text-blue-900 font-semibold mt-1">
                          ${queryAnalysis.max_price}
                        </p>
                      </div>
                    )}
                    {queryAnalysis.min_price && (
                      <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-blue-100">
                        <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Min Price</span>
                        <p className="text-blue-900 font-semibold mt-1">
                          ${queryAnalysis.min_price}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isSearching ? (
                <div className="flex justify-center items-center min-h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Searching products...</p>
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-lg">
                    No products found matching your criteria. Try a different search!
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">
                      Found <span className="text-blue-600">{searchResults.length}</span> Product{searchResults.length !== 1 ? "s" : ""}
                    </h2>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {searchResults.map((product) => (
                      <div
                        key={product.item_id}
                        onClick={() => handleProductClick(product)}
                        className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2"
                      >
                        {/* Image Container */}
                        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 h-56 overflow-hidden">
                          <img
                            src={
                              product.images[0] ||
                              "/placeholder.svg?height=400&width=400&query=product"
                             || "/placeholder.svg"}
                            alt={product.product_detail}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {product.images.length > 1 && (
                            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {product.images.length}
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-4">
                            <span
                              className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${getConditionColor(
                                product.condition
                              )}`}
                            >
                              {product.condition}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-base leading-tight group-hover:text-blue-600 transition-colors">
                            {product.product_detail}
                          </h3>

                          {/* Price */}
                          <div className="mb-4">
                            <span className="text-2xl font-bold text-blue-600">
                              ${product.asking_price}
                            </span>
                          </div>

                          {/* Location and Category */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-gray-500 text-sm">
                              <svg
                                className="w-4 h-4 mr-1.5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                              </svg>
                              <span className="truncate">{product.location}</span>
                            </div>

                            <div className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                              {product.category.replace("-", " ").toUpperCase()}
                            </div>
                          </div>

                          {/* CTA Button */}
                          <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg group-hover:scale-105 transform duration-200">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
            </>
          )}
        </div>
      </main>

      {/* Right Sidebar for Product Details & Negotiation */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}
      
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[500px] bg-white shadow-2xl transform transition-transform duration-300 ease-out z-50 flex flex-col ${
          selectedProduct ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedProduct && (
          <>
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-cyan-600 p-6 shadow-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  {sidebarView === "product" ? "Product Details" : "Negotiate Price"}
                </h3>
                <button
                  onClick={closeSidebar}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
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
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
              {sidebarView === "product" && !negotiationResult && (
                <>
                  {/* Image Carousel */}
                  <div className="relative bg-gray-900 rounded-lg aspect-square flex items-center justify-center overflow-hidden">
                    <img
                      src={selectedProduct.images[currentImageIndex] || "/placeholder.svg"}
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
                          {currentImageIndex + 1} / {selectedProduct.images.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Product Info */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedProduct.product_detail}
                    </h2>
                    {selectedProduct.description && (
                      <p className="text-gray-600 text-sm">{selectedProduct.description}</p>
                    )}
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
                      <p className="text-gray-600 text-sm mb-1">Condition</p>
                      <span
                        className={`inline-block px-3 py-1.5 rounded font-semibold text-sm ${getConditionColor(
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
                    <button
                      onClick={handleNegotiateClick}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Negotiate Price
                    </button>
                    <button
                      onClick={closeSidebar}
                      className="w-full bg-gray-200 text-gray-900 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}

              {sidebarView === "negotiation" && !negotiationResult && (
                <>
                  {/* Negotiation Input View */}
                  <div>
                    <p className="text-gray-700 mb-6 text-lg">
                      Asking Price: <span className="font-bold text-blue-600 text-2xl">${selectedProduct.asking_price}</span>
                    </p>

                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Your Maximum Budget
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-bold text-lg">$</span>
                        <input
                          type="number"
                          value={buyerBudget}
                          onChange={(e) => setBuyerBudget(Number(e.target.value))}
                          min={selectedProduct.min_selling_price}
                          max={selectedProduct.asking_price + 500}
                          className="w-full pl-8 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-gray-900 font-bold text-xl transition-all"
                          placeholder="0"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Min: ${selectedProduct.min_selling_price}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0V9m0 8l-8-8-4 4-6 6" />
                          </svg>
                          Max: ${selectedProduct.asking_price + 500}
                        </span>
                      </p>
                    </div>

                    <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
                      <div className="relative">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 mb-1">AI Negotiation:</p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              An AI agent will negotiate with the seller's AI agent on your behalf to get the best deal.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setSidebarView("product")}
                        className="flex-1 bg-gray-100 text-gray-700 py-3.5 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => {
                          setShowPlaceholderNegotiation(true);
                          handleNegotiate();
                        }}
                        disabled={isNegotiating || buyerBudget <= 0}
                        className="flex-1 relative bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-size-200 text-white py-3.5 px-4 rounded-xl font-bold hover:bg-pos-100 transition-all duration-500 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                        <span className="relative flex items-center justify-center gap-2">
                          {isNegotiating ? (
                            <>
                              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Negotiating...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Start Negotiation
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {negotiationResult && (
                <>
                  {/* Negotiation Result View */}
                  {negotiationResult.status === "error" ? (
                    <div>
                      <h4 className="text-xl font-bold text-red-600 mb-4">
                        Negotiation Failed
                      </h4>
                      <p className="text-gray-700 mb-6">
                        {negotiationResult.message}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <h4 className="text-2xl font-bold text-gray-900">
                        Negotiation Complete
                      </h4>

                      {/* Product Info */}
                      <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                        <h5 className="font-semibold text-gray-900 mb-3 text-base">
                          Product Details
                        </h5>
                        <div className="space-y-2">
                          <p className="text-gray-700 text-sm">
                            <span className="font-medium">Item:</span> {selectedProduct?.product_detail}
                          </p>
                          <p className="text-gray-700 text-sm">
                            <span className="font-medium">Asking Price:</span> ${selectedProduct?.asking_price}
                          </p>
                          <p className="text-gray-700 text-sm">
                            <span className="font-medium">Your Budget:</span> ${buyerBudget}
                          </p>
                        </div>
                      </div>

                      {/* Negotiation Result */}
                      {negotiationResult.agreed && (
                        <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <h5 className="font-bold text-green-800 text-xl">Deal Reached!</h5>
                          </div>
                          <p className="text-3xl font-bold text-green-600 mb-2">
                            Final Price: ${negotiationResult.final_price}
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {negotiationResult.reasoning}
                          </p>
                        </div>
                      )}

                      {!negotiationResult.agreed && (
                        <div className="p-6 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300">
                          <h5 className="font-semibold text-yellow-800 mb-2 text-lg">
                            Negotiation Summary
                          </h5>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {negotiationResult.reasoning}
                          </p>
                        </div>
                      )}

                      {/* AI Negotiation Transcript */}
                      <div className="border-t border-gray-200 pt-6">
                        <h5 className="font-semibold text-gray-900 mb-4 text-base flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Full Negotiation Transcript
                        </h5>
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3 max-h-[500px] overflow-y-auto">
                          {negotiationResult.messages && negotiationResult.messages.length > 0 ? (
                            negotiationResult.messages.map((msg: any, idx: number) => (
                              <AnimatedTypingBubble
                                key={idx}
                                role={msg.role}
                                content={msg.content}
                                isTyping={false}
                              />
                            ))
                          ) : (
                            <div className="text-gray-600 text-sm">
                              {isNegotiating ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                  Negotiation in progress...
                                </div>
                              ) : (
                                "No negotiation messages available"
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              </div>
            </div>

            {negotiationResult && (
              <div className="flex-shrink-0 p-6 bg-white border-t border-gray-200 shadow-lg">
                {negotiationResult.agreed ? (
                  <div className="space-y-4">
                    {/* Status Messages */}
                    {paymentStatus === "reviewing" && (
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center animate-pulse">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-blue-900 mb-2">🤖 AI Agent Reviewing Deal</h4>
                            <p className="text-sm text-blue-800">
                              Your AI agent is analyzing the negotiated price of ${negotiationResult.final_price}.
                              Preparing Visa checkout...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentStatus === "complete" && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-green-900">✅ Transaction Complete!</h4>
                            <p className="text-sm text-green-800">
                              Payment processed and contract downloaded successfully
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {(paymentStatus === "idle" || paymentStatus === "payment_modal" || paymentStatus === "processing" || paymentStatus === "confirmed") && paymentStatus !== "complete" && paymentStatus !== "reviewing" && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center animate-pulse">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-purple-900">💳 Payment in Progress</h4>
                            <p className="text-sm text-purple-800">
                              Processing your Visa payment...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          setSidebarView("product");
                          setNegotiationResult(null);
                          setShowPlaceholderNegotiation(false);
                          setPaymentStatus("idle");
                          setTransactionDetails(null);
                        }}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                        disabled={paymentStatus !== "idle" && paymentStatus !== "complete"}
                      >
                        Back to Product
                      </button>
                      <button
                        onClick={closeSidebar}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-colors shadow-md hover:shadow-lg"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSidebarView("product");
                        setNegotiationResult(null);
                        setShowPlaceholderNegotiation(false);
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                    >
                      Back to Product
                    </button>
                    <button
                      onClick={closeSidebar}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-colors shadow-md hover:shadow-lg"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Visa Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1A1F71] to-[#00579F] p-6 rounded-t-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white rounded-xl p-3 shadow-lg">
                    <svg className="w-12 h-8" viewBox="0 0 141 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M58.8 12.4L50.6 35.6H44.8L40.8 17.2C40.5 16 40.3 15.4 39.7 15C38.7 14.4 37.1 13.8 35.7 13.4L35.9 12.4H46.5C47.7 12.4 48.7 13.2 49 14.6L51.2 26.8L57.1 12.4H58.8ZM84.7 29.2C84.7 23.4 76.5 23 76.6 20.4C76.6 19.6 77.4 18.8 79.1 18.6C80 18.5 82.6 18.4 85.5 19.8L86.6 14.2C85.2 13.7 83.4 13.2 81.2 13.2C75.7 13.2 71.7 16.1 71.7 20.2C71.6 23.2 74.4 24.9 76.5 25.9C78.7 26.9 79.4 27.5 79.4 28.4C79.4 29.7 77.8 30.3 76.3 30.3C73.8 30.3 72.4 29.9 70.4 29L69.2 34.7C71.2 35.6 74.9 36.4 78.7 36.4C84.6 36.4 88.5 33.5 84.7 29.2ZM105.5 35.6H110.7L106.1 12.4H101.3C100.2 12.4 99.3 13 98.9 14L90.2 35.6H96.1L97.3 32.4H104.5L105.5 35.6ZM98.9 27.8L101.5 20.3L103.1 27.8H98.9ZM72.7 12.4L68.1 35.6H62.5L67.1 12.4H72.7Z" fill="#1434CB"/>
                      <path d="M58.8 12.4L50.6 35.6H44.8L40.8 17.2C40.5 16 40.3 15.4 39.7 15C38.7 14.4 37.1 13.8 35.7 13.4L35.9 12.4H46.5C47.7 12.4 48.7 13.2 49 14.6L51.2 26.8L57.1 12.4H58.8Z" fill="#1434CB"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">Visa Checkout</h3>
                    <p className="text-blue-200 text-sm flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      AI-Powered Payment
                    </p>
                  </div>
                </div>
              </div>
              {transactionDetails && (
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-100 text-sm">Total Amount</span>
                    <span className="text-white font-bold text-2xl">${transactionDetails.buyerDebit.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-blue-200">
                    Product: ${transactionDetails.finalPrice.toFixed(2)} + Fee: ${transactionDetails.platformFee.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Form */}
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-5">
              {paymentStatus === "payment_modal" && (
                <>
                  {/* AI Agent Notice */}
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900">🤖 AI Agent Auto-Filling Payment</p>
                      <p className="text-xs text-blue-700 mt-1">Your AI agent is securely processing this transaction on your behalf...</p>
                    </div>
                  </div>

                  {/* Card Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="4532 1234 5678 9010"
                        maxLength={19}
                        required
                        readOnly
                        className="w-full px-4 py-3 border-2 border-blue-300 bg-blue-50 rounded-lg outline-none transition-all font-mono text-lg text-gray-900 cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-10 h-6" viewBox="0 0 48 32" fill="none">
                          <rect width="48" height="32" rx="4" fill="#1A1F71"/>
                          <path d="M18.5 16L21.5 11H23.5L20.5 16L23.5 21H21.5L18.5 16Z" fill="#F7B600"/>
                          <path d="M24.5 11H26.5L29.5 16L26.5 21H24.5L27.5 16L24.5 11Z" fill="#F7B600"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      placeholder="JOHN DOE"
                      required
                      readOnly
                      className="w-full px-4 py-3 border-2 border-blue-300 bg-blue-50 rounded-lg outline-none transition-all uppercase text-gray-900 cursor-not-allowed"
                    />
                  </div>

                  {/* Expiry and CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="MM / YY"
                        maxLength={7}
                        required
                        readOnly
                        className="w-full px-4 py-3 border-2 border-blue-300 bg-blue-50 rounded-lg outline-none transition-all font-mono text-gray-900 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cardCVV}
                        onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        placeholder="123"
                        maxLength={3}
                        required
                        readOnly
                        className="w-full px-4 py-3 border-2 border-blue-300 bg-blue-50 rounded-lg outline-none transition-all font-mono text-gray-900 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-green-900">Secure Payment</p>
                      <p className="text-xs text-green-700">Your payment is encrypted and secure</p>
                    </div>
                  </div>

                  {/* AI Agent Status */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-bold">AI Agent Processing Payment...</p>
                    </div>
                    <p className="text-sm text-blue-100">Payment will be submitted automatically</p>
                  </div>
                </>
              )}

              {paymentStatus === "processing" && (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">🤖 AI Agent Processing Payment</h4>
                  <p className="text-gray-600">Your AI agent is completing the Visa transaction...</p>
                  <div className="mt-4 flex items-center justify-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              )}

              {paymentStatus === "confirmed" && (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-green-900 mb-2">✅ AI Agent Payment Complete!</h4>
                  <p className="text-gray-600 mb-4">Your AI agent successfully processed the Visa payment</p>
                  {transactionDetails && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount Paid:</span>
                        <span className="font-semibold text-green-600">-${transactionDetails.buyerDebit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Seller Receives:</span>
                        <span className="font-semibold text-green-600">+${transactionDetails.sellerCredit.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-4">Generating your contract...</p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
