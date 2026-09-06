import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options } from "@/features/auth/auth-api";

const baseUrl = process.env.UW_API_BASE_URL ?? "";

/**
 * GET /api/submissions/[id]/extractions
 * Proxies the backend extraction API for a single submission.
 * Backend endpoint: UW_API_BASE_URL/api/v1/extraction/{id}
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const session: any = await getServerSession(options);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "No access token found in session" }, { status: 401 });
  }

  const upstreamUrl = `${baseUrl}/api/v1/extraction/${id}`;

  console.group(`[API /api/submissions/${id}/extractions]`);
  console.log("Upstream URL:", upstreamUrl);
  console.log("Access Token Present:", !!session?.accessToken);

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    const responseBody = contentType.includes("application/json")
      ? await upstream.json().catch(() => null)
      : await upstream.text().catch(() => null);

    console.log("Upstream Status:", upstream.status);
    console.log("Extraction Response (raw):", JSON.stringify(responseBody, null, 2));

    if (!upstream.ok) {
      console.error(`[API extractions] Upstream error: ${upstream.status} ${upstream.statusText}`);
      console.groupEnd();
      return NextResponse.json({ error: responseBody }, { status: upstream.status });
    }

    const items = Array.isArray(responseBody) ? responseBody : [];
    const totalFields = items.reduce((sum: number, item: any) =>
      sum + (item.Extracted_fields ?? []).reduce((s: number, ef: any) =>
        s + (ef.document?.fields?.length ?? 0), 0), 0);
    const withValues = items.reduce((sum: number, item: any) =>
      sum + (item.Extracted_fields ?? []).reduce((s: number, ef: any) =>
        s + (ef.document?.fields ?? []).filter((f: any) => f.field_value != null).length, 0), 0);

    console.log(`Extraction summary: ${items.length} record(s), ${totalFields} fields, ${withValues} with values`);
    console.groupEnd();

    return NextResponse.json(responseBody);
  } catch (err) {
    console.error(`[API extractions] Fetch error:`, err);
    console.groupEnd();
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 502 });
  }
}
