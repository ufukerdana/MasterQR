
import React, { useRef, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Share2, ExternalLink, X, Check, ShieldCheck, ShieldAlert, Wifi, Key, Lock, Mic, Contact, Phone, Mail, Building, UserPlus, QrCode, Unlock, Bomb, Timer } from 'lucide-react';
import { translations } from '../translations';
import { HistoryItem } from '../types';
import { decryptPayload, parsePayload } from '../utils/payload';

interface ResultModalProps {
  historyItem: HistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onShare: (blob: Blob | null, text: string) => void;
  t: typeof translations['en']['result'];
}

const ResultModal: React.FC<ResultModalProps> = ({ historyItem, isOpen, onClose, onShare, t }) => {
  const [copied, setCopied] = useState(false);
  const [passCopied, setPassCopied] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [password, setPassword] = useState('');
  const [displayContent, setDisplayContent] = useState<string>('');
  const [unlockError, setUnlockError] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && historyItem) {
        const payload = parsePayload(historyItem.text);
        if (payload.isExpired) {
            setIsExpired(true);
            setIsLocked(false);
            setDisplayContent(''); 
            return;
        } else {
            setIsExpired(false);
        }

        if (payload.isEncrypted) {
            setIsLocked(true);
            setDisplayContent('');
            setPassword('');
            setUnlockError(false);
        } else {
            setIsLocked(false);
            setDisplayContent(payload.data || historyItem.text);
        }
    }
  }, [isOpen, historyItem]);

  const handleUnlock = () => {
    if (!historyItem) return;
    const result = decryptPayload(historyItem.text, password);
    if (result) {
        setDisplayContent(result);
        setIsLocked(false);
        setUnlockError(false);
    } else {
        setUnlockError(true);
    }
  };

  if (!isOpen || !historyItem) return null;
  const qrColor = historyItem.meta?.color || '#000000';

  const isUrl = (text: string) => {
    if (!text) return false;
    try { new URL(text); return true; } catch { return text.startsWith('www.') || text.startsWith('http'); }
  };

  const isSecure = (text: string) => text ? text.startsWith('https://') : false;
  const isWifi = (text: string) => text ? text.startsWith('WIFI:') : false;
  const isVCard = (text: string) => text ? /^BEGIN:VCARD/i.test(text) : false;
  const isAudio = (text: string) => {
      if (!text) return false;
      const lower = text.toLowerCase();
      return lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.ogg') || lower.includes('firebasestorage');
  };

  const parseWifi = (text: string) => {
    const ssid = text.match(/S:(.*?);/)?.[1] || 'Unknown';
    const password = text.match(/P:(.*?);/)?.[1] || '';
    const type = text.match(/T:(.*?);/)?.[1] || 'None';
    return { ssid, password, type };
  };

  const parseVCard = (text: string) => {
      const getVal = (key: string) => {
          const regex = new RegExp(`(?:^|\\r?\\n)${key}(?:;[^:]*?)?:([^\\n\\r]+)`, 'i');
          const match = text.match(regex);
          return match ? match[1].trim() : '';
      };
      const fn = getVal('FN');
      let displayName = fn;
      if (!displayName) {
          const nParts = getVal('N').split(';');
          displayName = nParts.length > 1 ? `${nParts[1]} ${nParts[0]}`.trim() : nParts[0]?.trim() || '';
      }
      return { fn: displayName, tel: getVal('TEL'), email: getVal('EMAIL'), org: getVal('ORG') };
  };

  const handleCopy = async (text: string, isPass = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isPass) { setPassCopied(true); setTimeout(() => setPassCopied(false), 2000); }
      else { setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch (err) {}
  };

  const handleOpenUrl = () => {
    let url = displayContent;
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    window.open(url, '_blank');
  };

  const handleAddToContacts = () => {
    const blob = new Blob([displayContent], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "contact.vcf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSmartShare = async () => {
      if (!qrRef.current) return;
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
          canvas.toBlob((blob) => onShare(blob, displayContent));
      }
  };

  const renderContent = () => {
    if (isExpired) {
        return (
            <div className="space-y-4 text-center py-6">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                    <Bomb className="w-10 h-10 text-red-600 dark:text-red-500" />
                </div>
                <h4 className="font-bold text-xl text-red-600 dark:text-red-500">{t.expiry.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm px-8 leading-relaxed">{t.expiry.desc}</p>
            </div>
        );
    }

    if (isLocked) {
        return (
            <div className="space-y-4 text-center py-4">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                    <Lock className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                </div>
                <h4 className="font-bold text-xl text-slate-800 dark:text-white">{t.crypto.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm px-4">{t.crypto.lockedDesc}</p>
                <div className="px-4 pt-2">
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.crypto.enterPass} className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 outline-none transition-all text-center text-lg ${unlockError ? 'border-red-500 text-red-600 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-amber-500'}`} onKeyDown={(e) => e.key === 'Enter' && handleUnlock()} />
                    {unlockError && <p className="text-red-500 text-xs mt-2 font-medium">{t.crypto.wrongPass}</p>}
                </div>
                <div className="px-4"><button onClick={handleUnlock} className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-3.5 rounded-xl font-semibold transition-colors shadow-lg shadow-amber-500/20"><Unlock className="w-5 h-5" />{t.crypto.unlock}</button></div>
            </div>
        );
    }

    if (isVCard(displayContent)) {
        const { fn, tel, email, org } = parseVCard(displayContent);
        return (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                 <div className="flex items-center gap-3 mb-2"><div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg"><Contact className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /></div><h4 className="font-bold text-lg text-slate-800 dark:text-white">{t.vcard.title}</h4></div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700"><div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-lg">{fn ? fn.charAt(0).toUpperCase() : '?'}</div><div><h5 className="font-bold text-lg text-slate-900 dark:text-white">{fn || 'Unknown Contact'}</h5>{org && <p className="text-sm text-slate-500 dark:text-slate-400">{org}</p>}</div></div>
                    {tel && <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><Phone className="w-4 h-4 text-slate-400" /><a href={`tel:${tel}`} className="hover:text-primary-600 underline-offset-4 decoration-primary-500/30">{tel}</a></div>}
                    {email && <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><Mail className="w-4 h-4 text-slate-400" /><a href={`mailto:${email}`} className="hover:text-primary-600 underline-offset-4 decoration-primary-500/30 break-all">{email}</a></div>}
                </div>
            </div>
        );
    }

    if (isWifi(displayContent)) {
        const { ssid, password, type } = parseWifi(displayContent);
        return (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-3 mb-2"><div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg"><Wifi className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div><h4 className="font-bold text-lg text-slate-800 dark:text-white">{t.wifi.title}</h4></div>
                <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700"><label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{t.wifi.ssid}</label><p className="text-slate-900 dark:text-white font-medium text-lg">{ssid}</p></div>
                    {password && <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center"><div><label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{t.wifi.password}</label><p className="text-slate-900 dark:text-white font-mono text-lg">{password}</p></div><button onClick={() => handleCopy(password, true)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">{passCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}</button></div>}
                </div>
            </div>
        );
    }

    if (isAudio(displayContent)) {
        return (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-3 mb-2"><div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg"><Mic className="w-6 h-6 text-purple-600 dark:text-purple-400" /></div><h4 className="font-bold text-lg text-slate-800 dark:text-white">{t.audio.title}</h4></div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-center"><audio controls src={displayContent} className="w-full" autoPlay /></div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in zoom-in duration-300">
            {isUrl(displayContent) && (<div className={`mb-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${isSecure(displayContent) ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>{isSecure(displayContent) ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}{isSecure(displayContent) ? t.secure : t.unverified}</div>)}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-6 border border-slate-100 dark:border-slate-700"><p className="text-slate-800 dark:text-slate-200 break-words font-mono text-sm leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">{displayContent}</p></div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm md:max-w-md rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        
        <div className={`p-6 pb-8 text-center relative overflow-hidden shrink-0 ${isExpired ? 'bg-red-600' : 'bg-primary-600'}`}>
             <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br opacity-100 ${isExpired ? 'from-red-500 to-orange-700' : 'from-primary-500 to-indigo-700'}`}></div>
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
             <h3 className="relative text-white font-bold text-xl z-10">{isExpired ? t.expiry.title : t.title}</h3>
             <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-20 p-1 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="px-6 py-6 -mt-4 bg-white dark:bg-slate-900 rounded-t-3xl relative z-10 flex-1 overflow-y-auto no-scrollbar">
            <div className="flex justify-center mb-6">
                 <div ref={qrRef} className={`p-3 bg-white rounded-xl shadow-md border inline-block ${isExpired ? 'border-red-100 dark:border-red-900/30' : 'border-slate-100 dark:border-slate-800'}`}>
                    <QRCodeCanvas
                        value={historyItem.text}
                        size={120}
                        level="M"
                        bgColor="#ffffff"
                        fgColor={isExpired ? '#dc2626' : qrColor}
                        imageSettings={isExpired ? { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Stop_hand_nuvola.svg/120px-Stop_hand_nuvola.svg.png", height: 24, width: 24, excavate: true } : isAudio(displayContent) ? { src: "https://upload.wikimedia.org/wikipedia/commons/2/21/Speaker_Icon.svg", height: 24, width: 24, excavate: true } : isVCard(displayContent) ? { src: "https://upload.wikimedia.org/wikipedia/commons/9/93/Google_Contacts_icon.svg", height: 24, width: 24, excavate: true } : isLocked ? { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Lock_font_awesome.svg/512px-Lock_font_awesome.svg.png", height: 24, width: 24, excavate: true } : undefined}
                    />
                 </div>
            </div>

            {renderContent()}

            {!isLocked && !isExpired && (
                <div className="space-y-3 mt-4 pb-4">
                    {isVCard(displayContent) && <button onClick={handleAddToContacts} className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-primary-500/20 active:scale-98"><UserPlus className="w-5 h-5" />{t.vcard.addToContacts}</button>}
                    {isUrl(displayContent) && !isWifi(displayContent) && !isAudio(displayContent) && <button onClick={handleOpenUrl} className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-primary-500/20 active:scale-98"><ExternalLink className="w-5 h-5" />{t.openBrowser}</button>}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleCopy(displayContent)} className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all duration-200 border-2 active:scale-95 ${copied ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}{copied ? t.copied : t.copy}</button>
                        <button onClick={handleSmartShare} className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-95"><Share2 className="w-5 h-5" />{t.share}</button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
