'use client'

import { motion } from 'framer-motion'

export function CosmicGraphic() {
    return (
        <div className="relative w-[500px] h-[500px] flex items-center justify-center">
            {/* 1. Core Glow (The Energy Source) */}
            <motion.div
                className="absolute w-64 h-64 rounded-full blur-[80px]"
                style={{
                    background: 'radial-gradient(circle, rgba(255,215,0,0.5) 0%, rgba(249,115,22,0.2) 100%)',
                }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.8, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* 2. Main Planet/Sphere */}
            <div className="relative z-10 w-48 h-48 rounded-full shadow-2xl overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 50%, #ea580c 100%)',
                    boxShadow: 'inset -20px -20px 40px rgba(0,0,0,0.5), 0 0 50px rgba(255,215,0,0.3)',
                }}
            >
                {/* Surface Shine Reflection */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-80 rounded-full" />
            </div>

            {/* 3. Orbital Rings (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 500">
                {/* Ring 1 - Cyan Horizontal (Flat) */}
                <motion.ellipse
                    cx="250" cy="250" rx="180" ry="40"
                    fill="none" stroke="#00D4FF" strokeWidth="2" strokeOpacity="0.5"
                    animate={{ rotateX: [0, 5, 0], rotateY: [0, 5, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transformOrigin: "center" }}
                />

                {/* Ring 2 - Golden Tilted */}
                <motion.ellipse
                    cx="250" cy="250" rx="200" ry="60"
                    fill="none" stroke="#FFD700" strokeWidth="1.5" strokeDasharray="20 10"
                    animate={{ rotate: [30, 390] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: "center" }}
                />

                {/* Ring 3 - Vertical Orbit */}
                <motion.ellipse
                    cx="250" cy="250" rx="60" ry="220"
                    fill="none" stroke="#F97316" strokeWidth="1" strokeOpacity="0.4"
                    animate={{ rotate: [120, 480] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: "center" }}
                />

                {/* Orbiting Particle 1 */}
                <motion.circle r="6" fill="#00D4FF">
                    <animateMotion dur="8s" repeatCount="indefinite" path="M250,250 m-180,0 a180,40 0 1,0 360,0 a180,40 0 1,0 -360,0" />
                </motion.circle>
            </svg>

            {/* 4. Floating Elements around */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-8 h-8 border border-white/10 rounded-full backdrop-blur-md flex items-center justify-center bg-white/5"
                    style={{
                        left: `${50 + Math.cos(i) * 40}%`,
                        top: `${50 + Math.sin(i * 1.5) * 35}%`,
                    }}
                    animate={{
                        y: [0, -15, 0],
                        opacity: [0.3, 0.7, 0.3],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 3 + i,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "easeInOut"
                    }}
                >
                    <div className="w-2 h-2 rounded-full bg-cyan-400/50" />
                </motion.div>
            ))}
        </div>
    )
}
