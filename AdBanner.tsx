
import React, { useEffect, useState } from 'react';

const TEST_BANNER_ID = "ca-app-pub-3940256099942544/6300978111"; // Google's official test ID

const AdBanner: React.FC = () => {
  const [adConfig, setAdConfig] = useState({ bannerId: '', testMode: true });

  useEffect(() => {
      const storedSettings = localStorage.getItem('comet_admin_settings');
      if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          if (parsed.adMob) {
              setAdConfig({
                  bannerId: parsed.adMob.bannerId,
                  testMode: parsed.adMob.testMode
              });
          }
      }
  }, []);

  const displayId = adConfig.testMode ? TEST_BANNER_ID : (adConfig.bannerId || 'Missing Ad Unit ID');

  return (
    <div className="w-full bg-[#1a1a2e] border-t border-white/10 p-2 flex items-center justify-center">
        {/* AdMob Container Simulation */}
        <div className="w-[320px] h-[50px] bg-white relative overflow-hidden flex items-center justify-center border border-gray-300 shadow-sm cursor-pointer select-none">
            
            {/* Ad Badge */}
            <div className="absolute top-0 left-0 bg-[#f0c14b] text-black text-[9px] font-bold px-1 py-0.5 z-10 border-br rounded-br">
                Ad
            </div>

            {/* Content Simulation */}
            <div className="flex items-center gap-2 w-full px-2">
                <div className="w-8 h-8 bg-blue-500 flex items-center justify-center text-white font-bold rounded-sm shrink-0">
                    G
                </div>
                <div className="flex-grow overflow-hidden">
                    <p className="text-[10px] text-gray-800 font-bold truncate">Google AdMob {adConfig.testMode ? '(Test Mode)' : ''}</p>
                    <p className="text-[8px] text-gray-500 truncate font-mono">
                        {adConfig.testMode ? 'Test Ad: Nice job!' : `ID: ${displayId.substring(0, 15)}...`}
                    </p>
                </div>
                <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider border border-blue-600 px-2 py-0.5 rounded-sm">
                    Install
                </div>
            </div>

            {/* Info Icon */}
            <div className="absolute top-0 right-0 bg-white border-l border-b border-gray-300 w-3 h-3 flex items-center justify-center">
                <span className="text-[8px] text-gray-400">i</span>
            </div>
        </div>
    </div>
  );
};

export default AdBanner;
