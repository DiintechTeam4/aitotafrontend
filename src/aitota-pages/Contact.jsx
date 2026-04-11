import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Mail, MapPin, Phone, Zap, Target, Lock, Plus } from 'lucide-react'
import heroImg from '../aitota-assets/contact-bg.png'

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

/* ===== INTERACTIVE BACKGROUND ===== */
function InteractiveGrid() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let animId
        let mouseX = 0, mouseY = 0

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        const onMove = (e) => {
            mouseX = e.clientX
            mouseY = e.clientY
        }
        window.addEventListener('mousemove', onMove)

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            const gridSize = 60
            const cols = Math.ceil(canvas.width / gridSize)
            const rows = Math.ceil(canvas.height / gridSize)

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const x = c * gridSize + gridSize / 2
                    const y = r * gridSize + gridSize / 2
                    const dx = mouseX - x
                    const dy = mouseY - y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    const maxDist = 200
                    const opacity = dist < maxDist ? 0.06 * (1 - dist / maxDist) : 0.01

                    ctx.beginPath()
                    ctx.arc(x, y, 1.5, 0, Math.PI * 2)
                    ctx.fillStyle = `rgba(0, 229, 255, ${opacity})`
                    ctx.fill()
                }
            }
            animId = requestAnimationFrame(animate)
        }
        animate()

        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener('resize', resize)
            window.removeEventListener('mousemove', onMove)
        }
    }, [])

    return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

const faqs = [
    { q: 'Can I integrate Aitota with my CRM?', a: 'Yes, Aitota integrates seamlessly with Salesforce, HubSpot, Zoho, and other major CRMs. We support bi-directional sync for contacts and call logs.' },
    { q: 'How many concurrent calls can I make?', a: 'Our platform auto-scales to handle anywhere from 10 to 10,000+ concurrent calls, ensuring your campaigns finish on time regardless of list size.' },
    { q: 'Is the voice natural?', a: 'We use state-of-the-art neural voice synthesis that includes breath noises, natural pauses, and emotional intonation. Most customers cannot distinguish it from a human agent.' },
    { q: 'How does billing work?', a: 'We charge per minute of conversation. You only pay for successful connections. There are no setup fees or long-term contracts for our standard plans.' },
    { q: 'Is it compliant with regulations?', a: 'Yes, we have built-in compliance tools for TCPA, GDPR, and local telecom regulations, including automatic DND (Do Not Disturb) list scrubbing and call recording consent management.' },
    { q: 'Can I test it before buying?', a: 'Absolutely. Contact our sales team to schedule a live demo where you can converse with our AI agents in real-time.' },
]

const contactInfo = [
    { icon: Mail, label: 'Email', value: 'contact@aitota.com', link: 'mailto:contact@aitota.com' },
    { icon: MapPin, label: 'Head Office', value: 'C-116, Sector-2, Noida, Uttar Pradesh – 201301, India', link: null },
    { icon: Phone, label: 'Phone', value: '8147540362', link: 'tel:8147540362' },
]

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', company: '', budget: '', message: '' })
    const [submitted, setSubmitted] = useState(false)
    const [openFaq, setOpenFaq] = useState(null)
    const [focusedField, setFocusedField] = useState(null)

    const handleSubmit = (e) => {
        e.preventDefault()
        setSubmitted(true)
    }

    return (
        <main style={{ paddingTop: 80, background: 'var(--bg)', color: 'var(--text-1)', minHeight: '100vh' }}>
            {/* ===== HERO ===== */}
            <section style={{
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                padding: '0 clamp(28px, 6vw, 100px)',
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--bg)',
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
                            objectPosition: 'center 20%',
                            opacity: 0.6,
                            filter: 'brightness(1.1)'
                        }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, var(--bg) 90%)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, var(--bg) 100%)', opacity: 0.4 }} />
                </motion.div>

                <InteractiveGrid />
                <div className="orb-container">
                    <div className="orb orb-cyan" style={{ top: -200, right: -100, width: 500, height: 500 }} />
                    <div className="orb orb-purple" style={{ bottom: -100, left: -100, width: 400, height: 400 }} />
                </div>

                <div style={{ maxWidth: 1000, position: 'relative', zIndex: 2 }}>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <span className="label" style={{ marginBottom: 24, display: 'block' }}>Contact Sales</span>
                    </motion.div>
                    <TextReveal><h1 className="display-large">{"Start your"}</h1></TextReveal>
                    <TextReveal delay={0.1}><h1 className="display-large"><span className="gradient-text">campaign.</span></h1></TextReveal>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="body-large"
                        style={{ maxWidth: 500, marginTop: 32 }}
                    >
                        Ready to automate your calls? Speak with our experts to design a solution that fits your scale.
                    </motion.p>
                </div>
            </section>

            <AnimatedDivider />

            {/* ===== CONTACT INFO CARDS ===== */}
            <section className="pad-section-sm section-dark">
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        {contactInfo.map((info, i) => (
                            <motion.div
                                key={info.label}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-panel-light"
                                style={{
                                    padding: 'clamp(24px, 3vw, 32px)', textAlign: 'center',
                                    transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1), border-color 0.4s',
                                    cursor: info.link ? 'pointer' : 'default',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.15)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                                onClick={() => info.link && window.open(info.link)}
                                data-cursor
                            >
                                <span style={{ fontSize: 32, display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                                    <info.icon size={32} color="var(--accent)" />
                                </span>
                                <span className="label" style={{ color: 'var(--text-3)', fontSize: 10, display: 'block', marginBottom: 4 }}>{info.label}</span>
                                <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: info.link ? 'var(--accent)' : 'var(--text-1)' }}>{info.value}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <AnimatedDivider />

            {/* ===== CONTACT FORM (ANIMATED) ===== */}
            <section className="pad-section section-light" style={{ position: 'relative', overflow: 'hidden' }}>
                <div className="orb-container">
                    <div className="orb orb-purple" style={{ top: '30%', right: -100, width: 400, height: 400 }} />
                </div>

                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 'clamp(40px, 6vw, 80px)', position: 'relative' }}>
                    {/* Left: Message */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="label" style={{ marginBottom: 20, display: 'block' }}>Get in Touch</span>
                        <h2 className="display-medium" style={{ marginBottom: 20 }}>
                            Schedule a<br /><span style={{ color: 'var(--accent)' }}>Demo.</span>
                        </h2>
                        <p className="body-large" style={{ marginBottom: 32, maxWidth: 400 }}>
                            See how Aitota Voice can transform your customer engagement metrics.
                        </p>

                        {/* Mini feature list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {[
                                { icon: Zap, text: 'Live platform walkthrough' },
                                { icon: Target, text: 'Custom ROI calculation' },
                                { icon: Lock, text: 'Security & compliance review' },
                            ].map((item) => (
                                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 20, color: 'var(--accent)' }}><item.icon size={20} /></span>
                                    <span style={{ color: 'var(--text-2)', fontSize: 14 }}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right: Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <AnimatePresence mode="wait">
                            {submitted ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="holo-card"
                                    style={{ textAlign: 'center', padding: 'clamp(40px, 5vw, 60px)' }}
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                                        style={{ fontSize: 64, marginBottom: 20 }}
                                    >
                                        ✨
                                    </motion.div>
                                    <h3 className="display-small" style={{ marginBottom: 12 }}>
                                        Request <span className="gradient-text">received!</span>
                                    </h3>
                                    <p style={{ color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.6 }}>
                                        Our sales team will contact you shortly to schedule your demo.
                                    </p>
                                    <button
                                        className="magnetic-btn"
                                        onClick={() => { setSubmitted(false); setForm({ name: '', email: '', company: '', budget: '', message: '' }) }}
                                        style={{ padding: '14px 32px' }}
                                    >
                                        Send Another
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="form"
                                    onSubmit={handleSubmit}
                                    className="glass-panel-dark"
                                    style={{ padding: 'clamp(28px, 4vw, 44px)' }}
                                >
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        {/* Name */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <label className="label" style={{ display: 'block', marginBottom: 8, color: focusedField === 'name' ? 'var(--accent)' : 'var(--text-3)', transition: 'color 0.3s', fontSize: 11 }}>
                                                Your Name
                                            </label>
                                            <input
                                                type="text"
                                                className="premium-input"
                                                placeholder="John Doe"
                                                value={form.name}
                                                onChange={e => setForm({ ...form, name: e.target.value })}
                                                onFocus={() => setFocusedField('name')}
                                                onBlur={() => setFocusedField(null)}
                                                required
                                            />
                                        </motion.div>

                                        {/* Email */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.15 }}
                                        >
                                            <label className="label" style={{ display: 'block', marginBottom: 8, color: focusedField === 'email' ? 'var(--accent)' : 'var(--text-3)', transition: 'color 0.3s', fontSize: 11 }}>
                                                Work Email
                                            </label>
                                            <input
                                                type="email"
                                                className="premium-input"
                                                placeholder="john@company.com"
                                                value={form.email}
                                                onChange={e => setForm({ ...form, email: e.target.value })}
                                                onFocus={() => setFocusedField('email')}
                                                onBlur={() => setFocusedField(null)}
                                                required
                                            />
                                        </motion.div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                                        {/* Company */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <label className="label" style={{ display: 'block', marginBottom: 8, color: focusedField === 'company' ? 'var(--accent)' : 'var(--text-3)', transition: 'color 0.3s', fontSize: 11 }}>
                                                Company
                                            </label>
                                            <input
                                                type="text"
                                                className="premium-input"
                                                placeholder="Your Company"
                                                value={form.company}
                                                onChange={e => setForm({ ...form, company: e.target.value })}
                                                onFocus={() => setFocusedField('company')}
                                                onBlur={() => setFocusedField(null)}
                                            />
                                        </motion.div>

                                        {/* Budget */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.25 }}
                                        >
                                            <label className="label" style={{ display: 'block', marginBottom: 8, color: focusedField === 'budget' ? 'var(--accent)' : 'var(--text-3)', transition: 'color 0.3s', fontSize: 11 }}>
                                                Monthly Call Volume
                                            </label>
                                            <div style={{ position: 'relative' }}>
                                                <select
                                                    className="premium-input"
                                                    value={form.budget}
                                                    onChange={e => setForm({ ...form, budget: e.target.value })}
                                                    onFocus={() => setFocusedField('budget')}
                                                    onBlur={() => setFocusedField(null)}
                                                    style={{ appearance: 'none', cursor: 'pointer' }}
                                                >
                                                    <option value="" style={{ color: '#666', background: '#0a0a1a' }}>Select Volume</option>
                                                    <option value="<10k" style={{ background: '#0a0a1a' }}>&lt; 10,000</option>
                                                    <option value="10k-50k" style={{ background: '#0a0a1a' }}>10k - 50k</option>
                                                    <option value="50k-100k" style={{ background: '#0a0a1a' }}>50k - 100k</option>
                                                    <option value=">100k" style={{ background: '#0a0a1a' }}>100k+</option>
                                                </select>
                                                <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-3)', fontSize: 10 }}>▼</div>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Message */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 }}
                                        style={{ marginTop: 16 }}
                                    >
                                        <label className="label" style={{ display: 'block', marginBottom: 8, color: focusedField === 'message' ? 'var(--accent)' : 'var(--text-3)', transition: 'color 0.3s', fontSize: 11 }}>
                                            Campaign Details
                                        </label>
                                        <textarea
                                            className="premium-textarea"
                                            rows={5}
                                            placeholder="Tell us about the type of calls you want to automate..."
                                            value={form.message}
                                            onChange={e => setForm({ ...form, message: e.target.value })}
                                            onFocus={() => setFocusedField('message')}
                                            onBlur={() => setFocusedField(null)}
                                            required
                                        />
                                    </motion.div>

                                    {/* Submit */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.35 }}
                                        style={{ marginTop: 24 }}
                                    >
                                        <motion.button
                                            type="submit"
                                            className="cta-filled"
                                            style={{ width: '100%', borderRadius: 14 }}
                                            whileHover={{ scale: 1.02, boxShadow: '0 20px 60px rgba(0,229,255,0.2)' }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            Request Demo →
                                        </motion.button>
                                    </motion.div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </section>

            <AnimatedDivider />

            {/* ===== FAQ ACCORDION ===== */}
            <section className="pad-section section-dark">
                <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
                    <div className="orb-container">
                        <div className="orb orb-cyan" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500 }} />
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: 64, position: 'relative' }}>
                        <TextReveal><span className="label" style={{ marginBottom: 20, display: 'block' }}>FAQ</span></TextReveal>
                        <TextReveal delay={0.1}>
                            <h2 className="display-medium">Common <span className="gradient-text">questions.</span></h2>
                        </TextReveal>
                    </div>

                    <div style={{ position: 'relative' }}>
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06 }}
                                className="faq-item"
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            >
                                <div className="faq-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <span style={{
                                            fontFamily: 'var(--font-mono)', fontSize: 12, color: openFaq === i ? 'var(--accent)' : 'var(--text-3)',
                                            transition: 'color 0.3s', minWidth: 24,
                                        }}>
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <span>{faq.q}</span>
                                    </div>
                                    <motion.div
                                        className="faq-icon"
                                        animate={{ rotate: openFaq === i ? 45 : 0 }}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            ...(openFaq === i ? {
                                                borderColor: 'var(--accent)',
                                                background: 'rgba(0,229,255,0.08)',
                                            } : {}),
                                        }}
                                    >
                                        <Plus size={20} />
                                    </motion.div>
                                </div>

                                <AnimatePresence>
                                    {openFaq === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <p style={{
                                                padding: '0 0 clamp(20px, 3vw, 32px) 40px',
                                                color: 'var(--text-2)', fontSize: 14, lineHeight: 1.8,
                                                maxWidth: 600,
                                            }}>
                                                {faq.a}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    )
}
