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
    comment: "学生も教員も職員も、この図書館を大切な場所として親しんでいます。あなたと歩んだ3年間を、私も誇りに思います。",
  },
  {
    min: 82,
    rank: "A",
    title: "学内に信頼された図書館",
    comment: "信頼を大切にしながら、新しいことにも一緒に取り組めた、うれしい3年間でした。",
  },
  {
    min: 76,
    rank: "B",
    title: "堅実な図書館",
    comment: "毎月の積み重ねが、学内に必要とされる図書館へつながりました。ここまで一緒に歩めてうれしいです。",
  },
  {
    min: 70,
    rank: "C",
    title: "課題は多いが運営継続",
    comment: "迷う月もありましたが、次につながる土台を一緒に残せました。ここからまた育てていけます。",
  },
  {
    min: 64,
    rank: "D",
    title: "改革が必要",
    comment: "まだ整えたいところはありますが、変えていける道筋も見えてきました。次はひとつずつ、一緒に進めましょう。",
  },
  {
    min: -Infinity,
    rank: "E",
    title: "運営危機",
    comment: "今回は思うように進まないこともありましたね。それでも、次に生かせる気づきは残っています。また一緒に始めましょう。",
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
