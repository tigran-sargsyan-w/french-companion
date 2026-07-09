import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");
const dataDir = path.join(publicDir, "data");

const requiredLessonFiles = [
  "lesson.json",
  "grammar.json",
  "vocabulary.json",
  "homework.json",
  "mistakes.json",
];

const allowedVocabStatuses = new Set(["new", "learning", "learned"]);
const allowedMistakeCategories = new Set(["Grammar", "Vocabulary", "Pronunciation", "Spelling"]);
const allowedLessonStatuses = new Set(["done", "in-progress", "planned"]);
const errors = [];
const seenIds = new Map();

function fail(scope, message) {
  errors.push(`${scope}: ${message}`);
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJson(publicPath) {
  const absolutePath = path.join(publicDir, publicPath.replace(/^\/+/, ""));

  if (!fs.existsSync(absolutePath)) {
    fail(publicPath, "file does not exist");
    return undefined;
  }

  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    fail(publicPath, `invalid JSON: ${error.message}`);
    return undefined;
  }
}

function publicPathExists(publicPath) {
  const absolutePath = path.join(publicDir, publicPath.replace(/^\/+/, ""));
  return fs.existsSync(absolutePath);
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidDateTime(value) {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function requireString(object, field, scope) {
  if (typeof object[field] !== "string" || object[field].trim() === "") {
    fail(scope, `field '${field}' must be a non-empty string`);
  }
}

function requireBoolean(object, field, scope) {
  if (typeof object[field] !== "boolean") {
    fail(scope, `field '${field}' must be a boolean`);
  }
}

function requireArray(value, scope) {
  if (!Array.isArray(value)) {
    fail(scope, "must be an array");
    return false;
  }
  return true;
}

function checkUniqueId(id, scope) {
  if (typeof id !== "string" || id.trim() === "") {
    fail(scope, "field 'id' must be a non-empty string");
    return;
  }

  const previousScope = seenIds.get(id);
  if (previousScope) {
    fail(scope, `duplicate id '${id}', already used in ${previousScope}`);
    return;
  }

  seenIds.set(id, scope);
}

function validateContentVersion() {
  const scope = "data/content-version.json";
  const contentVersion = readJson(scope);

  if (!isObject(contentVersion)) {
    fail(scope, "must be an object");
    return;
  }

  requireString(contentVersion, "version", scope);
  requireString(contentVersion, "updatedAt", scope);

  if (!isValidDateTime(contentVersion.updatedAt)) {
    fail(scope, "field 'updatedAt' must be a valid date/time string");
  }

  if ("description" in contentVersion && typeof contentVersion.description !== "string") {
    fail(scope, "field 'description' must be a string when present");
  }
}

function validateLessonIndexItem(item, index) {
  const scope = `data/lessons.json[${index}]`;

  if (!isObject(item)) {
    fail(scope, "must be an object");
    return undefined;
  }

  requireString(item, "id", scope);
  requireString(item, "title", scope);
  requireString(item, "date", scope);
  requireString(item, "path", scope);

  if ("number" in item && typeof item.number !== "number") {
    fail(scope, "field 'number' must be a number when present");
  }

  if (!isValidDate(item.date)) {
    fail(scope, "field 'date' must use YYYY-MM-DD and be a real date");
  }

  if ("level" in item && typeof item.level !== "string") {
    fail(scope, "field 'level' must be a string when present");
  }

  if ("status" in item && !allowedLessonStatuses.has(item.status)) {
    fail(scope, `field 'status' must be one of: ${Array.from(allowedLessonStatuses).join(", ")}`);
  }

  if (typeof item.path === "string") {
    if (!item.path.startsWith("data/lessons/")) {
      fail(scope, "field 'path' must start with data/lessons/");
    }

    if (!publicPathExists(item.path)) {
      fail(scope, `path '${item.path}' does not exist`);
    }

    if (typeof item.number === "number" && isValidDate(item.date)) {
      const expectedFolder = `lesson_${item.number}_${item.date.replaceAll("-", "_")}`;
      const actualFolder = path.basename(item.path);
      if (actualFolder !== expectedFolder) {
        fail(scope, `folder name should be '${expectedFolder}' for lesson number/date`);
      }
    }
  }

  return item;
}

function validateLessonFile(lesson, indexItem, lessonFolderPublicPath) {
  const scope = `${lessonFolderPublicPath}/lesson.json`;

  if (!isObject(lesson)) {
    fail(scope, "must be an object");
    return;
  }

  for (const legacyField of ["grammarTopicIds", "vocabIds", "homeworkIds"]) {
    if (legacyField in lesson) {
      fail(scope, `remove legacy field '${legacyField}'; lesson content is inferred from folder files`);
    }
  }

  requireString(lesson, "id", scope);
  requireString(lesson, "title", scope);
  requireString(lesson, "date", scope);
  requireString(lesson, "summary", scope);
  requireString(lesson, "notes", scope);

  if (!Array.isArray(lesson.photos)) {
    fail(scope, "field 'photos' must be an array");
  }

  if (lesson.id !== indexItem.id) {
    fail(scope, `lesson id '${lesson.id}' must match lessons.json id '${indexItem.id}'`);
  }

  if (lesson.title !== indexItem.title) {
    fail(scope, "lesson title must match lessons.json title");
  }

  if (lesson.date !== indexItem.date) {
    fail(scope, "lesson date must match lessons.json date");
  }

  if (!isValidDate(lesson.date)) {
    fail(scope, "field 'date' must use YYYY-MM-DD and be a real date");
  }

  if (Array.isArray(lesson.photos)) {
    lesson.photos.forEach((photo, index) => validatePhoto(photo, `${scope}.photos[${index}]`, lessonFolderPublicPath));
  }
}

function validatePhoto(photo, scope, lessonFolderPublicPath) {
  const src = typeof photo === "string" ? photo : isObject(photo) ? photo.src : undefined;

  if (typeof src !== "string" || src.trim() === "") {
    fail(scope, "photo must be a string path or an object with a non-empty 'src' field");
    return;
  }

  if (isObject(photo) && "caption" in photo && typeof photo.caption !== "string") {
    fail(scope, "photo caption must be a string when present");
  }

  if (/^(https?:|data:|blob:)/.test(src)) {
    return;
  }

  const normalizedSrc = src.replace(/^\/+/, "");
  const publicPath = normalizedSrc.startsWith("data/")
    ? normalizedSrc
    : `${lessonFolderPublicPath}/${normalizedSrc}`;

  if (!publicPathExists(publicPath)) {
    fail(scope, `photo file '${src}' does not exist`);
  }
}

function validateVocabulary(items, lessonFolderPublicPath) {
  const scope = `${lessonFolderPublicPath}/vocabulary.json`;
  if (!requireArray(items, scope)) return;

  items.forEach((item, index) => {
    const itemScope = `${scope}[${index}]`;
    if (!isObject(item)) {
      fail(itemScope, "must be an object");
      return;
    }

    checkUniqueId(item.id, itemScope);
    requireString(item, "french", itemScope);
    requireString(item, "translation", itemScope);
    requireString(item, "example", itemScope);

    if (!allowedVocabStatuses.has(item.status)) {
      fail(itemScope, `field 'status' must be one of: ${Array.from(allowedVocabStatuses).join(", ")}`);
    }

    for (const runtimeField of ["appearances", "firstSeenLessonId", "seenInLessonIds", "sourceIds"]) {
      if (runtimeField in item) {
        fail(itemScope, `remove runtime field '${runtimeField}'; it is computed by the loader`);
      }
    }
  });
}

function validateGrammar(items, lessonFolderPublicPath) {
  const scope = `${lessonFolderPublicPath}/grammar.json`;
  if (!requireArray(items, scope)) return;

  items.forEach((item, index) => {
    const itemScope = `${scope}[${index}]`;
    if (!isObject(item)) {
      fail(itemScope, "must be an object");
      return;
    }

    checkUniqueId(item.id, itemScope);
    requireString(item, "title", itemScope);
    requireString(item, "category", itemScope);
    requireString(item, "summary", itemScope);

    if (!Array.isArray(item.examples) || item.examples.some((example) => typeof example !== "string")) {
      fail(itemScope, "field 'examples' must be an array of strings");
    }

    if ("annotatedExamples" in item) {
      if (!Array.isArray(item.annotatedExamples)) {
        fail(itemScope, "field 'annotatedExamples' must be an array when present");
        return;
      }

      item.annotatedExamples.forEach((example, exampleIndex) => {
        const exampleScope = `${itemScope}.annotatedExamples[${exampleIndex}]`;
        if (!isObject(example)) {
          fail(exampleScope, "must be an object");
          return;
        }

        requireString(example, "title", exampleScope);
        requireString(example, "markup", exampleScope);
        requireString(example, "explanation", exampleScope);

        if (!Array.isArray(example.sourceSentences) || example.sourceSentences.some((sentence) => typeof sentence !== "string")) {
          fail(exampleScope, "field 'sourceSentences' must be an array of strings");
        }
      });
    }
  });
}

function validateHomework(items, lessonFolderPublicPath) {
  const scope = `${lessonFolderPublicPath}/homework.json`;
  if (!requireArray(items, scope)) return;

  items.forEach((item, index) => {
    const itemScope = `${scope}[${index}]`;
    if (!isObject(item)) {
      fail(itemScope, "must be an object");
      return;
    }

    if ("lessonId" in item) {
      fail(itemScope, "remove manual 'lessonId'; the loader adds it from the lesson folder");
    }

    checkUniqueId(item.id, itemScope);
    requireString(item, "title", itemScope);
    requireString(item, "description", itemScope);
    requireString(item, "dueDate", itemScope);
    requireBoolean(item, "done", itemScope);

    if (!isValidDate(item.dueDate)) {
      fail(itemScope, "field 'dueDate' must use YYYY-MM-DD and be a real date");
    }
  });
}

function validateMistakes(items, lessonFolderPublicPath) {
  const scope = `${lessonFolderPublicPath}/mistakes.json`;
  if (!requireArray(items, scope)) return;

  items.forEach((item, index) => {
    const itemScope = `${scope}[${index}]`;
    if (!isObject(item)) {
      fail(itemScope, "must be an object");
      return;
    }

    if ("lessonId" in item) {
      fail(itemScope, "remove manual 'lessonId'; the loader adds it from the lesson folder");
    }

    checkUniqueId(item.id, itemScope);
    requireString(item, "wrong", itemScope);
    requireString(item, "correct", itemScope);
    requireString(item, "note", itemScope);

    if (!allowedMistakeCategories.has(item.category)) {
      fail(itemScope, `field 'category' must be one of: ${Array.from(allowedMistakeCategories).join(", ")}`);
    }
  });
}

function validateLessonFolder(indexItem, index) {
  const lessonFolderPublicPath = indexItem.path.replace(/\/+$/, "");
  const lessonFolderAbsolutePath = path.join(publicDir, lessonFolderPublicPath);

  if (!fs.existsSync(lessonFolderAbsolutePath)) {
    return;
  }

  for (const fileName of requiredLessonFiles) {
    const filePublicPath = `${lessonFolderPublicPath}/${fileName}`;
    if (!publicPathExists(filePublicPath)) {
      fail(`data/lessons.json[${index}]`, `missing ${filePublicPath}`);
    }
  }

  const lesson = readJson(`${lessonFolderPublicPath}/lesson.json`);
  const vocabulary = readJson(`${lessonFolderPublicPath}/vocabulary.json`);
  const grammar = readJson(`${lessonFolderPublicPath}/grammar.json`);
  const homework = readJson(`${lessonFolderPublicPath}/homework.json`);
  const mistakes = readJson(`${lessonFolderPublicPath}/mistakes.json`);

  validateLessonFile(lesson, indexItem, lessonFolderPublicPath);
  validateVocabulary(vocabulary, lessonFolderPublicPath);
  validateGrammar(grammar, lessonFolderPublicPath);
  validateHomework(homework, lessonFolderPublicPath);
  validateMistakes(mistakes, lessonFolderPublicPath);
}

function main() {
  validateContentVersion();

  const lessons = readJson("data/lessons.json");
  if (!requireArray(lessons, "data/lessons.json")) {
    return;
  }

  const seenLessonIds = new Set();
  const seenLessonPaths = new Set();
  const seenLessonNumbers = new Set();

  lessons.forEach((item, index) => {
    const indexItem = validateLessonIndexItem(item, index);
    if (!indexItem) return;

    if (seenLessonIds.has(indexItem.id)) {
      fail(`data/lessons.json[${index}]`, `duplicate lesson id '${indexItem.id}'`);
    }
    seenLessonIds.add(indexItem.id);

    if (seenLessonPaths.has(indexItem.path)) {
      fail(`data/lessons.json[${index}]`, `duplicate lesson path '${indexItem.path}'`);
    }
    seenLessonPaths.add(indexItem.path);

    if (typeof indexItem.number === "number") {
      if (seenLessonNumbers.has(indexItem.number)) {
        fail(`data/lessons.json[${index}]`, `duplicate lesson number '${indexItem.number}'`);
      }
      seenLessonNumbers.add(indexItem.number);
    }

    validateLessonFolder(indexItem, index);
  });
}

main();

if (errors.length > 0) {
  console.error(`Learning data validation failed with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Learning data OK");
