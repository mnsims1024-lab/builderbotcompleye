# Forge Open Builder Bot

Forge is a free, open-source, standalone AI web builder. Describe a project, paste a blueprint, speak an idea, or upload source files; Forge returns a working preview and a downloadable ZIP of editable files.

## Features

- Text, voice, drag-and-drop, and multi-file blueprint input
- AI-generated browser-ready websites through Netlify AI Gateway
- Sandboxed live preview and source-file browser
- ZIP export with no lock-in
- Persistent build history using Netlify Database
- Responsive, accessible interface

## Local development

Install dependencies, then use Netlify Dev so the functions, AI Gateway, and database bindings are available:

```bash
npm install
netlify dev --port 8889
```

Open `http://localhost:8889`.

## Architecture

- React and Vite frontend
- Netlify Functions for generation and history APIs
- Netlify AI Gateway using OpenAI
- Netlify Database with Drizzle ORM

## License

MIT
