# VoiceFirst AI

> **A Multimodal, Voice-First AI Assistant for Government Documents & Accessible Form Filling**  
> Powered by Google Gemini Live API & Multimodal Vision.

[![Google Gemini API](https://img.shields.io/badge/Powered%20By-Google%20Gemini%202.0%20%2F%20Live%20API-1e40af.svg)](https://ai.google.dev/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%20%2B%20Tailwind%20v4-0d9488.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20WebSockets-10b981.svg)](https://fastapi.tiangolo.com/)
[![PyMuPDF](https://img.shields.io/badge/PDF%20Engine-PyMuPDF%20(fitz)-f97316.svg)](https://pymupdf.readthedocs.io/)

---

## 🌟 Core Value Proposition

Millions of senior citizens, rural citizens, and regional-language speakers struggle to navigate dense bureaucratic language in official government documents (such as scholarships, welfare pensions, ration cards, and community certificates).

**VoiceFirst AI** bridges this digital divide through an accessible, voice-first multimodal assistant that:
1. **Understands Complex Documents**: Accepts scanned forms or notices (PDF/image) and explains eligibility, requirements, and deadlines in natural **Tamil** or **English**.
2. **Engages in Real-Time Voice Conversation**: Leverages the **Gemini Live API** via bidirectional WebSocket streaming (PCM 16kHz audio in, PCM 24kHz audio out) without traditional sluggish STT &rarr; LLM &rarr; TTS latency.
3. **Fills Out Forms Collaboratively**: Inquires for required information one step at a time, supports code-switching ("Tanglish"), and validates information on the fly.
4. **Generates Official PDFs**: Uses **PyMuPDF** to automatically populate AcroForm fields and inject certified verification badges, producing a ready-to-submit official document with one-click download.

---

## ⚡ Google Gemini Multimodal Architecture

| Gemini Capability | Implementation Details |
|---|---|
| **Gemini Live API (Bidirectional WebSocket)** | Streaming native PCM 16kHz audio directly to Gemini Live (`gemini-2.0-flash-exp`) with real-time waveform visualization, natural Tamil and English voice responses, sub-second latency, and interruption handling. |
| **Gemini Multimodal (Vision & PDF Understanding)** | Ingesting raw PDF/image government forms to detect form categories, extract required fields, translate legal terminology into conversational regional terms, and outline required supporting documents. |
| **Gemini Structured Output** | Guaranteeing strictly typed JSON extraction of applicant data directly from dialogue transcripts into schema-validated fields. |
| **Real-World Social Impact** | Transforming accessibility for elderly citizens and regional speakers who find traditional digital portals intimidating or inaccessible. |

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 React + TypeScript Frontend                 │
│  - Web Audio API (16kHz 16-bit Mono PCM Chunking)           │
│  - AudioWaveform Real-Time Canvas Visualizer                │
│  - Dual Language Switcher (Tamil / English / Tanglish)       │
│  - Document Preview & Field Completion Panel                │
└──────────────┬──────────────────────────────▲───────────────┘
               │                              │
         PCM Audio (16kHz)             PCM Audio (24kHz)
          WebSocket Stream             + Live Transcript
               │                              │
┌──────────────▼──────────────────────────────┴───────────────┐
│                 FastAPI Backend Relay                       │
│  - WebSocket Relay Router (/ws/live)                        │
│  - Document Multimodal Analysis (/api/documents/upload)     │
│  - PyMuPDF Template Filler (/api/forms/generate-pdf)        │
│  - Supabase Storage & DB Client (with local fallback)       │
└──────────────┬──────────────────────────────▲───────────────┘
               │                              │
        Bidi WebSocket                 Live Response
               │                              │
┌──────────────▼──────────────────────────────┴───────────────┐
│              Google Gemini Cloud Platform                   │
│  - Gemini Live API (wss://generativelanguage.googleapis...) │
│  - Gemini 2.0 / 2.5 Flash Multimodal                        │
│  - Gemini Structured JSON Schema Output Engine              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure Environment Variables
cp .env.example .env
# Open .env and add your GEMINI_API_KEY=AIzaSy...

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🎯 Step-by-Step Demonstration Script (Tamil & English)

1. **Launch App**: Open `http://localhost:5173` and view the clean, high-contrast homepage.
2. **Start Session**: Click **"Start New Session"** (or switch language to **தமிழ்** or **English**).
3. **Load Application**: Click the **"Try Sample Form"** button (or drag & drop any scholarship/government form PDF/image).
4. **Gemini Multimodal Analysis**: Watch Gemini identify the Tamil Nadu Post-Matric Scholarship, its purpose, the required demographic fields, and supporting certificates.
5. **Start Voice Assistant**: Click the large circular microphone button.
6. **Voice Query**:
   - *In Tamil*: *"இந்த படிவம் எதை பற்றியது?"* (or click the quick prompt chip)
   - *In English*: *"What is this form about?"*
   - **Gemini Live responds in native voice** with a clear explanation of the scholarship benefits.
7. **Inquire Requirements**:
   - *"What information do I need to provide?"* / *"என்னென்ன தகவல்கள் தேவை?"*
8. **Interactive Form Filling**:
   - Gemini asks for the applicant's name: *"My name is Karthik Raja"*
   - Gemini confirms and asks for Date of Birth: *"14th May 2003"*
   - Gemini requests Aadhaar Number: *"5482 9104 3821"*
   - Notice the **Form Completion Panel** automatically filling and checking each field in real time!
9. **Final Confirmation**:
   - Gemini summarizes the details and prompts for review.
   - Click **"Confirm & Generate PDF"**.
10. **PyMuPDF Generation**:
    - PyMuPDF generates the completed, stamped official scholarship form.
    - Click **"Download Completed PDF"** to inspect the finished document.

---

## 🔒 Security & Best Practices

- **Hiding API Keys**: Frontend never possesses the Gemini API Key. All communication routes through the FastAPI WebSocket and REST relay.
- **Upload Guards**: Enforces maximum upload limits (5MB) and validates MIME types strictly (PDF, JPG, PNG).
- **Graceful Offline Mode**: Includes a full interactive voice simulator so users and reviewers can evaluate the workflow seamlessly even in restricted environments or during network outages.

---

## 📦 Deployment Instructions

### Backend (Render Web Service)
1. In Render, select **New Web Service** and connect your GitHub repository.
2. Select **Dockerfile** runtime.
3. Configure environment variables:
   - `GEMINI_API_KEY`: `AIza...`
   - `SUPABASE_URL`: *(optional)*
   - `SUPABASE_ANON_KEY`: *(optional)*
   - `SUPABASE_SERVICE_ROLE_KEY`: *(optional)*
4. Set port to `10000`.

### Frontend (Render Static Site)
1. In Render, select **New Static Site**.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variables:
   - `VITE_BACKEND_URL`: `https://your-backend-service.onrender.com`

---

## ⚖️ License
MIT License. Open source accessibility tool.

