/**
 * ==============================================================================
 *  AUDIO ENGINE (Web Audio API Synthesizer + Custom Track Support)
 * ==============================================================================
 *  Zero external dependencies required. Synthesizes romantic ambient music
 *  and realistic sound effects directly in the browser, with support for
 *  an optional external audio file.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isMusicPlaying = false;
    this.musicTimer = null;
    this.customAudio = null;
    this.isInitialized = false;

    this.musicGain = null;
    this.sfxGain = null;
    this.masterGain = null;

    // Chord progression for romantic generative celesta (frequencies in Hz)
    // Cmaj9 -> Am9 -> Fmaj7 -> Gsus4
    this.chords = [
      [261.63, 329.63, 392.00, 493.88, 587.33], // C E G B D
      [220.00, 261.63, 329.63, 392.00, 493.88], // A C E G B
      [174.61, 220.00, 261.63, 329.63, 392.00], // F A C E G
      [196.00, 261.63, 293.66, 392.00, 440.00]  // G C D G A
    ];
    this.currentChordIndex = 0;
    this.noteStep = 0;
  }

  init() {
    if (this.isInitialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Music sub-gain
      this.musicGain = this.ctx.createGain();
      const musicVol = window.BIRTHDAY_CONFIG?.audio?.musicVolume ?? 0.35;
      this.musicGain.gain.setValueAtTime(musicVol, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // SFX sub-gain
      this.sfxGain = this.ctx.createGain();
      const sfxVol = window.BIRTHDAY_CONFIG?.audio?.sfxVolume ?? 0.65;
      this.sfxGain.gain.setValueAtTime(sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Check for custom audio URL
      const customUrl = window.BIRTHDAY_CONFIG?.audio?.customMusicUrl;
      if (customUrl && customUrl.trim() !== "") {
        this.customAudio = new Audio(customUrl);
        this.customAudio.loop = true;
        this.customAudio.volume = musicVol;
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio not supported or blocked:", e);
    }
  }

  resumeContext() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  startMusic() {
    this.init();
    this.resumeContext();
    if (this.isMusicPlaying) return;

    this.isMusicPlaying = true;

    if (this.customAudio) {
      this.customAudio.play().catch(() => {
        // Fallback to synth if custom audio fails or is blocked
        this.startSynthMusic();
      });
    } else {
      this.startSynthMusic();
    }
  }

  pauseMusic() {
    this.isMusicPlaying = false;
    if (this.customAudio) {
      this.customAudio.pause();
    }
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  toggleMusic() {
    if (this.isMusicPlaying) {
      this.pauseMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  toggleMute() {
    this.init();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
    }
    if (this.customAudio) {
      this.customAudio.muted = this.isMuted;
    }
    return this.isMuted;
  }

  /**
   * Generative Romantic Celesta Arpeggios
   * Uses gentle harmonic bell/sine synthesis with soft reverb decay
   */
  startSynthMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);

    const playNextNote = () => {
      if (!this.isMusicPlaying || !this.ctx || this.isMuted) return;

      const chord = this.chords[this.currentChordIndex];
      // Pick note from chord or gentle octave jump
      const noteFreq = chord[this.noteStep % chord.length];
      const octave = Math.random() > 0.6 ? 2 : 1;
      this.playCelestaNote(noteFreq * octave, 0.22);

      this.noteStep++;
      if (this.noteStep >= 8) {
        this.noteStep = 0;
        this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
      }
    };

    // Play a gentle note every ~450ms for a dreamy lullaby rhythm
    this.musicTimer = setInterval(playNextNote, 460);
    playNextNote();
  }

  playCelestaNote(freq, volume = 0.2) {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Sine + faint overtone for crystal/celesta timbre
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 1.85);
    } catch (e) {}
  }

  /* ------------------- SFX SYNTHESIZERS ------------------- */

  // Bow draw tension
  playBowPull(tension = 0.5) {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(140 + tension * 120, now);
      osc.frequency.linearRampToValueAtTime(260 + tension * 200, now + 0.2);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  // Arrow whoosh release
  playArrowRelease() {
    this.init();
    this.resumeContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;

      // Filtered noise buffer for clean arrow swoosh
      const bufferSize = this.ctx.sampleRate * 0.28;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(2200, now + 0.08);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.28);
      filter.Q.value = 3.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.3);
    } catch (e) {}
  }

  // Heart shatter & impact sound (Cinematic Boom + Glass chime)
  playHeartHit() {
    this.init();
    this.resumeContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;

      // 1. Sub Bass Impact
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(160, now);
      subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.6);

      subGain.gain.setValueAtTime(0.6, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(now);
      subOsc.stop(now + 0.75);

      // 2. Crystal Chime Cluster (Sparkling heart explosion)
      const chimeFreqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      chimeFreqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);

        gain.gain.setValueAtTime(0.001, now + idx * 0.03);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.03 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 + idx * 0.1);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + idx * 0.03);
        osc.stop(now + 1.5);
      });
    } catch (e) {}
  }

  // Miss / Whiff sound
  playArrowMiss() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch (e) {}
  }

  // Celebration Harp Glissando (Reveal)
  playRevealFanfare() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Arpeggiate warm major chords
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.07);

        gain.gain.setValueAtTime(0.001, now + i * 0.07);
        gain.gain.linearRampToValueAtTime(0.25, now + i * 0.07 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 1.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 1.3);
      });
    } catch (e) {}
  }

  // Candle blow out (breath puff + magic chime)
  playCandleBlow() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;

      // Soft breath noise
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.linearRampToValueAtTime(150, now + 0.38);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.42);

      // Sparkle chime after extinguish
      setTimeout(() => {
        if (!this.isMuted && this.ctx) {
          this.playCelestaNote(1318.51, 0.25);
          setTimeout(() => this.playCelestaNote(1760.00, 0.2), 120);
        }
      }, 250);
    } catch (e) {}
  }

  // Confetti pop
  playConfettiPop() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }
}

window.soundEngine = new SoundEngine();
