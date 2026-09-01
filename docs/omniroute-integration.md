# OmniRoute 接入画布（LLM 能力）

> 结论先说：**OmniRoute 现在就能用，不用装任何东西，也不用 Cloudflare 隧道。**
> 真正要处理的不是"怎么连上"，而是"网关现在裸奔在外面"。

最后实测：2026-09-01，网关 207 个模型。

---

## 一、实测结论（先看这个，能省掉一堆无用功）

| 项目 | 结果 | 说明 |
|---|---|---|
| 协议兼容 | ✅ 完全兼容 | 画布走 Responses API（`POST /v1/responses` + `stream: true`），网关原生支持，事件名对得上 |
| 流式 | ✅ 逐字输出 | `response.output_text.delta` / `.done` / `response.completed` 三个事件全有，画布正好就认这三个 |
| 跨域 CORS | ✅ 就绪 | OPTIONS 预检返回 204，`access-control-allow-headers` 含 `Authorization`，并回显请求的 Origin |
| **HTTPS 页面能直连 `http://127.0.0.1`** | ✅ 可以 | **重大发现**：浏览器不把 `127.0.0.1`/`localhost` 当混合内容拦截。用真实 Chrome 在 `https://hb.cauai.fun` 页面里 fetch `http://127.0.0.1:20128`，拿到 200 + 72169 字节 |
| 是否需要 API Key | ❌ 不需要 | 网关不鉴权，画布发的 `Authorization: Bearer `（空值）照样返回正常结果。Key 那栏留空即可 |
| 速度 | 0.5–1.4 秒 | 4 个 `auto/*` 模型实测首字 508–1301ms |
| 偶发极慢（90 秒） | ⚠️ 有 | 网关按优先级**串行**重试上游，池子里有不可达节点就会每次白等几秒。不是画布的问题，清理死节点即可 |

### 那条"重大发现"意味着什么

之前定的方案是"用 cloudflared 把本机服务暴露成 https"，理由是"公网 HTTPS 页面调 `http://127.0.0.1` 会被浏览器当混合内容拦截"。

**这个前提是错的，实测不成立。** 浏览器的混合内容拦截对 `127.0.0.1` / `localhost` 网开一面（它们在规范里算"可信来源"）。

所以只要满足一个条件：

> **你是在跑 OmniRoute 的那台电脑上打开画布**

就**什么都不用配**，填上 `http://127.0.0.1:20128` 直接就能用，不用装 cloudflared、不用开隧道、不用加鉴权。

---

## 二、必须先处理的风险（比接入更重要）

### 风险 1：网关监听 `0.0.0.0:20128`，且完全不鉴权

```
TCP    0.0.0.0:20128    0.0.0.0:0    LISTENING
```

`0.0.0.0` 表示**监听所有网卡**。也就是说：

- 同一个 WiFi 下（公司、咖啡厅、酒店）任何人，只要知道你电脑的局域网 IP，就能直接调用你的 207 个模型
- 不需要任何密钥——网关连空 `Bearer` 都放行
- 烧的是**你的额度**

### 风险 2：网关自带一个"一键穿透"开关，一点就把上面那个洞开到公网上

```
C:\Users\lsb\.omniroute\cloudflared\quick-tunnel-state.json
{
  "targetUrl": "http://127.0.0.1:20128",
  "status": "stopped",        ← 当前是关着的，保持住
  "publicUrl": null
}
```

这是 **quick tunnel**（`*.trycloudflare.com` 随机域名）。它的问题是：

1. 域名是随机的、每次变，但**任何拿到这个域名的人都能直接用**，没有登录
2. 域名一旦被扫到（公网扫描器会扫这个段），你的额度就是公共水龙头
3. 它直连 20128，**不会经过任何鉴权**

> **记住：这个开关别开。** 真要跨设备用，走下面方案 B。

---

## 三、方案 A：本机直连（推荐，零成本，现在就能用）

**适用场景**：你在自己电脑上打开画布（绝大多数情况）。

### 步骤

1. 打开画布 → 右上角**设置** → **渠道**页签
2. 点**新增渠道**，填：

   | 字段 | 值 |
   |---|---|
   | 名称 | `OmniRoute` |
   | 接口地址 | `http://127.0.0.1:20128` |
   | 调用格式 | `openai` |
   | API Key | **留空**（网关不鉴权，填不填都一样） |

3. 在这个渠道下加模型（能力都选"文本"）：
   - `auto/best-chat` — 通用对话，反推提示词用它
   - `auto/best-fast` — 最快
   - `auto/best-vision` — 带图理解
   - `auto/best-coding` — 代码

   > `auto/*` 是网关的智能路由，上游挂了会自动换一个，比写死某个模型稳。

4. 到**偏好设置**页签，把**默认文本模型**选成 `OmniRoute / auto/best-chat`
5. 保存

> PR #13 合并上线后，第 2–3 步可以省略：渠道页签顶部有个"从模板添加"下拉，选 OmniRoute
> 就自动填好这些（API Key 那栏是空的，模板里不写密钥）。

### 怎么用

画布里的 LLM 挂在**反推提示词**上：选中一个图片节点 → 右键 → 反推提示词，
会自动生成「图片 + 文本 + 配置」三个节点，配置节点调用 LLM 把图转成文字提示词。

### 优点 / 缺点

- ✅ 零配置、零风险、不暴露公网
- ❌ **换台电脑打开画布就失效**——因为那时 `127.0.0.1` 指的是那台电脑，不是你的网关

---

## 四、方案 B：跨设备访问（要用手机/别的电脑打开画布时）

### 为什么不用 Cloudflare Access

你可能想到用 Cloudflare Access 加登录。**它和浏览器的 `fetch` 不兼容**：
Access 的登录是**交互式**的，会把请求 302 重定向到登录页；而 `fetch` 遇到重定向
只会拿到登录页的 HTML 或者触发 CORS 错误，没法完成登录流程。

Access 的 Service Token（`CF-Access-Client-Id` / `-Secret`）倒是能在请求头里带，
但那等于把密钥写进前端 JS——**任何打开页面的人都能看到**，等于没锁。

所以公网场景只能走"**请求头带令牌**"这一条路，也就是下面这个守卫反代。

### 架构

```
浏览器（画布）
    │  Authorization: Bearer <你的令牌>
    ▼
https://omni.你的域名            ← Cloudflare 具名隧道
    ▼
cloudflared（你电脑）
    ▼
守卫反代 127.0.0.1:20129         ← 验令牌 + 补 CORS，没有令牌直接 401
    ▼
OmniRoute 127.0.0.1:20128       ← 只监听本机
```

好处是：**公网扫到域名也没用**，没有令牌一律 401。

### 步骤

#### 1. 起守卫反代

代码已经写好了：`tools/omniroute-guard/server.js`（纯 Node，零依赖）。

```powershell
# 生成一个长随机令牌（记下来，画布里要填）
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % { [char]$_ })

# 启动
cd E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas\tools\omniroute-guard
$env:GUARD_TOKEN = "刚才生成的令牌"
node server.js
```

看到这行就成了：

```
==> OmniRoute 守卫已启动    监听 http://127.0.0.1:20129
```

自检：

```bash
curl -H "Authorization: Bearer <令牌>" http://127.0.0.1:20129/v1/models
# 应该返回 207 个模型；不带令牌则返回 401
```

#### 2. 用 cloudflared 暴露守卫（不是暴露 20128）

**注意：不要用网关自带的 quick tunnel**（见风险 2）。要用**具名隧道**。

后台地址：**https://one.dash.cloudflare.com**（Zero Trust 是独立后台，不在普通的
dash.cloudflare.com 里）。

1. 左侧 **Networks** → **Tunnels** → **Create a tunnel**
2. 类型选 **Cloudflared**，起个名字（比如 `omniroute`），点 **Save tunnel**
3. 页面会给出安装命令和一串 token，**复制那个 token**
4. 在你电脑上跑（用第 3 步复制的 token）：

   ```powershell
   cloudflared.exe service install eyJhIjoi...一串很长的token
   ```

5. 回到后台，切到 **Public Hostname** 页签 → **Add a public hostname**：

   | 字段 | 值 |
   |---|---|
   | Subdomain | `omni` |
   | Domain | 选你的域名 |
   | Service → Type | `HTTP` |
   | Service → URL | `127.0.0.1:20129` ← **填守卫的端口，不是 20128** |

6. 保存，等状态变 **Healthy**

> 隧道连不上时（一直 QUIC 失败 / 报 530），在命令里加 `--protocol http2` 强制走 HTTP/2。

#### 3. 画布里填渠道

| 字段 | 值 |
|---|---|
| 接口地址 | `https://omni.你的域名` |
| API Key | 第 1 步生成的那个令牌 |
| 模型 | `auto/best-chat` 等 |

守卫会自动应答 CORS 预检，浏览器放行。

---

## 五、可选加固：把网关关回本机

**做之前先看这条警告**：如果你用 **WSL**，WSL2 访问 Windows 宿主服务走的是**非回环地址**，
加完这条规则 WSL 里就连不上网关了。不确定的话先别加。

确认可以加的话，**用管理员权限**开 PowerShell：

```powershell
# 加规则：20128 端口只允许 127.0.0.0/8 访问，其余一律拒绝
netsh advfirewall firewall add rule name="OmniRoute 只许本机" dir=in action=block protocol=TCP localport=20128 remoteip=0.0.0.0-126.255.255.255,128.0.0.0-255.255.255.255

# 后悔了就删掉
netsh advfirewall firewall delete rule name="OmniRoute 只许本机"
```

加了以后，局域网里别人就扫不到你的网关了，但你本机（Codex / Multica / 画布）照常用。

---

## 六、排错

| 现象 | 原因 / 处理 |
|---|---|
| 画布报"模型读取失败" | 网关没在跑。查 `netstat -ano \| grep :20128`；重启见下面 |
| 偶尔要等 60–90 秒才有字 | 池子里有不可达节点在串行重试。清理见 `omniroute-gateway-repair` 技能第 8 节 |
| 换台电脑打开画布就连不上 | 正常——`127.0.0.1` 指的是那台电脑。走方案 B |
| 公网域名一直 401 | 画布渠道的 API Key 和 `GUARD_TOKEN` 不一致 |
| 公网域名 502 | 守卫没在跑，或 `UPSTREAM` 指错 |

重启网关（启动约 60 秒，别急着判失败）：

```bash
PID=$(netstat -ano | grep ":20128" | grep -i listen | head -1 | awk '{print $NF}')
MSYS_NO_PATHCONV=1 taskkill /PID $PID /F
```

---

## 七、相关文件

| 文件 | 说明 |
|---|---|
| `web/src/stores/channel-templates.ts` | 渠道模板（PR #13），OmniRoute 模板的 baseUrl 就是 `http://127.0.0.1:20128` |
| `tools/omniroute-guard/server.js` | 方案 B 的守卫反代 |
| `~/.omniroute/cloudflared/quick-tunnel-state.json` | 风险 2 那个开关的状态文件 |
| `C:\Users\lsb\.workbuddy\skills\omniroute-gateway-repair\SKILL.md` | 网关本身的排障与调优（渠道、死节点、视觉桥） |
