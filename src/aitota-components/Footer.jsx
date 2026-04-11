import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Twitter, Github, Linkedin } from 'lucide-react'

export default function Footer() {
    return (
        <footer style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>
            {/* Animated top border */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: 'linear-gradient(90deg, transparent, var(--accent), var(--accent-2), var(--accent-3), transparent)',
                backgroundSize: '200% 100%',
                animation: 'slide-glow 4s linear infinite'
            }} />

            {/* Background glow */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <motion.div
                    animate={{ opacity: [0.03, 0.06, 0.03] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: '50%', background: 'radial-gradient(circle, rgba(0,229,255,0.15), transparent 70%)', filter: 'blur(60px)' }}
                />
            </div>

            <div style={{
                maxWidth: 1400,
                margin: '0 auto',
                padding: 'clamp(60px, 10vh, 120px) clamp(24px, 5vw, 80px)',
            }}>
                {/* Top */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                    gap: 'clamp(40px, 6vw, 80px)',
                    marginBottom: 'clamp(60px, 10vh, 120px)',
                }}>
                    {/* Brand */}
                    <div>
                        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }} data-cursor>
                            <motion.img
                                src="/AitotaLogo.png" alt=""
                                style={{ width: 28, height: 28, filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.4))' }}
                                animate={{ filter: ['drop-shadow(0 0 6px rgba(0,229,255,0.3))', 'drop-shadow(0 0 14px rgba(0,229,255,0.7))', 'drop-shadow(0 0 6px rgba(0,229,255,0.3))'] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            />
                            <span style={{
                                fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, letterSpacing: '0.08em',
                                background: 'linear-gradient(135deg, #fff 0%, var(--accent) 50%, var(--accent-2) 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                            }}>AITOTA</span>
                        </Link>
                        <p style={{ color: 'var(--text-3)', fontSize: 14, maxWidth: 300, lineHeight: 1.7 }}>
                            Powering the next generation of voice-first customer experiences.
                        </p>
                    </div>

                    {/* Links grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 32 }}>
                        {[
                            { title: 'Product', links: [['Features', '/features'], ['Pricing', '/pricing'], ['Services', '/services']] },
                            { title: 'Company', links: [['About', '/about'], ['Contact', '/contact'], ['Careers', '#'], ['Press', '#']] },
                            { title: 'Legal', links: [['Privacy', '/privacy'], ['Terms', '#'], ['Security', '#']] },
                        ].map((col) => (
                            <div key={col.title}>
                                <h4 className="label" style={{ color: 'var(--text-3)', marginBottom: 16, fontSize: 10 }}>{col.title}</h4>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {col.links.map(([name, path]) => (
                                        <li key={name}>
                                            <Link
                                                to={path}
                                                data-cursor
                                                style={{
                                                    color: 'var(--text-2)',
                                                    fontSize: 14,
                                                    transition: 'color 0.3s',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-2)'}                                            
                                            >
                                                {name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 28, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                    <span style={{ color: 'var(--text-3)', fontSize: 12 }}>© 2026 Aitota. All rights reserved.</span>
                    <div style={{ display: 'flex', gap: 16 }}>
                        {[
                            { icon: Twitter, href: '#' },
                            { icon: Github, href: '#' },
                            { icon: Linkedin, href: '#' }
                        ].map((s, i) => (
                            <a
                                key={i}
                                href={s.href}
                                data-cursor
                                style={{
                                    color: 'var(--text-3)',
                                    transition: 'color 0.3s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'}
                            >
                                <s.icon size={18} />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
