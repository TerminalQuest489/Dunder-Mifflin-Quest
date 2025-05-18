let db;
let currentMissionIndex = 0;
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

  const salesResponse = await fetch('data/dunder_mifflin_sales.json');
  const salesData = await salesResponse.json();
  db.run("CREATE TABLE sales (employee TEXT, product TEXT, amount INTEGER, client TEXT)");
  salesData.sales.forEach(row => db.run(`INSERT INTO sales VALUES (?, ?, ?, ?)`, [row.employee, row.product, row.amount, row.client]));

  const quotesResponse = await fetch('data/michael_quotes.json');
  const quotesData = await quotesResponse.json();
  db.run("CREATE TABLE quotes (character TEXT, quote TEXT, season INTEGER)");
  quotesData.quotes.forEach(row => db.run(`INSERT INTO quotes VALUES (?, ?, ?)`, [row.character, row.quote, row.season]));

  console.log("✅ Database initialized!");
}

function loadMission(index) {
  if (index >= missions.length) {
    document.getElementById("mission-question").innerText = "🎉 You've completed all missions!";
    document.getElementById("submit-answer").disabled = true;
    return;
  }

  document.getElementById("current-level").innerText = index + 1;
  document.getElementById("mission-question").innerText = missions[index].question;
  document.getElementById("final-answer").value = "";
  document.getElementById("query-input").disabled = false;
  document.getElementById("submit-answer").disabled = false;
  document.getElementById("feedback").innerText = "";
}

document.getElementById("start-mission-btn").addEventListener("click", () => {
  const mission = missions[currentMissionIndex];
  timeLeft = mission.timeLimit;
  document.getElementById("timer").classList.remove("hidden");

  missionInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("time-left").innerText = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(missionInterval);
      document.getElementById("submit-answer").disabled = true;
      showCorrectAnswer();
    }
  }, 1000);
});

function checkAnswer() {
  const userAnswer = document.getElementById("final-answer").value.trim();
  const correctAnswer = missions[currentMissionIndex].answer;

  if (userAnswer === correctAnswer) {
    document.getElementById("feedback").innerText = `✅ Correct! XP +${missions[currentMissionIndex].xp}`;
    rewards.addXP(missions[currentMissionIndex].xp);

    setTimeout(() => {
      document.getElementById("feedback").innerText = "";
      document.getElementById("final-answer").value = "";
      document.getElementById("query-input").value = "";
      document.getElementById("submit-answer").disabled = true;
      document.getElementById("timer").classList.add("hidden");
      clearInterval(missionInterval);
      currentMissionIndex++;
      loadMission(currentMissionIndex);
    }, 1000);

  } else {
    document.getElementById("feedback").innerText = "❌ Incorrect. Try again.";
  }
}

document.getElementById("query-input").addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
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
  if (!result || !result.length) {
    output.innerText = "No results found.";
    return;
  }

  let html = "<table><thead><tr>";
  html += result[0].columns.map(col => `<th>${col}</th>`).join("");
  html += "</tr></thead><tbody>";

  result[0].values.forEach(row => {
    html += "<tr>" + row.map(cell => `<td>${cell}</td>`).join("") + "</tr>";
  });

  html += "</tbody></table>";
  output.innerHTML = html;
}

function showCorrectAnswer() {
  const correctAnswer = missions[currentMissionIndex].answer;
  document.getElementById("feedback").innerHTML = `
    ❌ Time ran out! The correct answer was: <strong>${correctAnswer}</strong>
    <br><br>💡 Want to try again? Click "Start Mission"!
  `;
  showLearningLinks();
}

function showLearningLinks() {
  document.getElementById("feedback").innerHTML += `
    <br><br>
    📚 Learn More:
    <ul>
      <li><a href="https://www.w3schools.com/sql/ " target="_blank">W3Schools SQL</a></li>
      <li><a href="https://sqlbolt.com/ " target="_blank">SQLBolt Interactive Tutorial</a></li>
      <li><a href="https://mode.com/sql-tutorial/ " target="_blank">Mode SQL Guide</a></li>
    </ul>
  `;
}

document.getElementById("start-game-btn").addEventListener("click", () => {
  document.getElementById("intro-screen").style.display = "none";
  document.getElementById("game-ui").style.display = "block";
  loadMission(0);
});

document.addEventListener("DOMContentLoaded", () => {
  initDB();
});
