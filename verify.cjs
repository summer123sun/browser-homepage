/* ===========================================================================
   起始页 · 藏书阁 v4 · 验收脚本 verify.cjs
   ---------------------------------------------------------------------------
   一条命令跑完全部验收：

       node verify.cjs

   做两件事：
     ① 数据核对  —— 解析 data.js，核对 15 分类 / 106 链接 / safety 三态分布
                     (72 safe / 34 caution / 0 pending)，并与改版前逐条比对：
                     名称 + 网址 + safety + note 全等，输出 baseline links lost: NONE
     ② 浏览器实测 —— 用系统 Chrome 的远程调试协议（CDP）打开本目录的 index.html，
                     逐条实测验收标准：控制台零报错、单搜索框（引擎在左）、
                     回车检索 / 网址直开 / ! 强制检索、常用行点击频次排序与钉住、
                     手风琴单开与刷新保持、106 条链接全部可达、安全印鉴计数与
                     note 一致、仅看待核实、编辑增删改、分类拖拽、背景默认关闭与
                     本地图片加载、1280/900/560 零横向溢出、零外部网络请求、
                     prefers-reduced-motion、设计令牌。

   依赖：Node 18+（需内置 WebSocket / fetch）与本机 Chrome。
   无需 npm install，无网络请求。
   =========================================================================== */

'use strict';

/* ======================= ① 数据核对 ======================= */
(function () {
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

/* ---- 改版前全量基线：15 分类 / 106 条，逐条含 safety 与 note ---- */
const BASELINE = {
  search: [
    ['百度','https://www.baidu.com','safe',''],
    ['必应','https://cn.bing.com','safe',''],
    ['Google','https://www.google.cn/','safe',''],
    ['SearXNG','https://searx.be/','safe','']
  ],
  ai: [
    ['DeepSeek','https://chat.deepseek.com','caution','对话与上传文件在中国境内留存；仿冒站逾两千个，认准 chat.deepseek.com'],
    ['Kimi','https://www.kimi.com/','safe',''],
    ['千问','https://www.qianwen.com/','safe',''],
    ['秘塔 AI 搜索','https://metaso.cn/','safe',''],
    ['讯飞星火','https://xinghuo.xfyun.cn/','safe','']
  ],
  research: [
    ['Google 学术','https://scholar.google.com','caution','国内通常不可达，需自备代理'],
    ['arXiv','https://arxiv.org','safe',''],
    ['Semantic Scholar','https://www.semanticscholar.org','safe',''],
    ['Connected Papers','https://www.connectedpapers.com','safe',''],
    ['PubMed','https://pubmed.ncbi.nlm.nih.gov','safe',''],
    ['Crossref','https://search.crossref.org','safe',''],
    ['OpenAlex','https://openalex.org','safe',''],
    ['DOAJ','https://doaj.org','safe',''],
    ['IEEE Xplore','https://ieeexplore.ieee.org','safe',''],
    ['ACM Digital Library','https://dl.acm.org','safe',''],
    ['SSRN','https://www.ssrn.com','safe',''],
    ['Zenodo','https://zenodo.org','safe',''],
    ['SciSpace','https://typeset.io','safe',''],
    ['Elicit','https://elicit.com','safe',''],
    ['Consensus','https://consensus.app','safe',''],
    ['Mathpix','https://mathpix.com','safe',''],
    ['Papers with Code','https://paperswithcode.com','safe',''],
    ['Hugging Face','https://huggingface.co','safe',''],
    ['Perplexity','https://www.perplexity.ai','caution','国内通常不可达，需自备代理'],
    ['NotebookLM','https://notebooklm.google.com','caution','需 Google 账号，国内通常不可达'],
    ['Zotero','https://www.zotero.org','safe',''],
    ['CNKI 中国知网','https://www.cnki.net','safe',''],
    ['万方数据','https://www.wanfangdata.com.cn','safe',''],
    ['维普','https://www.cqvip.com','safe',''],
    ['国家哲学社会科学文献中心','https://www.ncpssd.org','safe',''],
    ['中国科学数据仓库','https://www.csdb.cn','safe','']
  ],
  'ai-global': [
    ['ChatGPT','https://chatgpt.com','caution','国内网络通常不可达，需自备代理；同品牌仿冒域名数以千计，认准 chatgpt.com'],
    ['Claude','https://claude.ai','caution','官方对大陆返回区域不可用，需自备海外网络'],
    ['Gemini','https://gemini.google.com','caution','国内网络通常不可达，需自备代理'],
    ['Google','https://www.google.com','caution','国内通常不可达，可用 www.google.cn 替代'],
    ['Poe','https://poe.com','caution','国内通常不可达，需自备代理'],
    ['OpenAI 官方','https://openai.com','caution','国内通常不可达'],
    ['Anthropic 官方','https://www.anthropic.com','caution','国内通常不可达'],
    ['Google AI Studio','https://aistudio.google.com','caution','需 Google 账号，国内通常不可达'],
    ['Claude Code 文档','https://docs.anthropic.com','caution','国内通常不可达'],
    ['OpenAI Cookbook','https://cookbook.openai.com','caution','国内通常不可达']
  ],
  design: [
    ['Photopea','https://www.photopea.com','safe',''],
    ['Canva','https://www.canva.cn/','safe',''],
    ['TinyPNG','https://tinypng.com','caution','图片上传至 Tinify 服务器，最长保留 48 小时；敏感图片请改用 Photopea'],
    ['Iconify','https://icon-sets.iconify.design/','safe',''],
    ['IconPark','https://iconpark.oceanengine.com/','safe','']
  ],
  wall: [
    ['Unsplash','https://unsplash.com','safe',''],
    ['Pexels','https://www.pexels.com/zh-cn/','caution','站点加载 Hotjar 会话录制与广告追踪脚本'],
    ['Pixabay','https://pixabay.com','caution','许可非纯 CC0，2019 年后含可辨识人物与私有财产的素材不可用'],
    ['Wallpaper Abyss','https://wall.alphacoders.com/','caution','用户上传聚合站，版权归上传者，商用需自行确认授权'],
    ['极简壁纸','https://bz.zzzmh.cn','caution','个人工作室，已停更 400 天且站点未启用 HSTS'],
    ['Simple Desktops','https://simpledesktops.com/','safe','']
  ],
  doc: [
    ['iLovePDF','https://www.ilovepdf.com','caution','文件上传 EEA 服务器，一般 2 小时删除，但电子签名文件依法留存 5 年'],
    ['PDF24 Tools','https://tools.pdf24.org','caution','文件上传服务器约 1 小时删除；只从官网下载，勿运行第三方渠道的 PDF24.exe'],
    ['Stirling PDF','https://www.stirling.com/','safe',''],
    ['ONLYOFFICE','https://www.onlyoffice.com/','safe','']
  ],
  dev: [
    ['GitHub','https://github.com','safe',''],
    ['GitHub Trending','https://github.com/trending?since=daily','safe',''],
    ['Stack Overflow','https://stackoverflow.com','safe',''],
    ['MDN','https://developer.mozilla.org/zh-CN/','safe',''],
    ['Can I use','https://caniuse.com/','safe',''],
    ['Crontab Guru','https://crontab.guru/','safe',''],
    ['Carbon','https://carbon.now.sh/','safe',''],
    ['稀土掘金','https://juejin.cn/','safe','']
  ],
  conv: [
    ['VERT.sh','https://vert.sh/','safe',''],
    ['OnlineConvert','https://www.onlineconvert.com/','caution','视频与文档走云端转换；页面使用 AdSense 跨站 Cookie'],
    ['CloudConvert','https://cloudconvert.com/','caution','文件经第三方服务器处理，涉密文件勿用'],
    ['TinyWow','https://tinywow.com/','caution','文件上传服务器 1 小时删除；广告与追踪脚本密集'],
    ['123Apps','https://www.123apps.com/','caution','广告密集并推销会员，免费档有次数与体积限制']
  ],
  net: [
    ['Cloudflare 测速','https://speed.cloudflare.com/','safe',''],
    ['Speedtest','https://www.speedtest.net/','caution','测速会向 Ookla 暴露公网 IP，广告追踪较强'],
    ['nPerf','https://www.nperf.com/','caution','隐私政策允许将你的 IP 非匿名告知运营商'],
    ['Dotcom-Tools','https://www.dotcom-tools.com/','caution','测试结果链接公开可见，游客结果保留 7 天'],
    ['ITDOG','https://www.itdog.cn/','caution','广告位密集，页面自带「关闭所有广告」开关'],
    ['17CE','https://www.17ce.com/','safe',''],
    ['ping.pe','https://ping.pe/','safe','']
  ],
  safe: [
    ['ImmuniWeb','https://www.immuniweb.com/','safe',''],
    ['Have I Been Pwned','https://haveibeenpwned.com/','safe',''],
    ['Firefox Relay','https://relay.firefox.com/','safe','']
  ],
  note: [
    ['Obsidian','https://obsidian.md/','safe',''],
    ['思源笔记','https://b3log.org/siyuan/','safe',''],
    ['滴答清单','https://dida365.com/','safe',''],
    ['番茄钟','https://www.tomatotimers.com/','safe',''],
    ['Quizlet','https://quizlet.com/','caution','无 SOC 2 等安全认证，2020 年曾泄露约 1 亿账户，免费版广告与追踪较重']
  ],
  tool: [
    ['Excalidraw','https://excalidraw.com/','safe',''],
    ['BoardOS','https://boardos.online/','caution','强制注册，白板内容云端保存'],
    ['WiteBoard','https://witeboard.com/','safe',''],
    ['LiveGap Charts','https://charts.livegap.com/','caution','页面加载 Google Ad Manager 与 Analytics'],
    ['CaseWren','https://casewren.com/','safe',''],
    ['Textbench','https://textbench.app/','safe','']
  ],
  hard: [
    ['BrowserBench','https://browserbench.org/','safe',''],
    ['CamMicGo','https://www.cammicgo.com/','safe',''],
    ['Mictest','https://mictest.co/','caution','叠加多组第三方广告脚本，并反复弹窗推荐浏览器扩展与客户端']
  ],
  read: [
    ['古腾堡计划','https://www.gutenberg.org/','safe',''],
    ['Internet Archive','https://archive.org/','safe',''],
    ['Open Library','https://openlibrary.org/','safe',''],
    ['Libby','https://libbyapp.com/','safe',''],
    ['国家图书馆','https://www.nlc.cn/','caution','检索子站 find.nlc.cn 仅有 http 明文，故收藏主站 https://www.nlc.cn'],
    ['Folo','https://folo.is/','safe',''],
    ['WikiFlix','https://wikiflix.toolforge.org/','safe',''],
    ['咪咕音乐','https://music.migu.cn/','safe',''],
    ['Jamendo','https://www.jamendo.com/','safe','']
  ]
};

let baseCount = 0;
const missing = [];
const changed = [];
Object.keys(BASELINE).forEach(cid => {
  const cat = d.categories.find(c => c.id === cid);
  if (!cat) { missing.push('CATEGORY LOST: ' + cid); return; }
  baseCount += BASELINE[cid].length;
  BASELINE[cid].forEach(([n, u, s, note]) => {
    const l = cat.links.find(x => x.name === n && x.url === u);
    if (!l) { missing.push(cid + '/' + n + ' (' + u + ')'); return; }
    if (l.safety !== s) changed.push(cid + '/' + n + ' safety ' + s + ' -> ' + l.safety);
    const ln = l.note || '';
    if (ln !== note) changed.push(cid + '/' + n + ' note changed: ' + JSON.stringify(note) + ' -> ' + JSON.stringify(ln));
  });
  console.log('  ' + cid.padEnd(12) + 'baseline ' + BASELINE[cid].length + ' / now ' + cat.links.length);
});
console.log('baseline total:', baseCount);
console.log('baseline links lost:', missing.length ? missing : 'NONE');
console.log('baseline safety/note changed:', changed.length ? changed : 'NONE');

/* 多出来的条目（基线之外不应有） */
const extra = [];
Object.keys(BASELINE).forEach(cid => {
  const cat = d.categories.find(c => c.id === cid);
  if (!cat) return;
  const names = new Set(BASELINE[cid].map(b => b[0] + '|' + b[1]));
  cat.links.forEach(l => { if (!names.has(l.name + '|' + l.url)) extra.push(cid + '/' + l.name); });
});
console.log('extra links beyond baseline:', extra.length ? extra : 'NONE');

console.log('category order:', d.categories.map(c => c.id).join(' > '));
console.log('DATA CHECK:', (missing.length === 0 && changed.length === 0 && extra.length === 0
  && d.categories.length === 15 && total === 106
  && bySafety.safe === 72 && bySafety.caution === 34 && bySafety.pending === 0)
  ? 'PASS' : 'FAIL');

})();

/* =================== ② 浏览器端到端实测 =================== */
(function () {
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIR = 'D:/summer/maxmin/documents/scripts/browser-homepage';
const URL_PAGE = 'file:///D:/summer/maxmin/documents/scripts/browser-homepage/index.html';
const SHOTS = 'D:\\summer\\maxmin\\images\\browser-homepage';   // 交付用截图
const TMP = 'D:\\summer\\maxmin\\tmp\\bh-shots';                 // 过程截图

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

async function getWsUrl(port, retries = 80) {
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
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.mkdirSync(TMP, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'bhprof-'));
  const port = 9300 + (process.pid % 300);

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
  const failedRequests = [];

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
        const dd = params.exceptionDetails;
        exceptions.push((dd.exception && (dd.exception.description || dd.exception.value)) || dd.text);
      }
      if (method === 'Network.requestWillBeSent') {
        requests.push(params.request.url);
      }
      if (method === 'Network.loadingFailed') {
        failedRequests.push((params.errorText || 'failed') + ' ' + (params.type || ''));
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
        throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text) + ' :: ' + expr.slice(0, 200));
      }
      return r.result.value;
    };
    const evalJSON = async (expr) => JSON.parse(await evalJS(expr));

    /* 拦截跳转与新窗口：既保留事件冒泡（让页面自己的计数逻辑生效），又不真的打开标签页 */
    const installHooks = async () => {
      await evalJS(`(()=>{
        window.__opened = window.__opened || [];
        window.__nav = window.__nav || [];
        if (!window.__hooked) {
          window.__hooked = true;
          window.open = function (u) { window.__opened.push(String(u)); return null; };
          document.addEventListener('click', function (e) {
            var a = e.target.closest ? e.target.closest('a[target="_blank"]') : null;
            if (a) { window.__nav.push(a.href); e.preventDefault(); }
          }, true);
        }
        return true;
      })()`);
    };

    await cdp.send('Page.navigate', { url: URL_PAGE });
    await sleep(2500);
    await installHooks();

    const reload = async (wait) => {
      await cdp.send('Page.reload', {});
      await sleep(wait || 2200);
      await installHooks();
    };

    const key = async (k, code, keyCode, mods) => {
      const p = { type: 'keyDown', key: k, code: code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
      if (mods) p.modifiers = mods;
      await cdp.send('Input.dispatchKeyEvent', p);
      await cdp.send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, p));
      await sleep(250);
    };

    const shot = async (file, w, h, full) => {
      if (w && h) {
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
        await sleep(700);
      }
      const s = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!full });
      fs.writeFileSync(file, Buffer.from(s.data, 'base64'));
      if (w && h) await cdp.send('Emulation.clearDeviceMetricsOverride');
      await sleep(300);
    };

    /* ============ 1. 无 JS 报错 ============ */
    ok('C1 页面加载无 JS 异常', exceptions.length === 0, exceptions.join(' | ') || '0 exceptions');
    ok('C1 控制台 0 error', consoleErrors.length === 0, consoleErrors.join(' | ') || '0 errors');

    /* ============ 2. 首屏结构：一个搜索框 + 一排常用 + 一排标签 ============ */
    const struct = await evalJSON(`(()=>{
      const bar=document.getElementById('searchBar');
      const appTextInputs=Array.from(document.querySelectorAll('.app input')).filter(i=>i.type==='text'||!i.type);
      return JSON.stringify({
        searchInputs: document.querySelectorAll('#searchInput').length,
        appTextInputs: appTextInputs.length,
        appTextInputIds: appTextInputs.map(i=>i.id),
        barChildren: Array.from(bar.children).map(c=>c.className||c.tagName),
        engineFirst: bar.firstElementChild.classList.contains('engine'),
        engineInBar: !!bar.querySelector('.engine'),
        selectCount: document.querySelectorAll('select').length,
        tiles: document.querySelectorAll('.quick-row .tile').length,
        addTiles: document.querySelectorAll('.quick-row .tile-add').length,
        tabs: document.querySelectorAll('.cat-tab').length,
        openCards: document.querySelectorAll('.cat-open').length,
        expandedTabs: document.querySelectorAll('.cat-tab[aria-expanded="true"]').length,
        meta: document.getElementById('stacksMeta').textContent,
        topbarButtons: document.querySelectorAll('.topbar .icon-btn').length,
        toolbarChips: document.querySelectorAll('.toolbar, .console-bar, .chip-mode, #modeToggle, #matchCount').length,
        brandName: (document.querySelector('.brand-name')||{}).textContent
      });
    })()`);
    ok('D1 全站只有一个搜索框（主视觉区仅 #searchInput 一个文本输入）',
      struct.searchInputs === 1 && struct.appTextInputs === 1 && struct.appTextInputIds[0] === 'searchInput',
      'searchInputs=' + struct.searchInputs + ' appTextInputs=' + JSON.stringify(struct.appTextInputIds));
    ok('D1 搜索框三段同框：引擎下拉在最左 → 输入 → 放大镜',
      struct.engineFirst && struct.engineInBar && struct.barChildren.length === 3,
      'children=' + JSON.stringify(struct.barChildren));
    ok('D1 引擎下拉为自绘（页面内无原生 <select>，全部在弹窗表单中）', struct.selectCount <= 4, 'select 数量=' + struct.selectCount);
    ok('D1 常用行有瓦片 + 末尾固定「＋」', struct.tiles >= 8 && struct.addTiles === 1,
      'tiles=' + struct.tiles + ' addTiles=' + struct.addTiles);
    ok('D1 分类标签行渲染 15 个标签', struct.tabs === 15, 'tabs=' + struct.tabs);
    ok('D1 默认全部折叠（无展开卡片）', struct.openCards === 0 && struct.expandedTabs === 0,
      'openCards=' + struct.openCards + ' expandedTabs=' + struct.expandedTabs);
    ok('D1 统计行显示真实条数', /15 类 · 106 条/.test(struct.meta), struct.meta);
    ok('D1 主视觉区不再有工具条（顶栏仅品牌 + 2 个图标按钮）',
      struct.topbarButtons === 2 && struct.toolbarChips === 0 && struct.brandName === '藏书阁',
      'topbarButtons=' + struct.topbarButtons + ' 旧工具条元素=' + struct.toolbarChips);

    /* ============ 3. 背景默认关闭 ============ */
    const bgDefault = await evalJSON(`(()=>{
      const a=document.getElementById('bgA'), b=document.getElementById('bgB');
      return JSON.stringify({
        bodyBg: document.body.getAttribute('data-bg'),
        aImg: a.style.backgroundImage||'', bImg: b.style.backgroundImage||'',
        scrimOpacity: getComputedStyle(document.querySelector('.bg-scrim')).opacity
      });
    })()`);
    ok('C2 背景默认「无背景」（无图片层、scrim 不参与）',
      bgDefault.bodyBg === 'none' && bgDefault.aImg === '' && bgDefault.bImg === '' && bgDefault.scrimOpacity === '0',
      JSON.stringify(bgDefault));

    /* ============ 4. 引擎下拉 ============ */
    const engineMenuInfo = await evalJSON(`(()=>{
      const m=document.getElementById('engineMenu');
      return JSON.stringify({
        hidden: m.hidden,
        opts: Array.from(m.querySelectorAll('.engine-opt')).map(o=>({id:o.getAttribute('data-engine'),label:o.querySelector('span').textContent,sel:o.getAttribute('aria-selected')})),
        expanded: document.getElementById('engineBtn').getAttribute('aria-expanded'),
        label: document.getElementById('engineLabel').textContent
      });
    })()`);
    ok('D1 引擎下拉 4 个引擎且默认 Google',
      engineMenuInfo.opts.length === 4 && engineMenuInfo.label === 'Google' && engineMenuInfo.hidden === true,
      JSON.stringify(engineMenuInfo.opts.map(o => o.id + (o.sel === 'true' ? '*' : ''))));

    await evalJS(`document.getElementById('engineBtn').click()`);
    await sleep(250);
    const menuOpen = await evalJSON(`JSON.stringify({
      hidden: document.getElementById('engineMenu').hidden,
      expanded: document.getElementById('engineBtn').getAttribute('aria-expanded'),
      focus: document.activeElement.getAttribute('data-engine')
    })`);
    ok('D1 引擎下拉可展开并把焦点交给选项', menuOpen.hidden === false && menuOpen.expanded === 'true' && !!menuOpen.focus,
      JSON.stringify(menuOpen));

    await key('ArrowDown', 'ArrowDown', 40);
    const afterDown = await evalJS(`document.activeElement.getAttribute('data-engine')`);
    await key('Escape', 'Escape', 27);
    await sleep(200);
    const afterEsc = await evalJSON(`JSON.stringify({
      hidden: document.getElementById('engineMenu').hidden,
      expanded: document.getElementById('engineBtn').getAttribute('aria-expanded'),
      focus: document.activeElement.id
    })`);
    ok('D1 引擎下拉键盘可达（↓ 移动 / Esc 关闭并归还焦点）',
      afterDown && afterDown !== 'google' && afterEsc.hidden === true && afterEsc.expanded === 'false' && afterEsc.focus === 'engineBtn',
      'afterArrowDown=' + afterDown + ' ' + JSON.stringify(afterEsc));

    /* 通过菜单选中「百度」 */
    await evalJS(`document.getElementById('engineBtn').click()`);
    await sleep(200);
    await evalJS(`document.querySelector('.engine-opt[data-engine="baidu"]').click()`);
    await sleep(250);
    const enginePicked = await evalJSON(`JSON.stringify({
      label: document.getElementById('engineLabel').textContent,
      stored: localStorage.getItem('xyai.homepage.engine.v1'),
      selected: document.querySelector('.engine-opt[data-engine="baidu"]').getAttribute('aria-selected')
    })`);
    ok('C3 引擎可切换并写入 localStorage',
      enginePicked.label === '百度' && enginePicked.stored === 'baidu' && enginePicked.selected === 'true',
      JSON.stringify(enginePicked));

    /* ============ 5. 搜索：回车走引擎 / 网址直开 / ! 强制检索 ============ */
    const typeInto = async (text) => {
      await evalJS(`(()=>{const i=document.getElementById('searchInput');i.focus();i.value=${JSON.stringify(text)};i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
      await sleep(200);
    };
    const pressEnter = async () => {
      await evalJS(`document.getElementById('searchInput').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}))`);
      await sleep(300);
    };
    const lastOpened = async () => {
      const arr = JSON.parse(await evalJS(`JSON.stringify(window.__opened)`));
      return arr.length ? arr[arr.length - 1] : '';
    };

    await typeInto('量子计算');
    const hintSearch = await evalJS(`document.getElementById('hintLine').textContent`);
    await pressEnter();
    const openedSearch = await lastOpened();
    ok('C3 回车用当前引擎检索', /baidu\.com\/s\?wd=%E9%87%8F%E5%AD%90%E8%AE%A1%E7%AE%97/.test(openedSearch),
      'opened=' + openedSearch + ' hint="' + hintSearch + '"');

    await typeInto('example.com');
    const hintUrl = await evalJS(`document.getElementById('hintLine').textContent`);
    await pressEnter();
    const openedUrl = await lastOpened();
    ok('C3 输入像网址直接打开', openedUrl === 'https://example.com', 'opened=' + openedUrl + ' hint="' + hintUrl + '"');

    await typeInto('!example.com');
    await pressEnter();
    const openedForce = await lastOpened();
    ok('C3 「!」前缀强制检索（即使像网址）', /baidu\.com\/s\?wd=example\.com/.test(openedForce), 'opened=' + openedForce);

    /* 放大镜按钮等价于回车 */
    await typeInto('文件检索');
    await evalJS(`document.getElementById('searchGo').click()`);
    await sleep(300);
    const openedGo = await lastOpened();
    ok('C3 🔍 按钮与回车等价', /baidu\.com\/s\?wd=%E6%96%87%E4%BB%B6%E6%A3%80%E7%B4%A2/.test(openedGo), 'opened=' + openedGo);

    /* 引擎切换后检索确实换引擎 */
    await evalJS(`document.getElementById('engineBtn').click()`);
    await sleep(200);
    await evalJS(`document.querySelector('.engine-opt[data-engine="duckduckgo"]').click()`);
    await sleep(250);
    await typeInto('graph neural network');
    await pressEnter();
    const openedDuck = await lastOpened();
    ok('C3 切换引擎后回车改用新引擎', /duckduckgo\.com\/\?q=graph%20neural%20network/.test(openedDuck), 'opened=' + openedDuck);

    /* 刷新后引擎持久化 */
    await reload(2200);
    const enginePersisted = await evalJSON(`JSON.stringify({
      label: document.getElementById('engineLabel').textContent,
      stored: localStorage.getItem('xyai.homepage.engine.v1')
    })`);
    ok('C3 刷新后引擎保持', enginePersisted.label === 'DuckDuckGo' && enginePersisted.stored === 'duckduckgo',
      JSON.stringify(enginePersisted));

    /* Esc 清空 / 失焦 */
    await typeInto('待清空');
    await evalJS(`document.getElementById('searchInput').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))`);
    await sleep(250);
    const clearedVal = await evalJS(`document.getElementById('searchInput').value`);
    ok('C3 Esc 清空搜索框', clearedVal === '', 'value="' + clearedVal + '"');

    /* / 与 Ctrl+K 聚焦 */
    await evalJS(`document.getElementById('searchInput').blur(); document.body.focus();`);
    await key('/', 'Slash', 191);
    const focusSlash = await evalJS(`document.activeElement.id`);
    ok('C3 快捷键 / 聚焦搜索框', focusSlash === 'searchInput', 'activeElement=' + focusSlash);
    await evalJS(`document.getElementById('searchInput').blur();`);
    await key('k', 'KeyK', 75, 2);
    const focusCtrlK = await evalJS(`document.activeElement.id`);
    ok('C3 快捷键 Ctrl+K 聚焦搜索框', focusCtrlK === 'searchInput', 'activeElement=' + focusCtrlK);
    await evalJS(`document.getElementById('searchInput').blur();`);

    /* 搜索框不再实时过滤下方链接（结构要求：链接靠分类展开浏览） */
    await typeInto('arxiv');
    await sleep(250);
    const noFilter = await evalJSON(`JSON.stringify({
      tabs: document.querySelectorAll('.cat-tab').length,
      openCards: document.querySelectorAll('.cat-open').length,
      modeBadge: document.querySelectorAll('#modeBadge, #modeToggle, #matchCount').length
    })`);
    ok('D1 搜索框不再实时过滤下方链接（无过滤态/状态计数控件）',
      noFilter.tabs === 15 && noFilter.openCards === 0 && noFilter.modeBadge === 0,
      JSON.stringify(noFilter));
    await evalJS(`document.getElementById('searchInput').value='';document.getElementById('searchInput').dispatchEvent(new Event('input',{bubbles:true}));`);

    /* ============ 6. 常用行：点击频次排序 + 钉住 ============ */
    const vm = require('vm');
    const _sb = { window: {} };
    vm.createContext(_sb);
    vm.runInContext(fs.readFileSync(path.join(DIR, 'data.js'), 'utf8'), _sb);
    const EXPECT = _sb.window.DEFAULT_DATA;

    const quickBefore = await evalJSON(`JSON.stringify(Array.from(document.querySelectorAll('.tile-link')).map(a=>a.querySelector('.tile-name').textContent))`);
    ok('C4 常用行初始为种子列表（8 个）+「＋」瓦片',
      quickBefore.length === 8 && quickBefore[0] === 'Google 学术' && quickBefore.indexOf('arXiv') === 1,
      quickBefore.join(' / '));

    const clickTile = async (name) => {
      const r = await evalJS(`(()=>{
        const t=Array.from(document.querySelectorAll('.tile-link')).find(a=>a.querySelector('.tile-name').textContent===${JSON.stringify(name)});
        if(!t) return 'NOT_FOUND';
        t.click();
        return 'OK';
      })()`);
      await sleep(300);
      return r;
    };

    await clickTile('arXiv');
    await clickTile('arXiv');
    const usageState = await evalJSON(`JSON.stringify({
      usage: localStorage.getItem('xyai.homepage.usage.v1'),
      order: Array.from(document.querySelectorAll('.tile-link')).map(a=>a.querySelector('.tile-name').textContent),
      nav: window.__nav.length
    })`);
    const usageObj = JSON.parse(usageState.usage || '{}');
    const arxivKey = 'arXiv|https://arxiv.org';
    ok('C4 点击常用瓦片 → 点击次数 +1 并写入 xyai.homepage.usage.v1',
      usageObj[arxivKey] && usageObj[arxivKey].n === 2 && usageState.nav >= 2,
      'arxiv.n=' + (usageObj[arxivKey] ? usageObj[arxivKey].n : 'none') + ' nav=' + usageState.nav);
    ok('C4 点击过的链接按次数插到常用行最前',
      usageState.order[0] === 'arXiv' && usageState.order.indexOf('arXiv') === 0,
      usageState.order.join(' / '));

    /* 展开分类里的链接行点击也计数 */
    await evalJS(`document.querySelector('.cat-tab[data-cat-id="research"]').click()`);
    await sleep(250);
    await evalJS(`(()=>{const r=document.querySelector('.cat-open .link-row[data-link-id] a[data-usage-key]');if(r)r.click();})()`);
    await sleep(300);
    const usageState2 = await evalJS(`localStorage.getItem('xyai.homepage.usage.v1')`);
    const usageObj2 = JSON.parse(usageState2 || '{}');
    const scholarKey = 'Google 学术|https://scholar.google.com';
    ok('C4 展开分类里的链接行点击同样计数', usageObj2[scholarKey] && usageObj2[scholarKey].n === 1,
      'scholar.n=' + (usageObj2[scholarKey] ? usageObj2[scholarKey].n : 'none'));

    /* 刷新后常用行按次数重排并保持 */
    await reload(2200);
    const quickAfterReload = await evalJSON(`JSON.stringify({
      order: Array.from(document.querySelectorAll('.tile-link')).map(a=>a.querySelector('.tile-name').textContent),
      usage: localStorage.getItem('xyai.homepage.usage.v1')
    })`);
    const usageAfter = JSON.parse(quickAfterReload.usage || '{}');
    ok('C4 刷新后常用行按点击次数重排并保持',
      quickAfterReload.order[0] === 'arXiv' && usageAfter[arxivKey] && usageAfter[arxivKey].n === 2,
      quickAfterReload.order.join(' / '));

    /* 钉住 / 取消钉住 */
    await evalJS(`document.querySelector('.quick-row .tile-add').click()`);
    await sleep(300);
    const pinDialogOpen = await evalJS(`document.getElementById('pinDialog').open`);
    await evalJS(`(()=>{const s=document.getElementById('pinSearch');s.value='Zotero';s.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await sleep(250);
    const pinListInfo = await evalJSON(`JSON.stringify({
      items: Array.from(document.querySelectorAll('.pin-item')).map(i=>i.querySelector('.pin-item-name').textContent)
    })`);
    await evalJS(`document.querySelector('.pin-item').click()`);
    await sleep(300);
    const pinnedState = await evalJSON(`JSON.stringify({
      pins: localStorage.getItem('xyai.homepage.pins.v1'),
      dotOnTile: !!Array.from(document.querySelectorAll('.tile')).find(t=>t.querySelector('.tile-name')&&t.querySelector('.tile-name').textContent==='Zotero'&&t.querySelector('.tile-pin'))
    })`);
    await evalJS(`document.getElementById('pinDialog').close('cancel')`);
    await sleep(250);
    ok('C4 「＋」弹出选择器并列出全部链接（可搜索）',
      pinDialogOpen === true && pinListInfo.items.length === 1 && pinListInfo.items[0] === 'Zotero',
      'dialogOpen=' + pinDialogOpen + ' 匹配=' + JSON.stringify(pinListInfo.items));
    ok('C4 钉住生效并持久化（瓦片出现小墨点）',
      (pinnedState.pins || '').indexOf('Zotero|https://www.zotero.org') >= 0 && pinnedState.dotOnTile === true,
      'pins=' + pinnedState.pins + ' dot=' + pinnedState.dotOnTile);

    await evalJS(`(()=>{const t=Array.from(document.querySelectorAll('.tile')).find(t=>t.querySelector('.tile-name')&&t.querySelector('.tile-name').textContent==='Zotero');if(t)t.querySelector('.tile-x').click();})()`);
    await sleep(300);
    const unpinned = await evalJSON(`JSON.stringify({
      pins: localStorage.getItem('xyai.homepage.pins.v1'),
      dotOnTile: !!Array.from(document.querySelectorAll('.tile')).find(t=>t.querySelector('.tile-name')&&t.querySelector('.tile-name').textContent==='Zotero'&&t.querySelector('.tile-pin'))
    })`);
    ok('C4 取消钉住生效并持久化', (unpinned.pins || '').indexOf('Zotero|') < 0 && unpinned.dotOnTile === false,
      'pins=' + unpinned.pins + ' dot=' + unpinned.dotOnTile);

    await reload(2200);
    const pinPersisted = await evalJSON(`localStorage.getItem('xyai.homepage.pins.v1')`);
    ok('C4 刷新后钉住状态保持', (pinPersisted || '').indexOf('Zotero|') < 0, 'pins=' + pinPersisted);

    /* ============ 7. 手风琴：同时只展开一个 ============ */
    const openOne = async (id) => {
      await evalJS(`(()=>{
        const cur=document.querySelector('.cat-tab[aria-expanded="true"]');
        if(!cur || cur.getAttribute('data-cat-id')!==${JSON.stringify(id)}) {
          document.querySelector('.cat-tab[data-cat-id="${id}"]').click();
        }
      })()`);
      await sleep(250);
      return evalJSON(`JSON.stringify({
        cards: document.querySelectorAll('.cat-open').length,
        openTab: (document.querySelector('.cat-tab[aria-expanded="true"]')||{}).getAttribute ? document.querySelector('.cat-tab[aria-expanded="true"]').getAttribute('data-cat-id') : null,
        expandedTabs: document.querySelectorAll('.cat-tab[aria-expanded="true"]').length,
        rows: document.querySelectorAll('.cat-open .link-row').length,
        head: (document.querySelector('.cat-open-title')||{}).textContent
      })`);
    };

    const a1 = await openOne('research');
    ok('C5 点击分类标签展开该分类（链接数 = 真实条数）',
      a1.cards === 1 && a1.expandedTabs === 1 && a1.openTab === 'research' && a1.rows === 26,
      JSON.stringify(a1));

    const a2 = await openOne('ai');
    ok('C5 同时只展开一个分类（点另一个会收起上一个）',
      a2.cards === 1 && a2.expandedTabs === 1 && a2.openTab === 'ai' && a2.rows === 5,
      JSON.stringify(a2));

    await reload(2200);
    const persistedOpen = await evalJSON(`JSON.stringify({
      openTab: (document.querySelector('.cat-tab[aria-expanded="true"]')||{}).getAttribute ? document.querySelector('.cat-tab[aria-expanded="true"]').getAttribute('data-cat-id') : null,
      cards: document.querySelectorAll('.cat-open').length,
      rows: document.querySelectorAll('.cat-open .link-row').length
    })`);
    ok('C5 展开状态刷新后保持', persistedOpen.openTab === 'ai' && persistedOpen.cards === 1 && persistedOpen.rows === 5,
      JSON.stringify(persistedOpen));

    /* 再点一次已展开的标签 → 收起 */
    await evalJS(`document.querySelector('.cat-tab[data-cat-id="ai"]').click()`);
    await sleep(250);
    const collapsed = await evalJSON(`JSON.stringify({
      cards: document.querySelectorAll('.cat-open').length,
      expandedTabs: document.querySelectorAll('.cat-tab[aria-expanded="true"]').length
    })`);
    ok('C5 再次点击已展开的标签可收起', collapsed.cards === 0 && collapsed.expandedTabs === 0,
      JSON.stringify(collapsed));

    /* ============ 8. 全部 106 条链接逐分类可达 + 安全印鉴计数 ============ */
    const catIds = EXPECT.categories.map(c => c.id);
    const sweep = await evalJSON(`(async()=>{
      const ids=${JSON.stringify(catIds)};
      const sleep=ms=>new Promise(r=>setTimeout(r,ms));
      const out={perCat:{},rows:0,stamps:{safe:0,caution:0,pending:0},tips:[],names:[]};
      for (const id of ids) {
        document.querySelector('.cat-tab[data-cat-id="'+id+'"]').click();
        await sleep(70);
        const card=document.querySelector('.cat-open');
        const rows=card?card.querySelectorAll('.link-row').length:0;
        out.perCat[id]=rows; out.rows+=rows;
        if(card){
          Array.from(card.querySelectorAll('.link-row')).forEach(r=>{
            const name=r.querySelector('.link-name').textContent;
            const st=r.querySelector('.stamp');
            const s=st.getAttribute('data-safety');
            out.stamps[s]=(out.stamps[s]||0)+1;
            out.names.push(name);
            if(s==='caution') out.tips.push(name+'::'+(st.getAttribute('data-tip')||''));
          });
        }
      }
      return JSON.stringify(out);
    })()`);

    let perCatOk = true;
    const perCatDetail = [];
    EXPECT.categories.forEach(c => {
      const got = sweep.perCat[c.id];
      if (got !== c.links.length) { perCatOk = false; perCatDetail.push(c.id + ' 期望 ' + c.links.length + ' 实得 ' + got); }
    });
    ok('C6 全部 106 条链接都能通过展开分类访问到（逐分类核对条数）',
      sweep.rows === 106 && perCatOk, 'rows=' + sweep.rows + ' ' + perCatDetail.join(' | '));

    const expTips = [];
    EXPECT.categories.forEach(c => c.links.forEach(l => {
      if (l.safety === 'caution') expTips.push(l.name + '::' + (l.note || ''));
    }));
    const tipsSorted = sweep.tips.slice().sort();
    const expTipsSorted = expTips.slice().sort();
    ok('C7 安全印鉴数量 = 72 safe / 34 caution / 0 pending',
      sweep.stamps.safe === 72 && sweep.stamps.caution === 34 && (sweep.stamps.pending || 0) === 0,
      JSON.stringify(sweep.stamps));
    ok('C7 caution 的 note 文本与 data.js 完全一致',
      tipsSorted.length === expTipsSorted.length && tipsSorted.every((t, i) => t === expTipsSorted[i]),
      tipsSorted.length === expTipsSorted.length
        ? (tipsSorted.every((t, i) => t === expTipsSorted[i]) ? '34 条全等' : '不匹配')
        : ('数量不符 ' + tipsSorted.length + ' vs ' + expTipsSorted.length));

    /* ============ 9. 「仅看待核实」开关（过滤分类里的链接，不是搜索框） ============ */
    await evalJS(`document.querySelector('.cat-tab[data-cat-id="research"]').click()`);
    await sleep(250);
    const safeOn = await evalJSON(`(()=>{
      const t=document.getElementById('safetyToggle');
      t.checked=true; t.dispatchEvent(new Event('change',{bubbles:true}));
      const rows=Array.from(document.querySelectorAll('.cat-open .link-row'));
      const vis=rows.filter(r=>!r.hidden);
      return JSON.stringify({
        visible: vis.length,
        safeVisible: vis.filter(r=>r.querySelector('.stamp').getAttribute('data-safety')==='safe').length,
        total: rows.length,
        head: document.querySelector('.cat-open-count').textContent,
        meta: document.getElementById('stacksMeta').textContent
      });
    })()`);
    ok('C6 「仅看待核实」只留非 safe 链接（26 条里剩 3 条 caution）',
      safeOn.visible === 3 && safeOn.safeVisible === 0 && safeOn.total === 26,
      JSON.stringify(safeOn));
    await evalJS(`(()=>{const t=document.getElementById('safetyToggle');t.checked=false;t.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await sleep(250);
    const safeOff = await evalJSON(`document.querySelectorAll('.cat-open .link-row:not([hidden])').length`);
    ok('C6 关闭后恢复全部链接', safeOff === 26, 'visible=' + safeOff);

    /* ============ 10. 编辑模式：分类与链接的增删改 + 分类拖拽 ============ */
    await evalJS(`(()=>{const t=document.getElementById('editToggle');t.checked=true;t.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await sleep(350);
    const editOn = await evalJSON(`JSON.stringify({
      editing: document.body.classList.contains('is-editing'),
      grips: document.querySelectorAll('.cat-tab .cat-grip').length,
      headEdit: document.querySelectorAll('.cat-open-edit .mini').length,
      rowBtns: document.querySelectorAll('.cat-open .row-btn').length
    })`);
    ok('C6 编辑模式开启（拖拽手柄 / 卡片编辑入口 / 行内按钮就位）',
      editOn.editing === true && editOn.grips === 15 && editOn.headEdit === 3 && editOn.rowBtns > 0,
      JSON.stringify(editOn));

    /* 新增链接 */
    await evalJS(`document.querySelector('.cat-open-edit .mini').click()`);
    await sleep(300);
    await evalJS(`(()=>{
      document.getElementById('linkName').value='验收临时站点';
      document.getElementById('linkUrl').value='verify-temp.test';
      document.getElementById('linkDesc').value='验收用临时条目';
      document.getElementById('linkSafety').value='safe';
      document.getElementById('linkSaveBtn').click();
    })()`);
    await sleep(450);
    const added = await evalJSON(`document.querySelectorAll('.cat-open .link-row').length`);
    ok('C6 编辑模式新增链接', added === 27, 'rows=' + added);

    /* 安全底线：自建链接一律 pending —— 即使 UI 上把下拉框设成 safe 也不能生效 */
    const addedSafety = await evalJSON(`(()=>{
      const r=Array.from(document.querySelectorAll('.cat-open .link-row')).find(r=>r.querySelector('.link-name').textContent==='验收临时站点');
      const s=r?r.querySelector('.stamp'):null;
      return JSON.stringify(s? (s.getAttribute('data-safety')||'none') : 'no-row');
    })()`);
    ok('C6 自建链接一律为「未核实」pending（编辑模式路径同样不可标 safe）',
      addedSafety === 'pending', 'safety=' + addedSafety);

    /* 新增模式下安全状态下拉框必须被锁定（不给可点的「安全」选项） */
    await evalJS(`document.querySelector('.cat-open-edit .mini').click()`);
    await sleep(300);
    const sl = await evalJSON(`JSON.stringify({
      disabled: document.getElementById('linkSafety').disabled,
      value: document.getElementById('linkSafety').value
    })`);
    ok('C6 新增链接时安全状态选择器被锁定为 pending',
      sl.disabled === true && sl.value === 'pending', JSON.stringify(sl));
    await evalJS(`(()=>{const d=document.getElementById('linkDialog');d.returnValue='cancel';d.close('cancel');})()`);
    await sleep(250);

    /* 编辑该链接 */
    await evalJS(`(()=>{const r=Array.from(document.querySelectorAll('.cat-open .link-row')).find(r=>r.querySelector('.link-name').textContent==='验收临时站点');r.querySelectorAll('.row-btn')[0].click();})()`);
    await sleep(300);
    await evalJS(`(()=>{document.getElementById('linkName').value='验收临时站点-改名';document.getElementById('linkSaveBtn').click();})()`);
    await sleep(450);
    const renamed = await evalJSON(`Array.from(document.querySelectorAll('.link-name')).filter(e=>e.textContent==='验收临时站点-改名').length`);
    ok('C6 编辑模式修改链接', renamed === 1, 'found=' + renamed);

    /* 删除该链接 */
    await evalJS(`(()=>{const r=Array.from(document.querySelectorAll('.cat-open .link-row')).find(r=>r.querySelector('.link-name').textContent==='验收临时站点-改名');r.querySelectorAll('.row-btn')[1].click();})()`);
    await sleep(300);
    await evalJS(`(()=>{const d=document.getElementById('confirmDialog');d.returnValue='ok';d.close('ok');})()`);
    await sleep(450);
    const afterDel = await evalJSON(`document.querySelectorAll('.cat-open .link-row').length`);
    ok('C6 编辑模式删除链接（走二次确认）', afterDel === 26, 'rows=' + afterDel);

    /* 新增分类 */
    await evalJS(`document.getElementById('addCatBtn').click()`);
    await sleep(300);
    await evalJS(`(()=>{document.getElementById('catName').value='验收临时分类';document.getElementById('catSaveBtn').click();})()`);
    await sleep(450);
    const catAdded = await evalJSON(`document.querySelectorAll('.cat-tab').length`);
    ok('C6 编辑模式新增分类', catAdded === 16, 'tabs=' + catAdded);

    /* 重命名分类 */
    await evalJS(`(()=>{
      const t=Array.from(document.querySelectorAll('.cat-tab')).find(t=>t.querySelector('.cat-tab-name').textContent==='验收临时分类');
      t.click();
    })()`);
    await sleep(300);
    await evalJS(`(()=>{const b=Array.from(document.querySelectorAll('.cat-open-edit .mini')).find(b=>b.textContent==='改名');b.click();})()`);
    await sleep(300);
    await evalJS(`(()=>{document.getElementById('catName').value='验收临时分类2';document.getElementById('catSaveBtn').click();})()`);
    await sleep(450);
    const catRenamed = await evalJSON(`Array.from(document.querySelectorAll('.cat-tab-name')).filter(e=>e.textContent==='验收临时分类2').length`);
    ok('C6 编辑模式重命名分类', catRenamed === 1, 'found=' + catRenamed);

    /* 删除分类 */
    await evalJS(`(()=>{const b=Array.from(document.querySelectorAll('.cat-open-edit .mini')).find(b=>b.textContent==='删除');b.click();})()`);
    await sleep(300);
    await evalJS(`(()=>{const d=document.getElementById('confirmDialog');d.returnValue='ok';d.close('ok');})()`);
    await sleep(450);
    const catDeleted = await evalJSON(`document.querySelectorAll('.cat-tab').length`);
    ok('C6 编辑模式删除分类', catDeleted === 15, 'tabs=' + catDeleted);

    /* 分类拖拽排序（整本拖动） */
    const orderBefore = await evalJS(`Array.from(document.querySelectorAll('.cat-tab')).map(e=>e.getAttribute('data-cat-id')).join(',')`);
    const dragRes = await evalJS(`(()=>{
      const grip=document.querySelector('.cat-tab[data-cat-id="search"] .cat-grip');
      const target=document.querySelector('.cat-tab[data-cat-id="read"]');
      if(!grip||!target) return 'NO_GRIP';
      const dt=new DataTransfer();
      const r=target.getBoundingClientRect();
      const x=r.left+2, y=r.top+r.height/2;
      grip.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:dt}));
      target.dispatchEvent(new DragEvent('dragover',{bubbles:true,dataTransfer:dt,clientX:x,clientY:y}));
      target.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:dt,clientX:x,clientY:y}));
      grip.dispatchEvent(new DragEvent('dragend',{bubbles:true,dataTransfer:dt}));
      return 'DONE';
    })()`);
    await sleep(500);
    const orderAfter = await evalJS(`Array.from(document.querySelectorAll('.cat-tab')).map(e=>e.getAttribute('data-cat-id')).join(',')`);
    ok('C6 拖拽整本改变分类顺序', dragRes === 'DONE' && orderBefore !== orderAfter, orderBefore + '  ->  ' + orderAfter);

    /* 退出编辑模式 + 恢复默认数据（把顺序还原，供后续截图使用） */
    await evalJS(`(()=>{const t=document.getElementById('editToggle');t.checked=false;t.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await sleep(300);
    await evalJS(`document.getElementById('resetBtn').click()`);
    await sleep(300);
    await evalJS(`(()=>{const d=document.getElementById('confirmDialog');d.returnValue='ok';d.close('ok');})()`);
    await sleep(700);
    const afterReset = await evalJSON(`JSON.stringify({
      tabs: document.querySelectorAll('.cat-tab').length,
      order: Array.from(document.querySelectorAll('.cat-tab')).map(e=>e.getAttribute('data-cat-id')).join(',')
    })`);
    ok('C6 重置回内置默认数据（15 分类 / 106 链接 / 原顺序）',
      afterReset.tabs === 15 && afterReset.order === EXPECT.categories.map(c => c.id).join(','),
      afterReset.order);

    /* ============ 11. 背景：默认关闭 + 5 张本地图 + 交叉淡入 + 亮度/模糊 ============ */
    /* 背景图按需加载：默认「无背景」时整页不应请求任何 assets/bg-*.jpg（约 1.1MB），
       5 张缩略图只在用户打开设置面板时才补载。 */
    await evalJS(`(()=>{try{
      var ui=JSON.parse(localStorage.getItem('xyai.homepage.ui.v1')||'{}');
      ui.bg='none'; ui.bright=1; ui.blur=0; ui.panelOpen=false;
      localStorage.setItem('xyai.homepage.ui.v1', JSON.stringify(ui));
    }catch(e){}})()`);
    const bgReqMark = requests.length;
    await reload(2200);
    const bgReqsOnNone = requests.slice(bgReqMark).filter(u => /assets\/bg-/.test(u));
    ok('C2 默认「无背景」时零背景图请求（不白下载 1.1MB 图片）', bgReqsOnNone.length === 0,
      bgReqsOnNone.length ? bgReqsOnNone.join(' | ') : '0 个背景图请求');

    await evalJS(`document.getElementById('settingsBtn').click()`);
    await sleep(300);
    const chips = JSON.parse(await evalJS(`JSON.stringify(Array.from(document.querySelectorAll('.bg-chip')).map(c=>({id:c.getAttribute('data-bg-id'),label:c.getAttribute('data-label'),checked:c.getAttribute('aria-checked')})))`));
    ok('C2 背景芯片共 6 个（无背景 + 5 张图），默认选中「无背景」',
      chips.length === 6 && chips[0].id === 'none' && chips[0].checked === 'true',
      chips.map(c => c.id).join(','));

    const bgResults = [];
    for (const id of ['aurora', 'stacks', 'dune', 'rain', 'nebula', 'none']) {
      await evalJS(`document.querySelector('.bg-chip[data-bg-id="${id}"]').click()`);
      await sleep(1500);
      const st = JSON.parse(await evalJS(`(()=>{
        const slots=[document.getElementById('bgA'),document.getElementById('bgB')];
        const on=slots.filter(s=>s.classList.contains('is-on'));
        return JSON.stringify({
          active: on.length,
          img: on[0] ? (on[0].style.backgroundImage||'') : '',
          op: on[0] ? getComputedStyle(on[0]).opacity : '',
          bodyAttr: document.body.getAttribute('data-bg'),
          checked: document.querySelector('.bg-chip[data-bg-id="${id}"]').getAttribute('aria-checked'),
          scrim: getComputedStyle(document.querySelector('.bg-scrim')).opacity
        });
      })()`));
      const expectOk = id !== 'none'
        ? (st.img.indexOf('assets/bg-' + id) >= 0 && st.img.indexOf('linear-gradient') >= 0 && st.scrim !== '0')
        : (st.img === '' && st.scrim === '0');
      bgResults.push(id + ':' + (expectOk ? 'OK' : 'FAIL'));
      ok('C2 背景 ' + id + ' 生效' + (id === 'none' ? '（无背景 = 无图片层）' : '（本地图片 + 渐变兜底 + scrim）'),
        expectOk && st.op === '1' && st.bodyAttr === id && st.checked === 'true',
        'opacity=' + st.op + ' bodyAttr=' + st.bodyAttr + ' checked=' + st.checked + ' scrim=' + st.scrim);
    }
    ok('C2 5 张背景图切换全部正常', bgResults.every(x => x.endsWith('OK')), bgResults.join(' '));

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
    ok('C2 assets/ 下 5 张背景图均可被浏览器解码加载（无 404）', allLoaded, JSON.stringify(imgObj));

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

    const sliderState = JSON.parse(await evalJS(`(()=>{
      const r=document.getElementById('brightRange');r.value='0.55';r.dispatchEvent(new Event('input',{bubbles:true}));
      const u=document.getElementById('blurRange');u.value='12';u.dispatchEvent(new Event('input',{bubbles:true}));
      const slots=[document.getElementById('bgA'),document.getElementById('bgB')];
      const on=slots.filter(s=>s.classList.contains('is-on'))[0];
      return JSON.stringify({
        brightVar: getComputedStyle(document.documentElement).getPropertyValue('--bg-bright').trim(),
        blurVar: getComputedStyle(document.documentElement).getPropertyValue('--bg-blur').trim(),
        slotFilter: getComputedStyle(on).filter || '',
        brightOut: document.getElementById('brightOut').textContent,
        blurOut: document.getElementById('blurOut').textContent
      });
    })()`));
    ok('C3 亮度滑杆生效', sliderState.brightVar === '0.55' && /brightness\(0\.55\)/.test(sliderState.slotFilter),
      'var=' + sliderState.brightVar + ' filter=' + sliderState.slotFilter);
    ok('C3 模糊滑杆生效', sliderState.blurVar === '12px' && /blur\(12px\)/.test(sliderState.slotFilter),
      'var=' + sliderState.blurVar + ' filter=' + sliderState.slotFilter);

    /* 切回无背景并收面板 */
    await evalJS(`document.querySelector('.bg-chip[data-bg-id="none"]').click()`);
    await sleep(900);
    await evalJS(`document.getElementById('settingsBtn').click()`);
    await sleep(300);

    /* ============ 12. 响应式：1280 / 900 / 560 零横向溢出 ============ */
    const widths = [
      { w: 1280, h: 800, name: '1280' },
      { w: 900, h: 800, name: '900' },
      { w: 560, h: 800, name: '560' }
    ];
    for (const v of widths) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: v.w, height: v.h, deviceScaleFactor: 1, mobile: false });
      await sleep(700);
      const resp = await evalJSON(`(()=>{
        const de=document.documentElement;
        const overflow=de.scrollWidth>de.clientWidth;
        // 横向滚动容器（.quick-row）内部的子元素允许超出视口，不算整页溢出
        const inScroller=(el)=>{
          let p=el.parentElement;
          while(p && p!==document.body){
            const ox=getComputedStyle(p).overflowX;
            if(ox==='auto'||ox==='scroll') return true;
            p=p.parentElement;
          }
          return false;
        };
        const wide=Array.from(document.querySelectorAll('.app *')).filter(el=>{
          const r=el.getBoundingClientRect();
          return r.right>window.innerWidth+2 && r.width>0 && getComputedStyle(el).position!=='fixed' && !inScroller(el);
        }).slice(0,5).map(el=>el.className||el.tagName);
        const qr=document.querySelector('.quick-row');
        const qcs=getComputedStyle(qr);
        const ct=document.querySelector('.cat-tabs');
        const ctcs=getComputedStyle(ct);
        return JSON.stringify({
          scrollW:de.scrollWidth, clientW:de.clientWidth, innerW:window.innerWidth,
          overflow, wide,
          quickOverflowX:qcs.overflowX,
          quickScrollable: qr.scrollWidth>qr.clientWidth,
          tabs:document.querySelectorAll('.cat-tab').length,
          tabRows: (function(){
            var tops={};
            Array.from(document.querySelectorAll('.cat-tab')).forEach(function(t){ tops[Math.round(t.getBoundingClientRect().top)]=1; });
            return Object.keys(tops).length;
          })(),
          catOverflowX: ctcs.overflowX,
          searchWrap:getComputedStyle(document.getElementById('searchBar')).flexWrap
        });
      })()`);
      ok('C7 响应式 ' + v.name + ' 零横向溢出（scrollWidth <= clientWidth）',
        !resp.overflow && resp.wide.length === 0 && resp.scrollW <= resp.clientW,
        'scrollW=' + resp.scrollW + ' clientW=' + resp.clientW + ' 溢出元素=' + JSON.stringify(resp.wide));
      if (v.w === 560) {
        ok('C7 移动端常用行自身横向滚动，整页不产生横向滚动条',
          resp.quickOverflowX === 'auto' && !resp.overflow,
          'quickOverflowX=' + resp.quickOverflowX + ' scrollable=' + resp.quickScrollable);
        ok('C7 移动端搜索框竖排（引擎整行在上）', resp.searchWrap === 'wrap', 'flexWrap=' + resp.searchWrap);
        ok('C7 移动端分类标签单行横向滚动（不换行成标签墙）',
          resp.catOverflowX === 'auto' && resp.tabRows === 1,
          'catOverflowX=' + resp.catOverflowX + ' 标签行数=' + resp.tabRows);
      }
      const s = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(TMP, 'resp-' + v.name + '.png'), Buffer.from(s.data, 'base64'));
    }
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await sleep(400);

    /* ============ 13. 零外部网络请求 ============ */
    const external = requests.filter(u => !u.startsWith('file://') && !u.startsWith('data:') && !u.startsWith('blob:') && !u.startsWith('about:'));
    ok('C8 运行时零非本地请求（无任何第三方域）', external.length === 0,
      external.length ? external.join(' | ') : 'total requests=' + requests.length);
    const ALLOWED = ['index.html', 'styles.css', 'app.js', 'data.js', 'assets/'];
    const nonLocalAssets = requests.filter(u => u.startsWith('file://') && !ALLOWED.some(a => u.includes(a)));
    ok('C8 请求仅限本地页面文件（index/styles/app/data/assets）', nonLocalAssets.length === 0,
      nonLocalAssets.join(' | ') || 'all local');
    const realFails = failedRequests.filter(f => !/ERR_ABORTED/.test(f));
    ok('C8 本地资源无加载失败（无 404）', realFails.length === 0, realFails.join(' | ') || '0 failures');

    const staticScan = [];
    for (const f of ['index.html', 'styles.css', 'app.js']) {
      const content = fs.readFileSync(path.join(DIR, f), 'utf8');
      const hits = [];
      let m;
      const re = /(?:src|href)\s*=\s*["']https?:\/\/[^"']*/gi;
      while ((m = re.exec(content))) hits.push(f + ': src/href -> ' + m[0]);
      const re2 = /url\(\s*["']?https?:\/\/[^)]*\)/gi;
      while ((m = re2.exec(content))) hits.push(f + ': url() -> ' + m[0]);
      const re3 = /@import\s+(?:url\()?["']?https?:/gi;
      while ((m = re3.exec(content))) hits.push(f + ': @import -> ' + m[0]);
      const re4 = /@font-face/gi;
      while ((m = re4.exec(content))) hits.push(f + ': @font-face');
      staticScan.push(...hits);
    }
    ok('C8 静态复核无外链资源引用 / 无 @font-face', staticScan.length === 0,
      staticScan.join(' | ') || 'index.html / styles.css / app.js 均无外部资源引用');

    /* ============ 14. prefers-reduced-motion ============ */
    await evalJS(`document.querySelector('.cat-tab[data-cat-id="research"]').click()`);
    await sleep(250);
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await reload(2200);
    const rm = await evalJSON(`(()=>{
      const card=document.querySelector('.cat-open');
      const cs=card?getComputedStyle(card):null;
      const sb=getComputedStyle(document.getElementById('searchBar'));
      return JSON.stringify({
        animName: cs?cs.animationName:null,
        animDur: cs?cs.animationDuration:null,
        transDur: sb.transitionDuration,
        tabTrans: getComputedStyle(document.querySelector('.cat-tab')).transitionDuration
      });
    })()`);
    ok('C5 prefers-reduced-motion: reduce 下动画与过渡被禁用',
      rm.animName === 'none' && parseFloat(rm.transDur) <= 0.002 && parseFloat(rm.tabTrans) <= 0.002,
      JSON.stringify(rm));
    await cdp.send('Emulation.setEmulatedMedia', { features: [] });
    await reload(2200);

    /* ============ 15. 设计令牌与视觉规范 ============ */
    await evalJS(`(()=>{
      const cur=document.querySelector('.cat-tab[aria-expanded="true"]');
      if(!cur || cur.getAttribute('data-cat-id')!=='research') {
        document.querySelector('.cat-tab[data-cat-id="research"]').click();
      }
    })()`);
    await sleep(400);
    const design = await evalJSON(`(()=>{
      const cs=getComputedStyle(document.documentElement);
      const sb=getComputedStyle(document.getElementById('searchBar'));
      const bodyCs=getComputedStyle(document.body);
      const stamp=document.querySelector('.stamp');
      const scs=stamp?getComputedStyle(stamp):null;
      const caution=document.querySelector('.stamp[data-safety="caution"]');
      const ccs=caution?getComputedStyle(caution):null;
      const mono=getComputedStyle(document.querySelector('.stacks-meta-text'));
      const clock=getComputedStyle(document.querySelector('.clock-hm'));
      const card=getComputedStyle(document.querySelector('.cat-open'));
      const panel=getComputedStyle(document.getElementById('settings'));
      return JSON.stringify({
        paper: cs.getPropertyValue('--paper').trim(),
        surface: cs.getPropertyValue('--surface').trim(),
        rule: cs.getPropertyValue('--rule').trim(),
        ink: cs.getPropertyValue('--ink').trim(),
        ink2: cs.getPropertyValue('--ink-2').trim(),
        ink3: cs.getPropertyValue('--ink-3').trim(),
        accent: cs.getPropertyValue('--accent').trim(),
        caution: cs.getPropertyValue('--caution').trim(),
        sbBorder: sb.borderTopWidth,
        sbBorderColor: sb.borderTopColor,
        sbBackdrop: sb.backdropFilter || sb.webkitBackdropFilter || 'none',
        sbShadow: sb.boxShadow,
        cardShadow: card.boxShadow,
        panelShadow: panel.boxShadow,
        panelBackdrop: panel.backdropFilter || panel.webkitBackdropFilter || 'none',
        bodyBgImage: bodyCs.backgroundImage,
        bodyFont: bodyCs.fontFamily,
        stampW: scs?scs.width:null, stampH: scs?scs.height:null,
        stampRadius: scs?scs.borderTopLeftRadius:null,
        stampBorderColor: scs?scs.borderTopColor:null,
        cautionTransform: ccs?ccs.transform:null,
        cautionBorder: ccs?ccs.borderTopWidth:null,
        monoFont: mono.fontFamily,
        monoSize: mono.fontSize,
        monoTransform: mono.textTransform,
        monoSpacing: mono.letterSpacing,
        clockWeight: clock.fontWeight,
        clockNums: clock.fontVariantNumeric,
        clockSpacing: clock.letterSpacing
      });
    })()`);
    ok('D2 色板为中性极简（纯白纸面 + 唯一蓝色强调 + 琥珀棕 caution）',
      design.paper === '#FFFFFF' && design.accent === '#2C5CC5' && design.ink === '#15171A'
      && design.caution === '#B4530B' && design.rule === '#E4E3DE',
      'paper=' + design.paper + ' accent=' + design.accent + ' ink=' + design.ink + ' caution=' + design.caution);
    ok('D2 搜索框 2px hairline 描边', design.sbBorder === '2px', 'border=' + design.sbBorder + ' ' + design.sbBorderColor);
    ok('D2 无毛玻璃 / 无渐变 / 主卡片无阴影',
      design.sbBackdrop === 'none' && design.panelBackdrop === 'none'
      && design.bodyBgImage === 'none' && (design.cardShadow === 'none' || design.cardShadow === ''),
      'searchBackdrop=' + design.sbBackdrop + ' panelBackdrop=' + design.panelBackdrop
      + ' bodyBgImage=' + design.bodyBgImage + ' cardShadow=' + design.cardShadow);
    ok('D2 安全印鉴是方形印章（safe 方块 / caution 带旋转）',
      design.stampW === design.stampH && parseFloat(design.stampRadius) <= 3
      && design.cautionTransform !== 'none' && design.cautionBorder === '2px',
      'stamp=' + design.stampW + 'x' + design.stampH + ' r=' + design.stampRadius
      + ' cautionTransform=' + design.cautionTransform + ' cautionBorder=' + design.cautionBorder);
    ok('D2 小标签用等宽字体 + 11px + 大写 + 字距 .08em',
      /ui-monospace|Menlo|Consolas|monospace/i.test(design.monoFont)
      && parseFloat(design.monoSize) === 11 && design.monoTransform === 'uppercase'
      && Math.abs(parseFloat(design.monoSpacing) - 0.88) < 0.25,
      design.monoFont + ' / ' + design.monoSize + ' / ' + design.monoTransform + ' / ' + design.monoSpacing);
    ok('D2 时钟 700+ 粗度 + tabular-nums + 收紧字距',
      parseInt(design.clockWeight, 10) >= 700 && /tabular-nums/.test(design.clockNums)
      && parseFloat(design.clockSpacing) < 0,
      'weight=' + design.clockWeight + ' nums=' + design.clockNums + ' spacing=' + design.clockSpacing);
    ok('D2 全站无衬线族（未引入衬线/外部字体）',
      !/serif|Georgia|Palatino|Iowan|Times|Book Antiqua/i.test(design.bodyFont.replace(/sans-serif/gi, ''))
      && /PingFang SC|Microsoft YaHei|Segoe UI/i.test(design.bodyFont),
      design.bodyFont);

    /* 对比度（对纯白纸面） */
    const contrast = await evalJSON(`(()=>{
      function lum(hex){ hex=hex.trim().replace('#',''); if(hex.length===3) hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        const v=hex.match(/../g).map(h=>{const c=parseInt(h,16)/255; return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);});
        return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2]; }
      function ratio(a,b){ const l1=lum(a),l2=lum(b); const hi=Math.max(l1,l2),lo=Math.min(l1,l2); return (hi+0.05)/(lo+0.05); }
      const cs=getComputedStyle(document.documentElement);
      const paper=cs.getPropertyValue('--paper');
      const out={};
      ['--ink','--ink-2','--ink-3'].forEach(n=>{ out[n]=Math.round(ratio(cs.getPropertyValue(n),paper)*100)/100; });
      return JSON.stringify(out);
    })()`);
    const ca = contrast;
    ok('D2 正文对比度 ≥ 4.5:1（纯白纸面）',
      ca['--ink'] >= 4.5 && ca['--ink-2'] >= 4.5,
      '--ink=' + ca['--ink'] + ':1  --ink-2=' + ca['--ink-2'] + ':1  --ink-3(装饰性)=' + ca['--ink-3'] + ':1');

    /* ============ 15.5 旧版 localStorage 升级兼容 ============ */
    /* 老用户浏览器里存的是旧版 prefs：{bg,bright,blur,cols,density,view,wide,panelOpen,collapsed}
       新版只认 {bg,bright,blur,cols,density,wide,panelOpen,openCat}，
       view / collapsed 属已移除概念，必须被安全忽略而不能报错或让页面半残。 */
    await evalJS(`(()=>{
      localStorage.setItem('xyai.homepage.ui.v1', JSON.stringify({
        bg:'aurora', bright:0.8, blur:6, cols:2, density:'compact',
        view:'shelf', wide:true, panelOpen:false, collapsed:{research:true}
      }));
      localStorage.removeItem('xyai.homepage.usage.v1');
      localStorage.removeItem('xyai.homepage.pins.v1');
    })()`);
    await reload(2400);
    const legacy = await evalJSON(`(()=>{
      const b=document.body, p=document.querySelector('.cat-panel')||document.querySelector('.cat-tabs');
      return JSON.stringify({
        tabs: document.querySelectorAll('.cat-tab').length,
        tiles: document.querySelectorAll('.tile-link').length,
        searchInputs: document.querySelectorAll('#searchInput').length,
        openCards: document.querySelectorAll('.cat-open').length,
        bg: b.getAttribute('data-bg'),
        density: b.getAttribute('data-density'),
        wide: b.classList.contains('is-wide'),
        cols: p ? (p.style.getPropertyValue('--cols')||'').trim() : ''
      });
    })()`);
    const legacyErrs = consoleErrors.length + exceptions.length;
    ok('C6 旧版 localStorage 可平滑升级（有效偏好继承 / 废弃字段忽略 / 页面完整）',
      legacy.tabs === 15 && legacy.tiles >= 8 && legacy.searchInputs === 1
      && legacy.bg === 'aurora' && legacy.density === 'compact' && legacy.wide === true
      && legacy.openCards === 0 && legacyErrs === 0,
      JSON.stringify(legacy) + ' 控制台错误=' + legacyErrs);

    /* 升级后清回干净状态，供后续截图使用 */
    await evalJS(`(()=>{
      localStorage.removeItem('xyai.homepage.usage.v1');
      localStorage.removeItem('xyai.homepage.pins.v1');
      try {
        var ui=JSON.parse(localStorage.getItem('xyai.homepage.ui.v1')||'{}');
        ui.bg='none'; ui.bright=1; ui.blur=0; ui.cols=3; ui.density='comfort';
        ui.wide=false; ui.openCat=null; ui.panelOpen=false;
        localStorage.setItem('xyai.homepage.ui.v1', JSON.stringify(ui));
      } catch(e) {}
    })()`);
    await reload(2200);

    /* ============ 15.6 第三轮迭代：品牌图标 / 放大搜索框 / 用户自定义导入链接 ============ */

    /* --- A. 品牌图标（顶栏标记 + favicon） --- */
    const brandInfo = await evalJSON(`(()=>{
      const marks = document.querySelectorAll('.brand-mark');
      const m = marks[0] || null;
      const link = document.querySelector('link[rel="icon"]');
      const href = link ? (link.getAttribute('href')||'') : '';
      const spines = m ? m.querySelectorAll('rect[fill]:not([stroke])') : [];
      return JSON.stringify({
        count: marks.length,
        isSvg: !!(m && m.tagName.toLowerCase()==='svg'),
        inBrand: !!(m && m.closest('.brand')),
        beforeName: !!(m && m.nextElementSibling && m.nextElementSibling.classList.contains('brand-name')),
        frames: m ? m.querySelectorAll('rect[stroke]').length : 0,
        spines: spines.length,
        spineFill: spines.length > 1 ? getComputedStyle(spines[1]).fill : '',
        markColor: m ? getComputedStyle(m).color : '',
        href: href.slice(0, 40),
        hrefIsData: /^data:image\\/svg\\+xml/.test(href),
        hrefStartsWithHttp: /^https?:/i.test(href)
      });
    })()`);
    ok('A1 顶栏有且仅有 1 个 .brand-mark（内联 SVG：1 个描边方框 + 2 根不等高书脊，置于「藏书阁」之前）',
      brandInfo.count === 1 && brandInfo.isSvg && brandInfo.inBrand && brandInfo.beforeName
      && brandInfo.frames === 1 && brandInfo.spines === 2,
      JSON.stringify(brandInfo));
    ok('A1 品牌标记用 currentColor + var(--accent)（暗色自动适配）',
      brandInfo.markColor === 'rgb(21, 23, 26)' && brandInfo.spineFill === 'rgb(44, 92, 197)',
      'markColor=' + brandInfo.markColor + ' spineFill=' + brandInfo.spineFill);
    ok('A1 favicon 是 data:image/svg+xml 内联（非外链，零外部请求）',
      brandInfo.hrefIsData && brandInfo.hrefStartsWithHttp === false,
      brandInfo.href);

    const favDecode = await evalJSON(`(async()=>{
      const link = document.querySelector('link[rel="icon"]');
      if (!link) return JSON.stringify({ok:false,why:'no link[rel=icon]'});
      return await new Promise(res=>{
        const im = new Image();
        im.onload = ()=>res(JSON.stringify({ok:true,w:im.naturalWidth,h:im.naturalHeight}));
        im.onerror = ()=>res(JSON.stringify({ok:false,why:'decode failed'}));
        im.src = link.href;
      });
    })()`);
    ok('A1 favicon data URI 可被浏览器解码为有效 SVG', favDecode.ok === true && favDecode.w > 0, JSON.stringify(favDecode));

    /* --- B. 搜索框放大 --- */
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    await sleep(800);
    const searchSize = await evalJSON(`(()=>{
      const area=document.querySelector('.search-area');
      const bar=document.getElementById('searchBar');
      const input=document.getElementById('searchInput');
      const go=document.getElementById('searchGo');
      const eng=document.getElementById('engineBtn');
      const opt=document.querySelector('.engine-opt');
      const gsvg=go.querySelector('svg');
      return JSON.stringify({
        areaW: Math.round(area.getBoundingClientRect().width),
        barH: Math.round(bar.getBoundingClientRect().height),
        inputFont: parseFloat(getComputedStyle(input).fontSize),
        inputPadL: parseFloat(getComputedStyle(input).paddingLeft),
        goW: Math.round(go.getBoundingClientRect().width),
        goSvg: gsvg ? Math.round(gsvg.getBoundingClientRect().width) : 0,
        engFont: parseFloat(getComputedStyle(eng).fontSize),
        engPadL: parseFloat(getComputedStyle(eng).paddingLeft),
        radius: getComputedStyle(bar).borderTopLeftRadius,
        menuFont: opt ? parseFloat(getComputedStyle(opt).fontSize) : 0,
        menuPad: opt ? parseFloat(getComputedStyle(opt).paddingTop) : 0
      });
    })()`);
    ok('A2 搜索框已放大（1280 下 .search-area ≥ 860px / 输入字号 ≥ 17px / 框高 ≥ 56px）',
      searchSize.areaW >= 860 && searchSize.inputFont >= 17 && searchSize.barH >= 56,
      JSON.stringify(searchSize));
    ok('A2 放大后细节同步放大（放大镜 20px / 引擎按钮 15.5px / 圆角 14px / 下拉项 14px）',
      searchSize.goSvg >= 19 && searchSize.goW >= 60 && searchSize.engFont >= 15
      && parseFloat(searchSize.radius) >= 13 && searchSize.menuFont >= 13.5 && searchSize.menuPad >= 9
      && searchSize.inputPadL >= 19,
      JSON.stringify(searchSize));

    /* 放大后仍零横向溢出（900 / 560） */
    for (const sv of [{ w: 900, name: '900' }, { w: 560, name: '560' }]) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: sv.w, height: 800, deviceScaleFactor: 1, mobile: false });
      await sleep(700);
      const sr = await evalJSON(`(()=>{
        const de=document.documentElement;
        const a=document.querySelector('.search-area').getBoundingClientRect();
        const b=document.getElementById('searchBar').getBoundingClientRect();
        return JSON.stringify({
          scrollW: de.scrollWidth, clientW: de.clientWidth, innerW: window.innerWidth,
          areaW: Math.round(a.width), areaRight: Math.round(a.right), barW: Math.round(b.width),
          wrap: getComputedStyle(document.getElementById('searchBar')).flexWrap
        });
      })()`);
      ok('A2 ' + sv.name + ' 宽度下放大后的搜索框随容器收缩且零横向溢出',
        sr.scrollW <= sr.clientW && sr.areaRight <= sr.innerW + 1 && sr.barW <= sr.innerW + 1,
        JSON.stringify(sr));
    }
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    await sleep(600);

    /* --- C. 「＋」弹窗双模式 + 新增链接 --- */
    await evalJS(`document.querySelector('.quick-row .tile-add').click()`);
    await sleep(400);
    const modeA = await evalJSON(`JSON.stringify({
      open: document.getElementById('pinDialog').open,
      title: document.getElementById('pinDialogTitle').textContent,
      segs: Array.from(document.querySelectorAll('#pinModeSeg .seg-btn')).map(b=>b.getAttribute('data-v')+':'+b.getAttribute('aria-checked')),
      paneA: !document.getElementById('pinPaneExisting').hidden,
      formB: document.getElementById('newLinkForm').hidden
    })`);
    ok('A3 「＋」弹窗为双模式（已有链接 / 新增链接），默认停在「已有链接」',
      modeA.open === true && modeA.segs.length === 2 && modeA.paneA === true && modeA.formB === true
      && modeA.title === '添加常用链接',
      JSON.stringify(modeA));

    await evalJS(`document.querySelector('#pinModeSeg .seg-btn[data-v="new"]').click()`);
    await sleep(300);
    const modeB = await evalJSON(`JSON.stringify({
      title: document.getElementById('pinDialogTitle').textContent,
      paneA: !document.getElementById('pinPaneExisting').hidden,
      formB: document.getElementById('newLinkForm').hidden,
      cats: document.getElementById('newLinkCat').options.length,
      safety: document.getElementById('newLinkSafety').value,
      safetyReadonly: document.getElementById('newLinkSafety').readOnly
    })`);
    ok('A3 切到「新增链接」：表单出现 / 标题切换 / 列出全部 15 个分类 / 安全状态固定为 pending 且不可改',
      modeB.formB === false && modeB.paneA === false && modeB.title === '新增链接'
      && modeB.cats === 15 && modeB.safetyReadonly === true && modeB.safety.indexOf('pending') >= 0,
      JSON.stringify(modeB));

    await evalJS(`document.querySelector('#pinModeSeg .seg-btn[data-v="existing"]').click()`);
    await sleep(250);
    const modeBack = await evalJSON(`JSON.stringify({
      paneA: !document.getElementById('pinPaneExisting').hidden,
      formB: document.getElementById('newLinkForm').hidden,
      items: document.querySelectorAll('.pin-item').length
    })`);
    ok('A3 两种模式可来回切换（新增 → 已有 → 新增），原搜索列表行为不变',
      modeBack.paneA === true && modeBack.formB === true && modeBack.items > 0,
      JSON.stringify(modeBack));

    /* 创建一条自建链接：名称留空 → 默认取域名；网址不写协议 → 自动补 https:// */
    await evalJS(`document.querySelector('#pinModeSeg .seg-btn[data-v="new"]').click()`);
    await sleep(250);
    await evalJS(`(()=>{
      const cat=document.getElementById('newLinkCat');
      if(cat.querySelector('option[value="search"]')) cat.value='search';
      document.getElementById('newLinkUrl').value='verify-custom.example/page';
      document.getElementById('newLinkName').value='';
      document.getElementById('newLinkDesc').value='验收用自建链接';
      document.getElementById('newLinkSaveBtn').click();
    })()`);
    await sleep(700);
    const createdLink = await evalJSON(`(()=>{
      const d=JSON.parse(localStorage.getItem('xyai.homepage.data.v3')||'{}');
      const found=[];
      (d.categories||[]).forEach(c=>(c.links||[]).forEach(l=>{
        if(String(l.url).indexOf('verify-custom.example')>=0) found.push({catId:c.id,cat:c.name,name:l.name,url:l.url,safety:l.safety,desc:l.desc});
      }));
      return JSON.stringify({
        dialogOpen: document.getElementById('pinDialog').open,
        found: found,
        tileOnQuick: !!Array.from(document.querySelectorAll('.tile-name')).find(e=>e.textContent==='verify-custom.example'),
        pins: localStorage.getItem('xyai.homepage.pins.v1'),
        toast: document.getElementById('toast').textContent
      });
    })()`);
    ok('A3 新增链接：网址自动补 https://、名称默认取域名、落在目标分类、safety 恒为 pending',
      createdLink.found.length === 1
      && createdLink.found[0].url === 'https://verify-custom.example/page'
      && createdLink.found[0].name === 'verify-custom.example'
      && createdLink.found[0].catId === 'search'
      && createdLink.found[0].safety === 'pending',
      JSON.stringify(createdLink.found));
    ok('A3 新增链接自动钉住到常用行（瓦片出现 + 写入 pins + toast 提示）',
      createdLink.tileOnQuick === true
      && (createdLink.pins || '').indexOf('verify-custom.example|https://verify-custom.example/page') >= 0
      && createdLink.toast.indexOf('已添加并固定到常用') >= 0,
      'pins=' + createdLink.pins + ' toast="' + createdLink.toast + '"');

    /* --- D. 批量导入链接 --- */
    await evalJS(`document.getElementById('settingsBtn').click()`);
    await sleep(350);
    const bulkBtnState = await evalJS(`(()=>{
      const b=document.getElementById('bulkOpenBtn');
      if(!b) return 'MISSING';
      if(document.getElementById('settings').hidden) return 'PANEL_CLOSED';
      b.click();
      return 'OK';
    })()`);
    await sleep(450);
    const bulkOpenInfo = await evalJSON(`JSON.stringify({
      open: document.getElementById('bulkDialog').open,
      cats: document.getElementById('bulkCat').options.length,
      selected: document.getElementById('bulkCat').value,
      placeholder: document.getElementById('bulkText').placeholder,
      doneVisible: getComputedStyle(document.getElementById('bulkDoneBtn')).display !== 'none',
      resultVisible: getComputedStyle(document.getElementById('bulkResult')).display !== 'none'
    })`);
    ok('A4 ⚙ 面板「数据」分区有「批量导入链接」入口，点击打开批量导入弹窗（15 个分类可选）',
      bulkBtnState === 'OK' && bulkOpenInfo.open === true && bulkOpenInfo.cats === 15
      && /每行一条网址/.test(bulkOpenInfo.placeholder),
      bulkBtnState + ' ' + JSON.stringify(bulkOpenInfo));
    ok('A4 批量导入弹窗初始不显示「完成」按钮与统计行（导入后才出现）',
      bulkOpenInfo.doneVisible === false && bulkOpenInfo.resultVisible === false,
      JSON.stringify(bulkOpenInfo));

    const linksBefore = await evalJSON(`(()=>{
      const d=JSON.parse(localStorage.getItem('xyai.homepage.data.v3')||'{}');
      let n=0; (d.categories||[]).forEach(c=>n+=(c.links||[]).length); return n;
    })()`);

    /* 3 行：合法新网址 / 与已有链接重复（arxiv.org）/ 非法串 */
    await evalJS(`(()=>{
      document.getElementById('bulkText').value='https://bulk-verify.example/one\\nhttps://arxiv.org\\n这不是网址';
      document.getElementById('bulkImportBtn').click();
    })()`);
    await sleep(800);
    const bulkOutcome = await evalJSON(`(()=>{
      const d=JSON.parse(localStorage.getItem('xyai.homepage.data.v3')||'{}');
      let n=0; const bulk=[];
      (d.categories||[]).forEach(c=>(c.links||[]).forEach(l=>{
        n++;
        if(String(l.url).indexOf('bulk-verify.example')>=0) bulk.push({cat:c.name,name:l.name,url:l.url,safety:l.safety});
      }));
      return JSON.stringify({
        result: document.getElementById('bulkResult').textContent,
        resultHidden: document.getElementById('bulkResult').hidden,
        total: n,
        bulk: bulk,
        toast: document.getElementById('toast').textContent,
        doneShown: getComputedStyle(document.getElementById('bulkDoneBtn')).display !== 'none',
        resultShown: getComputedStyle(document.getElementById('bulkResult')).display !== 'none'
      });
    })()`);
    ok('A4 批量导入统计「成功 1 · 重复 1 · 无效 1」，且只真的新增 1 条',
      /成功\s*1\s*条?\s*·\s*重复\s*1\s*条?\s*·\s*无效\s*1\s*条?/.test(bulkOutcome.result)
      && bulkOutcome.resultHidden === false
      && bulkOutcome.total === linksBefore + 1
      && bulkOutcome.bulk.length === 1
      && bulkOutcome.doneShown === true
      && bulkOutcome.resultShown === true,
      'result="' + bulkOutcome.result + '" links ' + linksBefore + '->' + bulkOutcome.total + ' ' + JSON.stringify(bulkOutcome.bulk));
    ok('A4 批量导入的链接 safety 一律 pending（自建链接绝不标 safe）',
      bulkOutcome.bulk.length === 1 && bulkOutcome.bulk[0].safety === 'pending',
      JSON.stringify(bulkOutcome.bulk));

    /* --- E. 刷新后仍在（localStorage 持久化） --- */
    await evalJS(`document.getElementById('bulkDoneBtn').click()`);
    await sleep(350);
    await reload(2400);
    const persistCheck = await evalJSON(`(()=>{
      const d=JSON.parse(localStorage.getItem('xyai.homepage.data.v3')||'{}');
      const urls=[]; let n=0;
      (d.categories||[]).forEach(c=>(c.links||[]).forEach(l=>{n++; urls.push(l.url);}));
      return JSON.stringify({
        hasCustom: urls.indexOf('https://verify-custom.example/page')>=0,
        hasBulk: urls.indexOf('https://bulk-verify.example/one')>=0,
        pins: localStorage.getItem('xyai.homepage.pins.v1'),
        total: n
      });
    })()`);
    ok('A4 批量导入与新增链接的结果刷新后仍在（localStorage 持久化）',
      persistCheck.hasCustom === true && persistCheck.hasBulk === true
      && (persistCheck.pins || '').indexOf('verify-custom.example') >= 0,
      JSON.stringify(persistCheck));

    /* --- F. 验收产生的自建链接不污染基线：重置回内置默认数据 --- */
    await evalJS(`document.getElementById('resetBtn').click()`);
    await sleep(400);
    await evalJS(`(()=>{const d=document.getElementById('confirmDialog');d.returnValue='ok';d.close('ok');})()`);
    await sleep(800);
    await evalJS(`(()=>{
      localStorage.removeItem('xyai.homepage.usage.v1');
      localStorage.removeItem('xyai.homepage.pins.v1');
      try {
        var ui=JSON.parse(localStorage.getItem('xyai.homepage.ui.v1')||'{}');
        ui.panelOpen=false; ui.openCat=null;
        localStorage.setItem('xyai.homepage.ui.v1', JSON.stringify(ui));
      } catch(e) {}
    })()`);
    await reload(2400);
    const restoredBase = await evalJSON(`(()=>{
      const d=JSON.parse(localStorage.getItem('xyai.homepage.data.v3')||'{}');
      let n=0,safe=0,caution=0,pending=0;
      (d.categories||[]).forEach(c=>(c.links||[]).forEach(l=>{n++; if(l.safety==='safe')safe++; else if(l.safety==='caution')caution++; else if(l.safety==='pending')pending++;}));
      return JSON.stringify({cats:(d.categories||[]).length,total:n,safe:safe,caution:caution,pending:pending});
    })()`);
    ok('A5 验收后重置回内置基线（15 分类 / 106 条 / 72 safe / 34 caution / 0 pending）',
      restoredBase.cats === 15 && restoredBase.total === 106 && restoredBase.safe === 72
      && restoredBase.caution === 34 && restoredBase.pending === 0,
      JSON.stringify(restoredBase));
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await sleep(400);

    /* ============ 16. 交付截图 ============ */
    await evalJS(`(()=>{
      localStorage.removeItem('xyai.homepage.usage.v1');
      localStorage.removeItem('xyai.homepage.pins.v1');
      try {
        var ui=JSON.parse(localStorage.getItem('xyai.homepage.ui.v1')||'{}');
        ui.openCat=null; ui.panelOpen=false;
        localStorage.setItem('xyai.homepage.ui.v1', JSON.stringify(ui));
      } catch(e) {}
      document.querySelectorAll('.cat-tab[aria-expanded="true"]').forEach(function(t){t.click();});
    })()`);
    await reload(2400);

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    await sleep(900);
    const s1 = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(path.join(SHOTS, '10-单框搜索-1280.png'), Buffer.from(s1.data, 'base64'));

    await evalJS(`document.querySelector('.cat-tab[data-cat-id="research"]').click()`);
    await sleep(600);
    const s2 = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(path.join(SHOTS, '11-展开分类-1280.png'), Buffer.from(s2.data, 'base64'));

    /* 移动端：回到折叠态，展示竖排搜索框 + 横向滚动常用行 + 标签行 */
    await evalJS(`document.querySelector('.cat-tab[data-cat-id="research"]').click()`);
    await sleep(400);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 560, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(900);
    const s3 = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(path.join(SHOTS, '12-移动端-560.png'), Buffer.from(s3.data, 'base64'));
    await cdp.send('Emulation.clearDeviceMetricsOverride');

    const shotFiles = ['10-单框搜索-1280.png', '11-展开分类-1280.png', '12-移动端-560.png'];
    const shotOk = shotFiles.every(f => fs.existsSync(path.join(SHOTS, f)) && fs.statSync(path.join(SHOTS, f)).size > 5000);
    ok('C7 三张交付截图已生成（1280 单框 / 1280 展开分类 / 560 移动端）', shotOk,
      shotFiles.map(f => f + ' ' + (fs.existsSync(path.join(SHOTS, f)) ? fs.statSync(path.join(SHOTS, f)).size + 'B' : 'MISSING')).join(' | '));

    /* ============ 16.5 第三轮交付截图（新图标 / 放大搜索框 / 新增链接 / 批量导入） ============ */
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    await sleep(900);
    const s13 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS, '13-新图标与放大搜索框-1280.png'), Buffer.from(s13.data, 'base64'));

    await evalJS(`document.querySelector('.quick-row .tile-add').click()`);
    await sleep(450);
    await evalJS(`document.querySelector('#pinModeSeg .seg-btn[data-v="new"]').click()`);
    await sleep(350);
    const s14 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS, '14-新增链接弹窗-1280.png'), Buffer.from(s14.data, 'base64'));
    await evalJS(`document.getElementById('pinDialog').close('cancel')`);
    await sleep(350);

    await evalJS(`document.getElementById('bulkOpenBtn').click()`);
    await sleep(500);
    await evalJS(`(()=>{document.getElementById('bulkText').value='名称 A | https://example.com\\nhttps://another.example\\nhttps://third.example';})()`);
    await sleep(250);
    const s15 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS, '15-批量导入弹窗-1280.png'), Buffer.from(s15.data, 'base64'));
    await evalJS(`document.getElementById('bulkDialog').close('cancel')`);
    await sleep(350);
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await sleep(300);

    const newShotFiles = ['13-新图标与放大搜索框-1280.png', '14-新增链接弹窗-1280.png', '15-批量导入弹窗-1280.png'];
    const newShotOk = newShotFiles.every(f => fs.existsSync(path.join(SHOTS, f)) && fs.statSync(path.join(SHOTS, f)).size > 5000);
    ok('A5 三张第三轮交付截图已生成（新图标+放大搜索框 / 新增链接弹窗 / 批量导入弹窗）', newShotOk,
      newShotFiles.map(f => f + ' ' + (fs.existsSync(path.join(SHOTS, f)) ? fs.statSync(path.join(SHOTS, f)).size + 'B' : 'MISSING')).join(' | '));

    /* ============ 最终汇总 ============ */
    ok('FINAL 全程控制台 0 error', consoleErrors.length === 0, consoleErrors.join(' | ') || '0');
    ok('FINAL 全程 0 未捕获异常', exceptions.length === 0, exceptions.join(' | ') || '0');

    console.log('\n================ SUMMARY ================');
    const pass = results.filter(r => r.pass).length;
    console.log('PASS ' + pass + ' / ' + results.length);
    results.filter(r => !r.pass).forEach(r => console.log('  FAILED: ' + r.name + '  |  ' + r.detail));
    console.log('console messages (all types): ' + consoleAll.length);
    consoleAll.slice(0, 20).forEach(m => console.log('   ' + m));
    fs.writeFileSync(path.join(TMP, 'results.json'), JSON.stringify(results, null, 2));
    if (pass !== results.length) process.exitCode = 1;

  } catch (err) {
    console.error('HARNESS ERROR:', err && err.stack ? err.stack : err);
    console.log('\n================ SUMMARY (crashed) ================');
    const pass = results.filter(r => r.pass).length;
    console.log('PASS ' + pass + ' / ' + results.length);
    results.filter(r => !r.pass).forEach(r => console.log('  FAILED: ' + r.name + '  |  ' + r.detail));
    process.exitCode = 1;
  } finally {
    if (cdp) cdp.close();
    /* 结束本次拉起的 Chrome 及其子进程（只针对本脚本自己的 PID，不影响用户自己的浏览器） */
    try {
      if (process.platform === 'win32') {
        require('child_process').spawnSync('taskkill', ['/pid', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
      }
    } catch (e) { /* 忽略：回退到下面的 kill */ }
    try { chrome.kill(); } catch (e) {}
    await sleep(700);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* 临时档案清理失败不影响验收 */ }
  }
})();

})();
