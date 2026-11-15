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
    <div className="flex-1 w-full flex flex-col min-h-0 bg-slate-50/70 rounded-2xl p-3 sm:p-4 border border-slate-200/80">
      {/* Sub-Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200/70 text-xs font-semibold text-slate-700">
        <span className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-600" />
          <span>{isTamil ? 'நேரலை உரையாடல்' : 'Conversation Thread'}</span>
        </span>
        {isAiSpeaking && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/80 animate-pulse">
            <Volume2 className="w-3.5 h-3.5 text-blue-600" />
            {isTamil ? 'பேசுகிறது...' : 'Speaking...'}
          </span>
        )}
      </div>

      {/* Messages Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scroll-smooth min-h-[280px]"
      >
        {/* Initial Welcome & Document Request Card (When no document attached yet) */}
        {!currentDocument && (
          <div className="flex gap-3 justify-start items-start">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>

            <div className="max-w-[95%] sm:max-w-[85%] space-y-3">
              <div className="bg-white rounded-2xl rounded-tl-sm p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/80">
                    VoiceFirst AI
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Assistant Ready
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                  {isTamil
                    ? 'வணக்கம்! நான் VoiceFirst AI. உங்கள் அரசு விண்ணப்பப் படிவங்களை விளக்கி, குரல் உரையாடல் மூலம் படிவத்தை முழுமையாக பூர்த்தி செய்ய நான் உங்களுக்கு உதவுவேன்.'
                    : 'Hello! I am VoiceFirst AI. I help you understand government documents and complete forms through natural voice conversations.'}
                </p>

                <p className="text-xs text-slate-600">
                  {isTamil
                    ? 'தொடங்குவதற்கு, கீழே உள்ள விருப்பங்கள் மூலம் படிவத்தை இணைக்கவும் அல்லது புகைப்படம் எடுக்கவும்:'
                    : 'To get started, please attach your document or take a clear photo of your paper form:'}
                </p>

                {/* Interactive Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Option 1: Take Photo */}
                  <button
                    type="button"
                    onClick={onTakePhoto}
                    className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200/80 hover:border-blue-300 text-left transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {isTamil ? 'புகைப்படம் எடுக்கவும்' : 'Take a Photo'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {isTamil ? 'கேமரா வழிகாட்டி' : 'Mobile camera frame'}
                      </span>
                    </div>
                  </button>

                  {/* Option 2: Attach Document */}
                  <button
                    type="button"
                    onClick={onAttachDoc}
                    className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200/80 hover:border-blue-300 text-left transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {isTamil ? 'ஆவணத்தை இணைக்கவும்' : 'Upload Document'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        PDF, JPG, PNG (Max 5MB)
                      </span>
                    </div>
                  </button>
                </div>

                {/* Option 3: Quick Demo Sample */}
                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {isTamil ? 'ஆவணம் கையில் இல்லையா?' : "Don't have a document on hand?"}
                  </span>
                  <button
                    type="button"
                    onClick={onTrySample}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isTamil ? 'மாதிரி படிவத்தை சோதிக்க' : 'Try Sample Form'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* In-Chat Analyzing Indicator */}
        {isAnalyzing && (
          <div className="flex gap-3 items-center p-3.5 bg-blue-50 rounded-xl border border-blue-200/80 animate-pulse text-xs font-semibold text-blue-900">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <span>
              {isTamil
                ? 'ஜெமினி விஷன் ஆவணத்தை ஆய்வு செய்து தகவல்களை கண்டறிகிறது...'
                : 'Gemini Multimodal Vision is analyzing document structure & required fields...'}
            </span>
          </div>
        )}

        {/* Attached Document Summary Banner in Chat */}
        {currentDocument && (
          <div className="p-3 bg-white border border-slate-200/90 rounded-xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                <FileText className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {currentDocument.filename}
                  </span>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                    Verified
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  {currentDocument.analysis.title} · {currentDocument.analysis.fields.length}{' '}
                  {isTamil ? 'விவரங்கள் தேவை' : 'fields required'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onAttachDoc}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer shrink-0"
            >
              {isTamil ? 'மாற்று' : 'Change'}
            </button>
          </div>
        )}

        {/* Chat Messages */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 sm:gap-3 items-start ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {!isUser && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 sm:p-4 text-xs sm:text-sm font-medium leading-relaxed shadow-xs transition-all ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold ${
                      isUser ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {isUser ? (isTamil ? 'நீங்கள்' : 'You') : 'VoiceFirst AI'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] ${
                        isUser ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                    {!isUser && (
                      <button
                        onClick={() => handleSpeak(msg.text)}
                        className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors cursor-pointer"
                        title={isTamil ? 'மீண்டும் கேட்க' : 'Replay Audio'}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>

              {isUser && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
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
