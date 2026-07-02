import { renderMathText } from "../utils/renderMathText";
import { cleanForSpeech } from "../utils/cleanForSpeech";
import React, { useEffect, useState } from "react";
import { GraduationCap, ArrowRight, ArrowLeft, Sparkles, Lightbulb, ClipboardList, Loader2, AlertCircle, RefreshCw, BookOpen, Compass, HelpCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LearningStateViewProps {
  onNext: () => void;
  selectedSubject: string | null;
  selectedTopic: string | null;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  curriculumLevel: string;
  uploadedContent?: string | null;
  onModelUsed?: (model: string) => void;
  onExit: () => void;
  onContentLoaded?: () => void;
  learningGoal?: "exam_prep" | "deep_understanding";
  learningMode?: "read" | "listen";
  detailLevel?: "concise" | "standard" | "comprehensive";
  onSaveQAPairs?: (qas: { question: string; answer: string }[]) => void;
  onDifficultyChange?: (newDifficulty: "beginner" | "intermediate" | "advanced") => void;
}

interface SubConcept {
  name: string;
  description: string;
}

interface PracticeQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  reason: string;
}

interface ExamQA {
  question: string;
  answer: string;
}

interface LearningContent {
  explanation: string;
  subConcepts?: SubConcept[];
  connections?: string;
  commonMisconceptions?: string[];
  example: string;
  recap: string[];
  practiceQuestions?: PracticeQuestion[];
  examQAs?: ExamQA[];
  conceptualPointers?: string[];
  caseStudy: string | null;
  wordCount: number;
}

export default function LearningStateView({
  onNext,
  selectedSubject,
  selectedTopic,
  difficultyLevel,
  curriculumLevel,
  uploadedContent,
  onModelUsed,
  onExit,
  onContentLoaded,
  learningGoal = "deep_understanding",
  learningMode = "read",
  detailLevel = "standard",
  onSaveQAPairs,
  onDifficultyChange
}: LearningStateViewProps) {
  const [content, setContent] = useState<LearningContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDifficultySelector, setShowDifficultySelector] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  const handleSelectDifficulty = (level: "beginner" | "intermediate" | "advanced") => {
    if (level === difficultyLevel) {
      setShowDifficultySelector(false);
      return;
    }
    if (onDifficultyChange) {
      onDifficultyChange(level);
    }
    setShowDifficultySelector(false);
    const capitalized = level.charAt(0).toUpperCase() + level.slice(1);
    setConfirmationMessage(`Difficulty set to ${capitalized}`);
  };

  useEffect(() => {
    if (confirmationMessage) {
      const timer = setTimeout(() => {
        setConfirmationMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmationMessage]);
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);

  const [isGeneratingLongAnswers, setIsGeneratingLongAnswers] = useState(false);
  const [answersType, setAnswersType] = useState<"short" | "long">("short");
  const [longAnswers, setLongAnswers] = useState<Record<string, string>>({});
  const [longAnswersError, setLongAnswersError] = useState<string | null>(null);

  const handleGenerateLongAnswers = async () => {
    if (!content?.examQAs || content.examQAs.length === 0) return;
    setIsGeneratingLongAnswers(true);
    setLongAnswersError(null);
    try {
      const questionsList = content.examQAs.map(q => q.question);
      const response = await fetch("/api/generate-long-answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: selectedSubject,
          topic: selectedTopic,
          difficulty: difficultyLevel,
          curriculumLevel: curriculumLevel,
          questions: questionsList,
          uploadedContent: uploadedContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate long answers. Please check server.");
      }

      const data = await response.json();
      if (data.longAnswers && Array.isArray(data.longAnswers)) {
        const answersMap: Record<string, string> = {};
        const savedQAs: { question: string; answer: string }[] = [];
        
        content.examQAs.forEach((item) => {
          const match = data.longAnswers.find((la: any) => 
            la.question.trim().toLowerCase() === item.question.trim().toLowerCase()
          );
          const longAns = match ? match.longAnswer : null;
          if (longAns) {
            answersMap[item.question] = longAns;
            savedQAs.push({ question: item.question, answer: longAns });
          } else {
            answersMap[item.question] = item.answer;
            savedQAs.push({ question: item.question, answer: item.answer });
          }
        });

        setLongAnswers(answersMap);
        setAnswersType("long");
        
        if (onSaveQAPairs && savedQAs.length > 0) {
          onSaveQAPairs(savedQAs);
        }
      } else {
        throw new Error("Malformed format returned for long answers.");
      }
    } catch (err: any) {
      console.error(err);
      setLongAnswersError(err.message || "Failed to generate long answers.");
    } finally {
      setIsGeneratingLongAnswers(false);
    }
  };

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = () => {
    if (!window.speechSynthesis) return;
    
    if (isSpeaking) {
      if (isSpeechPaused) {
        window.speechSynthesis.resume();
        setIsSpeechPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsSpeechPaused(true);
      }
    } else {
      window.speechSynthesis.cancel();
      const textToSpeak = `${selectedTopic}. Explanation. ${content?.explanation}.`;
      const utter = new SpeechSynthesisUtterance(textToSpeak);
      utter.onend = () => {
        setIsSpeaking(false);
        setIsSpeechPaused(false);
      };
      utter.onerror = () => {
        setIsSpeaking(false);
        setIsSpeechPaused(false);
      };
      setIsSpeaking(true);
      setIsSpeechPaused(false);
      window.speechSynthesis.speak(utter);
    }
  };

  const handleStopSpeak = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsSpeechPaused(false);
  };

  const fetchLearningMaterial = async () => {
    if (!selectedSubject || !selectedTopic) {
      setError("Subject or Topic was not selected correctly.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-learning-material", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: selectedSubject,
          topic: selectedTopic,
          difficulty: difficultyLevel,
          curriculumLevel: curriculumLevel,
          uploadedContent: uploadedContent,
          learningGoal: learningGoal,
          detailLevel: detailLevel,
        }),
      });

      if (!response.ok) {
        let errorMsg = "Failed to fetch response from academic engine.";
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
              errorMsg = "Server returned an unexpected HTML response. The backend server may have restarted or experienced a disruption.";
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

      const modelHeader = response.headers.get("x-model-used");
      const data = await response.json();
      setContent(data);
      if (data.examQAs && data.examQAs.length > 0 && onSaveQAPairs) {
        onSaveQAPairs(data.examQAs);
      }
      if (onContentLoaded) {
        onContentLoaded();
      }
      if (modelHeader && onModelUsed) {
        onModelUsed(modelHeader);
      } else if (data.modelUsed && onModelUsed) {
        onModelUsed(data.modelUsed);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearningMaterial();
  }, [selectedSubject, selectedTopic, difficultyLevel, curriculumLevel, uploadedContent]);

  useEffect(() => {
    if (content && learningMode === "listen") {
      const timer = setTimeout(() => {
        handleSpeak();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [content, learningMode]);

  // Split explanation paragraphs neatly
  const paragraphs = content?.explanation
    ? content.explanation.split("\n\n").filter(p => p.trim())
    : [];

  const getDifficultyBadgeClasses = () => {
    switch (difficultyLevel) {
      case "advanced":
        return "bg-rose-50 border-rose-100 text-rose-700";
      case "intermediate":
        return "bg-indigo-50 border-indigo-100 text-indigo-700";
      case "beginner":
      default:
        return "bg-emerald-50 border-emerald-100 text-emerald-700";
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-6 text-left" id="learning-workspace-viewport">
      {/* Exit Action Row at the very top */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100/60 dark:border-slate-805 pb-3 mb-1">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-slate-500 dark:text-slate-405 hover:text-slate-800 dark:hover:text-slate-100 text-xs font-bold transition-all cursor-pointer"
          id="btn-exit-to-dashboard"
        >
          <ArrowLeft size={14} className="stroke-[2.5]" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-805 gap-3">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-widest uppercase block">
              {selectedSubject || "GENERAL DISCIPLINE"}
            </span>
            
            {/* Interactive Difficulty Badge */}
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setShowDifficultySelector(!showDifficultySelector)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-bold font-mono tracking-wide rounded-full border uppercase transition-all hover:opacity-85 active:scale-95 cursor-pointer ${getDifficultyBadgeClasses()}`}
                id="btn-tappable-difficulty-badge"
                title="Tap to change difficulty"
              >
                <span>{difficultyLevel}</span>
                <span className="text-[7px] opacity-70">▼</span>
              </button>

              {/* Compact Inline Selector dropdown */}
              <AnimatePresence>
                {showDifficultySelector && (
                  <>
                    {/* Backdrop to close click outside */}
                    <div 
                      className="fixed inset-0 z-50 cursor-default" 
                      onClick={() => setShowDifficultySelector(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      className="absolute left-0 mt-1.5 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-[60] flex items-center gap-1 whitespace-nowrap"
                      id="difficulty-selector-dropdown"
                    >
                      {(["beginner", "intermediate", "advanced"] as const).map((level) => {
                        const isActive = difficultyLevel === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => handleSelectDifficulty(level)}
                            className={`px-2.5 py-1 text-[9px] font-extrabold font-mono uppercase rounded-lg transition-all cursor-pointer ${
                              isActive
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {content?.wordCount && (
              <span className="inline-flex px-2 py-0.5 text-[9px] font-bold font-mono tracking-wide rounded-full border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/40">
                {content.wordCount} words
              </span>
            )}
          </div>
          <h2 className="font-sans font-extrabold text-base text-slate-905 dark:text-slate-100 tracking-tight flex items-center gap-2 flex-wrap">
            <GraduationCap className="text-indigo-605 dark:text-indigo-400 shrink-0" size={18} />
            {selectedTopic || "Overview Topic"}
          </h2>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/60 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-xl text-[10px] font-extrabold font-mono tracking-wider shrink-0 uppercase tracking-widest align-self-start sm:align-self-auto">
          STUDY DECK
        </div>
      </div>

      {uploadedContent && (
        <div className="flex items-center gap-2.5 p-3 px-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold leading-snug shadow-3xs" id="learning-grounded-badge">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span>
            Grounded Mode Active: Explanation drawn <strong>strictly and exclusively</strong> from this topic's specific uploaded source text slice. No external generalizations added.
          </span>
        </div>
      )}

      {/* Main Content Area with conditional states */}
      {loading ? (
        /* LOADING / SKELETON STATE */
        <div className="space-y-6 py-8" id="learning-loading-skeleton">
          <div className="flex flex-col items-center justify-center space-y-3 py-6">
            <Loader2 className="text-indigo-605 dark:text-indigo-400 animate-spin" size={32} />
            <div className="text-center space-y-1">
              <h4 className="text-xs font-bold text-slate-805 dark:text-slate-150 tracking-tight">Consulting AI Academic Engine...</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Drafting comprehensive lesson notes with real-world examples.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-5/6 animate-pulse"></div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-full animate-pulse"></div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-4/5 animate-pulse"></div>
            
            <div className="h-24 bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 rounded-2xl w-full animate-pulse mt-6"></div>
          </div>
        </div>
      ) : error ? (
        /* ERROR STATE */
        <div className="p-6 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-4 text-center py-10" id="learning-error-box">
          <div className="mx-auto h-12 w-12 rounded-full bg-rose-105 border border-rose-200/40 flex items-center justify-center text-rose-600 mb-2">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className="text-xs font-extrabold text-rose-955 uppercase tracking-wider">Academic Engine Offline</h4>
            <p className="text-[11px] text-rose-700 leading-relaxed font-semibold">
              {error}
            </p>
          </div>
          <button
            onClick={fetchLearningMaterial}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <RefreshCw size={12} />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : (
        /* SUCCESS CONTENT STATE */
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
          id="learning-success-content"
        >
          {/* Brief Confirmation Banner */}
          <AnimatePresence>
            {confirmationMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                className="overflow-hidden"
              >
                <div 
                  className="flex items-center gap-2 p-2.5 px-4 bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-indigo-700 dark:text-indigo-405 text-xs font-bold shadow-3xs"
                  id="difficulty-confirmation-badge"
                >
                  <Sparkles size={12} className="text-indigo-500 animate-pulse shrink-0" />
                  <span>{confirmationMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Narrator TTS Control Box */}
          {typeof window !== "undefined" && window.speechSynthesis && (
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors ${isSpeaking ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-900" : "bg-slate-50/50 dark:bg-slate-900/10 border-slate-150 dark:border-slate-805"}`}>
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${isSpeaking ? "bg-indigo-600 dark:bg-indigo-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                  <Compass size={16} className={isSpeaking && !isSpeechPaused ? "animate-pulse" : ""} />
                </span>
                <div className="text-left animate-fade-in">
                  <h4 className="text-xs font-bold text-slate-805 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                    <span>AI Audio Companion</span>
                    {isSpeaking && (
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {isSpeaking 
                      ? (isSpeechPaused ? "Narration paused. Click resume to continue." : "Actively reading lesson explanation aloud...")
                      : "Listen to the lesson explanation narrated dynamically."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <button
                  onClick={handleSpeak}
                  className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer ${
                    isSpeaking 
                      ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-350" 
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                  id="btn-narration-toggle"
                >
                  <span>{isSpeaking ? (isSpeechPaused ? "Resume" : "Pause") : "Listen Out Loud"}</span>
                </button>
                {isSpeaking && (
                  <button
                    onClick={handleStopSpeak}
                    className="p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100/60 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-850 text-rose-700 dark:text-rose-400 rounded-xl leading-none transition-all cursor-pointer flex items-center justify-center shrink-0"
                    title="Stop Narration"
                    id="btn-narration-stop"
                  >
                    <RefreshCw size={11} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Explanation paragraphs */}
          <div className="space-y-4 text-slate-700 dark:text-slate-300 text-xs md:text-[13px] leading-relaxed font-sans font-medium" id="learning-explanation-box">
            {paragraphs.map((para, idx) => (
              <p key={idx} className="first-of-type:font-semibold first-of-type:text-slate-800 dark:first-of-type:text-slate-200">
                {para}
              </p>
            ))}
          </div>

          {/* Key Sub-concepts & Core Components Section */}
          {content?.subConcepts && content.subConcepts.length > 0 && (
            <div className="space-y-3.5" id="learning-subconcepts-section">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-lg text-indigo-700 dark:text-indigo-300 leading-none shrink-0 flex items-center justify-center">
                  <BookOpen size={13} className="text-indigo-650 dark:text-indigo-400" />
                </span>
                <h3 className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200 tracking-tight uppercase tracking-wider">
                  Key Curriculum Components
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {content.subConcepts.map((sub, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-slate-205 dark:hover:border-slate-700 transition-all shadow-3xs space-y-1.5"
                    id={`subconcept-card-${idx}`}
                  >
                    <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-mono font-bold text-[9px]">
                      0{idx + 1}
                    </span>
                    <h4 className="font-sans font-extrabold text-xs text-slate-909 dark:text-slate-100 tracking-tight">
                      {sub.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {sub.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Syllabus Connections Section */}
          {content?.connections && (
            <div className="p-5 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/40 rounded-2xl space-y-2.5 relative overflow-hidden" id="learning-connections-box">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex items-center gap-2">
                <span className="p-1 bg-indigo-100/50 dark:bg-indigo-950/50 border border-indigo-150 dark:border-indigo-900 rounded-lg text-indigo-705 dark:text-indigo-305 leading-none shrink-0 flex items-center justify-center">
                  <Compass size={13} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
                </span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">Syllabus Connections</h4>
              </div>
              <p className="text-[11px] md:text-xs text-slate-605 dark:text-slate-400 leading-relaxed font-medium">
                {content.connections}
              </p>
            </div>
          )}

          {/* Common Misconceptions Section */}
          {content?.commonMisconceptions && content.commonMisconceptions.length > 0 && (
            <div className="p-5 bg-rose-50/30 border border-rose-100/40 rounded-2xl space-y-3" id="learning-misconceptions-box">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-rose-100/60 border border-rose-150 rounded-lg text-rose-700 leading-none shrink-0 flex items-center justify-center">
                  <HelpCircle size={13} className="text-rose-600" />
                </span>
                <h4 className="text-xs font-bold text-slate-850 tracking-tight">Common Misconceptions</h4>
              </div>
              <ul className="space-y-2.5 pl-1">
                {content.commonMisconceptions.map((mis, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-[11px] md:text-xs text-slate-600 font-medium">
                    <span className="text-rose-500 font-bold shrink-0 mt-0.5 select-none text-xs">⚠️</span>
                    <span className="leading-relaxed">{mis}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Highlighted Real-world Example Box */}
          {content?.example && (
            <div 
              className="p-5 bg-amber-50/40 border border-amber-100/60 rounded-2xl space-y-2.5 relative overflow-hidden" 
              id="learning-example-box"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/10 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex items-center gap-2">
                <span className="p-1 bg-amber-100/80 border border-amber-200/40 rounded-lg text-amber-700 leading-none shrink-0 flex items-center justify-center">
                  <Lightbulb size={13} fill="currentColor" className="text-amber-500 border-none" />
                </span>
                <h4 className="text-xs font-bold text-slate-800 tracking-tight">Relatable Real-World Case</h4>
              </div>
              <p className="text-[11px] md:text-xs text-slate-600 leading-relaxed font-medium">
                {content.example}
              </p>
            </div>
          )}

          {/* Distinct Case Study Card */}
          {content?.caseStudy && (
            <div 
              className="p-5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 rounded-2xl space-y-3 relative overflow-hidden" 
              id="learning-case-study-box"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex items-center gap-2">
                <span className="p-1 bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-900 rounded-lg text-indigo-700 dark:text-indigo-300 leading-none shrink-0 flex items-center justify-center">
                  <GraduationCap size={13} className="text-indigo-600 dark:text-indigo-400" />
                </span>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">Historically Accurate Case Study</h4>
                </div>
              </div>
              <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                {content.caseStudy}
              </p>
            </div>
          )}

          {/* Recap summary list */}
          {content?.recap && content.recap.length > 0 && (
            <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3" id="learning-recap-box">
              <div className="flex items-center gap-2">
                <span className="p-1 px-1.5 bg-slate-150 border border-slate-200 rounded-lg text-slate-700 leading-none shrink-0 block">
                  <ClipboardList size={13} className="text-indigo-600" />
                </span>
                <h4 className="text-xs font-bold text-slate-800 tracking-tight">Key Takeaway Recap</h4>
              </div>
              <ul className="space-y-2 pl-1">
                {content.recap.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[11px] md:text-xs text-slate-600 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0 animate-pulse"></span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Exam Prep Q&A Pairs as primary study material */}
          {learningGoal === "exam_prep" && content?.examQAs && content.examQAs.length > 0 && (
            <div className="p-5 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900 rounded-2xl space-y-5" id="learning-exam-qa-box">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-200/40 dark:border-indigo-900 rounded-lg text-indigo-700 dark:text-indigo-350 leading-none shrink-0 flex items-center justify-center">
                    <BookOpen size={13} className="text-indigo-600 dark:text-indigo-400" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-1.5">
                      <span>Exam Q&A Preparation Pairs</span>
                      <span className="text-[10px] bg-indigo-100/70 border border-indigo-200 px-1.5 py-0.5 rounded-full font-mono text-indigo-700 leading-none">
                        {content.examQAs.length} Pairs
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-0.5">
                      {answersType === "short" 
                        ? "Active recall pairs with concise 1-3 sentence answers." 
                        : "Fully expanded and detailed academic paragraph answers."
                      }
                    </p>
                  </div>
                </div>

                {answersType === "long" && (
                  <button
                    onClick={() => setAnswersType(prev => prev === "short" ? "long" : "short")}
                    className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg"
                  >
                    Switch to {answersType === "short" ? "Long" : "Short"} Answers
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {content.examQAs.map((item, idx) => {
                  const hasLong = longAnswers[item.question];
                  const currentAnswer = (answersType === "long" && hasLong) ? hasLong : item.answer;

                  return (
                    <div 
                      key={idx} 
                      className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2.5 text-left transition-all"
                    >
                      <div className="flex gap-2.5 items-start">
                        <span className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100/50 flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                          Q{idx + 1}
                        </span>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-normal pt-0.5 select-all">
                          {item.question}
                        </p>
                      </div>

                      <div className="flex gap-2.5 items-start pl-1">
                        <span className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/50 flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                          A
                        </span>
                        <div className="flex-1 text-[11.5px] font-medium text-slate-605 dark:text-slate-300 leading-relaxed pt-0.5">
                          {currentAnswer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Generate Long Answers Button & Info */}
              {answersType === "short" && (
                <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-3">
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-medium text-slate-500">
                      Need deeper academic context for these study questions before your exam?
                    </p>
                    {longAnswersError && (
                      <p className="text-[9.5px] text-rose-500 font-semibold">{longAnswersError}</p>
                    )}
                  </div>
                  <button
                    onClick={handleGenerateLongAnswers}
                    disabled={isGeneratingLongAnswers}
                    className="w-full sm:w-auto px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100/80 active:scale-[0.985] text-indigo-700 border border-indigo-200/60 rounded-xl font-bold text-xs shadow-3xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isGeneratingLongAnswers ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-indigo-600" />
                        <span>Generating Expanded Answers...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} className="text-indigo-600 animate-pulse" />
                        <span>Generate Long Answers (Full Paragraphs)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Key Conceptual Pointers section below Q&A */}
          {learningGoal === "exam_prep" && content?.conceptualPointers && content.conceptualPointers.length > 0 && (
            <div className="p-5 bg-amber-50/25 border border-amber-100 rounded-2xl space-y-3 relative overflow-hidden" id="learning-conceptual-pointers-box">
              <div className="flex items-center gap-2">
                <span className="p-1 px-1.5 bg-amber-105/65 border border-amber-200/50 rounded-lg text-amber-700 leading-none shrink-0 block">
                  <Lightbulb size={13} className="text-amber-600" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 tracking-tight">Key Conceptual Pointers</h4>
                  <p className="text-[9.5px] text-slate-400 mt-0.5 leading-none">Curriculum nuances flagged by examiners to prevent confusion</p>
                </div>
              </div>
              <ul className="space-y-2.5 pl-1">
                {content.conceptualPointers.map((pointer, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-[11px] md:text-sm text-slate-650 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                    <span className="leading-relaxed text-left flex-1">{pointer}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prompt Action Area */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-805 flex items-center justify-between gap-4">
            <div className="text-left hidden sm:block">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">READY FOR ASSESSMENT?</span>
              <span className="text-[11px] text-indigo-605 dark:text-indigo-400 font-semibold font-mono">Unlock next quiz state</span>
            </div>
            
            <button
              onClick={onNext}
              disabled={loading || !content}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-150/20 transition-all cursor-pointer ${(!content || loading) ? "opacity-50 cursor-not-allowed animate-pulse" : ""}`}
              id="btn-learning-take-quiz"
            >
              <span>Take Checkpoint Quiz</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
