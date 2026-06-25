import React, { useEffect, useState } from "react";
import { QuizQuestion, MissedQuestion } from "../types";
import { 
  HelpCircle, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  Award, 
  ChevronRight, 
  Sparkles,
  Info,
  CalendarDays
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QuizStateViewProps {
  onReviewFlashcards: (missed: MissedQuestion[]) => void;
  selectedSubject: string | null;
  selectedTopic: string | null;
  onQuizComplete: (score: number, totalQuestions: number, questions?: QuizQuestion[]) => void;
  difficultyFeedback?: string | null;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  curriculumLevel: string;
  uploadedContent?: string | null;
  onModelUsed?: (model: string) => void;
  onExit: () => void;
  learningGoal?: "exam_prep" | "deep_understanding";
}

export default function QuizStateView({
  onReviewFlashcards,
  selectedSubject,
  selectedTopic,
  onQuizComplete,
  difficultyFeedback,
  difficultyLevel,
  curriculumLevel,
  uploadedContent,
  onModelUsed,
  onExit,
  learningGoal = "deep_understanding"
}: QuizStateViewProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz execution states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const fetchQuiz = async () => {
    if (!selectedSubject || !selectedTopic) {
      setError("Subject or Topic was not selected correctly.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-quiz", {
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
        }),
      });

      if (!response.ok) {
        let errorMsg = "Failed to retrieve quiz questions.";
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
              errorMsg = "Server returned an unexpected HTML response from quiz generator. The backend server may have restarted.";
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
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("Academic engine generated an invalid quiz formulation.");
      }
      
      if (learningGoal === "exam_prep") {
        setQuestions(data.questions);
      } else {
        setQuestions(data.questions.slice(0, 5)); // ensure max 5
      }
      if (modelHeader && onModelUsed) {
        onModelUsed(modelHeader);
      } else if (data.modelUsed && onModelUsed) {
        onModelUsed(data.modelUsed);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during test compilation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [selectedSubject, selectedTopic, difficultyLevel, curriculumLevel, uploadedContent]);

  const handleOptionSelect = (optionIndex: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(optionIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    
    // Log response
    const nextAnswers = [...userAnswers];
    nextAnswers[currentIndex] = selectedOption;
    setUserAnswers(nextAnswers);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setShowResults(true);
      onQuizComplete(calculateScore(), questions.length, questions);
    }
  };

  // Compile assessment stats
  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((q, i) => {
      if (userAnswers[i] === q.correctAnswerIndex) {
        correctCount += 1;
      }
    });
    return correctCount;
  };

  const getMissedQuestions = (): MissedQuestion[] => {
    const missed: MissedQuestion[] = [];
    questions.forEach((q, i) => {
      const isCorrect = userAnswers[i] === q.correctAnswerIndex;
      if (!isCorrect) {
        missed.push({
          question: q.question,
          correctAnswer: q.options[q.correctAnswerIndex],
          userAnswer: userAnswers[i] !== undefined ? q.options[userAnswers[i]] : "No answer selected",
          reason: q.reason
        });
      }
    });

    // Fallback: If score is 100%, pass all as review cards so the user gets value!
    if (missed.length === 0) {
      questions.forEach((q) => {
        missed.push({
          question: q.question,
          correctAnswer: q.options[q.correctAnswerIndex],
          userAnswer: q.options[q.correctAnswerIndex],
          reason: q.reason
        });
      });
    }

    return missed;
  };

  const handleReviewClick = () => {
    const missed = getMissedQuestions();
    onReviewFlashcards(missed);
  };

  const score = calculateScore();
  const percentage = Math.round((score / questions.length) * 105); // scaling metric or score count

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
    <div className="p-6 sm:p-10 space-y-6 text-left" id="quiz-assessment-layout">
      {/* Exit Action Row at the very top */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100/60 pb-3 mb-1">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold transition-all cursor-pointer"
          id="btn-exit-to-dashboard"
        >
          <ArrowLeft size={14} className="stroke-[2.5]" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Quiz Header Tracker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-indigo-600 font-mono tracking-widest uppercase block">
              {selectedSubject || "GENERAL DISCIPLINE"}
            </span>
            <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold font-mono tracking-wide rounded-full border uppercase ${getDifficultyBadgeClasses()}`}>
              {difficultyLevel}
            </span>
          </div>
          <h2 className="font-sans font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
            <HelpCircle className="text-indigo-600 shrink-0" size={18} />
            {selectedTopic || "Overview Topic"}
          </h2>
        </div>
        <div className="bg-indigo-50 border border-indigo-100/60 text-indigo-700 px-3 py-1 rounded-xl text-[10px] font-extrabold font-mono tracking-wider shrink-0 uppercase tracking-widest align-self-start sm:align-self-auto">
          CHECKPOINT QUIZ
        </div>
      </div>

      {uploadedContent && (
        <div className="flex items-center gap-2.5 p-3 px-3.5 bg-emerald-50 border border-emerald-200/50 rounded-xl text-emerald-800 text-[11px] font-semibold leading-snug shadow-3xs" id="quiz-grounded-badge">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span>
            Grounded Assessment Active: Checkpoint questions compiled <strong>strictly and exclusively</strong> from this topic's specific uploaded source text slice.
          </span>
        </div>
      )}

      {loading ? (
        /* LOADING / COMPILING STATE */
        <div className="space-y-6 py-12" id="quiz-loading-view">
          <div className="flex flex-col items-center justify-center space-y-3 py-6">
            <Loader2 className="text-indigo-600 animate-spin" size={32} />
            <div className="text-center space-y-1">
              <h4 className="text-xs font-bold text-slate-800 tracking-tight">Compiling Concept Questions...</h4>
              <p className="text-[10px] text-slate-400 font-medium font-sans">Generating 5 tailored examination items from the study syllabus.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-slate-100 rounded-lg w-5/6 animate-pulse"></div>
            <div className="grid grid-cols-1 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-xl w-full animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        /* ERROR COMPILATION STATE */
        <div className="p-6 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-4 text-center py-10" id="quiz-error-box">
          <div className="mx-auto h-12 w-12 rounded-full bg-rose-100 border border-rose-200/40 flex items-center justify-center text-rose-600 mb-2">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className="text-xs font-extrabold text-rose-955 uppercase tracking-wider">Evaluation Engine Offline</h4>
            <p className="text-[11px] text-rose-700 leading-relaxed font-semibold">
              {error}
            </p>
          </div>
          <button
            onClick={fetchQuiz}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <RefreshCw size={12} />
            <span>Re-compile Questions</span>
          </button>
        </div>
      ) : !showResults ? (
        /* WORKSPACE QUESTION STATE */
        <div className="space-y-6" id="quiz-active-questions">
          {/* Question Breadcrumbs & Tracker */}
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold font-mono tracking-wider">
            <span>TEST PROGRESSION</span>
            <span>QUESTION {currentIndex + 1} OF {questions.length}</span>
          </div>

          {/* Progress Indicator Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-left"
            >
              <h3 className="font-sans font-bold text-sm sm:text-base text-slate-850 tracking-tight leading-relaxed">
                {questions[currentIndex].question}
              </h3>

              {/* Options Stack */}
              <div className="grid grid-cols-1 gap-3" id={`options-stack-q${currentIndex}`}>
                {questions[currentIndex].options.map((opt, i) => {
                  const isSelected = selectedOption === i;
                  const isCorrect = questions[currentIndex].correctAnswerIndex === i;
                  
                  let optionClass = "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700";
                  let circleClass = "border-slate-300 text-slate-405";

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      optionClass = "bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold";
                      circleClass = "bg-emerald-500 border-emerald-500 text-white";
                    } else if (isSelected) {
                      optionClass = "bg-rose-50 border-rose-300 text-rose-900";
                      circleClass = "bg-rose-500 border-rose-500 text-white";
                    } else {
                      optionClass = "bg-slate-50 border-slate-150 text-slate-400 opacity-60";
                    }
                  } else if (isSelected) {
                    optionClass = "bg-indigo-50 border-indigo-400 text-indigo-900 font-semibold";
                    circleClass = "border-indigo-500 bg-indigo-500 text-white";
                  }

                  return (
                    <button
                      key={i}
                      disabled={isAnswerSubmitted}
                      onClick={() => handleOptionSelect(i)}
                      className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all outline-hidden text-[11px] md:text-xs font-semibold ${optionClass} ${!isAnswerSubmitted ? "cursor-pointer active:scale-[0.99]" : ""}`}
                    >
                      <span className={`h-5 w-5 rounded-full border text-[10px] font-bold flex items-center justify-center shrink-0 ${circleClass}`}>
                        {isAnswerSubmitted && isCorrect ? (
                          "✓"
                        ) : isAnswerSubmitted && isSelected ? (
                          "✗"
                        ) : (
                          String.fromCharCode(65 + i)
                        )}
                      </span>
                      <span className="leading-normal pt-0.5">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Instant feedback explanation panel */}
              {isAnswerSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-slate-50 border border-slate-150 rounded-2xl space-y-2 mt-4"
                >
                  <div className="flex items-center gap-2">
                    {selectedOption === questions[currentIndex].correctAnswerIndex ? (
                      <span className="text-emerald-700 text-xs font-bold font-sans flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        Accurate Retention Explanation
                      </span>
                    ) : (
                      <span className="text-rose-700 text-xs font-bold font-sans flex items-center gap-1.5">
                        <XCircle size={13} className="text-rose-500" />
                        Recall Feedback Explanation
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    {questions[currentIndex].reason}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            {!isAnswerSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className={`flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 transition-all ${selectedOption === null ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-98"}`}
                id="btn-quiz-submit-action"
              >
                <span>Submit Answer</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] shadow-sm cursor-pointer active:scale-98"
                id="btn-quiz-next-action"
              >
                <span>{currentIndex === questions.length - 1 ? "Complete Quiz & View Results" : "Next Question"}</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* QUIZ RESULTS END SCREEN */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
          id="quiz-results-screen"
        >
          {/* Results Metric Banner */}
          <div className="text-center space-y-3 py-4">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-amber-50 border border-amber-100/80 items-center justify-center text-amber-600 shadow-xs mb-1 animate-bounce">
              <Award size={28} />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-sans font-extrabold text-lg text-slate-900 tracking-tight">
                Assessment Completed
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                SCORE SUMMARY REPORT
              </p>
            </div>

            <div className="inline-block px-6 py-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
              <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tighter block leading-none">
                {score} / {questions.length}
              </span>
              <span className="text-[10px] text-slate-500 font-bold font-mono tracking-wider block mt-1.5">
                RETENTION ACCURACY: {Math.round((score / questions.length) * 100)}%
              </span>
            </div>
          </div>

          {difficultyFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3.5 max-w-md mx-auto shadow-sm"
              id="difficulty-change-alert"
            >
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shrink-0" id="difficulty-change-alert-icon">
                <Sparkles size={16} />
              </div>
              <div className="text-left space-y-0.5">
                <span className="text-[9px] font-bold text-indigo-600 font-mono tracking-wider uppercase block" id="difficulty-change-alert-label">
                  Adaptive Logic Metric
                </span>
                <p className="text-xs font-bold text-slate-800 tracking-tight leading-snug" id="difficulty-change-alert-text">
                  {difficultyFeedback}
                </p>
              </div>
            </motion.div>
          )}

          {/* Assessment Review Feed */}
          <div className="space-y-4 text-left">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">
              Question-by-Question Review
            </h4>

            <div className="space-y-3.5" id="questions-review-log">
              {questions.map((q, idx) => {
                const isCorrect = userAnswers[idx] === q.correctAnswerIndex;
                return (
                  <div 
                    key={idx} 
                    className={`border rounded-2xl p-4.5 space-y-2.5 bg-white shadow-3xs ${isCorrect ? "border-emerald-200/60" : "border-rose-100"}`}
                  >
                    <div className="flex items-start gap-2.5">
                      {isCorrect ? (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                      )}
                      
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider block">QUESTION {idx + 1}</span>
                        <h5 className="text-[11px] md:text-xs font-bold text-slate-800 leading-normal font-sans">
                          {q.question}
                        </h5>
                      </div>
                    </div>

                    <div className="pl-6.5 text-[10px] md:text-[11px] font-medium space-y-1.5 border-l border-slate-100 ml-2">
                      <div className="text-slate-600 leading-relaxed">
                        <span className="text-slate-400 font-semibold font-mono uppercase tracking-wider block text-[9px]">CORRECT CHOICE</span>
                        <span className="font-semibold text-slate-800 bg-slate-50 px-2 py-1 rounded-sm border border-slate-100 inline-block mt-0.5">{q.options[q.correctAnswerIndex]}</span>
                      </div>

                      {!isCorrect && (
                        <div className="text-rose-800 leading-relaxed pt-1">
                          <span className="text-rose-400 font-semibold font-mono uppercase tracking-wider block text-[9px]">YOUR ANSWER</span>
                          <span className="font-semibold text-rose-700 bg-rose-50/50 px-2 py-1 rounded-sm border border-rose-100/60 inline-block mt-0.5">{userAnswers[idx] !== undefined ? q.options[userAnswers[idx]] : "None"}</span>
                        </div>
                      )}

                      <div className="text-slate-550 leading-relaxed pt-1.5">
                        <span className="text-slate-400 font-mono font-semibold uppercase tracking-wider block text-[9px]">EXPLANATION DETAIL</span>
                        <p className="mt-0.5 italic">{q.reason}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prompt Action Area */}
          <div className="p-5 bg-indigo-50/40 border border-indigo-100/60 rounded-2xl text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-0.5 max-w-sm">
              <h4 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                <Sparkles size={12} className="text-indigo-500" />
                Adaptive Reinforcement Phase
              </h4>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed leading-normal">
                {score === questions.length 
                  ? "Perfect run! Let's solidify this expertise by reviewing reinforcement flashcards before logging progression."
                  : "Excellent effort! Review the questions you missed with smart interactive recall cards before proceeding."
                }
              </p>
            </div>

            <button
              onClick={handleReviewClick}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shrink-0 shadow-md shadow-indigo-150 transition-all cursor-pointer active:scale-98"
              id="btn-quiz-proceed-flashcards"
            >
              <span>Review with Flashcards</span>
              <ArrowRight size={14} className="inline-block ml-1" />
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
}
