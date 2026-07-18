import type { Screen } from "./types";

const GA_MEASUREMENT_ID = "G-J6NS8CCNWN";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const screenLabels: Record<Screen, string> = {
  title: "タイトル",
  intro: "オープニング",
  main: "メイン画面",
  help: "ヘルプ",
  yearEnd: "年度末評価",
  ending: "最終評価",
  gameOver: "ゲームオーバー",
};

const analyticsEnabled = () =>
  typeof window !== "undefined" && !LOCAL_HOSTS.has(window.location.hostname);

export const initializeAnalytics = () => {
  if (!analyticsEnabled() || window.gtag) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.dataset.measurementId = GA_MEASUREMENT_ID;
  document.head.append(script);

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false,
  });
};

export const trackScreenView = (screen: Screen) => {
  if (!analyticsEnabled() || !window.gtag) return;

  const pagePath = `${window.location.pathname}#${screen}`;
  const pageTitle = `${screenLabels[screen]} | University Library Maker`;

  window.gtag("event", "page_view", {
    send_to: GA_MEASUREMENT_ID,
    page_title: pageTitle,
    page_location: `${window.location.origin}${pagePath}`,
    page_path: pagePath,
  });
  window.gtag("event", "screen_view", {
    send_to: GA_MEASUREMENT_ID,
    app_name: "University Library Maker",
    screen_name: screen,
  });
};
