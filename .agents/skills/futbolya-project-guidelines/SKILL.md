---
name: futbolya-project-guidelines
description: Contexto obligatorio de arquitectura, dominio, tecnologías y reglas de implementación de Futbolya. Usar antes de escribir, modificar, refactorizar, revisar o depurar cualquier código del proyecto, y combinar con la skill específica de Next.js, React, Convex, Clerk, next-intl o shadcn que corresponda.
---

# Futbolya Project Guidelines

Usa esta skill antes de implementar, modificar, refactorizar, revisar o depurar código. Es un workflow: `AGENTS.md` contiene la política normativa; las referencias de esta skill son snapshots derivados que se contrastan con el estado productivo.

## Secuencia obligatoria

1. Lee [`../../../AGENTS.md`](../../../AGENTS.md).
2. Lee [references/architecture.md](./references/architecture.md) para ubicar la feature, el flujo de datos y sus fronteras.
3. Lee [references/technology-guidelines.md](./references/technology-guidelines.md) en las secciones de las tecnologías afectadas.
4. Activa las skills especializadas señaladas por `AGENTS.md`.
5. Inspecciona los archivos y call sites reales antes de editar.
6. Si una API es sensible a versión, contrástala con la documentación oficial enlazada en las referencias.

No cargues repositorios de `.agents/examples/` salvo que la tarea pida estudiar explícitamente una referencia externa.


## Preguntas de diseño

Antes de implementar, responde con el código —no necesariamente en prosa—:

1. ¿Cuál es el tenant y cómo se prueba ownership en backend?
2. ¿La lógica es presentación, coordinación o invariante de dominio?
3. ¿Convex ya ofrece el flujo reactivo y la transacción necesarios?
4. ¿Existe un componente, helper, ruta, validator o permiso reutilizable?
5. ¿La abstracción resuelve repetición real o sólo una posibilidad futura?
6. ¿El cambio requiere migración de datos o compatibilidad temporal?
7. ¿Qué estados de UI, traducciones y controles de accesibilidad faltan?
8. ¿Cuál es la validación más pequeña que demuestra el cambio?


## Al terminar

- Ejecuta validación específica y luego TypeScript si corresponde.
- Revisa el diff para detectar duplicación, cruces de frontera y cambios accidentales.
- Reporta qué se validó realmente y cualquier limitación del entorno.
- No arregles deudas ajenas salvo que bloqueen el cambio o el usuario lo solicite.
