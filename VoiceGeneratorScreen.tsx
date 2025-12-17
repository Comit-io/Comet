
import React, { useState, useRef, useEffect } from 'react';
import { Screen } from '../types';
import { BackArrowIcon, WandIcon, PlayIcon, StopIcon, DownloadIcon, WaveformIcon, MusicIcon, UploadIcon, LockIcon, CheckCircleIcon, MicIcon } from './icons';
import { decode, decodeAudioData, generateVoiceAPI, uploadVoiceSampleAPI, createCustomVoiceAPI } from '../services/geminiService';

interface VoiceGeneratorScreenProps {
  navigateTo: (screen: Screen) => void;
}

const VOICES = [
    { id: 'Puck', name: 'Puck (Neutral)', type: 'Neutral' },
    { id: 'Charon', name: 'Charon (Deep Male)', type: 'Male' },
    { id: 'Kore', name: 'Kore (Soft Female)', type: 'Female' },
    { id: 'Fenrir', name: 'Fenrir (Strong Male)', type: 'Male' },
    { id: 'Zephyr', name: 'Zephyr (Calm Female)', type: 'Female' },
];

const EMOTIONS = ['Neutral', 'Happy', 'Sad', 'Excited', 'Serious', 'Professional', 'Confident', 'Calm'];
const SPEEDS = ['Slow', 'Normal', 'Fast'];
const PITCHES = ['Low', 'Medium', 'High'];

interface CustomVoice {
    id: string;
    name: string;
    date: string;
}

const VoiceGeneratorScreen: React.FC<VoiceGeneratorScreenProps> = ({ navigateTo }) => {
    // Tab State
    const [activeTab, setActiveTab] = useState<'tts' | 'clone'>('tts');
    
    // TTS State
    const [text, setText] = useState('');
    const [selectedVoice, setSelectedVoice] = useState('Puck');
    const [selectedEmotion, setSelectedEmotion] = useState('Neutral');
    const [selectedSpeed, setSelectedSpeed] = useState('Normal');
    const [selectedPitch, setSelectedPitch] = useState('Medium');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Cloning State
    const [cloneName, setCloneName] = useState('');
    const [consentChecked, setConsentChecked] = useState(false);
    const [cloneFile, setCloneFile] = useState<File | null>(null);
    const [isCloning, setIsCloning] = useState(false);
    const [customVoices, setCustomVoices] = useState<CustomVoice[]>([]);

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);

    // Initialize AudioContext
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // --- Helper Functions ---
    const showToast = (msg: string) => {
        setToastMessage(msg);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
    };

    const stopAudio = () => {
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch(e) {}
            sourceRef.current = null;
        }
        setIsPlaying(false);
    };

    // --- TTS Handlers ---
    const handleGenerate = async () => {
        if (!text.trim()) {
            showToast("Please enter text");
            return;
        }
        
        setIsGenerating(true);
        setGeneratedAudioBase64(null);
        stopAudio();

        // 1️⃣ CALL API ENDPOINT: POST /api/voice/generate
        const response = await generateVoiceAPI({
            text: text,
            voice_id: selectedVoice,
            emotion: selectedEmotion,
            speed: selectedSpeed,
            pitch: selectedPitch
        });
        
        if (response.status === 'success' && response.audio_data) {
            setGeneratedAudioBase64(response.audio_data);
            showToast(response.message);
        } else {
            showToast(response.message || "Generation failed");
        }
        
        setIsGenerating(false);
    };

    const handlePlay = async () => {
        if (!generatedAudioBase64 || !audioContextRef.current) return;
        
        if (isPlaying) {
            stopAudio();
            return;
        }

        try {
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();

            const audioBuffer = await decodeAudioData(decode(generatedAudioBase64), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            
            source.onended = () => setIsPlaying(false);
            
            sourceRef.current = source;
            source.start();
            setIsPlaying(true);
        } catch (e) {
            console.error("Playback error:", e);
        }
    };

    const handleDownload = () => {
        if (!generatedAudioBase64) return;
        const byteCharacters = atob(generatedAudioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comet-voice-${Date.now()}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // --- Cloning Handlers ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCloneFile(e.target.files[0]);
        }
    };

    const handleCloneVoice = async () => {
        if (!cloneName || !cloneFile || !consentChecked) return;

        setIsCloning(true);
        
        // 2️⃣ CALL API ENDPOINT: POST /api/voice/clone/upload
        const uploadRes = await uploadVoiceSampleAPI(cloneFile, consentChecked);
        
        if (uploadRes.status === 'uploaded') {
             // 3️⃣ CALL API ENDPOINT: POST /api/voice/clone/create
             const createRes = await createCustomVoiceAPI("sample_temp_123", cloneName);
             
             if (createRes.status === 'success') {
                const newVoice: CustomVoice = {
                    id: createRes.voice_id,
                    name: cloneName,
                    date: new Date().toLocaleDateString()
                };

                setCustomVoices(prev => [...prev, newVoice]);
                setCloneName('');
                setCloneFile(null);
                setConsentChecked(false);
                
                showToast(createRes.message);
                setActiveTab('tts'); // Switch to TTS to use it
             }
        } else {
            showToast(uploadRes.message);
        }

        setIsCloning(false);
    };

    // --- Render ---

    return (
        <div className="flex flex-col h-full text-white bg-[#0f0f1a]">
            {/* Header */}
            <header className="flex justify-between items-center p-4 border-b border-white/5 shrink-0 bg-[#151525]">
                <button onClick={() => navigateTo(Screen.Home)} className="p-2 -ml-2 hover:bg-white/5 rounded-full">
                    <BackArrowIcon className="w-6 h-6 text-gray-300" />
                </button>
                <div className="flex items-center gap-2">
                     <div className="bg-purple-500/20 p-1.5 rounded-full">
                        <MusicIcon className="w-4 h-4 text-purple-400" />
                     </div>
                     <span className="font-bold text-lg">COMET Voice AI</span>
                </div>
                <div className="w-6"></div>
            </header>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button 
                    onClick={() => setActiveTab('tts')}
                    className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${activeTab === 'tts' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    TTS Engine
                    {activeTab === 'tts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500"></div>}
                </button>
                <button 
                     onClick={() => setActiveTab('clone')}
                    className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${activeTab === 'clone' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Voice Cloning
                    {activeTab === 'clone' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500"></div>}
                </button>
            </div>

            <main className="flex-grow p-6 overflow-y-auto pb-10">
                {activeTab === 'tts' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Text Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Enter Text</label>
                            <textarea 
                                className="w-full h-32 bg-[#1a1a2e] border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none text-base leading-relaxed"
                                placeholder="Type something here to convert into ultra-realistic speech..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                        </div>

                        {/* Controls Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Voice Selector */}
                            <div className="col-span-2 space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Voice Selection</label>
                                <div className="relative">
                                    <select 
                                        value={selectedVoice}
                                        onChange={(e) => setSelectedVoice(e.target.value)}
                                        className="w-full p-3 bg-[#1a1a2e] border border-white/10 rounded-lg appearance-none focus:outline-none focus:border-purple-500"
                                    >
                                        <optgroup label="Standard Voices">
                                            {VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </optgroup>
                                        {customVoices.length > 0 && (
                                            <optgroup label="My Cloned Voices">
                                                {customVoices.map(v => <option key={v.id} value={v.id}>{v.name} (Cloned)</option>)}
                                            </optgroup>
                                        )}
                                    </select>
                                    <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                                </div>
                            </div>

                            {/* Emotion Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Emotion</label>
                                <div className="relative">
                                    <select 
                                        value={selectedEmotion}
                                        onChange={(e) => setSelectedEmotion(e.target.value)}
                                        className="w-full p-3 bg-[#1a1a2e] border border-white/10 rounded-lg appearance-none focus:outline-none focus:border-purple-500"
                                    >
                                        {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                                </div>
                            </div>

                            {/* Speed Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Speed</label>
                                <div className="relative">
                                    <select 
                                        value={selectedSpeed}
                                        onChange={(e) => setSelectedSpeed(e.target.value)}
                                        className="w-full p-3 bg-[#1a1a2e] border border-white/10 rounded-lg appearance-none focus:outline-none focus:border-purple-500"
                                    >
                                        {SPEEDS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                                </div>
                            </div>
                            
                             {/* Pitch Selector */}
                             <div className="space-y-2 col-span-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pitch</label>
                                <div className="flex gap-2 p-1 bg-[#1a1a2e] border border-white/10 rounded-lg">
                                    {PITCHES.map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setSelectedPitch(p)}
                                            className={`flex-1 py-2 text-sm rounded-md transition-all ${selectedPitch === p ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:bg-white/5'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !text.trim()}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold text-white shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <WandIcon className="w-5 h-5" />
                                    Generate Voice
                                </>
                            )}
                        </button>

                        {/* Result Section */}
                        {generatedAudioBase64 && (
                            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-[#1a1a2e] rounded-xl border border-white/10 p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-full ${isPlaying ? 'bg-purple-500 text-white animate-pulse' : 'bg-white/10 text-purple-400'}`}>
                                                <WaveformIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white">Generated Audio</h3>
                                                <p className="text-xs text-gray-400">Ready to play</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 h-8 mb-4 opacity-50 justify-center">
                                        {[...Array(20)].map((_, i) => (
                                            <div 
                                                key={i} 
                                                className={`w-1 bg-purple-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-[bounce_1s_infinite]' : 'h-2'}`}
                                                style={{ 
                                                    height: isPlaying ? `${Math.random() * 100}%` : '20%',
                                                    animationDelay: `${i * 0.05}s`
                                                }}
                                            ></div>
                                        ))}
                                    </div>

                                    <div className="flex gap-3">
                                        <button 
                                            onClick={handlePlay}
                                            className="flex-1 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isPlaying ? <StopIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                                            {isPlaying ? 'Stop' : 'Play'}
                                        </button>
                                        <button 
                                            onClick={handleDownload}
                                            className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors flex items-center justify-center"
                                            title="Download"
                                        >
                                            <DownloadIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Trust & Safety Line */}
                        <div className="text-center mt-6 pt-4 border-t border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                                ⚠️ All voices are AI-generated. Voice cloning requires user consent.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                        {/* Legal Warning Card */}
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-3">
                            <LockIcon className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-yellow-500 text-sm">Strict Legal Requirement</h3>
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                    Voice cloning is allowed <strong>ONLY</strong> if you upload your own voice or provide explicit written consent. We do not support cloning public figures without permission.
                                </p>
                            </div>
                        </div>

                        {/* Upload Section */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-400">Voice Name</label>
                                <input 
                                    type="text" 
                                    value={cloneName}
                                    onChange={(e) => setCloneName(e.target.value)}
                                    placeholder="e.g. My Custom Voice"
                                    className="w-full mt-2 p-3 bg-[#1a1a2e] border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-400">Upload Voice Sample</label>
                                <div className="mt-2 relative group">
                                    <input 
                                        type="file" 
                                        accept="audio/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-600 rounded-xl group-hover:border-purple-500 transition-colors bg-[#1a1a2e]/50">
                                        <div className="p-4 bg-purple-500/10 rounded-full mb-3">
                                            <UploadIcon className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-300">
                                            {cloneFile ? cloneFile.name : "Upload Voice Sample"}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">WAV, MP3 (Max 5MB)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Consent Checkbox */}
                        <div className="flex items-start gap-3 p-3 bg-[#1a1a2e] rounded-lg border border-white/5">
                            <div className="relative flex items-center pt-1">
                                <input 
                                    type="checkbox" 
                                    id="consent"
                                    checked={consentChecked}
                                    onChange={(e) => setConsentChecked(e.target.checked)}
                                    className="peer w-5 h-5 appearance-none border border-gray-500 rounded bg-transparent checked:bg-purple-600 checked:border-purple-600 transition-all cursor-pointer"
                                />
                                <CheckCircleIcon className="absolute w-3.5 h-3.5 text-white left-0.5 top-1.5 opacity-0 peer-checked:opacity-100 pointer-events-none" />
                            </div>
                            <label htmlFor="consent" className="text-xs text-gray-400 cursor-pointer select-none leading-relaxed">
                                I confirm that this audio is my own voice or I have explicit written permission from the speaker to clone their voice. I understand that unauthorized voice cloning is strictly prohibited.
                            </label>
                        </div>

                        <button 
                            onClick={handleCloneVoice}
                            disabled={isCloning || !cloneName || !cloneFile || !consentChecked}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-white shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            {isCloning ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Training Model...
                                </>
                            ) : (
                                <>
                                    <MicIcon className="w-5 h-5" />
                                    Create My Voice
                                </>
                            )}
                        </button>
                        
                        {customVoices.length > 0 && (
                             <div className="pt-4 border-t border-white/10">
                                <h3 className="text-sm font-bold text-gray-400 mb-3">My Voices</h3>
                                <div className="space-y-2">
                                    {customVoices.map(voice => (
                                        <div key={voice.id} className="flex items-center justify-between p-3 bg-[#1a1a2e] rounded-lg border border-white/5">
                                            <div className="flex items-center gap-3">
                                                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-xs font-bold text-black">
                                                    {voice.name.charAt(0).toUpperCase()}
                                                 </div>
                                                 <div>
                                                     <p className="text-sm font-semibold">{voice.name}</p>
                                                     <p className="text-[10px] text-gray-500">Created: {voice.date}</p>
                                                 </div>
                                            </div>
                                            <div className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] rounded border border-green-500/20">
                                                Ready
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Trust & Safety Line */}
                        <div className="text-center mt-6 pt-4 border-t border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                                ⚠️ All voices are AI-generated. Voice cloning requires user consent.
                            </p>
                        </div>
                    </div>
                )}
            </main>
            
            {/* Success Toast */}
            {showSuccessToast && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 z-50">
                    {toastMessage}
                </div>
            )}
        </div>
    );
};

export default VoiceGeneratorScreen;
