# Referencias de arquitectura v1

> **Estado: bibliografía histórica de CPM Studio, no normativa.** Algunas rutas y referencias ya no existen y el stack objetivo difiere de Futbolya. Verificar toda API en documentación oficial y usar [`../AGENTS.md`](../AGENTS.md) como política vigente.

Documento de consulta para la fase de fundación arquitectónica de CPM Studio.

Rama de trabajo asociada:

- `arch/foundation-v2`

Este archivo complementa [ruta-sugerida-v2.md](./ruta-sugerida-v2.md).  
La v2 deja la decisión arquitectónica. Este documento deja la bibliografía y repos guía para contrastar decisiones a medida que avance la implementación.

## 1. Objetivo de estas referencias

Usar estas fuentes para validar decisiones sobre:

- multi-tenancy
- organización modular de Next.js
- Convex como backend principal
- auth y authorization
- file storage
- capacidades por organización
- futuros módulos como `dismissal`, `academics`, `library`, `teaching`, `billing` y `liveClasses`

## 2. Lectura recomendada

Orden sugerido:

1. [ruta-sugerida-v2.md](./ruta-sugerida-v2.md)
2. Convex: components, best practices, database, functions, auth, file storage
3. Next.js: App Router structure, route groups, metadata
4. Vercel: domains, wildcard domains, multi-tenant template
5. next-intl: routing y domain-based routing
6. Repos guía

## 3. Documentación oficial: Convex

### 3.1 Components

- Convex Components: Understanding  
  https://docs.convex.dev/components/understanding  
  Uso: entender qué resuelven, qué aíslan y por qué no conviene convertir todos los módulos de negocio en Components desde el día uno.

- Convex Components: Using Components  
  https://docs.convex.dev/components/using-components  
  Uso: integración desde el app principal, límites de API y llamadas `ctx.runQuery/runMutation`.

- Convex Components: Authoring Components  
  https://docs.convex.dev/components/authoring-components  
  Uso: solo si en algún momento se decide encapsular subsistemas como notificaciones, workflows o colaboración.

### 3.2 Buenas prácticas

- Convex Best Practices  
  https://docs.convex.dev/understanding/best-practices/  
  Uso: criterios generales de modelado, límites de funciones, schema, consultas y mutaciones.

- Convex TypeScript Best Practices  
  https://docs.convex.dev/understanding/best-practices/typescript  
  Uso: tipos estrictos, validators, `Id<...>`, `Doc<...>`, separación correcta entre validación runtime y tipado.

### 3.3 Functions

- Functions overview  
  https://docs.convex.dev/functions  
  Uso: modelo general de queries, mutations, actions e internal functions.

- Argument and return validation  
  https://docs.convex.dev/functions/validation  
  Uso: mantener contracts estrictos entre cliente y backend, y entre capas internas.

- Application errors  
  https://docs.convex.dev/functions/error-handling/application-errors  
  Uso: errores esperados de negocio y contratos de falla claros.

### 3.4 Database

- Database overview  
  https://docs.convex.dev/database  
  Uso: principios de modelado, índices, lectura y escritura.

- Schema  
  https://docs.convex.dev/database/schemas  
  Uso: diseño de tablas e índices.

- Indexes  
  https://docs.convex.dev/database/indexes/  
  Uso: diseño tenant-first y campus-aware de índices.

### 3.5 File storage

- File Storage  
  https://docs.convex.dev/file-storage  
  Uso: uploads, serving, lifecycle y límites.

- Upload files  
  https://docs.convex.dev/file-storage/upload-files  
  Uso: patrón correcto de upload URL + persistencia de `storageId`.

- Serve files  
  https://docs.convex.dev/file-storage/serve-files  
  Uso: resolución de URLs y serving.

- File metadata  
  https://docs.convex.dev/file-storage/file-metadata  
  Uso: validación de tipo y tamaño antes de persistir referencias.

### 3.6 Auth

- Auth overview  
  https://docs.convex.dev/auth  
  Uso: panorama general y decisión entre Convex Auth y auth third-party.

- Convex Auth  
  https://docs.convex.dev/auth/convex-auth  
  Uso: entender el alcance real, limitaciones y estado del producto.

- Auth in functions  
  https://docs.convex.dev/auth/functions-auth  
  Uso: identidad en backend y enforcement server-side.

- Storing users in the Convex database  
  https://docs.convex.dev/auth/database-auth  
  Uso: diferencia entre identidad autenticada y datos de usuario persistidos.

## 4. Documentación oficial: Next.js

### 4.1 Estructura y App Router

- Project Structure  
  https://nextjs.org/docs/app/getting-started/project-structure  
  Uso: estructura de carpetas, route groups, layouts y organización sin afectar URLs.

- Route Groups  
  https://nextjs.org/docs/app/building-your-application/routing/route-groups  
  Uso: separar `(public)`, `(app)` y futuros grupos sin contaminar la URL.

- Server and Client Components  
  https://nextjs.org/docs/app/getting-started/server-and-client-components  
  Uso: mantener la frontera correcta entre páginas server-first y componentes cliente.

### 4.2 Metadata

- generateMetadata  
  https://nextjs.org/docs/app/api-reference/functions/generate-metadata  
  Uso: metadata jerárquica y dinámica para organizaciones y páginas de plataforma.

### 4.3 Otros puntos útiles

- Loading UI and Streaming  
  https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming  
  Uso: estados de carga bien segmentados cuando lleguen módulos más pesados.

- Error Handling  
  https://nextjs.org/docs/app/building-your-application/routing/error-handling  
  Uso: `error.tsx`, `not-found.tsx` y límites de error por segmento.

## 5. Documentación oficial: Vercel

### 5.1 Multi-tenancy y dominios

- Domains overview  
  https://vercel.com/docs/domains  
  Uso: conceptos base de domains, subdomains y wildcard domains.

- Working with domains  
  https://vercel.com/docs/domains/working-with-domains  
  Uso: wildcard domains, nameservers y restricciones reales.

- Adding a domain  
  https://vercel.com/docs/domains/working-with-domains/add-a-domain  
  Uso: configuración operativa de dominios y subdominios.

- Configuring custom domains for multi-tenant platforms  
  https://vercel.com/platforms/docs/multi-tenant-platforms/configuring-domains  
  Uso: referencia concreta para plataformas multi-tenant en Vercel.

### 5.2 Template de referencia

- Multi-Tenant Template  
  https://vercel.com/platforms/docs/examples/multi-tenant-template  
  Uso: patrón de referencia para subdominios, preview URLs y panel administrativo.

## 6. Documentación oficial o primaria: next-intl

### 6.1 Punto de entrada

- next-intl home / docs entrypoint  
  https://next-intl.dev/  
  Uso: documentación principal y acceso a examples.

### 6.2 Material útil para este proyecto

- Learn next-intl  
  https://learn.next-intl.dev/  
  Uso: curso/material del autor con ejemplos App Router y routing avanzado.

- Proxies and middleware  
  https://learn.next-intl.dev/chapters/06-routing/03-proxy  
  Uso: coordinación entre locale routing y proxy.

- Domain-based routing  
  https://learn.next-intl.dev/chapters/06-routing/06-domain-based  
  Uso: coordinación entre dominio/subdominio y locales.

- Localized pathnames  
  https://learn.next-intl.dev/chapters/06-routing/08-localized-pathnames  
  Uso: si más adelante se localizan rutas visibles al usuario.

Nota:

- El material de `learn.next-intl.dev` combina partes públicas y partes de pago. Aun así, sirve como índice muy útil de temas relevantes para este stack.

## 7. Repos y ejemplos públicos útiles

### 7.1 Vercel

- `vercel/platforms`  
  https://github.com/vercel/platforms  
  Relevancia:
  - multi-tenancy por subdominio
  - panel administrativo
  - patrón de host resolution
  - preview URLs

### 7.2 Convex

- `get-convex/template-nextjs-convexauth-shadcn`  
  https://github.com/get-convex/template-nextjs-convexauth-shadcn  
  Relevancia:
  - base de Next.js + Convex + Convex Auth + shadcn
  - buen punto de comparación para auth y estructura inicial

- `get-convex/templates`  
  https://github.com/get-convex/templates  
  Relevancia:
  - catálogo de templates oficiales
  - útil para comparar decisiones de setup y boundaries

### 7.3 next-intl

- `next-intl` example app router  
  https://next-intl-example-app-router.vercel.app/en  
  Relevancia:
  - ejemplo vivo de App Router con next-intl

- `amannn/next-intl` examples  
  https://github.com/amannn/next-intl/tree/main/examples/example-app-router  
  Relevancia:
  - ejemplo oficial del autor para App Router

### 7.4 LiveKit

- `livekit-examples`  
  https://github.com/livekit-examples  
  Relevancia:
  - catálogo oficial de ejemplos LiveKit
  - útil para el futuro módulo `liveClasses`

- `livekit/components-js`  
  https://github.com/livekit/components-js  
  Relevancia:
  - componentes React oficiales
  - incluye ejemplos Next.js

## 8. Referencias locales dentro de este repo

Estas referencias ya están disponibles localmente y deben seguirse contrastando:

- [ruta-sugerida-v2.md](./ruta-sugerida-v2.md)
- [ruta-sugerida-v1.md](./ruta-sugerida-v1.md)
- [.agents/examples/platforms-main](./examples/platforms-main)
- [.agents/examples/convex-auth-example-main](./examples/convex-auth-example-main)
- [.agents/examples/cpca-sports-main](./examples/cpca-sports-main)

## 9. Qué usar para qué

### Si la duda es sobre multitenancy

Consultar primero:

- `vercel/platforms`
- Vercel domains docs
- `ruta-sugerida-v2.md`

### Si la duda es sobre Convex Components

Consultar primero:

- Convex Components: Understanding
- Convex Components: Using Components
- `ruta-sugerida-v2.md` sección de Components

### Si la duda es sobre auth y autorización

Consultar primero:

- Convex Auth
- Auth in functions
- Storing users in the database
- schema y authz actuales del repo

### Si la duda es sobre organización del frontend

Consultar primero:

- Next.js project structure
- route groups
- server/client components
- `ruta-sugerida-v2.md`

## 10. Criterios de decisión que estas referencias sostienen

Hasta nuevo aviso, estas son las conclusiones respaldadas por las fuentes consultadas:

- usar `modular monolith`
- mantener un solo Convex como backend principal
- no usar microservicios todavía
- no usar plugin runtime como base
- tratar `Convex Components` como herramienta selectiva
- introducir `people` como núcleo de dominio y no depender solo de `users`
- modelar `capabilities` por organización
- mantener tablas e índices `tenant-aware`

## 11. Próximos documentos sugeridos

Después de este archivo, los siguientes documentos útiles serían:

1. `plan-implementacion-core-v1.md`
2. `schema-core-target-v1.md`
3. `capability-registry-v1.md`
4. `people-model-v1.md`
5. `dismissal-modulo-v1.md`

