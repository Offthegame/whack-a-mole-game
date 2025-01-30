export const region002 = {
    id: "region-002", // 지역 ID
    password: "pass002", // 지역 비밀번호
    gameTime: 120, // 게임 시간 설정 (초 단위)
    randomizeQuestions: true, // 문제 랜덤화 여부
    levels: {
      level1: [
        {
          question: "철수가 학교(빈칸) 간다.",
          correct: "에",
          wrong: ["으로"],
          emptySlot: "assets/empty_1.svg",
        },
        {
          question: "매일 아침 밥을 (빈칸)",
          correct: "먹는다.",
          wrong: ["다닌다."],
          emptySlot: "assets/empty_1.svg",
        },
        {
          question: "오늘 (빈칸)에 비가 올 것 같다.",
          correct: "날씨",
          wrong: ["온도"],
          emptySlot: "assets/empty_1.svg",
        },
        {
          question: "나는 매일 공원 (빈칸) 운동을 한다.",
          correct: "에서",
          wrong: ["로"],
          emptySlot: "assets/empty_1.svg",
        },
        {
          question: "내일은 학교 (빈칸) 체육대회가 있다.",
          correct: "에서",
          wrong: ["로"],
          emptySlot: "assets/empty_1.svg",
        },
      ],
      level2: [
        {
          question: "나는 매일 아침에 커피를 (빈칸)",
          correct: "마십니다.",
          wrong: ["마시세요.", "마십시오.", "마십시다."],
          emptySlot: "assets/empty_1.svg",
        },
        {
          question: "바닷가에서 (빈칸)을 타는 것은 정말 재미있다.",
          correct: "서핑",
          wrong: ["배", "모래", "물놀이"],
          emptySlot: "assets/empty_1.svg",
        },
        {
          question: "어제 친구와 함께 영화를 (빈칸)",
          correct: "보러 갔어요.",
          wrong: ["볼 것입니다.", "봅시다.", "보세요."],
          emptySlot: "assets/empty_1.svg",
        },
        {
          question: "고양이는 항상 참치를 (빈칸)",
          correct: "좋아합니다.",
          wrong: ["좋아하세요.", "좋아요.", "좋았었습니다."],
          emptySlot: "assets/empty_1.svg",
        },
        {
          question: "봄이 (빈칸) 꽃이 활짝 핀다.",
          correct: "되면",
          wrong: ["돼면", "됐어", "되었고"],
          emptySlot: "assets/empty_1.svg",
        },
      ],
    },
  };

export default region002; // ✅ `import()`를 사용할 때 기본값으로 가져오기