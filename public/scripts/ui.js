// UI 업데이트 관련 코드

// 점수 업데이트
export function updateScoreUI(score) {
  document.getElementById("score").textContent = `${score}점`;
}

// 생명 업데이트
export function updateLivesUI(remainingLives) {
  const livesContainer = document.getElementById("lives-container");
  livesContainer.innerHTML = "";
  for (let i = 0; i < remainingLives; i++) {
    const lifeImg = document.createElement("img");
    lifeImg.src = "assets/life.webp";
    lifeImg.classList.add("life-icon");
    livesContainer.appendChild(lifeImg);
  }
}

// 타이머 업데이트
export function updateTimerUI(timeLeft) {
  const timerDisplay = document.getElementById("timer");
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  timerDisplay.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}


// ---------------------
// 문제 표시 업데이트
// ---------------------
export function updateQuestionUI(questionText, emptySlot) {
  const questionDisplay = document.getElementById("question");

  // "(빈칸)"을 <img> 태그로 대체
  const formattedQuestion = questionText.replace(
    "(빈칸)",
    `<img src="${emptySlot}" alt="empty slot" class="empty-slot">`
  );

  // DOM에 HTML로 업데이트
  questionDisplay.innerHTML = formattedQuestion;
}

// ---------------------
// 화면 전환 (Intro → Game)
// ---------------------
export function showGameScreen() {
  document.getElementById("intro-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
}

// ---------------------
// 화면 전환 (Game → End)
// ---------------------
export function showEndScreen(finalScore) {
  document.getElementById("game-screen").style.display = "none";
  document.getElementById("end-screen").style.display = "block";
  document.getElementById("final-score").textContent = `Your Score: ${finalScore}`;

  // ✅ 버튼이 존재하는지 체크
  const playAgainButton = document.getElementById("restart-button");

  if (!playAgainButton) {
    console.error("🚨 restart-button not found!");
    return;
  }

  playAgainButton.removeEventListener("click", handlePlayAgain); // 중복 방지
  playAgainButton.addEventListener("click", handlePlayAgain);
}


// ---------------------
// 화면 전환 (End → Intro)
// ---------------------
export function showIntroScreen() {
  document.getElementById("end-screen").style.display = "none";
  document.getElementById("intro-screen").style.display = "block";
}

// ---------------------
// 화면 초기화
// ---------------------
export function resetUI() {
  updateScoreUI(0); // 점수 초기화
  updateLivesUI(3); // 생명 초기화
  updateTimerUI(120); // 타이머 초기화 (2분)
  updateQuestionUI(""); // 문제 초기화
}

// ---------------------
// 지역 선택 초기화
// ---------------------
export function updateRegionDropdown(regions, selectedRegion) {
  const regionDropdown = document.getElementById("region");
  regionDropdown.innerHTML = ""; // 기존 옵션 초기화

  regions.forEach((region) => {
    const option = document.createElement("option");
    option.value = region.id;
    option.textContent = region.id;
    regionDropdown.appendChild(option);
  });

  if (selectedRegion) {
    regionDropdown.value = selectedRegion; // 저장된 지역 선택
  }
}

// ---------------------
// 설정 화면 업데이트
// ---------------------
export function updateSettingsUI(region) {
  if (region) {
    document.getElementById("game-time").value = region.gameTime; // 게임 시간
    document.getElementById("random-toggle").checked = region.randomizeQuestions; // 랜덤화 여부
  }
}
