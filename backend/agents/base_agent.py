"""
Base negotiation agent class.
Handles LLM communication, JSON parsing, and utility formatting.

Cleaned for:
- Pydantic v2 safety
- OpenAPI compatibility
- Stable JSON parsing
- Production-ready error handling
"""

from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from typing import Any, Optional

import requests

from backend.config.settings import settings

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Base class for BuyerAgent and SellerAgent.

    Provides:
    - LLM calls via OpenRouter
    - JSON-safe response parsing
    - Formatting helpers for prompts
    """

    def __init__(self, agent_name: str) -> None:
        self.agent_name = agent_name
        self.api_key = settings.openrouter_api_key
        self.model = settings.openrouter_model
        self.temperature = settings.llm_temperature

    # ----------------------------------------------------------------------
    # ABSTRACT METHOD
    # ----------------------------------------------------------------------
    @abstractmethod
    def generate_response(self, state: dict[str, Any]) -> dict[str, Any]:
        """
        Must be implemented by BuyerAgent / SellerAgent.
        """
        raise NotImplementedError

    # ----------------------------------------------------------------------
    # LLM CALL
    # ----------------------------------------------------------------------
    def call_llm(self, system_prompt: str, user_prompt: str) -> str:
        """
        Calls the LLM via OpenRouter's Chat Completions API.

        Returns:
            str → raw text response from the model.

        Raises:
            Exception if API returns an error or malformed response.
        """
        if not self.api_key:
            raise ValueError("Missing OPENROUTER_API_KEY environment variable.")

        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "HTTP-Referer": "https://github.com",
                    "X-Title": "DealScout-Negotiation",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": self.temperature,
                },
                timeout=settings.llm_timeout_seconds,
            )

            response_data = response.json()

            if "error" in response_data:
                raise Exception(f"LLM API Error: {response_data['error']}")

            return response_data["choices"][0]["message"]["content"].strip()

        except Exception as e:
            logger.error(f"[{self.agent_name}] LLM call failed: {str(e)}")
            raise

    # ----------------------------------------------------------------------
    # JSON RESPONSE PARSER
    # ----------------------------------------------------------------------
    def parse_json_response(self, response_text: str) -> dict[str, Any]:
        """
        Parses JSON from model output.

        Supports:
        - Raw JSON
        - Markdown-style JSON blocks (```json ... ```)
        - Fallback text cleanup
        """
        try:
            # First attempt: direct JSON
            return json.loads(response_text)

        except json.JSONDecodeError:
            pass

        # Try extracting Markdown JSON block
        try:
            if "```json" in response_text:
                block = response_text.split("```json")[1].split("```")[0].strip()
                return json.loads(block)

            if "```" in response_text:
                block = response_text.split("```")[1].split("```")[0].strip()
                return json.loads(block)

        except Exception:
            pass

        # Last-ditch cleanup (remove stray characters)
        try:
            cleaned = (
                response_text.replace("```json", "")
                .replace("```", "")
                .strip()
            )
            return json.loads(cleaned)
        except Exception:
            raise ValueError(f"Failed to parse JSON from LLM: {response_text}")

    # ----------------------------------------------------------------------
    # PROMPT HELPERS
    # ----------------------------------------------------------------------
    def format_platform_data(self, platform_data: dict[str, Any]) -> str:
        """Pretty-print platform data for prompt injection."""
        return json.dumps(platform_data, indent=2)

    def format_negotiation_history(self, history: list[dict[str, Any]]) -> str:
        """Formats last 5 history entries for prompt context."""
        if not history:
            return "No previous turns yet."

        lines = ["Previous turns:"]
        for turn in history[-5:]:
            party = turn["party"].upper()
            action = turn["action"]
            msg = turn["message"]
            price = turn.get("offer_price")

            line = f"\n{turn['turn']}: {party} {action}"
            if price is not None:
                line += f" - ${price:.2f}"
            line += f"\n  Message: {msg}"

            lines.append(line)

        return "\n".join(lines)

    # ----------------------------------------------------------------------
    # LOGGING
    # ----------------------------------------------------------------------
    def log_action(self, action: str, price: Optional[float] = None) -> None:
        """
        Logs agent actions for debugging.
        """
        pstr = f" @ ${price:.2f}" if price is not None else ""
        logger.info(f"[{self.agent_name}] {action}{pstr}")
