import { handleBillingWebhook } from "@/server/billing/billing-requests";

// POST /api/billing/webhook : événements Stripe signés (U22). Corps brut lu par le gestionnaire, jamais reparsé.
export const runtime = "nodejs";

export function POST(request: Request): Promise<Response> {
  return handleBillingWebhook(request);
}
