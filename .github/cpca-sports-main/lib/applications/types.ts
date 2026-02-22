import type { Id } from "@/convex/_generated/dataModel";

export type ApplicationStatus =
  | "pending"
  | "reviewing"
  | "pre-admitted"
  | "admitted"
  | "denied";

export type FormData = Record<
  string,
  Record<string, string | number | boolean | null | Id<"_storage">>
>;

export interface Application {
  _id: Id<"applications">;
  _creationTime: number;
  userId: Id<"users">;
  organizationId: Id<"organizations">;
  formTemplateId: Id<"formTemplates">;
  formTemplateVersion: number;
  applicationCode: string;
  status: ApplicationStatus;
  formData: FormData;
  reviewedBy?: Id<"users">;
  reviewedAt?: number;
}

/**
 * Helper to get a field value from formData.
 * formData structure: { sectionKey: { fieldKey: value } }
 */
export function getFormField(
  formData: FormData,
  sectionKey: string,
  fieldKey: string,
): string {
  const value = formData[sectionKey]?.[fieldKey];
  return value != null ? String(value) : "";
}
