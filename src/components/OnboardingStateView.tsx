import React, { useState } from "react";
import { GraduationCap, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface OnboardingStateViewProps {
  onConfirm: (level: string) => void;
  userName: string;
}

const COMMON_SUGGESTIONS = [
  "Grade 9",
  "Grade 10",
  "AP / IB",
  "A-Levels",
  "Undergraduate Year 1",
  "Undergraduate Year 2",
  "Postgraduate",
  "Self-study",
];

export default function OnboardingStateView({ onConfirm, userName }: OnboardingStateViewProps) {
  const [levelInput, setLevelInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = levelInput.trim();
    if (!trimmed) {
      setError("Please select or enter an academic level to continue.");
      return;
    }
    setError("");
    onConfirm(trimmed);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLevelInput(suggestion);
    setError("");
  };

  const greeting = userName ? `Hi ${userName}, let's tailor your profile` : "Let's tailor your profile";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="p-8 sm:p-10 space-y-8 text-left"
      id="onboarding-state-view"
    >
      {/* Visual Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100/55">
          <GraduationCap size={22} />
        </div>
        <h2 className="font-sans font-extrabold text-xl text-slate-900 tracking-tight">
          {greeting}
        </h2>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          One-Time Profile Setup
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-1">
          <h3 className="font-sans font-bold text-sm text-slate-850 tracking-tight flex items-center gap-1.5">
            <Sparkles size={13} className="text-indigo-500" />
            What is your current education level or grade?
          </h3>
          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
            We will store this in your profile to keep your curcumstanial syllabus benchmarks organized perfectly for your academic standard.
          </p>
        </div>

        {/* Suggestion Pills */}
        <div className="space-y-2">
          <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
            Quick Suggestions
          </span>
          <div className="flex flex-wrap gap-2" id="onboarding-suggestions">
            {COMMON_SUGGESTIONS.map((suggestion) => {
              const isActive = levelInput.trim().toLowerCase() === suggestion.trim().toLowerCase();
              return (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-3xs"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-350 hover:bg-slate-50"
                  }`}
                  id={`suggestion-pill-${suggestion.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                >
                  {suggestion}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Field Form */}
        <form onSubmit={handleSubmit} className="space-y-4" id="onboarding-level-form">
          <div className="space-y-1.5">
            <label htmlFor="onboarding-input" className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
              Or type custom level
            </label>
            <input
              id="onboarding-input"
              type="text"
              required
              placeholder="e.g. Undergraduate Year 2, High School Senior, etc."
              value={levelInput}
              onChange={(e) => {
                setLevelInput(e.target.value);
                if (error) setError("");
              }}
              className="w-full px-4 py-3 bg-white border border-slate-200 placeholder-slate-400 text-slate-800 text-xs font-medium rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all font-sans shadow-3xs"
            />
          </div>

          {error && (
            <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1.5">
              <AlertCircle size={12} />
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer mt-4"
            id="btn-onboarding-submit"
          >
            <span>Save Profile &amp; Enter Dashboard</span>
            <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
