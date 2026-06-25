import React, { useEffect, useState } from "react";
import { Flashcard, MissedQuestion } from "../types";
import { 
  Layers, 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw, 
  HelpCircle, 
  Sparkles, 
  RotateCw, 
  CheckCircle2, 
  BookOpen, 
  Flame, 
  Loader2, 
  AlertCircle,
  Bookmark
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SavedFlashcard } from "../types";

interface FlashcardStateViewProps {
  onFinish: () => void;
  selectedSubject: string | null;
  selectedTopic: string | null;
  missedQuestions: MissedQuestion[];
  curriculumLevel?: string;
  uploadedContent?: string | null;
  onExit: () => void;
  savedFlashcards?: SavedFlashcard[];
  onToggleSaveFlashcard?: (card: Flashcard, subject: string, topic: string) => void;
}

export default function FlashcardStateView({
  onFinish,
  selectedSubject,
  selectedTopic,
  missedQuestions,
  curriculumLevel,
  uploadedContent,
  onExit,
  savedFlashcards = [],
  onToggleSaveFlashcard
}: FlashcardStateViewProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Focus & interaction states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = cards[currentIndex];

  const isSaved = !currentCard ? false : savedFlashcards.some(
    (item) =>
      item.front.trim().toLowerCase() === currentCard.front.trim().toLowerCase() &&
      item.subject.trim().toLowerCase() === (selectedSubject || "General").trim().toLowerCase()
  );

  const fetchFlashcards = async () => {
    if (!selectedSubject || !selectedTopic) {
      setError("Subject or Topic was not selected correctly.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setIsFlipped(false);
    try {
      const response = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: selectedSubject,
          topic: selectedTopic,
          missedQuestions: missedQuestions,
          curriculumLevel: curriculumLevel,
          uploadedContent: uploadedContent,
        }),
      });

      if (!response.ok) {
        let errorMsg = "Failed to retrieve adaptive flashcards.";
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const errData = await response.json();
            errorMsg = errData.error || errorMsg;
          } catch (_) {}
        } else {
          try {
            const textText = await response.text();
            if (textText.includes("<!DOCTYPE") || textText.includes("<html")) {
              errorMsg = "Server returned an unexpected HTML response from flashcard generator. The backend server may have restarted.";
            } else {
              errorMsg = textText || errorMsg;
            }
          } catch (_) {}
        }
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server did not return a valid JSON response.");
      }

      const data = await response.json();
      if (!data.flashcards || !Array.isArray(data.flashcards) || data.flashcards.length === 0) {
        throw new Error("Academic engine returned an empty set of flashcards.");
      }
      setCards(data.flashcards);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during review card synthesis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [selectedSubject, selectedTopic, missedQuestions, curriculumLevel, uploadedContent]);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
      }, 150);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="p-6 sm:p-10 space-y-6 text-left" id="flashcard-workspace-viewport">
      {/* Exit Action Row at the very top */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100/60 dark:border-slate-800 pb-3 mb-1">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-100 text-xs font-bold transition-all cursor-pointer"
          id="btn-exit-to-dashboard"
        >
          <ArrowLeft size={14} className="stroke-[2.5]" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Header Area */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-850">
        <div className="space-y-1 text-left">
          <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-widest uppercase block">
            {selectedSubject || "GENERAL DISCIPLINE"}
          </span>
          <h2 className="font-sans font-extrabold text-base text-slate-905 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Layers className="text-indigo-600 dark:text-indigo-400" size={18} />
            {selectedTopic ? `${selectedTopic} Review` : "Active Recall"}
          </h2>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/45 border border-emerald-100/60 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-350 px-3 py-1 rounded-xl text-[10px] font-extrabold font-mono tracking-wider shrink-0 uppercase tracking-widest">
          ACTIVE RECALL
        </div>
      </div>

      {uploadedContent && (
        <div className="flex items-center gap-2.5 p-3 px-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold leading-snug shadow-3xs" id="flashcards-grounded-badge">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span>
            Grounded Mode Active: Flashcards compiled <strong>strictly and exclusively</strong> from this topic's specific uploaded source text slice.
          </span>
        </div>
      )}

      {loading ? (
        /* LOADING / COMPILING STATE */
        <div className="space-y-6 py-12" id="flashcards-loading-view">
          <div className="flex flex-col items-center justify-center space-y-3 py-6">
            <Loader2 className="text-indigo-600 dark:text-indigo-400 animate-spin" size={32} />
            <div className="text-center space-y-1">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-150 tracking-tight">Synthesizing Core Concepts...</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium font-sans">Compiling {missedQuestions.length > 0 ? "remedial" : "topic"} study metrics into interactive memory loops.</p>
            </div>
          </div>
          <div className="h-44 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800 rounded-2xl w-full animate-pulse mt-6"></div>
        </div>
      ) : error ? (
        /* ERROR COMPILATION STATE */
        <div className="p-6 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-4 text-center py-10" id="flashcards-error-box">
          <div className="mx-auto h-12 w-12 rounded-full bg-rose-100 border border-rose-200/40 flex items-center justify-center text-rose-600 mb-2">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className="text-xs font-extrabold text-rose-955 uppercase tracking-wider">Reinforcement Engine Offline</h4>
            <p className="text-[11px] text-rose-700 leading-relaxed font-semibold">
              {error}
            </p>
          </div>
          <button
            onClick={fetchFlashcards}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <RefreshCw size={12} />
            <span>Re-synthesize Flashcards</span>
          </button>
        </div>
      ) : !currentCard ? (
        /* SAFE OUT OF BOUNDS / SYNCHRONIZING BLOCK */
        <div className="space-y-6 py-12 text-center" id="flashcards-aligning-view">
          <Loader2 className="text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" size={32} />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-150 tracking-tight">Aligning active session...</h4>
            <p className="text-[10px] text-slate-405 dark:text-slate-500 font-medium font-sans">Matching recall indexes with the synthesized deck matrix.</p>
          </div>
        </div>
      ) : (
        /* SUCCESS INTERACTIVE DECK STATE */
        <div className="space-y-6" id="flashcards-active-workspace">
          {/* Deck status indicator card tracker */}
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 text-[10px] font-bold font-mono tracking-wider">
            <span>MEMORIZATION RUN</span>
            <span>CARD {currentIndex + 1} OF {cards.length}</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            ></div>
          </div>

          {/* Interactive Flip Card 3D container */}
          <div 
            className="perspective-1000 h-56 w-full cursor-pointer group" 
            onClick={handleFlip}
            id={`flashcard-item-${currentIndex}`}
          >
            <div 
              className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? "rotate-y-180" : ""}`}
            >
              {/* CARD FRONT SIDE */}
              <div className="absolute w-full h-full backface-hidden bg-white dark:bg-slate-850 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xs select-none">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-widest bg-indigo-50 dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900 px-2.5 py-1 rounded-lg uppercase">
                    QUESTION PROMPT
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleSaveFlashcard) {
                          onToggleSaveFlashcard(currentCard, selectedSubject || "General", selectedTopic || "General Topic");
                        }
                      }}
                      className="p-1 px-1.5 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-200 text-indigo-650 dark:text-indigo-400 transition-all cursor-pointer flex items-center gap-1 text-[9px] font-bold font-sans"
                      title={isSaved ? "Remove from saved cards" : "Save this card"}
                      id="save-flashcard-front"
                    >
                      <Bookmark size={12} className={isSaved ? "fill-indigo-605 text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-505"} />
                      <span>{isSaved ? "Saved" : "Save"}</span>
                    </button>
                    <RotateCw size={13} className="text-slate-450 dark:text-slate-500 group-hover:text-indigo-605 dark:group-hover:text-indigo-400 group-hover:rotate-45 transition-all duration-300" />
                  </div>
                </div>
                
                <div className="text-center py-4">
                  <h3 className="font-sans font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight leading-relaxed max-w-lg mx-auto w-full break-words">
                    {currentCard.front}
                  </h3>
                </div>

                <div className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider">
                  TAP CARD TO REVEAL DESCRIPTION
                </div>
              </div>

              {/* CARD BACK SIDE */}
              <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-slate-900 dark:bg-slate-950 border-2 border-slate-950 rounded-3xl p-6 flex flex-col justify-between shadow-sm select-none">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg uppercase">
                    EXPLANATORY ANSWER
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleSaveFlashcard) {
                          onToggleSaveFlashcard(currentCard, selectedSubject || "General", selectedTopic || "General Topic");
                        }
                      }}
                      className="p-1 px-1.5 rounded-lg border border-slate-800 bg-slate-800 text-emerald-450 transition-all cursor-pointer hover:bg-slate-750 hover:border-slate-700 flex items-center gap-1 text-[9px] font-bold font-sans"
                      title={isSaved ? "Remove from saved cards" : "Save this card"}
                      id="save-flashcard-back"
                    >
                      <Bookmark size={12} className={isSaved ? "fill-emerald-400 text-emerald-400" : "text-slate-550"} />
                      <span>{isSaved ? "Saved" : "Save"}</span>
                    </button>
                    <RotateCw size={13} className="text-slate-400 group-hover:text-emerald-400 transition-all duration-305" />
                  </div>
                </div>
                
                <div className="text-center py-2 overflow-y-auto">
                  <p className="font-sans font-medium text-xs sm:text-[13px] text-slate-100 leading-relaxed max-w-lg mx-auto w-full break-words">
                    {currentCard.back}
                  </p>
                </div>

                <div className="text-center text-[10px] font-bold text-emerald-400/80 font-mono tracking-wider uppercase">
                  ACTIVE RECALL VERIFIED ✓
                </div>
              </div>
            </div>
          </div>

          {/* Remedial contextual hints if review was flagged */}
          {missedQuestions.length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <Sparkles size={11} className="text-amber-500 shrink-0" />
              <span>Tailoring Engine active: Focus on correcting identified misconception areas first.</span>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-150 dark:border-slate-805 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                disabled={currentIndex === 0}
                onClick={handlePrev}
                className={`p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-205 dark:border-slate-750 rounded-xl text-slate-600 dark:text-slate-300 transition-all active:scale-95 ${currentIndex === 0 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                id="btn-flashcard-prev-card"
                title="Previous Card"
              >
                <ArrowLeft size={16} />
              </button>

              <button
                disabled={currentIndex === cards.length - 1}
                onClick={handleNext}
                className={`p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-205 dark:border-slate-750 rounded-xl text-slate-600 dark:text-slate-300 transition-all active:scale-95 ${currentIndex === cards.length - 1 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                id="btn-flashcard-next-card"
                title="Next Card"
              >
                <ArrowRight size={16} />
              </button>
            </div>

            {currentIndex === cards.length - 1 ? (
              <button
                onClick={onFinish}
                className="flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-150/40 transition-all cursor-pointer active:scale-98"
                id="btn-flashcard-finish-review"
              >
                <CheckCircle2 size={13} />
                <span>Finish & Complete Unit</span>
              </button>
            ) : (
              <span className="text-[10px] text-slate-350 dark:text-slate-500 font-bold font-mono tracking-wider mr-1">
                CYCLE TO END TO LOG COMPLETION
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
