export type VocabStatus = "new" | "learning" | "learned";

export interface VocabSourceItem {
  id: string;
  french: string;
  translation: string;
  example: string;
  status: VocabStatus;
  firstSeenLessonId: string;
}

export interface VocabWord extends VocabSourceItem {
  appearances: number;
  seenInLessonIds: string[];
}
