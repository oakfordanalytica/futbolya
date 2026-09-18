import {
  cleanupPlayerPhotoHandler,
  preparePlayerPhotoHandler,
  registerPlayerPhotoHandler,
} from "../convex/lib/players/photo_uploads";
import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { readSheet } from "read-excel-file/node";
import {
  parseRegistrationDate,
  parseRegistrationMeasure,
  parseRegistrationSheet,
} from "../lib/players/registration-sheet";
import {
  createPlayerIdentityIndex,
  getPlayerInputErrors,
  normalizePlayerInput,
} from "../lib/players/input";
import { buildImportPreview } from "../components/sections/shell/teams/soccer/team-settings/player-import-preview";
import {
  buildPlayerMutationPayload,
  createPlayerFormValues,
  isPlayerFormValid,
} from "../components/sections/shell/teams/soccer/team-settings/player-form-dialog.helpers";
import {
  importPlayersHandler,
  getPlayerManagementContextHandler,
} from "../convex/lib/players/import";
import {
  createPlayerHandler,
  updatePlayerHandler,
} from "../convex/lib/players/mutations";
import type { MutationCtx } from "../convex/_generated/server";
import type { Id } from "../convex/_generated/dataModel";

const today = "2026-09-15";
const templatePath = fileURLToPath(
  new URL(
    "../public/PLANILLAS DE INSCRIPCION Y FOTOS TORNEO DE LAS AMERICAS 2026.xlsx",
    import.meta.url,
  ),
);
const template = () =>
  readSheet(templatePath, "Planilla de Inscripcion", {
    parseNumber: (value) => value,
  });
const player = {
  firstName: "Ana María",
  lastName: "Pérez",
  dateOfBirth: "2010-02-28",
  documentNumber: "001234",
  cometNumber: "5678",
  position: "forward",
  gender: "female" as const,
};
const clubId = "club" as Id<"clubs">;
const args = (rows = [player]) => ({
  clubId,
  organizationSlug: "valle",
  leagueCategoryId: "u17",
  gender: "female" as const,
  players: rows.map((row, index) => {
    const { gender, ...fields } = row;
    return { sourceRow: 15 + index, ...fields };
  }),
});

// Small in-memory adapter for the handlers' reads/writes. Transaction and OCC
// guarantees belong to Convex; these tests exercise our authorization and logic.
type Row = Record<string, unknown> & { _id: string };
function backend(role = "admin", assigned = true) {
  const tables: Record<string, Row[]> = {
    users: [{ _id: "user", clerkId: "clerk", isActive: true }],
    organizations: [{ _id: "org", slug: "valle" }],
    organizationMembers: [
      { _id: "membership", userId: "user", organizationId: "org", role },
    ],
    clubs: [
      {
        _id: "club",
        organizationId: "org",
        slug: "globaltalent",
        name: "Global Talent",
      },
    ],
    staff: assigned
      ? [{ _id: "staff", userId: "user", clubId: "club", role: "head_coach" }]
      : [],
    players: [],
    playerPhotoUploads: [],
    _storage: [],
    categories: [],
    leagueSettings: [
      {
        _id: "settings",
        organizationId: "org",
        positions: [{ id: "forward" }],
        ageCategories: [{ id: "u17", name: "Sub 17", minAge: 15, maxAge: 17 }],
        enabledGenders: ["female"],
      },
    ],
  };
  const all = () => Object.values(tables).flat();
  const db = {
    system: {
      get: async (id: string) =>
        tables._storage.find((row) => row._id === id) ?? null,
    },
    delete: async (id: string) => {
      for (const [table, rows] of Object.entries(tables))
        tables[table] = rows.filter((row) => row._id !== id);
    },
    get: async (id: string) => all().find((row) => row._id === id) ?? null,
    query(table: string) {
      let rows = tables[table] ?? [];
      const query = {
        withIndex(
          _name: string,
          cb: (q: { eq: (key: string, value: unknown) => unknown }) => unknown,
        ) {
          const filter = {
            eq(key: string, value: unknown) {
              rows = rows.filter((row) => row[key] === value);
              return filter;
            },
          };
          cb(filter);
          return query;
        },
        filter(
          cb: (q: {
            field: (key: string) => string;
            eq: (key: string, value: unknown) => (row: Row) => boolean;
          }) => (row: Row) => boolean,
        ) {
          rows = rows.filter(
            cb({
              field: (key) => key,
              eq: (key, value) => (row) => row[key] === value,
            }),
          );
          return query;
        },
        unique: async () => {
          assert.ok(rows.length <= 1);
          return rows[0] ?? null;
        },
        first: async () => rows[0] ?? null,
        collect: async () => [...rows],
        take: async (count: number) => rows.slice(0, count),
      };
      return query;
    },
    insert: async (table: string, data: Record<string, unknown>) => {
      const _id = `${table}-${tables[table].length + 1}`;
      tables[table].push({ ...data, _id, _creationTime: Date.now() });
      return _id;
    },
    patch: async (id: string, data: Record<string, unknown>) => {
      Object.assign(all().find((row) => row._id === id)!, data);
    },
  };
  return {
    tables,
    ctx: {
      db,
      scheduler: { runAfter: async () => "scheduled" },
      storage: {
        generateUploadUrl: async () => "https://upload.example",
        delete: async (id: string) => {
          tables._storage = tables._storage.filter((row) => row._id !== id);
        },
      },
      auth: { getUserIdentity: async () => ({ subject: "clerk" }) },
    } as unknown as MutationCtx,
  };
}

test("actual template is recognized and its 25 numbered blank rows are ignored", async () => {
  assert.equal(parseRegistrationSheet(await template(), today).rows.length, 0);
});

test("reads all 25 rows and never imports staff or treats enumeration as jersey number", async () => {
  const data = await template();
  for (let i = 14; i < 39; i++)
    data[i] = [
      String(i - 13),
      "Ana María Pérez Ruiz",
      "28/02/2010 Cali",
      `00${i}`,
      "Delantera",
      "1,70",
      "62,5",
      String(1000 + i),
    ];
  data[42] = [null, "Director Tecnico", "Persona del staff"];
  const sheet = parseRegistrationSheet(data, today);
  assert.equal(sheet.rows.length, 25);
  assert.equal(sheet.rows[0].dateOfBirth, "2010-02-28");
  assert.equal(sheet.rows[0].height, "170");
  assert.equal(sheet.rows[0].weight, "62.5");
  assert.equal(sheet.rows[0].documentNumber, "0014");
  assert.equal(sheet.rows[0].sourceRow, 15);
  assert.equal("jerseyNumber" in sheet.rows[0], false);
});

test("rejects unrecognized or incomplete template instead of importing arbitrary rows", () => {
  assert.throws(
    () => parseRegistrationSheet([["name", "birth"]], today),
    /templateError/,
  );
});

test("parses dates strictly without UTC shifting or rollover", () => {
  assert.equal(parseRegistrationDate("Cali 01/02/2010", today), "2010-02-01");
  assert.equal(parseRegistrationDate("2012-02-29", today), "2012-02-29");
  for (const value of [
    "31/02/2010",
    "02/29/2010",
    "01/01/27",
    "2027-01-01",
    "unknown",
    "28/02/20100",
    "28/02/2010-123",
    "2010-02-28-123",
  ])
    assert.equal(parseRegistrationDate(value, today), "");
});

test("accepts birthplace dashes and unambiguous month/day dates from filled sheets", () => {
  for (const value of [
    "28/02/2010-Cali",
    "28/02/2010 - Cali",
    "28-02-2010–Cali",
    "28.02.2010—Cali",
    "2010-02-28-Cali",
    "28/02/2010-",
  ])
    assert.equal(parseRegistrationDate(value, today), "2010-02-28", value);
  assert.equal(
    parseRegistrationDate("04/19/2008  CALI VALLE DEL CAUCA", today),
    "2008-04-19",
  );
  // Ambiguous dates retain the template's day/month convention.
  assert.equal(parseRegistrationDate("04/05/2008-Cali", today), "2008-05-04");
});

test("preserves invalid measures for correction and keeps decimal weights", () => {
  assert.equal(parseRegistrationMeasure("170 cm", "height"), "170");
  assert.equal(parseRegistrationMeasure("1.70 m", "height"), "170");
  assert.equal(parseRegistrationMeasure("62,5 kg", "weight"), "62.5");
  assert.equal(parseRegistrationMeasure("six", "weight"), "six");
  assert.equal(parseRegistrationMeasure("170 kg", "height"), "170 kg");
});

test("identity matching preserves leading zeros, ignores formatting and detects conflicts", () => {
  const index = createPlayerIdentityIndex([
    { _id: "a", documentNumber: "001.234", cometNumber: "10" },
    { _id: "b", documentNumber: "999", cometNumber: "20" },
  ]);
  assert.equal(index.match({ documentNumber: "001234" }), "existing");
  assert.equal(index.match({ documentNumber: "1234" }), "new");
  assert.equal(
    index.match({ documentNumber: "001234", cometNumber: "20" }),
    "conflict",
  );
});

test("manual entry accepts pending optional fields and shares numeric validation", () => {
  const values = {
    ...createPlayerFormValues(),
    ...player,
    dateOfBirth: new Date(2010, 1, 28),
    leagueCategoryId: "u17",
    height: "170",
    weight: "62.5",
  };
  assert.ok(isPlayerFormValid(values, false));
  const payload = buildPlayerMutationPayload({ values });
  assert.equal(payload.jerseyNumber, undefined);
  assert.equal(payload.dominantProfile, undefined);
  assert.equal(payload.country, undefined);
  assert.equal(payload.weight, 62.5);
  assert.equal(
    isPlayerFormValid({ ...values, jerseyNumber: "1.5" }, false),
    false,
  );
  assert.deepEqual(
    getPlayerInputErrors(normalizePlayerInput(player), today),
    [],
  );
});

test("review excludes existing, conflicting, invalid and explicitly excluded rows", async () => {
  const data = await template();
  data[14] = [
    "1",
    "Ana Pérez",
    "28/02/2010",
    "001234",
    "Delantera",
    "170",
    "62",
    "5678",
  ];
  const row = {
    ...parseRegistrationSheet(data, today).rows[0],
    position: "forward",
  };
  const preview = buildImportPreview(
    [
      row,
      { ...row, sourceRow: 16 },
      { ...row, sourceRow: 17, included: false },
    ],
    [],
    "female",
    [{ id: "forward" }],
    today,
  );
  assert.deepEqual(
    preview.map((row) => row.status),
    ["ready", "existing", "excluded"],
  );
});

test("admin import writes category and players; reimport skips without overwriting", async () => {
  const { ctx, tables } = backend();
  assert.equal((await importPlayersHandler(ctx, args())).imported, 1);
  assert.equal(tables.categories.length, 1);
  assert.equal(tables.players[0].jerseyNumber, undefined);
  const result = await importPlayersHandler(
    ctx,
    args([{ ...player, firstName: "Changed" }]),
  );
  assert.equal(result.imported, 0);
  assert.equal(result.skipped[0].reason, "existing");
  assert.equal(tables.players[0].firstName, player.firstName);
});

test("same-club assigned coach can import; unassigned coach cannot", async () => {
  const allowed = backend("coach", true);
  assert.equal((await importPlayersHandler(allowed.ctx, args())).imported, 1);
  const denied = backend("coach", false);
  await assert.rejects(importPlayersHandler(denied.ctx, args()), /access/);
  assert.equal(denied.tables.players.length, 0);
});

test("club context uses organization and rejects unauthorized or cross-organization writes", async () => {
  const { ctx, tables } = backend();
  assert.equal(
    (
      await getPlayerManagementContextHandler(ctx, {
        organizationSlug: "valle",
        clubSlug: "globaltalent",
      })
    )?.clubId,
    "club",
  );
  await assert.rejects(
    importPlayersHandler(ctx, { ...args(), organizationSlug: "other" }),
  );
  tables.users[0].isActive = false;
  await assert.rejects(importPlayersHandler(ctx, args()), /inactive/);
  assert.equal(tables.players.length, 0);
});

test("invalid later row leaves no writes from earlier valid row", async () => {
  const { ctx, tables } = backend();
  await assert.rejects(
    importPlayersHandler(
      ctx,
      args([
        player,
        {
          ...player,
          documentNumber: "2",
          cometNumber: "3",
          dateOfBirth: "2010-02-31",
        },
      ]),
    ),
  );
  assert.equal(tables.players.length, 0);
  assert.equal(tables.categories.length, 0);
});

test("category, gender and position are revalidated on the server", async () => {
  for (const change of [
    { leagueCategoryId: "missing" },
    { gender: "male" as const },
  ]) {
    const { ctx, tables } = backend();
    await assert.rejects(importPlayersHandler(ctx, { ...args(), ...change }));
    assert.equal(tables.players.length, 0);
  }
  await assert.rejects(
    importPlayersHandler(
      backend().ctx,
      args([{ ...player, position: "missing" }]),
    ),
  );
});

test("manual creation and identity edits enforce the same duplicate rule", async () => {
  const { ctx, tables } = backend();
  await importPlayersHandler(ctx, args());
  await assert.rejects(
    createPlayerHandler(ctx, {
      ...player,
      clubSlug: "globaltalent",
      leagueCategoryId: "u17",
    }),
  );
  const id = await createPlayerHandler(ctx, {
    ...player,
    documentNumber: "999",
    cometNumber: "888",
    clubSlug: "globaltalent",
    leagueCategoryId: "u17",
  });
  await assert.rejects(
    updatePlayerHandler(ctx, { playerId: id, documentNumber: "001234" }),
  );
  await updatePlayerHandler(ctx, { playerId: id, weight: 62.5 });
  assert.equal(tables.players[1].weight, 62.5);
});

test("duplicate rows in a batch and inactive players are skipped", async () => {
  const { ctx, tables } = backend();
  const result = await importPlayersHandler(ctx, args([player, player]));
  assert.equal(result.imported, 1);
  assert.equal(result.skipped.length, 1);
  tables.players[0].status = "inactive";
  assert.equal((await importPlayersHandler(ctx, args())).imported, 0);
});

test("numeric identifiers with lost precision require correction; long text identities are preserved", async () => {
  const data: unknown[][] = await template();
  data[14] = [
    "1",
    "Ana Pérez",
    new Date("2010-02-28T00:00:00Z"),
    { excelNumber: "12345678901234567" },
    "Delantera",
    "170",
    "62",
    "12345678901234567",
  ];
  const row = parseRegistrationSheet(data, today).rows[0];
  assert.equal(row.documentNumber, "");
  assert.equal(row.originalDocument, "12345678901234567");
  assert.equal(row.cometNumber, "12345678901234567");
  assert.equal(row.dateOfBirth, "2010-02-28");
});

test("server rejects empty and excessive batches", async () => {
  await assert.rejects(importPlayersHandler(backend().ctx, args([])));
  await assert.rejects(
    importPlayersHandler(
      backend().ctx,
      args(Array.from({ length: 101 }, () => player)),
    ),
  );
});

test("identity conflicts are skipped without changing either existing player", async () => {
  const { ctx, tables } = backend();
  await importPlayersHandler(
    ctx,
    args([player, { ...player, documentNumber: "999", cometNumber: "888" }]),
  );
  const result = await importPlayersHandler(
    ctx,
    args([{ ...player, cometNumber: "888" }]),
  );
  assert.deepEqual(result, {
    imported: 0,
    skipped: [{ sourceRow: 15, reason: "conflict" }],
  });
  assert.equal(tables.players.length, 2);
});

test("disabled division values cannot be injected into category creation", async () => {
  const { ctx, tables } = backend();
  tables.leagueSettings[0].horizontalDivisions = {
    enabled: true,
    type: "alphabetic",
  };
  await assert.rejects(
    importPlayersHandler(ctx, { ...args(), division: "invalid" }),
  );
  assert.equal(tables.players.length, 0);
});

const digest = "a".repeat(64);
async function photoUpload(
  state: ReturnType<typeof backend>,
  photoId = "photo",
  storedDigest = Buffer.from(digest, "hex").toString("base64"),
) {
  const prepared = await preparePlayerPhotoHandler(state.ctx, {
    clubSlug: "globaltalent",
    sha256: digest,
  });
  state.tables._storage.push({
    _id: photoId,
    _creationTime: Date.now() + 1,
    sha256: storedDigest,
    contentType: "image/png",
    size: 100,
  });
  const storageId = photoId as Id<"_storage">;
  await registerPlayerPhotoHandler(state.ctx, {
    uploadId: prepared.uploadId,
    storageId,
  });
  return { ...prepared, storageId };
}

test("photo registration also accepts the documented hexadecimal metadata format", async () => {
  await photoUpload(backend(), "photo", digest);
});

test("imports the registered photo, consumes its ticket and skips reimport without deleting the photo", async () => {
  const state = backend();
  const upload = await photoUpload(state);
  const input = args();
  const request = {
    ...input,
    players: input.players.map((row) => ({
      ...row,
      photoStorageId: upload.storageId,
    })),
  };
  assert.equal((await importPlayersHandler(state.ctx, request)).imported, 1);
  assert.equal(state.tables.players[0].photoStorageId, upload.storageId);
  assert.equal(state.tables.playerPhotoUploads.length, 0);
  assert.equal((await importPlayersHandler(state.ctx, request)).imported, 0);
  await cleanupPlayerPhotoHandler(state.ctx, { uploadId: upload.uploadId });
  assert.equal(state.tables._storage.length, 1);
});

test("photo registration enforces digest, size, ownership, club and expiry", async () => {
  for (const change of [
    { sha256: "wrong" },
    { sha256: Buffer.from("b".repeat(64), "hex").toString("base64") },
    { size: 3 * 1024 * 1024 },
    { contentType: "text/html" },
    { _creationTime: 0 },
  ]) {
    const state = backend();
    const { uploadId } = await preparePlayerPhotoHandler(state.ctx, {
      clubSlug: "globaltalent",
      sha256: digest,
    });
    state.tables._storage.push({
      _id: "photo",
      _creationTime: Date.now() + 1,
      sha256: Buffer.from(digest, "hex").toString("base64"),
      contentType: "image/png",
      size: 100,
      ...change,
    });
    await assert.rejects(
      registerPlayerPhotoHandler(state.ctx, {
        uploadId,
        storageId: "photo" as Id<"_storage">,
      }),
    );
    assert.equal(state.tables.playerPhotoUploads[0].storageId, undefined);
  }
  for (const change of [
    { userId: "other" },
    { clubId: "other" },
    { _creationTime: 0 },
  ]) {
    const state = backend();
    const upload = await photoUpload(state);
    Object.assign(state.tables.playerPhotoUploads[0], change);
    const request = args();
    await assert.rejects(
      importPlayersHandler(state.ctx, {
        ...request,
        players: request.players.map((row) => ({
          ...row,
          photoStorageId: upload.storageId,
        })),
      }),
    );
    assert.equal(state.tables.players.length, 0);
  }
});

test("unused registered uploads are cleaned up, while referenced images are preserved", async () => {
  for (const referenced of [false, true]) {
    const state = backend();
    const upload = await photoUpload(state);
    if (referenced)
      state.tables.players.push({
        _id: "existing",
        photoStorageId: upload.storageId,
      });
    await cleanupPlayerPhotoHandler(state.ctx, { uploadId: upload.uploadId });
    assert.equal(state.tables._storage.length, referenced ? 1 : 0);
    assert.equal(state.tables.playerPhotoUploads.length, 0);
  }
});

test("import rejects the same photo on two new players and unregistered storage IDs", async () => {
  const state = backend();
  const upload = await photoUpload(state);
  const request = args([
    player,
    { ...player, documentNumber: "999", cometNumber: "998" },
  ]);
  await assert.rejects(
    importPlayersHandler(state.ctx, {
      ...request,
      players: request.players.map((row) => ({
        ...row,
        photoStorageId: upload.storageId,
      })),
    }),
  );
  assert.equal(state.tables.players.length, 0);
  state.tables.playerPhotoUploads = [];
  await assert.rejects(
    importPlayersHandler(state.ctx, {
      ...args(),
      players: [{ ...args().players[0], photoStorageId: upload.storageId }],
    }),
  );
  assert.equal(state.tables.players.length, 0);
});

test("manual creation uses the same registered upload and cleanup lifecycle", async () => {
  const state = backend();
  const upload = await photoUpload(state);
  await createPlayerHandler(state.ctx, {
    ...player,
    clubSlug: "globaltalent",
    leagueCategoryId: "u17",
    photoStorageId: upload.storageId,
  });
  assert.equal(state.tables.playerPhotoUploads.length, 0);
  assert.equal(state.tables.players[0].photoStorageId, upload.storageId);
});

test("registration is idempotent and requires the preparing user", async () => {
  const state = backend();
  const upload = await photoUpload(state);
  const input = { uploadId: upload.uploadId, storageId: upload.storageId };
  await registerPlayerPhotoHandler(state.ctx, input);
  assert.equal(state.tables.playerPhotoUploads.length, 1);
  state.tables.playerPhotoUploads[0].userId = "someone-else";
  await assert.rejects(registerPlayerPhotoHandler(state.ctx, input));
  await assert.rejects(
    preparePlayerPhotoHandler(backend("coach", false).ctx, {
      clubSlug: "globaltalent",
      sha256: digest,
    }),
  );
});

test("shared client uploader sends the hexadecimal SHA-256 required by the upload ticket", async (t) => {
  const { uploadPlayerPhoto } = await import(
    "../lib/files/upload-player-photo"
  );
  const { createHash } = await import("node:crypto");
  const file = new File(["fixture"], "photo.png", { type: "image/png" });
  let registered = false;
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: string, init: RequestInit) => {
      assert.equal(init.method, "POST");
      assert.equal(init.body, file);
      return Response.json({ storageId: "photo" });
    },
  );
  const result = await uploadPlayerPhoto(
    file,
    async (sha256) => {
      assert.equal(
        sha256,
        createHash("sha256").update("fixture").digest("hex"),
      );
      return {
        uploadId: "upload" as Id<"playerPhotoUploads">,
        uploadUrl: "https://upload.example",
      };
    },
    async (args) => {
      assert.equal(args.storageId, "photo");
      registered = true;
      return null;
    },
  );
  assert.equal(result, "photo");
  assert.equal(registered, true);
});
