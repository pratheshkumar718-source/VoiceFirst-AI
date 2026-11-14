import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
  isAiSpeaking?: boolean;
  volume: number;
  getAnalyserData?: () => Uint8Array | null;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isRecording,
  isAiSpeaking,
  volume,
  getAnalyserData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Number of bars
      const numBars = 32;
      const barWidth = 4;
      const gap = (width - numBars * barWidth) / (numBars - 1);

      let data: Uint8Array | null = null;
      if (getAnalyserData && isRecording) {
        data = getAnalyserData();
      }

      for (let i = 0; i < numBars; i++) {
        let barHeight = 4;

        if (isRecording) {
          if (data && data.length > 0) {
            const dataIndex = Math.floor((i / numBars) * (data.length / 2));
            const val = data[dataIndex] || 0;
            barHeight = Math.max(4, (val / 255) * (height - 8));
          } else {
            // Simulated variation based on volume
            const wave = Math.sin(Date.now() / 150 + i * 0.5) * 0.5 + 0.5;
            barHeight = Math.max(4, wave * volume * (height - 8));
          }
        } else if (isAiSpeaking) {
          // AI speaking wave animation
          const wave = Math.sin(Date.now() / 120 + i * 0.4) * 0.5 + 0.5;
          barHeight = Math.max(6, wave * (height - 12));
        }

        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        // Waveform styling - Teal (#0d9488) or Deep Blue when AI speaks
        ctx.fillStyle = isAiSpeaking ? '#2563eb' : isRecording ? '#0d9488' : '#cbd5e1';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [isRecording, isAiSpeaking, volume, getAnalyserData]);

  return (
    <div className="w-full flex flex-col items-center justify-center py-2">
      <canvas
        ref={canvasRef}
        width={340}
        height={60}
        className="w-full max-w-sm h-[60px]"
      />
      <div className="text-xs text-gray-500 mt-1 font-medium">
        {isRecording
          ? 'Listening to your voice...'
          : isAiSpeaking
          ? 'VoiceFirst AI is speaking...'
          : 'Microphone is idle'}
      </div>
    </div>
  );
};

