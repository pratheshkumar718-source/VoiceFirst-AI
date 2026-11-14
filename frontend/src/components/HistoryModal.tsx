import React, { useEffect, useState } from 'react';
import { X, FileText, Download, Clock, Loader2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              {isTamil ? 'கடந்த கால அமர்வுகள்' : 'Session History'}
            </h2>
            <p className="text-xs text-gray-500">
              {isTamil
                ? 'முன்பு சமர்ப்பிக்கப்பட்ட விண்ணப்பங்கள் மற்றும் ஆவணங்கள்'
                : 'Saved applications and processed government forms'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-7 h-7 text-blue-700 animate-spin" />
              <p className="text-xs font-semibold">Loading history...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">
                {isTamil ? 'கடந்த கால அமர்வுகள் எதுவும் இல்லை' : 'No past sessions recorded yet'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Completed forms will automatically appear here.
              </p>
            </div>
          ) : (
            sessions.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-gray-900 truncate">
                      {item.filename || 'Government Form'}
                    </h3>
                    <p className="text-[11px] text-gray-500 truncate">
                      ID: {item.session_id || item.doc_id || 'TN-PMS'}
                    </p>
                  </div>
                </div>

                {item.pdf_filename || item.pdf_url ? (
                  <a
                    href={api.getFileUrl(item.pdf_url || `/api/forms/download/${item.pdf_filename}`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold border border-teal-200 transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                ) : (
                  <span className="text-[10px] text-gray-400 font-medium bg-gray-200/60 px-2 py-0.5 rounded-md">
                    Analyzed
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
          >
            {isTamil ? 'மூடுக' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
