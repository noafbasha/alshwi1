
import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { createPcmBlob, decodeAudio, convertAudioDataToBuffer } from '../services/audioUtils';
import { useNotify } from '../context/NotificationContext';
import { agencyFunctions } from '../services/geminiService';

export const useLiveAssistant = (
  onActionDetected?: (action: any) => void,
  onTranscriptionUpdate?: (text: string, isUser: boolean) => void
) => {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const { notify } = useNotify();
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const stopSession = useCallback(() => {
    setIsVoiceMode(false);
    setIsLiveActive(false);
    
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    sessionPromiseRef.current = null;
  }, []);

  const startSession = useCallback(async (systemInstruction: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let inputCtx: AudioContext | null = null;
    let outputCtx: AudioContext | null = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      setIsLiveActive(true);
      setIsVoiceMode(true);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } 
          },
          systemInstruction,
          tools: [{ functionDeclarations: agencyFunctions }],
          inputAudioTranscription: {}, // Enable input transcription
          outputAudioTranscription: {} // Enable output transcription
        },
        callbacks: {
          onopen: () => {
            if (!inputCtx) return;
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm = createPcmBlob(inputData);
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcm }));
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Transcriptions
            if (msg.serverContent?.inputTranscription && onTranscriptionUpdate) {
              onTranscriptionUpdate(msg.serverContent.inputTranscription.text, true);
            }
            if (msg.serverContent?.outputTranscription && onTranscriptionUpdate) {
              onTranscriptionUpdate(msg.serverContent.outputTranscription.text, false);
            }

            // Handle Tools
            if (msg.toolCall) {
              msg.toolCall.functionCalls.forEach(fc => {
                if (onActionDetected) onActionDetected(fc);
                sessionPromise.then(s => {
                  s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: "ok" } }
                  });
                });
              });
            }

            // Handle Interruption
            if (msg.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(source => { try { source.stop(); } catch (e) {} });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            // Handle Audio
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputCtx) {
              const audioData = decodeAudio(base64Audio);
              const buffer = await convertAudioDataToBuffer(audioData, outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.addEventListener('ended', () => activeSourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              activeSourcesRef.current.add(source);
            }
          },
          onclose: () => stopSession(),
          onerror: () => stopSession()
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (e: any) {
      notify(e.message || 'خطأ في تشغيل الخبير الصوتي', 'error');
      stopSession();
    }
  }, [stopSession, notify, onActionDetected, onTranscriptionUpdate]);

  return { isVoiceMode, isLiveActive, startSession, stopSession };
};
