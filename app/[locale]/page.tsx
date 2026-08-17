import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { preloadQuery } from "convex/nextjs";
import { getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { LiveGames } from "@/components/sections/public/public-games";
import { PublicShell } from "@/components/sections/public/public-shell";
import { PublicStandings } from "@/components/sections/public/public-standings";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/navigation/routes";
import { DEFAULT_TENANT_SLUG } from "@/lib/tenancy/config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

async function LiveGamesContent() {
  const preloadedGames = await preloadQuery(api.games.listPublicLive, {
    orgSlug: DEFAULT_TENANT_SLUG,
  });

  return <LiveGames preloadedGames={preloadedGames} />;
}

async function StandingsContent() {
  const preloadedStandings = await preloadQuery(
    api.games.getPublicSeasonTable,
    { orgSlug: DEFAULT_TENANT_SLUG },
  );

  return <PublicStandings preloadedStandings={preloadedStandings} />;
}

function LiveGamesFallback() {
  return (
    <div className="border-t border-public-ink/20" aria-busy="true">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="grid gap-4 border-b border-public-ink/20 py-7 md:grid-cols-[0.5fr_1.5fr_auto] md:items-center"
        >
          <Skeleton className="h-10 rounded-none" />
          <Skeleton className="h-16 rounded-none" />
          <Skeleton className="h-8 w-24 rounded-none" />
        </div>
      ))}
    </div>
  );
}

function StandingsFallback() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <Skeleton className="h-14 rounded-none bg-public-paper/10" />
      {[0, 1, 2, 3, 4].map((item) => (
        <Skeleton key={item} className="h-12 rounded-none bg-public-paper/10" />
      ))}
    </div>
  );
}

export default async function LocaleHomePage() {
  const t = await getTranslations("Public");

  const productItems = [
    {
      title: t("product.leagueTitle"),
      description: t("product.leagueDescription"),
    },
    {
      title: t("product.clubsTitle"),
    },
    {
      title: t("product.liveTitle"),
      description: t("product.liveDescription"),
    },
  ];

  return (
    <PublicShell>
      <main id="main-content">
        <section className="relative isolate min-h-[720px] overflow-hidden bg-public-paper sm:min-h-[760px]">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[72%] overflow-hidden bg-public-ink [clip-path:polygon(0_8%,100%_0,100%_100%,0_100%)] sm:h-[66%] sm:[clip-path:polygon(0_25%,100%_0,100%_100%,0_100%)]"
            aria-hidden="true"
          >
            <Image
              src="/background-auth.jpg"
              alt=""
              fill
              priority
              sizes="(max-width: 1500px) 100vw, 1500px"
              className="object-cover opacity-75 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-public-ink/45" />
          </div>

          <Container className="relative flex min-h-[720px] max-w-7xl flex-col px-4 py-8 sm:min-h-[760px] sm:px-6 sm:py-14 lg:px-8">
            <div className="grid grid-cols-[1fr_auto] items-start gap-4 text-xs font-bold uppercase leading-tight tracking-[0.18em]">
              <span className="max-w-40">{t("hero.eyebrow")}</span>
              <a
                href="#live"
                className="flex max-w-36 items-start justify-self-end gap-2 text-right transition-opacity hover:opacity-55"
              >
                {t("hero.viewLive")}
                <ArrowDownRight className="size-4" aria-hidden="true" />
              </a>
            </div>

            <div
              className="mt-8 whitespace-nowrap text-center text-[clamp(3.25rem,17vw,5rem)] font-black uppercase leading-[0.78] tracking-[-0.085em] sm:text-[clamp(4rem,14vw,12rem)]"
              aria-hidden="true"
            >
              Futbolya
            </div>

            <div className="mt-auto grid gap-8 pb-4 text-public-paper lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:pb-8">
              <h1 className="max-w-3xl text-balance text-[clamp(2.65rem,13vw,4rem)] font-black uppercase leading-[0.92] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                {t("hero.title")}
              </h1>
              <div className="lg:pb-1">
                <p className="max-w-xl text-pretty text-base leading-7 text-public-paper/75 sm:text-lg">
                  {t("hero.description")}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-public-paper text-public-ink hover:bg-public-fog"
                  >
                    <Link href="/#live">
                      {t("hero.viewLive")}
                      <ArrowDownRight data-icon="inline-end" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-public-paper/50 bg-transparent text-public-paper hover:bg-public-paper hover:text-public-ink"
                  >
                    <Link href={ROUTES.tenant.auth.signIn(DEFAULT_TENANT_SLUG)}>
                      {t("hero.manage")}
                      <ArrowUpRight data-icon="inline-end" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section
          id="product"
          className="scroll-mt-20 border-b border-public-ink/20 bg-public-paper px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
        >
          <Container className="max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch lg:gap-12">
              <figure className="relative aspect-4/5 overflow-hidden rounded-sm bg-public-ink sm:aspect-5/4 lg:aspect-auto lg:min-h-[560px]">
                <Image
                  src="/background-auth.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover object-[58%_center] grayscale contrast-125"
                />
                <div className="absolute inset-0 bg-public-ink/35" />
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-public-ink to-transparent" />
                <div
                  className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-public-paper sm:p-8"
                  aria-hidden="true"
                >
                  <span
                    className="text-2xl font-black uppercase leading-none tracking-[-0.04em] sm:text-3xl"
                    translate="no"
                  >
                    Futbolya
                  </span>
                  <span className="font-mono text-xs text-public-paper/60">
                    01—90
                  </span>
                </div>
              </figure>

              <div className="grid gap-8 lg:grid-rows-3 lg:gap-0 lg:py-3">
                {productItems.map((item, index) => (
                  <article
                    key={item.title}
                    className="grid gap-4 border-b border-public-ink/20 pb-8 last:border-b-0 last:pb-0 sm:grid-cols-[1.15fr_0.85fr] sm:items-start sm:gap-8 lg:border-0 lg:p-0"
                  >
                    <h2
                      className={
                        index === 1
                          ? "flex items-start gap-2 text-4xl font-black uppercase leading-[0.88] tracking-[-0.055em] sm:col-span-2 sm:text-5xl lg:self-center lg:text-6xl"
                          : index === 2
                            ? "flex items-start gap-2 text-4xl font-black uppercase leading-[0.88] tracking-[-0.055em] sm:col-start-2 sm:row-start-1 sm:text-5xl lg:self-end lg:justify-self-end lg:text-6xl"
                            : "flex items-start gap-2 text-4xl font-black uppercase leading-[0.88] tracking-[-0.055em] sm:text-5xl lg:text-6xl"
                      }
                    >
                      {item.title}
                      <ArrowUpRight
                        className="mt-0.5 size-5 shrink-0 text-public-sky sm:size-6"
                        aria-hidden="true"
                      />
                    </h2>
                    {item.description ? (
                      <p
                        className={
                          index === 2
                            ? "max-w-64 text-sm leading-5 text-public-ink/55 sm:col-start-1 sm:row-start-1 lg:self-end"
                            : "max-w-64 text-sm leading-5 text-public-ink/55 sm:justify-self-end"
                        }
                      >
                        {item.description}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </Container>
        </section>

        <section
          id="live"
          className="scroll-mt-20 bg-public-paper px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
        >
          <Container className="max-w-7xl">
            <div className="grid gap-8 border-b border-public-ink pb-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-public-sky">
                  {t("live.eyebrow")}
                </div>
                <h2 className="mt-4 text-[clamp(3.5rem,8vw,8rem)] font-black uppercase leading-[0.8] tracking-[-0.075em]">
                  {t("live.title")}
                </h2>
              </div>
              <div className="flex max-w-lg flex-col items-start gap-5 lg:justify-self-end">
                <p className="text-pretty leading-7 text-public-ink/60">
                  {t("live.description")}
                </p>
                <Link
                  href={ROUTES.public.games}
                  className="group flex items-center gap-2 border-b border-public-ink pb-1 text-xs font-bold uppercase tracking-[0.14em] outline-none transition-opacity hover:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-public-sky"
                >
                  {t("live.viewAll")}
                  <ArrowRight
                    className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>

            <Suspense fallback={<LiveGamesFallback />}>
              <LiveGamesContent />
            </Suspense>
          </Container>
        </section>

        <section className="bg-public-ink px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <Container className="max-w-7xl">
            <Suspense fallback={<StandingsFallback />}>
              <StandingsContent />
            </Suspense>
          </Container>
        </section>
      </main>
    </PublicShell>
  );
}
