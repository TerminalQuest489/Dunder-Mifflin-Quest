let db;
let currentMissionIndex = parseInt(localStorage.getItem('currentMission')) || 0;
let timeLeft = 0;
let missionInterval;

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
  }
};

// Game missions
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

// Database initialization
async function initDB() {
  try {
    const SQL = await initSqlJs({
      locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@0.8.0/dist/${file}`
    });

    db = new SQL.Database();

    // Create sample data
    const salesData = {
      sales: [
        {employee: "Dwight", product: "Paper", amount: 500, client: "AAA Paper"},
        {employee: "Jim", product: "Printer", amount: 300, client: "Dunder Corp"},
        {employee: "Dwight", product: "Stapler", amount: 45, client: "Staples Inc"},
        {employee: "Pam", product: "Notebooks", amount: 120, client: "Office Dreams"},
        {employee: "Dwight", product: "Paper", amount: 750, client: "Paper World"}
      ]
    };
    
    const quotesData = {
      quotes: [
        {character: "Michael", quote: "That's what she said!", season: 2},
        {character: "Dwight", quote: "Bears. Beets. Battlestar Galactica.", season: 3},
        {character: "Michael", quote: "I'm not superstitious, but I am a little stitious.", season: 4},
        {character: "Jim", quote: "Bears do not... What is going on?! What are you doing?!", season: 3},
        {character: "Michael", quote: "Would I rather be feared or loved? Easy. Both.", season: 2}
      ]
    };

    // Create tables
    db.run("CREATE TABLE sales (employee TEXT, product TEXT, amount INTEGER, client TEXT)");
    salesData.sales.forEach(row => {
      db.run(`INSERT INTO sales VALUES (?, ?, ?, ?)`, 
        [row.employee, row.product, row.amount, row.client]);
    });

    db.run("CREATE TABLE quotes (character TEXT, quote TEXT, season INTEGER)");
    quotesData.quotes.forEach(row => {
      db.run(`INSERT INTO quotes VALUES (?, ?, ?)`, 
        [row
