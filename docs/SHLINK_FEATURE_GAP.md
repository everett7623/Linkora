# Shlink 功能差距分析

Linketry 的核心定位是**自托管短链接管理、访问分析与健康监控平台**，目前已覆盖创建、重定向、统计、导入导出、备份恢复与实例重置等核心能力。Shlink 作为成熟竞品，有一些 Linketry 尚未实现的高级能力。本文档列出差距、影响和建议版本。

> 来源：Shlink 官方功能、API key roles 与 advanced redirect 文档。
> 最近复核：2026-07-19
> 对应 Linketry 版本：0.28.5

---

## 已对齐的核心能力

| 能力               | Linketry 状态 | 备注                                                         |
| ------------------ | ------------- | ------------------------------------------------------------ |
| 短链创建/编辑/删除 | ✅            | `/api/v1/links` 完整 CRUD                                    |
| 自定义 slug        | ✅            | 支持单段 slug                                                |
| 多域名             | ✅            | 域名目录、默认域名、启停与迁移 UI 已实现                     |
| 301/302 重定向     | ✅            | `redirect_type` 支持 301 和 302                              |
| 访问统计           | ✅            | `visits` 表记录国家、浏览器、设备、referer、UA 等            |
| 机器人标记         | ✅            | `visits.is_bot` + `analytics/botDetection.ts`                |
| 标签               | ✅            | 标签 CRUD 与导入导出                                         |
| 公开统计页         | ✅            | `publicStats` 模块                                           |
| QR 码              | ✅            | Admin 列表支持生成并下载 PNG                                 |
| 导入/导出          | ✅            | Shlink、Generic CSV/JSON/JSONL、Linketry backup              |
| 重定向规则         | ✅            | country/device/browser/language/referer/weighted             |
| Webhook            | ✅            | 导入、健康、运维及显式启用的异步签名 `link.clicked` 事件已支持 |
| API Token          | ✅            | 已支持 read/write/admin scopes、哈希存储、撤销与最后使用时间 |
| 密码保护           | ✅            | `links.password_hash`                                        |
| 过期/点击上限      | ✅            | Create/Edit/List/redirect 状态均已支持；自动清理仍未实现     |

---

## 尚未实现的高级能力

### 1. 查询参数转发（Query params forwarding）✅ 已植入

- **Shlink 行为**：访问短链时带的 `?foo=bar` 自动附加到目标 URL。
- **Linketry 现状**：`redirect.ts` 在重定向前通过 `buildRedirectUrl` 合并请求参数到目标 URL，内部 `linketry_*` 参数被排除。请求参数优先于目标 URL 原有同名参数。
- **影响**：营销场景 UTM 或追踪参数不再丢失。
- **植入版本**：v0.9.12
- **实现位置**：`apps/worker/src/routes/redirect.ts`

### 2. 额外路径转发（Extra path forwarding）

- **Shlink 行为**：允许短链匹配前缀，如 `/slug/extra/path` 把 `/extra/path` 附加到目标 URL。
- **Linketry 现状**：只匹配精确 `/:slug`，多段路径会 404。
- **影响**：深层链接跳转、动态内容分发场景受限。
- **建议版本**：V2
- **实现位置**：`apps/worker/src/index.ts` 路由匹配、`apps/worker/src/routes/redirect.ts`

### 3. 多段自定义 slug（Multi-segment custom slugs）

- **Shlink 行为**：slug 可包含 `/`，如 `my/campaign/summer`。
- **Linketry 现状**：`validateSlug` 通常限制为单段字母数字。
- **影响**：与第 2 项相关，品牌Campaign需要层级 slug。
- **建议版本**：V2
- **实现位置**：`packages/shared/src/validators/index.ts`

### 4. 标题自动解析（Title auto-resolution）✅ 已植入

- **Shlink 行为**：未提供 title 时，抓取目标页面 `<title>` 自动填充。
- **Linketry 现状**：`POST /api/v1/links` 和 `POST /api/v1/links/bulk-create` 创建链接后，如果 `title` 为空，后台通过 `resolvePageTitle` 抓取目标页面 `<title>` 并更新记录。抓取失败或超时不影响响应。
- **影响**：批量导入时标题为空的问题得到改善；Admin 新建链接留空 title 即可自动填充。
- **植入版本**：v0.9.12
- **实现位置**：`apps/worker/src/utils/pageTitle.ts`、`apps/worker/src/routes/links.ts`

### 5. API Token 域名/所有权角色（API key roles）

- **Shlink 行为**：可限制 API key 只能访问特定域名或自己创建的短链。
- **Linketry 现状**：read/write/admin scopes 已完成校验；尚不能限制 token 只能访问特定域名或自己创建的短链。
- **影响**：最小权限自动化仍只能按读写能力隔离，不能按业务域或所有权隔离。
- **建议版本**：Pre-1.0 P1
- **实现位置**：`apps/worker/src/auth/index.ts` + `apps/worker/src/routes/tokens.ts`

### 6. 实时事件推送（Mercure / RabbitMQ / SSE）

- **Shlink 行为**：通过 Mercure 或 RabbitMQ 推送 visit/import 实时事件。
- **Linketry 现状**：仅支持 Webhook（异步 HTTP POST）。
- **影响**：需要实时数据同步的集成方体验差。
- **建议版本**：V4+
- **实现位置**：新增 `apps/worker/src/realtime/` 模块或 Cloudflare Queues 集成

### 7. 邮件打开追踪（Email tracking）

- **Shlink 行为**：生成 1x1 像素图片用于追踪邮件打开次数。
- **Linketry 现状**：无此能力。
- **影响**：营销邮件场景无法统计打开率。
- **建议版本**：V4+
- **实现位置**：新增 `apps/worker/src/routes/emailTracking.ts`

### 8. 过期链接自动清理（Remove expired links）

- **Shlink 行为**：提供 `short-url:delete-expired` 命令批量删除过期短链。
- **Linketry 现状**：过期时间和点击上限 UI/重定向行为已完成，但没有自动清理任务。
- **影响**：长期运行后过期数据堆积。
- **建议版本**：V2
- **实现位置**：新增 Cron 触发器 + `apps/worker/src/maintenance/expiredLinks.ts`

### 9. 大小写/斜杠匹配策略（Short URL mode & trailing slash）

- **Shlink 行为**：支持 `strict`/`loose` 模式、尾随斜杠可选。
- **Linketry 现状**：默认区分大小写、严格匹配。
- **影响**：部分短链容错性不足。
- **建议版本**：V2
- **实现位置**：`apps/worker/src/routes/redirect.ts` 匹配逻辑 + settings 表配置

### 10. 健康端点（Service healthiness）

- **Shlink 行为**：`/rest/health` 无认证返回健康状态。
- **Linketry 现状**：`/health` 已存在且返回版本信息，功能已对齐。
- **建议版本**：无需改动

---

## 优先级建议

| 优先级 | 能力                      | 理由                                       |
| ------ | ------------------------- | ------------------------------------------ |
| 🔴 高  | 查询参数 forwarding       | 已实现于 v0.9.12                           |
| 🔴 高  | 标题自动解析              | 已实现于 v0.9.12                           |
| 🟡 中  | 多段 slug / 额外路径转发  | 品牌Campaign需要，但涉及路由匹配改动       |
| 🟡 中  | 过期链接自动清理          | 运维需要，可与现有 Cron 框架结合           |
| 🟡 中  | API Token 域名/所有权角色 | 基础 scopes 已完成，继续收紧自动化最小权限 |
| 🟢 低  | 实时事件推送              | 集成增强，可用 Webhook 先替代              |
| 🟢 低  | 邮件追踪                  | niche 场景，V4+ 再考虑                     |

---

## 约束

根据 `AGENTS.md`：

- 多用户/团队/角色属于 V4+，不纳入 V1/V2。
- 复杂分析图表属于 V3+。
- `expires_at`、`max_clicks` UI 属于 V2+。
- AI slug、UTM 模板 UI 增强属于 V4+。
- Bulk Actions UI 属于 V2+。
- `domains` 表管理 UI 属于 V2/V3+。

因此上表中的建议版本已考虑这些约束。
