/* =========================================================
   トップページ（index.html）
   ========================================================= */
(function () {
  'use strict';
  const { h, icon, loadData, publishedWorks, safeUrl, isExternal, bindText, reducedMotion, revealText, aiInfo, stageStamp } = window.Log;

  const $ = (id) => document.getElementById(id);
  const OPENED_KEY = 'captains-log-opened';

  /* ---------- 表紙 ---------- */
  const stage = $('cover');
  const openBtn = $('openBook');
  let opening = false;

  function storageGet(k) { try { return sessionStorage.getItem(k); } catch (_) { return null; } }
  function storageSet(k, v) { try { sessionStorage.setItem(k, v); } catch (_) { /* 無視 */ } }

  function finishCover() {
    setTimeout(() => { if (stage.classList.contains('is-gone')) stage.hidden = true; }, 700);
    stage.classList.add('is-gone');
    stage.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cover-open');
    storageSet(OPENED_KEY, '1');
    opening = false;
    $('log').focus({ preventScroll: true });
  }

  function openCover() {
    if (opening) return;
    opening = true;
    if (reducedMotion()) { finishCover(); return; }
    stage.classList.add('is-opening');
    setTimeout(() => stage.classList.add('is-entering'), 950);
    setTimeout(finishCover, 1550);
  }

  function showCover() {
    stage.hidden = false;
    void stage.offsetWidth;
    fitCover();
    stage.classList.remove('is-gone', 'is-opening', 'is-entering');
    stage.removeAttribute('aria-hidden');
    document.body.classList.add('cover-open');
    window.scrollTo(0, 0);
    openBtn.focus({ preventScroll: true });
  }

  // 同じセッションで一度開いた／ページ内リンクで来た場合は表紙を飛ばす
  if (storageGet(OPENED_KEY) || (location.hash && location.hash !== '#top')) {
    stage.hidden = true;
    stage.classList.add('is-gone');
    stage.setAttribute('aria-hidden', 'true');
  } else {
    document.body.classList.add('cover-open');
  }

  // 「本文へ移動」で表紙も閉じる
  document.querySelector('.skip-link').addEventListener('click', () => {
    if (document.body.classList.contains('cover-open')) finishCover();
  });

  openBtn.addEventListener('click', openCover);
  $('skipCover').addEventListener('click', finishCover);
  $('replayCover').addEventListener('click', showCover);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('cover-open')) finishCover();
  });

  /* 表紙の文字が長いときは、枠からはみ出さないよう自動で小さくする */
  function fitLine(el, min) {
    if (!el || !el.clientWidth) return;
    el.style.fontSize = '';
    el.style.whiteSpace = 'nowrap';
    let size = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > el.clientWidth + 1 && size > min) { size -= 1; el.style.fontSize = `${size}px`; }
    if (el.scrollWidth > el.clientWidth + 1) el.style.whiteSpace = 'normal'; // それでも入らなければ折り返す
  }
  function fitBox(box, text, min) {
    if (!box || !text || !box.clientHeight) return;
    text.style.fontSize = '';
    let size = parseFloat(getComputedStyle(text).fontSize);
    while (box.scrollHeight > box.clientHeight + 1 && size > min) { size -= .5; text.style.fontSize = `${size}px`; }
  }
  function fitCover() {
    if (stage.hidden) return;
    const q = (s) => stage.querySelector(s);
    // タイトルが長いときは字間を詰める（短いときは広めの字間のまま）
    const title = q('.cover__title');
    const long = title && [...title.textContent].length > 5;
    if (title) { title.style.letterSpacing = long ? '.06em' : ''; title.style.marginRight = long ? '-.06em' : ''; }
    fitLine(q('.cover__latin'), 11);
    fitLine(q('.cover__title'), 18);
    fitLine(q('.cover__sub'), 9);
    fitLine(q('.cover__owner'), 12);
    fitBox(q('.book__page'), q('.book__page-text'), 10);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitCover);
  addEventListener('resize', () => { if (!stage.hidden) fitCover(); });

  /* ---------- ナビゲーション ---------- */
  const navToggle = $('navToggle');
  const nav = $('siteNav');
  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') !== 'true';
    navToggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      navToggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    }
  });

  // いま読んでいるページを目次に表示
  const navLinks = [...nav.querySelectorAll('a')];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === `#${en.target.id}`)));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['profile', 'works', 'internship', 'skills', 'contact'].forEach((id) => { const el = $(id); if (el) io.observe(el); });

  // スクロール量に合わせて小舟が進む
  const ship = $('voyageShip');
  let ticking = false;
  function updateShip() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    ship.style.setProperty('--progress', p.toFixed(4));
    ticking = false;
  }
  // CSS だけでスクロール連動できるブラウザでは JS の処理を省く
  if (!(window.CSS && CSS.supports('animation-timeline: scroll()'))) {
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateShip); } }, { passive: true });
    addEventListener('resize', updateShip);
    updateShip();
  }

  $('year').textContent = new Date().getFullYear();

  /* ---------- データの描画 ---------- */
  loadData()
    .then(({ site, works }) => {
      bindText(document, site);
      renderProfile(site.profile || {});
      renderWorks(publishedWorks(works));
      renderInternships(site.internships || []);
      numberPages();
      renderSkills(site.skills || []);
      renderContact(site.contact || {}, site.links || []);
      fitCover();
      revealText();
      if (location.hash) { const t = document.querySelector(location.hash); if (t) t.scrollIntoView(); }
    })
    .catch((err) => {
      console.error(err);
      renderInternships([]);
      numberPages();
      revealText();
      $('workList').append(h('li', { class: 'empty' },
        h('p', { class: 'empty__title', text: 'データを読み込めませんでした' }),
        h('p', { class: 'empty__text', text: 'ファイルを直接開いている場合は、README の「手元で確認する」の手順でローカルサーバーを起動してください。' })));
    });

  function renderProfile(p) {
    const src = safeUrl(p.portrait);
    if (src) {
      const img = $('portraitImg');
      img.src = src;
      img.alt = `${p.name || ''}の肖像`;
      img.hidden = false;
      $('portraitPlaceholder').remove();
    }
    const likes = (p.likes || []).filter(Boolean);
    if (likes.length) {
      $('likesWrap').hidden = false;
      $('likesList').append(...likes.map((l) => h('li', { text: l })));
    }
  }

  function workUrl(w) { return `work.html?id=${encodeURIComponent(w.id)}`; }

  function renderWorks(works) {
    const list = $('workList');
    list.replaceChildren();
    if (!works.length) { $('worksEmpty').hidden = false; return; }

    works.forEach((w) => {
      const thumb = safeUrl(w.thumbnail);
      const plate = h('a', { class: 'entry__plate', href: workUrl(w), tabindex: '-1', 'aria-hidden': 'true' },
        thumb ? h('img', { src: thumb, alt: '', loading: 'lazy', decoding: 'async' })
              : h('span', { class: 'noimg' }, icon('i-skull')));

      const meta = [
        ['担当', w.role],
        ['言語', (w.languages || []).join('、')],
        ['技術', (w.tech || []).join('、')],
      ].filter(([, v]) => v);

      const li = h('li', { class: `entry${w.featured ? ' entry--featured' : ''}`, 'data-tags': JSON.stringify(workTags(w)) },
        plate,
        h('div', { class: 'entry__body' },
          h('p', { class: 'entry__date' }, stageStamp(w), [w.period, w.team].filter(Boolean).join(' ／ ')),
          h('h3', { class: 'entry__title' }, h('a', { href: workUrl(w), text: w.title || w.id })),
          w.genre ? h('p', { class: 'entry__genre', text: w.genre }) : null,
          aiLine(w),
          w.summary ? h('p', { class: 'entry__summary', text: w.summary }) : null,
          meta.length ? h('dl', { class: 'entry__meta' }, meta.map(([k, v]) => h('div', null, h('dt', { text: k }), h('dd', { text: v })))) : null,
          h('a', { class: 'seal-link', href: workUrl(w), 'aria-label': `${w.title || w.id} の詳細を見る` },
            h('span', { class: 'seal-link__seal', 'aria-hidden': 'true' }, icon('i-quill', 'seal-link__icon')),
            h('span', { text: '詳細を見る' }))));
      list.append(li);
    });

    buildFilter(works);
  }

  // 一覧に出すAI使用の表示
  function aiLine(w) {
    const ai = aiInfo(w);
    if (!ai) return null;
    if (ai.none) return h('p', { class: 'entry__ai' }, h('span', { class: 'ai-badge ai-badge--none', text: 'AI不使用' }));
    return h('p', { class: 'entry__ai' },
      h('span', { class: 'ai-badge ai-badge--used', text: 'AI使用' }),
      ai.areas.length ? h('span', { class: 'entry__ai-areas', text: ai.areas.join('、') }) : null);
  }

  // 絞り込みに使うタグ（状態 → 言語 → 技術の順）
  function workTags(w) {
    return [...new Set([(w.stage || '').trim(), ...(w.languages || []), ...(w.tech || [])].filter(Boolean))];
  }

  function buildFilter(works) {
    const stages = [...new Set(works.map((w) => (w.stage || '').trim()).filter(Boolean))];
    const techs = [...new Set(works.flatMap((w) => [...(w.languages || []), ...(w.tech || [])]))].filter((t) => !stages.includes(t));
    const tags = [...stages, ...techs];
    if (works.length < 3 || tags.length < 2) return;

    const box = $('workFilter');
    box.hidden = false;
    const buttons = [];
    const make = (label, value) => {
      const b = h('button', { type: 'button', 'aria-pressed': String(value === null), text: label });
      b.addEventListener('click', () => {
        buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        document.querySelectorAll('#workList .entry').forEach((li) => {
          li.hidden = value !== null && !JSON.parse(li.dataset.tags).includes(value);
        });
      });
      buttons.push(b);
      return b;
    };
    box.append(make('すべて', null), ...stages.map((t) => make(t, t)),
      stages.length && techs.length ? h('span', { class: 'filter__sep', 'aria-hidden': 'true' }) : null,
      ...techs.map((t) => make(t, t)));
  }

  /* ---------- インターンシップ ---------- */
  function renderInternships(items) {
    const list = items.filter((it) => it && (it.company || it.program));
    const show = list.length > 0;
    // 1件も無ければ、ページ・目次・案内図の島をまとめて隠す
    document.querySelectorAll('[data-section="internship"]').forEach((el) => { el.hidden = !show; });
    document.querySelector('.chart').classList.toggle('chart--5', show);
    if (!show) return;
    const ol = $('internList');
    ol.replaceChildren(...list.map((it) => {
      const url = safeUrl(it.url);
      const meta = [it.period, it.format].filter(Boolean).join(' ／ ');
      const rows = [['内容', it.content], ['取り組んだこと', it.work], ['学んだこと', it.learned]].filter(([, v]) => v);
      return h('li', { class: 'intern' },
        h('p', { class: 'intern__meta', text: meta }),
        h('h3', { class: 'intern__company' }, url ? h('a', { href: url, target: '_blank', rel: 'noopener', text: it.company || it.program }) : (it.company || it.program)),
        it.company && it.program ? h('p', { class: 'intern__program', text: it.program }) : null,
        rows.length ? h('dl', { class: 'intern__rows' }, rows.map(([k, v]) => h('div', null, h('dt', { text: k }), h('dd', { class: 'prose', text: v })))) : null);
    }));
  }

  /* 見えているページだけで「1 / 5」のように番号を振る */
  function numberPages() {
    const sheets = [...document.querySelectorAll('#log > section.sheet')].filter((s) => !s.hidden);
    sheets.forEach((s, i) => {
      const no = s.querySelector('.sheet__no'); const folio = s.querySelector('.sheet__folio');
      if (no) no.textContent = `${i + 1} / ${sheets.length}`;
      if (folio) folio.textContent = String(i + 1);
    });
  }

  function renderSkills(groups) {
    const wrap = $('skillList');
    wrap.replaceChildren();
    let anyLevel = false;
    groups.forEach((g) => {
      const items = (g.items || []).filter((i) => i && i.name);
      if (!items.length) return;
      wrap.append(h('div', { class: 'armory__group' },
        h('h3', { text: g.category || '' }),
        h('ul', { class: 'armory__list' }, items.map((it) => {
          const lv = Math.max(0, Math.min(5, Number(it.level) || 0));
          if (lv) anyLevel = true;
          return h('li', { class: 'armory__item' },
            h('div', { class: 'armory__row' },
              h('span', { class: 'armory__name', text: it.name }),
              lv ? h('span', { class: 'coins', role: 'img', 'aria-label': `習熟度 5段階中 ${lv}` },
                [1, 2, 3, 4, 5].map((n) => h('span', { class: `coin ${n <= lv ? 'coin--on' : 'coin--off'}` }))) : null),
            it.note ? h('p', { class: 'armory__note', text: it.note }) : null);
        }))));
    });
    $('skillsLegend').hidden = !anyLevel;
  }

  function renderContact(c, links) {
    if (c.email) {
      const a = $('mailButton');
      a.href = `mailto:${c.email}`;
      $('mailAddress').textContent = c.email;
      a.hidden = false;
    }
    const ul = $('linkList');
    links.filter((l) => l && l.url && safeUrl(l.url)).forEach((l) => {
      const url = safeUrl(l.url);
      const ext = isExternal(url);
      ul.append(h('li', null, h('a', { href: url, target: ext ? '_blank' : null, rel: ext ? 'noopener' : null },
        icon('i-link'), l.label || url)));
    });
  }
})();
