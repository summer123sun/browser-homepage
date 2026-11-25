# 起始页 · browser-homepage · 藏书阁

一个自用浏览器「起始页 / 主页」。**零外部请求**：不引用任何 CDN、Google Fonts、jsDelivr、unpkg、iconfont、favicon 外链服务，也没有第三方统计埋点。断网状态下页面完整可用。

技术栈：纯 HTML + CSS + 原生 JS（ES2020），无构建工具、无 npm 依赖、无后端。所有数据存在浏览器 `localStorage`。

视觉概念：**藏书阁 / Personal Research Stacks** —— 整屏摄影背景压在最底层，上面浮着一层磨砂玻璃控制台，主体是一排排「书架」。

---

## 一、如何打开

**方式 0：公网地址（已上线，推荐）**

| 托管 | 地址 | 说明 |
|---|---|---|
| Cloudflare Pages | `https://browser-homepage-8c3.pages.dev/` | 全球边缘节点，速度快，作为日常主页用这个 |
| GitHub Pages | `https://summer123sun.github.io/browser-homepage/` | 仓库即源码，`main` 分支推送后自动重新构建 |

两者内容完全一致。设为浏览器主页时直接填上面的 URL 即可，跨设备也能用。
源码仓库：`https://github.com/summer123sun/browser-homepage`（公开，只包含静态页面与背景图，无任何凭据）。

> 重新部署：改完文件后 `git push` 即可更新 GitHub Pages；Cloudflare Pages 需再跑一次
> `wrangler pages deploy <目录> --project-name browser-homepage --branch main`。

**方式 A：直接双击 `index.html`**

```
D:\summer\maxmin\documents\scripts\browser-homepage\index.html
```

用 Chrome / Edge / Firefox 打开即可，然后把该页面设为浏览器主页。

**方式 B：本地静态服务器（推荐）**

部分浏览器对 `file://` 协议下的 `localStorage` 有限制（Safari 会直接抛安全错误），用本地服务器打开可获得完整的保存/读取能力：

```powershell
cd D:\summer\maxmin\documents\scripts\browser-homepage
python -m http.server 8080
```

然后访问 `http://127.0.0.1:8080/`。

> 说明：页面里的所有链接数据都是**用户数据**，其中的 `https://` 是链接目标地址，不是页面自身的资源引用；页面加载的 CSS/JS/图标全部为本地文件或内联 SVG，背景图也是 `assets/` 下的本地相对路径，断网也能正常渲染。

---

## 二、怎么用（交互速查）

| 操作 | 方式 |
| --- | --- |
| 过滤链接 | 在顶部搜索框输入文字，实时过滤下方全部链接（匹配站点名 / 描述 / 分类名），状态行显示「N 项匹配」 |
| 搜索引擎直搜 | 输入 `!关键词` 后回车，用右上角选中的引擎搜索 |
| 直接打开网址 | 输入 `example.com` 或 `http://…` 后回车，直接打开该网址 |
| 切换搜索引擎 | 搜索框右侧下拉：Google / Bing / 百度 / DuckDuckGo，选择会记住 |
| 强制搜索模式 | 点搜索框内的「过滤 / 搜索」小按钮，此时普通文本也按搜索处理 |
| 切换主题 | 点「主题」按钮循环：自动（跟随系统）→ 亮 → 暗，选择会记住 |
| 编辑模式 | 点「编辑」按钮，或按 `E`；`Esc` 退出 |
| 安全视图 | 顶部右侧「仅看待核实」开关，一键只看「谨慎」和「未核实」的条目 |
| 导出 / 导入 / 重置 | 工具行右侧三个按钮 |
| **布局与背景面板** | 工具行最右「布局 · 背景」按钮展开/收起；面板里调背景、亮度、模糊、列数、密度、视图、全宽 |
| **切换背景图** | 面板里的缩略芯片，或按 `[` / `]` 前后切换 |
| **折叠单个分类** | 点分类的书脊条或标题，折叠后显示该分类条目数；状态会被记住 |
| **拖动整本排序** | 编辑模式下拖住分类标题左侧的把手，整张「书」可换位置，顺序会被记住 |

**键盘快捷键**

| 键 | 作用 |
| --- | --- |
| `/` | 聚焦搜索框 |
| `Ctrl` / `Cmd` + `K` | 聚焦搜索框 |
| `↵` | 打开首个匹配 / 搜索 / 打开网址（随当前模式） |
| `Esc` | 关闭弹窗 → 退出编辑模式 → 清空搜索 |
| `E` | 进入 / 退出编辑模式 |
| `T` | 切换主题 |
| `[` / `]` | 上一张 / 下一张背景图 |

编辑模式下：分类卡片可「＋链接 / 改名 / 删除」；每行链接可点铅笔修改、点垃圾桶删除（都有二次确认）；**拖拽行**可在同一分类内排序，也能拖到别的分类里；**拖住分类标题左侧的把手**可整本拖动，改变分类顺序。改动即时写入 `localStorage`，刷新后保留。

---

## 三、背景图片

### 3.1 必须放在 `assets/`，且必须本地加载

> ⚠️ **硬性约束**：`assets/` 下的 5 个文件名**必须严格一致**，且**只能本地加载**。
> `index.html` / `styles.css` / `app.js` 里**不允许**出现任何指向 `http://` 或 `https://` 的资源引用
> （`data.js` 里的站点 URL 是**链接数据**，不算外链资源）。

| 文件名 | 主题 | 兜底渐变 |
| --- | --- | --- |
| `assets/bg-aurora.jpg` | 深蓝极光山脊 · 夜 | `linear-gradient(160deg,#0B1B33 0%,#123A5C 45%,#0A1424 100%)` |
| `assets/bg-stacks.jpg` | 图书馆书架 · 暖褐 | `linear-gradient(160deg,#3A2A1E 0%,#5C4231 45%,#241A12 100%)` |
| `assets/bg-dune.jpg` | 沙丘暖光 · 昼 | `linear-gradient(160deg,#E8C89A 0%,#D9A970 45%,#B8814B 100%)` |
| `assets/bg-rain.jpg` | 雨夜玻璃 · 冷调 | `linear-gradient(160deg,#0E1A26 0%,#17324A 45%,#08111C 100%)` |
| `assets/bg-nebula.jpg` | 星云 · 深空 | `linear-gradient(160deg,#1A1030 0%,#3B1F55 45%,#0D0718 100%)` |

另有一个内置的 **「无背景」** 选项（纯 `--paper` 底色），用于完全关闭背景图。

### 3.2 容错：图片缺失不会破图

背景层用两层叠放：

```css
background-image: url("assets/bg-aurora.jpg"), linear-gradient(160deg,#0B1B33 0%,#123A5C 45%,#0A1424 100%);
```

**图片在上、近似渐变在下**。图片文件缺失或加载失败时，底层渐变直接露出 —— 不会出现破图图标，页面也不会塌陷。
面板里的缩略芯片用同一套叠层；加载失败的芯片会显示为斜纹（`.bg-chip.is-missing`），方便一眼看出哪张还没放进来。

### 3.3 背景微调

- **亮度** 0.3 – 1.4（默认 1）、**模糊** 0 – 20px（默认 0），作用在背景图层上（`filter: brightness() blur()`）。
- 两个值都会持久化到 `localStorage`。

---

## 四、布局自由度（面板里的六项）

全部可调，**刷新后保持**（存 `localStorage` 的 `xyai.homepage.ui.v1`）。

| 项 | 取值 | 说明 |
| --- | --- | --- |
| **列数** | 1 / 2 / 3 / 4 | 默认桌面 3 列。窗口较窄时自动收窄（≥1200px 最多 4 列，≥980px 最多 3，≥660px 最多 2，更窄 1 列），标题右侧会显示「已按窗口收窄」 |
| **密度** | 舒适 / 紧凑 / 极简 | 紧凑＝缩小行距与字号、描述压到 1 行；极简＝隐藏条目描述、行高最紧 |
| **视图** | 书架 / 清单 | 书架＝网格（带书脊）；清单＝分类单列长列表，条目自动分栏，更适合条目多的分类 |
| **折叠** | 单个分类独立 | 点书脊或标题折叠；折叠时显示该分类条目数；状态持久化 |
| **拖拽排序** | 分类整体 | 编辑模式下拖住标题左侧把手，整张「书」换位置；顺序持久化 |
| **全宽** | 开关 | 内容容器从 1240px 拉满到 1600px，适合宽屏 |

> 面板默认收起，不会占满首屏；展开/收起状态也会被记住。

---

## 五、视觉与动效

### 5.1 记忆点：书脊 Spine

每个分类不是普通圆角卡片，而是一本书的**书脊**：

- 左侧一条 **5px 实心彩色书脊条**，颜色取自该分类自己的 `color` 字段（`data.js`），高度贯穿整张卡；
- 脊上印一行**等宽竖排索书号**（分类序号 + 英文 tag，如 `01 · SEARCH`、`03 · RESEARCH`）；
- 链接是书架上的**条目**，右侧是安全状态点；
- **hover 时整本书「抽出」3px 并轻微右倾 1.2°**，书脊条颜色变亮，条目描述提亮；
- 这个动效**只做一处**，其余地方保持安静。

### 5.2 字体（全部系统字体，零外链）

| 用途 | 字体栈 |
| --- | --- |
| 展示体（时钟、分类名、页面主标题） | `"Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Source Han Serif SC", "Songti SC", Georgia, serif` |
| 正文 / 界面 | `system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif` |
| 等宽（索书号、计数、快捷键、状态行） | `ui-monospace, "Cascadia Mono", "JetBrains Mono", Consolas, monospace` |

数字用 `font-variant-numeric: tabular-nums`，保证时钟与计数不跳动。

### 5.3 配色

- 亮色：`--paper #F4F4F2` / `--ink #16181B` / `--ink-2 #4E555C` / `--ink-3 #8A9198` / `--line #E3E4E1` / `--accent #2C5CC5` / `--accent-soft #EDF2FC`
- 暗色：`--paper #15171A` / `--surface #1C1F23` / `--ink #E8EAEC` / `--ink-2 #A7AEB5` / `--ink-3 #717981` / `--line #282C31` / `--accent #6C9BF0` / `--accent-soft #1E2836`
- 磨砂玻璃：`--glass: rgba(255,255,255,.62)` 亮 / `rgba(20,22,26,.55)` 暗，正文面板用 `backdrop-filter: blur(18px) saturate(1.12)`。
- 背景图之上压一层**由上到下的 scrim 渐变**（亮色主题用浅色 scrim，暗色主题用深色），保证正文对比度 ≥ 4.5:1。
- 分类色沿用 `data.js` 里的 `color` 字段，不另起一套。

### 5.4 动效清单（克制，只服务于信息）

| 动效 | 参数 |
| --- | --- |
| 页面加载：书架卡片依次淡入 + 上浮 | 每张延迟 40ms（封顶 400ms），时长 280ms，总时长 ≤ 600ms |
| 背景切换：交叉淡入 | 1.2s，两层背景槽互淡 |
| 书脊 hover：抽出 + 右倾 1.2° | 180ms ease-out |
| 搜索框聚焦：焦点环 | 2px `--accent` + 2px 偏移 |
| 时钟冒号：每分钟轻微呼吸 | 60s 循环的极轻微缩放（不干扰读秒） |

- **尊重 `prefers-reduced-motion: reduce`**：命中时关闭全部过渡与关键帧动画（实测 `animation-duration: 0s`）。
- **不做**视差滚动、粒子、无限循环的装饰动画 —— 用户要「干净整洁」。

---

## 六、怎么改数据

数据在 **`data.js`** 里，结构如下：

```js
window.DEFAULT_DATA = {
  version: 1,
  categories: [
    {
      id: 'search',            // 分类唯一 id
      name: '搜索',            // 分类显示名
      tag: 'SEARCH',           // 等宽小标签（自动大写显示），也是索书号的一部分
      color: '#2C5CC5',        // 分类色：书脊条、字母方块与序号
      links: [
        {
          name: '百度',        // 站点名
          url: 'https://www.baidu.com',
          desc: '中文搜索首选', // 一行灰色描述
          safety: 'pending'    // safe / caution / pending
        }
      ]
    }
  ]
};
```

> **必须写成 `window.DEFAULT_DATA = { … }`**，不要改成顶层 `const DEFAULT_DATA`。
> 经典脚本（非 module）里的顶层 `const`/`let` 只创建脚本作用域绑定，不会成为 `window` 的属性，
> `app.js` 将取不到默认数据，页面会退化成空列表。

字段说明：

- `safety` 三态：
  - `safe` —— 已核实安全，右侧显示信号蓝实心点；
  - `caution` —— 谨慎，右侧显示暖橙空心环点，可带 `note: '提示文案'`，悬停或点击该点会显示提示；
  - `pending` —— 未核实，右侧显示灰色空心点。
- 内置数据集：**15 个分类 / 106 条链接**，其中 72 条已核实安全、34 条需留意（`caution`）、0 条未核实。
  - 本次新增 `research`「学术研究」（26 条）与 `ai-global`「国外 AI 工具」（10 条）两个分类；
  - 恢复被上一轮剔除的海外 AI 入口（ChatGPT / Claude / Gemini / Google），**全部标 `caution`**，
    `note` 里写明「需自备代理 / 海外网络」，因为它们在大陆网络下通常不可达；
  - 原 13 个分类 / 70 条链接**一条未删**，所有 `safety` 与 `note` 原样保留（已用脚本逐条比对确认）。
- `desc` 超过两行会被自动省略；`name` 建议控制在 14 个字以内。
- 新增条目时先按「安全 / 谨慎 / 未核实」给出依据，不要凭感觉标成 `safe`。

改完 `data.js` 后：

- **想立即生效**：在页面上点「重置」→ 二次确认，即可恢复成 `data.js` 里的最新默认数据。
- **想保留现有改动**：用「导出」备份，再把 `data.js` 改好，然后在页面上「导入·覆盖」你的备份（或者直接用编辑模式改）。

> 注意：`data.js` 是默认数据集；你在页面上做的修改保存在 `localStorage`，会覆盖默认数据。`重置` 是回到 `data.js` 的唯一入口。

---

## 七、导出 / 导入

- **导出**：点「导出」→ 浏览器下载 `homepage-links-YYYYMMDD.json`，内容是当前全部数据（含分类、颜色、安全状态）。
- **导入**：两个按钮二选一
  - **导入·覆盖**：用文件内容替换当前全部数据（会二次确认，建议先导出备份）。
  - **导入·合并**：把文件里的分类并入当前数据；同名（同 id 或同名）分类只补充缺失链接，不重复添加，其余分类追加到末尾。
- **导入前校验**：文件必须是合法 JSON、根节点是对象、含 `categories` 数组，每个分类要有 `name` 字符串与 `links` 数组，每条链接要有 `name` 和 `url`。任何一项不满足都会在页面底部提示**具体原因**（例如「第 2 个分类缺少 links 数组」「链接「百度」缺少 url 字符串」），不会写入任何数据。

---

## 八、文件说明

| 文件 | 作用 |
| --- | --- |
| `index.html` | 页面结构（背景层、玻璃控制台、布局面板、书架网格、三个对话框、提示条） |
| `styles.css` | 全部样式与主题变量（亮色 / 暗色 / 跟随系统三套，含玻璃、scrim、书脊、密度与响应式） |
| `data.js` | 内置默认数据 `DEFAULT_DATA`（15 分类 / 106 链接） |
| `app.js` | 全部交互逻辑：时钟、双模搜索条、过滤、主题、编辑模式、拖拽排序（链接级 + 分类级）、导入导出、重置、快捷键、背景图层、布局偏好 |
| `assets/README.md` | 背景图片的命名、主题与兜底渐变约定 |
| `verify.cjs` | **验收脚本**：一条命令跑完全部验收（见下） |
| `_check.cjs` / `_cdptest.cjs` | 验收脚本的合并前残留，内容已并入 `verify.cjs`，**可安全删除** |
| `README.md` | 本文档 |

### 怎么跑验收

```powershell
node verify.cjs
```

不需要 `npm install`，不发任何网络请求。它会做两件事：

1. **数据核对** —— 解析 `data.js`，核对分类数 / 链接数 / `safety` 三态分布，
   并逐条比对「原 13 分类 / 70 链接一条没丢、`safety` 与 `note` 没被破坏」；
2. **浏览器实测** —— 用本机 Chrome 的远程调试协议（CDP）打开本目录的 `index.html`，
   跑 80 项断言：控制台零报错、背景切换与渐变兜底、亮度模糊滑杆、
   列数/密度/视图/折叠/拖拽排序/全宽及其刷新保持、动效与 `prefers-reduced-motion`、
   既有功能不退化、1280/900/560 响应式零横向溢出、零外部网络请求。

> 需要 Node 18+（内置 `WebSocket`）与本机 Chrome / Edge。
> 截图会写到 `D:\summer\maxmin\tmp\bh-shots\`。

### 主题

CSS 变量集中在 `styles.css` 顶部：

- 亮色（默认）：`--paper:#F4F4F2` `--surface:#FFFFFF` `--ink:#16181B` `--ink-2:#4E555C` `--ink-3:#8A9198` `--line:#E3E4E1` `--accent:#2C5CC5` `--accent-soft:#EDF2FC` `--warn:#B4622A`
- 暗色：`--paper:#15171A` `--surface:#1C1F23` `--ink:#E8EAEC` `--ink-2:#A7AEB5` `--ink-3:#717981` `--line:#282C31` `--accent:#6C9BF0` `--accent-soft:#1E2836` `--warn:#D08A55`

`html[data-theme="auto"]` 走 `prefers-color-scheme` 自动切换，`light` / `dark` 为手动覆盖，选择保存在 `localStorage`。

> `--ink-3` 只用于**装饰性**信息（分类标签、索书号、提示脚注）；承载内容的文本（条目名、描述、计数、折叠提示）一律用 `--ink` / `--ink-2`，以保证 ≥ 4.5:1 对比度。

### localStorage 键位

| 键 | 内容 |
| --- | --- |
| `xyai.homepage.data.v3` | 当前链接数据 JSON |
| `xyai.homepage.theme.v1` | `auto` / `light` / `dark` |
| `xyai.homepage.engine.v1` | `google` / `bing` / `baidu` / `duckduckgo` |
| `xyai.homepage.safeonly.v1` | `1` / `0`，安全视图开关 |
| `xyai.homepage.ui.v1` | 界面偏好 JSON：`{ bg, bright, blur, cols, density, view, wide, panelOpen, collapsed }` |

> **数据键从 `v2` 升到 `v3`**：本次扩充了两个新分类，若不换键，本机 `localStorage` 里的旧数据会遮住新的默认数据集，
> 用户看不到「学术研究」「国外 AI 工具」。换键后旧数据自动作废，`data.js` 的新默认集直接生效。
> 若本机已有自定义数据，换键前请先用「导出」备份。

### 无障碍与兼容

- 语义化结构：分类用 `<article>`，链接用 `<ul>/<li>/<a>`，搜索结果数量 `aria-live="polite"` 播报。
- 书脊是可聚焦按钮，带 `aria-expanded` / `aria-controls`，与标题折叠按钮状态同步。
- 所有交互元素可 Tab 聚焦，焦点环为 2px `--accent` 外框 + 2px 偏移。
- 尊重 `prefers-reduced-motion`，关闭过渡与动画。
- 响应式断点：`≤900px` 控制台与面板变单列，`≤560px` 网格单列、隐藏描述行、面板收纳为竖排；实测 1280 / 900 / 560 三档零横向溢出。
