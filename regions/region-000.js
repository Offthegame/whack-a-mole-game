export const region000 = {
  id: "region-000",             // 지역 ID
  name: "Region 000",           // 지역 이름 (향후 변경 가능)
  password: "pass000",          // 지역 비밀번호
  gameTime: 120,                // 게임 시간 (초 단위)
  randomizeQuestions: true,     // 문제 랜덤화 여부
  milariSaid: "DFC를 소개합니다. 새로운 삶으로 당신을 초대합니다.", // 미라리 대사
  questions: [
    {
      id: "q1",               // 고유 식별자
      question: "철수가 학교___ 간다.",
      correct: "에",
      wrong: ["으로"],
      emptySlot: "assets/empty_1.svg"
    },
    {
      id: "q2",
      question: "매일 아침 밥을 ___",
      correct: "먹는다.",
      wrong: ["다닌다."],
      emptySlot: "assets/empty_1.svg"
    },
    {
      id: "q3",
      question: "오늘 ___에 비가 올 것 같다.",
      correct: "날씨",
      wrong: ["온도"],
      emptySlot: "assets/empty_1.svg"
    },
    {
      id: "q4",
      question: "나는 매일 공원 ___ 운동을 한다.",
      correct: "에서",
      wrong: ["로"],
      emptySlot: "assets/empty_1.svg"
    },
    {
      id: "q5",
      question: "내일은 학교 ___ 체육대회가 있다.",
      correct: "에서",
      wrong: ["로"],
      emptySlot: "assets/empty_1.svg"
    },
    {
      id: "q6",
      question: "나는 매일 아침에 커피를 ___",
      correct: "마십니다.",
      wrong: ["마시세요.", "마십시오.", "마십시다."],
      emptySlot: "assets/empty_1.svg"
    },
    {
      id: "q7",
      question: "바닷가에서 ___을 타는 것은 정말 재미있다.",
      correct: "서핑",
      wrong: ["배", "모래", "물놀이"],
      emptySlot: "assets/empty_1.svg"
    },
    {
      id: "q8",
      question: "어제 친구와 함께 영화를 ___",
      correct: "보러 갔어요.",
      wrong: ["볼 것입니다.", "봅시다.", "보세요."],
      emptySlot: "assets/empty_1.svg"
    },
    {
      id: "q9",
      question: "고양이는 항상 참치를 ___",
      correct: "좋아합니다.",
      wrong: ["좋아하세요.", "좋아요.", "좋았었습니다."],
      emptySlot: "assets/empty_1.svg"
    },
    {
      id: "q10",
      question: "봄이 ___ 꽃이 활짝 핀다.",
      correct: "되면",
      wrong: ["돼면", "됐어", "되었고"],
      emptySlot: "assets/empty_1.svg"
    }
  ]
};

export default region000;