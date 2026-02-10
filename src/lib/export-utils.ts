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
        format(new Date(tx.created_at), 'PPP', { locale: isAr ? ar : enUS })
    ])

    // Build CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row =>
            row.map(cell =>
                // Escape cells with commas, quotes, or newlines
                typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))
                    ? `"${cell.replace(/"/g, '""')}"`
                    : cell
            ).join(',')
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

    // Dynamic import to reduce bundle size
    const jsPDFModule = await import('jspdf')
    const jsPDF = jsPDFModule.default
    await import('jspdf-autotable')

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    }) as any // Using any to bypass incomplete type definitions

    // Set font for Arabic support (fallback to built-in fonts)
    doc.setFont('helvetica')
    doc.setFontSize(16)

    // Title
    const title = isAr ? 'تقرير المعاملات المالية' : 'Financial Transactions Report'
    const pageWidth = doc.internal.pageSize.getWidth()
    
    if (isAr) {
        // Right-align for Arabic
        doc.text(title, pageWidth - 15, 20, { align: 'right' })
    } else {
        doc.text(title, 15, 20)
    }

    // Date range and stats
    doc.setFontSize(10)
    const dateStr = format(new Date(), 'PPP', { locale: isAr ? ar : enUS })
    const dateLabel = isAr ? `التاريخ: ${dateStr}` : `Date: ${dateStr}`
    
    if (isAr) {
        doc.text(dateLabel, pageWidth - 15, 30, { align: 'right' })
    } else {
        doc.text(dateLabel, 15, 30)
    }

    let yPos = 40

    // Add statistics if provided
    if (stats) {
        doc.setFontSize(11)
        const statsLines = [
            isAr
                ? `إجمالي الإيرادات: $${stats.totalIncome.toLocaleString()}`
                : `Total Income: $${stats.totalIncome.toLocaleString()}`,
            isAr
                ? `إجمالي المصروفات: $${stats.totalExpense.toLocaleString()}`
                : `Total Expenses: $${stats.totalExpense.toLocaleString()}`,
            isAr
                ? `الرصيد الصافي: $${stats.balance.toLocaleString()}`
                : `Net Balance: $${stats.balance.toLocaleString()}`
        ]

        statsLines.forEach((line, i) => {
            if (isAr) {
                doc.text(line, pageWidth - 15, yPos + (i * 7), { align: 'right' })
            } else {
                doc.text(line, 15, yPos + (i * 7))
            }
        })

        yPos += 25
    }

    // Prepare table data
    const headers = isAr
        ? ['التاريخ', 'المبلغ', 'الفئة', 'النوع', 'الوصف']
        : ['Description', 'Type', 'Category', 'Amount', 'Date']

    const tableData = transactions.map(tx => {
        const row = [
            tx.description || '',
            isAr
                ? (tx.type === 'income' ? 'إيراد' : 'مصروف')
                : (tx.type === 'income' ? 'Income' : 'Expense'),
            tx.category || 'General',
            `$${tx.amount.toLocaleString()}`,
            format(new Date(tx.created_at), 'PP', { locale: isAr ? ar : enUS })
        ]
        return isAr ? row.reverse() : row
    })

    // autoTable is added via plugin and available on the doc instance
    doc.autoTable({
        head: [isAr ? headers.reverse() : headers],
        body: tableData,
        startY: yPos,
        margin: { left: 15, right: 15 },
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 3,
            halign: isAr ? 'right' : 'left'
        },
        headStyles: {
            fillColor: [71, 85, 105], // slate-600
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: isAr ? 'right' : 'left'
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // slate-50
        },
        columnStyles: isAr ? {
            0: { halign: 'right' }, // Date
            1: { halign: 'right' }, // Amount
            2: { halign: 'right' }, // Category
            3: { halign: 'right' }, // Type
            4: { halign: 'right' }  // Description
        } : {
            3: { halign: 'right' }, // Amount
            4: { halign: 'right' }  // Date
        }
    })

    // Footer with page numbers
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128)
        const footer = isAr ? `صفحة ${i} من ${pageCount}` : `Page ${i} of ${pageCount}`
        doc.text(footer, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })
    }

    // Save PDF
    doc.save(filename)
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
            format(new Date(task.created_at), 'yyyy-MM-dd'),
            `"${(task.client_feedback || '').replace(/"/g, '""')}"`
        ]
    })

    // Build CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
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

    // Dynamic import to reduce bundle size
    const jsPDFModule = await import('jspdf')
    const jsPDF = jsPDFModule.default
    await import('jspdf-autotable')

    const doc = new jsPDF({
        orientation: 'landscape', // Landscape for more columns
        unit: 'mm',
        format: 'a4'
    }) as any

    // Set font
    doc.setFont('helvetica')
    doc.setFontSize(18)

    // Title
    const title = 'تقرير المهام الشامل'
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.text(title, pageWidth - 15, 20, { align: 'right' })

    // Date and subtitle
    doc.setFontSize(10)
    const dateStr = format(new Date(), 'PPP', { locale: ar })
    doc.text(`التاريخ: ${dateStr}`, pageWidth - 15, 28, { align: 'right' })

    let yPos = 38

    // Add statistics if provided
    if (stats) {
        doc.setFontSize(11)
        const statsLines = [
            `إجمالي المهام: ${stats.total}`,
            `قيد التنفيذ: ${stats.in_progress}`,
            `مراجعة: ${stats.review}`,
            `معتمد: ${stats.approved}`
        ]

        statsLines.forEach((line, i) => {
            doc.text(line, pageWidth - 15, yPos + (i * 6), { align: 'right' })
        })

        yPos += 28
    }

    // Status labels mapping
    const statusLabels: Record<string, string> = {
        'new': 'جديدة',
        'in_progress': 'قيد التنفيذ',
        'review': 'مراجعة',
        'revision': 'تعديل',
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

    // Table headers (RTL order)
    const headers = ['التاريخ', 'الحالة', 'الأولوية', 'المصمم', 'التيم ليدر', 'العميل', 'المشروع', 'القسم', 'المهمة']

    // Prepare table data
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

    // Generate table
    doc.autoTable({
        head: [headers],
        body: tableData,
        startY: yPos,
        margin: { left: 10, right: 10 },
        styles: {
            font: 'helvetica',
            fontSize: 8,
            cellPadding: 2,
            halign: 'right',
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: [71, 85, 105],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'right'
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        columnStyles: {
            0: { cellWidth: 20 }, // Date
            1: { cellWidth: 20 }, // Status
            2: { cellWidth: 18 }, // Priority
            3: { cellWidth: 25 }, // Designer
            4: { cellWidth: 25 }, // Team Leader
            5: { cellWidth: 30 }, // Client
            6: { cellWidth: 30 }, // Project
            7: { cellWidth: 20 }, // Department
            8: { cellWidth: 'auto' } // Task title
        }
    })

    // Footer with page numbers
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128)
        const footer = `صفحة ${i} من ${pageCount}`
        doc.text(footer, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })
    }

    // Save PDF
    const defaultFilename = `tasks_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`
    doc.save(filename || defaultFilename)
}
