const fs = require('fs');

let code = fs.readFileSync('src/pages/Login.jsx', 'utf-8');

// Add handleGuestLogin
const handleGuestTarget = `const handleGoogleLogin = async () => {`;
const handleGuestReplacement = `const handleGuestLogin = () => {
    // Zero-Crash Policy: Guest Mode uses Local IndexedDB only
    toast.success('Entering Workspace in Offline/Guest Mode');
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleGoogleLogin = async () => {`;
code = code.replace(handleGuestTarget, handleGuestReplacement);

// Add the Guest Button in UI
const guestBtnTarget = `          <motion.button 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.8, duration: 0.5 }} 
            type="button" 
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[22px] border border-theme-border-soft bg-theme-surface text-sm font-bold text-theme-muted transition-all hover:bg-theme-card hover:text-theme-primary hover:shadow-[0_0_15px_rgba(0,0,0,0.05)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-900">G</span>
            {isSigningIn && !email && !password ? "Connecting to Google..." : "Continue with Google"}
          </motion.button>`;

const guestBtnReplacement = `          <motion.button 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.8, duration: 0.5 }} 
            type="button" 
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[22px] border border-theme-border-soft bg-theme-surface text-sm font-bold text-theme-muted transition-all hover:bg-theme-card hover:text-theme-primary hover:shadow-[0_0_15px_rgba(0,0,0,0.05)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-900">G</span>
            {isSigningIn && !email && !password ? "Connecting to Google..." : "Continue with Google"}
          </motion.button>
          
          <motion.button 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.85, duration: 0.5 }} 
            type="button" 
            onClick={handleGuestLogin}
            disabled={isSigningIn}
            className="mt-3 flex h-[52px] w-full items-center justify-center gap-3 rounded-[22px] border border-theme-border-soft bg-transparent text-sm font-bold text-theme-muted transition-all hover:bg-theme-surface hover:text-theme-primary hover:shadow-[0_0_15px_rgba(0,0,0,0.05)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <UserRound className="w-5 h-5 text-theme-muted" />
            Continue as Guest (Offline Mode)
          </motion.button>`;

code = code.replace(guestBtnTarget, guestBtnReplacement);

// Optional: Automatically enter guest mode if Firebase throws API errors or isn't ready
const zeroCrashTarget = `      setError(err.message || 'Failed to authenticate');`;
const zeroCrashReplacement = `      setError(err.message || 'Failed to authenticate');
      if (err.message && err.message.includes('API key not valid')) {
         toast.error('Firebase Config missing. Auto-switching to Guest Mode.');
         handleGuestLogin();
      }`;
code = code.replace(zeroCrashTarget, zeroCrashReplacement);

fs.writeFileSync('src/pages/Login.jsx', code);
console.log('Login.jsx updated successfully!');
