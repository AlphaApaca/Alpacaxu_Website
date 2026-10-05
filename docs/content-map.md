# 内容与页面元素修改地图

这份文档回答“我想改眼前这个元素，应该打开哪个文件”。以当前上线后的 Astro 静态网站结构为准；文件链接和定位文字比行号更耐版本变化。版本发布、分支和文章同步操作见交接总指南中的对应文档；这里先说明内容归属和修改边界。

## 1. 先认清真正的入口

| 页面 / 内容 | 真正编辑位置 | 不要误改的位置 |
| --- | --- | --- |
| 首页 `/` 的新开场、内容地图、最新文章区、各区域排列 | [`src/pages/index.astro`](../src/pages/index.astro) | 根目录 `index.html` 的旧 hero / 顶栏 / 页脚不是现在的显示入口 |
| 首页的项目证据、简介、经历、方向、技能、CPD、近期关注 | 根目录 [`index.html`](../index.html) 的指定 `<section id="…">`，配合两份旧双语字典 | 不要因为它是旧 HTML 就删掉；Astro 仍在构建时提取这些区域 |
| 文章索引 `/writing/` | [`src/pages/writing/index.astro`](../src/pages/writing/index.astro) | 不需要手写每篇文章的列表卡片 |
| 所有文章的共同外壳 | [`src/layouts/ArticleLayout.astro`](../src/layouts/ArticleLayout.astro) | 不是某一篇 Markdown 正文 |
| 关于 `/about/` | [`src/pages/about.astro`](../src/pages/about.astro) | 首页 `#about` 是技能区，不是这个 About 页面 |
| 顶栏、页脚、全站框架 | [`SiteHeader.astro`](../src/components/SiteHeader.astro)、[`SiteFooter.astro`](../src/components/SiteFooter.astro)、[`BaseLayout.astro`](../src/layouts/BaseLayout.astro) | 根目录 HTML 里的同名旧元素不控制这些组件 |
| repytorch 日志 / 笔记 | `AlphaApaca/repytorch` 源仓库的 `learning_log/`、`notes/` | [`src/content/posts/repytorch/`](../src/content/posts/repytorch/) 是同步生成快照，不手改 |
| 网站自己的杂文 | `src/content/posts/essays/*.md` | [`docs/essay-template.md`](essay-template.md) 只是模板，不会发布 |

`src/pages/index.astro` 用 `section("projects")` 等调用提取旧 HTML，而不是直接发布整个旧文档。当前必需的 ID 是 `projects`、`profile`、`experience`、`objective`、`about`、`cpd`、`notes`。**增删 section 内的卡片不会造成 section 提取缺失；删除或改名整个 section，同时没有改提取调用，会让构建失败。** 删除现有项目仍要清理导航及检查有意改变的回归预期。当前提取方式在第一个 `</section>` 停止，旧 section 内不要再嵌套新的 `<section>`，用 `div` 或 `article`。

日常验收应打开 Astro 本地开发 / 构建预览或 Vercel 预览，不使用 `file://…/index.html`。`dist/`、`.astro/` 及预览生成的 HTML 都是输出，不是内容源文件。

## 2. 双语与重复文件：先记住这三条

1. 新页面元素通常将两种文案放在同一个元素上：`data-workspace-zh="中文"` 与 `data-workspace-en="English"`。初始可见文字也应保持与其中一份一致。切换按钮只翻译标注过的界面，不会自动翻译文章标题、摘要和正文。
2. 旧首页区域使用 `data-i18n="home.…"`。对应键值在根目录 [`script.js`](../script.js) 和 [`public/script.js`](../public/script.js) 的 `translations.zh` / `translations.en` 中，**两份必须同步**。构建实际读取 `public/script.js`；根目录副本为兼容旧材料保留。`src/lib/evidence-copy.mjs` 将这些静态字典值转换为新双语属性，浏览器不再运行旧首页脚本。新的 `data-i18n` 键必须在中英字典都有静态字符串，否则构建会报缺失。
3. 基础样式也有根目录 [`styles.css`](../styles.css) 与 [`public/styles.css`](../public/styles.css) 两份。运行中的网站读取 `public/styles.css`；修改这套基础样式时同步两份。新的工作台样式只在 `public/workspace.css` 等新文件里，不必再复制到根目录。

新 HTML 文案尽量放在叶子元素上。不要把双语文本属性放在包含图标、链接或子元素的整个容器上，因为翻译使用 `textContent`，会替换容器内部结构。带引号的文案要正确转义；HTML 属性中的双引号可写 `&quot;`，JavaScript 字符串中的引号按原文件的写法转义。

首页简介和 About 有重复的个人背景说明，**不是自动互相同步**；变更毕业状态、研究方向、地点、团队贡献时检查两处。快捷导航的搜索词也不从首页卡片自动提取。

## 3. 首页逐块改什么

### 3.1 开场、昵称与联系地址

优先打开 [`src/data/site.mjs`](../src/data/site.mjs)：

| 字段 | 作用 | 同时检查 |
| --- | --- | --- |
| `site.name` | 新顶栏、About 标题、页脚、文章页面标题后缀的昵称 | `homeCopy` 的文字，以及旧字典的 `common.name`、`home.profile.avatarAlt` 等昵称文字不是自动改写 |
| `site.avatar` | 顶栏头像网址，当前 `/assets/alpaca-avatar.png` | 对应文件必须放在 `public/assets/` |
| `site.email` | About 和新页脚的 `mailto:` 收件地址 | 首页 `#profile` 的邮件链接仍写在根 `index.html` 中，需要同步；旧 hero 的邮件按钮不在新首页显示 |
| `homeCopy.zh/en.heading` | 首页两行大标题，两项数组 | 保持数组两项；中英文可以不同表达，不必直译 |
| `homeCopy.zh/en.intro` | 首页短介绍 | 首页下方 profile 与 About 另有长介绍 |
| `homeCopy.zh/en.title`、`description` | 首页浏览器标题、SEO / 分享简介 | 不会改变文章自己的标题和摘要 |

在 [`src/pages/index.astro`](../src/pages/index.astro) 搜索 `workspace-kicker`、`workspace-hero-actions`、`workspace-footnote`，分别修改开场上方 `ROBOTICS · CODE · NOTES`、两枚行动入口、下方 `MuJoCo / ROS2 / PyTorch learning` 小字。按钮 URL 分别为 `#projects` 和 `#posts`，不是外部地址。

若真的更换昵称，`scripts/site-personalization.test.mjs` 目前明确断言 `site.name === "Alpaca"`，因此还需把该条期望更新为决定采用的新昵称，并保留其他身份/隐私检查，不是删掉测试。仅换首页标题或介绍无需调整这一昵称断言。

### 3.2 右侧 CONTENT MAP

同一个首页入口中搜索 `workspace-map`：

- 节点的 `data-workspace-topic` 当前为 `planning`、`navigation`、`learning`。
- 对应详情的 `data-workspace-panel` 必须使用同一个值；节点与面板不配对，点击后会没有对应说明。
- 卡片内真正跳转的 `href` 当前为 `#planning-project`、`#navigation-project` 和 `/writing/`。面板顶部 `workspace-path` 只是显示文字，不决定跳转。
- 节点切换由 [`public/workspace.js`](../public/workspace.js) 管理；点击节点先选择面板，再点面板链接去项目。新增第四节点不只是复制文字，还要在 [`public/workspace.css`](../public/workspace.css) 调整 `.workspace-map-nodes` 的三列，以及 SVG 连线和小屏布局。
- 现有两个项目锚点由首页入口给旧卡片补上：精确匹配 `class="project-card research-card"` 与 `class="project-card rover-card"`。不要随意改这两段 class 字符串，否则原来的内容地图目标 ID 可能不再生成。

### 3.3 项目卡片与证据

打开根 [`index.html`](../index.html)，定位 `id="projects"` / `project-grid`：

| 想修改的内容 | 定位 / 操作 |
| --- | --- |
| 区域标题 | 字典键 `home.projects.kicker`、`home.projects.heading` |
| 硕士项目标题、简介、贡献、结果 | `home.projects.dissertation.type/title/summary/contribution/result`，同步两份字典中英值 |
| 流程示意图文字 | `home.projects.dissertation.visualInput/visualCheck/visualDecision/visualLabel` |
| 168 / 84 / 9,828 等数字 | 根 HTML 的 `.metric-row` 下 `<strong>`，数字本身没有翻译键；单位为 `metricTasks/metricPairs/metricRecords` |
| V.I.S.O.R. 文案 | `home.projects.leo.type/title/summary/contribution/imageAlt` |
| 项目 / 团队仓库地址 | 根 HTML 的 `.evidence-links a` 的 `href`，不是字典 |
| Leo Rover 图片 | 根 HTML `.rover-card .media-slot img` 的 `src`，当前 `assets/leo-rover-demo.jpg`；真实静态文件在 `public/assets/` |
| 卡片底部技术标签 | 根 HTML `.tags` 的 `<span>`，这是项目标签，不参与 Writing 筛选 |
| 卡片尺寸、列数、边框、悬停 | 新外观在 `public/workspace.css` 的 `.workspace-main .project-card`、`.project-grid`、`.media-slot` 等；基础网格在 `public/styles.css` |

Astro 入口把从 `.metric-row` 或 `.project-detail` 开始、直到 `.evidence-links` 前的内容包装进“方法、贡献与边界”折叠框。保留 `.evidence-links` 容器及这些顺序；没有数字的项目可以只保留 `.project-detail`。不希望新卡片使用这个规则时，应同时明确调整首页的包装逻辑，不要依靠删 class 碰巧绕过。

新增项目：在 `project-grid` 中复制一张 `<article class="project-card …">`，换内容、仓库链接、标签和资源路径；新增英文/中文翻译键，或按本文件示例直接使用 `data-workspace-*`。给新项目唯一 ID，例如 `uav-project`。项目卡片不是文章，新增它不会自动出现在 Writing。

删除项目：删除该项目的整个 `article`，保留外层 `section#projects`；同步清理 CONTENT MAP 的节点 / 面板 / href、About 中的介绍和快捷导航搜索词。字典里暂时留下未使用键不会显示，但确认没有引用后可一并清理。对已经分享的项目锚点，最好保留说明或另设兼容入口，而不是让旧链接默默失效。

### 3.4 个人简介与照片

首页简介来自根 HTML `section#profile`：修改 `home.profile.kicker/heading/p1/p2/p3/avatarAlt` 与 `common.location` 对应的中英字典。GitHub URL 与 Email URL 在 HTML 的 `.contact-row`。

首页与 About 当前共同显示 [`public/assets/portrait.png`](../public/assets/portrait.png)。想一次替换两处可以替换这个文件，保留 4:5 的构图，并检查裁切；更换文件名则分别改根 HTML `#profile img` 和 `src/pages/about.astro` 的图片 `src`。`public/assets/avatar.png` 是保留的原始照片，顶栏现在不使用它。

顶栏的卡通图是 `public/assets/alpaca-avatar.png`，由 `site.avatar` 指定；首页 / About 的证件照与它是两套独立用途。网页渲染尺寸由 `.brand-avatar`、`.workspace-main .profile-card img`、`.about-profile > img` 控制，不是仅改变图片像素就能改变网页大小。

### 3.5 经历、论文、技能、方向、CPD、近期关注

这些也来自根 HTML；初始 HTML 文字和对应两份字典一起改。

| 区域 | 定位 | 文案 / 增删方式 |
| --- | --- | --- |
| 经历与论文 | `section#experience` / `.experience-grid` | 当前实习键 `home.experience.intern.type/title/copy`；论文键 `home.experience.paper.type/meta/copy`；区域标题为 `home.experience.kicker/heading`。每条是一个 `article`，可复制或删除整条 |
| 论文标题与 DOI | 上述论文 `article` 的 `<cite>` 与外层链接 | 标题当前直接写在 HTML，不在翻译字典；DOI 和期刊指标链接也直接改 `href`。作者排序、贡献、指标年份应与实际证据一致 |
| 当前方向 | `section#objective` / `.objective-grid` | 三组 `home.objective.primary.*`、`focus.*`、`secondary.*`；每个 `article` 为一项方向 |
| 技术能力 | `section#about` / `.skill-columns` | `home.skills.roboticsTitle/roboticsCopy`、`perceptionTitle/perceptionCopy`、`softwareTitle/softwareCopy`、`practiceTitle/practiceCopy`；可增删各 `article`，新增键要双语齐全 |
| CPD 证据 | `section#cpd` / `.cpd-grid` | `home.cpd.a2/b3/d2.title/focus/evidence`；卡片最上方 A2 / B3 / D2 直接写在 HTML；公共标签为 `home.cpd.label.focus/evidence` |
| 近期关注 | `section#notes` / `.note-grid` | `home.notes.item1/item2/item3`，每项为一个 `<p>`；可以增删项及对应翻译键 |

后四块在新首页的 `.workspace-notebook` 折叠框内。要改默认折叠为展开，在首页这个 `<details>` 添加 `open`；要调整顺序，改 `section("objective") + section("about") + section("cpd") + section("notes")` 的排列。要彻底去掉一块，同时删除其提取调用和对应源 section，不要只删一边。

“更多关于我 / 留言板”链接位于 Astro 首页 `.workspace-about-link`，不是 profile 源 section。经历的链接 `/#experience` 同时被快捷导航使用。

### 3.6 最新文章区

新首页 `section#posts` 的卡片自动从已发布内容生成。当前 `const posts = (await getWritingPosts()).slice(0, 4)` 展示按日期排序的前 4 篇；要改变数量改这里。标题、简介、日期、分类和标签来自 Markdown 资料，不在首页手写。

“一点点建立自己的理解”等标题与按钮在首页 `workspace-writing` 标记下双语属性中；底部三条分类链接位于 `.workspace-writing-topics`。新分类不会自动加入这三条固定首页快捷入口，要手工增加。根 HTML 里的旧 `section#posts` 不参与这个自动列表，三篇旧静态文章已经退役，不要复制旧卡片回来。

## 4. Writing：文章内容、分类和阅读界面

### 4.1 文章的两种来源

- **学习日志 / 技术笔记**：在 repytorch 的 `learning_log/*.md` 或 `notes/*.md` 修改正文、顶部 YAML、链接和图片。同步器只处理指定范围且明确 `publish: true` 的 Markdown；网站生成目录会整体更新，手改它下次会丢失。
- **个人杂文**：在网站 `src/content/posts/essays/` 新建 / 编辑 Markdown，完整模板见 [`writing.md`](writing.md) 与 [`essay-template.md`](essay-template.md)。该目录可以有 `.gitkeep`，它不产生文章。

repytorch 源文档的标题来自正文中**恰好一个**一级标题 `# …`；可用 `slug` 固定网址，未填时从文件名推导。网站本地杂文必须填写 `title` 和 `permalink`，正文通常从 `##` 开始。不要把两种模板混用；`sourceRepo/sourcePath/sourceUrl/sourceCommit` 由同步器生成，不需要源文章自行填写。

日常最常改的 YAML 是 `publish`、`date`、`category`、`tags`、`summary`、`comments`、`lang`。标题 / 摘要 / 正文可以中英混写；`lang` 表示文章主要语言，不是强制双语开关。

### 4.2 分类、标签、搜索与排序

| 想改的内容 | 编辑位置 / 当前规则 |
| --- | --- |
| 给某篇文章分类 | 该篇源 YAML 的 `category`，当前常用 `learning-log`、`note`、`essay` |
| 给某篇文章增删标签 | 该篇 YAML 的 `tags: [PyTorch, …]`；列表标签自动收集，不需要维护另一张标签表 |
| 新标签拼写 | 全站尽量统一。列表按规范化大小写去重，但 `tags` 元数据不被自动翻译；`PyTorch` 与拼错的 `Pytorchx` 是不同标签 |
| 给新分类设置友好中英名称 | [`src/lib/writing.mjs`](../src/lib/writing.mjs) 的 `CATEGORY_LABELS`；索引页前置脚本的 `categoryCopy`；希望空分类也出现时加入 `DEFAULT_CATEGORIES`；想在首页快捷分类出现还要改 `.workspace-writing-topics` |
| 索引页大标题、介绍、边注、搜索占位文案 | `src/pages/writing/index.astro` 的 `writing-heading`、`writing-controls` 双语属性 |
| 列表排列 | `src/lib/content.ts` / `src/lib/writing.mjs`：日期从新到旧，同日再按网址排序；改 `date` 会改变位置，不是按 Git 提交时间 |
| 搜索范围 | 当前搜索标题、简介、分类显示名称和标签，不全文搜索正文；逻辑为 `writingSearchText` 与 `matchesWriting` |
| 搜索 / 分类 / 标签的分享网址 | `/writing/?q=…&category=…&tag=…`，由 `writingFilterUrl` 管理；不要把中文分类名称当作稳定分类 key |
| 搜索结果数、无结果提示 | 索引页面内的 `render()`；首屏对应提示还在 `src/lib/first-paint.mjs`。修改这两类动态文案时两处同步，防止加载前后不一致 |
| 标签选择框外观 | [`public/writing-editorial.css`](../public/writing-editorial.css) 的 `.writing-controls select`、`.writing-tag-select`、`::picker(select)`；移动端 / 不支持新 picker 的浏览器保留系统菜单是正常降级 |

删除 / 下线文章：优先将源 `publish` 改为 `false`，通过相应发布流程更新。网站不再生成该网址，旧链接可能返回 404；评论、GitHub 源文件、提交历史和搜索缓存不会自动删除。删除 repytorch 文件也需经过同步 PR 才反映到网站。

### 4.3 正文样式与右侧阅读模块

某一篇文章的正文只改 Markdown。所有文章共用的标题区、返回按钮、来源链接、评论位置在 `src/layouts/ArticleLayout.astro`；自动路由在 `src/pages/writing/[...slug].astro`，通常无需日常修改。

正文段落、代码块、图片、链接基础样式在 `public/styles.css` / `public/astro.css`，阅读布局的覆盖在 [`public/article-reader.css`](../public/article-reader.css)。目录组件 [`ArticleReader.astro`](../src/components/ArticleReader.astro) 读取二、三级标题 `##` / `###`；进度和当前节高亮由 [`public/article-reader.js`](../public/article-reader.js) 与 `article-reader-state.js` 计算。想“增加目录条目”，先给正文添加正确的二、三级标题，不要手写目录 HTML。

移动端会把目录移到正文上方并折叠，桌面端在右侧；断点在阅读 CSS 和 JS 中均为 `1050px`，改断点时两者同步。目录 / 进度的中文英文标签在 `ArticleReader.astro`、`article-reader.js`、首屏 `first-paint.mjs` 中各有用途，改标签要检查三处。

发布后尽量不改源 `slug` / 本地 `permalink`：网址 `/writing/{标识}/` 同时是文章评论关联键。修改文件名不必改变固定标识。若确实要迁移 URL，应先设计旧 URL 到新 URL 的永久重定向及评论迁移方案；当前没有自动完成这项迁移的功能。

## 5. About、导航、页脚、评论和 SEO

### 5.1 About 与共用导航

About 所有个人段落、`Currently exploring` / “正在探索”、GitHub 链接、地点均在 `src/pages/about.astro`。改各段两份 `data-workspace-zh/en`，同时检查首页 profile 的重复介绍。About 文案的 `localizedMeta.zh/en` 管理其页面标题与简介。

新增一个顶栏入口：在 `SiteHeader.astro` 的 `.nav-links` 添加带真实 `href` 的链接和双语属性；新增页面则在 `src/pages/` 建对应 `.astro` 并复用 `BaseLayout`。若希望能通过 ⌘ / Ctrl + K 找到，还要在 `WorkspaceTools.astro` 的 `destinations` 加入该页面。导航数量变化后检查桌面居中、小屏两行布局及键盘使用；不要仅缩字号来掩盖溢出。

页脚固定文案、版权年份、`Build things. Leave notes.` 在 `SiteFooter.astro`，邮件地址来自 `site.email`。当前这些固定英文短句没有双语属性；想让它们切换语言，按第二节给单独文本节点补双语属性。旧根 HTML 页脚不控制正式页脚。

### 5.2 评论与留言板

[`src/components/GiscusComments.astro`](../src/components/GiscusComments.astro) 集中管理评论标题、说明、加载按钮、错误提示与 Giscus 参数。现有参数是网站仓库 `AlphaApaca/Alpacaxu_Website`、分类 `Announcements`，`mapping: "specific"`、`strict: "1"`。这不是用户最初粘贴的 pathname 模式，当前已改成固定 key 来避免预览域名分裂评论。

- 某篇文章开启 / 关闭评论：改其 YAML `comments: true/false`。隐藏入口不删除现有 GitHub Discussion。
- About 留言板：About 调用 `<GiscusComments term="about-guestbook" guestbook />`；**保留 `about-guestbook`**，只改标题、说明不要改这个 term。
- 文章关联键：`/writing/{permalink}/`，由动态文章入口传入。
- 修改仓库 / Discussion 分类：`repo`、`repo-id`、`category`、`category-id` 必须是配套配置，并同步评论区的 GitHub Discussions 链接。换到新仓库不会自动搬走历史评论。
- 评论按“加载评论”后才连接外部 Giscus，登录才能发布；评论 / 留言在 GitHub Discussions 公开。不要为加一句提示重新安装或重新授权。

评论入口样式在 `public/astro.css` 的 `.comments-*`，嵌入 iframe 内部主题由 Giscus 控制，不是本地 CSS 可直接任意改的 DOM。界面主题 / 语言跟随网站选择。

### 5.3 SEO、域名与浏览器图标

图标是 [`public/favicon.svg`](../public/favicon.svg)；可以编辑 SVG 或改 `BaseLayout.astro` 中 favicon 的 URL 和类型。通用 `<head>` 中 canonical、Open Graph、Twitter card 在 `BaseLayout.astro`。首页 SEO 在 `homeCopy`，索引页 / About / 404 的 SEO 在各页 `localizedMeta`，文章 SEO 来自 `title` 与 `summary`。

主域名由 [`astro.config.mjs`](../astro.config.mjs) 的 `site: "https://www.alpacaxu.cn"` 决定。真要换域名，还需核对 `BaseLayout.astro` / `ArticleLayout.astro` 中备用域名、About 固定 `giscus:backlink`、部署与 DNS、预览检查的预期值，以及旧域名重定向。不是仅把首页某个链接改掉；不要在一次普通文案 PR 里顺手改域名。

404 页面文案和返回按钮在 [`src/pages/404.astro`](../src/pages/404.astro)，它明确 `noindex`，没有 canonical。新页面应复用共同布局，不能把旧完整 HTML 的 `head`、`body` 再套进 `main`。

## 6. 主题、动画、点击与快捷菜单

| 功能 | 维护位置 | 不要破坏的边界 |
| --- | --- | --- |
| 浅 / 深色配色 | `public/styles.css` 的 `:root` 和 `:root[data-theme="dark"]`：`--bg`、`--surface`、`--surface-soft`、`--text`、`--muted`、`--line`、`--accent`、`--accent-strong`、`--shadow` | 一次改两套主题，检查正文、代码块和对比度；同步根 `styles.css` |
| 全站布局、首页新样式、顶栏居中 | `public/workspace.css` | 顶栏三列 grid、`scrollbar-gutter: stable`、隐藏增强按钮预留位置是稳定首屏的一部分 |
| 索引页排版 | `public/writing-editorial.css` | 它覆盖基础 `astro.css`，改基础规则可能被覆盖 |
| 文章与 About 基础外观 | `public/astro.css`，正文还继承 `public/styles.css` | 文章目录专用几何在 `article-reader.css` |
| 600ms 跨页淡入 | `public/workspace.css` 的 `page-content-enter`、`::view-transition-new(root)`、`::view-transition-group(page-content)`、`::view-transition-new(page-content)` | 当前三处均 600ms；保留旧快照不透明、顶栏不位移、过渡不拦点击。普通刷新不播放跨页动画 |
| 动画提前开启与完整首屏 | `BaseLayout.astro` 的 `page-transition-policy` 内联样式、`rel="expect"` 和 `page-content-ready` 标记 | 不移到下载较晚的独立 CSS；不删除主内容后的标记，不在文章中重复同名 ID；不添加隐藏整个 body 的“修复” |
| 保存语言 / 主题 | `src/lib/first-paint.mjs` 先初始化；`public/workspace.js` 后续语言切换；`BaseLayout.astro` 后续主题切换 | 保持同一个 `alpaca-lang` / `alpaca-theme` 存储 key，避免加载前后选择不同 |
| 点击几何脉冲 | `public/pointer-effects.css` 外观与 480ms 动画，`public/pointer-effects.js` 判定与清理 | 保留系统指针，触屏 / 减少动态关闭，输入框 / 拖选不触发；局部元素可添加 `data-pointer-effects="off"` |
| 快捷菜单入口与内容 | `WorkspaceTools.astro` 的 `destinations`；文章自动从发布内容加入；`workspace-command` CSS | 单个目的地字段是 `url/title/zh/en/search`；文章不用手动加入 |
| 快捷菜单交互、内容地图、旧锚点展开 | `public/workspace.js` 与 `workspace-state.js` | 保留 Esc、⌘ / Ctrl + K、返回焦点和原生链接；不要绕过键盘操作 |

网站当前是普通静态多页面，不是 SPA；没有全屏加载遮罩，也没有跨页模糊效果。原生过渡在支持的浏览器中增强，其他浏览器正常导航，系统“减少动态效果”时关闭。不要用浏览器缺少动画来判定文章或页面没有发布。

技术设置的“当前预期”也受测试保护。例如有意调整 600ms 时长，要同步审查 `scripts/first-paint-style.test.mjs` 与 `scripts/site-personalization.test.mjs` 的时长断言，并重新浏览器验收；有意撤下现有项目/导航时检查 `scripts/workspace-state.test.mjs`。更新决定改变的期望，不删除首屏稳定性、点击可用性或无障碍保护来让测试变绿。

## 7. 两个可照着做的最小例子

### 例 A：只改首页两行标题和介绍

1. 打开 `src/data/site.mjs`，仅替换 `homeCopy` 中以下字段，保留现有 `title` / `description` 等其它字段：

```js
// homeCopy.zh 内
heading: ["慢慢做，", "慢慢记。"],
intro: "这里放我的机器人实验、代码，以及还没想明白的问题。",

// homeCopy.en 内
heading: ["Build at my pace.", "Keep the notes."],
intro: "Robotics experiments, code, and questions I am still figuring out.",
```

2. 若想让浏览器标题 / 分享简介也一起变，分别改 `homeCopy.zh/en.title`、`description`。不需要改旧 `home.hero.copy`，它不控制现在的开场。
3. 开启本地开发预览，检查中英文、深浅色与手机宽度；完成检查后走开发分支 → PR → 预览 → 合并的发布流程。修改一句介绍不需要动路由、Giscus、同步快照或框架配置。

### 例 B：将整理好的 UAV 演示加入项目区

当前只有 `public/assets/uav-control-diagram.png` 资源，**没有现成的 UAV 卡片或视频模块**。下面是可新增的最小 HTML 方案，不代表它已经上线：

1. 准备经授权可公开的 MP4 和封面，分别放到 `public/assets/uav-demo.mp4`、`public/assets/uav-demo-cover.jpg`。大视频优先考虑外部视频平台 / 对象存储，把下面地址改成真实外部 HTTPS URL；不要默认把大体积实验原片推入 Git。
2. 在根 `index.html` 的 `.project-grid` 内、现有两张项目卡片后插入：

```html
<article class="project-card uav-card" id="uav-project">
  <div class="media-slot">
    <video controls playsinline preload="none"
      poster="/assets/uav-demo-cover.jpg"
      style="display:block;width:100%;max-height:210px;object-fit:contain"
      aria-label="UAV 实验演示"
      data-workspace-aria-zh="UAV 实验演示"
      data-workspace-aria-en="UAV experiment demo">
      <source src="/assets/uav-demo.mp4" type="video/mp4">
      <a href="/assets/uav-demo.mp4">Download video</a>
    </video>
  </div>
  <p data-workspace-zh="UAV 实验" data-workspace-en="UAV experiment">UAV 实验</p>
  <h3 data-workspace-zh="我的 UAV 控制实验"
      data-workspace-en="My UAV control experiment">我的 UAV 控制实验</h3>
  <span data-workspace-zh="在这里写已经完成的实验、条件和结果。"
        data-workspace-en="Describe the completed experiment, conditions, and result.">在这里写已经完成的实验、条件和结果。</span>
  <div class="project-detail">
    <strong data-workspace-zh="个人贡献" data-workspace-en="My contribution">个人贡献</strong>
    <span data-workspace-zh="在这里明确哪些控制代码和实验由你完成。"
          data-workspace-en="State which control code and experiments you completed.">在这里明确哪些控制代码和实验由你完成。</span>
  </div>
  <div class="evidence-links">
    <a href="/assets/uav-demo.mp4"
       data-workspace-zh="查看演示视频 ↗"
       data-workspace-en="Open demo video ↗">查看演示视频 ↗</a>
  </div>
  <div class="tags"><span>UAV</span><span>Control</span></div>
</article>
```

3. 将占位介绍替换成真实实验说明；若有公开控制仓库，在 `.evidence-links` 再加真实仓库链接，外部新窗口链接使用 `target="_blank" rel="noopener noreferrer"`。若视频涉及人员语音、第三方画面或隐私，先处理授权、静音或脱敏；有重要语音内容时补字幕或文字说明。
4. 这张卡片已经可通过 `/#uav-project` 分享；最小方案不修改现有三个 CONTENT MAP 节点。要让快捷菜单找到它，在 `WorkspaceTools.astro` 的 `destinations` 增加：

```js
{ url: "/#uav-project", title: "UAV", zh: "UAV 控制实验", en: "UAV control experiment", search: "uav drone 无人机 控制 实验" },
```

5. 构建并检查项目区三张卡片在桌面 / 手机的排列、视频封面、点击播放、暂停、中英切换和折叠贡献。大视频在网络慢时不应阻塞首屏，所以使用 `preload="none"`，不要加入自动有声播放。要继续美化视频框，可将这里最小示例的内联样式移到 `public/workspace.css` 的 `.uav-card video`，然后单独验收。

## 8. 每次改完的检查与保密边界

常规内容修改后运行 `pnpm check`、`pnpm test`、`pnpm build`，再检查真正的本地 / Vercel 预览。静态 `pnpm preview` 读上一次构建结果，内容改后要先重新构建。只改一个页面也要点一下首页、Writing、About，因为布局、双语和主题是共用的。

重点人工确认：两个语言按钮、深浅色、手机宽度、项目外链、文章筛选、正文图片 / 链接 / 代码、目录与评论加载入口。发布 / 删除文章后确认数量和网址；不要通过在生成目录里删文件来“修复数量”。细节验收见 [`first-paint-checks.md`](first-paint-checks.md)。

本项目和来源仓库公开。`publish: false` 只决定网站是否生成文章，不会把 GitHub 文件或历史变成私密；未合并的 PR 和部署预览也可能公开。不要把密钥、Token、内部资料、未授权个人照片、真实本机绝对路径、隐私数据或不能公开的实验材料放进它们。邮件、项目仓库和外部论文仍可能识别身份，“页面不显示真实姓名”不是匿名化。

同步器会阻止发布含绝对本机路径、缺失相对链接目标、危险链接协议或原始 HTML 的源 Markdown。报错记录可以展示，但路径要脱敏或改相对路径；没有入库的模型文件可写“本地运行生成”，不必伪造链接或上传模型。代码块里的 HTML 示例与可执行原始 HTML 是不同情况。

保留稳定的文章 `slug/permalink`、评论 term、现有项目锚点与首屏保留标记。涉及这些标识、域名、删除源目录或自动化权限的变更，先做迁移 / 回退设计，再作为独立 PR 处理。
