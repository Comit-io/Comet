
import React, { useState, useEffect, useRef } from 'react';
import { Screen } from '../types';
import { BackArrowIcon, SendIcon, CopyIcon, PlayIcon, SaveIcon, FileIcon, FolderIcon, DesktopIcon, MobileIcon, TerminalIcon, CrownIcon, MoreIcon } from './icons';
import { generateAppCodeStream } from '../services/geminiService';
import FloatingPreviewWindow from './FloatingPreviewWindow';

interface AppDevScreenProps {
  navigateTo: (screen: Screen) => void;
}

const AppDevScreen: React.FC<AppDevScreenProps> = ({ navigateTo }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [projectName, setProjectName] = useState('My Awesome App');
  const [previewKey, setPreviewKey] = useState(0);
  const [consoleOutput, setConsoleOutput] = useState('> Ready for instructions.');
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  
  const mainRef = useRef<HTMLElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleOutput]);
  
  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setCopySuccess('');
    setConsoleOutput(prev => prev + '\n> AI build process started...');
    
    const codeToModify = generatedCode;
    const isModification = !!codeToModify;
    
    if(isModification) {
        setGeneratedCode('');
    }

    const fullResponse = await generateAppCodeStream(
      prompt,
      isModification ? codeToModify : undefined,
      (chunk) => {
        setGeneratedCode(prev => prev + chunk);
      }
    );

    const cleanedCode = fullResponse.replace(/^```(html|javascript|python|jsx)?\n|```$/g, '').trim();
    if (cleanedCode) {
      setGeneratedCode(cleanedCode);
    }

    setIsLoading(false);
    setConsoleOutput(prev => prev + '\n> Build finished successfully. Ready to run.');
    setPrompt('');
  };

  const handleRun = () => {
    if (!generatedCode || isLoading) return;
    setConsoleOutput(prev => prev + `\n> Running project...`);
    if (!isPreviewVisible) {
        setIsPreviewVisible(true);
    }
    setPreviewKey(prev => prev + 1);
     setTimeout(() => {
        setConsoleOutput(prev => prev + '\n> Preview updated.');
    }, 300);
  }

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode).then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      }, () => {
        setCopySuccess('Failed');
      });
    }
  };
  
  const renderWelcomeScreen = () => (
    <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-400 p-8">
        <svg className="w-24 h-24 text-purple-500/50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 12C14 14.7614 11.7614 17 9 17H7C4.23858 17 2 14.7614 2 12C2 9.23858 4.23858 7 7 7H7.5M10 12C10 9.23858 12.2386 7 15 7H17C19.7614 7 22 9.23858 22 12C22 14.7614 19.7614 17 17 17H16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <h2 className="mt-6 text-2xl font-bold text-white">COMIT BUILDER</h2>
        <p className="mt-2 max-w-sm">
            Describe any app you can imagine, from a Python script to a full-stack web application. Let's build something amazing together.
        </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full text-white bg-[#101022]">
        {/* Header */}
        <header className="flex justify-between items-center p-2 border-b border-white/10 shrink-0 bg-[#1a1a3a]">
            <div className="flex items-center gap-2">
                <button onClick={() => navigateTo(Screen.Home)} className="p-2 hover:bg-white/10 rounded">
                    <BackArrowIcon className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-white/10"></div>
                <input 
                    type="text" 
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="bg-transparent focus:outline-none px-2 py-1 rounded hover:bg-white/10 text-sm"
                />
            </div>
            <div className="flex items-center gap-2">
                {/* Free Developer Area - No Upgrade Button Here */}
                <button 
                    onClick={handleRun} 
                    className="flex items-center gap-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-1.5 rounded-md disabled:bg-purple-800 disabled:cursor-not-allowed"
                    disabled={!generatedCode || isLoading}
                >
                    <PlayIcon className="w-4 h-4" /> Run
                </button>
            </div>
        </header>

        <div className="flex flex-grow min-h-0">
            {/* File Explorer */}
            <aside className="w-48 bg-[#1a1a3a] p-2 border-r border-white/10 shrink-0 flex flex-col">
                <h3 className="text-xs font-bold uppercase text-gray-400 px-2">Explorer</h3>
                <div className="mt-2 space-y-1 text-sm">
                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-purple-600/30 text-white">
                        <FileIcon className="w-4 h-4" /> index.html
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 text-gray-300">
                        <FolderIcon className="w-4 h-4" /> components
                    </div>
                </div>
                <div className="mt-auto text-center text-xs text-gray-600 p-2">
                    Multi-file support coming soon!
                </div>
            </aside>
            
            <main ref={mainRef} className="flex-grow flex flex-col relative overflow-hidden">
                 {/* Code & Console Panel */}
                <div className="flex-grow flex flex-col bg-[#1E1E3F] min-h-0">
                    {(!generatedCode && !isLoading) ? renderWelcomeScreen() : (
                        <>
                            <div className="flex justify-between items-center bg-gray-800/70 p-1.5 text-sm border-b border-white/10">
                                <span className="px-2">index.html</span>
                                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded">
                                    <CopyIcon className="w-3.5 h-3.5" /> {copySuccess || 'Copy'}
                                </button>
                            </div>
                            <pre className="overflow-auto p-4 flex-grow text-sm font-mono">
                                <code>
                                    {generatedCode}
                                    {isLoading && !generatedCode && <span className="text-gray-400">Generating code...</span>}
                                    {isLoading && generatedCode && <span className="inline-block w-2 h-4 bg-white animate-pulse ml-1"></span>}
                                </code>
                            </pre>
                        </>
                    )}
                </div>
                {/* Console */}
                <div className="h-32 bg-[#1a1a3a] border-t border-white/10 shrink-0 flex flex-col">
                    <div className="flex items-center gap-4 px-2 border-b border-white/10">
                        <button className="px-2 py-1 text-sm border-b-2 border-purple-500 text-white">Console</button>
                        <button className="px-2 py-1 text-sm text-gray-400 hover:text-white">Problems</button>
                    </div>
                    <div className="p-2 text-xs font-mono text-gray-400 overflow-auto flex-grow whitespace-pre-wrap">
                        {consoleOutput}
                        <div ref={consoleEndRef} />
                    </div>
                </div>

                {isPreviewVisible && (
                    <FloatingPreviewWindow
                        parentRef={mainRef}
                        generatedCode={generatedCode}
                        previewKey={previewKey}
                        onRun={handleRun}
                        onClose={() => setIsPreviewVisible(false)}
                    />
                )}

                {/* AI Assistant Input */}
                <footer className="p-2 shrink-0 border-t border-white/10 bg-[#101022]">
                    <div className="flex items-center gap-2 bg-[#2a2a4a] rounded-lg p-2">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={generatedCode ? "Describe a change to your app..." : "e.g., 'Create a login app with React'"}
                            className="flex-grow bg-transparent focus:outline-none px-3 text-sm resize-none h-12"
                            disabled={isLoading}
                            rows={2}
                        />
                        <button
                            onClick={handleGenerate}
                            className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 self-end transition-colors"
                            disabled={!prompt.trim() || isLoading}
                        >
                            <SendIcon className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </footer>
            </main>
        </div>
    </div>
  );
};

export default AppDevScreen;
