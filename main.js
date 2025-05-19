// ======================
// GAME STATE VARIABLES
// ======================
let db;
let currentMissionIndex = parseInt(localStorage.getItem('currentMission')) || 0;
let timeLeft = 0;
let missionInterval;

// ======================
// HELPER FUNCTIONS (NO DEPENDENCIES)
// ======================
function updateProgressBar(xp) {
  const progressBar = document.getElementById("xp-progress-bar");
  if (progressBar) {
    const percent = ((xp % 100) / 100) * 100;
    progressBar.style.width = `${percent}%`;
  }
}

function getRandomCelebration() {
  const celebrations = [
    "That's what she said!",
    "Bears. Beets. Battlestar Galactica!",
    "Identity theft is not a joke, Jim!",
    "You're winner!",
    "Assistant to the Regional Manager!",
    "That's a Stanley nickel!"
  ];
  return celebrations[Math.floor(Math.random() * celebrations.length)];
}

// ======================
// REWARDS SYSTEM (DEFINED FIRST)
// ======================
class RewardsSystem {
  constructor() {
    this.xp = parseInt(localStorage.getItem('xp')) || 0;
    this.level = Math.floor(this.xp / 100) + 1;
    this.achievements = JSON.parse(localStorage.getItem('achievements')) || [];
    this.queueUIUpdate();
  }

  queueUIUpdate() {
    if (document.readyState === 'complete') {
      this.updateUI();
    } else {
      document.addEventListener('DOMContentLoaded', () => this.updateUI());
    }
  }

  addXP(amount) {
    this.xp += amount;
    this.level = Math.floor(this.xp / 100) + 1;
    localStorage.setItem('xp', this.xp.toString());
    this.updateUI();
  }

  updateUI() {
    const safeUpdate = () => {
      const xpElement = document.getElementById("xp");
      const levelElement = document.getElementById("level");
      const achievementsElement = document.getElementById("achievements");
      
      if (xpElement) xpElement.textContent = this.xp;
      if (levelElement) levelElement.textContent = this.level;
      if (achievementsElement) {
        achievementsElement.textContent = this.achievements.join(", ") || "None";
      }
      
      updateProgressBar(this.xp);
    };

    // Retry mechanism for DOM elements
    try {
      safeUpdate();
    } catch (e) {
      setTimeout(safeUpdate, 50);
    }
  }

  unlockAchievement(name) {
    if (name && !this.achievements.includes(name)) {
      this.achievements.push(name);
      localStorage.setItem('achievements', JSON.stringify(this.achievements));
      alert(`🏆 Achievement Unlocked: ${name}`);
    }
  }
}

// ======================
// INITIALIZE REWARDS SYSTEM
// ======================
const rewards = new RewardsSystem();

// ======================
// REST OF THE CODE
// ======================
// [Keep all other code from previous versions, ensuring:
// 1. No references to rewards before this line
// 2. All helper functions only use rewards after this point
// 3. All DOM operations wait for DOMContentLoaded]

// Set up everything when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  initDB();
});
