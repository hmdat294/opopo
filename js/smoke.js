/**
 * Smoke Cursor Effect
 * Realistic smoke particle system that follows mouse movement
 */
(function () {
    'use strict';
    // ========== Canvas Setup ==========
    const canvas = document.getElementById('smokeCanvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    // ========== Mouse Tracking ==========
    const mouse = { x: width / 2, y: height / 2, prevX: width / 2, prevY: height / 2, speed: 0 };
    let mouseOnScreen = false;
    document.addEventListener('mousemove', (e) => {
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.speed = Math.hypot(mouse.x - mouse.prevX, mouse.y - mouse.prevY);
        mouseOnScreen = true;
    });
    document.addEventListener('mouseleave', () => mouseOnScreen = false);
    document.addEventListener('mouseenter', () => mouseOnScreen = true);
    // ========== Configuration ==========
    const config = {
        baseSize: 40,
        intensity: 3,
        colorScheme: 'custom',
    };
    // Color palettes
    const colorSchemes = {
        custom: {
            getColor: (alpha) => `hsla(${(Date.now() / 20) % 360}, 100%, 50%, ${alpha})`,
            glow: 'rgba(0, 0, 0, 0)',
        },
    };
    // ========== Smoke Particle Class ==========
    class SmokeParticle {
        constructor(x, y, speedFactor) {
            const angle = Math.random() * Math.PI * 2;
            const spread = 1.5 + Math.random() * 2.5;
            this.x = x + (Math.random() - 0.5) * 10;
            this.y = y + (Math.random() - 0.5) * 10;
            this.vx = Math.cos(angle) * spread * 0.5 + (Math.random() - 0.5) * 0.8;
            this.vy = Math.sin(angle) * spread * 0.5 - (0.3 + Math.random() * 0.7); // drift upward
            this.size = config.baseSize * (0.3 + Math.random() * 0.7);
            this.maxSize = this.size * (2.5 + Math.random() * 1.5);
            this.growthRate = (this.maxSize - this.size) / (80 + Math.random() * 60);
            this.alpha = 0.25 + Math.random() * 0.2;
            this.maxAlpha = this.alpha;
            this.decay = 0.002 + Math.random() * 0.003;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.03;
            this.turbulencePhase = Math.random() * Math.PI * 2;
            this.turbulenceSpeed = 0.02 + Math.random() * 0.03;
            this.turbulenceAmp = 0.3 + Math.random() * 0.5;
            this.life = 1.0;
            this.speedBoost = Math.min(speedFactor * 0.01, 0.15);
            // Pre-calculate color for this particle
            const scheme = colorSchemes[config.colorScheme];
            this.colorBase = scheme.getColor(1); // store with alpha=1, we'll adjust in render
        }
        update() {
            // Turbulence - organic wavering motion
            this.turbulencePhase += this.turbulenceSpeed;
            const turbX = Math.sin(this.turbulencePhase) * this.turbulenceAmp;
            const turbY = Math.cos(this.turbulencePhase * 0.7) * this.turbulenceAmp * 0.5;
            this.vx += turbX * 0.02;
            this.vy += turbY * 0.02;
            // Friction / air drag
            this.vx *= 0.985;
            this.vy *= 0.985;
            this.x += this.vx;
            this.y += this.vy;
            // Grow
            if (this.size < this.maxSize) {
                this.size += this.growthRate;
            }
            // Fade
            this.alpha -= this.decay;
            this.life = Math.max(0, this.alpha / this.maxAlpha);
            // Rotate
            this.rotation += this.rotationSpeed;
            return this.alpha > 0.005;
        }
        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.alpha * (0.7 + this.life * 0.3);
            ctx.globalCompositeOperation = 'screen';
            // Soft radial gradient blob
            const r = this.size;
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
            const scheme = colorSchemes[config.colorScheme];

            gradient.addColorStop(0, scheme.getColor(0.4 * this.alpha));
            gradient.addColorStop(0.3, scheme.getColor(0.25 * this.alpha));
            gradient.addColorStop(0.6, scheme.getColor(0.1 * this.alpha));
            gradient.addColorStop(1, scheme.getColor(0));
            ctx.fillStyle = gradient;
            ctx.beginPath();
            // Irregular blob shape for more organic look
            const points = 8;
            for (let i = 0; i <= points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const wobble = 0.8 + Math.sin(angle * 3 + this.turbulencePhase) * 0.2;
                const px = Math.cos(angle) * r * wobble;
                const py = Math.sin(angle) * r * wobble;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
    // ========== Particle System ==========
    let particles = [];
    const MAX_PARTICLES = 500;
    function emitSmoke() {
        if (!mouseOnScreen) return;
        const count = Math.min(
            config.intensity + Math.floor(mouse.speed * 0.15),
            8
        );
        for (let i = 0; i < count; i++) {
            if (particles.length >= MAX_PARTICLES) break;
            // Interpolate between previous and current mouse position
            const t = i / count;
            const x = mouse.prevX + (mouse.x - mouse.prevX) * t;
            const y = mouse.prevY + (mouse.y - mouse.prevY) * t;
            particles.push(new SmokeParticle(x, y, mouse.speed));
        }
    }
    // ========== Render Loop ==========
    function render() {
        // Clear with slight trail effect for smoother fade
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, width, height);
        // Ambient background glow near mouse
        if (mouseOnScreen && mouse.speed > 1) {
            const scheme = colorSchemes[config.colorScheme];
            const glowGrad = ctx.createRadialGradient(
                mouse.x, mouse.y, 0,
                mouse.x, mouse.y, 120
            );
            glowGrad.addColorStop(0, scheme.glow);
            glowGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(mouse.x - 120, mouse.y - 120, 240, 240);
        }
        // Emit & update
        emitSmoke();
        particles = particles.filter((p) => {
            const alive = p.update();
            if (alive) p.draw(ctx);
            return alive;
        });
        requestAnimationFrame(render);
    }
    // Initial full clear
    ctx.clearRect(0, 0, width, height);
    render();
})();