import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const orgMemberRole = v.union(
  v.literal("superadmin"),
  v.literal("admin"),
  v.literal("member"),
);

const mode = v.union(v.literal("base"), v.literal("custom"));

const status = v.union(
  v.literal("pending"),
  v.literal("reviewing"),
  v.literal("pre-admitted"),
  v.literal("admitted"),
  v.literal("denied"),
);

const feeStatus = v.union(
  v.literal("pending"),
  v.literal("partially_paid"),
  v.literal("paid"),
);

const paymentMethod = v.union(
  v.literal("online"),
  v.literal("cash"),
  v.literal("wire"),
);

const transactionStatus = v.union(
  v.literal("pending"),
  v.literal("completed"),
  v.literal("failed"),
);

const paymentLinkStatus = v.union(
  v.literal("pending"),
  v.literal("completed"),
  v.literal("expired"),
);

const documentStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
);

const documentVisibility = v.union(
  v.literal("required"),
  v.literal("optional"),
  v.literal("hidden"),
);

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    isActive: v.boolean(),
    isSuperAdmin: v.boolean(),
  })
    .index("byClerkId", ["clerkId"])
    .index("byEmail", ["email"])
    .index("activeUsers", ["isActive"]),

  organizations: defineTable({
    clerkOrgId: v.string(),
    name: v.string(),
    slug: v.string(),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("byClerkOrgId", ["clerkOrgId"])
    .index("bySlug", ["slug"]),

  organizationMembers: defineTable({
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    clerkMembershipId: v.string(),
    role: orgMemberRole,
    createdAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byOrganization", ["organizationId"])
    .index("byUserAndOrg", ["userId", "organizationId"])
    .index("byClerkMembershipId", ["clerkMembershipId"]),

  formTemplates: defineTable({
    organizationId: v.id("organizations"),
    version: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    mode: mode,
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
    isPublished: v.boolean(),
  }).index("byOrganization", ["organizationId"]),

  applications: defineTable({
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    formTemplateId: v.id("formTemplates"),
    formTemplateVersion: v.number(),
    applicationCode: v.string(),
    status: status,
    formData: v.record(
      v.string(),
      v.record(
        v.string(),
        v.union(
          v.string(),
          v.number(),
          v.boolean(),
          v.null(),
          v.id("_storage"),
        ),
      ),
    ),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
  })
    .index("byUserId", ["userId"])
    .index("byOrganizationId", ["organizationId"])
    .index("byStatus", ["status"])
    .index("byApplicationCode", ["applicationCode"]),

  fees: defineTable({
    applicationId: v.id("applications"),
    name: v.string(),
    description: v.optional(v.string()),
    totalAmount: v.number(), // In cents
    downPaymentPercent: v.number(), // 0-100
    isRefundable: v.boolean(),
    isIncluded: v.boolean(),
    isDefault: v.boolean(),
    isRequired: v.boolean(),
    status: feeStatus,
    paidAmount: v.number(), // In cents
    createdAt: v.number(),
    paidAt: v.optional(v.number()),
    createdBy: v.id("users"),
  })
    .index("byApplication", ["applicationId"])
    .index("byStatus", ["status"]),

  transactions: defineTable({
    applicationId: v.id("applications"),
    feeId: v.id("fees"),
    amount: v.number(), // In cents
    method: paymentMethod,
    status: transactionStatus,
    squarePaymentId: v.optional(v.string()),
    squareOrderId: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    reference: v.optional(v.string()),
    registeredBy: v.optional(v.id("users")),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("byApplication", ["applicationId"])
    .index("byFee", ["feeId"])
    .index("bySquarePaymentId", ["squarePaymentId"]),

  paymentLinks: defineTable({
    applicationId: v.id("applications"),
    feeIds: v.array(v.id("fees")),
    squareLinkId: v.string(),
    squareOrderId: v.string(),
    squareUrl: v.string(),
    totalAmount: v.number(), // In cents
    status: paymentLinkStatus,
    idempotencyKey: v.string(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("byApplication", ["applicationId"])
    .index("bySquareOrderId", ["squareOrderId"])
    .index("byIdempotencyKey", ["idempotencyKey"]),

  webhookEvents: defineTable({
    eventId: v.string(),
    eventType: v.string(),
    processedAt: v.number(),
  }).index("byEventId", ["eventId"]),

  applicationDocuments: defineTable({
    applicationId: v.id("applications"),
    documentTypeId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    fileName: v.string(),
    contentType: v.string(),
    fileSize: v.number(),
    status: documentStatus,
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
  })
    .index("byApplication", ["applicationId"])
    .index("byApplicationAndType", ["applicationId", "documentTypeId"]),

  applicationDocumentConfig: defineTable({
    applicationId: v.id("applications"),
    documentTypeId: v.string(),
    visibility: documentVisibility,
    updatedAt: v.number(),
    updatedBy: v.id("users"),
    // Optional fields for custom document types (created by admin)
    isCustom: v.optional(v.boolean()),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  })
    .index("byApplication", ["applicationId"])
    .index("byApplicationAndType", ["applicationId", "documentTypeId"]),
});
