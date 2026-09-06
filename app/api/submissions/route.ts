import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_API_URL ?? "";

/**
 * GET /api/v1/submissions
 * Proxies the backend submissions list API.
 * Forwards query params (page, page_size, search, status, etc.) as-is.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.toString();
  const upstreamUrl = `${BACKEND}/api/v1/submissions${query ? `?${query}` : ""}`;

  console.group("[API /api/v1/submissions] Submissions list request");
  console.log("Upstream URL:", upstreamUrl);
  console.log("Query params:", Object.fromEntries(searchParams));

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        "Content-Type": "application/json",
        // Add auth headers here when backend requires them
        // "Authorization": `Bearer ${process.env.BACKEND_TOKEN}`,
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      console.error("[API /api/v1/submissions] Upstream error:", upstream.status, upstream.statusText);
      console.groupEnd();
      return NextResponse.json(
        { error: `Upstream ${upstream.status}: ${upstream.statusText}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    console.log("[API /api/v1/submissions] Response — total:", data?.meta?.total, "items:", data?.items?.length);
    console.log("[API /api/v1/submissions] Pagination:", data?.meta);
    console.groupEnd();

    return NextResponse.json(data);
  } catch (err) {
    console.error("[API /api/v1/submissions] Fetch error:", err);
    console.groupEnd();
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 502 });
  }
}
