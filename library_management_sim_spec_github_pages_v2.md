# 図書館運営シミュレーション 仕様たたき台 改訂版

## 0. この仕様書について

この仕様書は、GitHub Pagesで公開することを前提にした、小規模なブラウザゲーム用の仕様書である。Codexで実装しやすいように、ゲーム仕様、GitHub Pages対応、進行役キャラクター「司書さん」のUI仕様、画像アセット、画像生成プロンプト、Codex依頼文をまとめる。

| 項目 | 内容 |
|---|---|
| フレームワーク | React |
| 言語 | TypeScript |
| ビルドツール | Vite |
| 公開先 | GitHub Pages |
| データ保存 | localStorage |
| バックエンド | 使用しない |
| 外部API | 使用しない |
| ルーティング | 単一ページ内の画面切り替え、または HashRouter |

---

## 1. 企画概要

### 仮タイトル

**University Library Maker**

### ジャンル

ターン制・大学図書館運営シミュレーション

### コンセプト

プレイヤーは大学図書館の運営責任者となり、限られた予算・行動ポイント・職員の余力を使って、学生・教員・大学執行部からの信頼を高めていく。

戦国シミュレーションの「国取り」をそのまま再現するのではなく、大学内の各部署・利用者層との連携度を高め、図書館の存在感を広げていくゲームにする。

### 目標

36か月、つまり3年間の運営を行い、最終的に図書館の総合評価A以上を目指す。

---

## 2. 開発方針

### 最初のバージョンで目指すもの

- ブラウザで遊べる小規模なターン制ゲーム
- 1ターンは1か月
- 全36ターン
- 毎月3APを使ってコマンドを選ぶ
- パラメータ変動とイベントで運営状況が変化する
- 進行役キャラクター「司書さん」が状況に応じてコメントする
- エンディングで評価が出る
- GitHub Pagesで静的サイトとして公開できる

### 最初のバージョンではやらないこと

- サーバー処理
- ユーザーアカウント
- オンラインランキング
- 複雑な職員個別育成
- 複雑なマップ移動
- 戦闘シーンのような演出
- AI対戦
- 大量の分岐シナリオ
- セーブデータのクラウド同期

まずは「毎月どの施策を選ぶか」で悩める、小さくまとまったゲームを作る。

---

## 3. GitHub Pages公開前提の仕様

### 基本方針

このゲームは、GitHub Pagesで公開できる静的Webアプリとして実装する。バックエンドを使わず、ゲームロジック、データ、セーブデータ管理はすべてブラウザ側で完結させる。

### GitHub Pages対応要件

| 項目 | 要件 |
|---|---|
| ビルド | `npm run build` で `dist` を生成する |
| 公開 | GitHub Pagesで `dist` を配信できる |
| ルーティング | 通常のBrowserRouterは避ける。画面状態管理またはHashRouterを使う |
| データ保存 | localStorageを使う |
| 画像参照 | 相対パス、または `import.meta.env.BASE_URL` を考慮する |
| 外部API | 使用しない |
| JSON読込 | public配下、またはTypeScript定数として保持 |
| スマホ対応 | 最低限レスポンシブにする |
| PWA | 初期版では不要 |

### Vite設定の注意

GitHub Pagesでリポジトリページとして公開する場合、Viteの `base` 設定が必要になる。

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/library-management-sim/",
});
```

リポジトリ名が変わる場合は `base` も変える。実装では後から変更しやすいようにしておく。

### GitHub Actionsで公開する場合

初期実装では手動設定でもよいが、可能なら以下の流れで自動公開する。

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## 4. 基本ルール

| 項目 | 内容 |
|---|---|
| 1ターン | 1か月 |
| 総ターン数 | 36ターン |
| 開始月 | 4月 |
| 終了月 | 3年目3月 |
| 1か月の行動ポイント | 3AP |

### 1ターンの流れ

1. 月初レポート表示
2. 司書さんの月初コメント表示
3. 季節イベント確認
4. 今月の重点方針を選択
5. 3AP以内でコマンドを選択
6. コマンド結果を処理
7. ランダムイベント判定
8. 司書さんの結果コメント表示
9. 疲労・予算・評判などを更新
10. 次月へ進む

---

## 5. 主要パラメータ

すべて基本的に0〜100で管理する。ただし `budget` は年度内予算として扱い、マイナスになることがある。

| パラメータ | 初期値 | 説明 |
|---|---:|---|
| budget | 100 | 予算。各種コマンドで消費する |
| collection | 50 | 蔵書・電子資料の充実度 |
| studentSatisfaction | 50 | 学生満足度 |
| facultyTrust | 50 | 教員からの信頼 |
| executiveTrust | 45 | 大学執行部からの信頼 |
| publicity | 40 | 広報力・認知度 |
| staffMorale | 55 | 職員士気 |
| staffFatigue | 20 | 職員疲労。高いほど悪い |
| facility | 45 | 施設快適度 |
| researchSupport | 40 | 研究支援力 |
| dx | 35 | DX・システム整備度 |
| reputation | 50 | 図書館の総合的な評判 |

---

## 6. 行動ポイント AP

毎月、プレイヤーは **3AP** を持つ。

| コマンド種別 | AP |
|---|---:|
| 小規模コマンド | 1AP |
| 中規模コマンド | 2AP |
| 大規模コマンド | 3AP |

選択例：

| 選び方 | 例 |
|---|---|
| 1AP + 1AP + 1AP | SNS強化、図書購入、季節展示 |
| 2AP + 1AP | ガイダンス実施、ポスター刷新 |
| 3AP | 空調改善 |
| 何もしない | 職員疲労が少し下がる |

---

## 7. 重点方針

毎月、コマンド選択前に重点方針を1つ選ぶ。方針はその月のコマンド効果に補正をかける。

| 方針ID | 名称 | 効果 |
|---|---|---|
| student_first | 学生第一 | 学生満足度に関わる効果+20% |
| research_focus | 研究支援重視 | 教員信頼・研究支援に関わる効果+20% |
| publicity_focus | 広報強化 | 広報力・評判に関わる効果+20% |
| staff_care | 職員保護 | 疲労増加を30%軽減 |
| reform_push | 改革推進 | DX・施設・研究支援の効果+15%、疲労増加+10% |
| budget_saving | 財政再建 | 予算消費-20%、満足度上昇効果-10% |

---

## 8. コマンド仕様

### データ構造案

```ts
type StatKey =
  | "budget"
  | "collection"
  | "studentSatisfaction"
  | "facultyTrust"
  | "executiveTrust"
  | "publicity"
  | "staffMorale"
  | "staffFatigue"
  | "facility"
  | "researchSupport"
  | "dx"
  | "reputation";

type GameStats = Record<StatKey, number>;

type Command = {
  id: string;
  name: string;
  category:
    | "collection"
    | "service"
    | "publicity"
    | "facility"
    | "staff"
    | "research"
    | "politics"
    | "dx"
    | "rest";
  apCost: number;
  budgetCost: number;
  fatigueDelta: number;
  description: string;
  effects: Partial<GameStats>;
};
```

### 初期実装用コマンド一覧

| ID | 名称 | 分類 | AP | 予算 | 疲労 | 主な効果 |
|---|---|---|---:|---:|---:|---|
| buy_books | 図書を重点購入 | 蔵書 | 1 | 8 | +2 | 蔵書力+6、学生満足度+2 |
| trial_database | データベース試験導入 | 蔵書 | 2 | 15 | +4 | 研究支援力+8、教員信頼+5 |
| review_journals | 雑誌契約を見直す | 蔵書 | 2 | -8 | +5 | 予算+8、教員信頼-3、研究支援力-2 |
| guidance | 図書館ガイダンス | サービス | 2 | 4 | +6 | 学生満足度+8、広報力+4 |
| reference_boost | レファレンス強化 | サービス | 2 | 3 | +7 | 教員信頼+5、研究支援力+6 |
| long_loan | 長期貸出キャンペーン | サービス | 1 | 2 | +3 | 学生満足度+5、広報力+3 |
| sns | SNS投稿強化 | 広報 | 1 | 1 | +2 | 広報力+6、評判+2 |
| seasonal_exhibit | 季節展示 | 広報 | 1 | 4 | +4 | 広報力+5、学生満足度+3、評判+2 |
| poster | ポスター刷新 | 広報 | 1 | 3 | +2 | 広報力+5 |
| seats | 座席を増やす | 施設 | 2 | 12 | +4 | 施設快適度+8、学生満足度+5 |
| signage | サイン計画改善 | 施設 | 2 | 8 | +3 | 施設快適度+6、学生満足度+4 |
| air_conditioning | 空調改善 | 施設 | 3 | 22 | +5 | 施設快適度+14、学生満足度+8、評判+3 |
| staff_training | 職員研修 | 職員 | 1 | 5 | +2 | 職員士気+4、研究支援力+3、DX+2 |
| workflow_review | 業務見直し | 職員 | 2 | 3 | -8 | 職員疲労-8、職員士気+5 |
| faculty_visit | 学部長訪問 | 交渉 | 2 | 2 | +4 | 教員信頼+7、大学執行部信頼+3 |
| student_survey | 学生アンケート | 交渉 | 1 | 1 | +3 | 学生満足度+2、広報力+2 |
| oa_workshop | OA説明会 | 研究支援 | 2 | 5 | +6 | 研究支援力+8、教員信頼+5 |
| repository | 機関リポジトリ強化 | 研究支援 | 3 | 10 | +8 | 研究支援力+10、評判+5、DX+3 |
| opac | OPAC改善 | DX | 2 | 10 | +5 | DX+8、学生満足度+4、教員信頼+2 |
| automation | 業務自動化 | DX | 3 | 16 | +6 | DX+10、職員疲労-6、職員士気+4 |
| rest | 職員を休ませる | 休養 | 1 | 0 | -10 | 職員疲労-10、職員士気+2 |

実装時は、`budgetCost` と `effects.budget`、`fatigueDelta` と `effects.staffFatigue` が重複しないように整理する。おすすめは、予算消費は `budgetCost`、疲労変動は `fatigueDelta` に統一し、`effects` にはそれ以外の変動を入れる方式。

---

## 9. 季節イベント

| 月 | イベント名 | 内容 |
|---:|---|---|
| 4 | 新入生シーズン | ガイダンス、SNS、サイン改善の効果+20% |
| 5 | レポート課題増加 | レファレンス、図書購入の効果+10% |
| 6 | 梅雨の本濡れ注意 | 広報系コマンドをしないと評判-2 |
| 7 | 試験期 | 疲労+3。施設・座席系の重要度上昇 |
| 8 | 夏季休業 | 施設改善・業務見直しの効果+15% |
| 9 | 後期準備 | 図書購入、ガイダンスの効果+10% |
| 10 | 学園祭 | 展示・SNSの効果+20% |
| 11 | 卒論相談期 | レファレンス・研究支援の効果+15% |
| 12 | 予算執行確認 | 予算が余りすぎると執行部信頼-3 |
| 1 | 冬の試験期 | 施設系効果+10% |
| 2 | 入試・休館対応 | 広報・施設・業務見直しの効果+10% |
| 3 | 年度末評価 | 次年度予算と評価を計算 |

---

## 10. ランダムイベント

毎月1回、30%程度の確率で発生する。初期実装では、イベントはテキスト表示とパラメータ変動のみでよい。

### 良いイベント

| ID | 名称 | 効果 |
|---|---|---|
| viral_post | SNS投稿が話題に | 広報力+5、評判+3 |
| faculty_praise | 教員が授業で図書館を紹介 | 教員信頼+4、学生満足度+3 |
| student_volunteers | 学生ボランティア参加 | 広報力+3、職員疲労-3 |
| local_news | 展示が地域ニュースに掲載 | 評判+6、広報力+3 |
| donation | 良い寄贈資料が届く | 蔵書力+5、評判+2 |

### 悪いイベント

| ID | 名称 | 効果 |
|---|---|---|
| price_hike | 電子ジャーナル価格高騰 | 予算-8 |
| ac_trouble | 空調トラブル | 施設快適度-6、学生満足度-4 |
| system_down | システム障害 | DX-4、評判-3、職員疲労+4 |
| complaint | 騒音苦情 | 学生満足度-3、評判-2 |
| staff_absence | 職員の急な欠員 | 職員疲労+8 |
| wet_books | 本の水濡れトラブル | 蔵書力-3、評判-2 |

---

## 11. 進行役キャラクター「司書さん」

### 基本設定

進行役として、既存の別ゲーム等で使用しているキャラクター「司書さん」を用いる。

| 項目 | 内容 |
|---|---|
| 名前 | 司書さん |
| 役割 | ゲームの進行役・ナビゲーター |
| 職業 | 大学図書館司書 |
| 性格 | 優しく、少し天然。利用者にも職員にも寄り添う |
| 雰囲気 | 明るく親しみやすいが、落ち着きもある |
| 口調 | 丁寧、やわらかい、押しつけがましくない |
| 表示位置 | メイン画面右下、または下部のメッセージ欄横 |

### ゲーム内での役割

| 場面 | 役割 |
|---|---|
| タイトル画面 | ゲーム開始の案内 |
| チュートリアル | AP、方針、コマンドの説明 |
| 月初 | 季節イベントや今月の注意点を伝える |
| コマンド選択時 | 現在の状況に応じた助言 |
| 結果画面 | コマンド結果へのコメント |
| 警告時 | 予算不足、疲労増大、評判低下を知らせる |
| 年度末 | 年度評価を読み上げる |
| エンディング | 最終評価に応じたコメント |
| ゲームオーバー | やさしく状況を振り返る |

### 表示仕様

- PCでは画面右下または右側に表示する
- スマホでは画面下部に表示する
- 立ち絵とメッセージボックスを組み合わせる
- 画像ファイルがない場合はプレースホルダーを表示する
- 表情IDは `normal`, `smile`, `worried`, `surprised`, `explain`, `cheer` を想定する
- 初期実装では `normal`, `smile`, `worried` の3種類だけでもよい

---

## 12. 司書さんの表情差分

| ID | 表情 | 用途 | ファイル名例 |
|---|---|---|---|
| normal | 通常 | 通常案内、月初コメント | librarian_normal.png |
| smile | 笑顔 | 成功時、良いイベント | librarian_smile.png |
| worried | 困り顔 | 警告、悪いイベント | librarian_worried.png |
| surprised | 驚き | 突発イベント | librarian_surprised.png |
| explain | 説明 | チュートリアル、ヘルプ | librarian_explain.png |
| cheer | 応援 | 年度末、エンディング、励まし | librarian_cheer.png |

---

## 13. 司書さんコメント仕様

### データ構造案

```ts
type AssistantExpression =
  | "normal"
  | "smile"
  | "worried"
  | "surprised"
  | "explain"
  | "cheer";

type AssistantMessage = {
  id: string;
  trigger:
    | "title"
    | "tutorial"
    | "month_start"
    | "command_select"
    | "result"
    | "warning"
    | "year_end"
    | "ending"
    | "game_over";
  condition?: string;
  expression: AssistantExpression;
  text: string;
};
```

### 月初コメント例

| 条件 | 表情 | セリフ |
|---|---|---|
| 4月 | smile | 新年度ですね。まずは新入生への案内を整えると、よいスタートになりそうです。 |
| 6月 | normal | 梅雨の時期は、本の水濡れに注意したいですね。さりげない広報が効きそうです。 |
| 7月 | worried | 試験期に入りました。座席や空調への不満が出やすいので、少し気を配りたいですね。 |
| 8月 | normal | 夏季休業中は、普段できない施設改善や業務見直しのチャンスです。 |
| 11月 | explain | 卒論相談が増える時期です。レファレンスや研究支援を強化するよい機会ですね。 |
| 3月 | cheer | 年度末です。一年間の取り組みを振り返って、次年度につなげましょう。 |

### 状況依存コメント例

| 条件 | 表情 | セリフ |
|---|---|---|
| staffFatigue >= 80 | worried | 職員の疲れがかなりたまっています。今月は少し負担を下げたほうがよさそうです。 |
| budget <= 10 | worried | 予算が残り少なくなっています。大きな施策は慎重に選びたいですね。 |
| studentSatisfaction >= 75 | smile | 学生さんたちの反応がよくなっています。この流れを大事にしたいですね。 |
| facultyTrust <= 30 | worried | 教員からの信頼が少し下がっています。研究支援や学部訪問で関係を整えたいところです。 |
| reputation >= 80 | cheer | 図書館の評判がかなり高まっています。学内でも存在感が出てきましたね。 |

---

## 14. 評価計算

### 総合スコア

```ts
score =
  collection * 0.10 +
  studentSatisfaction * 0.15 +
  facultyTrust * 0.15 +
  executiveTrust * 0.10 +
  publicity * 0.08 +
  staffMorale * 0.10 +
  (100 - staffFatigue) * 0.10 +
  facility * 0.08 +
  researchSupport * 0.10 +
  dx * 0.07 +
  reputation * 0.12
```

### 評価ランク

| スコア | 評価 |
|---:|---|
| 90以上 | S：伝説の図書館 |
| 80〜89 | A：学内に信頼された図書館 |
| 65〜79 | B：堅実な図書館 |
| 50〜64 | C：課題は多いが運営継続 |
| 35〜49 | D：改革が必要 |
| 34以下 | E：運営危機 |

### 敗北条件

| 条件 | 内容 |
|---|---|
| budget <= -20 | 財政破綻 |
| staffFatigue >= 100 | 職員崩壊 |
| reputation <= 0 | 信頼喪失 |
| studentSatisfaction <= 0 | 学生離れ |
| facultyTrust <= 0 | 教員からの信頼喪失 |

---

## 15. 年度末処理

毎年3月に年度末評価を行う。

```ts
nextBudget =
  100
  + Math.floor((executiveTrust - 50) / 5)
  + Math.floor((reputation - 50) / 5)
  + Math.floor((studentSatisfaction - 50) / 10)
  + Math.floor((facultyTrust - 50) / 10)
```

### 年度末ボーナス・ペナルティ

| 条件 | 効果 |
|---|---|
| reputation >= 70 | 次年度予算+5 |
| executiveTrust >= 70 | 次年度予算+8 |
| staffFatigue >= 80 | 職員士気-8 |
| budget >= 40 | 執行部信頼-3 |
| budget <= 5 | 執行部信頼-5 |
| studentSatisfaction >= 75 | 評判+5 |
| facultyTrust >= 75 | 執行部信頼+4 |

---

## 16. 画面仕様

| 画面 | 内容 |
|---|---|
| タイトル画面 | ゲーム開始、説明、クレジット、司書さんの案内 |
| メイン画面 | 年月、パラメータ、今月の状況 |
| 方針選択画面 | 重点方針を選ぶ |
| コマンド選択画面 | AP内でコマンドを選ぶ |
| 結果画面 | コマンド結果、イベント、司書さんコメント |
| 年度末画面 | 年度評価、次年度予算、司書さんコメント |
| エンディング画面 | 総合評価、称号、司書さん最終コメント |
| ゲームオーバー画面 | 敗北理由、再挑戦ボタン |
| ヘルプ画面 | 遊び方、パラメータ説明 |

### メイン画面に表示するもの

- 現在の年月
- 残りターン数
- 予算
- 残りAP
- 主要パラメータ一覧
- 今月の季節イベント
- 選択中の重点方針
- コマンド選択ボタン
- 司書さん立ち絵
- 司書さんメッセージ
- 次月へ進むボタン

---

## 17. セーブ仕様

GitHub Pagesではサーバー保存を行わないため、localStorageを使用する。

| キー | 内容 |
|---|---|
| gameState | 現在のゲーム状態 |
| settings | 音量、表示設定など |
| achievements | 実績。初期版では任意 |
| hasSeenTutorial | チュートリアル表示済みか |

### localStorageキー案

```ts
const STORAGE_KEYS = {
  gameState: "library_sim_game_state",
  settings: "library_sim_settings",
  tutorial: "library_sim_has_seen_tutorial",
};
```

---

## 18. ディレクトリ構成案

```txt
src/
  data/
    commands.ts
    policies.ts
    seasonalEvents.ts
    randomEvents.ts
    projects.ts
    assistantMessages.ts
    endings.ts
  game/
    initialState.ts
    reducer.ts
    calculations.ts
    eventResolver.ts
    storage.ts
  components/
    TitleScreen.tsx
    MainScreen.tsx
    PolicyPanel.tsx
    CommandPanel.tsx
    StatsPanel.tsx
    AssistantCharacter.tsx
    MessageBox.tsx
    ResultModal.tsx
    YearEndScreen.tsx
    EndingScreen.tsx
    HelpScreen.tsx
  assets/
    images/
    icons/
  styles/
    globals.css
```

---

## 19. GameState案

```ts
type GameState = {
  year: number;
  month: number;
  turn: number;
  ap: number;
  selectedPolicyId: string | null;
  selectedCommandIds: string[];
  stats: GameStats;
  logs: GameLog[];
  flags: Record<string, boolean>;
  currentAssistantMessageId?: string;
  gameStatus: "title" | "playing" | "year_end" | "ending" | "game_over";
};

type GameLog = {
  turn: number;
  title: string;
  message: string;
  effects?: Partial<GameStats>;
};
```

---

## 20. 必要アセット一覧

### 必須アセット

| 種別 | ファイル名例 | 用途 | 推奨サイズ |
|---|---|---|---|
| タイトル背景 | title_bg.png | タイトル画面 | 1920x1080 |
| メイン背景 | main_bg.png | メイン画面背景 | 1920x1080 |
| 図書館外観 | library_exterior.png | 年度末・イベント背景 | 1920x1080 |
| 図書館内観 | library_interior.png | 通常画面背景 | 1920x1080 |
| 司書さん通常 | librarian_normal.png | 通常案内 | 1200x1800、透過PNG推奨 |
| 司書さん笑顔 | librarian_smile.png | 成功・良いイベント | 1200x1800、透過PNG推奨 |
| 司書さん困り顔 | librarian_worried.png | 警告・悪いイベント | 1200x1800、透過PNG推奨 |
| UIパネル | panel.png | 半透明カード背景 | 512x512 |
| ボタン | button.png | 汎用ボタン | 512x160 |

### 任意の司書さん差分

| ファイル名例 | 用途 |
|---|---|
| librarian_surprised.png | 突発イベント |
| librarian_explain.png | チュートリアル |
| librarian_cheer.png | エンディング・応援 |

### コマンド用アイコン

| 分類 | ファイル名例 | モチーフ |
|---|---|---|
| 蔵書 | icon_collection.png | 本、書架 |
| サービス | icon_service.png | カウンター、案内 |
| 広報 | icon_publicity.png | メガホン、ポスター |
| 施設 | icon_facility.png | 椅子、建物 |
| 職員 | icon_staff.png | 人、名札 |
| 研究支援 | icon_research.png | 論文、グラフ |
| 交渉 | icon_politics.png | 握手、会議 |
| DX | icon_dx.png | 端末、クラウド |
| 休養 | icon_rest.png | コーヒー、休憩 |

---

## 21. 画像生成プロンプト

### 21.1 司書さん立ち絵 共通プロンプト

既存ゲーム等で使用している「司書さん」の参照画像を添付して生成する想定。

```txt
添付画像のキャラクター「司書さん」を同一人物として再現した、大学図書館運営シミュレーションゲーム用の進行役キャラクター立ち絵。

キャラクター設定：
- 大学図書館司書
- 優しく、少し天然で親しみやすい
- 明るいが落ち着きもある
- 利用者と職員の両方に寄り添う雰囲気
- 清潔感があり、知的でやわらかい印象
- 既存の司書さんの髪型・顔立ち・雰囲気・服装の方向性を保つ
- 服装は既存設定に合わせた図書館員らしい清潔感のある服装
- ゲームUIの右下に配置しやすい、膝上から全身に近い立ち絵
- 背景透過を想定し、白背景または単色背景
- 画面に置いたときに邪魔にならない、すっきりしたシルエット
- 表情差分を作りやすい正面〜やや斜め向き
- 手元は自然なポーズ。片手を軽く添える、案内するようなポーズでもよい
- かわいいが子どもっぽくしすぎない
- 現代的な日本の大学図書館ゲームに合う雰囲気

画風：
- クリーンなゲーム用キャラクターイラスト
- 淡い色調
- やわらかい線
- 透明感
- 白と淡い青を基調
- 高品質
- 立ち絵として使いやすい
- 過度な装飾なし

出力：
- 縦長
- 背景は白または透過しやすい単色
- 1人のみ
- 文字なし
- UI素材として使える構図
```

### 21.2 通常表情

```txt
添付画像の「司書さん」を同一人物として再現。
大学図書館運営シミュレーションゲームの進行役用立ち絵。
通常表情。穏やかで親しみやすく、落ち着いた微笑み。
正面〜やや斜め向き、自然に立っている。
片手を軽く前に添える、または案内役らしく自然なポーズ。
清潔感のある大学図書館司書らしい服装。
クリーンなゲーム用キャラクターイラスト、淡い色調、白と淡い青、透明感。
背景は白または透過しやすい単色。
縦長、1人のみ、文字なし。
```

### 21.3 笑顔

```txt
添付画像の「司書さん」を同一人物として再現。
大学図書館運営シミュレーションゲームの進行役用立ち絵。
笑顔の表情。施策が成功したときや良いイベント時に使う。
嬉しそうだが大げさすぎず、やさしく明るい笑顔。
片手を軽く上げて案内するようなポーズ、または胸元で手を合わせる自然なポーズ。
既存の髪型・顔立ち・雰囲気を保つ。
清潔感のある大学図書館司書らしい服装。
クリーンなゲーム用キャラクターイラスト、淡い色調、白と淡い青、透明感。
背景は白または透過しやすい単色。
縦長、1人のみ、文字なし。
```

### 21.4 困り顔

```txt
添付画像の「司書さん」を同一人物として再現。
大学図書館運営シミュレーションゲームの進行役用立ち絵。
困り顔の表情。予算不足、職員疲労、悪いイベント、警告表示に使う。
少し心配そうだが、プレイヤーを責めない優しい雰囲気。
片手を頬に添える、または資料を持って少し考え込むような自然なポーズ。
既存の髪型・顔立ち・雰囲気を保つ。
清潔感のある大学図書館司書らしい服装。
クリーンなゲーム用キャラクターイラスト、淡い色調、白と淡い青、透明感。
背景は白または透過しやすい単色。
縦長、1人のみ、文字なし。
```

### 21.5 驚き顔

```txt
添付画像の「司書さん」を同一人物として再現。
大学図書館運営シミュレーションゲームの進行役用立ち絵。
驚きの表情。突発イベントや予想外の結果に使う。
少し目を見開き、上品で控えめな驚き方。
片手を軽く上げる、または資料を持ったまま驚いているポーズ。
既存の髪型・顔立ち・雰囲気を保つ。
清潔感のある大学図書館司書らしい服装。
クリーンなゲーム用キャラクターイラスト、淡い色調、白と淡い青、透明感。
背景は白または透過しやすい単色。
縦長、1人のみ、文字なし。
```

### 21.6 説明モード

```txt
添付画像の「司書さん」を同一人物として再現。
大学図書館運営シミュレーションゲームの進行役用立ち絵。
説明モードの表情。チュートリアルやヘルプ画面で使う。
落ち着いてわかりやすく説明している雰囲気。
片手で小さく指し示す、またはクリップボードを持って案内しているポーズ。
既存の髪型・顔立ち・雰囲気を保つ。
清潔感のある大学図書館司書らしい服装。
クリーンなゲーム用キャラクターイラスト、淡い色調、白と淡い青、透明感。
背景は白または透過しやすい単色。
縦長、1人のみ、文字なし。
```

### 21.7 応援モード

```txt
添付画像の「司書さん」を同一人物として再現。
大学図書館運営シミュレーションゲームの進行役用立ち絵。
応援モードの表情。年度末、エンディング、励ましの場面で使う。
プレイヤーをやさしく励ます、前向きで明るい表情。
両手を軽く握る、または胸元で手を合わせる自然な応援ポーズ。
既存の髪型・顔立ち・雰囲気を保つ。
清潔感のある大学図書館司書らしい服装。
クリーンなゲーム用キャラクターイラスト、淡い色調、白と淡い青、透明感。
背景は白または透過しやすい単色。
縦長、1人のみ、文字なし。
```

### 21.8 メイン背景

```txt
現代的な日本の大学図書館の運営シミュレーションゲーム用メイン背景。
明るい館内、書架、学習席、カウンター、案内サインが見える。
UIパネルと進行役キャラクターを重ねるため、背景は淡く、情報量を抑える。
白、淡い青、グレーを基調。
人物は描かない。
高品質なゲームUI背景、清潔感、透明感、落ち着いた雰囲気。
横長16:9。
```

### 21.9 タイトル背景

```txt
現代的な日本の大学図書館を舞台にした、ターン制運営シミュレーションゲームのタイトル背景。
広く明るい図書館内、整然とした書架、学習席、柔らかい自然光、白と淡い青を基調とした清潔感のある空間。
画面中央上部にタイトル文字を置ける余白を確保。
人物は描かない。
高品質なゲーム背景、少し戦略シミュレーション風、落ち着いた雰囲気。
横長16:9。
```

---

## 22. UIデザイン方針

- 清潔感のある大学図書館
- 白、淡い青、グレーを基調
- 画面は情報量が多くなりすぎないようにする
- コマンド選択はカード型にする
- パラメータはバー表示または数値表示
- 司書さんのコメントで、ゲーム状況を自然に説明する
- スマホでも最低限遊べるようにする

### PC推奨レイアウト

- 左：パラメータ
- 中央：月次レポート・コマンド
- 右：司書さん
- 下：ログ・メッセージ

### スマホ推奨レイアウト

- 上：年月・予算・AP
- 中：コマンドカード
- 下：司書さんメッセージ
- パラメータは折りたたみ表示でもよい

---

## 23. 実装マイルストーン

### Milestone 1：静的画面

- タイトル画面を作る
- メイン画面を作る
- パラメータを表示する
- コマンド一覧を表示する
- 司書さんの仮表示領域を作る

### Milestone 2：ターン進行

- コマンドを選択できる
- AP制限を実装する
- 実行するとパラメータが変化する
- 次月へ進む
- 司書さんの月初コメントを表示する

### Milestone 3：イベント

- 月別イベントを表示する
- ランダムイベントを発生させる
- ログを表示する
- イベントに応じて司書さんの表情を変える

### Milestone 4：年度末・エンディング

- 12か月ごとに年度末処理
- 36ターン終了で評価表示
- 敗北条件を実装する
- 評価に応じた司書さんコメントを表示する

### Milestone 5：GitHub Pages対応

- Viteのbase設定を確認
- `npm run build` が通るようにする
- 画像パスを確認
- GitHub Pagesに公開できるようにする
- 必要に応じてGitHub Actionsを追加する

---

## 24. Codexに渡す実装依頼文 完成版

以下をそのままCodexに渡す。

```txt
React + TypeScript + Viteで、GitHub Pages公開を前提にした小規模なターン制大学図書館運営シミュレーションゲームを作成してください。

ゲームタイトルは「University Library Maker」とします。

## 重要な前提

- GitHub Pagesで公開できる静的Webアプリとして実装してください。
- バックエンドは使用しません。
- 外部APIも使用しません。
- セーブデータはlocalStorageに保存してください。
- npm run build で dist が生成されるようにしてください。
- Viteのbase設定はGitHub Pagesで公開しやすいようにしてください。リポジトリ名は仮に library-management-sim とします。
- ルーティングは複雑にせず、単一ページ内の画面切り替えで実装してください。React Routerを使う場合はHashRouterを使ってください。
- 画像がなくても動作するようにし、後から画像を追加できる構成にしてください。
- UIはPCとスマホの両方で最低限遊べるレスポンシブにしてください。

## ゲーム概要

プレイヤーは大学図書館の運営責任者です。
1ターンは1か月、全36ターンです。
毎月3APを使ってコマンドを選択し、学生満足度、教員信頼、予算、職員疲労、研究支援力などのパラメータを変化させます。
36ターン終了時に総合スコアを計算し、S〜Eの評価ランクを表示してください。
途中で敗北条件を満たした場合はゲームオーバーにしてください。

## 必須ルール

- 1ターンは1か月
- 開始は1年目4月
- 終了は3年目3月
- 毎月3AP
- コマンドにはAPコスト、予算コスト、効果があります
- 毎月、重点方針を1つ選びます
- 方針によってコマンド効果に補正がかかります
- 月別の季節イベントを表示してください
- 毎月30%程度の確率でランダムイベントを発生させてください
- 12か月ごとに年度末処理を行ってください
- 36ターン終了時にエンディングを表示してください

## 主要パラメータ

以下のパラメータを0〜100で管理してください。budgetだけは年度内の予算として扱います。

- budget: 初期値100
- collection: 初期値50
- studentSatisfaction: 初期値50
- facultyTrust: 初期値50
- executiveTrust: 初期値45
- publicity: 初期値40
- staffMorale: 初期値55
- staffFatigue: 初期値20
- facility: 初期値45
- researchSupport: 初期値40
- dx: 初期値35
- reputation: 初期値50

staffFatigueは高いほど悪い値です。
各値は基本的に0〜100に丸めてください。
budgetはマイナスになる可能性がありますが、-20以下で財政破綻にしてください。

## 重点方針

以下の方針を実装してください。

- student_first: 学生第一。学生満足度に関わる効果+20%
- research_focus: 研究支援重視。教員信頼・研究支援に関わる効果+20%
- publicity_focus: 広報強化。広報力・評判に関わる効果+20%
- staff_care: 職員保護。疲労増加を30%軽減
- reform_push: 改革推進。DX・施設・研究支援の効果+15%、疲労増加+10%
- budget_saving: 財政再建。予算消費-20%、満足度上昇効果-10%

## コマンド

以下のコマンドを実装してください。

1. buy_books: 図書を重点購入。AP1、予算8、疲労+2、collection+6、studentSatisfaction+2
2. trial_database: データベース試験導入。AP2、予算15、疲労+4、researchSupport+8、facultyTrust+5
3. review_journals: 雑誌契約を見直す。AP2、予算-8、疲労+5、budget+8、facultyTrust-3、researchSupport-2
4. guidance: 図書館ガイダンス。AP2、予算4、疲労+6、studentSatisfaction+8、publicity+4
5. reference_boost: レファレンス強化。AP2、予算3、疲労+7、facultyTrust+5、researchSupport+6
6. long_loan: 長期貸出キャンペーン。AP1、予算2、疲労+3、studentSatisfaction+5、publicity+3
7. sns: SNS投稿強化。AP1、予算1、疲労+2、publicity+6、reputation+2
8. seasonal_exhibit: 季節展示。AP1、予算4、疲労+4、publicity+5、studentSatisfaction+3、reputation+2
9. poster: ポスター刷新。AP1、予算3、疲労+2、publicity+5
10. seats: 座席を増やす。AP2、予算12、疲労+4、facility+8、studentSatisfaction+5
11. signage: サイン計画改善。AP2、予算8、疲労+3、facility+6、studentSatisfaction+4
12. air_conditioning: 空調改善。AP3、予算22、疲労+5、facility+14、studentSatisfaction+8、reputation+3
13. staff_training: 職員研修。AP1、予算5、疲労+2、staffMorale+4、researchSupport+3、dx+2
14. workflow_review: 業務見直し。AP2、予算3、疲労-8、staffFatigue-8、staffMorale+5
15. faculty_visit: 学部長訪問。AP2、予算2、疲労+4、facultyTrust+7、executiveTrust+3
16. student_survey: 学生アンケート。AP1、予算1、疲労+3、studentSatisfaction+2、publicity+2
17. oa_workshop: OA説明会。AP2、予算5、疲労+6、researchSupport+8、facultyTrust+5
18. repository: 機関リポジトリ強化。AP3、予算10、疲労+8、researchSupport+10、reputation+5、dx+3
19. opac: OPAC改善。AP2、予算10、疲労+5、dx+8、studentSatisfaction+4、facultyTrust+2
20. automation: 業務自動化。AP3、予算16、疲労+6、dx+10、staffFatigue-6、staffMorale+4
21. rest: 職員を休ませる。AP1、予算0、疲労-10、staffFatigue-10、staffMorale+2

注意：予算消費と疲労変動が重複しないよう、実装しやすい形に整理してください。

## 季節イベント

月ごとに以下を表示し、可能なら効果補正も実装してください。

- 4月: 新入生シーズン。ガイダンス、SNS、サイン改善の効果+20%
- 5月: レポート課題増加。レファレンス、図書購入の効果+10%
- 6月: 梅雨の本濡れ注意。広報系コマンドをしないと評判-2
- 7月: 試験期。疲労+3
- 8月: 夏季休業。施設改善・業務見直しの効果+15%
- 9月: 後期準備。図書購入、ガイダンスの効果+10%
- 10月: 学園祭。展示・SNSの効果+20%
- 11月: 卒論相談期。レファレンス・研究支援の効果+15%
- 12月: 予算執行確認。予算が40以上余っていると執行部信頼-3
- 1月: 冬の試験期。施設系効果+10%
- 2月: 入試・休館対応。広報・施設・業務見直しの効果+10%
- 3月: 年度末評価。次年度予算と評価を計算

## ランダムイベント

毎月30%程度の確率で1つ発生させてください。

良いイベント：
- viral_post: SNS投稿が話題に。publicity+5、reputation+3
- faculty_praise: 教員が授業で図書館を紹介。facultyTrust+4、studentSatisfaction+3
- student_volunteers: 学生ボランティア参加。publicity+3、staffFatigue-3
- local_news: 展示が地域ニュースに掲載。reputation+6、publicity+3
- donation: 良い寄贈資料が届く。collection+5、reputation+2

悪いイベント：
- price_hike: 電子ジャーナル価格高騰。budget-8
- ac_trouble: 空調トラブル。facility-6、studentSatisfaction-4
- system_down: システム障害。dx-4、reputation-3、staffFatigue+4
- complaint: 騒音苦情。studentSatisfaction-3、reputation-2
- staff_absence: 職員の急な欠員。staffFatigue+8
- wet_books: 本の水濡れトラブル。collection-3、reputation-2

## 進行役キャラクター「司書さん」

ゲームには進行役キャラクターとして「司書さん」を表示してください。

初期実装では画像がなくても成立するように、画像ファイルが存在しない場合はプレースホルダーを表示してください。

司書さんの役割：
- タイトル画面で案内
- 月初コメント
- コマンド選択時の簡単な助言
- 結果画面のコメント
- 警告コメント
- 年度末コメント
- エンディングコメント
- ゲームオーバーコメント

表示：
- PCでは右下または右側に表示
- スマホでは画面下部に表示
- メッセージボックスと組み合わせる
- 表情IDは normal, smile, worried, surprised, explain, cheer を想定
- 初期実装では normal, smile, worried の3種類だけでもよい

画像ファイル名は以下を想定してください。
- librarian_normal.png
- librarian_smile.png
- librarian_worried.png
- librarian_surprised.png
- librarian_explain.png
- librarian_cheer.png

画像は src/assets/images/ または public/assets/images/ に置けるようにしてください。

## 評価計算

36ターン終了時に以下の式でscoreを計算してください。

score =
  collection * 0.10 +
  studentSatisfaction * 0.15 +
  facultyTrust * 0.15 +
  executiveTrust * 0.10 +
  publicity * 0.08 +
  staffMorale * 0.10 +
  (100 - staffFatigue) * 0.10 +
  facility * 0.08 +
  researchSupport * 0.10 +
  dx * 0.07 +
  reputation * 0.12

評価ランク：
- 90以上: S 伝説の図書館
- 80〜89: A 学内に信頼された図書館
- 65〜79: B 堅実な図書館
- 50〜64: C 課題は多いが運営継続
- 35〜49: D 改革が必要
- 34以下: E 運営危機

## 敗北条件

以下のいずれかを満たしたらゲームオーバーにしてください。

- budget <= -20: 財政破綻
- staffFatigue >= 100: 職員崩壊
- reputation <= 0: 信頼喪失
- studentSatisfaction <= 0: 学生離れ
- facultyTrust <= 0: 教員からの信頼喪失

## 年度末処理

毎年3月に年度末処理を行ってください。

次年度予算：
nextBudget =
  100
  + Math.floor((executiveTrust - 50) / 5)
  + Math.floor((reputation - 50) / 5)
  + Math.floor((studentSatisfaction - 50) / 10)
  + Math.floor((facultyTrust - 50) / 10)

年度末ボーナス・ペナルティ：
- reputation >= 70: 次年度予算+5
- executiveTrust >= 70: 次年度予算+8
- staffFatigue >= 80: staffMorale-8
- budget >= 40: executiveTrust-3
- budget <= 5: executiveTrust-5
- studentSatisfaction >= 75: reputation+5
- facultyTrust >= 75: executiveTrust+4

## UI

必要な画面：
- タイトル画面
- メイン画面
- 方針選択
- コマンド選択
- 結果表示
- 年度末評価画面
- エンディング画面
- ゲームオーバー画面
- ヘルプ画面

メイン画面に表示するもの：
- 年月
- 残りターン
- 予算
- 残りAP
- パラメータ一覧
- 今月の季節イベント
- 選択中の重点方針
- コマンドカード
- 実行ボタン
- 選択解除ボタン
- 司書さん立ち絵
- 司書さんメッセージ
- ログ

## ディレクトリ構成

できれば以下のようにしてください。

src/
  data/
    commands.ts
    policies.ts
    seasonalEvents.ts
    randomEvents.ts
    assistantMessages.ts
    endings.ts
  game/
    initialState.ts
    reducer.ts
    calculations.ts
    eventResolver.ts
    storage.ts
  components/
    TitleScreen.tsx
    MainScreen.tsx
    PolicyPanel.tsx
    CommandPanel.tsx
    StatsPanel.tsx
    AssistantCharacter.tsx
    MessageBox.tsx
    ResultModal.tsx
    YearEndScreen.tsx
    EndingScreen.tsx
    HelpScreen.tsx
  styles/
    globals.css

## 仕上げ

- まずはプレイ可能な状態を優先してください。
- 画像がなくても動くようにしてください。
- TypeScriptの型を適切に定義してください。
- npm run build が成功する状態にしてください。
- READMEにローカル起動方法とGitHub Pages公開方法を簡単に書いてください。
```

---

## 25. 最初に作るべき最小版

最初の実装では、以下だけでよい。

- 36ターン制
- 3AP制
- 重点方針6種類
- コマンド21種類
- 基本パラメータ12種類
- 月別イベント12種類
- ランダムイベント11種類
- 年度末評価
- エンディング評価
- ゲームオーバー
- 司書さん進行役
- localStorage保存
- GitHub Pages対応

この範囲なら、比較的小さなブラウザゲームとして実装できる。完成後に、職員・マップ・シナリオ・画像演出を追加する。
