/**
 * ==============================================================================
 *  🎂 BIRTHDAY SURPRISE WEBSITE - QUICK PERSONALIZATION SETTINGS 🎂
 * ==============================================================================
 *  Easily change these values to customize the birthday surprise!
 *  You do NOT need to touch any code below this block.
 */

// 1. Birthday Person's Name
const BIRTHDAY_NAME = "Sophia";

// 2. Birthday Date (e.g. "Today", "October 24", "November 12")
const BIRTHDAY_DATE = "Today";

// 3. Opening Instruction
const INSTRUCTION_TEXT = "Shoot the heart to reveal your surprise ❤️";

// 4. Large Reveal Title (Cinematic reveal)
const TITLE_TEXT = "HAPPY BIRTHDAY";

// 5. Recipient Name Header ({name} will be replaced automatically)
const NAME_GREETING = "❤️ {name} ❤️";

// 6. Lead Personal Message
const LEAD_MESSAGE = "Today is your special day...";

// 7. Secondary Birthday Message
const BIRTHDAY_MESSAGE =
  "May your day be filled with happiness, laughter, love and beautiful memories.";

// 7. Final Wish Title & Message (Shown when candles are blown out)
const WISH_TITLE = "Your Wish is on its Way to the Stars! 🌟";
const WISH_MESSAGE =
  "May every candle on your cake bring a thousand dreams to life, and may this coming year be your most magical chapter yet.";

// 8. Optional Photo (Provide a file path like "assets/photo.jpg" or image URL, or leave "" for none)
const OPTIONAL_PHOTO_URL = "";

// 9. Custom Music URL (Optional: path/URL to an MP3. If left empty "", the built-in romantic celesta synthesizer plays!)
const CUSTOM_MUSIC_URL = "";

// 10. Color & Theme Palette (White & Pink Theme)
const THEME_COLORS = {
  primaryColor: "#ff4071",       // Vibrant romantic rose pink
  secondaryColor: "#ffd5e2",     // Soft white/blush pink
  accentWhite: "#ffffff",        // Crystalline white
  goldAccent: "#ffd166",         // Golden sparkles
  heartGlow: "rgba(255, 64, 113, 0.8)",
  arrowColor: "#ffffff",
  arrowGlow: "rgba(255, 141, 169, 0.85)",
};

/**
 * ==============================================================================
 *  SYSTEM CONFIG OBJECT (Loaded automatically by the application)
 * ==============================================================================
 */
window.BIRTHDAY_CONFIG = {
  recipientName: BIRTHDAY_NAME,
  birthdayDate: BIRTHDAY_DATE,
  instructionText: INSTRUCTION_TEXT,
  titleText: TITLE_TEXT,
  nameGreeting: NAME_GREETING,
  leadMessage: LEAD_MESSAGE,
  secondaryMessage: BIRTHDAY_MESSAGE,
  wishTitle: WISH_TITLE,
  wishMessage: WISH_MESSAGE,
  photoUrl: OPTIONAL_PHOTO_URL,
  audio: {
    customMusicUrl: CUSTOM_MUSIC_URL,
    musicVolume: 0.35,
    sfxVolume: 0.65,
    enableMusic: true,
    enableSfx: true,
  },
  theme: THEME_COLORS,
  archery: {
    arrowSpeed: 23,
    gravity: 0.12,
    dragSensitivity: 1.2,
    hitRadius: 78,
  }
};
