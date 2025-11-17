```
futbolya
├─ .cursor
│  └─ rules
│     ├─ clerk_rules.mdc
│     └─ convex_rules.mdc
├─ .prettierrc
├─ app
│  ├─ (auth)
│  │  ├─ layout.tsx
│  │  ├─ sign-in
│  │  │  └─ [[...rest]]
│  │  │     └─ page.tsx
│  │  └─ [org]
│  │     └─ sign-up
│  │        └─ page.tsx
│  ├─ (landing)
│  │  ├─ layout.tsx
│  │  ├─ match
│  │  │  └─ [matchId]
│  │  │     └─ page.tsx
│  │  ├─ not-found.tsx
│  │  └─ page.tsx
│  ├─ (shell)
│  │  └─ [org]
│  │     ├─ admin
│  │     │  ├─ page.tsx
│  │     │  └─ settings
│  │     │     ├─ address.tsx
│  │     │     └─ page.tsx
│  │     └─ layout.tsx
│  ├─ globals.css
│  └─ layout.tsx
├─ clerk_rules.mdc
├─ components
│  ├─ app-sidebar.tsx
│  ├─ layouts
│  │  ├─ auth-layout.tsx
│  │  ├─ sidebar-layout.tsx
│  │  ├─ slim-layout.tsx
│  │  └─ stacked-layout.tsx
│  ├─ logo.tsx
│  ├─ providers
│  │  ├─ ConvexClientProvider.tsx
│  │  └─ theme-provider.tsx
│  ├─ sections
│  │  ├─ landing
│  │  │  ├─ Footer.tsx
│  │  │  ├─ landing-navbar.tsx
│  │  │  ├─ NavLink.tsx
│  │  │  ├─ pinned-leagues.tsx
│  │  │  ├─ scoreboard-body.tsx
│  │  │  ├─ scoreboard-competition.tsx
│  │  │  ├─ scoreboard-header.tsx
│  │  │  └─ scoreboard.tsx
│  │  └─ match
│  │     ├─ match-ad.tsx
│  │     ├─ match-event-summary.tsx
│  │     ├─ match-header.tsx
│  │     ├─ match-lineups.tsx
│  │     ├─ match-timeline.tsx
│  │     └─ player-list.tsx
│  ├─ skeletons
│  │  ├─ navbar-item-skeleton.tsx
│  │  ├─ navbar-skeleton.tsx
│  │  ├─ organization-switcher-skeleton.tsx
│  │  ├─ sidebar-item-skeleton.tsx
│  │  ├─ sidebar-skeleton.tsx
│  │  └─ user-button-skeleton.tsx
│  ├─ stat.tsx
│  └─ ui
│     ├─ adds.tsx
│     ├─ alert.tsx
│     ├─ aspect-ratio.tsx
│     ├─ avatar.tsx
│     ├─ badge.tsx
│     ├─ button-group.tsx
│     ├─ button.tsx
│     ├─ calendar.tsx
│     ├─ card.tsx
│     ├─ carousel.tsx
│     ├─ checkbox.tsx
│     ├─ combobox.tsx
│     ├─ command.tsx
│     ├─ container.tsx
│     ├─ description-list.tsx
│     ├─ dialog.tsx
│     ├─ divider.tsx
│     ├─ dropdown-menu.tsx
│     ├─ dropdown.tsx
│     ├─ fieldset.tsx
│     ├─ football-field.tsx
│     ├─ heading.tsx
│     ├─ input.tsx
│     ├─ link.tsx
│     ├─ listbox.tsx
│     ├─ mode-toggle.tsx
│     ├─ navbar.tsx
│     ├─ pagination.tsx
│     ├─ player-chip.tsx
│     ├─ popover.tsx
│     ├─ radio.tsx
│     ├─ select.tsx
│     ├─ separator.tsx
│     ├─ sidebar.tsx
│     ├─ skeleton.tsx
│     ├─ switch.tsx
│     ├─ table.tsx
│     ├─ tabs.tsx
│     ├─ text.tsx
│     ├─ textarea.tsx
│     ├─ tooltip.tsx
│     └─ week-strip.tsx
├─ components.json
├─ convex
│  ├─ admin.ts
│  ├─ auth.config.ts
│  ├─ auth.ts
│  ├─ entrenadores.ts
│  ├─ equipos.ts
│  ├─ escuelas.ts
│  ├─ gruposEntrenamiento.ts
│  ├─ http.ts
│  ├─ jugadores.ts
│  ├─ ligas.ts
│  ├─ partidos.ts
│  ├─ README.md
│  ├─ schema.ts
│  ├─ seed.ts
│  ├─ sesionesYAsistencias.ts
│  ├─ torneos.ts
│  ├─ tsconfig.json
│  ├─ users.ts
│  └─ _generated
│     ├─ api.d.ts
│     ├─ api.js
│     ├─ dataModel.d.ts
│     ├─ server.d.ts
│     └─ server.js
├─ convex_rules.mdc
├─ eslint.config.mjs
├─ hooks
│  ├─ use-scoreboard-filters.ts
│  └─ use-week-carousel.ts
├─ instructions
│  ├─ clerk.instructions.md
│  └─ convex.instructions.md
├─ lib
│  ├─ auth
│  │  ├─ auth.ts
│  │  ├─ index.ts
│  │  └─ types.ts
│  ├─ config
│  │  └─ features.ts
│  ├─ mocks
│  │  ├─ data.ts
│  │  └─ types.ts
│  ├─ navigation
│  │  ├─ config.ts
│  │  ├─ index.ts
│  │  ├─ types.ts
│  │  └─ utils.ts
│  ├─ role-utils.ts
│  ├─ scoreboard
│  │  ├─ config.ts
│  │  ├─ types.ts
│  │  └─ utils.ts
│  ├─ seo
│  │  ├─ landing.ts
│  │  └─ root.ts
│  └─ utils.ts
├─ LICENSE
├─ middleware.ts
├─ next.config.ts
├─ package.json
├─ pnpm-lock.yaml
├─ postcss.config.mjs
├─ public
│  ├─ avatars
│  │  ├─ avatar-1.png
│  │  ├─ avatar-2.png
│  │  ├─ avatar-3.png
│  │  ├─ avatar-4.png
│  │  └─ avatar-5.png
│  ├─ background-auth.jpg
│  ├─ background-call-to-action.jpg
│  ├─ background-faqs.jpg
│  ├─ background-features.jpg
│  ├─ convex.svg
│  ├─ favicon.ico
│  ├─ logos
│  │  ├─ laravel.svg
│  │  ├─ mirage.svg
│  │  ├─ statamic.svg
│  │  ├─ statickit.svg
│  │  ├─ transistor.svg
│  │  └─ tuple.svg
│  └─ screenshots
│     ├─ contacts.png
│     ├─ expenses.png
│     ├─ inventory.png
│     ├─ payroll.png
│     ├─ profit-loss.png
│     ├─ reporting.png
│     └─ vat-returns.png
├─ README.md
└─ tsconfig.json

```