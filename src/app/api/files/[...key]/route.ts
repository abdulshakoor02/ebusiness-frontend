/**
 * Streams an object out of MinIO for `${PUBLIC_APP_URL}/api/files/{key}`.
 *
 * Session-gated: the browser sends the next-auth cookie because the URL is
 * same-origin (this is what lets `tenants/page.tsx` keep rendering the raw
 * stored URL in an `<img>` with no change).
 *
 * Content-Type is echoed only when it is on the image allow-list; anything
 * else is forced to `application/octet-stream` with `nosniff`, so a stored
 * object can never be served as same-origin HTML.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getObject, resolveContentType } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
    let authenticated = false;
    try {
        const session = await getServerSession(authOptions);
        authenticated = Boolean(session?.user);
    } catch (error) {
        console.error("Failed to read session:", error);
    }

    if (!authenticated) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key: segments } = await params;
    const key = (segments || []).join("/");

    if (!key) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        let object = await getObject(key);

        // Dynamic segments arrive percent-decoded, but tolerate an encoded key
        // (e.g. a tenant name containing a space) by retrying once.
        if (!object && key.includes("%")) {
            try {
                const decoded = decodeURIComponent(key);
                if (decoded !== key) object = await getObject(decoded);
            } catch {
                // Malformed escape sequence — keep the 404.
            }
        }

        if (!object) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const contentType = resolveContentType(object.contentType) || "application/octet-stream";

        const headers: Record<string, string> = {
            "Content-Type": contentType,
            "Content-Length": String(object.body.byteLength),
            "Cache-Control": "private, max-age=3600",
            "X-Content-Type-Options": "nosniff",
        };

        // SVG is an executable document when navigated to directly, so a stored
        // logo would run script in our origin. A locking CSP keeps it inert;
        // `<img>` embedding is unaffected. (Authorised deviation — Lead, T2.)
        if (contentType === "image/svg+xml") {
            headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
        }

        return new NextResponse(new Uint8Array(object.body), {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error("Error streaming file:", error);
        return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
    }
}
