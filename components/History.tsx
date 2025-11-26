

import React, { useState } from 'react';
import { Trash2, Download, FileText, Wifi, Globe, Clock, Contact, User, Lock, Timer } from 'lucide-react';
import { translations } from '../translations';
import { HistoryItem, ScanType } from '../types';

interface HistoryProps {
  history: HistoryItem[];
  onClear: () => void;
  onItemClick: (item: HistoryItem) => void;
  t: typeof translations['en']['history'];
}

const History: React.FC<HistoryProps> = ({ history, onClear, onItemClick, t }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'scan' | 'generate'>('all');

  const handleExport = () => {
    if (history.length === 0) return;
    const header = "Timestamp,Type,Content\n";
    const rows = history.map(item => {
        const date = new Date(item.timestamp).toISOString();
        const content = `"${item.text.replace(/"/g, '""')}"`;
        return `${date},${item.type},${content}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `masterqr_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getIcon = (type: ScanType) => {
    switch (type) {
        case 'wifi': return <Wifi className="w-5 h-5" />;
        case 'url': return <Globe className="w-5 h-5" />;
        case 'vcard': return <Contact className="w-5 h-5" />;
        case 'audio': return <User className="w-5 h-5" />;
        case 'crypto': return <Lock className="w-5 h-5" />;
        default: return <FileText className="w-5 h-5" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getVCardName = (text: string) => {
     const getValue = (key: string) => {
        const regex = new RegExp(`(?:^|\\n)${key}(?:;[^:]*?)?:([^\\n\\r]+)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : null;
     };
     const fn = getValue('FN');
     if (fn) return fn;
     const n = getValue('N');
     if (n) {
        const parts = n.split(';');
        const family = parts[0]?.trim() || '';
        const given = parts[1]?.trim() || '';
        if (given || family) return `${given} ${family}`.trim();
     }
     return getValue('ORG') || t.item.contact;
  };

  const filteredHistory = history.filter(item => {
      if (filter === 'all') return true;
      return item.source === filter; 
  });

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950">
       <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Clock className="w-5 h-5 text-primary-500" />{t.title}</h2>
                <div className="flex gap-2">
                    <button onClick={handleExport} disabled={history.length === 0} className="p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50"><Download className="w-5 h-5" /></button>
                    <button onClick={() => setShowConfirm(true)} disabled={history.length === 0} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"><Trash2 className="w-5 h-5" /></button>
                </div>
            </div>
            
            {/* Filter Segmented Control */}
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                <button onClick={() => setFilter('all')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'all' ? 'bg-white dark:bg-slate-700 shadow text-primary-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{t.filters.all}</button>
                <button onClick={() => setFilter('scan')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'scan' ? 'bg-white dark:bg-slate-700 shadow text-primary-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{t.filters.scan}</button>
                <button onClick={() => setFilter('generate')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'generate' ? 'bg-white dark:bg-slate-700 shadow text-primary-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{t.filters.generate}</button>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar">
            {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400"><Clock className="w-12 h-12 mb-3 opacity-20" /><p>{t.empty}</p></div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filteredHistory.map((item) => {
                        const isExpired = item.expiresAt && Date.now() > item.expiresAt;
                        return (
                        <div 
                            key={item.id}
                            onClick={() => onItemClick(item)}
                            className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border flex items-center gap-4 active:scale-98 transition-transform cursor-pointer ${isExpired ? 'border-red-200 dark:border-red-900/30 opacity-70' : 'border-slate-100 dark:border-slate-800'}`}
                        >
                            <div className={`p-3 rounded-full flex-shrink-0 ${item.type === 'wifi' ? 'bg-blue-100 text-blue-600' : item.type === 'crypto' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                                {isExpired ? <Timer className="w-5 h-5 text-red-500" /> : getIcon(item.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <p className={`font-medium truncate ${isExpired ? 'text-red-500 decoration-line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {isExpired ? t.item.expired : item.type === 'vcard' ? getVCardName(item.text) : item.type === 'crypto' ? t.item.encrypted : item.text}
                                    </p>
                                </div>
                                <div className="flex justify-between mt-0.5">
                                    <p className="text-xs text-slate-500 dark:text-slate-500">{formatDate(item.timestamp)}</p>
                                    <p className="text-[10px] uppercase font-bold text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{t.types[item.source]}</p>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}
       </div>

       {showConfirm && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-xs w-full shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t.clearConfirmTitle}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t.clearConfirmDesc}</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium">{t.cancel}</button>
                    <button onClick={() => { onClear(); setShowConfirm(false); }} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium">{t.confirm}</button>
                </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default History;