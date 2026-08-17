# Diseño base: personas, campuses y Flexidual

> **Estado: borrador histórico, no normativo.** Este documento describe otro producto y otro stack (CPM Studio, Convex Auth y dominio académico). No debe guiar implementaciones de Futbolya. Consultar [`../AGENTS.md`](../AGENTS.md) y la skill `futbolya-project-guidelines`.

Fecha: 2026-04-27  
Estado: borrador para discusión  
Stack observado: Next.js 16.1.7, React 19.2.4, Convex 1.33.1, Convex Auth, next-intl, subdominios por tenant.

## Objetivo

Definir una organización clara para personas, campuses, grados y capacidades antes de desarrollar Flexidual.

La meta es evitar dos errores:

- meter estudiantes/profesores dentro de cada módulo y duplicarlos cuando otro módulo los necesite;
- convertir `campus` en un tag débil que no ayuda a operar dismissal, clases, horarios ni asistencia.

El diseño debe permitir que CPM Studio soporte, con una misma base:

- `Dismissal`
- `Alef University`
- `CPCA Teachers`
- `CPCA Sports / Billing`
- `Flexidual`

sin forzar una arquitectura de plugins ni microservicios.

## Decisión principal

Las personas se crean y gobiernan a nivel de institución.

Los campuses no son dueños de las personas. Los campuses son particiones operativas de una institución.

Eso implica:

- estudiantes, profesores, acudientes, administrativos y staff viven en el directorio de la institución;
- cada persona puede tener una o varias asignaciones a campus;
- las pantallas de campus muestran una vista filtrada y operativa de ese directorio;
- los módulos trabajan dentro del campus cuando la operación lo requiere, pero referencian personas institucionales.

## Principios

1. La institución es el tenant.
2. El campus es una unidad operativa, no una organización separada.
3. `users` no es `people`.
4. Una persona puede existir sin cuenta de login.
5. Una cuenta puede apuntar a una persona.
6. Los roles de acceso no son los roles de dominio.
7. Las capacidades habilitan módulos; los permisos controlan acciones.
8. Toda tabla de negocio debe tener `organizationId`.
9. Las tablas operativas por campus deben tener `campusId` o una tabla join clara.
10. Las relaciones multi-campus no se resuelven con arrays embebidos.

## Modelo actual que debemos preservar

El repo ya tiene una base correcta:

```txt
organizations
campuses
organizationMemberships

users
people
organizationPeople
organizationPersonRoles
guardianRelationships

organizationCapabilities
```

Lectura recomendada:

- `organizations`: instituciones / tenants.
- `campuses`: sedes, campus o divisiones operativas de una institución.
- `users`: cuentas autenticadas Convex Auth.
- `people`: personas de dominio.
- `organizationPeople`: afiliación de una persona a una institución.
- `organizationPersonRoles`: roles de dominio como `student`, `teacher`, `guardian`, `staff`, `applicant`.
- `organizationMemberships`: acceso administrativo a la institución.
- `organizationCapabilities`: capacidades activadas por institución.

Esta separación es correcta y debe mantenerse.

## Dónde se crean las personas

### Institución

La creación principal debe vivir en una vista institucional.

Recomendación de navegación:

```txt
/campuses
/people
/team
/settings
```

En la etapa actual, `team-settings` puede seguir agrupando esto, pero a nivel de producto conviene separar mentalmente:

- `People`: estudiantes, profesores, acudientes, staff y applicants.
- `Team Access`: usuarios con acceso administrativo o acceso al portal.
- `Settings`: datos de institución, capacidades y configuración general.

### Campus

Dentro de un campus debe existir una vista de personas filtrada.

Esta vista puede permitir:

- ver personas asignadas a ese campus;
- asignar una persona existente al campus;
- crear una persona rápida y asignarla al campus en el mismo flujo.

Pero incluso si el usuario crea a alguien desde un campus, el write path debe ser:

```txt
people
organizationPeople
organizationPersonRoles
organizationPersonCampusAssignments
```

El campus no debe tener una tabla propia de estudiantes o profesores.

## Campus: más que un tag, menos que un tenant

`campus` debe representar una partición operativa real.

Ejemplos:

- primaria y secundaria en la misma institución;
- sedes físicas distintas;
- jornadas o divisiones con operación separada;
- un campus principal y una sede satélite.

Pero `campus` no debe duplicar:

- usuarios;
- personas;
- roles globales de dominio;
- capacidades contratadas por la institución.

La capacidad sigue siendo institucional. La ejecución puede ser campus-scoped.

## Asignación de personas a campus

`organizationPeople` no debe guardar un campus principal. La fuente de verdad del modelo multi-campus vive fuera del perfil institucional de la persona.

Necesitamos una relación explícita:

```txt
organizationPersonCampusAssignments
  organizationId
  organizationPersonId
  campusId
  isPrimary
  isActive
  createdAt
  updatedAt
```

Para MVP no incluir `startsAt` ni `endsAt`. El historial temporal se agrega cuando exista un reporte o flujo real que lo necesite.

Índices recomendados:

```txt
by_org_id_and_campus_id_and_is_active
by_org_id_and_op_id_and_is_active
by_org_id_and_op_id_and_campus_id
```

Reglas:

- una persona puede estar en varios campuses;
- solo una asignación primaria activa por persona dentro de una institución;
- la fuente real de asignación es `organizationPersonCampusAssignments`;
- no mantener `primaryCampusId` como digest nuevo hasta que exista un listado real que justifique el costo de sincronización;
- mover a un estudiante de campus no debe cambiar su identidad ni su historial.

Si más adelante se decide mantener `organizationPeople.primaryCampusId` como digest por performance, debe existir un único helper de write-path que actualice asignaciones y digest en la misma mutation. No debe haber mutations sueltas escribiendo el digest.

## Roles de dominio

Los roles de dominio deben seguir viviendo a nivel de `organizationPerson`.

Roles actuales:

```txt
student
teacher
guardian
staff
applicant
```

Esto permite:

- una persona que es profesor en la institución y trabaja en varios campuses;
- un guardian con hijos en distintos campuses;
- un staff administrativo con acceso operacional;
- un applicant que luego se convierte en student sin recrear la persona.

Regla core vs módulo:

- un rol vive en core si existe independientemente de un módulo y lo usan al menos dos capacidades;
- un rol vive en el módulo si solo tiene sentido dentro del workflow de ese módulo.

Si un módulo necesita un rol más específico, ese rol debe vivir en el módulo.

Ejemplos:

```txt
dismissalOperators
  organizationId
  campusId
  organizationPersonId

liveClassSessionHosts
  organizationId
  liveClassSessionId
  organizationPersonId
```

No todos los roles operativos deben subir al core.

## Usuarios, team members y personas

Hay tres conceptos distintos:

```txt
user
  cuenta autenticada

organizationMembership
  acceso administrativo o de plataforma al tenant

organizationPerson
  persona real dentro de la institución
```

Un profesor puede necesitar:

- `user`: para iniciar sesión;
- `organizationPerson`: para ser profesor en el dominio;
- `organizationMembership`: solo si debe entrar al dashboard administrativo o a capacidades internas.

Un estudiante puede necesitar:

- `organizationPerson` desde el inicio;
- `user` solo si tendrá portal propio;
- normalmente no necesita `organizationMembership`.

Un superadmin de CPM puede tener:

- `user`;
- `platformRole`;
- opcionalmente ninguna `organizationPerson`.

## Guardianes y familias

`guardianRelationships` debe seguir siendo institucional.

Esto resuelve casos como:

- un padre con hijos en dos campuses;
- dismissal recogiendo varios estudiantes con el mismo vehículo;
- billing creando cargos familiares;
- Flexidual mostrando supervisión o acceso de guardianes si se habilita en el futuro.

No crear relaciones de guardianía dentro de un campus.

El campus se deriva de las asignaciones activas de los estudiantes o de los registros operativos del módulo.

## Grados y estructura académica

Los grados no deberían vivir solo dentro de un campus.

Recomendación:

1. Crear un catálogo institucional de grados o niveles.
2. Asignar qué grados ofrece cada campus.
3. Crear secciones o grupos académicos cuando un módulo lo necesite.

Modelo base recomendado:

```txt
academicGradeLevels
  organizationId
  name
  code
  stage?
  sortOrder
  isActive
  createdAt
  updatedAt

campusGradeOfferings
  organizationId
  campusId
  gradeLevelId
  isActive
  createdAt
  updatedAt
```

Índices:

```txt
academicGradeLevels.by_organization_id_and_sort_order
academicGradeLevels.by_organization_id_and_code
campusGradeOfferings.by_organization_id_and_campus_id
campusGradeOfferings.by_organization_id_and_grade_level_id
```

Ejemplo:

- La institución crea `Primero`, `Segundo`, `Tercero`, `Décimo`, `Undécimo`.
- Campus primaria ofrece `Primero` a `Quinto`.
- Campus secundaria ofrece `Sexto` a `Undécimo`.

Esto evita duplicar `Quinto` por campus y permite mover estudiantes entre campus sin perder consistencia histórica.

Para MVP, los grados solo definen oferta por campus. No modelan todavía la pertenencia actual de cada estudiante a un grado.

## Secciones, clases y cursos

No conviene meter todo en el core desde el primer día.

Separación recomendada:

- grados y campus offerings: core académico compartido;
- programas, cursos, periodos, notas finales: módulo `academics`;
- curriculum, lessons y evidencias: módulo `teaching`;
- clases virtuales y sesiones: módulo `liveClasses`;
- cobros, cuentas, aplicaciones y pagos: módulo `billing`.

Cuando haga falta una agrupación concreta de estudiantes, se puede introducir:

```txt
academicSections
  organizationId
  campusId
  gradeLevelId
  academicPeriodId?
  name
  isActive

academicSectionMembers
  organizationId
  sectionId
  organizationPersonId
  role
```

No introducir secciones hasta que el primer flujo real las necesite.

Mientras no existan `academicSections` o una tabla equivalente de membership académico, Flexidual no debe ofrecer selector "por grado". El MVP puede seleccionar estudiantes por campus y por persona. El filtro por grado llega cuando exista una fuente de verdad para el grado actual del estudiante.

## Cómo impacta esto a cada capacidad

### Dismissal

Necesita operar por campus, pero puede cruzar campus.

Entidades probables:

```txt
dismissalVehicles
  organizationId
  label/code
  guardianOrganizationPersonId?

dismissalStudentPickupAssignments
  organizationId
  campusId
  studentOrganizationPersonId
  vehicleId

dismissalQueueEntries
  organizationId
  campusId
  vehicleId
  status
  arrivedAt
```

Si un carro recoge hijos de dos campuses, el vehículo es institucional y la cola puede generar entradas por campus o una entrada con children resueltos por asignaciones.

### Alef University

Programas, cursos y periodos son institucionales.

Clases/secciones pueden ser campus-scoped o multi-campus según el caso.

Notas finales deben referenciar:

```txt
organizationId
studentOrganizationPersonId
teacherOrganizationPersonId
course/class entity
academicPeriodId
```

No deben referenciar `users` como entidad académica principal.

### CPCA Teachers

Curriculum y lessons pueden ser institucionales o por programa.

Evidencias deben tener:

```txt
organizationId
campusId?
teacherOrganizationPersonId
lessonId?
storageId
createdAt
```

Si Flexidual genera evidencia de clase, no debe importar directamente internals de CPCA Teachers. Debe crear un evento o escribir por una API controlada.

### CPCA Sports / Billing

El ejemplo `cpca-sports-main` muestra una mezcla útil de applications, programs, fees y payment plans, pero su modelo está más acoplado a deporte/admisión.

Para CPM Studio:

- `applications` puede vivir en un módulo de admissions o sports;
- `fees`, recurring plans y transactions deben evolucionar hacia billing escolar;
- cargos deben poder apuntar a familia, estudiante, application o evento.

No llevar `formTemplates` y payments al core antes de definir el módulo.

### Flexidual

Flexidual debe empezar como módulo campus-scoped.

Primeras entidades probables:

```txt
liveClassSeries
  organizationId
  campusId
  title
  description?
  teacherOrganizationPersonId
  isActive
  createdAt
  updatedAt

liveClassSessions
  organizationId
  seriesId
  scheduledStartAt
  scheduledEndAt
  status
  livekitRoomName?
  createdAt
  updatedAt

liveClassParticipants
  organizationId
  sessionId
  organizationPersonId
  participantRole
  joinPolicy

liveClassAttendanceRecords
  organizationId
  sessionId
  organizationPersonId
  status
  firstJoinedAt?
  lastLeftAt?
  totalSeconds?
```

MVP scope:

- `liveClassSeries` es single-campus mediante `campusId`;
- no crear `liveClassSeriesCampuses` todavía;
- no usar `gradeLevelId` en series hasta tener `academicSections` o una fuente real de grade membership;
- no usar `sectionId` en series hasta crear `academicSections`;
- seleccionar participantes por campus o por persona, no por grado.

Datos de presencia en vivo o heartbeat no deben vivir en el mismo documento de sesión.

Si se necesita alta frecuencia:

```txt
liveClassPresenceEvents
liveClassParticipantPresence
```

Separados de `liveClassSessions`.

Regla inicial de attendance:

- en MVP, `present` significa que el participante hizo join al menos una vez durante la ventana de la sesión;
- `absent` significa que terminó la sesión sin ningún join registrado;
- `late` y porcentajes de duración quedan fuera del MVP;
- cuando se introduzcan métricas por duración, `totalSeconds` debe derivarse de eventos join/leave o snapshots de presencia, no editarse continuamente en `liveClassSessions`.

## Dónde se gestiona Flexidual

La navegación debe ser:

```txt
Institución
  People
  Team Access
  Campuses
  Capabilities

Campus
  Flexidual
    Sessions
    Calendar
    Participants
    Attendance
```

Creación de personas:

- desde institución: flujo principal;
- desde campus: quick create + asignación al campus;
- desde Flexidual: seleccionar personas existentes, con opción controlada de quick create si no existen.

Creación de sesiones:

- desde `campus/live-classes`;
- permite seleccionar profesor institucional;
- permite seleccionar estudiantes por campus o búsqueda de persona;
- no permite selector por grado hasta tener secciones o membership académico;
- no permite multi-campus en MVP.

## Qué hacer ahora

Antes de construir lógica profunda de Flexidual:

1. Crear o consolidar la vista institucional de `People`.
2. Añadir asignaciones persona-campus.
3. Añadir catálogo básico de grados y offerings por campus.
4. En Flexidual MVP, crear sesiones contra:
   - `organizationId`
   - `campusId`
   - `teacherOrganizationPersonId`
   - `seriesId`
5. Añadir participantes por persona o por campus.
6. Registrar attendance simple basada en join al menos una vez.
7. Dejar LiveKit real o métricas de duración para la siguiente iteración si hace falta.

## Qué no hacer ahora

No introducir todavía:

- campus entitlements por capability;
- permisos por usuario extremadamente finos;
- event bus general;
- tablas genéricas de `settings` por módulo;
- un modelo completo de notas, curriculum y billing para desbloquear Flexidual;
- arrays grandes de estudiantes dentro de una clase o sesión;
- duplicar students/teachers dentro de cada módulo.
- historial temporal de asignaciones campus-persona;
- sesiones multi-campus;
- selector por grado en Flexidual antes de tener secciones o membership académico.

## Propuesta de navegación de producto

### Institución

```txt
/campuses
/people
/team
/settings
```

En el estado actual, esto puede mapearse gradualmente desde `team-settings`.

### Campus

```txt
/campuses/:campus
/campuses/:campus/people
/campuses/:campus/grades
/campuses/:campus/live-classes
```

La vista campus debe ser operacional. La vista institución debe ser maestra.

## Reglas de autorización

Toda autorización debe derivarse server-side de:

- host/subdominio;
- sesión Convex Auth;
- `organizationMemberships`;
- `organizationPeople`;
- `organizationCapabilities`.

No aceptar `organizationId`, `userId` o `personId` del cliente como autorización suficiente.

En Convex:

- las mutations públicas deben validar args;
- los helpers deben confirmar que todo pertenece a la misma organización;
- las funciones sensibles deben usar `internalMutation`/`internalQuery` cuando no deban exponerse al cliente;
- los módulos deben requerir capability activa antes de permitir writes.

Regla mínima de permisos para MVP:

- crear, editar o asignar personas requiere `owner` o `admin` de la institución;
- asignar personas a campus requiere `owner` o `admin`;
- crear grados y offerings requiere `owner` o `admin`;
- crear series/sesiones de Flexidual requiere `owner` o `admin` al inicio;
- roles operativos como dismissal operator o teacher no conceden automáticamente permiso para crear estudiantes o editar el directorio institucional.

## Reglas de Convex y performance

Para tablas nuevas:

- incluir `organizationId`;
- incluir `campusId` cuando el acceso principal sea por campus;
- diseñar índices con `organizationId` como primer campo;
- usar `paginate` o `take(n)` en listados;
- evitar `.filter` sobre queries Convex;
- evitar `.collect()` en caminos que pueden crecer;
- separar datos de alto churn de documentos estables;
- no guardar listas grandes embebidas.

Ejemplo correcto:

```txt
liveClassSessions.by_organization_id_and_series_id_and_scheduled_start_at
liveClassSessions.by_organization_id_and_primary_campus_id_and_scheduled_start_at
liveClassParticipants.by_organization_id_and_session_id
liveClassParticipants.by_organization_id_and_organization_person_id
```

Si un index name se acerca al límite de 64 caracteres de Convex, usar abreviaciones estables:

```txt
org = organization
op = organizationPerson
```

Ejemplo:

```txt
by_org_id_and_op_id_and_campus_id
```

No mezclar abreviaciones casuales por archivo.

## Reglas de frontend

`app/` debe ser adaptador de rutas, layouts y metadata.

La presentación reusable debe vivir en:

```txt
modules/liveClasses/presentation
```

La lógica de dominio no debe quedar embebida en `page.tsx`.

Patrón recomendado:

```txt
app/[locale]/(app)/[tenant]/(campus-shell)/campuses/[campus]/live-classes/page.tsx
  - valida locale
  - compone server data
  - renderiza presentación

modules/liveClasses/presentation
  - componentes visuales del módulo

convex/modules/liveClasses
  - queries/mutations del módulo

convex/modules/liveClasses/lib
  - helpers e invariantes internas

lib/liveClasses/server.ts
  - helpers server-side usados por Server Components
  - deduplicación por request con `cache()` cuando haya lecturas repetidas
  - traducción entre rutas Next y funciones Convex
```

Esto sigue la convención actual del repo, por ejemplo `lib/campuses/server.ts`. Evita que cada `page.tsx` invente su propio data fetching.

Decisión explícita:

- Flexidual inaugura la estructura `convex/modules/<module>/`.
- No crear `convex/liveClasses/` en la raíz.
- `convex/platform/` queda reservado para platform core.
- `convex/lib/` queda reservado para helpers transversales reales.
- Las tablas del módulo se exportan desde `convex/modules/liveClasses/tables.ts` y se conectan al schema mediante `composeModuleTables(...)`.

## Decisión recomendada para la pregunta central

Crear estudiantes, profesores, acudientes y staff en la institución.

Asignarlos a campus mediante relaciones explícitas.

Permitir vistas y quick-create desde campus, pero sin cambiar el ownership del dato.

Crear grados como catálogo institucional y asignar offerings por campus.

Gestionar las capacidades dentro del campus cuando la operación sea campus-scoped, como Flexidual, Dismissal y parte de Teaching.

Mantener la institución como punto maestro para:

- personas;
- team access;
- campuses;
- capabilities;
- estructura académica compartida.

## Secuencia recomendada para Flexidual

1. `People Directory` institucional sólido.
2. `organizationPersonCampusAssignments`.
3. `academicGradeLevels` + `campusGradeOfferings`.
4. `liveClassSeries` y `liveClassSessions`.
5. `liveClassParticipants`.
6. Attendance simple basada en join.
7. Integración LiveKit.
8. Attendance por duración si el producto lo exige.
9. Evidencias o integración con Teaching.

## Fuentes revisadas

- Documento local: `.agents/ruta-sugerida-v2.md`
- Ejemplo local: `.agents/examples/platforms-main`
- Ejemplo local: `.agents/examples/cpca-sports-main`
- Guías locales: `.agents/skills/next-best-practices`, `.agents/skills/vercel-react-best-practices`, `.agents/skills/vercel-composition-patterns`, `.agents/skills/web-design-guidelines`
- Convex local: `convex/_generated/ai/guidelines.md`
- Vercel for Platforms: https://examples.vercel.com/docs/multi-tenant
- Next.js Proxy docs: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- Convex Best Practices: https://docs.convex.dev/understanding/best-practices/
- Convex Schemas: https://docs.convex.dev/database/schemas
- Convex Indexes: https://docs.convex.dev/database/reading-data/indexes/
- Convex Auth: https://docs.convex.dev/auth/convex-auth
