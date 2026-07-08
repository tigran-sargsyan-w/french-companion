import { grammar } from "./grammar";
import { homework } from "./homework";
import { lessons } from "./lessons";
import { mistakes } from "./mistakes";
import { vocabulary } from "./vocabulary";

export { grammar } from "./grammar";
export { homework } from "./homework";
export { lessons } from "./lessons";
export { mistakes } from "./mistakes";
export { vocabulary } from "./vocabulary";
export type { GrammarTopic, HomeworkItem, Lesson, Mistake, MistakeCategory, VocabStatus, VocabWord } from "@/types";

export function getLesson(id: string) {
  return lessons.find((lesson) => lesson.id === id);
}

export function getVocab(ids: string[]) {
  return vocabulary.filter((word) => ids.includes(word.id));
}

export function getGrammar(ids: string[]) {
  return grammar.filter((topic) => ids.includes(topic.id));
}

export function getHomework(ids: string[]) {
  return homework.filter((item) => ids.includes(item.id));
}

export function getMistakesByLesson(lessonId: string) {
  return mistakes.filter((mistake) => mistake.lessonId === lessonId);
}
