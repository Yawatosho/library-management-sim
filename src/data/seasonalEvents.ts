import type { SeasonalEvent } from "../game/types";

export const seasonalEvents: SeasonalEvent[] = [
  {
    month: 4,
    title: "新入生シーズン",
    description: "新入生の図書館デビューが集中します。",
    effectNote: "ガイダンス、SNS、サイン改善の効果+20%",
  },
  {
    month: 5,
    title: "レポート課題増加",
    description: "初回レポートで資料相談が増えます。",
    effectNote: "レファレンス、図書購入の効果+10%",
  },
  {
    month: 6,
    title: "梅雨の本濡れ注意",
    description: "雨の日の利用マナー周知が必要です。",
    effectNote: "広報系コマンドをしないと評判-2",
  },
  {
    month: 7,
    title: "試験期",
    description: "閲覧席と質問対応が一気に混み合います。",
    effectNote: "月末に職員疲労+3",
  },
  {
    month: 8,
    title: "夏季休業",
    description: "大きめの館内改善に手をつけやすい時期です。",
    effectNote: "施設改善・業務見直しの効果+15%",
  },
  {
    month: 9,
    title: "後期準備",
    description: "後期授業に向けて資料と案内を整えます。",
    effectNote: "図書購入、ガイダンスの効果+10%",
  },
  {
    month: 10,
    title: "学園祭",
    description: "学外の人にも図書館を見てもらえる機会です。",
    effectNote: "展示・SNSの効果+20%",
  },
  {
    month: 11,
    title: "卒論相談期",
    description: "卒論と研究相談が深まる時期です。",
    effectNote: "レファレンス・研究支援の効果+15%",
  },
  {
    month: 12,
    title: "予算執行確認",
    description: "年度末に向けて予算消化状況を見られます。",
    effectNote: "予算が40以上余っていると執行部信頼-3",
  },
  {
    month: 1,
    title: "冬の試験期",
    description: "寒さと試験で館内環境が目立ちます。",
    effectNote: "施設系効果+10%",
  },
  {
    month: 2,
    title: "入試・休館対応",
    description: "休館案内と館内調整が重要になります。",
    effectNote: "広報・施設・業務見直しの効果+10%",
  },
  {
    month: 3,
    title: "年度末評価",
    description: "1年間の運営が次年度予算に反映されます。",
    effectNote: "次年度予算と評価を計算",
  },
];

export const seasonalEventByMonth = Object.fromEntries(
  seasonalEvents.map((event) => [event.month, event]),
) as Record<number, SeasonalEvent>;
