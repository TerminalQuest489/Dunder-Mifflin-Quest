// ======================
// EVENT HANDLERS (ADD THIS SECTION BEFORE DOMContentLoaded)
// ======================
function setupEventListeners() {
  // Preview Data Button
  document.getElementById("preview-data-btn")?.addEventListener("click", showDataPreview);
  
  // Start Game Button
  document.getElementById("start-game-btn")?.addEventListener("click", startGame);
  
  // Mission Timer
  document.getElementById("start-mission-btn")?.addEventListener("click", () => {
    clearInterval(missionInterval);
    const mission = missions[currentMissionIndex];
    timeLeft = mission.timeLimit;
    
    const timeLeftElement = document.getElementById("time-left");
    const timerElement = document.getElementById("timer");
    const startMissionBtn = document.getElementById("start-mission-btn");
    const submitAnswer = document.getElementById("submit-answer");
    
    if (timeLeftElement) timeLeftElement.textContent = timeLeft;
    if (timerElement) timerElement.classList.remove("hidden");
    if (startMissionBtn) startMissionBtn.disabled = true;
    if (submitAnswer) submitAnswer.disabled = false;
    
    missionInterval = setInterval(() => {
      timeLeft--;
      if (timeLeftElement) timeLeftElement.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(missionInterval);
        if (submitAnswer) submitAnswer.disabled = true;
        if (startMissionBtn) startMissionBtn.disabled = false;
      }
    }, 1000);
  });

  // Answer Submission
  document.getElementById("submit-answer")?.addEventListener("click", () => {
    const finalAnswer = document.getElementById("final-answer");
    const feedback = document.getElementById("feedback");
    
    if (!finalAnswer || !feedback) return;
    
    const userAnswer = finalAnswer.value.trim().toLowerCase();
    const correctAnswer = missions[currentMissionIndex].answer.toLowerCase();

    if (userAnswer === correctAnswer) {
      feedback.className = "feedback-correct";
      feedback.innerHTML = `
        ✅ Correct! XP +${missions[currentMissionIndex].xp}<br>
        🎉 ${getRandomCelebration()}
      `;
      rewards.addXP(missions[currentMissionIndex].xp);
      
      setTimeout(() => {
        currentMissionIndex++;
        localStorage.setItem('currentMission', currentMissionIndex.toString());
        loadMission(currentMissionIndex);
        document.getElementById("start-mission-btn")?.disabled = false;
      }, 1500);
    } else {
      feedback.className = "feedback-error";
      feedback.textContent = "❌ Incorrect. Try again!";
    }
  });

  // SQL Input
  document.getElementById("query-input")?.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const userQuery = this.value.trim();
      const output = document.getElementById("feedback");
      if (!output) return;
      
      try {
        const result = db.exec(userQuery);
        output.className = "";
        output.innerHTML = result?.length 
          ? "<table>" + generateTableHTML(result) + "</table>"
          : "No results found.";
      } catch (error) {
        output.className = "";
        output.innerHTML = `<table><thead><tr><th>Error</th></tr></thead>
                          <tbody><tr><td>${error.message}</td></tr></tbody></table>`;
      }
    }
  });
}

// ======================
// INITIALIZATION (KEEP THIS AT THE BOTTOM)
// ======================
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners(); // Now this will work
  initDB();
});
