import { handleReportImages } from "@/server/reports/report-request";

// Images d'un signalement consenti : liens signés, administration seulement (U20 ; back-office complet en U24).
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: RouteContext<"/api/admin/reports/[id]/images">): Promise<Response> {
  const { id } = await params;
  return handleReportImages(id);
}
