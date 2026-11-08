import React, { useEffect, useRef } from 'react';

/**
 * SadAtmosphere Component
 * 
 * Cinematic Atmospheric Layers for Sad Memories Gallery:
 * 1. Realistic Multi-Depth Rain & Floor Splashes (Canvas-based particle system with dynamic wind)
 * 2. Visible Moving Fog & Rising Wisps (Canvas-based irregular cloud-puff billows drifting in both directions)
 * 3. Floating Dust Particles (CSS drifting particles with soft glow)
 * 4. Roaming Ghosts (Translucent white spirit characters drifting outside the frame)
 */
export default function SadAtmosphere() {
  const rainCanvasRef = useRef(null);
  const fogCanvasRef = useRef(null);

  // ============================================================================
  // 1. REALISTIC RAIN & TERRACE FLOOR SPLASHES (Canvas Particle System)
  // ============================================================================
  useEffect(() => {
    const canvas = rainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = null;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Rain drop population across 3 distinct depth layers (distant, midground, foreground)
    const dropCount = Math.min(150, Math.max(80, Math.floor((width * height) / 8000)));
    const drops = [];

    for (let i = 0; i < dropCount; i++) {
      // 0 = Distant (finer, slower, more transparent)
      // 1 = Midground (medium length and speed)
      // 2 = Foreground (larger, faster, crisp streaks)
      const layer = Math.random() < 0.48 ? 0 : Math.random() < 0.82 ? 1 : 2;
      let speed, length, thickness, alpha, r, g, b;

      if (layer === 0) {
        speed = 10 + Math.random() * 5;
        length = 12 + Math.random() * 10;
        thickness = 0.65 + Math.random() * 0.3;
        alpha = 0.20 + Math.random() * 0.15;
        r = 175; g = 200; b = 235;
      } else if (layer === 1) {
        speed = 18 + Math.random() * 7;
        length = 22 + Math.random() * 14;
        thickness = 1.05 + Math.random() * 0.4;
        alpha = 0.38 + Math.random() * 0.18;
        r = 200; g = 224; b = 250;
      } else {
        speed = 28 + Math.random() * 9;
        length = 36 + Math.random() * 18;
        thickness = 1.65 + Math.random() * 0.55;
        alpha = 0.58 + Math.random() * 0.22;
        r = 230; g = 244; b = 255;
      }

      drops.push({
        x: Math.random() * (width + 400) - 200,
        y: Math.random() * (height + 150) - 100,
        speed,
        length,
        thickness,
        alpha,
        layer,
        r, g, b,
        // Individual wind trajectory variance for natural irregularity
        windOffset: (Math.random() - 0.5) * 0.08,
      });
    }

    // Stray tiny floating water droplets
    const strayDroplets = [];
    for (let i = 0; i < 16; i++) {
      strayDroplets.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speedY: 2.5 + Math.random() * 3.5,
        speedX: 0.8 + Math.random() * 1.2,
        radius: 0.8 + Math.random() * 0.7,
        alpha: 0.3 + Math.random() * 0.3,
      });
    }

    // Floor splashes pool (expanding ripples and micro-bounce droplets)
    const splashes = [];
    const maxSplashes = 35;

    const spawnSplash = (x, y, isForeground) => {
      if (splashes.length >= maxSplashes) return;
      // Floor expanding ripple
      splashes.push({
        type: 'ripple',
        x,
        y,
        rx: 1.5,
        ry: 0.5,
        maxRx: (isForeground ? 8 : 5) + Math.random() * 5,
        growth: 0.65 + Math.random() * 0.35,
        alpha: isForeground ? 0.65 : 0.45,
      });

      // 30% chance of micro bounce droplet
      if (Math.random() < 0.32) {
        splashes.push({
          type: 'bounce',
          x,
          y,
          vx: (Math.random() - 0.5) * 2.2,
          vy: -(1.4 + Math.random() * 1.8),
          alpha: 0.65,
          gravity: 0.16,
          radius: 1.0,
        });
      }
    };

    let lastTime = performance.now();

    const renderRain = (currentTime) => {
      const elapsed = currentTime - lastTime;
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      // Natural oscillating diagonal wind
      const baseWind = 0.22;
      const windGust = Math.sin(currentTime * 0.0006) * 0.045 + Math.cos(currentTime * 0.0013) * 0.025;
      const currentWind = baseWind + windGust;

      // 1. Draw and update Raindrops
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        const effectiveWind = currentWind + d.windOffset;
        const tailX = d.x + d.length * effectiveWind;
        const tailY = d.y + d.length;

        // Draw streak with linear fade from top to tip
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${d.r}, ${d.g}, ${d.b}, ${d.alpha})`;
        ctx.lineWidth = d.thickness;
        ctx.lineCap = 'round';
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        if (!prefersReducedMotion) {
          d.y += d.speed;
          d.x += d.speed * effectiveWind;

          // Splash threshold near the terrace floor
          const floorY = height - 20 - (i % 60);
          if (d.y >= floorY && (d.layer === 1 || d.layer === 2)) {
            if (Math.random() < 0.28) {
              spawnSplash(d.x, d.y, d.layer === 2);
            }
          }

          // Reset drop at top
          if (d.y > height + 40 || d.x > width + 250) {
            d.y = -d.length - Math.random() * 50;
            d.x = Math.random() * (width + 350) - 200;
          }
        }
      }

      // 2. Stray micro-droplets
      for (let i = 0; i < strayDroplets.length; i++) {
        const s = strayDroplets[i];
        ctx.beginPath();
        ctx.fillStyle = `rgba(215, 230, 255, ${s.alpha})`;
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        if (!prefersReducedMotion) {
          s.y += s.speedY;
          s.x += s.speedX + windGust * 2;
          if (s.y > height) {
            s.y = -10;
            s.x = Math.random() * width;
          }
        }
      }

      // 3. Draw and update floor splashes (ripples & bounce droplets)
      for (let i = splashes.length - 1; i >= 0; i--) {
        const sp = splashes[i];

        if (sp.type === 'ripple') {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(210, 230, 255, ${sp.alpha})`;
          ctx.lineWidth = 0.85;
          ctx.ellipse(sp.x, sp.y, sp.rx, sp.ry, 0, 0, Math.PI * 2);
          ctx.stroke();

          if (!prefersReducedMotion) {
            sp.rx += sp.growth;
            sp.ry = sp.rx * 0.32;
            sp.alpha -= 0.038;
            if (sp.alpha <= 0 || sp.rx >= sp.maxRx) {
              splashes.splice(i, 1);
            }
          }
        } else if (sp.type === 'bounce') {
          ctx.beginPath();
          ctx.fillStyle = `rgba(225, 240, 255, ${sp.alpha})`;
          ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
          ctx.fill();

          if (!prefersReducedMotion) {
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.vy += sp.gravity;
            sp.alpha -= 0.045;
            if (sp.alpha <= 0) {
              splashes.splice(i, 1);
            }
          }
        }
      }

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(renderRain);
      }
    };

    animId = requestAnimationFrame(renderRain);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  // ============================================================================
  // 2. VISIBLE MOVING FOG & RISING WISPS (Canvas Particle Cloud Billow System)
  // ============================================================================
  useEffect(() => {
    const canvas = fogCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = null;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Create 4 pre-rendered offscreen soft cloud puff stamps (muted smoky purple, cool blue-grey, deep violet-slate)
    const stampColors = [
      { r: 72, g: 54, b: 94 },  // Smoky purple
      { r: 58, g: 68, b: 96 },  // Cool blue-grey
      { r: 84, g: 68, b: 108 }, // Soft lavender-tinted slate
      { r: 50, g: 42, b: 72 },  // Deep muted twilight purple
    ];

    const stampSize = 256;
    const stamps = stampColors.map((col) => {
      const off = document.createElement('canvas');
      off.width = stampSize;
      off.height = stampSize;
      const offCtx = off.getContext('2d');

      const rad = stampSize / 2;
      const grad = offCtx.createRadialGradient(rad, rad, 0, rad, rad, rad);
      grad.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, 0.58)`);
      grad.addColorStop(0.35, `rgba(${col.r}, ${col.g}, ${col.b}, 0.42)`);
      grad.addColorStop(0.68, `rgba(${col.r}, ${col.g}, ${col.b}, 0.18)`);
      grad.addColorStop(1, `rgba(${col.r}, ${col.g}, ${col.b}, 0.0)`);

      offCtx.fillStyle = grad;
      offCtx.beginPath();
      offCtx.arc(rad, rad, rad, 0, Math.PI * 2);
      offCtx.fill();
      return off;
    });

    // Generate broad, irregular fog billows (26 billows distributed along floor, corners, and lower sides)
    const billowCount = 26;
    const billows = [];

    for (let i = 0; i < billowCount; i++) {
      // Clustering:
      // i % 3 === 0: bottom-left corner & arbor
      // i % 3 === 1: bottom-right corner & wall
      // i % 3 === 2: center terrace floor & lower frame flanks
      let initX, initY, baseSpeed;

      if (i % 3 === 0) {
        initX = Math.random() * (width * 0.38) - 100;
        initY = height * 0.62 + Math.random() * (height * 0.35);
        baseSpeed = (i % 2 === 0 ? 0.38 : -0.32);
      } else if (i % 3 === 1) {
        initX = width * 0.62 + Math.random() * (width * 0.42);
        initY = height * 0.64 + Math.random() * (height * 0.34);
        baseSpeed = (i % 2 === 0 ? -0.42 : 0.35);
      } else {
        initX = Math.random() * width;
        initY = height * 0.70 + Math.random() * (height * 0.28);
        baseSpeed = (i % 2 === 0 ? 0.48 : -0.40);
      }

      billows.push({
        x: initX,
        y: initY,
        baseY: initY,
        scaleX: 1.8 + Math.random() * 2.0,
        scaleY: 1.1 + Math.random() * 1.1,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.0016, // Slow curling
        vx: baseSpeed * (0.8 + Math.random() * 0.4), // Horizontal drift in both directions
        undulatePhase: Math.random() * Math.PI * 2,
        undulateSpeed: 0.0008 + Math.random() * 0.0012,
        alpha: 0.22 + Math.random() * 0.18,
        stampIndex: i % stamps.length,
      });
    }

    // Rising and dissolving wisps (8 wisps that drift up from the floor/sides and dissolve)
    const wispCount = 8;
    const wisps = [];

    const resetWisp = (w) => {
      w.x = Math.random() < 0.5
        ? Math.random() * (width * 0.32)
        : width * 0.68 + Math.random() * (width * 0.32);
      w.y = height * 0.85 + Math.random() * (height * 0.14);
      w.vy = -(0.42 + Math.random() * 0.45);
      w.vx = (Math.random() - 0.4) * 0.4;
      w.scaleX = 0.9 + Math.random() * 0.8;
      w.scaleY = 0.7 + Math.random() * 0.6;
      w.rotation = Math.random() * Math.PI * 2;
      w.rotSpeed = (Math.random() - 0.5) * 0.0022;
      w.maxAlpha = 0.28 + Math.random() * 0.14;
      w.alpha = 0;
      w.stampIndex = Math.floor(Math.random() * stamps.length);
      w.dissolveY = height * 0.42 + Math.random() * (height * 0.16);
    };

    for (let i = 0; i < wispCount; i++) {
      const w = {};
      resetWisp(w);
      // Pre-distribute Y so they don't all rise together at start
      w.y = height * 0.5 + Math.random() * (height * 0.45);
      wisps.push(w);
    }

    const renderFog = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw broad, irregular moving cloud billows
      for (let i = 0; i < billows.length; i++) {
        const b = billows[i];
        const stamp = stamps[b.stampIndex];

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rotation);
        ctx.scale(b.scaleX, b.scaleY);
        ctx.globalAlpha = b.alpha;
        ctx.drawImage(stamp, -stampSize / 2, -stampSize / 2);
        ctx.restore();

        if (!prefersReducedMotion) {
          // Horizontal drift (both directions)
          b.x += b.vx;

          // Slow curling rotation
          b.rotation += b.rotSpeed;

          // Vertical undulating movement
          b.undulatePhase += b.undulateSpeed;
          b.y = b.baseY + Math.sin(b.undulatePhase) * 14;

          // Wrap horizontally around edges with margin
          const margin = 260;
          if (b.vx > 0 && b.x > width + margin) {
            b.x = -margin;
          } else if (b.vx < 0 && b.x < -margin) {
            b.x = width + margin;
          }
        }
      }

      // 2. Draw rising and dissolving wisps
      for (let i = 0; i < wisps.length; i++) {
        const w = wisps[i];
        const stamp = stamps[w.stampIndex];

        ctx.save();
        ctx.translate(w.x, w.y);
        ctx.rotate(w.rotation);
        ctx.scale(w.scaleX, w.scaleY);
        ctx.globalAlpha = Math.max(0, w.alpha);
        ctx.drawImage(stamp, -stampSize / 2, -stampSize / 2);
        ctx.restore();

        if (!prefersReducedMotion) {
          w.y += w.vy;
          w.x += w.vx;
          w.rotation += w.rotSpeed;
          w.scaleX += 0.0015;
          w.scaleY += 0.0012;

          // Opacity lifecycle: fade in when rising from floor, fade out as it approaches dissolveY
          if (w.y > w.dissolveY) {
            const progress = (w.y - w.dissolveY) / (height * 0.4);
            w.alpha = Math.min(w.maxAlpha, (1 - progress) * w.maxAlpha * 1.5);
          } else {
            w.alpha -= 0.008;
            if (w.alpha <= 0) {
              resetWisp(w);
            }
          }
        }
      }

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(renderFog);
      }
    };

    animId = requestAnimationFrame(renderFog);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  // ============================================================================
  // 3. FLOATING DUST PARTICLES (28 visible drifting particles with soft glow)
  // ============================================================================
  const dustParticles = [
    { id: 1, color: '#c8d4e2', size: 3.5, top: '22%', left: '12%', anim: 'dust-drift-1', dur: '18s', del: '-3s', glow: true },
    { id: 2, color: '#565d6c', size: 4.5, top: '48%', left: '18%', anim: 'dust-drift-2', dur: '22s', del: '-7s', glow: false },
    { id: 3, color: '#c45168', size: 3.0, top: '35%', left: '8%', anim: 'dust-drift-3', dur: '16s', del: '-11s', glow: true },
    { id: 4, color: '#9d68b8', size: 4.0, top: '65%', left: '15%', anim: 'dust-drift-4', dur: '20s', del: '-4s', glow: true },
    { id: 5, color: '#e58097', size: 2.5, top: '15%', left: '25%', anim: 'dust-drift-1', dur: '19s', del: '-14s', glow: true },
    { id: 6, color: '#7a8496', size: 5.0, top: '78%', left: '22%', anim: 'dust-drift-2', dur: '25s', del: '-9s', glow: false },
    { id: 7, color: '#b3475d', size: 3.2, top: '85%', left: '10%', anim: 'dust-drift-3', dur: '17s', del: '-2s', glow: true },
    { id: 8, color: '#c279e0', size: 3.8, top: '28%', left: '32%', anim: 'dust-drift-4', dur: '21s', del: '-16s', glow: true },
    
    // Right side particles
    { id: 9, color: '#c8d4e2', size: 3.0, top: '20%', left: '84%', anim: 'dust-drift-2', dur: '19s', del: '-5s', glow: true },
    { id: 10, color: '#4d5463', size: 4.8, top: '42%', left: '88%', anim: 'dust-drift-1', dur: '23s', del: '-12s', glow: false },
    { id: 11, color: '#c45168', size: 3.5, top: '58%', left: '80%', anim: 'dust-drift-4', dur: '18s', del: '-8s', glow: true },
    { id: 12, color: '#9d68b8', size: 4.2, top: '72%', left: '86%', anim: 'dust-drift-3', dur: '22s', del: '-1s', glow: true },
    { id: 13, color: '#e58097', size: 2.8, top: '12%', left: '76%', anim: 'dust-drift-2', dur: '17s', del: '-15s', glow: true },
    { id: 14, color: '#7a8496', size: 4.0, top: '82%', left: '92%', anim: 'dust-drift-1', dur: '24s', del: '-6s', glow: false },
    { id: 15, color: '#d95a73', size: 3.0, top: '30%', left: '68%', anim: 'dust-drift-3', dur: '20s', del: '-10s', glow: true },
    { id: 16, color: '#b570d6', size: 3.6, top: '68%', left: '72%', anim: 'dust-drift-4', dur: '21s', del: '-13s', glow: true },

    // Upper sky & horizon particles
    { id: 17, color: '#c8d4e2', size: 2.5, top: '8%', left: '42%', anim: 'dust-drift-3', dur: '22s', del: '-4s', glow: true },
    { id: 18, color: '#565d6c', size: 3.8, top: '14%', left: '55%', anim: 'dust-drift-2', dur: '20s', del: '-11s', glow: false },
    { id: 19, color: '#c45168', size: 2.8, top: '10%', left: '62%', anim: 'dust-drift-1', dur: '18s', del: '-17s', glow: true },
    { id: 20, color: '#9d68b8', size: 3.2, top: '16%', left: '35%', anim: 'dust-drift-4', dur: '23s', del: '-2s', glow: true },

    // Lower terrace floor particles
    { id: 21, color: '#c8d4e2', size: 4.0, top: '88%', left: '36%', anim: 'dust-drift-1', dur: '19s', del: '-7s', glow: true },
    { id: 22, color: '#4a505e', size: 5.2, top: '92%', left: '48%', anim: 'dust-drift-3', dur: '24s', del: '-14s', glow: false },
    { id: 23, color: '#c45168', size: 3.4, top: '86%', left: '60%', anim: 'dust-drift-2', dur: '17s', del: '-5s', glow: true },
    { id: 24, color: '#a56ec2', size: 4.2, top: '90%', left: '66%', anim: 'dust-drift-4', dur: '22s', del: '-16s', glow: true },
    { id: 25, color: '#e58097', size: 2.6, top: '94%', left: '28%', anim: 'dust-drift-2', dur: '20s', del: '-9s', glow: true },
    { id: 26, color: '#8892a4', size: 3.8, top: '84%', left: '75%', anim: 'dust-drift-1', dur: '21s', del: '-3s', glow: false },
    { id: 27, color: '#d14f6b', size: 3.0, top: '75%', left: '5%', anim: 'dust-drift-4', dur: '18s', del: '-12s', glow: true },
    { id: 28, color: '#bd72e6', size: 3.6, top: '60%', left: '94%', anim: 'dust-drift-3', dur: '23s', del: '-8s', glow: true },
  ];

  return (
    <div className="sad-atmosphere-container" aria-hidden="true">
      {/* LAYER 1: MOVING FOG (Irregular cloud billows & rising wisps in both directions) */}
      <div className="sad-atmos-layer sad-layer-fog">
        <canvas ref={fogCanvasRef} className="sad-fog-canvas" />
      </div>

      {/* LAYER 2: REALISTIC RAIN & SPLASHES (Multi-depth 3D streaks, droplets, floor ripples) */}
      <div className="sad-atmos-layer sad-layer-rain">
        <canvas ref={rainCanvasRef} className="sad-rain-canvas" />
      </div>

      {/* LAYER 3: FLOATING DUST PARTICLES */}
      <div className="sad-atmos-layer sad-layer-dust">
        {dustParticles.map((p) => (
          <span
            key={p.id}
            className={`sad-dust-particle ${p.glow ? 'is-glowing' : ''}`}
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              top: p.top,
              left: p.left,
              backgroundColor: p.color,
              boxShadow: p.glow
                ? `0 0 7px ${p.color}, 0 0 13px ${p.color}`
                : `0 0 3px rgba(0, 0, 0, 0.4)`,
              animationName: p.anim,
              animationDuration: p.dur,
              animationDelay: p.del,
            }}
          />
        ))}
      </div>

      {/* LAYER 4: ROAMING GHOSTS */}
      <div className="sad-atmos-layer sad-layer-ghosts">
        {/* Ghost 1: Roams left terrace patio & lanterns */}
        <div className="sad-ghost-actor ghost-actor-1">
          <GhostFigure width={44} height={54} flipX={false} />
        </div>
        {/* Ghost 2: Roams right terrace wall and moonlit sky */}
        <div className="sad-ghost-actor ghost-actor-2">
          <GhostFigure width={40} height={50} flipX={true} />
        </div>
        {/* Ghost 3: Gentle ethereal spirit drifting across the upper horizon */}
        <div className="sad-ghost-actor ghost-actor-3">
          <GhostFigure width={34} height={42} flipX={false} />
        </div>
      </div>
    </div>
  );
}

/**
 * GhostFigure Component
 * Cute, translucent white spirit with glowing edges, soft floating wavy tail,
 * cute oval eyes with specular highlights, and a tiny shy mouth.
 */
function GhostFigure({ width = 42, height = 52, flipX = false }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 54 68"
      className="sad-ghost-svg"
      style={{ transform: flipX ? 'scaleX(-1)' : 'none' }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="ghostSoftGlow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="ghostSheetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.94" />
          <stop offset="45%" stopColor="#eef3fd" stopOpacity="0.82" />
          <stop offset="85%" stopColor="#d3e0fa" stopOpacity="0.52" />
          <stop offset="100%" stopColor="#b6caf2" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      <g filter="url(#ghostSoftGlow)">
        {/* Ghost Body & Wavy Floating Skirt Tail */}
        <path
          d="M27 6 C15 6 9 17 9 30 C9 36 5 38 5 41 C5 44 9 44 12 42 C13 48 13 56 16 60 C18 62 21 57 24 60 C26 62 29 62 31 59 C34 56 37 62 40 60 C43 57 43 50 44 43 C47 45 51 45 51 42 C51 39 47 37 47 30 C47 17 39 6 27 6 Z"
          fill="url(#ghostSheetGrad)"
          stroke="rgba(255, 255, 255, 0.85)"
          strokeWidth="0.8"
        />

        {/* Cute Spooky Dark Eyes with Specular Highlights */}
        <ellipse cx="21" cy="23.5" rx="2.6" ry="3.6" fill="#181a28" />
        <circle cx="20" cy="22.2" r="1.1" fill="#ffffff" />
        <ellipse cx="33" cy="23.5" rx="2.6" ry="3.6" fill="#181a28" />
        <circle cx="32" cy="22.2" r="1.1" fill="#ffffff" />

        {/* Cute Little Open Spooky Mouth */}
        <ellipse cx="27" cy="31" rx="2.2" ry="2.8" fill="#181a28" opacity="0.85" />

        {/* Soft Pink Cheek Blushes */}
        <ellipse cx="16" cy="27" rx="2.6" ry="1.4" fill="#ff9eb5" opacity="0.45" />
        <ellipse cx="38" cy="27" rx="2.6" ry="1.4" fill="#ff9eb5" opacity="0.45" />
      </g>
    </svg>
  );
}
