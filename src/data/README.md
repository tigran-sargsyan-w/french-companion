# Learning data loader

The source of truth for learning content is stored as static JSON files in `public/data/`.

This folder contains the TypeScript data loader and helper selectors used by the UI.

## Static JSON structure

```txt
public/data/
  content-version.json
  lessons.json
  lessons/
    lesson_1_2026_07_06/
      lesson.json
      grammar.json
      vocabulary.json
      homework.json
      mistakes.json
```

## Files

- `public/data/lessons.json` — small lesson index with metadata and a `path` for each lesson folder
- `lesson.json` — lesson summary, notes and photos only
- `grammar.json` — grammar topics for this lesson only
- `vocabulary.json` — words and expressions for this lesson only
- `mistakes.json` — mistakes connected to this lesson only
- `homework.json` — homework tasks for this lesson only
- `public/data/content-version.json` — metadata for the current content snapshot

## Runtime code

- `src/data/index.ts` loads the lesson index, then loads each lesson folder.
- The loader still returns one normalized `LearningData` object for the UI: `lessons`, `vocabulary`, `grammar`, `mistakes` and `homework`.
- Lesson pages infer their related grammar, vocabulary, homework and mistakes directly from the files inside that lesson folder.
- Do not duplicate `grammarTopicIds`, `vocabIds` or `homeworkIds` in `lesson.json`.
- Do not add `lessonId` manually to `homework.json` or `mistakes.json`; the loader adds it from the lesson folder at runtime.
- Vocabulary appearance counts are computed dynamically from all lesson `vocabulary.json` files. Do not add or update `appearances` manually.
- The first-seen lesson for a word is also computed dynamically from the first lesson file where that word appears. Do not add `firstSeenLessonId` manually.
- Route components call `useLearningData()` and display loading/error states while JSON is loading.

## Automatic validation

`scripts/validate-data.mjs` checks the JSON content structure.

GitHub Actions runs this validator automatically when data files, the validator, or the validation workflow change. The deployment workflow also runs it before building the site.

The validator checks that lesson folders exist, required JSON files are present, JSON is valid, lesson index metadata matches `lesson.json`, IDs are unique, enum values are valid, legacy duplicated fields are not present, and photo files exist when referenced.

## Lesson folder naming

Use this format:

```txt
lesson_<number>_<yyyy>_<mm>_<dd>
```

Example:

```txt
lesson_1_2026_07_06
lesson_2_2026_07_08
lesson_3_2026_07_10
```

Keep the stable lesson `id` inside JSON separate from the folder name. The app loads content through the `path` field in `public/data/lessons.json`.

## Adding a lesson

1. Create a new folder inside `public/data/lessons/`, for example `lesson_2_2026_07_08`.
2. Add these files inside it: `lesson.json`, `grammar.json`, `vocabulary.json`, `homework.json`, `mistakes.json`.
3. Put new words only in that lesson's `vocabulary.json`.
4. Put new grammar topics only in that lesson's `grammar.json`.
5. Put homework and mistakes only in that lesson's `homework.json` and `mistakes.json`.
6. Add the new lesson to `public/data/lessons.json` with its `path`.
7. Update `public/data/content-version.json`.
8. Commit and push. GitHub Actions will validate the data, rebuild, and deploy the site.

Keep IDs stable inside each file because React keys, search and future review features depend on them.
