import { useState } from "react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];

export function useNextcloudUpload() {
    const [isUploading, setIsUploading] = useState(false);

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return "Only PNG, JPG, JPEG, and SVG files are allowed";
        }
        if (file.size > MAX_FILE_SIZE) {
            return "File size must be less than 5MB";
        }
        return null;
    };

    const checkFolderExists = async (folderName: string): Promise<boolean> => {
        try {
            const response = await fetch(`/api/nextcloud?action=check-folder&folderName=${encodeURIComponent(folderName)}`);
            const data = await response.json();
            return data.exists;
        } catch (error) {
            console.error("Error checking folder:", error);
            return false;
        }
    };

    const createFolder = async (folderName: string): Promise<boolean> => {
        try {
            const response = await fetch("/api/nextcloud", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "create-folder", folderName }),
            });
            const data = await response.json();
            console.log("Create folder response:", data);
            return data.success;
        } catch (error) {
            console.error("Error creating folder:", error);
            return false;
        }
    };

    const uploadToNextcloud = async (
        folderName: string,
        file: File
    ): Promise<string | null> => {
        const validationError = validateFile(file);
        if (validationError) {
            toast.error(validationError);
            return null;
        }

        setIsUploading(true);
        try {
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    const base64 = result.split(",")[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const timestamp = Date.now();
            const extension = file.name.split(".").pop() || "png";
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const fileName = `${baseName}-${timestamp}.${extension}`;

            const folderExists = await checkFolderExists(folderName);
            if (!folderExists) {
                const created = await createFolder(folderName);
                if (!created) {
                    console.error("Failed to create folder");
                    toast.error("File upload failed");
                    return null;
                }
            }

            const response = await fetch("/api/nextcloud", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "upload",
                    folderName,
                    fileData: base64Data,
                    fileName,
                    contentType: file.type,
                }),
            });

            const data = await response.json();

            if (data.success && data.url) {
                return data.url;
            }

            console.error("Upload failed:", data.error);
            toast.error("File upload failed");
            return null;
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("File upload failed");
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const deleteFromNextcloud = async (fileUrl: string): Promise<boolean> => {
        if (!fileUrl) return true;

        console.log("Deleting file:", fileUrl);
        setIsUploading(true);
        try {
            const response = await fetch("/api/nextcloud", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", fileUrl }),
            });
            const data = await response.json();
            console.log("Delete response:", data);
            if (!data.success) {
                toast.error("Failed to delete old file");
            }
            return data.success;
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete old file");
            return false;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        isUploading,
        uploadToNextcloud,
        deleteFromNextcloud,
        validateFile,
    };
}
