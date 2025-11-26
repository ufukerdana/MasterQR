
import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Share2, Download, RefreshCw, Wand2, Type, Mic, Contact } from 'lucide-react';
import { translations } from '../translations';
import VoiceRecorder from './VoiceRecorder';

interface GeneratorProps {
  onShare: (blob: Blob | null, text: string) => void;
  onGenerate: (text: string, color: string) => void;
  t: typeof translations['en']['generate'];
}

const COLORS = [
  '#000000', // Black
  // Indigo removed
  '#2563eb', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#9333ea', // Purple
  '#ea580c', // Orange
  '#db2777', // Pink
];

type GenMode = 'text' | 'voice' | 'vcard';

const Generator: React.FC<GeneratorProps> = ({ onShare, onGenerate, t }) => {
  const [mode, setMode] = useState<GenMode>('text');
  
  // Text Mode State
  const [text, setText] = useState('');
  
  // vCard Mode State
  const [vCard, setVCard] = useState({ name: '', phone: '', email: '', org: '' });

  const [generatedText, setGeneratedText] = useState('');
  const [fgColor, setFgColor] = useState('#000000');
  const canvasRef = useRef<HTMLDivElement>(null);

  const resetAll = () => {
      setText('');
      setVCard({ name: '', phone: '', email: '', org: '' });
      setGeneratedText('');
  };

  const handleGenerate = () => {
    let result = '';
    
    if (mode === 'text') {
        if (!text.trim()) return;
        result = text;
    } else if (mode === 'vcard') {
        if (!vCard.name.trim()) return;
        
        // Generate N (Structured Name) field: Family Name; Given Name; Middle Name; Prefix; Suffix
        const parts = vCard.name.trim().split(/\s+/);
        let nStr = '';
        
        if (parts.length === 1) {
            // Only first name
            nStr = `;${parts[0]};;;`;
        } else {
            // Assume last part is family name
            const lastName = parts.pop();
            const firstName = parts.join(' ');
            nStr = `${lastName};${firstName};;;`;
        }

        // Construct vCard string
        // Note: Using \n is compact for QR codes.
        result = `BEGIN:VCARD
VERSION:3.0
N:${nStr}
FN:${vCard.name.trim()}
TEL:${vCard.phone.trim()}
EMAIL:${vCard.email.trim()}
ORG:${vCard.org.trim()}
END:VCARD`;
    }

    if (result) {
        setGeneratedText(result);
        onGenerate(result, fgColor);
    }
  };

  const handleVoiceUploadComplete = (url: string) => {
      setGeneratedText(url);
      onGenerate(url, fgColor);
  };

  const getCanvasBlob = async (): Promise<Blob | null> => {
    if (!canvasRef.current) return null;
    const canvas = canvasRef.current.querySelector('canvas');
    if (!canvas) return null;
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  const handleShare = async () => {
    if (!generatedText) return;
    const blob = await getCanvasBlob();
    onShare(blob, generatedText);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.querySelector('canvas');
    if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `masterqr-${Date.now()}.png`;
        link.href = url;
        link.click();
    }
  };

  const isBtnDisabled = () => {
      if (mode === 'text') return !text.trim();
      if (mode === 'vcard') return !vCard.name.trim();
      return true;
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 flex flex-col h-full overflow-y-auto no-scrollbar pb-24">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
            <Wand2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.title}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{t.subtitle}</p>
      </div>

      {/* Mode Switcher */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
         <button 
            onClick={() => { setMode('text'); resetAll(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                mode === 'text' 
                ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' 
                : 'text-slate-500 dark:text-slate-400'
            }`}
         >
            <Type className="w-4 h-4" />
            {t.modeText}
         </button>
         <button 
            onClick={() => { setMode('voice'); resetAll(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                mode === 'voice' 
                ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' 
                : 'text-slate-500 dark:text-slate-400'
            }`}
         >
            <Mic className="w-4 h-4" />
            {t.modeVoice}
         </button>
         <button 
            onClick={() => { setMode('vcard'); resetAll(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                mode === 'vcard' 
                ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' 
                : 'text-slate-500 dark:text-slate-400'
            }`}
         >
            <Contact className="w-4 h-4" />
            {t.modeVCard}
         </button>
      </div>

      <div className="space-y-4">
        {mode === 'text' && (
            <div className="relative">
            <input
                type="text"
                value={text}
                onChange={(e) => {
                    setText(e.target.value);
                    if(e.target.value === '') setGeneratedText('');
                }}
                placeholder={t.placeholder}
                className="w-full px-4 py-4 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-0 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
            />
            {text && (
                <button 
                    onClick={resetAll}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                    <div className="bg-slate-200 dark:bg-slate-700 rounded-full p-1">
                        <span className="sr-only">{t.clear}</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                </button>
            )}
            </div>
        )}

        {mode === 'voice' && (
            <VoiceRecorder onUploadComplete={handleVoiceUploadComplete} t={t.voice} />
        )}

        {mode === 'vcard' && (
            <div className="space-y-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{t.vcard.title}</h3>
                <input
                    type="text"
                    placeholder={t.vcard.fullName}
                    value={vCard.name}
                    onChange={(e) => setVCard({...vCard, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-primary-500 outline-none transition-all text-slate-900 dark:text-white"
                />
                <input
                    type="tel"
                    placeholder={t.vcard.phone}
                    value={vCard.phone}
                    onChange={(e) => setVCard({...vCard, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-primary-500 outline-none transition-all text-slate-900 dark:text-white"
                />
                <input
                    type="email"
                    placeholder={t.vcard.email}
                    value={vCard.email}
                    onChange={(e) => setVCard({...vCard, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-primary-500 outline-none transition-all text-slate-900 dark:text-white"
                />
                 <input
                    type="text"
                    placeholder={t.vcard.org}
                    value={vCard.org}
                    onChange={(e) => setVCard({...vCard, org: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-primary-500 outline-none transition-all text-slate-900 dark:text-white"
                />
            </div>
        )}

        {/* Color Picker */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">{t.color}</label>
            <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => (
                    <button
                        key={color}
                        onClick={() => setFgColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                            fgColor === color ? 'border-slate-400 scale-110 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-800' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                    />
                ))}
                {/* Custom Color Input */}
                <div className="relative">
                    <label 
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 overflow-hidden ${
                            !COLORS.includes(fgColor) 
                            ? 'border-slate-400 scale-110 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-800' 
                            : 'border-slate-200 dark:border-slate-600'
                        }`}
                        style={{ 
                            background: !COLORS.includes(fgColor) 
                                ? fgColor 
                                : 'conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, #00FF00 120deg, #0000FF 240deg, #FF0000 360deg)'
                        }}
                        title="Custom Color"
                    >
                        <input 
                            type="color" 
                            value={fgColor}
                            onChange={(e) => setFgColor(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                    </label>
                </div>
            </div>
        </div>

        {mode !== 'voice' && (
            <button
            onClick={handleGenerate}
            disabled={isBtnDisabled()}
            className="w-full py-4 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
            <RefreshCw className="w-5 h-5" />
            {t.button}
            </button>
        )}
      </div>

      {generatedText && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center">
            <div ref={canvasRef} className="bg-white p-4 rounded-xl">
              <QRCodeCanvas
                value={generatedText}
                size={220}
                level="M"
                bgColor="#ffffff"
                fgColor={fgColor}
                imageSettings={mode === 'voice' ? {
                    src: "https://upload.wikimedia.org/wikipedia/commons/2/21/Speaker_Icon.svg",
                    height: 40,
                    width: 40,
                    excavate: true
                } : mode === 'vcard' ? {
                    src: "https://upload.wikimedia.org/wikipedia/commons/9/93/Google_Contacts_icon.svg",
                    height: 40,
                    width: 40,
                    excavate: true
                } : undefined}
              />
            </div>
            
            <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400 font-medium truncate w-full px-4">
                {mode === 'voice' ? 'Voice Message QR' : mode === 'vcard' ? vCard.name : generatedText}
            </p>

            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                {t.share}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <Download className="w-5 h-5" />
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Generator;
