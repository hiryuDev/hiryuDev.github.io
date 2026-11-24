# 航海日誌 ― ゲームプログラマー ポートフォリオ

「古びた海賊の航海日誌」をテーマにしたポートフォリオサイトです。
ビルド不要の素の HTML / CSS / JavaScript なので、GitHub Pages にそのまま置けます。

作品はまだ1件も入っていません。`admin.html`（自分専用の編集画面）か、`data/works.json` の直接編集で追加してください。

---

## ファイル構成

```
index.html        トップ（表紙 → プロフィール / 作品一覧 / スキル / 連絡先）
work.html         作品の詳細ページ（work.html?id=作品ID）
admin.html        船長室＝自分専用の編集画面（サイトからはリンクしていません）

data/site.json    プロフィール・インターンシップ・スキル・連絡先・外部リンク・画面の文章
data/works.json   作品の一覧（いまは空っぽ = []）

css/style.css     サイトの見た目（色や文字は先頭の :root で一括変更）
css/admin.css     編集画面の見た目
js/common.js      共通の小道具（JSON読み込み、要素生成など）
js/main.js        トップページの処理（表紙アニメ、描画、目次）
js/work.js        詳細ページの処理（動画、ギャラリー、前後リンク）
js/admin.js       編集画面の処理（GitHub API で保存）

images/icons.svg  ドクロ・錨・羅針盤・宝箱などの装飾（すべてオリジナル）
images/fx/         あらかじめ書き出した質感・影・封蝋などの画像（表示を軽くするため）
images/works/     作品の画像を置く場所（作品IDごとにフォルダ）
images/profile/   プロフィール画像を置く場所
favicon.svg       タブのアイコン
.nojekyll         GitHub Pages に「そのまま配信して」と伝える空ファイル
```

---

## 1. GitHub Pages で公開する

1. GitHub で新しいリポジトリを作ります。
   - 名前を **`hiryuDev.github.io`** にすると `https://hiryudev.github.io/` で公開されます。
   - 別の名前（例：`portfolio`）なら `https://hiryudev.github.io/portfolio/` になります。どちらでも動きます。
   - Public にしてください（無料プランの Pages は Public リポジトリが対象です）。
2. このフォルダの中身を丸ごと push します。
   ```bash
   cd portfolio
   git init
   git add .
   git commit -m "航海日誌をはじめる"
   git branch -M main
   git remote add origin https://github.com/hiryuDev/hiryuDev.github.io.git
   git push -u origin main
   ```
3. リポジトリの **Settings → Pages → Build and deployment** で
   Source を **Deploy from a branch**、Branch を **main / (root)** にして Save。
4. 1〜2分待つと公開されます。

公開URLが決まったら、`index.html` の `og:url` を書き換えておくとSNSで共有したときにきれいに出ます。

---

## 2. 作品を追加・編集する

### A. 編集画面（admin.html）を使う ― おすすめ

ブラウザだけで作品の追加・並べ替え・公開/非公開・画像アップロードができます。
保存すると GitHub のリポジトリに直接コミットされ、1〜2分でサイトに反映されます。

**保存できるのは、あなたのトークンを持っている人だけ**です。
`admin.html` 自体は誰でも開けますが、トークンがなければ何も書き込めません（検索エンジンにも出ないよう noindex 済み）。

#### 編集画面の準備（最初の1回だけ）

1. GitHub 右上のアイコン → **Settings** → 左下 **Developer settings**
   → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
2. 設定：
   - **Token name**：`portfolio-admin` など
   - **Expiration**：好きな期限（切れたら作り直せばOK）
   - **Repository access**：**Only select repositories** → ポートフォリオのリポジトリだけ選ぶ
   - **Permissions → Repository permissions → Contents**：**Read and write**
3. 作成された `github_pat_…` をコピー（この画面を閉じると二度と見られません）
4. `https://hiryudev.github.io/admin.html` を開き、ユーザー名・リポジトリ名・ブランチ（`main`）とトークンを入れて「接続する」

#### 注意

- トークンはパスワードと同じです。**コミットしたり、人に見せたりしない**でください。
- 「このブラウザに記憶する」は自分専用のPCのときだけ。学校のPCではチェックを外してください（タブを閉じると消えます）。
- 漏れたかも？と思ったら、GitHub の同じ画面でトークンを削除すれば即無効になります。
- 下書きのまま確認したいときは「サイトに公開する」を外して保存し、`work.html?id=作品ID&draft=1` で見られます。

### B. JSON を直接書く

`data/works.json` に作品を足して push するだけでも反映されます（GitHub のWeb画面で編集してもOK）。
1件分のひな形：

```json
[
  {
    "id": "machine-buster",
    "published": true,
    "featured": true,
    "title": "作品タイトル",
    "subtitle": "サブタイトル",
    "genre": "3Dアクション",
    "thumbnail": "images/works/machine-buster/thumb.jpg",
    "summary": "一覧に出る一言紹介",
    "period": "2026.04 〜 2026.07（約3か月）",
    "team": "4人チーム（プログラマー2・デザイナー2）",
    "role": "メインプログラマー",
    "platform": "Windows",
    "languages": ["C++", "HLSL"],
    "tech": ["DirectX 11", "Photon Realtime"],
    "tools": ["Visual Studio", "Git"],
    "description": "作品紹介。\n改行もそのまま表示されます。",
    "responsibilities": ["プレイヤー制御", "敵AI", "通信同期"],
    "highlights": [
      { "title": "工夫の見出し", "body": "何をどう工夫したか" }
    ],
    "challenges": [
      { "problem": "ぶつかった課題", "solution": "どう解決したか" }
    ],
    "outlook": {
      "next": "この作品で次に改善・追加したいこと",
      "carry": "次の作品で活かしたいこと"
    },
    "ai": {
      "none": false,
      "uses": [
        { "area": "コードレビュー・デバッグ相談", "tool": "ChatGPT", "detail": "どこまでAIを使ったか" }
      ]
    },
    "video": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
    "screenshots": [
      { "src": "images/works/machine-buster/ss1.jpg", "caption": "説明" }
    ],
    "links": [
      { "label": "GitHub", "url": "https://github.com/hiryuDev/xxxx" }
    ]
  }
]
```

- 空の項目はページに出ません。必要な項目だけ埋めればOKです。
- `ai` は AI の使用表示です。`uses` に書くと一覧に「AI使用」、AIを使っていないなら `"none": true` で「AI不使用」と出ます。両方空ならタグは出ません。
- 並び順 = 表示順です。
- 作品が3件以上・技術タグが2種類以上になると、一覧の上に「技術で絞り込む」ボタンが自動で出ます。
- 動画は YouTube（限定公開でも可）を推奨。リポジトリに mp4 を入れると重くなります。

---

## 3. 手元で確認する

`index.html` をダブルクリックで開くと、ブラウザの制限で JSON が読めず中身が空になります。
簡易サーバーを立てて開いてください。

```bash
cd portfolio
python -m http.server 8000
# → ブラウザで http://localhost:8000/
```

VS Code なら拡張機能「Live Server」で `index.html` を開くのが手軽です。

---

## 4. カスタマイズのヒント

| やりたいこと | 触る場所 |
| --- | --- |
| 色を変える | `css/style.css` 冒頭の `--crimson` `--gold` `--parchment` など |
| 文字（フォント）を変える | 各HTMLの Google Fonts の `<link>` と、`--f-display` `--f-body` |
| ページ（章）を増やす | `index.html` の `<section class="sheet">` を複製し、目次と航海図の島を足す |
| インターンシップを追加する | 船長室の「プロフィール・スキル・連絡先」タブ →「インターンシップ」（1件も無ければページごと非表示） |
| 作品の入力項目を増やす | `js/admin.js` の `WORK_FIELDS` に1行足す → `js/work.js` の `render()` に表示を足す |
| 紙や革の質感・封蝋・金貨の見た目を変える | `images/fx/` の画像を差し替える（同じ名前・同じくらいの大きさで） |
| 飾りの絵を変える・足す | `images/icons.svg` に `<symbol id="i-xxx">` を足し、`<use href="images/icons.svg#i-xxx">` で使う |
| 表紙・見出し・トップの文章 | 船長室の「プロフィール・スキル・連絡先」タブ →「画面の文章」（`data/site.json` の `texts`） |
| 編集画面を置きたくない | `admin.html` `css/admin.css` `js/admin.js` を消すだけ（サイト側は影響なし） |

- 表紙は同じタブで一度開くと、次からは自動で飛ばします（フッターの「表紙をもう一度見る」で再生）。
- OS の「視差効果を減らす／アニメーションを減らす」設定がオンの人には、表紙やページめくりの動きを出しません。
- 作品ページ間の「ページをめくる」切り替えは View Transitions 対応ブラウザ（Chrome / Edge など）で動きます。非対応ブラウザでは普通に切り替わります。

---

## 5. 権利まわりのメモ

- サイト内の装飾（ドクロ、錨、羅針盤、宝箱、封蝋、角飾りなど）はこのサイト用に描いたオリジナルの SVG です。
- フォントは Google Fonts（Shippori Mincho / Shippori Mincho B1 / IM Fell English / Pirata One、いずれも SIL Open Font License）を読み込んでいます。
- 宝鐘マリンさん・ホロライブの画像、ロゴ、衣装やシルエットなどは使っていません。今後素材を足すときも、自作か利用規約を確認したものだけにしてください。
