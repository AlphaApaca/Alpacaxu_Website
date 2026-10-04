# 目录与逐文件说明

这是正式交接的文件地图，核对基准为网站 `main` 提交 `1d3bb3328d98c4e4586b97e22676359c4ae643fa`（2026-10-05）。该版本有 92 个 Git 管理文件、9 篇同步文章；本次另外提供 4 份交接手册。以后新文件、新文章或依赖升级会改变清单，应以当时的 `git ls-files` 为准。

先从 [维护总指南](maintenance-guide.md) 看技术栈与本地运行，从 [内容修改地图](content-map.md) 找具体页面元素，从 [版本与文章发布指南](publishing-guide.md) 看发布操作。本文件用于回答“这个目录/文件是什么、能不能改、谁在使用它”，不是要求日常逐个打开所有文件。

## 1. 读这份地图的方法

- **内容可改**：适合修改文案、图片、Markdown 或说明，但仍走新分支 → 检查 → PR → 预览 → 合并。
- **技术可改**：属于布局、交互、校验或自动化实现，修改后必须运行回归检查；不是日常写文章的位置。
- **生成勿手改**：由同步或依赖安装生成，去上游来源修改，再重新生成；否则以后会被覆盖或校验失败。
- **历史保留**：现行页面不使用，或只保留旧版本的辅助资源；不要因为名称“旧”就直接删除，要先查引用及 Git 历史。

表里的路径均相对于网站仓库根目录。`public/assets/portrait.png` 对应网站网址 `/assets/portrait.png`，不是 `/public/assets/portrait.png`。`src/` 内文件通常由 Astro 编译，不按源码路径直接提供给访客。

## 2. 目录树与每层职责

```text
Alpacaxu_Website/
├── .github/
│   └── workflows/                   GitHub Actions 检查、同步、预览验收
├── assets/                          原静态站的历史图片副本
├── docs/                            交接指南、写作模板、历史验收记录
├── public/                          原样复制到构建产物的网站静态资源
│   └── assets/                      实际可通过 /assets/ 访问的图片
├── scripts/                         本地/CI 的同步与验收工具、回归测试
├── src/                             Astro 网站源码
│   ├── components/                  可复用顶栏、页脚、评论、阅读工具
│   ├── content/
│   │   └── posts/                   被 posts 内容集合读取的 Markdown
│   │       ├── essays/              自己在网站仓库维护的杂文
│   │       └── repytorch/           从源仓库生成的文章快照及清单
│   │           ├── learning_log/    已发布学习日志快照
│   │           └── notes/           已发布技术笔记快照
│   ├── data/                        可集中修改的身份/首页文案
│   ├── layouts/                     所有页面及文章的外层布局
│   ├── lib/                         内容、筛选、双语首屏等共享逻辑
│   └── pages/                       URL 对应的页面入口
│       └── writing/                 /writing/ 索引和文章动态路由
├── index.html                       仍被 Astro 抽取内容的旧首页桥接源
├── script.js / styles.css           需与 public 同名文件保持一致的桥接副本
└── 根级配置文件                     依赖、Astro、TypeScript、部署、忽略规则
```

| 目录层级 | 职责与边界 |
| --- | --- |
| 仓库根目录 | 工程入口、依赖配置、部署配置、项目说明与旧首页内容桥接源。不是生产网站输出目录。 |
| `.github/` | GitHub 仓库自动化配置的上层容器；不是网页资源。 |
| `.github/workflows/` | 3 个 Actions 工作流。修改会影响检查、定时任务或提 PR 权限；谨慎操作。 |
| `assets/` | 原静态站保留的 4 张图片；Astro 不会自动发布这个根级目录。当前网页资源从 `public/assets/` 提供。 |
| `docs/` | 说明、模板及历史验收文档；不被文章集合扫描，不会自动变成网站文章。 |
| `public/` | 静态 JS/CSS/SVG/图片，构建时直接复制到 `dist/`，不经过 Astro 模块打包。这里的模块进口必须是浏览器可访问路径。 |
| `public/assets/` | 顶栏卡通头像、个人照片、项目图和部分历史图片；放进去即有公开网址，不代表页面一定引用了它。 |
| `scripts/` | 在 Node 中运行的工程工具与 `*.test.mjs` 测试；不会当作浏览器资源部署。 |
| `src/` | 编译型源码上层目录；页面、内容集合、布局、组件与逻辑。 |
| `src/components/` | 各页面共享组件；改顶栏/页脚会影响所有采用 `BaseLayout` 的页面。 |
| `src/content/` | 网站内容的上层容器。集合定义实际位于 `src/content.config.ts`，不是这个目录内。 |
| `src/content/posts/` | 内容集合 `posts` 的扫描根目录，只扫描 `**/*.md`；所有 Markdown 都要满足 schema，只有 `publish: true` 生成页面。 |
| `src/content/posts/essays/` | 手工维护杂文，不受 repytorch 同步覆盖；目前只有保留目录用的 `.gitkeep`。 |
| `src/content/posts/repytorch/` | 同步器管理的完整快照目录。包括文章及 `snapshot.json`；不能把自己的额外文件放在这里。 |
| `src/content/posts/repytorch/learning_log/` | 与源仓库学习日志路径对应的生成文件；修改/撤稿到 `repytorch/learning_log/` 操作。 |
| `src/content/posts/repytorch/notes/` | 与源仓库技术笔记路径对应的生成文件；修改/撤稿到 `repytorch/notes/` 操作。 |
| `src/data/` | 目前单独提供 `site.mjs`，集中昵称、顶栏头像、联系邮箱和首页开场。不是所有页面文案都已集中到这里。 |
| `src/layouts/` | 文档 head、共享页面 chrome、首屏初始化，以及文章标题/正文/目录/评论组合。 |
| `src/lib/` | Astro 构建和浏览器共用/序列化的纯逻辑；避免把日常正文写进这里。 |
| `src/pages/` | 文件路由：`index.astro` → `/`，`about.astro` → `/about/`，`404.astro` → 自定义错误页。 |
| `src/pages/writing/` | `index.astro` → `/writing/`；`[...slug].astro` 构建所有已发布文章的 `/writing/{permalink}/`。 |

## 3. 根目录逐文件

| 文件 | 实际功能 | 如何修改 | 依赖/引用 |
| --- | --- | --- | --- |
| `.gitignore` | 排除依赖、产物、本机配置和系统杂项，避免提交不必要文件。 | 技术可改；新增敏感文件应先加入规则，但已被 Git 管理的文件不会自动被忽略。 | Git 读取；现有规则见第 10 节。 |
| `.nvmrc` | 固定项目 Node 版本 `22.13.0`。 | 技术可改；升级需同时确认 `package.json`、CI、Vercel 运行时兼容。 | 本地 `nvm use`；3 个工作流的 `setup-node` 读取。 |
| `README.md` | 项目入口说明：开发命令、写作、同步、评论、预览与手册链接。 | 内容可改，随项目真实流程更新。 | GitHub 仓库主页展示；不是网站文章。 |
| `astro.config.mjs` | 正式域名、静态输出、统一末尾斜杠，以及只对显式链接启用的 hover 预加载策略。 | 技术可改；更换正式域名需核对其他硬编码正式链接。 | Astro 开发与构建；`BaseLayout` 的 canonical/OG 使用 `Astro.site`。 |
| `package.json` | 项目名称、Node 要求、pnpm 版本、全部开发命令与精确依赖版本。 | 技术可改；依赖用包管理器升级并提交锁文件。 | `pnpm`、npm、开发/构建命令、CI、Vercel。 |
| `pnpm-lock.yaml` | 依赖解析、间接依赖、完整性校验及平台包锁定，确保可重复安装。 | 生成勿手改；通过 `pnpm install`/升级命令更新，和 `package.json` 一起审核。 | CI/Vercel 用 `--frozen-lockfile` 安装；不一致会失败。 |
| `pnpm-workspace.yaml` | 当前只包含根包 `.`；允许 esbuild 安装构建步骤。 | 技术可改；不是多项目业务目录配置。 | pnpm 11 的安装/构建安全策略。 |
| `tsconfig.json` | 继承 Astro strict 检查，包含自动类型和源码，排除 `dist`。 | 技术可改；不建议为了绕过问题关闭 strict。 | TypeScript 与 `pnpm check`。 |
| `vercel.json` | 明确使用 Astro、锁定安装命令、运行构建并发布 `dist`。 | 技术可改；Vercel 账号中的域名、保护、授权配置不在此文件。 | Vercel Git 集成部署。 |
| `index.html` | 原首页的内容桥接源；当前 Astro 首页从中抽取项目、照片简介、经历论文、方向、技能学历、CPD 和工程反思。 | 内容可改；保留 `projects/profile/experience/objective/about/cpd/notes` 的 section ID，翻译同步修改两份旧字典。 | `src/pages/index.astro` 通过 `?raw` 导入；不是独立正式入口，也不要用 `file://` 验收。 |
| `script.js` | 原静态站浏览器交互和 `translations` 双语字典的根级副本。当前 Astro 不执行它。 | 证据区翻译内容可改；与 `public/script.js` 同步。旧主题/搜索处理不是当前修改入口。 | 根 `index.html` 的旧 script 标签引用；回归测试要求与 public 副本一致。 |
| `styles.css` | 原通用主题与证据区样式的根级副本。 | 技术可改；与 `public/styles.css` 保持一致。 | 根 `index.html` 的旧 link 标签引用；现行页面实际加载 public 副本。 |
| `favicon.svg` | 原静态站用的 A 字母 SVG 图标，与 public 版本一致。 | 内容可改；若更换图标，两份保持一致，勿放真实姓名缩写。 | 根 `index.html` 旧入口引用；现行正式图标来自 `public/favicon.svg`。 |

## 4. GitHub 自动化逐文件

| 文件 | 实际功能 | 如何修改 | 依赖/引用 |
| --- | --- | --- | --- |
| `.github/workflows/ci.yml` | `Site checks`：网站 main/codex 分支 push、main 的 PR、手工触发；安装锁定依赖，运行回归、固定快照校验、Astro 检查/构建；codex push 额外检查同一 SHA 的成功预览 HTTP。 | 技术可改；保留最小权限、固定 Actions SHA 和精确提交验收。 | `.nvmrc`、`package.json`、`scripts/*.test.mjs`、同步器、预览检查器、Vercel 部署状态。 |
| `.github/workflows/preview-acceptance.yml` | `Preview HTTP acceptance`：成功 Vercel Preview 回调或手动预览 URL；检查真实页面、404/noindex。回调只运行 main 的可信验收代码。 | 技术可改；不允许通过任意外站或保护页绕过验收。 | `.nvmrc`、`scripts/check-preview.mjs`、目标版本 `snapshot.json`、GitHub/Vercel 状态。 |
| `.github/workflows/sync-repytorch.yml` | 每小时第 17 分钟或 main 手工触发；同步 repytorch，全部校验后创建/更新一个 `codex/repytorch-sync` 草稿 PR；保护人工修改，不自动合并。 | 技术可改；日常发文章不需要编辑。定时可能延迟，权限在 GitHub Settings 单独开启。 | 同步器、Node/依赖、回归检查、GitHub API 和 `create-pull-request` Action；只写生成快照路径。 |

## 5. 文档逐文件

本次 4 份手册是现行交接入口；过去的验收文档保留开发过程，不能把里面当时的测试数、页面数、旧动画时长或“尚未交接”表述当作当前状态。

| 文件 | 实际功能 | 如何修改 | 依赖/引用 |
| --- | --- | --- | --- |
| `docs/maintenance-guide.md` | 本次交接总入口：技术栈、运行方式、维护边界及其他手册导航。 | 内容可改；版本升级、运行方式变化时更新。 | README 和其他交接文档互相链接；不被内容集合扫描。 |
| `docs/content-map.md` | 本次页面元素的增删改地图：文案、图片、项目、导航、文章、样式与交互。 | 内容可改；修改位置迁移后同步更新地图。 | 指向真实源码、资源和上游内容来源。 |
| `docs/file-reference.md` | 本文件：全部受管文件说明、目录层级、历史副本和生成文件边界。 | 内容可改；新增/移动/删除文件时更新，核对 `git ls-files`。 | 覆盖基准提交全部 92 个文件及本次 4 份手册。 |
| `docs/publishing-guide.md` | 本次版本控制与发布流程：分支、提交、PR、回退、新文章和同步排错。 | 内容可改；自动化、命名或合并规则改变后更新。 | Git、GitHub Actions、PR、Vercel 与 repytorch 流程。 |
| `docs/writing.md` | 网站仓库杂文的详细写法、frontmatter 字段、草稿与稳定 permalink 注意事项。 | 内容可改；内容 schema 改动后同步更新。 | `docs/essay-template.md`、`src/content/posts/essays/`、内容校验。 |
| `docs/essay-template.md` | 合法、未发布的杂文复制模板，正文从二级标题开始。 | 内容可改；复制到 essays 后填实际日期/标题/permalink，不要把模板本身当文章发布。 | `scripts/essay-template.test.mjs` 校验；不被文章集合扫描。 |
| `docs/site-editing.md` | 从视觉调整期保留并更新的简短编辑速查：昵称、开场、照片、预览和现行 600ms 过渡。 | 内容可改；现已链接正式手册，复杂变更优先使用完整交接文档。 | 原有 README 链接、`site.mjs`、首屏修复记录。 |
| `docs/workbench-preview.md` | 工作台视觉、分类筛选、语言、头像、指针特效等阶段性本地验收记录。 | 历史保留；新的测试结果新增带日期记录，不涂改历史来假称已验收。 | 引用当时分支、测试和预览；其中 150ms/旧首屏闪动描述已被后来修复取代。 |
| `docs/first-paint-checks.md` | 首屏跳变/黑屏/动画创建条件排查、600ms 收尾、慢加载对照和验收边界。 | 历史保留；后续回归可补新记录；临时诊断代码已移除。 | BaseLayout、首屏初始化、workspace 样式和历史远程验收。 |

## 6. public 静态资源逐文件

### 6.1 样式和浏览器模块

现行所有页面先加载 `/styles.css` → `/astro.css` → `/workspace.css` → `/pointer-effects.css`；文章追加 `/article-reader.css`，文章索引追加 `/writing-editorial.css`。后加载的样式可能覆盖前者，所以不要只在早期通用文件改一个值就假定所有页面都变了。

| 文件 | 实际功能 | 如何修改 | 依赖/引用 |
| --- | --- | --- | --- |
| `public/styles.css` | 基础浅/深主题变量、系统字体、通用按钮、项目证据、经历、文章基础等旧共享样式。 | 技术可改；颜色主要从根 `:root` 和暗色变量改，保持根 `styles.css` 一致。 | `BaseLayout.astro` 全站加载；被后续页面专用 CSS 覆盖。 |
| `public/astro.css` | Astro 写作索引基础筛选样式、文章代码/图片、404、评论和 About 布局补充。 | 技术可改；先确认是否被 editorial/reader 样式覆盖。 | `BaseLayout.astro` 全站加载。 |
| `public/workspace.css` | 当前工作台首页、三列居中顶栏、快捷导航、项目折叠、移动布局，以及 600ms 原生跨页淡入/减少动态效果。 | 技术可改；首屏占位、动画旧画面兜底和 `pointer-events: none` 是已验收保护，不随意删除。 | `BaseLayout.astro` 全站加载；配合内联过渡策略、workspace 组件与脚本。 |
| `public/writing-editorial.css` | 当前文章索引的个人札记式排版、筛选框、素色标签选择控件；支持时原生 `base-select` 渐进增强。 | 技术可改；保留原生表单/移动/高对比降级。 | `src/pages/writing/index.astro` 单独加载；覆盖索引的通用样式。 |
| `public/article-reader.css` | 正文/侧栏双列、右侧固定目录、手机折叠、进度条、章节跳转偏移和减少动态效果。 | 技术可改；与 reader 几何计算/断点配套。 | `ArticleLayout.astro` 文章页加载；由 reader 模块设置 CSS 偏移变量。 |
| `public/pointer-effects.css` | 点击圈/十字几何脉冲及按压反馈，所有效果层不参与鼠标命中；触屏/减少动态效果关闭。 | 技术可改；不要覆盖系统指针、焦点或点击行为。 | `BaseLayout.astro` 全站加载；配合 `pointer-effects.js`。 |
| `public/workspace.js` | 全站后续语言切换和日期/元信息更新，首页主题节点切换，旧锚点自动展开，⌘/Ctrl+K 快捷导航。 | 技术可改；新文案优先在页面属性或 `site.mjs` 改，而非复制一套语言处理。 | BaseLayout 加载；进口 `workspace-state.js`、`interface-state.js`，发送 `site:language-change`。 |
| `public/workspace-state.js` | 快捷导航大小写/全角/多词匹配和安全 fragment 解码的纯函数。 | 技术可改并运行相应测试。 | `workspace.js` 导入；Node 回归测试也直接导入。 |
| `public/interface-state.js` | UI 语言标准化、存储偏好、切换按钮提示和 UTC 日期格式化的纯函数。 | 技术可改；仅翻译界面，不翻译作者正文。 | `workspace.js` 导入；`interface-state.test.mjs` 覆盖。 |
| `public/article-reader.js` | 正文目录增强、实际 h2/h3 章节高亮、仅正文阅读进度、手机收起目录，响应滚动/尺寸/图片变化。 | 技术可改；不要把评论/页脚算进阅读进度。 | `ArticleReader.astro` 文章页加载；导入 `article-reader-state.js`。 |
| `public/article-reader-state.js` | 阅读百分比与当前章节索引的纯几何函数，处理短文与异常数据。 | 技术可改并运行几何测试。 | `article-reader.js` 导入；reader 状态测试覆盖。 |
| `public/pointer-effects.js` | 桌面鼠标普通左键点击脉冲；限定最多 4 个、超时清理，选择/拖动/隐藏页面时取消。 | 技术可改；输入框、修饰键、触屏和减少动态效果保护必须保留。 | BaseLayout 全站加载；`pointer-effects.test.mjs` 直接测试导出判断函数。 |
| `public/script.js` | 旧静态站脚本副本，含旧首页双语 `translations`。在现行 Astro 网站只作为构建期 raw 文本解析，不当作另一套浏览器脚本运行。 | 旧证据翻译可改，必须同步根 `script.js`；不要修改这里旧处理器来修新交互。 | BaseLayout raw 导入 → `evidence-copy.mjs`；一致性与安全回归测试。 |
| `public/favicon.svg` | 现行网站 `/favicon.svg` 的 A 字母图标。 | 内容可改；和根 `favicon.svg` 保持一致。 | BaseLayout 全站 icon 链接。 |

### 6.2 图片：现行与历史副本逐个区分

图片文件可以用新图片替换，但“同名覆盖”属于版本变更：先保留 Git 记录，核对大小/尺寸、加载方式及替换效果，再经 PR 发布。这里仅根据源码引用核实用途；不会据图像内容推断新项目已上线。

| 文件 | 实际功能/目前是否用到 | 如何修改 | 依赖/引用 |
| --- | --- | --- | --- |
| `public/assets/alpaca-avatar.png` | 现行顶栏 40×40 显示的卡通头像（资源为缩小展示版）。 | 内容可改；替换后确认小体积和裁切，或在 `site.avatar` 改路径。 | `site.mjs` → `SiteHeader.astro`；个性化测试限制文件小于 100KB。 |
| `public/assets/portrait.png` | 现行个人照片展示版，首页 profile 与 About 都用它。 | 内容可改；两处复用同一资源，替换同时影响两页。 | 根 `index.html` profile 由 Astro 抽取；About 明确引用 `/assets/portrait.png`。 |
| `public/assets/leo-rover-demo.jpg` | 现行 V.I.S.O.R./Leo Rover 项目图片。 | 内容可改；项目结构或链接在根 index 改，替换图在此处。 | 根 projects section → Astro 首页 `/assets/leo-rover-demo.jpg`。 |
| `public/assets/avatar.png` | 原个人照片文件保留，当前组件没有引用此路径。 | 历史保留；不是当前顶栏头像，也不是当前照片展示入口。 | 和 `assets/avatar.png` 字节一致；不要只替换它就期待页面照片变更。 |
| `public/assets/hero-workspace.png` | 原静态首屏桌面插画；目前 Astro 首页的新工作台首屏不用此图。 | 历史保留；需要启用时明确添加到新页面。 | 根 index 的旧 hero 引用，但 Astro 不抽取 hero；和根 assets 副本一致。 |
| `public/assets/uav-control-diagram.png` | 预留/历史 UAV 控制图；当前网页源码无引用，UAV 项目尚未展示。 | 历史保留；之后加 UAV 时可以重新选图与接入，不因资源存在就自动显示。 | 和 `assets/uav-control-diagram.png` 字节一致；目前无页面消费者。 |
| `assets/avatar.png` | 与 public 旧 avatar 相同的根级历史原图副本。 | 历史保留；日常换照片不要改这里。 | Astro 不自动发布根 assets；当前源码无此资源引用。 |
| `assets/hero-workspace.png` | 原静态首屏插画的根级副本。 | 历史保留；当前首屏不会读取它。 | 根 index 旧 hero 相对路径；和 public 副本一致。 |
| `assets/leo-rover-demo.jpg` | 原静态 Leo Rover 图的根级副本。 | 历史保留；现行展示换图改 public 版本。 | 根 index 原相对路径被 Astro 抽取时改为 `/assets/`，实际网站由 public 版本供图。 |
| `assets/uav-control-diagram.png` | UAV 图的根级历史副本。 | 历史保留；当前无人机展示尚未接入。 | 和 public 副本一致；当前源码无引用。 |

注意：根 `index.html` 写有 `assets/portrait.png`，但根 `assets/` 没有这张文件；它经 Astro 抽取时转换成 `/assets/portrait.png`，由 public 提供。因此直接打开根 HTML 不是正确预览方式。

## 7. Astro 源码逐文件

### 7.1 页面入口

| 文件 | 实际功能 | 如何修改 | 依赖/引用 |
| --- | --- | --- | --- |
| `src/pages/index.astro` | 现行 `/` 首页：新开场、主题内容地图、折叠项目证据、最新 4 篇文章、profile/经历/背景。抽取根 index 的 7 个 section，添加新项目 ID。 | 内容/技术可改；开场先改 `site.mjs`，旧证据先改根 index/双语字典，新增板块再改此文件。 | BaseLayout、`content.ts`、`writing.mjs`、`site.mjs`、根 index raw 文本。 |
| `src/pages/about.astro` | `/about/`：双语个人介绍、照片、研究方向、联系链接、独立留言板。 | 内容可改；写在 `data-workspace-zh/en` 里的两种文案都要更新。 | BaseLayout、Giscus、`site.mjs`、portrait；留言板 term 固定 `about-guestbook`。 |
| `src/pages/404.astro` | 自定义 404 页面，返回首页/文章入口；robots noindex，不写 canonical。 | 内容/技术可改；不要删自定义页面标记与 noindex 边界。 | BaseLayout、`site.mjs`；HTTP 验收确认真实 404 而不是 200 错误页面。 |
| `src/pages/writing/index.astro` | `/writing/`：所有已发布文章、分类计数、标签、关键词、组合筛选；客户端增强逻辑在文件末尾。URL 记录 q/category/tag。 | 内容/技术可改；只改界面文字在模板，筛选行为改末尾模块并运行行为测试。 | BaseLayout、`content.ts`、`writing.mjs`、`site.mjs`、editorial CSS、首屏筛选 manifest。 |
| `src/pages/writing/[...slug].astro` | 根据已发布集合生成稳定文章路由；Astro render 取得正文与真实目录标题，传给 ArticleLayout。 | 技术可改；日常文章正文不改路由文件。 | `getPublishedPosts()`、Astro 内容渲染、ArticleLayout；评论键 `/writing/{permalink}/`。 |

### 7.2 布局与可复用组件

| 文件 | 实际功能 | 如何修改 | 依赖/引用 |
| --- | --- | --- | --- |
| `src/layouts/BaseLayout.astro` | 全文档骨架、SEO/分享 meta、canonical、顶栏/页脚、静态样式/模块、首屏内联脚本、主题按钮、完整 main 快照等待标记。 | 技术可改；内联过渡策略顺序、`page-content-ready` 唯一 ID、完整正文等待是首屏保护。 | 所有页面与 ArticleLayout 使用；组件、first-paint、evidence-copy、public 静态资源。 |
| `src/layouts/ArticleLayout.astro` | Markdown 文章统一标题、简介、日期、标签、来源 SHA/链接、正文、目录与按需评论双列布局。 | 技术/界面内容可改；正文去 Markdown 修改，不改稳定评论 term。 | BaseLayout、ArticleReader、Giscus、writing/content、`site.mjs`；动态路由调用。 |
| `src/components/SiteHeader.astro` | 全站品牌头像/昵称、Projects/Writing/About、当前页状态、快捷导航/语言/主题按钮。 | 内容/技术可改；名称/头像先改 site，改链接在此文件；保留增强按钮占位。 | BaseLayout 调用；`site.mjs`、workspace.js/CSS、首屏 bootstrap。 |
| `src/components/SiteFooter.astro` | 全站版权年、口号、联系邮箱链接。 | 内容可改；年份目前写死 2026，需自己更新，不会自动随年份变化。 | BaseLayout 调用；昵称/邮箱来自 `site.mjs`。 |
| `src/components/WorkspaceTools.astro` | ⌘/Ctrl+K dialog 模板、4 个固定页面目的地、自动加入全部已发布文章。 | 固定入口文案可改；文章列表不要手写，会从内容集合自动生成。 | BaseLayout、`getWritingPosts()`、workspace 浏览器模块。 |
| `src/components/ArticleReader.astro` | 构建时生成真实 h2/h3 目录、原生锚点和隐藏增强进度控件。 | 技术/阅读工具界面可改；保留无需 JS 的目录链接。 | ArticleLayout 提供 headings；加载 article-reader.js。 |
| `src/components/GiscusComments.astro` | 评论/留言板展示、按需加载按钮、GitHub Discussions 链接、repo/category IDs、语言/主题跟随与错误重试。 | 技术/提示文案可改；日常文章开关改 comments 字段；不要随意更换 term/repo/category。 | ArticleLayout 与 About 调用；外部 `https://giscus.app/client.js` 仅点击后加载，GitHub 登录发言。 |

### 7.3 内容配置、数据与共享逻辑

| 文件 | 实际功能 | 如何修改 | 依赖/引用 |
| --- | --- | --- | --- |
| `src/content.config.ts` | `posts` 集合与 Zod schema：扫描 Markdown、发布开关、必填标题/稳定网址/简介、合法日期/语言、标签、来源元数据。 | 技术可改；调整字段需同步写作模板、同步器和文档，不为单篇报错随意放宽。 | Astro 内容构建；`content.ts` 获取集合。 |
| `src/data/site.mjs` | 网站昵称、卡通头像路径、邮箱，中文/英文首页 title/description/两行标题/intro。 | 内容可改；JS 引号逗号括号保留，两个语言可独立表达。 | 首页、顶栏、页脚、About、文章标题和404等使用；不是旧证据全部文案唯一来源。 |
| `src/lib/content.ts` | 读取已发布文章、检查重复网址、排序，给首页/索引/快捷导航提供统一精简列表。 | 技术可改；不要重新拼接三篇已撤下静态旧文。 | Astro content API、writing 工具；页面、WorkspaceTools、动态路由。 |
| `src/lib/writing.mjs` | 默认分类/显示名、搜索标准化、组合匹配、筛选 URL、查询恢复、重复网址检查、确定性排序。 | 技术可改；新增分类显示名在这里与索引双语 categoryCopy 配套。 | 内容列表、索引客户端、首页链接、首屏脚本与写作测试共用。 |
| `src/lib/evidence-copy.mjs` | 用 TypeScript AST 安全读取旧字典静态字符串；给抽取的旧证据 HTML 加统一双语属性，转义属性值，不执行旧脚本。 | 技术可改；双语文案仍去两份 script.js 修改。 | BaseLayout 在 `legacyI18n` 首页构建时调用；evidence-copy 测试验证安全。 |
| `src/lib/first-paint.mjs` | 序列化到 head 的首屏初始化：提前恢复语言、主题、界面文本/日期、文章 URL 筛选；解析结束停止观察。 | 技术可改；不引入外部请求、等待计时、整页隐藏或改写文章正文。 | BaseLayout 内联；共用 writing 纯函数，后续 workspace/索引模块接管。 |

### 7.4 文章与来源清单（逐文件）

下面 9 篇 Markdown 都是网站副本，源提交固定为 `89fba16cc63f43a938e32f71c1ee4008201c513b`。**全部生成勿手改**；对应 `sourcePath` 就是 repytorch 要编辑的原文件。同步会移除正文的第一层标题、把标题放进 frontmatter，并把文章/代码链接重写为站内或固定提交链接。以后新增文章后需要扩展这张表，但不必为每篇文章新增 Astro 页面。

| 文件 | 当前文章/功能 | 修改与依赖 |
| --- | --- | --- |
| `src/content/posts/essays/.gitkeep` | 空杂文目录的 Git 保留标记，不生成文章。 | 可以保留；新增杂文在旁边放合法 `.md`，不要将说明 README 放进扫描目录。 |
| `src/content/posts/repytorch/learning_log/2026-09-21-setup.md` | “远端环境与第一次 GPU 运行”学习日志；网址 `/writing/2026-09-21-setup/`。 | 生成勿手改；来源 `repytorch/learning_log/2026-09-21-setup.md`；内容集合读取。 |
| `src/content/posts/repytorch/learning_log/2026-09-30-quickstart.md` | “本地环境配置和 quickstart”日志；网址 `/writing/2026-09-30-quickstart/`。 | 生成勿手改；来源 `repytorch/learning_log/2026-09-30-quickstart.md`；内容集合读取。 |
| `src/content/posts/repytorch/learning_log/2026-10-01-tensors.md` | Tensors 学习日志；网址 `/writing/2026-10-01-tensors/`。 | 生成勿手改；来源 `repytorch/learning_log/2026-10-01-tensors.md`；正文可链接已发布 Tensors Note。 |
| `src/content/posts/repytorch/learning_log/2026-10-02-datasets-and-dataloaders.md` | Dataset/DataLoader 学习日志；网址 `/writing/2026-10-02-datasets-and-dataloaders/`。 | 生成勿手改；来源 `repytorch/learning_log/2026-10-02-datasets-and-dataloaders.md`；reader 回归也读取它作为真实文章样例。 |
| `src/content/posts/repytorch/learning_log/2026-10-03-transforms.md` | Transforms 学习日志；网址 `/writing/2026-10-03-transforms/`。 | 生成勿手改；来源 `repytorch/learning_log/2026-10-03-transforms.md`；内容集合读取。 |
| `src/content/posts/repytorch/learning_log/2026-10-04-build-model.md` | 最新 Build Model 学习日志，含模型设备调用报错记录；网址 `/writing/2026-10-04-build-model/`。 | 生成勿手改；来源 `repytorch/learning_log/2026-10-04-build-model.md`；新文章已纳入当前快照。 |
| `src/content/posts/repytorch/notes/datasets-and-dataloaders.md` | Dataset/DataLoader 技术笔记；网址 `/writing/datasets-and-dataloaders/`。 | 生成勿手改；来源 `repytorch/notes/datasets-and-dataloaders.md`；内容集合读取。 |
| `src/content/posts/repytorch/notes/tensors.md` | Tensors 技术笔记；网址 `/writing/tensors/`。 | 生成勿手改；来源 `repytorch/notes/tensors.md`；内容集合读取。 |
| `src/content/posts/repytorch/notes/transforms.md` | Transforms 技术笔记；网址 `/writing/transforms/`。 | 生成勿手改；来源 `repytorch/notes/transforms.md`；内容集合读取。 |
| `src/content/posts/repytorch/snapshot.json` | 来源仓库、完整提交 SHA、9 篇来源路径与 permalink 清单；即使零篇文章也保留来源信息。 | 生成勿手改；同步器生成；固定快照校验、预览 HTTP 检查选择对应版本文章。不是手工“置顶/排序”配置。 |

`repytorch` 的其他文件（包括 `publish: false` 的 `notes/build-model.md`、教程代码、模型输出）没有被复制进网站，因此不在网站的逐文件清单里。源仓库与网站仓库是两个独立 Git 项目。

## 8. 工程工具与每个测试文件

两个工具是可执行维护程序；所有 `*.test.mjs` 由 `pnpm test`（Node 内置测试器）和 CI 自动执行。测试文件可由开发者修改，但不能仅因为测试失败就删测试或降低断言；先查实际功能是否退化。下面逐个列出，不以“测试目录”一句带过。

| 文件 | 实际功能 | 手工修改/依赖 |
| --- | --- | --- |
| `scripts/sync-repytorch.mjs` | 解析 GitHub ref 为完整 SHA，读取允许路径与 publish 元数据，校验标题/日期/语言/安全链接/本机路径/原始 HTML，改写 Markdown AST，生成或检查完整快照。支持普通同步、`--check`、`--dry-run`。 | 技术可改；`package.json` 和同步/CI 工作流调用。普通同步会整体替换生成目录，check 固定来源比较，dry-run 不替换已提交快照。 |
| `scripts/check-preview.mjs` | 只读检查本项目 HTTPS Preview 域名，页面 200、真实自定义404、noindex/no canonical；可从 GitHub 查找同一 SHA 的不可变部署，禁止凭据随网页请求发送。 | 技术可改；两套预览验收工作流调用。不是正式域名健康检查器，也不会自动测中英/动画。 |
| `scripts/article-reader-markup.test.mjs` | 检查共享文章布局、原生目录/进度可访问性、Astro 真锚点、实际同步 Markdown 渲染及稳定评论键。 | 技术可改；读取 ArticleReader/ArticleLayout/文章路由、reader 模块和真实 DataLoader 日志。 |
| `scripts/article-reader-state.test.mjs` | 实测进度几何、短文、手机偏移、无效数据、当前章节、文末及不可滚动短页选择。 | 技术可改；直接导入 `public/article-reader-state.js`。 |
| `scripts/check-preview.test.mjs` | 使用模拟 HTTP/GitHub 响应测域名/路由白名单、robots、软404/保护失败、重试、重定向限制、精确 SHA 与不可变 URL。 | 技术可改；导入 `check-preview.mjs`；通过不表示线上真实请求已验收。 |
| `scripts/essay-template.test.mjs` | 杂文模板必须合法未发布、在集合外；空目录不意外带入假文章或说明。 | 技术可改；读取模板及 essays 目录。 |
| `scripts/evidence-copy.test.mjs` | 真实旧证据双语转换、不执行动态表达式、属性转义、结构/链接/正文保留。 | 技术可改；导入 evidence-copy 并读取 public 字典、根 index。 |
| `scripts/first-paint-style.test.mjs` | 验证 head 内联开关顺序、完整主内容快照等待、桌面居中/按钮占位、手机两行、旧画面兜底、600ms与减少动态效果、无临时诊断。 | 技术可改；读取 BaseLayout 和 workspace CSS；样式断言不代替真实浏览器验收。 |
| `scripts/first-paint.test.mjs` | 在模拟 DOM 中执行首屏脚本，测保存语言/主题/禁存储、流式新增节点、解析停止、正文不改、URL 筛选/未知标签与安全序列化。 | 技术可改；导入 `first-paint.mjs` 与 writing；是行为回归，不是浏览器截图。 |
| `scripts/interface-state.test.mjs` | 语言/存储/按钮提示/UTC日期、全站共享控件、正文与评论键独立、过渡层不阻挡按钮。 | 技术可改；导入 interface-state，读取共享页面和样式。 |
| `scripts/legacy-posts.test.mjs` | 防止三篇撤下示例文章/索引副本被恢复；确认只收明确发布的 Markdown、首页不链接旧文。 | 技术可改；检查旧路径不存在，读取内容逻辑与两个首页文件。 |
| `scripts/pointer-effects.test.mjs` | 脉冲允许条件、普通左键、选择/拖动取消、数量/寿命、被动事件和不改变指针/导航。 | 技术可改；直接导入 pointer-effects 导出函数，读取 JS/CSS。 |
| `scripts/site-personalization.test.mjs` | 独立中英文开场/身份完整、无真实姓名及缩写、头像大小/尺寸、提前主题恢复与渐进导航。 | 技术可改；读取 site、页面、旧字典、favicon、布局与样式；改昵称/资源时同步验证约束。 |
| `scripts/sync-repytorch.test.mjs` | 白名单、明确发布元数据、日期/语言/网址、唯一 H1、链接/图片/引用重写、危险路径协议、原始 HTML、GFM、本机路径行号、零篇来源清单。 | 技术可改；直接导入同步器纯函数；不自动运行写入同步。 |
| `scripts/workspace-state.test.mjs` | 快捷导航 Unicode/大小写/多词匹配、安全锚点，首页旧区块/真实项目/文章入口，发布/阅读边界和两份桥接 JS 一致。 | 技术可改；直接导入 workspace-state，读取首页/组件/布局/桥接脚本。两份 CSS 一致目前需人工核对。 |
| `scripts/writing-about-language.test.mjs` | Writing/About 双语 metadata/布局；执行索引增强，测语言切换保留条件/未知tag/历史、无JS降级、首屏恢复后启用控件。 | 技术可改；读取两页面/布局，模拟 DOM 执行索引模块；不翻译作者正文。 |
| `scripts/writing-select-style.test.mjs` | 标签控件保留原生 labelled select/change；素色字体/箭头、焦点、高对比与减少动态效果、桌面渐进选择菜单。 | 技术可改；读取索引模板及 editorial CSS。 |
| `scripts/writing.test.mjs` | 关键词/全角/多词 AND、分类+精确标签、可搜索元信息、URL转义、排序、重复网址及自定义分类显示。 | 技术可改；直接导入 `writing.mjs`；控制首页/索引/快捷导航共同内容规则。 |

## 9. 为什么旧文件不能一概删除

当前迁移保留了明确的桥接关系：

```text
根 index.html 的 7 个现用 section
  → src/pages/index.astro 抽取/重新组织
  → BaseLayout 调用 evidenceMarkup
  → public/script.js 的静态 translations 构建期转换
  → 输出统一 data-workspace-* 双语属性
  → first-paint.mjs 提前显示 + workspace.js 后续切换
```

因此 `index.html` 和 `public/script.js` 都仍是**真实构建输入**，不是整份可删的旧网站。两份 `script.js` 的一致性有现有回归测试；两份 `styles.css` 当前内容相同，应保持一致，但现有测试没有逐字对比它们，需要人工核对。旧脚本处理器虽然保留，但当前网页不加载它们运行；新增功能应使用 Astro/共享 workspace，不重新启用两套主题/语言处理。

需要彻底移除桥接时，应另开重构分支，把这些 7 个 section 和全部双语证据迁入明确的 Astro/数据组件，再改导入、测试和手册并逐项验收；本次交接不做此重构，也不删除无引用图片。

已撤下的三篇示例 HTML（`build-personal-blog`、`choose-stack`、`notes-system`）和临时动画诊断脚本/面板不在当前受管清单。旧网址现在返回404，历史内容可从 Git 历史找回；不是文件遗失。

## 10. 本地自动目录与非受管文件

用户要求的“每个文件”在本手册中按**项目受 Git 管理文件**完整覆盖。依赖包里的成千上万文件、自动缓存、构建产物和 `.git` 内部对象不逐个列出：它们不是你维护的源码，数量随系统/安装变化，逐项文档会误导你直接改生成文件。

| 本地目录/文件 | 功能 | 维护原则 |
| --- | --- | --- |
| `node_modules/` | pnpm 安装的直接/间接依赖及链接，包括 Astro 编译器。 | `.gitignore` 忽略；不手改，不提交；用锁定安装恢复。 |
| `dist/` | `pnpm build` 生成的生产 HTML、打包模块和 public 副本；`pnpm preview` 读取这里。 | 忽略；不手改。源码改了却预览没变，先重建再刷新，不改 dist 应急。 |
| `.astro/` | Astro 自动同步的类型、内容缓存与构建辅助数据。 | 忽略；`pnpm check/dev/build` 重建；不把它当文章编辑位置。 |
| `.pnpm-store/` | 可能出现的本地 pnpm 包缓存。 | 忽略；并非必需有这个根级目录，实际 store 位置由本机配置决定。 |
| `.git/` | 分支/ref、提交对象、索引、远程配置等版本数据库。 | Git 本身管理，不是待提交的普通文件；用 Git 操作，不手改内部对象。 |
| `.vercel/` | 本机若连接 Vercel CLI，保存项目链接等配置。 | 忽略；本项目当前通过 Git 集成部署，不要求装 CLI，也不往仓库放 token。 |
| `.vscode/` | 本机编辑器设置。 | 现有规则忽略；个人配置不作为交接必需。 |
| `.DS_Store` | macOS 文件管理器元数据，子目录也可能出现。 | 忽略，不提交，无网站作用。 |
| `articles/` 等空残留目录 | 曾有旧静态文章的目录可能仍本地存在；Git 不跟踪空目录。 | 不表示旧文仍部署；以 `git ls-files` 和构建输出为准，本次没有删除目录。 |
| 同步暂存 `.repytorch-sync-*` | 同步器在文章目录上层创建的临时校验/输出目录，正常结束会清理。 | 不手工放内容，也不提交；异常残留先确认同步已停止、没有用户文件，再处理。 |

当前没有受 Git 管理的 `.env`、`.agents`、`.codex`、`.aws` 或 Vercel token 文件。若以后新增私密配置，先确认不会进入公开 Git 和 PR 预览；`publish: false` 也不是保密机制。GitHub Actions 的 `GITHUB_TOKEN` 由运行环境提供，不存进源码。

## 11. 文件地图以后怎么保持完整

在网站根目录用 `git ls-files` 看全部受管文件，`git status --short` 看新文件/未提交改动。新建文件还未加入 Git 前不会出现在 `git ls-files`，应结合状态一起检查。新增/删除页面、测试、资源或文章后更新本文件相应表；纯正文改字不必重写目录清单。

本次交接核对了 92 个基准受管路径，并为 4 份新手册逐一增加说明。下一次维护应重新核对，不把本次数字当固定目标。目录树说明的是逻辑层级，逐文件表才是完整清单；没有列出已删除文件为“当前文件”。
