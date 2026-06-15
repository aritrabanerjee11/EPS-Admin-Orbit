# EPS Admin Orbit

Conversational Operations Console for internal engineering workflows.

## What is built

This starter ships the current code-generation use case end to end:

- Chat-first field collection for `generate_codes`
- Backend field extraction and Zod validation
- Preview before execution
- Confirm flow through a backend provider
- Working mock code provider
- Real SOAP provider behind the same backend interface
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

## Real Code Generation

The SOAP path is based on the working `API-Tool.ps1` flow:

- Endpoint: `https://{env}.account.oup.com/api/edu/open/eac-web-services/`
- Request: `CreateActivationCodeBatchRequest`
- Username template: `{env}_test`
- System ID: `elt_olb` or `elt_vst`
- Response extraction: `<eac:activationCode>...</eac:activationCode>`

Chat now collects the real blocking inputs:

- Number of tokens
- ISBN or Product ID
- Environment
- Optional allowed usages, system ID, validity dates, batch name

Copy `apps/backend/.env.example` to `apps/backend/.env` if you need to override endpoint, username, password, or timeout settings.

## Provider Selection

The backend defaults to the mock provider:

```bash
CODE_PROVIDER=mock npm run dev -w @eps-admin-orbit/backend
```

The SOAP provider is intentionally hidden from the frontend and selected only on the backend. Selecting `PREPROD` or `PROD` uses SOAP unless demo mode is enabled:

```bash
ENABLE_SOAP=true ENABLE_DEMO_MODE=false npm run dev -w @eps-admin-orbit/backend
```

Use stable deterministic mock behavior for demos:

```bash
ENABLE_DEMO_MODE=true npm run dev -w @eps-admin-orbit/backend
```
