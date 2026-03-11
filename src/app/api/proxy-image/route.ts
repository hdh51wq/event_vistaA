import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side image proxy.
 *
 * The client cannot load panorama images from dl.polyhaven.org into a Canvas
 * because the CDN does not return Access-Control-Allow-Origin headers on the
 * download subdomain — so crossOrigin="anonymous" fails and toDataURL() throws
 * a SecurityError.  Fetching on the server has no CORS restriction.
 *
 * Usage: GET /api/proxy-image?url=https://dl.polyhaven.org/...jpg
 * Returns: the image as a JPEG data URL in JSON  { dataUrl: "data:image/jpeg;base64,..." }
 *
 * We intentionally keep this as a Node.js route (no `export const runtime = "edge"`)
 * so we can use Buffer.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "url param required" }, { status: 400 });
  }

  // Only allow fetching from known safe panorama domains
  const allowed = ["dl.polyhaven.org", "polyhaven.org", "polyhaven.com"];
  let hostname: string;
  try {
    hostname = new URL(imageUrl).hostname;
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (!allowed.some((d) => hostname === d || hostname.endsWith("." + d))) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(imageUrl, {
      headers: {
        // Identify ourselves politely
        "User-Agent": "EventVista/1.0 panorama-proxy",
      },
      // 15 second timeout via AbortController
      signal: AbortSignal.timeout(15_000),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    const buffer = Buffer.from(await upstream.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUrl });
  } catch (err) {
    console.error("[proxy-image] fetch failed", err);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}
