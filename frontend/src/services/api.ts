// VoiceFirst AI - Frontend API Client

const getBaseUrl = (): string => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  // If running directly under VS Code Live Server (port 5500), point directly to FastAPI backend on 8000
  if (typeof window !== 'undefined' && (window.location.port === '5500' || window.location.port === '3000')) {
    return 'http://127.0.0.1:8000';
  }
  return '';
};

const BASE_URL = getBaseUrl();

export interface DocumentField {
  name: string;
  label: string;
  label_tamil?: string;
  type: string;
  required: boolean;
  description?: string;
  description_tamil?: string;
}

export interface SupportingDocument {
  name: string;
  name_tamil?: string;
  required: boolean;
  description?: string;
}

export interface DocumentAnalysis {
  document_type: string;
  title: string;
  title_tamil?: string;
  purpose: string;
  purpose_tamil?: string;
  summary: string;
  summary_tamil?: string;
  fields: DocumentField[];
  supporting_documents: SupportingDocument[];
  instructions: string;
  instructions_tamil?: string;
}

export interface UploadResponse {
  success: boolean;
  doc_id: string;
  filename: string;
  preview_url: string;
  analysis: DocumentAnalysis;
}

export interface FormExtractResponse {
  success: boolean;
  form_data: Record<string, any>;
}

export interface GeneratePdfResponse {
  success: boolean;
  filename: string;
  download_url: string;
  session_id: string;
}

export const api = {
  async checkHealth() {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async uploadDocument(file: File, language: string = 'en'): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    const res = await fetch(`${BASE_URL}/api/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }

    return res.json();
  },

  async loadSampleDocument(language: string = 'en'): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('language', language);

    const res = await fetch(`${BASE_URL}/api/documents/sample`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Failed to load sample document');
    }

    return res.json();
  },

  async extractFormData(
    transcript: string,
    fieldsSchema: DocumentField[],
    language: string = 'en'
  ): Promise<FormExtractResponse> {
    const res = await fetch(`${BASE_URL}/api/forms/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        fields_schema: fieldsSchema,
        language,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to extract form data');
    }

    return res.json();
  },

  async generatePdf(
    formData: Record<string, any>,
    sessionId?: string,
    language: string = 'en',
    documentAnalysis?: any
  ): Promise<GeneratePdfResponse> {
    const res = await fetch(`${BASE_URL}/api/forms/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form_data: formData,
        session_id: sessionId,
        language,
        document_analysis: documentAnalysis,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'PDF generation failed' }));
      throw new Error(err.detail || 'PDF generation failed');
    }

    return res.json();
  },

  async getHistory() {
    const res = await fetch(`${BASE_URL}/api/history`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  getDownloadUrl(filename: string) {
    return `${BASE_URL}/api/forms/download/${filename}`;
  },

  getFileUrl(filename: string) {
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    return `${BASE_URL}${filename.startsWith('/') ? '' : '/'}${filename}`;
  },
};

