"use client";

import { useEffect, useState } from "react";

interface AnimatedTypingBubbleProps {
  role: string;
  content: string;
  isTyping?: boolean;
}

export default function AnimatedTypingBubble({
  role,
  content,
  isTyping = false,
}: AnimatedTypingBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const isBuyer = role === "buyer";
  const isSeller = role === "seller";
  const isSystem = role === "system";

  return (
    <div
      className={`flex ${
        isBuyer ? "justify-end" : isSeller ? "justify-start" : "justify-center"
      } transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div
        className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-lg transform transition-all duration-300 hover:scale-105 ${
          isBuyer
            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm"
            : isSeller
            ? "bg-gradient-to-br from-green-600 to-green-700 text-white rounded-bl-sm"
            : "bg-gradient-to-r from-purple-100 to-pink-100 text-gray-800 text-center text-xs italic border-2 border-purple-200 rounded-xl"
        }`}
      >
        {!isSystem && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isBuyer ? "bg-blue-400" : "bg-green-400"
            }`}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-xs">
                {isBuyer ? "Buyer AI Agent" : "Seller AI Agent"}
              </div>
              <div className="text-[10px] opacity-75">
                {isBuyer ? "Negotiating on your behalf" : "Representing the seller"}
              </div>
            </div>
          </div>
        )}
        <div className={`leading-relaxed ${isSystem ? "font-semibold" : ""} ${
          isTyping ? "animate-pulse" : ""
        }`}>
          {content}
        </div>
        {isTyping && (
          <div className="flex gap-1 mt-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        )}
      </div>
    </div>
  );
}
