import React, { useEffect, useRef } from 'react';
import { Bot, User, Volume2, Sparkles, Camera, FileText, Loader2 } from 'lucide-react';
import type { ChatMessage } from '../hooks/useWebSocket';
import type { UploadResponse } from '../services/api';

interface ConversationDisplayProps {
  messages: ChatMessage[];
  isAiSpeaking?: boolean;
  language?: string;
  currentDocument?: UploadResponse | null;
  isAnalyzing?: boolean;
  onTakePhoto?: () => void;
  onAttachDoc?: () => void;
  onTrySample?: () => void;
  onSpeakText?: (text: string) => void;
}

export const ConversationDisplay: React.FC<ConversationDisplayProps> = ({
  messages,
  isAiSpeaking,
  language = 'en',
  currentDocument,
  isAnalyzing = false,
  onTakePhoto,
  onAttachDoc,
  onTrySample,
  onSpeakText,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isTamil = language === 'ta';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiSpeaking, isAnalyzing, currentDocument]);

  const handleSpeak = (text: string) => {
    if (onSpeakText) {
      onSpeakText(text);
      return;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isTamil ? 'ta-IN' : 'en-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col min-h-0 bg-slate-50/50 rounded-2xl p-3 sm:p-4 border border-slate-200/80">
      {/* Chat Sub-Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200 text-xs font-bold text-slate-700">
        <span className="flex items-center gap-1.5">
          <Bot className="w-4 h-4 text-blue-700" />
          {isTamil ? 'நேரலை உரையாடல்' : 'Live Chat Thread'}
        </span>
        {isAiSpeaking && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 animate-pulse">
            <Volume2 className="w-3.5 h-3.5 text-teal-600" />
            {isTamil ? 'பேசுகிறது...' : 'Speaking...'}
          </span>
        )}
      </div>

      {/* Messages Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3.5 pr-2 scroll-smooth min-h-[300px] max-h-[460px]"
      >
        {/* Initial Welcome & Document Request Card (When no document attached yet) */}
        {!currentDocument && (
          <div className="flex gap-2.5 sm:gap-3 justify-start items-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>

            <div className="max-w-[95%] sm:max-w-[85%] space-y-3">
              <div className="bg-white rounded-2xl rounded-tl-none p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    VoiceFirst AI
                  </span>
                  <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                  {isTamil
                    ? 'வணக்கம்! நான் VoiceFirst AI. உங்கள் அரசு அல்லது வங்கி விண்ணப்பப் படிவத்தை குரல் உரையாடல் மூலம் எளிதாக பூர்த்தி செய்ய நான் உங்களுக்கு உதவுவேன்.'
                    : 'Hello! I am VoiceFirst AI. I help you understand and complete official forms through natural voice conversations.'}
                </p>

                <p className="text-xs text-slate-600 font-medium">
                  {isTamil
                    ? 'தொடங்குவதற்கு, கீழே உங்கள் படிவத்தை தெளிவாக புகைப்படம் எடுக்கவும் அல்லது ஆவணத்தை இணைக்கவும்:'
                    : 'To get started, please take a clean photo of your paper form, or attach the document below:'}
                </p>

                {/* Interactive Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Option 1: Take a Clean Photo */}
                  <button
                    type="button"
                    onClick={onTakePhoto}
                    className="flex items-center gap-3 p-3 bg-gradient-to-tr from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 rounded-xl border border-teal-200 text-left transition-all hover:shadow-xs group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">
                        {isTamil ? 'புகைப்படம் எடுக்கவும்' : 'Take a Clean Photo'}
                      </span>
                      <span className="text-[10px] text-teal-800 font-semibold">
                        {isTamil ? 'கேமரா மூலம் படம் பிடி' : 'Camera with guide frame'}
                      </span>
                    </div>
                  </button>

                  {/* Option 2: Attach Document */}
                  <button
                    type="button"
                    onClick={onAttachDoc}
                    className="flex items-center gap-3 p-3 bg-gradient-to-tr from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl border border-blue-200 text-left transition-all hover:shadow-xs group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">
                        {isTamil ? 'ஆவணத்தை இணைக்கவும்' : 'Attach Document'}
                      </span>
                      <span className="text-[10px] text-blue-800 font-semibold">
                        PDF, JPG, PNG (Max 5MB)
                      </span>
                    </div>
                  </button>
                </div>

                {/* Option 3: Quick Demo Sample */}
                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {isTamil ? 'ஆவணம் கையில் இல்லையா?' : "Don't have a document on hand?"}
                  </span>
                  <button
                    type="button"
                    onClick={onTrySample}
                    className="text-xs font-black text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>{isTamil ? 'மாதிரி படிவத்தை சோதிக்க' : 'Try Sample Form'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* In-Chat Analyzing Indicator */}
        {isAnalyzing && (
          <div className="flex gap-3 items-center p-3.5 bg-blue-50 rounded-2xl border border-blue-200 animate-pulse text-xs font-bold text-blue-900">
            <Loader2 className="w-4 h-4 animate-spin text-blue-700 shrink-0" />
            <span>
              {isTamil
                ? 'ஜெமினி விஷன் ஆவணத்தை ஆய்வு செய்து தகவல்களை கண்டறிகிறது...'
                : 'Gemini Multimodal Vision is analyzing document structure & required fields...'}
            </span>
          </div>
        )}

        {/* Attached Document Summary Banner in Chat */}
        {currentDocument && (
          <div className="p-3 bg-gradient-to-r from-blue-50 to-teal-50 border border-teal-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-900 truncate">
                    {currentDocument.filename}
                  </span>
                  <span className="text-[10px] font-black bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-300 shrink-0">
                    ✓ Verified
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold truncate">
                  {currentDocument.analysis.title} · {currentDocument.analysis.fields.length}{' '}
                  {isTamil ? 'விவரங்கள் தேவை' : 'fields identified'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onAttachDoc}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs shrink-0 cursor-pointer"
            >
              {isTamil ? 'மாற்ற' : 'Change'}
            </button>
          </div>
        )}

        {/* Conversation Dialogue Messages */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-2xl p-3.5 shadow-xs text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-700 text-white rounded-tr-none font-medium'
                      : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  <div className="flex items-center justify-between gap-3 mt-1.5 pt-1 border-t border-slate-100/30">
                    <span
                      className={`text-[10px] font-semibold ${
                        isUser ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>

                    {!isUser && (
                      <button
                        onClick={() => handleSpeak(msg.text)}
                        className="text-slate-400 hover:text-blue-700 transition-colors cursor-pointer p-0.5 rounded"
                        title={isTamil ? 'குரல் மூலம் கேட்க' : 'Listen to Audio'}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
