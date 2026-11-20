/* =========================================================
   共通ヘルパー（index.html / work.html で使用）
   ========================================================= */
(function () {
  'use strict';

  const ICONS = 'images/icons.svg';

  /** 要素を作る。文字列の子は textContent として入るので HTML は混入しない */
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  /** <svg><use href="images/icons.svg#id"></svg> */
  function icon(id, cls) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    if (cls) svg.setAttribute('class', cls);
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(ns, 'use');
    use.setAttribute('href', `${ICONS}#${id}`);
    svg.append(use);
    return svg;
  }

  /** JSON を読む（GitHub Pages のキャッシュで古いデータが出ないよう no-cache） */
  async function loadJSON(path) {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${path} を読み込めませんでした (${res.status})`);
    return res.json();
  }

  async function loadData() {
    const [site, works] = await Promise.all([
      loadJSON('data/site.json'),
      loadJSON('data/works.json'),
    ]);
    return { site, works: Array.isArray(works) ? works : [] };
  }

  /** 公開設定の作品だけ（published が false のものは除く） */
  function publishedWorks(works) {
    return works.filter((w) => w && w.id && w.published !== false);
  }

  /** http(s)・mailto・相対パスだけ許可する */
  function safeUrl(url) {
    if (!url) return '';
    const s = String(url).trim();
    if (/^(https?:|mailto:)/i.test(s)) return s;
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return ''; // javascript: などは捨てる
    return s;
  }

  function isExternal(url) { return /^https?:/i.test(url); }

  /** YouTube の URL から動画IDを取り出す */
  function youtubeId(url) {
    if (!url) return null;
    const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
    return m ? m[1] : null;
  }

  /** "a.b.c" の形でオブジェクトの値を取る */
  function pick(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  /** data-bind="profile.name" の要素に値を流し込む（改行は CSS の pre-line でそのまま出る） */
  function bindText(root, data) {
    root.querySelectorAll('[data-bind]').forEach((el) => {
      const v = pick(data, el.dataset.bind);
      if (v === undefined) return; // データに無い項目は HTML に書いた初期の文章のまま
      el.textContent = v == null ? '' : String(v);
    });
  }

  function tagList(items) {
    if (!items || !items.length) return null;
    return h('ul', { class: 'tags' }, items.map((t) => h('li', { text: t })));
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  window.Log = { h, icon, loadData, publishedWorks, safeUrl, isExternal, youtubeId, pick, bindText, tagList, reducedMotion };
})();
