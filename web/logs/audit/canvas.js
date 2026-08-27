import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/canvas/index.tsx");import { Fragment, jsxDEV } from "/node_modules/react/jsx-dev-runtime.js";
var _s = $RefreshSig$();
import { useEffect, useRef } from "/node_modules/react/index.js";
import { useNavigate, useSearchParams } from "/node_modules/react-router-dom/dist/index.mjs";
import { App, Button } from "/node_modules/antd/es/index.js";
import { Download, FileUp, Plus } from "/node_modules/lucide-react/dist/esm/lucide-react.mjs";
import { useTranslation } from "/node_modules/react-i18next/dist/es/index.js";
import { readZip } from "/src/lib/zip.ts";
import { setMediaBlob } from "/src/services/file-storage.ts";
import { setImageBlob } from "/src/services/image-storage.ts";
import { CanvasDeleteProjectsDialog } from "/src/components/canvas/canvas-delete-projects-dialog.tsx";
import { CanvasProjectCard } from "/src/components/canvas/canvas-project-card.tsx";
import { useCanvasStore } from "/src/stores/canvas/use-canvas-store.ts";
import { useCanvasUiStore } from "/src/stores/canvas/use-canvas-ui-store.ts";
import { exportCanvasProjects } from "/src/lib/canvas/canvas-export.ts";
import { hasAgentUrlBootstrap } from "/src/lib/agent/agent-url-bootstrap.ts";
export default function CanvasPage() {
  _s();
  const { message } = App.useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inputRef = useRef(null);
  const autoOpenRef = useRef(false);
  const hydrated = useCanvasStore((state) => state.hydrated);
  const projects = useCanvasStore((state) => state.projects);
  const createProject = useCanvasStore((state) => state.createProject);
  const importProject = useCanvasStore((state) => state.importProject);
  const selectedIds = useCanvasUiStore((state) => state.selectedProjectIds);
  const setDeleteIds = useCanvasUiStore((state) => state.setDeleteProjectIds);
  const mode = searchParams.get("mode");
  const agentMode = mode === "new" || mode === "recent" || mode === "choose";
  const agentQuery = agentMode ? `?${searchParams.toString()}` : "";
  const enterProject = (id) => {
    const agentHash = hasAgentUrlBootstrap(window.location.hash) ? window.location.hash : "";
    navigate(`/canvas/${id}${agentQuery}${agentHash}`, { replace: Boolean(agentHash) });
  };
  const createAndEnter = () => enterProject(createProject(t("canvas.defaultTitle", { count: projects.length + 1 })));
  const importCanvas = async (file) => {
    if (!file) return;
    try {
      const zip = await readZip(file);
      const projectFile = zip.get("projects.json");
      if (!projectFile) throw new Error("missing projects.json");
      const data = JSON.parse(await projectFile.text());
      await Promise.all(
        data.projects.flatMap(
          (project) => project.files.map(async (item) => {
            const blob = zip.get(item.path);
            if (!blob) return;
            const typedBlob = blob.type ? blob : blob.slice(0, blob.size, item.mimeType);
            await (item.storageKey.startsWith("image:") ? setImageBlob(item.storageKey, typedBlob) : setMediaBlob(item.storageKey, typedBlob));
          })
        )
      );
      data.projects.forEach((item) => importProject(item.project));
      message.success(t("canvas.imported", { count: data.projects.length }));
    } catch {
      message.error(t("canvas.importFailed"));
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  useEffect(() => {
    if (!hydrated || autoOpenRef.current || mode !== "new" && mode !== "recent") return;
    autoOpenRef.current = true;
    enterProject(mode === "new" ? createProject(t("canvas.defaultTitle", { count: projects.length + 1 })) : projects[0]?.id || createProject(t("canvas.defaultTitle", { count: projects.length + 1 })));
  }, [createProject, hydrated, mode, projects, t]);
  if (hydrated && (mode === "new" || mode === "recent")) return /* @__PURE__ */ jsxDEV("main", { className: "flex h-full items-center justify-center bg-background text-sm text-stone-500", children: t("canvas.opening") }, void 0, false, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
    lineNumber: 72,
    columnNumber: 65
  }, this);
  return /* @__PURE__ */ jsxDEV("main", { className: "h-full overflow-auto bg-background text-stone-950 dark:text-stone-100", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10", children: [
      /* @__PURE__ */ jsxDEV("header", { className: "flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-6 dark:border-stone-800", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-stone-500", children: t("canvas.library") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
            lineNumber: 79,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("h1", { className: "mt-3 text-3xl font-semibold", children: t("canvas.title") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
            lineNumber: 80,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
          lineNumber: 78,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
          selectedIds.length ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV(Button, { disabled: !hydrated, icon: /* @__PURE__ */ jsxDEV(Download, { className: "size-4" }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
              lineNumber: 85,
              columnNumber: 68
            }, this), onClick: () => void exportCanvasProjects(projects.filter((project) => selectedIds.includes(project.id)), `${t("canvas.title")}-${selectedIds.length}`), children: t("canvas.exportSelected") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
              lineNumber: 85,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV(Button, { disabled: !hydrated, onClick: () => setDeleteIds(selectedIds), children: t("canvas.deleteSelected") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
              lineNumber: 88,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
            lineNumber: 84,
            columnNumber: 13
          }, this) : null,
          projects.length ? /* @__PURE__ */ jsxDEV(Button, { disabled: !hydrated, onClick: () => setDeleteIds(projects.map((project) => project.id)), children: t("canvas.deleteAll") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
            lineNumber: 94,
            columnNumber: 13
          }, this) : null,
          /* @__PURE__ */ jsxDEV(Button, { disabled: !hydrated, icon: /* @__PURE__ */ jsxDEV(FileUp, { className: "size-4" }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
            lineNumber: 98,
            columnNumber: 60
          }, this), onClick: () => inputRef.current?.click(), children: t("canvas.import") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
            lineNumber: 98,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV(Button, { disabled: !hydrated, type: "primary", icon: /* @__PURE__ */ jsxDEV(Plus, { className: "size-4" }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
            lineNumber: 101,
            columnNumber: 75
          }, this), onClick: createAndEnter, children: t("canvas.create") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
            lineNumber: 101,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
          lineNumber: 82,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
        lineNumber: 77,
        columnNumber: 17
      }, this),
      !hydrated ? /* @__PURE__ */ jsxDEV("section", { className: "flex min-h-[360px] items-center justify-center border-y border-stone-200 text-sm text-stone-500 dark:border-stone-800", children: t("canvas.loading") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
        lineNumber: 108,
        columnNumber: 9
      }, this) : projects.length ? /* @__PURE__ */ jsxDEV("div", { className: "grid gap-5 sm:grid-cols-2 xl:grid-cols-3", children: projects.map(
        (project) => /* @__PURE__ */ jsxDEV(CanvasProjectCard, { project }, project.id, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
          lineNumber: 112,
          columnNumber: 11
        }, this)
      ) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
        lineNumber: 110,
        columnNumber: 9
      }, this) : /* @__PURE__ */ jsxDEV("section", { className: "flex min-h-[360px] flex-col items-center justify-center border-y border-stone-200 text-center dark:border-stone-800", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-xl font-medium", children: t("canvas.empty") }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
          lineNumber: 117,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "mt-3 text-sm text-stone-500", children: t("canvas.emptyDescription") }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
          lineNumber: 118,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV(Button, { type: "primary", className: "mt-6", icon: /* @__PURE__ */ jsxDEV(Plus, { className: "size-4" }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
          lineNumber: 119,
          columnNumber: 71
        }, this), onClick: createAndEnter, children: t("canvas.create") }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
          lineNumber: 119,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
        lineNumber: 116,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
      lineNumber: 76,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("input", { ref: inputRef, type: "file", accept: "application/zip,.zip", className: "hidden", onChange: (event) => void importCanvas(event.target.files?.[0]) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
      lineNumber: 126,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(CanvasDeleteProjectsDialog, {}, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
      lineNumber: 127,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx",
    lineNumber: 75,
    columnNumber: 5
  }, this);
}
_s(CanvasPage, "Af5LmMaglPNBkxWw4HelcSw/Hfw=", false, function() {
  return [App.useApp, useTranslation, useNavigate, useSearchParams, useCanvasStore, useCanvasStore, useCanvasStore, useCanvasStore, useCanvasUiStore, useCanvasUiStore];
});
_c = CanvasPage;
var _c;
$RefreshReg$(_c, "CanvasPage");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/index.tsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6IkFBdUVrRSxTQVl0QyxVQVpzQzs7QUF2RWxFLFNBQVNBLFdBQVdDLGNBQWM7QUFDbEMsU0FBU0MsYUFBYUMsdUJBQXVCO0FBQzdDLFNBQVNDLEtBQUtDLGNBQWM7QUFDNUIsU0FBU0MsVUFBVUMsUUFBUUMsWUFBWTtBQUN2QyxTQUFTQyxzQkFBc0I7QUFFL0IsU0FBU0MsZUFBZTtBQUN4QixTQUFTQyxvQkFBb0I7QUFDN0IsU0FBU0Msb0JBQW9CO0FBQzdCLFNBQVNDLGtDQUFrQztBQUMzQyxTQUFTQyx5QkFBeUI7QUFFbEMsU0FBU0Msc0JBQXNCO0FBQy9CLFNBQVNDLHdCQUF3QjtBQUNqQyxTQUFTQyw0QkFBNEI7QUFDckMsU0FBU0MsNEJBQTRCO0FBRXJDLHdCQUF3QkMsYUFBYTtBQUFBQyxLQUFBO0FBQ2pDLFFBQU0sRUFBRUMsUUFBUSxJQUFJakIsSUFBSWtCLE9BQU87QUFDL0IsUUFBTSxFQUFFQyxFQUFFLElBQUlkLGVBQWU7QUFDN0IsUUFBTWUsV0FBV3RCLFlBQVk7QUFDN0IsUUFBTSxDQUFDdUIsWUFBWSxJQUFJdEIsZ0JBQWdCO0FBQ3ZDLFFBQU11QixXQUFXekIsT0FBeUIsSUFBSTtBQUM5QyxRQUFNMEIsY0FBYzFCLE9BQU8sS0FBSztBQUNoQyxRQUFNMkIsV0FBV2IsZUFBZSxDQUFDYyxVQUFVQSxNQUFNRCxRQUFRO0FBQ3pELFFBQU1FLFdBQVdmLGVBQWUsQ0FBQ2MsVUFBVUEsTUFBTUMsUUFBUTtBQUN6RCxRQUFNQyxnQkFBZ0JoQixlQUFlLENBQUNjLFVBQVVBLE1BQU1FLGFBQWE7QUFDbkUsUUFBTUMsZ0JBQWdCakIsZUFBZSxDQUFDYyxVQUFVQSxNQUFNRyxhQUFhO0FBQ25FLFFBQU1DLGNBQWNqQixpQkFBaUIsQ0FBQ2EsVUFBVUEsTUFBTUssa0JBQWtCO0FBQ3hFLFFBQU1DLGVBQWVuQixpQkFBaUIsQ0FBQ2EsVUFBVUEsTUFBTU8sbUJBQW1CO0FBRTFFLFFBQU1DLE9BQU9aLGFBQWFhLElBQUksTUFBTTtBQUNwQyxRQUFNQyxZQUFZRixTQUFTLFNBQVNBLFNBQVMsWUFBWUEsU0FBUztBQUNsRSxRQUFNRyxhQUFhRCxZQUFZLElBQUlkLGFBQWFnQixTQUFTLENBQUMsS0FBSztBQUMvRCxRQUFNQyxlQUFlQSxDQUFDQyxPQUFlO0FBQ2pDLFVBQU1DLFlBQVkxQixxQkFBcUIyQixPQUFPQyxTQUFTQyxJQUFJLElBQUlGLE9BQU9DLFNBQVNDLE9BQU87QUFDdEZ2QixhQUFTLFdBQVdtQixFQUFFLEdBQUdILFVBQVUsR0FBR0ksU0FBUyxJQUFJLEVBQUVJLFNBQVNDLFFBQVFMLFNBQVMsRUFBRSxDQUFDO0FBQUEsRUFDdEY7QUFDQSxRQUFNTSxpQkFBaUJBLE1BQU1SLGFBQWFYLGNBQWNSLEVBQUUsdUJBQXVCLEVBQUU0QixPQUFPckIsU0FBU3NCLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNqSCxRQUFNQyxlQUFlLE9BQU9DLFNBQWdCO0FBQ3hDLFFBQUksQ0FBQ0EsS0FBTTtBQUNYLFFBQUk7QUFDQSxZQUFNQyxNQUFNLE1BQU03QyxRQUFRNEMsSUFBSTtBQUM5QixZQUFNRSxjQUFjRCxJQUFJakIsSUFBSSxlQUFlO0FBQzNDLFVBQUksQ0FBQ2tCLFlBQWEsT0FBTSxJQUFJQyxNQUFNLHVCQUF1QjtBQUN6RCxZQUFNQyxPQUFPQyxLQUFLQyxNQUFNLE1BQU1KLFlBQVlLLEtBQUssQ0FBQztBQUNoRCxZQUFNQyxRQUFRQztBQUFBQSxRQUNWTCxLQUFLNUIsU0FBU2tDO0FBQUFBLFVBQVEsQ0FBQ0MsWUFDbkJBLFFBQVFDLE1BQU1DLElBQUksT0FBT0MsU0FBUztBQUM5QixrQkFBTUMsT0FBT2QsSUFBSWpCLElBQUk4QixLQUFLRSxJQUFJO0FBQzlCLGdCQUFJLENBQUNELEtBQU07QUFDWCxrQkFBTUUsWUFBWUYsS0FBS0csT0FBT0gsT0FBT0EsS0FBS0ksTUFBTSxHQUFHSixLQUFLSyxNQUFNTixLQUFLTyxRQUFRO0FBQzNFLG1CQUFPUCxLQUFLUSxXQUFXQyxXQUFXLFFBQVEsSUFBSWpFLGFBQWF3RCxLQUFLUSxZQUFZTCxTQUFTLElBQUk1RCxhQUFheUQsS0FBS1EsWUFBWUwsU0FBUztBQUFBLFVBQ3BJLENBQUM7QUFBQSxRQUNMO0FBQUEsTUFDSjtBQUNBYixXQUFLNUIsU0FBU2dELFFBQVEsQ0FBQ1YsU0FBU3BDLGNBQWNvQyxLQUFLSCxPQUFPLENBQUM7QUFDM0Q1QyxjQUFRMEQsUUFBUXhELEVBQUUsbUJBQW1CLEVBQUU0QixPQUFPTyxLQUFLNUIsU0FBU3NCLE9BQU8sQ0FBQyxDQUFDO0FBQUEsSUFDekUsUUFBUTtBQUNKL0IsY0FBUTJELE1BQU16RCxFQUFFLHFCQUFxQixDQUFDO0FBQUEsSUFDMUMsVUFBQztBQUNHLFVBQUlHLFNBQVN1RCxRQUFTdkQsVUFBU3VELFFBQVFDLFFBQVE7QUFBQSxJQUNuRDtBQUFBLEVBQ0o7QUFFQWxGLFlBQVUsTUFBTTtBQUNaLFFBQUksQ0FBQzRCLFlBQVlELFlBQVlzRCxXQUFZNUMsU0FBUyxTQUFTQSxTQUFTLFNBQVc7QUFDL0VWLGdCQUFZc0QsVUFBVTtBQUN0QnZDLGlCQUFhTCxTQUFTLFFBQVFOLGNBQWNSLEVBQUUsdUJBQXVCLEVBQUU0QixPQUFPckIsU0FBU3NCLFNBQVMsRUFBRSxDQUFDLENBQUMsSUFBSXRCLFNBQVMsQ0FBQyxHQUFHYSxNQUFNWixjQUFjUixFQUFFLHVCQUF1QixFQUFFNEIsT0FBT3JCLFNBQVNzQixTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFBQSxFQUN0TSxHQUFHLENBQUNyQixlQUFlSCxVQUFVUyxNQUFNUCxVQUFVUCxDQUFDLENBQUM7QUFFL0MsTUFBSUssYUFBYVMsU0FBUyxTQUFTQSxTQUFTLFVBQVcsUUFBTyx1QkFBQyxVQUFLLFdBQVUsZ0ZBQWdGZCxZQUFFLGdCQUFnQixLQUFsSDtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQW9IO0FBRWxMLFNBQ0ksdUJBQUMsVUFBSyxXQUFVLHlFQUNaO0FBQUEsMkJBQUMsU0FBSSxXQUFVLDJEQUNYO0FBQUEsNkJBQUMsWUFBTyxXQUFVLHVHQUNkO0FBQUEsK0JBQUMsU0FDRztBQUFBLGlDQUFDLE9BQUUsV0FBVSwwQkFBMEJBLFlBQUUsZ0JBQWdCLEtBQXpEO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQTJEO0FBQUEsVUFDM0QsdUJBQUMsUUFBRyxXQUFVLCtCQUErQkEsWUFBRSxjQUFjLEtBQTdEO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQStEO0FBQUEsYUFGbkU7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQUdBO0FBQUEsUUFDQSx1QkFBQyxTQUFJLFdBQVUsMkJBQ1ZVO0FBQUFBLHNCQUFZbUIsU0FDVCxtQ0FDSTtBQUFBLG1DQUFDLFVBQU8sVUFBVSxDQUFDeEIsVUFBVSxNQUFNLHVCQUFDLFlBQVMsV0FBVSxZQUFwQjtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUE0QixHQUFLLFNBQVMsTUFBTSxLQUFLWCxxQkFBcUJhLFNBQVNxRCxPQUFPLENBQUNsQixZQUFZaEMsWUFBWW1ELFNBQVNuQixRQUFRdEIsRUFBRSxDQUFDLEdBQUcsR0FBR3BCLEVBQUUsY0FBYyxDQUFDLElBQUlVLFlBQVltQixNQUFNLEVBQUUsR0FDcE43QixZQUFFLHVCQUF1QixLQUQ5QjtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUVBO0FBQUEsWUFDQSx1QkFBQyxVQUFPLFVBQVUsQ0FBQ0ssVUFBVSxTQUFTLE1BQU1PLGFBQWFGLFdBQVcsR0FDL0RWLFlBQUUsdUJBQXVCLEtBRDlCO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBRUE7QUFBQSxlQU5KO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBT0EsSUFDQTtBQUFBLFVBQ0hPLFNBQVNzQixTQUNOLHVCQUFDLFVBQU8sVUFBVSxDQUFDeEIsVUFBVSxTQUFTLE1BQU1PLGFBQWFMLFNBQVNxQyxJQUFJLENBQUNGLFlBQVlBLFFBQVF0QixFQUFFLENBQUMsR0FDekZwQixZQUFFLGtCQUFrQixLQUR6QjtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUVBLElBQ0E7QUFBQSxVQUNKLHVCQUFDLFVBQU8sVUFBVSxDQUFDSyxVQUFVLE1BQU0sdUJBQUMsVUFBTyxXQUFVLFlBQWxCO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQTBCLEdBQUssU0FBUyxNQUFNRixTQUFTdUQsU0FBU0ksTUFBTSxHQUNwRzlELFlBQUUsZUFBZSxLQUR0QjtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUVBO0FBQUEsVUFDQSx1QkFBQyxVQUFPLFVBQVUsQ0FBQ0ssVUFBVSxNQUFLLFdBQVUsTUFBTSx1QkFBQyxRQUFLLFdBQVUsWUFBaEI7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBd0IsR0FBSyxTQUFTc0IsZ0JBQ25GM0IsWUFBRSxlQUFlLEtBRHRCO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBRUE7QUFBQSxhQXJCSjtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBc0JBO0FBQUEsV0EzQko7QUFBQTtBQUFBO0FBQUE7QUFBQSxhQTRCQTtBQUFBLE1BRUMsQ0FBQ0ssV0FDRSx1QkFBQyxhQUFRLFdBQVUseUhBQXlITCxZQUFFLGdCQUFnQixLQUE5SjtBQUFBO0FBQUE7QUFBQTtBQUFBLGFBQWdLLElBQ2hLTyxTQUFTc0IsU0FDVCx1QkFBQyxTQUFJLFdBQVUsNENBQ1Z0QixtQkFBU3FDO0FBQUFBLFFBQUksQ0FBQ0YsWUFDWCx1QkFBQyxxQkFBbUMsV0FBWkEsUUFBUXRCLElBQWhDO0FBQUE7QUFBQTtBQUFBO0FBQUEsZUFBcUQ7QUFBQSxNQUN4RCxLQUhMO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFJQSxJQUVBLHVCQUFDLGFBQVEsV0FBVSx1SEFDZjtBQUFBLCtCQUFDLFFBQUcsV0FBVSx1QkFBdUJwQixZQUFFLGNBQWMsS0FBckQ7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQUF1RDtBQUFBLFFBQ3ZELHVCQUFDLE9BQUUsV0FBVSwrQkFBK0JBLFlBQUUseUJBQXlCLEtBQXZFO0FBQUE7QUFBQTtBQUFBO0FBQUEsZUFBeUU7QUFBQSxRQUN6RSx1QkFBQyxVQUFPLE1BQUssV0FBVSxXQUFVLFFBQU8sTUFBTSx1QkFBQyxRQUFLLFdBQVUsWUFBaEI7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQUF3QixHQUFLLFNBQVMyQixnQkFDL0UzQixZQUFFLGVBQWUsS0FEdEI7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQUVBO0FBQUEsV0FMSjtBQUFBO0FBQUE7QUFBQTtBQUFBLGFBTUE7QUFBQSxTQTlDUjtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBZ0RBO0FBQUEsSUFFQSx1QkFBQyxXQUFNLEtBQUtHLFVBQVUsTUFBSyxRQUFPLFFBQU8sd0JBQXVCLFdBQVUsVUFBUyxVQUFVLENBQUM0RCxVQUFVLEtBQUtqQyxhQUFhaUMsTUFBTUMsT0FBT3JCLFFBQVEsQ0FBQyxDQUFDLEtBQWpKO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0FBbUo7QUFBQSxJQUNuSix1QkFBQyxnQ0FBRDtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBQTJCO0FBQUEsT0FwRC9CO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FxREE7QUFFUjtBQUFDOUMsR0FoSHVCRCxZQUFVO0FBQUEsVUFDVmYsSUFBSWtCLFFBQ1ZiLGdCQUNHUCxhQUNNQyxpQkFHTlksZ0JBQ0FBLGdCQUNLQSxnQkFDQUEsZ0JBQ0ZDLGtCQUNDQSxnQkFBZ0I7QUFBQTtBQUFBLEtBWmpCRztBQUFVLElBQUFxRTtBQUFBLGFBQUFBLElBQUEiLCJuYW1lcyI6WyJ1c2VFZmZlY3QiLCJ1c2VSZWYiLCJ1c2VOYXZpZ2F0ZSIsInVzZVNlYXJjaFBhcmFtcyIsIkFwcCIsIkJ1dHRvbiIsIkRvd25sb2FkIiwiRmlsZVVwIiwiUGx1cyIsInVzZVRyYW5zbGF0aW9uIiwicmVhZFppcCIsInNldE1lZGlhQmxvYiIsInNldEltYWdlQmxvYiIsIkNhbnZhc0RlbGV0ZVByb2plY3RzRGlhbG9nIiwiQ2FudmFzUHJvamVjdENhcmQiLCJ1c2VDYW52YXNTdG9yZSIsInVzZUNhbnZhc1VpU3RvcmUiLCJleHBvcnRDYW52YXNQcm9qZWN0cyIsImhhc0FnZW50VXJsQm9vdHN0cmFwIiwiQ2FudmFzUGFnZSIsIl9zIiwibWVzc2FnZSIsInVzZUFwcCIsInQiLCJuYXZpZ2F0ZSIsInNlYXJjaFBhcmFtcyIsImlucHV0UmVmIiwiYXV0b09wZW5SZWYiLCJoeWRyYXRlZCIsInN0YXRlIiwicHJvamVjdHMiLCJjcmVhdGVQcm9qZWN0IiwiaW1wb3J0UHJvamVjdCIsInNlbGVjdGVkSWRzIiwic2VsZWN0ZWRQcm9qZWN0SWRzIiwic2V0RGVsZXRlSWRzIiwic2V0RGVsZXRlUHJvamVjdElkcyIsIm1vZGUiLCJnZXQiLCJhZ2VudE1vZGUiLCJhZ2VudFF1ZXJ5IiwidG9TdHJpbmciLCJlbnRlclByb2plY3QiLCJpZCIsImFnZW50SGFzaCIsIndpbmRvdyIsImxvY2F0aW9uIiwiaGFzaCIsInJlcGxhY2UiLCJCb29sZWFuIiwiY3JlYXRlQW5kRW50ZXIiLCJjb3VudCIsImxlbmd0aCIsImltcG9ydENhbnZhcyIsImZpbGUiLCJ6aXAiLCJwcm9qZWN0RmlsZSIsIkVycm9yIiwiZGF0YSIsIkpTT04iLCJwYXJzZSIsInRleHQiLCJQcm9taXNlIiwiYWxsIiwiZmxhdE1hcCIsInByb2plY3QiLCJmaWxlcyIsIm1hcCIsIml0ZW0iLCJibG9iIiwicGF0aCIsInR5cGVkQmxvYiIsInR5cGUiLCJzbGljZSIsInNpemUiLCJtaW1lVHlwZSIsInN0b3JhZ2VLZXkiLCJzdGFydHNXaXRoIiwiZm9yRWFjaCIsInN1Y2Nlc3MiLCJlcnJvciIsImN1cnJlbnQiLCJ2YWx1ZSIsImZpbHRlciIsImluY2x1ZGVzIiwiY2xpY2siLCJldmVudCIsInRhcmdldCIsIl9jIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVJlZiB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgdXNlTmF2aWdhdGUsIHVzZVNlYXJjaFBhcmFtcyB9IGZyb20gXCJyZWFjdC1yb3V0ZXItZG9tXCI7XG5pbXBvcnQgeyBBcHAsIEJ1dHRvbiB9IGZyb20gXCJhbnRkXCI7XG5pbXBvcnQgeyBEb3dubG9hZCwgRmlsZVVwLCBQbHVzIH0gZnJvbSBcImx1Y2lkZS1yZWFjdFwiO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tIFwicmVhY3QtaTE4bmV4dFwiO1xuXG5pbXBvcnQgeyByZWFkWmlwIH0gZnJvbSBcIkAvbGliL3ppcFwiO1xuaW1wb3J0IHsgc2V0TWVkaWFCbG9iIH0gZnJvbSBcIkAvc2VydmljZXMvZmlsZS1zdG9yYWdlXCI7XG5pbXBvcnQgeyBzZXRJbWFnZUJsb2IgfSBmcm9tIFwiQC9zZXJ2aWNlcy9pbWFnZS1zdG9yYWdlXCI7XG5pbXBvcnQgeyBDYW52YXNEZWxldGVQcm9qZWN0c0RpYWxvZyB9IGZyb20gXCJAL2NvbXBvbmVudHMvY2FudmFzL2NhbnZhcy1kZWxldGUtcHJvamVjdHMtZGlhbG9nXCI7XG5pbXBvcnQgeyBDYW52YXNQcm9qZWN0Q2FyZCB9IGZyb20gXCJAL2NvbXBvbmVudHMvY2FudmFzL2NhbnZhcy1wcm9qZWN0LWNhcmRcIjtcbmltcG9ydCB0eXBlIHsgQ2FudmFzRXhwb3J0RmlsZSB9IGZyb20gXCJAL3R5cGVzL2NhbnZhcy1leHBvcnRcIjtcbmltcG9ydCB7IHVzZUNhbnZhc1N0b3JlIH0gZnJvbSBcIkAvc3RvcmVzL2NhbnZhcy91c2UtY2FudmFzLXN0b3JlXCI7XG5pbXBvcnQgeyB1c2VDYW52YXNVaVN0b3JlIH0gZnJvbSBcIkAvc3RvcmVzL2NhbnZhcy91c2UtY2FudmFzLXVpLXN0b3JlXCI7XG5pbXBvcnQgeyBleHBvcnRDYW52YXNQcm9qZWN0cyB9IGZyb20gXCJAL2xpYi9jYW52YXMvY2FudmFzLWV4cG9ydFwiO1xuaW1wb3J0IHsgaGFzQWdlbnRVcmxCb290c3RyYXAgfSBmcm9tIFwiQC9saWIvYWdlbnQvYWdlbnQtdXJsLWJvb3RzdHJhcFwiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBDYW52YXNQYWdlKCkge1xuICAgIGNvbnN0IHsgbWVzc2FnZSB9ID0gQXBwLnVzZUFwcCgpO1xuICAgIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgICBjb25zdCBuYXZpZ2F0ZSA9IHVzZU5hdmlnYXRlKCk7XG4gICAgY29uc3QgW3NlYXJjaFBhcmFtc10gPSB1c2VTZWFyY2hQYXJhbXMoKTtcbiAgICBjb25zdCBpbnB1dFJlZiA9IHVzZVJlZjxIVE1MSW5wdXRFbGVtZW50PihudWxsKTtcbiAgICBjb25zdCBhdXRvT3BlblJlZiA9IHVzZVJlZihmYWxzZSk7XG4gICAgY29uc3QgaHlkcmF0ZWQgPSB1c2VDYW52YXNTdG9yZSgoc3RhdGUpID0+IHN0YXRlLmh5ZHJhdGVkKTtcbiAgICBjb25zdCBwcm9qZWN0cyA9IHVzZUNhbnZhc1N0b3JlKChzdGF0ZSkgPT4gc3RhdGUucHJvamVjdHMpO1xuICAgIGNvbnN0IGNyZWF0ZVByb2plY3QgPSB1c2VDYW52YXNTdG9yZSgoc3RhdGUpID0+IHN0YXRlLmNyZWF0ZVByb2plY3QpO1xuICAgIGNvbnN0IGltcG9ydFByb2plY3QgPSB1c2VDYW52YXNTdG9yZSgoc3RhdGUpID0+IHN0YXRlLmltcG9ydFByb2plY3QpO1xuICAgIGNvbnN0IHNlbGVjdGVkSWRzID0gdXNlQ2FudmFzVWlTdG9yZSgoc3RhdGUpID0+IHN0YXRlLnNlbGVjdGVkUHJvamVjdElkcyk7XG4gICAgY29uc3Qgc2V0RGVsZXRlSWRzID0gdXNlQ2FudmFzVWlTdG9yZSgoc3RhdGUpID0+IHN0YXRlLnNldERlbGV0ZVByb2plY3RJZHMpO1xuXG4gICAgY29uc3QgbW9kZSA9IHNlYXJjaFBhcmFtcy5nZXQoXCJtb2RlXCIpO1xuICAgIGNvbnN0IGFnZW50TW9kZSA9IG1vZGUgPT09IFwibmV3XCIgfHwgbW9kZSA9PT0gXCJyZWNlbnRcIiB8fCBtb2RlID09PSBcImNob29zZVwiO1xuICAgIGNvbnN0IGFnZW50UXVlcnkgPSBhZ2VudE1vZGUgPyBgPyR7c2VhcmNoUGFyYW1zLnRvU3RyaW5nKCl9YCA6IFwiXCI7XG4gICAgY29uc3QgZW50ZXJQcm9qZWN0ID0gKGlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3QgYWdlbnRIYXNoID0gaGFzQWdlbnRVcmxCb290c3RyYXAod2luZG93LmxvY2F0aW9uLmhhc2gpID8gd2luZG93LmxvY2F0aW9uLmhhc2ggOiBcIlwiO1xuICAgICAgICBuYXZpZ2F0ZShgL2NhbnZhcy8ke2lkfSR7YWdlbnRRdWVyeX0ke2FnZW50SGFzaH1gLCB7IHJlcGxhY2U6IEJvb2xlYW4oYWdlbnRIYXNoKSB9KTtcbiAgICB9O1xuICAgIGNvbnN0IGNyZWF0ZUFuZEVudGVyID0gKCkgPT4gZW50ZXJQcm9qZWN0KGNyZWF0ZVByb2plY3QodChcImNhbnZhcy5kZWZhdWx0VGl0bGVcIiwgeyBjb3VudDogcHJvamVjdHMubGVuZ3RoICsgMSB9KSkpO1xuICAgIGNvbnN0IGltcG9ydENhbnZhcyA9IGFzeW5jIChmaWxlPzogRmlsZSkgPT4ge1xuICAgICAgICBpZiAoIWZpbGUpIHJldHVybjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHppcCA9IGF3YWl0IHJlYWRaaXAoZmlsZSk7XG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0RmlsZSA9IHppcC5nZXQoXCJwcm9qZWN0cy5qc29uXCIpO1xuICAgICAgICAgICAgaWYgKCFwcm9qZWN0RmlsZSkgdGhyb3cgbmV3IEVycm9yKFwibWlzc2luZyBwcm9qZWN0cy5qc29uXCIpO1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoYXdhaXQgcHJvamVjdEZpbGUudGV4dCgpKSBhcyBDYW52YXNFeHBvcnRGaWxlO1xuICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgICAgICAgICAgZGF0YS5wcm9qZWN0cy5mbGF0TWFwKChwcm9qZWN0KSA9PlxuICAgICAgICAgICAgICAgICAgICBwcm9qZWN0LmZpbGVzLm1hcChhc3luYyAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYmxvYiA9IHppcC5nZXQoaXRlbS5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYmxvYikgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdHlwZWRCbG9iID0gYmxvYi50eXBlID8gYmxvYiA6IGJsb2Iuc2xpY2UoMCwgYmxvYi5zaXplLCBpdGVtLm1pbWVUeXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IChpdGVtLnN0b3JhZ2VLZXkuc3RhcnRzV2l0aChcImltYWdlOlwiKSA/IHNldEltYWdlQmxvYihpdGVtLnN0b3JhZ2VLZXksIHR5cGVkQmxvYikgOiBzZXRNZWRpYUJsb2IoaXRlbS5zdG9yYWdlS2V5LCB0eXBlZEJsb2IpKTtcbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBkYXRhLnByb2plY3RzLmZvckVhY2goKGl0ZW0pID0+IGltcG9ydFByb2plY3QoaXRlbS5wcm9qZWN0KSk7XG4gICAgICAgICAgICBtZXNzYWdlLnN1Y2Nlc3ModChcImNhbnZhcy5pbXBvcnRlZFwiLCB7IGNvdW50OiBkYXRhLnByb2plY3RzLmxlbmd0aCB9KSk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgbWVzc2FnZS5lcnJvcih0KFwiY2FudmFzLmltcG9ydEZhaWxlZFwiKSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBpZiAoaW5wdXRSZWYuY3VycmVudCkgaW5wdXRSZWYuY3VycmVudC52YWx1ZSA9IFwiXCI7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgaWYgKCFoeWRyYXRlZCB8fCBhdXRvT3BlblJlZi5jdXJyZW50IHx8IChtb2RlICE9PSBcIm5ld1wiICYmIG1vZGUgIT09IFwicmVjZW50XCIpKSByZXR1cm47XG4gICAgICAgIGF1dG9PcGVuUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICBlbnRlclByb2plY3QobW9kZSA9PT0gXCJuZXdcIiA/IGNyZWF0ZVByb2plY3QodChcImNhbnZhcy5kZWZhdWx0VGl0bGVcIiwgeyBjb3VudDogcHJvamVjdHMubGVuZ3RoICsgMSB9KSkgOiBwcm9qZWN0c1swXT8uaWQgfHwgY3JlYXRlUHJvamVjdCh0KFwiY2FudmFzLmRlZmF1bHRUaXRsZVwiLCB7IGNvdW50OiBwcm9qZWN0cy5sZW5ndGggKyAxIH0pKSk7XG4gICAgfSwgW2NyZWF0ZVByb2plY3QsIGh5ZHJhdGVkLCBtb2RlLCBwcm9qZWN0cywgdF0pO1xuXG4gICAgaWYgKGh5ZHJhdGVkICYmIChtb2RlID09PSBcIm5ld1wiIHx8IG1vZGUgPT09IFwicmVjZW50XCIpKSByZXR1cm4gPG1haW4gY2xhc3NOYW1lPVwiZmxleCBoLWZ1bGwgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJnLWJhY2tncm91bmQgdGV4dC1zbSB0ZXh0LXN0b25lLTUwMFwiPnt0KFwiY2FudmFzLm9wZW5pbmdcIil9PC9tYWluPjtcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxtYWluIGNsYXNzTmFtZT1cImgtZnVsbCBvdmVyZmxvdy1hdXRvIGJnLWJhY2tncm91bmQgdGV4dC1zdG9uZS05NTAgZGFyazp0ZXh0LXN0b25lLTEwMFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteC1hdXRvIGZsZXggdy1mdWxsIG1heC13LTZ4bCBmbGV4LWNvbCBnYXAtOCBweC02IHB5LTEwXCI+XG4gICAgICAgICAgICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1lbmQganVzdGlmeS1iZXR3ZWVuIGdhcC00IGJvcmRlci1iIGJvcmRlci1zdG9uZS0yMDAgcGItNiBkYXJrOmJvcmRlci1zdG9uZS04MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zdG9uZS01MDBcIj57dChcImNhbnZhcy5saWJyYXJ5XCIpfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMSBjbGFzc05hbWU9XCJtdC0zIHRleHQtM3hsIGZvbnQtc2VtaWJvbGRcIj57dChcImNhbnZhcy50aXRsZVwiKX08L2gxPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3NlbGVjdGVkSWRzLmxlbmd0aCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIGRpc2FibGVkPXshaHlkcmF0ZWR9IGljb249ezxEb3dubG9hZCBjbGFzc05hbWU9XCJzaXplLTRcIiAvPn0gb25DbGljaz17KCkgPT4gdm9pZCBleHBvcnRDYW52YXNQcm9qZWN0cyhwcm9qZWN0cy5maWx0ZXIoKHByb2plY3QpID0+IHNlbGVjdGVkSWRzLmluY2x1ZGVzKHByb2plY3QuaWQpKSwgYCR7dChcImNhbnZhcy50aXRsZVwiKX0tJHtzZWxlY3RlZElkcy5sZW5ndGh9YCl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3QoXCJjYW52YXMuZXhwb3J0U2VsZWN0ZWRcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIGRpc2FibGVkPXshaHlkcmF0ZWR9IG9uQ2xpY2s9eygpID0+IHNldERlbGV0ZUlkcyhzZWxlY3RlZElkcyl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3QoXCJjYW52YXMuZGVsZXRlU2VsZWN0ZWRcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAgICB7cHJvamVjdHMubGVuZ3RoID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gZGlzYWJsZWQ9eyFoeWRyYXRlZH0gb25DbGljaz17KCkgPT4gc2V0RGVsZXRlSWRzKHByb2plY3RzLm1hcCgocHJvamVjdCkgPT4gcHJvamVjdC5pZCkpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3QoXCJjYW52YXMuZGVsZXRlQWxsXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIGRpc2FibGVkPXshaHlkcmF0ZWR9IGljb249ezxGaWxlVXAgY2xhc3NOYW1lPVwic2l6ZS00XCIgLz59IG9uQ2xpY2s9eygpID0+IGlucHV0UmVmLmN1cnJlbnQ/LmNsaWNrKCl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0KFwiY2FudmFzLmltcG9ydFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiBkaXNhYmxlZD17IWh5ZHJhdGVkfSB0eXBlPVwicHJpbWFyeVwiIGljb249ezxQbHVzIGNsYXNzTmFtZT1cInNpemUtNFwiIC8+fSBvbkNsaWNrPXtjcmVhdGVBbmRFbnRlcn0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3QoXCJjYW52YXMuY3JlYXRlXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvaGVhZGVyPlxuXG4gICAgICAgICAgICAgICAgeyFoeWRyYXRlZCA/IChcbiAgICAgICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwiZmxleCBtaW4taC1bMzYwcHhdIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBib3JkZXIteSBib3JkZXItc3RvbmUtMjAwIHRleHQtc20gdGV4dC1zdG9uZS01MDAgZGFyazpib3JkZXItc3RvbmUtODAwXCI+e3QoXCJjYW52YXMubG9hZGluZ1wiKX08L3NlY3Rpb24+XG4gICAgICAgICAgICAgICAgKSA6IHByb2plY3RzLmxlbmd0aCA/IChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdhcC01IHNtOmdyaWQtY29scy0yIHhsOmdyaWQtY29scy0zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7cHJvamVjdHMubWFwKChwcm9qZWN0KSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPENhbnZhc1Byb2plY3RDYXJkIGtleT17cHJvamVjdC5pZH0gcHJvamVjdD17cHJvamVjdH0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJmbGV4IG1pbi1oLVszNjBweF0gZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJvcmRlci15IGJvcmRlci1zdG9uZS0yMDAgdGV4dC1jZW50ZXIgZGFyazpib3JkZXItc3RvbmUtODAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LW1lZGl1bVwiPnt0KFwiY2FudmFzLmVtcHR5XCIpfTwvaDI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJtdC0zIHRleHQtc20gdGV4dC1zdG9uZS01MDBcIj57dChcImNhbnZhcy5lbXB0eURlc2NyaXB0aW9uXCIpfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gdHlwZT1cInByaW1hcnlcIiBjbGFzc05hbWU9XCJtdC02XCIgaWNvbj17PFBsdXMgY2xhc3NOYW1lPVwic2l6ZS00XCIgLz59IG9uQ2xpY2s9e2NyZWF0ZUFuZEVudGVyfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dChcImNhbnZhcy5jcmVhdGVcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGlucHV0IHJlZj17aW5wdXRSZWZ9IHR5cGU9XCJmaWxlXCIgYWNjZXB0PVwiYXBwbGljYXRpb24vemlwLC56aXBcIiBjbGFzc05hbWU9XCJoaWRkZW5cIiBvbkNoYW5nZT17KGV2ZW50KSA9PiB2b2lkIGltcG9ydENhbnZhcyhldmVudC50YXJnZXQuZmlsZXM/LlswXSl9IC8+XG4gICAgICAgICAgICA8Q2FudmFzRGVsZXRlUHJvamVjdHNEaWFsb2cgLz5cbiAgICAgICAgPC9tYWluPlxuICAgICk7XG59XG4iXSwiZmlsZSI6IkU6L2NvZGV4L25pYW5uaWFuYWkvemh1YW5odWl5dWFuZ29uZy9pbmZpbml0ZS1jYW52YXMvd2ViL3NyYy9wYWdlcy9jYW52YXMvaW5kZXgudHN4In0=