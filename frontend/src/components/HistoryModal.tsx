import React, { useEffect, useState } from 'react';
import { X, FileText, Clock, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api
        .getHistory()
        .then((res) => {
          setSessions(res.sessions || []);
        })
        .catch((err) => {
          console.error('Failed to load history:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isTamil = language === 'ta';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200/90 flex flex-col max-h-[85vh] animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span>{isTamil ? 'சமீபத்திய விண்ணப்பங்கள்' : 'Session History'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTamil
                ? 'முன்பு பூர்த்தி செய்யப்பட்ட அரசு ஆவணங்கள் மற்றும் படிவங்கள்'
                : 'Previously completed forms and generated PDF files'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <p className="text-xs font-semibold">Loading previous sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center px-4 space-y-2">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {isTamil ? 'முந்தைய ஆவணங்கள் இல்லை' : 'No Previous Sessions Found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs">
                {isTamil
                  ? 'விண்ணப்பத்தை பூர்த்தி செய்து PDF உருவாக்கினால் இங்கே தானாக சேமிக்கப்படும்.'
                  : 'Completed forms and generated documents will appear here automatically.'}
              </p>
            </div>
          ) : (
            sessions.map((session, idx) => (
              <div
                key={session.doc_id || idx}
                className="p-3.5 bg-slate-50 hover:bg-white rounded-xl border border-slate-200/80 hover:border-blue-300 transition-all flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {session.filename || 'Government Application'}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {session.analysis?.title || 'Form Analysis Ready'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    Saved
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            {isTamil ? 'மூடு' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
