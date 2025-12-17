
import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { BackArrowIcon, CopyIcon, SendIcon, WandIcon } from './icons';

interface PromptMakerScreenProps {
  navigateTo: (screen: Screen, initialPrompt?: string) => void;
}

const templates = {
    'Marketing': [
        {
            name: 'Ad Copy',
            description: 'Generate compelling ad copy for a product.',
            fields: ['Product Name', 'Target Audience', 'Key Benefit'],
            template: (f: Record<string, string>) => `Write three versions of a short, catchy ad copy for a product named "${f['Product Name']}". The target audience is ${f['Target Audience']}. Emphasize the key benefit: ${f['Key Benefit']}. The tone should be persuasive and exciting.`
        },
        {
            name: 'Email Campaign',
            description: 'Craft a subject line and body for an email campaign.',
            fields: ['Campaign Goal', 'Product/Service', 'Call to Action'],
            template: (f: Record<string, string>) => `Create a marketing email for a new campaign. The main goal is to ${f['Campaign Goal']}. The email should promote our ${f['Product/Service']}. It needs a compelling subject line and a clear call to action: "${f['Call to Action']}".`
        }
    ],
    'Creative Writing': [
        {
            name: 'Story Idea',
            description: 'Get a unique story plot based on your inputs.',
            fields: ['Genre', 'Main Character Archetype', 'Setting'],
            template: (f: Record<string, string>) => `Generate a short story plot idea. The genre is ${f['Genre']}. The main character is a ${f['Main Character Archetype']}. The story takes place in ${f['Setting']}. Include a surprising twist.`
        },
        {
            name: 'Poem Generator',
            description: 'Create a poem about a specific theme.',
            fields: ['Theme', 'Mood', 'Poetic Form (e.g., Haiku, Sonnet)'],
            template: (f: Record<string, string>) => `Write a poem about the theme of "${f['Theme']}". The mood should be ${f['Mood']}. Please write it in the form of a ${f['Poetic Form (e.g., Haiku, Sonnet)']}.`
        }
    ],
    'Productivity': [
        {
            name: 'Meeting Agenda',
            description: 'Structure a professional meeting agenda.',
            fields: ['Meeting Topic', 'Attendees (roles)', 'Key Objectives (comma-separated)'],
            template: (f: Record<string, string>) => `Create a detailed meeting agenda for a meeting about "${f['Meeting Topic']}". The attendees are: ${f['Attendees (roles)']}. The key objectives for this meeting are: ${f['Key Objectives (comma-separated)'].split(',').map(s => `\n- ${s.trim()}`).join('')}.`
        }
    ]
};

type Category = keyof typeof templates;

const PromptMakerScreen: React.FC<PromptMakerScreenProps> = ({ navigateTo }) => {
    const [selectedCategory, setSelectedCategory] = useState<Category>('Marketing');
    const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [copySuccess, setCopySuccess] = useState('');

    const activeTemplate = templates[selectedCategory][selectedTemplateIndex];

    useEffect(() => {
        setFieldValues({});
        setGeneratedPrompt('');
    }, [selectedCategory, selectedTemplateIndex]);

    const handleFieldChange = (fieldName: string, value: string) => {
        setFieldValues(prev => ({ ...prev, [fieldName]: value }));
    };

    const handleGeneratePrompt = () => {
        const prompt = activeTemplate.template(fieldValues);
        setGeneratedPrompt(prompt);
    };

    const handleCopy = () => {
        if (generatedPrompt) {
          navigator.clipboard.writeText(generatedPrompt).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
          }, () => {
            setCopySuccess('Failed');
          });
        }
    };

    const handleUsePrompt = () => {
        if (generatedPrompt) {
            navigateTo(Screen.Chat, generatedPrompt);
        }
    };


    return (
        <div className="flex flex-col h-full text-white bg-[#21213D]/50">
            <header className="flex justify-between items-center p-4 border-b border-white/10 shrink-0">
                <button onClick={() => navigateTo(Screen.Home)} className="p-2 -ml-2">
                    <BackArrowIcon className="w-6 h-6 text-gray-300" />
                </button>
                <span className="font-semibold">AI Prompt Studio</span>
                <div className="w-6"></div>
            </header>

            <main className="flex-grow p-4 overflow-y-auto space-y-6">
                <div>
                    <label className="text-sm font-medium text-gray-300">Category</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value as Category);
                            setSelectedTemplateIndex(0);
                        }}
                        className="w-full mt-1 p-2 bg-[#37375a] rounded-lg border border-gray-600 focus:ring-purple-500 focus:border-purple-500"
                    >
                        {Object.keys(templates).map(cat => <option key={cat}>{cat}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-300">Template</label>
                     <div className="flex gap-2 mt-1 overflow-x-auto pb-2">
                        {templates[selectedCategory].map((template, index) => (
                             <button 
                                key={template.name}
                                onClick={() => setSelectedTemplateIndex(index)}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-full shrink-0 ${index === selectedTemplateIndex ? 'bg-purple-600 text-white' : 'bg-[#37375a] text-gray-300'}`}
                             >
                                {template.name}
                             </button>
                        ))}
                    </div>
                </div>

                <div className="bg-[#37375a]/50 p-4 rounded-lg space-y-4">
                    <p className="text-sm text-gray-400">{activeTemplate.description}</p>
                    {activeTemplate.fields.map(field => (
                        <div key={field}>
                             <label className="text-sm font-medium text-gray-300">{field}</label>
                             <input 
                                type="text"
                                value={fieldValues[field] || ''}
                                onChange={(e) => handleFieldChange(field, e.target.value)}
                                placeholder={`Enter ${field.toLowerCase()}...`}
                                className="w-full mt-1 p-2 bg-[#2a2a4a] rounded-lg border border-gray-600 focus:ring-purple-500 focus:border-purple-500"
                             />
                        </div>
                    ))}
                    <button onClick={handleGeneratePrompt} className="w-full py-2 flex items-center justify-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 font-semibold">
                        <WandIcon className="w-4 h-4" />
                        Generate Prompt
                    </button>
                </div>

                {generatedPrompt && (
                    <div>
                        <h3 className="text-lg font-semibold">Generated Prompt</h3>
                        <div className="mt-2 p-4 bg-[#2a2a4a] rounded-lg text-sm text-gray-300 whitespace-pre-wrap">
                            {generatedPrompt}
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button onClick={handleCopy} className="flex-1 py-2 flex items-center justify-center gap-2 rounded-lg bg-gray-600 hover:bg-gray-700 font-semibold">
                                <CopyIcon className="w-4 h-4"/> {copySuccess || 'Copy'}
                            </button>
                             <button onClick={handleUsePrompt} className="flex-1 py-2 flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold">
                                Use in Chat <SendIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default PromptMakerScreen;
