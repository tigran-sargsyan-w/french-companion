export type VocabStatus = "new" | "learning" | "learned";

export interface VocabWord {
  id: string;
  french: string;
  translation: string;
  example: string;
  status: VocabStatus;
  firstSeenLessonId: string;
  appearances: number;
}
