export type MistakeCategory = "Grammar" | "Vocabulary" | "Pronunciation" | "Spelling";

export interface MistakeSourceItem {
  id: string;
  category: MistakeCategory;
  wrong: string;
  correct: string;
  note: string;
}

export interface Mistake extends MistakeSourceItem {
  lessonId: string;
}
