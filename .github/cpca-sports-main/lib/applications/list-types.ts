import type { Id } from "@/convex/_generated/dataModel";
import type { ApplicationStatus } from "@/lib/applications/types";

export interface ApplicationListItem {
  _id: Id<"applications">;
  _creationTime: number;
  organizationId: Id<"organizations">;
  applicationCode: string;
  status: ApplicationStatus;
  athlete: {
    firstName: string;
    lastName: string;
    email: string;
    telephone: string;
    sex: string;
    program: string;
    gradeEntering: string;
    birthDate: string;
    countryOfBirth: string;
    countryOfCitizenship: string;
    graduationYear: string;
    needsI20: string;
    photoStorageId?: Id<"_storage">;
    photoUrl?: string;
  };
  school: {
    currentSchoolName: string;
    currentGPA: string;
  };
  parent: {
    firstName: string;
    lastName: string;
    email: string;
    telephone: string;
  };
  account: {
    firstName: string;
    lastName: string;
    email: string;
    imageUrl?: string;
  };
}
