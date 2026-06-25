import React, { useState, useMemo, useRef, useEffect } from "react";
import { Brain, BookOpen, Bookmark, HelpCircle, X, ChevronRight, Play, BookOpenCheck, Calendar, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AppState, QuizHistoryEntry, SavedFlashcard, QuestionBankItem } from "../types";

interface ReviewFABProps {
  quizHistory: QuizHistoryEntry[];
  savedFlashcards: SavedFlashcard[];
  questionBank: QuestionBankItem[];
  currentState: AppState;
  setCurrentState: (state: AppState) => void;
  setSelectedSubject: (subject: string | null) => void;
  setSelectedTopic: (topic: string | null) => void;
  onSelectReviewCard?: (id: string) => void;
}

export default function ReviewFAB({
  quizHistory,
  savedFlashcards,
  questionBank,
  currentState,
  setCurrentState,
  setSelectedSubject,
  setSelectedTopic,
  onSelectReviewCard
}: ReviewFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Persistent screens check
  const isVisible = currentState === AppState.DASHBOARD_STATE || currentState === AppState.SUBJECT_SELECTION_STATE;

  useEffect(() => {
    if (!isVisible) {
      setIsOpen(false);
      setIsQuizModalOpen(false);
    }
  }, [currentState, isVisible]);

  // Click outside to close open FAB
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // 1. Calculate due quiz reviews (topics with prior attempts where retention date <= now)
  const dueQuizzes = useMemo(() => {
    const latestAttempts: Record<string, QuizHistoryEntry> = {};
    quizHistory.forEach((q) => {
      if (!q.topic || !q.subject) return;
      const key = `${q.subject.trim().toLowerCase()}::${q.topic.trim().toLowerCase()}`;
      const existing = latestAttempts[key];
      if (!existing || new Date(q.timestamp) > new Date(existing.timestamp)) {
        latestAttempts[key] = q;
      }
    });

    const now = new Date();
    const result: Array<{
      subject: string;
      topic: string;
      daysSinceLastReview: number;
      latestAttempt: QuizHistoryEntry;
    }> = [];

    for (const key in latestAttempts) {
      const q = latestAttempts[key];
      if (q.nextReviewDate) {
        const nextReview = new Date(q.nextReviewDate);
        if (nextReview <= now) {
          const diffMs = now.getTime() - new Date(q.timestamp).getTime();
          const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
          result.push({
            subject: q.subject,
            topic: q.topic,
            daysSinceLastReview: diffDays,
            latestAttempt: q
          });
        }
      }
    }
    return result;
  }, [quizHistory]);

  // 2. Calculate due flashcards (saved flashcards with retention date <= now or unset)
  const dueFlashcards = useMemo(() => {
    const now = new Date();
    return (savedFlashcards || []).filter((fc) => {
      if (!fc.nextReviewDate) return true;
      return new Date(fc.nextReviewDate) <= now;
    }).map((fc) => {
      const lastTime = fc.timestamp ? new Date(fc.timestamp) : new Date();
      const diffMs = now.getTime() - lastTime.getTime();
      const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return {
        ...fc,
        daysSinceLastReview: diffDays
      };
    });
  }, [savedFlashcards]);

  // 3. Count saved exam prep Q&As
  const savedQAsCount = useMemo(() => {
    return (questionBank || []).filter((item) => item.type === "qa").length;
  }, [questionBank]);

  // Sum of immediate reviews due (quizzes + flashcards)
  const totalDueCount = dueQuizzes.length + dueFlashcards.length;

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex flex-col items-end gap-3" ref={menuRef} id="review-fab-wrapper">
      {/* Expanded Radial/Vertical Stack Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="flex flex-col gap-2.5 mb-2 w-72 max-w-[calc(100vw-2rem)] select-none pointer-events-auto"
            id="review-fab-menu"
          >
            {/* Header Badge */}
            <div className="bg-slate-900 text-white dark:bg-slate-800 text-[10px] font-sans font-extrabold uppercase tracking-widest px-3 py-2 rounded-xl border border-slate-800 dark:border-slate-700 shadow-lg text-center flex items-center justify-center gap-1.5 leading-none">
              <Brain size={12} className="text-indigo-400" />
              <span>Retention Actions</span>
            </div>

            {/* Option 1: Due Quizzes */}
            <div
              onClick={() => {
                setIsOpen(false);
                setIsQuizModalOpen(true);
              }}
              className="group flex items-center justify-between bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-150/80 dark:border-slate-850 p-3.5 rounded-2xl shadow-md hover:border-rose-300 dark:hover:border-rose-900 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
              id="fab-option-quizzes"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2 text-left">
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-500 shrink-0 shadow-3xs group-hover:scale-105 transition-transform">
                  <BookOpen size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200">
                    Due Quiz Reviews
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium font-sans truncate pr-1">
                    Spaced repetition quiz sessions
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {dueQuizzes.length > 0 ? (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md font-bold font-mono text-[9.5px] uppercase tracking-wide shadow-3xs animate-pulse">
                    {dueQuizzes.length} due
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md font-bold font-mono text-[9px] uppercase tracking-wide border border-slate-100">
                    0 due
                  </span>
                )}
              </div>
            </div>

            {/* Option 2: Due Flashcards */}
            <div
              onClick={() => {
                setIsOpen(false);
                setCurrentState(AppState.SAVED_FLASHCARDS_STATE);
              }}
              className="group flex items-center justify-between bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-150/80 dark:border-slate-850 p-3.5 rounded-2xl shadow-md hover:border-teal-300 dark:hover:border-teal-900 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
              id="fab-option-flashcards"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2 text-left">
                <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-xl text-teal-600 shrink-0 shadow-3xs group-hover:scale-105 transition-transform">
                  <Bookmark size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200">
                    Due Flashcards
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium font-sans truncate pr-1">
                    Drill saved active recall cards
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {dueFlashcards.length > 0 ? (
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-md font-bold font-mono text-[9.5px] uppercase tracking-wide shadow-3xs">
                    {dueFlashcards.length} due
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md font-bold font-mono text-[9px] uppercase tracking-wide border border-slate-100">
                    0 due
                  </span>
                )}
              </div>
            </div>

            {/* Option 3: Saved Q&As */}
            <div
              onClick={() => {
                setIsOpen(false);
                setCurrentState(AppState.QUESTION_BANK_STATE);
              }}
              className="group flex items-center justify-between bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-150/80 dark:border-slate-850 p-3.5 rounded-2xl shadow-md hover:border-indigo-300 dark:hover:border-indigo-905 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
              id="fab-option-qa"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2 text-left">
                <div className="p-2.5 bg-indigo-50 border border-indigo-100/70 rounded-xl text-indigo-550 shrink-0 shadow-3xs group-hover:scale-105 transition-transform">
                  <HelpCircle size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200">
                    Saved Exam Q&A
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium font-sans truncate pr-1">
                    Review generated short/long Q&As
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {savedQAsCount > 0 ? (
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md font-bold font-mono text-[9.5px] uppercase tracking-wide shadow-3xs">
                    {savedQAsCount} saved
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md font-bold font-mono text-[9px] uppercase tracking-wide border border-slate-100">
                    0 empty
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Round Floating Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-14 w-14 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 dark:hover:bg-indigo-600 hover:shadow-indigo-700/30 transition-all active:scale-95 focus:outline-none flex items-center justify-center select-none cursor-pointer"
        id="review-main-fab"
        title="Open spaced repetition reviews"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={22} className="stroke-[2.5]" />
            </motion.div>
          ) : (
            <motion.div
              key="brain"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center"
            >
              <Brain size={22} className="stroke-[2]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Outer Notification Badge on the Round FAB */}
        {!isOpen && totalDueCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 bg-rose-600 border-2 border-white dark:border-slate-900 text-white text-[9px] font-mono font-extrabold w-5.5 h-5.5 rounded-full flex items-center justify-center shadow-3xs"
            id="fab-total-badge"
          >
            {totalDueCount}
          </span>
        )}
      </button>

      {/* Spaced Repetition Due Quiz Reviews List Modal */}
      <AnimatePresence>
        {isQuizModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuizModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] text-left"
              id="due-quizzes-modal"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 text-rose-500 rounded-xl">
                    <BookOpenCheck size={18} />
                  </div>
                  <div>
                    <h3 className="font-sans font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      Due Quiz Reviews ({dueQuizzes.length})
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium font-sans">
                      Spaced repetition intervals targeted at active retention boost
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsQuizModalOpen(false)}
                  className="p-1 px-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors border border-transparent"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable List */}
              <div className="p-5 py-4 overflow-y-auto space-y-3 shrink min-h-0">
                {dueQuizzes.length > 0 ? (
                  dueQuizzes.map((item, idx) => {
                    const daysText = item.daysSinceLastReview === 0
                      ? "today"
                      : item.daysSinceLastReview === 1
                        ? "1 day ago"
                        : `${item.daysSinceLastReview} days ago`;

                    return (
                      <div
                        key={idx}
                        className="bg-amber-50/85 dark:bg-amber-950/20 border border-amber-205 dark:border-amber-900/50 rounded-2xl p-4 flex flex-col justify-between hover:shadow-xs transition-all relative overflow-hidden group"
                        id={`modal-due-card-${idx}`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="text-[8.5px] font-extrabold tracking-wider text-amber-700 dark:text-amber-350 bg-amber-100 dark:bg-amber-950/50 border border-amber-200/55 dark:border-amber-900/50 px-2.0 py-0.5 rounded-md uppercase">
                              {item.subject}
                            </span>
                            <span className="text-[8px] font-mono font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Calendar size={10} />
                              STAGE {item.latestAttempt?.stage || 1} • DUE {daysText.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-sans font-extrabold text-xs text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {item.topic}
                            </h4>
                            <p className="text-[10px] text-slate-400 dark:text-slate-405 font-medium leading-normal mt-0.5">
                              Retain this critical topic inside your spaced recall boundaries. Choose to study first or query directly.
                            </p>
                          </div>
                        </div>

                        {/* Actions block */}
                        <div className="mt-3.5 pt-3 border-t border-amber-200/20 dark:border-amber-905 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                          <button
                            onClick={() => {
                              setSelectedSubject(item.subject);
                              setSelectedTopic(item.topic);
                              setCurrentState(AppState.LEARNING_STATE);
                              setIsQuizModalOpen(false);
                            }}
                            className="text-[10px] font-bold text-indigo-650 dark:text-indigo-455 hover:text-indigo-850 dark:hover:text-indigo-350 transition-colors cursor-pointer text-left py-1"
                            id={`btn-modal-explain-${idx}`}
                          >
                            Read tutorial first &rarr;
                          </button>

                          <button
                            onClick={() => {
                              setSelectedSubject(item.subject);
                              setSelectedTopic(item.topic);
                              setCurrentState(AppState.QUIZ_STATE);
                              setIsQuizModalOpen(false);
                            }}
                            className="bg-indigo-600 hover:bg-slate-900 dark:hover:bg-slate-800 hover:scale-[1.02] text-white text-[10px] font-bold px-3.5 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 self-stretch sm:self-auto"
                            id={`btn-modal-review-now-${idx}`}
                          >
                            <span>Quiz Review</span>
                            <Play size={10} className="fill-white" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center p-6 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
                    <div className="mx-auto w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center text-indigo-500">
                      <Brain size={18} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      All Spaced Quizzes Covered!
                    </h4>
                    <p className="text-[10.5px] text-slate-400 font-sans leading-normal max-w-sm mx-auto">
                      There are no curriculum topics currently scheduled for spaced recall review. Continue studying active elective courses!
                    </p>
                  </div>
                )}
              </div>

              {/* Informational Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-900 px-5 flex items-start gap-2.5">
                <Info size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[9.5px] text-slate-400 font-sans leading-normal">
                  Spaced Repetition schedules intervals adaptively depending on your previous score standing. Quizzes scoring 100% advance retention stages furthest.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
