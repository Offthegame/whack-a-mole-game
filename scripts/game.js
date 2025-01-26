import { level1Questions, level2Questions } from "./questions.js";
import { 
  updateScoreUI, 
  updateLivesUI, 
  updateTimerUI, 
  updateQuestionUI, 
  showGameScreen, 
  showEndScreen, 
  resetUI 
} from "./ui.js";
import { playHitSound, playWrongSound, playBackgroundMusic } from "./sound.js";

// ---------------------
// 게임 상태 변수
// ---------------------
let score = 0;           
let timeLeft = 120;     
let activeHoles = [];   
let currentQuestion = null;
let playerName = "User 1";
let remainingLives = 3;
let usedQuestions = [];  
let moleTimer;           
let isWaiting = false;   

// DOM에서 구멍(.hole) 요소 모두 가져오기
const holes = document.querySelectorAll(".hole");

// ---------------------
// 문제/난이도 함수
// ---------------------

// 단계별 문제 가져오기, 이미 사용한 문제 제외
function getQuestionByLevel() {
  const questions = score < 1000 ? level1Questions : level2Questions;
  const available = questions.filter(q => !usedQuestions.includes(q));

  if (available.length === 0) {
    usedQuestions = []; // 모든 문제를 사용했다면 초기화
    return getQuestionByLevel();
  }
  const selected = available[Math.floor(Math.random() * available.length)];
  usedQuestions.push(selected);
  return selected;
}

// 1단계: 2마리, 2단계: 4마리
function getNumberOfMoles() {
  return score < 1000 ? 2 : 4;
}

// ---------------------
// 두더지 표시 & 초기화
// ---------------------

// 모든 구멍 활성화 해제 + 이미지/텍스트 초기화
function resetAllMoles() {
  activeHoles.forEach(hole => {
    hole.classList.remove("active");
    const moleImg = hole.querySelector(".mole");
    const answerLabel = hole.querySelector(".answer-label");
    moleImg.src = "assets/mole.svg";
    answerLabel.textContent = "";
  });
  activeHoles = [];
}

// 일정 시간 뒤 새로 두더지를 올리는 로직 (선택적)
function scheduleNextMoles(delayMs) {
  resetAllMoles();
  setTimeout(() => {
    showMoles();
  }, delayMs);
}

// ---------------------
// 두더지+문제 표시
// ---------------------
function showMoles() {
  // 기존 타이머 정지
  clearTimeout(moleTimer);

  // 현재 문제가 없다면 새 문제
  if (!currentQuestion) {
    currentQuestion = getQuestionByLevel();
    updateQuestionUI(currentQuestion.question, currentQuestion.emptySlot);
  }

  // 1단계: 오답 1개, 2단계: 오답 3개
  const numOfWrongs = score < 1000 ? 1 : 3;
  const allAnswers = [currentQuestion.correct, ...currentQuestion.wrong.slice(0, numOfWrongs)];
  const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5);

  // 이전 구멍 초기화
  resetAllMoles();

  // 2단계면 hole-3, hole-4 보이기 (.hidden 해제)
  if (score >= 1000) {
    document.getElementById("hole-3").classList.remove("hidden");
    document.getElementById("hole-4").classList.remove("hidden");
  }

  // 이번에 활성화할 구멍 수
  const numMoles = getNumberOfMoles();
  // 1단계: hole-1, hole-2만 / 2단계: hole-1..4
  const availableHoles = score < 1000
    ? [holes[0], holes[1]]
    : [holes[0], holes[1], holes[2], holes[3]];

  // 무작위로 구멍 .active 처리
  for (let i = 0; i < numMoles; i++) {
    const randIndex = Math.floor(Math.random() * availableHoles.length);
    const randomHole = availableHoles.splice(randIndex, 1)[0];

    const moleImg = randomHole.querySelector(".mole");
    const answerLabel = randomHole.querySelector(".answer-label");

    moleImg.src = "assets/mole.svg";
    moleImg.dataset.answer = shuffledAnswers[i] || "";
    answerLabel.textContent = shuffledAnswers[i] || "";

    randomHole.classList.add("active");
    activeHoles.push(randomHole);
  }

  // 5초 뒤 초기화 후 재등장
  moleTimer = setTimeout(() => {
    resetAllMoles();
    scheduleNextMoles(500); 
  }, 5000);
}

// ---------------------
// 정답/오답 처리 (두더지 클릭)
// ---------------------
function handleMoleClick(event) {
  if (isWaiting) return;
  isWaiting = true;
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
      isWaiting = false;
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
      isWaiting = false;
      scheduleNextMoles(500);
    }, 2000);
  }
  // 클릭한 두더지 텍스트 제거
  mole.parentElement.querySelector(".answer-label").textContent = "";
}

// ---------------------
// 게임 시작/종료
// ---------------------
function startGame() {
  // ★ 게임 상태 초기화
  score = 0;
  remainingLives = 3;
  timeLeft = 120;
  usedQuestions = [];
  currentQuestion = null;
  isWaiting = false;

  // UI 초기화
  resetUI();
  showGameScreen();
  playBackgroundMusic();

  // 제한 시간 감소
  const timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI(timeLeft);
    if (timeLeft <= 0 || remainingLives <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);

  showMoles(); 
}

function endGame() {
  showEndScreen(score);
}

// ---------------------
// 첫 화면(Go Home) & Play Again
// ---------------------
function handleGoHome() {
  // end-screen 숨기기
  document.getElementById("end-screen").style.display = "none";
  // game-screen 숨기기
  document.getElementById("game-screen").style.display = "none";
  // intro-screen 보이기
  document.getElementById("intro-screen").style.display = "block";

  // 원하는 상태 초기화
  score = 0;
  remainingLives = 3;
  timeLeft = 120;
  usedQuestions = [];
  currentQuestion = null;
  resetUI();

  // 2단계용 hole-3, hole-4 다시 숨김
  document.getElementById("hole-3").classList.add("hidden");
  document.getElementById("hole-4").classList.add("hidden");
}

function handlePlayAgain() {
  // end-screen 숨기기
  document.getElementById("end-screen").style.display = "none";
  // 게임 상태 초기화
  score = 0;
  remainingLives = 3;
  timeLeft = 120;
  usedQuestions = [];
  currentQuestion = null;

  // 2단계용 hole-3, hole-4 숨김
  document.getElementById("hole-3").classList.add("hidden");
  document.getElementById("hole-4").classList.add("hidden");

  // 다시 시작
  startGame();
}

// ---------------------
// 이벤트 리스너 등록
// ---------------------
holes.forEach(hole => {
  hole.querySelector(".mole").addEventListener("click", handleMoleClick);
});

document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("start-button");
  const goHomeButton = document.getElementById("go-home-button");
  const playAgainButton = document.getElementById("restart-button");

  // 시작
  startButton.addEventListener("click", startGame);
  // Go Home
  goHomeButton.addEventListener("click", handleGoHome);
  // Play Again
  playAgainButton.addEventListener("click", handlePlayAgain);
});
