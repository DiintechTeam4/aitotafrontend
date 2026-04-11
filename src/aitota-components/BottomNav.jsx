import { Link, useLocation } from 'react-router-dom'
import { Home, Info, Cpu, Layers, Mail } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Services', path: '/services', icon: Cpu },
    { name: 'Features', path: '/features', icon: Layers },
    { name: 'Contact', path: '/contact', icon: Mail },
]

export default function BottomNav() {
    const location = useLocation()

    return (
        <>
            <motion.nav
                initial={{ y: 100, x: "-50%" }}
                animate={{ y: 0, x: "-50%" }}
                transition={{ delay: 1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="bottom-nav"
                style={{
                    position: 'fixed',
                    bottom: 20,
                    left: '50%',
                    zIndex: 1000,
                    background: 'rgba(5, 5, 16, 0.85)',
                    backdropFilter: 'blur(16px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 24,
                    padding: '12px 16px',
                    display: 'none', // Hidden by default on desktop
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 4,
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                    width: 'calc(100% - 32px)',
                    maxWidth: 400,
                }}
            >
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                                color: isActive ? 'var(--accent)' : 'var(--text-3)',
                                textDecoration: 'none',
                                position: 'relative',
                                transition: 'all 0.3s ease',
                                flex: 1,
                                minWidth: 0, // Allow flex item to shrink below content size if needed
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    style={{
                                        position: 'absolute',
                                        top: -12,
                                        width: 20,
                                        height: 2,
                                        background: 'var(--accent)',
                                        borderRadius: 2,
                                        boxShadow: '0 0 10px var(--accent)'
                                    }}
                                />
                            )}

                            <item.icon
                                size={20}
                                strokeWidth={isActive ? 2.5 : 2}
                                style={{
                                    filter: isActive ? 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.5))' : 'none',
                                    transition: 'all 0.3s'
                                }}
                            />

                            <span style={{
                                fontSize: 10,
                                fontWeight: 600,
                                opacity: isActive ? 1 : 0.7,
                                transition: 'opacity 0.3s',
                                whiteSpace: 'nowrap'
                            }}>
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </motion.nav>

            <style>{`
        @media (max-width: 900px) {
          .bottom-nav {
            display: flex !important;
          }
        }
      `}</style>
        </>
    )
}
