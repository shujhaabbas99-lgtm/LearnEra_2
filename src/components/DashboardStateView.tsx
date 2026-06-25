import React, { useState, useMemo } from "react";
import { LayoutDashboard, ArrowRight, Trophy, Flame, Play, BookOpen, Clock, Award, FileText, Trash2, ArrowLeft, AlertTriangle, Calendar, Bookmark, Moon, Sun, Sparkles, Presentation } from "lucide-react";
import { motion } from "motion/react";
import { QuizHistoryEntry, SavedFlashcard, MilestoneBadge } from "../types";
import QuizTrendsChart from "./QuizTrendsChart";

interface DashboardStateViewProps {
  onNext: () => void;
  userName: string;
  topicsLearned: number;
  subjectDifficulties: Record<string, "beginner" | "intermediate" | "advanced">;
  quizHistory: QuizHistoryEntry[];
  curriculumLevel: string;
  setCurriculumLevel: (level: string) => void;
  onResumeDocument?: (doc: { name: string; content: string; focus: string }) => void;
  onResetProgress?: () => void;
  onReviewTopic?: (subjectName: string, topicName: string) => void;
  activeTab?: "overview" | "history" | "materials" | "settings";
  onTabChange?: (tab: "overview" | "history" | "materials" | "settings") => void;
  totalTimeStudied?: number;
  timeSpentPerTopic?: Record<string, number>;
  timeStudiedByDate?: Record<string, number>;
  savedFlashcards?: SavedFlashcard[];
  theme?: "light" | "dark";
  toggleTheme?: () => void;
  badges?: MilestoneBadge[];
}

export default function DashboardStateView({ 
  onNext, 
  userName, 
  topicsLearned,
  subjectDifficulties,
  quizHistory,
  curriculumLevel,
  setCurriculumLevel,
  onResumeDocument,
  onResetProgress,
  onReviewTopic,
  activeTab,
  onTabChange,
  totalTimeStudied = 0,
  timeSpentPerTopic = {},
  timeStudiedByDate = {},
  savedFlashcards = [],
  theme = "light",
  toggleTheme,
  badges = []
}: DashboardStateViewProps) {
  const [isEditingLevel, setIsEditingLevel] = useState(false);
  const [tempLevel, setTempLevel] = useState(curriculumLevel);
  const [localActiveTab, setLocalActiveTab] = useState<"overview" | "history" | "materials" | "settings">("overview");

  const activeTabToUse = activeTab || localActiveTab;
  const setActiveTabToUse = onTabChange || setLocalActiveTab;

  // Loaded list of documents
  const [savedDocs, setSavedDocs] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("uploadedDocuments");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleDeleteDocument = (docId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const filtered = savedDocs.filter((d: any) => d.id !== docId);
    setSavedDocs(filtered);
    localStorage.setItem("uploadedDocuments", JSON.stringify(filtered));
  };

  const displayGreeting = userName ? `Welcome back, ${userName}!` : "Welcome back, Learner!";

  // 1. "Topics learned" should count unique topics where the user has completed at least one quiz
  const uniqueTopics = Array.from(new Set(quizHistory.map(q => q.topic.trim()))).filter(Boolean);
  const derivedTopicsLearnedCount = uniqueTopics.length;

  // Helper to parse dates in local timezone safely
  const getLocalDateString = (timestampStr: string): string | null => {
    try {
      const d = new Date(timestampStr);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const date = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${date}`;
      }
    } catch (_) {}
    
    // Fallback if timestamp has colon but not parsed directly (e.g., legacy "10:15:22 PM")
    if (timestampStr && timestampStr.includes(":")) {
      const d = new Date(); // assume today
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${date}`;
    }
    return null;
  };

  // 2. "Daily Streak" tracks consecutive days with at least one completed quiz
  const quizDates = Array.from(new Set(
    quizHistory
      .map(q => getLocalDateString(q.timestamp))
      .filter((d): d is string => d !== null)
  )).sort(); // Ascending order, e.g., ["2026-06-17", "2026-06-18", "2026-06-19"]

  const todayDate = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  })();

  const yesterdayDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  })();

  let streakDays = 0;
  const datesSet = new Set(quizDates);

  if (datesSet.has(todayDate)) {
    streakDays = 1;
    const current = new Date();
    while (true) {
      current.setDate(current.getDate() - 1);
      const yr = current.getFullYear();
      const mo = String(current.getMonth() + 1).padStart(2, '0');
      const dt = String(current.getDate()).padStart(2, '0');
      const prevDateStr = `${yr}-${mo}-${dt}`;
      if (datesSet.has(prevDateStr)) {
        streakDays++;
      } else {
        break;
      }
    }
  } else if (datesSet.has(yesterdayDate)) {
    streakDays = 1;
    const current = new Date();
    current.setDate(current.getDate() - 1); // Start checking back from yesterday
    while (true) {
      current.setDate(current.getDate() - 1);
      const yr = current.getFullYear();
      const mo = String(current.getMonth() + 1).padStart(2, '0');
      const dt = String(current.getDate()).padStart(2, '0');
      const prevDateStr = `${yr}-${mo}-${dt}`;
      if (datesSet.has(prevDateStr)) {
        streakDays++;
      } else {
        break;
      }
    }
  }

  // Generate the last 30 days chronologically for the activity heatmap
  const last30Days = useMemo(() => {
    const dates = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${date}`;
      const dayLabel = d.getDate();
      
      dates.push({
        dateStr,
        dayLabel,
        hasQuiz: datesSet.has(dateStr),
        isToday: dateStr === todayDate
      });
    }
    return dates;
  }, [datesSet, todayDate]);

  // 3. "Average Score" — overall average quiz percentage across all attempts
  let averageScore = 0;
  if (quizHistory.length > 0) {
    const totalPercentage = quizHistory.reduce((sum, q) => {
      const pct = q.totalQuestions > 0 ? (q.score / q.totalQuestions) * 100 : 0;
      return sum + pct;
    }, 0);
    averageScore = Math.round(totalPercentage / quizHistory.length);
  }

  const formatQuizTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch (_) {}
    return ts;
  };

  const formatFullTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${dateStr} @ ${timeStr}`;
      }
    } catch (_) {}
    return ts;
  };

  const formatDurationStr = (totalSeconds: number) => {
    if (!totalSeconds || totalSeconds < 0) return "0s";
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins < 60) {
      return `${mins}m ${secs}s`;
    }
    const hrs = (totalSeconds / 3600).toFixed(1);
    return `${hrs} hrs`;
  };

  // Spaced repetition metrics for Dashboard
  const spacedRepMetrics = useMemo(() => {
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
    const future7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const currentlyDue: Array<{ subject: string; topic: string; nextReviewDate: string; timestamp: string; itemType: "quiz" | "flashcard" }> = [];
    const upcomingNext7Days: Array<{ subject: string; topic: string; nextReviewDate: string; stage: number; itemType: "quiz" | "flashcard" }> = [];

    // 1. Quizzes
    for (const key in latestAttempts) {
      const q = latestAttempts[key];
      if (q.nextReviewDate) {
        const nextReview = new Date(q.nextReviewDate);
        if (nextReview <= now) {
          currentlyDue.push({
            subject: q.subject,
            topic: q.topic,
            nextReviewDate: q.nextReviewDate,
            timestamp: q.timestamp,
            itemType: "quiz"
          });
        } else if (nextReview > now && nextReview <= future7Days) {
          upcomingNext7Days.push({
            subject: q.subject,
            topic: q.topic,
            nextReviewDate: q.nextReviewDate,
            stage: q.reviewStage ?? 0,
            itemType: "quiz"
          });
        }
      }
    }

    // 2. Saved Flashcards
    (savedFlashcards || []).forEach(fc => {
      if (!fc.nextReviewDate) {
        currentlyDue.push({
          subject: fc.subject,
          topic: fc.topic,
          nextReviewDate: new Date().toISOString(),
          timestamp: fc.timestamp || new Date().toISOString(),
          itemType: "flashcard"
        });
      } else {
        const nextReview = new Date(fc.nextReviewDate);
        if (nextReview <= now) {
          currentlyDue.push({
            subject: fc.subject,
            topic: fc.topic,
            nextReviewDate: fc.nextReviewDate,
            timestamp: fc.timestamp || new Date().toISOString(),
            itemType: "flashcard"
          });
        } else if (nextReview > now && nextReview <= future7Days) {
          upcomingNext7Days.push({
            subject: fc.subject,
            topic: fc.topic,
            nextReviewDate: fc.nextReviewDate,
            stage: fc.reviewStage ?? 0,
            itemType: "flashcard"
          });
        }
      }
    });

    upcomingNext7Days.sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime());

    return {
      dueCount: currentlyDue.length,
      currentlyDue,
      upcoming: upcomingNext7Days
    };
  }, [quizHistory, savedFlashcards]);

  const todayDateString = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  })();

  const secondsToday = timeStudiedByDate[todayDateString] || 0;
  const timeStudiedTodayStr = formatDurationStr(secondsToday);
  const totalTimeStudiedStr = formatDurationStr(totalTimeStudied);

  // Real stats for the dashboard progress
  const stats = [
    { 
      label: "Topics Learned", 
      value: `${derivedTopicsLearnedCount}`, 
      sub: "Goal: 10 topics", 
      icon: <BookOpen className="text-indigo-600" size={18} />, 
      bg: "bg-indigo-50 border-indigo-100/50" 
    },
    { 
      label: "Time Studied Today", 
      value: timeStudiedTodayStr, 
      sub: "Active session timing", 
      icon: <Clock className="text-emerald-600" size={18} />, 
      bg: "bg-emerald-50 border-emerald-100/50" 
    },
    { 
      label: "Total Time Studied", 
      value: totalTimeStudiedStr, 
      sub: "Across all sessions", 
      icon: <Award className="text-amber-600" size={18} />, 
      bg: "bg-amber-50 border-amber-100/50" 
    },
    { 
      label: "Active Streak", 
      value: `${streakDays} d`, 
      sub: "Keep it up!", 
      icon: <Flame className="text-rose-600" size={18} />, 
      bg: "bg-rose-50 border-rose-100/50" 
    },
    { 
      label: "Average Score", 
      value: quizHistory.length > 0 ? `${averageScore} %` : "-- %", 
      sub: "Goal: 85%+", 
      icon: <Trophy className="text-indigo-655" size={18} />, 
      bg: "bg-indigo-55 border-indigo-150/50" 
    }
  ];

  const studiedSubjects = Array.from(new Set([
    ...quizHistory.map(q => q.subject),
    ...Object.keys(subjectDifficulties)
  ])).filter(Boolean);

  // Group by topic to find the maximum (best) score for each topic
  const topicsMaxScores = useMemo(() => {
    const map: Record<string, { subject: string; topic: string; maxPercentage: number }> = {};
    
    quizHistory.forEach(q => {
      const topicKey = q.topic.trim();
      if (!topicKey) return;
      const pct = q.totalQuestions > 0 ? (q.score / q.totalQuestions) * 100 : 0;
      
      if (!map[topicKey]) {
        map[topicKey] = {
          subject: q.subject,
          topic: q.topic,
          maxPercentage: pct
        };
      } else {
        if (pct > map[topicKey].maxPercentage) {
          map[topicKey].maxPercentage = pct;
        }
      }
    });

    return Object.values(map);
  }, [quizHistory]);

  const topicsToReview = useMemo(() => {
    return topicsMaxScores.filter(item => item.maxPercentage < 60);
  }, [topicsMaxScores]);

  // Subject Performance Breakdown details
  const subjectPerformanceBreakdown = useMemo(() => {
    return studiedSubjects.map(subject => {
      const subjectQuizzes = quizHistory.filter(q => q.subject === subject);
      
      const uniqueTopicsUnderSubject = Array.from(new Set(
        subjectQuizzes.map(q => q.topic.trim())
      )).filter(Boolean);
      
      let subjectAvg = 0;
      if (subjectQuizzes.length > 0) {
        const pctSum = subjectQuizzes.reduce((sum, q) => {
          const pct = q.totalQuestions > 0 ? (q.score / q.totalQuestions) * 100 : 0;
          return sum + pct;
        }, 0);
        subjectAvg = Math.round(pctSum / subjectQuizzes.length);
      }

      // Sum the elapsed seconds for all topics under this subject
      const prefix = `${subject.trim().toLowerCase()}::`;
      const subjectSeconds = Object.entries(timeSpentPerTopic).reduce((sum, [key, secs]) => {
        if (key.startsWith(prefix)) {
          return sum + secs;
        }
        return sum;
      }, 0);

      // Best score per subject - aggregate the topic max scores for this subject
      const subjectTopicScores = topicsMaxScores.filter(t => t.subject === subject).map(t => t.maxPercentage);
      const subjectBest = subjectTopicScores.length > 0 ? Math.max(...subjectTopicScores) : null;

      return {
        subject,
        averageScore: subjectQuizzes.length > 0 ? subjectAvg : null,
        bestScore: subjectBest,
        topicsCount: uniqueTopicsUnderSubject.length,
        quizzesCount: subjectQuizzes.length,
        difficulty: subjectDifficulties[subject] || "beginner",
        studyTimeSecs: subjectSeconds
      };
    });
  }, [studiedSubjects, quizHistory, subjectDifficulties, timeSpentPerTopic, topicsMaxScores]);

  const getDifficultyBadgeClasses = (difficulty: "beginner" | "intermediate" | "advanced") => {
    switch (difficulty) {
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
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="p-8 sm:p-10 space-y-6"
      id="dashboard-state-view"
    >
      {/* Top action row to go back to syllabus */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100/60" id="dashboard-back-row">
        <button
          onClick={onNext}
          className="flex items-center gap-1.5 text-slate-550 hover:text-indigo-600 text-xs font-bold transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200/60 px-3.5 py-2 rounded-xl shadow-3xs"
          id="btn-close-dashboard"
        >
          <ArrowLeft size={13} className="stroke-[2.5]" />
          <span>Exit Dashboard to Syllabus Selection</span>
        </button>
        <span className="text-[10px] text-slate-400 font-bold font-mono tracking-wide uppercase hidden sm:block">Lernera Analytics Platform</span>
      </div>

      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="text-left space-y-1">
          <h2 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight">
            {displayGreeting}
          </h2>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Profile Status: Active Learner
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1" id="profile-level-settings-container">
            <span className="font-semibold text-[11px] text-slate-500">Edu Level:</span>
            <span className="font-bold text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-100/60" id="curriculum-level-value">
              {curriculumLevel || "Self-study"}
            </span>
          </div>
        </div>

        {/* Start Learning Call To Action Button */}
        <button
          onClick={onNext}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
          id="btn-dashboard-start-learning"
        >
          <Play size={12} fill="white" />
          <span>Start Learning</span>
          <ArrowRight size={12} />
        </button>
      </div>
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-150 gap-2 overflow-x-auto pb-px" id="dashboard-tab-navigation">
        {[
          { id: "overview", label: "Active Hub Overview" },
          { id: "history", label: `Quiz History Logs (${quizHistory.length})` },
          { id: "materials", label: `Uploaded Materials (${savedDocs.length})` },
          { id: "settings", label: "Settings" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabToUse(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-bold font-sans border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTabToUse === tab.id
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
            id={`btn-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTabToUse === "overview" && (
        <>
          {/* Grid of Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" id="dashboard-stats-grid">
            {stats.map((stat, i) => (
              <div 
                key={i} 
                className="p-4 bg-white border border-slate-150 rounded-2xl flex items-center gap-4 shadow-3xs"
              >
                <div className={`p-3 rounded-xl border ${stat.bg} shrink-0`}>
                  {stat.icon}
                </div>
                <div className="text-left">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                    {stat.label}
                  </span>
                  <span className="text-lg font-sans font-extrabold text-slate-900 font-mono tracking-tight block">
                    {stat.value}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {stat.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Milestone Badges Board Section */}
          <div className="p-4 bg-white border border-slate-150 rounded-2xl shadow-3xs space-y-4 text-left font-sans" id="dashboard-milestone-badges">
            <div className="pb-2.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Badges Earned
                </h4>
                <p className="text-[10px] text-slate-405 font-medium">
                  Milestones and recognition of study progression already tracked in local sessions
                </p>
              </div>
              <span className="self-start sm:self-center text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg select-none">
                {badges.filter(b => b.isUnlocked).length} / {badges.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {badges.map((badge) => {
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
                  <div
                    key={badge.id}
                    className={`p-3.5 rounded-xl border flex flex-col items-center text-center justify-between gap-2.5 transition-all select-none ${
                      badge.isUnlocked
                        ? "bg-slate-50/50 border-emerald-250 dark:border-emerald-900/40"
                        : "bg-slate-50/20 border-slate-150 opacity-40 grayscale"
                    }`}
                    title={badge.description}
                    id={`badge-card-${badge.id}`}
                  >
                    <div className={`p-2 rounded-lg ${
                      badge.isUnlocked 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}>
                      <IconComponent size={18} className="stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h5 className="font-bold text-[10.5px] text-slate-800 truncate tracking-tight leading-tight">
                        {badge.title}
                      </h5>
                      <p className="text-[8.5px] text-slate-400 leading-normal line-clamp-2">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subject Performance Breakdown Section */}
          <div className="space-y-4 text-left" id="dashboard-standing-section">
            <div>
              <h3 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider pl-1">
                Subject Performance Breakdown
              </h3>
              <p className="text-[10px] text-slate-400 pl-1 font-medium font-sans">Real-time metrics compiled per academic elective category</p>
            </div>
            
            {subjectPerformanceBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" id="dashboard-standing-grid">
                {subjectPerformanceBreakdown.map((item, idx) => {
                  return (
                    <div 
                      key={idx} 
                      className="p-4 bg-white border border-slate-200 rounded-2xl shadow-3xs space-y-3 hover:border-slate-350 hover:shadow-2xs transition-all"
                      id={`subject-standing-${item.subject.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-left">
                          <h4 className="font-sans font-extrabold text-sm text-slate-800 tracking-tight leading-snug">
                            {item.subject}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium select-none">
                            {item.topicsCount} {item.topicsCount === 1 ? "topic" : "topics"} attempted • {item.quizzesCount} {item.quizzesCount === 1 ? "quiz" : "quizzes"}{item.studyTimeSecs > 0 ? ` • ${formatDurationStr(item.studyTimeSecs)} studied` : ""}
                          </span>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold font-mono tracking-wide rounded-full border uppercase shrink-0 ${getDifficultyBadgeClasses(item.difficulty)}`}>
                          {item.difficulty}
                        </span>
                      </div>

                      {/* Score Metrics section within card */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px] font-medium text-slate-550">
                          <span className="flex items-center gap-1 font-sans">
                            <span className="font-bold text-[9px] text-slate-400 uppercase tracking-widest">SUB AVERAGE:</span>
                            <strong className="text-slate-800 font-mono">{item.averageScore !== null ? `${item.averageScore}%` : "No scores"}</strong>
                          </span>
                          {item.bestScore !== null && (
                            <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100 font-sans font-bold text-[9px] uppercase tracking-wide select-none">
                              <span>Best Score:</span>
                              <span className="font-mono">{Math.round(item.bestScore)}%</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.averageScore === null 
                                ? "w-0" 
                                : item.averageScore >= 80 
                                ? "bg-emerald-500" 
                                : item.averageScore >= 60 
                                ? "bg-indigo-500" 
                                : "bg-rose-500"
                            }`}
                            style={{ width: item.averageScore !== null ? `${item.averageScore}%` : "0%" }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl text-center space-y-1">
                <p className="text-xs font-semibold text-slate-500">No subjects completed yet</p>
                <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">
                  Take subject-specific checkpoint quizzes to begin logging subject difficulty level adjustments automatically.
                </p>
              </div>
            )}
          </div>

          {/* Topics to Review (Revision Recommendation Guide) */}
          <div className="space-y-3 text-left" id="dashboard-topics-review-section">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 flex items-center gap-1.5 font-sans">
                <AlertTriangle size={13} className="text-indigo-550 grow-0 shrink-0" />
                <span>Targeted Revision Guidance</span>
              </h3>
              <p className="text-[10px] text-slate-400 pl-1 font-medium">Revisit priority areas targeting topic modules scoring below 60%</p>
            </div>

            {quizHistory.length === 0 ? (
              <div className="p-4 border border-dashed border-slate-200 bg-slate-50/40 rounded-xl text-center">
                <p className="text-[11px] text-slate-400 font-medium">
                  Complete diagnostics to generate smart recommendations automatically.
                </p>
              </div>
            ) : topicsToReview.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="topics-to-revisit-grid">
                {topicsToReview.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (onReviewTopic) {
                        onReviewTopic(item.subject, item.topic);
                      }
                    }}
                    className="flex items-center justify-between p-3.5 bg-rose-50/45 border border-rose-150/60 hover:border-rose-300 hover:bg-rose-50 rounded-xl transition-all text-left cursor-pointer group shadow-3xs"
                    id={`btn-revisit-topic-${index}`}
                    title="Jump directly to review this topic"
                  >
                    <div className="min-w-0 pr-3 space-y-0.5">
                      <span className="text-[8px] font-mono font-extrabold text-rose-500 uppercase bg-rose-50 border border-rose-100/60 px-1.5 py-0.5 rounded tracking-wider">
                        {item.subject}
                      </span>
                      <h4 className="font-sans font-extrabold text-xs text-slate-800 tracking-tight block truncate group-hover:text-indigo-600 transition-colors pt-1">
                        {item.topic}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium font-sans">
                        You might want to revisit: {item.topic} - <span className="font-mono font-extrabold text-rose-600">{Math.round(item.maxPercentage)}% best score</span>
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-[9px] font-extrabold text-rose-600 bg-white border border-rose-100 px-2 py-1 rounded-lg group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-500 transition-all shadow-3xs flex-shrink-0">
                      <span>Jump to Review</span>
                      <ArrowRight size={8} className="stroke-[2.5]" />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-emerald-100 bg-emerald-50/30 rounded-xl text-left flex items-start gap-3">
                <span className="p-1 px-1.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded-md font-mono shrink-0">ALL GREEN</span>
                <div>
                  <p className="text-xs font-extrabold text-emerald-800 font-sans leading-none mb-0.5">All topics in premium standing!</p>
                  <p className="text-[10px] text-emerald-600 font-medium">None of your studied items have maximum scores below the 60% threshold. Congratulations!</p>
                </div>
              </div>
            )}
          </div>

          {/* Hub Helper Panel */}
          <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-left flex gap-4" id="dashboard-instructions">
            <div className="p-2.5 bg-amber-50 border border-amber-100/60 rounded-xl text-amber-600 shrink-0 h-10 w-10 flex items-center justify-center">
              <Trophy size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 tracking-tight">Your Custom Academic Engine</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Launch customized syllabus topics across major science branches. Each module features structured tasks, micro recall notes, interactive checkpoint quizzes, and dynamic flashcard sets.
              </p>
            </div>
          </div>
        </>
      )}

      {activeTabToUse === "history" && (
        <div className="space-y-4" id="dashboard-history-tab-content">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
              Attempt History ({quizHistory.length})
            </h3>
            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 text-indigo-650 px-2 py-0.5 rounded-full uppercase tracking-wide font-mono">
              Tap an entry to review topic
            </span>
          </div>

          {quizHistory.length > 0 && (
            <QuizTrendsChart quizHistory={quizHistory} onReviewTopic={onReviewTopic} />
          )}

          {quizHistory.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl text-center space-y-2" id="history-empty-view">
              <div className="p-2.5 bg-slate-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto text-slate-400">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600">No quiz attempts logged yet</p>
                <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">
                  Select a learning unit to study resources and complete the revision checkpoint quizzes to populate your record logs.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1" id="history-list-scrollable">
              {[...quizHistory].reverse().map((entry, idx) => {
                const percentage = entry.totalQuestions > 0 ? Math.round((entry.score / entry.totalQuestions) * 100) : 0;
                
                // Color theme for score badge
                let badgeStyle = "bg-emerald-50 border-emerald-100 text-emerald-700";
                if (percentage < 50) {
                  badgeStyle = "bg-rose-50 border-rose-100 text-rose-700";
                } else if (percentage < 80) {
                  badgeStyle = "bg-amber-50 border-amber-100 text-amber-700";
                }

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (onReviewTopic) {
                        onReviewTopic(entry.subject, entry.topic);
                      }
                    }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-150 hover:border-indigo-300 p-4 rounded-2xl shadow-3xs hover:shadow-xs transition-all cursor-pointer group text-left gap-3"
                    id={`quiz-history-row-${idx}`}
                  >
                    <div className="text-left space-y-1">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 font-mono leading-none block">
                        {entry.subject}
                      </span>
                      <h4 className="font-sans font-extrabold text-xs text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors w-full break-words">
                        {entry.topic}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-sans block font-medium font-mono">
                        Taken: {formatFullTimestamp(entry.timestamp)}{(() => {
                          const compositeKey = `${entry.subject.trim().toLowerCase()}::${entry.topic.trim().toLowerCase()}`;
                          const topicSeconds = timeSpentPerTopic[compositeKey] || 0;
                          return topicSeconds > 0 ? ` • Studied: ${formatDurationStr(topicSeconds)}` : "";
                        })()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 justify-between sm:justify-end shrink-0">
                      <div className="flex flex-col items-end text-right">
                        <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-bold font-mono tracking-tight rounded-full border ${badgeStyle}`}>
                          {entry.score}/{entry.totalQuestions} ({percentage}%)
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                          {entry.difficultyLevel || "standard"}
                        </span>
                      </div>
                      <span className="opacity-0 group-hover:opacity-100 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg text-[9px] font-extrabold transition-all shadow-3xs flex items-center gap-0.5 ml-1">
                        <span>Review</span>
                        <ArrowRight size={8} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTabToUse === "materials" && (
        <div className="space-y-4" id="dashboard-materials-tab-content">
          <div className="flex items-center justify-between border-b border-slate-150 pb-1.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
              Uploaded Reference Materials ({savedDocs.length})
            </h3>
            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 text-indigo-650 px-2.5 py-0.5 rounded-full font-mono uppercase">
              Quick Resume study deck
            </span>
          </div>

          {savedDocs.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl text-center space-y-2" id="dashboard-uploads-empty">
              <div className="p-3 bg-slate-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto text-slate-400">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600">No reference study decks saved yet</p>
                <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">
                  You can upload copyable Academic PDFs or TXT files under the <strong className="text-indigo-600">Start Learning &rarr; Upload Material</strong> tab to resume them here.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="dashboard-saved-docs-list">
              {savedDocs.map((doc: any) => (
                <div
                  key={doc.id}
                  onClick={() => onResumeDocument?.({ name: doc.name, content: doc.content, focus: doc.focus })}
                  className="flex items-center justify-between bg-white border border-slate-200 hover:border-indigo-300 p-4 rounded-xl shadow-3xs hover:shadow-2xs transition-all cursor-pointer group"
                  id={`dashboard-doc-item-${doc.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="p-2 bg-indigo-50 border border-indigo-100/55 rounded-lg text-indigo-500 shrink-0 group-hover:scale-105 transition-all shadow-3xs">
                      <FileText size={15} />
                    </div>
                    <div className="min-w-0 text-left">
                      <h5 className="font-sans font-extrabold text-xs text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                        {doc.name}
                      </h5>
                      <p className="text-[10px] text-slate-400 font-sans font-medium truncate">
                        {doc.focus ? `Focus: ${doc.focus}` : "Full auto-generated deck"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded text-[9px] font-bold transition-all shadow-3xs flex items-center gap-0.5">
                      <span>Study</span>
                      <ArrowRight size={8} />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteDocument(doc.id, e)}
                      className="p-1 text-slate-400 hover:text-red-650 hover:bg-red-50 hover:border-red-150 border border-transparent rounded-lg transition-all"
                      title="Delete reference document"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTabToUse === "settings" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-6" id="dashboard-settings-tab">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 font-sans">
              App & Learning Settings
            </h3>
            <p className="text-xs text-slate-400">Configure your learning profile, education standard, and app state</p>
          </div>

          <div className="space-y-4">
            {/* Edu Level Section */}
            <div className="space-y-2 font-sans text-left">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Education Level
              </label>
              <p className="text-xs text-slate-400 leading-snug font-medium">
                Your education standard is used by the AI model to adjust quiz questions, reading materials difficulty, and flashcards depth.
              </p>
              
              <div className="flex flex-col gap-2 pt-2.5 p-3 bg-slate-50 border border-slate-150 rounded-xl max-w-md" id="profile-level-settings-form">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Update your current standard
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempLevel}
                    onChange={(e) => setTempLevel(e.target.value)}
                    placeholder="e.g. A-Levels, Grade 10, Undergrad"
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-sans font-medium w-full max-w-[180px]"
                    id="input-edit-curriculum-level"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = tempLevel.trim();
                      if (trimmed) {
                        setCurriculumLevel(trimmed);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs rounded-lg transition-all cursor-pointer shadow-3xs"
                    id="btn-save-curriculum-level"
                  >
                    Save
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {["Grade 9", "A-Levels", "Undergrad", "Self-study"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTempLevel(s)}
                      className="px-2 py-0.5 rounded-md text-[9px] font-bold border bg-white border-slate-250 text-slate-550 hover:bg-slate-50 hover:border-slate-350 cursor-pointer"
                      id={`edit-suggestion-${s.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                User Profile
              </label>
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 max-w-md font-medium">
                <p><strong>Name:</strong> {userName || "Learner"}</p>
                <p><strong>Email:</strong> {localStorage.getItem("userEmail") || "shujhaabbas99@gmail.com"}</p>
              </div>
            </div>

            {/* Theme Preferences */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-705 dark:text-slate-300 uppercase tracking-wider">
                Visual Theme
              </label>
              <p className="text-xs text-slate-400 dark:text-slate-400 leading-snug font-medium">
                Switch between Light theme for standard daytime reading or Dark theme to protect your eyes during late study nights.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => toggleTheme?.()}
                  className={`px-3 py-2 text-xs font-bold font-sans rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs ${
                    theme === "dark"
                      ? "bg-slate-850 dark:bg-slate-800 border-slate-700 text-white hover:bg-slate-750"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                  id="btn-settings-toggle-theme"
                >
                  {theme === "light" ? <Moon size={14} className="text-slate-600" /> : <Sun size={14} className="text-amber-400 fill-amber-400" />}
                  <span>Toggle {theme === "light" ? "Dark Theme" : "Light Theme"}</span>
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            {onResetProgress && (
              <div className="pt-6 border-t border-red-100 space-y-2">
                <label className="block text-xs font-bold text-red-650 uppercase tracking-wider">
                  Danger Zone
                </label>
                <div className="p-4 bg-red-50/20 border border-red-150 rounded-xl max-w-md space-y-3">
                  <p className="text-xs text-red-800 leading-relaxed font-semibold">
                    Resetting progress will permanently erase your study logs, quiz completion certificates, saved documents, and resets customized learning speeds. This action cannot be undone.
                  </p>
                  <button
                    onClick={onResetProgress}
                    className="px-4 py-2 bg-rose-650 hover:bg-rose-700 text-white text-xs font-bold font-sans rounded-lg transition-all cursor-pointer shadow-3xs flex items-center justify-center"
                    id="btn-reset-progress-settings"
                  >
                    Reset Progress
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
