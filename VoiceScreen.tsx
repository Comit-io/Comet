
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Screen, Message } from '../types';
import { connectLiveSession, createBlob, decode, decodeAudioData, blobToBase64 } from '../services/geminiService';
import { LiveServerMessage, LiveSession } from '@google/genai';
import { CloseIcon, CameraIcon, CameraOffIcon, CameraSwitchIcon } from './icons';

interface VoiceScreenProps {
  navigateTo: (screen: Screen) => void;
  startNewChat: (messages: Message[]) => void;
}

type Status = 'listening' | 'speaking' | 'thinking';
type ConversationTurn = { id: number; speaker: 'user' | 'ai'; text: string };

const VoiceScreen: React.FC<VoiceScreenProps> = ({ navigateTo, startNewChat }) => {
    const [status, setStatus] = useState<Status>('listening');
    const [conversationLog, setConversationLog] = useState<ConversationTurn[]>([]);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    
    const conversationLogRef = useRef(conversationLog);
    useEffect(() => {
        conversationLogRef.current = conversationLog;
    }, [conversationLog]);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameIntervalRef = useRef<number | null>(null);

    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);

    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const currentTurnIdRef = useRef<number | null>(null);

    const stopCamera = useCallback(() => {
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
    }, []);

    const endConversation = useCallback(() => {
        stopCamera();
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        
        const messages: Message[] = conversationLogRef.current
            .filter(turn => turn.text.trim() !== '')
            .map(turn => ({
                id: turn.id,
                text: turn.text,
                sender: turn.speaker,
            }));
        
        if (messages.length > 0) {
            startNewChat(messages);
        } else {
            navigateTo(Screen.Home);
        }

    }, [navigateTo, startNewChat, stopCamera]);


    const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
        try {
           const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
           if (videoRef.current) {
             videoRef.current.srcObject = stream;
             videoRef.current.play();
           }
           setIsCameraOn(true);
        
           // Reduced to 1 FPS to prioritize audio and reduce network load.
           const FPS = 1; 
           frameIntervalRef.current = window.setInterval(async () => {
              if (!sessionPromiseRef.current) return;
              if (!videoRef.current || !canvasRef.current) return;
        
              const ctx = canvasRef.current.getContext('2d');
              if (!ctx) return;
        
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              ctx.drawImage(videoRef.current, 0, 0);
              
              // Use toBlob for better performance than toDataURL
              canvasRef.current.toBlob(async (blob) => {
                  if (blob) {
                      const base64Data = await blobToBase64(blob);
                      sessionPromiseRef.current?.then(session => {
                         session.sendRealtimeInput({
                             media: {
                                 mimeType: 'image/jpeg',
                                 data: base64Data
                             }
                         });
                      });
                  }
              }, 'image/jpeg', 0.5); // 0.5 quality
        
           }, 1000 / FPS);
        } catch (err) {
            console.error("Failed to start camera:", err);
            alert("Could not access camera. Please allow permissions.");
        }
    }

    const toggleCamera = () => {
        if (isCameraOn) {
            stopCamera();
        } else {
            startCamera(facingMode);
        }
    }

    const handleSwitchCamera = () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        
        if (isCameraOn) {
             // If camera is already on, restart it with new mode
             if (frameIntervalRef.current) {
                clearInterval(frameIntervalRef.current);
                frameIntervalRef.current = null;
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            // Add a small delay to ensure cleanup
            setTimeout(() => startCamera(newMode), 100);
        }
    }


    useEffect(() => {
        const start = async () => {
            try {
                setStatus('listening');
                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
                
                const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                inputAudioContextRef.current = context;

                sessionPromiseRef.current = connectLiveSession({
                    onOpen: () => {
                        const source = context.createMediaStreamSource(stream);
                        // REDUCED BUFFER SIZE TO 1024 FOR EVEN FASTER RESPONSE
                        const scriptProcessor = context.createScriptProcessor(1024, 1, 1);

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(context.destination);
                    },
                    onMessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            setConversationLog(prev => {
                                const lastTurn = prev[prev.length - 1];
                                if (!lastTurn || lastTurn.speaker === 'ai') {
                                    const newTurn = { id: Date.now(), speaker: 'user' as const, text };
                                    currentTurnIdRef.current = newTurn.id;
                                    return [...prev, newTurn];
                                }
                                return prev.map(turn => turn.id === currentTurnIdRef.current ? { ...turn, text: turn.text + text } : turn);
                            });
                        }

                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                             setConversationLog(prev => {
                                const lastTurn = prev[prev.length - 1];
                                if (!lastTurn || lastTurn.speaker === 'user') {
                                    const newTurn = { id: Date.now(), speaker: 'ai' as const, text };
                                    currentTurnIdRef.current = newTurn.id;
                                    return [...prev, newTurn];
                                }
                                return prev.map(turn => turn.id === currentTurnIdRef.current ? { ...turn, text: turn.text + text } : turn);
                            });
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            setStatus('speaking');
                            const audioContext = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                            const source = audioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(audioContext.destination);
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                                if (sourcesRef.current.size === 0) {
                                    setStatus('listening');
                                }
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                        
                        if (message.serverContent?.turnComplete) {
                           setStatus('thinking');
                        }

                        if (message.serverContent?.interrupted) {
                            for (const source of sourcesRef.current.values()) {
                                source.stop();
                            }
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onError: (e: ErrorEvent) => { console.error('Live session error:', e); endConversation(); },
                    onClose: () => {},
                });

            } catch (error) {
                console.error('Failed to start listening:', error);
                alert("Could not access microphone. Please allow microphone access and refresh the page.");
            }
        };

        start();

        return () => {
            stopCamera();
            if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
            if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close();
            if (outputAudioContextRef.current?.state !== 'closed') outputAudioContextRef.current?.close();
            sessionPromiseRef.current?.then(s => s.close());
        };
    }, [endConversation, stopCamera]);
    
    const currentPrompt = status === 'listening' ? "I'm listening..." : status === 'speaking' ? "Speaking..." : "Thinking...";

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Video Preview Layer */}
        <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${isCameraOn ? 'opacity-100' : 'opacity-0'}`}>
             {/* Mirror effect only for user facing camera */}
             <video ref={videoRef} className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} autoPlay playsInline muted />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
        </div>

        {/* Visualizer Layer - Hidden when Camera is On */}
        <div className={`flex-grow flex items-center justify-center -mt-20 z-10 transition-opacity duration-300 ${isCameraOn ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="relative w-72 h-72 flex items-center justify-center">
                {/* Outer Glows */}
                <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/30 to-purple-600/30 blur-[60px] ${status === 'speaking' ? 'animate-pulse-glow' : ''}`}></div>
                
                {/* Main Orb */}
                <div className={`w-48 h-48 rounded-full bg-[#151525] relative border-2 border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.5)] animate-float`}>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/30 via-transparent to-cyan-600/30 opacity-70 animate-[spin_6s_linear_infinite]"></div>
                    <div className="absolute inset-2 rounded-full bg-[#050B14] z-10 flex items-center justify-center overflow-hidden">
                        {/* Eyes */}
                        <svg viewBox="0 0 100 50" className="w-24 z-20 transition-all duration-300">
                           <defs>
                                <filter id="eye-glow">
                                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                                    <feMerge>
                                        <feMergeNode in="coloredBlur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                            </defs>
                            {status === 'speaking' ? (
                                <>
                                    <path d="M20 30 C 25 20, 35 20, 40 30" stroke="#34d399" strokeWidth="4" fill="none" strokeLinecap="round" filter="url(#eye-glow)"/>
                                    <path d="M60 30 C 65 20, 75 20, 80 30" stroke="#34d399" strokeWidth="4" fill="none" strokeLinecap="round" filter="url(#eye-glow)"/>
                                </>
                            ) : status === 'thinking' ? (
                                <>
                                    <line x1="20" y1="25" x2="40" y2="25" stroke="white" strokeWidth="4" strokeLinecap="round" />
                                    <line x1="60" y1="25" x2="80" y2="25" stroke="white" strokeWidth="4" strokeLinecap="round" />
                                </>
                            ) : ( // listening
                                <>
                                    <path d="M20 25 C 25 15, 35 15, 40 25" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" className="animate-[blink_4s_ease-in-out_infinite]"/>
                                    <path d="M60 25 C 65 15, 75 15, 80 25" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" className="animate-[blink_4s_ease-in-out_infinite] [animation-delay:0.1s]"/>
                                </>
                            )}
                        </svg>
                        {/* Mouth/Waveform simulation inside the orb */}
                        {status === 'speaking' && (
                            <div className="absolute bottom-8 w-16 h-4 flex justify-center items-center gap-1">
                                <div className="w-1 h-1 bg-cyan-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1 h-2 bg-cyan-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1 h-1 bg-cyan-300 rounded-full animate-bounce"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Rings */}
                {status === 'thinking' && (
                    <div className="absolute inset-0 border-2 border-dashed border-purple-400/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                )}
            </div>
        </div>

        {/* Waveform visualizer */}
        <div className={`absolute bottom-32 left-0 right-0 h-16 flex justify-center items-end gap-1 transition-opacity duration-300 ${status === 'speaking' ? 'opacity-100' : 'opacity-0'}`}>
            {[...Array(25)].map((_, i) => (
                <div key={i} className="w-1 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full" style={{ animation: `wave 0.5s ease-in-out infinite alternate`, animationDelay: `${i * 0.02}s` }}></div>
            ))}
        </div>

        {/* Caption & Status Area */}
        <div className="h-56 flex flex-col justify-end pb-6 absolute bottom-24 left-0 right-0 z-20 pointer-events-none">
            <div className="overflow-y-auto space-y-3 text-center px-6 pointer-events-auto mask-gradient-b">
                {conversationLog.slice(-2).map(turn => (
                    <div key={turn.id} className={`glass-panel inline-block px-4 py-2 rounded-2xl max-w-[90%] transition-all duration-500 ${turn.speaker === 'user' ? 'bg-white/5 text-gray-300 scale-95 origin-bottom' : 'bg-cyan-500/10 border-cyan-500/30 text-white font-medium shadow-[0_0_15px_rgba(6,182,212,0.2)]'}`}>
                        {turn.text}
                    </div>
                ))}
            </div>
            <p className="text-center text-cyan-300 text-sm mt-6 font-bold tracking-widest uppercase animate-pulse drop-shadow-lg">{currentPrompt}</p>
        </div>
      
        {/* Controls */}
        <div className="flex justify-center items-center gap-6 pb-8 absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 to-transparent pt-10">
             {isCameraOn ? (
                <button 
                    onClick={handleSwitchCamera}
                    className="w-12 h-12 rounded-full flex items-center justify-center glass-panel hover:bg-white/20 transition-all active:scale-95"
                >
                    <CameraSwitchIcon className="w-5 h-5 text-white"/>
                </button>
             ) : (
                <div className="w-12 h-12"></div>
             )}

            <button 
                onClick={toggleCamera} 
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${isCameraOn ? 'bg-white text-black' : 'glass-panel hover:bg-white/20'}`}
            >
                {isCameraOn ? <CameraOffIcon className="w-6 h-6"/> : <CameraIcon className="w-6 h-6 text-white"/>}
            </button>
            
            <button onClick={endConversation} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:bg-red-600 transition-colors active:scale-95">
                <CloseIcon className="w-8 h-8 text-white"/>
            </button>
            
             <div className="w-12 h-12"></div>
        </div>
    </div>
  );
};

export default VoiceScreen;
