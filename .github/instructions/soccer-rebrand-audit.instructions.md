# Soccer Rebrand Audit

## Goal
Convert this repo from a basketball-oriented fork into a soccer-oriented codebase without changing the deep domain model yet.

## Immediate steps
1. Set `soccer` as the active sport in layouts, pages, defaults, and public API handlers.
2. Rename active folders, imports, and public function names so the product surface no longer references `basketball`.
3. Move active shared helpers off `lib/sports/basketball/*` into `lib/sports/soccer/*`.
4. Keep the current stats/game-entry model working, but document it as inherited basketball logic to be replaced later.
5. Remove dead references, comments, metadata, and copy that still mention basketball.

## Current deferred areas
These areas are expected to change later when the soccer domain is modeled properly:
- `convex/schema.ts` -> `gamePlayerStats` still represents basketball-style box score stats.
- `convex/games.ts` and game detail/entry UIs still assume basketball stat fields.
- `components/sections/shell/players/player-detail/player-demo-page.tsx` still uses demo data shaped like basketball stats.
- Stats-related labels and tables will need a soccer-specific redesign.
- `messages/*/applications.json` and `messages/*/preadmission.json` still keep legacy i18n keys containing `basketball`; only their visible values were updated in this phase.

## Rules for this phase
- Do not introduce multi-sport abstractions that no longer serve this repo.
- Prefer direct `soccer` defaults over `basketball | soccer` branching when changing active product behavior.
- Keep changes type-safe and avoid speculative schema redesigns.
