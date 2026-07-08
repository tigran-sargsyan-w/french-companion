# Learning data loader

The source of truth for learning content is stored as static JSON files in `public/data/`.

This folder contains the TypeScript data loader and helper selectors used by the UI.

## Static JSON files

- `public/data/lessons.json` — lesson metadata, summaries, notes and links to related data
- `public/data/vocabulary.json` — words and expressions
- `public/data/grammar.json` — grammar topics
- `public/data/mistakes.json` — mistakes to review
- `public/data/homework.json` — homework tasks and their committed status
- `public/data/content-version.json` — metadata for the current content snapshot

## Runtime code

- `src/data/index.ts` fetches the JSON files and exposes helper selectors.
- Route components call `useLearningData()` and display loading/error states while JSON is loading.

## Adding a lesson

1. Add new words to `public/data/vocabulary.json`.
2. Add new grammar topics to `public/data/grammar.json`.
3. Add homework tasks to `public/data/homework.json`.
4. Add mistakes to `public/data/mistakes.json` if needed.
5. Add the lesson itself to `public/data/lessons.json` and connect it with IDs.
6. Update `public/data/content-version.json`.
7. Commit and push. GitHub Actions will rebuild and deploy the site.

Keep IDs stable because routes and relationships depend on them.
