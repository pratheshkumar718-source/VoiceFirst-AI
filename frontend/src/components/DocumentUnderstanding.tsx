import React from 'react';
import { HelpCircle, ListChecks, Paperclip, FileText, Check } from 'lucide-react';
import type { DocumentAnalysis } from '../services/api';

interface DocumentUnderstandingProps {
  analysis?: DocumentAnalysis | null;
  language: string;
}

export const DocumentUnderstanding: React.FC<DocumentUnderstandingProps> = ({
  analysis,
  language,
}) => {
  const isTamil = language === 'ta';

  if (!analysis) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-8 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">
          {isTamil ? 'ஆவண விளக்கம் & வழிகாட்டுதல்' : 'Document Understanding Panel'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
          {isTamil
            ? 'அரசு படிவத்தைப் பதிவேற்றியவுடன் ஜெமினி AI அதன் நோக்கத்தையும் தேவையான விதிகளையும் இங்கே எளிதாக விளக்கும்.'
            : 'Upload a document or load a sample form to see Gemini Multimodal explanation, eligibility criteria, and required proofs.'}
        </p>
      </div>
    );
  }

  const explanation = isTamil && analysis.purpose_tamil ? analysis.purpose_tamil : analysis.purpose;
  const title = isTamil && analysis.title_tamil ? analysis.title_tamil : analysis.title;
  const instructions = isTamil && analysis.instructions_tamil ? analysis.instructions_tamil : analysis.instructions;

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5 transition-all">
      {/* Title & Badge */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 tracking-wider uppercase">
            {analysis.document_type || 'Official Form'}
          </span>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Govt. Verified
          </span>
        </div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{title}</h2>
      </div>

      {/* "What is this document about?" */}
      <div>
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-blue-900">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>{isTamil ? 'இந்த ஆவணம் எதை பற்றியது?' : 'What is this document about?'}</span>
        </h3>
        <div className="mt-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            {explanation}
          </p>
        </div>
      </div>

      {/* "Required Information to Fill" */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <ListChecks className="w-4 h-4 text-blue-600" />
            <span>{isTamil ? 'படிவத்தில் கேட்கப்படும் விவரங்கள்:' : 'Required Fields to Fill:'}</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-500">
            {analysis.fields.length} {isTamil ? 'புலங்கள்' : 'Fields'}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {analysis.fields.map((f, idx) => (
            <span
              key={idx}
              className="inline-flex items-center text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg"
            >
              {isTamil && f.label_tamil ? f.label_tamil : f.label}
              {f.required && <span className="text-red-500 font-bold ml-0.5">*</span>}
            </span>
          ))}
        </div>
      </div>

      {/* "Supporting Documents Needed" */}
      {analysis.supporting_documents && analysis.supporting_documents.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider mb-2">
            <Paperclip className="w-4 h-4 text-indigo-600" />
            <span>{isTamil ? 'இணைக்க வேண்டிய சான்றிதழ்கள்:' : 'Required Supporting Proofs:'}</span>
          </h3>
          <ul className="space-y-1.5">
            {analysis.supporting_documents.map((doc, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950 font-medium"
              >
                <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{isTamil && doc.name_tamil ? doc.name_tamil : doc.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructions */}
      {instructions && (
        <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium leading-relaxed">
          <span className="font-bold text-slate-700 mr-1">{isTamil ? 'குறிப்பு:' : 'Note:'}</span>
          {instructions}
        </div>
      )}
    </div>
  );
};
