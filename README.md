# Mingyang Xu Personal Website

基于 Astro 的个人网站，保留中英双语首页，展示机器人规划评测、ROS2 导航项目、实习、论文与技术笔记。同步脚本从公开仓库 [`AlphaApaca/repytorch`](https://github.com/AlphaApaca/repytorch) 导入明确标记为可发布的 Markdown，形成已提交快照；普通构建和浏览器阅读正文时不会再请求源仓库。评论与留言板按需连接 Giscus。

## 技术结构

- `src/pages/`：Astro 页面，包括首页、写作索引、文章路由、About 留言板和 404
- `src/content/posts/repytorch/`：由同步脚本生成并提交到 Git 的文章快照
- `scripts/sync-repytorch.mjs`：从固定 GitHub 提交读取、校验并转换文章
- `src/content/posts/repytorch/snapshot.json`：来源提交与文章网址清单，包括零篇已发布文章的情况
- `.github/workflows/`：回归检查、定时同步提 PR、真实预览 HTTP 验收
- `public/`：样式、脚本、图片与保留的旧文章 URL
- 根目录的 `index.html`、`styles.css`、`script.js`：第一阶段迁移桥接源；首页外观与双语交互继续沿用这些内容

## 本地开发

要求 Node.js 22.12 或更高版本、pnpm 11.19。

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

网站仓库的 Discussions 承载 Giscus 评论。每篇 Markdown 文章通过 `comments: true/false` 控制显示，默认开启；保留的三篇旧静态 HTML 文章暂未接入评论。

评论点击“加载评论”后连接 Giscus，发布需要 GitHub 登录。文章关联稳定的 `/writing/{permalink}/` 键，About 留言板使用独立的 `about-guestbook` 键，预览与正式站不会因主机名不同而拆散评论。严格匹配开启，backlink 指向正式域名，评论主题跟随网站切换。无需为验收发送测试评论或回应；新 Discussion 会在第一次真正评论或回应时创建。
