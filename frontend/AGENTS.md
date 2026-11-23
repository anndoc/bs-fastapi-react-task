# Agent Guide: Frontend

React + React routers + TanStack. See the root `AGENTS.md` for the dev environment, and don't
make schema/design changes without asking first.

## Domain notes

- `DocumentResponse.status` (`DocumentStatus`) is the backend's background-processing
  status (`pending` → `processing` → `completed`/`failed`), not the state of the
  file upload. Don't reuse it to represent upload progress or upload errors.
- The documents list prepends uploads and polls while any doc is pending/processing,
  so it relies on `GET /api/documents/`.
