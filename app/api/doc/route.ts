import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy for blob-storage document URLs.
 * Avoids CORS issues when the blob container doesn't allow browser-direct access.
 * Add Authorization / SAS token headers here as needed.
 *
 * Usage: GET /api/doc?url=<encoded-blob-url>
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "Missing url param" }, { status: 400 });

  let blobUrl: string;
  try {
    blobUrl = decodeURIComponent(raw);
    new URL(blobUrl); // validate it's a real URL
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  try {
    const upstream = await fetch(blobUrl, {
      // Add blob storage auth here if needed, e.g.:
      // headers: { Authorization: `Bearer ${process.env.BLOB_TOKEN}` },
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}: ${upstream.statusText}` },
        { status: upstream.status }
      );
    }

    const contentType =
      upstream.headers.get("Content-Type") ?? "application/octet-stream";

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300", // 5-min client cache
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    console.error("[doc-proxy] fetch error", err);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 502 });
  }
}
