# Agent Guide: Backend

FastAPI + SQLModel service (Python 3.14, `uv` project). Alembic migrations live
in `migrations/`. See the root `AGENTS.md` for the dev environment, and don't
make schema/design changes without asking first.

## Layout

- `common/` — app wiring (`main.py`), DB engine/session (`db.py`), settings.
- `documents/` — document upload feature (`models.py`, `api.py`).
- `migrations/` — Alembic environment and revisions.

## Tooling & tests

- Tool config lives in `pyproject.toml`; `alembic.ini` stays separate.
- Run tests with `uv run pytest`.
