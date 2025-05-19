let db;
let currentMissionIndex = parseInt(localStorage.getItem('currentMission')) || 0;
let timeLeft = 0;
let missionInterval;

// ======================
// HELPER FUNCTIONS
// ======================

function updateProgressBar(xp) {
  const percent = ((xp % 100) / 100) * 100;
  const progressBar = document.getElementById("xp-progress-bar");
  if (progressBar) {
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
// REWARDS SYSTEM
// ======================

class RewardsSystem {
  constructor() {
    this.xp = parseInt(localStorage.getItem('xp')) || 0;
    this.level = Math.floor(this.xp / 100) + 1;
    this.achievements = JSON.parse(localStorage.getItem('achievements')) || [];
    this.updateUI();
  }

  addXP(amount) {
    this.xp += amount;
    this.level = Math.floor(this.xp / 100) + 1;
    localStorage.setItem('xp', this.xp.toString());
    this.unlockAchievement(missions[currentMissionIndex].achievement);
    this.updateUI();
  }

  unlockAchievement(name) {
    if (!this.achievements.includes(name)) {
      this.achievements.push(name);
      localStorage.setItem('achievements', JSON.stringify(this.achievements));
      alert(`🏆 Achievement Unlocked: ${name}`);
    }
  }

  updateUI() {
    const xpElement = document.getElementById("xp");
    const levelElement = document.getElementById("level");
    const achievementsElement = document.getElementById("achievements");
    
    if (xpElement) xpElement.textContent = this.xp;
    if (levelElement) levelElement.textContent = this.level;
    if (achievementsElement) {
      achievementsElement.textContent = this.achievements.join(", ") || "None";
    }
    
    updateProgressBar(this.xp);
  }
}

const rewards = new RewardsSystem();

// ======================
// DATABASE FUNCTIONS
// ======================

async function initDB() {
  try {
    // Initialize SQL.js
    const SQL = await initSqlJs({
      locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.7.0/dist/${file}`
    });
    db = new SQL.Database();

    // Create and populate sales table
    db.run("CREATE TABLE sales (employee TEXT, product TEXT, amount INTEGER, client TEXT)");
    db.run("INSERT INTO sales VALUES ('Dwight', 'Paper', 500, 'AAA Paper')");
    db.run("INSERT INTO sales VALUES ('Jim', 'Printer', 300, 'Dunder Corp')");
    db.run("INSERT INTO sales VALUES ('Dwight', 'Stapler', 45, 'Staples Inc')");
    db.run("INSERT INTO sales VALUES ('Pam', 'Notebooks', 120, 'Office Dreams')");
    db.run("INSERT INTO sales VALUES ('Dwight', 'Paper', 750, 'Paper World')");

    // Create quotes table
    db.run("CREATE TABLE quotes (character TEXT, quote TEXT, season INTEGER)");

    // Load quotes from JSON
    try {
      const response = await fetch('data/michael_quotes.json');
      if (!response.ok) throw new Error('Failed to load quotes');
      
      const { quotes } = await response.json();
      const stmt = db.prepare("INSERT INTO quotes VALUES (?, ?, ?)");
      
      quotes.forEach(({ character, quote, season }) => {
        stmt.bind([character, quote, season]);
        stmt.step();
        stmt.reset();
      });
      
      stmt.free();
    } catch (error) {
      console.error("Error loading quotes:", error);
      // Fallback to default quotes
      db.run("INSERT INTO quotes VALUES ('Michael', 'That''s what she said!', 2)");
      db.run("INSERT INTO quotes VALUES ('Dwight', 'Bears. Beets. Battlestar Galactica.', 3)");
    }

    // Update UI
    updateTable('sales', 50);
    updateTable('quotes', 50);

    // Enable buttons
    document.getElementById("preview-data-btn").disabled = false;
    document.getElementById("preview-data-btn").textContent = "👀 Show Sample Data";
    document.getElementById("start-game-btn").disabled = false;
    document.getElementById("start-game-btn").textContent = "🚀 Start Your Sales Career";

  } catch (error) {
    console.error("Database initialization failed:", error);
    alert("Failed to initialize database. Please refresh the page.");
  }
}

function updateTable(tableName, limit = 50) {
  try {
    const result = db.exec(`SELECT * FROM ${tableName} LIMIT ${limit}`);
    const tableElement = document.getElementById(`${tableName}-table`);
    if (tableElement) {
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

// ======================
// GAME LOGIC
// ======================

function showDataPreview() {
  try {
    const previewDiv = document.getElementById('preview-tables');
    if (!previewDiv) return;
    
    previewDiv.classList.remove('hidden');

    const salesPreview = db.exec("SELECT employee, COUNT(*) as sales FROM sales GROUP BY employee");
    let html = "<h3>📊 Employee Sales Count</h3>";
    html += generateTableHTML(salesPreview);

    const quotesPreview = db.exec("SELECT character, COUNT(*) as quotes FROM quotes GROUP BY character");
    html += "<h3>📜 Character Quote Count</h3>";
    html += generateTableHTML(quotesPreview);

    previewDiv.innerHTML = html;
  } catch (error) {
    alert("⚠️ Please wait while we load the data...");
  }
}

function loadMission(index) {
  if (index >= missions.length) {
    const missionQuestion = document.getElementById("mission-question");
    const submitAnswer = document.getElementById("submit-answer");
    
    if (missionQuestion) missionQuestion.innerText = "🎉 You've completed all missions!";
    if (submitAnswer) submitAnswer.disabled = true;
    return;
  }

  currentMissionIndex = index;
  localStorage.setItem('currentMission', currentMissionIndex.toString());
  
  const currentLevel = document.getElementById("current-level");
  const missionQuestion = document.getElementById("mission-question");
  const finalAnswer = document.getElementById("final-answer");
  const queryInput = document.getElementById("query-input");
  const submitAnswer = document.getElementById("submit-answer");
  const feedback = document.getElementById("feedback");
  const timer = document.getElementById("timer");

  if (currentLevel) currentLevel.innerText = index + 1;
  if (missionQuestion) missionQuestion.innerText = missions[index].question;
  if (finalAnswer) finalAnswer.value = "";
  if (queryInput) {
    queryInput.value = "";
    queryInput.disabled = false;
  }
  if (submitAnswer) submitAnswer.disabled = false;
  if (feedback) {
    feedback.className = "";
    feedback.innerHTML = "";
  }
  if (timer) timer.classList.add("hidden");
  
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
      showCorrectAnswer();
    }
  }, 1000);
});

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
      
      const startMissionBtn = document.getElementById("start-mission-btn");
      if (startMissionBtn) startMissionBtn.disabled = false;
    }, 1500);
  } else {
    feedback.className = "feedback-error";
    feedback.innerText = "❌ Incorrect. Try again!";
  }
});

document.getElementById("query-input")?.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const userQuery = this.value.trim();
    try {
      const result = db.exec(userQuery);
      displayResult(result);
    } catch (error) {
      displayResult([{ columns: ["Error"], values: [[error.message]] }]);
    }
  }
});

function displayResult(result) {
  const output = document.getElementById("feedback");
  if (!output) return;
  
  output.className = "";
  output.innerHTML = "";
  
  if (!result || !result.length) {
    output.innerText = "No results found.";
    return;
  }
  
  output.innerHTML = "<table>" + generateTableHTML(result) + "</table>";
}

function showCorrectAnswer() {
  try {
    const audio = new Audio('assets/sounds/correct.mp3');
    audio.play().catch(e => console.log("Audio play failed:", e));
  } catch (error) {
    console.error("Error playing sound:", error);
  }
}

// ======================
// INITIALIZATION
// ======================

document.getElementById("preview-data-btn")?.addEventListener("click", showDataPreview);
document.getElementById("start-game-btn")?.addEventListener("click", startGame);

document.addEventListener("DOMContentLoaded", () => {
  initDB();
});
