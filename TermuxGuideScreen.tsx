
import React, { useState } from 'react';
import { Screen } from '../types';
import { BackArrowIcon, CodeIcon, CopyIcon, TerminalIcon, WarningIcon, CheckCircleIcon } from './icons';

interface TermuxGuideScreenProps {
  navigateTo: (screen: Screen) => void;
}

const CodeBlock: React.FC<{ command: string }> = ({ command }) => {
    const [copySuccess, setCopySuccess] = useState('');

    const handleCopy = () => {
        navigator.clipboard.writeText(command).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Failed');
        });
    };

    return (
        <div className="bg-[#0a1020] rounded-lg border border-white/10 flex items-center justify-between p-3 font-mono text-sm group">
            <pre className="text-cyan-300 overflow-x-auto custom-scrollbar pr-4">
                <span className="text-green-400 mr-2">$</span>{command}
            </pre>
            <button 
                onClick={handleCopy} 
                className="p-2 -mr-1 rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
            >
                {copySuccess ? <CheckCircleIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
            </button>
        </div>
    );
};


const TermuxGuideScreen: React.FC<TermuxGuideScreenProps> = ({ navigateTo }) => {
  return (
    <div className="flex flex-col h-full text-white bg-[#0f0f1a]">
      <header className="flex items-center p-4 border-b border-white/5 shrink-0 bg-[#151525]">
        <button onClick={() => navigateTo(Screen.Home)} className="p-2 -ml-2 hover:bg-white/5 rounded-full">
          <BackArrowIcon className="w-6 h-6 text-gray-300" />
        </button>
        <h1 className="ml-2 font-bold flex items-center gap-2"><TerminalIcon className="w-5 h-5 text-green-400"/> Termux AI Guide</h1>
      </header>
      
      <main className="flex-grow p-5 overflow-y-auto space-y-8 custom-scrollbar">
        
        <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl border border-green-500/20 text-center">
            <h2 className="text-2xl font-bold text-white">Video-to-Hindi AI on Mobile</h2>
            <p className="text-gray-400 mt-2 max-w-sm mx-auto text-sm">
                Run our AI dubbing system directly on your Android device using Termux. This guide is for advanced users.
            </p>
        </div>
        
        {/* Requirements */}
        <div>
            <h3 className="text-lg font-semibold mb-3">Requirements</h3>
            <ul className="space-y-2 text-sm list-disc list-inside text-gray-300 bg-[#1a1a2e] p-4 rounded-xl border border-white/10">
                <li><span className="font-semibold text-white">Termux App:</span> Installed from F-Droid (recommended).</li>
                <li><span className="font-semibold text-white">Storage:</span> At least 2GB of free space for models and libraries.</li>
                <li><span className="font-semibold text-white">Internet:</span> A stable connection for the initial setup.</li>
                <li><span className="font-semibold text-white">Patience:</span> Processing is slow on mobile CPUs.</li>
            </ul>
        </div>

        {/* Setup Steps */}
        <div>
            <h3 className="text-lg font-semibold mb-3">Setup Instructions</h3>
            <div className="space-y-6">
                <div className="space-y-2">
                    <h4 className="font-semibold">Step 1: Update Packages</h4>
                    <p className="text-xs text-gray-500">Ensure Termux is up-to-date.</p>
                    <CodeBlock command="pkg update && pkg upgrade -y" />
                </div>

                <div className="space-y-2">
                    <h4 className="font-semibold">Step 2: Install Dependencies</h4>
                    <p className="text-xs text-gray-500">Install Python, FFmpeg, and Git.</p>
                    <CodeBlock command="pkg install python git ffmpeg -y" />
                </div>

                <div className="space-y-2">
                    <h4 className="font-semibold">Step 3: Clone the AI Repository</h4>
                    <p className="text-xs text-gray-500">Download the project files from our (hypothetical) GitHub.</p>
                    <CodeBlock command="git clone https://github.com/comet-ai/mobile-dubbing.git" />
                </div>

                <div className="space-y-2">
                    <h4 className="font-semibold">Step 4: Install Python Libraries</h4>
                    <p className="text-xs text-gray-500">Navigate into the project folder and install the required AI libraries.</p>
                    <CodeBlock command="cd mobile-dubbing && pip install -r requirements.txt" />
                </div>
            </div>
        </div>

        {/* Usage */}
        <div>
            <h3 className="text-lg font-semibold mb-3">How to Use</h3>
             <div className="space-y-2">
                <p className="text-xs text-gray-400">Place your video file inside the `mobile-dubbing` folder. Then, run the main script with your input and desired output file names.</p>
                <CodeBlock command="python main.py --input video.mp4 --output dubbed_video.mp4" />
            </div>
        </div>
        
        {/* Tips & Limitations */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
            <div className="flex items-start gap-3">
                <WarningIcon className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-bold text-yellow-400">Important Notes</h4>
                    <ul className="mt-2 text-xs text-gray-400 list-disc list-inside space-y-1">
                        <li>Processing a 1-minute video can take 15-30 minutes depending on your phone.</li>
                        <li>For best results, use short videos with clear, single-speaker audio.</li>
                        <li>This process is CPU-intensive and will use a lot of battery.</li>
                        <li>Ensure you have copyright permissions for the videos you process.</li>
                    </ul>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default TermuxGuideScreen;
