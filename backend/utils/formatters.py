"""
Data formatting and display utilities.
"""

from typing import List, Dict, Any


def format_price(price: float) -> str:
    """Format price as currency string."""
    return f"${price:,.2f}"


def format_negotiation_history(history: List[Dict[str, Any]]) -> str:
    """Format negotiation history for display."""
    if not history:
        return "No negotiation history"

    formatted = "Negotiation History:\n"
    for turn in history:
        party = turn.get("party", "unknown").upper()
        action = turn.get("action", "unknown")
        price = turn.get("offer_price")

        if price is not None:
            formatted += f"  {party} - {action} at {format_price(price)}\n"
        else:
            formatted += f"  {party} - {action}\n"

    return formatted


def truncate_text(text: str, max_length: int = 100) -> str:
    """Truncate text to max length with ellipsis."""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."


def format_product_title(title: str, max_length: int = 50) -> str:
    """Format product title for display."""
    return truncate_text(title, max_length)
