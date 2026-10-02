# Mingyang Xu Personal Website

基于 Astro 的中英双语个人网站，展示机器人规划评测、ROS2 导航项目、实习、论文与技术笔记。网站在构建期导入公开仓库 [`AlphaApaca/repytorch`](https://github.com/AlphaApaca/repytorch) 中明确标记为可发布的 Markdown；浏览器访问页面时不会再请求 GitHub。

## 技术结构

- `src/pages/`：Astro 页面，包括首页、写作索引、文章路由和 404
- `src/content/posts/repytorch/`：由同步脚本生成并提交到 Git 的文章快照
- `scripts/sync-repytorch.mjs`：从固定 GitHub 提交读取、校验并转换文章
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
- 缺失链接、越出仓库的路径、重复网址、危险链接协议、危险原始 HTML 与本机绝对路径都会使同步失败
- Markdown 通过语法树处理，代码块和行内代码不会被当作链接或标题改写

当前的 `comments` 字段已经保留，后续接入 Giscus 时可以直接决定每篇文章是否显示评论区。
