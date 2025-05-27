"use client"

import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface ChasingParticle {
  id: number
  size: number
  color: string
  opacity: number
  startDelay: number
  chaseOffset: number
  pathVariation: number
}

const MagicalScrollAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  
  // Predetermined path for the big particle (complex spiral-like movement to center)
  const getBigParticlePosition = (progress: number) => {
    // Base path: starts from top-left, makes a wide curve, then spirals to center
    let baseX, baseY
    
    if (progress < 0.3) {
      // Stage 1: Wide arc from top-left to top-right
      const t = progress / 0.3
      baseX = 15 + (70 * t) // 15% to 85%
      baseY = 20 - (10 * Math.sin(t * Math.PI)) // Slight dip down then up
    }

    else if (progress < 0.7) { 
      // Stage 2: Curved descent from top-right to bottom-center
      const t = (progress - 0.3) / 0.4
      baseX = 85 - ( t) // 85% to 50%
      baseY = 20 + (60 * t * t) // Accelerating downward curve
    } else {
      // Stage 3: Spiral approach to center
      const t = (progress - 0.7) / 0.3
      
      // Use exact stage 2 ending values for continuity
      const stage2EndX = 50 // 85 - (35 * 1)
      const stage2EndY = 80 // 20 + (60 * 1 * 1)
      
      // Target center position
      const targetX = 50
      const targetY = 50
      
      // Spiral parameters
      const spiralRadius = 35 * (1 - t) // Shrinking spiral
      const spiralAngle = t * Math.PI * 3 // Spiral rotations
      
      // Smooth interpolation from stage 2 end to center
      const centerX = stage2EndX + (targetX - stage2EndX) * t
      const centerY = stage2EndY + (targetY - stage2EndY) * t
      
      // Add spiral motion around the interpolated center
      baseX = centerX + Math.cos(spiralAngle) * spiralRadius
      baseY = centerY + Math.sin(spiralAngle) * spiralRadius * 0.6
    }
    
    // Add complex wave patterns for more dynamic movement
    const primaryWave = Math.sin(progress * Math.PI * 3.5) * 8 * (1 - progress * 0.7)
    const secondaryWave = Math.cos(progress * Math.PI * 5.2) * 4 * (1 - progress * 0.8)
    const tertiaryWave = Math.sin(progress * Math.PI * 7.1) * 2 * (1 - progress)
    
    // Combine waves for X movement
    const waveX = primaryWave + (secondaryWave * 0.6) + (tertiaryWave * 0.3)
    
    // Different wave pattern for Y movement
    const waveY = Math.cos(progress * Math.PI * 4.2) * 6 * (1 - progress * 0.6) +
                  Math.sin(progress * Math.PI * 6.8) * 3 * (1 - progress * 0.9)
    
    // Add some figure-8 motion in the middle section
    if (progress > 0.2 && progress < 0.8) {
      const figureEightT = (progress - 0.2) / 0.6
      const figureEightIntensity = 8 * Math.sin(figureEightT * Math.PI) // Peak in middle
      
      const figureEightX = Math.sin(figureEightT * Math.PI * 2) * figureEightIntensity
      const figureEightY = Math.sin(figureEightT * Math.PI * 4) * figureEightIntensity * 0.5
      
      return {
        x: Math.max(5, Math.min(95, baseX + waveX + figureEightX)),
        y: Math.max(5, Math.min(95, baseY + waveY + figureEightY))
      }
    }
    
    return {
      x: Math.max(5, Math.min(95, baseX + waveX)),
      y: Math.max(5, Math.min(95, baseY + waveY))
    }
  }

  // Big particle transforms
  const bigParticleX = useTransform(scrollYProgress, (progress) => {
    const pos = getBigParticlePosition(progress)
    return `${pos.x}vw`
  })
  
  const bigParticleY = useTransform(scrollYProgress, (progress) => {
    const pos = getBigParticlePosition(progress)
    return `${pos.y}vh`
  })
  
  const bigParticleScale = useTransform(scrollYProgress, [0, 0.8, 1], [1, 1.4, 2.2])

  // Big particle z-index that increases dramatically at the end
  const bigParticleZIndex = useTransform(scrollYProgress, [0, 0.9, 1], [10, 10, 50])

  // Container z-index that increases at the end
  const containerZIndex = useTransform(scrollYProgress, [0, 0.9, 1], [10, 10, 50])

  // Predetermined chasing particles with unique chase patterns
  const chasingParticles: ChasingParticle[] = [
    { id: 0, size: 8, color: '#a855f7', opacity: 0.8, startDelay: 0.1, chaseOffset: 0.03, pathVariation: 1 },
    { id: 1, size: 6, color: '#ec4899', opacity: 0.7, startDelay: 0.2, chaseOffset: 0.05, pathVariation: -1 },
    { id: 2, size: 10, color: '#f97316', opacity: 0.6, startDelay: 0.05, chaseOffset: 0.02, pathVariation: 0.7 },
    { id: 3, size: 6, color: '#06b6d4', opacity: 0.8, startDelay: 0.3, chaseOffset: 0.06, pathVariation: -0.8 },
    { id: 4, size: 8, color: '#10b981', opacity: 0.7, startDelay: 0.15, chaseOffset: 0.04, pathVariation: 1.2 },
    { id: 5, size: 6, color: '#eab308', opacity: 0.6, startDelay: 0.25, chaseOffset: 0.04, pathVariation: -0.5 },
    { id: 6, size: 12, color: '#8b5cf6', opacity: 0.9, startDelay: 0.08, chaseOffset: 0.07, pathVariation: 1.5 },
    { id: 7, size: 4, color: '#f59e0b', opacity: 0.5, startDelay: 0.4, chaseOffset: 0.02, pathVariation: -1.3 },
    { id: 8, size: 8, color: '#ef4444', opacity: 0.8, startDelay: 0.12, chaseOffset: 0.04, pathVariation: 0.9 },
    { id: 9, size: 6, color: '#14b8a6', opacity: 0.7, startDelay: 0.35, chaseOffset: 0.08, pathVariation: -0.6 },
    { id: 10, size: 10, color: '#f472b6', opacity: 0.6, startDelay: 0.18, chaseOffset: 0.06, pathVariation: 1.8 },
    { id: 11, size: 4, color: '#84cc16', opacity: 0.9, startDelay: 0.45, chaseOffset: 0.02, pathVariation: -1.1 },
    { id: 12, size: 8, color: '#3b82f6', opacity: 0.7, startDelay: 0.22, chaseOffset: 0.06, pathVariation: 0.4 },
    { id: 13, size: 6, color: '#fb7185', opacity: 0.8, startDelay: 0.28, chaseOffset: 0.03, pathVariation: -1.6 },
    { id: 14, size: 12, color: '#a3e635', opacity: 0.5, startDelay: 0.05, chaseOffset: 0.09, pathVariation: 2.1 },
    { id: 15, size: 4, color: '#fbbf24', opacity: 0.9, startDelay: 0.38, chaseOffset: 0.01, pathVariation: -0.3 },
    { id: 16, size: 10, color: '#c084fc', opacity: 0.6, startDelay: 0.14, chaseOffset: 0.08, pathVariation: 1.4 },
    { id: 17, size: 6, color: '#22d3ee', opacity: 0.8, startDelay: 0.42, chaseOffset: 0.05, pathVariation: -1.9 },
    { id: 18, size: 8, color: '#34d399', opacity: 0.7, startDelay: 0.16, chaseOffset: 0.08, pathVariation: 0.8 },
    { id: 19, size: 4, color: '#fde047', opacity: 0.5, startDelay: 0.48, chaseOffset: 0.01, pathVariation: -0.9 },
    { id: 20, size: 7, color: '#ff6b6b', opacity: 0.75, startDelay: 0.32, chaseOffset: 0.04, pathVariation: 1.3 },
    { id: 21, size: 3, color: '#4ecdc4', opacity: 0.6, startDelay: 0.52, chaseOffset: 0.01, pathVariation: -1.7 },
    { id: 22, size: 11, color: '#ffe66d', opacity: 0.85, startDelay: 0.09, chaseOffset: 0.09, pathVariation: 0.6 },
    { id: 23, size: 5, color: '#a8e6cf', opacity: 0.7, startDelay: 0.44, chaseOffset: 0.03, pathVariation: -1.2 },
    { id: 24, size: 9, color: '#ff8b94', opacity: 0.65, startDelay: 0.21, chaseOffset: 0.07, pathVariation: 1.8 },
    { id: 25, size: 4, color: '#b4f8c8', opacity: 0.8, startDelay: 0.37, chaseOffset: 0.02, pathVariation: -0.4 },
    { id: 26, size: 12, color: '#f093fb', opacity: 0.55, startDelay: 0.06, chaseOffset: 0.08, pathVariation: 2.3 },
    { id: 27, size: 6, color: '#f9ca24', opacity: 0.9, startDelay: 0.49, chaseOffset: 0.05, pathVariation: -1.5 },
    { id: 28, size: 8, color: '#6c5ce7', opacity: 0.75, startDelay: 0.13, chaseOffset: 0.06, pathVariation: 0.9 },
    { id: 29, size: 3, color: '#fd79a8', opacity: 0.6, startDelay: 0.54, chaseOffset: 0.01, pathVariation: -0.8 },
    { id: 30, size: 10, color: '#00b894', opacity: 0.8, startDelay: 0.19, chaseOffset: 0.07, pathVariation: 1.6 },
    { id: 31, size: 5, color: '#fdcb6e', opacity: 0.7, startDelay: 0.41, chaseOffset: 0.03, pathVariation: -1.4 },
    { id: 32, size: 7, color: '#e17055', opacity: 0.85, startDelay: 0.27, chaseOffset: 0.05, pathVariation: 1.1 },
    { id: 33, size: 4, color: '#74b9ff', opacity: 0.65, startDelay: 0.46, chaseOffset: 0.02, pathVariation: -0.7 },
    { id: 34, size: 11, color: '#55a3ff', opacity: 0.9, startDelay: 0.11, chaseOffset: 0.09, pathVariation: 2.0 },
    { id: 35, size: 6, color: '#fd79a8', opacity: 0.75, startDelay: 0.33, chaseOffset: 0.04, pathVariation: -1.8 },
    { id: 36, size: 9, color: '#fdcb6e', opacity: 0.6, startDelay: 0.24, chaseOffset: 0.08, pathVariation: 1.4 },
    { id: 37, size: 3, color: '#a29bfe', opacity: 0.8, startDelay: 0.51, chaseOffset: 0.01, pathVariation: -0.6 },
    { id: 38, size: 8, color: '#fd79a8', opacity: 0.7, startDelay: 0.17, chaseOffset: 0.06, pathVariation: 1.7 },
    { id: 39, size: 12, color: '#00cec9', opacity: 0.55, startDelay: 0.07, chaseOffset: 0.09, pathVariation: -2.1 },
    { id: 40, size: 1, color: '#ff6b35', opacity: 0.5, startDelay: 0.02, chaseOffset: 0.05, pathVariation: 0.8 },
    { id: 41, size: 3, color: '#f7931e', opacity: 0.6, startDelay: 0.08, chaseOffset: 0.03, pathVariation: -1.2 },
    { id: 42, size: 0, color: '#ffb347', opacity: 0.4, startDelay: 0.01, chaseOffset: 0.08, pathVariation: 1.5 },
    { id: 43, size: 5, color: '#ffd700', opacity: 0.7, startDelay: 0.06, chaseOffset: 0.02, pathVariation: -0.9 },
    { id: 44, size: 2, color: '#adff2f', opacity: 0.55, startDelay: 0.09, chaseOffset: 0.05, pathVariation: 1.1 },
    { id: 45, size: 4, color: '#32cd32', opacity: 0.65, startDelay: 0.03, chaseOffset: 0.07, pathVariation: -1.6 },
    { id: 46, size: 1, color: '#00ff7f', opacity: 0.45, startDelay: 0.07, chaseOffset: 0.04, pathVariation: 2.0 },
    { id: 47, size: 3, color: '#40e0d0', opacity: 0.6, startDelay: 0.04, chaseOffset: 0.06, pathVariation: -0.5 },
    { id: 48, size: 0, color: '#00bfff', opacity: 0.5, startDelay: 0.10, chaseOffset: 0.01, pathVariation: 1.3 },
    { id: 49, size: 5, color: '#1e90ff', opacity: 0.75, startDelay: 0.05, chaseOffset: 0.08, pathVariation: -1.8 },
    { id: 50, size: 2, color: '#6495ed', opacity: 0.6, startDelay: 0.02, chaseOffset: 0.03, pathVariation: 0.7 },
    { id: 51, size: 4, color: '#9370db', opacity: 0.7, startDelay: 0.08, chaseOffset: 0.06, pathVariation: -1.4 },
    { id: 52, size: 1, color: '#ba55d3', opacity: 0.5, startDelay: 0.01, chaseOffset: 0.05, pathVariation: 1.7 },
    { id: 53, size: 3, color: '#ff69b4', opacity: 0.65, startDelay: 0.09, chaseOffset: 0.02, pathVariation: -0.8 },
    { id: 54, size: 0, color: '#ff1493', opacity: 0.45, startDelay: 0.06, chaseOffset: 0.07, pathVariation: 1.9 },
    { id: 55, size: 5, color: '#dc143c', opacity: 0.8, startDelay: 0.03, chaseOffset: 0.04, pathVariation: -1.1 },
    { id: 56, size: 2, color: '#b22222', opacity: 0.55, startDelay: 0.10, chaseOffset: 0.01, pathVariation: 0.9 },
    { id: 57, size: 4, color: '#cd5c5c', opacity: 0.7, startDelay: 0.07, chaseOffset: 0.08, pathVariation: -1.5 },
    { id: 58, size: 1, color: '#f0e68c', opacity: 0.6, startDelay: 0.04, chaseOffset: 0.06, pathVariation: 1.2 },
   { id: 59, size: 3, color: '#daa520', opacity: 0.65, startDelay: 0.02, chaseOffset: 0.03, pathVariation: -0.6 },
    { id: 60, size: 0, color: '#b8860b', opacity: 0.5, startDelay: 0.08, chaseOffset: 0.05, pathVariation: 1.6 },
    { id: 61, size: 5, color: '#228b22', opacity: 0.75, startDelay: 0.01, chaseOffset: 0.07, pathVariation: -1.3 },
    { id: 62, size: 2, color: '#2e8b57', opacity: 0.6, startDelay: 0.09, chaseOffset: 0.02, pathVariation: 0.8 },
    { id: 63, size: 4, color: '#3cb371', opacity: 0.7, startDelay: 0.05, chaseOffset: 0.04, pathVariation: -1.7 },
    { id: 64, size: 1, color: '#20b2aa', opacity: 0.55, startDelay: 0.03, chaseOffset: 0.08, pathVariation: 1.4 },
    { id: 65, size: 3, color: '#008b8b', opacity: 0.65, startDelay: 0.06, chaseOffset: 0.01, pathVariation: -0.7 },
    { id: 66, size: 0, color: '#00ced1', opacity: 0.45, startDelay: 0.10, chaseOffset: 0.06, pathVariation: 1.8 },
    { id: 67, size: 5, color: '#00ffff', opacity: 0.8, startDelay: 0.04, chaseOffset: 0.03, pathVariation: -1.0 },
    { id: 68, size: 2, color: '#87ceeb', opacity: 0.6, startDelay: 0.07, chaseOffset: 0.05, pathVariation: 1.0 },
    { id: 69, size: 4, color: '#4169e1', opacity: 0.7, startDelay: 0.02, chaseOffset: 0.08, pathVariation: -1.9 },
    { id: 70, size: 1, color: '#0000ff', opacity: 0.5, startDelay: 0.08, chaseOffset: 0.02, pathVariation: 1.1 },
    { id: 71, size: 3, color: '#8a2be2', opacity: 0.65, startDelay: 0.01, chaseOffset: 0.07, pathVariation: -0.4 },
    { id: 72, size: 0, color: '#9932cc', opacity: 0.55, startDelay: 0.09, chaseOffset: 0.04, pathVariation: 1.5 },
    { id: 73, size: 5, color: '#8b008b', opacity: 0.75, startDelay: 0.05, chaseOffset: 0.06, pathVariation: -1.2 },
    { id: 74, size: 2, color: '#800080', opacity: 0.6, startDelay: 0.03, chaseOffset: 0.01, pathVariation: 0.6 },
    { id: 75, size: 4, color: '#dda0dd', opacity: 0.7, startDelay: 0.06, chaseOffset: 0.08, pathVariation: -1.6 },
    { id: 76, size: 1, color: '#ee82ee', opacity: 0.5, startDelay: 0.10, chaseOffset: 0.03, pathVariation: 1.3 },
    { id: 77, size: 3, color: '#da70d6', opacity: 0.65, startDelay: 0.04, chaseOffset: 0.05, pathVariation: -0.9 },
    { id: 78, size: 0, color: '#ff00ff', opacity: 0.45, startDelay: 0.07, chaseOffset: 0.07, pathVariation: 1.7 },
    { id: 79, size: 5, color: '#c71585', opacity: 0.8, startDelay: 0.02, chaseOffset: 0.02, pathVariation: -1.4 },
    { id: 80, size: 2, color: '#db7093', opacity: 0.55, startDelay: 0.08, chaseOffset: 0.06, pathVariation: 0.5 },
    { id: 81, size: 4, color: '#ffc0cb', opacity: 0.7, startDelay: 0.01, chaseOffset: 0.04, pathVariation: -1.8 },
    { id: 82, size: 1, color: '#ffb6c1', opacity: 0.6, startDelay: 0.09, chaseOffset: 0.08, pathVariation: 1.0 },
    { id: 83, size: 3, color: '#ffa07a', opacity: 0.65, startDelay: 0.05, chaseOffset: 0.01, pathVariation: -0.3 },
    { id: 84, size: 0, color: '#fa8072', opacity: 0.5, startDelay: 0.03, chaseOffset: 0.05, pathVariation: 1.6 },
    { id: 85, size: 5, color: '#e9967a', opacity: 0.75, startDelay: 0.06, chaseOffset: 0.07, pathVariation: -1.1 },
    { id: 86, size: 2, color: '#f4a460', opacity: 0.6, startDelay: 0.10, chaseOffset: 0.03, pathVariation: 0.9 },
    { id: 87, size: 4, color: '#deb887', opacity: 0.7, startDelay: 0.04, chaseOffset: 0.02, pathVariation: -1.5 },
    { id: 88, size: 1, color: '#d2691e', opacity: 0.55, startDelay: 0.07, chaseOffset: 0.06, pathVariation: 1.2 },
    { id: 89, size: 3, color: '#cd853f', opacity: 0.65, startDelay: 0.02, chaseOffset: 0.08, pathVariation: -0.8 },
    { id: 90, size: 0, color: '#a0522d', opacity: 0.45, startDelay: 0.08, chaseOffset: 0.04, pathVariation: 1.9 },
    { id: 91, size: 5, color: '#8b4513', opacity: 0.8, startDelay: 0.01, chaseOffset: 0.01, pathVariation: -1.0 },
    { id: 92, size: 2, color: '#696969', opacity: 0.6, startDelay: 0.09, chaseOffset: 0.07, pathVariation: 0.7 },
    { id: 93, size: 4, color: '#808080', opacity: 0.7, startDelay: 0.05, chaseOffset: 0.05, pathVariation: -1.7 },
    { id: 94, size: 1, color: '#a9a9a9', opacity: 0.5, startDelay: 0.03, chaseOffset: 0.03, pathVariation: 1.4 },
    { id: 95, size: 3, color: '#c0c0c0', opacity: 0.65, startDelay: 0.06, chaseOffset: 0.08, pathVariation: -0.5 },
    { id: 96, size: 0, color: '#d3d3d3', opacity: 0.55, startDelay: 0.10, chaseOffset: 0.02, pathVariation: 1.8 },
    { id: 97, size: 5, color: '#dcdcdc', opacity: 0.75, startDelay: 0.04, chaseOffset: 0.06, pathVariation: -1.3 },
    { id: 98, size: 2, color: '#f5f5f5', opacity: 0.6, startDelay: 0.07, chaseOffset: 0.04, pathVariation: 0.4 },
    { id: 99, size: 4, color: '#ffffff', opacity: 0.7, startDelay: 0.02, chaseOffset: 0.07, pathVariation: -1.6 }
  ]

  // Predetermined chase path for each small particle
  const getChasingParticlePosition = (particle: ChasingParticle, progress: number) => {
    // Each particle chases the big particle with an offset and variation
    const adjustedProgress = Math.max(0, progress - particle.chaseOffset)
    const targetPos = getBigParticlePosition(adjustedProgress)
    
    // Add unique path variation for each particle
    const variation = particle.pathVariation
    const chaseVariationX = Math.sin(adjustedProgress * Math.PI * 3 + particle.id) * 8 * Math.abs(variation)
    const chaseVariationY = Math.cos(adjustedProgress * Math.PI * 2.5 + particle.id) * 6 * Math.abs(variation)
    
    // Apply directional offset based on particle ID
    const offsetAngle = (particle.id / chasingParticles.length) * Math.PI * 2
    const offsetRadius = 15 * (1 - adjustedProgress) // Decreases as they get closer
    const offsetX = Math.cos(offsetAngle) * offsetRadius
    const offsetY = Math.sin(offsetAngle) * offsetRadius
    
    return {
      x: targetPos.x + chaseVariationX + offsetX * variation,
      y: targetPos.y + chaseVariationY + offsetY * variation
    }
  }

  return (
    <motion.div 
      ref={containerRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
      style={{
        zIndex: containerZIndex
      }}
    >
      {/* Static background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-500/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-pink-500/3 rounded-full blur-3xl" />
      </div>

      {/* Big escaping particle */}
      <motion.div
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{
          left: bigParticleX,
          top: bigParticleY,
          scale: bigParticleScale,
          zIndex: bigParticleZIndex,
        }}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full blur-xl opacity-50"
          style={{
            width: 60,
            height: 60,
            background: `radial-gradient(circle, hsl(280, 70%, 60%) 0%, hsl(320, 70%, 60%) 70%, transparent 100%)`,
            zIndex: 'inherit',
          }}
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        
        {/* Main particle core */}
        <div
          className="relative rounded-full mix-blend-screen"
          style={{
            width: 28,
            height: 28,
            background: `radial-gradient(circle, hsl(285, 80%, 75%) 0%, hsl(315, 80%, 70%) 100%)`,
            boxShadow: `0 0 15px hsl(285, 70%, 60%)`,
            zIndex: 'inherit',
          }}
        />

        
      </motion.div>

      {/* Predetermined chasing particles */}
      {chasingParticles.map((particle) => {
        const particleX = useTransform(scrollYProgress, (progress) => {
          const pos = getChasingParticlePosition(particle, progress)
          return `${pos.x}vw`
        })
        
        const particleY = useTransform(scrollYProgress, (progress) => {
          const pos = getChasingParticlePosition(particle, progress)
          return `${pos.y}vh`
        })

        const particleScale = useTransform(
          scrollYProgress, 
          [0, particle.startDelay, 0.9, 1], 
          [0, 1, 1.1, 0]
        )

        return (
          <motion.div
            key={particle.id}
            className="absolute rounded-full mix-blend-screen will-change-transform"
            style={{
              left: particleX,
              top: particleY,
              scale: particleScale,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              opacity: particle.opacity,
              transform: 'translate(-50%, -50%)',
              zIndex: 'inherit',
            }}
          />
        )
      })}

      {/* Visual path trail */}
      <div className="absolute inset-0">
        {Array.from({ length: 15 }).map((_, i) => {
          const progress = i / 14
          const pos = getBigParticlePosition(progress)
          return (
            <motion.div
              key={`trail-${i}`}
              className="absolute w-1 h-1 rounded-full bg-purple-300/20"
              style={{
                left: `${pos.x}vw`,
                top: `${pos.y}vh`,
                transform: 'translate(-50%, -50%)'
              }}
              animate={{
                opacity: [0.1, 0.4, 0.1],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          )
        })}
      </div>

      {/* Finale convergence effect */}
      {/* Finale convergence effect */}
      <motion.div
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{
          left: useTransform(bigParticleX, (x) => `calc(${x} + 0.75vw)`),
          top: useTransform(bigParticleY, (y) => `calc(${y} + 2vh)`),
          opacity: useTransform(scrollYProgress, [0.85, 1], [0, 1])
        }}
      >
       
     

      {/* Fast orbiting particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`fast-orbit-${i}`}
          className="absolute"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 0.8 + i * 0.1,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <motion.div
            className="absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 mix-blend-screen"
            style={{
              x: 30 + i * 5,
              y: 0,
              backgroundColor: `hsl(${320 + i * 20}, 80%, 70%)`,
              boxShadow: `0 0 8px hsl(${320 + i * 20}, 80%, 70%)`
            }}
            animate={{
              scale: [0.5, 1.2, 0.5],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      ))}

        

        {/* Central pulsing core */}
        <motion.div
          className="absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 mix-blend-screen"
          style={{
        background: `radial-gradient(circle, #ffffff 0%, #a855f7 50%, #ec4899 100%)`,
        boxShadow: `0 0 20px #a855f7, 0 0 40px #ec4899`
          }}
          animate={{
        scale: [1, 1.8, 1],
        opacity: [0.8, 1, 0.8],
        rotate: [0, 360]
          }}
          transition={{
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut"
          }}
        />
      </motion.div>
    </motion.div>
  )
}

export default MagicalScrollAnimation