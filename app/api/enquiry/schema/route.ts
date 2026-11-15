// GET /api/enquiry/schema?service=<name>
//
// Returns the ordered field list for a service, built from the same schema the
// server validates against. Public and cacheable.

import { fieldsForService, getServiceForm } from "@/lib/enquiries/schema";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const service = new URL(request.url).searchParams.get("service") || "";
  const form = getServiceForm(service);
  const fields = fieldsForService(service);

  if (!form || !fields) {
    return new Response(JSON.stringify({ ok: false, message: "Unknown service." }), {
      status: 404,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }

  return new Response(
    JSON.stringify({ ok: true, category: form.category, service: form.service, fields }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=600"
      }
    }
  );
}
