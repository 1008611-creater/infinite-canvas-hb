# canvas-webdav —— 无限画布的云端同步后端

给 infinite-canvas 补上「数据上云」那一半的极简 WebDAV 服务。

## 为什么需要它

画布前端**早就内置了完整的云同步引擎**：

- `web/src/services/app-sync.ts` —— 同步四个域：画布、我的资产、生图记录、视频记录；
  并把画布/资产里引用到的**媒体文件（图片、视频、音频）二进制一起传上去**，换设备时补齐缺失文件。
- `web/src/services/webdav-sync.ts` —— WebDAV 客户端（MKCOL / PROPFIND / PUT / GET）。
- 配置入口在画布右上角「配置 → WebDAV 同步」，填地址、用户名、密码、目录即可。

缺的只是一台能对上的服务端。所以在此之前，画布和素材实际上只活在浏览器 IndexedDB 里，
清一次站点数据、换一台电脑就没了——这也是「我生成完的片子怎么进画布」这个问题的根因之一。

## 它怎么跑

跑在 **Agnes 视频代理同一个容器、同一个 node 进程**里，监听独立端口 `8789`，
由 nginx 把 `/dav/` 反代进来：

```
浏览器 ──fetch(/dav/...)──► nginx (canvas-web) ──► agnes 容器
                                                    ├─ :8787  Agnes 视频代理
                                                    └─ :8789  canvas-webdav ──► /data（宿主 /opt/canvas-webdav）
```

选同容器而不是新开一个服务，是为了**不新增任何部署单元**：这个镜像本来就带 Node、
网络和卷都现成，而 WebDAV 是纯文件服务、无上游依赖。
代价是它和视频代理共享进程，所以本模块对每个请求都做了 try/catch，
连 `req`/`res` 的 error 事件都单独兜住——**任何异常都不允许冒到进程层**。

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `WEBDAV_ROOT` | `/data` | 数据目录，容器里挂宿主机 `/opt/canvas-webdav` |
| `WEBDAV_USER` | `canvas` | Basic Auth 用户名 |
| `WEBDAV_PASSWORD` | 空 | **为空则不启动监听**（失败关闭，避免开出匿名可写目录） |
| `WEBDAV_PORT` | `8789` | 监听端口，仅 compose 内网 |
| `WEBDAV_MAX_BYTES` | `0` | 单文件上限，0 表示不限 |

部署时 `scripts/deploy/publish.sh` 会把 `WEBDAV_USER` / `WEBDAV_PASSWORD` 写进服务器
`/opt/agnes-video-proxy/.env`，**默认复用站点密码**（少记一个密码，安全边界不变：
能进后台的人才能同步）。想单独设就用 `CANVAS_WEBDAV_PASSWORD=xxx bash scripts/deploy/publish.sh`。

## 支持的 WebDAV 动作

`OPTIONS` / `PROPFIND` / `PROPPATCH` / `MKCOL` / `GET` / `HEAD` / `PUT` / `DELETE` / `MOVE` / `COPY` / `LOCK` / `UNLOCK`

- 前端只用到前四个加 `PUT`/`GET`/`MKCOL`；
- 另外几个是为了**手机/电脑的原生客户端**（访达、资源管理器、手机文件 App）能直接挂载：
  `LOCK` 返回一个假 token（不做真锁，单人使用不需要并发写保护），
  `GET` 目录返回人类可读的 HTML 列表页，`GET` 文件支持 `Range`（视频拖进度条必需）。

## 几个刻意的设计

1. **流式写盘 + 原子改名**：视频几十上百 MB，绝不先读进内存；先写同目录 `.tmp-*` 再 rename，
   连接中断也不会把 `manifest.json` 写成半截 JSON（那样会让下次同步直接失败）。
2. **默认失败关闭**：没配密码就不监听，而不是开放匿名写入。
3. **路径沙箱**：`..`、绝对路径、空字节一律 403，越界写不会落盘。
4. **不碰 cookie 门禁**：`/dav/` 不走画布的 `canvas_auth` cookie，因为原生客户端带不了它。
   这一层的安全由 Basic Auth 兜住。

## 测试

```bash
# 服务本体（鉴权/建目录/清单读写/大文件 Range/安全边界/移动删除，36 项）
node canvas-webdav/selftest.js

# 与真实视频代理同进程共存（9 项）：确认引入本模块不会影响视频生成
node canvas-webdav/selftest-proxy.js
```

前者用临时目录自己起监听，后者直接 `require` 真实代理（会占用 18787 / 18789 两个本地端口）。
两个脚本都不依赖任何第三方库。
