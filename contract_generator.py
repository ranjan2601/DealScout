"""
Contract Generator for DealScout AI Marketplace
Generates formal contracts after successful AI agent negotiations
"""

from datetime import datetime, timedelta
from typing import Dict, Any
import uuid


def generate_contract(negotiation_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a formal contract from successful negotiation data

    Args:
        negotiation_data: Dictionary containing:
            - negotiation_id: Unique negotiation identifier
            - buyer_id: Buyer's user ID
            - seller_id: Seller's user ID
            - listing_id: Product listing ID
            - result: Negotiation result with final_price, history, etc.
            - product: Product details (title, condition, etc.)

    Returns:
        Contract dictionary with all terms and conditions
    """

    # Extract negotiation details
    negotiation_id = negotiation_data.get("negotiation_id", f"neg_{uuid.uuid4().hex[:12]}")
    buyer_id = negotiation_data.get("buyer_id", "unknown_buyer")
    seller_id = negotiation_data.get("seller_id", "unknown_seller")
    listing_id = negotiation_data.get("listing_id", "unknown_listing")
    result = negotiation_data.get("result", {})
    product = negotiation_data.get("product", {})

    # Validate successful negotiation
    if result.get("status") != "success":
        raise ValueError("Cannot generate contract for unsuccessful negotiation")

    # Extract key terms
    final_price = result.get("final_price", 0)
    buyer_savings = result.get("buyer_savings", 0)
    seller_gain = result.get("seller_gain", 0)
    negotiation_turns = result.get("turns", 0)
    history = result.get("history", [])

    # Product details
    product_title = product.get("title", "Item")
    product_condition = product.get("condition", "as-is")
    asking_price = product.get("asking_price", final_price)
    extras = product.get("extras", [])

    # Generate contract metadata
    contract_id = f"contract_{uuid.uuid4().hex[:16]}"
    created_at = datetime.now().isoformat()
    expiry_date = (datetime.now() + timedelta(days=7)).isoformat()  # Contract valid for 7 days

    # Payment terms
    payment_terms = {
        "total_amount": final_price,
        "currency": "USD",
        "payment_method": "visa",  # For Visa track integration
        "due_date": (datetime.now() + timedelta(days=3)).isoformat(),
        "platform_fee": round(final_price * 0.05, 2),  # 5% platform fee
        "buyer_total": round(final_price + (final_price * 0.05), 2),
        "seller_receives": round(final_price - (final_price * 0.05), 2)
    }

    # Delivery/pickup terms
    delivery_terms = {
        "method": "local_pickup",  # Default to local pickup
        "location": product.get("location", "To be determined"),
        "timeframe_days": 7,
        "buyer_inspection_period_hours": 24
    }

    # Return/refund policy
    return_policy = {
        "eligible": True,
        "period_hours": 48,
        "condition": "Item must be in same condition as described",
        "refund_percentage": 100 if product_condition in ["new", "like-new"] else 90
    }

    # Generate negotiation summary
    negotiation_summary = _generate_negotiation_summary(history, asking_price, final_price, negotiation_turns)

    # Build contract terms
    contract_terms = [
        {
            "section": "Parties",
            "content": f"This agreement is between Buyer (ID: {buyer_id}) and Seller (ID: {seller_id})"
        },
        {
            "section": "Product Details",
            "content": f"Product: {product_title}\nCondition: {product_condition.title()}\nExtras Included: {', '.join(extras) if extras else 'None'}"
        },
        {
            "section": "Price Agreement",
            "content": f"Final Negotiated Price: ${final_price:.2f}\nOriginal Asking Price: ${asking_price:.2f}\nBuyer Savings: ${buyer_savings:.2f}\nReached via AI negotiation in {negotiation_turns} turns"
        },
        {
            "section": "Payment Terms",
            "content": f"Total Amount: ${payment_terms['total_amount']:.2f}\nPlatform Fee (5%): ${payment_terms['platform_fee']:.2f}\nBuyer Pays: ${payment_terms['buyer_total']:.2f}\nSeller Receives: ${payment_terms['seller_receives']:.2f}\nPayment Method: Visa (via DealScout)\nDue Date: {datetime.fromisoformat(payment_terms['due_date']).strftime('%B %d, %Y')}"
        },
        {
            "section": "Delivery Terms",
            "content": f"Method: {delivery_terms['method'].replace('_', ' ').title()}\nLocation: {delivery_terms['location']}\nTimeframe: Within {delivery_terms['timeframe_days']} days\nBuyer Inspection Period: {delivery_terms['buyer_inspection_period_hours']} hours upon receipt"
        },
        {
            "section": "Return Policy",
            "content": f"Returns Accepted: {'Yes' if return_policy['eligible'] else 'No'}\nReturn Period: {return_policy['period_hours']} hours\nCondition: {return_policy['condition']}\nRefund Amount: {return_policy['refund_percentage']}% of purchase price"
        },
        {
            "section": "AI Negotiation Disclosure",
            "content": f"This price was negotiated autonomously by AI agents representing both parties.\nNegotiation ID: {negotiation_id}\nBoth parties' AI agents agreed to this price after {negotiation_turns} rounds of negotiation.\nFull negotiation transcript is available upon request."
        },
        {
            "section": "Platform Guarantee",
            "content": "DealScout guarantees:\n- Secure payment processing via Visa\n- Buyer protection for items not as described\n- Seller protection against fraudulent claims\n- Dispute resolution within 48 hours"
        },
        {
            "section": "Signatures",
            "content": f"By accepting this contract, both parties agree to all terms and conditions.\nContract generated: {datetime.fromisoformat(created_at).strftime('%B %d, %Y at %I:%M %p')}\nContract expires: {datetime.fromisoformat(expiry_date).strftime('%B %d, %Y at %I:%M %p')}"
        }
    ]

    # Build complete contract
    contract = {
        "contract_id": contract_id,
        "negotiation_id": negotiation_id,
        "listing_id": listing_id,
        "created_at": created_at,
        "expires_at": expiry_date,
        "status": "pending_payment",  # pending_payment, active, completed, cancelled

        # Parties
        "buyer": {
            "id": buyer_id,
            "signed": False,
            "signed_at": None
        },
        "seller": {
            "id": seller_id,
            "signed": False,
            "signed_at": None
        },

        # Product and pricing
        "product": {
            "title": product_title,
            "condition": product_condition,
            "extras": extras,
            "original_price": asking_price,
            "final_price": final_price,
            "savings": buyer_savings
        },

        # Terms
        "payment_terms": payment_terms,
        "delivery_terms": delivery_terms,
        "return_policy": return_policy,

        # Full contract text
        "contract_terms": contract_terms,

        # Negotiation context
        "negotiation_summary": negotiation_summary,
        "negotiation_transcript": history,

        # Metadata
        "metadata": {
            "generated_by": "DealScout AI Contract Generator v1.0",
            "ai_negotiated": True,
            "platform": "DealScout"
        }
    }

    return contract


def _generate_negotiation_summary(history: list, asking_price: float, final_price: float, turns: int) -> str:
    """Generate a human-readable summary of the negotiation"""

    if not history:
        return "No negotiation history available."

    # Extract first and last offers
    buyer_first_offer = None
    seller_first_offer = None

    for entry in history:
        if entry.get("party") == "buyer" and buyer_first_offer is None:
            buyer_first_offer = entry.get("offer_price")
        if entry.get("party") == "seller" and seller_first_offer is None:
            seller_first_offer = entry.get("offer_price")

    savings_percentage = ((asking_price - final_price) / asking_price * 100) if asking_price > 0 else 0

    summary = f"""
Negotiation completed successfully in {turns} turns.

Starting Position:
- Seller's asking price: ${asking_price:.2f}
- Buyer's initial offer: ${buyer_first_offer:.2f if buyer_first_offer else 0}

Final Agreement:
- Agreed price: ${final_price:.2f}
- Buyer saved: ${asking_price - final_price:.2f} ({savings_percentage:.1f}% discount)

The AI agents conducted a professional, fair negotiation considering market data,
comparable listings, and both parties' interests. Both agents agreed this price
represents fair market value.
"""

    return summary.strip()


def format_contract_for_display(contract: Dict[str, Any]) -> str:
    """
    Format contract as readable text for display or PDF generation

    Args:
        contract: Contract dictionary

    Returns:
        Formatted contract text
    """

    output = []
    output.append("=" * 80)
    output.append("DEALSCOUT MARKETPLACE CONTRACT")
    output.append("=" * 80)
    output.append("")
    output.append(f"Contract ID: {contract['contract_id']}")
    output.append(f"Negotiation ID: {contract['negotiation_id']}")
    output.append(f"Generated: {datetime.fromisoformat(contract['created_at']).strftime('%B %d, %Y at %I:%M %p')}")
    output.append(f"Expires: {datetime.fromisoformat(contract['expires_at']).strftime('%B %d, %Y at %I:%M %p')}")
    output.append("")
    output.append("=" * 80)
    output.append("")

    # Add each contract term section
    for term in contract['contract_terms']:
        output.append(f"{term['section'].upper()}")
        output.append("-" * 80)
        output.append(term['content'])
        output.append("")

    output.append("=" * 80)
    output.append("NEGOTIATION SUMMARY")
    output.append("=" * 80)
    output.append(contract['negotiation_summary'])
    output.append("")
    output.append("=" * 80)
    output.append("")
    output.append("END OF CONTRACT")
    output.append("=" * 80)

    return "\n".join(output)


def validate_contract_signatures(contract: Dict[str, Any]) -> Dict[str, Any]:
    """
    Check if contract is fully signed and ready for execution

    Args:
        contract: Contract dictionary

    Returns:
        Validation result with status and details
    """

    buyer_signed = contract['buyer']['signed']
    seller_signed = contract['seller']['signed']
    both_signed = buyer_signed and seller_signed

    return {
        "valid": both_signed,
        "buyer_signed": buyer_signed,
        "seller_signed": seller_signed,
        "ready_for_payment": both_signed,
        "message": "Contract fully executed" if both_signed else "Awaiting signatures"
    }


# For Visa integration (hackathon)
def generate_visa_payment_request(contract: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate Visa payment request from contract
    This would integrate with Visa APIs for the hackathon track

    Args:
        contract: Signed contract

    Returns:
        Visa payment request object
    """

    payment_terms = contract['payment_terms']

    return {
        "merchant_id": "dealscout_marketplace",
        "transaction_id": f"txn_{contract['contract_id']}",
        "amount": payment_terms['buyer_total'],
        "currency": payment_terms['currency'],
        "description": f"Purchase of {contract['product']['title']}",
        "buyer_id": contract['buyer']['id'],
        "seller_id": contract['seller']['id'],
        "contract_id": contract['contract_id'],
        "metadata": {
            "platform": "DealScout",
            "ai_negotiated": True,
            "negotiation_id": contract['negotiation_id']
        }
    }


if __name__ == "__main__":
    # Test contract generation
    test_data = {
        "negotiation_id": "neg_test123",
        "buyer_id": "buyer_001",
        "seller_id": "seller_123",
        "listing_id": "bike_001",
        "result": {
            "status": "success",
            "final_price": 425.00,
            "buyer_savings": 25.00,
            "seller_gain": 65.00,
            "turns": 4,
            "history": [
                {"turn": 1, "party": "buyer", "action": "offer", "offer_price": 400, "message": "Initial offer", "confidence": 0.7},
                {"turn": 2, "party": "seller", "action": "counter", "offer_price": 440, "message": "Counter offer", "confidence": 0.8},
                {"turn": 3, "party": "buyer", "action": "counter", "offer_price": 425, "message": "Meet in middle", "confidence": 0.85},
                {"turn": 4, "party": "seller", "action": "accept", "offer_price": 425, "message": "Agreed!", "confidence": 0.9}
            ]
        },
        "product": {
            "title": "Trek Mountain Bike XL",
            "condition": "like-new",
            "asking_price": 450,
            "location": "Brooklyn, NY",
            "extras": ["helmet", "lock"]
        }
    }

    contract = generate_contract(test_data)
    print(format_contract_for_display(contract))
    print("\n" + "=" * 80)
    print("Contract generated successfully!")
    print(f"Contract ID: {contract['contract_id']}")
    print(f"Total buyer pays: ${contract['payment_terms']['buyer_total']:.2f}")
    print(f"Seller receives: ${contract['payment_terms']['seller_receives']:.2f}")
