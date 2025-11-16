"""
Professional PDF Contract Generator for DealScout Marketplace
Generates legally-binding purchase agreements with proper formatting and clauses
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib import colors
from datetime import datetime, timedelta
from typing import Dict, Any
import io


def generate_contract_pdf(contract: Dict[str, Any]) -> bytes:
    """
    Generate a professional PDF contract from contract data

    Args:
        contract: Contract dictionary with all terms and conditions

    Returns:
        PDF file as bytes
    """
    # Create PDF in memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )

    # Build the document content
    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#1a365d'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#4a5568'),
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2d3748'),
        spaceAfter=8,
        spaceBefore=16,
        fontName='Helvetica-Bold',
        borderWidth=0,
        borderPadding=0,
        borderColor=colors.HexColor('#e2e8f0'),
        backColor=colors.HexColor('#f7fafc')
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#2d3748'),
        spaceAfter=8,
        alignment=TA_JUSTIFY,
        fontName='Helvetica',
        leading=14
    )

    bold_style = ParagraphStyle(
        'CustomBold',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#1a202c'),
        spaceAfter=6,
        fontName='Helvetica-Bold'
    )

    # Header
    story.append(Paragraph("PURCHASE AGREEMENT", title_style))
    story.append(Paragraph("AI-Negotiated Marketplace Contract", subtitle_style))
    story.append(Spacer(1, 0.2*inch))

    # Contract metadata table
    contract_info = [
        ['Contract ID:', contract['contract_id']],
        ['Generated:', datetime.fromisoformat(contract['created_at']).strftime('%B %d, %Y at %I:%M %p')],
        ['Expires:', datetime.fromisoformat(contract['expires_at']).strftime('%B %d, %Y at %I:%M %p')],
        ['Platform:', 'DealScout Marketplace']
    ]

    info_table = Table(contract_info, colWidths=[2*inch, 4*inch])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#4a5568')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1a202c')),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f7fafc')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.3*inch))

    # PARTIES
    story.append(Paragraph("1. PARTIES TO THIS AGREEMENT", heading_style))
    parties_text = f"""
    This Purchase Agreement ("Agreement") is entered into as of {datetime.fromisoformat(contract['created_at']).strftime('%B %d, %Y')}
    by and between the following parties:
    <br/><br/>
    <b>BUYER:</b> User ID {contract['buyer']['id']} ("Buyer")<br/>
    <b>SELLER:</b> User ID {contract['seller']['id']} ("Seller")<br/><br/>
    The Buyer and Seller are collectively referred to as the "Parties" and individually as a "Party."
    """
    story.append(Paragraph(parties_text, body_style))
    story.append(Spacer(1, 0.15*inch))

    # PRODUCT DETAILS
    story.append(Paragraph("2. PRODUCT DESCRIPTION", heading_style))
    product = contract['product']
    product_text = f"""
    The Seller agrees to sell, and the Buyer agrees to purchase, the following item(s) ("Product"):
    <br/><br/>
    <b>Item:</b> {product['title']}<br/>
    <b>Condition:</b> {product['condition'].title()}<br/>
    <b>Location:</b> {contract['delivery_terms']['location']}<br/>
    """
    if product.get('extras') and len(product['extras']) > 0:
        product_text += f"<b>Included Accessories:</b> {', '.join(product['extras'])}<br/>"

    story.append(Paragraph(product_text, body_style))
    story.append(Spacer(1, 0.15*inch))

    # PURCHASE PRICE
    story.append(Paragraph("3. PURCHASE PRICE AND PAYMENT TERMS", heading_style))
    payment = contract['payment_terms']

    price_data = [
        ['Original Asking Price:', f"${product['original_price']:.2f}"],
        ['Negotiated Purchase Price:', f"${payment['total_amount']:.2f}"],
        ['Platform Service Fee (5%):', f"${payment['platform_fee']:.2f}"],
        ['<b>TOTAL AMOUNT DUE:</b>', f"<b>${payment['buyer_total']:.2f}</b>"]
    ]

    price_table = Table(price_data, colWidths=[4*inch, 2*inch])
    price_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, 2), 'Helvetica'),
        ('FONTNAME', (1, 0), (1, 2), 'Helvetica'),
        ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1a202c')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('LINEABOVE', (0, 3), (-1, 3), 1.5, colors.HexColor('#2d3748')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(price_table)
    story.append(Spacer(1, 0.1*inch))

    payment_text = f"""
    <b>Payment Method:</b> Visa via DealScout secure payment gateway<br/>
    <b>Payment Due Date:</b> {datetime.fromisoformat(payment['due_date']).strftime('%B %d, %Y')}<br/><br/>
    The Buyer shall pay the Total Amount Due through the DealScout platform using Visa payment processing.
    Payment must be completed by the due date specified above. Upon successful payment verification,
    the Seller will receive ${payment['seller_receives']:.2f} (purchase price less platform fees).
    """
    story.append(Paragraph(payment_text, body_style))
    story.append(Spacer(1, 0.15*inch))

    # AI NEGOTIATION DISCLOSURE
    story.append(Paragraph("4. AI-NEGOTIATED PRICING", heading_style))
    negotiation_turns = len(contract.get('negotiation_transcript', []))
    ai_disclosure = f"""
    The Parties acknowledge and agree that the purchase price was negotiated autonomously by artificial
    intelligence agents representing the interests of both the Buyer and Seller. The negotiation was
    conducted through the DealScout AI negotiation system, which analyzed market data, comparable listings,
    and both parties' preferences to arrive at a fair market price.
    <br/><br/>
    <b>Negotiation Summary:</b> The AI agents completed {negotiation_turns if negotiation_turns > 0 else 'multiple'} round(s)
    of negotiation, resulting in a mutually agreed price of ${payment['total_amount']:.2f}.
    The Buyer achieved savings of ${product.get('savings', 0):.2f} from the original asking price.
    """
    story.append(Paragraph(ai_disclosure, body_style))
    story.append(Spacer(1, 0.15*inch))

    # DELIVERY TERMS
    story.append(Paragraph("5. DELIVERY AND INSPECTION", heading_style))
    delivery = contract['delivery_terms']
    delivery_text = f"""
    <b>Delivery Method:</b> {delivery['method'].replace('_', ' ').title()}<br/>
    <b>Delivery Location:</b> {delivery['location']}<br/>
    <b>Delivery Timeframe:</b> Within {delivery['timeframe_days']} days of payment confirmation<br/>
    <b>Inspection Period:</b> {delivery['buyer_inspection_period_hours']} hours upon receipt<br/><br/>

    The Seller agrees to make the Product available for pickup/delivery within the specified timeframe.
    The Buyer shall have {delivery['buyer_inspection_period_hours']} hours from receipt to inspect
    the Product and verify it matches the description provided. Any discrepancies must be reported
    to DealScout immediately during the inspection period.
    """
    story.append(Paragraph(delivery_text, body_style))
    story.append(Spacer(1, 0.15*inch))

    # RETURN POLICY
    story.append(Paragraph("6. RETURN AND REFUND POLICY", heading_style))
    returns = contract['return_policy']
    if returns['eligible']:
        return_text = f"""
        <b>Returns Accepted:</b> Yes<br/>
        <b>Return Window:</b> {returns['period_hours']} hours from delivery<br/>
        <b>Return Condition:</b> {returns['condition']}<br/>
        <b>Refund Amount:</b> {returns['refund_percentage']}% of purchase price<br/><br/>

        The Buyer may return the Product within {returns['period_hours']} hours of receipt if the Product
        does not match the description or is found to have undisclosed defects. The Product must be returned
        in the same condition as received. Upon approved return, the Buyer will receive a refund of
        {returns['refund_percentage']}% of the purchase price. Platform fees are non-refundable.
        """
    else:
        return_text = """
        This sale is final. Returns are not accepted for this Product. The Buyer acknowledges that
        they have reviewed the Product description and accepts the Product "as-is."
        """
    story.append(Paragraph(return_text, body_style))
    story.append(Spacer(1, 0.15*inch))

    # Page break before legal clauses
    story.append(PageBreak())

    # LEGAL CLAUSES
    story.append(Paragraph("7. WARRANTIES AND DISCLAIMERS", heading_style))
    warranty_text = """
    <b>7.1 Seller's Warranty:</b> The Seller warrants that they are the lawful owner of the Product
    and have the right to sell it. The Seller warrants that the Product is free from any liens,
    encumbrances, or third-party claims.
    <br/><br/>
    <b>7.2 AS-IS Sale:</b> Except as explicitly stated in this Agreement, the Product is sold "AS-IS"
    and "WITH ALL FAULTS." The Seller makes no warranties, express or implied, including but not
    limited to warranties of merchantability or fitness for a particular purpose.
    <br/><br/>
    <b>7.3 Buyer Acknowledgment:</b> The Buyer acknowledges that they have had adequate opportunity
    to inspect the Product description and ask questions prior to purchase.
    """
    story.append(Paragraph(warranty_text, body_style))
    story.append(Spacer(1, 0.15*inch))

    story.append(Paragraph("8. LIMITATION OF LIABILITY", heading_style))
    liability_text = """
    <b>8.1 Platform Role:</b> DealScout acts solely as an intermediary platform facilitating
    transactions between buyers and sellers. DealScout is not a party to this Agreement and
    assumes no liability for the Product's condition, quality, safety, or legality.
    <br/><br/>
    <b>8.2 Maximum Liability:</b> In no event shall either Party's liability to the other Party
    exceed the total purchase price paid for the Product. Neither Party shall be liable for any
    indirect, incidental, consequential, or punitive damages.
    <br/><br/>
    <b>8.3 Buyer Responsibility:</b> The Buyer assumes all risk of loss or damage to the Product
    after the inspection period expires.
    """
    story.append(Paragraph(liability_text, body_style))
    story.append(Spacer(1, 0.15*inch))

    story.append(Paragraph("9. DISPUTE RESOLUTION", heading_style))
    dispute_text = """
    <b>9.1 Good Faith Negotiation:</b> The Parties agree to first attempt to resolve any disputes
    arising from this Agreement through good faith negotiation.
    <br/><br/>
    <b>9.2 Mediation:</b> If direct negotiation fails, the Parties agree to submit the dispute
    to mediation through DealScout's dispute resolution service within 48 hours of the dispute arising.
    <br/><br/>
    <b>9.3 Binding Arbitration:</b> Any disputes that cannot be resolved through mediation shall
    be settled by binding arbitration in accordance with the rules of the American Arbitration Association.
    The arbitrator's decision shall be final and binding.
    <br/><br/>
    <b>9.4 No Class Actions:</b> The Parties agree that any dispute resolution proceedings shall
    be conducted on an individual basis and not as a class action or collective proceeding.
    """
    story.append(Paragraph(dispute_text, body_style))
    story.append(Spacer(1, 0.15*inch))

    story.append(Paragraph("10. GOVERNING LAW", heading_style))
    law_text = """
    This Agreement shall be governed by and construed in accordance with the laws of the State of
    New York, without regard to its conflict of law provisions. Any legal action arising from this
    Agreement must be brought in the courts of New York County, New York.
    """
    story.append(Paragraph(law_text, body_style))
    story.append(Spacer(1, 0.15*inch))

    story.append(Paragraph("11. ENTIRE AGREEMENT", heading_style))
    entire_text = """
    This Agreement constitutes the entire agreement between the Parties concerning the subject matter
    hereof and supersedes all prior agreements, understandings, negotiations, and discussions, whether
    oral or written. This Agreement may not be amended except in writing signed by both Parties.
    """
    story.append(Paragraph(entire_text, body_style))
    story.append(Spacer(1, 0.15*inch))

    story.append(Paragraph("12. SEVERABILITY", heading_style))
    sever_text = """
    If any provision of this Agreement is found to be invalid, illegal, or unenforceable, the remaining
    provisions shall continue in full force and effect. The invalid provision shall be modified to the
    minimum extent necessary to make it valid and enforceable.
    """
    story.append(Paragraph(sever_text, body_style))
    story.append(Spacer(1, 0.15*inch))

    story.append(Paragraph("13. FORCE MAJEURE", heading_style))
    force_text = """
    Neither Party shall be liable for any failure or delay in performance under this Agreement due to
    circumstances beyond their reasonable control, including but not limited to acts of God, natural
    disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods,
    accidents, pandemics, strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials.
    """
    story.append(Paragraph(force_text, body_style))
    story.append(Spacer(1, 0.15*inch))

    story.append(Paragraph("14. ASSIGNMENT", heading_style))
    assign_text = """
    Neither Party may assign or transfer this Agreement or any rights or obligations hereunder without
    the prior written consent of the other Party. Any attempted assignment in violation of this provision
    shall be null and void.
    """
    story.append(Paragraph(assign_text, body_style))
    story.append(Spacer(1, 0.3*inch))

    # SIGNATURES
    story.append(Paragraph("SIGNATURES", heading_style))
    story.append(Paragraph(
        "By signing below, the Parties acknowledge that they have read, understood, and agree to be bound by the terms and conditions of this Agreement.",
        body_style
    ))
    story.append(Spacer(1, 0.3*inch))

    # Signature table
    sig_data = [
        ['BUYER', 'SELLER'],
        ['', ''],
        ['_' * 40, '_' * 40],
        ['Signature', 'Signature'],
        ['', ''],
        ['_' * 40, '_' * 40],
        ['Date', 'Date'],
        ['', ''],
        [f'User ID: {contract["buyer"]["id"]}', f'User ID: {contract["seller"]["id"]}'],
    ]

    sig_table = Table(sig_data, colWidths=[3.25*inch, 3.25*inch], rowHeights=[0.2*inch, 0.6*inch, 0.2*inch, 0.2*inch, 0.6*inch, 0.2*inch, 0.2*inch, 0.2*inch, 0.2*inch])
    sig_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('FONTNAME', (0, 3), (-1, 3), 'Helvetica'),
        ('FONTNAME', (0, 6), (-1, 6), 'Helvetica'),
        ('FONTNAME', (0, 8), (-1, 8), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2d3748')),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('ALIGN', (0, 3), (-1, 3), 'CENTER'),
        ('ALIGN', (0, 6), (-1, 6), 'CENTER'),
        ('ALIGN', (0, 8), (-1, 8), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor('#2d3748')),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 0.3*inch))

    # Footer
    footer_text = f"""
    <i>This is a legally binding contract generated by DealScout AI Marketplace.<br/>
    Contract ID: {contract['contract_id']} | Generated: {datetime.fromisoformat(contract['created_at']).strftime('%B %d, %Y at %I:%M %p')}<br/>
    For questions or disputes, contact support@dealscout.com</i>
    """
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#718096'),
        alignment=TA_CENTER,
        fontName='Helvetica-Oblique'
    )
    story.append(Paragraph(footer_text, footer_style))

    # Build PDF
    doc.build(story)

    # Get PDF bytes
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes


def get_contract_filename(contract: Dict[str, Any]) -> str:
    """
    Generate a standardized filename for the contract PDF

    Args:
        contract: Contract dictionary

    Returns:
        Filename string
    """
    product_name = contract['product']['title'].replace(' ', '_')[:30]
    contract_id = contract['contract_id'][-8:]
    date = datetime.fromisoformat(contract['created_at']).strftime('%Y%m%d')

    return f"DealScout_Contract_{product_name}_{contract_id}_{date}.pdf"
