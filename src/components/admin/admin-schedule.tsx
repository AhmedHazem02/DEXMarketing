'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Calendar as CalendarIcon, Filter, Users, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ScheduleCalendar } from '@/components/schedule'
import { useUsers } from '@/hooks/use-users'
import type { Department } from '@/types/database'

export function AdminScheduleView() {
    const t = useTranslations('adminSchedule')
    
    const [selectedTeamLeader, setSelectedTeamLeader] = useState<string>('all')
    const [selectedDepartment, setSelectedDepartment] = useState<Department | 'all'>('all')

    // Get all team leaders (memoized filter)
    // Content dept leader = account_manager, Photography dept leader = team_leader
    const { data: users } = useUsers()
    const teamLeaders = useMemo(() => 
        users?.filter(u => u.role === 'team_leader' || u.role === 'account_manager') || [], 
        [users]
    )

    // Filter team leaders by department if selected
    const filteredTeamLeaders = useMemo(() => 
        selectedDepartment && selectedDepartment !== 'all'
            ? teamLeaders.filter(tl => tl.department === selectedDepartment)
            : teamLeaders,
        [selectedDepartment, teamLeaders]
    )

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <CalendarIcon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    <h1 className="text-2xl sm:text-3xl font-bold">
                        {t('title')}
                    </h1>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        {t('filters')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Department Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t('department')}
                            </label>
                            <Select
                                value={selectedDepartment}
                                onValueChange={(v) => {
                                    setSelectedDepartment(v as Department | 'all')
                                    setSelectedTeamLeader('all') // Reset TL when department changes
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('allDepartments')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('allDepartments')}</SelectItem>
                                    <SelectItem value="photography">{t('photography')}</SelectItem>
                                    <SelectItem value="content">{t('content')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Team Leader Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {t('teamLeader')}
                            </label>
                            <Select
                                value={selectedTeamLeader}
                                onValueChange={setSelectedTeamLeader}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('allLeaders')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('allLeaders')}</SelectItem>
                                    {filteredTeamLeaders.map(tl => (
                                        <SelectItem key={tl.id} value={tl.id}>
                                            {tl.name} {tl.department && `(${tl.department === 'photography' ? t('deptPhotography') : tl.department === 'content' ? t('deptContent') : tl.department})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {(selectedTeamLeader !== 'all' || selectedDepartment !== 'all') && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSelectedTeamLeader('all')
                                setSelectedDepartment('all')
                            }}
                            className="mt-4"
                        >
                            <RotateCcw className="h-3.5 w-3.5 me-1.5" />
                            {t('resetFilters')}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Calendar View */}
            {selectedTeamLeader && selectedTeamLeader !== 'all' ? (
                <ScheduleCalendar teamLeaderId={selectedTeamLeader} canCreate={false} />
            ) : (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                            <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm sm:text-base">
                                {t('selectTeamLeader')}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
