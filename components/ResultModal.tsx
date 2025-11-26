import React from 'react';
import { Copy, Share2, ExternalLink, X, Check } from 'lucide-react';
import { translations } from '../translations';

interface ResultModalProps {
  result: string | null;
  isOpen: boolean;
  onClose: () => void;
  onShare: (text: string) => void;
  t: typeof translations['en']['result'];
}

const ResultModal: React.FC<ResultModalProps> = ({ result, isOpen, onClose, onShare, t }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !result) return null;

  const isUrl = (text: string) => {
    try {
      new URL(text);
      return true;
    } catch {
      return text.startsWith('www.') || text.startsWith('http');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleOpenUrl = () => {
    let url = result;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="bg-primary-600 p-6 pb-8 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-500 to-indigo-700 opacity-100"></div>
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
             <h3 className="relative text-white font-bold text-xl z-10">{t.title}</h3>
             <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white z-20 p-1 hover:bg-white/10 rounded-full transition-colors"
             >
                <X className="w-6 h-6" />
             </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-6 -mt-4 bg-white dark:bg-slate-900 rounded-t-3xl relative z-10">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-6 border border-slate-100 dark:border-slate-700">
                <p className="text-slate-800 dark:text-slate-200 break-words font-mono text-sm leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                    {result}
                </p>
            </div>

            <div className="space-y-3">
                {isUrl(result) && (
                    <button
                        onClick={handleOpenUrl}
                        className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3.5 rounded-xl font-semibold transition-colors shadow-lg shadow-primary-500/20"
                    >
                        <ExternalLink className="w-5 h-5" />
                        {t.openBrowser}
                    </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleCopy}
                        className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all duration-200 border-2 ${
                            copied 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        {copied ? t.copied : t.copy}
                    </button>

                    <button
                        onClick={() => onShare(result)}
                        className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3.5 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                        {t.share}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;