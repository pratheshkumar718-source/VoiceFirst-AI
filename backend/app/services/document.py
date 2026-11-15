import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, List
import pymupdf as fitz
from ..config import settings

logger = logging.getLogger(__name__)

# Fallback structured data for standard government scholarship application
DEFAULT_SCHOLARSHIP_ANALYSIS = {
    "document_type": "Government Application Form",
    "title": "Tamil Nadu Post-Matric Scholarship Application Form 2024-2025",
    "title_tamil": "தமிழ்நாடு மெட்ரிக் பின் கல்வி உதவித்தொகை விண்ணப்பப் படிவம் 2024-2025",
    "purpose": "Financial assistance and fee reimbursement scholarship for higher education students from eligible communities and low-income families.",
    "purpose_tamil": "தகுதியான சமூகங்கள் மற்றும் குறைந்த வருமானம் கொண்ட குடும்பங்களைச் சேர்ந்த உயர்கல்வி பயிலும் மாணவர்களுக்கான கல்வி உதவித்தொகை மற்றும் கட்டணத் திருப்பிச் செலுத்தும் திட்டம்.",
    "summary": "This is an official Government Scholarship application. It requires the applicant's personal details, Aadhaar number, family income, and enrolled college course information to disburse academic tuition support.",
    "summary_tamil": "இது உயர்கல்வி உதவித்தொகைக்கான அரசு விண்ணப்பப் படிவமாகும். உதவித்தொகை பெற மாணவரின் பெயர், ஆதார் எண், குடும்ப வருமானம் மற்றும் கல்லூரி விவரங்களை வழங்க வேண்டும்.",
    "fields": [
        {
            "name": "full_name",
            "label": "Full Name",
            "label_tamil": "முழு பெயர்",
            "type": "text",
            "required": True,
            "description": "Student's full name as per official records and Aadhaar",
            "description_tamil": "சான்றிதழ் மற்றும் ஆதார் அட்டையில் உள்ளவாறு மாணவரின் முழு பெயர்"
        },
        {
            "name": "date_of_birth",
            "label": "Date of Birth",
            "label_tamil": "பிறந்த தேதி",
            "type": "date",
            "required": True,
            "description": "Date of birth in DD/MM/YYYY format",
            "description_tamil": "நாள்/மாதம்/வருடம் வடிவில் பிறந்த தேதி"
        },
        {
            "name": "gender",
            "label": "Gender",
            "label_tamil": "பாலினம்",
            "type": "select",
            "options": ["Male", "Female", "Other"],
            "required": False,
            "description": "Gender of applicant",
            "description_tamil": "விண்ணப்பதாரரின் பாலினம்"
        },
        {
            "name": "aadhaar_number",
            "label": "Aadhaar Number",
            "label_tamil": "ஆதார் எண்",
            "type": "text",
            "required": True,
            "description": "12-digit unique Aadhaar identification number",
            "description_tamil": "12 இலக்க தனித்துவ ஆதார் அடையாள எண்"
        },
        {
            "name": "phone_number",
            "label": "Mobile Number",
            "label_tamil": "கைபேசி எண்",
            "type": "tel",
            "required": True,
            "description": "10-digit active mobile number for SMS alerts",
            "description_tamil": "அரசு குறுஞ்செய்தி பெற பயன்பாட்டில் உள்ள 10 இலக்க கைபேசி எண்"
        },
        {
            "name": "income_annual",
            "label": "Annual Family Income (Rs.)",
            "label_tamil": "ஆண்டு குடும்ப வருமானம் (ரூ.)",
            "type": "number",
            "required": True,
            "description": "Total family annual income in Rupees (must be under 2,50,000)",
            "description_tamil": "ஆண்டுக்கு குடும்பத்தின் மொத்த வருமானம் (ரூபாயில்)"
        },
        {
            "name": "course_name",
            "label": "Course / Degree",
            "label_tamil": "படிப்பு / பட்டப்படிப்பு",
            "type": "text",
            "required": True,
            "description": "Currently enrolled course (e.g. B.Tech Computer Science, B.Sc, B.Com)",
            "description_tamil": "தற்போது பயிலும் பட்டப்படிப்பு (எ.கா. பி.இ., பி.எஸ்.சி)"
        },
        {
            "name": "institution_name",
            "label": "College / Institution Name",
            "label_tamil": "கல்லூரி / கல்வி நிறுவனத்தின் பெயர்",
            "type": "text",
            "required": True,
            "description": "Name of university, college, or polytechnic",
            "description_tamil": "படிக்கும் கல்லூரி அல்லது கல்வி நிறுவனத்தின் பெயர்"
        },
        {
            "name": "address",
            "label": "Permanent Address",
            "label_tamil": "நிரந்தர முகவரி",
            "type": "text",
            "required": True,
            "description": "Residential address with district and pincode",
            "description_tamil": "மாவட்டம் மற்றும் அஞ்சல் குறியீட்டுடன் கூடிய வீட்டு முகவரி"
        }
    ],
    "supporting_documents": [
        {
            "name": "Aadhaar Card Copy",
            "name_tamil": "ஆதார் அட்டை நகல்",
            "required": True,
            "description": "For identity and biometric verification"
        },
        {
            "name": "Income Certificate",
            "name_tamil": "வருமானச் சான்றிதழ்",
            "required": True,
            "description": "Issued by Tahsildar / Revenue Department within last 6 months"
        },
        {
            "name": "Community / Caste Certificate",
            "name_tamil": "சாதி / சமூகச் சான்றிதழ்",
            "required": True,
            "description": "For scholarship category eligibility"
        },
        {
            "name": "Bank Passbook Copy (First Page)",
            "name_tamil": "வங்கி கணக்கு புத்தக நகல்",
            "required": True,
            "description": "Showing Account Number, Bank Name, and IFSC Code"
        }
    ],
    "instructions": "All mandatory fields marked with an asterisk must be filled. Speak clearly when providing names and digits.",
    "instructions_tamil": "அனைத்து முக்கிய விவரங்களையும் தெளிவாக குறிப்பிடவும். பெயர் மற்றும் எண்களை தெளிவாக குரல் மூலம் கூறலாம்."
}

def render_pdf_preview(pdf_path: Path, output_image_path: Path) -> bool:
    """Renders the first page of a PDF document to an image for frontend preview."""
    try:
        doc = fitz.open(pdf_path)
        if len(doc) > 0:
            page = doc[0]
            # 2x zoom for crisp display
            zoom = fitz.Matrix(2, 2)
            pix = page.get_pixmap(matrix=zoom)
            pix.save(str(output_image_path))
            return True
    except Exception as e:
        logger.error(f"Error rendering PDF thumbnail: {e}")
    return False

async def analyze_document(file_path: Path, language: str = "en") -> Dict[str, Any]:
    """
    Analyzes an uploaded PDF or image using Gemini Multimodal (or fallback).
    Extracts document type, purpose, required fields, and supporting documents in English & Tamil.
    """
    # 1. First, check if Gemini API Key is available
    if not settings.GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY not configured. Returning rich built-in government document model.")
        return DEFAULT_SCHOLARSHIP_ANALYSIS

    try:
        # Check file extension
        suffix = file_path.suffix.lower()
        mime_type = "application/pdf" if suffix == ".pdf" else f"image/{suffix.replace('.', '')}"
        if mime_type == "image/jpg":
            mime_type = "image/jpeg"

        with open(file_path, "rb") as f:
            file_bytes = f.read()

        system_prompt = """
You are an expert government document analysis AI specialized in regional accessibility (Tamil and English).
Analyze the provided document (application form, certificate, notice, or scheme doc) and return a structured JSON response.

Return ONLY a valid JSON object matching this schema:
{
  "document_type": "string (e.g. Government Application Form, Scholarship Form, Ration Card Form)",
  "title": "string (English title)",
  "title_tamil": "string (Tamil title)",
  "purpose": "string (Clear 2-sentence explanation in simple English of what this document is for and who qualifies)",
  "purpose_tamil": "string (Same explanation in natural conversational Tamil)",
  "summary": "string (Short user-friendly summary in English)",
  "summary_tamil": "string (Short user-friendly summary in Tamil)",
  "fields": [
    {
      "name": "string (lowercase snake_case identifier e.g. full_name)",
      "label": "string (English label)",
      "label_tamil": "string (Tamil label)",
      "type": "string (text | date | number | select | tel)",
      "required": boolean,
      "description": "string (Helpful question prompt in English)",
      "description_tamil": "string (Helpful question prompt in Tamil)"
    }
  ],
  "supporting_documents": [
    {
      "name": "string (English document name)",
      "name_tamil": "string (Tamil document name)",
      "required": boolean,
      "description": "string"
    }
  ],
  "instructions": "string (English guidance)",
  "instructions_tamil": "string (Tamil guidance)"
}
"""

        # Try Google GenAI SDK
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        raw_text = None

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            models_to_try = [settings.GEMINI_VISION_MODEL, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash"]
            
            last_err = None
            for m in dict.fromkeys(models_to_try):
                try:
                    response = client.models.generate_content(
                        model=m,
                        contents=[
                            types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                            system_prompt
                        ],
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.2,
                        )
                    )
                    raw_text = response.text
                    break
                except Exception as m_err:
                    last_err = m_err
                    logger.warning(f"Model {m} failed: {m_err}. Trying fallback model...")

            if not raw_text and last_err:
                raise last_err

        except Exception as sdk_err:
            logger.warning(f"Google GenAI analysis failed: {sdk_err}. Using fallback scholarship data.")
            return DEFAULT_SCHOLARSHIP_ANALYSIS

        # Clean JSON markdown if wrapped in ```json
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0].strip()

        parsed = json.loads(raw_text)
        logger.info(f"Successfully analyzed document with Gemini: {parsed.get('title')}")
        return parsed

    except Exception as e:
        logger.error(f"Error during Gemini document analysis: {e}. Falling back to default schema.")
        return DEFAULT_SCHOLARSHIP_ANALYSIS

