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

let selectedRegion = localStorage.getItem("selectedRegion") || "";
let currentRegion = null;
let score = 0;
let timeLeft = 120; // 기본값 (게임 시작 시 currentRegion.gameTime으로 갱신)
let remainingLives = 3;
let usedQuestions = [];
let currentQuestion = null;
let isWaiting = false;
let activeHoles = [];
let moleTimer;           // 두더지 타이머
let timerInterval = null; // 메인 타이머
let gameActive = false;   // 게임 진행 상태
let startX = 0, endX = 0;

// ======================
// 3. DOM Elements
// ======================
const homeScreen = document.getElementById("home-screen");
const gameScreen = document.getElementById("game-screen");
const endScreen = document.getElementById("end-screen");
const linktreeScreen = document.getElementById("linktree-screen");
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


// 로딩 화면 표시
function showLoading() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.style.display = "flex";
  }
}

// 로딩 화면 숨김
function hideLoading() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.style.display = "none";
  }
}

async function populateRegionDropdown() {
  showLoading(); // 드롭다운 데이터 로딩 시작 시 로딩 오버레이 표시
  try {
    // API에서 모든 지역 데이터를 불러오기 시도
    const response = await fetch(`${API_BASE}/api/regions`);
    let regions = [];
    if (response.ok) {
      regions = await response.json();
    }
  
    // 지역 데이터가 없으면 기본 옵션 생성 (region-001 ~ region-050)
    if (!regions || regions.length === 0) {
      console.warn("지역 데이터 없음. 기본 옵션(region-001 ~ region-050) 생성.");
      regions = [];
      for (let i = 1; i <= 50; i++) {
        const regionId = `region-${String(i).padStart(3, "0")}`;
        regions.push({
          id: regionId,
          name: `Region ${String(i).padStart(3, "0")}`,
          password: `pass${String(i).padStart(3, "0")}`,
          // 필요 시 다른 기본 필드 추가
        });
      }
    }
  
    // 드롭다운 초기화
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
  
    // API에서 받아온(또는 기본 생성한) 지역 데이터를 기반으로 옵션 추가
    regions.forEach(region => {
      const option = document.createElement("option");
      option.value = region.id;
      option.textContent = region.name;
      option.setAttribute("data-password", region.password);
      regionDropdown.appendChild(option.cloneNode(true));
      settingsDropdown.appendChild(option.cloneNode(true));
    });
  
    // 저장된 지역이 있으면 선택 상태 유지
    const savedRegion = localStorage.getItem("selectedRegion");
    if (savedRegion && regions.some(r => r.id === savedRegion)) {
      regionDropdown.value = savedRegion;
      settingsDropdown.value = savedRegion;
      console.log(`🎯 적용된 지역: ${savedRegion}`);
    } else if (savedRegion) {
      console.warn(`⚠️ ${savedRegion}는 유효하지 않으므로 초기화.`);
      localStorage.removeItem("selectedRegion");
    }
  } catch (error) {
    console.error("지역 데이터를 불러오는 데 실패했습니다.", error);
  } finally {
    hideLoading(); // 로딩 작업 종료 후 오버레이 숨김
  }
}

/**
 * 선택된 지역 데이터(지역 설정)를 API에서 불러온다.
 * 데이터가 없으면 region-001을 기반으로 새 데이터를 생성한다.
 * @param {string} regionId 
 * @returns {Object|null}
 */
async function loadRegionData(regionId) {
  console.log(`🔍 지역 데이터 로드: ${regionId}`);
  showLoading();  // 데이터 불러오기 시작 전 로딩 화면 표시
  try {
    const response = await fetch(`${API_BASE}/api/regions/${regionId}`);
    if (!response.ok) throw new Error("🚨 데이터 없음: 새로 생성 필요");
    return await response.json();
  } catch (error) {
    console.warn(`⚠️ ${regionId} 데이터 없음. region-000을 기반으로 새로 생성.`);
    const defaultResponse = await fetch(`${API_BASE}/api/regions/region-000`);
    if (!defaultResponse.ok) {
      console.error("🚨 기본 지역(region-000) 데이터를 불러올 수 없음.");
      return null;
    }
    const defaultData = await defaultResponse.json();
    // 여기서 _id를 제거하고 새 데이터를 생성
    const { _id, ...defaultDataWithoutId } = defaultData;

    // 새로운 지역 데이터 구성
    const newRegionData = {
      ...defaultDataWithoutId,
      id: regionId,
      name: `Region ${regionId.split("-")[1]}`,
      password: `pass${regionId.split("-")[1]}`,
      questions: defaultDataWithoutId.questions.map((q, index) => ({
        ...q,
        id: `q${index + 1}`,
        question: q.question.replace("철수가", "지수가"),
      })),
    };

    // 새 지역 데이터 저장 요청
    await fetch(`${API_BASE}/save-region`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRegionData),
    });

    console.log(`✅ ${regionId} 생성 완료! 다시 로드 시도.`);
    await new Promise((resolve) => setTimeout(resolve, 500)); // 서버 반영 대기

    try {
      const newResponse = await fetch(`${API_BASE}/api/regions/${regionId}`);
      if (!newResponse.ok) throw new Error(`🚨 ${regionId} 생성 후 로드 실패.`);
      return await newResponse.json();
    } catch (err) {
      console.error(`🚨 ${regionId} 최종 로드 실패:`, err);
      return null;
    }
  } finally {
    hideLoading();  // 데이터 불러오기 완료 후 로딩 화면 숨김
  }
}

/**
 * 새로운 지역을 서버에 저장하는 함수
 */
async function saveNewRegion(regionId) {
  showLoading(); // 로딩 화면 표시
  try {
    const defaultResponse = await fetch(`${API_BASE}/api/regions/region-000`);
    if (!defaultResponse.ok) {
      console.error("🚨 기본 지역 데이터를 가져오지 못함.");
      return null;
    }
    const defaultData = await defaultResponse.json();
    const { _id, ...defaultDataWithoutId } = defaultData;  // _id 제거

    const newRegionData = {
      ...defaultDataWithoutId,
      id: regionId,
      name: `Region ${regionId.split("-")[1]}`,
      password: `pass${regionId.split("-")[1]}`,
      questions: defaultDataWithoutId.questions.map((q, index) => ({
        ...q,
        id: `q${index + 1}`,
        question: q.question.replace("철수가", "지수가"),
      })),
    };

    const response = await fetch(`${API_BASE}/save-region`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRegionData),
    });

    if (!response.ok) {
      throw new Error(`🚨 서버 응답 오류: ${response.statusText}`);
    }
    console.log(`✅ ${regionId} 저장 성공!`);
    return await response.json();
  } catch (error) {
    console.error("🚨 지역 저장 실패:", error);
    return null;
  } finally {
    hideLoading(); // 작업 완료 후 로딩 화면 숨김
  }
}


/**
 * 홈/설정 화면의 지역 드롭다운 변경 이벤트 핸들러
 */
document.querySelectorAll("#home-region, #settings-region").forEach((dropdown) => {
  dropdown.addEventListener("change", async (e) => {
    const selected = e.target.value;
    localStorage.setItem("selectedRegion", selected);
    console.log("🟢 새로운 지역 선택됨:", selected);

    // 선택된 지역 데이터 불러오기
    let regionData = await loadRegionData(selected);
    if (!regionData) {
      console.warn(`⚠️ ${selected} 데이터 없음. region-000을 기반으로 새로 생성.`);
      const savedRegion = await saveNewRegion(selected);
      if (savedRegion) {
        console.log(`✅ ${selected} 생성 완료! 다시 로드 시도.`);
        regionData = await loadRegionData(selected);
      } else {
        console.error(`🚨 ${selected} 생성 후 로드 실패.`);
      }
    }

    if (regionData) {
      currentRegion = regionData;
      updateSettingsUI(regionData);
    } else {
      console.warn(`⚠️ ${selected} 데이터 로드 실패`);
    }
  });
});

// ======================
// 5. Settings & Authentication
// ======================

/**
 * 비밀번호 토글 (표시/숨김)
 */
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
window.togglePassword = togglePassword;

// 지역 변경 시 로컬 저장소 업데이트
regionDropdown.addEventListener("change", async (e) => {
  selectedRegion = e.target.value;
  localStorage.setItem("selectedRegion", selectedRegion);
  console.log("🟢 새로운 지역 선택됨:", selectedRegion);
  const regionData = await loadRegionData(selectedRegion);
  if (regionData) {
    console.log(`✅ ${selectedRegion} 데이터 로드 완료:`, regionData);
  } else {
    console.warn(`⚠️ ${selectedRegion} 데이터 로드 실패`);
  }
});

// 설정 화면 전환 및 인증
document.getElementById("settings-button").addEventListener("click", () => {
  homeScreen.style.display = "none";
  settingsScreen.style.display = "block";
});

document.getElementById("auth-submit").addEventListener("click", () => {
  const region = currentRegion;
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

  // 두더지 클릭 이벤트 재설정 (중복 방지)
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
    timeLeft -= 10;
    if (timeLeft <= 0 || remainingLives <= 0) {
      clearInterval(timerInterval);
      endGame();
    } else {
      updateTimerUI(timeLeft);
    }
  }, 10);
}

/**
 * 새로운 질문 선택 (중복 제거)
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
 * 두더지 재표시를 위한 스케줄링
 */
function scheduleNextMoles(delayMs) {
  resetAllMoles();
  setTimeout(() => {
    showMoles();
  }, delayMs);
}

/**
 * 두더지를 화면에 표시하고 정답/오답 할당
 */
function showMoles() {
  if (!gameActive) return;
  clearTimeout(moleTimer);

  if (!currentQuestion) {
    currentQuestion = getQuestion();
    updateQuestionUI(currentQuestion.question, currentQuestion.emptySlot);
  }

  const totalAnswers = 1 + currentQuestion.wrong.length;
  const allAnswers = [currentQuestion.correct, ...currentQuestion.wrong];
  const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5);

  resetAllMoles();

  const numMoles = totalAnswers;
  const availableHoles = Array.from(holes).slice(0, numMoles);

  availableHoles.forEach((hole, index) => {
    const moleImg = hole.querySelector(".mole");
    const answerLabel = hole.querySelector(".answer-label");
    moleImg.src = "assets/mole.svg";
    moleImg.dataset.answer = shuffledAnswers[index] || "";
    answerLabel.textContent = shuffledAnswers[index] || "";
    hole.classList.add("active");
    activeHoles.push(hole);
  });

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
 * 모든 구멍 초기화
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
 * 두더지 클릭 시 정답/오답 처리
 */
function handleMoleClick(event) {
  if (isWaiting) return;
  isWaiting = true;
  clearTimeout(moleTimer);

  const mole = event.target;
  const answer = mole.dataset.answer;

  if (answer === currentQuestion.correct) {
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
 * 비디오 정지 및 일시정지 관련 함수
 */
function stopVideo() {
  const iframe = document.querySelector('#end-screen iframe');
  if (iframe) {
    iframe.src = iframe.src;
  }
}

function pauseVideo() {
  const iframe = document.querySelector("#end-screen iframe");
  if (iframe) {
    const player = new Vimeo.Player(iframe);
    player.pause();
  }
}

/**
 * Play Again 버튼 클릭 시 게임 재시작
 */
function handlePlayAgain() {
  stopVideo();
  endScreen.style.display = "none";
  score = 0;
  remainingLives = 3;
  timeLeft = currentRegion ? currentRegion.gameTime * 1000 : 120000;
  usedQuestions = [];
  currentQuestion = null;
  isWaiting = false;

  resetAllMoles();

  document.querySelectorAll(".mole").forEach((mole) => {
    mole.removeEventListener("click", handleMoleClick);
    mole.addEventListener("click", handleMoleClick);
  });

  console.log("✅ Play Again: 두더지 클릭 이벤트 재등록 완료!");
  startGame();
}

/**
 * Go Home 버튼 클릭 시 홈 화면으로 복귀 및 초기화
 */
function handleGoHome() {
  stopVideo();
  console.log("🏠 Go Home 버튼 클릭 - 게임 종료 및 초기화!");
  gameActive = false;
  clearInterval(timerInterval);
  clearTimeout(moleTimer);

  endScreen.style.display = "none";
  gameScreen.style.display = "none";
  linktreeScreen.style.display = "none";
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
document.addEventListener("click", (event) => {
  const { id } = event.target;
  if (id === "start-button") {
    startGame();
  } else if (id === "restart-button") {
    handlePlayAgain();
  } else if (id === "go-home-button" || id === "home-button") {
    handleGoHome();
  } else if (id === "linktree-button") { 
    showScreen("linktree-screen");
    pauseVideo();
  } else if (id === "back-to-home") { 
    showScreen("home-screen");
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

// ======================
// 9. Swipe Gesture Handling
// ======================
function goNextScreen() {
  if (currentScreen === "home") {
    startGame();
  } else if (currentScreen === "game") {
    showGameOver();
  }
}

function goPrevScreen() {
  if (currentScreen === "game") {
    showHomeScreen();
  }
}

document.addEventListener("touchstart", (event) => {
  startX = event.touches[0].clientX;
});

document.addEventListener("touchmove", (event) => {
  endX = event.touches[0].clientX;
});

document.addEventListener("touchend", () => {
  let diffX = startX - endX;
  if (diffX > 50) {
    console.log("➡️ 왼쪽으로 스와이프 (다음 화면)");
    goNextScreen();
  } else if (diffX < -50) {
    console.log("⬅️ 오른쪽으로 스와이프 (이전 화면)");
    goPrevScreen();
  }
});

// ======================
// 10. Linktree Page
// ======================
document.getElementById("back-to-end").addEventListener("click", () => {
  document.getElementById("linktree-screen").style.display = "none";
  document.getElementById("end-screen").style.display = "block";
  console.log("뒤로가기 버튼 클릭됨");
});

document.getElementById("back-to-home").addEventListener("click", () => {
  showScreen("home-screen");
});

/**
 * 화면 전환 함수 (홈, 게임, 설정, 링크트리)
 */
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.style.display = "none";
  });
  document.getElementById(screenId).style.display = "block";
  if (screenId === "linktree-screen") {
    document.getElementById("end-screen").style.display = "none";
  }
}
