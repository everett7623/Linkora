# Linketry 全项目重命名（2026-07-15）

## 目标

- 将旧产品品牌、仓库元数据和新手部署默认值统一为 Linketry。
- 使用定位：`Linketry is a self-hosted link management, analytics and monitoring platform.`
- 使用中文定位：`自托管短链接管理、访问分析与健康监控平台`。
- 统一作者 `everettlabs`、仓库 `linketry`、镜像 `everett7623/linketry`、环境变量前缀 `LINKETRY_`、数据库默认名 `linketry`、API 命名空间 `/api/v1`、官网 `https://linketry.dev`。
- 保证现有部署可升级，不重建或覆盖既有 D1 数据。

## 兼容映射

| 旧契约 | 新契约 | 过渡策略 |
|---|---|---|
| `/api/*` | `/api/v1/*` | 新版 Admin 只调用 `/api/v1`；Worker 暂保留旧路由别名一版 |
| `ADMIN_TOKEN` | `LINKETRY_ADMIN_TOKEN` | Worker 优先读取新变量，继续回退旧 secret |
| 旧版运行时变量 | `LINKETRY_VERSION` 等 | Worker 优先读取新变量，升级窗口内回退旧变量 |
| `VITE_API_URL` | `VITE_LINKETRY_API_URL` | 新构建变量优先，旧变量继续作为构建回退 |
| 旧版浏览器键 | `linketry_*` 浏览器键 | 首次读取时迁移，不清除用户登录与偏好 |
| 旧版 KV 键 | `linketry:slug:*` KV 键 | D1 仍为真源；读取旧缓存，更新/删除时清理两代键 |
| 旧版备份标记 | `Linketry Backup` | 新备份采用新格式，同时继续识别旧备份 |

## 数据安全边界

- 不新增、删除或修改 D1 migration。
- 不执行远程迁移、部署、数据库写入、GitHub 仓库改名、Docker 发布或 DNS 修改。
- 新部署使用 `linketry` 资源名；已有部署必须保留原 D1 `database_id`、KV namespace、R2 bucket 和 Queue。
- 重命名不改变表名、字段名、链接 ID、slug、访问记录或统计数据。

## TODO

- [x] 盘点运行时、包名、部署配置、API 和文档引用。
- [x] 完成包作用域、运行时品牌与兼容配置重命名。
- [x] 将规范 API 迁移到 `/api/v1` 并保留旧路由别名。
- [x] 完成 Admin 本地存储无损迁移。
- [x] 更新备份格式并兼容旧版备份。
- [x] 更新新手部署、升级、官网与镜像命名文档。
- [x] 升级版本到 `0.10.0` 并同步发布记录。
- [ ] 完成 Worker、Admin、浏览器测试、构建与残留引用审计。

## 验证

- [ ] Worker 类型检查
- [ ] Worker 全量测试
- [ ] Admin 单元测试
- [ ] Admin Playwright 测试
- [ ] Admin 生产构建
- [ ] `git diff --check`
- [ ] 旧 API、旧环境变量、旧浏览器键、旧备份兼容回归
