/**
 * ==============================================================================
 *  CAKE & CELEBRATION INTERACTIVE MODULE
 * ==============================================================================
 *  Handles the animated birthday cake, flickering candles, candle blow-out,
 *  "Make a Wish" interaction, and wish card reveal.
 */

class CelebrationManager {
  constructor(particleEngine, soundEngine) {
    this.particles = particleEngine;
    this.sound = soundEngine;
    this.isWishMade = false;
    this.candlesBlown = false;

    this.initElements();
  }

  initElements() {
    this.wishButton = document.getElementById("make-wish-btn");
    this.wishCard = document.getElementById("wish-card");
    this.cakeContainer = document.getElementById("cake-container");
    this.candleFlames = document.querySelectorAll(".flame");
    this.replayBtn = document.getElementById("replay-btn");

    if (this.wishButton) {
      this.wishButton.addEventListener("click", () => this.handleMakeWish());
    }

    if (this.replayBtn) {
      this.replayBtn.addEventListener("click", () => {
        if (window.appMain) {
          window.appMain.resetExperience();
        }
      });
    }
  }

  handleMakeWish() {
    if (this.isWishMade) return;
    this.isWishMade = true;

    // 1. Extinguish candle flames with animation & smoke
    this.extinguishCandles();

    // 2. Play blow sound
    this.sound.playCandleBlow();

    // 3. Mobile vibration if supported
    if ("vibrate" in navigator) {
      navigator.vibrate([80, 50, 150]);
    }

    // 4. Trigger golden fireworks & stardust explosion around cake
    const cakeRect = this.cakeContainer.getBoundingClientRect();
    const cakeCenterX = cakeRect.left + cakeRect.width / 2;
    const cakeCenterY = cakeRect.top + cakeRect.height / 3;

    this.particles.triggerWishExplosion(cakeCenterX, cakeCenterY);

    // 5. Update Wish Button to Granted State
    if (this.wishButton) {
      this.wishButton.disabled = true;
      this.wishButton.classList.add("wish-granted");
      this.wishButton.innerHTML = `<span>✨ Wish Made! ✨</span>`;
    }

    // 6. Reveal the Magical Wish Card with smooth cinematic flip
    setTimeout(() => {
      if (this.wishCard) {
        this.wishCard.classList.remove("hidden");
        this.wishCard.classList.add("reveal-active");
        this.wishCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 400);
  }

  extinguishCandles() {
    this.candlesBlown = true;
    const flames = document.querySelectorAll(".flame");
    flames.forEach((flame, index) => {
      setTimeout(() => {
        flame.classList.add("extinguished");

        // Spawn smoke element
        const smoke = document.createElement("div");
        smoke.className = "candle-smoke";
        flame.parentElement.appendChild(smoke);

        setTimeout(() => smoke.remove(), 1600);
      }, index * 90);
    });
  }

  reset() {
    this.isWishMade = false;
    this.candlesBlown = false;

    // Relight candles
    const flames = document.querySelectorAll(".flame");
    flames.forEach((flame) => {
      flame.classList.remove("extinguished");
    });

    // Reset button
    if (this.wishButton) {
      this.wishButton.disabled = false;
      this.wishButton.classList.remove("wish-granted");
      this.wishButton.innerHTML = `<span>Make a Wish ✨</span>`;
    }

    // Hide wish card
    if (this.wishCard) {
      this.wishCard.classList.add("hidden");
      this.wishCard.classList.remove("reveal-active");
    }
  }
}
