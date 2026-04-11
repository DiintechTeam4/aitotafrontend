import { useRef, useEffect } from "react";

export default function MagneticBackground() {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d", { alpha: true });
        let animationFrameId;

        // Configuration
        const gridSize = 35; // Spacing between lines
        const lineLength = 15; // Length of each line
        const color = "255, 255, 255"; // Grid color (RGB)

        // State
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;

        // Mouse Tracker
        const handleMouseMove = (e) => {
            if (!container) return;
            const rect = container.getBoundingClientRect();
            targetX = e.clientX - rect.left;
            targetY = e.clientY - rect.top;
        };

        window.addEventListener("mousemove", handleMouseMove);

        // Initial Resize
        const updateSize = () => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        };

        // Resize Observer
        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(container);
        updateSize();

        // Animation Loop
        const render = () => {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const width = canvas.width;
            const height = canvas.height;

            // Smooth mouse movement (lerp)
            currentX += (targetX - currentX) * 0.1;
            currentY += (targetY - currentY) * 0.1;

            const cols = Math.ceil(width / gridSize);
            const rows = Math.ceil(height / gridSize);

            ctx.strokeStyle = `rgba(${color}, 1)`;
            ctx.lineWidth = 2.5; // Thicker lines for visibility
            ctx.lineCap = "round";

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = i * gridSize + gridSize / 2;
                    const y = j * gridSize + gridSize / 2;

                    // Calculate angle to mouse
                    const dx = currentX - x;
                    const dy = currentY - y;
                    const angle = Math.atan2(dy, dx);

                    // Calculate distance for dynamic styling
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Opacity Falloff (closer = clearer)
                    // Range: 0 to 600px
                    const opacity = Math.max(0.15, 1 - dist / 600);

                    // Scale Calculation (closer = longer)
                    // Base length 15, max scale ~25
                    const length = Math.max(10, lineLength + (1 - Math.min(dist / 600, 1)) * 10);

                    // Draw
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(angle);
                    ctx.globalAlpha = opacity;

                    ctx.beginPath();
                    ctx.moveTo(-length / 2, 0);
                    ctx.lineTo(length / 2, 0);
                    ctx.stroke();

                    ctx.restore();
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        // Cleanup
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            resizeObserver.disconnect();
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="magnetic-background"
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                overflow: "hidden",
                pointerEvents: "none",
            }}
        >
            <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%", position: 'absolute', inset: 0 }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 30%, rgba(5,5,16,0.8) 100%)" }} />
        </div>
    );
}
