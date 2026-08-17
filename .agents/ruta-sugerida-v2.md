# Ruta sugerida v2

> **Estado: decisión histórica de CPM Studio, reemplazada para este repositorio.** No describe el producto, auth, tenancy ni arquitectura vigentes de Futbolya. La guía actual es [`../AGENTS.md`](../AGENTS.md) junto con la skill `futbolya-project-guidelines`.

Documento de referencia para esta fase temprana de CPM Studio.

Objetivo: dejar una decisión arquitectónica clara, estable y consultable para no perder contexto mientras se unifican varios productos académicos dentro de una sola plataforma.

Este documento reemplaza la v1 como guía principal. La v1 sigue siendo útil como antecedente, pero aquí queda una propuesta más aterrizada al stack real del repo:

- Next.js App Router
- Convex
- Convex Auth
- next-intl
- multitenancy por subdominio

## 1. Contexto del producto

CPM Studio busca unificar varios productos académicos existentes:

- `Dismissal`
  Control operativo del despacho de estudiantes. Tiene tiempo real, campus, operadores, estudiantes, vehículos y una cola visual.
- `Alef University`
  Registro académico: programas, cursos, clases, periodos académicos, estudiantes, profesores, notas finales y biblioteca.
- `CPCA Teachers`
  Seguimiento del progreso docente, curriculum, lessons, evidencias de clase y eventualmente evaluaciones.
- `CPCA-Sports`
  Aplicaciones, becas deportivas, cuentas familiares y cobros/pagos. La evolución natural es convertirlo en un módulo de cuentas y cobros escolares, no solo deportivos.
- `Flexidual`
  Clases virtuales, sesiones LiveKit, asistencia, evidencias de clase, curriculum y calendario académico.

La plataforma nueva no debe copiar estos productos como aplicaciones separadas mal pegadas. Debe absorber sus capacidades como módulos de negocio coherentes dentro de un solo producto multi-tenant.

## 2. Decisión principal

La recomendación es:

- `modular monolith`
- `multi-tenant`
- `DDD ligero`
- `hexagonal solo dentro de módulos con reglas fuertes`
- `capabilities / entitlements` como capa transversal del producto

No recomiendo:

- microservicios desde el día uno
- plugin architecture runtime tipo IDE
- hexagonal dogmático para absolutamente todo
- modelar todo el negocio directamente encima de `users`

## 3. Qué significa esto en la práctica

### 3.1 Modular monolith

Una sola app Next.js y un solo backend Convex.

Razones:

- tus módulos comparten identidad, auth, permisos, branding, archivos, auditoría y navegación
- varios flujos cruzan módulos
- Convex ya ofrece consistencia transaccional y tiempo real dentro de un solo backend
- el costo de microservicios aquí llegaría mucho antes que sus beneficios

### 3.2 No plugin architecture pura

Los módulos no son extensiones de terceros. Son dominios tuyos.

La palabra correcta aquí no es “plugin”, sino:

- `módulo`
- `capacidad`
- `bounded context`

Sí puede existir un `module registry` o `manifest`, pero no como sistema de plugins cargados dinámicamente.

### 3.3 Capabilities, no feature flags simples

No modelar esto como:

```ts
ENABLE_LIBRARY = true
```

Eso sirve para despliegue técnico, no para SaaS multi-tenant.

Lo correcto es un sistema formal de:

- capacidades contratadas/habilitadas por organización
- permisos por rol/usuario dentro de cada capacidad
- configuración por módulo

## 4. Principios de arquitectura

1. `El router no es el dominio`
   `app/` debe resolver rutas, metadata, layout y composición. El negocio no debe quedar enterrado allí.

2. `El módulo no depende del router; el router depende del módulo`

3. `users no es igual a people`
   Las cuentas autenticadas no alcanzan para modelar estudiantes, padres, profesores, acudientes y personas sin login todavía.

4. `Capability` y `permission` no son lo mismo
   Una institución puede tener un módulo habilitado y aun así un usuario no tener permiso para usar cierta acción.

5. `Tenant partition first`
   Toda tabla de negocio debe estar correctamente particionada por organización, y por campus cuando tenga sentido real.

6. `Convex Components son una herramienta selectiva, no la arquitectura base`

7. `Evitar sobreingeniería temprana`
   Diseñar para crecer, pero no construir hoy abstracciones que solo serían útiles si ya existieran tres implementaciones reales.

8. `Las invariantes cross-table no viven en el schema`
   En Convex no hay foreign keys ni constraints relacionales tradicionales. Las invariantes entre tablas deben centralizarse en helpers e internal mutations, no quedar como convención implícita.

9. `No dupliques contacto canónico sin ownership explícito`
   Si `email` o `phone` viven en `users`, no deben copiarse a `people` salvo que exista un write path y una política clara de sincronización o de propiedad del dato.

## 5. Evaluación del estado actual del repo

Lo que ya está bien:

- multitenancy por subdominio
- auth y platform core inicial
- organizations + memberships + platform team
- Convex Auth correctamente montado
- frontend y App Router razonablemente limpios

Archivos clave actuales:

- [convex/schema.ts](../convex/schema.ts)
- [convex/organizations.ts](../convex/organizations.ts)
- [convex/platformTeam.ts](../convex/platformTeam.ts)
- [convex/lib/authz.ts](../convex/lib/authz.ts)
- [app/[locale]/(app)/platform/page.tsx](../app/[locale]/(app)/platform/page.tsx)

Lo que todavía no existe y debe introducirse antes de que entren módulos grandes:

- `campuses`
- `people`
- `organizationPeople`
- `organizationPersonRoles`
- `organizationCapabilities`
- una separación más fuerte por dominios dentro de `convex/`

Conclusión: lo actual sí convive con la arquitectura propuesta, pero no conviene construir `Dismissal` o `Academics` directamente encima del modelo actual sin primero dar estos pasos base.

## 6. Arquitectura objetivo

## 6.1 Capas grandes

- `platform core`
- `business modules`
- `cross-cutting services`

### Platform core

Debe contener solo lo que atraviesa múltiples módulos:

- organizations
- campuses
- users
- people
- organization memberships
- authz
- capabilities / entitlements
- locales
- branding
- files/media shared
- audit log
- notifications contract

### Business modules

Módulos candidatos iniciales:

- dismissal
- academics
- library
- teaching
- billing
- liveClasses

### Cross-cutting services

Servicios transversales:

- audit
- notifications
- media
- scheduled workflows

## 6.2 Estructura recomendada

No hace falta mover hoy todo a `src/`, pero sí definir una dirección clara.

Estructura sugerida:

```txt
app/
  [locale]/
    (public)/
    (app)/
      platform/
      [tenant]/

modules/
  dismissal/
    domain/
    application/
    infrastructure/
    presentation/
    manifest.ts
  academics/
    domain/
    application/
    infrastructure/
    presentation/
    manifest.ts
  library/
    domain/
    application/
    infrastructure/
    presentation/
    manifest.ts
  teaching/
    domain/
    application/
    infrastructure/
    presentation/
    manifest.ts
  billing/
    domain/
    application/
    infrastructure/
    presentation/
    manifest.ts
  live-classes/
    domain/
    application/
    infrastructure/
    presentation/
    manifest.ts

convex/
  platform/
  modules/
    dismissal/
    academics/
    library/
    teaching/
    billing/
    liveClasses/
  lib/

lib/
  tenancy/
  navigation/
  auth/
  files/
  organizations/
```

Observación:

- `app/` sigue siendo el adaptador web
- `modules/` contiene el dominio y la presentación reusable por módulo
- `convex/` refleja también el mismo corte por bounded contexts

## 7. Modelo núcleo recomendado

## 7.1 Organizations y campuses

Base mínima:

- `organizations`
- `campuses`
- `organizationMemberships`

Regla:

- `organization` es el tenant
- `campus` es una subdivisión operativa de ese tenant

No todos los módulos necesitarán campus desde el día uno, pero el modelo debe existir desde temprano.

## 7.2 Users no basta: introducir People

No modelar el sistema con solo `users`.

### Propuesta

- `users`
  Cuenta autenticada con vínculo opcional `personId`
- `people`
  Persona del dominio
- `organizationPeople`
  Afiliación de una persona a una organización

Esto permite:

- un estudiante sin login todavía
- un padre con cuenta y varios hijos
- un profesor con cuenta
- una misma persona asociada a varios roles de negocio según la institución

### Ejemplo conceptual

```txt
users
  _id
  auth identity

people
  _id
  legal/display profile

organizationPeople
  organizationId
  personId
  status

organizationPersonRoles
  organizationPersonId
  role: student | teacher | guardian | staff | applicant
```

Luego cada módulo cuelga de `organizationPeople` o de entidades propias relacionadas.

Regla importante:

- `organizationPeople` no guarda campus principal o de referencia.
- Las asignaciones por campus viven en una tabla aparte.
- Si más adelante un módulo necesita un digest de campus por performance, debe añadirse con un write path único y una migración explícita.

## 7.3 Relaciones de negocio

No mezclar roles de auth con roles de dominio.

Separar:

- `platformRole`
  superadmin/viewer del producto
- `organizationMembership role`
  owner/admin/member del tenant
- `domain roles`
  student/teacher/guardian/staff/operator

## 8. Capabilities y entitlements

Esta es la decisión más importante del producto.

### 8.1 Qué debe existir

- `capability registry`
  Definido en código
- `organizationCapabilities`
  Qué módulos/capacidades están habilitados por institución
- `rolePermissions`
  Permisos finos por rol dentro del módulo

### 8.2 Ejemplo de capability keys

```txt
dismissal.core
academics.core
academics.grading
library.core
teaching.curriculum
teaching.evidence
billing.core
liveClasses.core
```

### 8.3 Reglas

- `capability` responde: ¿la institución tiene este módulo?
- `permission` responde: ¿este usuario puede ejecutar esta acción?

### 8.4 Qué no haría todavía

No implementaría desde ya:

- overrides por usuario
- entitlements por campus
- dependencias complejas entre subcapacidades

Sí dejaría el diseño listo para soportarlo.

### 8.5 Orden recomendado

Primero:

- capability registry en código
- `organizationCapabilities`

Después, si el negocio lo exige:

- campus overrides
- plan defaults
- overrides especiales

## 9. Convex: cómo debe usarse

## 9.1 Recomendación principal

Usar Convex normal como backend principal para casi todos los módulos.

Eso implica:

- queries públicas
- mutations públicas
- internal queries/mutations/actions
- helpers de dominio en `convex/lib` o dentro del módulo
- índices buenos

## 9.2 Qué sí hacer en Convex

- validar args siempre
- usar `internal*` para fronteras sensibles
- modelar índices por organización y campus cuando aplique
- mantener tablas por bounded context
- separar datos de alto churn de datos estables

Esto último es especialmente importante para `Dismissal`.

Ejemplo:

- `students` o perfiles estables en una tabla
- `pickupQueueEntries`, `vehicleArrivals`, `laneState` en tablas separadas

No meter estado operativo de alta frecuencia en el mismo documento de perfil.

## 9.3 Sobre Convex Components

No convertiría todos los módulos de negocio en Components desde el día uno.

### Motivo

Según la documentación oficial, los Components son backend modules autocontenidos con aislamiento fuerte. Eso es excelente cuando el aislamiento es el objetivo. Pero también implica límites:

- no tienen `ctx.auth` del app
- no leen `process.env` directamente
- no ven tablas del app salvo por contrato
- añaden una frontera explícita adicional

Eso los hace muy buenos para:

- servicios reutilizables
- motores técnicos encapsulados
- integraciones bien cerradas

Y menos adecuados como base inicial para tus bounded contexts principales del producto.

### Cuándo sí usarlos

Sí evaluaría Components para:

- notificaciones
- workflow engine / jobs
- motores de colaboración
- algún subsistema reusable entre varios proyectos

### Cuándo no usarlos todavía

No los usaría aún para:

- dismissal
- academics
- library
- teaching
- billing
- liveClasses

Esos deben empezar como módulos del app principal.

## 10. Modelo de datos por módulo

## 10.1 Regla transversal

Casi toda tabla de negocio debe estar correctamente particionada:

- `organizationId`
- `campusId` cuando tenga sentido real

Y los índices deben empezar por esa partición cuando la consulta lo requiera.

### Ejemplos

```txt
dismissalQueueEntries
  by_organization_campus_and_status

academicPrograms
  by_organization

courseOfferings
  by_organization_and_period

libraryDocuments
  by_organization_and_collection
```

## 10.2 Evitar error clásico

No confiar en el `tenant` que llega del cliente como base de seguridad.

La autorización debe derivarse de:

- hostname -> organization
- sesión actual
- membership / access resolution
- capability resolution

## 11. Integración entre módulos

No recomiendo que los módulos se llamen entre sí de forma arbitraria y desordenada.

### Regla

- invariantes cercanas: llamadas síncronas controladas
- side effects: outbox / event log / scheduler

### Ejemplo

Si `liveClasses` genera evidencia que interesa a `teaching`:

- no hagas imports cruzados por todos lados
- registra un evento de dominio o outbox
- procesa la proyección o side effect aparte

No introduciría un event bus complejo desde el día uno.

Sí introduciría una convención simple cuando aparezca el primer caso real.

## 12. Recomendación de módulos iniciales

Orden sugerido:

1. `platform core`
2. `capabilities`
3. `campuses`
4. `people`
5. `dismissal`
6. `academics core`
7. `library`
8. `teaching`
9. `billing`
10. `liveClasses`

## 13. Por qué Dismissal debería ser el primer módulo piloto

Porque obliga a resolver correctamente:

- tiempo real
- estado operativo de alto churn
- campus
- estudiantes y guardianes
- operadores
- visualización inmediata

Si la arquitectura sobrevive bien a `Dismissal`, es una buena señal para el resto.

Si la arquitectura no soporta bien `Dismissal`, conviene descubrirlo temprano.

## 14. Refactor recomendado antes de meter el primer módulo grande

No es un rewrite. Es una preparación.

### Hacer ahora

1. Reorganizar `convex/` en:
   - `platform/`
   - `modules/`
   - `lib/` solo para cross-cutting real

2. Introducir `campuses`

3. Introducir `people`, vínculo `users.personId`, `organizationPeople`

4. Introducir `capability registry` + `organizationCapabilities`

5. Definir una convención de `module manifest`

6. Empezar a mover la presentación de negocio futura fuera de `app/`

### No hacer todavía

- microservicios
- campus entitlements complejos
- Components para cada módulo
- event bus grande
- abstraer de más sin primer módulo real

## 15. Estado recomendado del schema a corto plazo

No es el schema final. Es la siguiente base correcta.

```txt
users
organizations
campuses
organizationMemberships

people
organizationPeople
organizationPersonRoles
guardianRelationships

organizationCapabilities
```

Con eso ya puedes construir módulos reales sin hipotecar el diseño.

Reglas importantes:

- `guardianRelationships` debe referenciar `organizationPeople`, no `people`.
- La relación de guardianía es institucional, así que debe quedar anclada a la afiliación local al tenant.
- La configuración de un módulo debe vivir en su propio contrato.
- No debe existir una bolsa opaca global para settings de módulos antes de que el módulo real exista.

## 16. Estado recomendado del frontend a corto plazo

### App Router

Mantener:

- `(public)`
- `(app)`
- `platform`
- `[tenant]`

Pero a nivel de negocio, los módulos nuevos no deben vivir solo como route folders. Deben tener su propio espacio reusable.

### UI y navegación

La navegación del tenant debe construirse desde:

- capabilities resueltas
- rol efectivo
- contexto de organización

No hardcodear menús enteros con `if`s dispersos.

## 17. Regla de oro para esta fase

La arquitectura debe optimizar:

- claridad
- separación de límites
- evolución por módulos

No debe optimizar prematuramente:

- despliegue distribuido
- extensibilidad de terceros
- abstracción por pura elegancia

## 18. Conclusión

La mejor decisión para CPM Studio hoy es:

- un `modular monolith`
- multi-tenant
- con `platform core` explícito
- módulos de negocio autónomos
- `capabilities` por organización
- `people` como núcleo del dominio, no solo `users`
- Convex normal como backend principal
- Convex Components solo en piezas realmente encapsulables y reutilizables

## 19. Decisiones explícitas

### Sí

- modular monolith
- bounded contexts
- DDD ligero
- capabilities
- people model
- Convex internal functions
- tenant-aware indexing

### No por ahora

- microservicios
- plugin runtime
- Components para todo
- campus entitlements complejos
- event bus grande
- arquitectura hexagonal rígida en todo el sistema

## 20. Próximo paso recomendado

El siguiente documento o implementación debe aterrizar esto en:

1. estructura exacta de carpetas para este repo
2. primer schema target del core
3. diseño de `capability registry`
4. diseño de `people`
5. primer módulo piloto: `dismissal`

Si una decisión futura contradice este documento, conviene tratarla como una decisión arquitectónica explícita, no como un cambio casual.
