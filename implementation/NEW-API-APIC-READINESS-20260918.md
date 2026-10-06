# New API · apic.cauai.fun 部署准备报告

> 日期：2026-09-18
> 状态：只读盘点完成，未安装、未改 DNS、未改线上配置、未重启现有服务
> 目标：在 `apic.cauai.fun` 独立部署官方 New API，并逐步接入无限画布

## 1. 结论

可以落地，但第一阶段不把 New API 与无限画布数据库、额度账本、媒体库合并。

推荐拓扑：

```text
apic.cauai.fun -> New API 独立服务 -> 上游 LLM / 图片 / 视频渠道
hb.cauai.fun   -> 无限画布 -> 以后作为 New API 的 API 客户端
```

先验证 LLM API 的注册、API Key、模型限制、用量、扣费、余额不足、上游失败和对账，再迁移图片和视频。

## 2. 已核实证据

### 官方仓库

- 官方仓库：`https://github.com/QuantumNous/new-api.git`
- 默认分支：`main`
- 2026-09-18 只读 `git ls-remote` 命中：`3524fe0b15794d8d19378827d36a7edc0b0e91ea`
- 官方 Compose 使用 `calciumion/new-api:latest`，包含 New API、Redis、PostgreSQL 三个服务。
- Compose 默认端口为 `3000`，生产部署必须更换示例密码和 secret。
- 项目许可证：AGPLv3；修改后的 UI 需保留原项目署名和原项目链接。

### 服务器

SSH 入口：`haika-kidswear-1757`（只读使用）

- 主机名：`ser454500072169`
- 系统：Ubuntu 22.04
- Docker：29.1.3
- Docker Compose：2.40.3
- 根分区：49G，总已用约 14G，可用约 34G
- `/opt/new-api`、`/opt/newapi`、`/opt/new2api` 均不存在
- `/opt/infinite-canvas` 已存在，现有画布服务正在运行
- 已占用 80/443：`deeptutor-public-caddy`
- 画布通过独立的 `cloudflared-canvas.service` 接入
- 当前已有三个 Cloudflare Tunnel systemd 服务：通用、画布、huowenti
- `apic.cauai.fun` 当前无 DNS 解析，HTTPS 请求无法建立
- Caddy 当前没有 `apic.cauai.fun` 路由

### 现有不可触碰资源

本次准备不触碰：

- `/opt/canvas-webdav`
- `/opt/canvas-api-media`
- `/opt/canvas-api-sync`
- `/opt/canvas-postgres`
- `/opt/agnes-video-proxy`
- 现有 `canvas-web`、`canvas-api`、`canvas-postgres`、`canvas-agnes-proxy` 容器

## 3. 推荐部署方案

### 方案 A：复用通用 Caddy + 新 API 独立 Compose（推荐）

```text
Cloudflare DNS / Tunnel
  -> deeptutor-public-caddy
  -> 127.0.0.1:<新本地端口>
  -> new-api 容器
  -> 独立 new-api-postgres + new-api-redis
```

目录建议：

```text
/opt/new-api/
  docker-compose.yml
  .env
  data/
  logs/
  backups/
```

要求：

- New API 使用独立 PostgreSQL，不复用 `canvas-postgres`
- Redis 使用独立容器和密码
- 宿主机只绑定 `127.0.0.1`，不把 New API 端口直接暴露到公网
- Caddy 只新增一个精确的 `apic.cauai.fun` host 路由
- Cloudflare 通过现有通用隧道增加 hostname 到 Caddy；若该隧道没有权限或配置不可安全修改，再创建独立隧道
- 首次初始化后立即修改默认管理员密码
- 设置 `SESSION_SECRET`、`SESSION_COOKIE_SECURE=true`、精确的 `SESSION_COOKIE_TRUSTED_URL`

## 4. 分阶段交付

### P0：只读准备（已完成）

结果：服务器有 Docker/Compose，磁盘足够；目标域名未解析；Caddy 和 Tunnel 需要新增配置；没有现成 New API 目录。

### P1：独立网关内网启动

动作：拉取官方 `main` 或锁定的 release，生成独立 Compose 和 `.env`，启动 New API、PostgreSQL、Redis，仅绑定本机端口。

验证：容器健康、管理员登录、API Key 创建、`/api/status`、一条低成本文本模型调用。

### P2：接入 `apic.cauai.fun`

动作：先配置 DNS/隧道，再加 Caddy host 路由，最后做 HTTPS 和 API 冒烟。

验证：浏览器后台、`/v1/models`、`/v1/chat/completions`、错误 API Key、余额不足、流式响应。

### P3：图片/视频

图片先做；视频必须验证异步任务、轮询、结果下载、上游真实成本、失败退款和媒体落盘后再售卖。

### P4：无限画布接入

先让画布作为 New API 客户端使用，不合并两个账本。统一账号和统一余额另立规格，经过并发扣费与退款测试后再决定。

## 5. 当前阻塞与批准闸门

真正安装前需要老大明确批准以下范围：

1. 按官方 `QuantumNous/new-api` 的 `main` 部署，而不是继续采用名称不清的 `kogodm/new2api`。
2. 创建 `/opt/new-api` 及其独立持久化目录。
3. 运行新的 Docker Compose 服务。
4. 修改 Caddy 路由和 Cloudflare DNS/Tunnel，使 `apic.cauai.fun` 对外可访问。
5. 初始化 New API 管理员和上游渠道配置。

本报告完成前，以上动作均未执行。

## 6. 2026-09-19 已执行落地记录

- 已在服务器创建 `/opt/new-api` 独立目录、数据目录、日志目录、备份目录和独立 Compose。
- 已拉取并启动官方镜像 `calciumion/new-api:latest`；运行时版本由 `/api/status` 返回为 `v1.0.0-rc.38`。
- 已启动独立 `new-api-postgres` 和 `new-api-redis`，三项容器均为 healthy/running。
- New API 仅绑定宿主机 `127.0.0.1:13020`，没有将应用端口直接暴露到公网。
- 已把现有 Caddy 接入 `new-api-network`，新增精确 host `apic.cauai.fun`，Caddy validate 通过，Caddy 到 New API 的内网 `/api/status` 返回 `success=true`。
- 已为 Caddyfile 留存带时间戳的备份；第一次 PostgreSQL 初始化目录也已移动到 `/opt/new-api/backups/`，没有删除。
- `apic.cauai.fun` 已通过服务器上的 Cloudflare 原始证书成功创建 DNS CNAME，DNS 已解析到 Cloudflare。
- 公网请求当前返回 HTTP 404；现有 `hb.cauai.fun` 仍返回 HTTP 302，证明现有画布入口未被破坏。本机 Caddy → New API 链路仍返回 `success=true`。
- 404 的直接原因是 `hb-canvas` 隧道的远端 Ingress 尚未把新 hostname 路由到 Caddy；当前 systemd 启动方式只使用 Tunnel token，服务器没有可直接修改远端 Ingress 的本地配置文件。未覆盖现有 Tunnel 配置，避免误伤 `hb.cauai.fun`。
- **公网已打通（2026-09-19 18:44）**：`https://apic.cauai.fun/api/status` 返回 HTTP 200，首页返回 200；现有 `hb.cauai.fun` 仍返回 302，未受影响。

### 公网打通的三步关键动作

1. **修正 Caddy 站点模式**：`apic.cauai.fun` 必须写成 `http://apic.cauai.fun`，与现有 `http://hb.cauai.fun` 一致。若写成 HTTPS 站点，Cloudflare 隧道回源是 HTTP，Caddy 会 308 重定向到 HTTPS，形成访问循环。修正后本机 `Host: apic.cauai.fun` 返回 200。
2. **新建独立隧道 `apic-canvas`**：不覆盖现有 `hb-canvas` 隧道配置。`/etc/cloudflared-apic/config.yml` 的 ingress 规则为 `apic.cauai.fun -> http://127.0.0.1:80`，并带 `httpHostHeader: apic.cauai.fun`，最后一条为 `http_status:404` 兜底。`tunnel ingress validate` 通过，`ingress rule` 命中规则 #0。
3. **覆盖 DNS CNAME**：`apic.cauai.fun` 的 CNAME 从 `hb-canvas` 覆盖到 `apic-canvas`；systemd 服务 `cloudflared-apic.service` 已启用并运行中。

### 管理员初始化

- 已通过 `/api/setup` 初始化 root 管理员；该接口的确认密码字段是 **`confirmPassword`**，不是 `confirm_password`。
- 初始密码生成后写入服务器 `/opt/new-api/backups/admin-initial-password.txt`（权限 600），**不进治理仓、不进聊天**。
- 已登录验证成功，并把系统对外地址从 `http://localhost:3000` 改为 `https://apic.cauai.fun`。

### 验收结果

| 检查 | 结果 |
|---|---|
| 公网首页 | `200` |
| 公网 `/api/status` | `200`，版本 `v1.0.0-rc.38`，`setup=true` |
| 无凭据 `/v1/models` | `401` |
| 无凭据 `/v1/chat/completions` | `401` |
| 现有 `hb.cauai.fun` | `302`（未受影响） |

- **未完成**：尚未配置任何上游模型渠道，因此还没有可用模型；尚未创建对外售卖的 API Key、额度和限流规则；公开注册当前仍为开启状态，是否关闭待老大裁决。

## 7. 回滚边界

- P1 回滚：停止并移除 New API 新建容器；保留 `/opt/new-api/backups`，不触碰现有画布数据。
- P2 回滚：删除或注释 `apic.cauai.fun` 的 DNS/Tunnel/Caddy 路由，reload Caddy。
- 数据库：New API 数据库单独备份；禁止把回滚动作扩展到 `/opt/canvas-postgres`。
- 凭据：New API secret 与上游 API Key 只放服务器 `.env`，不进治理仓、前端或聊天。

---

## 8. 上游渠道接入：mcgrox（2026-09-20 已完成并验证）

### 8.1 来源

老大指令：「接入我 cockpit 里的渠道就行 mcgrox」。

**cockpit = Cockpit Tools**（桌面端 CLI 账号/渠道管理器），安装在 `C:/Users/lsb/AppData/Local/Cockpit Tools Personal`，
配置目录在用户目录下的 `.antigravity_cockpit`，渠道清单为一个 JSON（27 条渠道，不在本仓）。

### 8.2 上游实测结论

| 项 | 结论 |
|---|---|
| 可用域名 | **`https://www.mcgrox.top`**（`mcgrox.top` 裸域 SSL 握手超时，不可用） |
| 可用 Key | 9 把去重候选里**只有 2 把真正属于 mcgrox**，其余 401 或被路由到别的上游 |
| 模型 | 9 个：`codex-auto-review`、`gpt-5.5`、`gpt-5.6`、`gpt-5.6-sol`、`gpt-5.6-terra`、`gpt-6-astra`、`gpt-image-2.5`、`gpt-image-2.5-flare`、`gpt-image-2.5-sunburst` |

模型名为该中转站私有代号，非 OpenAI 官方命名。

### 8.3 apic 渠道现状

- 渠道 **id=2，名称 `mcgrox-top`，type=1（OpenAI 兼容）**
- `base_url = https://www.mcgrox.top`，2 把 Key 轮询（multi_key_mode = polling）
- 分组 `default`

### 8.4 验收（真实调用，非推断）

| 项 | 结果 |
|---|---|
| 内网 6 个文本模型 | 全部 HTTP 200，返回内容正常 |
| 公网 `https://apic.cauai.fun/v1/chat/completions` | HTTP 200（Cloudflare → 隧道 → Caddy → New API → mcgrox 全链路通） |
| 公网 `/v1/models` | HTTP 200，返回 9 个模型 |
| 配额扣减 | 正常（7 次调用扣 1730 quota） |

### 8.5 仍未完成（按优先级）

1. **定价必须重设。** 当前是我填的占位价（`ModelRatio=2.5`，`CompletionRatio=4`，图像模型 2.5/1），
   照 gpt-4o 档位拍的，**不是定价决策**。mcgrox 实际成本未知，售价可能低于成本，售卖前必须由老大按成本重设。
2. **图像模型未验证。** `gpt-image-2.5` 系列未做出图调用，异步任务、计费、结果下载待验证。
3. **公开注册仍开启。** 渠道已可用，任何人注册即可消耗上游额度，建号后应立即关闭。
4. **画布接入未实施。** 上游通了之后，方案 A（BYO，零代码改动）的前置阻塞已解除。

### 8.6 技术要点（已并入 D24）

AddChannel 需嵌套 `{"mode":..., "channel":{...}}`；多 Key 必须用 `mode=multi_to_single`
（用 `single` 会把换行 Key 整体塞进 Authorization 头导致非法）；模型必须配价格否则 400；
新建渠道需等约 20 秒数据库同步；列表接口返回的令牌是脱敏值（真实值在数据库）。
