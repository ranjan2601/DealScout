"""
Seller negotiation agent.

Responsible for:
- Accepting, rejecting, or countering buyer offers
- Respecting a minimum acceptable price
- Using platform data to justify counter-offers
"""

from __future__ import annotations

import logging
from typing import Any

from backend.agents.base_agent import BaseAgent
from backend.agents.prompt_templates import (
    SELLER_SYSTEM_PROMPT,
    SELLER_USER_PROMPT_TEMPLATE,
)

logger = logging.getLogger(__name__)


class SellerAgent(BaseAgent):
    """
    Intelligent seller-side negotiation agent.
    """

    def __init__(self) -> None:
        super().__init__(agent_name="SellerAgent")

    # ----------------------------------------------------------------------
    # PUBLIC: GENERATE RESPONSE
    # ----------------------------------------------------------------------
    def generate_response(self, state: dict[str, Any]) -> dict[str, Any]:
        """
        Generates seller's action given current negotiation state.

        Expected return structure:
        {
            "action": "accept" | "reject" | "counter_offer",
            "offer_price": float | None,
            "message": str,
            "confidence": float
        }
        """
        prompt = self._build_prompt(state)

        # Call LLM
        raw = self.call_llm(
            system_prompt=SELLER_SYSTEM_PROMPT,
            user_prompt=prompt,
        )

        parsed = self._safe_parse_response(raw)
        normalized = self._normalize_response(parsed, state)

        return normalized

    # ----------------------------------------------------------------------
    # PROMPT BUILDER
    # ----------------------------------------------------------------------
    def _build_prompt(self, state: dict[str, Any]) -> str:
        """
        Build the seller prompt from state.
        """

        prefs = state.get("seller_prefs", {})
        platform_data = state.get("platform_data", {})
        history = state.get("history", [])
        turn_number = state.get("turn_number", 1)

        history_formatted = self.format_negotiation_history(history)
        platform_json = self.format_platform_data(platform_data)

        prompt = SELLER_USER_PROMPT_TEMPLATE.format(
            turn_number=turn_number,
            seller_prefs=prefs,
            platform_data=platform_json,
            history=history_formatted,
        )
        return prompt

    # ----------------------------------------------------------------------
    # SAFE JSON PARSER
    # ----------------------------------------------------------------------
    def _safe_parse_response(self, raw_text: str) -> dict[str, Any]:
        """
        Safely parse LLM JSON into a Python dict.
        """

        try:
            parsed = self.parse_json_response(raw_text)
            if isinstance(parsed, dict):
                return parsed
            raise ValueError("SellerAgent: LLM returned non-dict JSON.")
        except Exception as e:
            logger.error(f"[SellerAgent] JSON parsing failed: {e}")
            return {
                "action": "reject",
                "offer_price": None,
                "message": "I am not able to respond right now.",
                "confidence": 0.5,
            }

    # ----------------------------------------------------------------------
    # NORMALIZER
    # ----------------------------------------------------------------------
    def _normalize_response(
        self,
        parsed: dict[str, Any],
        state: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Normalize seller action, enforce minimum price, and ensure valid fields.
        """

        valid_actions = ["accept", "reject", "counter_offer"]

        action = parsed.get("action", "reject")
        if action not in valid_actions:
            action = "reject"

        offer_price = parsed.get("offer_price")
        message = parsed.get("message", "")
        confidence = parsed.get("confidence", 0.5)

        # Normalize numeric offer price
        if action == "counter_offer":
            try:
                offer_price = float(offer_price)
            except Exception:
                offer_price = None

        # Enforce minimum acceptable price if countering
        prefs = state.get("seller_prefs", {})
        min_acceptable = float(prefs.get("min_acceptable", 0.0) or 0.0)

        if action == "counter_offer" and isinstance(offer_price, (int, float)):
            if offer_price < min_acceptable:
                offer_price = min_acceptable

        # For accept/reject, price is optional
        if action in ("accept", "reject"):
            if not isinstance(offer_price, (int, float)):
                offer_price = None

        # Ensure message is not empty
        if not isinstance(message, str) or not message.strip():
            if action == "accept" and isinstance(offer_price, (int, float)):
                message = f"I accept your offer of ${offer_price:.2f}."
            elif action == "counter_offer" and isinstance(offer_price, (int, float)):
                message = f"I can offer ${offer_price:.2f}."
            else:
                message = f"I cannot go below ${min_acceptable:.2f}."

        # Clamp confidence
        try:
            confidence_val = float(confidence)
        except Exception:
            confidence_val = 0.5
        confidence_val = max(0.0, min(1.0, confidence_val))

        return {
            "action": action,
            "offer_price": offer_price,
            "message": message,
            "confidence": confidence_val,
        }
