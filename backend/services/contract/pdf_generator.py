"""
PDF contract generation using ReportLab.
"""

from io import BytesIO
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from typing import Dict, Any


def generate_contract_pdf(contract_data: Dict[str, Any]) -> bytes:
    """
    Generate PDF contract using ReportLab.

    Args:
        contract_data: Contract information

    Returns:
        PDF bytes
    """
    buffer = BytesIO()

    # Create PDF document
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontSize=16,
        textColor=colors.HexColor("#1a1a1a"),
        spaceAfter=12,
        alignment=1  # Center
    )

    elements.append(Paragraph("PRODUCT PURCHASE AGREEMENT", title_style))
    elements.append(Spacer(1, 0.2 * inch))

    # Agreement info
    today = datetime.now()
    delivery_date = today + timedelta(days=7)
    payment_due = today + timedelta(days=3)

    info_data = [
        ["Date:", today.strftime("%B %d, %Y")],
        ["Agreement ID:", contract_data.get("negotiation_id", "N/A")],
    ]

    info_table = Table(info_data, colWidths=[1.5 * inch, 4 * inch])
    info_table.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 10),
        ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 10),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))

    elements.append(info_table)
    elements.append(Spacer(1, 0.2 * inch))

    # Parties section
    buyer_id = contract_data.get("buyer_id", "BUYER")
    seller_id = contract_data.get("seller_id", "SELLER")

    elements.append(Paragraph("PARTIES:", styles["Heading2"]))
    parties_data = [
        ["Buyer:", buyer_id],
        ["Seller:", seller_id],
    ]
    parties_table = Table(parties_data, colWidths=[1.5 * inch, 4 * inch])
    parties_table.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 10),
        ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 10),
    ]))
    elements.append(parties_table)
    elements.append(Spacer(1, 0.2 * inch))

    # Product details
    product = contract_data.get("product", {})
    result = contract_data.get("result", {})
    final_price = result.get("negotiated_price", product.get("asking_price", 0))

    elements.append(Paragraph("PRODUCT DETAILS:", styles["Heading2"]))
    product_data = [
        ["Title:", product.get("product_detail", "N/A")],
        ["Condition:", product.get("condition", "N/A")],
        ["Description:", product.get("description", "N/A")],
    ]
    product_table = Table(product_data, colWidths=[1.5 * inch, 4 * inch])
    product_table.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 10),
        ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(product_table)
    elements.append(Spacer(1, 0.2 * inch))

    # Price terms
    elements.append(Paragraph("PRICE TERMS:", styles["Heading2"]))
    price_data = [
        ["Original Asking Price:", f"${product.get('asking_price', 0):.2f}"],
        ["Negotiated Final Price:", f"${final_price:.2f}"],
        ["Savings:", f"${product.get('asking_price', 0) - final_price:.2f}"],
    ]
    price_table = Table(price_data, colWidths=[2 * inch, 3.5 * inch])
    price_table.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 10),
        ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 10),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
    ]))
    elements.append(price_table)
    elements.append(Spacer(1, 0.2 * inch))

    # Payment and delivery terms
    elements.append(Paragraph("PAYMENT & DELIVERY TERMS:", styles["Heading2"]))
    terms_data = [
        ["Payment Due:", payment_due.strftime("%B %d, %Y")],
        ["Delivery Date:", delivery_date.strftime("%B %d, %Y")],
        ["Inspection Period:", "3 business days from delivery"],
        ["Warranty:", "As-is unless otherwise specified"],
    ]
    terms_table = Table(terms_data, colWidths=[2 * inch, 3.5 * inch])
    terms_table.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 10),
        ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 10),
    ]))
    elements.append(terms_table)
    elements.append(Spacer(1, 0.3 * inch))

    # Signatures
    elements.append(Paragraph("SIGNATURES:", styles["Heading2"]))
    elements.append(Spacer(1, 0.2 * inch))

    sig_text = "By signing below, both parties agree to the terms of this agreement."
    elements.append(Paragraph(sig_text, styles["Normal"]))
    elements.append(Spacer(1, 0.3 * inch))

    elements.append(Paragraph(f"Buyer: ________________________  Date: ____________", styles["Normal"]))
    elements.append(Spacer(1, 0.3 * inch))
    elements.append(Paragraph(f"Seller: ________________________  Date: ____________", styles["Normal"]))

    # Build PDF
    doc.build(elements)

    # Get bytes
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes


def get_contract_filename(contract_data: Dict[str, Any]) -> str:
    """Generate PDF filename."""
    negotiation_id = contract_data.get("negotiation_id", "contract")
    return f"contract_{negotiation_id}.pdf"
