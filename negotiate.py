"""
AI Negotiation Orchestrator for price negotiation between buyer and seller agents.
Supports both single buyer-seller and multi-buyer concurrent negotiations.
"""

import os
import argparse
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

# Buyer constraints (for single buyer mode)
BUYER_PREFS = {
    "max_budget": 650,
    "target_price": 650
}

# Seller constraints
SELLER_PREFS = {
    "min_acceptable": 650,
    "asking_price": 750,
    "can_bundle_extras": ["helmet", "lock"]
}

# Multiple buyer configurations
MULTI_BUYER_CONFIGS = [
    {
        "id": "buyer_1",
        "name": "Budget Buyer",
        "max_budget": 680,
        "target_price": 640
    },
    {
        "id": "buyer_2",
        "name": "Patient Buyer",
        "max_budget": 720,
        "target_price": 680
    },
    {
        "id": "buyer_3",
        "name": "Eager Buyer",
        "max_budget": 750,
        "target_price": 700
    }
]

MAX_TURNS = 10
MAX_ROUNDS = 8  # For multi-buyer, rounds instead of turns


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


def run_multi_buyer_negotiation() -> Dict[str, Any]:
    """
    Run concurrent negotiation with one seller and multiple buyers.
    Seller responds to each buyer individually without replying to all at once.

    Returns:
        Dictionary with negotiation results
    """

    print("\n🤝 MULTI-BUYER NEGOTIATION SYSTEM")
    print("=" * 70)
    print(f"Product: {PLATFORM_DATA['product']['title']}")
    print(f"Asking Price: ${PLATFORM_DATA['product']['asking_price']}")
    print(f"Buyers: {len(MULTI_BUYER_CONFIGS)}")
    print("=" * 70)
    print()

    # Initialize buyer states
    buyers: Dict[str, Dict[str, Any]] = {}
    for buyer_config in MULTI_BUYER_CONFIGS:
        buyers[buyer_config["id"]] = {
            "name": buyer_config["name"],
            "prefs": {
                "max_budget": buyer_config["max_budget"],
                "target_price": buyer_config["target_price"]
            },
            "history": [],
            "status": "active",  # active, accepted, rejected, walked_away
            "last_offer": None
        }

    seller_state = {
        "current_offers": {},  # buyer_id -> offer_price
        "best_buyer": None,
        "best_price": 0
    }

    final_buyer = None
    final_price = None
    round_num = 0

    for round_num in range(1, MAX_ROUNDS + 1):
        print(f"\n🔄 ROUND {round_num}")
        print("=" * 70)

        active_buyers = [bid for bid, state in buyers.items() if state["status"] == "active"]

        if not active_buyers:
            print("❌ All buyers have dropped out or accepted!")
            break

        # Phase 1: All active buyers make offers simultaneously
        print(f"\n📤 Buyers making offers ({len(active_buyers)} active)...")
        print("-" * 70)

        buyer_offers = {}

        for buyer_id in active_buyers:
            try:
                buyer_config = next(b for b in MULTI_BUYER_CONFIGS if b["id"] == buyer_id)
                buyer_state_data = {
                    "buyer_prefs": buyers[buyer_id]["prefs"],
                    "platform_data": PLATFORM_DATA,
                    "history": buyers[buyer_id]["history"],
                    "turn_number": round_num * 2 - 1
                }

                buyer_response = make_offer(buyer_state_data)

                if not isinstance(buyer_response, dict):
                    raise ValueError(f"Invalid response type: {type(buyer_response)}")

                print(f"\n  🧑 {buyer_config['name']} ({buyer_id}):")
                print(f"     💭 {buyer_response['message']}")

                if buyer_response.get("offer_price"):
                    print(f"     💰 Offer: ${buyer_response['offer_price']:.2f}")
                    buyer_offers[buyer_id] = buyer_response["offer_price"]
                    buyers[buyer_id]["last_offer"] = buyer_response["offer_price"]

                print(f"     👁️  Confidence: {buyer_response['confidence']*100:.0f}%")

                # Add to buyer history
                buyers[buyer_id]["history"].append({
                    "round": round_num,
                    "action": buyer_response["action"],
                    "offer_price": buyer_response.get("offer_price"),
                    "message": buyer_response["message"],
                    "confidence": buyer_response["confidence"]
                })

                # Check buyer actions
                if buyer_response["action"] == "walk_away":
                    buyers[buyer_id]["status"] = "walked_away"
                    print(f"     ❌ {buyer_config['name']} WALKED AWAY")

                elif buyer_response["action"] == "reject":
                    buyers[buyer_id]["status"] = "rejected"
                    print(f"     ❌ {buyer_config['name']} REJECTED")

            except Exception as e:
                print(f"  ❌ {buyer_id} Error: {str(e)}")
                buyers[buyer_id]["status"] = "error"

        print()

        # Phase 2: Seller responds to each buyer individually
        if buyer_offers:
            print(f"\n📥 Seller responding to offers ({len(buyer_offers)} offers)...")
            print("-" * 70)

            seller_state["current_offers"] = buyer_offers
            seller_responses = {}  # Store all responses before deciding

            # Get seller's responses to all offers
            for buyer_id, offer_price in buyer_offers.items():
                try:
                    buyer_config = next(b for b in MULTI_BUYER_CONFIGS if b["id"] == buyer_id)

                    # Build seller state for this specific buyer
                    seller_state_data = {
                        "seller_prefs": SELLER_PREFS,
                        "platform_data": PLATFORM_DATA,
                        "history": buyers[buyer_id]["history"],
                        "turn_number": round_num * 2,
                        "current_buyer_offer": offer_price,
                        "other_buyers_count": len([b for b in active_buyers if b != buyer_id])
                    }

                    seller_response = respond_to_offer(seller_state_data)

                    if not isinstance(seller_response, dict):
                        raise ValueError(f"Invalid response type: {type(seller_response)}")

                    seller_responses[buyer_id] = seller_response

                    print(f"\n  🧑‍💼 Seller to {buyer_config['name']} ({buyer_id}):")
                    print(f"      💭 {seller_response['message']}")

                    if seller_response.get("offer_price"):
                        print(f"      💰 Counter Offer: ${seller_response['offer_price']:.2f}")

                    print(f"      👁️  Confidence: {seller_response['confidence']*100:.0f}%")

                    # Track best offer for seller
                    if seller_response.get("offer_price", 0) > seller_state["best_price"]:
                        seller_state["best_price"] = seller_response.get("offer_price", 0)
                        seller_state["best_buyer"] = buyer_id

                except Exception as e:
                    print(f"  ❌ Seller Error with {buyer_id}: {str(e)}")

            # Now process all responses - seller chooses best acceptable offer
            best_acceptor = None
            best_accept_price = 0

            for buyer_id, seller_response in seller_responses.items():
                # Add to buyer history (seller's response)
                buyers[buyer_id]["history"].append({
                    "round": round_num,
                    "action": seller_response["action"],
                    "offer_price": seller_response.get("offer_price"),
                    "message": seller_response["message"],
                    "confidence": seller_response["confidence"]
                })

                # Check if seller would accept this buyer's offer
                if seller_response["action"] == "accept":
                    accept_price = seller_response.get("offer_price", 0)
                    # Pick the highest accepted offer
                    if accept_price > best_accept_price:
                        best_accept_price = accept_price
                        best_acceptor = buyer_id

            # If seller accepted any offer, take the best one
            if best_acceptor:
                buyer_config = next(b for b in MULTI_BUYER_CONFIGS if b["id"] == best_acceptor)
                buyers[best_acceptor]["status"] = "accepted"
                final_buyer = best_acceptor
                final_price = best_accept_price
                print(f"\n      ✅ ACCEPTED! Deal with {buyer_config['name']} at ${final_price:.2f}!")
                break

        print()

    # Generate summary
    print()
    print("=" * 70)
    print("📊 NEGOTIATION SUMMARY")
    print("=" * 70)

    if final_buyer and final_price:
        winning_buyer = next(b for b in MULTI_BUYER_CONFIGS if b["id"] == final_buyer)
        asking_price = PLATFORM_DATA["product"]["asking_price"]
        min_acceptable = SELLER_PREFS["min_acceptable"]
        seller_gain = final_price - min_acceptable

        print()
        print("🎉 " * 20)
        print(f"✅ DEAL REACHED!")
        print("🎉 " * 20)
        print(f"\n🏆 WINNING BUYER: {winning_buyer['name']} ({final_buyer})")
        print(f"💰 Final Price: ${final_price:.2f}")
        print(f"📈 Seller gained: ${seller_gain:.2f} above minimum (min was ${min_acceptable})")
        print(f"📍 Negotiation completed in {round_num} rounds")
        print()

        # Show all buyer final statuses
        print("Final Status of All Buyers:")
        for buyer_id, buyer_data in buyers.items():
            buyer_config = next(b for b in MULTI_BUYER_CONFIGS if b["id"] == buyer_id)
            last_offer = buyer_data["last_offer"]
            status_emoji = "✅" if buyer_data["status"] == "accepted" else "❌"
            offer_str = f"${last_offer:.2f}" if last_offer else "N/A"
            print(f"  {status_emoji} {buyer_config['name']}: {buyer_data['status'].upper()} - Last offer: {offer_str}")

        result = {
            "status": "success",
            "winner": final_buyer,
            "winner_name": winning_buyer['name'],
            "final_price": final_price,
            "rounds": round_num,
            "seller_gain": seller_gain,
            "all_buyers": buyers
        }

    else:
        print()
        print(f"❌ NEGOTIATION FAILED")
        print(f"No agreement reached after {round_num} rounds")
        print()

        print("Final Status of All Buyers:")
        for buyer_id, buyer_data in buyers.items():
            buyer_config = next(b for b in MULTI_BUYER_CONFIGS if b["id"] == buyer_id)
            last_offer = buyer_data["last_offer"]
            offer_str = f"${last_offer:.2f}" if last_offer else "N/A"
            print(f"  ❌ {buyer_config['name']}: {buyer_data['status'].upper()} - Last offer: {offer_str}")

        result = {
            "status": "no_agreement",
            "rounds": round_num,
            "all_buyers": buyers
        }

    print()
    print("=" * 70)

    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AI Negotiation Engine")
    parser.add_argument(
        "--mode",
        choices=["single", "multi"],
        default="multi",
        help="Negotiation mode: single buyer or multiple buyers (default: multi)"
    )
    args = parser.parse_args()

    try:
        if args.mode == "multi":
            result = run_multi_buyer_negotiation()
        else:
            result = run_negotiation()

        print("\n📊 Negotiation Complete\n")
    except KeyboardInterrupt:
        print("\n\n⚠️  Negotiation interrupted by user")
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
