"""
Price-related utility functions.
"""

from typing import Dict, Any


def calculate_savings(original_price: float, negotiated_price: float) -> float:
    """Calculate savings amount."""
    return max(0, original_price - negotiated_price)


def calculate_savings_percentage(original_price: float, negotiated_price: float) -> float:
    """Calculate savings as a percentage."""
    if original_price == 0:
        return 0.0
    savings = calculate_savings(original_price, negotiated_price)
    return (savings / original_price) * 100


def is_within_budget(price: float, budget: float, tolerance_percent: float = 5.0) -> bool:
    """
    Check if price is within budget with optional tolerance.

    Args:
        price: Actual price
        budget: Maximum budget
        tolerance_percent: Acceptable overage percentage

    Returns:
        True if price is within budget + tolerance
    """
    tolerance = budget * (tolerance_percent / 100)
    return price <= (budget + tolerance)


def calculate_fair_price(asking_price: float, market_avg: float, condition_multiplier: float = 1.0) -> float:
    """
    Calculate a fair negotiated price based on market data.

    Args:
        asking_price: Seller's asking price
        market_avg: Average market price for similar items
        condition_multiplier: Multiplier based on item condition (0.8-1.0)

    Returns:
        Suggested fair price
    """
    # Fair price is between market average and asking price, adjusted for condition
    fair = (asking_price + market_avg) / 2 * condition_multiplier
    return round(fair, 2)
