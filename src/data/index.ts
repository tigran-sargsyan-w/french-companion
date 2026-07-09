import { useQuery } from "@tanstack/react-query";

import type { GrammarTopic, HomeworkItem, Lesson, Mistake, MistakeCategory, VocabStatus, VocabWord } from "@/types";

export type { GrammarTopic, HomeworkItem, Lesson, Mistake, MistakeCategory, VocabStatus, VocabWord } from "@/types";

export interface ContentVersion {
  version: string;
  updatedAt: string;
  description?: string;
}

export interface LessonIndexItem {
  id: string;
  number?: number;
  title: string;
  date: string;
  level?: string;
  status?: "done" | "in-progress" | "planned";
  path: string;
}

export interface LessonBundle {
  lesson: Lesson;
  vocabulary: VocabWord[];
  grammar: GrammarTopic[];
  mistakes: Mistake[];
  homework: HomeworkItem[];
}

export interface LearningData {
  lessons: Lesson[];
  vocabulary: VocabWord[];
  grammar: GrammarTopic[];
  mistakes: Mistake[];
  homework: HomeworkItem[];
  contentVersion: ContentVersion;
  lessonIndex: LessonIndexItem[];
}

function getPublicPath(path: string) {
  const cleanPath = path.replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${cleanPath}`;
}

async function fetchDataFile<T>(path: string): Promise<T> {
  const response = await fetch(getPublicPath(path), {
    cache: "no-cache",
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function loadLessonBundle(indexItem: LessonIndexItem): Promise<LessonBundle> {
  const basePath = indexItem.path.replace(/\/+$/, "");

  const [lesson, vocabulary, grammar, mistakes, homework] = await Promise.all([
    fetchDataFile<Lesson>(`${basePath}/lesson.json`),
    fetchDataFile<VocabWord[]>(`${basePath}/vocabulary.json`),
    fetchDataFile<GrammarTopic[]>(`${basePath}/grammar.json`),
    fetchDataFile<Mistake[]>(`${basePath}/mistakes.json`),
    fetchDataFile<HomeworkItem[]>(`${basePath}/homework.json`),
  ]);

  return {
    lesson,
    vocabulary,
    grammar,
    mistakes,
    homework,
  };
}

export async function loadLearningData(): Promise<LearningData> {
  const [lessonIndex, contentVersion] = await Promise.all([
    fetchDataFile<LessonIndexItem[]>("data/lessons.json"),
    fetchDataFile<ContentVersion>("data/content-version.json"),
  ]);

  const lessonBundles = await Promise.all(lessonIndex.map(loadLessonBundle));

  return {
    lessons: lessonBundles.map((bundle) => bundle.lesson),
    vocabulary: lessonBundles.flatMap((bundle) => bundle.vocabulary),
    grammar: lessonBundles.flatMap((bundle) => bundle.grammar),
    mistakes: lessonBundles.flatMap((bundle) => bundle.mistakes),
    homework: lessonBundles.flatMap((bundle) => bundle.homework),
    contentVersion,
    lessonIndex,
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
