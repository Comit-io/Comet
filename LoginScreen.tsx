
import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { LogoIcon, GoogleIcon, EyeIcon, EyeOffIcon } from './icons';
import { auth, googleProvider } from '../services/firebase';
import { signInWithEmailAndPassword, signInWithRedirect } from 'firebase/auth';


interface LoginScreenProps {
  navigateTo: (screen: Screen) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigateTo }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // FIX: Check for and display any Google Sign-In errors passed via sessionStorage after a redirect.
    useEffect(() => {
        const googleError = sessionStorage.getItem('googleSignInError');
        if (googleError) {
            setError(googleError);
            sessionStorage.removeItem('googleSignInError');
        }
    }, []);

    const getFriendlyErrorMessage = (err: any) => {
        // Removed console.error to suppress error noise
        if (err.code) {
            switch (err.code) {
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    return 'Invalid email or password. Please try again.';
                case 'auth/invalid-email':
                    return 'The email address you entered is not valid.';
                case 'auth/too-many-requests':
                     return 'Access disabled due to many failed attempts. Reset password or try later.';
                case 'auth/network-request-failed':
                    return 'Network error. Please check your connection and try again.';
                case 'auth/operation-not-allowed':
                    return 'Sign-in method is disabled in Firebase Console.';
                case 'auth/invalid-api-key':
                case 'auth/invalid-project-id':
                    return 'Invalid Firebase Configuration. Check API Key in services/firebase.ts';
                case 'auth/unauthorized-domain':
                    return 'Domain not authorized. Add it in Firebase Console -> Auth -> Settings.';
                case 'auth/popup-blocked':
                    return 'Sign-in popup was blocked by the browser.';
                case 'auth/popup-closed-by-user':
                    return 'Sign-in was canceled.';
                default:
                    return `Error: ${err.message || err.code}`;
            }
        }
        return err.message || 'An unexpected error occurred.';
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged in App.tsx will handle navigation
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err));
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setIsLoading(true);
        try {
            // Use signInWithRedirect for a more robust auth flow, especially on mobile/webviews.
            // The result and any errors are handled centrally in App.tsx after the redirect.
            await signInWithRedirect(auth, googleProvider);
        } catch (err: any) {
             setError(getFriendlyErrorMessage(err));
             setIsLoading(false);
        }
    }
    
    const handleFocus = () => {
        setError('');
    }

  return (
    <div className="flex flex-col h-full text-white p-6 justify-center">
      <div className="text-center">
        <LogoIcon className="w-16 h-16 text-purple-400 mx-auto" />
        <h1 className="text-3xl font-bold mt-4">Welcome to COMET</h1>
        <p className="text-gray-400 mt-2">Sign in to access your AI Assistant</p>
      </div>

       {/* Primary Action: Google Sign-In */}
       <div className="mt-8">
            <button
                onClick={handleGoogleLogin}
                className="w-full py-3.5 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-3 disabled:opacity-70 shadow-lg hover:bg-gray-100 transition-colors"
                disabled={isLoading}
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-black rounded-full animate-spin"></div>
                ) : (
                    <GoogleIcon className="w-5 h-5" />
                )}
                Continue with Google
            </button>
            <p className="text-center text-xs text-gray-500 mt-3">
                Secure & recommended for instant access
            </p>
       </div>

      <div className="flex items-center my-8">
          <hr className="flex-grow border-gray-700"/>
          <span className="mx-4 text-gray-500 text-sm">OR LOGIN WITH EMAIL</span>
          <hr className="flex-grow border-gray-700"/>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={handleFocus}
          className="w-full p-3 bg-[#2a2a4a] rounded-lg border border-gray-600 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500"
          required
        />
        <div className="relative">
            <input
              type={isPasswordVisible ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={handleFocus}
              className="w-full p-3 bg-[#2a2a4a] rounded-lg border border-gray-600 focus:ring-purple-500 focus:border-purple-500 pr-10 placeholder-gray-500"
              required
            />
            <button
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            >
                {isPasswordVisible ? (
                    <EyeOffIcon className="w-5 h-5" />
                ) : (
                    <EyeIcon className="w-5 h-5" />
                )}
            </button>
        </div>
        {error && <p className="text-red-400 text-sm text-center bg-red-400/10 p-2 rounded">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/50 hover:bg-purple-600 hover:text-white font-semibold disabled:opacity-50 transition-all"
          disabled={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Login with Email'}
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;
