import React, { useEffect, useRef } from 'react';

/**
 * High-Performance HTML5 Canvas Fireworks
 * - Bursting primarily in the open central and right sky (X: 36% - 82%, Y: 12% - 50%)
 * - Leaves seated girl & pergola (< 35%) and crescent moon (> 85%) unobstructed
 * - Varied explosion sizes for depth (small, medium, large bursts)
 * - Warm gold, champagne-white, and rose-gold palette with bright central flashes
 * - Pointer-events: none, transparent canvas
 * - Continuous waves until active is false / unmount
 */
export default function FireworksCanvas({ active = false }) {
  const canvasRef = useRef(null);
  const animFrameId = useRef(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Warm celebratory palette matching reference
    const colorThemes = [
      ['#f59e0b', '#fbbf24', '#fef08a', '#ffffff'], // Warm Gold & Champagne
      ['#fda4af', '#fb7185', '#fef3c7', '#ffffff'], // Rose Gold & Stardust
      ['#fcd34d', '#f59e0b', '#fffbeb', '#ffd700'], // Radiant Amber Gold
      ['#f43f5e', '#fda4af', '#fef08a', '#ffffff'], // Romantic Twilight Pink
    ];

    const particles = [];
    const rockets = [];
    const flashes = [];

    const pendingTimers = [];

    class Flash {
      constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.alpha = 0.85;
        this.decay = 0.065; // Slightly slower, smoother flash fade (~18% longer glow)
        // Pre-create radial gradient once upon creation instead of every frame
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, color);
        grad.addColorStop(1, 'transparent');
        this.gradient = grad;
      }
      update() {
        this.alpha -= this.decay;
      }
      draw(c) {
        if (this.alpha <= 0) return;
        c.save();
        c.globalAlpha = this.alpha;
        c.fillStyle = this.gradient;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    class Particle {
      constructor(x, y, color, speedScale = 1, sizeScale = 1) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        // ~18% reduced initial burst speed for graceful, less sudden expansion
        const speed = (Math.random() * 3.7 + 1.0) * speedScale;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.friction = 0.965; // Smooth air resistance deceleration
        this.gravity = 0.044; // Reduced downward gravity (particles float and fall gently)
        this.alpha = 1;
        // Moderately extended lifetime & gradual fading
        this.decay = Math.random() * 0.0105 + 0.0065;
        this.size = (Math.random() * 2.2 + 1.2) * sizeScale;
        this.sparkle = Math.random() > 0.35;
        // Preallocated fixed ring buffer for trail coordinates to avoid 18,000 object allocations/sec
        this.hx = [x, x, x, x];
        this.hy = [y, y, y, y];
        this.hCount = 1;
      }

      update() {
        // Shift trail history without allocating temporary { x, y } objects
        this.hx[3] = this.hx[2]; this.hy[3] = this.hy[2];
        this.hx[2] = this.hx[1]; this.hy[2] = this.hy[1];
        this.hx[1] = this.hx[0]; this.hy[1] = this.hy[0];
        this.hx[0] = this.x;     this.hy[0] = this.y;
        if (this.hCount < 4) this.hCount++;

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
      }

      draw(c) {
        c.save();
        c.globalAlpha = Math.max(0, this.alpha);

        // Subtle curved particle trail
        if (this.hCount > 1) {
          c.strokeStyle = this.color;
          c.lineWidth = this.size * 0.6;
          c.beginPath();
          c.moveTo(this.hx[0], this.hy[0]);
          for (let i = 1; i < this.hCount; i++) {
            c.lineTo(this.hx[i], this.hy[i]);
          }
          c.stroke();
        }

        c.fillStyle = this.color;
        c.shadowBlur = 6;
        c.shadowColor = this.color;
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fill();

        // Starlight twinkle
        if (this.sparkle && Math.random() > 0.55) {
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }
    }

    class Rocket {
      constructor() {
        // Main fireworks area: central & right sky (between 36% and 82% width)
        // Keeps girl (< 35%) and crescent moon (> 85%) unobstructed
        this.x = Math.random() * (width * 0.46) + width * 0.36;
        // Launch from above the wall / horizon line
        this.y = height * 0.68;
        // Burst altitude in the upper-middle sky
        this.targetY = Math.random() * (height * 0.38) + height * 0.12;
        // ~18% slower launch ascent so rockets travel smoothly before exploding
        this.speed = Math.random() * 2.0 + 6.6;
        this.theme = colorThemes[Math.floor(Math.random() * colorThemes.length)];
        this.color = this.theme[0];
        // Random burst type: large (30%), medium (50%), small sparkle (20%)
        const rand = Math.random();
        this.type = rand > 0.7 ? 'large' : rand > 0.2 ? 'medium' : 'small';
        this.exploded = false;
        this.trail = [];
      }

      update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 6) this.trail.shift();
        this.y -= this.speed;

        if (this.y <= this.targetY) {
          this.explode();
          this.exploded = true;
        }
      }

      explode() {
        // Bright central flash
        flashes.push(new Flash(this.x, this.y, this.type === 'large' ? 45 : 30, this.color));

        let count = prefersReducedMotion ? 20 : 50;
        let speedScale = 1;
        let sizeScale = 1;

        if (this.type === 'large') {
          count = prefersReducedMotion ? 35 : 85;
          speedScale = 1.35;
          sizeScale = 1.25;
        } else if (this.type === 'small') {
          count = prefersReducedMotion ? 15 : 32;
          speedScale = 0.75;
          sizeScale = 0.85;
        }

        for (let i = 0; i < count; i++) {
          const c = this.theme[Math.floor(Math.random() * this.theme.length)];
          particles.push(new Particle(this.x, this.y, c, speedScale, sizeScale));
        }

        // Additional champagne-white central sparkles
        const sparklesCount = this.type === 'large' ? 20 : 10;
        for (let j = 0; j < sparklesCount; j++) {
          particles.push(new Particle(this.x, this.y, '#ffffff', speedScale * 0.6, 0.7));
        }
      }

      draw(c) {
        c.save();
        for (let i = 0; i < this.trail.length; i++) {
          const pt = this.trail[i];
          c.globalAlpha = (i / this.trail.length) * 0.7;
          c.fillStyle = '#fbbf24';
          c.beginPath();
          c.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }
    }

    let lastLaunch = 0;
    // Paced launch intervals (~18% more spaced out so experience doesn't feel rushed)
    const launchInterval = prefersReducedMotion ? 1400 : 620;

    const loop = (timestamp) => {
      ctx.clearRect(0, 0, width, height);

      // Launch repeated waves
      if (timestamp - lastLaunch > launchInterval) {
        rockets.push(new Rocket());
        // Occasional double burst for depth
        if (Math.random() > 0.55 && !prefersReducedMotion) {
          const tid = setTimeout(() => {
            rockets.push(new Rocket());
            const idx = pendingTimers.indexOf(tid);
            if (idx !== -1) pendingTimers.splice(idx, 1);
          }, 190);
          pendingTimers.push(tid);
        }
        lastLaunch = timestamp;
      }

      // Draw flashes
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.update();
        f.draw(ctx);
        if (f.alpha <= 0) flashes.splice(i, 1);
      }

      // Update & draw rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.update();
        r.draw(ctx);
        if (r.exploded) rockets.splice(i, 1);
      }

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.alpha <= 0) particles.splice(i, 1);
      }

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);

    // Initial burst on reveal
    rockets.push(new Rocket());

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
      for (const tid of pendingTimers) {
        clearTimeout(tid);
      }
      pendingTimers.length = 0;
      ctx.clearRect(0, 0, width, height);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fireworks-canvas"
      aria-hidden="true"
    />
  );
}
