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
      home: "Mingyang Xu | 机器人、具身智能与机器学习",
      articleBuild: "从简历网站到个人博客 | Mingyang Xu",
      articleStack: "机器人方向个人网站技术栈选择 | Mingyang Xu",
      articleNotes: "短笔记系统应该足够轻 | Mingyang Xu"
    },
    "common.name": "Mingyang Xu",
    "common.homeLabel": "Mingyang Xu 首页",
    "common.primaryNav": "主导航",
    "common.location": "英国曼彻斯特",
    "common.themeToggle": "切换深色模式",
    "common.footer": "© 2026 Mingyang Xu。机器人、AI 与 CPD 作品集。",
    "nav.profile": "简介",
    "nav.projects": "项目",
    "nav.cpd": "CPD",
    "nav.posts": "文章",
    "nav.about": "技能",
    "home.meta.description": "Mingyang Xu 的机器人、具身智能、机器学习和 CPD 证据作品集。",
    "home.hero.alt": "安静的技术写作桌面插画",
    "home.hero.sectionLabel": "个人介绍",
    "home.hero.eyebrow": "Robotics · Embodied AI · Machine Learning",
    "home.hero.copy": "曼彻斯特大学机器人学硕士在读，具有软件工程背景，专注于基于 ROS2 的自主系统、机器人感知、具身智能和应用机器学习。",
    "home.hero.primary": "查看项目",
    "home.hero.secondary": "CPD 反思",
    "home.profile.kicker": "Profile",
    "home.profile.heading": "机器人与 AI 作品集，以及 CPD 证据。",
    "home.profile.avatarAlt": "Mingyang Xu 头像",
    "home.profile.p1": "我目前在曼彻斯特大学攻读机器人学硕士，具备福州大学和梅努斯大学的软件工程学习背景。",
    "home.profile.p2": "我的当前工作重点包括自主机器人、ROS2 系统集成、机器人感知、控制和应用 AI。我的主要职业目标是进入具身智能或机器人公司，次要方向是科技公司的 AI 与机器学习工程岗位。",
    "home.profile.p3": "本网站展示我的代表项目、技术证据和 CPD 反思，说明我如何通过机器人、AI 和软件项目发展工程能力。",
    "home.objective.kicker": "Career Objective",
    "home.objective.heading": "职业目标",
    "home.objective.primary.label": "Primary Direction",
    "home.objective.primary.title": "具身智能与机器人公司",
    "home.objective.primary.copy": "希望参与自主机器人、具身智能和机器人系统工程相关工作。",
    "home.objective.focus.label": "Technical Focus",
    "home.objective.focus.title": "ROS2、感知、导航与集成",
    "home.objective.focus.copy": "ROS2、机器人感知、导航、运动规划、机器学习评估和系统集成。",
    "home.objective.secondary.label": "Secondary Direction",
    "home.objective.secondary.title": "AI 与机器学习工程",
    "home.objective.secondary.copy": "科技公司的 AI 与机器学习工程岗位。",
    "home.projects.kicker": "Selected Projects",
    "home.projects.heading": "项目证据",
    "home.projects.label.contribution": "个人贡献",
    "home.projects.label.reflection": "反思",
    "home.projects.label.focus": "技术重点",
    "home.projects.leo.type": "机器人代表项目",
    "home.projects.leo.imageAlt": "Leo Rover 自主移动操作项目证据图片",
    "home.projects.leo.title": "Leo Rover 自主移动操作",
    "home.projects.leo.summary": "基于 Leo Rover 平台的团队机器人项目，开发自主移动操作流程，结合 ROS2、SLAM 导航、感知、任务状态逻辑与抓取放置。",
    "home.projects.leo.contribution": "我的贡献集中在理解 ROS2 系统结构、记录软件架构和任务执行流程、支持感知到行为的集成、准备测试证据，并反思系统层面的限制。我也帮助将团队实现转化为清晰的图表和说明，用于最终项目证据。",
    "home.projects.leo.reflection": "该项目让我理解到，自主机器人不仅依赖单个算法选择，更依赖感知、导航、操作和状态管理的可靠集成。",
    "home.projects.uav.type": "控制项目",
    "home.projects.uav.imageAlt": "UAV 反馈控制图",
    "home.projects.uav.title": "UAV 位置与偏航稳定反馈控制",
    "home.projects.uav.summary": "面向无人机位置和偏航稳定的反馈控制项目。控制器比较当前状态与目标位姿，并生成 x、y、z 和偏航角速度命令。",
    "home.projects.uav.contribution": "我独立完成 controller_simple.py，包括用于仿真测试和真实平台实验的核心反馈控制逻辑。",
    "home.projects.bytedance.type": "Machine Learning / NLP Internship",
    "home.projects.bytedance.title": "ByteDance 机器学习实习：中文 NLP 模型优化",
    "home.projects.bytedance.summary": "一项机器学习实习项目，聚焦中文语言任务中的 NLP 模型实现与优化，涉及 Skip-gram、LSTM 和 BERT-wwm，并关注中文阅读理解和模型性能提升。",
    "home.projects.bytedance.contribution": "我的贡献包括实现模型流程、实验不同 NLP 架构、支持中文阅读理解优化，并分析模型表现。这段经历加强了我对机器学习工作流、模型评估以及研究模型与实际 AI 应用之间关系的理解。",
    "home.projects.bytedance.focus": "项目涉及自然语言处理、表示学习、序列建模、基于 Transformer 的语言模型，以及中文 NLP 任务中的性能评估。",
    "home.projects.gis.type": "地理空间工程",
    "home.projects.gis.title": "GIS 与时空数据工程",
    "home.projects.gis.summary": "涉及空间数据处理、加权重分配方法和性能敏感 Python 实现的地理空间数据项目。",
    "home.projects.gis.focus": "使用 GeoPandas、Rasterio、NumPy 和 Shapely 进行地理空间处理，关注坐标系统、栅格-矢量操作和计算效率。",
    "home.links.demo": "Demo Video",
    "home.links.github": "GitHub Repository",
    "home.links.githubShort": "GitHub",
    "home.links.report": "Report",
    "home.links.architecture": "Architecture Diagram",
    "home.links.code": "Code",
    "home.links.notes": "Experiment Notes",
    "home.links.notesShort": "Notes",
    "home.links.results": "Training Results",
    "home.links.projectNotes": "Project Notes",
    "home.links.modelResults": "Model Results",
    "home.links.internshipReflection": "Internship Reflection",
    "home.skills.kicker": "Skills",
    "home.skills.heading": "技术技能与工程实践",
    "home.skills.roboticsTitle": "机器人与具身系统",
    "home.skills.perceptionTitle": "机器人感知与 AI",
    "home.skills.softwareTitle": "软件工程",
    "home.skills.practiceTitle": "专业实践",
    "home.cpd.kicker": "CPD Evidence",
    "home.cpd.heading": "CPD 反思与 UK-SPEC 证据",
    "home.cpd.intro": "本网站支持我的 CPD Reflection 提交，并为部分 UK-SPEC 能力项提供证据。",
    "home.cpd.label.focus": "Focus",
    "home.cpd.label.evidence": "Evidence",
    "home.cpd.a2.title": "A2 — 复杂机器人问题解决",
    "home.cpd.a2.focus": "发展在具身智能和机器人系统中解决复杂技术问题的能力。",
    "home.cpd.a2.evidence": "Leo Rover ROS2 集成、导航/感知/操作流程、系统调试和任务状态逻辑。",
    "home.cpd.b3.title": "B3 — 实施、测试与评估",
    "home.cpd.b3.focus": "提升我实施工程解决方案并根据需求评估结果的方式。",
    "home.cpd.b3.evidence": "Leo Rover 任务测试、UAV 控制器实现、仿真与受控测试、基于需求的反思。",
    "home.cpd.d2.title": "D2 — 技术沟通与作品集呈现",
    "home.cpd.d2.focus": "更清晰地呈现方案、设计决策和结论。",
    "home.cpd.d2.evidence": "软件架构图、任务执行流程、视频脚本、项目报告和本次重建的作品集网站。",
    "home.posts.kicker": "Writing",
    "home.posts.heading": "机器人、AI 与 CPD 笔记",
    "home.posts.searchLabel": "搜索文章",
    "home.posts.searchPlaceholder": "搜索标题、标签或摘要",
    "home.posts.read6": "6 分钟阅读",
    "home.posts.read5": "5 分钟阅读",
    "home.posts.read3": "3 分钟阅读",
    "home.posts.post1.title": "构建 ROS2 移动操作系统带给我的收获",
    "home.posts.post1.copy": "关于如何把感知、导航、操作和任务状态逻辑整合进同一机器人流程的简短反思。",
    "home.posts.post2.title": "从课程演示到工程证据",
    "home.posts.post2.copy": "我如何通过记录需求、测试、图表、限制和反思，把项目输出转化为工程证据。",
    "home.posts.post3.title": "如何用作品集网站记录 CPD",
    "home.posts.post3.copy": "用作品集结构连接项目材料、个人贡献和 UK-SPEC 能力证据。",
    "home.notes.kicker": "Now",
    "home.notes.heading": "近期关注",
    "home.notes.item1": "具身智能、自主机器人和 ROS2 系统集成。",
    "home.notes.item2": "机器人感知、RGB-D 传感、目标检测和机器学习评估。",
    "home.notes.item3": "作品集建设、技术沟通和 CPD 证据整理。",
    "articleBuild.meta.description": "从简历网站扩展到个人博客的思路。",
    "articleBuild.eyebrow": "博客 / 工作流",
    "articleBuild.title": "从简历网站到个人博客：我想沉淀什么",
    "articleBuild.lead": "简历负责概括经历，博客负责解释过程。两者结合，才能更完整地呈现研究和工程能力。",
    "articleBuild.h2a": "第一步：保留清晰结构",
    "articleBuild.p1": "首页需要快速说明身份、方向、项目和证据，让访问者理解我正在发展哪些机器人与 AI 工程能力。",
    "articleBuild.h2b": "第二步：用项目补足细节",
    "articleBuild.p2": "项目卡片需要展示目标、个人贡献、证据链接和反思，而不是只罗列经历。",
    "articleBuild.h2c": "第三步：让内容支持 CPD",
    "articleBuild.p3": "作品集可以把项目材料、测试证据和反思连接起来，形成可持续更新的 CPD 记录。",
    "articleBuild.h2d": "下一步",
    "articleBuild.p4": "当前版本先保持静态页面。后续可以迁移到 <code>Astro</code> 或 <code>Next.js</code>，把项目证据和文章改成 Markdown/MDX 管理。",
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
    "articleNotes.meta.description": "轻量短笔记系统的设计原则。",
    "articleNotes.eyebrow": "笔记 / CPD",
    "articleNotes.title": "如何用作品集网站记录 CPD",
    "articleNotes.lead": "CPD 记录的关键不是写得很长，而是持续连接项目、证据、反思和下一步行动。",
    "articleNotes.h2a": "先记录证据",
    "articleNotes.p1": "每个项目都应保留报告、代码、视频、图表或测试结果。证据材料让反思更具体。",
    "articleNotes.h2b": "再写反思",
    "articleNotes.p2": "好的反思应该说明我做了什么、学到了什么、仍有哪些限制，以及下一次会如何改进。"
  },
  en: {
    pageTitles: {
      home: "Mingyang Xu | Robotics, Embodied AI & Machine Learning",
      articleBuild: "From Resume Site to Personal Blog | Mingyang Xu",
      articleStack: "Tech Stack for a Robotics Personal Website | Mingyang Xu",
      articleNotes: "How I Use a Portfolio Website to Record CPD | Mingyang Xu"
    },
    "common.name": "Mingyang Xu",
    "common.homeLabel": "Mingyang Xu home",
    "common.primaryNav": "Primary navigation",
    "common.location": "Manchester, UK",
    "common.themeToggle": "Toggle dark mode",
    "common.footer": "© 2026 Mingyang Xu. Robotics, AI and CPD portfolio.",
    "nav.profile": "Profile",
    "nav.projects": "Projects",
    "nav.cpd": "CPD",
    "nav.posts": "Writing",
    "nav.about": "Skills",
    "home.meta.description": "Mingyang Xu's robotics, embodied AI, machine learning and CPD evidence portfolio.",
    "home.hero.alt": "Quiet technical writing desk illustration",
    "home.hero.sectionLabel": "Introduction",
    "home.hero.eyebrow": "Robotics · Embodied AI · Machine Learning",
    "home.hero.copy": "MSc Robotics student at the University of Manchester with a software engineering background, focusing on ROS2-based autonomous systems, robot perception, embodied intelligence and applied machine learning.",
    "home.hero.primary": "View Projects",
    "home.hero.secondary": "CPD Reflection",
    "home.profile.kicker": "Profile",
    "home.profile.heading": "Robotics and AI portfolio with CPD evidence.",
    "home.profile.avatarAlt": "Portrait of Mingyang Xu",
    "home.profile.p1": "I am an MSc Robotics student at the University of Manchester, building on a Software Engineering background from Fuzhou University and Maynooth University.",
    "home.profile.p2": "My current work focuses on autonomous robotics, ROS2 system integration, robot perception, control and applied AI. My primary career goal is to work in embodied intelligence or robotics companies, with a secondary interest in AI and machine learning roles in technology companies.",
    "home.profile.p3": "This website presents selected projects, technical evidence and CPD reflections, including how I developed my engineering competence through robotics, AI and software projects.",
    "home.objective.kicker": "Career Objective",
    "home.objective.heading": "Career Objective",
    "home.objective.primary.label": "Primary Direction",
    "home.objective.primary.title": "Embodied intelligence and robotics companies",
    "home.objective.primary.copy": "I aim to contribute to autonomous robots, embodied intelligence and robotics system engineering.",
    "home.objective.focus.label": "Technical Focus",
    "home.objective.focus.title": "ROS2, perception, navigation and integration",
    "home.objective.focus.copy": "ROS2, robot perception, navigation, motion planning, machine learning evaluation and system integration.",
    "home.objective.secondary.label": "Secondary Direction",
    "home.objective.secondary.title": "AI and machine learning engineering",
    "home.objective.secondary.copy": "AI and machine learning engineering roles in technology companies.",
    "home.projects.kicker": "Selected Projects",
    "home.projects.heading": "Project Evidence",
    "home.projects.label.contribution": "My contribution",
    "home.projects.label.reflection": "Reflection",
    "home.projects.label.focus": "Technical focus",
    "home.projects.leo.type": "Featured Robotics Project",
    "home.projects.leo.imageAlt": "Leo Rover autonomous mobile manipulation project evidence",
    "home.projects.leo.title": "Leo Rover Autonomous Mobile Manipulation",
    "home.projects.leo.summary": "A team robotics project developing an autonomous mobile-manipulation pipeline on the Leo Rover platform. The system combined ROS2, SLAM-supported navigation, perception, mission-state logic and manipulation to search for, approach, grasp and place target objects.",
    "home.projects.leo.contribution": "My contribution focused on understanding the ROS2 system structure, documenting the software architecture and mission execution flow, supporting perception-to-behaviour integration, preparing testing evidence, and reflecting on system-level limitations. I also helped translate the team’s implementation into clear diagrams and explanations for the final project evidence.",
    "home.projects.leo.reflection": "This project helped me understand that autonomous robotics depends not only on selecting individual algorithms, but also on integrating perception, navigation, manipulation and state management into a reliable system.",
    "home.projects.uav.type": "Control Project",
    "home.projects.uav.imageAlt": "UAV feedback control diagram",
    "home.projects.uav.title": "UAV Feedback Control for Position and Yaw Stabilisation",
    "home.projects.uav.summary": "A feedback control project for UAV position and yaw stabilisation. The controller compared the current drone state with a target pose and generated velocity commands for x, y, z and yaw rate.",
    "home.projects.uav.contribution": "I individually completed controller_simple.py, including the core feedback-control logic used for simulation testing and real-platform experiments.",
    "home.projects.bytedance.type": "Machine Learning / NLP Internship",
    "home.projects.bytedance.title": "ByteDance Machine Learning Internship: Chinese NLP Model Optimisation",
    "home.projects.bytedance.summary": "A machine learning internship project focused on implementing and optimising NLP models for Chinese language tasks. The work involved Skip-gram, LSTM and BERT-wwm models, with attention to Chinese reading comprehension and model performance improvement.",
    "home.projects.bytedance.contribution": "My contribution included implementing model pipelines, experimenting with different NLP architectures, supporting Chinese reading comprehension optimisation, and analysing model performance. This experience strengthened my understanding of machine learning workflows, model evaluation and the connection between research models and practical AI applications.",
    "home.projects.bytedance.focus": "The project involved natural language processing, representation learning, sequence modelling, Transformer-based language models and performance evaluation for Chinese NLP tasks.",
    "home.projects.gis.type": "Geospatial Engineering",
    "home.projects.gis.title": "GIS and Spatiotemporal Data Engineering",
    "home.projects.gis.summary": "A geospatial data project involving spatial data processing, weighted redistribution methods and performance-aware Python implementation.",
    "home.projects.gis.focus": "The work involved GeoPandas, Rasterio, NumPy and Shapely for geospatial processing, with attention to coordinate systems, raster-vector operations and computational efficiency.",
    "home.links.demo": "Demo Video",
    "home.links.github": "GitHub Repository",
    "home.links.githubShort": "GitHub",
    "home.links.report": "Report",
    "home.links.architecture": "Architecture Diagram",
    "home.links.code": "Code",
    "home.links.notes": "Experiment Notes",
    "home.links.notesShort": "Notes",
    "home.links.results": "Training Results",
    "home.links.projectNotes": "Project Notes",
    "home.links.modelResults": "Model Results",
    "home.links.internshipReflection": "Internship Reflection",
    "home.skills.kicker": "Skills",
    "home.skills.heading": "Technical Skills and Engineering Practice",
    "home.skills.roboticsTitle": "Robotics and Embodied Systems",
    "home.skills.perceptionTitle": "Robot Perception and AI",
    "home.skills.softwareTitle": "Software Engineering",
    "home.skills.practiceTitle": "Professional Practice",
    "home.cpd.kicker": "CPD Evidence",
    "home.cpd.heading": "CPD Reflection and UK-SPEC Evidence",
    "home.cpd.intro": "This website supports my CPD Reflection submission and provides evidence for selected UK-SPEC competencies.",
    "home.cpd.label.focus": "Focus",
    "home.cpd.label.evidence": "Evidence",
    "home.cpd.a2.title": "A2 — Complex robotics problem-solving",
    "home.cpd.a2.focus": "Developing stronger ability to solve complex technical problems in embodied intelligence and robotics systems.",
    "home.cpd.a2.evidence": "Leo Rover ROS2 integration, navigation/perception/manipulation pipeline, system debugging and mission-state logic.",
    "home.cpd.b3.title": "B3 — Implementation, testing and evaluation",
    "home.cpd.b3.focus": "Improving how I implement engineering solutions and evaluate them against requirements.",
    "home.cpd.b3.evidence": "Leo Rover mission testing, UAV controller implementation, simulation and controlled testing, requirements-based reflection.",
    "home.cpd.d2.title": "D2 — Technical communication and portfolio presentation",
    "home.cpd.d2.focus": "Presenting proposals, design decisions and conclusions more clearly.",
    "home.cpd.d2.evidence": "Software architecture diagrams, mission execution flow, video scripts, project reports and this rebuilt portfolio website.",
    "home.posts.kicker": "Writing",
    "home.posts.heading": "Robotics, AI and CPD Notes",
    "home.posts.searchLabel": "Search articles",
    "home.posts.searchPlaceholder": "Search titles, tags, or summaries",
    "home.posts.read6": "6 min read",
    "home.posts.read5": "5 min read",
    "home.posts.read3": "3 min read",
    "home.posts.post1.title": "What I Learned from Building a ROS2 Mobile-Manipulation System",
    "home.posts.post1.copy": "A short reflection on integrating perception, navigation, manipulation and mission-state logic into one robotics pipeline.",
    "home.posts.post2.title": "From Coursework Demo to Engineering Evidence",
    "home.posts.post2.copy": "How I turn project outputs into evidence by recording requirements, tests, diagrams, limitations and reflection.",
    "home.posts.post3.title": "How I Use a Portfolio Website to Record CPD",
    "home.posts.post3.copy": "Using a portfolio structure to connect project artefacts, personal contribution and UK-SPEC competence evidence.",
    "home.notes.kicker": "Now",
    "home.notes.heading": "Current Focus",
    "home.notes.item1": "Embodied intelligence, autonomous robotics and ROS2 system integration.",
    "home.notes.item2": "Robot perception, RGB-D sensing, object detection and machine learning evaluation.",
    "home.notes.item3": "Portfolio development, technical communication and CPD evidence.",
    "articleBuild.meta.description": "Notes on extending a resume website into a robotics and AI portfolio.",
    "articleBuild.eyebrow": "Blog / Workflow",
    "articleBuild.title": "From Resume Site to Robotics Portfolio",
    "articleBuild.lead": "A portfolio should present project evidence, contribution and reflection, not only summarise experience.",
    "articleBuild.h2a": "Step 1: Keep the Structure Clear",
    "articleBuild.p1": "The homepage should quickly explain identity, direction, projects and evidence, so visitors understand the robotics and AI competence I am developing.",
    "articleBuild.h2b": "Step 2: Use Projects for Detail",
    "articleBuild.p2": "Project cards should show objectives, personal contribution, evidence links and reflection instead of listing experience only.",
    "articleBuild.h2c": "Step 3: Support CPD",
    "articleBuild.p3": "A portfolio can connect project artefacts, testing evidence and reflection into a CPD record that can be updated over time.",
    "articleBuild.h2d": "Next Step",
    "articleBuild.p4": "This version stays static first. Later it can move to <code>Astro</code> or <code>Next.js</code> so project evidence and articles can be managed with Markdown/MDX.",
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
    "articleNotes.meta.description": "Design principles for recording CPD through a portfolio website.",
    "articleNotes.eyebrow": "Notes / CPD",
    "articleNotes.title": "How I Use a Portfolio Website to Record CPD",
    "articleNotes.lead": "The point of CPD evidence is not long writing; it is connecting projects, artefacts, reflection and next actions.",
    "articleNotes.h2a": "Record Evidence First",
    "articleNotes.p1": "Each project should keep reports, code, videos, diagrams or test results. Evidence makes reflection specific.",
    "articleNotes.h2b": "Then Write Reflection",
    "articleNotes.p2": "A useful reflection explains what I did, what I learned, what limits remain, and how I would improve the next version."
  }
};

const getPreferredLanguage = () => {
  const savedLanguage = localStorage.getItem(langStorageKey);

  if (savedLanguage === "zh" || savedLanguage === "en") {
    return savedLanguage;
  }

  return "zh";
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
