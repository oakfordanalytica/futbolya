# Guía global de implementación — Futbolya

Este archivo aplica a todo el repositorio. Es la fuente global de instrucciones para agentes y colaboradores que implementen, refactoricen, revisen o depuren código.

## 1. Producto vigente

Futbolya es una plataforma de gestión de fútbol para ligas/federaciones y sus clubes. Soporta dos espacios de trabajo:

- organización: equipos, roster global, partidos, temporadas, configuración y estadísticas;
- club: plantilla, staff, partidos y estadísticas del equipo.

El stack vigente se determina desde `package.json` y `pnpm-lock.yaml`. Actualmente es:

- Next.js 16 App Router y React 19;
- Convex como backend reactivo, base de datos y storage;
- Clerk para identidad, organizaciones, invitaciones y JWT de Convex;
- `next-intl` para español e inglés;
- Tailwind CSS 4, shadcn/Radix y componentes locales;
- TypeScript estricto y pnpm.

No confundir este producto con CPM Studio, Flexidual, plataformas académicas ni las aplicaciones guardadas como ejemplos.

El modo operativo vigente es **single-tenant** porque las Organizations de Clerk requieren un plan de pago. El código conserva una estructura compatible con un futuro multi-tenant, pero no se debe invertir en habilitarlo, completarlo ni optimizarlo salvo petición explícita. Sí se mantienen fronteras correctas de organización/club y validaciones de ownership para no acoplar el dominio a decisiones inseguras.

## 2. Contexto obligatorio antes de implementar

Para toda implementación, modificación, refactor, corrección, revisión o depuración:

1. Leer este archivo.
2. Activar la skill `.agents/skills/futbolya-project-guidelines/SKILL.md`.
3. Leer sólo las referencias de esa skill pertinentes a la tarea.
4. Activar además las skills tecnológicas indicadas en la matriz de este archivo.
5. Inspeccionar el código, configuración y tipos vigentes antes de proponer cambios.
6. Para APIs sensibles a versión, comprobar la documentación oficial compatible con las versiones instaladas; no implementar de memoria.

Una skill es un procedimiento, no una fuente normativa de arquitectura. Sus referencias son snapshots derivados y fechados. Si una regla genérica contradice este archivo, el schema, la configuración o el stack vigente, se adapta o se descarta.

## 3. Jerarquía de fuentes

### Decisiones del proyecto

1. Instrucciones explícitas del usuario y del runtime.
2. Este `AGENTS.md`.
3. Código, schema, configuración y tests vigentes.
4. ADRs aceptados, si se incorporan en el futuro.
5. Skills locales como procedimientos de trabajo.
6. Notas, planes, snapshots y auditorías históricas.
7. Repositorios bajo `.agents/examples/`.

### APIs y comportamiento de librerías

1. Documentación oficial correspondiente a la versión instalada.
2. Tipos y código de la dependencia instalada.
3. Skills locales actualizadas.
4. Snapshots locales de documentación.
5. Memoria del agente o código de ejemplo externo.

El código vigente define el comportamiento actual, pero no convierte un bug o deuda conocida en patrón recomendado.

## 4. Límites arquitectónicos

- `app/`: rutas, layouts, metadata, carga inicial y composición. Mantener páginas y layouts delgados y server-first.
- `components/ui/`: primitives y piezas transversales ya consolidadas. Reutilizar antes de crear otra primitive; los composites específicos permanecen en su feature.
- `components/layouts/`: shells y composición estructural.
- `components/sections/shell/` y `components/sections/team/`: UI de producto por workspace/feature.
- `components/table/`: abstracciones compartidas de tablas, incluido `DataTable`.
- `components/providers/`, `components/patterns/`, `components/skeletons/`: integración global, patrones compartidos y estados de carga.
- `hooks/`: comportamiento React reutilizable que necesita hooks.
- `lib/`: dominio puro, auth, tenancy, navegación y utilidades compartidas. El código importado desde Convex debe ser compatible con su runtime.
- `convex/`: schema, funciones públicas/internas, autorización, webhooks y persistencia.
- `i18n/` y `messages/`: routing localizado y catálogos.

No mover lógica de negocio a páginas, route handlers, componentes visuales ni callbacks duplicados. Las invariantes deben vivir cerca del dominio y ejecutarse en backend cuando protegen datos.

## 5. Flujo de datos preferido

Para datos internos de producto:

1. una Server Component obtiene el token Clerk para Convex;
2. usa `preloadQuery` o `fetchQuery` cuando necesita datos iniciales;
3. un Client Component consume `usePreloadedQuery` y mantiene reactividad con Convex;
4. las escrituras usan mutations de Convex;
5. Convex revalida identidad, tenant, ownership e invariantes.

No introducir por defecto Route Handlers, REST, SWR, React Query ni una segunda caché entre React y Convex. Úselos sólo para integraciones HTTP reales o una necesidad demostrada.

## 6. Seguridad, tenancy y autorización

- Single-tenant es el único modo operativo actual; multi-tenant es compatibilidad futura, no prioridad de producto.
- El proxy y los layouts protegen navegación; nunca son la frontera final de datos.
- Toda función Convex pública debe declarar una política explícita: autenticada/autorizada o deliberadamente pública.
- Toda entrada es no confiable, incluidos IDs, slugs, metadata de Clerk, route params y storage IDs.
- Resolver y comprobar siempre la cadena de pertenencia: organización → club → categoría/jugador/staff/partido.
- Las entidades subordinadas se resuelven con contexto de tenant. No asumir que un slug de club es globalmente único.
- Clerk es el proveedor de identidad vigente. Convex aplica autorización de datos con el espejo local y helpers centrales.
- No cambiar proveedor de auth, modelo de tenancy o roles sin una petición y plan de migración explícitos.
- Toda ruta administrativa debe comprobar acceso en servidor y toda operación debe volver a comprobarlo en Convex.
- Webhooks e integraciones deben verificar firma, ser idempotentes cuando corresponda y devolver errores reintentables ante fallos transitorios.
- Uploads requieren autenticación, autorización, validación de tipo/tamaño y asociación al tenant o entidad correspondiente.

## 7. Next.js, React y Convex

- Server Components por defecto; agregar `"use client"` sólo en la frontera interactiva necesaria.
- En Next.js 16, tratar `params`, `searchParams`, `cookies()` y `headers()` como APIs async según documentación.
- Paralelizar lecturas independientes con `Promise.all`; evitar waterfalls y serialización innecesaria hacia el cliente.
- Convex es reactivo: usar índices alineados con consultas, resultados acotados y paginación cuando una colección pueda crecer.
- Las mutations contienen transacciones e invariantes; las actions se reservan para I/O externo o runtime Node.
- Usar funciones `internal*` para operaciones que no deban estar en la API pública.
- Añadir validators de argumentos y retorno en funciones Convex nuevas o modificadas.
- Cache Components no está habilitado actualmente. No usar `use cache`, `cacheLife` o `cacheTag` salvo que la tarea habilite y diseñe esa capacidad, con aislamiento correcto por usuario/tenant.

## 8. UI, accesibilidad e internacionalización

- Respetar el lenguaje visual y los componentes existentes antes de rediseñar.
- Usar `components.json`, aliases locales y componentes ya instalados; no sobrescribir componentes shadcn modificados sin revisar diff. Los registries personalizados son fuentes externas de código y requieren HTTPS, revisión y aprobación explícita.
- Preferir tokens semánticos de Tailwind y variantes existentes sobre colores o estilos aislados.
- Mantener accesibilidad: nombres accesibles, labels, foco, teclado, títulos de dialogs y estados de error.
- Todo texto visible, toast, placeholder, `aria-label` y metadata traducible debe pasar por `next-intl`.
- Mantener paridad entre `messages/es` y `messages/en`.
- Usar `@/i18n/navigation` para `Link`, router/pathname y navegación visible que deba preservar o cambiar locale. Usar `next/navigation` para control de flujo (`redirect`, `notFound`) y APIs sin wrapper localizado.
- Formatear fechas, horas y números con el locale activo; no fijar nombres de mes ingleses.

## 9. DRY y separación de responsabilidades

- Una sola fuente de verdad por regla de dominio, permiso, ruta, estado o transformación.
- No copiar validaciones entre formulario y backend como si ambas fueran autoridad: la UI ayuda; el backend decide.
- Extraer una abstracción sólo cuando existe repetición real o una frontera de dominio clara. Evitar helpers, tipos y exports especulativos.
- No aplicar DRY entre conceptos que sólo se parecen visualmente pero cambian por razones distintas.
- Separar componentes interactivos grandes en controller hook, helpers puros, tipos y subcomponentes cuando eso reduce responsabilidades; no fragmentar por un límite arbitrario de líneas.
- Preferir composición y funciones pequeñas a props booleanas crecientes o componentes monolíticos.
- Reutilizar patrones consolidados como `DataTable`, builders de rutas y helpers centrales de permisos.
- Eliminar código muerto sólo cuando se haya verificado que no tiene consumidores y esté dentro del alcance solicitado.

## 10. Matriz de skills

| Trabajo | Skill que se debe consultar | Regla de adaptación |
|---|---|---|
| Cualquier implementación, modificación, revisión o depuración | `futbolya-project-guidelines` | Obligatoria; aplica el workflow y carga snapshots pertinentes |
| Next.js/App Router | `next-best-practices` | Convex sigue siendo la ruta principal para datos internos |
| React/Next performance | `vercel-react-best-practices` | No introducir SWR sobre suscripciones Convex |
| Composición de componentes | `vercel-composition-patterns` | Aplicar cuando resuelve complejidad real, no preventivamente |
| shadcn/Radix/UI | `shadcn` | Código y design system local tienen prioridad; revisar antes de sobrescribir |
| Diseño visual nuevo | `frontend-design` | En producto existente, evolución coherente antes que rediseño total |
| Auditoría UI/a11y | `web-design-guidelines` | Verificar reglas vigentes y respetar componentes locales |
| Convex general | `convex` | Router; después usar la skill específica si existe |
| Auth Clerk + Convex | `convex-setup-auth` | Preservar Clerk y autorización backend actuales |
| Migración de schema/datos | `convex-migration-helper` | Widen → migrate/backfill → narrow |
| Rendimiento Convex | `convex-performance-audit` | Medir lecturas, suscripciones, índices y contención |
| Convex Component reutilizable | `convex-create-component` | No usar para lógica ordinaria del monolito |
| Cache Components | `next-cache-components` | Sólo si se habilita explícitamente en `next.config.ts` |
| Diagnóstico final React | `react-doctor` | No ejecutar código remoto mutable sin revisar necesidad/permiso |
| Deploy | `deploy-to-vercel` | Sólo por solicitud explícita; nunca commit/push/staging indiscriminado |
| Diagramas o documentación | skill específica correspondiente | Documentar el sistema real, no los ejemplos externos |

## 11. Definición de terminado

Antes de dar una implementación por terminada, revisar según aplique:

- autorización y aislamiento de tenant en backend;
- validators e índices Convex;
- estados loading, empty, error y not-found;
- mensajes `es`/`en` y formatos localizados;
- accesibilidad y responsive;
- rutas centralizadas y navegación localizada;
- ausencia de nueva duplicación o abstracción sin consumidor;
- impacto sobre datos existentes y necesidad de migración;
- pruebas o validación específica de la superficie cambiada.

Usar `pnpm exec tsc --noEmit --incremental false` como comprobación base de tipos. Ejecutar `pnpm build` sólo cuando el entorno requerido esté disponible. No afirmar que lint pasó: el script actual usa `next lint`, retirado en Next 16, y la configuración tiene una incompatibilidad de versiones pendiente. No corregir esa deuda salvo que entre en el alcance.

## 12. Material no autoritativo

- `.agents/examples/**` contiene repositorios externos de referencia. Nunca define arquitectura, schema, auth, convenciones ni versiones de Futbolya.
- Los markdown históricos en la raíz de `.agents/` describen CPM Studio/Flexidual y no deben guiar implementaciones de Futbolya.
- `.agents/instructions/**` contiene snapshots documentales pasivos; no sustituye la documentación oficial ni se aplica automáticamente.
- `.agents/skills/database-design-guidelines/` no es una skill activa porque no tiene `SKILL.md`.
- `.github/instructions/*.instructions.md` son adaptadores hacia este archivo; no deben mantener arquitecturas o roles duplicados.
- `.github/instructions/internationalization/` también contiene snapshots pasivos, no reglas canónicas.

El índice y estado de estos materiales está en `.agents/README.md`.
