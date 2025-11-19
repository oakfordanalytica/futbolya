import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// === ROLE DEFINITIONS ===
const platformRole = v.literal("SuperAdmin");
const leagueRole = v.literal("LeagueAdmin");
const clubRole = v.union(
  v.literal("ClubAdmin"),
  v.literal("TechnicalDirector"),
  v.literal("Player")
);
const officialRole = v.literal("Referee");
const allRoles = v.union(platformRole, leagueRole, clubRole, officialRole);

// === ORGANIZATION TYPES ===
const orgType = v.union(v.literal("league"), v.literal("club"), v.literal("system"));

// === STATUS ENUMS ===
const leagueStatus = v.union(v.literal("active"), v.literal("inactive"));
const clubStatus = v.union(
  v.literal("affiliated"),
  v.literal("invited"),
  v.literal("suspended")
);
const tournamentStatus = v.union(
  v.literal("draft"),
  v.literal("upcoming"),
  v.literal("ongoing"),
  v.literal("completed"),
  v.literal("cancelled")
);
const phaseStatus = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("completed")
);
const playerStatus = v.union(
  v.literal("active"),
  v.literal("injured"),
  v.literal("on_loan"),
  v.literal("inactive")
);

export default defineSchema({
  // ========================================
  // PART 1: USER MANAGEMENT & RBAC
  // ========================================

  /**
   * Core user profile linked to Clerk authentication.
   * Every user in the system has exactly one profile.
   */
  profiles: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  /**
   * Role assignments implementing multi-tenant RBAC.
   * A user can have multiple roles across different organizations.
   * organizationId is polymorphic (can be league or club ID).
   */
  roleAssignments: defineTable({
    profileId: v.id("profiles"),
    role: allRoles,
    organizationId: v.string(), // "global" for SuperAdmin or specific ID
    organizationType: orgType,  // Now includes "system"
    assignedAt: v.optional(v.number()),
    assignedBy: v.optional(v.id("profiles")),
  })
    .index("by_profileId", ["profileId"])
    .index("by_profileId_and_role", ["profileId", "role"]) 
    .index("by_profileId_and_organizationId", ["profileId", "organizationId"])
    .index("by_organizationId", ["organizationId"]),

  // ========================================
  // PART 2: ORGANIZATIONAL HIERARCHY
  // ========================================

  /**
   * Top-level tenant: A regional league (e.g., "Liga del Valle").
   * Leagues are affiliated with a national federation.
   */
  leagues: defineTable({
    name: v.string(),
    slug: v.string(), // URL-safe identifier
    shortName: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    federationId: v.optional(v.string()), // Reference to external federation
    region: v.optional(v.string()),
    country: v.string(),
    status: leagueStatus,
    foundedYear: v.optional(v.number()),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    address: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_country_and_region", ["country", "region"]),

  /**
   * Second-level tenant: A club affiliated with a league.
   * Clubs can be "affiliated" (permanent) or "invited" (temporary).
   */
  clubs: defineTable({
    name: v.string(),
    slug: v.string(),
    shortName: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    leagueId: v.id("leagues"),
    fifaId: v.optional(v.string()),
    headquarters: v.optional(v.string()),
    status: clubStatus,
    taxId: v.optional(v.string()), // NIT in Colombia
    foundedYear: v.optional(v.number()),
    colors: v.optional(v.array(v.string())),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_leagueId", ["leagueId"])
    .index("by_leagueId_and_status", ["leagueId", "status"]),

  /**
   * Club categories (age divisions) represent teams within a club.
   * Example: "Sub-17 Division A" of Club América
   */
  categories: defineTable({
    clubId: v.id("clubs"),
    name: v.string(), // e.g., "Sub-17"
    ageGroup: v.string(), // e.g., "U17", "U20"
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("mixed")),
    technicalDirectorId: v.optional(v.id("profiles")),
    assistantCoachIds: v.optional(v.array(v.id("profiles"))),
    status: v.union(v.literal("active"), v.literal("inactive")),
  })
    .index("by_clubId", ["clubId"])
    .index("by_clubId_and_ageGroup", ["clubId", "ageGroup"])
    .index("by_technicalDirectorId", ["technicalDirectorId"]),

  // ========================================
  // PART 3: TOURNAMENT & COMPETITION SYSTEM
  // ========================================

  /**
   * Tournaments are competitions organized by leagues.
   * Can be league-wide, national, or invitational.
   */
  tournaments: defineTable({
    leagueId: v.id("leagues"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    ageGroup: v.string(), // e.g., "U17"
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("mixed")),
    season: v.string(), // e.g., "2025"
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    status: tournamentStatus,
    // Division configuration
    enableDivisions: v.boolean(),
    divisionCount: v.optional(v.number()), // How many divisions (A, B, C, D)
    // Promotion/Relegation rules
    promotionCount: v.optional(v.number()), // Teams promoted per division
    relegationCount: v.optional(v.number()), // Teams relegated per division
  })
    .index("by_leagueId", ["leagueId"])
    .index("by_slug", ["slug"])
    .index("by_leagueId_and_season", ["leagueId", "season"])
    .index("by_status", ["status"]),

  /**
   * Tournament phases (e.g., "Group Stage", "Knockout", "Finals").
   * Defines the structure and progression of a tournament.
   */
  tournamentPhases: defineTable({
    tournamentId: v.id("tournaments"),
    name: v.string(),
    phaseType: v.union(
      v.literal("group_stage"),
      v.literal("knockout"),
      v.literal("round_robin"),
      v.literal("final")
    ),
    order: v.number(), // Sequence in the tournament
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    status: phaseStatus,
  })
    .index("by_tournamentId", ["tournamentId"])
    .index("by_tournamentId_and_order", ["tournamentId", "order"]),

  /**
   * Divisions within a tournament (A, B, C, D).
   * Each division is a separate competition tier.
   */
  divisions: defineTable({
    name: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    level: v.number(),
    leagueId: v.id("leagues"),
  })
    .index("by_leagueId", ["leagueId"])
    .index("by_leagueId_and_level", ["leagueId", "level"]),

  /**
   * Links categories (teams) to divisions for a tournament.
   * This is the "registration" of a team in a division.
   */
  divisionEntries: defineTable({
    divisionId: v.id("divisions"),
    categoryId: v.id("categories"),
    registeredAt: v.number(),
    registeredBy: v.optional(v.id("profiles")),
    // For tracking promotion/relegation
    previousDivisionId: v.optional(v.id("divisions")),
  })
    .index("by_divisionId", ["divisionId"])
    .index("by_categoryId", ["categoryId"])
    .index("by_divisionId_and_categoryId", ["divisionId", "categoryId"]),

  /**
   * Rankings/Standings for each team in a division.
   * Updated after each match.
   */
  standings: defineTable({
    divisionId: v.id("divisions"),
    categoryId: v.id("categories"),
    // Match statistics
    matchesPlayed: v.number(),
    wins: v.number(),
    draws: v.number(),
    losses: v.number(),
    goalsFor: v.number(),
    goalsAgainst: v.number(),
    goalDifference: v.number(),
    points: v.number(),
    // Additional metrics
    position: v.number(), // Current rank
    form: v.optional(v.array(v.string())), // Last 5 results: ["W", "L", "D", "W", "W"]
    // Promotion/Relegation indicators
    promotionEligible: v.optional(v.boolean()),
    relegationZone: v.optional(v.boolean()),
  })
    .index("by_divisionId", ["divisionId"])
    .index("by_divisionId_and_position", ["divisionId", "position"])
    .index("by_categoryId", ["categoryId"]),

  // ========================================
  // PART 4: PLAYER MANAGEMENT
  // ========================================

  /**
   * Player records linked to profiles and categories.
   * Stores athlete-specific data and career history.
   */
  players: defineTable({
    profileId: v.id("profiles"),
    currentCategoryId: v.optional(v.id("categories")),
    // Personal details
    nationality: v.optional(v.string()),
    secondNationality: v.optional(v.string()),
    placeOfBirth: v.optional(v.string()),
    // Player info
    position: v.optional(
      v.union(
        v.literal("goalkeeper"),
        v.literal("defender"),
        v.literal("midfielder"),
        v.literal("forward")
      )
    ),
    jerseyNumber: v.optional(v.number()),
    height: v.optional(v.number()), // in cm
    weight: v.optional(v.number()), // in kg
    preferredFoot: v.optional(v.union(v.literal("left"), v.literal("right"), v.literal("both"))),
    // Status
    status: playerStatus,
    joinedDate: v.optional(v.string()),
    // Career tracking for valorization
    trainingHours: v.optional(v.number()),
    matchesPlayed: v.optional(v.number()),
    goals: v.optional(v.number()),
    assists: v.optional(v.number()),
    // Medical
    bloodType: v.optional(v.string()),
    allergies: v.optional(v.array(v.string())),
    medicalNotes: v.optional(v.string()),
  })
    .index("by_profileId", ["profileId"])
    .index("by_currentCategoryId", ["currentCategoryId"])
    .index("by_status", ["status"]),

  /**
   * Player transfers between categories/clubs.
   * Essential for transfer market valorization.
   */
  playerTransfers: defineTable({
    playerId: v.id("players"),
    fromCategoryId: v.optional(v.id("categories")),
    toCategoryId: v.id("categories"),
    transferDate: v.string(),
    transferType: v.union(
      v.literal("promotion"), // Within same club
      v.literal("transfer"), // Between clubs
      v.literal("loan"),
      v.literal("trial")
    ),
    fee: v.optional(v.number()), // For valorization
    approvedBy: v.optional(v.id("profiles")),
    notes: v.optional(v.string()),
  })
    .index("by_playerId", ["playerId"])
    .index("by_toCategoryId", ["toCategoryId"])
    .index("by_transferDate", ["transferDate"]),

  // ========================================
  // PART 5: REFEREE MANAGEMENT
  // ========================================

  /**
   * Referee profiles for match officials.
   * Managed at the league level.
   */
  referees: defineTable({
    profileId: v.id("profiles"),
    leagueId: v.id("leagues"),
    // Certification
    certificationLevel: v.string(), // "Escalafón" - e.g., "National", "Regional"
    certificationDate: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    // Assignment criteria
    zone: v.optional(v.string()), // Geographic zone for assignment
    availableDays: v.optional(v.array(v.string())), // ["Monday", "Wednesday"]
    maxMatchesPerWeek: v.optional(v.number()),
    // Performance tracking
    matchesOfficiated: v.optional(v.number()),
    rating: v.optional(v.number()), // Average rating
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("inactive")),
  })
    .index("by_profileId", ["profileId"])
    .index("by_leagueId", ["leagueId"])
    .index("by_leagueId_and_certificationLevel", ["leagueId", "certificationLevel"])
    .index("by_zone", ["zone"]),

  // ========================================
  // PART 6: SETTINGS & CONFIGURATION
  // ========================================

  /**
   * League-specific settings and rules.
   * Configurable by LeagueAdmin.
   */
  leagueSettings: defineTable({
    leagueId: v.id("leagues"),
    // Division rules
    divisionNames: v.optional(v.array(v.string())), // ["Elite", "First", "Second"]
    promotionRules: v.optional(v.string()), // JSON or description
    relegationRules: v.optional(v.string()),
    // Match rules
    matchDuration: v.optional(v.number()), // minutes
    halftimeDuration: v.optional(v.number()),
    pointsForWin: v.optional(v.number()),
    pointsForDraw: v.optional(v.number()),
    // Age group definitions
    ageGroupDefinitions: v.optional(v.string()), // JSON config
  }).index("by_leagueId", ["leagueId"]),
});