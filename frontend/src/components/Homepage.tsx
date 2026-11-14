import React, { useState } from 'react';
import {
  Mic,
  FileSearch,
  CheckCircle,
  ArrowRight,
  History,
  Sparkles,
  ShieldCheck,
  Volume2,
  FileText,
  Zap,
  Users,
  Languages,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { AiModeModal } from './AiModeModal';

interface HomepageProps {
  onStartSession: (lang?: string) => void;
  onViewHistory: () => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export const Homepage: React.FC<HomepageProps> = ({
  onStartSession,
  onViewHistory,
  selectedLanguage,
  onLanguageChange,
}) => {
  const isTamil = selectedLanguage === 'ta';
  const [playingSample, setPlayingSample] = useState<string | null>(null);
  const [isAiModeModalOpen, setIsAiModeModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentAiMode, setCurrentAiMode] = useState('Gemini 3.5 Live');

  const playVoiceSample = (lang: 'en' | 'ta') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setPlayingSample(lang);

    const text =
      lang === 'ta'
        ? 'வணக்கம்! நான் வாய்ஸ் ஃபர்ஸ்ட் ஏஐ. உங்கள் அரசு உதவித்தொகை படிவத்தை எளிதாக பூர்த்தி செய்ய நான் உதவுகிறேன்.'
        : 'Hello! I am VoiceFirst AI. I will help you understand this government document and complete the application effortlessly.';

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.onend = () => setPlayingSample(null);
    utterance.onerror = () => setPlayingSample(null);

    window.speechSynthesis.speak(utterance);
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar: Clean, Professional, Minimalist */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/70 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Mic className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                VoiceFirst <span className="text-teal-600">AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
          </div>

          {/* Center: Clean Typographic Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              {isTamil ? 'அம்சங்கள்' : 'Features'}
            </button>

            <button
              onClick={() => scrollToSection('capabilities')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              {isTamil ? 'செயல்முறை' : 'How It Works'}
            </button>

            <button
              onClick={onViewHistory}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              {isTamil ? 'வரலாறு' : 'History'}
            </button>
          </nav>

          {/* Right: Controls & Primary Action */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Elegant AI Engine Status Pill */}
            <button
              type="button"
              onClick={() => setIsAiModeModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 transition-all cursor-pointer group"
              title="Click to view AI Engine architecture & modes"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-800 text-[11px] sm:text-xs">{currentAiMode}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform" />
            </button>

            {/* Segmented Language Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200/80 text-xs font-semibold">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${selectedLanguage === 'en'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('ta')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${selectedLanguage === 'ta'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                தமிழ்
              </button>
            </div>

            {/* Primary CTA */}
            <button
              onClick={() => onStartSession(selectedLanguage)}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-full text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <span>{isTamil ? 'அரட்டை' : 'Open Assistant'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Clean Mobile Dropdown Sheet */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 space-y-1.5 animate-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection('features');
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center justify-between"
            >
              <span>{isTamil ? 'அம்சங்கள்' : 'Features'}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection('capabilities');
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center justify-between"
            >
              <span>{isTamil ? 'செயல்முறை' : 'How It Works'}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onViewHistory();
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center justify-between"
            >
              <span>{isTamil ? 'முந்தைய விண்ணப்பங்கள்' : 'Saved Applications History'}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsAiModeModalOpen(true);
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center justify-between"
            >
              <span>{isTamil ? 'AI பயன்முறை அமைப்புகள்' : 'AI Engine Mode'}</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                {currentAiMode}
              </span>
            </button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16 flex-1 flex flex-col items-center text-center">
        {/* Feature Highlights Banner */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-50 via-indigo-50 to-teal-50 border border-blue-200 text-blue-900 text-xs font-bold mb-6 shadow-2xs">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Multimodal Document Assistant — Powered by Google Gemini Live API</span>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          <span className="text-teal-700 hidden sm:inline">Voice & Document Vision</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 max-w-4xl leading-tight sm:leading-none">
          {isTamil ? (
            <>
              அரசு ஆவணங்களைப் <span className="text-blue-700 underline decoration-teal-400 decoration-wavy">புரிந்துகொள்ளுங்கள்</span>. <br />
              குரல் வழியே <span className="text-teal-600">விண்ணப்பியுங்கள்</span>.
            </>
          ) : (
            <>
              See a Document. <span className="text-blue-700">Speak Naturally.</span> <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-600">
                Understand Everything.
              </span> Complete with AI.
            </>
          )}
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
          {isTamil
            ? 'முதியவர்கள் மற்றும் எளிய மக்களுக்காக தமிழ் மற்றும் ஆங்கிலத்தில் அரசு ஆவணங்களை விளக்கி, இயற்கையான குரல் உரையாடலில் படிவங்களை முழுமையாக பூர்த்தி செய்யும் நவீன AI உதவியாளர்.'
            : 'A voice-first assistant empowering senior citizens, regional-language speakers, and underserved communities to effortlessly decode government forms and submit official applications.'}
        </p>

        {/* Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mt-8 w-full max-w-3xl text-left">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">&lt;1.5s Latency</p>
              <p className="text-[10px] text-slate-500 font-medium">Gemini Live Audio</p>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">Tamil & English</p>
              <p className="text-[10px] text-slate-500 font-medium">Native Code-Switching</p>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">100% AcroForm</p>
              <p className="text-[10px] text-slate-500 font-medium">PyMuPDF Generation</p>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">Accessible</p>
              <p className="text-[10px] text-slate-500 font-medium">Built for Seniors</p>
            </div>
          </div>
        </div>

        {/* Live Audio Sample Tester */}
        <div className="mt-8 bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 w-full max-w-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-950">
                {isTamil ? 'குரல் மாதிரியை உடனே கேளுங்கள்' : 'Listen to Live Voice Preview:'}
              </p>
              <p className="text-[11px] text-blue-700">
                {isTamil
                  ? 'தமிழ் அல்லது ஆங்கிலத்தில் மாதிரி பதிலை ஒலிக்கச் செய்யுங்கள்'
                  : 'Test natural bilingual spoken clarity in Tamil or English'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => playVoiceSample('ta')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${playingSample === 'ta'
                ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-100'
                }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>தமிழ் Voice</span>
            </button>
            <button
              onClick={() => playVoiceSample('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${playingSample === 'en'
                ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-100'
                }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>English Voice</span>
            </button>
          </div>
        </div>

        {/* Two Large Action Cards Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-8">
          {/* Card 1: Start New Session (Primary) */}
          <div
            onClick={() => onStartSession(selectedLanguage)}
            className="group relative bg-white border-2 border-blue-600 hover:border-blue-700 rounded-3xl p-7 text-left shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between ring-4 ring-blue-50"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <Mic className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Primary Action
                </span>
              </div>

              <h2 className="text-2xl font-black text-slate-900 group-hover:text-blue-900">
                {isTamil ? 'புதிய அமர்வைத் தொடங்கு' : 'Start New Session'}
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {isTamil
                  ? 'அரசு உதவித்தொகை படிவத்தைப் பதிவேற்றி நேரலை குரல் உரையாடலில் கேள்விகளைக் கேட்கவும், எளிதாக முடிக்கவும்.'
                  : 'Upload an application form or take a clean photo to experience natural voice conversation.'}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                <span className="bg-slate-100 px-2.5 py-1 rounded-md">📄 Form Understanding</span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-md">🎙️ Voice Q&A</span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-md">📥 PDF Download</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-black text-blue-700">
                {isTamil ? 'தொடங்க அழுத்தவும்' : 'Launch Assistant Now'}
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-700 group-hover:text-white text-blue-700 flex items-center justify-center transition-all group-hover:translate-x-1">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 2: View History (Secondary) */}
          <div
            onClick={onViewHistory}
            className="group relative bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-7 text-left shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 group-hover:bg-teal-600 text-teal-700 group-hover:text-white flex items-center justify-center transition-colors">
                  <History className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  Past Applications
                </span>
              </div>

              <h2 className="text-2xl font-black text-slate-900">
                {isTamil ? 'வரலாற்றைக் காண்க' : 'View History'}
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {isTamil
                  ? 'முன்பு சமர்ப்பிக்கப்பட்ட உதவித்தொகை விண்ணப்பங்கள் மற்றும் உருவாக்கப்பட்ட PDF ஆவணங்களை மதிப்பாய்வு செய்யவும்.'
                  : 'Review submitted government applications, inspect extracted fields, and re-download completed PDF certificates.'}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                <span className="bg-slate-100 px-2.5 py-1 rounded-md">🗄️ Supabase Records</span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-md">📑 Stamped PDFs</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">
                {isTamil ? 'வரலாறு பார்க்க' : 'Open Saved Sessions'}
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all group-hover:translate-x-1">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <section id="features" className="w-full max-w-4xl mt-16 pt-10 border-t border-slate-200">
          <div className="text-center mb-10">
            <span className="text-xs font-black text-teal-700 uppercase tracking-widest bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              {isTamil ? 'அம்சங்கள் & தொழில்நுட்பம்' : 'Core Capabilities'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
              {isTamil ? 'எளிய மனிதர்களுக்கான நவீன தொழில்நுட்பம்' : 'Accessible Multimodal Architecture'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Mic className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-slate-900">
                {isTamil ? '1. நேரலை குரல் உரையாடல்' : '1. Gemini Live Audio'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isTamil
                  ? 'நேட்டிவ் ஆடியோ ஸ்ட்ரீமிங் மூலம் தமிழ் மற்றும் ஆங்கிலத்தில் இயற்கையாக பேசலாம்.'
                  : 'Sub-second audio streaming with bidirectional WebSockets for conversational voice.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <FileSearch className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-slate-900">
                {isTamil ? '2. மல்டிமோடல் ஆவணப் பார்வை' : '2. Document Understanding'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isTamil
                  ? 'எந்தவொரு ஆவணத்தின் PDF அல்லது புகைப்படத்தையும் தானாக படித்து தகவல்களை கண்டறிகிறது.'
                  : 'Multimodal vision analyzes scanned forms, certificates, and ID documents instantly.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-slate-900">
                {isTamil ? '3. தானியங்கி PDF உருவாக்கம்' : '3. Official PDF Stamping'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isTamil
                  ? 'குரல் மூலம் பெற்ற விவரங்களை அதிகாரப்பூர்வ PDF படிவத்தில் அழகாக நிரப்பி வழங்குகிறது.'
                  : 'Direct AcroForm generation with reference numbers, ready for submission.'}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>VoiceFirst AI · Accessible Multimodal Assistant</span>
          </div>
          <span>Powered by Google Gemini Live API · PyMuPDF · Supabase</span>
        </div>
      </footer>

      {/* AI Mode Configuration Modal */}
      <AiModeModal
        isOpen={isAiModeModalOpen}
        onClose={() => setIsAiModeModalOpen(false)}
        language={selectedLanguage}
        onSelectMode={(mode) => {
          if (mode === 'voice_live') setCurrentAiMode('Gemini 3.5 Live');
          if (mode === 'vision_scan') setCurrentAiMode('Vision Scanner');
          if (mode === 'fast_fill') setCurrentAiMode('Express Auto-Fill');
        }}
        onLaunchAssistant={() => onStartSession(selectedLanguage)}
      />
    </div>
  );
};
