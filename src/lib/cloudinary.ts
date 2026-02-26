// ============================================
// Cloudinary Configuration - Single Source of Truth
// ============================================

// Use lazy getters so missing env vars don't throw at module load time
// (throwing at module level causes infinite error loops page-wide)
export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ''
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME || 'demo'}/auto/upload`

/**
 * Maximum file size allowed for upload (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Allowed MIME types for upload
 */
const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf',
]

/**
 * Upload a file to Cloudinary
 * @param file - The file to upload
 * @param folder - Optional folder name in Cloudinary
 * @returns The secure URL of the uploaded file
 */
export async function uploadToCloudinary(file: File, folder?: string): Promise<string> {
    // Validate Cloudinary config at call-time (not module load time)
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new Error('Cloudinary is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.')
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`)
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error(`File type "${file.type}" is not allowed`)
    }

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
