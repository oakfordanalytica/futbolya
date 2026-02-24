import { routing } from "@/i18n/routing";
import { ROUTES, TEAM_ROUTES } from "@/lib/navigation/routes";

export function getLocalePrefix(locale: string): string {
  return locale === routing.defaultLocale ? "" : `/${locale}`;
}

export function withLocalePrefix(locale: string, path: string): string {
  return `${getLocalePrefix(locale)}${path}`;
}

export function getTenantSignInUrl(
  locale: string,
  tenantSlug: string | null,
): string {
  if (tenantSlug) {
    return withLocalePrefix(locale, ROUTES.tenant.auth.signIn(tenantSlug));
  }
  return withLocalePrefix(locale, ROUTES.auth.signIn);
}

export function getOrgUserProfileUrl(
  locale: string,
  tenantSlug: string | null,
): string {
  if (tenantSlug) {
    return withLocalePrefix(
      locale,
      ROUTES.org.settings.profileSecurity(tenantSlug),
    );
  }
  return withLocalePrefix(locale, ROUTES.auth.organizations);
}

export function getTeamUserProfileUrl(
  locale: string,
  tenantSlug: string,
  teamSlug: string,
): string {
  return withLocalePrefix(
    locale,
    TEAM_ROUTES.settings.profileSecurity(tenantSlug, teamSlug),
  );
}
