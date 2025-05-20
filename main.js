const dataUrl = "https://raw.githubusercontent.com/TerminalQuest489/Dunder-Mifflin-Quest/main/data/dunder_mifflin_sales.json";

let db, xp = 0, level = 1, currentMission = 0;
let missions = [];

const xpDisplay = document.getElementById("xp");
const levelDisplay = document.getElementById("level");
const missionQuestion = document.getElementById("mission-question");
const currentLevelDisplay = document.getElementById("current-level");
const submitBtn = document.getElementById("submit-answer");
const feedback = document.getElementById("feedback");
const queryInput = document.getElementById("query-input");
const finalAnswer = document.getElementById("final-answer");
const previewBtn = document.getElementById("preview-data-btn");
const previewTables = document.getElementById("preview-tables");
const startGameBtn = document.getElementById("start-game-btn");

const sampleQuotes = [
  { quote: "I am Beyoncé, always.", author: "Michael Scott" },
  { quote: "Bears. Beets. Battlestar Galactica.", author: "Jim Halpert" },
  { quote: "Whenever I'm about to do something, I think, 'Would an idiot do that?' And if they would, I do not do that thing.", author: "Dwight Schrute" }
];

async function loadDatabase() {
  const SQL = await initSqlJs({ locateFile: filename => `https://cdn.jsdelivr.net/npm/sql.js@1.7.0/dist/${filename}` });

  const response = await fetch(dataUrl);
  const json = await response.json();
  const sales = json.sales;

  db = new SQL.Database();
  db.run(`CREATE TABLE sales (employee TEXT, product TEXT, amount INTEGER, client TEXT);`);

  const stmt = db.prepare(`INSERT INTO sales VALUES (?, ?, ?, ?);`);
  for (const row of sales) {
    stmt.run([row.employee, row.product, row.amount, row.client]);
  }
  stmt.free();

  db.run(`CREATE TABLE quotes (quote TEXT, author TEXT);`);
  const quoteStmt = db.prepare(`INSERT INTO quotes VALUES (?, ?);`);
  sampleQuotes.forEach(q => quoteStmt.run([q.quote, q.author]));
  quoteStmt.free();

  missions = generateMissions();
  previewBtn.innerText = "👀 Preview Sales Table";
  previewBtn.disabled = false;
  startGameBtn.innerText = "🎮 Start Game";
  startGameBtn.disabled = false;
}

function generateMissions() {
  return [
    {
      question: "How many sales did Dwight Schrute make?",
      sql: "SELECT COUNT(*) as count FROM sales WHERE employee = 'Dwight Schrute';",
      answer: "5",
      xp: 10
    },
    {
      question: "What was the total amount sold by Jim Halpert?",
      sql: "SELECT SUM(amount) as total FROM sales WHERE employee = 'Jim Halpert';",
      answer: "4340",
      xp: 20
    },
    {
      question: "Which client bought the most from Pam Beesly?",
      sql: `SELECT client FROM sales WHERE employee = 'Pam Beesly' ORDER BY amount DESC LIMIT 1;`,
      answer: "Amazon",
      xp: 25
    },
    {
      question: "How many unique employees made sales?",
      sql: `SELECT COUNT(DISTINCT employee) as unique_employees FROM sales;`,
      answer: "9",
      xp: 10
    },
    {
      question: "Which product did Michael Scott sell the most of (by total amount)?",
      sql: `SELECT product FROM sales WHERE employee = 'Michael Scott' GROUP BY product ORDER BY SUM(amount) DESC LIMIT 1;`,
      answer: "Notebooks",
      xp: 25
    }
  ];
}

function runQuery(query) {
  try {
    const result = db.exec(query);
    if (result.length === 0) return [];

    const { columns, values } = result[0];
    return values.map(row =>
      Object.fromEntries(columns.map((col, i) => [col, row[i]]))
    );
  } catch (e) {
    feedback.textContent = "❌ Error in SQL: " + e.message;
    return [];
  }
}

function updateStats() {
  xpDisplay.textContent = xp;
  levelDisplay.textContent = level;
  document.getElementById("xp-progress-bar").style.width = `${(xp % 100)}%`;
  if (xp >= level * 100) {
    level++;
    feedback.innerHTML += "<br>🔥 Level up!";
  }
}

submitBtn.addEventListener("click", () => {
  const playerAnswer = finalAnswer.value.trim();
  const mission = missions[currentMission];

  if (playerAnswer === mission.answer) {
    feedback.innerHTML = `✅ Correct! You earned ${mission.xp} XP.`;
    xp += mission.xp;
    currentMission++;
    updateStats();
    if (currentMission < missions.length) {
      loadMission();
    } else {
      missionQuestion.innerHTML = "🏆 You've completed all missions! Refresh to play again.";
      submitBtn.disabled = true;
    }
  } else {
    feedback.innerHTML = `❌ Incorrect. Try again!`;
  }
});

function loadMission() {
  const mission = missions[currentMission];
  currentLevelDisplay.textContent = currentMission + 1;
  missionQuestion.textContent = mission.question;
  queryInput.value = mission.sql;
  finalAnswer.value = "";
  feedback.textContent = "";
  submitBtn.disabled = false;
}

document.getElementById("start-game-btn").addEventListener("click", () => {
  document.getElementById("intro-screen").style.display = "none";
  document.getElementById("game-ui").style.display = "block";
  loadMission();
});

previewBtn.addEventListener("click", () => {
  const rows = runQuery("SELECT * FROM sales LIMIT 5;");
  if (rows.length === 0) return;
  const table = document.createElement("table");

  const headerRow = document.createElement("tr");
  Object.keys(rows[0]).forEach(key => {
    const th = document.createElement("th");
    th.textContent = key;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  rows.forEach(row => {
    const tr = document.createElement("tr");
    Object.values(row).forEach(val => {
      const td = document.createElement("td");
      td.textContent = val;
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  previewTables.innerHTML = "";
  previewTables.appendChild(table);
  previewTables.classList.remove("hidden");
});

// Kick off everything
loadDatabase();
