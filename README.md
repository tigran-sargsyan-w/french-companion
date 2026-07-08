# French Companion

Personal French learning dashboard for lessons, vocabulary, grammar, mistakes, homework and review.

## Tech stack

- React
- TypeScript
- Vite
- TanStack Router
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

## Routing

The app uses hash-based routing so it can work reliably on GitHub Pages without a backend server.
