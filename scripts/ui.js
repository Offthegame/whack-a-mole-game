// 점수 업데이트
export function updateScoreUI(score) {
    const scoreDisplay = document.getElementById("score");
    scoreDisplay.textContent = `Score: ${score}`;
  }
  
  // 생명 업데이트
  export function updateLivesUI(remainingLives) {
    const livesDisplay = document.getElementById("lives");
    livesDisplay.textContent = `Lives: ${remainingLives}`;
  }
  
  // 타이머 업데이트
  export function updateTimerUI(timeLeft) {
    const timerDisplay = document.getElementById("timer");
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `Time Left: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }
  
  // 문제 표시 업데이트
  export function updateQuestionUI(questionText, emptySlot) {
    const questionDisplay = document.getElementById("question");
  
    // (빈칸)을 <img> 태그로 대체
    const formattedQuestion = questionText.replace(
      "(빈칸)",
      `<img src="${emptySlot}" alt="empty slot" class="empty-slot">`
    );
  
    // DOM에 HTML로 업데이트
    questionDisplay.innerHTML = formattedQuestion;
  }
  
  // 화면 전환 (Intro → Game)
  export function showGameScreen() {
    document.getElementById("intro-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
  }
  
  // 화면 전환 (Game → End)
  export function showEndScreen(finalScore) {
    document.getElementById("game-screen").style.display = "none";
    document.getElementById("end-screen").style.display = "block";
    const finalScoreDisplay = document.getElementById("final-score");
    finalScoreDisplay.textContent = `Your Score: ${finalScore}`;
  }
  
  // 화면 전환 (End → Intro)
  export function showIntroScreen() {
    document.getElementById("end-screen").style.display = "none";
    document.getElementById("intro-screen").style.display = "block";
  }
  
  // 화면 초기화
  export function resetUI() {
    updateScoreUI(0); // 점수 초기화
    updateLivesUI(3); // 생명 초기화
    updateTimerUI(120); // 타이머 초기화 (2분)
    updateQuestionUI(""); // 문제 초기화
  }

