// scripts/main.js

// UI 관련 함수 가져오기
import { 
  updateScoreUI, 
  updateLivesUI, 
  updateTimerUI, 
  updateQuestionUI 
} from "/scripts/ui.js";

// 사운드 관련 함수 가져오기
import { playHitSound, playWrongSound, playBackgroundMusic } from "/scripts/sound.js";

// 지역 초기화
const regions = [];
 // 필요한 경우 다른 지역 데이터를 추가

// ---------------------
// 게임 상태 변수
// ---------------------
let selectedRegion = localStorage.getItem("selectedRegion") || ""; // 선택된 지역
let currentRegion = null; // 현재 지역 데이터
let score = 0; // 현재 점수
let timeLeft = 120; // 남은 시간
let remainingLives = 3; // 남은 생명
let usedQuestions = []; // 사용된 문제 목록
let currentQuestion = null; // 현재 표시 중인 문제
let isWaiting = false; // 대기 상태
let activeHoles = []; // 활성화된 구멍
let moleTimer; // 두더지 타이머
let timerInterval = null; // ✅ 전역 변수로 선언
let gameActive = false; // ✅ 게임 진행 상태 변수 추가

// ---------------------
// DOM 요소 가져오기
// ---------------------
const regionDropdown = document.getElementById("region");
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
const holes = document.querySelectorAll(".hole");
const API_BASE = "https://whack-a-mole-game-3bqy.onrender.com";

// ---------------------
// 지역 데이터 및 설정
// ✅ region-001부터 region-050까지 선택 가능
// ✅ 사용자가 지역을 선택하면 해당 파일을 import()하여 동적으로 로드
// ✅ 해당 파일이 존재하지 않으면 region-001.js를 복사하여 자동 생성
// ✅ 자동 생성된 후 다시 로드하여 사용
// ---------------------
// ---------------------
// 지역 선택 드롭다운 초기화
// ---------------------
function initializeRegionDropdown() {
  const regionDropdown = document.getElementById("region");

  // ✅ 기존 옵션 제거 후 기본 옵션 추가
  regionDropdown.innerHTML = `<option value="">지역을 선택하세요</option>`;

  let validRegions = [];

  // ✅ Region 001 ~ Region 050 동적으로 생성
  for (let i = 1; i <= 50; i++) {
    const regionId = `region-${String(i).padStart(3, "0")}`;
    const option = document.createElement("option");
    option.value = regionId;
    option.textContent = `Region ${i}`;
    regionDropdown.appendChild(option);
    validRegions.push(regionId); // ✅ 유효한 지역 리스트 저장
  }

  // ✅ 저장된 지역 불러와서 선택 유지
  let savedRegion = localStorage.getItem("selectedRegion");
  console.log("🔍 로컬 저장소에서 불러온 지역:", savedRegion);

  // 🚨 저장된 지역이 유효하지 않다면 초기화
  if (!validRegions.includes(savedRegion)) {
    console.warn(`⚠️ ${savedRegion}는 유효한 지역이 아닙니다. 기본값으로 초기화.`);
    localStorage.removeItem("selectedRegion"); // 🚨 잘못된 값 제거
    savedRegion = ""; // 기본값으로 초기화
  }

  // ✅ 드롭다운 옵션이 생성된 후 적용 보장
  setTimeout(() => {
    if (savedRegion && document.querySelector(`option[value="${savedRegion}"]`)) {
      regionDropdown.value = savedRegion;
      console.log(`🎯 적용된 지역 값: ${regionDropdown.value}`);
    } else {
      console.warn("⚠️ 저장된 지역이 존재하지 않거나 옵션이 생성되지 않음.");
    }
  }, 100); // ✅ 옵션이 생성될 시간을 확보
}

// ✅ 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", () => {
  initializeRegionDropdown();
});

// 2️⃣ 사용자가 지역을 변경할 때 데이터 로드
document.getElementById("region").addEventListener("change", async (e) => {
  const selectedRegion = e.target.value;
  localStorage.setItem("selectedRegion", selectedRegion);
  console.log("🟢 새로운 지역 선택됨:", selectedRegion);

  // ✅ 선택된 지역 데이터 동적으로 불러오기
  const regionData = await loadRegionData(selectedRegion);

  if (regionData) {
    console.log(`✅ ${selectedRegion} 데이터 로드 완료:`, regionData);
  } else {
    console.warn(`⚠️ ${selectedRegion} 데이터 로드 실패`);
  }
});

// ✅ 지역 파일이 없을 경우 서버에서 자동 생성
// ✅ 지역 데이터를 API에서 가져오기
async function loadRegionData(regionId) {
  console.log(`🔍 불러올 지역 데이터: ${regionId}`);

  try {
    const response = await fetch(API_BASE + `/api/regions/${regionId}`);
    if (!response.ok) throw new Error("Failed to load region data");
    return await response.json();
  } catch (error) {
    console.error(`🚨 ${regionId} 데이터 불러오기 실패:`, error);
    return null;
  }
}



// ---------------------
// 지역 선택 드롭다운 초기화
// ---------------------
regions.forEach((region) => {
  const option = document.createElement("option");
  option.value = region.id;
  option.textContent = region.id;
  regionDropdown.appendChild(option);
});

if (selectedRegion) {
  regionDropdown.value = selectedRegion;
}

regionDropdown.addEventListener("change", (e) => {
  selectedRegion = e.target.value;
  localStorage.setItem("selectedRegion", selectedRegion);
});

// ---------------------
// 설정 및 인증 로직
// ---------------------
document.getElementById("settings-button").addEventListener("click", () => {
  homeScreen.style.display = "none";
  settingsScreen.style.display = "block";
});

document.getElementById("auth-submit").addEventListener("click", () => {
  const region = regions.find((r) => r.id === selectedRegion);
  const enteredPassword = document.getElementById("region-password").value;

  if (region && enteredPassword === region.password) {
    currentRegion = region;
    authSection.style.display = "none";
    settingsOptions.style.display = "block";
    document.getElementById("game-time").value = currentRegion.gameTime;
    document.getElementById("random-toggle").checked = currentRegion.randomizeQuestions;
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

// ---------------------
// 게임 로직
// ---------------------
// 1️⃣ startGame() 함수 안에서 지역 데이터 로드
async function startGame() {
  if (!selectedRegion) {
    alert("Please select a region before starting the game.");
    return;
  }

  console.log("🟢 선택된 지역:", selectedRegion);

  // ✅ 동적으로 지역 데이터 불러오기
  currentRegion = await loadRegionData(selectedRegion);

  // 🚨 여전히 currentRegion이 undefined이면 중단
  if (!currentRegion) {
    alert("Invalid region selected.");
    console.error("🚨 currentRegion is undefined after loading.");
    return;
  }

  console.log(`✅ ${selectedRegion} 데이터 로드 완료:`, currentRegion);

  homeScreen.style.display = "none";
  gameScreen.style.display = "block";
  gameActive = true;  // ✅ 게임이 시작됨을 표시

  score = 0;
  timeLeft = currentRegion.gameTime * 1000; // 밀리초 단위 변환
  remainingLives = 3;
  usedQuestions = [];
  currentQuestion = null;
  isWaiting = false;

  updateScoreUI(score);
  updateLivesUI(remainingLives);
  updateTimerUI(timeLeft);

  // ✅ 두더지 클릭 이벤트 다시 등록
  document.querySelectorAll(".mole").forEach((mole) => {
    mole.replaceWith(mole.cloneNode(true));
  });

  document.querySelectorAll(".mole").forEach((mole) => {
    mole.addEventListener("click", handleMoleClick);
  });

  showMoles();
  startTimer();
}



function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft -= 10; // ✅ 10ms 단위로 감소 (여기서 `--` 사용하면 1ms씩만 감소함)

    if (timeLeft <= 0 || remainingLives <= 0) {
      clearInterval(timerInterval);
      endGame();
    } else {
      updateTimerUI(timeLeft); // ✅ 실시간으로 밀리초 표시
    }
  }, 10); // ✅ 10ms마다 실행
}

function getQuestionByLevel() {
  const level = score < 1000 ? "level1" : "level2";
  const questions = currentRegion ? currentRegion.levels[level] : [];
  const available = questions.filter((q) => !usedQuestions.includes(q));

  if (available.length === 0) {
    usedQuestions = [];
    return getQuestionByLevel();
  }

  const selected = available[Math.floor(Math.random() * available.length)];
  usedQuestions.push(selected);
  return selected;
}

// 일정 시간 후 다음 두더지 표시
function scheduleNextMoles(delayMs) {
  resetAllMoles();
  setTimeout(() => {
    showMoles();
  }, delayMs);
}

// 두더지 + 문제 표시
function showMoles() {
  if (!gameActive) return; // ✅ 게임이 중단된 경우 실행 안 함
  clearTimeout(moleTimer);

  if (!currentQuestion) {
    currentQuestion = getQuestionByLevel();
    updateQuestionUI(currentQuestion.question, currentQuestion.emptySlot);
  }

  const numOfWrongs = score < 1000 ? 1 : 3; // 1단계: 1개 오답, 2단계: 3개 오답
  const allAnswers = [currentQuestion.correct, ...currentQuestion.wrong.slice(0, numOfWrongs)];
  const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5);

  resetAllMoles(); // 초기화

  const numMoles = score < 1000 ? 2 : 4; // 1단계: 2개, 2단계: 4개
  const availableHoles = score < 1000
    ? [holes[0], holes[1]] // 1단계: 1번, 2번 구멍
    : [holes[0], holes[1], holes[2], holes[3]]; // 2단계: 1번~4번 구멍

  for (let i = 0; i < numMoles; i++) {
    const randomHole = availableHoles.splice(Math.floor(Math.random() * availableHoles.length), 1)[0];
    const moleImg = randomHole.querySelector(".mole");
    const answerLabel = randomHole.querySelector(".answer-label");

    moleImg.src = "assets/mole.svg"; // 기본 이미지
    moleImg.dataset.answer = shuffledAnswers[i] || ""; // 정답/오답
    answerLabel.textContent = shuffledAnswers[i] || ""; // 정답/오답 표시
    randomHole.classList.add("active");
    activeHoles.push(randomHole);
  }

  // ✅ 두더지가 정상적으로 올라오는지 확인
  console.log("🟢 showMoles 실행됨 - 활성화된 두더지 개수:", activeHoles.length);

  // ✅ 클릭 이벤트 제거 후 다시 추가 (이중 등록 방지)
  document.querySelectorAll(".mole").forEach((mole) => {
    mole.removeEventListener("click", handleMoleClick);
    mole.addEventListener("click", handleMoleClick);
  });

  console.log("🟢 showMoles 실행됨 - .mole 클릭 이벤트 재등록 완료!");

  moleTimer = setTimeout(() => {
    scheduleNextMoles(500); // 0.5초 후 새 두더지 표시
  }, 5000); // 5초 후 초기화
}

// 모든 구멍 초기화 + 텍스트/이미지 복구
function resetAllMoles() {
  activeHoles.forEach((hole) => {
    hole.classList.remove("active");
    const moleImg = hole.querySelector(".mole");
    const answerLabel = hole.querySelector(".answer-label");
    moleImg.src = "assets/mole.svg"; // 기본 이미지로 초기화
    moleImg.dataset.answer = ""; // 데이터 초기화
    answerLabel.textContent = ""; // 텍스트 초기화
  });
  activeHoles = [];
}

// ---------------------
// 정답/오답 처리 (두더지 클릭)
// ---------------------
function handleMoleClick(event) {
  if (isWaiting) return;  // ❌ 클릭 무시됨!
  isWaiting = true;       // ✅ 클릭하면 대기 상태로 변경
  clearTimeout(moleTimer);

  const mole = event.target;
  const answer = mole.dataset.answer;

  if (answer === currentQuestion.correct) {
    // 정답
    score += 100;
    updateScoreUI(score);
    mole.src = "assets/correct.svg";
    playHitSound();

    // 2초 뒤 새 문제
    setTimeout(() => {
      resetAllMoles();
      currentQuestion = null;
      isWaiting = false; // ⬅️ 여기서 다시 false로 변경해야 클릭 가능!
      scheduleNextMoles(500);
    }, 2000);
  } else {
    // 오답
    remainingLives--;
    updateLivesUI(remainingLives);
    mole.src = "assets/wrong.svg";
    playWrongSound();

    if (remainingLives <= 0) {
      endGame();
      return;
    }
    // 2초 뒤 동일 문제 유지
    setTimeout(() => {
      resetAllMoles();
      isWaiting = false; // ⬅️ 여기서 다시 false로 변경!
      scheduleNextMoles(500);
    }, 2000);
  }
  // 클릭한 두더지 텍스트 제거
  mole.parentElement.querySelector(".answer-label").textContent = "";
}

function endGame() {
  gameScreen.style.display = "none";
  endScreen.style.display = "block";
  document.getElementById("final-score").textContent = `Your Score: ${score}`;
}

function handlePlayAgain() {
  // ✅ 1. end-screen 숨기기
  document.getElementById("end-screen").style.display = "none";

  // ✅ 2. 게임 상태 초기화
  score = 0;
  remainingLives = 3;
  timeLeft = 120;
  usedQuestions = [];
  currentQuestion = null;

  // ✅ 3. 2단계용 hole-3, hole-4 숨김 (1단계로 돌아가기 때문)
  document.getElementById("hole-3").classList.add("hidden");
  document.getElementById("hole-4").classList.add("hidden");

  // ✅ 4. 기존 두더지 초기화
  resetAllMoles();

  // ✅ 두더지 클릭 이벤트를 제거 후 다시 추가
  document.querySelectorAll(".mole").forEach((mole) => {
    mole.removeEventListener("click", handleMoleClick);
    mole.addEventListener("click", handleMoleClick);
  });

  console.log("✅ Play Again 클릭 - .mole 클릭 이벤트 재등록 완료!");

  // ✅ 6. 다시 시작
  startGame();
}

function handleGoHome() {
  console.log("🏠 Go Home 버튼 클릭됨 - 게임 종료 및 초기화!");

  gameActive = false;  // ✅ 게임 중단 처리

  // ✅ 실행 중인 타이머 정지
  if (typeof timerInterval !== "undefined") {
    clearInterval(timerInterval);
    console.log("✅ timerInterval 정지 완료");
  } else {
    console.warn("⚠️ timerInterval이 존재하지 않음");
  }

  if (typeof moleTimer !== "undefined") {
    clearTimeout(moleTimer);
    console.log("✅ moleTimer 정지 완료");
  } else {
    console.warn("⚠️ moleTimer이 존재하지 않음");
  }

  // ✅ UI 변경: 홈 화면으로 이동
  document.getElementById("end-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "none";
  document.getElementById("home-screen").style.display = "block";

  // ✅ 게임 상태 초기화
  score = 0;
  remainingLives = 3;
  timeLeft = 120;
  usedQuestions = [];
  currentQuestion = null;
  isWaiting = false; // 클릭 제한 해제

  // ✅ 두더지 초기화 (화면에서 제거)
  resetAllMoles();

  console.log("✅ 게임 상태 및 타이머 초기화 완료");
}

// Event Listeners
holes.forEach((hole) => {
  const mole = hole.querySelector(".mole");
  mole.addEventListener("click", handleMoleClick);
});

document.addEventListener("click", (event) => {
  if (event.target.id === "start-button") {
    startGame();
  } else if (event.target.id === "go-home-button") {
    handleGoHome();
  } else if (event.target.id === "restart-button") {
    handlePlayAgain();
  } else if (event.target.id === "home-button") {
    handleGoHome(); // 홈 버튼 클릭 시 홈 화면으로 이동
  }  
});

function populateRegionDropdown() {
  const regionDropdown = document.getElementById("region");
  regionDropdown.innerHTML = ""; // 기존 옵션 초기화

  // ✅ 기본 안내 옵션 추가
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "지역을 선택하세요";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  regionDropdown.appendChild(defaultOption);

  // ✅ 실제 지역 옵션 추가
  for (let i = 1; i <= 50; i++) {
    const regionId = `region-${String(i).padStart(3, "0")}`;
    const option = document.createElement("option");
    option.value = regionId;
    option.textContent = `Region ${String(i).padStart(3, "0")}`;
    regionDropdown.appendChild(option);
  }
}

// ✅ 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", populateRegionDropdown);
