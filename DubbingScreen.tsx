
import React, { useState, useRef, useEffect } from 'react';
import { Screen } from '../types';
import { BackArrowIcon, UploadIcon, VideoTranslateIcon, DownloadIcon, ReloadIcon, MicIcon, ShieldIcon, CheckCircleIcon } from './icons';
import { dubVideoAPI } from '../services/geminiService';

// --- UI TEXT & SETTINGS ---
const UI_STRINGS = {
    title: "AI Video Dubbing Studio",
    subtitle: "Kisi bhi language ke video ko natural Hindi voice me badlo – bilkul original jaisa",
    disclaimer: "This app respects original content and is intended for educational, creative, and personal use only."
};

type DubbingScreenState = 'upload' | 'settings' | 'processing' | 'result';

const DubbingScreen: React.FC<{ navigateTo: (screen: Screen) => void }> = ({ navigateTo }) => {
    // Core State
    const [screenState, setScreenState] = useState<DubbingScreenState>('upload');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    
    // Processing State
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStep, setProgressStep] = useState('');

    // Settings State (for UI display)
    const [settings, setSettings] = useState({
        autoEmotion: true,
        naturalPauses: true,
        lipSync: true,
        keepMusic: true,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Core Logic ---

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            const url = URL.createObjectURL(file);
            setVideoPreviewUrl(url);
            setScreenState('settings');
        }
    };

    const handleGenerate = async () => {
        if (!videoFile) return;
        setScreenState('processing');
        setIsProcessing(true);
        setProgress(0);
        setProgressStep('Initializing...');

        const response = await dubVideoAPI(videoFile, 'Hindi', (step, prog) => {
            setProgressStep(step);
            setProgress(prog);
        });

        if (response.status === 'success' && response.video_url) {
            setResultUrl(response.video_url);
            setScreenState('result');
        } else {
            alert(`Error: ${response.message}`);
            setScreenState('settings'); // Go back to settings on error
        }
        setIsProcessing(false);
    };

    const handleReset = () => {
        if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        setVideoFile(null);
        setVideoPreviewUrl(null);
        setResultUrl(null);
        setProgress(0);
        setProgressStep('');
        setIsProcessing(false);
        setScreenState('upload');
    };
    
    // Cleanup URLs on unmount
    useEffect(() => {
        const currentPreviewUrl = videoPreviewUrl;
        const currentResultUrl = resultUrl;
        return () => {
            if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
            if (currentResultUrl) URL.revokeObjectURL(currentResultUrl);
        }
    }, [videoPreviewUrl, resultUrl]);

    // --- Render Components ---

    const renderHeader = () => (
        <header className="flex items-center p-4 border-b border-white/5 shrink-0 bg-[#151525]">
            <button onClick={() => screenState === 'upload' ? navigateTo(Screen.Home) : handleReset()} className="p-2 -ml-2 hover:bg-white/5 rounded-full">
                <BackArrowIcon className="w-6 h-6 text-gray-300" />
            </button>
            <h1 className="ml-2 font-bold text-base flex items-center gap-2">
                <VideoTranslateIcon className="w-5 h-5 text-red-400"/> {UI_STRINGS.title}
            </h1>
        </header>
    );

    const renderUploadScreen = () => (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in zoom-in-95">
            <div 
                className="w-full max-w-md flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-2xl p-12 hover:border-blue-500/50 hover:bg-blue-900/10 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="p-5 bg-blue-500/10 rounded-full mb-4 border border-blue-500/20">
                    <UploadIcon className="w-12 h-12 text-blue-400" />
                </div>
                <p className="text-lg font-bold text-white">Upload Video</p>
                <p className="text-sm text-gray-500 mt-1">{UI_STRINGS.subtitle}</p>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
            </div>
        </div>
    );

    const renderSettingsScreen = () => (
        <div className="grid md:grid-cols-2 gap-4 h-full">
            {/* Left Panel: Video & Main Action */}
            <div className="flex flex-col gap-4">
                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/10">
                    {videoPreviewUrl && <video src={videoPreviewUrl} controls className="w-full h-full object-contain" />}
                </div>
                <p className="text-xs text-center text-gray-500 px-4">
                    Selected: {videoFile?.name}
                </p>
                 <div className="mt-auto space-y-3">
                    <div className="bg-[#1a1a2e] p-4 rounded-xl border border-purple-500/30">
                        <p className="text-xs font-bold text-gray-400">VOICE ENGINE</p>
                        <div className="flex items-center justify-between mt-2">
                            <p className="font-semibold text-purple-300">⭐ COMET AI Voice (Recommended)</p>
                            <CheckCircleIcon className="w-5 h-5 text-green-500"/>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Studio-grade voice cloning with emotion, breathing & pauses.</p>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!videoFile}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-white shadow-lg shadow-blue-900/30 disabled:opacity-30 flex items-center justify-center gap-2 transition-all"
                    >
                        <MicIcon className="w-5 h-5"/> Auto Voice Dub
                    </button>
                 </div>
            </div>

            {/* Right Panel: Settings */}
            <div className="bg-[#1C1C2E] p-4 rounded-2xl border border-white/10 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <SettingsCard title="Voice & Sync Settings" icon="🔊">
                    <ToggleSetting label="Auto Emotion Detection" checked={settings.autoEmotion} onChange={() => setSettings(s => ({...s, autoEmotion: !s.autoEmotion}))}/>
                    <ToggleSetting label="Natural Pauses & Breathing" checked={settings.naturalPauses} onChange={() => setSettings(s => ({...s, naturalPauses: !s.naturalPauses}))} />
                    <ToggleSetting label="Lip-Sync Optimization" checked={settings.lipSync} onChange={() => setSettings(s => ({...s, lipSync: !s.lipSync}))} />
                    <ToggleSetting label="Keep Background Music Original" checked={settings.keepMusic} onChange={() => setSettings(s => ({...s, keepMusic: !s.keepMusic}))} />
                </SettingsCard>
                <SettingsCard title="Language Settings" icon="🌐">
                    <p className="text-xs text-gray-400 bg-black/20 p-2 rounded-md">Source: Auto-Detect</p>
                    <p className="text-xs text-gray-400 bg-black/20 p-2 rounded-md">Target: Hindi (Conversational)</p>
                </SettingsCard>
            </div>
        </div>
    );
    
    const renderProcessingScreen = () => (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-in fade-in">
            <div className="relative w-40 h-40 flex items-center justify-center">
                 <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-spin [animation-duration:3s]"></div>
                <div 
                    className="absolute inset-0 border-4 border-blue-500 rounded-full transition-all duration-500"
                    style={{ 
                        clipPath: `inset(0 ${100 - progress}% 0 0)`, 
                        transform: 'rotate(-90deg)' 
                    }}
                ></div>
                <div className="absolute inset-2 bg-blue-900/30 rounded-full animate-pulse"></div>
                <span className="text-3xl font-mono font-bold text-blue-300 z-10">{progress}%</span>
            </div>
            <p className="mt-6 text-blue-300 font-medium">{progressStep}</p>
            <p className="text-xs text-gray-500 mt-2">Please wait, this may take a few moments...</p>
        </div>
    );
    
    const renderResultScreen = () => (
         <div className="flex flex-col h-full items-center justify-center p-6 text-center animate-in fade-in zoom-in-95">
            <div className="w-full max-w-md">
                <h2 className="text-2xl font-bold text-white mb-2">✅ Dubbing Complete</h2>
                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 border-2 border-green-500/50 shadow-2xl shadow-green-900/50">
                    <video src={resultUrl || ''} controls autoPlay className="w-full h-full object-contain" />
                </div>
                <div className="bg-[#1C1C2E] p-3 rounded-lg text-left text-xs space-y-1 mb-6 border border-white/10">
                    <p><span className="text-gray-400">Voice:</span> Original-style Hindi</p>
                    <p><span className="text-gray-400">Quality:</span> Studio HD</p>
                    <p><span className="text-gray-400">Watermark:</span> ❌ None</p>
                </div>
                <div className="space-y-3">
                     <a
                        href={resultUrl || '#'}
                        download={`dubbed_${videoFile?.name || 'video.mp4'}`}
                        className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 text-center"
                     >
                        <DownloadIcon className="w-5 h-5"/> Download Video
                     </a>
                     <button onClick={handleReset} className="w-full py-3 text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2">
                        <ReloadIcon className="w-4 h-4" /> Dub Another Video
                    </button>
                </div>
            </div>
         </div>
    );

    const renderContent = () => {
        switch (screenState) {
            case 'upload': return renderUploadScreen();
            case 'settings': return renderSettingsScreen();
            case 'processing': return renderProcessingScreen();
            case 'result': return renderResultScreen();
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full text-white bg-[#101022]">
            {renderHeader()}
            <main className={`flex-grow overflow-hidden ${screenState === 'settings' || screenState === 'result' ? 'p-4' : ''}`}>
                {renderContent()}
            </main>
            <footer className="p-2 text-center border-t border-white/5 shrink-0">
                <p className="text-[10px] text-gray-600 flex items-center justify-center gap-1">
                    <ShieldIcon className="w-3 h-3"/> {UI_STRINGS.disclaimer}
                </p>
            </footer>
        </div>
    );
};

// --- Reusable Setting Components ---
const SettingsCard: React.FC<{title: string, icon: string, children: React.ReactNode}> = ({ title, icon, children }) => (
    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
        <h3 className="text-xs font-bold text-gray-400 mb-3">{icon} {title}</h3>
        <div className="space-y-3">{children}</div>
    </div>
);

const ToggleSetting: React.FC<{label: string, checked: boolean, onChange: () => void}> = ({ label, checked, onChange }) => (
    <div className="flex justify-between items-center bg-black/20 p-2 rounded-md hover:bg-black/40 cursor-pointer" onClick={onChange}>
        <label className="text-xs text-gray-300">{label}</label>
        <div className={`w-9 h-5 rounded-full relative transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-700'}`}>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`}></div>
        </div>
    </div>
);

export default DubbingScreen;
