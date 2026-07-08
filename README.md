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

To update lessons, vocabulary, grammar, mistakes or homework, edit the relevant JSON file, commit the change, and push. GitHub Actions will rebuild and redeploy the site automatically.

## Routing

The app uses hash-based routing so it can work reliably on GitHub Pages without a backend server.
