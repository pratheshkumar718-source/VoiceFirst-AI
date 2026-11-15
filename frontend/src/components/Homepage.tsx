import React, { useState } from 'react';
import {
  Mic,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Volume2,
  FileText,
  ChevronDown,
  Menu,
  X,
  CheckCircle,
  FileCheck,
} from 'lucide-react';
import { AiModeModal } from './AiModeModal';

interface HomepageProps {
  onStartSession: (lang?: string, autoLoadSample?: boolean) => void;
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
  const [currentAiMode, setCurrentAiMode] = useState('Gemini Live');

  const playVoiceSample = (lang: 'en' | 'ta') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setPlayingSample(lang);

    const text =
      lang === 'ta'
        ? 'வணக்கம்! நான் வாய்ஸ் ஃபர்ஸ்ட் AI. உங்கள் அரசு உதவித்தொகை படிவத்தை எளிதாக பூர்த்தி செய்ய நான் உதவுகிறேன்.'
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* 1. Professional SaaS Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
              <Mic className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                VoiceFirst <span className="text-blue-600">AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Gemini Live
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7">
            <button
              onClick={() => scrollToSection('features')}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {isTamil ? 'அம்சங்கள்' : 'Features'}
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {isTamil ? 'செயல்முறை' : 'How It Works'}
            </button>
            <button
              onClick={() => scrollToSection('architecture')}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {isTamil ? 'தொழில்நுட்பம்' : 'Architecture'}
            </button>
            <button
              onClick={onViewHistory}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {isTamil ? 'வரலாறு' : 'Session History'}
            </button>
          </nav>

          {/* Controls & Primary Action */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* AI Engine Status Pill */}
            <button
              type="button"
              onClick={() => setIsAiModeModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
              title="Click to view AI Engine architecture"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-800 text-[11px] sm:text-xs">{currentAiMode}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform" />
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedLanguage === 'en'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('ta')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedLanguage === 'ta'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                தமிழ்
              </button>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => onStartSession(selectedLanguage)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
            >
              <span>{isTamil ? 'தொடங்குக' : 'Get Started'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150 shadow-lg">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection('features');
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between"
            >
              <span>{isTamil ? 'அம்சங்கள்' : 'Features'}</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection('how-it-works');
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between"
            >
              <span>{isTamil ? 'செயல்முறை' : 'How It Works'}</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onViewHistory();
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between"
            >
              <span>{isTamil ? 'முந்தைய விண்ணப்பங்கள்' : 'Session History'}</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsAiModeModalOpen(true);
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between"
            >
              <span>{isTamil ? 'AI பயன்முறை' : 'AI Engine Mode'}</span>
              <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                {currentAiMode}
              </span>
            </button>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-100/60 via-indigo-50/40 to-sky-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 text-slate-800 text-xs font-semibold mb-6 shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-blue-600" />
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Voice-First AI for Accessible Government Services</span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-blue-600 font-bold hidden sm:inline">Gemini Live + Vision</span>
          </div>

          {/* Hero Heading with Blue Gradient */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl leading-[1.15]">
            {isTamil ? (
              <>
                அரசு ஆவணங்களைப் புரிந்துகொள்ளுங்கள்.{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                  உங்கள் தாய்மொழியில் பேசுங்கள்.
                </span>
              </>
            ) : (
              <>
                Understand Government Documents.{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                  Speak Your Language.
                </span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
            {isTamil
              ? 'முதியவர்கள் மற்றும் எளிய மக்களுக்காக அரசு ஆவணங்களை விளக்கி, விண்ணப்பங்களில் வழிகாட்டி, படிவங்களை குரல் உரையாடல் மூலம் எளிதாக பூர்த்தி செய்யும் நவீன AI உதவியாளர்.'
              : 'An intelligent voice-first assistant that simplifies government documents, guides you through applications, and helps you complete forms effortlessly.'}
          </p>

          {/* Primary Call-to-Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <button
              onClick={() => onStartSession(selectedLanguage)}
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isTamil ? 'விண்ணப்பத்தைத் தொடங்குக' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => scrollToSection('features')}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 active:scale-98 text-slate-800 border border-slate-200/90 rounded-xl text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isTamil ? 'அம்சங்களை அறிக' : 'Explore Features'}</span>
            </button>

            <button
              onClick={() => onStartSession(selectedLanguage, true)}
              className="w-full sm:w-auto px-5 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="Instantly opens with Tamil Nadu Scholarship sample"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>{isTamil ? 'மாதிரி படிவத்தை முயற்சிக்க' : 'Try Demo Sample'}</span>
            </button>
          </div>

          {/* 3. Attractive AI Assistant Visualization Card */}
          <div className="mt-14 w-full max-w-5xl">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-2 sm:p-4 text-left transition-all">
              {/* Window Controls Bar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-200" />
                  <span className="w-3 h-3 rounded-full bg-slate-200" />
                  <span className="w-3 h-3 rounded-full bg-slate-200" />
                  <span className="text-xs font-semibold text-slate-500 ml-2">VoiceFirst AI Dashboard Preview</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Bidirectional PCM Audio Live</span>
                </div>
              </div>

              {/* Showcase Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Left Showcase: Interactive Voice preview */}
                <div className="md:col-span-6 bg-gradient-to-br from-slate-50 to-blue-50/50 p-5 rounded-2xl border border-slate-200/70 flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        AI
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Gemini Live Assistant</h4>
                        <p className="text-[10px] text-slate-500">Tamil & English Real-Time Voice</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                      PCM 24kHz
                    </span>
                  </div>

                  {/* Simulated Waveform & Mic */}
                  <div className="py-6 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-4">
                      <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 ring-8 ring-blue-100 animate-pulse">
                        <Mic className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      {isTamil ? '"என் பெயர் கார்த்திக் ராஜா"' : '"My name is Karthik Raja"'}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      {isTamil
                        ? 'இயற்கையான குரல் வழியே விவரங்களை நிரப்புகிறது'
                        : 'Capturing details automatically from spoken answers'}
                    </span>
                  </div>

                  {/* Audio Preview Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => playVoiceSample('en')}
                      disabled={playingSample !== null}
                      className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>{playingSample === 'en' ? 'Playing...' : 'Hear English AI'}</span>
                    </button>
                    <button
                      onClick={() => playVoiceSample('ta')}
                      disabled={playingSample !== null}
                      className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>{playingSample === 'ta' ? 'ஒலிக்கிறது...' : 'தமிழ் குரல் கேட்க'}</span>
                    </button>
                  </div>
                </div>

                {/* Right Showcase: Real-Time Form Tracker Card */}
                <div className="md:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/70 flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-blue-600" />
                      <h4 className="text-xs font-bold text-slate-900">Tamil Nadu Scholarship Application</h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      75% Completed
                    </span>
                  </div>

                  {/* Simulated Form Fields */}
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block">Full Name / முழு பெயர்</span>
                        <span className="font-semibold text-slate-900">Karthik Raja S</span>
                      </div>
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block">Date of Birth / பிறந்த தேதி</span>
                        <span className="font-semibold text-slate-900">14/05/2003</span>
                      </div>
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>

                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-blue-800 uppercase block">Aadhaar Number / ஆதார் எண்</span>
                        <span className="font-semibold text-slate-900">5482 9104 3821</span>
                      </div>
                      <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-300/80 flex items-center justify-between animate-pulse">
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 uppercase block">Annual Family Income / ஆண்டு வருமானம்</span>
                        <span className="text-amber-700 font-medium italic">Gemini is asking for this field now...</span>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        Next
                      </span>
                    </div>
                  </div>

                  {/* Certified PyMuPDF Badge */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-slate-600">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      Official AcroForm Template Supported
                    </span>
                    <span className="font-bold text-blue-600">1-Click PDF Export</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="py-16 md:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">Built for Accessibility</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Everything You Need to Navigate Government Paperwork
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Transforming complex administrative forms into simple, respectful, and voice-guided digital workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Multimodal Document Vision</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scan or photograph any paper form or PDF notice. Gemini 2.0 / 3.5 extracts form fields, eligibility rules, and required proofs in seconds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Real-Time Gemini Live Audio</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stream native 16kHz PCM audio directly over WebSockets with sub-second latency and interruption handling in natural Tamil, English, or Tanglish.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Conversational Form Filler</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Asks for applicant information step-by-step, performs real-time field validation, and lets you edit any answer verbally or manually.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Official PyMuPDF PDF Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Populates official government AcroForm fields, stamps verification badges, and produces clean print-ready PDFs for one-click download.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">Simple 4-Step Journey</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              How VoiceFirst AI Works
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Designed for ease of use by seniors, rural citizens, and first-time digital applicants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Attach or Snap Document</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload your PDF or take a clean picture with your phone camera. Gemini analyzes the form instantly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Speak Naturally</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Click the circular microphone and converse in your preferred language. Ask questions and reply conversationally.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Review Real-Time Answers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Watch the fields populate and turn green in real-time. Correct any detail verbally or with quick taps.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                4
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Download Certified PDF</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Confirm your submission to generate a validated official PDF document ready to be printed and submitted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Architecture / Technology Stack */}
      <section id="architecture" className="py-16 bg-white border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">Production-Grade Architecture</span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
              Powered by Google Gemini Live & Multimodal AI
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Engineered with clean separation of concerns, zero client-side key leakage, and offline fallback capabilities.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-left">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Voice Engine</span>
              <p className="text-xs font-bold text-slate-900 mt-1">Gemini Live API</p>
              <p className="text-[11px] text-slate-500">PCM 16k in / 24k out</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-left">
              <span className="text-[10px] font-bold text-indigo-600 uppercase">Vision Engine</span>
              <p className="text-xs font-bold text-slate-900 mt-1">Gemini 2.0 / 3.5 Flash</p>
              <p className="text-[11px] text-slate-500">Document Understanding</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-left">
              <span className="text-[10px] font-bold text-teal-600 uppercase">Backend Server</span>
              <p className="text-xs font-bold text-slate-900 mt-1">FastAPI + WebSockets</p>
              <p className="text-[11px] text-slate-500">Relay & Structured JSON</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-left">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">PDF Generation</span>
              <p className="text-xs font-bold text-slate-900 mt-1">PyMuPDF (fitz)</p>
              <p className="text-[11px] text-slate-500">Certified AcroForm Stamping</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 sm:px-6 lg:px-8 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white text-sm">VoiceFirst AI</span>
            <span className="text-slate-500">| Accessible Government Form Filling</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={onViewHistory}
              className="hover:text-white transition-colors cursor-pointer"
            >
              History
            </button>
          </div>

          <div className="text-slate-500">
            Powered by Google Gemini 2.0 / 3.5 & PyMuPDF
          </div>
        </div>
      </footer>

      {/* AI Mode Selection & Diagnostic Modal */}
      <AiModeModal
        isOpen={isAiModeModalOpen}
        onClose={() => setIsAiModeModalOpen(false)}
        language={selectedLanguage}
        onSelectMode={(mode) => {
          if (mode === 'voice_live') setCurrentAiMode('Gemini Live');
          else if (mode === 'vision_scan') setCurrentAiMode('Vision Scanner');
          else if (mode === 'fast_fill') setCurrentAiMode('Express Auto-Fill');
          setIsAiModeModalOpen(false);
        }}
      />
    </div>
  );
};
