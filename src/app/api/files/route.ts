/**
 * MinIO-backed replacement for `/api/nextcloud`.
 *
 * The request/response contract is byte-for-byte the same as the legacy
 * WebDAV route (see PLAN.md §4.5), so the hook and the tenant forms can be
 * pointed at `/api/files` without any other change:
 *
 *   POST { action: "create-folder", folderName }              -> { success, status }
 *   POST { action: "upload", folderName, fileData, fileName,
 *          contentType }                                      -> { success, url }   (full absolute URL)
 *   POST { action: "delete", fileUrl }                        -> { success }
 *   GET  ?action=check-folder&folderName=…                    -> { exists }
 *
 * Both verbs require a valid next-auth session (401 when absent).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    MAX_OBJECT_BYTES,
    buildKey,
    buildPublicUrl,
    createFolderMarker,
    deleteObject,
    keyFromRef,
    prefixExists,
    putObject,
    resolveContentType,
} from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Session gate shared by both verbs. Missing session is 401, never 500. */
async function isAuthenticated(): Promise<boolean> {
    try {
        const session = await getServerSession(authOptions);
        return Boolean(session?.user);
    } catch (error) {
        console.error("Failed to read session:", error);
        return false;
    }
}

export async function GET(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const folderName = searchParams.get("folderName");

    if (action && action !== "check-folder") {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (!folderName) {
        return NextResponse.json({ error: "folderName is required" }, { status: 400 });
    }

    try {
        return NextResponse.json({ exists: await prefixExists(folderName) });
    } catch (error) {
        console.error("Error checking folder:", error);
        return NextResponse.json({ exists: false, error: "Failed to check folder" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { action, folderName, fileData, fileName, contentType, fileUrl } = body;

        switch (action) {
            case "create-folder": {
                if (!folderName) {
                    return NextResponse.json({ success: false, error: "folderName is required" }, { status: 400 });
                }

                try {
                    // Same observable result as MKCOL: 201 when the collection is
                    // created, 405 when it already existed.
                    if (await prefixExists(folderName)) {
                        return NextResponse.json({ success: true, status: 405 });
                    }
                    await createFolderMarker(folderName);
                    return NextResponse.json({ success: true, status: 201 });
                } catch (error) {
                    console.error("Error creating folder:", error);
                    return NextResponse.json({ success: false, error: "Failed to create folder" }, { status: 500 });
                }
            }

            case "upload": {
                if (!folderName || !fileData || !fileName) {
                    return NextResponse.json(
                        { success: false, error: "folderName, fileData, and fileName are required" },
                        { status: 400 }
                    );
                }

                if (typeof fileData !== "string" || fileData.length > MAX_OBJECT_BYTES * 2) {
                    return NextResponse.json({ success: false, error: "File exceeds the maximum size" }, { status: 400 });
                }

                const data = Buffer.from(fileData, "base64");
                if (data.byteLength === 0) {
                    return NextResponse.json({ success: false, error: "fileData is not valid base64" }, { status: 400 });
                }
                if (data.byteLength > MAX_OBJECT_BYTES) {
                    return NextResponse.json({ success: false, error: "File exceeds the maximum size" }, { status: 400 });
                }

                // Check-then-create the folder, mirroring the WebDAV flow (I2).
                if (!(await prefixExists(folderName))) {
                    try {
                        await createFolderMarker(folderName);
                    } catch (error) {
                        console.error("Failed to create folder:", error);
                        return NextResponse.json({ success: false, error: "Failed to create folder" }, { status: 500 });
                    }
                }

                const key = buildKey(folderName, fileName);
                // Never store an arbitrary caller-supplied Content-Type: unknown
                // types are persisted as octet-stream and the streamer refuses to
                // echo them back either.
                const storedContentType = resolveContentType(contentType) || "application/octet-stream";
                await putObject(key, data, storedContentType);

                // Full absolute URL: this exact string is persisted in Mongo and
                // validated there with z.string().url() (I4/I5).
                return NextResponse.json({ success: true, url: buildPublicUrl(key) });
            }

            case "delete": {
                if (!fileUrl) {
                    return NextResponse.json({ success: false, error: "fileUrl is required" }, { status: 400 });
                }

                const key = keyFromRef(fileUrl);
                if (!key) {
                    return NextResponse.json(
                        { success: false, error: "fileUrl does not reference a stored file" },
                        { status: 400 }
                    );
                }

                // DeleteObject is idempotent, so deleting an already-removed object
                // succeeds — the same outcome the WebDAV route gave to a 404.
                await deleteObject(key);
                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Files API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
