import type { GameOverResult, Stats } from "../game/types";
import { AssistantCharacter } from "./AssistantCharacter";
import { StatsPanel } from "./StatsPanel";

interface GameOverScreenProps {
  gameOver: GameOverResult;
  stats: Stats;
  onNewGame: () => void;
  onTitle: () => void;
}

export const GameOverScreen = ({ gameOver, stats, onNewGame, onTitle }: GameOverScreenProps) => (
  <div className="screen game-over-screen">
    <main className="screen-layout">
      <section className="hero-panel hero-panel--danger">
        <p className="eyebrow">Game Over</p>
        <h1>{gameOver.reason}</h1>
        <p>{gameOver.comment}</p>
        <div className="button-row">
          <button type="button" className="primary-button" onClick={onNewGame}>
            もう一度始める
          </button>
          <button type="button" className="ghost-button" onClick={onTitle}>
            タイトルへ
          </button>
        </div>
      </section>
      <StatsPanel stats={stats} />
    </main>
    <AssistantCharacter expression="worried" message="ここで運営終了です。次は休息と予算を早めに見ましょう。" />
  </div>
);
