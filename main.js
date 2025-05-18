let db;
let currentMissionIndex = parseInt(localStorage.getItem('currentMission')) || 0;
let timeLeft = 0;
let missionInterval;

// Helper functions first
function updateProgressBar() {
  const percent = ((rewards.xp % 100) / 100) * 100;
  document.getElementById("xp-progress-bar").style.width = `${percent}%`;
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

// Initialize rewards system
const rewards = new class {
  constructor() {
    this.xp = parseInt(localStorage.getItem('xp')) || 0;
    this.level = Math.floor(this.xp / 100) + 1;
    this.achievements = JSON.parse(localStorage.getItem('achievements')) || [];
    this.updateUI();
  }

  addXP(amount) {
    this.xp += amount;
    this.level = Math.floor(this.xp / 100) + 1;
    localStorage.setItem('xp', this.xp);
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
    document.getElementById("xp").innerText = this.xp;
    document.getElementById("level").innerText = this.level;
    document.getElementById("achievements").innerText = this.achievements.join(", ") || "None";
    updateProgressBar();
  }
};

// Game missions
const missions = [
  { question: "How many sales did Dwight make?", answer: "134", xp: 50, achievement: "Sales Counting Rookie", timeLimit: 60 },
  { question: "What's the total sales amount made by Jim?", answer: "42675", xp: 100, achievement: "Sales Totals Master", timeLimit: 50 },
  { question: "How many clients bought more than one product?", answer: "27", xp: 150, achievement: "Client Analyst", timeLimit: 40 },
  { question: "What's the most sold product by total sales?", answer: "Paper", xp: 200, achievement: "Product Expert", timeLimit: 30 },
  { question: "Who has the highest average sale amount?", answer: "Dwight Schrute", xp: 250, achievement: "Sales Champion", timeLimit: 25 }
];

// Database initialization
async function initDB() {
  try {
    const SQL = await initSqlJs({
      locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.7.0/dist/${file}`
    });
    db = new SQL.Database();

    // Create tables
    db.run("CREATE TABLE sales (employee TEXT, product TEXT, amount INTEGER, client TEXT)");
    db.run("INSERT INTO sales VALUES ('Dwight', 'Paper', 500, 'AAA Paper')");
    db.run("INSERT INTO sales VALUES ('Jim', 'Printer', 300, 'Dunder Corp')");
    db.run("INSERT INTO sales VALUES ('Dwight', 'Stapler', 45, 'Staples Inc')");
    db.run("INSERT INTO sales VALUES ('Pam', 'Notebooks', 120, 'Office Dreams')");
    db.run("INSERT INTO sales VALUES ('Dwight', 'Paper', 750, 'Paper World')");

    db.run("CREATE TABLE quotes (character TEXT, quote TEXT, season INTEGER)");
    db.run("INSERT INTO quotes VALUES ('Michael', 'That''s what she said!', 2)");
    db.run("INSERT INTO quotes VALUES ('Dwight', 'Bears. Beets. Battlestar Galactica.', 3)");
    db.run("INSERT INTO quotes VALUES ('Michael', 'I''m not superstitious, but I am a little stitious.', 4)");
    db.run("INSERT INTO quotes VALUES ('Jim', 'Bears do not... What is going on?! What are you doing?!", 3)");
    db.run("INSERT INTO quotes VALUES ('Michael', 'Would I rather be feared or loved? Easy. Both.', 2)");

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

// Table management
function updateTable(tableName, limit = 50) {
  try {
    const result = db.exec(`SELECT * FROM ${tableName} LIMIT ${limit}`);
    const tableElement = document.getElementById(`${tableName}-table`);
    tableElement.innerHTML = generateTableHTML(result);
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

// Data preview functionality
function showDataPreview() {
  try {
    const previewDiv = document.getElementById('preview-tables');
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

// Mission management
function loadMission(index) {
  if (index >= missions.length) {
    document.getElementById("mission-question").innerText = "🎉 You've completed all missions!";
    document.getElementById("submit-answer").disabled = true;
    return;
  }

  currentMissionIndex = index;
  localStorage.setItem('currentMission', currentMissionIndex);
  document.getElementById("current-level").innerText = index + 1;
  document.getElementById("mission-question").innerText = missions[index].question;
  document.getElementById("final-answer").value = "";
  document.getElementById("query-input").value = "";
  document.getElementById("query-input").disabled = false;
  document.getElementById("submit-answer").disabled = false;
  document.getElementById("feedback").className = "";
  document.getElementById("feedback").innerHTML = "";
  document.getElementById("timer").classList.add("hidden");
  clearInterval(missionInterval);
}

// Timer functionality
document.getElementById("start-mission-btn").addEventListener("click", () => {
  clearInterval(missionInterval);
  const mission = missions[currentMissionIndex];
  timeLeft = mission.timeLimit;
  document.getElementById("time-left").textContent = timeLeft;
  document.getElementById("timer").classList.remove("hidden");
  document.getElementById("start-mission-btn").disabled = true;
  document.getElementById("submit-answer").disabled = false;
  missionInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("time-left").textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(missionInterval);
      document.getElementById("submit-answer").disabled = true;
      document.getElementById("start-mission-btn").disabled = false;
      showCorrectAnswer();
    }
  }, 1000);
});

// Play sound effect (optional)
function showCorrectAnswer() {
  const audio = new Audio('assets/sounds/correct.mp3');
  try {
    audio.play();
  } catch {}
}

// Answer checking
document.getElementById("submit-answer").addEventListener("click", checkAnswer);

function checkAnswer() {
  const userAnswer = document.getElementById("final-answer").value.trim().toLowerCase();
  const correctAnswer = missions[currentMissionIndex].answer.toLowerCase();

  if (userAnswer === correctAnswer) {
    document.getElementById("feedback").className = "feedback-correct";
    document.getElementById("feedback").innerHTML = `
      ✅ Correct! XP +${missions[currentMissionIndex].xp}<br>
      🎉 ${getRandomCelebration()}
    `;
    rewards.addXP(missions[currentMissionIndex].xp);
    setTimeout(() => {
      currentMissionIndex++;
      localStorage.setItem('currentMission', currentMissionIndex);
      loadMission(currentMissionIndex);
      document.getElementById("start-mission-btn").disabled = false;
    }, 1500);
  } else {
    document.getElementById("feedback").className = "feedback-error";
    document.getElementById("feedback").innerText = "❌ Incorrect. Try again!";
  }
}

// Query execution
document.getElementById("query-input").addEventListener("keydown", function(e) {
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
  output.className = "";
  output.innerHTML = "";
  if (!result || !result.length) {
    output.innerText = "No results found.";
    return;
  }
  output.innerHTML = "<table>" + generateTableHTML(result) + "</table>";
}

// Game flow control
function startGame() {
  document.getElementById("intro-screen").style.display = "none";
  document.getElementById("game-ui").style.display = "block";
  loadMission(currentMissionIndex);
}

// Event listeners
document.getElementById("preview-data-btn").addEventListener("click", showDataPreview);
document.getElementById("start-game-btn").addEventListener("click", startGame);

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  initDB();
});
