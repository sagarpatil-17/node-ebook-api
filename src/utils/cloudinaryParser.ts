export const getPublicIdFromUrl = (url: string, folder: string): string | null => {
    try {
        if (!url) return null;

        const parts = url.split(`/${folder}/`);
        if (parts.length < 2) return null;

        // Isolate the filename and strip the extension (.jpg, .pdf, etc.)
        const fileWithExtension = parts[1] as string;
        const publicIdWithoutExtension = fileWithExtension.split('.').slice(0, -1).join('.');

        return `${folder}/${publicIdWithoutExtension}`;
    } catch (error) {
        console.error("Failed to parse Cloudinary public ID:", error);
        return null;
    }
};