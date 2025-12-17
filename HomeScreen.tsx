
import React from 'react';
import { Screen } from '../types';
import { CometLogoIcon, ArrowRightIcon, ChatIcon, CodeIcon, LogoIcon, WandIcon, ToolsIcon, HeartIcon, MusicIcon, PaletteIcon, ToolsIcon as SettingsIcon, SparklesIcon, BookIcon, VideoTranslateIcon, TerminalIcon } from './icons';

interface HomeScreenProps {
  navigateTo: (screen: Screen, initialPrompt?: string) => void;
}

const recentSearches = [
    "Design a futuristic city logo",
    "Create a short video script about AI",
    "Enhance this prompt for a cyberpunk scene",
];

const HomeScreen: React.FC<HomeScreenProps> = ({ navigateTo }) => {

  return (
    <div className="flex flex-col h-full p-6 relative">
      {/* Header */}
      <header className="flex justify-between items-center z-10">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <CometLogoIcon className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="font-bold text-lg leading-none tracking-wide">COMET AI</h1>
                <p className="text-[10px] text-cyan-300 font-mono tracking-widest uppercase">Assistant v2.2</p>
            </div>
         </div>
         <div className="flex gap-3">
             <button 
                onClick={() => navigateTo(Screen.Donation)}
                className="w-9 h-9 rounded-full glass-panel flex items-center justify-center text-pink-400 hover:bg-pink-500/20 hover:text-pink-300 transition-all active:scale-95"
             >
                 <HeartIcon className="w-4 h-4" />
             </button>
             <button 
                onClick={() => navigateTo(Screen.Settings)}
                className="w-9 h-9 rounded-full glass-panel flex items-center justify-center text-gray-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
             >
                 <SettingsIcon className="w-4 h-4" />
             </button>
         </div>
      </header>

      <main className="flex-grow mt-6 overflow-y-auto custom-scrollbar pb-10 z-10 space-y-6">
        
        {/* Hero Section */}
        <div className="space-y-1">
            <h2 className="text-4xl font-light text-white">Hello, <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Creator.</span></h2>
            <p className="text-gray-400 text-sm font-light">What will we build together today?</p>
        </div>

        {/* Main CTA Card */}
        <div 
            className="w-full relative rounded-3xl p-6 h-48 cursor-pointer overflow-hidden group glass-panel transition-all duration-300 hover:border-cyan-500/30"
            onClick={() => navigateTo(Screen.Voice)}
        >
            {/* Animated Background Blob */}
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity"></div>
            
            <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                        <LogoIcon className="w-6 h-6 text-white"/>
                    </div>
                    <p className="text-xl font-bold text-white leading-tight">Talk to Comet</p>
                    <p className="text-xs text-gray-300 mt-1">Experience real-time voice conversations.</p>
                </div>
                <div className="flex items-center gap-2 mt-auto">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 group-hover:text-white transition-colors">Start Live Session</span>
                    <ArrowRightIcon className="w-4 h-4 text-cyan-300 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-3">
             <FeatureCard 
                icon={<PaletteIcon className="w-5 h-5 text-cyan-200" />} 
                title="Image Lab" 
                desc="Generate & Edit"
                gradient="from-cyan-500/20 to-blue-500/20"
                onClick={() => navigateTo(Screen.ImageGenerator)}
            />
             <FeatureCard 
                icon={<MusicIcon className="w-5 h-5 text-purple-200" />} 
                title="Voice Studio" 
                desc="Clone & TTS"
                gradient="from-purple-500/20 to-pink-500/20"
                onClick={() => navigateTo(Screen.VoiceGenerator)}
            />
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-3">
            <FeatureCard 
                icon={<ChatIcon className="w-5 h-5 text-emerald-200" />} 
                title="AI Chat" 
                desc="Smart Assistant"
                gradient="from-emerald-500/20 to-teal-500/20"
                onClick={() => navigateTo(Screen.Chat)}
            />
            <FeatureCard 
                icon={<CodeIcon className="w-5 h-5 text-orange-200" />} 
                title="App Builder" 
                desc="Code Generator"
                gradient="from-orange-500/20 to-red-500/20"
                onClick={() => navigateTo(Screen.AppDev)}
            />
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-3">
             <FeatureCard 
                icon={<VideoTranslateIcon className="w-5 h-5 text-red-300" />} 
                title="Hindi Dubbing AI" 
                desc="Video Translation"
                gradient="from-red-500/20 to-rose-500/20"
                onClick={() => navigateTo(Screen.Dubbing)}
            />
            <FeatureCard 
                icon={<TerminalIcon className="w-5 h-5 text-green-300" />} 
                title="Termux Mobile AI" 
                desc="Advanced Guide"
                gradient="from-green-500/20 to-lime-500/20"
                onClick={() => navigateTo(Screen.TermuxGuide)}
            />
        </div>

        {/* Prompt Library Card */}
        <div 
            className="glass-panel rounded-2xl p-4 flex items-center gap-4 cursor-pointer glass-card-hover relative overflow-hidden group mt-3"
            onClick={() => navigateTo(Screen.PromptLibrary)}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <BookIcon className="w-5 h-5 text-purple-300" />
            </div>
            <div className="relative z-10 flex-grow">
                <p className="font-bold text-white text-base">AI Prompt Library</p>
                <p className="text-[10px] text-gray-400 group-hover:text-gray-200 transition-colors">Master prompts for building your own AI</p>
            </div>
            <ArrowRightIcon className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-transform relative z-10" />
        </div>

        {/* Recent Activity */}
         <div className="glass-panel rounded-2xl p-4 mt-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <SparklesIcon className="w-3 h-3 text-yellow-500" /> Suggested Ideas
            </h2>
            <div className="space-y-3">
                {recentSearches.map((search, index) => (
                    <div 
                        key={index} 
                        className="flex items-center justify-between group cursor-pointer" 
                        onClick={() => navigateTo(Screen.Chat, search)}
                    >
                        <p className="text-xs text-gray-300 flex-1 pr-4 truncate group-hover:text-white transition-colors">{search}</p>
                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10">
                            <ArrowRightIcon className="w-3 h-3 text-gray-500 group-hover:text-white" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </main>
    </div>
  );
};

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
    gradient: string;
    onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc, gradient, onClick }) => {
    return (
        <div 
            className={`glass-panel rounded-2xl p-4 flex flex-col h-36 cursor-pointer glass-card-hover relative overflow-hidden group`}
            onClick={onClick}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className="relative z-10 flex flex-col h-full">
                <div className="p-2.5 rounded-xl bg-white/10 w-fit mb-auto backdrop-blur-sm border border-white/10">
                    {icon}
                </div>
                <div>
                    <p className="font-bold text-white text-base">{title}</p>
                    <p className="text-[10px] text-gray-400 group-hover:text-gray-200 transition-colors">{desc}</p>
                </div>
            </div>
        </div>
    )
}

export default HomeScreen;