import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Share2, Download, Copy, RefreshCw, Wand2 } from 'lucide-react';
import { translations } from '../translations';

interface GeneratorProps {
  onShare: (blob: Blob | null, text: string) => void;
  t: typeof translations['en']['generate'];
}

const Generator: React.FC<GeneratorProps> = ({ onShare, t }) => {
  const [text, setText] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    if (!text.trim()) return;
    setGeneratedText(text);
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

  return (
    <div className="w-full max-w-md mx-auto p-6 flex flex-col h-full overflow-y-auto no-scrollbar pb-24">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
            <Wand2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.title}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{t.subtitle}</p>
      </div>

      <div className="space-y-4">
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
                onClick={() => {setText(''); setGeneratedText('');}}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
                <div className="bg-slate-200 dark:bg-slate-700 rounded-full p-1">
                    <span className="sr-only">{t.clear}</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
            </button>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={!text}
          className="w-full py-4 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          {t.button}
        </button>
      </div>

      {generatedText && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center">
            <div ref={canvasRef} className="bg-white p-4 rounded-xl">
              <QRCodeCanvas
                value={generatedText}
                size={220}
                level="H"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            
            <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400 font-medium truncate w-full px-4">
                {generatedText}
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