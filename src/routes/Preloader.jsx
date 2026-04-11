import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

function PreloaderParticles({ dissolving }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const particles = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.1, color: Math.random() > 0.5 ? "0, 229, 255" : "139, 92, 246",
        dissolveVx: (Math.random() - 0.5) * 8, dissolveVy: (Math.random() - 0.5) * 8 - 3,
      });
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        if (dissolving) { p.x += p.dissolveVx; p.y += p.dissolveVy; p.opacity *= 0.97; p.size *= 0.99; }
        else {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`; ctx.fill();
      });
      if (!dissolving) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(0, 229, 255, ${0.03 * (1 - dist / 100)})`; ctx.lineWidth = 0.5; ctx.stroke();
            }
          }
        }
      }
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, [dissolving]);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />;
}

export default function Preloader({ onComplete }) {
  const [count, setCount] = useState(0);
  const [dissolving, setDissolving] = useState(false);
  const [phase, setPhase] = useState("loading");
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 80;
    const animate = () => {
      frame++;
      const eased = 1 - Math.pow(1 - frame / totalFrames, 4);
      setCount(Math.floor(eased * 100));
      if (frame < totalFrames) { requestAnimationFrame(animate); }
      else {
        setPhase("branding");
        setTimeout(() => {
          setPhase("dissolve"); setDissolving(true);
          setTimeout(() => onCompleteRef.current(), 800);
        }, 800);
      }
    };
    requestAnimationFrame(animate);
  }, []);

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#050510", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
    >
      <PreloaderParticles dissolving={dissolving} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.02 }}>
        {[...Array(8)].map((_, i) => (<div key={`v${i}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${(i + 1) * 12.5}%`, width: 1, background: "#fff" }} />))}
        {[...Array(6)].map((_, i) => (<div key={`h${i}`} style={{ position: "absolute", left: 0, right: 0, top: `${(i + 1) * 16.66}%`, height: 1, background: "#fff" }} />))}
      </div>
      <motion.div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <motion.div initial={{ opacity: 0, scale: 0.5, rotate: -180 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }} style={{ position: "relative" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", inset: -20, borderRadius: "50%", border: "1px solid transparent", borderTopColor: "rgba(0,229,255,0.3)", borderRightColor: "rgba(139,92,246,0.2)" }} />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", inset: -35, borderRadius: "50%", border: "1px solid transparent", borderBottomColor: "rgba(244,63,140,0.2)", borderLeftColor: "rgba(0,229,255,0.15)" }} />
          <img src="/AitotaLogo.png" alt="" style={{ width: 180, height: 180, filter: "drop-shadow(0 0 40px rgba(0,229,255,0.4))" }} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: phase === "dissolve" ? 0 : 1, y: phase === "dissolve" ? -20 : 0 }} transition={{ duration: 0.8, delay: 0.5 }}
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.2rem,3vw,2rem)", fontWeight: 800, letterSpacing: "0.2em", color: "var(--text-1)", textTransform: "uppercase" }}>
          AITOTA
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: phase === "dissolve" ? 0 : 0.5 }} transition={{ duration: 0.8, delay: 0.8 }}
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.3em", color: "var(--text-3)", textTransform: "uppercase" }}>
          Conversational Intelligence
        </motion.div>
      </motion.div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "clamp(30px,5vw,60px)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: phase === "dissolve" ? 0 : 1, y: phase === "dissolve" ? -10 : 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
            <span className="label" style={{ color: "var(--text-3)", marginBottom: 8, display: "block", fontSize: 10 }}>Initializing</span>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: "clamp(2rem,6vw,5rem)", fontWeight: 900, lineHeight: 0.9, color: "var(--text-1)",
              background: count > 80 ? "linear-gradient(135deg, var(--accent), var(--accent-2))" : "none",
              WebkitBackgroundClip: count > 80 ? "text" : "initial", WebkitTextFillColor: count > 80 ? "transparent" : "var(--text-1)",
              backgroundClip: count > 80 ? "text" : "initial", transition: "all 0.3s",
            }}>{String(count).padStart(3, "0")}</span>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: phase === "dissolve" ? 0 : 0.5 }} transition={{ delay: 0.5 }}>
            <span className="label" style={{ color: "var(--text-3)", fontSize: 10 }}>© 2026 Aitota</span>
          </motion.div>
        </div>
        <div style={{ height: 2, background: "rgba(255,255,255,0.03)", borderRadius: 2, overflow: "hidden" }}>
          <motion.div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, var(--accent), var(--accent-2))", transformOrigin: "left", boxShadow: "0 0 20px rgba(0,229,255,0.3)" }}
            animate={{ scaleX: count / 100 }} transition={{ duration: 0.1 }} />
        </div>
      </div>
    </motion.div>
  );
}
