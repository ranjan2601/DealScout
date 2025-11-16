"use client";

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
  const isBuyer = role === "buyer";
  const isSeller = role === "seller";
  const isSystem = role === "system";

  return (
    <div
      className={`flex ${
        isBuyer ? "justify-end" : isSeller ? "justify-start" : "justify-center"
      }`}
    >
      <div
        className={`max-w-xs p-3 rounded-lg text-sm ${
          isBuyer
            ? "bg-blue-500 text-white"
            : isSeller
            ? "bg-green-500 text-white"
            : "bg-gray-200 text-gray-700 text-center text-xs italic"
        }`}
      >
        {!isSystem && (
          <div className="font-semibold mb-1 text-xs opacity-90">
            {isBuyer ? "Buyer Agent" : "Seller Agent"}
          </div>
        )}
        <div className={isTyping ? "animate-pulse" : ""}>
          {content}
        </div>
      </div>
    </div>
  );
}
