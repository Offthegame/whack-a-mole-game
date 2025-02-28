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

import { playBackgroundMusic, stopBackgroundMusic, playButtonSound, playHitSound, playWrongSound, resultSound } from "/scripts/sound.js";

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

// 배경음악 상태 변수
let isMusicPlaying = false; // 기본값: 배경음악 재생 중

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

// 배경음악 버튼 요소 가져오기
const musicButton = document.getElementById("music-button");

// 비디오 모달 관련 요소 가져오기
const videoModal = document.getElementById("video-modal");
const videoFrame = document.getElementById("video-frame");
const closeVideoButton = document.getElementById("close-video");

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
  showLoading(); // 로딩 화면 표시
  try {
    const response = await fetch(`${API_BASE}/api/regions`);
    let dbRegions = [];
    if (response.ok) {
      dbRegions = await response.json();
    }

    // 기본 옵션 생성: region-001부터 region-050
    const defaultRegions = [];
    for (let i = 1; i <= 50; i++) {
      const regionId = `region-${String(i).padStart(3, "0")}`;
      defaultRegions.push({
        id: regionId,
        name: `Region ${String(i).padStart(3, "0")}`,
        password: `pass${String(i).padStart(3, "0")}`,
      });
    }

    // DB에서 받은 데이터와 기본 옵션 병합
    const mergedRegions = defaultRegions.map(defaultRegion => {
      const found = dbRegions.find(region => region.id === defaultRegion.id);
      return found ? found : defaultRegion;
    });

    // 드롭다운 초기화
    regionDropdown.innerHTML = "";
    settingsDropdown.innerHTML = "";

    // ✅ 기본 안내 옵션 추가 (항상 가장 먼저 추가)
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "지역을 선택하세요";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    regionDropdown.appendChild(defaultOption.cloneNode(true));
    settingsDropdown.appendChild(defaultOption.cloneNode(true));

    // 병합된 데이터로 옵션 추가
    mergedRegions.forEach(region => {
      const option = document.createElement("option");
      option.value = region.id;
      option.textContent = region.name;
      option.setAttribute("data-password", region.password);
      regionDropdown.appendChild(option.cloneNode(true));
      settingsDropdown.appendChild(option.cloneNode(true));
    });

    // ✅ 저장된 지역 확인 및 적용
    const savedRegion = localStorage.getItem("selectedRegion");
    
    if (savedRegion && mergedRegions.some(r => r.id === savedRegion)) {
      // ✅ 저장된 지역이 유효하면 선택 유지
      regionDropdown.value = savedRegion;
      settingsDropdown.value = savedRegion;
      console.log(`🎯 적용된 지역: ${savedRegion}`);
    } else {
      // 🚨 저장된 지역이 없거나 유효하지 않으면 초기화
      console.warn(`⚠️ ${savedRegion || "없음"}는 유효하지 않으므로 초기화.`);
      localStorage.removeItem("selectedRegion");
      regionDropdown.value = "";
      settingsDropdown.value = "";
    }
  } catch (error) {
    console.error("🚨 지역 데이터를 불러오는 데 실패했습니다.", error);
  } finally {
    hideLoading(); // 로딩 화면 숨김
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

// 배경음악 토글 함수
function toggleBackgroundMusic() {
  playButtonSound();

  if (isMusicPlaying) {
    stopBackgroundMusic(); // 배경음악 정지
    musicButton.src = "assets/music-on.webp"; // 이미지 변경
  } else {
    playBackgroundMusic(); // 배경음악 재생
    musicButton.src = "assets/music-off.webp"; // 이미지 변경
  }
  isMusicPlaying = !isMusicPlaying; // 상태 변경
  localStorage.setItem("isMusicPlaying", isMusicPlaying.toString()); // 상태 저장
}

// 배경음악 버튼 클릭 이벤트 추가
musicButton.addEventListener("click", toggleBackgroundMusic);

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
  playButtonSound();

  homeScreen.style.display = "none";
  settingsScreen.style.display = "flex";
  
  // 📌 팝업 메시지 추가
  // alert("아직 개발이 덜 돼서 죄송합니다. 피드백 반영을 일요일 오전 9시 전까지 모두 완료토록 하겠습니다. \n개발자 이동하 010-5104-1405");
});

document.getElementById("auth-submit").addEventListener("click", () => {
  playButtonSound();
  const region = currentRegion;
  const enteredPassword = document.getElementById("region-password").value;
  console.log(region);
  if (region && enteredPassword === region.password) {
    authSection.style.display = "none";
    settingsOptions.style.display = "flex";
    document.getElementById("game-time").value = region.gameTime;
    document.getElementById("random-toggle").checked = region.randomizeQuestions;
  } else {
    document.getElementById("auth-error").style.display = "flex";
  }
});

document.getElementById("save-settings").addEventListener("click", () => {
  playButtonSound();
  if (currentRegion) {
    currentRegion.gameTime = parseInt(document.getElementById("game-time").value, 10);
    currentRegion.randomizeQuestions = document.getElementById("random-toggle").checked;
    alert("Settings saved successfully!");
  }
});

document.getElementById("back-to-home").addEventListener("click", () => {
  playButtonSound();
  settingsScreen.style.display = "none";
  homeScreen.style.display = "flex";
});

// ======================
// 6. Game Logic & Functions
// ======================

/**
 * 게임 시작 함수
 */
async function startGame() {
  if (!selectedRegion) {
    alert("지역을 선택해 주세요.");
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

  // UI 업데이트
  document.getElementById("region-info").textContent = currentRegion.name;
  updateScoreUI(0);
  updateLivesUI(3);
  updateTimerUI(currentRegion.gameTime * 1000);

  // 화면 전환
  homeScreen.style.display = "none";
  gameScreen.style.display = "flex";
  gameActive = true;
  score = 0;
  timeLeft = currentRegion.gameTime * 1000; // ms 단위
  remainingLives = 3;
  usedQuestions = [];
  currentQuestion = null;
  isWaiting = false;

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
    moleImg.src = "assets/mole.webp";
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
    moleImg.src = "assets/mole.webp";
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
    mole.src = "assets/correct.webp";
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
    mole.src = "assets/wrong.webp";
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
  resultSound();
  gameActive = false;
  gameScreen.style.display = "none";
  endScreen.style.display = "flex";
  document.getElementById("final-score").textContent = `Your Score: ${score}`;
}

/**
 * Play Again 버튼 클릭 시 게임 재시작
 */
function handlePlayAgain() {
  endScreen.style.display = "none";
  score = 0;
  remainingLives = 3;
  timeLeft = currentRegion ? currentRegion.gameTime * 1000 : 120000;
  usedQuestions = [];
  currentQuestion = null;
  isWaiting = false;

  resetAllMoles();
  startGame();
}

/**
 * Go Home 버튼 클릭 시 홈 화면으로 복귀 및 초기화
 */
function handleGoHome() {
  console.log("🏠 Go Home 버튼 클릭 - 게임 종료 및 초기화!");
  gameActive = false;
  clearInterval(timerInterval);
  clearTimeout(moleTimer);

  endScreen.style.display = "none";
  gameScreen.style.display = "none";
  linktreeScreen.style.display = "none";
  homeScreen.style.display = "flex";

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
// ✅ 기존 전역 이벤트 리스너에서 video-button 관련 코드 삭제
document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  playButtonSound();  // ✅ 버튼 클릭 시에만 실행

  const { id } = button;
  if (id === "start-button") {
    startGame();
  } else if (id === "restart-button") {
    handlePlayAgain();
  } else if (id === "go-home-button" || id === "home-button") {
    handleGoHome();
  } else if (id === "linktree-button") { 
    showScreen("linktree-screen");
  } else if (id === "back-to-home") { 
    showScreen("home-screen");
  }
});



// ✅ video-button 클릭 이벤트를 별도로 관리하여 모달 열기
document.getElementById("video-button").addEventListener("click", () => {
  playButtonSound();
  videoFrame.src = "https://player.vimeo.com/video/1059278963";
  videoModal.style.display = "flex"; // 모달 보이기
});

// ✅ 닫기 버튼 클릭 시 모달 닫기
closeVideoButton.addEventListener("click", () => {
  playButtonSound();
  videoModal.style.display = "none";
  videoFrame.src = ""; // 비디오 정지
});

// ✅ 배경 클릭 시 모달 닫기
videoModal.addEventListener("click", (event) => {
  if (event.target === videoModal) {
    videoModal.style.display = "none";
    videoFrame.src = "";
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
// 🔹 페이지 로드 시 음악 상태 복원
document.addEventListener("DOMContentLoaded", () => {
  populateRegionDropdown();
  
  // ✅ localStorage에서 음악 상태 불러오기
  const savedMusicState = localStorage.getItem("isMusicPlaying");
  
  if (savedMusicState === "true") {
    playBackgroundMusic(true); // 자동 재생 시도
  } else {
    isMusicPlaying = false;
    musicButton.src = "assets/music-on.webp"; // 음악 OFF 상태 유지
  }
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
  playButtonSound();
  document.getElementById("linktree-screen").style.display = "none";
  document.getElementById("end-screen").style.display = "flex";
  console.log("뒤로가기 버튼 클릭됨");
});

/**
 * 화면 전환 함수 (홈, 게임, 설정, 링크트리)
 */
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.style.display = "none";
  });
  document.getElementById(screenId).style.display = "flex";
  if (screenId === "linktree-screen") {
    document.getElementById("end-screen").style.display = "none";
  }
}

// 🔹 홈 화면을 클릭하면 배경음악을 재생하도록 설정
homeScreen.addEventListener("click", function startMusicOnce() {

  if (!isMusicPlaying) {
    playBackgroundMusic();
    isMusicPlaying = true;
    musicButton.src = "assets/music-off.webp"; // ✅ 배경음악이 켜지면 아이콘 변경
    localStorage.setItem("isMusicPlaying", "true"); // 상태 저장
  }
  // 한 번 실행 후 이벤트 리스너 제거
  homeScreen.removeEventListener("click", startMusicOnce);
});