import { useState } from 'react';
import { Homepage } from './components/Homepage';
import { Dashboard } from './components/Dashboard';
import { HistoryModal } from './components/HistoryModal';

export function App() {
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('home');
  const [language, setLanguage] = useState<string>('en');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {currentView === 'home' ? (
        <Homepage
          selectedLanguage={language}
          onLanguageChange={setLanguage}
          onStartSession={(lang) => {
            if (lang) setLanguage(lang);
            setCurrentView('dashboard');
          }}
          onViewHistory={() => setIsHistoryOpen(true)}
        />
      ) : (
        <Dashboard
          initialLanguage={language}
          onBackToHome={() => setCurrentView('home')}
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
