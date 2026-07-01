import React, { useState, useEffect } from "react";
import { LogIn, UserPlus, ArrowRight, User, Mail, Lock, Quote, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { firebaseSignInWithEmail, firebaseSignUpWithEmail, firebaseGetUserProfile } from "../firebase";

interface LoginStateViewProps {
  onLogin: (name: string, email: string, uid: string) => void;
}

interface QuoteItem {
  text: string;
  author: string;
}

const SCIENCE_QUOTES: QuoteItem[] = [
  {
    text: "The important thing is not to stop questioning. Curiosity has its own reason for existence.",
    author: "Albert Einstein"
  },
  {
    text: "Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.",
    author: "Marie Curie"
  },
  {
    text: "What I cannot create, I do not understand.",
    author: "Richard Feynman"
  },
  {
    text: "Somewhere, something incredible is waiting to be known.",
    author: "Carl Sagan"
  },
  {
    text: "If I have seen further it is by standing on the shoulders of Giants.",
    author: "Isaac Newton"
  },
  {
    text: "Scientific thought is the common heritage of mankind.",
    author: "Abdus Salam"
  },
  {
    text: "The brain is like a muscle. When it is in use we feel very good. Understanding is joyous.",
    author: "Carl Sagan"
  },
  {
    text: "Remember to look up at the stars and not down at your feet. Try to make sense of what you see.",
    author: "Stephen Hawking"
  },
  {
    text: "The science of today is the technology of tomorrow.",
    author: "Edward Teller"
  }
];

export default function LoginStateView({ onLogin }: LoginStateViewProps) {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [quote, setQuote] = useState<QuoteItem>({ text: "", author: "" });
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * SCIENCE_QUOTES.length);
    setQuote(SCIENCE_QUOTES[randomIndex]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authMode === "signup" && !name.trim()) {
      setError("Please enter your name to build your curriculum profile.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password fields.");
      return;
    }
    if (password.length < 6) {
      setError("Security requirement: Password must be at least 6 characters long.");
      return;
    }

    setError("");
    setIsProcessing(true);

    try {
  let uid = "";
  let resolvedName = name.trim();

  if (authMode === "signup") {
    uid = await firebaseSignUpWithEmail(email.trim(), password);
  } else {
    uid = await firebaseSignInWithEmail(email.trim(), password);
    const profile = await firebaseGetUserProfile(uid);
    resolvedName = profile?.name || "Learner";
  }

  onLogin(resolvedName, email.trim(), uid);
} catch (err: any) {

      onLogin(authMode === "signup" ? name.trim() : "Learner", email.trim(), uid);
    } catch (err: any) {
      console.error("Firebase auth handler failed:", err);
      
      if (err?.code === "auth/email-already-in-use") {
        setError("This email address is already registered. Please switch to Sign In.");
      } else if (err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password") {
        setError("Invalid email or password credentials. Please verify and try again.");
      } else if (err?.code === "auth/user-not-found") {
        setError("No account found with this email. Try switching to Sign Up.");
      } else {
        setError(err?.message || "Authentication checkpoint failed — please retry.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="p-8 sm:p-10 space-y-8"
      id="login-state-view"
    >
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/60 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-100/55 dark:shadow-none">
          {authMode === "signin" ? (
            <LogIn size={22} className="text-indigo-600 dark:text-indigo-400" />
          ) : (
            <UserPlus size={22} className="text-indigo-600 dark:text-indigo-400" />
          )}
        </div>
        <h2 className="font-sans font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">
          {authMode === "signin" ? "Welcome to Syllabus Desk" : "Create Your Account"}
        </h2>
        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
          {authMode === "signin" ? "LOGIN_STATE GATEWAY" : "ACCOUNT_REGISTRATION_GATEWAY"}
        </p>
      </div>
     
      {/* Rotating Science Quote Area */}
      {quote.text && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="relative bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl text-left"
          id="motivational-quote-box"
        >
          <Quote size={16} className="text-indigo-200 dark:text-indigo-900 absolute top-3 right-3 rotate-180" />
          <p className="text-[11px] md:text-[12px] italic text-slate-600 dark:text-slate-300 leading-relaxed font-medium font-sans pr-6">
            "{quote.text}"
          </p>
          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold mt-2 text-right">
            — {quote.author}
          </p>
        </motion.div>
      )}

      {/* Login Gate Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-left" id="login-credentials-form">
        
        {/* Name Input — Sign Up Only */}
        {authMode === "signup" && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-1.5"
          >
            <label htmlFor="login-name" className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              Your Name
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                id="login-name"
                type="text"
                required={authMode === "signup"}
                placeholder="e.g. Richard Feynman"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 placeholder-slate-400 text-slate-800 text-xs font-medium rounded-xl focus:outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
              />
            </div>
          </motion.div>
        )}

        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Email Address
          </label>
          <div className="relative">
            <Mail size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              id="login-email"
              type="email"
              required
              placeholder="e.g. richard@feynman.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 placeholder-slate-400 text-slate-800 text-xs font-medium rounded-xl focus:outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label htmlFor="login-password" className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Password
          </label>
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 placeholder-slate-400 text-slate-800 text-xs font-medium rounded-xl focus:outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <p className="text-[11px] text-rose-600 font-semibold text-center italic">
            {error}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer"
          id="btn-login-submit"
        >
          <span>
            {isProcessing 
              ? (authMode === "signin" ? "Signing in…" : "Creating Account…") 
              : (authMode === "signin" ? "Start Learning" : "Register & Start")}
          </span>
          <ArrowRight size={14} />
        </button>

        {/* Switcher Link */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === "signin" ? "signup" : "signin");
              setError("");
            }}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer bg-transparent border-0 outline-hidden"
          >
            {authMode === "signin" 
              ? "New to Syllabus Desk? Create an account" 
              : "Already have an account? Sign In"}
          </button>
        </div>

      </form>
    </motion.div>
  );
}
