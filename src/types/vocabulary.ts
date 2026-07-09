export type VocabStatus = "new" | "learning" | "learned";

export interface VocabSourceItem {
  id: string;
  french: string;
  translation: string;
  example: string;
  status: VocabStatus;
}

export interface VocabWord extends VocabSourceItem {
  firstSeenLessonId: string;
  appearances: number;
  seenInLessonIds: string[];
  sourceIds: string[];
}
