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
    achievement: "Sales Counting Rookie"
  },
  {
    question: "What's the total amount of sales made by Jim?",
    answer: "42675",
    xp: 100,
    achievement: "Sales Totals Master"
  },
  {
    question: "How many clients bought more than one product?",
    answer: "27",
    xp: 150,
    achievement: "Client Analyst"
  },
  {
    question: "What's the most sold product by total sales?",
    answer: "Paper",
    xp: 200,
    achievement: "Product Expert"
  },
  {
    question: "Who has the highest average sale amount?",
    answer: "Dwight Schrute",
    xp: 250,
    achievement: "Sales Champion"
  }
];

function loadMission(index) {
  if (index >= missions.length) {
    document.getElementById("mission-question").innerText = "🎉 You've completed all missions!";
    document.getElementById("submit-answer").disabled = true;
    return;
  }

  document.getElementById("mission-question").innerText = missions[index].question;
  document.getElementById("final-answer").value = "";
  document.getElementById("submit-answer").disabled = false;
  document.getElementById("query-input").disabled = false;
  document.getElementById("feedback").innerText = "";
}

document.getElementById("start-mission-btn").addEventListener("click", () => {
  const mission = missions[currentMissionIndex];
  timeLeft = mission.timeLimit || 60;
  document.getElementById("timer").classList.remove("hidden");

  missionInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("time-left").innerText = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(missionInterval);
      document.getElementById("submit-answer").disabled = true;
      document.getElementById("feedback").innerText = `⏰ Time's up! The correct answer was: ${mission.answer}`;
      showLearningLinks();
    }
  }, 1000);
});

document.getElementById("submit-answer").addEventListener("click", () => {
  const userAnswer = document.getElementById("final-answer").value.trim();
  const correctAnswer = missions[currentMissionIndex].answer;

  if (userAnswer === correctAnswer) {
    document.getElementById("feedback").innerText = `✅ Correct! ${missions[currentMissionIndex].question} Answer: ${correctAnswer}`;
    rewards.addXP(missions[currentMissionIndex].xp);

    setTimeout(() => {
      document.getElementById("feedback").innerText = "";
      currentMissionIndex++;
      loadMission(currentMissionIndex);
    }, 1000);

  } else {
    document.getElementById("feedback").innerText = `❌ Incorrect. Try again or check your query.`;
  }
});
