import React, { useState, useRef, useEffect } from 'react';
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
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
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

  // Browser Native Speech Recognition for Instant 100% Speech-to-Text
  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechNotice(
        isTamil
          ? 'இந்த உலாவி குரல் ஏற்பிய ஆதரிக்கவில்லை. கீழே தட்டச்சு செய்யவும்.'
          : 'Voice speech recognition not supported in this browser. Please type below.'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      setSpeechNotice(null);
      transcriptRef.current = '';
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const recognized = (final + interim).trim();
        if (recognized) {
          transcriptRef.current = recognized;
          setLiveTranscript(recognized);
          setInputText(recognized);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition notice:', e.error);
        if (e.error === 'not-allowed') {
          setSpeechNotice(
            isTamil
              ? 'மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது. உலாவி அமைப்புகளில் அனுமதியை இயக்கவும்.'
              : 'Microphone permission denied. Please allow microphone access in your browser.'
          );
        } else if (e.error === 'audio-capture') {
          setSpeechNotice(
            isTamil
              ? 'மைக்ரோஃபோன் கண்டறியப்படவில்லை. மற்றொரு மைக்ரோஃபோனை சரிபார்க்கவும்.'
              : 'No microphone found or in use by another app.'
          );
        }
      };

      recognition.onend = () => {
        // Recognition completed
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.warn('Could not start speech recognition:', err);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopSpeechRecognition();
    };
  }, []);

  const handleMicToggle = async () => {
    if (isRecording) {
      stopRecording();
      stopSpeechRecognition();
      setIsProcessing(true);

      // Auto-send recognized speech or typed text
      const textToSend = transcriptRef.current.trim() || liveTranscript.trim() || inputText.trim();
      if (textToSend) {
        if (wsStatus === 'disconnected') {
          connect();
        }
        sendTextMessage(textToSend);
        setInputText('');
        setLiveTranscript('');
        transcriptRef.current = '';
      } else {
        setIsProcessing(false);
      }
    } else {
      setLiveTranscript('');
      transcriptRef.current = '';
      setSpeechNotice(null);
      if (wsStatus === 'disconnected') {
        connect();
      }
      await startRecording();
      startSpeechRecognition();
    }
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim() || liveTranscript.trim();
    if (!textToSend) return;

    if (wsStatus === 'disconnected') {
      connect();
    }

    sendTextMessage(textToSend);
    setInputText('');
    setLiveTranscript('');
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
        { text: 'என் பெயர் சித் (Sid)', label: '3. பெயர்: சித்' },
        { text: 'பிறந்த தேதி 14/05/2003', label: '4. பிறந்த தேதி' },
        { text: 'ஆதார் எண் 5482 9104 3821', label: '5. ஆதார் எண்' },
        { text: 'ஆண்டு வருமானம் ₹1,40,000', label: '6. வருமானம்' },
        { text: 'படிவம் சரி, உறுதி செய்க', label: '7. சமர்ப்பிக்க' },
      ]
    : [
        { text: 'What is this form about?', label: '1. Explain Document' },
        { text: 'What information do I need?', label: '2. Required Details' },
        { text: 'My name is Sid', label: '3. Name: Sid' },
        { text: 'Date of birth is 14/05/2003', label: '4. Date of Birth' },
        { text: 'Aadhaar number is 5482 9104 3821', label: '5. Aadhaar Number' },
        { text: 'Annual income is 1,40,000', label: '6. Annual Income' },
        { text: 'All information is correct, submit form', label: '7. Submit Application' },
      ];

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col h-full transition-all">
      {/* Header of Voice Assistant */}
      <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              {isTamil ? 'VoiceFirst AI நேரலை உரையாடல்' : 'VoiceFirst AI Live Assistant'}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {isTamil
                ? 'நேரலை குரல் அல்லது உரை மூலம் பேசவும் — ஜெமினி மல்டிமோடல்'
                : 'Real-time bidirectional speech & multimodal understanding'}
            </p>
          </div>
        </div>

        {/* Live Status Indicator Pill */}
        <button
          type="button"
          onClick={() => connect()}
          title="Click to reconnect or check status"
          className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/80 transition-colors cursor-pointer"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              wsStatus === 'connected'
                ? isRecording
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-emerald-500'
                : wsStatus === 'connecting'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-slate-400'
            }`}
          />
          <span className="text-[11px] font-semibold text-slate-700">
            {isRecording
              ? isTamil ? 'குரல் கேட்கிறது...' : 'Listening...'
              : wsStatus === 'connected'
              ? serverMode === 'gemini_live'
                ? 'Gemini Live'
                : isTamil ? 'உதவியாளர் தயார்' : 'Online'
              : wsStatus === 'connecting'
              ? isTamil ? 'இணைக்கிறது...' : 'Connecting...'
              : isTamil ? 'இணைக்க கிளிக் செய்' : 'Click to Connect'}
          </span>
        </button>
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
        <p className="mt-2 text-xs text-red-600 font-semibold bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
          {docUploadError}
        </p>
      )}

      {/* Waveform Visualization & Live Speech Transcription */}
      {(isRecording || isAiSpeaking) && (
        <div className="mt-2.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80 transition-all space-y-1.5">
          <AudioWaveform
            isRecording={isRecording}
            isAiSpeaking={isAiSpeaking}
            volume={volume}
            getAnalyserData={getAnalyserData}
          />
          {isRecording && (
            <div className="text-center">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-block">
                {liveTranscript
                  ? `🎤 "${liveTranscript}"`
                  : isTamil
                  ? '🎤 உங்கள் குரல் கேட்கிறது... பேசவும்'
                  : '🎤 Listening to your voice... Speak now'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Quick Interactive Prompt Suggestions */}
      {currentDocument && (
        <div className="mt-2.5 mb-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPromptClick(qp.text)}
                className="text-[11px] whitespace-nowrap bg-white hover:bg-blue-600 hover:text-white text-slate-700 px-3 py-1 rounded-full border border-slate-200/90 shadow-2xs hover:border-transparent transition-all font-semibold cursor-pointer shrink-0"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Microphone Error Alert */}
      {micError && (
        <p className="my-1.5 text-xs text-red-600 text-center font-semibold bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
          {micError}
        </p>
      )}

      {/* Speech Notice Alert */}
      {speechNotice && (
        <p className="my-1.5 text-xs text-amber-700 text-center font-medium bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
          {speechNotice}
        </p>
      )}

      {/* Modern SaaS Input Bar with Large Mic Button */}
      <form onSubmit={handleSendText} className="flex items-center gap-2 pt-2.5 border-t border-slate-100">
        {/* Attach File Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzingDoc}
          className="p-2.5 sm:p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-blue-600 border border-slate-200 transition-all cursor-pointer shrink-0"
          title={isTamil ? 'ஆவணத்தை இணைக்கவும்' : 'Attach document'}
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Take Photo Button */}
        <button
          type="button"
          onClick={() => setIsCameraOpen(true)}
          disabled={isAnalyzingDoc}
          className="p-2.5 sm:p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-blue-600 border border-slate-200 transition-all cursor-pointer shrink-0"
          title={isTamil ? 'புகைப்படம் எடுக்கவும்' : 'Take a photo of document'}
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Large Animated Circular Microphone Button */}
        <button
          type="button"
          onClick={handleMicToggle}
          disabled={isProcessing}
          aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
          className={`relative p-3 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer shrink-0 ${
            isRecording
              ? 'bg-red-600 text-white mic-recording-pulse ring-4 ring-red-200 scale-105'
              : isProcessing
              ? 'bg-blue-100 text-blue-600'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 hover:scale-105 active:scale-95'
          }`}
          title={
            isRecording
              ? isTamil ? 'பதிவை நிறுத்தவும்' : 'Stop voice recording'
              : isTamil ? 'குரல் மூலம் பேச அழுத்தவும்' : 'Click to speak'
          }
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Mic className={`w-5 h-5 ${isRecording ? 'animate-bounce' : ''}`} />
          )}
        </button>

        {/* Text Input Field */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isRecording
                ? isTamil ? '🎤 கேட்கிறது... பேசவும்' : '🎤 Listening to your voice... Speak now'
                : !currentDocument
                ? isTamil
                  ? 'படிவத்தை இணைக்கவும் அல்லது கேள்விகள் கேட்கவும்...'
                  : 'Attach form / snap photo or type a message...'
                : isTamil
                ? 'உங்கள் பதிலை தமிழில் / ஆங்கிலத்தில் தட்டச்சு செய்க...'
                : 'Reply in English or Tamil / type a question...'
            }
            className="w-full text-xs sm:text-sm pl-3.5 pr-3 py-2.5 sm:py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs font-medium placeholder:text-slate-400"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!inputText.trim() && !liveTranscript.trim()) || isProcessing}
          className="p-2.5 sm:p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer shrink-0"
          title={isTamil ? 'அனுப்பவும்' : 'Send message'}
        >
          <Send className="w-4 h-4" />
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
