---
applyTo: "**/lib/auth/**,**/lib/tenancy/**,**/convex/lib/permissions.ts,**/convex/auth.config.ts,**/proxy.ts"
---

# Auth, roles y tenancy de Futbolya

La fuente normativa es [`../../AGENTS.md`](../../AGENTS.md) y el estado factual se verifica en el schema, `convex/lib/permissions.ts`, `lib/auth/`, `lib/tenancy/` y `proxy.ts`.

Reglas de contexto:

- Clerk autentica, administra organizaciones/invitaciones y emite el JWT de Convex.
- Convex sincroniza identidad y vuelve a autorizar cada acceso a datos.
- Los roles vigentes son los definidos por el código y el schema actuales; no introducir roles de otros productos como `accountant` ni permisos de pagos/ofertas.
- El proxy y los layouts protegen navegación, no sustituyen autorización backend.
- Todo ID, slug, claim o metadata debe validarse contra el tenant y ownership real.

Para cambios de auth activar `futbolya-project-guidelines` y `convex-setup-auth`. No cambiar Clerk, la estrategia de tenancy ni la matriz de roles sin una solicitud y migración explícitas.
