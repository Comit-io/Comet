
import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { BackArrowIcon, LogoutIcon } from './icons';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface ProfileScreenProps {
  navigateTo: (screen: Screen) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigateTo }) => {
  const user = auth.currentUser;
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');

  useEffect(() => {
    // Fetch latest data from Firestore to ensure sync
    const fetchUserData = async () => {
        if (!user) return;
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.name) setDisplayName(data.name);
                if (data.profileImage) setPhotoURL(data.profileImage);
            }
        } catch (e) {
            console.error("Error loading profile:", e);
        }
    };
    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigateTo(Screen.Home); // Navigate to Home after logout (Guest mode)
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (!user) {
      return (
        <div className="flex flex-col h-full text-white bg-[#101022]">
            <header className="flex justify-between items-center p-4 border-b border-white/10 shrink-0 bg-[#1a1a3a]">
                <button onClick={() => navigateTo(Screen.Home)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                    <BackArrowIcon className="w-6 h-6 text-gray-300" />
                </button>
                <span className="font-semibold text-lg">My Profile</span>
                <div className="w-6"></div>
            </header>
            <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-4xl font-bold mb-6">G</div>
                <h2 className="text-2xl font-bold">Guest User</h2>
                <p className="text-gray-400 mt-2 mb-8">You are using COMET in guest mode. Login to save your preferences and unlock premium features.</p>
                <button 
                    onClick={() => navigateTo(Screen.Login)}
                    className="w-full max-w-xs py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-white shadow-lg transition-colors"
                >
                    Sign In
                </button>
            </main>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full text-white bg-[#101022]">
      <header className="flex justify-between items-center p-4 border-b border-white/10 shrink-0 bg-[#1a1a3a]">
        <button onClick={() => navigateTo(Screen.Home)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <BackArrowIcon className="w-6 h-6 text-gray-300" />
        </button>
        <span className="font-semibold text-lg">My Profile</span>
        <div className="w-6"></div> {/* Spacer */}
      </header>

      <main className="flex-grow p-6 overflow-y-auto">
        <div className="flex flex-col items-center">
            {/* Profile Picture Section (Read Only) */}
            <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-[#2a2a4a] shadow-2xl overflow-hidden bg-gray-800 relative">
                    {photoURL ? (
                        <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-gradient-to-br from-purple-500 to-blue-500">
                            {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Info (Read Only) */}
            <div className="w-full max-w-xs mt-8 space-y-6">
                
                {/* Name Field */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 ml-1">Display Name</label>
                    <div className="w-full p-3 rounded-xl bg-[#1a1a3a] border border-white/5 text-gray-200 font-medium">
                        {displayName || 'User'}
                    </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2 opacity-80">
                    <label className="text-sm font-medium text-gray-400 ml-1">Email</label>
                    <div className="w-full p-3 rounded-xl bg-[#1a1a3a] border border-white/5 text-gray-300">
                        {user.email}
                    </div>
                </div>
            </div>
        </div>
      </main>

      <footer className="p-6 shrink-0">
        <button 
            onClick={handleLogout}
            className="w-full py-3.5 rounded-xl bg-[#2a2a4a] hover:bg-red-500/10 hover:text-red-400 border border-white/5 font-semibold text-gray-300 transition-colors flex items-center justify-center gap-2"
        >
            <LogoutIcon className="w-5 h-5" />
            Logout
        </button>
        <p className="text-center text-xs text-gray-600 mt-4">
            COMET AI • v1.0.2
        </p>
      </footer>
    </div>
  );
};

export default ProfileScreen;
