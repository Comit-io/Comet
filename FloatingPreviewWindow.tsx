
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PlayIcon, ReloadIcon, MinimizeIcon, CloseIcon, DesktopIcon, MobileIcon } from './icons';

interface FloatingPreviewWindowProps {
  parentRef: React.RefObject<HTMLElement>;
  generatedCode: string;
  previewKey: number;
  onRun: () => void;
  onClose: () => void;
}

const FloatingPreviewWindow: React.FC<FloatingPreviewWindowProps> = ({ parentRef, generatedCode, previewKey, onRun, onClose }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  
  const windowRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

  // Set initial position to bottom-right corner
  useEffect(() => {
    if (parentRef.current && windowRef.current) {
      const parentRect = parentRef.current.getBoundingClientRect();
      const windowRect = windowRef.current.getBoundingClientRect();
      setPosition({
        x: parentRect.width - windowRect.width - 20,
        y: parentRect.height - windowRect.height - 20,
      });
    }
  }, [parentRef]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    if (windowRef.current) {
        const rect = windowRef.current.getBoundingClientRect();
        offsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }
    // Set cursor style on the body to prevent text selection cursor
    document.body.style.cursor = 'grabbing';
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging || !parentRef.current || !windowRef.current) return;
    e.preventDefault();
    
    const parentRect = parentRef.current.getBoundingClientRect();
    const windowRect = windowRef.current.getBoundingClientRect();
    
    // ClientX/Y is relative to the viewport, parentRect.left/top is also relative to viewport
    // So we can calculate the new position relative to the parent
    let newX = e.clientX - parentRect.left - offsetRef.current.x;
    let newY = e.clientY - parentRect.top - offsetRef.current.y;

    // Clamp position within parent boundaries
    const maxX = parentRect.width - windowRect.width;
    const maxY = parentRect.height - windowRect.height;
    
    newX = clamp(newX, 0, maxX);
    newY = clamp(newY, 0, maxY);
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, parentRef]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    // Reset cursor style
    document.body.style.cursor = 'default';
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return (
    <div
      ref={windowRef}
      className={`absolute flex flex-col w-[600px] max-w-[90vw] h-[450px] rounded-lg shadow-2xl bg-black/30 backdrop-blur-md border border-white/10 text-white transition-all duration-300 ${isMinimized ? 'h-12' : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: 'none' // Prevent default touch actions like scrolling
      }}
    >
      {/* Header */}
      <div
        onPointerDown={handlePointerDown}
        className="flex justify-between items-center p-2 bg-black/40 rounded-t-lg cursor-grab active:cursor-grabbing"
      >
        <span className="text-sm font-semibold pl-2">Live Preview</span>
        <div className="flex items-center gap-1">
          <button onClick={onRun} className="p-1.5 hover:bg-white/10 rounded"><PlayIcon className="w-4 h-4" /></button>
          <button onClick={onRun} className="p-1.5 hover:bg-white/10 rounded"><ReloadIcon className="w-4 h-4" /></button>
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/10 rounded"><MinimizeIcon className="w-4 h-4" /></button>
          <button onClick={onClose} className="p-1.5 hover:bg-red-500/50 rounded"><CloseIcon className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-grow flex flex-col min-h-0 ${isMinimized ? 'hidden' : 'flex'}`}>
         <div className="flex justify-end items-center bg-gray-800/70 p-1 text-sm border-b border-white/10">
            <div className="flex items-center gap-1 bg-gray-900 rounded-md p-0.5">
               <button onClick={() => setPreviewMode('desktop')} className={`p-1 rounded ${previewMode === 'desktop' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}><DesktopIcon className="w-4 h-4"/></button>
               <button onClick={() => setPreviewMode('mobile')} className={`p-1 rounded ${previewMode === 'mobile' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}><MobileIcon className="w-4 h-4"/></button>
            </div>
        </div>
        <div className="flex-grow p-2 bg-gray-900 flex justify-center items-center rounded-b-lg">
           <div className={`${previewMode === 'mobile' ? 'w-[375px] h-[667px] max-w-full max-h-full' : 'w-full h-full'} bg-white transition-all duration-300 rounded-sm shadow-lg`}>
                <iframe
                    key={previewKey}
                    srcDoc={generatedCode}
                    title="App Preview"
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-modals allow-forms"
                />
           </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingPreviewWindow;
