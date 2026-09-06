import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_API_URL ?? "";

/**
 * GET /api/submissions/[id]
 * Proxies the backend single-submission (Account Overview) API.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const upstreamUrl = `${BACKEND}/api/v1/submissions/${id}`;

  console.group(`[API /api/submissions/${id}] Single submission request`);
  console.log("Upstream URL:", upstreamUrl);

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Bearer ${process.env.BACKEND_TOKEN}`,
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      console.error(`[API /api/submissions/${id}] Upstream error:`, upstream.status, upstream.statusText);
      console.groupEnd();
      return NextResponse.json(
        { error: `Upstream ${upstream.status}: ${upstream.statusText}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    console.log(`[API /api/submissions/${id}] Response:`, {
      insured_name:      data.insured_name,
      status:            data.status,
      total_tiv:         data.total_tiv,
      loc_count:         data.loc_count,
      assigned_uw_name:  data.assigned_uw_name,
      enrichment:        data.enrichment,
    });
    console.groupEnd();

    return NextResponse.json(data);
  } catch (err) {
    console.error(`[API /api/submissions/${id}] Fetch error:`, err);
    console.groupEnd();
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 502 });
  }
}
