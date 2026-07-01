import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  AppState,
  MissedQuestion,
  QuizHistoryEntry,
  SubjectItem,
  SavedFlashcard,
  getNextRevisionSchedule,
  QuestionBankItem,
  MilestoneBadge,
} from "./types";
import {
  onFirebaseAuthChange,
  getUserProfile,
  saveUserProfile,
  firebaseSignOut,
} from "./firebase";
import {
  ArrowRight,
  Info,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowLeft,
  X,
  Home,
  FileText,
  Settings,
  Bookmark,
  BookOpen,
  Presentation,
  Sun,
  Moon,
  Award,
  Flame,
  Trophy,
  Clock,
  GraduationCap,
  Grid3X3,
} from "lucide-react";
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
  const [dataLoadedFromLocalStorage, setDataLoadedFromLocalStorage] =
    useState<boolean>(initialLocalStorageMatched);
  // Firebase Auth uid for the signed-in user (anonymous sign-in via LoginStateView)
  const [userId, setUserId] = useState<string>("");
  // authInitializing stays true only when there is no localStorage data — we wait
  // briefly for Firebase to check Firestore before showing the login screen, so
  // users on a new device with existing data skip login automatically.
  const [authInitializing, setAuthInitializing] = useState<boolean>(!savedData);
  // Debounce timer ref for Firestore writes to avoid excessive writes on rapid state changes
  const firestoreDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
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

  // ── Firebase Auth listener ─────────────────────────────────────────────────
  // Runs once on mount. Firebase resolves the cached Auth session from
  // browserLocalPersistence almost immediately (<100 ms), so the loading flash
  // is imperceptible when localStorage data already exists.
  useEffect(() => {
    const unsub = onFirebaseAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUserId(firebaseUser.uid);
        // Only pull Firestore data when there is no local cache — this is the
        // "new device" restore path. Existing-device users already have fresh
        // state in memory from the localStorage initializer.
        if (!savedData) {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile && (profile.userName || profile.curriculumLevel)) {
            setUserName(profile.userName || "");
            setUserEmail(profile.userEmail || "");
            setCurriculumLevel(profile.curriculumLevel || "");
            setQuizHistory(profile.quizHistory || []);
            setSubjectDifficulties(profile.subjectDifficulties || {});
            setCustomSubjects(profile.customSubjects || []);
            setTopicsLearnedCount(profile.topicsLearnedCount || 0);
            setTopicStatuses(profile.topicStatuses || {});
            setTotalTimeStudied(profile.totalTimeStudied || 0);
            setTimeSpentPerTopic(profile.timeSpentPerTopic || {});
            setTimeStudiedByDate(profile.timeStudiedByDate || {});
            setSavedFlashcards(profile.savedFlashcards || []);
            setQuestionBank(profile.questionBank || []);
            setDataLoadedFromLocalStorage(true);
            setCurrentState(
              profile.curriculumLevel
                ? AppState.SUBJECT_SELECTION_STATE
                : AppState.ONBOARDING_STATE,
            );
          }
        }
      }
      // Auth state resolved — stop blocking the UI
      setAuthInitializing(false);
    });
    return () => unsub();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const nextNum = prev + 1;
      if (nextNum >= 5) {
        setDebugMode((curr) => {
          const newValue = !curr;
          localStorage.setItem(
            "lernera_debug_mode",
            newValue ? "true" : "false",
          );
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
    const systemPrefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
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
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<
    "overview" | "history" | "materials" | "settings"
  >("overview");

  const [userName, setUserName] = useState<string>(
    () => savedData?.userName || "",
  );
  const [userEmail, setUserEmail] = useState<string>(
    () => savedData?.userEmail || "",
  );
  const [curriculumLevel, setCurriculumLevel] = useState<string>(
    () => savedData?.curriculumLevel || "",
  );
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [missedQuestions, setMissedQuestions] = useState<MissedQuestion[]>([]);
  const [topicsLearnedCount, setTopicsLearnedCount] = useState<number>(
    () => savedData?.topicsLearnedCount || 0,
  );
  const [quizHistory, setQuizHistory] = useState<QuizHistoryEntry[]>(
    () => savedData?.quizHistory || [],
  );
  const [subjectDifficulties, setSubjectDifficulties] = useState<
    Record<string, "beginner" | "intermediate" | "advanced">
  >(() => savedData?.subjectDifficulties || {});
  const [difficultyFeedback, setDifficultyFeedback] = useState<string | null>(
    null,
  );
  const [lastModelUsed, setLastModelUsed] = useState<string>("None");
  const [customSubjects, setCustomSubjects] = useState<SubjectItem[]>(
    () => savedData?.customSubjects || [],
  );
  const [topicStatuses, setTopicStatuses] = useState<
    Record<string, "read" | "quiz_completed" | "completed">
  >(() => savedData?.topicStatuses || {});
  const [savedFlashcards, setSavedFlashcards] = useState<SavedFlashcard[]>(
    () => savedData?.savedFlashcards || [],
  );
  const [selectiveReviewCardId, setSelectiveReviewCardId] = useState<
    string | null
  >(null);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>(
    () => savedData?.questionBank || [],
  );
  const [sessionLearningGoal, setSessionLearningGoal] = useState<
    "exam_prep" | "deep_understanding"
  >("deep_understanding");
  const [sessionLearningMode, setSessionLearningMode] = useState<
    "read" | "listen"
  >("read");
  const [sessionDetailLevel, setSessionDetailLevel] = useState<
    "concise" | "standard" | "comprehensive"
  >("standard");

  // Real-time active study time session variables
  const [totalTimeStudied, setTotalTimeStudied] = useState<number>(
    () => savedData?.totalTimeStudied || 0,
  );
  const [timeSpentPerTopic, setTimeSpentPerTopic] = useState<
    Record<string, number>
  >(() => savedData?.timeSpentPerTopic || {});
  const [timeStudiedByDate, setTimeStudiedByDate] = useState<
    Record<string, number>
  >(() => savedData?.timeStudiedByDate || {});

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

  // ── Top stats bar computed values ──────────────────────────────────────────
  const { currentStreak, todayMinutes } = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const toKey = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const todayKey = toKey(new Date());
    const todaySecs = timeStudiedByDate[todayKey] || 0;
    // Count consecutive days ending today that have recorded study time > 0
    let streak = 0;
    const MS_PER_DAY = 86_400_000;
    const now = Date.now();
    for (let i = 0; i < 365; i++) {
      const key = toKey(new Date(now - i * MS_PER_DAY));
      if ((timeStudiedByDate[key] || 0) > 0) {
        streak++;
      } else {
        break;
      }
    }
    return { currentStreak: streak, todayMinutes: Math.floor(todaySecs / 60) };
  }, [timeStudiedByDate]);

  const avgQuizScore = useMemo(() => {
    if (quizHistory.length === 0) return 0;
    const sum = quizHistory.reduce((acc, entry) => {
      if (!entry.totalQuestions) return acc;
      return acc + (entry.score / entry.totalQuestions) * 100;
    }, 0);
    return Math.round(sum / quizHistory.length);
  }, [quizHistory]);

  const currentBadges = useMemo(() => {
    return computeMilestoneBadges({
      topicStatuses,
      quizHistory,
      customSubjects,
      totalTimeStudied,
      savedFlashcards,
      timeStudiedByDate,
      presentationsCount,
    });
  }, [
    topicStatuses,
    quizHistory,
    customSubjects,
    totalTimeStudied,
    savedFlashcards,
    timeStudiedByDate,
    presentationsCount,
  ]);

  useEffect(() => {
    if (!userName) return;
    const newlyUnlocked = currentBadges.find(
      (b) => b.isUnlocked && !notifiedBadges.includes(b.id),
    );
    if (newlyUnlocked) {
      setActiveToastBadge(newlyUnlocked.id);
      const nextNotified = [...notifiedBadges, newlyUnlocked.id];
      setNotifiedBadges(nextNotified);
      localStorage.setItem(
        "lernera_notified_badges",
        JSON.stringify(nextNotified),
      );
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
    const topicsMap: Record<
      string,
      { topic: string; subject: string; stage: number; nextReviewDate: string }
    > = {};
    quizHistory.forEach((q) => {
      if (q.topic) {
        const key = `${q.subject.trim().toLowerCase()}::${q.topic.trim().toLowerCase()}`;
        topicsMap[key] = {
          topic: q.topic,
          subject: q.subject,
          stage: q.reviewStage ?? 0,
          nextReviewDate: q.nextReviewDate
            ? new Date(q.nextReviewDate).toLocaleDateString()
            : "Not set",
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
    if (
      currentState === AppState.LEARNING_STATE &&
      selectedSubject &&
      selectedTopic
    ) {
      const trimmedSubject = selectedSubject.trim().toLowerCase();
      const trimmedTopic = selectedTopic.trim().toLowerCase();

      const topicHistory = quizHistory.filter(
        (q) =>
          q.topic &&
          q.topic.trim().toLowerCase() === trimmedTopic &&
          q.subject &&
          q.subject.trim().toLowerCase() === trimmedSubject,
      );

      if (topicHistory.length === 0) {
        // Never studied before -> start at Beginner difficulty
        setSubjectDifficulties((prev) => ({
          ...prev,
          [selectedSubject]: "beginner",
        }));
      } else {
        // Previously studied -> open at last recorded difficulty level
        const lastEntry = topicHistory[topicHistory.length - 1];
        const lastDiff =
          (lastEntry.difficultyLevel as
            | "beginner"
            | "intermediate"
            | "advanced") || "beginner";
        setSubjectDifficulties((prev) => ({
          ...prev,
          [selectedSubject]: lastDiff,
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
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const date = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${date}`;
        })();

        const subjectKey = selectedSubject || "General";
        const topicKey = selectedTopic || "General Topic";
        const compositeKey = `${subjectKey.trim().toLowerCase()}::${topicKey.trim().toLowerCase()}`;

        setTotalTimeStudied((prev) => prev + 1);

        setTimeSpentPerTopic((prev) => {
          const currentSecs = prev[compositeKey] || 0;
          return {
            ...prev,
            [compositeKey]: currentSecs + 1,
          };
        });

        setTimeStudiedByDate((prev) => {
          const currentSecs = prev[todayDate] || 0;
          return {
            ...prev,
            [todayDate]: currentSecs + 1,
          };
        });
      }
    }, 1000);

    return () => {
      clearInterval(sessionTimer);
    };
  }, [currentState, selectedSubject, selectedTopic]);

  const updateTopicStatus = (
    subject: string,
    topic: string,
    status: "read" | "quiz_completed" | "completed",
  ) => {
    const key = `${subject.trim().toLowerCase()}::${topic.trim().toLowerCase()}`;
    setTopicStatuses((prev) => {
      const current = prev[key];
      if (current === "completed" && status !== "completed") {
        return prev;
      }
      if (current === "quiz_completed" && status === "read") {
        return prev;
      }
      return {
        ...prev,
        [key]: status,
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
        questionBank,
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
    questionBank,
  ]);

  // ── Debounced Firestore sync ───────────────────────────────────────────────
  // Writes the full user profile to Firestore 3 s after the last state change,
  // only when a Firebase uid is available. Strips React nodes (icon) from
  // customSubjects since they are not Firestore-serialisable.
  useEffect(() => {
    if (!userId) return;
    if (firestoreDebounceRef.current)
      clearTimeout(firestoreDebounceRef.current);
    firestoreDebounceRef.current = setTimeout(() => {
      const serialisableSubjects = customSubjects.map(
        ({ icon: _icon, ...rest }: SubjectItem) => rest,
      );
      saveUserProfile(userId, {
        userName,
        userEmail,
        curriculumLevel,
        quizHistory,
        subjectDifficulties,
        customSubjects: serialisableSubjects,
        topicsLearnedCount,
        topicStatuses,
        totalTimeStudied,
        timeSpentPerTopic,
        timeStudiedByDate,
        savedFlashcards,
        questionBank,
      });
    }, 3000);
    return () => {
      if (firestoreDebounceRef.current)
        clearTimeout(firestoreDebounceRef.current);
    };
  }, [
    userId,
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
    questionBank,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResetProgress = () => {
    // Sign out of Firebase so the persisted auth session is cleared
    firebaseSignOut().catch(() => {});
    setUserId("");
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
  const getCurrentDifficulty = (
    subject: string | null,
  ): "beginner" | "intermediate" | "advanced" => {
    if (!subject) return "beginner";
    return subjectDifficulties[subject] || "beginner";
  };

  const handleToggleSaveFlashcard = (
    card: { front: string; back: string },
    subject: string,
    topic: string,
  ) => {
    setSavedFlashcards((prev) => {
      const exists = prev.some(
        (item) =>
          item.front.trim().toLowerCase() === card.front.trim().toLowerCase() &&
          item.subject.trim().toLowerCase() === subject.trim().toLowerCase(),
      );
      if (exists) {
        return prev.filter(
          (item) =>
            !(
              item.front.trim().toLowerCase() ===
                card.front.trim().toLowerCase() &&
              item.subject.trim().toLowerCase() === subject.trim().toLowerCase()
            ),
        );
      } else {
        const newSaved: SavedFlashcard = {
          id: `fc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          front: card.front,
          back: card.back,
          subject: subject,
          topic: topic,
          timestamp: new Date().toISOString(),
        };
        return [...prev, newSaved];
      }
    });
  };

  const handleSaveQAPairs = (qas: { question: string; answer: string }[]) => {
    if (!selectedSubject || !selectedTopic) return;
    const finalSubject = selectedSubject;
    const finalTopic = selectedTopic;
    setQuestionBank((prev) => {
      const next = [...prev];
      qas.forEach((q) => {
        const existingIndex = next.findIndex(
          (item) =>
            item.subject.trim().toLowerCase() ===
              finalSubject.trim().toLowerCase() &&
            item.topic.trim().toLowerCase() ===
              finalTopic.trim().toLowerCase() &&
            item.question.trim().toLowerCase() ===
              q.question.trim().toLowerCase(),
        );
        if (existingIndex !== -1) {
          next[existingIndex] = {
            ...next[existingIndex],
            answer: q.answer,
            type: "qa",
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
            timestamp: new Date().toISOString(),
          });
        }
      });
      return next;
    });
  };

  const handleQuizComplete = (
    score: number,
    totalQuestions: number,
    questions?: any[],
  ) => {
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
        feedback =
          "Let's reinforce the fundamentals — returning to Intermediate level";
      } else if (currentDiff === "intermediate") {
        newDiff = "beginner";
        feedback = "Let's reinforce the basics — returning to Beginner level";
      }
    }

    if (newDiff !== currentDiff) {
      setSubjectDifficulties((prev) => ({
        ...prev,
        [finalSubject]: newDiff,
      }));
      setDifficultyFeedback(feedback);
    } else {
      setDifficultyFeedback(null);
    }

    // Spaced repetition scheduling calculation using shared getNextRevisionSchedule logic
    const prevAttempts = quizHistory.filter(
      (q) =>
        q.topic &&
        selectedTopic &&
        q.topic.trim().toLowerCase() === selectedTopic.trim().toLowerCase() &&
        q.subject &&
        q.subject.trim().toLowerCase() === finalSubject.trim().toLowerCase(),
    );

    const lastQuiz =
      prevAttempts.length > 0 ? prevAttempts[prevAttempts.length - 1] : null;
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
      reviewStage: schedule.reviewStage,
    };

    setQuizHistory((prev) => [...prev, newEntry]);

    // Append quiz questions to the persistent Question Bank state organized by subject -> topic without duplicates
    if (questions && Array.isArray(questions)) {
      setQuestionBank((prev) => {
        const next = [...prev];
        questions.forEach((q) => {
          const alreadyExists = next.some(
            (item) =>
              item.subject.trim().toLowerCase() ===
                finalSubject.trim().toLowerCase() &&
              item.topic.trim().toLowerCase() ===
                selectedTopic.trim().toLowerCase() &&
              item.question.trim().toLowerCase() ===
                q.question.trim().toLowerCase(),
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
              timestamp: new Date().toISOString(),
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
      const matched = docs.find(
        (d: any) => d.name === cleanSubject || d.name === selectedSubject,
      );
      if (!matched) return null;

      if (selectedTopic && matched.topics) {
        const matchedTopic = matched.topics.find(
          (t: any) =>
            t.name.trim().toLowerCase() === selectedTopic.trim().toLowerCase(),
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
    ...(!curriculumLevel || currentState === AppState.ONBOARDING_STATE
      ? [{ state: AppState.ONBOARDING_STATE, label: "Profile Setup" }]
      : []),
    { state: AppState.DASHBOARD_STATE, label: "Desk Hub" },
    { state: AppState.SUBJECT_SELECTION_STATE, label: "Syllabus Pick" },
    { state: AppState.TOPIC_SOURCE_SELECTION_STATE, label: "Syllabus Plan" },
    { state: AppState.LEARNING_STATE, label: "Study Room" },
    { state: AppState.QUIZ_STATE, label: "Recall Quiz" },
    { state: AppState.FLASHCARD_STATE, label: "Flashcards" },
  ];

  // Helper to determine index of states
  const getActiveIndex = () => {
    return statesFlow.findIndex((item) => item.state === currentState);
  };

  const activeIndex = getActiveIndex();

  // Determine maximum width depending on current state to give responsive rhythm
  const getMaxWidthClass = () => {
    if (currentState === AppState.DASHBOARD_STATE) return "max-w-2xl";
    if (
      currentState === AppState.SUBJECT_SELECTION_STATE ||
      currentState === AppState.LEARNING_STATE
    )
      return "max-w-3xl";
    return "max-w-md";
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 antialiased transition-colors duration-200"
      id="state-machine-app"
    >
      {/* Auth initialization screen — visible only on devices with no local cache
          while Firebase resolves whether the user has an existing Firestore profile.
          Disappears in < 500 ms once onAuthStateChanged fires. */}
      {authInitializing && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950">
          <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/60 dark:border-indigo-900/60 flex items-center justify-center animate-pulse">
            <Sparkles
              size={18}
              className="text-indigo-500 dark:text-indigo-400"
            />
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Restoring session…
          </p>
        </div>
      )}
      {/* ── App Header ─────────────────────────────────────────────────── */}
      {currentState !== AppState.LOGIN_STATE &&
        currentState !== AppState.ONBOARDING_STATE && (
          <header
            className="w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40 px-4 py-3"
            id="app-header"
          >
            <div className="flex items-center justify-between">
              <div
                onClick={handleLogoClick}
                className="cursor-pointer select-none"
                title="Click 5 times to toggle debug mode"
                id="app-header-logo"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 leading-none mb-0.5">
                  LEARNERA
                </p>
                <h1 className="text-[22px] font-black text-slate-900 dark:text-white leading-none tracking-tight">
                  Academic
                </h1>
              </div>
              {debugMode && (
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-mono font-bold mx-2">
                  {currentState}
                </span>
              )}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer active:scale-95 transition-all flex items-center justify-center"
                id="header-theme-toggle"
                title={
                  theme === "light"
                    ? "Switch to Dark Mode"
                    : "Switch to Light Mode"
                }
              >
                {theme === "light" ? (
                  <Moon size={17} />
                ) : (
                  <Sun size={17} className="text-amber-400 fill-amber-400" />
                )}
              </button>
            </div>
          </header>
        )}

      {/* ── Top Stats Bar ──────────────────────────────────────────────────── */}
      {currentState !== AppState.LOGIN_STATE &&
        currentState !== AppState.ONBOARDING_STATE && (
          <div
            className="w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-5 py-2.5"
            id="top-stats-bar"
          >
            <div className="flex items-center">
              <div className="flex items-center gap-1.5 flex-1">
                <Flame size={14} className="text-orange-500 shrink-0" />
                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums leading-none">
                  {currentStreak}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-none">
                  d
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-1">
                <BookOpen size={14} className="text-blue-500 shrink-0" />
                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums leading-none">
                  {topicsLearnedCount}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-1">
                <Clock size={14} className="text-teal-500 shrink-0" />
                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums leading-none">
                  {todayMinutes}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-none">
                  m
                </span>
              </div>
              <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-3 shrink-0" />
              <div className="flex items-center gap-1.5 flex-1">
                <Trophy size={14} className="text-amber-500 shrink-0" />
                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums leading-none">
                  {avgQuizScore}%
                </span>
              </div>
            </div>
          </div>
        )}

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
                <span className="text-slate-400 font-sans">
                  Verification Hub
                </span>
                <span
                  className="text-[10px] bg-indigo-950/40 border border-indigo-800 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold"
                  id="debug-curriculum-level"
                >
                  CURRICULUM: {curriculumLevel || "NOT SET"}
                </span>
                <span
                  className={`inline-flex px-1.5 py-0.5 text-[9px] font-bold tracking-wide rounded border uppercase shrink-0 font-mono ${
                    dataLoadedFromLocalStorage
                      ? "bg-purple-950/40 border-purple-800 text-purple-300"
                      : "bg-amber-950/40 border-amber-850 text-amber-300"
                  }`}
                  id="debug-session-source"
                >
                  SESSION:{" "}
                  {dataLoadedFromLocalStorage
                    ? "LOADED FROM LOCALSTORAGE"
                    : "FRESH SESSION (NEW)"}
                </span>
                <span
                  className={`inline-flex px-1.5 py-0.5 text-[9px] font-bold tracking-wide rounded border uppercase shrink-0 font-mono ${
                    lastModelUsed.toLowerCase().includes("lite")
                      ? "bg-rose-950/40 border-rose-800 text-rose-300"
                      : lastModelUsed !== "None"
                        ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >
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
                    Last quiz: {quizHistory[quizHistory.length - 1].topic} -{" "}
                    {quizHistory[quizHistory.length - 1].score}/
                    {quizHistory[quizHistory.length - 1].totalQuestions} -{" "}
                    {quizHistory[quizHistory.length - 1].difficultyLevel}
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Last quiz: None completed yet
                  </span>
                )}
              </div>
            </div>

            {spacedRepData.length > 0 && (
              <div className="mt-1 pt-1.5 border-t border-slate-800 text-[10px] text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-amber-500 font-bold uppercase select-none">
                  Spaced Repetition Schedule:
                </span>
                {spacedRepData.map((item, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-950/50 px-1.5 py-0.5 rounded border border-slate-800/60 font-mono text-slate-300"
                    id={`debug-spaced-rep-${idx}`}
                  >
                    {item.topic} &rarr;{" "}
                    <strong className="text-indigo-400">
                      Stage {item.stage}
                    </strong>{" "}
                    (Next: {item.nextReviewDate})
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main View Display Port */}
      <main
        className="flex-1 flex flex-col items-center justify-center py-10 px-4 sm:py-16 md:py-24 pb-24 sm:pb-24 md:pb-24"
        id="state-display-port"
      >
        <div
          className={`w-full ${getMaxWidthClass()} bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ease-out`}
          id="current-state-card"
        >
          {/* Active Screen Rendering */}
          {currentState === AppState.LOGIN_STATE && (
            <LoginStateView
              onLogin={(name, email, uid) => {
                setUserId(uid);
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
              }}
            />
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
                  setSubjectDifficulties((prev) => ({
                    ...prev,
                    [selectedSubject]: newDiff,
                  }));
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
                  updateTopicStatus(
                    selectedSubject,
                    selectedTopic,
                    "quiz_completed",
                  );
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
                setTopicsLearnedCount((prev) => prev + 1);
                if (selectedSubject && selectedTopic) {
                  updateTopicStatus(
                    selectedSubject,
                    selectedTopic,
                    "completed",
                  );
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
          {activeToastBadge &&
            (() => {
              const badge = currentBadges.find(
                (b) => b.id === activeToastBadge,
              );
              if (!badge) return null;

              const IconComponent = (() => {
                switch (badge.iconName) {
                  case "Award":
                    return Award;
                  case "Flame":
                    return Flame;
                  case "Trophy":
                    return Trophy;
                  case "Sparkles":
                    return Sparkles;
                  case "BookOpen":
                    return BookOpen;
                  case "Presentation":
                    return Presentation;
                  case "Layers":
                    return Bookmark;
                  case "Clock":
                    return Clock;
                  default:
                    return Award;
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

        {/* ── Bottom Navigation Bar + More Sheet ──────────────────────────── */}
        {currentState !== AppState.LOGIN_STATE &&
          currentState !== AppState.ONBOARDING_STATE && (
            <>
              {/* More bottom sheet */}
              <AnimatePresence>
                {isMoreSheetOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => setIsMoreSheetOpen(false)}
                      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40"
                      id="more-sheet-backdrop"
                    />
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "tween", duration: 0.2 }}
                      className="fixed bottom-[64px] left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-2xl px-4 pt-3 pb-6 shadow-2xl"
                      id="more-sheet-panel"
                    >
                      <div className="w-8 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-3" />
                      <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 pl-1">
                        More
                      </p>
                      <div className="space-y-0.5">
                        {(
                          [
                            {
                              label: `Saved Flashcards (${savedFlashcards.length})`,
                              icon: <Bookmark size={15} />,
                              targetState: AppState.SAVED_FLASHCARDS_STATE,
                              dashTab: null,
                            },
                            {
                              label: `Question Bank (${questionBank.length})`,
                              icon: <BookOpen size={15} />,
                              targetState: AppState.QUESTION_BANK_STATE,
                              dashTab: null,
                            },
                            {
                              label: "Presentations",
                              icon: <Presentation size={15} />,
                              targetState: AppState.PRESENTATIONS_STATE,
                              dashTab: null,
                            },
                            {
                              label: "Badges & Settings",
                              icon: <Settings size={15} />,
                              targetState: AppState.DASHBOARD_STATE,
                              dashTab: "settings" as const,
                            },
                          ] as const
                        ).map((item) => (
                          <button
                            key={item.label}
                            onClick={() => {
                              setCurrentState(item.targetState);
                              if (item.dashTab) setDashboardTab(item.dashTab);
                              setIsMoreSheetOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                          >
                            <span className="text-emerald-500 dark:text-emerald-400">
                              {item.icon}
                            </span>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Fixed 5-tab bottom nav */}
              <nav
                className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800"
                id="bottom-nav-bar"
                style={{ boxShadow: "0 -2px 16px rgba(0,0,0,0.07)" }}
              >
                <div className="flex items-stretch h-16 max-w-xl mx-auto">
                  {[
                    {
                      id: "hub",
                      label: "Hub",
                      icon: (active: boolean) => (
                        <Home
                          size={20}
                          className={
                            active
                              ? "text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-900/40"
                              : "text-slate-400 dark:text-slate-500"
                          }
                        />
                      ),
                      isActive: currentState === AppState.DASHBOARD_STATE,
                      onClick: () => {
                        setCurrentState(AppState.DASHBOARD_STATE);
                        setIsMoreSheetOpen(false);
                      },
                    },
                    {
                      id: "syllabus",
                      label: "Syllabus",
                      icon: (active: boolean) => (
                        <BookOpen
                          size={20}
                          className={
                            active
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400 dark:text-slate-500"
                          }
                        />
                      ),
                      isActive:
                        currentState === AppState.SUBJECT_SELECTION_STATE,
                      onClick: () => {
                        setCurrentState(AppState.SUBJECT_SELECTION_STATE);
                        setIsMoreSheetOpen(false);
                      },
                    },
                    {
                      id: "study-room",
                      label: "Study Room",
                      icon: (active: boolean) => (
                        <GraduationCap
                          size={20}
                          className={
                            active
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400 dark:text-slate-500"
                          }
                        />
                      ),
                      isActive: currentState === AppState.LEARNING_STATE,
                      onClick: () => {
                        setCurrentState(
                          selectedSubject && selectedTopic
                            ? AppState.LEARNING_STATE
                            : AppState.SUBJECT_SELECTION_STATE,
                        );
                        setIsMoreSheetOpen(false);
                      },
                    },
                    {
                      id: "quiz-arena",
                      label: "Quiz Arena",
                      icon: (active: boolean) => (
                        <Trophy
                          size={20}
                          className={
                            active
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400 dark:text-slate-500"
                          }
                        />
                      ),
                      isActive: currentState === AppState.QUIZ_STATE,
                      onClick: () => {
                        setCurrentState(
                          selectedSubject && selectedTopic
                            ? AppState.QUIZ_STATE
                            : AppState.SUBJECT_SELECTION_STATE,
                        );
                        setIsMoreSheetOpen(false);
                      },
                    },
                    {
                      id: "more",
                      label: "More",
                      icon: (active: boolean) => (
                        <Grid3X3
                          size={20}
                          className={
                            active
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400 dark:text-slate-500"
                          }
                        />
                      ),
                      isActive:
                        [
                          AppState.SAVED_FLASHCARDS_STATE,
                          AppState.QUESTION_BANK_STATE,
                          AppState.PRESENTATIONS_STATE,
                        ].includes(currentState) || isMoreSheetOpen,
                      onClick: () => setIsMoreSheetOpen((prev) => !prev),
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={tab.onClick}
                      id={`bottom-nav-${tab.id}`}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer relative pb-1 ${
                        tab.isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {tab.icon(tab.isActive)}
                      <span
                        className={`text-[9px] font-bold tracking-wide leading-none ${tab.isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                      >
                        {tab.label}
                      </span>
                      {tab.isActive && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>
              </nav>
            </>
          )}
      </main>
    </div>
  );
}
