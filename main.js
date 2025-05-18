let db;
let currentMissionIndex = parseInt(localStorage.getItem('currentMission')) || 0;
let timeLeft = 0;
let missionInterval;

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
  }
};

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

async function initDB() {
  const SQL = window.SQL;
  db = new SQL.Database();

  try {
    const salesResponse = await fetch('data/dunder_mifflin_sales.json');
    const salesData = await salesResponse.json();
    db.run("CREATE TABLE sales (employee TEXT, product TEXT, amount INTEGER, client TEXT)");
    salesData.sales.forEach(row => db.run(`INSERT INTO sales VALUES (?, ?, ?, ?)`, [row.employee, row.product, row.amount, row.client]));

    const quotesResponse = await fetch('data/michael_quotes.json');
    const quotesData = await quotesResponse.json();
    db.run("CREATE TABLE quotes (character TEXT, quote TEXT, season INTEGER)");
    quotesData.quotes.forEach(row => db.run(`INSERT INTO quotes VALUES (?, ?, ?)`, [row.character, row.quote, row.season]));

    updateTable('sales', 50);
    updateTable('quotes', 50);
    console.log("✅ Database initialized!");
  } catch (error) {
    console.error("Database initialization failed:", error);
    alert("Failed to load game data. Please try refreshing the page.");
  }
}

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

async function showDataPreview() {
  const previewDiv = document.getElementById('preview-tables');
  previewDiv.classList.remove('hidden');
  
  let html = "<div class='data-preview-container'>";
  html += "<h3>Sales Data (Sample)</h3>";
  html += generateTableHTML(db.exec("SELECT * FROM sales LIMIT 5"));
  html += "<h3>Michael's Quotes (Sample)</h3>";
  html += generateTableHTML(db.exec("SELECT * FROM quotes LIMIT 5"));
  html += "</div>";
  
  previewDiv.innerHTML = html;
}

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

document.getElementById("start-mission-btn").addEventListener("click", () => {
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

function showCorrectAnswer() {
  const correctAnswer = missions[currentMissionIndex].answer;
  document.getElementById("feedback").className = "feedback-error";
  document.getElementById("feedback").innerHTML = `
    ❌ Time's up! Correct answer: <strong>${correctAnswer}</strong>
    <br><button onclick="loadMission(currentMissionIndex)">🔄 Retry Mission</button>
  `;
}

document.getElementById("start-game-btn").addEventListener("click", () => {
  document.getElementById("intro-screen").style.display = "none";
  document.getElementById("game-ui").style.display = "block";
  loadMission(currentMissionIndex);
});

document.addEventListener("DOMContentLoaded", () => {
  initDB();
});
