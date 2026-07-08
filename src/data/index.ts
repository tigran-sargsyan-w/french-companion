import { useQuery } from "@tanstack/react-query";

import type { GrammarTopic, HomeworkItem, Lesson, Mistake, MistakeCategory, VocabStatus, VocabWord } from "@/types";

export type { GrammarTopic, HomeworkItem, Lesson, Mistake, MistakeCategory, VocabStatus, VocabWord } from "@/types";

export interface ContentVersion {
  version: string;
  updatedAt: string;
  description?: string;
}

export interface LearningData {
  lessons: Lesson[];
  vocabulary: VocabWord[];
  grammar: GrammarTopic[];
  mistakes: Mistake[];
  homework: HomeworkItem[];
  contentVersion: ContentVersion;
}

const dataBaseUrl = `${import.meta.env.BASE_URL}data`;

async function fetchDataFile<T>(fileName: string): Promise<T> {
  const response = await fetch(`${dataBaseUrl}/${fileName}`, {
    cache: "no-cache",
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${fileName}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function loadLearningData(): Promise<LearningData> {
  const [lessons, vocabulary, grammar, mistakes, homework, contentVersion] = await Promise.all([
    fetchDataFile<Lesson[]>("lessons.json"),
    fetchDataFile<VocabWord[]>("vocabulary.json"),
    fetchDataFile<GrammarTopic[]>("grammar.json"),
    fetchDataFile<Mistake[]>("mistakes.json"),
    fetchDataFile<HomeworkItem[]>("homework.json"),
    fetchDataFile<ContentVersion>("content-version.json"),
  ]);

  return {
    lessons,
    vocabulary,
    grammar,
    mistakes,
    homework,
    contentVersion,
  };
}

export function useLearningData() {
  return useQuery({
    queryKey: ["learning-data"],
    queryFn: loadLearningData,
    staleTime: 5 * 60 * 1000,
  });
}

export function getLesson(data: LearningData, id: string) {
  return data.lessons.find((lesson) => lesson.id === id);
}

export function getVocab(data: LearningData, ids: string[]) {
  return data.vocabulary.filter((word) => ids.includes(word.id));
}

export function getGrammar(data: LearningData, ids: string[]) {
  return data.grammar.filter((topic) => ids.includes(topic.id));
}

export function getHomework(data: LearningData, ids: string[]) {
  return data.homework.filter((item) => ids.includes(item.id));
}

export function getMistakesByLesson(data: LearningData, lessonId: string) {
  return data.mistakes.filter((mistake) => mistake.lessonId === lessonId);
}
