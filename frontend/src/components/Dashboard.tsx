import React, { useState } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  FileText,
  ShieldCheck,
  ChevronDown,
  Upload,
  Mic,
} from 'lucide-react';
import { VoiceAssistant } from './VoiceAssistant';
import { FormCompletion } from './FormCompletion';
import { AiModeModal } from './AiModeModal';
import type { UploadResponse, DocumentField } from '../services/api';

interface DashboardProps {
  initialLanguage: string;
  onBackToHome: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  initialLanguage,
  onBackToHome,
}) => {
  const [language, setLanguage] = useState<string>(initialLanguage || 'en');
  const [currentDoc, setCurrentDoc] = useState<UploadResponse | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showDocModal, setShowDocModal] = useState(false);
  const [isAiModeModalOpen, setIsAiModeModalOpen] = useState(false);
  const [currentAiMode, setCurrentAiMode] = useState('Gemini 3.5 Live');

  const handleDocumentAnalyzed = (response: UploadResponse) => {
    setCurrentDoc(response);
    const initialValues: Record<string, any> = {};
    response.analysis.fields.forEach((f) => {
      initialValues[f.name] = formData[f.name] || '';
    });
    setFormData(initialValues);
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
        return { ...prev, [matched.name]: value };
      }

      // 3. Fallback: If no direct name match, assign to the first unfilled field
      const firstUnfilled = activeFields.find(
        (f) => !prev[f.name] || !prev[f.name].toString().trim()
      );
      if (firstUnfilled) {
        return { ...prev, [firstUnfilled.name]: value };
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

  const isTamil = language === 'ta';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Application Header: Clean, Professional */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Left: Back button & Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={onBackToHome}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{isTamil ? 'முகப்பு' : 'Home'}</span>
            </button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <Mic className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <span className="text-base font-black tracking-tight text-slate-900">
                VoiceFirst <span className="text-teal-600">AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
          </div>

          {/* Center: Active Document Status / Notification */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-md">
            {currentDoc ? (
              <button
                type="button"
                onClick={() => setShowDocModal(!showDocModal)}
                className="flex items-center gap-2 bg-slate-100/90 hover:bg-slate-200/80 transition-colors px-3 py-1.5 rounded-full border border-slate-200/80 text-xs font-semibold text-slate-700 max-w-sm truncate cursor-pointer shadow-2xs"
                title="Click to view document details"
              >
                <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate font-bold">{currentDoc.filename}</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-md font-extrabold shrink-0">
                  {activeFields.length} {isTamil ? 'விவரங்கள்' : 'fields'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{isTamil ? 'அரட்டை தயார் · ஆவணத்தை இணைக்கவும்' : 'Chatbot Ready · Attach form or photo below'}</span>
              </div>
            )}
          </div>

          {/* Right Action Group: AI Mode + Reset + Language */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Elegant AI Engine Status Pill */}
            <button
              type="button"
              onClick={() => setIsAiModeModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 transition-all cursor-pointer group"
              title="Click to view AI Engine architecture & modes"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-800 text-[11px] sm:text-xs">{currentAiMode}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform" />
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-red-700 flex items-center gap-1 font-semibold px-2 sm:px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              title="Reset conversation and document"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{isTamil ? 'மீட்டமை' : 'Reset'}</span>
            </button>

            {/* Segmented Language Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200/80 text-xs font-semibold">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 sm:px-2.5 py-1 rounded-full transition-all cursor-pointer ${language === 'en'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('ta')}
                className={`px-2 sm:px-2.5 py-1 rounded-full transition-all cursor-pointer ${language === 'ta'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                தமிழ்
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Document Details Modal / Drawer (Collapsible) */}
      {showDocModal && currentDoc && (
        <div className="bg-white border-b border-slate-200 shadow-md p-4 sm:p-5 transition-all">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {currentDoc.analysis.document_type || 'Official Application'}
                </span>
                <span className="text-xs text-slate-500 font-bold">{currentDoc.filename}</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                {isTamil && currentDoc.analysis.title_tamil ? currentDoc.analysis.title_tamil : currentDoc.analysis.title}
              </h3>
              <p className="text-xs text-slate-600 max-w-3xl">
                {isTamil && currentDoc.analysis.purpose_tamil ? currentDoc.analysis.purpose_tamil : currentDoc.analysis.purpose}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setCurrentDoc(null)}
                className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isTamil ? 'வேறு ஆவணத்தை பதிவேற்ற' : 'Upload Different Doc'}</span>
              </button>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-xs font-bold px-3 py-1.5 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-colors cursor-pointer"
              >
                {isTamil ? 'மூடு' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct AI Chatbot Workspace: Modern 2-Column Chatbot UI */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 w-full flex-1 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start flex-1">
          {/* LEFT / MAIN COLUMN: True Chatbot (65% width) */}
          <div className="lg:col-span-8 flex flex-col h-[calc(100vh-8.5rem)] min-h-[550px]">
            <VoiceAssistant
              language={language}
              documentContext={currentDoc?.analysis}
              currentDocument={currentDoc}
              onFieldDetected={handleFieldDetected}
              onDocumentAnalyzed={handleDocumentAnalyzed}
            />
          </div>

          {/* RIGHT COLUMN: Real-Time Application Tracker (35% width) */}
          <div className="lg:col-span-4 flex flex-col h-[calc(100vh-8.5rem)] min-h-[550px] sticky top-20">
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
      </main>

      {/* Footer Status Bar */}
      <footer className="border-t border-slate-200/80 bg-white py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>Secure Voice & Vision · Gemini Multimodal Live Engine · Smart PDF Generator</span>
          </div>
          <span className="font-bold text-slate-700 hidden sm:inline">
            VoiceFirst AI Accessible Assistant
          </span>
        </div>
      </footer>

      {/* AI Mode Selection & Diagnostic Modal */}
      <AiModeModal
        isOpen={isAiModeModalOpen}
        onClose={() => setIsAiModeModalOpen(false)}
        language={language}
        onSelectMode={(mode) => {
          if (mode === 'voice_live') setCurrentAiMode('Gemini 3.5 Live');
          else if (mode === 'vision_scan') setCurrentAiMode('Vision Scanner');
          else if (mode === 'fast_fill') setCurrentAiMode('Express Auto-Fill');
          setIsAiModeModalOpen(false);
        }}
      />
    </div>
  );
};
