
import React, { useState, useEffect, useRef } from 'react';
import { Screen, Message } from '../types';
import { BackArrowIcon, MoreIcon, SendIcon, MicIcon, CopyIcon, ReloadIcon } from './icons';
import { getChatResponseStream } from '../services/geminiService';

interface ChatScreenProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  navigateTo: (screen: Screen) => void;
  initialPrompt?: string;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ messages, setMessages, navigateTo, initialPrompt }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reloadPrompt, setReloadPrompt] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;
    
    setIsLoading(true);

    const chatHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
    
    const newUserMessage: Message = { id: Date.now(), text: prompt, sender: 'user' };
    const aiMessageId = Date.now() + 1;
    const newAiMessage: Message = { id: aiMessageId, text: '', sender: 'ai' };
    
    setMessages(prev => [...prev, newUserMessage, newAiMessage]);
    if(input) setInput('');

    await getChatResponseStream(prompt, chatHistory, (chunk) => {
        setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, text: msg.text + chunk } : msg
        ));
    });
    
    setIsLoading(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSend(input);
  }
  
  const handleReload = () => {
      if (isLoading) return;
      let lastUserMessageIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].sender === 'user') {
          lastUserMessageIndex = i;
          break;
        }
      }
      if (lastUserMessageIndex !== -1) {
          const lastUserMessage = messages[lastUserMessageIndex];
          setMessages(messages.slice(0, lastUserMessageIndex)); 
          setReloadPrompt(lastUserMessage.text);
      }
  }

  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      handleSend(initialPrompt);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  useEffect(() => {
    if (reloadPrompt) {
        handleSend(reloadPrompt);
        setReloadPrompt(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadPrompt]);
  
  return (
    <div className="flex flex-col h-full relative">
      {/* Floating Header */}
      <header className="absolute top-0 left-0 right-0 p-4 z-20">
          <div className="glass-panel rounded-full px-2 py-2 flex justify-between items-center shadow-lg">
            <button onClick={() => navigateTo(Screen.Home)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                <BackArrowIcon className="w-5 h-5 text-white" />
            </button>
            <div className="flex flex-col items-center">
                <span className="font-bold text-sm tracking-wide">Comet AI</span>
                <span className="text-[9px] text-green-400 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div> Online</span>
            </div>
            <button className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                <MoreIcon className="w-5 h-5 text-white" />
            </button>
          </div>
      </header>

      <main className="flex-grow pt-24 pb-4 px-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-6">
          {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-64 text-center opacity-60 mt-10">
                 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                    <SendIcon className="w-8 h-8 text-cyan-200" />
                 </div>
                 <p className="text-sm font-medium">Start a conversation</p>
                 <p className="text-xs text-gray-400 mt-1">Ask me anything about the universe.</p>
             </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                
                {msg.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.5)] shrink-0 mb-1"></div>
                )}
                
                <div className={`max-w-[85%] px-5 py-3.5 shadow-md backdrop-blur-sm border border-white/5
                    ${msg.sender === 'user' 
                        ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-2xl rounded-tr-sm' 
                        : 'bg-white/10 text-gray-100 rounded-2xl rounded-tl-sm'
                    }`
                }>
                    {msg.sender === 'ai' && msg.text === '' && isLoading ? (
                         <div className="flex space-x-1.5 py-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                        </div>
                    ) : (
                        <p className="text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                    )}
                    
                    {msg.sender === 'ai' && msg.text && (
                        <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-white/5 opacity-60 hover:opacity-100 transition-opacity">
                           <button onClick={() => navigator.clipboard.writeText(msg.text)} className="p-1 hover:text-white transition-colors" title="Copy">
                                <CopyIcon className="w-3.5 h-3.5"/>
                           </button>
                        </div>
                    )}
                </div>
                
                {msg.sender === 'user' && (
                     <div className="w-6 h-6 rounded-full bg-gray-500/50 shrink-0 mb-1"></div>
                )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {messages.length > 0 && !isLoading && (
            <div className="flex justify-center my-4">
                <button onClick={handleReload} className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                    <ReloadIcon className="w-3 h-3" /> Regenerate
                </button>
            </div>
        )}
      </main>

      <footer className="p-4 pt-0 z-20">
        <form onSubmit={handleFormSubmit} className="glass-panel rounded-[2rem] p-1.5 flex items-center gap-2 relative shadow-2xl">
            <button type="button" onClick={() => navigateTo(Screen.Voice)} className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-purple-500/30">
                <MicIcon className="w-5 h-5 text-white" />
            </button>
            
            <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Comet..."
                className="flex-grow bg-transparent focus:outline-none px-2 text-sm text-white placeholder-gray-400 h-full"
                disabled={isLoading}
            />
            
            <button 
                type="submit" 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${input ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 rotate-0' : 'bg-white/5 text-gray-500 rotate-90 scale-90'}`}
                disabled={!input || isLoading}
            >
                <SendIcon className="w-5 h-5" />
            </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatScreen;
