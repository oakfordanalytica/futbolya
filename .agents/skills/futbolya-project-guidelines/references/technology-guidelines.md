# Tecnologías: uso correcto y referencias oficiales

Última revisión: 2026-08-16. Las versiones exactas se toman de `package.json` y `pnpm-lock.yaml`, no de este snapshot.

## Protocolo de consulta

Antes de usar una API nueva, cambiar configuración o resolver una duda sensible a versión:

1. confirmar versión instalada;
2. cargar la skill local correspondiente;
3. consultar documentación oficial de esa versión;
4. contrastar con tipos y patrones locales;
5. aplicar el cambio mínimo compatible;
6. validar sin actualizar dependencias incidentalmente.

No ejecutar CLIs `@latest`, migraciones, generadores o instaladores sólo para consultar información. Si una skill propone código remoto mutable, revisar primero necesidad, diff, versión y permisos.

## Next.js 16 App Router

Skill: `next-best-practices`.

Uso en Futbolya:

- Server Components por defecto en `app/`.
- `params`, `searchParams`, `cookies()` y `headers()` siguen el modelo async de Next 15+.
- Rutas y layouts cargan acceso y datos iniciales; componentes de feature concentran interacción.
- `proxy.ts` integra Clerk y next-intl; no renombrarlo a `middleware.ts` en Next 16.
- Usar `next/image`, metadata y special files de App Router según documentación.
- Route Handlers sólo para HTTP real: webhooks, callbacks o integraciones; no como capa redundante sobre Convex.
- Error/loading/not-found se resuelven en el nivel de ruta apropiado o con estados de feature cuando la suscripción es cliente.
- Empezar promesas pronto y paralelizar dependencias independientes.

Cache Components:

- `next.config.ts` no activa `cacheComponents`.
- No usar la skill `next-cache-components` para cambios ordinarios.
- Si se habilita, diseñar claves y tags sin compartir datos entre tenants/usuarios y revisar interacción con Convex reactivo.

Oficial:

- https://nextjs.org/docs
- https://nextjs.org/docs/app
- https://nextjs.org/docs/app/api-reference/file-conventions/proxy

## React 19

Skills: `vercel-react-best-practices`, `vercel-composition-patterns`.

Uso en Futbolya:

- Mantener la frontera cliente lo más baja posible, no convertir una página completa sólo por una interacción local.
- Derivar estado durante render cuando sea posible; reservar effects para sincronización externa.
- No añadir `useMemo`, `useCallback` o `memo` sin coste medible, identidad requerida o rerender relevante.
- Para UI compleja, preferir composición, providers acotados y componentes enfocados sobre combinaciones crecientes de boolean props.
- No definir componentes dentro de componentes.
- Lazy/dynamic import sólo para dependencias pesadas o rutas de interacción que lo justifiquen.
- Las reglas de SWR no aplican a datos internos cubiertos por Convex.

Oficial:

- https://react.dev/reference/react
- https://react.dev/learn

## Convex

Skills: `convex` como router; `convex-setup-auth`, `convex-migration-helper`, `convex-performance-audit` o `convex-create-component` según la tarea.

Uso en Futbolya:

- Schema en `convex/schema.ts` con validators precisos e índices según consultas reales.
- Sintaxis objeto para `query`, `mutation`, `action` y variantes `internal*`.
- Toda función nueva/modificada declara `args` y `returns`.
- Queries son deterministas y reactivas; no hacen I/O externo.
- Mutations aplican autorización e invariantes dentro de la misma transacción.
- Actions sólo para I/O externo, Clerk u operaciones de runtime Node; no tienen `ctx.db`.
- HTTP actions viven en `convex/http.ts` y deben verificar origen/firma/autorización.
- Usar funciones `internal*` para webhooks, jobs y helpers registrados no invocables por clientes.
- Consultar por índices; evitar `filter` cuando un índice expresa la consulta.
- Evitar `collect()` sin límite sobre conjuntos crecientes. Usar `first`, `take`, paginación o procesamiento por lotes.
- Diseñar índices por orden de campos y casos de acceso. No añadir índices especulativos.
- Minimizar `ctx.run*` dentro de transacciones; extraer helpers TypeScript cuando no se necesita otra transacción.
- Convex Storage no aporta por sí solo ownership o validación de MIME/tamaño.
- Un Convex Component se reserva para estado aislado y reusable; la lógica ordinaria de Futbolya permanece en el backend de la app.

Datos reactivos:

- Server: `preloadQuery`, `fetchQuery`, `fetchAction` con token Clerk.
- Cliente: `usePreloadedQuery`, `useQuery`, `usePaginatedQuery`, `useMutation`, `useAction`.
- No agregar invalidación manual ni otra caché para datos ya reactivos.

Migraciones:

- Cambios incompatibles usan widen → backfill/migrate → narrow.
- Mantener lectores/escritores compatibles durante el despliegue.
- No borrar/renombrar campos con datos existentes en un solo paso.

Oficial:

- https://docs.convex.dev
- https://docs.convex.dev/functions
- https://docs.convex.dev/database
- https://docs.convex.dev/database/reading-data/indexes
- https://docs.convex.dev/auth
- https://docs.convex.dev/production/best-practices
- https://docs.convex.dev/ai

## Clerk

Skill: `convex-setup-auth`, leyendo su referencia específica de Clerk cuando corresponda.

Uso en Futbolya:

- Producción usa Clerk en modo single-tenant; no depender de Organizations ni de capacidades pagas para nuevas features.
- Conservar la estructura multi-tenant existente sólo como compatibilidad futura, sin convertirla en objetivo de implementación.
- `@clerk/nextjs` autentica Next y, en los flujos futuros existentes, expone organizaciones/invitaciones.
- `ConvexProviderWithClerk` obtiene tokens para el cliente Convex.
- SSR usa el token de template `convex`.
- `convex/auth.config.ts` valida el issuer; no confiar en IDs/roles enviados por el cliente.
- Webhooks sincronizan identidad; verificar Svix antes de procesar.
- Los claims ayudan con routing/UX, pero Convex vuelve a comprobar acceso sobre datos propios.
- Metadata pública o insegura es input no confiable hasta validarla contra organización, club y actor.
- Reintentos y eventos repetidos exigen handlers idempotentes.
- Cambios en roles deben reconciliar Clerk, normalización frontend y `organizationMembers`/`staff` en Convex.
- No reemplazar Clerk por Convex Auth u otro proveedor sin migración explícita.

Oficial:

- https://clerk.com/docs/nextjs
- https://clerk.com/docs/organizations/overview
- https://clerk.com/docs/webhooks/overview
- https://clerk.com/docs/integrations/databases/convex

## next-intl

Uso en Futbolya:

- Configuración central en `i18n/routing.ts`, `i18n/navigation.ts` e `i18n/request.ts`.
- Server Components usan APIs server de `next-intl`; Client Components usan hooks sólo en la frontera cliente.
- Navegación visible usa wrappers de `@/i18n/navigation` para conservar locale.
- Cualquier clave nueva se añade en `es` y `en` dentro del namespace correcto.
- No cargar catálogos de features inactivas.
- Fechas, números y horas usan locale activo y zona horaria explícita cuando el dominio lo requiera.
- Metadata debe poder localizarse.

Los archivos `.agents/instructions/internationalization/` son snapshots secundarios, no la fuente principal.

Oficial:

- https://next-intl.dev/docs/getting-started/app-router
- https://next-intl.dev/docs/routing/setup
- https://next-intl.dev/docs/usage/translations

## shadcn, Radix, Tailwind CSS 4 y UI

Skill principal: `shadcn`; para diseño nuevo, `frontend-design`; para revisión, `web-design-guidelines`.

Uso en Futbolya:

- Leer `components.json` antes de añadir o actualizar UI.
- Usar el package manager del proyecto: pnpm.
- Buscar primero en `components/ui/` y en componentes de producto existentes.
- Los componentes shadcn son código local y pueden tener modificaciones; revisar `--dry-run`/`--diff` antes de actualizar y no usar `--overwrite` sin autorización.
- Un registry personalizado en `components.json` es una fuente externa de código, no una aprobación automática. Exigir HTTPS, inspeccionar payload/diff y obtener aprobación antes de instalar.
- No usar `@shadcn-map` mientras su URL permanezca en HTTP sin TLS.
- Usar aliases `@/components`, `@/components/ui`, `@/lib`, `@/hooks`.
- Tailwind 4 se configura desde CSS; no crear `tailwind.config.js` por costumbre.
- Usar tokens semánticos, `cn()` y variantes existentes; evitar colores crudos que rompan tema.
- Dialogs, sheets y drawers requieren título accesible; inputs requieren labels/errores asociados.
- Mantener foco visible, teclado, contraste y targets táctiles.
- `sonner` es el mecanismo de toast instalado.
- Lucide es la librería declarada en `components.json`; Heroicons y otros iconos existentes no justifican introducir otra librería.
- La combinación Catalyst/Headless UI en shells es legado vigente: conservar coherencia local en vez de migrarla incidentalmente.

Oficial:

- https://ui.shadcn.com/docs
- https://www.radix-ui.com/primitives/docs/overview/introduction
- https://tailwindcss.com/docs
- https://headlessui.com/react

## TanStack Table

Uso en Futbolya:

- `components/table/data-table.tsx` es la abstracción local principal.
- Preferir column definitions y capacidades existentes antes de crear otra tabla administrativa.
- Separar paginación de cliente y servidor; para datasets crecientes, la UI no sustituye paginación Convex.
- Mantener IDs/keys estables y estados controlados sólo cuando el flujo lo necesita.

Oficial:

- https://tanstack.com/table/v8/docs/overview

## TypeScript

Uso en Futbolya:

- `strict: true`; no resolver errores con `any`, assertions amplias o `@ts-ignore` sin justificación demostrable.
- Usar `Id<"table">` y `Doc<"table">` para entidades Convex, no strings intercambiables.
- Inferir tipos desde validators/funciones cuando evita duplicación; definir tipos de dominio compartidos donde sí existe una frontera.
- Preferir unions discriminadas para estados y resultados.
- No exportar tipos, constantes o helpers sin consumidor real.
- Código compartido con Convex no puede depender de browser, Next server-only o Node salvo que viva en el runtime correcto.

Oficial:

- https://www.typescriptlang.org/docs/

## pnpm, lint y validación

- Package manager fijado por `package.json`: pnpm 10.25.0.
- No mezclar `npm install`, Yarn o Bun ni generar otro lockfile.
- Base de tipos: `pnpm exec tsc --noEmit --incremental false`.
- Build: `pnpm build`, sujeto a variables de Clerk/Convex y acceso necesario.
- `pnpm lint` no es actualmente válido: usa `next lint`, retirado en Next 16.
- La invocación directa de ESLint también está bloqueada por desalineación entre Next 16, `eslint-config-next` 15.5.4 y plugins requeridos.
- No ocultar este fallo ni afirmar lint exitoso. Repararlo sólo en una tarea explícita o si bloquea el cambio solicitado.
- No hay suite productiva de tests detectada; cuando se introduzca, priorizar dominio puro, permisos, tenancy, máquina de estados, estadísticas y webhooks.

Oficial:

- https://pnpm.io/
- https://eslint.org/docs/latest/
- https://nextjs.org/docs/app/api-reference/config/eslint
