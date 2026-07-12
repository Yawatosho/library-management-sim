export type SeasonId = "spring" | "summer" | "autumn" | "winter";

export interface SeasonMeta {
  label: string;
  range: string;
  icon: string;
  term: string;
}

export const seasonMeta: Record<SeasonId, SeasonMeta> = {
  spring: {
    label: "春",
    range: "3-5月",
    icon: "local_florist",
    term: "Spring Term",
  },
  summer: {
    label: "夏",
    range: "6-8月",
    icon: "wb_sunny",
    term: "Summer Term",
  },
  autumn: {
    label: "秋",
    range: "9-11月",
    icon: "psychiatry",
    term: "Autumn Term",
  },
  winter: {
    label: "冬",
    range: "12-2月",
    icon: "ac_unit",
    term: "Winter Term",
  },
};

export const getSeason = (month: number): SeasonId => {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
};
