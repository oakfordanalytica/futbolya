# Arquitectura vigente de Futbolya

Última revisión: 2026-08-16. Contrastar siempre con el código vigente.

## 1. Qué resuelve la aplicación

Futbolya gestiona la operación deportiva de una liga o federación y sus clubes:

```text
Organización / liga
├── configuración deportiva
│   ├── temporadas
│   ├── categorías de edad
│   ├── géneros
│   ├── divisiones
│   ├── posiciones
│   └── formaciones
├── clubes
│   ├── categorías materializadas
│   ├── jugadores
│   └── staff
└── partidos
    ├── alineaciones
    ├── eventos
    ├── marcador y fases
    └── estadísticas de equipo y jugador
```

Los perfiles operativos son:

- superadmin global;
- admin/superadmin de organización;
- coach/staff asignado a uno o más clubes.

`member` de Clerk se normaliza actualmente como acceso tipo coach en partes del sistema. No ampliar esa interpretación sin revisar el flujo completo.

## 2. Espacios de trabajo y rutas

El locale español no lleva prefijo; inglés usa `/en`. La configuración canónica está en `i18n/routing.ts`.

### Auth

- `/sign-in`, `/sign-up`, `/organizations`;
- `/{tenant}/sign-in`, `/{tenant}/sign-up`, `/{tenant}/auth-complete`, `/{tenant}/organizations`.

### Organización

- `/{tenant}/teams` y detalle/configuración de club;
- `/{tenant}/roster`;
- `/{tenant}/games` y game center;
- `/{tenant}/stats`;
- `/{tenant}/settings` y configuración deportiva.

`app/[locale]/[tenant]/(shell)/layout.tsx` sincroniza usuario, resuelve acceso y dirige coaches a su workspace de equipo.

### Equipo

- `/{tenant}/{team}`;
- roster y detalle de jugador;
- staff;
- partidos y detalle;
- estadísticas;
- categories, que actualmente redirige al roster;
- settings.

`app/[locale]/[tenant]/(team)/[team]/layout.tsx` limita coaches a clubes derivados de sus asignaciones.

### Superadmin

Existe `app/[locale]/admin/`, pero `proxy.ts` redirige actualmente todas las rutas `/admin`. Tratarlo como superficie deshabilitada hasta que una tarea decida restaurarla con autorización o eliminarla.

## 3. Composición y flujo de datos

`app/[locale]/layout.tsx` compone:

- Clerk;
- Convex;
- next-intl;
- tema/color;
- toasts.

Patrón principal:

```text
Server Page/Layout
  ├── auth y tenant access
  ├── token Clerk "convex"
  ├── preloadQuery/fetchQuery
  └── Client Feature Component
      ├── usePreloadedQuery/useQuery
      ├── useMutation/useAction
      └── UI reactiva
```

Usar SSR/preload para la primera carga y Convex client hooks para reactividad o carga diferida. Paralelizar lecturas independientes.

Route Handlers productivos se reservan hoy para integraciones Clerk:

- `/api/auth/tenant-landing`;
- `/api/organizations/[tenant]/invitations`;
- `/api/staff/invite`.

No crear endpoints HTTP que sólo envuelvan una query/mutation Convex.

## 4. Auth y tenancy

### Clerk

- autentica usuarios;
- gestiona organizaciones e invitaciones;
- emite el JWT de plantilla `convex`;
- entrega webhooks verificados con Svix.

### Convex

- valida el issuer en `convex/auth.config.ts`;
- sincroniza `users`, `organizations` y `organizationMembers`;
- aplica permisos en `convex/lib/permissions.ts` y helpers de dominio;
- persiste asignaciones `staff` por club.

### Modo operativo

Producción opera en **single-tenant**. Las Organizations multi-tenant de Clerk no se habilitarán por ahora debido a su coste. El código mantiene una ruta multi-tenant futura, pero no forma parte del roadmap inmediato.

Las fuentes de configuración están en:

- `lib/tenancy/config.ts` para Next/frontend;
- `convex/lib/tenancy.ts` para backend.

No invertir en completar o refactorizar el modo multi-tenant salvo petición explícita. Al tocar auth o datos, conservar ownership organización → club para evitar acoplar el dominio al singleton y mantener una migración futura posible.

Actualmente existe una prioridad distinta entre `TENANCY_MODE` y `NEXT_PUBLIC_TENANCY_MODE` en ambos lados. Es deuda de baja prioridad mientras producción configure sólo single-tenant; no copiarla en configuración nueva.

## 5. Backend y modelo de datos

La fuente canónica es `convex/schema.ts`.

### Identidad

- `users`;
- `organizations`;
- `organizationMembers`.

### Estructura deportiva

- `clubs`;
- `categories`;
- `players`;
- `staff`;
- `conferences`;
- `leagueSettings`.

### Partidos

- `games`;
- `gameLineups`;
- `gameEvents`;
- `gameTeamStats`;
- `gamePlayerStats`.

Las fachadas públicas viven en `convex/*.ts`; lógica de dominio y handlers reutilizados viven en `convex/lib/<domain>/`. Funciones puras compartidas pueden vivir en `lib/` si son compatibles con Next y Convex.

## 6. Invariantes que toda feature debe preservar

- Un club pertenece a una organización.
- Categorías, jugadores y staff pertenecen a un club.
- Ambos clubes de un partido pertenecen a la organización del partido.
- Una alineación sólo contiene jugadores del club participante y no repite titulares/suplentes.
- Un coach sólo opera clubes con una asignación vigente; admin opera dentro de su organización; superadmin es global.
- IDs y slugs recibidos del cliente no prueban pertenencia.
- Los cambios de partido, eventos, marcador y estadísticas deben conservar consistencia transaccional.
- Los settings embebidos requieren IDs estables y validaciones equivalentes en todas sus rutas de escritura.
- Borrados deben elegir de forma explícita entre restrict, cascade, soft delete o snapshot histórico.

## 7. Riesgos arquitectónicos que requieren inspección

Este snapshot no es un ledger de bugs. Al tocar estas fronteras, inspeccionar el código vigente y no asumir que los patrones actuales ya son seguros:

- política de acceso de toda función Convex pública y de Storage;
- resolución tenant-aware de slugs subordinados;
- consistencia entre membership, asignaciones staff y estado activo del usuario;
- única autoridad para estados, eventos, marcador y agregados de partido;
- idempotencia/reintentos de webhooks e invitaciones;
- límites, paginación e índices de queries y cascadas.

Corregir causas dentro del alcance y añadir regresión cuando exista infraestructura de tests; no convertir esta lista fechada en backlog permanente.

## 8. Organización frontend

- `components/ui/`: primitives y piezas transversales ya consolidadas, incluidas algunas deportivas.
- `components/layouts/`: shells responsive.
- `components/sections/shell/`: features del workspace de organización.
- `components/sections/team/`: features del workspace de club.
- `components/table/`: `DataTable` y piezas de filtrado/paginación compartidas.
- `components/providers/`: integración global.
- `components/patterns/`: patrones visuales compartidos.
- `components/skeletons/`: estados de carga reutilizables.
- `lib/navigation/routes.ts`: builders de rutas.
- `lib/navigation/config.ts`: navegación visible.
- `lib/auth/`: SSR y resolución de acceso.
- `lib/games/`, `lib/soccer/`, `lib/players/`: dominio puro.

`DataTable` es el patrón consolidado para listas administrativas. Los flujos nuevos complejos usan controller hook + helpers + tipos + subcomponentes; preferir esa separación cuando un componente acumula estado, efectos y dominio.

`lib/navigation/routes.ts` conserva builders de funcionalidades no implementadas. Reutilizar sólo rutas respaldadas por el árbol `app/`; no tratar el archivo entero como catálogo de producto activo.

## 9. Internacionalización y presentación

- Locales: `es`, `en`.
- Routing: `i18n/routing.ts`.
- Navegación: `i18n/navigation.ts`.
- Carga de catálogos: `i18n/request.ts`.
- Mensajes activos: `common`, `navigation`, `settings`, `forms`, `admin`, `sports`.

`applications.json` y `preadmission.json` existen pero no se cargan porque esas features no están activas. No reintroducirlas sin implementar la capacidad correspondiente.

El sistema visual combina shadcn/Radix para primitives y formularios con Catalyst/Headless UI en shells. Mantener esa frontera o simplificarla deliberadamente; no añadir una tercera familia para resolver una primitive ya existente.

El tema está fijado actualmente a dark/`clean-slate` aunque existe infraestructura de themes. No presentar esa infraestructura como capacidad activa sin habilitar el flujo completo.
