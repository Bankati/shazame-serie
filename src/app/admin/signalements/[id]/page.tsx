import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportReviewForm } from "@/components/admin/report-review-form";
import { Badge } from "@/components/ui/badge";
import { ADMIN_TEXT } from "@/content/fr/admin";
import { formatParisDateTime } from "@/lib/paris-time";
import { sameTitle, type TitleRef } from "@/server/admin/report-review-rules";
import { labelOf, loadReport, loadTitleLabels } from "@/server/admin/reports-admin";
import { getDb } from "@/server/db/client";
import { REPORT_IMAGE_URL_TTL_S, supabaseReportImageStore } from "@/server/reports/reports";
import { getStorageAdmin } from "@/server/storage/admin-client";

import { reportReviewAction } from "../../actions";
import { requireAdminPage } from "../../require-admin-page";

export const metadata: Metadata = { title: ADMIN_TEXT.reports.detail.title, robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CARD = "flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground";

/** Liens signés des images consenties (bucket privé, 15 min) ; null si le stockage est indisponible. */
async function signedImageUrls(paths: string[]): Promise<string[] | null> {
  if (paths.length === 0) return [];
  const client = getStorageAdmin();
  if (!client) return null;
  const store = supabaseReportImageStore(client);
  try {
    const urls = await Promise.all(paths.map((path) => store.signedUrl(path, REPORT_IMAGE_URL_TTL_S)));
    return urls.filter((url): url is string => url !== null);
  } catch {
    return null;
  }
}

// Détail d'un signalement (U26b) : titres, images consenties, état du cache, décision de l'admin.
export default async function AdminReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/signalements/${encodeURIComponent(id)}`);
  if (!UUID.test(id)) notFound();
  const report = await loadReport(getDb(), id);
  if (!report) notFound();

  const [labels, images] = await Promise.all([
    loadTitleLabels([report.proposed, report.suggested, report.cache]),
    signedImageUrls(report.storagePaths),
  ]);
  const text = ADMIN_TEXT.reports;
  const describe = (title: TitleRef) => labelOf(labels, title) ?? text.titleUnavailable(title);
  const choice = (title: TitleRef | null) => (title ? { ...title, label: describe(title) } : null);
  const open = report.status === "open";

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Link href="/admin/signalements" className="self-start text-sm font-medium text-foreground underline underline-offset-4">
        {text.detail.back}
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="flex flex-wrap items-center gap-3 font-display text-display font-bold">
          {text.detail.title}
          <Badge variant={open ? "default" : "secondary"}>{text.statuses[report.status]}</Badge>
        </h1>
        <p className="text-sm text-muted-foreground">
          {[
            text.detail.reportedOn(formatParisDateTime(report.createdAt)),
            report.identifiedAt ? text.detail.identifiedOn(formatParisDateTime(report.identifiedAt)) : null,
            report.fromAccount ? text.detail.fromAccount : text.detail.fromVisitor,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={CARD}>
          <h2 className="text-base font-semibold">{text.detail.proposed}</h2>
          <p>{report.proposed ? describe(report.proposed) : text.noTitle}</p>
          {report.proposedConfidence !== null ? (
            <p className="text-sm text-muted-foreground">{text.detail.confidence(report.proposedConfidence)}</p>
          ) : null}
        </section>
        <section className={CARD}>
          <h2 className="text-base font-semibold">{open ? text.detail.suggested : text.detail.retained}</h2>
          <p>{report.suggested ? describe(report.suggested) : text.detail.noSuggestion}</p>
        </section>
      </div>

      <section className={CARD}>
        <h2 className="text-base font-semibold">{text.detail.images}</h2>
        {images === null ? (
          <p className="text-sm text-muted-foreground">{text.detail.imagesUnavailable}</p>
        ) : images.length === 0 ? (
          <p className="text-sm text-muted-foreground">{text.detail.noImages}</p>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {images.map((url, index) => (
                <li key={url}>
                  {/* Image du bucket privé (lien signé de 15 min) : pas d'optimiseur. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={text.detail.imageAlt(index + 1)} className="aspect-video w-full rounded-md border border-border object-cover" />
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">{text.detail.imagesExpire}</p>
          </>
        )}
      </section>

      <section className={CARD}>
        <h2 className="text-base font-semibold">{text.detail.cache}</h2>
        {report.cache ? (
          <p>
            {describe(report.cache)}
            <span className="block text-sm text-muted-foreground">
              {text.detail.confidence(report.cache.confidence)}, {text.detail.cacheState(report.cache.disabled, report.cache.validated)}
            </span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{text.detail.cacheNone}</p>
        )}
      </section>

      <section className={CARD}>
        {open ? (
          <ReportReviewForm
            action={reportReviewAction}
            reportId={report.id}
            proposed={choice(report.proposed)}
            suggested={sameTitle(report.suggested, report.proposed) ? null : choice(report.suggested)}
            hasImages={report.imageCount > 0}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{text.detail.closed}</p>
        )}
      </section>
    </div>
  );
}
