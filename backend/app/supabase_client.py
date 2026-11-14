import logging
import json
import shutil
from pathlib import Path
from typing import Optional, Dict, Any, List
from .config import settings

logger = logging.getLogger(__name__)

class StorageManager:
    """
    Manages document and PDF storage.
    Uses Supabase Storage if configured; falls back to local filesystem seamlessly.
    """
    def __init__(self):
        self.client = None
        self.is_supabase_active = False
        
        if settings.SUPABASE_URL and (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY):
            try:
                from supabase import create_client, Client
                key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
                self.client: Optional[Client] = create_client(settings.SUPABASE_URL, key)
                self.is_supabase_active = True
                logger.info("Connected to Supabase storage successfully.")
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase client: {e}. Falling back to local storage.")
                self.is_supabase_active = False

        # In-memory session store (with backup file persistence)
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self._load_local_sessions()

    def _sessions_file(self) -> Path:
        return settings.UPLOAD_DIR / "sessions_store.json"

    def _load_local_sessions(self):
        file_path = self._sessions_file()
        if file_path.exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    self.sessions = json.load(f)
            except Exception as e:
                logger.error(f"Error loading sessions: {e}")

    def _save_local_sessions(self):
        try:
            with open(self._sessions_file(), "w", encoding="utf-8") as f:
                json.dump(self.sessions, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error persisting sessions: {e}")

    async def save_session(self, session_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves session metadata to Supabase DB or local store."""
        session_data = {
            "session_id": session_id,
            **data
        }
        self.sessions[session_id] = session_data
        self._save_local_sessions()

        if self.is_supabase_active and self.client:
            try:
                # Upsert into sessions table if it exists
                self.client.table("sessions").upsert(session_data).execute()
            except Exception as e:
                logger.warning(f"Supabase DB upsert failed: {e}. Local state preserved.")

        return session_data

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        if session_id in self.sessions:
            return self.sessions[session_id]

        if self.is_supabase_active and self.client:
            try:
                res = self.client.table("sessions").select("*").eq("session_id", session_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Supabase DB query error: {e}")

        return None

    async def list_sessions(self) -> List[Dict[str, Any]]:
        return list(self.sessions.values())

    async def upload_document(self, file_path: Path, filename: str) -> str:
        """Uploads document to storage and returns download/access URL."""
        if self.is_supabase_active and self.client:
            try:
                bucket = settings.SUPABASE_DOCUMENTS_BUCKET
                with open(file_path, "rb") as f:
                    file_bytes = f.read()
                
                # Check / upload
                storage_path = f"uploads/{filename}"
                self.client.storage.from_(bucket).upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={"content-type": "application/pdf" if filename.endswith(".pdf") else "image/png"}
                )
                public_url = self.client.storage.from_(bucket).get_public_url(storage_path)
                return public_url
            except Exception as e:
                logger.warning(f"Supabase document upload failed: {e}. Using local URL.")

        # Local URL fallback
        return f"/api/documents/file/{filename}"

    async def upload_pdf(self, file_path: Path, filename: str) -> str:
        """Uploads generated PDF to storage and returns download/access URL."""
        if self.is_supabase_active and self.client:
            try:
                bucket = settings.SUPABASE_PDFS_BUCKET
                with open(file_path, "rb") as f:
                    file_bytes = f.read()
                
                storage_path = f"generated/{filename}"
                self.client.storage.from_(bucket).upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={"content-type": "application/pdf"}
                )
                public_url = self.client.storage.from_(bucket).get_public_url(storage_path)
                return public_url
            except Exception as e:
                logger.warning(f"Supabase PDF upload failed: {e}. Using local URL.")

        return f"/api/forms/download/{filename}"

storage_manager = StorageManager()

