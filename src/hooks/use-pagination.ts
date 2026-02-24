import { useState, useMemo, useCallback, useEffect } from 'react'

interface UsePaginationProps {
    totalItems: number
    itemsPerPage?: number
    initialPage?: number
}

interface UsePaginationReturn<T> {
    currentPage: number
    totalPages: number
    itemsPerPage: number
    startIndex: number
    endIndex: number
    goToPage: (page: number) => void
    nextPage: () => void
    prevPage: () => void
    setItemsPerPage: (items: number) => void
    canGoNext: boolean
    canGoPrev: boolean
    paginateItems: (items: T[]) => T[]
}

/**
 * Reusable pagination hook with performance optimizations
 */
export function usePagination<T = any>({
    totalItems,
    itemsPerPage: initialItemsPerPage = 10,
    initialPage = 1
}: UsePaginationProps): UsePaginationReturn<T> {
    const [currentPage, setCurrentPage] = useState(initialPage)
    const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage)

    // Calculate total pages
    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(totalItems / itemsPerPage)),
        [totalItems, itemsPerPage]
    )

    // Calculate indices
    const startIndex = useMemo(
        () => (currentPage - 1) * itemsPerPage,
        [currentPage, itemsPerPage]
    )

    const endIndex = useMemo(
        () => Math.min(startIndex + itemsPerPage, totalItems),
        [startIndex, itemsPerPage, totalItems]
    )

    // Navigation functions
    const goToPage = useCallback((page: number) => {
        const validPage = Math.max(1, Math.min(page, totalPages))
        setCurrentPage(validPage)
    }, [totalPages])

    const nextPage = useCallback(() => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1)
        }
    }, [currentPage, totalPages])

    const prevPage = useCallback(() => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1)
        }
    }, [currentPage])

    const setItemsPerPage = useCallback((items: number) => {
        setItemsPerPageState(items)
        setCurrentPage(1) // Reset to first page when changing items per page
    }, [])

    // Utility to paginate an array
    const paginateItems = useCallback((items: T[]): T[] => {
        const actualEnd = Math.min(startIndex + itemsPerPage, items.length)
        return items.slice(startIndex, actualEnd)
    }, [startIndex, itemsPerPage])

    // Check if can navigate
    const canGoNext = useMemo(() => currentPage < totalPages, [currentPage, totalPages])
    const canGoPrev = useMemo(() => currentPage > 1, [currentPage])

    // Reset to page 1 if current page exceeds total pages
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1)
        }
    }, [currentPage, totalPages])

    return {
        currentPage,
        totalPages,
        itemsPerPage,
        startIndex,
        endIndex,
        goToPage,
        nextPage,
        prevPage,
        setItemsPerPage,
        canGoNext,
        canGoPrev,
        paginateItems
    }
}
