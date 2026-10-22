/**
 * ==============================================================================
 *  MAIN APPLICATION CONTROLLER (White & Pink Romantic Reveal)
 * ==============================================================================
 *  Orchestrates the entire cinematic sequence:
 *    Arrow hits ❤️ -> Heart bursts 💥 -> Cinematic slow-motion & Hearts fly everywhere
 *    -> Camera zooms out -> Twilight romantic garden appears -> Sakura tree grows 🌸
 *    -> White & pink flowers bloom -> Petals begin falling -> Glow & stardust
 *    -> "HAPPY BIRTHDAY" appears with shine sweep -> "❤️ [NAME] ❤️" appears with aura
 *    -> "Today is your special day..." -> Traveling petals connect tree to text
 *    -> Celebration cake & Make a Wish -> Replay.
 */

class BirthdayApp {
  constructor() {
    this.config = window.BIRTHDAY_CONFIG;
    this.state = "LANDING"; // "LANDING" | "AIMING" | "FLYING" | "HIT" | "REVEALED"

    // Canvases
    this.particleCanvas = document.getElementById("particle-canvas");
    this.archeryCanvas = document.getElementById("archery-canvas");

    // Modules
    this.sound = window.soundEngine;
    this.particles = new ParticleEngine(this.particleCanvas);
    this.sakuraTree = null;
    this.archery = null;
    this.celebration = null;

    this.dom = {};
    this.animationFrameId = null;

    this.init();
  }

  init() {
    this.cacheDom();
    this.initSakuraTree();
    this.applyConfig();
    this.initArchery();
    this.celebration = new CelebrationManager(this.particles, this.sound);
    this.setupAudioControls();
    this.setupCustomizer();
    this.bindGlobalEvents();

    // Start 60fps render loop
    this.startLoop();
  }

  cacheDom() {
    this.dom = {
      appContainer: document.getElementById("app-container"),
      screenFlash: document.getElementById("screen-flash"),
      twilightGarden: document.getElementById("twilight-garden"),
      sakuraContainer: document.getElementById("sakura-tree-container"),
      heartTarget: document.getElementById("target-heart"),
      heartContainer: document.getElementById("heart-container"),
      instructionBanner: document.getElementById("instruction-banner"),
      instructionText: document.getElementById("instruction-text"),
      tryAgainTooltip: document.getElementById("try-again-tooltip"),
      // Reveal Stage Elements
      revealStage: document.getElementById("reveal-stage"),
      textRevealGlow: document.getElementById("text-reveal-glow"),
      titleHeading: document.getElementById("title-heading"),
      titleShine: document.getElementById("title-shine"),
      recipientNameContainer: document.getElementById("recipient-name-container"),
      nameGreeting: document.getElementById("name-greeting"),
      leadSpecialMsg: document.getElementById("lead-special-msg"),
      secondaryMessage: document.getElementById("secondary-message"),
      celebrationStage: document.getElementById("celebration-stage"),
      photoContainer: document.getElementById("photo-container"),
      photoElement: document.getElementById("photo-element"),
      // Audio controls
      musicBtn: document.getElementById("music-toggle-btn"),
      muteBtn: document.getElementById("mute-toggle-btn"),
      musicBars: document.querySelectorAll(".music-bar"),
      // Customizer modal
      customizerModal: document.getElementById("customizer-modal"),
      customizerBtn: document.getElementById("customizer-btn"),
      customizerClose: document.getElementById("customizer-close"),
      customizerForm: document.getElementById("customizer-form"),
      nameInput: document.getElementById("cfg-name"),
      messageInput: document.getElementById("cfg-message"),
      wishInput: document.getElementById("cfg-wish"),
    };
  }

  initSakuraTree() {
    if (window.SakuraTree) {
      this.sakuraTree = new window.SakuraTree("sakura-tree-container", {
        onPetalsStart: () => {
          this.particles.startSakuraPetals(() => this.sakuraTree.getBlossomScreenCoordinates());
        },
        onBloomComplete: () => {
          this.triggerBirthdayReveal();
        },
      });
    }
  }

  applyConfig() {
    const cfg = this.config;

    // Apply texts
    if (this.dom.instructionText) {
      this.dom.instructionText.textContent = cfg.instructionText;
    }

    if (this.dom.titleHeading) {
      // Split into letters for letter-by-letter neon reveal animation
      this.dom.titleHeading.innerHTML = "";
      const letters = (cfg.titleText || "HAPPY BIRTHDAY").split("");
      letters.forEach((char, index) => {
        const span = document.createElement("span");
        span.textContent = char === " " ? "\u00A0" : char;
        span.className = "letter-span";
        span.style.animationDelay = `${index * 0.055 + 0.15}s`;
        this.dom.titleHeading.appendChild(span);
      });
    }

    if (this.dom.nameGreeting) {
      const recipient = cfg.recipientName || "Sophia";
      this.dom.nameGreeting.textContent = `❤️ ${recipient} ❤️`;
    }

    if (this.dom.leadSpecialMsg) {
      this.dom.leadSpecialMsg.textContent = cfg.leadMessage || "Today is your special day...";
    }

    if (this.dom.secondaryMessage) {
      this.dom.secondaryMessage.textContent = cfg.secondaryMessage;
    }

    const wishTitleEl = document.getElementById("wish-title");
    const wishMsgEl = document.getElementById("wish-text");
    if (wishTitleEl) wishTitleEl.textContent = cfg.wishTitle;
    if (wishMsgEl) wishMsgEl.textContent = cfg.wishMessage;

    // Optional Photo Handling
    if (this.dom.photoContainer && this.dom.photoElement) {
      if (cfg.photoUrl && cfg.photoUrl.trim() !== "") {
        this.dom.photoElement.src = cfg.photoUrl;
        this.dom.photoContainer.classList.remove("hidden");
      } else {
        this.dom.photoContainer.classList.add("hidden");
      }
    }
  }

  initArchery() {
    this.archery = new ArcheryGame(
      this.archeryCanvas,
      this.particles,
      this.sound,
      {
        onAimStart: () => {
          if (this.dom.instructionBanner) {
            this.dom.instructionBanner.classList.add("faded");
          }
          if (this.dom.tryAgainTooltip) {
            this.dom.tryAgainTooltip.classList.remove("visible");
          }
        },
        onArrowLaunch: () => {
          this.state = "FLYING";
          if (this.config.audio.enableMusic && !this.sound.isMusicPlaying) {
            this.sound.startMusic();
            this.updateMusicUI(true);
          }
        },
        onArrowMiss: (count) => {
          this.state = "LANDING";
          if (this.dom.tryAgainTooltip) {
            this.dom.tryAgainTooltip.textContent = count > 1 ? "So close! Try one more time ❤️" : "Missed! Give it another shot ❤️";
            this.dom.tryAgainTooltip.classList.add("visible");
          }
          if (this.dom.instructionBanner) {
            this.dom.instructionBanner.classList.remove("faded");
          }
        },
        onBowReset: () => {
          // Ready for next attempt
        },
        onHeartHit: (hitX, hitY) => {
          this.handleHeartHit(hitX, hitY);
        },
      }
    );

    this.archery.setHeartElement(this.dom.heartTarget);
  }

  /**
   * 1. HEART BURST & CINEMATIC TRANSITION SEQUENCE
   * Keep existing archery & hit animation, followed by slow-motion,
   * camera zoom-out, white & pink twilight garden reveal, and sakura tree growth.
   */
  handleHeartHit(hitX, hitY) {
    this.state = "HIT";

    // 1. Mobile haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 60, 200]);
    }

    // 2. Play crystalline impact & bass explosion sound
    this.sound.playHeartHit();

    // 3. Camera Hit Shake
    this.dom.appContainer.classList.add("camera-hit-shake");
    this.dom.heartContainer.classList.add("heart-shake");

    // 4. Screen Flash in White & Pink
    if (this.dom.screenFlash) {
      this.dom.screenFlash.classList.add("flash-active");
      setTimeout(() => {
        this.dom.screenFlash.classList.remove("flash-active");
      }, 500);
    }

    // 5. Heart Shatter & Disappear
    setTimeout(() => {
      this.dom.heartContainer.classList.add("heart-exploded");
    }, 120);

    // 6. Giant Heart-Burst Particle Explosion (Triggers Slow-Motion timeScale & drifting pink sparkles)
    this.particles.triggerHeartExplosion(hitX, hitY);

    // 7. Hide instructions & archery canvas
    if (this.dom.instructionBanner) {
      this.dom.instructionBanner.classList.add("hidden");
    }
    if (this.dom.tryAgainTooltip) {
      this.dom.tryAgainTooltip.classList.remove("visible");
    }
    this.archeryCanvas.style.opacity = "0";
    this.archeryCanvas.style.pointerEvents = "none";

    // 8. Start ambient celebratory music & glissando fanfare
    setTimeout(() => {
      this.sound.playRevealFanfare();
      if (this.config.audio.enableMusic) {
        this.sound.startMusic();
        this.updateMusicUI(true);
      }
    }, 350);

    // 9. Camera Subtle Zoom-Out Effect (Creates cinematic world depth)
    setTimeout(() => {
      this.dom.appContainer.classList.add("camera-cinematic-zoom");
    }, 300);

    // 10. Gradually Transition Background into Dreamy White & Pink Twilight Garden
    setTimeout(() => {
      if (this.dom.twilightGarden) {
        this.dom.twilightGarden.classList.add("twilight-active");
      }
    }, 450);

    // 11. Cherry Blossom Tree Grows Upward from Ground (Trunk -> Branches -> Flowers -> Petals)
    setTimeout(() => {
      if (this.sakuraTree) {
        this.sakuraTree.grow();
      } else {
        // Fallback if tree module wasn't loaded
        this.triggerBirthdayReveal();
      }
    }, 900);
  }

  /**
   * 5. BIRTHDAY TEXT REVEAL & MAGICAL CONNECTION
   * Sequence: Glow -> Tiny particles -> Letters appear -> Complete text
   * -> Soft shine passes across -> Recipient name with aura -> Traveling petals
   */
  triggerBirthdayReveal() {
    this.state = "REVEALED";

    // 1. Reveal Stage Container becomes active
    if (this.dom.revealStage) {
      this.dom.revealStage.classList.remove("hidden");
      this.dom.revealStage.classList.add("stage-active");
    }

    // 2. Glow and stardust flash appears before text
    if (this.dom.textRevealGlow) {
      this.dom.textRevealGlow.classList.add("glow-active");
    }

    // 3. Letters of "HAPPY BIRTHDAY" animate in letter-by-letter
    if (this.dom.titleHeading) {
      this.dom.titleHeading.classList.add("title-revealed");
    }

    // 4. Soft luminous shine sweep passes across "HAPPY BIRTHDAY"
    setTimeout(() => {
      if (this.dom.titleShine) {
        this.dom.titleShine.classList.add("shine-active");
      }
    }, 1100);

    // 5. Recipient Name reveals: "❤️ Sophia ❤️" with pink/white glow & sparkles
    setTimeout(() => {
      if (this.dom.recipientNameContainer) {
        this.dom.recipientNameContainer.classList.add("name-active");
      }
      if (this.dom.nameGreeting) {
        this.particles.startTextAura(this.dom.nameGreeting);
      }
    }, 1400);

    // 6. Magical Connection: Glowing petals travel from tree to text card
    setTimeout(() => {
      let sourceX = window.innerWidth * 0.22;
      let sourceY = window.innerHeight * 0.35;

      if (this.sakuraTree) {
        const coords = this.sakuraTree.getBlossomScreenCoordinates();
        if (coords && coords.length > 0) {
          const pt = coords[Math.floor(coords.length * 0.5)];
          sourceX = pt.x;
          sourceY = pt.y;
        }
      }

      const textRect = this.dom.revealStage.getBoundingClientRect();
      const targetX = textRect.left + textRect.width * 0.5;
      const targetY = textRect.top + 90;

      this.particles.triggerTravelingPetalsToText(sourceX, sourceY, targetX, targetY);
    }, 1700);

    // 7. Lead message ("Today is your special day...") & Greeting card glow
    setTimeout(() => {
      const card = this.dom.revealStage.querySelector(".glass-greeting-card");
      if (card) card.classList.add("card-revealed");
      if (this.dom.leadSpecialMsg) this.dom.leadSpecialMsg.classList.add("lead-revealed");
    }, 2000);

    // 8. Start celebratory floating hearts & confetti
    setTimeout(() => {
      this.particles.startCelebration();
    }, 2400);

    // 9. Show Celebration Stage (Cake, Candles, Make a Wish, Wish card)
    setTimeout(() => {
      if (this.dom.celebrationStage) {
        this.dom.celebrationStage.classList.remove("hidden");
        this.dom.celebrationStage.classList.add("stage-active");
      }
    }, 2800);
  }

  /**
   * REPLAY EXPERIENCE ("Shoot Again")
   * Smoothly resets archery, tree, twilight garden, and text stages
   */
  resetExperience() {
    this.state = "LANDING";

    // Reset Heart & Camera
    this.dom.heartContainer.classList.remove("heart-shake", "heart-exploded");
    this.dom.appContainer.classList.remove("camera-hit-shake", "camera-cinematic-zoom");

    // Reset Twilight Garden Background
    if (this.dom.twilightGarden) {
      this.dom.twilightGarden.classList.remove("twilight-active");
    }

    // Reset Sakura Tree
    if (this.sakuraTree) {
      this.sakuraTree.reset();
    }

    // Reset Archery
    this.archeryCanvas.style.opacity = "1";
    this.archeryCanvas.style.pointerEvents = "auto";
    this.archery.isActive = true;
    this.archery.resetBow();

    // Reset Stages & Text Reveal
    if (this.dom.instructionBanner) {
      this.dom.instructionBanner.classList.remove("hidden", "faded");
    }
    if (this.dom.tryAgainTooltip) {
      this.dom.tryAgainTooltip.classList.remove("visible");
    }
    if (this.dom.revealStage) {
      this.dom.revealStage.classList.remove("stage-active");
      this.dom.revealStage.classList.add("hidden");
    }
    if (this.dom.textRevealGlow) {
      this.dom.textRevealGlow.classList.remove("glow-active");
    }
    if (this.dom.titleShine) {
      this.dom.titleShine.classList.remove("shine-active");
    }
    if (this.dom.recipientNameContainer) {
      this.dom.recipientNameContainer.classList.remove("name-active");
    }
    if (this.dom.celebrationStage) {
      this.dom.celebrationStage.classList.remove("stage-active");
      this.dom.celebrationStage.classList.add("hidden");
    }

    const card = this.dom.revealStage ? this.dom.revealStage.querySelector(".glass-greeting-card") : null;
    if (card) card.classList.remove("card-revealed");
    if (this.dom.leadSpecialMsg) this.dom.leadSpecialMsg.classList.remove("lead-revealed");

    // Reset Cake & Wish
    if (this.celebration) {
      this.celebration.reset();
    }

    // Clear all particle effects
    this.particles.stopAllEffects();

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  setupAudioControls() {
    if (this.dom.musicBtn) {
      this.dom.musicBtn.addEventListener("click", () => {
        const isPlaying = this.sound.toggleMusic();
        this.updateMusicUI(isPlaying);
      });
    }

    if (this.dom.muteBtn) {
      this.dom.muteBtn.addEventListener("click", () => {
        const isMuted = this.sound.toggleMute();
        this.dom.muteBtn.classList.toggle("is-muted", isMuted);
      });
    }
  }

  updateMusicUI(isPlaying) {
    if (this.dom.musicBtn) {
      this.dom.musicBtn.classList.toggle("is-playing", isPlaying);
    }
    this.dom.musicBars.forEach((bar) => {
      bar.style.animationPlayState = isPlaying ? "running" : "paused";
    });
  }

  setupCustomizer() {
    if (!this.dom.customizerBtn || !this.dom.customizerModal) return;

    this.dom.customizerBtn.addEventListener("click", () => {
      this.dom.nameInput.value = this.config.recipientName;
      this.dom.messageInput.value = this.config.secondaryMessage;
      this.dom.wishInput.value = this.config.wishMessage;
      this.dom.customizerModal.classList.remove("hidden");
    });

    if (this.dom.customizerClose) {
      this.dom.customizerClose.addEventListener("click", () => {
        this.dom.customizerModal.classList.add("hidden");
      });
    }

    if (this.dom.customizerForm) {
      this.dom.customizerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.config.recipientName = this.dom.nameInput.value.trim() || "Sophia";
        this.config.secondaryMessage = this.dom.messageInput.value.trim() || this.config.secondaryMessage;
        this.config.wishMessage = this.dom.wishInput.value.trim() || this.config.wishMessage;
        this.applyConfig();
        this.dom.customizerModal.classList.add("hidden");
      });
    }
  }

  bindGlobalEvents() {
    const onFirstUserAction = () => {
      this.sound.init();
      this.sound.resumeContext();
      window.removeEventListener("pointerdown", onFirstUserAction);
    };
    window.addEventListener("pointerdown", onFirstUserAction, { once: true });

    // Window resize updates for text aura
    window.addEventListener("resize", () => {
      if (this.particles && this.particles.isTextAuraActive) {
        this.particles.updateTextAuraRect();
      }
    });
  }

  startLoop() {
    const loop = () => {
      this.particles.updateAndRender();
      if (this.archery && this.archery.isActive) {
        this.archery.update();
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }
}

// Instantiate once DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  window.appMain = new BirthdayApp();
});
