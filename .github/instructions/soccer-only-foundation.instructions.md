# Soccer-Only Foundation

## Goal
Remove multi-sport infrastructure that no longer adds value in this repository, so player and stats redesign can happen on a simpler base.

## Steps
1. Remove the sport provider/context layer and replace it with a direct soccer terminology hook.
2. Stop passing `sportType` through layouts and client components.
3. Remove unused sport registry/config files that only existed for the old basketball fork.
4. Keep persistence changes minimal in this phase: simplify app logic first, then revisit `sportType` fields when the player model is redesigned.
5. After the foundation is simplified, redesign player fields.
6. Only then redesign soccer statistics and match analytics.

## Scope guard
- Do not redesign the stat schema in this phase.
- Do not rename i18n keys unless all consumers are updated safely.
- Prefer deleting dead abstractions over wrapping them with more indirection.
