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
  classLevel?: string;
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

const CONTENT_VERSION_STALE_TIME = 60 * 1000;

function getVersionedPublicPath(path: string, version: string) {
  const publicPath = getPublicPath(path);
  const separator = publicPath.includes("?") ? "&" : "?";
  return `${publicPath}${separator}v=${encodeURIComponent(version)}`;
}

async function fetchContentVersion(): Promise<ContentVersion> {
  const path = "data/content-version.json";
  const response = await fetch(getPublicPath(path), {
    cache: "no-cache",
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  return response.json() as Promise<ContentVersion>;
}

async function fetchDataFile<T>(path: string, version: string): Promise<T> {
  const response = await fetch(getVersionedPublicPath(path, version), {
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function loadLessonBundle(indexItem: LessonIndexItem, version: string): Promise<LessonBundle> {
  const basePath = indexItem.path.replace(/\/+$/, "");

  const [lesson, vocabulary, grammar, mistakesSource, homeworkSource] = await Promise.all([
    fetchDataFile<Lesson>(`${basePath}/lesson.json`, version),
    fetchDataFile<VocabSourceItem[]>(`${basePath}/vocabulary.json`, version),
    fetchDataFile<GrammarTopic[]>(`${basePath}/grammar.json`, version),
    fetchDataFile<MistakeSourceItem[]>(`${basePath}/mistakes.json`, version),
    fetchDataFile<HomeworkSourceItem[]>(`${basePath}/homework.json`, version),
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

export async function loadLearningData(contentVersion: ContentVersion): Promise<LearningData> {
  const lessonIndex = await fetchDataFile<LessonIndexItem[]>(
    "data/lessons.json",
    contentVersion.version,
  );

  const lessonBundles = await Promise.all(
    lessonIndex.map((indexItem) => loadLessonBundle(indexItem, contentVersion.version)),
  );

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
  const contentVersionQuery = useQuery({
    queryKey: ["content-version"],
    queryFn: fetchContentVersion,
    staleTime: CONTENT_VERSION_STALE_TIME,
  });
  const contentVersion = contentVersionQuery.data;

  return useQuery({
    queryKey: ["learning-data", contentVersion?.version ?? "version-unavailable"],
    queryFn: () => {
      if (contentVersion) {
        return loadLearningData(contentVersion);
      }

      throw contentVersionQuery.error ?? new Error("Content version is unavailable.");
    },
    enabled: Boolean(contentVersion) || contentVersionQuery.isError,
    staleTime: Infinity,
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
