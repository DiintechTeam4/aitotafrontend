import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence, useScroll, useSpring, useTransform, useMotionValue, useVelocity, useAnimationFrame } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Brain, MessageSquare, Volume2, FileText, Smile, Zap, Phone, RefreshCw, Bot, Palette, Shield, Plug, BarChart3, Lock, TrendingUp } from 'lucide-react'
import heroImg from '../aitota-assets/cartoon-ai-robot-scene_23-2151675027.avif'

/* Velocity Scroll Logic */
const wrap = (min, max, v) => {
    const rangeSize = max - min
    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min
}

function VelocityScrollList({ children, baseVelocity = 100 }) {
    const baseX = useMotionValue(0)
    const { scrollY } = useScroll()
    const scrollVelocity = useVelocity(scrollY)
    const smoothVelocity = useSpring(scrollVelocity, {
        damping: 50,
        stiffness: 400
    })
    const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
        clamp: false
    })

    // Wraps between 0% and -25% (since we render 4 copies, 1 copy is 25% of total width)
    const x = useTransform(baseX, (v) => `${wrap(0, -25, v)}%`)

    const directionFactor = useRef(1)
    useAnimationFrame((t, delta) => {
        let moveBy = directionFactor.current * baseVelocity * (delta / 1000)

        // Change direction based on scroll direction
        if (velocityFactor.get() < 0) {
            directionFactor.current = -1
        } else if (velocityFactor.get() > 0) {
            directionFactor.current = 1
        }

        moveBy += directionFactor.current * moveBy * velocityFactor.get()
        baseX.set(baseX.get() + moveBy)
    })

    return (
        <div className="parallax" style={{ overflow: 'hidden', margin: 0, padding: '20px 0', width: '100%' }}>
            <motion.div className="scroller" style={{ x, display: 'flex', gap: '30px', flexWrap: 'nowrap', width: 'max-content' }}>
                {children}
                {children}
                {children}
                {children}
            </motion.div>
        </div>
    )
}

function TextReveal({ children, delay = 0, style = {} }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-80px' })
    return (
        <div ref={ref} style={{ overflow: 'hidden', ...style }}>
            <motion.div initial={{ y: '110%', rotate: 2 }} animate={isInView ? { y: 0, rotate: 0 } : {}} transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}>
                {children}
            </motion.div>
        </div>
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

const categories = [
    {
        label: 'Voice AI Engine',
        icon: Brain,
        desc: 'The brain behind every conversation. Human-like understanding and response.',
        features: [
            { icon: MessageSquare, title: 'Conversation Intelligence', desc: 'Understand intent, context, and nuance in real-time conversations across 40+ languages.', num: '01', details: ['Context retention', 'Intent classification', 'Multi-turn dialog', 'Interrupt handling'] },
            { icon: Volume2, title: 'Neural Voice Synthesis', desc: 'Ultra-realistic AI voices that sound indistinguishable from humans, with emotional control.', num: '02', details: ['Custom voice cloning', 'Emotion adaptation', 'Accent localization', 'Sub-second latency'] },
            { icon: FileText, title: 'Real-time Transcription', desc: 'Convert speech to text instantly with high accuracy for immediate processing and storage.', num: '03', details: ['98% accuracy', 'Speaker diarization', 'Vocabulary adaptation', 'PII redaction'] },
            { icon: Smile, title: 'Sentiment Analysis', desc: 'Detect customer mood and objections live during the call to guide the AI\'s response.', num: '04', details: ['Tone analysis', 'Objection handling', 'Satisfaction scoring', 'Crisis detection'] },
        ],
    },
    {
        label: 'Campaign Manager',
        icon: Zap,
        desc: 'Orchestrate millions of outbound calls with precision and scale.',
        features: [
            { icon: Phone, title: 'Smart Auto-Dialer', desc: 'Predictive dialing that maximizes connection rates and minimizes idle time.', num: '05', details: ['Answering machine detection', 'Timezone optimization', 'Retry logic', 'Local presence'] },
            { icon: RefreshCw, title: 'High Concurrency', desc: 'Scale from 10 to 10,000 concurrent calls instantly. Handle massive campaigns with ease.', num: '06', details: ['Elastic infrastructure', 'Load balancing', 'Traffic shaping', 'Zero warmup'] },
            { icon: Bot, title: 'Agent Templates', desc: 'Deploy pre-trained agents for sales, support, or surveys in minutes.', num: '07', details: ['Sales qualification', 'Appointment setting', 'Survey collection', 'Payment collection'] },
            { icon: Palette, title: 'Flow Builder', desc: 'Design complex conversation flows visually. Drag, drop, deploy. No coding required.', num: '08', details: ['Visual editor', 'Logic branching', 'API triggers', 'Variable management'] },
        ],
    },
    {
        label: 'Enterprise Control',
        icon: Shield,
        desc: 'Advanced tools for teams to manage, monitor, and integrate.',
        features: [
            { icon: Plug, title: 'CRM Integrations', desc: 'Seamlessly sync contacts and call logs with Salesforce, HubSpot, Zoho, and more.', num: '09', details: ['Two-way sync', 'Custom field mapping', 'Activity logging', 'Workflow triggers'] },
            { icon: BarChart3, title: 'Live Monitoring', desc: 'Listen to active calls, takeover when needed, and view real-time campaign stats.', num: '10', details: ['Call barging', 'Whisper mode', 'Live dashboard', 'Agent status'] },
            { icon: Lock, title: 'Compliance Suite', desc: 'Stay compliant with global telecom regulations automatically.', num: '11', details: ['DND checking', 'Call recording consent', 'Frequency capping', 'Audit logs'] },
            { icon: TrendingUp, title: 'Deep Analytics', desc: 'Comprehensive reports on call duration, success rates, and conversation outcomes.', num: '12', details: ['Conversion tracking', 'Cost analysis', 'Disposition reports', 'Export to CSV'] },
        ],
    },
]

/* Interactive feature demo mockup */
function FeatureDemo() {
    const [activeTab, setActiveTab] = useState(0)
    const tabs = [
        { label: 'Outbound', code: 'aitota.campaign.start(\n  name="Lead_Qualify_Q3",\n  target_group="warm_leads",\n  agent="Sophie_Sales_v2",\n  concurrency=500\n)', result: '{\n  "status": "active",\n  "contacts_queued": 15420,\n  "est_completion": "2h 15m",\n  "calls_active": 482\n}' },
        { label: 'Analysis', code: 'aitota.call.analyze(\n  call_id="c_892341",\n  metrics=["sentiment",\n           "objections",\n           "outcome"]\n)', result: '{\n  "sentiment": "positive",\n  "outcome": "meeting_booked",\n  "objections_handled": 2,\n  "satisfaction_score": 9.5\n}' },
        { label: 'Voice', code: 'aitota.voice.synthesize(\n  text="Hi John, this is Sarah...",\n  voice_id="en_us_sarah",\n  emotion="excited"\n)', result: '{\n  "audio_url": "https://...",\n  "duration": 4.2,\n  "visemes": [...],\n  "latency_ms": 120\n}' },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-panel-dark"
            style={{ padding: 0, overflow: 'hidden', maxWidth: 900, margin: '0 auto' }}
        >
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
                {tabs.map((tab, i) => (
                    <button
                        key={tab.label}
                        onClick={() => setActiveTab(i)}
                        data-cursor
                        style={{
                            flex: 1, padding: '14px 20px', border: 'none',
                            background: i === activeTab ? 'rgba(0,229,255,0.05)' : 'transparent',
                            color: i === activeTab ? 'var(--accent)' : 'var(--text-3)',
                            fontFamily: 'var(--font-mono)', fontSize: 12,
                            fontWeight: 600, letterSpacing: '0.05em',
                            transition: 'all 0.3s',
                            borderBottom: i === activeTab ? '2px solid var(--accent)' : '2px solid transparent',
                            cursor: 'pointer',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Code panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 260 }} className="demo-grid">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        style={{ padding: 24, borderRight: '1px solid var(--border)' }}
                    >
                        <span className="label" style={{ color: 'var(--text-3)', fontSize: 9, marginBottom: 12, display: 'block' }}>Request</span>
                        <pre style={{
                            fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.8,
                            color: 'var(--accent)', whiteSpace: 'pre-wrap',
                        }}>
                            {tabs[activeTab].code}
                        </pre>
                    </motion.div>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`result-${activeTab}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, delay: 0.15 }}
                        style={{ padding: 24 }}
                    >
                        <span className="label" style={{ color: 'var(--text-3)', fontSize: 9, marginBottom: 12, display: 'block' }}>Response</span>
                        <pre style={{
                            fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.8,
                            color: 'var(--accent-3)', whiteSpace: 'pre-wrap',
                        }}>
                            {tabs[activeTab].result}
                        </pre>
                    </motion.div>
                </AnimatePresence>
            </div>

            <style>{`
                @media (max-width: 600px) {
                    .demo-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </motion.div>
    )
}

export default function Features() {
    const [expandedCard, setExpandedCard] = useState(null)

    return (
        <main>
            {/* ===== HERO ===== */}
            <section style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                padding: '0 clamp(28px, 6vw, 100px)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Hero Image */}
                <motion.div
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 0,
                    }}
                >
                    <img
                        src={heroImg}
                        alt=""
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 1.95, // Increased visibility
                            filter: 'brightness(1.1) contrast(1.1)',
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(135deg, rgba(5,5,16,0.8), rgba(10,10,26,0.9))',
                    }} />
                </motion.div>

                <div className="orb-container">
                    <div className="orb orb-cyan" style={{ top: -200, left: -200, width: 500, height: 500 }} />
                    <div className="orb orb-purple" style={{ bottom: -100, right: -100, width: 400, height: 400 }} />
                </div>
                <div className="grid-bg" />

                <div style={{ maxWidth: 1000, position: 'relative', zIndex: 2, paddingTop: 120 }}>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <span className="label" style={{ marginBottom: 24, display: 'block' }}>Platform Capabilities</span>
                    </motion.div>
                    <TextReveal><h1 className="display-large" style={{ fontSize: 'clamp(2rem, 6vw, 5rem)' }}>Automate your</h1></TextReveal>
                    <TextReveal delay={0.1}><h1 className="display-large" style={{ fontSize: 'clamp(2rem, 6vw, 5rem)' }}><span style={{ color: 'var(--accent)' }}>communications.</span></h1></TextReveal>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="body-large"
                        style={{ maxWidth: 550, marginTop: 32 }}
                    >
                        A complete AI voice platform for automated calling, lead qualification, and customer support at scale.
                    </motion.p>
                </div>
            </section>

            <AnimatedDivider />

            {/* ===== INTERACTIVE DEMO ===== */}
            <section className="pad-section section-dark">
                <div style={{ position: 'relative' }}>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <TextReveal><span className="label" style={{ marginBottom: 20, display: 'block' }}>Live Interaction</span></TextReveal>
                        <TextReveal delay={0.1}><h2 className="display-medium">See automation in <span className="gradient-text">action.</span></h2></TextReveal>
                    </div>
                    <FeatureDemo />
                </div>
            </section>

            <AnimatedDivider />

            {/* ===== FEATURE CATEGORIES ===== */}
            {categories.map((cat, ci) => (
                <div key={cat.label}>
                    <section className={ci % 2 === 0 ? 'pad-section section-light' : 'pad-section section-dark'}>
                        <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative' }}>
                            {/* Category header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                                <motion.span
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                    style={{ fontSize: 40 }}
                                >
                                    <cat.icon size={40} color="var(--accent)" strokeWidth={1.5} />
                                </motion.span>
                                <TextReveal>
                                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 700 }}>{cat.label}</h2>
                                </TextReveal>
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                    style={{ flex: 1, height: 1, background: 'var(--border)', transformOrigin: 'left' }}
                                />
                            </div>
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                className="body-large"
                                style={{ marginBottom: 48, maxWidth: 500 }}
                            >
                                {cat.desc}
                            </motion.p>

                            <div style={{
                                display: cat.label === 'Voice AI Engine' ? 'block' : 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: 20
                            }}>
                                {cat.label === 'Voice AI Engine' ? (
                                    <VelocityScrollList baseVelocity={2}>
                                        <div style={{ display: 'flex', gap: 20 }}>
                                            {cat.features.map((f, i) => {
                                                const cardId = `${cat.label}-${f.num}`
                                                const isExpanded = expandedCard === cardId
                                                return (
                                                    <div key={f.title} style={{ width: 400, flexShrink: 0 }}>
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 30 }}
                                                            whileInView={{ opacity: 1, y: 0 }}
                                                            viewport={{ once: true }}
                                                            transition={{ delay: i * 0.08 }}
                                                            onClick={() => setExpandedCard(isExpanded ? null : cardId)}
                                                            style={{
                                                                position: 'relative',
                                                                padding: 'clamp(32px, 3vw, 44px)',
                                                                borderRadius: 'var(--radius-xl)',
                                                                background: 'linear-gradient(145deg, rgba(0,229,255,0.04) 0%, rgba(5,5,16,0.8) 50%, rgba(139,92,246,0.04) 100%)',
                                                                border: '1px solid rgba(255,255,255,0.06)',
                                                                overflow: 'hidden',
                                                                cursor: 'pointer',
                                                                height: '100%',
                                                                minHeight: 380, // Consistent height for row
                                                                transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1)',
                                                            }}
                                                            whileHover={{
                                                                y: -8,
                                                                borderColor: 'rgba(0,229,255,0.2)',
                                                                boxShadow: '0 30px 80px rgba(0,0,0,0.3), 0 0 40px rgba(0,229,255,0.08)',
                                                            }}
                                                        >
                                                            {/* Animated gradient orb */}
                                                            <motion.div
                                                                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                                                                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: -60,
                                                                    right: -60,
                                                                    width: 180,
                                                                    height: 180,
                                                                    borderRadius: '50%',
                                                                    background: 'radial-gradient(circle, rgba(0,229,255,0.15), transparent)',
                                                                    filter: 'blur(50px)',
                                                                    pointerEvents: 'none',
                                                                }}
                                                            />

                                                            {/* Watermark */}
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: -15,
                                                                right: 10,
                                                                fontFamily: 'var(--font-display)',
                                                                fontSize: 140,
                                                                fontWeight: 900,
                                                                color: 'rgba(255,255,255,0.015)',
                                                                lineHeight: 0.8,
                                                                pointerEvents: 'none',
                                                            }}>
                                                                {f.num}
                                                            </div>

                                                            {/* Animated icon */}
                                                            <motion.div
                                                                animate={{ y: [0, -5, 0] }}
                                                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                                                                style={{
                                                                    fontSize: 48,
                                                                    marginBottom: 20,
                                                                    filter: 'drop-shadow(0 0 20px rgba(0,229,255,0.3))',
                                                                }}
                                                            >
                                                                <f.icon size={48} color="var(--accent)" strokeWidth={1} />
                                                            </motion.div>

                                                            <span className="label" style={{ color: 'var(--accent)', marginBottom: 12, display: 'block', fontSize: 10 }}>
                                                                Feature {f.num}
                                                            </span>

                                                            <h3 style={{
                                                                fontFamily: 'var(--font-display)',
                                                                fontSize: 22,
                                                                fontWeight: 700,
                                                                marginBottom: 12,
                                                                lineHeight: 1.15,
                                                                color: 'var(--text-1)',
                                                            }}>
                                                                {f.title}
                                                            </h3>

                                                            <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
                                                        </motion.div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </VelocityScrollList>
                                ) : (
                                    cat.features.map((f, i) => {
                                        const cardId = `${cat.label}-${f.num}`
                                        const isExpanded = expandedCard === cardId
                                        return (
                                            <motion.div
                                                key={f.title}
                                                initial={{ opacity: 0, y: 30 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.08 }}
                                                onClick={() => setExpandedCard(isExpanded ? null : cardId)}
                                                style={{
                                                    position: 'relative',
                                                    padding: 'clamp(32px, 3vw, 44px)',
                                                    borderRadius: 'var(--radius-xl)',
                                                    background: 'linear-gradient(145deg, rgba(0,229,255,0.04) 0%, rgba(5,5,16,0.8) 50%, rgba(139,92,246,0.04) 100%)',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1)',
                                                }}
                                                whileHover={{
                                                    y: -8,
                                                    borderColor: 'rgba(0,229,255,0.2)',
                                                    boxShadow: '0 30px 80px rgba(0,0,0,0.3), 0 0 40px rgba(0,229,255,0.08)',
                                                }}
                                            >
                                                {/* Animated gradient orb */}
                                                <motion.div
                                                    animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                                                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: -60,
                                                        right: -60,
                                                        width: 180,
                                                        height: 180,
                                                        borderRadius: '50%',
                                                        background: 'radial-gradient(circle, rgba(0,229,255,0.15), transparent)',
                                                        filter: 'blur(50px)',
                                                        pointerEvents: 'none',
                                                    }}
                                                />

                                                {/* Watermark */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: -15,
                                                    right: 10,
                                                    fontFamily: 'var(--font-display)',
                                                    fontSize: 140,
                                                    fontWeight: 900,
                                                    color: 'rgba(255,255,255,0.015)',
                                                    lineHeight: 0.8,
                                                    pointerEvents: 'none',
                                                }}>
                                                    {f.num}
                                                </div>

                                                {/* Animated icon */}
                                                <motion.div
                                                    animate={{ y: [0, -5, 0] }}
                                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                                                    style={{
                                                        fontSize: 48,
                                                        marginBottom: 20,
                                                        filter: 'drop-shadow(0 0 20px rgba(0,229,255,0.3))',
                                                    }}
                                                >
                                                    <f.icon size={48} color="var(--accent)" strokeWidth={1} />
                                                </motion.div>

                                                <span className="label" style={{ color: 'var(--accent)', marginBottom: 12, display: 'block', fontSize: 10 }}>
                                                    Feature {f.num}
                                                </span>

                                                <h3 style={{
                                                    fontFamily: 'var(--font-display)',
                                                    fontSize: 22,
                                                    fontWeight: 700,
                                                    marginBottom: 12,
                                                    lineHeight: 1.15,
                                                    color: 'var(--text-1)',
                                                }}>
                                                    {f.title}
                                                </h3>

                                                <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>

                                                {/* Expandable details */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                                            style={{ overflow: 'hidden' }}
                                                        >
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                                {f.details.map((d) => (
                                                                    <span key={d} style={{
                                                                        padding: '8px 16px',
                                                                        borderRadius: 100,
                                                                        background: 'rgba(0,229,255,0.08)',
                                                                        border: '1px solid rgba(0,229,255,0.15)',
                                                                        fontSize: 11,
                                                                        color: 'var(--accent)',
                                                                        fontFamily: 'var(--font-mono)',
                                                                        fontWeight: 500,
                                                                    }}>
                                                                        {d}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Expand indicator */}
                                                <div style={{
                                                    marginTop: 20,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    color: 'var(--text-3)',
                                                    fontSize: 11,
                                                    fontFamily: 'var(--font-mono)',
                                                }}>
                                                    <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>▼</motion.span>
                                                    {isExpanded ? 'Less' : 'Details'}
                                                </div>

                                                {/* Bottom glow */}
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: 3,
                                                    background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.4), transparent)',
                                                    opacity: 0.6,
                                                }} />
                                            </motion.div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </section>
                    {ci < categories.length - 1 && <AnimatedDivider />}
                </div>
            ))}

            <AnimatedDivider />

            {/* ===== COMPARISON TABLE ===== */}
            <section className="pad-section section-dark">
                <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
                    <div className="orb-container">
                        <div className="orb orb-cyan" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500 }} />
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        <TextReveal><span className="label" style={{ marginBottom: 20, display: 'block' }}>Comparison</span></TextReveal>
                        <TextReveal delay={0.1}><h2 className="display-medium">Why <span style={{ color: 'var(--accent)' }}>Aitota?</span></h2></TextReveal>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-panel-dark"
                        style={{ overflow: 'hidden', padding: 0 }}
                    >
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
                                    <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: 12 }} className="label">Metric</th>
                                    <th style={{ padding: '18px 24px', textAlign: 'center', color: 'var(--accent)', fontSize: 12 }} className="label">Aitota Agents</th>
                                    <th style={{ padding: '18px 24px', textAlign: 'center', fontSize: 12 }} className="label">Traditional Call Center</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['Setup Time', '5 minutes', '2-4 weeks', true],
                                    ['Cost Per Call', '$0.05 - $0.15', '$1.50 - $3.00', true],
                                    ['Scalability', 'Infinite', 'Limited by Humans', true],
                                    ['Availability', '24/7/365', 'Shift based', true],
                                    ['Consistency', '100% Script Adherence', 'Variable', true],
                                    ['Data Entry', 'Automated & Instant', 'Manual & Prone to Error', true],
                                    ['Multilingual', '40+ Languages Instantly', 'Requires Specialized Staff', true],
                                ].map(([m, a, o, win]) => (
                                    <motion.tr
                                        key={m}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.3s', cursor: 'default' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,229,255,0.02)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '16px 24px', color: 'var(--text-2)', fontSize: 14 }}>{m}</td>
                                        <td style={{ padding: '16px 24px', textAlign: 'center', color: 'var(--accent)', fontWeight: 600, fontSize: 14 }}>
                                            {win && <span style={{ marginRight: 6 }}>✦</span>}{a}
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>{o}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                </div>
            </section>

            <AnimatedDivider />

            {/* ===== CTA ===== */}
            <section className="pad-section section-light" style={{ overflow: 'hidden' }}>
                <div className="orb-container">
                    <div className="orb orb-purple" style={{ bottom: -200, right: '20%', width: 400, height: 400 }} />
                </div>
                <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    <TextReveal><h2 className="display-medium" style={{ marginBottom: 20 }}>Ready to <span className="gradient-text">automate?</span></h2></TextReveal>
                    <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="body-large" style={{ marginBottom: 36 }}>
                        Start your first consolidated AI calling campaign today. No credit card required.
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}
                        style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <Link to="/contact" data-cursor><button className="cta-filled">Start Free Campaign →</button></Link>
                    </motion.div>
                </div>
            </section>
        </main>
    )
}
