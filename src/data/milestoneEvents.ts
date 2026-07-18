import type { MilestoneEventId, StatKey, Stats } from "../game/types";

export interface MilestoneEventDefinition {
  id: MilestoneEventId;
  speaker: string;
  title: string;
  message: string;
  imageName: string;
  conditionKey: StatKey;
  target: number;
  tone: "calm" | "bright";
}

export const MILESTONE_EVENT_RATE = 0.4;

export const milestoneEvents: MilestoneEventDefinition[] = [
  {
    id: "faculty_thanks",
    speaker: "教授",
    title: "研究を支えてくれたあなたへ",
    message: "いつも研究と学びを丁寧に支えてくださり、ありがとうございます。先生方の間でも、図書館を頼りにしているという声をよく聞くようになりました。これからも、どうぞよろしくお願いします。",
    imageName: "professor_thanks.png",
    conditionKey: "facultyTrust",
    target: 100,
    tone: "calm",
  },
  {
    id: "student_thanks",
    speaker: "探偵さん",
    title: "学生を代表して、お礼です！",
    message: "運営者さん、いつもありがとうございます！ 図書館が前よりもっと居心地よくなって、来るたびに新しい発見があるんです。これからも一緒に、素敵な場所にしていきましょう！",
    imageName: "detective_thanks.png",
    conditionKey: "studentSatisfaction",
    target: 100,
    tone: "bright",
  },
];

export const milestoneEventById = Object.fromEntries(
  milestoneEvents.map((event) => [event.id, event]),
) as Record<MilestoneEventId, MilestoneEventDefinition>;

export const rollMilestoneEvent = (
  stats: Stats,
  seenEventIds: MilestoneEventId[],
  rng: () => number = Math.random,
): MilestoneEventId | null => {
  const eligibleEvents = milestoneEvents.filter(
    (event) => stats[event.conditionKey] >= event.target && !seenEventIds.includes(event.id),
  );

  if (eligibleEvents.length === 0 || rng() >= MILESTONE_EVENT_RATE) {
    return null;
  }

  return eligibleEvents[Math.min(eligibleEvents.length - 1, Math.floor(rng() * eligibleEvents.length))]?.id ?? null;
};
