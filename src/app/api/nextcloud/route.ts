import { NextRequest, NextResponse } from "next/server";

const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL;
const NEXTCLOUD_USERNAME = process.env.NEXTCLOUD_USERNAME;
const NEXTCLOUD_PASSWORD = process.env.NEXTCLOUD_PASSWORD;

const getAuthHeader = () => {
    if (!NEXTCLOUD_USERNAME || !NEXTCLOUD_PASSWORD) {
        console.error("Missing Nextcloud credentials", { username: NEXTCLOUD_USERNAME, hasPassword: !!NEXTCLOUD_PASSWORD });
        return "";
    }
    const credentials = Buffer.from(`${NEXTCLOUD_USERNAME}:${NEXTCLOUD_PASSWORD}`).toString("base64");
    console.log("Generated auth header, length:", credentials.length);
    return `Basic ${credentials}`;
};

const getWebDavUrl = (path: string = "") => {
    const baseUrl = NEXTCLOUD_URL?.replace(/\/$/, "");
    const cleanPath = path.replace(/^\//, "");
    return `${baseUrl}/remote.php/dav/files/${NEXTCLOUD_USERNAME}/${cleanPath}`;
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const folderName = searchParams.get("folderName");

    if (!folderName) {
        return NextResponse.json({ error: "folderName is required" }, { status: 400 });
    }

    try {
        const url = getWebDavUrl(encodeURIComponent(folderName));
        const response = await fetch(url, {
            method: "PROPFIND",
            headers: {
                Authorization: getAuthHeader(),
                "Content-Type": "application/xml",
            },
        });

        return NextResponse.json({ exists: response.status === 207 });
    } catch (error) {
        console.error("Error checking folder:", error);
        return NextResponse.json({ exists: false, error: "Failed to check folder" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, folderName, fileData, fileName, contentType, fileUrl } = body;

        switch (action) {
            case "create-folder": {
                if (!folderName) {
                    return NextResponse.json({ success: false, error: "folderName is required" }, { status: 400 });
                }
                const url = getWebDavUrl(encodeURIComponent(folderName));
                const authHeader = getAuthHeader();
                console.log("Creating folder at:", url);
                console.log("Auth header present:", !!authHeader);
                console.log("Username:", NEXTCLOUD_USERNAME);
                
                const response = await fetch(url, {
                    method: "MKCOL",
                    headers: {
                        Authorization: authHeader,
                    },
                });
                console.log("Create folder response status:", response.status);
                return NextResponse.json({ success: response.status === 201 || response.status === 405, status: response.status });
            }

            case "upload": {
                if (!folderName || !fileData || !fileName) {
                    return NextResponse.json({ success: false, error: "folderName, fileData, and fileName are required" }, { status: 400 });
                }

                const checkUrl = getWebDavUrl(encodeURIComponent(folderName));
                const checkResponse = await fetch(checkUrl, {
                    method: "PROPFIND",
                    headers: {
                        Authorization: getAuthHeader(),
                        "Content-Type": "application/xml",
                    },
                });

                if (checkResponse.status !== 207) {
                    const createResponse = await fetch(checkUrl, {
                        method: "MKCOL",
                        headers: {
                            Authorization: getAuthHeader(),
                        },
                    });
                    if (createResponse.status !== 201 && createResponse.status !== 405) {
                        return NextResponse.json({ success: false, error: "Failed to create folder" }, { status: 500 });
                    }
                }

                const uploadUrl = getWebDavUrl(encodeURIComponent(`${folderName}/${fileName}`));
                const uploadResponse = await fetch(uploadUrl, {
                    method: "PUT",
                    headers: {
                        Authorization: getAuthHeader(),
                        "Content-Type": contentType || "application/octet-stream",
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

                const baseUrl = NEXTCLOUD_URL?.replace(/\/$/, "") || "";
                const path = fileUrl.replace(`${baseUrl}/remote.php/dav/files/${NEXTCLOUD_USERNAME}/`, "");
                const url = getWebDavUrl(encodeURIComponent(path));

                const response = await fetch(url, {
                    method: "DELETE",
                    headers: {
                        Authorization: getAuthHeader(),
                    },
                });

                return NextResponse.json({ success: response.status === 204 || response.status === 200 || response.status === 404 });
            }

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Nextcloud API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
