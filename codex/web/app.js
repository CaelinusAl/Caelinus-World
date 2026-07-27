// CAELINUS CODEX — app.js
// Cinematic reader over the Living Codex Engine output. Vanilla ES module.

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

let CODEX = null, IMAGES = null, REPORT = null;
let ENT = {};      // id -> node
let SEC = {};      // sectionId -> {section, volume}
const state = { activeSection: null };

// ---------- boot ----------
(async function boot() {
  drawLifeTree($('#lifeTree'));
  startAmbient();
  wireIntro();
  try {
    [CODEX, IMAGES, REPORT] = await Promise.all([
      fetch('../data/codex.json').then(r => r.json()),
      fetch('../data/images.json').then(r => r.json()),
      fetch('../data/report.json').then(r => r.json()),
    ]);
  } catch (e) {
    $('#enterBtn').textContent = 'Data not built — run engine/build.mjs';
    console.error(e); return;
  }
  index();
  buildTree();
  buildBrand();
  renderWelcome();
  wireActions();
})();

function index() {
  for (const n of CODEX.graph.nodes) ENT[n.id] = n;
  // canon v2.0: sections live under bibles[].sections
  for (const b of CODEX.bibles) for (const s of (b.sections || [])) SEC[s.id] = { section: s, bible: b };
}

// ---------- intro ----------
function wireIntro() {
  $('#enterBtn').addEventListener('click', () => {
    const intro = $('#intro'); intro.classList.add('fade');
    setTimeout(() => { intro.classList.add('hidden'); const app = $('#app'); app.classList.remove('hidden'); app.classList.add('enter-anim'); }, 1200);
  });
}

// ---------- Life Tree (olive / tree-of-life motif) ----------
function drawLifeTree(svg) {
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  // roots reaching to Anatolia, branches opening to the future
  const trunk = mk('path', { d: 'M100 230 C96 190 96 170 100 150 C104 170 104 190 100 230 Z', fill: 'url(#g)' });
  const grad = mk('linearGradient', { id: 'g', x1: 0, y1: 1, x2: 0, y2: 0 });
  grad.appendChild(mk('stop', { offset: 0, 'stop-color': '#8a6b34' }));
  grad.appendChild(mk('stop', { offset: 1, 'stop-color': '#e8c37a' }));
  const defs = mk('defs', {}); defs.appendChild(grad); svg.appendChild(defs); svg.appendChild(trunk);
  const rng = (seed => () => (seed = seed * 16807 % 2147483647) / 2147483647)(42);
  function branch(x, y, ang, len, depth) {
    if (depth === 0) return;
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    const p = mk('line', { x1: x, y1: y, x2, y2, stroke: '#c79a4e', 'stroke-width': depth * .7, 'stroke-linecap': 'round', opacity: .85 });
    svg.appendChild(p);
    if (depth <= 2) svg.appendChild(mk('circle', { cx: x2, cy: y2, r: 2.2, fill: '#f4d99a', opacity: .9 }));
    const spread = .5 + rng() * .4;
    branch(x2, y2, ang - spread, len * .74, depth - 1);
    branch(x2, y2, ang + spread, len * .74, depth - 1);
    if (rng() > .5) branch(x2, y2, ang + (rng() - .5) * .3, len * .68, depth - 1);
  }
  branch(100, 150, -Math.PI / 2, 34, 6);
}

// ---------- ambient golden dust ----------
function startAmbient() {
  const cv = $('#ambient'), ctx = cv.getContext('2d');
  let W, H, parts;
  const resize = () => {
    W = cv.width = innerWidth * devicePixelRatio; H = cv.height = innerHeight * devicePixelRatio;
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    parts = Array.from({ length: Math.min(90, Math.floor(innerWidth / 16)) }, () => ({
      x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.6 + .4) * devicePixelRatio,
      vx: (Math.random() - .3) * .18 * devicePixelRatio, vy: (Math.random() - .5) * .12 * devicePixelRatio,
      a: Math.random() * .5 + .1, tw: Math.random() * 0.02 + 0.004,
    }));
  };
  resize(); addEventListener('resize', resize);
  let t = 0;
  (function loop() {
    t++; ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.x += p.vx + Math.sin((t * p.tw)) * .1; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      const a = p.a * (0.6 + 0.4 * Math.sin(t * p.tw));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fillStyle = `rgba(232,195,122,${a})`; ctx.fill();
    }
    requestAnimationFrame(loop);
  })();
}

// ---------- volume tree ----------
function buildTree() {
  const tree = $('#tree'); tree.innerHTML = '';
  const all = [...CODEX.bibles].sort((a, c) => a.order - c.order);
  const tops = all.filter(b => !b.parent);
  for (const b of tops) {
    const children = all.filter(c => c.parent === b.id);
    const branch = renderBranch(b, children);
    tree.appendChild(branch);
  }
}

function renderBranch(b, children) {
  const has = b.sectionCount > 0 || (children && children.some(c => c.sectionCount > 0));
  const branch = el('div', 'branch' + (has ? '' : ' missing'));
  const statusDot = { PRESENT: '#b7c9a8', PARTIAL: '#e8c37a', SCATTERED: '#8fb0c4', MISSING: '#c9a0a0' }[b.status] || '#7d6f56';
  const head = el('div', 'branch-head', `
    <span class="branch-glyph" style="color:${b.accent}">${b.glyph}</span>
    <span class="branch-title">${escapeHtml(b.tr)} <span style="font-size:.5rem;color:${statusDot}">●</span></span>
    <span class="branch-count">${has ? (b.sectionCount || '›') : '—'}</span>`);
  branch.appendChild(head);
  const kids = el('div', 'branch-kids');

  // own sections grouped by sub-volume / profession
  appendSections(kids, b.sections || []);

  // production children as nested sub-branches
  for (const c of (children || [])) {
    const sub = el('div', 'branch', '');
    sub.style.marginLeft = '.6rem';
    const subHead = el('div', 'branch-head', `
      <span class="branch-glyph" style="color:${c.accent};font-size:.8rem">${c.glyph}</span>
      <span class="branch-title" style="font-size:.92rem">${escapeHtml(c.tr.replace('Prodüksiyon · ', ''))}</span>
      <span class="branch-count">${c.sectionCount || '—'}</span>`);
    sub.appendChild(subHead);
    const subKids = el('div', 'branch-kids');
    appendSections(subKids, c.sections || []);
    if (!c.sections?.length) subKids.appendChild(el('div', 'leaf', '<em style="color:var(--rose)">boş — gap</em>'));
    sub.appendChild(subKids);
    subHead.addEventListener('click', (e) => { e.stopPropagation(); sub.classList.toggle('open'); });
    kids.appendChild(sub);
  }
  if (!has && !(children && children.length)) kids.appendChild(el('div', 'leaf', '<em style="color:var(--rose)">Henüz yazılmadı — gap report</em>'));
  branch.appendChild(kids);
  head.addEventListener('click', () => branch.classList.toggle('open'));
  return branch;
}

function appendSections(container, secs) {
  const groups = {};
  for (const s of secs) { const k = s.profession || s.subVolume || ''; (groups[k] ||= []).push(s); }
  for (const [sv, list] of Object.entries(groups)) {
    if (sv) container.appendChild(el('div', 'subvol', sv));
    for (const s of list) {
      const leaf = el('div', 'leaf', (s.num != null ? `<span style="color:var(--ink-faint)">${String(s.num).padStart(2, '0')}</span> ` : '') + escapeHtml(s.title));
      leaf.dataset.sec = s.id;
      leaf.addEventListener('click', () => openSection(s.id));
      container.appendChild(leaf);
    }
  }
}

function buildBrand() {
  const m = CODEX.meta;
  $('#brandStats').textContent = `${m.bibleCount} bibles · ${m.sectionCount} sections · ${m.imageCount} plates`;
}

// ---------- welcome ----------
function renderWelcome() {
  const m = CODEX.meta;
  const r = $('#reader'); r.className = 'reader swap';
  r.innerHTML = `
    <div class="welcome">
      <svg class="life-tree" viewBox="0 0 200 240"></svg>
      <h2>The Codex is open.</h2>
      <p>Bir ülkenin sadece haritasını değil; hafızasını, kültürünü ve insanlarını yaşatan arşiv.</p>
      <p style="color:var(--ink-faint);font-size:1rem">Select a volume, follow a cross-link, or open the Relation Atlas.</p>
      <div class="stat-row">
        <div class="stat"><b>${m.bibleCount}</b><span>Bibles</span></div>
        <div class="stat"><b>${m.sectionCount}</b><span>Sections</span></div>
        <div class="stat"><b>${m.entityCount}</b><span>Entities</span></div>
        <div class="stat"><b>${m.imageCount}</b><span>Plates</span></div>
      </div>
    </div>`;
  drawLifeTree($('.welcome .life-tree'));
}

// ---------- reading view ----------
function openSection(id, fromHistory) {
  const rec = SEC[id]; if (!rec) return;
  const { section: s, bible } = rec;
  state.activeSection = id;
  $$('.leaf').forEach(l => l.classList.toggle('active', l.dataset.sec === id));
  // ensure branch(es) open
  const leaf = $(`.leaf[data-sec="${cssEscape(id)}"]`);
  if (leaf) { let br = leaf.closest('.branch'); while (br) { br.classList.add('open'); br = br.parentElement?.closest('.branch'); } leaf.scrollIntoView({ block: 'nearest' }); }

  const r = $('#reader'); r.className = 'reader';
  void r.offsetWidth; r.classList.add('swap');

  const crumbs = [bible.id + ' · ' + bible.tr, s.profession, s.subVolume].filter(Boolean).join('  ·  ');
  let html = `
    <div class="vol-kicker">${escapeHtml(crumbs)}</div>
    <h1 class="sec-title">${escapeHtml(s.title)}</h1>
    <div class="sec-meta">
      ${s.num != null ? `<span class="chip">No. ${String(s.num).padStart(2, '0')}</span>` : ''}
      <span class="chip">${s.kind}</span>
      <span class="chip">${s.wordCount} words</span>
      <span class="chip">${s.entities?.length || 0} links</span>
    </div>
    <div class="rule"></div>`;

  for (const b of s.blocks) {
    html += '<div class="block">';
    if (b.heading) html += `<div class="block-head">${escapeHtml(b.heading)}</div>`;
    html += '<div class="prose">' + renderProse(b.text, s.entities || []) + '</div></div>';
  }

  // related entities
  if (s.entities?.length) {
    html += '<div class="related"><h4>Cross-links in this section</h4><div class="ent-chips">';
    for (const eid of s.entities) { const n = ENT[eid]; if (n) html += `<span class="ent-chip" data-ent="${eid}" style="border-color:${n.color}55">${escapeHtml(n.label)}</span>`; }
    html += '</div></div>';
  }
  r.innerHTML = html;
  $$('.xlink', r).forEach(x => x.addEventListener('click', () => openEntity(x.dataset.ent)));
  $$('.ent-chip', r).forEach(c => c.addEventListener('click', () => openEntity(c.dataset.ent)));
  $('.stage').scrollTop = 0;
  if (innerWidth <= 900) $('.rail').classList.remove('open');
}

// turn prose into paragraphs with entity cross-links (first 2 hits per entity)
function renderProse(text, entIds) {
  const budget = {}; entIds.forEach(id => budget[id] = 2);
  const needles = [];
  for (const id of entIds) {
    const n = ENT[id]; if (!n) continue;
    // use label + entity aliases from config not available client-side; use label only + known surface via graph? use label
    needles.push({ id, type: n.type, re: new RegExp('(' + escapeReg(n.label) + ')', 'gi') });
  }
  return text.split(/\n{2,}/).map(para => {
    let safe = escapeHtml(para.trim());
    for (const nd of needles) {
      if (budget[nd.id] <= 0) continue;
      safe = safe.replace(nd.re, (m) => {
        if (budget[nd.id] <= 0) return m;
        budget[nd.id]--;
        return `<span class="xlink" data-type="${nd.type}" data-ent="${nd.id}">${m}</span>`;
      });
    }
    const cls = para.trim().length < 60 ? ' class="short"' : '';
    return `<p${cls}>${safe.replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

// ---------- entity flyout ----------
function openEntity(id) {
  const n = ENT[id]; if (!n) return;
  const occ = (CODEX.graph.occurrences[id] || []);
  const neighbors = CODEX.graph.edges
    .filter(e => e.a === id || e.b === id)
    .map(e => ({ id: e.a === id ? e.b : e.a, w: e.weight, canonical: e.canonical }))
    .sort((a, b) => b.w - a.w).slice(0, 10);
  const p = $('#entityPanel'); p.classList.remove('hidden');
  const typeLabel = (CODEX.graph.types[n.type] || {}).en || n.type;
  p.innerHTML = `
    <button class="ep-close">✕</button>
    <div class="ep-type" style="color:${n.color}">${typeLabel}</div>
    <div class="ep-name">${escapeHtml(n.label)}</div>
    <div class="ep-sub">${n.total} mentions across ${occ.length} sections</div>
    ${neighbors.length ? `<div class="ep-sec-title">Connected to</div><div class="ent-chips">${neighbors.map(nb => {
      const m = ENT[nb.id]; return m ? `<span class="ent-chip" data-ent="${nb.id}" style="border-color:${m.color}55">${escapeHtml(m.label)}${nb.canonical ? ' ✦' : ''}</span>` : '';
    }).join('')}</div>` : ''}
    <div class="ep-sec-title">Appears in</div>
    ${occ.slice(0, 40).map(o => `<div class="ep-occ" data-sec="${o.sectionId}"><div class="t">${escapeHtml(o.sectionTitle)}</div><div class="c">${escapeHtml(o.volumeTitle)} · ${o.count}×</div></div>`).join('')}
  `;
  $('.ep-close', p).addEventListener('click', () => p.classList.add('hidden'));
  $$('.ep-occ', p).forEach(o => o.addEventListener('click', () => { openSection(o.dataset.sec); }));
  $$('.ent-chip', p).forEach(c => c.addEventListener('click', () => openEntity(c.dataset.ent)));
}

// ---------- overlays: atlas / health / gallery ----------
function wireActions() {
  $$('.pill').forEach(b => b.addEventListener('click', () => openOverlay(b.dataset.view)));
  $('#overlayClose').addEventListener('click', closeOverlay);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeOverlay(); $('#entityPanel').classList.add('hidden'); } });
  wireSearch();
  // mobile menu
  const fab = el('button', 'menu-fab', '☰'); document.body.appendChild(fab);
  fab.addEventListener('click', () => $('.rail').classList.toggle('open'));
}
function closeOverlay() { $('#overlay').classList.add('hidden'); if (window._atlasStop) window._atlasStop(); }
function openOverlay(view) {
  const body = $('#overlayBody'); const ov = $('#overlay'); ov.classList.remove('hidden');
  if (view === 'atlas') renderAtlas(body);
  else if (view === 'health') renderHealth(body);
  else if (view === 'gallery') renderGallery(body);
}

// ATLAS — canvas graph with canonical chains highlighted
function renderAtlas(body) {
  body.innerHTML = `<h2>Relation Atlas</h2>
    <p class="lead">İçerikler birbirine bağlanır. ✦ = canonical chain. Drag to rearrange.</p>
    <canvas id="atlasCanvas"></canvas>
    <div class="legend">${Object.entries(CODEX.graph.types).map(([k, t]) => `<span><i style="background:${t.color}"></i>${t.en}</span>`).join('')}</div>
    <div id="chainList"></div>`;
  // chains listed
  const cl = $('#chainList');
  for (const ch of CODEX.graph.chains) {
    const row = el('div', 'chain-row');
    row.innerHTML = `<div class="chain-label">${escapeHtml(ch.label)}</div>` + ch.steps.map((s, i) => {
      const n = ENT[s]; return (i ? '<span class="chain-arrow">→</span>' : '') + `<span class="chain-node" data-ent="${s}">${n ? escapeHtml(n.label) : s}</span>`;
    }).join(' ');
    cl.appendChild(row);
  }
  $$('.chain-node', cl).forEach(n => n.addEventListener('click', () => { closeOverlay(); openEntity(n.dataset.ent); }));
  simulateGraph($('#atlasCanvas'));
}

function simulateGraph(cv) {
  const ctx = cv.getContext('2d');
  const resize = () => { cv.width = cv.clientWidth * devicePixelRatio; cv.height = cv.clientHeight * devicePixelRatio; };
  resize();
  const N = CODEX.graph.nodes.map(n => ({ ...n, x: Math.random() * cv.width, y: Math.random() * cv.height, vx: 0, vy: 0 }));
  const idx = {}; N.forEach((n, i) => idx[n.id] = i);
  const E = CODEX.graph.edges.filter(e => idx[e.a] != null && idx[e.b] != null);
  const R = (n) => (6 + Math.sqrt(n.total) * 1.6) * devicePixelRatio;
  let drag = null, running = true;
  window._atlasStop = () => running = false;

  function step() {
    if (!running) return;
    const cx = cv.width / 2, cy = cv.height / 2;
    for (const n of N) { n.vx += (cx - n.x) * .0009; n.vy += (cy - n.y) * .0009; }
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
      const a = N[i], b = N[j]; let dx = a.x - b.x, dy = a.y - b.y; let d2 = dx * dx + dy * dy || 1;
      const f = 90000 * devicePixelRatio / d2; const d = Math.sqrt(d2);
      a.vx += dx / d * f * .0006; a.vy += dy / d * f * .0006; b.vx -= dx / d * f * .0006; b.vy -= dy / d * f * .0006;
    }
    for (const e of E) {
      const a = N[idx[e.a]], b = N[idx[e.b]]; let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1;
      const target = (e.canonical ? 120 : 200) * devicePixelRatio; const f = (d - target) * (e.canonical ? .012 : .004);
      a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f;
    }
    for (const n of N) { if (n === drag) continue; n.vx *= .86; n.vy *= .86; n.x += n.vx; n.y += n.vy;
      n.x = Math.max(R(n), Math.min(cv.width - R(n), n.x)); n.y = Math.max(R(n), Math.min(cv.height - R(n), n.y)); }

    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const e of E) { const a = N[idx[e.a]], b = N[idx[e.b]];
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = e.canonical ? 'rgba(244,217,154,.5)' : 'rgba(232,195,122,.09)';
      ctx.lineWidth = (e.canonical ? 1.6 : 0.7) * devicePixelRatio; ctx.stroke(); }
    for (const n of N) {
      ctx.beginPath(); ctx.arc(n.x, n.y, R(n), 0, 7); ctx.fillStyle = n.color; ctx.globalAlpha = .9; ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#efe4cd'; ctx.font = `${11 * devicePixelRatio}px Inter, sans-serif`; ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y + R(n) + 13 * devicePixelRatio);
    }
    requestAnimationFrame(step);
  }
  step();

  const pos = (ev) => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) * devicePixelRatio, y: (ev.clientY - r.top) * devicePixelRatio }; };
  cv.addEventListener('mousedown', ev => { const { x, y } = pos(ev); drag = N.find(n => Math.hypot(n.x - x, n.y - y) < R(n) + 6); });
  cv.addEventListener('mousemove', ev => { if (!drag) return; const { x, y } = pos(ev); drag.x = x; drag.y = y; drag.vx = drag.vy = 0; });
  addEventListener('mouseup', () => { if (drag) { const d = drag; drag = null; } });
  cv.addEventListener('click', ev => { const { x, y } = pos(ev); const hit = N.find(n => Math.hypot(n.x - x, n.y - y) < R(n) + 4); if (hit) { closeOverlay(); openEntity(hit.id); } });
}

// HEALTH — gaps + duplicates
function renderHealth(body) {
  const gaps = REPORT.gaps.gaps, dupes = REPORT.duplicates;
  body.innerHTML = `<h2>Codex Health</h2>
    <p class="lead">Eksik olan bölümleri ve tekrarları otomatik raporlar. New content will auto-place itself here.</p>`;
  body.innerHTML += `<div class="ep-sec-title" style="margin-top:0">Missing & thin volumes (${gaps.length})</div>`;
  for (const g of gaps) {
    const d = g.detail;
    const bar = d ? `<div class="mini-bar"><i style="width:${(d.pagesPresent / d.pagesMax * 100).toFixed(1)}%"></i></div>
      <p style="margin-top:.5rem;font-size:.78rem;color:var(--ink-faint)">${d.pagesPresent} / ${d.pagesMax} pages${d.profession ? ' · ' + d.profession : ''}</p>` : '';
    body.innerHTML += `<div class="gap-card">
      <span class="gap-sev ${g.severity}">${g.severity}</span>
      <h3>${escapeHtml(g.title)}</h3><p>${escapeHtml(g.note)}</p>${bar}</div>`;
  }
  body.innerHTML += `<div class="ep-sec-title">Duplicate clusters (${dupes.duplicates.length})</div>`;
  if (!dupes.duplicates.length) body.innerHTML += `<p style="color:var(--ink-faint)">No duplicates detected.</p>`;
  for (const d of dupes.duplicates) {
    body.innerHTML += `<div class="gap-card"><span class="gap-sev partial">${d.count}× repeated</span>
      <p style="margin-top:.6rem">${d.members.map(m => escapeHtml(m.title) + ' <span style="color:var(--ink-faint)">(' + escapeHtml(m.bible) + ')</span>').join(' · ')}</p></div>`;
  }
}

// GALLERY — 132 image slots, lazy
function renderGallery(body) {
  body.innerHTML = `<h2>Image Vault</h2>
    <p class="vault-note">${escapeHtml(IMAGES.note)}<br><b style="color:var(--gold)">${IMAGES.total}</b> plates · <b style="color:var(--rose)">${IMAGES.total - IMAGES.analyzed}</b> awaiting AI-Vision analysis.</p>
    <div class="grid" id="grid"></div>`;
  const grid = $('#grid');
  const io = new IntersectionObserver((ents) => {
    for (const en of ents) if (en.isIntersecting) { const img = en.target; img.src = img.dataset.src; img.onload = () => img.classList.add('loaded'); io.unobserve(img); }
  }, { rootMargin: '200px' });
  for (const im of IMAGES.images) {
    const tile = el('div', 'tile');
    tile.innerHTML = `<img data-src="${im.path}" alt="${im.file}"><span class="idn">${im.id}</span><span class="badge">${im.status === 'unanalyzed' ? 'unindexed' : im.status}</span>`;
    grid.appendChild(tile); io.observe($('img', tile));
  }
}

// ---------- search ----------
function wireSearch() {
  const input = $('#searchInput'), out = $('#searchResults');
  let all = [];
  for (const b of CODEX.bibles) for (const s of (b.sections || []))
    all.push({ id: s.id, title: s.title, crumb: b.tr + (s.profession ? ' · ' + s.profession : '') + (s.subVolume ? ' · ' + s.subVolume : ''), hay: (s.title + ' ' + s.excerpt).toLocaleLowerCase('tr') });
  input.addEventListener('input', () => {
    const q = input.value.trim().toLocaleLowerCase('tr'); out.innerHTML = '';
    if (q.length < 2) return;
    const hits = all.filter(a => a.hay.includes(q)).slice(0, 30);
    for (const h of hits) {
      const it = el('div', 'sr-item', `<div class="sr-title">${escapeHtml(h.title)}</div><div class="sr-crumb">${escapeHtml(h.crumb)}</div>`);
      it.addEventListener('click', () => { openSection(h.id); out.innerHTML = ''; input.value = ''; });
      out.appendChild(it);
    }
    if (!hits.length) out.innerHTML = '<div class="sr-item"><div class="sr-crumb">No matches</div></div>';
  });
  input.addEventListener('blur', () => setTimeout(() => out.innerHTML = '', 200));
}

// ---------- utils ----------
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function cssEscape(s) { return (window.CSS && CSS.escape) ? CSS.escape(s) : s.replace(/"/g, '\\"'); }
