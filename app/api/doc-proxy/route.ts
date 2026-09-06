import { NextRequest, NextResponse } from "next/server";

const ALLOWED_DOMAINS = ["blob.core.windows.net", "storage.googleapis.com", "amazonaws.com"];

/**
 * GET /api/doc-proxy?url=<encoded-url>
 * Server-side proxy for fetching document content (HTML emails, etc.)
 * from blob storage — bypasses browser CORS restrictions.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url param required" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!ALLOWED_DOMAINS.some(d => parsed.hostname.endsWith(d))) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }

  console.group("[doc-proxy] Fetching document");
  console.log("URL:", url.slice(0, 100) + (url.length > 100 ? "…" : ""));

  try {
    const res = await fetch(url, { cache: "no-store" });
    const content = await res.text();
    console.log("Status:", res.status, "| Content-Type:", res.headers.get("content-type"), "| Length:", content.length, "chars");
    console.groupEnd();

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "text/html; charset=utf-8",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    console.error("[doc-proxy] Fetch error:", err);
    console.groupEnd();
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 502 });
  }
}
