import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PublicHeader } from "@/components/sections/public/public-header";
import { Container } from "@/components/ui/container";

export async function PublicShell({ children }: { children: ReactNode }) {
  const t = await getTranslations("Public");

  return (
    <div className="min-h-dvh bg-public-paper font-(family-name:--font-open-sans) text-public-ink">
      <PublicHeader
        navigationLabel={t("nav.label")}
        skipLabel={t("nav.skip")}
        productLabel={t("nav.product")}
        gamesLabel={t("nav.games")}
        signInLabel={t("nav.signIn")}
        languageLabel={t("nav.language")}
      />
      {children}
      <footer className="bg-public-ink text-public-paper">
        <Container className="flex max-w-7xl flex-col gap-3 px-4 py-10 text-sm sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <span
            className="text-3xl font-black uppercase tracking-[-0.05em]"
            translate="no"
          >
            Futbolya
          </span>
          <span className="text-public-paper/60">{t("footer")}</span>
        </Container>
      </footer>
    </div>
  );
}
