
import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Share2, Download, RefreshCw, Wand2, Type, Mic, Contact, Wifi, Shield, Timer, Flame, X } from 'lucide-react';
import { translations } from '../translations';
import VoiceRecorder from './VoiceRecorder';
import { createPayloadUrl } from '../utils/payload';

interface GeneratorProps {
  onShare: (blob: Blob | null, text: string) => void;
  onGenerate: (text: string, color: string) => void;
  t: typeof translations['en']['generate'];
}

const COLORS = ['#000000', '#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#db2777'];
type GenMode = 'text' | 'voice' | 'vcard' | 'wifi';

const Generator: React.FC<GeneratorProps> = ({ onShare, onGenerate, t }) => {
  const [mode, setMode] = useState<GenMode>('text');
  const [text, setText] = useState('');
  const [vCard, setVCard] = useState({ name: '', phone: '', email: '', org: '' });
  const [wifi, setWifi] = useState({ ssid: '', password: '', encryption: 'WPA' });
  const [useEncryption, setUseEncryption] = useState(false);
  const [password, setPassword] = useState('');
  const [useExpiry, setUseExpiry] = useState(false);
  const [expiryDuration, setExpiryDuration] = useState<number>(60000); 
  const [generatedText, setGeneratedText] = useState('');
  const [fgColor, setFgColor] = useState('#000000');
  const canvasRef = useRef<HTMLDivElement>(null);

  const resetAll = () => {
      setText('');
      setVCard({ name: '', phone: '', email: '', org: '' });
      setWifi({ ssid: '', password: '', encryption: 'WPA' });
      setUseEncryption(false);
      setPassword('');
      setUseExpiry(false);
      setGeneratedText('');
  };

  const processPayload = (content: string): string => {
      if (useEncryption || useExpiry) {
          return createPayloadUrl(content, useEncryption ? password : '', useExpiry ? expiryDuration : null);
      }
      return content;
  };

  const handleGenerate = () => {
    let result = '';
    if (mode === 'text') {
        if (!text.trim()) return;
        result = text;
    } else if (mode === 'vcard') {
        if (!vCard.name.trim()) return;
        const parts = vCard.name.trim().split(/\s+/);
        let nStr = parts.length === 1 ? `;${parts[0]};;;` : `${parts.pop()};${parts.join(' ')};;;`;
        result = `BEGIN:VCARD\nVERSION:3.0\nN:${nStr}\nFN:${vCard.name.trim()}\nTEL:${vCard.phone.trim()}\nEMAIL:${vCard.email.trim()}\nORG:${vCard.org.trim()}\nEND:VCARD`;
    } else if (mode === 'wifi') {
        if (!wifi.ssid.trim()) return;
        let passPart = wifi.encryption === 'nopass' ? '' : `P:${wifi.password};`;
        result = `WIFI:T:${wifi.encryption};S:${wifi.ssid};${passPart};`;
    }

    if (result) {
        const finalResult = processPayload(result);
        setGeneratedText(finalResult);
        onGenerate(finalResult, fgColor);
    }
  };

  const handleVoiceUploadComplete = (url: string) => {
      const finalResult = processPayload(url);
      setGeneratedText(finalResult);
      onGenerate(finalResult, fgColor);
  };

  const getCanvasBlob = async (): Promise<Blob | null> => {
    if (!canvasRef.current) return null;
    const canvas = canvasRef.current.querySelector('canvas');
    return canvas ? new Promise((resolve) => canvas.toBlob(resolve, 'image/png')) : null;
  };

  const handleShare = async () => {
    if (!generatedText) return;
    const blob = await getCanvasBlob();
    onShare(blob, generatedText);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = `masterqr-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
  };

  const isBtnDisabled = () => {
      let valid = false;
      if (mode === 'text') valid = !!text.trim();
      else if (mode === 'vcard') valid = !!vCard.name.trim();
      else if (mode === 'wifi') valid = !!wifi.ssid.trim() && (wifi.encryption === 'nopass' || !!wifi.password.trim());
      else if (mode === 'voice') return false; 
      if (useEncryption && !password.trim()) return true;
      return !valid;
  };

  const tabClass = (active: boolean) => `flex flex-col items-center justify-center py-3 rounded-xl transition-all w-full touch-manipulation ${
      active 
      ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400 ring-1 ring-black/5 dark:ring-white/5 font-semibold' 
      : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
  }`;

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar pb-24 px-4 pt-6 max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-3 shadow-sm">
            <Wand2 className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
         <button onClick={() => { setMode('text'); resetAll(); }} className={tabClass(mode === 'text')}><Type className="w-5 h-5 mb-1" /><span className="truncate w-full text-[10px]">{t.modeText}</span></button>
         <button onClick={() => { setMode('wifi'); resetAll(); }} className={tabClass(mode === 'wifi')}><Wifi className="w-5 h-5 mb-1" /><span className="truncate w-full text-[10px]">{t.modeWifi}</span></button>
         <button onClick={() => { setMode('vcard'); resetAll(); }} className={tabClass(mode === 'vcard')}><Contact className="w-5 h-5 mb-1" /><span className="truncate w-full text-[10px]">{t.modeVCard}</span></button>
         <button onClick={() => { setMode('voice'); resetAll(); }} className={tabClass(mode === 'voice')}><Mic className="w-5 h-5 mb-1" /><span className="truncate w-full text-[10px]">{t.modeVoice}</span></button>
      </div>

      <div className="space-y-4">
        {mode === 'text' && (
            <div className="relative">
            <input type="text" value={text} onChange={(e) => { setText(e.target.value); if(e.target.value === '') setGeneratedText(''); }} placeholder={t.placeholder} className="w-full px-4 py-4 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-primary-500 outline-none text-slate-900 dark:text-white text-base" />
            {text && <button onClick={resetAll} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-2"><div className="bg-slate-200 dark:bg-slate-700 rounded-full p-1"><X className="w-3 h-3" /></div></button>}
            </div>
        )}
        {mode === 'voice' && <VoiceRecorder onUploadComplete={handleVoiceUploadComplete} t={t.voice} />}
        {mode === 'vcard' && (
            <div className="space-y-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <input type="text" placeholder={t.vcard.fullName} value={vCard.name} onChange={(e) => setVCard({...vCard, name: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
                <input type="tel" placeholder={t.vcard.phone} value={vCard.phone} onChange={(e) => setVCard({...vCard, phone: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
                <input type="email" placeholder={t.vcard.email} value={vCard.email} onChange={(e) => setVCard({...vCard, email: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
                <input type="text" placeholder={t.vcard.org} value={vCard.org} onChange={(e) => setVCard({...vCard, org: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
            </div>
        )}
        {mode === 'wifi' && (
             <div className="space-y-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <input type="text" placeholder={t.wifi.ssid} value={wifi.ssid} onChange={(e) => setWifi({...wifi, ssid: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
                <select value={wifi.encryption} onChange={(e) => setWifi({...wifi, encryption: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white appearance-none">
                    <option value="WPA">{t.wifi.wpa}</option>
                    <option value="WEP">{t.wifi.wep}</option>
                    <option value="nopass">{t.wifi.none}</option>
                </select>
                {wifi.encryption !== 'nopass' && <input type="text" placeholder={t.wifi.password} value={wifi.password} onChange={(e) => setWifi({...wifi, password: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />}
            </div>
        )}

        <div className="space-y-3">
            <div className={`p-4 rounded-xl border transition-colors ${useEncryption ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setUseEncryption(!useEncryption)}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${useEncryption ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}><Shield className="w-5 h-5" /></div>
                        <div><span className="block font-medium text-slate-900 dark:text-white text-sm">{t.encryption.label}</span>{useEncryption && <span className="block text-xs text-amber-600 dark:text-amber-400 mt-0.5">{t.encryption.hint}</span>}</div>
                    </div>
                    <div className={`w-11 h-6 rounded-full relative transition-colors ${useEncryption ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}><div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${useEncryption ? 'translate-x-5' : ''}`}></div></div>
                </div>
                {useEncryption && <div className="mt-3"><input type="password" placeholder={t.encryption.placeholder} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-800/50 text-slate-900 dark:text-white" /></div>}
            </div>

            <div className={`p-4 rounded-xl border transition-colors ${useExpiry ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setUseExpiry(!useExpiry)}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${useExpiry ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}><Timer className="w-5 h-5" /></div>
                        <div><span className="block font-medium text-slate-900 dark:text-white text-sm">{t.expiry.label}</span>{useExpiry && <span className="block text-xs text-red-600 dark:text-red-400 mt-0.5">{t.expiry.hint}</span>}</div>
                    </div>
                    <div className={`w-11 h-6 rounded-full relative transition-colors ${useExpiry ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700'}`}><div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${useExpiry ? 'translate-x-5' : ''}`}></div></div>
                </div>
                {useExpiry && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                        {[ { l: t.expiry.options.min1, v: 60000 }, { l: t.expiry.options.min5, v: 300000 }, { l: t.expiry.options.min10, v: 600000 }, { l: t.expiry.options.hour1, v: 3600000 }, { l: t.expiry.options.day1, v: 86400000 } ].map((opt) => (
                            <button key={opt.v} onClick={() => setExpiryDuration(opt.v)} className={`py-2 px-1 rounded-lg text-[10px] font-bold border ${expiryDuration === opt.v ? 'bg-red-500 text-white border-red-500' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>{opt.l}</button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">{t.color}</label>
            <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => (<button key={color} onClick={() => setFgColor(color)} className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-95 ${fgColor === color ? 'border-slate-400 scale-110 ring-2 ring-primary-500' : 'border-transparent'}`} style={{ backgroundColor: color }} />))}
                <label className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer overflow-hidden relative ${!COLORS.includes(fgColor) ? 'border-slate-400 scale-110 ring-2 ring-primary-500' : 'border-slate-200'}`} style={{ background: !COLORS.includes(fgColor) ? fgColor : 'conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, #00FF00 120deg, #0000FF 240deg, #FF0000 360deg)' }}><input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full" /></label>
            </div>
        </div>

        {mode !== 'voice' && (
            <button onClick={handleGenerate} disabled={isBtnDisabled()} className="w-full py-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-lg shadow-primary-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-98"><RefreshCw className="w-5 h-5" />{t.button}</button>
        )}
      </div>

      {generatedText && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center max-w-sm mx-auto">
            <div ref={canvasRef} className="bg-white p-4 rounded-xl shadow-sm">
              <QRCodeCanvas value={generatedText} size={200} level="M" bgColor="#ffffff" fgColor={fgColor} imageSettings={useExpiry ? { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Stop_hand_nuvola.svg/120px-Stop_hand_nuvola.svg.png", height: 35, width: 35, excavate: true } : useEncryption ? { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Lock_font_awesome.svg/512px-Lock_font_awesome.svg.png", height: 35, width: 35, excavate: true } : mode === 'voice' ? { src: "https://upload.wikimedia.org/wikipedia/commons/2/21/Speaker_Icon.svg", height: 35, width: 35, excavate: true } : mode === 'vcard' ? { src: "https://upload.wikimedia.org/wikipedia/commons/9/93/Google_Contacts_icon.svg", height: 35, width: 35, excavate: true } : mode === 'wifi' ? { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/WiFi_Logo.svg/320px-WiFi_Logo.svg.png", height: 35, width: 35, excavate: true } : undefined} />
            </div>
            <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400 font-medium truncate w-full px-4">{useExpiry ? '*** Self Destructing ***' : useEncryption ? '*** Encrypted ***' : mode === 'voice' ? 'Voice Message' : mode === 'vcard' ? vCard.name : mode === 'wifi' ? wifi.ssid : generatedText}</p>
            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <button onClick={handleShare} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 transition-colors"><Share2 className="w-5 h-5" />{t.share}</button>
              <button onClick={handleDownload} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 transition-colors"><Download className="w-5 h-5" />{t.save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Generator;
