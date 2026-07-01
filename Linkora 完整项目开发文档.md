
## 1. 项目名称

**Linkora**

## 2. 项目定位

Linkora 是一个轻量、稳定、方便管理、可长期升级的自建短链系统。

它不是复杂 SaaS，也不是单纯复制 Shlink / Sink / Dub，而是面向个人站长、小团队、外贸推广、SEO 项目、Affiliate 链接管理和多站点运营的稳定短链工具。

核心目标：

* 稳定跳转
* 方便管理
* 数据可控
* 易于备份
* 易于迁移
* 支持多来源导入
* 后续可升级统计、智能跳转、API、自动备份等功能
* 优先保证短链访问稳定，统计和后台功能不能影响跳转

---

## 3. 核心原则

Linkora 的第一原则是：

```txt
跳转稳定优先。
```

具体原则：

```txt
1. 跳转逻辑必须简单、快速、稳定。
2. 统计失败不能影响跳转。
3. KV 只做缓存，D1 才是主数据库。
4. 所有数据必须支持导出和备份。
5. 管理后台要简单，不要过度复杂。
6. 功能要模块化，方便后续扩展。
7. 不要第一版就做成复杂 SaaS。
8. 导入旧系统数据时，必须尽量保留原 slug，避免旧短链失效。
```

---

## 4. 域名规划

测试阶段：

```txt
go.y8o.de       = Linkora 测试短链域名
admin.y8o.de    = Linkora 管理后台
```

正式阶段：

```txt
s.y8o.de        = 正式短链域名，后期从 Shlink 切换到 Linkora
admin.y8o.de    = Linkora 管理后台
```

迁移原则：

```txt
不要一开始直接动 s.y8o.de。
先部署 go.y8o.de 测试。
导入 Shlink 数据并确认旧 slug 正常后，再考虑切换 s.y8o.de。
Shlink 保留 1-2 周作为回滚。
```

---

## 5. 推荐技术栈

```txt
Cloudflare Workers
Cloudflare D1
Cloudflare KV
Cloudflare R2，V3 用于备份
Cloudflare Queues，V3 可选，用于异步统计和任务
Cloudflare Cron Triggers，V3 用于自动备份
TypeScript
React
Vite
Tailwind CSS
```

推荐架构：

```txt
Cloudflare Workers 负责短链跳转和 API。
D1 作为主数据库。
KV 作为 slug → long_url 的热缓存。
React + Vite + Tailwind 作为管理后台。
R2 后续用于自动备份。
Queues 后续用于异步统计。
```

---

## 6. 系统架构

### 6.1 短链跳转流程

```txt
用户访问 https://go.y8o.de/abc
↓
Worker 获取 slug = abc
↓
先查 KV 缓存
↓
KV 命中：直接 301 / 302 跳转
↓
KV 未命中：查 D1 links 表
↓
D1 查到 active 链接：写入 KV，然后跳转
↓
异步记录访问统计
↓
如果不存在：返回友好 404 页面
```

### 6.2 后台管理流程

```txt
管理员访问 admin.y8o.de
↓
登录 Linkora Admin
↓
创建、编辑、搜索、导入、导出短链
↓
通过认证 API 操作 D1 数据
↓
创建 / 修改 / 禁用 / 删除链接时，同步更新或清理 KV
```

### 6.3 数据关系

```txt
links          = 短链主表
visits         = 访问明细
daily_stats    = 每日统计聚合，V2/V3
tags           = 标签
domains        = 自定义短链域名，V2
import_jobs    = 导入任务
api_tokens     = API Token
settings       = 系统设置
audit_logs     = 操作日志，V2
backups        = 备份记录，V3
redirect_rules = 智能跳转规则，V3
```

---

## 7. 功能阶段规划

## V1：稳定可用版

目标：替代 Shlink 的基础使用，能稳定跳转、管理、导入 Shlink、导出备份。

V1 必须完成：

```txt
1. 短链跳转
2. 后台登录
3. 创建短链
4. 编辑短链
5. 删除 / 禁用短链
6. 搜索短链
7. 标签字段
8. 基础点击数统计
9. Shlink 数据导入
10. 通用 CSV / JSON 简单导入
11. CSV / JSON 导出备份
12. 健康检查 /health
13. 基础 Settings
14. KV 缓存
15. 导入预览和冲突检测
16. 删除前二次确认
```

V1 暂时不做：

```txt
多用户
团队权限
复杂图表
AI slug
按国家跳转
按设备跳转
密码访问
安全提示页
UTM 模板
自动备份到 R2
高级 API Token 权限
```

---

## V2：管理增强版

目标：让 Linkora 后台比 Shlink 更好用，吸收 Sink 的好用功能。

V2 功能：

```txt
1. 链接过期时间 expires_at
2. 最大访问次数 max_clicks
3. 批量创建短链
4. 批量编辑标签
5. 批量禁用 / 启用
6. 批量删除
7. 自动抓取网页标题
8. 二维码生成
9. 安全提示页 warning page
10. 密码访问
11. UTM 参数模板
12. 更完整的标签管理
13. Tag 颜色
14. Links 高级筛选
15. 按 clicks、created_at、last_clicked_at 排序
16. 操作日志 audit logs
17. Sink 导入适配
18. YOURLS 导入适配
19. Dub 导入适配
20. Generic CSV 字段映射增强
21. Generic JSON / JSONL 字段映射增强
22. 导入报告下载
23. 重复 slug 处理策略：跳过、重命名、覆盖
24. Linkora 自有 backup.json 恢复导入
```

V2 页面增强：

```txt
Overview 仪表盘增强
Links 高级表格
Bulk Actions 批量操作
Tags 页面
Import Wizard 导入向导
Export / Backup 页面
Audit Logs 页面
Settings 页面增强
```

---

## V3：高级统计和自动化版

目标：让 Linkora 支持长期运营、统计分析、自动备份和 API 管理。

V3 功能：

```txt
1. 高级访问统计
2. 每日访问趋势
3. Top Links
4. Top Referers
5. Top Countries
6. Top Devices
7. Top Browsers
8. Top Operating Systems
9. Bot 过滤
10. 最近访问记录
11. 聚合统计 daily_stats
12. 自动备份到 Cloudflare R2
13. 每日定时备份
14. 最近 30 天备份保留
15. 一键恢复备份
16. API Token 管理
17. Token 权限范围：read、write、admin
18. Token 撤销
19. Webhook 通知
20. 链接异常访问提醒
21. 健康检查增强
22. 系统状态页
23. Cloudflare Queues 异步统计
24. Cron 定时任务
25. 多短链域名管理
26. 自定义 404 页面
27. 自定义过期页面
28. 自定义禁用页面
29. 自定义安全提示页
```

V3 技术升级：

```txt
引入 R2 保存备份文件。
引入 Cron Triggers 定时生成备份。
引入 Queues 处理访问统计。
增加 daily_stats 表减少 visits 查询压力。
增加 api_tokens 表做正式 API 权限管理。
```

---

## V4：智能跳转和运营增强版

目标：让 Linkora 具备更高级的推广、Affiliate、SEO、站群运营能力。

V4 功能：

```txt
1. 按国家跳转
2. 按设备跳转
3. 按浏览器跳转
4. 按 referer 跳转
5. 按语言跳转
6. A/B 测试跳转
7. 权重分流
8. 备用链接 fallback_url
9. 目标链接健康检查
10. 目标链接失效提醒
11. 批量替换目标 URL
12. 批量追加 UTM 参数
13. 常用 UTM 模板
14. Campaign 活动管理
15. Project / Folder 分组
16. 多域名绑定
17. 多用户，后续可选
18. 角色权限，后续可选
19. 团队协作，后续可选
20. AI slug
21. AI title
22. AI 描述
23. AI 标签建议
24. Affiliate 链接备注
25. Link notes 链接备注
26. Public stats page，公开统计页，可选
27. OpenGraph 预览
28. Link health checker
29. 目标页面状态码监控
30. 自动归档长期无访问链接
```

V4 注意：

```txt
V4 是长期方向，不要影响 V1-V3 的稳定性。
所有智能跳转规则必须模块化。
如果规则异常，要回退到默认 long_url。
智能跳转失败不能导致短链打不开。
```

---

## 8. 数据库设计

## 8.1 links 表

```sql
CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  long_url TEXT NOT NULL,
  short_url TEXT,
  title TEXT,
  description TEXT,
  tags TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  redirect_type INTEGER NOT NULL DEFAULT 302,
  clicks INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  source_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_clicked_at TEXT,
  expires_at TEXT,
  max_clicks INTEGER,
  password_hash TEXT,
  warning_enabled INTEGER NOT NULL DEFAULT 0,
  fallback_url TEXT,
  archived INTEGER NOT NULL DEFAULT 0
);
```

字段说明：

```txt
id                Linkora 内部 ID
slug              短链后缀
domain            短链域名，V2/V3 多域名时使用
long_url          目标长链接
short_url         完整短链
title             标题
description       描述
tags              标签，JSON 字符串
status            active / disabled / expired / archived
redirect_type     301 / 302，默认 302
clicks            点击数
source            数据来源，比如 shlink、sink、yourls、dub
source_id         原系统 ID
created_at        创建时间
updated_at        更新时间
last_clicked_at   最近访问时间
expires_at        过期时间
max_clicks        最大访问次数
password_hash     密码访问，V2
warning_enabled   是否开启安全提示页，V2
fallback_url      备用目标链接，V4
archived          是否归档
```

---

## 8.2 visits 表

```sql
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  link_id TEXT,
  slug TEXT NOT NULL,
  domain TEXT,
  referer TEXT,
  country TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT,
  ip_hash TEXT,
  is_bot INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
```

---

## 8.3 daily_stats 表

V2/V3 用于聚合统计，避免 visits 表过大后后台变慢。

```sql
CREATE TABLE IF NOT EXISTS daily_stats (
  id TEXT PRIMARY KEY,
  link_id TEXT,
  slug TEXT NOT NULL,
  date TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  unique_clicks INTEGER NOT NULL DEFAULT 0,
  top_country TEXT,
  top_referer TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## 8.4 tags 表

```sql
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## 8.5 domains 表

V2/V3 支持多短链域名。

```sql
CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  is_default INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## 8.6 import_jobs 表

```sql
CREATE TABLE IF NOT EXISTS import_jobs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  filename TEXT,
  total_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  conflict_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  report TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);
```

---

## 8.7 api_tokens 表

```sql
CREATE TABLE IF NOT EXISTS api_tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  scopes TEXT NOT NULL,
  last_used_at TEXT,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);
```

---

## 8.8 settings 表

```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL
);
```

---

## 8.9 audit_logs 表

V2 开始使用。

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  detail TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);
```

---

## 8.10 backups 表

V3 使用。

```sql
CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  storage TEXT NOT NULL,
  size INTEGER,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

---

## 8.11 redirect_rules 表

V4 使用。

```sql
CREATE TABLE IF NOT EXISTS redirect_rules (
  id TEXT PRIMARY KEY,
  link_id TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  rule_config TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

rule_type 示例：

```txt
country
device
browser
referer
language
ab_test
weighted
```

---

## 9. API 设计

## 9.1 公共 API

### 健康检查

```txt
GET /health
```

返回：

```json
{
  "status": "ok",
  "name": "Linkora",
  "version": "0.1.0"
}
```

### 短链跳转

```txt
GET /:slug
```

逻辑：

```txt
1. 排除 /api、/admin、/health 等保留路径。
2. 查询 KV。
3. KV 未命中查 D1。
4. 链接不存在返回 404。
5. 链接 disabled 返回禁用页面。
6. 链接 expired 返回过期页面。
7. 如果开启 password，则进入密码页。
8. 如果开启 warning page，则进入提示页。
9. 如果有 redirect_rules，则执行规则。
10. 正常则 301 / 302 跳转。
11. 异步统计访问。
```

---

## 9.2 管理 API

所有管理 API 需要认证。

V1 认证方式：

```txt
Authorization: Bearer <ADMIN_TOKEN>
```

V3 后升级为：

```txt
API Token + scopes
```

---

### Auth

```txt
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

---

### Links

```txt
GET    /api/links
POST   /api/links
GET    /api/links/:id
PUT    /api/links/:id
DELETE /api/links/:id
POST   /api/links/:id/disable
POST   /api/links/:id/enable
POST   /api/links/:id/archive
POST   /api/links/:id/restore
```

列表参数：

```txt
keyword
tag
status
domain
source
sort
page
pageSize
```

---

### Bulk Actions

V2 开始。

```txt
POST /api/links/bulk-delete
POST /api/links/bulk-disable
POST /api/links/bulk-enable
POST /api/links/bulk-tag
POST /api/links/bulk-archive
POST /api/links/bulk-update-destination
```

---

### Import

```txt
POST /api/import/preview
POST /api/import/confirm
GET  /api/import/jobs
GET  /api/import/jobs/:id
GET  /api/import/jobs/:id/report.csv
```

---

### Export

```txt
GET /api/export/links.csv
GET /api/export/links.json
GET /api/export/backup.json
GET /api/export/visits.csv
```

---

### Analytics

V2/V3 开始。

```txt
GET /api/analytics/overview
GET /api/analytics/links/:id
GET /api/analytics/top-links
GET /api/analytics/top-referrers
GET /api/analytics/top-countries
GET /api/analytics/daily
```

---

### Tags

```txt
GET    /api/tags
POST   /api/tags
PUT    /api/tags/:id
DELETE /api/tags/:id
```

---

### Domains

V2/V3 开始。

```txt
GET    /api/domains
POST   /api/domains
PUT    /api/domains/:id
DELETE /api/domains/:id
POST   /api/domains/:id/set-default
```

---

### API Tokens

V3 开始。

```txt
GET    /api/tokens
POST   /api/tokens
DELETE /api/tokens/:id
POST   /api/tokens/:id/revoke
```

---

### Backups

V3 开始。

```txt
GET  /api/backups
POST /api/backups/create
GET  /api/backups/:id/download
POST /api/backups/:id/restore
```

---

### Settings

```txt
GET /api/settings
PUT /api/settings
```

---

## 10. 后台页面设计

后台名称：

```txt
Linkora Admin
```

左侧菜单：

```txt
Overview
Links
Create Link
Tags
Import / Export
Analytics
Domains
Backups
API Tokens
Audit Logs
Settings
```

V1 菜单只启用：

```txt
Overview
Links
Create Link
Import / Export
Settings
```

V2/V3 再逐步启用其他菜单。

---

## 10.1 Overview 页面

V1 显示：

```txt
总短链数
总点击数
今日点击数
最近创建的短链
点击最多的短链
系统状态
```

V2/V3 增强：

```txt
近 7 天访问趋势
近 30 天访问趋势
Top Tags
Top Referrers
Top Countries
异常访问提示
备份状态
```

---

## 10.2 Links 页面

表格字段：

```txt
Short URL
Slug
Long URL
Title
Tags
Clicks
Status
Domain
Source
Created At
Last Clicked At
Actions
```

操作按钮：

```txt
Copy
Edit
Stats
Disable / Enable
Archive
Delete
```

功能：

```txt
搜索 slug、long_url、title、tags
按 tag 筛选
按 status 筛选
按 source 筛选
按 domain 筛选
按 clicks 排序
按 created_at 排序
按 last_clicked_at 排序
分页
批量操作
删除前二次确认
```

---

## 10.3 Create Link 页面

字段：

```txt
Long URL
Custom Slug
Title
Description
Tags
Domain
Redirect Type
Status
Expiration Date
Max Clicks
Password
Warning Page
UTM Template
Fallback URL
```

V1 只启用：

```txt
Long URL
Custom Slug
Title
Tags
Redirect Type
Status
```

---

## 10.4 Import / Export 页面

模块：

```txt
Upload File
Source Type
Auto Detect
Preview
Field Mapping
Conflict Handling
Confirm Import
Import Report
Export Backup
Restore Backup
```

---

## 10.5 Analytics 页面

V2/V3 显示：

```txt
点击趋势
Top Links
Top Referrers
Top Countries
Top Devices
Top Browsers
最近访问记录
Bot 访问比例
```

---

## 10.6 Settings 页面

设置项：

```txt
默认短链域名
默认跳转类型 301 / 302
默认是否开启统计
默认是否启用 warning page
保留路径
API 设置
备份设置
自定义 404 页面
自定义过期页面
自定义禁用页面
```

---

## 11. 导入系统设计

Linkora 需要做成可扩展导入系统。

导入来源路线：

```txt
V1:
Shlink
Generic CSV
Generic JSON / JSONL

V2:
Sink
YOURLS
Dub
Bitly
Rebrandly
TinyURL

V3:
Linkora backup.json restore
更多自定义字段映射
```

---

## 11.1 Import Adapter 接口

```ts
export interface ImportAdapter {
  source: string;
  detect(input: unknown): boolean;
  parse(input: unknown): Promise<NormalizedImportItem[]>;
  validate(item: NormalizedImportItem): ImportValidationResult;
}
```

统一标准数据结构：

```ts
export interface NormalizedImportItem {
  slug: string;
  longUrl: string;
  shortUrl?: string;
  title?: string;
  description?: string;
  tags?: string[];
  clicks?: number;
  createdAt?: string;
  updatedAt?: string;
  lastClickedAt?: string;
  source?: string;
  sourceId?: string;
  raw?: unknown;
}
```

---

## 11.2 V1 Shlink 导入适配

支持格式：

```txt
Shlink JSON
Shlink JSONL
Shlink CSV
```

字段映射：

```txt
Shlink shortCode              → Linkora slug
Shlink shortUrl               → Linkora short_url
Shlink longUrl                → Linkora long_url
Shlink title                  → Linkora title
Shlink tags                   → Linkora tags
Shlink dateCreated            → Linkora created_at
Shlink visitsSummary.total    → Linkora clicks
source                        → shlink
```

导入要求：

```txt
导入前必须预览
导入前显示总记录数
显示可导入数量
显示 slug 冲突数量
显示无效 URL 数量
默认保留原 shortCode 作为 slug
slug 冲突默认跳过
不允许静默覆盖已有短链
导入前自动生成 backup.json
导入后显示报告
```

---

## 11.3 后续平台字段映射

### Sink

```txt
slug / key              → slug
url / target / longUrl  → long_url
title                   → title
tags                    → tags
clicks                  → clicks
createdAt               → created_at
```

### YOURLS

```txt
keyword                 → slug
url                     → long_url
title                   → title
clicks                  → clicks
timestamp               → created_at
```

### Dub

```txt
key                     → slug
url                     → long_url
shortLink               → short_url
title                   → title
tags                    → tags
clicks                  → clicks
createdAt               → created_at
```

### Bitly

```txt
id / custom_bitlinks    → slug
long_url                → long_url
link                    → short_url
title                   → title
created_at              → created_at
```

### Generic CSV / JSON

允许用户手动映射：

```txt
slug
long_url
short_url
title
description
tags
clicks
created_at
updated_at
last_clicked_at
```

---

## 12. 导入冲突处理

V1：

```txt
skip = 跳过冲突项
```

V2：

```txt
rename = 自动重命名 slug
overwrite = 覆盖已有链接，需要二次确认
```

导入报告必须包含：

```txt
总数量
成功导入数量
跳过数量
冲突数量
失败数量
失败原因
```

支持下载：

```txt
import-report-YYYY-MM-DD.csv
```

---

## 13. 安全要求

### URL 校验

```txt
long_url 必须以 http:// 或 https:// 开头
禁止 javascript:
禁止 data:
禁止空 URL
禁止非法 URL
```

### Slug 校验

只允许：

```txt
a-z
A-Z
0-9
-
_
```

禁止保留路径：

```txt
admin
api
health
login
settings
assets
static
favicon.ico
robots.txt
sitemap.xml
```

### API 安全

```txt
管理 API 必须认证
Token 不能写死在前端代码里
Token 只保存 hash
错误信息不能暴露堆栈
删除操作需要二次确认
导入前自动备份
敏感配置不能提交到 GitHub
```

---

## 14. 缓存策略

KV key：

```txt
linkora:slug:<domain>:<slug>
```

KV value：

```json
{
  "id": "link_id",
  "slug": "vps",
  "domain": "go.y8o.de",
  "longUrl": "https://example.com",
  "redirectType": 302,
  "status": "active",
  "expiresAt": null,
  "maxClicks": null,
  "warningEnabled": false
}
```

缓存规则：

```txt
创建链接：写入 D1，写入 KV
编辑链接：更新 D1，删除旧 KV，写入新 KV
禁用链接：更新 D1，删除 KV
删除链接：删除 D1，删除 KV
访问链接：先查 KV，未命中查 D1，查到后写 KV
```

---

## 15. 统计策略

跳转时异步统计：

```txt
clicks +1
last_clicked_at 更新
visits 表插入记录
daily_stats 聚合更新，V2/V3
```

要求：

```txt
统计失败不能影响跳转。
不要因为 visits 插入失败导致用户打不开短链。
```

Worker 中可以使用：

```txt
ctx.waitUntil()
```

异步执行统计。

V3 可以把统计写入 Queues，进一步降低跳转压力。

---

## 16. 导出和备份

V1 支持：

```txt
导出 links.csv
导出 links.json
导出 backup.json
```

V2 支持：

```txt
导出 visits.csv
导入 Linkora backup.json
导入报告下载
```

V3 支持：

```txt
自动备份到 R2
每天定时备份
保留最近 30 天
一键恢复
```

backup.json 结构：

```json
{
  "name": "Linkora Backup",
  "version": "0.1.0",
  "exportedAt": "2026-07-01T00:00:00.000Z",
  "links": [],
  "settings": [],
  "tags": []
}
```

备份文件命名：

```txt
linkora-backup-YYYY-MM-DD.json
linkora-links-YYYY-MM-DD.csv
linkora-visits-YYYY-MM-DD.csv
```

---

## 17. 项目目录结构

```txt
linkora/
├── apps/
│   ├── worker/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── importers/
│   │   │   ├── analytics/
│   │   │   ├── db/
│   │   │   ├── cache/
│   │   │   ├── auth/
│   │   │   └── utils/
│   │   ├── wrangler.toml
│   │   └── package.json
│   │
│   └── admin/
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── api/
│       │   ├── hooks/
│       │   └── utils/
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   └── shared/
│       ├── types/
│       └── validators/
│
├── migrations/
│   └── 0001_init.sql
│
├── docs/
│   ├── DEPLOYMENT.md
│   ├── IMPORT_SHLINK.md
│   ├── IMPORT_ADAPTERS.md
│   ├── MIGRATION_FROM_SHLINK.md
│   ├── BACKUP_AND_RESTORE.md
│   ├── ROADMAP.md
│   └── API.md
│
├── README.md
└── package.json
```

---

## 18. 开发步骤

### Step 1：初始化项目

```txt
创建 Linkora monorepo
配置 TypeScript
配置 ESLint / Prettier
创建 Worker app
创建 Admin app
创建 shared types
```

### Step 2：创建数据库

```txt
创建 D1 database
创建 migrations/0001_init.sql
创建 links / visits / settings / import_jobs 表
提供本地和线上迁移命令
```

### Step 3：实现短链跳转

```txt
实现 GET /health
实现 GET /:slug
实现 KV 查询
实现 D1 fallback
实现 302 跳转
实现 404 页面
实现 disabled 页面
实现异步统计
```

### Step 4：实现管理 API

```txt
实现认证
实现 links CRUD
实现搜索和分页
实现禁用/启用
实现删除
实现导出 CSV/JSON
```

### Step 5：实现 Linkora Admin

```txt
实现登录页
实现 Overview
实现 Links 列表
实现 Create Link
实现 Edit Link
实现 Import / Export
实现 Settings
```

### Step 6：实现 Shlink 导入

```txt
实现 ShlinkAdapter
支持 JSON / JSONL / CSV
实现导入预览
实现字段映射
实现冲突检测
实现确认导入
实现导入报告
导入前自动备份
```

### Step 7：测试和部署

```txt
本地测试
部署到 go.y8o.de
导入少量 Shlink 数据测试
随机测试旧 slug
导入完整 Shlink 数据
观察 1-2 周
确认稳定后再切换 s.y8o.de
```

---

## 19. 从 Shlink 切换到 Linkora 的流程

```txt
1. Shlink 保持运行
2. 从 Shlink 导出所有短链
3. 部署 Linkora 到 go.y8o.de
4. 导入 Shlink 数据
5. 随机测试 30-50 条旧 slug
6. 重点测试高访问 slug
7. 确认 Linkora 后台和跳转都正常
8. 备份 Shlink 数据库
9. 将 s.y8o.de DNS / Cloudflare 路由切到 Linkora Worker
10. Shlink 保留 1-2 周作为回滚
```

回滚方案：

```txt
如果 Linkora 出现问题，立即把 s.y8o.de 切回 Shlink。
```

---

## 20. README 要求

README 必须包含：

```txt
项目介绍
功能列表
技术栈
本地开发
Cloudflare D1 创建
Cloudflare KV 创建
Cloudflare R2 创建，V3
环境变量配置
数据库迁移
部署 Worker
部署 Admin
Shlink 导入说明
数据导出备份说明
从 Shlink 切换流程
回滚方案
常见问题
Roadmap
```

---

## 21. 文档要求

必须创建：

```txt
README.md
docs/DEPLOYMENT.md
docs/IMPORT_SHLINK.md
docs/IMPORT_ADAPTERS.md
docs/MIGRATION_FROM_SHLINK.md
docs/BACKUP_AND_RESTORE.md
docs/API.md
docs/ROADMAP.md
docs/SECURITY.md
```

---

## 22. 第一版验收标准

V1 完成后必须满足：

```txt
1. /health 返回正常
2. 可以创建短链
3. 可以访问短链并跳转
4. 不存在的 slug 返回 404
5. 可以编辑短链
6. 可以禁用短链
7. 可以删除短链
8. 可以搜索短链
9. 可以按 tag 筛选
10. 可以导入 Shlink JSON / CSV / JSONL
11. 导入时保留原 shortCode
12. slug 冲突不会覆盖旧数据
13. 可以导出 CSV / JSON
14. 统计失败不会影响跳转
15. 修改链接后 KV 缓存会更新
16. 后台 API 必须认证
17. long_url 和 slug 有安全校验
18. 有完整部署文档
19. 有 Shlink 迁移文档
20. 有回滚方案
```

---

## 23. 长期 Roadmap

### V1：稳定替代 Shlink

```txt
短链跳转
后台管理
Shlink 导入
基础统计
导出备份
KV 缓存
```

### V2：后台管理增强

```txt
批量操作
链接过期
访问次数限制
密码访问
安全提示页
二维码
自动抓标题
Sink / YOURLS / Dub 导入
更强字段映射
操作日志
```

### V3：统计和自动化

```txt
高级统计
daily_stats
自动备份到 R2
API Token 管理
Webhook
健康状态页
Cloudflare Queues
Cron 定时任务
多域名管理
```

### V4：智能跳转和运营

```txt
国家跳转
设备跳转
浏览器跳转
Referer 跳转
语言跳转
A/B 测试
权重分流
目标链接健康检查
UTM 模板
Campaign 管理
Project / Folder 分组
AI slug
AI title
AI 标签建议
```

---

## 24. 开发注意事项

```txt
不要一次性把 V1-V4 全部做完。
先完成 V1，确保稳定。
V2/V3/V4 作为明确 roadmap 写入 docs/ROADMAP.md。
所有未来功能要预留数据库字段或模块接口，但不要影响 V1 稳定性。
```

最重要的是：

```txt
Linkora 的核心价值不是功能多，而是稳定、好用、可控。
```

这版就比较完整了。开发时你可以让 Codex 先读这个文档，然后要求它：**只实现 V1，但保留 V2/V3/V4 的目录、接口和 Roadmap，不要一开始把后续功能全写死进去。**
