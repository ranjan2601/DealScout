"""
Contract and offer endpoints.
Fully cleaned for FastAPI + Pydantic v2 compatibility and OpenAPI stability.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from pymongo.database import Database

from backend.db.mongo import get_db
from backend.db.models import ContractRequest
from backend.services.contract.generator import (
    generate_contract_text,
    generate_contract_data,
)
from backend.services.contract.pdf_generator import (
    generate_contract_pdf,
    get_contract_filename,
)

router = APIRouter(prefix="/contract", tags=["contract"])


# --------------------------------------------------------------------
# GENERATE CONTRACT PDF
# --------------------------------------------------------------------
@router.post("/generate", response_class=Response)
async def generate_contract_pdf_file(
    request: ContractRequest,
    db: Database = Depends(get_db),
):
    """
    Generate a contract PDF using final negotiated details.

    Returns:
        application/pdf binary stream
    """
    try:
        contract_data: dict[str, Any] = {
            "negotiation_id": request.negotiation_id,
            "buyer_id": request.buyer_id,
            "seller_id": request.seller_id,
            "listing_id": request.listing_id,
            "product": request.product,
            "result": {"negotiated_price": request.final_price},
            "payment_details": request.payment_details,
        }

        pdf_bytes = generate_contract_pdf(contract_data)
        filename = get_contract_filename(contract_data)

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "application/pdf",
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Contract PDF generation error: {str(e)}")


# --------------------------------------------------------------------
# GET CONTRACT TEXT (NON-PDF VERSION)
# --------------------------------------------------------------------
@router.post("/text")
async def get_contract_text(request: ContractRequest) -> dict:
    """
    Generate human-readable contract text and structured data.
    """

    try:
        contract_data: dict[str, Any] = {
            "negotiation_id": request.negotiation_id,
            "buyer_id": request.buyer_id,
            "seller_id": request.seller_id,
            "listing_id": request.listing_id,
            "product": request.product,
            "result": {"negotiated_price": request.final_price},
            "payment_details": request.payment_details,
        }

        text = generate_contract_text(contract_data)
        data = generate_contract_data(contract_data)

        return {
            "status": "success",
            "contract_text": text,
            "contract_data": data,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Contract text generation error: {str(e)}")
