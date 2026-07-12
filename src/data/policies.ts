import type { Policy } from "../game/types";

export const policies: Policy[] = [
  {
    id: "student_first",
    name: "学生第一",
    tagline: "学生満足度 +20%",
    description: "学生満足度が上がる効果を強めます。",
  },
  {
    id: "research_focus",
    name: "研究支援重視",
    tagline: "教員信頼・研究支援 +20%",
    description: "教員信頼と研究支援力が上がる効果を強めます。",
  },
  {
    id: "publicity_focus",
    name: "広報強化",
    tagline: "広報力・評判 +20%",
    description: "広報力と評判が上がる効果を強めます。",
  },
  {
    id: "staff_care",
    name: "職員保護",
    tagline: "疲労増加 30%軽減",
    description: "職員疲労が増える効果を軽減します。",
  },
  {
    id: "reform_push",
    name: "改革推進",
    tagline: "DX・施設・研究支援 +15%",
    description: "改革系の効果を強めますが、疲労増加も少し増えます。",
  },
  {
    id: "budget_saving",
    name: "財政再建",
    tagline: "予算消費 -20%",
    description: "予算消費を抑えますが、満足度上昇は少し鈍ります。",
  },
];

export const policyById = Object.fromEntries(
  policies.map((policy) => [policy.id, policy]),
) as Record<Policy["id"], Policy>;
