
import React, { useState, useEffect } from 'react';
import { Scan, QrCode, Moon, Sun, Globe, History as HistoryIcon } from 'lucide-react';
import Scanner from './components/Scanner';
import Generator from './components/Generator';
import ResultModal from './components/ResultModal';
import History from './components/History';
import { Tab, Language, HistoryItem, ScanType, QrMeta } from './types';
import { translations } from './translations';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('scan');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<Language>('en');
  
  // Changed: We now track the full HistoryItem to pass metadata (color) to the modal
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Initialize language
  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'tr')) {
      setLang(savedLang);
    } else {
      const systemLang = navigator.language.startsWith('tr') ? 'tr' : 'en';
      setLang(systemLang);
    }
  }, []);

  // Initialize History
  useEffect(() => {
    try {
        const savedHistory = localStorage.getItem('qr_history');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    } catch (e) {
        console.error("Failed to load history", e);
    }
  }, []);

  const saveToHistory = (text: string, source: 'scan' | 'generate' = 'scan', meta?: QrMeta) => {
    let type: ScanType = 'text';
    if (text.startsWith('WIFI:')) type = 'wifi';
    else if (/^BEGIN:VCARD/i.test(text)) type = 'vcard';
    else if (text.startsWith('http')) type = 'url';
    else if (text.toLowerCase().includes('firebasestorage') || text.toLowerCase().endsWith('.mp3')) type = 'audio';

    // Prevent duplicates at the top of history (simple check)
    // We update the timestamp if it exists
    const existingIndex = history.findIndex(h => h.text === text);
    
    // Create new item
    const newItem: HistoryItem = {
        id: Date.now().toString(),
        text,
        type,
        timestamp: Date.now(),
        meta: meta || { color: '#000000' }
    };

    let newHistory;
    if (existingIndex > -1 && source === 'scan') {
        // Move to top if scanned again
        const temp = [...history];
        temp.splice(existingIndex, 1);
        newHistory = [newItem, ...temp];
    } else {
        newHistory = [newItem, ...history];
    }

    setHistory(newHistory);
    localStorage.setItem('qr_history', JSON.stringify(newHistory));
    return newItem;
  };

  const clearHistory = () => {
      setHistory([]);
      localStorage.removeItem('qr_history');
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'tr' : 'en';
    setLang(newLang);
    localStorage.setItem('language', newLang);
  };

  const t = translations[lang];

  const handleScan = (decodedText: string) => {
    const item = saveToHistory(decodedText, 'scan');
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleBatchScan = (decodedText: string) => {
    saveToHistory(decodedText, 'scan');
    if (navigator.vibrate) navigator.vibrate(200);
    
    const toast = document.createElement('div');
    toast.className = 'fixed top-24 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium z-50 animate-in fade-in slide-in-from-top-4';
    toast.textContent = t.scan.batchScanSaved;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 2000);
  };

  const handleShare = async (content: string | Blob | null, textForClipboard?: string) => {
    if (!content) return;

    if (navigator.share) {
      try {
        if (content instanceof Blob) {
           const file = new File([content], 'qr-code.png', { type: 'image/png' });
           if (navigator.canShare && navigator.canShare({ files: [file] })) {
             await navigator.share({
               files: [file],
               title: t.common.shareTitle,
               text: textForClipboard || t.common.shareText
             });
             return;
           } 
        } else if (typeof content === 'string') {
             await navigator.share({
                title: t.common.scannedContent,
                text: content,
             });
             return;
        }
      } catch (error) {
        console.warn('Share API failed, falling back to clipboard', error);
      }
    }

    const copyText = typeof content === 'string' ? content : textForClipboard;
    if (copyText) {
        try {
            await navigator.clipboard.writeText(copyText);
            alert(t.common.clipboardSuccess);
        } catch (e) {
            alert(t.common.clipboardError);
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300">
      
      {/* Top Bar (App Bar) */}
      <div className="absolute top-0 w-full z-20 px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 max-w-md mx-auto left-0 right-0">
         <div className="flex items-center gap-2">
            <div className="bg-primary-600 p-1.5 rounded-lg">
                <QrCode className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-500 dark:from-primary-400 dark:to-indigo-300">
                {t.appTitle}
            </h1>
         </div>
         <div className="flex items-center gap-2">
             <button
                onClick={toggleLang}
                className="flex items-center gap-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors text-sm font-semibold"
             >
                 <Globe className="w-4 h-4" />
                 <span>{lang.toUpperCase()}</span>
             </button>
             <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
             >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
             </button>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full h-[100dvh] pt-16 pb-20 max-w-md bg-white dark:bg-slate-950 shadow-2xl relative overflow-hidden">
        {activeTab === 'scan' && (
            <Scanner 
                isActive={activeTab === 'scan' && !isModalOpen} 
                onScan={handleScan}
                onBatchScan={handleBatchScan}
                t={t.scan}
                batchMode={batchMode}
                setBatchMode={setBatchMode}
            />
        )}
        
        {activeTab === 'generate' && (
            <Generator 
                onShare={handleShare}
                onGenerate={(text, color) => saveToHistory(text, 'generate', { color })}
                t={t.generate} 
            />
        )}

        {activeTab === 'history' && (
            <History 
                history={history}
                onClear={clearHistory}
                onItemClick={(item) => {
                    setSelectedItem(item);
                    setIsModalOpen(true);
                }}
                t={t.history}
            />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 w-full max-w-md z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe">
        <div className="flex justify-around items-center p-2">
            <button 
                onClick={() => setActiveTab('scan')}
                className={`flex flex-col items-center gap-1 p-3 px-4 rounded-2xl transition-all duration-300 ${
                    activeTab === 'scan' 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
                <Scan className={`w-6 h-6 ${activeTab === 'scan' ? 'stroke-[2.5px]' : ''}`} />
                <span className="text-xs font-medium">{t.scanTab}</span>
            </button>

            <button 
                onClick={() => setActiveTab('generate')}
                className={`flex flex-col items-center gap-1 p-3 px-4 rounded-2xl transition-all duration-300 ${
                    activeTab === 'generate' 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
                <QrCode className={`w-6 h-6 ${activeTab === 'generate' ? 'stroke-[2.5px]' : ''}`} />
                <span className="text-xs font-medium">{t.generateTab}</span>
            </button>

            <button 
                onClick={() => setActiveTab('history')}
                className={`flex flex-col items-center gap-1 p-3 px-4 rounded-2xl transition-all duration-300 ${
                    activeTab === 'history' 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
                <HistoryIcon className={`w-6 h-6 ${activeTab === 'history' ? 'stroke-[2.5px]' : ''}`} />
                <span className="text-xs font-medium">{t.historyTab}</span>
            </button>
        </div>
        {/* Safe area spacer for mobile */}
        <div className="h-safe-area-bottom w-full"></div>
      </div>

      {/* Result Modal */}
      <ResultModal 
        isOpen={isModalOpen}
        historyItem={selectedItem}
        onClose={() => setIsModalOpen(false)}
        onShare={handleShare}
        t={t.result}
      />

    </div>
  );
}

export default App;
