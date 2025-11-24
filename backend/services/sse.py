"""
Server-Sent Events (SSE) utilities for streaming responses.
"""

import json
from typing import Dict, Any


def format_sse_message(message: Dict[str, Any]) -> str:
    """
    Format a message as Server-Sent Event data.

    Args:
        message: Dictionary to send as SSE data

    Returns:
        Properly formatted SSE data string
    """
    return f"data: {json.dumps(message)}\n\n"


def format_sse_event(event_type: str, data: Dict[str, Any]) -> str:
    """
    Format a message with event type for SSE.

    Args:
        event_type: Event type (e.g., "negotiation_update", "complete")
        data: Event data dictionary

    Returns:
        Properly formatted SSE data with event type
    """
    message = {"type": event_type, **data}
    return format_sse_message(message)
