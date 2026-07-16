import type { CSSProperties } from "react";

interface HelpScreenProps {
  onBack: () => void;
}

const helpChapters = [
  {
    id: "basic",
    number: "01",
    icon: "calendar_month",
    title: "毎月の運営",
    text: "1ターンは1か月、全36ターン。毎月3APを使い、重点方針とコマンドを組み合わせます。",
  },
  {
    id: "objective",
    number: "02",
    icon: "assignment_turned_in",
    title: "年度重点課題",
    text: "年度ごとに3つの達成条件があります。メイン画面の重点課題ボードで進捗を確認でき、全条件達成で年度末ボーナスを獲得します。",
  },
  {
    id: "score",
    number: "03",
    icon: "military_tech",
    title: "最終評価",
    text: "3年目3月の終了時に、職員士気・職員疲労を除く育成成果を評価。各項目は120を満点水準として100点換算され、伸び残した3項目も重視されます。ランクはS:90以上、A:82以上、B:76以上、C:70以上、D:64以上、E:63以下です。",
  },
  {
    id: "game-over",
    number: "04",
    icon: "warning",
    title: "運営停止条件",
    text: "予算-20以下、疲労100、評判・学生満足度・教員信頼のいずれかが0でゲームオーバーです。",
  },
  {
    id: "year-end",
    number: "05",
    icon: "account_balance",
    title: "年度末評価",
    text: "毎年3月に次年度予算を決定。執行部信頼、評判、学生満足度、教員信頼が予算を左右します。",
  },
  {
    id: "morale",
    number: "06",
    icon: "volunteer_activism",
    title: "職員士気",
    text: "士気70以上で成果が伸び、疲労負担も軽減。44以下では成果が落ち、疲労が増えます。",
  },
  {
    id: "growth",
    number: "07",
    icon: "monitoring",
    title: "100を超える育成",
    text: "育成パラメータに上限はありません。高水準でもコマンド効果は変わらないため、得意分野を気持ちよく伸ばし続けられます。",
  },
] as const;

export const HelpScreen = ({ onBack }: HelpScreenProps) => {
  const backgroundUrl = `${import.meta.env.BASE_URL}assets/images/background.png`;
  const librarianUrl = `${import.meta.env.BASE_URL}assets/images/librarian.png`;
  const style = { "--help-background": `url(${backgroundUrl})` } as CSSProperties;

  return (
    <div className="screen help-screen help-game-screen" style={style}>
      <header className="help-game-header">
        <div className="help-game-header__brand">
          <span className="material-symbols-rounded" aria-hidden="true">local_library</span>
          <div>
            <strong>UNIVERSITY LIBRARY MAKER</strong>
            <small>OPERATIONS HANDBOOK</small>
          </div>
        </div>
        <div className="help-game-header__title">
          <span>運営資料</span>
          <strong>遊び方</strong>
        </div>
        <button type="button" onClick={onBack} aria-label="前の画面へ戻る">
          <span className="material-symbols-rounded" aria-hidden="true">arrow_back</span>
          <span>戻る</span>
        </button>
      </header>

      <main className="help-game-layout">
        <nav className="help-chapter-nav" aria-label="遊び方の目次">
          <div className="help-chapter-nav__heading">
            <span>CONTENTS</span>
            <strong>運営の手引き</strong>
          </div>
          {helpChapters.map((chapter) => (
            <a key={chapter.id} href={`#help-${chapter.id}`}>
              <small>{chapter.number}</small>
              <span className="material-symbols-rounded" aria-hidden="true">{chapter.icon}</span>
              <strong>{chapter.title}</strong>
            </a>
          ))}
        </nav>

        <section className="help-manual" aria-labelledby="help-heading">
          <header className="help-manual__heading">
            <div>
              <p>LIBRARY OPERATIONS / BASIC GUIDE</p>
              <h1 id="help-heading">3年間の運営を始める前に</h1>
            </div>
            <span className="material-symbols-rounded" aria-hidden="true">menu_book</span>
          </header>

          <div className="help-keyfacts" aria-label="ゲームの基本情報">
            <div><small>期間</small><strong>36</strong><span>か月</span></div>
            <div><small>毎月</small><strong>3</strong><span>AP</span></div>
            <div><small>開始</small><strong>1年目</strong><span>4月</span></div>
            <div><small>最高評価</small><strong>S</strong><span>90点〜</span></div>
          </div>

          <div className="help-manual__chapters">
            {helpChapters.map((chapter) => (
              <article key={chapter.id} id={`help-${chapter.id}`}>
                <div className="help-manual__chapter-icon">
                  <span className="material-symbols-rounded" aria-hidden="true">{chapter.icon}</span>
                  <small>{chapter.number}</small>
                </div>
                <div>
                  <h2>{chapter.title}</h2>
                  <p>{chapter.text}</p>
                </div>
              </article>
            ))}
          </div>

          <footer className="help-manual__tip">
            <span className="material-symbols-rounded" aria-hidden="true">lightbulb</span>
            <p><strong>運営のコツ</strong> 高い数値をさらに伸ばすより、弱点を補いながら全体を整えると評価が安定します。</p>
          </footer>
        </section>

        <aside className="help-librarian" aria-label="司書さんからの案内">
          <div className="help-librarian__label">
            <span>GUIDE</span>
            <strong>司書さん</strong>
          </div>
          <img src={librarianUrl} alt="運営を案内する司書さん" />
          <div className="help-librarian__message">
            <span>司書さん</span>
            <p>全部を一度に覚えなくても大丈夫です。まずは今月の様子を見ながら、3APの使い方を私と一緒に考えてみましょう。</p>
          </div>
        </aside>
      </main>
    </div>
  );
};
