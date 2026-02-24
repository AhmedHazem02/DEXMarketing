import { FileText, Image, Video, FileArchive } from 'lucide-react'

/**
 * Returns the appropriate Lucide icon component for a given MIME type.
 */
export function getFileIcon(fileType?: string | null) {
    if (!fileType) return FileText
    if (fileType.startsWith('image/')) return Image
    if (fileType.startsWith('video/')) return Video
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return FileArchive
    return FileText
}

/**
 * Formats a byte count into a human-readable string (B / KB / MB).
 */
export function formatFileSize(bytes?: number | null): string {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
