export type GrammarExamplePartRole =
  | "subject"
  | "direct-object"
  | "place"
  | "time"
  | "relative-pronoun"
  | "pronoun"
  | "verb"
  | "context";

export interface GrammarAnnotatedExample {
  title: string;
  sourceSentences?: string[];
  markup: string;
  explanation: string;
}

export interface GrammarTopic {
  id: string;
  title: string;
  category: string;
  summary: string[];
  examples: string[];
  annotatedExamples?: GrammarAnnotatedExample[];
}
