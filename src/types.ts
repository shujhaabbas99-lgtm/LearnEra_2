import React from "react";

export enum AppState {
  LOGIN_STATE = "LOGIN_STATE",
  ONBOARDING_STATE = "ONBOARDING_STATE",
  DASHBOARD_STATE = "DASHBOARD_STATE",
  SUBJECT_SELECTION_STATE = "SUBJECT_SELECTION_STATE",
  TOPIC_SOURCE_SELECTION_STATE = "TOPIC_SOURCE_SELECTION_STATE",
  LEARNING_STATE = "LEARNING_STATE",
  QUIZ_STATE = "QUIZ_STATE",
  FLASHCARD_STATE = "FLASHCARD_STATE",
  SAVED_FLASHCARDS_STATE = "SAVED_FLASHCARDS_STATE",
  QUESTION_BANK_STATE = "QUESTION_BANK_STATE",
  PRESENTATIONS_STATE = "PRESENTATIONS_STATE"
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  notes?: string;
  estimatedMinutes: number;
  completed: boolean;
  tasks: ChecklistItem[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Curriculum {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  targetCompletionDate?: string;
  modules: Module[];
}

export interface StudyLog {
  id: string;
  userId: string;
  curriculumId: string;
  curriculumTitle: string;
  lessonId: string;
  lessonTitle: string;
  durationMinutes: number;
  notes: string;
  createdAt: string; // ISO String
}

export interface UserStats {
  userId: string;
  dailyTargetMinutes: number;
  streak: number;
  lastStudyDate?: string; // YYYY-MM-DD
  totalMinutesStudied: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  reason: string;
}

export interface MissedQuestion {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  reason: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizHistoryEntry {
  topic: string;
  subject: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
  difficultyLevel: string;
  nextReviewDate?: string;
  reviewStage?: number;
}

export interface TopicInfo {
  name: string;
  description: string;
  duration: string;
}

export interface SubjectItem {
  id: string;
  name: string;
  description: string;
  colorClass: string;
  icon?: React.ReactNode;
  topics: TopicInfo[];
}

export interface SavedFlashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  topic: string;
  nextReviewDate?: string;
  reviewStage?: number;
  timestamp: string; // creation or last review timestamp
}

export function getNextRevisionSchedule(prevStage: number, isSuccessful: boolean): { reviewStage: number; nextReviewDate: string } {
  let reviewStage = 0;
  let intervalDays = 1;

  if (isSuccessful) {
    reviewStage = prevStage + 1;
    if (reviewStage === 1) intervalDays = 1;
    else if (reviewStage === 2) intervalDays = 3;
    else if (reviewStage === 3) intervalDays = 7;
    else if (reviewStage === 4) intervalDays = 14;
    else if (reviewStage >= 5) intervalDays = 30;
  } else {
    reviewStage = 0;
    intervalDays = 1;
  }

  const now = new Date();
  const nextDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return {
    reviewStage,
    nextReviewDate: nextDate.toISOString()
  };
}

export interface QuestionBankItem {
  id: string;
  subject: string;
  topic: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  reason?: string;
  timestamp: string;
  type?: "mcq" | "qa";
  answer?: string;
}

export type PresentationSourceType = "description" | "document" | "ai_decides";

export interface SlideItem {
  title: string;
  bullets: string[];
}

export interface PresentationItem {
  id: string;
  title: string;
  sourceType: PresentationSourceType;
  sourceContent: string;
  fileName?: string;
  slideCount: number;
  createdAt: string;
  slides?: SlideItem[];
  lookStyle?: "visual_minimal" | "balanced" | "info_dense";
  headingStyle?: "bold_large" | "standard" | "content_first";
}

export interface MilestoneBadge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  isUnlocked: boolean;
}




