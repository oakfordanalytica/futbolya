"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "convex/react";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import AvatarUpload from "@/components/ui/avatar-upload";
import { CountryCombobox } from "@/components/ui/country-combobox";
import { normalizeCountryValue } from "@/lib/countries/countries";
import type { FileWithPreview } from "@/hooks/use-file-upload";

type PlayerGender = "male" | "female" | "mixed";
type DominantProfile = "left" | "right" | "both";

interface PlayerData {
  _id: string;
  firstName: string;
  lastName: string;
  secondLastName?: string | null;
  photoUrl?: string | null;
  dateOfBirth?: string | null;
  documentNumber?: string | null;
  gender?: PlayerGender | null;
  cometNumber?: string | null;
  fifaId?: string | null;
  position?: string | null;
  dominantProfile?: DominantProfile | null;
  height?: number | null;
  weight?: number | null;
  country?: string | null;
  categoryId?: string;
}

interface PositionOption {
  id: string;
  name: string;
  abbreviation: string;
}

interface PlayerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubSlug: string;
  positions: PositionOption[];
  player?: PlayerData | null;
}

export function PlayerFormDialog({
  open,
  onOpenChange,
  clubSlug,
  positions,
  player,
}: PlayerFormDialogProps) {
  const t = useTranslations("Common");
  const createPlayer = useMutation(api.players.createPlayer);
  const updatePlayer = useMutation(api.players.updatePlayer);
  const generateUploadUrl = useMutation(api.players.generateUploadUrl);

  const categories = useQuery(api.categories.listByClubSlug, {
    clubSlug,
  });

  const isEditMode = !!player;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [documentNumber, setDocumentNumber] = useState("");
  const [gender, setGender] = useState<PlayerGender | "">("");
  const [cometNumber, setCometNumber] = useState("");
  const [fifaId, setFifaId] = useState("");
  const [position, setPosition] = useState("");
  const [dominantProfile, setDominantProfile] = useState<
    DominantProfile | ""
  >("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [country, setCountry] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [photoFile, setPhotoFile] = useState<FileWithPreview | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (player && open) {
      setFirstName(player.firstName);
      setLastName(player.lastName);
      setSecondLastName(player.secondLastName ?? "");
      setDateOfBirth(
        player.dateOfBirth
          ? parse(player.dateOfBirth, "yyyy-MM-dd", new Date())
          : undefined,
      );
      setDocumentNumber(player.documentNumber ?? "");
      setGender(player.gender ?? "");
      setCometNumber(player.cometNumber ?? "");
      setFifaId(player.fifaId ?? "");
      setPosition(player.position ?? "");
      setDominantProfile(player.dominantProfile ?? "");
      setHeight(player.height?.toString() ?? "");
      setWeight(player.weight?.toString() ?? "");
      setCountry(normalizeCountryValue(player.country));
      setCategoryId(player.categoryId ?? "");
      setCurrentPhotoUrl(player.photoUrl ?? null);
      setPhotoFile(null);
    }
  }, [player, open]);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setSecondLastName("");
    setDateOfBirth(undefined);
    setDocumentNumber("");
    setGender("");
    setCometNumber("");
    setFifaId("");
    setPosition("");
    setDominantProfile("");
    setHeight("");
    setWeight("");
    setCountry("");
    setCategoryId("");
    setPhotoFile(null);
    setCurrentPhotoUrl(null);
  };

  const uploadPhoto = async (): Promise<Id<"_storage"> | undefined> => {
    if (!photoFile || !(photoFile.file instanceof File)) {
      return undefined;
    }

    const uploadUrl = await generateUploadUrl();
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": photoFile.file.type },
      body: photoFile.file,
    });

    if (!response.ok) {
      throw new Error("Failed to upload photo");
    }

    const { storageId } = await response.json();
    return storageId as Id<"_storage">;
  };

  const isFormValid = useMemo(
    () =>
      Boolean(
        firstName.trim() &&
          lastName.trim() &&
          secondLastName.trim() &&
          dateOfBirth &&
          documentNumber.trim() &&
          gender &&
          cometNumber.trim() &&
          position &&
          dominantProfile &&
          country &&
          categoryId,
      ),
    [
      categoryId,
      cometNumber,
      country,
      dateOfBirth,
      documentNumber,
      dominantProfile,
      firstName,
      gender,
      lastName,
      position,
      secondLastName,
    ],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid || !dateOfBirth || !gender || !dominantProfile) {
      return;
    }

    setIsSubmitting(true);

    try {
      const photoStorageId = await uploadPhoto();
      const normalizedCountry = normalizeCountryValue(country);

      if (isEditMode) {
        await updatePlayer({
          playerId: player._id as Id<"players">,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          secondLastName: secondLastName.trim(),
          ...(photoStorageId && { photoStorageId }),
          dateOfBirth: format(dateOfBirth, "yyyy-MM-dd"),
          documentNumber: documentNumber.trim(),
          gender,
          categoryId: categoryId as Id<"categories">,
          cometNumber: cometNumber.trim(),
          fifaId: fifaId.trim() || undefined,
          position,
          dominantProfile,
          height: height ? parseInt(height, 10) : undefined,
          weight: weight ? parseInt(weight, 10) : undefined,
          country: normalizedCountry || undefined,
        });
      } else {
        await createPlayer({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          secondLastName: secondLastName.trim(),
          photoStorageId,
          dateOfBirth: format(dateOfBirth, "yyyy-MM-dd"),
          documentNumber: documentNumber.trim(),
          gender,
          categoryId: categoryId as Id<"categories">,
          cometNumber: cometNumber.trim(),
          fifaId: fifaId.trim() || undefined,
          position,
          dominantProfile,
          height: height ? parseInt(height, 10) : undefined,
          weight: weight ? parseInt(weight, 10) : undefined,
          country: normalizedCountry || undefined,
        });
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error(
        `[PlayerFormDialog] Failed to ${isEditMode ? "update" : "create"} player:`,
        error,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setTimeout(resetForm, 150);
    }
  };

  const handleFileChange = (file: FileWithPreview | null) => {
    setPhotoFile(file);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
          <DialogTitle>
            {isEditMode ? t("players.edit") : t("players.create")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="space-y-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="mx-auto lg:mx-0">
                  <AvatarUpload
                    onFileChange={handleFileChange}
                    defaultAvatar={currentPhotoUrl ?? undefined}
                  />
                </div>

                <FieldGroup className="w-full flex-1 gap-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field>
                      <FieldLabel>{t("players.firstName")}</FieldLabel>
                      <Input
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        required
                        placeholder={t("players.firstName")}
                      />
                    </Field>

                    <Field>
                      <FieldLabel>{t("players.lastName")}</FieldLabel>
                      <Input
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        required
                        placeholder={t("players.lastName")}
                      />
                    </Field>

                    <Field>
                      <FieldLabel>{t("players.secondLastName")}</FieldLabel>
                      <Input
                        value={secondLastName}
                        onChange={(event) =>
                          setSecondLastName(event.target.value)
                        }
                        required
                        placeholder={t("players.secondLastName")}
                      />
                    </Field>
                  </div>
                </FieldGroup>
              </div>

              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field>
                    <FieldLabel>{t("players.cometNumber")}</FieldLabel>
                    <Input
                      value={cometNumber}
                      onChange={(event) => setCometNumber(event.target.value)}
                      required
                      placeholder={t("players.cometNumber")}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>{t("players.fifaId")}</FieldLabel>
                    <Input
                      value={fifaId}
                      onChange={(event) => setFifaId(event.target.value)}
                      placeholder={t("players.fifaId")}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>{t("players.documentNumber")}</FieldLabel>
                    <Input
                      value={documentNumber}
                      onChange={(event) =>
                        setDocumentNumber(event.target.value)
                      }
                      required
                      placeholder={t("players.documentNumber")}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>{t("players.gender")}</FieldLabel>
                    <Select
                      value={gender}
                      onValueChange={(value) =>
                        setGender(value as PlayerGender)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("players.selectGender")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">
                          {t("players.genderOptions.male")}
                        </SelectItem>
                        <SelectItem value="female">
                          {t("players.genderOptions.female")}
                        </SelectItem>
                        <SelectItem value="mixed">
                          {t("players.genderOptions.mixed")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>

              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>{t("players.dateOfBirth")}</FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateOfBirth && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateOfBirth ? (
                            format(dateOfBirth, "PPP")
                          ) : (
                            <span>{t("players.dateOfBirth")}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateOfBirth}
                          onSelect={setDateOfBirth}
                          captionLayout="dropdown"
                          fromYear={1960}
                          toYear={new Date().getFullYear()}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>

                  <Field>
                    <FieldLabel>{t("players.country")}</FieldLabel>
                    <CountryCombobox
                      value={country}
                      onValueChange={setCountry}
                      placeholder={t("players.selectCountry")}
                      searchPlaceholder={`${t("actions.search")} ${t("players.country").toLowerCase()}...`}
                      emptyText={t("table.noResults")}
                    />
                  </Field>
                </div>
              </FieldGroup>

              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field>
                    <FieldLabel>{t("players.position")}</FieldLabel>
                    <Select value={position} onValueChange={setPosition}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("players.selectPosition")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((pos) => (
                          <SelectItem key={pos.id} value={pos.id}>
                            {pos.name} ({pos.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>{t("players.dominantProfile")}</FieldLabel>
                    <Select
                      value={dominantProfile}
                      onValueChange={(value) =>
                        setDominantProfile(value as DominantProfile)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("players.selectDominantProfile")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">{t("foot.left")}</SelectItem>
                        <SelectItem value="right">{t("foot.right")}</SelectItem>
                        <SelectItem value="both">{t("foot.both")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>{t("players.category")}</FieldLabel>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("players.selectCategory")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>

              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>{t("players.height")}</FieldLabel>
                    <Input
                      type="number"
                      min="100"
                      max="250"
                      value={height}
                      onChange={(event) => setHeight(event.target.value)}
                      placeholder="cm"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>{t("players.weight")}</FieldLabel>
                    <Input
                      type="number"
                      min="30"
                      max="200"
                      value={weight}
                      onChange={(event) => setWeight(event.target.value)}
                      placeholder="kg"
                    />
                  </Field>
                </div>
              </FieldGroup>
            </div>
          </div>

          <DialogFooter className="border-t px-4 py-3 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || !isFormValid}>
              {isSubmitting
                ? t("actions.loading")
                : isEditMode
                  ? t("actions.save")
                  : t("actions.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
