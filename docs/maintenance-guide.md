# Alpaca 网站正式交接手册

交接日期：2026-10-05（北京时间）。代码基准为网站 `main` 的 `1d3bb3328d98c4e4586b97e22676359c4ae643fa`：过渡修复与 Build Model 文章均已合并。本次交接只补充文档，不重构页面、不更换框架、不修改评论或自动同步配置。

这套文档按“先找到位置，再操作，再发布”的顺序组织。日常维护不需要一次读完所有源码。

## 1. 从哪里开始

| 你要做的事 | 阅读入口 |
| --- | --- |
| 修改首页、项目、照片、介绍、导航、About、样式或互动 | [页面元素修改地图](content-map.md) |
| 理解某一层目录、某个文件、旧文件与新文件的关系 | [完整目录与逐文件索引](file-reference.md) |
| 新建分支、提交、预览、合并、回退、发布文章或排查同步 | [版本控制与文章发布流程](publishing-guide.md) |
| 了解架构、技术栈、环境、命令与外部服务 | 继续阅读本手册 |
| 复制一篇本地杂文的起点 | [杂文模板](essay-template.md)与[详细写作说明](writing.md) |

最常改的三个入口：

- 昵称、邮箱、首页开场：[`src/data/site.mjs`](../src/data/site.mjs)。
- 学习日志与技术笔记：去源仓库 [`AlphaApaca/repytorch`](https://github.com/AlphaApaca/repytorch) 修改，不改网站的生成副本。
- 杂文：在 [`src/content/posts/essays/`](../src/content/posts/essays/) 新建 Markdown，通过网站 PR 发布。

## 2. 当前项目的边界

| 项目项 | 当前状态与维护位置 |
| --- | --- |
| 网站代码仓库 | [`AlphaApaca/Alpacaxu_Website`](https://github.com/AlphaApaca/Alpacaxu_Website)，正式分支 `main` |
| 内容源仓库 | [`AlphaApaca/repytorch`](https://github.com/AlphaApaca/repytorch)，同步读取 `main` |
| 正式域名 | [www.alpacaxu.cn](https://www.alpacaxu.cn/)，canonical 基准在 `astro.config.mjs` |
| 托管平台 | Vercel；项目 `blogofalpaca`，团队路径 `alpacaxus-projects`；设置保存在 Vercel 控制台及 `vercel.json`，不是全都在代码里 |
| 页面 | `/`、`/writing/`、`/writing/{permalink}/`、`/about/`；未知网址返回自定义 404 |
| 本次内容快照 | 9 篇已发布文章；来源提交 `89fba16cc63f43a938e32f71c1ee4008201c513b`，详见 `src/content/posts/repytorch/snapshot.json`；这不是未来必须固定的数量或 SHA |
| 评论 | Giscus + 网站仓库 GitHub Discussions，类别 `Announcements`；加载评论才连接外部服务，发表需 GitHub 登录 |
| 导航与界面 | 中英切换、明暗主题、快捷导航、文章筛选和阅读目录；正文仍保持作者原文 |
| 跨页过渡 | 浏览器原生跨文档过渡，默认 600ms 淡入；顶栏静止、旧画面作兜底；不支持或减少动态效果时正常跳转 |
| 还未提供 | 在线写作后台、站内注册账户、数据库、全文正文搜索、RSS、正式 UAV 项目内容；有保留的 UAV 图片不等于已上线 UAV 项目 |

代码仓库 `main` 更新会进入 Vercel 正式部署流程，但“已合并”不等于“部署成功”；正式效果要等对应部署 Ready 后核对。自定义域名、DNS、部署保护、Giscus 授权和 GitHub Actions 权限是账户侧设置，不会随着 Git 克隆完整复制。

## 3. 内容如何变成网站

```text
repytorch 的 learning_log / notes（publish: true）
  → 网站同步工作流读取固定来源提交
  → 网站仓库的 repytorch Markdown 快照 + snapshot.json
  → 草稿 PR → 人工审核合并到网站 main
                                      ↓
网站的 Astro 页面 / site.mjs / 本地杂文 → Astro 构建 → dist/ → Vercel 静态托管
                                                              ↓
                                                     用户浏览页面
                                                              ↓ 点击加载评论
                                                    Giscus → GitHub Discussions
```

要分清三件事：

1. **源内容**：自己的文章、照片、项目文案和源码，日常在这里改。
2. **已提交的同步快照**：`src/content/posts/repytorch/`，由导入器更新，是正式构建的输入；不是写作入口。
3. **本机生成物**：`dist/`、`.astro/`、`node_modules/`，可以重新生成，不是发布内容的编辑入口。

普通 `pnpm build` 读取已提交快照，不拉取最新 repytorch。源仓库 push、网站内容 PR、网站正式部署是三个不同步骤；文章不会因为只 push 到源仓库就立刻出现在正式网站。

## 4. 全部直接技术栈与具体使用方式

以下版本来自交接基准的 `package.json`、`.nvmrc` 和配置，不代表各软件当日的最新版本。底层传递依赖的精确版本以 `pnpm-lock.yaml` 为准，通常不直接编辑它们的源代码。

### 4.1 网站与本地工具

| 技术 / 版本 | 在项目中做什么 | 具体怎么使用 |
| --- | --- | --- |
| HTML / CSS / 原生 JavaScript | 页面结构、响应式布局、主题、筛选、菜单、点击反馈；原始静态站也使用这三者 | 编辑 `.astro` 页面及 `public/` 对应样式/脚本；浏览器行为不是 React/Vue 组件 |
| Astro `7.3.5` | 构建静态 HTML；文件路由、布局、组件、Markdown 内容集合、悬停预取 | `pnpm dev` 开发；`pnpm build` 构建；页面在 `src/pages/`，共用框架在 `src/layouts/`；配置在 `astro.config.mjs` |
| TypeScript `6.0.3` | 校验 `.ts` 与 Astro 组件中的数据/接口；不需要另起 TypeScript 服务 | 修改 `src/content.config.ts`、`src/lib/content.ts` 及 Astro 前置代码；严格配置见 `tsconfig.json`；运行 `pnpm check` |
| `@astrojs/check` `0.9.10` | Astro/TypeScript 的代码诊断 | `pnpm check`；它不是浏览器视觉测试，也不代替 `pnpm test` |
| Node.js 基准 `22.13.0` | 运行 Astro、内容导入、HTTP 检查、测试；不作为正式网站的常驻服务器 | `.nvmrc` 固定团队基准；`package.json` 要求 `>=22.13.0`。CI 用 `.nvmrc` 安装 Node；修改基准需另开升级 PR |
| pnpm `11.19.0` | 安装和锁定依赖、执行项目命令 | `packageManager` 固定版本；`pnpm install --frozen-lockfile` 按现有锁文件安装，`pnpm-workspace.yaml` 允许 esbuild 构建脚本 |
| Astro 内部 Vite `8.3.2` / esbuild `0.28.2` | 开发服务、模块打包与构建支持；属于传递依赖，由 Astro 及锁文件管理 | 不另建 Vite 配置，也不手工改 `node_modules`；功能升级通过直接依赖和锁文件审查 |
| Astro Markdown 的 Shiki `4.5.0` | 构建时给文章代码块做语法高亮，输出静态 HTML | 使用带语言名的 fenced code block，例如三反引号后写 `python`；没有另装浏览器高亮脚本 |
| Markdown + YAML frontmatter | 文章正文及发布日期、分类、标签等资料 | 学习日志用源仓库格式，本地杂文用 `docs/essay-template.md`；两套元数据差异见发布指南 |
| Astro Content Collections + `glob` loader + `astro/zod`（底层 Zod `4.6.5`） | 扫描 `src/content/posts/**/*.md`，验证资料，筛选 `publish: true` 后生成文章路径 | 修改 `src/content.config.ts` 定义规则，`src/lib/content.ts` 读取集合；不要为了绕过坏文章直接取消校验 |
| Node 原生 `node:test` / `node:assert` | 无额外测试框架的行为、内容、状态与样式回归 | `pnpm test` 执行 `scripts/*.test.mjs`；需要检查具体问题时可运行 `node --test scripts/某文件.test.mjs` |

静态 Astro 部署不需要添加服务端 Vercel adapter；本项目没有安装 `@astrojs/vercel`。[Astro 静态部署说明](https://docs.astro.build/en/guides/deploy/vercel/)

### 4.2 同步器的 Markdown 工具链

这些包由 `scripts/sync-repytorch.mjs` 使用，不是在每个读者浏览器里联网解析 GitHub 文章。

| 依赖 / 版本 | 具体功能 | 使用位置与操作 |
| --- | --- | --- |
| `gray-matter` `4.0.3` | 把开头 YAML 与正文分开，读发布开关和文章资料 | 同步器 `matter(source)`；文章作者只填写 frontmatter，不必直接调用这个包 |
| `unified` `11.0.5` | 组织 Markdown 解析与输出处理流程 | 同步器的 `markdownProcessor`；改转换规则时才修改它 |
| `remark-parse` `11.0.0` | 把 Markdown 解析成语法树 | 找真实 H1、链接、图片，避免把代码示例当作普通链接乱改 |
| `remark-gfm` `4.0.1` | 解析 GitHub 风格表格、任务列表等语法 | 接在同一同步流水线中；作者按普通 GFM Markdown 写 |
| `unist-util-visit` `5.1.0` | 遍历语法树节点 | 校验/重写链接与图片，拒绝原始 HTML、危险协议等 |
| `remark-stringify` `11.0.0` | 把处理后的语法树写回 Markdown | 生成可提交的文章快照；生成格式与源文换行可能不同，内容仍以源仓库为准 |

同步不是上传模型、运行文章里的 Python 或验证实验结论。它处理 Markdown、元数据和链接；错误日志可以写进文章，但当前规则会拒绝其中的本机绝对路径。路径脱敏后仍可保留完整报错含义。

### 4.3 浏览器原生机制

| 机制 | 实际用途 | 维护入口 / 边界 |
| --- | --- | --- |
| DOM 事件与 JavaScript ES modules | 按钮、搜索、分类、菜单、指针反馈等交互 | `public/workspace.js` 及状态模块；依赖浏览器，不增加前端框架 |
| `localStorage` | 记住明暗主题及中英选择 | `alpaca-theme`、`alpaca-lang`；只在同一浏览器/域名生效，存储被禁仍可切换；不同预览域名不共享偏好 |
| `URLSearchParams` / History API | `category`、`tag`、`q` 筛选状态，可分享网址、后退恢复 | Writing 页面和 `public/interface-state.js`；没有正文全文搜索接口 |
| `MutationObserver` / `ResizeObserver` / `requestAnimationFrame` | 解析期提前本地化、主题/语言更新、目录与阅读进度 | `src/lib/first-paint.mjs`、`public/article-reader.js`；不是遥测或后台轮询 |
| CSS Grid / Flex、CSS 变量与媒体查询 | 桌面居中导航、移动端布局、明暗色彩、标签控件 | `public/workspace.css`、`public/writing-editorial.css`、`public/article-reader.css` 等 |
| 原生 `@view-transition` / `view-transition-name` | 普通站内跨页导航的 600ms 单向淡入 | head 内联策略在 `BaseLayout.astro`，动画在 `public/workspace.css`；没有 SPA `ClientRouter`、没有全屏等待遮罩 |
| HTML `rel="expect" blocking="render"` | 支持的浏览器等主内容 HTML 解析完成后抓取新页面快照 | `page-content-ready` 是布局保留 ID；不等待全部图片、评论或脚本，不在文章里重复这个 ID |
| Astro hover prefetch | 悬停站内链接时选择性预取 | `astro.config.mjs` 与组件的预取属性；不是把所有外部 GitHub 页面都预取 |
| 原生 `<details>`、锚点、表单控件 | 项目折叠、目录导航、标签选择，保持无 JS 基础可用 | 不改关键 ID，不把所有导航改成脚本点击；减少动态效果/触屏下会降级 |

首屏脚本、动画开关和顶栏占位是为解决已验收的闪烁/位移问题而保留的结构。只改文案时不要移动 head 内联脚本、删除结束标记或重新加入整页隐藏；历史证据见 [首屏修复记录](first-paint-checks.md)。

### 4.4 版本、自动化与托管

| 技术 / 服务 | 在项目中做什么 | 具体用法与负责位置 |
| --- | --- | --- |
| Git | 提交历史、分支、合并、可审计回退 | 每项改动开独立 `codex/` 分支；完整命令与命名建议见发布指南 |
| GitHub repositories / Pull Requests | 保存代码和文章，PR 审核发布变更 | 网站与 repytorch 两仓库职责分开；正式网站只从网站 `main` 部署 |
| GitHub REST API + Node 原生 `fetch` | 导入固定来源提交；解析精确 SHA 的 Vercel 部署记录 | `scripts/sync-repytorch.mjs`、`scripts/check-preview.mjs`；不是用网页抓取替代代码 API |
| GitHub Actions | 回归检查、定时同步、预览 HTTP 验收 | `.github/workflows/ci.yml`、`sync-repytorch.yml`、`preview-acceptance.yml`；网页入口在网站仓库 Actions |
| `actions/checkout` v7.0.1、`actions/setup-node` v7.0.0 | CI 取精确修订、安装 `.nvmrc` 对应 Node | 已使用完整 commit SHA 固定版本；其 Action 运行时是 Node 24，不等于网站构建的 Node 22.13.0 |
| `peter-evans/create-pull-request` v8 | 同步通过后创建/更新唯一内容草稿 PR | 固定 SHA；托管分支为 `codex/repytorch-sync`，不自动批准或合并，不供人工改页面 |
| Vercel Git integration / 静态托管 | 分支预览、main 正式部署、域名与 HTTPS | `vercel.json` 指定安装、构建与 `dist`；通常无需运行 Vercel CLI；对应 SHA 的成功部署才是本轮结果 |
| Giscus + GitHub Discussions | 文章评论与 About 留言板，GitHub 登录 | `src/components/GiscusComments.astro` 存公开配置；文章 term 为稳定路径，About 为 `about-guestbook` |

三个工作流不能混为一谈：

- **Site checks**：测试、固定来源快照校验、Astro 检查与构建；`codex/**` push 另验收同一个提交的预览 200/404/noindex。
- **Sync published repytorch writing**：读取源仓库新内容，校验后提内容草稿 PR；定时或手动运行，手动必须选 `main`。
- **Preview HTTP acceptance**：验收预览的 HTTP 状态和禁止索引配置；不导入新文章，也不测试你是否能看见动画。

## 5. 本地环境与命令速查

### 5.1 一次性准备

先安装 Git、Node.js 与项目指定 pnpm。若已使用 nvm，在项目目录运行 `nvm install`、`nvm use` 即按 `.nvmrc` 选择 Node；nvm 是可选环境管理工具，不是项目依赖。

确认版本：

```bash
git --version
node --version
pnpm --version
```

期望 Node 不低于 22.13.0，日常尽量使用 `.nvmrc` 的基准；pnpm 为 11.19.0。如果 pnpm 未安装，可以按[官方安装说明](https://pnpm.io/installation)安装指定版本，或使用项目 Vercel/CI 同样的入口：

```bash
npx --yes pnpm@11.19.0 install --frozen-lockfile
npx --yes pnpm@11.19.0 dev
```

这个 `npx` 入口会从软件包注册表取得指定版本的 pnpm，首次需要网络；并非必须全局安装多个包管理器。版本一致后，后面的例子统一写作 `pnpm`。

### 5.2 常用命令

在网站仓库根目录运行；源仓库的 Python 环境不参与网站构建。

| 命令 | 作用 | 是否修改文件 / 需要网络 |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | 严格按锁文件安装依赖 | 生成本机依赖，首次需网络；不会更新已有锁文件 |
| `pnpm dev` | 可热更新的开发预览 | 首次需已安装依赖；默认地址通常为 `http://localhost:4321/`，端口被占时以终端输出为准 |
| `pnpm check` | Astro/TypeScript 检查 | 可能生成 `.astro/` 类型文件；不发布，不等于视觉验收 |
| `pnpm test` | 执行所有回归测试 | 不导入最新文章、不发布；部分测试使用临时目录/模拟请求，不需要真实账户留言 |
| `pnpm build` | 生产静态构建 | 重建 `dist/`、可能更新 `.astro/`；正常构建不联网同步源仓库 |
| `pnpm preview --host 127.0.0.1 --port 4175` | 预览已经构建的 `dist/` | 启动本机服务；需先 build。已有 4175 服务时别再启动第二个，可以另用 4176 |
| `pnpm sync:repytorch` | 手动导入最新 repytorch/main | **会替换生成快照**；需要 GitHub API 网络，不自动提交、不提 PR、不发布。日常推荐网页工作流 |
| `node scripts/sync-repytorch.mjs --dry-run` | 读取/校验源内容，不替换快照 | 需网络；仍可能创建清理掉的临时工作目录，不会写正式内容或 PR |
| `pnpm sync:repytorch:check` | 核验已提交快照与其固定来源提交相符 | 需网络；**不检查是否已经收到了 repytorch 的最新 main**，不替换正式快照 |

开发预览会热更新；静态预览需要每次改动后 `pnpm build` 再刷新。不要通过 `file://.../index.html` 验收网站，根 HTML 不是当前独立入口。停止自己启动的服务，在对应终端按 Ctrl+C；不随意停止他人正在使用的服务。

PR 前最低检查：

```bash
pnpm check
pnpm test
pnpm build
git diff --check
```

涉及导入规则或文章快照，再执行 `pnpm sync:repytorch:check`。CI 无法连接 GitHub 时，普通构建通过也不等于来源校验通过；网络失败要按原始错误处理，不随意移除检查。

## 6. 外部服务与账户侧设置

| 设置 | 在哪里 | 平时是否需要改 |
| --- | --- | --- |
| 代码与 PR 权限 | 网站 GitHub 仓库 Settings / Collaborators | 单人维护通常无需新增授权；不要把令牌写进仓库 |
| 同步机器人可创建 PR | Settings → Actions → General → Workflow permissions | 已启用；若出现 not permitted，再确认该项及上层策略。它是允许，不是自动批准/合并 |
| 定时同步是否启用 | Actions → Sync published repytorch writing | 每小时计划检查，不保证准点；有急需内容就手动 Run workflow/main |
| Discussions 与 Giscus App | 网站仓库 Settings → Features / GitHub App 安装范围 | 已接通；换仓库/分类才重新取得匹配的 repo/category ID |
| 评论资料 | GitHub Discussions | 不存储在网页文件里；移除文章并不自动删除历史留言 |
| Vercel 生产分支、构建配置 | Vercel 项目 Settings + `vercel.json` | 当前 main；迁移部署才调整，文案变更不需重建项目 |
| 自定义域名、DNS 与 HTTPS | Vercel Domains 及域名服务商 | Git 不备份 DNS；迁域需记录现有配置、同步 canonical 与文章 backlink |
| Preview 部署保护 | Vercel Deployment Protection | 按公开/私有预览需求决定；受保护预览会使无凭据 HTTP 验收失败，不默认要求关闭全项目保护 |

脚本认识的环境变量：

| 名称 | 默认 / 用途 | 注意 |
| --- | --- | --- |
| `REPYTORCH_REPOSITORY` | 默认 `AlphaApaca/repytorch`，本地导入源 | 工作流当前依然面向固定源；换来源属于功能修改，需审查路径/链接/权限 |
| `REPYTORCH_REF` | 默认 `main`，指定导入修订；check 未设置时读取现有快照 SHA | 本地临时指定完整 SHA 可复现旧源内容；不要用它假装最新文章已发布 |
| `GITHUB_TOKEN` | 工作流自动提供的 GitHub API 权限；本地可选 | 不写实际值、不截图令牌、不放进前端 `public/` 或文章。现有流程不要求新增个人令牌 |
| `PREVIEW_URL` | 手动 HTTP 验收的本项目预览 origin | 不填正式域名、任意外站、页面路径或凭据；详见检查器与发布指南 |
| `PREVIEW_ARTICLE_PATH` | 可选真实已发布文章路径 | 空值从相应快照选文章；不能用不存在的草稿当验收地址 |
| `PREVIEW_COMMIT` / `PREVIEW_BRANCH` | 自动定位同一提交的成功非生产部署 | 工作流设置；不要手工替换成旧部署，误把旧网页当新版本 |
| `ASTRO_TELEMETRY_DISABLED` | CI 中关闭 Astro 遥测的运行选项，本地也可临时使用 | 不影响文章内容或浏览器评论；不假定 Vercel 控制台已另行配置同名变量 |

Giscus repo/category ID 是公开配置，不是访问令牌；真正敏感的密钥不得提交。公开仓库的 `publish: false`、隐藏页面、未合并 PR 都不提供保密，历史提交和可访问的部署也可能保留旧内容。昵称展示同样不等于匿名，邮箱与外部链接仍可能关联身份。

## 7. 升级技术版本与历史结构

日常文案、文章和图片变更，通常不升级依赖。需要升级时，单独建立 `codex/chore-…` 分支，避免和一批内容改动混在同一 PR：

1. 记录现有 Node / pnpm / Astro / TypeScript 版本及基准提交，阅读目标版本的官方迁移说明。
2. 明确目标版本，只升级相关直接依赖；按 pnpm 更新 `package.json` 与 `pnpm-lock.yaml`，不手改锁文件、不删除它来回避冲突。
3. 如果改 Node，同步检查 `.nvmrc`、`engines.node`、Vercel 项目兼容性；如果改 pnpm，检查 `packageManager`、`vercel.json`、所有工作流的安装命令。
4. GitHub Actions 当前固定完整 SHA；升级 action 时同步更新 SHA 与说明。Action 自身的 Node 运行时和网站构建 Node 是两层，不用把两者强行写成同一数字。
5. 跑完整检查，查看新锁文件差异，并在预览实测中英首帧、动画、标签选择、目录/进度、评论加载、移动端与 404。升级可能改变浏览器支持或 Astro 解析方式，测试通过不是全部浏览器保证。
6. 经 PR 审核再发布；失败按[发布指南](publishing-guide.md)通过可审计回退处理，不用 force push 覆盖 main。

早期网站是根目录 `index.html + styles.css + script.js + assets/` 的静态站，后来接入 Astro，但部分首页项目/经历内容仍由原 HTML 桥接，旧双语字典保留在 root/public 两份脚本里。这不是两套同时发布的网站。不要在交接时顺手删除历史文件；它们的现行调用和副本关系均在 [逐文件索引](file-reference.md) 写明。

目前没有正式发布 tag 历史约定。`package.json` 的 `1.0.0` 是当前包字段，不代表此前每个 PR 都有版本号；后续可按发布指南建立可选 SemVer tag。新增命名约定是维护建议，除 `codex/**` 对 CI 的影响外，不是已有自动强制校验。

## 8. 每次改完的验收与文档维护

- 看两个语言、明暗主题及桌面/窄屏；作者正文不自动翻译。
- 用顶栏跨页查看动画；刷新不算跨页动画验收，减少动态效果模式应无动画。
- 修改项目/文章时检查真实链接、锚点、图片说明；不改稳定网址和评论关联键来“刷新评论”。
- 新文章核对分类、标签、摘要、正文、来源 SHA；删除/撤下文章核对旧网址是否按预期 404。
- 评论只需检查加载和界面，不为验收发送无意义评论或反应。
- 在 Vercel 确认同一提交部署成功，再核对正式域名；旧不可变预览不会跟随 main 更新。
- 新增目录/文件或移动职责时，同时更新 `docs/file-reference.md`；修改工作流、格式或命名时更新 `docs/publishing-guide.md`；新增页面元素时更新 `docs/content-map.md`。

已有 [工作台视觉记录](workbench-preview.md) 和 [首屏修复记录](first-paint-checks.md) 是历史验收依据，里面的旧提交、旧文章数和旧诊断现象不是今天仍要处理的故障。临时 `motion-check` 面板和脚本已删除，当前普通访问直接使用 600ms，不再需要调试参数。

## 9. 官方参考与项目事实的区分

项目实际采用的功能、版本、路径和限制，以这次基准源码为准；平台机制有变化时核对官方文档，不把官方示例直接覆盖到本仓库。

- [Astro 内容集合](https://docs.astro.build/en/guides/content-collections/)：集合与验证概念；本项目具体规则在 `src/content.config.ts`。
- [Astro CLI](https://docs.astro.build/en/reference/cli-reference/)：开发、构建和预览；本项目包装命令在 `package.json`。
- [pnpm 严格锁文件安装](https://pnpm.io/cli/install)：安装行为；本项目指定 11.19.0，不随意改成 latest。
- [GitHub Actions 触发事件](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)：定时延迟与默认分支；本项目入口和权限在 workflow。
- [Astro 部署到 Vercel](https://docs.astro.build/en/guides/deploy/vercel/)：静态托管与 Git 部署；项目实际部署配置见 `vercel.json`。
- [Giscus 官方配置说明](https://giscus.app/zh-CN)：Discussions 与登录；实际 comment term 和按需加载逻辑在 Giscus 组件，不照抄旧 pathname 示例。
- [Chrome 原生跨文档过渡](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document)：触发与支持边界；本项目不是 SPA 路由动画。

完成上述流程，你可以独立维护日常内容，不需要为换一句介绍、增加一篇文章或修改图片重新迁移框架。
