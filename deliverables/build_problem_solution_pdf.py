from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)


OUT = "deliverables/Problem_Statement_Solution_Explainer.pdf"


def p(text, style):
    return Paragraph(text, style)


def build():
    doc = SimpleDocTemplate(
        OUT,
        pagesize=letter,
        rightMargin=0.72 * inch,
        leftMargin=0.72 * inch,
        topMargin=0.62 * inch,
        bottomMargin=0.62 * inch,
        title="Problem Statement & Solution Explainer",
    )

    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "TitleCustom",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#1F2937"),
        alignment=TA_LEFT,
        spaceAfter=4,
    )
    subtitle = ParagraphStyle(
        "SubtitleCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#5B677A"),
        spaceAfter=12,
    )
    h1 = ParagraphStyle(
        "H1Custom",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=colors.HexColor("#2E74B5"),
        spaceBefore=12,
        spaceAfter=6,
    )
    h2 = ParagraphStyle(
        "H2Custom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#1F4D78"),
        spaceBefore=9,
        spaceAfter=5,
    )
    body = ParagraphStyle(
        "BodyCustom",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.3,
        leading=14,
        textColor=colors.HexColor("#1F2937"),
        spaceAfter=6,
    )
    small = ParagraphStyle(
        "SmallCustom",
        parent=body,
        fontSize=8.8,
        leading=11,
        textColor=colors.HexColor("#5B677A"),
    )
    bullet = ParagraphStyle(
        "BulletCustom",
        parent=body,
        leftIndent=18,
        bulletIndent=6,
        spaceAfter=4,
    )
    callout = ParagraphStyle(
        "CalloutCustom",
        parent=body,
        fontSize=9.8,
        leading=13,
    )
    table_text = ParagraphStyle(
        "TableText",
        parent=body,
        fontSize=9,
        leading=11.5,
        spaceAfter=0,
    )
    table_head = ParagraphStyle(
        "TableHead",
        parent=table_text,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#1F4D78"),
    )
    diagram_head = ParagraphStyle(
        "DiagramHead",
        parent=table_head,
        alignment=TA_CENTER,
        fontSize=8.7,
        leading=10.5,
    )
    diagram_text = ParagraphStyle(
        "DiagramText",
        parent=table_text,
        alignment=TA_CENTER,
        fontSize=7.9,
        leading=9.5,
    )

    story = []
    story.append(p("Problem Statement & Solution Explainer", title))
    story.append(p("RetailFlow / BarrelFlow POS for retail and liquor-store operations", subtitle))

    callout_table = Table(
        [[p("<b>Purpose:</b> This brief explains the business problem and how the proposed POS product solves it for small retail stores that need faster billing, cleaner inventory control, and clearer operational reporting.", callout)]],
        colWidths=[7.05 * inch],
    )
    callout_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#E8F1FA")),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#B8CADB")),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(callout_table)
    story.append(Spacer(1, 7))

    story.append(p("Problem Statement", h1))
    story.append(p("Small retail and liquor stores often run daily operations across disconnected tools: manual billing, spreadsheet inventory, informal customer tracking, and paper receipts. This creates slow checkout lines, inaccurate stock counts, limited sales visibility, and avoidable mistakes during busy store hours.", body))
    story.append(p("<b>The core problem is operational fragmentation:</b>", body))
    bullets = [
        "Billing is slow when cashiers must manually calculate carts, discounts, taxes, and payment status.",
        "Inventory is unreliable when product sales do not immediately update stock and packaging quantities.",
        "Customer and order history are hard to retrieve when receipts, phone numbers, and previous purchases are spread across multiple places.",
        "Store owners lack real-time visibility into revenue, best-selling items, payment mix, and low-stock risks.",
        "Authentication and staff access need to be simple enough for store teams but controlled enough for business use.",
    ]
    for item in bullets:
        story.append(Paragraph(item, bullet, bulletText="-"))

    story.append(p("Solution Overview", h1))
    story.append(p("RetailFlow / BarrelFlow is a modern web-based POS workspace that brings billing, inventory, orders, customers, promotions, settings, and reporting into one interface. The product is built as a Next.js application with a polished cashier dashboard and Google authentication support.", body))

    solution_rows = [
        [p("Capability", table_head), p("How the solution responds", table_head)],
        [p("Fast checkout", table_head), p("POS cart, payment method selection, ID verification prompt, and receipt flow", table_text)],
        [p("Inventory control", table_head), p("Products, stock quantities, packaging units, categories, and printable tags", table_text)],
        [p("Customer history", table_head), p("Customer records built from sales, contact details, and order counts", table_text)],
        [p("Operational visibility", table_head), p("Dashboard, reports, revenue totals, payment mix, and recent orders", table_text)],
        [p("Secure access", table_head), p("Google login with Firebase plus email/password flows and reset support", table_text)],
    ]
    solution_table = Table(solution_rows, colWidths=[1.72 * inch, 5.33 * inch], repeatRows=1)
    solution_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F4F6F8")),
        ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#C9D3DF")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(solution_table)
    story.append(Spacer(1, 8))

    story.append(p("How the Product Works", h1))
    work_items = [
        "Cashiers sign in, open the POS terminal, select or scan products, verify age when required, choose payment mode, and confirm the sale.",
        "Inventory screens let the store maintain products, categories, stock quantities, pricing, packaging units, and printable product tags.",
        "Orders, customers, and reports give owners a structured view of transactions, customer activity, sales totals, and operational trends.",
        "Settings allow the store to manage branding, receipt content, theme, employee details, and business preferences.",
    ]
    for item in work_items:
        story.append(Paragraph(item, bullet, bulletText="-"))

    diagram = [
        [
            p("Store Staff", diagram_head),
            p("RetailFlow POS", diagram_head),
            p("Inventory + Orders", diagram_head),
            p("Customers + Receipts", diagram_head),
            p("Reports + Decisions", diagram_head),
        ],
        [
            p("Logs in and selects products", diagram_text),
            p("Builds bill and captures payment", diagram_text),
            p("Updates stock and transaction history", diagram_text),
            p("Stores buyer context and prints receipts", diagram_text),
            p("Shows sales, stock, and next actions", diagram_text),
        ],
    ]
    diagram_table = Table(diagram, colWidths=[1.25 * inch, 1.35 * inch, 1.45 * inch, 1.52 * inch, 1.48 * inch])
    diagram_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8F1FA")),
        ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#9FB8D0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(KeepTogether([p("Small Diagram: Solution Flow", h2), diagram_table, p("Flow: Store Staff -> POS -> Inventory/Orders -> Customers/Receipts -> Reports/Decisions", small)]))

    story.append(p("Current State and Next Step", h1))
    story.append(p("The current product is a strong working POS prototype with authentication and a complete front-end operating flow. Its business data layer currently relies heavily on a browser-local mock API for products, orders, customers, and reports. The recommended next step is to connect those modules to real Supabase database tables with row-level security so each store account has durable, isolated production data.", body))
    final_callout = Table(
        [[p("<b>Outcome:</b> The solution turns fragmented store operations into one faster, clearer workflow: sell products, update inventory, track customers, print receipts, and review performance from the same POS system.", callout)]],
        colWidths=[7.05 * inch],
    )
    final_callout.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#E8F1FA")),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#B8CADB")),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(final_callout)

    def footer(canvas, _doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#5B677A"))
        canvas.drawCentredString(4.25 * inch, 0.35 * inch, "RetailFlow / BarrelFlow POS - Problem & Solution Brief")
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    build()
