export type SiteLocale = 'en' | 'zh-CN';

export interface LocaleOption {
  code: SiteLocale;
  label: string;
  htmlLang: string;
}

export const DEFAULT_SITE_LOCALE: SiteLocale = 'en';
export const SITE_LOCALE_STORAGE_KEY = 'linketry-site-locale';

export const siteLocales: readonly LocaleOption[] = [
  { code: 'en', label: 'English', htmlLang: 'en' },
  { code: 'zh-CN', label: '简体中文', htmlLang: 'zh-CN' },
];

const globalMessages = {
  en: {
    'nav.features': 'Features',
    'nav.architecture': 'Architecture',
    'nav.deploy': 'Deploy',
    'nav.docs': 'Docs',
    'nav.demo': 'Live Demo',
    'nav.coffee': 'Coffee',
    'nav.github': 'GitHub',
    'nav.language': 'Language',
    'nav.menu': 'Menu',
    'nav.primary': 'Primary',
    'footer.description': 'Self-hosted link management, analytics and monitoring.',
    'footer.license': 'GPL-3.0',
    'footer.roadmap': 'Roadmap',
    'footer.ownership': 'Built for Cloudflare. Owned by you.',
  },
  'zh-CN': {
    'nav.features': '功能',
    'nav.architecture': '架构',
    'nav.deploy': '部署',
    'nav.docs': '文档',
    'nav.demo': '在线演示',
    'nav.coffee': '支持项目',
    'nav.github': 'GitHub',
    'nav.language': '语言',
    'nav.menu': '菜单',
    'nav.primary': '主导航',
    'footer.description': '自托管短链接管理、访问分析与健康监控。',
    'footer.license': 'GPL-3.0',
    'footer.roadmap': '路线图',
    'footer.ownership': '为 Cloudflare 构建，数据归你所有。',
  },
} as const;

const homeMessages = {
  en: {
    'meta.homeTitle': 'Linketry - Own every link',
    'meta.homeDescription':
      'Self-hosted link management, analytics and monitoring on your Cloudflare account.',
    'home.skip': 'Skip to content',
    'home.brand': 'Linketry home',
    'home.openSource': 'Open source · Self-hosted',
    'home.heroLineOne': 'Own every link.',
    'home.heroLineTwo': 'Understand every click.',
    'home.heroLede':
      'Short links, analytics, health monitoring, imports, backups and automation—deployed inside your own Cloudflare account.',
    'home.liveDemo': 'Open live demo',
    'home.deploy': 'Explore deployment options',
    'home.github': 'View on GitHub',
    'home.demoStatus': 'Read only · Synthetic data · No token required',
    'home.proofData': 'Your data',
    'home.proofDomains': 'Your domains',
    'home.proofPricing': 'No per-click fee',
    'home.featureEyebrow': 'A complete link stack',
    'home.featureTitle': 'More than a URL shortener.',
    'home.featureLede':
      'Run the daily link workflow from one calm interface, while keeping D1 as your source of truth and KV as a fast redirect cache.',
    'home.featureOneTitle': 'Manage and migrate',
    'home.featureOneText':
      'Create, tag, group, archive and bulk-manage links. Import Shlink, JSON or CSV safely with previews, conflict checks and migration records.',
    'home.featureTwoTitle': 'Measure what matters',
    'home.featureTwoText':
      'Explore clicks, visitors, countries, devices, referers, campaigns and conversions with saved views and scheduled reports.',
    'home.featureThreeTitle': 'Monitor and recover',
    'home.featureThreeText':
      'Detect broken destinations, send recovery-aware alerts, keep audit history and protect operations with backups and restore previews.',
    'home.featureFourTitle': 'Integrate on a stable API',
    'home.featureFourText':
      'Build browser extensions, Shortcuts or internal tools against a versioned OpenAPI contract, scoped tokens and signed webhooks.',
    'home.productEyebrow': 'One focused workspace',
    'home.productTitle': 'Clear operations as your link library grows.',
    'home.productText':
      'Simple mode keeps everyday actions close. Advanced mode reveals analytics, monitoring, automation, backups and API tools when you need them.',
    'home.productOne': 'English and Simplified Chinese',
    'home.productTwo': 'Duplicate destination warnings',
    'home.productThree': 'Password protection starts disabled',
    'home.productFour': 'Exportable data and change records',
    'home.architectureEyebrow': 'Built for the edge',
    'home.architectureTitle': 'Fast redirects. Durable truth.',
    'home.architectureText':
      'The redirect path stays small. Analytics and monitoring run outside the critical response, so observability cannot hold up a visitor.',
    'home.architectureNote':
      '<span>Principle</span> D1 is always the source of truth. KV accelerates redirects but never owns primary link state.',
    'home.factsEyebrow': 'Canonical facts',
    'home.factsTitle': 'Clear answers about Linketry.',
    'home.factsLede':
      'Concise product and infrastructure facts for operators, search engines and AI assistants.',
    'home.factsWhatQuestion': 'What is Linketry?',
    'home.factsWhatAnswer':
      'An open-source, self-hosted platform for short links, analytics, destination health, imports, backups and automation on Cloudflare.',
    'home.factsDataQuestion': 'Where is data stored?',
    'home.factsDataAnswer':
      'D1 is the source of truth. KV is redirect cache only; optional R2 stores backups.',
    'home.factsDemoQuestion': 'Does production require the public Demo?',
    'home.factsDemoAnswer':
      "No. Production uses resources in the owner's account and never requires Demo mode, Demo resources or synthetic data.",
    'home.factsRedirectQuestion': 'Can analytics delay a redirect?',
    'home.factsRedirectAnswer':
      'No. Redirects return first; analytics work runs asynchronously outside the critical response.',
    'home.deployEyebrow': 'Self-hosted on Cloudflare',
    'home.deployTitle': 'A deployment path that stays understandable.',
    'home.deployText':
      'Start from Cloudflare or follow the reviewed repository workflow. Both paths keep resource ownership, secrets, dry runs and confirmation gates explicit.',
    'home.deployAction': 'View deployment paths',
    'home.docsEyebrow': 'Open by default',
    'home.docsTitle': 'Docs for operators and builders.',
    'home.docsText': 'Every feature, deployment track and recovery path lives with the source.',
    'home.docsSelfTitle': 'Self-hosting',
    'home.docsSelfText': 'Provision D1 and KV, deploy, log in and run smoke checks.',
    'home.docsSelfAction': 'Open guide',
    'home.docsApiTitle': 'API contract',
    'home.docsApiText': 'Use the authenticated versioned API and OpenAPI document.',
    'home.docsApiAction': 'Read API docs',
    'home.docsBackupTitle': 'Backup & recovery',
    'home.docsBackupText': 'Export portable data and preview restores before writing.',
    'home.docsBackupAction': 'Plan recovery',
    'home.docsRoadmapTitle': 'Roadmap',
    'home.docsRoadmapText': 'See what is complete and which ideas remain deferred.',
    'home.docsRoadmapAction': 'View roadmap',
    'home.roadmapEyebrow': 'Road to 1.0',
    'home.roadmapTitle': 'Built in public, one stable layer at a time.',
    'home.roadmapComplete': 'Complete',
    'home.roadmapCoreTitle': 'Core link platform',
    'home.roadmapCoreText':
      'Redirects, Admin, analytics, monitoring, migration, backups and OpenAPI.',
    'home.roadmapActive': 'In progress',
    'home.roadmapActiveTitle': 'Public launch foundation',
    'home.roadmapActiveText':
      'Beginner deployment, project site, isolated Demo and operational hardening.',
    'home.roadmapPlanned': 'Planned',
    'home.roadmapPlannedTitle': 'Access and integrations',
    'home.roadmapPlannedText':
      'Optional Cloudflare Access, async events, card views and richer link presentation.',
    'home.ctaEyebrow': 'Your links, your infrastructure',
    'home.ctaTitle': 'Start with one link.<br />Keep control as you grow.',
    'home.ctaGithub': 'Get Linketry on GitHub',
    'home.ctaGuide': 'Read the guide',
  },
  'zh-CN': {
    'meta.homeTitle': 'Linketry - 掌控每一条链接',
    'meta.homeDescription': '在你的 Cloudflare 账户中自托管短链接管理、访问分析与健康监控。',
    'home.skip': '跳至正文',
    'home.brand': 'Linketry 首页',
    'home.openSource': '开源 · 自托管',
    'home.heroLineOne': '掌控每一条链接。',
    'home.heroLineTwo': '看清每一次点击。',
    'home.heroLede':
      '短链接、分析、健康监控、导入、备份与自动化，都部署在你自己的 Cloudflare 账户中。',
    'home.liveDemo': '打开在线演示',
    'home.deploy': '查看部署方案',
    'home.github': '在 GitHub 查看',
    'home.demoStatus': '只读 · 合成数据 · 无需令牌',
    'home.proofData': '你的数据',
    'home.proofDomains': '你的域名',
    'home.proofPricing': '没有按点击收费',
    'home.featureEyebrow': '完整的链接技术栈',
    'home.featureTitle': '不止是短链接服务。',
    'home.featureLede':
      '在一个克制清晰的界面中处理日常链接工作流，同时让 D1 保持为事实来源、KV 专注于加速跳转。',
    'home.featureOneTitle': '管理与迁移',
    'home.featureOneText':
      '创建、打标、分组、归档与批量管理链接；通过预览、冲突检查和迁移记录安全导入 Shlink、JSON 或 CSV。',
    'home.featureTwoTitle': '衡量真正重要的内容',
    'home.featureTwoText': '通过已保存视图和定时报告分析点击、访客、国家、设备、来源、活动和转化。',
    'home.featureThreeTitle': '监控与恢复',
    'home.featureThreeText':
      '发现失效目标、发送支持恢复的告警、保留审计历史，并用备份与恢复预览保护日常运维。',
    'home.featureFourTitle': '对接稳定 API',
    'home.featureFourText':
      '基于版本化 OpenAPI 契约、范围令牌和签名 Webhook 构建浏览器扩展、快捷指令或内部工具。',
    'home.productEyebrow': '一个专注的工作台',
    'home.productTitle': '链接库增长，操作依然清晰。',
    'home.productText':
      '简洁模式让日常动作近在手边；需要时再展开分析、监控、自动化、备份和 API 工具。',
    'home.productOne': '英文与简体中文',
    'home.productTwo': '重复目标地址提示',
    'home.productThree': '密码保护默认关闭',
    'home.productFour': '可导出的数据与变更记录',
    'home.architectureEyebrow': '为边缘而构建',
    'home.architectureTitle': '跳转快速，事实可靠。',
    'home.architectureText':
      '跳转路径保持精简；分析和监控在关键响应之外运行，因此可观测性不会阻塞访问者。',
    'home.architectureNote':
      '<span>原则</span> D1 始终是事实来源。KV 负责加速跳转，不拥有主链接状态。',
    'home.factsEyebrow': '权威事实',
    'home.factsTitle': '关于 Linketry 的清晰答案。',
    'home.factsLede': '面向运维者、搜索引擎和 AI 助手的简明产品与基础设施事实。',
    'home.factsWhatQuestion': 'Linketry 是什么？',
    'home.factsWhatAnswer':
      '一个运行在 Cloudflare 上的开源自托管平台，用于短链接、分析、目标健康监控、导入、备份与自动化。',
    'home.factsDataQuestion': '数据存在哪里？',
    'home.factsDataAnswer': 'D1 是事实来源；KV 仅作为跳转缓存，可选 R2 用于存储备份。',
    'home.factsDemoQuestion': '生产部署需要公共 Demo 吗？',
    'home.factsDemoAnswer':
      '不需要。生产环境使用所有者账户中的资源，不需要 Demo 模式、Demo 资源或合成数据。',
    'home.factsRedirectQuestion': '分析失败会延迟跳转吗？',
    'home.factsRedirectAnswer': '不会。跳转会先返回，分析工作在关键响应之外异步执行。',
    'home.deployEyebrow': '在 Cloudflare 上自托管',
    'home.deployTitle': '清晰可控的部署路径。',
    'home.deployText':
      '从 Cloudflare 启动，或遵循经过审查的仓库工作流。两条路径都会明确资源归属、密钥、预演和确认关卡。',
    'home.deployAction': '查看部署路径',
    'home.docsEyebrow': '默认开放',
    'home.docsTitle': '面向运维者与开发者的文档。',
    'home.docsText': '每项功能、部署路径和恢复流程都随源码维护。',
    'home.docsSelfTitle': '自托管',
    'home.docsSelfText': '配置 D1 与 KV，部署、登录并执行冒烟检查。',
    'home.docsSelfAction': '打开指南',
    'home.docsApiTitle': 'API 契约',
    'home.docsApiText': '使用已认证的版本化 API 和 OpenAPI 文档。',
    'home.docsApiAction': '阅读 API 文档',
    'home.docsBackupTitle': '备份与恢复',
    'home.docsBackupText': '导出可移植数据，并在写入前预览恢复。',
    'home.docsBackupAction': '规划恢复',
    'home.docsRoadmapTitle': '路线图',
    'home.docsRoadmapText': '查看已完成内容与仍被延后的想法。',
    'home.docsRoadmapAction': '查看路线图',
    'home.roadmapEyebrow': '迈向 1.0',
    'home.roadmapTitle': '公开构建，一次稳固一层。',
    'home.roadmapComplete': '已完成',
    'home.roadmapCoreTitle': '核心链接平台',
    'home.roadmapCoreText': '跳转、后台、分析、监控、迁移、备份和 OpenAPI。',
    'home.roadmapActive': '进行中',
    'home.roadmapActiveTitle': '公开发布基础',
    'home.roadmapActiveText': '新手部署、项目站点、隔离 Demo 与运维加固。',
    'home.roadmapPlanned': '已规划',
    'home.roadmapPlannedTitle': '访问控制与集成',
    'home.roadmapPlannedText': '可选 Cloudflare Access、异步事件、卡片视图和更丰富的链接展示。',
    'home.ctaEyebrow': '你的链接，你的基础设施',
    'home.ctaTitle': '从一条链接开始。<br />随着增长保持掌控。',
    'home.ctaGithub': '在 GitHub 获取 Linketry',
    'home.ctaGuide': '阅读指南',
  },
} as const;

const deployMessages = {
  en: {
    'meta.deployTitle': 'Deploy Linketry on Cloudflare',
    'meta.deployDescription':
      'Deploy a production Linketry instance with Cloudflare Quick Deploy or the reviewed repository workflow.',
    'deploy.skip': 'Skip to deployment options',
    'deploy.eyebrow': 'Cloudflare deployment',
    'deploy.title': 'Deploy Linketry with the right amount of control.',
    'deploy.lede':
      'Create a normal production instance in your own Cloudflare account. Quick Deploy bundles the Admin with one Worker; the reviewed repository workflow keeps the separate Pages architecture and stricter approval gates.',
    'deploy.quickAction': 'Deploy production on Cloudflare',
    'deploy.guideAction': 'Read self-hosting guide',
    'deploy.quickLabel': 'A · Cloudflare production deploy',
    'deploy.quickTitle': 'Create one complete production Worker.',
    'deploy.quickText':
      'Cloudflare forks the repository, provisions a new D1 database and KV namespace, builds the Admin into the Worker, and applies the production migrations in your account.',
    'deploy.quickStepOne':
      'Sign in to the Cloudflare account that will own this production instance.',
    'deploy.quickStepTwo':
      'Choose the Worker, D1 and KV names, then enter a private Admin login token.',
    'deploy.quickStepThree':
      'Deploy, open the Worker URL at /admin/, and configure that hostname as your first short-link domain.',
    'deploy.quickActionLabel': 'Deploy production instance',
    'deploy.quickNoteTitle': 'Production only. No Demo resources or synthetic data.',
    'deploy.quickNote':
      'The quick profile never enables Demo mode and never asks for LINKETRY_DEMO_* values. It starts on workers.dev; add a custom domain later when you are ready.',
    'deploy.reviewedLabel': 'B · Reviewed repository workflow',
    'deploy.reviewedTitle': 'Provision exactly what you approve.',
    'deploy.reviewedText':
      "Fork the repository and use Linketry's maintained dry runs. The scripts show the D1/KV plan and require an exact confirmation phrase before any Cloudflare or GitHub write.",
    'deploy.reviewedStepOne':
      'Fork Linketry into the GitHub account that will own future upgrades.',
    'deploy.reviewedStepTwo': 'Run the bootstrap and repository configuration dry runs.',
    'deploy.reviewedStepThree':
      'Review the plan, confirm the exact phrase, then start the protected workflow.',
    'deploy.copyTitle': 'Guarded assistant prompt',
    'deploy.copyAction': 'Copy prompt',
    'deploy.copyStatus':
      'The prompt does not ask for a token in chat, source files, logs, or command arguments.',
    'deploy.copySuccess': 'Prompt copied',
    'deploy.copySuccessStatus': 'Prompt copied. Paste it into your AI coding assistant.',
    'deploy.copyUnavailable': 'The deployment prompt is unavailable. Open the full guide.',
    'deploy.copyFailure': 'Copy failed. Select the prompt and copy it manually.',
    'deploy.prompt':
      'Help me deploy Linketry from my fork to my own Cloudflare account.\n\n1. Read AGENTS.md and docs/SELF_HOSTING.md before acting.\n2. Use the basic fresh-install profile: one Worker hostname, D1, KV and the automatic Pages Admin URL. Do not enable optional R2, Queue or branded Admin DNS.\n3. Run deploy:bootstrap and deploy:configure in dry-run mode first. Show me the resource plan and exact confirmation phrase before every apply or deployment.\n4. Keep Cloudflare and GitHub tokens out of source files, logs and command arguments. Ask me to enter them only through supported hidden prompts or secret stores.\n5. Stop on any safety-gate failure. Do not bypass migration, account or domain checks.\n6. After deployment, verify /health, the Admin login page and one test short link.',
    'deploy.reviewedAction': 'Open full repository guide',
    'deploy.boundaryTitle': 'Choose a path for a fresh installation only.',
    'deploy.boundaryText':
      'Existing Linketry instances must use the non-destructive upgrade path, preserve their current bindings, and verify a backup before migrations.',
    'deploy.boundaryAction': 'Read upgrade guidance',
    'deploy.docsEyebrow': 'Before any write',
    'deploy.docsTitle': 'Read the contract, then deploy.',
    'deploy.docsPreflightTitle': 'Deployment safety model',
    'deploy.docsPreflightText': 'Review target validation, redaction and failure boundaries.',
    'deploy.docsSelfTitle': 'Fresh self-hosting',
    'deploy.docsSelfText': 'Use the exact account, domain, D1, KV and GitHub setup sequence.',
    'deploy.docsRecoveryTitle': 'Backup and recovery',
    'deploy.docsRecoveryText':
      'Understand export, preview and restore boundaries before an upgrade.',
    'deploy.docsAction': 'Open guide',
  },
  'zh-CN': {
    'meta.deployTitle': '在 Cloudflare 上部署 Linketry',
    'meta.deployDescription':
      '通过 Cloudflare 快速部署或经过审查的仓库工作流部署生产 Linketry 实例。',
    'deploy.skip': '跳至部署方案',
    'deploy.eyebrow': 'Cloudflare 部署',
    'deploy.title': '用恰当的控制力部署 Linketry。',
    'deploy.lede':
      '在你自己的 Cloudflare 账户中创建正常生产实例。快速部署会把 Admin 与一个 Worker 打包；经过审查的仓库工作流则保留独立 Pages 架构和更严格的审批门。',
    'deploy.quickAction': '在 Cloudflare 部署生产实例',
    'deploy.guideAction': '阅读自托管指南',
    'deploy.quickLabel': 'A · Cloudflare 生产部署',
    'deploy.quickTitle': '创建一个完整的生产 Worker。',
    'deploy.quickText':
      'Cloudflare 会 Fork 仓库，在你的账户中新建 D1 数据库和 KV 命名空间，把 Admin 构建进 Worker，并应用生产迁移。',
    'deploy.quickStepOne': '登录将拥有此生产实例的 Cloudflare 账户。',
    'deploy.quickStepTwo': '选择 Worker、D1 和 KV 名称，再输入私有 Admin 登录令牌。',
    'deploy.quickStepThree':
      '完成部署，打开 Worker 地址的 /admin/，并把该主机名设为第一条短链域名。',
    'deploy.quickActionLabel': '部署生产实例',
    'deploy.quickNoteTitle': '仅部署生产环境，不创建 Demo 资源或合成数据。',
    'deploy.quickNote':
      '快速配置不会开启 Demo 模式，也不会要求填写任何 LINKETRY_DEMO_* 值。实例先运行在 workers.dev，准备好后再添加自定义域名。',
    'deploy.reviewedLabel': 'B · 经过审查的仓库工作流',
    'deploy.reviewedTitle': '只配置你明确批准的资源。',
    'deploy.reviewedText':
      'Fork 仓库并使用 Linketry 维护的预演命令。脚本会展示 D1/KV 计划，并要求精确确认短语后才会写入 Cloudflare 或 GitHub。',
    'deploy.reviewedStepOne': '将 Linketry Fork 到将来拥有升级权限的 GitHub 账户。',
    'deploy.reviewedStepTwo': '运行资源初始化和仓库配置的预演。',
    'deploy.reviewedStepThree': '检查计划、确认精确短语，再启动受保护的工作流。',
    'deploy.copyTitle': '受控助手提示词',
    'deploy.copyAction': '复制提示词',
    'deploy.copyStatus': '提示词不会要求你把令牌放进聊天、源码、日志或命令参数。',
    'deploy.copySuccess': '提示词已复制',
    'deploy.copySuccessStatus': '提示词已复制，可粘贴到你的 AI 编程助手。',
    'deploy.copyUnavailable': '部署提示词不可用，请打开完整指南。',
    'deploy.copyFailure': '复制失败，请选中提示词后手动复制。',
    'deploy.prompt':
      '请帮助我从自己的 Fork 部署 Linketry 到自己的 Cloudflare 账户。\n\n1. 操作前先阅读 AGENTS.md 和 docs/SELF_HOSTING.md。\n2. 使用基础全新安装配置：一个 Worker 主机名、D1、KV 和自动 Pages Admin URL；不要启用可选 R2、Queue 或品牌化 Admin DNS。\n3. 先以 dry-run 模式运行 deploy:bootstrap 和 deploy:configure；每次 apply 或部署前展示资源计划和精确确认短语。\n4. 不要把 Cloudflare 和 GitHub 令牌放进源码、日志或命令参数；只让我通过受支持的隐藏提示或密钥存储输入。\n5. 任一安全门失败即停止，不要绕过迁移、账户或域名检查。\n6. 部署后验证 /health、Admin 登录页和一条测试短链接。',
    'deploy.reviewedAction': '打开完整仓库指南',
    'deploy.boundaryTitle': '只为全新安装选择此路径。',
    'deploy.boundaryText':
      '已有 Linketry 实例必须使用非破坏性升级路径，保留现有绑定，并在迁移前验证备份。',
    'deploy.boundaryAction': '阅读升级说明',
    'deploy.docsEyebrow': '任何写入之前',
    'deploy.docsTitle': '先阅读契约，再执行部署。',
    'deploy.docsPreflightTitle': '部署安全模型',
    'deploy.docsPreflightText': '查看目标校验、脱敏和失败边界。',
    'deploy.docsSelfTitle': '全新自托管',
    'deploy.docsSelfText': '遵循账户、域名、D1、KV 和 GitHub 的准确配置顺序。',
    'deploy.docsRecoveryTitle': '备份与恢复',
    'deploy.docsRecoveryText': '升级前理解导出、预览和恢复的边界。',
    'deploy.docsAction': '打开指南',
  },
} as const;

export const siteMessages = {
  en: { ...globalMessages.en, ...homeMessages.en, ...visualMessages.en, ...deployMessages.en },
  'zh-CN': {
    ...globalMessages['zh-CN'],
    ...homeMessages['zh-CN'],
    ...visualMessages['zh-CN'],
    ...deployMessages['zh-CN'],
  },
};
import { visualMessages } from './siteVisualMessages';
