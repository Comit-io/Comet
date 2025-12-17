
import React from 'react';
import { CometLogoIcon } from './icons';

const WelcomeScreen: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full bg-[#050B14] overflow-hidden select-none font-sans">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#111e36] via-[#050B14] to-[#000000]"></div>
        
        {/* Tech Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        {/* Floating Glows */}
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-cyan-500/10 rounded-full blur-[80px] animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] animate-pulse [animation-delay:1.5s]"></div>

        <div className="relative z-10 flex flex-col items-center justify-center scale-110">
            {/* Logo Composition */}
            <div className="relative mb-10 group">
                {/* Rotating Rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border border-cyan-500/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-dashed border-purple-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                
                {/* Hexagon Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-b from-cyan-900/20 to-transparent backdrop-blur-sm border border-cyan-500/20" 
                     style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                </div>

                {/* Inner Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-cyan-400/20 blur-2xl rounded-full"></div>

                {/* Main Logo */}
                <div className="relative z-20 fade-in-zoom drop-shadow-[0_0_25px_rgba(6,182,212,0.5)]">
                    <CometLogoIcon className="w-36 h-36" />
                </div>
            </div>
            
            {/* Title Block */}
            <div className="flex flex-col items-center">
                <h1 className="text-6xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 drop-shadow-2xl fade-in-up-1" style={{ textShadow: '0 0 30px rgba(255,255,255,0.1)' }}>
                    COMET
                </h1>
                
                <div className="flex items-center gap-4 mt-2 fade-in-up-2">
                    <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-cyan-500"></div>
                    <span className="text-2xl font-bold text-cyan-400 tracking-[0.4em] uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                        AI
                    </span>
                    <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-cyan-500"></div>
                </div>
            </div>
        </div>

        {/* Loading Footer */}
        <div className="absolute bottom-16 flex flex-col items-center w-64 gap-3">
            <div className="w-full h-[2px] bg-gray-800 rounded-full overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-loading-bar shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
            </div>
            <div className="flex justify-between w-full text-[9px] text-cyan-500/60 font-mono tracking-widest uppercase">
                <span className="animate-pulse">System Init</span>
                <span>v2.0</span>
            </div>
        </div>
    </div>
  );
};

export default WelcomeScreen;
