# 自己改一点网站内容

这是视觉调整期间的预备说明，是否发布以 PR 合并及正式部署为准。等视觉和交互验收完成，再一起做正式交接。

## 改首页开场与昵称

打开 `src/data/site.mjs`：

- `site.name`：顶栏、About、页脚和文章页面标题使用的昵称。
- `homeCopy.zh.heading` / `homeCopy.en.heading`：首页两行大标题。
- `homeCopy.zh.intro` / `homeCopy.en.intro`：首页短介绍。
- 两种语言各自的 `title` 和 `description`：浏览器标题与搜索/分享简介。
- `site.avatar`：顶栏卡通头像路径。
- `site.email`：联系按钮的真实收件地址。

直接改引号中的文字，保留逗号、引号和括号即可。中文和英文可以各写各的，不必直译。昵称改动后也记得更新 `homeCopy` 文字里的称呼；老项目/经历区的双语内容暂时在根目录与 `public/` 两份 `script.js` 中，修改时保持一致。

网站不再在页面文字、图片说明或搜索元信息里使用真实姓名；邮件按钮只显示 Email，但点击仍使用原来的地址。这是展示风格调整，不是匿名化：联系地址、项目仓库和外部论文仍可能识别身份。

## 改照片与写文章

顶栏卡通头像：`public/assets/alpaca-avatar.png`。首页下方和 About 仍使用原来的证件照，展示版为 `public/assets/portrait.png`；原图 `public/assets/avatar.png` 保留。

GitHub 学习日志/笔记继续在 `repytorch` 写，按原有 `publish: true` 流程同步。自己写杂文看 `docs/writing.md` 和 `docs/essay-template.md`；不要手改同步生成的 Markdown 快照。

## 看效果再发布

平时本地开发用 `pnpm dev`；检查用 `pnpm check`、`pnpm test`、`pnpm build`。当前已有的 `http://127.0.0.1:4175/` 是静态预览，改完需重新构建、刷新浏览器，不会自动更新正式站。

根目录 `index.html` 是 Astro 导入的旧首页内容桥接源，不是独立预览入口；不要通过 `file://` 打开它验收。图片等资源由 Astro 从 `public/` 提供，请使用上述开发或预览服务。

验收后再提交到开发分支、查看 Vercel 预览、创建/审核 PR 并手动合并。无需为修改一句文案更换框架或重新配置 Giscus。

## 跳转效果

页面仍是普通多页网站，没有拦截导航。支持原生跨页过渡的浏览器会在站内链接跳转时播放约 200ms 的轻微正文模糊淡化，顶栏不跟随位移；刷新或从地址栏直接进入不是动画验收场景。不支持的浏览器正常跳转，系统设置“减少动态效果”时关闭动画。顶栏和文章入口悬停时可提前加载站内页面；省流量、慢网由 Astro 自行降级，不预取外站或 GitHub 登录。

语言、主题以及文章网址中的筛选条件，在首屏由 `src/lib/first-paint.mjs` 初始化；顶栏和筛选区预留位置。后续中英切换仍由 `public/workspace.js` 处理。旧项目/经历字典由 `src/lib/evidence-copy.mjs` 在构建时转换，不再作为另一套首页浏览器脚本运行。修改文案的位置不变，详情和验收边界见 `docs/first-paint-checks.md`。

技术依据：[Astro 预取](https://docs.astro.build/en/guides/prefetch/)、[原生跨文档过渡](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition)。过渡改善视觉连贯性，不等于实测网络速度变快。
