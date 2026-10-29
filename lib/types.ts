import type { Flashcard, QuizQuestion, Summary } from "./schemas";

export type SourceKind = "pdf" | "text";

export type StudyDoc = {
  id: string;
  title: string;
  source: SourceKind;
  text: string;
  pages?: number;
  createdAt: number;
  summary?: Summary;
  cards?: Flashcard[];
  quiz?: QuizQuestion[];
};

export type ApiError = { error: string; message: string };

export type QuizResult = {
  id: string;
  docId: string;
  docTitle: string;
  takenAt: number;
  questions: QuizQuestion[];
  // رقم الخيار اللي اختاره الطالب لكل سؤال، و -1 إذا ما جاوب.
  answers: number[];
  correct: number;
};

export type WeakTopic = { topic: string; wrong: number; total: number };
