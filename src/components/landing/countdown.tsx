'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TimeLeft {
    days: number
    hours: number
    minutes: number
    seconds: number
}

export function Countdown({ targetDate }: { targetDate?: Date }) {
    // Default target: 14 days from now if not provided
    const [target] = useState<Date>(() => {
        if (targetDate) return targetDate
        const date = new Date()
        date.setDate(date.getDate() + 14) // 2 weeks default
        return date
    })

    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +target - +new Date()

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                })
            }
        }

        const timer = setInterval(calculateTimeLeft, 1000)
        calculateTimeLeft() // Initial run

        return () => clearInterval(timer)
    }, [target])


    const TimeUnit = ({ value, label }: { value: number, label: string }) => (
        <div className="flex flex-col items-center gap-2">
            <div className="relative overflow-hidden rounded-lg bg-white/5 backdrop-blur-md border border-white/10 p-3 sm:p-4 min-w-[70px] sm:min-w-[90px]">
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none" />

                <span className="block text-center text-3xl sm:text-4xl font-bold text-[#F2CB05] tabular-nums tracking-wider drop-shadow-lg font-mono">
                    {String(value).padStart(2, '0')}
                </span>
            </div>
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em] text-white/40">
                {label}
            </span>
        </div>
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap gap-4 sm:gap-6 mt-10 justify-start"
        >
            <TimeUnit value={timeLeft.days} label="Days" />
            <TimeUnit value={timeLeft.hours} label="Hours" />
            <TimeUnit value={timeLeft.minutes} label="Minutes" />
            <TimeUnit value={timeLeft.seconds} label="Seconds" />
        </motion.div>
    )
}
