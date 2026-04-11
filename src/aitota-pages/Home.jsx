import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence, useSpring, useMotionValue, useVelocity, useAnimationFrame } from 'framer-motion'
import { Link } from 'react-router-dom'
import { User, Phone, Megaphone, Bot, Rocket, LineChart, Check, ArrowRight, CircleDashed } from 'lucide-react'
import heroBg from '../aitota-assets/hero-bg.png'
import backCardImg from '../aitota-assets/ai-robot-business-people_173387-6293.avif'
import PowerOfAitota from '../aitota-components/PowerOfAitota'
import processBg from '../aitota-assets/aiRoboticPirot.png'
import MagneticCard from '../aitota-components/MagneticCard'
import MagneticBackground from '../aitota-components/MagneticBackground'
import HeroParticles from '../aitota-components/HeroParticles'

/* ===== SHARED COMPONENTS ===== */


function TextReveal({ children, delay = 0, style = {} }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-50px' })

    return (
        <div ref={ref} style={{ overflow: 'hidden', ...style }}>
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
            >
                {children}
            </motion.div>
        </div>
    )
}

function SplitText({ text, className = '', delay = 0, style = {} }) {
    return (
        <span className={className} style={{ display: 'inline-block', ...style }}>
            {text.split(' ').map((word, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: delay + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    style={{ display: 'inline-block', marginRight: '0.25em' }}
                >
                    {word}
                </motion.span>
            ))}
        </span>
    )
}

function TypewriterEffect({ sentences }) {
    const [text, setText] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [loopNum, setLoopNum] = useState(0)
    const [typingSpeed, setTypingSpeed] = useState(50)

    useEffect(() => {
        const handleType = () => {
            const i = loopNum % sentences.length
            const fullText = sentences[i]

            setText(isDeleting
                ? fullText.substring(0, text.length - 1)
                : fullText.substring(0, text.length + 1)
            )

            setTypingSpeed(isDeleting ? 30 : 50)

            if (!isDeleting && text === fullText) {
                setTimeout(() => setIsDeleting(true), 2000)
            } else if (isDeleting && text === '') {
                setIsDeleting(false)
                setLoopNum(loopNum + 1)
            }
        }

        const timer = setTimeout(handleType, isDeleting ? 30 : 50)
        return () => clearTimeout(timer)
    }, [text, isDeleting, loopNum, sentences]) // Removed typingSpeed from deps to avoid re-triggering logic incorrectly

    return (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-1)', height: 20, textAlign: 'center', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <span>{text}</span>
            <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                style={{ color: 'var(--accent)' }}
            >
                |
            </motion.span>
        </div>
    )
}

/* ===== HERO SECTION ===== */
function HeroSection() {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

    return (
        <section
            ref={ref}
            style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                paddingTop: 80
            }}
            className="hero-gradient"
        >
            {/* Background Image with Overlay */}
            <motion.div style={{ position: 'absolute', inset: 0, zIndex: 0, y }}>
                <img
                    src={heroBg}
                    alt="AI Future"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, filter: 'brightness(1.1)' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, var(--bg) 90%)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, var(--bg) 100%)', opacity: 0.4 }} />
            </motion.div>

            {/* Glowing Orbs */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    style={{ position: 'absolute', top: '20%', left: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, var(--accent-glow), transparent 70%)', filter: 'blur(80px)' }}
                />
                <motion.div
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity }}
                    style={{ position: 'absolute', bottom: '10%', right: '10%', width: '35vw', height: '35vw', background: 'radial-gradient(circle, var(--accent-glow-2), transparent 70%)', filter: 'blur(80px)' }}
                />
            </div>

            <HeroParticles />

            {/* Content */}
            <motion.div
                style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 1200, padding: '0 24px', opacity }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ marginBottom: 32, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}
                >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 10px #00e5ff' }} />
                    <span className="label" style={{ fontSize: 11, letterSpacing: '0.1em' }}>Next Gen AI Automation</span>
                </motion.div>

                <h1 className="display-huge" style={{ marginBottom: 32 }}>
                    Conversational AI <br />
                    <span className="text-gradient-accent">for Businesses</span>
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="body-large"
                    style={{ maxWidth: 600, margin: '0 auto 48px', color: 'var(--text-2)' }}
                >
                    Aitota is revolutionizing communication with cutting-edge conversational AI, connecting people and businesses with AI Voice.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}
                >
                    {/* Try for Free Button */}
                    <Link
                        to="/contact"
                        className="group"
                        style={{
                            background: 'var(--accent)', // Original Gradient
                            color: '#000000ff',
                            padding: '16px 48px', // New Size
                            borderRadius: '100px', // New Style
                            fontSize: '16px',
                            fontWeight: '500',
                            fontFamily: 'monospace',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            letterSpacing: '0.1em',
                            transition: 'all 0.3s ease',
                            // boxShadow: '0 0 20px var(--accent-glow)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 0 40px var(--accent-glow)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 0 20px var(--accent-glow)';
                        }}
                    >
                        Try for Free
                        <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                    </Link>

                    {/* Get in Touch Button */}
                    <a
                        href="https://web.whatsapp.com/send/?phone=8147540362&text=I%20want%20to%20enable%20my%20business%20with%20Aitota.%20My%20name%20is"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                        style={{
                            backgroundColor: 'transparent',
                            color: '#fff',
                            border: '1px solid rgba(255, 255, 255, 0.2)', // Original Outline feel
                            padding: '16px 48px', // New Size
                            borderRadius: '100px', // New Style
                            fontSize: '16px',
                            fontWeight: '500',
                            fontFamily: 'monospace',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            letterSpacing: '0.1em',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#fff';
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        Get in Touch
                        <CircleDashed size={20} strokeWidth={2} className="group-hover:rotate-180 transition-transform duration-700" />
                    </a>
                </motion.div>
            </motion.div>
        </section>
    )
}

/* ===== FEATURES (Glass Cards) ===== */
function AutomationSection() {
    return (
        <section className="section-wrapper" style={{ position: 'relative', background: 'var(--bg)' }}>
            <MagneticBackground />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60, alignItems: 'center', position: 'relative', zIndex: 1 }}>

                {/* Text Content */}
                <div>
                    <TextReveal>
                        <h2 className="display-medium" style={{ marginBottom: 24 }}>
                            Transform <br />
                            <span className="text-gradient-accent">Voice Calls</span>
                        </h2>
                    </TextReveal>
                    <TextReveal delay={0.2}>
                        <p className="body-large" style={{ marginBottom: 40, maxWidth: 500 }}>
                            Manage millions of outbound calls effortlessly. From lead qualification to customer support, Aitota Voice handles it all with human-like precision.
                        </p>
                    </TextReveal>

                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {['Instant Scalability', '0 Sec Latency', 'Human-Like Voices'].map((item, i) => (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 + (i * 0.1) }}
                                style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 18, color: 'var(--text-1)' }}
                            >
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><Check size={14} strokeWidth={3} /></div>
                                {item}
                            </motion.li>
                        ))}
                    </ul>
                </div>

                {/* Visual Graphic - Floating Glass Cards */}
                <div style={{ position: 'relative', height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent 70%)' }} />

                    {/* Back Card */}
                    <motion.div
                        initial={{ y: 40, opacity: 0, scale: 0.9 }}
                        whileInView={{ y: 0, opacity: 1, scale: 1 }}
                        whileHover={{ scale: 0.95, rotate: -2, filter: 'brightness(1.2)' }}
                        transition={{ duration: 1 }}
                        className="glass-card"
                        style={{
                            position: 'absolute',
                            width: 300,
                            height: 400,
                            borderRadius: 24,
                            top: 40,
                            right: 40,
                            zIndex: 1,
                            overflow: 'hidden',
                            padding: 0,
                            cursor: 'pointer'
                        }}
                        data-cursor="card"
                    >
                        <img
                            src={backCardImg}
                            alt="AI Robot"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                opacity: 0.6,
                                filter: 'brightness(0.8) contrast(1.2)',
                                transition: 'transform 0.5s ease'
                            }}
                        />
                    </motion.div>

                    {/* Front Card */}
                    <motion.div
                        initial={{ y: 60, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="glass-card"
                        style={{
                            position: 'relative',
                            width: 340,
                            height: 300,
                            padding: 32,
                            borderRadius: 24,
                            zIndex: 2,
                            background: 'rgba(10, 10, 20, 0.8)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column'
                        }}
                        data-cursor="card"
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            height: 120 // Fixed height for wave area
                        }}>
                            {[...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        height: [30, Math.random() * 120 + 40, 30],
                                        opacity: [0.5, 1, 0.5]
                                    }}
                                    transition={{
                                        duration: 0.8 + Math.random() * 0.4,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: i * 0.05,
                                        repeatType: "reverse"
                                    }}
                                    style={{
                                        width: 6,
                                        borderRadius: 10,
                                        background: 'linear-gradient(to top, var(--accent), var(--accent-2))',
                                        boxShadow: '0 0 10px var(--accent)'
                                    }}
                                />
                            ))}
                        </div>

                        <TypewriterEffect sentences={[
                            "Hello, I am Aitota.",
                            "How can I help you today?",
                            "I can schedule your appointments.",
                            "Let me answer your questions.",
                            "Connecting you to the future."
                        ]} />
                    </motion.div>

                    {/* Floating Badge */}
                    <motion.div
                        animate={{ y: [-10, 10, -10] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        style={{ position: 'absolute', bottom: 100, left: 20, padding: '12px 24px', background: 'var(--bg-elevated)', border: '1px solid var(--accent)', borderRadius: 100, zIndex: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                    >
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>Qualifying Lead...</div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}



/* ===== NEW COMPONENT: BURNING TEXT EFFECT (SIMPLIFIED) ===== */
function BurningText({ text }) {
    return (
        <div
            className="burning-text-item"
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                fontSize: 30,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.03em',
                textTransform: 'uppercase',
                transition: 'all 0.3s ease'
            }}
        >
            <span className="star-icon" style={{
                fontSize: 24,
                color: 'var(--accent)',
                textShadow: '0 0 15px var(--accent)',
                transition: 'transform 0.5s ease'
            }}>✦</span>
            {text}
        </div>
    )
}

/* ===== NEW COMPONENT: INFINITE MARQUEE (CSS Version) ===== */
function LogoMarquee() {
    const brands = ['Telecom', 'E-commerce', 'Banking', 'Healthcare', 'Real Estate', 'Insurance', 'Logistics', 'Education']

    return (
        <section className="section-wrapper" style={{ padding: '60px 0', overflow: 'hidden', background: 'var(--bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 50 }}>
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    whileInView={{ width: 80, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    style={{ height: 1, background: 'linear-gradient(to right, transparent, var(--accent))' }}
                />
                <span className="text-gradient-accent" style={{
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.2em',
                    fontSize: 14,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    textAlign: 'center'
                }}>
                    INDUSTRIES TRANSFORMED
                </span>
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    whileInView={{ width: 80, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    style={{ height: 1, background: 'linear-gradient(to left, transparent, var(--accent-2))' }}
                />
            </div>

            <div style={{ width: '100%', overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
                <div className="marquee-track" style={{ gap: 80, paddingLeft: 40 }}>
                    {/* Render minimal duplicate copies for smooth loop */}
                    {[...brands, ...brands, ...brands, ...brands].map((brand, i) => (
                        <BurningText key={i} text={brand} />
                    ))}
                </div>
            </div>

            <style>{`
                .burning-text-item {
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                
                .burning-text-item:hover {
                    color: #fff !important;
                    text-shadow: 0 0 10px rgba(0, 229, 255, 0.5), 0 0 20px rgba(0, 229, 255, 0.3);
                    transform: scale(1.1) translateX(10px);
                    letter-spacing: 0.05em;
                }

                .burning-text-item:hover .star-icon {
                    transform: rotate(180deg) scale(1.2);
                    color: #fff;
                    text-shadow: 0 0 20px var(--accent), 0 0 40px var(--accent);
                }
                
                /* Dim non-hovered items slightly */
                .marquee-track:hover .burning-text-item:not(:hover) {
                    opacity: 0.3;
                    filter: blur(2px);
                }
            `}</style>
        </section>
    )
}

/* ===== NEW COMPONENT: PROCESS FLOW ===== */
function ProcessFlow() {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start center', 'end center'] })

    // Smooth progress for the line
    const lineProgress = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

    const steps = [
        { title: 'Create Campaign', desc: 'Upload your contacts and define your campaign goals in minutes.', icon: <Megaphone size={20} /> },
        { title: 'Select Your Agent', desc: 'Choose from pre-trained sales, support, or survey agents, or build your own.', icon: <Bot size={20} /> },
        { title: 'Launch Calls', desc: 'Start dialing securely. Scale from 10 to 1 million concurrent calls instantly.', icon: <Rocket size={20} /> },
        { title: 'Monitor & Optimize', desc: 'Live dashboards show you exactly what is working. Improve scripts in real-time.', icon: <LineChart size={20} /> }
    ]

    return (
        <section
            ref={ref}
            style={{
                position: 'relative',
                backgroundColor: '#050510', // Deep luxurious dark background
                overflow: 'hidden',
                padding: '120px 0'
            }}
        >
            {/* AI Voice Animated Background Elements */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                {/* Subtle Grid */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)'
                }} />

                {/* Glowing Orbs */}
                <motion.div
                    animate={{ x: [0, 50, 0], y: [0, -30, 0], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', top: '10%', right: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(0,229,255,0.15), transparent 60%)', filter: 'blur(100px)' }}
                />
                <motion.div
                    animate={{ x: [0, -40, 0], y: [0, 40, 0], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', bottom: '10%', left: '10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent 60%)', filter: 'blur(100px)' }}
                />

                {/* Animated Voice/Sound Waves */}
                <div style={{ position: 'absolute', bottom: '-20%', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', alignItems: 'flex-end', opacity: 0.25, height: '800px', width: '100%', justifyContent: 'center' }}>
                    {[...Array(80)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                height: [100, Math.random() * 700 + 150, 100],
                                opacity: [0.3, 0.8, 0.3]
                            }}
                            transition={{
                                duration: 1.5 + Math.random() * 2.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.05,
                                repeatType: "reverse"
                            }}
                            style={{
                                width: 6,
                                borderRadius: '10px 10px 0 0',
                                background: 'linear-gradient(to top, var(--accent), var(--accent-2))',
                                boxShadow: '0 0 15px var(--accent)'
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="section-wrapper" style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: 100 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, border: '1px solid rgba(0, 229, 255, 0.3)', background: 'rgba(0, 229, 255, 0.05)', marginBottom: 16 }}
                    >
                        <Phone size={14} style={{ color: 'var(--accent)' }} />
                        <span className="label" style={{ color: 'var(--accent)', margin: 0 }}>AI Call Setup</span>
                    </motion.div>
                    
                    <h2 className="display-medium" style={{ marginTop: 0 }}>
                        Launch in <span className="text-gradient-accent">Minutes</span>
                    </h2>
                    <p className="body-large" style={{ color: 'var(--text-2)', maxWidth: 600, margin: '20px auto 0' }}>
                        Transform your communication workflow instantly. Our AI agents are ready to deploy to handle your calls.
                    </p>
                </div>

                <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', paddingLeft: 20 }}>
                    {/* Vertical Line Container */}
                    <div style={{
                        position: 'absolute', left: 40, top: 0, bottom: 0, width: 2,
                        background: 'rgba(255,255,255,0.05)', borderRadius: 4
                    }} />

                    {/* Animated Line Fill */}
                    <motion.div style={{
                        position: 'absolute', left: 40, top: 0, width: 2,
                        background: 'linear-gradient(to bottom, var(--accent), var(--accent-2))',
                        height: lineProgress,
                        boxShadow: '0 0 20px var(--accent)',
                        borderRadius: 4,
                        zIndex: 1
                    }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 120, paddingBottom: 100 }}>
                        {steps.map((step, i) => (
                            <StepCard key={i} step={step} index={i} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

function StepCard({ step, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
                display: 'flex', alignItems: 'flex-start', gap: 60,
                position: 'relative'
            }}
        >
            {/* Node on line */}
            <div style={{
                position: 'absolute', left: 0, top: 0,
                width: 40, height: 40, borderRadius: '50%',
                background: '#050510',
                border: '2px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-3)', fontWeight: 700, zIndex: 2,
                boxShadow: '0 0 0 8px #050510' // Masking effect
            }}>
                {step.icon}
            </div>

            {/* Active Node Highlight (Animated) */}
            <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: '-20%' }}
                transition={{ delay: 0.2, type: 'spring' }}
                style={{
                    position: 'absolute', left: 0, top: 0,
                    width: 40, height: 40, borderRadius: '50%',
                    border: '2px solid var(--accent)',
                    zIndex: 3, pointerEvents: 'none'
                }}
                data-cursor="card"
            />

            <div className="glass-card" style={{ padding: 32, flex: 1, borderRadius: 24, marginLeft: 20 }}>
                <h3 style={{ fontSize: 24, marginBottom: 12, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-1)' }}>{step.title}</h3>
                <p style={{ color: 'var(--text-2)', lineHeight: 1.6, fontSize: 16 }}>{step.desc}</p>
            </div>
        </motion.div>
    )
}

/* ===== INTEGRATIONS SECTION ===== */
/* ===== INTEGRATIONS SECTION ===== */
function IntegrationsSection() {
    // Icons as React Components or SVG strings for reliability
    const icons = {
        Notion: <svg viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M4.364 2.378L.962 3.653A.436.436 0 0 0 .7 4.195v16.738a.434.434 0 0 0 .584.397l3.87-1.452a.435.435 0 0 0 .285-.407V2.783a.435.435 0 0 0-.819-.34l-.256-.065zm18.42 2.603l-4.708-2.673a.436.436 0 0 0-.482.029l-6.223 4.15a.436.436 0 0 0-.194.364v15.82a.436.436 0 0 0 .659.375l4.89-2.73a.435.435 0 0 0 .227-.38V8.63a.566.566 0 0 1 .53-.518c.288-.01.53.21.53.5v9.54c0 .35.39.55.68.35l4.63-3.13a.436.436 0 0 0 .193-.362v-9.5c0-.28-.27-.47-.53-.5z" /></svg>,
        Slack: <svg viewBox="0 0 24 24" fill="#E01E5A" xmlns="http://www.w3.org/2000/svg"><path d="M5.042 15.165a2.528 2.528 0 1 0 2.528 2.528V15.165zM15.165 18.953a2.528 2.528 0 1 1-2.528-2.528 2.528 2.528 0 0 1 2.528 2.528zM12.637 5.042a2.528 2.528 0 1 0-2.528 2.528 2.528 2.528 0 0 0 2.528-2.528zM8.849 1.258a2.528 2.528 0 1 1-2.528 2.528V1.258zM18.953 8.849a2.528 2.528 0 1 0-2.528-2.528 2.528 2.528 0 0 0 2.528 2.528zM15.165 5.042a2.528 2.528 0 1 1 2.528 2.528H15.165zM8.849 18.953a2.528 2.528 0 1 0 2.528-2.528H8.849zM5.042 12.637a2.528 2.528 0 1 1 2.528-2.528 2.528 2.528 0 0 1-2.528 2.528z" /></svg>,
        'Google Drive': <svg viewBox="0 0 24 24" fill="#4285F4" xmlns="http://www.w3.org/2000/svg"><path d="M23.447 15.22L15.3 1.11a.48.48 0 0 0-.825 0l-4.132 7.16h8.216zM8.7 7.02l-4.135 7.163H12.8zM.553 15.22a.48.48 0 0 0 .412.72h16.29L9.122 1.83z" /><path fill="#34A853" d="M8.7 7.019L.553 15.22a.48.48 0 0 0 .412.72h8.188L16.917 2.11z" /><path fill="#FBBC04" d="M23.447 15.22a.48.48 0 0 1-.412.72H12.98L20.92 2.1z" /><path fill="#EA4335" d="M12.98 15.94H4.708l4.417 7.643h8.27zm-3.855 7.643l4.27-7.397L17.266 23.9z" /></svg>,
        Linear: <svg viewBox="0 0 24 24" fill="#5E6AD2" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.8 17.55l.892-1.784c.14-.282.268-.42.486-.42h2.956c-.524 0-.883.473-.64.958l1.375 2.75a.707.707 0 0 0 .633.39h2.365a.434.434 0 0 0 .388-.629l-3.23-6.46a.71.71 0 0 0-.635-.39h-2.956c.524 0 .883-.473.64-.959L11.1 8.257a.707.707 0 0 0-.633-.39H8.102a.434.434 0 0 0-.388.629l3.23 6.46a.71.71 0 0 0 .635.39h-1.38z" /></svg>,
        Teams: <svg viewBox="0 0 24 24" fill="#6264A7" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 6.75a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0ZM5.25 8.25a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0ZM8 14.5a3 3 0 0 0 2.8-2H5.2c-.85 0-1.6.35-2.2.9V18h5v-3.5ZM17 12.5h-4.5c-1.4 0-2.5 1.1-2.5 2.5V20H20v-5c0-1.4-1.1-2.5-2.5-2.5Z" /></svg>,
        Zoom: <svg viewBox="0 0 24 24" fill="#2D8CFF" xmlns="http://www.w3.org/2000/svg"><path d="M2.3 10.3c.2-2.3 2-4.1 4.3-4.1h7.4c2.3 0 4.1 1.8 4.3 4.1v5.4c-.2 2.3-2 4.1-4.3 4.1H6.6c-2.3 0-4.1-1.8-4.3-4.1v-5.4zm16.5-1.9v9.2l4.7 2.6c.3.2.7 0 .7-.4V6.2c0-.4-.4-.6-.7-.4l-4.7 2.6z" /></svg>,
        HubSpot: <svg viewBox="0 0 24 24" fill="#FF7A59" xmlns="http://www.w3.org/2000/svg"><path d="M9.6 12a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0zm6.6 6.6a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0zm0-13.2a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0zm6.6 6.6a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0z" /></svg>,
        Salesforce: <svg viewBox="0 0 24 24" fill="#00A1E0" xmlns="http://www.w3.org/2000/svg"><path d="M16 4.2c-1.7 0-3.2.7-4.3 1.9-.3-.5-.7-.9-1.2-1.3-.9-.6-2-.9-3.1-.9-3.3 0-6 2.7-6 6 0 1.1.3 2.1.8 3-.8.7-1.3 1.7-1.3 2.9 0 2.2 1.8 4 4 4h12c2.8 0 5-2.2 5-5 0-2.7-2.1-4.9-4.8-5-.2-3.1-2.8-5.6-5.9-5.6h-.2z" /></svg>,
        Zendesk: <svg viewBox="0 0 24 24" fill="#03363D" xmlns="http://www.w3.org/2000/svg"><path d="M12.7 13.9l-2-2.8c-.8.6-1.5 1.5-1.9 2.5h-4c1.1-3 3.5-5.3 6.6-6.1l.6 3.4c.2 1 .4 2.1.7 3zm5.7-8.3C15.8 5.6 13.5 8 12.7 11.2l-.7-3.6c-.2-.9-.4-1.9-.7-2.9l2.1 3c.8-.7 1.6-1.5 2-2.6h4c-1.2 3.1-3.6 5.5-6.8 6.3l-.6-3.4c-.2-.9-.4-1.9-.7-2.9zM5.5 18.5c2.6 0 4.9-2.3 5.7-5.6l.7 3.5c.2 1 .4 2.1.7 3.2L10.5 16c-.9.7-1.8 1.5-2.2 2.6H4.3c1.2-3.2 3.7-5.6 6.9-6.4l.6 3.3c.2.9.4 1.8.7 2.8l-2.1-3c-.8.7-1.6 1.5-2.1 2.7H4.3z" /></svg>,
        Jira: <svg viewBox="0 0 24 24" fill="#0052CC" xmlns="http://www.w3.org/2000/svg"><path d="M11.5 0C5.1 0 0 5.1 0 11.5v1H11.5V0z m0 12.5H0v1C0 19.9 5.1 25 11.5 25h1V12.5h-1z m1 0V25h1c6.4 0 11.5-5.1 11.5-11.5V12.5H12.5z" /></svg>,
        Asana: <svg viewBox="0 0 24 24" fill="#F06A6A" xmlns="http://www.w3.org/2000/svg"><g><circle cx="12" cy="5.5" r="3.5" /><circle cx="19.5" cy="18.5" r="3.5" /><circle cx="4.5" cy="18.5" r="3.5" /></g></svg>,
        Trello: <svg viewBox="0 0 24 24" fill="#0079BF" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="3" /><rect x="5" y="5" width="6" height="10" rx="1" fill="#fff" /><rect x="13" y="5" width="6" height="6" rx="1" fill="#fff" /></svg>,
        Monday: <svg viewBox="0 0 24 24" fill="#FF3D00" xmlns="http://www.w3.org/2000/svg"><path d="M20 2c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h16zM8 17h2.5l1.5-4.2 1.5 4.2H16V7h-2.5v5.8L12 8.5 10.5 12.8V7H8v10z" /></svg>,
        Figma: <svg viewBox="0 0 24 24" fill="#F24E1E" xmlns="http://www.w3.org/2000/svg"><path d="M6 12a3 3 0 1 0 3 3 3 3 0 0 0-3-3m0-6a3 3 0 1 0 3 3 3 3 0 0 0-3-3m6 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6m6-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m0 6a3 3 0 1 0 0 6v-6h-3" /></svg>
    }

    const row1 = ['Notion', 'Slack', 'Google Drive', 'Linear', 'Teams', 'Zoom', 'HubSpot']
    const row2 = ['Salesforce', 'Zendesk', 'Jira', 'Asana', 'Trello', 'Monday', 'Figma']

    return (
        <section className="section-wrapper" style={{ overflow: 'hidden', padding: '100px 0', background: 'var(--bg)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 80, alignItems: 'center', padding: '0 24px' }}>

                {/* Left: Isometric Abstract Design */}
                <div style={{ position: 'relative', height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                    {/* Background Glow */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15), transparent 70%)',
                        zIndex: 0
                    }} />

                    {/* Isometric Grid Container */}
                    <div style={{
                        transform: 'rotateX(60deg) rotateZ(-45deg) scale(1.8)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(8, 1fr)',
                        gap: 24,
                        zIndex: 1
                    }}>
                        {/* Generate a grid of "Pills" */}
                        {[...Array(64)].map((_, i) => {
                            // Randomly highlight some pills
                            const isActive = [10, 15, 18, 22, 29, 35, 42, 49, 53].includes(i);
                            const isGlowing = [10, 18, 29, 35, 49, 53].includes(i);

                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0.2, scale: 1 }}
                                    animate={isActive ? {
                                        opacity: [0.4, 1, 0.4],
                                        y: [0, -10, 0],
                                        backgroundColor: isGlowing ? ['#8b5cf6', '#00e5ff', '#8b5cf6'] : 'rgba(255,255,255,0.1)'
                                    } : {
                                        backgroundColor: 'rgba(255,255,255,0.05)'
                                    }}
                                    whileHover={{
                                        scale: 1.8,
                                        zIndex: 100,
                                        backgroundColor: '#00e5ff',
                                        boxShadow: '0 0 30px #00e5ff, 0 0 60px #8b5cf6',
                                        opacity: 1,
                                        y: -15
                                    }}
                                    transition={{
                                        duration: isActive ? 3 + Math.random() * 2 : 0.3,
                                        repeat: isActive ? Infinity : 0,
                                        delay: isActive ? Math.random() * 2 : 0
                                    }}
                                    style={{
                                        width: 16,
                                        height: 40, // Increased pill size
                                        borderRadius: 12,
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        cursor: 'pointer'
                                    }}
                                />
                            )
                        })}
                    </div>
                </div>

                {/* Right: Content & Icons */}
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="label"
                        style={{ color: 'var(--accent)', marginBottom: 16, display: 'block', letterSpacing: '0.2em' }}
                    >
                        INTEGRATIONS
                    </motion.span>

                    <TextReveal>
                        <h2 className="display-medium" style={{ marginBottom: 24, fontSize: '3.5rem' }}>
                            Integrate with <br />
                            <span style={{ color: '#fff' }}>40+ apps.</span>
                        </h2>
                    </TextReveal>

                    <TextReveal delay={0.2}>
                        <p className="body-large" style={{ color: 'var(--text-2)', marginBottom: 50, maxWidth: 500 }}>
                            Connect Aitota with your favorite tools. Sync contacts, trigger calls from CRMs, and push logs directly to your database.
                        </p>
                    </TextReveal>

                    {/* Moving Icons Rows - Placed UNDER TEXT */}
                    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>

                        {/* Row 1: Left Movement */}
                        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                            <motion.div
                                animate={{ x: ["0%", "-50%"] }}
                                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                style={{ display: 'flex', gap: 16, width: 'max-content' }}
                            >
                                {[...row1, ...row1, ...row1, ...row1].map((appName, i) => (
                                    <div key={i} className="glass-card" style={{
                                        width: 70, height: 70, borderRadius: 18,
                                        padding: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.08)'
                                    }}>
                                        <div style={{ width: 32, height: 32 }}>
                                            {icons[appName]}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Row 2: Right Movement */}
                        <div style={{ display: 'flex', gap: 16 }}>
                            <motion.div
                                animate={{ x: ["-50%", "0%"] }}
                                transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                                style={{ display: 'flex', gap: 16, width: 'max-content' }}
                            >
                                {[...row2, ...row2, ...row2, ...row2].map((appName, i) => (
                                    <div key={i} className="glass-card" style={{
                                        width: 70, height: 70, borderRadius: 18,
                                        padding: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.08)'
                                    }}>
                                        <div style={{ width: 32, height: 32 }}>
                                            {icons[appName]}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    )
}

/* ===== MAIN COMPONENT ===== */
export default function Home() {
    return (
        <main style={{ background: 'var(--bg)', color: 'var(--text-1)', minHeight: '100vh' }}>
            <HeroSection />
            <LogoMarquee />
            <AutomationSection />
            <ProcessFlow />
            <PowerOfAitota />
            <IntegrationsSection />

            {/* Call to Action Footer Section */}
            <section className="section-wrapper" style={{ textAlign: 'center', padding: '160px 24px', background: 'var(--bg)' }}>
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                    <h2 className="display-medium" style={{ marginBottom: 32 }}>
                        Ready to Automate Your <br /> Calling?
                    </h2>
                    <p className="body-large" style={{ marginBottom: 48, color: 'var(--text-3)' }}>
                        Join the businesses saving thousands of hours with Aitota.
                    </p>

                    {/* Contact Form */}
                    <div style={{ maxWidth: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ position: 'relative' }}>
                            <User
                                size={20}
                                style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}
                            />
                            <input
                                type="text"
                                placeholder="Enter Your Name"
                                style={{
                                    width: '100%',
                                    padding: '16px 16px 16px 56px',
                                    borderRadius: 16,
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'var(--text-1)',
                                    fontSize: 16,
                                    outline: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--accent)';
                                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                }}
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <Phone
                                size={20}
                                style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}
                            />
                            <input
                                type="tel"
                                placeholder="Enter Mobile Number"
                                style={{
                                    width: '100%',
                                    padding: '16px 16px 16px 56px',
                                    borderRadius: 16,
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'var(--text-1)',
                                    fontSize: 16,
                                    outline: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--accent)';
                                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                }}
                            />
                        </div>

                        <button
                            className="btn-primary"
                            style={{
                                width: '100%',
                                padding: '16px',
                                fontSize: 18,
                                borderRadius: 16,
                                marginTop: 8
                            }}
                        >
                            Get a Call
                        </button>
                    </div>
                </div>
            </section>
        </main>
    )
}
