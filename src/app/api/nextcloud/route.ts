import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL;
const NEXTCLOUD_USERNAME = process.env.NEXTCLOUD_USERNAME;
const NEXTCLOUD_PASSWORD = process.env.NEXTCLOUD_PASSWORD;

/**
 * Legacy Nextcloud/WebDAV route (transition shim — see PLAN.md §3/T5).
 *
 * The request/response contract is frozen: `create-folder` -> {success,status},
 * `upload` -> {success,url} where `url` is the exact absolute WebDAV URL stored
 * in Mongo, `delete` -> {success}, `GET ?folderName=` -> {exists}.
 *
 * Hardening (no contract change):
 *  - a valid next-auth session is required on every method (401 otherwise);
 *  - path segments are canonicalised before they are concatenated into a DAV
 *    URL, so `../` can no longer escape the DAV root;
 *  - upload content types are restricted to the image allow-list;
 *  - upstream calls have a timeout and the upload payload is size-capped;
 *  - no credentials or auth-header details are logged.
 */

/** Timeout for every upstream WebDAV call. */
const UPSTREAM_TIMEOUT_MS = 15_000;
/** Hard ceiling for the caller-supplied base64 payload (≈9 MB decoded). */
const MAX_UPLOAD_BASE64_LENGTH = 12 * 1024 * 1024;

/** Content types the upload path accepts. Mirrors the client-side allow-list. */
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

const getAuthHeader = (): string | null => {
    if (!NEXTCLOUD_USERNAME || !NEXTCLOUD_PASSWORD) return null;
    return `Basic ${Buffer.from(`${NEXTCLOUD_USERNAME}:${NEXTCLOUD_PASSWORD}`).toString("base64")}`;
};

const davRoot = (): string =>
    `${NEXTCLOUD_URL?.replace(/\/$/, "") ?? ""}/remote.php/dav/files/${NEXTCLOUD_USERNAME}`;

/**
 * Build a DAV URL exactly the way the previous implementation did for uploads
 * (the full relative path is percent-encoded as a single segment). This keeps
 * the stored `upload` response byte-identical to pre-migration values.
 */
const getWebDavUrl = (path: string = ""): string => {
    const cleanPath = path.replace(/^\//, "");
    return `${davRoot()}/${cleanPath}`;
};

/**
 * Reject anything that would resolve outside the intended folder once the DAV
 * server normalises the path: `..`/`.` segments, backslashes and NUL bytes.
 */
const isSafeDavPath = (value: string): boolean => {
    if (!value) return false;
    if (value.includes("\0") || value.includes("\\")) return false;
    if (value.startsWith("/")) return false;
    return !value.split("/").some((segment) => segment === "." || segment === "..");
};

/** Validates the caller-supplied pieces before they are joined into a path. */
const isSafeDavName = (value: unknown): value is string =>
    typeof value === "string" && isSafeDavPath(value);

/**
 * Recover the DAV-relative path from a stored absolute URL.
 *
 * Returns null when the reference is not under this Nextcloud's DAV root or
 * when the decoded path tries to escape it. The path is re-encoded segment by
 * segment, so traversal cannot survive into the outgoing request.
 */
const davPathFromStoredUrl = (fileUrl: string): string | null => {
    const base = NEXTCLOUD_URL?.replace(/\/$/, "");
    if (!base || !NEXTCLOUD_USERNAME) return null;

    const prefix = `${base}/remote.php/dav/files/${NEXTCLOUD_USERNAME}/`;
    if (!fileUrl.startsWith(prefix)) return null;

    const encodedPath = fileUrl.slice(prefix.length).split(/[?#]/)[0];
    if (!encodedPath) return null;

    // Reject literal traversal before decoding…
    if (!isSafeDavPath(encodedPath)) return null;

    let decodedPath: string;
    try {
        decodedPath = decodeURIComponent(encodedPath);
    } catch {
        return null;
    }

    // …and again after decoding (covers `%2e%2e%2f`).
    if (!isSafeDavPath(decodedPath)) return null;

    return decodedPath;
};

/** Percent-encode every segment so `?`, `#` and spaces cannot alter the path. */
const encodeDavPath = (path: string): string =>
    path
        .split("/")
        .filter((segment) => segment.length > 0)
        .map((segment) => encodeURIComponent(segment))
        .join("/");

/** fetch() with the shared timeout applied. */
const davFetch = (url: string, init: RequestInit) =>
    fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return unauthorized();
    }

    const folderName = request.nextUrl.searchParams.get("folderName");
    if (!folderName) {
        return NextResponse.json({ error: "folderName is required" }, { status: 400 });
    }
    if (!isSafeDavName(folderName)) {
        return NextResponse.json({ exists: false, error: "folderName contains an invalid path segment" }, { status: 400 });
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
        console.error("Nextcloud route: NEXTCLOUD_USERNAME/NEXTCLOUD_PASSWORD are not configured");
        return NextResponse.json({ exists: false, error: "Nextcloud is not configured" }, { status: 500 });
    }

    try {
        const url = getWebDavUrl(encodeURIComponent(folderName));
        const response = await davFetch(url, {
            method: "PROPFIND",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/xml",
            },
        });

        return NextResponse.json({ exists: response.status === 207 });
    } catch (error) {
        if ((error as { name?: string })?.name === "TimeoutError") {
            return NextResponse.json({ exists: false, error: "Nextcloud request timed out" }, { status: 504 });
        }
        console.error("Error checking folder:", (error as Error)?.message ?? error);
        return NextResponse.json({ exists: false, error: "Failed to check folder" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return unauthorized();
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
        console.error("Nextcloud route: NEXTCLOUD_USERNAME/NEXTCLOUD_PASSWORD are not configured");
        return NextResponse.json({ success: false, error: "Nextcloud is not configured" }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { action, folderName, fileData, fileName, contentType, fileUrl } = body;

        switch (action) {
            case "create-folder": {
                if (!folderName) {
                    return NextResponse.json({ success: false, error: "folderName is required" }, { status: 400 });
                }
                if (!isSafeDavName(folderName)) {
                    return NextResponse.json({ success: false, error: "folderName contains an invalid path segment" }, { status: 400 });
                }

                const url = getWebDavUrl(encodeURIComponent(folderName));
                const response = await davFetch(url, {
                    method: "MKCOL",
                    headers: {
                        Authorization: authHeader,
                    },
                });

                return NextResponse.json({ success: response.status === 201 || response.status === 405, status: response.status });
            }

            case "upload": {
                if (!folderName || !fileData || !fileName) {
                    return NextResponse.json({ success: false, error: "folderName, fileData, and fileName are required" }, { status: 400 });
                }
                if (!isSafeDavName(folderName) || !isSafeDavName(fileName)) {
                    return NextResponse.json({ success: false, error: "folderName or fileName contains an invalid path segment" }, { status: 400 });
                }
                if (typeof fileData !== "string" || fileData.length > MAX_UPLOAD_BASE64_LENGTH) {
                    return NextResponse.json({ success: false, error: "fileData is too large" }, { status: 413 });
                }

                const checkUrl = getWebDavUrl(encodeURIComponent(folderName));
                const checkResponse = await davFetch(checkUrl, {
                    method: "PROPFIND",
                    headers: {
                        Authorization: authHeader,
                        "Content-Type": "application/xml",
                    },
                });

                if (checkResponse.status !== 207) {
                    const createResponse = await davFetch(checkUrl, {
                        method: "MKCOL",
                        headers: {
                            Authorization: authHeader,
                        },
                    });
                    if (createResponse.status !== 201 && createResponse.status !== 405) {
                        return NextResponse.json({ success: false, error: "Failed to create folder" }, { status: 500 });
                    }
                }

                // Unchanged URL shape — this exact value is persisted in Mongo.
                const uploadUrl = getWebDavUrl(encodeURIComponent(`${folderName}/${fileName}`));
                const requestedType = String(contentType || "").split(";")[0].trim().toLowerCase();
                const uploadType = ALLOWED_IMAGE_TYPES.has(requestedType) ? requestedType : "application/octet-stream";

                const uploadResponse = await davFetch(uploadUrl, {
                    method: "PUT",
                    headers: {
                        Authorization: authHeader,
                        "Content-Type": uploadType,
                    },
                    body: Buffer.from(fileData, "base64"),
                });

                if (uploadResponse.ok || uploadResponse.status === 201 || uploadResponse.status === 204) {
                    return NextResponse.json({ success: true, url: uploadUrl });
                }

                return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
            }

            case "delete": {
                if (!fileUrl) {
                    return NextResponse.json({ success: false, error: "fileUrl is required" }, { status: 400 });
                }

                const davPath = typeof fileUrl === "string" ? davPathFromStoredUrl(fileUrl) : null;
                if (!davPath) {
                    return NextResponse.json(
                        { success: false, error: "fileUrl is not a valid Nextcloud reference" },
                        { status: 400 }
                    );
                }

                const url = getWebDavUrl(encodeDavPath(davPath));
                const response = await davFetch(url, {
                    method: "DELETE",
                    headers: {
                        Authorization: authHeader,
                    },
                });

                return NextResponse.json({ success: response.status === 204 || response.status === 200 || response.status === 404 });
            }

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        if ((error as { name?: string })?.name === "TimeoutError") {
            return NextResponse.json({ success: false, error: "Nextcloud request timed out" }, { status: 504 });
        }
        console.error("Nextcloud API error:", (error as Error)?.message ?? error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
