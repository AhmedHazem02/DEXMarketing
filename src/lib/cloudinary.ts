// ============================================
// Cloudinary Configuration - Single Source of Truth
// ============================================

export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || (() => {
    if (process.env.NODE_ENV === 'development') console.warn('Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, using fallback')
    return 'demo'
})()
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || (() => {
    if (process.env.NODE_ENV === 'development') console.warn('Missing NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET, using fallback')
    return 'dex_preset'
})()
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`

/**
 * Upload a file to Cloudinary
 * @param file - The file to upload
 * @param folder - Optional folder name in Cloudinary
 * @returns The secure URL of the uploaded file
 */
export async function uploadToCloudinary(file: File, folder?: string): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    
    if (folder) {
        formData.append('folder', folder)
    }

    try {
        const response = await fetch(CLOUDINARY_UPLOAD_URL, {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            throw new Error('Upload failed')
        }

        const data = await response.json()
        return data.secure_url
    } catch (error) {
        console.error('Cloudinary upload error:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(`فشل رفع الصورة: ${message}`)
    }
}
