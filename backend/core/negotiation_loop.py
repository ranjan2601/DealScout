"""
Negotiation loop and state machine.
Improved for stability, type safety, and Pydantic v2 compatibility.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Optional, Callable

from backend.agents.buyer_agent import BuyerAgent
from backend.agents.seller_agent import SellerAgent
from backend.config.settings import settings
from backend.db.models import NegotiationResult, NegotiationMessage

logger = logging.getLogger(__name__)


class NegotiationLoop:
    """Main orchestrator for buyer/seller negotiations."""

    def __init__(self) -> None:
        self.buyer_agent = BuyerAgent()
        self.seller_agent = SellerAgent()
        self.max_turns = settings.max_negotiation_turns
        self.convergence_threshold = settings.price_convergence_threshold

    # ----------------------------------------------------------------------
    # RUN NEGOTIATION (NON-STREAMING)
    # ----------------------------------------------------------------------
    def run_negotiation(
        self,
        listing: dict[str, Any],
        buyer_budget_override: Optional[float] = None,
        product_questions: Optional[list[str]] = None,
    ) -> NegotiationResult:
        """
        Run full negotiation session synchronously.

        Args:
            listing: dict containing listing info (id, title, price, seller_id)
            buyer_budget_override: manually override buyer's budget
            product_questions: optional evaluation questions

        Returns:
            NegotiationResult Pydantic model
        """

        listing_id = listing.get("id", "unknown")
        asking_price = float(listing.get("price", 0.0) or 0.0)

        # Determine buyer budget
        if buyer_budget_override:
            buyer_budget = float(buyer_budget_override)
        else:
            buyer_budget = asking_price * settings.buyer_budget_multiplier

        seller_minimum = asking_price * settings.seller_minimum_multiplier

        # Construct shared data for both agents
        platform_data: dict[str, Any] = self._build_platform_data(listing, asking_price)

        buyer_prefs: dict[str, Any] = {
            "max_budget": buyer_budget,
            "target_price": buyer_budget,
        }

        seller_prefs: dict[str, Any] = {
            "min_acceptable": seller_minimum,
            "asking_price": asking_price,
            "can_bundle_extras": listing.get("extras", []),
        }

        messages: list[NegotiationMessage] = []
        history: list[dict[str, Any]] = []
        final_price: Optional[float] = None

        # Add system starting message
        messages.append(
            NegotiationMessage(
                role="system",
                content=f"🤝 Negotiation started for {listing.get('title', 'product')}."
            )
        )

        try:
            # Turn-by-turn loop
            for turn_num in range(1, self.max_turns + 1):

                # ----------------------------------------------------------
                # BUYER TURN (odd turns)
                # ----------------------------------------------------------
                if turn_num % 2 == 1:

                    buyer_state: dict[str, Any] = {
                        "buyer_prefs": buyer_prefs,
                        "platform_data": platform_data,
                        "history": history,
                        "turn_number": turn_num,
                    }

                    response = self.buyer_agent.generate_response(
                        buyer_state,
                        product_questions=product_questions,
                    )

                    messages.append(
                        NegotiationMessage(role="buyer", content=response["message"])
                    )

                    history.append(
                        {
                            "turn": turn_num,
                            "party": "buyer",
                            "action": response["action"],
                            "offer_price": response.get("offer_price"),
                            "message": response["message"],
                            "confidence": response.get("confidence", 0.5),
                        }
                    )

                    # Deal conditions
                    if response["action"] == "accept":
                        final_price = response.get("offer_price", asking_price)
                        messages.append(
                            NegotiationMessage(
                                role="system",
                                content=f"✅ Deal reached at ${final_price:.2f}"
                            )
                        )
                        break

                    if response["action"] == "walk_away":
                        messages.append(
                            NegotiationMessage(role="system", content="❌ Buyer walked away.")
                        )
                        break

                # ----------------------------------------------------------
                # SELLER TURN (even turns)
                # ----------------------------------------------------------
                else:

                    seller_state: dict[str, Any] = {
                        "seller_prefs": seller_prefs,
                        "platform_data": platform_data,
                        "history": history,
                        "turn_number": turn_num,
                    }

                    response = self.seller_agent.generate_response(seller_state)

                    messages.append(
                        NegotiationMessage(role="seller", content=response["message"])
                    )

                    history.append(
                        {
                            "turn": turn_num,
                            "party": "seller",
                            "action": response["action"],
                            "offer_price": response.get("offer_price"),
                            "message": response["message"],
                            "confidence": response.get("confidence", 0.5),
                        }
                    )

                    if response["action"] == "accept":
                        final_price = response.get("offer_price", asking_price)
                        messages.append(
                            NegotiationMessage(
                                role="system",
                                content=f"✅ Seller accepted ${final_price:.2f}"
                            )
                        )
                        break

                    if response["action"] == "reject":
                        messages.append(
                            NegotiationMessage(role="system", content="❌ Seller rejected the offer.")
                        )
                        break

                # ----------------------------------------------------------
                # Convergence Check
                # ----------------------------------------------------------
                if self._check_convergence(history):
                    messages.append(
                        NegotiationMessage(
                            role="system",
                            content="💡 Offers are converging — consider accepting."
                        )
                    )

        except Exception as e:
            logger.error("Negotiation error: %s", e)
            messages.append(NegotiationMessage(role="system", content=f"⚠️ Error: {str(e)}"))

            return NegotiationResult(
                listing_id=listing_id,
                seller_id=listing.get("seller_id", "unknown"),
                original_price=asking_price,
                negotiated_price=asking_price,
                messages=messages,
                status="error",
                savings=0,
                turn_count=len(history),
                completed_at=datetime.utcnow(),
            )

        # Determine final outcome
        if final_price is not None:
            savings = asking_price - final_price
            status = "success"
        else:
            final_price = asking_price
            savings = 0
            status = "no_deal"
            messages.append(
                NegotiationMessage(
                    role="system",
                    content=f"⚠️ No agreement reached after {self.max_turns} turns"
                )
            )

        return NegotiationResult(
            listing_id=listing_id,
            seller_id=listing.get("seller_id", "unknown"),
            original_price=asking_price,
            negotiated_price=final_price,
            messages=messages,
            status=status,
            savings=savings,
            turn_count=len(history),
            completed_at=datetime.utcnow(),
        )

    # ----------------------------------------------------------------------
    # STREAMING VERSION (SSE)
    # ----------------------------------------------------------------------
    def run_negotiation_streaming(
        self,
        listing: dict[str, Any],
        buyer_budget_override: Optional[float] = None,
        product_questions: Optional[list[str]] = None,
        message_callback: Optional[Callable[[NegotiationMessage], None]] = None,
    ) -> NegotiationResult:
        """
        Streaming version used for Server-Sent Events.
        """

        # This version mirrors the non-streaming flow
        # but emits messages via callback
        result = self.run_negotiation(
            listing=listing,
            buyer_budget_override=buyer_budget_override,
            product_questions=product_questions,
        )

        # Emit all messages if streaming
        if message_callback:
            for msg in result.messages:
                message_callback(msg)

        return result

    # ----------------------------------------------------------------------
    # HELPER: BUILD PLATFORM DATA
    # ----------------------------------------------------------------------
    def _build_platform_data(
        self,
        listing: dict[str, Any],
        asking_price: float,
    ) -> dict[str, Any]:
        """Generate comparable market data."""

        comps = [
            {"price": int(asking_price * 0.85), "condition": "good"},
            {"price": int(asking_price * 0.88), "condition": "like-new"},
            {"price": int(asking_price * 0.90), "condition": "good"},
            {"price": int(asking_price * 0.92), "condition": "like-new"},
        ]

        return {
            "product": {
                "title": listing.get("title", "Product"),
                "asking_price": asking_price,
                "condition": listing.get("condition", "good"),
                "extras": listing.get("extras", []),
            },
            "platform_comps": comps,
            "platform_stats": {
                "avg_price_sold": int(asking_price * 0.87),
                "median_price_sold": int(asking_price * 0.88),
                "avg_time_to_sell_days": 4.2,
                "total_comps_found": len(comps),
            },
        }

    # ----------------------------------------------------------------------
    # HELPER: CHECK CONVERGENCE
    # ----------------------------------------------------------------------
    def _check_convergence(
        self,
        history: list[dict[str, Any]],
        threshold: Optional[float] = None,
    ) -> bool:
        """Check if recent buyer/seller offers have converged."""
        if threshold is None:
            threshold = self.convergence_threshold

        if len(history) < 2:
            return False

        last_buyer = None
        last_seller = None

        for turn in reversed(history):
            if turn["party"] == "buyer" and last_buyer is None:
                last_buyer = turn.get("offer_price")
            elif turn["party"] == "seller" and last_seller is None:
                last_seller = turn.get("offer_price")

            if last_buyer is not None and last_seller is not None:
                break

        if last_buyer is None or last_seller is None:
            return False

        gap = abs(last_buyer - last_seller)
        return gap <= threshold
