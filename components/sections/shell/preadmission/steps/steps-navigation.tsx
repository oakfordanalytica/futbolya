"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  UserIcon,
  MapPinIcon,
  AcademicCapIcon,
  UsersIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";

export const STEPS = [
  {
    id: "athlete" as const,
    icon: UserIcon,
    descriptionKey: "athleteDescription" as const,
  },
  {
    id: "address" as const,
    icon: MapPinIcon,
    descriptionKey: "addressDescription" as const,
  },
  {
    id: "school" as const,
    icon: AcademicCapIcon,
    descriptionKey: "schoolDescription" as const,
  },
  {
    id: "parents" as const,
    icon: UsersIcon,
    descriptionKey: "parentsDescription" as const,
  },
  {
    id: "general" as const,
    icon: DocumentTextIcon,
    descriptionKey: "generalDescription" as const,
  },
] as const;

export type StepId = typeof STEPS[number]["id"];

interface StepsNavigationProps {
  currentStep: StepId;
  completedSteps: Set<StepId>;
  onStepClick: (stepId: StepId) => void;
}

export function StepsNavigation({
  currentStep,
  completedSteps,
  onStepClick,
}: StepsNavigationProps) {
  const t = useTranslations("preadmission.steps");

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center justify-between gap-1 sm:gap-2 min-w-max sm:min-w-0">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.has(step.id);
          const isAccessible =
            completedSteps.has(step.id) ||
            STEPS.findIndex((s) => s.id === step.id) <=
              STEPS.findIndex((s) => s.id === currentStep);

          return (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => onStepClick(step.id)}
                disabled={!isAccessible}
                className={cn(
                  "flex flex-col items-center gap-1.5 sm:gap-2 w-full p-2 sm:p-3 rounded-lg transition-colors",
                  isActive && "bg-primary/10",
                  !isActive && isAccessible && "hover:bg-muted",
                  !isAccessible && "opacity-50 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full transition-colors",
                    isCompleted && !isActive && "bg-green-500 text-white",
                    isActive && "bg-primary text-primary-foreground",
                    !isCompleted &&
                      !isActive &&
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted && !isActive ? (
                    <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-xs sm:text-sm font-medium whitespace-nowrap",
                      isActive && "text-primary"
                    )}
                  >
                    {t(step.id)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                    {t(step.descriptionKey)}
                  </p>
                </div>
              </button>

              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-1 sm:mx-2 transition-colors",
                    isCompleted ? "bg-green-500" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
