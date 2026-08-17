# Plataforma core: personas, guardianes, campuses y grados

> **Estado: plan histórico, no normativo.** Las rutas, módulos y el dominio descritos no corresponden al código vigente de Futbolya. No usarlo como arquitectura, backlog ni fuente de implementación. Consultar [`../AGENTS.md`](../AGENTS.md).

Fecha: 2026-05-07  
Estado: análisis operativo antes de continuar Flexidual  
Alcance: modelo compartido de institución, personas, campus, guardianes, grados y acceso.

## Fuentes revisadas

- `convex/README.md`
- `convex/_generated/ai/guidelines.md`
- `convex/schema.ts`
- `convex/platform/people.ts`
- `convex/platform/academic.ts`
- `convex/lib/organizationPeople.ts`
- `convex/lib/academic.ts`
- `convex/modules/liveClasses/`
- `components/people/`
- `app/[locale]/(app)/[tenant]/(shell)/people/page.tsx`
- `app/[locale]/(app)/[tenant]/(shell)/team-settings/page.tsx`
- `.agents/flexidual-people-campus-architecture.md`
- `.agents/flexidual-main-reference-audit.md`

## Propósito

Antes de desarrollar Flexidual como módulo funcional, conviene cerrar una decisión más básica: dónde viven los estudiantes, profesores, guardianes y grados. Si esta decisión queda mal, cada capacidad tenderá a recrear sus propias tablas de personas, asignaciones y perfiles. Ese sería el camino más costoso, porque Dismissal, Alef, CPCA Teachers y Flexidual acabarían guardando versiones distintas de los mismos estudiantes y profesores.

La conclusión es simple: las personas viven en la institución. Los campuses son particiones operativas de esa institución. Las capacidades pueden operar dentro de un campus, pero no son dueñas de las personas.

## Respuesta directa: assignments y offerings

`organizationPersonCampusAssignments` no es propio de Flexidual. Es una tabla core.

No todas las capacidades la consultarán con la misma intensidad, pero varias la necesitan:

- Flexidual necesita saber qué estudiantes y profesores pertenecen al campus donde se crea una clase virtual.
- Alef necesita relacionar estudiantes, profesores, cursos y clases con sedes o divisiones operativas.
- CPCA Teachers puede necesitar profesores asignados a campus para evidencias y operación académica.
- Dismissal opera por campus, aunque sus reglas de despacho sean propias del módulo.
- Billing puede ignorar campus en algunos cobros, pero no debe definir su propio modelo de estudiantes.

La razón para mantener assignments en core no es que Flexidual los use. La razón es que "esta persona pertenece a estos campuses dentro de esta institución" es una verdad compartida por varias capacidades.

`campusGradeOfferings` significa "oferta académica por campus". No significa que un estudiante esté en ese grado. Dice que un campus ofrece un grado definido por la institución.

Ejemplo:

- La institución define `Quinto` una sola vez en `academicGradeLevels`.
- El campus `Primaria` ofrece `Quinto`.
- El campus `Secundaria` también puede ofrecer `Quinto`, si esa institución opera el mismo grado en dos sedes.
- Un estudiante de quinto aún necesita otra relación para decir que cursa quinto actualmente. Esa relación no existe todavía.

En UI conviene traducir `offerings` como "grados ofrecidos" u "oferta por campus". La palabra técnica debe quedarse en el backend; el usuario final no necesita verla.

La relación es muchos-a-muchos: varios campuses pueden ofrecer el mismo grado, y un campus puede ofrecer varios grados. La única unicidad que importa es el par `(campusId, gradeLevelId)` dentro de la institución.

## Estado real del backend

El modelo Convex actual ya soporta la base correcta:

- `organizations`: institución y tenant.
- `campuses`: particiones operativas de una institución.
- `users`: cuentas autenticadas por Convex Auth.
- `people`: personas de dominio, sin requerir login.
- `organizationPeople`: afiliación de una persona a una institución.
- `organizationPersonRoles`: roles de dominio como `student`, `teacher`, `guardian`, `staff`, `applicant`.
- `organizationMemberships`: acceso administrativo a la institución.
- `organizationPersonCampusAssignments`: asignaciones de una persona a uno o varios campuses.
- `guardianRelationships`: relación guardian-estudiante.
- `academicGradeLevels`: catálogo institucional de grados.
- `campusGradeOfferings`: grados que ofrece cada campus.
- `organizationCapabilities`: capacidades habilitadas por institución.
- `organizationInvitations`: invitaciones a nivel institución para conceder acceso administrativo tenant.
- `liveClass*`: tablas propias del módulo Flexidual/liveClasses.

La separación `users` / `people` / `organizationPeople` es la pieza central. Una persona puede existir sin login. Un usuario puede vincularse a una persona mediante `users.personId`. Una persona puede pertenecer a varias instituciones mediante `organizationPeople`.

Esto evita un error frecuente: tratar cada login como si fuera una persona académica. En una plataforma escolar eso no basta, porque hay niños sin cuenta propia, padres que gestionan varios hijos, profesores que también son guardianes, y administrativos que pueden tener acceso sin ser profesores.

## Estado real del frontend

La pantalla tenant canónica actual es `/people` y renderiza `TenantPeopleDashboard`. `/team-settings` queda como redirect de compatibilidad hacia `/people`.

Hoy permite:

- listar personas de la institución;
- filtrar por rol;
- filtrar por estado activo/inactivo;
- crear personas con uno o varios roles;
- activar o desactivar personas;
- editar roles de dominio desde el directorio institucional;
- asignar personas a uno o varios campuses;
- marcar un campus activo como principal;
- enviar una invitación de cuenta a una persona existente mediante `inviteForOrganization`.
- ver `/campuses/:campus/people` como vista operacional filtrada por campus;
- crear una persona desde la vista de campus y asignarla al campus actual.

Todavía no resuelve:

- gestionar guardianes y relaciones familiares desde la UI;
- separar claramente "personas de la institución" de "usuarios con acceso administrativo";
- gestionar grados y ofertas por campus;

La ambigüedad de `team-settings` queda cerrada para el directorio: el producto llama a esta superficie `People`. `Team Access` sigue pendiente como superficie separada para usuarios administrativos.

## Regla de ownership

La institución es dueña de las personas. El campus solo contextualiza la operación.

Esto implica:

- Un estudiante se crea en el directorio institucional.
- Un profesor se crea en el directorio institucional.
- Un guardian se crea en el directorio institucional.
- Un staff se crea en el directorio institucional.
- Desde un campus se puede hacer quick-create, pero el write path sigue siendo institucional.

El write path correcto para crear una persona desde cualquier superficie es:

```txt
people
organizationPeople
organizationPersonRoles
organizationPersonCampusAssignments
guardianRelationships, si aplica
```

No debe existir una tabla `campusStudents` ni `campusTeachers` como fuente principal. Si un módulo necesita información propia, debe crear una tabla del módulo que apunte a `organizationPeople`.

## Roles de dominio y acceso administrativo

Hay que distinguir dos preguntas:

1. Qué es esta persona dentro de la institución?
2. Qué puede hacer este usuario dentro del dashboard?

La primera se responde con `organizationPersonRoles`.

La segunda se responde con `organizationMemberships`.

Un profesor no necesita `organizationMemberships` para ser profesor. Un guardian no necesita `organizationMemberships` para ser guardian. Un estudiante no necesita `organizationMemberships` para ser estudiante.

Un profesor puede tener una cuenta de login para entrar a Flexidual sin ser admin de la institución. Si además debe administrar la institución, entonces también tendrá membership. Son dos conceptos distintos.

## Dónde crear cada entidad

### Personas

La creación principal debe vivir en una pantalla institucional de personas.

Nombre recomendado de producto:

```txt
/people
```

Esta pantalla debe gestionar:

- estudiantes;
- profesores;
- guardianes;
- staff;
- applicants;
- roles múltiples;
- estado activo/inactivo;
- asignaciones a campus;
- relaciones familiares;
- vínculo opcional con cuenta de login.

`/team-settings` no debe volver a alojar el directorio. Si se conserva, debe seguir siendo solo un redirect para no romper URLs antiguas.

### Team Access

Los administradores de la institución deben vivir en una pantalla separada.

Nombre recomendado:

```txt
/team
```

Esta pantalla debe gestionar:

- owners;
- admins;
- members administrativos;
- invitaciones a usuarios con acceso al dashboard;
- cambios de role administrativo.

No debe ser el lugar principal para crear estudiantes o guardianes.

### Campus People

Dentro de un campus debe existir una vista filtrada:

```txt
/campuses/:campus/people
```

Esta pantalla debe permitir:

- ver personas asignadas a ese campus;
- filtrar por rol;
- asignar una persona existente al campus;
- crear una persona rápida y asignarla al campus actual;
- quitar una asignación activa, sin borrar la persona de la institución.

La creación rápida desde campus es aceptable si no cambia el ownership del dato. El campus puede ser el contexto, no el dueño.

### Academic Structure

Los grados deben gestionarse a nivel de institución.

Nombre recomendado:

```txt
/academic
```

o, si queremos un alcance más corto:

```txt
/grades
```

Esta superficie debe gestionar:

- catálogo de grados de la institución (`academicGradeLevels`);
- oferta de grados por campus (`campusGradeOfferings`);
- en una fase posterior, ubicaciones académicas actuales de estudiantes.

No conviene crear "Quinto" dentro de cada campus. Eso duplicaría catálogo y haría frágil cualquier traslado de primaria a secundaria.

## Guardianes, estudiantes menores y estudiantes con cuenta propia

El modelo correcto para niños no es crear usuarios falsos para cada hijo.

Para estudiantes menores, el modelo recomendado es:

- crear una persona `guardian`;
- crear una cuenta `user` para el guardian;
- crear una persona `student` para cada hijo;
- vincular guardian y estudiante con `guardianRelationships`;
- permitir que el guardian seleccione un perfil de hijo dentro de su sesión.

Ese perfil de hijo es un contexto de navegación, no una cuenta de auth separada.

Esto se parece a un selector de perfiles, pero no debe contaminar `users`. `users` representa identidades autenticadas reales. El hijo menor puede tener una experiencia propia dentro de la sesión del guardian, pero el sistema debe saber que la autorización viene del guardian.

Más adelante, si un estudiante mayor necesita cuenta propia, se puede vincular un `user` real a la misma persona mediante `users.personId`. No se recrea el estudiante.

Para contextos universitarios o adultos, el estudiante puede administrar su propia cuenta. En ese caso el modelo cambia solo en el acceso, no en el core:

- existe una persona `student`;
- existe un `organizationPerson` con rol `student`;
- existe un `user` real vinculado a esa persona mediante `users.personId`;
- puede o no existir una `guardianRelationship`.

Esto permite que Alef University tenga estudiantes con cuenta propia y que una escuela primaria tenga estudiantes gestionados por guardianes, sin duplicar tablas ni separar módulos.

### Boundary de seguridad

El backend nunca debe confiar en un identificador de hijo enviado por el cliente como claim de autorización. Cada operación hecha "en nombre" del hijo debe re-derivar la relación en el server.

Regla mínima:

- el frontend envía `studentOrganizationPersonId` como parámetro;
- el handler en Convex valida que la sesión actual pertenezca a un `user` cuyo `organizationPerson` en la institución activa tenga una `guardianRelationship` válida con ese estudiante;
- si la relación no existe o no está activa, la mutation o query lanza `UNAUTHORIZED`.

El "perfil del hijo" es UI, no auth. Sin esta regla escrita, alguien terminará pasando `studentId` desde el cliente sin validación.

## Invitaciones a nivel tenant

Las invitaciones tenant no deben usarse para crear o vincular cuentas académicas de estudiantes, profesores o guardianes. Esa responsabilidad vive en los flujos académicos, donde se crea la persona, su rol de dominio, su relación con campus y, cuando aplica, su cuenta de login.

`organizationInvitations` queda acotada a `Team Access`: invitar usuarios con acceso administrativo al dashboard de una institución.

Estado actual:

- `auth.ts` deshabilita el sign-up directo (`Password.profile` lanza en `signUp`);
- `platformInvitations` solo soporta `platformRole: superadmin | viewer`;
- `organizationInvitations` soporta invitaciones a nivel tenant con `membershipRole` requerido;
- `OrganizationInvitationPassword` permite crear cuenta desde una invitación tenant;
- `/invite` distingue tokens de plataforma y tokens de institución;
- `platform/organizationInvitationActions.ts:inviteForOrganization` genera token, crea la invitación y envía el email;
- `/team-settings` permite invitar miembros administrativos de la institución.

Deuda i18n aceptada para MVP: el cuerpo de email de `inviteForOrganization` todavía está en inglés, igual que el email de `inviteForPlatform`. El `locale` se usa para construir la URL localizada, no para traducir el contenido del correo. Antes de producción o de uso real con clientes finales, ambos emails deben pasar por una fuente de copy localizada y compartida.

La decisión tomada fue:

- No extender `platformInvitations`.
- Mantener `organizationInvitations` como tabla paralela.
- Reusar el patrón `tokenHash + status + expiresAt`, pero con semántica tenant.

Shape implementado:

```txt
organizationId
email
tokenHash
status
invitedByUserId
membershipRole
expiresAt
acceptedByUserId?
createdAt
updatedAt
```

La acceptance path crea o sube el `organizationMembership` correspondiente, pero nunca degrada un rol administrativo existente. No vincula `users.personId` ni añade roles de dominio; esos datos pertenecen a los flujos de creación académica.

Lo pendiente ya no es la base de datos, el provider ni el trigger básico de UI. El directorio `People` no debe mezclar invitaciones administrativas con creación de personas académicas.

## Estudiantes y grados actuales

El backend ya tiene grados y ofertas por campus, pero todavía no tiene "grado actual del estudiante".

No debemos usar `campusGradeOfferings` para eso. Una offering solo dice que el campus ofrece el grado. No dice que un estudiante esté matriculado en ese grado.

Cuando el producto necesite asignar estudiantes a grados, debe agregarse una tabla core. Nombre sugerido:

```txt
academicStudentPlacements
```

Shape inicial sugerido:

```txt
organizationId
organizationPersonId
campusId
gradeLevelId
status   // active | transferred | graduated | withdrawn
createdAt
updatedAt
```

`status` reemplaza el par `isCurrent + status` que llevaba la primera versión del plan. Eran redundantes: `isCurrent: true` significa exactamente lo mismo que `status: "active"`. Un solo campo elimina la invariante de mantener ambos sincronizados. La consulta "ubicación actual del estudiante" filtra por `status === "active"` mediante un índice `by_organization_id_and_organization_person_id_and_status`.

No añadiría `startsAt`, `endsAt`, `sectionId` ni historial completo todavía. Esos campos son útiles, pero pertenecen a una fase donde exista promoción de grado, periodos académicos o secciones.

La regla debe ser:

- el estudiante tiene rol `student`;
- el campus está en la misma institución;
- el grado pertenece a la misma institución;
- el campus ofrece ese grado mediante `campusGradeOfferings`;
- solo una ubicación actual activa por estudiante, salvo que decidamos explícitamente soportar doble matrícula.

Esta tabla sería core, no Flexidual, porque Alef, CPCA Teachers y Flexidual pueden necesitarla.

## Qué debe hacer Flexidual con este core

Flexidual no debe crear estudiantes ni profesores propios.

Debe referenciar:

- `organizationPeople` para profesores y estudiantes;
- `organizationPersonRoles` para validar que el profesor sea profesor y el estudiante sea estudiante;
- `organizationPersonCampusAssignments` para validar que pertenecen al campus;
- `liveClassParticipants` para decir quién puede entrar a una sesión concreta;
- `liveClassAttendanceRecords` para asistencia de la sesión.

El módulo puede tener sus propias tablas operativas. Lo que no debe tener es su propio directorio de personas.

## Navegación recomendada

La navegación institucional debería tender a esto:

```txt
Campuses
People
Academic
Team
Settings
```

La navegación de campus debería tender a esto:

```txt
Overview
People
Grades
Live Classes
Otros módulos habilitados
```

No es necesario implementar todo de una vez. Pero la nomenclatura debe dejar de mezclar tres conceptos:

- personas de dominio;
- usuarios con acceso;
- operación por campus.

## Orden recomendado antes de profundizar Flexidual

1. Añadir edición de roles y asignaciones a campus en el directorio institucional. **Cerrado.**
2. Crear vista de personas por campus con records enriquecidos, no solo assignment rows. **Cerrado.**
3. Exponer gestión de guardianes y relaciones guardian-estudiante.
4. Exponer gestión de grade levels y campus grade offerings.
5. Crear `Team Access` como superficie separada para `organizationMemberships`.
6. Decidir si Flexidual MVP necesita filtro por grado. Si lo necesita, crear `academicStudentPlacements` antes de construir ese selector.
7. Continuar Flexidual usando el core: series, sessions, participants, attendance y luego LiveKit.

## Qué no conviene hacer

- No crear estudiantes como hijos directos de `campuses`.
- No crear profesores dentro de Flexidual.
- No crear guardianes dentro de Dismissal.
- No usar `organizationMemberships` como si fueran roles de dominio.
- No crear usuarios falsos para perfiles de hijos.
- No usar `campusGradeOfferings` como si fuera matrícula o grado actual del estudiante.
- No añadir secciones, periodos, historial de promoción o academic years hasta que un flujo real lo requiera.

## Decisión recomendada

El core actual está bien orientado. Los assignments son core porque expresan una relación compartida entre persona y campus. Los offerings también son core porque expresan qué estructura académica ofrece cada campus.

Lo que falta no es rehacer la base. Falta completar las superficies de plataforma que harán usable esa base:

- directorio institucional de personas;
- acceso administrativo separado;
- asignaciones a campus;
- guardianes y perfiles de hijos;
- catálogo de grados y ofertas por campus;
- eventual ubicación académica actual del estudiante.

Flexidual debe continuar después de cerrar al menos el directorio de personas, asignaciones de campus y la decisión mínima sobre grados. Si no, el módulo empezará a inventar selectores y relaciones que pertenecen a la plataforma.
