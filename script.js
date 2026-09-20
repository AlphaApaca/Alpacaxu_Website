const root = document.documentElement;
const themeStorageKey = "alpaca-theme";
const langStorageKey = "alpaca-lang";
const savedTheme = localStorage.getItem(themeStorageKey);
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (savedTheme || prefersDark) {
  root.dataset.theme = savedTheme || "dark";
}

const translations = {
  zh: {
    pageTitles: {
      home: "许明阳 | 机器人规划与 ROS2",
      articleBuild: "从简历网站到机器人作品集 | Mingyang Xu",
      articleStack: "机器人方向个人网站技术栈选择 | Mingyang Xu",
      articleNotes: "让笔记系统保持轻量 | Mingyang Xu"
    },
    "common.name": "Mingyang Xu",
    "common.homeLabel": "Mingyang Xu 首页",
    "common.primaryNav": "主导航",
    "common.location": "英国曼彻斯特",
    "common.themeToggle": "切换深色模式",
    "common.footer": "© 2026 Mingyang Xu。机器人、AI 与 CPD 作品集。",
    "nav.profile": "简介",
    "nav.projects": "项目",
    "nav.experience": "经历",
    "nav.cpd": "CPD",
    "nav.posts": "文章",
    "nav.about": "技能",
    "home.meta.description": "许明阳的 MuJoCo 环境可行性规划评测、ROS2 自主移动机器人导航项目与研究经历。",
    "home.hero.alt": "安静的技术写作桌面插画",
    "home.hero.sectionLabel": "个人介绍",
    "home.hero.eyebrow": "机器人规划 · MuJoCo · ROS2",
    "home.hero.copy": "曼彻斯特大学机器人学硕士在读，研究 MuJoCo 中考虑环境约束的本地 LLM 规划，并参与 ROS2 自主移动机器人的导航系统验证。",
    "home.hero.primary": "查看项目",
    "home.hero.secondary": "联系我",
    "home.profile.kicker": "关于我",
    "home.profile.heading": "让机器人规划接受环境约束检验。",
    "home.profile.avatarAlt": "Mingyang Xu 头像",
    "home.profile.p1": "我在曼彻斯特大学攻读机器人学硕士（预计 2026 年 12 月毕业）；本科阶段取得福州大学软件工程与梅努斯大学 Computer Science & Software Engineering 双学位。",
    "home.profile.p2": "硕士论文通过 MuJoCo 任务评估本地 LLM 能否在执行前识别可行、不可行或有歧义的指令。在 V.I.S.O.R. 团队项目中，我主要负责 Leo Rover 的 SLAM 与 Nav2 导航验证和调优。",
    "home.profile.p3": "我关注具身智能、Robot Learning 与可靠机器人系统。这里区分已完成的项目工作和仍在学习的方向。",
    "home.objective.kicker": "当前方向",
    "home.objective.heading": "当前工作方向",
    "home.objective.primary.label": "研究",
    "home.objective.primary.title": "环境感知的可行性规划",
    "home.objective.primary.copy": "在 MuJoCo 中设计受控任务、matched-pair 评测、确定性可行性验证和本地 LLM 计划修正。",
    "home.objective.focus.label": "工程",
    "home.objective.focus.title": "ROS2 导航与系统集成",
    "home.objective.focus.copy": "SLAM 建图与定位、Nav2 planner 和 costmap 调优，以及 Gazebo 和 Leo Rover 真机测试。",
    "home.objective.secondary.label": "下一步",
    "home.objective.secondary.title": "Robot Learning 基础",
    "home.objective.secondary.copy": "正在补齐 PyTorch 训练闭环与模仿学习闭环评测；目前不把策略训练写成已完成经历。",
    "home.projects.kicker": "代表项目",
    "home.projects.heading": "代表项目",
    "home.projects.label.contribution": "个人贡献",
    "home.projects.label.result": "评测结果",
    "home.projects.dissertation.type": "硕士论文 · 2026",
    "home.projects.dissertation.title": "MuJoCo 环境约束下的本地 LLM 可行性规划",
    "home.projects.dissertation.summary": "构建 MuJoCo 桌面任务 benchmark：保持自然语言指令不变，仅改变环境条件，评估本地 LLM 对可执行、不可执行和歧义任务的判断。",
    "home.projects.dissertation.contribution": "我设计了 7 类受控失败场景，实现确定性可行性验证器；结构化反馈支持最多 3 轮计划修正，仍不可行的计划会在执行前被阻断。",
    "home.projects.dissertation.result": "在 6 个本地模型与 126 个 held-out tasks 上，Verified planning 使其中 5 个模型达到 95.2%–100% 的 matched-pair success；完整配置的 simulator crash rate 为 0%。这是规划可行性评测，不是机器人策略训练。",
    "home.projects.dissertation.metricTasks": "个任务",
    "home.projects.dissertation.metricPairs": "组配对任务",
    "home.projects.dissertation.metricRecords": "条实验记录",
    "home.projects.dissertation.visualLabel": "自然语言指令经过环境和计划验证，得到执行、拒绝或澄清决策",
    "home.projects.dissertation.visualInput": "自然语言指令",
    "home.projects.dissertation.visualCheck": "环境与计划校验",
    "home.projects.dissertation.visualDecision": "执行 · 拒绝 · 澄清",
    "home.projects.leo.type": "团队机器人项目 · 2025–2026",
    "home.projects.leo.imageAlt": "Leo Rover 自主移动操作项目图片",
    "home.projects.leo.title": "V.I.S.O.R. — 自主移动操作机器人",
    "home.projects.leo.summary": "团队基于 Leo Rover 搭建 ROS2 自主移动操作系统，集成 SLAM、导航、RGB-D 感知与机械臂操作，实现目标搜索、接近、抓取、返航和按颜色分类放置。",
    "home.projects.leo.contribution": "我主要负责导航子系统的测试与调优：SLAM 建图/定位、Nav2 全局和局部 planner、costmap、覆盖导航、障碍处理与 return-to-start；同时参与 Gazebo 与 Leo Rover 真机上的 SLAM、Nav2、TF 和任务流程联调。",
    "home.links.repository": "项目仓库",
    "home.links.teamRepository": "团队仓库",
    "home.links.journalMetrics": "期刊指标",
    "home.experience.kicker": "实习与论文",
    "home.experience.heading": "项目之外的经历",
    "home.experience.intern.type": "软件工程实习 · 2024.01–05",
    "home.experience.intern.title": "山东泓科信息技术有限公司 · Java 全栈开发",
    "home.experience.intern.copy": "参与功能、回归和用户验收测试，用 ZenTao 跟踪缺陷；基于 Java SSM / MariaDB 开发 REST API 和业务功能并集成 Elasticsearch，同时进行 Vue2 / ElementUI 前端开发与接口联调。",
    "home.experience.paper.type": "论文发表 · 2026",
    "home.experience.paper.meta": "International Journal of Digital Earth · JCR Q1（2025 年指标）· 第三作者",
    "home.experience.paper.copy": "本人贡献为 Writing – original draft。论文研究基于 GeoSOT 顺序编码的降雨时空数据管理与检索。",
    "home.skills.kicker": "技术能力",
    "home.skills.heading": "技术能力与研究方法",
    "home.skills.roboticsTitle": "机器人系统",
    "home.skills.roboticsCopy": "ROS2、Nav2、SLAM Toolbox、TF、MuJoCo、Gazebo、PyBullet。",
    "home.skills.perceptionTitle": "模型与数据",
    "home.skills.perceptionCopy": "NumPy、Pandas、Transformer / LLM 本地推理与规划评测。",
    "home.skills.softwareTitle": "编程与工具",
    "home.skills.softwareCopy": "Python、Java、C++（基础）、Linux、Git、SSH。",
    "home.skills.practiceTitle": "研究与实验",
    "home.skills.practiceCopy": "Benchmark 与 ablation 设计、实验自动化、统计分析、可视化及科研写作。",
    "home.cpd.kicker": "持续发展",
    "home.cpd.heading": "CPD 反思与 UK-SPEC 证据",
    "home.cpd.intro": "通过项目证据、测试与反思记录工程决策，也明确结果的适用边界。",
    "home.cpd.label.focus": "关注点",
    "home.cpd.label.evidence": "对应证据",
    "home.cpd.a2.title": "A2 — 复杂机器人问题解决",
    "home.cpd.a2.focus": "区分语言指令与决定其能否执行的环境约束。",
    "home.cpd.a2.evidence": "MuJoCo 配对任务、确定性可行性校验与结构化计划修正反馈。",
    "home.cpd.b3.title": "B3 — 实施、测试与评估",
    "home.cpd.b3.focus": "在仿真和真机上验证导航，并通过 held-out tasks 评估规划决策。",
    "home.cpd.b3.evidence": "V.I.S.O.R. 的 SLAM/Nav2 联调，以及硕士论文的 benchmark、消融与失败分析。",
    "home.cpd.d2.title": "D2 — 技术沟通与作品集呈现",
    "home.cpd.d2.focus": "更清晰地呈现方案、设计决策和结论。",
    "home.cpd.d2.evidence": "项目文档、实验可视化、论文写作和清晰界定个人贡献的作品集。",
    "home.posts.kicker": "文章",
    "home.posts.heading": "技术、作品集与笔记",
    "home.posts.searchLabel": "搜索文章",
    "home.posts.searchPlaceholder": "搜索标题、标签或摘要",
    "home.posts.post1.title": "从简历网站到机器人作品集",
    "home.posts.post1.copy": "为什么作品集应在一页简历之外展示项目证据、个人贡献与反思。",
    "home.posts.post2.title": "机器人方向个人网站的技术栈选择",
    "home.posts.post2.copy": "在当前阶段，轻量静态站足以承载清晰的项目和可维护的写作。",
    "home.posts.post3.title": "让笔记系统保持轻量",
    "home.posts.post3.copy": "先记录、再整理，每次公开输出只回答一个具体问题。",
    "home.notes.kicker": "近期",
    "home.notes.heading": "近期关注",
    "home.notes.item1": "复盘已完成项目中的 ROS2、Nav2、SLAM/TF 与 MuJoCo 决策，为技术面试准备可解释的案例。",
    "home.notes.item2": "学习 PyTorch 基础，目标是独立完成训练、验证和评估闭环。",
    "home.notes.item3": "先学习 Behaviour Cloning 的闭环评测，再逐步理解 ACT、Diffusion Policy 与 VLA。",
    "articleBuild.meta.description": "从一页简历扩展到有项目证据与个人贡献边界的机器人作品集。",
    "articleBuild.eyebrow": "作品集 / 工作流",
    "articleBuild.title": "从简历网站到机器人作品集",
    "articleBuild.lead": "简历概括经历，作品集解释项目的目标、个人贡献、验证方式和局限。",
    "articleBuild.h2a": "先说明方向与边界",
    "articleBuild.p1": "首页应让访问者快速看清我已完成的 MuJoCo 规划评测和 ROS2 导航工作，也分清我仍在学习的 Robot Learning 方向。",
    "articleBuild.h2b": "再展开项目证据",
    "articleBuild.p2": "每个项目都应交代问题、方法、个人贡献和评测结果；没有可访问的仓库或报告时，不放占位链接。",
    "articleBuild.h2c": "持续记录限制与反思",
    "articleBuild.p3": "例如，规划可行性评测不能替代策略训练，团队机器人系统的结果也不能写成个人独立完成。明确边界能让工程证据更可信。",
    "articleBuild.h2d": "保持易维护",
    "articleBuild.p4": "当前版本是轻量静态站。内容多起来后，再考虑用 Markdown/MDX 管理项目与文章。",
    "articleStack.meta.description": "机器人方向个人网站选择技术栈的判断标准。",
    "articleStack.eyebrow": "前端 / 静态站",
    "articleStack.title": "机器人方向个人网站的技术栈选择",
    "articleStack.lead": "技术栈要服务项目证据、实验记录和 CPD 反思，而不是一开始就追求复杂应用能力。",
    "articleStack.h2a": "适合 Astro 的情况",
    "articleStack.p1": "如果网站以项目页、文章和静态证据材料为主，Astro 很合适。它默认输出轻量页面，Markdown 管理也自然。",
    "articleStack.h2b": "适合 Next.js 的情况",
    "articleStack.p2": "如果未来要加入后台、数据库、复杂交互或动态项目管理，Next.js 的扩展空间更大。",
    "articleStack.h2c": "我的建议",
    "articleStack.p3": "个人作品集第一版优先选择低维护方案。先把项目证据、设计和反思结构跑通，再决定是否需要更重的框架。",
    "articleNotes.meta.description": "记录、整理并分享轻量技术笔记的原则。",
    "articleNotes.eyebrow": "笔记 / 写作",
    "articleNotes.title": "让笔记系统保持轻量",
    "articleNotes.lead": "笔记系统的价值不是复杂分类，而是降低记录和回看的阻力。",
    "articleNotes.h2a": "先记录，再整理",
    "articleNotes.p1": "不要让分类系统挡在输入之前。一个收集入口和一个每周整理节奏，通常比复杂标签更可靠。",
    "articleNotes.h2b": "公开输出要更小",
    "articleNotes.p2": "短笔记可以只回答一个问题、解释一个概念，或记录一次决策。小而完整的输出更容易持续。"
  },
  en: {
    pageTitles: {
      home: "Mingyang Xu | Robot Planning & ROS2",
      articleBuild: "From Resume Site to Robotics Portfolio | Mingyang Xu",
      articleStack: "Tech Stack for a Robotics Personal Website | Mingyang Xu",
      articleNotes: "Keeping a Note-Taking System Lightweight | Mingyang Xu"
    },
    "common.name": "Mingyang Xu",
    "common.homeLabel": "Mingyang Xu home",
    "common.primaryNav": "Primary navigation",
    "common.location": "Manchester, UK",
    "common.themeToggle": "Toggle dark mode",
    "common.footer": "© 2026 Mingyang Xu. Robotics, AI and CPD portfolio.",
    "nav.profile": "Profile",
    "nav.projects": "Projects",
    "nav.experience": "Experience",
    "nav.cpd": "CPD",
    "nav.posts": "Writing",
    "nav.about": "Skills",
    "home.meta.description": "Mingyang Xu's work on environment-aware LLM planning in MuJoCo and ROS2 mobile robot navigation.",
    "home.hero.alt": "Quiet technical writing desk illustration",
    "home.hero.sectionLabel": "Introduction",
    "home.hero.eyebrow": "Robot Planning · MuJoCo · ROS2",
    "home.hero.copy": "MSc Robotics student at the University of Manchester. I study environment-aware LLM planning in MuJoCo and work on ROS2 navigation for autonomous mobile robots.",
    "home.hero.primary": "View Projects",
    "home.hero.secondary": "Get in Touch",
    "home.profile.kicker": "Profile",
    "home.profile.heading": "Grounding robot plans in the environment.",
    "home.profile.avatarAlt": "Portrait of Mingyang Xu",
    "home.profile.p1": "I am completing an MSc in Robotics at the University of Manchester (expected December 2026), following a dual degree in Software Engineering / Computer Science & Software Engineering from Fuzhou University and Maynooth University.",
    "home.profile.p2": "My dissertation evaluates whether local LLMs can recognise when a tabletop instruction is feasible, infeasible or ambiguous before a robot executes it. In the V.I.S.O.R. team project, I focused on testing and tuning SLAM and Nav2 navigation on a Leo Rover.",
    "home.profile.p3": "I am interested in embodied intelligence, robot learning and reliable robotic systems. This portfolio separates work I have completed from topics I am still learning.",
    "home.objective.kicker": "Focus",
    "home.objective.heading": "What I work on",
    "home.objective.primary.label": "Research",
    "home.objective.primary.title": "Environment-aware planning",
    "home.objective.primary.copy": "Controlled MuJoCo tasks, matched-pair evaluation, feasibility verification and plan repair for local LLMs.",
    "home.objective.focus.label": "Engineering",
    "home.objective.focus.title": "ROS2 navigation & integration",
    "home.objective.focus.copy": "SLAM mapping and localisation, Nav2 planner and costmap tuning, Gazebo and Leo Rover testing.",
    "home.objective.secondary.label": "Next Step",
    "home.objective.secondary.title": "Robot learning foundations",
    "home.objective.secondary.copy": "Building hands-on PyTorch training and closed-loop imitation-learning evaluation before claiming policy-training experience.",
    "home.projects.kicker": "Selected Projects",
    "home.projects.heading": "Selected Work",
    "home.projects.label.contribution": "My contribution",
    "home.projects.label.result": "Evaluation",
    "home.projects.dissertation.type": "MSc Dissertation · 2026",
    "home.projects.dissertation.title": "Environment-Aware Feasibility Planning for Local LLMs in MuJoCo",
    "home.projects.dissertation.summary": "A MuJoCo tabletop benchmark tests whether local LLMs distinguish executable, infeasible and ambiguous instructions when the language stays fixed but the environment changes.",
    "home.projects.dissertation.contribution": "I designed seven controlled failure categories and implemented a deterministic feasibility verifier. Structured feedback supports up to three rounds of plan repair and blocks plans that remain infeasible from execution.",
    "home.projects.dissertation.result": "Across six local models and 126 held-out tasks, verified planning reached 95.2–100% matched-pair success for five models; the full configuration recorded 0% simulator crashes. This is planning-feasibility evaluation, not robot policy training.",
    "home.projects.dissertation.metricTasks": "tasks",
    "home.projects.dissertation.metricPairs": "matched pairs",
    "home.projects.dissertation.metricRecords": "experiment records",
    "home.projects.dissertation.visualLabel": "Natural-language instruction passes through environment and plan checks to produce an execute, reject or clarify decision",
    "home.projects.dissertation.visualInput": "Natural-language instruction",
    "home.projects.dissertation.visualCheck": "Environment & plan checks",
    "home.projects.dissertation.visualDecision": "Execute · Reject · Clarify",
    "home.projects.leo.type": "Team Robotics Project · 2025–2026",
    "home.projects.leo.imageAlt": "Leo Rover autonomous mobile manipulation project",
    "home.projects.leo.title": "V.I.S.O.R. — Autonomous Mobile Manipulation",
    "home.projects.leo.summary": "Our Leo Rover system combines ROS2, SLAM, navigation, RGB-D perception and arm manipulation to search for objects, approach, grasp, return and sort them by colour.",
    "home.projects.leo.contribution": "I primarily tested and tuned the navigation subsystem: SLAM mapping/localisation, Nav2 global and local planners, costmaps, coverage, obstacle handling and return-to-start. I also supported Gazebo and physical Leo Rover integration tests across SLAM, Nav2, TF and the task flow.",
    "home.links.repository": "Project repository",
    "home.links.teamRepository": "Team repository",
    "home.links.journalMetrics": "Journal metrics",
    "home.experience.kicker": "Experience & Publication",
    "home.experience.heading": "More of the work behind the projects",
    "home.experience.intern.type": "Software Engineering Internship · Jan–May 2024",
    "home.experience.intern.title": "Java Full-Stack Development · Shandong Hongke Information Technology",
    "home.experience.intern.copy": "Worked on functional, regression and acceptance testing with ZenTao; developed Java SSM / MariaDB REST APIs and business features with Elasticsearch, plus Vue2 / ElementUI frontend integration.",
    "home.experience.paper.type": "Publication · 2026",
    "home.experience.paper.meta": "International Journal of Digital Earth · JCR Q1 (2025 metrics) · Third author",
    "home.experience.paper.copy": "Contributed to Writing – original draft. The paper studies rainfall-data management and retrieval using GeoSOT sequential encoding.",
    "home.skills.kicker": "Skills",
    "home.skills.heading": "Technical Skills & Research Methods",
    "home.skills.roboticsTitle": "Robotics Systems",
    "home.skills.roboticsCopy": "ROS2, Nav2, SLAM Toolbox, TF, MuJoCo, Gazebo, PyBullet.",
    "home.skills.perceptionTitle": "Models & Data",
    "home.skills.perceptionCopy": "NumPy, Pandas, local Transformer / LLM inference and planning evaluation.",
    "home.skills.softwareTitle": "Programming & Tools",
    "home.skills.softwareCopy": "Python, Java, C++ (fundamentals), Linux, Git, SSH.",
    "home.skills.practiceTitle": "Research Practice",
    "home.skills.practiceCopy": "Benchmark and ablation design, experiment automation, statistical analysis, visualisation and scientific writing.",
    "home.cpd.kicker": "CPD Evidence",
    "home.cpd.heading": "CPD Reflection and UK-SPEC Evidence",
    "home.cpd.intro": "I use project evidence, tests and reflection to track engineering decisions and the limits of my results.",
    "home.cpd.label.focus": "Focus",
    "home.cpd.label.evidence": "Evidence",
    "home.cpd.a2.title": "A2 — Complex robotics problem-solving",
    "home.cpd.a2.focus": "Separating an instruction from the environment constraints that determine whether it can be executed.",
    "home.cpd.a2.evidence": "MuJoCo matched-pair tasks, deterministic feasibility checks and structured plan-repair feedback.",
    "home.cpd.b3.title": "B3 — Implementation, testing and evaluation",
    "home.cpd.b3.focus": "Testing navigation in simulation and on hardware, then evaluating planning decisions on held-out tasks.",
    "home.cpd.b3.evidence": "V.I.S.O.R. SLAM/Nav2 integration tests and dissertation benchmark, ablations and failure analysis.",
    "home.cpd.d2.title": "D2 — Technical communication and portfolio presentation",
    "home.cpd.d2.focus": "Presenting proposals, design decisions and conclusions more clearly.",
    "home.cpd.d2.evidence": "Project documentation, experiment visualisations, dissertation writing and clearly scoped contribution statements.",
    "home.posts.kicker": "Writing",
    "home.posts.heading": "Technology, Portfolio & Notes",
    "home.posts.searchLabel": "Search articles",
    "home.posts.searchPlaceholder": "Search titles, tags, or summaries",
    "home.posts.post1.title": "From Resume Site to Robotics Portfolio",
    "home.posts.post1.copy": "Why a portfolio needs to show project evidence, contribution and reflection beyond a one-page CV.",
    "home.posts.post2.title": "Choosing a Tech Stack for a Robotics Portfolio",
    "home.posts.post2.copy": "A lightweight static site is enough while the priority is clear projects and maintainable writing.",
    "home.posts.post3.title": "Keeping a Note-Taking System Lightweight",
    "home.posts.post3.copy": "Capture first, organise later, and publish small notes that answer one question at a time.",
    "home.notes.kicker": "Now",
    "home.notes.heading": "Current Focus",
    "home.notes.item1": "Reviewing ROS2, Nav2, SLAM/TF and MuJoCo decisions from completed projects for technical interviews.",
    "home.notes.item2": "Working through PyTorch fundamentals toward an independent train–validate–evaluate loop.",
    "home.notes.item3": "Learning behaviour cloning with closed-loop evaluation before moving toward ACT, diffusion policies and VLA.",
    "articleBuild.meta.description": "Moving from a one-page CV to a robotics portfolio with project evidence and clear contribution boundaries.",
    "articleBuild.eyebrow": "Portfolio / Workflow",
    "articleBuild.title": "From Resume Site to Robotics Portfolio",
    "articleBuild.lead": "A CV summarises experience; a portfolio explains project goals, personal contributions, validation and limits.",
    "articleBuild.h2a": "State the direction and the boundaries",
    "articleBuild.p1": "The homepage should quickly show my completed MuJoCo planning evaluation and ROS2 navigation work, while distinguishing robot-learning topics I am still studying.",
    "articleBuild.h2b": "Develop the project evidence",
    "articleBuild.p2": "Each project needs its question, method, personal contribution and evaluation. If a repository or report is not accessible, I leave out the placeholder link.",
    "articleBuild.h2c": "Record limitations and reflection",
    "articleBuild.p3": "Planning-feasibility evaluation is not policy training, and a team robotics result is not an individual implementation. Clear boundaries make the evidence more credible.",
    "articleBuild.h2d": "Keep it maintainable",
    "articleBuild.p4": "This version is a lightweight static site. If the content grows, Markdown/MDX can manage projects and articles later.",
    "articleStack.meta.description": "How to choose a tech stack for a robotics-focused personal website.",
    "articleStack.eyebrow": "Frontend / Static Site",
    "articleStack.title": "Choosing a Tech Stack for a Robotics Portfolio",
    "articleStack.lead": "The stack should serve project evidence, experiment notes and CPD reflection instead of becoming a complex app too early.",
    "articleStack.h2a": "When Astro Fits",
    "articleStack.p1": "If the site is mostly project pages, writing and static evidence, Astro is a strong fit. It outputs lightweight pages and handles Markdown naturally.",
    "articleStack.h2b": "When Next.js Fits",
    "articleStack.p2": "If the site later needs a dashboard, database, complex interactions or dynamic project management, Next.js leaves more room to grow.",
    "articleStack.h2c": "My Recommendation",
    "articleStack.p3": "For the first version of a personal portfolio, prefer low maintenance. Get the project evidence, design and reflection structure working before choosing a heavier framework.",
    "articleNotes.meta.description": "A lightweight approach to capturing, organising and sharing technical notes.",
    "articleNotes.eyebrow": "Notes / Writing",
    "articleNotes.title": "Keeping a Note-Taking System Lightweight",
    "articleNotes.lead": "The value of notes is not elaborate categories; it is reducing the friction of recording and revisiting ideas.",
    "articleNotes.h2a": "Capture first, organise later",
    "articleNotes.p1": "Do not let classification block input. One capture point and a weekly review are often more reliable than a complex tag system.",
    "articleNotes.h2b": "Keep public notes small",
    "articleNotes.p2": "A short note can answer one question, explain one concept or record one decision. Small, complete pieces are easier to sustain."
  }
};

const getPreferredLanguage = () => {
  const savedLanguage = localStorage.getItem(langStorageKey);

  if (savedLanguage === "zh" || savedLanguage === "en") {
    return savedLanguage;
  }

  return "en";
};

const setText = (selector, attribute, language) => {
  document.querySelectorAll(selector).forEach((element) => {
    const key = element.dataset[attribute];
    const value = translations[language][key];

    if (value === undefined) {
      return;
    }

    if (attribute === "i18nHtml") {
      element.innerHTML = value;
      return;
    }

    element.textContent = value;
  });
};

const setAttribute = (selector, datasetKey, attribute, language) => {
  document.querySelectorAll(selector).forEach((element) => {
    const key = element.dataset[datasetKey];
    const value = translations[language][key];

    if (value !== undefined) {
      element.setAttribute(attribute, value);
    }
  });
};

const applyLanguage = (language) => {
  const page = root.dataset.page || "home";
  const dictionary = translations[language];

  root.lang = language === "zh" ? "zh-CN" : "en";
  root.dataset.lang = language;

  document.title = dictionary.pageTitles[page] || dictionary.pageTitles.home;
  setText("[data-i18n]", "i18n", language);
  setText("[data-i18n-html]", "i18nHtml", language);
  setAttribute("[data-i18n-placeholder]", "i18nPlaceholder", "placeholder", language);
  setAttribute("[data-i18n-alt]", "i18nAlt", "alt", language);
  setAttribute("[data-i18n-title]", "i18nTitle", "title", language);
  setAttribute("[data-i18n-aria-label]", "i18nAriaLabel", "aria-label", language);

  document.querySelectorAll("[data-i18n-meta]").forEach((element) => {
    const value = dictionary[element.dataset.i18nMeta];

    if (value !== undefined) {
      element.setAttribute("content", value);
    }
  });

  document.querySelectorAll(".lang-toggle").forEach((button) => {
    button.textContent = language === "zh" ? "EN" : "中文";
    button.setAttribute("aria-label", language === "zh" ? "Switch to English" : "切换到中文");
    button.setAttribute("title", language === "zh" ? "Switch to English" : "切换到中文");
  });
};

document.querySelectorAll(".lang-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const nextLanguage = root.dataset.lang === "zh" ? "en" : "zh";
    localStorage.setItem(langStorageKey, nextLanguage);
    applyLanguage(nextLanguage);
  });
});

document.querySelector(".theme-toggle")?.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  localStorage.setItem(themeStorageKey, nextTheme);
});

applyLanguage(getPreferredLanguage());

const searchInput = document.querySelector("#postSearch");
const posts = Array.from(document.querySelectorAll(".post-card"));

searchInput?.addEventListener("input", (event) => {
  const value = event.target.value.trim().toLowerCase();

  posts.forEach((post) => {
    const haystack = `${post.textContent} ${post.dataset.search}`.toLowerCase();
    post.hidden = value.length > 0 && !haystack.includes(value);
  });
});
