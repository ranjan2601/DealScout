"""
Seller AI Agent for price negotiation.
Uses Claude Sonnet via OpenRouter API to make conversational responses.
"""

import requests
import json
import os
from typing import Dict, Any


def respond_to_offer(negotiation_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Respond to a buyer's offer based on negotiation state and platform data.

    Args:
        negotiation_state: Contains seller_prefs, platform_data, history, turn_number

    Returns:
        {
            "action": "accept" | "counter" | "reject",
            "offer_price": float or None,
            "message": str,
            "confidence": float  # 0.0 to 1.0
        }
    """

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable not set")

    seller_prefs = negotiation_state.get("seller_prefs", {})
    platform_data = negotiation_state.get("platform_data", {})
    history = negotiation_state.get("history", [])
    turn_number = negotiation_state.get("turn_number", 1)

    min_acceptable = seller_prefs.get("min_acceptable", 750)
    asking_price = seller_prefs.get("asking_price", 750)
    can_bundle_extras = seller_prefs.get("can_bundle_extras", [])

    # Build context
    product = platform_data.get("product", {})
    comps = platform_data.get("platform_comps", [])
    stats = platform_data.get("platform_stats", {})

    # Get last buyer offer
    last_buyer_offer = None
    for turn in reversed(history):
        if turn.get("party") == "buyer":
            last_buyer_offer = turn.get("offer_price")
            break

    # Build prompt
    system_prompt = """You are a seller negotiating in a marketplace. Be realistic and conversational.

Your personality: Confident, values the product, reasonable but firm

RULES:
1. Respond conversationally - like texting a buyer naturally
2. Reference comparable market data to justify your price
3. Highlight product condition and extras as value adds
4. If buyer starts with a very lowball offer, don't engage - reject/walk away
5. Be willing to come down gradually if buyer shows genuine interest
6. Your minimum acceptable price is the absolute floor - don't go below it
7. Consider your product fairly valued compared to market data

CONSTRAINTS:
- NEVER accept below min_acceptable - this is your floor
- Try to stay near asking_price
- Use platform data to show product is fairly priced
- Only reference platform data - no external sources"""

    user_prompt = f"""PRODUCT DETAILS:
- {product.get('title')} ({product.get('condition')})
- Your asking price: ${asking_price}
- Minimum acceptable: ${min_acceptable}
- Includes: {', '.join(product.get('extras', []))}

YOUR SITUATION:
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
            party = "Buyer" if msg.get("party") == "buyer" else "You (Seller)"
            user_prompt += f"{party}: {msg.get('message')}\n"
    else:
        user_prompt += "Awaiting first message from buyer.\n"

    if last_buyer_offer:
        user_prompt += f"\nBuyer's current offer: ${last_buyer_offer}\n"

    user_prompt += f"""
YOUR RESPONSE:
Write a natural message as if texting back to the buyer. Be conversational and friendly.

Then decide:
- action="counter" if making a counter offer (must include offer_price)
- action="accept" if their offer is good enough (must include the accepted price)
- action="reject" ONLY if they keep lowballing after 3+ turns or are being disrespectful

NEGOTIATION STRATEGY:
- Early turns (1-2): Always counter with a reasonable price, don't reject yet
- Mid turns (3-4): Counter or accept if price is fair
- Late turns (5+): Can reject if stuck, but generally keep negotiating

Return ONLY this JSON:
{{
    "action": "counter" | "accept" | "reject",
    "offer_price": <number - required for counter/accept, null for reject>,
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
        if offer["action"] not in ["accept", "counter", "reject"]:
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

            # Enforce minimum acceptable constraint
            if offer["offer_price"] < min_acceptable:
                offer["offer_price"] = min_acceptable
                if offer["action"] == "accept":
                    offer["action"] = "counter"
                    offer["message"] += f"\n\nActually, I can't go that low. The minimum I can accept is ${min_acceptable} based on market value."

        return offer

    except Exception as e:
        raise Exception(f"Seller agent error: {str(e)}")
