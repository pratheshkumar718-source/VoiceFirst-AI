import React, { useState, useRef } from 'react';
import { Mic, Loader2, Sparkles, Send, Paperclip, Camera } from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import { ConversationDisplay } from './ConversationDisplay';
import { CameraCaptureModal } from './CameraCaptureModal';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useWebSocket } from '../hooks/useWebSocket';
import { api } from '../services/api';
import type { UploadResponse } from '../services/api';

interface VoiceAssistantProps {
  language: string;
  documentContext?: any;
  currentDocument?: UploadResponse | null;
  onFieldDetected?: (field: string, value: string) => void;
  onDocumentAnalyzed?: (response: UploadResponse) => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  language,
  documentContext,
  currentDocument,
  onFieldDetected,
  onDocumentAnalyzed,
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isTamil = language === 'ta';

  const {
    status: wsStatus,
    messages,
    isAiSpeaking,
    serverMode,
    connect,
    sendAudioChunk,
    sendTextMessage,
  } = useWebSocket({
    language,
    documentContext,
    onFieldDetected,
    onTurnComplete: () => {
      setIsProcessing(false);
    },
  });

  const {
    isRecording,
    volume,
    error: micError,
    startRecording,
    stopRecording,
    getAnalyserData,
  } = useAudioRecorder({
    onAudioChunk: (pcmBase64) => {
      sendAudioChunk(pcmBase64);
    },
  });

  const handleMicToggle = async () => {
    if (isRecording) {
      stopRecording();
      setIsProcessing(true);
    } else {
      if (wsStatus === 'disconnected') {
        connect();
      }
      await startRecording();
    }
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (wsStatus === 'disconnected') {
      connect();
    }

    sendTextMessage(inputText.trim());
    setInputText('');
    setIsProcessing(true);
  };

  const handleQuickPromptClick = (text: string) => {
    if (wsStatus === 'disconnected') {
      connect();
    }
    sendTextMessage(text);
    setIsProcessing(true);
  };

  // Document ingestion via Photo or File
  const handleProcessFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setDocUploadError(
        isTamil ? 'கோப்பு 5MB அளவிற்குள் இருக்க வேண்டும்.' : 'File size must be under 5MB.'
      );
      return;
    }

    try {
      setDocUploadError(null);
      setIsAnalyzingDoc(true);
      const res = await api.uploadDocument(file, language);
      onDocumentAnalyzed?.(res);
      if (wsStatus === 'disconnected') {
        connect();
      }
    } catch (err: any) {
      console.error('Document analysis error:', err);
      setDocUploadError(err.message || 'Failed to analyze document');
    } finally {
      setIsAnalyzingDoc(false);
    }
  };

  const handleSampleLoad = async () => {
    try {
      setDocUploadError(null);
      setIsAnalyzingDoc(true);
      const res = await api.loadSampleDocument(language);
      onDocumentAnalyzed?.(res);
      if (wsStatus === 'disconnected') {
        connect();
      }
    } catch (err: any) {
      console.error('Sample load error:', err);
      setDocUploadError('Could not load sample document');
    } finally {
      setIsAnalyzingDoc(false);
    }
  };

  const quickPrompts = isTamil
    ? [
        { text: 'இந்த படிவம் எதை பற்றியது?', label: '1. படிவம் நோக்கம்' },
        { text: 'என்னென்ன தகவல்கள் தேவை?', label: '2. தேவையான விவரங்கள்' },
        { text: 'என் பெயர் கார்த்திக் ராஜா', label: '3. பெயர்: கார்த்திக்' },
        { text: 'பிறந்த தேதி 14/05/2003', label: '4. பிறந்த தேதி' },
        { text: 'ஆதார் எண் 5482 9104 3821', label: '5. ஆதார் எண்' },
        { text: 'ஆண்டு வருமானம் ₹1,40,000', label: '6. வருமானம்' },
        { text: 'படிவம் சரி, உறுதி செய்க', label: '7. சமர்ப்பிக்க' },
      ]
    : [
        { text: 'What is this form about?', label: '1. Explain Document' },
        { text: 'What information do I need?', label: '2. Required Details' },
        { text: 'My name is Karthik Raja', label: '3. Name: Karthik' },
        { text: 'Date of birth is 14/05/2003', label: '4. Date of Birth' },
        { text: 'Aadhaar number is 5482 9104 3821', label: '5. Aadhaar Number' },
        { text: 'Annual income is 1,40,000', label: '6. Annual Income' },
        { text: 'All information is correct, submit form', label: '7. Submit Application' },
      ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col h-full transition-all">
      {/* Top Header of Chatbot */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-teal-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              {isTamil ? 'VoiceFirst AI நேரலை அரட்டை' : 'VoiceFirst AI Chatbot'}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {isTamil
                ? 'நேரலை குரல் அல்லது உரை மூலம் பேசவும் — ஜெமினி மல்டிமோடல்'
                : 'Multimodal Voice & Vision Chatbot — Gemini Live'}
            </p>
          </div>
        </div>

        {/* Live Status Indicator Pill */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              wsStatus === 'connected'
                ? isRecording
                  ? 'bg-red-500 ring-4 ring-red-100 animate-pulse'
                  : 'bg-emerald-500 ring-4 ring-emerald-100'
                : wsStatus === 'connecting'
                ? 'bg-amber-500 animate-ping'
                : 'bg-slate-400'
            }`}
          />
          <span className="text-[11px] font-bold text-slate-700">
            {isRecording
              ? isTamil ? 'குரல் கேட்கிறது...' : 'Listening...'
              : wsStatus === 'connected'
              ? serverMode === 'gemini_live'
                ? 'Gemini Live'
                : isTamil ? 'உதவியாளர் தயார்' : 'Assistant Ready'
              : wsStatus}
          </span>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <ConversationDisplay
        messages={messages}
        isAiSpeaking={isAiSpeaking}
        language={language}
        currentDocument={currentDocument}
        isAnalyzing={isAnalyzingDoc}
        onTakePhoto={() => setIsCameraOpen(true)}
        onAttachDoc={() => fileInputRef.current?.click()}
        onTrySample={handleSampleLoad}
      />

      {/* Document Upload Error Alert */}
      {docUploadError && (
        <p className="mt-2 text-xs text-red-600 font-bold bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
          {docUploadError}
        </p>
      )}

      {/* Real-time Waveform when recording or speaking */}
      {(isRecording || isAiSpeaking) && (
        <div className="mt-2.5 px-2 py-1 bg-teal-50/60 rounded-xl border border-teal-200/60 transition-all">
          <AudioWaveform
            isRecording={isRecording}
            isAiSpeaking={isAiSpeaking}
            volume={volume}
            getAnalyserData={getAnalyserData}
          />
        </div>
      )}

      {/* Quick Interactive Prompt Suggestions (when document loaded) */}
      {currentDocument && (
        <div className="mt-2.5 mb-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPromptClick(qp.text)}
                className="text-[11px] whitespace-nowrap bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 px-3 py-1.5 rounded-full border border-slate-200/90 shadow-2xs transition-all font-semibold cursor-pointer shrink-0"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Microphone Error Alert */}
      {micError && (
        <p className="my-1.5 text-xs text-red-600 text-center font-bold bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
          {micError}
        </p>
      )}

      {/* Docked Modern Chatbot Input Bar */}
      <form onSubmit={handleSendText} className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t border-slate-100">
        {/* Attach File Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzingDoc}
          className="p-2.5 sm:p-3 rounded-2xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shrink-0"
          title={isTamil ? 'ஆவணத்தை இணைக்கவும் (PDF / படம்)' : 'Attach document (PDF / Image)'}
        >
          <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Take Photo Button */}
        <button
          type="button"
          onClick={() => setIsCameraOpen(true)}
          disabled={isAnalyzingDoc}
          className="p-2.5 sm:p-3 rounded-2xl bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 border border-slate-200 hover:border-teal-300 transition-all cursor-pointer shrink-0"
          title={isTamil ? 'படிவத்தை புகைப்படம் எடுக்கவும்' : 'Take a clean photo of document'}
        >
          <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Microphone Button */}
        <button
          type="button"
          onClick={handleMicToggle}
          disabled={isProcessing}
          aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
          className={`relative p-2.5 sm:p-3 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-xs cursor-pointer shrink-0 ${
            isRecording
              ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-200 scale-105'
              : isProcessing
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-400'
          }`}
          title={
            isRecording
              ? isTamil ? 'பதிவை நிறுத்தவும்' : 'Stop voice recording'
              : isTamil ? 'குரல் மூலம் பேச அழுத்தவும்' : 'Click to speak'
          }
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <Mic className={`w-4 h-4 sm:w-5 sm:h-5 ${isRecording ? 'animate-bounce' : ''}`} />
          )}
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isRecording
                ? isTamil ? '🎤 குரல் பதிவு செயலில் உள்ளது...' : '🎤 Voice recording active...'
                : !currentDocument
                ? isTamil
                  ? 'படிவத்தை இணைக்கவும் / படம் எடுக்கவும் அல்லது பேசவும்...'
                  : 'Attach form / take photo or type a question...'
                : isTamil
                ? 'உங்கள் பதிலை தமிழில் / ஆங்கிலத்தில் தட்டச்சு செய்யவும்...'
                : 'Ask a question or type your answer in Tamil/English...'
            }
            className="w-full text-xs sm:text-sm pl-3.5 pr-3 py-2.5 sm:py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-2xs font-medium placeholder:text-slate-400"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="p-2.5 sm:p-3 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer shrink-0"
          title={isTamil ? 'அனுப்பவும்' : 'Send message'}
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleProcessFile(e.target.files[0]);
            }
          }}
        />
      </form>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handleProcessFile}
        language={language}
      />
    </div>
  );
};
