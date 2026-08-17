# Academic Periods: Domain Notes

> **Estado: nota conceptual histórica, no normativa.** Este documento pertenece a un dominio académico ajeno a Futbolya y no describe su producto, schema ni arquitectura vigentes. Para cambios actuales, consultar [`../AGENTS.md`](../AGENTS.md) y la skill `futbolya-project-guidelines`.

## Purpose

An academic period is an institution-owned date range that defines an official
academic window. It lets the platform group, schedule, report, lock, and
evaluate academic activity consistently across modules.

Academic periods are part of the academic core. They are not owned by a single
capacity such as Alef, Flexidual, Teaching, or Dismissal. Modules should
reference academic periods instead of creating their own competing calendar
concepts.

## Examples

- `2026 Academic Year`
- `2026-1`
- `First Semester 2026`
- `Q1 2026`
- `Bimestre 2`
- `Summer 2026`

## Why They Matter

Academic periods answer a simple domain question:

> In which official academic window does this activity happen?

They are used to:

- Group classes, grades, lessons, evidence, attendance, and reports.
- Identify what is upcoming, current, or past.
- Define grading windows and deadlines.
- Filter academic views by period.
- Keep modules aligned to the same institutional calendar.
- Close or lock sensitive workflows after a period ends.

## Architectural Placement

Academic periods should live in the academic core, scoped by organization.

Recommended ownership:

```txt
organization
  has many academicPeriods
```

Modules should reference them:

```txt
finalGrades.academicPeriodId
liveClassSessions.academicPeriodId
teacherEvidence.academicPeriodId
courseOfferings.academicPeriodId
```

The period belongs to the institution, not to the module that uses it.

## Core Entity Shape

Recommended MVP fields:

```txt
academicPeriods
  organizationId
  name
  code
  kind
  startDate
  endDate
  lifecycleStatus
  sortOrder
  createdAt
  updatedAt
```

Recommended field meanings:

- `organizationId`: tenant boundary and first index field.
- `name`: display label, e.g. `First Semester 2026`.
- `code`: short stable identifier, e.g. `2026-1`, unique within organization.
- `kind`: optional classification, e.g. `year`, `semester`, `quarter`,
  `bimester`, `trimester`, `summer`, `custom`.
- `startDate`: date-only string in `YYYY-MM-DD`.
- `endDate`: date-only string in `YYYY-MM-DD`, inclusive.
- `lifecycleStatus`: administrative state such as `draft`, `published`,
  `closed`, or `archived`.
- `sortOrder`: explicit ordering when dates alone are not enough.

## Date Model

Use date-only strings, not timestamps, for the core period range.

Reason:

- Academic periods are institutional day ranges.
- They are not events occurring at a specific instant.
- Date-only values avoid timezone drift around midnight.

Recommended format:

```txt
YYYY-MM-DD
```

`startDate` and `endDate` should be interpreted as inclusive dates.

## Status Model

Separate lifecycle status from temporal status.

Lifecycle status is stored:

```txt
draft | published | closed | archived
```

Temporal status is derived from dates:

```txt
upcoming | current | past
```

Reason:

- `current` should normally mean "today is between startDate and endDate".
- Storing `isCurrent` invites stale state and manual inconsistencies.
- Lifecycle status answers a different question: whether the institution allows
  workflows to use or edit the period.

## Recommended Lifecycle Semantics

`draft`:

- Period exists but should not be selectable by most modules.
- Useful while admins are preparing the academic calendar.

`published`:

- Period is official and selectable.
- Modules may schedule or attach records to it.

`closed`:

- Period is over for sensitive workflows.
- Grades, final records, or official reports may become read-only unless an
  admin reopens them.

`archived`:

- Period remains historically visible but should be hidden from normal create
  flows.
- It should not be hard-deleted if referenced by module records.

## Constraints

Recommended MVP constraints:

- `organizationId + code` must be unique by write-path convention.
- `name` must be non-empty after trimming.
- `code` must be non-empty after trimming.
- `startDate` and `endDate` must be valid date-only strings.
- `endDate` must be greater than or equal to `startDate`.
- Period reads must be tenant-scoped with indexes beginning with
  `organizationId`.
- Modules should store `academicPeriodId`, not duplicate period names or dates.
- Hard delete should be blocked once a period is referenced by module data.

Recommended overlap rule:

- For MVP, avoid overlapping periods of the same `kind` inside the same
  organization.
- If the product needs nested periods, introduce explicit hierarchy or
  calendars before allowing broad overlaps.

Example nested model if needed later:

```txt
Academic Year 2026
  Semester 1
    Bimestre 1
    Bimestre 2
  Semester 2
    Bimestre 3
    Bimestre 4
```

Do not build this hierarchy until a real flow needs it.

## Indexes

Recommended indexes:

```txt
by_organization_id_and_start_date
by_organization_id_and_code
by_organization_id_and_lifecycle_status_and_start_date
```

Potential later indexes:

```txt
by_organization_id_and_kind_and_start_date
by_organization_id_and_kind_and_lifecycle_status_and_start_date
```

Only add later indexes when a real query path needs them.

## Queries

Core queries likely needed:

- List periods for an organization.
- List published periods for selection.
- Get period by id within an organization.
- Get period by code within an organization.
- Find periods containing a given date.
- Get the current period by today's date.
- Get upcoming periods.
- Get recently closed/past periods.

All list queries should be bounded or paginated. Avoid unbounded `.collect()`.

## Mutations

Core mutations likely needed:

- Create period.
- Update period metadata and dates.
- Publish period.
- Close period.
- Archive period.
- Reactivate or reopen period, if the business permits it.
- Delete period only if it has no references.

All mutations must re-derive organization access server-side and enforce tenant
scope. Do not trust `organizationId` from the client for authorization.

## Module Usage

Alef University:

- Classes/final-grade records belong to an academic period.
- Grade deadlines can be derived from or attached to a period.
- Closed periods may lock grade edits.

Flexidual:

- Live classes and recurring schedules can be grouped by period.
- Lessons can be planned within a period.
- Attendance reports can be filtered by period.

CPCA Teachers:

- Evidence can be reported by period.
- Curriculum progress can be measured within a period.

Billing:

- Optional future use: period-based charges, enrollment windows, or school-year
  billing cycles.

Dismissal:

- Usually does not need academic periods for the queue itself.
- It may use a period indirectly for enrollment context or reports.

## What Not To Do

- Do not put academic periods inside a single capacity.
- Do not duplicate period name/date fields into module records.
- Do not store `isCurrent` unless a measured business rule requires manual
  override.
- Do not model a full school calendar engine in the MVP.
- Do not add holidays, exceptions, recurring schedules, or campus-specific
  calendars until there is a concrete requirement.
- Do not allow hard deletion of periods that are referenced by module records.
- Do not use timestamps for date ranges unless the concept becomes event-like.

## MVP Recommendation

Start with organization-level periods only.

Support:

- Name
- Code
- Kind
- Start date
- End date
- Lifecycle status
- Bounded tenant-scoped listing
- Create/update/publish/close/archive

Defer:

- Nested periods
- Campus-specific periods
- Holiday calendars
- Recurrent rules
- Per-module period settings
- Complex deadline templates

## Definition

An academic period is an institution-owned, tenant-scoped date range that defines
an official academic window used by modules to schedule, group, report, lock,
and evaluate academic activity.
