import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Sparkles, Image as ImageIcon } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (file: File) => void;
  language: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
  language,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileFallbackRef = useRef<HTMLInputElement | null>(null);

  const isTamil = language === 'ta';

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCapturedImage(null);

    // Stop existing stream if any
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        isTamil
          ? 'கேமரா அணுகல் கிடைக்கவில்லை. உங்கள் கோப்பகத்திலிருந்து புகைப்படத்தைத் தேர்வு செய்யவும்.'
          : 'Could not access camera. You can choose a photo from your device instead.'
      );
    }
  }, [facingMode, isTamil]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      // Clean up stream on close
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setCapturedImage(null);
      setCameraError(null);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);

    // Stop video preview while reviewing photo
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleConfirmPhoto = () => {
    if (!canvasRef.current || !capturedImage) return;

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `document_capture_${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          onPhotoCaptured(file);
          onClose();
        }
      },
      'image/jpeg',
      0.92
    );
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onPhotoCaptured(e.target.files[0]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl border border-slate-700 w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {isTamil ? 'படிவத்தை புகைப்படம் எடுக்கவும்' : 'Take a Clean Photo of Document'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isTamil
                  ? 'படிவத்தை வெளிச்சத்தில் நேராக வைத்து படம் எடுக்கவும்'
                  : 'Place paper form in good lighting and align inside the frame'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport / Frame */}
        <div className="relative flex-1 bg-black min-h-[320px] sm:min-h-[380px] flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            /* Review captured photo */
            <img
              src={capturedImage}
              alt="Captured Document"
              className="w-full h-full object-contain max-h-[60vh]"
            />
          ) : cameraError ? (
            /* Fallback when camera is unavailable */
            <div className="p-6 text-center max-w-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {cameraError}
              </p>
              <button
                onClick={() => fileFallbackRef.current?.click()}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>{isTamil ? 'கேலரி அல்லது கோப்பைத் தேர்ந்தெடுக்கவும்' : 'Choose Photo from Device'}</span>
              </button>
            </div>
          ) : (
            /* Live Camera Stream with Document Alignment Overlay */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Document Alignment Frame Box */}
              <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-teal-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-3 shadow-[0_0_50px_rgba(13,148,136,0.15)]">
                <div className="flex justify-between items-start text-[10px] font-black text-teal-300 bg-black/40 px-2 py-1 rounded backdrop-blur-xs self-center">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-400 animate-spin" />
                    {isTamil ? 'படிவத்தை இந்த கட்டத்திற்குள் வைக்கவும்' : 'Align form inside this guide box'}
                  </span>
                </div>
                {/* 4 Corner Accents */}
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-teal-300" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-teal-300" />
                </div>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileFallbackRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFallbackFile}
          />
        </div>

        {/* Modal Bottom Controls */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
          {capturedImage ? (
            /* Confirm or Retake */
            <>
              <button
                onClick={handleRetake}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isTamil ? 'மீண்டும் எடுக்க' : 'Retake Photo'}</span>
              </button>
              <button
                onClick={handleConfirmPhoto}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isTamil ? 'இதை உறுதிசெய்து தொடரவும்' : 'Use Photo & Analyze'}</span>
              </button>
            </>
          ) : !cameraError ? (
            /* Snap photo controls */
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5"
                title="Switch Camera"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isTamil ? 'கேமரா மாற்று' : 'Flip'}</span>
              </button>

              {/* Large Shutter Button */}
              <button
                onClick={handleCapture}
                className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 p-1 flex items-center justify-center shadow-lg cursor-pointer ring-4 ring-teal-500/50 hover:scale-105 transition-all"
                title="Capture Photo"
              >
                <div className="w-13 h-13 rounded-full border-2 border-slate-900 bg-white" />
              </button>

              <button
                onClick={() => fileFallbackRef.current?.click()}
                className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5"
                title="Upload Photo"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isTamil ? 'கோப்பு' : 'File'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              {isTamil ? 'ரத்து செய்' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

