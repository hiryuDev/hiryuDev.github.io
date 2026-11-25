/* =========================================================
   船長室（admin.html）
   GitHub の API を使って data/*.json と画像を直接リポジトリに保存する。
   トークンを持つ人だけが保存できる。トークンはブラウザ内にだけ置く。

   ■ 入力欄を増やしたいとき
     下の WORK_FIELDS / SITE_FIELDS に1行足すだけでフォームに出ます。
     表示側（js/main.js, js/work.js）にも描画を足してください。
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 作品の分類（作品一覧のタブ）。js/common.js の PLATFORMS と同じものを書く ---------- */
  const PLATFORMS = [
    { id: 'switch', label: 'Switch' },
    { id: 'unityroom', label: 'unityroom' },
    { id: 'directx', label: 'DirectX' },
  ];

  /* ---------- 入力項目の定義 ---------- */
  // type: text / url / textarea / lines(1行1項目の配列) / tags(カンマ区切りの配列)
  //       checkbox / level(0〜5) / image / group(入れ子) / objects(行を増やせる表)
  const WORK_FIELDS = [
    { key: 'id', label: '作品ID', type: 'text', required: true, pattern: '^[a-z0-9][a-z0-9-]*$',
      help: 'URLに使われます（work.html?id=○○）。半角英小文字・数字・ハイフンのみ。あとから変えるとURLも変わります。' },
    { key: 'published', label: 'サイトに公開する', type: 'checkbox', default: true },
    { key: 'featured', label: '注目作品として★を付ける', type: 'checkbox' },
    { key: 'title', label: 'タイトル', type: 'text', required: true },
    { key: 'subtitle', label: 'サブタイトル・キャッチコピー', type: 'text' },
    { key: 'genre', label: 'ジャンル', type: 'text', placeholder: '3Dアクション / タワーディフェンス など' },
    { key: 'stage', label: '作品の状態（タグ）', type: 'text', placeholder: 'プロトタイプ',
      options: ['完成', '開発中', 'プロトタイプ', 'デモ版', '技術デモ', 'ゲームジャム作品'],
      help: '一覧と詳細ページにスタンプのように表示されます。候補から選ぶか、自由に入力できます。空なら表示されません。' },
    { key: 'platforms', label: '分類（作品一覧のタブ）', type: 'checks', options: PLATFORMS,
      help: '当てはまるものに全部チェック。作品一覧の上のタブで切り替えられるようになります。' },
    { key: 'playUrl', label: '遊べるURL（unityroom など）', type: 'url', placeholder: 'https://unityroom.com/games/…',
      help: '入れると一覧と作品ページに「unityroomで遊ぶ」ボタンが出ます。' },
    { key: 'thumbnail', label: 'サムネイル画像', type: 'image', dir: (ctx) => `images/works/${ctx.id || 'misc'}`,
      help: '16:9 の画像がきれいに収まります。jpg / png / webp 推奨、1MB程度まで。' },
    { key: 'summary', label: '一言紹介（一覧に表示）', type: 'textarea', rows: 2 },
    { key: 'period', label: '制作期間', type: 'text', placeholder: '2026.04 〜 2026.07（約3か月）' },
    { key: 'team', label: '制作体制', type: 'text', placeholder: '個人制作 / 4人チーム（プログラマー2・デザイナー2）' },
    { key: 'role', label: '自分の役割', type: 'text', placeholder: 'メインプログラマー' },
    { key: 'platform', label: '対応環境', type: 'text', placeholder: 'Windows / PC' },
    { key: 'languages', label: '使用言語', type: 'tags', placeholder: 'C++, HLSL' },
    { key: 'tech', label: '技術・ライブラリ・エンジン', type: 'tags', placeholder: 'DirectX 11, Photon Realtime' },
    { key: 'tools', label: '開発環境・ツール', type: 'tags', placeholder: 'Visual Studio, Git' },
    { key: 'ai', label: 'AIの使用', type: 'group',
      help: '何にAIを使ったかを書くと、一覧に「AI使用」タグ、詳細ページに内容が出ます。どちらも空ならタグは出ません。', fields: [
      { key: 'none', label: 'この作品ではAIを使用していない（「AI不使用」と表示）', type: 'checkbox' },
      { key: 'uses', label: 'AIを使った箇所', type: 'objects', addLabel: '使った箇所を追加', fields: [
        { key: 'area', label: '何に使ったか', type: 'text', placeholder: 'コード生成',
          options: ['コード生成', 'コードレビュー・デバッグ相談', '設計の相談', '画像・テクスチャ', '3Dモデル', 'BGM・効果音', '文章・テキスト', '翻訳'] },
        { key: 'tool', label: '使ったAI', type: 'text', placeholder: 'ChatGPT',
          options: ['ChatGPT', 'Claude', 'GitHub Copilot', 'Gemini', 'Cursor', 'Stable Diffusion', 'Midjourney'] },
        { key: 'detail', label: '具体的な内容・範囲', type: 'textarea', rows: 2,
          placeholder: '例：シェーダーの雛形を生成し、ライティングの計算は自分で書き直した' },
      ] },
    ] },
    { key: 'description', label: '作品紹介（詳細ページ）', type: 'textarea', rows: 6 },
    { key: 'responsibilities', label: '担当した箇所（1行に1つ）', type: 'lines', rows: 5 },
    { key: 'highlights', label: '技術的な工夫', type: 'objects', addLabel: '工夫を追加',
      fields: [{ key: 'title', label: '見出し', type: 'text' }, { key: 'body', label: '説明', type: 'textarea', rows: 4 }] },
    { key: 'challenges', label: '課題と解決', type: 'objects', addLabel: '課題を追加',
      fields: [{ key: 'problem', label: '課題', type: 'textarea', rows: 3 }, { key: 'solution', label: 'どう解決したか', type: 'textarea', rows: 3 }] },
    { key: 'outlook', label: '今後の展望', type: 'group', help: '空欄の項目は詳細ページに出ません。', fields: [
      { key: 'next', label: '次はこうしたい（この作品で改善・追加したいこと）', type: 'textarea', rows: 4,
        placeholder: '例：敵AIの行動パターンを増やしたい。ロード時間を短くするため、アセットの読み込みを非同期にしたい。' },
      { key: 'carry', label: '次の作品で活かしたいこと', type: 'textarea', rows: 4,
        placeholder: '例：今回作ったECSの仕組みを、就職作品の大量の敵の処理に使いたい。' },
    ] },
    { key: 'video', label: '動画（YouTubeのURL、または mp4 のパス）', type: 'url', placeholder: 'https://www.youtube.com/watch?v=…',
      help: '動画ファイルはリポジトリが重くなるので、YouTube（限定公開でも可）を推奨します。' },
    { key: 'screenshots', label: 'スクリーンショット', type: 'objects', addLabel: '画像を追加',
      fields: [{ key: 'src', label: '画像', type: 'image', dir: (ctx) => `images/works/${ctx.id || 'misc'}` }, { key: 'caption', label: '説明文', type: 'text' }] },
    { key: 'links', label: '外部リンク', type: 'objects', addLabel: 'リンクを追加',
      fields: [{ key: 'label', label: '表示名', type: 'text', placeholder: 'GitHub / Steam / itch.io / ダウンロード' }, { key: 'url', label: 'URL', type: 'url' }] },
  ];

  const SITE_FIELDS = [
    { key: 'profile', label: 'プロフィール', type: 'group', fields: [
      { key: 'name', label: '名前', type: 'text' },
      { key: 'nameEn', label: '名前（英字）', type: 'text' },
      { key: 'role', label: '志望職種', type: 'text' },
      { key: 'catchphrase', label: 'キャッチコピー（トップに表示）', type: 'text' },
      { key: 'school', label: '所属', type: 'text' },
      { key: 'graduation', label: '卒業', type: 'text' },
      { key: 'portrait', label: '肖像画像（アイコンや自作イラストなど）', type: 'image', dir: () => 'images/profile', placeholder: 'images/profile/画像.jpg',
        help: '縦長（4:5）がきれいに収まります。空なら舵の飾りが出ます。' },
      { key: 'bio', label: '自己紹介', type: 'textarea', rows: 6 },
      { key: 'likes', label: '好きなもの・興味（1行に1つ）', type: 'lines', rows: 4 },
    ] },
    { key: 'internships', label: 'インターンシップ', type: 'objects', addLabel: 'インターンシップを追加',
      help: '上にあるものから順に表示されます（新しいものを上に）。1件も無ければページごと表示されません。社名やプログラムの内容を公開してよいか、念のため確認してから書いてください。',
      fields: [
        { key: 'company', label: '企業名', type: 'text', placeholder: '株式会社〇〇' },
        { key: 'program', label: 'プログラム名・職種', type: 'text', placeholder: 'ゲームプログラマー 職業体験インターンシップ' },
        { key: 'period', label: '時期・期間', type: 'text', placeholder: '2026年8月（5日間）' },
        { key: 'format', label: '形式', type: 'text', placeholder: '対面', options: ['対面', 'オンライン', '対面・オンライン併用'] },
        { key: 'content', label: '内容', type: 'textarea', rows: 3, placeholder: '例：チームで小規模なゲームを企画から制作し、最終日に発表した' },
        { key: 'work', label: '自分が取り組んだこと', type: 'textarea', rows: 3, placeholder: '例：プレイヤーの移動と当たり判定を担当した' },
        { key: 'learned', label: '学んだこと・気づき', type: 'textarea', rows: 3, placeholder: '例：レビューで指摘を受けて、読みやすいコードの書き方を意識するようになった' },
        { key: 'url', label: '関連リンク（任意）', type: 'url', placeholder: 'https://' },
      ] },
    { key: 'skills', label: 'スキル', type: 'objects', addLabel: '分類を追加', help: '習熟度を「表示しない」にすると金貨が出ません。',
      fields: [
        { key: 'category', label: '分類名', type: 'text', placeholder: '言語 / ライブラリ・エンジン / ツール' },
        { key: 'items', label: '項目', type: 'objects', addLabel: '項目を追加', fields: [
          { key: 'name', label: '名前', type: 'text' },
          { key: 'level', label: '習熟度', type: 'level' },
          { key: 'note', label: 'ひとこと（使った作品・できることなど）', type: 'text' },
        ] },
      ] },
    { key: 'contact', label: '連絡先', type: 'group', fields: [
      { key: 'email', label: 'メールアドレス', type: 'text', help: '空ならメールボタンは出ません。' },
      { key: 'message', label: 'メッセージ', type: 'textarea', rows: 2 },
    ] },
    { key: 'links', label: '外部リンク（GitHub・X など）', type: 'objects', addLabel: 'リンクを追加',
      fields: [{ key: 'label', label: '表示名', type: 'text' }, { key: 'url', label: 'URL', type: 'url' }] },
    { key: 'texts', label: '画面の文章（表紙・見出しなど）', type: 'group',
      help: '最初から入っているのが今サイトに出ている文章です。空欄にするとその文章は表示されません。', fields: [
      { key: 'brand', label: 'サイト名（左上のロゴ横・ページ上部）', type: 'text', default: 'ゲーム開発ポートフォリオ' },
      { key: 'cover', label: '表紙', type: 'group', fields: [
        { key: 'latin', label: '上の英字', type: 'text', default: 'Game Developer Portfolio' },
        { key: 'title', label: 'タイトル', type: 'text', default: '制作ポートフォリオ' },
        { key: 'sub', label: 'タイトル下の説明', type: 'text', default: 'ゲームプログラマーの制作記録' },
        { key: 'page', label: '表紙をめくった1ページ目の文', type: 'textarea', rows: 3,
          default: 'このポートフォリオをご覧いただき、ありがとうございます。\nここには、これまでに制作した作品や、開発を通じて学んだ技術、取り組んできたことをまとめています。\n一つひとつの制作経験を大切にしながら、技術と表現の幅を広げてきた記録です。' },
        { key: 'hint', label: '表紙の下の案内', type: 'text', default: '表紙をクリックしてポートフォリオを見る' },
      ] },
      { key: 'intro', label: 'トップ（序のページ）', type: 'group', fields: [
        { key: 'latin', label: '名前の上の英字', type: 'text', default: 'Game Programmer Portfolio' },
        { key: 'lead', label: '名前の下の紹介文（任意）', type: 'textarea', rows: 3, default: 'ゲーム開発を通じて、アイデアを形にすることを目指しています。これまでの制作実績や使用技術、開発への取り組みを紹介します。',
          help: 'キャッチコピーと所属の下に出ます。空なら出ません。名前・志望・キャッチコピー・所属は「プロフィール」で編集します。' },
      ] },
      { key: 'chapters', label: '各ページの見出し（航海図の島の名前も同じものを使います）', type: 'group', fields: [
        { key: 'profile', label: 'プロフィールのページ', type: 'group', fields: [
          { key: 'title', label: '見出し', type: 'text', default: '自己紹介' },
          { key: 'plain', label: '小さい補足', type: 'text', default: 'プロフィール' } ] },
        { key: 'works', label: '作品のページ', type: 'group', fields: [
          { key: 'title', label: '見出し', type: 'text', default: '制作実績' },
          { key: 'plain', label: '小さい補足', type: 'text', default: '制作したゲーム・作品' } ] },
        { key: 'internship', label: 'インターンシップのページ', type: 'group', fields: [
          { key: 'title', label: '見出し', type: 'text', default: 'インターンシップ' },
          { key: 'plain', label: '小さい補足', type: 'text', default: '参加した就業体験' } ] },
        { key: 'skills', label: 'スキルのページ', type: 'group', fields: [
          { key: 'title', label: '見出し', type: 'text', default: '技術・スキル' },
          { key: 'plain', label: '小さい補足', type: 'text', default: '使用技術・開発環境' } ] },
        { key: 'contact', label: '連絡先のページ', type: 'group', fields: [
          { key: 'title', label: '見出し', type: 'text', default: 'お問い合わせ' },
          { key: 'plain', label: '小さい補足', type: 'text', default: 'ご連絡はこちら' } ] },
      ] },
      { key: 'worksEmpty', label: '作品が0件のときの文', type: 'group', fields: [
        { key: 'title', label: '見出し', type: 'text', default: '現在、掲載できる作品はありません' },
        { key: 'text', label: '説明', type: 'text', default: '現在、制作実績を整理しています。公開可能な作品から順次追加していく予定です。' },
      ] },
      { key: 'footer', label: 'いちばん下のひとこと', type: 'text', default: 'ご覧いただきありがとうございました。' },
    ] },
  ];

  /* ---------- 小道具 ---------- */
  const $ = (id) => document.getElementById(id);
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    return el;
  }
  let uid = 0;
  const nextId = () => `f${++uid}`;
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function toast(msg, kind) {
    const t = $('toast');
    t.textContent = msg;
    t.className = `toast${kind ? ` toast--${kind}` : ''}`;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { t.hidden = true; }, kind === 'error' ? 9000 : 5000);
  }

  // UTF-8 ⇔ base64
  function b64encodeText(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64decodeText(b64) {
    const bin = atob(b64.replace(/\s/g, ''));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1]);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }

  /* ---------- 状態 ---------- */
  const state = {
    conn: null,          // { owner, repo, branch, token }
    works: [], worksSha: null, worksDirty: false,
    site: {}, siteSha: null, siteDirty: false,
    editingIndex: -1,    // -1 = 新規
    siteForm: null,
  };

  /* ---------- GitHub API ---------- */
  const STORE_KEY = 'captains-room-conn';

  async function gh(path, opts = {}) {
    const { owner, repo, token } = state.conn;
    const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${path}`, {
      ...opts,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    if (res.status === 404 && opts.allow404) return null;
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).message || ''; } catch (_) { /* 無視 */ }
      const err = new Error(explain(res.status, detail));
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  function explain(status, detail) {
    if (status === 401) return 'トークンが無効か期限切れです。新しいトークンを作って接続し直してください。';
    if (status === 403) return `権限が足りません。トークンの「Contents」を Read and write にしてください。（${detail}）`;
    if (status === 404) return 'リポジトリまたはファイルが見つかりません。ユーザー名・リポジトリ名・ブランチを確認してください。';
    if (status === 409) return '他の場所で先に更新されています。ページを再読み込みしてからもう一度保存してください。';
    if (status === 422) return `GitHubが内容を受け付けませんでした（${detail}）`;
    return `GitHubとの通信に失敗しました（${status} ${detail}）`;
  }

  const contentPath = (p) => `/contents/${p.split('/').map(encodeURIComponent).join('/')}`;

  async function getFile(path) {
    return gh(`${contentPath(path)}?ref=${encodeURIComponent(state.conn.branch)}`, { allow404: true });
  }

  async function putFile(path, base64, message, sha) {
    return gh(contentPath(path), {
      method: 'PUT',
      body: JSON.stringify({ message, content: base64, branch: state.conn.branch, ...(sha ? { sha } : {}) }),
    });
  }

  function rawUrl(path) {
    if (!state.conn) return path;
    const { owner, repo, branch } = state.conn;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  }

  // GitHub Pages が「_」で始まるファイルを隠さないよう、.nojekyll が無ければ作る
  async function ensureNoJekyll() {
    try {
      // 中身は改行1つ（空ファイルを受け付けない環境があるため）
      if (!(await getFile('.nojekyll'))) await putFile('.nojekyll', 'Cg==', 'GitHub Pages 用に .nojekyll を追加');
    } catch (err) {
      console.warn('.nojekyll を作れませんでした', err);
      toast('.nojekyll を自動で作れませんでした。README の手順で手動で追加してください（画像が表示されない原因になります）。', 'error');
    }
  }

  /* ---------- 接続 ---------- */
  const form = $('connectForm');

  function loadSavedConn() {
    try {
      const s = localStorage.getItem(STORE_KEY) || sessionStorage.getItem(STORE_KEY);
      return s ? JSON.parse(s) : null;
    } catch (_) { return null; }
  }
  function saveConn(conn, remember) {
    try {
      localStorage.removeItem(STORE_KEY); sessionStorage.removeItem(STORE_KEY);
      (remember ? localStorage : sessionStorage).setItem(STORE_KEY, JSON.stringify(conn));
    } catch (_) { /* 保存できなくても動作は続ける */ }
  }

  // 初期値：GitHub Pages 上なら URL からユーザー名とリポジトリ名を推測
  (function prefill() {
    const host = location.hostname;
    const m = host.match(/^([^.]+)\.github\.io$/i);
    let owner = 'hiryuDev', repo = 'hiryuDev.github.io';
    if (m) {
      owner = m[1];
      const first = location.pathname.split('/').filter(Boolean)[0];
      repo = first && !first.endsWith('.html') ? first : `${m[1]}.github.io`;
    }
    form.owner.value = owner; form.repo.value = repo; form.branch.value = 'main';
  })();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const conn = {
      owner: form.owner.value.trim(), repo: form.repo.value.trim(),
      branch: form.branch.value.trim() || 'main', token: form.token.value.trim(),
    };
    await connect(conn, form.remember.checked);
  });

  async function connect(conn, remember) {
    const status = $('connectStatus');
    status.textContent = '接続しています…';
    status.className = 'status';
    state.conn = conn;
    try {
      const info = await gh('');
      if (!info.permissions || !info.permissions.push) throw new Error('このトークンには書き込み権限がありません。「Contents: Read and write」を付けてください。');
      if (remember !== undefined) saveConn(conn, remember);
      await ensureNoJekyll();
      const [wf, sf] = await Promise.all([getFile('data/works.json'), getFile('data/site.json')]);
      state.works = wf ? JSON.parse(b64decodeText(wf.content)) : [];
      state.worksSha = wf ? wf.sha : null;
      state.site = sf ? JSON.parse(b64decodeText(sf.content)) : {};
      state.siteSha = sf ? sf.sha : null;
      if (!Array.isArray(state.works)) state.works = [];
      status.textContent = '';
      $('connectedRepo').textContent = `${conn.owner}/${conn.repo}（${conn.branch}）`;
      $('connectedInfo').hidden = false;
      form.hidden = true;
      openWorkspace();
    } catch (err) {
      state.conn = null;
      status.textContent = err.message;
      status.className = 'status status--error';
    }
  }

  $('offlineBtn').addEventListener('click', async () => {
    const status = $('connectStatus');
    try {
      const [w, s] = await Promise.all([
        fetch('data/works.json', { cache: 'no-cache' }).then((r) => r.json()),
        fetch('data/site.json', { cache: 'no-cache' }).then((r) => r.json()),
      ]);
      state.works = Array.isArray(w) ? w : []; state.site = s || {};
      state.conn = null;
      status.textContent = '接続せずに編集中です。編集後は「JSONを書き出す」でファイルを保存し、data フォルダに上書きしてください。';
      status.className = 'status';
      openWorkspace();
    } catch (err) {
      status.textContent = 'data フォルダのJSONを読み込めませんでした。ローカルサーバー経由で開いているか確認してください。';
      status.className = 'status status--error';
    }
  });

  $('disconnectBtn').addEventListener('click', () => {
    try { localStorage.removeItem(STORE_KEY); sessionStorage.removeItem(STORE_KEY); } catch (_) { /* 無視 */ }
    location.reload();
  });

  /* ---------- 画面切り替え ---------- */
  function openWorkspace() {
    $('workspace').hidden = false;
    renderWorkRows();
    buildSiteForm();
    updateSavebar();
    $('saveBtn').title = state.conn ? '' : 'GitHubに接続すると使えます';
  }

  const tabs = [$('tabWorks'), $('tabSite')];
  tabs.forEach((t) => t.addEventListener('click', () => selectTab(t)));
  tabs.forEach((t, i) => t.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = tabs[(i + 1) % 2]; selectTab(n); n.focus(); }
  }));
  function selectTab(tab) {
    tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    $('viewWorks').hidden = tab !== tabs[0];
    $('viewSite').hidden = tab !== tabs[1];
    $('viewEditor').hidden = true;
    updateSavebar();
  }

  /* ---------- 作品一覧 ---------- */
  function renderWorkRows() {
    const ol = $('workRows');
    ol.replaceChildren();
    $('noWorks').hidden = state.works.length > 0;
    state.works.forEach((w, i) => {
      const pub = w.published !== false;
      ol.append(h('li', { class: 'work-row' },
        h('div', { class: 'work-row__main' },
          h('strong', { text: w.title || '（無題）' }),
          h('span', { class: 'work-row__id', text: w.id || 'ID未設定' }),
          h('span', { class: `badge ${pub ? 'badge--pub' : 'badge--draft'}`, text: pub ? '公開' : '非公開' }),
          w.featured ? h('span', { class: 'badge', text: '★注目' }) : null),
        h('div', { class: 'work-row__actions' },
          h('button', { class: 'btn btn--small', type: 'button', text: '編集', onclick: () => openEditor(i) }),
          h('button', { class: 'btn btn--small', type: 'button', text: pub ? '非公開にする' : '公開する', onclick: () => { w.published = !pub; markWorks(); } }),
          h('button', { class: 'btn btn--small btn--icon', type: 'button', 'aria-label': `${w.title} を上へ`, text: '↑', disabled: i === 0, onclick: () => move(i, -1) }),
          h('button', { class: 'btn btn--small btn--icon', type: 'button', 'aria-label': `${w.title} を下へ`, text: '↓', disabled: i === state.works.length - 1, onclick: () => move(i, 1) }),
          h('button', { class: 'btn btn--small btn--danger', type: 'button', text: '削除', onclick: () => {
            if (confirm(`「${w.title || w.id}」を一覧から削除しますか？（アップロード済みの画像は残ります）`)) { state.works.splice(i, 1); markWorks(); }
          } }))));
    });
  }
  function move(i, d) {
    const [x] = state.works.splice(i, 1);
    state.works.splice(i + d, 0, x);
    markWorks();
  }
  function markWorks() { state.worksDirty = true; renderWorkRows(); updateSavebar(); }

  /* ---------- 作品の編集 ---------- */
  let workBuilder = null;
  $('addWork').addEventListener('click', () => openEditor(-1));
  $('editorBack').addEventListener('click', closeEditor);

  function openEditor(index) {
    state.editingIndex = index;
    const value = index >= 0 ? clone(state.works[index]) : { published: true };
    $('editorTitle').textContent = index >= 0 ? `「${value.title || value.id}」を編集` : '新しい作品';
    const ctx = { get id() { return workBuilder ? workBuilder.peek('id') : value.id; } };
    workBuilder = buildGroup(WORK_FIELDS, value, ctx);
    $('workForm').replaceChildren(workBuilder.el);
    const prev = $('draftPreview');
    prev.hidden = !(index >= 0 && value.id);
    prev.href = `work.html?id=${encodeURIComponent(value.id || '')}&draft=1`;
    $('viewWorks').hidden = true;
    $('viewEditor').hidden = false;
    $('saveWork').disabled = !state.conn;
    updateSavebar();
    scrollTo(0, 0);
    $('workForm').querySelector('input, textarea').focus();
  }
  function closeEditor() {
    $('viewEditor').hidden = true;
    $('viewWorks').hidden = false;
    updateSavebar();
  }
  const isEditing = () => !$('viewEditor').hidden;

  // 編集中の内容を一覧に入れる。入力に問題があれば false
  function applyEditor() {
    const v = workBuilder.get();
    const errors = [];
    if (!v.id) errors.push('作品IDを入力してください。');
    else if (!/^[a-z0-9][a-z0-9-]*$/.test(v.id)) errors.push('作品IDは半角英小文字・数字・ハイフンで入力してください。');
    else if (state.works.some((w, i) => w.id === v.id && i !== state.editingIndex)) errors.push(`作品ID「${v.id}」はすでに使われています。`);
    if (!v.title) errors.push('タイトルを入力してください。');
    if (v.ai && v.ai.none && (v.ai.uses || []).length) errors.push('「AIを使用していない」にチェックがありますが、「AIを使った箇所」も入っています。どちらかにしてください。');
    if (errors.length) { toast(errors.join(' '), 'error'); return false; }
    if (state.editingIndex >= 0) state.works[state.editingIndex] = v;
    else state.works.push(v);
    closeEditor();
    markWorks();
    return true;
  }

  $('applyWork').addEventListener('click', () => {
    if (applyEditor()) toast(state.conn ? '一覧に入れました。まだ公開されていません。画面下の「保存して公開」で公開されます。' : '一覧に入れました。「JSONを書き出す」で保存してください。');
  });
  $('saveWork').addEventListener('click', () => $('saveBtn').click());

  /* ---------- サイト情報 ---------- */
  function buildSiteForm() {
    state.siteForm = buildGroup(SITE_FIELDS, clone(state.site), {});
    const f = $('siteForm');
    f.replaceChildren(state.siteForm.el);
    f.oninput = f.onchange = () => { state.siteDirty = true; updateSavebar(); };
  }

  /* ---------- 保存 ---------- */
  function updateSavebar() {
    const editing = isEditing();
    const dirty = state.worksDirty || state.siteDirty || editing;
    $('savebar').hidden = false;
    $('saveMsg').textContent = editing
      ? (state.conn ? '編集中の作品は「保存して公開」でそのまま公開されます。' : '編集中です（接続していないので書き出しのみ）。')
      : dirty
      ? (state.conn ? '未保存の変更があります。' : '未保存の変更があります（接続していないので書き出しのみ）。')
      : (state.conn ? '変更はすべて保存済みです。' : '接続していません。書き出したJSONを data フォルダに置いてください。');
    $('saveBtn').disabled = !state.conn || !dirty;
  }

  window.addEventListener('beforeunload', (e) => {
    if (state.worksDirty || state.siteDirty) { e.preventDefault(); e.returnValue = ''; }
  });

  const pretty = (o) => `${JSON.stringify(o, null, 2)}\n`;

  $('saveBtn').addEventListener('click', async () => {
    if (!state.conn) return;
    if (isEditing() && !applyEditor()) return; // 入力に問題があれば保存しない
    const btn = $('saveBtn');
    btn.disabled = true;
    $('saveMsg').textContent = '保存しています…';
    try {
      if (state.siteDirty) {
        const site = state.siteForm.get();
        const r = await putFile('data/site.json', b64encodeText(pretty(site)), 'プロフィール・スキル・連絡先を更新', state.siteSha);
        state.siteSha = r.content.sha; state.site = site; state.siteDirty = false;
      }
      if (state.worksDirty) {
        const r = await putFile('data/works.json', b64encodeText(pretty(state.works)), '作品データを更新', state.worksSha);
        state.worksSha = r.content.sha; state.worksDirty = false;
      }
      toast('公開しました。サイトへの反映には1〜2分かかります。', 'ok');
    } catch (err) {
      toast(err.message, 'error');
    }
    updateSavebar();
  });

  $('exportBtn').addEventListener('click', () => {
    const files = [['works.json', state.works], ['site.json', state.siteForm ? state.siteForm.get() : state.site]];
    files.forEach(([name, data]) => {
      const a = h('a', { href: URL.createObjectURL(new Blob([pretty(data)], { type: 'application/json' })), download: name });
      document.body.append(a); a.click(); a.remove();
    });
    toast('works.json と site.json を書き出しました。data フォルダの同名ファイルと置き換えてください。');
  });

  /* =========================================================
     フォーム部品
     どの部品も { el, get() } を返す。get() で今の値を取り出す。
     ========================================================= */
  function buildField(def, value, ctx) {
    switch (def.type) {
      case 'group': return buildGroup(def.fields, value || {}, ctx, def);
      case 'objects': return buildObjects(def, Array.isArray(value) ? value : [], ctx);
      case 'checkbox': return buildCheckbox(def, value);
      case 'checks': return buildChecks(def, Array.isArray(value) ? value : []);
      case 'image': return buildImage(def, value, ctx);
      default: return buildInput(def, value);
    }
  }

  function wrap(def, id, control) {
    return h('div', { class: `field field--${def.type || 'text'}` },
      h('label', { for: id, class: 'field__label' }, def.label, def.required ? h('span', { class: 'req', text: '必須' }) : null),
      control,
      def.help ? h('p', { class: 'field__help', text: def.help }) : null);
  }

  function buildInput(def, value) {
    const id = nextId();
    let el, get;
    if (def.type === 'textarea' || def.type === 'lines') {
      el = h('textarea', { id, rows: def.rows || 3, placeholder: def.placeholder || null });
      el.value = def.type === 'lines' ? (value || []).join('\n') : (value ?? def.default ?? '');
      get = () => (def.type === 'lines' ? el.value.split('\n').map((s) => s.trim()).filter(Boolean) : el.value.trim());
    } else if (def.type === 'level') {
      el = h('select', { id }, ['表示しない', '1', '2', '3', '4', '5'].map((t, n) => h('option', { value: n, text: n ? `${'●'.repeat(n)}${'○'.repeat(5 - n)}（${n}）` : t })));
      el.value = String(Math.max(0, Math.min(5, Number(value) || 0)));
      get = () => Number(el.value);
    } else if (def.type === 'tags') {
      el = h('input', { id, type: 'text', placeholder: def.placeholder || null });
      el.value = (value || []).join(', ');
      get = () => el.value.split(/[,、，]/).map((s) => s.trim()).filter(Boolean);
    } else {
      el = h('input', { id, type: def.type === 'url' ? 'url' : 'text', placeholder: def.placeholder || null, required: def.required || null, pattern: def.pattern || null });
      el.value = value ?? def.default ?? '';
      get = () => el.value.trim();
      if (def.options) { // 候補から選べる（自由入力も可）
        const listId = `${id}-list`;
        el.setAttribute('list', listId);
        return { el: wrap(def, id, h('div', null, el, h('datalist', { id: listId }, def.options.map((o) => h('option', { value: o }))))), get, input: el };
      }
    }
    return { el: wrap(def, id, el), get, input: el };
  }

  function buildCheckbox(def, value) {
    const id = nextId();
    const input = h('input', { id, type: 'checkbox' });
    input.checked = value === undefined ? !!def.default : !!value;
    const el = h('div', { class: 'field field--checkbox' }, h('label', { class: 'check', for: id }, input, def.label));
    return { el, get: () => input.checked, input };
  }

  // 複数選べるチェックボックス。選んだ id の配列を返す
  function buildChecks(def, value) {
    const boxes = def.options.map((o) => {
      const id = nextId();
      const input = h('input', { id, type: 'checkbox', value: o.id });
      input.checked = value.includes(o.id);
      return { input, el: h('label', { class: 'check', for: id }, input, o.label) };
    });
    const el = h('fieldset', { class: 'field field--checks' }, h('legend', { class: 'field__label', text: def.label }),
      h('div', { class: 'checks' }, boxes.map((b) => b.el)), def.help ? h('p', { class: 'field__help', text: def.help }) : null);
    return { el, get: () => boxes.filter((b) => b.input.checked).map((b) => b.input.value) };
  }

  function buildImage(def, value, ctx) {
    const id = nextId();
    const input = h('input', { id, type: 'text', placeholder: def.placeholder || 'images/works/作品ID/画像.jpg' });
    input.value = value || '';
    const preview = h('img', { class: 'img-field__preview', alt: '' });
    const file = h('input', { type: 'file', accept: 'image/*', class: 'visually-hidden', id: `${id}-file` });
    const pickBtn = h('label', { class: 'btn btn--small', for: `${id}-file`, text: '画像を選んでアップロード' });
    const note = h('span', { class: 'img-field__note', role: 'status' });

    function showPreview(src) {
      if (!src) { preview.hidden = true; return; }
      preview.hidden = false;
      preview.onerror = () => { preview.onerror = null; if (!/^(https?:|blob:)/.test(src)) preview.src = rawUrl(src); else preview.hidden = true; };
      preview.src = src;
    }
    showPreview(input.value);
    input.addEventListener('change', () => showPreview(input.value.trim()));

    file.addEventListener('change', async () => {
      const f = file.files[0];
      file.value = '';
      if (!f) return;
      if (!state.conn) { note.textContent = '接続していないのでアップロードできません。画像を手動で images フォルダに置き、パスを入力してください。'; return; }
      const dir = def.dir ? def.dir(ctx) : 'images';
      if (dir.endsWith('/misc') && !ctx.id) { note.textContent = '先に作品IDを入力してください（画像の保存先に使います）。'; return; }
      if (f.size > 5 * 1024 * 1024) { note.textContent = `${(f.size / 1048576).toFixed(1)}MB あります。5MB以下に縮小してからアップロードしてください。`; return; }
      const ext = (f.name.match(/\.[a-z0-9]+$/i) || ['.png'])[0].toLowerCase();
      // GitHub Pages は「_」で始まるファイルを配信しないことがあるので、英数字とハイフンだけにする
      let base = f.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
      if (base.length < 2) base = 'image';
      const path = `${dir}/${base}-${Date.now().toString(36)}${ext}`;
      note.textContent = 'アップロードしています…';
      pickBtn.classList.add('is-busy');
      try {
        await putFile(path, await fileToBase64(f), `画像を追加: ${path}`);
        input.value = path;
        showPreview(URL.createObjectURL(f));
        note.textContent = 'アップロードしました。「保存して公開」まで進めると作品に反映されます。';
      } catch (err) {
        note.textContent = err.message;
      }
      pickBtn.classList.remove('is-busy');
    });

    const control = h('div', { class: 'img-field' }, preview, h('div', { class: 'img-field__row' }, input, pickBtn, file), note);
    return { el: wrap(def, id, control), get: () => input.value.trim(), input };
  }

  function buildGroup(fields, value, ctx, def) {
    const parts = fields.map((f) => [f.key, buildField(f, value[f.key], ctx)]);
    const inner = parts.map(([, p]) => p.el);
    const el = def
      ? h('fieldset', { class: 'group' }, h('legend', { text: def.label }), def.help ? h('p', { class: 'field__help', text: def.help }) : null, inner)
      : h('div', { class: 'group group--root' }, inner);
    return {
      el,
      // 定義に無いキー（JSONに手で足した項目）は消さずに残す
      get: () => ({ ...value, ...Object.fromEntries(parts.map(([k, p]) => [k, p.get()])) }),
      peek: (key) => { const p = parts.find(([k]) => k === key); return p ? p[1].get() : undefined; },
    };
  }

  function buildObjects(def, rows, ctx) {
    const list = h('ol', { class: 'rows' });
    let items = [];

    function addRow(v) {
      const g = buildGroup(def.fields, v || {}, ctx);
      const li = h('li', { class: 'row' });
      const item = { g, li };
      const tools = h('div', { class: 'row__tools' },
        h('button', { class: 'btn btn--small btn--icon', type: 'button', 'aria-label': '上へ', text: '↑', onclick: () => shift(item, -1) }),
        h('button', { class: 'btn btn--small btn--icon', type: 'button', 'aria-label': '下へ', text: '↓', onclick: () => shift(item, 1) }),
        h('button', { class: 'btn btn--small btn--danger', type: 'button', text: '削除', onclick: () => { items = items.filter((x) => x !== item); li.remove(); list.dispatchEvent(new Event('input', { bubbles: true })); } }));
      li.append(g.el, tools);
      items.push(item);
      list.append(li);
      return item;
    }
    function shift(item, d) {
      const i = items.indexOf(item), j = i + d;
      if (j < 0 || j >= items.length) return;
      [items[i], items[j]] = [items[j], items[i]];
      list.replaceChildren(...items.map((x) => x.li));
      list.dispatchEvent(new Event('input', { bubbles: true }));
    }
    rows.forEach((r) => addRow(r));

    const addBtn = h('button', { class: 'btn btn--small', type: 'button', text: `＋ ${def.addLabel || '追加'}`, onclick: () => {
      const it = addRow({});
      const first = it.li.querySelector('input, textarea, select');
      if (first) first.focus();
      list.dispatchEvent(new Event('input', { bubbles: true }));
    } });

    const el = h('fieldset', { class: 'group group--objects' }, h('legend', { text: def.label }),
      def.help ? h('p', { class: 'field__help', text: def.help }) : null, list, addBtn);
    // 何も入力されていない行は保存しない
    const filled = (o) => Object.values(o).some((v) => (Array.isArray(v) ? v.length : v !== '' && v !== 0 && v !== false && v != null));
    return { el, get: () => items.map((x) => x.g.get()).filter(filled) };
  }

  /* ---------- 起動：記憶した接続があれば自動接続 ---------- */
  const saved = loadSavedConn();
  if (saved && saved.token) {
    form.owner.value = saved.owner; form.repo.value = saved.repo; form.branch.value = saved.branch;
    connect(saved);
  }
})();
