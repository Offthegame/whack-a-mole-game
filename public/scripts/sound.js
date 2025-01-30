export function playHitSound() {
    const audio = new Audio("assets/sounds/hit.mp3");
    audio.play();
  }
  
  export function playWrongSound() {
    const audio = new Audio("assets/sounds/wrong.mp3");
    audio.play();
  }
  
  export function playBackgroundMusic() {
    const bgAudio = new Audio("assets/sounds/bg.mp3");
    bgAudio.loop = true;
    bgAudio.play();
  }
  