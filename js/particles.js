/**
 * ==============================================================================
 *  PARTICLE ENGINE & CINEMATIC VISUAL EFFECTS (White & Pink Theme)
 * ==============================================================================
 *  60 FPS Canvas-driven particle system for:
 *   - Background stars & cosmic dust
 *   - Mouse/touch fairy cursor trail
 *   - Cinematic slow-motion heart burst explosion (White & Pink hearts + sparkles)
 *   - Falling Cherry Blossom (Sakura) petals with 3D tumble physics
 *   - Ambient drifting glowing pink particles & sparkles
 *   - Traveling glowing petals from tree to text (Magical connection)
 *   - Text aura sparkles & tiny floating hearts around name
 *   - Celebration rising floating hearts & 3D confetti
 */

class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Core Particle Pools
    this.stars = [];
    this.cursorParticles = [];
    this.burstHearts = [];
    this.burstSparkles = [];
    this.floatingHearts = [];
    this.confettiPieces = [];
    this.shockwaves = [];
    this.arrowTrails = [];

    // Sakura & Twilight Magic Pools
    this.sakuraPetals = [];
    this.ambientPinkMotes = [];
    this.travelingPetals = [];
    this.textAuraParticles = [];

    // States & Clocks
    this.timeScale = 1.0;
    this.targetTimeScale = 1.0;
    this.isCelebrationActive = false;
    this.isPetalsActive = false;
    this.isTwilightAmbientActive = false;
    this.isTextAuraActive = false;
    this.textAuraTargetRect = null;
    this.blossomCoordsGetter = null;

    this.floatingHeartTimer = 0;
    this.confettiTimer = 0;
    this.sakuraSpawnTimer = 0;
    this.ambientMoteTimer = 0;
    this.textAuraTimer = 0;

    this.mouse = { x: -999, y: -999, prevX: -999, prevY: -999, speed: 0 };

    this.initCanvas();
    this.initStars();
    this.bindEvents();
  }

  initCanvas() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(this.dpr, this.dpr);
  }

  resize() {
    this.initCanvas();
    this.initStars();
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());

    const updateMouse = (x, y) => {
      if (this.mouse.x === -999) {
        this.mouse.x = x;
        this.mouse.y = y;
        this.mouse.prevX = x;
        this.mouse.prevY = y;
        return;
      }
      const dx = x - this.mouse.x;
      const dy = y - this.mouse.y;
      this.mouse.speed = Math.sqrt(dx * dx + dy * dy);
      this.mouse.prevX = this.mouse.x;
      this.mouse.prevY = this.mouse.y;
      this.mouse.x = x;
      this.mouse.y = y;

      // Spawn cursor sparkles if moving
      if (this.mouse.speed > 2.5) {
        this.spawnCursorTrail(x, y);
      }
    };

    window.addEventListener("mousemove", (e) => updateMouse(e.clientX, e.clientY));
    window.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0) {
        updateMouse(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
  }

  initStars() {
    this.stars = [];
    const count = Math.min(Math.floor((this.width * this.height) / 8000), 110);
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: (Math.random() * 0.02 + 0.008) * (Math.random() > 0.5 ? 1 : -1),
        // Soft white, delicate rose pink and warm starlight
        hue: Math.random() > 0.6 ? 335 : Math.random() > 0.3 ? 350 : 45,
      });
    }
  }

  spawnCursorTrail(x, y) {
    if (this.cursorParticles.length > 35) return;
    this.cursorParticles.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 12,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5 - 0.5,
      size: Math.random() * 8 + 6,
      alpha: 0.85,
      decay: Math.random() * 0.03 + 0.02,
      color: Math.random() > 0.4 ? "#ffffff" : "#ff80a4",
      isHeart: Math.random() > 0.4,
      rotation: Math.random() * Math.PI * 2,
    });
  }

  addArrowTrailParticle(x, y) {
    this.arrowTrails.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      size: Math.random() * 5 + 3,
      alpha: 0.92,
      decay: 0.045,
      color: Math.random() > 0.5 ? "#ffffff" : "#ff7597",
    });
  }

  /**
   * THE HEART BURST EXPLOSION (Slow-Motion Cinematic Transition)
   * Triggers immediately when arrow hits center heart
   */
  triggerHeartExplosion(centerX, centerY) {
    // 1. Slow-Motion time dilation: slow scene down for a brief cinematic moment
    this.timeScale = 0.26;
    this.targetTimeScale = 1.0;

    // 2. Shockwave ring in White & Pink
    this.shockwaves.push({
      x: centerX,
      y: centerY,
      radius: 12,
      maxRadius: Math.max(this.width, this.height) * 0.48,
      alpha: 1.0,
      lineWidth: 9,
      color: "rgba(255, 117, 151, ",
    });
    this.shockwaves.push({
      x: centerX,
      y: centerY,
      radius: 6,
      maxRadius: Math.max(this.width, this.height) * 0.32,
      alpha: 0.9,
      lineWidth: 4,
      color: "rgba(255, 255, 255, ",
    });

    // 3. High-energy burst hearts in White and Pink tones (100+ hearts)
    const heartCount = 105;
    const heartColors = [
      "#ffffff", "#fff0f5", "#ffd5e2", "#ffb3c6", 
      "#ff80a0", "#ff4d79", "#ff2a6d", "#ffd166"
    ];

    for (let i = 0; i < heartCount; i++) {
      const angle = (Math.PI * 2 * i) / heartCount + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 12 + 4.5;
      this.burstHearts.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (Math.random() * 3 + 1),
        gravity: 0.14,
        drag: 0.97,
        size: Math.random() * 22 + 10,
        scale: 1,
        alpha: 1,
        decay: Math.random() * 0.009 + 0.005, // lingers gracefully
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.12,
        color: heartColors[Math.floor(Math.random() * heartColors.length)],
      });
    }

    // 4. Glowing micro-sparkles and stardust (140 particles)
    for (let i = 0; i < 140; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 16 + 2;
      this.burstSparkles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        drag: 0.96,
        size: Math.random() * 4.5 + 1.5,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.01,
        color: Math.random() > 0.4 ? "#ffffff" : "#ffb3c6",
        isStar: Math.random() > 0.35,
      });
    }

    // 5. Begin gentle ambient pink motes drifting across the screen
    this.startTwilightAmbient();
  }

  /**
   * AMBIENT DRIFTING GLOWING PINK PARTICLES & SPARKLES
   */
  startTwilightAmbient() {
    this.isTwilightAmbientActive = true;
    // Pre-seed drifting stardust across screen
    for (let i = 0; i < 28; i++) {
      this.spawnAmbientPinkMote(true);
    }
  }

  spawnAmbientPinkMote(randomPos = false) {
    if (this.ambientPinkMotes.length >= 50) return;
    this.ambientPinkMotes.push({
      x: randomPos ? Math.random() * this.width : (Math.random() > 0.3 ? -10 : Math.random() * this.width),
      y: randomPos ? Math.random() * this.height : Math.random() * this.height,
      vx: Math.random() * 0.9 + 0.3,
      vy: (Math.random() - 0.5) * 0.6 - 0.15,
      size: Math.random() * 3.8 + 1.5,
      alpha: 0,
      targetAlpha: Math.random() * 0.75 + 0.25,
      fadeIn: true,
      decay: Math.random() * 0.004 + 0.003,
      pulseSpeed: Math.random() * 0.04 + 0.02,
      pulseAngle: Math.random() * Math.PI * 2,
      color: Math.random() > 0.4 ? "#ffffff" : "#ffb3c6",
      isStar: Math.random() > 0.5,
    });
  }

  /**
   * SAKURA FALLING PETALS SYSTEM
   * Continuously generates soft white & pink petals naturally falling from the tree
   */
  startSakuraPetals(coordsGetter) {
    this.isPetalsActive = true;
    this.blossomCoordsGetter = coordsGetter;

    // Seed initial batch of drifting petals
    for (let i = 0; i < 18; i++) {
      this.spawnSakuraPetal(true);
    }
  }

  spawnSakuraPetal(randomY = false) {
    if (this.sakuraPetals.length >= 45) return;

    let originX = 0;
    let originY = 0;

    // Pick a natural branch blossom position if available
    if (this.blossomCoordsGetter) {
      const coords = this.blossomCoordsGetter();
      if (coords && coords.length > 0) {
        const pt = coords[Math.floor(Math.random() * coords.length)];
        originX = pt.x + (Math.random() - 0.5) * 40;
        originY = pt.y + (Math.random() - 0.5) * 40;
      }
    }

    if (!originX || originX <= 0) {
      originX = Math.random() * (this.width * 0.4);
      originY = randomY ? Math.random() * this.height * 0.7 : -20;
    } else if (randomY) {
      originY = Math.random() * this.height * 0.8;
    }

    const colors = [
      { top: "#ffffff", base: "#ffd5e2" },
      { top: "#ffffff", base: "#ffb8cc" },
      { top: "#fff5f8", base: "#ff8da9" },
      { top: "#ffffff", base: "#ffaec0" },
    ];
    const colorPair = colors[Math.floor(Math.random() * colors.length)];

    this.sakuraPetals.push({
      x: originX,
      y: originY,
      vx: Math.random() * 1.5 + 0.8, // gentle rightward wind drift toward center/screen
      vy: Math.random() * 1.4 + 0.9, // natural falling speed
      size: Math.random() * 7 + 8,   // 8 to 15px
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      flipAngle: Math.random() * Math.PI * 2,
      flipSpeed: Math.random() * 0.04 + 0.02,
      swayAngle: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.03 + 0.02,
      swayAmp: Math.random() * 1.8 + 0.8,
      alpha: Math.random() * 0.35 + 0.65,
      colorTop: colorPair.top,
      colorBase: colorPair.base,
    });
  }

  /**
   * MAGICAL CONNECTION: Glowing Petals Travel From Tree to Text
   */
  triggerTravelingPetalsToText(sourceX, sourceY, targetX, targetY) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const delay = i * 90;
      setTimeout(() => {
        const startX = sourceX + (Math.random() - 0.5) * 60;
        const startY = sourceY + (Math.random() - 0.5) * 60;
        const destX = targetX + (Math.random() - 0.5) * 160;
        const destY = targetY + (Math.random() - 0.5) * 100;

        // Curved arc control point (arches gracefully over screen)
        const ctrlX = (startX + destX) / 2 + (Math.random() - 0.5) * 100;
        const ctrlY = Math.min(startY, destY) - (Math.random() * 120 + 80);

        this.travelingPetals.push({
          startX,
          startY,
          ctrlX,
          ctrlY,
          destX,
          destY,
          progress: 0,
          speed: Math.random() * 0.012 + 0.014,
          x: startX,
          y: startY,
          size: Math.random() * 6 + 10,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.1,
          flip: 0,
          flipSpeed: 0.08,
          alpha: 1,
          isHeart: Math.random() > 0.5,
          color: Math.random() > 0.4 ? "#ffffff" : "#ff7597",
        });
      }, delay);
    }
  }

  /**
   * TEXT AURA SPARKLES & FLOATING HEARTS AROUND RECIPIENT NAME
   */
  startTextAura(targetEl) {
    if (!targetEl) return;
    this.isTextAuraActive = true;
    this.textAuraTargetEl = targetEl;
    this.updateTextAuraRect();
  }

  updateTextAuraRect() {
    if (this.textAuraTargetEl) {
      this.textAuraTargetRect = this.textAuraTargetEl.getBoundingClientRect();
    }
  }

  spawnTextAuraParticle() {
    if (!this.textAuraTargetRect || this.textAuraParticles.length >= 26) return;
    const r = this.textAuraTargetRect;
    if (r.width === 0) return;

    const isHeart = Math.random() > 0.4;
    this.textAuraParticles.push({
      x: r.left + Math.random() * r.width,
      y: r.top + r.height * 0.5 + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -(Math.random() * 0.9 + 0.4),
      size: isHeart ? Math.random() * 9 + 8 : Math.random() * 5 + 3,
      alpha: 0.95,
      decay: Math.random() * 0.02 + 0.012,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.08,
      isHeart,
      color: Math.random() > 0.5 ? "#ffffff" : "#ff7597",
    });
  }

  /**
   * CONTINUOUS CELEBRATION EFFECTS (Cake / Balloons Stage)
   */
  startCelebration() {
    this.isCelebrationActive = true;
    this.spawnConfettiBurst();
  }

  spawnConfettiBurst() {
    // White & Pink themed celebration confetti with gold accents
    const colors = ["#ffffff", "#ffd5e2", "#ff80a4", "#ff4d79", "#ff2a6d", "#ffd166", "#fff0f5"];
    const count = 75;

    // Left cannon
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.7;
      const speed = Math.random() * 14 + 10;
      this.confettiPieces.push(this.createConfettiPiece(0, this.height * 0.9, angle, speed, colors));
    }
    // Right cannon
    for (let i = 0; i < count; i++) {
      const angle = (-3 * Math.PI) / 4 + (Math.random() - 0.5) * 0.7;
      const speed = Math.random() * 14 + 10;
      this.confettiPieces.push(this.createConfettiPiece(this.width, this.height * 0.9, angle, speed, colors));
    }
  }

  createConfettiPiece(x, y, angle, speed, colors) {
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.22,
      drag: 0.98,
      w: Math.random() * 10 + 6,
      h: Math.random() * 6 + 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      flipSpeed: Math.random() * 0.15 + 0.05,
      flipAngle: Math.random() * Math.PI,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.25 ? "rect" : "circle",
    };
  }

  spawnRisingHeart() {
    const heartColors = ["#ffffff", "#ffd5e2", "#ff80a4", "#ff4d79", "#ff2a6d", "#ffd166"];
    this.floatingHearts.push({
      x: Math.random() * this.width,
      y: this.height + 30,
      size: Math.random() * 18 + 12,
      speedY: Math.random() * 1.5 + 1.2,
      swaySpeed: Math.random() * 0.03 + 0.015,
      swayDist: Math.random() * 35 + 15,
      swayOffset: Math.random() * Math.PI * 2,
      alpha: Math.random() * 0.6 + 0.35,
      color: heartColors[Math.floor(Math.random() * heartColors.length)],
    });
  }

  triggerWishExplosion(x, y) {
    const count = 90;
    const colors = ["#ffffff", "#ffd5e2", "#ffb3c6", "#ffd166", "#ffe29a"];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 10 + 3;
      this.burstSparkles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        drag: 0.96,
        size: Math.random() * 5 + 2,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.01,
        color: colors[Math.floor(Math.random() * colors.length)],
        isStar: true,
      });
    }

    this.spawnConfettiBurst();
  }

  stopAllEffects() {
    this.isCelebrationActive = false;
    this.isPetalsActive = false;
    this.isTwilightAmbientActive = false;
    this.isTextAuraActive = false;
    this.timeScale = 1.0;
    this.targetTimeScale = 1.0;
    this.sakuraPetals = [];
    this.ambientPinkMotes = [];
    this.travelingPetals = [];
    this.textAuraParticles = [];
    this.burstHearts = [];
    this.burstSparkles = [];
    this.shockwaves = [];
    this.floatingHearts = [];
    this.confettiPieces = [];
  }

  /* ------------------- DRAW HELPERS ------------------- */

  drawHeart(ctx, x, y, size, color, alpha = 1, rotation = 0) {
    ctx.save();
    ctx.translate(x, y);
    if (rotation !== 0) ctx.rotate(rotation);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = color;

    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(0, topCurveHeight);
    ctx.bezierCurveTo(-size / 2, -size / 3, -size, size / 3, 0, size);
    ctx.bezierCurveTo(size, size / 3, size / 2, -size / 3, 0, topCurveHeight);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawStar(ctx, x, y, size, color, alpha = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.lineTo(size, 0);
      ctx.lineTo(size * 0.25, size * 0.25);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Draw Cherry Blossom Petal with realistic curved notch and 3D tumble
   */
  drawSakuraPetal(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    // 3D tumble flip along horizontal axis
    ctx.scale(Math.cos(p.flipAngle), 1);
    ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

    // Gradient shading: pure crystalline white at tip, blushing soft pink at base
    const grad = ctx.createLinearGradient(0, -p.size, 0, p.size);
    grad.addColorStop(0, p.colorTop);
    grad.addColorStop(0.5, p.colorTop);
    grad.addColorStop(1, p.colorBase);
    ctx.fillStyle = grad;

    const s = p.size;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.7);
    // Left petal curve
    ctx.bezierCurveTo(-s * 0.65, s * 0.3, -s * 0.6, -s * 0.5, -s * 0.15, -s * 0.85);
    // Petal heart notch tip
    ctx.lineTo(0, -s * 0.7);
    ctx.lineTo(s * 0.15, -s * 0.85);
    // Right petal curve
    ctx.bezierCurveTo(s * 0.6, -s * 0.5, s * 0.65, s * 0.3, 0, s * 0.7);
    ctx.closePath();

    ctx.shadowColor = "rgba(255, 180, 205, 0.45)";
    ctx.shadowBlur = 4;
    ctx.fill();

    ctx.restore();
  }

  /* ------------------- MAIN RENDER LOOP ------------------- */

  updateAndRender() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Smoothly restore timeScale back towards 1.0 from slow motion
    if (this.timeScale < this.targetTimeScale) {
      this.timeScale += (this.targetTimeScale - this.timeScale) * 0.022;
    }
    const ts = this.timeScale;

    // 1. Stars background
    for (let star of this.stars) {
      star.alpha += star.twinkleSpeed;
      if (star.alpha > 0.95 || star.alpha < 0.2) {
        star.twinkleSpeed = -star.twinkleSpeed;
      }
      this.ctx.fillStyle = `hsla(${star.hue}, 85%, 90%, ${star.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 2. Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.08 * ts;
      sw.alpha *= (1 - 0.07 * ts);
      if (sw.alpha < 0.02) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = sw.color + sw.alpha + ")";
      this.ctx.lineWidth = sw.lineWidth * sw.alpha;
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 3. Arrow Trail Particles
    for (let i = this.arrowTrails.length - 1; i >= 0; i--) {
      const p = this.arrowTrails[i];
      p.alpha -= p.decay;
      p.size *= 0.96;
      if (p.alpha <= 0 || p.size <= 0.5) {
        this.arrowTrails.splice(i, 1);
        continue;
      }
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 4. Cursor Particles
    for (let i = this.cursorParticles.length - 1; i >= 0; i--) {
      const p = this.cursorParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.cursorParticles.splice(i, 1);
        continue;
      }
      if (p.isHeart) {
        this.drawHeart(this.ctx, p.x, p.y, p.size, p.color, p.alpha, p.rotation);
      } else {
        this.drawStar(this.ctx, p.x, p.y, p.size * 0.7, p.color, p.alpha);
      }
    }

    // 5. Burst Hearts from Explosion (with cinematic slow-motion support)
    for (let i = this.burstHearts.length - 1; i >= 0; i--) {
      const h = this.burstHearts[i];
      h.vx *= Math.pow(h.drag, ts);
      h.vy *= Math.pow(h.drag, ts);
      h.vy += h.gravity * ts;
      h.x += h.vx * ts;
      h.y += h.vy * ts;
      h.rotation += h.rotSpeed * ts;
      h.alpha -= h.decay * ts;

      if (h.alpha <= 0 || h.y > this.height + 50) {
        this.burstHearts.splice(i, 1);
        continue;
      }

      this.drawHeart(this.ctx, h.x, h.y, h.size, h.color, h.alpha, h.rotation);
    }

    // 6. Burst Sparkles (with slow-motion support)
    for (let i = this.burstSparkles.length - 1; i >= 0; i--) {
      const s = this.burstSparkles[i];
      s.vx *= Math.pow(s.drag, ts);
      s.vy *= Math.pow(s.drag, ts);
      s.x += s.vx * ts;
      s.y += s.vy * ts;
      s.alpha -= s.decay * ts;

      if (s.alpha <= 0) {
        this.burstSparkles.splice(i, 1);
        continue;
      }

      if (s.isStar) {
        this.drawStar(this.ctx, s.x, s.y, s.size, s.color, s.alpha);
      } else {
        this.ctx.save();
        this.ctx.globalAlpha = s.alpha;
        this.ctx.fillStyle = s.color;
        this.ctx.beginPath();
        this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    }

    // 7. Ambient Drifting Pink Particles & Sparkles Across Screen
    if (this.isTwilightAmbientActive) {
      this.ambientMoteTimer++;
      if (this.ambientMoteTimer % 18 === 0 && this.ambientPinkMotes.length < 45) {
        this.spawnAmbientPinkMote(false);
      }
    }

    for (let i = this.ambientPinkMotes.length - 1; i >= 0; i--) {
      const m = this.ambientPinkMotes[i];
      m.x += m.vx;
      m.y += m.vy;
      m.pulseAngle += m.pulseSpeed;

      if (m.fadeIn) {
        m.alpha += 0.025;
        if (m.alpha >= m.targetAlpha) m.fadeIn = false;
      } else {
        m.alpha -= m.decay;
      }

      if (m.alpha <= 0 || m.x > this.width + 20) {
        this.ambientPinkMotes.splice(i, 1);
        continue;
      }

      const pulseSize = m.size * (1 + Math.sin(m.pulseAngle) * 0.25);
      if (m.isStar) {
        this.drawStar(this.ctx, m.x, m.y, pulseSize * 0.8, m.color, m.alpha);
      } else {
        this.ctx.save();
        this.ctx.globalAlpha = m.alpha;
        this.ctx.fillStyle = m.color;
        this.ctx.beginPath();
        this.ctx.arc(m.x, m.y, pulseSize, 0, Math.PI * 2);
        this.ctx.shadowColor = "#ff80a4";
        this.ctx.shadowBlur = 6;
        this.ctx.fill();
        this.ctx.restore();
      }
    }

    // 8. Falling Cherry Blossom (Sakura) Petals
    if (this.isPetalsActive) {
      this.sakuraSpawnTimer++;
      if (this.sakuraSpawnTimer % 22 === 0 && this.sakuraPetals.length < 42) {
        this.spawnSakuraPetal(false);
      }
    }

    for (let i = this.sakuraPetals.length - 1; i >= 0; i--) {
      const p = this.sakuraPetals[i];
      p.swayAngle += p.swaySpeed;
      const swayX = Math.sin(p.swayAngle) * p.swayAmp;

      p.x += p.vx + swayX;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.flipAngle += p.flipSpeed;

      // Petal fell below bottom or went past right screen -> respawn or remove
      if (p.y > this.height + 30 || p.x > this.width + 50) {
        if (this.isPetalsActive) {
          // Re-recycle petal from top/tree
          this.sakuraPetals.splice(i, 1);
          this.spawnSakuraPetal(false);
        } else {
          this.sakuraPetals.splice(i, 1);
        }
        continue;
      }

      this.drawSakuraPetal(this.ctx, p);
    }

    // 9. Traveling Glowing Petals & Hearts (Tree -> Birthday Text)
    for (let i = this.travelingPetals.length - 1; i >= 0; i--) {
      const tp = this.travelingPetals[i];
      tp.progress += tp.speed;
      tp.rotation += tp.rotSpeed;
      tp.flip += tp.flipSpeed;

      // Quadratic Bezier interpolation
      const t = tp.progress;
      const inv = 1 - t;
      tp.x = inv * inv * tp.startX + 2 * inv * t * tp.ctrlX + t * t * tp.destX;
      tp.y = inv * inv * tp.startY + 2 * inv * t * tp.ctrlY + t * t * tp.destY;

      // Spawn stardust trail along path
      if (Math.random() > 0.4) {
        this.burstSparkles.push({
          x: tp.x + (Math.random() - 0.5) * 8,
          y: tp.y + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          drag: 0.94,
          size: Math.random() * 3 + 1.2,
          alpha: 0.9,
          decay: 0.04,
          color: tp.color,
          isStar: true,
        });
      }

      if (t >= 1) {
        // Arrived at destination: burst into sparkles!
        for (let k = 0; k < 6; k++) {
          this.burstSparkles.push({
            x: tp.destX,
            y: tp.destY,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 1,
            drag: 0.94,
            size: Math.random() * 4 + 2,
            alpha: 1,
            decay: 0.03,
            color: "#ffffff",
            isStar: true,
          });
        }
        this.travelingPetals.splice(i, 1);
        continue;
      }

      if (tp.isHeart) {
        this.drawHeart(this.ctx, tp.x, tp.y, tp.size, tp.color, tp.alpha, tp.rotation);
      } else {
        this.drawSakuraPetal(this.ctx, {
          x: tp.x,
          y: tp.y,
          size: tp.size,
          rotation: tp.rotation,
          flipAngle: tp.flip,
          alpha: tp.alpha,
          colorTop: "#ffffff",
          colorBase: "#ff80a4",
        });
      }
    }

    // 10. Text Aura Particles (Floating around recipient name)
    if (this.isTextAuraActive) {
      this.textAuraTimer++;
      if (this.textAuraTimer % 14 === 0) {
        this.spawnTextAuraParticle();
      }
    }

    for (let i = this.textAuraParticles.length - 1; i >= 0; i--) {
      const ap = this.textAuraParticles[i];
      ap.x += ap.vx;
      ap.y += ap.vy;
      ap.alpha -= ap.decay;
      ap.rotation += ap.rotSpeed;

      if (ap.alpha <= 0) {
        this.textAuraParticles.splice(i, 1);
        continue;
      }

      if (ap.isHeart) {
        this.drawHeart(this.ctx, ap.x, ap.y, ap.size, ap.color, ap.alpha, ap.rotation);
      } else {
        this.drawStar(this.ctx, ap.x, ap.y, ap.size, ap.color, ap.alpha);
      }
    }

    // 11. Rising Celebration Floating Hearts
    if (this.isCelebrationActive) {
      this.floatingHeartTimer++;
      if (this.floatingHeartTimer % 24 === 0 && this.floatingHearts.length < 40) {
        this.spawnRisingHeart();
      }

      this.confettiTimer++;
      if (this.confettiTimer % 320 === 0) {
        this.spawnConfettiBurst();
      }
    }

    for (let i = this.floatingHearts.length - 1; i >= 0; i--) {
      const fh = this.floatingHearts[i];
      fh.y -= fh.speedY;
      const sway = Math.sin(fh.y * fh.swaySpeed + fh.swayOffset) * fh.swayDist * 0.05;
      const posX = fh.x + sway;

      if (fh.y < -40) {
        this.floatingHearts.splice(i, 1);
        continue;
      }

      this.drawHeart(this.ctx, posX, fh.y, fh.size, fh.color, fh.alpha);
    }

    // 12. 3D Confetti
    for (let i = this.confettiPieces.length - 1; i >= 0; i--) {
      const c = this.confettiPieces[i];
      c.vx *= c.drag;
      c.vy *= c.drag;
      c.vy += c.gravity;
      c.x += c.vx;
      c.y += c.vy;
      c.rotation += c.rotSpeed;
      c.flipAngle += c.flipSpeed;

      if (c.y > this.height + 40) {
        this.confettiPieces.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(c.x, c.y);
      this.ctx.rotate((c.rotation * Math.PI) / 180);
      this.ctx.scale(1, Math.cos(c.flipAngle));
      this.ctx.fillStyle = c.color;

      if (c.shape === "rect") {
        this.ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, c.w / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
  }
}
