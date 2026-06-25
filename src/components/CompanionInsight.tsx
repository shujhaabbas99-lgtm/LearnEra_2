import React, { useState, useEffect, useRef, useMemo } from "react";
import { Brain, X, Sparkles, AlertCircle, Loader2, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QuizHistoryEntry, SavedFlashcard } from "../types";

interface CompanionInsightProps {
  quizHistory: QuizHistoryEntry[];
  totalTimeStudied: number;
  timeSpentPerTopic: Record<string, number>;
  savedFlashcardsCount: number;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  curriculumLevel: string;
  userName: string;
  currentState: string;
}

export default function CompanionInsight({
  quizHistory,
  totalTimeStudied,
  timeSpentPerTopic,
  savedFlashcardsCount,
  difficultyLevel,
  curriculumLevel,
  userName,
  currentState,
}: CompanionInsightProps) {
  const [insight, setInsight] = useState<string | null>(() => {
    return localStorage.getItem("lernera_last_insight");
  });
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewUnread, setHasNewUnread] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const prevQuizHistoryLength = useRef(quizHistory.length);
  const prevCurrentState = useRef(currentState);
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to manual dismiss listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsPopupOpen(false);
      }
    };
    if (isPopupOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isPopupOpen]);

  // Calculate streakDays here
  const streakDays = useMemo(() => {
    const getLocalDateString = (timestampStr: string): string | null => {
      try {
        const d = new Date(timestampStr);
        if (!isNaN(d.getTime())) {
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        }
      } catch (_) {}
      if (timestampStr && timestampStr.includes(":")) {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }
      return null;
    };

    const quizDates = Array.from(
      new Set(
        quizHistory
          .map((q) => getLocalDateString(q.timestamp))
          .filter((d): d is string => d !== null)
      )
    ).sort();

    const todayDate = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();

    const yesterdayDate = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();

    let days = 0;
    const datesSet = new Set(quizDates);

    if (datesSet.has(todayDate)) {
      days = 1;
      const current = new Date();
      while (true) {
        current.setDate(current.getDate() - 1);
        const prevDateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
        if (datesSet.has(prevDateStr)) {
          days++;
        } else {
          break;
        }
      }
    } else if (datesSet.has(yesterdayDate)) {
      days = 1;
      const current = new Date();
      current.setDate(current.getDate() - 1);
      while (true) {
        current.setDate(current.getDate() - 1);
        const prevDateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
        if (datesSet.has(prevDateStr)) {
          days++;
        } else {
          break;
        }
      }
    }
    return days;
  }, [quizHistory]);

  const triggerInsightFetch = async (autoShow: boolean) => {
    // 1. Guard against double-fetching or loading
    if (isLoading) return;

    // 2. Do NOT run auto-show popups too frequently (throttle)
    if (autoShow) {
      const lastShown = localStorage.getItem("lernera_last_insight_shown_timestamp");
      const lastShownTime = lastShown ? parseInt(lastShown, 10) : 0;
      // Minimum interval between auto popups: 3 minutes (180,000 ms)
      if (Date.now() - lastShownTime < 180000) {
        return;
      }
    }

    setIsLoading(true);
    setErrorStatus(null);

    try {
      const response = await fetch("/api/generate-insight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName,
          quizHistory,
          totalTimeStudied,
          timeSpentPerTopic,
          streakDays,
          savedFlashcardsCount,
          difficultyLevel,
          curriculumLevel,
        }),
      });

      if (!response.ok) {
        throw new Error("Insight failed to compile.");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid content type returned for insight.");
      }

      const data = await response.json();
      if (data.insight) {
        const cleanedText = data.insight;
        setInsight(cleanedText);
        localStorage.setItem("lernera_last_insight", cleanedText);

        if (autoShow) {
          setIsPopupOpen(true);
          setHasNewUnread(true);
          localStorage.setItem("lernera_last_insight_shown_timestamp", Date.now().toString());

          // Setup auto dismiss timer
          if (autoDismissTimerRef.current) {
            clearTimeout(autoDismissTimerRef.current);
          }
          autoDismissTimerRef.current = setTimeout(() => {
            setIsPopupOpen(false);
          }, 8000); // 8 seconds auto-dismiss
        } else {
          setHasNewUnread(true);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus("Failed to retrieve companion suggestion.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger: Quiz completed
  useEffect(() => {
    if (quizHistory.length > prevQuizHistoryLength.current) {
      // Quiz length grew
      triggerInsightFetch(true);
    }
    prevQuizHistoryLength.current = quizHistory.length;
  }, [quizHistory.length]);

  // Trigger: Study state exited (leaving LEARNING_STATE, QUIZ_STATE, or FLASHCARD_STATE)
  useEffect(() => {
    const studyStates = ["LEARNING_STATE", "QUIZ_STATE", "FLASHCARD_STATE"];
    const wasStudying = studyStates.includes(prevCurrentState.current);
    const isNowNotStudying = !studyStates.includes(currentState);

    if (wasStudying && isNowNotStudying) {
      triggerInsightFetch(true);
    }
    prevCurrentState.current = currentState;
  }, [currentState]);

  // Trigger: Once per application load
  useEffect(() => {
    const initTimer = setTimeout(() => {
      // Only query if user is logged in
      if (currentState !== "LOGIN_STATE" && currentState !== "ONBOARDING_STATE") {
        // Just fetch silently, don't force autoShow popup unless more than 15 mins passed
        const lastShown = localStorage.getItem("lernera_last_insight_shown_timestamp");
        const lastShownTime = lastShown ? parseInt(lastShown, 10) : 0;
        const shouldPop = Date.now() - lastShownTime > 15 * 60 * 1000;
        triggerInsightFetch(shouldPop);
      }
    }, 5000);

    return () => {
      clearTimeout(initTimer);
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, []);

  const handleToggleClick = () => {
    if (isPopupOpen) {
      setIsPopupOpen(false);
    } else {
      setIsPopupOpen(true);
      setHasNewUnread(false);
      // If there is no previous insight, trigger one
      if (!insight && !isLoading) {
        triggerInsightFetch(false);
      }
    }
  };

  const handleManualRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerInsightFetch(true);
  };

  // Hide the floating companion entirely if user is on the Login or Onboarding screens
  if (currentState === "LOGIN_STATE" || currentState === "ONBOARDING_STATE") {
    return null;
  }

  return (
    <div id="floating-study-companion" ref={containerRef} className="fixed bottom-[96px] right-6 md:bottom-[104px] md:right-8 z-[100] flex flex-col items-end">
      {/* Tooltip Card Bubble */}
      <AnimatePresence>
        {isPopupOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            className="mb-3 max-w-[280px] sm:max-w-xs bg-white text-slate-800 rounded-2xl shadow-xl border border-indigo-50 p-4 relative"
            id="companion-insight-card"
          >
            {/* Background sparkle accents */}
            <div className="absolute top-2 left-2 text-indigo-200">
              <Sparkles size={14} className="opacity-40 animate-pulse" />
            </div>

            {/* Action Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <h4 className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                  Syllabus Companion
                </h4>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleManualRefresh}
                  disabled={isLoading}
                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
                  title="Generate a fresh insight"
                >
                  <RotateCw size={12} className={isLoading ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={() => setIsPopupOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            {isLoading && !insight ? (
              <div className="py-4 flex flex-col items-center justify-center gap-2">
                <Loader2 size={18} className="text-indigo-500 animate-spin" />
                <p className="text-[11px] text-slate-400 font-medium">Consulting syllabus records...</p>
              </div>
            ) : errorStatus && !insight ? (
              <div className="py-2 flex items-start gap-2 text-rose-500">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p className="text-[11px] font-medium leading-normal">{errorStatus}</p>
              </div>
            ) : (
              <div className="text-xs text-slate-600 font-medium leading-relaxed font-sans mt-1">
                {insight || "Keep studying and tracking topics! Touch the refresh button to generate your first learning insight."}
              </div>
            )}

            {/* Micro accent arrow pointing to bubble */}
            <div className="absolute right-4 -bottom-1.5 w-3 h-3 bg-white border-r border-b border-indigo-50 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating pulsing button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleToggleClick}
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg relative cursor-pointer border transition-all ${
          isPopupOpen
            ? "bg-indigo-600 border-indigo-500 text-white shadow-indigo-200"
            : "bg-white border-slate-100 text-indigo-600 hover:border-indigo-100 shadow-slate-200"
        }`}
        title="Show study companion insights"
        id="companion-toggle-button"
      >
        {/* Amber pulsing indicator */}
        {hasNewUnread && !isPopupOpen && (
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border border-white"></span>
          </span>
        )}

        {/* Ambient Ring Glow */}
        {!isPopupOpen && (
          <div className="absolute inset-0 rounded-full bg-indigo-500/5 animate-pulse -z-10" />
        )}

        <Brain size={22} className={isLoading ? "animate-bounce" : ""} />
      </motion.button>
    </div>
  );
}
