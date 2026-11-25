/* 起始页 · 内置默认数据（安全审计 2026-11-24，本次扩充 2026-11-25）
 *
 * 结构：{ version, categories: [ { id, name, tag, color, links: [ { name, url, desc, safety, note? } ] } ] }
 *
 * safety 取值：
 *   safe     —— 已核实，可放心使用
 *   caution  —— 可用但有需注意的点，note 里写明具体注意事项（显示为提示气泡）
 *   pending  —— 未核实
 *
 * ⚠️ 本文件必须写成 `window.DEFAULT_DATA = { ... }`。
 *    经典脚本（非 module）里的顶层 `const`/`let` 不会挂到 window 上，
 *    写成 `const DEFAULT_DATA = {...}` 会导致 app.js 读到 undefined、页面空白。
 *
 * 审计方法：逐站实际抓取首页与隐私政策原文，核对主体归属、HTTPS、注册门槛、
 * 数据是否上传、公网 IP 是否暴露、版权合规与国内可达性。
 *
 * 本次扩充（2026-11-25）：
 *   · 新增分类 research「学术研究」（26 条）与 ai-global「国外 AI 工具」（10 条）
 *   · 恢复被上一轮剔除的海外 AI 入口（ChatGPT / Claude / Gemini / Google），
 *     全部标记 caution 并在 note 中写明「需自备代理 / 海外网络」
 *   · 原 13 个分类 / 70 条链接一条未删，safety 与 note 全部原样保留
 */
window.DEFAULT_DATA = {
  version: 1,
  categories: [
    {
      id: 'search', name: '搜索', tag: 'SEARCH', color: '#2C5CC5',
      links: [
        { name: '百度', url: 'https://www.baidu.com', desc: '中文搜索首选', safety: 'safe' },
        { name: '必应', url: 'https://cn.bing.com', desc: '微软搜索，国内访问稳定', safety: 'safe' },
        { name: 'Google', url: 'https://www.google.cn/', desc: '国际资料与技术文档，google.cn 大陆可达', safety: 'safe' },
        { name: 'SearXNG', url: 'https://searx.be/', desc: '元搜索，一次聚合数百引擎', safety: 'safe' }
      ]
    },
    {
      id: 'ai', name: 'AI 助手', tag: 'AI', color: '#7A4CC8',
      links: [
        { name: 'DeepSeek', url: 'https://chat.deepseek.com', desc: '深度推理与研究', safety: 'caution', note: '对话与上传文件在中国境内留存；仿冒站逾两千个，认准 chat.deepseek.com' },
        { name: 'Kimi', url: 'https://www.kimi.com/', desc: '长文本阅读与信息提取', safety: 'safe' },
        { name: '千问', url: 'https://www.qianwen.com/', desc: '阿里 AI 助手，AI 搜索与文档问答', safety: 'safe' },
        { name: '秘塔 AI 搜索', url: 'https://metaso.cn/', desc: '问答式全网检索，无广告', safety: 'safe' },
        { name: '讯飞星火', url: 'https://xinghuo.xfyun.cn/', desc: '多模态工作台，文档问答与 PPT', safety: 'safe' }
      ]
    },
    {
      id: 'research', name: '学术研究', tag: 'RESEARCH', color: '#8C5A9E',
      links: [
        { name: 'Google 学术', url: 'https://scholar.google.com', desc: '学术论文检索', safety: 'caution', note: '国内通常不可达，需自备代理' },
        { name: 'arXiv', url: 'https://arxiv.org', desc: '物理数学计算机预印本', safety: 'safe' },
        { name: 'Semantic Scholar', url: 'https://www.semanticscholar.org', desc: 'AI 驱动的论文检索与引用图谱', safety: 'safe' },
        { name: 'Connected Papers', url: 'https://www.connectedpapers.com', desc: '论文关联图谱，一键生成相关工作图', safety: 'safe' },
        { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov', desc: '生物医学文献检索', safety: 'safe' },
        { name: 'Crossref', url: 'https://search.crossref.org', desc: 'DOI 官方检索，跨出版商元数据', safety: 'safe' },
        { name: 'OpenAlex', url: 'https://openalex.org', desc: '开放学术图谱，2 亿+ 论文元数据 API', safety: 'safe' },
        { name: 'DOAJ', url: 'https://doaj.org', desc: '开放获取期刊质量索引', safety: 'safe' },
        { name: 'IEEE Xplore', url: 'https://ieeexplore.ieee.org', desc: 'IEEE 期刊与会议全文', safety: 'safe' },
        { name: 'ACM Digital Library', url: 'https://dl.acm.org', desc: '计算机领域顶会期刊归档', safety: 'safe' },
        { name: 'SSRN', url: 'https://www.ssrn.com', desc: '经济金融法律预印本', safety: 'safe' },
        { name: 'Zenodo', url: 'https://zenodo.org', desc: 'CERN 开放数据与预印本仓库', safety: 'safe' },
        { name: 'SciSpace', url: 'https://typeset.io', desc: 'AI 论文阅读助手，跨库问答与综述生成', safety: 'safe' },
        { name: 'Elicit', url: 'https://elicit.com', desc: 'AI 文献综述与抽取筛选', safety: 'safe' },
        { name: 'Consensus', url: 'https://consensus.app', desc: 'AI 检索并给出带引证的结论', safety: 'safe' },
        { name: 'Mathpix', url: 'https://mathpix.com', desc: '公式 OCR，把 PDF 公式转 LaTeX', safety: 'safe' },
        { name: 'Papers with Code', url: 'https://paperswithcode.com', desc: '论文配套代码与排行榜', safety: 'safe' },
        { name: 'Hugging Face', url: 'https://huggingface.co', desc: '模型与数据集仓库', safety: 'safe' },
        { name: 'Perplexity', url: 'https://www.perplexity.ai', desc: '联网 AI 搜索，带引证', safety: 'caution', note: '国内通常不可达，需自备代理' },
        { name: 'NotebookLM', url: 'https://notebooklm.google.com', desc: '基于自有资料的音频概览与问答', safety: 'caution', note: '需 Google 账号，国内通常不可达' },
        { name: 'Zotero', url: 'https://www.zotero.org', desc: '开源文献管理与引文', safety: 'safe' },
        { name: 'CNKI 中国知网', url: 'https://www.cnki.net', desc: '中文核心期刊与学位论文', safety: 'safe' },
        { name: '万方数据', url: 'https://www.wanfangdata.com.cn', desc: '中文期刊、学位论文与标准', safety: 'safe' },
        { name: '维普', url: 'https://www.cqvip.com', desc: '中文期刊与会议文献', safety: 'safe' },
        { name: '国家哲学社会科学文献中心', url: 'https://www.ncpssd.org', desc: '社科文献免费开放', safety: 'safe' },
        { name: '中国科学数据仓库', url: 'https://www.csdb.cn', desc: '中科院科学数据网络数据集与仓储', safety: 'safe' }
      ]
    },
    {
      id: 'ai-global', name: '国外 AI 工具', tag: 'GLOBAL AI', color: '#3F7FBF',
      links: [
        { name: 'ChatGPT', url: 'https://chatgpt.com', desc: '通用 AI 对话', safety: 'caution', note: '国内网络通常不可达，需自备代理；同品牌仿冒域名数以千计，认准 chatgpt.com' },
        { name: 'Claude', url: 'https://claude.ai', desc: '长文写作与深度分析', safety: 'caution', note: '官方对大陆返回区域不可用，需自备海外网络' },
        { name: 'Gemini', url: 'https://gemini.google.com', desc: 'Google 多模态助手', safety: 'caution', note: '国内网络通常不可达，需自备代理' },
        { name: 'Google', url: 'https://www.google.com', desc: '国际资料与技术文档', safety: 'caution', note: '国内通常不可达，可用 www.google.cn 替代' },
        { name: 'Poe', url: 'https://poe.com', desc: '多个模型聚合对话', safety: 'caution', note: '国内通常不可达，需自备代理' },
        { name: 'OpenAI 官方', url: 'https://openai.com', desc: '官方发布与文档', safety: 'caution', note: '国内通常不可达' },
        { name: 'Anthropic 官方', url: 'https://www.anthropic.com', desc: 'Claude 官方与研究博客', safety: 'caution', note: '国内通常不可达' },
        { name: 'Google AI Studio', url: 'https://aistudio.google.com', desc: 'Gemini API 与试用', safety: 'caution', note: '需 Google 账号，国内通常不可达' },
        { name: 'Claude Code 文档', url: 'https://docs.anthropic.com', desc: 'Claude Code / API 官方文档', safety: 'caution', note: '国内通常不可达' },
        { name: 'OpenAI Cookbook', url: 'https://cookbook.openai.com', desc: '官方示例与实践配方', safety: 'caution', note: '国内通常不可达' }
      ]
    },
    {
      id: 'design', name: '设计与图片', tag: 'DESIGN', color: '#C2552E',
      links: [
        { name: 'Photopea', url: 'https://www.photopea.com', desc: '在线 PS，PSD 图层编辑，文件全本地', safety: 'safe' },
        { name: 'Canva', url: 'https://www.canva.cn/', desc: '在线设计模板中文入口', safety: 'safe' },
        { name: 'TinyPNG', url: 'https://tinypng.com', desc: '图片智能压缩', safety: 'caution', note: '图片上传至 Tinify 服务器，最长保留 48 小时；敏感图片请改用 Photopea' },
        { name: 'Iconify', url: 'https://icon-sets.iconify.design/', desc: '54 万+ 图标统一入口，开源可自托管', safety: 'safe' },
        { name: 'IconPark', url: 'https://iconpark.oceanengine.com/', desc: '字节官方图标库，多主题可导出', safety: 'safe' }
      ]
    },
    {
      id: 'wall', name: '壁纸与素材', tag: 'WALL', color: '#2E8B76',
      links: [
        { name: 'Unsplash', url: 'https://unsplash.com', desc: '无版权高清摄影', safety: 'safe' },
        { name: 'Pexels', url: 'https://www.pexels.com/zh-cn/', desc: '摄影与视频素材，中文搜索', safety: 'caution', note: '站点加载 Hotjar 会话录制与广告追踪脚本' },
        { name: 'Pixabay', url: 'https://pixabay.com', desc: '插画矢量摄影全覆盖', safety: 'caution', note: '许可非纯 CC0，2019 年后含可辨识人物与私有财产的素材不可用' },
        { name: 'Wallpaper Abyss', url: 'https://wall.alphacoders.com/', desc: '游戏影视动漫壁纸，2K–8K', safety: 'caution', note: '用户上传聚合站，版权归上传者，商用需自行确认授权' },
        { name: '极简壁纸', url: 'https://bz.zzzmh.cn', desc: '界面干净无冗余，2K/4K/8K 筛选', safety: 'caution', note: '个人工作室，已停更 400 天且站点未启用 HSTS' },
        { name: 'Simple Desktops', url: 'https://simpledesktops.com/', desc: '极简线条、纯色与几何', safety: 'safe' }
      ]
    },
    {
      id: 'doc', name: '文档与 PDF', tag: 'DOC', color: '#4A6FBF',
      links: [
        { name: 'iLovePDF', url: 'https://www.ilovepdf.com', desc: '合并拆分压缩转换', safety: 'caution', note: '文件上传 EEA 服务器，一般 2 小时删除，但电子签名文件依法留存 5 年' },
        { name: 'PDF24 Tools', url: 'https://tools.pdf24.org', desc: '免费 PDF 工具箱，含 OCR', safety: 'caution', note: '文件上传服务器约 1 小时删除；只从官网下载，勿运行第三方渠道的 PDF24.exe' },
        { name: 'Stirling PDF', url: 'https://www.stirling.com/', desc: '开源 PDF 工具箱，可自部署，文件不出机器', safety: 'safe' },
        { name: 'ONLYOFFICE', url: 'https://www.onlyoffice.com/', desc: 'Office 全家桶可编辑，桌面版可离线', safety: 'safe' }
      ]
    },
    {
      id: 'dev', name: '开发者工具', tag: 'DEV', color: '#55606B',
      links: [
        { name: 'GitHub', url: 'https://github.com', desc: '代码托管与协作', safety: 'safe' },
        { name: 'GitHub Trending', url: 'https://github.com/trending?since=daily', desc: '每日热门仓库与 star 增量', safety: 'safe' },
        { name: 'Stack Overflow', url: 'https://stackoverflow.com', desc: '编程问答', safety: 'safe' },
        { name: 'MDN', url: 'https://developer.mozilla.org/zh-CN/', desc: 'Web 标准权威文档，含中文翻译', safety: 'safe' },
        { name: 'Can I use', url: 'https://caniuse.com/', desc: '浏览器特性支持表', safety: 'safe' },
        { name: 'Crontab Guru', url: 'https://crontab.guru/', desc: 'cron 表达式本地解析与解释', safety: 'safe' },
        { name: 'Carbon', url: 'https://carbon.now.sh/', desc: '把代码生成漂亮截图', safety: 'safe' },
        { name: '稀土掘金', url: 'https://juejin.cn/', desc: '中文技术社区与踩坑记录', safety: 'safe' }
      ]
    },
    {
      id: 'conv', name: '格式转换', tag: 'CONV', color: '#8A5CB8',
      links: [
        { name: 'VERT.sh', url: 'https://vert.sh/', desc: '浏览器本地转换，文件不出设备', safety: 'safe' },
        { name: 'OnlineConvert', url: 'https://www.onlineconvert.com/', desc: '1200+ 格式，PDF 套件本地处理', safety: 'caution', note: '视频与文档走云端转换；页面使用 AdSense 跨站 Cookie' },
        { name: 'CloudConvert', url: 'https://cloudconvert.com/', desc: '200+ 格式互转', safety: 'caution', note: '文件经第三方服务器处理，涉密文件勿用' },
        { name: 'TinyWow', url: 'https://tinywow.com/', desc: '200+ 免费工具合集', safety: 'caution', note: '文件上传服务器 1 小时删除；广告与追踪脚本密集' },
        { name: '123Apps', url: 'https://www.123apps.com/', desc: '50+ 视频音频 PDF 小工具', safety: 'caution', note: '广告密集并推销会员，免费档有次数与体积限制' }
      ]
    },
    {
      id: 'net', name: '网络与诊断', tag: 'NET', color: '#1F7A9C',
      links: [
        { name: 'Cloudflare 测速', url: 'https://speed.cloudflare.com/', desc: '延迟与节点质量，IP 截断后共享', safety: 'safe' },
        { name: 'Speedtest', url: 'https://www.speedtest.net/', desc: '标准测速，下载上传与延迟', safety: 'caution', note: '测速会向 Ookla 暴露公网 IP，广告追踪较强' },
        { name: 'nPerf', url: 'https://www.nperf.com/', desc: '下载上传与网页视频体验', safety: 'caution', note: '隐私政策允许将你的 IP 非匿名告知运营商' },
        { name: 'Dotcom-Tools', url: 'https://www.dotcom-tools.com/', desc: '多地 Ping、路由追踪与 DNS', safety: 'caution', note: '测试结果链接公开可见，游客结果保留 7 天' },
        { name: 'ITDOG', url: 'https://www.itdog.cn/', desc: '中文 Ping 测速 MTR DNS 批量检测', safety: 'caution', note: '广告位密集，页面自带「关闭所有广告」开关' },
        { name: '17CE', url: 'https://www.17ce.com/', desc: '全球探针，劫持与 DNS 污染检测', safety: 'safe' },
        { name: 'ping.pe', url: 'https://ping.pe/', desc: '170+ 地点实时 Ping 与 MTR', safety: 'safe' }
      ]
    },
    {
      id: 'safe', name: '隐私与安全', tag: 'SAFE', color: '#B4622A',
      links: [
        { name: 'ImmuniWeb', url: 'https://www.immuniweb.com/', desc: '网站安全、隐私与 SSL 扫描', safety: 'safe' },
        { name: 'Have I Been Pwned', url: 'https://haveibeenpwned.com/', desc: '查邮箱与密码是否已泄露', safety: 'safe' },
        { name: 'Firefox Relay', url: 'https://relay.firefox.com/', desc: '邮箱别名，不暴露真实地址', safety: 'safe' }
      ]
    },
    {
      id: 'note', name: '效率与笔记', tag: 'NOTE', color: '#4E8B3F',
      links: [
        { name: 'Obsidian', url: 'https://obsidian.md/', desc: '本地优先 Markdown 知识库', safety: 'safe' },
        { name: '思源笔记', url: 'https://b3log.org/siyuan/', desc: '开源本地优先，块级引用与双向链接', safety: 'safe' },
        { name: '滴答清单', url: 'https://dida365.com/', desc: '待办、日历、习惯打卡一站式', safety: 'safe' },
        { name: '番茄钟', url: 'https://www.tomatotimers.com/', desc: '极简番茄钟，打开即用', safety: 'safe' },
        { name: 'Quizlet', url: 'https://quizlet.com/', desc: '闪卡学习与题库', safety: 'caution', note: '无 SOC 2 等安全认证，2020 年曾泄露约 1 亿账户，免费版广告与追踪较重' }
      ]
    },
    {
      id: 'tool', name: '画板与文本工具', tag: 'TOOL', color: '#6B7A8F',
      links: [
        { name: 'Excalidraw', url: 'https://excalidraw.com/', desc: '手绘风协作白板', safety: 'safe' },
        { name: 'BoardOS', url: 'https://boardos.online/', desc: '国产多人实时白板', safety: 'caution', note: '强制注册，白板内容云端保存' },
        { name: 'WiteBoard', url: 'https://witeboard.com/', desc: '极简共享白板，免注册无广告', safety: 'safe' },
        { name: 'LiveGap Charts', url: 'https://charts.livegap.com/', desc: '50+ 图表模板，拖拽编辑', safety: 'caution', note: '页面加载 Google Ad Manager 与 Analytics' },
        { name: 'CaseWren', url: 'https://casewren.com/', desc: '150 款文本工具，全部本地处理', safety: 'safe' },
        { name: 'Textbench', url: 'https://textbench.app/', desc: '64 款纯前端文本工具', safety: 'safe' }
      ]
    },
    {
      id: 'hard', name: '硬件与外设', tag: 'HARD', color: '#6E7B8B',
      links: [
        { name: 'BrowserBench', url: 'https://browserbench.org/', desc: 'Apple、Google、Mozilla 官方基准', safety: 'safe' },
        { name: 'CamMicGo', url: 'https://www.cammicgo.com/', desc: '摄像头麦克风耳机综合自检，全本地', safety: 'safe' },
        { name: 'Mictest', url: 'https://mictest.co/', desc: '音频外设测试与音调生成', safety: 'caution', note: '叠加多组第三方广告脚本，并反复弹窗推荐浏览器扩展与客户端' }
      ]
    },
    {
      id: 'read', name: '阅读与影音', tag: 'READ', color: '#8A6A3C',
      links: [
        { name: '古腾堡计划', url: 'https://www.gutenberg.org/', desc: '7 万+ 公共版权电子书', safety: 'safe' },
        { name: 'Internet Archive', url: 'https://archive.org/', desc: '非营利数字图书馆与网页存档', safety: 'safe' },
        { name: 'Open Library', url: 'https://openlibrary.org/', desc: '开放书库目录，可在线阅读借阅', safety: 'safe' },
        { name: 'Libby', url: 'https://libbyapp.com/', desc: '用公共图书馆卡免费借阅电子书', safety: 'safe' },
        { name: '国家图书馆', url: 'https://www.nlc.cn/', desc: '中文馆藏与数字资源', safety: 'caution', note: '检索子站 find.nlc.cn 仅有 http 明文，故收藏主站 https://www.nlc.cn' },
        { name: 'Folo', url: 'https://folo.is/', desc: '开源 AI RSS 阅读器，聚合中文源', safety: 'safe' },
        { name: 'WikiFlix', url: 'https://wikiflix.toolforge.org/', desc: '聚合公有领域电影，无广告无账号', safety: 'safe' },
        { name: '咪咕音乐', url: 'https://music.migu.cn/', desc: '正版曲库，网页版免登录', safety: 'safe' },
        { name: 'Jamendo', url: 'https://www.jamendo.com/', desc: '60 万+ CC 授权独立音乐', safety: 'safe' }
      ]
    }
  ]
};
