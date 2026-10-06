# APIC: mcgrox models, groups, prices, and pro20x channel - production record

- Verification date: 2026-09-26
- Public site: `https://apic.cauai.fun`
- Evidence scope: live PostgreSQL data under `/opt/new-api`, container health, and public read-only probes. No secret or token is recorded here.

## One-line conclusion

The mcgrox models, channel categories, and quota billing ratios are active in APIC. The `pro20x` primary channel is enabled. Public registration remains enabled. The New API user-group field remains `default`; `pro`, `grok`, `plus`, `kimi`, and `kun` are channel/category names, not separate user permission groups.

## Current impact

- Five mcgrox channel/category names are enabled: `pro`, `grok`, `plus`, `kimi`, and `kun`; the underlying New API user-group field remains `default`.
- The `pro20x` primary channel has weight `1`; duplicate same-credential rows remain at weight `0` to avoid competing with the primary route.
- hb, sd2, and their data volumes were not changed.
- Public registration was intentionally left enabled.

## Live model channel categories

| Group | Model count | Models |
|---|---:|---|
| `pro` | 10 | `codex-auto-review`, `gpt-5.5`, `gpt-5.6`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-6-sol`, `gpt-image-2.5`, `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst` |
| `grok` | 4 | `grok-4.5`, `grok-4.6`, `grok-4.7`, `grok-composer-2.5-fast` |
| `plus` | 10 | Same model set as `pro` |
| `kimi` | 2 | `kimi-k2.6`, `kimi-k3` |
| `kun` | 1 | `deepseek-v4.1-flash` |

### Quota billing ratios

- Text input ratio: `2.5`.
- Text output ratio: `4`.
- Image models keep the existing image ratio: `1`.
- Existing DeepSeek official pricing was not changed.

These are New API quota billing ratios, not dollar costs or a final public recharge price. A later sale price should be recalculated from the real upstream cost.

## pro20x channel

- Primary channel: live channel `id=4`, name `ChatGPT Subscription (Codex)`, remark `pro20x`, status `1`, weight `1`.
- Duplicate rows: live channels `id=5` and `id=6`, status `1` but weight `0`; they are retained as non-primary rows.
- No account password, API key, or OAuth token is recorded in this repository or chat.

## Verification evidence

- PostgreSQL backup exists at `/opt/new-api/backups/apic-before-mcgrox-pro20x-20260926T171049Z.dump`.
- `new-api`, PostgreSQL, and Redis containers are running; the New API health check passes.
- Public probes: `https://apic.cauai.fun/api/status` = 200; `/register` = 200; unauthenticated `/v1/models` = 401. Authorized verification returned 19 models.
- Real calls previously verified: `gpt-5.6`, `gpt-6-sol`, `kimi-k3`, `deepseek-v4.1-flash`, `grok-4.7`, and `grok-composer-2.5-fast`.
- `grok-4.5` and `grok-4.6` currently receive upstream 429 responses. This is an upstream rate-limit or quota condition; the local group and route are active.

## Status classification

- **Live and effective:** five mcgrox groups, model list, quota ratios, and the `pro20x` primary channel.
- **Verified:** container health, public entry points, model listing behavior, and representative real calls.
- **Not verified in this pass:** a full paid call for every model and an external financial cost audit.
- **Owner decision needed:** none for this change; public registration stays enabled as requested.

## Rollback reference

If rollback is required, use the PostgreSQL backup above after a new confirmation. Do not remove or reset `/opt/new-api` persistent data.

