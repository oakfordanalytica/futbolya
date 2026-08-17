import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { LangToggle } from "@/components/ui/lang-toggle";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/navigation/routes";
import { DEFAULT_TENANT_SLUG } from "@/lib/tenancy/config";

interface PublicHeaderProps {
  navigationLabel: string;
  skipLabel: string;
  productLabel: string;
  gamesLabel: string;
  signInLabel: string;
  languageLabel: string;
}

export function PublicHeader({
  navigationLabel,
  skipLabel,
  productLabel,
  gamesLabel,
  signInLabel,
  languageLabel,
}: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-public-ink/15 bg-public-paper/95 text-public-ink backdrop-blur-md">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-public-ink focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-public-paper focus:outline-2 focus:outline-offset-2 focus:outline-public-sky"
      >
        {skipLabel}
      </a>
      <Container className="flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={ROUTES.home} aria-label="Futbolya">
          <Image
            src="/logo_solid.svg"
            alt="Futbolya"
            width={118}
            height={41}
            className="h-auto w-24 sm:w-[118px]"
            priority
          />
        </Link>

        <nav
          className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.12em] sm:text-xs md:gap-8 md:tracking-[0.14em]"
          aria-label={navigationLabel}
        >
          <Link
            href="/#product"
            className="hidden transition-opacity hover:opacity-55 md:inline"
          >
            {productLabel}
          </Link>
          <Link
            href={ROUTES.public.games}
            className="transition-opacity hover:opacity-55"
          >
            {gamesLabel}
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <LangToggle showText={false} ariaLabel={languageLabel} />
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="text-public-ink hover:bg-public-fog hover:text-public-ink"
          >
            <Link href={ROUTES.tenant.auth.signIn(DEFAULT_TENANT_SLUG)}>
              {signInLabel}
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
