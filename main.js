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
// GAME DATA
// ======================
const missions = [
  { 
    question: "How many sales did Dwight make?", 
    answer: "134", 
    xp: 50, 
    achievement: "Sales Counting Rookie", 
    timeLimit: 60 
  },
  { 
    question: "What's the total sales amount made by Jim?", 
    answer: "42675", 
    xp: 100, 
    achievement: "Sales Totals Master", 
    timeLimit: 50 
  },
  { 
    question: "How many clients bought more than one product?", 
    answer: "27", 
    xp: 150, 
    achievement: "Client Analyst", 
    timeLimit: 40 
  },
  { 
    question: "What's the most sold product by total sales?", 
    answer: "Paper", 
    xp: 200, 
    achievement: "Product Expert", 
    timeLimit: 30 
  },
  { 
    question: "Who has the highest average sale amount?", 
    answer: "Dwight Schrute", 
    xp: 250, 
    achievement: "Sales Champion", 
    timeLimit: 25 
  }
];

// ======================
// DATABASE FUNCTIONS
// ======================
async function initDB() {
  try {
    const SQL = await initSqlJs({
      locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.7.0/dist/${file}`
    });
    db = new SQL.Database();

    // Create sales table
    db.run("CREATE TABLE sales (employee TEXT, product TEXT, amount INTEGER, client TEXT)");
    db.run("INSERT INTO sales VALUES ('Dwight', 'Paper', 500, 'AAA Paper')");
    db.run("INSERT INTO sales VALUES ('Jim', 'Printer', 300, 'Dunder Corp')");
    db.run("INSERT INTO sales VALUES ('Dwight', 'Stapler', 45, 'Staples Inc')");
    db.run("INSERT INTO sales VALUES ('Pam', 'Notebooks', 120, 'Office Dreams')");
    db.run("INSERT INTO sales VALUES ('Dwight', 'Paper', 750, 'Paper World')");

    // Create quotes table from JSON
    db.run("CREATE TABLE quotes (character TEXT, quote TEXT, season INTEGER)");
    try {
      const response = await fetch('data/michael_quotes.json');
      if (response.ok) {
        const { quotes } = await response.json();
        const stmt = db.prepare("INSERT INTO quotes VALUES (?, ?, ?)");
        quotes.forEach(({ character, quote, season }) => {
          stmt.bind([character, quote, season]);
          stmt.step();
          stmt.reset();
        });
        stmt.free();
      }
    } catch (error) {
      console.error("Error loading quotes:", error);
      db.run("INSERT INTO quotes VALUES ('Michael', 'That''s what she said!', 2)");
      db.run("INSERT INTO quotes VALUES ('Dwight', 'Bears. Beets. Battlestar Galactica.', 3)");
    }

    // Initialize UI
    updateTable('sales', 50);
    updateTable('quotes', 50);
    enableGameButtons();

  } catch (error) {
    console.error("Database initialization failed:", error);
    alert("Failed to initialize database. Please refresh the page.");
  }
}

function updateTable(tableName, limit = 50) {
  try {
    const result = db.exec(`SELECT * FROM ${tableName} LIMIT ${limit}`);
    const tableElement = document.getElementById(`${tableName}-table`);
    if (tableElement && result?.[0]) {
      tableElement.innerHTML = generateTableHTML(result);
    }
  } catch (error) {
    console.error('Error updating table:', error);
  }
}

function generateTableHTML(result) {
  if (!result || !result.length) return "";
  return `
    <thead><tr>${
      result[0].columns.map(col => `<th>${col}</th>`).join("")
    }</tr></thead>
    <tbody>${
      result[0].values.map(row => `
        <tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>
      `).join("")
    }</tbody>
  `;
}

function enableGameButtons() {
  const previewBtn = document.getElementById("preview-data-btn");
  const startBtn = document.getElementById("start-game-btn");
  
  if (previewBtn) {
    previewBtn.disabled = false;
    previewBtn.textContent = "👀 Show Sample Data";
  }
  if (startBtn) {
    startBtn.disabled = false;
    startBtn.textContent = "🚀 Start Your Sales Career";
  }
}

// ======================
// GAME FLOW FUNCTIONS
// ======================
function showDataPreview() {
  const previewDiv = document.getElementById('preview-tables');
  if (!previewDiv) return;

  previewDiv.classList.remove('hidden');
  try {
    const salesPreview = db.exec("SELECT employee, COUNT(*) as sales FROM sales GROUP BY employee");
    const quotesPreview = db.exec("SELECT character, COUNT(*) as quotes FROM quotes GROUP BY character");
    
    previewDiv.innerHTML = `
      <h3>📊 Employee Sales Count</h3>
      ${generateTableHTML(salesPreview)}
      <h3>📜 Character Quote Count</h3>
      ${generateTableHTML(quotesPreview)}
    `;
  } catch (error) {
    previewDiv.innerHTML = "<p>⚠️ Error loading preview data</p>";
  }
}

function loadMission(index) {
  if (index >= missions.length) {
    const missionQuestion = document.getElementById("mission-question");
    const submitAnswer = document.getElementById("submit-answer");
    if (missionQuestion) missionQuestion.textContent = "🎉 You've completed all missions!";
    if (submitAnswer) submitAnswer.disabled = true;
    return;
  }

  currentMissionIndex = index;
  localStorage.setItem('currentMission', index.toString());
  
  const elements = {
    level: document.getElementById("current-level"),
    question: document.getElementById("mission-question"),
    answer: document.getElementById("final-answer"),
    query: document.getElementById("query-input"),
    submit: document.getElementById("submit-answer"),
    feedback: document.getElementById("feedback"),
    timer: document.getElementById("timer")
  };

  if (elements.level) elements.level.textContent = index + 1;
  if (elements.question) elements.question.textContent = missions[index].question;
  if (elements.answer) elements.answer.value = "";
  if (elements.query) elements.query.value = "";
  if (elements.submit) elements.submit.disabled = false;
  if (elements.feedback) elements.feedback.innerHTML = "";
  if (elements.timer) elements.timer.classList.add("hidden");
  
  clearInterval(missionInterval);
}

function startGame() {
  const introScreen = document.getElementById("intro-screen");
  const gameUI = document.getElementById("game-ui");
  
  if (introScreen) introScreen.style.display = "none";
  if (gameUI) gameUI.style.display = "block";
  
  loadMission(currentMissionIndex);
}

// ======================
// EVENT HANDLERS
// ======================
function setupEventListeners() {
  // Preview Data
  document.getElementById("preview-data-btn")?.addEventListener("click", showDataPreview);
  
  // Start Game
  document.getElementById("start-game-btn")?.addEventListener("click", startGame);
  
  // Missions
  document.getElementById("start-mission-btn")?.addEventListener("click", () => {
    clearInterval(missionInterval);
    const mission = missions[currentMissionIndex];
    timeLeft = mission.timeLimit;
    
    const timeLeftElement = document.getElementById("time-left");
    const timerElement = document.getElementById("timer");
    const startMissionBtn = document.getElementById("start-mission-btn");
    const submitAnswer = document.getElementById("submit-answer");
    
    if (timeLeftElement) timeLeftElement.textContent = timeLeft;
    if (timerElement) timerElement.classList.remove("hidden");
    if (startMissionBtn) startMissionBtn.disabled = true;
    if (submitAnswer) submitAnswer.disabled = false;
    
    missionInterval = setInterval(() => {
      timeLeft--;
      if (timeLeftElement) timeLeftElement.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(missionInterval);
        if (submitAnswer) submitAnswer.disabled = true;
        if (startMissionBtn) startMissionBtn.disabled = false;
      }
    }, 1000);
  });

  // Answer Submission
  document.getElementById("submit-answer")?.addEventListener("click", () => {
    const finalAnswer = document.getElementById("final-answer");
    const feedback = document.getElementById("feedback");
    
    if (!finalAnswer || !feedback) return;
    
    const userAnswer = finalAnswer.value.trim().toLowerCase();
    const correctAnswer = missions[currentMissionIndex].answer.toLowerCase();

    if (userAnswer === correctAnswer) {
      feedback.className = "feedback-correct";
      feedback.innerHTML = `
        ✅ Correct! XP +${missions[currentMissionIndex].xp}<br>
        🎉 ${getRandomCelebration()}
      `;
      rewards.addXP(missions[currentMissionIndex].xp);
      
      setTimeout(() => {
        currentMissionIndex++;
        localStorage.setItem('currentMission', currentMissionIndex.toString());
        loadMission(currentMissionIndex);
        document.getElementById("start-mission-btn")?.disabled = false;
      }, 1500);
    } else {
      feedback.className = "feedback-error";
      feedback.textContent = "❌ Incorrect. Try again!";
    }
  });

  // SQL Input
  document.getElementById("query-input")?.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const userQuery = this.value.trim();
      const output = document.getElementById("feedback");
      if (!output) return;
      
      try {
        const result = db.exec(userQuery);
        output.className = "";
        output.innerHTML = result?.length 
          ? "<table>" + generateTableHTML(result) + "</table>"
          : "No results found.";
      } catch (error) {
        output.className = "";
        output.innerHTML = `<table><thead><tr><th>Error</th></tr></thead>
                          <tbody><tr><td>${error.message}</td></tr></tbody></table>`;
      }
    }
  });
}

// ======================
// INITIALIZATION
// ======================
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  initDB();
});
