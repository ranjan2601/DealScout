"""
Data validation utilities.
"""

from typing import Any, Optional


def validate_price(price: Any) -> bool:
    """Validate that price is a positive number."""
    try:
        p = float(price)
        return p > 0
    except (ValueError, TypeError):
        return False


def validate_listing_id(listing_id: str) -> bool:
    """Validate listing ID format."""
    return isinstance(listing_id, str) and len(listing_id) > 0


def validate_email(email: str) -> bool:
    """Basic email validation."""
    return isinstance(email, str) and "@" in email and "." in email


def sanitize_message(message: str, max_length: int = 1000) -> str:
    """Sanitize and truncate user message."""
    if not isinstance(message, str):
        return ""
    return message.strip()[:max_length]


def validate_negotiation_action(action: str) -> bool:
    """Validate negotiation action."""
    valid_actions = {"offer", "counter_offer", "accept", "reject", "walk_away"}
    return action.lower() in valid_actions
