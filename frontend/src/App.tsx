import { useState } from 'react';
import { Homepage } from './components/Homepage';
import { Dashboard } from './components/Dashboard';
import { HistoryModal } from './components/HistoryModal';

export function App() {
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('home');
  const [language, setLanguage] = useState<string>('en');
  const [autoLoadSample, setAutoLoadSample] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      {currentView === 'home' ? (
        <Homepage
          selectedLanguage={language}
          onLanguageChange={setLanguage}
          onStartSession={(lang, shouldLoadSample) => {
            if (lang) setLanguage(lang);
            setAutoLoadSample(Boolean(shouldLoadSample));
            setCurrentView('dashboard');
          }}
          onViewHistory={() => setIsHistoryOpen(true)}
        />
      ) : (
        <Dashboard
          initialLanguage={language}
          autoLoadSample={autoLoadSample}
          onBackToHome={() => {
            setAutoLoadSample(false);
            setCurrentView('home');
          }}
          onViewHistory={() => setIsHistoryOpen(true)}
        />
      )}

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        language={language}
      />
    </div>
  );
}

export default App;
