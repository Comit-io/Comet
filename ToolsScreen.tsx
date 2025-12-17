
import React, { useState, useRef, useEffect } from 'react';
import { Screen } from '../types';
import { 
    BackArrowIcon, PaletteIcon, VideoIcon, MegaphoneIcon, BriefcaseIcon, 
    BookIcon, ChipIcon, WandIcon, SendIcon, CopyIcon, PlayIcon, 
    ReloadIcon, CheckCircleIcon
} from './icons';
import { getChatResponseStream, playTextToSpeech } from '../services/geminiService';

interface ToolsScreenProps {
  navigateTo: (screen: Screen, initialPrompt?: string) => void;
}

// --- Types for the Tool System ---
type InputType = 'text' | 'textarea' | 'select';

interface ToolInput {
    key: string;
    label: string;
    type: InputType;
    placeholder?: string;
    options?: string[]; // For select inputs
    defaultValue?: string;
}

interface ToolDefinition {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
    inputs: ToolInput[];
    // Function to construct the prompt based on user inputs
    promptBuilder: (data: Record<string, string>) => string;
}

interface Category {
    name: string;
    icon: React.ReactNode;
    color: string;
    tools: ToolDefinition[];
}

// --- Tool Definitions ---

const TOOLS_DATA: Category[] = [
    {
        name: 'Core AI',
        icon: <ChipIcon className="w-5 h-5 text-blue-400" />,
        color: 'border-blue-500/30 bg-blue-500/10',
        tools: [
            {
                id: 'ai-detector',
                name: 'AI Content Detector',
                icon: <ChipIcon className="w-5 h-5" />,
                description: 'Analyze text to determine if it reads like AI-generated content.',
                inputs: [
                    { key: 'text', label: 'Paste Text to Analyze', type: 'textarea', placeholder: 'Paste the content here...' }
                ],
                promptBuilder: (d) => `Analyze the following text and determine the likelihood of it being AI-generated. Highlight patterns, repetition, or lack of human nuance. Give a probability score (0-100%) and an explanation.\n\nText: "${d.text}"`
            },
            {
                id: 'summarizer',
                name: 'Smart Summarizer',
                icon: <ChipIcon className="w-5 h-5" />,
                description: 'Condense long articles or text into key bullet points.',
                inputs: [
                    { key: 'text', label: 'Text to Summarize', type: 'textarea', placeholder: 'Paste long text here...' },
                    { key: 'length', label: 'Summary Length', type: 'select', options: ['Short (Bullet Points)', 'Medium (Paragraph)', 'Detailed'] }
                ],
                promptBuilder: (d) => `Summarize the following text. Format: ${d.length}.\n\nText: "${d.text}"`
            },
            {
                id: 'code-gen',
                name: 'Code Generator',
                icon: <ChipIcon className="w-5 h-5" />,
                description: 'Generate code snippets for specific tasks.',
                inputs: [
                    { key: 'language', label: 'Programming Language', type: 'text', placeholder: 'e.g., Python, React, SQL' },
                    { key: 'task', label: 'Task Description', type: 'textarea', placeholder: 'Describe what the code should do...' }
                ],
                promptBuilder: (d) => `Write clean, commented ${d.language} code to accomplish the following task: ${d.task}. Explain how it works briefly.`
            }
        ]
    },
    {
        name: 'Creative',
        icon: <PaletteIcon className="w-5 h-5 text-pink-400" />,
        color: 'border-pink-500/30 bg-pink-500/10',
        tools: [
            {
                id: 'graphic-design',
                name: 'Graphic Design Idea',
                icon: <PaletteIcon className="w-5 h-5" />,
                description: 'Generate concepts for posters, social media, or branding.',
                inputs: [
                    { key: 'type', label: 'Design Type', type: 'select', options: ['Logo', 'Social Media Post', 'Poster', 'Website Hero'] },
                    { key: 'brand', label: 'Brand/Subject Name', type: 'text', placeholder: 'e.g., EcoCoffee' },
                    { key: 'vibe', label: 'Vibe/Style', type: 'text', placeholder: 'e.g., Minimalist, Retro, Cyberpunk' }
                ],
                promptBuilder: (d) => `Act as a senior graphic designer. Provide 3 unique and creative concepts for a ${d.type} for "${d.brand}". The style should be ${d.vibe}. Describe color palettes, typography, and layout for each.`
            },
            {
                id: 'image-prompt',
                name: 'Image Gen Prompt',
                icon: <WandIcon className="w-5 h-5" />,
                description: 'Create detailed prompts for AI image generators (Midjourney, Dall-E).',
                inputs: [
                    { key: 'subject', label: 'Main Subject', type: 'text', placeholder: 'e.g., A futuristic cat' },
                    { key: 'style', label: 'Art Style', type: 'text', placeholder: 'e.g., Cinematic, Oil Painting, Anime' },
                    { key: 'lighting', label: 'Lighting', type: 'select', options: ['Golden Hour', 'Neon', 'Studio', 'Natural', 'Dark/Moody'] }
                ],
                promptBuilder: (d) => `Write a highly detailed text-to-image prompt for an AI generator. Subject: ${d.subject}. Style: ${d.style}. Lighting: ${d.lighting}. Include keywords for high resolution, camera angles, and texture.`
            }
        ]
    },
    {
        name: 'Marketing',
        icon: <MegaphoneIcon className="w-5 h-5 text-orange-400" />,
        color: 'border-orange-500/30 bg-orange-500/10',
        tools: [
            {
                id: 'copywriting',
                name: 'Ad Copywriter',
                icon: <MegaphoneIcon className="w-5 h-5" />,
                description: 'Write high-converting headlines and body copy.',
                inputs: [
                    { key: 'product', label: 'Product/Service', type: 'text', placeholder: 'e.g., Smart Water Bottle' },
                    { key: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Athletes, Hikers' },
                    { key: 'platform', label: 'Platform', type: 'select', options: ['Facebook/Instagram', 'Google Ads', 'LinkedIn', 'Twitter'] }
                ],
                promptBuilder: (d) => `Write 3 variations of ad copy for ${d.platform}. Product: ${d.product}. Target Audience: ${d.audience}. Use persuasive psychological triggers and strong calls to action.`
            },
            {
                id: 'seo-optimizer',
                name: 'SEO Keyword Planner',
                icon: <MegaphoneIcon className="w-5 h-5" />,
                description: 'Generate keywords and content strategy.',
                inputs: [
                    { key: 'niche', label: 'Niche/Topic', type: 'text', placeholder: 'e.g., Vegan Banking' },
                    { key: 'region', label: 'Target Region', type: 'text', placeholder: 'e.g., USA, Global' }
                ],
                promptBuilder: (d) => `Act as an SEO expert. Provide a list of 10 high-potential keywords (mix of short-tail and long-tail) for the niche "${d.niche}" targeting ${d.region}. Also suggest 3 blog post titles based on these keywords.`
            }
        ]
    },
    {
        name: 'Video & Audio',
        icon: <VideoIcon className="w-5 h-5 text-red-400" />,
        color: 'border-red-500/30 bg-red-500/10',
        tools: [
            {
                id: 'video-script',
                name: 'YouTube/Reels Script',
                icon: <VideoIcon className="w-5 h-5" />,
                description: 'Create engaging scripts for short or long-form video.',
                inputs: [
                    { key: 'topic', label: 'Video Topic', type: 'text', placeholder: 'e.g., How to bake sourdough' },
                    { key: 'format', label: 'Format', type: 'select', options: ['YouTube Short / Reel (60s)', 'YouTube Long Form', 'TikTok Trend'] },
                    { key: 'tone', label: 'Tone', type: 'select', options: ['Funny', 'Educational', 'Dramatic', 'Fast-paced'] }
                ],
                promptBuilder: (d) => `Write a full script for a ${d.format} about "${d.topic}". Tone: ${d.tone}. Include visual cues (camera angles, B-roll suggestions) and dialogue.`
            }
        ]
    },
    {
        name: 'Business',
        icon: <BriefcaseIcon className="w-5 h-5 text-green-400" />,
        color: 'border-green-500/30 bg-green-500/10',
        tools: [
            {
                id: 'business-plan',
                name: 'One-Page Business Plan',
                icon: <BriefcaseIcon className="w-5 h-5" />,
                description: 'Draft a lean business model canvas.',
                inputs: [
                    { key: 'business', label: 'Business Idea', type: 'textarea', placeholder: 'Describe your business idea...' }
                ],
                promptBuilder: (d) => `Create a lean one-page business plan for: ${d.business}. Include: Value Proposition, Customer Segments, Revenue Streams, Cost Structure, and Key Activities.`
            },
            {
                id: 'email-pro',
                name: 'Professional Email',
                icon: <BriefcaseIcon className="w-5 h-5" />,
                description: 'Draft cold emails, follow-ups, or formal requests.',
                inputs: [
                    { key: 'recipient', label: 'Recipient Name/Role', type: 'text', placeholder: 'e.g., Hiring Manager' },
                    { key: 'purpose', label: 'Purpose of Email', type: 'textarea', placeholder: 'e.g., Asking for a meeting about...' }
                ],
                promptBuilder: (d) => `Write a professional, polite, and effective email to ${d.recipient}. Purpose: ${d.purpose}. Keep it concise and professional.`
            }
        ]
    },
    {
        name: 'Education',
        icon: <BookIcon className="w-5 h-5 text-purple-400" />,
        color: 'border-purple-500/30 bg-purple-500/10',
        tools: [
            {
                id: 'tutor',
                name: 'Topic Explainer',
                icon: <BookIcon className="w-5 h-5" />,
                description: 'Explain complex concepts simply.',
                inputs: [
                    { key: 'topic', label: 'Concept to Explain', type: 'text', placeholder: 'e.g., Quantum Entanglement' },
                    { key: 'level', label: 'Audience Level', type: 'select', options: ['5-Year Old', 'High School Student', 'College Student', 'Professional'] }
                ],
                promptBuilder: (d) => `Explain "${d.topic}" to a ${d.level}. Use analogies and simple language where appropriate.`
            }
        ]
    }
];

const ToolsScreen: React.FC<ToolsScreenProps> = ({ navigateTo }) => {
    const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copyStatus, setCopyStatus] = useState('');
    
    // Auto-scroll to result when generated
    const resultRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (result && !isLoading && resultRef.current) {
            resultRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [result, isLoading]);

    const handleToolSelect = (tool: ToolDefinition) => {
        setSelectedTool(tool);
        setFormValues({});
        setResult('');
        setCopyStatus('');
    };

    const handleInputChange = (key: string, value: string) => {
        setFormValues(prev => ({ ...prev, [key]: value }));
    };

    const handleGenerate = async () => {
        if (!selectedTool) return;
        
        setIsLoading(true);
        setResult('');
        
        const prompt = selectedTool.promptBuilder(formValues);
        
        try {
            await getChatResponseStream(
                prompt, 
                [], 
                (chunk) => setResult(prev => prev + chunk)
            );
        } catch (error) {
            setResult('Error generating content. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus(''), 2000);
    };

    const handleBack = () => {
        if (selectedTool) {
            setSelectedTool(null);
            setResult('');
        } else {
            navigateTo(Screen.Home);
        }
    };

    // --- Render Functions ---

    const renderToolList = () => (
        <div className="space-y-6 pb-20">
             {/* Simple Banner */}
             <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-xl font-bold mb-2 text-white">Explore AI Tools</h2>
                    <p className="text-gray-300 text-sm max-w-xs">Select a tool below to instantly generate content, code, strategies, and more.</p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4">
                    <WandIcon className="w-32 h-32 text-purple-400" />
                </div>
            </div>

            {TOOLS_DATA.map((category) => (
                <div key={category.name}>
                    <div className="flex items-center gap-2 mb-3 px-1">
                        {category.icon}
                        <h3 className="font-semibold text-lg text-white">{category.name}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {category.tools.map((tool) => (
                            <button 
                                key={tool.id}
                                onClick={() => handleToolSelect(tool)}
                                className={`p-4 rounded-xl text-left border ${category.color} hover:bg-opacity-20 bg-[#1a1a3a] transition-all hover:scale-[1.01] flex items-center gap-4 group relative overflow-hidden`}
                            >
                                <div className={`p-2 rounded-full bg-black/20 group-hover:bg-black/40 transition-colors`}>
                                    {tool.icon}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white">{tool.name}</h4>
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{tool.description}</p>
                                </div>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                    <SendIcon className="w-4 h-4 text-gray-400 -rotate-45" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderActiveTool = () => {
        if (!selectedTool) return null;

        return (
            <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-grow overflow-y-auto pb-20 space-y-6">
                    {/* Tool Header */}
                    <div className="bg-[#1a1a3a] p-6 rounded-2xl border border-white/10 text-center">
                        <div className="w-12 h-12 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
                            {selectedTool.icon}
                        </div>
                        <h2 className="text-2xl font-bold">{selectedTool.name}</h2>
                        <p className="text-gray-400 text-sm mt-2">{selectedTool.description}</p>
                    </div>

                    {/* Input Form */}
                    <div className="space-y-4 bg-[#1a1a3a]/50 p-4 rounded-xl border border-white/5">
                        {selectedTool.inputs.map(input => (
                            <div key={input.key}>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">
                                    {input.label}
                                </label>
                                {input.type === 'textarea' ? (
                                    <textarea
                                        className="w-full bg-[#101022] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors h-32 resize-none"
                                        placeholder={input.placeholder}
                                        value={formValues[input.key] || ''}
                                        onChange={(e) => handleInputChange(input.key, e.target.value)}
                                    />
                                ) : input.type === 'select' ? (
                                    <div className="relative">
                                        <select
                                            className="w-full bg-[#101022] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 appearance-none"
                                            value={formValues[input.key] || input.options?.[0] || ''}
                                            onChange={(e) => handleInputChange(input.key, e.target.value)}
                                        >
                                            {input.options?.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full bg-[#101022] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        placeholder={input.placeholder}
                                        value={formValues[input.key] || ''}
                                        onChange={(e) => handleInputChange(input.key, e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                        
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl font-bold text-white shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <WandIcon className="w-5 h-5" />
                                    Generate Result
                                </>
                            )}
                        </button>
                    </div>

                    {/* Result Area */}
                    {(result || isLoading) && (
                        <div ref={resultRef} className="bg-[#1a1a3a] rounded-xl border border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-black/20 p-3 border-b border-white/5 flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                    <CheckCircleIcon className="w-4 h-4 text-green-400" /> 
                                    Result
                                </span>
                                <div className="flex gap-1">
                                    <button onClick={() => playTextToSpeech(result)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Listen">
                                        <PlayIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={handleCopy} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white flex items-center gap-1" title="Copy">
                                        {copyStatus ? <span className="text-xs text-green-400">{copyStatus}</span> : <CopyIcon className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 min-h-[100px] text-gray-200 whitespace-pre-wrap leading-relaxed text-sm">
                                {result}
                                {isLoading && <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse ml-1 align-middle"></span>}
                            </div>
                             {!isLoading && (
                                <div className="p-3 bg-black/10 border-t border-white/5 flex justify-end">
                                     <button onClick={handleGenerate} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white">
                                        <ReloadIcon className="w-3 h-3" /> Regenerate
                                     </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full text-white bg-[#101022]">
            <header className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-[#1a1a3a] z-10">
                <div className="flex items-center">
                    <button onClick={handleBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                        <BackArrowIcon className="w-6 h-6 text-gray-300" />
                    </button>
                    <h1 className="text-lg font-bold ml-2">{selectedTool ? selectedTool.name : 'Explore AI Tools'}</h1>
                </div>
            </header>

            <main className="flex-grow overflow-y-auto p-4 scroll-smooth">
                {selectedTool ? renderActiveTool() : renderToolList()}
            </main>
        </div>
    );
};

export default ToolsScreen;
