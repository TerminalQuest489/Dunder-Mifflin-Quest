const DATABASE_URL =
  "https://raw.githubusercontent.com/TerminalQuest489/Dunder-Mifflin-Quest/main/data/dunder_mifflin_sales.json";

let db;
let xp = 0;
let level = 1;
let achievements = [];
let missions = [
  {
    question: "How many sales did Dwight Schrute make?",
    validate: (rows, answer) => rows.length === 5 && answer === "5",
    sqlHint: "SELECT * FROM sales WHERE employee = 'Dwight Schrute';",
    answerHint: "There are 5 rows with Dwight Schrute"
  },
  {
    question: "What is the total sales amount for Jim Halpert?",
    validate: (rows) => {
      const sum = rows.reduce((acc, r) => acc + r.amount, 0);
      return sum === 4340;
    },
    sqlHint: "SELECT * FROM sales WHERE employee = 'Jim Halpert';",
    answerHint: "Add all 'amount' values for Jim Halpert"
  },
  {
    question: "Which employee made the highest single sale?",
    validate: (rows) => rows[0].employee === "Dwight Schrute" && rows[0].amount === 4950,
    sqlHint: "SELECT * FROM sales ORDER BY amount DESC LIMIT 1;",
    answerHint: "Look for the max amount"
  }
];

let currentMission = 0;
let timerInterval;

async function loadData() {
  const response = await fetch(DATABASE_URL);
  const json = await response.json();
  const SQL = await initSqlJs({   locateFile: filename => `https://cdn.jsdelivr.net/npm/sql.js@1.7.0/dist/${filename}` });
  db = new SQL.Database();
  db.run("CREATE TABLE sales (employee TEXT, product TEXT, amount INTEGER, client TEXT);");
  const insert = db.prepare("INSERT INTO sales VALUES (?, ?, ?, ?);");
  json.sales.forEach(row => insert.run([row.employee, row.product, row.amount, row.client]));
  insert.free();
}

function displayTableFromQuery(query, tableElementId) {
  try {
    const results = db.exec(query);
    const table = document.getElementById(tableElementId);
    table.innerHTML = "";
    if (!results.length) return;
    const columns = results[0].columns;
    const values = results[0].values;

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    columns.forEach(col => {
      const th = document.createElement("th");
      th.textContent = col;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    const tbody = document.createElement("tbody");
    values.forEach(row => {
      const tr = document.createElement("tr");
      row.forEach(cell => {
        const td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
  } catch (err) {
    console.error("Query error:", err);
  }
}

function runQuery() {
  const query = document.getElementById("query-input").value;
  try {
    const results = db.exec(query);
    const container = document.getElementById("query-results");
    container.innerHTML = "";

    if (!results.length) {
      container.textContent = "No results.";
      return;
    }

    const { columns, values } = results[0];
    const table = document.createElement("table");
    table.classList.add("query-output-table");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    columns.forEach(col => {
      const th = document.createElement("th");
      th.textContent = col;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    values.forEach(row => {
      const tr = document.createElement("tr");
      row.forEach(cell => {
        const td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  } catch (e) {
    document.getElementById("query-results").textContent = `❌ Error: ${e.message}`;
  }
}

function startMission() {
  document.getElementById("mission-question").textContent = missions[currentMission].question;
  document.getElementById("submit-answer").disabled = false;
  startTimer(60);
}

function startTimer(seconds) {
  const timerDisplay = document.getElementById("timer");
  const timeLeft = document.getElementById("time-left");
  timerDisplay.classList.remove("hidden");
  let remaining = seconds;
  timeLeft.textContent = remaining;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    remaining--;
    timeLeft.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(timerInterval);
      document.getElementById("feedback").textContent = "⏰ Time’s up! Try again.";
    }
  }, 1000);
}

function evaluateAnswer() {
  const query = document.getElementById("query-input").value;
  const finalAnswer = document.getElementById("final-answer").value.trim();
  let rows = [];
  try {
    const results = db.exec(query);
    if (results.length > 0) {
      const cols = results[0].columns;
      const values = results[0].values;
      rows = values.map(row => Object.fromEntries(row.map((v, i) => [cols[i], v])));
    }
  } catch (e) {
    document.getElementById("feedback").textContent = ❌ Error: ${e.message};
    return;
  }

  const isCorrect = missions[currentMission].validate(rows, finalAnswer);
  if (isCorrect) {
    xp += 100;
    level++;
    achievements.push(`✔️ Mission ${currentMission + 1}`);
    document.getElementById("feedback").textContent = `✅ Correct! You've completed the mission.`;
    updateStats();
    currentMission++;
    if (currentMission < missions.length) {
      setTimeout(() => {
        document.getElementById("query-input").value = "";
        document.getElementById("final-answer").value = "";
        document.getElementById("feedback").textContent = "";
        document.getElementById("query-results").textContent = "";
        document.getElementById("current-level").textContent = currentMission + 1;
        startMission();
      }, 2000);
    } else {
      document.getElementById("mission-question").textContent = "🏆 All missions complete!";
      document.getElementById("submit-answer").disabled = true;
    }
  } else {
    document.getElementById("feedback").textContent = `❌ Incorrect. Hint: ${missions[currentMission].answerHint}`;
  }
}

function updateStats() {
  document.getElementById("xp").textContent = xp;
  document.getElementById("level").textContent = level;
  document.getElementById("achievements").textContent = achievements.join(", ") || "None";
  const bar = document.getElementById("xp-progress-bar");
  bar.style.width = `${(xp % 100) + 1}%`;
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  document.getElementById("start-game-btn").disabled = false;
  document.getElementById("preview-data-btn").disabled = false;
  document.getElementById("start-game-btn").textContent = "🎮 Start Game";
  document.getElementById("preview-data-btn").textContent = "👀 Preview Sales Table";

  document.getElementById("preview-data-btn").addEventListener("click", () => {
    const preview = db.exec("SELECT * FROM sales LIMIT 10;");
    const container = document.getElementById("preview-tables");
    container.innerHTML = "";

    if (preview.length > 0) {
      const { columns, values } = preview[0];

      const table = document.createElement("table");
      table.classList.add("preview-table");

      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      columns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      values.forEach(row => {
        const tr = document.createElement("tr");
        row.forEach(cell => {
          const td = document.createElement("td");
          td.textContent = cell;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      container.appendChild(table);
    }
    container.classList.remove("hidden");
  });

  document.getElementById("start-game-btn").addEventListener("click", () => {
    document.getElementById("intro-screen").style.display = "none";
    document.getElementById("game-ui").style.display = "block";
    document.getElementById("current-level").textContent = currentMission + 1;
    startMission();
  });

  document.getElementById("start-mission-btn").addEventListener("click", () => {
    startMission();
  });

  document.getElementById("submit-answer").addEventListener("click", () => {
    evaluateAnswer();
  });

  document.getElementById("run-query-btn").addEventListener("click", () => {
    runQuery();
  });

  document.getElementById("query-input").addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runQuery();
    }
  });
});
