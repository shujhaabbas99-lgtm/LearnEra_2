import { MilestoneBadge, QuizHistoryEntry, SubjectItem, SavedFlashcard } from "../types";

export function computeStreakDays(timeStudiedByDate: Record<string, number>): number {
  const dates = Object.keys(timeStudiedByDate)
    .filter(dateStr => timeStudiedByDate[dateStr] > 0)
    .sort();
  if (dates.length === 0) return 0;

  let maxStreak = 0;
  let currentStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of dates) {
    const parts = dateStr.split("-");
    if (parts.length !== 3) continue;
    
    const currentDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    
    if (!prevDate) {
      currentStreak = 1;
    } else {
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
        currentStreak = 1;
      }
    }
    prevDate = currentDate;
  }
  
  return Math.max(maxStreak, currentStreak);
}

export function computeMilestoneBadges(props: {
  topicStatuses: Record<string, string>;
  quizHistory: QuizHistoryEntry[];
  customSubjects: SubjectItem[];
  totalTimeStudied: number;
  savedFlashcards: SavedFlashcard[];
  timeStudiedByDate: Record<string, number>;
  presentationsCount: number;
}): MilestoneBadge[] {
  const {
    topicStatuses,
    quizHistory,
    customSubjects,
    totalTimeStudied,
    savedFlashcards,
    timeStudiedByDate,
    presentationsCount
  } = props;

  // 1. First Topic Completed
  const hasCompletedTopic = Object.values(topicStatuses).some(
    status => status === "completed" || status === "quiz_completed"
  );

  // 2. 7-Day Streak
  const maxStreak = computeStreakDays(timeStudiedByDate);
  const hasSevenDayStreak = maxStreak >= 7;

  // 3. 10 Topics Mastered
  const completedTopicsCount = Object.values(topicStatuses).filter(
    status => status === "completed" || status === "quiz_completed"
  ).length;
  const hasTenMastered = completedTopicsCount >= 10;

  // 4. Perfect Quiz Score
  const hasPerfectScore = quizHistory.some(
    q => q.totalQuestions > 0 && q.score === q.totalQuestions
  );

  // 5. First Custom Subject Created
  const hasCustomSubject = customSubjects.length >= 1;

  // 6. First Presentation Made
  const hasPresentation = presentationsCount >= 1;

  // 7. Flashcard Scholar
  const hasFiveFlashcards = savedFlashcards.length >= 5;

  // 8. Dedicated Student (1 hour of study = 3600 seconds)
  const hasOneHourStudied = totalTimeStudied >= 3600;

  return [
    {
      id: "first_topic_completed",
      title: "First Topic Completed",
      description: "Unlocked by reading or quiz-passing any topic.",
      iconName: "Award",
      isUnlocked: hasCompletedTopic
    },
    {
      id: "seven_day_streak",
      title: "7-Day Streak",
      description: "Unlocked by building a 7-day studying sequence.",
      iconName: "Flame",
      isUnlocked: hasSevenDayStreak
    },
    {
      id: "ten_topics_mastered",
      title: "10 Topics Mastered",
      description: "Unlocked by mastering 10 separate syllabus topics.",
      iconName: "Trophy",
      isUnlocked: hasTenMastered
    },
    {
      id: "perfect_quiz_score",
      title: "Perfect Quiz Score",
      description: "Unlocked by getting 100% on any interactive quiz.",
      iconName: "Sparkles",
      isUnlocked: hasPerfectScore
    },
    {
      id: "first_custom_subject",
      title: "First Custom Subject",
      description: "Unlocked by initializing your first custom subject.",
      iconName: "BookOpen",
      isUnlocked: hasCustomSubject
    },
    {
      id: "first_presentation",
      title: "First Presentation Made",
      description: "Unlocked by compiling your first AI slideshow deck.",
      iconName: "Presentation",
      isUnlocked: hasPresentation
    },
    {
      id: "flashcard_scholar",
      title: "Flashcard Scholar",
      description: "Unlocked by capturing at least 5 active flashcards.",
      iconName: "Layers",
      isUnlocked: hasFiveFlashcards
    },
    {
      id: "dedicated_student",
      title: "Dedicated Student",
      description: "Unlocked by completing over 1 hour of active study.",
      iconName: "Clock",
      isUnlocked: hasOneHourStudied
    }
  ];
}
