import React, { useState } from 'react';
import {
  FileCheck,
  Edit2,
  Check,
  Download,
  Loader2,
  Sparkles,
  CheckCircle,
  Info,
  Clock,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api';
import type { DocumentField } from '../services/api';

interface FormCompletionProps {
  fields: DocumentField[];
  formData: Record<string, any>;
  onUpdateField: (field: string, value: any) => void;
  language: string;
  sessionId?: string;
  documentPurpose?: string;
  supportingDocuments?: Array<{ name: string; name_tamil?: string }>;
  documentAnalysis?: any;
}

export const FormCompletion: React.FC<FormCompletionProps> = ({
  fields,
  formData,
  onUpdateField,
  language,
  sessionId,
  documentPurpose,
  supportingDocuments = [],
  documentAnalysis,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [generatedFilename, setGeneratedFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDocInfo, setShowDocInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<'fields' | 'preview'>('fields');

  const isTamil = language === 'ta';

  const handleStartEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const handleSaveEdit = (field: string) => {
    onUpdateField(field, editValue);
    setEditingField(null);
  };

  const handleGeneratePdf = async () => {
    try {
      setError(null);
      setIsGenerating(true);
      const res = await api.generatePdf(formData, sessionId, language, documentAnalysis);
      setDownloadUrl(res.download_url);
      setGeneratedFilename(res.filename);
      setActiveTab('preview');
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate filled count using normalized lookup
  const filledCount = fields.filter((f) => {
    const directVal = formData[f.name];
    if (directVal && directVal.toString().trim()) return true;

    const lowerVal = formData[f.name.toLowerCase()];
    if (lowerVal && lowerVal.toString().trim()) return true;

    const labelVal = formData[f.label];
    if (labelVal && labelVal.toString().trim()) return true;

    return false;
  }).length;

  const totalCount = fields.length || 1;
  const percentage = Math.round((filledCount / totalCount) * 100);

  // Find first unfilled field to mark as "currently asking"
  const firstUnfilledIndex = fields.findIndex((f) => {
    const val = formData[f.name] || formData[f.name.toLowerCase()] || formData[f.label];
    return !val || !val.toString().trim();
  });

  const fullDownloadUrl = downloadUrl?.startsWith('http')
    ? downloadUrl
    : downloadUrl
    ? `http://127.0.0.1:8000${downloadUrl}`
    : null;

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col space-y-3.5 transition-all h-full">
      {/* Header & Tabs */}
      <div className="border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                <FileCheck className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {isTamil ? 'விண்ணப்ப விவரங்கள்' : 'Application Tracker'}
              </h2>
              {documentPurpose && (
                <button
                  type="button"
                  onClick={() => setShowDocInfo(!showDocInfo)}
                  className="text-slate-400 hover:text-blue-600 p-1 rounded-md transition-colors cursor-pointer"
                  title={isTamil ? 'ஆவண நோக்கம் பார்க்க' : 'View document purpose'}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {isTamil
                ? 'நேரலையாக புதுப்பிக்கப்படும் படிவ விவரங்கள்'
                : 'Real-time populated fields & validation'}
            </p>
          </div>

          <div className="text-right">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${
                filledCount > 0
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-slate-500 bg-slate-100 border-slate-200'
              }`}
            >
              {filledCount} / {fields.length} {isTamil ? 'முடிந்தது' : 'Fields'}
            </span>
          </div>
        </div>

        {/* View Tabs */}
        {downloadUrl && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mb-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('fields')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'fields'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isTamil ? 'படிவ விவரங்கள்' : 'Form Fields'}
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isTamil ? 'PDF முன்னோட்டம்' : 'PDF Preview & Download'}
            </button>
          </div>
        )}

        {/* Collapsible Document Info */}
        {showDocInfo && documentPurpose && (
          <div className="my-2.5 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs space-y-1.5 transition-all">
            <p className="font-semibold text-blue-950">{documentPurpose}</p>
            {supportingDocuments.length > 0 && (
              <div className="pt-1.5 border-t border-blue-200/50">
                <span className="font-bold text-[11px] text-blue-900 block mb-1">
                  {isTamil ? 'தேவையான சான்றிதழ்கள்:' : 'Required Supporting Documents:'}
                </span>
                <ul className="list-disc list-inside text-[11px] text-blue-800 space-y-0.5">
                  {supportingDocuments.map((doc, i) => (
                    <li key={i}>{isTamil && doc.name_tamil ? doc.name_tamil : doc.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mt-1.5 px-0.5">
          <span>{percentage}% Completed</span>
          {filledCount === fields.length && fields.length > 0 && (
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> All Fields Answered
            </span>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'preview' && downloadUrl ? (
        /* PDF Preview & Download Interface */
        <div className="flex-1 flex flex-col justify-between space-y-4 py-2">
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {isTamil ? 'PDF வெற்றிகரமாக உருவாக்கப்பட்டது!' : 'Official PDF Ready!'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {isTamil ? 'அரசு ஆவண வடிவம் பூர்த்தி செய்யப்பட்டது' : 'Certified AcroForm Generated'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                Verified
              </span>
            </div>

            {generatedFilename && (
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-100 text-xs">
                <span className="font-semibold text-slate-800 truncate mr-2">📄 {generatedFilename}</span>
                <span className="text-[10px] text-slate-400 font-medium shrink-0">Official PDF</span>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={fullDownloadUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>{isTamil ? 'முன்னோட்டம்' : 'View PDF'}</span>
              </a>

              <a
                href={fullDownloadUrl || '#'}
                download={generatedFilename || 'application.pdf'}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs shadow-blue-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isTamil ? 'பதிவிறக்கம்' : 'Download'}</span>
              </a>
            </div>
          </div>

          {/* Completed Data Summary Card */}
          <div className="flex-1 overflow-y-auto max-h-[220px] bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Submitted Values
            </span>
            {fields.map((f) => {
              const val = formData[f.name] || formData[f.name.toLowerCase()] || formData[f.label] || '—';
              return (
                <div key={f.name} className="flex justify-between py-1 border-b border-slate-200/60 last:border-0">
                  <span className="text-slate-500 font-medium">{isTamil && f.label_tamil ? f.label_tamil : f.label}:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[55%] text-right">{String(val)}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('fields')}
              className="text-xs font-bold text-slate-600 hover:text-blue-600 cursor-pointer"
            >
              ← {isTamil ? 'படிவ விவரங்களுக்கு திரும்பு' : 'Back to Fields'}
            </button>
            <button
              onClick={handleGeneratePdf}
              disabled={isGenerating}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isTamil ? 'மீண்டும் உருவாக்கு' : 'Regenerate'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Field Cards Stream */
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scroll-smooth max-h-[380px]">
          {fields.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                {isTamil ? 'படிவக் கண்காணிப்பு தயார்' : 'Application Tracker Ready'}
              </h4>
              <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                {isTamil
                  ? 'அரட்டையில் ஆவணத்தை இணைக்கவும் அல்லது புகைப்படம் எடுக்கவும் — தேவையான விவரங்கள் இங்கே தோன்றும்.'
                  : 'Attach a form or snap a photo in the assistant to activate your field checklist.'}
              </p>
            </div>
          ) : (
            fields.map((field, idx) => {
              const val =
                formData[field.name] ||
                formData[field.name.toLowerCase()] ||
                formData[field.label] ||
                '';
              const isFilled = Boolean(val && val.toString().trim());
              const isCurrentlyAsking = idx === firstUnfilledIndex;
              const isEditing = editingField === field.name;
              const label = isTamil && field.label_tamil ? field.label_tamil : field.label;

              return (
                <div
                  key={field.name}
                  className={`p-3 rounded-xl border transition-all duration-200 ${
                    isFilled
                      ? 'bg-white border-emerald-300 shadow-2xs'
                      : isCurrentlyAsking
                      ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20'
                      : 'bg-white border-dashed border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex-1 min-w-0">
                      {/* Status Pill & Label */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isFilled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            {isTamil ? 'முடிந்தது' : 'Answered'}
                          </span>
                        ) : isCurrentlyAsking ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {isTamil ? 'கேட்கப்படுகிறது...' : 'Asking now...'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            {isTamil ? 'காத்திருக்கிறது' : 'Waiting'}
                          </span>
                        )}

                        <span className="text-xs font-bold text-slate-800 truncate">
                          {label}
                          {field.required && <span className="text-red-500 ml-0.5">*</span>}
                        </span>
                      </div>

                      {/* Value Display / Editing */}
                      {isEditing ? (
                        <div className="mt-2 flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="text-xs px-2.5 py-1.5 border border-blue-500 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(field.name)}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer shrink-0"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <p
                          className={`text-xs mt-1.5 font-semibold break-words ${
                            isFilled
                              ? 'text-slate-900 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80 inline-block max-w-full'
                              : isCurrentlyAsking
                              ? 'text-amber-800 italic font-medium'
                              : 'text-slate-400 italic font-normal'
                          }`}
                        >
                          {isFilled
                            ? String(val)
                            : isCurrentlyAsking
                            ? isTamil
                              ? 'குரல் அல்லது உரை மூலம் பதிலளிக்கவும்...'
                              : 'Speak or type your answer now...'
                            : isTamil
                            ? 'குரல் பதிலுக்காக காத்திருக்கிறது...'
                            : 'Awaiting answer...'}
                        </p>
                      )}
                    </div>

                    {/* Edit button */}
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(field.name, String(val))}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0 mt-0.5"
                        title={isTamil ? 'மாற்றியமைக்க' : 'Edit field'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold">
          {error}
        </div>
      )}

      {/* Primary Action Button: Confirm & Generate Official PDF */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        {!downloadUrl ? (
          <button
            onClick={handleGeneratePdf}
            disabled={isGenerating || fields.length === 0}
            className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
              filledCount > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-98'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{isTamil ? 'PDF உருவாக்கப்படுகிறது...' : 'Generating Official PDF...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>
                  {isTamil
                    ? 'விவரங்களை உறுதிசெய்து PDF உருவாக்க'
                    : 'Confirm & Generate Filled PDF'}
                </span>
              </>
            )}
          </button>
        ) : (
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {isTamil ? 'PDF தயார்' : 'PDF Generated'}
            </span>
            <button
              onClick={() => setActiveTab(activeTab === 'preview' ? 'fields' : 'preview')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              {activeTab === 'preview' ? (isTamil ? 'படிவம் காண்க' : 'View Fields') : (isTamil ? 'PDF காண்க' : 'View PDF')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
