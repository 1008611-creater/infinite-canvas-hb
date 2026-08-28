# 贡献指南

## 开发流程

- 稳定分支为 `master`，禁止直接提交功能改动。
- 每个功能或修复创建独立分支：`feature/*`、`fix/*` 或 `refactor/*`。
- 通过 Pull Request 合并；PR 必须通过 CI 和代码审查。
- 不要在仓库中提交 API Key、`.env` 或本地生成产物。

## 本地检查

在 `web` 目录运行：

```bash
npm run typecheck
npm run build
```

视频代理检查：

```bash
node --check agnes-video-proxy/server.js
```

代理的启动方式、环境变量和接口见 `agnes-video-proxy/README.md`。`.env` 禁止入库。

## 视频模式约定

视频生成固定使用三种模式：

- `text`：文生视频，不携带图片。
- `keyframe`：首尾帧，使用 `first_frame` 和 `last_frame`。
- `reference`：全能参考，使用 `images[]`，最多五张。

仅开放免费的 `agnes-video-2.5-flash`。涉及付费模型或真实生成请求时，必须先获得明确授权。
