export type GrammarExamplePartRole =
  | "subject"
  | "direct-object"
  | "place"
  | "time"
  | "relative-pronoun"
  | "pronoun"
  | "verb"
  | "context";

export interface GrammarExamplePart {
  text: string;
  role?: GrammarExamplePartRole;
  label?: string;
}

export interface GrammarAnnotatedExample {
  title: string;
  sourceSentences?: string[];
  resultParts: GrammarExamplePart[];
  explanation: string;
}

export interface GrammarTopic {
  id: string;
  title: string;
  category: string;
  summary: string;
  examples: string[];
  annotatedExamples?: GrammarAnnotatedExample[];
}
