import React from 'react';
import { Copy, Share2, ExternalLink, X, Check, ShieldCheck, ShieldAlert, Wifi, Key, Lock } from 'lucide-react';
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
  const [passCopied, setPassCopied] = React.useState(false);

  if (!isOpen || !result) return null;

  const isUrl = (text: string) => {
    try {
      new URL(text);
      return true;
    } catch {
      return text.startsWith('www.') || text.startsWith('http');
    }
  };

  const isSecure = (text: string) => text.startsWith('https://');

  // WiFi Format: WIFI:S:MySSID;T:WPA;P:MyPass;;
  const isWifi = (text: string) => text.startsWith('WIFI:');

  const parseWifi = (text: string) => {
    const ssid = text.match(/S:(.*?);/)?.[1] || 'Unknown';
    const password = text.match(/P:(.*?);/)?.[1] || '';
    const type = text.match(/T:(.*?);/)?.[1] || 'None';
    return { ssid, password, type };
  };

  const handleCopy = async (text: string, isPass = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isPass) {
        setPassCopied(true);
        setTimeout(() => setPassCopied(false), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
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

  const renderContent = () => {
    if (isWifi(result)) {
        const { ssid, password, type } = parseWifi(result);
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                        <Wifi className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-bold text-lg text-slate-800 dark:text-white">{t.wifi.title}</h4>
                </div>
                
                <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t.wifi.ssid}</label>
                        <p className="text-slate-900 dark:text-white font-medium text-lg">{ssid}</p>
                    </div>
                    
                    {password && (
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t.wifi.password}</label>
                                <p className="text-slate-900 dark:text-white font-mono text-lg">{password}</p>
                            </div>
                            <button 
                                onClick={() => handleCopy(password, true)}
                                className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            >
                                {passCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                    )}
                    
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t.wifi.type}</label>
                        <div className="flex items-center gap-2 mt-1">
                            <Lock className="w-4 h-4 text-slate-400" />
                            <p className="text-slate-900 dark:text-white font-medium">{type}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {isUrl(result) && (
                <div className={`mb-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isSecure(result) 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                }`}>
                    {isSecure(result) ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    {isSecure(result) ? t.secure : t.unverified}
                </div>
            )}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-6 border border-slate-100 dark:border-slate-700">
                <p className="text-slate-800 dark:text-slate-200 break-words font-mono text-sm leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                    {result}
                </p>
            </div>
        </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        
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

        <div className="px-6 py-6 -mt-4 bg-white dark:bg-slate-900 rounded-t-3xl relative z-10">
            
            {renderContent()}

            <div className="space-y-3 mt-2">
                {isUrl(result) && !isWifi(result) && (
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
                        onClick={() => handleCopy(result)}
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