import { useQuery } from "@tanstack/react-query";

import type {
  GrammarTopic,
  HomeworkItem,
  HomeworkSourceItem,
  Lesson,
  Mistake,
  MistakeCategory,
  MistakeSourceItem,
  VocabSourceItem,
  VocabStatus,
  VocabWord,
} from "@/types";

export type {
  GrammarTopic,
  HomeworkItem,
  HomeworkSourceItem,
  Lesson,
  Mistake,
  MistakeCategory,
  MistakeSourceItem,
  VocabSourceItem,
  VocabStatus,
  VocabWord,
} from "@/types";

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
  vocabulary: VocabSourceItem[];
  grammar: GrammarTopic[];
  mistakes: Mistake[];
  homework: HomeworkItem[];
}

export interface LearningData {
  lessons: Lesson[];
  lessonBundles: LessonBundle[];
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

function getVocabKey(french: string) {
  return french.trim().replace(/\s+/g, " ").toLocaleLowerCase("fr-FR");
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

  const [lesson, vocabulary, grammar, mistakesSource, homeworkSource] = await Promise.all([
    fetchDataFile<Lesson>(`${basePath}/lesson.json`),
    fetchDataFile<VocabSourceItem[]>(`${basePath}/vocabulary.json`),
    fetchDataFile<GrammarTopic[]>(`${basePath}/grammar.json`),
    fetchDataFile<MistakeSourceItem[]>(`${basePath}/mistakes.json`),
    fetchDataFile<HomeworkSourceItem[]>(`${basePath}/homework.json`),
  ]);

  const mistakes = mistakesSource.map((mistake) => ({
    ...mistake,
    lessonId: lesson.id,
  }));

  const homework = homeworkSource.map((item) => ({
    ...item,
    lessonId: lesson.id,
  }));

  return {
    lesson,
    vocabulary,
    grammar,
    mistakes,
    homework,
  };
}

function buildVocabularyIndex(lessonBundles: LessonBundle[]): VocabWord[] {
  const vocabularyByKey = new Map<string, VocabWord>();

  for (const bundle of lessonBundles) {
    for (const word of bundle.vocabulary) {
      const key = getVocabKey(word.french);
      const existingWord = vocabularyByKey.get(key);

      if (!existingWord) {
        vocabularyByKey.set(key, {
          ...word,
          firstSeenLessonId: bundle.lesson.id,
          appearances: 1,
          seenInLessonIds: [bundle.lesson.id],
          sourceIds: [word.id],
        });
        continue;
      }

      existingWord.appearances += 1;
      existingWord.sourceIds.push(word.id);

      if (!existingWord.seenInLessonIds.includes(bundle.lesson.id)) {
        existingWord.seenInLessonIds.push(bundle.lesson.id);
      }
    }
  }

  return Array.from(vocabularyByKey.values());
}

export async function loadLearningData(): Promise<LearningData> {
  const [lessonIndex, contentVersion] = await Promise.all([
    fetchDataFile<LessonIndexItem[]>("data/lessons.json"),
    fetchDataFile<ContentVersion>("data/content-version.json"),
  ]);

  const lessonBundles = await Promise.all(lessonIndex.map(loadLessonBundle));

  return {
    lessons: lessonBundles.map((bundle) => bundle.lesson),
    lessonBundles,
    vocabulary: buildVocabularyIndex(lessonBundles),
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

export function getLessonBundle(data: LearningData, lessonId: string) {
  return data.lessonBundles.find((bundle) => bundle.lesson.id === lessonId);
}

export function getVocabByLesson(data: LearningData, lessonId: string) {
  const bundle = getLessonBundle(data, lessonId);

  if (!bundle) {
    return [];
  }

  const wordsById = new Map<string, VocabWord>();

  for (const sourceWord of bundle.vocabulary) {
    const word = data.vocabulary.find((candidate) => candidate.sourceIds.includes(sourceWord.id));

    if (word) {
      wordsById.set(word.id, word);
    }
  }

  return Array.from(wordsById.values());
}

export function getGrammarByLesson(data: LearningData, lessonId: string) {
  return getLessonBundle(data, lessonId)?.grammar ?? [];
}

export function getHomeworkByLesson(data: LearningData, lessonId: string) {
  return getLessonBundle(data, lessonId)?.homework ?? [];
}

export function getMistakesByLesson(data: LearningData, lessonId: string) {
  return getLessonBundle(data, lessonId)?.mistakes ?? [];
}
