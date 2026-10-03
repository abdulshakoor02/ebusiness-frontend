import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL;
const NEXTCLOUD_USERNAME = process.env.NEXTCLOUD_USERNAME;
const NEXTCLOUD_PASSWORD = process.env.NEXTCLOUD_PASSWORD;

/**
 * Legacy Nextcloud image proxy (transition shim — see PLAN.md §3/T5).
 *
 * Behaviour that MUST be preserved: given a stored absolute WebDAV URL in the
 * `url` query parameter, return the image bytes so pre-migration references in
 * `tenants.logo_url` / `tenants.stamp_url` keep rendering.
 *
 * Hardening (request/response shape unchanged):
 *  - a valid next-auth session is required (401 otherwise);
 *  - the upstream origin must match NEXTCLOUD_URL exactly, so the service
 *    credential can never be sent to an attacker-controlled host;
 *  - only allow-listed image types are echoed back — everything else is served
 *    as `application/octet-stream` + `X-Content-Type-Options: nosniff`;
 *  - the body is size-capped and the upstream call has a timeout;
 *  - responses are `private`, not `public`.
 */

/** Timeout for the upstream WebDAV call, covering the body read as well. */
const UPSTREAM_TIMEOUT_MS = 10_000;
/** Hard ceiling for a proxied object, mirroring MAX_OBJECT_BYTES in src/lib/storage.ts. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Types the proxy is willing to echo verbatim. Anything else is neutralised. */
const ALLOWED_IMAGE_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/avif",
    "image/tiff",
    "image/x-icon",
    "image/vnd.microsoft.icon",
    "image/svg+xml",
]);

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

/** Normalise an upstream Content-Type, returning null unless it is a known image type. */
const normalizeContentType = (raw: string | null): string | null => {
    const contentType = (raw || "").split(";")[0].trim().toLowerCase();
    if (!contentType) return null;
    const normalized = contentType === "image/jpg" ? "image/jpeg" : contentType;
    return ALLOWED_IMAGE_TYPES.has(normalized) ? normalized : null;
};

/**
 * Parse `url` and accept it only when its origin is exactly the configured
 * Nextcloud origin. Exact comparison (scheme + host + port) is deliberate: a
 * `startsWith` check would accept `https://<nextcloud>.attacker.tld/...`.
 */
const resolveUpstream = (raw: string): URL | null => {
    if (!NEXTCLOUD_URL) return null;
    try {
        const target = new URL(raw);
        const allowed = new URL(NEXTCLOUD_URL);
        if (target.origin !== allowed.origin) return null;
        if (target.username || target.password) return null;
        return target;
    } catch {
        return null;
    }
};

const getAuthHeader = (): string | null => {
    if (!NEXTCLOUD_USERNAME || !NEXTCLOUD_PASSWORD) return null;
    return `Basic ${Buffer.from(`${NEXTCLOUD_USERNAME}:${NEXTCLOUD_PASSWORD}`).toString("base64")}`;
};

/**
 * Read the upstream body while enforcing a hard byte cap. Returns null when the
 * cap is exceeded (the stream is cancelled so we stop downloading immediately).
 */
const readCapped = async (response: Response, maxBytes: number): Promise<Buffer | null> => {
    if (!response.body) return Buffer.alloc(0);

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;

    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value) continue;
            total += value.byteLength;
            if (total > maxBytes) {
                await reader.cancel().catch(() => undefined);
                return null;
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    return Buffer.concat(chunks);
};

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return unauthorized();
    }

    const fileUrl = request.nextUrl.searchParams.get("url");
    if (!fileUrl) {
        return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // Runs *before* any credential is attached to a request.
    const target = resolveUpstream(fileUrl);
    if (!target) {
        return NextResponse.json({ error: "Upstream host is not allowed" }, { status: 403 });
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
        console.error("Nextcloud image proxy: NEXTCLOUD_USERNAME/NEXTCLOUD_PASSWORD are not configured");
        return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
    }

    try {
        const response = await fetch(target, {
            headers: {
                Authorization: authHeader,
                Accept: "image/*",
            },
            redirect: "error",
            cache: "no-store",
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        });

        if (!response.ok) {
            await response.body?.cancel().catch(() => undefined);
            const status = response.status >= 400 && response.status < 500 ? response.status : 502;
            return NextResponse.json({ error: "Failed to fetch image" }, { status });
        }

        const declaredLength = Number(response.headers.get("content-length") || "0");
        if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
            await response.body?.cancel().catch(() => undefined);
            return NextResponse.json({ error: "Image too large" }, { status: 413 });
        }

        const buffer = await readCapped(response, MAX_IMAGE_BYTES);
        if (buffer === null) {
            return NextResponse.json({ error: "Image too large" }, { status: 413 });
        }

        const contentType = normalizeContentType(response.headers.get("content-type"));
        const headers: Record<string, string> = {
            "Content-Type": contentType ?? "application/octet-stream",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, max-age=3600",
            "Content-Length": String(buffer.byteLength),
        };

        if (!contentType) {
            // Never let a non-image response render in the app's origin.
            headers["Content-Disposition"] = "attachment";
        } else if (contentType === "image/svg+xml") {
            // SVG can carry script; keep it renderable but inert outside an <img>.
            headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
        }

        return new NextResponse(new Uint8Array(buffer), { status: 200, headers });
    } catch (error) {
        const name = (error as { name?: string })?.name;
        if (name === "TimeoutError" || name === "AbortError") {
            return NextResponse.json({ error: "Upstream request timed out" }, { status: 504 });
        }
        console.error("Nextcloud image proxy failed:", (error as Error)?.message ?? error);
        return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
    }
}
