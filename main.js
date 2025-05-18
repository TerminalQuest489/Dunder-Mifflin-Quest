let currentMissionIndex = parseInt(localStorage.getItem('currentMission')) || 0;
let timeLeft = 0;
let missionInterval;
let salesData = [];
let quotesData = [];

// Rewards system
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
      showAchievementToast(`🏆 Achievement Unlocked: ${name}`);
    }
  }
  updateUI() {
    document.getElementById("xp").innerText = this.xp;
    document.getElementById("level").innerText = this.level;
    document.getElementById("achievements").innerText = this.achievements.join(", ") || "None";
    updateProgressBar();
  }
};

function updateProgressBar() {
  const percent = ((rewards.xp % 100) / 100) * 100;
  document.getElementById("xp-progress-bar").style.width = `${percent}%`;
}

// Game missions
const missions = [
  { question: "How many sales did Dwight make?", answer: "134", xp: 50, achievement: "Sales Counting Rookie", timeLimit: 60 },
  { question: "What's the total sales amount made by Jim?", answer: "42675", xp: 100, achievement: "Sales Totals Master", timeLimit: 50 },
  { question: "How many clients bought more than one product?", answer: "27", xp: 150, achievement: "Client Analyst", timeLimit: 40 },
  { question: "What's the most sold product by total sales?", answer: "Paper", xp: 200, achievement: "Product Expert", timeLimit: 30 },
  { question: "Who has the highest average sale amount?", answer: "Dwight Schrute", xp: 250, achievement: "Sales Champion", timeLimit: 25 }
];

// Load JSON data
async function loadData() {
  try {
    const [salesRes, quotesRes] = await Promise.all([
      fetch('data/dunder_mifflin_sales.json'),
      fetch('data/michael_quotes.json')
    ]);
    salesData = (await salesRes.json()).sales;
    quotesData = (await quotesRes.json()).quotes;

    // Update UI
    updateTable('sales', salesData.slice(0, 50));
    updateTable('quotes', quotesData.slice(0, 50));

    // Enable buttons
    document.getElementById("preview-data-btn").disabled = false;
    document.getElementById("start-game-btn").disabled = false;

  } catch (error) {
    console.error("Failed to load data:", error);
    alert("Failed to load data. Please refresh the page.");
  }
}

// Table rendering
function updateTable(tableName, data) {
  const table = document.getElementById(`${tableName}-table`);
  table.innerHTML = "";

  // Get headers
  const headers = Object.keys(data[0]);
  const headerRow = document.createElement("tr");
  headers.forEach(h => {
    const th = document.createElement("th");
    th.innerText = h;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // Add rows
  data.forEach(row => {
    const tr = document.createElement("tr");
    headers.forEach(h => {
      const td = document.createElement("td");
      td.innerText = row[h];
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
}

// Data preview functionality
function showDataPreview() {
  try {
    const previewDiv = document.getElementById('preview-tables');
    previewDiv.classList.remove('hidden');

    // Grouped Sales Preview
    const employeeSales = salesData.reduce((acc, sale) => {
      acc[sale.employee] = (acc[sale.employee] || 0) + 1;
      return acc;
    }, {});

    let html = "<h3>📊 Employee Sales Count</h3><table>";
    for (const emp in employeeSales) {
      html += `<tr><td>${emp}</td><td>${employeeSales[emp]}</td></tr>`;
    }
    html += "</table>";

    // Grouped Quotes Preview
    const characterQuotes = quotesData.reduce((acc, q) => {
      acc[q.character] = (acc[q.character] || 0) + 1;
      return acc;
    }, {});

    html += "<h3>📜 Character Quote Count</h3><table>";
    for (const char in characterQuotes) {
      html += `<tr><td>${char}</td><td>${characterQuotes[char]}</td></tr>`;
    }
    html += "</table>";

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
    }
  }, 1000);
});

// Play random correct sound
function playCorrectSound() {
  const correctSounds = [
    'assets/sounds/correct/correct1.mp3',
    'assets/sounds/correct/correct2.mp3'
  ];
  const randomSound = correctSounds[Math.floor(Math.random() * correctSounds.length)];
  new Audio(randomSound).play();
}

// Play random incorrect sound
function playIncorrectSound() {
  const incorrectSounds = [
    'assets/sounds/incorrect/wrong1.mp3',
    'assets/sounds/incorrect/wrong2.mp3'
  ];
  const randomSound = incorrectSounds[Math.floor(Math.random() * incorrectSounds.length)];
  new Audio(randomSound).play();
}

// Answer checking
document.getElementById("submit-answer").addEventListener("click", checkAnswer);

function checkAnswer() {
  const userAnswer = document.getElementById("final-answer").value.trim().toLowerCase();
  const correctAnswer = missions[currentMissionIndex].answer.toLowerCase();

  if (userAnswer === correctAnswer) {
    playCorrectSound(); // Play random correct sound
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
    playIncorrectSound(); // Play random incorrect sound
    document.getElementById("feedback").className = "feedback-error";
    document.getElementById("feedback").innerText = "❌ Incorrect. Try again!";
  }
}

// Fun elements
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

// Show achievement toast
function showAchievementToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
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
  loadData();
});
