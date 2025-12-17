
import React, { useState } from 'react';
import { Screen } from '../types';
import { LogoIcon, EyeIcon, EyeOffIcon } from './icons';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface RegisterScreenProps {
  navigateTo: (screen: Screen) => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigateTo }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update user profile in Firebase Auth
            await updateProfile(user, { displayName: name });
            
            // Create user document in Firestore
            // Note: If this fails (e.g. permission denied), the auth user is still created.
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: user.email,
                profileImage: user.photoURL,
                authProvider: 'email',
                plan: 'free',
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
            });

            // onAuthStateChanged in App.tsx will handle navigation
        } catch (err: any) {
            console.error("Registration Error:", err);
            let friendlyMessage = 'An unexpected error occurred. Please try again.';
            
            if (err.code) {
                switch (err.code) {
                    case 'auth/email-already-in-use':
                        friendlyMessage = 'This email address is already registered. Please sign in.';
                        break;
                    case 'auth/invalid-email':
                        friendlyMessage = 'The email address you entered is not valid.';
                        break;
                    case 'auth/weak-password':
                        friendlyMessage = 'Your password is too weak. It must be at least 6 characters long.';
                        break;
                    case 'auth/network-request-failed':
                        friendlyMessage = 'Network error. Please check your connection and try again.';
                        break;
                    case 'auth/operation-not-allowed':
                        friendlyMessage = 'Email/Password sign-in is disabled in Firebase Console.';
                        break;
                    case 'auth/invalid-api-key':
                    case 'auth/invalid-project-id':
                        friendlyMessage = 'Invalid Firebase Configuration (API Key/Project ID).';
                        break;
                    case 'permission-denied':
                         friendlyMessage = 'Database permission denied. Check Firestore rules.';
                         break;
                    default:
                         // Display actual error message for easier debugging
                        friendlyMessage = `Error: ${err.message || err.code}`;
                }
            } else if (err.message) {
                 friendlyMessage = `Error: ${err.message}`;
            }
            
            setError(friendlyMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFocus = () => {
        setError('');
    }

  return (
    <div className="flex flex-col h-full text-white p-6 justify-center">
      <div className="text-center">
        <LogoIcon className="w-16 h-16 text-purple-400 mx-auto" />
        <h1 className="text-3xl font-bold mt-4">Create Account</h1>
        <p className="text-gray-400 mt-2">Join COMIT BUILDER today!</p>
      </div>

      <form onSubmit={handleRegister} className="mt-8 space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={handleFocus}
          className="w-full p-3 bg-[#2a2a4a] rounded-lg border border-gray-600 focus:ring-purple-500 focus:border-purple-500"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={handleFocus}
          className="w-full p-3 bg-[#2a2a4a] rounded-lg border border-gray-600 focus:ring-purple-500 focus:border-purple-500"
          required
        />
        <div className="relative">
            <input
              type={isPasswordVisible ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={handleFocus}
              className="w-full p-3 bg-[#2a2a4a] rounded-lg border border-gray-600 focus:ring-purple-500 focus:border-purple-500 pr-10"
              required
            />
            <button
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            >
                {isPasswordVisible ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
        </div>
         <div className="relative">
             <input
              type={isConfirmPasswordVisible ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={handleFocus}
              className="w-full p-3 bg-[#2a2a4a] rounded-lg border border-gray-600 focus:ring-purple-500 focus:border-purple-500 pr-10"
              required
            />
            <button
                type="button"
                onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                aria-label={isConfirmPasswordVisible ? "Hide password" : "Show password"}
            >
                {isConfirmPasswordVisible ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
        </div>

        {error && <p className="text-red-400 text-sm text-center bg-red-400/10 p-2 rounded">{error}</p>}

        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 font-semibold disabled:bg-gray-600 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      
      <p className="text-center text-gray-400 mt-8">
        Already have an account?{' '}
        <button onClick={() => navigateTo(Screen.Login)} className="font-semibold text-purple-400 hover:underline">
          Sign In
        </button>
      </p>
    </div>
  );
};

export default RegisterScreen;
