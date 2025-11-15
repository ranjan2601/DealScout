"""
AI Negotiation Orchestrator for price negotiation between buyer and seller agents.
Runs turn-by-turn conversational negotiation with full context passing to each agent.
"""

import os
from typing import Dict, Any, List
from dotenv import load_dotenv
from buyer_agent import make_offer
from seller_agent import respond_to_offer

# Load environment variables
load_dotenv()


# Platform data with marketplace comparables
PLATFORM_DATA = {
    "product": {
        "listing_id": "bike_12345",
        "title": "Trek Mountain Bike",
        "asking_price": 750,
        "condition": "like-new",
        "extras": ["helmet", "lock"]
    },
    "platform_comps": [
        {"listing_id": "bike_001", "price": 650, "condition": "good", "status": "sold"},
        {"listing_id": "bike_002", "price": 680, "condition": "like-new", "status": "sold"},
        {"listing_id": "bike_003", "price": 670, "condition": "good", "status": "active"}
    ],
    "platform_stats": {
        "avg_price_sold": 667,
        "median_price_sold": 670,
        "avg_time_to_sell_days": 4.2
    }
}

# Buyer constraints
BUYER_PREFS = {
    "max_budget": 650,
    "target_price": 650
}

# Seller constraints
SELLER_PREFS = {
    "min_acceptable": 750,
    "asking_price": 750,
    "can_bundle_extras": ["helmet", "lock"]
}

MAX_TURNS = 10


def run_negotiation() -> Dict[str, Any]:
    """
    Run the negotiation between buyer and seller agents.

    Returns:
        Dictionary with negotiation results and summary
    """

    print("\n🤝 AI NEGOTIATION SYSTEM")
    print("=" * 70)
    print(f"Product: {PLATFORM_DATA['product']['title']}")
    print(f"Asking Price: ${PLATFORM_DATA['product']['asking_price']}")
    print(f"Platform Comps: {len(PLATFORM_DATA['platform_comps'])} similar items (avg ${PLATFORM_DATA['platform_stats']['avg_price_sold']})")
    print("=" * 70)
    print()

    history: List[Dict[str, Any]] = []
    final_price = None
    turn = 0

    for turn_num in range(1, MAX_TURNS + 1):
        turn = turn_num

        # Buyer's turn (odd turns)
        if turn_num % 2 == 1:
            print(f"💬 TURN {turn_num} - BUYER'S TURN")
            print("-" * 70)

            try:
                buyer_state = {
                    "buyer_prefs": BUYER_PREFS,
                    "platform_data": PLATFORM_DATA,
                    "history": history,
                    "turn_number": turn_num
                }

                buyer_response = make_offer(buyer_state)

                # Validate response
                if not isinstance(buyer_response, dict):
                    raise ValueError(f"Invalid response type: {type(buyer_response)}")

                # Display buyer message
                print(f"  💭 Buyer: {buyer_response['message']}")
                if buyer_response.get("offer_price"):
                    print(f"  💰 Offer: ${buyer_response['offer_price']:.2f}")
                print(f"  👁️  Confidence: {buyer_response['confidence']*100:.0f}%")
                print()

                # Add to history
                history.append({
                    "turn": turn_num,
                    "party": "buyer",
                    "action": buyer_response["action"],
                    "offer_price": buyer_response.get("offer_price"),
                    "message": buyer_response["message"],
                    "confidence": buyer_response["confidence"]
                })

                # Check for deal
                if buyer_response["action"] == "accept":
                    final_price = buyer_response.get("offer_price")
                    print(f"✅ BUYER ACCEPTS - Deal at ${final_price:.2f}!")
                    print()
                    break

                # Check if buyer walks away
                if buyer_response["action"] == "walk_away":
                    print("❌ BUYER WALKED AWAY - Negotiation ended")
                    print()
                    return {
                        "status": "buyer_walked_away",
                        "history": history,
                        "turns": turn_num
                    }

            except Exception as e:
                print(f"  ❌ Buyer Agent Error: {str(e)}")
                print()
                return {
                    "status": "error",
                    "error": f"Buyer agent failed: {str(e)}",
                    "history": history
                }

        # Seller's turn (even turns)
        else:
            print(f"💬 TURN {turn_num} - SELLER'S TURN")
            print("-" * 70)

            try:
                seller_state = {
                    "seller_prefs": SELLER_PREFS,
                    "platform_data": PLATFORM_DATA,
                    "history": history,
                    "turn_number": turn_num
                }

                seller_response = respond_to_offer(seller_state)

                # Validate response
                if not isinstance(seller_response, dict):
                    raise ValueError(f"Invalid response type: {type(seller_response)}")

                # Display seller message
                print(f"  💭 Seller: {seller_response['message']}")
                if seller_response.get("offer_price"):
                    print(f"  💰 Offer: ${seller_response['offer_price']:.2f}")
                print(f"  👁️  Confidence: {seller_response['confidence']*100:.0f}%")
                print()

                # Add to history
                history.append({
                    "turn": turn_num,
                    "party": "seller",
                    "action": seller_response["action"],
                    "offer_price": seller_response.get("offer_price"),
                    "message": seller_response["message"],
                    "confidence": seller_response["confidence"]
                })

                # Check for deal
                if seller_response["action"] == "accept":
                    final_price = seller_response.get("offer_price")
                    print(f"✅ SELLER ACCEPTS - Deal at ${final_price:.2f}!")
                    print()
                    break

                # Check if seller rejects
                if seller_response["action"] == "reject":
                    print("❌ SELLER REJECTED - Negotiation ended")
                    print()
                    return {
                        "status": "seller_rejected",
                        "history": history,
                        "turns": turn_num
                    }

            except Exception as e:
                print(f"  ❌ Seller Agent Error: {str(e)}")
                print()
                return {
                    "status": "error",
                    "error": f"Seller agent failed: {str(e)}",
                    "history": history
                }

    # Generate summary
    print()
    print("=" * 70)

    if final_price is not None:
        asking_price = PLATFORM_DATA["product"]["asking_price"]
        min_acceptable = SELLER_PREFS["min_acceptable"]
        buyer_savings = asking_price - final_price
        seller_gain = final_price - min_acceptable

        print("✅ DEAL REACHED!")
        print(f"Final Price: ${final_price:.2f}")
        print(f"Buyer saved: ${buyer_savings:.2f} ({buyer_savings/asking_price*100:.1f}% off asking)")
        print(f"Seller above minimum: ${seller_gain:.2f} (min was ${min_acceptable})")
        print(f"Negotiation completed in {turn} turns")
        print()
        print("💬 Buyer: Thanks! It was great dealing with you. Looking forward to the pickup!")
        print("💬 Seller: Same here! Thanks for the smooth negotiation. See you soon!")

        result = {
            "status": "success",
            "final_price": final_price,
            "turns": turn,
            "buyer_savings": buyer_savings,
            "seller_gain": seller_gain,
            "history": history
        }

    else:
        print("❌ NEGOTIATION FAILED")
        print(f"No agreement reached after {turn} turns")
        if history:
            last_buyer = None
            last_seller = None
            for msg in reversed(history):
                if msg.get("party") == "buyer" and not last_buyer:
                    last_buyer = msg.get("offer_price")
                if msg.get("party") == "seller" and not last_seller:
                    last_seller = msg.get("offer_price")
            print(f"Last buyer offer: ${last_buyer:.2f}" if last_buyer else "Last buyer offer: N/A")
            print(f"Last seller offer: ${last_seller:.2f}" if last_seller else "Last seller offer: N/A")
        print()
        print("💬 Buyer: Sorry, we couldn't land on a deal. Good luck with the sale!")
        print("💬 Seller: No worries, thanks for your interest. Hope to connect again!")

        result = {
            "status": "no_agreement",
            "turns": turn,
            "history": history
        }

    print("=" * 70)

    return result


if __name__ == "__main__":
    try:
        result = run_negotiation()
        print("\n📊 Negotiation Complete\n")
    except KeyboardInterrupt:
        print("\n\n⚠️  Negotiation interrupted by user")
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
