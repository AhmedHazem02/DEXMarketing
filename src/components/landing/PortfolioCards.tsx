
import { motion } from 'framer-motion'
import { Play, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import GlareHover from '../ui/GlareHover'

function isVideoUrl(url?: string): boolean {
    if (!url) return false
    return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url.includes('/video/')
}

// Check if URL is external (starts with http:// or https://)
function isExternalUrl(url?: string): boolean {
    if (!url) return false
    return url.startsWith('http://') || url.startsWith('https://')
}

interface PortfolioItemProps {
    item: Record<string, string>
    index: number
    gradientColor: string
    isPlaying: boolean
    onPlay: (e: React.MouseEvent) => void
}

export function PortfolioItem({ item, index, gradientColor, isPlaying, onPlay }: PortfolioItemProps) {
    const hasMedia = !!item.media
    const isVideo = isVideoUrl(item.media)
    const isExternal = isExternalUrl(item.link)

    const cardContent = (
        <GlareHover
            glareColor="#ffffff"
            glareOpacity={0.2}
            glareAngle={-45}
            glareSize={250}
            className="h-full"
        >
            {/* Background: Image, Video, or Gradient fallback */}
            {hasMedia && isVideo ? (
                isPlaying ? (
                    <video
                        src={item.media}
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                    />
                ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-80`}>
                        <button
                            className="absolute inset-0 flex items-center justify-center z-10"
                            onClick={onPlay}
                        >
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                                <Play className="h-8 w-8 text-white fill-white" />
                            </div>
                        </button>
                    </div>
                )
            ) : hasMedia ? (
                <Image
                    src={item.media}
                    alt={item.title || ''}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                />
            ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-80`} />
            )}

            {/* Content Overlay */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent">
                {item.category && (
                    <span className="text-xs font-semibold text-white/80 mb-2">{item.category}</span>
                )}
                <h3 className="text-xl font-bold text-white">{item.title || ''}</h3>
                {item.description && (
                    <p className="text-sm text-white/70 mt-1 line-clamp-2">{item.description}</p>
                )}
            </div>

            {/* Hover Overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <ArrowRight className="h-6 w-6 text-white" />
                    </div>
                </div>
            )}
        </GlareHover>
    )

    const cardClasses = "group relative aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer glass glass-hover"

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8 }}
            className={cardClasses}
        >
            {item.link ? (
                isExternal ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="block h-full">
                        {cardContent}
                    </a>
                ) : (
                    <Link href={item.link} className="block h-full">
                        {cardContent}
                    </Link>
                )
            ) : (
                cardContent
            )}
        </motion.div>
    )
}

interface FallbackPortfolioItemProps {
    project: {
        titleAr: string
        titleEn: string
        category: string
        categoryAr: string
        color: string
    }
    index: number
    isAr: boolean
}

export function FallbackPortfolioItem({ project, index, isAr }: FallbackPortfolioItemProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8 }}
            className="group relative aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer glass glass-hover"
        >
            <GlareHover
                glareColor="#ffffff"
                glareOpacity={0.2}
                glareAngle={-45}
                glareSize={250}
                className="h-full"
            >
                <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-80`} />
                <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent">
                    <span className="text-xs font-semibold text-white/80 mb-2">
                        {isAr ? project.categoryAr : project.category}
                    </span>
                    <h3 className="text-xl font-bold text-white">{isAr ? project.titleAr : project.titleEn}</h3>
                </div>
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <ArrowRight className="h-6 w-6 text-white" />
                    </div>
                </div>
            </GlareHover>
        </motion.div>
    )
}
