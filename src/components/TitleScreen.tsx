import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { MemoryAlbum } from "./MemoryAlbum";
import { SaveDataModal } from "./SaveDataModal";
import { BgmPreferenceButton } from "./SeasonalBgm";
import { DebugSetupModal, type DebugGameConfig } from "./DebugSetupModal";
import type { GameSaveBackup } from "../game/storage";

interface TitleScreenProps {
  canContinue: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onHelp: () => void;
  onDeleteSave: () => void;
  onExportSave: () => Promise<void>;
  onImportSave: (backup: GameSaveBackup) => void;
  onStartDebug: (config: DebugGameConfig) => void;
}

type ConfirmAction = "new-game" | "delete-save";

interface TitleConfirmDialogProps {
  action: ConfirmAction;
  onCancel: () => void;
  onConfirm: () => void;
}

const TitleConfirmDialog = ({ action, onCancel, onConfirm }: TitleConfirmDialogProps) => {
  const isDelete = action === "delete-save";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="modal-backdrop title-confirm-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <section
        className={`modal title-confirm-modal ${isDelete ? "title-confirm-modal--danger" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="title-confirm-heading"
        aria-describedby="title-confirm-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="material-symbols-rounded title-confirm-modal__icon" aria-hidden="true">
          {isDelete ? "delete_forever" : "auto_stories"}
        </span>
        <div className="title-confirm-modal__copy">
          <small>{isDelete ? "DELETE SAVE DATA" : "START NEW STORY"}</small>
          <h2 id="title-confirm-heading">
            {isDelete ? "現在の運営記録を削除しますか？" : "新しい3年間を始めますか？"}
          </h2>
          <p id="title-confirm-description">
            {isDelete
              ? "続きから再開するための記録は失われます。思い出アルバムの記録は残ります。"
              : "現在の運営記録は、新しいゲームの開始時に上書きされます。"}
          </p>
        </div>
        <div className="title-confirm-modal__actions">
          <button type="button" className="title-confirm-modal__cancel" onClick={onCancel}>戻る</button>
          <button type="button" className="title-confirm-modal__confirm" onClick={onConfirm}>
            {isDelete ? "削除する" : "はじめから遊ぶ"}
          </button>
        </div>
      </section>
    </div>
  );
};

export const TitleScreen = ({
  canContinue,
  onNewGame,
  onContinue,
  onHelp,
  onDeleteSave,
  onExportSave,
  onImportSave,
  onStartDebug,
}: TitleScreenProps) => {
  const [debugOpen, setDebugOpen] = useState(false);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [saveDataOpen, setSaveDataOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const debugEnabled = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";
  const keyVisualUrl = `${import.meta.env.BASE_URL}assets/images/title-key-visual.png`;
  const style = { "--title-key-visual": `url(${keyVisualUrl})` } as CSSProperties;

  if (albumOpen) {
    return <MemoryAlbum onBack={() => setAlbumOpen(false)} />;
  }

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
            <button
              type="button"
              className="title-key-menu__primary"
              onClick={() => canContinue ? setConfirmAction("new-game") : onNewGame()}
            >
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
            <button type="button" onClick={() => setAlbumOpen(true)}>
              <span className="material-symbols-rounded" aria-hidden="true">collections_bookmark</span>
              <span><strong>思い出アルバム</strong><small>出会った出来事と未来を振り返る</small></span>
              <span className="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
            </button>
          </nav>

          <div className="title-key-submenu">
            <button type="button" onClick={() => setSaveDataOpen(true)}>セーブデータ管理</button>
            {canContinue && <button type="button" onClick={() => setConfirmAction("delete-save")}>セーブデータ削除</button>}
            {debugEnabled && <button type="button" onClick={() => setDebugOpen(true)}>デバッグモード</button>}
          </div>
        </section>
      </main>

      <footer className="title-key-footer">
        <span className="title-key-footer__office">UNIVERSITY LIBRARY OPERATIONS OFFICE</span>
        <div className="title-key-footer__credits">
          <small>
            作成：
            <a href="https://yawatosho.hateblo.jp/" target="_blank" rel="noreferrer">
              やわらか図書館学
            </a>
          </small>
          <a
            className="title-key-footer__games-link"
            href="https://yawatosho.github.io/"
            target="_blank"
            rel="noreferrer"
          >
            <span>YAWATOSHO GAMES</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </footer>
      {saveDataOpen && (
        <SaveDataModal
          canExport={canContinue}
          onClose={() => setSaveDataOpen(false)}
          onExport={onExportSave}
          onImport={onImportSave}
        />
      )}
      {debugEnabled && debugOpen && <DebugSetupModal onClose={() => setDebugOpen(false)} onStart={onStartDebug} />}
      {confirmAction && (
        <TitleConfirmDialog
          action={confirmAction}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            const action = confirmAction;
            setConfirmAction(null);
            if (action === "delete-save") onDeleteSave();
            else onNewGame();
          }}
        />
      )}
    </div>
  );
};
