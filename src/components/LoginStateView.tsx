import React, { useState, useEffect } from "react";
import { LogIn, ArrowRight, Sparkles, User, Mail, Quote } from "lucide-react";
import { motion } from "motion/react";
import { firebaseSignIn } from "../firebase";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [quote, setQuote] = useState<QuoteItem>({ text: "", author: "" });
  const [error, setError] = useState("");

  // Select a random quote each time the screen loads
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * SCIENCE_QUOTES.length);
    setQuote(SCIENCE_QUOTES[randomIndex]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name to start learning.");
      return;
    }
    setError("");
    onLogin(name.trim(), email.trim());
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
          <LogIn size={22} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="font-sans font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">
          Welcome to Syllabus Desk
        </h2>
        <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">
          LOGIN_STATE GATEWAY
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
          <Quote size={16} className="text-indigo-200 dark:text-indigo-900 absolute top-3 right-3 rotate-185" />
          <p className="text-[11px] md:text-[12px] italic text-slate-605 dark:text-slate-300 leading-relaxed font-medium font-sans pr-6">
            "{quote.text}"
          </p>
          <p className="text-[10px] text-indigo-605 dark:text-indigo-400 font-mono font-bold mt-2 text-right">
            — {quote.author}
          </p>
        </motion.div>
      )}

      {/* Login Gate Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-left" id="login-credentials-form">
        <div className="space-y-1.5">
          <label htmlFor="login-name" className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Your Name
          </label>
          <div className="relative">
            <User size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              id="login-name"
              type="text"
              required
              placeholder="e.g. Richard Feynman"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 placeholder-slate-400 text-slate-800 text-xs font-medium rounded-xl focus:outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Email Address (Optional)
          </label>
          <div className="relative">
            <Mail size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              id="login-email"
              type="email"
              placeholder="e.g. richard@feynman.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 placeholder-slate-400 text-slate-800 text-xs font-medium rounded-xl focus:outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {error && (
          <p className="text-[11px] text-rose-600 font-semibold text-center italic">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer"
          id="btn-login-submit"
        >
          <span>Start Learning</span>
          <ArrowRight size={14} />
        </button>
      </form>
    </motion.div>
  );
}
