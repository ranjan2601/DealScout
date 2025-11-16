"""
Buyer AI Agent for price negotiation.
Uses Claude Sonnet via OpenRouter API to make conversational offers.
"""

import requests
import json
import os
from typing import Dict, Any


def make_offer(negotiation_state: Dict[str, Any], product_questions: list = None) -> Dict[str, Any]:
    """
    Make an offer based on negotiation state and platform data.

    Args:
        negotiation_state: Contains buyer_prefs, platform_data, history, turn_number
        product_questions: Optional list of product-specific questions to ask seller

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
    product_questions_section = ""
    if product_questions and len(product_questions) > 0:
        product_questions_section = f"""
PRODUCT-SPECIFIC QUESTIONS TO ASK:
Before making final offers, strategically ask these questions to assess product value:
{chr(10).join(f"- {q}" for q in product_questions)}

Use these questions naturally in conversation to gather info that affects pricing decisions.
Early turns: Ask 1-2 questions while making offers
Mid turns: Reference their answers in your reasoning for price adjustments
"""

    system_prompt = f"""You are a REAL BUYER on a marketplace - act like a genuine person texting with a seller.

PERSONALITY: Smart, savvy, willing to negotiate but won't overpay. Ask questions about condition, warranty, accessories.
{product_questions_section}
CRITICAL RULES:
1. ALWAYS state exact dollar amounts (e.g., "$650" not "around $650")
2. Reference SPECIFIC comparable prices from platform data (cite 2-3 comps per offer)
3. Early turns: Start aggressive (15-20% below asking) - lowball but defensible with data
4. Mid turns: Increase slowly by $10-25 per turn - show you're moving
5. Late turns: Get close to max_budget but be firm - don't overpay
6. Ask follow-up questions based on product type (brand, age, condition specifics, warranty)
7. Act interested but cautious - as if you're checking this person out
8. Use phrases like "seems fair", "that works for me", "can you do better?", "my max is..."

NEGOTIATION FLOW:
- Turn 1: Show interest, ask 1-2 key product questions, start 15-20% below asking with data
- Turns 2-4: Counter their moves, reference specific comps, ask clarifying questions
- Turns 5-7: Narrow the gap, get closer to meeting point, use product info to justify final price
- Turns 8+: Either close the deal or walk away if stuck

REALISTIC COMMUNICATION:
- Sound like a person texting, not a robot. Use "hmm", "got it", "appreciate it"
- Ask about condition, maintenance, why they're selling, location for meetup
- Express hesitation about concerning product details (e.g., high mileage, scratches, missing accessories)
- Be conversational and human - reference what they said
- "I get that you want $X, but I've seen similar for $Y..." not just numbers

CONSTRAINTS:
- NEVER go above max_budget - hard limit
- Only reference platform data - no made up prices
- If stuck after 6 turns with no movement, consider walking away"""

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
                "model": "anthropic/claude-sonnet-4.5",
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
            },
            timeout=30  # 30 second timeout to prevent indefinite hanging
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
