import React, { useState, useMemo } from "react";
import { QuizHistoryEntry } from "../types";
import { TrendingUp, TrendingDown, Target, Award, Calendar, Activity, ChevronDown, ArrowRight } from "lucide-react";

export interface QuizTrendsChartProps {
  quizHistory: QuizHistoryEntry[];
  onReviewTopic?: (subjectName: string, topicName: string) => void;
}

export default function QuizTrendsChart({ quizHistory, onReviewTopic }: QuizTrendsChartProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Extract unique subjects from history safely
  const subjectsList = useMemo(() => {
    const list = new Set<string>();
    quizHistory.forEach(q => {
      if (q.subject && q.subject.trim()) {
        list.add(q.subject.trim());
      }
    });
    return Array.from(list);
  }, [quizHistory]);

  // Filter and prepare quiz history
  const filteredAndSortedData = useMemo(() => {
    // Filter by subject
    const filtered = selectedSubject === "all"
      ? quizHistory
      : quizHistory.filter(q => q.subject === selectedSubject);

    // Get the last 15 attempts (as requested: "lightweight... last 10-20 attempts is more useful")
    // Keep chronologically oldest-to-newest for drawing the line left-to-right (chronologically forward)
    const sorted = [...filtered].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    return sorted.slice(-15);
  }, [quizHistory, selectedSubject]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredAndSortedData.length === 0) {
      return { average: 0, peak: 0, count: 0, trend: "neutral" as "up" | "down" | "neutral" };
    }

    let sum = 0;
    let peak = 0;
    const percentages = filteredAndSortedData.map(d => {
      const pct = d.totalQuestions > 0 ? (d.score / d.totalQuestions) * 100 : 0;
      sum += pct;
      if (pct > peak) peak = pct;
      return pct;
    });

    const average = Math.round(sum / filteredAndSortedData.length);

    // Calculate trend direction by comparing second half vs first half
    let trend: "up" | "down" | "neutral" = "neutral";
    const len = percentages.length;
    if (len >= 2) {
      const mid = Math.floor(len / 2);
      const firstHalf = percentages.slice(0, mid);
      const secondHalf = percentages.slice(mid);
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 2) {
        trend = "up";
      } else if (secondAvg < firstAvg - 2) {
        trend = "down";
      }
    }

    return { average, peak: Math.round(peak), count: filteredAndSortedData.length, trend };
  }, [filteredAndSortedData]);

  // SVG Chart Dimensions
  const viewWidth = 600;
  const viewHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  // Coordinate Converters
  const points = useMemo(() => {
    const N = filteredAndSortedData.length;
    if (N === 0) return [];

    return filteredAndSortedData.map((d, i) => {
      const pct = d.totalQuestions > 0 ? (d.score / d.totalQuestions) * 100 : 0;
      
      // Horizontal positioning
      const x = N <= 1 
        ? viewWidth / 2 
        : paddingLeft + (i / (N - 1)) * (viewWidth - paddingLeft - paddingRight);
      
      // Vertical positioning (0% is at bottom, 100% is at top)
      const y = paddingTop + ((100 - pct) / 100) * (viewHeight - paddingTop - paddingBottom);

      return { x, y, percentage: pct, entry: d, index: i };
    });
  }, [filteredAndSortedData, viewWidth, viewHeight]);

  // Create SVG path string for the line
  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }

    // Generate path points
    return points.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
    }, "");
  }, [points]);

  // Create SVG path string for the gradient area under the line
  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const bottomY = viewHeight - paddingBottom;
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${bottomY} Z`;
    }

    const start = `M ${points[0].x} ${bottomY} L ${points[0].x} ${points[0].y}`;
    const rest = points.map(p => `L ${p.x} ${p.y}`).join(" ");
    const end = `L ${points[points.length - 1].x} ${bottomY} Z`;

    return `${start} ${rest} ${end}`;
  }, [points, viewHeight, paddingBottom]);

  // Format full date for display
  const formatFullDate = (ts: string) => {
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      }
    } catch (_) {}
    return ts;
  };

  // Determine active displayed index details
  const activeDetailIdx = hoveredIdx !== null ? hoveredIdx : (points.length > 0 ? points.length - 1 : null);
  const activeDetail = activeDetailIdx !== null ? points[activeDetailIdx] : null;

  return (
    <div 
      className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-3xs space-y-5 text-left transition-colors duration-200"
      id="quiz-trends-chart-container"
    >
      {/* Top filter row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-sans font-extrabold text-xs text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5 uppercase">
            <Activity size={13} className="text-indigo-550 dark:text-indigo-400 shrink-0" />
            <span>Academic Score Trends</span>
          </h4>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Tracking difficulty tier trajectory over last 15 attempts </p>
        </div>

        {/* Dropdown Menu */}
        <div className="relative inline-block text-left">
          <div className="flex items-center gap-1.5">
            <label htmlFor="subject-trend-filter" className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Filter:
            </label>
            <div className="relative">
              <select
                id="subject-trend-filter"
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setHoveredIdx(null);
                }}
                className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-350 text-slate-700 dark:text-slate-200 px-3 py-1.5 pr-8 rounded-xl text-xs font-sans font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-3xs transition-all"
              >
                <option value="all">All Available Subjects</option>
                {subjectsList.map((sub, i) => (
                  <option key={i} value={sub}>{sub}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-550 dark:text-slate-400">
                <ChevronDown size={11} className="stroke-[2.5]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {quizHistory.length === 0 ? (
        <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl text-center space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Complete a quiz to unlock score metrics</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal max-w-xs mx-auto">
            Once you log customized syllabus unit quizzes, your performance reports will plot here.
          </p>
        </div>
      ) : filteredAndSortedData.length === 0 ? (
        <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl text-center space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No attempts for {selectedSubject}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal max-w-xs mx-auto">
            You haven't completed any checkpoint quizzes for this specialized science subject yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Dashboard Stats Panel */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3" id="trend-quick-stats">
            {/* Avg Score */}
            <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 text-center transition-all hover:bg-slate-50 dark:hover:bg-slate-900/60">
              <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">
                Average Score
              </span>
              <span className="text-sm font-sans font-extrabold text-indigo-750 dark:text-indigo-400 font-mono tracking-tight flex items-center justify-center gap-1">
                {stats.average}%
              </span>
            </div>

            {/* Peak Score */}
            <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 text-center transition-all hover:bg-slate-50 dark:hover:bg-slate-900/60">
              <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">
                Peak Score
              </span>
              <span className="text-sm font-sans font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight flex items-center justify-center gap-1">
                <Award size={12} className="inline stroke-[2.5]" />
                {stats.peak}%
              </span>
            </div>

            {/* Trend Direction */}
            <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 text-center transition-all hover:bg-slate-50 dark:hover:bg-slate-900/60">
              <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">
                Trend Shift
              </span>
              <span className="text-sm font-sans font-extrabold tracking-tight flex items-center justify-center gap-1">
                {stats.trend === "up" && (
                  <span className="text-emerald-600 dark:text-emerald-450 flex items-center gap-0.5 font-mono text-[11px] leading-tight font-extrabold">
                    <TrendingUp size={11} className="stroke-[2.5]" /> UP
                  </span>
                )}
                {stats.trend === "down" && (
                  <span className="text-rose-600 dark:text-rose-450 flex items-center gap-0.5 font-mono text-[11px] leading-tight font-extrabold">
                    <TrendingDown size={11} className="stroke-[2.5]" /> DOWN
                  </span>
                )}
                {stats.trend === "neutral" && (
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-0.5 font-mono text-[11px] leading-tight font-bold">
                    STEADY
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* SVG Canvas Area */}
          <div className="relative bg-slate-50/30 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800 rounded-2xl p-1 overflow-hidden" id="trend-svg-container">
            <svg 
              width="100%" 
              height={viewHeight}
              viewBox={`0 0 ${viewWidth} ${viewHeight}`}
              preserveAspectRatio="xMidYMid meet"
              className="overflow-visible"
            >
              <defs>
                {/* Indigo Area Gradient */}
                <linearGradient id="indigoAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4338ca" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#4338ca" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Grids */}
              {[0, 25, 50, 75, 100].map((gridPct) => {
                const y = paddingTop + ((100 - gridPct) / 100) * (viewHeight - paddingTop - paddingBottom);
                return (
                  <g key={gridPct} className="opacity-45">
                    <line 
                      x1={paddingLeft} 
                      y1={y} 
                      x2={viewWidth - paddingRight} 
                      y2={y} 
                      stroke="currentColor"
                      className="text-slate-205 dark:text-slate-800" 
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text 
                      x={paddingLeft - 8} 
                      y={y + 3} 
                      textAnchor="end" 
                      fill="currentColor" 
                      className="text-[9px] font-mono font-extrabold text-slate-400 dark:text-slate-550"
                    >
                      {gridPct}%
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Cover */}
              {areaPath && (
                <path d={areaPath} fill="url(#indigoAreaGrad)" />
              )}

              {/* Main Glowing Curve line */}
              {linePath && (
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="#4338ca" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="drop-shadow-xs"
                />
              )}

              {/* Node Circles (Interactive & Sized) */}
              {points.map((p) => {
                const isActive = activeDetailIdx === p.index;
                return (
                  <g key={p.index}>
                    {/* Hover hotspot bubble */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="14"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIdx(p.index)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onTouchStart={() => setHoveredIdx(p.index)}
                    />
                    
                    {/* Visual node shadow / border */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isActive ? "7.5" : "5"}
                      fill="white"
                      stroke={isActive ? "#4338ca" : "#6366f1"}
                      strokeWidth={isActive ? "3" : "1.5"}
                      className="transition-all duration-150 pointer-events-none"
                    />

                    {/* Quick helper label on active node */}
                    {isActive && (
                      <text 
                        x={p.x} 
                        y={p.y - 12} 
                        textAnchor="middle" 
                        fill={isActive ? "#6366f1" : "#4338ca"} 
                        className="text-[10px] font-mono font-extrabold text-indigo-600 dark:text-indigo-400"
                      >
                        {Math.round(p.percentage)}%
                      </text>
                    )}
                  </g>
                );
              })}

              {/* X-axis indicators */}
              <g className="opacity-90">
                {/* Left/Start marker */}
                <text 
                  x={paddingLeft} 
                  y={viewHeight - 12} 
                  textAnchor="start" 
                  fill="currentColor" 
                  className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                >
                  Oldest Attempt
                </text>
                
                {/* Right/End marker */}
                <text 
                  x={viewWidth - paddingRight} 
                  y={viewHeight - 12} 
                  textAnchor="end" 
                  fill="currentColor" 
                  className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                >
                  Latest
                </text>
 
                {/* Subtitle count indicator */}
                <text 
                  x={(viewWidth + paddingLeft) / 2} 
                  y={viewHeight - 12} 
                  textAnchor="middle" 
                  fill="currentColor" 
                  className="text-[9px] font-sans font-bold uppercase tracking-widest font-mono text-slate-500 dark:text-slate-400"
                >
                  {points.length} sessions plotted
                </text>
              </g>
            </svg>
          </div>

          {/* Detailed Floating Metadata / Focus Card */}
          {activeDetail && (
            <div 
              onClick={() => {
                if (onReviewTopic) {
                  onReviewTopic(activeDetail.entry.subject, activeDetail.entry.topic);
                }
              }}
              className="bg-indigo-50/45 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-850 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group transition-all"
              id="active-node-details-card"
            >
              <div className="text-left space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[8px] font-mono font-extrabold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/60 dark:border-indigo-900 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                    {activeDetail.entry.subject}
                  </span>
                  <span className="text-[8px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">
                    {activeDetail.entry.difficultyLevel || "standard"}
                  </span>
                </div>
                <h5 className="font-sans font-extrabold text-xs text-slate-800 dark:text-slate-100 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors w-full break-words">
                  {activeDetail.entry.topic}
                </h5>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1">
                  <Calendar size={10} />
                  <span>Taken {formatFullDate(activeDetail.entry.timestamp)}</span>
                </span>
              </div>

              <div className="flex items-center gap-2.5 justify-between sm:justify-end shrink-0">
                <div className="text-right">
                  <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-0.5">
                    Quiz Score
                  </span>
                  <span className="text-xs font-sans font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                    {activeDetail.entry.score} / {activeDetail.entry.totalQuestions} ({Math.round(activeDetail.percentage)}%)
                  </span>
                </div>
                <span className="flex items-center gap-1 text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-indigo-200/50 dark:border-indigo-800/80 px-2 py-1 rounded-lg shadow-3xs group-hover:bg-indigo-605 group-hover:text-white transition-all">
                  <span>Review</span>
                  <ArrowRight size={8} />
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
