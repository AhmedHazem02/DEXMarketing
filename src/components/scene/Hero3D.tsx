'use client'

/**
 * Hero3D — Cinematic, interactive 3D astronaut hero.
 *
 * Effects:
 *  1. Light Sweep     — PointLight orbits the model every 9 s (white-blue)
 *  2. Floating        — sine-wave levitation ±0.18 units every 5 s
 *  3. Visor Cycle     — glass → silhouette → nebula blaze (fuchsia/blue)
 *                       + slow white→violet→blue reflection during glass phase
 *  4. Entrance        — fade-in + slide-up via framer-motion on mount
 *  5. Mouse Parallax  — counter-mouse translate + toward-mouse rotation
 *  6. Background Glow — CSS radial gradient behind the canvas
 */

import React, { useRef, Suspense, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MODEL_PATH    = '/images/model.glb'
const CYCLE_SECS    = 14    // visor drama cycle duration
const SWEEP_SECS    = 9     // orbit light period
const FLOAT_SECS    = 5     // levitation period
const FLOAT_AMP     = 0.18  // levitation amplitude (Three.js units)

// Stable suit material — never recreated
const suitMaterial = new THREE.MeshStandardMaterial({
  color:     new THREE.Color('#0d0d0d'),
  roughness: 0.85,
  metalness: 0.15,
})

// Colour temporaries — allocated once, mutated per frame
const _nebula   = new THREE.Color('#c026d3')   // fuchsia
const _pink     = new THREE.Color('#ec4899')   // rose
const _blue     = new THREE.Color('#3b82f6')   // blue
const _black    = new THREE.Color('#000000')
const _white    = new THREE.Color('#ffffff')
const _violet   = new THREE.Color('#7c3aed')
const _mixedCol = new THREE.Color()
const _refCol   = new THREE.Color()

/** Cubic smoothstep – smooth ease-in-out mapping [0,1]→[0,1] */
const ss = (x: number) => Math.max(0, Math.min(1, x * x * (3 - 2 * x)))

// ─────────────────────────────────────────────────────────────────────────────
// 1 · SweepLight — orbiting white-blue PointLight (light-sweep effect)
// ─────────────────────────────────────────────────────────────────────────────

function SweepLight() {
  const ref = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const angle = (clock.elapsedTime / SWEEP_SECS) * Math.PI * 2
    // Orbit in XZ plane, height 1.5 units above model centre
    ref.current.position.set(
      Math.sin(angle) * 4.2,
      1.5,
      Math.cos(angle) * 4.2,
    )
    // Intensity breathes slightly to mimic moving specular highlight
    ref.current.intensity = 55 + Math.sin(clock.elapsedTime * 0.7) * 12
  })

  return (
    <pointLight
      ref={ref}
      color="#b8d4ff"   // soft white-blue
      intensity={55}
      distance={13}
      decay={2}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2+3+5 · AstronautModel
//   • Float: outerRef.position.y animated with sine wave
//   • Visor:  per-frame material drama cycle + glass-phase reflection colours
//   • Parallax: outerRef.position.x/z offset counter-mouse
//              innerRef.rotation toward mouse
// ─────────────────────────────────────────────────────────────────────────────

function AstronautModel() {
  const outerRef   = useRef<THREE.Group>(null)   // float + parallax translate
  const innerRef   = useRef<THREE.Group>(null)   // mouse rotation
  const visorRef   = useRef<THREE.MeshPhysicalMaterial | null>(null)
  const ambientRef = useRef<THREE.AmbientLight>(null)

  const targetRotX = useRef(0)
  const targetRotY = useRef(0)

  const { scene } = useGLTF(MODEL_PATH)

  // Build visor material & assign all mesh materials once
  useEffect(() => {
    const visorMat = new THREE.MeshPhysicalMaterial({
      color:              new THREE.Color('#000000'),
      roughness:          0,
      metalness:          1,
      clearcoat:          1,
      clearcoatRoughness: 0,
      envMapIntensity:    2.0,
      emissive:           new THREE.Color('#000000'),
      emissiveIntensity:  0,
    })
    visorRef.current = visorMat

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.material = child.name === 'Visor' ? visorMat : suitMaterial
    })
  }, [scene])

  useFrame(({ pointer, clock }) => {
    const elapsed = clock.elapsedTime
    const t       = (elapsed % CYCLE_SECS) / CYCLE_SECS

    // ── Visor drama cycle ─────────────────────────────────────────────────
    // Phase:  0–0.45 = glass   |  0.45–0.65 = transition  |
    //         0.65–0.90 = blaze |  0.90–1.00 = fade out
    let glow = 0
    if      (t < 0.45) glow = 0
    else if (t < 0.65) glow = ss((t - 0.45) / 0.20)
    else if (t < 0.90) glow = 1
    else               glow = ss(1 - (t - 0.90) / 0.10)

    if (visorRef.current) {
      const mat = visorRef.current

      if (glow < 0.05) {
        // ── Glass phase: slow colour shift white → violet → blue ──────────
        // Cycle period = 8s, independent of the drama cycle
        const rt = (elapsed % 8) / 8     // 0→1 every 8 s
        if      (rt < 0.33) _refCol.lerpColors(_white,  _violet, ss(rt / 0.33))
        else if (rt < 0.66) _refCol.lerpColors(_violet, _blue,   ss((rt - 0.33) / 0.33))
        else                _refCol.lerpColors(_blue,   _white,  ss((rt - 0.66) / 0.34))

        mat.emissive.copy(_refCol)
        mat.emissiveIntensity = 0.22   // subtle, not overpowering
        mat.envMapIntensity   = 2.0
      } else {
        // ── Nebula blaze phase ────────────────────────────────────────────
        const blend = 0.5 + Math.sin(elapsed * 0.9) * 0.5
        _mixedCol.lerpColors(_nebula, _pink, blend)
        mat.emissive.lerpColors(_black, _mixedCol, glow)

        const flicker = glow * (0.85 + Math.sin(elapsed * 3.8) * 0.15)
        mat.emissiveIntensity = flicker * 2.6
        mat.envMapIntensity   = THREE.MathUtils.lerp(2.0, 0.05, glow)
      }
    }

    // ── Ambient dims to silhouette during blaze ───────────────────────────
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(0.10, 0.0, glow)
    }

    // ── Mouse rotation (inner group, max ±8°) ────────────────────────────
    if (innerRef.current) {
      targetRotY.current = pointer.x * 0.14   // ~8° max
      targetRotX.current = -pointer.y * 0.12

      innerRef.current.rotation.y = THREE.MathUtils.lerp(
        innerRef.current.rotation.y, targetRotY.current, 0.05,
      )
      innerRef.current.rotation.x = THREE.MathUtils.lerp(
        innerRef.current.rotation.x, targetRotX.current, 0.05,
      )
    }

    // ── Float + Parallax (outer group) ───────────────────────────────────
    if (outerRef.current) {
      // Floating: ±FLOAT_AMP sine wave, period FLOAT_SECS
      const floatY = Math.sin((elapsed / FLOAT_SECS) * Math.PI * 2) * FLOAT_AMP

      outerRef.current.position.x = THREE.MathUtils.lerp(
        outerRef.current.position.x, -pointer.x * 0.22, 0.04,
      )
      // Combine float + parallax Y in one lerp target
      outerRef.current.position.y = THREE.MathUtils.lerp(
        outerRef.current.position.y, floatY + (-pointer.y * 0.18), 0.04,
      )
    }
  })

  return (
    <>
      {/* Ambient — silhouettes during nebula phase */}
      <ambientLight ref={ambientRef} intensity={0.10} color="#ffffff" />

      {/* Nebula accent point — blazes with visor */}
      <NebulaLight />

      <group ref={outerRef}>
        <group ref={innerRef}>
          <primitive object={scene} scale={2.1} position={[0, -5.0, 0]} />
        </group>
      </group>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NebulaLight — purple PointLight in front of helmet, fires with visor glow
// ─────────────────────────────────────────────────────────────────────────────

function NebulaLight() {
  const ref = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t    = (clock.elapsedTime % CYCLE_SECS) / CYCLE_SECS
    let   glow = 0
    if      (t < 0.45) glow = 0
    else if (t < 0.65) glow = ss((t - 0.45) / 0.20)
    else if (t < 0.90) glow = 1
    else               glow = ss(1 - (t - 0.90) / 0.10)

    ref.current.intensity = glow * (0.85 + Math.sin(clock.elapsedTime * 3.8) * 0.15) * 28
  })

  return (
    <pointLight
      ref={ref}
      color="#c026d3"
      intensity={0}
      distance={5}
      decay={2}
      position={[0, 1.0, 1.2]}
    />
  )
}

useGLTF.preload(MODEL_PATH)

// ─────────────────────────────────────────────────────────────────────────────
// Scene — composes everything inside the Canvas context
// ─────────────────────────────────────────────────────────────────────────────

function Scene() {
  return (
    <Suspense fallback={null}>
      {/* City HDR: subtle PBR reflections on visor glass */}
      <Environment preset="city" environmentIntensity={0.22} background={false} />

      {/* Mouse flashlight */}
      <MouseLight />

      {/* Orbiting sweep light */}
      <SweepLight />

      <AstronautModel />
    </Suspense>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MouseLight — flashlight that trails the cursor
// ─────────────────────────────────────────────────────────────────────────────

function MouseLight() {
  const lightRef   = useRef<THREE.PointLight>(null)
  const targetPos  = useRef(new THREE.Vector3(0, 0, 3))
  const currentPos = useRef(new THREE.Vector3(0, 0, 3))

  useFrame(({ pointer, camera, size }) => {
    if (!lightRef.current) return
    const fov   = (camera as THREE.PerspectiveCamera).fov
    const depth = 3
    const halfH = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * depth
    const halfW = halfH * (size.width / size.height)
    targetPos.current.set(pointer.x * halfW, pointer.y * halfH, depth)
    currentPos.current.lerp(targetPos.current, 0.06)
    lightRef.current.position.copy(currentPos.current)
  })

  return <pointLight ref={lightRef} color="#ffffff" intensity={85} distance={14} decay={2} />
}

// ─────────────────────────────────────────────────────────────────────────────
// 4 · Hero3D — entrance animation + background glow wrapper
// ─────────────────────────────────────────────────────────────────────────────

export default function Hero3D() {
  return (
    /**
     * motion.div  → entrance: fade-in + slide-up over 1.8 s
     * Outer div provides the black base that prevents white flash.
     * The pseudo-element glow is a CSS radial gradient behind the canvas.
     */
    <motion.div
      className="relative w-full h-full bg-black overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* 6 · Background glow — rim light illusion from behind */}
      <div
        aria-hidden="true"
        style={{
          position:   'absolute',
          inset:      0,
          background: 'radial-gradient(ellipse 55% 60% at 50% 40%, rgba(200,220,255,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex:     1,
        }}
      />

      {/* Subtle nebula pulse behind — syncs visually with visor cycle via CSS */}
      <div
        aria-hidden="true"
        style={{
          position:  'absolute',
          inset:     0,
          background:'radial-gradient(ellipse 40% 45% at 50% 35%, rgba(192,38,211,0.0) 0%, transparent 65%)',
          animation: 'nebulaPulse 14s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex:    1,
        }}
      />

      {/* Keyframe injection */}
      <style>{`
        @keyframes nebulaPulse {
          0%,   44%  { opacity: 0; }
          50%         { opacity: 1; background: radial-gradient(ellipse 42% 48% at 50% 36%, rgba(192,38,211,0.18) 0%, transparent 65%); }
          65%,  82%  { opacity: 1; background: radial-gradient(ellipse 42% 48% at 50% 36%, rgba(236,72,153,0.15) 0%, transparent 65%); }
          92%,  100% { opacity: 0; }
        }
      `}</style>

      {/* 3-D Canvas */}
      <Canvas
        camera={{ position: [0, -0.2, 9], fov: 45, near: 0.1, far: 100 }}
        gl={{
          antialias:           true,
          alpha:               false,
          toneMapping:         THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        dpr={[1, 2]}
        style={{ position: 'relative', zIndex: 2, background: '#000000' }}
      >
        <Scene />
      </Canvas>
    </motion.div>
  )
}

