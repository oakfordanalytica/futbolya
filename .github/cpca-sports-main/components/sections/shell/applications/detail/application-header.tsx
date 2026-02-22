"use client";
import { useTranslations } from "next-intl";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Application, ApplicationStatus } from "@/lib/applications/types";
import { getFormField } from "@/lib/applications/types";
import { getCountryName } from "@/lib/countries/countries";
import { ApplicationPhoto } from "./pre-admission/application-photo";
import { Id } from "@/convex/_generated/dataModel";
import {
  BookOpen,
  GraduationCap,
  Calendar,
  ArrowRightLeft,
  Mail,
  Phone,
  Globe,
  Home,
  FileText,
  User,
  IdCard,
  Trash2,
  MoreVertical,
  MapPin,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useRef } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ApplicationBalanceCard } from "./payments/application-balance-card";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { ROUTES } from "@/lib/navigation/routes";
import { Avatar } from "@/components/ui/avatar";
import {
  ApplicationTransferDialog,
  type TransferUser,
  getTransferUserDisplayName,
  getTransferUserInitials,
} from "./application-transfer-dialog";

interface ApplicationHeaderProps {
  application: Application;
  organizationSlug: string;
  totalDue: number;
  totalPaid: number;
  totalPending: number;
  organizationLogoUrl?: string;
  associatedUser: TransferUser | null;
}

export function ApplicationHeader({
  application,
  organizationSlug,
  totalDue,
  totalPaid,
  totalPending,
  organizationLogoUrl,
  associatedUser,
}: ApplicationHeaderProps) {
  const t = useTranslations("Applications.detail");
  const tAthlete = useTranslations("preadmission.athlete");
  const { isAdmin } = useIsAdmin();
  const tStatus = useTranslations("Applications.statusOptions");

  const { formData } = application;

  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<Id<"_storage"> | null>(
    (formData.athlete?.photo as Id<"_storage">) || null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const updateStatus = useMutation(api.applications.updateStatus);
  const updatePhoto = useMutation(api.applications.updatePhoto);
  const deleteApplication = useMutation(api.applications.deleteApplication);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const liveAssociatedUser = useQuery(api.users.getById, {
    userId: application.userId,
  });

  const firstName = getFormField(formData, "athlete", "firstName");
  const lastName = getFormField(formData, "athlete", "lastName");
  const email = getFormField(formData, "athlete", "email");
  const telephone = getFormField(formData, "athlete", "telephone");
  const birthDate = getFormField(formData, "athlete", "birthDate");
  const countryOfBirth = getFormField(formData, "athlete", "countryOfBirth");
  const countryOfCitizenship = getFormField(
    formData,
    "athlete",
    "countryOfCitizenship",
  );
  const format = getFormField(formData, "athlete", "format");
  const program = getFormField(formData, "athlete", "program");
  const gradeEntering = getFormField(formData, "athlete", "gradeEntering");
  const enrollmentYear = getFormField(formData, "athlete", "enrollmentYear");
  const graduationYear = getFormField(formData, "athlete", "graduationYear");
  const needsI20 = getFormField(formData, "athlete", "needsI20");
  const interestedInBoarding = getFormField(
    formData,
    "general",
    "interestedInBoarding",
  );

  const streetAddress = getFormField(formData, "address", "streetAddress");
  const city = getFormField(formData, "address", "city");
  const country = getFormField(formData, "address", "country");
  const currentAssociatedUser: TransferUser | null =
    liveAssociatedUser === undefined
      ? associatedUser
      : liveAssociatedUser
        ? {
            _id: liveAssociatedUser._id,
            firstName: liveAssociatedUser.firstName,
            lastName: liveAssociatedUser.lastName,
            email: liveAssociatedUser.email,
            imageUrl: liveAssociatedUser.imageUrl,
          }
        : null;
  const associatedUserDisplayName = getTransferUserDisplayName(
    currentAssociatedUser,
  );
  const associatedUserInitials = getTransferUserInitials(currentAssociatedUser);

  const statusMap = {
    pending: { label: tStatus("pending"), variant: "outline" as const },
    reviewing: { label: tStatus("reviewing"), variant: "secondary" as const },
    "pre-admitted": {
      label: tStatus("pre-admitted"),
      variant: "default" as const,
    },
    admitted: { label: tStatus("admitted"), variant: "default" as const },
    denied: { label: tStatus("denied"), variant: "destructive" as const },
  };

  const statusInfo = statusMap[status];

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!isAdmin) return;

    setIsUpdating(true);
    try {
      await updateStatus({
        applicationId: application._id,
        status: newStatus,
      });

      setStatus(newStatus);
      toast.success(
        `Application status updated to: ${statusMap[newStatus].label}`,
      );
    } catch {
      toast.error("Failed to update application status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsUpdating(true);

    try {
      const uploadUrl = await generateUploadUrl();

      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();

      await updatePhoto({
        applicationId: application._id,
        photoStorageId: storageId,
      });

      setCurrentPhoto(storageId);
      toast.success("Photo updated successfully");
    } catch (error) {
      console.error("Failed to update photo:", error);
      toast.error("Failed to update photo. Please try again.");
    } finally {
      setIsUpdating(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteApplication = async () => {
    if (!isAdmin) return;

    setIsUpdating(true);
    try {
      await deleteApplication({
        applicationId: application._id,
      });

      toast.success("Application deleted successfully");
      router.replace(ROUTES.org.applications.list(organizationSlug));
    } catch (error) {
      console.error("Failed to delete application:", error);
      toast.error("Failed to delete application. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenTransferDialog = () => {
    if (!isAdmin) {
      return;
    }
    setIsTransferDialogOpen(true);
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };
  return (
    <section className="flex flex-col gap-4">
      <Card className="relative overflow-hidden">
        {organizationLogoUrl && (
          <div
            className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: `url(${organizationLogoUrl})`,
              backgroundSize: "60%",
            }}
          />
        )}
        <CardContent className="relative">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 shrink-0 relative">
                {currentPhoto ? (
                  <ApplicationPhoto
                    storageId={currentPhoto}
                    applicationId={application._id}
                    alt={`${firstName} ${lastName}`}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-md bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-2xl font-semibold">
                      {firstName.charAt(0).toUpperCase()}
                      {lastName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUpdating}
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-6 w-6 opacity-70 hover:opacity-100 hover:scale-100 transition-all duration-200"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUpdating}
                >
                  <Pencil className="h-2 w-2" />
                </Button>
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex flex-row justify-between items-start gap-2">
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                    {firstName} {lastName}
                  </h1>
                  {isAdmin && (
                    <CardAction className="hidden md:block">
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-9 w-9"
                        disabled={isUpdating}
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardAction>
                  )}
                </div>
                <div className="flex items-start gap-2 mt-1">
                  {isAdmin ? (
                    <Select
                      value={status}
                      onValueChange={handleStatusChange}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-fit h-7 text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          {tStatus("pending")}
                        </SelectItem>
                        <SelectItem value="reviewing">
                          {tStatus("reviewing")}
                        </SelectItem>
                        <SelectItem value="pre-admitted">
                          {tStatus("pre-admitted")}
                        </SelectItem>
                        <SelectItem value="admitted">
                          {tStatus("admitted")}
                        </SelectItem>
                        <SelectItem value="denied">
                          {tStatus("denied")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={statusInfo.variant} className="w-fit">
                      {statusInfo.label}
                    </Badge>
                  )}
                  {isAdmin && (
                    <>
                      {/* Vista móvil: Dropdown con todas las acciones */}
                      <div className="md:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-9 w-9"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {currentAssociatedUser && (
                              <DropdownMenuItem
                                onSelect={handleOpenTransferDialog}
                                className="flex items-center gap-2 max-w-56"
                              >
                                <Avatar
                                  src={currentAssociatedUser?.imageUrl}
                                  initials={associatedUserInitials}
                                  alt={associatedUserDisplayName}
                                  className="size-5 bg-muted text-muted-foreground"
                                />
                                <span className="truncate">
                                  {associatedUserDisplayName}
                                </span>
                                <ArrowRightLeft className="h-4 w-4 ml-auto text-muted-foreground" />
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <a
                                href={`tel:${telephone}`}
                                className="flex items-center gap-2"
                              >
                                <Phone className="h-4 w-4" />
                                <span>{t("call")}</span>
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a
                                href={`mailto:${email}`}
                                className="flex items-center gap-2"
                              >
                                <Mail className="h-4 w-4" />
                                <span>{t("email")}</span>
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setIsDeleteDialogOpen(true)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>{t("delete")}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {/* Vista medium y large: Botones individuales */}
                      <div className="hidden md:flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-9 w-9"
                          asChild
                        >
                          <a href={`tel:${telephone}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-9 w-9"
                          asChild
                        >
                          <a href={`mailto:${email}`}>
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                        {currentAssociatedUser && (
                          <Button
                            variant="outline"
                            className="h-9 max-w-56 justify-start gap-2 px-2"
                            onClick={handleOpenTransferDialog}
                          >
                            <Avatar
                              src={currentAssociatedUser?.imageUrl}
                              initials={associatedUserInitials}
                              alt={associatedUserDisplayName}
                              className="size-5 bg-muted text-muted-foreground"
                            />
                            <span className="truncate text-xs font-medium">
                              {associatedUserDisplayName}
                            </span>
                            <ArrowRightLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr />

            {/* Segunda fila: Grid con campos clave */}
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  {t("age")}:
                </span>
                <span className="text-muted-foreground">
                  {birthDate ? `${calculateAge(birthDate)} years` : "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  {t("birthCountry")}:
                </span>
                <span className="text-muted-foreground">
                  {getCountryName(countryOfBirth) || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  {t("citizenship")}:
                </span>
                <span className="text-muted-foreground">
                  {getCountryName(countryOfCitizenship) || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  {t("address")}:
                </span>
                <span className="text-muted-foreground">
                  {streetAddress && city && country
                    ? `${streetAddress}, ${city}, ${getCountryName(country)}`
                    : "-"}
                </span>
              </div>
              <hr />
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  {t("format")}:
                </span>
                <span className="text-muted-foreground capitalize">
                  {format || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  {t("program")}:
                </span>
                <span className="text-muted-foreground capitalize">
                  {program || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  {t("gradeEntering")}:
                </span>
                <span className="text-muted-foreground">
                  {gradeEntering
                    ? gradeEntering === "postgraduate"
                      ? tAthlete("gradePostgraduate")
                      : tAthlete(
                          `grade${gradeEntering}` as keyof typeof tAthlete,
                        )
                    : "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  {t("enrollmentYear")}:
                </span>
                <span className="text-muted-foreground">
                  {enrollmentYear || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  {t("graduationYear")}:
                </span>
                <span className="text-muted-foreground">
                  {graduationYear || "-"}
                </span>
              </div>
              <hr />
              <div className="flex items-center gap-2">
                <IdCard className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  {t("needsI20")}:
                </span>
                <span className="text-muted-foreground">
                  {needsI20 === "yes" ? t("yes") : t("no")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  {t("boarding")}:
                </span>
                <span className="text-muted-foreground">
                  {interestedInBoarding === "yes" ? t("yes") : t("no")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <ApplicationBalanceCard
        totalDue={totalDue}
        totalPaid={totalPaid}
        totalPending={totalPending}
      />

      {isAdmin && currentAssociatedUser && (
        <ApplicationTransferDialog
          open={isTransferDialogOpen}
          onOpenChange={setIsTransferDialogOpen}
          applicationId={application._id}
          organizationId={application.organizationId}
          organizationSlug={organizationSlug}
          sourceUser={currentAssociatedUser}
        />
      )}

      {/* Alert Dialog compartido para eliminar */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this application and all its
              associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteApplication}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
