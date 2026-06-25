import React, { useState, useEffect, useMemo } from "react";
import { AppState, MissedQuestion, QuizHistoryEntry, SubjectItem, SavedFlashcard, getNextRevisionSchedule, QuestionBankItem, MilestoneBadge } from "./types";
import { ArrowRight, Info, CheckCircle2, Circle, Sparkles, ArrowLeft, Menu, X, LayoutDashboard, Home, History, FileText, Settings, Bookmark, BookOpen, Presentation, Sun, Moon, Award, Flame, Trophy, Layers, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import LoginStateView from "./components/LoginStateView";
import OnboardingStateView from "./components/OnboardingStateView";
import DashboardStateView from "./components/DashboardStateView";
import SubjectSelectionStateView from "./components/SubjectSelectionStateView";
import LearningStateView from "./components/LearningStateView";
import QuizStateView from "./components/QuizStateView";
import FlashcardStateView from "./components/FlashcardStateView";
import TopicSourceSelectionStateView from "./components/TopicSourceSelectionStateView";
import SavedFlashcardsStateView from "./components/SavedFlashcardsStateView";
import QuestionBankStateView from "./components/QuestionBankStateView";
import PresentationsStateView from "./components/PresentationsStateView";
import CompanionInsight from "./components/CompanionInsight";
import ReviewFAB from "./components/ReviewFAB";
import { computeMilestoneBadges } from "./utils/milestones";

let initialLocalStorageMatched = false;
const loadSavedUserData = () => {
  try {
    const raw = localStorage.getItem("lernera_user_data");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        initialLocalStorageMatched = true;
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading lernera_user_data on mount:", err);
  }
  return null;
};
const savedData = loadSavedUserData();

export default function App() {
  const [dataLoadedFromLocalStorage, setDataLoadedFromLocalStorage] = useState<boolean>(initialLocalStorageMatched);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [logoClicks, setLogoClicks] = useState<number>(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasDebugParam = params.get("debug");
    if (hasDebugParam === "true") {
      setDebugMode(true);
      localStorage.setItem("lernera_debug_mode", "true");
    } else if (hasDebugParam === "false") {
      setDebugMode(false);
      localStorage.setItem("lernera_debug_mode", "false");
    } else {
      const stored = localStorage.getItem("lernera_debug_mode");
      if (stored === "true") {
        setDebugMode(true);
      }
    }
  }, []);

  const handleLogoClick = () => {
    setLogoClicks(prev => {
      const nextNum = prev + 1;
      if (nextNum >= 5) {
        setDebugMode(curr => {
          const newValue = !curr;
          localStorage.setItem("lernera_debug_mode", newValue ? "true" : "false");
          return newValue;
        });
        return 0;
      }
      return nextNum;
    });
  };

  useEffect(() => {
    if (logoClicks > 0) {
      const t = setTimeout(() => setLogoClicks(0), 3000);
      return () => clearTimeout(t);
    }
  }, [logoClicks]);

  const [currentState, setCurrentState] = useState<AppState>(() => {
    if (savedData && (savedData.userName || savedData.curriculumLevel)) {
      if (!savedData.curriculumLevel) {
        return AppState.ONBOARDING_STATE;
      }
      return AppState.SUBJECT_SELECTION_STATE;
    }
    return AppState.LOGIN_STATE;
  });

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("lernera_theme");
    if (saved === "light" || saved === "dark") return saved;
    const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return systemPrefersDark ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem("lernera_theme", theme);
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<"overview" | "history" | "materials" | "settings">("overview");

  const [userName, setUserName] = useState<string>(() => savedData?.userName || "");
  const [userEmail, setUserEmail] = useState<string>(() => savedData?.userEmail || "");
  const [curriculumLevel, setCurriculumLevel] = useState<string>(() => savedData?.curriculumLevel || "");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [missedQuestions, setMissedQuestions] = useState<MissedQuestion[]>([]);
  const [topicsLearnedCount, setTopicsLearnedCount] = useState<number>(() => savedData?.topicsLearnedCount || 0);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryEntry[]>(() => savedData?.quizHistory || []);
  const [subjectDifficulties, setSubjectDifficulties] = useState<Record<string, "beginner" | "intermediate" | "advanced">>(() => savedData?.subjectDifficulties || {});
  const [difficultyFeedback, setDifficultyFeedback] = useState<string | null>(null);
  const [lastModelUsed, setLastModelUsed] = useState<string>("None");
  const [customSubjects, setCustomSubjects] = useState<SubjectItem[]>(() => savedData?.customSubjects || []);
  const [topicStatuses, setTopicStatuses] = useState<Record<string, "read" | "quiz_completed" | "completed">>(() => savedData?.topicStatuses || {});
  const [savedFlashcards, setSavedFlashcards] = useState<SavedFlashcard[]>(() => savedData?.savedFlashcards || []);
  const [selectiveReviewCardId, setSelectiveReviewCardId] = useState<string | null>(null);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>(() => savedData?.questionBank || []);
  const [sessionLearningGoal, setSessionLearningGoal] = useState<"exam_prep" | "deep_understanding">("deep_understanding");
  const [sessionLearningMode, setSessionLearningMode] = useState<"read" | "listen">("read");
  const [sessionDetailLevel, setSessionDetailLevel] = useState<"concise" | "standard" | "comprehensive">("standard");

  // Real-time active study time session variables
  const [totalTimeStudied, setTotalTimeStudied] = useState<number>(() => savedData?.totalTimeStudied || 0);
  const [timeSpentPerTopic, setTimeSpentPerTopic] = useState<Record<string, number>>(() => savedData?.timeSpentPerTopic || {});
  const [timeStudiedByDate, setTimeStudiedByDate] = useState<Record<string, number>>(() => savedData?.timeStudiedByDate || {});

  // Milestones Achievement Engine and Notification Toast states
  const [notifiedBadges, setNotifiedBadges] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("lernera_notified_badges");
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return [];
  });
  const [activeToastBadge, setActiveToastBadge] = useState<string | null>(null);

  const presentationsCount = useMemo(() => {
    try {
      const saved = localStorage.getItem("lernera_presentations");
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) return list.length;
      }
    } catch (_) {}
    return 0;
  }, [currentState]);

  const currentBadges = useMemo(() => {
    return computeMilestoneBadges({
      topicStatuses,
      quizHistory,
      customSubjects,
      totalTimeStudied,
      savedFlashcards,
      timeStudiedByDate,
      presentationsCount
    });
  }, [
    topicStatuses,
    quizHistory,
    customSubjects,
    totalTimeStudied,
    savedFlashcards,
    timeStudiedByDate,
    presentationsCount
  ]);

  useEffect(() => {
    if (!userName) return;
    const newlyUnlocked = currentBadges.find(b => b.isUnlocked && !notifiedBadges.includes(b.id));
    if (newlyUnlocked) {
      setActiveToastBadge(newlyUnlocked.id);
      const nextNotified = [...notifiedBadges, newlyUnlocked.id];
      setNotifiedBadges(nextNotified);
      localStorage.setItem("lernera_notified_badges", JSON.stringify(nextNotified));
    }
  }, [currentBadges, notifiedBadges, userName]);

  useEffect(() => {
    if (activeToastBadge) {
      const t = setTimeout(() => {
        setActiveToastBadge(null);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [activeToastBadge]);

  // Spaced repetition data for rendering in the debug bar
  const spacedRepData = useMemo(() => {
    const topicsMap: Record<string, { topic: string; subject: string; stage: number; nextReviewDate: string }> = {};
    quizHistory.forEach(q => {
      if (q.topic) {
        const key = `${q.subject.trim().toLowerCase()}::${q.topic.trim().toLowerCase()}`;
        topicsMap[key] = {
          topic: q.topic,
          subject: q.subject,
          stage: q.reviewStage ?? 0,
          nextReviewDate: q.nextReviewDate ? new Date(q.nextReviewDate).toLocaleDateString() : "Not set"
        };
      }
    });
    return Object.values(topicsMap);
  }, [quizHistory]);

  // Ref tracking last mouse/key active timestamp for idleness checker
  const lastActiveTimestampRef = React.useRef<number>(Date.now());

  // Listeners verifying active user interactions to pause timer after 2 minutes of idle time
  useEffect(() => {
    const recordUserAction = () => {
      lastActiveTimestampRef.current = Date.now();
    };

    window.addEventListener("mousemove", recordUserAction);
    window.addEventListener("keydown", recordUserAction);
    window.addEventListener("mousedown", recordUserAction);
    window.addEventListener("touchstart", recordUserAction);
    window.addEventListener("scroll", recordUserAction);

    return () => {
      window.removeEventListener("mousemove", recordUserAction);
      window.removeEventListener("keydown", recordUserAction);
      window.removeEventListener("mousedown", recordUserAction);
      window.removeEventListener("touchstart", recordUserAction);
      window.removeEventListener("scroll", recordUserAction);
    };
  }, []);

  // Synchronize topic difficulty on entering LEARNING_STATE
  // Reset never-before studied topic to beginner, restore last studied topic difficulty
  useEffect(() => {
    if (currentState === AppState.LEARNING_STATE && selectedSubject && selectedTopic) {
      const trimmedSubject = selectedSubject.trim().toLowerCase();
      const trimmedTopic = selectedTopic.trim().toLowerCase();
      
      const topicHistory = quizHistory.filter(q =>
        q.topic && q.topic.trim().toLowerCase() === trimmedTopic &&
        q.subject && q.subject.trim().toLowerCase() === trimmedSubject
      );

      if (topicHistory.length === 0) {
        // Never studied before -> start at Beginner difficulty
        setSubjectDifficulties(prev => ({
          ...prev,
          [selectedSubject]: "beginner"
        }));
      } else {
        // Previously studied -> open at last recorded difficulty level
        const lastEntry = topicHistory[topicHistory.length - 1];
        const lastDiff = (lastEntry.difficultyLevel as "beginner" | "intermediate" | "advanced") || "beginner";
        setSubjectDifficulties(prev => ({
          ...prev,
          [selectedSubject]: lastDiff
        }));
      }
    }
  }, [currentState, selectedSubject, selectedTopic]);

  // Interval hook accumulating timing seconds when active learning
  useEffect(() => {
    const isAccumulating = 
      currentState === AppState.LEARNING_STATE ||
      currentState === AppState.QUIZ_STATE ||
      currentState === AppState.FLASHCARD_STATE;

    if (!isAccumulating) return;

    const sessionTimer = setInterval(() => {
      const elapsedSinceActive = Date.now() - lastActiveTimestampRef.current;
      // 120,000 milliseconds = 2 minutes idle limits
      if (elapsedSinceActive < 120000) {
        const todayDate = (() => {
          const d = new Date();
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const date = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${date}`;
        })();

        const subjectKey = selectedSubject || "General";
        const topicKey = selectedTopic || "General Topic";
        const compositeKey = `${subjectKey.trim().toLowerCase()}::${topicKey.trim().toLowerCase()}`;

        setTotalTimeStudied(prev => prev + 1);

        setTimeSpentPerTopic(prev => {
          const currentSecs = prev[compositeKey] || 0;
          return {
            ...prev,
            [compositeKey]: currentSecs + 1
          };
        });

        setTimeStudiedByDate(prev => {
          const currentSecs = prev[todayDate] || 0;
          return {
            ...prev,
            [todayDate]: currentSecs + 1
          };
        });
      }
    }, 1000);

    return () => {
      clearInterval(sessionTimer);
    };
  }, [currentState, selectedSubject, selectedTopic]);

  const updateTopicStatus = (subject: string, topic: string, status: "read" | "quiz_completed" | "completed") => {
    const key = `${subject.trim().toLowerCase()}::${topic.trim().toLowerCase()}`;
    setTopicStatuses(prev => {
      const current = prev[key];
      if (current === "completed" && status !== "completed") {
        return prev;
      }
      if (current === "quiz_completed" && status === "read") {
        return prev;
      }
      return {
        ...prev,
        [key]: status
      };
    });
  };

  // Synchronize state changes back to localStorage
  useEffect(() => {
    try {
      const dataToSave = {
        userName,
        userEmail,
        curriculumLevel,
        quizHistory,
        subjectDifficulties,
        customSubjects,
        topicsLearnedCount,
        topicStatuses,
        totalTimeStudied,
        timeSpentPerTopic,
        timeStudiedByDate,
        savedFlashcards,
        questionBank
      };
      localStorage.setItem("lernera_user_data", JSON.stringify(dataToSave));
    } catch (err) {
      console.error("Failed to write to localStorage in useEffect:", err);
    }
  }, [
    userName,
    userEmail,
    curriculumLevel,
    quizHistory,
    subjectDifficulties,
    customSubjects,
    topicsLearnedCount,
    topicStatuses,
    totalTimeStudied,
    timeSpentPerTopic,
    timeStudiedByDate,
    savedFlashcards,
    questionBank
  ]);

  const handleResetProgress = () => {
    try {
      localStorage.removeItem("lernera_user_data");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("curriculumLevel");
    } catch (err) {
      console.error("Failed to clear localStorage on reset:", err);
    }
    setUserName("");
    setUserEmail("");
    setCurriculumLevel("");
    setTopicsLearnedCount(0);
    setQuizHistory([]);
    setSubjectDifficulties({});
    setCustomSubjects([]);
    setMissedQuestions([]);
    setSelectedSubject(null);
    setSelectedTopic(null);
    setDifficultyFeedback(null);
    setLastModelUsed("None");
    setTopicStatuses({});
    setTotalTimeStudied(0);
    setTimeSpentPerTopic({});
    setTimeStudiedByDate({});
    setSavedFlashcards([]);
    setQuestionBank([]);
    setDataLoadedFromLocalStorage(false);
    setCurrentState(AppState.LOGIN_STATE);
  };

  // Simple derived value: "currentDifficulty" per subject, starting at "beginner" for every subject by default
  const getCurrentDifficulty = (subject: string | null): "beginner" | "intermediate" | "advanced" => {
    if (!subject) return "beginner";
    return subjectDifficulties[subject] || "beginner";
  };

  const handleToggleSaveFlashcard = (card: { front: string; back: string }, subject: string, topic: string) => {
    setSavedFlashcards(prev => {
      const exists = prev.some(
        item =>
          item.front.trim().toLowerCase() === card.front.trim().toLowerCase() &&
          item.subject.trim().toLowerCase() === subject.trim().toLowerCase()
      );
      if (exists) {
        return prev.filter(
          item =>
            !(item.front.trim().toLowerCase() === card.front.trim().toLowerCase() &&
              item.subject.trim().toLowerCase() === subject.trim().toLowerCase())
        );
      } else {
        const newSaved: SavedFlashcard = {
          id: `fc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          front: card.front,
          back: card.back,
          subject: subject,
          topic: topic,
          timestamp: new Date().toISOString()
        };
        return [...prev, newSaved];
      }
    });
  };

  const handleSaveQAPairs = (qas: { question: string; answer: string }[]) => {
    if (!selectedSubject || !selectedTopic) return;
    const finalSubject = selectedSubject;
    const finalTopic = selectedTopic;
    setQuestionBank(prev => {
      const next = [...prev];
      qas.forEach(q => {
        const existingIndex = next.findIndex(item =>
          item.subject.trim().toLowerCase() === finalSubject.trim().toLowerCase() &&
          item.topic.trim().toLowerCase() === finalTopic.trim().toLowerCase() &&
          item.question.trim().toLowerCase() === q.question.trim().toLowerCase()
        );
        if (existingIndex !== -1) {
          next[existingIndex] = {
            ...next[existingIndex],
            answer: q.answer,
            type: "qa"
          };
        } else {
          next.push({
            id: `${finalSubject}_${finalTopic}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            subject: finalSubject,
            topic: finalTopic,
            question: q.question,
            options: [],
            correctAnswerIndex: -1,
            answer: q.answer,
            type: "qa",
            timestamp: new Date().toISOString()
          });
        }
      });
      return next;
    });
  };

  const handleQuizComplete = (score: number, totalQuestions: number, questions?: any[]) => {
    if (!selectedTopic) return;
    const finalSubject = selectedSubject || "General";
    
    const currentDiff = getCurrentDifficulty(finalSubject);
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
    let newDiff = currentDiff;
    let feedback: string | null = null;

    if (percentage >= 80) {
      if (currentDiff === "beginner") {
        newDiff = "intermediate";
        feedback = "Great work! Moving up to Intermediate level";
      } else if (currentDiff === "intermediate") {
        newDiff = "advanced";
        feedback = "Exceptional performance! Moving up to Advanced level";
      }
    } else if (percentage < 50) {
      if (currentDiff === "advanced") {
        newDiff = "intermediate";
        feedback = "Let's reinforce the fundamentals — returning to Intermediate level";
      } else if (currentDiff === "intermediate") {
        newDiff = "beginner";
        feedback = "Let's reinforce the basics — returning to Beginner level";
      }
    }

    if (newDiff !== currentDiff) {
      setSubjectDifficulties(prev => ({
        ...prev,
        [finalSubject]: newDiff
      }));
      setDifficultyFeedback(feedback);
    } else {
      setDifficultyFeedback(null);
    }

    // Spaced repetition scheduling calculation using shared getNextRevisionSchedule logic
    const prevAttempts = quizHistory.filter(q =>
      q.topic && selectedTopic &&
      q.topic.trim().toLowerCase() === selectedTopic.trim().toLowerCase() &&
      q.subject && q.subject.trim().toLowerCase() === finalSubject.trim().toLowerCase()
    );

    const lastQuiz = prevAttempts.length > 0 ? prevAttempts[prevAttempts.length - 1] : null;
    const prevStage = lastQuiz ? (lastQuiz.reviewStage ?? 0) : 0;

    const isSuccessful = percentage >= 60;
    const schedule = getNextRevisionSchedule(prevStage, isSuccessful);

    const newEntry: QuizHistoryEntry = {
      topic: selectedTopic,
      subject: finalSubject,
      score,
      totalQuestions,
      timestamp: new Date().toISOString(),
      difficultyLevel: currentDiff,
      nextReviewDate: schedule.nextReviewDate,
      reviewStage: schedule.reviewStage
    };

    setQuizHistory(prev => [...prev, newEntry]);

    // Append quiz questions to the persistent Question Bank state organized by subject -> topic without duplicates
    if (questions && Array.isArray(questions)) {
      setQuestionBank(prev => {
        const next = [...prev];
        questions.forEach(q => {
          const alreadyExists = next.some(item => 
            item.subject.trim().toLowerCase() === finalSubject.trim().toLowerCase() &&
            item.topic.trim().toLowerCase() === selectedTopic.trim().toLowerCase() &&
            item.question.trim().toLowerCase() === q.question.trim().toLowerCase()
          );
          if (!alreadyExists) {
            next.push({
              id: `${finalSubject}_${selectedTopic}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              subject: finalSubject,
              topic: selectedTopic,
              question: q.question,
              options: q.options,
              correctAnswerIndex: q.correctAnswerIndex,
              reason: q.reason || "",
              timestamp: new Date().toISOString()
            });
          }
        });
        return next;
      });
    }
  };

  const getActiveUploadedContent = (): string | null => {
    if (!selectedSubject) return null;
    const cleanSubject = selectedSubject.startsWith("[Document] ")
      ? selectedSubject.replace("[Document] ", "")
      : selectedSubject;
    try {
      const stored = localStorage.getItem("uploadedDocuments");
      if (!stored) return null;
      const docs = JSON.parse(stored);
      const matched = docs.find((d: any) => d.name === cleanSubject || d.name === selectedSubject);
      if (!matched) return null;

      if (selectedTopic && matched.topics) {
        const matchedTopic = matched.topics.find(
          (t: any) => t.name.trim().toLowerCase() === selectedTopic.trim().toLowerCase()
        );
        if (matchedTopic && matchedTopic.sourceText) {
          return matchedTopic.sourceText;
        }
      }
      return matched.content;
    } catch {
      return null;
    }
  };

  // Transition Map: States must follow the logical sequence
  // LOGIN → ONBOARDING (one-time) → DASHBOARD → SUBJECT_SELECTION → TOPIC_SOURCE_SELECTION → LEARNING → QUIZ → FLASHCARD → back to DASHBOARD
  const handleNext = () => {
    switch (currentState) {
      case AppState.LOGIN_STATE:
        if (!curriculumLevel) {
          setCurrentState(AppState.ONBOARDING_STATE);
        } else {
          setCurrentState(AppState.SUBJECT_SELECTION_STATE);
        }
        break;
      case AppState.ONBOARDING_STATE:
        setCurrentState(AppState.SUBJECT_SELECTION_STATE);
        break;
      case AppState.DASHBOARD_STATE:
        setCurrentState(AppState.SUBJECT_SELECTION_STATE);
        break;
      case AppState.SUBJECT_SELECTION_STATE:
        setCurrentState(AppState.LEARNING_STATE);
        break;
      case AppState.TOPIC_SOURCE_SELECTION_STATE:
        setCurrentState(AppState.LEARNING_STATE);
        break;
      case AppState.LEARNING_STATE:
        setCurrentState(AppState.QUIZ_STATE);
        break;
      case AppState.QUIZ_STATE:
        setCurrentState(AppState.FLASHCARD_STATE);
        break;
      case AppState.FLASHCARD_STATE:
        setCurrentState(AppState.DASHBOARD_STATE);
        break;
      default:
        setCurrentState(AppState.DASHBOARD_STATE);
    }
  };

  // List of states in chronological/logical order for visual testing visualization
  const statesFlow = [
    { state: AppState.LOGIN_STATE, label: "Login Gate" },
    ...(!curriculumLevel || currentState === AppState.ONBOARDING_STATE ? [{ state: AppState.ONBOARDING_STATE, label: "Profile Setup" }] : []),
    { state: AppState.DASHBOARD_STATE, label: "Desk Hub" },
    { state: AppState.SUBJECT_SELECTION_STATE, label: "Syllabus Pick" },
    { state: AppState.TOPIC_SOURCE_SELECTION_STATE, label: "Syllabus Plan" },
    { state: AppState.LEARNING_STATE, label: "Study Room" },
    { state: AppState.QUIZ_STATE, label: "Recall Quiz" },
    { state: AppState.FLASHCARD_STATE, label: "Flashcards" }
  ];

  // Helper to determine index of states
  const getActiveIndex = () => {
    return statesFlow.findIndex((item) => item.state === currentState);
  };

  const activeIndex = getActiveIndex();

  // Determine maximum width depending on current state to give responsive rhythm
  const getMaxWidthClass = () => {
    if (currentState === AppState.DASHBOARD_STATE) return "max-w-2xl";
    if (currentState === AppState.SUBJECT_SELECTION_STATE || currentState === AppState.LEARNING_STATE) return "max-w-3xl";
    return "max-w-md";
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 antialiased transition-colors duration-200" 
      id="state-machine-app"
    >
      {/* Slide Out Navigation Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 cursor-pointer pointer-events-auto"
              id="drawer-backdrop"
            />

            {/* Sidebar Control Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.22 }}
              className="fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl z-55 flex flex-col border-r border-slate-200 dark:border-slate-800"
              id="drawer-sidebar"
            >
              {/* Drawer Title & Control */}
              <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                    Lernera Academic
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Custom Syllabus Hub</p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center shadow-3xs"
                  id="btn-close-drawer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="p-4 flex-1 space-y-1.5 text-left">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">
                  Interactive Navigation
                </div>
                {[
                  {
                    id: "home",
                    label: "Home / Subjects",
                    icon: <Home size={16} />,
                    isActive: currentState === AppState.SUBJECT_SELECTION_STATE,
                    onClick: () => {
                      setCurrentState(AppState.SUBJECT_SELECTION_STATE);
                    }
                  },
                  {
                    id: "dashboard",
                    label: "Dashboard",
                    icon: <LayoutDashboard size={16} />,
                    isActive: currentState === AppState.DASHBOARD_STATE && dashboardTab === "overview",
                    onClick: () => {
                      setCurrentState(AppState.DASHBOARD_STATE);
                      setDashboardTab("overview");
                    }
                  },
                  {
                    id: "history",
                    label: "Quiz History Logs",
                    icon: <History size={16} />,
                    isActive: currentState === AppState.DASHBOARD_STATE && dashboardTab === "history",
                    onClick: () => {
                      setCurrentState(AppState.DASHBOARD_STATE);
                      setDashboardTab("history");
                    }
                  },
                  {
                    id: "materials",
                    label: "Uploaded Reference",
                    icon: <FileText size={16} />,
                    isActive: currentState === AppState.DASHBOARD_STATE && dashboardTab === "materials",
                    onClick: () => {
                      setCurrentState(AppState.DASHBOARD_STATE);
                      setDashboardTab("materials");
                    }
                  },
                  {
                    id: "saved-flashcards",
                    label: `Saved Flashcards (${savedFlashcards.length})`,
                    icon: <Bookmark size={16} />,
                    isActive: currentState === AppState.SAVED_FLASHCARDS_STATE,
                    onClick: () => {
                      setCurrentState(AppState.SAVED_FLASHCARDS_STATE);
                    }
                  },
                  {
                    id: "question-bank",
                    label: `Question Bank (${questionBank.length})`,
                    icon: <BookOpen size={16} />,
                    isActive: currentState === AppState.QUESTION_BANK_STATE,
                    onClick: () => {
                      setCurrentState(AppState.QUESTION_BANK_STATE);
                    }
                  },
                  {
                    id: "presentations",
                    label: "Presentations",
                    icon: <Presentation size={16} />,
                    isActive: currentState === AppState.PRESENTATIONS_STATE,
                    onClick: () => {
                      setCurrentState(AppState.PRESENTATIONS_STATE);
                    }
                  },
                  {
                    id: "settings",
                    label: "Settings & Profile",
                    icon: <Settings size={16} />,
                    isActive: currentState === AppState.DASHBOARD_STATE && dashboardTab === "settings",
                    onClick: () => {
                      setCurrentState(AppState.DASHBOARD_STATE);
                      setDashboardTab("settings");
                    }
                  }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.onClick();
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                      item.isActive
                        ? "bg-indigo-50 border-indigo-100 text-indigo-700 font-extrabold shadow-3xs"
                        : "bg-white border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                    id={`drawer-link-${item.id}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Drawer Footer with status info and Theme Toggle */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-805 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
                <span className="text-xs font-bold text-slate-650 dark:text-slate-300">
                  Theme: {theme === "light" ? "Light" : "Dark"}
                </span>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 cursor-pointer shadow-3xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                  title="Toggle Light/Dark Theme"
                  id="btn-toggle-theme-drawer"
                >
                  {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
                </button>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-left">
                <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Active User</span>
                <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 tracking-tight block truncate">
                  {userName || "Guest Learner"}
                </span>
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 block break-all">
                  {userEmail || "anonymous@lernera.edu"}
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Visual Debug Ribbon at the Top */}
      <header 
        className="w-full bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-40 px-4 py-3 sm:px-6 shadow-xs"
        id="debug-header"
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Direct Active Indicator */}
          <div className="flex items-center gap-3">
            {currentState !== AppState.LOGIN_STATE && currentState !== AppState.ONBOARDING_STATE && (
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-1.5 -ml-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all cursor-pointer shadow-3xs flex items-center justify-center gap-1"
                id="btn-open-drawer"
                title="Open navigation menu"
              >
                <Menu size={16} className="stroke-[2.5]" />
                <span className="text-[9px] font-bold font-mono tracking-tight text-slate-400 dark:text-slate-500 uppercase pr-0.5 hidden sm:inline-block">Menu</span>
              </button>
            )}
            {debugMode && (
              <span className="flex h-2.5 w-2.5 relative" id="debug-ping-dot">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
              </span>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span 
                  className="font-bold text-xs tracking-tight text-slate-900 dark:text-white font-sans uppercase cursor-pointer select-none"
                  onClick={handleLogoClick}
                  title="Click 5 times to toggle debug mode"
                  id="app-header-logo-title"
                >
                  {debugMode ? "State Machine Debugger" : "Lernera Academic"}
                </span>
                {debugMode && (
                  <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-mono font-bold" id="debug-state-badge">
                    {currentState}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                {debugMode 
                  ? "Verifying chronological state transition sequences in light view bounds"
                  : "Your Personalized Adaptive Syllabus Companion"}
              </p>
            </div>
          </div>

          {/* Path Visualizer & Theme Toggle Actions */}
          <div className="flex items-center justify-between md:justify-end gap-4">
            {debugMode && (
              <div className="hidden sm:flex items-center gap-1 overflow-x-auto text-[11px] font-mono select-none py-1" id="debug-path-visualizer">
                {statesFlow.map((flowItem, index) => {
                  const isCurrent = flowItem.state === currentState;
                  const isPassed = index < activeIndex;

                  return (
                    <React.Fragment key={flowItem.state}>
                      <div 
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-300 ${
                          isCurrent 
                            ? "bg-indigo-600 text-white font-bold shadow-xs shadow-indigo-100" 
                            : isPassed 
                              ? "text-emerald-700 dark:text-emerald-400 font-medium" 
                              : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {isPassed ? (
                          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                        ) : (
                          <Circle size={10} className={`shrink-0 ${isCurrent ? "fill-white text-indigo-600" : "text-slate-350 dark:text-slate-650"}`} />
                        )}
                        <span className="whitespace-nowrap">{flowItem.label}</span>
                      </div>
                      {index < statesFlow.length - 1 && (
                        <span className="text-slate-300 dark:text-slate-750 text-xs px-1 font-sans font-normal">&rarr;</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* Quick Toggle Button always accessible */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer active:scale-95 transition-all flex items-center justify-center shadow-3xs"
              id="header-theme-toggle"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? (
                <Moon size={15} className="text-slate-600" />
              ) : (
                <Sun size={15} className="text-amber-400 fill-amber-400" />
              )}
            </button>
          </div>

        </div>
      </header>

      {/* DEBUG_INFO bar */}
      {debugMode && (
        <div 
          className="w-full bg-slate-900 text-slate-200 border-b border-slate-800 text-xs py-2 px-4 shadow-sm"
          id="debug-info-bar"
        >
          <div className="max-w-4xl mx-auto flex flex-col gap-2 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-amber-500 text-slate-950 rounded">
                  DEBUG INFO
                </span>
                <span className="text-slate-400 font-sans">Verification Hub</span>
                <span className="text-[10px] bg-indigo-950/40 border border-indigo-800 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold" id="debug-curriculum-level">
                  CURRICULUM: {curriculumLevel || "NOT SET"}
                </span>
                <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-bold tracking-wide rounded border uppercase shrink-0 font-mono ${
                  dataLoadedFromLocalStorage 
                    ? "bg-purple-950/40 border-purple-800 text-purple-300" 
                    : "bg-amber-950/40 border-amber-850 text-amber-300"
                }`} id="debug-session-source">
                  SESSION: {dataLoadedFromLocalStorage ? "LOADED FROM LOCALSTORAGE" : "FRESH SESSION (NEW)"}
                </span>
                <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-bold tracking-wide rounded border uppercase shrink-0 font-mono ${
                  lastModelUsed.toLowerCase().includes("lite") 
                    ? "bg-rose-950/40 border-rose-800 text-rose-300" 
                    : lastModelUsed !== "None" 
                      ? "bg-emerald-950/40 border-emerald-800 text-emerald-300" 
                      : "bg-slate-800 border-slate-700 text-slate-400"
                }`}>
                  MODEL: {lastModelUsed}
                </span>
                {quizHistory.length > 0 && (
                  <span className="text-[10px] text-slate-500 ml-1">
                    ({quizHistory.length} total quizzes)
                  </span>
                )}
              </div>
              <div className="text-[11px]">
                {quizHistory.length > 0 ? (
                  <span className="text-emerald-400 font-bold">
                    Last quiz: {quizHistory[quizHistory.length - 1].topic} - {quizHistory[quizHistory.length - 1].score}/{quizHistory[quizHistory.length - 1].totalQuestions} - {quizHistory[quizHistory.length - 1].difficultyLevel}
                  </span>
                ) : (
                  <span className="text-slate-400">Last quiz: None completed yet</span>
                )}
              </div>
            </div>

            {spacedRepData.length > 0 && (
              <div className="mt-1 pt-1.5 border-t border-slate-800 text-[10px] text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-amber-500 font-bold uppercase select-none">Spaced Repetition Schedule:</span>
                {spacedRepData.map((item, idx) => (
                  <span key={idx} className="bg-slate-950/50 px-1.5 py-0.5 rounded border border-slate-800/60 font-mono text-slate-300" id={`debug-spaced-rep-${idx}`}>
                    {item.topic} &rarr; <strong className="text-indigo-400">Stage {item.stage}</strong> (Next: {item.nextReviewDate})
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main View Display Port */}
      <main 
        className="flex-1 flex flex-col items-center justify-center py-10 px-4 sm:py-16 md:py-24"
        id="state-display-port"
      >
        <div 
          className={`w-full ${getMaxWidthClass()} bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ease-out`}
          id="current-state-card"
        >
          {/* Active Screen Rendering */}
          {currentState === AppState.LOGIN_STATE && (
            <LoginStateView onLogin={(name, email) => {
              setUserName(name);
              localStorage.setItem("userName", name);
              setUserEmail(email);
              if (email) {
                localStorage.setItem("userEmail", email);
              } else {
                localStorage.removeItem("userEmail");
              }
              if (!curriculumLevel) {
                setCurrentState(AppState.ONBOARDING_STATE);
              } else {
                setCurrentState(AppState.SUBJECT_SELECTION_STATE);
              }
            }} />
          )}
          {currentState === AppState.ONBOARDING_STATE && (
            <OnboardingStateView 
              userName={userName}
              onConfirm={(level) => {
                setCurriculumLevel(level);
                localStorage.setItem("curriculumLevel", level);
                setCurrentState(AppState.SUBJECT_SELECTION_STATE);
              }}
            />
          )}
          {currentState === AppState.DASHBOARD_STATE && (
            <DashboardStateView 
              onNext={handleNext} 
              userName={userName} 
              topicsLearned={topicsLearnedCount}
              subjectDifficulties={subjectDifficulties}
              quizHistory={quizHistory}
              curriculumLevel={curriculumLevel}
              setCurriculumLevel={(level) => {
                setCurriculumLevel(level);
                localStorage.setItem("curriculumLevel", level);
              }}
              onResumeDocument={(doc) => {
                setSelectedSubject(`[Document] ${doc.name}`);
                setSelectedTopic("");
                setCurrentState(AppState.SUBJECT_SELECTION_STATE);
              }}
              onResetProgress={handleResetProgress}
              onReviewTopic={(subjectName, topicName) => {
                setSelectedSubject(subjectName);
                setSelectedTopic(topicName);
                setCurrentState(AppState.LEARNING_STATE);
              }}
              activeTab={dashboardTab}
              onTabChange={setDashboardTab}
              totalTimeStudied={totalTimeStudied}
              timeSpentPerTopic={timeSpentPerTopic}
              timeStudiedByDate={timeStudiedByDate}
              savedFlashcards={savedFlashcards}
              theme={theme}
              toggleTheme={toggleTheme}
              badges={currentBadges}
            />
          )}
          {currentState === AppState.SUBJECT_SELECTION_STATE && (
            <SubjectSelectionStateView 
              onNext={handleNext} 
              setSelectedSubject={setSelectedSubject}
              setSelectedTopic={setSelectedTopic}
              selectedSubject={selectedSubject}
              selectedTopic={selectedTopic}
              quizHistory={quizHistory}
              customSubjects={customSubjects}
              setCustomSubjects={setCustomSubjects}
              setCurrentState={setCurrentState}
              topicStatuses={topicStatuses}
              savedFlashcards={savedFlashcards}
              onSelectReviewCard={(cardId) => {
                setSelectiveReviewCardId(cardId);
                setCurrentState(AppState.SAVED_FLASHCARDS_STATE);
              }}
              sessionLearningGoal={sessionLearningGoal}
              setSessionLearningGoal={setSessionLearningGoal}
              sessionLearningMode={sessionLearningMode}
              setSessionLearningMode={setSessionLearningMode}
              sessionDetailLevel={sessionDetailLevel}
              setSessionDetailLevel={setSessionDetailLevel}
            />
          )}
          {currentState === AppState.TOPIC_SOURCE_SELECTION_STATE && (
            <TopicSourceSelectionStateView 
              selectedSubject={selectedSubject}
              setSelectedSubject={setSelectedSubject}
              setSelectedTopic={setSelectedTopic}
              customSubjects={customSubjects}
              setCustomSubjects={setCustomSubjects}
              curriculumLevel={curriculumLevel}
              onBack={() => {
                setSelectedSubject(null);
                setCurrentState(AppState.SUBJECT_SELECTION_STATE);
              }}
              onNext={handleNext}
              setCurrentState={setCurrentState}
            />
          )}
          {currentState === AppState.LEARNING_STATE && (
            <LearningStateView 
              onNext={handleNext} 
              selectedSubject={selectedSubject}
              selectedTopic={selectedTopic}
              difficultyLevel={getCurrentDifficulty(selectedSubject)}
              onDifficultyChange={(newDiff) => {
                if (selectedSubject) {
                  setSubjectDifficulties(prev => ({ ...prev, [selectedSubject]: newDiff }));
                }
              }}
              curriculumLevel={curriculumLevel}
              onModelUsed={(model) => setLastModelUsed(model)}
              uploadedContent={getActiveUploadedContent()}
              onExit={() => setCurrentState(AppState.DASHBOARD_STATE)}
              onContentLoaded={() => {
                if (selectedSubject && selectedTopic) {
                  updateTopicStatus(selectedSubject, selectedTopic, "read");
                }
              }}
              learningGoal={sessionLearningGoal}
              learningMode={sessionLearningMode}
              detailLevel={sessionDetailLevel}
              onSaveQAPairs={handleSaveQAPairs}
            />
          )}
          {currentState === AppState.QUIZ_STATE && (
            <QuizStateView 
              selectedSubject={selectedSubject}
              selectedTopic={selectedTopic}
              difficultyFeedback={difficultyFeedback}
              difficultyLevel={getCurrentDifficulty(selectedSubject)}
              curriculumLevel={curriculumLevel}
              onReviewFlashcards={(missed) => {
                setMissedQuestions(missed);
                setDifficultyFeedback(null);
                handleNext(); // Moves logically to FLASHCARD_STATE
              }}
              onQuizComplete={(score, totalQuestions, qs) => {
                handleQuizComplete(score, totalQuestions, qs);
                if (selectedSubject && selectedTopic) {
                  updateTopicStatus(selectedSubject, selectedTopic, "quiz_completed");
                }
              }}
              onModelUsed={(model) => setLastModelUsed(model)}
              uploadedContent={getActiveUploadedContent()}
              onExit={() => setCurrentState(AppState.DASHBOARD_STATE)}
              learningGoal={sessionLearningGoal}
            />
          )}
          {currentState === AppState.FLASHCARD_STATE && (
            <FlashcardStateView 
              selectedSubject={selectedSubject}
              selectedTopic={selectedTopic}
              missedQuestions={missedQuestions}
              curriculumLevel={curriculumLevel}
              uploadedContent={getActiveUploadedContent()}
              onExit={() => setCurrentState(AppState.DASHBOARD_STATE)}
              savedFlashcards={savedFlashcards}
              onToggleSaveFlashcard={handleToggleSaveFlashcard}
              onFinish={() => {
                setTopicsLearnedCount(prev => prev + 1);
                if (selectedSubject && selectedTopic) {
                  updateTopicStatus(selectedSubject, selectedTopic, "completed");
                }
                handleNext(); // Returns logically to Dashboard
              }}
            />
          )}
          {currentState === AppState.SAVED_FLASHCARDS_STATE && (
            <SavedFlashcardsStateView 
              savedFlashcards={savedFlashcards}
              setSavedFlashcards={setSavedFlashcards}
              onExit={() => {
                setCurrentState(AppState.DASHBOARD_STATE);
                setSelectiveReviewCardId(null);
              }}
              initialReviewCardId={selectiveReviewCardId}
              onClearInitialReviewCardId={() => setSelectiveReviewCardId(null)}
            />
          )}
          {currentState === AppState.QUESTION_BANK_STATE && (
            <QuestionBankStateView 
              questionBank={questionBank}
              onExit={() => setCurrentState(AppState.DASHBOARD_STATE)}
            />
          )}
          {currentState === AppState.PRESENTATIONS_STATE && (
            <PresentationsStateView 
              onExit={() => setCurrentState(AppState.DASHBOARD_STATE)}
            />
          )}
        </div>

        {/* Persistent Modular Floating Action Button for reviews */}
        <ReviewFAB
          quizHistory={quizHistory}
          savedFlashcards={savedFlashcards}
          questionBank={questionBank}
          currentState={currentState}
          setCurrentState={setCurrentState}
          setSelectedSubject={setSelectedSubject}
          setSelectedTopic={setSelectedTopic}
        />

        {/* Persistent Floating Companion Insight */}
        <CompanionInsight 
          quizHistory={quizHistory}
          totalTimeStudied={totalTimeStudied}
          timeSpentPerTopic={timeSpentPerTopic}
          savedFlashcardsCount={savedFlashcards.length}
          difficultyLevel={getCurrentDifficulty(selectedSubject)}
          curriculumLevel={curriculumLevel}
          userName={userName || "Learner"}
          currentState={currentState}
        />

        {/* Milestone Celebration Toast Overlay */}
        <AnimatePresence>
          {activeToastBadge && (() => {
            const badge = currentBadges.find(b => b.id === activeToastBadge);
            if (!badge) return null;
            
            const IconComponent = (() => {
              switch (badge.iconName) {
                case "Award": return Award;
                case "Flame": return Flame;
                case "Trophy": return Trophy;
                case "Sparkles": return Sparkles;
                case "BookOpen": return BookOpen;
                case "Presentation": return Presentation;
                case "Layers": return Bookmark;
                case "Clock": return Clock;
                default: return Award;
              }
            })();

            return (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-900 border border-amber-400 text-white rounded-2xl p-4 shadow-xl flex items-center gap-3.5 z-[120] max-w-sm w-[90%] pointer-events-auto select-none"
                id="milestone-badge-toast"
              >
                <div className="relative p-2.5 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center shrink-0">
                  <IconComponent size={18} className="stroke-[2.5]" />
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <span className="text-[9px] font-mono font-black text-amber-400 tracking-wider uppercase leading-none block">
                    Milestone Unlocked!
                  </span>
                  <h4 className="text-xs font-black text-white tracking-tight mt-1 truncate">
                    {badge.title}
                  </h4>
                  <p className="text-[9.5px] text-slate-350 leading-normal mt-0.5">
                    {badge.description}
                  </p>
                </div>

                <button 
                  onClick={() => setActiveToastBadge(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 shrink-0 transition-colors"
                  id="btn-close-badge-toast"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })()}
        </AnimatePresence>


      </main>
    </div>
  );
}
