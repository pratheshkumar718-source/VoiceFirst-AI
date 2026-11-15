import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Loader2,
  Sparkles,
  AlertCircle,
  FileCheck,
  Eye,
  Trash2,
  Camera,
} from 'lucide-react';
import { api } from '../services/api';
import type { UploadResponse } from '../services/api';
import { CameraCaptureModal } from './CameraCaptureModal';

interface DocumentUploadProps {
  language: string;
  onDocumentAnalyzed: (response: UploadResponse) => void;
  currentDocument?: UploadResponse | null;
  onClearDocument?: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  language,
  onDocumentAnalyzed,
  currentDocument,
  onClearDocument,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isTamil = language === 'ta';

  const handleFileProcess = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError(
        isTamil
          ? 'கோப்பு 5MB அளவிற்குள் இருக்க வேண்டும்.'
          : 'File size must be under 5MB.'
      );
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext || '')) {
      setError(
        isTamil
          ? 'PDF, JPG அல்லது PNG கோப்புகளை மட்டுமே பதிவேற்றவும்.'
          : 'Only PDF, JPG, and PNG files are allowed.'
      );
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      const res = await api.uploadDocument(file, language);
      onDocumentAnalyzed(res);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload and analyze document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleSampleLoad = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await api.loadSampleDocument(language);
      onDocumentAnalyzed(res);
    } catch (err: any) {
      console.error('Sample load error:', err);
      setError('Could not load sample document');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span>{isTamil ? 'அரசு ஆவணப் பதிவேற்றம்' : 'Document Ingestion & Analysis'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTamil
              ? 'படிவம் அல்லது அறிவிக்கையை பதிவேற்றவும் (PDF, JPG, PNG)'
              : 'Upload official application forms, notices, or certificates'}
          </p>
        </div>

        {/* Quick Sample Button */}
        <button
          onClick={handleSampleLoad}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold border border-blue-200 transition-all shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>{isTamil ? 'மாதிரி படிவத்தை சோதிக்க' : 'Load Sample Form'}</span>
        </button>
      </div>

      {/* Drag & Drop Zone */}
      {!currentDocument ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
            isDragging
              ? 'border-blue-600 bg-blue-50/60 ring-4 ring-blue-100'
              : 'border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileProcess(e.target.files[0]);
              }
            }}
          />

          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {isTamil
                    ? 'ஜெமினி AI ஆவணத்தை முழுமையாகப் பகுப்பாய்வு செய்கிறது...'
                    : 'Gemini Multimodal AI is analyzing document structure...'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Detecting form fields, eligibility rules, and instructions...
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {isTamil
                    ? 'கோப்பை இங்கு இழுத்துப் போடவும் அல்லது தேர்வு செய்க'
                    : 'Drag & drop document here, or choose an option below'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: PDF, JPG, PNG (maximum size: 5MB)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  {isTamil ? 'கோப்புகளை உலாவுக' : 'Browse Files'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isTamil ? 'புகைப்படம் எடு' : 'Snap Photo'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Document Preview when uploaded */
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/90 flex flex-col sm:flex-row gap-5 items-center">
          {/* Document Preview Thumbnail */}
          <div className="relative group w-24 h-32 bg-white rounded-xl border border-slate-200 overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
            {currentDocument.preview_url ? (
              <img
                src={api.getFileUrl(currentDocument.preview_url)}
                alt="Document Preview"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <FileCheck className="w-8 h-8 text-blue-600" />
            )}
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
              <Eye className="w-4 h-4 mr-1" />
              <span>Preview</span>
            </div>
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isTamil ? 'ஜெமினி பகுப்பாய்வு முடிந்தது' : 'Gemini Analysis Complete'}</span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {currentDocument.filename}
            </h3>

            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
              {isTamil && currentDocument.analysis.purpose_tamil
                ? currentDocument.analysis.purpose_tamil
                : currentDocument.analysis.purpose}
            </p>

            <div className="mt-3 flex items-center justify-center sm:justify-start gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                {isTamil ? 'வேறு ஆவணத்தைப் பதிவேற்றுக' : 'Change Document'}
              </button>
              <span className="text-slate-300">·</span>
              <button
                onClick={onClearDocument}
                className="text-xs text-red-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>{isTamil ? 'அகற்று' : 'Remove'}</span>
              </button>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {currentDocument.analysis.fields.length} {isTamil ? 'புலங்கள்' : 'Fields Extracted'}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handleFileProcess}
        language={language}
      />
    </div>
  );
};
