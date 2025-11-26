
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScannerState } from 'html5-qrcode';
import { AlertCircle, Image as ImageIcon, Layers, Zap, RotateCcw, X, ExternalLink, Copy, Wifi, User, Phone, Lock } from 'lucide-react';
import { translations } from '../translations';
import { ScanType } from '../types';
import { isEncrypted, extractEncryptedData } from '../utils/crypto';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onBatchScan: (decodedText: string) => void;
  isActive: boolean;
  t: typeof translations['en']['scan'];
  batchMode: boolean;
  setBatchMode: (enabled: boolean) => void;
}

interface ArOverlayState {
  x: number;
  y: number;
  text: string;
  type: ScanType;
  isVisible: boolean;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onBatchScan, isActive, t, batchMode, setBatchMode }) => {
  const [hasError, setHasError] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [arOverlay, setArOverlay] = useState<ArOverlayState | null>(null);

  const onScanRef = useRef(onScan);
  const onBatchScanRef = useRef(onBatchScan);
  const batchModeRef = useRef(batchMode);
  const lastScannedRef = useRef<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    onScanRef.current = onScan;
    onBatchScanRef.current = onBatchScan;
    batchModeRef.current = batchMode;
  }, [onScan, onBatchScan, batchMode]);

  const detectType = (text: string): ScanType => {
      const processed = extractEncryptedData(text);
      if (isEncrypted(processed)) return 'crypto';
      if (processed.startsWith('WIFI:')) return 'wifi';
      if (/^BEGIN:VCARD/i.test(processed)) return 'vcard';
      if (processed.startsWith('http')) return 'url';
      if (processed.toLowerCase().endsWith('.mp3')) return 'audio';
      return 'text';
  };

  useEffect(() => {
    let isMounted = true;
    const elementId = "reader";

    const cleanupScanner = async () => {
      if (processingRef.current) return;
      if (!scannerRef.current) return;

      try {
        processingRef.current = true;
        let state;
        try { state = scannerRef.current.getState(); } catch (e) { state = Html5QrcodeScannerState.UNKNOWN; }
        
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
            await scannerRef.current.stop();
        }
        if (document.getElementById(elementId)) {
            try { scannerRef.current.clear(); } catch (e) {}
        }
      } catch (error) {
        console.warn("Cleanup error", error);
      } finally {
        scannerRef.current = null;
        processingRef.current = false;
        if (isMounted) setArOverlay(null);
      }
    };

    const startScanner = async () => {
      if (!isActive) {
        await cleanupScanner();
        return;
      }
      if (processingRef.current) return;
      if (!document.getElementById(elementId)) {
        if (isMounted) setTimeout(startScanner, 100);
        return;
      }
      if (scannerRef.current) {
          if (scannerRef.current.isScanning) return;
          await cleanupScanner();
      }

      try {
        processingRef.current = true;
        const html5QrCode = new Html5Qrcode(elementId, { 
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], 
          verbose: false 
        });
        scannerRef.current = html5QrCode;
        
        await html5QrCode.start(
          { facingMode: facingMode },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: window.innerWidth / window.innerHeight,
          },
          (decodedText, decodedResult) => {
             if (!isMounted) return;

             if (batchModeRef.current) {
                 if (lastScannedRef.current !== decodedText) {
                    lastScannedRef.current = decodedText;
                    onBatchScanRef.current(decodedText);
                    setTimeout(() => { if (isMounted) lastScannedRef.current = null; }, 2000);
                 }
             } else {
                 if (scannerRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
                     scannerRef.current.pause(true);
                 }
                 setArOverlay({
                     x: 0,
                     y: 0,
                     text: decodedText,
                     type: detectType(decodedText),
                     isVisible: true
                 });
             }
          },
          (errorMessage) => { }
        );

        if (isMounted) {
            setHasPermission(true);
            setHasError(false);
        }
      } catch (err) {
        console.error("Scanner Error", err);
        if (isMounted) {
          setHasPermission(false);
          setHasError(true);
        }
      } finally {
          processingRef.current = false;
      }
    };

    const timer = setTimeout(startScanner, 100);
    return () => {
      isMounted = false;
      clearTimeout(timer);
      cleanupScanner().catch(e => console.error(e));
    };
  }, [isActive, facingMode]);

  const handleFileScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const html5QrCode = new Html5Qrcode("reader-file", { verbose: false });
        html5QrCode.scanFile(file, true)
            .then(decodedText => onScanRef.current(decodedText))
            .catch(err => alert(t.noQrInImage));
    }
  };

  const toggleCamera = () => {
      setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const closeArOverlay = () => {
      setArOverlay(null);
      if (scannerRef.current?.getState() === Html5QrcodeScannerState.PAUSED) {
          scannerRef.current.resume();
      }
  };

  const handleArAction = () => {
      if (!arOverlay) return;
      onScanRef.current(arOverlay.text);
      setArOverlay(null);
  };

  const getArIcon = (type: ScanType) => {
      switch(type) {
          case 'wifi': return <Wifi className="w-8 h-8 text-blue-500" />;
          case 'vcard': return <User className="w-8 h-8 text-indigo-500" />;
          case 'url': return <ExternalLink className="w-8 h-8 text-green-500" />;
          case 'crypto': return <Lock className="w-8 h-8 text-amber-500" />;
          case 'audio': return <Phone className="w-8 h-8 text-purple-500" />;
          default: return <Copy className="w-8 h-8 text-slate-500" />;
      }
  };

  if (!isActive) {
      return (
        <div className="hidden">
            <div id="reader"></div>
            <div id="reader-file"></div>
        </div>
      );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative bg-black overflow-hidden">
      <div id="reader-file" style={{ display: 'none' }}></div>
      <div id="reader" className={`w-full h-full ${facingMode === 'user' ? 'mirror-mode' : ''}`}></div>

      {/* AR Overlay */}
      {arOverlay && (
          <div className="absolute inset-0 z-50 flex items-center justify-center animate-in fade-in zoom-in duration-300 px-6">
             <div className="relative w-full max-w-sm">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary-500/20 rounded-full animate-ping pointer-events-none"></div>
                 
                 <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 flex flex-col items-center gap-4 w-full">
                     <button onClick={closeArOverlay} className="absolute -top-3 -right-3 p-2 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-700 z-10"><X className="w-4 h-4" /></button>
                     <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-inner mb-1">{getArIcon(arOverlay.type)}</div>
                     <div className="text-center w-full">
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{arOverlay.type}</p>
                         <p className="text-sm text-slate-600 dark:text-slate-300 font-medium truncate w-full px-2">{arOverlay.type === 'crypto' ? '*** Encrypted ***' : arOverlay.text}</p>
                     </div>
                     <button onClick={handleArAction} className="w-full py-3.5 px-6 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30">
                         {t.ar.view}
                     </button>
                 </div>
             </div>
          </div>
      )}

      {/* Standard Scanning Overlay */}
      {!arOverlay && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {hasPermission === false ? (
            <div className="bg-slate-900/95 text-white p-6 rounded-2xl max-w-xs text-center mx-4 border border-red-500/50 backdrop-blur-sm pointer-events-auto shadow-2xl">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-2">{t.cameraPermissionTitle}</h3>
                <p className="text-slate-300 text-sm mb-4">{hasError ? t.error : t.cameraPermissionDesc}</p>
                <button onClick={() => document.getElementById('file-input')?.click()} className="px-4 py-2.5 bg-slate-800 rounded-lg flex items-center justify-center gap-2 w-full font-medium active:scale-95 transition-transform"><ImageIcon className="w-4 h-4" />{t.scanFromImage}</button>
            </div>
            ) : (
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-2 border-primary-500/50 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.1)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary-400 shadow-[0_0_20px_rgba(99,102,241,0.8)] animate-[scan_2s_infinite_ease-in-out]"></div>
                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary-500 rounded-br-lg"></div>
            </div>
            )}
        </div>
      )}

      {/* Controls Bar */}
      <div className="absolute bottom-6 w-full px-8 flex justify-between items-end pointer-events-auto">
         {/* Batch Mode */}
         <div className="flex flex-col items-center gap-2">
            <button onClick={() => setBatchMode(!batchMode)} className={`p-3 rounded-full backdrop-blur-md border transition-all active:scale-95 ${batchMode ? 'bg-primary-500/90 border-primary-400 text-white' : 'bg-black/40 border-white/10 text-slate-300'}`}>
                {batchMode ? <Zap className="w-6 h-6 fill-current" /> : <Layers className="w-6 h-6" />}
            </button>
            <span className="text-[10px] font-bold text-white/90 bg-black/60 px-2 py-1 rounded-md backdrop-blur-md">{batchMode ? t.batchModeOn : t.batchModeOff}</span>
         </div>

         {/* Camera Switch */}
         <div className="flex flex-col items-center gap-2 mb-1">
            <button onClick={toggleCamera} className="p-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all active:scale-95 shadow-lg">
                <RotateCcw className="w-7 h-7" />
            </button>
             <span className="text-[10px] font-bold text-white/90 bg-black/60 px-2 py-1 rounded-md backdrop-blur-md">{t.flip}</span>
         </div>
         
         {/* Gallery */}
         <div className="flex flex-col items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all active:scale-95">
                <ImageIcon className="w-6 h-6" />
            </button>
            <span className="text-[10px] font-bold text-white/90 bg-black/60 px-2 py-1 rounded-md backdrop-blur-md">{t.gallery}</span>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileScan} />
         </div>
      </div>
      
      <style>{`
        #reader video {
            object-fit: cover !important;
            width: 100% !important;
            height: 100% !important;
            border-radius: 0 !important;
        }
        #reader.mirror-mode video {
            transform: scaleX(-1) !important;
        }
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Scanner;
