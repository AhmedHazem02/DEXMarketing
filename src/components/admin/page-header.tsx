import { ReactNode } from 'react'

interface PageHeaderProps {
    title: string
    description: string
    actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                <p className="text-muted-foreground mt-1">{description}</p>
            </div>
            {actions && <div>{actions}</div>}
        </div>
    )
}
