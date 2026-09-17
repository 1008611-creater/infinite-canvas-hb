# 批次 1.5 · 前端额度入口与紫域目录落地说明

治理仓：`E:\\codex\\huabu`  
权威源码树：`E:\\codex\\niannianai\\zhuanhuiyuangong\\infinite-canvas`

## 交付范围

`implementation/scripts/apply-batch1-ui.mjs` 是批次 1 后端落地器之后的前端补齐器，分为四步：

| 步骤 | 用户路径 | 改动位置 |
| --- | --- | --- |
| U1 | 账号面板能够读取余额、兑换码记录和紫域实时目录 | `web/src/services/backend-sync.ts` |
| U2 | 登录后显示余额，用户可以粘贴兑换码并刷新余额；管理员可在线生成兑换码并复制导出 | `web/src/components/layout/config-account.tsx` |
| U3 | 中英文账号面板文案 | `web/src/i18n/locales/zh-CN.ts`、`en-US.ts` |
| U4 | 紫域目录实时拉取，并按用途 / 积分档位分组 | `web/src/components/layout/model-select-modal.tsx` |

前端只收到服务端返回的余额与已脱敏目录；紫域 Key 仍只在服务器环境变量中。文案使用“购买兑换码 / 粘贴兑换码”，不把固定人民币比例写进用户界面。

## 推荐执行顺序

先做只读干跑和内存类型检查：

```bash
node E:/codex/huabu/implementation/scripts/apply-batch1-ui.mjs \
  --source=E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas \
  --dry-run --typecheck
```

退出码为 `0` 只表示锚点、合并写入队列和内存 TypeScript 检查通过；它不代表真实源码已经改动、浏览器已经走通或服务器已经发布。

确认输出中的“待写盘”只有下面 5 个目标后，才可在拥有权威源码树写权限的终端正式执行：

```bash
node E:/codex/huabu/implementation/scripts/apply-batch1-ui.mjs \
  --source=E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas \
  --typecheck
```

脚本每个目标文件只保留一份当日 `.bak-YYYYMMDD` 备份；重复执行应全部 `SKIP`。U3 与 U4 共同修改两份语言包，脚本会先合并内存版本再写盘，不会以后一个步骤覆盖前一个步骤。

## 正式写入后的质量门

1. 在权威源码树执行 `npm --prefix web run typecheck` 与 `npm --prefix web run build`。
2. 先登录账号面板，确认余额能读出；粘贴一张测试兑换码，确认只到账一次，再刷新确认余额。
3. 打开紫域渠道模型选择，点击“拉取模型列表”，确认请求走 `/api/ziyu/models`，列表按视频 / 图片和积分档位出现；浏览器开发者工具中不得出现紫域 Authorization 值。
4. 在真实浏览器完成 L2 冒烟后，才允许进入批次 1 的真实出片验收；尚未完成的真实紫域出片、结果落盘和对账仍不能标记为完成。

## 紫域出片的额度边界

批次 1 的 S8 落地器会在生成的紫域视频 / 图片脚本外面加一层额度事务：

- 第一次 `/jobs` 发送前，按实时目录的 `costPerSecond × duration`（或固定 `cost`）估算，并调用 `/api/credits/reserve`；余额不足时不会提交紫域任务。
- `/jobs/{id}` 进入终态后，只把紫域返回的真实 `job.cost` 交给 `/api/credits/settle`；服务端按 `cost × 1.5` 向上取整，幂等结算。
- provider 在任务尚未建立前失败，才调用 `/api/credits/refund`；已经提交但没有拿到可靠 `cost` 时保留预扣，留给管理员对账，脚本不擅自退款。
- 这层通过渠道 `script` 完成，不改 `model-plugin.ts`，也不把 Key 放进浏览器。S8 会在写入前对最终脚本做一次只编译不执行的语法检查。

管理员发卡入口只在账号 `role=admin` 时渲染；服务器仍会再次做管理员守卫和面额校验，前端输入不是安全边界。

上述是代码路径与干跑证据，不是真实紫域出片、真实数据库事务或并发验收；首次真机测试仍可能产生 provider 费用，必须按验收清单单独确认。

## 明确未覆盖的操作

- 不在本脚本中读取或写入任何服务器密钥、站点密码、AUTH_COOKIE 或用户数据卷。
- 不执行服务器 `.env` 修改、容器重建、nginx reload、公开注册开关切换或发布。
- 不替代真实浏览器验证，也不替代紫域真实计费 / 失败任务对账。
