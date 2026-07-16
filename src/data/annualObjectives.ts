import type { AnnualObjective } from "../game/types";

export const annualObjectives: AnnualObjective[] = [
  {
    id: "welcoming_library",
    year: 1,
    title: "学生に選ばれる図書館づくり",
    description: "まずは学生が足を運びやすく、心地よく学べる図書館の土台を整えましょう。",
    icon: "school",
    conditions: [
      { key: "studentSatisfaction", target: 80, comparison: "atLeast", label: "学生満足度を80以上にする" },
      { key: "facility", target: 70, comparison: "atLeast", label: "施設快適度を70以上にする" },
      { key: "publicity", target: 70, comparison: "atLeast", label: "広報力を70以上にする" },
    ],
    reward: {
      budgetBonus: 5,
      effects: { reputation: 2 },
    },
    successMessage: "学生に親しまれる図書館の土台が整いました。次の一年につながる、素敵な成果ですね。",
    encouragementMessage: "図書館の土台は少しずつ育っています。届かなかった項目も、次の一年の道しるべにしていきましょう。",
  },
  {
    id: "research_partnership",
    year: 2,
    title: "研究を支えるパートナーへ",
    description: "教員との信頼を深め、デジタルも活用した研究支援のかたちを育てましょう。",
    icon: "science",
    conditions: [
      { key: "facultyTrust", target: 95, comparison: "atLeast", label: "教員信頼を95以上にする" },
      { key: "researchSupport", target: 95, comparison: "atLeast", label: "研究支援力を95以上にする" },
      { key: "dx", target: 85, comparison: "atLeast", label: "DXを85以上にする" },
    ],
    reward: {
      budgetBonus: 6,
      effects: { executiveTrust: 3 },
    },
    successMessage: "研究を支える図書館として、学内に確かな信頼が育ちました。この歩みを最終年度へつなげましょう。",
    encouragementMessage: "研究支援の芽はしっかり育っています。できたことを大切に、最終年度も一緒に整えていきましょう。",
  },
  {
    id: "sustainable_future",
    year: 3,
    title: "大学の未来を支える図書館へ",
    description: "3年間で育てた資料とサービスを、大学から長く信頼される図書館の姿として完成させましょう。",
    icon: "workspace_premium",
    conditions: [
      { key: "reputation", target: 100, comparison: "atLeast", label: "評判を100以上にする" },
      { key: "collection", target: 105, comparison: "atLeast", label: "蔵書・電子資料を105以上にする" },
      { key: "executiveTrust", target: 85, comparison: "atLeast", label: "執行部信頼を85以上にする" },
    ],
    reward: {
      budgetBonus: 0,
      effects: { reputation: 3, executiveTrust: 3 },
    },
    successMessage: "資料も信頼も大きく育ち、大学の未来を支える図書館になりました。3年間の丁寧な運営が実を結びましたね。",
    encouragementMessage: "すべてには届かなくても、3年間で育てた資料と信頼は確かに残っています。この経験が次の一歩につながります。",
  },
];

export const annualObjectiveByYear = Object.fromEntries(
  annualObjectives.map((objective) => [objective.year, objective]),
) as Record<number, AnnualObjective>;
