/**
 * Landing page constants - Unified data source
 * This file contains all shared data for landing page components
 */

export interface Project {
    id: number
    titleEn: string
    titleAr: string
    categoryEn: string
    categoryAr: string
    gradient: string
    span?: string
    link?: string
}

export interface Stat {
    value: string
    labelEn: string
    labelAr: string
}

// Unified statistics data - used across hero and process sections
export const STATS: Stat[] = [
    { value: '500+', labelEn: 'Projects Launched', labelAr: 'مشروع ناجح' },
    { value: '200+', labelEn: 'Happy Clients', labelAr: 'عميل راضي' },
    { value: '15+', labelEn: 'Years of Orbit', labelAr: 'سنة خبرة' },
    { value: '98%', labelEn: 'Client Retention', labelAr: 'معدل رضا العملاء' },
]

// Main hero stats (first 3)
export const HERO_STATS = STATS.slice(0, 3)

// Process section stats (custom set)
export const PROCESS_STATS: Stat[] = [
    { value: '98%', labelEn: 'Client Retention', labelAr: 'معدل رضا العملاء' },
    { value: '3x', labelEn: 'Average ROI', labelAr: 'متوسط العائد' },
    { value: '48h', labelEn: 'Response Time', labelAr: 'سرعة الاستجابة' },
    { value: '150+', labelEn: 'Brands Served', labelAr: 'علامة تجارية' },
]

// Portfolio projects with links
export const PROJECTS: Project[] = [
    {
        id: 1,
        titleEn: 'Royal Brands Campaign',
        titleAr: 'حملة رويال براندز',
        categoryEn: 'Social Media',
        categoryAr: 'سوشيال ميديا',
        gradient: 'from-purple-600/80 via-pink-500/60 to-orange-400/40',
        span: 'md:col-span-2 md:row-span-2',
        link: '/portfolio/royal-brands',
    },
    {
        id: 2,
        titleEn: 'Luxe Real Estate',
        titleAr: 'لوكس العقارية',
        categoryEn: 'Brand Identity',
        categoryAr: 'هوية بصرية',
        gradient: 'from-cyan-600/80 via-blue-500/60 to-indigo-500/40',
        span: 'md:col-span-1 md:row-span-1',
        link: '/portfolio/luxe-real-estate',
    },
    {
        id: 3,
        titleEn: 'FitZone App Launch',
        titleAr: 'إطلاق تطبيق فيت زون',
        categoryEn: 'Digital Marketing',
        categoryAr: 'تسويق رقمي',
        gradient: 'from-emerald-600/80 via-green-500/60 to-teal-400/40',
        span: 'md:col-span-1 md:row-span-1',
        link: '/portfolio/fitzone-app',
    },
    {
        id: 4,
        titleEn: 'Arabica Coffee Rebrand',
        titleAr: 'إعادة تصميم أرابيكا',
        categoryEn: 'Branding',
        categoryAr: 'تصميم علامة تجارية',
        gradient: 'from-amber-600/80 via-orange-500/60 to-red-400/40',
        span: 'md:col-span-1 md:row-span-2',
        link: '/portfolio/arabica-coffee',
    },
    {
        id: 5,
        titleEn: 'TechVault Landing Page',
        titleAr: 'صفحة تك فولت',
        categoryEn: 'Web Design',
        categoryAr: 'تصميم ويب',
        gradient: 'from-violet-600/80 via-purple-500/60 to-fuchsia-400/40',
        span: 'md:col-span-2 md:row-span-1',
        link: '/portfolio/techvault',
    },
]

// Gradient colors for fallback projects
export const GRADIENT_COLORS = [
    'from-red-500 to-orange-500',
    'from-purple-500 to-pink-500',
    'from-cyan-500 to-blue-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-primary',
    'from-indigo-500 to-violet-500',
] as const
