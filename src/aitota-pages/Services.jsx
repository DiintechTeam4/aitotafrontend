import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Megaphone, Bot, Zap, Link as LinkIcon, Filter, Shield, Target, Brain, Rocket, CreditCard, HeartPulse, Home } from 'lucide-react'
import heroImg from '../aitota-assets/service-bg.png'

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

const services = [
    { num: '01', title: 'Managed Campaigns', desc: 'End-to-end management of your outbound voice campaigns. We handle data, dialer config, and agent tuning.', features: ['Data Cleaning', 'Dialer Setup', 'Agent Supervision', 'Weekly Reporting'], color: 'var(--accent)', icon: Megaphone },
    { num: '02', title: 'Custom Voice Agents', desc: 'Design and build bespoke AI voice agents tailored to your specific industry workflow and brand voice.', features: ['Script Design', 'Voice Cloning', 'Integrations', 'UAT Testing'], color: 'var(--accent-2)', icon: Bot },
    { num: '03', title: 'Voice API Access', desc: 'Direct access to our low-latency voice engine for developers building their own applications.', features: ['REST API', 'WebSocket', 'Sub-second Latency', 'Global Reach'], color: '#f43f8c', icon: Zap },
    { num: '04', title: 'CRM Integration', desc: 'Seamless connection between Aitota and your existing CRM (Salesforce, HubSpot, Zoho, etc.).', features: ['Bi-directional Sync', 'Click-to-Call', 'Activity Logging', 'Custom Fields'], color: 'var(--accent-3)', icon: LinkIcon },
    { num: '05', title: 'List Optimization', desc: 'Maximize connection rates with our smart list scrubbing and time-zone optimization services.', features: ['Number Validation', 'DND Scrubbing', 'Optimal Timing', 'Retry Logic'], color: '#f59e0b', icon: Filter },
    { num: '06', title: 'Compliance Audit', desc: 'Ensure your campaigns meet all regulatory requirements (TCPA, GDPR, etc.) with our audit tools.', features: ['Risk Assessment', 'Recording Storage', 'Consent Tracking', 'Legal Review'], color: '#6366f1', icon: Shield },
]

const methodologySteps = [
    { num: '01', title: 'Discovery', desc: 'Aligning with your goals to define success metrics and target audience personas.', icon: Target, phase: 'Planning' },
    { num: '02', title: 'Design', desc: 'Crafting natural, human-like conversation flows and configuring AI logic.', icon: Brain, phase: 'Architecture' },
    { num: '03', title: 'Integration', desc: 'Seamlessly connecting with your CRM, data sources, and telephony infrastructure.', icon: LinkIcon, phase: 'Development' },
    { num: '04', title: 'Validation', desc: 'Rigorous testing and pilot runs to ensure accuracy and performance quality.', icon: Shield, phase: 'Testing' },
    { num: '05', title: 'Deployment', desc: 'Launching at scale with real-time monitoring and continuous optimization.', icon: Rocket, phase: 'Live' },
]

const caseStudies = [
    {
        client: 'FinServe Bank',
        industry: 'Banking',
        result: '3x Lead Conversion',
        desc: 'Deployed checking account qualification agents that processed 50k leads in 48 hours.',
        metrics: ['300% ROI', '50k calls/48h', 'Zero Wait Time'],
        icon: CreditCard,
    },
    {
        client: 'CarePlus Health',
        industry: 'Healthcare',
        result: '40% Cost Reduction',
        desc: 'Automated appointment reminders and pre-screening calls, reducing no-shows significantly.',
        metrics: ['40% savings', '15% < No-shows', '24/7 Availability'],
        icon: HeartPulse,
    },
    {
        client: 'HomeFinders',
        industry: 'Real Estate',
        result: '20hrs/agent Saved',
        desc: 'Realtors saved 20 hours per week by offloading cold calling to Aitota agents.',
        metrics: ['20 hrs saved', '5x More Meetings', 'Higher Morale'],
        icon: Home,
    },
]

const clientLogos = [
    'FinServe', 'CarePlus', 'HomeFinders', 'AutoDrive', 'SolarCity',
    'TechSupport', 'EduLearn', 'InsureMe', 'DebtZero', 'TravelFast',
]

export default function Services() {
    const [hoveredService, setHoveredService] = useState(null)
    const heroRef = useRef(null)
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
    const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

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
                {/* Hero Image */}
                <motion.div
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 0,
                        y: heroY
                    }}
                >
                    <img
                        src={heroImg}
                        alt=""
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0.6,
                            filter: 'brightness(1.1)'
                        }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, var(--bg) 90%)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, var(--bg) 100%)', opacity: 0.4 }} />
                </motion.div>

                <div className="orb-container">
                    <div className="orb orb-purple" style={{ bottom: -200, right: -200, width: 500, height: 500 }} />
                    <div className="orb orb-cyan" style={{ top: -100, left: -100, width: 400, height: 400 }} />
                </div>

                <motion.div style={{ maxWidth: 1000, position: 'relative', zIndex: 2, opacity: heroOpacity }}>
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <span className="label" style={{ marginBottom: 24, display: 'block' }}>Services</span>
                    </motion.div>
                    <TextReveal><h1 className="display-large">Voice solutions</h1></TextReveal>
                    <TextReveal delay={0.1}><h1 className="display-large"><span className="gradient-text">for every scale.</span></h1></TextReveal>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="body-large"
                        style={{ maxWidth: 600, margin: '32px auto 0' }}
                    >
                        Whether you need a full managed service or API access, we have the voice infrastructure to power your business.
                    </motion.p>
                </motion.div>
            </section>

            <AnimatedDivider />

            {/* ===== SERVICES LIST (Premium) ===== */}
            <section className="pad-section section-dark">
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
                    <div style={{ marginBottom: 48 }}>
                        <TextReveal><span className="label" style={{ marginBottom: 20, display: 'block' }}>Our Offerings</span></TextReveal>
                        <TextReveal delay={0.1}><h2 className="display-medium">How we <span style={{ color: 'var(--accent)' }}>help.</span></h2></TextReveal>
                    </div>

                    {services.map((s, i) => (
                        <motion.div
                            key={s.num}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.05 }}
                            onMouseEnter={() => setHoveredService(s.num)}
                            onMouseLeave={() => setHoveredService(null)}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'auto auto 1fr auto',
                                gap: 'clamp(16px, 3vw, 40px)',
                                alignItems: 'center',
                                padding: 'clamp(28px, 4vw, 48px) clamp(16px, 2vw, 24px)',
                                borderBottom: '1px solid var(--border)',
                                transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)',
                                cursor: 'default',
                                background: hoveredService === s.num ? 'rgba(0,229,255,0.02)' : 'transparent',
                                borderRadius: hoveredService === s.num ? 16 : 0,
                            }}
                            className="service-row"
                        >
                            <motion.span
                                animate={{ scale: hoveredService === s.num ? 1.2 : 1 }}
                                style={{ fontSize: 32 }}
                            >
                                <s.icon size={32} />
                            </motion.span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: s.color, minWidth: 30 }}>{s.num}</span>
                            <div>
                                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 2.5vw, 2rem)', fontWeight: 700, marginBottom: 8, color: 'var(--text-1)' }}>{s.title}</h3>
                                <p style={{ color: 'var(--text-2)', fontSize: 14, maxWidth: 500 }}>{s.desc}</p>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }} className="service-tags">
                                {s.features.map((f) => (
                                    <span key={f} style={{
                                        padding: '6px 14px', borderRadius: 100,
                                        border: `1px solid ${hoveredService === s.num ? s.color + '40' : 'var(--border)'}`,
                                        fontSize: 11, color: hoveredService === s.num ? s.color : 'var(--text-3)',
                                        fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                                        transition: 'all 0.3s',
                                    }}>{f}</span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            <AnimatedDivider />

            {/* ===== PROCESS STEPS ===== */}
            <section className="pad-section section-light" style={{ overflow: 'hidden' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
                    <div className="orb-container">
                        <div className="orb orb-cyan" style={{ top: '50%', left: -100, transform: 'translateY(-50%)', width: 400, height: 400 }} />
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: 64, position: 'relative' }}>
                        <TextReveal><span className="label" style={{ marginBottom: 20, display: 'block' }}>Methodology</span></TextReveal>
                        <TextReveal delay={0.1}><h2 className="display-medium">Execution <span className="gradient-text">Protocol.</span></h2></TextReveal>
                        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="body-large" style={{ maxWidth: 500, margin: '20px auto 0' }}>
                            A systematic approach to deploying high-performance voice agents.
                        </motion.p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, position: 'relative' }}>
                        {methodologySteps.map((step, i) => (
                            <motion.div
                                key={step.num}
                                initial={{ opacity: 0, y: 60, scale: 0.9 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                className="holo-card"
                                style={{ textAlign: 'center', padding: '32px 24px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                            >
                                {/* Step number bg */}
                                <div style={{
                                    position: 'absolute', top: -15, right: 10,
                                    fontFamily: 'var(--font-display)', fontSize: 80, fontWeight: 900,
                                    color: 'rgba(0,229,255,0.04)', lineHeight: 1, pointerEvents: 'none',
                                }}>
                                    {step.num}
                                </div>

                                <motion.div
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                                    style={{
                                        fontSize: 32, marginBottom: 20,
                                        width: 64, height: 64, borderRadius: '50%',
                                        background: 'rgba(0,229,255,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid rgba(0,229,255,0.1)'
                                    }}
                                >
                                    <step.icon size={32} />
                                </motion.div>

                                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--text-1)' }}>{step.title}</h3>
                                <p style={{ color: 'var(--text-3)', fontSize: 13, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{step.desc}</p>

                                <div style={{ width: '100%', height: 1, background: 'var(--border)', marginBottom: 16 }} />

                                <span style={{
                                    fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase',
                                    color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 600
                                }}>
                                    {step.phase}
                                </span>

                                {/* Simple connector line - hide on last + mobile */}
                                {i < methodologySteps.length - 1 && (
                                    <div className="process-arrow" style={{
                                        position: 'absolute', top: '50%', right: -12, zIndex: 2,
                                        width: 24, height: 1, background: 'var(--border)',
                                        transform: 'translateY(-50%)'
                                    }} />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <AnimatedDivider />

            {/* ===== CASE STUDIES ===== */}
            <section className="pad-section section-dark">
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
                    <div className="orb-container">
                        <div className="orb orb-purple" style={{ top: '30%', right: -100, width: 400, height: 400 }} />
                    </div>

                    <div style={{ marginBottom: 64, position: 'relative' }}>
                        <TextReveal><span className="label" style={{ marginBottom: 20, display: 'block' }}>Success Stories</span></TextReveal>
                        <TextReveal delay={0.1}><h2 className="display-medium">Real world <span style={{ color: 'var(--accent)' }}>impact.</span></h2></TextReveal>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, position: 'relative' }}>
                        {caseStudies.map((cs, i) => (
                            <motion.div
                                key={cs.client}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    position: 'relative',
                                    padding: 'clamp(32px, 3vw, 44px)',
                                    borderRadius: 'var(--radius-xl)',
                                    background: 'linear-gradient(145deg, rgba(0,229,255,0.05) 0%, rgba(5,5,16,0.8) 50%, rgba(139,92,246,0.05) 100%)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    overflow: 'hidden',
                                    cursor: 'default',
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
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                                    style={{
                                        position: 'absolute',
                                        top: -50,
                                        right: -50,
                                        width: 150,
                                        height: 150,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, rgba(0,229,255,0.15), transparent)',
                                        filter: 'blur(40px)',
                                        pointerEvents: 'none',
                                    }}
                                />

                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, position: 'relative', zIndex: 1 }}>
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        style={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: 16,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 32,
                                            background: 'rgba(0,229,255,0.1)',
                                            border: '1px solid rgba(0,229,255,0.2)',
                                            boxShadow: '0 10px 30px rgba(0,229,255,0.1)',
                                        }}
                                    >
                                        <cs.icon size={32} />
                                    </motion.div>
                                    <div>
                                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{cs.client}</h3>
                                        <span className="label" style={{ color: 'var(--text-3)', fontSize: 9 }}>{cs.industry}</span>
                                    </div>
                                </div>

                                <div style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
                                    fontWeight: 800,
                                    color: 'var(--accent)',
                                    marginBottom: 16,
                                    lineHeight: 1.2,
                                    position: 'relative',
                                    zIndex: 1,
                                }}>
                                    {cs.result}
                                </div>

                                <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7, marginBottom: 24, position: 'relative', zIndex: 1 }}>{cs.desc}</p>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, position: 'relative', zIndex: 1 }}>
                                    {cs.metrics.map((m) => (
                                        <span key={m} style={{
                                            padding: '8px 16px',
                                            borderRadius: 100,
                                            background: 'rgba(0,229,255,0.08)',
                                            border: '1px solid rgba(0,229,255,0.15)',
                                            fontSize: 11,
                                            color: 'var(--accent)',
                                            fontFamily: 'var(--font-mono)',
                                            fontWeight: 500,
                                        }}>
                                            {m}
                                        </span>
                                    ))}
                                </div>

                                {/* Bottom accent */}
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
                        ))}
                    </div>
                </div>
            </section>

            <AnimatedDivider />

            {/* ===== CLIENT LOGOS ===== */}
            <section className="pad-section-sm section-light" style={{ overflow: 'hidden' }}>
                <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative' }}>
                    <TextReveal><span className="label" style={{ marginBottom: 20, display: 'block' }}>Trusted By</span></TextReveal>
                    <TextReveal delay={0.1}><h2 className="display-small">Leaders in <span style={{ color: 'var(--accent)' }}>innovation.</span></h2></TextReveal>
                </div>

                {/* Marquee logos */}
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 150, background: 'linear-gradient(90deg, var(--bg), transparent)', zIndex: 2 }} />
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 150, background: 'linear-gradient(-90deg, var(--bg), transparent)', zIndex: 2 }} />

                    <div className="marquee-track" style={{ gap: 0 }}>
                        {[...clientLogos, ...clientLogos].map((logo, i) => (
                            <div
                                key={`${logo}-${i}`}
                                style={{
                                    padding: '20px clamp(30px, 5vw, 60px)',
                                    fontFamily: 'var(--font-display)',
                                    fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                                    fontWeight: 700,
                                    color: 'rgba(255,255,255,0.3)',
                                    whiteSpace: 'nowrap',
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                    transition: 'color 0.3s',
                                    cursor: 'default',
                                }}
                                onMouseEnter={(e) => e.target.style.color = '#fff'}
                                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.3)'}
                            >
                                {logo}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <AnimatedDivider />

            {/* ===== CTA ===== */}
            <section className="pad-section section-dark" style={{ overflow: 'hidden' }}>
                <div className="orb-container">
                    <div className="orb orb-cyan" style={{ bottom: -200, left: '20%', width: 500, height: 500 }} />
                    <div className="orb orb-purple" style={{ top: -200, right: '30%', width: 400, height: 400 }} />
                </div>
                <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    <TextReveal><h2 className="display-medium" style={{ marginBottom: 20 }}>Ready to <span className="gradient-text">scale?</span></h2></TextReveal>
                    <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="body-large" style={{ marginBottom: 36 }}>
                        Contact us today to discuss your campaign needs.
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}
                        style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <Link to="/contact" data-cursor><button className="cta-filled">Get a Quote →</button></Link>
                    </motion.div>
                </div>
            </section>

            <style>{`
                @media (max-width: 768px) {
                    .service-tags { display: none !important; }
                    .service-row { grid-template-columns: auto 1fr !important; }
                    .service-row > span:first-child { display: none !important; }
                    .process-arrow { display: none !important; }
                }
            `}</style>
        </main>
    )
}
