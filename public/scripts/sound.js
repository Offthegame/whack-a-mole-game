// /scripts/sound.js

// 효과음 함수들
export function playHitSound() {
  const audio = new Audio("assets/sounds/hit.mp3");
  audio.play().catch(err => console.error("Hit sound 재생 오류:", err));
}

export function playWrongSound() {
  const audio = new Audio("assets/sounds/wrong.mp3");
  audio.play().catch(err => console.error("Wrong sound 재생 오류:", err));
}

// 배경음악 설정: 반복 재생 및 볼륨 조절
const bgmAudio = new Audio("assets/bgm1.mp3");
bgmAudio.loop = true;
bgmAudio.volume = 0.5;

export function playBackgroundMusic() {
  // 이미 재생 중이면 다시 재생하지 않음
  if (bgmAudio.paused) {
    bgmAudio.play().catch(err => console.error("BGM 재생 오류:", err));
  }
}

export function stopBackgroundMusic() {
  // 화면 전환 시 호출하지 않도록 주의!
  bgmAudio.pause();
  bgmAudio.currentTime = 0;
}

// 버튼 효과음 설정
const buttonAudio = new Audio("assets/button.mp3");
buttonAudio.volume = 1.0;

export function playButtonSound() {
  buttonAudio.currentTime = 0;
  buttonAudio.play().catch(err => console.error("Button sound 재생 오류:", err));
}