import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Zap,
  Mic,
  Camera,
  Check,
  Volume2,
  Activity,
} from 'lucide-react';

interface AiModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onSelectMode?: (mode: string) => void;
  onLaunchAssistant?: () => void;
}

export const AiModeModal: React.FC<AiModeModalProps> = ({
  isOpen,
  onClose,
  language,
  onSelectMode,
  onLaunchAssistant,
}) => {
  const [selectedMode, setSelectedMode] = useState<string>('voice_live');
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const isTamil = language === 'ta';

  if (!isOpen) return null;

  const playVoiceSample = (lang: 'en' | 'ta') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setPlayingVoice(lang);

    const text =
      lang === 'ta'
        ? 'வணக்கம்! நான் வாய்ஸ் ஃபர்ஸ்ட் AI. ஜெமினி 3.5 நேரலை முறையில் நான் உங்கள் ஆவணத்தை எளிதாக நிரப்ப உதவுவேன்.'
        : 'Hello! I am VoiceFirst AI running on Gemini 3.5 Live. I will help you fill any document with natural speech.';

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
    utterance.rate = 1.0;
    utterance.onend = () => setPlayingVoice(null);
    utterance.onerror = () => setPlayingVoice(null);

    window.speechSynthesis.speak(utterance);
  };

  const aiModes = [
    {
      id: 'voice_live',
      title: isTamil ? 'ஜெமினி லைவ் வாய்ஸ் பயன்முறை' : 'Gemini 3.5 Live Voice Mode',
      subtitle: isTamil
        ? 'நேரலை இருவழி குரல் உரையாடல் (<1.2 வினாடி வேகம்)'
        : 'Real-time bidirectional spoken dialogue (<1.2s response)',
      icon: Mic,
      badge: isTamil ? 'பரிந்துரைக்கப்படுகிறது' : 'Recommended',
      color: 'from-blue-600 to-teal-500',
    },
    {
      id: 'vision_scan',
      title: isTamil ? 'மல்டிமோடல் கேமரா விஷன்' : 'Multimodal Vision Scanner',
      subtitle: isTamil
        ? 'கேமரா புகைப்படம் மூலம் படிவ விவரங்களை தானாக கண்டறிதல்'
        : 'Auto-detect application fields from paper camera photos',
      icon: Camera,
      badge: 'Gemini Vision',
      color: 'from-teal-600 to-emerald-500',
    },
    {
      id: 'fast_fill',
      title: isTamil ? 'விரைவு ஆட்டோ-ஃபில் முறை' : 'Express Form Auto-Fill',
      subtitle: isTamil
        ? 'உரையாடல் மூலம் விவரங்களை சேகரித்து உடனடி PDF உருவாக்குதல்'
        : 'Rapid structured extraction & immediate downloadable PDF',
      icon: Zap,
      badge: 'Instant AcroForm',
      color: 'from-indigo-600 to-blue-500',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-teal-300 flex items-center justify-center border border-teal-400/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black tracking-tight">
                  {isTamil ? 'AI பயன்முறை அமைப்புகள்' : 'AI Engine & Operation Mode'}
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-extrabold">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Google Gemini 3.5 Flash Multimodal Pipeline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Active Model Status Strip */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
              <div>
                <span className="font-black text-slate-900 block">
                  {isTamil ? 'செயலில் உள்ள AI மாடல்' : 'Active Intelligence Model'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  gemini-3.5-flash · Native Audio & Vision
                </span>
              </div>
            </div>
            <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Online
            </span>
          </div>

          {/* AI Mode Selector Cards */}
          <div className="space-y-2.5">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              {isTamil ? 'பயன்முறையைத் தேர்ந்தெடுக்கவும்:' : 'Select Interaction Mode:'}
            </label>

            {aiModes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;

              return (
                <div
                  key={mode.id}
                  onClick={() => {
                    setSelectedMode(mode.id);
                    onSelectMode?.(mode.id);
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-100'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${mode.color} text-white flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {mode.title}
                        </span>
                        <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full shrink-0">
                          {mode.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {mode.subtitle}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Voice Preview Tester */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl border border-blue-200/80 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-blue-700" />
                {isTamil ? 'குரல் மாதிரி சோதனை' : 'Test AI Spoken Clarity:'}
              </p>
              <p className="text-[11px] text-blue-800 font-medium">
                {isTamil ? 'இயற்கையான தமிழ் மற்றும் ஆங்கில குரல்' : 'Natural Tamil & English speech'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => playVoiceSample('ta')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                  playingVoice === 'ta'
                    ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-100'
                }`}
              >
                தமிழ்
              </button>
              <button
                type="button"
                onClick={() => playVoiceSample('en')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                  playingVoice === 'en'
                    ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-100'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        {/* Modal Bottom CTA */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {isTamil ? 'மூடு' : 'Close'}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onLaunchAssistant?.();
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-teal-600 hover:from-blue-800 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isTamil ? 'உதவியாளரைத் தொடங்கு' : 'Launch Assistant Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
