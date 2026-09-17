# 如何一键接入agnes视频通道

> **归档副本** —— 来源：`E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas-deploy\如何一键接入agnes视频通道.md`
> 复制日期：2026-09-11　|　归集到：`E:\codex\huabu\inventory\`
> 原件仍在原位，**本副本不是权威版本**；两者不一致时以原件为准。

---

# 一键预置 agnes 视频通道到画布

画布默认配置指向 `api.openai.com` 且 key 为空，直接点视频生成会 401。
本脚本把画布配置**覆盖**为「单通道 agnes 视频 → 本地代理 8787」，让你打开就能用，不必手动填。

## 前提
- 代理已运行：`http://localhost:8787`（`launcher/start.bat` 已起，或确认 `/v1/models` 能访问）
- 前端已运行：`http://localhost:3000`

## 使用方法（约 15 秒）
1. 用浏览器打开 `http://localhost:3000`
2. 按 `F12`（或右键 → 检查）打开开发者工具，切到 **Console** 标签
3. 把 `预置_agnes视频通道_控制台脚本.js` 的全部内容复制，粘贴进 Console，回车
4. 看到 `[预置 OK] 已写入 agnes 视频通道` 即成功
5. 刷新页面（F5）

完成后：画布仅剩「Agnes 视频」一个通道，默认视频模型 = `agnes-video-2.5-flash`，画幅 9:16。点视频生成即走代理，用你 `.env` 里的 AGNES key 出片。

## 说明 / 局限
- **localStorage 按域隔离**：脚本必须在 `localhost:3000` 页面控制台执行才写得到（独立 HTML 文件写不进，因跨源）。
- 脚本是**覆盖**性预置（删掉旧通道），不是并集。若你已有其它通道配置，运行前请知悉会重置。
- 图片 / 文本生成**不走 agnes**（代理只接视频），对应模型留空走画布默认兜底；只保视频功能。
- 如需恢复到原始默认：控制台执行 `localStorage.removeItem("infinite-canvas:ai_config_store")` 后刷新。
- 已按画布 `use-config-store.ts` 的 hydrate/normalize 逻辑在 node 复刻验证：通道保留、`videoModel` 不回退。

## 相关文件
- `预置_agnes视频通道_控制台脚本.js` — 本体（复制用）
- 项目根 `.env` — 真实的 `AGNES_API_KEY`（代理读它，脚本不碰 key）