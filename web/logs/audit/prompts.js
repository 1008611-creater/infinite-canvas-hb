import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/prompts/index.tsx");import { jsxDEV } from "/node_modules/react/jsx-dev-runtime.js";
var _s = $RefreshSig$(), _s2 = $RefreshSig$();
import { FolderPlus, Search } from "/node_modules/lucide-react/dist/esm/lucide-react.mjs";
import { useEffect, useState } from "/node_modules/react/index.js";
import { App, Button, Empty, Input, Spin, Tag } from "/node_modules/antd/es/index.js";
import { useTranslation } from "/node_modules/react-i18next/dist/es/index.js";
import { PromptCard } from "/src/components/prompts/prompt-card.tsx";
import { usePromptList } from "/src/components/prompts/use-prompt-list.ts";
import { PromptDetailDialog } from "/src/pages/prompts/components/prompt-detail-dialog.tsx";
import { useCopyText } from "/src/hooks/use-copy-text.ts";
import { cn } from "/src/lib/utils.ts";
import { useAssetStore } from "/src/stores/use-asset-store.ts";
import { ALL_PROMPTS_OPTION } from "/src/services/api/prompts.ts";
export default function PromptsPage() {
  _s();
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [titleKeyword, setTitleKeyword] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(ALL_PROMPTS_OPTION);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const addAsset = useAssetStore((state) => state.addAsset);
  const copyText = useCopyText();
  const { query, items: promptItems, tags: promptTags, categories: promptCategoryOptions, total: totalPrompts } = usePromptList({ keyword: titleKeyword, tags: selectedTags, category: selectedCategory });
  useEffect(() => {
    if (query.isError) message.error(query.error instanceof Error ? query.error.message : t("prompts.loadFailed"));
  }, [message, query.error, query.isError, t]);
  const toggleTag = (tag) => {
    if (tag === ALL_PROMPTS_OPTION) return setSelectedTags([]);
    setSelectedTags((items) => items.includes(tag) ? items.filter((item) => item !== tag) : [...items, tag]);
  };
  const savePromptAsset = (item) => {
    addAsset({ kind: "text", title: item.title, coverUrl: item.coverUrl, tags: item.tags, source: item.category, data: { content: item.prompt }, metadata: { source: "prompt-library", promptId: item.id, githubUrl: item.githubUrl } });
    message.success(t("common.addedToAssets"));
  };
  const handleListScroll = (event) => {
    const target = event.currentTarget;
    if (query.hasNextPage && !query.isFetchingNextPage && target.scrollTop + target.clientHeight >= target.scrollHeight - 160) void query.fetchNextPage();
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "flex h-full flex-col overflow-hidden bg-background text-stone-800 dark:text-stone-100", children: [
    /* @__PURE__ */ jsxDEV("main", { className: "min-h-0 flex-1 overflow-y-auto bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] px-4 py-6 [background-size:16px_16px] sm:px-6 lg:py-8 dark:bg-[radial-gradient(rgba(245,245,244,.16)_1px,transparent_1px)]", onScroll: handleListScroll, children: /* @__PURE__ */ jsxDEV("div", { className: "mx-auto max-w-7xl", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-semibold text-stone-950 dark:text-stone-100", children: t("prompts.title") }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
          lineNumber: 49,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "mt-1 text-sm text-stone-500 dark:text-stone-400", children: t("prompts.total", { count: totalPrompts }) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
          lineNumber: 50,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
        lineNumber: 48,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "mt-5 grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6", children: [
        /* @__PURE__ */ jsxDEV("aside", { className: "thin-scrollbar max-h-72 overflow-y-auto border-b border-stone-200 pb-5 lg:sticky lg:top-0 lg:max-h-[calc(100dvh-6rem)] lg:border-b-0 lg:border-r lg:pb-8 lg:pr-5 dark:border-stone-800", children: [
          /* @__PURE__ */ jsxDEV(PromptFilter, { label: t("prompts.category"), options: promptCategoryOptions, selected: selectedCategory, onChange: setSelectedCategory }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
            lineNumber: 54,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "mt-6", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500", children: t("prompts.tags") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
              lineNumber: 56,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap gap-1.5", children: promptTags.map((tag) => {
              const active = tag === ALL_PROMPTS_OPTION ? selectedTags.length === 0 : selectedTags.includes(tag);
              return /* @__PURE__ */ jsxDEV(Tag.CheckableTag, { checked: active, className: cn("prompt-filter-tag", active && "is-active"), onChange: () => toggleTag(tag), children: tag === ALL_PROMPTS_OPTION ? t("common.all") : tag }, tag, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
                lineNumber: 60,
                columnNumber: 28
              }, this);
            }) }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
              lineNumber: 57,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
            lineNumber: 55,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
          lineNumber: 53,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("section", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxDEV(Input, { size: "large", prefix: /* @__PURE__ */ jsxDEV(Search, { className: "size-4 text-stone-400" }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
            lineNumber: 66,
            columnNumber: 57
          }, this), value: titleKeyword, placeholder: t("prompts.search"), onChange: (event) => setTitleKeyword(event.target.value) }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
            lineNumber: 66,
            columnNumber: 29
          }, this),
          query.isLoading ? /* @__PURE__ */ jsxDEV("div", { className: "flex h-60 items-center justify-center", children: /* @__PURE__ */ jsxDEV(Spin, {}, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
            lineNumber: 67,
            columnNumber: 103
          }, this) }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
            lineNumber: 67,
            columnNumber: 48
          }, this) : null,
          !query.isLoading ? /* @__PURE__ */ jsxDEV("div", { className: "mt-5", children: /* @__PURE__ */ jsxDEV(PromptGrid, { items: promptItems, onOpen: setSelectedPrompt, renderActions: (item) => /* @__PURE__ */ jsxDEV(Button, { type: "text", size: "small", icon: /* @__PURE__ */ jsxDEV(FolderPlus, { className: "size-3.5" }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
            lineNumber: 68,
            columnNumber: 194
          }, this), onClick: () => savePromptAsset(item), children: t("common.addToAssets") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
            lineNumber: 68,
            columnNumber: 155
          }, this), onCopy: (item) => copyText(item.prompt, t("common.promptCopied")), emptyText: t("prompts.empty") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
            lineNumber: 68,
            columnNumber: 71
          }, this) }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
            lineNumber: 68,
            columnNumber: 49
          }, this) : null,
          /* @__PURE__ */ jsxDEV("div", { className: "mt-6 text-center text-xs text-stone-500 dark:text-stone-400", children: query.isFetchingNextPage ? t("prompts.loading") : query.hasNextPage ? t("prompts.loadMore") : promptItems.length > 0 ? t("prompts.end") : null }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
            lineNumber: 69,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
          lineNumber: 65,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
        lineNumber: 52,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
      lineNumber: 47,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
      lineNumber: 46,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(PromptDetailDialog, { prompt: selectedPrompt, onClose: () => setSelectedPrompt(null), onCopy: (prompt) => copyText(prompt, t("common.promptCopied")), onSaveAsset: savePromptAsset }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
      lineNumber: 75,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
    lineNumber: 45,
    columnNumber: 5
  }, this);
}
_s(PromptsPage, "Rm8UjEIuXq5Y9lRukDEemWRJ+0c=", false, function() {
  return [App.useApp, useTranslation, useAssetStore, useCopyText, usePromptList];
});
_c = PromptsPage;
function PromptFilter({ label, options, selected, onChange }) {
  _s2();
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxDEV("div", { children: [
    /* @__PURE__ */ jsxDEV("div", { className: "mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500", children: label }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
      lineNumber: 82,
      columnNumber: 15
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap gap-1.5", children: options.map((option) => /* @__PURE__ */ jsxDEV(Tag.CheckableTag, { checked: selected === option, className: cn("prompt-filter-tag", selected === option && "is-active"), onChange: () => onChange(option), children: option === ALL_PROMPTS_OPTION ? t("common.all") : option }, option, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
      lineNumber: 82,
      columnNumber: 198
    }, this)) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
      lineNumber: 82,
      columnNumber: 133
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
    lineNumber: 82,
    columnNumber: 10
  }, this);
}
_s2(PromptFilter, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
  return [useTranslation];
});
_c2 = PromptFilter;
function PromptGrid({ items, onOpen, onCopy, renderActions, emptyText }) {
  return /* @__PURE__ */ jsxDEV("div", { children: [
    /* @__PURE__ */ jsxDEV("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: items.map((item) => /* @__PURE__ */ jsxDEV(PromptCard, { item, onOpen: () => onOpen(item), onCopy: () => onCopy(item), extraAction: renderActions(item) }, `${item.sourceId}:${item.id}`, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
      lineNumber: 86,
      columnNumber: 94
    }, this)) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
      lineNumber: 86,
      columnNumber: 15
    }, this),
    items.length === 0 ? /* @__PURE__ */ jsxDEV(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE, description: emptyText, className: "py-16" }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
      lineNumber: 86,
      columnNumber: 276
    }, this) : null
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx",
    lineNumber: 86,
    columnNumber: 10
  }, this);
}
_c3 = PromptGrid;
var _c, _c2, _c3;
$RefreshReg$(_c, "PromptsPage");
$RefreshReg$(_c2, "PromptFilter");
$RefreshReg$(_c3, "PromptGrid");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/prompts/index.tsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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VDtBQUFBLE9BQWxiO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FBd2I7QUFDbmM7QUFBQ0QsSUFIUUwsY0FBWTtBQUFBLFVBQ0h4RSxjQUFjO0FBQUE7QUFBQSxNQUR2QndFO0FBS1QsU0FBU08sV0FBVyxFQUFFdEQsT0FBT3VELFFBQVFDLFFBQVFDLGVBQWVDLFVBQThKLEdBQUc7QUFDek4sU0FBTyx1QkFBQyxTQUFJO0FBQUEsMkJBQUMsU0FBSSxXQUFVLDRDQUE0QzFELGdCQUFNMEMsSUFBSSxDQUFDekIsU0FBUyx1QkFBQyxjQUErQyxNQUFZLFFBQVEsTUFBTXNDLE9BQU90QyxJQUFJLEdBQUcsUUFBUSxNQUFNdUMsT0FBT3ZDLElBQUksR0FBRyxhQUFhd0MsY0FBY3hDLElBQUksS0FBbEksR0FBR0EsS0FBSzBDLFFBQVEsSUFBSTFDLEtBQUtXLEVBQUUsSUFBNUM7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQUFxSixDQUFHLEtBQXZPO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0FBeU87QUFBQSxJQUFPNUIsTUFBTTRDLFdBQVcsSUFBSSx1QkFBQyxTQUFNLE9BQU96RSxNQUFNeUYsd0JBQXdCLGFBQWFGLFdBQVcsV0FBVSxXQUE5RTtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBQXFGLElBQU07QUFBQSxPQUFyVztBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQTBXO0FBQ3JYO0FBQUNHLE1BRlFQO0FBQVUsSUFBQVEsSUFBQUMsS0FBQUY7QUFBQSxhQUFBQyxJQUFBO0FBQUEsYUFBQUMsS0FBQTtBQUFBLGFBQUFGLEtBQUEiLCJuYW1lcyI6WyJGb2xkZXJQbHVzIiwiU2VhcmNoIiwidXNlRWZmZWN0IiwidXNlU3RhdGUiLCJBcHAiLCJCdXR0b24iLCJFbXB0eSIsIklucHV0IiwiU3BpbiIsIlRhZyIsInVzZVRyYW5zbGF0aW9uIiwiUHJvbXB0Q2FyZCIsInVzZVByb21wdExpc3QiLCJQcm9tcHREZXRhaWxEaWFsb2ciLCJ1c2VDb3B5VGV4dCIsImNuIiwidXNlQXNzZXRTdG9yZSIsIkFMTF9QUk9NUFRTX09QVElPTiIsIlByb21wdHNQYWdlIiwiX3MiLCJtZXNzYWdlIiwidXNlQXBwIiwidCIsInRpdGxlS2V5d29yZCIsInNldFRpdGxlS2V5d29yZCIsInNlbGVjdGVkVGFncyIsInNldFNlbGVjdGVkVGFncyIsInNlbGVjdGVkQ2F0ZWdvcnkiLCJzZXRTZWxlY3RlZENhdGVnb3J5Iiwic2VsZWN0ZWRQcm9tcHQiLCJzZXRTZWxlY3RlZFByb21wdCIsImFkZEFzc2V0Iiwic3RhdGUiLCJjb3B5VGV4dCIsInF1ZXJ5IiwiaXRlbXMiLCJwcm9tcHRJdGVtcyIsInRhZ3MiLCJwcm9tcHRUYWdzIiwiY2F0ZWdvcmllcyIsInByb21wdENhdGVnb3J5T3B0aW9ucyIsInRvdGFsIiwidG90YWxQcm9tcHRzIiwia2V5d29yZCIsImNhdGVnb3J5IiwiaXNFcnJvciIsImVycm9yIiwiRXJyb3IiLCJ0b2dnbGVUYWciLCJ0YWciLCJpbmNsdWRlcyIsImZpbHRlciIsIml0ZW0iLCJzYXZlUHJvbXB0QXNzZXQiLCJraW5kIiwidGl0bGUiLCJjb3ZlclVybCIsInNvdXJjZSIsImRhdGEiLCJjb250ZW50IiwicHJvbXB0IiwibWV0YWRhdGEiLCJwcm9tcHRJZCIsImlkIiwiZ2l0aHViVXJsIiwic3VjY2VzcyIsImhhbmRsZUxpc3RTY3JvbGwiLCJldmVudCIsInRhcmdldCIsImN1cnJlbnRUYXJnZXQiLCJoYXNOZXh0UGFnZSIsImlzRmV0Y2hpbmdOZXh0UGFnZSIsInNjcm9sbFRvcCIsImNsaWVudEhlaWdodCIsInNjcm9sbEhlaWdodCIsImZldGNoTmV4dFBhZ2UiLCJjb3VudCIsIm1hcCIsImFjdGl2ZSIsImxlbmd0aCIsInZhbHVlIiwiaXNMb2FkaW5nIiwiUHJvbXB0RmlsdGVyIiwibGFiZWwiLCJvcHRpb25zIiwic2VsZWN0ZWQiLCJvbkNoYW5nZSIsIl9zMiIsIm9wdGlvbiIsIlByb21wdEdyaWQiLCJvbk9wZW4iLCJvbkNvcHkiLCJyZW5kZXJBY3Rpb25zIiwiZW1wdHlUZXh0Iiwic291cmNlSWQiLCJQUkVTRU5URURfSU1BR0VfU0lNUExFIiwiX2MzIiwiX2MiLCJfYzIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiaW5kZXgudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEZvbGRlclBsdXMsIFNlYXJjaCB9IGZyb20gXCJsdWNpZGUtcmVhY3RcIjtcbmltcG9ydCB7IHR5cGUgUmVhY3ROb2RlLCB0eXBlIFVJRXZlbnQsIHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IEFwcCwgQnV0dG9uLCBFbXB0eSwgSW5wdXQsIFNwaW4sIFRhZyB9IGZyb20gXCJhbnRkXCI7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gXCJyZWFjdC1pMThuZXh0XCI7XG5cbmltcG9ydCB7IFByb21wdENhcmQgfSBmcm9tIFwiQC9jb21wb25lbnRzL3Byb21wdHMvcHJvbXB0LWNhcmRcIjtcbmltcG9ydCB7IHVzZVByb21wdExpc3QgfSBmcm9tIFwiQC9jb21wb25lbnRzL3Byb21wdHMvdXNlLXByb21wdC1saXN0XCI7XG5pbXBvcnQgeyBQcm9tcHREZXRhaWxEaWFsb2cgfSBmcm9tIFwiLi9jb21wb25lbnRzL3Byb21wdC1kZXRhaWwtZGlhbG9nXCI7XG5pbXBvcnQgeyB1c2VDb3B5VGV4dCB9IGZyb20gXCJAL2hvb2tzL3VzZS1jb3B5LXRleHRcIjtcbmltcG9ydCB7IGNuIH0gZnJvbSBcIkAvbGliL3V0aWxzXCI7XG5pbXBvcnQgeyB1c2VBc3NldFN0b3JlIH0gZnJvbSBcIkAvc3RvcmVzL3VzZS1hc3NldC1zdG9yZVwiO1xuaW1wb3J0IHsgQUxMX1BST01QVFNfT1BUSU9OLCB0eXBlIFByb21wdCB9IGZyb20gXCJAL3NlcnZpY2VzL2FwaS9wcm9tcHRzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFByb21wdHNQYWdlKCkge1xuICAgIGNvbnN0IHsgbWVzc2FnZSB9ID0gQXBwLnVzZUFwcCgpO1xuICAgIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgICBjb25zdCBbdGl0bGVLZXl3b3JkLCBzZXRUaXRsZUtleXdvcmRdID0gdXNlU3RhdGUoXCJcIik7XG4gICAgY29uc3QgW3NlbGVjdGVkVGFncywgc2V0U2VsZWN0ZWRUYWdzXSA9IHVzZVN0YXRlPHN0cmluZ1tdPihbXSk7XG4gICAgY29uc3QgW3NlbGVjdGVkQ2F0ZWdvcnksIHNldFNlbGVjdGVkQ2F0ZWdvcnldID0gdXNlU3RhdGUoQUxMX1BST01QVFNfT1BUSU9OKTtcbiAgICBjb25zdCBbc2VsZWN0ZWRQcm9tcHQsIHNldFNlbGVjdGVkUHJvbXB0XSA9IHVzZVN0YXRlPFByb21wdCB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IGFkZEFzc2V0ID0gdXNlQXNzZXRTdG9yZSgoc3RhdGUpID0+IHN0YXRlLmFkZEFzc2V0KTtcbiAgICBjb25zdCBjb3B5VGV4dCA9IHVzZUNvcHlUZXh0KCk7XG4gICAgY29uc3QgeyBxdWVyeSwgaXRlbXM6IHByb21wdEl0ZW1zLCB0YWdzOiBwcm9tcHRUYWdzLCBjYXRlZ29yaWVzOiBwcm9tcHRDYXRlZ29yeU9wdGlvbnMsIHRvdGFsOiB0b3RhbFByb21wdHMgfSA9IHVzZVByb21wdExpc3QoeyBrZXl3b3JkOiB0aXRsZUtleXdvcmQsIHRhZ3M6IHNlbGVjdGVkVGFncywgY2F0ZWdvcnk6IHNlbGVjdGVkQ2F0ZWdvcnkgfSk7XG5cbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAocXVlcnkuaXNFcnJvcikgbWVzc2FnZS5lcnJvcihxdWVyeS5lcnJvciBpbnN0YW5jZW9mIEVycm9yID8gcXVlcnkuZXJyb3IubWVzc2FnZSA6IHQoXCJwcm9tcHRzLmxvYWRGYWlsZWRcIikpO1xuICAgIH0sIFttZXNzYWdlLCBxdWVyeS5lcnJvciwgcXVlcnkuaXNFcnJvciwgdF0pO1xuXG4gICAgY29uc3QgdG9nZ2xlVGFnID0gKHRhZzogc3RyaW5nKSA9PiB7XG4gICAgICAgIGlmICh0YWcgPT09IEFMTF9QUk9NUFRTX09QVElPTikgcmV0dXJuIHNldFNlbGVjdGVkVGFncyhbXSk7XG4gICAgICAgIHNldFNlbGVjdGVkVGFncygoaXRlbXMpID0+IChpdGVtcy5pbmNsdWRlcyh0YWcpID8gaXRlbXMuZmlsdGVyKChpdGVtKSA9PiBpdGVtICE9PSB0YWcpIDogWy4uLml0ZW1zLCB0YWddKSk7XG4gICAgfTtcblxuICAgIGNvbnN0IHNhdmVQcm9tcHRBc3NldCA9IChpdGVtOiBQcm9tcHQpID0+IHtcbiAgICAgICAgYWRkQXNzZXQoeyBraW5kOiBcInRleHRcIiwgdGl0bGU6IGl0ZW0udGl0bGUsIGNvdmVyVXJsOiBpdGVtLmNvdmVyVXJsLCB0YWdzOiBpdGVtLnRhZ3MsIHNvdXJjZTogaXRlbS5jYXRlZ29yeSwgZGF0YTogeyBjb250ZW50OiBpdGVtLnByb21wdCB9LCBtZXRhZGF0YTogeyBzb3VyY2U6IFwicHJvbXB0LWxpYnJhcnlcIiwgcHJvbXB0SWQ6IGl0ZW0uaWQsIGdpdGh1YlVybDogaXRlbS5naXRodWJVcmwgfSB9KTtcbiAgICAgICAgbWVzc2FnZS5zdWNjZXNzKHQoXCJjb21tb24uYWRkZWRUb0Fzc2V0c1wiKSk7XG4gICAgfTtcblxuICAgIGNvbnN0IGhhbmRsZUxpc3RTY3JvbGwgPSAoZXZlbnQ6IFVJRXZlbnQ8SFRNTERpdkVsZW1lbnQ+KSA9PiB7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XG4gICAgICAgIGlmIChxdWVyeS5oYXNOZXh0UGFnZSAmJiAhcXVlcnkuaXNGZXRjaGluZ05leHRQYWdlICYmIHRhcmdldC5zY3JvbGxUb3AgKyB0YXJnZXQuY2xpZW50SGVpZ2h0ID49IHRhcmdldC5zY3JvbGxIZWlnaHQgLSAxNjApIHZvaWQgcXVlcnkuZmV0Y2hOZXh0UGFnZSgpO1xuICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaC1mdWxsIGZsZXgtY29sIG92ZXJmbG93LWhpZGRlbiBiZy1iYWNrZ3JvdW5kIHRleHQtc3RvbmUtODAwIGRhcms6dGV4dC1zdG9uZS0xMDBcIj5cbiAgICAgICAgICAgIDxtYWluIGNsYXNzTmFtZT1cIm1pbi1oLTAgZmxleC0xIG92ZXJmbG93LXktYXV0byBiZy1iYWNrZ3JvdW5kIGJnLVtyYWRpYWwtZ3JhZGllbnQoI2U1ZTdlYl8xcHgsdHJhbnNwYXJlbnRfMXB4KV0gcHgtNCBweS02IFtiYWNrZ3JvdW5kLXNpemU6MTZweF8xNnB4XSBzbTpweC02IGxnOnB5LTggZGFyazpiZy1bcmFkaWFsLWdyYWRpZW50KHJnYmEoMjQ1LDI0NSwyNDQsLjE2KV8xcHgsdHJhbnNwYXJlbnRfMXB4KV1cIiBvblNjcm9sbD17aGFuZGxlTGlzdFNjcm9sbH0+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteC1hdXRvIG1heC13LTd4bFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDEgY2xhc3NOYW1lPVwidGV4dC0yeGwgZm9udC1zZW1pYm9sZCB0ZXh0LXN0b25lLTk1MCBkYXJrOnRleHQtc3RvbmUtMTAwXCI+e3QoXCJwcm9tcHRzLnRpdGxlXCIpfTwvaDE+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJtdC0xIHRleHQtc20gdGV4dC1zdG9uZS01MDAgZGFyazp0ZXh0LXN0b25lLTQwMFwiPnt0KFwicHJvbXB0cy50b3RhbFwiLCB7IGNvdW50OiB0b3RhbFByb21wdHMgfSl9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC01IGdyaWQgaXRlbXMtc3RhcnQgZ2FwLTUgbGc6Z3JpZC1jb2xzLVsyNDBweF9taW5tYXgoMCwxZnIpXSBsZzpnYXAtNlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGFzaWRlIGNsYXNzTmFtZT1cInRoaW4tc2Nyb2xsYmFyIG1heC1oLTcyIG92ZXJmbG93LXktYXV0byBib3JkZXItYiBib3JkZXItc3RvbmUtMjAwIHBiLTUgbGc6c3RpY2t5IGxnOnRvcC0wIGxnOm1heC1oLVtjYWxjKDEwMGR2aC02cmVtKV0gbGc6Ym9yZGVyLWItMCBsZzpib3JkZXItciBsZzpwYi04IGxnOnByLTUgZGFyazpib3JkZXItc3RvbmUtODAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFByb21wdEZpbHRlciBsYWJlbD17dChcInByb21wdHMuY2F0ZWdvcnlcIil9IG9wdGlvbnM9e3Byb21wdENhdGVnb3J5T3B0aW9uc30gc2VsZWN0ZWQ9e3NlbGVjdGVkQ2F0ZWdvcnl9IG9uQ2hhbmdlPXtzZXRTZWxlY3RlZENhdGVnb3J5fSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtNlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1iLTIgdGV4dC14cyBmb250LXNlbWlib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgdGV4dC1zdG9uZS00MDAgZGFyazp0ZXh0LXN0b25lLTUwMFwiPnt0KFwicHJvbXB0cy50YWdzXCIpfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtwcm9tcHRUYWdzLm1hcCgodGFnKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aXZlID0gdGFnID09PSBBTExfUFJPTVBUU19PUFRJT04gPyBzZWxlY3RlZFRhZ3MubGVuZ3RoID09PSAwIDogc2VsZWN0ZWRUYWdzLmluY2x1ZGVzKHRhZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxUYWcuQ2hlY2thYmxlVGFnIGtleT17dGFnfSBjaGVja2VkPXthY3RpdmV9IGNsYXNzTmFtZT17Y24oXCJwcm9tcHQtZmlsdGVyLXRhZ1wiLCBhY3RpdmUgJiYgXCJpcy1hY3RpdmVcIil9IG9uQ2hhbmdlPXsoKSA9PiB0b2dnbGVUYWcodGFnKX0+e3RhZyA9PT0gQUxMX1BST01QVFNfT1BUSU9OID8gdChcImNvbW1vbi5hbGxcIikgOiB0YWd9PC9UYWcuQ2hlY2thYmxlVGFnPjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYXNpZGU+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPElucHV0IHNpemU9XCJsYXJnZVwiIHByZWZpeD17PFNlYXJjaCBjbGFzc05hbWU9XCJzaXplLTQgdGV4dC1zdG9uZS00MDBcIiAvPn0gdmFsdWU9e3RpdGxlS2V5d29yZH0gcGxhY2Vob2xkZXI9e3QoXCJwcm9tcHRzLnNlYXJjaFwiKX0gb25DaGFuZ2U9eyhldmVudCkgPT4gc2V0VGl0bGVLZXl3b3JkKGV2ZW50LnRhcmdldC52YWx1ZSl9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3F1ZXJ5LmlzTG9hZGluZyA/IDxkaXYgY2xhc3NOYW1lPVwiZmxleCBoLTYwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiPjxTcGluIC8+PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IXF1ZXJ5LmlzTG9hZGluZyA/IDxkaXYgY2xhc3NOYW1lPVwibXQtNVwiPjxQcm9tcHRHcmlkIGl0ZW1zPXtwcm9tcHRJdGVtc30gb25PcGVuPXtzZXRTZWxlY3RlZFByb21wdH0gcmVuZGVyQWN0aW9ucz17KGl0ZW0pID0+IDxCdXR0b24gdHlwZT1cInRleHRcIiBzaXplPVwic21hbGxcIiBpY29uPXs8Rm9sZGVyUGx1cyBjbGFzc05hbWU9XCJzaXplLTMuNVwiIC8+fSBvbkNsaWNrPXsoKSA9PiBzYXZlUHJvbXB0QXNzZXQoaXRlbSl9Pnt0KFwiY29tbW9uLmFkZFRvQXNzZXRzXCIpfTwvQnV0dG9uPn0gb25Db3B5PXsoaXRlbSkgPT4gY29weVRleHQoaXRlbS5wcm9tcHQsIHQoXCJjb21tb24ucHJvbXB0Q29waWVkXCIpKX0gZW1wdHlUZXh0PXt0KFwicHJvbXB0cy5lbXB0eVwiKX0gLz48L2Rpdj4gOiBudWxsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtNiB0ZXh0LWNlbnRlciB0ZXh0LXhzIHRleHQtc3RvbmUtNTAwIGRhcms6dGV4dC1zdG9uZS00MDBcIj57cXVlcnkuaXNGZXRjaGluZ05leHRQYWdlID8gdChcInByb21wdHMubG9hZGluZ1wiKSA6IHF1ZXJ5Lmhhc05leHRQYWdlID8gdChcInByb21wdHMubG9hZE1vcmVcIikgOiBwcm9tcHRJdGVtcy5sZW5ndGggPiAwID8gdChcInByb21wdHMuZW5kXCIpIDogbnVsbH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L21haW4+XG5cbiAgICAgICAgICAgIDxQcm9tcHREZXRhaWxEaWFsb2cgcHJvbXB0PXtzZWxlY3RlZFByb21wdH0gb25DbG9zZT17KCkgPT4gc2V0U2VsZWN0ZWRQcm9tcHQobnVsbCl9IG9uQ29weT17KHByb21wdCkgPT4gY29weVRleHQocHJvbXB0LCB0KFwiY29tbW9uLnByb21wdENvcGllZFwiKSl9IG9uU2F2ZUFzc2V0PXtzYXZlUHJvbXB0QXNzZXR9IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG59XG5cbmZ1bmN0aW9uIFByb21wdEZpbHRlcih7IGxhYmVsLCBvcHRpb25zLCBzZWxlY3RlZCwgb25DaGFuZ2UgfTogeyBsYWJlbDogc3RyaW5nOyBvcHRpb25zOiBzdHJpbmdbXTsgc2VsZWN0ZWQ6IHN0cmluZzsgb25DaGFuZ2U6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkIH0pIHtcbiAgICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gICAgcmV0dXJuIDxkaXY+PGRpdiBjbGFzc05hbWU9XCJtYi0yIHRleHQteHMgZm9udC1zZW1pYm9sZCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IHRleHQtc3RvbmUtNDAwIGRhcms6dGV4dC1zdG9uZS01MDBcIj57bGFiZWx9PC9kaXY+PGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBnYXAtMS41XCI+e29wdGlvbnMubWFwKChvcHRpb24pID0+IDxUYWcuQ2hlY2thYmxlVGFnIGtleT17b3B0aW9ufSBjaGVja2VkPXtzZWxlY3RlZCA9PT0gb3B0aW9ufSBjbGFzc05hbWU9e2NuKFwicHJvbXB0LWZpbHRlci10YWdcIiwgc2VsZWN0ZWQgPT09IG9wdGlvbiAmJiBcImlzLWFjdGl2ZVwiKX0gb25DaGFuZ2U9eygpID0+IG9uQ2hhbmdlKG9wdGlvbil9PntvcHRpb24gPT09IEFMTF9QUk9NUFRTX09QVElPTiA/IHQoXCJjb21tb24uYWxsXCIpIDogb3B0aW9ufTwvVGFnLkNoZWNrYWJsZVRhZz4pfTwvZGl2PjwvZGl2Pjtcbn1cblxuZnVuY3Rpb24gUHJvbXB0R3JpZCh7IGl0ZW1zLCBvbk9wZW4sIG9uQ29weSwgcmVuZGVyQWN0aW9ucywgZW1wdHlUZXh0IH06IHsgaXRlbXM6IFByb21wdFtdOyBvbk9wZW46IChpdGVtOiBQcm9tcHQpID0+IHZvaWQ7IG9uQ29weTogKGl0ZW06IFByb21wdCkgPT4gdm9pZDsgcmVuZGVyQWN0aW9uczogKGl0ZW06IFByb21wdCkgPT4gUmVhY3ROb2RlOyBlbXB0eVRleHQ6IHN0cmluZyB9KSB7XG4gICAgcmV0dXJuIDxkaXY+PGRpdiBjbGFzc05hbWU9XCJncmlkIGdhcC00IHNtOmdyaWQtY29scy0yIHhsOmdyaWQtY29scy00XCI+e2l0ZW1zLm1hcCgoaXRlbSkgPT4gPFByb21wdENhcmQga2V5PXtgJHtpdGVtLnNvdXJjZUlkfToke2l0ZW0uaWR9YH0gaXRlbT17aXRlbX0gb25PcGVuPXsoKSA9PiBvbk9wZW4oaXRlbSl9IG9uQ29weT17KCkgPT4gb25Db3B5KGl0ZW0pfSBleHRyYUFjdGlvbj17cmVuZGVyQWN0aW9ucyhpdGVtKX0gLz4pfTwvZGl2PntpdGVtcy5sZW5ndGggPT09IDAgPyA8RW1wdHkgaW1hZ2U9e0VtcHR5LlBSRVNFTlRFRF9JTUFHRV9TSU1QTEV9IGRlc2NyaXB0aW9uPXtlbXB0eVRleHR9IGNsYXNzTmFtZT1cInB5LTE2XCIgLz4gOiBudWxsfTwvZGl2Pjtcbn1cbiJdLCJmaWxlIjoiRTovY29kZXgvbmlhbm5pYW5haS96aHVhbmh1aXl1YW5nb25nL2luZmluaXRlLWNhbnZhcy93ZWIvc3JjL3BhZ2VzL3Byb21wdHMvaW5kZXgudHN4In0=