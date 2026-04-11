import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Volume2, VolumeX } from 'lucide-react';

import video1 from '../aitota-assets/aitotaVideo/aitota2.mp4';
import video2 from '../aitota-assets/aitotaVideo/Aitota6.mp4';
import video3 from '../aitota-assets/aitotaVideo/Aitota3.mp4';
import video4 from '../aitota-assets/aitotaVideo/Aitota4.mp4';

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const cards = [
    {
        title: 'Auto-Dialer',
        videoSrc: video1,
        color: '#3b82f6', // Blue
    },
    {
        title: 'Campaigns',
        videoSrc: video2,
        color: '#8b5cf6', // Violet
    },
    {
        title: 'Voice Cloning',
        videoSrc: video3,
        color: '#ec4899', // Pink
    },
    {
        title: 'Sentiment',
        videoSrc: video4,
        color: '#10b981', // Emerald
    }
];

export default function PowerOfAitota() {
    const sectionRef = useRef(null);
    const containerRef = useRef(null);
    const cardRefs = useRef([]);
    const videoRefs = useRef([]);
    const [isMobile, setIsMobile] = useState(false);
    const [mutedStates, setMutedStates] = useState(new Array(cards.length).fill(true));

    const toggleMute = (e, index) => {
        e.stopPropagation();
        setMutedStates(prev => {
            const newStates = [...prev];
            newStates[index] = !newStates[index];
            return newStates;
        });
    };

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const section = sectionRef.current;
        const container = containerRef.current;
        const cardElements = cardRefs.current;

        if (!section || !container || cardElements.length === 0) return;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top top',
                    end: '+=4000',
                    scrub: 0.8,
                    pin: true,
                    anticipatePin: 1
                }
            });

            // Initial Stack State
            cardElements.forEach((card, index) => {
                if (index === 0) {
                    // First card should already be physically in view (just scaled down) so GPU is prepared
                    gsap.set(card, {
                        x: 0,
                        y: 0,
                        rotation: 0,
                        scale: 0.8,
                        opacity: 0.5,
                        zIndex: index + 1,
                        transformOrigin: "center center"
                    });
                } else {
                    gsap.set(card, {
                        x: 400, // Others start from right
                        y: 100,
                        rotation: 10,
                        scale: 0.8,
                        opacity: 0,
                        zIndex: index + 1,
                        transformOrigin: "center center"
                    });
                }
            });

            // Animation Sequence
            cardElements.forEach((card, index) => {
                const position = index * 3;

                // Enter (Focus State)
                tl.to(card, {
                    x: 0,
                    y: 0,
                    rotation: 0,
                    scale: 1,
                    opacity: 1,
                    zIndex: 10,
                    duration: 3,
                    ease: "power2.out",
                    onStart: () => {
                        const v = videoRefs.current[index];
                        if (v && v.paused) v.play().catch(() => {});
                    },
                    onReverseComplete: () => {
                        const v = videoRefs.current[index];
                        // Don't pause the first entry video so it doesn't stutter when playhead is near 0
                        if (v && !v.paused && index !== 0) {
                            v.pause();
                        }
                    }
                }, position);

                // Exit
                if (index !== cardElements.length - 1) {
                    tl.to(card, {
                        x: isMobile ? -350 : -450, // Slide left on exit
                        y: 0,
                        rotation: isMobile ? -5 : -8,
                        scale: isMobile ? 0.8 : 0.85,
                        opacity: 0, // Fade out on mobile
                        zIndex: index,
                        duration: 3,
                        ease: "power2.inOut",
                        onStart: () => {
                            const v = videoRefs.current[index];
                            if (v && !v.paused) {
                                v.pause();
                            }
                        },
                        onReverseComplete: () => {
                            const v = videoRefs.current[index];
                            if (v && v.paused) v.play().catch(() => {});
                        }
                    }, position + 3.5);
                }
            });

        }, section);

        return () => ctx.revert();
    }, [isMobile]);

    // Enhanced Mouse Move Effect
    const handleMouseMove = (e, i) => {
        const card = cardRefs.current[i];
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8; // More tilt
        const rotateY = ((x - centerX) / centerX) * 8;

        gsap.to(card, {
            rotationX: rotateX,
            rotationY: rotateY,
            duration: 0.4,
            ease: "power1.out"
        });
    };

    const handleMouseLeave = (i) => {
        const card = cardRefs.current[i];
        if (!card) return;

        gsap.to(card, {
            rotationX: 0,
            rotationY: 0,
            duration: 0.5,
            ease: "power2.out"
        });
    };

    return (
        <section
            ref={sectionRef}
            className="flex items-center justify-center relative overflow-hidden"
            style={{
                height: '100vh',
                background: '#0a0a0a',
                color: '#fff',
                perspective: '2000px'
            }}
        >
            {/* Background Environment - Deep Space + Aurora */}
            <div className="absolute inset-0 w-full h-full bg-[#050505]">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/20 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-900/20 blur-[150px] rounded-full" />

                {/* Noise Overlay Filter */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
            </div>

            <div
                ref={containerRef}
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10
                }}
            >
                {/* Minimal Header */}
                <div className="absolute top-[8%] text-center z-40 w-full px-4 mix-blend-screen">
                    <p className="text-cyan-400 text-sm uppercase tracking-[0.3em] font-mono mb-4 animate-pulse">Next Gen Core</p>
                    <h2 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 tracking-tighter">
                        Power of Aitota
                    </h2>
                </div>

                <div
                    style={{
                        position: 'relative',
                        width: isMobile ? '85%' : '380px',
                        maxWidth: '450px',
                        height: isMobile ? '400px' : '520px',
                        marginTop: isMobile ? '40px' : '70px',
                        perspective: '1000px',
                        zIndex: 50
                    }}
                >
                    {cards.map((card, i) => {
                        return (
                            <div
                                key={i}
                                ref={el => cardRefs.current[i] = el}
                                onMouseMove={(e) => handleMouseMove(e, i)}
                                onMouseLeave={() => handleMouseLeave(i)}
                                className="group"
                                style={{
                                    position: 'absolute',
                                    top: 0, left: 0,
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '48px', // High border radius for premium feel
                                    background: '#0f0f14', // Solid background to hide text behind
                                    willChange: 'transform, opacity',
                                    border: `1px solid ${card.color}40`, // Increased border visibility
                                    borderBottom: `2px solid ${card.color}`, // Thicker bottom border for strong base
                                    boxShadow: `
                                        inset 0 -20px 40px -20px ${card.color}60, /* stronger inner bottom glow */
                                        inset 0 0 20px -10px ${card.color}30  /* general inner ambiance */
                                    `,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    transformStyle: 'preserve-3d',
                                    cursor: 'none' // We will hide cursor inside or use custom one effect
                                }}
                            >
                                {/* Inner Gradient Orb that follows mouse - LIQUID effect */}
                                <div
                                    className="pointer-events-none absolute -inset-[50%] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{
                                        background: `radial-gradient(circle at var(--mouse-x) var(--mouse-y), ${card.color}30, transparent 50%)`,
                                        zIndex: 0,
                                        willChange: 'opacity'
                                    }}
                                />

                                {/* Vertical Video Background */}
                                <div className="absolute inset-0 z-10 overflow-hidden" style={{ borderRadius: 'inherit' }}>
                                    <video
                                        ref={(el) => {
                                            videoRefs.current[i] = el;
                                            if (el) {
                                                el.muted = mutedStates[i];
                                            }
                                        }}
                                        src={card.videoSrc}
                                        autoPlay={i === 0}
                                        loop
                                        playsInline
                                        preload="auto"
                                        muted={mutedStates[i]}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                    {/* Gradient overlay for better text readability */}
                                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.5) 100%)' }} />
                                </div>

                                {/* Interactive Content Overlay */}
                                <div className="relative z-20 p-8 h-full flex flex-col justify-between" style={{ transform: "translateZ(30px)" }}>

                                    {/* Top: Index & Unmute Btn */}
                                    <div className="flex justify-between items-start w-full">
                                        <div
                                            style={{
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                padding: '6px 16px',
                                                borderRadius: '20px',
                                                backdropFilter: 'blur(10px)',
                                            }}
                                        >
                                            <span className="font-mono text-lg text-white font-medium">0{i + 1}</span>
                                        </div>

                                        <button
                                            onClick={(e) => toggleMute(e, i)}
                                            style={{
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '50%',
                                                backdropFilter: 'blur(10px)',
                                                color: 'white',
                                                cursor: 'pointer', // Since parent has cursor: none, we must explicitly allow pointer if we want them to click outside of standard view. But parent is cursor: none... let's keep it pointer and maybe it handles well.
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.3s ease',
                                                zIndex: 50 // crucial for button
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)' }}
                                        >
                                            {mutedStates[i] ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                        </button>
                                    </div>

                                    {/* Bottom: Title & Accents */}
                                    <div className="flex flex-col gap-4">
                                        <h3
                                            className="text-4xl md:text-5xl font-medium text-white leading-tight"
                                            style={{ fontFamily: 'var(--font-display)', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}
                                        >
                                            {card.title}
                                        </h3>

                                        <div className="flex items-center gap-3">
                                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: card.color, boxShadow: `0 0 15px ${card.color}` }} />
                                            <span className="text-sm font-semibold tracking-widest uppercase text-white/90 drop-shadow-md">Active Process</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section >
    );
}
