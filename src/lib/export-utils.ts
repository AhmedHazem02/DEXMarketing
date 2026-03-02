/**
 * Utility functions for exporting data to CSV and PDF
 * with full Arabic language support
 */

import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import type { Transaction } from '@/types/database'

// ============================================
// Module-level cache — declared at top so all functions can reference them
// ============================================

/** Cached base64 Arabic font — null = not fetched yet, '' = fetch failed */
let cachedFontBase64: string | null = null

/** Cached base64 DEX logo — null = not fetched yet, '' = fetch failed */
let cachedLogoBase64: string | null = null

/** In-flight font fetch promise — prevents duplicate concurrent requests */
let fontFetchPromise: Promise<void> | null = null

/** In-flight logo fetch promise — prevents duplicate concurrent requests */
let logoFetchPromise: Promise<void> | null = null

// ============================================
// Static letterhead block definitions (portrait A4 = 210 mm wide)
// Left blocks are fully static; right blocks are computed once per draw
// because pageWidth can differ between portrait/landscape.
// ============================================
const LEFT_BLOCKS = [
    { x: 0,  w: 22, r: 247, g: 210, b: 0 },
    { x: 22, w: 11, r: 220, g: 185, b: 0 },
    { x: 33, w: 7,  r: 180, g: 150, b: 0 },
    { x: 40, w: 5,  r: 120, g: 100, b: 0 },
] as const

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
        const { doc, autoTable, fontName, fontStyle, pageWidth } = await createPDFDocument()
        const pageHeight = doc.internal.pageSize.getHeight()
        doc.setFontSize(16)

        // Title — pushed down below the letterhead header (~35 mm)
        const title = isAr ? 'تقرير المعاملات المالية' : 'Financial Transactions Report'

        if (isAr) {
            doc.text(title, pageWidth - 15, 40, { align: 'right', lang: 'ar' })
        } else {
            doc.text(title, 15, 40)
        }

        // Date range and stats
        doc.setFontSize(10)
        const dateStr = format(new Date(), 'PPP', { locale: isAr ? ar : enUS })
        const dateLabel = isAr ? `التاريخ: ${dateStr}` : `Date: ${dateStr}`

        if (isAr) {
            doc.text(dateLabel, pageWidth - 15, 48, { align: 'right', lang: 'ar' })
        } else {
            doc.text(dateLabel, 15, 48)
        }

        let yPos = 58

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
            margin: { top: 35, bottom: 30, left: 15, right: 15 },
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

        runAutoTable(doc, autoTable, tableOptions)
        await addLetterheadToAllPages(doc, pageWidth, pageHeight, fontName, isAr)

        // Save PDF
        doc.save(filename)

    } catch (error) {
        console.error('Export PDF Error:', error)
        throw error // Re-throw to trigger toast
    }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    const CHUNK_SIZE = 0x8000 // 32KB chunks to avoid call stack overflow
    const chunks: string[] = []
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        chunks.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE)))
    }
    return window.btoa(chunks.join(''))
}

// ============================================
// DEX Letterhead Helpers
// ============================================

/**
 * Draws the DEX branded header bar (coloured blocks + logo) at the top of the current page.
 */
function _drawLetterheadHeader(doc: any, pageWidth: number, fontName: string, logoBase64: string | null): void {
    const barH = 10 // top decorative bar height in mm

    // Draw left static blocks
    for (const b of LEFT_BLOCKS) {
        doc.setFillColor(b.r, b.g, b.b)
        doc.rect(b.x, 0, b.w, barH, 'F')
    }

    // Draw right mirrored blocks (x depends on pageWidth — computed inline, no array allocation)
    doc.setFillColor(120, 100, 0); doc.rect(pageWidth - 45, 0, 5,  barH, 'F')
    doc.setFillColor(180, 150, 0); doc.rect(pageWidth - 40, 0, 7,  barH, 'F')
    doc.setFillColor(220, 185, 0); doc.rect(pageWidth - 33, 0, 11, barH, 'F')
    doc.setFillColor(247, 210, 0); doc.rect(pageWidth - 22, 0, 22, barH, 'F')

    // Thin dark separator line below the bar
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.3)
    doc.line(0, barH, pageWidth, barH)

    // DEX Logo (centred below the bar)
    const logoW = 28
    const logoH = 14
    const logoX = (pageWidth - logoW) / 2
    if (logoBase64) {
        try {
            doc.addImage(logoBase64, 'PNG', logoX, barH + 3, logoW, logoH)
        } catch {
            _drawTextLogo(doc, pageWidth, barH, fontName)
        }
    } else {
        _drawTextLogo(doc, pageWidth, barH, fontName)
    }
}

function _drawTextLogo(doc: any, pageWidth: number, barH: number, fontName: string): void {
    doc.setFont(fontName)
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('DEX', pageWidth / 2, barH + 11, { align: 'center' })
    doc.setFontSize(6)
    doc.text('FOR ADVERTISING', pageWidth / 2, barH + 16, { align: 'center' })
}

/**
 * Draws the DEX branded footer (address + contact + golden bar) on the current page.
 */
function _drawLetterheadFooter(
    doc: any,
    pageWidth: number,
    pageHeight: number,
    fontName: string,
    isAr: boolean,
    currentPage: number,
    totalPages: number
): void {
    const footerBarH = 8
    const footerBarY = pageHeight - footerBarH
    const sepY        = pageHeight - 28

    // Bottom golden bar
    doc.setFillColor(247, 210, 0)
    doc.rect(0, footerBarY, pageWidth, footerBarH, 'F')

    // Separator line above footer text
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(12, sepY, pageWidth - 12, sepY)

    doc.setFont(fontName)

    // Arabic address (right-aligned)
    doc.setFontSize(7.5)
    doc.setTextColor(60, 60, 60)
    if (isAr) {
        doc.text('سوهاج، أمام مدرسة الراهبات', pageWidth - 14, sepY + 6,  { align: 'right', lang: 'ar' })
        doc.text('أعلى مكتبة الشريف، الدور الثالث', pageWidth - 14, sepY + 12, { align: 'right', lang: 'ar' })
    } else {
        doc.text('Sohag, In front of Al-Rahbat School', pageWidth - 14, sepY + 6,  { align: 'right' })
        doc.text('Above Al-Shareef Library, 3rd Floor', pageWidth - 14, sepY + 12, { align: 'right' })
    }

    // Centre: company name + phone
    doc.setFontSize(8)
    doc.setTextColor(40, 40, 40)
    doc.text('Dex Advertising Agency', pageWidth / 2, sepY + 6,  { align: 'center' })
    doc.setFontSize(7.5)
    doc.setTextColor(80, 80, 80)
    doc.text('01553030051', pageWidth / 2, sepY + 12, { align: 'center' })

    // Page number (left side)
    doc.setFontSize(7.5)
    doc.setTextColor(120, 120, 120)
    doc.text(`${currentPage} / ${totalPages}`, 14, sepY + 9)

    // Reset
    doc.setTextColor(0, 0, 0)
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.2)
}

/**
 * Applies the DEX letterhead (header + footer) to every page of the document.
 * Call this AFTER all content has been added so the page count is final.
 */
async function addLetterheadToAllPages(
    doc: any,
    pageWidth: number,
    pageHeight: number,
    fontName: string,
    isAr: boolean
): Promise<void> {
    // Load & cache the logo once — use a shared promise to prevent duplicate concurrent fetches
    if (cachedLogoBase64 === null) {
        if (!logoFetchPromise) {
            logoFetchPromise = (async () => {
                try {
                    const response = await fetch('/images/DEX LOGO 2.png')
                    if (response.ok) {
                        const bytes = await response.arrayBuffer()
                        cachedLogoBase64 = 'data:image/png;base64,' + arrayBufferToBase64(bytes)
                    } else {
                        cachedLogoBase64 = ''
                    }
                } catch {
                    cachedLogoBase64 = ''
                } finally {
                    logoFetchPromise = null
                }
            })()
        }
        await logoFetchPromise
    }

    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        _drawLetterheadHeader(doc, pageWidth, fontName, cachedLogoBase64 || null)
        _drawLetterheadFooter(doc, pageWidth, pageHeight, fontName, isAr, i, pageCount)
    }
}
// ============================================

interface PDFDocumentResult {
    doc: any
    autoTable: any
    fontName: string
    fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic'
    pageWidth: number
}

/**
 * Creates a jsPDF document with Arabic font support.
 * Handles dynamic module loading, font fetching, and font registration.
 */
async function createPDFDocument(options?: {
    orientation?: 'portrait' | 'landscape'
    defaultFontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic'
}): Promise<PDFDocumentResult> {
    const { orientation = 'portrait', defaultFontStyle = 'bold' } = options || {}

    const jsPDFModule = await import('jspdf')
    const jsPDF = jsPDFModule.default || (jsPDFModule as any).jsPDF
    if (!jsPDF) throw new Error('Failed to load jsPDF module')

    const autoTableModule = await import('jspdf-autotable')
    const autoTable = autoTableModule.default

    const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' }) as any

    let fontName = 'helvetica'
    let fontStyle = defaultFontStyle

    try {
        if (cachedFontBase64 === null) {
            if (!fontFetchPromise) {
                fontFetchPromise = (async () => {
                    try {
                        const response = await fetch('/fonts/Amiri-Regular.ttf')
                        if (response.ok) {
                            const fontBytes = await response.arrayBuffer()
                            cachedFontBase64 = arrayBufferToBase64(fontBytes)
                        } else {
                            cachedFontBase64 = ''
                        }
                    } catch {
                        cachedFontBase64 = ''
                    } finally {
                        fontFetchPromise = null
                    }
                })()
            }
            await fontFetchPromise
        }
        if (cachedFontBase64) {
            doc.addFileToVFS('Amiri-Regular.ttf', cachedFontBase64)
            doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')
            fontName = 'Amiri'
            fontStyle = 'normal'
        }
    } catch (error) {
        console.error('Failed to load Arabic font:', error)
    }

    doc.setFont(fontName)

    return { doc, autoTable, fontName, fontStyle, pageWidth: doc.internal.pageSize.getWidth() }
}

/**
 * Invokes autoTable on the document, handling both plugin and standalone modes.
 */
function runAutoTable(doc: any, autoTable: any, options: any): void {
    if (typeof doc.autoTable === 'function') {
        doc.autoTable(options)
    } else if (typeof autoTable === 'function') {
        autoTable(doc, options)
    } else {
        throw new Error('PDF Table generation failed: autoTable not found')
    }
}

// ============================================
// Client Accounts Export Functions
// ============================================

export interface ClientAccountExportData {
    id: string
    client: {
        user?: { name: string | null }
        name?: string | null
    } | null
    package_name: string | null
    package_name_ar?: string | null
    package_price: number | null
    remaining_balance: number | null
    created_at: string
    transactions?: Array<{
        id: string
        type: string
        amount: number
        description?: string | null
        category?: string | null
        transaction_date?: string | null
        payment_method?: string | null
    }>
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

    // ── Section 1: Accounts summary ──
    const accountHeaders = isAr
        ? ['العميل', 'الباقة', 'سعر الباقة', 'الرصيد المتبقي', 'تاريخ الإنشاء']
        : ['Client', 'Package', 'Package Price', 'Remaining Balance', 'Created At']

    const accountRows = accounts.map(account => {
        const userName = account.client?.user?.name
        const clientName = userName || account.client?.name || 'N/A'
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

    // ── Section 2: Transactions ──
    const txHeaders = isAr
        ? ['العميل', 'الباقة', 'النوع', 'الفئة', 'الوصف', 'المبلغ', 'تاريخ المعاملة', 'طريقة الدفع']
        : ['Client', 'Package', 'Type', 'Category', 'Description', 'Amount', 'Transaction Date', 'Payment Method']

    const txRows: string[][] = []
    for (const account of accounts) {
        const userName = account.client?.user?.name
        const clientName = userName || account.client?.name || 'N/A'
        const packageName = isAr
            ? (account.package_name_ar || account.package_name)
            : account.package_name

        for (const tx of account.transactions ?? []) {
            const txType = isAr
                ? (tx.type === 'income' ? 'دخل' : 'صرف')
                : (tx.type === 'income' ? 'Income' : 'Expense')

            txRows.push([
                `"${(clientName || '').replace(/"/g, '""')}"`,
                `"${(packageName || '').replace(/"/g, '""')}"`,
                `"${txType}"`,
                `"${(tx.category || '').replace(/"/g, '""')}"`,
                `"${(tx.description || '').replace(/"/g, '""')}"`,
                tx.amount.toString(),
                tx.transaction_date
                    ? `"=""${format(new Date(tx.transaction_date), 'dd/MM/yyyy')}"""`
                    : '""',
                `"${(tx.payment_method || '').replace(/"/g, '""')}"`
            ])
        }
    }

    // Build CSV content: accounts block + blank line + transactions block
    const sectionLabel1 = isAr ? '=== ملخص الحسابات ===' : '=== Accounts Summary ==='
    const sectionLabel2 = isAr ? '=== تفاصيل المعاملات ===' : '=== Transactions Detail ==='

    const lines: string[] = [
        `"${sectionLabel1}"`,
        accountHeaders.join(';'),
        ...accountRows.map(r => r.join(';')),
        '',
        `"${sectionLabel2}"`,
        txHeaders.join(';'),
        ...txRows.map(r => r.join(';'))
    ]

    const csvContent = lines.join('\n')

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
        const { doc, autoTable, fontName, fontStyle, pageWidth } = await createPDFDocument()
        const pageHeight = doc.internal.pageSize.getHeight()
        doc.setFontSize(16)

        // Title — pushed down below the letterhead header (~35 mm)
        const title = isAr ? 'تقرير حسابات العملاء' : 'Client Accounts Report'

        if (isAr) {
            doc.text(title, pageWidth - 15, 40, { align: 'right', lang: 'ar' })
        } else {
            doc.text(title, 15, 40)
        }

        // Date
        doc.setFontSize(10)
        const dateStr = format(new Date(), 'PPP', { locale: isAr ? ar : enUS })
        const dateLabel = isAr ? `التاريخ: ${dateStr}` : `Date: ${dateStr}`

        if (isAr) {
            doc.text(dateLabel, pageWidth - 15, 48, { align: 'right', lang: 'ar' })
        } else {
            doc.text(dateLabel, 15, 48)
        }

        let yPos = 57

        // ── Section 1: Accounts summary table ──
        const accountSectionTitle = isAr ? 'ملخص الحسابات' : 'Accounts Summary'
        doc.setFontSize(13)
        if (isAr) {
            doc.text(accountSectionTitle, pageWidth - 15, yPos, { align: 'right', lang: 'ar' })
        } else {
            doc.text(accountSectionTitle, 15, yPos)
        }
        yPos += 8

        const headers = isAr
            ? ['العميل', 'الباقة', 'سعر الباقة', 'الرصيد المتبقي', 'تاريخ الإنشاء']
            : ['Client', 'Package', 'Package Price', 'Remaining Balance', 'Created At']

        const tableData = accounts.map(account => {
            const userName = account.client?.user?.name
            const clientName = userName || account.client?.name || 'N/A'
            const packageName = isAr
                ? (account.package_name_ar || account.package_name)
                : account.package_name

            return [
                clientName,
                packageName || '-',
                `${(account.package_price || 0).toLocaleString()} ${isAr ? 'ج.م' : 'EGP'}`,
                `${(account.remaining_balance || 0).toLocaleString()} ${isAr ? 'ج.م' : 'EGP'}`,
                format(new Date(account.created_at), 'dd/MM/yyyy')
            ]
        })

        const summaryTableOptions = {
            head: [headers],
            body: tableData,
            startY: yPos,
            margin: { top: 35, bottom: 30, left: 15, right: 15 },
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
                2: { halign: 'right' as 'right' },
                3: { halign: 'right' as 'right' }
            }) as any
        }

        runAutoTable(doc, autoTable, summaryTableOptions)

        // ── Section 2: Transactions per account ──
        const allTransactions: Array<string[]> = []
        for (const account of accounts) {
            const userName = account.client?.user?.name
            const clientName = userName || account.client?.name || 'N/A'
            const packageName = isAr
                ? (account.package_name_ar || account.package_name)
                : account.package_name

            for (const tx of account.transactions ?? []) {
                const txType = isAr
                    ? (tx.type === 'income' ? 'دخل' : 'صرف')
                    : (tx.type === 'income' ? 'Income' : 'Expense')

                allTransactions.push([
                    clientName,
                    packageName || '-',
                    txType,
                    tx.category || '-',
                    tx.description || '-',
                    `${tx.amount.toLocaleString()} ${isAr ? 'ج.م' : 'EGP'}`,
                    tx.transaction_date
                        ? format(new Date(tx.transaction_date), 'dd/MM/yyyy')
                        : '-',
                    tx.payment_method || '-'
                ])
            }
        }

        if (allTransactions.length > 0) {
            const txSectionTitle = isAr ? 'تفاصيل المعاملات' : 'Transactions Detail'

            // Get Y position after the first table
            const lastY = (doc as any).lastAutoTable?.finalY ?? (doc.internal.pageSize.height / 2)
            const txTitleY = lastY + 12

            doc.setFontSize(13)
            if (isAr) {
                doc.text(txSectionTitle, pageWidth - 15, txTitleY, { align: 'right', lang: 'ar' })
            } else {
                doc.text(txSectionTitle, 15, txTitleY)
            }

            const txHeaders = isAr
                ? ['العميل', 'الباقة', 'النوع', 'الفئة', 'الوصف', 'المبلغ', 'التاريخ', 'الدفع']
                : ['Client', 'Package', 'Type', 'Category', 'Description', 'Amount', 'Date', 'Payment']

            const txTableOptions = {
                head: [txHeaders],
                body: allTransactions,
                startY: txTitleY + 6,
                margin: { top: 35, bottom: 30, left: 15, right: 15 },
                styles: {
                    font: fontName,
                    fontSize: 8,
                    cellPadding: 2.5,
                    halign: (isAr ? 'right' : 'left') as 'right' | 'left'
                },
                headStyles: {
                    fillColor: [30, 120, 120] as [number, number, number],
                    textColor: [255, 255, 255] as [number, number, number],
                    fontStyle: fontStyle,
                    halign: (isAr ? 'right' : 'left') as 'right' | 'left'
                },
                alternateRowStyles: {
                    fillColor: [240, 253, 252] as [number, number, number]
                },
                columnStyles: (isAr ? {
                    0: { halign: 'right' as 'right' },
                    1: { halign: 'right' as 'right' },
                    2: { halign: 'right' as 'right' },
                    3: { halign: 'right' as 'right' },
                    4: { halign: 'right' as 'right' },
                    5: { halign: 'right' as 'right' },
                    6: { halign: 'right' as 'right' },
                    7: { halign: 'right' as 'right' }
                } : {
                    5: { halign: 'right' as 'right' }
                }) as any
            }

            runAutoTable(doc, autoTable, txTableOptions)
        }

        await addLetterheadToAllPages(doc, pageWidth, pageHeight, fontName, isAr)

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
    if (typeof window === 'undefined') return
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
        }
    }
}

/**
 * Export tasks to CSV with proper Arabic support
 */
export function exportTasksToCSV(
    tasks: TaskExportData[],
    filename?: string,
    locale: 'ar' | 'en' = 'ar'
): void {
    if (!tasks.length) return

    const isAr = locale === 'ar'

    // CSV Headers with BOM for proper rendering in Excel
    const BOM = '\uFEFF'
    const headers = isAr
        ? ['عنوان المهمة', 'القسم', 'المشروع', 'العميل', 'التيم ليدر', 'المصمم', 'الحالة', 'الأولوية', 'النوع', 'التاريخ', 'ملاحظات']
        : ['Task Title', 'Department', 'Project', 'Client', 'Team Leader', 'Designer', 'Status', 'Priority', 'Type', 'Date', 'Notes']

    // Status labels mapping
    const statusLabels: Record<string, string> = isAr ? {
        'new': 'جديدة',
        'in_progress': 'قيد التنفيذ',
        'review': 'مراجعة',
        'revision': 'تعديل مطلوب',
        'approved': 'معتمد',
        'rejected': 'مرفوض',
        'completed': 'مكتمل'
    } : {
        'new': 'New',
        'in_progress': 'In Progress',
        'review': 'Review',
        'revision': 'Revision Required',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'completed': 'Completed'
    }

    // Priority labels mapping
    const priorityLabels: Record<string, string> = isAr ? {
        'urgent': 'عاجل',
        'high': 'عالي',
        'medium': 'متوسط',
        'low': 'منخفض'
    } : {
        'urgent': 'Urgent',
        'high': 'High',
        'medium': 'Medium',
        'low': 'Low'
    }

    // Department labels mapping
    const departmentLabels: Record<string, string> = isAr ? {
        'content': 'محتوى',
        'photography': 'تصوير'
    } : {
        'content': 'Content',
        'photography': 'Photography'
    }

    // Task type labels mapping
    const taskTypeLabels: Record<string, string> = isAr ? {
        'video': 'فيديو',
        'photo': 'تصوير',
        'editing': 'مونتاج',
        'content': 'محتوى',
        'general': 'عام'
    } : {
        'video': 'Video',
        'photo': 'Photo',
        'editing': 'Editing',
        'content': 'Content',
        'general': 'General'
    }

    const unassignedLabel = isAr ? 'غير معين' : 'Unassigned'

    // Map tasks to CSV rows
    const rows = tasks.map(task => {
        const deptLabel = task.department ? (departmentLabels[task.department] || task.department) : '-'
        const statusLabel = statusLabels[task.status] || task.status
        const priorityLabel = priorityLabels[task.priority] || task.priority
        const taskTypeLabel = task.task_type ? (taskTypeLabels[task.task_type] || task.task_type) : (isAr ? 'عام' : 'General')

        return [
            `"${(task.title || '').replace(/"/g, '""')}"`,
            `"${deptLabel}"`,
            `"${task.project?.name || '-'}"`,
            `"${task.project?.client?.name || '-'}"`,

            `"${task.creator?.name || '-'}"`,
            `"${task.assigned_user?.name || unassignedLabel}"`,
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
    },
    locale: 'ar' | 'en' = 'ar'
): Promise<void> {
    if (!tasks.length) return

    const isAr = locale === 'ar'

    try {
        const { doc, autoTable, fontName, fontStyle, pageWidth } = await createPDFDocument({
            orientation: 'landscape',
            defaultFontStyle: 'normal'
        })
        const pageHeight = doc.internal.pageSize.getHeight()
        doc.setFontSize(18)

        // Title — pushed down below the letterhead header (~35 mm)
        const title = isAr ? 'تقرير المهام الشامل' : 'Comprehensive Tasks Report'
        const textAlign = isAr ? 'right' as const : 'left' as const
        const textX = isAr ? pageWidth - 15 : 15
        doc.text(title, textX, 38, { align: textAlign, lang: isAr ? 'ar' : 'en' })

        // Date and subtitle
        doc.setFontSize(10)
        const dateStr = format(new Date(), 'PPP', { locale: isAr ? ar : enUS })
        const dateLabel = isAr ? `التاريخ: ${dateStr}` : `Date: ${dateStr}`
        doc.text(dateLabel, textX, 46, { align: textAlign, lang: isAr ? 'ar' : 'en' })

        let yPos = 55

        // Add statistics
        if (stats) {
            doc.setFontSize(11)
            const statsLines = isAr ? [
                `إجمالي المهام: ${stats.total}`,
                `قيد التنفيذ: ${stats.in_progress}`,
                `مراجعة: ${stats.review}`,
                `معتمد: ${stats.approved}`
            ] : [
                `Total Tasks: ${stats.total}`,
                `In Progress: ${stats.in_progress}`,
                `Review: ${stats.review}`,
                `Approved: ${stats.approved}`
            ]

            statsLines.forEach((line, i) => {
                doc.text(line, textX, yPos + (i * 6), { align: textAlign, lang: isAr ? 'ar' : 'en' })
            })

            yPos += 28
        }

        // Table Data Preparation
        const statusLabels: Record<string, string> = isAr ? {
            'new': 'جديدة',
            'in_progress': 'قيد التنفيذ',
            'review': 'مراجعة',
            'revision': 'تعديل',
            'approved': 'معتمد',
            'rejected': 'مرفوض',
            'completed': 'مكتمل'
        } : {
            'new': 'New',
            'in_progress': 'In Progress',
            'review': 'Review',
            'revision': 'Revision',
            'approved': 'Approved',
            'rejected': 'Rejected',
            'completed': 'Completed'
        }

        const priorityLabels: Record<string, string> = isAr ? {
            'urgent': 'عاجل',
            'high': 'عالي',
            'medium': 'متوسط',
            'low': 'منخفض'
        } : {
            'urgent': 'Urgent',
            'high': 'High',
            'medium': 'Medium',
            'low': 'Low'
        }

        const headers = isAr
            ? ['التاريخ', 'الحالة', 'الأولوية', 'المصمم', 'التيم ليدر', 'العميل', 'المشروع', 'القسم', 'المهمة']
            : ['Date', 'Status', 'Priority', 'Designer', 'Team Leader', 'Client', 'Project', 'Department', 'Task']

        const tableData = tasks.map(task => {
            const deptLabel = isAr
                ? (task.department === 'content' ? 'محتوى' : task.department === 'photography' ? 'تصوير' : '-')
                : (task.department === 'content' ? 'Content' : task.department === 'photography' ? 'Photography' : '-')
            const statusLabel = statusLabels[task.status] || task.status
            const priorityLabel = priorityLabels[task.priority] || task.priority

            return [
                format(new Date(task.created_at), 'dd/MM/yyyy'),
                statusLabel,
                priorityLabel,
                task.assigned_user?.name || (isAr ? 'غير معين' : 'Unassigned'),
                task.creator?.name || '-',
                task.project?.client?.name || '-',
                task.project?.name || (isAr ? 'بدون مشروع' : 'No Project'),
                deptLabel,
                task.title
            ]
        })

        const tableOptions = {
            head: [headers],
            body: tableData,
            startY: yPos,
            margin: { top: 35, bottom: 28, left: 10, right: 10 },
            styles: {
                font: fontName,
                fontSize: 8,
                cellPadding: 2,
                halign: (isAr ? 'right' : 'left') as 'right' | 'left',
                overflow: 'linebreak' as 'linebreak'
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

        runAutoTable(doc, autoTable, tableOptions)
        await addLetterheadToAllPages(doc, pageWidth, pageHeight, fontName, isAr)

        // Save PDF
        const defaultFilename = `tasks_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`
        doc.save(filename || defaultFilename)

    } catch (error) {
        console.error('Export Tasks PDF Error:', error)
        throw error
    }
}
