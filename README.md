# Alpaca Personal Website

基于 Astro 的个人网站，提供中英界面切换，展示机器人规划评测、ROS2 导航项目、实习、论文与技术笔记。同步脚本从公开仓库 [`AlphaApaca/repytorch`](https://github.com/AlphaApaca/repytorch) 导入明确标记为可发布的 Markdown，形成已提交快照；普通构建和浏览器阅读正文时不会再请求源仓库。评论与留言板按需连接 Giscus。

## 技术结构

- `src/pages/`：Astro 页面，包括首页、写作索引、文章路由、About 留言板和 404
- `src/content/posts/repytorch/`：由同步脚本生成并提交到 Git 的文章快照
- `src/content/posts/essays/`：手动维护的杂文 Markdown，与自动同步内容分开存放
- `docs/writing.md`、`docs/essay-template.md`：杂文写作说明与可复制的草稿模板，不会成为网站文章
- `scripts/sync-repytorch.mjs`：从固定 GitHub 提交读取、校验并转换文章
- `src/content/posts/repytorch/snapshot.json`：来源提交与文章网址清单，包括零篇已发布文章的情况
- `.github/workflows/`：回归检查、定时同步提 PR、真实预览 HTTP 验收
- `public/`：样式、脚本与图片
- `src/data/site.mjs`：昵称、顶栏头像和首页开场文案；自行编辑说明见 `docs/site-editing.md`
- `src/pages/index.astro`、`public/workspace.css`、`public/workspace.js`：实验工作台首页、主题导航与快捷导航；根目录 `index.html` 暂保留原始项目/经历证据文案
- 根目录的 `styles.css`、`script.js` 与 public 两份：首页证据区的样式和双语桥接；翻译修改必须保持两份一致
- `public/writing-editorial.css`：文章优先的索引排版，继续使用原有分类、标签和关键词筛选
- `src/lib/first-paint.mjs`：内联首屏初始化，不等待外部功能脚本恢复语言与筛选状态
- `src/lib/evidence-copy.mjs`：构建时把旧项目/经历文案转换为共享双语属性；浏览器不再额外运行旧首页脚本
- `public/interface-state.js`、`public/workspace.js`：共享中英界面状态、日期与后续语言切换；首页证据文案仍在原有双语字典中维护
- `public/pointer-effects.js`、`public/pointer-effects.css`：短暂的点击几何脉冲，不替换系统指针，不拦截导航

## 本地开发

要求 Node.js 22.13 或更高版本、pnpm 11.19（pnpm 11 的最低 Node 要求是 22.13）。

```bash
pnpm install
pnpm dev
```

质量检查与生产构建：

```bash
pnpm check
pnpm test
pnpm build
```

静态产物生成到 `dist/`。

## 工作台视觉预览

首页以个人自述、项目与笔记的主题导航、可展开的项目证据、文章记录为主；照片、实习、论文、技能与 CPD 内容仍保留。原有 `#projects`、`#posts`、`#experience` 等锚点保持有效，指向折叠内容的旧书签会自动展开对应区域。

Astro 页面的顶栏提供 `⌘ / Ctrl + K` 快捷导航，搜索已有页面、发布文章标题与标签。它不执行命令、不请求搜索接口；关闭菜单支持 Esc 并返回触发按钮。没有 JavaScript 时，正常导航、文章链接、原生项目折叠仍可用。

各页面顶栏提供中英切换，记住同一浏览器的选择。首页、文章索引、About、阅读工具与评论提示随之切换；文章标题、简介、正文、标签和目录中的原始章节标题不做自动翻译。切换语言不清空文章筛选条件。点击特效只用于支持精细鼠标的桌面设备；触屏、减少动态效果、输入框、文本选择和拖动均不触发或会取消特效。

三篇硬编码示例文章已撤下，其旧网址返回 404，可从 Git 历史恢复。真实 Markdown 文章、稳定网址、同步来源、目录/阅读进度及 Giscus 关联键不变。顶栏使用卡通头像，页面展示名为 Alpaca，首页和 About 保留个人照片。跨页使用浏览器原生短模糊淡化、选择性预加载和提前恢复主题；顶栏保持独立静止，不支持动画或减少动态效果时照常导航。视觉阶段的历史验收记录见 [`docs/workbench-preview.md`](docs/workbench-preview.md)，此次首屏修复验收见 [`docs/first-paint-checks.md`](docs/first-paint-checks.md)。

## 从 repytorch 发布文章

允许同步的来源只有：

- `learning_log/YYYY-MM-DD*.md`
- `notes/*.md`

`README.md` 永远不会导入。文章必须在文件开头加入 YAML frontmatter，并明确写 `publish: true`：

```yaml
---
publish: true
date: 2026-10-02
category: learning-log
tags: [PyTorch, DataLoader]
summary: "理解 Dataset 与 DataLoader 的职责，并完成 FashionMNIST 数据加载练习。"
comments: true
---
```

正文仍然可以中英混写，不要求逐篇翻译。标题从正文中唯一的一级标题（`# ...`）读取；网址默认从文件名生成。如需自定义，可增加小写 kebab-case 的 `slug`。可选的 `lang` 默认是 `zh-CN`。

把 Markdown push 到 `repytorch/main` 后，在本仓库运行：

```bash
pnpm sync:repytorch
pnpm check
pnpm build
```

同步器会把生成快照写入 `src/content/posts/repytorch/`。请检查差异后将快照与网站变更一同提交。普通 `pnpm build` 只读取已提交快照，因此构建是可复现的，也不会因为 GitHub 暂时不可用而失败。

`pnpm sync:repytorch:check` 会读取快照中记录的固定提交并验证内容没有漂移；它不会用后来变化的 `main` 作为比较基准。

## 在网站仓库写杂文

杂文不需要放到 `repytorch`。复制 [`docs/essay-template.md`](docs/essay-template.md) 到 `src/content/posts/essays/`，给文件起一个名字，再填写标题、日期、简介和标签。具体步骤见 [`docs/writing.md`](docs/writing.md)。

新文章默认 `publish: false`，不会进入文章列表，也不会生成文章页面。写好后改为 `publish: true`，检查本地预览与构建，提交到网站仓库的新分支，并通过 PR 预览和人工合并发布。公开仓库中的草稿仍可在 GitHub 被读取，`publish: false` 不是保密措施。

本地文章用 `permalink` 明确指定稳定网址，例如 `my-first-essay` 对应 `/writing/my-first-essay/`；它不是同步来源中的可选 `slug`。发布后尽量保持不变，避免旧链接和评论关联失效。不要直接编辑 `src/content/posts/repytorch/`，那里仍由同步脚本维护。

## 文章索引

`/writing/` 统一展示已发布的本地文章与 GitHub 同步文章。分类包括学习日志、技术笔记和杂文；标签可以筛选，关键词搜索匹配标题、简介和标签，暂不搜索正文。分类、标签和关键词可以组合使用，筛选状态保留在网址参数 `category`、`tag`、`q` 中，便于分享同一组结果。

没有 JavaScript 时仍能浏览全部已发布文章和正文，交互筛选需要 JavaScript。已有分类以外的新 `category` 值也会自动出现在索引里；同一标签的大小写和全角差异按同一个筛选值处理。

工作流固定使用 `ubuntu-24.04` 和完整提交 SHA 的 Node 24 兼容 Actions，避免运行环境静默升级；网站构建本身仍使用 `.nvmrc` 指定的 Node 22.13.0。定时同步、权限、草稿 PR 与手动合并规则均保持不变。

## 文章阅读工具

Markdown 文章提供文章目录、阅读进度和当前章节高亮。目录收录正文的二、三级标题，使用真实标题锚点；既有锚点不改动。桌面目录固定在正文右侧，手机目录可展开与收起，点击章节后自动收起。

进度只计算 `.article-content` 正文，不把来源链接、评论或页脚算进去；短文正文底部进入视口时显示 100%，并非阅读时间或已读证明。目录链接在 JavaScript 不可用时仍可使用；实时进度和章节高亮需要 JavaScript。减少动态效果的系统偏好会关闭文章页面的平滑滚动。

## 同步安全规则

- 只有 `publish: true` 的文件会进入网站
- 来源仓库、文件路径、完整 commit SHA 与固定 source URL 会写入文章元数据
- 已发布文章间的相对链接会变成站内链接；未发布 Note、代码和其他文件会变成固定 commit 的 GitHub 链接
- 缺失链接、越出仓库的路径、重复网址、危险链接协议、无效语言标记与本机绝对路径都会使同步失败
- 自动导入拒绝所有原始 HTML；请使用 Markdown 链接、图片或代码块。代码块内的 HTML 示例可以保留
- Markdown 通过语法树处理，代码块和行内代码不会被当作链接或标题改写

## 自动同步与发布审核

`Sync published repytorch writing` 工作流合入网站默认分支 `main` 后，每小时第 17 分钟检查 `repytorch/main`，也可在 Actions 页面手动点击 Run workflow。定时任务可能延迟；公开仓库 60 天没有活动时，GitHub 可能停用定时工作流。

首次启用时，在网站仓库 Settings → Actions → General → Workflow permissions 中勾选 **Allow GitHub Actions to create and approve pull requests**。工作流只申请网站内容写入与 PR 写入权限，不需要个人令牌，也不修改源仓库。

同步在回归测试、固定快照校验、Astro 检查与构建全部通过后，创建或更新同一个 `codex/repytorch-sync` 草稿 PR。请审核文章、确认可用的预览，再将 PR 标记 Ready for review 并手动合并；工作流不批准也不合并 PR。不要在这个托管同步分支手工修改内容，发现人工改动时工作流会停止以免覆盖。

GitHub Actions 自带令牌的机器人 push 不触发其他 push 工作流；机器人创建或更新 PR 后，PR 工作流可能需要点击 **Approve workflows to run**。因此同步任务本身已包含完整校验。Vercel 的机器人提交预览仍需首次实测，可能需要部署授权；未见成功部署前，不应假定预览已生成。

## 预览与 404 验收

`Site checks` 在当前 `codex/**` 分支 push 时即可运行，不必先合并正式站。它查找**同一个完整 commit SHA** 的成功 Vercel Preview，再检查首页、写作索引、About、当前已发布文章的 HTTP 200，以及未知路径的真实 HTTP 404、自定义 404 正文、预览 `X-Robots-Tag: noindex`、404 meta noindex 与无 canonical。

`Preview HTTP acceptance` 合入 main 后也能在成功的 Vercel Preview 部署回调中验收，或从 Actions 页面手动输入本项目的 HTTPS 预览 origin。文章路径可留空，检查器会从对应版本的 `snapshot.json` 选取；零篇已发布文章时，只检查索引而不误请求已撤下的文章。

只允许本项目的 `blogofalpaca-…-alpacaxus-projects.vercel.app` 预览域名，不发送 GitHub 凭据，不绕过保护页面，不关闭 TLS 校验。部署尚未成功、访问受保护或连接失败都会明确失败，不能当作验收通过。

## 评论与留言板

网站仓库的 Discussions 承载 Giscus 评论。每篇 Markdown 文章通过 `comments: true/false` 控制显示，默认开启；三篇旧静态示例文章已撤下。

评论点击“加载评论”后连接 Giscus，发布需要 GitHub 登录。文章关联稳定的 `/writing/{permalink}/` 键，About 留言板使用独立的 `about-guestbook` 键，预览与正式站不会因主机名不同而拆散评论。严格匹配开启，backlink 指向正式域名，评论主题和语言跟随网站切换，不修改关联键。无需为验收发送测试评论或回应；新 Discussion 会在第一次真正评论或回应时创建。
