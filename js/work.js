/* =========================================================
   作品詳細ページ（work.html?id=作品ID）
   下書き（published: false）の確認は work.html?id=作品ID&draft=1
   ========================================================= */
(function () {
  'use strict';
  const { h, icon, loadData, publishedWorks, safeUrl, isExternal, youtubeId, bindText, tagList, revealText, aiInfo, stageStamp, platformsOf, platformTags, playButton } = window.Log;
  const $ = (id) => document.getElementById(id);

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const allowDraft = params.get('draft') === '1';

  $('year').textContent = new Date().getFullYear();

  // スマホの目次
  const navToggle = $('navToggle');
  const nav = $('siteNav');
  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') !== 'true';
    navToggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });

  loadData().then(({ site, works }) => {
    bindText(document, site);
    // インターンシップが登録されていれば目次に出す
    if ((site.internships || []).some((it) => it && (it.company || it.program))) {
      document.querySelectorAll('[data-section="internship"]').forEach((el) => { el.hidden = false; });
    }
    revealText();
    window.__siteName = (site.texts && site.texts.brand) || (site.profile && site.profile.name ? `${site.profile.name} ポートフォリオ` : '');
    const list = publishedWorks(works);
    let work = list.find((w) => w.id === id);
    if (!work && allowDraft) work = works.find((w) => w && w.id === id);
    if (!work) return notFound();
    render(work, list);
  }).catch((err) => {
    console.error(err);
    revealText();
    $('workBody').replaceChildren(h('p', { class: 'notfound', text: 'データを読み込めませんでした。' }));
  });

  function notFound() {
    document.title = '作品が見つかりません';
    $('workBody').replaceChildren(h('div', { class: 'notfound empty' },
      icon('i-chest', 'empty__chest'),
      h('p', { class: 'empty__title', text: 'この作品は見つかりません' }),
      h('p', { class: 'empty__text', text: 'URLが変わったか、まだ公開されていない作品です。作品一覧から探してください。' })));
  }

  function section(title, iconId, ...content) {
    return h('section', null, h('h2', null, icon(iconId), title), ...content);
  }

  function render(w, list) {
    document.title = `${w.title || w.id} ― ${(window.__siteName || 'ポートフォリオ')}`;
    const idx = list.indexOf(w);
    if (idx >= 0) $('runnerNo').textContent = `作品 ${idx + 1} / ${list.length}`;

    const body = [];

    // 見出し
    body.push(h('header', { class: 'work-head' },
      (w.genre || w.stage) ? h('p', { class: 'work-head__genre' }, w.genre || null, stageStamp(w)) : null,
      h('h1', { class: 'work-head__title', text: w.title || w.id }),
      w.subtitle ? h('p', { class: 'work-head__subtitle', text: w.subtitle }) : null,
      (platformsOf(w).length || w.playUrl) ? h('div', { class: 'work-head__row' }, platformTags(w), playButton(w)) : null));

    // 動画 or メイン画像
    const media = buildMedia(w);
    if (media) body.push(h('div', { class: 'work-media' }, media));

    // 本文
    const main = h('div', { class: 'work-main' });
    if (w.description || w.summary) main.append(section('作品について', 'i-compass', h('p', { class: 'prose', text: w.description || w.summary })));

    const duties = (w.responsibilities || []).filter(Boolean);
    if (duties.length) main.append(section('担当した箇所', 'i-quill', h('ul', { class: 'duty-list' }, duties.map((d) => h('li', { text: d })))));

    // AIの使用について
    const ai = aiInfo(w);
    if (ai && ai.none) {
      main.append(section('AIの使用について', 'i-spark', h('p', { class: 'ai-note' },
        h('span', { class: 'ai-badge ai-badge--none', text: 'AI不使用' }), 'この作品の制作では生成AIを使用していません。')));
    } else if (ai) {
      main.append(section('AIの使用について', 'i-spark', h('ul', { class: 'ai-list' }, ai.uses.map((u) => h('li', { class: 'ai-list__item' },
        h('div', { class: 'ai-list__head' },
          u.area ? h('span', { class: 'ai-list__area', text: u.area }) : null,
          u.tool ? h('span', { class: 'ai-list__tool', text: u.tool }) : null),
        u.detail ? h('p', { class: 'prose', text: u.detail }) : null)))));
    }

    const feats = (w.highlights || []).filter((x) => x && (x.title || x.body));
    if (feats.length) main.append(section('技術的な工夫', 'i-helm', feats.map((f) => h('div', { class: 'feat' },
      f.title ? h('h3', { text: f.title }) : null,
      f.body ? h('p', { class: 'prose', text: f.body }) : null))));

    const troubles = (w.challenges || []).filter((x) => x && (x.problem || x.solution));
    if (troubles.length) main.append(section('課題と解決', 'i-anchor', h('div', { class: 'trouble' }, troubles.map((t) => h('div', { class: 'trouble__item' },
      h('span', { class: 'trouble__label', text: '課題' }), h('p', { class: 'prose', text: t.problem || '' }),
      h('span', { class: 'trouble__label trouble__label--fix', text: '解決' }), h('p', { class: 'prose', text: t.solution || '' }))))));

    const ol = w.outlook || {};
    const outlook = [['次はこうしたい', ol.next], ['次の作品で活かしたいこと', ol.carry]].filter(([, v]) => v);
    if (outlook.length) main.append(section('今後の展望', 'i-ship', h('div', { class: 'outlook' }, outlook.map(([label, text]) =>
      h('div', { class: 'outlook__item' }, h('h3', { class: 'outlook__label', text: label }), h('p', { class: 'prose', text })))))); 

    const shots = (w.screenshots || []).filter((s) => s && safeUrl(s.src));
    if (shots.length) main.append(section('スクリーンショット', 'i-mark', h('ul', { class: 'gallery' }, shots.map((s) => {
      const src = safeUrl(s.src);
      return h('li', null, h('figure', null,
        h('button', { type: 'button', 'aria-label': `${s.caption || 'スクリーンショット'}を拡大`, onclick: () => openLightbox(src, s.caption) },
          h('img', { src, alt: s.caption || '', loading: 'lazy', decoding: 'async' })),
        s.caption ? h('figcaption', { text: s.caption }) : null));
    }))));

    // 横の仕様欄
    const specRows = [
      ['状態', (w.stage || '').trim()], ['制作期間', w.period], ['制作体制', w.team], ['担当', w.role], ['対応環境', w.platform],
    ].filter(([, v]) => v).map(([k, v]) => h('div', null, h('dt', { text: k }), h('dd', { text: v })));
    const tagRows = [['使用言語', w.languages], ['技術・ライブラリ', w.tech], ['開発環境・ツール', w.tools]]
      .filter(([, v]) => v && v.length).map(([k, v]) => h('div', null, h('dt', { text: k }), h('dd', null, tagList(v))));
    if (platformsOf(w).length) tagRows.unshift(h('div', null, h('dt', { text: '分類' }), h('dd', null, tagList(platformsOf(w).map((p) => p.label)))));
    if (ai) tagRows.push(h('div', null, h('dt', { text: 'AIの使用' }), h('dd', null,
      ai.none ? h('span', { class: 'ai-badge ai-badge--none', text: 'AI不使用' })
              : (ai.areas.length ? tagList(ai.areas) : h('span', { class: 'ai-badge ai-badge--used', text: 'AI使用' })))));

    const side = h('aside', { class: 'work-side' });
    if (specRows.length || tagRows.length) side.append(h('div', { class: 'spec' }, h('h2', { text: '作品情報' }), h('dl', null, specRows, tagRows)));

    const links = (w.links || []).filter((l) => l && safeUrl(l.url));
    if (links.length) side.append(h('ul', { class: 'out-links' }, links.map((l) => {
      const url = safeUrl(l.url); const ext = isExternal(url);
      return h('li', null, h('a', { href: url, target: ext ? '_blank' : null, rel: ext ? 'noopener' : null },
        h('span', { text: l.label || url }), icon('i-link')));
    })));

    // 本文が空のときは、作品情報を横いっぱいに並べる
    const solo = !main.children.length;
    body.push(h('div', { class: `work-grid${solo ? ' work-grid--solo' : ''}` }, solo ? null : main, side));

    // 前後の作品
    if (idx >= 0 && list.length > 1) {
      const prev = list[idx - 1], next = list[idx + 1];
      const link = (x, dir) => h('a', { class: `pager__${dir}`, href: `work.html?id=${encodeURIComponent(x.id)}` },
        dir === 'prev' ? icon('i-left') : null,
        h('span', null, h('small', { text: dir === 'prev' ? '前の作品' : '次の作品' }), x.title || x.id),
        dir === 'next' ? icon('i-right') : null);
      body.push(h('nav', { class: 'pager', 'aria-label': '前後の作品' }, prev ? link(prev, 'prev') : null, next ? link(next, 'next') : null));
    }

    $('workBody').replaceChildren(...body);
  }

  function buildMedia(w) {
    const yt = youtubeId(w.video);
    if (yt) {
      const wrap = h('div', { class: 'video' });
      const poster = h('button', { class: 'video__poster', type: 'button', 'aria-label': `${w.title || ''} の動画を再生` },
        h('img', { src: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`, alt: '', loading: 'lazy' }),
        h('span', { class: 'video__play', 'aria-hidden': 'true' }, icon('i-play', 'video__play-icon')));
      poster.addEventListener('click', () => {
        wrap.replaceChildren(h('iframe', {
          src: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0`,
          title: `${w.title || ''} の動画`, allow: 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen', allowfullscreen: true,
        }));
      });
      wrap.append(poster);
      return wrap;
    }
    const v = safeUrl(w.video);
    if (v && /\.(mp4|webm)(\?|$)/i.test(v)) {
      return h('div', { class: 'video' }, h('video', { src: v, controls: true, preload: 'metadata', poster: safeUrl(w.thumbnail) || null }));
    }
    const thumb = safeUrl(w.thumbnail);
    if (thumb) return h('div', { class: 'video' }, h('img', { src: thumb, alt: `${w.title || ''} のメイン画像`, style: 'object-fit:cover' }));
    return null;
  }

  /* 画像の拡大表示 */
  const lb = $('lightbox');
  function openLightbox(src, caption) {
    $('lightboxImg').src = src;
    $('lightboxImg').alt = caption || '';
    $('lightboxCaption').textContent = caption || '';
    lb.showModal();
  }
  $('lightboxClose').addEventListener('click', () => lb.close());
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
})();
