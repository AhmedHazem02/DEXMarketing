'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useLocale } from 'next-intl'
import { Users, FolderKanban, Calendar, UserCheck } from 'lucide-react'
import { GlowOrb, OrbitalRing } from './floating-elements'

interface Stat {
  icon: typeof Users
  value: number
  suffix: string
  labelEn: string
  labelAr: string
  color: string
}

const STATS: Stat[] = [
  { icon: Users, value: 150, suffix: '+', labelEn: 'Happy Clients', labelAr: 'عميل سعيد', color: '#F2CB05' },
  { icon: FolderKanban, value: 500, suffix: '+', labelEn: 'Projects Done', labelAr: 'مشروع مكتمل', color: '#22D3EE' },
  { icon: Calendar, value: 5, suffix: '+', labelEn: 'Years Experience', labelAr: 'سنوات خبرة', color: '#A855F7' },
  { icon: UserCheck, value: 30, suffix: '+', labelEn: 'Team Members', labelAr: 'عضو فريق', color: '#10B981' },
]

function useCountUp(end: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return

    let startTime: number | null = null
    let rafId: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * end))

      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      }
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [end, duration, start])

  return count
}

function StatCard({ stat, index, isVisible }: { stat: Stat; index: number; isVisible: boolean }) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const count = useCountUp(stat.value, 2000, isVisible)
  const Icon = stat.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative group"
    >
      {/* Glass card */}
      <div className="glass glass-hover rounded-2xl p-8 text-center transition-all duration-500 overflow-hidden">
        {/* Corner glow */}
        <div
          className="absolute -top-8 -end-8 w-24 h-24 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{ backgroundColor: `${stat.color}15` }}
        />

        <div
          className="relative z-10 w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center transition-all duration-300 group-hover:scale-110 ring-1"
          style={{
            backgroundColor: `${stat.color}10`,
            color: stat.color,
            // @ts-expect-error - CSS custom prop
            '--tw-ring-color': `${stat.color}12`,
          }}
        >
          <Icon className="h-7 w-7" />
        </div>

        <div
          className="relative z-10 text-4xl sm:text-5xl font-black font-mono mb-2"
          style={{
            color: stat.color,
            textShadow: `0 0 30px ${stat.color}25`,
          }}
        >
          {count}{stat.suffix}
        </div>

        <p className="relative z-10 text-sm text-white/40 font-medium">
          {isAr ? stat.labelAr : stat.labelEn}
        </p>
      </div>
    </motion.div>
  )
}

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting) {
      setIsVisible(true)
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.3,
    })

    const el = ref.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, [handleIntersection])

  return (
    <section className="relative py-24 overflow-hidden" id="stats" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#022026] via-[#02282e] to-[#022026]" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#F2CB05]/15 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* ── Floating decorative elements ── */}
      <GlowOrb color="#F2CB05" size={400} blur={140} opacity={0.03} className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <OrbitalRing size={500} borderColor="rgba(242, 203, 5, 0.04)" dotColor="#F2CB05" duration={30} className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:block" />

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="container relative z-10 mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <StatCard key={stat.labelEn} stat={stat} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  )
}
