# Sistema de agentes de Futbolya

Este directorio reúne skills, snapshots, investigación histórica y aplicaciones externas de referencia. No todo su contenido tiene la misma autoridad ni se carga automáticamente.

La política normativa global está en [`../AGENTS.md`](../AGENTS.md). Antes de implementar, modificar, refactorizar, revisar o depurar código se debe activar [`skills/futbolya-project-guidelines/SKILL.md`](./skills/futbolya-project-guidelines/SKILL.md).

## Clasificación

| Ruta | Función | Autoridad | Activación |
|---|---|---|---|
| `skills/*/SKILL.md` | Workflows especializados | Procedimental; subordinada a `AGENTS.md` y al código vigente | Por coincidencia de la descripción o invocación explícita |
| `skills/futbolya-project-guidelines/` | Workflow y snapshots derivados del proyecto | Procedimental; nunca prevalece sobre `AGENTS.md` ni el estado productivo | Obligatoria para implementación, revisión y depuración |
| `instructions/` | Snapshots locales de documentación | Consulta secundaria; puede quedar obsoleta | No automática |
| `examples/` | Repositorios externos | No autoritativa | Sólo consulta explícita |
| markdown de esta carpeta | Investigación de otro producto | Histórica o conceptual | No automática |

## Regla sobre ejemplos

Todo archivo bajo `examples/**` pertenece a una aplicación externa de referencia. Puede ayudar a estudiar un flujo, una interacción o una decisión visual, pero nunca se debe copiar como fuente de verdad para:

- arquitectura o estructura de carpetas;
- schema, índices o migraciones;
- auth, roles, tenancy o autorización;
- versiones de dependencias;
- convenciones de frontend;
- lógica de dominio de Futbolya.

Antes de reutilizar una idea, contrastarla con el código vigente, `AGENTS.md` y la documentación oficial de la versión instalada.

## Estado de documentos raíz

| Documento | Estado | Uso permitido |
|---|---|---|
| `academic-periods-domain-notes.md` | Conceptual, de dominio académico ajeno a Futbolya | Investigación histórica; no implementar en el schema actual |
| `ruta-sugerida-v2.md` | Histórico, CPM Studio; contiene rutas inexistentes | Contexto de decisiones antiguas |
| `referencias-arquitectura-v1.md` | Bibliografía histórica, parcialmente rota | Rastrear fuentes antiguas, no dirigir cambios |
| `flexidual-people-campus-architecture.md` | Borrador histórico, stack distinto | Investigación de Flexidual/CPM Studio |
| `flexidual-main-reference-audit.md` | Auditoría histórica de un ejemplo externo | Método de evaluación de referencias, no arquitectura vigente |
| `platform-people-guardian-academic-core-plan.md` | Plan histórico, rutas y módulos inexistentes | Contexto de otro producto |

Si un documento histórico contradice `AGENTS.md`, el código vigente o documentación oficial compatible, se ignora para implementaciones.

## Skills vigentes

Las skills existentes se agrupan en:

- proyecto: `futbolya-project-guidelines`;
- Convex: router, auth, migraciones, componentes y rendimiento;
- Next.js/React: App Router, Cache Components, composición y performance;
- UI: shadcn, diseño y auditoría web;
- documentación: guías, diagramas y escritura;
- operación: despliegue a Vercel.

Consultar la matriz completa y las condiciones de precedencia en [`../AGENTS.md`](../AGENTS.md).

## Snapshots documentales

`instructions/github-rest/` e `instructions/internationalization/` son copias locales extensas. No tienen un mecanismo de actualización ni garantizan corresponder a las versiones instaladas. Para cambios nuevos:

1. usar la skill pertinente;
2. comprobar la documentación oficial;
3. usar el snapshot sólo como respaldo offline;
4. no modificar dos copias de la misma documentación como si fueran fuentes independientes.

`instructions/internationalization/` también está duplicada bajo `.github/instructions/internationalization/`; ninguna copia es canónica. Los archivos directamente bajo `.github/instructions/*.instructions.md` son adaptadores mínimos hacia `AGENTS.md` y no deben acumular reglas duplicadas.

## Mantenimiento de este sistema

- Las reglas estables y transversales pertenecen en `AGENTS.md`.
- Una skill debe contener un workflow enfocado y referencias cargadas bajo demanda.
- Las decisiones arquitectónicas duraderas deberían convertirse en ADRs con estado, fecha y consecuencias.
- Los ejemplos deben conservar su etiqueta externa.
- No venderizar documentación oficial completa sin procedencia, versión, licencia y política de actualización.
- No duplicar reglas entre `AGENTS.md`, skills y snapshots; enlazar a la fuente correspondiente.
