const PROFILE_IMAGE_MAX_DIMENSION = 384;
const PROFILE_IMAGE_MAX_BYTES = 350 * 1024;

// Resize large profile photos before they are stored and served throughout the app
export async function optimize_profile_image(file: File): Promise<File> {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;

    try {
        const bitmap = await createImageBitmap(file);
        if (
            bitmap.width <= PROFILE_IMAGE_MAX_DIMENSION &&
            bitmap.height <= PROFILE_IMAGE_MAX_DIMENSION &&
            file.size <= PROFILE_IMAGE_MAX_BYTES
        ) {
            bitmap.close();
            return file;
        }

        const scale = Math.min(1, PROFILE_IMAGE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
            bitmap.close();
            return file;
        }
        context.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        const optimized = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/webp', 0.78);
        });

        if (!optimized || optimized.size >= file.size) return file;

        const base_name = file.name.replace(/\.[^.]+$/, '') || 'profile';
        return new File([optimized], `${base_name}.webp`, {
            type: 'image/webp',
            lastModified: file.lastModified
        });
    } catch {
        // Keep the upload working when the browser cannot decode or convert a format
        return file;
    }
}
