import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options } from "@/features/auth/auth-api";

export const dynamic = "force-dynamic";

const baseUrl = process.env.UW_API_BASE_URL ?? "";

/**
 * GET /api/submissions/[id]
 * Proxies the backend single-submission (Account Overview) API.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const session: any = await getServerSession(options);

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "No access token found in session" },
      { status: 401 }
    );
  }

  const upstreamUrl = `${baseUrl}/api/v1/submissions/${id}`;

  console.group(`[API /api/v1/submissions/${id}] Single submission request`);
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
    console.log("Upstream Response:", JSON.stringify(responseBody, null, 2));

    if (!upstream.ok) {
      console.error(
        `[API /api/v1/submissions/${id}] Upstream error:`,
        upstream.status,
        upstream.statusText
      );
      console.groupEnd();
      return NextResponse.json(
        { error: responseBody },
        { status: upstream.status }
      );
    }

    console.groupEnd();
    return NextResponse.json(responseBody);
  } catch (err) {
    console.error(`[API /api/v1/submissions/${id}] Fetch error:`, err);
    console.groupEnd();
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 502 }
    );
  }
}
