# 线程登记

| 登记键 | 主题 | 状态 | 权威进度 / 证据 |
|---|---|---|---|
| `2026-09-27-apic-liandian-subscription` | APIC LDXP subscription voucher redemption | Deployed and healthy; source at `f7aae613810640f0ab4bdd55eab9fe8c105313e2`. Public status rechecked HTTP 200. Waiting for APIC admin login; plans/codes and separate LDXP products not configured; paid/live redemption untested | `docs/STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md`; `assistant/CURRENT.md` |
| `2026-09-27-laoba-unified-slice` | SD2 + HB 统一为 LAOBA 形态的第一条可运行切片 | 已发布到 `aigc.cauai.fun`；公网基础验收通过；真实账号/真实生成/真实扣费仍未验证 | `docs/STATUS_20260927_LAOBA_RELEASE.md` |
| `2026-09-27-apic-live-repair` | APIC HTTP 明文入口/HSTS 修复与 Grok 4.5/4.6 下线 | 已在线上生效；公网回归通过；待核对后续发布源持久化 | `docs/STATUS_20260927_APIC_REPAIR.md` |
| `2026-09-27-unified-auth-implementation` | D45 三站统一账号：统一注册、APIC 入口、hb/sd2/apic 会话桥接 | 本地已改；完整 APIC 源码依赖已恢复；最终运行时镜像构建与 mock 零写入验收通过；线上只读仍是旧行为；未发布 | `docs/STATUS_20260927_UNIFIED_AUTH_IMPLEMENTATION.md` |
| `2026-09-27-auth-contract-review` | New API 统一认证契约与中转差异 | 已被本轮实现结果更新 | `docs/STATUS_20260927_AUTH_CONTRACT.md` |
| `2026-09-27-unified-quota-runtime-check` | 统一额度运行开关核查 | 未启用统一额度写入 | `docs/STATUS_20260927_UNIFIED_QUOTA_RUNTIME.md` |
| `2026-09-27-sd2-live-audit` | sd2.cauai.fun 公网、数据层、统一额度与 SSO 只读审计 | 已完成：入口与门禁正常，Postgres/备份在线；统一账号/额度未发布；编辑器 SSO 回跳 localhost；紫域任务列表按用户隔离待双账号核验 | `docs/ROADMAP.md` 2026-09-27；`docs/STATUS_20260927_SD2_AUDIT.md` |
| `2026-09-27-hb-live-audit` | hb.cauai.fun 公网、门禁、收费与统一方案只读审计 | 已订正：owner 确认公开售卖，注册应保留；稳定收费、统一认证/额度仍未完成 | `docs/STATUS_20260927_HB_AUDIT.md` |
| `2026-09-27-hb-public-sales-billing-audit` | 按公开售卖口径修复并发布 HB 注册、额度与扣费链路 | 已上线 `5cea6ce`；公网边界回归通过；真实账号/真实出片/真实扣费待验收 | `docs/STATUS_20260927_HB_AUDIT.md`
| `2026-09-27-sd2-runnable-path` | SD2 紫域生成链路根本修复：计费、时长、失败历史、用户隔离 | 已上线当前已验证修复；公网基础入口已验证；真实账号/真实扣费未验证 | `docs/STATUS_20260927_SD2_RELEASE.md` |
| `2026-09-27-sd2-release-followup` | sd2.cauai.fun 发布与线上小额验收 | 已上线新镜像；公网基础入口/鉴权边界已验证；真实账号扣费出片待测试账号与费用上限 | `docs/STATUS_20260927_SD2_RELEASE.md` |

| `2026-09-27-hb-live-acceptance` | Ziyu key repaired; test account live acceptance | Login, generation, charge settlement, and media file storage verified; task-center media link missing; refund unverified | docs/STATUS_20260927_HB_AUDIT.md |
| `2026-09-27-upstream-latest-fetch` | ?? GitHub ?????? | ????`upstream/main` ???????? `dab19adc0847e32e39b7fc8ff90cb392561fb826`?????????????? | `assistant/CURRENT.md` ???? |
| `2026-09-27-hb-result-persistence-repair` | HB task result persistence repair | Commits `0c417a8` + `ca2395f` published as `canvas-20260928-025558-ca2395f`; public smoke passed; no real generation/billing test | `assistant/CURRENT.md`; `docs/STATUS_20260927_HB_AUDIT.md` |
| `2026-09-27-apic-liandian-credential-discovery` | 按用户指定入口复查 LDXP 支付与应用页面 | 官方指南确认有自配支付（自有 API/支付网关），但需客服手动开通；当前后台无配置入口或服务端协议，用户要求不联系客服，APIC 真实支付接入受阻 | `docs/STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md`; `assistant/CURRENT.md` |
| `2026-09-28-one-release-readiness-audit` | One online entry, unified login, and paid-launch readiness audit | One homepage/health and HB/SD2 login pages online; APIC unified login route 404/400; complete SSO, server-side billing enforcement, and paid acceptance remain open | `assistant/CURRENT.md`; `docs/STATUS_20260927_AUTH_CONTRACT.md`; `docs/STATUS_20260927_HB_AUDIT.md`; `docs/STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md` |
| `2026-09-28-one-auth-broker-first-slice` | One ??????????? | ???????????? mock ??????????? APIC ????????????????????????? | `docs/STATUS_20260928_ONE_AUTH_BROKER_SLICE.md`; `assistant/CURRENT.md` |
| `2026-09-28-one-unified-quota-persistence` | APIC ????????? | ??????????? token????????????/???????????SQLite?MySQL 8.0.46?PostgreSQL 17 ????????????????? | `docs/STATUS_20260928_ONE_IMPLEMENTATION_SLICE.md`; `assistant/CURRENT.md` |
| `2026-09-28-one-implementation-slice` | HB billing boundary hardening and APIC One auth bridge | Local source changed; HB checks pass; APIC Go test blocked by broken local Go standard library; static review found UnifiedLogout accepts invalid/replayed assertions; not published | `docs/STATUS_20260928_ONE_IMPLEMENTATION_SLICE.md` |
| `2026-09-28-one-sd2-unified-quota-billing` | SD2 ?????????? | ???????????????????????????????????????????? | `docs/STATUS_20260928_ONE_IMPLEMENTATION_SLICE.md`; `assistant/CURRENT.md` |
| `2026-09-28-one-auth-broker-test-stability` | 修复 One 认证中转站契约测试端口冲突 | 本地改动；认证契约测试连续 3 次通过；未发布线上 | `docs/STATUS_20260928_ONE_AUTH_BROKER_TEST_FIX.md`; `assistant/CURRENT.md` |
| `2026-09-28-one-auth-broker-release-package` | 准备 One 认证入口本地发布包 | 发布包已生成并通过 Compose/镜像/清单检查；未上传、未发布 | `output/one-auth-broker-release-20260928-v1/`; `docs/STATUS_20260928_ONE_AUTH_BROKER_TEST_FIX.md` |
| `2026-09-28-one-sd2-joint-preflight` | One + SD2 联合发布预检 | 本地统一认证配置、SD2 构建和 One 契约检查通过；SD2 工作树 29 个未整理改动，尚未冻结或发布 | `docs/STATUS_20260928_ONE_SD2_PREFLIGHT.md`; `assistant/CURRENT.md` |
| `2026-09-28-one-sd2-candidate-freeze` | SD2 One / 统一认证 / 统一额度候选包冻结 | 本地候选包已生成并完成哈希回读；工作树 29 个改动，尚未形成完整发布包或上线 | `docs/STATUS_20260928_SD2_ONE_AUTH_QUOTA_CANDIDATE.md`; `assistant/CURRENT.md` |
| `2026-09-28-one-sd2-candidate-v2` | SD2 One / 统一认证 / 统一额度候选包 v2 | 候选包已重新生成；额度预扣账本补偿与退款对账阻塞已修复并通过本地检查；未上传、未部署、未做真实生成 | `output/sd2-one-auth-quota-candidate-20260928-v2/`; `docs/STATUS_20260928_SD2_ONE_AUTH_QUOTA_CANDIDATE.md` |
| `2026-09-28-one-sd2-media-ownership-repair` | SD2 紫域媒体读取归属修复 | 两个媒体接口改为按用户归属任务的上游任务编号读取；本地检查和候选包 v2 已刷新；未部署、未做真实上游验收 | `output/sd2-one-auth-quota-candidate-20260928-v2/`; `docs/STATUS_20260928_SD2_ONE_AUTH_QUOTA_CANDIDATE.md` |

| `2026-09-28-one-logout-failure-handling` | One 统一退出失败处理 | 本地已修改并通过模拟契约测试；本地候选包 v2 已生成；未发布 | `docs/STATUS_20260928_ONE_LOGOUT_FAILURE.md`; `output/one-auth-broker-release-20260928-v2/`; `implementation/entry/origin/auth-broker/server.js`; `implementation/entry/origin/auth-broker/contract.test.mjs` |


| `2026-09-28-sd2-scoped-docker-build` | SD2 One / 统一额度完整镜像构建预检 | 候选构建与隔离健康检查通过；旧版本标识疑点已更正；会话边界冒烟通过但成功统一登录/退出仍未验收；诊断容器、网络和镜像已清理；临时构建源码目录仍保留（删除被策略拦截）；未部署 | `docs/STATUS_20260928_SD2_FULL_BUILD_PREFLIGHT.md`; `output/sd2-one-auth-quota-release-20260928-v2/` |

| `2026-09-28-apic-unified-logout-assertion` | APIC ???????? | ?????????????????SQLite ??/??????? controller ??? router ?????????????????? | `E:\codex\apic-ldxp-redeem\controller\auth_unified.go`; `docs/STATUS_20260928_ONE_IMPLEMENTATION_SLICE.md` |

| `2026-09-29-apic-contract-source-authority` | One/APIC ???????? APIC ???? | mock-only ??????????? | `implementation/entry/origin/auth-broker/contract.test.mjs`; `docs/STATUS_20260928_ONE_IMPLEMENTATION_SLICE.md` |
