# One 统一退出失败处理 - 2026-09-28

## 一句话结论

One 的统一退出逻辑已修复：只要 HB、SD2、APIC 或 New API 有一个退出失败，One 就会清除本地会话并明确返回失败页面，不再假装全部退出成功。

## 已完成

- 退出请求会分别调用 HB、SD2、APIC 和 New API。
- 任一调用失败都会记录失败对象并返回 HTTP 502。
- One 本地会话仍会被撤销，避免继续使用旧会话。
- 全部成功时保持原来的跳转行为。

## 已验证

- `node --check implementation/entry/origin/auth-broker/server.js`
- `node --test implementation/entry/origin/auth-broker/contract.test.mjs`
- `docker build -t cauai-auth-broker:review-20260928 implementation/entry/origin/auth-broker`
- 契约测试覆盖：全部成功、单个产品失败、New API 失败、部分失败后 One 会话不可再用。

## 未验证

- 未连接线上站点。
- 未发布、未重启、未做真实浏览器统一退出验收。
- 线上仍未完成统一登录、跨站退出和统一额度验收。

## 当前影响

本次修改只在本地工作树和本地镜像中生效，目前不影响线上。

## 权威文件

- `implementation/entry/origin/auth-broker/server.js`
- `implementation/entry/origin/auth-broker/contract.test.mjs`
