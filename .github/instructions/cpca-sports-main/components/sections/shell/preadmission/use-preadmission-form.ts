import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { STEPS, type StepId } from "./steps/steps-navigation";
import type { FormData as ConvexFormData } from "@/lib/applications/types";
import { COUNTRIES } from "@/lib/countries/countries";

export interface FormData {
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
  country: string;
  state: string;
  city: string;
  streetAddress: string;
  zipCode: string;
  currentSchoolName: string;
  currentSchoolType: string;
  currentGPA: string;
  schoolAddress: string;
  schoolCity: string;
  schoolCountry: string;
  schoolState: string;
  schoolZipCode: string;
  referenceFullName: string;
  referencePhone: string;
  referenceRelationship: string;
  parent1FirstName: string;
  parent1LastName: string;
  parent1Relationship: string;
  parent1Email: string;
  parent1Telephone: string;
  parent2FirstName: string;
  parent2LastName: string;
  parent2Relationship: string;
  parent2Email: string;
  parent2Telephone: string;
  personSubmitting: string;
  howDidYouHear: string;
  interestedInBoarding: string;
  profilePicture: File | null;
  message: string;
}

interface UsePreadmissionFormOptions {
  organizationSlug: string;
}

/**
 * Convert country code to full country name.
 */
function getCountryName(countryCode: string): string {
  const country = COUNTRIES.find((c) => c.value === countryCode);
  return country ? country.label : countryCode;
}

/**
 * Convert flat form data to sectioned format for Convex.
 */
function convertToConvexFormData(data: FormData): ConvexFormData {
  return {
    athlete: {
      photo: data.photo,
      format: data.format,
      program: data.program,
      enrollmentYear: data.enrollmentYear,
      graduationYear: data.graduationYear,
      firstName: data.firstName,
      lastName: data.lastName,
      sex: data.sex,
      height: data.height,
      birthDate: data.birthDate,
      email: data.email,
      telephone: data.telephone,
      countryOfBirth: getCountryName(data.countryOfBirth),
      countryOfCitizenship: getCountryName(data.countryOfCitizenship),
      highlightsLink: data.highlightsLink,
      gradeEntering: data.gradeEntering,
      programOfInterest: data.programOfInterest,
      needsI20: data.needsI20,
    },
    address: {
      country: data.country,
      state: data.state,
      city: data.city,
      streetAddress: data.streetAddress,
      zipCode: data.zipCode,
    },
    school: {
      currentSchoolName: data.currentSchoolName,
      currentSchoolType: data.currentSchoolType,
      currentGPA: data.currentGPA,
      schoolAddress: data.schoolAddress,
      schoolCity: data.schoolCity,
      schoolCountry: getCountryName(data.schoolCountry),
      schoolState: data.schoolState,
      schoolZipCode: data.schoolZipCode,
      referenceFullName: data.referenceFullName,
      referencePhone: data.referencePhone,
      referenceRelationship: data.referenceRelationship,
    },
    parents: {
      parent1FirstName: data.parent1FirstName,
      parent1LastName: data.parent1LastName,
      parent1Relationship: data.parent1Relationship,
      parent1Email: data.parent1Email,
      parent1Telephone: data.parent1Telephone,
      parent2FirstName: data.parent2FirstName,
      parent2LastName: data.parent2LastName,
      parent2Relationship: data.parent2Relationship,
      parent2Email: data.parent2Email,
      parent2Telephone: data.parent2Telephone,
    },
    general: {
      personSubmitting: data.personSubmitting,
      howDidYouHear: data.howDidYouHear,
      interestedInBoarding: data.interestedInBoarding,
      message: data.message,
    },
  };
}

export function usePreadmissionForm({
  organizationSlug,
}: UsePreadmissionFormOptions) {
  const submitApplication = useMutation(api.applications.submit);

  const [currentStep, setCurrentStep] = useState<StepId>("athlete");
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [applicationCode, setApplicationCode] = useState("");
  const [formData, setFormData] = useState<FormData>({
    format: "",
    program: "",
    enrollmentYear: "",
    graduationYear: "",
    firstName: "",
    lastName: "",
    sex: "",
    height: "",
    birthDate: "",
    email: "",
    telephone: "",
    countryOfBirth: "",
    countryOfCitizenship: "",
    highlightsLink: "",
    gradeEntering: "",
    programOfInterest: "",
    needsI20: "",
    photo: null,
    country: "",
    state: "",
    city: "",
    streetAddress: "",
    zipCode: "",
    currentSchoolName: "",
    currentSchoolType: "",
    currentGPA: "",
    schoolAddress: "",
    schoolCity: "",
    schoolCountry: "",
    schoolState: "",
    schoolZipCode: "",
    referenceFullName: "",
    referencePhone: "",
    referenceRelationship: "",
    parent1FirstName: "",
    parent1LastName: "",
    parent1Relationship: "",
    parent1Email: "",
    parent1Telephone: "",
    parent2FirstName: "",
    parent2LastName: "",
    parent2Relationship: "",
    parent2Email: "",
    parent2Telephone: "",
    personSubmitting: "",
    howDidYouHear: "",
    interestedInBoarding: "",
    profilePicture: null,
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: string, value: string | File | Id<"_storage"> | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === "athlete") {
      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
      }
      if (!formData.sex) {
        newErrors.sex = "Sex is required";
      }
      if (!formData.birthDate) {
        newErrors.birthDate = "Birth date is required";
      }
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
      if (!formData.countryOfBirth) {
        newErrors.countryOfBirth = "Country of birth is required";
      }
      if (!formData.countryOfCitizenship) {
        newErrors.countryOfCitizenship = "Country of citizenship is required";
      }
      if (!formData.needsI20) {
        newErrors.needsI20 = "Please select if you need an I-20";
      }
      if (!formData.photo) {
        newErrors.photo = "Photo is required";
      }
    }

    if (currentStep === "address") {
      if (!formData.country) {
        newErrors.country = "Country is required";
      }
      if (!formData.state.trim()) {
        newErrors.state = "State/Province is required";
      }
      if (!formData.city.trim()) {
        newErrors.city = "City is required";
      }
      if (!formData.streetAddress.trim()) {
        newErrors.streetAddress = "Street address is required";
      }
      if (!formData.zipCode.trim()) {
        newErrors.zipCode = "ZIP/Postal code is required";
      }
    }

    if (currentStep === "school") {
      if (!formData.currentSchoolName.trim()) {
        newErrors.currentSchoolName = "School name is required";
      }
      if (!formData.currentSchoolType) {
        newErrors.currentSchoolType = "School type is required";
      }
      if (!formData.currentGPA.trim()) {
        newErrors.currentGPA = "Current GPA is required";
      }
      if (!formData.schoolAddress.trim()) {
        newErrors.schoolAddress = "School address is required";
      }
      if (!formData.schoolCity.trim()) {
        newErrors.schoolCity = "City is required";
      }
      if (!formData.schoolCountry) {
        newErrors.schoolCountry = "Country is required";
      }
      if (!formData.schoolZipCode.trim()) {
        newErrors.schoolZipCode = "ZIP/Postal code is required";
      }
      if (!formData.referenceFullName.trim()) {
        newErrors.referenceFullName = "Reference full name is required";
      }
      if (!formData.referencePhone.trim()) {
        newErrors.referencePhone = "Reference phone is required";
      }
      if (!formData.referenceRelationship.trim()) {
        newErrors.referenceRelationship = "Relationship is required";
      }
    }

    if (currentStep === "parents") {
      if (!formData.parent1FirstName.trim()) {
        newErrors.parent1FirstName = "Parent 1 first name is required";
      }
      if (!formData.parent1LastName.trim()) {
        newErrors.parent1LastName = "Parent 1 last name is required";
      }
      if (!formData.parent1Relationship) {
        newErrors.parent1Relationship = "Parent 1 relationship is required";
      }
      if (!formData.parent1Email.trim()) {
        newErrors.parent1Email = "Parent 1 email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent1Email)) {
        newErrors.parent1Email = "Invalid email format";
      }
      if (!formData.parent1Telephone.trim()) {
        newErrors.parent1Telephone = "Parent 1 telephone is required";
      }
    }

    if (currentStep === "general") {
      if (!formData.personSubmitting) {
        newErrors.personSubmitting = "Person submitting is required";
      }
      if (!formData.howDidYouHear) {
        newErrors.howDidYouHear = "This field is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleStepClick = (stepId: StepId) => {
    const stepIndex = STEPS.findIndex((s) => s.id === stepId);
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

    if (stepIndex <= currentIndex || completedSteps.has(stepId)) {
      setCurrentStep(stepId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const convexFormData = convertToConvexFormData(formData);
      const result = await submitApplication({
        organizationSlug,
        formData: convexFormData,
      });

      setApplicationCode(result.applicationCode);
      setIsSubmitted(true);
    } catch (error) {
      const err = error as Error;
      setSubmitError(err.message || "Failed to submit application");
      console.error("[PreAdmissionForm] Submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewApplication = () => {
    setIsSubmitted(false);
    setApplicationCode("");
    setCurrentStep("athlete");
    setCompletedSteps(new Set());
    setFormData({
      format: "",
      program: "",
      enrollmentYear: "",
      graduationYear: "",
      firstName: "",
      lastName: "",
      sex: "",
      height: "",
      birthDate: "",
      email: "",
      telephone: "",
      countryOfBirth: "",
      countryOfCitizenship: "",
      highlightsLink: "",
      gradeEntering: "",
      programOfInterest: "",
      needsI20: "",
      photo: null,
      country: "",
      state: "",
      city: "",
      streetAddress: "",
      zipCode: "",
      currentSchoolName: "",
      currentSchoolType: "",
      currentGPA: "",
      schoolAddress: "",
      schoolCity: "",
      schoolCountry: "",
      schoolState: "",
      schoolZipCode: "",
      referenceFullName: "",
      referencePhone: "",
      referenceRelationship: "",
      parent1FirstName: "",
      parent1LastName: "",
      parent1Relationship: "",
      parent1Email: "",
      parent1Telephone: "",
      parent2FirstName: "",
      parent2LastName: "",
      parent2Relationship: "",
      parent2Email: "",
      parent2Telephone: "",
      personSubmitting: "",
      howDidYouHear: "",
      interestedInBoarding: "",
      profilePicture: null,
      message: "",
    });
    setErrors({});
  };

  const isLastStep = currentStep === STEPS[STEPS.length - 1].id;
  const isFirstStep = currentStep === STEPS[0].id;

  return {
    currentStep,
    completedSteps,
    formData,
    errors,
    isLastStep,
    isFirstStep,
    isSubmitted,
    isSubmitting,
    submitError,
    applicationCode,
    handleFieldChange,
    validateCurrentStep,
    handleNext,
    handleBack,
    handleNewApplication,
    handleStepClick,
    handleSubmit,
  };
}
