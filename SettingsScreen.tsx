
import React, { useState, useRef } from 'react';
import { Screen } from '../types';
import { BackArrowIcon, PaletteIcon, LogoIcon } from './icons';

interface SettingsScreenProps {
  navigateTo: (screen: Screen) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigateTo }) => {
  const [tapCount, setTapCount] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVersionTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    
    // Clear existing timeout to ensure consecutive taps are counted
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }

    // Secret Trigger: 10 quick taps
    if (newCount >= 10) {
        setTapCount(0);
        navigateTo(Screen.Admin);
        return;
    }

    // Reset count if idle for 1 second
    timeoutRef.current = setTimeout(() => {
        setTapCount(0);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full text-white bg-[#0f0f1a]">
      <header className="flex items-center p-4 border-b border-white/5 bg-[#151525]">
        <button onClick={() => navigateTo(Screen.Home)} className="p-2 -ml-2 hover:bg-white/5 rounded-full">
            <BackArrowIcon className="w-6 h-6 text-gray-300" />
        </button>
        <h1 className="ml-2 font-bold">Settings</h1>
      </header>

      <main className="flex-grow p-4 space-y-4">
        
        <div className="bg-[#1a1a2e] rounded-xl overflow-hidden border border-white/5">
             <button onClick={() => navigateTo(Screen.Profile)} className="w-full p-4 text-left hover:bg-white/5 flex items-center gap-3 transition-colors">
                <LogoIcon className="w-5 h-5 text-gray-400" />
                <div className="flex-grow">
                    <p className="font-medium text-sm">My Profile</p>
                    <p className="text-xs text-gray-500">Account & Preferences</p>
                </div>
            </button>
        </div>

        <div className="bg-[#1a1a2e] rounded-xl overflow-hidden border border-white/5">
            <button className="w-full p-4 text-left hover:bg-white/5 flex items-center gap-3 transition-colors">
                <PaletteIcon className="w-5 h-5 text-gray-400" />
                <div className="flex-grow">
                    <p className="font-medium text-sm">Appearance</p>
                    <p className="text-xs text-gray-500">Dark Mode (Default)</p>
                </div>
            </button>
        </div>

        {/* Footer Area */}
        <div className="p-4 text-center mt-10 space-y-2">
            <div 
                onClick={handleVersionTap}
                className="inline-block cursor-pointer select-none active:opacity-50 active:scale-95 transition-transform"
                title="System Version"
            >
                <p className="text-xs text-gray-600 font-mono tracking-wide">COMET AI v2.1.0</p>
                <p className="text-[10px] text-gray-700 mt-1">Production Build • Stable</p>
            </div>
            
            <p className="text-[9px] text-gray-800 uppercase tracking-widest mt-8">
                Designed by Rudra
            </p>
        </div>

      </main>
    </div>
  );
};

export default SettingsScreen;
