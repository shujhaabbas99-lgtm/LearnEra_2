import React, { useState, useMemo } from "react";
import { 
  BookOpen, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles,
  ChevronRight,
  Clock,
  Check,
  Plus,
  Search,
  Upload,
  FileText,
  Trash2,
  Loader2,
  Bookmark,
  HelpCircle,
  Compass,
  Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AppState, QuizHistoryEntry, SubjectItem, TopicInfo, SavedFlashcard } from "../types";

interface SubjectSelectionStateViewProps {
  onNext: () => void;
  setSelectedSubject: (subject: string | null) => void;
  setSelectedTopic: (topic: string | null) => void;
  selectedSubject: string | null;
  selectedTopic: string | null;
  quizHistory?: QuizHistoryEntry[];
  customSubjects?: SubjectItem[];
  setCustomSubjects?: React.Dispatch<React.SetStateAction<SubjectItem[]>>;
  setCurrentState?: (state: AppState) => void;
  topicStatuses?: Record<string, "read" | "quiz_completed" | "completed">;
  savedFlashcards?: SavedFlashcard[];
  onSelectReviewCard?: (cardId: string) => void;
  sessionLearningGoal: "exam_prep" | "deep_understanding";
  setSessionLearningGoal: (val: "exam_prep" | "deep_understanding") => void;
  sessionLearningMode: "read" | "listen";
  setSessionLearningMode: (val: "read" | "listen") => void;
  sessionDetailLevel: "concise" | "standard" | "comprehensive";
  setSessionDetailLevel: (val: "concise" | "standard" | "comprehensive") => void;
}

const getSubjectAccentColorClass = (colorClass: string): string => {
  const lowercase = (colorClass || "").toLowerCase();
  if (lowercase.includes("rose")) return "text-rose-550 dark:text-rose-450";
  if (lowercase.includes("teal")) return "text-teal-550 dark:text-teal-450";
  if (lowercase.includes("emerald") || lowercase.includes("green")) return "text-emerald-550 dark:text-emerald-450";
  if (lowercase.includes("amber") || lowercase.includes("yellow")) return "text-amber-550 dark:text-amber-450";
  if (lowercase.includes("sky") || lowercase.includes("blue")) return "text-sky-550 dark:text-sky-450";
  if (lowercase.includes("orange")) return "text-orange-550 dark:text-orange-450";
  if (lowercase.includes("fuchsia") || lowercase.includes("pink")) return "text-fuchsia-550 dark:text-fuchsia-450";
  if (lowercase.includes("cyan")) return "text-cyan-550 dark:text-cyan-450";
  if (lowercase.includes("slate") || lowercase.includes("gray")) return "text-slate-550 dark:text-slate-450";
  return "text-indigo-550 dark:text-indigo-455";
};

const renderThemedBackground = (subName: string, colorClass: string) => {
  const normalized = subName.toLowerCase().trim();
  
  // Decide pattern type
  let type = "default";
  if (normalized.includes("neuro") || normalized.includes("med") || normalized.includes("brain") || normalized.includes("health") || normalized.includes("anatomy") || normalized.includes("surgeon")) {
    type = "neurology";
  } else if (normalized.includes("bio") || normalized.includes("plant") || normalized.includes("gene") || normalized.includes("cell") || normalized.includes("eco") || normalized.includes("zoology") || normalized.includes("dna") || normalized.includes("life")) {
    type = "biology";
  } else if (normalized.includes("math") || normalized.includes("calc") || normalized.includes("alg") || normalized.includes("geom") || normalized.includes("stat") || normalized.includes("arithmetic") || normalized.includes("quant") || normalized.includes("algebra") || normalized.includes("trig")) {
    type = "mathematics";
  } else if (normalized.includes("phys") || normalized.includes("quantum") || normalized.includes("mechanic") || normalized.includes("thermo") || normalized.includes("relativity") || normalized.includes("gravity") || normalized.includes("astro") || normalized.includes("wave")) {
    type = "physics";
  } else if (normalized.includes("chem") || normalized.includes("molecule") || normalized.includes("atom") || normalized.includes("organic") || normalized.includes("bond") || normalized.includes("element") || normalized.includes("compound")) {
    type = "chemistry";
  } else if (normalized.includes("comp") || normalized.includes("code") || normalized.includes("soft") || normalized.includes("programm") || normalized.includes("algorithm") || normalized.includes("binary") || normalized.includes("tech") || normalized.includes("it") || normalized.includes("cyber") || normalized.includes("web") || normalized.includes("network")) {
    type = "computerscience";
  } else if (normalized.includes("psych") || normalized.includes("mind") || normalized.includes("behavior") || normalized.includes("cognit") || normalized.includes("therapy") || normalized.includes("emotion") || normalized.includes("thought") || normalized.includes("mental")) {
    type = "psychology";
  } else if (normalized.includes("hist") || normalized.includes("ancient") || normalized.includes("war") || normalized.includes("past") || normalized.includes("era") || normalized.includes("civiliz") || normalized.includes("timeline") || normalized.includes("dynasty")) {
    type = "history";
  }

  // Common styles for background SVGs (ensure low opacity 15-25% to never crowd the card content)
  const baseClasses = "absolute right-0 bottom-0 w-36 h-36 pointer-events-none select-none z-0 opacity-15 dark:opacity-25 transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 group-hover:translate-x-1";

  switch (type) {
    case "neurology":
      return (
        <svg className={`${baseClasses} text-indigo-400 dark:text-indigo-500`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.85" id={`pattern-neurology-${subName}`}>
          <line x1="20" y1="50" x2="45" y2="30" />
          <line x1="20" y1="50" x2="40" y2="75" />
          <line x1="45" y1="30" x2="70" y2="25" />
          <line x1="45" y1="30" x2="60" y2="55" />
          <line x1="40" y1="75" x2="60" y2="55" />
          <line x1="40" y1="75" x2="75" y2="80" />
          <line x1="60" y1="55" x2="85" y2="45" />
          <line x1="70" y1="25" x2="85" y2="45" />
          <line x1="75" y1="80" x2="85" y2="45" />
          
          <circle cx="20" cy="50" r="3" fill="currentColor" />
          <circle cx="45" cy="30" r="3" fill="currentColor" />
          <circle cx="40" cy="75" r="3.5" fill="currentColor" />
          <circle cx="60" cy="55" r="3" fill="currentColor" />
          <circle cx="70" cy="25" r="4" fill="currentColor" />
          <circle cx="75" cy="80" r="3" fill="currentColor" />
          <circle cx="85" cy="45" r="4.5" fill="currentColor" />
          
          <circle cx="70" cy="25" r="7" strokeDasharray="2 2" />
          <circle cx="40" cy="75" r="7" strokeDasharray="1 1" />
        </svg>
      );
    case "biology":
      return (
        <svg className={`${baseClasses} text-emerald-450 dark:text-emerald-500`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" id={`pattern-biology-${subName}`}>
          <path d="M 12,65 Q 28,15 44,65 T 76,65 T 100,65" />
          <path d="M 12,35 Q 28,85 44,35 T 76,35 T 100,35" strokeDasharray="1.5 1.5" />
          
          <line x1="18" y1="46" x2="18" y2="54" />
          <line x1="25" y1="49" x2="25" y2="51" />
          <line x1="32" y1="54" x2="32" y2="46" />
          <line x1="40" y1="50" x2="40" y2="50" />
          <line x1="48" y1="44" x2="48" y2="56" />
          <line x1="55" y1="37" x2="55" y2="63" />
          <line x1="62" y1="46" x2="62" y2="54" strokeDasharray="1 1" />
          <line x1="70" y1="50" x2="70" y2="50" />
          <line x1="78" y1="54" x2="78" y2="46" />
          <line x1="85" y1="44" x2="85" y2="56" />
          
          <circle cx="20" cy="20" r="1.5" fill="currentColor" />
          <circle cx="85" cy="78" r="2" fill="currentColor" />
          <circle cx="80" cy="16" r="1.5" fill="currentColor" strokeDasharray="1 1" />
        </svg>
      );
    case "mathematics":
      return (
        <svg className={`${baseClasses} text-amber-500 dark:text-amber-500`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" id={`pattern-mathematics-${subName}`}>
          <line x1="10" y1="0" x2="10" y2="100" strokeDasharray="1 4" />
          <line x1="30" y1="0" x2="30" y2="100" strokeDasharray="1 4" />
          <line x1="50" y1="0" x2="50" y2="100" strokeDasharray="1 4" />
          <line x1="70" y1="0" x2="70" y2="100" strokeDasharray="1 4" />
          <line x1="90" y1="0" x2="90" y2="100" strokeDasharray="1 4" />
          
          <line x1="0" y1="10" x2="100" y2="10" strokeDasharray="1 4" />
          <line x1="0" y1="30" x2="100" y2="30" strokeDasharray="1 4" />
          <line x1="0" y1="50" x2="100" y2="50" strokeDasharray="1 4" />
          <line x1="0" y1="70" x2="100" y2="70" strokeDasharray="1 4" />
          <line x1="0" y1="90" x2="100" y2="90" strokeDasharray="1 4" />

          <polygon points="50,22 82,72 18,72" strokeWidth="1" />
          <circle cx="50" cy="55" r="17" strokeDasharray="2 2" />
          <rect x="41" y="46" width="18" height="18" strokeWidth="0.85" transform="rotate(45 50 55)" />
        </svg>
      );
    case "physics":
      return (
        <svg className={`${baseClasses} text-sky-450 dark:text-sky-500`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" id={`pattern-physics-${subName}`}>
          <path d="M 0,35 C 25,5 25,65 50,35 C 75,5 75,65 100,35" />
          <path d="M 0,55 C 25,85 25,25 50,55 C 75,85 75,25 100,55" strokeDasharray="3 3" />
          <path d="M 0,75 C 25,45 25,105 50,75 C 75,45 75,105 100,75" strokeWidth="0.5" />
          
          <ellipse cx="50" cy="50" rx="36" ry="13" transform="rotate(28 50 50)" />
          <ellipse cx="50" cy="50" rx="36" ry="13" transform="rotate(-28 50 50)" strokeDasharray="2 1" />
          <circle cx="50" cy="50" r="5" fill="currentColor" />
          <circle cx="16" cy="40" r="1.5" fill="currentColor" />
          <circle cx="84" cy="60" r="1.5" fill="currentColor" />
        </svg>
      );
    case "chemistry":
      return (
        <svg className={`${baseClasses} text-teal-450 dark:text-teal-500`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.9" id={`pattern-chemistry-${subName}`}>
          <polygon points="25,30 45,18 65,30 65,54 45,66 25,54" />
          <circle cx="45" cy="42" r="10" strokeDasharray="1.5 1.5" />
          
          <polygon points="65,54 85,42 105,54 105,78 85,90 65,78" />
          <line x1="65" y1="54" x2="85" y2="42" strokeWidth="2.2" />
          
          <line x1="25" y1="30" x2="10" y2="20" />
          <circle cx="10" cy="20" r="3" fill="currentColor" />
          
          <line x1="45" y1="18" x2="45" y2="2" strokeDasharray="1 1" strokeWidth="1.5" />
          <circle cx="45" cy="2" r="2" fill="currentColor" />
          
          <line x1="65" y1="30" x2="80" y2="20" />
        </svg>
      );
    case "computerscience":
      return (
        <svg className={`${baseClasses} text-cyan-450 dark:text-cyan-500`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.95" id={`pattern-computerscience-${subName}`}>
          <path d="M10,20 L40,20 L55,35 L90,35" />
          <path d="M10,50 L30,50 L45,65 L70,65 L80,75 L90,75" />
          <path d="M30,85 L50,85 L60,75 L60,60" strokeDasharray="2.5 1" />
          
          <circle cx="40" cy="20" r="1.8" fill="currentColor" />
          <circle cx="90" cy="35" r="3" fill="currentColor" />
          <circle cx="30" cy="50" r="1.8" fill="currentColor" />
          <circle cx="90" cy="75" r="3" fill="currentColor" />
          <circle cx="60" cy="60" r="1.8" fill="currentColor" />
          
          <text x="17" y="36" className="font-mono text-[8px] fill-current stroke-none font-bold">0</text>
          <text x="76" y="23" className="font-mono text-[8px] fill-current stroke-none font-bold">1</text>
          <text x="76" y="53" className="font-mono text-[8px] fill-current stroke-none font-bold">0</text>
          <text x="21" y="68" className="font-mono text-[8px] fill-current stroke-none font-bold">1</text>
        </svg>
      );
    case "psychology":
      return (
        <svg className={`${baseClasses} text-fuchsia-450 dark:text-fuchsia-500`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" id={`pattern-psychology-${subName}`}>
          <path d="M 0,32 C 15,12 25,52 40,32 C 55,12 65,52 80,32 C 90,22 95,42 100,32" />
          <path d="M 0,52 C 8,42 12,62 20,52 C 28,42 32,62 40,52 C 48,42 52,62 60,52 C 68,42 72,62 80,52 C 88,42 92,62 100,52" strokeWidth="0.5" />
          <path d="M 0,72 C 20,92 30,52 50,72 C 70,92 80,52 100,72" strokeDasharray="2 1.5" />
          
          <circle cx="50" cy="52" r="10" strokeDasharray="1 3" />
          <circle cx="50" cy="52" r="20" strokeDasharray="1 4" />
        </svg>
      );
    case "history":
      return (
        <svg className={`${baseClasses} text-orange-450 dark:text-orange-500`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.85" id={`pattern-history-${subName}`}>
          <line x1="15" y1="15" x2="15" y2="90" />
          
          <line x1="15" y1="28" x2="23" y2="28" />
          <line x1="15" y1="44" x2="20" y2="44" />
          <line x1="15" y1="60" x2="23" y2="60" />
          <line x1="15" y1="76" x2="20" y2="76" />
          
          <circle cx="23" cy="28" r="3" fill="currentColor" />
          <circle cx="23" cy="60" r="2" fill="currentColor" />
          
          <text x="29" y="31" className="font-serif text-[7px] italic fill-current stroke-none font-bold">1776</text>
          <text x="29" y="63" className="font-serif text-[7px] italic fill-current stroke-none font-bold">1945</text>
          
          <circle cx="75" cy="35" r="11" strokeDasharray="1.5 1.5" />
          <line x1="75" y1="22" x2="75" y2="48" strokeWidth="0.6" />
          <line x1="62" y1="35" x2="88" y2="35" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
          <polygon points="75,26 78,35 75,44 72,35" fill="currentColor" fillOpacity="0.3" stroke="none" />
        </svg>
      );
    default:
      // Custom clean abstract geometric pattern using assigned accent color
      const customColorClass = getSubjectAccentColorClass(colorClass);

      return (
        <svg className={`${baseClasses} ${customColorClass}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.85" id={`pattern-custom-${subName}`}>
          <polygon points="50,15 90,38 90,83 50,60" />
          <polygon points="50,15 10,38 10,83 50,60" strokeDasharray="2 1.5" />
          <line x1="50" y1="60" x2="50" y2="100" />
          <circle cx="50" cy="38" r="14" strokeDasharray="2.5 2.5" />
          <circle cx="50" cy="38" r="4.5" fill="currentColor" />
        </svg>
      );
  }
};

export default function SubjectSelectionStateView({
  onNext,
  setSelectedSubject,
  setSelectedTopic,
  selectedSubject,
  selectedTopic,
  quizHistory = [],
  customSubjects = [],
  setCustomSubjects,
  setCurrentState,
  topicStatuses = {},
  savedFlashcards = [],
  onSelectReviewCard,
  sessionLearningGoal,
  setSessionLearningGoal,
  sessionLearningMode,
  setSessionLearningMode,
  sessionDetailLevel,
  setSessionDetailLevel
}: SubjectSelectionStateViewProps) {
  const [localSubject, setLocalSubject] = useState<string | null>(() => {
    return selectedSubject || null;
  });

  const [subjectQuery, setSubjectQuery] = useState("");
  const [pendingTopicName, setPendingTopicName] = useState<string | null>(null);
  const [modalGoal, setModalGoal] = useState<"exam_prep" | "deep_understanding">("deep_understanding");
  const [modalMode, setModalMode] = useState<"read" | "listen">("read");
  const [modalDetailLevel, setModalDetailLevel] = useState<"concise" | "standard" | "comprehensive">("standard");

  // Loaded list of documents to maintain backwards compatibility
  const [savedDocs, setSavedDocs] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("uploadedDocuments");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });



  // Convert customSubjects into our rendered final format (adding style helpers)
  const finalSubjects = (customSubjects || []).map(cs => ({
    ...cs,
    colorClass: cs.colorClass || "from-indigo-500/10 to-violet-500/5 hover:border-indigo-500/40 text-indigo-700",
    icon: cs.icon || <BookOpen className="text-indigo-600" size={24} />
  }));

  const handleSelectSubject = (subjectName: string) => {
    setLocalSubject(subjectName);
    setSelectedSubject(subjectName);
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = subjectQuery.trim();
    if (!trimmed) return;

    const matched = finalSubjects.find(
      s => s.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (matched) {
      handleSelectSubject(matched.name);
      setSubjectQuery("");
    } else {
      // New subject! Set selectedSubject and transition to TOPIC_SOURCE_SELECTION_STATE
      setSelectedSubject(trimmed);
      setSubjectQuery("");
      if (setCurrentState) {
        setCurrentState(AppState.TOPIC_SOURCE_SELECTION_STATE);
      }
    }
  };

  const handleBack = () => {
    setLocalSubject(null);
    setSelectedSubject(null);
  };

  const handleSelectTopic = (topicName: string) => {
    setPendingTopicName(topicName);
    setModalGoal("deep_understanding");
    setModalMode("read");
    setModalDetailLevel("standard");
  };

  const activeSubjectData = localSubject && localSubject.startsWith("[Document] ")
    ? (() => {
        const docName = localSubject.replace("[Document] ", "");
        const doc = savedDocs.find(d => d.name === docName);
        if (!doc) return undefined;
        let docTopics = doc.topics || [];
        if (docTopics.length === 0) {
          docTopics = [{
            name: doc.focus || "Core Document Content",
            description: "Study key notes, review active recall cards, or test your comprehension via checkpoints.",
            duration: "15m",
            sourceText: doc.content
          }];
        }
        return {
          id: doc.id,
          name: localSubject,
          description: doc.focus || "Document Content",
          colorClass: "from-indigo-500/10 to-violet-500/5 hover:border-indigo-505/40 text-indigo-700",
          topics: docTopics
        };
      })()
    : finalSubjects.find(s => s.name === localSubject);

  return (
    <div className="p-6 sm:p-10 space-y-8" id="subject-selection-state-view">
      
      <AnimatePresence mode="wait">
        {!localSubject ? (
          /* SUBJECT ENTRY POINT */
          <motion.div
            key="subject-entry-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Component Header with Open Question */}
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/60 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-100/55 dark:shadow-indigo-950/20 mb-2">
                <BookOpen size={22} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <h2 className="font-sans font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight" id="open-question-title">
                  What do you want to learn?
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed max-w-sm sm:max-w-md mx-auto">
                  Type any custom subject name or choose from your already created syllabus list below to begin.
                </p>
              </div>
            </div>

            {/* Free Text Subject Input Form */}
            <form onSubmit={handleQuerySubmit} className="max-w-md mx-auto relative" id="subject-query-form">
              <div className="relative flex items-center">
                <Search size={16} className="absolute left-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  required
                  value={subjectQuery}
                  onChange={(e) => setSubjectQuery(e.target.value)}
                  placeholder="e.g. Cognitive Psychology, Quantum Computing, Web3..."
                  className="w-full pl-11 pr-24 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-505 rounded-2xl text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-sans font-medium transition-all shadow-3xs"
                  id="input-subject-query"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1"
                  id="btn-submit-subject-query"
                >
                  <span>Build</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            </form>



            {/* ALREADY CREATED SUBJECTS LIST */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-850">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Your Subjects ({finalSubjects.length})
                </span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                  Saved Curricula
                </span>
              </div>

              {finalSubjects.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/40 dark:bg-slate-950/20 border border-slate-205 dark:border-slate-805 border-dashed rounded-2xl" id="custom-subjects-empty">
                  <Sparkles size={20} className="text-slate-350 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans">No subjects created yet.</p>
                  <p className="text-[10px] text-slate-405 dark:text-slate-500 font-medium max-w-xs mx-auto mt-0.5 leading-relaxed">
                    Type a subject above to configure study coordinates and generate target learning tracks!
                  </p>
                </div>
              ) : (
                <div 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4" 
                  id="custom-subjects-grid"
                >
                  {finalSubjects.map((sub) => {
                    const total = sub.topics.length;
                    const completedCount = sub.topics.filter(top => {
                      const key = `${sub.name.trim().toLowerCase()}::${top.name.trim().toLowerCase()}`;
                      const status = topicStatuses[key];
                      if (status) {
                        return status === "completed";
                      }
                      return quizHistory.some(q => q.topic.trim().toLowerCase() === top.name.trim().toLowerCase());
                    }).length;
                    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

                     return (
                       <div
                         key={sub.name}
                         onClick={() => handleSelectSubject(sub.name)}
                         className="relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-2xl p-5 text-left cursor-pointer transition-all hover:shadow-xs group flex flex-col justify-between"
                         id={`subject-card-${sub.id}`}
                       >
                         {/* Thematic Structural Background SVG */}
                         {renderThemedBackground(sub.name, sub.colorClass)}

                         <div className="space-y-3 relative z-10">
                           <div className="flex items-center justify-between">
                             <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl group-hover:border-indigo-200 transition-all shadow-3xs text-indigo-600 dark:text-indigo-400 font-sans">
                               {sub.icon}
                             </div>
                             <ChevronRight size={14} className="text-slate-350 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                           </div>
                           <div className="space-y-1">
                             <h4 className="font-sans font-extrabold text-sm text-slate-880 dark:text-slate-100 tracking-tight group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                               {sub.name}
                             </h4>
                             <p className="text-[11px] text-slate-405 dark:text-slate-505 leading-relaxed font-medium truncate">
                               {sub.description}
                             </p>
                           </div>
                         </div>

                         <div className="mt-4 space-y-1.5 relative z-10" id={`subject-progress-container-${sub.id}`}>
                           <div className="flex justify-between items-center text-[10px] font-bold font-mono text-slate-500 dark:text-slate-400">
                             <span>{completedCount}/{total} study topics completed</span>
                             <span>{percent}%</span>
                           </div>
                           <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                             <div 
                               className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                               style={{ width: `${percent}%` }}
                             />
                           </div>
                         </div>

                         <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold font-mono mt-3.5 flex items-center gap-1 relative z-10">
                           {total} Course Units &rarr;
                         </span>
                       </div>
                     );
                  })}
                </div>
              )}
            </div>

          </motion.div>
        ) : (
          /* TOPIC LIST VIEW */
          <motion.div
            key="topic-list-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 text-left"
          >
            {/* Navigation back and active subject status */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-605 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                id="btn-back-to-subjects"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
              <div className="text-right">
                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-widest uppercase block mb-0.5">
                  SELECTED DISCIPLINE
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 px-2.5 py-1 rounded-lg">
                  {localSubject}
                </span>
              </div>
            </div>

            {/* Header info */}
            <div className="space-y-1">
              <h3 className="font-sans font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                Select Study Unit
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-405 font-medium leading-relaxed">
                Choose one of the sub-curriculum study tracks below to begin learning and active recall assessments.
              </p>
            </div>

            {/* Topics list */}
            <div className="space-y-3" id="topics-list-container">
              {activeSubjectData?.topics && activeSubjectData.topics.length > 0 ? (
                activeSubjectData.topics.map((top, index) => {
                  const topicAttempts = quizHistory.filter(
                    q => q.topic.trim().toLowerCase() === top.name.trim().toLowerCase()
                  );
                  const isCompleted = topicAttempts.length > 0;
                  const bestScore = isCompleted
                    ? Math.max(...topicAttempts.map(q => q.totalQuestions > 0 ? Math.round((q.score / q.totalQuestions) * 100) : 0))
                    : 0;

                  const key = `${(localSubject || "").trim().toLowerCase()}::${top.name.trim().toLowerCase()}`;
                  const targetStatus = topicStatuses[key];
                  
                  let displayStatus: "unstudied" | "read" | "quiz_completed" | "completed" = "unstudied";
                  if (targetStatus) {
                    displayStatus = targetStatus;
                  } else if (isCompleted) {
                    displayStatus = "completed";
                  }

                  const isStudied = displayStatus !== "unstudied";

                  return (
                    <div
                      key={top.name}
                      onClick={() => handleSelectTopic(top.name)}
                      className={`border rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all group shadow-3xs ${
                        isStudied 
                          ? "bg-white dark:bg-slate-900 border-indigo-200/80 dark:border-indigo-905 hover:border-indigo-600 dark:hover:border-indigo-500 shadow-sm" 
                          : "bg-slate-50/45 dark:bg-slate-950/25 text-slate-705/90 dark:text-slate-300 border-slate-150 dark:border-slate-850 opacity-80 hover:opacity-100 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-355 dark:hover:border-slate-800"
                      }`}
                      id={`topic-unit-row-${index}`}
                    >
                      {/* Top content row */}
                      <div className="flex items-start justify-between gap-4 w-full">
                        <div className="space-y-1 text-left flex-1">
                          <h4 className="font-sans font-bold text-xs text-slate-800 dark:text-slate-150 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all flex items-center gap-1.5 flex-wrap">
                            <Sparkles size={11} className={`${isStudied ? "text-indigo-500" : "text-slate-400 dark:text-slate-500"} shrink-0`} />
                            <span>{top.name}</span>
                            {displayStatus === "read" && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-amber-50 dark:bg-amber-955/30 border border-amber-200 dark:border-amber-900/60 text-amber-707 dark:text-amber-400 font-sans shadow-3xs leading-none">
                                Read
                              </span>
                            )}
                            {displayStatus === "quiz_completed" && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-blue-50 dark:bg-blue-955/30 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-405 font-sans shadow-3xs leading-none">
                                Quiz completed - flashcards pending • {bestScore}%
                              </span>
                            )}
                            {displayStatus === "completed" && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-emerald-50 dark:bg-emerald-955/30 border border-emerald-200 dark:border-emerald-900/60 text-emerald-707 dark:text-emerald-400 font-sans shadow-3xs leading-none">
                                <Check size={10} className="stroke-[3]" />
                                Completed - {bestScore}%
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans font-medium">
                            {top.description}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end shrink-0 justify-between min-h-[36px]">
                          <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 text-slate-550 dark:text-slate-350 px-2 py-0.5 rounded-md flex items-center gap-1 leading-none">
                            <Clock size={9} />
                            {top.duration}
                          </span>
                          {!isStudied && (
                            <ChevronRight size={13} className="text-slate-350 dark:text-slate-500 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-all mt-2" />
                          )}
                        </div>
                      </div>

                      {/* Interactive short-cuts for previously studied elements */}
                      {isStudied && (
                        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 w-full">
                          <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 select-none uppercase tracking-wider">
                            Direct Entry
                          </span>
                          
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            {/* Normal full path shortcut */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTopic(top.name);
                              }}
                              className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-750 hover:border-slate-305 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-605 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                              id={`btn-open-topic-normal-${index}`}
                            >
                              <BookOpen size={10} />
                              <span>Open Topic</span>
                            </button>

                            {/* Take Quiz direct shortcut */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubject(localSubject);
                                setSelectedTopic(top.name);
                                if (setCurrentState) {
                                  setCurrentState(AppState.QUIZ_STATE);
                                }
                              }}
                              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/35 text-amber-707 dark:text-amber-400 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                              id={`btn-direct-quiz-${index}`}
                            >
                              <HelpCircle size={10} />
                              <span>Take Quiz</span>
                            </button>

                            {/* Review Flashcards direct shortcut */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubject(localSubject);
                                setSelectedTopic(top.name);
                                if (setCurrentState) {
                                  setCurrentState(AppState.FLASHCARD_STATE);
                                }
                              }}
                              className="px-2.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 hover:border-teal-500/35 text-teal-707 dark:text-teal-400 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                              id={`btn-direct-flashcards-${index}`}
                            >
                              <Bookmark size={10} className="fill-teal-500/10" />
                              <span>Review Cards</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
                  <p className="text-xs font-semibold text-slate-500">No topics configured for this subject yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>      {/* Session Configuration Modal */}
      {pendingTopicName && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto" id="session-goal-modal">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 max-w-md w-full shadow-2xl p-6 pb-28 md:p-8 md:pb-8 space-y-6 text-left max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 text-indigo-705 dark:text-indigo-300 leading-none">
                Study session setup: {pendingTopicName}
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-snug" id="modal-goal-question">
                What's your goal for this topic?
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium font-sans">
                Select your preferred academic goal and learning medium for this topic. You can change these choices next time.
              </p>
            </div>

            {/* Selector 1: What is your learning goal? */}
            <div className="space-y-3">
              <label className="text-[10px] font-extrabold text-slate-405 dark:text-slate-500 uppercase tracking-widest block font-mono">SESSION STUDY GOAL</label>
              <div className="grid grid-cols-1 gap-2.5">
                {/* Option A: Deep Understanding */}
                <button
                  type="button"
                  onClick={() => setModalGoal("deep_understanding")}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                    modalGoal === "deep_understanding" 
                      ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500 dark:border-indigo-500 shadow-sm" 
                      : "bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                  id="btn-goal-deep"
                >
                  <span className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 ${modalGoal === "deep_understanding" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                     <Compass size={14} />
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">Deep Understanding</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-sans font-medium">
                      Standard syllabus: detailed concepts, theoretical analysis, real-world case simulations, and misconceptions.
                    </p>
                  </div>
                </button>

                {/* Option B: Exam Prep */}
                <button
                  type="button"
                  onClick={() => setModalGoal("exam_prep")}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                    modalGoal === "exam_prep" 
                      ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500 dark:border-indigo-500 shadow-sm" 
                      : "bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                  id="btn-goal-exam"
                >
                  <span className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 ${modalGoal === "exam_prep" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                    <Sparkles size={14} />
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-1.5">
                      <span>Exam Prep Mode</span>
                      <span className="text-[8px] bg-indigo-200 dark:bg-indigo-950 text-indigo-805 dark:text-indigo-300 font-extrabold uppercase px-1 py-0.5 rounded leading-none">Concise + Practice</span>
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-sans font-medium">
                      Cram syllabus: structured fact density, core terminology, and 12 detailed questions immediately in Question Bank.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Selector 2: How do you want to learn? (Read vs Listen) */}
            <div className="space-y-3">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">LEARNING MEDIUM MODE</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalMode("read")}
                  className={`p-3.5 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    modalMode === "read" 
                      ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500 dark:border-indigo-500 shadow-sm text-indigo-707 dark:text-indigo-400" 
                      : "bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                  id="btn-mode-read"
                >
                  <BookOpen size={16} />
                  <span className="text-xs font-bold font-sans">Read Textbook</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalMode("listen")}
                  className={`p-3.5 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    modalMode === "listen" 
                      ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500 dark:border-indigo-500 shadow-sm text-indigo-707 dark:text-indigo-400" 
                      : "bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                  id="btn-mode-listen"
                >
                  <Volume2 size={16} />
                  <span className="text-xs font-bold font-sans">Listen Out Loud</span>
                </button>
              </div>
            </div>

            {/* Selector 3: How much detail do you want? */}
            <div className="space-y-3">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">EXPLANATION DETAIL LEVEL</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setModalDetailLevel("concise")}
                  className={`py-2 px-1 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    modalDetailLevel === "concise" 
                      ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500 dark:border-indigo-500 shadow-sm text-indigo-707 dark:text-indigo-400" 
                      : "bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                  id="btn-detail-concise"
                >
                  <span className="text-[10px] sm:text-xs font-bold font-sans">Concise</span>
                  <span className="text-[8px] font-medium opacity-75 font-mono">300-500 w</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalDetailLevel("standard")}
                  className={`py-2 px-1 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    modalDetailLevel === "standard" 
                      ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500 dark:border-indigo-500 shadow-sm text-indigo-707 dark:text-indigo-400" 
                      : "bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                  id="btn-detail-standard"
                >
                  <span className="text-[10px] sm:text-xs font-bold font-sans">Standard</span>
                  <span className="text-[8px] font-medium opacity-75 font-mono">500-1000 w</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalDetailLevel("comprehensive")}
                  className={`py-2 px-1 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    modalDetailLevel === "comprehensive" 
                      ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500 dark:border-indigo-500 shadow-sm text-indigo-707 dark:text-indigo-400" 
                      : "bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                  id="btn-detail-comprehensive"
                >
                  <span className="text-[10px] sm:text-xs font-bold font-sans leading-tight whitespace-normal break-words text-center">Comprehensive</span>
                  <span className="text-[8px] font-medium opacity-75 font-mono">1000+ w</span>
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPendingTopicName(null)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-150 dark:border-slate-700 text-slate-605 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                id="btn-modal-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSessionLearningGoal(modalGoal);
                  setSessionLearningMode(modalMode);
                  setSessionDetailLevel(modalDetailLevel);
                  setSelectedTopic(pendingTopicName);
                  onNext();
                  setPendingTopicName(null);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-100 dark:shadow-none"
                id="btn-modal-confirm"
              >
                Begin Study Session
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
