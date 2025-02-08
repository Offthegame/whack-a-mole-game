// scripts/main.js

// ======================
// 1. Imports
// ======================
import { 
  updateScoreUI, 
  updateLivesUI, 
  updateTimerUI, 
  updateQuestionUI 
} from "/scripts/ui.js";

import { playHitSound, playWrongSound, playBackgroundMusic } from "/scripts/sound.js";

// ======================
// 2. Global Variables & Game State
// ======================
const API_BASE = "https://whack-a-mole-game-3bqy.onrender.com";

// 게임 관련 상태 변수
let selectedRegion = localStorage.getItem("selectedRegion") || "";
let currentRegion = null;
let score = 0;
let timeLeft = 120; // 기본값 (게임 시작 시 currentRegion.gameTime으로 갱신)
let remainingLives = 3;
let usedQuestions = [];
let currentQuestion = null;
let isWaiting = false;
let activeHoles = [];
let moleTimer;       // 두더지 타이머
let timerInterval = null; // 메인 타이머
let gameActive = false;   // 게임 진행 상태

// ======================
// 3. DOM Elements
// ======================
const homeScreen = document.getElementById("home-screen");
const gameScreen = document.getElementById("game-screen");
const endScreen = document.getElementById("end-screen");
const settingsScreen = document.getElementById("settings-screen");
const authSection = document.getElementById("auth-section");
const settingsOptions = document.getElementById("settings-options");

const questionElement = document.getElementById("question");
const timerElement = document.getElementById("timer");
const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");

const regionDropdown = document.getElementById("region");
const settingsDropdown = document.getElementById("settings-region"); // Admin 화면의 드롭다운
const holes = document.querySelectorAll(".hole");

// ======================
// 4. Region Data & Dropdown Population
// ======================

/**
 * 지역 선택 드롭다운을 초기화한다.
 */
function populateRegionDropdown() {
  regionDropdown.innerHTML = "";
  settingsDropdown.innerHTML = "";

  // 기본 안내 옵션 추가
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "지역을 선택하세요";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  regionDropdown.appendChild(defaultOption.cloneNode(true));
  settingsDropdown.appendChild(defaultOption.cloneNode(true));

  // Region 001 ~ Region 050 옵션 추가
  const validRegions = [];
  for (let i = 1; i <= 50; i++) {
    const regionId = `region-${String(i).padStart(3, "0")}`;
    const regionName = `Region ${String(i).padStart(3, "0")}`;
    const regionPassword = `pass${String(i).padStart(3, "0")}`; // 새로운 번호에 맞는 비밀번호

    // 옵션 생성
    const option = document.createElement("option");
    option.value = regionId;
    option.textContent = regionName;
    // 필요에 따라 비밀번호도 data-attribute로 저장 (설정 화면에서 인증할 때 사용 가능)
    option.setAttribute("data-password", regionPassword);

    regionDropdown.appendChild(option.cloneNode(true));
    settingsDropdown.appendChild(option.cloneNode(true));
    validRegions.push(regionId);
  }

  // 저장된 지역이 유효하면 선택 상태 유지
  const savedRegion = localStorage.getItem("selectedRegion");
  if (savedRegion && validRegions.includes(savedRegion)) {
    regionDropdown.value = savedRegion;
    settingsDropdown.value = savedRegion;
    console.log(`🎯 적용된 지역: ${savedRegion}`);
  } else if (savedRegion) {
    console.warn(`⚠️ ${savedRegion}는 유효하지 않으므로 초기화.`);
    localStorage.removeItem("selectedRegion");
  }
}

/**
 * 선택된 지역 데이터(지역 설정)를 API에서 동적으로 불러온다.
 * @param {string} regionId 
 * @returns {Object|null} 지역 데이터(JSON) 또는 null
 */
async function loadRegionData(regionId) {
  console.log(`🔍 지역 데이터 로드: ${regionId}`);
  try {
    const response = await fetch(`${API_BASE}/api/regions/${regionId}`);
    if (!response.ok) throw new Error("Failed to load region data");
    return await response.json();
  } catch (error) {
    console.error(`🚨 ${regionId} 데이터 불러오기 실패:`, error);
    return null;
  }
}

// ======================
// 5. Settings & Authentication
// ======================

/**
 * 비밀번호 토글 (표시/숨김)
 */
// scripts/main.js
function togglePassword() {
  const passwordInput = document.getElementById("region-password");
  const toggleIcon = document.querySelector(".toggle-password");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleIcon.textContent = "🙈";
  } else {
    passwordInput.type = "password";
    toggleIcon.textContent = "👁️";
  }
}

// 전역 객체(window)에 할당
window.togglePassword = togglePassword;

// 지역 변경 시 로컬 저장소에 업데이트
regionDropdown.addEventListener("change", async (e) => {
  selectedRegion = e.target.value;
  localStorage.setItem("selectedRegion", selectedRegion);
  console.log("🟢 새로운 지역 선택됨:", selectedRegion);
  // 미리 데이터를 불러오고, 콘솔에서 확인
  const regionData = await loadRegionData(selectedRegion);
  if (regionData) {
    console.log(`✅ ${selectedRegion} 데이터 로드 완료:`, regionData);
  } else {
    console.warn(`⚠️ ${selectedRegion} 데이터 로드 실패`);
  }
});

// 설정 화면 관련 이벤트
document.getElementById("settings-button").addEventListener("click", () => {
  homeScreen.style.display = "none";
  settingsScreen.style.display = "block";
});

document.getElementById("auth-submit").addEventListener("click", () => {
  // 현재 지역 데이터는 API로 불러온 데이터가 아닌 로컬 regions 배열(예시)에서 찾는 것으로 보임
  // 필요에 따라 currentRegion을 loadRegionData() 결과로 설정하도록 변경 가능
  const region = currentRegion; // 또는 regions 배열에서 찾을 수도 있음
  const enteredPassword = document.getElementById("region-password").value;
  if (region && enteredPassword === region.password) {
    authSection.style.display = "none";
    settingsOptions.style.display = "block";
    document.getElementById("game-time").value = region.gameTime;
    document.getElementById("random-toggle").checked = region.randomizeQuestions;
  } else {
    document.getElementById("auth-error").style.display = "block";
  }
});

document.getElementById("save-settings").addEventListener("click", () => {
  if (currentRegion) {
    currentRegion.gameTime = parseInt(document.getElementById("game-time").value, 10);
    currentRegion.randomizeQuestions = document.getElementById("random-toggle").checked;
    alert("Settings saved successfully!");
  }
});

document.getElementById("back-to-home").addEventListener("click", () => {
  settingsScreen.style.display = "none";
  homeScreen.style.display = "block";
});

// ======================
// 6. Game Logic & Functions
// ======================

/**
 * 게임 시작 함수
 */
async function startGame() {
  if (!selectedRegion) {
    alert("Please select a region before starting the game.");
    return;
  }

  console.log("🟢 선택된 지역:", selectedRegion);
  currentRegion = await loadRegionData(selectedRegion);
  if (!currentRegion) {
    alert("Invalid region selected.");
    console.error("🚨 currentRegion is undefined after loading.");
    return;
  }
  console.log(`✅ ${selectedRegion} 데이터 로드 완료:`, currentRegion);

  // 화면 전환 및 초기 상태 설정
  homeScreen.style.display = "none";
  gameScreen.style.display = "block";
  gameActive = true;
  score = 0;
  timeLeft = currentRegion.gameTime * 1000; // ms 단위
  remainingLives = 3;
  usedQuestions = [];
  currentQuestion = null;
  isWaiting = false;

  updateScoreUI(score);
  updateLivesUI(remainingLives);
  updateTimerUI(timeLeft);

  // 두더지 클릭 이벤트 재설정 (이중 등록 방지)
  document.querySelectorAll(".mole").forEach((mole) => {
    mole.replaceWith(mole.cloneNode(true));
  });
  document.querySelectorAll(".mole").forEach((mole) => {
    mole.addEventListener("click", handleMoleClick);
  });

  showMoles();
  startTimer();
}

/**
 * 메인 타이머 시작
 */
function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft -= 10; // 10ms 간격
    if (timeLeft <= 0 || remainingLives <= 0) {
      clearInterval(timerInterval);
      endGame();
    } else {
      updateTimerUI(timeLeft);
    }
  }, 10);
}

/**
 * 기존 level 기반 선택 함수를 새로운 질문 배열을 사용하는 함수로 변경
 * 각 질문은 고유 id를 가지고 있다고 가정 (데이터 수정 참고)
 */
function getQuestion() {
  const questions = currentRegion ? currentRegion.questions : [];
  const available = questions.filter(q => !usedQuestions.includes(q.id));
  if (available.length === 0) {
    usedQuestions = [];
    return getQuestion();
  }
  const selected = available[Math.floor(Math.random() * available.length)];
  usedQuestions.push(selected.id);
  return selected;
}

/**
 * 활성 두더지 초기화 후 delayMs 후에 새 두더지를 표시
 * @param {number} delayMs 
 */
function scheduleNextMoles(delayMs) {
  resetAllMoles();
  setTimeout(() => {
    showMoles();
  }, delayMs);
}

/**
 * 두더지를 화면에 표시하고 문제(정답/오답)를 할당
 * 구멍의 개수는 현재 문제의 오답 개수에 따라 결정된다.
 * (정답 1개 + 오답 배열 길이 만큼 총 답안 개수)
 */
function showMoles() {
  if (!gameActive) return;
  clearTimeout(moleTimer);

  // 아직 문제가 없다면 새 질문 생성 (getQuestion() 사용)
  if (!currentQuestion) {
    currentQuestion = getQuestion();
    updateQuestionUI(currentQuestion.question, currentQuestion.emptySlot);
  }

  // 총 답안 개수: 정답 1개 + 오답 배열 길이
  const totalAnswers = 1 + currentQuestion.wrong.length;
  const allAnswers = [currentQuestion.correct, ...currentQuestion.wrong];
  const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5);

  resetAllMoles();

  // 구멍의 수는 totalAnswers에 따라 결정 (예: 2개 또는 4개)
  const numMoles = totalAnswers;
  // DOM에 정의된 구멍이 순서대로 배치되어 있다고 가정하고, 
  // 필요한 개수만큼 slice()로 선택 (예: 질문에 따라 처음 2개 또는 4개 사용)
  const availableHoles = Array.from(holes).slice(0, numMoles);

  for (let i = 0; i < numMoles; i++) {
    const randomHole = availableHoles.splice(Math.floor(Math.random() * availableHoles.length), 1)[0];
    const moleImg = randomHole.querySelector(".mole");
    const answerLabel = randomHole.querySelector(".answer-label");

    moleImg.src = "assets/mole.svg";
    moleImg.dataset.answer = shuffledAnswers[i] || "";
    answerLabel.textContent = shuffledAnswers[i] || "";
    randomHole.classList.add("active");
    activeHoles.push(randomHole);
  }

  // 두더지 클릭 이벤트 재설정 (이중 등록 방지)
  document.querySelectorAll(".mole").forEach((mole) => {
    mole.removeEventListener("click", handleMoleClick);
    mole.addEventListener("click", handleMoleClick);
  });

  console.log("🟢 showMoles: 활성 두더지 개수:", activeHoles.length);

  moleTimer = setTimeout(() => {
    scheduleNextMoles(500);
  }, 5000);
}

/**
 * 모든 구멍을 초기 상태로 복원
 */
function resetAllMoles() {
  activeHoles.forEach((hole) => {
    hole.classList.remove("active");
    const moleImg = hole.querySelector(".mole");
    const answerLabel = hole.querySelector(".answer-label");
    moleImg.src = "assets/mole.svg";
    moleImg.dataset.answer = "";
    answerLabel.textContent = "";
  });
  activeHoles = [];
}

/**
 * 두더지 클릭 시 정답/오답을 처리
 */
function handleMoleClick(event) {
  if (isWaiting) return;
  isWaiting = true;
  clearTimeout(moleTimer);

  const mole = event.target;
  const answer = mole.dataset.answer;

  if (answer === currentQuestion.correct) {
    // 정답 처리
    score += 100;
    updateScoreUI(score);
    mole.src = "assets/correct.svg";
    playHitSound();

    setTimeout(() => {
      resetAllMoles();
      currentQuestion = null;
      isWaiting = false;
      scheduleNextMoles(500);
    }, 2000);
  } else {
    // 오답 처리
    remainingLives--;
    updateLivesUI(remainingLives);
    mole.src = "assets/wrong.svg";
    playWrongSound();

    if (remainingLives <= 0) {
      endGame();
      return;
    }
    setTimeout(() => {
      resetAllMoles();
      isWaiting = false;
      scheduleNextMoles(500);
    }, 2000);
  }
  // 클릭한 두더지의 텍스트 제거
  mole.parentElement.querySelector(".answer-label").textContent = "";
}

/**
 * 게임 종료 후 엔드 스크린 표시
 */
function endGame() {
  clearInterval(timerInterval);
  gameActive = false;
  gameScreen.style.display = "none";
  endScreen.style.display = "block";
  document.getElementById("final-score").textContent = `Your Score: ${score}`;
}

/**
 * Play Again 버튼 클릭 시 게임 초기화 및 재시작
 */
function handlePlayAgain() {
  endScreen.style.display = "none";
  score = 0;
  remainingLives = 3;
  timeLeft = currentRegion ? currentRegion.gameTime * 1000 : 120000;
  usedQuestions = [];
  currentQuestion = null;
  isWaiting = false;

  // 2단계에서 사용한 구멍 숨김 (필요한 경우)
  document.getElementById("hole-3")?.classList.add("hidden");
  document.getElementById("hole-4")?.classList.add("hidden");

  resetAllMoles();

  document.querySelectorAll(".mole").forEach((mole) => {
    mole.removeEventListener("click", handleMoleClick);
    mole.addEventListener("click", handleMoleClick);
  });

  console.log("✅ Play Again: 두더지 클릭 이벤트 재등록 완료!");
  startGame();
}

/**
 * Go Home 버튼 클릭 시 홈 화면으로 복귀하고 게임 상태 초기화
 */
function handleGoHome() {
  console.log("🏠 Go Home 버튼 클릭 - 게임 종료 및 초기화!");
  gameActive = false;
  clearInterval(timerInterval);
  clearTimeout(moleTimer);

  endScreen.style.display = "none";
  gameScreen.style.display = "none";
  homeScreen.style.display = "block";

  score = 0;
  remainingLives = 3;
  timeLeft = 120;
  usedQuestions = [];
  currentQuestion = null;
  isWaiting = false;
  resetAllMoles();
}

// ======================
// 7. Global Event Listeners
// ======================

// start, restart, go-home, home 버튼 클릭 이벤트 위임
document.addEventListener("click", (event) => {
  const { id } = event.target;
  if (id === "start-button") {
    startGame();
  } else if (id === "restart-button") {
    handlePlayAgain();
  } else if (id === "go-home-button" || id === "home-button") {
    handleGoHome();
  }
});

// 초기 두더지 클릭 이벤트 등록
holes.forEach((hole) => {
  const mole = hole.querySelector(".mole");
  mole.addEventListener("click", handleMoleClick);
});

// ======================
// 8. DOMContentLoaded 초기화
// ======================
document.addEventListener("DOMContentLoaded", () => {
  populateRegionDropdown();
});