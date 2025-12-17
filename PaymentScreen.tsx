
import React, { useState } from 'react';
import { Screen } from '../types';
import { BackArrowIcon, CopyIcon, HeartIcon } from './icons';

interface DonationScreenProps {
  navigateTo: (screen: Screen) => void;
}

type DonationStep = 'info' | 'payment' | 'thankyou';

const UPI_ID = 'rudra.manhar@fam';
const PAYEE_NAME = 'Rudra Manhar';

const DonationScreen: React.FC<DonationScreenProps> = ({ navigateTo }) => {
    const [step, setStep] = useState<DonationStep>('info');
    const [copySuccess, setCopySuccess] = useState('');

    const handleCopyUpiId = () => {
        navigator.clipboard.writeText(UPI_ID).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Failed');
        });
    };
    
    const getQrCodeUrl = () => {
        const url = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&cu=INR`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
    };

    const renderContent = () => {
        switch (step) {
            case 'info':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center flex flex-col items-center justify-center h-full">
                         <div className="inline-block p-4 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 mb-2 animate-bounce">
                            <HeartIcon className="w-12 h-12 text-pink-400" />
                        </div>
                        
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-200 to-purple-400">
                                Support COMET AI 💙
                            </h2>
                            <p className="text-gray-300 max-w-xs mx-auto text-sm leading-relaxed">
                                COMET AI is 100% free for everyone. No premiums, no hidden fees. 
                                <br/><br/>
                                If you enjoy using it, a small donation helps cover server costs and keeps us running!
                            </p>
                        </div>

                        <button 
                            onClick={() => setStep('payment')} 
                            className="w-full max-w-xs py-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 font-bold text-white shadow-lg shadow-purple-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            Make a Contribution 💖
                        </button>
                    </div>
                );

            case 'payment':
                return (
                    <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-w-sm mx-auto w-full">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Scan to Donate</h2>
                            <p className="text-gray-400 text-sm">Use any UPI app (GPay, PhonePe, Paytm)</p>
                        </div>
                        
                        <div className="p-4 bg-white rounded-2xl inline-block mx-auto shadow-xl shadow-white/5 relative">
                             <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-black"></div>
                             <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-black"></div>
                             <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-black"></div>
                             <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-black"></div>
                            <img src={getQrCodeUrl()} alt="UPI QR Code" className="w-48 h-48"/>
                        </div>
                        
                        <div className="bg-[#2a2a4a] p-4 rounded-xl flex items-center justify-between border border-white/10">
                            <div className="text-left overflow-hidden">
                                <p className="text-[10px] text-gray-400 mb-0.5">UPI ID</p>
                                <p className="font-mono text-base text-pink-300 font-semibold truncate">{UPI_ID}</p>
                            </div>
                            <button onClick={handleCopyUpiId} className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors shrink-0">
                                <CopyIcon className="w-4 h-4"/> {copySuccess || 'Copy'}
                            </button>
                        </div>

                        <div className="space-y-3 pt-2">
                            <button onClick={() => setStep('thankyou')} className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 font-semibold text-white transition-colors shadow-lg shadow-green-900/20">
                                I Have Donated
                            </button>
                            
                            <button onClick={() => setStep('info')} className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors">
                                Back
                            </button>
                        </div>
                    </div>
                );
            
            case 'thankyou':
                 return (
                    <div className="flex flex-col items-center justify-center text-center h-full py-8 animate-in zoom-in duration-500">
                         <div className="w-24 h-24 bg-pink-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(236,72,153,0.3)] animate-pulse">
                            <HeartIcon className="w-12 h-12 text-pink-400"/>
                         </div>
                         <h2 className="text-3xl font-bold text-white">Thank You! 🙏</h2>
                         <p className="text-pink-200 font-medium mt-2 text-lg">Your support means the world.</p>
                         <p className="text-gray-400 mt-6 text-sm max-w-xs leading-relaxed">
                            You are helping us keep COMET AI free and unlimited for everyone. Happy creating!
                         </p>
                         <button onClick={() => navigateTo(Screen.Home)} className="w-full max-w-xs mt-10 py-4 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors shadow-xl">
                            Back to Home
                        </button>
                    </div>
                );

            default: return null;
        }
    }


    return (
        <div className="flex flex-col h-full text-white bg-[#0f0f1a]">
            <header className="flex justify-between items-center p-4 border-b border-white/5 shrink-0">
                <button 
                    onClick={() => step === 'info' ? navigateTo(Screen.Home) : setStep('info')} 
                    className="p-2 -ml-2 hover:bg-white/5 rounded-full"
                >
                    <BackArrowIcon className="w-6 h-6 text-gray-300" />
                </button>
                <span className="font-semibold text-gray-200 tracking-wide uppercase text-xs">Donation</span>
                <div className="w-6 h-6"></div>
            </header>
            <main className="flex-grow p-6 overflow-y-auto flex flex-col justify-center">
                {renderContent()}
            </main>
        </div>
    );
};

export default DonationScreen;
