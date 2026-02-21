'use client'

import { motion } from 'framer-motion'
import { useLocale } from 'next-intl'
import { Target, Eye, Sparkles } from 'lucide-react'
import { GlowOrb, OrbitalRing, FloatingHexagon, DotGrid, GradientRing } from './floating-elements'
import GlareHover from '../ui/GlareHover'

export function AboutSection() {
  const locale = useLocale()
  const isAr = locale === 'ar'

  return (
    <section className="relative py-28 bg-[#022026] overflow-hidden" id="about">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* ── Floating decorative elements ── */}
      <GlowOrb color="#F2CB05" size={350} blur={120} opacity={0.03} className="top-20 -start-40" />
      <GlowOrb color="#22D3EE" size={250} blur={100} opacity={0.02} className="bottom-20 -end-32" />
      <FloatingHexagon className="top-32 end-20 w-16 h-16" delay={1} />
      <FloatingHexagon className="bottom-40 start-16 w-10 h-10" delay={3} duration={12} />
      <DotGrid rows={5} cols={5} gap={28} className="top-20 end-12 hidden lg:grid" />

      {/* Grid pattern background */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="container relative z-10 mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="section-label mb-6 inline-flex">
            {isAr ? '02 — تعرف علينا' : '02 — Get to Know Us'}
          </span>
          <h2 className="mt-6 text-4xl sm:text-5xl font-black text-white leading-tight font-serif text-glow-white">
            {isAr ? 'من نحن' : 'About DEX'}
          </h2>
          <div className="mt-5 mx-auto w-20 h-[2px] bg-gradient-to-r from-transparent via-[#F2CB05]/60 to-transparent rounded-full" />
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Text Side */}
          <motion.div
            initial={{ opacity: 0, x: isAr ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#F2CB05]/20 bg-[#F2CB05]/5 text-[#F2CB05] text-xs font-mono backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {isAr ? 'قصتنا' : 'Our Story'}
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
              {isAr
                ? 'نحوّل الأفكار إلى تجارب رقمية لا تُنسى'
                : 'We turn ideas into unforgettable digital experiences'}
            </h3>

            <p className="text-white/40 leading-relaxed text-base">
              {isAr
                ? 'بدأت رحلة DEX بشغف حقيقي للتسويق الإبداعي. من فريق صغير بأحلام كبيرة، نمونا لنصبح شريك رقمي متكامل لأكتر من 150 عميل. نؤمن إن كل براند ليه قصة تستحق تتحكي بأفضل صورة.'
                : 'DEX started with a genuine passion for creative marketing. From a small team with big dreams, we grew to become a full-service digital partner for 150+ clients. We believe every brand has a story worth telling in the best possible way.'}
            </p>

            <p className="text-white/40 leading-relaxed text-base">
              {isAr
                ? 'فريقنا من المصممين والمطورين والمسوقين بيشتغلوا كعائلة واحدة عشان يوصلوا لأفضل نتيجة. مش بنقدم خدمات بس — بنبني شراكات حقيقية.'
                : 'Our team of designers, developers, and marketers work as one family to achieve the best results. We don\'t just offer services — we build genuine partnerships.'}
            </p>
          </motion.div>

          {/* Visual Side */}
          <motion.div
            initial={{ opacity: 0, x: isAr ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Gradient ring */}
              <GradientRing size={350} className="-top-4 -start-4" />

              {/* Background rings */}
              <div className="absolute inset-8 rounded-full border border-[#F2CB05]/10" />
              <div className="absolute inset-16 rounded-full border border-[#F2CB05]/5" />

              {/* Orbital ring */}
              <OrbitalRing size={320} duration={25} className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

              {/* Central circle — glass effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full glass flex items-center justify-center">
                  <span className="text-5xl font-black text-[#F2CB05]/40 font-mono select-none drop-shadow-[0_0_20px_rgba(242,203,5,0.15)]">
                    DEX
                  </span>
                </div>
              </div>

              {/* Floating orbit dots with glow */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-4 end-12 w-3 h-3 rounded-full bg-[#F2CB05]/40"
                style={{ boxShadow: '0 0 12px rgba(242, 203, 5, 0.4)' }}
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute bottom-12 start-4 w-2 h-2 rounded-full bg-[#22D3EE]/50"
                style={{ boxShadow: '0 0 10px rgba(34, 211, 238, 0.4)' }}
              />
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                className="absolute top-1/3 start-0 w-2.5 h-2.5 rounded-full bg-[#A855F7]/50"
                style={{ boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)' }}
              />
            </div>
          </motion.div>
        </div>

        {/* Mission & Vision Cards — GLASS */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="group relative rounded-2xl glass glass-hover transition-all duration-500 overflow-hidden"
          >
            <GlareHover
              glareColor="#ffffff"
              glareOpacity={0.15}
              glareAngle={-45}
              glareSize={250}
              className="p-8"
            >
              {/* Subtle corner glow */}
              <div className="absolute -top-10 -end-10 w-32 h-32 bg-[#22D3EE]/[0.06] blur-[60px] rounded-full group-hover:bg-[#22D3EE]/[0.1] transition-all duration-700" />

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-[#22D3EE]/10 flex items-center justify-center text-[#22D3EE] mb-5 ring-1 ring-[#22D3EE]/10">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {isAr ? 'مهمتنا' : 'Our Mission'}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {isAr
                    ? 'نسعى لتقديم حلول تسويقية وتقنية مبتكرة تساعد عملاءنا على النمو والتميز في السوق الرقمي المتغير باستمرار.'
                    : 'We strive to deliver innovative marketing and tech solutions that help our clients grow and stand out in the ever-changing digital landscape.'}
                </p>
              </div>
            </GlareHover>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group relative rounded-2xl glass glass-hover transition-all duration-500 overflow-hidden"
          >
            <GlareHover
              glareColor="#ffffff"
              glareOpacity={0.15}
              glareAngle={-45}
              glareSize={250}
              className="p-8"
            >
              {/* Subtle corner glow */}
              <div className="absolute -top-10 -end-10 w-32 h-32 bg-[#A855F7]/[0.06] blur-[60px] rounded-full group-hover:bg-[#A855F7]/[0.1] transition-all duration-700" />

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-[#A855F7]/10 flex items-center justify-center text-[#A855F7] mb-5 ring-1 ring-[#A855F7]/10">
                  <Eye className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {isAr ? 'رؤيتنا' : 'Our Vision'}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {isAr
                    ? 'أن نكون الشريك الرقمي الأول لكل براند يطمح للتميز والريادة في المنطقة العربية وخارجها.'
                    : 'To be the #1 digital partner for every brand that aspires to excellence and leadership in the Arab region and beyond.'}
                </p>
              </div>
            </GlareHover>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
