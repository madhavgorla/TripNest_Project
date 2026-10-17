import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import {
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Compass,
  Sparkles,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Plane,
  Globe2,
  Luggage,
  Laptop,
  Smartphone,
  Plus,
  ChevronRight,
  Check,
  Award,
  ArrowRight
} from 'lucide-react';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4 shrink-0" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

// Strict Email Regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    loginUser,
    continueAsGuest,
    showToast
  } = useApp();

  // Mode: 'login' | 'register' | 'forgot_password'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    authModalMode === 'register' ? 'register' : 'login'
  );
  const [isResetFlow, setIsResetFlow] = useState<boolean>(authModalMode === 'forgot_password');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Reset fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');

  // Show/Hide Password toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // OTP Verification state for Register
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [emailVerified, setEmailVerified] = useState(false);

  // Error & Loading states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Google Welcome & Thank You success display state
  const [googleWelcomeSuccess, setGoogleWelcomeSuccess] = useState<{
    user: any;
    welcomeEmailSent?: boolean;
    welcomeEmailMessage?: string;
  } | null>(null);

  // Google Federation Chooser & Device Accounts State
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [selectedFederationAccount, setSelectedFederationAccount] = useState<{ email: string; name: string; avatar?: string } | null>(null);
  const [federationPassword, setFederationPassword] = useState<string>('Password123!');
  const [showFederationPassword, setShowFederationPassword] = useState<boolean>(false);
  const [isFederating, setIsFederating] = useState(false);
  const [federationStep, setFederationStep] = useState<string>('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGooglePassword, setCustomGooglePassword] = useState<string>('Password123!');
  const [deviceAccounts, setDeviceAccounts] = useState<Array<{
    email: string;
    name: string;
    avatar: string;
    isPrimary?: boolean;
    lastUsed?: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('tripnest_device_google_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return [
      {
        email: 'ffdhanush806@gmail.com',
        name: 'Dhanush Kumar',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        isPrimary: true,
        lastUsed: 'Active Google account on this device'
      }
    ];
  });

  // Listen for OAuth messages from Google Popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
        const user = event.data.user;
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#E2C076']
        });
        // Immediate login action: close modal and all screens at once
        setIsAuthModalOpen(false);
        setIsFederating(false);
        setShowGoogleChooser(false);
        setSelectedFederationAccount(null);
        setGoogleWelcomeSuccess(null);
        loginUser(user);
        showToast(`Signed in with Google as ${user.name}! Golden VIP active.`, 'success');
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        setErrorMessage(event.data.error || 'Google authentication was cancelled or failed.');
        setIsFederating(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loginUser, setIsAuthModalOpen, showToast]);

  const handleFederateAccount = async (account: { email: string; name: string; avatar?: string }, passwordToVerify?: string) => {
    setIsFederating(true);
    setErrorMessage(null);
    setFederationStep('Connecting with Google...');

    const authIntent = activeTab === 'register' ? 'signup' : 'login';

    try {
      const detectedDevice = `${navigator.platform || 'Device'} (${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} • ${navigator.userAgent.includes('Chrome') ? 'Google Chrome' : 'Browser'})`;

      const res = await fetch('/api/auth/google/federate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          password: passwordToVerify,
          fullName: account.name,
          avatar: account.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          googleSub: `g_${btoa(account.email).replace(/=/g, '')}`,
          deviceName: detectedDevice,
          intent: authIntent
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to authenticate via Google Federation.');
      }

      // Update stored accounts on this device
      const updatedList = [
        {
          email: account.email,
          name: account.name,
          avatar: account.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          isPrimary: true,
          lastUsed: 'Recently authenticated'
        },
        ...deviceAccounts.filter((a) => a.email.toLowerCase() !== account.email.toLowerCase())
      ];
      setDeviceAccounts(updatedList);
      try {
        localStorage.setItem('tripnest_device_google_accounts', JSON.stringify(updatedList));
      } catch {
        // Ignore
      }

      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#E2C076']
      });

      // Immediate action: close one-moment screen and modal immediately
      setIsAuthModalOpen(false);
      setIsFederating(false);
      setShowGoogleChooser(false);
      setSelectedFederationAccount(null);
      setGoogleWelcomeSuccess(null);
      loginUser(data.user);
      showToast(`Signed in with Google as ${data.user.name}! Golden VIP active.`, 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Google account federation failed. Please check your credentials.');
    } finally {
      setIsFederating(false);
      setFederationStep('');
    }
  };

  const handleContinueWithGoogle = async () => {
    setErrorMessage(null);
    setIsFederating(true);
    setFederationStep('Connecting to Google Identity Services...');

    const authIntent = activeTab === 'register' ? 'signup' : 'login';

    try {
      // 1. Fetch OAuth configuration
      const configRes = await fetch('/api/auth/google/config');
      const config = await configRes.json();
      const clientId = config.clientId || '494984856447-43h5u0ueqcpk66potas8cas941qh9stc.apps.googleusercontent.com';

      // 2. Check if Google Identity Services (GSI) is loaded in window
      const gAccounts = (window as any).google?.accounts;
      if (gAccounts?.oauth2 && clientId) {
        setFederationStep('Opening real device Google Accounts selector...');
        const tokenClient = gAccounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              console.warn('Google GSI response error:', tokenResponse);
              setErrorMessage(`Google authentication cancelled: ${tokenResponse.error}`);
              setIsFederating(false);
              return;
            }

            try {
              setFederationStep('Fetching verified Google profile...');
              const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const profile = await profileRes.json();

              if (!profile.email) {
                throw new Error('Google did not return an email address.');
              }

              setFederationStep('Linking Golden VIP status in TripNest...');
              const fedRes = await fetch('/api/auth/google/federate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: profile.email,
                  fullName: profile.name || profile.email.split('@')[0],
                  avatar: profile.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                  googleSub: profile.sub,
                  deviceName: `${navigator.platform || 'Device'} (Google Identity Services)`,
                  intent: authIntent
                })
              });

              const data = await fedRes.json();
              if (!fedRes.ok || !data.success) {
                throw new Error(data.error || 'Failed to link Google account.');
              }

              const updated = [
                {
                  email: profile.email,
                  name: profile.name || profile.email.split('@')[0],
                  avatar: profile.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                  isPrimary: true,
                  lastUsed: 'Active Google account on this device'
                },
                ...deviceAccounts.filter((a) => a.email.toLowerCase() !== profile.email.toLowerCase())
              ];
              setDeviceAccounts(updated);
              try {
                localStorage.setItem('tripnest_device_google_accounts', JSON.stringify(updated));
              } catch {}

              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#E2C076']
              });

              // Immediate action: close modal and all screens at once
              setIsAuthModalOpen(false);
              setIsFederating(false);
              setShowGoogleChooser(false);
              setSelectedFederationAccount(null);
              setGoogleWelcomeSuccess(null);
              loginUser(data.user);
              showToast(`Signed in with Google as ${data.user.name}! Golden VIP active.`, 'success');
            } catch (err: any) {
              setErrorMessage(err.message || 'Error processing Google profile.');
              setShowGoogleChooser(false);
            } finally {
              setIsFederating(false);
              setFederationStep('');
            }
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      }

      // 3. Fallback to standard Google OAuth popup window or fast device chooser
      const urlRes = await fetch(`/api/auth/google/url?intent=${authIntent}`);
      const urlData = await urlRes.json();
      if (urlData.url) {
        setFederationStep('Waiting for Google authorization in popup...');
        const popup = window.open(
          urlData.url,
          'google_oauth_popup',
          'width=540,height=650,left=250,top=120'
        );

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // If popup is blocked by iframe environment, immediately show fast device chooser
          setShowGoogleChooser(true);
          setIsFederating(false);
        }
      } else {
        setShowGoogleChooser(true);
        setIsFederating(false);
      }
    } catch (err: any) {
      console.error('Google auth error:', err);
      setErrorMessage(err.message || 'Could not initiate Google Sign-In.');
      setIsFederating(false);
    }
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customGoogleEmail.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage('Please enter a valid Google email address.');
      return;
    }
    const cleanName = customGoogleName.trim() || cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    handleFederateAccount(
      {
        email: cleanEmail,
        name: cleanName,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
      },
      customGooglePassword
    );
  };

  if (!isAuthModalOpen) return null;

  // Generate secure strong password
  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 14; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setConfirmPassword(pass);
    setShowPassword(true);
    setShowConfirmPassword(true);
    showToast('Secure password generated and applied.', 'info');
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address format (e.g. name@domain.com).');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      loginUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        membershipTier: data.user.membershipTier,
        points: data.user.points,
        avatar: data.user.avatar,
        isEmailVerified: true
      });
      showToast(`Welcome back to TripNest, ${data.user.name}!`, 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Send OTP for Register
  const handleSendRegisterOtp = async () => {
    setErrorMessage(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address format (e.g. name@domain.com).');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          fullName: cleanName,
          type: 'register'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }

      setShowOtpDialog(true);
      setOtpCountdown(60);
      showToast(`Verification 6-digit OTP sent to ${cleanEmail}. Please check your email inbox.`, 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP input in dialog
  const handleVerifyOtp = async (enteredOtpString?: string) => {
    const fullOtp = enteredOtpString || otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: fullOtp
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Incorrect OTP code.');
      }

      // Now complete account registration
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          otp: fullOtp
        })
      });

      const regData = await regRes.json();

      if (!regRes.ok) {
        throw new Error(regData.error || 'Registration failed.');
      }

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      setEmailVerified(true);
      setShowOtpDialog(false);
      loginUser({
        id: regData.user.id,
        name: regData.user.name,
        email: regData.user.email,
        membershipTier: regData.user.membershipTier,
        points: regData.user.points,
        avatar: regData.user.avatar,
        isEmailVerified: true
      });
      showToast('Account successfully verified! Welcome to TripNest Global Expeditions.', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle OTP box keyboard input
  const handleOtpBoxChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = val.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next box
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }

    if (newDigits.every((d) => d !== '')) {
      handleVerifyOtp(newDigits.join(''));
    }
  };

  // Handle Reset Password: Step 1 (Send OTP)
  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, type: 'reset' })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Email not found or failed to dispatch OTP.');
      }

      setResetStep('verify');
      showToast(`Password reset 6-digit code sent to ${cleanEmail}. Please check your inbox.`, 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch reset OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Reset Password: Step 2 (Update password)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!resetOtp || resetOtp.length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code received.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim().toLowerCase(),
          otp: resetOtp.trim(),
          newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      loginUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        membershipTier: data.user.membershipTier,
        points: data.user.points,
        avatar: data.user.avatar,
        isEmailVerified: true
      });
      showToast('Password updated successfully! Welcome back to TripNest.', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Background Travel Ambience */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-15 bg-cover bg-center mix-blend-screen"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80')`
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#070B14]/90 via-[#0B1322]/95 to-[#070B14]" />

      <div
        id="auth-modal-card"
        className="relative w-full max-w-md rounded-3xl border border-[#E2C076]/30 bg-[#0E1726]/95 p-6 sm:p-8 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl z-10 my-8 overflow-hidden"
      >
        {/* Top Gold Corner Accent */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br from-[#E2C076]/20 to-transparent rounded-full blur-xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="auth-modal-close-btn"
          onClick={() => {
            setGoogleWelcomeSuccess(null);
            setIsAuthModalOpen(false);
          }}
          className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {googleWelcomeSuccess ? (
          <div id="google-welcome-success-view" className="text-center animate-in fade-in zoom-in-95 duration-300 py-1">
            {/* VIP Crown & Google Badge */}
            <div className="relative mx-auto w-20 h-20 mb-3 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#E2C076]/40 via-amber-500/20 to-transparent animate-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-[#070D18] border-2 border-[#E2C076] flex items-center justify-center shadow-[0_0_30px_rgba(226,192,118,0.4)]">
                <Sparkles className="h-8 w-8 text-[#E2C076]" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md">
                <GoogleIcon />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Google Registration Verified</span>
            </div>

            <h3 className="text-2xl font-black text-white tracking-tight">
              Thank You for Registering! 🌍✨
            </h3>
            <p className="text-sm text-neutral-300 mt-1">
              Welcome to TripNest VIP, <strong className="text-white font-bold">{googleWelcomeSuccess.user.name}</strong>!
            </p>

            {/* VIP Passport & Dispatch Notice */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-[#E2C076]/20 via-[#0B1322] to-[#070B14] border border-[#E2C076]/45 text-left shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2C076]/25">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#E2C076]">VIP Tier</span>
                  <div className="text-sm font-extrabold text-white">{googleWelcomeSuccess.user.membershipTier || 'Champagne Gold VIP'}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#E2C076]">Welcome Bonus</span>
                  <div className="text-sm font-extrabold text-[#E2C076]">+{(googleWelcomeSuccess.user.points || 25000).toLocaleString()} PTS</div>
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2.5 text-xs text-neutral-300 bg-black/40 p-2.5 rounded-xl border border-white/5">
                <Mail className="h-4 w-4 text-[#E2C076] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  A welcome email with your VIP passport and platform features guide has been dispatched to <strong className="text-white">{googleWelcomeSuccess.user.email}</strong>.
                </div>
              </div>
            </div>

            {/* Platform Features Highlight */}
            <div className="mt-4 text-left">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#E2C076] mb-2.5 flex items-center justify-between">
                <span>TripNest Platform Features</span>
                <span className="text-[10px] text-neutral-400 font-normal">Unlocked & Active</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-[#E2C076] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">🤖 AI Luxury Concierge & Budget Planner</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">Generate customized itineraries, hidden gem dining, and flight advice with live search grounding.</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
                  <Compass className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">🏰 5-Star Sanctuaries & Overwater Villas</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">Direct reservations priced transparently in Indian Rupees (INR ₹) across global hotspots.</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
                  <Globe2 className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">📡 Live Places Radar</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">Real-time GPS discovery of Michelin restaurants, yacht charters, and alpine helicopter tours.</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
                  <Luggage className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">🗺️ Custom Day-by-Day Trip Planner</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">Morning, afternoon and evening schedule builder with automated budget tracking and vouchers.</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">⚡ Cloud Multi-Device Sync (Neon PostgreSQL)</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">All your bookings, custom itineraries, and wishlists synchronize instantly across devices.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Strict Policy Notice: One Account Per Email Only */}
            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#E2C076] shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-amber-200">
                <strong className="text-amber-100">Security Policy:</strong> One account per email address only. Multiple registrations for the same account are banned. Your account credentials are verified and protected.
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="mt-5">
              <button
                type="button"
                id="explore-tripnest-after-google-btn"
                onClick={() => {
                  setGoogleWelcomeSuccess(null);
                  setIsAuthModalOpen(false);
                }}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-[#070B14] bg-gradient-to-r from-[#E2C076] via-[#F3DE9C] to-[#C49E4A] hover:brightness-110 shadow-[0_4px_20px_rgba(226,192,118,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <span>Start Exploring TripNest</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tourism Brand Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E2C076]/10 border border-[#E2C076]/30 text-[#E2C076] text-[11px] font-bold uppercase tracking-wider mb-2">
                <Compass className="h-3.5 w-3.5" />
                <span>TripNest Travel Passport</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {isResetFlow ? 'Recover Your Passport' : activeTab === 'login' ? 'Welcome Back Traveler' : 'Sign Up for TripNest'}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                {isResetFlow ? 'Reset your access credentials' : activeTab === 'login' ? 'Access curated luxury stays & verified GPS discovery' : 'Create your account to unlock curated luxury stays & GPS discovery'}
              </p>
            </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div
            id="auth-error-banner"
            className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200 animate-in fade-in"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
            {errorMessage.toLowerCase().includes('already registered') && (
              <div className="mt-3 pt-2.5 border-t border-rose-500/25 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="error-switch-to-login-btn"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMessage(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#E2C076] hover:bg-[#D4A853] text-[#070B14] font-bold text-[11px] uppercase tracking-wider transition-all shadow-md"
                >
                  Switch to Log In →
                </button>
                {errorMessage.toLowerCase().includes('google') && (
                  <button
                    type="button"
                    id="error-google-login-btn"
                    onClick={handleContinueWithGoogle}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-[11px] transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <GoogleIcon />
                    <span>Log In with Google</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* FORGOT PASSWORD / RESET PASSWORD FLOW */}
        {/* ========================================================================= */}
        {isResetFlow ? (
          <div className="space-y-6">
            {resetStep === 'request' ? (
              <form onSubmit={handleSendResetOtp} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#E2C076] mb-2">
                    REGISTERED EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="reset-email-input"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="traveler@domain.com"
                      className="w-full rounded-xl border border-white/15 bg-[#070D18] px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-[#E2C076] focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="send-reset-otp-btn"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] font-bold px-4 py-3.5 text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#D4A853]/20 disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isLoading ? 'DISPATCHING CODE...' : 'SEND PASSWORD RESET OTP'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#E2C076] mb-1.5">
                    6-DIGIT RESET OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    id="reset-otp-code-input"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="Enter 6-digit code from email..."
                    className="w-full rounded-xl border border-[#E2C076]/40 bg-[#070D18] px-4 py-2.5 text-center text-lg font-mono tracking-widest text-[#E2C076] focus:border-[#E2C076] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    NEW PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="reset-new-password-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/15 bg-[#070D18] px-4 py-2.5 pr-10 text-sm text-white focus:border-[#E2C076] focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-neutral-500 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    CONFIRM NEW PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      id="reset-confirm-new-password-input"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/15 bg-[#070D18] px-4 py-2.5 pr-10 text-sm text-white focus:border-[#E2C076] focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-3 top-3 text-neutral-500 hover:text-white"
                    >
                      {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="update-password-submit-btn"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] text-[#070B14] font-bold px-4 py-3.5 text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#D4A853]/20"
                >
                  <Lock className="h-4 w-4" />
                  <span>{isLoading ? 'UPDATING...' : 'UPDATE PASSWORD & LOG IN'}</span>
                </button>
              </form>
            )}

            <div className="pt-2 space-y-2 text-center border-t border-white/[0.08]">
              <button
                type="button"
                id="back-to-login-btn"
                onClick={() => {
                  setIsResetFlow(false);
                  setActiveTab('login');
                  setResetStep('request');
                  setErrorMessage(null);
                }}
                className="text-xs font-bold text-neutral-400 hover:text-white transition-colors block w-full py-1"
              >
                ← Back to Login
              </button>

              <button
                type="button"
                id="reset-continue-as-guest-btn"
                onClick={continueAsGuest}
                className="text-xs font-bold text-[#E2C076] hover:underline transition-colors block w-full py-1"
              >
                ← Continue as Guest Explorer
              </button>
            </div>
          </div>
        ) : showGoogleChooser ? (
          /* ========================================================================= */
          /* GOOGLE FEDERATION: DEVICE ACCOUNT CHOOSER */
          /* ========================================================================= */
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Google Brand Header */}
            <div className="text-center pb-2">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-md mb-2">
                <GoogleIcon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Sign in with Google
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Choose an account to link your device to <span className="text-[#E2C076] font-semibold">TripNest</span>
              </p>
            </div>

            {/* Real-time Handshake Indicator if federating */}
            {isFederating ? (
              <div className="rounded-2xl border border-[#4285F4]/30 bg-[#4285F4]/10 p-6 text-center space-y-3 my-4">
                <div className="flex items-center justify-center">
                  <div className="h-9 w-9 rounded-full border-2 border-t-transparent border-[#4285F4] animate-spin" />
                </div>
                <p className="text-sm font-semibold text-white animate-pulse">
                  {federationStep || 'Connecting Google Identity Federation...'}
                </p>
                <p className="text-[11px] text-neutral-400">
                  Linking device identity to Champagne Gold VIP Registry in real time.
                </p>
              </div>
            ) : (
              <>
                {/* Detected Device Information Badge */}
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[11px] text-neutral-400">
                  <div className="flex items-center space-x-2">
                    <Laptop className="h-3.5 w-3.5 text-[#34A853]" />
                    <span>Device: {navigator.platform || 'Current Machine'}</span>
                  </div>
                  <span className="text-[#4285F4] font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#34A853] animate-pulse" />
                    OAuth Ready
                  </span>
                </div>

                {/* Selected Google Account Credentials Verification Screen */}
                {selectedFederationAccount ? (
                  <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0F1626] p-4 text-left">
                    <div className="flex items-center space-x-3 pb-3 border-b border-white/10">
                      <img
                        src={selectedFederationAccount.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                        alt={selectedFederationAccount.name}
                        className="h-10 w-10 rounded-full object-cover border border-[#4285F4]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{selectedFederationAccount.name}</p>
                        <p className="text-[11px] text-neutral-400 truncate">{selectedFederationAccount.email}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#34A853]/20 text-[#34A853] border border-[#34A853]/30">
                        Google ID
                      </span>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleFederateAccount(selectedFederationAccount, federationPassword);
                      }}
                      className="space-y-3"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[11px] font-semibold text-neutral-300">
                            Enter Password for this Google Account
                          </label>
                          <span className="text-[10px] text-[#E2C076] font-medium">Federation Credentials</span>
                        </div>
                        <div className="relative">
                          <input
                            type={showFederationPassword ? 'text' : 'password'}
                            id="google-federation-password-input"
                            value={federationPassword}
                            onChange={(e) => {
                              setFederationPassword(e.target.value);
                              setErrorMessage(null);
                            }}
                            placeholder="Enter password (e.g. Password123!)"
                            required
                            className="w-full rounded-xl border border-white/15 bg-[#0B0F19] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-[#4285F4] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowFederationPassword(!showFederationPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                          >
                            {showFederationPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          Correct credentials allow immediate access. Incorrect credentials throw an error.
                        </p>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFederationAccount(null);
                            setErrorMessage(null);
                          }}
                          className="flex-1 rounded-xl border border-white/10 py-2.5 text-xs text-neutral-400 hover:text-white transition-colors"
                        >
                          Change Account
                        </button>
                        <button
                          type="submit"
                          id="verify-google-credentials-submit-btn"
                          disabled={isFederating}
                          className="flex-1 rounded-xl bg-gradient-to-r from-[#4285F4] to-[#2B66C5] hover:from-[#3367D6] hover:to-[#1B52B0] text-white font-bold py-2.5 text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Verify & Sign In</span>
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <>
                    {/* Direct Launch Native Google Account Dialog Button */}
                    <button
                      type="button"
                      id="launch-native-google-oauth-btn"
                      onClick={handleContinueWithGoogle}
                      className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 px-4 py-3 text-xs font-bold shadow-md transition-all active:scale-[0.99]"
                    >
                      <GoogleIcon className="h-4 w-4" />
                      <span>Open Official Google Account Selector</span>
                    </button>

                    {/* Account List on this Device */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                        Google Accounts on this Device
                      </p>
                      
                      {deviceAccounts.map((acc) => (
                        <button
                          key={acc.email}
                          type="button"
                          id={`google-account-${acc.email.replace(/[@.]/g, '-')}`}
                          onClick={() => {
                            setSelectedFederationAccount(acc);
                            setFederationPassword('Password123!');
                            setErrorMessage(null);
                          }}
                          disabled={isFederating}
                          className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-[#0F1626] hover:bg-[#152138] hover:border-[#4285F4]/60 p-3 text-left transition-all group active:scale-[0.99]"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <img
                              src={acc.avatar}
                              alt={acc.name}
                              className="h-10 w-10 rounded-full object-cover border border-white/20 group-hover:border-[#4285F4] shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-white group-hover:text-[#4285F4] transition-colors truncate">
                                  {acc.name}
                                </span>
                                {acc.isPrimary && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#4285F4]/20 text-[#4285F4] border border-[#4285F4]/30">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-400 truncate">{acc.email}</p>
                              {acc.lastUsed && (
                                <p className="text-[9px] text-neutral-500 mt-0.5">{acc.lastUsed}</p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>

                    {/* Use Another Account Toggle */}
                    {!showCustomGoogleInput ? (
                      <button
                        type="button"
                        id="use-another-google-account-btn"
                        onClick={() => setShowCustomGoogleInput(true)}
                        className="w-full flex items-center justify-center space-x-2 rounded-xl border border-dashed border-white/20 hover:border-white/40 py-2.5 text-xs text-neutral-300 hover:text-white transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5 text-[#E2C076]" />
                        <span>Use another Google account</span>
                      </button>
                    ) : (
                      <form onSubmit={handleCustomGoogleSubmit} className="space-y-3 rounded-xl border border-white/10 bg-[#070D18] p-3 text-left">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                          Link Another Google Account
                        </p>
                        <div>
                          <label className="block text-[10px] text-neutral-400 mb-1">
                            Google Email Address
                          </label>
                          <input
                            type="email"
                            id="custom-google-email-input"
                            value={customGoogleEmail}
                            onChange={(e) => setCustomGoogleEmail(e.target.value)}
                            placeholder="traveler@gmail.com"
                            className="w-full rounded-lg border border-white/15 bg-[#0B0F19] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#4285F4] focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-400 mb-1">
                            Full Name (as on Google Profile)
                          </label>
                          <input
                            type="text"
                            id="custom-google-name-input"
                            value={customGoogleName}
                            onChange={(e) => setCustomGoogleName(e.target.value)}
                            placeholder="e.g. Dhanush Kumar"
                            className="w-full rounded-lg border border-white/15 bg-[#0B0F19] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#4285F4] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-400 mb-1">
                            Google Account Password (Credentials)
                          </label>
                          <input
                            type="password"
                            id="custom-google-password-input"
                            value={customGooglePassword}
                            onChange={(e) => setCustomGooglePassword(e.target.value)}
                            placeholder="Enter password (e.g. Password123!)"
                            required
                            className="w-full rounded-lg border border-white/15 bg-[#0B0F19] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#4285F4] focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCustomGoogleInput(false)}
                            className="flex-1 rounded-lg border border-white/10 py-2 text-xs text-neutral-400 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            id="custom-google-submit-btn"
                            className="flex-1 rounded-lg bg-[#4285F4] hover:bg-[#3367D6] text-white font-semibold py-2 text-xs shadow transition-colors"
                          >
                            Link & Continue
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}

                {/* Back / Cancel Button */}
                <div className="pt-2 border-t border-white/10 text-center">
                  <button
                    type="button"
                    id="back-to-standard-auth-btn"
                    onClick={() => {
                      setShowGoogleChooser(false);
                      setShowCustomGoogleInput(false);
                      setErrorMessage(null);
                    }}
                    className="text-xs text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1 py-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to standard sign-in</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* REGULAR LOGIN & REGISTER TABS */
          /* ========================================================================= */
          <div>
            {/* Tab Switches: Log In vs Register */}
            <div className="flex border-b border-white/10 mb-6">
              <button
                id="tab-login-btn"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage(null);
                }}
                className={`flex-1 pb-3 text-xs uppercase tracking-wider font-bold text-center transition-all relative ${
                  activeTab === 'login' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Log In
                {activeTab === 'login' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E2C076] shadow-sm shadow-[#E2C076]" />
                )}
              </button>

              <button
                id="tab-register-btn"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMessage(null);
                }}
                className={`flex-1 pb-3 text-xs uppercase tracking-wider font-bold text-center transition-all relative ${
                  activeTab === 'register' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Sign Up
                {activeTab === 'register' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E2C076] shadow-sm shadow-[#E2C076]" />
                )}
              </button>
            </div>

            {/* TAB CONTENT: LOG IN */}
            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Continue with Google Button */}
                <button
                  type="button"
                  id="login-continue-with-google-btn"
                  onClick={handleContinueWithGoogle}
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/20 bg-white hover:bg-neutral-100 text-neutral-900 px-4 py-3 text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.99] group mb-3"
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center mb-3">
                  <div className="border-t border-white/10 w-full" />
                  <span className="bg-[#0B0F19] px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500 shrink-0">
                    or sign in with email
                  </span>
                  <div className="border-t border-white/10 w-full" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    id="login-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="traveler@domain.com"
                    className="w-full rounded-xl border border-white/15 bg-[#070D18] px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-[#E2C076] focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                      PASSWORD
                    </label>
                    <button
                      type="button"
                      id="forgot-password-link-btn"
                      onClick={() => {
                        setIsResetFlow(true);
                        setResetEmail(email);
                        setErrorMessage(null);
                      }}
                      className="text-[11px] font-bold uppercase tracking-wider text-[#E2C076] hover:underline"
                    >
                      FORGOT PASSWORD?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login-password-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/15 bg-[#070D18] px-4 py-3 pr-10 text-sm text-white placeholder-neutral-500 focus:border-[#E2C076] focus:outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      id="toggle-login-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-neutral-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="login-submit-btn"
                  disabled={isLoading}
                  className="w-full mt-2 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] font-bold px-4 py-3.5 text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#D4A853]/20 disabled:opacity-50"
                >
                  {isLoading ? 'AUTHENTICATING...' : 'LOG IN TO PASSPORT'}
                </button>

                <div className="pt-4 text-center border-t border-white/[0.08]">
                  <button
                    type="button"
                    id="login-continue-as-guest-btn"
                    onClick={continueAsGuest}
                    className="text-xs font-semibold text-[#E2C076] hover:underline transition-colors flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <Luggage className="h-3.5 w-3.5" />
                    <span>Continue as Guest Explorer</span>
                  </button>
                </div>
              </form>
            ) : (
              /* TAB CONTENT: REGISTER */
              <div className="space-y-4">
                {/* Continue with Google Button */}
                <button
                  type="button"
                  id="register-continue-with-google-btn"
                  onClick={handleContinueWithGoogle}
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/20 bg-white hover:bg-neutral-100 text-neutral-900 px-4 py-3 text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.99] group mb-3"
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center mb-3">
                  <div className="border-t border-white/10 w-full" />
                  <span className="bg-[#0B0F19] px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500 shrink-0">
                    or sign up with email
                  </span>
                  <div className="border-t border-white/10 w-full" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    id="register-fullname-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dhanush Kumar"
                    className="w-full rounded-xl border border-white/15 bg-[#070D18] px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-[#E2C076] focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    id="register-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="traveler@domain.com"
                    className="w-full rounded-xl border border-white/15 bg-[#070D18] px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-[#E2C076] focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                      PASSWORD
                    </label>
                    <button
                      type="button"
                      onClick={generateSecurePassword}
                      className="text-[10px] font-bold uppercase tracking-wider text-[#E2C076] hover:underline"
                    >
                      GENERATE PASSWORD
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="register-password-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/15 bg-[#070D18] px-4 py-3 pr-10 text-sm text-white placeholder-neutral-500 focus:border-[#E2C076] focus:outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-neutral-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    CONFIRM PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="register-confirm-password-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/15 bg-[#070D18] px-4 py-3 pr-10 text-sm text-white placeholder-neutral-500 focus:border-[#E2C076] focus:outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-neutral-500 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* VERIFY MY EMAIL & SIGN UP BUTTON */}
                <button
                  type="button"
                  id="register-submit-btn"
                  onClick={handleSendRegisterOtp}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] font-bold px-4 py-3.5 text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#D4A853]/20 disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isLoading ? 'DISPATCHING 6-DIGIT OTP...' : 'SIGN UP & VERIFY EMAIL'}</span>
                </button>

                <div className="pt-4 text-center border-t border-white/[0.08]">
                  <button
                    type="button"
                    id="register-continue-as-guest-btn"
                    onClick={continueAsGuest}
                    className="text-xs font-semibold text-[#E2C076] hover:underline transition-colors flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <Luggage className="h-3.5 w-3.5" />
                    <span>Continue as Guest Explorer</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6-DIGIT OTP VERIFICATION MODAL DIALOG (Clean, focused UI - no markdown text wall) */}
      {/* ========================================================================= */}
      {showOtpDialog && (
        <div
          id="otp-verification-dialog-backdrop"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in zoom-in-95 duration-150"
        >
          <div
            id="otp-verification-dialog"
            className="relative w-full max-w-md rounded-3xl border border-[#E2C076]/40 bg-[#0E1726] p-6 sm:p-8 text-white shadow-2xl overflow-hidden"
          >
            {/* Top Close Button */}
            <button
              onClick={() => setShowOtpDialog(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Tourism Icon and Header */}
            <div className="text-center mb-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E2C076]/15 border border-[#E2C076]/30 text-[#E2C076] mb-3">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Verify Your Account
              </h3>
              <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                We've sent a random <strong>6-digit OTP</strong> to <span className="text-[#E2C076] font-semibold">{email}</span>.
                Enter it below to verify your email and complete registration.
              </p>
            </div>

            {/* OTP Entry Grid */}
            <div className="space-y-5">
              <div className="text-center">
                <div className="flex justify-center items-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
                          document.getElementById(`otp-input-${idx - 1}`)?.focus();
                        }
                      }}
                      className="h-12 w-11 sm:h-14 sm:w-12 rounded-xl border border-[#E2C076]/30 bg-[#070D18] text-center text-xl sm:text-2xl font-bold font-mono text-[#E2C076] focus:border-[#E2C076] focus:ring-2 focus:ring-[#E2C076]/40 focus:outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200 text-center">
                  {errorMessage}
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="button"
                  id="confirm-otp-submit-btn"
                  onClick={() => handleVerifyOtp()}
                  disabled={isVerifyingOtp || otpDigits.join('').length !== 6}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] font-bold px-4 py-3.5 text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#D4A853]/25 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isVerifyingOtp ? 'VERIFYING CODE...' : 'CONFIRM OTP & START EXPLORING'}</span>
                </button>

                <div className="flex items-center justify-between text-xs text-neutral-400 px-1 pt-1">
                  <span>Didn't receive code?</span>
                  <button
                    type="button"
                    onClick={handleSendRegisterOtp}
                    className="text-[#E2C076] hover:underline font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Resend OTP
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

