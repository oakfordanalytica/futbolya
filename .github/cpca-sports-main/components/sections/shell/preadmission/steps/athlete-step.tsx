"use client";

import { useTranslations } from "next-intl";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhotoUpload } from "../photo-upload";
import { Id } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CountryCombobox } from "@/components/ui/country-combobox";

interface AthleteStepProps {
  formData: {
    format: string;
    program: string;
    enrollmentYear: string;
    graduationYear: string;
    firstName: string;
    lastName: string;
    sex: string;
    height: string;
    birthDate: string;
    email: string;
    telephone: string;
    countryOfBirth: string;
    countryOfCitizenship: string;
    highlightsLink: string;
    gradeEntering: string;
    programOfInterest: string;
    needsI20: string;
    photo: Id<"_storage"> | null;
  };
  onChange: (field: string, value: string | Id<"_storage"> | null) => void;
  errors?: Record<string, string>;
}

export function AthleteStep({ formData, onChange, errors }: AthleteStepProps) {
  const t = useTranslations("preadmission.athlete");

  return (
    <div className="space-y-4 sm:space-y-6">
      <PhotoUpload
        value={formData.photo}
        onChange={(storageId) => onChange("photo", storageId)}
        required
      />
      {errors?.photo && (
        <p className="text-sm text-destructive mt-1">{errors.photo}</p>
      )}

      <FieldGroup>
        <div className="grid gap-4 grid-cols-2">
          <Field>
            <FieldLabel>
              {t("format")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              value={formData.format}
              onValueChange={(value) => onChange("format", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("formatPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="american">{t("formatAmerican")}</SelectItem>
                <SelectItem value="international">
                  {t("formatInternational")}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>
              {t("program")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              value={formData.program}
              onValueChange={(value) => onChange("program", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("formatPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baseball">{t("programBaseball")}</SelectItem>
                <SelectItem value="basketball">
                  {t("programBasketball")}
                </SelectItem>
                <SelectItem value="soccer">{t("programSoccer")}</SelectItem>
                <SelectItem value="volleyball">
                  {t("programVolleyball")}
                </SelectItem>
                <SelectItem value="hr14_baseball">
                  {t("programHR14Baseball")}
                </SelectItem>
                <SelectItem value="golf">{t("programGolf")}</SelectItem>
                <SelectItem value="tennis">{t("programTennis")}</SelectItem>
                <SelectItem value="softball">{t("programSoftball")}</SelectItem>
                <SelectItem value="volleyball-club">
                  {t("programVolleyballClub")}
                </SelectItem>
                <SelectItem value="pg-basketball">
                  {t("programPGBasketball")}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 grid-cols-2">
          <Field>
            <FieldLabel>
              {t("enrollmentYear")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              value={formData.enrollmentYear}
              onValueChange={(value) => onChange("enrollmentYear", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("formatPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>
              {t("graduationYear")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              value={formData.graduationYear}
              onValueChange={(value) => onChange("graduationYear", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("formatPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 grid-cols-2">
          <Field>
            <FieldLabel>
              {t("firstName")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              value={formData.firstName}
              onChange={(e) => onChange("firstName", e.target.value)}
              placeholder={t("firstNamePlaceholder")}
              required
            />
            {errors?.firstName && (
              <p className="text-sm text-destructive mt-1">
                {errors.firstName}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel>
              {t("lastName")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              value={formData.lastName}
              onChange={(e) => onChange("lastName", e.target.value)}
              placeholder={t("lastNamePlaceholder")}
              required
            />
            {errors?.lastName && (
              <p className="text-sm text-destructive mt-1">{errors.lastName}</p>
            )}
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Field>
            <FieldLabel>
              {t("sex")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              value={formData.sex}
              onValueChange={(value) => onChange("sex", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("formatPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("sexMale")}</SelectItem>
                <SelectItem value="female">{t("sexFemale")}</SelectItem>
                <SelectItem value="other">{t("sexOther")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>
              {t("birthDate")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="date"
              value={formData.birthDate}
              onChange={(e) => onChange("birthDate", e.target.value)}
              required
            />
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>
              {t("countryOfBirth")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <CountryCombobox
              value={formData.countryOfBirth}
              onValueChange={(value) => onChange("countryOfBirth", value)}
              placeholder={t("countryOfBirthPlaceholder")}
            />
          </Field>

          <Field>
            <FieldLabel>
              {t("countryOfCitizenship")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <CountryCombobox
              value={formData.countryOfCitizenship}
              onValueChange={(value) => onChange("countryOfCitizenship", value)}
              placeholder={t("countryOfCitizenshipPlaceholder")}
            />
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Field>
            <FieldLabel>
              {t("email")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder={t("emailPlaceholder")}
              required
            />
          </Field>

          <Field>
            <FieldLabel>
              {t("telephone")} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="tel"
              value={formData.telephone}
              onChange={(e) => onChange("telephone", e.target.value)}
              placeholder={t("telephonePlaceholder")}
            />
          </Field>
        </div>
      </FieldGroup>

      <Field>
        <FieldLabel>{t("height")}</FieldLabel>
        <div className="flex gap-2">
          <Input
            value={formData.height.split("-")[0] || ""}
            onChange={(e) => {
              const inches = formData.height.split("-")[1] || "";
              onChange("height", `${e.target.value}-${inches}`);
            }}
            placeholder={t("heightFeet")}
            type="number"
            className="w-1/2"
          />
          <Input
            value={formData.height.split("-")[1] || ""}
            onChange={(e) => {
              const feet = formData.height.split("-")[0] || "";
              onChange("height", `${feet}-${e.target.value}`);
            }}
            placeholder={t("heightInches")}
            type="number"
            className="w-1/2"
          />
        </div>
      </Field>

      <Field>
        <FieldLabel>
          {t("highlightsLink")}
          <span className="text-xs text-muted-foreground ml-1">
            {t("highlightsLinkHint")}
          </span>
        </FieldLabel>
        <Input
          type="url"
          value={formData.highlightsLink}
          onChange={(e) => onChange("highlightsLink", e.target.value)}
          placeholder={t("highlightsLinkPlaceholder")}
        />
      </Field>

      <FieldGroup>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Field>
            <FieldLabel>
              {t("gradeEntering")}
              <span className="text-destructive ml-1">*</span>
            </FieldLabel>
            <Select
              value={formData.gradeEntering}
              onValueChange={(value) => onChange("gradeEntering", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("formatPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t("grade1")}</SelectItem>
                <SelectItem value="2">{t("grade2")}</SelectItem>
                <SelectItem value="3">{t("grade3")}</SelectItem>
                <SelectItem value="4">{t("grade4")}</SelectItem>
                <SelectItem value="5">{t("grade5")}</SelectItem>
                <SelectItem value="6">{t("grade6")}</SelectItem>
                <SelectItem value="7">{t("grade7")}</SelectItem>
                <SelectItem value="8">{t("grade8")}</SelectItem>
                <SelectItem value="9">{t("grade9")}</SelectItem>
                <SelectItem value="10">{t("grade10")}</SelectItem>
                <SelectItem value="11">{t("grade11")}</SelectItem>
                <SelectItem value="12">{t("grade12")}</SelectItem>
                <SelectItem value="postgraduate">
                  {t("gradePostgraduate")}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>{t("programOfInterest")}</FieldLabel>
            <Select
              value={formData.programOfInterest}
              onValueChange={(value) => onChange("programOfInterest", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("formatPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elementary">
                  {t("programElementary")}
                </SelectItem>
                <SelectItem value="middle">{t("programMiddle")}</SelectItem>
                <SelectItem value="high">{t("programHigh")}</SelectItem>
                <SelectItem value="postgraduate">
                  {t("programPostgraduate")}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>
              {t("needsI20")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              value={formData.needsI20}
              onValueChange={(value) => onChange("needsI20", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("formatPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-citizen">{t("i20NoCitizen")}</SelectItem>
                <SelectItem value="no-non-citizen">
                  {t("i20NoNonCitizen")}
                </SelectItem>
                <SelectItem value="yes-new">{t("i20YesNew")}</SelectItem>
                <SelectItem value="yes-transfer">
                  {t("i20YesTransfer")}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FieldGroup>
    </div>
  );
}
