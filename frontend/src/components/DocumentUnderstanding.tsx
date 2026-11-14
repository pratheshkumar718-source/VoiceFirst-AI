import React from 'react';
import { HelpCircle, ListChecks, Paperclip, CheckCircle2, ShieldAlert } from 'lucide-react';
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
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-black text-slate-700">
          {isTamil ? 'ஆவண விளக்கம் & விதிகள்' : 'Document Understanding Panel'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
          {isTamil
            ? 'அரசு படிவத்தைப் பதிவேற்றியவுடன் ஜெமினி AI அதன் நோக்கத்தையும் தேவையான விதிகளையும் இங்கே எளிதாக விளக்கும்.'
            : 'Upload or load a sample document to see Gemini Multimodal explanation, eligibility criteria, and required proofs.'}
        </p>
      </div>
    );
  }

  const explanation = isTamil && analysis.purpose_tamil ? analysis.purpose_tamil : analysis.purpose;
  const title = isTamil && analysis.title_tamil ? analysis.title_tamil : analysis.title;
  const instructions = isTamil && analysis.instructions_tamil ? analysis.instructions_tamil : analysis.instructions;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5 transition-all">
      {/* Title & Badge */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 tracking-wider uppercase">
            {analysis.document_type}
          </span>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            Govt. Verified
          </span>
        </div>
        <h2 className="text-base font-black text-slate-900 leading-snug">{title}</h2>
      </div>

      {/* "What is this document?" */}
      <div>
        <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-blue-900">
          <HelpCircle className="w-4 h-4 text-blue-700" />
          {isTamil ? 'இந்த ஆவணம் எதை பற்றியது?' : 'What is this document about?'}
        </h3>
        <div className="mt-2 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 p-3.5 rounded-2xl border border-blue-100">
          <p className="text-xs text-slate-800 font-medium leading-relaxed">
            {explanation}
          </p>
        </div>
      </div>

      {/* "Required Information to Fill:" */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <ListChecks className="w-4 h-4 text-teal-600" />
            {isTamil ? 'படிவத்தில் கேட்கப்படும் விவரங்கள்:' : 'Required Fields to Fill:'}
          </h3>
          <span className="text-[10px] font-bold text-slate-500">
            {analysis.fields.length} {isTamil ? 'விவரங்கள்' : 'Fields'}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {analysis.fields.map((f, idx) => (
            <span
              key={idx}
              className="inline-flex items-center text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg"
            >
              {isTamil && f.label_tamil ? f.label_tamil : f.label}
              {f.required && <span className="text-red-500 font-black ml-0.5">*</span>}
            </span>
          ))}
        </div>
      </div>

      {/* "Supporting Documents Needed:" */}
      {analysis.supporting_documents && analysis.supporting_documents.length > 0 && (
        <div>
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider mb-2">
            <Paperclip className="w-4 h-4 text-amber-600" />
            {isTamil ? 'இணைக்க வேண்டிய சான்றிதழ்கள்:' : 'Required Supporting Proofs:'}
          </h3>
          <ul className="space-y-1.5">
            {analysis.supporting_documents.map((doc, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-700 flex items-center justify-between bg-amber-50/50 px-3 py-2 rounded-xl border border-amber-100"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold text-slate-800">
                    {isTamil && doc.name_tamil ? doc.name_tamil : doc.name}
                  </span>
                </div>
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-100/70 px-2 py-0.5 rounded-md">
                  Mandatory
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Official Guidelines Note */}
      {instructions && (
        <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-3 flex items-start gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
          <span className="italic leading-relaxed">{instructions}</span>
        </div>
      )}
    </div>
  );
};
