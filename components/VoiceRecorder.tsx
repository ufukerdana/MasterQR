
import React, { useState, useRef } from 'react';
import { Mic, Square, Play, UploadCloud, RefreshCcw } from 'lucide-react';
import { uploadAudio } from '../services/audioService';
import { translations } from '../translations';

interface VoiceRecorderProps {
  onUploadComplete: (url: string) => void;
  t: typeof translations['en']['generate']['voice'];
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onUploadComplete, t }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    // Safety check for browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Audio recording is not supported in this browser or context (requires HTTPS).");
        return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Safety check for MediaRecorder support
      if (typeof MediaRecorder === 'undefined') {
          alert("MediaRecorder is not supported in this browser.");
          return;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      // Handle "Uncaught" permission errors gracefully
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Check state to prevent "inactive" state errors
      if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  const handleUpload = async () => {
    if (!audioBlob) return;
    
    setIsUploading(true);
    try {
      const url = await uploadAudio(audioBlob);
      onUploadComplete(url);
    } catch (error) {
      console.error(error);
      alert(t.error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setAudioBlob(null);
    setIsRecording(false);
  };

  const handlePreview = () => {
    if (!audioBlob) return;
    try {
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);
        audio.play().catch(e => console.warn("Audio play failed", e));
    } catch (e) {
        console.error("Preview failed", e);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
      
      {!audioBlob ? (
        <div className="text-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-500/30' 
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {isRecording ? (
              <Square className="w-8 h-8 text-white fill-current" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
          <p className="mt-4 text-slate-600 dark:text-slate-300 font-medium">
            {isRecording ? t.recording : t.tapToRecord}
          </p>
        </div>
      ) : (
        <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-2">
           <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <Mic className="w-5 h-5" />
                 </div>
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Audio Recorded</span>
              </div>
              <div className="flex gap-2">
                 <button onClick={handlePreview} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                    <Play className="w-5 h-5" />
                 </button>
                 <button onClick={handleReset} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                    <RefreshCcw className="w-5 h-5" />
                 </button>
              </div>
           </div>

           <button
             onClick={handleUpload}
             disabled={isUploading}
             className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 transition-all"
           >
             {isUploading ? (
                <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.uploading}
                </>
             ) : (
                <>
                    <UploadCloud className="w-5 h-5" />
                    {t.upload}
                </>
             )}
           </button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
