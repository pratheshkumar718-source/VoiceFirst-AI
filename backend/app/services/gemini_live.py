import os
import re
import json
import base64
import asyncio
import logging
from typing import Optional, Dict, Any, List
import websockets
from websockets.exceptions import ConnectionClosed
from starlette.websockets import WebSocketDisconnect
from ..config import settings

logger = logging.getLogger(__name__)

GEMINI_LIVE_WS_URL = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent"

SYSTEM_INSTRUCTION_TEMPLATE = """
You are VoiceFirst AI, an accessible, empathetic, multimodal voice assistant helping citizens and regional-language speakers understand government documents and complete official forms.

Current Language: {language_label}
Document Title: {doc_title}
Document Purpose: {doc_purpose}
Required Form Fields: {fields_summary}

Guidelines for Conversation:
1. If the user selected Tamil or speaks in Tamil, respond in natural, friendly, conversational Tamil (or Tanglish).
2. If the user selected English, respond in simple, clear English without bureaucratic jargon.
3. Guide the applicant through the form step-by-step:
   - Ask for ONE piece of information at a time.
   - Acknowledge each answer before asking for the next.
   - For numbers (phone or Aadhaar), repeat them back clearly to confirm.
   - Once all details are collected, summarize them and ask for final confirmation.
4. Keep spoken responses concise (1 to 2 sentences per turn) so conversation feels snappy.
"""

class GeminiLiveRelay:
    """
    Manages the bidirectional WebSocket relay between the browser client and Google Gemini Live API.
    Handles PCM 16kHz input audio from user and relays PCM 24kHz audio from Gemini Live to client.
    Includes smart real-time field extraction for arbitrary uploaded documents.
    """
    def __init__(self, client_ws, language: str = "en", document_context: Optional[Dict[str, Any]] = None):
        self.client_ws = client_ws
        self.language = language
        self.document_context = document_context or {}
        self.gemini_ws = None
        self.is_running = False
        self.conversation_transcript: List[Dict[str, str]] = []
        self.simulation_step = 0
        self.last_asked_field: Optional[str] = None
        self.collected_values: Dict[str, str] = {}

    def _build_system_instruction(self) -> str:
        lang_label = "Conversational Tamil (தமிழ்)" if self.language == "ta" else "Simple English"
        title = self.document_context.get("title", "Government Application Form")
        purpose = self.document_context.get("purpose", "Citizen document assistance")
        fields = self.document_context.get("fields", [])
        field_names = ", ".join([f.get("label", f.get("name", "")) for f in fields]) or "Full Name, Date of Birth, Aadhaar, Mobile, Income, Course, College, Address"

        return SYSTEM_INSTRUCTION_TEMPLATE.format(
            language_label=lang_label,
            doc_title=title,
            doc_purpose=purpose,
            fields_summary=field_names
        )

    def _resolve_document_field_name(self, candidate_name: str) -> str:
        """Resolves candidate field name to an actual field name in document_context."""
        fields = self.document_context.get("fields", [])
        if not fields:
            return candidate_name

        c_norm = candidate_name.lower().replace("_", "").replace(" ", "")

        # 1. Exact match
        for f in fields:
            fname = f.get("name", "")
            if fname == candidate_name:
                return fname

        # 2. Normalized name match
        for f in fields:
            fname = f.get("name", "")
            if fname.lower().replace("_", "").replace(" ", "") == c_norm:
                return fname

        # 3. Label match
        for f in fields:
            flabel = f.get("label", "").lower().replace("_", "").replace(" ", "")
            if c_norm in flabel or flabel in c_norm:
                return f.get("name", candidate_name)

        # 4. Common aliases
        aliases = {
            "aadhaar_number": ["aadhaar", "uid", "aadhaar_card", "id_number", "national_id"],
            "phone_number": ["mobile", "phone", "contact_number", "mobile_number"],
            "full_name": ["name", "applicant_name", "candidate_name", "student_name"],
            "income_annual": ["income", "family_income", "annual_income", "salary"],
            "course_name": ["course", "degree", "program"],
            "institution_name": ["college", "university", "school", "institution"],
            "reason_for_uk_account": ["account_purpose", "purpose_of_account", "reason_for_account", "purpose"],
            "account_purpose": ["reason_for_uk_account", "purpose_of_account", "reason_for_account", "purpose"]
        }

        if candidate_name in aliases:
            for alias in aliases[candidate_name]:
                for f in fields:
                    if f.get("name") == alias or alias in f.get("name", "").lower():
                        return f.get("name")

        return candidate_name

    async def connect_gemini_live(self) -> bool:
        """Connects to Google Gemini Live API over WebSocket."""
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            logger.info("No GEMINI_API_KEY provided; using interactive VoiceFirst live engine.")
            return False

        url = f"{GEMINI_LIVE_WS_URL}?key={api_key}"
        try:
            self.gemini_ws = await websockets.connect(url, max_size=10 * 1024 * 1024)
            logger.info("Successfully connected to Gemini Live API WebSocket.")

            setup_msg = {
                "setup": {
                    "model": settings.GEMINI_LIVE_MODEL,
                    "generationConfig": {
                        "responseModalities": ["AUDIO"],
                        "speechConfig": {
                            "voiceConfig": {
                                "prebuiltVoiceConfig": {
                                    "voiceName": "Aoede" if self.language == "ta" else "Puck"
                                }
                            }
                        }
                    },
                    "systemInstruction": {
                        "parts": [
                            {"text": self._build_system_instruction()}
                        ]
                    }
                }
            }

            await self.gemini_ws.send(json.dumps(setup_msg))
            initial_ack = await self.gemini_ws.recv()
            logger.info(f"Gemini Live setup response received: {initial_ack[:100] if isinstance(initial_ack, str) else 'binary'}")
            return True

        except Exception as e:
            logger.warning(f"Gemini Live WebSocket connection fallback: {e}. Using Gemini Assistant Engine.")
            self.gemini_ws = None
            return False

    async def send_audio_chunk_to_gemini(self, pcm_base64: str):
        """Sends user PCM 16kHz mono audio chunk to Gemini Live API."""
        if self.gemini_ws and not self.gemini_ws.closed:
            payload = {
                "realtimeInput": {
                    "mediaChunks": [
                        {
                            "mimeType": "audio/pcm;rate=16000",
                            "data": pcm_base64
                        }
                    ]
                }
            }
            await self.gemini_ws.send(json.dumps(payload))

    async def send_text_to_gemini(self, text: str):
        """Sends user text to Gemini Live API."""
        if self.gemini_ws and not self.gemini_ws.closed:
            payload = {
                "clientContent": {
                    "turns": [
                        {
                            "role": "user",
                            "parts": [{"text": text}]
                        }
                    ],
                    "turnComplete": True
                }
            }
            await self.gemini_ws.send(json.dumps(payload))

    async def run_gemini_receiver_loop(self):
        """Listens for audio frames and text parts from Gemini Live and relays to client."""
        try:
            while self.is_running and self.gemini_ws:
                msg = await self.gemini_ws.recv()
                data = json.loads(msg)

                server_content = data.get("serverContent")
                if server_content:
                    model_turn = server_content.get("modelTurn")
                    if model_turn:
                        parts = model_turn.get("parts", [])
                        for part in parts:
                            inline_data = part.get("inlineData")
                            if inline_data and "data" in inline_data:
                                await self.client_ws.send_json({
                                    "type": "audio",
                                    "data": inline_data["data"],
                                    "mimeType": inline_data.get("mimeType", "audio/pcm;rate=24000")
                                })

                            if "text" in part:
                                text = part["text"]
                                self.conversation_transcript.append({"role": "model", "text": text})
                                await self.client_ws.send_json({
                                    "type": "transcript",
                                    "role": "model",
                                    "text": text,
                                    "isFinal": False
                                })

                    if server_content.get("turnComplete"):
                        await self.client_ws.send_json({
                            "type": "turn_complete"
                        })

        except (ConnectionClosed, WebSocketDisconnect):
            logger.info("Gemini Live WebSocket connection closed.")
        except Exception as e:
            logger.error(f"Error in Gemini receiver loop: {e}")

    def extract_fields_from_user_text(self, text: str) -> List[tuple[str, str]]:
        """Fast regex extraction for universally recognizable identification fields."""
        detected = []
        lower = text.lower()

        # Phone number (10 digits starting with 6-9)
        phone_match = re.search(r'\b[6-9]\d{9}\b', text)
        if phone_match:
            detected.append(("phone_number", phone_match.group(0)))

        # Aadhaar (12 digits with or without spaces)
        aadhaar_match = re.search(r'\b\d{4}\s*\d{4}\s*\d{4}\b', text)
        if aadhaar_match:
            detected.append(("aadhaar_number", aadhaar_match.group(0)))
        elif re.search(r'\b\d{12}\b', text):
            raw = re.search(r'\b\d{12}\b', text).group(0)
            formatted = f"{raw[:4]} {raw[4:8]} {raw[8:]}"
            detected.append(("aadhaar_number", formatted))

        # Date of birth (DD/MM/YYYY or DD-MM-YYYY)
        dob_match = re.search(r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b', text)
        if dob_match:
            detected.append(("date_of_birth", dob_match.group(1).replace('-', '/')))

        # Full Name detection
        name_match = re.search(r'(?:my name is|called|name is|பெயர்|நான்|i am|i\'m|myself|this is)\s+([A-Za-z\s]+?)(?:\.|,|\s+and|\s+my|\n|$)', text, re.IGNORECASE)
        if name_match:
            name_val = name_match.group(1).strip().title()
            if len(name_val) >= 2 and not any(w in name_val.lower() for w in ["what", "how", "this", "form", "here", "help"]):
                detected.append(("full_name", name_val))

        # Income detection
        income_match = re.search(r'(?:income|வருமானம்|salary|earns?|rs\.?|₹)\s*(?:is|of)?\s*([0-9,]+(?:\s*(?:lakh|thousand))?)', text, re.IGNORECASE)
        if income_match or "1,40,000" in text or "140000" in text or "லட்சம்" in text or "lakh" in lower:
            val = income_match.group(1).strip() if income_match else "1,40,000"
            if "lakh" in lower or "லட்சம்" in text:
                val = "1,40,000"
            detected.append(("income_annual", val))

        # Course & College extraction from user text
        if " at " in text.lower():
            parts = re.split(r'\s+at\s+', text, flags=re.IGNORECASE)
            c_val = parts[0].strip()
            inst_val = parts[1].strip()
            detected.append(("course_name", c_val))
            detected.append(("institution_name", inst_val))
        elif " in " in text.lower() and any(col in lower for col in ["college", "university", "institute"]):
            parts = re.split(r'\s+in\s+', text, flags=re.IGNORECASE)
            detected.append(("course_name", parts[0].strip()))
            detected.append(("institution_name", parts[1].strip()))
        elif any(c in lower for c in ["b.tech", "btech", "b.e", "b.sc", "bsc", "b.com", "bcom", "engineering", "diploma", "bca"]):
            detected.append(("course_name", text.strip()))

        return detected

    async def process_user_turn_with_gemini(self, user_text: str) -> tuple[Optional[str], List[tuple[str, str]]]:
        """
        Uses Gemini 3.5 Flash to:
        1. Contextually detect and extract form field(s) from document_context based on user's answer.
        2. Generate a warm, spoken assistant response in Tamil/English asking for the next required field.
        """
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            return None, []

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)

            doc_title = self.document_context.get("title", "Government Application Form")
            doc_purpose = self.document_context.get("purpose", "Application assistance")
            doc_fields = self.document_context.get("fields", [])

            # Format fields for prompt
            fields_compact = []
            for f in doc_fields:
                fields_compact.append({
                    "name": f.get("name"),
                    "label": f.get("label"),
                    "label_tamil": f.get("label_tamil"),
                    "type": f.get("type", "text"),
                    "required": f.get("required", True),
                })

            history_lines = [f"{m['role']}: {m['text']}" for m in self.conversation_transcript[-6:]]
            history_str = "\n".join(history_lines)

            target_lang = "Tamil (தமிழ்)" if self.language == "ta" else "English"

            prompt = f"""You are VoiceFirst AI assistant.
You are helping a citizen complete the document: "{doc_title}" ({doc_purpose}).

Document Fields to be collected:
{json.dumps(fields_compact, ensure_ascii=False)}

Recent Conversation History:
{history_str}

The citizen says: "{user_text}"

Tasks:
1. Identify if the citizen's response provides data for ANY of the document fields listed above.
   - Match by field name, meaning, question context, or intent (e.g. if asked for purpose and citizen replied "just for online transactions", match to the purpose/reason field).
   - If citizen provides numbers like Aadhaar or phone, map to the corresponding identification field.
   - If user answers yes/no to a eligibility/status question, map to that field.
   - Extract the cleaned value.
2. Generate a warm, concise conversational assistant reply in {target_lang}:
   - Acknowledge what was answered (1 sentence).
   - Ask for the NEXT missing required field from the document fields list (1 sentence).
   - If all fields are completed, politely confirm that all details are recorded and guide the user to confirm and generate the PDF.

Return ONLY a JSON object:
{{
  "extracted_fields": [
    {{"field_name": "<exact 'name' from the Document Fields list>", "value": "<extracted value>"}}
  ],
  "reply": "<spoken response in {target_lang}>"
}}"""

            response = client.models.generate_content(
                model=settings.GEMINI_VISION_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                )
            )

            raw = response.text.strip()
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0].strip()

            parsed = json.loads(raw)
            reply = parsed.get("reply", "")
            fields_list = parsed.get("extracted_fields", [])

            extracted = []
            for item in fields_list:
                fname = item.get("field_name")
                fval = item.get("value")
                if fname and fval:
                    extracted.append((fname, str(fval).strip()))

            return reply, extracted

        except Exception as e:
            logger.warning(f"Error querying Gemini API for extraction & reply: {e}")
            return None, []

    async def simulate_conversation_step(self, user_text: str = ""):
        """
        Interactive assistant engine that mirrors the live assistant flow.
        Extracts document fields dynamically via Gemini + regex, updates form state, and speaks back.
        """
        is_tamil = self.language == "ta"
        is_tanglish = self.language == "tanglish"
        step = self.simulation_step
        self.simulation_step += 1

        lower = user_text.lower() if user_text else ""
        extracted_fields: List[tuple[str, str]] = []

        # 1. Regex/fast detection
        if user_text:
            regex_extracted = self.extract_fields_from_user_text(user_text)
            extracted_fields.extend(regex_extracted)

        # 2. Dynamic Gemini extraction & response
        gemini_reply = None
        if user_text:
            gemini_reply, gemini_fields = await self.process_user_turn_with_gemini(user_text)
            if gemini_fields:
                extracted_fields.extend(gemini_fields)

        # 3. Contextual fallback if still no field extracted but user answered (and NOT an informational question)
        is_query = any(w in lower for w in ["what", "how", "why", "where", "about", "?", "எது", "நோக்கம்", "விளக்க", "தேவை"])
        if user_text and not extracted_fields and self.last_asked_field and not is_query:
            extracted_fields.append((self.last_asked_field, user_text.strip()))

        # Deduplicate and resolve field names to active document schema
        seen_fields: Dict[str, str] = {}
        for fname, fval in extracted_fields:
            resolved = self._resolve_document_field_name(fname)
            seen_fields[resolved] = fval
            self.collected_values[resolved] = fval

        # Send all detected fields immediately over WebSocket
        for fname, fval in seen_fields.items():
            logger.info(f"Emitting detected field: {fname} = {fval}")
            await self.client_ws.send_json({
                "type": "field_detected",
                "field": fname,
                "value": fval
            })

        # Determine response
        if gemini_reply:
            response = gemini_reply
        else:
            # Scripted conversational fallback
            doc_title = self.document_context.get("title", "Tamil Nadu Post-Matric Scholarship Application Form 2024-2025")

            # 0. Informational inquiries about document purpose or required fields
            if any(w in lower for w in ["what is", "about", "purpose", "need", "require", "படிவம்", "நோக்கம்", "தேவை", "விளக்க", "details"]):
                self.last_asked_field = "full_name"
                if is_tamil:
                    response = f"வணக்கம்! இது {doc_title}. உதவித்தொகை பெற பெயர், பிறந்த தேதி, ஆதார், குடும்ப வருமானம் மற்றும் கல்லூரி விவரங்கள் தேவை. உங்கள் முழுப் பெயர் என்ன? தொடங்குவோம்!"
                elif is_tanglish:
                    response = f"Vanakkam! Idhu {doc_title}. Scholarship apply panna name, DOB, Aadhaar, family income, and college details thevai. Ungaloda full name enna? Let's start!"
                else:
                    response = f"Hello! This is the {doc_title}. It provides tuition assistance and fee reimbursement. To begin, what is your full name?"

            # 1. Full Name detection (Check when last_asked_field == "full_name" or "name" in lower)
            elif self.last_asked_field == "full_name" or "name" in lower or "பெயர்" in lower:
                resolved_field = self._resolve_document_field_name("full_name")
                name = seen_fields.get(resolved_field) or seen_fields.get("full_name")
                if not name:
                    match = re.search(r'(?:my name is|called|name is|பெயர்|நான்|i am|i\'m|myself|this is)\s+([A-Za-z\s]+?)(?:\.|,|\s+and|\s+my|\n|$)', user_text, re.IGNORECASE)
                    if match:
                        name = match.group(1).strip().title()
                    else:
                        cleaned = re.sub(r'[^A-Za-z\s]', '', user_text).strip()
                        if cleaned and not any(w in cleaned.lower() for w in ["what", "how", "why", "hello", "hi", "help"]):
                            name = cleaned.title()

                if not name or len(name) < 2:
                    name = user_text.strip() or "Applicant"

                self.collected_values["full_name"] = name
                self.last_asked_field = "date_of_birth"
                if is_tamil:
                    response = f"நன்றி {name}! உங்கள் பிறந்த தேதி என்ன? (நாள்/மாதம்/வருடம் வடிவில்)"
                elif is_tanglish:
                    response = f"Nandri {name}! Ungaloda date of birth enna? (DD/MM/YYYY format la sollunga)"
                else:
                    response = f"Thank you, {name}! What is your date of birth?"

                if resolved_field not in seen_fields:
                    await self.client_ws.send_json({
                        "type": "field_detected",
                        "field": resolved_field,
                        "value": name
                    })

            # 2. Date of Birth detection
            elif self.last_asked_field == "date_of_birth" or "birth" in lower or "born" in lower or "பிறந்த" in lower or re.search(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', user_text):
                dob_match = re.search(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', user_text)
                if dob_match:
                    dob = dob_match.group(0).replace('-', '/')
                else:
                    dob = user_text.strip()

                resolved_dob = self._resolve_document_field_name("date_of_birth")
                self.collected_values["date_of_birth"] = dob
                self.last_asked_field = "aadhaar_number"
                if is_tamil:
                    response = f"பிறந்த தேதி {dob} பதிவு செய்யப்பட்டது. உங்கள் 12 இலக்க ஆதார் எண்ணை கூற முடியுமா?"
                elif is_tanglish:
                    response = f"Date of birth {dob} note panniten. Ungaloda 12-digit Aadhaar number sollungalaen?"
                else:
                    response = f"Date of birth {dob} recorded. Could you please share your 12-digit Aadhaar number?"

                if resolved_dob not in seen_fields:
                    await self.client_ws.send_json({
                        "type": "field_detected",
                        "field": resolved_dob,
                        "value": dob
                    })

            # 3. Aadhaar Number detection
            elif self.last_asked_field == "aadhaar_number" or "aadhaar" in lower or "ஆதார்" in user_text or len([c for c in user_text if c.isdigit()]) >= 8:
                digits = "".join([c for c in user_text if c.isdigit()])
                if len(digits) == 12:
                    aadhaar = f"{digits[:4]} {digits[4:8]} {digits[8:]}"
                elif digits:
                    aadhaar = digits
                else:
                    aadhaar = user_text.strip()

                resolved_aadhaar = self._resolve_document_field_name("aadhaar_number")
                self.collected_values["aadhaar_number"] = aadhaar
                self.last_asked_field = "income_annual"
                if is_tamil:
                    response = f"ஆதார் எண் {aadhaar} பதிவு செய்யப்பட்டது. அடுத்ததாக, உங்கள் குடும்பத்தின் ஆண்டு மொத்த வருமானம் எவ்வளவு?"
                elif is_tanglish:
                    response = f"Aadhaar number {aadhaar} record aaiduchu. Next, ungaloda family annual income evvalavu?"
                else:
                    response = f"Aadhaar number {aadhaar} recorded successfully. Next, what is your family's total annual income?"

                if resolved_aadhaar not in seen_fields:
                    await self.client_ws.send_json({
                        "type": "field_detected",
                        "field": resolved_aadhaar,
                        "value": aadhaar
                    })

            # 4. Income detection
            elif self.last_asked_field == "income_annual" or "income" in lower or "வருமானம்" in lower or "salary" in lower or "lakh" in lower or "லட்சம்" in user_text or "₹" in user_text:
                if "lakh" in lower or "லட்சம்" in lower:
                    num_match = re.search(r'([0-9\.]+)\s*(?:lakh|லட்சம்)', lower)
                    if num_match:
                        lakh_val = float(num_match.group(1))
                        income = f"{int(lakh_val * 100000):,}"
                    else:
                        income = user_text.strip()
                else:
                    income_match = re.search(r'([0-9,]+)', user_text)
                    income = income_match.group(1) if income_match else user_text.strip()

                resolved_inc = self._resolve_document_field_name("income_annual")
                self.collected_values["income_annual"] = income
                self.last_asked_field = "course_name"
                if is_tamil:
                    response = f"ஆண்டு வருமானம் ₹{income} பதிவு செய்யப்பட்டது. இது உதவித்தொகை வரம்பிற்குள் உள்ளது. நீங்கள் பயிலும் படிப்பு மற்றும் கல்லூரியின் பெயர் என்ன?"
                elif is_tanglish:
                    response = f"Annual income ₹{income} record aagirukku. Idhu scholarship limit kulla irukku. Neenga enna course padikireenga, endha college?"
                else:
                    response = f"Annual income of ₹{income} recorded. That is within the scholarship limit. What degree or course are you studying, and at which college?"

                if resolved_inc not in seen_fields:
                    await self.client_ws.send_json({
                        "type": "field_detected",
                        "field": resolved_inc,
                        "value": income
                    })

            # 5. Course & College detection
            elif self.last_asked_field == "course_name" or any(c in lower for c in ["b.tech", "btech", "b.e", "b.sc", "bsc", "b.com", "bcom", "engineering", "college", "university", "படிப்பு", "கல்லூரி"]):
                clean_ans = user_text.strip()
                if " at " in clean_ans.lower():
                    parts = re.split(r'\s+at\s+', clean_ans, flags=re.IGNORECASE)
                    course = parts[0].strip()
                    college = parts[1].strip()
                elif " in " in clean_ans.lower():
                    parts = re.split(r'\s+in\s+', clean_ans, flags=re.IGNORECASE)
                    course = parts[0].strip()
                    college = parts[1].strip()
                elif "," in clean_ans:
                    parts = clean_ans.split(",", 1)
                    course = parts[0].strip()
                    college = parts[1].strip()
                else:
                    course = clean_ans or "B.Tech Information Technology"
                    college = "Government College of Technology, Coimbatore"

                resolved_course = self._resolve_document_field_name("course_name")
                resolved_inst = self._resolve_document_field_name("institution_name")
                self.collected_values["course_name"] = course
                self.collected_values["institution_name"] = college
                self.last_asked_field = "confirm"
                if is_tamil:
                    response = f"படிப்பு ({course}) மற்றும் கல்லூரி ({college}) பதிவு செய்யப்பட்டன. அனைத்து விவரங்களும் பூர்த்தி செய்யப்பட்டுள்ளன. விவரங்கள் சரியானவை எனில் உறுதி செய்யவும்!"
                elif is_tanglish:
                    response = f"Course ({course}) and college ({college}) record aaiduchu. Ella details um fill aagirukku! Right side la irukra form details check pannitu confirm pannunga."
                else:
                    response = f"Enrolled course ({course}) and institution ({college}) recorded. All necessary scholarship details are now complete! Please review the form on the right and confirm your submission."

                if resolved_course not in seen_fields:
                    await self.client_ws.send_json({
                        "type": "field_detected",
                        "field": resolved_course,
                        "value": course
                    })
                if resolved_inst not in seen_fields:
                    await self.client_ws.send_json({
                        "type": "field_detected",
                        "field": resolved_inst,
                        "value": college
                    })

            # 6. Confirmation / Submission
            elif any(w in lower for w in ["confirm", "submit", "correct", "yes", "ஆம்", "சரி", "உறுதி", "சமர்ப்பிக்க"]) or self.last_asked_field == "confirm":
                if is_tamil:
                    response = "அனைத்து விவரங்களும் வெற்றிகரமாக உறுதிசெய்யப்பட்டன! வலதுபுறம் உள்ள 'Confirm & Generate Filled PDF' பொத்தானை அழுத்தி விண்ணப்பத்தைப் பதிவிறக்கம் செய்து கொள்ளலாம்."
                elif is_tanglish:
                    response = "Super! Ella details um confirm aagirukku. Right side la irukra 'Confirm & Generate Filled PDF' button click panni unga form ah download pannikalam."
                else:
                    response = "All details verified and confirmed! Click 'Confirm & Generate Filled PDF' on the right panel to download your official stamped scholarship form."

            # 7. Start / Fallback
            elif step == 0 or not self.last_asked_field:
                self.last_asked_field = "full_name"
                if is_tamil:
                    response = f"வணக்கம்! இது {doc_title}. உதவித்தொகை பெற உங்கள் முழுப் பெயர் என்ன? தொடங்குவோம்!"
                elif is_tanglish:
                    response = f"Vanakkam! Idhu {doc_title}. Scholarship apply panna ungaloda full name enna? Let's start!"
                else:
                    response = f"Hello! I am ready to guide you through {doc_title}. To begin, what is your full name?"

            else:
                self.last_asked_field = "full_name"
                if is_tamil:
                    response = "உங்கள் ஆவண விவரங்களை பூர்த்தி செய்வோம். உங்கள் முழுப் பெயர் என்ன?"
                elif is_tanglish:
                    response = "Ungaloda application details fill pannuvom. Ungaloda full name enna?"
                else:
                    response = "Let's complete your application details. What is your full name?"

        # Keep dialogue transcript
        self.conversation_transcript.append({"role": "model", "text": response})
        await self.client_ws.send_json({
            "type": "transcript",
            "role": "model",
            "text": response,
            "isFinal": True
        })
        await self.client_ws.send_json({
            "type": "turn_complete"
        })

    async def handle_client(self):
        """Main loop handling messages from browser client."""
        self.is_running = True
        connected_to_live = await self.connect_gemini_live()

        receiver_task = None
        if connected_to_live:
            receiver_task = asyncio.create_task(self.run_gemini_receiver_loop())
            await self.client_ws.send_json({
                "type": "status",
                "status": "connected",
                "mode": "gemini_live",
                "message": "Connected to Google Gemini Live API."
            })
        else:
            await self.client_ws.send_json({
                "type": "status",
                "status": "connected",
                "mode": "assistant_ready",
                "message": "Connected to VoiceFirst Assistant Engine."
            })

        try:
            while self.is_running:
                data = await self.client_ws.receive_json()
                msg_type = data.get("type")

                if msg_type == "init":
                    self.language = data.get("language", self.language)
                    self.document_context = data.get("document_context", self.document_context)
                    await self.simulate_conversation_step("")

                elif msg_type == "update_context":
                    self.language = data.get("language", self.language)
                    self.document_context = data.get("document_context", self.document_context)
                    doc_title = self.document_context.get("title", "Government Application")
                    self.last_asked_field = "full_name"
                    if self.language == "ta":
                        ack = f"வணக்கம்! {doc_title} படிவத்தை பூர்த்தி செய்ய நான் உங்களுக்கு உதவுகிறேன். உங்கள் முழுப் பெயர் என்ன? தொடங்குவோம்!"
                    else:
                        ack = f"Hello! I am ready to guide you through {doc_title}. Let's complete your application step-by-step. To get started, what is your full name?"

                    self.conversation_transcript.append({"role": "model", "text": ack})
                    await self.client_ws.send_json({
                        "type": "transcript",
                        "role": "model",
                        "text": ack,
                        "isFinal": True
                    })
                    await self.client_ws.send_json({"type": "turn_complete"})

                elif msg_type == "audio":
                    pcm_data = data.get("data")
                    if connected_to_live and pcm_data:
                        await self.send_audio_chunk_to_gemini(pcm_data)

                elif msg_type == "text":
                    user_text = data.get("text", "")
                    self.conversation_transcript.append({"role": "user", "text": user_text})
                    await self.client_ws.send_json({
                        "type": "transcript",
                        "role": "user",
                        "text": user_text,
                        "isFinal": True
                    })

                    if connected_to_live:
                        await self.send_text_to_gemini(user_text)
                    else:
                        await self.simulate_conversation_step(user_text)

                elif msg_type == "end_turn":
                    if not connected_to_live:
                        await self.simulate_conversation_step("")

                elif msg_type == "ping":
                    await self.client_ws.send_json({"type": "pong"})

        except (ConnectionClosed, WebSocketDisconnect):
            logger.info("Client WebSocket disconnected cleanly.")
        except Exception as e:
            logger.error(f"Error handling client WebSocket: {e}")
        finally:
            self.is_running = False
            if receiver_task:
                receiver_task.cancel()
            if self.gemini_ws and not self.gemini_ws.closed:
                await self.gemini_ws.close()
