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
    text: "新年度の4月から、3年間の運営が始まります。毎月の3APをどの取り組みに使うか、重点方針と一緒に考えていきましょう。",
  },
  {
    id: "objective",
    number: "02",
    icon: "assignment_turned_in",
    title: "年度重点課題",
    text: "大学からは、その年に期待される3つの目標が示されます。すべてを果たせば、翌年度の予算にもうれしい支援が加わります。",
  },
  {
    id: "score",
    number: "03",
    icon: "military_tech",
    title: "最終評価",
    text: "3年目の3月を終えると、これまで育てた図書館の姿がSからEのランクで評価されます。各分野の120をひとつの目安に、得意なところを育てながら、まだ手が届いていない分野にも目を配ることが大切です。",
  },
  {
    id: "game-over",
    number: "04",
    icon: "warning",
    title: "運営を続けるために",
    text: "予算が-20以下、職員疲労が100、または評判・学生満足度・教員信頼のどれかが0になると、運営を続けられなくなります。苦しいときこそ、早めに立て直しましょう。",
  },
  {
    id: "year-end",
    number: "05",
    icon: "account_balance",
    title: "年度末評価",
    text: "毎年3月には、1年間の歩みが学内で振り返られます。執行部と教員からの信頼、学生の満足、図書館の評判が、次年度の予算につながります。",
  },
  {
    id: "morale",
    number: "06",
    icon: "volunteer_activism",
    title: "職員士気",
    text: "職員は、図書館を一緒に支える大切な仲間です。士気が70以上なら取り組みも実りやすく、疲労も抑えられます。44以下になったら、一度立ち止まることも大切です。",
  },
  {
    id: "growth",
    number: "07",
    icon: "monitoring",
    title: "100を超えた先へ",
    text: "蔵書も研究支援も、より良い図書館を目指す歩みに終わりはありません。各分野は100を超えても伸び続けます。あなたらしい強みを、どうぞ大切に育ててください。",
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
            <small>DIRECTOR'S REFERENCE</small>
          </div>
        </div>
        <div className="help-game-header__title">
          <span>図書館長室資料</span>
          <strong>遊び方</strong>
        </div>
        <button type="button" onClick={onBack} aria-label="前の画面へ戻る">
          <span className="material-symbols-rounded" aria-hidden="true">arrow_back</span>
          <span>戻る</span>
        </button>
      </header>

      <main className="help-game-layout">
        <section className="help-manual" aria-labelledby="help-heading">
          <header className="help-manual__heading">
            <div>
              <p>A LETTER FOR OUR NEXT THREE YEARS</p>
              <h1 id="help-heading">司書さんと歩む、これからの3年間</h1>
            </div>
            <span className="material-symbols-rounded" aria-hidden="true">menu_book</span>
          </header>

          <div className="help-keyfacts" aria-label="ゲームの基本情報">
            <div><small>任期</small><strong>36</strong><span>か月</span></div>
            <div><small>ひと月の行動</small><strong>3</strong><span>AP</span></div>
            <div><small>着任</small><strong>1年目</strong><span>4月</span></div>
            <div><small>目指す未来</small><strong>S</strong><span>ランク</span></div>
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
            <p><strong>司書さんから</strong> 得意なところを伸ばしつつ、まだ手の届いていないところにも少しずつ光を当てていきましょう。</p>
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
            <p>これから3年間、そばでお手伝いしますね。すべてをすぐに覚えなくても大丈夫です。まずは今月の図書館の様子から、一緒に見ていきましょう。</p>
          </div>
        </aside>
      </main>
    </div>
  );
};
