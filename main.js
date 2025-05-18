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
   
