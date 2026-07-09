# Learning data loader

The source of truth for learning content is stored as static JSON files in `public/data/`.

This folder contains the TypeScript data loader and helper selectors used by the UI.

## Static JSON structure

```txt
public/data/
  content-version.json
  lessons.json
  lessons/
    lesson_2026_07_06_relative_y/
      lesson.json
      grammar.json
      vocabulary.json
      homework.json
      mistakes.json
```

## Files

- `public/data/lessons.json` — small lesson index with metadata and a `path` for each lesson folder
- `lesson.json` — lesson summary, notes, photos and IDs of related content
- `grammar.json` — grammar topics for this lesson only
- `vocabulary.json` — words and expressions for this lesson only
- `mistakes.json` — mistakes connected to this lesson
- `homework.json` — homework tasks for this lesson
- `public/data/content-version.json` — metadata for the current content snapshot

## Runtime code

- `src/data/index.ts` loads the lesson index, then loads each lesson folder.
- The loader still returns one normalized `LearningData` object for the UI: `lessons`, `vocabulary`, `grammar`, `mistakes` and `homework`.
- Vocabulary appearance counts are computed dynamically from all lesson `vocabulary.json` files. Do not add or update `appearances` manually.
- The first-seen lesson for a word is also computed dynamically from the first lesson file where that word appears. Do not add `firstSeenLessonId` manually.
- Route components call `useLearningData()` and display loading/error states while JSON is loading.

## Adding a lesson

1. Create a new folder inside `public/data/lessons/`, for example `lesson_2026_07_08_articles`.
2. Add these files inside it: `lesson.json`, `grammar.json`, `vocabulary.json`, `homework.json`, `mistakes.json`.
3. Add the new lesson to `public/data/lessons.json` with its `path`.
4. Update `public/data/content-version.json`.
5. Commit and push. GitHub Actions will rebuild and deploy the site.

Keep IDs stable because routes and relationships depend on them.
