# French Companion

Personal French learning dashboard for lessons, vocabulary, grammar, mistakes, homework and review.

## Tech stack

- React
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Tailwind CSS
- GitHub Pages via GitHub Actions

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

The production build is a static Vite build in `dist/` and is deployed to GitHub Pages by `.github/workflows/pages.yml`.

## Data workflow

Learning content is stored as static JSON files in `public/data/`.

The main index is `public/data/lessons.json`. Each lesson has its own folder:

```txt
public/data/lessons/lesson_2026_07_06_relative_y/
  lesson.json
  grammar.json
  vocabulary.json
  homework.json
  mistakes.json
```

To add a new lesson, create a new folder under `public/data/lessons/`, add the five JSON files, then register the folder path in `public/data/lessons.json`. GitHub Actions will rebuild and redeploy the site automatically after push.

## Routing

The app uses hash-based routing so it can work reliably on GitHub Pages without a backend server.
