# 版本控制与文章发布指南

交接日期：2026-10-05。本文按交接时仓库中的配置整理，未来修改工作流或托管设置后，也应同步更新这份说明。今天的新文章已上线；下面的错误排查是以后遇到同类情况时的处理方法，不表示当前仍有故障。

## 1. 先区分两种更新

| 你要做什么 | 在哪里改 | 如何进入正式站 |
| --- | --- | --- |
| 首页、项目、照片、About、样式、交互或网站代码 | `AlphaApaca/Alpacaxu_Website` 网站仓库 | 新分支 → 本地检查 → push → PR 与预览 → 人工合并 `main` |
| PyTorch 学习日志、技术笔记 | `AlphaApaca/repytorch` 的 `learning_log/`、`notes/` | 源文章 push 到 `repytorch/main` → 网站同步工作流 → 机器人草稿 PR → 预览 → 人工合并 |
| 生活随笔、杂文 | 网站仓库的 `src/content/posts/essays/` | 和网站代码一样走新分支、PR 与人工合并 |

最重要的边界：`repytorch` 是同步文章的源文件；网站中的 `src/content/posts/repytorch/` 是生成快照。不要直接编辑生成快照，也不要手工编辑机器人托管的 `codex/repytorch-sync` 分支。

网站仓库 `main` 是正式发布线。分支 push 和打开 PR 不是正式发布；在本项目现有 Git 集成下，合并到 `main` 后才会触发正式部署。合并成功与部署成功是两件事，要等 Vercel 的 Production 部署成功后再检查 [正式站](https://www.alpacaxu.cn/)。这与 [Vercel 的 Git 部署方式](https://vercel.com/docs/git)一致。

## 2. 首次在一台电脑上准备项目

### 2.1 环境与账号

需要 Git、Node.js 与 pnpm，编辑器任选。网站的版本约定是：

- Node.js：`.nvmrc` 记录 `22.13.0`；`package.json` 允许 `>=22.13.0`。为了与当前构建环境一致，优先用 `.nvmrc` 的版本。
- pnpm：`11.19.0`，记录在 `package.json` 的 `packageManager` 中。
- GitHub：能向这两个仓库推送、在网站仓库创建和合并 PR 的账号。
- Vercel：继续用已经连接网站仓库的现有项目，不需要每次重新导入，也不要求安装 Vercel CLI。

如果已经使用 nvm，可以在仓库根目录运行 `nvm install` 和 `nvm use`，它们会读取 `.nvmrc`；用法见 [nvm 官方说明](https://github.com/nvm-sh/nvm#nvmrc)。没有 nvm 不必为了维护网站强制换工具；通过你已有的安装方式准备对应 Node.js 即可。

Node.js 已准备好但没有 pnpm 时，可按 [pnpm 官方 npm 安装方式](https://pnpm.io/installation#using-npm)安装本项目固定版本；已由别的工具管理 pnpm 则保持原管理方式，不重复全局安装：

```bash
npm install --global pnpm@11.19.0
```

安装遇到权限问题先检查 Node 安装方式，不直接加 `sudo`。准备完成后确认：

```bash
git --version
node --version
pnpm --version
```

不要把 GitHub 密码、个人令牌或 Vercel 凭据写进代码、Markdown 或提交记录。常规同步用 GitHub Actions 自带令牌，现有流程不需要你另配个人令牌。

### 2.2 下载与启动网站

如果电脑上还没有项目，在自己选定的工作目录中运行：

```bash
git clone https://github.com/AlphaApaca/Alpacaxu_Website.git
cd Alpacaxu_Website
pnpm install --frozen-lockfile
pnpm dev
```

`git clone` 的目标目录不能与已有项目混用。已经有 `/Users/alpaca/workplace/Alpacaxu_Website` 时，直接进入该目录，不要再 clone 覆盖它。GitHub 的 HTTPS 推送可能要求凭据管理器、GitHub CLI 登录或你已配置的认证；网页账号已登录不代表终端已登录，遇到认证失败先修复认证，不要把令牌放进命令截图。

首次提交若提示 **Author identity unknown**，检查 `git config --get user.name` 和 `git config --get user.email`。没有值时，可以仅为当前仓库设置显示昵称与 GitHub **Settings → Emails** 提供的实际提交邮箱；启用邮箱隐私时使用该页面给出的 noreply 地址。下面是需替换占位值的格式，不要原样执行，也不用覆盖已经正确的个人配置：

```text
git config user.name "你的提交昵称"
git config user.email "你的实际 GitHub 提交邮箱"
```

这两项是提交署名，不是 GitHub 登录认证；不会代替推送登录，也无需为了维护网站使用真实姓名。

以启动输出显示的本地 URL 为准，端口可能因占用改变。按 `Ctrl+C` 停止自己启动的开发服务。生产构建与预览是另一组命令：

```bash
pnpm build
pnpm preview
```

`pnpm dev` 便于边改边看；`pnpm preview` 预览最近一次构建的 `dist/`，改了源文件后要重新 `pnpm build` 才会更新。不要手工改 `dist/`，它不是需要提交的源代码。

## 3. 分支、提交和版本号怎么命名

### 3.1 分支规则

以后建议采用 `codex/<类型>-<主题>`，全小写，用连字符连接单词，一件相对独立的事情用一个分支：

| 类型 | 示例 | 用途 |
| --- | --- | --- |
| `feat` | `codex/feat-uav-project` | 新功能、新项目模块 |
| `fix` | `codex/fix-writing-filter` | 修复显示或交互问题 |
| `content` | `codex/content-about-intro` | 文案、图片、本地杂文 |
| `chore` | `codex/chore-update-astro` | 依赖、配置、维护任务 |
| `docs` | `codex/docs-publishing-guide` | 维护说明和交接文档 |

这是交接后推荐的命名惯例，当前没有分支名称检查器强制这些类型。历史上的 `codex/first-paint-stability` 等名字不需要补改。真正影响现有自动检查的是 `codex/` 前缀：`Site checks` 配置了 `main` 与 `codex/**` 的 push 触发，其他名字的分支 push 不会触发这条检查，虽然以 `main` 为目标的 PR 仍有 PR 检查。

保留以下特殊名称：

- `main`：正式发布线，不在上面直接做日常编辑。
- `codex/repytorch-sync`：机器人管理的内容同步线，不能用来做普通网站改动或人工修文章。

不要把一篇文章和大型视觉改版放进同一个人工 PR；拆开可以分别预览、合并和撤回。

### 3.2 提交说明

建议写 `<类型>: <做了什么>`，例如：

```text
content: update About introduction
feat: add UAV project evidence
fix: preserve writing filters across navigation
docs: clarify article publishing workflow
```

这也是约定，不是当前自动校验规则。中文说明同样可以；重点是让未来的自己一眼知道改动目的。一个提交尽量只包含同一个主题，提交前检查暂存差异，避免误带缓存、私密文件或无关修改。

### 3.3 不必每篇文章都升版本号

交接时 `package.json` 的 `version` 是 `1.0.0`，不表示网站每次部署都有一个对应的正式 Release。当前没有自动版本发布工具，也没有规定改文章就必须改版本号。日常追踪优先看 PR、完整 commit SHA 和对应 Vercel 部署。

如果以后需要记录“第一次完整交付”“第二次大改版”之类的里程碑，可以采用 `v<主版本>.<次版本>.<修订号>` 的 tag：大幅不兼容变化加主版本，兼容的新功能加次版本，修复加修订号。应先确认当前版本和已有 tag，再选实际新版本；不要把说明中的占位名称直接执行。常规内容更新可只留提交记录。

## 4. 一次网站改动的完整流程

以下以修改 About 开场文案为例。命令中的分支与文件名是这个例子，做别的任务时换成实际目标。

### 4.1 每次开始先检查，干净后再更新 `main`

```bash
cd /Users/alpaca/workplace/Alpacaxu_Website
git status --short
git branch --show-current
git remote -v
```

如果有未提交改动，先辨认属于谁、是否仍需要。不要直接切分支、清空或覆盖。自己的改动可以先在现有任务分支完成一个明确的提交；不能确认归属或跨任务混在一起时，先暂停并整理。等工作区干净后：

```bash
git switch main
git pull --ff-only origin main
git switch -c codex/content-about-intro
```

`--ff-only` 在本地 `main` 与远程已经分叉时会停止，避免悄悄产生合并提交；它不是丢弃本地提交的命令。若失败，先查清本地多出来的提交，保留后再处理，不要用强制覆盖。行为见 [Git 的 pull 文档](https://git-scm.com/docs/git-pull)。

### 4.2 修改、预览、检查

根据元素维护地图找到真正的源文件。先在 `pnpm dev` 中检查，再运行：

```bash
pnpm check
pnpm test
pnpm build
pnpm sync:repytorch:check
git diff --check
git diff --stat
git diff
```

前三条检查页面类型、回归行为与生产构建；`sync:repytorch:check` 用快照中固定的源 commit 校验生成内容，没有改文章也能确认快照未被误改。它需要访问 GitHub，但不会改文件，也不会把源仓库最新 `main` 自动导入。不要为了消除这条检查的报错，在一个样式分支里顺便运行写入型同步命令带入不相关的新文章。

依赖没变化时不需要重新安装。拉取后若 `package.json` 或 `pnpm-lock.yaml` 改了，运行 `pnpm install --frozen-lockfile`；真正升级依赖时则要一起审核并提交这两个文件，重新跑全部检查。

### 4.3 提交与推送

只暂存这次确实修改的文件，例如：

```bash
git add src/pages/about.astro
git diff --cached
git commit -m "content: update About introduction"
git push -u origin codex/content-about-intro
```

不要不看差异就 `git add .`。首次 `-u` 设置跟踪关系，后续在同一任务分支增加修正可以继续提交并 `git push`，原 PR 会自动更新。推送被拒绝时先看原因；认证问题修认证，远程分支有别人提交时先 fetch 和检查历史，不要默认强推。

### 4.4 创建 PR，先预览再合并

1. 在网站 GitHub 仓库点击 **Compare & pull request**，检查 **base: main**、**compare: 你的任务分支**。
2. 还在调试就选 **Create draft pull request**；已经完成也可以直接普通 PR。Draft 是“暂不合并”的状态，不代表内容保密，也不阻止预览部署。
3. 写明改了什么、如何检查、是否影响网址/评论/同步；确认 Files changed 没有无关文件。
4. 等 `Site checks` 与 Vercel 预览结果。对 `codex/**` 的人工 push，检查还会找同一个完整 SHA 的成功 Preview，验收页面 HTTP 状态、404 与 noindex。注意 `validate` 成功但预览 HTTP 检查失败，不等于全部验收通过。
5. 打开本次 commit 的预览，在桌面 Chrome 与手机尺寸检查中英切换、主题、顶栏、首页/文章/About 跳转；按需检查筛选、文章目录、正文链接、图片。600ms 淡入只适用于浏览器支持且未启用减少动态效果的正常跨页导航，刷新与第一次打开不要求有动画。
6. 确认满意后点 **Ready for review**（如果仍是 Draft），再人工合并。不要仅因 CI 全绿就跳过文章或视觉检查。

建议在 PR 说明保存“本次 SHA + 唯一部署 URL”。Vercel 的 `blogofalpaca-<hash>-…vercel.app` 是某次部署，`blogofalpaca-git-<branch>-…vercel.app` 是会随分支更新的地址；已经打开的旧部署不会因 `main` 合并而变成最新设计。两者的区别见 [Vercel 生成网址说明](https://vercel.com/docs/deployments/generated-urls)。

预览如果跳到登录或保护页，自动 HTTP 检查不能证明实际页面通过。先核对本项目部署保护设置与预览访问权限，不能把登录页的 HTTP 200 当作文章页面正常，也不需要为日常维护随意扩大账号权限。

### 4.5 合并后确认正式部署，再清理自己的分支

1. 到 Vercel 项目查看这次 `main` 的 **Production** 部署是否成功，对上合并后的提交。
2. 打开正式站首页、`/writing/`、`/about/` 和本次变更的页面；确认未知路径仍是 404，新文章和中英切换正常。
3. 若一切正常，在已合并的人工 PR 上可点 **Delete branch**。这是删除任务分支引用，不是删除 PR 或提交历史。
4. 回到本地，确认无未提交改动，然后：

```bash
git switch main
git pull --ff-only origin main
git fetch --prune origin
git branch -d codex/content-about-intro
```

`-d` 会拒绝删除尚未被 Git 判断为已合并的分支；这是保护。如果用了 **Squash and merge**，原分支提交未必被识别为已合并，可能仍拒绝删除。此时保留分支、核对 PR 与提交内容即可，不要为“清理整齐”直接强删。`Create a merge commit` 会保留任务提交；两种合并方式都需遵守仓库实际允许的选项，没有在本文额外启用某种方式。安全删除规则见 [Git branch 文档](https://git-scm.com/docs/git-branch)。

上面清理只用于已结束的人工任务。机器人同步分支配置 `delete-branch: false`，不要按这套日常清理流程手动处理它。

## 5. 同时开发、冲突与回退

### 5.1 `main` 更新了，旧 PR 预览为什么还是旧内容

预览构建的是该分支/commit，不会自动把另一个已合并 PR 的改动补进来。人工任务分支需要最新基线时，在干净工作区中运行（换成实际任务分支）：

```bash
git fetch origin
git switch codex/content-about-intro
git merge origin/main
```

无冲突时合并完成；重新跑检查并 push，等新预览。这里用 merge 保留历史，不要求重写已推送的提交。不要对 `codex/repytorch-sync` 执行这一人工合并流程；先重新运行同步工作流让它管理自己的分支，再看新部署。

### 5.2 合并冲突

如果出现冲突：

1. `git status` 列出冲突文件，阅读双方差异；不要一律选“我的”或“远程的”。
2. 编辑文件，保留真实需要的结果并删除 `<<<<<<<`、`=======`、`>>>>>>>` 标记。
3. 用 `git add 实际冲突文件` 标记已解决；运行 `git diff --cached` 检查，`git commit` 完成合并，再跑检查和 push。
4. 不确定如何解决时先停止。由上面这次 merge 引起、且开始前工作区干净时，可以 `git merge --abort` 退出这次合并，再寻求协助；不要使用硬重置清空工作。

Git 官方也提醒，带着复杂未提交改动开始合并，可能无法完整重建原状态，所以先保证工作区干净。[Git merge 文档](https://git-scm.com/docs/git-merge)

### 5.3 合并后发现问题

优先创建 `codex/fix-<topic>` 修复 PR。如果必须撤回整个已合并 PR，在 GitHub 打开该 PR，使用 **Revert** 创建一个反向 PR；检查、预览后人工合并。若因冲突不能自动 Revert，先确认原 PR 的合并方式和提交，再针对性处理，不照抄一个不确定的 SHA。Revert 通过新增提交撤回变化，而不是抹掉 Git 历史。[GitHub 的 PR 撤回说明](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/reverting-a-pull-request)

如果正式站急需恢复，可在 Vercel 的部署页面按现有账号可用的 **Instant Rollback** 恢复一个符合条件的正式部署；可选历史范围和权限取决于当前套餐。部署回退不会同时修改 GitHub `main`：仍要补上修复或 Revert PR，让代码和正式站重新一致，之后的部署也要核对。具体入口和资格见 [Vercel 回退文档](https://vercel.com/docs/instant-rollback)。

撤回同步文章的 PR 后，如果源仓库仍 `publish: true`，下一次同步可能再次提议发布。真正取消发布应修改 `repytorch` 源文件，再走同步流程；短暂回退只是应急。

### 5.4 可选：给稳定里程碑打 tag

仅在正式站已经验收、决定留一个命名版本时使用。先更新干净的 `main`，再查看：

```bash
git log -1 --oneline
git tag --list
```

以下是格式模板，不可直接复制占位符执行；把 `vX.Y.Z` 换成没有用过的实际版本，把说明换成实际发布内容：

```text
git tag -a vX.Y.Z -m "实际发布说明"
git push origin vX.Y.Z
```

若决定同步维护 `package.json` 版本，应在发布 PR 中先改版本、审核并合并，再给对应提交打 tag。tag/Release 只是记录；当前工作流没有 tag 发布触发，不能用打 tag 替代 `main` 合并或 Vercel 部署确认。

## 6. 发布 repytorch 学习日志与 Note

### 6.1 源文件放在哪里

同步白名单只有源仓库根目录下这些形式：

- `learning_log/YYYY-MM-DD*.md`，例如 `learning_log/2026-10-05-model-training.md`。
- `notes/*.md`，例如 `notes/model-training.md`，不递归导入子目录。

`README.md` 不导入；其他目录的 Markdown 不导入。代码、数据或图片可以被文章引用，但不会因有链接就变成网站文章。

### 6.2 可复制的源文章格式

YAML 必须从文件第一行开始，以两条独立的 `---` 包住。源文件正文有且只有一个一级标题，二、三级标题按需写：

````markdown
---
publish: true
date: "2026-10-05"
category: learning-log
tags: [PyTorch, Training]
summary: "记录训练循环的实现与问题排查。"
comments: true
lang: zh-CN
---

# 2026-10-05 · Model training

## 今天的目标

在这里写正文。

## 相关文件

[代码](../tutorials/official_basics/04_build-model/build-model.py)
````

示例日期、标题与 tags 必须按实际文章修改；上面的代码链接指向现有 build-model 示例，需要换成对应文章的代码时，确认新目标已经提交进源仓库。源文件不要求写 `title` 或 `permalink`：同步器从唯一 `#` 标题生成 `title`，默认从文件名生成网址；如需主动固定网址，在 frontmatter 添加 `slug: model-training`。Note 通常用 `category: note`，日志通常用 `learning-log`；类别是非空字符串，不是路径开关。

资料规则：

- `publish` 只有布尔值 `true` 才发布，缺失、`false` 或字符串 `"true"` 都不会导入。未准备公开的 Note 保持 `false` 不会阻止一篇日志独立发布。
- `date` 是真实日历日期；`category`、`summary` 非空；`tags` 是字符串数组，可以 `[]`；`comments` 写布尔值，省略默认开启。
- `lang` 可省略，默认 `zh-CN`，英文可 `en`。这是正文主要语言元数据，不会自动翻译文章；混写没有问题。
- 自定义 `slug` 用小写英文字母、数字、单连字符，不能与其他已发布文章重复，也不能与网站本地杂文的 `permalink` 撞车。
- 所有候选文件的 YAML 都会先解析；即使 `publish: false`，损坏的 YAML 也可能中断同步。待发布正文的其他安全校验针对 `publish: true` 执行。
- 文中相对链接必须指向本次源 commit 已存在的仓库文件或目录。没有入库的 `model.pth` 不必上传，只需用普通文字/行内代码说明“本地运行生成”，不要为它加无效链接。
- 不放本机绝对路径。日志代码块里的 `/Users/…`、`/home/…`、Windows 本机路径或 `file:///…` 也会被检查；替换为项目相对路径，保留真正的报错信息即可。
- 自动同步拒绝正文原始 HTML，例如直接粘贴 `<img>` 或 `<script>`；用 Markdown 图片/链接。HTML 教学例子放在代码块或行内代码中可以保留，但代码示例中的本机绝对路径仍需处理。
- 禁止危险链接协议、越出仓库的相对路径。普通外部 HTTPS 链接不会在同步时逐个联网验证，作者仍应在预览中确认能打开。

### 6.3 推送源文章

在你自己的 `repytorch` 本地目录里进行，不在网站目录操作。先保证工作区干净、检查现有分支；若按当前个人学习习惯直接更新源 `main`：

```bash
git status --short
git branch --show-current
git switch main
git pull --ff-only origin main
```

修改后只提交实际文章或其引用的必要文件，例如：

```bash
git add learning_log/2026-10-05-model-training.md
git diff --cached
git commit -m "docs: add model training learning log"
git push origin main
```

以上文件名是例子，先创建并检查自己的实际文件。也可以在 `repytorch` 使用任务分支与 PR；网站读取的是 `repytorch/main`，所以必须先合并源 PR 才能被同步看到。源文章 push 完成还不等于网站文章上线。

### 6.4 让网站创建或更新草稿 PR

网站当前没有 `repytorch` push 即时通知机制，而是两种触发：

1. **自动等下一轮**：每小时第 17 分钟计划检查 `repytorch/main`。cron 使用 UTC，但每小时频率在北京时间也是每小时第 17 分钟。
2. **现在发布**：打开 [网站文章同步工作流](https://github.com/AlphaApaca/Alpacaxu_Website/actions/workflows/sync-repytorch.yml)，点 **Run workflow**，分支必须选 **main**，再运行。不用给另一个源 SHA 或配置新令牌。

定时检查不是准点 SLA，GitHub 高负载时可能延迟；公开仓库 60 天没有活动时定时工作流会停用，可在 Actions 中重新启用。因此“源 push 了但暂时没 PR”时，先看有没有晚于该 push 的成功同步运行。官方限制见 [GitHub schedule 说明](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)。

工作流会解析源 `main` 的完整 commit SHA，从固定版本读取可发布文件，先做安全校验、回归测试、快照一致性、Astro 检查与构建。都成功且有生成内容差异时，创建或更新同一个标题为 **Update published repytorch writing**、分支为 `codex/repytorch-sync` 的 Draft PR，而不是每篇新建一个 PR。已有多个源文章变化可能在同一个 PR 里；若运行总结是 **No published-content change requires a new PR.**，表示本次没有可提交差异，应检查发布开关、路径、已有 PR 和源提交。

同步成功后去 [网站 PR 列表](https://github.com/AlphaApaca/Alpacaxu_Website/pulls)找这条 PR，核对 Files changed 和 `snapshot.json` 的 `sourceCommit` 是否对应刚才源文章版本，不只看 PR 创建时间。

只新增一篇文章，也可能看到已有文章的 `sourceCommit`、来源 URL、代码/草稿链接一起更新：整个快照会固定到同一个新源提交，不表示旧正文都被你重写了。即使源仓库只改了代码，新的来源 SHA 也可能产生快照 PR；审核时把来源元数据更新与正文变化分开看。

### 6.5 检查机器人 PR 并上线

1. PR 出现 **Approve workflows to run** 时，由有写权限的你点击，允许这次 PR 检查开始。
2. 等 Vercel 报告成功预览；如果出现部署授权提示，在核对这是自己仓库、预期机器人提交后按项目提示授权。没有成功部署记录，不能假定预览已生成。
3. 打开新的确切部署 URL，检查列表里的新文章、分类/标签、正文、图片、来源和相对链接。不要继续使用上次 PR 的旧部署地址。
4. 检查满意后 **Ready for review** → 人工合并 `main`。机器人不批准也不合并 PR。
5. 等 Production 成功，在正式站检查新文章。以后要修文字仍去源文件修改、push，再走这条流程。

为什么可能需要手动批准？GitHub 自带 `GITHUB_TOKEN` 的机器人 push 不会递归触发其他 push 工作流；它创建/更新 PR 的相关事件会产生待审批运行。同步工作流本身已经执行了全部本地质量检查，但不代表外部预览已通过。机制见 [GitHub 官方令牌说明](https://docs.github.com/en/actions/concepts/security/github_token)。不要为省一次确认而随意增加个人令牌或改变权限范围。

仓库设置需要保持 **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests** 开启。选项名称含 approve，但本项目脚本并不会自动批准。文章源仓库是公开的，同步工作流只向网站仓库申请内容和 PR 写入权限，不修改源仓库。

### 6.6 修改、取消发布与稳定网址

- 修改正文/简介/标签：改源文件，保持原 `slug` 或默认文件名，push 与同步即可。
- 取消发布：把源 frontmatter 改为 `publish: false`，或有意删除源文件；下一次同步 PR 合并后网站撤下该页面，旧网址会失效。GitHub 文件/提交历史、已存在评论和搜索缓存不会随之消失。
- 重命名源文件：如果此前网址由文件名生成，先添加原网址对应的 `slug` 并核对预览，避免重命名造成网址变化。
- 评论按 `/writing/{permalink}/` 稳定键关联，而不是部署域名；预览与正式站会使用同一讨论。换 `slug`/`permalink` 会换关联键，旧链接和旧评论不会自动迁移。
- About 留言板另用 `about-guestbook`，不要顺手换键或删 Discussions。关闭 `comments` 只隐藏入口，不删除讨论。

### 6.7 高级备用：在网站本地同步

日常优先使用网站工作流，避免人工分支与机器人 PR 竞争。只有明确需要本地诊断或人工同步时，先在网站仓库创建干净的独立任务分支，再运行：

```bash
pnpm sync:repytorch
pnpm sync:repytorch:check
pnpm check
pnpm test
pnpm build
git diff -- src/content/posts/repytorch
```

第一条会重建整个生成目录，以源仓库当前 `main` 为输入；其余不会把新内容自动写入源仓库。确认确实要人工提交这批快照，才暂存生成目录并走网站 PR 流程；不要再对同一批内容同时合并机器人 PR。普通 `pnpm build` 只读网站已提交快照，不能代替文章同步。`--check` 校验固定源版本，并不是查询“是否有新文章”。

## 7. 在网站写杂文

1. 按第 4 节从最新 `main` 建 `codex/content-<topic>` 分支。
2. 复制 `docs/essay-template.md` 到 `src/content/posts/essays/`，例如 `my-first-essay.md`。
3. 填写 `title`、稳定 `permalink`、实际日期、`category: essay`、简介与标签；先保留 `publish: false`。正文从 `##` 开始，不再写一级标题，页面会显示 `title`。
4. 完成后改为 `publish: true`，本地预览并跑 `check/test/build`。
5. 只提交该文章与必要图片，新分支 push → PR 预览 → 人工合并 → 正式部署检查。

完整模板字段说明见 [杂文写作指南](writing.md)。两种元数据不要混淆：

| 事项 | repytorch 源文章 | 网站本地杂文 |
| --- | --- | --- |
| 标题 | 正文唯一 `#` 一级标题 | frontmatter `title`，正文不重复一级标题 |
| 稳定网址 | 默认文件名，可选 `slug` | 必填 `permalink` |
| 生成目录 | 同步器写入，禁止直接编辑 | 手动维护 `src/content/posts/essays/` |
| 发布渠道 | 源 push + 同步机器人 PR | 网站自己的内容 PR |

杂文取消发布改 `publish: false`，正文更正直接改该文件，均走新的 PR。已发布后尽量不改 `permalink`；改文件名可以不改网址。文章收藏链接与评论绑定都依赖稳定网址。

两仓库均为公开仓库：`publish: false` 只是“不生成网站页面”，不是保密措施。草稿仍可能在 GitHub 文件、历史或临时设为 true 的预览中被读取，私密材料应保存到网站内容目录和公开仓库之外。

## 8. 常见问题排查表

先打开最近的 workflow run，点失败 job 找**第一条实际错误**；最后的 “Process completed with exit code 1” 只是结果。先记下文件、行号、源 commit 与失败步骤，不要盲目重试或更改权限。

| 看到的现象/错误 | 先检查什么 | 正确处理 |
| --- | --- | --- |
| 源 push 后没有 PR，Actions 没有新的运行 | 最新 run 是否晚于源 push，定时是否启用 | 需要现在发布时手动 Run workflow，分支选网站 `main`；否则等定时检查 |
| 手动运行是 skipped | 所选分支 | 同步 job 只允许网站 `main`，不是源 `main` 或开发分支 |
| 运行成功，但没有新 PR / No published-content change | 发布路径、布尔 `publish`、已存在 Draft PR、`sourceCommit` | 查已有同步 PR 和实际差异；未发布文件不生成页面，已有 PR 可能只是被更新 |
| YAML 解析失败 / 元数据错误 | 第一行 `---`、缩进、日期、summary、tags 类型 | 修源 YAML 后 push；不要写 `publish: "true"`，不合法草稿 YAML 也要修 |
| H1 title / exactly one H1 | 源正文中的一级标题 | 保留一个 `#` 主标题，其余改为 `##` 或 `###`；这是源同步规范 |
| relative link target does not exist | 相对路径、大小写、目标是否入库 | 修链接或补必要公开文件；本地生成的模型用纯文字说明，不必上传模型 |
| published content exposes an absolute local path | 错误日志、代码块、图片地址 | 改为项目相对路径或适当脱敏，不删除真正有用的报错信息 |
| raw HTML is not allowed / unsafe protocol | `<img>`、`<br>`、HTML 注释或危险 URL | 用 Markdown；教学 HTML 放代码示例，禁止执行性内容 |
| Duplicate article slug / Duplicate published article URL | 所有已发布源 `slug` 和本地 `permalink` | 给新文章唯一网址；已发布文章先保留原网址，不随意改旧键 |
| GitHub Actions is not permitted to create or approve pull requests | 网站仓库 Workflow permissions | 检查既有允许创建 PR 的选项是否保存；若组织策略限制，找管理员，不擅自换 PAT |
| Managed sync branch contains manual or unexpected changes | `codex/repytorch-sync` 的作者与文件差异 | 停止；保留、审阅人工改动，必要时迁到普通分支后再处理托管分支，不手工覆盖它 |
| PR 检查不开始 | 机器人 PR 审批横幅 | 点 Approve workflows to run；注意 Draft 状态与审批是两件事 |
| Vercel 没有预览 | 当前 SHA 的 deployment 状态、授权与构建日志 | 等成功或处理明确失败；不能把旧 URL 当本次部署 |
| 新 PR 预览仍是旧布局 | 浏览器地址是否为旧部署，该分支是否包含最新 main | 人工分支合入最新 `origin/main` 后重测；机器人分支重新运行同步，不手工 merge |
| 预览 HTTP 检查失败，网页似乎能开 | 是否为保护/登录页、预览是否对应 exact SHA、404/noindex | 查检查日志具体失败项，核对部署访问设置，不绕过 TLS 或发送凭据给未知地址 |
| Generated repytorch content is out of date | 快照是否被手改、当前固定源 SHA | 先确认来源与生成器版本；只在专门同步流程重新生成，不改生成文章“糊过去” |
| GitHub 网络/API 限流 | 是否网络失败或 rate-limit，Actions 的令牌是否正常 | 等网络恢复/限制窗口；日常可改用 Actions；不要把令牌写入仓库 |
| 正式站没有新内容 | Production 部署是否成功、是否打开旧 preview、文章发布开关 | 对上 main 合并 SHA、正式域名与新部署；普通 build 不会主动拉源新文章 |
| 新评论没对应 Discussion | 是否真的有评论/回应提交，comments 是否开启 | 首次有效评论或回应才创建讨论；无需为了验收发送无意义测试留言 |

目前自动 HTTP 验收涵盖首页、写作索引、About、选取的一篇同步文章、真实 404 与预览 noindex，并不是逐个外部链接、每张图片或所有交互的全面测试。同步快照零篇已发布文章时，默认跳过文章路由，不请求已经撤下的旧文章。作者仍要人工看本次变更文章。可在 [Preview HTTP acceptance](https://github.com/AlphaApaca/Alpacaxu_Website/actions/workflows/preview-acceptance.yml) 手动选网站 `main`，输入本项目 HTTPS Preview **origin**（不带文章路径、查询参数或锚点）；文章路径可留空由快照选择，也可填实际 `/writing/.../` 路由。该检查器只接受本项目指定格式预览域名，不能输入正式域名来冒充预览验收。

## 9. 每次发布的最短检查单

网站改动：

- [ ] 从干净、最新 `main` 建 `codex/` 任务分支。
- [ ] 改正确源文件，不改 `dist/` 或自动生成文章。
- [ ] 本地 `check`、`test`、`build` 通过，差异无无关文件。
- [ ] push 后对上本次 SHA 的检查与新 Preview，手动看桌面/手机、中英和相关功能。
- [ ] 人工合并，Production 成功后正式站复查，再安全清理人工分支。

源文章：

- [ ] 白名单路径、合法 YAML、`publish: true`、唯一 H1、稳定且不重复的 slug。
- [ ] 链接目标已入库，无本机绝对路径或正文原始 HTML。
- [ ] push 到 `repytorch/main`，需要立即发布则网站 Run workflow 选 `main`。
- [ ] 查同一个机器人 Draft PR，必要时批准检查，等实际成功预览并检查新文章。
- [ ] Ready for review、人工合并，等正式部署并确认文章出现。

以后排查时优先提供这四样：**PR 链接、workflow run 链接、完整 commit SHA、本次部署 URL**。它们能区分“源文章没被同步”“PR 没合并”“部署失败”和“只是看到了旧预览”。
