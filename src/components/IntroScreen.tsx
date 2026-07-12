import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { useState } from "react";
import { SeasonalBgm } from "./SeasonalBgm";

interface IntroScreenProps {
  messageIndex: number;
  onAdvance: () => void;
  onComplete: () => void;
  onHelp: () => void;
  onTitle: () => void;
}

const introMessages = [
  [
    "はじめまして。今日から図書館運営をご一緒する司書です。",
    "これからどうぞ、よろしくお願いいたします。",
  ],
  [
    "あなたには、これから3年間、",
    "この大学図書館の運営責任者として歩んでいただきます。",
  ],
  [
    "学生の学び、先生方の研究、そして職員が元気に働ける環境。",
    "そのすべてを大切にしながら、図書館を育てていきましょう。",
  ],
  [
    "毎月使える行動力は3APです。",
    "今の図書館に必要な方針と行動を、私と一緒に選んでください。",
  ],
  [
    "それでは、1年目の4月から始めましょう。",
    "どんな図書館になるのか、今からとても楽しみです。",
  ],
] as const;

export const IntroScreen = ({ messageIndex, onAdvance, onComplete, onHelp, onTitle }: IntroScreenProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const backgroundUrl = `${import.meta.env.BASE_URL}assets/images/background.png`;
  const librarianUrl = `${import.meta.env.BASE_URL}assets/images/librarian.png`;
  const style = { "--intro-background": `url(${backgroundUrl})` } as CSSProperties;
  const message = introMessages[messageIndex]!;
  const isLastMessage = messageIndex === introMessages.length - 1;

  const advance = () => {
    if (isLastMessage) {
      onComplete();
      return;
    }
    onAdvance();
  };

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    advance();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      advance();
    }
  };

  return (
    <div
      className="screen intro-screen"
      style={style}
      role="button"
      tabIndex={0}
      aria-label="司書さんのメッセージ。クリックして次へ"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <header className="intro-header">
        <span>UNIVERSITY LIBRARY MAKER</span>
        <div className="intro-header__meta"><small>PROLOGUE</small><strong>1年目 4月</strong></div>
        <div className="intro-actions">
          <SeasonalBgm season="spring" />
          <button type="button" className="ghost-button" onClick={onHelp}>ヘルプ</button>
          <button type="button" className="ghost-button" onClick={onTitle}>タイトル</button>
        </div>
      </header>

      <div className="intro-scene" aria-hidden="true">
        {!imageFailed ? (
          <img src={librarianUrl} alt="" onError={() => setImageFailed(true)} />
        ) : (
          <div className="intro-scene__placeholder">司書さん</div>
        )}
      </div>

      <section className="intro-dialogue" aria-live="polite" aria-atomic="true">
        <span className="intro-dialogue__name">司書さん</span>
        <div key={messageIndex} className="intro-dialogue__message">
          {message.map((line) => <p key={line}>{line}</p>)}
        </div>
        <div className="intro-dialogue__progress" aria-label={`${messageIndex + 1} / ${introMessages.length}`}>
          {introMessages.map((_, index) => (
            <span key={index} className={index === messageIndex ? "is-active" : ""} />
          ))}
        </div>
        <span className="intro-dialogue__next">
          {isLastMessage ? "運営を始める" : "クリックで次へ"}
          <span className="material-symbols-rounded" aria-hidden="true">{isLastMessage ? "arrow_forward" : "expand_more"}</span>
        </span>
      </section>
    </div>
  );
};
