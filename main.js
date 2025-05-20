// main.js

let db;
let currentMissionIndex = parseInt(localStorage.getItem('currentMission')) || 0;
let timeLeft = 0;
let missionInterval;

const missions = [
  { question: "How many sales did Dwight make?", answer: "2", xp: 50, achievement: "Sales Counting Rookie", timeLimit: 60 },
  { question: "What's the total sales amount made by Jim?", answer: "300", xp: 100, achievement: "Sales Totals Master", timeLimit: 50 },
  { question: "How many clients bought more than one product?", answer: "0", xp: 150, achievement: "Client Analyst", timeLimit: 40 },
  { question: "What's the most sold product by total sales?", answer: "Paper", xp: 200, achievement: "Product Expert", timeLimit: 30 },
  { question: "Who has the highest average sale amount?", answer: "Dwight", xp: 250, achievement: "Sales Champion", timeLimit: 25 }
];

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
    const bar = document.getElementById("xp-progress-bar");
    if (bar) bar.style.width = `${(this.xp % 100)}%`;
  }
};

function getRandomCelebration() {
  const options = [
    "That's what she said!",
    "Bears. Beets. Battlestar Galactica!",
    "Identity theft is not a joke, Jim!",
    "You're winner!",
    "Assistant to the Regional Manager!",
    "That's a Stanley nickel!"
  ];
  return options[Math.floor(Math.random() * options.length)];
}

function initDB() {
  initSqlJs({ locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.7.0/dist/${file}` })
    .then(SQL => {
      db = new SQL.Database();

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
      db.run("INSERT INTO quotes VALUES ('Jim', 'Bears do not... What is going on?! What are you doing?!', 3)");
      db.run("INSERT INTO quotes VALUES ('Michael', 'Would I rather be feared or loved? Easy. Both.', 2)");

      document.getElementById("preview-data-btn").disabled = false;
      document.getElementById("start-game-btn").disabled = false;
    })
    .catch(err => {
      alert("Error loading SQL.js");
      console.error(err);
    });
}

function generateTableHTML(result) {
  if (!result || !result.length) return "";
  const headers = result[0].columns.map(col => `<th>${col}</th>`).join("");
  const rows = result[0].values.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("");
  return `<thead><tr>${headers}</tr></thead><tbody>${rows}</tbody>`;
}

function showDataPreview() {
  const preview = document.getElementById("preview-tables");
  preview.classList.remove("hidden");
  const sales = db.exec("SELECT employee, COUNT(*) AS sales FROM sales GROUP BY employee");
  const quotes = db.exec("SELECT character, COUNT(*) AS quotes FROM quotes GROUP BY character");
  preview.innerHTML = `
    <h3>📊 Sales</h3><table>${generateTableHTML(sales)}</table>
    <h3>🗣️ Quotes</h3><table>${generateTableHTML(quotes)}</table>
  `;
}

function loadMission(index) {
  if (index >= missions.length) {
    document.getElementById("mission-question").innerText = "🎉 All missions complete!";
    document.getElementById("submit-answer").disabled = true;
    return;
  }

  const mission = missions[index];
  document.getElementById("current-level").innerText = index + 1;
  document.getElementById("mission-question").innerText = mission.question;
  document.getElementById("final-answer").value = "";
  document.getElementById("query-input").value = "";
  document.getElementById("feedback").className = "";
  document.getElementById("feedback").innerHTML = "";
  document.getElementById("query-input").disabled = false;
  document.getElementById("submit-answer").disabled = false;
  document.getElementById("timer").classList.add("hidden");
  clearInterval(missionInterval);
}

function checkAnswer() {
  const userAnswer = document.getElementById("final-answer").value.trim().toLowerCase();
  const correct = missions[currentMissionIndex].answer.toLowerCase();
  const feedback = document.getElementById("feedback");

  if (userAnswer === correct) {
    feedback.className = "feedback-correct";
    feedback.innerHTML = `✅ Correct! XP +${missions[currentMissionIndex].xp}<br>🎉 ${getRandomCelebration()}`;
    rewards.addXP(missions[currentMissionIndex].xp);
    setTimeout(() => {
      currentMissionIndex++;
      localStorage.setItem('currentMission', currentMissionIndex);
      loadMission(currentMissionIndex);
      document.getElementById("start-mission-btn").disabled = false;
    }, 1500);
  } else {
    feedback.className = "feedback-error";
    feedback.innerText = "❌ Incorrect. Try again!";
  }
}

function startMission() {
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
      new Audio("assets/sounds/correct.mp3").play().catch(() => {});
    }
  }, 1000);
}

function startGame() {
  document.getElementById("intro-screen").style.display = "none";
  document.getElementById("game-ui").style.display = "block";
  loadMission(currentMissionIndex);
}

function runQueryOnEnter(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const query = this.value.trim();
    const feedback = document.getElementById("feedback");
    try {
      const result = db.exec(query);
      feedback.className = "";
      feedback.innerHTML = `<table>${generateTableHTML(result)}</table>`;
    } catch (err) {
      feedback.innerHTML = `<table><thead><tr><th>Error</th></tr></thead><tbody><tr><td>${err.message}</td></tr></tbody></table>`;
    }
  }
}

// EVENT LISTENERS

document.getElementById("preview-data-btn").addEventListener("click", showDataPreview);
document.getElementById("start-game-btn").addEventListener("click", startGame);
document.getElementById("start-mission-btn").addEventListener("click", startMission);
document.getElementById("submit-answer").addEventListener("click", checkAnswer);
document.getElementById("query-input").addEventListener("keydown", runQueryOnEnter);

document.addEventListener("DOMContentLoaded", initDB);
