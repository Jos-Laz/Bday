/**
 * ==============================================================================
 *  INTERACTIVE ARCHERY ENGINE
 * ==============================================================================
 *  Handles bow rendering, string bending, touch/mouse drag controls,
 *  aiming trajectory visualization, arrow physics, collision detection,
 *  and hit/miss reactions.
 */

class ArcheryGame {
  constructor(canvas, particleEngine, soundEngine, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = particleEngine;
    this.sound = soundEngine;
    this.callbacks = callbacks || {};

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Bow position & dimensions
    this.bow = {
      x: this.width / 2,
      y: this.height * 0.85,
      radius: 65,
      limbWidth: 6,
      stringRestX: 0,
      stringRestY: 0,
    };

    // Heart target center
    this.heartTarget = {
      x: this.width / 2,
      y: this.height * 0.38,
      radius: window.BIRTHDAY_CONFIG?.archery?.hitRadius || 75,
      element: null,
    };

    // Arrow in bow state
    this.arrowState = "IDLE"; // "IDLE" | "AIMING" | "FLYING" | "HIT" | "MISSED"
    this.dragStart = { x: 0, y: 0 };
    this.dragCurrent = { x: 0, y: 0 };
    this.pullDistance = 0;
    this.maxPull = 120;
    this.aimAngle = -Math.PI / 2; // Default pointing straight up

    // Flying Arrow Physics
    this.flyingArrow = {
      x: 0,
      y: 0,
      prevTipX: 0,
      prevTipY: 0,
      vx: 0,
      vy: 0,
      length: 80,
      angle: 0,
      rotSpeed: 0,
      alpha: 1,
    };

    this.missCount = 0;
    this.isActive = true;
    this.isDragging = false;
    this.lastSoundTime = 0;

    this.init();
    this.bindControls();
  }

  init() {
    this.resize();
    this.updateTargetPosition();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(this.dpr, this.dpr);

    // Responsive bow position
    this.bow.x = this.width / 2;
    this.bow.y = Math.min(this.height * 0.86, this.height - 90);
    this.bow.radius = Math.max(50, Math.min(this.width * 0.12, 70));

    this.updateTargetPosition();
  }

  updateTargetPosition() {
    const heartEl = document.getElementById("target-heart");
    if (heartEl) {
      const rect = heartEl.getBoundingClientRect();
      this.heartTarget.x = rect.left + rect.width / 2;
      this.heartTarget.y = rect.top + rect.height / 2;
      this.heartTarget.radius = Math.max(rect.width, rect.height) * 0.45;
    } else {
      this.heartTarget.x = this.width / 2;
      this.heartTarget.y = this.height * 0.38;
    }
  }

  setHeartElement(el) {
    this.heartTarget.element = el;
    this.updateTargetPosition();
  }

  bindControls() {
    window.addEventListener("resize", () => this.resize());

    const getPos = (e) => {
      if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    };

    const onStart = (e) => {
      if (!this.isActive || this.arrowState === "FLYING" || this.arrowState === "HIT") return;

      const pos = getPos(e);

      // 1. Check if user tapped directly on the heart (Delightful quick-shot!)
      const distToHeart = Math.hypot(pos.x - this.heartTarget.x, pos.y - this.heartTarget.y);
      if (distToHeart <= this.heartTarget.radius * 1.3) {
        if (e.cancelable) e.preventDefault();
        this.aimAngle = Math.atan2(this.heartTarget.y - (this.bow.y - 20), this.heartTarget.x - this.bow.x);
        this.pullDistance = this.maxPull * 0.9;
        this.sound.init();
        this.sound.resumeContext();
        if (this.callbacks.onAimStart) this.callbacks.onAimStart();
        this.launchArrow();
        return;
      }

      // 2. Check if click/touch is within the interactive bow zone or lower half of screen
      const distToBow = Math.hypot(pos.x - this.bow.x, pos.y - this.bow.y);

      // Allow aiming if clicking near bow or lower 52% of the screen
      if (distToBow < 220 || pos.y > this.height * 0.48) {
        if (e.cancelable) e.preventDefault();
        this.isDragging = true;
        this.dragStart = { x: pos.x, y: pos.y };
        this.dragCurrent = { x: pos.x, y: pos.y };
        this.arrowState = "AIMING";

        // Start ambient sound context on user touch
        this.sound.init();
        this.sound.resumeContext();

        if (this.callbacks.onAimStart) {
          this.callbacks.onAimStart();
        }
      }
    };

    const onMove = (e) => {
      if (!this.isDragging || this.arrowState !== "AIMING") return;
      if (e.cancelable) e.preventDefault();

      const pos = getPos(e);
      this.dragCurrent = { x: pos.x, y: pos.y };

      // Calculate pull vector (Slingshot mechanic: pull backward/downwards to aim forward)
      // Vector from touch position to bow center
      let dx = this.bow.x - pos.x;
      let dy = this.bow.y - pos.y;
      let dist = Math.hypot(dx, dy);

      // Slingshot pull-back: pull down to shoot up
      if (pos.y < this.bow.y - 30) {
        // Dragging upward: aim direction is direct towards touch point
        this.aimAngle = Math.atan2(pos.y - this.bow.y, pos.x - this.bow.x);
        this.pullDistance = Math.min(Math.hypot(pos.x - this.bow.x, pos.y - this.bow.y), this.maxPull);
      } else {
        // Slingshot pull-back: pulling down & away launches in the opposite direction
        this.aimAngle = Math.atan2(this.bow.y - pos.y, this.bow.x - pos.x);
        this.pullDistance = Math.min(dist, this.maxPull);
      }

      // Tension sound feedback
      const now = performance.now();
      if (now - this.lastSoundTime > 260) {
        this.sound.playBowPull(this.pullDistance / this.maxPull);
        this.lastSoundTime = now;
      }
    };

    const onEnd = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;

      if (this.arrowState === "AIMING") {
        if (this.pullDistance > 25) {
          this.launchArrow();
        } else {
          // Cancelled pull (too short)
          this.arrowState = "IDLE";
          this.pullDistance = 0;
        }
      }
    };

    // Canvas & document listeners
    this.canvas.addEventListener("mousedown", onStart);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);

    this.canvas.addEventListener("touchstart", onStart, { passive: false });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
  }

  launchArrow() {
    this.arrowState = "FLYING";
    const baseSpeed = window.BIRTHDAY_CONFIG?.archery?.arrowSpeed || 23;
    const powerRatio = Math.max(0.65, this.pullDistance / this.maxPull);
    const speed = baseSpeed * (powerRatio * 0.7 + 0.65);

    // Initial position at bow tip
    this.flyingArrow.x = this.bow.x;
    this.flyingArrow.y = this.bow.y - 20;
    this.flyingArrow.vx = Math.cos(this.aimAngle) * speed;
    this.flyingArrow.vy = Math.sin(this.aimAngle) * speed;
    this.flyingArrow.angle = this.aimAngle;
    this.flyingArrow.rotSpeed = 0;
    this.flyingArrow.alpha = 1;

    // Track tip positions for continuous swept collision
    const initTipX = this.flyingArrow.x + Math.cos(this.aimAngle) * this.flyingArrow.length;
    const initTipY = this.flyingArrow.y + Math.sin(this.aimAngle) * this.flyingArrow.length;
    this.flyingArrow.prevTipX = initTipX;
    this.flyingArrow.prevTipY = initTipY;

    this.sound.playArrowRelease();

    if (this.callbacks.onArrowLaunch) {
      this.callbacks.onArrowLaunch();
    }
  }

  handleMiss() {
    this.arrowState = "MISSED";
    this.missCount++;
    this.sound.playArrowMiss();

    if (this.callbacks.onArrowMiss) {
      this.callbacks.onArrowMiss(this.missCount);
    }

    // Reset bow after brief pause
    setTimeout(() => {
      if (this.arrowState === "MISSED") {
        this.resetBow();
      }
    }, 1200);
  }

  resetBow() {
    this.arrowState = "IDLE";
    this.pullDistance = 0;
    this.aimAngle = -Math.PI / 2;
    if (this.callbacks.onBowReset) {
      this.callbacks.onBowReset();
    }
  }

  distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  /* ------------------- DRAWING HELPERS ------------------- */

  drawBow(ctx) {
    ctx.save();
    ctx.translate(this.bow.x, this.bow.y);

    const bowR = this.bow.radius;
    const bowAngle = this.arrowState === "AIMING" ? this.aimAngle + Math.PI / 2 : 0;
    ctx.rotate(bowAngle);

    // Calculate bowstring pull displacement
    const pullAmount = this.arrowState === "AIMING" ? (this.pullDistance / this.maxPull) * 45 : 0;
    const stringNockY = pullAmount;

    // 1. Bowstring (two segments drawn to the arrow nock)
    ctx.beginPath();
    ctx.moveTo(-bowR * 0.9, 0);
    ctx.lineTo(0, stringNockY);
    ctx.lineTo(bowR * 0.9, 0);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#ffd166";
    ctx.shadowBlur = 8;
    ctx.stroke();

    // 2. Glowing Bow Limbs (Romantic Curved Arch)
    ctx.beginPath();
    // Left limb
    ctx.moveTo(-bowR * 0.9, 0);
    ctx.bezierCurveTo(
      -bowR * 0.65, -bowR * 0.45,
      -bowR * 0.25, -bowR * 0.55,
      0, -bowR * 0.5
    );
    // Right limb
    ctx.bezierCurveTo(
      bowR * 0.25, -bowR * 0.55,
      bowR * 0.65, -bowR * 0.45,
      bowR * 0.9, 0
    );

    // Luxurious white and pink bow styling with pearlescent glow
    const grad = ctx.createLinearGradient(-bowR, 0, bowR, 0);
    grad.addColorStop(0, "#ff8da9");
    grad.addColorStop(0.25, "#ffffff");
    grad.addColorStop(0.5, "#ffd5e2");
    grad.addColorStop(0.75, "#ffffff");
    grad.addColorStop(1, "#ff8da9");

    ctx.strokeStyle = grad;
    ctx.lineWidth = this.bow.limbWidth;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(255, 141, 169, 0.85)";
    ctx.shadowBlur = 14;
    ctx.stroke();

    // Center bow grip
    ctx.beginPath();
    ctx.arc(0, -bowR * 0.5, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd166";
    ctx.fill();

    // 3. Arrow loaded in bow (if idle or aiming)
    if (this.arrowState === "IDLE" || this.arrowState === "AIMING") {
      this.drawArrow(ctx, 0, stringNockY, -Math.PI / 2, 75);
    }

    ctx.restore();
  }

  drawArrow(ctx, x, y, angle, length, alpha = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;

    // Arrow shaft
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, 0);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 3.5;
    ctx.shadowColor = "rgba(255, 209, 102, 0.8)";
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Arrowhead (Cupid's glowing heart tip pointing forward)
    ctx.save();
    ctx.translate(length, 0);
    ctx.rotate(-Math.PI / 2);
    this.particles.drawHeart(ctx, 0, -4, 13, "#ff4071", alpha);
    ctx.restore();

    // Arrow fletching / feathers at nock
    ctx.strokeStyle = "#ffd5e2";
    ctx.lineWidth = 2.5;
    [-6, 0, 6].forEach((offset) => {
      ctx.beginPath();
      ctx.moveTo(8 + offset, -7);
      ctx.lineTo(16 + offset, 0);
      ctx.lineTo(8 + offset, 7);
      ctx.stroke();
    });

    ctx.restore();
  }

  drawTrajectory(ctx) {
    if (this.arrowState !== "AIMING" || this.pullDistance < 20) return;

    ctx.save();
    const dotsCount = 22;
    const power = (this.pullDistance / this.maxPull) * 20 + 8;
    const gravity = window.BIRTHDAY_CONFIG?.archery?.gravity || 0.12;

    let simX = this.bow.x;
    let simY = this.bow.y - 20;
    let simVx = Math.cos(this.aimAngle) * power;
    let simVy = Math.sin(this.aimAngle) * power;

    // Check if aiming close to heart for "Target Locked" visual feedback
    this.updateTargetPosition();
    let isAimedAtHeart = false;

    for (let i = 0; i < dotsCount; i++) {
      simX += simVx;
      simY += simVy;
      simVy += gravity;

      const distToHeart = Math.hypot(simX - this.heartTarget.x, simY - this.heartTarget.y);
      if (distToHeart < this.heartTarget.radius * 1.1) {
        isAimedAtHeart = true;
      }

      const progress = i / dotsCount;
      const dotAlpha = (1 - progress) * 0.9;
      const dotSize = Math.max(1.8, 5 * (1 - progress * 0.7));

      ctx.beginPath();
      ctx.arc(simX, simY, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = isAimedAtHeart
        ? `rgba(255, 42, 109, ${dotAlpha})`
        : `rgba(255, 209, 102, ${dotAlpha})`;
      ctx.shadowColor = isAimedAtHeart ? "#ff2a6d" : "#ffd166";
      ctx.shadowBlur = 8;
      ctx.fill();
    }

    // Aim assist reticle over target if lined up
    if (isAimedAtHeart) {
      ctx.beginPath();
      ctx.arc(this.heartTarget.x, this.heartTarget.y, this.heartTarget.radius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 42, 109, 0.65)";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  /* ------------------- GAME UPDATE LOOP ------------------- */

  update() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Update target coordinate
    this.updateTargetPosition();

    // Draw Aiming Guide
    this.drawTrajectory(this.ctx);

    // Draw Bow (and nocked arrow if not flying)
    this.drawBow(this.ctx);

    // Update & Draw Flying Arrow
    if (this.arrowState === "FLYING") {
      const gravity = window.BIRTHDAY_CONFIG?.archery?.gravity || 0.12;
      this.flyingArrow.x += this.flyingArrow.vx;
      this.flyingArrow.y += this.flyingArrow.vy;
      this.flyingArrow.vy += gravity;

      // Update arrow orientation with flight velocity
      this.flyingArrow.angle = Math.atan2(this.flyingArrow.vy, this.flyingArrow.vx);

      // Spawn stardust particles behind the arrow tip
      this.particles.addArrowTrailParticle(this.flyingArrow.x, this.flyingArrow.y);

      // Arrow tip position
      const tipX = this.flyingArrow.x + Math.cos(this.flyingArrow.angle) * this.flyingArrow.length;
      const tipY = this.flyingArrow.y + Math.sin(this.flyingArrow.angle) * this.flyingArrow.length;

      // Swept collision check: distance from heart center to trajectory line segment
      const hitDist = this.distToSegment(
        this.heartTarget.x,
        this.heartTarget.y,
        this.flyingArrow.prevTipX,
        this.flyingArrow.prevTipY,
        tipX,
        tipY
      );

      this.flyingArrow.prevTipX = tipX;
      this.flyingArrow.prevTipY = tipY;

      if (hitDist <= this.heartTarget.radius) {
        // --- HIT! ---
        this.arrowState = "HIT";
        this.isActive = false;

        if (this.callbacks.onHeartHit) {
          this.callbacks.onHeartHit(this.heartTarget.x, this.heartTarget.y);
        }
        return;
      }

      // Check for Miss (out of bounds)
      if (
        this.flyingArrow.x < -100 ||
        this.flyingArrow.x > this.width + 100 ||
        this.flyingArrow.y > this.height + 60 ||
        (this.flyingArrow.y < -150 && this.flyingArrow.vy < 0)
      ) {
        this.handleMiss();
      }

      // Draw the flying arrow
      this.drawArrow(
        this.ctx,
        this.flyingArrow.x,
        this.flyingArrow.y,
        this.flyingArrow.angle,
        this.flyingArrow.length,
        1.0
      );
    } else if (this.arrowState === "MISSED") {
      // Animate arrow falling away
      this.flyingArrow.y += 8;
      this.flyingArrow.angle += 0.1;
      this.flyingArrow.alpha = Math.max(0, this.flyingArrow.alpha - 0.035);

      if (this.flyingArrow.alpha > 0.01) {
        this.drawArrow(
          this.ctx,
          this.flyingArrow.x,
          this.flyingArrow.y,
          this.flyingArrow.angle,
          this.flyingArrow.length,
          this.flyingArrow.alpha
        );
      }
    }
  }
}
