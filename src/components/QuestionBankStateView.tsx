import React, { useState } from "react";
import { BookOpen, ArrowLeft, HelpCircle, ChevronRight, ChevronDown, CheckCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QuestionBankItem } from "../types";

interface QuestionBankStateViewProps {
  questionBank: QuestionBankItem[];
  onExit: () => void;
}

export default function QuestionBankStateView({
  questionBank,
  onExit
}: QuestionBankStateViewProps) {
  const [selectedTopicKey, setSelectedTopicKey] = useState<string | null>(null); // "subjectName::topicName"
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Group questions by subject -> topic
  const groupedData = React.useMemo(() => {
    const map: Record<string, Record<string, QuestionBankItem[]>> = {};
    
    questionBank.forEach((item) => {
      const sub = item.subject || "General";
      const top = item.topic || "Core Material";
      if (!map[sub]) {
        map[sub] = {};
      }
      if (!map[sub][top]) {
        map[sub][top] = [];
      }
      map[sub][top].push(item);
    });

    return map;
  }, [questionBank]);

  const subjectsWithQuestions = Object.keys(groupedData);

  // Handle active topic selection
  const activeTopicQuestions = React.useMemo(() => {
    if (!selectedTopicKey) return [];
    const [sub, top] = selectedTopicKey.split("::");
    return groupedData[sub]?.[top] || [];
  }, [selectedTopicKey, groupedData]);

  const activeTopicInfo = selectedTopicKey ? {
    subject: selectedTopicKey.split("::")[0],
    topic: selectedTopicKey.split("::")[1]
  } : null;

  return (
    <div className="p-6 sm:p-10 space-y-8" id="question-bank-state-view">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (selectedTopicKey) {
                setSelectedTopicKey(null);
                setExpandedQuestionId(null);
              } else {
                onExit();
              }
            }}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-600 hover:text-slate-800 rounded-xl transition-all cursor-pointer shadow-3xs flex items-center justify-center shrink-0"
            id="btn-question-bank-back"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="text-left">
            <h1 className="text-lg font-sans font-extrabold text-slate-800 tracking-tight leading-none flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-600" />
              <span>Personal Question Bank</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium font-sans mt-1">
              {selectedTopicKey 
                ? `Browsing accumulated questions for ${activeTopicInfo?.topic}`
                : "Review and reinforce knowledge from all your completed checkpoints."
              }
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* If Question Bank is entirely empty */}
        {questionBank.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="py-16 text-center max-w-md mx-auto space-y-5"
            key="empty-state"
          >
            <span className="inline-flex p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 animate-pulse">
              <HelpCircle size={24} />
            </span>
            <div className="space-y-1.5">
              <h3 className="text-xs font-sans font-bold text-slate-800 tracking-tight">Question Bank is currently vacant</h3>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Complete dynamic checkpoint quizzes on any syllabus units to accumulate realistic mock assessment questions here for self-review.
              </p>
            </div>
            <button
              onClick={onExit}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer"
            >
              Start Studying First
            </button>
          </motion.div>
        ) : !selectedTopicKey ? (
          /* TOPIC SELECTION INDEX */
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-8"
            key="topic-index"
          >
            <div className="space-y-6">
              {subjectsWithQuestions.map((subjectName) => {
                const topicsMap = groupedData[subjectName];
                const topicNames = Object.keys(topicsMap);

                return (
                  <div key={subjectName} className="space-y-3.5 text-left">
                    {/* Subject Header */}
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-sans font-extrabold text-xs text-slate-400 uppercase tracking-widest leading-none">
                        {subjectName}
                      </h3>
                      <span className="text-[10px] font-bold font-mono text-slate-400">
                        {topicNames.length} {topicNames.length === 1 ? "unit" : "units"}
                      </span>
                    </div>

                    {/* Topics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {topicNames.map((topicName) => {
                        const count = topicsMap[topicName].length;
                        return (
                          <div
                            key={topicName}
                            onClick={() => setSelectedTopicKey(`${subjectName}::${topicName}`)}
                            className="p-5 bg-white border border-slate-150 hover:border-indigo-500 rounded-2xl cursor-pointer shadow-3xs hover:shadow-xs transition-all flex items-center justify-between gap-4 group"
                          >
                            <div className="space-y-1.5 text-left">
                              <h4 className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-all">
                                {topicName}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-medium">
                                Organized set containing <span className="font-bold text-indigo-600">{count} active recalling {count === 1 ? "item" : "items"}</span>.
                              </p>
                            </div>
                            <span className="p-1.5 bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 rounded-xl transition-all">
                              <ChevronRight size={14} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* QUESTIONS BROWSER ACCORDION LIST */
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-6"
            key="questions-accordion"
          >
            {/* Topic Navigation Indicator Bar */}
            <div className="bg-slate-50/55 p-3.5 rounded-2xl border border-slate-150 flex items-center justify-between text-left">
              <div>
                <span className="text-[9px] text-slate-405 font-bold uppercase tracking-widest block font-mono">BROWSING SOURCE TOPIC</span>
                <span className="text-xs font-bold text-slate-700">{activeTopicInfo?.topic}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-indigo-50 border border-indigo-100 text-indigo-700 leading-none">
                {activeTopicQuestions.length} Questions
              </span>
            </div>

            {/* Accordion List */}
            <div className="space-y-3.5">
              {activeTopicQuestions.map((item, index) => {
                const isExpanded = expandedQuestionId === item.id;
                const isQA = item.type === "qa" || (!item.options || item.options.length === 0);
                return (
                  <div
                    key={item.id}
                    className={`border transition-all rounded-2xl overflow-hidden text-left bg-white ${
                      isExpanded 
                        ? "border-indigo-400 shadow-md shadow-indigo-50/20" 
                        : "border-slate-150 hover:border-slate-350"
                    }`}
                  >
                    {/* Header Row (click to expand) */}
                    <div
                      onClick={() => setExpandedQuestionId(isExpanded ? null : item.id)}
                      className="p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="flex gap-2.5 items-start flex-1">
                        <span className="text-xs font-extrabold font-mono text-slate-400 mt-0.5">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="space-y-1 text-left flex-1">
                          <div className="flex items-center gap-2">
                            {isQA ? (
                              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[8px] sm:text-[9px] font-extrabold rounded-lg uppercase tracking-wider">
                                Q&A Study Pair
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-[8px] sm:text-[9px] font-extrabold rounded-lg uppercase tracking-wider">
                                MCQ Exam Quiz
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                            {item.question}
                          </p>
                        </div>
                      </div>
                      <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isExpanded ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-400"}`}>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                    </div>

                    {/* Content Section (animated collapse) */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-slate-100 bg-slate-50/40 p-5 space-y-4"
                        >
                          {isQA ? (
                            /* Written Answer layout for Q&A pair */
                            <div className="p-4 bg-indigo-50/30 border border-indigo-100/50 rounded-xl space-y-2 block">
                              <h6 className="text-[10px] font-extrabold text-indigo-805 uppercase tracking-wider flex items-center gap-1 leading-none font-mono">
                                <CheckCircle size={11} className="text-emerald-600 shrink-0" />
                                <span>Core Explanation Answer</span>
                              </h6>
                              <p className="text-[11.5px] text-slate-700 font-semibold leading-relaxed">
                                {item.answer || "No answer provided."}
                              </p>
                            </div>
                          ) : (
                            /* Options grid for MCQs */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {item.options.map((opt, oIdx) => {
                                const isCorrect = oIdx === item.correctAnswerIndex;
                                return (
                                  <div
                                    key={oIdx}
                                    className={`p-3 rounded-xl border text-[11px] font-medium leading-relaxed flex items-center gap-2.5 ${
                                      isCorrect
                                        ? "bg-emerald-50/85 border-emerald-200 text-emerald-800 font-semibold"
                                        : "bg-white border-slate-150 text-slate-600"
                                    }`}
                                  >
                                    {isCorrect ? (
                                      <CheckCircle size={14} className="text-emerald-555 shrink-0" />
                                    ) : (
                                      <span className="w-3.5 h-3.5 rounded-full border border-slate-205 flex items-center justify-center text-[8.5px] font-extrabold text-slate-400 shrink-0 select-none">
                                        {String.fromCharCode(65 + oIdx)}
                                      </span>
                                    )}
                                    <span>{opt}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Dynamic Feedback Reason */}
                          {item.reason && !isQA && (
                            <div className="p-3.5 bg-indigo-50/20 border border-indigo-100/50 rounded-xl space-y-1 block">
                              <h6 className="text-[10px] font-extrabold text-indigo-805 uppercase tracking-wider flex items-center gap-1 leading-none font-mono">
                                <Sparkles size={11} fill="currentColor" className="text-indigo-500 border-none" />
                                <span>Academic Explanation</span>
                              </h6>
                              <p className="text-[10.5px] text-slate-600 leading-relaxed font-semibold">
                                {item.reason}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
