import os
import re
import uuid
import json
import logging
import shutil
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, WebSocket, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from .config import settings
from .supabase_client import storage_manager
from .services.document import analyze_document, render_pdf_preview, DEFAULT_SCHOLARSHIP_ANALYSIS
from .services.form_filler import generate_filled_pdf, extract_form_data_with_gemini, ensure_template_pdf, TEMPLATE_PATH
from .services.gemini_live import GeminiLiveRelay

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("voicefirst")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multimodal Voice-First AI Assistant for Government Documents & Accessible Form Filling"
)

# CORS Middleware (Configured per security requirements)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads and generated PDFs for static access
app.mount("/static/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
app.mount("/static/generated", StaticFiles(directory=str(settings.OUTPUT_DIR)), name="generated")

# Ensure template exists on startup
@app.on_event("startup")
async def startup_event():
    ensure_template_pdf()
    logger.info("VoiceFirst AI backend initialized successfully.")

@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "gemini_live_configured": bool(settings.GEMINI_API_KEY),
        "supabase_configured": storage_manager.is_supabase_active
    }

class ExtractRequest(BaseModel):
    transcript: str
    fields_schema: Optional[List[Dict[str, Any]]] = None
    language: Optional[str] = "en"

class GeneratePdfRequest(BaseModel):
    form_data: Dict[str, Any]
    session_id: Optional[str] = None
    language: Optional[str] = "en"
    document_analysis: Optional[Dict[str, Any]] = None

@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...), language: str = Form("en")):
    """
    Accepts PDF, JPG, PNG files (up to 5MB).
    Saves document, creates preview thumbnail, and runs Gemini Multimodal Analysis.
    """
    # 1. Validation
    filename = file.filename or "uploaded_document.pdf"
    suffix = Path(filename).suffix.lower()
    if suffix not in [".pdf", ".jpg", ".jpeg", ".png"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, JPG, and PNG are supported.")

    file_id = uuid.uuid4().hex[:10]
    saved_filename = f"{file_id}_{filename}"
    saved_path = settings.UPLOAD_DIR / saved_filename

    # Read and check size limit (5MB)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed size of 5MB.")

    with open(saved_path, "wb") as f:
        f.write(content)

    # 2. Generate thumbnail preview if PDF
    thumbnail_filename = f"{file_id}_thumb.png"
    thumbnail_path = settings.UPLOAD_DIR / thumbnail_filename
    preview_url = f"/api/documents/file/{saved_filename}"

    if suffix == ".pdf":
        success = render_pdf_preview(saved_path, thumbnail_path)
        if success:
            preview_url = f"/api/documents/file/{thumbnail_filename}"
    else:
        preview_url = f"/api/documents/file/{saved_filename}"

    # 3. Upload to Supabase Storage if configured
    public_doc_url = await storage_manager.upload_document(saved_path, saved_filename)

    # 4. Multimodal Document Analysis via Gemini
    analysis = await analyze_document(saved_path, language=language)

    # 5. Persist Session
    session_data = {
        "doc_id": file_id,
        "filename": filename,
        "saved_path": str(saved_path),
        "preview_url": preview_url,
        "public_url": public_doc_url,
        "analysis": analysis,
        "language": language
    }
    await storage_manager.save_session(file_id, session_data)

    return {
        "success": True,
        "doc_id": file_id,
        "filename": filename,
        "preview_url": preview_url,
        "analysis": analysis
    }

@app.post("/api/documents/sample")
async def load_sample_document(language: str = Form("en")):
    """
    Loads pre-bundled official Tamil Nadu Post-Matric Scholarship form for instant demo.
    """
    ensure_template_pdf()
    file_id = "sample_scholarship"
    sample_pdf = settings.UPLOAD_DIR / "sample_scholarship_form.pdf"
    
    if not sample_pdf.exists():
        shutil.copy(TEMPLATE_PATH, sample_pdf)

    thumbnail_filename = "sample_scholarship_thumb.png"
    thumbnail_path = settings.UPLOAD_DIR / thumbnail_filename
    render_pdf_preview(sample_pdf, thumbnail_path)

    preview_url = f"/api/documents/file/{thumbnail_filename}"
    analysis = DEFAULT_SCHOLARSHIP_ANALYSIS

    session_data = {
        "doc_id": file_id,
        "filename": "Tamil_Nadu_Scholarship_Application.pdf",
        "saved_path": str(sample_pdf),
        "preview_url": preview_url,
        "public_url": f"/api/documents/file/sample_scholarship_form.pdf",
        "analysis": analysis,
        "language": language
    }
    await storage_manager.save_session(file_id, session_data)

    return {
        "success": True,
        "doc_id": file_id,
        "filename": "Tamil_Nadu_Scholarship_Application.pdf",
        "preview_url": preview_url,
        "analysis": analysis
    }

@app.get("/api/documents/file/{filename}")
async def get_document_file(filename: str):
    file_path = settings.UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    content_type = "application/pdf" if filename.endswith(".pdf") else "image/png"
    return FileResponse(file_path, media_type=content_type)

@app.post("/api/forms/extract")
async def extract_form_fields(req: ExtractRequest):
    """
    Takes voice conversation transcript and document schema;
    Uses Gemini Structured Output to extract exact form field key-value pairs.
    """
    fields_schema = req.fields_schema or DEFAULT_SCHOLARSHIP_ANALYSIS["fields"]
    extracted_data = await extract_form_data_with_gemini(
        transcript=req.transcript,
        fields_schema=fields_schema,
        language=req.language or "en"
    )
    return {
        "success": True,
        "form_data": extracted_data
    }

@app.post("/api/forms/generate-pdf")
async def generate_pdf_endpoint(req: GeneratePdfRequest):
    """
    Fills out and creates an official PDF tailored to the specific uploaded document.
    Uses PyMuPDF / ReportLab to guarantee all user details fit perfectly into form boxes.
    """
    try:
        session_id = req.session_id or uuid.uuid4().hex[:8]
        session = await storage_manager.get_session(session_id) or {}

        # Merge document analysis from request or stored session
        analysis = req.document_analysis or session.get("analysis") or DEFAULT_SCHOLARSHIP_ANALYSIS

        # Dynamic filename based on document title
        raw_title = analysis.get("title", "Application")
        clean_title = re.sub(r'[^a-zA-Z0-9]', '_', raw_title).strip('_')[:35] or "Application"
        filename = f"{clean_title}_{session_id}.pdf"

        output_path = generate_filled_pdf(
            form_data=req.form_data,
            doc_analysis=analysis,
            output_filename=filename,
            language=req.language or "en"
        )

        download_url = await storage_manager.upload_pdf(output_path, filename)

        # Update session
        session["form_data"] = req.form_data
        session["pdf_filename"] = filename
        session["pdf_url"] = download_url
        session["completed"] = True
        await storage_manager.save_session(session_id, session)

        return {
            "success": True,
            "filename": filename,
            "download_url": download_url,
            "session_id": session_id
        }
    except Exception as e:
        logger.error(f"Error generating PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/forms/download/{filename}")
async def download_pdf_endpoint(filename: str):
    output_path = settings.OUTPUT_DIR / filename
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.get("/api/history")
async def get_history():
    sessions = await storage_manager.list_sessions()
    return {"sessions": sessions}

@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time bidirectional voice assistant.
    Relays audio frames to Gemini Live API and back to browser.
    """
    await websocket.accept()
    relay = GeminiLiveRelay(client_ws=websocket)
    await relay.handle_client()

