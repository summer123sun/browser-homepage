/* =========================================================
   起始页 · 交互逻辑（原生 JS，无依赖，ES2020）
   零外部请求：所有图标为内联 SVG，所有数据存 localStorage
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- 常量 ---------------- */

  /* v3：新增「学术研究」与「国外 AI 工具」两个分类，更新键名以跳过旧版本残留的本地数据
     （v1/v2 的数据集不含 research / ai-global，若不换键，用户本机旧数据会遮住新默认集） */
  var KEY_DATA = 'xyai.homepage.data.v3';
  var KEY_THEME = 'xyai.homepage.theme.v1';
  var KEY_ENGINE = 'xyai.homepage.engine.v1';
  var KEY_SAFE_ONLY = 'xyai.homepage.safeonly.v1';
  var KEY_UI = 'xyai.homepage.ui.v1';

  /* 背景预设：图片放在 assets/ 下本地加载；file 为空表示「无背景」。
     fallback 是为每张图配的近似渐变，图片缺失时 CSS 底层渐变兜底，不会出现破图。 */
  var BG_PRESETS = [
    { id: 'none', label: '无背景', file: '', fallback: '' },
    { id: 'aurora', label: '极光山脊', file: 'assets/bg-aurora.jpg', fallback: 'linear-gradient(160deg,#0B1B33 0%,#123A5C 45%,#0A1424 100%)' },
    { id: 'stacks', label: '书架暖褐', file: 'assets/bg-stacks.jpg', fallback: 'linear-gradient(160deg,#3A2A1E 0%,#5C4231 45%,#241A12 100%)' },
    { id: 'dune', label: '沙丘暖光', file: 'assets/bg-dune.jpg', fallback: 'linear-gradient(160deg,#E8C89A 0%,#D9A970 45%,#B8814B 100%)' },
    { id: 'rain', label: '雨夜玻璃', file: 'assets/bg-rain.jpg', fallback: 'linear-gradient(160deg,#0E1A26 0%,#17324A 45%,#08111C 100%)' },
    { id: 'nebula', label: '星云深空', file: 'assets/bg-nebula.jpg', fallback: 'linear-gradient(160deg,#1A1030 0%,#3B1F55 45%,#0D0718 100%)' }
  ];

  var BG_ORDER = BG_PRESETS.map(function (p) { return p.id; });

  var DENSITIES = ['comfort', 'compact', 'minimal'];
  var VIEWS = ['shelf', 'list'];
  var COLS = [1, 2, 3, 4];

  var DENSITY_LABEL = { comfort: '舒适', compact: '紧凑', minimal: '极简' };
  var VIEW_LABEL = { shelf: '书架', list: '清单' };

  var ENGINES = [
    { id: 'google', label: 'Google', template: 'https://www.google.com/search?q=' },
    { id: 'bing', label: 'Bing', template: 'https://www.bing.com/search?q=' },
    { id: 'baidu', label: '百度', template: 'https://www.baidu.com/s?wd=' },
    { id: 'duckduckgo', label: 'DuckDuckGo', template: 'https://duckduckgo.com/?q=' }
  ];
  var DEFAULT_ENGINE = 'google';

  var THEME_ORDER = ['auto', 'light', 'dark'];
  var THEME_LABEL = { auto: '自动', light: '亮', dark: '暗' };

  var PALETTE = [
    '#2C5CC5', '#7A4CC8', '#C2552E', '#2E8B76', '#4A6FBF', '#55606B',
    '#8A5CB8', '#1F7A9C', '#B4622A', '#4E8B3F', '#8A6A3C', '#3F7F9E'
  ];

  var WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  var ICONS = {
    search: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="7" cy="7" r="4.6"/><path d="M10.5 10.5 14 14"/></svg>',
    pencil: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11.2 2.9 13.1 4.8 5.7 12.2 3 13l.8-2.7Z"/><path d="M9.6 4.5 11.5 6.4"/></svg>',
    trash: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.6h10M6.6 4.6V3.1h2.8v1.5M4.6 4.6l.6 8.3h5.6l.6-8.3"/></svg>',
    grip: '<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="6" cy="4" r="1"/><circle cx="10" cy="4" r="1"/><circle cx="6" cy="8" r="1"/><circle cx="10" cy="8" r="1"/><circle cx="6" cy="12" r="1"/><circle cx="10" cy="12" r="1"/></svg>'
  };

  /* ---------------- 状态 ---------------- */

  var state = {
    theme: 'auto',
    engine: DEFAULT_ENGINE,
    safeOnly: false,
    editMode: false,
    forceSearch: false,
    editing: null          // { cat, link } 编辑链接时的上下文
  };

  /* 界面偏好（布局自由度），持久化到 KEY_UI */
  var prefs = {
    bg: 'none',
    bright: 1,
    blur: 0,
    cols: 3,
    density: 'comfort',
    view: 'shelf',
    wide: false,
    panelOpen: false,
    collapsed: {}         // catId -> true
  };

  var data = { version: 1, categories: [] };
  var cardMap = {};         // catId -> card 元素
  var rowMap = {};          // catId -> 行元素数组
  var dragState = null;     // { catId, linkId }
  var catDrag = null;       // { catId } 分类整本拖拽
  var toastTimer = null;
  var pendingImportMode = 'overwrite';
  var firstRender = true;   // 只在首次渲染时播入场序列
  var bgFront = 0;          // 交叉淡入用：当前可见的背景槽
  var bgSlots = [];
  var bgAvail = {};         // bgId -> 图片是否可加载

  /* ---------------- DOM ---------------- */

  function $(id) { return document.getElementById(id); }

  var el = {};
  function cacheDom() {
    el.grid = $('grid');
    el.emptyState = $('emptyState');
    el.emptyTitle = $('emptyTitle');
    el.emptyDesc = $('emptyDesc');
    el.clearFilterBtn = $('clearFilterBtn');
    el.searchInput = $('searchInput');
    el.searchIcon = $('searchIcon');
    el.modeToggle = $('modeToggle');
    el.engineSelect = $('engineSelect');
    el.matchCount = $('matchCount');
    el.modeBadge = $('modeBadge');
    el.hintLine = $('hintLine');
    el.clockHM = $('clockHM');
    el.clockColon = $('clockColon');
    el.clockS = $('clockS');
    el.clockDate = $('clockDate');
    el.greeting = $('greeting');
    el.themeBtn = $('themeBtn');
    el.editBtn = $('editBtn');
    el.exportBtn = $('exportBtn');
    el.importOverwriteBtn = $('importOverwriteBtn');
    el.importMergeBtn = $('importMergeBtn');
    el.resetBtn = $('resetBtn');
    el.addCatBtn = $('addCatBtn');
    el.safetyToggle = $('safetyToggle');
    el.toast = $('toast');
    el.metaThemeColor = $('metaThemeColor');
    el.linkDialog = $('linkDialog');
    el.linkForm = $('linkForm');
    el.linkDialogTitle = $('linkDialogTitle');
    el.linkCat = $('linkCat');
    el.linkName = $('linkName');
    el.linkUrl = $('linkUrl');
    el.linkDesc = $('linkDesc');
    el.linkSafety = $('linkSafety');
    el.linkNote = $('linkNote');
    el.noteField = $('noteField');
    el.linkNameError = $('linkNameError');
    el.linkUrlError = $('linkUrlError');
    el.catDialog = $('catDialog');
    el.catForm = $('catForm');
    el.catDialogTitle = $('catDialogTitle');
    el.catName = $('catName');
    el.catTag = $('catTag');
    el.catSwatches = $('catSwatches');
    el.catNameError = $('catNameError');
    el.confirmDialog = $('confirmDialog');
    el.confirmTitle = $('confirmTitle');
    el.confirmBody = $('confirmBody');
    el.importFile = $('importFile');

    /* 背景层 */
    el.bgA = $('bgA');
    el.bgB = $('bgB');
    bgSlots = [el.bgA, el.bgB];

    /* 布局与背景面板 */
    el.panel = $('panel');
    el.panelToggle = $('panelToggle');
    el.panelToggleText = $('panelToggleText');
    el.bgChips = $('bgChips');
    el.brightRange = $('brightRange');
    el.brightOut = $('brightOut');
    el.blurRange = $('blurRange');
    el.blurOut = $('blurOut');
    el.segCols = $('segCols');
    el.segDensity = $('segDensity');
    el.segView = $('segView');
    el.wideToggle = $('wideToggle');
    el.gridHint = $('gridHint');
  }

  /* ---------------- 小工具 ---------------- */

  function h(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'style') node.setAttribute('style', v);
        else if (k.indexOf('on') === 0 && typeof v === 'function') {
          node.addEventListener(k.slice(2), v);
        } else if (v === true) node.setAttribute(k, '');
        else node.setAttribute(k, String(v));
      });
    }
    if (children !== null && children !== undefined) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c === null || c === undefined) return;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function isHex(c) { return typeof c === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c.trim()); }

  function rgba(hex, alpha) {
    var hx = String(hex || '').trim().replace('#', '');
    if (hx.length === 3) hx = hx[0] + hx[0] + hx[1] + hx[1] + hx[2] + hx[2];
    if (!/^[0-9a-f]{6}$/i.test(hx)) return 'rgba(78, 85, 92, .12)';
    var n = parseInt(hx, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
  }

  function genId(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function countLinks(d) {
    var total = 0;
    (d.categories || []).forEach(function (c) { total += (c.links || []).length; });
    return total;
  }

  /* ---------------- 本地存储（file:// 下可能被禁用，降级为内存） ---------------- */

  var memoryStore = {};

  function storeGet(key) {
    try {
      var v = window.localStorage.getItem(key);
      return v === null ? (key in memoryStore ? memoryStore[key] : null) : v;
    } catch (e) {
      return key in memoryStore ? memoryStore[key] : null;
    }
  }

  function storeSet(key, value) {
    memoryStore[key] = value;
    try { window.localStorage.setItem(key, value); } catch (e) { /* 忽略：降级为内存存储 */ }
  }

  function storeRemove(key) {
    delete memoryStore[key];
    try { window.localStorage.removeItem(key); } catch (e) { /* noop */ }
  }

  /* ---------------- 数据规范化（容错，缺字段不白屏） ---------------- */

  function normalizeData(raw) {
    var out = { version: 1, categories: [] };
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.categories)) return out;

    var usedCatIds = {};
    var usedLinkIds = {};

    raw.categories.forEach(function (c, ci) {
      if (!c || typeof c !== 'object' || Array.isArray(c)) return;

      var cid = typeof c.id === 'string' && c.id.trim() ? c.id.trim() : genId('c');
      if (usedCatIds[cid]) cid = genId('c');
      usedCatIds[cid] = true;

      var cat = {
        id: cid,
        name: typeof c.name === 'string' && c.name.trim() ? c.name.trim() : '未命名分类',
        tag: typeof c.tag === 'string' ? c.tag.trim().toUpperCase() : '',
        color: isHex(c.color) ? c.color.trim() : '#55606B',
        links: []
      };

      if (Array.isArray(c.links)) {
        c.links.forEach(function (l) {
          if (!l || typeof l !== 'object' || Array.isArray(l)) return;
          var lid = typeof l.id === 'string' && l.id.trim() ? l.id.trim() : genId('l');
          if (usedLinkIds[lid]) lid = genId('l');
          usedLinkIds[lid] = true;

          var link = {
            id: lid,
            name: typeof l.name === 'string' && l.name.trim() ? l.name.trim() : '未命名',
            url: typeof l.url === 'string' ? l.url.trim() : '',
            desc: typeof l.desc === 'string' ? l.desc : '',
            safety: (l.safety === 'safe' || l.safety === 'caution' || l.safety === 'pending') ? l.safety : 'pending'
          };
          if (typeof l.note === 'string' && l.note.trim()) link.note = l.note.trim();
          cat.links.push(link);
        });
      }
      out.categories.push(cat);
    });

    return out;
  }

  /* 取用 data.js 的默认数据：兼容 window.DEFAULT_DATA 与顶层 const 两种写法 */
  function getDefaultData() {
    try {
      if (typeof DEFAULT_DATA !== 'undefined' && DEFAULT_DATA) return DEFAULT_DATA;
    } catch (e) { /* 未定义 */ }
    if (window.DEFAULT_DATA) return window.DEFAULT_DATA;
    return null;
  }

  function loadData() {
    var fallback = getDefaultData();
    var saved = storeGet(KEY_DATA);
    if (!saved) return normalizeData(fallback);
    try {
      return normalizeData(JSON.parse(saved));
    } catch (e) {
      return normalizeData(fallback);
    }
  }

  function saveData() {
    try {
      storeSet(KEY_DATA, JSON.stringify(data));
    } catch (e) {
      /* 存储失败不阻断界面 */
    }
  }

  function findCat(id) {
    for (var i = 0; i < data.categories.length; i++) {
      if (data.categories[i].id === id) return data.categories[i];
    }
    return null;
  }

  /* ---------------- 主题 ---------------- */

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    el.themeBtn.textContent = '主题 · ' + THEME_LABEL[state.theme];
    el.themeBtn.setAttribute('aria-label', '切换主题，当前：' + THEME_LABEL[state.theme]);
    updateThemeColor();
  }

  function updateThemeColor() {
    var resolved = state.theme;
    if (resolved === 'auto') {
      resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    el.metaThemeColor.setAttribute('content', resolved === 'dark' ? '#15171A' : '#F4F4F2');
  }

  function cycleTheme() {
    var i = THEME_ORDER.indexOf(state.theme);
    state.theme = THEME_ORDER[(i + 1) % THEME_ORDER.length];
    storeSet(KEY_THEME, state.theme);
    applyTheme();
    toast('主题：' + THEME_LABEL[state.theme]);
  }

  /* ---------------- 时钟 ---------------- */

  function greetingFor(hour) {
    if (hour < 5) return '凌晨好，早点休息';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    if (hour < 23) return '晚上好';
    return '夜深了';
  }

  function tickClock() {
    var now = new Date();
    var hh = pad2(now.getHours());
    var mm = pad2(now.getMinutes());
    var ss = pad2(now.getSeconds());
    el.clockHM.textContent = hh + ':' + mm;
    el.clockS.textContent = ss;
    el.clockColon.classList.toggle('is-dim', now.getSeconds() % 2 === 0);
    el.clockDate.textContent = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + WEEKDAYS[now.getDay()];
    el.greeting.textContent = greetingFor(now.getHours());
  }

  /* ---------------- 渲染 ---------------- */

  function badgeText(name) {
    var s = String(name || '').trim();
    if (!s) return '·';
    var ch = s.charAt(0);
    if (/[\u3400-\u9fff]/.test(ch)) return ch;
    return ch.toUpperCase();
  }

  function safetyLabel(link) {
    if (link.safety === 'safe') return '安全（已核实）';
    if (link.safety === 'caution') return link.note ? '谨慎：' + link.note : '谨慎';
    return '未核实';
  }

  function safetyNode(link) {
    var label = safetyLabel(link);
    if (link.safety === 'caution' && link.note) {
      var btn = h('button', {
        type: 'button',
        class: 'safety-dot',
        'data-safety': 'caution',
        'data-tip': link.note,
        'aria-label': label
      });
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.toggle('tip-open');
      });
      return btn;
    }
    return h('span', { class: 'safety-dot', 'data-safety': link.safety, role: 'img', 'aria-label': label });
  }

  function iconBtn(label, ariaLabel, onClick, icon, extraClass) {
    var btn = h('button', {
      type: 'button',
      class: 'icon-btn' + (extraClass ? ' ' + extraClass : ''),
      'aria-label': ariaLabel,
      title: label
    });
    btn.innerHTML = icon;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  function miniBtn(text, ariaLabel, onClick, extraClass) {
    var btn = h('button', {
      type: 'button',
      class: 'mini' + (extraClass ? ' ' + extraClass : ''),
      'aria-label': ariaLabel,
      text: text
    });
    btn.addEventListener('click', onClick);
    return btn;
  }

  function buildLinkRow(cat, link, index) {
    var row = h('li', { class: 'link-row', 'data-link-id': link.id, 'data-index': String(index) });
    row._cat = cat;
    row._link = link;
    row._catId = cat.id;
    if (state.editMode) row.setAttribute('draggable', 'true');

    var grip = h('span', { class: 'drag-handle', 'aria-hidden': 'true' });
    grip.innerHTML = ICONS.grip;
    row.appendChild(grip);

    var badge = h('span', { class: 'link-badge', 'aria-hidden': 'true', text: badgeText(link.name) });
    badge.style.setProperty('--cat', cat.color);
    badge.style.setProperty('--cat-soft', rgba(cat.color, 0.12));
    row.appendChild(badge);

    var main = h('a', {
      class: 'link-main',
      href: link.url || '#',
      target: '_blank',
      rel: 'noopener noreferrer',
      title: link.url || ''
    });
    main.appendChild(h('span', { class: 'link-name', text: link.name }));
    main.appendChild(h('span', { class: 'link-desc', text: link.desc || '' }));
    row.appendChild(main);

    row.appendChild(safetyNode(link));

    var acts = h('span', { class: 'row-actions' });
    acts.appendChild(iconBtn('编辑', '编辑链接「' + link.name + '」', function () { openLinkDialog(link, cat); }, ICONS.pencil));
    acts.appendChild(iconBtn('删除', '删除链接「' + link.name + '」', function () { deleteLink(cat, link); }, ICONS.trash, 'danger'));
    row.appendChild(acts);

    return row;
  }

  /* 分类 id 未必能直接当 DOM id 用（导入的数据可能带特殊字符） */
  function domSafeId(s) {
    return String(s || '').replace(/[^A-Za-z0-9_-]/g, '');
  }

  function buildCategory(cat, index) {
    var collapsed = !!prefs.collapsed[cat.id];
    var card = h('article', { class: 'cat', 'data-cat-id': cat.id });
    card.style.setProperty('--cat', cat.color);
    if (collapsed) card.classList.add('is-collapsed');

    var listId = 'links-' + domSafeId(cat.id);

    /* ---- 书脊：5px 彩色条 + 竖排索书号（可点，折叠/展开） ---- */
    var spine = h('button', {
      type: 'button',
      class: 'cat-spine',
      'aria-expanded': collapsed ? 'false' : 'true',
      'aria-controls': listId,
      'aria-label': (collapsed ? '展开分类「' : '折叠分类「') + cat.name + '」',
      title: collapsed ? '展开分类' : '折叠分类'
    });
    spine.appendChild(h('span', {
      class: 'cat-callno',
      'aria-hidden': 'true',
      text: pad2(index + 1) + ' · ' + (cat.tag || '')
    }));
    spine.addEventListener('click', function () { toggleCollapsed(cat.id); });
    card.appendChild(spine);

    /* ---- 书页内容 ---- */
    var body = h('div', { class: 'cat-body' });

    var head = h('header', { class: 'cat-head' });
    var title = h('div', { class: 'cat-title' });

    var grip = h('span', { class: 'cat-grip', draggable: 'true', title: '拖动整本改变分类顺序' });
    grip.innerHTML = ICONS.grip;
    grip.setAttribute('aria-hidden', 'true');
    title.appendChild(grip);

    var nameWrap = h('h3', { class: 'cat-name' });
    var fold = h('button', {
      type: 'button',
      class: 'cat-fold',
      'aria-expanded': collapsed ? 'false' : 'true',
      'aria-controls': listId
    });
    fold.textContent = cat.name;
    fold.addEventListener('click', function () { toggleCollapsed(cat.id); });
    nameWrap.appendChild(fold);
    title.appendChild(nameWrap);

    head.appendChild(title);

    var meta = h('div', { class: 'cat-meta' });
    meta.appendChild(h('span', { class: 'cat-tag', text: cat.tag || '' }));
    meta.appendChild(h('span', { class: 'cat-count', text: String(cat.links.length) }));
    head.appendChild(meta);
    body.appendChild(head);

    body.appendChild(h('div', { class: 'cat-rule' }));

    var actions = h('div', { class: 'cat-actions edit-only' });
    actions.appendChild(miniBtn('＋ 链接', '在分类「' + cat.name + '」中新增链接', function () { openLinkDialog(null, cat); }));
    actions.appendChild(miniBtn('改名', '重命名分类「' + cat.name + '」', function () { openCatDialog(cat); }));
    actions.appendChild(miniBtn('删除', '删除分类「' + cat.name + '」', function () { deleteCategory(cat); }, 'danger'));
    body.appendChild(actions);

    var collapsedHint = h('p', {
      class: 'cat-collapsed',
      text: cat.links.length + ' 项 · 已折叠'
    });
    collapsedHint.hidden = !collapsed;
    body.appendChild(collapsedHint);

    var list = h('ul', { class: 'links', 'data-cat-id': cat.id, id: listId });
    var rows = [];
    cat.links.forEach(function (link, i) {
      var row = buildLinkRow(cat, link, i);
      rows.push(row);
      list.appendChild(row);
    });
    rowMap[cat.id] = rows;
    body.appendChild(list);

    var emptyNote = h('p', { class: 'cat-empty', text: '（无匹配）' });
    emptyNote.hidden = true;
    body.appendChild(emptyNote);

    card.appendChild(body);

    cardMap[cat.id] = card;
    return card;
  }

  function renderGrid() {
    cardMap = {};
    rowMap = {};
    el.grid.textContent = '';
    try {
      data.categories.forEach(function (cat, i) {
        var card = buildCategory(cat, i);
        if (firstRender) card.style.setProperty('--enter-delay', Math.min(i * 40, 400) + 'ms');
        el.grid.appendChild(card);
      });
    } catch (err) {
      el.grid.appendChild(h('p', { class: 'cat-empty', text: '数据渲染出错：' + (err && err.message ? err.message : '未知错误') }));
    }
    if (firstRender) {
      el.grid.classList.add('is-entering');
      firstRender = false;
    }
    applyFilter();
  }

  /* ---------------- 过滤 / 状态 ---------------- */

  function matchLink(link, cat, q) {
    if (String(link.name || '').toLowerCase().indexOf(q) >= 0) return true;
    if (String(link.desc || '').toLowerCase().indexOf(q) >= 0) return true;
    if (String(cat.name || '').toLowerCase().indexOf(q) >= 0) return true;
    if (String(cat.tag || '').toLowerCase().indexOf(q) >= 0) return true;
    return false;
  }

  function currentMode() {
    var raw = el.searchInput.value;
    var t = raw.trim();
    if (!t) return 'filter';
    if (t.charAt(0) === '!') return 'search';
    if (looksLikeUrl(t)) return 'url';
    if (state.forceSearch) return 'search';
    return 'filter';
  }

  function looksLikeUrl(t) {
    if (!t) return false;
    if (/\s/.test(t)) return false;
    if (t.indexOf('.') >= 0) return true;
    if (/^https?:/i.test(t)) return true;
    return false;
  }

  function currentEngine() {
    for (var i = 0; i < ENGINES.length; i++) {
      if (ENGINES[i].id === state.engine) return ENGINES[i];
    }
    return ENGINES[0];
  }

  function applyFilter() {
    var mode = currentMode();
    var q = el.searchInput.value.trim().toLowerCase();
    var filtering = mode === 'filter' && q.length > 0;
    var visible = 0;
    var total = 0;

    data.categories.forEach(function (cat) {
      var rows = rowMap[cat.id] || [];
      var catVisible = 0;
      cat.links.forEach(function (link, i) {
        total++;
        var okText = !filtering || matchLink(link, cat, q);
        var okSafety = !state.safeOnly || link.safety !== 'safe';
        var ok = okText && okSafety;
        var row = rows[i];
        if (row) {
          row.hidden = !ok;
          row.classList.toggle('is-dimmed', ok && filtering && !matchLink(link, cat, q));
        }
        if (ok) catVisible++;
      });
      visible += catVisible;

      var card = cardMap[cat.id];
      if (!card) return;
      if (state.editMode) {
        card.hidden = false;
        var note = card.querySelector('.cat-empty');
        if (note) note.hidden = catVisible > 0;
      } else {
        card.hidden = catVisible === 0;
      }
    });

    // 状态行
    var text;
    if (filtering) text = visible + ' 项匹配';
    else if (state.safeOnly) text = visible + ' 项需留意';
    else text = '共 ' + total + ' 项';
    el.matchCount.textContent = text;

    el.modeBadge.setAttribute('data-mode', mode);
    el.modeBadge.textContent = mode === 'search' ? '搜索' : (mode === 'url' ? '打开' : '过滤');
    el.modeToggle.setAttribute('aria-pressed', String(state.forceSearch));
    el.modeToggle.textContent = state.forceSearch ? '搜索' : '过滤';

    var eng = currentEngine();
    if (mode === 'search') {
      el.hintLine.textContent = '↵ 用 ' + eng.label + ' 搜索 · ! 前缀 · Esc 清除';
    } else if (mode === 'url') {
      el.hintLine.textContent = '↵ 打开该网址 · Esc 清除 · / 聚焦';
    } else {
      el.hintLine.textContent = '↵ 打开首个匹配 · / 聚焦 · ! 搜索 · Ctrl+K';
    }

    // 空状态
    if (visible === 0) {
      el.emptyState.hidden = false;
      if (total === 0) {
        el.emptyTitle.textContent = '还没有任何链接';
        el.emptyDesc.textContent = '按「E」或点「编辑」按钮添加第一个分类与链接。';
        el.clearFilterBtn.textContent = '进入编辑模式';
      } else if (filtering) {
        el.emptyTitle.textContent = '没有匹配「' + el.searchInput.value.trim() + '」的链接';
        el.emptyDesc.textContent = '换个更短的关键词，或清除当前筛选重新浏览全部链接。';
        el.clearFilterBtn.textContent = '清除筛选';
      } else if (state.safeOnly) {
        el.emptyTitle.textContent = '没有需要留意的条目';
        el.emptyDesc.textContent = '当前所有链接都已核实为安全，或尚未标记状态。';
        el.clearFilterBtn.textContent = '关闭安全视图';
      } else {
        el.emptyTitle.textContent = '这里还没有链接';
        el.emptyDesc.textContent = '点击「编辑」添加常用站点。';
        el.clearFilterBtn.textContent = '进入编辑模式';
      }
    } else {
      el.emptyState.hidden = true;
    }
  }

  function firstVisibleRow() {
    for (var i = 0; i < data.categories.length; i++) {
      var cat = data.categories[i];
      var rows = rowMap[cat.id] || [];
      for (var j = 0; j < rows.length; j++) {
        if (!rows[j].hidden) return rows[j];
      }
    }
    return null;
  }

  function normalizeUrl(u) {
    var s = String(u || '').trim();
    if (!s) return '';
    if (/^[a-z][a-z0-9+.\-]*:/i.test(s)) return s;
    return 'https://' + s;
  }

  function handleEnter() {
    var mode = currentMode();
    var raw = el.searchInput.value.trim();
    if (!raw) { toast('请输入内容'); return; }

    if (mode === 'search') {
      var q = raw.charAt(0) === '!' ? raw.slice(1).trim() : raw;
      if (!q) { toast('请输入搜索关键词'); return; }
      var eng = currentEngine();
      window.open(eng.template + encodeURIComponent(q), '_blank', 'noopener');
      return;
    }
    if (mode === 'url') {
      window.open(normalizeUrl(raw), '_blank', 'noopener');
      return;
    }
    var row = firstVisibleRow();
    if (row && row._link) window.open(row._link.url, '_blank', 'noopener');
    else toast('没有匹配的链接，可先清除筛选');
  }

  function clearSearch() {
    el.searchInput.value = '';
    applyFilter();
  }

  /* ---------------- 界面偏好：背景 + 布局自由度 ---------------- */

  function bgPreset(id) {
    for (var i = 0; i < BG_PRESETS.length; i++) {
      if (BG_PRESETS[i].id === id) return BG_PRESETS[i];
    }
    return BG_PRESETS[0];
  }

  function loadPrefs() {
    var raw = storeGet(KEY_UI);
    if (!raw) return;
    var obj;
    try { obj = JSON.parse(raw); } catch (e) { return; }
    if (!obj || typeof obj !== 'object') return;
    if (BG_ORDER.indexOf(obj.bg) >= 0) prefs.bg = obj.bg;
    if (typeof obj.bright === 'number' && isFinite(obj.bright) && obj.bright >= 0.3 && obj.bright <= 1.4) {
      prefs.bright = Math.round(obj.bright * 100) / 100;
    }
    if (typeof obj.blur === 'number' && isFinite(obj.blur) && obj.blur >= 0 && obj.blur <= 20) {
      prefs.blur = Math.round(obj.blur);
    }
    if (COLS.indexOf(obj.cols) >= 0) prefs.cols = obj.cols;
    if (DENSITIES.indexOf(obj.density) >= 0) prefs.density = obj.density;
    if (VIEWS.indexOf(obj.view) >= 0) prefs.view = obj.view;
    if (typeof obj.wide === 'boolean') prefs.wide = obj.wide;
    if (typeof obj.panelOpen === 'boolean') prefs.panelOpen = obj.panelOpen;
    if (obj.collapsed && typeof obj.collapsed === 'object' && !Array.isArray(obj.collapsed)) {
      prefs.collapsed = obj.collapsed;
    }
  }

  function savePrefs() {
    try { storeSet(KEY_UI, JSON.stringify(prefs)); } catch (e) { /* 忽略：降级为内存存储 */ }
  }

  /* 背景图层叠两层：图片在上、近似渐变在下。图片加载失败时底层渐变露出，不会破图。 */
  function bgLayers(p) {
    if (!p || !p.file) return '';
    return 'url("' + p.file + '"), ' + p.fallback;
  }

  function applyBackground(animate) {
    var p = bgPreset(prefs.bg);
    var next = 1 - bgFront;
    var incoming = bgSlots[next];
    var outgoing = bgSlots[bgFront];
    if (!incoming || !outgoing) return;

    incoming.style.backgroundImage = bgLayers(p);

    if (animate) {
      incoming.classList.add('is-on');
      outgoing.classList.remove('is-on');
    } else {
      incoming.style.transition = 'none';
      outgoing.style.transition = 'none';
      incoming.classList.add('is-on');
      outgoing.classList.remove('is-on');
      void incoming.offsetWidth;          // 强制回流，让首次切换不产生过渡
      incoming.style.transition = '';
      outgoing.style.transition = '';
    }
    bgFront = next;

    document.body.setAttribute('data-bg', p.id);
    Array.prototype.forEach.call(el.bgChips ? el.bgChips.children : [], function (c) {
      c.setAttribute('aria-checked', String(c.getAttribute('data-bg-id') === p.id));
    });
  }

  function cycleBg(delta) {
    var i = BG_ORDER.indexOf(prefs.bg);
    if (i < 0) i = 0;
    var next = (i + delta + BG_ORDER.length) % BG_ORDER.length;
    prefs.bg = BG_ORDER[next];
    savePrefs();
    applyBackground(true);
    toast('背景：' + bgPreset(prefs.bg).label);
  }

  function renderBgChips() {
    if (!el.bgChips) return;
    el.bgChips.textContent = '';
    BG_PRESETS.forEach(function (p) {
      var chip = h('button', {
        type: 'button',
        class: 'bg-chip',
        role: 'radio',
        'aria-checked': String(p.id === prefs.bg),
        'data-bg-id': p.id,
        'data-label': p.label,
        'aria-label': '背景：' + p.label,
        title: p.label
      });
      if (p.file) chip.style.backgroundImage = bgLayers(p);
      chip.addEventListener('click', function () {
        prefs.bg = p.id;
        savePrefs();
        applyBackground(true);
        toast('背景：' + p.label);
      });
      el.bgChips.appendChild(chip);
    });
  }

  /* 探测本地图片是否可加载；缺失时给缩略芯片打上斜纹标记（主体仍由渐变兜底） */
  function probeBgImages() {
    BG_PRESETS.forEach(function (p) {
      if (!p.file) { bgAvail[p.id] = true; return; }
      var img = new Image();
      img.onload = function () { bgAvail[p.id] = true; };
      img.onerror = function () {
        bgAvail[p.id] = false;
        var chip = el.bgChips ? el.bgChips.querySelector('[data-bg-id="' + p.id + '"]') : null;
        if (chip) chip.classList.add('is-missing');
      };
      img.src = p.file;
    });
  }

  function maxColsForWidth(w) {
    if (w >= 1200) return 4;
    if (w >= 980) return 3;
    if (w >= 660) return 2;
    return 1;
  }

  function applyColumns() {
    if (!el.grid) return;
    var maxc = maxColsForWidth(window.innerWidth || 1280);
    var eff = Math.max(1, Math.min(prefs.cols, maxc));
    el.grid.style.setProperty('--cols', String(eff));
    if (el.gridHint) {
      var suffix = eff !== prefs.cols ? '（已按窗口收窄）' : '';
      el.gridHint.textContent = eff + ' 列 · ' + VIEW_LABEL[prefs.view] + suffix;
    }
  }

  function syncSeg(seg, value) {
    if (!seg) return;
    Array.prototype.forEach.call(seg.children, function (b) {
      b.setAttribute('aria-checked', String(b.getAttribute('data-v') === value));
    });
  }

  function bindSeg(seg, onPick) {
    if (!seg) return;
    Array.prototype.forEach.call(seg.children, function (btn) {
      btn.addEventListener('click', function () {
        syncSeg(seg, btn.getAttribute('data-v'));
        onPick(btn.getAttribute('data-v'));
      });
    });
  }

  function setPanelOpen(open, persist) {
    prefs.panelOpen = !!open;
    if (el.panel) el.panel.hidden = !prefs.panelOpen;
    if (el.panelToggle) el.panelToggle.setAttribute('aria-expanded', String(prefs.panelOpen));
    if (el.panelToggleText) el.panelToggleText.textContent = prefs.panelOpen ? '收起面板' : '布局 · 背景';
    if (persist !== false) savePrefs();
  }

  function applyPrefs() {
    document.body.setAttribute('data-density', prefs.density);
    document.body.setAttribute('data-view', prefs.view);
    document.body.classList.toggle('is-wide', !!prefs.wide);
    document.documentElement.style.setProperty('--bg-bright', String(prefs.bright));
    document.documentElement.style.setProperty('--bg-blur', prefs.blur + 'px');

    if (el.wideToggle) el.wideToggle.checked = !!prefs.wide;
    if (el.brightRange) el.brightRange.value = String(prefs.bright);
    if (el.brightOut) el.brightOut.textContent = Number(prefs.bright).toFixed(2);
    if (el.blurRange) el.blurRange.value = String(prefs.blur);
    if (el.blurOut) el.blurOut.textContent = prefs.blur + 'px';

    syncSeg(el.segCols, String(prefs.cols));
    syncSeg(el.segDensity, prefs.density);
    syncSeg(el.segView, prefs.view);

    applyColumns();
    setPanelOpen(prefs.panelOpen, false);
  }

  /* 单个分类折叠：只改卡片状态，不整页重渲染（保住焦点） */
  function applyCollapsed() {
    data.categories.forEach(function (cat) {
      var card = cardMap[cat.id];
      if (!card) return;
      var collapsed = !!prefs.collapsed[cat.id];
      card.classList.toggle('is-collapsed', collapsed);
      var spine = card.querySelector('.cat-spine');
      var fold = card.querySelector('.cat-fold');
      var hint = card.querySelector('.cat-collapsed');
      if (spine) {
        spine.setAttribute('aria-expanded', String(!collapsed));
        spine.setAttribute('aria-label', (collapsed ? '展开分类「' : '折叠分类「') + cat.name + '」');
      }
      if (fold) fold.setAttribute('aria-expanded', String(!collapsed));
      if (hint) hint.hidden = !collapsed;
    });
  }

  function toggleCollapsed(catId) {
    if (prefs.collapsed[catId]) delete prefs.collapsed[catId];
    else prefs.collapsed[catId] = true;
    savePrefs();
    applyCollapsed();
  }

  /* ---------------- 编辑模式 ---------------- */

  function setEditMode(on) {
    state.editMode = !!on;
    document.body.classList.toggle('is-editing', state.editMode);
    el.editBtn.setAttribute('aria-pressed', String(state.editMode));
    el.editBtn.textContent = state.editMode ? '完成' : '编辑';
    el.editBtn.setAttribute('aria-label', state.editMode ? '退出编辑模式' : '进入编辑模式');
    renderGrid();
  }

  function openLinkDialog(link, cat) {
    state.editing = link ? { link: link, cat: cat } : null;

    // 分类下拉
    el.linkCat.textContent = '';
    data.categories.forEach(function (c) {
      var opt = h('option', { value: c.id, text: c.name });
      if (cat && c.id === cat.id) opt.selected = true;
      el.linkCat.appendChild(opt);
    });

    el.linkDialogTitle.textContent = link ? '编辑链接' : '新增链接';
    el.linkName.value = link ? link.name : '';
    el.linkUrl.value = link ? link.url : '';
    el.linkDesc.value = link ? (link.desc || '') : '';
    el.linkSafety.value = link ? link.safety : 'pending';
    el.linkNote.value = link && link.note ? link.note : '';
    el.linkNameError.hidden = true;
    el.linkUrlError.hidden = true;
    el.linkNameError.textContent = '';
    el.linkUrlError.textContent = '';
    syncNoteField();

    el.linkDialog.returnValue = 'cancel';
    el.linkDialog.showModal();
    setTimeout(function () { el.linkName.focus(); }, 0);
  }

  function syncNoteField() {
    el.noteField.hidden = el.linkSafety.value !== 'caution';
  }

  function validateLinkForm() {
    var ok = true;
    var name = el.linkName.value.trim();
    var url = el.linkUrl.value.trim();

    if (!name) {
      el.linkNameError.textContent = '请填写站点名称';
      el.linkNameError.hidden = false;
      ok = false;
    } else {
      el.linkNameError.hidden = true;
    }

    if (!url) {
      el.linkUrlError.textContent = '请填写网址';
      el.linkUrlError.hidden = false;
      ok = false;
    } else if (/\s/.test(url) || url.indexOf('.') < 0) {
      el.linkUrlError.textContent = '网址格式不正确，示例：example.com';
      el.linkUrlError.hidden = false;
      ok = false;
    } else {
      el.linkUrlError.hidden = true;
    }
    return ok;
  }

  function applyLinkForm() {
    var name = el.linkName.value.trim();
    var url = normalizeUrl(el.linkUrl.value.trim());
    var desc = el.linkDesc.value.trim();
    var safety = el.linkSafety.value;
    var note = el.linkNote.value.trim();
    var targetCat = findCat(el.linkCat.value);

    if (!targetCat) { toast('目标分类不存在', 'error'); return; }

    if (state.editing) {
      var link = state.editing.link;
      var oldCat = state.editing.cat;
      var idx = oldCat ? oldCat.links.indexOf(link) : -1;
      if (idx >= 0) oldCat.links.splice(idx, 1);
      link.name = name;
      link.url = url;
      link.desc = desc;
      link.safety = safety;
      if (safety === 'caution' && note) link.note = note;
      else delete link.note;
      var insertAt = (oldCat && oldCat.id === targetCat.id) ? Math.min(idx, targetCat.links.length) : targetCat.links.length;
      targetCat.links.splice(insertAt, 0, link);
    } else {
      targetCat.links.push({
        id: genId('l'),
        name: name,
        url: url,
        desc: desc,
        safety: safety,
        note: (safety === 'caution' && note) ? note : undefined
      });
    }
    state.editing = null;
    saveData();
    renderGrid();
    toast('已保存');
  }

  function deleteLink(cat, link) {
    confirmAction('删除链接', '确定删除「' + link.name + '」吗？此操作不可撤销。').then(function (ok) {
      if (!ok) return;
      var i = cat.links.indexOf(link);
      if (i >= 0) cat.links.splice(i, 1);
      saveData();
      renderGrid();
      toast('已删除「' + link.name + '」');
    });
  }

  function openCatDialog(cat) {
    state.editingCat = cat || null;
    el.catDialogTitle.textContent = cat ? '重命名分类' : '新增分类';
    el.catName.value = cat ? cat.name : '';
    el.catTag.value = cat ? cat.tag : '';
    el.catNameError.hidden = true;
    el.catNameError.textContent = '';

    var selected = cat ? cat.color : PALETTE[0];
    renderSwatches(selected);

    el.catDialog.returnValue = 'cancel';
    el.catDialog.showModal();
    setTimeout(function () { el.catName.focus(); }, 0);
  }

  function renderSwatches(selected) {
    el.catSwatches.textContent = '';
    PALETTE.forEach(function (color) {
      var sw = h('button', {
        type: 'button',
        class: 'swatch',
        role: 'radio',
        'aria-checked': String(color.toLowerCase() === String(selected).toLowerCase()),
        'aria-label': '颜色 ' + color,
        title: color,
        style: 'background:' + color
      });
      sw.addEventListener('click', function () {
        Array.prototype.forEach.call(el.catSwatches.children, function (c) {
          c.setAttribute('aria-checked', 'false');
        });
        sw.setAttribute('aria-checked', 'true');
      });
      el.catSwatches.appendChild(sw);
    });
  }

  function selectedColor() {
    var checked = el.catSwatches.querySelector('[aria-checked="true"]');
    return checked ? checked.getAttribute('title') : PALETTE[0];
  }

  function applyCatForm() {
    var name = el.catName.value.trim();
    if (!name) {
      el.catNameError.textContent = '请填写分类名称';
      el.catNameError.hidden = false;
      return;
    }
    el.catNameError.hidden = true;
    var tag = el.catTag.value.trim().toUpperCase();
    var color = selectedColor();

    if (state.editingCat) {
      state.editingCat.name = name;
      state.editingCat.tag = tag;
      state.editingCat.color = color;
    } else {
      data.categories.push({ id: genId('c'), name: name, tag: tag, color: color, links: [] });
    }
    state.editingCat = null;
    saveData();
    renderGrid();
    toast('已保存');
  }

  function deleteCategory(cat) {
    var n = cat.links.length;
    var body = n > 0
      ? '分类「' + cat.name + '」下有 ' + n + ' 条链接，删除分类会一并删除这些链接，此操作不可撤销。'
      : '确定删除空分类「' + cat.name + '」吗？';
    confirmAction('删除分类', body).then(function (ok) {
      if (!ok) return;
      var i = data.categories.indexOf(cat);
      if (i >= 0) data.categories.splice(i, 1);
      saveData();
      renderGrid();
      toast('已删除分类「' + cat.name + '」');
    });
  }

  /* ---------------- 二次确认 ---------------- */

  function confirmAction(title, body) {
    return new Promise(function (resolve) {
      el.confirmTitle.textContent = title;
      el.confirmBody.textContent = body;
      el.confirmDialog.returnValue = 'cancel';
      el.confirmDialog.addEventListener('close', function handler() {
        el.confirmDialog.removeEventListener('close', handler);
        resolve(el.confirmDialog.returnValue === 'ok');
      });
      el.confirmDialog.showModal();
    });
  }

  /* ---------------- 导入 / 导出 / 重置 ---------------- */

  function exportData() {
    var payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      categories: data.categories.map(function (cat) {
        return {
          id: cat.id,
          name: cat.name,
          tag: cat.tag,
          color: cat.color,
          links: cat.links.map(function (l) {
            var item = { name: l.name, url: l.url, desc: l.desc, safety: l.safety };
            if (l.note) item.note = l.note;
            return item;
          })
        };
      })
    };
    var json = JSON.stringify(payload, null, 2);
    var blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var d = new Date();
    a.href = url;
    a.download = 'homepage-links-' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    toast('已导出 ' + payload.categories.length + ' 个分类');
  }

  function validateImport(text) {
    var obj;
    try {
      obj = JSON.parse(text);
    } catch (e) {
      return { ok: false, error: 'JSON 解析失败：文件不是有效的 JSON' };
    }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return { ok: false, error: 'JSON 根节点必须是对象' };
    }
    if (!Array.isArray(obj.categories)) {
      return { ok: false, error: '缺少 categories 数组' };
    }
    for (var i = 0; i < obj.categories.length; i++) {
      var c = obj.categories[i];
      if (!c || typeof c !== 'object' || Array.isArray(c)) {
        return { ok: false, error: '第 ' + (i + 1) + ' 个分类不是对象' };
      }
      if (typeof c.name !== 'string' || !c.name.trim()) {
        return { ok: false, error: '第 ' + (i + 1) + ' 个分类缺少 name 字符串' };
      }
      if (!Array.isArray(c.links)) {
        return { ok: false, error: '分类「' + c.name + '」缺少 links 数组' };
      }
      for (var j = 0; j < c.links.length; j++) {
        var l = c.links[j];
        if (!l || typeof l !== 'object' || Array.isArray(l)) {
          return { ok: false, error: '分类「' + c.name + '」的第 ' + (j + 1) + ' 条链接不是对象' };
        }
        if (typeof l.name !== 'string' || !l.name.trim()) {
          return { ok: false, error: '分类「' + c.name + '」的第 ' + (j + 1) + ' 条链接缺少 name 字符串' };
        }
        if (typeof l.url !== 'string' || !l.url.trim()) {
          return { ok: false, error: '链接「' + l.name + '」缺少 url 字符串' };
        }
      }
    }
    return { ok: true, data: normalizeData(obj) };
  }

  function mergeData(base, incoming) {
    var result = clone(base);
    incoming.categories.forEach(function (inc) {
      var match = null;
      for (var i = 0; i < result.categories.length; i++) {
        if (result.categories[i].id === inc.id || result.categories[i].name === inc.name) {
          match = result.categories[i];
          break;
        }
      }
      if (match) {
        var seen = {};
        match.links.forEach(function (l) { seen[l.name + '|' + l.url] = true; });
        inc.links.forEach(function (l) {
          var key = l.name + '|' + l.url;
          if (!seen[key]) { seen[key] = true; match.links.push(l); }
        });
      } else {
        result.categories.push(inc);
      }
    });
    return result;
  }

  function handleImportFile(file, mode) {
    var reader = new FileReader();
    reader.onload = function () {
      var res = validateImport(String(reader.result));
      if (!res.ok) {
        toast(res.error, 'error');
        return;
      }
      var nCat = res.data.categories.length;
      var nLink = countLinks(res.data);
      var title = mode === 'merge' ? '合并导入' : '覆盖导入';
      var body = mode === 'merge'
        ? '将把「' + nCat + ' 个分类 / ' + nLink + ' 条链接」合并进当前数据；同名分类只补充缺失链接。'
        : '将用「' + nCat + ' 个分类 / ' + nLink + ' 条链接」替换当前全部数据，建议先导出备份。';

      confirmAction(title, body).then(function (ok) {
        if (!ok) return;
        data = mode === 'merge' ? mergeData(data, res.data) : res.data;
        saveData();
        renderGrid();
        toast(mode === 'merge' ? '已合并导入' : '已覆盖导入');
      });
    };
    reader.onerror = function () { toast('文件读取失败，请重试', 'error'); };
    reader.readAsText(file, 'utf-8');
  }

  function resetData() {
    var def = getDefaultData();
    if (!def) { toast('默认数据不可用，无法重置', 'error'); return; }
    confirmAction('恢复默认数据',
      '将用内置默认数据（' + def.categories.length + ' 个分类 / ' + countLinks(def) + ' 条链接）替换当前全部数据，当前修改将丢失。')
      .then(function (ok) {
        if (!ok) return;
        data = normalizeData(def);
        saveData();
        renderGrid();
        toast('已恢复默认数据');
      });
  }

  /* ---------------- 提示条 ---------------- */

  function toast(msg, kind) {
    el.toast.textContent = msg;
    el.toast.setAttribute('data-kind', kind || 'info');
    el.toast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.hidden = true; }, kind === 'error' ? 5000 : 2600);
  }

  /* ---------------- 拖拽排序 ---------------- */

  function visibleRows(list) {
    return Array.prototype.filter.call(list.querySelectorAll('.link-row'), function (r) {
      return r.getClientRects().length > 0;
    });
  }

  function clearDropMarks() {
    Array.prototype.forEach.call(el.grid.querySelectorAll('.drop-before, .drop-after, .is-drop-target'), function (n) {
      n.classList.remove('drop-before', 'drop-after', 'is-drop-target');
    });
  }

  function computeDropIndex(list, clientY) {
    var rows = visibleRows(list).filter(function (r) {
      return !dragState || r.getAttribute('data-link-id') !== dragState.linkId;
    });
    for (var i = 0; i < rows.length; i++) {
      var rect = rows[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        return Number(rows[i].getAttribute('data-index'));
      }
    }
    if (rows.length) return Number(rows[rows.length - 1].getAttribute('data-index')) + 1;
    return -1;
  }

  function moveLink(srcCatId, linkId, dstCatId, dstIndex) {
    var srcCat = findCat(srcCatId);
    var dstCat = findCat(dstCatId);
    if (!srcCat || !dstCat) return;
    var si = -1;
    for (var i = 0; i < srcCat.links.length; i++) {
      if (srcCat.links[i].id === linkId) { si = i; break; }
    }
    if (si < 0) return;
    var moved = srcCat.links.splice(si, 1)[0];
    var idx = dstIndex < 0 ? dstCat.links.length : dstIndex;
    idx = Math.max(0, Math.min(idx, dstCat.links.length));
    if (srcCat === dstCat && si < idx) idx -= 1;
    dstCat.links.splice(idx, 0, moved);
    saveData();
    renderGrid();
  }

  function initDragAndDrop() {
    el.grid.addEventListener('dragstart', function (e) {
      var row = e.target.closest ? e.target.closest('.link-row') : null;
      if (!row || !state.editMode) return;
      dragState = { catId: row._catId, linkId: row._link.id };
      row.classList.add('is-dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', row._link.id); } catch (err) { /* noop */ }
      }
    });

    el.grid.addEventListener('dragend', function (e) {
      var row = e.target.closest ? e.target.closest('.link-row') : null;
      if (row) row.classList.remove('is-dragging');
      clearDropMarks();
      dragState = null;
    });

    el.grid.addEventListener('dragover', function (e) {
      if (!dragState) return;
      var list = e.target.closest ? e.target.closest('.links') : null;
      if (!list) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      clearDropMarks();
      list.classList.add('is-drop-target');
      var row = e.target.closest ? e.target.closest('.link-row') : null;
      if (row && row.getAttribute('data-link-id') !== dragState.linkId) {
        var rect = row.getBoundingClientRect();
        var after = (e.clientY - rect.top) > rect.height / 2;
        row.classList.add(after ? 'drop-after' : 'drop-before');
      }
    });

    el.grid.addEventListener('drop', function (e) {
      if (!dragState) return;
      var list = e.target.closest ? e.target.closest('.links') : null;
      if (!list) return;
      e.preventDefault();
      var dstCatId = list.getAttribute('data-cat-id');
      var dstIndex = computeDropIndex(list, e.clientY);
      var srcCatId = dragState.catId;
      var linkId = dragState.linkId;
      clearDropMarks();
      dragState = null;
      moveLink(srcCatId, linkId, dstCatId, dstIndex);
    });
  }

  /* ---------------- 分类整本拖拽排序 ---------------- */

  function clearCatDropMarks() {
    Array.prototype.forEach.call(el.grid.querySelectorAll('.cat.drop-before, .cat.drop-after'), function (n) {
      n.classList.remove('drop-before', 'drop-after');
    });
  }

  function moveCategory(srcId, targetId, after) {
    var srcIdx = -1;
    for (var i = 0; i < data.categories.length; i++) {
      if (data.categories[i].id === srcId) { srcIdx = i; break; }
    }
    if (srcIdx < 0) return;
    if (!targetId || targetId === srcId) return;

    var moved = data.categories.splice(srcIdx, 1)[0];
    var insertAt = data.categories.length;
    for (var j = 0; j < data.categories.length; j++) {
      if (data.categories[j].id === targetId) { insertAt = after ? j + 1 : j; break; }
    }
    data.categories.splice(insertAt, 0, moved);
    saveData();
    renderGrid();
    toast('已移动分类「' + moved.name + '」');
  }

  function initCatDrag() {
    el.grid.addEventListener('dragstart', function (e) {
      if (!state.editMode) return;
      var grip = e.target.closest ? e.target.closest('.cat-grip') : null;
      if (!grip) return;                    // 链接行的拖拽交给原有逻辑
      var card = e.target.closest ? e.target.closest('.cat') : null;
      if (!card) return;
      catDrag = { catId: card.getAttribute('data-cat-id') };
      card.classList.add('is-cat-dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', 'cat:' + catDrag.catId); } catch (err) { /* noop */ }
      }
    });

    el.grid.addEventListener('dragend', function () {
      if (!catDrag) return;
      var card = cardMap[catDrag.catId];
      if (card) card.classList.remove('is-cat-dragging');
      clearCatDropMarks();
      catDrag = null;
    });

    el.grid.addEventListener('dragover', function (e) {
      if (!catDrag) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      clearCatDropMarks();
      var card = e.target.closest ? e.target.closest('.cat') : null;
      if (!card) return;
      if (card.getAttribute('data-cat-id') === catDrag.catId) return;
      var rect = card.getBoundingClientRect();
      var after = (e.clientX - rect.left) > rect.width / 2;
      card.classList.add(after ? 'drop-after' : 'drop-before');
    });

    el.grid.addEventListener('drop', function (e) {
      if (!catDrag) return;
      e.preventDefault();
      var srcId = catDrag.catId;
      var card = e.target.closest ? e.target.closest('.cat') : null;
      var targetId = card ? card.getAttribute('data-cat-id') : null;
      var after = false;
      if (card) {
        var rect = card.getBoundingClientRect();
        after = (e.clientX - rect.left) > rect.width / 2;
      }
      clearCatDropMarks();
      catDrag = null;
      moveCategory(srcId, targetId, after);
    });
  }

  /* ---------------- 键盘 ---------------- */

  function isTypingTarget(t) {
    if (!t) return false;
    var tag = (t.tagName || '').toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable === true;
  }

  function focusSearch() {
    el.searchInput.focus();
    el.searchInput.select();
  }

  function initKeyboard() {
    document.addEventListener('keydown', function (e) {
      var typing = isTypingTarget(e.target);
      var dialogOpen = !!document.querySelector('dialog[open]');

      if (e.key === 'Escape') {
        if (dialogOpen) return;                 // 原生 dialog 自行关闭
        if (state.editMode) { e.preventDefault(); setEditMode(false); return; }
        if (typing && el.searchInput.value) { e.preventDefault(); clearSearch(); }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        focusSearch();
        return;
      }

      if (typing || dialogOpen) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === '/') { e.preventDefault(); focusSearch(); return; }
      if (e.key === 'e' || e.key === 'E') { e.preventDefault(); setEditMode(!state.editMode); return; }
      if (e.key === 't' || e.key === 'T') { e.preventDefault(); cycleTheme(); return; }
      if (e.key === '[') { e.preventDefault(); cycleBg(-1); return; }
      if (e.key === ']') { e.preventDefault(); cycleBg(1); return; }
    });
  }

  /* ---------------- 事件绑定 ---------------- */

  function initEvents() {
    el.searchInput.addEventListener('input', function () { applyFilter(); });
    el.searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); handleEnter(); }
    });

    el.modeToggle.addEventListener('click', function () {
      state.forceSearch = !state.forceSearch;
      applyFilter();
      el.searchInput.focus();
    });

    el.engineSelect.addEventListener('change', function () {
      state.engine = el.engineSelect.value;
      storeSet(KEY_ENGINE, state.engine);
      applyFilter();
    });

    el.themeBtn.addEventListener('click', cycleTheme);
    el.editBtn.addEventListener('click', function () { setEditMode(!state.editMode); });
    el.exportBtn.addEventListener('click', exportData);
    el.resetBtn.addEventListener('click', resetData);
    el.addCatBtn.addEventListener('click', function () { openCatDialog(null); });

    el.importOverwriteBtn.addEventListener('click', function () {
      pendingImportMode = 'overwrite';
      el.importFile.click();
    });
    el.importMergeBtn.addEventListener('click', function () {
      pendingImportMode = 'merge';
      el.importFile.click();
    });
    el.importFile.addEventListener('change', function () {
      var f = el.importFile.files && el.importFile.files[0];
      el.importFile.value = '';
      if (f) handleImportFile(f, pendingImportMode);
    });

    el.safetyToggle.addEventListener('change', function () {
      state.safeOnly = el.safetyToggle.checked;
      storeSet(KEY_SAFE_ONLY, state.safeOnly ? '1' : '0');
      applyFilter();
    });

    el.clearFilterBtn.addEventListener('click', function () {
      if (el.searchInput.value) { clearSearch(); el.searchInput.focus(); return; }
      if (state.safeOnly) {
        state.safeOnly = false;
        el.safetyToggle.checked = false;
        storeSet(KEY_SAFE_ONLY, '0');
        applyFilter();
        return;
      }
      setEditMode(true);
    });

    // 链接表单
    el.linkSafety.addEventListener('change', syncNoteField);
    el.linkForm.addEventListener('submit', function (e) {
      if (!validateLinkForm()) { e.preventDefault(); return; }
    });
    el.linkDialog.addEventListener('close', function () {
      if (el.linkDialog.returnValue === 'save') applyLinkForm();
    });

    // 分类表单
    el.catForm.addEventListener('submit', function (e) {
      if (!el.catName.value.trim()) {
        el.catNameError.textContent = '请填写分类名称';
        el.catNameError.hidden = false;
        e.preventDefault();
      }
    });
    el.catDialog.addEventListener('close', function () {
      if (el.catDialog.returnValue === 'save') applyCatForm();
    });

    // 取消按钮
    Array.prototype.forEach.call(document.querySelectorAll('[data-close]'), function (btn) {
      btn.addEventListener('click', function () {
        var dlg = btn.closest('dialog');
        if (dlg) dlg.close('cancel');
      });
    });

    // 布局与背景面板
    if (el.panelToggle) {
      el.panelToggle.addEventListener('click', function () { setPanelOpen(!prefs.panelOpen); });
    }

    if (el.brightRange) {
      el.brightRange.addEventListener('input', function () {
        prefs.bright = Number(el.brightRange.value);
        document.documentElement.style.setProperty('--bg-bright', String(prefs.bright));
        if (el.brightOut) el.brightOut.textContent = prefs.bright.toFixed(2);
        savePrefs();
      });
    }

    if (el.blurRange) {
      el.blurRange.addEventListener('input', function () {
        prefs.blur = Number(el.blurRange.value);
        document.documentElement.style.setProperty('--bg-blur', prefs.blur + 'px');
        if (el.blurOut) el.blurOut.textContent = prefs.blur + 'px';
        savePrefs();
      });
    }

    if (el.wideToggle) {
      el.wideToggle.addEventListener('change', function () {
        prefs.wide = el.wideToggle.checked;
        document.body.classList.toggle('is-wide', prefs.wide);
        savePrefs();
      });
    }

    bindSeg(el.segCols, function (v) {
      prefs.cols = Number(v);
      applyColumns();
      savePrefs();
    });
    bindSeg(el.segDensity, function (v) {
      prefs.density = v;
      document.body.setAttribute('data-density', v);
      savePrefs();
    });
    bindSeg(el.segView, function (v) {
      prefs.view = v;
      document.body.setAttribute('data-view', v);
      applyColumns();
      savePrefs();
    });

    window.addEventListener('resize', function () { applyColumns(); });
  }

  /* ---------------- 启动 ---------------- */

  function init() {
    cacheDom();

    el.searchIcon.innerHTML = ICONS.search;

    // 主题
    var savedTheme = storeGet(KEY_THEME);
    state.theme = THEME_ORDER.indexOf(savedTheme) >= 0 ? savedTheme : 'auto';
    applyTheme();
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', updateThemeColor);
    }

    // 搜索引擎
    var savedEngine = storeGet(KEY_ENGINE);
    state.engine = ENGINES.some(function (e) { return e.id === savedEngine; }) ? savedEngine : DEFAULT_ENGINE;
    ENGINES.forEach(function (e) {
      var opt = h('option', { value: e.id, text: e.label });
      if (e.id === state.engine) opt.selected = true;
      el.engineSelect.appendChild(opt);
    });

    // 安全视图
    state.safeOnly = storeGet(KEY_SAFE_ONLY) === '1';
    el.safetyToggle.checked = state.safeOnly;

    // 界面偏好（背景 + 布局）
    loadPrefs();
    renderBgChips();
    applyPrefs();
    applyBackground(false);
    probeBgImages();

    // 数据
    data = loadData();
    renderGrid();
    applyCollapsed();

    // 时钟
    tickClock();
    setInterval(tickClock, 1000);

    initEvents();
    initDragAndDrop();
    initCatDrag();
    initKeyboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
