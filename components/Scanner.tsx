import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, AlertCircle, Image as ImageIcon, Layers, Zap } from 'lucide-react';
import { translations } from '../translations';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onBatchScan: (decodedText: string) => void;
  isActive: boolean;
  t: typeof translations['en']['scan'];
  batchMode: boolean;
  setBatchMode: (enabled: boolean) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onBatchScan, isActive, t, batchMode, setBatchMode }) => {
  const [hasError, setHasError] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mountedRef.current = true;
    
    const startScanner = async () => {
      if (!isActive) return;

      try {
        // Request permission
        await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
        setHasError(false);

        const formatsToSupport = [Html5QrcodeSupportedFormats.QR_CODE];
        const html5QrCode = new Html5Qrcode("reader", { 
          formatsToSupport, 
          verbose: false 
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
             if (mountedRef.current) {
               if (batchMode) {
                 // Batch Mode: Prevent immediate duplicate scans of the exact same code
                 if (lastScanned !== decodedText) {
                    setLastScanned(decodedText);
                    onBatchScan(decodedText);
                    // Reset duplicate check after 2 seconds
                    setTimeout(() => setLastScanned(null), 2000);
                 }
               } else {
                 // Normal Mode: Stop and show result
                 html5QrCode.pause(true); 
                 onScan(decodedText);
               }
             }
          },
          (errorMessage) => {
            // parse error, ignore
          }
        );
      } catch (err) {
        console.error("Error starting scanner", err);
        if (mountedRef.current) {
          setHasPermission(false);
          setHasError(true);
        }
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (e) {
          console.error("Failed to stop scanner", e);
        }
        scannerRef.current = null;
      }
    };

    if (isActive) {
      const timer = setTimeout(() => {
        startScanner();
      }, 100);
      return () => {
        clearTimeout(timer);
        stopScanner();
        mountedRef.current = false;
      };
    } else {
      stopScanner();
    }
  }, [isActive, onScan, onBatchScan, batchMode, lastScanned]);

  const handleFileScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const html5QrCode = new Html5Qrcode("reader-file", { verbose: false });
        html5QrCode.scanFile(file, true)
            .then(decodedText => {
                onScan(decodedText);
            })
            .catch(err => {
                alert(t.noQrInImage);
            });
    }
  };

  if (!isActive) return null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative bg-black">
      {/* Hidden file reader div required by html5-qrcode for file scanning if main reader not active, 
          but here we use a separate instance or the main one if possible. 
          Actually scanFile can run independently. */}
      <div id="reader-file" style={{ display: 'none' }}></div>

      {/* Main Scanner Viewport */}
      <div id="reader" className="w-full h-full object-cover"></div>

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
        {hasPermission === false ? (
          <div className="bg-slate-900/90 text-white p-6 rounded-2xl max-w-xs text-center mx-4 border border-red-500/50 backdrop-blur-sm pointer-events-auto">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">{t.cameraPermissionTitle}</h3>
            <p className="text-slate-300 text-sm">{hasError ? t.error : t.cameraPermissionDesc}</p>
            <button 
                onClick={() => document.getElementById('file-input')?.click()}
                className="mt-4 px-4 py-2 bg-slate-800 rounded-lg flex items-center justify-center gap-2 w-full"
            >
                <ImageIcon className="w-4 h-4" />
                {t.scanFromImage}
            </button>
          </div>
        ) : (
          <div className="relative w-64 h-64 border-2 border-primary-500/50 rounded-3xl overflow-hidden">
             {/* Scanning Animation */}
             <div className="absolute top-0 left-0 w-full h-1 bg-primary-400 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-[scan_2s_infinite_ease-in-out]"></div>
             
             {/* Corner Markers */}
             <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-primary-500 rounded-tl-lg"></div>
             <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-primary-500 rounded-tr-lg"></div>
             <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-primary-500 rounded-bl-lg"></div>
             <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-primary-500 rounded-br-lg"></div>
          </div>
        )}
      </div>

      {/* Controls Container */}
      <div className="absolute bottom-24 w-full px-6 flex justify-between items-end pointer-events-auto">
         {/* Batch Mode Toggle */}
         <div className="flex flex-col items-center gap-2">
            <button 
                onClick={() => setBatchMode(!batchMode)}
                className={`p-3 rounded-full backdrop-blur-md border transition-all ${
                    batchMode 
                    ? 'bg-primary-500/80 border-primary-400 text-white' 
                    : 'bg-black/40 border-white/10 text-slate-300'
                }`}
            >
                {batchMode ? <Zap className="w-6 h-6 fill-current" /> : <Layers className="w-6 h-6" />}
            </button>
            <span className="text-xs font-medium text-white/80 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
                {batchMode ? t.batchModeOn : t.batchModeOff}
            </span>
         </div>
         
         {/* Gallery Button */}
         <div className="flex flex-col items-center gap-2">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all"
            >
                <ImageIcon className="w-6 h-6" />
            </button>
            <span className="text-xs font-medium text-white/80 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
                {t.gallery}
            </span>
            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileScan}
            />
         </div>
      </div>
      
      <style>{`
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