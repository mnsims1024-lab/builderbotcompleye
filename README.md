# Patchwork

Patchwork is a free, open-source build and repair workbench. It turns build logs, stack traces, configuration, and focused code samples into a root-cause diagnosis, a minimal repair plan, suggested patches, and verification steps.

## Features

- Repair, build-planning, and explanation modes
- Netlify AI Gateway integration with no user-managed AI key
- Safe server-side prompt construction and input limits
- Responsive, accessible static frontend
- Copyable Markdown repair reports

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:8889`.

## Deployment

Deploy the repository to Netlify. The static site publishes from `public`, and the repair API runs as a Netlify Function at `/api/repair`.

## Responsible use

Remove credentials and sensitive data before submitting logs. Treat generated patches as drafts: inspect, test, and understand every change before applying it.

## License

MIT
