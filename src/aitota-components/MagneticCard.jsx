import { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

// Configuration for the grid
const GRID_COLS = 15;
const GRID_ROWS = 20;
const CELL_SIZE = 30; // Spacing between lines

export default function MagneticCard() {
    const containerRef = useRef(null);

    // Mouse position relative to the container (in pixels)
    // Initialize as null to represent "outside/reset" state
    const mouseX = useMotionValue(null);
    const mouseY = useMotionValue(null);

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(null);
        mouseY.set(null);
    };

    // Generate grid positions
    // We center the grid within the card roughly, or just cover the area
    // Loop to create Position objects {x, y}
    const lines = [];
    for (let i = 0; i < GRID_ROWS; i++) {
        for (let j = 0; j < GRID_COLS; j++) {
            lines.push({
                id: `${i}-${j}`,
                x: j * CELL_SIZE + CELL_SIZE / 2, // Center of the cell
                y: i * CELL_SIZE + CELL_SIZE / 2,
            });
        }
    }

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="magnetic-card"
            style={{
                position: "relative",
                width: "340px",
                height: "440px",
                backgroundColor: "#050510", // Dark detailed background
                borderRadius: "24px",
                overflow: "hidden",
                cursor: "crosshair",
                boxShadow: "0 20px 40px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.1)",
            }}
        >
            {/* Background Gradient Mesh (Subtle) */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(circle at 50% 0%, rgba(50,50,80,0.5), transparent 70%)",
                    zIndex: 0,
                }}
            />

            {/* Interactive Grid */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexWrap: "wrap",
                    alignContent: "flex-start",
                    pointerEvents: "none", // Let mouse events pass to container
                    padding: "10px", // Offset
                }}
            >
                {lines.map((line) => (
                    <Filing
                        key={line.id}
                        baseX={line.x}
                        baseY={line.y}
                        mouseX={mouseX}
                        mouseY={mouseY}
                    />
                ))}
            </div>

            {/* Overlay Text/UI (Optional but requested "Card" features usually imply content) */}
            <div style={{ position: "absolute", bottom: 30, left: 30, pointerEvents: "none", zIndex: 10 }}>
                <h3 style={{
                    color: "#fff",
                    fontFamily: "var(--font-display, sans-serif)",
                    fontSize: "20px",
                    fontWeight: 700,
                    marginBottom: "4px",
                    textShadow: "0 2px 10px rgba(0,0,0,0.5)"
                }}>
                    Voice AI
                </h3>
                <p style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "12px",
                    letterSpacing: "0.05em"
                }}>
                    NEURAL ENGINE ACTIVE
                </p>
            </div>

            {/* Status Dot */}
            <div style={{
                position: "absolute",
                top: 30,
                right: 30,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#00e5ff",
                boxShadow: "0 0 10px #00e5ff"
            }} />
        </div>
    );
}

function Filing({ baseX, baseY, mouseX, mouseY }) {
    // Calculate rotation angle
    const angle = useTransform([mouseX, mouseY], ([mx, my]) => {
        if (mx === null || my === null) return 0;
        const dx = mx - baseX;
        const dy = my - baseY;
        return Math.atan2(dy, dx) * (180 / Math.PI);
    });

    // Calculate distance
    const distance = useTransform([mouseX, mouseY], ([mx, my]) => {
        if (mx === null || my === null) return 500; // Far value
        const dx = mx - baseX;
        const dy = my - baseY;
        return Math.sqrt(dx * dx + dy * dy);
    });

    // Derived properties based on distance
    const opacity = useTransform(distance, [0, 200], [1, 0.2]);
    const scale = useTransform(distance, [0, 200], [1.3, 0.8]);

    // Spring physics
    const springConfig = { damping: 20, stiffness: 150 };
    const smoothAngle = useSpring(angle, springConfig);
    const smoothOpacity = useSpring(opacity, springConfig);
    const smoothScale = useSpring(scale, springConfig);

    return (
        <div
            style={{
                position: "absolute",
                top: baseY,
                left: baseX,
                width: CELL_SIZE,
                height: CELL_SIZE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none"
            }}
        >
            <motion.div
                style={{
                    width: "14px",
                    height: "2px",
                    backgroundColor: "#fff",
                    borderRadius: "1px",
                    rotate: smoothAngle,
                    opacity: smoothOpacity,
                    scale: smoothScale,
                }}
            />
        </div>
    );
}
