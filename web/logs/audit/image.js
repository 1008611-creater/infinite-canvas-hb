import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/image/index.tsx");import { Fragment, jsxDEV } from "/node_modules/react/jsx-dev-runtime.js";
var _s = $RefreshSig$(), _s2 = $RefreshSig$(), _s3 = $RefreshSig$(), _s4 = $RefreshSig$(), _s5 = $RefreshSig$(), _s6 = $RefreshSig$(), _s7 = $RefreshSig$();
import { ArrowLeft, ArrowRight, BookOpen, CheckSquare, ClipboardPaste, Download, FolderPlus, History, ImagePlus, LoaderCircle, PenLine, Plus, SlidersHorizontal, Sparkles, Trash2, Upload } from "/node_modules/lucide-react/dist/esm/lucide-react.mjs";
import { useEffect, useRef, useState } from "/node_modules/react/index.js";
import { App, Button, Checkbox, Drawer, Empty, Image, Input, Modal, Tag, Tooltip, Typography } from "/node_modules/antd/es/index.js";
import localforage from "/node_modules/localforage/dist/localforage.js";
import { saveAs } from "/node_modules/file-saver/dist/FileSaver.min.js";
import { useTranslation } from "/node_modules/react-i18next/dist/es/index.js";
import { ImageSettingsPanel } from "/src/components/image-settings-panel.tsx";
import { ModelPicker } from "/src/components/model-picker.tsx";
import { PromptSelectDialog } from "/src/components/prompts/prompt-select-dialog.tsx";
import { AssetPickerModal } from "/src/components/canvas/asset-picker-modal.tsx";
import { canvasThemes } from "/src/lib/canvas-theme.ts";
import { imageReferenceLabel } from "/src/lib/image-reference-prompt.ts";
import { modelOptionLabel, useConfigStore, useEffectiveConfig } from "/src/stores/use-config-store.ts";
import { useThemeStore } from "/src/stores/use-theme-store.ts";
import { nanoid } from "/node_modules/nanoid/index.browser.js";
import { formatBytes, formatDuration } from "/src/lib/image-utils.ts";
import { requestEdit, requestGeneration } from "/src/services/api/image.ts";
import { deleteStoredImages, resolveImageUrl, uploadImage } from "/src/services/image-storage.ts";
import { useAssetStore } from "/src/stores/use-asset-store.ts";
import { useWorkbenchAgentStore } from "/src/stores/use-workbench-agent-store.ts";
import i18n from "/src/i18n/index.ts";
const LOG_STORE_KEY = "infinite-canvas:image_generation_logs";
const RESULT_ACTION_BUTTON_CLASS = "min-w-0 px-1.5 [&_.ant-btn-icon]:shrink-0 [&>span:last-child]:min-w-0 [&>span:last-child]:truncate";
const logStore = localforage.createInstance({ name: "infinite-canvas", storeName: "image_generation_logs" });
export default function ImagePage() {
  _s();
  const { message } = App.useApp();
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const dragDepthRef = useRef(0);
  const config = useConfigStore((state) => state.config);
  const effectiveConfig = useEffectiveConfig();
  const updateConfig = useConfigStore((state) => state.updateConfig);
  const isAiConfigReady = useConfigStore((state) => state.isAiConfigReady);
  const openConfigDialog = useConfigStore((state) => state.openConfigDialog);
  const addAsset = useAssetStore((state) => state.addAsset);
  const [prompt, setPrompt] = useState("");
  const [references, setReferences] = useState([]);
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [selectedLogIds, setSelectedLogIds] = useState([]);
  const [previewLog, setPreviewLog] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isReferenceDragActive, setIsReferenceDragActive] = useState(false);
  const [autoRunToken, setAutoRunToken] = useState(0);
  const imageCommand = useWorkbenchAgentStore((state) => state.imageCommand);
  const clearImageCommand = useWorkbenchAgentStore((state) => state.clearImageCommand);
  const updateAgentTask = useWorkbenchAgentStore((state) => state.updateTask);
  const processedCommandRef = useRef(0);
  const agentTaskIdRef = useRef(void 0);
  const model = effectiveConfig.imageModel || effectiveConfig.model;
  const canGenerate = Boolean(prompt.trim());
  const generationCount = Math.max(1, Math.min(10, Number(config.count) || 1));
  useEffect(() => {
    if (!running || !startedAt) return;
    const timer = window.setInterval(() => setElapsedMs(performance.now() - startedAt), 1e3);
    return () => window.clearInterval(timer);
  }, [running, startedAt]);
  useEffect(() => {
    void refreshLogs();
  }, []);
  const addReferences = async (files) => {
    const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith("image/"));
    const nextReferences = await Promise.all(
      imageFiles.map(async (file) => {
        const image = await uploadImage(file);
        return { id: nanoid(), name: file.name, type: image.mimeType, dataUrl: image.url, storageKey: image.storageKey };
      })
    );
    setReferences((value) => [...value, ...nextReferences]);
  };
  const addReferencesFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      const blobs = await Promise.all(items.flatMap((item) => item.types.filter((type) => type.startsWith("image/")).map((type) => item.getType(type))));
      if (!blobs.length) {
        message.error(t("imageWorkbench.clipboardEmpty"));
        return;
      }
      const nextReferences = await Promise.all(
        blobs.map(async (blob, index) => {
          const image = await uploadImage(blob);
          return { id: nanoid(), name: `clipboard-${index + 1}.png`, type: image.mimeType, dataUrl: image.url, storageKey: image.storageKey };
        })
      );
      setReferences((value) => [...value, ...nextReferences]);
      message.success(t("imageWorkbench.clipboardAdded", { count: nextReferences.length }));
    } catch {
      message.error(t("imageWorkbench.clipboardEmpty"));
    }
  };
  const generate = async () => {
    const agentTaskId = agentTaskIdRef.current;
    agentTaskIdRef.current = void 0;
    const text = prompt.trim();
    if (!text) {
      message.error(t("imageWorkbench.promptRequired"));
      if (agentTaskId) updateAgentTask(agentTaskId, { status: "failed", error: t("imageWorkbench.promptRequired") });
      return;
    }
    if (!isAiConfigReady(effectiveConfig, model)) {
      message.warning(t("workbench.configFirst"));
      openConfigDialog(true);
      if (agentTaskId) updateAgentTask(agentTaskId, { status: "failed", error: t("imageWorkbench.configIncomplete") });
      return;
    }
    const snapshot = buildRequestSnapshot();
    if (!snapshot) {
      if (agentTaskId) updateAgentTask(agentTaskId, { status: "failed", error: t("imageWorkbench.invalidParams") });
      return;
    }
    setElapsedMs(0);
    setRunning(true);
    if (agentTaskId) updateAgentTask(agentTaskId, { status: "running", error: void 0 });
    setPreviewLog(null);
    setResults(Array.from({ length: generationCount }, () => ({ id: nanoid(), status: "pending" })));
    const batchStartedAt = performance.now();
    setStartedAt(batchStartedAt);
    const tasks = Array.from({ length: generationCount }, (_, index) => runGenerationSlot(index, snapshot));
    const result = await Promise.allSettled(tasks);
    const successImages = result.filter((item) => item.status === "fulfilled").map((item) => item.value);
    const successCount = successImages.length;
    const failCount = generationCount - successCount;
    const failed = result.find((item) => item.status === "rejected");
    const error = failed?.reason instanceof Error ? failed.reason.message : failCount ? t("workbench.generationFailed") : void 0;
    if (agentTaskId) updateAgentTask(agentTaskId, { status: successCount ? "succeeded" : "failed", successCount, failCount, error: successCount ? void 0 : error });
    try {
      saveLog(
        buildLog({
          prompt: text,
          model,
          config: { ...snapshot.config, count: String(generationCount) },
          references: snapshot.references,
          durationMs: performance.now() - batchStartedAt,
          successCount,
          failCount,
          status: successCount ? "success" : "failed",
          images: successImages
        })
      );
      successCount ? message.success(t("imageWorkbench.generated")) : message.error(failed?.reason instanceof Error ? failed.reason.message : t("workbench.generationFailed"));
    } finally {
      setRunning(false);
    }
  };
  useEffect(() => {
    if (!imageCommand || imageCommand.nonce === processedCommandRef.current) return;
    processedCommandRef.current = imageCommand.nonce;
    clearImageCommand();
    if (typeof imageCommand.prompt === "string") setPrompt(imageCommand.prompt);
    if (imageCommand.run && running) {
      if (imageCommand.taskId) updateAgentTask(imageCommand.taskId, { status: "failed", error: t("imageWorkbench.busy") });
      return;
    }
    if (imageCommand.run) {
      agentTaskIdRef.current = imageCommand.taskId;
      setAutoRunToken((value) => value + 1);
    }
  }, [imageCommand, clearImageCommand, running, updateAgentTask]);
  useEffect(() => {
    if (!autoRunToken) return;
    void generate();
  }, [autoRunToken]);
  const downloadImage = (image, index) => {
    saveAs(image.dataUrl, `image-${index + 1}.png`);
  };
  const addResultToReferences = async (image, index) => {
    const stored = await uploadImage(image.dataUrl);
    setReferences((value) => [...value, { id: nanoid(), name: `result-${index + 1}.png`, type: stored.mimeType, dataUrl: stored.url, storageKey: stored.storageKey }]);
    message.success(t("imageWorkbench.addedReference"));
  };
  const saveResultToAssets = async (image, index) => {
    const stored = await uploadImage(image.dataUrl);
    addAsset({
      kind: "image",
      title: t("imageWorkbench.resultTitle", { count: index + 1 }),
      coverUrl: stored.url,
      tags: [],
      source: t("imageWorkbench.source"),
      data: { dataUrl: stored.url, storageKey: stored.storageKey, width: stored.width, height: stored.height, bytes: stored.bytes, mimeType: stored.mimeType },
      metadata: { source: "image-page", prompt }
    });
    message.success(t("common.addedToAssets"));
  };
  const insertPickedAsset = async (payload) => {
    if (payload.kind === "text") {
      setPrompt(payload.content);
    } else if (payload.kind === "image") {
      const stored = await uploadImage(payload.dataUrl);
      setReferences((value) => [...value, { id: nanoid(), name: payload.title, type: stored.mimeType, dataUrl: stored.url, storageKey: stored.storageKey }]);
    } else {
      message.warning(t("imageWorkbench.unsupportedAsset"));
    }
    setAssetPickerOpen(false);
  };
  const createSession = () => {
    setPrompt("");
    setReferences([]);
    setResults([]);
    setElapsedMs(0);
    setStartedAt(0);
    setSelectedLogIds([]);
    setPreviewLog(null);
  };
  const deleteSelectedLogs = () => {
    const imageKeys = logs.filter((log) => selectedLogIds.includes(log.id)).flatMap((log) => log.images.map((image) => image.storageKey).filter((key) => Boolean(key)));
    void Promise.all([deleteStoredImages(imageKeys), ...selectedLogIds.map((id) => logStore.removeItem(id))]).then(refreshLogs);
    if (previewLog && selectedLogIds.includes(previewLog.id)) {
      setPreviewLog(null);
      setResults([]);
    }
    setSelectedLogIds([]);
    setDeleteConfirmOpen(false);
  };
  const saveLog = (log) => {
    void logStore.setItem(log.id, serializeLog(log)).then(refreshLogs);
  };
  const refreshLogs = async () => setLogs(await readStoredLogs());
  const previewGenerationLog = async (log) => {
    setPreviewLog(log);
    setLogsOpen(false);
    setPrompt(log.prompt);
    setReferences(log.references || []);
    if (log.config.imageModel || log.model) updateConfig("imageModel", log.config.imageModel || log.model);
    if (log.config.quality) updateConfig("quality", log.config.quality);
    if (log.config.size) updateConfig("size", log.config.size);
    if (log.config.count) updateConfig("count", log.config.count);
    setResults(log.images.map((image) => ({ id: image.id, status: "success", image })));
  };
  const buildRequestSnapshot = () => {
    const text = prompt.trim();
    if (!text) {
      message.error(t("imageWorkbench.promptRequired"));
      return null;
    }
    if (!isAiConfigReady(effectiveConfig, model)) {
      message.warning(t("workbench.configFirst"));
      openConfigDialog(true);
      return null;
    }
    return { text, config: { ...effectiveConfig, model, count: "1" }, references: [...references] };
  };
  const runGenerationSlot = async (index, snapshot) => {
    const itemStartedAt = performance.now();
    try {
      const result = snapshot.references.length ? await requestEdit(snapshot.config, snapshot.text, snapshot.references) : await requestGeneration(snapshot.config, snapshot.text);
      const image = result[0];
      if (!image) throw new Error(t("imageWorkbench.missingResult"));
      const stored = await uploadImage(image.dataUrl);
      const nextImage = { id: image.id, dataUrl: stored.url, ...stored.storageKey ? { storageKey: stored.storageKey } : {}, durationMs: performance.now() - itemStartedAt, width: stored.width, height: stored.height, bytes: stored.bytes, mimeType: stored.mimeType };
      setResults((value) => updateResultAt(value, index, { status: "success", image: nextImage }));
      return nextImage;
    } catch (error) {
      setResults((value) => updateResultAt(value, index, { status: "failed", error: error instanceof Error ? error.message : t("workbench.generationFailed") }));
      throw error;
    }
  };
  const retryResult = async (index) => {
    const snapshot = buildRequestSnapshot();
    if (!snapshot) return;
    setPreviewLog(null);
    setResults((value) => updateResultAt(value, index, { status: "pending", error: void 0, image: void 0 }));
    const retryStartedAt = performance.now();
    try {
      const image = await runGenerationSlot(index, snapshot);
      saveLog(
        buildLog({
          prompt: snapshot.text,
          model,
          config: { ...snapshot.config, count: "1" },
          references: snapshot.references,
          durationMs: performance.now() - retryStartedAt,
          successCount: 1,
          failCount: 0,
          status: "success",
          images: [image]
        })
      );
      message.success(t("workbench.retrySuccess"));
    } catch {
    }
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "flex h-full flex-col overflow-hidden bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100", children: [
    /* @__PURE__ */ jsxDEV("main", { className: "grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 lg:grid-cols-[300px_minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)]", children: [
      /* @__PURE__ */ jsxDEV("aside", { className: "thin-scrollbar hidden min-h-0 overflow-y-auto rounded-lg border border-stone-200 bg-card p-4 shadow-sm dark:border-stone-800 lg:block", children: /* @__PURE__ */ jsxDEV(
        LogPanel,
        {
          logs,
          selectedLogIds,
          activeLogId: previewLog?.id,
          onSelectedLogIdsChange: setSelectedLogIds,
          onCreateSession: createSession,
          onDeleteSelected: () => setDeleteConfirmOpen(true),
          onPreviewLog: (log) => void previewGenerationLog(log)
        },
        void 0,
        false,
        {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 368,
          columnNumber: 21
        },
        this
      ) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 367,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("section", { className: "grid gap-3 lg:min-h-0 lg:overflow-hidden xl:grid-cols-[420px_minmax(0,1fr)]", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "thin-scrollbar flex flex-col rounded-lg border border-stone-200 bg-card p-4 shadow-sm dark:border-stone-800 lg:min-h-0 lg:overflow-y-auto", children: [
          /* @__PURE__ */ jsxDEV("div", { children: /* @__PURE__ */ jsxDEV("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "min-w-0", children: /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-semibold text-stone-950 dark:text-stone-100", children: t("imageWorkbench.title") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 384,
              columnNumber: 37
            }, this) }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 383,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex shrink-0 gap-2 lg:hidden", children: [
              /* @__PURE__ */ jsxDEV(Button, { icon: /* @__PURE__ */ jsxDEV(History, { className: "size-4" }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                lineNumber: 387,
                columnNumber: 51
              }, this), onClick: () => setLogsOpen(true), children: t("workbench.logs") }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                lineNumber: 387,
                columnNumber: 37
              }, this),
              /* @__PURE__ */ jsxDEV(Button, { icon: /* @__PURE__ */ jsxDEV(SlidersHorizontal, { className: "size-4" }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                lineNumber: 390,
                columnNumber: 51
              }, this), onClick: () => setSettingsOpen(true), children: t("workbench.settings") }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                lineNumber: 390,
                columnNumber: 37
              }, this)
            ] }, void 0, true, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 386,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
            lineNumber: 382,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
            lineNumber: 381,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "mt-6 space-y-5", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { className: "mb-2 flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-base font-semibold", children: t("workbench.prompt") }, void 0, false, {
                  fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                  lineNumber: 400,
                  columnNumber: 37
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(BookOpen, { className: "size-3.5" }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                    lineNumber: 402,
                    columnNumber: 68
                  }, this), onClick: () => setPromptDialogOpen(true), children: t("workbench.viewPrompts") }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                    lineNumber: 402,
                    columnNumber: 41
                  }, this),
                  /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(FolderPlus, { className: "size-3.5" }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                    lineNumber: 405,
                    columnNumber: 68
                  }, this), onClick: () => setAssetPickerOpen(true), children: t("workbench.viewAssets") }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                    lineNumber: 405,
                    columnNumber: 41
                  }, this)
                ] }, void 0, true, {
                  fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                  lineNumber: 401,
                  columnNumber: 37
                }, this)
              ] }, void 0, true, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                lineNumber: 399,
                columnNumber: 33
              }, this),
              /* @__PURE__ */ jsxDEV(Input.TextArea, { value: prompt, onChange: (event) => setPrompt(event.target.value), rows: 7, placeholder: t("imageWorkbench.promptPlaceholder") }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                lineNumber: 410,
                columnNumber: 33
              }, this)
            ] }, void 0, true, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 398,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "mb-2 flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-base font-semibold", children: t("imageWorkbench.references") }, void 0, false, {
                  fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                  lineNumber: 415,
                  columnNumber: 37
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(ClipboardPaste, { className: "size-3.5" }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                    lineNumber: 417,
                    columnNumber: 68
                  }, this), onClick: () => void addReferencesFromClipboard(), children: t("workbench.clipboard") }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                    lineNumber: 417,
                    columnNumber: 41
                  }, this),
                  /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(Upload, { className: "size-3.5" }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                    lineNumber: 420,
                    columnNumber: 68
                  }, this), onClick: () => fileInputRef.current?.click(), children: t("workbench.upload") }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                    lineNumber: 420,
                    columnNumber: 41
                  }, this)
                ] }, void 0, true, {
                  fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                  lineNumber: 416,
                  columnNumber: 37
                }, this)
              ] }, void 0, true, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                lineNumber: 414,
                columnNumber: 33
              }, this),
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  className: `hover-scrollbar hover-scrollbar-hint relative flex min-h-24 w-full min-w-0 max-w-full gap-2 overflow-x-scroll overflow-y-hidden rounded-lg border border-dashed p-2 pb-3 overscroll-x-contain transition-colors ${isReferenceDragActive ? "border-stone-900 bg-stone-100/80 dark:border-stone-100 dark:bg-stone-900/80" : "border-stone-300 dark:border-stone-700"}`,
                  onDragEnter: (event) => {
                    event.preventDefault();
                    dragDepthRef.current += 1;
                    if (event.dataTransfer.types.includes("Files")) setIsReferenceDragActive(true);
                  },
                  onDragOver: (event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "copy";
                  },
                  onDragLeave: (event) => {
                    event.preventDefault();
                    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
                    if (!dragDepthRef.current) setIsReferenceDragActive(false);
                  },
                  onDrop: (event) => {
                    event.preventDefault();
                    dragDepthRef.current = 0;
                    setIsReferenceDragActive(false);
                    void addReferences(event.dataTransfer.files);
                  },
                  onWheel: (event) => {
                    if (event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) return;
                    event.preventDefault();
                    event.currentTarget.scrollLeft += event.deltaY;
                  },
                  children: [
                    references.map(
                      (item, index) => /* @__PURE__ */ jsxDEV("div", { className: "group relative size-20 shrink-0 overflow-hidden rounded-md border border-stone-200 dark:border-stone-800", children: [
                        /* @__PURE__ */ jsxDEV("img", { src: item.dataUrl, alt: item.name, className: "size-full object-cover" }, void 0, false, {
                          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                          lineNumber: 455,
                          columnNumber: 45
                        }, this),
                        /* @__PURE__ */ jsxDEV("span", { className: "absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white", children: imageReferenceLabel(index) }, void 0, false, {
                          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                          lineNumber: 456,
                          columnNumber: 45
                        }, this),
                        /* @__PURE__ */ jsxDEV(ReferenceOrderButtons, { index, total: references.length, onMove: (offset) => setReferences((value) => moveListItem(value, index, offset)) }, void 0, false, {
                          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                          lineNumber: 457,
                          columnNumber: 45
                        }, this),
                        /* @__PURE__ */ jsxDEV(
                          "button",
                          {
                            type: "button",
                            className: "absolute right-1 top-1 hidden size-6 items-center justify-center rounded bg-black/60 text-white group-hover:flex",
                            onClick: () => setReferences((value) => value.filter((ref) => ref.id !== item.id)),
                            "aria-label": t("imageWorkbench.removeReference"),
                            children: /* @__PURE__ */ jsxDEV(Trash2, { className: "size-3.5" }, void 0, false, {
                              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                              lineNumber: 464,
                              columnNumber: 49
                            }, this)
                          },
                          void 0,
                          false,
                          {
                            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                            lineNumber: 458,
                            columnNumber: 45
                          },
                          this
                        )
                      ] }, item.id, true, {
                        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                        lineNumber: 454,
                        columnNumber: 19
                      }, this)
                    ),
                    !references.length ? /* @__PURE__ */ jsxDEV("div", { className: "flex min-w-full items-center justify-center text-sm text-stone-500", children: isReferenceDragActive ? t("imageWorkbench.dropReferences") : t("imageWorkbench.noReferences") }, void 0, false, {
                      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                      lineNumber: 468,
                      columnNumber: 59
                    }, this) : null
                  ]
                },
                void 0,
                true,
                {
                  fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                  lineNumber: 425,
                  columnNumber: 33
                },
                this
              )
            ] }, void 0, true, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 413,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-800 dark:bg-stone-900 sm:hidden", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "truncate text-stone-500 dark:text-stone-400", children: [
                modelOptionLabel(effectiveConfig, model),
                " · ",
                effectiveConfig.size,
                " · ",
                effectiveConfig.quality
              ] }, void 0, true, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                lineNumber: 473,
                columnNumber: 33
              }, this),
              /* @__PURE__ */ jsxDEV(Button, { size: "small", type: "text", icon: /* @__PURE__ */ jsxDEV(SlidersHorizontal, { className: "size-4" }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                lineNumber: 476,
                columnNumber: 72
              }, this), onClick: () => setSettingsOpen(true), children: t("workbench.adjust") }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                lineNumber: 476,
                columnNumber: 33
              }, this)
            ] }, void 0, true, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 472,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "hidden gap-4 sm:grid sm:grid-cols-2", children: /* @__PURE__ */ jsxDEV(GenerationSettings, { config: effectiveConfig, model, updateConfig, openConfigDialog }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 482,
              columnNumber: 33
            }, this) }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 481,
              columnNumber: 29
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
            lineNumber: 397,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "mt-auto pt-6", children: /* @__PURE__ */ jsxDEV(Button, { type: "primary", size: "large", block: true, icon: /* @__PURE__ */ jsxDEV(Sparkles, { className: "size-4" }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
            lineNumber: 487,
            columnNumber: 77
          }, this), loading: running, disabled: !canGenerate || running, onClick: () => void generate(), children: t("workbench.generate") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
            lineNumber: 487,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
            lineNumber: 486,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 380,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "thin-scrollbar rounded-lg border border-stone-200 bg-card p-4 shadow-sm dark:border-stone-800 lg:min-h-0 lg:overflow-y-auto lg:p-5", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "mb-4 flex items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxDEV("div", { children: /* @__PURE__ */ jsxDEV("h2", { className: "text-xl font-semibold", children: t("workbench.results") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 496,
              columnNumber: 33
            }, this) }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 495,
              columnNumber: 29
            }, this),
            running ? /* @__PURE__ */ jsxDEV(Tag, { className: "m-0 px-2 py-1", children: t("workbench.waiting", { time: formatDuration(elapsedMs) }) }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 498,
              columnNumber: 40
            }, this) : null
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
            lineNumber: 494,
            columnNumber: 25
          }, this),
          results.length ? /* @__PURE__ */ jsxDEV("div", { className: "grid gap-4 sm:grid-cols-2 2xl:grid-cols-3", children: results.map(
            (result, index) => result.status === "success" && result.image ? /* @__PURE__ */ jsxDEV(ResultImageCard, { image: result.image, index, onEdit: addResultToReferences, onDownload: downloadImage, onSaveAsset: saveResultToAssets }, result.id, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 504,
              columnNumber: 15
            }, this) : result.status === "failed" ? /* @__PURE__ */ jsxDEV(FailedImageCard, { error: result.error || t("workbench.generationFailed"), onRetry: () => retryResult(index) }, result.id, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 506,
              columnNumber: 15
            }, this) : /* @__PURE__ */ jsxDEV(PendingImageCard, {}, result.id, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 508,
              columnNumber: 15
            }, this)
          ) }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
            lineNumber: 501,
            columnNumber: 13
          }, this) : /* @__PURE__ */ jsxDEV("div", { className: "flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 text-center dark:border-stone-700 lg:min-h-[560px]", children: [
            /* @__PURE__ */ jsxDEV(ImagePlus, { className: "mb-4 size-11 text-stone-400" }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 514,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE, description: t("imageWorkbench.empty") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 515,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
            lineNumber: 513,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 493,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 379,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 366,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(
      "input",
      {
        ref: fileInputRef,
        type: "file",
        accept: "image/*",
        multiple: true,
        className: "hidden",
        onChange: (event) => {
          void addReferences(event.target.files);
          event.target.value = "";
        }
      },
      void 0,
      false,
      {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 521,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(Drawer, { title: t("workbench.logs"), placement: "bottom", size: "large", open: logsOpen, onClose: () => setLogsOpen(false), children: /* @__PURE__ */ jsxDEV(
      LogPanel,
      {
        logs,
        selectedLogIds,
        activeLogId: previewLog?.id,
        onSelectedLogIdsChange: setSelectedLogIds,
        onCreateSession: createSession,
        onDeleteSelected: () => setDeleteConfirmOpen(true),
        onPreviewLog: (log) => void previewGenerationLog(log)
      },
      void 0,
      false,
      {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 533,
        columnNumber: 17
      },
      this
    ) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 532,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(Drawer, { title: t("workbench.settings"), placement: "bottom", size: "82vh", open: settingsOpen, onClose: () => setSettingsOpen(false), children: /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-3 pb-4", children: /* @__PURE__ */ jsxDEV(GenerationSettings, { config: effectiveConfig, model, updateConfig, openConfigDialog }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 545,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 544,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 543,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(PromptSelectDialog, { open: promptDialogOpen, onOpenChange: setPromptDialogOpen, onSelect: setPrompt }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 548,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(AssetPickerModal, { open: assetPickerOpen, defaultTab: "my-assets", onInsert: (payload) => void insertPickedAsset(payload), onClose: () => setAssetPickerOpen(false) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 549,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(Modal, { title: t("workbench.deleteLogs"), open: deleteConfirmOpen, onCancel: () => setDeleteConfirmOpen(false), onOk: deleteSelectedLogs, okText: t("common.delete"), okButtonProps: { danger: true }, cancelText: t("common.cancel"), children: t("workbench.deleteLogsConfirm", { count: selectedLogIds.length }) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 550,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
    lineNumber: 365,
    columnNumber: 5
  }, this);
}
_s(ImagePage, "Axe7VjutFZw+yGNHYS0YltISsQo=", false, function() {
  return [App.useApp, useTranslation, useConfigStore, useEffectiveConfig, useConfigStore, useConfigStore, useConfigStore, useAssetStore, useWorkbenchAgentStore, useWorkbenchAgentStore, useWorkbenchAgentStore];
});
_c = ImagePage;
function GenerationSettings({ config, model, updateConfig, openConfigDialog }) {
  _s2();
  const theme = canvasThemes[useThemeStore((state) => state.theme)];
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("label", { className: "col-span-2 block min-w-0 sm:col-span-1", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "mb-1.5 block text-sm font-semibold sm:mb-2 sm:text-base", children: t("workbench.model") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 564,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(ModelPicker, { config, value: model, onChange: (value) => updateConfig("imageModel", value), capability: "image", fullWidth: true, onMissingConfig: () => openConfigDialog(false) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 565,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 563,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "col-span-2", children: /* @__PURE__ */ jsxDEV(ImageSettingsPanel, { config, onConfigChange: (key, value) => updateConfig(key, value), theme, showTitle: false, className: "space-y-4", maxCount: 10 }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 568,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 567,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
    lineNumber: 562,
    columnNumber: 5
  }, this);
}
_s2(GenerationSettings, "iJIaOj/6JHJYKQ0OzJb+lER2vC0=", false, function() {
  return [useThemeStore, useTranslation];
});
_c2 = GenerationSettings;
function ResultImageCard({
  image,
  index,
  onEdit,
  onDownload,
  onSaveAsset
}) {
  _s3();
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxDEV("div", { className: "overflow-hidden rounded-lg border border-stone-200 bg-background dark:border-stone-800", children: [
    /* @__PURE__ */ jsxDEV(Image, { src: image.dataUrl, alt: t("imageWorkbench.resultAlt", { count: index + 1 }), className: "aspect-square object-cover" }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 590,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "space-y-2 border-t border-stone-200 px-3 py-2.5 dark:border-stone-800", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex min-w-0 gap-x-2 gap-y-1 text-xs text-stone-500 dark:text-stone-400", children: [
        /* @__PURE__ */ jsxDEV("span", { children: [
          image.width,
          "x",
          image.height
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 593,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: formatBytes(image.bytes) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 596,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: formatDuration(image.durationMs) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 597,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 592,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "grid min-w-0 grid-cols-3 gap-2", children: [
        /* @__PURE__ */ jsxDEV(Tooltip, { title: t("common.addToAssets"), children: /* @__PURE__ */ jsxDEV(Button, { className: RESULT_ACTION_BUTTON_CLASS, size: "small", icon: /* @__PURE__ */ jsxDEV(FolderPlus, { className: "size-3.5" }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 601,
          columnNumber: 91
        }, this), onClick: () => void onSaveAsset(image, index), children: t("common.addToAssets") }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 601,
          columnNumber: 25
        }, this) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 600,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV(Tooltip, { title: t("imageWorkbench.addReference"), children: /* @__PURE__ */ jsxDEV(Button, { className: RESULT_ACTION_BUTTON_CLASS, size: "small", icon: /* @__PURE__ */ jsxDEV(PenLine, { className: "size-3.5" }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 606,
          columnNumber: 91
        }, this), onClick: () => void onEdit(image, index), children: t("imageWorkbench.addReference") }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 606,
          columnNumber: 25
        }, this) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 605,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV(Tooltip, { title: t("common.download"), children: /* @__PURE__ */ jsxDEV(Button, { className: RESULT_ACTION_BUTTON_CLASS, size: "small", icon: /* @__PURE__ */ jsxDEV(Download, { className: "size-3.5" }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 611,
          columnNumber: 91
        }, this), onClick: () => onDownload(image, index), children: t("common.download") }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 611,
          columnNumber: 25
        }, this) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 610,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 599,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 591,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
    lineNumber: 589,
    columnNumber: 5
  }, this);
}
_s3(ResultImageCard, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
  return [useTranslation];
});
_c3 = ResultImageCard;
function PendingImageCard() {
  _s4();
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxDEV("div", { className: "relative aspect-square overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-50 dark:border-stone-700 dark:bg-stone-900", children: [
    /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: "absolute inset-0 opacity-60",
        style: {
          backgroundImage: "radial-gradient(circle, rgba(120,113,108,0.35) 1.4px, transparent 1.6px)",
          backgroundSize: "16px 16px"
        }
      },
      void 0,
      false,
      {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 625,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-stone-500 dark:text-stone-400", children: [
      /* @__PURE__ */ jsxDEV(LoaderCircle, { className: "size-6 animate-spin" }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 633,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("span", { children: t("workbench.generating") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 634,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 632,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
    lineNumber: 624,
    columnNumber: 5
  }, this);
}
_s4(PendingImageCard, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
  return [useTranslation];
});
_c4 = PendingImageCard;
function FailedImageCard({ error, onRetry }) {
  _s5();
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxDEV("div", { className: "overflow-hidden rounded-lg border border-red-200 bg-red-50 dark:border-red-950 dark:bg-red-950/20", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex aspect-square flex-col items-center justify-center gap-3 p-5 text-center", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-medium text-red-600 dark:text-red-300", children: t("workbench.failed") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 645,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(Typography.Paragraph, { ellipsis: { rows: 4 }, className: "!mb-0 !text-xs !text-red-500 dark:!text-red-300", children: error }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 646,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 644,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex justify-end border-t border-red-200 p-3 dark:border-red-950", children: /* @__PURE__ */ jsxDEV(Button, { size: "small", danger: true, onClick: onRetry, children: t("workbench.retry") }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 651,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 650,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
    lineNumber: 643,
    columnNumber: 5
  }, this);
}
_s5(FailedImageCard, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
  return [useTranslation];
});
_c5 = FailedImageCard;
function updateResultAt(results, index, next) {
  return results.map((item, itemIndex) => itemIndex === index ? { ...item, ...next } : item);
}
function LogPanel({
  logs,
  selectedLogIds,
  activeLogId,
  onSelectedLogIdsChange,
  onCreateSession,
  onDeleteSelected,
  onPreviewLog
}) {
  _s6();
  const { t } = useTranslation();
  const allSelected = Boolean(logs.length) && selectedLogIds.length === logs.length;
  const toggleAll = () => onSelectedLogIdsChange(allSelected ? [] : logs.map((log) => log.id));
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("div", { className: "mb-3 flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxDEV("div", { children: /* @__PURE__ */ jsxDEV("h2", { className: "text-base font-semibold", children: t("workbench.logs") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 688,
        columnNumber: 21
      }, this) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 687,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(Tag, { className: "m-0", children: logs.length }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 690,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 686,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "mb-4 flex flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(Plus, { className: "size-3.5" }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 693,
        columnNumber: 44
      }, this), onClick: onCreateSession, children: t("workbench.new") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 693,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(CheckSquare, { className: "size-3.5" }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 696,
        columnNumber: 44
      }, this), disabled: !logs.length, onClick: toggleAll, children: allSelected ? t("common.cancel") : t("workbench.selectAll") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 696,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(Button, { size: "small", danger: true, icon: /* @__PURE__ */ jsxDEV(Trash2, { className: "size-3.5" }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 699,
        columnNumber: 51
      }, this), disabled: !selectedLogIds.length, onClick: onDeleteSelected, children: t("common.delete") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 699,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 692,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
      logs.map(
        (log) => /* @__PURE__ */ jsxDEV(
          LogCard,
          {
            log,
            selected: selectedLogIds.includes(log.id),
            active: activeLogId === log.id,
            onSelectedChange: (checked) => onSelectedLogIdsChange(checked ? [...selectedLogIds, log.id] : selectedLogIds.filter((id) => id !== log.id)),
            onClick: () => onPreviewLog(log)
          },
          log.id,
          false,
          {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
            lineNumber: 705,
            columnNumber: 9
          },
          this
        )
      ),
      !logs.length ? /* @__PURE__ */ jsxDEV("div", { className: "flex min-h-48 items-center justify-center rounded-lg border border-dashed border-stone-300 text-center text-sm text-stone-500 dark:border-stone-700", children: t("workbench.noLogs") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 714,
        columnNumber: 33
      }, this) : null
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 703,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
    lineNumber: 685,
    columnNumber: 5
  }, this);
}
_s6(LogPanel, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
  return [useTranslation];
});
_c6 = LogPanel;
function LogCard({ log, selected, active, onSelectedChange, onClick }) {
  _s7();
  const { t } = useTranslation();
  const thumbnails = (log.thumbnails || []).filter(Boolean).slice(0, 4);
  return /* @__PURE__ */ jsxDEV(
    "button",
    {
      type: "button",
      className: `block w-full rounded-lg border p-2 text-left transition ${active ? "border-stone-900 bg-blue-50 dark:border-stone-100 dark:bg-blue-950/20" : "border-stone-200 bg-background hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-900"}`,
      onClick,
      children: /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-[minmax(128px,1fr)_auto] gap-2", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-2", children: [
          /* @__PURE__ */ jsxDEV(Checkbox, { className: "mt-0.5", checked: selected, onClick: (event) => event.stopPropagation(), onChange: (event) => onSelectedChange(event.target.checked) }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
            lineNumber: 732,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "truncate text-sm font-semibold leading-5", children: log.title }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 734,
              columnNumber: 25
            }, this),
            thumbnails.length ? /* @__PURE__ */ jsxDEV("div", { className: "mt-2 flex gap-1 overflow-hidden", children: thumbnails.map(
              (image, index) => /* @__PURE__ */ jsxDEV("img", { src: image, alt: "", className: "size-8 shrink-0 rounded-md object-cover" }, `${log.id}-${index}`, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
                lineNumber: 738,
                columnNumber: 15
              }, this)
            ) }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 736,
              columnNumber: 13
            }, this) : null
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
            lineNumber: 733,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 731,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "grid justify-items-end gap-2", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsxDEV(Tag, { className: "m-0 flex h-6 items-center rounded-md px-1.5 text-xs leading-none", color: "blue", children: t("workbench.successCount", { count: log.successCount ?? log.imageCount }) }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 746,
              columnNumber: 25
            }, this),
            log.failCount ? /* @__PURE__ */ jsxDEV(Tag, { className: "m-0 flex h-6 items-center rounded-md px-1.5 text-xs leading-none", color: "red", children: t("workbench.failCount", { count: log.failCount }) }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 750,
              columnNumber: 13
            }, this) : null
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
            lineNumber: 745,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap justify-end gap-1", children: [
            /* @__PURE__ */ jsxDEV(Tag, { className: "m-0 flex h-6 items-center rounded-md px-1.5 text-xs leading-none", children: t("workbench.itemCount", { count: log.imageCount }) }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 756,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV(Tag, { className: "m-0 flex h-6 items-center rounded-md px-1.5 text-xs leading-none", color: "green", children: formatDuration(log.durationMs) }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
              lineNumber: 757,
              columnNumber: 25
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
            lineNumber: 755,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxDEV(Tag, { className: "m-0 flex h-6 items-center rounded-md px-1.5 text-xs leading-none", children: log.time }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
            lineNumber: 762,
            columnNumber: 25
          }, this) }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
            lineNumber: 761,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
          lineNumber: 744,
          columnNumber: 17
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
        lineNumber: 730,
        columnNumber: 13
      }, this)
    },
    void 0,
    false,
    {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 725,
      columnNumber: 5
    },
    this
  );
}
_s7(LogCard, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
  return [useTranslation];
});
_c7 = LogCard;
async function readStoredLogs() {
  if (typeof window === "undefined") return [];
  try {
    const values = [];
    await logStore.iterate((value) => {
      values.push(value);
    });
    const logs = await Promise.all(values.map(normalizeLog));
    return logs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch {
    return [];
  }
}
async function normalizeLog(log) {
  const references = await Promise.all(
    (log.references || []).map(async (item) => ({
      ...item,
      dataUrl: await resolveImageUrl(item.storageKey, item.dataUrl)
    }))
  );
  const images = await Promise.all(
    (log.images || []).map(async (item) => ({
      ...item,
      dataUrl: await resolveImageUrl(item.storageKey, item.dataUrl)
    }))
  );
  const config = normalizeLogConfig(log);
  return {
    id: log.id || nanoid(),
    createdAt: log.createdAt || Date.now(),
    title: log.title || log.model || i18n.t("workbench.untitled"),
    prompt: log.prompt || log.title || "",
    time: log.time || (/* @__PURE__ */ new Date()).toLocaleString(i18n.resolvedLanguage, { hour12: false }),
    model: log.model || config.imageModel || "",
    config,
    references,
    durationMs: log.durationMs || 0,
    successCount: log.successCount ?? log.imageCount ?? 0,
    failCount: log.failCount || 0,
    imageCount: log.imageCount || log.successCount || 0,
    size: log.size || config.size || "",
    quality: log.quality || config.quality || "",
    status: log.status || "success",
    images,
    thumbnails: images.map((image) => image.dataUrl).filter(Boolean)
  };
}
function serializeLog(log) {
  return {
    ...log,
    references: log.references.map((item) => ({ ...item, dataUrl: item.storageKey ? "" : item.dataUrl })),
    images: log.images.map((image) => ({ ...image, dataUrl: image.storageKey ? "" : image.dataUrl })),
    thumbnails: []
  };
}
function normalizeLogConfig(log) {
  return {
    model: log.config?.model || log.model || "",
    imageModel: log.config?.imageModel || log.model || "",
    quality: log.config?.quality || log.quality || "",
    size: log.config?.size || log.size || "",
    count: log.config?.count || String(log.imageCount || log.successCount || 1)
  };
}
function moveListItem(items, index, offset) {
  const targetIndex = index + offset;
  if (targetIndex < 0 || targetIndex >= items.length) return items;
  const next = [...items];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}
function ReferenceOrderButtons({ index, total, onMove }) {
  if (total <= 1) return null;
  return /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-x-1 bottom-1 flex justify-between", children: [
    /* @__PURE__ */ jsxDEV(Button, { size: "small", className: "!h-6 !w-6 !min-w-6 !rounded-full !bg-white/85 !p-0 !shadow-sm", icon: /* @__PURE__ */ jsxDEV(ArrowLeft, { className: "size-3" }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 850,
      columnNumber: 114
    }, this), disabled: index <= 0, onClick: () => onMove(-1) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 850,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(Button, { size: "small", className: "!h-6 !w-6 !min-w-6 !rounded-full !bg-white/85 !p-0 !shadow-sm", icon: /* @__PURE__ */ jsxDEV(ArrowRight, { className: "size-3" }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 851,
      columnNumber: 114
    }, this), disabled: index >= total - 1, onClick: () => onMove(1) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
      lineNumber: 851,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx",
    lineNumber: 849,
    columnNumber: 5
  }, this);
}
_c8 = ReferenceOrderButtons;
function buildLog({
  prompt,
  model,
  config,
  references,
  durationMs,
  successCount,
  failCount,
  status,
  images
}) {
  const logConfig = {
    model: config.model,
    imageModel: config.imageModel,
    quality: config.quality,
    size: config.size,
    count: config.count
  };
  return {
    id: nanoid(),
    createdAt: Date.now(),
    title: prompt.slice(0, 12) || i18n.t("workbench.untitled"),
    prompt,
    time: (/* @__PURE__ */ new Date()).toLocaleString(i18n.resolvedLanguage, { hour12: false }),
    model,
    config: logConfig,
    references,
    durationMs,
    successCount,
    failCount,
    imageCount: Number(logConfig.count) || successCount,
    size: logConfig.size,
    quality: logConfig.quality,
    status,
    images,
    thumbnails: images.map((image) => image.dataUrl).filter(Boolean)
  };
}
var _c, _c2, _c3, _c4, _c5, _c6, _c7, _c8;
$RefreshReg$(_c, "ImagePage");
$RefreshReg$(_c2, "GenerationSettings");
$RefreshReg$(_c3, "ResultImageCard");
$RefreshReg$(_c4, "PendingImageCard");
$RefreshReg$(_c5, "FailedImageCard");
$RefreshReg$(_c6, "LogPanel");
$RefreshReg$(_c7, "LogCard");
$RefreshReg$(_c8, "ReferenceOrderButtons");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/image/index.tsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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QUFDLEtBQUE7QUFBQSxhQUFBQyxLQUFBO0FBQUEsYUFBQUMsS0FBQTtBQUFBLGFBQUFDLEtBQUE7QUFBQSxhQUFBQyxLQUFBO0FBQUEsYUFBQVIsS0FBQSIsIm5hbWVzIjpbIkFycm93TGVmdCIsIkFycm93UmlnaHQiLCJCb29rT3BlbiIsIkNoZWNrU3F1YXJlIiwiQ2xpcGJvYXJkUGFzdGUiLCJEb3dubG9hZCIsIkZvbGRlclBsdXMiLCJIaXN0b3J5IiwiSW1hZ2VQbHVzIiwiTG9hZGVyQ2lyY2xlIiwiUGVuTGluZSIsIlBsdXMiLCJTbGlkZXJzSG9yaXpvbnRhbCIsIlNwYXJrbGVzIiwiVHJhc2gyIiwiVXBsb2FkIiwidXNlRWZmZWN0IiwidXNlUmVmIiwidXNlU3RhdGUiLCJBcHAiLCJCdXR0b24iLCJDaGVja2JveCIsIkRyYXdlciIsIkVtcHR5IiwiSW1hZ2UiLCJJbnB1dCIsIk1vZGFsIiwiVGFnIiwiVG9vbHRpcCIsIlR5cG9ncmFwaHkiLCJsb2NhbGZvcmFnZSIsInNhdmVBcyIsInVzZVRyYW5zbGF0aW9uIiwiSW1hZ2VTZXR0aW5nc1BhbmVsIiwiTW9kZWxQaWNrZXIiLCJQcm9tcHRTZWxlY3REaWFsb2ciLCJBc3NldFBpY2tlck1vZGFsIiwiY2FudmFzVGhlbWVzIiwiaW1hZ2VSZWZlcmVuY2VMYWJlbCIsIm1vZGVsT3B0aW9uTGFiZWwiLCJ1c2VDb25maWdTdG9yZSIsInVzZUVmZmVjdGl2ZUNvbmZpZyIsInVzZVRoZW1lU3RvcmUiLCJuYW5vaWQiLCJmb3JtYXRCeXRlcyIsImZvcm1hdER1cmF0aW9uIiwicmVxdWVzdEVkaXQiLCJyZXF1ZXN0R2VuZXJhdGlvbiIsImRlbGV0ZVN0b3JlZEltYWdlcyIsInJlc29sdmVJbWFnZVVybCIsInVwbG9hZEltYWdlIiwidXNlQXNzZXRTdG9yZSIsInVzZVdvcmtiZW5jaEFnZW50U3RvcmUiLCJpMThuIiwiTE9HX1NUT1JFX0tFWSIsIlJFU1VMVF9BQ1RJT05fQlVUVE9OX0NMQVNTIiwibG9nU3RvcmUiLCJjcmVhdGVJbnN0YW5jZSIsIm5hbWUiLCJzdG9yZU5hbWUiLCJJbWFnZVBhZ2UiLCJfcyIsIm1lc3NhZ2UiLCJ1c2VBcHAiLCJ0IiwiZmlsZUlucHV0UmVmIiwiZHJhZ0RlcHRoUmVmIiwiY29uZmlnIiwic3RhdGUiLCJlZmZlY3RpdmVDb25maWciLCJ1cGRhdGVDb25maWciLCJpc0FpQ29uZmlnUmVhZHkiLCJvcGVuQ29uZmlnRGlhbG9nIiwiYWRkQXNzZXQiLCJwcm9tcHQiLCJzZXRQcm9tcHQiLCJyZWZlcmVuY2VzIiwic2V0UmVmZXJlbmNlcyIsInJlc3VsdHMiLCJzZXRSZXN1bHRzIiwibG9ncyIsInNldExvZ3MiLCJydW5uaW5nIiwic2V0UnVubmluZyIsImxvZ3NPcGVuIiwic2V0TG9nc09wZW4iLCJzZXR0aW5nc09wZW4iLCJzZXRTZXR0aW5nc09wZW4iLCJwcm9tcHREaWFsb2dPcGVuIiwic2V0UHJvbXB0RGlhbG9nT3BlbiIsImFzc2V0UGlja2VyT3BlbiIsInNldEFzc2V0UGlja2VyT3BlbiIsInN0YXJ0ZWRBdCIsInNldFN0YXJ0ZWRBdCIsImVsYXBzZWRNcyIsInNldEVsYXBzZWRNcyIsInNlbGVjdGVkTG9nSWRzIiwic2V0U2VsZWN0ZWRMb2dJZHMiLCJwcmV2aWV3TG9nIiwic2V0UHJldmlld0xvZyIsImRlbGV0ZUNvbmZpcm1PcGVuIiwic2V0RGVsZXRlQ29uZmlybU9wZW4iLCJpc1JlZmVyZW5jZURyYWdBY3RpdmUiLCJzZXRJc1JlZmVyZW5jZURyYWdBY3RpdmUiLCJhdXRvUnVuVG9rZW4iLCJzZXRBdXRvUnVuVG9rZW4iLCJpbWFnZUNvbW1hbmQiLCJjbGVhckltYWdlQ29tbWFuZCIsInVwZGF0ZUFnZW50VGFzayIsInVwZGF0ZVRhc2siLCJwcm9jZXNzZWRDb21tYW5kUmVmIiwiYWdlbnRUYXNrSWRSZWYiLCJ1bmRlZmluZWQiLCJtb2RlbCIsImltYWdlTW9kZWwiLCJjYW5HZW5lcmF0ZSIsIkJvb2xlYW4iLCJ0cmltIiwiZ2VuZXJhdGlvbkNvdW50IiwiTWF0aCIsIm1heCIsIm1pbiIsIk51bWJlciIsImNvdW50IiwidGltZXIiLCJ3aW5kb3ciLCJzZXRJbnRlcnZhbCIsInBlcmZvcm1hbmNlIiwibm93IiwiY2xlYXJJbnRlcnZhbCIsInJlZnJlc2hMb2dzIiwiYWRkUmVmZXJlbmNlcyIsImZpbGVzIiwiaW1hZ2VGaWxlcyIsIkFycmF5IiwiZnJvbSIsImZpbHRlciIsImZpbGUiLCJ0eXBlIiwic3RhcnRzV2l0aCIsIm5leHRSZWZlcmVuY2VzIiwiUHJvbWlzZSIsImFsbCIsIm1hcCIsImltYWdlIiwiaWQiLCJtaW1lVHlwZSIsImRhdGFVcmwiLCJ1cmwiLCJzdG9yYWdlS2V5IiwidmFsdWUiLCJhZGRSZWZlcmVuY2VzRnJvbUNsaXBib2FyZCIsIml0ZW1zIiwibmF2aWdhdG9yIiwiY2xpcGJvYXJkIiwicmVhZCIsImJsb2JzIiwiZmxhdE1hcCIsIml0ZW0iLCJ0eXBlcyIsImdldFR5cGUiLCJsZW5ndGgiLCJlcnJvciIsImJsb2IiLCJpbmRleCIsInN1Y2Nlc3MiLCJnZW5lcmF0ZSIsImFnZW50VGFza0lkIiwiY3VycmVudCIsInRleHQiLCJzdGF0dXMiLCJ3YXJuaW5nIiwic25hcHNob3QiLCJidWlsZFJlcXVlc3RTbmFwc2hvdCIsImJhdGNoU3RhcnRlZEF0IiwidGFza3MiLCJfIiwicnVuR2VuZXJhdGlvblNsb3QiLCJyZXN1bHQiLCJhbGxTZXR0bGVkIiwic3VjY2Vzc0ltYWdlcyIsInN1Y2Nlc3NDb3VudCIsImZhaWxDb3VudCIsImZhaWxlZCIsImZpbmQiLCJyZWFzb24iLCJFcnJvciIsInNhdmVMb2ciLCJidWlsZExvZyIsIlN0cmluZyIsImR1cmF0aW9uTXMiLCJpbWFnZXMiLCJub25jZSIsInJ1biIsInRhc2tJZCIsImRvd25sb2FkSW1hZ2UiLCJhZGRSZXN1bHRUb1JlZmVyZW5jZXMiLCJzdG9yZWQiLCJzYXZlUmVzdWx0VG9Bc3NldHMiLCJraW5kIiwidGl0bGUiLCJjb3ZlclVybCIsInRhZ3MiLCJzb3VyY2UiLCJkYXRhIiwid2lkdGgiLCJoZWlnaHQiLCJieXRlcyIsIm1ldGFkYXRhIiwiaW5zZXJ0UGlja2VkQXNzZXQiLCJwYXlsb2FkIiwiY29udGVudCIsImNyZWF0ZVNlc3Npb24iLCJkZWxldGVTZWxlY3RlZExvZ3MiLCJpbWFnZUtleXMiLCJsb2ciLCJpbmNsdWRlcyIsImtleSIsInJlbW92ZUl0ZW0iLCJ0aGVuIiwic2V0SXRlbSIsInNlcmlhbGl6ZUxvZyIsInJlYWRTdG9yZWRMb2dzIiwicHJldmlld0dlbmVyYXRpb25Mb2ciLCJxdWFsaXR5Iiwic2l6ZSIsIml0ZW1TdGFydGVkQXQiLCJuZXh0SW1hZ2UiLCJ1cGRhdGVSZXN1bHRBdCIsInJldHJ5UmVzdWx0IiwicmV0cnlTdGFydGVkQXQiLCJldmVudCIsInRhcmdldCIsImNsaWNrIiwicHJldmVudERlZmF1bHQiLCJkYXRhVHJhbnNmZXIiLCJkcm9wRWZmZWN0IiwiY3VycmVudFRhcmdldCIsInNjcm9sbFdpZHRoIiwiY2xpZW50V2lkdGgiLCJzY3JvbGxMZWZ0IiwiZGVsdGFZIiwib2Zmc2V0IiwibW92ZUxpc3RJdGVtIiwicmVmIiwidGltZSIsIlBSRVNFTlRFRF9JTUFHRV9TSU1QTEUiLCJkYW5nZXIiLCJHZW5lcmF0aW9uU2V0dGluZ3MiLCJfczIiLCJ0aGVtZSIsIlJlc3VsdEltYWdlQ2FyZCIsIm9uRWRpdCIsIm9uRG93bmxvYWQiLCJvblNhdmVBc3NldCIsIl9zMyIsIlBlbmRpbmdJbWFnZUNhcmQiLCJfczQiLCJiYWNrZ3JvdW5kSW1hZ2UiLCJiYWNrZ3JvdW5kU2l6ZSIsIkZhaWxlZEltYWdlQ2FyZCIsIm9uUmV0cnkiLCJfczUiLCJyb3dzIiwibmV4dCIsIml0ZW1JbmRleCIsIkxvZ1BhbmVsIiwiYWN0aXZlTG9nSWQiLCJvblNlbGVjdGVkTG9nSWRzQ2hhbmdlIiwib25DcmVhdGVTZXNzaW9uIiwib25EZWxldGVTZWxlY3RlZCIsIm9uUHJldmlld0xvZyIsIl9zNiIsImFsbFNlbGVjdGVkIiwidG9nZ2xlQWxsIiwiY2hlY2tlZCIsIkxvZ0NhcmQiLCJzZWxlY3RlZCIsImFjdGl2ZSIsIm9uU2VsZWN0ZWRDaGFuZ2UiLCJvbkNsaWNrIiwiX3M3IiwidGh1bWJuYWlscyIsInNsaWNlIiwic3RvcFByb3BhZ2F0aW9uIiwiaW1hZ2VDb3VudCIsInZhbHVlcyIsIml0ZXJhdGUiLCJwdXNoIiwibm9ybWFsaXplTG9nIiwic29ydCIsImEiLCJiIiwiY3JlYXRlZEF0Iiwibm9ybWFsaXplTG9nQ29uZmlnIiwiRGF0ZSIsInRvTG9jYWxlU3RyaW5nIiwicmVzb2x2ZWRMYW5ndWFnZSIsImhvdXIxMiIsInRhcmdldEluZGV4IiwiUmVmZXJlbmNlT3JkZXJCdXR0b25zIiwidG90YWwiLCJvbk1vdmUiLCJfYzgiLCJsb2dDb25maWciLCJfYyIsIl9jMiIsIl9jMyIsIl9jNCIsIl9jNSIsIl9jNiIsIl9jNyJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJpbmRleC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXJyb3dMZWZ0LCBBcnJvd1JpZ2h0LCBCb29rT3BlbiwgQ2hlY2tTcXVhcmUsIENsaXBib2FyZFBhc3RlLCBEb3dubG9hZCwgRm9sZGVyUGx1cywgSGlzdG9yeSwgSW1hZ2VQbHVzLCBMb2FkZXJDaXJjbGUsIFBlbkxpbmUsIFBsdXMsIFNsaWRlcnNIb3Jpem9udGFsLCBTcGFya2xlcywgVHJhc2gyLCBVcGxvYWQgfSBmcm9tIFwibHVjaWRlLXJlYWN0XCI7XG5pbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IEFwcCwgQnV0dG9uLCBDaGVja2JveCwgRHJhd2VyLCBFbXB0eSwgSW1hZ2UsIElucHV0LCBNb2RhbCwgVGFnLCBUb29sdGlwLCBUeXBvZ3JhcGh5IH0gZnJvbSBcImFudGRcIjtcbmltcG9ydCBsb2NhbGZvcmFnZSBmcm9tIFwibG9jYWxmb3JhZ2VcIjtcbmltcG9ydCB7IHNhdmVBcyB9IGZyb20gXCJmaWxlLXNhdmVyXCI7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gXCJyZWFjdC1pMThuZXh0XCI7XG5cbmltcG9ydCB7IEltYWdlU2V0dGluZ3NQYW5lbCB9IGZyb20gXCJAL2NvbXBvbmVudHMvaW1hZ2Utc2V0dGluZ3MtcGFuZWxcIjtcbmltcG9ydCB7IE1vZGVsUGlja2VyIH0gZnJvbSBcIkAvY29tcG9uZW50cy9tb2RlbC1waWNrZXJcIjtcbmltcG9ydCB7IFByb21wdFNlbGVjdERpYWxvZyB9IGZyb20gXCJAL2NvbXBvbmVudHMvcHJvbXB0cy9wcm9tcHQtc2VsZWN0LWRpYWxvZ1wiO1xuaW1wb3J0IHsgQXNzZXRQaWNrZXJNb2RhbCwgdHlwZSBJbnNlcnRBc3NldFBheWxvYWQgfSBmcm9tIFwiQC9jb21wb25lbnRzL2NhbnZhcy9hc3NldC1waWNrZXItbW9kYWxcIjtcbmltcG9ydCB7IGNhbnZhc1RoZW1lcyB9IGZyb20gXCJAL2xpYi9jYW52YXMtdGhlbWVcIjtcbmltcG9ydCB7IGltYWdlUmVmZXJlbmNlTGFiZWwgfSBmcm9tIFwiQC9saWIvaW1hZ2UtcmVmZXJlbmNlLXByb21wdFwiO1xuaW1wb3J0IHsgbW9kZWxPcHRpb25MYWJlbCwgdXNlQ29uZmlnU3RvcmUsIHVzZUVmZmVjdGl2ZUNvbmZpZywgdHlwZSBBaUNvbmZpZyB9IGZyb20gXCJAL3N0b3Jlcy91c2UtY29uZmlnLXN0b3JlXCI7XG5pbXBvcnQgeyB1c2VUaGVtZVN0b3JlIH0gZnJvbSBcIkAvc3RvcmVzL3VzZS10aGVtZS1zdG9yZVwiO1xuaW1wb3J0IHsgbmFub2lkIH0gZnJvbSBcIm5hbm9pZFwiO1xuaW1wb3J0IHsgZm9ybWF0Qnl0ZXMsIGZvcm1hdER1cmF0aW9uIH0gZnJvbSBcIkAvbGliL2ltYWdlLXV0aWxzXCI7XG5pbXBvcnQgeyByZXF1ZXN0RWRpdCwgcmVxdWVzdEdlbmVyYXRpb24gfSBmcm9tIFwiQC9zZXJ2aWNlcy9hcGkvaW1hZ2VcIjtcbmltcG9ydCB7IGRlbGV0ZVN0b3JlZEltYWdlcywgcmVzb2x2ZUltYWdlVXJsLCB1cGxvYWRJbWFnZSB9IGZyb20gXCJAL3NlcnZpY2VzL2ltYWdlLXN0b3JhZ2VcIjtcbmltcG9ydCB7IHVzZUFzc2V0U3RvcmUgfSBmcm9tIFwiQC9zdG9yZXMvdXNlLWFzc2V0LXN0b3JlXCI7XG5pbXBvcnQgeyB1c2VXb3JrYmVuY2hBZ2VudFN0b3JlIH0gZnJvbSBcIkAvc3RvcmVzL3VzZS13b3JrYmVuY2gtYWdlbnQtc3RvcmVcIjtcbmltcG9ydCB0eXBlIHsgUmVmZXJlbmNlSW1hZ2UgfSBmcm9tIFwiQC90eXBlcy9pbWFnZVwiO1xuaW1wb3J0IGkxOG4gZnJvbSBcIkAvaTE4blwiO1xuXG50eXBlIEdlbmVyYXRlZEltYWdlID0ge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgZGF0YVVybDogc3RyaW5nO1xuICAgIHN0b3JhZ2VLZXk/OiBzdHJpbmc7XG4gICAgZHVyYXRpb25NczogbnVtYmVyO1xuICAgIHdpZHRoOiBudW1iZXI7XG4gICAgaGVpZ2h0OiBudW1iZXI7XG4gICAgYnl0ZXM6IG51bWJlcjtcbiAgICBtaW1lVHlwZT86IHN0cmluZztcbn07XG5cbnR5cGUgR2VuZXJhdGlvblJlc3VsdCA9IHtcbiAgICBpZDogc3RyaW5nO1xuICAgIHN0YXR1czogXCJwZW5kaW5nXCIgfCBcInN1Y2Nlc3NcIiB8IFwiZmFpbGVkXCI7XG4gICAgaW1hZ2U/OiBHZW5lcmF0ZWRJbWFnZTtcbiAgICBlcnJvcj86IHN0cmluZztcbn07XG5cbnR5cGUgR2VuZXJhdGlvbkxvZyA9IHtcbiAgICBpZDogc3RyaW5nO1xuICAgIGNyZWF0ZWRBdDogbnVtYmVyO1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgcHJvbXB0OiBzdHJpbmc7XG4gICAgdGltZTogc3RyaW5nO1xuICAgIG1vZGVsOiBzdHJpbmc7XG4gICAgY29uZmlnOiBHZW5lcmF0aW9uTG9nQ29uZmlnO1xuICAgIHJlZmVyZW5jZXM6IFJlZmVyZW5jZUltYWdlW107XG4gICAgZHVyYXRpb25NczogbnVtYmVyO1xuICAgIHN1Y2Nlc3NDb3VudDogbnVtYmVyO1xuICAgIGZhaWxDb3VudDogbnVtYmVyO1xuICAgIGltYWdlQ291bnQ6IG51bWJlcjtcbiAgICBzaXplOiBzdHJpbmc7XG4gICAgcXVhbGl0eTogc3RyaW5nO1xuICAgIHN0YXR1czogXCJzdWNjZXNzXCIgfCBcImZhaWxlZFwiO1xuICAgIGltYWdlczogR2VuZXJhdGVkSW1hZ2VbXTtcbiAgICB0aHVtYm5haWxzOiBzdHJpbmdbXTtcbn07XG5cbnR5cGUgR2VuZXJhdGlvbkxvZ0NvbmZpZyA9IFBpY2s8QWlDb25maWcsIFwibW9kZWxcIiB8IFwiaW1hZ2VNb2RlbFwiIHwgXCJxdWFsaXR5XCIgfCBcInNpemVcIiB8IFwiY291bnRcIj47XG5cbnR5cGUgVXBkYXRlQWlDb25maWcgPSA8SyBleHRlbmRzIGtleW9mIEFpQ29uZmlnPihrZXk6IEssIHZhbHVlOiBBaUNvbmZpZ1tLXSkgPT4gdm9pZDtcblxuY29uc3QgTE9HX1NUT1JFX0tFWSA9IFwiaW5maW5pdGUtY2FudmFzOmltYWdlX2dlbmVyYXRpb25fbG9nc1wiO1xuY29uc3QgUkVTVUxUX0FDVElPTl9CVVRUT05fQ0xBU1MgPSBcIm1pbi13LTAgcHgtMS41IFsmXy5hbnQtYnRuLWljb25dOnNocmluay0wIFsmPnNwYW46bGFzdC1jaGlsZF06bWluLXctMCBbJj5zcGFuOmxhc3QtY2hpbGRdOnRydW5jYXRlXCI7XG5jb25zdCBsb2dTdG9yZSA9IGxvY2FsZm9yYWdlLmNyZWF0ZUluc3RhbmNlKHsgbmFtZTogXCJpbmZpbml0ZS1jYW52YXNcIiwgc3RvcmVOYW1lOiBcImltYWdlX2dlbmVyYXRpb25fbG9nc1wiIH0pO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBJbWFnZVBhZ2UoKSB7XG4gICAgY29uc3QgeyBtZXNzYWdlIH0gPSBBcHAudXNlQXBwKCk7XG4gICAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICAgIGNvbnN0IGZpbGVJbnB1dFJlZiA9IHVzZVJlZjxIVE1MSW5wdXRFbGVtZW50PihudWxsKTtcbiAgICBjb25zdCBkcmFnRGVwdGhSZWYgPSB1c2VSZWYoMCk7XG4gICAgY29uc3QgY29uZmlnID0gdXNlQ29uZmlnU3RvcmUoKHN0YXRlKSA9PiBzdGF0ZS5jb25maWcpO1xuICAgIGNvbnN0IGVmZmVjdGl2ZUNvbmZpZyA9IHVzZUVmZmVjdGl2ZUNvbmZpZygpO1xuICAgIGNvbnN0IHVwZGF0ZUNvbmZpZyA9IHVzZUNvbmZpZ1N0b3JlKChzdGF0ZSkgPT4gc3RhdGUudXBkYXRlQ29uZmlnKTtcbiAgICBjb25zdCBpc0FpQ29uZmlnUmVhZHkgPSB1c2VDb25maWdTdG9yZSgoc3RhdGUpID0+IHN0YXRlLmlzQWlDb25maWdSZWFkeSk7XG4gICAgY29uc3Qgb3BlbkNvbmZpZ0RpYWxvZyA9IHVzZUNvbmZpZ1N0b3JlKChzdGF0ZSkgPT4gc3RhdGUub3BlbkNvbmZpZ0RpYWxvZyk7XG4gICAgY29uc3QgYWRkQXNzZXQgPSB1c2VBc3NldFN0b3JlKChzdGF0ZSkgPT4gc3RhdGUuYWRkQXNzZXQpO1xuICAgIGNvbnN0IFtwcm9tcHQsIHNldFByb21wdF0gPSB1c2VTdGF0ZShcIlwiKTtcbiAgICBjb25zdCBbcmVmZXJlbmNlcywgc2V0UmVmZXJlbmNlc10gPSB1c2VTdGF0ZTxSZWZlcmVuY2VJbWFnZVtdPihbXSk7XG4gICAgY29uc3QgW3Jlc3VsdHMsIHNldFJlc3VsdHNdID0gdXNlU3RhdGU8R2VuZXJhdGlvblJlc3VsdFtdPihbXSk7XG4gICAgY29uc3QgW2xvZ3MsIHNldExvZ3NdID0gdXNlU3RhdGU8R2VuZXJhdGlvbkxvZ1tdPihbXSk7XG4gICAgY29uc3QgW3J1bm5pbmcsIHNldFJ1bm5pbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICAgIGNvbnN0IFtsb2dzT3Blbiwgc2V0TG9nc09wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xuICAgIGNvbnN0IFtzZXR0aW5nc09wZW4sIHNldFNldHRpbmdzT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW3Byb21wdERpYWxvZ09wZW4sIHNldFByb21wdERpYWxvZ09wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xuICAgIGNvbnN0IFthc3NldFBpY2tlck9wZW4sIHNldEFzc2V0UGlja2VyT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW3N0YXJ0ZWRBdCwgc2V0U3RhcnRlZEF0XSA9IHVzZVN0YXRlKDApO1xuICAgIGNvbnN0IFtlbGFwc2VkTXMsIHNldEVsYXBzZWRNc10gPSB1c2VTdGF0ZSgwKTtcbiAgICBjb25zdCBbc2VsZWN0ZWRMb2dJZHMsIHNldFNlbGVjdGVkTG9nSWRzXSA9IHVzZVN0YXRlPHN0cmluZ1tdPihbXSk7XG4gICAgY29uc3QgW3ByZXZpZXdMb2csIHNldFByZXZpZXdMb2ddID0gdXNlU3RhdGU8R2VuZXJhdGlvbkxvZyB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IFtkZWxldGVDb25maXJtT3Blbiwgc2V0RGVsZXRlQ29uZmlybU9wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xuICAgIGNvbnN0IFtpc1JlZmVyZW5jZURyYWdBY3RpdmUsIHNldElzUmVmZXJlbmNlRHJhZ0FjdGl2ZV0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW2F1dG9SdW5Ub2tlbiwgc2V0QXV0b1J1blRva2VuXSA9IHVzZVN0YXRlKDApO1xuICAgIGNvbnN0IGltYWdlQ29tbWFuZCA9IHVzZVdvcmtiZW5jaEFnZW50U3RvcmUoKHN0YXRlKSA9PiBzdGF0ZS5pbWFnZUNvbW1hbmQpO1xuICAgIGNvbnN0IGNsZWFySW1hZ2VDb21tYW5kID0gdXNlV29ya2JlbmNoQWdlbnRTdG9yZSgoc3RhdGUpID0+IHN0YXRlLmNsZWFySW1hZ2VDb21tYW5kKTtcbiAgICBjb25zdCB1cGRhdGVBZ2VudFRhc2sgPSB1c2VXb3JrYmVuY2hBZ2VudFN0b3JlKChzdGF0ZSkgPT4gc3RhdGUudXBkYXRlVGFzayk7XG4gICAgY29uc3QgcHJvY2Vzc2VkQ29tbWFuZFJlZiA9IHVzZVJlZigwKTtcbiAgICBjb25zdCBhZ2VudFRhc2tJZFJlZiA9IHVzZVJlZjxzdHJpbmcgfCB1bmRlZmluZWQ+KHVuZGVmaW5lZCk7XG5cbiAgICBjb25zdCBtb2RlbCA9IGVmZmVjdGl2ZUNvbmZpZy5pbWFnZU1vZGVsIHx8IGVmZmVjdGl2ZUNvbmZpZy5tb2RlbDtcbiAgICBjb25zdCBjYW5HZW5lcmF0ZSA9IEJvb2xlYW4ocHJvbXB0LnRyaW0oKSk7XG4gICAgY29uc3QgZ2VuZXJhdGlvbkNvdW50ID0gTWF0aC5tYXgoMSwgTWF0aC5taW4oMTAsIE51bWJlcihjb25maWcuY291bnQpIHx8IDEpKTtcblxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGlmICghcnVubmluZyB8fCAhc3RhcnRlZEF0KSByZXR1cm47XG4gICAgICAgIGNvbnN0IHRpbWVyID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHNldEVsYXBzZWRNcyhwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0ZWRBdCksIDEwMDApO1xuICAgICAgICByZXR1cm4gKCkgPT4gd2luZG93LmNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgIH0sIFtydW5uaW5nLCBzdGFydGVkQXRdKTtcblxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIHZvaWQgcmVmcmVzaExvZ3MoKTtcbiAgICB9LCBbXSk7XG5cbiAgICBjb25zdCBhZGRSZWZlcmVuY2VzID0gYXN5bmMgKGZpbGVzPzogRmlsZUxpc3QgfCBudWxsKSA9PiB7XG4gICAgICAgIGNvbnN0IGltYWdlRmlsZXMgPSBBcnJheS5mcm9tKGZpbGVzIHx8IFtdKS5maWx0ZXIoKGZpbGUpID0+IGZpbGUudHlwZS5zdGFydHNXaXRoKFwiaW1hZ2UvXCIpKTtcbiAgICAgICAgY29uc3QgbmV4dFJlZmVyZW5jZXMgPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgICAgIGltYWdlRmlsZXMubWFwKGFzeW5jIChmaWxlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW1hZ2UgPSBhd2FpdCB1cGxvYWRJbWFnZShmaWxlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBpZDogbmFub2lkKCksIG5hbWU6IGZpbGUubmFtZSwgdHlwZTogaW1hZ2UubWltZVR5cGUsIGRhdGFVcmw6IGltYWdlLnVybCwgc3RvcmFnZUtleTogaW1hZ2Uuc3RvcmFnZUtleSB9O1xuICAgICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgICAgIHNldFJlZmVyZW5jZXMoKHZhbHVlKSA9PiBbLi4udmFsdWUsIC4uLm5leHRSZWZlcmVuY2VzXSk7XG4gICAgfTtcblxuICAgIGNvbnN0IGFkZFJlZmVyZW5jZXNGcm9tQ2xpcGJvYXJkID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLnJlYWQoKTtcbiAgICAgICAgICAgIGNvbnN0IGJsb2JzID0gYXdhaXQgUHJvbWlzZS5hbGwoaXRlbXMuZmxhdE1hcCgoaXRlbSkgPT4gaXRlbS50eXBlcy5maWx0ZXIoKHR5cGUpID0+IHR5cGUuc3RhcnRzV2l0aChcImltYWdlL1wiKSkubWFwKCh0eXBlKSA9PiBpdGVtLmdldFR5cGUodHlwZSkpKSk7XG4gICAgICAgICAgICBpZiAoIWJsb2JzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UuZXJyb3IodChcImltYWdlV29ya2JlbmNoLmNsaXBib2FyZEVtcHR5XCIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBuZXh0UmVmZXJlbmNlcyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgICAgICAgIGJsb2JzLm1hcChhc3luYyAoYmxvYiwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1hZ2UgPSBhd2FpdCB1cGxvYWRJbWFnZShibG9iKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgaWQ6IG5hbm9pZCgpLCBuYW1lOiBgY2xpcGJvYXJkLSR7aW5kZXggKyAxfS5wbmdgLCB0eXBlOiBpbWFnZS5taW1lVHlwZSwgZGF0YVVybDogaW1hZ2UudXJsLCBzdG9yYWdlS2V5OiBpbWFnZS5zdG9yYWdlS2V5IH07XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgc2V0UmVmZXJlbmNlcygodmFsdWUpID0+IFsuLi52YWx1ZSwgLi4ubmV4dFJlZmVyZW5jZXNdKTtcbiAgICAgICAgICAgIG1lc3NhZ2Uuc3VjY2Vzcyh0KFwiaW1hZ2VXb3JrYmVuY2guY2xpcGJvYXJkQWRkZWRcIiwgeyBjb3VudDogbmV4dFJlZmVyZW5jZXMubGVuZ3RoIH0pKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICBtZXNzYWdlLmVycm9yKHQoXCJpbWFnZVdvcmtiZW5jaC5jbGlwYm9hcmRFbXB0eVwiKSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgZ2VuZXJhdGUgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGFnZW50VGFza0lkID0gYWdlbnRUYXNrSWRSZWYuY3VycmVudDtcbiAgICAgICAgYWdlbnRUYXNrSWRSZWYuY3VycmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3QgdGV4dCA9IHByb21wdC50cmltKCk7XG4gICAgICAgIGlmICghdGV4dCkge1xuICAgICAgICAgICAgbWVzc2FnZS5lcnJvcih0KFwiaW1hZ2VXb3JrYmVuY2gucHJvbXB0UmVxdWlyZWRcIikpO1xuICAgICAgICAgICAgaWYgKGFnZW50VGFza0lkKSB1cGRhdGVBZ2VudFRhc2soYWdlbnRUYXNrSWQsIHsgc3RhdHVzOiBcImZhaWxlZFwiLCBlcnJvcjogdChcImltYWdlV29ya2JlbmNoLnByb21wdFJlcXVpcmVkXCIpIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNBaUNvbmZpZ1JlYWR5KGVmZmVjdGl2ZUNvbmZpZywgbW9kZWwpKSB7XG4gICAgICAgICAgICBtZXNzYWdlLndhcm5pbmcodChcIndvcmtiZW5jaC5jb25maWdGaXJzdFwiKSk7XG4gICAgICAgICAgICBvcGVuQ29uZmlnRGlhbG9nKHRydWUpO1xuICAgICAgICAgICAgaWYgKGFnZW50VGFza0lkKSB1cGRhdGVBZ2VudFRhc2soYWdlbnRUYXNrSWQsIHsgc3RhdHVzOiBcImZhaWxlZFwiLCBlcnJvcjogdChcImltYWdlV29ya2JlbmNoLmNvbmZpZ0luY29tcGxldGVcIikgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzbmFwc2hvdCA9IGJ1aWxkUmVxdWVzdFNuYXBzaG90KCk7XG4gICAgICAgIGlmICghc25hcHNob3QpIHtcbiAgICAgICAgICAgIGlmIChhZ2VudFRhc2tJZCkgdXBkYXRlQWdlbnRUYXNrKGFnZW50VGFza0lkLCB7IHN0YXR1czogXCJmYWlsZWRcIiwgZXJyb3I6IHQoXCJpbWFnZVdvcmtiZW5jaC5pbnZhbGlkUGFyYW1zXCIpIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0RWxhcHNlZE1zKDApO1xuICAgICAgICBzZXRSdW5uaW5nKHRydWUpO1xuICAgICAgICBpZiAoYWdlbnRUYXNrSWQpIHVwZGF0ZUFnZW50VGFzayhhZ2VudFRhc2tJZCwgeyBzdGF0dXM6IFwicnVubmluZ1wiLCBlcnJvcjogdW5kZWZpbmVkIH0pO1xuICAgICAgICBzZXRQcmV2aWV3TG9nKG51bGwpO1xuICAgICAgICBzZXRSZXN1bHRzKEFycmF5LmZyb20oeyBsZW5ndGg6IGdlbmVyYXRpb25Db3VudCB9LCAoKSA9PiAoeyBpZDogbmFub2lkKCksIHN0YXR1czogXCJwZW5kaW5nXCIgfSkpKTtcbiAgICAgICAgY29uc3QgYmF0Y2hTdGFydGVkQXQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgc2V0U3RhcnRlZEF0KGJhdGNoU3RhcnRlZEF0KTtcblxuICAgICAgICBjb25zdCB0YXNrcyA9IEFycmF5LmZyb20oeyBsZW5ndGg6IGdlbmVyYXRpb25Db3VudCB9LCAoXywgaW5kZXgpID0+IHJ1bkdlbmVyYXRpb25TbG90KGluZGV4LCBzbmFwc2hvdCkpO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZCh0YXNrcyk7XG4gICAgICAgIGNvbnN0IHN1Y2Nlc3NJbWFnZXMgPSByZXN1bHQuZmlsdGVyKChpdGVtKTogaXRlbSBpcyBQcm9taXNlRnVsZmlsbGVkUmVzdWx0PEdlbmVyYXRlZEltYWdlPiA9PiBpdGVtLnN0YXR1cyA9PT0gXCJmdWxmaWxsZWRcIikubWFwKChpdGVtKSA9PiBpdGVtLnZhbHVlKTtcbiAgICAgICAgY29uc3Qgc3VjY2Vzc0NvdW50ID0gc3VjY2Vzc0ltYWdlcy5sZW5ndGg7XG4gICAgICAgIGNvbnN0IGZhaWxDb3VudCA9IGdlbmVyYXRpb25Db3VudCAtIHN1Y2Nlc3NDb3VudDtcbiAgICAgICAgY29uc3QgZmFpbGVkID0gcmVzdWx0LmZpbmQoKGl0ZW0pOiBpdGVtIGlzIFByb21pc2VSZWplY3RlZFJlc3VsdCA9PiBpdGVtLnN0YXR1cyA9PT0gXCJyZWplY3RlZFwiKTtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBmYWlsZWQ/LnJlYXNvbiBpbnN0YW5jZW9mIEVycm9yID8gZmFpbGVkLnJlYXNvbi5tZXNzYWdlIDogZmFpbENvdW50ID8gdChcIndvcmtiZW5jaC5nZW5lcmF0aW9uRmFpbGVkXCIpIDogdW5kZWZpbmVkO1xuICAgICAgICBpZiAoYWdlbnRUYXNrSWQpIHVwZGF0ZUFnZW50VGFzayhhZ2VudFRhc2tJZCwgeyBzdGF0dXM6IHN1Y2Nlc3NDb3VudCA/IFwic3VjY2VlZGVkXCIgOiBcImZhaWxlZFwiLCBzdWNjZXNzQ291bnQsIGZhaWxDb3VudCwgZXJyb3I6IHN1Y2Nlc3NDb3VudCA/IHVuZGVmaW5lZCA6IGVycm9yIH0pO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzYXZlTG9nKFxuICAgICAgICAgICAgICAgIGJ1aWxkTG9nKHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICBtb2RlbCxcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnOiB7IC4uLnNuYXBzaG90LmNvbmZpZywgY291bnQ6IFN0cmluZyhnZW5lcmF0aW9uQ291bnQpIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZXM6IHNuYXBzaG90LnJlZmVyZW5jZXMsXG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uTXM6IHBlcmZvcm1hbmNlLm5vdygpIC0gYmF0Y2hTdGFydGVkQXQsXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgICAgICAgICAgICAgZmFpbENvdW50LFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHN1Y2Nlc3NDb3VudCA/IFwic3VjY2Vzc1wiIDogXCJmYWlsZWRcIixcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VzOiBzdWNjZXNzSW1hZ2VzLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHN1Y2Nlc3NDb3VudCA/IG1lc3NhZ2Uuc3VjY2Vzcyh0KFwiaW1hZ2VXb3JrYmVuY2guZ2VuZXJhdGVkXCIpKSA6IG1lc3NhZ2UuZXJyb3IoZmFpbGVkPy5yZWFzb24gaW5zdGFuY2VvZiBFcnJvciA/IGZhaWxlZC5yZWFzb24ubWVzc2FnZSA6IHQoXCJ3b3JrYmVuY2guZ2VuZXJhdGlvbkZhaWxlZFwiKSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBzZXRSdW5uaW5nKGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBIYW5kbGUgaW1hZ2UtZ2VuZXJhdGlvbiBjb21tYW5kcyBmcm9tIHRoZSBBZ2VudCBwYW5lbCBieSBzZXR0aW5nIHRoZSBwcm9tcHQgYW5kIG9wdGlvbmFsbHkgc3RhcnRpbmcgZ2VuZXJhdGlvbi5cbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAoIWltYWdlQ29tbWFuZCB8fCBpbWFnZUNvbW1hbmQubm9uY2UgPT09IHByb2Nlc3NlZENvbW1hbmRSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgICBwcm9jZXNzZWRDb21tYW5kUmVmLmN1cnJlbnQgPSBpbWFnZUNvbW1hbmQubm9uY2U7XG4gICAgICAgIGNsZWFySW1hZ2VDb21tYW5kKCk7XG4gICAgICAgIGlmICh0eXBlb2YgaW1hZ2VDb21tYW5kLnByb21wdCA9PT0gXCJzdHJpbmdcIikgc2V0UHJvbXB0KGltYWdlQ29tbWFuZC5wcm9tcHQpO1xuICAgICAgICBpZiAoaW1hZ2VDb21tYW5kLnJ1biAmJiBydW5uaW5nKSB7XG4gICAgICAgICAgICBpZiAoaW1hZ2VDb21tYW5kLnRhc2tJZCkgdXBkYXRlQWdlbnRUYXNrKGltYWdlQ29tbWFuZC50YXNrSWQsIHsgc3RhdHVzOiBcImZhaWxlZFwiLCBlcnJvcjogdChcImltYWdlV29ya2JlbmNoLmJ1c3lcIikgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGltYWdlQ29tbWFuZC5ydW4pIHtcbiAgICAgICAgICAgIGFnZW50VGFza0lkUmVmLmN1cnJlbnQgPSBpbWFnZUNvbW1hbmQudGFza0lkO1xuICAgICAgICAgICAgc2V0QXV0b1J1blRva2VuKCh2YWx1ZSkgPT4gdmFsdWUgKyAxKTtcbiAgICAgICAgfVxuICAgIH0sIFtpbWFnZUNvbW1hbmQsIGNsZWFySW1hZ2VDb21tYW5kLCBydW5uaW5nLCB1cGRhdGVBZ2VudFRhc2tdKTtcblxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGlmICghYXV0b1J1blRva2VuKSByZXR1cm47XG4gICAgICAgIHZvaWQgZ2VuZXJhdGUoKTtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICAgIH0sIFthdXRvUnVuVG9rZW5dKTtcblxuICAgIGNvbnN0IGRvd25sb2FkSW1hZ2UgPSAoaW1hZ2U6IEdlbmVyYXRlZEltYWdlLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgIHNhdmVBcyhpbWFnZS5kYXRhVXJsLCBgaW1hZ2UtJHtpbmRleCArIDF9LnBuZ2ApO1xuICAgIH07XG5cbiAgICBjb25zdCBhZGRSZXN1bHRUb1JlZmVyZW5jZXMgPSBhc3luYyAoaW1hZ2U6IEdlbmVyYXRlZEltYWdlLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0b3JlZCA9IGF3YWl0IHVwbG9hZEltYWdlKGltYWdlLmRhdGFVcmwpO1xuICAgICAgICBzZXRSZWZlcmVuY2VzKCh2YWx1ZSkgPT4gWy4uLnZhbHVlLCB7IGlkOiBuYW5vaWQoKSwgbmFtZTogYHJlc3VsdC0ke2luZGV4ICsgMX0ucG5nYCwgdHlwZTogc3RvcmVkLm1pbWVUeXBlLCBkYXRhVXJsOiBzdG9yZWQudXJsLCBzdG9yYWdlS2V5OiBzdG9yZWQuc3RvcmFnZUtleSB9XSk7XG4gICAgICAgIG1lc3NhZ2Uuc3VjY2Vzcyh0KFwiaW1hZ2VXb3JrYmVuY2guYWRkZWRSZWZlcmVuY2VcIikpO1xuICAgIH07XG5cbiAgICBjb25zdCBzYXZlUmVzdWx0VG9Bc3NldHMgPSBhc3luYyAoaW1hZ2U6IEdlbmVyYXRlZEltYWdlLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0b3JlZCA9IGF3YWl0IHVwbG9hZEltYWdlKGltYWdlLmRhdGFVcmwpO1xuICAgICAgICBhZGRBc3NldCh7XG4gICAgICAgICAgICBraW5kOiBcImltYWdlXCIsXG4gICAgICAgICAgICB0aXRsZTogdChcImltYWdlV29ya2JlbmNoLnJlc3VsdFRpdGxlXCIsIHsgY291bnQ6IGluZGV4ICsgMSB9KSxcbiAgICAgICAgICAgIGNvdmVyVXJsOiBzdG9yZWQudXJsLFxuICAgICAgICAgICAgdGFnczogW10sXG4gICAgICAgICAgICBzb3VyY2U6IHQoXCJpbWFnZVdvcmtiZW5jaC5zb3VyY2VcIiksXG4gICAgICAgICAgICBkYXRhOiB7IGRhdGFVcmw6IHN0b3JlZC51cmwsIHN0b3JhZ2VLZXk6IHN0b3JlZC5zdG9yYWdlS2V5LCB3aWR0aDogc3RvcmVkLndpZHRoLCBoZWlnaHQ6IHN0b3JlZC5oZWlnaHQsIGJ5dGVzOiBzdG9yZWQuYnl0ZXMsIG1pbWVUeXBlOiBzdG9yZWQubWltZVR5cGUgfSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7IHNvdXJjZTogXCJpbWFnZS1wYWdlXCIsIHByb21wdCB9LFxuICAgICAgICB9KTtcbiAgICAgICAgbWVzc2FnZS5zdWNjZXNzKHQoXCJjb21tb24uYWRkZWRUb0Fzc2V0c1wiKSk7XG4gICAgfTtcblxuICAgIGNvbnN0IGluc2VydFBpY2tlZEFzc2V0ID0gYXN5bmMgKHBheWxvYWQ6IEluc2VydEFzc2V0UGF5bG9hZCkgPT4ge1xuICAgICAgICBpZiAocGF5bG9hZC5raW5kID09PSBcInRleHRcIikge1xuICAgICAgICAgICAgc2V0UHJvbXB0KHBheWxvYWQuY29udGVudCk7XG4gICAgICAgIH0gZWxzZSBpZiAocGF5bG9hZC5raW5kID09PSBcImltYWdlXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0b3JlZCA9IGF3YWl0IHVwbG9hZEltYWdlKHBheWxvYWQuZGF0YVVybCk7XG4gICAgICAgICAgICBzZXRSZWZlcmVuY2VzKCh2YWx1ZSkgPT4gWy4uLnZhbHVlLCB7IGlkOiBuYW5vaWQoKSwgbmFtZTogcGF5bG9hZC50aXRsZSwgdHlwZTogc3RvcmVkLm1pbWVUeXBlLCBkYXRhVXJsOiBzdG9yZWQudXJsLCBzdG9yYWdlS2V5OiBzdG9yZWQuc3RvcmFnZUtleSB9XSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtZXNzYWdlLndhcm5pbmcodChcImltYWdlV29ya2JlbmNoLnVuc3VwcG9ydGVkQXNzZXRcIikpO1xuICAgICAgICB9XG4gICAgICAgIHNldEFzc2V0UGlja2VyT3BlbihmYWxzZSk7XG4gICAgfTtcblxuICAgIGNvbnN0IGNyZWF0ZVNlc3Npb24gPSAoKSA9PiB7XG4gICAgICAgIHNldFByb21wdChcIlwiKTtcbiAgICAgICAgc2V0UmVmZXJlbmNlcyhbXSk7XG4gICAgICAgIHNldFJlc3VsdHMoW10pO1xuICAgICAgICBzZXRFbGFwc2VkTXMoMCk7XG4gICAgICAgIHNldFN0YXJ0ZWRBdCgwKTtcbiAgICAgICAgc2V0U2VsZWN0ZWRMb2dJZHMoW10pO1xuICAgICAgICBzZXRQcmV2aWV3TG9nKG51bGwpO1xuICAgIH07XG5cbiAgICBjb25zdCBkZWxldGVTZWxlY3RlZExvZ3MgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGltYWdlS2V5cyA9IGxvZ3MuZmlsdGVyKChsb2cpID0+IHNlbGVjdGVkTG9nSWRzLmluY2x1ZGVzKGxvZy5pZCkpLmZsYXRNYXAoKGxvZykgPT4gbG9nLmltYWdlcy5tYXAoKGltYWdlKSA9PiBpbWFnZS5zdG9yYWdlS2V5KS5maWx0ZXIoKGtleSk6IGtleSBpcyBzdHJpbmcgPT4gQm9vbGVhbihrZXkpKSk7XG4gICAgICAgIHZvaWQgUHJvbWlzZS5hbGwoW2RlbGV0ZVN0b3JlZEltYWdlcyhpbWFnZUtleXMpLCAuLi5zZWxlY3RlZExvZ0lkcy5tYXAoKGlkKSA9PiBsb2dTdG9yZS5yZW1vdmVJdGVtKGlkKSldKS50aGVuKHJlZnJlc2hMb2dzKTtcbiAgICAgICAgaWYgKHByZXZpZXdMb2cgJiYgc2VsZWN0ZWRMb2dJZHMuaW5jbHVkZXMocHJldmlld0xvZy5pZCkpIHtcbiAgICAgICAgICAgIHNldFByZXZpZXdMb2cobnVsbCk7XG4gICAgICAgICAgICBzZXRSZXN1bHRzKFtdKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRTZWxlY3RlZExvZ0lkcyhbXSk7XG4gICAgICAgIHNldERlbGV0ZUNvbmZpcm1PcGVuKGZhbHNlKTtcbiAgICB9O1xuXG4gICAgY29uc3Qgc2F2ZUxvZyA9IChsb2c6IEdlbmVyYXRpb25Mb2cpID0+IHtcbiAgICAgICAgdm9pZCBsb2dTdG9yZS5zZXRJdGVtKGxvZy5pZCwgc2VyaWFsaXplTG9nKGxvZykpLnRoZW4ocmVmcmVzaExvZ3MpO1xuICAgIH07XG5cbiAgICBjb25zdCByZWZyZXNoTG9ncyA9IGFzeW5jICgpID0+IHNldExvZ3MoYXdhaXQgcmVhZFN0b3JlZExvZ3MoKSk7XG5cbiAgICBjb25zdCBwcmV2aWV3R2VuZXJhdGlvbkxvZyA9IGFzeW5jIChsb2c6IEdlbmVyYXRpb25Mb2cpID0+IHtcbiAgICAgICAgc2V0UHJldmlld0xvZyhsb2cpO1xuICAgICAgICBzZXRMb2dzT3BlbihmYWxzZSk7XG4gICAgICAgIHNldFByb21wdChsb2cucHJvbXB0KTtcbiAgICAgICAgc2V0UmVmZXJlbmNlcyhsb2cucmVmZXJlbmNlcyB8fCBbXSk7XG4gICAgICAgIGlmIChsb2cuY29uZmlnLmltYWdlTW9kZWwgfHwgbG9nLm1vZGVsKSB1cGRhdGVDb25maWcoXCJpbWFnZU1vZGVsXCIsIGxvZy5jb25maWcuaW1hZ2VNb2RlbCB8fCBsb2cubW9kZWwpO1xuICAgICAgICBpZiAobG9nLmNvbmZpZy5xdWFsaXR5KSB1cGRhdGVDb25maWcoXCJxdWFsaXR5XCIsIGxvZy5jb25maWcucXVhbGl0eSk7XG4gICAgICAgIGlmIChsb2cuY29uZmlnLnNpemUpIHVwZGF0ZUNvbmZpZyhcInNpemVcIiwgbG9nLmNvbmZpZy5zaXplKTtcbiAgICAgICAgaWYgKGxvZy5jb25maWcuY291bnQpIHVwZGF0ZUNvbmZpZyhcImNvdW50XCIsIGxvZy5jb25maWcuY291bnQpO1xuICAgICAgICBzZXRSZXN1bHRzKGxvZy5pbWFnZXMubWFwKChpbWFnZSkgPT4gKHsgaWQ6IGltYWdlLmlkLCBzdGF0dXM6IFwic3VjY2Vzc1wiLCBpbWFnZSB9KSkpO1xuICAgIH07XG5cbiAgICBjb25zdCBidWlsZFJlcXVlc3RTbmFwc2hvdCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IHByb21wdC50cmltKCk7XG4gICAgICAgIGlmICghdGV4dCkge1xuICAgICAgICAgICAgbWVzc2FnZS5lcnJvcih0KFwiaW1hZ2VXb3JrYmVuY2gucHJvbXB0UmVxdWlyZWRcIikpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc0FpQ29uZmlnUmVhZHkoZWZmZWN0aXZlQ29uZmlnLCBtb2RlbCkpIHtcbiAgICAgICAgICAgIG1lc3NhZ2Uud2FybmluZyh0KFwid29ya2JlbmNoLmNvbmZpZ0ZpcnN0XCIpKTtcbiAgICAgICAgICAgIG9wZW5Db25maWdEaWFsb2codHJ1ZSk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyB0ZXh0LCBjb25maWc6IHsgLi4uZWZmZWN0aXZlQ29uZmlnLCBtb2RlbCwgY291bnQ6IFwiMVwiIH0sIHJlZmVyZW5jZXM6IFsuLi5yZWZlcmVuY2VzXSB9O1xuICAgIH07XG5cbiAgICBjb25zdCBydW5HZW5lcmF0aW9uU2xvdCA9IGFzeW5jIChpbmRleDogbnVtYmVyLCBzbmFwc2hvdDogeyB0ZXh0OiBzdHJpbmc7IGNvbmZpZzogQWlDb25maWc7IHJlZmVyZW5jZXM6IFJlZmVyZW5jZUltYWdlW10gfSkgPT4ge1xuICAgICAgICBjb25zdCBpdGVtU3RhcnRlZEF0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBzbmFwc2hvdC5yZWZlcmVuY2VzLmxlbmd0aCA/IGF3YWl0IHJlcXVlc3RFZGl0KHNuYXBzaG90LmNvbmZpZywgc25hcHNob3QudGV4dCwgc25hcHNob3QucmVmZXJlbmNlcykgOiBhd2FpdCByZXF1ZXN0R2VuZXJhdGlvbihzbmFwc2hvdC5jb25maWcsIHNuYXBzaG90LnRleHQpO1xuICAgICAgICAgICAgY29uc3QgaW1hZ2UgPSByZXN1bHRbMF07XG4gICAgICAgICAgICBpZiAoIWltYWdlKSB0aHJvdyBuZXcgRXJyb3IodChcImltYWdlV29ya2JlbmNoLm1pc3NpbmdSZXN1bHRcIikpO1xuICAgICAgICAgICAgY29uc3Qgc3RvcmVkID0gYXdhaXQgdXBsb2FkSW1hZ2UoaW1hZ2UuZGF0YVVybCk7XG4gICAgICAgICAgICBjb25zdCBuZXh0SW1hZ2U6IEdlbmVyYXRlZEltYWdlID0geyBpZDogaW1hZ2UuaWQsIGRhdGFVcmw6IHN0b3JlZC51cmwsIC4uLihzdG9yZWQuc3RvcmFnZUtleSA/IHsgc3RvcmFnZUtleTogc3RvcmVkLnN0b3JhZ2VLZXkgfSA6IHt9KSwgZHVyYXRpb25NczogcGVyZm9ybWFuY2Uubm93KCkgLSBpdGVtU3RhcnRlZEF0LCB3aWR0aDogc3RvcmVkLndpZHRoLCBoZWlnaHQ6IHN0b3JlZC5oZWlnaHQsIGJ5dGVzOiBzdG9yZWQuYnl0ZXMsIG1pbWVUeXBlOiBzdG9yZWQubWltZVR5cGUgfTtcbiAgICAgICAgICAgIHNldFJlc3VsdHMoKHZhbHVlKSA9PiB1cGRhdGVSZXN1bHRBdCh2YWx1ZSwgaW5kZXgsIHsgc3RhdHVzOiBcInN1Y2Nlc3NcIiwgaW1hZ2U6IG5leHRJbWFnZSB9KSk7XG4gICAgICAgICAgICByZXR1cm4gbmV4dEltYWdlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgc2V0UmVzdWx0cygodmFsdWUpID0+IHVwZGF0ZVJlc3VsdEF0KHZhbHVlLCBpbmRleCwgeyBzdGF0dXM6IFwiZmFpbGVkXCIsIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IHQoXCJ3b3JrYmVuY2guZ2VuZXJhdGlvbkZhaWxlZFwiKSB9KSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCByZXRyeVJlc3VsdCA9IGFzeW5jIChpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IHNuYXBzaG90ID0gYnVpbGRSZXF1ZXN0U25hcHNob3QoKTtcbiAgICAgICAgaWYgKCFzbmFwc2hvdCkgcmV0dXJuO1xuICAgICAgICBzZXRQcmV2aWV3TG9nKG51bGwpO1xuICAgICAgICBzZXRSZXN1bHRzKCh2YWx1ZSkgPT4gdXBkYXRlUmVzdWx0QXQodmFsdWUsIGluZGV4LCB7IHN0YXR1czogXCJwZW5kaW5nXCIsIGVycm9yOiB1bmRlZmluZWQsIGltYWdlOiB1bmRlZmluZWQgfSkpO1xuICAgICAgICBjb25zdCByZXRyeVN0YXJ0ZWRBdCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgaW1hZ2UgPSBhd2FpdCBydW5HZW5lcmF0aW9uU2xvdChpbmRleCwgc25hcHNob3QpO1xuICAgICAgICAgICAgc2F2ZUxvZyhcbiAgICAgICAgICAgICAgICBidWlsZExvZyh7XG4gICAgICAgICAgICAgICAgICAgIHByb21wdDogc25hcHNob3QudGV4dCxcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZzogeyAuLi5zbmFwc2hvdC5jb25maWcsIGNvdW50OiBcIjFcIiB9LFxuICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2VzOiBzbmFwc2hvdC5yZWZlcmVuY2VzLFxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbk1zOiBwZXJmb3JtYW5jZS5ub3coKSAtIHJldHJ5U3RhcnRlZEF0LFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ291bnQ6IDEsXG4gICAgICAgICAgICAgICAgICAgIGZhaWxDb3VudDogMCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VzOiBbaW1hZ2VdLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIG1lc3NhZ2Uuc3VjY2Vzcyh0KFwid29ya2JlbmNoLnJldHJ5U3VjY2Vzc1wiKSk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgLy8gcnVuR2VuZXJhdGlvblNsb3QgaGFzIGFscmVhZHkgbWFya2VkIHRoZSByZXN1bHQgYXMgZmFpbGVkLlxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBoLWZ1bGwgZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIGJnLXN0b25lLTUwIHRleHQtc3RvbmUtOTAwIGRhcms6Ymctc3RvbmUtOTUwIGRhcms6dGV4dC1zdG9uZS0xMDBcIj5cbiAgICAgICAgICAgIDxtYWluIGNsYXNzTmFtZT1cImdyaWQgbWluLWgtMCBmbGV4LTEgZ3JpZC1jb2xzLTEgZ2FwLTMgb3ZlcmZsb3cteS1hdXRvIHAtMyBsZzpncmlkLWNvbHMtWzMwMHB4X21pbm1heCgwLDFmcildIGxnOm92ZXJmbG93LWhpZGRlbiB4bDpncmlkLWNvbHMtWzMyMHB4X21pbm1heCgwLDFmcildXCI+XG4gICAgICAgICAgICAgICAgPGFzaWRlIGNsYXNzTmFtZT1cInRoaW4tc2Nyb2xsYmFyIGhpZGRlbiBtaW4taC0wIG92ZXJmbG93LXktYXV0byByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItc3RvbmUtMjAwIGJnLWNhcmQgcC00IHNoYWRvdy1zbSBkYXJrOmJvcmRlci1zdG9uZS04MDAgbGc6YmxvY2tcIj5cbiAgICAgICAgICAgICAgICAgICAgPExvZ1BhbmVsXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dzPXtsb2dzfVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRMb2dJZHM9e3NlbGVjdGVkTG9nSWRzfVxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlTG9nSWQ9e3ByZXZpZXdMb2c/LmlkfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25TZWxlY3RlZExvZ0lkc0NoYW5nZT17c2V0U2VsZWN0ZWRMb2dJZHN9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNyZWF0ZVNlc3Npb249e2NyZWF0ZVNlc3Npb259XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkRlbGV0ZVNlbGVjdGVkPXsoKSA9PiBzZXREZWxldGVDb25maXJtT3Blbih0cnVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uUHJldmlld0xvZz17KGxvZykgPT4gdm9pZCBwcmV2aWV3R2VuZXJhdGlvbkxvZyhsb2cpfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvYXNpZGU+XG5cbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJncmlkIGdhcC0zIGxnOm1pbi1oLTAgbGc6b3ZlcmZsb3ctaGlkZGVuIHhsOmdyaWQtY29scy1bNDIwcHhfbWlubWF4KDAsMWZyKV1cIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0aGluLXNjcm9sbGJhciBmbGV4IGZsZXgtY29sIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci1zdG9uZS0yMDAgYmctY2FyZCBwLTQgc2hhZG93LXNtIGRhcms6Ym9yZGVyLXN0b25lLTgwMCBsZzptaW4taC0wIGxnOm92ZXJmbG93LXktYXV0b1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtc3RhcnQganVzdGlmeS1iZXR3ZWVuIGdhcC0zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtc2VtaWJvbGQgdGV4dC1zdG9uZS05NTAgZGFyazp0ZXh0LXN0b25lLTEwMFwiPnt0KFwiaW1hZ2VXb3JrYmVuY2gudGl0bGVcIil9PC9oMT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBzaHJpbmstMCBnYXAtMiBsZzpoaWRkZW5cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gaWNvbj17PEhpc3RvcnkgY2xhc3NOYW1lPVwic2l6ZS00XCIgLz59IG9uQ2xpY2s9eygpID0+IHNldExvZ3NPcGVuKHRydWUpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dChcIndvcmtiZW5jaC5sb2dzXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIGljb249ezxTbGlkZXJzSG9yaXpvbnRhbCBjbGFzc05hbWU9XCJzaXplLTRcIiAvPn0gb25DbGljaz17KCkgPT4gc2V0U2V0dGluZ3NPcGVuKHRydWUpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dChcIndvcmtiZW5jaC5zZXR0aW5nc1wiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTYgc3BhY2UteS01XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYi0yIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtM1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1iYXNlIGZvbnQtc2VtaWJvbGRcIj57dChcIndvcmtiZW5jaC5wcm9tcHRcIil9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiBzaXplPVwic21hbGxcIiBpY29uPXs8Qm9va09wZW4gY2xhc3NOYW1lPVwic2l6ZS0zLjVcIiAvPn0gb25DbGljaz17KCkgPT4gc2V0UHJvbXB0RGlhbG9nT3Blbih0cnVlKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0KFwid29ya2JlbmNoLnZpZXdQcm9tcHRzXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cInNtYWxsXCIgaWNvbj17PEZvbGRlclBsdXMgY2xhc3NOYW1lPVwic2l6ZS0zLjVcIiAvPn0gb25DbGljaz17KCkgPT4gc2V0QXNzZXRQaWNrZXJPcGVuKHRydWUpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3QoXCJ3b3JrYmVuY2gudmlld0Fzc2V0c1wiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPElucHV0LlRleHRBcmVhIHZhbHVlPXtwcm9tcHR9IG9uQ2hhbmdlPXsoZXZlbnQpID0+IHNldFByb21wdChldmVudC50YXJnZXQudmFsdWUpfSByb3dzPXs3fSBwbGFjZWhvbGRlcj17dChcImltYWdlV29ya2JlbmNoLnByb21wdFBsYWNlaG9sZGVyXCIpfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWItMiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtYmFzZSBmb250LXNlbWlib2xkXCI+e3QoXCJpbWFnZVdvcmtiZW5jaC5yZWZlcmVuY2VzXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cInNtYWxsXCIgaWNvbj17PENsaXBib2FyZFBhc3RlIGNsYXNzTmFtZT1cInNpemUtMy41XCIgLz59IG9uQ2xpY2s9eygpID0+IHZvaWQgYWRkUmVmZXJlbmNlc0Zyb21DbGlwYm9hcmQoKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0KFwid29ya2JlbmNoLmNsaXBib2FyZFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIHNpemU9XCJzbWFsbFwiIGljb249ezxVcGxvYWQgY2xhc3NOYW1lPVwic2l6ZS0zLjVcIiAvPn0gb25DbGljaz17KCkgPT4gZmlsZUlucHV0UmVmLmN1cnJlbnQ/LmNsaWNrKCl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dChcIndvcmtiZW5jaC51cGxvYWRcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGhvdmVyLXNjcm9sbGJhciBob3Zlci1zY3JvbGxiYXItaGludCByZWxhdGl2ZSBmbGV4IG1pbi1oLTI0IHctZnVsbCBtaW4tdy0wIG1heC13LWZ1bGwgZ2FwLTIgb3ZlcmZsb3cteC1zY3JvbGwgb3ZlcmZsb3cteS1oaWRkZW4gcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLWRhc2hlZCBwLTIgcGItMyBvdmVyc2Nyb2xsLXgtY29udGFpbiB0cmFuc2l0aW9uLWNvbG9ycyAke2lzUmVmZXJlbmNlRHJhZ0FjdGl2ZSA/IFwiYm9yZGVyLXN0b25lLTkwMCBiZy1zdG9uZS0xMDAvODAgZGFyazpib3JkZXItc3RvbmUtMTAwIGRhcms6Ymctc3RvbmUtOTAwLzgwXCIgOiBcImJvcmRlci1zdG9uZS0zMDAgZGFyazpib3JkZXItc3RvbmUtNzAwXCJ9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRHJhZ0VudGVyPXsoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdEZXB0aFJlZi5jdXJyZW50ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGFUcmFuc2Zlci50eXBlcy5pbmNsdWRlcyhcIkZpbGVzXCIpKSBzZXRJc1JlZmVyZW5jZURyYWdBY3RpdmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EcmFnT3Zlcj17KGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IFwiY29weVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRHJhZ0xlYXZlPXsoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdEZXB0aFJlZi5jdXJyZW50ID0gTWF0aC5tYXgoMCwgZHJhZ0RlcHRoUmVmLmN1cnJlbnQgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRyYWdEZXB0aFJlZi5jdXJyZW50KSBzZXRJc1JlZmVyZW5jZURyYWdBY3RpdmUoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRHJvcD17KGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcmFnRGVwdGhSZWYuY3VycmVudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0SXNSZWZlcmVuY2VEcmFnQWN0aXZlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2b2lkIGFkZFJlZmVyZW5jZXMoZXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbldoZWVsPXsoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQuY3VycmVudFRhcmdldC5zY3JvbGxXaWR0aCA8PSBldmVudC5jdXJyZW50VGFyZ2V0LmNsaWVudFdpZHRoKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0LnNjcm9sbExlZnQgKz0gZXZlbnQuZGVsdGFZO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3JlZmVyZW5jZXMubWFwKChpdGVtLCBpbmRleCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtpdGVtLmlkfSBjbGFzc05hbWU9XCJncm91cCByZWxhdGl2ZSBzaXplLTIwIHNocmluay0wIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLW1kIGJvcmRlciBib3JkZXItc3RvbmUtMjAwIGRhcms6Ym9yZGVyLXN0b25lLTgwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17aXRlbS5kYXRhVXJsfSBhbHQ9e2l0ZW0ubmFtZX0gY2xhc3NOYW1lPVwic2l6ZS1mdWxsIG9iamVjdC1jb3ZlclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFic29sdXRlIGxlZnQtMSB0b3AtMSByb3VuZGVkIGJnLWJsYWNrLzYwIHB4LTEuNSBweS0wLjUgdGV4dC1bMTBweF0gZm9udC1tZWRpdW0gdGV4dC13aGl0ZVwiPntpbWFnZVJlZmVyZW5jZUxhYmVsKGluZGV4KX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxSZWZlcmVuY2VPcmRlckJ1dHRvbnMgaW5kZXg9e2luZGV4fSB0b3RhbD17cmVmZXJlbmNlcy5sZW5ndGh9IG9uTW92ZT17KG9mZnNldCkgPT4gc2V0UmVmZXJlbmNlcygodmFsdWUpID0+IG1vdmVMaXN0SXRlbSh2YWx1ZSwgaW5kZXgsIG9mZnNldCkpfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImFic29sdXRlIHJpZ2h0LTEgdG9wLTEgaGlkZGVuIHNpemUtNiBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcm91bmRlZCBiZy1ibGFjay82MCB0ZXh0LXdoaXRlIGdyb3VwLWhvdmVyOmZsZXhcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0UmVmZXJlbmNlcygodmFsdWUpID0+IHZhbHVlLmZpbHRlcigocmVmKSA9PiByZWYuaWQgIT09IGl0ZW0uaWQpKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9e3QoXCJpbWFnZVdvcmtiZW5jaC5yZW1vdmVSZWZlcmVuY2VcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUcmFzaDIgY2xhc3NOYW1lPVwic2l6ZS0zLjVcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyFyZWZlcmVuY2VzLmxlbmd0aCA/IDxkaXYgY2xhc3NOYW1lPVwiZmxleCBtaW4tdy1mdWxsIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LXNtIHRleHQtc3RvbmUtNTAwXCI+e2lzUmVmZXJlbmNlRHJhZ0FjdGl2ZSA/IHQoXCJpbWFnZVdvcmtiZW5jaC5kcm9wUmVmZXJlbmNlc1wiKSA6IHQoXCJpbWFnZVdvcmtiZW5jaC5ub1JlZmVyZW5jZXNcIil9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItc3RvbmUtMjAwIGJnLXN0b25lLTUwIHB4LTMgcHktMiB0ZXh0LXNtIGRhcms6Ym9yZGVyLXN0b25lLTgwMCBkYXJrOmJnLXN0b25lLTkwMCBzbTpoaWRkZW5cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidHJ1bmNhdGUgdGV4dC1zdG9uZS01MDAgZGFyazp0ZXh0LXN0b25lLTQwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge21vZGVsT3B0aW9uTGFiZWwoZWZmZWN0aXZlQ29uZmlnLCBtb2RlbCl9IMK3IHtlZmZlY3RpdmVDb25maWcuc2l6ZX0gwrcge2VmZmVjdGl2ZUNvbmZpZy5xdWFsaXR5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cInNtYWxsXCIgdHlwZT1cInRleHRcIiBpY29uPXs8U2xpZGVyc0hvcml6b250YWwgY2xhc3NOYW1lPVwic2l6ZS00XCIgLz59IG9uQ2xpY2s9eygpID0+IHNldFNldHRpbmdzT3Blbih0cnVlKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dChcIndvcmtiZW5jaC5hZGp1c3RcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRkZW4gZ2FwLTQgc206Z3JpZCBzbTpncmlkLWNvbHMtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8R2VuZXJhdGlvblNldHRpbmdzIGNvbmZpZz17ZWZmZWN0aXZlQ29uZmlnfSBtb2RlbD17bW9kZWx9IHVwZGF0ZUNvbmZpZz17dXBkYXRlQ29uZmlnfSBvcGVuQ29uZmlnRGlhbG9nPXtvcGVuQ29uZmlnRGlhbG9nfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtYXV0byBwdC02XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiB0eXBlPVwicHJpbWFyeVwiIHNpemU9XCJsYXJnZVwiIGJsb2NrIGljb249ezxTcGFya2xlcyBjbGFzc05hbWU9XCJzaXplLTRcIiAvPn0gbG9hZGluZz17cnVubmluZ30gZGlzYWJsZWQ9eyFjYW5HZW5lcmF0ZSB8fCBydW5uaW5nfSBvbkNsaWNrPXsoKSA9PiB2b2lkIGdlbmVyYXRlKCl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dChcIndvcmtiZW5jaC5nZW5lcmF0ZVwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRoaW4tc2Nyb2xsYmFyIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci1zdG9uZS0yMDAgYmctY2FyZCBwLTQgc2hhZG93LXNtIGRhcms6Ym9yZGVyLXN0b25lLTgwMCBsZzptaW4taC0wIGxnOm92ZXJmbG93LXktYXV0byBsZzpwLTVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWItNCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LXNlbWlib2xkXCI+e3QoXCJ3b3JrYmVuY2gucmVzdWx0c1wiKX08L2gyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtydW5uaW5nID8gPFRhZyBjbGFzc05hbWU9XCJtLTAgcHgtMiBweS0xXCI+e3QoXCJ3b3JrYmVuY2gud2FpdGluZ1wiLCB7IHRpbWU6IGZvcm1hdER1cmF0aW9uKGVsYXBzZWRNcykgfSl9PC9UYWc+IDogbnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAge3Jlc3VsdHMubGVuZ3RoID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBnYXAtNCBzbTpncmlkLWNvbHMtMiAyeGw6Z3JpZC1jb2xzLTNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3Jlc3VsdHMubWFwKChyZXN1bHQsIGluZGV4KSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnN0YXR1cyA9PT0gXCJzdWNjZXNzXCIgJiYgcmVzdWx0LmltYWdlID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxSZXN1bHRJbWFnZUNhcmQga2V5PXtyZXN1bHQuaWR9IGltYWdlPXtyZXN1bHQuaW1hZ2V9IGluZGV4PXtpbmRleH0gb25FZGl0PXthZGRSZXN1bHRUb1JlZmVyZW5jZXN9IG9uRG93bmxvYWQ9e2Rvd25sb2FkSW1hZ2V9IG9uU2F2ZUFzc2V0PXtzYXZlUmVzdWx0VG9Bc3NldHN9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogcmVzdWx0LnN0YXR1cyA9PT0gXCJmYWlsZWRcIiA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RmFpbGVkSW1hZ2VDYXJkIGtleT17cmVzdWx0LmlkfSBlcnJvcj17cmVzdWx0LmVycm9yIHx8IHQoXCJ3b3JrYmVuY2guZ2VuZXJhdGlvbkZhaWxlZFwiKX0gb25SZXRyeT17KCkgPT4gcmV0cnlSZXN1bHQoaW5kZXgpfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UGVuZGluZ0ltYWdlQ2FyZCBrZXk9e3Jlc3VsdC5pZH0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBtaW4taC1bMzIwcHhdIGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItZGFzaGVkIGJvcmRlci1zdG9uZS0zMDAgdGV4dC1jZW50ZXIgZGFyazpib3JkZXItc3RvbmUtNzAwIGxnOm1pbi1oLVs1NjBweF1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEltYWdlUGx1cyBjbGFzc05hbWU9XCJtYi00IHNpemUtMTEgdGV4dC1zdG9uZS00MDBcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RW1wdHkgaW1hZ2U9e0VtcHR5LlBSRVNFTlRFRF9JTUFHRV9TSU1QTEV9IGRlc2NyaXB0aW9uPXt0KFwiaW1hZ2VXb3JrYmVuY2guZW1wdHlcIil9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XG4gICAgICAgICAgICA8L21haW4+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICByZWY9e2ZpbGVJbnB1dFJlZn1cbiAgICAgICAgICAgICAgICB0eXBlPVwiZmlsZVwiXG4gICAgICAgICAgICAgICAgYWNjZXB0PVwiaW1hZ2UvKlwiXG4gICAgICAgICAgICAgICAgbXVsdGlwbGVcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJoaWRkZW5cIlxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdm9pZCBhZGRSZWZlcmVuY2VzKGV2ZW50LnRhcmdldC5maWxlcyk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnRhcmdldC52YWx1ZSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8RHJhd2VyIHRpdGxlPXt0KFwid29ya2JlbmNoLmxvZ3NcIil9IHBsYWNlbWVudD1cImJvdHRvbVwiIHNpemU9XCJsYXJnZVwiIG9wZW49e2xvZ3NPcGVufSBvbkNsb3NlPXsoKSA9PiBzZXRMb2dzT3BlbihmYWxzZSl9PlxuICAgICAgICAgICAgICAgIDxMb2dQYW5lbFxuICAgICAgICAgICAgICAgICAgICBsb2dzPXtsb2dzfVxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZExvZ0lkcz17c2VsZWN0ZWRMb2dJZHN9XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZUxvZ0lkPXtwcmV2aWV3TG9nPy5pZH1cbiAgICAgICAgICAgICAgICAgICAgb25TZWxlY3RlZExvZ0lkc0NoYW5nZT17c2V0U2VsZWN0ZWRMb2dJZHN9XG4gICAgICAgICAgICAgICAgICAgIG9uQ3JlYXRlU2Vzc2lvbj17Y3JlYXRlU2Vzc2lvbn1cbiAgICAgICAgICAgICAgICAgICAgb25EZWxldGVTZWxlY3RlZD17KCkgPT4gc2V0RGVsZXRlQ29uZmlybU9wZW4odHJ1ZSl9XG4gICAgICAgICAgICAgICAgICAgIG9uUHJldmlld0xvZz17KGxvZykgPT4gdm9pZCBwcmV2aWV3R2VuZXJhdGlvbkxvZyhsb2cpfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L0RyYXdlcj5cbiAgICAgICAgICAgIDxEcmF3ZXIgdGl0bGU9e3QoXCJ3b3JrYmVuY2guc2V0dGluZ3NcIil9IHBsYWNlbWVudD1cImJvdHRvbVwiIHNpemU9XCI4MnZoXCIgb3Blbj17c2V0dGluZ3NPcGVufSBvbkNsb3NlPXsoKSA9PiBzZXRTZXR0aW5nc09wZW4oZmFsc2UpfT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTMgcGItNFwiPlxuICAgICAgICAgICAgICAgICAgICA8R2VuZXJhdGlvblNldHRpbmdzIGNvbmZpZz17ZWZmZWN0aXZlQ29uZmlnfSBtb2RlbD17bW9kZWx9IHVwZGF0ZUNvbmZpZz17dXBkYXRlQ29uZmlnfSBvcGVuQ29uZmlnRGlhbG9nPXtvcGVuQ29uZmlnRGlhbG9nfSAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9EcmF3ZXI+XG4gICAgICAgICAgICA8UHJvbXB0U2VsZWN0RGlhbG9nIG9wZW49e3Byb21wdERpYWxvZ09wZW59IG9uT3BlbkNoYW5nZT17c2V0UHJvbXB0RGlhbG9nT3Blbn0gb25TZWxlY3Q9e3NldFByb21wdH0gLz5cbiAgICAgICAgICAgIDxBc3NldFBpY2tlck1vZGFsIG9wZW49e2Fzc2V0UGlja2VyT3Blbn0gZGVmYXVsdFRhYj1cIm15LWFzc2V0c1wiIG9uSW5zZXJ0PXsocGF5bG9hZCkgPT4gdm9pZCBpbnNlcnRQaWNrZWRBc3NldChwYXlsb2FkKX0gb25DbG9zZT17KCkgPT4gc2V0QXNzZXRQaWNrZXJPcGVuKGZhbHNlKX0gLz5cbiAgICAgICAgICAgIDxNb2RhbCB0aXRsZT17dChcIndvcmtiZW5jaC5kZWxldGVMb2dzXCIpfSBvcGVuPXtkZWxldGVDb25maXJtT3Blbn0gb25DYW5jZWw9eygpID0+IHNldERlbGV0ZUNvbmZpcm1PcGVuKGZhbHNlKX0gb25Paz17ZGVsZXRlU2VsZWN0ZWRMb2dzfSBva1RleHQ9e3QoXCJjb21tb24uZGVsZXRlXCIpfSBva0J1dHRvblByb3BzPXt7IGRhbmdlcjogdHJ1ZSB9fSBjYW5jZWxUZXh0PXt0KFwiY29tbW9uLmNhbmNlbFwiKX0+XG4gICAgICAgICAgICAgICAge3QoXCJ3b3JrYmVuY2guZGVsZXRlTG9nc0NvbmZpcm1cIiwgeyBjb3VudDogc2VsZWN0ZWRMb2dJZHMubGVuZ3RoIH0pfVxuICAgICAgICAgICAgPC9Nb2RhbD5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cblxuZnVuY3Rpb24gR2VuZXJhdGlvblNldHRpbmdzKHsgY29uZmlnLCBtb2RlbCwgdXBkYXRlQ29uZmlnLCBvcGVuQ29uZmlnRGlhbG9nIH06IHsgY29uZmlnOiBBaUNvbmZpZzsgbW9kZWw6IHN0cmluZzsgdXBkYXRlQ29uZmlnOiBVcGRhdGVBaUNvbmZpZzsgb3BlbkNvbmZpZ0RpYWxvZzogKHNob3VsZFByb21wdENvbnRpbnVlPzogYm9vbGVhbikgPT4gdm9pZCB9KSB7XG4gICAgY29uc3QgdGhlbWUgPSBjYW52YXNUaGVtZXNbdXNlVGhlbWVTdG9yZSgoc3RhdGUpID0+IHN0YXRlLnRoZW1lKV07XG4gICAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPD5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJjb2wtc3Bhbi0yIGJsb2NrIG1pbi13LTAgc206Y29sLXNwYW4tMVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1iLTEuNSBibG9jayB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgc206bWItMiBzbTp0ZXh0LWJhc2VcIj57dChcIndvcmtiZW5jaC5tb2RlbFwiKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPE1vZGVsUGlja2VyIGNvbmZpZz17Y29uZmlnfSB2YWx1ZT17bW9kZWx9IG9uQ2hhbmdlPXsodmFsdWUpID0+IHVwZGF0ZUNvbmZpZyhcImltYWdlTW9kZWxcIiwgdmFsdWUpfSBjYXBhYmlsaXR5PVwiaW1hZ2VcIiBmdWxsV2lkdGggb25NaXNzaW5nQ29uZmlnPXsoKSA9PiBvcGVuQ29uZmlnRGlhbG9nKGZhbHNlKX0gLz5cbiAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1zcGFuLTJcIj5cbiAgICAgICAgICAgICAgICA8SW1hZ2VTZXR0aW5nc1BhbmVsIGNvbmZpZz17Y29uZmlnfSBvbkNvbmZpZ0NoYW5nZT17KGtleSwgdmFsdWUpID0+IHVwZGF0ZUNvbmZpZyhrZXksIHZhbHVlKX0gdGhlbWU9e3RoZW1lfSBzaG93VGl0bGU9e2ZhbHNlfSBjbGFzc05hbWU9XCJzcGFjZS15LTRcIiBtYXhDb3VudD17MTB9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgKTtcbn1cblxuZnVuY3Rpb24gUmVzdWx0SW1hZ2VDYXJkKHtcbiAgICBpbWFnZSxcbiAgICBpbmRleCxcbiAgICBvbkVkaXQsXG4gICAgb25Eb3dubG9hZCxcbiAgICBvblNhdmVBc3NldCxcbn06IHtcbiAgICBpbWFnZTogR2VuZXJhdGVkSW1hZ2U7XG4gICAgaW5kZXg6IG51bWJlcjtcbiAgICBvbkVkaXQ6IChpbWFnZTogR2VuZXJhdGVkSW1hZ2UsIGluZGV4OiBudW1iZXIpID0+IHZvaWQ7XG4gICAgb25Eb3dubG9hZDogKGltYWdlOiBHZW5lcmF0ZWRJbWFnZSwgaW5kZXg6IG51bWJlcikgPT4gdm9pZDtcbiAgICBvblNhdmVBc3NldDogKGltYWdlOiBHZW5lcmF0ZWRJbWFnZSwgaW5kZXg6IG51bWJlcikgPT4gdm9pZDtcbn0pIHtcbiAgICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXN0b25lLTIwMCBiZy1iYWNrZ3JvdW5kIGRhcms6Ym9yZGVyLXN0b25lLTgwMFwiPlxuICAgICAgICAgICAgPEltYWdlIHNyYz17aW1hZ2UuZGF0YVVybH0gYWx0PXt0KFwiaW1hZ2VXb3JrYmVuY2gucmVzdWx0QWx0XCIsIHsgY291bnQ6IGluZGV4ICsgMSB9KX0gY2xhc3NOYW1lPVwiYXNwZWN0LXNxdWFyZSBvYmplY3QtY292ZXJcIiAvPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTIgYm9yZGVyLXQgYm9yZGVyLXN0b25lLTIwMCBweC0zIHB5LTIuNSBkYXJrOmJvcmRlci1zdG9uZS04MDBcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggbWluLXctMCBnYXAteC0yIGdhcC15LTEgdGV4dC14cyB0ZXh0LXN0b25lLTUwMCBkYXJrOnRleHQtc3RvbmUtNDAwXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge2ltYWdlLndpZHRofXh7aW1hZ2UuaGVpZ2h0fVxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPntmb3JtYXRCeXRlcyhpbWFnZS5ieXRlcyl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj57Zm9ybWF0RHVyYXRpb24oaW1hZ2UuZHVyYXRpb25Ncyl9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBtaW4tdy0wIGdyaWQtY29scy0zIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgIDxUb29sdGlwIHRpdGxlPXt0KFwiY29tbW9uLmFkZFRvQXNzZXRzXCIpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gY2xhc3NOYW1lPXtSRVNVTFRfQUNUSU9OX0JVVFRPTl9DTEFTU30gc2l6ZT1cInNtYWxsXCIgaWNvbj17PEZvbGRlclBsdXMgY2xhc3NOYW1lPVwic2l6ZS0zLjVcIiAvPn0gb25DbGljaz17KCkgPT4gdm9pZCBvblNhdmVBc3NldChpbWFnZSwgaW5kZXgpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dChcImNvbW1vbi5hZGRUb0Fzc2V0c1wiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L1Rvb2x0aXA+XG4gICAgICAgICAgICAgICAgICAgIDxUb29sdGlwIHRpdGxlPXt0KFwiaW1hZ2VXb3JrYmVuY2guYWRkUmVmZXJlbmNlXCIpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gY2xhc3NOYW1lPXtSRVNVTFRfQUNUSU9OX0JVVFRPTl9DTEFTU30gc2l6ZT1cInNtYWxsXCIgaWNvbj17PFBlbkxpbmUgY2xhc3NOYW1lPVwic2l6ZS0zLjVcIiAvPn0gb25DbGljaz17KCkgPT4gdm9pZCBvbkVkaXQoaW1hZ2UsIGluZGV4KX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3QoXCJpbWFnZVdvcmtiZW5jaC5hZGRSZWZlcmVuY2VcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9Ub29sdGlwPlxuICAgICAgICAgICAgICAgICAgICA8VG9vbHRpcCB0aXRsZT17dChcImNvbW1vbi5kb3dubG9hZFwiKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIGNsYXNzTmFtZT17UkVTVUxUX0FDVElPTl9CVVRUT05fQ0xBU1N9IHNpemU9XCJzbWFsbFwiIGljb249ezxEb3dubG9hZCBjbGFzc05hbWU9XCJzaXplLTMuNVwiIC8+fSBvbkNsaWNrPXsoKSA9PiBvbkRvd25sb2FkKGltYWdlLCBpbmRleCl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0KFwiY29tbW9uLmRvd25sb2FkXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvVG9vbHRpcD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufVxuXG5mdW5jdGlvbiBQZW5kaW5nSW1hZ2VDYXJkKCkge1xuICAgIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIGFzcGVjdC1zcXVhcmUgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci1kYXNoZWQgYm9yZGVyLXN0b25lLTMwMCBiZy1zdG9uZS01MCBkYXJrOmJvcmRlci1zdG9uZS03MDAgZGFyazpiZy1zdG9uZS05MDBcIj5cbiAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIG9wYWNpdHktNjBcIlxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRJbWFnZTogXCJyYWRpYWwtZ3JhZGllbnQoY2lyY2xlLCByZ2JhKDEyMCwxMTMsMTA4LDAuMzUpIDEuNHB4LCB0cmFuc3BhcmVudCAxLjZweClcIixcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZFNpemU6IFwiMTZweCAxNnB4XCIsXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTIgdGV4dC1zbSB0ZXh0LXN0b25lLTUwMCBkYXJrOnRleHQtc3RvbmUtNDAwXCI+XG4gICAgICAgICAgICAgICAgPExvYWRlckNpcmNsZSBjbGFzc05hbWU9XCJzaXplLTYgYW5pbWF0ZS1zcGluXCIgLz5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChcIndvcmtiZW5jaC5nZW5lcmF0aW5nXCIpfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufVxuXG5mdW5jdGlvbiBGYWlsZWRJbWFnZUNhcmQoeyBlcnJvciwgb25SZXRyeSB9OiB7IGVycm9yOiBzdHJpbmc7IG9uUmV0cnk6ICgpID0+IHZvaWQgfSkge1xuICAgIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm92ZXJmbG93LWhpZGRlbiByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItcmVkLTIwMCBiZy1yZWQtNTAgZGFyazpib3JkZXItcmVkLTk1MCBkYXJrOmJnLXJlZC05NTAvMjBcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBhc3BlY3Qtc3F1YXJlIGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMyBwLTUgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1yZWQtNjAwIGRhcms6dGV4dC1yZWQtMzAwXCI+e3QoXCJ3b3JrYmVuY2guZmFpbGVkXCIpfTwvZGl2PlxuICAgICAgICAgICAgICAgIDxUeXBvZ3JhcGh5LlBhcmFncmFwaCBlbGxpcHNpcz17eyByb3dzOiA0IH19IGNsYXNzTmFtZT1cIiFtYi0wICF0ZXh0LXhzICF0ZXh0LXJlZC01MDAgZGFyazohdGV4dC1yZWQtMzAwXCI+XG4gICAgICAgICAgICAgICAgICAgIHtlcnJvcn1cbiAgICAgICAgICAgICAgICA8L1R5cG9ncmFwaHkuUGFyYWdyYXBoPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1lbmQgYm9yZGVyLXQgYm9yZGVyLXJlZC0yMDAgcC0zIGRhcms6Ym9yZGVyLXJlZC05NTBcIj5cbiAgICAgICAgICAgICAgICA8QnV0dG9uIHNpemU9XCJzbWFsbFwiIGRhbmdlciBvbkNsaWNrPXtvblJldHJ5fT5cbiAgICAgICAgICAgICAgICAgICAge3QoXCJ3b3JrYmVuY2gucmV0cnlcIil9XG4gICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlUmVzdWx0QXQocmVzdWx0czogR2VuZXJhdGlvblJlc3VsdFtdLCBpbmRleDogbnVtYmVyLCBuZXh0OiBQYXJ0aWFsPEdlbmVyYXRpb25SZXN1bHQ+KSB7XG4gICAgcmV0dXJuIHJlc3VsdHMubWFwKChpdGVtLCBpdGVtSW5kZXgpID0+IChpdGVtSW5kZXggPT09IGluZGV4ID8geyAuLi5pdGVtLCAuLi5uZXh0IH0gOiBpdGVtKSk7XG59XG5cbmZ1bmN0aW9uIExvZ1BhbmVsKHtcbiAgICBsb2dzLFxuICAgIHNlbGVjdGVkTG9nSWRzLFxuICAgIGFjdGl2ZUxvZ0lkLFxuICAgIG9uU2VsZWN0ZWRMb2dJZHNDaGFuZ2UsXG4gICAgb25DcmVhdGVTZXNzaW9uLFxuICAgIG9uRGVsZXRlU2VsZWN0ZWQsXG4gICAgb25QcmV2aWV3TG9nLFxufToge1xuICAgIGxvZ3M6IEdlbmVyYXRpb25Mb2dbXTtcbiAgICBzZWxlY3RlZExvZ0lkczogc3RyaW5nW107XG4gICAgYWN0aXZlTG9nSWQ/OiBzdHJpbmc7XG4gICAgb25TZWxlY3RlZExvZ0lkc0NoYW5nZTogKGlkczogc3RyaW5nW10pID0+IHZvaWQ7XG4gICAgb25DcmVhdGVTZXNzaW9uOiAoKSA9PiB2b2lkO1xuICAgIG9uRGVsZXRlU2VsZWN0ZWQ6ICgpID0+IHZvaWQ7XG4gICAgb25QcmV2aWV3TG9nOiAobG9nOiBHZW5lcmF0aW9uTG9nKSA9PiB2b2lkO1xufSkge1xuICAgIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgICBjb25zdCBhbGxTZWxlY3RlZCA9IEJvb2xlYW4obG9ncy5sZW5ndGgpICYmIHNlbGVjdGVkTG9nSWRzLmxlbmd0aCA9PT0gbG9ncy5sZW5ndGg7XG4gICAgY29uc3QgdG9nZ2xlQWxsID0gKCkgPT4gb25TZWxlY3RlZExvZ0lkc0NoYW5nZShhbGxTZWxlY3RlZCA/IFtdIDogbG9ncy5tYXAoKGxvZykgPT4gbG9nLmlkKSk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYi0zIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtM1wiPlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KFwid29ya2JlbmNoLmxvZ3NcIil9PC9oMj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8VGFnIGNsYXNzTmFtZT1cIm0tMFwiPntsb2dzLmxlbmd0aH08L1RhZz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYi00IGZsZXggZmxleC13cmFwIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPEJ1dHRvbiBzaXplPVwic21hbGxcIiBpY29uPXs8UGx1cyBjbGFzc05hbWU9XCJzaXplLTMuNVwiIC8+fSBvbkNsaWNrPXtvbkNyZWF0ZVNlc3Npb259PlxuICAgICAgICAgICAgICAgICAgICB7dChcIndvcmtiZW5jaC5uZXdcIil9XG4gICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgPEJ1dHRvbiBzaXplPVwic21hbGxcIiBpY29uPXs8Q2hlY2tTcXVhcmUgY2xhc3NOYW1lPVwic2l6ZS0zLjVcIiAvPn0gZGlzYWJsZWQ9eyFsb2dzLmxlbmd0aH0gb25DbGljaz17dG9nZ2xlQWxsfT5cbiAgICAgICAgICAgICAgICAgICAge2FsbFNlbGVjdGVkID8gdChcImNvbW1vbi5jYW5jZWxcIikgOiB0KFwid29ya2JlbmNoLnNlbGVjdEFsbFwiKX1cbiAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICA8QnV0dG9uIHNpemU9XCJzbWFsbFwiIGRhbmdlciBpY29uPXs8VHJhc2gyIGNsYXNzTmFtZT1cInNpemUtMy41XCIgLz59IGRpc2FibGVkPXshc2VsZWN0ZWRMb2dJZHMubGVuZ3RofSBvbkNsaWNrPXtvbkRlbGV0ZVNlbGVjdGVkfT5cbiAgICAgICAgICAgICAgICAgICAge3QoXCJjb21tb24uZGVsZXRlXCIpfVxuICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktM1wiPlxuICAgICAgICAgICAgICAgIHtsb2dzLm1hcCgobG9nKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDxMb2dDYXJkXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2xvZy5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZz17bG9nfVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQ9e3NlbGVjdGVkTG9nSWRzLmluY2x1ZGVzKGxvZy5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmU9e2FjdGl2ZUxvZ0lkID09PSBsb2cuaWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvblNlbGVjdGVkQ2hhbmdlPXsoY2hlY2tlZCkgPT4gb25TZWxlY3RlZExvZ0lkc0NoYW5nZShjaGVja2VkID8gWy4uLnNlbGVjdGVkTG9nSWRzLCBsb2cuaWRdIDogc2VsZWN0ZWRMb2dJZHMuZmlsdGVyKChpZCkgPT4gaWQgIT09IGxvZy5pZCkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gb25QcmV2aWV3TG9nKGxvZyl9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgeyFsb2dzLmxlbmd0aCA/IDxkaXYgY2xhc3NOYW1lPVwiZmxleCBtaW4taC00OCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLWRhc2hlZCBib3JkZXItc3RvbmUtMzAwIHRleHQtY2VudGVyIHRleHQtc20gdGV4dC1zdG9uZS01MDAgZGFyazpib3JkZXItc3RvbmUtNzAwXCI+e3QoXCJ3b3JrYmVuY2gubm9Mb2dzXCIpfTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgKTtcbn1cblxuZnVuY3Rpb24gTG9nQ2FyZCh7IGxvZywgc2VsZWN0ZWQsIGFjdGl2ZSwgb25TZWxlY3RlZENoYW5nZSwgb25DbGljayB9OiB7IGxvZzogR2VuZXJhdGlvbkxvZzsgc2VsZWN0ZWQ6IGJvb2xlYW47IGFjdGl2ZTogYm9vbGVhbjsgb25TZWxlY3RlZENoYW5nZTogKGNoZWNrZWQ6IGJvb2xlYW4pID0+IHZvaWQ7IG9uQ2xpY2s6ICgpID0+IHZvaWQgfSkge1xuICAgIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgICBjb25zdCB0aHVtYm5haWxzID0gKGxvZy50aHVtYm5haWxzIHx8IFtdKS5maWx0ZXIoQm9vbGVhbikuc2xpY2UoMCwgNCk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGJsb2NrIHctZnVsbCByb3VuZGVkLWxnIGJvcmRlciBwLTIgdGV4dC1sZWZ0IHRyYW5zaXRpb24gJHthY3RpdmUgPyBcImJvcmRlci1zdG9uZS05MDAgYmctYmx1ZS01MCBkYXJrOmJvcmRlci1zdG9uZS0xMDAgZGFyazpiZy1ibHVlLTk1MC8yMFwiIDogXCJib3JkZXItc3RvbmUtMjAwIGJnLWJhY2tncm91bmQgaG92ZXI6Ymctc3RvbmUtNTAgZGFyazpib3JkZXItc3RvbmUtODAwIGRhcms6aG92ZXI6Ymctc3RvbmUtOTAwXCJ9YH1cbiAgICAgICAgICAgIG9uQ2xpY2s9e29uQ2xpY2t9XG4gICAgICAgID5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtW21pbm1heCgxMjhweCwxZnIpX2F1dG9dIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIG1pbi13LTAgZ3JpZC1jb2xzLVthdXRvX21pbm1heCgwLDFmcildIGl0ZW1zLXN0YXJ0IGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgIDxDaGVja2JveCBjbGFzc05hbWU9XCJtdC0wLjVcIiBjaGVja2VkPXtzZWxlY3RlZH0gb25DbGljaz17KGV2ZW50KSA9PiBldmVudC5zdG9wUHJvcGFnYXRpb24oKX0gb25DaGFuZ2U9eyhldmVudCkgPT4gb25TZWxlY3RlZENoYW5nZShldmVudC50YXJnZXQuY2hlY2tlZCl9IC8+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0cnVuY2F0ZSB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgbGVhZGluZy01XCI+e2xvZy50aXRsZX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHt0aHVtYm5haWxzLmxlbmd0aCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTIgZmxleCBnYXAtMSBvdmVyZmxvdy1oaWRkZW5cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3RodW1ibmFpbHMubWFwKChpbWFnZSwgaW5kZXgpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcga2V5PXtgJHtsb2cuaWR9LSR7aW5kZXh9YH0gc3JjPXtpbWFnZX0gYWx0PVwiXCIgY2xhc3NOYW1lPVwic2l6ZS04IHNocmluay0wIHJvdW5kZWQtbWQgb2JqZWN0LWNvdmVyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICApIDogbnVsbH1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGp1c3RpZnktaXRlbXMtZW5kIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFRhZyBjbGFzc05hbWU9XCJtLTAgZmxleCBoLTYgaXRlbXMtY2VudGVyIHJvdW5kZWQtbWQgcHgtMS41IHRleHQteHMgbGVhZGluZy1ub25lXCIgY29sb3I9XCJibHVlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3QoXCJ3b3JrYmVuY2guc3VjY2Vzc0NvdW50XCIsIHsgY291bnQ6IGxvZy5zdWNjZXNzQ291bnQgPz8gbG9nLmltYWdlQ291bnQgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L1RhZz5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsb2cuZmFpbENvdW50ID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWcgY2xhc3NOYW1lPVwibS0wIGZsZXggaC02IGl0ZW1zLWNlbnRlciByb3VuZGVkLW1kIHB4LTEuNSB0ZXh0LXhzIGxlYWRpbmctbm9uZVwiIGNvbG9yPVwicmVkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0KFwid29ya2JlbmNoLmZhaWxDb3VudFwiLCB7IGNvdW50OiBsb2cuZmFpbENvdW50IH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFnPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IG51bGx9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGp1c3RpZnktZW5kIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8VGFnIGNsYXNzTmFtZT1cIm0tMCBmbGV4IGgtNiBpdGVtcy1jZW50ZXIgcm91bmRlZC1tZCBweC0xLjUgdGV4dC14cyBsZWFkaW5nLW5vbmVcIj57dChcIndvcmtiZW5jaC5pdGVtQ291bnRcIiwgeyBjb3VudDogbG9nLmltYWdlQ291bnQgfSl9PC9UYWc+XG4gICAgICAgICAgICAgICAgICAgICAgICA8VGFnIGNsYXNzTmFtZT1cIm0tMCBmbGV4IGgtNiBpdGVtcy1jZW50ZXIgcm91bmRlZC1tZCBweC0xLjUgdGV4dC14cyBsZWFkaW5nLW5vbmVcIiBjb2xvcj1cImdyZWVuXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2Zvcm1hdER1cmF0aW9uKGxvZy5kdXJhdGlvbk1zKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFnPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktZW5kXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8VGFnIGNsYXNzTmFtZT1cIm0tMCBmbGV4IGgtNiBpdGVtcy1jZW50ZXIgcm91bmRlZC1tZCBweC0xLjUgdGV4dC14cyBsZWFkaW5nLW5vbmVcIj57bG9nLnRpbWV9PC9UYWc+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRTdG9yZWRMb2dzKCkge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gW107XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdmFsdWVzOiBHZW5lcmF0aW9uTG9nW10gPSBbXTtcbiAgICAgICAgYXdhaXQgbG9nU3RvcmUuaXRlcmF0ZTxHZW5lcmF0aW9uTG9nLCB2b2lkPigodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHZhbHVlcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGxvZ3MgPSBhd2FpdCBQcm9taXNlLmFsbCh2YWx1ZXMubWFwKG5vcm1hbGl6ZUxvZykpO1xuICAgICAgICByZXR1cm4gbG9ncy5zb3J0KChhLCBiKSA9PiAoYi5jcmVhdGVkQXQgfHwgMCkgLSAoYS5jcmVhdGVkQXQgfHwgMCkpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBub3JtYWxpemVMb2cobG9nOiBQYXJ0aWFsPEdlbmVyYXRpb25Mb2c+KTogUHJvbWlzZTxHZW5lcmF0aW9uTG9nPiB7XG4gICAgY29uc3QgcmVmZXJlbmNlcyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAobG9nLnJlZmVyZW5jZXMgfHwgW10pLm1hcChhc3luYyAoaXRlbSkgPT4gKHtcbiAgICAgICAgICAgIC4uLml0ZW0sXG4gICAgICAgICAgICBkYXRhVXJsOiBhd2FpdCByZXNvbHZlSW1hZ2VVcmwoaXRlbS5zdG9yYWdlS2V5LCBpdGVtLmRhdGFVcmwpLFxuICAgICAgICB9KSksXG4gICAgKTtcbiAgICBjb25zdCBpbWFnZXMgPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgKGxvZy5pbWFnZXMgfHwgW10pLm1hcChhc3luYyAoaXRlbSkgPT4gKHtcbiAgICAgICAgICAgIC4uLml0ZW0sXG4gICAgICAgICAgICBkYXRhVXJsOiBhd2FpdCByZXNvbHZlSW1hZ2VVcmwoaXRlbS5zdG9yYWdlS2V5LCBpdGVtLmRhdGFVcmwpLFxuICAgICAgICB9KSksXG4gICAgKTtcbiAgICBjb25zdCBjb25maWcgPSBub3JtYWxpemVMb2dDb25maWcobG9nKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBpZDogbG9nLmlkIHx8IG5hbm9pZCgpLFxuICAgICAgICBjcmVhdGVkQXQ6IGxvZy5jcmVhdGVkQXQgfHwgRGF0ZS5ub3coKSxcbiAgICAgICAgdGl0bGU6IGxvZy50aXRsZSB8fCBsb2cubW9kZWwgfHwgaTE4bi50KFwid29ya2JlbmNoLnVudGl0bGVkXCIpLFxuICAgICAgICBwcm9tcHQ6IGxvZy5wcm9tcHQgfHwgbG9nLnRpdGxlIHx8IFwiXCIsXG4gICAgICAgIHRpbWU6IGxvZy50aW1lIHx8IG5ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoaTE4bi5yZXNvbHZlZExhbmd1YWdlLCB7IGhvdXIxMjogZmFsc2UgfSksXG4gICAgICAgIG1vZGVsOiBsb2cubW9kZWwgfHwgY29uZmlnLmltYWdlTW9kZWwgfHwgXCJcIixcbiAgICAgICAgY29uZmlnLFxuICAgICAgICByZWZlcmVuY2VzLFxuICAgICAgICBkdXJhdGlvbk1zOiBsb2cuZHVyYXRpb25NcyB8fCAwLFxuICAgICAgICBzdWNjZXNzQ291bnQ6IGxvZy5zdWNjZXNzQ291bnQgPz8gbG9nLmltYWdlQ291bnQgPz8gMCxcbiAgICAgICAgZmFpbENvdW50OiBsb2cuZmFpbENvdW50IHx8IDAsXG4gICAgICAgIGltYWdlQ291bnQ6IGxvZy5pbWFnZUNvdW50IHx8IGxvZy5zdWNjZXNzQ291bnQgfHwgMCxcbiAgICAgICAgc2l6ZTogbG9nLnNpemUgfHwgY29uZmlnLnNpemUgfHwgXCJcIixcbiAgICAgICAgcXVhbGl0eTogbG9nLnF1YWxpdHkgfHwgY29uZmlnLnF1YWxpdHkgfHwgXCJcIixcbiAgICAgICAgc3RhdHVzOiBsb2cuc3RhdHVzIHx8IFwic3VjY2Vzc1wiLFxuICAgICAgICBpbWFnZXMsXG4gICAgICAgIHRodW1ibmFpbHM6IGltYWdlcy5tYXAoKGltYWdlKSA9PiBpbWFnZS5kYXRhVXJsKS5maWx0ZXIoQm9vbGVhbiksXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gc2VyaWFsaXplTG9nKGxvZzogR2VuZXJhdGlvbkxvZyk6IEdlbmVyYXRpb25Mb2cge1xuICAgIHJldHVybiB7XG4gICAgICAgIC4uLmxvZyxcbiAgICAgICAgcmVmZXJlbmNlczogbG9nLnJlZmVyZW5jZXMubWFwKChpdGVtKSA9PiAoeyAuLi5pdGVtLCBkYXRhVXJsOiBpdGVtLnN0b3JhZ2VLZXkgPyBcIlwiIDogaXRlbS5kYXRhVXJsIH0pKSxcbiAgICAgICAgaW1hZ2VzOiBsb2cuaW1hZ2VzLm1hcCgoaW1hZ2UpID0+ICh7IC4uLmltYWdlLCBkYXRhVXJsOiBpbWFnZS5zdG9yYWdlS2V5ID8gXCJcIiA6IGltYWdlLmRhdGFVcmwgfSkpLFxuICAgICAgICB0aHVtYm5haWxzOiBbXSxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVMb2dDb25maWcobG9nOiBQYXJ0aWFsPEdlbmVyYXRpb25Mb2c+KTogR2VuZXJhdGlvbkxvZ0NvbmZpZyB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbW9kZWw6IGxvZy5jb25maWc/Lm1vZGVsIHx8IGxvZy5tb2RlbCB8fCBcIlwiLFxuICAgICAgICBpbWFnZU1vZGVsOiBsb2cuY29uZmlnPy5pbWFnZU1vZGVsIHx8IGxvZy5tb2RlbCB8fCBcIlwiLFxuICAgICAgICBxdWFsaXR5OiBsb2cuY29uZmlnPy5xdWFsaXR5IHx8IGxvZy5xdWFsaXR5IHx8IFwiXCIsXG4gICAgICAgIHNpemU6IGxvZy5jb25maWc/LnNpemUgfHwgbG9nLnNpemUgfHwgXCJcIixcbiAgICAgICAgY291bnQ6IGxvZy5jb25maWc/LmNvdW50IHx8IFN0cmluZyhsb2cuaW1hZ2VDb3VudCB8fCBsb2cuc3VjY2Vzc0NvdW50IHx8IDEpLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIG1vdmVMaXN0SXRlbTxUPihpdGVtczogVFtdLCBpbmRleDogbnVtYmVyLCBvZmZzZXQ6IG51bWJlcikge1xuICAgIGNvbnN0IHRhcmdldEluZGV4ID0gaW5kZXggKyBvZmZzZXQ7XG4gICAgaWYgKHRhcmdldEluZGV4IDwgMCB8fCB0YXJnZXRJbmRleCA+PSBpdGVtcy5sZW5ndGgpIHJldHVybiBpdGVtcztcbiAgICBjb25zdCBuZXh0ID0gWy4uLml0ZW1zXTtcbiAgICBbbmV4dFtpbmRleF0sIG5leHRbdGFyZ2V0SW5kZXhdXSA9IFtuZXh0W3RhcmdldEluZGV4XSwgbmV4dFtpbmRleF1dO1xuICAgIHJldHVybiBuZXh0O1xufVxuXG5mdW5jdGlvbiBSZWZlcmVuY2VPcmRlckJ1dHRvbnMoeyBpbmRleCwgdG90YWwsIG9uTW92ZSB9OiB7IGluZGV4OiBudW1iZXI7IHRvdGFsOiBudW1iZXI7IG9uTW92ZTogKG9mZnNldDogbnVtYmVyKSA9PiB2b2lkIH0pIHtcbiAgICBpZiAodG90YWwgPD0gMSkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC14LTEgYm90dG9tLTEgZmxleCBqdXN0aWZ5LWJldHdlZW5cIj5cbiAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cInNtYWxsXCIgY2xhc3NOYW1lPVwiIWgtNiAhdy02ICFtaW4tdy02ICFyb3VuZGVkLWZ1bGwgIWJnLXdoaXRlLzg1ICFwLTAgIXNoYWRvdy1zbVwiIGljb249ezxBcnJvd0xlZnQgY2xhc3NOYW1lPVwic2l6ZS0zXCIgLz59IGRpc2FibGVkPXtpbmRleCA8PSAwfSBvbkNsaWNrPXsoKSA9PiBvbk1vdmUoLTEpfSAvPlxuICAgICAgICAgICAgPEJ1dHRvbiBzaXplPVwic21hbGxcIiBjbGFzc05hbWU9XCIhaC02ICF3LTYgIW1pbi13LTYgIXJvdW5kZWQtZnVsbCAhYmctd2hpdGUvODUgIXAtMCAhc2hhZG93LXNtXCIgaWNvbj17PEFycm93UmlnaHQgY2xhc3NOYW1lPVwic2l6ZS0zXCIgLz59IGRpc2FibGVkPXtpbmRleCA+PSB0b3RhbCAtIDF9IG9uQ2xpY2s9eygpID0+IG9uTW92ZSgxKX0gLz5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRMb2coe1xuICAgIHByb21wdCxcbiAgICBtb2RlbCxcbiAgICBjb25maWcsXG4gICAgcmVmZXJlbmNlcyxcbiAgICBkdXJhdGlvbk1zLFxuICAgIHN1Y2Nlc3NDb3VudCxcbiAgICBmYWlsQ291bnQsXG4gICAgc3RhdHVzLFxuICAgIGltYWdlcyxcbn06IHtcbiAgICBwcm9tcHQ6IHN0cmluZztcbiAgICBtb2RlbDogc3RyaW5nO1xuICAgIGNvbmZpZzogR2VuZXJhdGlvbkxvZ0NvbmZpZztcbiAgICByZWZlcmVuY2VzOiBSZWZlcmVuY2VJbWFnZVtdO1xuICAgIGR1cmF0aW9uTXM6IG51bWJlcjtcbiAgICBzdWNjZXNzQ291bnQ6IG51bWJlcjtcbiAgICBmYWlsQ291bnQ6IG51bWJlcjtcbiAgICBzdGF0dXM6IEdlbmVyYXRpb25Mb2dbXCJzdGF0dXNcIl07XG4gICAgaW1hZ2VzOiBHZW5lcmF0ZWRJbWFnZVtdO1xufSk6IEdlbmVyYXRpb25Mb2cge1xuICAgIGNvbnN0IGxvZ0NvbmZpZyA9IHtcbiAgICAgICAgbW9kZWw6IGNvbmZpZy5tb2RlbCxcbiAgICAgICAgaW1hZ2VNb2RlbDogY29uZmlnLmltYWdlTW9kZWwsXG4gICAgICAgIHF1YWxpdHk6IGNvbmZpZy5xdWFsaXR5LFxuICAgICAgICBzaXplOiBjb25maWcuc2l6ZSxcbiAgICAgICAgY291bnQ6IGNvbmZpZy5jb3VudCxcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICAgIGlkOiBuYW5vaWQoKSxcbiAgICAgICAgY3JlYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgICAgICB0aXRsZTogcHJvbXB0LnNsaWNlKDAsIDEyKSB8fCBpMThuLnQoXCJ3b3JrYmVuY2gudW50aXRsZWRcIiksXG4gICAgICAgIHByb21wdCxcbiAgICAgICAgdGltZTogbmV3IERhdGUoKS50b0xvY2FsZVN0cmluZyhpMThuLnJlc29sdmVkTGFuZ3VhZ2UsIHsgaG91cjEyOiBmYWxzZSB9KSxcbiAgICAgICAgbW9kZWwsXG4gICAgICAgIGNvbmZpZzogbG9nQ29uZmlnLFxuICAgICAgICByZWZlcmVuY2VzLFxuICAgICAgICBkdXJhdGlvbk1zLFxuICAgICAgICBzdWNjZXNzQ291bnQsXG4gICAgICAgIGZhaWxDb3VudCxcbiAgICAgICAgaW1hZ2VDb3VudDogTnVtYmVyKGxvZ0NvbmZpZy5jb3VudCkgfHwgc3VjY2Vzc0NvdW50LFxuICAgICAgICBzaXplOiBsb2dDb25maWcuc2l6ZSxcbiAgICAgICAgcXVhbGl0eTogbG9nQ29uZmlnLnF1YWxpdHksXG4gICAgICAgIHN0YXR1cyxcbiAgICAgICAgaW1hZ2VzLFxuICAgICAgICB0aHVtYm5haWxzOiBpbWFnZXMubWFwKChpbWFnZSkgPT4gaW1hZ2UuZGF0YVVybCkuZmlsdGVyKEJvb2xlYW4pLFxuICAgIH07XG59XG4iXSwiZmlsZSI6IkU6L2NvZGV4L25pYW5uaWFuYWkvemh1YW5odWl5dWFuZ29uZy9pbmZpbml0ZS1jYW52YXMvd2ViL3NyYy9wYWdlcy9pbWFnZS9pbmRleC50c3gifQ==