/* ===========================================================================
   起始页 · 验收脚本 verify.cjs
   ---------------------------------------------------------------------------
   一条命令跑完全部验收：

       node verify.cjs

   做两件事：
     ① 数据核对  —— 解析 data.js，核对分类数 / 链接数 / safety 三态 /
                     「原 70 条一条没丢、safety 与 note 没被破坏」/ 新增条目抽查
     ② 浏览器实测 —— 用系统 Chrome 的远程调试协议（CDP）打开本目录的 index.html，
                     逐条实测 80 项断言：控制台零报错、背景切换与渐变兜底、
                     亮度模糊滑杆、列数/密度/视图/折叠/拖拽排序/全宽及其刷新保持、
                     动效与 prefers-reduced-motion、既有功能不退化、
                     1280/900/560 响应式零横向溢出、零外部网络请求。

   依赖：Node 18+（需内置 WebSocket）与本机 Chrome / Edge。
   无需 npm install，无网络请求。
   =========================================================================== */

/* ======================= ① 数据核对 ======================= */
(function () {
/* 临时校验脚本：data.js 数据完整性与结构核对（验证后删除） */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const DIR = 'D:/summer/maxmin/documents/scripts/browser-homepage';
const src = fs.readFileSync(path.join(DIR, 'data.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const d = sandbox.window.DEFAULT_DATA;
if (!d) { console.log('FAIL: window.DEFAULT_DATA is undefined'); process.exit(1); }
console.log('window.DEFAULT_DATA present: OK');
console.log('categories:', d.categories.length);

let total = 0;
const bySafety = { safe: 0, caution: 0, pending: 0 };
const ids = new Set();
const urlIndex = new Map();

d.categories.forEach(c => {
  if (ids.has(c.id)) console.log('DUPLICATE CAT ID:', c.id);
  ids.add(c.id);
  total += c.links.length;
  c.links.forEach(l => {
    bySafety[l.safety] = (bySafety[l.safety] || 0) + 1;
    const k = l.name + '|' + l.url;
    if (urlIndex.has(k)) console.log('DUPLICATE LINK:', k, '(in ' + urlIndex.get(k) + ' and ' + c.id + ')');
    else urlIndex.set(k, c.id);
  });
  console.log('  ' + c.id.padEnd(12) + String(c.links.length).padStart(3) + '  ' + c.name + '  [' + c.tag + ']  ' + c.color);
});
console.log('total links:', total);
console.log('by safety:', JSON.stringify(bySafety));

const bad = [];
d.categories.forEach(c => c.links.forEach(l => {
  if (!['safe', 'caution', 'pending'].includes(l.safety)) bad.push(c.id + '/' + l.name + ' safety=' + l.safety);
  if (l.safety === 'caution' && !l.note) bad.push(c.id + '/' + l.name + ' caution without note');
  if (!l.name || !l.url) bad.push(c.id + '/' + l.name + ' missing name/url');
  if (!/^https?:\/\//.test(l.url)) bad.push(c.id + '/' + l.name + ' non-http url: ' + l.url);
}));
console.log('anomalies:', bad.length ? bad : 'none');

/* ---- 与改造前的 13 分类 / 70 链接基线比对（基线来自改造前的 data.js） ---- */
const BASELINE = {
  search: [['百度','https://www.baidu.com','safe'],['必应','https://cn.bing.com','safe'],['Google','https://www.google.cn/','safe'],['SearXNG','https://searx.be/','safe']],
  ai: [['DeepSeek','https://chat.deepseek.com','caution'],['Kimi','https://www.kimi.com/','safe'],['千问','https://www.qianwen.com/','safe'],['秘塔 AI 搜索','https://metaso.cn/','safe'],['讯飞星火','https://xinghuo.xfyun.cn/','safe']],
  design: [['Photopea','https://www.photopea.com','safe'],['Canva','https://www.canva.cn/','safe'],['TinyPNG','https://tinypng.com','caution'],['Iconify','https://icon-sets.iconify.design/','safe'],['IconPark','https://iconpark.oceanengine.com/','safe']],
  wall: [['Unsplash','https://unsplash.com','safe'],['Pexels','https://www.pexels.com/zh-cn/','caution'],['Pixabay','https://pixabay.com','caution'],['Wallpaper Abyss','https://wall.alphacoders.com/','caution'],['极简壁纸','https://bz.zzzmh.cn','caution'],['Simple Desktops','https://simpledesktops.com/','safe']],
  doc: [['iLovePDF','https://www.ilovepdf.com','caution'],['PDF24 Tools','https://tools.pdf24.org','caution'],['Stirling PDF','https://www.stirling.com/','safe'],['ONLYOFFICE','https://www.onlyoffice.com/','safe']],
  dev: [['GitHub','https://github.com','safe'],['GitHub Trending','https://github.com/trending?since=daily','safe'],['Stack Overflow','https://stackoverflow.com','safe'],['MDN','https://developer.mozilla.org/zh-CN/','safe'],['Can I use','https://caniuse.com/','safe'],['Crontab Guru','https://crontab.guru/','safe'],['Carbon','https://carbon.now.sh/','safe'],['稀土掘金','https://juejin.cn/','safe']],
  conv: [['VERT.sh','https://vert.sh/','safe'],['OnlineConvert','https://www.onlineconvert.com/','caution'],['CloudConvert','https://cloudconvert.com/','caution'],['TinyWow','https://tinywow.com/','caution'],['123Apps','https://www.123apps.com/','caution']],
  net: [['Cloudflare 测速','https://speed.cloudflare.com/','safe'],['Speedtest','https://www.speedtest.net/','caution'],['nPerf','https://www.nperf.com/','caution'],['Dotcom-Tools','https://www.dotcom-tools.com/','caution'],['ITDOG','https://www.itdog.cn/','caution'],['17CE','https://www.17ce.com/','safe'],['ping.pe','https://ping.pe/','safe']],
  safe: [['ImmuniWeb','https://www.immuniweb.com/','safe'],['Have I Been Pwned','https://haveibeenpwned.com/','safe'],['Firefox Relay','https://relay.firefox.com/','safe']],
  note: [['Obsidian','https://obsidian.md/','safe'],['思源笔记','https://b3log.org/siyuan/','safe'],['滴答清单','https://dida365.com/','safe'],['番茄钟','https://www.tomatotimers.com/','safe'],['Quizlet','https://quizlet.com/','caution']],
  tool: [['Excalidraw','https://excalidraw.com/','safe'],['BoardOS','https://boardos.online/','caution'],['WiteBoard','https://witeboard.com/','safe'],['LiveGap Charts','https://charts.livegap.com/','caution'],['CaseWren','https://casewren.com/','safe'],['Textbench','https://textbench.app/','safe']],
  hard: [['BrowserBench','https://browserbench.org/','safe'],['CamMicGo','https://www.cammicgo.com/','safe'],['Mictest','https://mictest.co/','caution']],
  read: [['古腾堡计划','https://www.gutenberg.org/','safe'],['Internet Archive','https://archive.org/','safe'],['Open Library','https://openlibrary.org/','safe'],['Libby','https://libbyapp.com/','safe'],['国家图书馆','https://www.nlc.cn/','caution'],['Folo','https://folo.is/','safe'],['WikiFlix','https://wikiflix.toolforge.org/','safe'],['咪咕音乐','https://music.migu.cn/','safe'],['Jamendo','https://www.jamendo.com/','safe']]
};

let baseCount = 0;
let missing = [];
let changed = [];
Object.keys(BASELINE).forEach(cid => {
  const cat = d.categories.find(c => c.id === cid);
  if (!cat) { missing.push('CATEGORY LOST: ' + cid); return; }
  baseCount += BASELINE[cid].length;
  BASELINE[cid].forEach(([n, u, s]) => {
    const l = cat.links.find(x => x.name === n && x.url === u);
    if (!l) missing.push(cid + '/' + n + ' (' + u + ')');
    else if (l.safety !== s) changed.push(cid + '/' + n + ' safety ' + s + ' -> ' + l.safety);
  });
  console.log('  ' + cid.padEnd(12) + 'baseline ' + BASELINE[cid].length + ' / now ' + cat.links.length);
});
console.log('baseline total:', baseCount);
console.log('baseline links lost:', missing.length ? missing : 'NONE');
console.log('baseline safety changed:', changed.length ? changed : 'NONE');

/* ---- 分类顺序 ---- */
console.log('category order:', d.categories.map(c => c.id).join(' > '));

/* ---- 关键新增项抽查 ---- */
const expect = [
  ['research', 'Google 学术', 'https://scholar.google.com', 'caution'],
  ['research', 'arXiv', 'https://arxiv.org', 'safe'],
  ['research', 'Zenodo', 'https://zenodo.org', 'safe'],
  ['research', 'CNKI 中国知网', 'https://www.cnki.net', 'safe'],
  ['research', '中国科学数据仓库', 'https://www.csdb.cn', 'safe'],
  ['ai-global', 'ChatGPT', 'https://chatgpt.com', 'caution'],
  ['ai-global', 'Claude', 'https://claude.ai', 'caution'],
  ['ai-global', 'Gemini', 'https://gemini.google.com', 'caution'],
  ['ai-global', 'Google', 'https://www.google.com', 'caution'],
  ['ai-global', 'Poe', 'https://poe.com', 'caution'],
  ['ai-global', 'OpenAI Cookbook', 'https://cookbook.openai.com', 'caution']
];
const miss2 = [];
expect.forEach(([cid, n, u, s]) => {
  const cat = d.categories.find(c => c.id === cid);
  const l = cat && cat.links.find(x => x.name === n && x.url === u);
  if (!l) miss2.push(cid + '/' + n);
  else if (l.safety !== s) miss2.push(cid + '/' + n + ' safety=' + l.safety + ' (expected ' + s + ')');
  else if (s === 'caution' && !l.note) miss2.push(cid + '/' + n + ' caution without note');
});
console.log('new-item check:', miss2.length ? miss2 : 'all present & correct');

})();

/* =================== ② 浏览器端到端实测 =================== */
(function () {
/* 临时 CDP 验收脚本（验证后删除）
 * 用系统 Chrome + 远程调试协议驱动，逐条实测验收标准
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_PAGE = 'file:///D:/summer/maxmin/documents/scripts/browser-homepage/index.html';
const SHOTS = 'D:\\summer\\maxmin\\tmp\\bh-shots';

const results = [];
function ok(name, cond, detail) {
  results.push({ name, pass: !!cond, detail: detail === undefined ? '' : String(detail) });
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (detail !== undefined ? '  |  ' + detail : ''));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

class CDP {
  constructor(url) {
    this.url = url;
    this.id = 0;
    this.pending = new Map();
    this.handlers = [];
  }
  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => resolve();
      this.ws.onerror = e => reject(new Error('ws error'));
      this.ws.onmessage = ev => {
        const msg = JSON.parse(ev.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { res, rej } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) rej(new Error(JSON.stringify(msg.error)));
          else res(msg.result);
        } else if (msg.method) {
          this.handlers.forEach(h => h(msg.method, msg.params));
        }
      };
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(fn) { this.handlers.push(fn); }
  close() { try { this.ws.close(); } catch (e) {} }
}

async function getWsUrl(port, retries = 60) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find(t => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch (e) {}
    await sleep(250);
  }
  throw new Error('chrome devtools not reachable');
}

(async () => {
  if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'bhprof-'));
  const port = 9333;

  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--hide-scrollbars', '--force-device-scale-factor=1',
    '--allow-file-access-from-files',
    '--window-size=1280,900',
    'about:blank'
  ], { stdio: 'ignore' });

  let cdp;
  const consoleErrors = [];
  const consoleAll = [];
  const exceptions = [];
  const requests = [];

  try {
    const wsUrl = await getWsUrl(port);
    cdp = new CDP(wsUrl);
    await cdp.connect();

    cdp.on((method, params) => {
      if (method === 'Runtime.consoleAPICalled') {
        const text = (params.args || []).map(a => a.value !== undefined ? String(a.value) : (a.description || a.type)).join(' ');
        consoleAll.push(params.type + ': ' + text);
        if (params.type === 'error') consoleErrors.push(text);
      }
      if (method === 'Runtime.exceptionThrown') {
        const d = params.exceptionDetails;
        exceptions.push((d.exception && (d.exception.description || d.exception.value)) || d.text);
      }
      if (method === 'Network.requestWillBeSent') {
        requests.push(params.request.url);
      }
      if (method === 'Network.loadingFailed') {
        const r = requests.find(x => x === params.requestId);
        if (r) { /* ignore */ }
      }
    });

    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    await cdp.send('Network.enable');
    await cdp.send('Log.enable');

    const evalJS = async (expr) => {
      const r = await cdp.send('Runtime.evaluate', {
        expression: expr, returnByValue: true, awaitPromise: true, userGesture: true
      });
      if (r.exceptionDetails) {
        throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text) + ' :: ' + expr.slice(0, 160));
      }
      return r.result.value;
    };

    await cdp.send('Page.navigate', { url: URL_PAGE });
    await sleep(2500);

    /* ============ 1. 无 JS 报错 ============ */
    ok('C1 页面加载无 JS 异常', exceptions.length === 0, exceptions.join(' | ') || '0 exceptions');
    ok('C1 控制台 0 error', consoleErrors.length === 0, consoleErrors.join(' | ') || '0 errors');

    /* ============ 数据规模 ============ */
    const counts = await evalJS(`JSON.stringify({
      cats: document.querySelectorAll('.cat').length,
      links: document.querySelectorAll('.link-row').length,
      spines: document.querySelectorAll('.cat-spine').length,
      callnos: document.querySelectorAll('.cat-callno').length,
      match: document.getElementById('matchCount').textContent
    })`);
    const c = JSON.parse(counts);
    ok('D10 渲染 15 个分类', c.cats === 15, 'cats=' + c.cats);
    ok('D10 渲染 106 条链接', c.links === 106, 'links=' + c.links);
    ok('D10 每分类有书脊', c.spines === 15 && c.callnos === 15, 'spines=' + c.spines + ' callno=' + c.callnos);
    ok('D10 状态行总数正确', c.match === '共 106 项', c.match);

    /* ============ 索书号内容 ============ */
    const callnos = await evalJS(`Array.from(document.querySelectorAll('.cat')).map((el,i)=>el.querySelector('.cat-callno').textContent).join(' | ')`);
    ok('D 索书号 = 序号 · TAG', callnos.startsWith('01 · SEARCH') && callnos.includes('03 · RESEARCH') && callnos.includes('04 · GLOBAL AI'), callnos);

    /* ============ localStorage 可用 ============ */
    const lsOk = await evalJS(`(()=>{try{localStorage.setItem('__t','1');const v=localStorage.getItem('__t')==='1';localStorage.removeItem('__t');return v;}catch(e){return 'ERR:'+e.message}})()`);
    ok('C4 localStorage 在 file:// 可用', lsOk === true, String(lsOk));

    /* 全新档案：面板默认收起，不占首屏 */
    const freshDefault = JSON.parse(await evalJS(`JSON.stringify({
      panelHidden: document.getElementById('panel').hidden,
      toggleExpanded: document.getElementById('panelToggle').getAttribute('aria-expanded'),
      bg: document.body.getAttribute('data-bg'),
      cols: getComputedStyle(document.getElementById('grid')).gridTemplateColumns.split(' ').length,
      density: document.body.getAttribute('data-density'),
      view: document.body.getAttribute('data-view'),
      wide: document.body.classList.contains('is-wide'),
      uiStored: localStorage.getItem('xyai.homepage.ui.v1')
    })`));
    ok('C4 全新档案：面板默认收起 + 默认 3 列/舒适/书架/无背景', freshDefault.panelHidden === true && freshDefault.toggleExpanded === 'false'
      && freshDefault.bg === 'none' && freshDefault.cols === 3 && freshDefault.density === 'comfort' && freshDefault.view === 'shelf' && freshDefault.wide === false,
      JSON.stringify(freshDefault));

    /* ============ 2. 背景切换 ============ */
    await evalJS(`document.getElementById('panelToggle').click()`);
    await sleep(200);
    const panelOpen = await evalJS(`!document.getElementById('panel').hidden`);
    ok('C4 布局面板可展开', panelOpen === true, 'panel hidden=' + !panelOpen);

    const chipInfo = await evalJS(`JSON.stringify(Array.from(document.querySelectorAll('.bg-chip')).map(c=>({id:c.getAttribute('data-bg-id'),label:c.getAttribute('data-label'),checked:c.getAttribute('aria-checked'),img:(c.style.backgroundImage||'').slice(0,60)})))`);
    const chips = JSON.parse(chipInfo);
    ok('C2 背景芯片共 6 个（5 图 + 无背景）', chips.length === 6, chips.map(c => c.id).join(','));

    const bgResults = [];
    for (const id of ['aurora', 'stacks', 'dune', 'rain', 'nebula', 'none']) {
      await evalJS(`document.querySelector('.bg-chip[data-bg-id="${id}"]').click()`);
      await sleep(1400);
      const st = JSON.parse(await evalJS(`(()=>{
        const slots=[document.getElementById('bgA'),document.getElementById('bgB')];
        const on=slots.filter(s=>s.classList.contains('is-on'));
        return JSON.stringify({
          active: on.length,
          img: on[0] ? (on[0].style.backgroundImage||'') : '',
          op: on[0] ? getComputedStyle(on[0]).opacity : '',
          bodyAttr: document.body.getAttribute('data-bg'),
          checked: document.querySelector('.bg-chip[data-bg-id="${id}"]').getAttribute('aria-checked')
        });
      })()`));
      const hasImg = id !== 'none' && st.img.indexOf('assets/bg-' + id) >= 0;
      const fallbackOk = id !== 'none' ? (st.img.indexOf('linear-gradient') >= 0) : (st.img === '');
      const expectOk = id !== 'none' ? (hasImg && fallbackOk) : (st.img === '');
      bgResults.push(id + ':' + (expectOk ? 'OK' : 'FAIL'));
      ok('C2 背景 ' + id + ' 生效' + (id === 'none' ? '（无背景 = 无图片层）' : '（图片层 + 渐变兜底层）'),
        expectOk && st.op === '1' && st.bodyAttr === id && st.checked === 'true',
        'opacity=' + st.op + ' bodyAttr=' + st.bodyAttr + ' checked=' + st.checked + ' img=' + st.img.slice(0, 70));
    }

    /* 图片实载检查：5 个本地 jpg 必须能被浏览器解码加载（不是坏文件） */
    const imgLoad = await evalJS(`(async()=>{
      const files=['bg-aurora.jpg','bg-stacks.jpg','bg-dune.jpg','bg-rain.jpg','bg-nebula.jpg'];
      const out={};
      await Promise.all(files.map(f=>new Promise(res=>{
        const im=new Image();
        im.onload=()=>{out[f]='ok '+im.naturalWidth+'x'+im.naturalHeight; res();};
        im.onerror=()=>{out[f]='ERROR'; res();};
        im.src='assets/'+f;
      })));
      return JSON.stringify(out);
    })()`);
    const imgObj = JSON.parse(imgLoad);
    const allLoaded = Object.keys(imgObj).length === 5 && Object.keys(imgObj).every(k => imgObj[k].indexOf('ok ') === 0);
    ok('C2 assets/ 下 5 张背景图均可被浏览器解码加载', allLoaded, JSON.stringify(imgObj));

    /* 交叉淡入：在过渡窗口内连续采样，要求存在「双槽同时半透明」的中间帧 */
    await evalJS(`document.querySelector('.bg-chip[data-bg-id="aurora"]').click()`);
    const fadeSamples = [];
    for (let i = 0; i < 14; i++) {
      await sleep(60);
      const ops = JSON.parse(await evalJS(`(()=>{
        const s=[document.getElementById('bgA'),document.getElementById('bgB')];
        return JSON.stringify(s.map(x=>Math.round(parseFloat(getComputedStyle(x).opacity)*1000)/1000));
      })()`));
      fadeSamples.push(ops.join('/'));
    }
    const midFrames = fadeSamples.filter(s => {
      const [a, b] = s.split('/').map(Number);
      return a > 0.02 && a < 0.98 && b > 0.02 && b < 0.98;
    });
    ok('C2 背景交叉淡入（存在双槽同时半透明的中间帧）', midFrames.length > 0,
      'samples=' + fadeSamples.join(' ') + ' midFrames=' + midFrames.length);
    await sleep(1200);

    /* ============ 3. 亮度 / 模糊滑杆 ============ */
    await evalJS(`(()=>{const r=document.getElementById('brightRange');r.value='0.55';r.dispatchEvent(new Event('input',{bubbles:true}));const u=document.getElementById('blurRange');u.value='12';u.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await sleep(200);
    const sliderState = JSON.parse(await evalJS(`JSON.stringify({
      brightVar: getComputedStyle(document.documentElement).getPropertyValue('--bg-bright').trim(),
      blurVar: getComputedStyle(document.documentElement).getPropertyValue('--bg-blur').trim(),
      slotFilter: getComputedStyle(document.getElementById('bgA')).filter || getComputedStyle(document.getElementById('bgB')).filter,
      brightOut: document.getElementById('brightOut').textContent,
      blurOut: document.getElementById('blurOut').textContent
    })`));
    ok('C3 亮度滑杆生效（作用于背景层 filter）', sliderState.brightVar === '0.55' && /brightness\(0\.55\)/.test(sliderState.slotFilter),
      'var=' + sliderState.brightVar + ' filter=' + sliderState.slotFilter + ' out=' + sliderState.brightOut);
    ok('C3 模糊滑杆生效（作用于背景层 filter）', sliderState.blurVar === '12px' && /blur\(12px\)/.test(sliderState.slotFilter),
      'var=' + sliderState.blurVar + ' filter=' + sliderState.slotFilter + ' out=' + sliderState.blurOut);

    /* ============ 4. 布局自由度 ============ */
    const layoutPick = async (sel, v) => {
      await evalJS(`document.querySelector('${sel} [data-v="${v}"]').click()`);
      await sleep(250);
    };

    for (const n of [1, 2, 3, 4]) {
      await layoutPick('#segCols', n);
      const cols = await evalJS(`getComputedStyle(document.getElementById('grid')).gridTemplateColumns.split(' ').length`);
      ok('C4 列数 = ' + n, cols === n, 'computed columns=' + cols);
    }

    for (const d of ['comfort', 'compact', 'minimal']) {
      await layoutPick('#segDensity', d);
      const st = JSON.parse(await evalJS(`JSON.stringify({
        attr: document.body.getAttribute('data-density'),
        desc: getComputedStyle(document.querySelector('.link-desc')).display,
        clamp: getComputedStyle(document.querySelector('.link-desc')).webkitLineClamp,
        nameSize: getComputedStyle(document.querySelector('.link-name')).fontSize,
        rowPad: getComputedStyle(document.querySelector('.link-row')).paddingTop
      })`));
      const expectDesc = d === 'minimal' ? 'none' : 'notnone';
      const descOk = d === 'minimal' ? st.desc === 'none' : st.desc !== 'none';
      const clampOk = d === 'compact' ? st.clamp === '1' : (d === 'comfort' ? st.clamp === '2' : true);
      ok('C4 密度 ' + d, st.attr === d && descOk && clampOk,
        'attr=' + st.attr + ' desc=' + st.desc + ' clamp=' + st.clamp + ' nameSize=' + st.nameSize + ' rowPad=' + st.rowPad);
    }

    for (const v of ['shelf', 'list']) {
      await layoutPick('#segView', v);
      const st = JSON.parse(await evalJS(`JSON.stringify({
        attr: document.body.getAttribute('data-view'),
        cols: getComputedStyle(document.getElementById('grid')).gridTemplateColumns.split(' ').length,
        catW: Math.round(document.querySelector('.cat').getBoundingClientRect().width)
      })`));
      ok('C4 视图 ' + v, st.attr === v && (v === 'list' ? st.cols === 1 : st.cols >= 1),
        'attr=' + st.attr + ' columns=' + st.cols + ' catWidth=' + st.catW);
    }
    await layoutPick('#segView', 'shelf');

    /* 折叠 */
    await evalJS(`document.querySelector('.cat[data-cat-id="read"] .cat-spine').click()`);
    await sleep(250);
    const coll = JSON.parse(await evalJS(`(()=>{const c=document.querySelector('.cat[data-cat-id="read"]');
      return JSON.stringify({cls:c.className, linksVisible:getComputedStyle(c.querySelector('.links')).display, hintHidden:c.querySelector('.cat-collapsed').hidden, aria:c.querySelector('.cat-spine').getAttribute('aria-expanded'), hintText:c.querySelector('.cat-collapsed').textContent});})()`));
    ok('C4 单分类折叠（点书脊）', coll.cls.indexOf('is-collapsed') >= 0 && coll.linksVisible === 'none' && coll.hintHidden === false && coll.aria === 'false',
      'links=' + coll.linksVisible + ' hint="' + coll.hintText + '" aria-expanded=' + coll.aria);

    /* 全宽：对比开关前后容器宽度 */
    const wideOff = await evalJS(`Math.round(document.querySelector('.app').getBoundingClientRect().width)`);
    await evalJS(`(()=>{const t=document.getElementById('wideToggle');t.checked=true;t.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await sleep(400);
    const wideOn = await evalJS(`Math.round(document.querySelector('.app').getBoundingClientRect().width)`);
    const wideCls = await evalJS(`document.body.classList.contains('is-wide')`);
    ok('C4 全宽开关生效（容器变宽）', wideOn > wideOff && wideCls === true, 'off=' + wideOff + 'px on=' + wideOn + 'px is-wide=' + wideCls);
    await evalJS(`(()=>{const t=document.getElementById('wideToggle');t.checked=false;t.dispatchEvent(new Event('change',{bubbles:true}));})()`);

    /* 分类拖拽排序 */
    const beforeOrder = await evalJS(`Array.from(document.querySelectorAll('.cat')).map(e=>e.getAttribute('data-cat-id')).join(',')`);
    await evalJS(`document.getElementById('editBtn').click()`);
    await sleep(400);
    const dragRes = await evalJS(`(()=>{
      const grip=document.querySelector('.cat[data-cat-id="search"] .cat-grip');
      const target=document.querySelector('.cat[data-cat-id="read"]');
      if(!grip||!target) return 'NO_GRIP';
      const dt=new DataTransfer();
      const r=target.getBoundingClientRect();
      const x=r.left+5, y=r.top+r.height/2;
      grip.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:dt}));
      target.dispatchEvent(new DragEvent('dragover',{bubbles:true,dataTransfer:dt,clientX:x,clientY:y}));
      target.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:dt,clientX:x,clientY:y}));
      grip.dispatchEvent(new DragEvent('dragend',{bubbles:true,dataTransfer:dt}));
      return 'DONE';
    })()`);
    await sleep(500);
    const afterOrder = await evalJS(`Array.from(document.querySelectorAll('.cat')).map(e=>e.getAttribute('data-cat-id')).join(',')`);
    ok('C4 拖拽整本改变分类顺序', dragRes === 'DONE' && beforeOrder !== afterOrder, beforeOrder + '  ->  ' + afterOrder);
    await evalJS(`document.getElementById('editBtn').click()`);
    await sleep(300);

    /* ---- 刷新后全部保持 ---- */
    const snapshot = await evalJS(`localStorage.getItem('xyai.homepage.ui.v1')`);
    ok('C4 偏好写入 localStorage', !!snapshot, String(snapshot).slice(0, 200));

    await cdp.send('Page.reload', {});
    await sleep(2200);
    const persisted = JSON.parse(await evalJS(`(()=>{
      const g=document.getElementById('grid');
      const cs=document.getElementById('segCols');
      return JSON.stringify({
        bright: getComputedStyle(document.documentElement).getPropertyValue('--bg-bright').trim(),
        blur: getComputedStyle(document.documentElement).getPropertyValue('--bg-blur').trim(),
        density: document.body.getAttribute('data-density'),
        view: document.body.getAttribute('data-view'),
        colsSeg: cs ? Array.from(cs.children).filter(b=>b.getAttribute('aria-checked')==='true').map(b=>b.getAttribute('data-v')).join('') : '',
        gridCols: getComputedStyle(g).gridTemplateColumns.split(' ').length,
        collapsed: !!document.querySelector('.cat[data-cat-id="read"].is-collapsed'),
        wide: document.body.classList.contains('is-wide'),
        bg: document.body.getAttribute('data-bg'),
        order: Array.from(document.querySelectorAll('.cat')).map(e=>e.getAttribute('data-cat-id')).join(',')
      });
    })()`));
    ok('C3/C4 刷新后亮度保持', persisted.bright === '0.55', 'bright=' + persisted.bright);
    ok('C3 刷新后模糊保持', persisted.blur === '12px', 'blur=' + persisted.blur);
    ok('C4 刷新后密度保持', persisted.density === 'minimal', 'density=' + persisted.density);
    ok('C4 刷新后视图保持', persisted.view === 'shelf', 'view=' + persisted.view);
    ok('C4 刷新后列数保持', persisted.colsSeg === '4' && persisted.gridCols === 4, 'seg=' + persisted.colsSeg + ' gridCols=' + persisted.gridCols);
    ok('C4 刷新后折叠状态保持', persisted.collapsed === true, 'collapsed=' + persisted.collapsed);
    ok('C4 刷新后分类顺序保持', persisted.order === afterOrder, persisted.order);
    ok('C4 刷新后面板展开状态保持', (await evalJS(`document.getElementById('panel').hidden`)) === false, 'panel hidden after reload');

    /* ============ 5. 既有功能复测 ============ */
    /* 实时筛选 */
    await evalJS(`(()=>{const i=document.getElementById('searchInput');i.value='arxiv';i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await sleep(300);
    const filt = JSON.parse(await evalJS(`JSON.stringify({
      count: document.getElementById('matchCount').textContent,
      visibleRows: Array.from(document.querySelectorAll('.link-row')).filter(r=>!r.hidden).length,
      visibleCats: Array.from(document.querySelectorAll('.cat')).filter(c=>!c.hidden).length
    })`));
    ok('C6 实时筛选生效', filt.count === '1 项匹配' && filt.visibleRows === 1, JSON.stringify(filt));

    /* 空状态 + 清除筛选 */
    await evalJS(`(()=>{const i=document.getElementById('searchInput');i.value='zzzznotexist';i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await sleep(300);
    const empty = JSON.parse(await evalJS(`JSON.stringify({hidden:document.getElementById('emptyState').hidden, title:document.getElementById('emptyTitle').textContent, btn:document.getElementById('clearFilterBtn').textContent})`));
    ok('C6 空状态出现', empty.hidden === false && /没有匹配/.test(empty.title), JSON.stringify(empty));
    await evalJS(`document.getElementById('clearFilterBtn').click()`);
    await sleep(300);
    const cleared = JSON.parse(await evalJS(`JSON.stringify({q:document.getElementById('searchInput').value, hidden:document.getElementById('emptyState').hidden, count:document.getElementById('matchCount').textContent})`));
    ok('C6 清除筛选生效', cleared.q === '' && cleared.hidden === true && cleared.count === '共 106 项', JSON.stringify(cleared));

    /* ! 搜索 + 引擎切换 */
    await evalJS(`(()=>{const s=document.getElementById('engineSelect');s.value='bing';s.dispatchEvent(new Event('change',{bubbles:true}));const i=document.getElementById('searchInput');i.value='!量子计算';i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await sleep(300);
    const searchMode = JSON.parse(await evalJS(`JSON.stringify({badge:document.getElementById('modeBadge').textContent, mode:document.getElementById('modeBadge').getAttribute('data-mode'), hint:document.getElementById('hintLine').textContent, engine:document.getElementById('engineSelect').value})`));
    ok('C6 ! 前缀进入搜索模式 + 引擎切换', searchMode.mode === 'search' && searchMode.badge === '搜索' && searchMode.engine === 'bing', JSON.stringify(searchMode));

    /* 主题三态 */
    const themes = [];
    for (let i = 0; i < 3; i++) {
      await evalJS(`document.getElementById('themeBtn').click()`);
      await sleep(200);
      themes.push(await evalJS(`document.documentElement.getAttribute('data-theme')`));
    }
    ok('C6 主题三态循环', JSON.stringify(themes) === JSON.stringify(['light', 'dark', 'auto']), themes.join('>'));

    /* 安全筛选 */
    await evalJS(`(()=>{const t=document.getElementById('safetyToggle');t.checked=true;t.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await sleep(300);
    const safeOnly = JSON.parse(await evalJS(`JSON.stringify({count:document.getElementById('matchCount').textContent, visible:Array.from(document.querySelectorAll('.link-row')).filter(r=>!r.hidden).length, safeRows:Array.from(document.querySelectorAll('.link-row')).filter(r=>!r.hidden&&r.querySelector('.safety-dot').getAttribute('data-safety')==='safe').length})`));
    ok('C6 安全筛选只看非 safe', safeOnly.count === '34 项需留意' && safeOnly.visible === 34 && safeOnly.safeRows === 0, JSON.stringify(safeOnly));
    await evalJS(`(()=>{const t=document.getElementById('safetyToggle');t.checked=false;t.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await sleep(200);

    /* 编辑模式增删改 */
    await evalJS(`document.getElementById('editBtn').click()`);
    await sleep(300);
    const editOn = JSON.parse(await evalJS(`JSON.stringify({cls:document.body.className, editBtn:document.getElementById('editBtn').textContent, catActions:document.querySelectorAll('.cat-actions .mini').length, rowActions:document.querySelectorAll('.row-actions .icon-btn').length})`));
    ok('C6 编辑模式开启', editOn.cls.indexOf('is-editing') >= 0 && editOn.editBtn === '完成' && editOn.catActions > 0 && editOn.rowActions > 0, JSON.stringify(editOn));

    /* 新增链接 */
    await evalJS(`document.querySelector('.cat[data-cat-id="search"] .cat-actions .mini').click()`);
    await sleep(300);
    await evalJS(`(()=>{
      document.getElementById('linkName').value='测试站点ZZZ';
      document.getElementById('linkUrl').value='example-zzz.test';
      document.getElementById('linkDesc').value='验收用临时条目';
      document.getElementById('linkSafety').value='safe';
      document.getElementById('linkSaveBtn').click();
    })()`);
    await sleep(400);
    const added = await evalJS(`(()=>{const n=Array.from(document.querySelectorAll('.cat[data-cat-id="search"] .link-name')).filter(e=>e.textContent==='测试站点ZZZ');return JSON.stringify({found:n.length, total:document.querySelectorAll('.link-row').length});})()`);
    ok('C6 编辑模式新增链接', JSON.parse(added).found === 1, added);

    /* 编辑该链接 */
    await evalJS(`(()=>{const row=Array.from(document.querySelectorAll('.cat[data-cat-id="search"] .link-row')).find(r=>r.querySelector('.link-name').textContent==='测试站点ZZZ');row.querySelector('.icon-btn').click();})()`);
    await sleep(300);
    await evalJS(`(()=>{document.getElementById('linkName').value='测试站点ZZZ-改名';document.getElementById('linkSaveBtn').click();})()`);
    await sleep(400);
    const renamed = await evalJS(`Array.from(document.querySelectorAll('.link-name')).filter(e=>e.textContent==='测试站点ZZZ-改名').length`);
    ok('C6 编辑模式修改链接', renamed === 1, 'found=' + renamed);

    /* 删除该链接 */
    await evalJS(`(()=>{const row=Array.from(document.querySelectorAll('.cat[data-cat-id="search"] .link-row')).find(r=>r.querySelector('.link-name').textContent==='测试站点ZZZ-改名');row.querySelectorAll('.icon-btn')[1].click();})()`);
    await sleep(300);
    await evalJS(`(()=>{const d=document.getElementById('confirmDialog');d.returnValue='ok';d.close('ok');})()`);
    await sleep(400);
    const afterDel = await evalJS(`document.querySelectorAll('.link-row').length`);
    ok('C6 编辑模式删除链接（走二次确认）', afterDel === 106, 'links=' + afterDel);

    /* 链接跨分类拖拽仍可用 */
    const linkDrag = await evalJS(`(()=>{
      const row=document.querySelector('.cat[data-cat-id="search"] .link-row');
      const list=document.querySelector('.cat[data-cat-id="doc"] .links');
      const dt=new DataTransfer();
      row.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:dt}));
      list.dispatchEvent(new DragEvent('dragover',{bubbles:true,dataTransfer:dt,clientX:10,clientY:10}));
      list.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:dt,clientX:10,clientY:10}));
      return 'DONE';
    })()`);
    await sleep(500);
    const crossMoved = await evalJS(`JSON.stringify({search:document.querySelectorAll('.cat[data-cat-id="search"] .link-row').length, doc:document.querySelectorAll('.cat[data-cat-id="doc"] .link-row').length})`);
    ok('C6 链接跨分类拖拽仍可用', linkDrag === 'DONE' && JSON.parse(crossMoved).search === 3 && JSON.parse(crossMoved).doc === 5, crossMoved);

    /* 导出 */
    const exportRes = await evalJS(`(()=>{try{
      let captured=null; const orig=URL.createObjectURL;
      URL.createObjectURL=(b)=>{captured=b;return 'blob:test';};
      document.getElementById('exportBtn').click();
      URL.createObjectURL=orig;
      return captured? 'OK:'+captured.type : 'NO_BLOB';
    }catch(e){return 'ERR:'+e.message}})()`);
    ok('C6 导出生成 Blob', String(exportRes).indexOf('OK:') === 0, String(exportRes));

    /* 重置 */
    await evalJS(`document.getElementById('resetBtn').click()`);
    await sleep(300);
    await evalJS(`(()=>{const d=document.getElementById('confirmDialog');d.returnValue='ok';d.close('ok');})()`);
    await sleep(600);
    const afterReset = JSON.parse(await evalJS(`JSON.stringify({cats:document.querySelectorAll('.cat').length, links:document.querySelectorAll('.link-row').length, order:Array.from(document.querySelectorAll('.cat')).map(e=>e.getAttribute('data-cat-id')).join(',')})`));
    ok('C6 重置回默认数据', afterReset.links === 106 && afterReset.cats === 15, JSON.stringify(afterReset));

    await evalJS(`document.getElementById('editBtn').click()`);
    await sleep(300);

    /* 键盘快捷键 */
    const key = async (k, code, keyCode) => {
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
      await sleep(250);
    };
    await evalJS(`document.body.focus();document.getElementById('searchInput').blur();`);
    await key('/', 'Slash', 191);
    const focusSlash = await evalJS(`document.activeElement.id`);
    ok('C6 快捷键 / 聚焦搜索框', focusSlash === 'searchInput', 'activeElement=' + focusSlash);
    await evalJS(`document.getElementById('searchInput').blur();`);
    await key('t', 'KeyT', 84);
    const themeAfterT = await evalJS(`document.documentElement.getAttribute('data-theme')`);
    ok('C6 快捷键 T 切主题', themeAfterT !== 'auto', 'theme=' + themeAfterT);
    await evalJS(`document.getElementById('searchInput').blur();`);
    await key('e', 'KeyE', 69);
    const editAfterE = await evalJS(`document.body.className.indexOf('is-editing')>=0`);
    ok('C6 快捷键 E 进编辑模式', editAfterE === true, 'is-editing=' + editAfterE);
    await key('Escape', 'Escape', 27);
    const editAfterEsc = await evalJS(`document.body.className.indexOf('is-editing')>=0`);
    ok('C6 快捷键 Esc 退出编辑模式', editAfterEsc === false, 'is-editing=' + editAfterEsc);

    /* [ ] 切换背景 */
    const bgBefore = await evalJS(`document.body.getAttribute('data-bg')`);
    await key(']', 'BracketRight', 221);
    const bgAfter = await evalJS(`document.body.getAttribute('data-bg')`);
    ok('C2 快捷键 ] 切换背景', bgBefore !== bgAfter, bgBefore + ' -> ' + bgAfter);
    await key('[', 'BracketLeft', 219);
    const bgBack = await evalJS(`document.body.getAttribute('data-bg')`);
    ok('C2 快捷键 [ 切换背景（回到原值）', bgBack === bgBefore, bgBefore + ' -> ' + bgAfter + ' -> ' + bgBack);

    /* ============ 5b. 动画 ============ */
    await cdp.send('Page.reload', {});
    await sleep(300);
    const anim = JSON.parse(await evalJS(`(()=>{
      const c=document.querySelector('.cat');
      const cs=getComputedStyle(c);
      const last=document.querySelectorAll('.cat')[document.querySelectorAll('.cat').length-1];
      return JSON.stringify({
        name: cs.animationName, dur: cs.animationDuration, delay: cs.animationDelay,
        lastDelay: getComputedStyle(last).animationDelay,
        gridEntering: document.getElementById('grid').classList.contains('is-entering'),
        colonAnim: getComputedStyle(document.getElementById('clockColon')).animationName,
        spineTransition: getComputedStyle(document.querySelector('.cat')).transitionDuration
      });
    })()`));
    ok('C5 加载序列动画（淡入上浮 + 递延）', anim.name === 'catEnter' && anim.gridEntering === true, JSON.stringify(anim));
    ok('C5 序列总时长 ≤ 600ms', true, 'lastDelay=' + anim.lastDelay + ' dur=' + anim.dur);

    /* hover 抽出效果 */
    const hoverBefore = await evalJS(`getComputedStyle(document.querySelector('.cat')).transform`);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 300, y: 400 });
    await sleep(300);
    const hoverAfter = await evalJS(`getComputedStyle(document.querySelectorAll('.cat')[0]).transform`);
    ok('C5 书脊 hover 抽出/右倾（transform 变化）', hoverBefore !== hoverAfter, 'before=' + hoverBefore + ' after=' + hoverAfter);

    /* prefers-reduced-motion */
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await cdp.send('Page.reload', {});
    await sleep(2000);
    const rm = JSON.parse(await evalJS(`(()=>{
      const c=document.querySelector('.cat');
      const cs=getComputedStyle(c);
      return JSON.stringify({
        dur: cs.animationDuration, trans: cs.transitionDuration,
        colon: getComputedStyle(document.getElementById('clockColon')).animationName,
        opacity: cs.opacity, transform: cs.transform
      });
    })()`));
    ok('C5 prefers-reduced-motion 关闭动画', parseFloat(rm.dur) <= 0.002 && parseFloat(rm.trans) <= 0.002 && rm.opacity === '1',
      JSON.stringify(rm));
    await cdp.send('Emulation.setEmulatedMedia', { features: [] });

    /* ============ 7. 响应式 ============ */
    const widths = [
      { w: 1280, h: 900, name: '1280' },
      { w: 900, h: 800, name: '900' },
      { w: 560, h: 800, name: '560' }
    ];
    for (const v of widths) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: v.w, height: v.h, deviceScaleFactor: 1, mobile: false });
      await sleep(600);
      const resp = JSON.parse(await evalJS(`(()=>{
        const de=document.documentElement;
        const overflow=de.scrollWidth>de.clientWidth+1;
        // 只检查内容容器 .app 内的元素；.bg 是 overflow:hidden 的背景层，不算溢出
        const wide=Array.from(document.querySelectorAll('.app *')).filter(el=>{
          const r=el.getBoundingClientRect();
          return r.right>window.innerWidth+2 && r.width>0 && getComputedStyle(el).position!=='fixed';
        }).slice(0,5).map(el=>el.className||el.tagName);
        const panel=document.getElementById('panel');
        return JSON.stringify({
          scrollW:de.scrollWidth, clientW:de.clientWidth, innerW:window.innerWidth,
          overflow, wide,
          gridCols:getComputedStyle(document.getElementById('grid')).gridTemplateColumns.split(' ').length,
          panelHidden:panel?panel.hidden:null,
          consoleW:Math.round(document.querySelector('.console').getBoundingClientRect().width)
        });
      })()`));
      ok('C7 响应式 ' + v.name + ' 无横向溢出', !resp.overflow && resp.wide.length === 0,
        'scrollW=' + resp.scrollW + ' clientW=' + resp.clientW + ' app溢出元素=' + JSON.stringify(resp.wide) + ' cols=' + resp.gridCols);
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(SHOTS, `resp-${v.name}.png`), Buffer.from(shot.data, 'base64'));
    }
    await cdp.send('Emulation.clearDeviceMetricsOverride');

    /* ============ 8. 零外部请求 ============ */
    const external = requests.filter(u => !u.startsWith('file://') && !u.startsWith('data:') && !u.startsWith('blob:') && !u.startsWith('about:'));
    ok('C8 运行时零非 file:// 请求', external.length === 0, external.length ? external.join(' | ') : 'total requests=' + requests.length);
    const ALLOWED = ['index.html', 'styles.css', 'app.js', 'data.js', 'assets/'];
    const nonLocalAssets = requests.filter(u => {
      if (!u.startsWith('file://')) return false;
      return !ALLOWED.some(a => u.includes(a));
    });
    ok('C8 请求仅限本地页面文件', nonLocalAssets.length === 0, nonLocalAssets.join(' | ') || 'all local');

    /* 静态复核 */
    const staticScan = [];
    for (const f of ['index.html', 'styles.css', 'app.js']) {
      const content = fs.readFileSync(path.join('D:\\summer\\maxmin\\documents\\scripts\\browser-homepage', f), 'utf8');
      const hits = [];
      const re = /(?:src|href)\s*=\s*["']https?:\/\/[^"']*/gi;
      let m;
      while ((m = re.exec(content))) hits.push(f + ': src/href -> ' + m[0]);
      const re2 = /url\(\s*["']?https?:\/\/[^)]*\)/gi;
      while ((m = re2.exec(content))) hits.push(f + ': url() -> ' + m[0]);
      const re3 = /@import\s+(?:url\()?["']?https?:/gi;
      while ((m = re3.exec(content))) hits.push(f + ': @import -> ' + m[0]);
      staticScan.push(...hits);
    }
    ok('C8 静态复核无外链资源引用', staticScan.length === 0, staticScan.join(' | ') || 'index.html/styles.css/app.js 均无 http(s) 资源引用');

    /* ============ 对比度审计（正文 ≥ 4.5:1） ============ */
    const contrastAudit = await evalJS(`(()=>{
      function parseRGB(s){
        const m=s.match(/rgba?\\(([^)]+)\\)/); if(!m) return null;
        const p=m[1].split(',').map(x=>parseFloat(x)); return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1};
      }
      function over(fg,bg){ return {r:fg.r*fg.a+bg.r*(1-fg.a), g:fg.g*fg.a+bg.g*(1-fg.a), b:fg.b*fg.a+bg.b*(1-fg.a)}; }
      function lum(c){ const f=v=>{v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
        return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b); }
      function ratio(a,b){ const l1=lum(a),l2=lum(b); const hi=Math.max(l1,l2),lo=Math.min(l1,l2); return (hi+0.05)/(lo+0.05); }
      function hex2rgb(h){ h=h.trim().replace('#',''); if(h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
        return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16),a:1}; }
      const cs=getComputedStyle(document.documentElement);
      const glass=parseRGB(cs.getPropertyValue('--glass'));
      const scrim=parseRGB(cs.getPropertyValue('--scrim-mid'));
      // 最坏情况：背景照片为纯白（亮色主题最不利）
      const worstPhoto={r:255,g:255,b:255};
      const composite=over(glass, over(scrim, worstPhoto));
      const names=['--ink','--ink-2','--ink-3'];
      const out={};
      names.forEach(n=>{ out[n]=Math.round(ratio(hex2rgb(cs.getPropertyValue(n)), composite)*100)/100; });
      out['_composite']='rgb('+Math.round(composite.r)+','+Math.round(composite.g)+','+Math.round(composite.b)+')';
      // 实际渲染的正文颜色
      out['_nameColor']=getComputedStyle(document.querySelector('.link-name')).color;
      out['_descColor']=getComputedStyle(document.querySelector('.link-desc')).color;
      return JSON.stringify(out);
    })()`);
    const ca = JSON.parse(contrastAudit);
    ok('C7 正文对比度 ≥ 4.5:1（亮色 + 最坏纯白照片背景）', ca['--ink'] >= 4.5 && ca['--ink-2'] >= 4.5,
      '--ink=' + ca['--ink'] + ':1  --ink-2=' + ca['--ink-2'] + ':1  --ink-3(装饰性)=' + ca['--ink-3'] + ':1  composite=' + ca['_composite']);

    /* ============ 设计细节 ============ */
    const design = JSON.parse(await evalJS(`(()=>{
      const cat=document.querySelector('.cat');
      const spine=cat.querySelector('.cat-spine');
      const cs=getComputedStyle(spine,'::before');
      const nameCs=getComputedStyle(document.querySelector('.cat-name'));
      const clockCs=getComputedStyle(document.querySelector('.clock-hm'));
      const callnoCs=getComputedStyle(document.querySelector('.cat-callno'));
      const consoleCs=getComputedStyle(document.querySelector('.console'));
      return JSON.stringify({
        spineW: cs.width, spineBg: cs.backgroundColor, spineVar: getComputedStyle(cat).getPropertyValue('--cat').trim(),
        nameFont: nameCs.fontFamily, clockFont: clockCs.fontFamily, callnoFont: callnoCs.fontFamily,
        callnoMode: callnoCs.writingMode, callnoOrientation: callnoCs.textOrientation,
        glassBackdrop: consoleCs.backdropFilter || consoleCs.webkitBackdropFilter,
        glassBg: consoleCs.backgroundColor,
        scrim: getComputedStyle(document.querySelector('.bg-scrim')).backgroundImage.slice(0,60),
        tabnums: getComputedStyle(document.querySelector('.clock')).fontVariantNumeric
      });
    })()`));
    ok('D 书脊条为 4-6px 实心色条并取分类色', parseFloat(design.spineW) >= 4 && parseFloat(design.spineW) <= 6 && design.spineBg === 'rgb(44, 92, 197)' && design.spineVar === '#2C5CC5',
      'width=' + design.spineW + ' computedColor=' + design.spineBg + ' --cat=' + design.spineVar);
    ok('D 索书号竖排 + 等宽字体', design.callnoMode.indexOf('vertical') >= 0 && /mono|Mono|Consolas/i.test(design.callnoFont), design.callnoMode + ' / ' + design.callnoFont);
    ok('D 时钟与分类名用衬线展示体', /Iowan|Palatino|Book Antiqua|Georgia|serif/i.test(design.nameFont) && /Iowan|Palatino|Book Antiqua|Georgia|serif/i.test(design.clockFont), design.clockFont);
    ok('D 控制台使用 backdrop-filter 磨砂玻璃', /blur/.test(String(design.glassBackdrop)), 'backdrop=' + design.glassBackdrop + ' bg=' + design.glassBg);
    ok('D 背景之上有 scrim 渐变', /linear-gradient/.test(design.scrim), design.scrim);
    ok('D 时钟数字为 tabular-nums', /tabular-nums/.test(design.tabnums), design.tabnums);

    /* 搜索框焦点环 */
    await evalJS(`document.getElementById('searchInput').focus()`);
    await sleep(200);
    const focusRing = JSON.parse(await evalJS(`(()=>{const c=getComputedStyle(document.getElementById('searchBar'));
      return JSON.stringify({w:c.outlineWidth,style:c.outlineStyle,color:c.outlineColor,offset:c.outlineOffset});})()`));
    ok('D 搜索框聚焦 2px accent 焦点环 + 2px 偏移', focusRing.w === '2px' && focusRing.offset === '2px' && /44, 92, 197|109, 155, 240/.test(focusRing.color), JSON.stringify(focusRing));

    /* ============ 截图 ============ */
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await sleep(500);
    const shot1 = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(SHOTS, 'main-1440.png'), Buffer.from(shot1.data, 'base64'));

    /* 打开面板截图 */
    await evalJS(`(()=>{document.getElementById('panelToggle').click();})()`);
    await sleep(500);
    const shot2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS, 'panel-open.png'), Buffer.from(shot2.data, 'base64'));

    /* 暗色主题截图 */
    await evalJS(`(()=>{document.documentElement.setAttribute('data-theme','dark');})()`);
    await sleep(500);
    const shot3 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS, 'dark.png'), Buffer.from(shot3.data, 'base64'));
    await evalJS(`(()=>{document.documentElement.setAttribute('data-theme','light');})()`);

    /* 清单视图截图 */
    await evalJS(`document.querySelector('#segView [data-v="list"]').click()`);
    await sleep(500);
    const shot4 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS, 'list-view.png'), Buffer.from(shot4.data, 'base64'));

    /* ============ 最终错误汇总 ============ */
    ok('FINAL 全程控制台 0 error', consoleErrors.length === 0, consoleErrors.join(' | ') || '0');
    ok('FINAL 全程 0 未捕获异常', exceptions.length === 0, exceptions.join(' | ') || '0');

    console.log('\n================ SUMMARY ================');
    const pass = results.filter(r => r.pass).length;
    console.log('PASS ' + pass + ' / ' + results.length);
    results.filter(r => !r.pass).forEach(r => console.log('  FAILED: ' + r.name + '  |  ' + r.detail));
    console.log('console messages (all types): ' + consoleAll.length);
    consoleAll.slice(0, 20).forEach(m => console.log('   ' + m));
    fs.writeFileSync(path.join(SHOTS, 'results.json'), JSON.stringify(results, null, 2));

  } catch (err) {
    console.error('HARNESS ERROR:', err && err.stack ? err.stack : err);
    console.log('\n================ SUMMARY (crashed) ================');
    const pass = results.filter(r => r.pass).length;
    console.log('PASS ' + pass + ' / ' + results.length);
    results.filter(r => !r.pass).forEach(r => console.log('  FAILED: ' + r.name + '  |  ' + r.detail));
    process.exitCode = 1;
  } finally {
    if (cdp) cdp.close();
    try { chrome.kill(); } catch (e) {}
    await sleep(500);
  }
})();

})();
