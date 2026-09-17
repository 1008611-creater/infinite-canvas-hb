# license-server-README

> **归档副本** —— 来源：`E:\codex\niannianai\zhuanhuiyuangong\license-server\README.md`
> 复制日期：2026-09-11　|　归集到：`E:\codex\huabu\inventory\`
> 原件仍在原位，**本副本不是权威版本**；两者不一致时以原件为准。

---

# 独立授权服务器

这是国际豆包客户端的独立卡密服务原型，协议路径与客户端当前使用的 `/kami/liwang2541/check.php` 兼容。

## 本地运行

PowerShell：

```powershell
$env:ADMIN_TOKEN = '请在本机安全生成至少16位令牌'
$env:SIGNING_SECRET = '需要与客户端签名配置一致的密钥'
npm start
```

打开 `http://127.0.0.1:8787/admin`，输入管理员令牌即可生成卡密。

预设：`5分钟（测试）`、`1小时`、`1天`、`7天`、`1个月（30天）`、`1年（365天）`。

## 客户端连接

客户端目前仍保留原授权服务器地址和签名配置，因此本服务启动后不会自动接管现有客户程序。正式接管需要在客户端配置中替换服务地址，并通过安全方式配置匹配的签名方案；不要把生产密钥写进源码或发到聊天中。

## 公网部署

需要用户提供服务器、域名、HTTPS 反向代理和生产密钥托管方式。部署完成后再把客户端服务地址切换到公网 HTTPS 地址。

## 当前 Cloudflare 部署

- Worker：`dola-license-server`
- D1：`dola-license-db`
- 域名：`https://dola.cauai.fun`
- 签名私钥已通过 Cloudflare Secret 配置，客户端只携带公钥。
- 还需在 Worker 的 Variables and Secrets 中添加 `ADMIN_TOKEN`，再打开 `/admin` 生成卡密。
