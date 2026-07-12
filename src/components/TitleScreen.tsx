import type { CSSProperties } from "react";
import { useState } from "react";
import { BgmPreferenceButton } from "./SeasonalBgm";
import { DebugSetupModal, type DebugGameConfig } from "./DebugSetupModal";

interface TitleScreenProps {
  canContinue: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onHelp: () => void;
  onDeleteSave: () => void;
  onStartDebug: (config: DebugGameConfig) => void;
}

export const TitleScreen = ({
  canContinue,
  onNewGame,
  onContinue,
  onHelp,
  onDeleteSave,
  onStartDebug,
}: TitleScreenProps) => {
  const [debugOpen, setDebugOpen] = useState(false);
  const keyVisualUrl = `${import.meta.env.BASE_URL}assets/images/title-key-visual.png`;
  const style = { "--title-key-visual": `url(${keyVisualUrl})` } as CSSProperties;

  return (
    <div className="screen title-screen title-key-screen" style={style}>
      <div className="title-key-screen__shade" aria-hidden="true" />
      <header className="title-key-header">
        <span>UNIVERSITY LIBRARY MAKER</span>
        <div className="title-key-header__actions">
          <small>3 YEARS / 36 MONTHS</small>
          <BgmPreferenceButton />
        </div>
      </header>

      <main className="title-key-layout">
        <section className="title-key-copy">
          <p className="eyebrow">大学図書館運営シミュレーション</p>
          <h1>
            <span>University</span>
            <span>Library Maker</span>
          </h1>
          <p className="title-key-copy__lead">
            学生、研究、そして働く人のために。<br />
            3年間で、大学に必要とされる図書館を育てよう。
          </p>

          <nav className="title-key-menu" aria-label="メインメニュー">
            <button type="button" className="title-key-menu__primary" onClick={onNewGame}>
              <span className="material-symbols-rounded" aria-hidden="true">auto_stories</span>
              <span><strong>はじめから</strong><small>新しい3年間を始める</small></span>
              <span className="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
            </button>
            <button type="button" onClick={onContinue} disabled={!canContinue}>
              <span className="material-symbols-rounded" aria-hidden="true">history</span>
              <span><strong>続きから</strong><small>保存した月から再開</small></span>
              <span className="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
            </button>
            <button type="button" onClick={onHelp}>
              <span className="material-symbols-rounded" aria-hidden="true">menu_book</span>
              <span><strong>遊び方</strong><small>ルールと評価を確認</small></span>
              <span className="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
            </button>
          </nav>

          <div className="title-key-submenu">
            {canContinue && <button type="button" onClick={onDeleteSave}>セーブデータ削除</button>}
            <button type="button" onClick={() => setDebugOpen(true)}>デバッグモード</button>
          </div>
        </section>
      </main>

      <footer className="title-key-footer">
        <span>UNIVERSITY LIBRARY OPERATIONS OFFICE</span>
        <small>静かな一手が、大学の未来を変える。</small>
      </footer>
      {debugOpen && <DebugSetupModal onClose={() => setDebugOpen(false)} onStart={onStartDebug} />}
    </div>
  );
};
