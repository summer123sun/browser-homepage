/* =========================================================
   起始页 · 藏书阁 / Personal Research Stacks（v4 结构性改版）
   ------------------------------------------------------------
   结构：一个搜索框（引擎在左）+ 一排常用（按点击频率）+ 一排折叠分类标签
   零外部请求：全部图标为内联 SVG，全部数据存 localStorage
   纯原生 JS（ES5 语法风格，兼容旧浏览器），无任何依赖
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- 常量 ---------------- */

  /* v3 数据键保持不变，老用户 localStorage 里的编辑继续可用 */
  var KEY_DATA = 'xyai.homepage.data.v3';
  var KEY_THEME = 'xyai.homepage.theme.v1';
  var KEY_ENGINE = 'xyai.homepage.engine.v1';
  var KEY_SAFE_ONLY = 'xyai.homepage.safeonly.v1';
  var KEY_UI = 'xyai.homepage.ui.v1';
  /* v4 新增：点击频次 / 用户钉住的快捷链接 */
  var KEY_USAGE = 'xyai.homepage.usage.v1';
  var KEY_PINS = 'xyai.homepage.pins.v1';

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
  var COLS = [1, 2, 3, 4];

  var ENGINES = [
    { id: 'google', label: 'Google', template: 'https://www.google.com/search?q=' },
    { id: 'bing', label: 'Bing', template: 'https://www.bing.com/search?q=' },
    { id: 'baidu', label: '百度', template: 'https://www.baidu.com/s?wd=' },
    { id: 'duckduckgo', label: 'DuckDuckGo', template: 'https://duckduckgo.com/?q=' }
  ];
  var DEFAULT_ENGINE = 'google';

  var THEME_ORDER = ['auto', 'light', 'dark'];
  var THEME_LABEL = { auto: '自动', light: '亮', dark: '暗' };

  /* 常用行种子：用户点击不够 8 个时占位，一旦用户点了某链接，该链接按次数插到前面 */
  var SEED_QUICK = ['Google 学术', 'arXiv', '百度', 'Google', 'GitHub', 'ChatGPT', 'Perplexity', 'Zotero'];
  var QUICK_LIMIT = 10;
  var QUICK_SEED_MIN = 8;

  var PALETTE = [
    '#2C5CC5', '#7A4CC8', '#C2552E', '#2E8B76', '#4A6FBF', '#55606B',
    '#8A5CB8', '#1F7A9C', '#B4622A', '#4E8B3F', '#8A6A3C', '#3F7F9E'
  ];

  var WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  var ICONS = {
    search: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="7" cy="7" r="4.6"/><path d="M10.5 10.5 14 14"/></svg>',
    pencil: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.2 2.9 13.1 4.8 5.7 12.2 3 13l.8-2.7Z"/><path d="M9.6 4.5 11.5 6.4"/></svg>',
    trash: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4.6h10M6.6 4.6V3.1h2.8v1.5M4.6 4.6l.6 8.3h5.6l.6-8.3"/></svg>',
    grip: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="6" cy="4" r="1"/><circle cx="10" cy="4" r="1"/><circle cx="6" cy="8" r="1"/><circle cx="10" cy="8" r="1"/><circle cx="6" cy="12" r="1"/><circle cx="10" cy="12" r="1"/></svg>',
    plus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><path d="M8 3.6v8.8M3.6 8h8.8"/></svg>',
    sun: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="3.1"/><path d="M8 1.4v1.7M8 12.9v1.7M1.4 8h1.7M12.9 8h1.7M3.3 3.3l1.2 1.2M11.5 11.5l1.2 1.2M12.7 3.3l-1.2 1.2M4.5 11.5l-1.2 1.2"/></svg>',
    moon: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z"/></svg>',
    sliders: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true"><path d="M2 4.5h3.2M7.2 4.5h6.8M2 11.5h7.2M11.2 11.5h2.8"/><circle cx="6" cy="4.5" r="1.6"/><circle cx="10" cy="11.5" r="1.6"/></svg>'
  };

  /* ---------------- 状态 ---------------- */

  var state = {
    theme: 'auto',
    engine: DEFAULT_ENGINE,
    safeOnly: false,
    editMode: false,
    editing: null,        // { cat, link } 编辑链接时的上下文
    editingCat: null,     // 编辑分类时的上下文
    pinMode: 'existing'   // 「＋」弹窗模式：existing=挑已有 / new=建新链接
  };

  /* 界面偏好，持久化到 KEY_UI */
  var prefs = {
    bg: 'none',
    bright: 1,
    blur: 0,
    cols: 2,
    density: 'comfort',
    wide: false,
    panelOpen: false,     // 设置面板展开
    openCat: null         // 当前展开的分类 id（手风琴：同时只展开一个）
  };

  var data = { version: 1, categories: [] };
  var usage = {};         // key -> { n: 次数, t: 最近点击时间戳 }
  var pins = [];          // key 数组，顺序即钉住顺序
  var dragState = null;   // { catId, linkId }
  var catDrag = null;     // { catId } 分类整本拖拽
  var toastTimer = null;
  var pendingImportMode = 'overwrite';
  var bgFront = 0;        // 交叉淡入用：当前可见的背景槽
  var bgSlots = [];
  var bgAvail = {};       // bgId -> 图片是否可加载
  var quickTimer = null;

  /* ---------------- DOM ---------------- */

  function $(id) { return document.getElementById(id); }

  var el = {};
  function cacheDom() {
    /* 顶栏 */
    el.themeBtn = $('themeBtn');
    el.settingsBtn = $('settingsBtn');
    el.settings = $('settings');

    /* 时钟 */
    el.clockHM = $('clockHM');
    el.clockColon = $('clockColon');
    el.clockS = $('clockS');
    el.clockDate = $('clockDate');

    /* 搜索 */
    el.searchBar = $('searchBar');
    el.searchInput = $('searchInput');
    el.searchGo = $('searchGo');
    el.enginePicker = $('enginePicker');
    el.engineBtn = $('engineBtn');
    el.engineMenu = $('engineMenu');
    el.engineLabel = $('engineLabel');
    el.hintLine = $('hintLine');

    /* 常用行 */
    el.quickRow = $('quickRow');

    /* 分类 */
    el.stacksMeta = $('stacksMeta');
    el.catTabs = $('catTabs');
    el.catPanel = $('catPanel');

    /* 设置面板 */
    el.segTheme = $('segTheme');
    el.segCols = $('segCols');
    el.segDensity = $('segDensity');
    el.bgChips = $('bgChips');
    el.brightRange = $('brightRange');
    el.brightOut = $('brightOut');
    el.blurRange = $('blurRange');
    el.blurOut = $('blurOut');
    el.wideToggle = $('wideToggle');
    el.editToggle = $('editToggle');
    el.safetyToggle = $('safetyToggle');
    el.exportBtn = $('exportBtn');
    el.importOverwriteBtn = $('importOverwriteBtn');
    el.importMergeBtn = $('importMergeBtn');
    el.resetBtn = $('resetBtn');
    el.addCatBtn = $('addCatBtn');

    /* 对话框 */
    el.linkDialog = $('linkDialog');
    el.linkForm = $('linkForm');
    el.linkDialogTitle = $('linkDialogTitle');
    el.linkCat = $('linkCat');
    el.linkName = $('linkName');
    el.linkUrl = $('linkUrl');
    el.linkDesc = $('linkDesc');
    el.linkSafety = $('linkSafety');
    el.linkNote = $('linkNote');
    el.noteHint = $('noteHint');
    el.safetyHint = $('safetyHint');
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
    el.pinDialog = $('pinDialog');
    el.pinDialogTitle = $('pinDialogTitle');
    el.pinSearch = $('pinSearch');
    el.pinList = $('pinList');
    el.pinModeSeg = $('pinModeSeg');
    el.pinPaneExisting = $('pinPaneExisting');
    el.newLinkForm = $('newLinkForm');
    el.newLinkUrl = $('newLinkUrl');
    el.newLinkUrlError = $('newLinkUrlError');
    el.newLinkName = $('newLinkName');
    el.newLinkDesc = $('newLinkDesc');
    el.newLinkCat = $('newLinkCat');
    el.bulkDialog = $('bulkDialog');
    el.bulkForm = $('bulkForm');
    el.bulkText = $('bulkText');
    el.bulkCat = $('bulkCat');
    el.bulkResult = $('bulkResult');
    el.bulkImportBtn = $('bulkImportBtn');
    el.bulkDoneBtn = $('bulkDoneBtn');
    el.bulkOpenBtn = $('bulkOpenBtn');
    el.confirmDialog = $('confirmDialog');
    el.confirmTitle = $('confirmTitle');
    el.confirmBody = $('confirmBody');
    el.importFile = $('importFile');

    el.toast = $('toast');
    el.metaThemeColor = $('metaThemeColor');

    /* 背景层 */
    el.bgA = $('bgA');
    el.bgB = $('bgB');
    bgSlots = [el.bgA, el.bgB];
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

  function genId(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function countLinks(d) {
    var total = 0;
    (d.categories || []).forEach(function (c) { total += (c.links || []).length; });
    return total;
  }

  /* 链接的唯一键：名称 + 网址（data.js 里的链接没有稳定 id，用这对字段做键） */
  function linkKey(link) { return String(link.name || '') + '|' + String(link.url || ''); }

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
    try { storeSet(KEY_DATA, JSON.stringify(data)); } catch (e) { /* 存储失败不阻断界面 */ }
  }

  function findCat(id) {
    for (var i = 0; i < data.categories.length; i++) {
      if (data.categories[i].id === id) return data.categories[i];
    }
    return null;
  }

  /* 按键找到链接（跨全部分类） */
  function findLinkByKey(key) {
    for (var i = 0; i < data.categories.length; i++) {
      var links = data.categories[i].links || [];
      for (var j = 0; j < links.length; j++) {
        if (linkKey(links[j]) === key) return links[j];
      }
    }
    return null;
  }

  /* 按名称找到链接（取第一个匹配，分类顺序决定结果，保证确定性） */
  function findLinkByName(name) {
    for (var i = 0; i < data.categories.length; i++) {
      var links = data.categories[i].links || [];
      for (var j = 0; j < links.length; j++) {
        if (links[j].name === name) return links[j];
      }
    }
    return null;
  }

  /* ---------------- 主题 ---------------- */

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    el.themeBtn.innerHTML = state.theme === 'dark' ? ICONS.moon : ICONS.sun;
    el.themeBtn.setAttribute('aria-label', '切换主题，当前：' + THEME_LABEL[state.theme]);
    el.themeBtn.setAttribute('title', '主题：' + THEME_LABEL[state.theme]);
    syncSeg(el.segTheme, state.theme);
    updateThemeColor();
  }

  function updateThemeColor() {
    var resolved = state.theme;
    if (resolved === 'auto') {
      resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    el.metaThemeColor.setAttribute('content', resolved === 'dark' ? '#14161A' : '#FFFFFF');
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
    el.clockHM.textContent = pad2(now.getHours()) + ':' + pad2(now.getMinutes());
    el.clockS.textContent = pad2(now.getSeconds());
    el.clockColon.classList.toggle('is-dim', now.getSeconds() % 2 === 0);
    el.clockDate.textContent = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 '
      + WEEKDAYS[now.getDay()] + ' · ' + greetingFor(now.getHours());
  }

  /* ---------------- 搜索引擎下拉（自绘，不用原生 select） ---------------- */

  function currentEngine() {
    for (var i = 0; i < ENGINES.length; i++) {
      if (ENGINES[i].id === state.engine) return ENGINES[i];
    }
    return ENGINES[0];
  }

  function renderEngineMenu() {
    el.engineMenu.textContent = '';
    ENGINES.forEach(function (e) {
      var opt = h('button', {
        type: 'button',
        class: 'engine-opt',
        role: 'option',
        id: 'engine-opt-' + e.id,
        'data-engine': e.id,
        'aria-selected': String(e.id === state.engine)
      });
      opt.appendChild(h('span', { text: e.label }));
      opt.appendChild(h('span', { class: 'tick', text: '✓', 'aria-hidden': 'true' }));
      opt.addEventListener('click', function () { selectEngine(e.id); });
      el.engineMenu.appendChild(opt);
    });
  }

  function selectEngine(id) {
    state.engine = id;
    storeSet(KEY_ENGINE, id);
    el.engineLabel.textContent = currentEngine().label;
    Array.prototype.forEach.call(el.engineMenu.querySelectorAll('.engine-opt'), function (o) {
      o.setAttribute('aria-selected', String(o.getAttribute('data-engine') === id));
    });
    closeEngineMenu(true);
    updateHint();
  }

  function openEngineMenu() {
    el.engineMenu.hidden = false;
    el.engineBtn.setAttribute('aria-expanded', 'true');
    var sel = el.engineMenu.querySelector('.engine-opt[aria-selected="true"]');
    var target = sel || el.engineMenu.querySelector('.engine-opt');
    if (target) target.focus();
  }

  function closeEngineMenu(focusBtn) {
    if (el.engineMenu.hidden) return;
    el.engineMenu.hidden = true;
    el.engineBtn.setAttribute('aria-expanded', 'false');
    if (focusBtn) el.engineBtn.focus();
  }

  function engineMenuOptions() {
    return Array.prototype.slice.call(el.engineMenu.querySelectorAll('.engine-opt'));
  }

  /* ---------------- 搜索（纯搜索：回车检索 / 像网址就打开） ---------------- */

  function looksLikeUrl(t) {
    if (!t) return false;
    if (/\s/.test(t)) return false;
    if (t.indexOf('.') >= 0) return true;
    if (/^https?:/i.test(t)) return true;
    return false;
  }

  function normalizeUrl(u) {
    var s = String(u || '').trim();
    if (!s) return '';
    if (/^[a-z][a-z0-9+.\-]*:/i.test(s)) return s;
    return 'https://' + s;
  }

  /* ---------------- 网址解析（用户自定义导入链接用） ---------------- */

  /* 主机名：去掉协议、路径、查询串与用户信息 */
  function hostOf(u) {
    var s = String(u || '').trim();
    s = s.replace(/^[a-z][a-z0-9+.\-]*:\/\//i, '');
    s = s.split('/')[0].split('?')[0].split('#')[0];
    return s.split('@').pop();
  }

  /* 默认名称用：主机名去掉 www. */
  function displayHost(u) {
    return hostOf(u).replace(/^www\./i, '');
  }

  /* 合法网址：必须 http:// 或 https:// 开头，且带域名 */
  function isValidHttpUrl(u) {
    var s = String(u || '').trim();
    if (!s || /\s/.test(s)) return false;
    if (!/^https?:\/\//i.test(s)) return false;
    var host = hostOf(s);
    if (!host) return false;
    var dot = host.indexOf('.');
    return dot > 0 && dot < host.length - 1;
  }

  /* 去重键：忽略大小写与末尾斜杠 */
  function urlKey(u) {
    return String(u || '').trim().toLowerCase().replace(/\/+$/, '');
  }

  /* 全部已有链接的 URL 集合（用于判重） */
  function allLinkUrls() {
    var set = {};
    data.categories.forEach(function (c) {
      (c.links || []).forEach(function (l) { set[urlKey(l.url)] = true; });
    });
    return set;
  }

  /* 往分类里建一条用户自建链接：安全状态一律 pending。
     底线：没有实际抓取核实过的站点不能算 safe / caution。 */
  function createPendingLink(cat, name, url, desc) {
    var link = {
      id: genId('l'),
      name: name,
      url: url,
      desc: desc || '',
      safety: 'pending'
    };
    cat.links.push(link);
    return link;
  }

  /* 填充分类下拉框 */
  function fillCatOptions(sel, preferId) {
    if (!sel) return;
    sel.textContent = '';
    data.categories.forEach(function (c) {
      var opt = h('option', { value: c.id, text: c.name });
      if (preferId && c.id === preferId) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function handleSearch() {
    var raw = el.searchInput.value.trim();
    if (!raw) { el.searchInput.focus(); return; }

    if (raw.charAt(0) === '!') {
      var q = raw.slice(1).trim();
      if (!q) { toast('请输入搜索关键词'); return; }
      window.open(currentEngine().template + encodeURIComponent(q), '_blank', 'noopener');
      return;
    }
    if (looksLikeUrl(raw)) {
      window.open(normalizeUrl(raw), '_blank', 'noopener');
      return;
    }
    window.open(currentEngine().template + encodeURIComponent(raw), '_blank', 'noopener');
  }

  function updateHint() {
    var raw = el.searchInput.value.trim();
    var eng = currentEngine();

    if (!raw) {
      if (document.activeElement === el.searchInput) {
        el.hintLine.textContent = '↵ 用 ' + eng.label + ' 搜索 · / 聚焦 · ! 强制检索';
        el.hintLine.hidden = false;
      } else {
        el.hintLine.hidden = true;
      }
      return;
    }

    if (raw.charAt(0) === '!') {
      var q = raw.slice(1).trim();
      el.hintLine.textContent = q ? ('↵ 用 ' + eng.label + ' 搜索「' + q + '」') : '↵ 强制检索：输入关键词';
    } else if (looksLikeUrl(raw)) {
      el.hintLine.textContent = '↵ 直接打开 ' + raw;
    } else {
      el.hintLine.textContent = '↵ 用 ' + eng.label + ' 搜索「' + raw + '」';
    }
    el.hintLine.hidden = false;
  }

  function clearSearch() {
    el.searchInput.value = '';
    updateHint();
  }

  /* ---------------- 使用频次与钉住 ---------------- */

  function loadUsage() {
    var raw = storeGet(KEY_USAGE);
    if (!raw) return;
    try {
      var o = JSON.parse(raw);
      if (o && typeof o === 'object' && !Array.isArray(o)) usage = o;
    } catch (e) { /* 忽略损坏数据 */ }
  }

  function saveUsage() { storeSet(KEY_USAGE, JSON.stringify(usage)); }

  function loadPins() {
    var raw = storeGet(KEY_PINS);
    if (!raw) return;
    try {
      var a = JSON.parse(raw);
      if (Array.isArray(a)) {
        pins = a.filter(function (x) { return typeof x === 'string' && x; });
      }
    } catch (e) { /* 忽略损坏数据 */ }
  }

  function savePins() { storeSet(KEY_PINS, JSON.stringify(pins)); }

  function bumpUsage(key) {
    if (!key) return;
    var rec = usage[key];
    if (!rec || typeof rec !== 'object') rec = { n: 0, t: 0 };
    rec.n = (Number(rec.n) || 0) + 1;
    rec.t = Date.now();
    usage[key] = rec;
    saveUsage();
  }

  /* ---------------- 界面偏好：背景 + 布局 ---------------- */

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
    if (typeof obj.wide === 'boolean') prefs.wide = obj.wide;
    if (typeof obj.panelOpen === 'boolean') prefs.panelOpen = obj.panelOpen;
    if (typeof obj.openCat === 'string' && obj.openCat) prefs.openCat = obj.openCat;
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
      /* 初始只给「当前背景」上真实缩略图（命中已缓存的主图，不额外下载）；
         其余先用近似渐变占位，等用户打开设置面板时再补图 ——
         否则每次打开起始页都会白下载 5 张背景图（约 1.1MB）。 */
      chip.style.backgroundImage = (p.id === prefs.bg && p.file) ? bgLayers(p) : p.fallback;
      chip.addEventListener('click', function () {
        prefs.bg = p.id;
        savePrefs();
        applyBackground(true);
        toast('背景：' + p.label);
      });
      el.bgChips.appendChild(chip);
    });
  }

  /* 打开设置面板时才真正加载 5 张背景缩略图（避免每次打开页面都下载全部背景图） */
  function paintBgChips() {
    if (!el.bgChips) return;
    Array.prototype.forEach.call(el.bgChips.children, function (chip) {
      var p = bgPreset(chip.getAttribute('data-bg-id'));
      if (p && p.file) chip.style.backgroundImage = bgLayers(p);
    });
    probeBgImages();
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
    if (!el.catPanel) return;
    var maxc = maxColsForWidth(window.innerWidth || 1280);
    var eff = Math.max(1, Math.min(prefs.cols, maxc));
    el.catPanel.style.setProperty('--cols', String(eff));
    return eff;
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
    if (el.settings) el.settings.hidden = !prefs.panelOpen;
    if (el.settingsBtn) el.settingsBtn.setAttribute('aria-expanded', String(prefs.panelOpen));
    if (prefs.panelOpen) paintBgChips();
    if (persist !== false) savePrefs();
  }

  function applyPrefs() {
    document.body.setAttribute('data-density', prefs.density);
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
    syncSeg(el.segTheme, state.theme);

    applyColumns();
    setPanelOpen(prefs.panelOpen, false);
  }

  /* ---------------- 渲染：分类标签 + 手风琴卡片 ---------------- */

  function monogram(name) {
    var s = String(name || '').trim();
    if (!s) return '·';
    var ch = s.charAt(0);
    if (/[\u3400-\u9fff]/.test(ch)) return ch;              // 中文名取首字：百度 → 百
    if (/[\u3400-\u9fff]/.test(s)) return ch.toUpperCase();  // 拉丁头 + 中文后缀：Google 学术 → G
    var latin = s.replace(/[^0-9A-Za-z]/g, '').slice(0, 2);  // 纯拉丁名取前两位：GitHub → GI
    return (latin || ch).toUpperCase();
  }

  function safetyLabel(link) {
    if (link.safety === 'safe') return '安全（已核实）';
    if (link.safety === 'caution') return link.note ? '谨慎：' + link.note : '谨慎';
    return '未核实';
  }

  /* 安全印鉴：方形印章。caution 带一点旋转与半透明墨迹，safe 是极安静的浅灰方块。 */
  function stampNode(link) {
    var label = safetyLabel(link);
    if (link.safety === 'caution' && link.note) {
      var btn = h('button', {
        type: 'button',
        class: 'stamp',
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
    return h('span', { class: 'stamp', 'data-safety': link.safety, role: 'img', 'aria-label': label });
  }

  function rowBtn(icon, ariaLabel, onClick, extraClass) {
    var btn = h('button', {
      type: 'button',
      class: 'row-btn' + (extraClass ? ' ' + extraClass : ''),
      'aria-label': ariaLabel,
      title: ariaLabel
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
    btn.addEventListener('click', function (e) { e.preventDefault(); onClick(); });
    return btn;
  }

  function buildLinkRow(cat, link) {
    var row = h('li', { class: 'link-row', 'data-link-id': link.id });
    row._cat = cat;
    row._link = link;
    row._catId = cat.id;
    if (state.editMode) row.setAttribute('draggable', 'true');

    var grip = h('span', { class: 'drag-handle', 'aria-hidden': 'true' });
    grip.innerHTML = ICONS.grip;
    row.appendChild(grip);

    var main = h('a', {
      class: 'link-main',
      href: link.url || '#',
      target: '_blank',
      rel: 'noopener noreferrer',
      title: link.url || '',
      'data-usage-key': linkKey(link)
    });
    main.appendChild(h('span', { class: 'link-name', text: link.name }));
    main.appendChild(h('span', { class: 'link-desc', text: link.desc || '' }));
    row.appendChild(main);

    row.appendChild(stampNode(link));

    var acts = h('span', { class: 'row-actions' });
    acts.appendChild(rowBtn(ICONS.pencil, '编辑链接「' + link.name + '」', function () { openLinkDialog(link, cat); }));
    acts.appendChild(rowBtn(ICONS.trash, '删除链接「' + link.name + '」', function () { deleteLink(cat, link); }, 'danger'));
    row.appendChild(acts);

    return row;
  }

  function renderTabs() {
    el.catTabs.textContent = '';
    data.categories.forEach(function (cat) {
      var tab = h('button', {
        type: 'button',
        class: 'cat-tab',
        'data-cat-id': cat.id,
        'aria-expanded': String(cat.id === prefs.openCat),
        'aria-controls': 'catPanel'
      });
      if (state.editMode) {
        var grip = h('span', { class: 'cat-grip', title: '拖动整本改变分类顺序', draggable: 'true' });
        grip.innerHTML = ICONS.grip;
        tab.appendChild(grip);
      }
      tab.appendChild(h('span', { class: 'cat-tab-name', text: cat.name }));
      tab.appendChild(h('span', { class: 'cat-tab-count', text: String(cat.links.length) }));
      tab.addEventListener('click', function () { toggleCat(cat.id); });
      el.catTabs.appendChild(tab);
    });
  }

  function toggleCat(catId) {
    prefs.openCat = (prefs.openCat === catId) ? null : catId;
    savePrefs();
    renderTabs();
    renderCatPanel();
  }

  function renderCatPanel() {
    el.catPanel.textContent = '';
    var cat = prefs.openCat ? findCat(prefs.openCat) : null;
    if (!cat) return;

    var card = h('article', { class: 'cat-open', 'data-cat-id': cat.id });

    var head = h('header', { class: 'cat-open-head' });
    head.appendChild(h('h3', { class: 'cat-open-title', text: cat.name }));
    head.appendChild(h('span', { class: 'cat-open-count', id: 'catOpenCount' }));

    if (state.editMode) {
      var edit = h('span', { class: 'cat-open-edit' });
      edit.appendChild(miniBtn('＋ 链接', '在分类「' + cat.name + '」中新增链接', function () { openLinkDialog(null, cat); }));
      edit.appendChild(miniBtn('改名', '重命名分类「' + cat.name + '」', function () { openCatDialog(cat); }));
      edit.appendChild(miniBtn('删除', '删除分类「' + cat.name + '」', function () { deleteCategory(cat); }, 'mini mini-danger'));
      head.appendChild(edit);
    }
    card.appendChild(head);

    var list = h('ul', { class: 'links', 'data-cat-id': cat.id, id: 'catLinks' });
    cat.links.forEach(function (link, i) {
      var row = buildLinkRow(cat, link);
      row.setAttribute('data-index', String(i));
      list.appendChild(row);
    });
    card.appendChild(list);

    el.catPanel.appendChild(card);
    applySafetyFilter();
  }

  /* 「仅看待核实」：过滤的是分类里的链接，不是搜索框 */
  function applySafetyFilter() {
    var card = el.catPanel.querySelector('.cat-open');
    if (!card) return;
    var cat = findCat(card.getAttribute('data-cat-id'));
    if (!cat) return;

    var visible = 0;
    cat.links.forEach(function (link) {
      var row = el.catPanel.querySelector('.link-row[data-link-id="' + link.id + '"]');
      var hidden = !!(state.safeOnly && link.safety === 'safe');
      if (row) row.hidden = hidden;
      if (!hidden) visible++;
    });

    var countEl = card.querySelector('.cat-open-count');
    if (countEl) {
      countEl.textContent = state.safeOnly
        ? (visible + ' 条待核实 / 共 ' + cat.links.length + ' 条')
        : (cat.links.length + ' 条');
    }
  }

  function updateStacksMeta() {
    var cats = data.categories.length;
    var total = countLinks(data);
    var text = '全部站点 · ' + cats + ' 类 · ' + total + ' 条';
    if (state.safeOnly) {
      var pending = 0;
      data.categories.forEach(function (c) {
        c.links.forEach(function (l) { if (l.safety !== 'safe') pending++; });
      });
      text += ' · ' + pending + ' 条待核实';
    }
    el.stacksMeta.textContent = text;
  }

  /* ---------------- 渲染：常用行（钉住 → 点击频次 → 种子） ---------------- */

  function computeQuickItems() {
    var out = [];
    var seen = {};

    function push(link) {
      if (!link) return;
      var k = linkKey(link);
      if (seen[k]) return;
      seen[k] = true;
      out.push(link);
    }

    /* 1. 用户钉住的，永远在前 */
    pins.forEach(function (k) { push(findLinkByKey(k)); });

    /* 2. 有过点击记录的：次数降序，次数相同按最近点击时间降序 */
    var used = Object.keys(usage).map(function (k) {
      var r = usage[k] || {};
      return { key: k, n: Number(r.n) || 0, t: Number(r.t) || 0 };
    }).filter(function (u) { return u.n > 0; });
    used.sort(function (a, b) { return (b.n - a.n) || (b.t - a.t); });
    used.forEach(function (u) { push(findLinkByKey(u.key)); });

    /* 3. 不足 8 个时用种子补齐（种子只在用户还没点够时占位） */
    for (var i = 0; out.length < QUICK_SEED_MIN && i < SEED_QUICK.length; i++) {
      push(findLinkByName(SEED_QUICK[i]));
    }

    return out.slice(0, QUICK_LIMIT);
  }

  function renderQuick() {
    el.quickRow.textContent = '';

    computeQuickItems().forEach(function (link) {
      var key = linkKey(link);
      var pinned = pins.indexOf(key) >= 0;
      var rec = usage[key];
      var times = rec ? (Number(rec.n) || 0) : 0;

      var tile = h('div', { class: 'tile', 'data-key': key });

      var a = h('a', {
        class: 'tile-link',
        href: link.url || '#',
        target: '_blank',
        rel: 'noopener noreferrer',
        'data-usage-key': key,
        title: link.name + ' · 已访问 ' + times + ' 次'
      });
      a.appendChild(h('span', { class: 'tile-mono', text: monogram(link.name) }));
      a.appendChild(h('span', { class: 'tile-name', text: link.name }));
      tile.appendChild(a);

      if (pinned) {
        tile.appendChild(h('span', { class: 'tile-pin', 'aria-hidden': 'true' }));
        var x = h('button', {
          type: 'button',
          class: 'tile-x',
          'aria-label': '取消钉住「' + link.name + '」',
          title: '取消钉住',
          text: '✕'
        });
        x.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          unpin(key);
        });
        tile.appendChild(x);
      }

      el.quickRow.appendChild(tile);
    });

    /* 末尾固定「＋」瓦片 */
    var add = h('button', {
      type: 'button',
      class: 'tile-add',
      'aria-label': '添加常用链接',
      title: '添加常用链接'
    });
    var addIcon = h('span', { 'aria-hidden': 'true' });
    addIcon.innerHTML = ICONS.plus;
    add.appendChild(addIcon);
    add.appendChild(h('span', { text: '添加' }));
    add.addEventListener('click', function () { openPinDialog(); });
    el.quickRow.appendChild(add);
  }

  function scheduleQuickRefresh() {
    if (quickTimer) clearTimeout(quickTimer);
    quickTimer = setTimeout(function () {
      quickTimer = null;
      renderQuick();
    }, 0);
  }

  function pinLink(key) {
    if (pins.indexOf(key) < 0) {
      pins.push(key);
      savePins();
    }
    renderQuick();
  }

  function unpin(key) {
    var i = pins.indexOf(key);
    if (i >= 0) {
      pins.splice(i, 1);
      savePins();
    }
    renderQuick();
    var link = findLinkByKey(key);
    toast('已取消钉住「' + (link ? link.name : '') + '」');
  }

  /* ---------------- 渲染总入口 ---------------- */

  function renderAll() {
    renderTabs();
    renderCatPanel();
    renderQuick();
    updateStacksMeta();
  }

  /* ---------------- 添加常用链接 / 新增链接（双模式） ---------------- */

  function openPinDialog() {
    el.pinSearch.value = '';
    renderPinList('');
    el.newLinkUrl.value = '';
    el.newLinkName.value = '';
    el.newLinkDesc.value = '';
    el.newLinkUrlError.textContent = '';
    el.newLinkUrlError.hidden = true;
    fillCatOptions(el.newLinkCat, null);
    setPinMode('existing');
    el.pinDialog.returnValue = 'cancel';
    el.pinDialog.showModal();
    setTimeout(function () { el.pinSearch.focus(); }, 0);
  }

  /* 两个模式共用同一个弹窗，用分段按钮互斥显示 */
  function setPinMode(mode) {
    state.pinMode = (mode === 'new') ? 'new' : 'existing';
    syncSeg(el.pinModeSeg, state.pinMode);
    el.pinPaneExisting.hidden = state.pinMode !== 'existing';
    el.newLinkForm.hidden = state.pinMode !== 'new';
    el.pinDialogTitle.textContent = state.pinMode === 'new' ? '新增链接' : '添加常用链接';
  }

  /* 提交新链接：创建 → 自动钉住 → 关窗 */
  function submitNewLink() {
    var url = normalizeUrl(el.newLinkUrl.value.trim());
    if (!isValidHttpUrl(url)) {
      el.newLinkUrlError.textContent = '网址格式不正确，示例：example.com';
      el.newLinkUrlError.hidden = false;
      return;
    }
    el.newLinkUrlError.hidden = true;

    var cat = findCat(el.newLinkCat.value);
    if (!cat) { toast('目标分类不存在', 'error'); return; }

    var name = el.newLinkName.value.trim() || displayHost(url) || url;
    var desc = el.newLinkDesc.value.trim();

    var link = createPendingLink(cat, name, url, desc);
    saveData();
    renderAll();
    pinLink(linkKey(link));

    el.pinDialog.close('cancel');
    toast('已添加并固定到常用');
  }

  function renderPinList(q) {
    el.pinList.textContent = '';
    var query = String(q || '').trim().toLowerCase();
    var total = 0;

    data.categories.forEach(function (cat) {
      cat.links.forEach(function (link) {
        var hay = (link.name + ' ' + (link.desc || '') + ' ' + cat.name).toLowerCase();
        if (query && hay.indexOf(query) < 0) return;
        total++;

        var key = linkKey(link);
        var pinned = pins.indexOf(key) >= 0;
        var item = h('button', {
          type: 'button',
          class: 'pin-item' + (pinned ? ' is-pinned' : ''),
          'data-key': key,
          'aria-label': (pinned ? '取消钉住 ' : '钉住 ') + link.name
        });
        item.appendChild(h('span', { class: 'pin-item-name', text: link.name }));
        item.appendChild(h('span', { class: 'pin-item-desc', text: link.desc || '' }));
        item.appendChild(h('span', { class: 'pin-item-cat', text: cat.name }));
        item.addEventListener('click', function () {
          if (pinned) unpin(key); else pinLink(key);
          renderPinList(el.pinSearch.value);
        });
        el.pinList.appendChild(item);
      });
    });

    if (total === 0) {
      el.pinList.appendChild(h('li', { class: 'pin-empty', text: query ? '没有匹配的站点' : '暂无链接' }));
    }
  }

  /* ---------------- 批量导入链接（⚙ 面板 → 数据 → 批量导入链接） ---------------- */

  function openBulkDialog() {
    el.bulkText.value = '';
    el.bulkResult.textContent = '';
    el.bulkResult.hidden = true;
    el.bulkDoneBtn.hidden = true;
    var prefer = null;
    for (var i = 0; i < data.categories.length; i++) {
      if (data.categories[i].id === 'search') { prefer = 'search'; break; }
    }
    if (!prefer && data.categories[0]) prefer = data.categories[0].id;
    fillCatOptions(el.bulkCat, prefer);
    el.bulkDialog.returnValue = 'cancel';
    el.bulkDialog.showModal();
    setTimeout(function () { el.bulkText.focus(); }, 0);
  }

  /* 逐行解析：支持「名称 | 网址」与纯网址两种写法 */
  function parseBulkText(text) {
    var lines = String(text || '').split(/\r?\n/);
    var out = [];
    lines.forEach(function (raw) {
      var line = String(raw).trim();
      if (!line) return;
      var name = '';
      var url = line;
      var bar = line.indexOf('|');
      if (bar >= 0) {
        name = line.slice(0, bar).trim();
        url = line.slice(bar + 1).trim();
      }
      out.push({ name: name, url: url });
    });
    return out;
  }

  function runBulkImport() {
    var items = parseBulkText(el.bulkText.value);
    var cat = findCat(el.bulkCat.value);
    if (!cat) { toast('目标分类不存在', 'error'); return; }

    var seen = allLinkUrls();
    var added = 0, dup = 0, invalid = 0;

    items.forEach(function (it) {
      var url = normalizeUrl(it.url);
      if (!isValidHttpUrl(url)) { invalid++; return; }
      var k = urlKey(url);
      if (seen[k]) { dup++; return; }
      seen[k] = true;
      var name = it.name || displayHost(url) || url;
      createPendingLink(cat, name, url, '');
      added++;
    });

    if (added) { saveData(); renderAll(); }

    var summary = '成功 ' + added + ' 条 · 重复 ' + dup + ' 条 · 无效 ' + invalid + ' 条';
    el.bulkResult.textContent = summary;
    el.bulkResult.hidden = false;
    el.bulkDoneBtn.hidden = false;
    toast(summary);
  }

  /* ---------------- 编辑模式 ---------------- */

  function setEditMode(on) {
    state.editMode = !!on;
    document.body.classList.toggle('is-editing', state.editMode);
    if (el.editToggle) el.editToggle.checked = state.editMode;
    renderAll();
  }

  function openLinkDialog(link, cat) {
    state.editing = link ? { link: link, cat: cat } : null;

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
    /* 新增时安全状态锁定为「未核实」且不可改；编辑已有链接时才允许调整 */
    el.linkSafety.value = link ? link.safety : 'pending';
    el.linkSafety.disabled = !link;
    if (el.safetyHint) el.safetyHint.hidden = !!link;
    if (el.noteHint) el.noteHint.hidden = !link;
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
      /* 新建链接一律 pending：没有实际抓取核实过的站点不能算 safe / caution。
         与「＋」弹窗的「新增链接」和批量导入走同一口径。 */
      targetCat.links.push({
        id: genId('l'),
        name: name,
        url: url,
        desc: desc,
        safety: 'pending'
      });
    }
    state.editing = null;
    saveData();
    renderAll();
    toast('已保存');
  }

  function deleteLink(cat, link) {
    confirmAction('删除链接', '确定删除「' + link.name + '」吗？此操作不可撤销。').then(function (ok) {
      if (!ok) return;
      var i = cat.links.indexOf(link);
      if (i >= 0) cat.links.splice(i, 1);
      saveData();
      renderAll();
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
    renderAll();
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
      if (prefs.openCat === cat.id) prefs.openCat = null;
      saveData();
      savePrefs();
      renderAll();
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
        renderAll();
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
        renderAll();
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

  /* ---------------- 链接拖拽排序（展开卡片内） ---------------- */

  function visibleRows(list) {
    return Array.prototype.filter.call(list.querySelectorAll('.link-row'), function (r) {
      return r.getClientRects().length > 0;
    });
  }

  function clearDropMarks() {
    Array.prototype.forEach.call(el.catPanel.querySelectorAll('.drop-before, .drop-after, .is-drop-target'), function (n) {
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
    renderAll();
  }

  function initLinkDrag() {
    el.catPanel.addEventListener('dragstart', function (e) {
      var row = e.target.closest ? e.target.closest('.link-row') : null;
      if (!row || !state.editMode) return;
      dragState = { catId: row._catId, linkId: row._link.id };
      row.classList.add('is-dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', row._link.id); } catch (err) { /* noop */ }
      }
    });

    el.catPanel.addEventListener('dragend', function (e) {
      var row = e.target.closest ? e.target.closest('.link-row') : null;
      if (row) row.classList.remove('is-dragging');
      clearDropMarks();
      dragState = null;
    });

    el.catPanel.addEventListener('dragover', function (e) {
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

    el.catPanel.addEventListener('drop', function (e) {
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
    Array.prototype.forEach.call(el.catTabs.querySelectorAll('.cat-tab.drop-before, .cat-tab.drop-after'), function (n) {
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
    renderAll();
    toast('已移动分类「' + moved.name + '」');
  }

  function initCatDrag() {
    el.catTabs.addEventListener('dragstart', function (e) {
      if (!state.editMode) return;
      var grip = e.target.closest ? e.target.closest('.cat-grip') : null;
      if (!grip) return;                    // 链接行的拖拽交给 initLinkDrag
      var tab = e.target.closest ? e.target.closest('.cat-tab') : null;
      if (!tab) return;
      catDrag = { catId: tab.getAttribute('data-cat-id') };
      tab.classList.add('is-cat-dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', 'cat:' + catDrag.catId); } catch (err) { /* noop */ }
      }
    });

    el.catTabs.addEventListener('dragend', function () {
      if (!catDrag) return;
      var tab = el.catTabs.querySelector('.cat-tab[data-cat-id="' + catDrag.catId + '"]');
      if (tab) tab.classList.remove('is-cat-dragging');
      clearCatDropMarks();
      catDrag = null;
    });

    el.catTabs.addEventListener('dragover', function (e) {
      if (!catDrag) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      clearCatDropMarks();
      var tab = e.target.closest ? e.target.closest('.cat-tab') : null;
      if (!tab) return;
      if (tab.getAttribute('data-cat-id') === catDrag.catId) return;
      var rect = tab.getBoundingClientRect();
      var after = (e.clientX - rect.left) > rect.width / 2;
      tab.classList.add(after ? 'drop-after' : 'drop-before');
    });

    el.catTabs.addEventListener('drop', function (e) {
      if (!catDrag) return;
      e.preventDefault();
      var tab = e.target.closest ? e.target.closest('.cat-tab') : null;
      var targetId = tab ? tab.getAttribute('data-cat-id') : null;
      var after = false;
      if (tab) {
        var rect = tab.getBoundingClientRect();
        after = (e.clientX - rect.left) > rect.width / 2;
      }
      var srcId = catDrag.catId;
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
      if (e.defaultPrevented) return;

      var typing = isTypingTarget(e.target);
      var dialogOpen = !!document.querySelector('dialog[open]');

      if (e.key === 'Escape') {
        if (dialogOpen) return;                 // 原生 dialog 自行关闭
        if (!el.engineMenu.hidden) { e.preventDefault(); closeEngineMenu(true); return; }
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
      if (!el.engineMenu.hidden) return;
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
    /* 顶栏 */
    el.themeBtn.addEventListener('click', cycleTheme);
    el.settingsBtn.addEventListener('click', function () { setPanelOpen(!prefs.panelOpen); });

    /* 搜索引擎下拉 */
    el.engineBtn.addEventListener('click', function () {
      if (el.engineMenu.hidden) openEngineMenu(); else closeEngineMenu(true);
    });
    el.engineBtn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); openEngineMenu(); }
      else if (e.key === 'Escape' && !el.engineMenu.hidden) { e.preventDefault(); closeEngineMenu(true); }
    });
    el.engineMenu.addEventListener('keydown', function (e) {
      var opts = engineMenuOptions();
      var idx = opts.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (opts.length) opts[Math.min(idx + 1, opts.length - 1)].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (opts.length) opts[Math.max(idx - 1, 0)].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        if (opts.length) opts[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        if (opts.length) opts[opts.length - 1].focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeEngineMenu(true);
      } else if (e.key === 'Tab') {
        closeEngineMenu(false);
      }
    });

    /* 点空白处收起引擎菜单 */
    document.addEventListener('click', function (e) {
      if (el.engineMenu.hidden) return;
      if (e.target.closest && e.target.closest('#enginePicker')) return;
      closeEngineMenu(false);
    });

    /* 搜索 */
    el.searchInput.addEventListener('input', updateHint);
    el.searchInput.addEventListener('focus', updateHint);
    el.searchInput.addEventListener('blur', updateHint);
    el.searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); handleSearch(); }
    });
    el.searchGo.addEventListener('click', handleSearch);

    /* 点击任何链接都记一次频次（常用瓦片 / 展开卡片里的链接行） */
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[data-usage-key]') : null;
      if (!a) return;
      bumpUsage(a.getAttribute('data-usage-key'));
      scheduleQuickRefresh();
    });

    /* 设置面板 */
    bindSeg(el.segTheme, function (v) {
      state.theme = v;
      storeSet(KEY_THEME, v);
      applyTheme();
    });
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

    if (el.editToggle) {
      el.editToggle.addEventListener('change', function () {
        setEditMode(el.editToggle.checked);
      });
    }

    if (el.safetyToggle) {
      el.safetyToggle.addEventListener('change', function () {
        state.safeOnly = el.safetyToggle.checked;
        storeSet(KEY_SAFE_ONLY, state.safeOnly ? '1' : '0');
        applySafetyFilter();
        updateStacksMeta();
      });
    }

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

    /* 添加常用链接：双模式（挑已有 / 建新链接） */
    if (el.pinSearch) {
      el.pinSearch.addEventListener('input', function () { renderPinList(el.pinSearch.value); });
    }
    bindSeg(el.pinModeSeg, setPinMode);
    el.newLinkForm.addEventListener('submit', function (e) {
      e.preventDefault();
      submitNewLink();
    });

    /* 批量导入链接 */
    el.bulkOpenBtn.addEventListener('click', openBulkDialog);
    el.bulkForm.addEventListener('submit', function (e) { e.preventDefault(); });
    el.bulkImportBtn.addEventListener('click', runBulkImport);
    el.bulkDoneBtn.addEventListener('click', function () { el.bulkDialog.close('cancel'); });

    /* 链接表单 */
    el.linkSafety.addEventListener('change', syncNoteField);
    el.linkForm.addEventListener('submit', function (e) {
      if (!validateLinkForm()) { e.preventDefault(); return; }
    });
    el.linkDialog.addEventListener('close', function () {
      if (el.linkDialog.returnValue === 'save') applyLinkForm();
    });

    /* 分类表单 */
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

    /* 取消按钮 */
    Array.prototype.forEach.call(document.querySelectorAll('[data-close]'), function (btn) {
      btn.addEventListener('click', function () {
        var dlg = btn.closest('dialog');
        if (dlg) dlg.close('cancel');
      });
    });

    window.addEventListener('resize', function () { applyColumns(); });
  }

  /* ---------------- 启动 ---------------- */

  function init() {
    cacheDom();

    el.searchGo.innerHTML = ICONS.search;
    el.settingsBtn.innerHTML = ICONS.sliders;

    /* 主题 */
    var savedTheme = storeGet(KEY_THEME);
    state.theme = THEME_ORDER.indexOf(savedTheme) >= 0 ? savedTheme : 'auto';
    applyTheme();
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', updateThemeColor);
    }

    /* 搜索引擎 */
    var savedEngine = storeGet(KEY_ENGINE);
    state.engine = ENGINES.some(function (e) { return e.id === savedEngine; }) ? savedEngine : DEFAULT_ENGINE;
    renderEngineMenu();
    el.engineLabel.textContent = currentEngine().label;

    /* 安全视图 */
    state.safeOnly = storeGet(KEY_SAFE_ONLY) === '1';
    el.safetyToggle.checked = state.safeOnly;

    /* 使用频次 / 钉住 */
    loadUsage();
    loadPins();

    /* 界面偏好（背景 + 布局） */
    loadPrefs();
    renderBgChips();
    applyPrefs();
    applyBackground(false);

    /* 数据 */
    data = loadData();
    if (prefs.openCat && !findCat(prefs.openCat)) prefs.openCat = null;
    renderAll();

    /* 时钟 */
    tickClock();
    setInterval(tickClock, 1000);

    initEvents();
    initLinkDrag();
    initCatDrag();
    initKeyboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
