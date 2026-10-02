# RuralCare AI Backend

This backend provides a secure API layer for the RuralCare AI dashboard. It includes auth, dashboard summary, health metrics, monitoring endpoints, and demo-safe health data.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

## Available routes

- GET /api/health
- GET /api/dashboard

## Notes

- DEMO_MODE is enabled by default in `.env.example`.
- The current implementation is a functional starter aligned to the healthcare backend prompt.
