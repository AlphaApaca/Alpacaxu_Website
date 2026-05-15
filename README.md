# Mingyang Xu Personal Website

一个零依赖的个人主页与技术博客首版，参考了原简历网站的信息结构，可以直接用浏览器打开，也可以部署到任意静态托管平台。

## 文件结构

- `index.html`：首页、文章列表、短记和关于区域
- `articles/`：文章详情页
- `styles.css`：全站样式和响应式布局
- `script.js`：深色模式和文章搜索
- `assets/hero-workspace.png`：首屏视觉资产
- `assets/avatar.jpg`：来自原简历网站的头像资产

## 本地预览

直接打开 `index.html`，或在项目目录运行：

```bash
python3 -m http.server 8080
```

然后在浏览器中打开本地服务器显示的地址。

## 后续路线

1. 把示例内容替换成你的真实介绍、邮箱、文章标题和正文。
2. 增加 RSS、Sitemap 和更完整的 SEO meta。
3. 如果文章数量变多，迁移到 `Astro + TypeScript + Markdown/MDX + Pagefind`。
