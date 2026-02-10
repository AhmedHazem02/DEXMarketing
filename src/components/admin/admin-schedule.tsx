'use client'

import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
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
    const locale = useLocale()
    const isAr = locale === 'ar'
    
    const [selectedTeamLeader, setSelectedTeamLeader] = useState<string>('all')
    const [selectedDepartment, setSelectedDepartment] = useState<Department | 'all'>('all')

    // Get all team leaders (memoized filter)
    const { data: users } = useUsers()
    const teamLeaders = useMemo(() => 
        users?.filter(u => u.role === 'team_leader') || [], 
        [users]
    )

    // Filter team leaders by department if selected
    const filteredTeamLeaders = selectedDepartment && selectedDepartment !== 'all'
        ? teamLeaders.filter(tl => tl.department === selectedDepartment)
        : teamLeaders

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <CalendarIcon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    <h1 className="text-2xl sm:text-3xl font-bold">
                        {isAr ? 'جميع الجداول' : 'All Schedules'}
                    </h1>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        {isAr ? 'الفلاتر' : 'Filters'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Department Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {isAr ? 'القسم' : 'Department'}
                            </label>
                            <Select
                                value={selectedDepartment}
                                onValueChange={(v) => {
                                    setSelectedDepartment(v as Department | 'all')
                                    setSelectedTeamLeader('all') // Reset TL when department changes
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isAr ? 'كل الأقسام' : 'All Departments'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isAr ? 'كل الأقسام' : 'All Departments'}</SelectItem>
                                    <SelectItem value="photography">{isAr ? 'التصوير' : 'Photography'}</SelectItem>
                                    <SelectItem value="content">{isAr ? 'المحتوى' : 'Content'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Team Leader Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {isAr ? 'قائد الفريق' : 'Team Leader'}
                            </label>
                            <Select
                                value={selectedTeamLeader}
                                onValueChange={setSelectedTeamLeader}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isAr ? 'كل القادة' : 'All Team Leaders'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isAr ? 'كل القادة' : 'All Team Leaders'}</SelectItem>
                                    {filteredTeamLeaders.map(tl => (
                                        <SelectItem key={tl.id} value={tl.id}>
                                            {tl.name} {tl.department && `(${isAr && tl.department === 'photography' ? 'تصوير' : isAr && tl.department === 'content' ? 'محتوى' : tl.department})`}
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
                            {isAr ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Calendar View */}
            {selectedTeamLeader && selectedTeamLeader !== 'all' ? (
                <ScheduleCalendar teamLeaderId={selectedTeamLeader} />
            ) : (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                            <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm sm:text-base">
                                {isAr
                                    ? 'اختر قائد فريق لعرض جدوله'
                                    : 'Select a team leader to view their schedule'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
