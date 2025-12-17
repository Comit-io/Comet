
import React, { useState, useRef, useEffect } from 'react';
import { Screen } from '../types';
import { BackArrowIcon, WandIcon, DownloadIcon, ReloadIcon, PaletteIcon, ImageIcon, SparklesIcon, MaximizeIcon, VideoCameraIcon, BrushIcon, ExpandIcon, MinusCircleIcon, CloseIcon, SendIcon, LayersIcon, SchoolIcon, GlobeIcon, UploadIcon, TrashIcon, HeartIcon } from './icons';
import { generateImageAPI, enhanceImagePromptAPI, upscaleImageAPI, animateImageAPI, editImageAPI, generateVideoFromTextAPI, analyzeStyleAPI, blobToBase64 } from '../services/geminiService';

interface ImageGeneratorScreenProps {
  navigateTo: (screen: Screen) => void;
}

const STYLES = [
    'Realistic', 'Cinematic', 'Anime', 'Cartoon', 'Digital Art', 
    '3D Render', 'Pixel Art', 'Fantasy', 'Sci-Fi', 'Cyberpunk', 
    'Minimal', 'Oil Painting', 'Watercolor'
];

const ASPECT_RATIOS = [
    { label: 'Square (1:1)', value: '1:1' },
    { label: 'Landscape (16:9)', value: '16:9' },
    { label: 'Portrait (9:16)', value: '9:16' },
];

type Tab = 'image' | 'video' | 'canvas' | 'train' | 'gallery';

interface CustomStyle {
    id: string;
    name: string;
    promptSuffix: string;
}

interface GalleryItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    prompt: string;
}

const ImageGeneratorScreen: React.FC<ImageGeneratorScreenProps> = ({ navigateTo }) => {
    // Navigation & State
    const [activeTab, setActiveTab] = useState<Tab>('image');
    
    // Core Generation
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('Realistic');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [isNegativeOpen, setIsNegativeOpen] = useState(false);
    
    // Custom Styles
    const [customStyles, setCustomStyles] = useState<CustomStyle[]>([]);
    const [trainingImages, setTrainingImages] = useState<File[]>([]);
    const [styleName, setStyleName] = useState('');
    
    // Canvas / Edit
    const [canvasImage, setCanvasImage] = useState<string | null>(null);
    const [editInstruction, setEditInstruction] = useState('');
    const [canvasHistory, setCanvasHistory] = useState<string[]>([]); // Undo stack

    // Results & Gallery
    const [generatedResult, setGeneratedResult] = useState<{type: 'image'|'video', url: string} | null>(null);
    const [gallery, setGallery] = useState<GalleryItem[]>([]);

    // Processing Status
    const [isProcessing, setIsProcessing] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const displayToast = (msg: string) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // --- Tab Switching Logic ---
    useEffect(() => {
        // Reset specific states when switching tabs if needed
        if (activeTab === 'canvas' && generatedResult?.type === 'image' && !canvasImage) {
            setCanvasImage(generatedResult.url);
        }
    }, [activeTab, generatedResult, canvasImage]);

    // --- Actions ---

    // 1. Image Generation
    const handleGenerateImage = async () => {
        if (!prompt.trim()) return displayToast("Enter a prompt");
        setIsProcessing(true);
        
        let finalPrompt = prompt;
        // Check for custom style usage
        const customStyle = customStyles.find(s => s.name === selectedStyle);
        if (customStyle) {
            finalPrompt += `, ${customStyle.promptSuffix}`;
        }

        const res = await generateImageAPI(finalPrompt, selectedStyle, aspectRatio, negativePrompt);
        
        if (res.status === 'success' && res.image_data) {
            const url = `data:image/png;base64,${res.image_data}`;
            setGeneratedResult({ type: 'image', url });
            addToGallery('image', url, prompt);
            displayToast("Image generated ✨");
        } else {
            displayToast(res.message);
        }
        setIsProcessing(false);
    };

    // 2. Video Generation
    const handleGenerateVideo = async () => {
        if (!prompt.trim()) return displayToast("Enter a video prompt");
        setIsProcessing(true);
        
        // Check if we are animating an existing image or creating from text
        if (activeTab === 'video' && generatedResult?.type === 'image' && prompt === "Animate this image") {
             const base64 = generatedResult.url.split(',')[1];
             const res = await animateImageAPI(base64);
             if (res.status === 'success' && res.video_url) {
                 setGeneratedResult({ type: 'video', url: res.video_url });
                 addToGallery('video', res.video_url, "Animate Image");
                 displayToast("Video generated 🎥");
             } else {
                 displayToast(res.message);
             }
        } else {
             // Text to Video
             const res = await generateVideoFromTextAPI(prompt);
             if (res.status === 'success' && res.video_url) {
                 setGeneratedResult({ type: 'video', url: res.video_url });
                 addToGallery('video', res.video_url, prompt);
                 displayToast("Video generated 🎥");
             } else {
                 displayToast(res.message);
             }
        }
        setIsProcessing(false);
    };

    // 3. Canvas Edit
    const handleCanvasEdit = async (instruction: string = editInstruction) => {
        if (!canvasImage || !instruction.trim()) return;
        setIsProcessing(true);
        
        // Push current state to history
        setCanvasHistory(prev => [...prev, canvasImage]);

        const base64 = canvasImage.split(',')[1];
        const res = await editImageAPI(base64, instruction);
        
        if (res.status === 'success' && res.image_data) {
            setCanvasImage(`data:image/png;base64,${res.image_data}`);
            setEditInstruction('');
            displayToast("Canvas updated ✨");
        } else {
            displayToast(res.message);
        }
        setIsProcessing(false);
    };

    const handleUndo = () => {
        if (canvasHistory.length === 0) return;
        const previous = canvasHistory[canvasHistory.length - 1];
        setCanvasImage(previous);
        setCanvasHistory(prev => prev.slice(0, -1));
        displayToast("Undo successful");
    };

    // 4. Style Training
    const handleTrainStyle = async () => {
        if (trainingImages.length < 1 || !styleName) return displayToast("Need images and a name");
        setIsProcessing(true);

        const base64Images: string[] = [];
        for (const file of trainingImages) {
            const b64 = await blobToBase64(file);
            base64Images.push(b64);
        }

        const styleKeywords = await analyzeStyleAPI(base64Images);
        
        const newStyle: CustomStyle = {
            id: Date.now().toString(),
            name: styleName,
            promptSuffix: styleKeywords
        };

        setCustomStyles(prev => [...prev, newStyle]);
        setTrainingImages([]);
        setStyleName('');
        displayToast("Custom style trained 🎨");
        setIsProcessing(false);
    };

    // Shared
    const addToGallery = (type: 'image'|'video', url: string, prompt: string) => {
        setGallery(prev => [{ id: Date.now().toString(), type, url, prompt }, ...prev]);
    };

    const handleEnhance = async () => {
        if (!prompt) return;
        setIsEnhancing(true);
        const enhanced = await enhanceImagePromptAPI(prompt);
        setPrompt(enhanced);
        setIsEnhancing(false);
    };

    const handleUploadTrainingImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setTrainingImages(Array.from(e.target.files));
        }
    };

    // --- Renderers ---

    const renderHeader = () => (
        <header className="flex justify-between items-center p-4 border-b border-white/5 shrink-0 bg-[#151525]">
            <button onClick={() => navigateTo(Screen.Home)} className="p-2 -ml-2 hover:bg-white/5 rounded-full">
                <BackArrowIcon className="w-6 h-6 text-gray-300" />
            </button>
            <div className="flex items-center gap-2">
                    <div className="bg-blue-500/20 p-1.5 rounded-full">
                    <PaletteIcon className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="font-bold text-lg">COMET Creative</span>
            </div>
            <div className="w-6"></div>
        </header>
    );

    const renderTabs = () => (
        <div className="flex overflow-x-auto border-b border-white/10 bg-[#151525]">
            <TabButton id="image" icon={<ImageIcon className="w-4 h-4"/>} label="Image" active={activeTab} setTab={setActiveTab} />
            <TabButton id="video" icon={<VideoCameraIcon className="w-4 h-4"/>} label="Video" active={activeTab} setTab={setActiveTab} />
            <TabButton id="canvas" icon={<LayersIcon className="w-4 h-4"/>} label="Canvas" active={activeTab} setTab={setActiveTab} />
            <TabButton id="train" icon={<SchoolIcon className="w-4 h-4"/>} label="Train" active={activeTab} setTab={setActiveTab} />
            <TabButton id="gallery" icon={<GlobeIcon className="w-4 h-4"/>} label="Gallery" active={activeTab} setTab={setActiveTab} />
        </div>
    );

    const renderImageTab = () => (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="relative">
                <textarea 
                    className="w-full h-28 bg-[#1a1a2e] border border-white/10 rounded-xl p-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none text-base leading-relaxed"
                    placeholder="Describe your masterpiece..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
                <button onClick={handleEnhance} disabled={isEnhancing} className="absolute top-3 right-3 p-2 bg-purple-500/10 hover:bg-purple-500/30 rounded-lg text-purple-400 transition-colors">
                    {isEnhancing ? <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon className="w-5 h-5" />}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                    <select 
                        value={selectedStyle}
                        onChange={(e) => setSelectedStyle(e.target.value)}
                        className="w-full p-3 bg-[#1a1a2e] border border-white/10 rounded-lg appearance-none focus:outline-none focus:border-blue-500 text-sm"
                    >
                        {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                        {customStyles.length > 0 && <optgroup label="My Styles">
                            {customStyles.map(s => <option key={s.id} value={s.name}>{s.name} (Custom)</option>)}
                        </optgroup>}
                    </select>
                    <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                </div>
                <div className="relative">
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full p-3 bg-[#1a1a2e] border border-white/10 rounded-lg appearance-none focus:outline-none focus:border-blue-500 text-sm">
                        {ASPECT_RATIOS.map(ar => <option key={ar.value} value={ar.value}>{ar.label}</option>)}
                    </select>
                    <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                </div>
            </div>

            <button 
                onClick={handleGenerateImage}
                disabled={isProcessing || !prompt}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-xl font-bold text-white shadow-lg shadow-blue-900/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <WandIcon className="w-5 h-5" />}
                Generate Image
            </button>

            {generatedResult?.type === 'image' && (
                <div className="mt-6 rounded-xl overflow-hidden shadow-2xl border border-white/10">
                    <img src={generatedResult.url} alt="Result" className="w-full h-auto" />
                    <div className="p-3 bg-[#1a1a2e] flex justify-end gap-2 overflow-x-auto">
                        <button onClick={() => { setActiveTab('video'); setPrompt('Animate this image'); }} className="p-2 text-xs bg-white/10 rounded hover:bg-white/20 whitespace-nowrap">Animate</button>
                        <button onClick={() => { setCanvasImage(generatedResult.url); setActiveTab('canvas'); }} className="p-2 text-xs bg-white/10 rounded hover:bg-white/20 whitespace-nowrap">Edit in Canvas</button>
                        <button onClick={() => navigateTo(Screen.Donation)} className="p-2 bg-pink-500/20 text-pink-400 rounded hover:bg-pink-500/30"><HeartIcon className="w-4 h-4"/></button>
                        <button onClick={() => { const a = document.createElement('a'); a.href=generatedResult.url; a.download='comet-img.png'; a.click(); }} className="p-2 bg-blue-600 rounded hover:bg-blue-500"><DownloadIcon className="w-4 h-4"/></button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderVideoTab = () => (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
             <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3">
                <VideoCameraIcon className="w-6 h-6 text-red-400" />
                <div>
                    <h3 className="font-bold text-red-400 text-sm">Text-to-Video AI</h3>
                    <p className="text-xs text-gray-400">Generate 5s cinematic clips directly from text.</p>
                </div>
            </div>

            <textarea 
                className="w-full h-28 bg-[#1a1a2e] border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
                placeholder="A cinematic drone shot of a futuristic city at sunset..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />

            <button 
                onClick={handleGenerateVideo}
                disabled={isProcessing || !prompt}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 rounded-xl font-bold text-white shadow-lg shadow-red-900/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <VideoCameraIcon className="w-5 h-5" />}
                Generate Video
            </button>

            {generatedResult?.type === 'video' && (
                <div className="mt-6 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                    <video src={generatedResult.url} controls autoPlay loop className="w-full h-auto" />
                    <div className="p-3 bg-[#1a1a2e] flex justify-end gap-2">
                         <button onClick={() => navigateTo(Screen.Donation)} className="p-2 bg-pink-500/20 text-pink-400 rounded hover:bg-pink-500/30"><HeartIcon className="w-4 h-4"/></button>
                         <button onClick={() => { const a = document.createElement('a'); a.href=generatedResult.url; a.download='comet-video.mp4'; a.click(); }} className="p-2 bg-red-600 rounded hover:bg-red-500"><DownloadIcon className="w-4 h-4"/></button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderCanvasTab = () => (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
            <div className="flex-grow bg-[#050510] border border-white/10 rounded-xl relative overflow-hidden flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                {canvasImage ? (
                    <img src={canvasImage} alt="Canvas" className="max-w-full max-h-full object-contain" />
                ) : (
                    <div className="text-center text-gray-500">
                        <BrushIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Generate an image first or</p>
                        <label className="text-purple-400 cursor-pointer hover:underline text-sm">
                            upload one
                            <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                if(e.target.files?.[0]) {
                                    const b64 = await blobToBase64(e.target.files[0]);
                                    setCanvasImage(`data:image/png;base64,${b64}`);
                                }
                            }}/>
                        </label>
                    </div>
                )}
            </div>

            <div className="mt-4 space-y-3 shrink-0">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <QuickAction label="Remove BG" onClick={() => handleCanvasEdit("Remove the background and make it transparent")} />
                    <QuickAction label="Sunset" onClick={() => handleCanvasEdit("Change the sky to a beautiful sunset")} />
                    <QuickAction label="Cyberpunk" onClick={() => handleCanvasEdit("Make it look like a cyberpunk city with neon lights")} />
                    <QuickAction label="Sketch" onClick={() => handleCanvasEdit("Convert this into a pencil sketch")} />
                    <QuickAction label="Undo" onClick={handleUndo} icon={<ReloadIcon className="w-3 h-3"/>} />
                </div>

                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={editInstruction}
                        onChange={(e) => setEditInstruction(e.target.value)}
                        placeholder="Describe your edit (e.g. 'Add a hat')"
                        className="flex-grow bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 text-sm"
                    />
                    <button 
                        onClick={() => handleCanvasEdit()}
                        disabled={isProcessing || !canvasImage}
                        className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg disabled:opacity-50"
                    >
                        {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <SendIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderTrainTab = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                <h3 className="font-bold text-green-400 text-sm flex items-center gap-2"><SchoolIcon className="w-4 h-4"/> Style Trainer</h3>
                <p className="text-xs text-gray-400 mt-1">Upload 5-10 images to teach COMET your unique art style.</p>
            </div>

            <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center bg-[#1a1a2e]/50 hover:border-green-500 transition-colors relative">
                <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={handleUploadTrainingImages}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadIcon className="w-10 h-10 mx-auto text-gray-500 mb-2" />
                <p className="text-sm text-gray-300 font-medium">
                    {trainingImages.length > 0 ? `${trainingImages.length} images selected` : "Drop images here"}
                </p>
            </div>

            <input 
                type="text" 
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                placeholder="Name your style (e.g. My Anime)"
                className="w-full p-3 bg-[#1a1a2e] border border-white/10 rounded-lg focus:outline-none focus:border-green-500"
            />

            <button 
                onClick={handleTrainStyle}
                disabled={isProcessing || trainingImages.length === 0 || !styleName}
                className="w-full py-3.5 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white shadow-lg shadow-green-900/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isProcessing ? "Analyzing..." : "Train Style Model"}
            </button>

            {customStyles.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-gray-400 mb-2">My Custom Styles</h4>
                    <div className="space-y-2">
                        {customStyles.map(s => (
                            <div key={s.id} className="p-3 bg-[#1a1a2e] rounded-lg flex justify-between items-center border border-white/5">
                                <span className="text-sm font-medium">{s.name}</span>
                                <button onClick={() => setCustomStyles(prev => prev.filter(cs => cs.id !== s.id))} className="text-red-400 hover:text-red-300">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderGalleryTab = () => (
        <div className="animate-in fade-in slide-in-from-right-4">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><GlobeIcon className="w-5 h-5 text-blue-400"/> Community Feed</h3>
            
            {gallery.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                    <p>No creations yet. Start generating!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {gallery.map(item => (
                        <div key={item.id} className="relative group rounded-xl overflow-hidden bg-black aspect-square">
                            {item.type === 'video' ? (
                                <video src={item.url} className="w-full h-full object-cover" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()}/>
                            ) : (
                                <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                                <p className="text-[10px] text-white line-clamp-2">{item.prompt}</p>
                                <div className="flex gap-2 mt-1">
                                    <button onClick={() => { const a = document.createElement('a'); a.href=item.url; a.download=`comet-${item.type}.png`; a.click(); }} className="p-1 bg-white/20 rounded hover:bg-white/40"><DownloadIcon className="w-3 h-3 text-white"/></button>
                                </div>
                            </div>
                            {item.type === 'video' && <div className="absolute top-2 right-2 bg-black/50 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1"><VideoCameraIcon className="w-3 h-3"/> Video</div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full text-white bg-[#0f0f1a]">
            {renderHeader()}
            {renderTabs()}
            <main className="flex-grow p-5 overflow-y-auto pb-20">
                {activeTab === 'image' && renderImageTab()}
                {activeTab === 'video' && renderVideoTab()}
                {activeTab === 'canvas' && renderCanvasTab()}
                {activeTab === 'train' && renderTrainTab()}
                {activeTab === 'gallery' && renderGalleryTab()}
            </main>
            
            {showToast && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 z-50 whitespace-nowrap">
                    {toastMessage}
                </div>
            )}
        </div>
    );
};

const TabButton = ({ id, icon, label, active, setTab }: { id: Tab, icon: any, label: string, active: Tab, setTab: (t: Tab) => void }) => (
    <button 
        onClick={() => setTab(id)}
        className={`flex-1 min-w-[70px] py-3 flex flex-col items-center gap-1 transition-colors border-b-2 ${active === id ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
    >
        <div className={`${active === id ? 'text-purple-400' : ''}`}>{icon}</div>
        <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
    </button>
);

const QuickAction = ({ label, onClick, icon }: { label: string, onClick: () => void, icon?: any }) => (
    <button onClick={onClick} className="px-3 py-1.5 bg-[#1a1a2e] border border-white/10 rounded-full text-xs hover:bg-white/10 whitespace-nowrap flex items-center gap-1">
        {icon} {label}
    </button>
)

export default ImageGeneratorScreen;
