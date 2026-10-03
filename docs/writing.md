# 在网站仓库写杂文

杂文直接写在网站仓库，不必放进 PyTorch 项目。本轮提供的是 Markdown 写作流程，不是在线后台；你可以用熟悉的编辑器，也可以用 GitHub 的网页编辑器。

## 第一次添加文章

1. 打开同目录下的 [`essay-template.md`](essay-template.md)，复制完整内容。
2. 在网站仓库的 `src/content/posts/essays/` 中新建 Markdown 文件，例如 `my-first-essay.md`，粘贴模板。用 GitHub 网页时可以选择 **Add file → Create new file**，填写完整路径。
3. 修改文件顶部两行 `---` 之间的资料，保持 `publish: false`，先完成正文。
4. 准备公开时，将 `publish` 改为 `true`，并检查标题、日期、简介、标签和网址是否正确。
5. 把变更提交到网站仓库的新分支，创建 PR；检查部署预览，确认文章能在 Writing 列表找到、正文和链接正常，再手动合并到 `main` 发布。若用 GitHub 网页，提交时选择 **Create a new branch for this commit and start a pull request**，不要直接提交到 `main`。

模板位于 `docs/`，不会被当作网站内容读取；杂文目录中的 `.gitkeep` 只是保留目录，也不会产生文章。不要把这份说明或模板放进文章目录，否则它们可能被当作文章检查。

## 顶部资料怎么填

```yaml
---
publish: false
title: "新杂文的标题"
permalink: my-first-essay
date: "2026-10-03"
category: essay
tags: [随笔]
summary: "用一句话概括这篇文章。"
comments: true
lang: zh-CN
---
```

- `publish`：`false` 为不发布，`true` 才会进入列表和生成页面。请写布尔值，不要写成带引号的 `"true"`。
- `title`：页面显示的标题，可以写中文、英文或混合文字。
- `permalink`：文章的固定网址标识，用小写英文字母、数字和单个连字符，例如 `my-first-essay`。不能包含空格、中文、下划线或 `/`；也不能与其他文章或保留的旧文章网址重复。
- `date`：改成文章的实际日期，按 `YYYY-MM-DD` 填写真实日期。模板日期只是示例，不会自动更新。
- `category`：杂文使用 `essay`。其他已支持分类是 `learning-log`（学习日志）和 `note`（技术笔记）。
- `tags`：按内容自定多个标签，例如 `[随笔, 生活]`；没有标签也可以写 `[]`。尽量统一同一个标签的拼写。
- `summary`：写一句非空简介，显示在文章列表，并参与关键词搜索。
- `comments`：`true` 显示按需加载的 GitHub 评论入口，`false` 隐藏。发布评论仍需 GitHub 登录。
- `lang`：主要为中文时保留 `zh-CN`，主要为英文时可用 `en`；正文中英混写不需要逐篇双语翻译。

页面会自动用 `title` 生成一级标题。正文从 `##` 二级标题开始，不需要再写 `# 标题`。本地杂文与 `repytorch` 的来源 Markdown 不同：本地必须写 `title` 和 `permalink`；源仓库的同步器会读取正文一级标题，且只在自定义网址时使用可选的 `slug`。

## 本地预览与检查

在网站仓库根目录运行：

```bash
pnpm dev
```

已发布文章的网址是 `/writing/{permalink}/`，例如 `/writing/my-first-essay/`。`publish: false` 的文章不生成页面；需要预览正文时，可以在尚未提交的本地变更中暂时改为 `true`，预览后再决定是否发布。PR 预览只有提交为 `publish: true` 的文章才会生成页面。

提交前运行：

```bash
pnpm check
pnpm test
pnpm build
```

元数据填写错误、无效日期或重复网址会被检查拦住。未发布文件同样需要填写合法元数据；不希望参与内容检查的笔记应保存在文章目录外。

## 日常更新与注意事项

- 修改已发布文章时，编辑其 Markdown 正文或资料，通过新分支、PR 预览、人工合并的同一流程更新。
- 发布后尽量不改 `permalink`。评论按 `/writing/{permalink}/` 关联；换网址会影响旧链接和评论关联，文件名则可以独立调整。
- 本地杂文不受自动同步覆盖。`src/content/posts/repytorch/` 是生成目录，不要在其中手工写杂文或修改文章；同步文章仍应去 `repytorch` 源仓库修改。
- 取消发布可将 `publish` 改为 `false`，合并后网站不再生成该文章页面，但公开 GitHub 文件、历史提交或搜索引擎缓存不会因此消失。
- `publish: false` 只是网站发布开关，不是保密措施。公开 GitHub 仓库和拿到链接即可访问的 PR 预览都不适合保存私密内容。
- 本轮搜索只匹配标题、简介与标签；选择分类、标签和搜索词后，可以直接复制当前 Writing 页面网址分享筛选结果。
