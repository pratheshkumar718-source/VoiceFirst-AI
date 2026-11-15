// VoiceFirst AI - Frontend API Client

const getBaseUrl = (): string => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000';
    }
    return `http://${window.location.hostname}:8000`;
  }
  return 'http://127.0.0.1:8000';
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

export const DEFAULT_SAMPLE_DOCUMENT: UploadResponse = {
  success: true,
  doc_id: 'sample_scholarship',
  filename: 'Tamil_Nadu_Scholarship_Application.pdf',
  preview_url: '/api/documents/file/sample_scholarship_thumb.png',
  analysis: {
    document_type: 'Government Application Form',
    title: 'Tamil Nadu Post-Matric Scholarship Application Form 2024-2025',
    title_tamil: 'தமிழ்நாடு மெட்ரிக் பின் கல்வி உதவித்தொகை விண்ணப்பப் படிவம் 2024-2025',
    purpose: 'Financial assistance and fee reimbursement scholarship for higher education students from eligible communities and low-income families.',
    purpose_tamil: 'தகுதியான சமூகங்கள் மற்றும் குறைந்த வருமானம் கொண்ட குடும்பங்களைச் சேர்ந்த உயர்கல்வி பயிலும் மாணவர்களுக்கான கல்வி உதவித்தொகை மற்றும் கட்டணத் திருப்பிச் செலுத்தும் திட்டம்.',
    summary: "This is an official Government Scholarship application. It requires the applicant's personal details, Aadhaar number, family income, and enrolled college course information to disburse academic tuition support.",
    summary_tamil: 'இது உயர்கல்வி உதவித்தொகைக்கான அரசு விண்ணப்பப் படிவமாகும். உதவித்தொகை பெற மாணவரின் பெயர், ஆதார் எண், குடும்ப வருமானம் மற்றும் கல்லூரி விவரங்களை வழங்க வேண்டும்.',
    fields: [
      {
        name: 'full_name',
        label: 'Full Name',
        label_tamil: 'முழு பெயர்',
        type: 'text',
        required: true,
        description: "Student's full name as per official records and Aadhaar",
        description_tamil: 'சான்றிதழ் மற்றும் ஆதார் அட்டையில் உள்ளவாறு மாணவரின் முழு பெயர்',
      },
      {
        name: 'date_of_birth',
        label: 'Date of Birth',
        label_tamil: 'பிறந்த தேதி',
        type: 'date',
        required: true,
        description: 'Date of birth in DD/MM/YYYY format',
        description_tamil: 'நாள்/மாதம்/வருடம் வடிவில் பிறந்த தேதி',
      },
      {
        name: 'aadhaar_number',
        label: 'Aadhaar Number',
        label_tamil: 'ஆதார் எண்',
        type: 'text',
        required: true,
        description: '12-digit unique Aadhaar identification number',
        description_tamil: '12 இலக்க தனித்துவ ஆதார் அடையாள எண்',
      },
      {
        name: 'income_annual',
        label: 'Annual Family Income (Rs.)',
        label_tamil: 'ஆண்டு குடும்ப வருமானம் (ரூ.)',
        type: 'number',
        required: true,
        description: 'Total family annual income in Rupees (must be under 2,50,000)',
        description_tamil: 'ஆண்டுக்கு குடும்பத்தின் மொத்த வருமானம் (ரூபாயில்)',
      },
      {
        name: 'course_name',
        label: 'Course / Degree',
        label_tamil: 'படிப்பு / பட்டப்படிப்பு',
        type: 'text',
        required: true,
        description: 'Currently enrolled course (e.g. B.Tech Computer Science, B.Sc, B.Com)',
        description_tamil: 'தற்போது பயிலும் பட்டப்படிப்பு (எ.கா. பி.இ., பி.எஸ்.சி)',
      },
      {
        name: 'institution_name',
        label: 'College / Institution Name',
        label_tamil: 'கல்லூரி / கல்வி நிறுவனத்தின் பெயர்',
        type: 'text',
        required: true,
        description: 'Name of university, college, or polytechnic',
        description_tamil: 'படிக்கும் கல்லூரி அல்லது கல்வி நிறுவனத்தின் பெயர்',
      },
    ],
    supporting_documents: [
      {
        name: 'Aadhaar Card',
        name_tamil: 'ஆதார் அட்டை',
        required: true,
        description: 'Proof of identity and citizenship',
      },
      {
        name: 'Income Certificate',
        name_tamil: 'வருமானச் சான்றிதழ்',
        required: true,
        description: 'Issued by Tahsildar / Revenue Department',
      },
      {
        name: 'College Bonafide Certificate',
        name_tamil: 'கல்லூரி சான்றிதழ்',
        required: true,
        description: 'Proof of current academic admission',
      },
    ],
    instructions: 'All mandatory fields marked with an asterisk must be filled. Speak clearly when providing names and digits.',
    instructions_tamil: 'அனைத்து முக்கிய விவரங்களையும் தெளிவாக குறிப்பிடவும். பெயர் மற்றும் எண்களை தெளிவாக குரல் மூலம் கூறலாம்.',
  },
};

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
    try {
      const formData = new FormData();
      formData.append('language', language);

      const res = await fetch(`${BASE_URL}/api/documents/sample`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        return DEFAULT_SAMPLE_DOCUMENT;
      }

      return await res.json();
    } catch {
      return DEFAULT_SAMPLE_DOCUMENT;
    }
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

