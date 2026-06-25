import React, { useState, useMemo } from "react";
import { SavedFlashcard, getNextRevisionSchedule } from "../types";
import { 
  ArrowLeft, 
  Bookmark, 
  Trash2, 
  RotateCw, 
  Sparkles, 
  CheckCircle,
  AlertCircle,
  Layers,
  ChevronRight,
  BookOpen,
  Calendar,
  Flame,
  Check,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SavedFlashcardsStateViewProps {
  savedFlashcards: SavedFlashcard[];
  setSavedFlashcards: React.Dispatch<React.SetStateAction<SavedFlashcard[]>>;
  onExit: () => void;
  initialReviewCardId?: string | null;
  onClearInitialReviewCardId?: () => void;
}

export default function SavedFlashcardsStateView({
  savedFlashcards,
  setSavedFlashcards,
  onExit,
  initialReviewCardId = null,
  onClearInitialReviewCardId
}: SavedFlashcardsStateViewProps) {
  // Navigation states
  // If initialReviewCardId is passed, we go straight into a "focused card review" mode!
  const [activeTopic, setActiveTopic] = useState<{ subject: string; topic: string } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [focusedSingleCard, setFocusedSingleCard] = useState<SavedFlashcard | null>(() => {
    if (initialReviewCardId) {
      return savedFlashcards.find(fc => fc.id === initialReviewCardId) || null;
    }
    return null;
  });

  // Track isFlipped for single card
  const [singleIsFlipped, setSingleIsFlipped] = useState(false);

  // Group saved flashcards by subject & topic
  const groupedCards = useMemo(() => {
    const map: Record<string, { subject: string; topic: string; cards: SavedFlashcard[] }> = {};
    savedFlashcards.forEach((fc) => {
      const key = `${fc.subject.trim()}::${fc.topic.trim()}`;
      if (!map[key]) {
        map[key] = {
          subject: fc.subject,
          topic: fc.topic,
          cards: []
        };
      }
      map[key].cards.push(fc);
    });
    return Object.values(map);
  }, [savedFlashcards]);

  // Handle removing a flashcard from anywhere
  const handleRemoveCard = (cardId: string) => {
    setSavedFlashcards((prev) => prev.filter((item) => item.id !== cardId));
    // If we're reviewing a list and it empties, or if the index gets out of bounds, adjust
    if (focusedSingleCard?.id === cardId) {
      setFocusedSingleCard(null);
      if (onClearInitialReviewCardId) onClearInitialReviewCardId();
    }
  };

  // Shared function to update card's spaced repetition review schedule
  const handleReviewFeedback = (cardId: string, isSuccessful: boolean) => {
    setSavedFlashcards((prev) =>
      prev.map((fc) => {
        if (fc.id === cardId) {
          const schedule = getNextRevisionSchedule(fc.reviewStage ?? 0, isSuccessful);
          return {
            ...fc,
            reviewStage: schedule.reviewStage,
            nextReviewDate: schedule.nextReviewDate,
            timestamp: new Date().toISOString()
          };
        }
        return fc;
      })
    );

    // After review feedback, either go to next card or close review session
    if (focusedSingleCard && focusedSingleCard.id === cardId) {
      // Clear out of focused mode immediately with a nice feedback indicator
      setSingleIsFlipped(false);
      setTimeout(() => {
        setFocusedSingleCard(null);
        if (onClearInitialReviewCardId) onClearInitialReviewCardId();
      }, 200);
    } else if (activeTopic) {
      // Advance to next card in active topic session
      const topicPair = groupedCards.find(g => g.subject === activeTopic.subject && g.topic === activeTopic.topic);
      const cardsInTopic = topicPair ? topicPair.cards : [];
      setIsFlipped(false);
      
      if (currentIndex < cardsInTopic.length - 1) {
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, 200);
      } else {
        // Finished the deck!
        setTimeout(() => {
          setActiveTopic(null);
          setCurrentIndex(0);
        }, 200);
      }
    }
  };

  // UI rendering for the Single Focused Card Review (from 'Due for Review' dashboard)
  if (focusedSingleCard) {
    const card = focusedSingleCard;
    const isDue = !card.nextReviewDate || new Date(card.nextReviewDate) <= new Date();
    
    return (
      <div className="p-6 sm:p-10 space-y-6 text-left" id="saved-flashcards-focused-review">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100/60 mb-1">
          <button
            onClick={() => {
              setFocusedSingleCard(null);
              if (onClearInitialReviewCardId) onClearInitialReviewCardId();
            }}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold transition-all cursor-pointer"
            id="btn-back-to-vault"
          >
            <ArrowLeft size={14} className="stroke-[2.5]" />
            <span>Back to Flashcards Vault</span>
          </button>
          <div className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-3 py-1 rounded-xl font-extrabold font-mono tracking-wider">
            FOCUS RECALL UNIT
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] font-bold text-indigo-600 font-mono tracking-widest uppercase block">
            {card.subject}
          </span>
          <h2 className="font-sans font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="text-indigo-600" size={17} />
            Focused Review: {card.topic}
          </h2>
          <p className="text-[10px] text-slate-400 font-medium font-sans">
            Spaced repetition session for an individual flagged knowledge item. Give feedback after recall attempt.
          </p>
        </div>

        {/* The interactive card template */}
        <div 
          className="perspective-1000 h-56 w-full cursor-pointer group mt-4" 
          onClick={() => setSingleIsFlipped(!singleIsFlipped)}
          id="saved-flashcard-single-interactive"
        >
          <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${singleIsFlipped ? "rotate-y-180" : ""}`}>
            {/* FRONT */}
            <div className="absolute w-full h-full backface-hidden bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-xs select-none">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-indigo-600 font-mono tracking-widest bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg uppercase">
                  QUESTION PROMPT
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCard(card.id);
                    }}
                    className="p-1 px-1.5 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer flex items-center gap-1 text-[9px] font-bold font-sans"
                    title="Delete permanently"
                    id="delete-single-card-button"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                  <RotateCw size={13} className="text-slate-450 group-hover:text-indigo-600 group-hover:rotate-45 transition-all duration-300" />
                </div>
              </div>
              
              <div className="text-center py-4">
                <h3 className="font-sans font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-relaxed max-w-lg mx-auto w-full break-words">
                  {card.front}
                </h3>
              </div>

              <div className="text-center text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                TAP CARD TO REVEAL DESCRIPTION
              </div>
            </div>

            {/* BACK */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-slate-900 border-2 border-slate-950 rounded-3xl p-6 flex flex-col justify-between shadow-sm select-none">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg uppercase">
                  EXPLANATORY ANSWER
                </span>
                <RotateCw size={13} className="text-slate-400 group-hover:text-emerald-400 transition-all duration-305" />
              </div>
              
              <div className="text-center py-2 overflow-y-auto">
                <p className="font-sans font-medium text-xs sm:text-[13px] text-slate-100 leading-relaxed max-w-lg mx-auto w-full break-words">
                  {card.back}
                </p>
              </div>

              <div className="text-center text-[10px] font-bold text-emerald-400/80 font-mono tracking-wider uppercase">
                ACTIVE RECALL VERIFIED ✓
              </div>
            </div>
          </div>
        </div>

        {/* Dual Feedback Action Prompts */}
        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
          <div className="text-center space-y-1">
            <h4 className="text-xs font-bold text-slate-800">Rate your recall performance:</h4>
            <p className="text-[10px] text-slate-400 font-sans font-medium">
              We'll reschedule your next spaced repetition based on how confident you feel.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleReviewFeedback(card.id, false)}
              className="flex items-center justify-center gap-1.5 px-4 py-3 border border-red-200 bg-red-50 text-red-700 rounded-xl text-xs font-bold hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer active:scale-95"
              id="feedback-still-learning"
            >
              <X size={14} className="stroke-[2.5]" />
              <span>Still learning (1d)</span>
            </button>
            <button
              onClick={() => handleReviewFeedback(card.id, true)}
              className="flex items-center justify-center gap-1.5 px-4 py-3 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer active:scale-95"
              id="feedback-got-it"
            >
              <Check size={14} className="stroke-[2.5]" />
              <span>Got it! (advance)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // UI rendering for the Interactive Deck Slide of a Topic session
  if (activeTopic) {
    const activePair = groupedCards.find(g => g.subject === activeTopic.subject && g.topic === activeTopic.topic);
    const activeDeck = activePair ? activePair.cards : [];
    const card = activeDeck[currentIndex];

    if (!card) {
      return (
        <div className="p-10 text-center space-y-4">
          <AlertCircle className="mx-auto text-slate-400" size={32} />
          <h3 className="text-xs font-bold">Session aligned incorrectly.</h3>
          <button onClick={() => setActiveTopic(null)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
            Back to vault
          </button>
        </div>
      );
    }

    return (
      <div className="p-6 sm:p-10 space-y-6 text-left" id="saved-flashcards-deck-session">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100/60 mb-1">
          <button
            onClick={() => {
              setActiveTopic(null);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold transition-all cursor-pointer"
            id="btn-back-active-topic"
          >
            <ArrowLeft size={14} className="stroke-[2.5]" />
            <span>Exit Study Session</span>
          </button>
          <div className="text-[10px] font-bold font-mono text-slate-400">
            CARD {currentIndex + 1} OF {activeDeck.length}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] font-bold text-indigo-600 font-mono tracking-widest uppercase block">
            {activeTopic.subject}
          </span>
          <h2 className="font-sans font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={17} />
            Studying: {activeTopic.topic}
          </h2>
        </div>

        {/* Slide Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / activeDeck.length) * 100}%` }}
          ></div>
        </div>

        {/* Flip-card UI */}
        <div 
          className="perspective-1000 h-56 w-full cursor-pointer group mt-4" 
          onClick={() => setIsFlipped(!isFlipped)}
          id={`saved-flashcard-session-item-${currentIndex}`}
        >
          <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? "rotate-y-180" : ""}`}>
            {/* FRONT */}
            <div className="absolute w-full h-full backface-hidden bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-xs select-none">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-indigo-600 font-mono tracking-widest bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg uppercase">
                  QUESTION PROMPT
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCard(card.id);
                    }}
                    className="p-1 px-1.5 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer flex items-center gap-1 text-[9px] font-bold font-sans"
                    title="Delete from saved cards"
                    id="delete-deck-card-button"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                  <RotateCw size={13} className="text-slate-450 group-hover:text-indigo-600 group-hover:rotate-45 transition-all duration-300" />
                </div>
              </div>
              
              <div className="text-center py-4">
                <h3 className="font-sans font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-relaxed max-w-lg mx-auto w-full break-words">
                  {card.front}
                </h3>
              </div>

              <div className="text-center text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                TAP CARD TO REVEAL DESCRIPTION
              </div>
            </div>

            {/* BACK */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-slate-900 border-2 border-slate-950 rounded-3xl p-6 flex flex-col justify-between shadow-sm select-none">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg uppercase">
                  EXPLANATORY ANSWER
                </span>
                <RotateCw size={13} className="text-slate-400 group-hover:text-emerald-400 transition-all duration-305" />
              </div>
              
              <div className="text-center py-2 overflow-y-auto">
                <p className="font-sans font-medium text-xs sm:text-[13px] text-slate-100 leading-relaxed max-w-lg mx-auto w-full break-words">
                  {card.back}
                </p>
              </div>

              <div className="text-center text-[10px] font-bold text-emerald-400/80 font-mono tracking-wider uppercase">
                ACTIVE RECALL VERIFIED ✓
              </div>
            </div>
          </div>
        </div>

        {/* Review feedback buttons or progress indicators */}
        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
          <div className="text-center space-y-1">
            <h4 className="text-xs font-bold text-slate-800">Rate your active recall:</h4>
            <p className="text-[10px] text-slate-40s font-sans font-medium">
              We will log your study event and reschedule this card!
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleReviewFeedback(card.id, false)}
              className="flex items-center justify-center gap-1.5 px-4 py-3 border border-red-200 bg-red-50 text-red-700 rounded-xl text-xs font-bold hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer active:scale-95"
              id="deck-feedback-still-learning"
            >
              <X size={14} className="stroke-[2.5]" />
              <span>Still learning (1d)</span>
            </button>
            <button
              onClick={() => handleReviewFeedback(card.id, true)}
              className="flex items-center justify-center gap-1.5 px-4 py-3 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer active:scale-95"
              id="deck-feedback-got-it"
            >
              <Check size={14} className="stroke-[2.5]" />
              <span>Got it! (advance)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main UI rendering: Vault List grouped by Subject & Topic
  return (
    <div className="p-6 sm:p-10 space-y-6 text-left" id="saved-flashcards-vault">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100/60 mb-1">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold transition-all cursor-pointer"
          id="btn-close-flashcards-vault"
        >
          <ArrowLeft size={14} className="stroke-[2.5]" />
          <span>Back to Dashboard</span>
        </button>
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-750 px-2.5 py-1 rounded-xl text-[10px] font-extrabold font-mono tracking-wider select-none uppercase">
          PERMANENT VAULT
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Bookmark className="text-indigo-600 fill-indigo-100" size={20} />
          <h2 className="font-sans font-extrabold text-base text-slate-900 tracking-tight">
            Saved Flashcards
          </h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
          These are your bookmarked retention cards. Unlike temporary session flashcards,
          these stay saved across restarts and have their own distinct **Spaced Repetition** intervals.
        </p>
      </div>

      {savedFlashcards.length === 0 ? (
        <div className="p-8 py-12 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center space-y-4" id="empty-cards-vault">
          <div className="h-12 w-12 rounded-full border border-slate-150 bg-white flex items-center justify-center text-slate-400 mx-auto">
            <Bookmark size={20} />
          </div>
          <div className="space-y-1 mx-auto max-w-sm">
            <h4 className="text-xs font-bold text-slate-800">Your flashcard vault is empty</h4>
            <p className="text-[10.5px] text-slate-400 font-sans leading-normal">
              When reviewing flashcards for any subject context, press the **Bookmark** or **Save** button to store core definitions permanently.
            </p>
          </div>
          <button
            onClick={onExit}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            Go Select Subjects
          </button>
        </div>
      ) : (
        <div className="space-y-6" id="saved-flashcards-vault-contents">
          {groupedCards.map((group, index) => {
            const dueCount = group.cards.filter(c => !c.nextReviewDate || new Date(c.nextReviewDate) <= new Date()).length;

            return (
              <div 
                key={index} 
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4 transition-all hover:border-slate-300"
                id={`saved-group-card-${index}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="text-left space-y-1.5">
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider">
                      {group.subject}
                    </span>
                    <h3 className="font-sans font-extrabold text-sm text-slate-800 tracking-tight">
                      {group.topic}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="bg-slate-100 border border-slate-150 text-slate-700 text-[10px] font-bold font-mono px-2.5 py-1 rounded-xl">
                      {group.cards.length} {group.cards.length === 1 ? "Card" : "Cards"}
                    </div>
                    {dueCount > 0 && (
                      <div className="bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-extrabold font-mono px-2.5 py-1 rounded-xl animate-pulse">
                        {dueCount} DUE
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setActiveTopic({ subject: group.subject, topic: group.topic });
                        setCurrentIndex(0);
                        setIsFlipped(false);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] text-white font-bold text-[10px] px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-98 shadow-sm"
                      id={`btn-study-group-${index}`}
                    >
                      <span>Study Deck</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>

                {/* Vertical Scroll Stack of cards in this topic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id={`group-grid-${index}`}>
                  {group.cards.map((c) => {
                    const nextReviewAt = c.nextReviewDate ? new Date(c.nextReviewDate) : null;
                    const formattedDate = nextReviewAt ? nextReviewAt.toLocaleDateString() : "Due Now";
                    const isCardDue = !nextReviewAt || nextReviewAt <= new Date();

                    return (
                      <div 
                        key={c.id} 
                        className="p-3.5 border border-slate-150 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all flex justify-between gap-4"
                        id={`vault-card-row-${c.id}`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0 text-left">
                          <p className="font-sans font-extrabold text-xs text-slate-800 leading-snug tracking-tight break-words truncate">
                            {c.front}
                          </p>
                          <p className="font-sans font-medium text-[10.5px] text-slate-550 leading-relaxed break-words line-clamp-2">
                            {c.back}
                          </p>
                          <div className="flex items-center gap-3 text-[9.5px] text-slate-400 font-medium pt-1 font-sans">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} className="text-slate-400" />
                              Next Review: <strong>{isCardDue ? <span className="text-rose-600 font-bold">Overdue / Today</span> : formattedDate}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Flame size={11} className="text-slate-400" />
                              Stage: <strong>{c.reviewStage ?? 0}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 justify-between items-end shrink-0">
                          <button
                            onClick={() => handleRemoveCard(c.id)}
                            className="p-1 px-1.5 bg-white hover:bg-red-50 hover:border-red-200 border border-slate-200 text-slate-400 hover:text-red-650 rounded-lg transition-all cursor-pointer"
                            title="Remove flashcard"
                            id={`remove-vault-card-${c.id}`}
                          >
                            <Trash2 size={13} />
                          </button>
                          
                          <button
                            onClick={() => setFocusedSingleCard(c)}
                            className="text-[9.5px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer whitespace-nowrap"
                            id={`study-single-card-${c.id}`}
                          >
                            Test card &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
