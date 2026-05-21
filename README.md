# EPS Admin Orbit

Conversational Operations Console for internal engineering workflows.

## What is built

This starter ships the current code-generation use case end to end:

- Chat-first field collection for `generate_codes`
- Backend field extraction and Zod validation
- Preview before execution
- Confirm flow through a backend provider
- Working mock code provider
- SOAP provider placeholder behind the same backend interface
- Generated code panel with formatted/raw views
- Copy formatted, copy raw, and download TXT actions

## Commands

Install dependencies:

```bash
npm install
```

Run frontend and backend together:

```bash
npm run dev
```

Build both apps:

```bash
npm run build
```

Run the compiled backend:

```bash
npm run start
```

Local URLs:

- Frontend: http://localhost:5173
- Backend health: http://localhost:3001/api/health

## Provider Selection

The backend defaults to the mock provider:

```bash
CODE_PROVIDER=mock npm run dev -w @eps-admin-orbit/backend
```

The SOAP provider is intentionally hidden from the frontend and selected only on the backend:

```bash
CODE_PROVIDER=soap npm run dev -w @eps-admin-orbit/backend
```

SOAP calls are not wired until endpoint credentials and payload contracts are supplied.
