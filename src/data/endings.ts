import type { EndingResult } from "../game/types";

export interface RankDefinition {
  min: number;
  rank: string;
  title: string;
  comment: string;
}

export const endings: RankDefinition[] = [
  {
    min: 90,
    rank: "S",
    title: "伝説の図書館",
    comment: "学生も教員も職員も、この図書館を大学の心臓部として語り継いでいます。",
  },
  {
    min: 80,
    rank: "A",
    title: "学内に信頼された図書館",
    comment: "堅い信頼と新しい挑戦が両立した、見事な3年間でした。",
  },
  {
    min: 65,
    rank: "B",
    title: "堅実な図書館",
    comment: "派手さより継続力。学内に必要とされる図書館として着実に前進しました。",
  },
  {
    min: 50,
    rank: "C",
    title: "課題は多いが運営継続",
    comment: "苦しい局面もありましたが、次につながる土台は残せました。",
  },
  {
    min: 35,
    rank: "D",
    title: "改革が必要",
    comment: "サービス、職員体制、予算のどこかに大きな手当てが必要です。",
  },
  {
    min: -Infinity,
    rank: "E",
    title: "運営危機",
    comment: "図書館の存在意義をもう一度示すため、抜本的な再設計が求められます。",
  },
];

export const getEndingByScore = (score: number): EndingResult => {
  const ending = endings.find((item) => score >= item.min) ?? endings[endings.length - 1]!;

  return {
    score,
    rank: ending.rank,
    title: ending.title,
    comment: ending.comment,
  };
};
