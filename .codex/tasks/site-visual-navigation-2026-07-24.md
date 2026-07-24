# Linketry 官网视觉与导航优化

- 日期：2026-07-24
- 负责人：everettlabs
- 目标版本：0.29.12

## 目标

- 优化 `linketry.com` 页头与首屏的视觉层级，减少装饰性渐变和发光效果。
- 将 GitHub 导航入口改为仅图标展示，并保留可访问名称与提示。
- 将原生语言下拉替换为与站点一致、支持键盘操作的语言菜单。
- 保持首页与部署页的导航体验一致，并完成桌面端、移动端视觉验收。

## 范围

- `apps/site/index.html`
- `apps/site/deploy/index.html`
- `apps/site/src/siteI18n.ts`
- `apps/site/src/styles.css`
- `apps/site/tests/site.test.mjs`
- 版本与发布状态文档

## 状态

- [x] 核对官网现状、开发文档与上一版发布状态
- [x] 实现页头、首屏与语言菜单调整
- [x] 更新站点契约测试
- [x] 同步 0.29.12 版本与发布文档
- [x] 完成测试、构建和浏览器验收

## 发布基线

- `0.29.11` Demo 流水线已成功。
- `0.29.11` 生产流水线在安全门停止：`LINKETRY_APPROVED_RELEASE` 与 `LINKETRY_APPROVED_COMMIT` 仍指向旧批准值，未执行任何部署写入。

## 验证

- 8 项项目站点测试、110 项 Worker 测试、84 项部署测试、6 项 Demo API 测试通过。
- 64 项 Admin 单元测试、25 项 Admin 浏览器测试、正常与 Demo Admin 生产构建测试通过。
- Worker 类型检查、项目站点构建、正常与 Demo Admin 构建通过。
- 本地桌面与移动浏览器确认页头无横向溢出、GitHub 为纯图标入口、语言菜单可切换并自动收起，首页与部署页行为一致。
