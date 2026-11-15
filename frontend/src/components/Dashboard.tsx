import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  FileText,
  ShieldCheck,
  ChevronDown,
  Mic,
  Clock,
  FileCheck,
} from 'lucide-react';
import { VoiceAssistant } from './VoiceAssistant';
import { FormCompletion } from './FormCompletion';
import { DocumentUpload } from './DocumentUpload';
import { DocumentUnderstanding } from './DocumentUnderstanding';
import { AiModeModal } from './AiModeModal';
import { api, DEFAULT_SAMPLE_DOCUMENT } from '../services/api';
import type { UploadResponse, DocumentField } from '../services/api';

interface DashboardProps {
  initialLanguage: string;
  autoLoadSample?: boolean;
  onBackToHome: () => void;
  onViewHistory?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  initialLanguage,
  autoLoadSample = false,
  onBackToHome,
  onViewHistory,
}) => {
  const [language, setLanguage] = useState<string>(initialLanguage || 'en');
  const [currentDoc, setCurrentDoc] = useState<UploadResponse | null>(DEFAULT_SAMPLE_DOCUMENT);
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    DEFAULT_SAMPLE_DOCUMENT.analysis.fields.forEach((f) => {
      initial[f.name] = '';
    });
    return initial;
  });
  const [isAiModeModalOpen, setIsAiModeModalOpen] = useState(false);
  const [currentAiMode, setCurrentAiMode] = useState('Gemini Live');
  const [activeTab, setActiveTab] = useState<'assistant' | 'documents' | 'review'>('assistant');

  // Always load official scholarship application on dashboard mount so form fields are visible
  useEffect(() => {
    if (!currentDoc || autoLoadSample) {
      api.loadSampleDocument(language)
        .then((res) => {
          handleDocumentAnalyzed(res);
        })
        .catch((err) => {
          console.error('Failed to auto-load sample document:', err);
        });
    }
  }, [language, autoLoadSample]);

  const handleDocumentAnalyzed = (response: UploadResponse) => {
    setCurrentDoc(response);
    setFormData((prev) => {
      const merged: Record<string, any> = { ...prev };
      response.analysis.fields.forEach((f) => {
        if (merged[f.name] === undefined) {
          merged[f.name] = '';
        }
      });
      return merged;
    });
  };

  const activeFields: DocumentField[] = currentDoc?.analysis?.fields || [];

  const handleFieldDetected = (fieldName: string, value: string) => {
    setFormData((prev) => {
      // 1. Direct match on f.name
      if (activeFields.some((f) => f.name === fieldName)) {
        return { ...prev, [fieldName]: value };
      }

      // 2. Normalized match (remove punctuation, spaces, underscores)
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const targetNorm = norm(fieldName);

      const matched = activeFields.find((f) => {
        const fn = norm(f.name);
        const fl = norm(f.label);
        const ft = f.label_tamil ? norm(f.label_tamil) : '';
        return (
          fn === targetNorm ||
          fl === targetNorm ||
          ft === targetNorm ||
          (fn.length > 3 && targetNorm.includes(fn)) ||
          (targetNorm.length > 3 && fn.includes(targetNorm))
        );
      });

      if (matched) {
        return { ...prev, [matched.name]: value, [fieldName]: value };
      }

      // 3. Alias mapping
      const aliasMap: Record<string, string> = {
        name: 'full_name',
        applicant_name: 'full_name',
        student_name: 'full_name',
        dob: 'date_of_birth',
        birth_date: 'date_of_birth',
        aadhaar: 'aadhaar_number',
        aadhaar_no: 'aadhaar_number',
        income: 'income_annual',
        annual_income: 'income_annual',
        course: 'course_name',
        degree: 'course_name',
        college: 'institution_name',
        institution: 'institution_name',
      };
      if (aliasMap[fieldName]) {
        return { ...prev, [aliasMap[fieldName]]: value, [fieldName]: value };
      }

      return { ...prev, [fieldName]: value };
    });
  };

  const handleUpdateField = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReset = () => {
    setCurrentDoc(null);
    setFormData({});
  };

  const handleLoadDefaultDoc = async () => {
    try {
      const res = await api.loadSampleDocument(language);
      handleDocumentAnalyzed(res);
    } catch {
      handleDocumentAnalyzed(DEFAULT_SAMPLE_DOCUMENT);
    }
  };

  const isTamil = language === 'ta';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. Top SaaS Application Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Left: Back button & Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onBackToHome}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{isTamil ? 'முகப்பு' : 'Home'}</span>
            </button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Mic className="w-4 h-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                VoiceFirst <span className="text-blue-600">AI</span>
              </span>
            </div>
          </div>

          {/* Center: Workspace Navigation Tabs */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'assistant'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isTamil ? 'உதவியாளர்' : 'Voice Assistant'}</span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isTamil ? 'ஆவணம் & பதிவேற்றம்' : 'Document & Upload'}</span>
              {currentDoc && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('review')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'review'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{isTamil ? 'படிவம் & PDF' : 'Review & PDF'}</span>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Load Default Document Button */}
            <button
              onClick={handleLoadDefaultDoc}
              className="text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 flex items-center gap-1.5 font-semibold px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Load official government scholarship document"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>{isTamil ? 'மாதிரி படிவம்' : 'Default Form'}</span>
            </button>

            {/* New Session Button */}
            <button
              onClick={handleReset}
              className="text-xs text-slate-600 hover:text-red-600 flex items-center gap-1.5 font-semibold px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Reset conversation and start fresh"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{isTamil ? 'புதிய அமர்வு' : 'New Session'}</span>
            </button>

            {/* Session History */}
            {onViewHistory && (
              <button
                onClick={onViewHistory}
                className="text-xs text-slate-600 hover:text-blue-600 flex items-center gap-1.5 font-semibold px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="View previous applications"
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">{isTamil ? 'வரலாறு' : 'History'}</span>
              </button>
            )}

            {/* AI Engine Status Pill */}
            <button
              type="button"
              onClick={() => setIsAiModeModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs transition-all cursor-pointer group"
              title="Click to view AI Engine architecture"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-800 text-[11px] sm:text-xs">{currentAiMode}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform" />
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('ta')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  language === 'ta'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 px-2 py-1.5 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('assistant')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 ${
              activeTab === 'assistant' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-600'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Assistant</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 ${
              activeTab === 'documents' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document</span>
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 ${
              activeTab === 'review' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-600'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Review</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 w-full flex-1 flex flex-col">
        {activeTab === 'assistant' ? (
          /* View 1: Primary Conversational Workspace */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start flex-1">
            {/* Left Column: AI Voice Assistant (62%) */}
            <div className="lg:col-span-8 flex flex-col h-[calc(100vh-9.5rem)] min-h-[550px]">
              <VoiceAssistant
                language={language}
                documentContext={currentDoc?.analysis}
                currentDocument={currentDoc}
                onFieldDetected={handleFieldDetected}
                onDocumentAnalyzed={handleDocumentAnalyzed}
              />
            </div>

            {/* Right Column: Real-Time Application Tracker (38%) */}
            <div className="lg:col-span-4 flex flex-col h-[calc(100vh-9.5rem)] min-h-[550px] sticky top-20">
              <FormCompletion
                fields={activeFields}
                formData={formData}
                onUpdateField={handleUpdateField}
                language={language}
                sessionId={currentDoc?.doc_id}
                documentPurpose={isTamil ? currentDoc?.analysis?.purpose_tamil : currentDoc?.analysis?.purpose}
                supportingDocuments={currentDoc?.analysis?.supporting_documents || []}
                documentAnalysis={currentDoc?.analysis}
              />
            </div>
          </div>
        ) : activeTab === 'documents' ? (
          /* View 2: Dedicated Document & Ingestion Workspace */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
            <div className="lg:col-span-6 space-y-5">
              <DocumentUpload
                language={language}
                currentDocument={currentDoc}
                onDocumentAnalyzed={handleDocumentAnalyzed}
                onClearDocument={handleReset}
              />
            </div>

            <div className="lg:col-span-6">
              <DocumentUnderstanding
                analysis={currentDoc?.analysis}
                language={language}
              />
            </div>
          </div>
        ) : (
          /* View 3: Review & PDF Workspace */
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col justify-center">
            <FormCompletion
              fields={activeFields}
              formData={formData}
              onUpdateField={handleUpdateField}
              language={language}
              sessionId={currentDoc?.doc_id}
              documentPurpose={isTamil ? currentDoc?.analysis?.purpose_tamil : currentDoc?.analysis?.purpose}
              supportingDocuments={currentDoc?.analysis?.supporting_documents || []}
              documentAnalysis={currentDoc?.analysis}
            />
          </div>
        )}
      </main>

      {/* 3. Footer Status Bar */}
      <footer className="border-t border-slate-200/80 bg-white py-2.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Secure Voice & Vision Relay · Gemini Live WebSocket · PyMuPDF Certified</span>
          </div>
          <span className="font-semibold text-slate-700 hidden sm:inline">
            VoiceFirst AI Assistant
          </span>
        </div>
      </footer>

      {/* AI Mode Selection & Diagnostic Modal */}
      <AiModeModal
        isOpen={isAiModeModalOpen}
        onClose={() => setIsAiModeModalOpen(false)}
        language={language}
        onSelectMode={(mode) => {
          if (mode === 'voice_live') setCurrentAiMode('Gemini Live');
          else if (mode === 'vision_scan') setCurrentAiMode('Vision Scanner');
          else if (mode === 'fast_fill') setCurrentAiMode('Express Auto-Fill');
          setIsAiModeModalOpen(false);
        }}
      />
    </div>
  );
};
