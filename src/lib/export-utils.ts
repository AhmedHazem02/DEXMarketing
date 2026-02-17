/**
 * Utility functions for exporting data to CSV and PDF
 * with full Arabic language support
 */

import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import type { Transaction } from '@/types/database'

/**
 * Export transactions to CSV with proper Arabic support
 */
export function exportToCSV(
    transactions: Transaction[],
    filename: string,
    isAr: boolean
): void {
    if (!transactions.length) return

    // CSV Headers with BOM for proper Arabic rendering in Excel
    const BOM = '\uFEFF'
    const headers = isAr
        ? ['الوصف', 'النوع', 'الفئة', 'المبلغ', 'التاريخ']
        : ['Description', 'Type', 'Category', 'Amount', 'Date']

    // Map transactions to CSV rows
    const rows = transactions.map(tx => [
        tx.description || '',
        isAr
            ? (tx.type === 'income' ? 'إيراد' : 'مصروف')
            : (tx.type === 'income' ? 'Income' : 'Expense'),
        tx.category || 'General',
        tx.amount.toFixed(2),
        `"=""${format(new Date(tx.created_at), 'dd/MM/yyyy')}"""`
    ])

    // Build CSV content
    const csvContent = [
        headers.join(';'),
        ...rows.map(row =>
            row.map(cell =>
                // Escape cells with semicolons, quotes, or newlines
                typeof cell === 'string' && (cell.includes(';') || cell.includes('"') || cell.includes('\n'))
                    ? `"${cell.replace(/"/g, '""')}"`
                    : cell
            ).join(';')
        )
    ].join('\n')

    // Create and download file
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadFile(blob, filename)
}

/**
 * Export transactions to PDF with Arabic support using jsPDF
 */
export async function exportToPDF(
    transactions: Transaction[],
    filename: string,
    isAr: boolean,
    stats?: {
        totalIncome: number
        totalExpense: number
        balance: number
    }
): Promise<void> {
    if (!transactions.length) return

    try {
        console.log('Starting PDF generation...')

        // Dynamic import with robust handling
        const jsPDFModule = await import('jspdf')
        const jsPDF = jsPDFModule.default || (jsPDFModule as any).jsPDF

        if (!jsPDF) {
            throw new Error('Failed to load jsPDF module')
        }

        const autoTableModule = await import('jspdf-autotable')
        const autoTable = autoTableModule.default

        console.log('Modules loaded. Creating PDF document...')

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        }) as any

        // Default to helvetica
        let fontName = 'helvetica'
        let fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'bold'

        // Load Arabic font
        try {
            console.log('Fetching Arabic font...')
            const fontUrl = '/fonts/Amiri-Regular.ttf'
            const response = await fetch(fontUrl)

            if (response.ok) {
                const fontBytes = await response.arrayBuffer()
                const fontBase64 = arrayBufferToBase64(fontBytes)

                // Add font to VFS
                doc.addFileToVFS('Amiri-Regular.ttf', fontBase64)
                doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')

                fontName = 'Amiri'
                fontStyle = 'normal'
                console.log('Arabic font loaded successfully.')
            } else {
                console.warn('Failed to fetch Arabic font:', response.status, response.statusText)
            }
        } catch (error) {
            console.error('Error loading Arabic font:', error)
            // Continue with default font
        }

        // Set font
        doc.setFont(fontName)
        doc.setFontSize(16)

        // Title
        const title = isAr ? 'تقرير المعاملات المالية' : 'Financial Transactions Report'
        const pageWidth = doc.internal.pageSize.getWidth()

        if (isAr) {
            doc.text(title, pageWidth - 15, 20, { align: 'right', lang: 'ar' })
        } else {
            doc.text(title, 15, 20)
        }

        // Date range and stats
        doc.setFontSize(10)
        const dateStr = format(new Date(), 'PPP', { locale: isAr ? ar : enUS })
        const dateLabel = isAr ? `التاريخ: ${dateStr}` : `Date: ${dateStr}`

        if (isAr) {
            doc.text(dateLabel, pageWidth - 15, 30, { align: 'right', lang: 'ar' })
        } else {
            doc.text(dateLabel, 15, 30)
        }

        let yPos = 40

        // Add statistics
        if (stats) {
            doc.setFontSize(11)
            const statsLines = [
                isAr
                    ? `إجمالي الإيرادات: ${stats.totalIncome.toLocaleString()} ج.م`
                    : `Total Income: ${stats.totalIncome.toLocaleString()} EGP`,
                isAr
                    ? `إجمالي المصروفات: ${stats.totalExpense.toLocaleString()} ج.م`
                    : `Total Expenses: ${stats.totalExpense.toLocaleString()} EGP`,
                isAr
                    ? `الرصيد الصافي: ${stats.balance.toLocaleString()} ج.م`
                    : `Net Balance: ${stats.balance.toLocaleString()} EGP`
            ]

            statsLines.forEach((line, i) => {
                if (isAr) {
                    doc.text(line, pageWidth - 15, yPos + (i * 7), { align: 'right', lang: 'ar' })
                } else {
                    doc.text(line, 15, yPos + (i * 7))
                }
            })

            yPos += 25
        }

        // Prepare table data
        const headers = isAr
            ? ['الوصف', 'النوع', 'الفئة', 'المبلغ', 'التاريخ']
            : ['Description', 'Type', 'Category', 'Amount', 'Date']

        const tableData = transactions.map(tx => {
            const row = [
                tx.description || '',
                isAr
                    ? (tx.type === 'income' ? 'إيراد' : 'مصروف')
                    : (tx.type === 'income' ? 'Income' : 'Expense'),
                tx.category || 'General',
                `${tx.amount.toLocaleString()}`,
                format(new Date(tx.created_at), 'dd/MM/yyyy')
            ]
            return row
        })

        const tableOptions = {
            head: [headers],
            body: tableData,
            startY: yPos,
            margin: { left: 15, right: 15 },
            styles: {
                font: fontName,
                fontSize: 9,
                cellPadding: 3,
                halign: (isAr ? 'right' : 'left') as 'right' | 'left'
            },
            headStyles: {
                fillColor: [71, 85, 105] as [number, number, number],
                textColor: [255, 255, 255] as [number, number, number],
                fontStyle: fontStyle,
                halign: (isAr ? 'right' : 'left') as 'right' | 'left'
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252] as [number, number, number]
            },
            columnStyles: (isAr ? {
                0: { halign: 'right' as 'right' },
                1: { halign: 'right' as 'right' },
                2: { halign: 'right' as 'right' },
                3: { halign: 'right' as 'right' },
                4: { halign: 'right' as 'right' }
            } : {
                3: { halign: 'right' as 'right' },
                4: { halign: 'right' as 'right' }
            }) as any
        }

        // Generate table using doc.autoTable or autotable(doc)
        if (typeof doc.autoTable === 'function') {
            doc.autoTable(tableOptions)
        } else if (typeof autoTable === 'function') {
            autoTable(doc, tableOptions)
        } else {
            console.error('autoTable function not found')
            throw new Error('PDF Table generation failed: autoTable not found')
        }

        // Footer
        const pageCount = doc.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(128)
            const footer = isAr ? `صفحة ${i} من ${pageCount}` : `Page ${i} of ${pageCount}`
            doc.text(footer, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center', lang: isAr ? 'ar' : 'en' })
        }

        // Save PDF
        console.log('Saving PDF...')
        doc.save(filename)
        console.log('PDF saved successfully.')

    } catch (error) {
        console.error('Export PDF Error:', error)
        throw error // Re-throw to trigger toast
    }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
}

// ============================================
// Client Accounts Export Functions
// ============================================

export interface ClientAccountExportData {
    id: string
    client: {
        user?: { name: string | null }
        company?: string | null
        name?: string | null
    } | null
    package_name: string | null
    package_name_ar?: string | null
    package_price: number | null
    remaining_balance: number | null
    created_at: string
}

/**
 * Export client accounts to CSV
 */
export function exportClientAccountsToCSV(
    accounts: ClientAccountExportData[],
    filename: string,
    isAr: boolean
): void {
    if (!accounts.length) return

    // CSV Headers with BOM
    const BOM = '\uFEFF'
    const headers = isAr
        ? ['العميل', 'الباقة', 'سعر الباقة', 'الرصيد المتبقي', 'تاريخ الإنشاء']
        : ['Client', 'Package', 'Package Price', 'Remaining Balance', 'Created At']

    // Map rows
    const rows = accounts.map(account => {
        const userName = account.client?.user?.name
        const clientName = userName || account.client?.company || account.client?.name || 'N/A'
        const packageName = isAr
            ? (account.package_name_ar || account.package_name)
            : account.package_name

        return [
            `"${(clientName || '').replace(/"/g, '""')}"`,
            `"${(packageName || '').replace(/"/g, '""')}"`,
            (account.package_price || 0).toString(),
            (account.remaining_balance || 0).toString(),
            `"=""${format(new Date(account.created_at), 'dd/MM/yyyy')}"""`
        ]
    })

    // Build CSV content
    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
    ].join('\n')

    // Create and download file
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadFile(blob, filename)
}

/**
 * Export client accounts to PDF
 */
export async function exportClientAccountsToPDF(
    accounts: ClientAccountExportData[],
    filename: string,
    isAr: boolean
): Promise<void> {
    if (!accounts.length) return

    try {
        // Load modules
        const jsPDFModule = await import('jspdf')
        const jsPDF = jsPDFModule.default || (jsPDFModule as any).jsPDF

        if (!jsPDF) {
            throw new Error('Failed to load jsPDF module')
        }

        const autoTableModule = await import('jspdf-autotable')
        const autoTable = autoTableModule.default

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        }) as any

        // Font settings
        let fontName = 'helvetica'
        let fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'bold'

        // Load Arabic font
        try {
            const fontUrl = '/fonts/Amiri-Regular.ttf'
            const response = await fetch(fontUrl)

            if (response.ok) {
                const fontBytes = await response.arrayBuffer()
                const fontBase64 = arrayBufferToBase64(fontBytes)

                doc.addFileToVFS('Amiri-Regular.ttf', fontBase64)
                doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')

                fontName = 'Amiri'
                fontStyle = 'normal'
            }
        } catch (error) {
            console.error('Failed to load Arabic font:', error)
        }

        // Set font
        doc.setFont(fontName)
        doc.setFontSize(16)

        // Title
        const title = isAr ? 'تقرير حسابات العملاء' : 'Client Accounts Report'
        const pageWidth = doc.internal.pageSize.getWidth()

        if (isAr) {
            doc.text(title, pageWidth - 15, 20, { align: 'right', lang: 'ar' })
        } else {
            doc.text(title, 15, 20)
        }

        // Date
        doc.setFontSize(10)
        const dateStr = format(new Date(), 'PPP', { locale: isAr ? ar : enUS })
        const dateLabel = isAr ? `التاريخ: ${dateStr}` : `Date: ${dateStr}`

        if (isAr) {
            doc.text(dateLabel, pageWidth - 15, 30, { align: 'right', lang: 'ar' })
        } else {
            doc.text(dateLabel, 15, 30)
        }

        let yPos = 40

        // Prepare table data
        const headers = isAr
            ? ['العميل', 'الباقة', 'سعر الباقة', 'الرصيد المتبقي', 'تاريخ الإنشاء']
            : ['Client', 'Package', 'Package Price', 'Remaining Balance', 'Created At']

        const tableData = accounts.map(account => {
            const userName = account.client?.user?.name
            const clientName = userName || account.client?.company || account.client?.name || 'N/A'
            const packageName = isAr
                ? (account.package_name_ar || account.package_name)
                : account.package_name

            const row = [
                clientName,
                packageName || '-',
                `${(account.package_price || 0).toLocaleString()} ${isAr ? 'ج.م' : 'EGP'}`,
                `${(account.remaining_balance || 0).toLocaleString()} ${isAr ? 'ج.م' : 'EGP'}`,
                format(new Date(account.created_at), 'dd/MM/yyyy')
            ]
            return row
        })

        const tableOptions = {
            head: [headers],
            body: tableData,
            startY: yPos,
            margin: { left: 15, right: 15 },
            styles: {
                font: fontName,
                fontSize: 9,
                cellPadding: 3,
                halign: (isAr ? 'right' : 'left') as 'right' | 'left'
            },
            headStyles: {
                fillColor: [71, 85, 105] as [number, number, number],
                textColor: [255, 255, 255] as [number, number, number],
                fontStyle: fontStyle,
                halign: (isAr ? 'right' : 'left') as 'right' | 'left'
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252] as [number, number, number]
            },
            columnStyles: (isAr ? {
                0: { halign: 'right' as 'right' },
                1: { halign: 'right' as 'right' },
                2: { halign: 'right' as 'right' },
                3: { halign: 'right' as 'right' },
                4: { halign: 'right' as 'right' }
            } : {
                2: { halign: 'right' as 'right' }, // Price
                3: { halign: 'right' as 'right' }  // Balance
            }) as any
        }

        // Generate table
        if (typeof doc.autoTable === 'function') {
            doc.autoTable(tableOptions)
        } else if (typeof autoTable === 'function') {
            autoTable(doc, tableOptions)
        }

        // Footer
        const pageCount = doc.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(128)
            const footer = isAr ? `صفحة ${i} من ${pageCount}` : `Page ${i} of ${pageCount}`
            doc.text(footer, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center', lang: isAr ? 'ar' : 'en' })
        }

        // Save PDF
        doc.save(filename)

    } catch (error) {
        console.error('Export Client Accounts PDF Error:', error)
        throw error
    }
}

/**
 * Helper function to trigger file download
 */
function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, extension: 'csv' | 'pdf', isAr: boolean): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss')
    const label = isAr ? 'معاملات' : 'transactions'
    return `${prefix}_${label}_${timestamp}.${extension}`
}

/**
 * Calculate summary statistics from filtered transactions
 */
export function calculateStats(transactions: Transaction[]): {
    totalIncome: number
    totalExpense: number
    balance: number
    count: number
} {
    const stats = transactions.reduce(
        (acc, tx) => {
            if (tx.type === 'income') {
                acc.totalIncome += tx.amount
            } else {
                acc.totalExpense += tx.amount
            }
            return acc
        },
        { totalIncome: 0, totalExpense: 0 }
    )

    return {
        ...stats,
        balance: stats.totalIncome - stats.totalExpense,
        count: transactions.length
    }
}

// ============================================
// Tasks Export Functions
// ============================================

/**
 * Type definition for task export data
 */
export interface TaskExportData {
    id: string
    title: string
    description?: string
    status: string
    priority: string
    department?: string
    task_type?: string
    created_at: string
    client_feedback?: string
    assigned_user?: { name: string }
    creator?: { name: string }
    project?: {
        name: string
        client?: {
            name?: string
            company?: string
        }
    }
}

/**
 * Export tasks to CSV with proper Arabic support
 */
export function exportTasksToCSV(
    tasks: TaskExportData[],
    filename?: string
): void {
    if (!tasks.length) return

    // CSV Headers with BOM for proper Arabic rendering in Excel
    const BOM = '\uFEFF'
    const headers = ['عنوان المهمة', 'القسم', 'المشروع', 'العميل', 'التيم ليدر', 'المصمم', 'الحالة', 'الأولوية', 'النوع', 'التاريخ', 'ملاحظات']

    // Status labels mapping
    const statusLabels: Record<string, string> = {
        'new': 'جديدة',
        'in_progress': 'قيد التنفيذ',
        'review': 'مراجعة',
        'revision': 'تعديل مطلوب',
        'approved': 'معتمد',
        'rejected': 'مرفوض',
        'completed': 'مكتمل'
    }

    // Priority labels mapping
    const priorityLabels: Record<string, string> = {
        'urgent': 'عاجل',
        'high': 'عالي',
        'medium': 'متوسط',
        'low': 'منخفض'
    }

    // Department labels mapping
    const departmentLabels: Record<string, string> = {
        'content': 'محتوى',
        'photography': 'تصوير'
    }

    // Task type labels mapping
    const taskTypeLabels: Record<string, string> = {
        'video': 'فيديو',
        'photo': 'تصوير',
        'editing': 'مونتاج',
        'content': 'محتوى',
        'general': 'عام'
    }

    // Map tasks to CSV rows
    const rows = tasks.map(task => {
        const deptLabel = task.department ? (departmentLabels[task.department] || task.department) : '-'
        const statusLabel = statusLabels[task.status] || task.status
        const priorityLabel = priorityLabels[task.priority] || task.priority
        const taskTypeLabel = task.task_type ? (taskTypeLabels[task.task_type] || task.task_type) : 'عام'

        return [
            `"${(task.title || '').replace(/"/g, '""')}"`,
            `"${deptLabel}"`,
            `"${task.project?.name || '-'}"`,
            `"${task.project?.client?.name || task.project?.client?.company || '-'}"`,
            `"${task.creator?.name || '-'}"`,
            `"${task.assigned_user?.name || 'غير معين'}"`,
            `"${statusLabel}"`,
            `"${priorityLabel}"`,
            `"${taskTypeLabel}"`,
            `"=""${format(new Date(task.created_at), 'dd/MM/yyyy')}"""`,
            `"${(task.client_feedback || '').replace(/"/g, '""')}"`
        ]
    })

    // Build CSV content
    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
    ].join('\n')

    // Create and download file
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const defaultFilename = `tasks_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
    downloadFile(blob, filename || defaultFilename)
}

/**
 * Export tasks to PDF with Arabic support using jsPDF
 */
export async function exportTasksToPDF(
    tasks: TaskExportData[],
    filename?: string,
    stats?: {
        total: number
        in_progress: number
        review: number
        approved: number
    }
): Promise<void> {
    if (!tasks.length) return

    try {
        console.log('Starting Tasks PDF generation...')
        // Robust module loading
        const jsPDFModule = await import('jspdf')
        const jsPDF = jsPDFModule.default || (jsPDFModule as any).jsPDF

        if (!jsPDF) {
            throw new Error('Failed to load jsPDF module')
        }

        const autoTableModule = await import('jspdf-autotable')
        const autoTable = autoTableModule.default

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        }) as any

        // Default to helvetica
        let fontName = 'helvetica'
        let fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal'

        // Load Arabic font
        try {
            const fontUrl = '/fonts/Amiri-Regular.ttf'
            const response = await fetch(fontUrl)

            if (response.ok) {
                const fontBytes = await response.arrayBuffer()
                const fontBase64 = arrayBufferToBase64(fontBytes)

                doc.addFileToVFS('Amiri-Regular.ttf', fontBase64)
                doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')

                fontName = 'Amiri'
                // fontStyle remains normal
            }
        } catch (error) {
            console.error('Failed to load Arabic font:', error)
        }

        // Set font
        doc.setFont(fontName)
        doc.setFontSize(18)

        // Title
        const title = 'تقرير المهام الشامل'
        const pageWidth = doc.internal.pageSize.getWidth()
        doc.text(title, pageWidth - 15, 20, { align: 'right', lang: 'ar' })

        // Date and subtitle
        doc.setFontSize(10)
        const dateStr = format(new Date(), 'PPP', { locale: ar })
        doc.text(`التاريخ: ${dateStr}`, pageWidth - 15, 28, { align: 'right', lang: 'ar' })

        let yPos = 38

        // Add statistics
        if (stats) {
            doc.setFontSize(11)
            const statsLines = [
                `إجمالي المهام: ${stats.total}`,
                `قيد التنفيذ: ${stats.in_progress}`,
                `مراجعة: ${stats.review}`,
                `معتمد: ${stats.approved}`
            ]

            statsLines.forEach((line, i) => {
                doc.text(line, pageWidth - 15, yPos + (i * 6), { align: 'right', lang: 'ar' })
            })

            yPos += 28
        }

        // Table Data Preparation
        const statusLabels: Record<string, string> = {
            'new': 'جديدة',
            'in_progress': 'قيد التنفيذ',
            'review': 'مراجعة',
            'revision': 'تعديل',
            'approved': 'معتمد',
            'rejected': 'مرفوض',
            'completed': 'مكتمل'
        }

        const priorityLabels: Record<string, string> = {
            'urgent': 'عاجل',
            'high': 'عالي',
            'medium': 'متوسط',
            'low': 'منخفض'
        }

        const headers = ['التاريخ', 'الحالة', 'الأولوية', 'المصمم', 'التيم ليدر', 'العميل', 'المشروع', 'القسم', 'المهمة']

        const tableData = tasks.map(task => {
            const deptLabel = task.department === 'content' ? 'محتوى' : task.department === 'photography' ? 'تصوير' : '-'
            const statusLabel = statusLabels[task.status] || task.status
            const priorityLabel = priorityLabels[task.priority] || task.priority

            return [
                format(new Date(task.created_at), 'dd/MM/yyyy'),
                statusLabel,
                priorityLabel,
                task.assigned_user?.name || 'غير معين',
                task.creator?.name || '-',
                task.project?.client?.name || task.project?.client?.company || '-',
                task.project?.name || 'بدون مشروع',
                deptLabel,
                task.title
            ]
        })

        const tableOptions = {
            head: [headers],
            body: tableData,
            startY: yPos,
            margin: { left: 10, right: 10 },
            styles: {
                font: fontName,
                fontSize: 8,
                cellPadding: 2,
                halign: 'right' as 'right',
                overflow: 'linebreak' as 'linebreak'
            },
            headStyles: {
                fillColor: [71, 85, 105] as [number, number, number],
                textColor: [255, 255, 255] as [number, number, number],
                fontStyle: fontStyle,
                halign: 'right' as 'right'
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252] as [number, number, number]
            },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 20 },
                2: { cellWidth: 18 },
                3: { cellWidth: 25 },
                4: { cellWidth: 25 },
                5: { cellWidth: 30 },
                6: { cellWidth: 30 },
                7: { cellWidth: 20 },
                8: { cellWidth: 'auto' as 'auto' }
            }
        }

        // Generate table
        if (typeof doc.autoTable === 'function') {
            doc.autoTable(tableOptions)
        } else if (typeof autoTable === 'function') {
            autoTable(doc, tableOptions)
        } else {
            console.error('autoTable function not found')
            throw new Error('PDF Table generation failed: autoTable not found')
        }

        // Footer
        const pageCount = doc.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(128)
            const footer = `صفحة ${i} من ${pageCount}`
            doc.text(footer, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center', lang: 'ar' })
        }

        // Save PDF
        const defaultFilename = `tasks_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`
        doc.save(filename || defaultFilename)
        console.log('Tasks PDF saved successfully')

    } catch (error) {
        console.error('Export Tasks PDF Error:', error)
        throw error
    }
}
