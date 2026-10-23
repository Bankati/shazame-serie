import { CalendarDays, CloudOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ReleaseCard } from "@/components/calendar/release-card";
import { EmptyState } from "@/components/layout/empty-state";
import { TwoTone } from "@/components/layout/two-tone";
import { CALENDAR_TEXT } from "@/content/fr/calendar";
import { LAYOUT_TEXT } from "@/content/fr/layout";
import { groupByMonth } from "@/lib/release-calendar";
import { cn } from "@/lib/utils";
import type { ReleaseKind, ReleaseTitle } from "@/server/catalog/catalog-provider";
import { loadReleases } from "@/server/catalog/load-releases";
import { getCatalog, isCatalogConfigured } from "@/server/catalog/tmdb/tmdb-catalog";

export const metadata: Metadata = { title: CALENDAR_TEXT.metaTitle, description: CALENDAR_TEXT.description };

const TABS = [
  { id: "films", kind: "upcoming_movies" },
  { id: "series", kind: "airing_series" },
] as const satisfies readonly { id: string; kind: ReleaseKind }[];

type TabId = (typeof TABS)[number]["id"];

// Calendrier des sorties (U42, AD-47) : films à venir en France et séries en cours de diffusion (TMDB, mis en
// cache par le catalogue). Ouvert aux visiteurs ; l'onglet est dans l'adresse (`?onglet=series`) pour pouvoir
// être partagé. TMDB absent ou en panne : un état d'indisponibilité, jamais une erreur technique.
export default async function CalendarPage({ searchParams }: PageProps<"/calendrier">) {
  const params = await searchParams;
  const active: TabId = params.onglet === "series" ? "series" : "films";
  const kind = TABS.find((tab) => tab.id === active)?.kind ?? "upcoming_movies";
  const releases = await loadReleases(getCatalog, kind, { configured: isCatalogConfigured() });
  const text = CALENDAR_TEXT;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 md:py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-bold md:text-display-lg">
          <TwoTone text={text.title} highlight={text.highlight} />
        </h1>
        <p className="text-base text-muted-foreground">{text.description}</p>
      </div>

      <nav aria-label={text.tabsLabel} className="flex w-fit gap-1 rounded-lg border border-border bg-card p-1">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.id === "films" ? "/calendrier" : `/calendrier?onglet=${tab.id}`}
            aria-current={tab.id === active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-md px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              tab.id === active
                ? "bg-primary font-semibold text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {text.tabs[tab.id]}
          </Link>
        ))}
      </nav>

      {releases === null ? (
        <EmptyState
          icon={CloudOff}
          title={text.unavailable.title}
          description={text.unavailable.description}
          action={{ href: LAYOUT_TEXT.nav.cta.href, label: text.unavailable.cta }}
        />
      ) : releases.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={text.empty.title}
          description={text.empty.description}
          action={{ href: LAYOUT_TEXT.nav.cta.href, label: text.empty.cta }}
        />
      ) : active === "films" ? (
        groupByMonth(releases).map((group) => (
          <section key={group.key} aria-label={group.label ?? text.undated} className="flex flex-col gap-4">
            <h2 className="font-display text-xl font-bold text-foreground">{group.label ?? text.undated}</h2>
            <ReleaseGrid titles={group.items} />
          </section>
        ))
      ) : (
        <ReleaseGrid titles={releases} />
      )}

      <p className="text-sm text-muted-foreground">{text.source}</p>
    </div>
  );
}

function ReleaseGrid({ titles }: { titles: readonly ReleaseTitle[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {titles.map((title) => (
        <li key={`${title.mediaType}-${title.tmdbId}`}>
          <ReleaseCard title={title} />
        </li>
      ))}
    </ul>
  );
}
