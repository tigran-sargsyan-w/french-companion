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
      photos/
        board-photo.jpg
```

## Files

- `public/data/lessons.json` — small lesson index with metadata and a `path` for each lesson folder
- `lesson.json` — lesson summary, notes and photos only
- `grammar.json` — grammar topics for this lesson only
- `vocabulary.json` — words and expressions for this lesson only
- `mistakes.json` — mistakes connected to this lesson only
- `homework.json` — homework tasks for this lesson only
- `photos/` — optional lesson documents, board photos or screenshots used by `lesson.json`
- `public/data/content-version.json` — metadata for the current content snapshot

## Runtime code

- `src/data/index.ts` loads the lesson index, then loads each lesson folder.
- The loader still returns one normalized `LearningData` object for the UI: `lessons`, `vocabulary`, `grammar`, `mistakes` and `homework`.
- Lesson pages infer their related grammar, vocabulary, homework and mistakes directly from the files inside that lesson folder.
- Do not duplicate `grammarTopicIds`, `vocabIds` or `homeworkIds` in `lesson.json`.
- Do not add `lessonId` manually to `homework.json` or `mistakes.json`; the loader adds it from the lesson folder at runtime.
- Vocabulary appearance counts are computed dynamically from all lesson `vocabulary.json` files. Do not add or update `appearances` manually.
- The first-seen lesson for a word is also computed dynamically from the first lesson file where that word appears. Do not add `firstSeenLessonId` manually.
- Lesson photo paths are resolved relative to the lesson folder, so `photos/board.jpg` points to `public/data/lessons/<lesson-folder>/photos/board.jpg`.
- Route components call `useLearningData()` and display loading/error states while JSON is loading.

## Lesson photos

Put lesson-specific images inside that lesson folder, preferably in a `photos/` subfolder:

```txt
public/data/lessons/lesson_2_2026_07_08/photos/
  board.jpg
  textbook-page.webp
```

Then reference them in `lesson.json`:

```json
"photos": [
  {
    "src": "photos/board.jpg",
    "caption": "Tableau de révision: passé composé",
    "alt": "Photo du tableau de cours sur le passé composé"
  }
]
```

Simple string paths are also supported:

```json
"photos": ["photos/board.jpg"]
```

The lesson detail page shows a gallery and opens a large preview when a photo is clicked.

## Markdown in content fields

Long-form and example text can contain Markdown. The UI renders it consistently on lesson, grammar, vocabulary, homework, mistake and review pages.

Markdown is supported in these content-oriented fields:

- lesson `summary` and `notes`
- grammar `summary`, `examples`, annotated `explanation` and `sourceSentences`
- vocabulary `translation` and `example`
- homework `description`
- mistake `wrong`, `correct` and `note`
- page-header descriptions when they come from content

Keep structural fields such as IDs, titles, dates, categories, statuses and file paths as plain text.

Inside JSON strings, use `\n` for a line break and `\n\n` for a new paragraph. Examples:

```json
{
  "summary": "**Règle générale**\nLes pays terminés par *-e* sont généralement féminins.\n\n**Exceptions**\n- le Mexique\n- le Belize\n- le Suriname"
}
```

Supported syntax includes:

```md
**texte en gras**
*texte en italique*
`élément grammatical`
~~texte barré~~

- liste à puces
- deuxième élément

1. première étape
2. deuxième étape

[Lien externe](https://example.com)

> Remarque importante
```

GitHub-style tables, headings and fenced code blocks are also supported in long-form fields. Raw HTML is intentionally not rendered.

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
3. Optionally add lesson images under `photos/` and reference them from `lesson.json`.
4. Put new words only in that lesson's `vocabulary.json`.
5. Put new grammar topics only in that lesson's `grammar.json`.
6. Put homework and mistakes only in that lesson's `homework.json` and `mistakes.json`.
7. Add the new lesson to `public/data/lessons.json` with its `path`.
8. Update `public/data/content-version.json`.
9. Commit and push. GitHub Actions will validate the data, rebuild, and deploy the site.

Keep IDs stable inside each file because React keys, search and future review features depend on them.
