# 统一额度运行状态（2026-09-27）

## 一句话结论

[已验证] 统一额度目前**没有启用**。`ffdb13d` 的统一额度代码已经进入 hb 线上版本，但线上 hb 与 sd2 都没有配置 `NEW_API_QUOTA_WRITE_URL` / `NEW_API_QUOTA_TOKEN`，所以扣费、结算和退款还没有切到 New API 的统一额度路径。

## 对现在的影响

[已验证] 本轮只做了只读核查，没有调用生成、扣费、退款或任何额度写入接口，目前不影响线上用户和现有余额。

[已验证] hb 线上仍运行 `ffdb13d`，统一额度代码文件存在，但运行环境没有统一额度变量。

[已验证] sd2 运行容器没有 `NEW_API_QUOTA*` 或统一额度写入变量，因此不能视为已启用统一额度。

[主控推断] 当前两个产品仍按各自现有的本地额度路径运行；New API 自身的 quota 仍可独立计费，但还不是 hb / sd2 的统一扣费账本。

## 状态分类

- **已在线上生效**：hb 的 `ffdb13d` 版本，以及统一额度代码文件。
- **本地已改但未发布**：本轮没有改产品源码。
- **只有计划/规格**：把线上额度切到 New API 的运行配置和真实扣费验证。
- **未验证**：真实账号下的统一扣费、失败结算、退款和跨站余额对账。

## 需要 owner 决定的事情

当前不需要你决定。是否启用统一额度，需要下一步先拿到 New API 正式的按业务单号扣费/退款接口，再单独走启用前验证。

## 技术证据

- [已验证] `/opt/infinite-canvas/current/dist/BUILD_INFO.txt`：`release=canvas-20260926-222854-ffdb13d`、`commit=ffdb13d`。
- [已验证] `/opt/infinite-canvas/api/api.env` 中与本功能有关的变量只有 `UNIFIED_AUTH_SECRET`；没有 `NEW_API_QUOTA_URL`、`NEW_API_QUOTA_WRITE_URL` 或 `NEW_API_QUOTA_TOKEN`。
- [已验证] `canvas-api` 容器环境同样没有 `NEW_API_QUOTA*`；`niannian-sd2-app` 容器没有统一额度变量。
- [已验证] 权威源码 `canvas-api/credits.js` 只有在 `NEW_API_QUOTA_WRITE_URL` 与 `NEW_API_QUOTA_TOKEN` 都存在时才创建统一额度客户端；两者都没有时返回本地路径。
- [已验证] 权威源码 `canvas-api/unified-quota.js` 只有在 `NEW_API_QUOTA_URL` 与 `NEW_API_QUOTA_TOKEN` 都存在时才读取 New API 余额；两者都没有时不启用只读镜像。
- [已验证] 本轮没有修改线上配置，没有重启容器，没有调用额度写入接口。