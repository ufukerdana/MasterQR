import React from 'react';
import { Trash2, Download, FileText, Wifi, Globe, Link, Clock } from 'lucide-react';
import { translations } from '../translations';
import { HistoryItem, ScanType } from '../types';

interface HistoryProps {
  history: HistoryItem[];
  onClear: () => void;
  onItemClick: (text: string) => void;
  t: typeof translations['en']['history'];
}

const History: React.FC<HistoryProps> = ({ history, onClear, onItemClick, t }) => {
  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleExport = () => {
    if (history.length === 0) return;
    
    // Create CSV content
    const header = "Timestamp,Type,Content\n";
    const rows = history.map(item => {
        const date = new Date(item.timestamp).toISOString();
        // Escape quotes in content
        const content = `"${item.text.replace(/"/g, '""')}"`;
        return `${date},${item.type},${content}`;
    }).join("\n");
    
    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
        default: return <FileText className="w-5 h-5" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950">
       <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" />
                {t.title}
            </h2>
            <div className="flex gap-2">
                <button 
                    onClick={handleExport}
                    disabled={history.length === 0}
                    className="p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50"
                    title={t.export}
                >
                    <Download className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setShowConfirm(true)}
                    disabled={history.length === 0}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                    title={t.clear}
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <Clock className="w-12 h-12 mb-3 opacity-20" />
                    <p>{t.empty}</p>
                </div>
            ) : (
                history.map((item) => (
                    <div 
                        key={item.id}
                        onClick={() => onItemClick(item.text)}
                        className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 active:scale-98 transition-transform cursor-pointer"
                    >
                        <div className={`p-3 rounded-full ${
                            item.type === 'wifi' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                            item.type === 'url' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                            {getIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{item.text}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{formatDate(item.timestamp)}</p>
                        </div>
                    </div>
                ))
            )}
       </div>

       {/* Clear Confirmation Dialog */}
       {showConfirm && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-xs w-full shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t.clearConfirmTitle}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t.clearConfirmDesc}</p>
                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={() => setShowConfirm(false)}
                        className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium"
                    >
                        {t.cancel}
                    </button>
                    <button 
                        onClick={() => { onClear(); setShowConfirm(false); }}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                    >
                        {t.confirm}
                    </button>
                </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default History;