---
applyTo: "convex/**/*.ts,convex/**/*.tsx"
---

# Convex en Futbolya

Antes de modificar Convex:

1. seguir [`../../AGENTS.md`](../../AGENTS.md), especialmente seguridad, tenancy y flujo de datos;
2. activar `futbolya-project-guidelines`;
3. activar `convex` y la skill Convex específica que corresponda;
4. contrastar APIs sensibles a versión con la documentación oficial y la versión instalada;
5. inspeccionar `convex/schema.ts`, `convex/lib/permissions.ts` y los helpers de dominio afectados.

Clerk sigue siendo el proveedor de identidad y Convex es la frontera final de autorización de datos. No tratar queries públicas, metadata, IDs, slugs, webhooks o uploads como confiables por defecto.

Este archivo es un adaptador, no una copia de las reglas de Convex. La política completa y su precedencia viven en `AGENTS.md`.
