import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/home/index.tsx");import { jsxDEV } from "/node_modules/react/jsx-dev-runtime.js";
var _s = $RefreshSig$();
import { ArrowRight } from "/node_modules/lucide-react/dist/esm/lucide-react.mjs";
import { useEffect, useState } from "/node_modules/react/index.js";
import { App, Button, Image, Tag } from "/node_modules/antd/es/index.js";
import { useNavigate } from "/node_modules/react-router-dom/dist/index.mjs";
import { Trans, useTranslation } from "/node_modules/react-i18next/dist/es/index.js";
import { fetchPrompts } from "/src/services/api/prompts.ts";
import { navigationTools } from "/src/constant/navigation-tools.ts";
import i18n from "/src/i18n/index.ts";
import { cn } from "/src/lib/utils.ts";
function Highlighter({ action, color, children }) {
  return /* @__PURE__ */ jsxDEV("span", { className: "relative inline-block px-1", children: [
    action === "highlight" ? /* @__PURE__ */ jsxDEV("span", { className: "absolute inset-x-0 bottom-0 top-1 rounded-sm opacity-45", style: { backgroundColor: color } }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
      lineNumber: 16,
      columnNumber: 7
    }, this) : /* @__PURE__ */ jsxDEV("span", { className: "absolute inset-x-0 bottom-0 h-1 rounded-full opacity-80", style: { backgroundColor: color } }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
      lineNumber: 18,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("span", { className: "relative font-medium text-stone-800 dark:text-stone-200", children }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
      lineNumber: 20,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
    lineNumber: 14,
    columnNumber: 5
  }, this);
}
_c = Highlighter;
export default function IndexPage() {
  _s();
  const { message } = App.useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [primaryTool] = navigationTools;
  const [promptShowcase, setPromptShowcase] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  useEffect(() => {
    void fetchPrompts({ pageSize: 12 }).then((data) => setPromptShowcase(data.items)).catch((error) => message.error(error instanceof Error ? error.message : i18n.t("home.promptError")));
  }, [message]);
  return /* @__PURE__ */ jsxDEV("main", { className: "relative h-full overflow-y-auto bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] text-stone-950 dark:bg-[radial-gradient(rgba(245,245,244,.18)_1px,transparent_1px)] dark:text-stone-100", children: [
    /* @__PURE__ */ jsxDEV("section", { className: "relative mx-auto min-h-[calc(100vh-4rem)] max-w-7xl overflow-hidden px-6", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "pointer-events-none absolute left-[15%] top-24 size-20 rounded-full border border-dashed border-stone-200 dark:border-stone-800" }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
        lineNumber: 43,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "pointer-events-none absolute right-[23%] top-[48%] size-20 rounded-full border border-dashed border-stone-200 dark:border-stone-800" }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
        lineNumber: 44,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "relative flex min-h-[620px] flex-col items-center justify-center pt-10 text-center", children: [
        /* @__PURE__ */ jsxDEV("h1", { className: "ai-title-aurora max-w-5xl text-balance text-5xl font-semibold tracking-normal sm:text-7xl lg:text-8xl", children: t("meta.title") }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
          lineNumber: 47,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "mt-8 max-w-3xl text-balance text-lg leading-8 text-stone-500 dark:text-stone-400", children: /* @__PURE__ */ jsxDEV(Trans, { i18nKey: "home.description", components: { canvas: /* @__PURE__ */ jsxDEV(Highlighter, { action: "underline", color: "#FF9800" }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
          lineNumber: 49,
          columnNumber: 81
        }, this), content: /* @__PURE__ */ jsxDEV(Highlighter, { action: "highlight", color: "#87CEFA" }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
          lineNumber: 49,
          columnNumber: 142
        }, this) } }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
          lineNumber: 49,
          columnNumber: 25
        }, this) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
          lineNumber: 48,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "mt-10 flex flex-wrap items-center justify-center gap-3", children: [
          /* @__PURE__ */ jsxDEV(Button, { type: "primary", size: "large", onClick: () => navigate(`/${primaryTool.slug}`), icon: /* @__PURE__ */ jsxDEV(ArrowRight, { className: "size-4" }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
            lineNumber: 52,
            columnNumber: 116
          }, this), iconPlacement: "end", children: t("home.start") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
            lineNumber: 52,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV(Button, { size: "large", onClick: () => navigate("/canvas"), children: t("home.openCanvas") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
            lineNumber: 55,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
          lineNumber: 51,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
        lineNumber: 46,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("section", { className: "relative mx-auto mb-20 max-w-6xl border-t border-stone-200 pt-12 dark:border-stone-800", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "mb-8 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start", children: [
          /* @__PURE__ */ jsxDEV("div", {}, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
            lineNumber: 63,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "max-w-2xl text-center", children: [
            /* @__PURE__ */ jsxDEV("h2", { className: "text-3xl font-semibold text-stone-950 dark:text-stone-100", children: t("home.showcaseTitle") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
              lineNumber: 65,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "mt-3 text-base leading-7 text-stone-500 dark:text-stone-400", children: t("home.showcaseDescription") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
              lineNumber: 66,
              columnNumber: 29
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
            lineNumber: 64,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV(Button, { type: "link", onClick: () => navigate("/prompts"), className: "justify-self-center md:justify-self-end", icon: /* @__PURE__ */ jsxDEV(ArrowRight, { className: "size-4" }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
            lineNumber: 68,
            columnNumber: 140
          }, this), iconPlacement: "end", children: t("home.viewPrompts") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
            lineNumber: 68,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
          lineNumber: 62,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "grid auto-rows-[210px] gap-4 md:grid-cols-4", children: promptShowcase.map(
          (item, index) => /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              onClick: () => {
                setPreviewIndex(index);
                setPreviewOpen(true);
              },
              className: cn(
                "group relative cursor-pointer overflow-hidden border border-stone-200 bg-stone-100 text-left dark:border-stone-800 dark:bg-stone-900",
                index === 0 && "md:col-span-2 md:row-span-2",
                index === 3 && "md:col-span-2"
              ),
              children: [
                /* @__PURE__ */ jsxDEV("img", { src: item.coverUrl, alt: item.title, className: "h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" }, void 0, false, {
                  fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
                  lineNumber: 87,
                  columnNumber: 33
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent p-4 text-white", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "mb-2 flex flex-wrap gap-1.5", children: item.tags.slice(0, 2).map(
                    (tag) => /* @__PURE__ */ jsxDEV(Tag, { variant: "filled", className: "m-0 bg-white/15 text-[11px] text-white backdrop-blur", children: tag }, tag, false, {
                      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
                      lineNumber: 91,
                      columnNumber: 19
                    }, this)
                  ) }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
                    lineNumber: 89,
                    columnNumber: 37
                  }, this),
                  /* @__PURE__ */ jsxDEV("h3", { className: "text-sm font-medium", children: item.title }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
                    lineNumber: 96,
                    columnNumber: 37
                  }, this),
                  /* @__PURE__ */ jsxDEV("p", { className: "mt-1 line-clamp-2 text-xs leading-5 text-white/75", children: item.prompt }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
                    lineNumber: 97,
                    columnNumber: 37
                  }, this)
                ] }, void 0, true, {
                  fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
                  lineNumber: 88,
                  columnNumber: 33
                }, this)
              ]
            },
            item.id,
            true,
            {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
              lineNumber: 74,
              columnNumber: 13
            },
            this
          )
        ) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
          lineNumber: 72,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
        lineNumber: 61,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
      lineNumber: 42,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(
      Image.PreviewGroup,
      {
        preview: {
          open: previewOpen,
          current: previewIndex,
          onOpenChange: setPreviewOpen,
          onChange: setPreviewIndex
        },
        children: /* @__PURE__ */ jsxDEV("div", { className: "hidden", children: promptShowcase.map(
          (item) => /* @__PURE__ */ jsxDEV(Image, { src: item.coverUrl, alt: item.title }, item.id, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
            lineNumber: 114,
            columnNumber: 11
          }, this)
        ) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
          lineNumber: 112,
          columnNumber: 17
        }, this)
      },
      void 0,
      false,
      {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
        lineNumber: 104,
        columnNumber: 13
      },
      this
    )
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx",
    lineNumber: 41,
    columnNumber: 5
  }, this);
}
_s(IndexPage, "xIs7X5ZwOyCpIEgux6xt1tYVlv8=", false, function() {
  return [App.useApp, useTranslation, useNavigate];
});
_c2 = IndexPage;
var _c, _c2;
$RefreshReg$(_c, "Highlighter");
$RefreshReg$(_c2, "IndexPage");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/home/index.tsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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QUFBQSxNQUFDLE1BQU07QUFBQSxNQUFOO0FBQUEsUUFDRyxTQUFTO0FBQUEsVUFDTEMsTUFBTXRCO0FBQUFBLFVBQ051QixTQUFTekI7QUFBQUEsVUFDVDBCLGNBQWN2QjtBQUFBQSxVQUNkd0IsVUFBVTFCO0FBQUFBLFFBQ2Q7QUFBQSxRQUVBLGlDQUFDLFNBQUksV0FBVSxVQUNWSCx5QkFBZWdCO0FBQUFBLFVBQUksQ0FBQ0MsU0FDakIsdUJBQUMsU0FBb0IsS0FBS0EsS0FBS0UsVUFBVSxLQUFLRixLQUFLRyxTQUF2Q0gsS0FBS1EsSUFBakI7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBeUQ7QUFBQSxRQUM1RCxLQUhMO0FBQUE7QUFBQTtBQUFBO0FBQUEsZUFJQTtBQUFBO0FBQUEsTUFaSjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFhQTtBQUFBLE9BNUVKO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0E2RUE7QUFFUjtBQUFDL0IsR0EvRnVCRCxXQUFTO0FBQUEsVUFDVGpCLElBQUlvQixRQUNWZCxnQkFDR0YsV0FBVztBQUFBO0FBQUEsTUFIUmE7QUFBUyxJQUFBRCxJQUFBc0M7QUFBQSxhQUFBdEMsSUFBQTtBQUFBLGFBQUFzQyxLQUFBIiwibmFtZXMiOlsiQXJyb3dSaWdodCIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwiQXBwIiwiQnV0dG9uIiwiSW1hZ2UiLCJUYWciLCJ1c2VOYXZpZ2F0ZSIsIlRyYW5zIiwidXNlVHJhbnNsYXRpb24iLCJmZXRjaFByb21wdHMiLCJuYXZpZ2F0aW9uVG9vbHMiLCJpMThuIiwiY24iLCJIaWdobGlnaHRlciIsImFjdGlvbiIsImNvbG9yIiwiY2hpbGRyZW4iLCJiYWNrZ3JvdW5kQ29sb3IiLCJfYyIsIkluZGV4UGFnZSIsIl9zIiwibWVzc2FnZSIsInVzZUFwcCIsInQiLCJuYXZpZ2F0ZSIsInByaW1hcnlUb29sIiwicHJvbXB0U2hvd2Nhc2UiLCJzZXRQcm9tcHRTaG93Y2FzZSIsInByZXZpZXdJbmRleCIsInNldFByZXZpZXdJbmRleCIsInByZXZpZXdPcGVuIiwic2V0UHJldmlld09wZW4iLCJwYWdlU2l6ZSIsInRoZW4iLCJkYXRhIiwiaXRlbXMiLCJjYXRjaCIsImVycm9yIiwiRXJyb3IiLCJjYW52YXMiLCJjb250ZW50Iiwic2x1ZyIsIm1hcCIsIml0ZW0iLCJpbmRleCIsImNvdmVyVXJsIiwidGl0bGUiLCJ0YWdzIiwic2xpY2UiLCJ0YWciLCJwcm9tcHQiLCJpZCIsIm9wZW4iLCJjdXJyZW50Iiwib25PcGVuQ2hhbmdlIiwib25DaGFuZ2UiLCJfYzIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiaW5kZXgudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFycm93UmlnaHQgfSBmcm9tIFwibHVjaWRlLXJlYWN0XCI7XG5pbXBvcnQgeyB0eXBlIFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgQXBwLCBCdXR0b24sIEltYWdlLCBUYWcgfSBmcm9tIFwiYW50ZFwiO1xuaW1wb3J0IHsgdXNlTmF2aWdhdGUgfSBmcm9tIFwicmVhY3Qtcm91dGVyLWRvbVwiO1xuaW1wb3J0IHsgVHJhbnMsIHVzZVRyYW5zbGF0aW9uIH0gZnJvbSBcInJlYWN0LWkxOG5leHRcIjtcblxuaW1wb3J0IHsgZmV0Y2hQcm9tcHRzLCB0eXBlIFByb21wdCB9IGZyb20gXCJAL3NlcnZpY2VzL2FwaS9wcm9tcHRzXCI7XG5pbXBvcnQgeyBuYXZpZ2F0aW9uVG9vbHMgfSBmcm9tIFwiQC9jb25zdGFudC9uYXZpZ2F0aW9uLXRvb2xzXCI7XG5pbXBvcnQgaTE4biBmcm9tIFwiQC9pMThuXCI7XG5pbXBvcnQgeyBjbiB9IGZyb20gXCJAL2xpYi91dGlsc1wiO1xuXG5mdW5jdGlvbiBIaWdobGlnaHRlcih7IGFjdGlvbiwgY29sb3IsIGNoaWxkcmVuIH06IHsgYWN0aW9uOiBcImhpZ2hsaWdodFwiIHwgXCJ1bmRlcmxpbmVcIjsgY29sb3I6IHN0cmluZzsgY2hpbGRyZW4/OiBSZWFjdE5vZGUgfSkge1xuICAgIHJldHVybiAoXG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInJlbGF0aXZlIGlubGluZS1ibG9jayBweC0xXCI+XG4gICAgICAgICAgICB7YWN0aW9uID09PSBcImhpZ2hsaWdodFwiID8gKFxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LXgtMCBib3R0b20tMCB0b3AtMSByb3VuZGVkLXNtIG9wYWNpdHktNDVcIiBzdHlsZT17eyBiYWNrZ3JvdW5kQ29sb3I6IGNvbG9yIH19IC8+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LXgtMCBib3R0b20tMCBoLTEgcm91bmRlZC1mdWxsIG9wYWNpdHktODBcIiBzdHlsZT17eyBiYWNrZ3JvdW5kQ29sb3I6IGNvbG9yIH19IC8+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicmVsYXRpdmUgZm9udC1tZWRpdW0gdGV4dC1zdG9uZS04MDAgZGFyazp0ZXh0LXN0b25lLTIwMFwiPntjaGlsZHJlbn08L3NwYW4+XG4gICAgICAgIDwvc3Bhbj5cbiAgICApO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBJbmRleFBhZ2UoKSB7XG4gICAgY29uc3QgeyBtZXNzYWdlIH0gPSBBcHAudXNlQXBwKCk7XG4gICAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICAgIGNvbnN0IG5hdmlnYXRlID0gdXNlTmF2aWdhdGUoKTtcbiAgICBjb25zdCBbcHJpbWFyeVRvb2xdID0gbmF2aWdhdGlvblRvb2xzO1xuICAgIGNvbnN0IFtwcm9tcHRTaG93Y2FzZSwgc2V0UHJvbXB0U2hvd2Nhc2VdID0gdXNlU3RhdGU8UHJvbXB0W10+KFtdKTtcbiAgICBjb25zdCBbcHJldmlld0luZGV4LCBzZXRQcmV2aWV3SW5kZXhdID0gdXNlU3RhdGUoMCk7XG4gICAgY29uc3QgW3ByZXZpZXdPcGVuLCBzZXRQcmV2aWV3T3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICB2b2lkIGZldGNoUHJvbXB0cyh7IHBhZ2VTaXplOiAxMiB9KVxuICAgICAgICAgICAgLnRoZW4oKGRhdGEpID0+IHNldFByb21wdFNob3djYXNlKGRhdGEuaXRlbXMpKVxuICAgICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4gbWVzc2FnZS5lcnJvcihlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGkxOG4udChcImhvbWUucHJvbXB0RXJyb3JcIikpKTtcbiAgICB9LCBbbWVzc2FnZV0pO1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPG1haW4gY2xhc3NOYW1lPVwicmVsYXRpdmUgaC1mdWxsIG92ZXJmbG93LXktYXV0byBiZy1iYWNrZ3JvdW5kIGJnLVtyYWRpYWwtZ3JhZGllbnQoI2U1ZTdlYl8xcHgsdHJhbnNwYXJlbnRfMXB4KV0gW2JhY2tncm91bmQtc2l6ZToxNnB4XzE2cHhdIHRleHQtc3RvbmUtOTUwIGRhcms6YmctW3JhZGlhbC1ncmFkaWVudChyZ2JhKDI0NSwyNDUsMjQ0LC4xOClfMXB4LHRyYW5zcGFyZW50XzFweCldIGRhcms6dGV4dC1zdG9uZS0xMDBcIj5cbiAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInJlbGF0aXZlIG14LWF1dG8gbWluLWgtW2NhbGMoMTAwdmgtNHJlbSldIG1heC13LTd4bCBvdmVyZmxvdy1oaWRkZW4gcHgtNlwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicG9pbnRlci1ldmVudHMtbm9uZSBhYnNvbHV0ZSBsZWZ0LVsxNSVdIHRvcC0yNCBzaXplLTIwIHJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLWRhc2hlZCBib3JkZXItc3RvbmUtMjAwIGRhcms6Ym9yZGVyLXN0b25lLTgwMFwiIC8+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwb2ludGVyLWV2ZW50cy1ub25lIGFic29sdXRlIHJpZ2h0LVsyMyVdIHRvcC1bNDglXSBzaXplLTIwIHJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLWRhc2hlZCBib3JkZXItc3RvbmUtMjAwIGRhcms6Ym9yZGVyLXN0b25lLTgwMFwiIC8+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIGZsZXggbWluLWgtWzYyMHB4XSBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcHQtMTAgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGgxIGNsYXNzTmFtZT1cImFpLXRpdGxlLWF1cm9yYSBtYXgtdy01eGwgdGV4dC1iYWxhbmNlIHRleHQtNXhsIGZvbnQtc2VtaWJvbGQgdHJhY2tpbmctbm9ybWFsIHNtOnRleHQtN3hsIGxnOnRleHQtOHhsXCI+e3QoXCJtZXRhLnRpdGxlXCIpfTwvaDE+XG4gICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIm10LTggbWF4LXctM3hsIHRleHQtYmFsYW5jZSB0ZXh0LWxnIGxlYWRpbmctOCB0ZXh0LXN0b25lLTUwMCBkYXJrOnRleHQtc3RvbmUtNDAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8VHJhbnMgaTE4bktleT1cImhvbWUuZGVzY3JpcHRpb25cIiBjb21wb25lbnRzPXt7IGNhbnZhczogPEhpZ2hsaWdodGVyIGFjdGlvbj1cInVuZGVybGluZVwiIGNvbG9yPVwiI0ZGOTgwMFwiIC8+LCBjb250ZW50OiA8SGlnaGxpZ2h0ZXIgYWN0aW9uPVwiaGlnaGxpZ2h0XCIgY29sb3I9XCIjODdDRUZBXCIgLz4gfX0gLz5cbiAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTEwIGZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtM1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiB0eXBlPVwicHJpbWFyeVwiIHNpemU9XCJsYXJnZVwiIG9uQ2xpY2s9eygpID0+IG5hdmlnYXRlKGAvJHtwcmltYXJ5VG9vbC5zbHVnfWApfSBpY29uPXs8QXJyb3dSaWdodCBjbGFzc05hbWU9XCJzaXplLTRcIiAvPn0gaWNvblBsYWNlbWVudD1cImVuZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0KFwiaG9tZS5zdGFydFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiBzaXplPVwibGFyZ2VcIiBvbkNsaWNrPXsoKSA9PiBuYXZpZ2F0ZShcIi9jYW52YXNcIil9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0KFwiaG9tZS5vcGVuQ2FudmFzXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwicmVsYXRpdmUgbXgtYXV0byBtYi0yMCBtYXgtdy02eGwgYm9yZGVyLXQgYm9yZGVyLXN0b25lLTIwMCBwdC0xMiBkYXJrOmJvcmRlci1zdG9uZS04MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYi04IGdyaWQgZ2FwLTQgbWQ6Z3JpZC1jb2xzLVsxZnJfYXV0b18xZnJdIG1kOml0ZW1zLXN0YXJ0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1heC13LTJ4bCB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LTN4bCBmb250LXNlbWlib2xkIHRleHQtc3RvbmUtOTUwIGRhcms6dGV4dC1zdG9uZS0xMDBcIj57dChcImhvbWUuc2hvd2Nhc2VUaXRsZVwiKX08L2gyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIm10LTMgdGV4dC1iYXNlIGxlYWRpbmctNyB0ZXh0LXN0b25lLTUwMCBkYXJrOnRleHQtc3RvbmUtNDAwXCI+e3QoXCJob21lLnNob3djYXNlRGVzY3JpcHRpb25cIil9PC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIHR5cGU9XCJsaW5rXCIgb25DbGljaz17KCkgPT4gbmF2aWdhdGUoXCIvcHJvbXB0c1wiKX0gY2xhc3NOYW1lPVwianVzdGlmeS1zZWxmLWNlbnRlciBtZDpqdXN0aWZ5LXNlbGYtZW5kXCIgaWNvbj17PEFycm93UmlnaHQgY2xhc3NOYW1lPVwic2l6ZS00XCIgLz59IGljb25QbGFjZW1lbnQ9XCJlbmRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dChcImhvbWUudmlld1Byb21wdHNcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBhdXRvLXJvd3MtWzIxMHB4XSBnYXAtNCBtZDpncmlkLWNvbHMtNFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3Byb21wdFNob3djYXNlLm1hcCgoaXRlbSwgaW5kZXgpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17aXRlbS5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFByZXZpZXdJbmRleChpbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRQcmV2aWV3T3Blbih0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZ3JvdXAgcmVsYXRpdmUgY3Vyc29yLXBvaW50ZXIgb3ZlcmZsb3ctaGlkZGVuIGJvcmRlciBib3JkZXItc3RvbmUtMjAwIGJnLXN0b25lLTEwMCB0ZXh0LWxlZnQgZGFyazpib3JkZXItc3RvbmUtODAwIGRhcms6Ymctc3RvbmUtOTAwXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9PT0gMCAmJiBcIm1kOmNvbC1zcGFuLTIgbWQ6cm93LXNwYW4tMlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPT09IDMgJiYgXCJtZDpjb2wtc3Bhbi0yXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17aXRlbS5jb3ZlclVybH0gYWx0PXtpdGVtLnRpdGxlfSBjbGFzc05hbWU9XCJoLWZ1bGwgdy1mdWxsIG9iamVjdC1jb3ZlciB0cmFuc2l0aW9uIGR1cmF0aW9uLTUwMCBncm91cC1ob3ZlcjpzY2FsZS1bMS4wM11cIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LXgtMCBib3R0b20tMCBiZy1ncmFkaWVudC10by10IGZyb20tYmxhY2svNzAgdmlhLWJsYWNrLzM1IHRvLXRyYW5zcGFyZW50IHAtNCB0ZXh0LXdoaXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1iLTIgZmxleCBmbGV4LXdyYXAgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpdGVtLnRhZ3Muc2xpY2UoMCwgMikubWFwKCh0YWcpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhZyBrZXk9e3RhZ30gdmFyaWFudD1cImZpbGxlZFwiIGNsYXNzTmFtZT1cIm0tMCBiZy13aGl0ZS8xNSB0ZXh0LVsxMXB4XSB0ZXh0LXdoaXRlIGJhY2tkcm9wLWJsdXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0YWd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFnPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bVwiPntpdGVtLnRpdGxlfTwvaDM+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJtdC0xIGxpbmUtY2xhbXAtMiB0ZXh0LXhzIGxlYWRpbmctNSB0ZXh0LXdoaXRlLzc1XCI+e2l0ZW0ucHJvbXB0fTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxuICAgICAgICAgICAgPC9zZWN0aW9uPlxuICAgICAgICAgICAgPEltYWdlLlByZXZpZXdHcm91cFxuICAgICAgICAgICAgICAgIHByZXZpZXc9e3tcbiAgICAgICAgICAgICAgICAgICAgb3BlbjogcHJldmlld09wZW4sXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQ6IHByZXZpZXdJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgb25PcGVuQ2hhbmdlOiBzZXRQcmV2aWV3T3BlbixcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U6IHNldFByZXZpZXdJbmRleCxcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaGlkZGVuXCI+XG4gICAgICAgICAgICAgICAgICAgIHtwcm9tcHRTaG93Y2FzZS5tYXAoKGl0ZW0pID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxJbWFnZSBrZXk9e2l0ZW0uaWR9IHNyYz17aXRlbS5jb3ZlclVybH0gYWx0PXtpdGVtLnRpdGxlfSAvPlxuICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvSW1hZ2UuUHJldmlld0dyb3VwPlxuICAgICAgICA8L21haW4+XG4gICAgKTtcbn1cbiJdLCJmaWxlIjoiRTovY29kZXgvbmlhbm5pYW5haS96aHVhbmh1aXl1YW5nb25nL2luZmluaXRlLWNhbnZhcy93ZWIvc3JjL3BhZ2VzL2hvbWUvaW5kZXgudHN4In0=