import React, { useEffect, useRef } from 'react';
import { BIRTHDAY_CONFIG } from '../config';

/**
 * BirthdayFireworksCelebration
 *
 * Cinematic celebration animation when the floating heart button is clicked:
 * 1. Perspective-accurate distant fireworks:
 *    - All fireworks burst in the distant open sky above the mountain/city skyline.
 *    - Horizon Boundary: Particles fade naturally before reaching the skyline;
 *      ZERO particles ever fall through or appear inside the terrace wall or floor.
 *    - Foreground Exclusion Zone: The girl, sofa, cushions, and plants are
 *      strictly protected; ZERO explosions or particles cross near or over the girl.
 * 2. Letters ignite sequentially with sparkling curves to form:
 *       "HAPPY"    (Line 1)
 *       "BIRTHDAY" (Line 2)
 *    in royal serif typography ("Cinzel").
 * 3. Small, delicate YELLOW FIRECRACKERS crackle and pop around the text,
 *    resembling authentic celebratory crackers in the distant sky.
 * 4. Once formed, the message HOLDS INDEFINITELY with soft breathing aura,
 *    delicate starlight glints, and gentle yellow crackers framing the words.
 * 5. 100% silent, zero-lag, no audio, no automatic redirection.
 * 6. Smooth ~750ms fade transition on second heart button click.
 */
export default function BirthdayFireworksCelebration({
  imageBounds,
  isExiting = false,
  onFormed,
  onComplete,
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const hasTriggeredFormedRef = useRef(false);
  const isExitingRef = useRef(isExiting);
  const exitStartTimeRef = useRef(null);
  const imageBoundsRef = useRef(imageBounds);

  useEffect(() => {
    isExitingRef.current = isExiting;
  }, [isExiting]);

  useEffect(() => {
    imageBoundsRef.current = imageBounds;
  }, [imageBounds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const setupCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    setupCanvasSize();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Warm, romantic celebratory palette (strictly zero cold blue)
    const goldPalette = ['#ffd700', '#fbbf24', '#f59e0b', '#fef08a', '#ffffff', '#fffbeb'];
    const rosePalette = ['#fda4af', '#fb7185', '#f43f5e', '#fef3c7', '#ffffff'];
    const allWarmColors = [...goldPalette, ...rosePalette];
    const yellowPalette = ['#fff176', '#ffd700', '#ffeb3b', '#fbc02d', '#ffffff'];

    // =========================================================================
    // 1. Precise Perspective & Region Geometry (Calculated from cover.png)
    // =========================================================================
    // cover.png aspect ratio is 1672 / 941 (1.7768).
    // In cover.png coordinate space:
    // - Distant mountain skyline top: Y ≈ 620-645px (66-68% of image height)
    // - Terrace wall begins: Y ≈ 685px (72.8% of image height)
    // - Girl, sofa & cushions: X from 0 to ≈ 580px (34.7% of image width), Y > 380px
    const computeRegions = (bounds, w, h) => {
      const isMobile = w <= 768;
      const imgAspect = 1672 / 941;

      let renderW, renderH, offsetX, offsetY;
      if (bounds && bounds.width > 0) {
        renderW = bounds.width;
        renderH = bounds.height;
        offsetX = bounds.left;
        offsetY = bounds.top;
      } else if (isMobile) {
        renderH = h;
        renderW = h * imgAspect;
        offsetX = (w - renderW) * 0.28;
        offsetY = 0;
      } else {
        const vpAspect = w / h;
        if (vpAspect > imgAspect) {
          renderW = w;
          renderH = w / imgAspect;
          offsetX = 0;
          offsetY = h - renderH;
        } else {
          renderH = h;
          renderW = h * imgAspect;
          offsetX = (w - renderW) / 2;
          offsetY = 0;
        }
      }

      // Exact horizon boundary: distant mountains skyline in viewport coordinates
      // Particles must fade and disappear before reaching this line.
      const rawHorizonY = offsetY + renderH * 0.63;
      const horizonLimitY = Math.min(rawHorizonY, h * 0.52);

      // Foreground exclusion zone: girl, head, body, sofa, cushions, pergola
      // Particles and explosions can NEVER cross into this area.
      const rawGirlRightX = offsetX + renderW * 0.38;
      const rawGirlTopY = offsetY + renderH * 0.38;
      const exclusionRightX = Math.max(rawGirlRightX, isMobile ? w * 0.33 : w * 0.37);
      const exclusionTopY = Math.max(0, rawGirlTopY);

      return {
        horizonLimitY,
        exclusionRightX,
        exclusionTopY,
        isMobile,
      };
    };

    let regions = computeRegions(imageBoundsRef.current, width, height);

    // Compute sky placement & layout for "HAPPY BIRTHDAY"
    const getSkyLayout = (w, h, r) => {
      let centerX, centerY, fontSize, spacing1, spacing2, line1Y, line2Y;

      if (r.isMobile) {
        // Mobile portrait sky above character
        centerX = w * 0.52;
        centerY = h * 0.19;
        fontSize = Math.min(Math.floor(w * 0.080), Math.floor(h * 0.052), 30);
        spacing1 = fontSize * 0.22;
        spacing2 = fontSize * 0.15;
        line1Y = centerY - fontSize * 0.68;
        line2Y = centerY + fontSize * 0.68;
      } else {
        // Desktop open central & right sky (safely right of girl, above skyline)
        centerX = Math.max(w * 0.58, r.exclusionRightX + w * 0.18);
        centerY = Math.min(h * 0.24, r.horizonLimitY * 0.52);
        fontSize = Math.min(Math.floor(w * 0.038), Math.floor(h * 0.080), 50);
        spacing1 = fontSize * 0.28;
        spacing2 = fontSize * 0.20;
        line1Y = centerY - fontSize * 0.72;
        line2Y = centerY + fontSize * 0.72;
      }

      return {
        centerX,
        centerY,
        fontSize,
        spacing1,
        spacing2,
        line1Y,
        line2Y,
        isMobile: r.isMobile,
      };
    };

    // Calculate exact coordinates for each letter
    const buildLetterLayout = (layout) => {
      ctx.font = `bold ${Math.round(layout.fontSize)}px "Cinzel", "Playfair Display", Georgia, serif`;

      const measureAndLayout = (text, centerY, letterSpacing, lineIndex, baseIgniteTime, stepTime) => {
        const letters = text.split('');
        const widths = letters.map((char) => ctx.measureText(char).width);
        const totalLettersWidth = widths.reduce((a, b) => a + b, 0);
        const totalSpacing = (letters.length - 1) * letterSpacing;
        const totalWidth = totalLettersWidth + totalSpacing;
        let startX = layout.centerX - totalWidth / 2;

        return letters.map((char, i) => {
          const charCenterX = startX + widths[i] / 2;
          const letterObj = {
            char,
            x: charCenterX,
            y: centerY,
            width: widths[i],
            height: layout.fontSize,
            line: lineIndex,
            igniteStart: baseIgniteTime + i * stepTime,
            igniteDuration: 420,
          };

          // Precompute linear gradient once per layout instead of every frame in render loop
          const grad = ctx.createLinearGradient(
            charCenterX,
            centerY - layout.fontSize * 0.55,
            charCenterX,
            centerY + layout.fontSize * 0.55
          );
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.25, '#fffbeb');
          grad.addColorStop(0.65, '#fbbf24');
          grad.addColorStop(1, '#f59e0b');
          letterObj.gradient = grad;

          startX += widths[i] + letterSpacing;
          return letterObj;
        });
      };

      // Configurable post-fireworks text from BIRTHDAY_CONFIG.fireworksMessage
      let textLine1 = 'HAPPY';
      let textLine2 = 'BIRTHDAY';

      const cfgMsg = BIRTHDAY_CONFIG?.fireworksMessage;
      if (typeof cfgMsg === 'string' && cfgMsg.trim()) {
        const parts = cfgMsg.trim().split(/\s+/);
        if (parts.length === 1) {
          textLine1 = parts[0].toUpperCase();
          textLine2 = '';
        } else {
          textLine1 = parts[0].toUpperCase();
          textLine2 = parts.slice(1).join(' ').toUpperCase();
        }
      } else if (cfgMsg && typeof cfgMsg === 'object') {
        if (cfgMsg.line1 !== undefined) textLine1 = String(cfgMsg.line1).trim().toUpperCase();
        if (cfgMsg.line2 !== undefined) textLine2 = String(cfgMsg.line2).trim().toUpperCase();
      }

      const line1Letters = textLine1 ? measureAndLayout(textLine1, layout.line1Y, layout.spacing1, 0, 750, 160) : [];
      const line2Letters = textLine2 ? measureAndLayout(textLine2, layout.line2Y, layout.spacing2, 1, 1350, 150) : [];

      return [...line1Letters, ...line2Letters];
    };

    let skyLayout = getSkyLayout(width, height, regions);
    let letters = buildLetterLayout(skyLayout);

    // Compute text bounds to constrain the yellow firecrackers around the words
    let textLeft = 0;
    let textRight = 0;
    let textTop = 0;
    let textBottom = 0;
    let textBetweenY = 0;

    const updateTextBounds = () => {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      letters.forEach((l) => {
        const lLeft = l.x - l.width / 2;
        const lRight = l.x + l.width / 2;
        const lTop = l.y - l.height * 0.55;
        const lBottom = l.y + l.height * 0.55;
        if (lLeft < minX) minX = lLeft;
        if (lRight > maxX) maxX = lRight;
        if (lTop < minY) minY = lTop;
        if (lBottom > maxY) maxY = lBottom;
      });

      textLeft = minX;
      textRight = maxX;
      textTop = minY;
      textBottom = maxY;
      textBetweenY = (skyLayout.line1Y + skyLayout.line2Y) / 2;
    };

    updateTextBounds();

    const handleResize = () => {
      setupCanvasSize();
      regions = computeRegions(imageBoundsRef.current, width, height);
      skyLayout = getSkyLayout(width, height, regions);
      letters = buildLetterLayout(skyLayout);
      updateTextBounds();
    };
    window.addEventListener('resize', handleResize);

    // =========================================================================
    // 2. Visual Classes: Rockets, Flashes, Sparkles with Perspective Boundaries
    // =========================================================================

    class Flash {
      constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.alpha = 0.95;
        this.decay = 0.045; // ~18% slower flash fade for a softer, more graceful unfolding
        // Pre-create radial gradient once on instantiation to eliminate per-frame allocations
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.35, color);
        grad.addColorStop(1, 'transparent');
        this.gradient = grad;
      }
      update() {
        this.alpha -= this.decay;
      }
      draw(c) {
        if (this.alpha <= 0) return;
        c.save();
        c.globalAlpha = Math.max(0, this.alpha);
        c.fillStyle = this.gradient;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    // Launch rocket that emerges strictly from beyond the distant skyline (NOT the terrace wall)
    class LaunchRocket {
      constructor(startX, startY, targetX, targetY, color, onExplode) {
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.x = startX;
        this.y = startY;
        this.color = color;
        this.onExplode = onExplode;
        this.progress = 0;
        // ~17% slower ascent so rockets rise smoothly and gracefully before exploding
        this.speed = prefersReducedMotion ? 0.05 : 0.025 + Math.random() * 0.004;
        this.trail = [];
        this.exploded = false;
      }

      update() {
        if (this.exploded) {
          // Allow trail to completely fade out and empty so rocket is cleanly spliced out of memory
          if (this.trail.length > 0) {
            this.trail.shift();
            for (const t of this.trail) {
              t.alpha *= 0.89;
            }
          }
          return;
        }
        this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > 8) this.trail.shift();

        for (const t of this.trail) {
          t.alpha *= 0.89;
        }

        this.progress += this.speed;
        const ease = Math.sin((Math.min(1, this.progress) * Math.PI) / 2);
        this.x = this.startX + (this.targetX - this.startX) * ease;
        this.y = this.startY + (this.targetY - this.startY) * ease;

        if (this.progress >= 1 && !this.exploded) {
          this.exploded = true;
          this.onExplode(this.x, this.y);
        }
      }

      draw(c) {
        if (this.trail.length === 0) return;
        c.save();
        for (let i = 0; i < this.trail.length; i++) {
          const pt = this.trail[i];
          c.globalAlpha = pt.alpha * (i / this.trail.length);
          c.fillStyle = this.color;
          c.shadowBlur = 5;
          c.shadowColor = this.color;
          c.beginPath();
          c.arc(pt.x, pt.y, 1.4 + (i / this.trail.length) * 1.0, 0, Math.PI * 2);
          c.fill();
        }
        if (!this.exploded) {
          c.globalAlpha = 1;
          c.fillStyle = '#ffffff';
          c.shadowBlur = 10;
          c.shadowColor = this.color;
          c.beginPath();
          c.arc(this.x, this.y, 2.2, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }
    }

    // Sparkler streamer particle that converges into letters during ignition
    class SparklerParticle {
      constructor(originX, originY, targetX, targetY, delay, color) {
        this.originX = originX;
        this.originY = originY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.x = originX;
        this.y = originY;
        this.delay = delay;
        this.duration = 530; // ~18% slower convergence for a graceful sweep into letters
        this.color = color;
        this.size = Math.random() * 1.2 + 1.0;
        this.swirl = (Math.random() - 0.5) * 28;
        this.finished = false;
      }

      update(elapsed) {
        if (elapsed < this.delay) return;
        const progress = Math.min(1, (elapsed - this.delay) / this.duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        const swirlOffset = Math.sin(progress * Math.PI) * this.swirl;

        this.x = this.originX + (this.targetX - this.originX) * ease + swirlOffset;
        this.y = this.originY + (this.targetY - this.originY) * ease;

        if (progress >= 1) {
          this.finished = true;
        }
      }

      draw(c, elapsed) {
        if (elapsed < this.delay || this.finished) return;
        c.save();
        c.globalAlpha = 0.95;
        c.fillStyle = this.color;
        c.shadowBlur = 6;
        c.shadowColor = this.color;
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    // =========================================================================
    // 3. Yellow Firecracker Particles with Horizon & Girl Proximity Fading
    // =========================================================================

    class CrackerFlash {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 2.5 + 3.5; // 3.5 - 6px (delicate distant pop)
        this.life = 0;
        this.maxLife = 6; // Slower, softer flash pop
        // Pre-create radial gradient once on instantiation to eliminate per-frame allocations
        const grad = ctx.createRadialGradient(x, y, 0, x, y, this.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.45, '#fff59d');
        grad.addColorStop(1, 'transparent');
        this.gradient = grad;
      }
      update() {
        this.life++;
      }
      draw(c) {
        if (this.life >= this.maxLife) return;
        const alpha = Math.max(0, 1 - this.life / this.maxLife);
        c.save();
        c.globalAlpha = alpha * 0.85;
        c.fillStyle = this.gradient;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    class CrackerSpark {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        const angle = Math.random() * Math.PI * 2;
        // ~18% reduced velocity for gentle, graceful firecracker bursts
        const speed = Math.random() * 1.15 + 0.65;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.friction = 0.905; // Smoother deceleration
        this.gravity = 0.0095; // Gentler downward drift
        this.life = 0;
        // ~20% extended lifetime so sparks remain visible longer and fade gradually
        this.maxLife = Math.floor(Math.random() * 7) + 15;
        this.color = yellowPalette[Math.floor(Math.random() * yellowPalette.length)];
        this.size = Math.random() * 0.5 + 0.9; // 0.9 - 1.4px delicate spark
      }

      update() {
        this.prevX = this.x;
        this.prevY = this.y;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.life++;

        // Strict boundary removal: expire instantly if touching skyline or girl
        if (this.y >= regions.horizonLimitY ||
           (this.y > regions.exclusionTopY && this.x <= regions.exclusionRightX)) {
          this.life = this.maxLife;
        }
      }

      draw(c) {
        if (this.life >= this.maxLife) return;
        const progress = this.life / this.maxLife;
        const baseAlpha = Math.max(0, 1 - progress);

        // Smooth horizon proximity fade (fades out naturally before reaching skyline)
        let horizonFade = 1;
        const horizonFadeZone = 40;
        if (this.y > regions.horizonLimitY - horizonFadeZone) {
          horizonFade = Math.max(0, (regions.horizonLimitY - this.y) / horizonFadeZone);
        }

        // Smooth girl exclusion zone proximity fade
        let girlFade = 1;
        const girlFadeZone = 30;
        if (this.y > regions.exclusionTopY && this.x < regions.exclusionRightX + girlFadeZone) {
          girlFade = Math.max(0, (this.x - regions.exclusionRightX) / girlFadeZone);
        }

        const finalAlpha = baseAlpha * horizonFade * girlFade;
        if (finalAlpha <= 0.01) return;

        c.save();
        c.globalAlpha = finalAlpha;
        c.strokeStyle = this.color;
        c.lineWidth = this.size;
        c.lineCap = 'round';
        c.shadowBlur = 3;
        c.shadowColor = '#ffd700';

        // Delicate short spark line
        c.beginPath();
        c.moveTo(this.prevX, this.prevY);
        c.lineTo(this.x, this.y);
        c.stroke();

        // White-hot tip
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        c.fill();

        c.restore();
      }
    }

    // Floating Stardust Mote (subtle ambient living air strictly in distant sky)
    class StardustMote {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = width * (0.42 + Math.random() * 0.40);
        this.y = height * (0.10 + Math.random() * 0.25);
        this.color = allWarmColors[Math.floor(Math.random() * allWarmColors.length)];
        this.baseSize = Math.random() * 1.0 + 0.7;
        this.alpha = Math.random() * 0.5 + 0.2;
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.speedY = -Math.random() * 0.18 - 0.04;
        this.twinklePhase = Math.random() * Math.PI * 2;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.twinklePhase += 0.03;
        if (this.y < height * 0.07 || this.x < regions.exclusionRightX + 25 || this.x > width * 0.86) {
          this.reset();
          this.y = Math.min(height * 0.35, regions.horizonLimitY - 30);
        }
      }
      draw(c) {
        c.save();
        const twinkle = (Math.sin(this.twinklePhase) + 1) / 2;
        c.globalAlpha = this.alpha * (0.6 + twinkle * 0.4);
        c.fillStyle = this.color;
        c.shadowBlur = 3;
        c.shadowColor = this.color;
        c.beginPath();
        c.arc(this.x, this.y, this.baseSize, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    // Starlight Cross Glint (✦) that flashes softly on letter serifs
    class StarburstGlint {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 0;
        this.maxLife = 32;
        this.size = Math.random() * 3.5 + 4.5;
      }
      update() {
        this.life++;
      }
      draw(c) {
        if (this.life >= this.maxLife) return;
        const progress = this.life / this.maxLife;
        const alpha = Math.sin(progress * Math.PI);
        c.save();
        c.globalAlpha = alpha;
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1;
        c.shadowBlur = 5;
        c.shadowColor = '#ffd700';

        c.beginPath();
        c.moveTo(this.x - this.size, this.y);
        c.lineTo(this.x + this.size, this.y);
        c.moveTo(this.x, this.y - this.size);
        c.lineTo(this.x, this.y + this.size);
        c.stroke();
        c.restore();
      }
    }

    // Distant peripheral burst particle
    class PeripheralParticle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        // ~17% reduced velocity for graceful, less rushed peripheral burst
        const speed = Math.random() * 1.5 + 0.42;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        // Moderately extended lifetime & gradual fading
        this.decay = Math.random() * 0.018 + 0.0115;
        this.size = Math.random() * 1.3 + 0.7;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.012; // Reduced downward gravity so particles drift gently
        this.vx *= 0.958; // Smoother deceleration
        this.vy *= 0.958;
        this.alpha -= this.decay;

        if (this.y >= regions.horizonLimitY ||
           (this.y > regions.exclusionTopY && this.x <= regions.exclusionRightX)) {
          this.alpha = 0;
        }
      }
      draw(c) {
        if (this.alpha <= 0) return;

        // Smooth proximity fade before skyline
        let horizonFade = 1;
        const horizonFadeZone = 35;
        if (this.y > regions.horizonLimitY - horizonFadeZone) {
          horizonFade = Math.max(0, (regions.horizonLimitY - this.y) / horizonFadeZone);
        }

        const finalAlpha = this.alpha * horizonFade;
        if (finalAlpha <= 0.01) return;

        c.save();
        c.globalAlpha = finalAlpha;
        c.fillStyle = this.color;
        c.shadowBlur = 4;
        c.shadowColor = this.color;
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    const rockets = [];
    const flashes = [];
    const sparklerParticles = [];
    const peripheralParticles = [];
    const glints = [];
    const stardustMotes = Array.from({ length: 14 }, () => new StardustMote());

    // Yellow Firecracker collections (bounded array for zero-lag)
    const crackerSparks = [];
    const crackerFlashes = [];

    // Launch opening celebration rockets (Phase 1)
    // Rockets emerge strictly from the distant horizon skyline (NOT the terrace wall)
    const openingRocketTargets = [
      {
        targetX: skyLayout.centerX - width * 0.10,
        targetY: skyLayout.centerY - skyLayout.fontSize * 0.35,
        color: '#ffd700',
      },
      {
        targetX: skyLayout.centerX,
        targetY: skyLayout.centerY - skyLayout.fontSize * 0.55,
        color: '#fb7185',
      },
      {
        targetX: skyLayout.centerX + width * 0.10,
        targetY: skyLayout.centerY - skyLayout.fontSize * 0.25,
        color: '#fbbf24',
      },
      {
        targetX: skyLayout.centerX - width * 0.03,
        targetY: skyLayout.centerY + skyLayout.fontSize * 0.55,
        color: '#fda4af',
      },
      {
        targetX: skyLayout.centerX + width * 0.05,
        targetY: skyLayout.centerY + skyLayout.fontSize * 0.65,
        color: '#ffd700',
      },
    ];

    openingRocketTargets.forEach((target, i) => {
      // Start strictly from distant skyline and safely to the right of the girl
      const startX = Math.max(
        regions.exclusionRightX + 35,
        skyLayout.centerX + (i - 2) * (width * 0.055)
      );
      const startY = regions.horizonLimitY;

      const rocket = new LaunchRocket(
        startX,
        startY,
        target.targetX,
        target.targetY,
        target.color,
        (apexX, apexY) => {
          flashes.push(new Flash(apexX, apexY, 36, target.color));
          for (let s = 0; s < 10; s++) {
            peripheralParticles.push(
              new PeripheralParticle(apexX, apexY, allWarmColors[Math.floor(Math.random() * allWarmColors.length)])
            );
          }
        }
      );
      rockets.push(rocket);
    });

    // Populate sparkler particles that converge to ignite each letter
    letters.forEach((letter) => {
      const particleCount = 7;
      for (let p = 0; p < particleCount; p++) {
        const originX = letter.x + (Math.random() - 0.5) * 50;
        const originY = letter.y + (Math.random() - 0.5) * 35 - 15;
        const targetX = letter.x + (Math.random() - 0.5) * (letter.width * 0.8);
        const targetY = letter.y + (Math.random() - 0.5) * (letter.height * 0.6);
        const color = allWarmColors[Math.floor(Math.random() * allWarmColors.length)];

        sparklerParticles.push(
          new SparklerParticle(
            originX,
            originY,
            targetX,
            targetY,
            letter.igniteStart + p * 20,
            color
          )
        );
      }
    });

    const startTime = performance.now();
    let lastPeripheralFirework = 0;
    let lastGlint = 0;
    let lastCrackerTime = 0;
    let nextCrackerInterval = 200;

    const loop = (timestamp) => {
      const elapsed = timestamp - startTime;

      ctx.clearRect(0, 0, width, height);

      // Handle exit transition fade (when user clicks heart button second time)
      let globalExitAlpha = 1;
      if (isExitingRef.current) {
        if (!exitStartTimeRef.current) {
          exitStartTimeRef.current = timestamp;
        }
        const exitElapsed = timestamp - exitStartTimeRef.current;
        globalExitAlpha = Math.max(0, 1 - exitElapsed / 750);

        if (globalExitAlpha <= 0) {
          onComplete?.();
          return;
        }
      }

      ctx.save();
      ctx.globalAlpha = globalExitAlpha;

      // Check if letters have completely formed (~2750ms)
      if (elapsed >= 2750 && !hasTriggeredFormedRef.current) {
        hasTriggeredFormedRef.current = true;
        onFormed?.();
      }

      // Draw Stardust Motes in open sky
      for (const mote of stardustMotes) {
        mote.update();
        mote.draw(ctx);
      }

      // Update & Draw Opening Rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.update();
        r.draw(ctx);
        if (r.exploded && r.trail.length === 0) {
          rockets.splice(i, 1);
        }
      }

      // Update & Draw Apex Flashes
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.update();
        f.draw(ctx);
        if (f.alpha <= 0) flashes.splice(i, 1);
      }

      // Update & Draw Peripheral Particles
      for (let i = peripheralParticles.length - 1; i >= 0; i--) {
        const p = peripheralParticles[i];
        p.update();
        p.draw(ctx);
        if (p.alpha <= 0) peripheralParticles.splice(i, 1);
      }

      // Update & Draw Sparkler Convergence Particles
      for (let i = sparklerParticles.length - 1; i >= 0; i--) {
        const sp = sparklerParticles[i];
        sp.update(elapsed);
        sp.draw(ctx, elapsed);
        if (sp.finished) {
          sparklerParticles.splice(i, 1);
        }
      }

      // =======================================================================
      // 4. Spawn Yellow Firecrackers Constrained to Distant Sky Region
      // =======================================================================
      // Bounded strictly: above distant mountain skyline, away from girl/sofa
      if (elapsed > 1100 && timestamp - lastCrackerTime > nextCrackerInterval && !isExitingRef.current) {
        lastCrackerTime = timestamp;
        // Paced cadence (195ms to 455ms) for a more graceful, relaxed sequence
        nextCrackerInterval = 195 + Math.random() * 260;

        // Bound active sparks to max 45 for guaranteed 60fps zero-lag performance
        if (crackerSparks.length < 45 && textRight > textLeft) {
          const zone = Math.random();
          let bx, by;

          // Safe boundaries: strictly above horizon and right of girl
          const safeLeftLimit = Math.max(textLeft - 22, regions.exclusionRightX + 25);
          const safeRightLimit = Math.min(textRight + 22, width - 20);
          const safeTopLimit = Math.max(textTop - 18, height * 0.08);
          const safeBottomLimit = Math.min(textBottom + 10, regions.horizonLimitY - 35);

          if (zone < 0.28) {
            // Left of words (guaranteed clear of girl)
            bx = textLeft - Math.random() * 16 - 6;
            if (bx < safeLeftLimit) bx = safeLeftLimit;
            by = textTop + Math.random() * (textBottom - textTop);
          } else if (zone < 0.56) {
            // Right of words
            bx = textRight + Math.random() * 16 + 6;
            if (bx > safeRightLimit) bx = safeRightLimit;
            by = textTop + Math.random() * (textBottom - textTop);
          } else if (zone < 0.78) {
            // Above words
            bx = safeLeftLimit + Math.random() * Math.max(10, safeRightLimit - safeLeftLimit);
            by = textTop - Math.random() * 16 - 6;
            if (by < safeTopLimit) by = safeTopLimit;
          } else if (zone < 0.90) {
            // Below words (strictly above horizonLimitY)
            bx = safeLeftLimit + Math.random() * Math.max(10, safeRightLimit - safeLeftLimit);
            by = textBottom + Math.random() * 8 + 3;
            if (by > safeBottomLimit) by = safeBottomLimit;
          } else {
            // Between the two lines ("HAPPY" & "BIRTHDAY")
            const innerLeft = safeLeftLimit + 15;
            const innerWidth = Math.max(10, safeRightLimit - safeLeftLimit - 30);
            bx = innerLeft + Math.random() * innerWidth;
            by = textBetweenY + (Math.random() - 0.5) * 6;
          }

          // Double check burst center is strictly in valid distant sky region
          if (by < regions.horizonLimitY - 25 &&
             (by < regions.exclusionTopY || bx > regions.exclusionRightX + 20)) {
            crackerFlashes.push(new CrackerFlash(bx, by));
            const sparkCount = Math.floor(Math.random() * 3) + 6; // 6 to 8 delicate sparks
            for (let s = 0; s < sparkCount; s++) {
              crackerSparks.push(new CrackerSpark(bx, by));
            }
          }
        }
      }

      // Update & Draw Yellow Cracker Flashes
      for (let i = crackerFlashes.length - 1; i >= 0; i--) {
        const cf = crackerFlashes[i];
        cf.update();
        cf.draw(ctx);
        if (cf.life >= cf.maxLife) crackerFlashes.splice(i, 1);
      }

      // Update & Draw Yellow Cracker Sparks (with horizon & girl proximity fading)
      for (let i = crackerSparks.length - 1; i >= 0; i--) {
        const cs = crackerSparks[i];
        cs.update();
        cs.draw(ctx);
        if (cs.life >= cs.maxLife) crackerSparks.splice(i, 1);
      }

      // Occasional gentle peripheral firework during HOLD stage (every ~4.5s, far upper-right sky)
      if (elapsed > 3000 && timestamp - lastPeripheralFirework > 4500) {
        lastPeripheralFirework = timestamp;
        // Far right open sky, far away from girl (< 35%) and clear of text
        const px = width * (0.76 + Math.random() * 0.10);
        const py = Math.min(height * (0.14 + Math.random() * 0.08), regions.horizonLimitY - 45);
        flashes.push(new Flash(px, py, 26, '#fbbf24'));
        const burstColor = allWarmColors[Math.floor(Math.random() * allWarmColors.length)];
        for (let b = 0; b < 14; b++) {
          peripheralParticles.push(new PeripheralParticle(px, py, burstColor));
        }
      }

      // Soft breathing aura intensity for letters (quantized to 0.5 steps to allow GPU blur cache reuse)
      const breathingAura = Math.round((Math.sin(timestamp * 0.0022) * 2.5 + 11) * 2) / 2;

      // ==========================================
      // Draw "HAPPY BIRTHDAY" Letters
      // ==========================================
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(skyLayout.fontSize)}px "Cinzel", "Playfair Display", Georgia, serif`;

      letters.forEach((letter) => {
        if (elapsed < letter.igniteStart) return;

        // Ignition progress: 0 to 1 with cubic ease-out
        const progress = Math.min(1, (elapsed - letter.igniteStart) / letter.igniteDuration);
        const ease = 1 - Math.pow(1 - progress, 3);
        const letterAlpha = ease;

        ctx.save();
        ctx.globalAlpha = globalExitAlpha * letterAlpha;

        // Warm celestial outer glow
        ctx.shadowBlur = breathingAura;
        ctx.shadowColor = '#fbbf24';

        // Fill letter
        ctx.fillStyle = letter.gradient;
        ctx.fillText(letter.char, letter.x, letter.y);

        // Crisp inner starlight highlight
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.40)';
        ctx.lineWidth = Math.max(0.6, skyLayout.fontSize * 0.02);
        ctx.strokeText(letter.char, letter.x, letter.y);

        ctx.restore();

        // Spawn a glint when letter first finishes igniting
        if (progress > 0.85 && progress < 0.95 && Math.random() > 0.6) {
          glints.push(new StarburstGlint(letter.x, letter.y - letter.height * 0.35));
        }
      });

      // Occasional gentle starlight glint at letter serifs during HOLD state
      if (elapsed > 2800 && timestamp - lastGlint > 1200) {
        lastGlint = timestamp;
        const randomLetter = letters[Math.floor(Math.random() * letters.length)];
        const offsetX = (Math.random() - 0.5) * (randomLetter.width * 0.7);
        const offsetY = (Math.random() - 0.5) * (randomLetter.height * 0.6);
        glints.push(new StarburstGlint(randomLetter.x + offsetX, randomLetter.y + offsetY));
      }

      // Update & Draw Starburst Glints
      for (let i = glints.length - 1; i >= 0; i--) {
        const g = glints[i];
        g.update();
        g.draw(ctx);
        if (g.life >= g.maxLife) glints.splice(i, 1);
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      ctx.clearRect(0, 0, width, height);
    };
  }, [onFormed, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="birthday-celebration-canvas"
      aria-label="Fireworks spelling Happy Birthday in the sky"
      aria-hidden="true"
    />
  );
}
