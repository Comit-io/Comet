
import React from 'react';
import { CometLogoIcon } from './icons';

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#030014] relative overflow-hidden z-[100]">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#030014_100%)] z-0"></div>
        
        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center">
            
            {/* Logo Container with Orbit Animation */}
            <div className="relative mb-12">
                {/* Rotating Rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-cyan-500/30 rounded-full animate-[spin_4s_linear_infinite]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-dashed border-purple-500/20 rounded-full animate-[spin_8s_linear_infinite_reverse]"></div>
                
                {/* Glowing Core */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-500/20 blur-[40px] rounded-full animate-pulse"></div>

                {/* The Logo */}
                <div className="relative z-20 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)] animate-float">
                    <CometLogoIcon className="w-40 h-40" />
                </div>
            </div>
            
            {/* Text Animations */}
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-black tracking-[0.2em] text-white drop-shadow-xl font-sans">
                    COMET
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"> AI</span>
                </h1>
                <p className="text-cyan-500/60 text-xs font-mono tracking-[0.3em] uppercase animate-pulse">
                    System Initializing...
                </p>
            </div>
            
            {/* Loading Bar */}
            <div className="mt-10 w-48 h-1 bg-gray-800 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500 animate-loading-bar box-shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
            </div>
        </div>
    </div>
  );
};

export default LoadingScreen;
