import React, { useState } from 'react';
import {
  FileCheck2,
  Edit2,
  Check,
  Download,
  Loader2,
  Sparkles,
  CheckCircle,
  Info,
  Clock,
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

    // Check lowercase
    const lowerVal = formData[f.name.toLowerCase()];
    if (lowerVal && lowerVal.toString().trim()) return true;

    // Check label
    const labelVal = formData[f.label];
    if (labelVal && labelVal.toString().trim()) return true;

    return false;
  }).length;

  const totalCount = fields.length || 1;
  const percentage = Math.round((filledCount / totalCount) * 100);

  // Find the first unfilled field to mark as "currently asking"
  const firstUnfilledIndex = fields.findIndex((f) => {
    const val = formData[f.name] || formData[f.name.toLowerCase()] || formData[f.label];
    return !val || !val.toString().trim();
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col space-y-3.5 transition-all h-full">
      {/* Header & Live Progress */}
      <div className="border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
                <FileCheck2 className="w-5 h-5 text-teal-600" />
                {isTamil ? 'படிவப் பூர்த்தி நிலை' : 'Application Tracker'}
              </h2>
              {documentPurpose && (
                <button
                  type="button"
                  onClick={() => setShowDocInfo(!showDocInfo)}
                  className="text-slate-400 hover:text-blue-700 p-1 rounded-md transition-colors cursor-pointer"
                  title={isTamil ? 'ஆவண நோக்கம் பார்க்க' : 'View document purpose'}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {isTamil
                ? 'நேரலையாக புதுப்பிக்கப்படும் தகவல்கள்'
                : 'Real-Time Dynamic Field Status'}
            </p>
          </div>

          <div className="text-right">
            <span
              className={`text-xs font-black px-3 py-1 rounded-full border transition-all ${filledCount > 0
                  ? 'text-emerald-800 bg-emerald-50 border-emerald-200 shadow-2xs'
                  : 'text-slate-600 bg-slate-100 border-slate-200'
                }`}
            >
              {filledCount} / {fields.length} {isTamil ? 'முடிந்தது' : 'Answered'}
            </span>
          </div>
        </div>

        {/* Collapsible Document Info */}
        {showDocInfo && documentPurpose && (
          <div className="my-2.5 p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs space-y-1.5 transition-all">
            <p className="font-bold text-blue-950">{documentPurpose}</p>
            {supportingDocuments.length > 0 && (
              <div className="pt-1 border-t border-blue-200/50">
                <span className="font-extrabold text-[11px] text-blue-900 block mb-0.5">
                  {isTamil ? 'தேவையான ஆவணங்கள்:' : 'Supporting Documents:'}
                </span>
                <ul className="list-disc list-inside text-[11px] text-blue-800">
                  {supportingDocuments.map((doc, i) => (
                    <li key={i}>{isTamil && doc.name_tamil ? doc.name_tamil : doc.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mt-2 border border-slate-200/50">
          <div
            className="bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500 shadow-2xs"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mt-1 px-0.5">
          <span>{percentage}% Completed</span>
          {filledCount === fields.length && fields.length > 0 && (
            <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
              <Check className="w-3 h-3" /> Ready to submit
            </span>
          )}
        </div>
      </div>

      {/* Field Cards Stream */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scroll-smooth max-h-[380px]">
        {fields.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center shadow-xs">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="text-xs sm:text-sm font-black text-slate-800">
              {isTamil ? 'படிவக் கண்காணிப்பு தயார்' : 'Application Tracker Ready'}
            </h4>
            <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed font-medium">
              {isTamil
                ? 'அரட்டையில் ஆவணத்தை புகைப்படம் 📸 எடுக்கவும் அல்லது இணைக்கவும் 📎 — தேவையான விவரங்கள் இங்கே தோன்றும்.'
                : 'Take a photo 📸 or attach a document 📎 in the chatbot to activate your dynamic field checklist.'}
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
                className={`p-3 rounded-2xl border transition-all duration-300 ${isFilled
                    ? 'bg-emerald-50/40 border-emerald-300/80 shadow-2xs ring-1 ring-emerald-400/20'
                    : isCurrentlyAsking
                      ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/30'
                      : 'bg-white border-dashed border-slate-200'
                  }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex-1 min-w-0">
                    {/* Status Pill & Field Label */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isFilled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          {isTamil ? 'பதிவானது' : 'Answered'}
                        </span>
                      ) : isCurrentlyAsking ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {isTamil ? 'இப்போது கேட்கப்படுகிறது...' : 'Asking now...'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                          {isTamil ? 'காத்திருக்கிறது' : 'Waiting'}
                        </span>
                      )}

                      <span className="text-xs font-black text-slate-800 truncate">
                        {label}
                        {field.required && <span className="text-red-500 ml-0.5">*</span>}
                      </span>
                    </div>

                    {/* Value Display / Inline Editing */}
                    {isEditing ? (
                      <div className="mt-2 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="text-xs px-2.5 py-1.5 border border-blue-500 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
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
                        className={`text-xs mt-1.5 font-bold break-words ${isFilled
                            ? 'text-slate-900 bg-white/80 px-2 py-1 rounded-lg border border-emerald-200/60 inline-block max-w-full'
                            : isCurrentlyAsking
                              ? 'text-amber-800 italic font-semibold'
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

                  {/* Edit icon */}
                  {!isEditing && (
                    <button
                      onClick={() => handleStartEdit(field.name, String(val))}
                      className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0 mt-0.5"
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

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
          {error}
        </div>
      )}

      {/* Action Buttons: Confirm & Generate PDF */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        {!downloadUrl ? (
          <button
            onClick={handleGeneratePdf}
            disabled={isGenerating || fields.length === 0}
            className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${filledCount > 0
                ? 'bg-gradient-to-r from-blue-700 to-teal-600 hover:from-blue-800 hover:to-teal-700 text-white shadow-blue-500/20'
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
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  {isTamil
                    ? 'விவரங்களை உறுதிசெய்து PDF உருவாக்க'
                    : 'Confirm & Generate Filled PDF'}
                </span>
              </>
            )}
          </button>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-black truncate">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">{isTamil ? 'PDF உருவாக்கப்பட்டது!' : 'PDF Ready!'}</span>
              </div>
              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={isGenerating}
                className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer shrink-0"
              >
                {isTamil ? 'மீண்டும் உருவாக்கு' : 'Regenerate'}
              </button>
            </div>
            {generatedFilename && (
              <p className="text-[10px] text-slate-500 font-semibold truncate bg-white/70 px-2 py-1 rounded-md border border-emerald-100">
                📄 {generatedFilename}
              </p>
            )}
            <a
              href={downloadUrl?.startsWith('http') ? downloadUrl : `http://127.0.0.1:8000${downloadUrl}`}
              download={generatedFilename || 'application.pdf'}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isTamil ? 'PDF பதிவிறக்கம் செய்க' : 'Download Completed PDF'}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
