import { useRef, useState, useEffect } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import heroImg from '../aitota-assets/herobg.png'
import journeyBg from '../aitota-assets/aiRobotic2.png'
import HeroParticles from '../aitota-components/HeroParticles'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

import { Target, Handshake, Globe, Zap, ShieldCheck, TrendingUp, User, Code, Lightbulb, Rocket, Users, Megaphone, Building2 } from 'lucide-react'

/* ===== SHARED COMPONENTS ===== */
function TextReveal({ children, delay = 0, style = {} }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-20px' })
    return (
        <div ref={ref} style={{ overflow: 'hidden', ...style }}>
            <motion.div
                initial={{ y: '110%', rotate: 3, opacity: 0, filter: 'blur(10px)' }}
                animate={isInView ? { y: 0, rotate: 0, opacity: 1, filter: 'blur(0px)' } : {}}
                transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}>
                {children}
            </motion.div>
        </div>
    )
}

function HoverWord({ text, className = "", style = {} }) {
    const hoverStyles = [
        { scale: 1.2, color: "#00e5ff", y: -4, textShadow: "0 0 8px #00e5ff", WebkitTextFillColor: "#00e5ff" },
        { scale: 1.1, color: "#8b5cf6", rotate: -3, textShadow: "0 0 8px #8b5cf6", WebkitTextFillColor: "#8b5cf6" },
        { scale: 1.2, color: "#f43f8c", skewX: -10, textShadow: "0 0 8px #f43f8c", WebkitTextFillColor: "#f43f8c" },
        { scale: 1.1, color: "#10b981", letterSpacing: "0.1em", textShadow: "0 0 8px #10b981", WebkitTextFillColor: "#10b981" },
        { scale: 1.2, color: "#f59e0b", rotate: 3, y: 3, textShadow: "0 0 8px #f59e0b", WebkitTextFillColor: "#f59e0b" },
        { scale: 1.15, color: "#ffffff", fontWeight: 900, textShadow: "0 0 15px #ffffff", WebkitTextFillColor: "#ffffff" },
    ]

    return (
        <span className={className} style={{ display: "inline-block", ...style }}>
            {text.split(" ").map((word, i) => (
                <motion.span
                    key={i}
                    style={{ display: "inline-block", marginRight: "0.25em", cursor: "pointer" }}
                    whileHover={hoverStyles[i % hoverStyles.length]}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    {word}
                </motion.span>
            ))}
        </span>
    )
}

function AnimatedDivider() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="animated-divider"
            style={{ margin: '0 clamp(20px, 5vw, 80px)' }}
        />
    )
}

function AnimatedCounter({ target, suffix = '', prefix = '' }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-50px' })
    const [count, setCount] = useState(0)

    useEffect(() => {
        if (!isInView) return
        let start = 0
        const end = parseInt(target)
        const duration = 2000
        const step = end / (duration / 16)
        const timer = setInterval(() => {
            start += step
            if (start >= end) {
                setCount(end)
                clearInterval(timer)
            } else {
                setCount(Math.floor(start))
            }
        }, 16)
        return () => clearInterval(timer)
    }, [isInView, target])

    return <span ref={ref}>{prefix}{count}{suffix}</span>
}

/* ===== DATA ===== */
const values = [
    { icon: Target, title: 'Customer First', text: 'We prioritize the human experience in every automated interaction we facilitate.', color: 'var(--accent)' },
    { icon: Handshake, title: 'Seamless Integration', text: 'Our tech naturally fits into your workflow, making adoption effortless.', color: 'var(--accent-2)' },
    { icon: Globe, title: 'Global Reach', text: "Breaking language barriers with voice AI that speaks the world's tongues.", color: '#3ff454ff' },
    { icon: Zap, title: 'Performance', text: 'Speed and reliability are non-negotiable for critical business communications.', color: 'var(--accent-3)' },
    { icon: ShieldCheck, title: 'Data Security', text: 'Your customer data and conversation logs are protected with enterprise-grade security.', color: '#f59e0b' },
    { icon: TrendingUp, title: 'Continuous Evolution', text: 'Our models are always learning, getting smarter and more natural every day.', color: '#6366f1' },
]

const team = [
    { name: 'Vijay Kumar Singh', role: 'CEO & Founder', icon: User, bio: 'Visionary leader driving the future of conversational AI and human-centric automation.' },
    { name: 'Pankaj Pareek', role: 'Software Developer', icon: Code, bio: 'Architecture specialist focused on building scalable, high-performance voice AI systems.' },
    { name: 'Dev Sharma', role: 'Head of Product', icon: Lightbulb, bio: 'Strategic product lead dedicated to creating intuitive, user-first AI experiences.' },
]

const milestones = [
    { year: '2022', event: 'Inception', desc: 'Started with a simple goal: Replace rigid IVR with fluid AI conversations.', icon: Rocket },
    { year: '2023', event: 'First 1k Users', desc: 'Launched beta. Early adopters validated our core voice engine.', icon: Users },
    { year: '2024', event: 'Campaign Manager', desc: 'Released the full campaign suite for outbound sales and support teams.', icon: Megaphone },
    { year: '2025', event: 'Global Expansion', desc: 'Added support for 40+ languages and local numbers in 50 countries.', icon: Globe },
    { year: '2026', event: 'Enterprise Scale', desc: 'Powering millions of minutes of conversation for Fortune 500 companies.', icon: Building2 },
]

const stats = [
    { value: '500', suffix: 'K+', label: 'Calls Handled Daily' },
    { value: '40', suffix: '+', label: 'Languages Supported' },
    { value: '99', suffix: '.9%', label: 'Connection Success' },
    { value: '200', suffix: '+', label: 'Happy Businesses' },
]

function SoundVisuals({ color, index }) {
    const containerRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Variant 0: Standard Voice Bars (Customer First)
            if (index === 0) {
                gsap.to('.bar-0', {
                    height: "random(20, 100)%",
                    opacity: "random(0.3, 1)",
                    duration: "random(0.2, 0.5)",
                    ease: "power2.inOut",
                    repeat: -1,
                    yoyo: true,
                    delay: () => Math.random() * 0.5
                })
            }
            // Variant 1: Mirrored Wave (Seamless Integration)
            if (index === 1) {
                gsap.fromTo('.bar-1',
                    { height: '10%' },
                    {
                        height: "100%",
                        ease: "sine.inOut",
                        stagger: {
                            each: 0.1,
                            from: "center",
                            yoyo: true,
                            repeat: -1
                        },
                        duration: 0.6
                    }
                )
            }
            // Variant 2: Circular Radial (Global Reach)
            if (index === 2) {
                gsap.to('.bar-2', {
                    height: "24px",
                    opacity: 1,
                    ease: "power1.inOut",
                    stagger: {
                        each: 0.05,
                        from: "end",
                        yoyo: true,
                        repeat: -1
                    },
                    duration: 0.5
                })
            }
            // Variant 3: Digital Peaks (Performance)
            if (index === 3) {
                gsap.to('.bar-3', {
                    height: "random(30, 100)%",
                    backgroundColor: '#fff',
                    ease: "steps(3)",
                    stagger: 0.05,
                    duration: 0.2,
                    repeat: -1,
                    yoyo: true
                })
            }
            // Variant 4: Data Matrix (Security)
            if (index === 4) {
                gsap.to('.dot-4', {
                    opacity: 0.1,
                    scale: 0.5,
                    duration: "random(0.5, 1.5)",
                    ease: "power1.inOut",
                    repeat: -1,
                    yoyo: true,
                    stagger: {
                        amount: 1,
                        from: "random"
                    }
                })
            }
            // Variant 5: Expanding Pulse (Evolution)
            if (index === 5) {
                gsap.to('.ring-5', {
                    scale: 3,
                    opacity: 0,
                    duration: 2,
                    ease: "power1.out",
                    stagger: 0.6,
                    repeat: -1
                })
            }

        }, containerRef)
        return () => ctx.revert()
    }, [index, color])

    const renderContent = () => {
        switch (index) {
            case 0: // Bars
                return (
                    <div className="flex items-center gap-[4px] h-[120px]" style={{ transform: 'skewX(-10deg) translateY(-60px)' }}>
                        {[...Array(18)].map((_, i) => (
                            <div key={i} className="bar-0" style={{
                                width: '6px', height: '20%', background: color, borderRadius: 4,
                                boxShadow: `0 0 15px ${color}`, opacity: 0.5
                            }} />
                        ))}
                    </div>
                )
            case 1: // Mirrored
                return (
                    <div className="flex items-center justify-center gap-[6px] h-[100px]" style={{ transform: 'translateY(-60px)' }}>
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className="bar-1" style={{
                                width: 4, height: '10%', background: color, borderRadius: 10,
                                boxShadow: `0 0 12px ${color}`, opacity: 0.8
                            }} />
                        ))}
                    </div>
                )
            case 2: // Circular - Global
                return (
                    <div className="relative w-[120px] h-[120px] flex items-center justify-center" style={{ transform: 'translateY(-60px)' }}>
                        {[...Array(24)].map((_, i) => {
                            const angle = (i / 24) * 360;
                            return (
                                <div key={i} className="bar-2 absolute origin-bottom" style={{
                                    left: '50%', top: '50%', width: 3, height: 8,
                                    background: color, borderRadius: 2,
                                    transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-25px)`,
                                    boxShadow: `0 0 8px ${color}`, opacity: 0.4
                                }} />
                            )
                        })}
                    </div>
                )
            case 3: // High Performance - Sharp & Fast
                return (
                    <div className="flex items-end gap-[3px] h-[80px]" style={{ transform: 'translateY(-60px)' }}>
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="bar-3" style={{
                                width: 4, height: '20%', background: color,
                                boxShadow: `0 0 10px ${color}`
                            }} />
                        ))}
                    </div>
                )
            case 4: // Security Matrix
                return (
                    <div className="grid grid-cols-6 gap-2" style={{ transform: 'translateY(-60px)' }}>
                        {[...Array(24)].map((_, i) => (
                            <div key={i} className="dot-4" style={{
                                width: 6, height: 6, borderRadius: '50%', background: color,
                                boxShadow: `0 0 6px ${color}`
                            }} />
                        ))}
                    </div>
                )
            case 5: // Evolution Pulse
                return (
                    <div className="relative items-center justify-center flex" style={{ transform: 'translateY(-60px)' }}>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="ring-5 absolute border-2 rounded-full" style={{
                                width: 40, height: 40, borderColor: color, opacity: 1,
                                boxShadow: `0 0 15px ${color}, inset 0 0 10px ${color}`
                            }} />
                        ))}
                        <div style={{ width: 10, height: 10, background: color, borderRadius: '50%', boxShadow: `0 0 20px ${color}` }} />
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
            style={{
                maskImage: 'radial-gradient(circle at center, black 40%, transparent 85%)',
                WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 85%)'
            }}
        >
            {renderContent()}
        </div>
    )
}

export default function About() {
    const heroRef = useRef(null)
    const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
    const heroOpacity = useTransform(heroProgress, [0, 0.6], [1, 0])
    const heroScale = useTransform(heroProgress, [0, 0.6], [1, 0.95])

    const missionRef = useRef(null)
    const { scrollYProgress } = useScroll({ target: missionRef, offset: ['start end', 'end start'] })
    const y1 = useTransform(scrollYProgress, [0, 1], [80, -80])
    const y2 = useTransform(scrollYProgress, [0, 1], [-40, 40])

    // GSAP Values Section
    const valuesRef = useRef(null)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        const section = valuesRef.current
        if (!section) return

        const ctx = gsap.context(() => {
            const cards = gsap.utils.toArray('.value-card')

            // 1. Setup 3D Container
            gsap.set(section, { perspective: 1000 })

            // 2. Setup Cards: Start Off-screen RIGHT
            gsap.set(cards, {
                xPercent: 200, // Push far right
                rotationY: -45, // Angled facing left
                opacity: 0,
                scale: 0.7,
                transformOrigin: 'center center',
                zIndex: 1
            })

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top top',
                    end: `+=${cards.length * 1500}`, // Ensure enough scroll space
                    scrub: 1, // Smooth interaction
                    pin: true,
                    anticipatePin: 1,
                }
            })

            // 3. Build Horizontal Flow Sequence
            cards.forEach((card, index) => {
                const cardColor = values[index].color
                const position = index * 1.5 // Timing offset

                // A. Enter from Right -> Center
                tl.to(card, {
                    xPercent: 0,
                    rotationY: 0,
                    opacity: 1,
                    scale: 1.1,
                    zIndex: 10,
                    duration: 1,
                    ease: "power2.out"
                }, position)

                // B. INTENSE NEON GLOW STATE (Center Focus) - REMOVED for new design compatibility
                // C. ICON POP & GLOW - REMOVED for new design compatibility

                // D. Exit Center -> Left
                if (index !== cards.length - 1) {
                    const exitTime = position + 1.5

                    tl.to(card, {
                        xPercent: -200, // Fly off left
                        rotationY: 45, // Angled facing right
                        opacity: 0,
                        scale: 0.7,
                        zIndex: 1,
                        duration: 1,
                        ease: "power2.in"
                    }, exitTime)

                    // Kill Glow on Exit - REMOVED
                    // Reset Icon - REMOVED
                }
            })

        }, valuesRef)

        return () => ctx.revert()
    }, [isMobile])

    return (
        <main>
            {/* ===== HERO ===== */}
            <section
                ref={heroRef}
                className="hero-gradient"
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 24px',
                    paddingTop: 80,
                    position: 'relative',
                    overflow: 'hidden',
                    textAlign: 'center'
                }}
            >
                {/* Hero Image Background */}
                <motion.div
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 0,
                    }}
                >
                    <img
                        src={heroImg}
                        alt="About Aitota Team"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center 20%',
                            opacity: 0.75,
                            filter: 'brightness(1.1)'
                        }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, var(--bg) 90%)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, var(--bg) 100%)', opacity: 0.4 }} />
                </motion.div>

                {/* Background orbs */}
                <div className="orb-container">
                    <div className="orb orb-purple" style={{ top: -200, right: -200, width: 600, height: 600 }} />
                    <div className="orb orb-cyan" style={{ bottom: -200, left: -100, width: 400, height: 400 }} />
                </div>

                <HeroParticles />

                <motion.div style={{ maxWidth: 900, position: 'relative', zIndex: 2, opacity: heroOpacity, scale: heroScale }}>
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <span className="label" style={{ marginBottom: 24, display: 'block', letterSpacing: '0.2em' }}>About Aitota</span>
                    </motion.div>
                    <TextReveal>
                        <h1 className="display-large" style={{ lineHeight: 1.1, fontSize: 'clamp(2rem, 6vw, 4.5rem)' }}>
                            Revolutionizing business<br />
                            <span className="gradient-text">communication.</span>
                        </h1>
                    </TextReveal>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="body-large"
                        style={{ maxWidth: 600, margin: '32px auto 0' }}
                    >
                        Aitota connects businesses with their customers through intelligent, human-like voice AI. We're bridging the gap between automation and personal connection.
                    </motion.p>
                </motion.div>
            </section>

            <AnimatedDivider />

            {/* ===== VISION STATEMENT ===== */}
            <section className="section-dark" style={{ position: 'relative', overflow: 'hidden', padding: '160px 24px' }}>
                <div className="grid-bg" style={{ opacity: 0.3 }} />

                {/* Dynamic Orbs for this section */}
                <div className="orb-container">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                            x: [0, 50, 0],
                            y: [0, -30, 0]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="orb orb-cyan"
                        style={{ top: '20%', left: '10%', width: 400, height: 400 }}
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.2, 0.4, 0.2],
                            x: [0, -60, 0],
                            y: [0, 40, 0]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="orb orb-purple"
                        style={{ bottom: '10%', right: '15%', width: 500, height: 500 }}
                    />
                </div>

                <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="label" style={{
                            marginBottom: 40,
                            display: 'inline-block',
                            padding: '8px 20px',
                            borderRadius: '100px',
                            background: 'rgba(0, 229, 255, 0.05)',
                            border: '1px solid rgba(0, 229, 255, 0.1)'
                        }}>
                            OUR VISION
                        </span>
                    </motion.div>

                    <h2 className="display-large" style={{
                        margin: '0 auto',
                        maxWidth: 950,
                        lineHeight: 1.1,
                        fontSize: 'clamp(2.5rem, 6vw, 4.8rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.03em'
                    }}>
                        <TextReveal delay={0.1}>
                            <HoverWord text="A future where" /> <span className="gradient-text"><HoverWord text="every conversation" /></span>
                        </TextReveal>
                        <TextReveal delay={0.2}>
                            <HoverWord text="is" /> <span style={{
                                color: 'var(--text-1)',
                                position: 'relative',
                                display: 'inline-block'
                            }}>
                                <HoverWord text="meaningful" />
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: '100%' }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 1, duration: 1 }}
                                    style={{
                                        position: 'absolute', bottom: 8, left: 0, height: 4,
                                        background: 'var(--accent)', opacity: 0.3, zIndex: -1
                                    }}
                                />
                            </span>,
                            <span style={{
                                background: 'linear-gradient(to right, #00e5ff, #10b981)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontWeight: 900
                            }}> <HoverWord text="efficient" /></span>,
                        </TextReveal>
                        <TextReveal delay={0.3}>
                            <HoverWord text="and accessible to" /> <span style={{
                                color: 'var(--accent-2)',
                                textShadow: '0 0 30px rgba(139, 92, 246, 0.3)'
                            }}><HoverWord text="everyone." /></span>
                        </TextReveal>
                    </h2>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.2, duration: 1 }}
                        style={{ marginTop: 40 }}
                    >
                        <div style={{ width: 60, height: 2, background: 'linear-gradient(to right, transparent, var(--accent), transparent)', margin: '0 auto' }} />
                    </motion.div>
                </div>
            </section>

            <AnimatedDivider />

            {/* ===== MISSION WITH PARALLAX ===== */}
            <section ref={missionRef} className="pad-section section-light" style={{ overflow: 'hidden' }}>
                <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 60, alignItems: 'center', position: 'relative' }}>
                    <motion.div style={{ y: y1 }}>
                        <span className="label" style={{ marginBottom: 20, display: 'block' }}>Our Mission</span>
                        <h2 className="display-medium" style={{ marginBottom: 24 }}>
                            Empower teams to<br />scale <span style={{ color: 'var(--accent)' }}>communication.</span>
                        </h2>
                        <p className="body-large" style={{ maxWidth: 450, marginBottom: 32 }}>
                            We build the infrastructure that allows businesses to reach millions of customers personally, without losing the human touch.
                        </p>

                        <Link to="/contact">
                            <motion.button
                                className="cta-filled"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Join Our Journey →
                            </motion.button>
                        </Link>
                    </motion.div>

                    <motion.div style={{ y: y2 }}>
                        <div style={{
                            position: 'relative',
                            height: 500,
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            perspective: '1200px'
                        }}>
                            {/* Ambient Glow */}
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'radial-gradient(circle at center, rgba(0, 229, 255, 0.1), transparent 60%)',
                                filter: 'blur(40px)',
                                zIndex: 0
                            }} />

                            {/* Isometric Grid */}
                            <motion.div
                                initial={{ rotateX: 60, rotateZ: -45, scale: 0.8, opacity: 0 }}
                                whileInView={{ rotateX: 60, rotateZ: -45, scale: 1, opacity: 1 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(6, 1fr)',
                                    gap: 20,
                                    transformStyle: 'preserve-3d',
                                    padding: 20,
                                    background: 'rgba(255,255,255,0.01)',
                                    borderRadius: 30,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                                    zIndex: 1
                                }}
                            >
                                {[...Array(36)].map((_, i) => {
                                    // Complex pattern for active nodes
                                    const isCenter = [14, 15, 20, 21].includes(i);
                                    const isCorner = [0, 5, 30, 35].includes(i);
                                    const isActive = isCenter || isCorner || i % 7 === 0;

                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ height: 20 }}
                                            animate={{
                                                height: isActive ? [20, 60, 20] : [20, 30, 20],
                                                backgroundColor: isActive ? 'rgba(0, 229, 255, 0.8)' : 'rgba(255, 255, 255, 0.05)',
                                                boxShadow: isActive ? '0 0 20px rgba(0, 229, 255, 0.5)' : 'none'
                                            }}
                                            whileHover={{
                                                height: 100,
                                                z: 20,
                                                backgroundColor: '#8b5cf6',
                                                boxShadow: '0 0 40px #8b5cf6, 0 0 80px rgba(139, 92, 246, 0.4)',
                                                transition: { duration: 0.2 }
                                            }}
                                            transition={{
                                                duration: 3 + Math.random() * 2,
                                                repeat: Infinity,
                                                delay: i * 0.1,
                                                ease: "easeInOut"
                                            }}
                                            style={{
                                                width: 30,
                                                borderRadius: 8,
                                                position: 'relative',
                                                cursor: 'pointer',
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}
                                        >
                                            {/* Top cap for 3D effect */}
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                height: '100%',
                                                borderRadius: 8,
                                                background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)',
                                                pointerEvents: 'none'
                                            }} />
                                        </motion.div>
                                    )
                                })}
                            </motion.div>

                            {/* Floating Holographic Stats */}
                            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
                                {[
                                    { top: '15%', left: '10%', label: '1M+ Calls/Day', color: '#00e5ff', delay: 0.5 },
                                    { top: '25%', right: '10%', label: '99.9% Uptime', color: '#8b5cf6', delay: 1.5 },
                                    { bottom: '30%', left: '15%', label: 'Global Reach', color: '#f43f8c', delay: 2.5 },
                                    { bottom: '20%', right: '20%', label: '<50ms Latency', color: '#10b981', delay: 3.5 }
                                ].map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                        animate={{
                                            y: [0, -10, 0],
                                            opacity: [0.8, 1, 0.8]
                                        }}
                                        transition={{
                                            duration: 4,
                                            repeat: Infinity,
                                            delay: stat.delay,
                                            ease: "easeInOut"
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: stat.top,
                                            left: stat.left,
                                            right: stat.right,
                                            bottom: stat.bottom,
                                            padding: '8px 16px',
                                            background: 'rgba(5, 5, 16, 0.8)',
                                            border: `1px solid ${stat.color}`,
                                            borderRadius: '12px',
                                            boxShadow: `0 0 20px ${stat.color}40`,
                                            backdropFilter: 'blur(4px)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8
                                        }}
                                    >
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: stat.color, boxShadow: `0 0 10px ${stat.color}` }} />
                                        <span style={{ color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>
                                            {stat.label}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ===== STATS COUNTER SECTION ===== */}
            <section className="pad-section-sm section-dark">
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-panel-light"
                                style={{
                                    padding: '32px',
                                    textAlign: 'center',
                                    transition: 'transform 0.4s',
                                }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                                </div>
                                <div style={{ fontSize: 14, color: 'var(--text-3)', fontTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <AnimatedDivider />

            {/* ===== VALUES (Scroll Animation) ===== */}
            <section
                ref={valuesRef}
                className="section-light"
                style={{
                    height: '100vh',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#050510'
                }}
            >
                {/* Background Text Overlay */}
                <div style={{ position: 'absolute', top: '10%', textAlign: 'center', zIndex: 0, width: '100%' }}>
                    <span className="label" style={{ marginBottom: 20, display: 'block' }}>Core Values</span>
                    <h2 className="display-medium" style={{ opacity: 0.3, marginBottom: 10 }}>What drives</h2>
                    <h2 className="display-huge gradient-text" style={{ opacity: 0.8 }}>US</h2>
                </div>

                <div
                    style={{
                        position: 'relative',
                        width: isMobile ? '290px' : '350px',
                        height: isMobile ? '400px' : '480px',
                        marginTop: isMobile ? '60px' : '100px',
                    }}
                >
                    {values.map((v, i) => (
                        <div
                            key={v.title}
                            className="value-card group"
                            onMouseMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const y = e.clientY - rect.top;
                                e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                                e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
                            }}
                            style={{
                                position: 'absolute',
                                top: 0, left: 0,
                                width: '100%',
                                height: '100%',
                                borderRadius: '48px',
                                background: '#0f0f14',
                                border: `1px solid ${v.color}40`,
                                borderBottom: `2px solid ${v.color}`,
                                boxShadow: `
                                    0 0 40px -10px ${v.color}80,
                                    0 30px 60px -15px ${v.color}50,
                                    inset 0 -20px 40px -20px ${v.color}60,
                                    inset 0 0 20px -10px ${v.color}30
                                `,
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                transformOrigin: 'center center',
                                cursor: 'pointer',
                                opacity: 0,
                                zIndex: 1,
                            }}
                        >
                            {/* Inner Gradient Orb that follows mouse - LIQUID effect */}
                            <div
                                className="pointer-events-none absolute -inset-[50%] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{
                                    background: `radial-gradient(circle at var(--mouse-x) var(--mouse-y), ${v.color}60, transparent 50%)`,
                                    zIndex: 0,
                                    mixBlendMode: 'soft-light',
                                    filter: 'blur(40px)'
                                }}
                            />

                            {/* Glass Reflection Top */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none z-10" />

                            {/* Abstract Data Pattern in Empty Space */}
                            <SoundVisuals color={v.color} index={i} />

                            <div className={`relative z-20 ${isMobile ? 'p-6' : 'p-8'} h-full flex flex-col justify-between`} style={{ transform: "translateZ(30px)" }}>

                                {/* Top: Icon & Index */}
                                <div className="flex justify-between items-start">
                                    <div
                                        className="w-16 h-16 rounded-[20px] flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-500"
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <v.icon size={32} className="text-white relative z-10" strokeWidth={1.5} />
                                        {/* Icon inner glow */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-500" style={{ background: v.color, filter: 'blur(20px)' }} />
                                    </div>

                                    <span className="font-mono text-xl text-white/20 font-light">0{i + 1}</span>
                                </div>

                                {/* Content Section */}
                                <div className="flex flex-col gap-4">
                                    <h3
                                        className="text-4xl font-medium text-white leading-[0.9] tracking-tight"
                                        style={{ fontFamily: 'var(--font-display)' }}
                                    >
                                        {v.title}
                                    </h3>

                                    <div className="h-[1px] w-full bg-white/10 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-white/40 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out" />
                                    </div>

                                    <p className="text-lg text-white/60 leading-relaxed font-light">
                                        {v.text}
                                    </p>
                                </div>

                                {/* Bottom Color Bleed */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-[150px] opacity-20 group-hover:opacity-50 transition-all duration-700 pointer-events-none"
                                    style={{
                                        background: `linear-gradient(to top, ${v.color}, transparent)`,
                                        maskImage: 'linear-gradient(to top, black, transparent)',
                                        WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
                                        zIndex: 0
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <AnimatedDivider />

            {/* ===== ANIMATED TIMELINE ===== */}
            <section
                className="pad-section"
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: '#050510'
                }}
            >
                {/* AI Calling Immersive Background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                    
                    {/* Deep Background */}
                    <div className="absolute inset-0 bg-[#050510]" />

                    {/* Animated Pulsing Signal Rings (Radar/Call Connection) */}
                    {[...Array(4)].map((_, i) => (
                        <motion.div
                            key={`ring-${i}`}
                            animate={{
                                scale: [1, 3],
                                opacity: [0.15, 0]
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear",
                                delay: i * 2
                            }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--accent)]"
                            style={{ width: 400, height: 400 }}
                        />
                    ))}

                    {/* Left and Right Audio Visualizers */}
                    <div className="absolute left-[8%] top-1/2 -translate-y-1/2 flex items-center gap-[6px] opacity-20 hidden md:flex">
                        {[...Array(16)].map((_, i) => (
                            <motion.div
                                key={`wave-l-${i}`}
                                animate={{ height: [15, Math.random() * 120 + 30, 15] }}
                                transition={{ duration: 0.6 + Math.random(), repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                                style={{ width: 5, backgroundColor: '#00e5ff', borderRadius: 10, boxShadow: '0 0 15px #00e5ff' }}
                            />
                        ))}
                    </div>

                    <div className="absolute right-[8%] top-1/2 -translate-y-1/2 flex items-center gap-[6px] opacity-20 hidden md:flex">
                        {[...Array(16)].map((_, i) => (
                            <motion.div
                                key={`wave-r-${i}`}
                                animate={{ height: [15, Math.random() * 120 + 30, 15] }}
                                transition={{ duration: 0.6 + Math.random(), repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                                style={{ width: 5, backgroundColor: '#8b5cf6', borderRadius: 10, boxShadow: '0 0 15px #8b5cf6' }}
                            />
                        ))}
                    </div>

                    {/* Ambient Glows */}
                    <div className="absolute top-[0%] left-[20%] w-[60%] h-[60%] bg-blue-900/10 blur-[150px] rounded-full" />
                    <div className="absolute bottom-[0%] right-[10%] w-[50%] h-[50%] bg-purple-900/15 blur-[150px] rounded-full" />

                    {/* Grid Overlay for depth */}
                    <div className="absolute inset-0" style={{ 
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                        maskImage: 'radial-gradient(circle at center, black 0%, transparent 80%)',
                        WebkitMaskImage: 'radial-gradient(circle at center, black 0%, transparent 80%)'
                    }} />

                    {/* Edges Gradient Blend */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-transparent to-[#050510] opacity-90" />
                </div>

                <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <TextReveal><span className="label" style={{ marginBottom: 20, display: 'block' }}>Our Journey</span></TextReveal>
                    <TextReveal delay={0.1}><h2 className="display-medium" style={{ marginBottom: 64 }}>Building the <span className="gradient-text">future of voice.</span></h2></TextReveal>

                    <div style={{ position: 'relative', paddingLeft: 40 }}>
                        {/* Vertical line fill */}
                        <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.1)' }} />

                        {milestones.map((m, i) => (
                            <motion.div
                                key={m.year}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                style={{ position: 'relative', marginBottom: 60, paddingLeft: 40 }}
                            >
                                {/* Node dot */}
                                <div style={{
                                    position: 'absolute', left: -9, top: 0,
                                    width: 18, height: 18, borderRadius: '50%',
                                    background: 'var(--bg)',
                                    border: '2px solid var(--accent)',
                                    zIndex: 2
                                }} />

                                <div className="glass-card" style={{ padding: '24px', borderRadius: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                        <span style={{ fontSize: 24, color: 'var(--accent)' }}><m.icon size={24} /></span>
                                        <span className="label" style={{ color: 'var(--accent)', fontSize: 12 }}>{m.year}</span>
                                    </div>
                                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text-1)' }}>{m.event}</h3>
                                    <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6 }}>{m.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <AnimatedDivider />

            {/* ===== TEAM SPOTLIGHT ===== */}
            <section className="pad-section section-dark">
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <TextReveal><span className="label" style={{ marginBottom: 20, display: 'block' }}>Leadership</span></TextReveal>
                        <TextReveal delay={0.1}><h2 className="display-medium">The <span style={{ color: 'var(--accent)' }}>team</span> behind Aitota.</h2></TextReveal>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
                        {team.map((t, i) => (
                            <motion.div
                                key={t.name}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card"
                                style={{ textAlign: 'center', padding: '40px 24px', borderRadius: 24 }}
                            >
                                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
                                    <div style={{
                                        width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        <t.icon size={40} color="var(--accent)" strokeWidth={1.5} />
                                    </div>
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: 'var(--text-1)' }}>{t.name}</h3>
                                <span className="label" style={{ fontSize: 11, marginBottom: 16, display: 'block', opacity: 0.7 }}>{t.role}</span>
                                <p style={{ color: 'var(--text-3)', fontSize: 14 }}>{t.bio}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section className="pad-section" style={{ position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
                <div className="orb-container">
                    <div className="orb orb-cyan" style={{ bottom: -200, left: '30%', width: 500, height: 500 }} />
                </div>
                <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 2 }}>
                    <h2 className="display-medium" style={{ marginBottom: 24 }}>
                        Ready to transform <span className="gradient-text">your support?</span>
                    </h2>
                    <p className="body-large" style={{ marginBottom: 40, color: 'var(--text-2)' }}>
                        Join the hundreds of businesses upgrading their communication with Aitota Voice AI.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                        <Link to="/contact" className="cta-filled">Get Started</Link>
                    </div>
                </div>
            </section>
        </main>
    )
}
