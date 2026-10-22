/**
 * ==============================================================================
 *  SAKURA TREE ENGINE (Cherry Blossom Tree & Growth Animation)
 * ==============================================================================
 *  Generates an elegant, curved Japanese Cherry Blossom Tree on the left screen.
 *  Features multi-stage organic growth animation:
 *   1. Trunk grows upward from ground with curved bark gradient
 *   2. Primary boughs extend outwards toward center
 *   3. Delicate sub-branches and twigs branch out
 *   4. Luminous starlight energy pulse flows through the wood
 *   5. White & pink cherry blossoms bloom progressively with soft glowing centers
 *   6. Petals start detaching into the breeze
 *   7. Ambient wind sway animation
 */

class SakuraTree {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = Object.assign({
      onBloomComplete: null,
      onPetalsStart: null,
    }, options);

    this.svg = null;
    this.isGrown = false;
    this.isGrowing = false;
    this.blossomPoints = [];
    this.growthTimeouts = [];

    this.init();
  }

  init() {
    if (!this.container) return;
    this.buildTreeSVG();
  }

  buildTreeSVG() {
    this.container.innerHTML = "";

    // Dimensions for SVG coordinate system (650 width x 920 height)
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 650 920");
    svg.setAttribute("class", "sakura-tree-svg");
    svg.setAttribute("preserveAspectRatio", "xMinYMax meet");

    // Defs: Gradients, Filters & Reusable Blossom Elements
    const defs = document.createElementNS(svgNS, "defs");
    defs.innerHTML = `
      <!-- Bark Gradient: Deep wood with twilight rose rim lighting -->
      <linearGradient id="barkGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#2a0d1d" />
        <stop offset="45%" stop-color="#4a1832" />
        <stop offset="80%" stop-color="#6e2548" />
        <stop offset="100%" stop-color="#993d65" />
      </linearGradient>

      <!-- Branch Highlight Gradient -->
      <linearGradient id="branchGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
        <stop offset="50%" stop-color="#ffb3cb" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#ff4d79" stop-opacity="0" />
      </linearGradient>

      <!-- White & Pink Petal Gradient (White tips with blush pink base) -->
      <radialGradient id="petalGradWhitePink" cx="50%" cy="85%" r="80%">
        <stop offset="0%" stop-color="#ff4071" />
        <stop offset="35%" stop-color="#ff8da9" />
        <stop offset="75%" stop-color="#ffd5e2" />
        <stop offset="100%" stop-color="#ffffff" />
      </radialGradient>

      <!-- Soft Blossom Petal Gradient (Lighter variant) -->
      <radialGradient id="petalGradSoft" cx="50%" cy="85%" r="75%">
        <stop offset="0%" stop-color="#ff6b93" />
        <stop offset="45%" stop-color="#ffb8cc" />
        <stop offset="85%" stop-color="#fff0f5" />
        <stop offset="100%" stop-color="#ffffff" />
      </radialGradient>

      <!-- Deep Blossom Gradient for background depth -->
      <radialGradient id="petalGradDeep" cx="50%" cy="85%" r="75%">
        <stop offset="0%" stop-color="#c92257" />
        <stop offset="50%" stop-color="#eb4d79" />
        <stop offset="90%" stop-color="#ffaec5" />
        <stop offset="100%" stop-color="#ffeef3" />
      </radialGradient>

      <!-- Blossom Glow Filter -->
      <filter id="flowerGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <!-- Tree Magic Starlight Glow Filter -->
      <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="blur1" />
        <feGaussianBlur stdDeviation="14" result="blur2" />
        <feMerge>
          <feMergeNode in="blur2" />
          <feMergeNode in="blur1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <!-- Individual Single Petal Template -->
      <path id="singlePetal" d="M0,0 C-7,-10 -9,-22 0,-30 C9,-22 7,-10 0,0 Z" />
    `;
    svg.appendChild(defs);

    // Group for tree body (allows ambient gentle sway)
    const treeGroup = document.createElementNS(svgNS, "g");
    treeGroup.setAttribute("class", "tree-sway-group");

    // 1. Layer: Background Blossom Clusters (Deep depth layer)
    const bgBlossomGroup = document.createElementNS(svgNS, "g");
    bgBlossomGroup.setAttribute("class", "blossom-layer blossom-layer-bg");

    // 2. Layer: Wood (Trunk, Primary Boughs, Twigs)
    const woodGroup = document.createElementNS(svgNS, "g");
    woodGroup.setAttribute("class", "tree-wood-group");

    // 3. Layer: Magical Starlight Pulse along wood
    const pulseGroup = document.createElementNS(svgNS, "g");
    pulseGroup.setAttribute("class", "tree-pulse-group");

    // 4. Layer: Foreground Lush Blossom Clusters
    const fgBlossomGroup = document.createElementNS(svgNS, "g");
    fgBlossomGroup.setAttribute("class", "blossom-layer blossom-layer-fg");

    treeGroup.appendChild(bgBlossomGroup);
    treeGroup.appendChild(woodGroup);
    treeGroup.appendChild(pulseGroup);
    treeGroup.appendChild(fgBlossomGroup);
    svg.appendChild(treeGroup);

    this.svg = svg;
    this.woodGroup = woodGroup;
    this.pulseGroup = pulseGroup;
    this.bgBlossomGroup = bgBlossomGroup;
    this.fgBlossomGroup = fgBlossomGroup;

    // Build the anatomical structure of the tree
    this.createBranches();
    this.createBlossomClouds();

    this.container.appendChild(svg);
  }

  createBranches() {
    // Branch definitions: id, path data, strokeWidth, parentStage (1=trunk, 2=bough, 3=twig)
    const branches = [
      // --- STAGE 1: TRUNK & ROOT BASE ---
      {
        id: "trunk-main",
        d: "M 110 920 C 125 820, 155 720, 185 640 C 210 575, 230 520, 245 470",
        width: 38,
        stage: 1,
        color: "url(#barkGrad)"
      },
      {
        id: "trunk-root-left",
        d: "M 115 920 C 85 890, 45 905, 10 920",
        width: 18,
        stage: 1,
        color: "#2a0d1d"
      },
      {
        id: "trunk-root-right",
        d: "M 135 920 C 160 900, 200 908, 230 920",
        width: 14,
        stage: 1,
        color: "#2a0d1d"
      },

      // --- STAGE 2: MAJOR BOUGHS ---
      // Bough A: Sweeping right towards center (Main focal arch)
      {
        id: "bough-right-main",
        d: "M 245 470 C 290 420, 370 380, 460 345 C 510 325, 560 310, 610 295",
        width: 22,
        stage: 2,
        color: "url(#barkGrad)"
      },
      // Bough B: Central high canopy
      {
        id: "bough-center-high",
        d: "M 235 500 C 245 410, 265 320, 290 240 C 305 190, 320 145, 335 110",
        width: 18,
        stage: 2,
        color: "url(#barkGrad)"
      },
      // Bough C: Left wing canopy
      {
        id: "bough-left-wing",
        d: "M 195 610 C 160 540, 120 470, 80 400 C 55 350, 35 295, 20 240",
        width: 16,
        stage: 2,
        color: "url(#barkGrad)"
      },
      // Bough D: Lower sweeping bough extending toward right
      {
        id: "bough-right-low",
        d: "M 270 455 C 330 460, 410 475, 490 470 C 535 465, 575 455, 620 445",
        width: 14,
        stage: 2,
        color: "url(#barkGrad)"
      },

      // --- STAGE 3: SUB-BRANCHES & TWIGS ---
      // Right branch twigs
      { id: "twig-r1", d: "M 380 375 C 410 320, 445 280, 485 245", width: 8, stage: 3 },
      { id: "twig-r2", d: "M 460 345 C 495 310, 530 260, 560 215", width: 7, stage: 3 },
      { id: "twig-r3", d: "M 520 320 C 555 340, 595 345, 635 340", width: 6, stage: 3 },
      { id: "twig-r4", d: "M 440 472 C 475 440, 515 425, 560 415", width: 6, stage: 3 },
      { id: "twig-r5", d: "M 350 460 C 375 510, 410 535, 450 550", width: 6, stage: 3 },

      // Center high twigs
      { id: "twig-c1", d: "M 260 350 C 220 310, 185 270, 160 220", width: 8, stage: 3 },
      { id: "twig-c2", d: "M 285 250 C 330 220, 375 195, 420 175", width: 7, stage: 3 },
      { id: "twig-c3", d: "M 315 160 C 290 120, 275 80, 260 45", width: 6, stage: 3 },
      { id: "twig-c4", d: "M 325 130 C 365 105, 405 85, 450 70", width: 5, stage: 3 },

      // Left wing twigs
      { id: "twig-l1", d: "M 140 500 C 110 515, 75 525, 35 520", width: 7, stage: 3 },
      { id: "twig-l2", d: "M 85 410 C 65 370, 45 320, 30 270", width: 6, stage: 3 },
      { id: "twig-l3", d: "M 100 435 C 130 395, 165 370, 195 345", width: 6, stage: 3 },
      { id: "twig-l4", d: "M 50 310 C 25 280, 10 240, 0 195", width: 5, stage: 3 },
    ];

    const svgNS = "http://www.w3.org/2000/svg";

    branches.forEach((branch) => {
      // 1. Branch wood path
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", branch.d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", branch.color || "url(#barkGrad)");
      path.setAttribute("stroke-width", branch.width);
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("class", `tree-branch stage-${branch.stage}`);
      path.dataset.stage = branch.stage;

      this.woodGroup.appendChild(path);

      // Measure path length for drawing animation
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length} ${length}`;
      path.style.strokeDashoffset = `${length}`;

      // 2. Branch magic pulse line (lighter, glowing)
      if (branch.stage <= 2 || branch.width >= 7) {
        const pulse = document.createElementNS(svgNS, "path");
        pulse.setAttribute("d", branch.d);
        pulse.setAttribute("fill", "none");
        pulse.setAttribute("stroke", "url(#branchGlowGrad)");
        pulse.setAttribute("stroke-width", Math.max(3, branch.width * 0.45));
        pulse.setAttribute("stroke-linecap", "round");
        pulse.setAttribute("filter", "url(#pulseGlow)");
        pulse.setAttribute("class", "tree-magic-pulse");
        pulse.style.strokeDasharray = `${length * 0.25} ${length * 0.75}`;
        pulse.style.strokeDashoffset = `${length}`;
        pulse.style.opacity = "0";

        this.pulseGroup.appendChild(pulse);
        path._pulseEl = pulse;
        path._pathLength = length;
      }
    });
  }

  createBlossomClouds() {
    // Generate over 160 blossom clusters clustered organically around branches
    const clusterCenters = [
      // Center High Canopy
      { x: 330, y: 100, count: 8, spread: 55, layer: "fg" },
      { x: 260, y: 55,  count: 7, spread: 45, layer: "fg" },
      { x: 440, y: 75,  count: 8, spread: 50, layer: "fg" },
      { x: 300, y: 160, count: 9, spread: 60, layer: "fg" },
      { x: 400, y: 170, count: 9, spread: 65, layer: "fg" },
      { x: 200, y: 180, count: 7, spread: 55, layer: "bg" },
      { x: 350, y: 210, count: 10, spread: 60, layer: "fg" },
      { x: 260, y: 260, count: 8, spread: 50, layer: "bg" },

      // Right Sweeping Arch (Reaches toward center/right screen)
      { x: 480, y: 240, count: 9, spread: 55, layer: "fg" },
      { x: 550, y: 210, count: 9, spread: 55, layer: "fg" },
      { x: 610, y: 280, count: 10, spread: 65, layer: "fg" },
      { x: 520, y: 310, count: 11, spread: 60, layer: "fg" },
      { x: 580, y: 335, count: 9, spread: 55, layer: "fg" },
      { x: 630, y: 345, count: 7, spread: 45, layer: "fg" },
      { x: 450, y: 350, count: 10, spread: 60, layer: "bg" },
      { x: 390, y: 380, count: 9, spread: 55, layer: "bg" },

      // Right Lower Canopy
      { x: 500, y: 415, count: 8, spread: 50, layer: "fg" },
      { x: 570, y: 410, count: 9, spread: 55, layer: "fg" },
      { x: 610, y: 445, count: 7, spread: 50, layer: "fg" },
      { x: 510, y: 470, count: 8, spread: 50, layer: "bg" },
      { x: 430, y: 480, count: 8, spread: 55, layer: "bg" },
      { x: 450, y: 550, count: 6, spread: 45, layer: "fg" },

      // Left Wing Canopy
      { x: 160, y: 230, count: 7, spread: 50, layer: "fg" },
      { x: 90,  y: 260, count: 8, spread: 55, layer: "fg" },
      { x: 30,  y: 220, count: 7, spread: 45, layer: "fg" },
      { x: 50,  y: 310, count: 8, spread: 50, layer: "bg" },
      { x: 80,  y: 390, count: 9, spread: 55, layer: "fg" },
      { x: 120, y: 380, count: 8, spread: 50, layer: "bg" },
      { x: 140, y: 460, count: 7, spread: 50, layer: "bg" },
      { x: 50,  y: 510, count: 6, spread: 45, layer: "fg" },
      { x: 230, y: 480, count: 7, spread: 45, layer: "bg" },
    ];

    const svgNS = "http://www.w3.org/2000/svg";
    this.blossomPoints = [];

    clusterCenters.forEach((cluster, cIdx) => {
      const targetGroup = cluster.layer === "bg" ? this.bgBlossomGroup : this.fgBlossomGroup;

      for (let i = 0; i < cluster.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * cluster.spread;
        const x = cluster.x + Math.cos(angle) * dist;
        const y = cluster.y + Math.sin(angle) * dist;
        const scale = 0.55 + Math.random() * 0.65; // size variation
        const rotation = Math.random() * 360;

        // Save blossom coordinate for natural falling petal spawn origins
        this.blossomPoints.push({ x, y, layer: cluster.layer });

        // Create Blossom Flower SVG Group
        const flowerGroup = document.createElementNS(svgNS, "g");
        flowerGroup.setAttribute("class", "sakura-blossom");
        flowerGroup.setAttribute("transform", `translate(${x}, ${y}) scale(0) rotate(${rotation})`);
        flowerGroup.dataset.baseX = x;
        flowerGroup.dataset.baseY = y;
        flowerGroup.dataset.targetScale = scale.toFixed(2);
        flowerGroup.dataset.rotation = rotation.toFixed(1);

        // Blossom geometry: 5 soft pink/white petals around golden glowing center
        flowerGroup.innerHTML = this.generateBlossomMarkup(scale, cluster.layer);

        targetGroup.appendChild(flowerGroup);
      }
    });
  }

  generateBlossomMarkup(scale, layer) {
    const gradId = layer === "bg" 
      ? "petalGradDeep" 
      : (Math.random() > 0.4 ? "petalGradWhitePink" : "petalGradSoft");

    // 5 classic cherry blossom petals with curved heart notch tips
    let petalsSvg = "";
    for (let p = 0; p < 5; p++) {
      const angle = p * 72;
      petalsSvg += `
        <g transform="rotate(${angle})">
          <path d="M 0,0 C -6,-10 -9,-20 0,-26 C 9,-20 6,-10 0,0 Z" 
                fill="url(#${gradId})" 
                filter="url(#flowerGlow)" 
                opacity="0.94" />
          <!-- Inner soft highlight -->
          <path d="M 0,-4 C -3,-11 -4,-18 0,-23 C 4,-18 3,-11 0,-4 Z" 
                fill="#ffffff" 
                opacity="0.65" />
        </g>
      `;
    }

    // Glowing flower center: Golden stamens & pistil
    const centerSvg = `
      <circle cx="0" cy="0" r="4.2" fill="#ff2a6d" opacity="0.9" />
      <circle cx="0" cy="0" r="2.4" fill="#ffd166" />
      <!-- Radiating stamen dots -->
      <g stroke="#ff2a6d" stroke-width="0.75" opacity="0.8">
        <line x1="0" y1="0" x2="0" y2="-6" />
        <line x1="0" y1="0" x2="5.7" y2="-1.8" />
        <line x1="0" y1="0" x2="3.5" y2="4.8" />
        <line x1="0" y1="0" x2="-3.5" y2="4.8" />
        <line x1="0" y1="0" x2="-5.7" y2="-1.8" />
      </g>
      <circle cx="0" cy="-6" r="1.1" fill="#ffd166" />
      <circle cx="5.7" cy="-1.8" r="1.1" fill="#ffd166" />
      <circle cx="3.5" cy="4.8" r="1.1" fill="#ffd166" />
      <circle cx="-3.5" cy="4.8" r="1.1" fill="#ffd166" />
      <circle cx="-5.7" cy="-1.8" r="1.1" fill="#ffd166" />
    `;

    return petalsSvg + centerSvg;
  }

  /**
   * ORGANIC GROWTH ANIMATION
   * Triggers the multi-phase cinematic tree reveal (2.5s - 3.8s)
   */
  grow() {
    if (this.isGrowing || this.isGrown) return;
    this.isGrowing = true;

    // Reset any existing states
    this.clearGrowthTimeouts();
    this.container.classList.add("tree-visible");

    // 1. PHASE 1: TRUNK GROWS UPWARD FROM GROUND (0.0s - 1.2s)
    const stage1Branches = this.woodGroup.querySelectorAll(".stage-1");
    stage1Branches.forEach((path) => {
      path.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.25, 1, 0.5, 1)";
      path.style.strokeDashoffset = "0";
    });

    // 2. PHASE 2: PRIMARY BOUGHS EXTEND OUTWARDS (0.6s - 2.0s)
    this.growthTimeouts.push(setTimeout(() => {
      const stage2Branches = this.woodGroup.querySelectorAll(".stage-2");
      stage2Branches.forEach((path) => {
        path.style.transition = "stroke-dashoffset 1.3s cubic-bezier(0.25, 1, 0.5, 1)";
        path.style.strokeDashoffset = "0";
      });
    }, 600));

    // 3. PHASE 3: SUB-BRANCHES & TWIGS EXTEND (1.3s - 2.5s)
    this.growthTimeouts.push(setTimeout(() => {
      const stage3Branches = this.woodGroup.querySelectorAll(".stage-3");
      stage3Branches.forEach((path) => {
        path.style.transition = "stroke-dashoffset 1.1s cubic-bezier(0.25, 1, 0.5, 1)";
        path.style.strokeDashoffset = "0";
      });
    }, 1300));

    // 4. PHASE 4: LUMINOUS ENERGY PULSES THROUGH BRANCHES (1.6s - 2.8s)
    this.growthTimeouts.push(setTimeout(() => {
      const pulses = this.pulseGroup.querySelectorAll(".tree-magic-pulse");
      pulses.forEach((pulse, idx) => {
        pulse.style.opacity = "0.95";
        pulse.style.transition = `stroke-dashoffset 1.2s ease-out ${idx * 60}ms, opacity 1.5s ease-out ${idx * 60 + 500}ms`;
        pulse.style.strokeDashoffset = "0";

        // Fade pulse into soft ambient luminescence
        setTimeout(() => {
          pulse.style.opacity = "0.25";
        }, 1200 + idx * 60);
      });
    }, 1600));

    // 5. PHASE 5: CHERRY BLOSSOMS GRADUALLY BLOOM ACROSS BRANCHES (2.0s - 3.6s)
    this.growthTimeouts.push(setTimeout(() => {
      const blossoms = this.container.querySelectorAll(".sakura-blossom");
      blossoms.forEach((flower, index) => {
        const targetScale = flower.dataset.targetScale;
        const rot = flower.dataset.rotation;
        const x = flower.dataset.baseX;
        const y = flower.dataset.baseY;

        // Stagger blooming from trunk outward based on distance / Y position
        const delay = Math.max(0, (y / 850) * 0.4 + (index % 12) * 0.08 + Math.random() * 0.3);

        flower.style.transition = `transform 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`;
        flower.style.transform = `translate(${x}px, ${y}px) scale(${targetScale}) rotate(${rot}deg)`;
      });
    }, 2000));

    // 6. PHASE 6: PETALS BEGIN FALLING FROM TREE (3.2s)
    this.growthTimeouts.push(setTimeout(() => {
      if (this.options.onPetalsStart) {
        this.options.onPetalsStart();
      }
    }, 3200));

    // 7. PHASE 7: BLOOM COMPLETE -> TRIGGER BIRTHDAY MESSAGE (3.6s)
    this.growthTimeouts.push(setTimeout(() => {
      this.isGrown = true;
      this.isGrowing = false;
      this.container.classList.add("tree-fully-bloomed");

      if (this.options.onBloomComplete) {
        this.options.onBloomComplete();
      }
    }, 3600));
  }

  /**
   * Reset tree to unbloomed state (for Replay)
   */
  reset() {
    this.clearGrowthTimeouts();
    this.isGrown = false;
    this.isGrowing = false;

    this.container.classList.remove("tree-visible", "tree-fully-bloomed");

    // Reset branches
    const allBranches = this.woodGroup.querySelectorAll(".tree-branch");
    allBranches.forEach((path) => {
      const len = path.getTotalLength ? path.getTotalLength() : 800;
      path.style.transition = "none";
      path.style.strokeDashoffset = `${len}`;
    });

    // Reset pulses
    const pulses = this.pulseGroup.querySelectorAll(".tree-magic-pulse");
    pulses.forEach((pulse) => {
      pulse.style.transition = "none";
      pulse.style.opacity = "0";
      pulse.style.strokeDashoffset = "900";
    });

    // Reset blossoms to scale(0)
    const blossoms = this.container.querySelectorAll(".sakura-blossom");
    blossoms.forEach((flower) => {
      const x = flower.dataset.baseX;
      const y = flower.dataset.baseY;
      const rot = flower.dataset.rotation;
      flower.style.transition = "none";
      flower.style.transform = `translate(${x}px, ${y}px) scale(0) rotate(${rot}deg)`;
    });
  }

  clearGrowthTimeouts() {
    this.growthTimeouts.forEach((id) => clearTimeout(id));
    this.growthTimeouts = [];
  }

  /**
   * Returns screen coordinates of blossom clusters for spawning falling petals
   */
  getBlossomScreenCoordinates() {
    if (!this.svg) return [];
    const rect = this.svg.getBoundingClientRect();
    const scaleX = rect.width / 650;
    const scaleY = rect.height / 920;

    return this.blossomPoints.map((pt) => ({
      x: rect.left + pt.x * scaleX,
      y: rect.top + pt.y * scaleY,
    }));
  }
}

// Expose globally
window.SakuraTree = SakuraTree;
