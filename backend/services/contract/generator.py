"""
Contract text generation logic.
Creates detailed contract terms based on negotiation results.
"""

from typing import Dict, Any
from datetime import datetime, timedelta


def generate_contract_text(contract_data: Dict[str, Any]) -> str:
    """
    Generate plain text contract from negotiation result.

    Args:
        contract_data: Contract information including buyer, seller, product, price

    Returns:
        Formatted contract text
    """
    buyer_id = contract_data.get("buyer_id", "BUYER")
    seller_id = contract_data.get("seller_id", "SELLER")
    product = contract_data.get("product", {})
    final_price = contract_data.get("result", {}).get("negotiated_price", 0)

    today = datetime.now()
    delivery_date = today + timedelta(days=7)
    payment_due = today + timedelta(days=3)

    contract = f"""
PRODUCT PURCHASE AGREEMENT

Date: {today.strftime('%B %d, %Y')}
Agreement ID: {contract_data.get('negotiation_id', 'N/A')}

PARTIES:
Buyer: {buyer_id}
Seller: {seller_id}

PRODUCT DETAILS:
Title: {product.get('product_detail', 'N/A')}
Condition: {product.get('condition', 'N/A')}
Description: {product.get('description', 'N/A')}

PRICE TERMS:
Original Asking Price: ${product.get('asking_price', 0):.2f}
Negotiated Final Price: ${final_price:.2f}
Savings: ${product.get('asking_price', 0) - final_price:.2f}

PAYMENT TERMS:
- Payment Due: {payment_due.strftime('%B %d, %Y')}
- Payment Method: To be agreed upon by parties
- Late Fee: 1.5% per month on overdue amounts

DELIVERY TERMS:
- Delivery Date: {delivery_date.strftime('%B %d, %Y')}
- Delivery Location: To be agreed upon by parties
- Shipping Cost: {product.get('shipping_cost', 'Buyer Responsibility')}

WARRANTY & INSPECTION:
- Inspection Period: 3 business days from delivery
- Returns Accepted: Within inspection period if condition differs
- Warranty: As-is, unless otherwise specified

LEGAL TERMS:
This agreement is binding upon both parties. Any disputes shall be resolved through mediation.
Both parties acknowledge that they have reviewed all product details and accept the terms herein.

SIGNATURES:

Buyer: ________________________      Date: ____________

Seller: ________________________      Date: ____________


THIS IS A LEGALLY BINDING DOCUMENT. BOTH PARTIES MUST SIGN BEFORE PROCEEDING WITH TRANSACTION.
"""

    return contract.strip()


def generate_contract_data(contract_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate structured contract data for storage.

    Args:
        contract_data: Contract information

    Returns:
        Structured contract dictionary
    """
    today = datetime.now()
    delivery_date = today + timedelta(days=7)
    payment_due = today + timedelta(days=3)

    product = contract_data.get("product", {})
    result = contract_data.get("result", {})

    return {
        "contract_id": contract_data.get("negotiation_id"),
        "negotiation_id": contract_data.get("negotiation_id"),
        "buyer_id": contract_data.get("buyer_id"),
        "seller_id": contract_data.get("seller_id"),
        "terms": {
            "buyer_name": contract_data.get("buyer_id", "BUYER"),
            "seller_name": contract_data.get("seller_id", "SELLER"),
            "product_description": product.get("product_detail", "N/A"),
            "product_price": result.get("negotiated_price", 0),
            "original_price": product.get("asking_price", 0),
            "payment_due_date": payment_due.isoformat(),
            "delivery_date": delivery_date.isoformat(),
            "warranty": "As-is",
            "inspection_period_days": 3
        },
        "created_at": today.isoformat(),
        "status": "pending_signature"
    }
