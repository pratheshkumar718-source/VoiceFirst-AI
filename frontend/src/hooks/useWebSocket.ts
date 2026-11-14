import { useState, useEffect, useRef, useCallback } from 'react';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isSpoken?: boolean;
}

interface UseWebSocketOptions {
  language?: string;
  documentContext?: any;
  onTranscript?: (message: ChatMessage) => void;
  onFieldDetected?: (field: string, value: string) => void;
  onTurnComplete?: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [serverMode, setServerMode] = useState<string>('ready');

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const pingIntervalRef = useRef<any>(null);

  // Initialize playback AudioContext (24kHz for Gemini Live)
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx({ sampleRate: 24000 });
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Play PCM 24kHz chunk from Gemini Live
  const playPcmAudio = useCallback((base64Data: string, sampleRate = 24000) => {
    try {
      const ctx = getAudioContext();
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32Array.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const startTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + audioBuffer.duration;

      setIsAiSpeaking(true);
      source.onended = () => {
        if (ctx.currentTime >= nextPlayTimeRef.current - 0.05) {
          setIsAiSpeaking(false);
        }
      };
    } catch (err) {
      console.error('Error playing audio chunk:', err);
    }
  }, [getAudioContext]);

  // Fallback: Speak text using browser Web Speech API (Tamil / English)
  const speakTextFallback = useCallback((text: string, language: string = 'en') => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis error:', err);
      setIsAiSpeaking(false);
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // If on Live Server (port 5500), connect directly to backend on 8000
    const host =
      window.location.port === '5500' || window.location.port === '3000'
        ? '127.0.0.1:8000'
        : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/live`;

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      setStatus('connected');
      // Send initial context
      socket.send(
        JSON.stringify({
          type: 'init',
          language: options.language || 'en',
          document_context: options.documentContext || {},
        })
      );

      // Heartbeat ping
      pingIntervalRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 15000);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'status') {
          setServerMode(data.mode || 'connected');
        } else if (data.type === 'audio') {
          // Live PCM audio from Gemini
          playPcmAudio(data.data, 24000);
        } else if (data.type === 'transcript') {
          const newMsg: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            role: data.role,
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          setMessages((prev) => [...prev, newMsg]);
          options.onTranscript?.(newMsg);

          // If fallback mode (no live audio stream returned), synthesize via Web Speech API
          if (data.role === 'model' && serverMode !== 'gemini_live') {
            speakTextFallback(data.text, options.language || 'en');
          }
        } else if (data.type === 'field_detected') {
          options.onFieldDetected?.(data.field, data.value);
        } else if (data.type === 'turn_complete') {
          options.onTurnComplete?.();
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
      setStatus('error');
    };

    socket.onclose = () => {
      setStatus('disconnected');
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [options, playPcmAudio, speakTextFallback, serverMode]);

  const disconnect = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsAiSpeaking(false);
    setStatus('disconnected');
  }, []);

  const sendAudioChunk = useCallback((base64Pcm: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'audio',
          data: base64Pcm,
        })
      );
    }
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'text',
          text,
        })
      );
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Automatically update backend WebSocket when document context or language changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && options.documentContext) {
      wsRef.current.send(
        JSON.stringify({
          type: 'update_context',
          language: options.language || 'en',
          document_context: options.documentContext,
        })
      );
    }
  }, [options.documentContext, options.language]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    messages,
    isAiSpeaking,
    serverMode,
    connect,
    disconnect,
    sendAudioChunk,
    sendTextMessage,
    clearMessages,
  };
}

