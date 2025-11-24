"""
Buyer negotiation agent.
Cleansed for:
- Pydantic v2 compatibility
- Fully safe JSON response parsing
- Stable prompts (no f-string backslash issues)
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from backend.agents.base_agent import BaseAgent
from backend.agents.prompt_templates import (
    BUYER_SYSTEM_PROMPT,
    BUYER_USER_PROMPT_TEMPLATE,
)
from backend.config.settings import settings

logger = logging.getLogger(__name__)


class BuyerAgent(BaseAgent):
    """
    Buyer agent responsible for generating counter-offers,
    acceptance, rejection, or walk-away decisions.
    """

    def __init__(self) -> None:
        super().__init__(agent_name="BuyerAgent")

    # ----------------------------------------------------------------------
    # GENERATE RESPONSE
    # ----------------------------------------------------------------------
    def generate_response(
        self,
        state: dict[str, Any],
        product_questions: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        """
        Generates a structured negotiation response using LLM.

        Returns:
            {
                "action": str,
                "offer_price": float | None,
                "message": str,
                "confidence": float,
            }
        """

        # Build user prompt
        prompt = self._build_prompt(state, product_questions)

        # Call the LLM
        raw_response = self.call_llm(
            system_prompt=BUYER_SYSTEM_PROMPT,
            user_prompt=prompt,
        )

        # Parse JSON from LLM output
        parsed = self._safe_parse_response(raw_response)

        # Final normalization of action + price
        normalized = self._normalize_response(parsed, state)

        return normalized

    # ----------------------------------------------------------------------
    # PROMPT BUILDER
    # ----------------------------------------------------------------------
    def _build_prompt(
        self,
        state: dict[str, Any],
        product_questions: Optional[list[str]] = None,
    ) -> str:
        """
        Constructs the buyer agent prompt. No f-strings with backslashes.
        """

        prefs = state.get("buyer_prefs", {})
        platform_data = state.get("platform_data", {})
        history = state.get("history", [])
        turn_number = state.get("turn_number", 1)

        history_formatted = self.format_negotiation_history(history)
        platform_json = self.format_platform_data(platform_data)

        questions_text = (
            "\nProduct Evaluation Questions:\n- " + "\n- ".join(product_questions)
            if product_questions else ""
        )

        prompt = BUYER_USER_PROMPT_TEMPLATE.format(
            turn_number=turn_number,
            buyer_prefs=prefs,
            platform_data=platform_json,
            history=history_formatted,
            questions=questions_text,
        )

        return prompt

    # ----------------------------------------------------------------------
    # SAFE RESPONSE PARSER
    # ----------------------------------------------------------------------
    def _safe_parse_response(self, raw_text: str) -> dict[str, Any]:
        """
        Attempts to parse LLM output into JSON safely.
        """

        try:
            parsed = self.parse_json_response(raw_text)
            if isinstance(parsed, dict):
                return parsed
            raise ValueError("Invalid JSON structure returned")
        except Exception as e:
            logger.error(f"[BuyerAgent] JSON parsing failed: {e}")
            # fallback default response
            return {
                "action": "offer",
                "offer_price": None,
                "message": "Unable to parse your last response. Making a safety fallback offer.",
                "confidence": 0.5,
            }

    # ----------------------------------------------------------------------
    # RESPONSE NORMALIZER
    # ----------------------------------------------------------------------
    def _normalize_response(
        self,
        parsed: dict[str, Any],
        state: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Normalize action + offer price + message to guarantee valid actions.
        """

        valid_actions = ["offer", "counter_offer", "accept", "reject", "walk_away"]

        action = parsed.get("action", "offer")
        if action not in valid_actions:
            action = "offer"

        offer_price = parsed.get("offer_price")
        message = parsed.get("message", "Proceeding with negotiation.")
        confidence = parsed.get("confidence", 0.5)

        # Normalize numeric offer
        if action in ("offer", "counter_offer"):
            try:
                offer_price = float(offer_price)
            except Exception:
                # fallback: midpoint between last buyer/seller offer
                history = state.get("history", [])
                offer_price = self._fallback_price(history)

        # Ensure walk-away cannot have price
        if action in ("walk_away", "reject", "accept"):
            offer_price = None

        return {
            "action": action,
            "offer_price": offer_price,
            "message": message,
            "confidence": confidence,
        }

    # ----------------------------------------------------------------------
    # FALLBACK PRICE LOGIC
    # ----------------------------------------------------------------------
    def _fallback_price(self, history: list[dict[str, Any]]) -> float:
        """
        Computes a fallback offer price when LLM returns invalid numbers.
        """

        last_buyer = None
        last_seller = None

        for turn in reversed(history):
            if last_buyer is None and turn["party"] == "buyer":
                last_buyer = turn.get("offer_price")
            if last_seller is None and turn["party"] == "seller":
                last_seller = turn.get("offer_price")
            if last_buyer is not None and last_seller is not None:
                break

        # Fallback logic
        if last_buyer and last_seller:
            return (last_buyer + last_seller) / 2

        if last_buyer:
            return last_buyer

        if last_seller:
            return last_seller

        return 0.0  # worst-case fallback
