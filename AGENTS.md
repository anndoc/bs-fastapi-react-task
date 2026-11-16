# Agent Guide

FastAPI + React knowledge base assistant: upload PDF/TXT documents and ask
questions answered with document and page citations. See `README.md` for the spec.

## Working policies

- **Don't make design changes without asking first.** Architecture, abstractions,
  cross-module refactors, new dependencies, public-API shape — propose, then
  apply once confirmed.
- **Three-strikes rule.** If you try a fix and it fails three times, stop. Don't
  keep iterating. Describe what you tried, what failed, and what you suspect, and
  let the user redirect.
- **Typing policy.** Try hard to avoid `Any`, `cast`, and `# type: ignore`.
  Re-annotate, narrow with `assert isinstance(...)`, or fix the underlying type.
  If after a real attempt none of that works, **ask before adding** any of the
  three escape hatches.

## Dev environment

Backend commands run from `backend/` unless noted.

- `cp .env.example .env` — from the repo root; Docker Compose variables (Postgres password).
- `cp .env.example .env` — app settings (`DATABASE_URL`, `TEST_DATABASE_URL`); keep the
  password in sync with the root `.env`.
- `docker compose up -d db` — from the repo root; Postgres 18 + pgvector on `localhost:5432`.
- `uv sync` — install dependencies.
- `uv run uvicorn common.main:app --reload` — dev server.
- `uv run alembic upgrade head` — apply migrations.
- `uv run alembic revision --autogenerate -m "..."` — create a migration.
- `uv run ruff check --fix && uv run ruff format` — lint and format.
- `uv run mypy .` — type check.

## Code style

- **Comments only when non-obvious** — well-named identifiers do the work.
  Comment to record what a maintainer can't derive from the code: an invariant, a
  gotcha, why not the obvious approach. Not to restate the code or justify a
  change. Six rules that keep this honest:
  - **Two lines, hard cap.** Longer belongs in the commit message, or in a
    module/class docstring if every reader of the file needs it.
  - **Nothing already said nearby.** If the identifier name, the test name, the
    docstring, or an adjacent error/assertion message already says it, drop the
    comment — or rename so it does, and still drop the comment.
  - **Tests rarely need comments.** The test name is the sentence; reaching for a
    comment usually means the name is too vague.
  - **Rationale goes in the commit message.** A comment serves the next reader of
    that line, not the reviewer of the change.
  - **Document what's there, never the diff.** Documentation of how code was removed
    or changed to fix a bug or add a feature is not useful and difficult to maintain.
  - **Documentation should live close to the source as possible.**
    The archetype worth keeping: one line on a statement that looks removable but
    isn't, saying what breaks if you remove it.
- **Keep Code Simple**
  - Avoid creating separate functions for trivial operations that are used only once.
  - If an operation can be expressed clearly in 1–2 lines, prefer inline code over a dedicated function.
  - Do not introduce unnecessary abstractions or wrappers for simple transformations.
  - Extract logic into a function only when it is reused, sufficiently complex, or improves readability.
