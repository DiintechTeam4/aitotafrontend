import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'

export default function CustomCursor() {
    const cursorRef = useRef(null)
    const [isHovering, setIsHovering] = useState(false)
    const [hoverType, setHoverType] = useState('default') // default | card
    const [sparks, setSparks] = useState([])

    // Mouse position state
    const mouseX = useMotionValue(-100)
    const mouseY = useMotionValue(-100)

    // Smooth spring physics for the main cursor
    const springConfig = { damping: 25, stiffness: 150, mass: 0.5 }
    const cursorX = useSpring(mouseX, springConfig)
    const cursorY = useSpring(mouseY, springConfig)

    // Spark generation logic
    const lastSparkTime = useRef(0)

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseX.set(e.clientX)
            mouseY.set(e.clientY)

            // Generate sparks on movement
            const now = Date.now()
            if (now - lastSparkTime.current > 50) { // Limit spark generation rate
                const velocity = Math.abs(e.movementX) + Math.abs(e.movementY)
                if (velocity > 5) {
                    addSpark(e.clientX, e.clientY)
                    lastSparkTime.current = now
                }
            }
        }

        const handleMouseOver = (e) => {
            const card = e.target.closest('[data-cursor="card"]')
            if (['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.closest('[role="button"]') || e.target.closest('.clickable')) {
                setIsHovering(true)
                setHoverType('default')
            } else if (card) {
                setIsHovering(true)
                setHoverType('card')
            }
        }

        const handleMouseOut = () => {
            setIsHovering(false)
            setHoverType('default')
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseover', handleMouseOver)
        window.addEventListener('mouseout', handleMouseOut)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseover', handleMouseOver)
            window.removeEventListener('mouseout', handleMouseOut)
        }
    }, [])

    const addSpark = (x, y) => {
        const id = Math.random()
        const newSpark = {
            id,
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            size: Math.random() * 2 + 1,
            life: Math.random() * 0.5 + 0.5
        }
        setSparks(prev => [...prev.slice(-15), newSpark]) // Keep max 20 sparks

        // Cleanup spark after animation
        setTimeout(() => {
            setSparks(prev => prev.filter(s => s.id !== id))
        }, 1000)
    }

    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
            {/* Plasma Fire Core */}
            <motion.div
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: '-50%',
                    translateY: '-50%',
                    position: 'absolute',
                }}
            >
                {/* Main Fire Container */}
                <motion.div
                    animate={{
                        scale: isHovering ? (hoverType === 'card' ? 1.4 : 1.1) : 0.7,
                    }}
                    transition={{ duration: 0.3 }}
                    style={{ position: 'relative', width: 40, height: 40 }}
                >
                    {/* Inner White/Cyan Hot Core (The Source) */}
                    <div style={{
                        position: 'absolute',
                        inset: 10,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, #ffffff 0%, #00e5ff 60%, transparent 100%)',
                        filter: 'blur(3px)',
                        boxShadow: '0 0 20px #00e5ff, 0 0 40px #00e5ff',
                        zIndex: 10
                    }} />

                    {/* Outer Blue Plasma Glow (Flickering) */}
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 0.95, 1.05, 1],
                            opacity: [0.4, 0.6, 0.4],
                            filter: isHovering && hoverType === 'card'
                                ? [`blur(8px) brightness(1.2)`, `blur(12px) brightness(1.4)`, `blur(8px) brightness(1.2)`]
                                : [`blur(4px) brightness(0.8)`, `blur(6px) brightness(1)`, `blur(4px) brightness(0.8)`]
                        }}
                        transition={{
                            duration: 0.2, // Very fast flicker
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, #00e5ff 0%, #3b82f6 50%, transparent 80%)',
                            zIndex: 5
                        }}
                    />

                    {/* Upward Flowing Flames (Simulation) */}
                    <motion.div
                        animate={{
                            y: [-3, -10],
                            opacity: [0.5, 0],
                            scaleX: [0.8, 0.4],
                        }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            ease: "easeOut"
                        }}
                        style={{
                            position: 'absolute',
                            top: -10,
                            left: 5,
                            width: 30,
                            height: 40,
                            background: 'conic-gradient(from 180deg at 50% 100%, transparent 0deg, #00e5ff 160deg, #3b82f6 200deg, transparent 360deg)',
                            filter: 'blur(8px)',
                            transformOrigin: 'bottom center',
                            zIndex: 4,
                            mixBlendMode: 'screen'
                        }}
                    />
                    <motion.div
                        animate={{
                            y: [-1, -8],
                            opacity: [0.4, 0],
                            scale: [0.6, 0.2],
                        }}
                        transition={{
                            duration: 0.4,
                            repeat: Infinity,
                            ease: "easeOut",
                            delay: 0.1
                        }}
                        style={{
                            position: 'absolute',
                            top: -15,
                            left: 8,
                            width: 24,
                            height: 30,
                            background: '#00e5ff',
                            filter: 'blur(6px)',
                            borderRadius: '50% 50% 0 0',
                            zIndex: 3,
                        }}
                    />
                </motion.div>
            </motion.div>

            {/* Particle Sparks */}
            <AnimatePresence>
                {sparks.map(spark => (
                    <motion.div
                        key={spark.id}
                        initial={{ opacity: 1, x: spark.x, y: spark.y, scale: 1 }}
                        animate={{
                            opacity: 0,
                            y: spark.y - 30 - (Math.random() * 20), // Float up
                            x: spark.x + (Math.random() - 0.5) * 20, // Drift
                            scale: 0
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: spark.life, ease: "easeOut" }}
                        style={{
                            position: 'absolute',
                            width: spark.size,
                            height: spark.size,
                            borderRadius: '50%',
                            background: '#fff',
                            boxShadow: '0 0 4px #00e5ff',
                            zIndex: 9998
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    )
}
