// convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define reusable validators for clarity and consistency
const tipoEventoValidator = v.union(
  v.literal("Gol"), v.literal("Tarjeta Amarilla"), v.literal("Tarjeta Roja"),
  v.literal("Sustitución"), v.literal("Falta"), v.literal("Tiro de Esquina"),
  v.literal("Tiro Libre"), v.literal("Inicio Partido"), v.literal("Descanso"),
  v.literal("Segundo Tiempo"), v.literal("Fin Partido"), v.literal("Penal")
);

const estadoArbitrajeValidator = v.union(
    v.literal("sin_asignar"), v.literal("en_progreso"), v.literal("asignado"),
    v.literal("confirmado"), v.literal("finalizado")
);


export default defineSchema({
  // =================================================================
  // USERS & PROFILES
  // =================================================================
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    userName: v.string(),
    personaId: v.id("personas"),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_persona_id", ["personaId"]),

  personas: defineTable({
    nombrePersona: v.string(),
    apellidoPersona: v.string(),
    fechaNacimiento: v.string(), // ISO 8601 YYYY-MM-DD
    numeroDocumento: v.string(),
    tipoDocumentoId: v.id("tiposDocumento"),
    nacionId: v.optional(v.id("naciones")),
    genero: v.optional(v.string()),
  }).index("by_numero_documento", ["numeroDocumento"]),

  // =================================================================
  // LOOKUP TABLES (Data that rarely changes)
  // =================================================================
  naciones: defineTable({
    nombre: v.string(),
  }),

  tiposDocumento: defineTable({
    nombreDocumento: v.string(),
    codigoDocumento: v.string(),
  }),

  tiposLicencia: defineTable({
    nombre: v.string(),
  }),

  categoriasEdad: defineTable({
    nombre: v.string(),
    edadMaxima: v.number(),
  }),

  posicionesCancha: defineTable({
    nombre: v.string(),
    codigo: v.string(),
    descripcion: v.string(),
  }),

  // =================================================================
  // CORE ENTITIES
  // =================================================================
  escuelas: defineTable({
    nombreEscuela: v.string(),
    comet: v.optional(v.string()),
    nit: v.optional(v.string()),
    direccion: v.optional(v.string()),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
  }),

  ligas: defineTable({
    nombre: v.string(),
    descripcion: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    activo: v.boolean(),
  }),

  federacionArbitros: defineTable({
    nombre: v.string(),
    nit: v.string(),
    direccion: v.string(),
    telefono: v.string(),
    email: v.string(),
    nacionId: v.id("naciones"),
    ciudad: v.string(),
    presidente: v.string(),
    fechaFundacion: v.optional(v.string()),
    numeroRegistro: v.string(),
    estado: v.union(v.literal("activa"), v.literal("inactiva"), v.literal("suspendida")),
    logoStorageId: v.optional(v.id("_storage")),
  }),

  // =================================================================
  // ROLE-SPECIFIC PROFILES
  // =================================================================
  jugadores: defineTable({
    personaId: v.id("personas"),
    escuelaId: v.id("escuelas"),
    posicionId: v.id("posicionesCancha"),
    comet: v.string(),
    categoriaEdadId: v.optional(v.id("categoriasEdad")),
    fotoStorageId: v.optional(v.id("_storage")),
  }).index("by_persona_id", ["personaId"]),

  entrenadores: defineTable({
    personaId: v.id("personas"),
    escuelaId: v.optional(v.id("escuelas")),
    comet: v.string(),
    fechaIngresoEscuela: v.string(),
    tipoLicenciaId: v.optional(v.id("tiposLicencia")),
    fotoStorageId: v.optional(v.id("_storage")),
  }).index("by_persona_id", ["personaId"]),

  arbitros: defineTable({
    personaId: v.id("personas"),
    federacionId: v.id("federacionArbitros"),
    numeroLicencia: v.string(),
    categoria: v.union(v.literal("FIFA"), v.literal("Nacional"), v.literal("Regional"), v.literal("Novato")),
    tipo: v.union(v.literal("Principal"), v.literal("Asistente"), v.literal("Cuarto")),
    fechaCertificacion: v.string(),
    estado: v.union(v.literal("activo"), v.literal("inactivo"), v.literal("suspendido"), v.literal("retirado")),
  }).index("by_persona_id", ["personaId"]),

  // =================================================================
  // TEAMS & TOURNAMENTS
  // =================================================================
  equipos: defineTable({
    nombre: v.string(),
    escuelaId: v.id("escuelas"),
    categoriaEdadId: v.optional(v.id("categoriasEdad")),
    entrenadorId: v.optional(v.id("entrenadores")),
  }).index("by_escuela", ["escuelaId"]),

  jugadoresPorEquipo: defineTable({
      jugadorId: v.id("jugadores"),
      equipoId: v.id("equipos"),
      numeroCamiseta: v.optional(v.number()),
  }).index("by_equipo", ["equipoId"]),


  torneos: defineTable({
    nombre: v.string(),
    descripcion: v.optional(v.string()),
    fechaInicio: v.string(),
    fechaFin: v.optional(v.string()),
    categoriaEdadId: v.id("categoriasEdad"),
    ligaId: v.id("ligas"),
    estado: v.union(v.literal("activo"), v.literal("finalizado"), v.literal("suspendido")),
  }),

  torneoFases: defineTable({
      nombre: v.string(),
      torneoId: v.id("torneos"),
      tipoFase: v.union(v.literal("Grupos"), v.literal("Eliminatoria"), v.literal("Liga")),
      orden: v.number(),
  }).index("by_torneo", ["torneoId"]),

  torneoGrupos: defineTable({
      nombre: v.string(),
      torneoFaseId: v.id("torneoFases"),
      descripcion: v.optional(v.string()),
      orden: v.optional(v.number()),
  }).index("by_fase", ["torneoFaseId"]),

  equiposPorGrupo: defineTable({
      equipoId: v.id("equipos"),
      grupoId: v.id("torneoGrupos"),
  }).index("by_grupo", ["grupoId"]),


  // =================================================================
  // MATCHES
  // =================================================================
  partidos: defineTable({
    fecha: v.string(), // ISO 8601 format with time
    grupoId: v.id("torneoGrupos"),
    equipoLocalId: v.id("equipos"),
    equipoVisitanteId: v.id("equipos"),
    arbitroId: v.optional(v.id("arbitros")),
    estadoArbitraje: v.optional(estadoArbitrajeValidator),
    golesLocal: v.optional(v.number()),
    golesVisitante: v.optional(v.number()),
  }).index("by_grupo", ["grupoId"]),

  partidoEventos: defineTable({
    partidoId: v.id("partidos"),
    tipoEvento: tipoEventoValidator,
    minuto: v.number(),
    equipo: v.union(v.literal("local"), v.literal("visitante")),
    jugadorId: v.optional(v.id("jugadores")),
    jugadorSustituidoId: v.optional(v.id("jugadores")), // For substitutions
    descripcion: v.optional(v.string()),
  }).index("by_partido", ["partidoId"]),

  // =================================================================
  // TRAINING & ATTENDANCE
  // =================================================================

  gruposEntrenamiento: defineTable({
    entrenadorId: v.id("entrenadores"),
    categoriaEdadId: v.id("categoriasEdad"),
    escuelaId: v.id("escuelas"),
    anio: v.optional(v.number()),
  }).index("by_entrenador", ["entrenadorId"]),

  sesionesEntrenamiento: defineTable({
    grupoEntrenamientoId: v.id("gruposEntrenamiento"),
    entrenadorId: v.id("entrenadores"),
    fecha: v.string(), // ISO 8601
    jornada: v.union(v.literal("mañana"), v.literal("tarde")),
    nombre: v.string(),
    descripcion: v.string(),
    duracion: v.number(), // in minutes
    // More detailed fields can be added here as needed
  }).index("by_grupo", ["grupoEntrenamientoId"]),

  asistenciaEstados: defineTable({
      nombre: v.string(),
      codigo: v.string(), // e.g., "P", "A", "J"
      color: v.string(), // Hex color for UI
  }).index("by_codigo", ["codigo"]),

  asistencias: defineTable({
    jugadorId: v.id("jugadores"),
    sesionEntrenamientoId: v.id("sesionesEntrenamiento"),
    estadoId: v.id("asistenciaEstados"),
    observaciones: v.optional(v.string()),
  })
    .index("by_sesion", ["sesionEntrenamientoId"])
    .index("by_jugador_sesion", ["jugadorId", "sesionEntrenamientoId"]),

  jugadoresPorPartido: defineTable({
    partidoId: v.id("partidos"),
    equipoId: v.id("equipos"),
    jugadorId: v.id("jugadores"),
    rolEnPartido: v.union(v.literal("titular"), v.literal("suplente")),
    numeroCamisetaPartido: v.optional(v.number()),
  })
    // Indexes to efficiently query lineups for a specific match/team
    .index("by_partido_equipo", ["partidoId", "equipoId"])
    .index("by_partido_jugador", ["partidoId", "jugadorId"]),

});