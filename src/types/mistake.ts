export type MistakeCategory = "Grammar" | "Vocabulary" | "Pronunciation" | "Spelling";

export interface Mistake {
  id: string;
  category: MistakeCategory;
  wrong: string;
  correct: string;
  note: string;
  lessonId: string;
}
