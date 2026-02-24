import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-2">
            <h2 className="text-2xl font-bold mb-2">404</h2>
            <p className="mb-1">Could not find requested resource</p>
            <p className="mb-4 text-muted-foreground" dir="rtl">لم يتم العثور على المورد المطلوب</p>
            <div className="flex gap-4">
                <Link href="/" className="text-primary hover:underline">
                    Return Home
                </Link>
                <Link href="/" className="text-primary hover:underline" dir="rtl">
                    العودة للرئيسية
                </Link>
            </div>
        </div>
    )
}
