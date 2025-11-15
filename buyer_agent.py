"""
Buyer AI Agent for price negotiation.
Uses Claude Sonnet via OpenRouter API to make conversational offers.
"""

import requests
import json
import os
from typing import Dict, Any


def make_offer(negotiation_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Make an offer based on negotiation state and platform data.

    Args:
        negotiation_state: Contains buyer_prefs, platform_data, history, turn_number

    Returns:
        {
            "action": "accept" | "counter" | "reject" | "walk_away",
            "offer_price": float or None,
            "message": str,
            "confidence": float  # 0.0 to 1.0
        }
    """

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable not set")

    buyer_prefs = negotiation_state.get("buyer_prefs", {})
    platform_data = negotiation_state.get("platform_data", {})
    history = negotiation_state.get("history", [])
    turn_number = negotiation_state.get("turn_number", 1)

    max_budget = buyer_prefs.get("max_budget", 650)
    target_price = buyer_prefs.get("target_price", 650)

    # Build context
    product = platform_data.get("product", {})
    comps = platform_data.get("platform_comps", [])
    stats = platform_data.get("platform_stats", {})

    # Build prompt
    system_prompt = """You are a buyer negotiating in a marketplace. Be realistic and conversational.

Your personality: Data-driven, polite, interested in the product

RULES:
1. Make REALISTIC incremental offers - don't jump to max budget immediately
2. Send actual messages like a real person would (greetings, questions, observations)
3. Reference specific comparable listings from our platform to support offers
4. If seller pushes too hard on a lowball offer, walk away
5. Accept when price is fair and within budget
6. Show genuine interest in the product

CONSTRAINTS:
- NEVER go above max_budget - this is absolute
- Target is target_price but be willing to negotiate
- Only reference platform data - no external sources"""

    user_prompt = f"""PRODUCT DETAILS:
- {product.get('title')} ({product.get('condition')})
- Asking: ${product.get('asking_price')}
- Includes: {', '.join(product.get('extras', []))}

YOUR SITUATION:
- Budget: ${max_budget}
- Target price: ${target_price}
- Turn: {turn_number}

MARKET DATA (from our platform):
Comparable listings:
"""

    for i, comp in enumerate(comps, 1):
        user_prompt += f"  {i}. ${comp.get('price')} - {comp.get('condition')}, {comp.get('status')}\n"

    user_prompt += f"""
Average sold price: ${stats.get('avg_price_sold')}
Median sold price: ${stats.get('median_price_sold')}

CONVERSATION HISTORY:
"""

    if history:
        for msg in history:
            party = "Seller" if msg.get("party") == "seller" else "You (Buyer)"
            user_prompt += f"{party}: {msg.get('message')}\n"
    else:
        user_prompt += "This is your first message. Start the negotiation naturally.\n"

    user_prompt += f"""
YOUR RESPONSE:
Write a natural message as if texting with the seller. Be conversational.

Then decide:
- action="counter" if making an offer (must include offer_price)
- action="accept" if their offer is good (must include the accepted price)
- action="reject" if their offer is not acceptable
- action="walk_away" if they're being unreasonable

Return ONLY this JSON:
{{
    "action": "counter" | "accept" | "reject" | "walk_away",
    "offer_price": <number - required for counter/accept, null for reject/walk_away>,
    "message": "<natural conversational message, reference platform data>",
    "confidence": <0.0-1.0>
}}"""

    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "https://github.com",
                "X-Title": "HackNYU",
            },
            json={
                "model": "anthropic/claude-3-5-sonnet-20241022",
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": user_prompt
                    }
                ],
                "temperature": 0.7,
            }
        )

        result = response.json()

        if "error" in result:
            raise Exception(f"API Error: {result['error']}")

        # Extract response
        response_text = result['choices'][0]['message']['content'].strip()

        # Parse JSON
        try:
            offer = json.loads(response_text)
        except json.JSONDecodeError:
            # Try to extract JSON from response if it's wrapped in other text
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                offer = json.loads(json_match.group())
            else:
                raise ValueError(f"Could not parse JSON from response: {response_text}")

        # Validate response format
        required_keys = {"action", "offer_price", "message", "confidence"}
        if not required_keys.issubset(offer.keys()):
            raise ValueError(f"Missing required keys. Got: {offer.keys()}")

        # Validate action
        if offer["action"] not in ["accept", "counter", "reject", "walk_away"]:
            raise ValueError(f"Invalid action: {offer['action']}")

        # Validate confidence
        if not (0.0 <= offer["confidence"] <= 1.0):
            raise ValueError(f"Confidence must be between 0.0 and 1.0: {offer['confidence']}")

        # Validate offer_price if making counter or accept
        if offer["action"] in ["counter", "accept"]:
            if offer["offer_price"] is None:
                raise ValueError(f"offer_price required for {offer['action']} action")
            if not isinstance(offer["offer_price"], (int, float)):
                raise ValueError(f"offer_price must be numeric: {offer['offer_price']}")

            # Enforce budget constraint
            if offer["offer_price"] > max_budget:
                offer["offer_price"] = max_budget

        return offer

    except Exception as e:
        raise Exception(f"Buyer agent error: {str(e)}")
