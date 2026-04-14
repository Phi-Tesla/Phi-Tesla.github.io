# My Blog

A personal static blog — no build step, no backend. Runs entirely on GitHub Pages.

## Deploy to GitHub Pages

1. Push this repo to a repository named `username/username.github.io` (your GitHub username in both places)
2. Go to **Settings → Pages** on GitHub
3. Under **Source**, select your branch (usually `master` or `main`) and the root folder (`/ (root)`)
4. Click **Save**

Your blog will be live at `https://username.github.io` within a few minutes.

## Project Structure

```
├── index.html          # Home page with latest posts
├── article.html        # Single post page (?id= parameter)
├── archive.html        # Chronological post listing
├── categories.html     # Posts grouped by category
├── tags.html           # Tag cloud with filtering
├── css/style.css       # Stylesheet
├── js/main.js          # All JavaScript: i18n, rendering, navigation
├── data/
│   ├── posts.json      # Post metadata index
│   └── i18n.json       # English / Chinese translations
└── posts/              # Individual Markdown post files
```

## Features

- **Bilingual** — English / Chinese toggle, stored in localStorage
- **Markdown posts** with code highlighting (Highlight.js), math (KaTeX), and diagrams (Mermaid)
- **Comments** via Giscus (GitHub Discussions)
- **Responsive** design
- **No build step** — all static files served directly

## Local Development

Since the site uses `fetch()` to load data, you need a local HTTP server:

```bash
npx serve .
# or
python -m http.server 8000
```

Then open `http://localhost:3000` (or `8000` for Python).
