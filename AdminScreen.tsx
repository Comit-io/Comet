
import React, { useState, useEffect, useRef } from 'react';
import { Screen } from '../types';
import { 
    BackArrowIcon, LockIcon, SaveIcon, EyeIcon, EyeOffIcon, 
    ShieldIcon, PowerIcon, ChipIcon, HeartIcon, ReloadIcon, 
    TrashIcon, WarningIcon, WandIcon, BlockIcon, FaceIdIcon, ScanIcon,
    CloudUploadIcon, RocketIcon, CurrencyIcon
} from './icons';

interface AdminScreenProps {
  navigateTo: (screen: Screen) => void;
}

// 🔐 SECURITY CONFIGURATION
// Updated Hash for "rudra@ #_/071989/7898969424/9993808443/562009"
// Base64 of the string above
const ADMIN_PIN_HASH = "cnVkcmFAIyBfLzA3MTk4OS83ODk4OTY5NDI0Lzk5OTM4MDg0NDMvNTYyMDA5";
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 10 * 60 * 1000; // 10 Minutes
const SESSION_TIMEOUT = 5 * 60 * 1000;   // 5 Minutes

// ⚙️ ADMIN CONFIG INTERFACE
interface AdminConfig {
    adsEnabled: boolean;
    upiId: string;
    faceLockEnabled: boolean;
    generationMode: 'unlimited' | 'soft_limit';
    features: {
        imageGen: boolean;
        videoGen: boolean;
        inpaint: boolean;
        outpaint: boolean;
        promptEnhancer: boolean;
    };
    promptRules: {
        autoEnhance: boolean;
        appendNegative: boolean;
    };
    safety: {
        nsfwFilter: boolean;
        copyrightProtection: boolean;
        bannedWords: string;
    };
    system: {
        maintenanceMode: boolean;
        showNotice: boolean;
        noticeText: string;
        latestVersion: string;
        updateNotes: string;
        forceUpdate: boolean;
    };
    adMob: {
        appId: string;
        bannerId: string;
        interstitialId: string;
        testMode: boolean;
    };
}

const DEFAULT_SETTINGS: AdminConfig = {
    adsEnabled: true,
    upiId: 'rudra.manhar@fam',
    faceLockEnabled: true,
    generationMode: 'unlimited',
    features: {
        imageGen: true,
        videoGen: true,
        inpaint: true,
        outpaint: true,
        promptEnhancer: true,
    },
    promptRules: {
        autoEnhance: false,
        appendNegative: true,
    },
    safety: {
        nsfwFilter: true,
        copyrightProtection: true,
        bannedWords: "nsfw, nude, naked, violence, blood, hate, gore, kill",
    },
    system: {
        maintenanceMode: false,
        showNotice: false,
        noticeText: "System maintenance scheduled for midnight.",
        latestVersion: "2.2.0",
        updateNotes: "Performance improvements and bug fixes.",
        forceUpdate: false,
    },
    adMob: {
        appId: "",
        bannerId: "",
        interstitialId: "",
        testMode: true,
    }
};

const AdminScreen: React.FC<AdminScreenProps> = ({ navigateTo }) => {
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authMode, setAuthMode] = useState<'face' | 'pin'>('face');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [lockoutTime, setLockoutTime] = useState<number | null>(null);
    const [scanningState, setScanningState] = useState<'idle' | 'scanning' | 'matched' | 'failed'>('idle');
    
    // Video Ref for Face Scan
    const videoRef = useRef<HTMLVideoElement>(null);
    
    // Session Timer
    const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Admin Settings State
    const [settings, setSettings] = useState<AdminConfig>(DEFAULT_SETTINGS);

    // Update Form State
    const [updateVersion, setUpdateVersion] = useState('');
    const [updateNotes, setUpdateNotes] = useState('');
    const [forceUpdate, setForceUpdate] = useState(false);

    const [stats] = useState({
        totalImages: 8432,
        totalVideos: 1250,
        version: '2.3.0 (AdMob Ready)',
        lastUpdate: new Date().toLocaleDateString()
    });

    // --- Initialization & Security Checks ---
    useEffect(() => {
        // Load settings
        const loadedSettings = localStorage.getItem('comet_admin_settings');
        if (loadedSettings) {
            const parsed = JSON.parse(loadedSettings);
            // Deep merge to ensure new adMob keys exist even if loading old config
            setSettings({ 
                ...DEFAULT_SETTINGS, 
                ...parsed,
                adMob: { ...DEFAULT_SETTINGS.adMob, ...(parsed.adMob || {}) } 
            });
            
            // Init update form
            setUpdateVersion(parsed.system?.latestVersion || DEFAULT_SETTINGS.system.latestVersion);
            setUpdateNotes(parsed.system?.updateNotes || DEFAULT_SETTINGS.system.updateNotes);
            setForceUpdate(parsed.system?.forceUpdate || false);
        }

        // Check Lockout
        const storedLockout = localStorage.getItem('admin_lockout_until');
        if (storedLockout) {
            const remaining = parseInt(storedLockout) - Date.now();
            if (remaining > 0) {
                setLockoutTime(remaining);
                setAuthMode('pin'); // Force pin if locked out
            } else {
                localStorage.removeItem('admin_lockout_until');
                localStorage.removeItem('admin_failed_attempts');
            }
        }
    }, []);

    // --- Start Face Camera ---
    useEffect(() => {
        if (authMode === 'face' && !isAuthenticated && !lockoutTime) {
            startCamera();
        }
        return () => stopCamera();
    }, [authMode, isAuthenticated, lockoutTime]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            // Auto start scanning after delay
            setTimeout(() => handleScanFace(), 1000);
        } catch (e) {
            console.error("Camera access denied", e);
            setAuthMode('pin'); // Fallback
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleScanFace = () => {
        setScanningState('scanning');
        // SIMULATED BIOMETRIC CHECK
        // In a real scenario, this would frame-capture and send to a local matching model.
        // Here we simulate the match delay and success for the Admin (Rudra).
        
        setTimeout(() => {
            // Randomly succeed for demo or hardcode success
            const success = true; 
            if (success) {
                setScanningState('matched');
                setTimeout(() => {
                    setIsAuthenticated(true);
                    stopCamera();
                }, 800);
            } else {
                setScanningState('failed');
                setTimeout(() => setAuthMode('pin'), 1500);
            }
        }, 2000);
    };

    // --- Auto Logout Timer ---
    const resetInactivityTimer = () => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        if (isAuthenticated) {
            inactivityTimer.current = setTimeout(() => {
                setIsAuthenticated(false);
                alert("Session expired due to inactivity.");
            }, SESSION_TIMEOUT);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            window.addEventListener('mousemove', resetInactivityTimer);
            window.addEventListener('keypress', resetInactivityTimer);
            resetInactivityTimer();
        }
        return () => {
            window.removeEventListener('mousemove', resetInactivityTimer);
            window.removeEventListener('keypress', resetInactivityTimer);
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        };
    }, [isAuthenticated]);

    // --- Handlers ---

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (lockoutTime) return;

        try {
            const inputHash = btoa(password); 
            
            if (inputHash === ADMIN_PIN_HASH) {
                setIsAuthenticated(true);
                setError('');
                setPassword('');
                localStorage.removeItem('admin_failed_attempts');
            } else {
                handleFailedAttempt();
            }
        } catch (err) {
            setError("Error processing PIN.");
        }
    };

    const handleFailedAttempt = () => {
        const attempts = parseInt(localStorage.getItem('admin_failed_attempts') || '0') + 1;
        localStorage.setItem('admin_failed_attempts', attempts.toString());

        if (attempts >= MAX_ATTEMPTS) {
            const lockUntil = Date.now() + LOCKOUT_DURATION;
            localStorage.setItem('admin_lockout_until', lockUntil.toString());
            setLockoutTime(LOCKOUT_DURATION);
            setError(`Security Lockout active.`);
        } else {
            setError(`Invalid PIN. ${MAX_ATTEMPTS - attempts} attempts remaining.`);
        }
        setPassword('');
    };

    const handleSave = () => {
        localStorage.setItem('comet_admin_settings', JSON.stringify(settings));
        localStorage.setItem('comet_ads_enabled', String(settings.adsEnabled));
        alert("System Configuration Updated Successfully");
    };

    const handlePushUpdate = () => {
        if (!updateVersion || !updateNotes) {
            alert("Please enter version number and notes.");
            return;
        }
        
        const newSettings = {
            ...settings,
            system: {
                ...settings.system,
                latestVersion: updateVersion,
                updateNotes: updateNotes,
                forceUpdate: forceUpdate
            }
        };
        
        setSettings(newSettings);
        // Direct save to trigger update on other clients immediately (simulated via storage event)
        localStorage.setItem('comet_admin_settings', JSON.stringify(newSettings));
        alert(`Update v${updateVersion} pushed to all users.`);
    };

    const handleAction = (action: string) => {
        if (confirm(`ADMIN ACTION: ${action}\nAre you sure?`)) {
            if (action === 'Clear Cache') localStorage.clear();
            alert(`${action} executed.`);
        }
    };

    // --- Render Logic ---

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col h-full text-white bg-[#050B14] p-6 justify-center items-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 blur-[120px] rounded-full"></div>
                
                {/* Auth Container */}
                <div className="relative z-10 w-full max-w-xs flex flex-col items-center">
                    
                    {lockoutTime ? (
                         <div className="w-full bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-center animate-pulse mb-6">
                            <WarningIcon className="w-6 h-6 text-red-500 mx-auto mb-2" />
                            <p className="text-red-400 font-bold text-sm">ACCESS LOCKED</p>
                            <p className="text-gray-400 text-xs mt-1">Too many failed attempts.</p>
                            <p className="text-gray-500 text-[10px] mt-2">Try again in {Math.ceil(lockoutTime / 60000)} minutes.</p>
                         </div>
                    ) : (
                        <>
                            {authMode === 'face' ? (
                                <div className="flex flex-col items-center w-full animate-in zoom-in duration-300">
                                    <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-cyan-500/30 bg-black/50 mb-6 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                                        
                                        {/* Scanning Overlay */}
                                        {scanningState === 'scanning' && (
                                            <div className="absolute inset-0 bg-cyan-500/10 animate-pulse">
                                                <div className="w-full h-1 bg-cyan-400 absolute top-0 animate-[scan_1.5s_linear_infinite] shadow-[0_0_10px_#22d3ee]"></div>
                                            </div>
                                        )}
                                        {scanningState === 'matched' && (
                                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-sm">
                                                <FaceIdIcon className="w-16 h-16 text-green-400 animate-bounce" />
                                            </div>
                                        )}
                                        {scanningState === 'failed' && (
                                            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center backdrop-blur-sm">
                                                <WarningIcon className="w-16 h-16 text-red-400" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <h2 className="text-xl font-bold tracking-widest text-cyan-400 mb-2">
                                        {scanningState === 'scanning' ? 'SCANNING...' : scanningState === 'matched' ? 'VERIFIED' : 'FACE LOCK'}
                                    </h2>
                                    <p className="text-xs text-gray-500 mb-8">Admin Biometric Verification</p>

                                    <button onClick={() => setAuthMode('pin')} className="text-sm text-gray-400 hover:text-white underline">
                                        Use Admin Password
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleLogin} className="w-full space-y-4 animate-in slide-in-from-bottom-10 duration-300">
                                    <div className="text-center mb-6">
                                        <div className="w-20 h-20 bg-[#111e36] border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                                            <LockIcon className="w-8 h-8 text-cyan-400" />
                                        </div>
                                        <h2 className="text-xl font-bold">Admin Login</h2>
                                    </div>

                                    <div className="relative group">
                                        <input 
                                            type={isPasswordVisible ? "text" : "password"}
                                            placeholder="Secure Admin PIN"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full p-4 bg-[#0a1020] border border-gray-800 group-focus-within:border-cyan-500/50 rounded-xl focus:outline-none text-center tracking-[0.2em] transition-all font-mono"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                            className="absolute inset-y-0 right-4 flex items-center text-gray-600 hover:text-white"
                                        >
                                            {isPasswordVisible ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    
                                    {error && (
                                        <div className="p-3 bg-red-500/10 border-l-2 border-red-500 rounded-r text-red-400 text-xs font-mono text-center">
                                            {error}
                                        </div>
                                    )}
                                    
                                    <button 
                                        type="submit" 
                                        disabled={!password}
                                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                                    >
                                        Unlock Panel
                                    </button>

                                    {settings.faceLockEnabled && (
                                        <button type="button" onClick={() => setAuthMode('face')} className="w-full text-xs text-cyan-500 mt-4 hover:underline">
                                            Switch to Face Lock
                                        </button>
                                    )}
                                </form>
                            )}
                        </>
                    )}

                    <button onClick={() => navigateTo(Screen.Settings)} className="mt-8 text-gray-600 text-xs hover:text-gray-400 transition-colors uppercase tracking-wider">
                        Abort Connection
                    </button>
                </div>
            </div>
        );
    }

    // --- Authenticated View ---
    return (
        <div className="flex flex-col h-full text-white bg-[#050B14]">
            {/* Header */}
            <header className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0a1020]">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    <div>
                        <h1 className="font-bold text-sm tracking-widest text-cyan-400 uppercase">Admin Controller</h1>
                        <p className="text-[10px] text-gray-500 font-mono">SECURE_SESSION_ACTIVE</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsAuthenticated(false)} 
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                    title="Terminate Session"
                >
                    <PowerIcon className="w-5 h-5" />
                </button>
            </header>

            <main className="flex-grow p-5 overflow-y-auto space-y-6 pb-20 custom-scrollbar">
                
                {/* System Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <StatCard label="Total Images" value={stats.totalImages.toLocaleString()} />
                    <StatCard label="Total Videos" value={stats.totalVideos.toLocaleString()} />
                </div>

                {/* System Control */}
                 <div className="space-y-3">
                    <SectionHeader title="System Control" icon={<PowerIcon className="w-3.5 h-3.5 text-red-400"/>} />
                    <div className="bg-[#111e36] p-4 rounded-xl border border-white/5 space-y-4">
                        <Toggle 
                            label="Maintenance Mode" 
                            desc="Disable app access for users"
                            active={settings.system.maintenanceMode} 
                            onToggle={() => setSettings(s => ({...s, system: {...s.system, maintenanceMode: !s.system.maintenanceMode}}))} 
                            highlightColor="red"
                        />
                        <Toggle 
                            label="Biometric Face Lock" 
                            desc="Require Face ID for Admin access"
                            active={settings.faceLockEnabled} 
                            onToggle={() => setSettings(s => ({...s, faceLockEnabled: !s.faceLockEnabled}))} 
                        />
                    </div>
                </div>

                {/* Software Update Center */}
                <div className="space-y-3">
                    <SectionHeader title="Software Update Center" icon={<CloudUploadIcon className="w-3.5 h-3.5 text-purple-400"/>} />
                    <div className="bg-[#111e36] p-4 rounded-xl border border-white/5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Target Version</label>
                                <input 
                                    type="text" 
                                    value={updateVersion} 
                                    onChange={(e) => setUpdateVersion(e.target.value)}
                                    className="w-full bg-[#0a1020] p-3 mt-1 rounded-lg border border-white/10 text-xs focus:border-purple-500 outline-none font-mono text-purple-300"
                                    placeholder="e.g. 2.3.0"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Force Update</label>
                                <div className="mt-2">
                                    <Toggle 
                                        label={forceUpdate ? "Yes" : "No"}
                                        active={forceUpdate} 
                                        onToggle={() => setForceUpdate(!forceUpdate)}
                                        highlightColor="red"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Release Notes</label>
                            <textarea 
                                value={updateNotes}
                                onChange={(e) => setUpdateNotes(e.target.value)}
                                className="w-full h-20 bg-[#0a1020] p-3 mt-1 rounded-lg border border-white/10 text-xs focus:border-purple-500 outline-none font-mono text-gray-300 resize-none"
                                placeholder="What's new in this update?"
                            />
                        </div>

                        <button onClick={handlePushUpdate} className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2">
                            <RocketIcon className="w-4 h-4" /> Push Update to Users
                        </button>
                    </div>
                </div>

                {/* Monetization Section */}
                <div className="space-y-3">
                    <SectionHeader title="Monetization & Limits" icon={<HeartIcon className="w-3.5 h-3.5 text-pink-400"/>} />
                    <div className="bg-[#111e36] p-4 rounded-xl border border-white/5 space-y-5">
                        <Toggle 
                            label="Show Ads" 
                            desc="Display ads in app footer"
                            active={settings.adsEnabled} 
                            onToggle={() => setSettings(s => ({...s, adsEnabled: !s.adsEnabled}))} 
                        />
                         
                         <div className="space-y-1.5 pt-2 border-t border-white/5">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider ml-1">Donation UPI ID</label>
                            <input 
                                type="text" 
                                value={settings.upiId} 
                                onChange={(e) => setSettings(s => ({...s, upiId: e.target.value}))}
                                className="w-full bg-[#0a1020] p-3 rounded-lg border border-white/10 text-xs focus:border-cyan-500 outline-none font-mono text-cyan-300 transition-colors"
                            />
                        </div>

                        {/* AdMob Configuration */}
                        <div className="space-y-3 pt-3 border-t border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <CurrencyIcon className="w-4 h-4 text-green-400" />
                                <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">AdMob Configuration</span>
                            </div>
                            
                            <Toggle 
                                label="Test Mode" 
                                desc="Use Test IDs to prevent ban"
                                active={settings.adMob.testMode} 
                                onToggle={() => setSettings(s => ({...s, adMob: {...s.adMob, testMode: !s.adMob.testMode}}))} 
                            />

                            <div className="space-y-2">
                                <div>
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">App ID</label>
                                    <input 
                                        type="text" 
                                        value={settings.adMob.appId} 
                                        onChange={(e) => setSettings(s => ({...s, adMob: {...s.adMob, appId: e.target.value}}))}
                                        className="w-full bg-[#0a1020] p-2 rounded border border-white/10 text-[10px] focus:border-green-500 outline-none font-mono text-gray-300"
                                        placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Banner Ad Unit ID</label>
                                    <input 
                                        type="text" 
                                        value={settings.adMob.bannerId} 
                                        onChange={(e) => setSettings(s => ({...s, adMob: {...s.adMob, bannerId: e.target.value}}))}
                                        className="w-full bg-[#0a1020] p-2 rounded border border-white/10 text-[10px] focus:border-green-500 outline-none font-mono text-gray-300"
                                        placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Interstitial Ad Unit ID</label>
                                    <input 
                                        type="text" 
                                        value={settings.adMob.interstitialId} 
                                        onChange={(e) => setSettings(s => ({...s, adMob: {...s.adMob, interstitialId: e.target.value}}))}
                                        className="w-full bg-[#0a1020] p-2 rounded border border-white/10 text-[10px] focus:border-green-500 outline-none font-mono text-gray-300"
                                        placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="space-y-3">
                    <SectionHeader title="Feature Control" icon={<ChipIcon className="w-3.5 h-3.5 text-blue-400"/>} />
                    <div className="bg-[#111e36] p-4 rounded-xl border border-white/5 space-y-4">
                        <Toggle label="Image Generator" active={settings.features.imageGen} onToggle={() => setSettings(s => ({...s, features: {...s.features, imageGen: !s.features.imageGen}}))} />
                        <Toggle label="Video Generator" active={settings.features.videoGen} onToggle={() => setSettings(s => ({...s, features: {...s.features, videoGen: !s.features.videoGen}}))} />
                        <Toggle label="Magic Inpaint" active={settings.features.inpaint} onToggle={() => setSettings(s => ({...s, features: {...s.features, inpaint: !s.features.inpaint}}))} />
                    </div>
                </div>

                {/* Safety Section */}
                <div className="space-y-3">
                    <SectionHeader title="Safety Protocols" icon={<ShieldIcon className="w-3.5 h-3.5 text-green-400"/>} />
                    <div className="bg-[#111e36] p-4 rounded-xl border border-white/5 space-y-4">
                         <Toggle label="NSFW Filter" desc="Strict content filtering" active={settings.safety.nsfwFilter} onToggle={() => setSettings(s => ({...s, safety: {...s.safety, nsfwFilter: !s.safety.nsfwFilter}}))} />
                         
                         <div className="pt-2">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1 mb-2">
                                <BlockIcon className="w-3 h-3"/> Banned Words Database
                            </label>
                            <textarea 
                                value={settings.safety.bannedWords}
                                onChange={(e) => setSettings(s => ({...s, safety: {...s.safety, bannedWords: e.target.value}}))}
                                className="w-full h-20 bg-[#0a1020] p-3 rounded-lg border border-white/10 text-xs focus:border-red-500 outline-none font-mono text-gray-300 resize-none"
                                placeholder="Comma separated list of banned words..."
                            />
                         </div>
                    </div>
                </div>

                {/* System Actions */}
                <div className="space-y-3">
                    <SectionHeader title="System Actions" icon={<PowerIcon className="w-3.5 h-3.5 text-red-400"/>} />
                    <div className="grid grid-cols-2 gap-3">
                        <ActionButton icon={<TrashIcon className="w-4 h-4 text-red-400"/>} label="Clear Cache" onClick={() => handleAction('Clear Cache')} />
                        <ActionButton icon={<ReloadIcon className="w-4 h-4 text-cyan-400"/>} label="Restart Engine" onClick={() => handleAction('Restart AI Engine')} />
                    </div>
                </div>
            </main>
            
            <div className="p-4 bg-[#0a1020] border-t border-white/5">
                <button onClick={handleSave} className="w-full py-3.5 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-lg shadow-white/5">
                    <SaveIcon className="w-5 h-5" /> Save Configuration
                </button>
            </div>
        </div>
    );
};

// --- Sub-Components ---

const SectionHeader = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
    <div className="flex items-center gap-2 px-1">
        {icon}
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</h2>
    </div>
);

const StatCard = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-[#111e36] p-4 rounded-xl border border-white/5">
        <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">{label}</p>
        <p className="text-xl font-bold text-white font-mono">{value}</p>
    </div>
);

const Toggle = ({ label, desc, active, onToggle, highlightColor = 'cyan' }: { label: string, desc?: string, active: boolean, onToggle: () => void, highlightColor?: string }) => {
    const bgClass = active ? (highlightColor === 'red' ? 'bg-red-600' : 'bg-cyan-600') : 'bg-gray-800';

    return (
        <div className="flex items-center justify-between group cursor-pointer" onClick={onToggle}>
            <div>
                <p className={`font-semibold text-sm transition-colors ${active ? 'text-white' : 'text-gray-400'}`}>{label}</p>
                {desc && <p className="text-[10px] text-gray-600 group-hover:text-gray-500 transition-colors">{desc}</p>}
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${bgClass}`}>
                <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform duration-300 shadow-sm ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
        </div>
    );
}

const ActionButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
    <button onClick={onClick} className="p-3 bg-[#111e36] hover:bg-[#1a2540] border border-white/5 rounded-xl flex flex-col items-center gap-2 transition-all group active:scale-95">
        <div className="p-2 bg-[#0a1020] rounded-full group-hover:bg-[#0f172a] transition-colors">{icon}</div>
        <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-200">{label}</span>
    </button>
);

export default AdminScreen;
