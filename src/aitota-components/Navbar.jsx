import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const links = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Features', path: '/features' },
    { name: 'Services', path: '/services' },
    { name: 'Contact', path: '/contact' },
]

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const location = useLocation()

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 60)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => { setMenuOpen(false) }, [location])

    return (
        <>
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    padding: scrolled ? '16px clamp(20px, 5vw, 60px)' : '28px clamp(20px, 5vw, 60px)',
                    transition: 'padding 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    maxWidth: 1600,
                    margin: '0 auto',
                    padding: scrolled ? '12px 28px' : '0',
                    borderRadius: scrolled ? 100 : 0,
                    background: scrolled ? 'rgba(5,5,16,0.8)' : 'transparent',
                    backdropFilter: scrolled ? 'blur(40px) saturate(180%)' : 'none',
                    WebkitBackdropFilter: scrolled ? 'blur(40px) saturate(180%)' : 'none',
                    border: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
                    transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                }}>
                    {/* Logo */}
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }} data-cursor>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {/* Logo Glow */}
                            <motion.div
                                animate={{
                                    opacity: [0.4, 0.7, 0.4],
                                    scale: [1, 1.2, 1]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                style={{
                                    position: 'absolute',
                                    width: 58,
                                    height: 58,
                                    borderRadius: '50%',
                                    background: 'var(--accent)',
                                    filter: 'blur(20px)',
                                    zIndex: -1,
                                }}
                            />
                            <motion.img
                                src="/AitotaLogo.png"
                                alt="Aitota"
                                style={{
                                    width: 60,
                                    height: 60,
                                    position: 'relative',
                                    zIndex: 1,
                                    filter: 'drop-shadow(0 0 10px rgba(0, 229, 255, 0.3))'
                                }}
                                whileHover={{ rotate: 15, scale: 1.1 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            />
                        </div>
                        <span style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 22,
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            color: 'var(--text-1)',
                            textShadow: '0 0 20px rgba(255,255,255,0.1)'
                        }}>
                            AITOTA
                        </span>
                    </Link>

                    {/* Desktop links */}
                    <nav className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {links.map((link) => {
                            const active = location.pathname === link.path
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    data-cursor
                                    style={{
                                        position: 'relative',
                                        padding: '8px 16px',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: active ? 'var(--accent)' : 'var(--text-2)',
                                        transition: 'color 0.4s',
                                        letterSpacing: '0.02em',
                                    }}
                                    onMouseEnter={(e) => { if (!active) e.target.style.color = 'var(--text-1)' }}
                                    onMouseLeave={(e) => { if (!active) e.target.style.color = 'var(--text-2)' }}
                                >
                                    {link.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* CTA — opens in new tab */}
                    <div className="nav-desktop">
                        <button
                            data-cursor
                            onClick={() => window.open('/admin/login', '_blank', 'noopener,noreferrer')}
                            style={{
                                padding: '10px 28px',
                                borderRadius: 100,
                                border: '1px solid rgba(255,255,255,0.12)',
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--text-1)',
                                transition: 'all 0.4s',
                                letterSpacing: '0.03em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: 'transparent',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--accent)'
                                e.currentTarget.style.color = 'var(--accent)'
                                e.currentTarget.style.boxShadow = '0 0 20px rgba(0,229,255,0.1)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                                e.currentTarget.style.color = 'var(--text-1)'
                                e.currentTarget.style.boxShadow = 'none'
                            }}
                        >
                            Let's Talk <ArrowRight size={16} />
                        </button>
                    </div>

                    {/* Hamburger */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="nav-hamburger"
                        aria-label="Menu"
                        data-cursor
                        style={{
                            display: 'none',
                            flexDirection: 'column',
                            gap: 6,
                            background: 'none',
                            border: 'none',
                            padding: 8,
                        }}
                    >
                        <motion.span animate={menuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }} style={{ display: 'block', width: 28, height: 2, background: 'var(--text-1)', borderRadius: 2, transformOrigin: 'center' }} />
                        <motion.span animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }} style={{ display: 'block', width: 28, height: 2, background: 'var(--text-1)', borderRadius: 2 }} />
                        <motion.span animate={menuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }} style={{ display: 'block', width: 28, height: 2, background: 'var(--text-1)', borderRadius: 2, transformOrigin: 'center' }} />
                    </button>
                </div >
            </motion.header >

            {/* Fullscreen Menu */}
            < AnimatePresence >
                {menuOpen && (
                    <motion.div
                        initial={{ clipPath: 'circle(0% at calc(100% - 50px) 50px)' }}
                        animate={{ clipPath: 'circle(150% at calc(100% - 50px) 50px)' }}
                        exit={{ clipPath: 'circle(0% at calc(100% - 50px) 50px)' }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 900,
                            background: '#050510',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            padding: '0 clamp(40px, 10vw, 120px)',
                        }}
                    >
                        {/* Decorative line */}
                        <div style={{ position: 'absolute', right: '15%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.03)' }} />

                        {links.map((link, i) => (
                            <motion.div
                                key={link.path}
                                initial={{ opacity: 0, x: -60 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}
                            >
                                <Link
                                    to={link.path}
                                    data-cursor
                                    style={{
                                        display: 'block',
                                        padding: '24px 0',
                                        fontFamily: 'var(--font-display)',
                                        fontSize: 'clamp(1.5rem, 5vw, 3rem)',
                                        fontWeight: 800,
                                        color: location.pathname === link.path ? 'var(--accent)' : 'var(--text-2)',
                                        transition: 'color 0.3s, transform 0.5s cubic-bezier(0.22,1,0.36,1)',
                                        letterSpacing: '-0.02em',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.color = 'var(--text-1)'
                                        e.target.style.transform = 'translateX(24px)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.color = location.pathname === link.path ? 'var(--accent)' : 'var(--text-2)'
                                        e.target.style.transform = 'translateX(0)'
                                    }}
                                >
                                    {link.name}
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )
                }
            </AnimatePresence >

            <style>{`
        @media (max-width: 900px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
        </>
    )
}
