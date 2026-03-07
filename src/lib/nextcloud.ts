const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL;
const NEXTCLOUD_USERNAME = process.env.NEXTCLOUD_USERNAME;
const NEXTCLOUD_PASSWORD = process.env.NEXTCLOUD_PASSWORD;

const getAuthHeader = () => {
    const credentials = btoa(`${NEXTCLOUD_USERNAME}:${NEXTCLOUD_PASSWORD}`);
    return `Basic ${credentials}`;
};

const getWebDavUrl = (path: string = "") => {
    const baseUrl = NEXTCLOUD_URL?.replace(/\/$/, "");
    const cleanPath = path.replace(/^\//, "");
    return `${baseUrl}/remote.php/dav/files/${NEXTCLOUD_USERNAME}/${cleanPath}`;
};

export async function checkFolderExists(folderName: string): Promise<boolean> {
    try {
        const url = getWebDavUrl(encodeURIComponent(folderName));
        const response = await fetch(url, {
            method: "PROPFIND",
            headers: {
                Authorization: getAuthHeader(),
                "Content-Type": "application/xml",
            },
        });
        return response.status === 207;
    } catch (error) {
        console.error("Error checking folder:", error);
        return false;
    }
}

export async function createFolder(folderName: string): Promise<boolean> {
    try {
        const url = getWebDavUrl(encodeURIComponent(folderName));
        const response = await fetch(url, {
            method: "MKCOL",
            headers: {
                Authorization: getAuthHeader(),
            },
        });
        return response.status === 201 || response.status === 405;
    } catch (error) {
        console.error("Error creating folder:", error);
        return false;
    }
}

export async function uploadFile(folderName: string, file: File): Promise<string | null> {
    try {
        const timestamp = Date.now();
        const extension = file.name.split(".").pop() || "png";
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const fileName = `${baseName}-${timestamp}.${extension}`;

        const folderExists = await checkFolderExists(folderName);
        if (!folderExists) {
            const created = await createFolder(folderName);
            if (!created) {
                console.error("Failed to create folder");
                return null;
            }
        }

        const url = getWebDavUrl(encodeURIComponent(`${folderName}/${fileName}`));
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: getAuthHeader(),
                "Content-Type": file.type,
            },
            body: file,
        });

        if (response.ok || response.status === 201 || response.status === 204) {
            return `${getWebDavUrl(encodeURIComponent(`${folderName}/${fileName}`))}`;
        }

        console.error("Upload failed with status:", response.status);
        return null;
    } catch (error) {
        console.error("Error uploading file:", error);
        return null;
    }
}

export async function deleteFile(fileUrl: string): Promise<boolean> {
    try {
        if (!fileUrl) return true;

        const baseUrl = NEXTCLOUD_URL?.replace(/\/$/, "") || "";
        const path = fileUrl.replace(`${baseUrl}/remote.php/dav/files/${NEXTCLOUD_USERNAME}/`, "");

        const url = getWebDavUrl(encodeURIComponent(path));
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                Authorization: getAuthHeader(),
            },
        });

        return response.status === 204 || response.status === 200 || response.status === 404;
    } catch (error) {
        console.error("Error deleting file:", error);
        return false;
    }
}
