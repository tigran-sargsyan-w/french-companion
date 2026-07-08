# Learning data

The app data is intentionally split by domain so new lessons can be added without touching route components.

## Files

- `lessons.ts` — lesson metadata, summaries, notes and links to related data
- `vocabulary.ts` — words and expressions
- `grammar.ts` — grammar topics
- `mistakes.ts` — mistakes to review
- `homework.ts` — homework tasks
- `index.ts` — public exports and selector helpers

## Adding a lesson

1. Add new words to `vocabulary.ts`.
2. Add new grammar topics to `grammar.ts`.
3. Add homework tasks to `homework.ts`.
4. Add mistakes to `mistakes.ts` if needed.
5. Add the lesson itself to `lessons.ts` and connect it with IDs.

Keep IDs stable because routes and relationships depend on them.
