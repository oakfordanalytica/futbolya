# Auditoría de referencia: `flexidual-main`

> **Estado: auditoría histórica de una referencia externa, no normativa.** Describe Flexidual/CPM Studio y no la arquitectura vigente de Futbolya. El repositorio auditado bajo `.agents/examples/` nunca es fuente de schema, auth, tenancy o convenciones actuales. Consultar [`../AGENTS.md`](../AGENTS.md).

Fecha: 2026-04-27
Estado: referencia para diseño e implementación de Flexidual en CPM Studio
Repositorio auditado: `.agents/examples/flexidual-main/`
Documento base comparado: `.agents/flexidual-people-campus-architecture.md`

## Objetivo

Determinar si la app original de Flexidual debe usarse como base, como referencia parcial o descartarse antes de iniciar el desarrollo real del módulo `liveClasses`.

El criterio de evaluación no es si la app vieja funciona. El criterio es si encaja con la arquitectura actual de CPM Studio:

- multitenant por institución;
- campuses como partición operativa;
- Convex Auth;
- `users` separado de `people`;
- capacidades como módulos;
- frontend basado en `app/` como adaptador y presentación reusable en `modules/<module>/presentation`;
- backend modular en `convex/modules/<module>/`.

## Fuentes revisadas

- `.agents/examples/flexidual-main/package.json`
- `.agents/examples/flexidual-main/app/`
- `.agents/examples/flexidual-main/components/`
- `.agents/examples/flexidual-main/convex/`
- `.agents/flexidual-people-campus-architecture.md`
- `convex/_generated/ai/guidelines.md`
- `.agents/skills/next-best-practices/SKILL.md`
- `.agents/skills/vercel-react-best-practices/SKILL.md`
- `.agents/skills/vercel-composition-patterns/SKILL.md`
- `.agents/skills/web-design-guidelines/SKILL.md`
- `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`

## Veredicto ejecutivo

`flexidual-main` sí es útil, pero no como código transplantable.

Debe tratarse como:

- referencia funcional para LiveKit;
- referencia parcial de UX de aula virtual;
- referencia parcial para estados de sesión, waiting room, permisos de entrada y asistencia;
- fuente de casos de uso reales.

No debe tratarse como:

- referencia de schema;
- referencia de autorización;
- referencia de organización frontend;
- referencia de navegación;
- referencia de diseño visual final;
- base para copiar componentes completos.

La razón principal es que `flexidual-main` fue diseñada como app independiente. CPM Studio necesita que Flexidual sea una capacidad dentro de un modular monolith que comparte institución, campuses, personas, roles y capabilities con otros módulos.

## Diferencia de stack

La app original usa:

- Next.js `15.2.8`;
- React `19.0.0`;
- Convex `^1.23.0`;
- Clerk;
- LiveKit;
- rutas `/:locale/:orgSlug/...`;
- middleware Clerk.

CPM Studio usa:

- Next.js `16.1.7`;
- React `19.2.4`;
- Convex `^1.33.1`;
- Convex Auth;
- Vercel Platforms / subdominios por tenant;
- `proxy`/routing propio;
- registry de módulos y capabilities;
- separación `users` / `people` / `organizationPeople`.

CPM Studio todavía no tiene dependencias LiveKit instaladas en `package.json`. Cuando iniciemos la integración real, deben añadirse de forma mínima y explícita, probablemente:

- `@livekit/components-react`;
- `livekit-client`;
- `livekit-server-sdk`.

Conclusión: la integración LiveKit se puede estudiar, pero auth, routing y shell no se deben copiar.

## Hallazgos críticos

### 1. Autorización débil en acciones sensibles de LiveKit

`toggleRecording` solo exige usuario autenticado y deja explícito el comentario de que faltan checks equivalentes a `getToken`.

Referencia:

- `.agents/examples/flexidual-main/convex/livekit.ts:101`
- `.agents/examples/flexidual-main/convex/livekit.ts:108`
- `.agents/examples/flexidual-main/convex/livekit.ts:110`

`forceCleanupEgress` es acción pública, no valida identidad ni rol, lista todos los egresses del proyecto y detiene sesiones activas.

Referencia:

- `.agents/examples/flexidual-main/convex/livekit.ts:183`
- `.agents/examples/flexidual-main/convex/livekit.ts:196`
- `.agents/examples/flexidual-main/convex/livekit.ts:210`

Decisión para CPM Studio:

- `getToken` puede ser referencia de flujo;
- recording y cleanup deben rediseñarse desde cero;
- cualquier acción LiveKit debe verificar capability, organización, campus, sesión y rol efectivo;
- operaciones globales de egress deben ser internas o superadmin-only, nunca acción pública sin scope.

### 2. Mutations operativas sin autorización suficiente

`markLive` actualiza estado de una sesión solo con `roomName` e `isLive`. No deriva usuario, no valida teacher/admin, no valida tenant ni campus.

Referencia:

- `.agents/examples/flexidual-main/convex/schedule.ts:1054`
- `.agents/examples/flexidual-main/convex/schedule.ts:1056`
- `.agents/examples/flexidual-main/convex/schedule.ts:1069`

`logStudentPresence` deriva usuario, pero no revalida que el usuario esté autorizado o inscrito en la sesión antes de insertar presencia.

Referencia:

- `.agents/examples/flexidual-main/convex/schedule.ts:1073`
- `.agents/examples/flexidual-main/convex/schedule.ts:1076`
- `.agents/examples/flexidual-main/convex/schedule.ts:1082`

Decisión para CPM Studio:

- estado live y asistencia deben pasar por helpers de authz del módulo;
- no aceptar `roomName` como único identificador operativo para writes;
- usar `sessionId` + organización/campus derivables y verificados;
- el token path y el attendance path deben compartir la misma lógica de autorización.

### 3. Modelo de datos no compatible con nuestro core

La tabla `classes` embebe estudiantes en `students: v.array(v.id("users"))`.

Referencia:

- `.agents/examples/flexidual-main/convex/schema.ts:120`
- `.agents/examples/flexidual-main/convex/schema.ts:129`

Esto contradice las reglas actuales de Convex y nuestro diseño:

- no guardar listas grandes embebidas;
- no usar `users` como persona de dominio;
- no meter enrollment dentro de un documento de clase;
- no reescribir todo el documento cada vez que entra o sale un estudiante.

Decisión para CPM Studio:

- usar `liveClassParticipants` como tabla join;
- referenciar `organizationPersonId`, no `userId`;
- `users` solo participa cuando hay cuenta autenticada vinculada a la persona.

### 4. Roles y tenancy están acoplados a Clerk y strings

`roleAssignments.orgId` es `v.optional(v.string())`, aunque representa IDs de `schools` o `campuses`.

Referencia:

- `.agents/examples/flexidual-main/convex/schema.ts:295`
- `.agents/examples/flexidual-main/convex/schema.ts:299`
- `.agents/examples/flexidual-main/convex/schema.ts:320`

Además, `assignRole` comenta que solo superadmins/admins pueden asignar roles, pero la mutation solo valida que exista identidad autenticada.

Referencia:

- `.agents/examples/flexidual-main/convex/roleAssignments.ts:155`
- `.agents/examples/flexidual-main/convex/roleAssignments.ts:166`
- `.agents/examples/flexidual-main/convex/roleAssignments.ts:167`

Decisión para CPM Studio:

- no copiar `roleAssignments`;
- conservar `organizationMemberships` para acceso administrativo;
- conservar `organizationPersonRoles` para roles de dominio;
- crear roles específicos del módulo solo cuando tengan semántica propia.

## Hallazgos importantes de Convex

### 1. Uso extensivo de `.collect()` y `.filter()`

El backend original tiene muchas consultas que cargan colecciones completas y filtran en JS.

Ejemplos:

- `.agents/examples/flexidual-main/convex/permissions.ts:13`
- `.agents/examples/flexidual-main/convex/permissions.ts:16`
- `.agents/examples/flexidual-main/convex/permissions.ts:142`
- `.agents/examples/flexidual-main/convex/classes.ts:212`
- `.agents/examples/flexidual-main/convex/student.ts:10`
- `.agents/examples/flexidual-main/convex/student.ts:15`
- `.agents/examples/flexidual-main/convex/schedule.ts:153`
- `.agents/examples/flexidual-main/convex/schedule.ts:155`

Esto no significa que toda consulta pequeña sea fatal, pero para nuestro módulo nuevo no conviene arrancar con un patrón que ya sabemos que escala mal.

Decisión para CPM Studio:

- cada query pública de `liveClasses` debe tener scope por `organizationId`;
- campus-scoped queries deben indexar por `organizationId` + `campusId`;
- listados deben usar `take(n)` o pagination;
- `.filter()` de Convex no debe ser el mecanismo normal de autorización o búsqueda.

### 2. Tipos débiles y `any`

Hay uso de `ctx: any`, `v.any()` y casts manuales en paths centrales.

Referencias:

- `.agents/examples/flexidual-main/convex/schedule.ts:22`
- `.agents/examples/flexidual-main/convex/users.ts:16`
- `.agents/examples/flexidual-main/convex/users.ts:17`
- `.agents/examples/flexidual-main/convex/users.ts:250`
- `.agents/examples/flexidual-main/convex/users.ts:301`

Decisión para CPM Studio:

- no usar `any` para contextos Convex;
- no usar `v.any()` en payloads de módulo;
- los validators deben ser explícitos y vivir cerca del módulo o en `convex/lib/validators.ts` si son transversales reales.

### 3. Cron API vieja

`flexidual-main` usa `crons.hourly(...)`.

Referencia:

- `.agents/examples/flexidual-main/convex/cron.ts:6`
- `.agents/examples/flexidual-main/convex/cron.ts:7`

La guía Convex local actual indica usar `crons.interval` o `crons.cron`.

Decisión para CPM Studio:

- cualquier cleanup de sesiones debe ser `crons.interval(...)` o `crons.cron(...)`;
- el cleanup debe ser interno y bounded.

## Hallazgos importantes de frontend y UX

### 1. Componentes demasiado grandes y con responsabilidades mezcladas

Archivos más problemáticos:

- `.agents/examples/flexidual-main/components/classroom/active-classroom-ui.tsx`: 1259 líneas.
- `.agents/examples/flexidual-main/components/classroom/student-classroom-ui.tsx`: 917 líneas.
- `.agents/examples/flexidual-main/components/admin/users/user-dialog.tsx`: 848 líneas.
- `.agents/examples/flexidual-main/components/calendar/dialog/calendar-manage-event-dialog.tsx`: 846 líneas.
- `.agents/examples/flexidual-main/components/teaching/classes/manage-schedule-dialog.tsx`: 679 líneas.

`ActiveClassroomUI` concentra LiveKit participants, controles, recording, hand raise, whiteboard, layout responsive, PIP, teacher/student stage, scroll state y UI.

Referencia:

- `.agents/examples/flexidual-main/components/classroom/active-classroom-ui.tsx:307`
- `.agents/examples/flexidual-main/components/classroom/active-classroom-ui.tsx:324`
- `.agents/examples/flexidual-main/components/classroom/active-classroom-ui.tsx:338`
- `.agents/examples/flexidual-main/components/classroom/active-classroom-ui.tsx:1244`

Decisión para CPM Studio:

- no copiar estos componentes completos;
- extraer conceptos en componentes pequeños;
- separar provider/hook de room state, controls, participant grid, stage, attendance hooks y recording controls;
- evitar que una pantalla sea simultáneamente state manager, LiveKit adapter y layout visual.

### 2. Duplicación entre teacher UI y student UI

`active-classroom-ui.tsx` y `student-classroom-ui.tsx` duplican helpers y componentes:

- `getRole`;
- `getImageUrl`;
- `CustomMediaToggle`;
- `ParticipantTile`;
- `DraggablePip`;
- classmates rail;
- controls de zoom/share/leave.

Referencias:

- `.agents/examples/flexidual-main/components/classroom/active-classroom-ui.tsx:67`
- `.agents/examples/flexidual-main/components/classroom/active-classroom-ui.tsx:88`
- `.agents/examples/flexidual-main/components/classroom/student-classroom-ui.tsx:32`
- `.agents/examples/flexidual-main/components/classroom/student-classroom-ui.tsx:53`

Decisión para CPM Studio:

- crear primitivas compartidas en `modules/liveClasses/presentation/classroom`;
- usar variantes explícitas o composición, no dos árboles duplicados;
- mantener diferencias teacher/student en contenedores de composición, no copiando el layout entero.

### 3. Muchas páginas son client-first

Varias rutas principales son `"use client"`:

- admin campuses;
- admin schools;
- org calendar;
- classes;
- curriculums;
- lessons;
- recording.

Referencia:

- `.agents/examples/flexidual-main/app/[locale]/[orgSlug]/calendar/page.tsx:1`
- `.agents/examples/flexidual-main/app/[locale]/[orgSlug]/classes/page.tsx:1`
- `.agents/examples/flexidual-main/app/[locale]/admin/campuses/page.tsx:1`

Decisión para CPM Studio:

- `app/` debe seguir siendo adaptador;
- server data en `lib/liveClasses/server.ts`;
- interactividad en leaf client components;
- no mover queries de módulo al page client por defecto.

### 4. UX funcional pero confusa como producto modular

La navegación original mezcla:

- sistema;
- escuelas;
- campuses;
- curriculums;
- lessons;
- classes;
- users;
- calendar.

Referencia:

- `.agents/examples/flexidual-main/components/nav-main.tsx:37`
- `.agents/examples/flexidual-main/components/nav-main.tsx:74`
- `.agents/examples/flexidual-main/components/nav-main.tsx:98`

El resultado puede funcionar en una app única, pero no en CPM Studio, donde Flexidual debe convivir con Dismissal, Alef University, Teaching y Billing.

Decisión para CPM Studio:

- navegación institucional: people, team access, campuses, capabilities;
- navegación campus: módulos habilitados;
- Flexidual dentro de campus como `live-classes`;
- no traer un sidebar propio de Flexidual.

### 5. Accesibilidad y detalles UI mejorables

Hay icon-only buttons con `title`, pero sin `aria-label` en controles importantes.

Referencias:

- `.agents/examples/flexidual-main/components/classroom/active-classroom-ui.tsx:1185`
- `.agents/examples/flexidual-main/components/classroom/active-classroom-ui.tsx:1201`
- `.agents/examples/flexidual-main/components/classroom/student-classroom-ui.tsx:840`
- `.agents/examples/flexidual-main/components/classroom/student-classroom-ui.tsx:860`

Hay `<img>` directo y reglas de lint deshabilitadas para imágenes de participantes.

Referencias:

- `.agents/examples/flexidual-main/components/classroom/active-classroom-ui.tsx:173`
- `.agents/examples/flexidual-main/components/classroom/student-classroom-ui.tsx:136`
- `.agents/examples/flexidual-main/app/recording/page.tsx:80`

Decisión para CPM Studio:

- copiar ideas visuales, no markup literal;
- controles icon-only deben tener `aria-label`;
- usar nuestros primitives, avatar helpers e i18n;
- si LiveKit requiere `<img>` por metadata externa, aislarlo en un componente pequeño con justificación.

## Lo que sí conviene rescatar

### 1. Patrón conceptual de token LiveKit

`getToken` contiene el flujo más valioso:

1. autenticar usuario;
2. resolver usuario Convex;
3. llamar a una query interna de autorización por room;
4. validar estado de sesión;
5. emitir JWT con metadata del participante;
6. conceder permisos según rol.

Referencias:

- `.agents/examples/flexidual-main/convex/livekit.ts:15`
- `.agents/examples/flexidual-main/convex/livekit.ts:23`
- `.agents/examples/flexidual-main/convex/livekit.ts:30`
- `.agents/examples/flexidual-main/convex/livekit.ts:47`
- `.agents/examples/flexidual-main/convex/livekit.ts:76`
- `.agents/examples/flexidual-main/convex/livekit.ts:88`

Adaptación correcta:

- usar Convex Auth, no Clerk;
- derivar `userId` server-side;
- mapear `user -> person -> organizationPerson`;
- validar organization/campus/capability;
- validar `liveClassParticipants`;
- usar `sessionId` como entrada preferida y derivar `roomName`.

### 2. Query interna de acceso al aula

`checkLiveKitAccess` expresa una buena idea: una única función decide si el usuario puede entrar, si puede entrar temprano y si es room admin.

Referencias:

- `.agents/examples/flexidual-main/convex/schedule.ts:504`
- `.agents/examples/flexidual-main/convex/schedule.ts:522`
- `.agents/examples/flexidual-main/convex/schedule.ts:526`
- `.agents/examples/flexidual-main/convex/schedule.ts:535`

Adaptación correcta:

- moverla a `convex/modules/liveClasses/lib/access.ts`;
- que opere con `organizationPersonId`;
- que use `requireModuleCapability`;
- que lea participantes por índice, no arrays embebidos;
- que sea compartida por token, mark live, attendance y recording.

### 3. Waiting room y estados de sesión

El componente `FlexiClassroom` tiene un flujo útil:

- loading;
- not found;
- waiting room;
- connection error;
- connecting;
- active classroom.

Referencias:

- `.agents/examples/flexidual-main/components/classroom/flexi-classroom.tsx:194`
- `.agents/examples/flexidual-main/components/classroom/flexi-classroom.tsx:206`
- `.agents/examples/flexidual-main/components/classroom/flexi-classroom.tsx:228`
- `.agents/examples/flexidual-main/components/classroom/flexi-classroom.tsx:315`
- `.agents/examples/flexidual-main/components/classroom/flexi-classroom.tsx:338`
- `.agents/examples/flexidual-main/components/classroom/flexi-classroom.tsx:350`

Adaptación correcta:

- mantener la máquina de estados conceptual;
- rediseñar UI con nuestro sistema visual;
- usar i18n de CPM Studio;
- no depender de Clerk claims ni `next/navigation` directo.

### 4. Asistencia inicial por join/leave

La app original ya maneja presencia join/leave y cleanup de sesiones abiertas.

Referencias:

- `.agents/examples/flexidual-main/convex/schedule.ts:1073`
- `.agents/examples/flexidual-main/convex/schedule.ts:1081`
- `.agents/examples/flexidual-main/convex/schedule.ts:1090`
- `.agents/examples/flexidual-main/convex/schedule.ts:1152`

Adaptación correcta:

- MVP: `present` si hizo join al menos una vez durante la ventana;
- no meter porcentajes ni `late` todavía;
- usar `liveClassAttendanceRecords` por participante/sesión;
- usar eventos o registros separados si luego queremos duración exacta;
- cleanup bounded con cron moderno.

### 5. Affordances de aula virtual

Son útiles como backlog de producto:

- pantalla de espera;
- modo teacher vs student;
- student controls simplificados;
- share screen request/approval;
- hand raise;
- companion device;
- recording;
- participants rail;
- whiteboard.

No todos deben entrar en MVP.

## Lo que no conviene rescatar

No copiar:

- schema `classes.students`;
- `roleAssignments`;
- syncing de roles a Clerk metadata;
- middleware Clerk;
- sidebar/nav;
- páginas client-first;
- componentes monolíticos de classroom;
- acciones públicas de egress;
- queries con `.collect()`/`.filter()` como patrón normal;
- curriculums/lessons como parte obligatoria del primer MVP de Flexidual.

## Comparación con nuestra arquitectura objetivo

| Concepto en `flexidual-main` | Problema | Equivalente recomendado en CPM Studio |
|---|---|---|
| `schools` | App propia, no platform tenant actual | `organizations` |
| `campuses.schoolId` | Correcto conceptualmente, distinto naming | `campuses.organizationId` |
| `users` como estudiante/profesor | Mezcla auth con persona de dominio | `people` + `organizationPeople` + `users.personId` |
| `roleAssignments` | Roles de acceso y dominio mezclados | `organizationMemberships` + `organizationPersonRoles` |
| `classes.students[]` | Array embebido no escalable | `liveClassParticipants` |
| `classSchedule` | Útil conceptualmente | `liveClassSessions` |
| `class_sessions` | Útil conceptualmente | `liveClassAttendanceRecords` |
| `curriculums/lessons` | Demasiado amplio para MVP | Teaching/curriculum futuro o integración posterior |
| `getToken` | Útil, pero Clerk-specific | Action LiveKit con Convex Auth y authz modular |
| `AppSidebar/NavMain` | App única, no modular | Campus shell + registry de módulos |

## Recomendación de implementación

### Backend

Crear desde cero:

```txt
convex/modules/liveClasses/
  tables.ts
  index.ts
  lib/access.ts
  lib/rooms.ts
  livekit.ts
```

No crear `convex/livekit.ts` ni `convex/liveClasses.ts` en raíz.

Tablas iniciales:

```txt
liveClassSeries
liveClassSessions
liveClassParticipants
liveClassAttendanceRecords
```

Reglas:

- cada tabla tiene `organizationId`;
- tablas campus-scoped tienen `campusId`;
- `liveClassSeries.campusId` es single-campus en MVP;
- no `primaryCampusId` todavía en series;
- no `gradeLevelId` ni `sectionId` todavía;
- no `liveClassSeriesCampuses` todavía;
- no arrays grandes embebidos;
- no presence de alto churn dentro de `liveClassSessions`.

### Frontend

Mantener:

```txt
app/[locale]/(app)/[tenant]/(campus-shell)/campuses/[campus]/live-classes/
  layout.tsx
  page.tsx

modules/liveClasses/presentation/
```

Agregar cuando haga falta:

```txt
modules/liveClasses/presentation/classroom/
modules/liveClasses/presentation/sessions/
modules/liveClasses/presentation/participants/
hooks/liveClasses/
lib/liveClasses/server.ts
```

Reglas:

- `page.tsx` valida params, compone server data y renderiza presentación;
- hooks client viven en `hooks/liveClasses`;
- helpers server-side viven en `lib/liveClasses/server.ts`;
- componentes LiveKit pequeños y testeables;
- teacher/student comparten primitives.

### UX MVP

MVP recomendado:

1. Campus Flexidual home.
2. Listado de sesiones por campus.
3. Crear sesión manual con título, profesor y participantes.
4. Waiting room.
5. Join LiveKit con token seguro.
6. Attendance simple por join.

No incluir todavía:

- recurrence compleja;
- curriculum/lessons;
- whiteboard;
- companion device;
- recording;
- share screen approval avanzado;
- attendance por porcentaje.

## Decisión final

Usar `flexidual-main` como referencia funcional, no como base de código.

Lo más valioso es:

- integración LiveKit token/grants;
- modelo mental de access check por room;
- estados de classroom;
- attendance join/leave;
- ideas de UX de aula virtual.

Lo más riesgoso es:

- authz incompleta en acciones sensibles;
- schema centrado en `users` y arrays embebidos;
- queries no escalables;
- componentes monolíticos;
- navegación y UX diseñadas para app única.

La ruta segura es implementar Flexidual limpio sobre nuestra arquitectura actual y consultar `flexidual-main` solo para detalles de comportamiento LiveKit y casos de uso ya probados.
