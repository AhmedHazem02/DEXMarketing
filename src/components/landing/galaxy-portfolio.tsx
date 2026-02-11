'use client'

import { motion } from 'framer-motion'
import { Rocket, Star, Code, Layout, Globe, Smartphone } from 'lucide-react'

const projects = [
    {
        id: 1,
        title: 'E-Commerce Platform',
        category: 'Web App',
        icon: Globe,
        color: 'from-purple-500 to-pink-500',
        size: 'large'
    },
    {
        id: 2,
        title: 'Agency Dashboard',
        category: 'Admin Panel',
        icon: Layout,
        color: 'from-cyan-500 to-blue-500',
        size: 'medium'
    },
    {
        id: 3,
        title: 'Mobile Banking',
        category: 'Mobile App',
        icon: Smartphone,
        color: 'from-amber-400 to-orange-500',
        size: 'medium'
    },
    {
        id: 4,
        title: 'API Gateway',
        category: 'Backend',
        icon: Code,
        color: 'from-emerald-400 to-teal-500',
        size: 'small'
    },
]

export function GalaxyPortfolio() {
    return (
        <section className="min-h-screen bg-[#060F1E] py-20 px-4 overflow-hidden relative">
            <h2 className="text-5xl font-bold text-center mb-16 text-white drop-shadow-[0_0_10px_rgba(252,211,77,0.8)]">
                Mission Log
            </h2>

            <div className="max-w-6xl mx-auto relative h-[800px] flex items-center justify-center">
                {/* Orbital paths (SVG) */}
                <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
                    <circle cx="50%" cy="50%" r="200" fill="none" stroke="url(#gradient)" strokeWidth="1" className="animate-[spin_60s_linear_infinite]" />
                    <circle cx="50%" cy="50%" r="350" fill="none" stroke="url(#gradient)" strokeWidth="1" className="animate-[spin_80s_linear_infinite_reverse]" />
                    <defs>
                        <linearGradient id="gradient">
                            <stop offset="0%" stopColor="#FBBF24" />
                            <stop offset="100%" stopColor="#22D3EE" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Central Star */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-r from-amber-400 to-orange-600 blur-xl opacity-50 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Rocket className="w-16 h-16 text-white text-opacity-80" />
                    </div>
                </div>

                {/* Project "planets" */}
                <div className="absolute inset-0 w-full h-full">
                    {/* We manually position them in orbits for this demo, or use logic */}
                    {projects.map((project, index) => {
                        // Calculate orbit position
                        const orbitRadius = index === 0 ? 0 : (index % 2 === 0 ? 350 : 200)
                        const angle = (index * (360 / projects.length)) * (Math.PI / 180)

                        // Initial static position for SSR, we'd want to animate this in a real circular path
                        // For now, simpler grid or absolute positioning

                        // Let's stick to the grid layout from the plan for robustness on mobile
                        // but keep the galaxy styling
                        return null
                    })}
                </div>

                {/* Fallback Grid Layout for Usability */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10 w-full">
                    {projects.map((project, index) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, type: 'spring' }}
                            whileHover={{ scale: 1.05, rotate: 2 }}
                            className={`
                relative aspect-video lg:aspect-square rounded-2xl bg-gradient-to-br ${project.color}
                cursor-pointer overflow-hidden group border border-white/10
                flex flex-col items-center justify-center p-6 text-center
                backdrop-blur-sm bg-opacity-20
                ${project.size === 'large' ? 'lg:col-span-2 lg:row-span-2' : ''}
              `}
                            style={{
                                boxShadow: `0 0 30px -10px var(--tw-gradient-to)`
                            }}
                        >
                            {/* Content */}
                            <div className="relative z-10 text-white transform transition-transform duration-500 group-hover:-translate-y-2">
                                <project.icon className="w-12 h-12 mx-auto mb-4 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                <h3 className="text-2xl font-bold mb-2 text-shadow-sm">
                                    {project.title}
                                </h3>
                                <p className="text-white/80 font-medium">{project.category}</p>
                            </div>

                            {/* Atmosphere/Hover effect */}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
                            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-45 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700 pointer-events-none" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
