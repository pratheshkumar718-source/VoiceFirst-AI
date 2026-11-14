import os
import re
import json
import uuid
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
import pymupdf as fitz
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from ..config import settings
from .document import DEFAULT_SCHOLARSHIP_ANALYSIS

logger = logging.getLogger(__name__)

TEMPLATE_PATH = settings.TEMPLATE_DIR / "scholarship_form.pdf"

def ensure_template_pdf():
    """
    Ensures that the base Government Scholarship PDF template exists.
    If not, dynamically generates an official-looking 1-page application form with AcroForm fields.
    """
    if TEMPLATE_PATH.exists():
        return

    logger.info(f"Creating base template at {TEMPLATE_PATH}")
    try:
        from reportlab.pdfgen import canvas

        c = canvas.Canvas(str(TEMPLATE_PATH), pagesize=letter)
        width, height = letter

        # Top Header Banner
        c.setFillColor(colors.HexColor("#1e3a8a"))  # Deep Navy Blue
        c.rect(0, height - 75, width, 75, stroke=0, fill=1)

        # Header Text
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 17)
        c.drawCentredString(width / 2, height - 32, "GOVERNMENT OF TAMIL NADU - ADI DRAVIDAR & TRIBAL WELFARE")
        c.setFont("Helvetica-Bold", 13)
        c.drawCentredString(width / 2, height - 50, "POST-MATRIC SCHOLARSHIP APPLICATION (2024 - 2025)")
        c.setFont("Helvetica", 9)
        c.drawCentredString(width / 2, height - 65, "Form ID: TN-PMS-2024-V1 | Digital Voice-Assisted Submission")

        # Decorative Gold Accent Line
        c.setStrokeColor(colors.HexColor("#f59e0b"))
        c.setLineWidth(3)
        c.line(0, height - 76, width, height - 76)

        # Section 1: Applicant Demographics
        y = height - 105
        c.setFillColor(colors.HexColor("#1e40af"))
        c.setFont("Helvetica-Bold", 12)
        c.drawString(40, y, "SECTION A: APPLICANT PERSONAL DETAILS")
        c.setStrokeColor(colors.HexColor("#93c5fd"))
        c.setLineWidth(1)
        c.line(40, y - 4, width - 40, y - 4)

        # Draw Labels & Field Outlines
        fields = [
            ("Full Name:", 40, y - 35, 230, 24, "full_name"),
            ("Date of Birth (DD/MM/YYYY):", 300, y - 35, 120, 24, "date_of_birth"),
            ("Gender:", 445, y - 35, 125, 24, "gender"),
            ("Aadhaar Number (12 digits):", 40, y - 85, 230, 24, "aadhaar_number"),
            ("Active Mobile Number:", 300, y - 85, 270, 24, "phone_number"),
            ("Annual Family Income (Rs.):", 40, y - 135, 230, 24, "income_annual"),
            ("Enrolled Course / Degree:", 300, y - 135, 270, 24, "course_name"),
            ("College / Institute Name:", 40, y - 185, 530, 24, "institution_name"),
            ("Permanent Residential Address:", 40, y - 240, 530, 36, "address"),
        ]

        c.setFillColor(colors.HexColor("#111827"))
        c.setFont("Helvetica-Bold", 9)

        form = c.acroForm
        for label, lx, ly, fw, fh, field_name in fields:
            c.drawString(lx, ly + fh + 4, label)
            form.textfield(
                name=field_name,
                tooltip=label,
                x=lx,
                y=ly,
                width=fw,
                height=fh,
                borderColor=colors.HexColor("#cbd5e1"),
                fillColor=colors.HexColor("#f8fafc"),
                textColor=colors.HexColor("#0f172a"),
                fontSize=10,
                borderWidth=1
            )

        # Section 2: Declarations & Verification
        y2 = y - 300
        c.setFillColor(colors.HexColor("#1e40af"))
        c.setFont("Helvetica-Bold", 12)
        c.drawString(40, y2, "SECTION B: VERIFICATION & DECLARATION")
        c.line(40, y2 - 4, width - 40, y2 - 4)

        c.setFillColor(colors.HexColor("#334155"))
        c.setFont("Helvetica", 8.5)
        text_lines = [
            "1. I hereby declare that all statements made in this application are true, complete, and correct to the best of my knowledge.",
            "2. I understand that misrepresentation of income, community, or enrollment status will result in immediate disqualification.",
            "3. Digital authentication was facilitated via VoiceFirst AI multimodal voice interaction.",
        ]
        ty = y2 - 20
        for line in text_lines:
            c.drawString(40, ty, line)
            ty -= 14

        # Date & Signature box
        c.setFont("Helvetica-Bold", 9)
        c.drawString(40, ty - 18, "Submission Date:")
        form.textfield(
            name="declaration_date",
            tooltip="Date",
            x=135,
            y=ty - 24,
            width=110,
            height=20,
            borderColor=colors.HexColor("#cbd5e1"),
            fillColor=colors.HexColor("#f8fafc"),
            fontSize=9,
            borderWidth=1
        )

        # Official Stamp Box Placeholder
        c.setStrokeColor(colors.HexColor("#0d9488"))
        c.setFillColor(colors.HexColor("#f0fdfa"))
        c.rect(width - 210, ty - 45, 170, 52, stroke=1, fill=1)
        c.setFillColor(colors.HexColor("#0f766e"))
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(width - 125, ty - 15, "VOICEFIRST AI VERIFIED")
        c.setFont("Helvetica", 7.5)
        c.drawCentredString(width - 125, ty - 27, "Digital Aadhaar / Voice Auth")
        c.drawCentredString(width - 125, ty - 38, "Status: APPROVED")

        # Footer
        c.setStrokeColor(colors.HexColor("#e2e8f0"))
        c.setLineWidth(1)
        c.line(40, 40, width - 40, 40)
        c.setFillColor(colors.HexColor("#64748b"))
        c.setFont("Helvetica", 8)
        c.drawString(40, 26, "Generated via VoiceFirst AI - Multimodal Assistant Engine")
        c.drawRightString(width - 40, 26, "Session Reference: TN-PMS-AUTO")

        c.save()
        logger.info("Successfully generated base template PDF.")
    except Exception as e:
        logger.error(f"Error creating PDF template: {e}")

# Register Tamil/Indic Unicode font if available on system
FONT_REGULAR = "Helvetica"
FONT_BOLD = "Helvetica-Bold"

try:
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    nirmala_path = Path("C:/Windows/Fonts/Nirmala.ttf")
    nirmala_b_path = Path("C:/Windows/Fonts/NirmalaB.ttf")
    if nirmala_path.exists() and nirmala_b_path.exists():
        pdfmetrics.registerFont(TTFont("Nirmala", str(nirmala_path)))
        pdfmetrics.registerFont(TTFont("NirmalaBold", str(nirmala_b_path)))
        FONT_REGULAR = "Nirmala"
        FONT_BOLD = "NirmalaBold"
        logger.info("Registered Nirmala font for bilingual Tamil & English PDF rendering.")
except Exception as fe:
    logger.warning(f"Could not load Nirmala font: {fe}. Defaulting to standard Helvetica.")

# Call immediately to make sure template exists
ensure_template_pdf()

def generate_document_specific_pdf(
    output_path: Path,
    doc_info: Dict[str, Any],
    form_data: Dict[str, Any],
    language: str = "en"
) -> Path:
    """
    Generates a tailored, official application PDF for ANY uploaded document.
    Clearly formats all collected details into structured form boxes so the applicant
    can use it for direct submission or as a clear reference to fill paper forms manually.
    """
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName=FONT_BOLD,
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#1e3a8a'),
        alignment=TA_CENTER
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName=FONT_BOLD,
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#0d9488'),
        alignment=TA_CENTER
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName=FONT_BOLD,
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#1e40af'),
        spaceBefore=8,
        spaceAfter=4
    )

    label_style = ParagraphStyle(
        'FieldLabel',
        parent=styles['Normal'],
        fontName=FONT_BOLD,
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor('#334155')
    )

    value_style = ParagraphStyle(
        'FieldValue',
        parent=styles['Normal'],
        fontName=FONT_REGULAR,
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#0f172a')
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName=FONT_REGULAR,
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#64748b')
    )

    story = []

    # 1. Document Title & Subtitle
    raw_title = doc_info.get("title", "Official Application Form")
    if language == "ta" and doc_info.get("title_tamil"):
        display_title = f"{raw_title} / {doc_info.get('title_tamil')}"
    else:
        display_title = raw_title

    story.append(Paragraph(display_title.upper(), title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("OFFICIAL COMPLETED APPLICATION & FORM REFERENCE", subtitle_style))
    story.append(Spacer(1, 8))

    # 2. Metadata Banner
    app_id = f"VF-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
    date_str = datetime.now().strftime("%d/%m/%Y %H:%M")
    doc_type = doc_info.get("document_type", "Government / Institutional Form")

    meta_table_data = [
        [
            Paragraph(f"<b>Application Ref:</b> {app_id}", meta_style),
            Paragraph(f"<b>Type:</b> {doc_type}", meta_style),
            Paragraph(f"<b>Date:</b> {date_str}", meta_style),
            Paragraph(f"<b>Status:</b> <font color='#0d9488'><b>VERIFIED</b></font>", meta_style)
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[160, 150, 110, 120])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # 3. Purpose Box
    purpose = doc_info.get("purpose", "Official application form processed via VoiceFirst AI.")
    if language == "ta" and doc_info.get("purpose_tamil"):
        purpose_text = f"{purpose}<br/><i>{doc_info.get('purpose_tamil')}</i>"
    else:
        purpose_text = purpose

    purpose_para = Paragraph(
        f"<b>Document Purpose & Reference:</b> {purpose_text}",
        ParagraphStyle('Purp', parent=styles['Normal'], fontName=FONT_REGULAR, fontSize=8.5, leading=11.5, textColor=colors.HexColor('#1e293b'))
    )
    purpose_table = Table([[purpose_para]], colWidths=[540])
    purpose_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#bfdbfe')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(purpose_table)
    story.append(Spacer(1, 10))

    # 4. Section 1: Form Fields Table
    story.append(Paragraph("SECTION 1: APPLICANT INFORMATION & FORM DETAILS", section_heading))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#93c5fd'), spaceBefore=1, spaceAfter=6))

    fields = doc_info.get("fields", [])
    
    # If no fields in doc_info, use keys from form_data
    if not fields and form_data:
        fields = [{"name": k, "label": k.replace("_", " ").title()} for k in form_data.keys()]

    table_rows = [
        [
            Paragraph("<b>Field Name / Description</b>", ParagraphStyle('TH1', parent=styles['Normal'], fontSize=9, fontName=FONT_BOLD, textColor=colors.white)),
            Paragraph("<b>Verified User Input (Use to Fill Form)</b>", ParagraphStyle('TH2', parent=styles['Normal'], fontSize=9, fontName=FONT_BOLD, textColor=colors.white))
        ]
    ]

    norm = lambda s: s.lower().replace("_", "").replace(" ", "").replace("-", "")

    for f in fields:
        fname = f.get("name", "")
        flabel = f.get("label", fname.replace("_", " ").title())
        if language == "ta" and f.get("label_tamil"):
            flabel = f"{flabel} ({f.get('label_tamil')})"

        # Flexible lookup for value
        val = form_data.get(fname)
        if not val:
            val = form_data.get(fname.lower())
        if not val:
            val = form_data.get(flabel)
        if not val:
            # Check normalized match across form_data keys
            target_norm = norm(fname)
            for k, v in form_data.items():
                if norm(k) == target_norm or norm(k) in target_norm or target_norm in norm(k):
                    val = v
                    break

        val_display = str(val).strip() if val else "[ To be filled manually / விருப்பத்திற்குரியது ]"
        val_color = '#0f172a' if val else '#94a3b8'

        p_label = Paragraph(f"<b>{flabel}</b>", label_style)
        p_val = Paragraph(f"<font color='{val_color}'><b>{val_display}</b></font>", value_style)

        table_rows.append([p_label, p_val])

    fields_table = Table(table_rows, colWidths=[240, 300])
    fields_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e40af')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(fields_table)
    story.append(Spacer(1, 10))

    # 5. Section 2: Supporting Documents
    sup_docs = doc_info.get("supporting_documents", [])
    if sup_docs:
        story.append(Paragraph("SECTION 2: REQUIRED SUPPORTING DOCUMENTS", section_heading))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#93c5fd'), spaceBefore=1, spaceAfter=6))
        doc_rows = []
        for d in sup_docs:
            dname = d.get("name", "Document")
            if language == "ta" and d.get("name_tamil"):
                dname = f"{dname} ({d.get('name_tamil')})"
            ddesc = d.get("description", "Required for verification")
            doc_rows.append([
                Paragraph("[  ]", ParagraphStyle('Chk', parent=styles['Normal'], fontName=FONT_BOLD, fontSize=10, textColor=colors.HexColor('#1e40af'))),
                Paragraph(f"<b>{dname}</b> - {ddesc}", ParagraphStyle('DocItm', parent=styles['Normal'], fontName=FONT_REGULAR, fontSize=8.5, leading=11, textColor=colors.HexColor('#334155')))
            ])
        doc_table = Table(doc_rows, colWidths=[30, 510])
        doc_table.setStyle(TableStyle([
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(doc_table)
        story.append(Spacer(1, 10))

    # 6. Section 3: Declaration & Signature Block
    decl_text = (
        "<b>Declaration:</b> I hereby declare that all particulars furnished above are true, complete, and correct. "
        "The applicant can use this completed sheet for direct submission or as an accurate guide to fill official physical forms."
    )
    story.append(Paragraph(decl_text, ParagraphStyle('Decl', parent=styles['Normal'], fontName=FONT_REGULAR, fontSize=8, leading=10.5, textColor=colors.HexColor('#475569'))))
    story.append(Spacer(1, 8))

    sig_data = [
        [
            Paragraph(f"<b>Applicant Signature:</b> ____________________<br/><br/><b>Submission Date:</b> {date_str.split()[0]}", ParagraphStyle('Sig', parent=styles['Normal'], fontName=FONT_REGULAR, fontSize=8.5, leading=12)),
            Paragraph(
                "<font color='#0d9488'><b>VOICEFIRST AI VERIFIED</b></font><br/>"
                "<font size=7 color='#64748b'>Multimodal Document Engine<br/>Status: AUTHENTICATED</font>",
                ParagraphStyle('Stamp', parent=styles['Normal'], fontName=FONT_BOLD, fontSize=8, leading=10, alignment=TA_CENTER)
            )
        ]
    ]
    sig_table = Table(sig_data, colWidths=[340, 200])
    sig_table.setStyle(TableStyle([
        ('BOX', (1,0), (1,0), 1, colors.HexColor('#0d9488')),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor('#f0fdfa')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(KeepTogether(sig_table))

    doc.build(story)
    logger.info(f"Generated customized application PDF at: {output_path}")
    return output_path

def generate_filled_pdf(
    form_data: Dict[str, Any],
    doc_analysis: Optional[Dict[str, Any]] = None,
    output_filename: Optional[str] = None,
    language: str = "en"
) -> Path:
    """
    Main PDF generation orchestrator.
    - If doc_analysis represents custom uploaded document, generates a document-specific official PDF.
    - If doc_analysis is the official built-in scholarship application, overlays directly onto the AcroForm template.
    """
    if not output_filename:
        output_filename = f"application_{uuid.uuid4().hex[:8]}.pdf"

    output_path = settings.OUTPUT_DIR / output_filename

    # Check if this is the built-in scholarship sample specifically
    is_sample_scholarship = False
    if doc_analysis:
        title = doc_analysis.get("title", "").lower()
        if "scholarship" in title and "post-matric" in title and len(doc_analysis.get("fields", [])) == 9:
            # Check if fields match scholarship schema
            f_names = [f.get("name") for f in doc_analysis.get("fields", [])]
            if "course_name" in f_names and "institution_name" in f_names and "income_annual" in f_names:
                is_sample_scholarship = True

    # If it's a custom uploaded document (like HSBC Bank Application or user uploads):
    if doc_analysis and not is_sample_scholarship:
        return generate_document_specific_pdf(
            output_path=output_path,
            doc_info=doc_analysis,
            form_data=form_data,
            language=language
        )

    # Otherwise, fill the scholarship AcroForm template
    try:
        ensure_template_pdf()
        doc = fitz.open(TEMPLATE_PATH)
        page = doc[0]

        if "declaration_date" not in form_data or not form_data["declaration_date"]:
            form_data["declaration_date"] = datetime.now().strftime("%d/%m/%Y")

        for widget in page.widgets():
            fn = widget.field_name
            if fn in form_data and form_data[fn]:
                val = str(form_data[fn])
                widget.field_value = val
                widget.update()

        field_positions = {
            "full_name": (44, 126),
            "date_of_birth": (304, 126),
            "gender": (449, 126),
            "aadhaar_number": (44, 176),
            "phone_number": (304, 176),
            "income_annual": (44, 226),
            "course_name": (304, 226),
            "institution_name": (44, 276),
            "address": (44, 328),
            "declaration_date": (140, 480)
        }

        for fname, (x, y) in field_positions.items():
            if fname in form_data and form_data[fname]:
                val = str(form_data[fname])
                page.insert_text(
                    fitz.Point(x, y),
                    val,
                    fontsize=10,
                    fontname="helv",
                    color=(0.06, 0.09, 0.16)
                )

        app_id = f"APP-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
        page.insert_text(
            fitz.Point(430, 95),
            f"App No: {app_id}",
            fontsize=9,
            fontname="helv",
            color=(0.12, 0.25, 0.69)
        )

        doc.save(str(output_path))
        doc.close()
        logger.info(f"Generated filled template PDF at: {output_path}")
        return output_path

    except Exception as e:
        logger.error(f"Error filling PDF: {e}. Falling back to custom generator.")
        return generate_document_specific_pdf(
            output_path=output_path,
            doc_info=doc_analysis or DEFAULT_SCHOLARSHIP_ANALYSIS,
            form_data=form_data,
            language=language
        )


async def extract_form_data_with_gemini(
    transcript: str,
    fields_schema: List[Dict[str, Any]],
    language: str = "en"
) -> Dict[str, Any]:
    """
    Extracts structured form fields from the conversation transcript using Gemini Structured Output.
    """
    field_keys = [f["name"] for f in fields_schema] if fields_schema else [
        "full_name", "date_of_birth", "gender", "aadhaar_number",
        "phone_number", "income_annual", "course_name", "institution_name", "address"
    ]

    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return {}

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        prompt = f"""
You are an AI data extractor specialized in extracting application form fields from voice transcripts in English, Tamil, and Tanglish.

Form fields to extract:
{json.dumps(fields_schema, indent=2)}

Full Conversation Transcript:
\"\"\"{transcript}\"\"\"

Analyze the transcript thoroughly. Extract the user's answers corresponding to each field name.
Convert spoken numerals to standard formats if applicable.
If a field was not mentioned or answered yet, leave its value as "".

Return ONLY a valid JSON object where keys are the field names: {json.dumps(field_keys)}.
"""

        response = client.models.generate_content(
            model=settings.GEMINI_EXTRACTION_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )

        extracted_text = response.text.strip()
        if "```json" in extracted_text:
            extracted_text = extracted_text.split("```json")[1].split("```")[0].strip()
        elif "```" in extracted_text:
            extracted_text = extracted_text.split("```")[1].split("```")[0].strip()

        return json.loads(extracted_text)

    except Exception as e:
        logger.error(f"Error in Gemini structured extraction: {e}")
        return {}
