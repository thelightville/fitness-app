# Contributing to Fitness App

## Getting Started

1. Fork and clone the repository.
2. Copy `.env.example` to `.env` and fill in values.
3. Run `npm install`.
4. Run `npx prisma migrate dev` to set up the database.
5. Run `npm run db:seed` to create sample data.
6. Run `npm run dev` to start the development server.

## Branching

- Create feature branches from `main`.
- Use prefixes: `feature/`, `fix/`, `docs/`, `chore/`.
- Example: `feature/appointment-reminders`.

## Commits

Follow conventional commits:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `chore:` maintenance
- `refactor:` code restructuring

## Pull Requests

- Keep changes focused and small.
- Update tests and documentation.
- Ensure `npm run lint` and `npm run typecheck` pass.
- Request review before merging.

## Code Style

- Use TypeScript strictly.
- Prefer server components unless client interactivity is needed.
- Use `src/lib/db.ts` for all database access.
- Validate all inputs with Zod.
- Never commit secrets or `.env` files.
