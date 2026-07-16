import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { endings, type RankDefinition } from "../data/endings";
import { randomEvents } from "../data/randomEvents";
import { statLabels } from "../game/calculations";
import { loadMemoryCollection } from "../game/memoryCollection";
import type { RandomEvent, StatKey } from "../game/types";
import {
  loadBgmPreference,
  playAlbumBgmTrack,
  saveBgmPreference,
  stopSeasonalBgm,
  type GameBgmId,
} from "./SeasonalBgm";

type AlbumTab = "events" | "endings" | "sounds";
type SelectedMemory =
  | { kind: "event"; item: RandomEvent }
  | { kind: "ending"; item: RankDefinition };

interface MemoryAlbumProps {
  onBack: () => void;
}

const formatEffect = (key: StatKey, value: number) => {
  const sign = value > 0 ? "+" : "";
  return `${statLabels[key]} ${sign}${value}`;
};

interface SoundTestTrack {
  id: GameBgmId;
  title: string;
  subtitle: string;
  category: string;
  icon: string;
}

const soundTestTracks: SoundTestTrack[] = [
  { id: "spring", title: "春の図書館", subtitle: "3月〜5月", category: "SEASON", icon: "local_florist" },
  { id: "summer", title: "夏の図書館", subtitle: "6月〜8月", category: "SEASON", icon: "sunny" },
  { id: "autumn", title: "秋の図書館", subtitle: "9月〜11月", category: "SEASON", icon: "eco" },
  { id: "winter", title: "冬の図書館", subtitle: "12月〜2月", category: "SEASON", icon: "ac_unit" },
  { id: "report", title: "年度末評価", subtitle: "Annual Report", category: "REPORT", icon: "assessment" },
  { id: "ending", title: "エンディング", subtitle: "Three Years Later", category: "STORY", icon: "auto_stories" },
  { id: "gameover", title: "運営終了", subtitle: "Game Over", category: "STORY", icon: "history_edu" },
];

export const MemoryAlbum = ({ onBack }: MemoryAlbumProps) => {
  const [activeTab, setActiveTab] = useState<AlbumTab>("events");
  const [selectedMemory, setSelectedMemory] = useState<SelectedMemory | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<GameBgmId>("spring");
  const [bgmEnabled, setBgmEnabled] = useState(loadBgmPreference);
  const [needsGesture, setNeedsGesture] = useState(false);
  const mountedRef = useRef(true);
  const collection = useMemo(loadMemoryCollection, []);
  const unlockedEvents = new Set(collection.randomEventIds);
  const unlockedEndings = new Set<string>(collection.endingRanks);
  const unlockedTotal = unlockedEvents.size + unlockedEndings.size;
  const total = randomEvents.length + endings.length;
  const progress = total === 0 ? 0 : Math.round((unlockedTotal / total) * 100);
  const backgroundUrl = `${import.meta.env.BASE_URL}assets/images/background.png`;
  const screenStyle = { "--memory-background": `url(${backgroundUrl})` } as CSSProperties;
  const selectedTrack = soundTestTracks.find((track) => track.id === selectedTrackId) ?? soundTestTracks[0]!;
  const isBgmPlaying = bgmEnabled && !needsGesture;

  const startAlbumTrack = (trackId: GameBgmId, fadeInDuration = 700) => {
    playAlbumBgmTrack(trackId, {
      onStarted: () => {
        if (mountedRef.current) setNeedsGesture(false);
      },
      onBlocked: () => {
        if (mountedRef.current) setNeedsGesture(true);
      },
    }, fadeInDuration);
  };

  useEffect(() => {
    mountedRef.current = true;
    if (bgmEnabled) startAlbumTrack("spring", 900);

    return () => {
      mountedRef.current = false;
      stopSeasonalBgm();
    };
  }, []);

  useEffect(() => {
    if (!selectedMemory) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedMemory(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedMemory]);

  const handleBgmToggle = () => {
    if (isBgmPlaying) {
      setBgmEnabled(false);
      setNeedsGesture(false);
      saveBgmPreference(false);
      stopSeasonalBgm();
      return;
    }

    setBgmEnabled(true);
    saveBgmPreference(true);
    startAlbumTrack(selectedTrackId, 500);
  };

  const handleTrackSelect = (trackId: GameBgmId) => {
    setSelectedTrackId(trackId);
    setBgmEnabled(true);
    saveBgmPreference(true);
    startAlbumTrack(trackId, 500);
  };

  const bgmLabel = !bgmEnabled ? "BGM OFF" : needsGesture ? "BGM開始" : "BGM ON";
  const bgmIcon = !bgmEnabled ? "volume_off" : needsGesture ? "play_circle" : "volume_up";

  return (
    <div className="screen memory-album-screen" style={screenStyle}>
      <header className="memory-album-header">
        <div className="memory-album-header__brand">
          <span className="material-symbols-rounded" aria-hidden="true">collections_bookmark</span>
          <div>
            <small>UNIVERSITY LIBRARY MAKER</small>
            <strong>思い出アルバム</strong>
          </div>
        </div>
        <div className="memory-album-header__actions">
          <button
            type="button"
            className={`ghost-button bgm-button bgm-preference-button ${isBgmPlaying ? "is-enabled" : ""}`}
            onClick={handleBgmToggle}
            aria-pressed={isBgmPlaying}
            title={needsGesture ? "クリックするとBGMを再生します" : "BGMのON/OFF"}
          >
            <span className="material-symbols-rounded" aria-hidden="true">{bgmIcon}</span>
            {bgmLabel}
          </button>
          <button type="button" className="memory-album-back" onClick={onBack}>
            <span className="material-symbols-rounded" aria-hidden="true">arrow_back</span>
            タイトルへ
          </button>
        </div>
      </header>

      <main className="memory-album-layout">
        <section className="memory-album-intro" aria-labelledby="memory-album-heading">
          <div>
            <p className="eyebrow">LIBRARY MEMORIES</p>
            <h1 id="memory-album-heading">3年間の記憶を、もう一度。</h1>
            <p>図書館で出会った出来事と、あなたがたどり着いた未来がここに残ります。</p>
          </div>
          <div className="memory-album-progress" aria-label={`${total}件中${unlockedTotal}件解放`}>
            <span><strong>{unlockedTotal}</strong> / {total}</span>
            <small>COLLECTION {progress}%</small>
            <span className="memory-album-progress__bar" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </span>
          </div>
        </section>

        <nav className="memory-album-tabs" aria-label="アルバムの種類">
          <button
            type="button"
            className={activeTab === "events" ? "is-active" : ""}
            aria-pressed={activeTab === "events"}
            onClick={() => setActiveTab("events")}
          >
            <span className="material-symbols-rounded" aria-hidden="true">photo_library</span>
            <span className="memory-album-tabs__label"><span>ランダムイベント</span><span>イベント</span></span>
            <small>{unlockedEvents.size} / {randomEvents.length}</small>
          </button>
          <button
            type="button"
            className={activeTab === "endings" ? "is-active" : ""}
            aria-pressed={activeTab === "endings"}
            onClick={() => setActiveTab("endings")}
          >
            <span className="material-symbols-rounded" aria-hidden="true">auto_stories</span>
            <span className="memory-album-tabs__label"><span>エピローグ</span><span>エピローグ</span></span>
            <small>{unlockedEndings.size} / {endings.length}</small>
          </button>
          <button
            type="button"
            className={activeTab === "sounds" ? "is-active" : ""}
            aria-pressed={activeTab === "sounds"}
            onClick={() => setActiveTab("sounds")}
          >
            <span className="material-symbols-rounded" aria-hidden="true">library_music</span>
            <span className="memory-album-tabs__label"><span>サウンドテスト</span><span>音楽</span></span>
            <small>{soundTestTracks.length} TRACKS</small>
          </button>
        </nav>

        <section className={activeTab === "sounds" ? "sound-test" : `memory-album-grid memory-album-grid--${activeTab}`} aria-live="polite">
          {activeTab === "events" && randomEvents.map((event, index) => {
            const unlocked = unlockedEvents.has(event.id);
            const imageUrl = `${import.meta.env.BASE_URL}assets/images/random-events/${event.imageId ?? event.id}.png`;
            return (
              <button
                type="button"
                key={event.id}
                className={`memory-card ${unlocked ? "is-unlocked" : "is-locked"}`}
                disabled={!unlocked}
                onClick={() => setSelectedMemory({ kind: "event", item: event })}
                aria-label={unlocked ? event.title : `未解放のランダムイベント ${index + 1}`}
              >
                <span className="memory-card__image">
                  <img src={imageUrl} alt="" />
                  {!unlocked && <span className="material-symbols-rounded memory-card__lock" aria-hidden="true">lock</span>}
                </span>
                <span className="memory-card__copy">
                  <small>MEMORY {String(index + 1).padStart(2, "0")}</small>
                  <strong>{unlocked ? event.title : "まだ見ぬ出来事"}</strong>
                </span>
              </button>
            );
          })}

          {activeTab === "endings" && endings.map((ending) => {
            const unlocked = unlockedEndings.has(ending.rank);
            const imageUrl = `${import.meta.env.BASE_URL}assets/images/endings/rank-${ending.rank.toLowerCase()}.png`;
            return (
              <button
                type="button"
                key={ending.rank}
                className={`memory-card memory-card--ending ${unlocked ? "is-unlocked" : "is-locked"}`}
                disabled={!unlocked}
                onClick={() => setSelectedMemory({ kind: "ending", item: ending })}
                aria-label={unlocked ? `${ending.rank}ランク ${ending.title}` : "未解放のエピローグ"}
              >
                <span className="memory-card__image">
                  <img src={imageUrl} alt="" />
                  {!unlocked && <span className="material-symbols-rounded memory-card__lock" aria-hidden="true">lock</span>}
                  {unlocked && <span className="memory-card__rank">RANK {ending.rank}</span>}
                </span>
                <span className="memory-card__copy">
                  <small>{unlocked ? `ENDING ${ending.rank}` : "ENDING ?"}</small>
                  <strong>{unlocked ? ending.title : "まだ見ぬ未来"}</strong>
                </span>
              </button>
            );
          })}

          {activeTab === "sounds" && (
            <>
              <section className="sound-test-player" aria-label="サウンドテストプレイヤー">
                <span className={`sound-test-player__disc ${isBgmPlaying ? "is-playing" : ""}`} aria-hidden="true">
                  <span className="material-symbols-rounded">album</span>
                </span>
                <div className="sound-test-player__copy">
                  <small>{isBgmPlaying ? "NOW PLAYING" : "SELECTED TRACK"}</small>
                  <h2>{selectedTrack.title}</h2>
                  <p>{selectedTrack.subtitle} / {selectedTrack.category}</p>
                  <div
                    className={`sound-test-equalizer ${isBgmPlaying ? "is-playing" : ""}`}
                    role="img"
                    aria-label={isBgmPlaying ? "BGM再生中" : "BGM停止中"}
                  >
                    {Array.from({ length: 20 }, (_, index) => (
                      <span
                        key={index}
                        style={{ "--eq-index": index } as CSSProperties}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
                <button type="button" className="sound-test-player__control" onClick={handleBgmToggle}>
                  <span className="material-symbols-rounded" aria-hidden="true">
                    {isBgmPlaying ? "pause" : "play_arrow"}
                  </span>
                  {isBgmPlaying ? "停止" : "再生"}
                </button>
              </section>

              <div className="sound-test-track-list" aria-label="ゲーム内BGM一覧">
                {soundTestTracks.map((track, index) => {
                  const selected = track.id === selectedTrackId;
                  return (
                    <button
                      type="button"
                      key={track.id}
                      className={`sound-test-track ${selected ? "is-selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() => handleTrackSelect(track.id)}
                    >
                      <span className="sound-test-track__number">{String(index + 1).padStart(2, "0")}</span>
                      <span className="material-symbols-rounded sound-test-track__icon" aria-hidden="true">{track.icon}</span>
                      <span className="sound-test-track__copy">
                        <strong>{track.title}</strong>
                        <small>{track.subtitle}</small>
                      </span>
                      <span className="sound-test-track__state material-symbols-rounded" aria-hidden="true">
                        {selected && isBgmPlaying ? "graphic_eq" : "play_arrow"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      {selectedMemory && (
        <div className="memory-viewer" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedMemory(null);
        }}>
          <section className="memory-viewer__panel" role="dialog" aria-modal="true" aria-labelledby="memory-viewer-title">
            <button type="button" className="memory-viewer__close" onClick={() => setSelectedMemory(null)} aria-label="閉じる">
              <span className="material-symbols-rounded" aria-hidden="true">close</span>
            </button>
            <div className="memory-viewer__image">
              <img
                src={selectedMemory.kind === "event"
                  ? `${import.meta.env.BASE_URL}assets/images/random-events/${selectedMemory.item.imageId ?? selectedMemory.item.id}.png`
                  : `${import.meta.env.BASE_URL}assets/images/endings/rank-${selectedMemory.item.rank.toLowerCase()}.png`}
                alt={selectedMemory.kind === "event" ? selectedMemory.item.title : `${selectedMemory.item.rank}ランク ${selectedMemory.item.title}`}
              />
            </div>
            <div className="memory-viewer__copy">
              <small>{selectedMemory.kind === "event" ? "RANDOM EVENT MEMORY" : `ENDING / RANK ${selectedMemory.item.rank}`}</small>
              <h2 id="memory-viewer-title">{selectedMemory.item.title}</h2>
              <p>{selectedMemory.kind === "event" ? selectedMemory.item.description : selectedMemory.item.comment}</p>
              {selectedMemory.kind === "event" && (
                <div className="memory-viewer__effects" aria-label="イベント効果">
                  {Object.entries(selectedMemory.item.effects).map(([key, value]) => (
                    <span key={key} className={(key === "staffFatigue" ? value < 0 : value > 0) ? "is-positive" : "is-negative"}>
                      {formatEffect(key as StatKey, value)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
