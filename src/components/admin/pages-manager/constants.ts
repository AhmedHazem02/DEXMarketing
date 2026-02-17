import type { SchemaField, ItemFieldDef, CreateFormData } from './types'

// ─── Predefined Pages ────────────────────────────────────────

export const PREDEFINED_PAGES = [
    { value: 'home', label: 'الرئيسية (Home)' },
    { value: 'about', label: 'من نحن (About Us)' },
    { value: 'services', label: 'الخدمات (Services)' },
    { value: 'portfolio', label: 'أعمالنا (Portfolio)' },
    { value: 'contact', label: 'تواصل معنا (Contact Us)' },
    { value: 'terms', label: 'الشروط والأحكام (Terms)' },
    { value: 'privacy', label: 'سياسة الخصوصية (Privacy)' },
] as const

/** Pages that use an items-array editor (services, portfolio) */
export const ITEMS_PAGES = new Set(['services', 'portfolio'])

/** Item field definitions per page type */
export const ITEMS_FIELDS: Record<string, ItemFieldDef[]> = {
    services: [
        { key: 'title', label: 'اسم الخدمة (Title)', type: 'text' },
        { key: 'description', label: 'الوصف (Description)', type: 'textarea' },
        { key: 'image', label: 'صورة / أيقونة (Image)', type: 'image', bilingual: false },
    ],
    portfolio: [
        { key: 'title', label: 'اسم المشروع (Title)', type: 'text' },
        { key: 'category', label: 'التصنيف (Category)', type: 'text' },
        { key: 'description', label: 'الوصف (Description)', type: 'textarea' },
        { key: 'media', label: 'صورة / فيديو (Media)', type: 'media', bilingual: false },
        { key: 'link', label: 'رابط المشروع (Link)', type: 'text', bilingual: false },
    ],
}

/** Simple-field schemas (non-items pages) */
export const PAGE_SCHEMAS: Record<string, SchemaField[]> = {
    home: [
        { key: 'hero_title', label: 'عنوان الهيرو (Hero Title)', type: 'text' },
        { key: 'hero_subtitle', label: 'وصف الهيرو (Hero Subtitle)', type: 'textarea' },
        { key: 'cta_text', label: 'نص زر الدعوة (CTA Button)', type: 'text' },
    ],
    about: [
        { key: 'mission', label: 'المهمة (Mission)', type: 'textarea' },
        { key: 'vision', label: 'الرؤية (Vision)', type: 'textarea' },
        { key: 'story', label: 'قصتنا (Our Story)', type: 'textarea' },
    ],
    contact: [
        { key: 'email', label: 'البريد الإلكتروني', type: 'text' },
        { key: 'phone', label: 'رقم الهاتف', type: 'text' },
        { key: 'address', label: 'العنوان', type: 'textarea' },
        { key: 'whatsapp', label: 'رقم الواتساب', type: 'text' },
    ],
    terms: [
        { key: 'title', label: 'عنوان الصفحة (Page Title)', type: 'text' },
        { key: 'content', label: 'نص الشروط والأحكام (Content)', type: 'textarea' },
        { key: 'last_updated', label: 'تاريخ آخر تحديث', type: 'text' },
    ],
    privacy: [
        { key: 'title', label: 'عنوان الصفحة (Page Title)', type: 'text' },
        { key: 'content', label: 'نص سياسة الخصوصية (Content)', type: 'textarea' },
        { key: 'last_updated', label: 'تاريخ آخر تحديث', type: 'text' },
    ],
}

export const INITIAL_CREATE_DATA: CreateFormData = {
    selectedSlug: '',
    customSlug: '',
    title_en: '',
    title_ar: '',
}
