import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./lib/auth";
import { requireOrgAccess, hasOrgAdminAccess } from "./lib/permissions";
import { formDataValidator, applicationStatus } from "./lib/validators";

const applicationValidator = v.object({
  _id: v.id("applications"),
  _creationTime: v.number(),
  userId: v.id("users"),
  organizationId: v.id("organizations"),
  formTemplateId: v.id("formTemplates"),
  formTemplateVersion: v.number(),
  applicationCode: v.string(),
  status: applicationStatus,
  formData: formDataValidator,
  reviewedBy: v.optional(v.id("users")),
  reviewedAt: v.optional(v.number()),
});

/**
 * Generate a unique application code.
 */
function generateApplicationCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `APP-${timestamp}-${random}`;
}

/**
 * Default form template sections for pre-admission.
 */
const DEFAULT_FORM_SECTIONS = [
  {
    key: "athlete",
    label: "Athlete Information",
    order: 1,
    fields: [
      { key: "photo", label: "Photo", type: "string", required: true },
      { key: "firstName", label: "First Name", type: "text", required: true },
      { key: "lastName", label: "Last Name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "telephone", label: "Phone", type: "tel", required: true },
      { key: "birthDate", label: "Birth Date", type: "date", required: true },
      { key: "sex", label: "Sex", type: "select", required: true },
      { key: "height", label: "Height", type: "text", required: false },
      {
        key: "countryOfBirth",
        label: "Country of Birth",
        type: "select",
        required: true,
      },
      {
        key: "citizenship",
        label: "Citizenship",
        type: "select",
        required: true,
      },
      {
        key: "highlightsUrl",
        label: "Highlights URL",
        type: "url",
        required: false,
      },
    ],
  },
  {
    key: "program",
    label: "Program Information",
    order: 2,
    fields: [
      { key: "format", label: "Format", type: "select", required: true },
      { key: "program", label: "Program", type: "select", required: true },
      {
        key: "enrollmentYear",
        label: "Enrollment Year",
        type: "select",
        required: true,
      },
      {
        key: "graduationYear",
        label: "Graduation Year",
        type: "select",
        required: true,
      },
      {
        key: "gradeEntering",
        label: "Grade Entering",
        type: "select",
        required: true,
      },
      {
        key: "programOfInterest",
        label: "Program of Interest",
        type: "select",
        required: false,
      },
      {
        key: "interestedInBoarding",
        label: "Interested in Boarding",
        type: "checkbox",
        required: false,
      },
    ],
  },
  {
    key: "address",
    label: "Address",
    order: 3,
    fields: [
      { key: "country", label: "Country", type: "select", required: true },
      { key: "state", label: "State", type: "text", required: true },
      { key: "city", label: "City", type: "text", required: true },
      {
        key: "streetAddress",
        label: "Street Address",
        type: "text",
        required: true,
      },
      { key: "zipCode", label: "Zip Code", type: "text", required: true },
    ],
  },
  {
    key: "school",
    label: "School Information",
    order: 4,
    fields: [
      {
        key: "currentSchoolName",
        label: "Current School Name",
        type: "text",
        required: true,
      },
      {
        key: "schoolType",
        label: "School Type",
        type: "select",
        required: true,
      },
      {
        key: "schoolCountry",
        label: "School Country",
        type: "select",
        required: true,
      },
      {
        key: "schoolState",
        label: "School State",
        type: "text",
        required: false,
      },
      {
        key: "schoolCity",
        label: "School City",
        type: "text",
        required: false,
      },
      {
        key: "currentGPA",
        label: "Current GPA",
        type: "text",
        required: false,
      },
      {
        key: "referenceName",
        label: "Reference Name",
        type: "text",
        required: false,
      },
      {
        key: "referencePhone",
        label: "Reference Phone",
        type: "tel",
        required: false,
      },
      {
        key: "referenceRelationship",
        label: "Reference Relationship",
        type: "text",
        required: false,
      },
    ],
  },
  {
    key: "parents",
    label: "Parents/Guardians",
    order: 5,
    fields: [
      {
        key: "parent1FirstName",
        label: "Parent 1 First Name",
        type: "text",
        required: true,
      },
      {
        key: "parent1LastName",
        label: "Parent 1 Last Name",
        type: "text",
        required: true,
      },
      {
        key: "parent1Relationship",
        label: "Parent 1 Relationship",
        type: "select",
        required: true,
      },
      {
        key: "parent1Email",
        label: "Parent 1 Email",
        type: "email",
        required: true,
      },
      {
        key: "parent1Telephone",
        label: "Parent 1 Phone",
        type: "tel",
        required: true,
      },
      {
        key: "parent2FirstName",
        label: "Parent 2 First Name",
        type: "text",
        required: false,
      },
      {
        key: "parent2LastName",
        label: "Parent 2 Last Name",
        type: "text",
        required: false,
      },
      {
        key: "parent2Relationship",
        label: "Parent 2 Relationship",
        type: "select",
        required: false,
      },
      {
        key: "parent2Email",
        label: "Parent 2 Email",
        type: "email",
        required: false,
      },
      {
        key: "parent2Telephone",
        label: "Parent 2 Phone",
        type: "tel",
        required: false,
      },
    ],
  },
  {
    key: "additional",
    label: "Additional Information",
    order: 6,
    fields: [
      {
        key: "personSubmitting",
        label: "Person Submitting",
        type: "select",
        required: true,
      },
      {
        key: "howDidYouHear",
        label: "How Did You Hear About Us",
        type: "select",
        required: true,
      },
      { key: "needsI20", label: "Needs I-20", type: "select", required: true },
      { key: "message", label: "Message", type: "textarea", required: false },
    ],
  },
];

/**
 * Submit a new application (authenticated user).
 */
export const submit = mutation({
  args: {
    organizationSlug: v.string(),
    formData: formDataValidator,
  },
  returns: v.object({
    applicationId: v.id("applications"),
    applicationCode: v.string(),
  }),
  handler: async (ctx, args) => {
    const { user, organization } = await requireOrgAccess(
      ctx,
      args.organizationSlug,
    );

    let template = await ctx.db
      .query("formTemplates")
      .withIndex("byOrganization", (q) =>
        q.eq("organizationId", organization._id),
      )
      .filter((q) => q.eq(q.field("isPublished"), true))
      .first();

    // Auto-create default form template if none exists
    if (!template) {
      const templateId = await ctx.db.insert("formTemplates", {
        organizationId: organization._id,
        version: 1,
        name: "Pre-admission Form",
        description: "Default pre-admission application form",
        mode: "base",
        sections: DEFAULT_FORM_SECTIONS,
        isPublished: true,
      });
      template = await ctx.db.get(templateId);
      if (!template) {
        throw new Error("Failed to create form template");
      }
    }

    const applicationCode = generateApplicationCode();

    const existing = await ctx.db
      .query("applications")
      .withIndex("byApplicationCode", (q) =>
        q.eq("applicationCode", applicationCode),
      )
      .unique();

    if (existing) {
      throw new Error("Application code collision. Please try again.");
    }

    const applicationId = await ctx.db.insert("applications", {
      userId: user._id,
      organizationId: organization._id,
      formTemplateId: template._id,
      formTemplateVersion: template.version,
      applicationCode,
      status: "pending",
      formData: args.formData,
    });

    return {
      applicationId,
      applicationCode,
    };
  },
});

/**
 * Get my applications (authenticated user).
 */
export const listMine = query({
  args: {},
  returns: v.array(applicationValidator),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    return await ctx.db
      .query("applications")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

/**
 * Get applications by organization (admin only).
 * Returns empty array if organization doesn't exist (handles deleted orgs gracefully).
 */
export const listByOrganization = query({
  args: {
    organizationSlug: v.string(),
    status: v.optional(applicationStatus),
  },
  returns: v.array(applicationValidator),
  handler: async (ctx, args) => {
    // Find the organization first
    const organization = await ctx.db
      .query("organizations")
      .withIndex("bySlug", (q) => q.eq("slug", args.organizationSlug))
      .unique();

    // Return empty array if org doesn't exist (handles deleted orgs gracefully)
    if (!organization) {
      return [];
    }

    // Check admin access
    const user = await getCurrentUser(ctx);
    const isAdmin = await hasOrgAdminAccess(ctx, user._id, organization._id);
    if (!isAdmin) {
      return [];
    }

    const query = ctx.db
      .query("applications")
      .withIndex("byOrganizationId", (q) =>
        q.eq("organizationId", organization._id),
      )
      .order("desc");

    const applications = await query.collect();

    if (args.status) {
      return applications.filter((app) => app.status === args.status);
    }

    return applications;
  },
});

/**
 * Get a single application by ID.
 * User can only access their own applications.
 * Admins can access any application in their organization.
 */
export const getById = query({
  args: { applicationId: v.id("applications") },
  returns: v.union(applicationValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const application = await ctx.db.get(args.applicationId);

    if (!application) {
      return null;
    }

    // Owner can always access
    if (application.userId === user._id) {
      return application;
    }

    // Check admin access
    const isAdmin = await hasOrgAdminAccess(
      ctx,
      user._id,
      application.organizationId,
    );

    if (!isAdmin) {
      throw new Error("Unauthorized: Cannot access this application");
    }

    return application;
  },
});

/**
 * Get application by code (for lookup after submission).
 */
export const getByCode = query({
  args: { applicationCode: v.string() },
  returns: v.union(applicationValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const application = await ctx.db
      .query("applications")
      .withIndex("byApplicationCode", (q) =>
        q.eq("applicationCode", args.applicationCode),
      )
      .unique();

    if (!application) {
      return null;
    }

    // Owner can always access
    if (application.userId === user._id) {
      return application;
    }

    // Check admin access
    const isAdmin = await hasOrgAdminAccess(
      ctx,
      user._id,
      application.organizationId,
    );

    if (!isAdmin) {
      throw new Error("Unauthorized: Cannot access this application");
    }

    return application;
  },
});

/**
 * Update application status (admin only).
 */
export const updateStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: applicationStatus,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const application = await ctx.db.get(args.applicationId);

    if (!application) {
      throw new Error("Application not found");
    }

    // Check admin access
    const isAdmin = await hasOrgAdminAccess(
      ctx,
      user._id,
      application.organizationId,
    );

    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    await ctx.db.patch(args.applicationId, {
      status: args.status,
      reviewedBy: user._id,
      reviewedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Update application photo (owner or admin can update).
 */
export const updatePhoto = mutation({
  args: {
    applicationId: v.id("applications"),
    photoStorageId: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const application = await ctx.db.get(args.applicationId);

    if (!application) {
      throw new Error("Application not found");
    }

    // Check access: owner or admin
    const isOwner = application.userId === user._id;
    const isAdmin = await hasOrgAdminAccess(
      ctx,
      user._id,
      application.organizationId,
    );

    if (!isOwner && !isAdmin) {
      throw new Error("Unauthorized: Access required");
    }

    // Delete old photo from storage if it exists
    const oldPhotoId = application.formData.athlete?.photo as
      | Id<"_storage">
      | undefined;
    if (oldPhotoId) {
      await ctx.storage.delete(oldPhotoId);
    }

    // Update photo in formData
    const updatedFormData = {
      ...application.formData,
      athlete: {
        ...application.formData.athlete,
        photo: args.photoStorageId,
      },
    };

    await ctx.db.patch(args.applicationId, {
      formData: updatedFormData,
    });

    return null;
  },
});

/**
 * Delete application (admin only).
 */
export const deleteApplication = mutation({
  args: {
    applicationId: v.id("applications"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const application = await ctx.db.get(args.applicationId);

    if (!application) {
      throw new Error("Application not found");
    }

    // Check admin access
    const isAdmin = await hasOrgAdminAccess(
      ctx,
      user._id,
      application.organizationId,
    );

    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    await ctx.db.delete(args.applicationId);

    return null;
  },
});

/**
 * Get application with template info (for detail view).
 */
export const getWithTemplate = query({
  args: { applicationId: v.id("applications") },
  returns: v.union(
    v.object({
      application: applicationValidator,
      template: v.object({
        _id: v.id("formTemplates"),
        name: v.string(),
        sections: v.array(
          v.object({
            key: v.string(),
            label: v.string(),
            order: v.number(),
            fields: v.array(
              v.object({
                key: v.string(),
                label: v.string(),
                type: v.string(),
                required: v.boolean(),
              }),
            ),
          }),
        ),
      }),
      organization: v.object({
        _id: v.id("organizations"),
        name: v.string(),
        slug: v.string(),
      }),
      isAdmin: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const application = await ctx.db.get(args.applicationId);

    if (!application) {
      return null;
    }

    const isOwner = application.userId === user._id;
    const isAdmin = await hasOrgAdminAccess(
      ctx,
      user._id,
      application.organizationId,
    );

    if (!isOwner && !isAdmin) {
      throw new Error("Unauthorized");
    }

    const template = await ctx.db.get(application.formTemplateId);
    if (!template) {
      throw new Error("Template not found");
    }

    const organization = await ctx.db.get(application.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    return {
      application,
      template: {
        _id: template._id,
        name: template.name,
        sections: template.sections,
      },
      organization: {
        _id: organization._id,
        name: organization.name,
        slug: organization.slug,
      },
      isAdmin,
    };
  },
});
