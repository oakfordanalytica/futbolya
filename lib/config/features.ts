/**
 * Feature flag helpers for optional UI modules.
 */
export const ADS_ENABLED_ENV_KEYS = [
  "NEXT_PUBLIC_ADS_ENABLED",
  "NEXT_PUBLIC_ADDS_ENABLED",
  "ADS_ENABLED",
  "ADDS_ENABLED",
] as const;

type BooleanLike = string | undefined;

const TRUTHY_VALUES = new Set(["true", "1", "yes", "on"]);
const FALSY_VALUES = new Set(["false", "0", "no", "off"]);

function parseBooleanFlag(value: BooleanLike, fallback = false): boolean {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalised = value.trim().toLowerCase();
  if (TRUTHY_VALUES.has(normalised)) {
    return true;
  }

  if (FALSY_VALUES.has(normalised)) {
    return false;
  }

  return fallback;
}

export interface FeatureFlags {
  adsEnabled: boolean;
}

interface AdsEnabledOptions {
  override?: boolean;
  defaultValue?: boolean;
}

export function isAdsEnabled(options: AdsEnabledOptions = {}): boolean {
  if (typeof options.override === "boolean") {
    return options.override;
  }

  const fallback = options.defaultValue ?? false;

  for (const key of ADS_ENABLED_ENV_KEYS) {
    const envValue = process.env[key];
    if (envValue !== undefined) {
      return parseBooleanFlag(envValue, fallback);
    }
  }

  return fallback;
}

export function getFeatureFlags(
  overrides: Partial<FeatureFlags> = {},
): FeatureFlags {
  return {
    adsEnabled: isAdsEnabled({ override: overrides.adsEnabled }),
  };
}

export const featureFlags = getFeatureFlags();
