import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, AlertCircle } from 'lucide-react';
import { translations } from '../translations';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  isActive: boolean;
  t: typeof translations['en']['scan'];
}

const Scanner: React.FC<ScannerProps> = ({ onScan, isActive, t }) => {
  const [hasError, setHasError] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    
    const startScanner = async () => {
      if (!isActive) return;

      try {
        // Request permission explicitly first to handle UI state
        await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
        setHasError(false);

        const formatsToSupport = [Html5QrcodeSupportedFormats.QR_CODE];
        // Pass formatsToSupport in the constructor configuration
        // Fix: Added 'verbose: false' to satisfy Html5QrcodeFullConfig type requirement
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
             // Success callback
             if (mountedRef.current) {
               // Stop scanning temporarily after success to avoid multiple triggers
               html5QrCode.pause(true); 
               onScan(decodedText);
             }
          },
          (errorMessage) => {
            // parse error, ignore for UI cleanliness
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
      // Small timeout to ensure DOM is ready
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
  }, [isActive, onScan]);

  if (!isActive) return null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative bg-black">
      {/* Scanner Viewport */}
      <div id="reader" className="w-full h-full object-cover"></div>

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
        {hasPermission === false ? (
          <div className="bg-slate-900/90 text-white p-6 rounded-2xl max-w-xs text-center mx-4 border border-red-500/50 backdrop-blur-sm">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">{t.cameraPermissionTitle}</h3>
            <p className="text-slate-300 text-sm">{hasError ? t.error : t.cameraPermissionDesc}</p>
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

      {/* Instructions */}
      <div className="absolute bottom-24 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-white text-sm font-medium">
        {t.instruction}
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