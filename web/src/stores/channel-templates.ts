import type { ApiCallFormat, ChannelModel, ModelCapability, ModelChannel } from "./use-config-store";

/**
 * 渠道模板：预填接口地址与模型，用户只需要补 API Key。
 *
 * 铁律：模板里**绝不写 API Key**。仓库是公开的，Key 一旦进代码就等于泄露，
 * 只能让用户在界面里贴一次（存 localStorage）。
 */
export type ChannelTemplate = {
    id: string;
    /** 模板名，直接作为渠道名 */
    name: string;
    baseUrl: string;
    apiFormat: ApiCallFormat;
    models: Array<{ name: string; capability: ModelCapability }>;
    imageBatchLimit?: number;
    editViaGenerations?: boolean;
    /** 提示文案，说明这个渠道还差什么才能用 */
    hint: string;
};

export const channelTemplates: ChannelTemplate[] = [
    {
        id: "openlux",
        name: "OpenLux",
        baseUrl: "https://api.openlux.ai",
        apiFormat: "openai",
        models: [{ name: "gpt-image-2-c", capability: "image" }],
        // 实测（2026-09-01）：n=3 时返回 2 张、HTTP 200 —— 不报错但会静默少给。
        // 填 1 让前端拆成多次调用，保证选几张出几张。
        imageBatchLimit: 1,
        // 它的 /images/edits（multipart）不可用，图生图必须走 generations + image 参数。
        editViaGenerations: true,
        hint: "生图（gpt-image-2-c）。填 API Key 即用。单张约 40–75 秒；该渠道对多张请求会少给，已按 1 张/次拆分以保证张数准确。",
    },
    {
        id: "omniroute",
        name: "OmniRoute",
        baseUrl: "http://127.0.0.1:20128",
        apiFormat: "openai",
        // auto/* 是智能路由，上游某个渠道挂了会自动换，比写死具体模型稳。
        models: [
            { name: "auto/best-chat", capability: "text" },
            { name: "auto/best-fast", capability: "text" },
            { name: "auto/best-vision", capability: "text" },
            { name: "auto/best-coding", capability: "text" },
        ],
        hint: "文本网关（207 个模型，auto/* 会自动挑可用上游）。API Key 填任意非空值即可，网关只要求 Authorization 头存在、不校验内容。注意：公网页面要访问它得先暴露成 https；**网关本身无鉴权，暴露到公网等于把额度公开，务必先用 Cloudflare Access 加一层登录**。",
    },
    {
        id: "midjourney",
        name: "Midjourney (本地桥接)",
        baseUrl: "http://127.0.0.1:8765",
        apiFormat: "openai",
        models: [{ name: "midjourney", capability: "image" }],
        hint: "走本地 MJ 桥接服务（mxai-rpa-mcp + FastAPI）。需先在本机启动该服务；公网页面访问同样要把它暴露成 https。",
    },
];

export function createChannelFromTemplate(template: ChannelTemplate): ModelChannel {
    return {
        id: template.id,
        name: template.name,
        baseUrl: template.baseUrl,
        apiKey: "",
        apiFormat: template.apiFormat,
        models: template.models.map((model): ChannelModel => ({ name: model.name, capability: model.capability })),
        ...(template.imageBatchLimit ? { imageBatchLimit: template.imageBatchLimit } : {}),
        ...(template.editViaGenerations ? { editViaGenerations: true } : {}),
    };
}
