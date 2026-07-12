# University Library Maker

React + TypeScript + Viteで作った、大学図書館運営シミュレーションゲームです。

- 1ターン1か月、全36ターン
- 毎月3APで重点方針とコマンドを選択
- 季節イベント、ランダムイベント、年度末評価あり
- セーブデータはブラウザの`localStorage`に保存
- バックエンド、外部APIなし

## ローカル起動

Node.js 22系以上を推奨します。

```bash
npm install
npm run dev
```

表示されたURLをブラウザで開きます。

## ビルド

```bash
npm run build
```

`dist/`が生成されます。

## GitHub Pages公開

このリポジトリ名を`library-management-sim`とする想定で、`vite.config.ts`に以下を設定しています。

```ts
base: "/library-management-sim/",
```

リポジトリ名を変える場合は、この`base`も合わせて変更してください。

GitHub Pagesでは、GitHub Actionsで`npm ci`、`npm run build`を実行し、生成された`dist/`を公開します。手動で公開する場合も、`dist/`配下をPagesの公開対象にしてください。

## 画像アセット

司書さん画像はなくても動きます。後から追加する場合は、以下のファイル名で`public/assets/images/`に置いてください。

- `librarian_normal.png`
- `librarian_smile.png`
- `librarian_worried.png`
- `librarian_surprised.png`
- `librarian_explain.png`
- `librarian_cheer.png`
