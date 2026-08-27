import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/video/index.tsx");import { Fragment, jsxDEV } from "/node_modules/react/jsx-dev-runtime.js";
var _s = $RefreshSig$(), _s2 = $RefreshSig$(), _s3 = $RefreshSig$(), _s4 = $RefreshSig$(), _s5 = $RefreshSig$(), _s6 = $RefreshSig$(), _s7 = $RefreshSig$();
import { ArrowLeft, ArrowRight, BookOpen, CheckSquare, ClipboardPaste, Download, FolderPlus, History, LoaderCircle, Plus, SlidersHorizontal, Sparkles, Trash2, Upload, VideoIcon } from "/node_modules/lucide-react/dist/esm/lucide-react.mjs";
import { useEffect, useRef, useState } from "/node_modules/react/index.js";
import { App, Button, Checkbox, Drawer, Empty, Input, Modal, Tag, Typography } from "/node_modules/antd/es/index.js";
import localforage from "/node_modules/localforage/dist/localforage.js";
import { nanoid } from "/node_modules/nanoid/index.browser.js";
import { saveAs } from "/node_modules/file-saver/dist/FileSaver.min.js";
import { useTranslation } from "/node_modules/react-i18next/dist/es/index.js";
import { AssetPickerModal } from "/src/components/canvas/asset-picker-modal.tsx";
import { ModelPicker } from "/src/components/model-picker.tsx";
import { PromptSelectDialog } from "/src/components/prompts/prompt-select-dialog.tsx";
import { VideoSettingsPanel, normalizeVideoResolutionValue, normalizeVideoSizeValue, videoSizeLabel } from "/src/components/video-settings-panel.tsx";
import { canvasThemes } from "/src/lib/canvas-theme.ts";
import { formatBytes, formatDuration } from "/src/lib/image-utils.ts";
import { deleteStoredMedia, resolveMediaUrl } from "/src/services/file-storage.ts";
import { resolveImageUrl, uploadImage } from "/src/services/image-storage.ts";
import { createVideoGenerationTask, pollVideoGenerationTask, storeGeneratedVideo } from "/src/services/api/video.ts";
import { useAssetStore } from "/src/stores/use-asset-store.ts";
import { useWorkbenchAgentStore } from "/src/stores/use-workbench-agent-store.ts";
import { boolConfig, modelOptionLabel, useConfigStore, useEffectiveConfig } from "/src/stores/use-config-store.ts";
import { useThemeStore } from "/src/stores/use-theme-store.ts";
import i18n from "/src/i18n/index.ts";
const LOG_STORE_KEY = "infinite-canvas:video_generation_logs";
const logStore = localforage.createInstance({ name: "infinite-canvas", storeName: "video_generation_logs" });
export default function VideoPage() {
  _s();
  const { message } = App.useApp();
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const dragDepthRef = useRef(0);
  const activeLogIdsRef = useRef(/* @__PURE__ */ new Set());
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
  const [referenceDragTarget, setReferenceDragTarget] = useState(false);
  const [autoRunToken, setAutoRunToken] = useState(0);
  const videoCommand = useWorkbenchAgentStore((state) => state.videoCommand);
  const clearVideoCommand = useWorkbenchAgentStore((state) => state.clearVideoCommand);
  const updateAgentTask = useWorkbenchAgentStore((state) => state.updateTask);
  const processedCommandRef = useRef(0);
  const agentTaskIdRef = useRef(void 0);
  const model = effectiveConfig.videoModel || effectiveConfig.model;
  const canGenerate = Boolean(prompt.trim());
  useEffect(() => {
    if (!running || !startedAt) return;
    const timer = window.setInterval(() => setElapsedMs(performance.now() - startedAt), 1e3);
    return () => window.clearInterval(timer);
  }, [running, startedAt]);
  useEffect(() => {
    void refreshLogs();
  }, []);
  const addReferences = async (files) => {
    const selectedFiles = Array.from(files || []);
    const unsupported = selectedFiles.filter((file) => !file.type.startsWith("image/"));
    if (unsupported.length) message.warning(t("videoWorkbench.unsupportedFiles"));
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/")).slice(0, 7 - references.length);
    const nextReferences = await Promise.all(
      imageFiles.map(async (file) => {
        const image = await uploadImage(file);
        return { id: nanoid(), name: file.name, type: image.mimeType, dataUrl: image.url, storageKey: image.storageKey };
      })
    );
    setReferences((value) => [...value, ...nextReferences].slice(0, 7));
  };
  const handleReferenceDragEnter = (event) => {
    event.preventDefault();
    dragDepthRef.current += 1;
    if (event.dataTransfer.types.includes("Files")) setReferenceDragTarget(true);
  };
  const handleReferenceDragLeave = (event) => {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (!dragDepthRef.current) setReferenceDragTarget(false);
  };
  const handleReferenceDrop = (event) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setReferenceDragTarget(false);
    void addReferences(event.dataTransfer.files);
  };
  const addReferencesFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      const blobs = await Promise.all(items.flatMap((item) => item.types.filter((type) => type.startsWith("image/")).map((type) => item.getType(type))));
      if (!blobs.length) {
        message.error(t("videoWorkbench.clipboardEmpty"));
        return;
      }
      const nextReferences = await Promise.all(
        blobs.slice(0, 7 - references.length).map(async (blob, index) => {
          const image = await uploadImage(blob);
          return { id: nanoid(), name: `clipboard-${index + 1}.png`, type: image.mimeType, dataUrl: image.url, storageKey: image.storageKey };
        })
      );
      setReferences((value) => [...value, ...nextReferences].slice(0, 7));
      message.success(t("videoWorkbench.clipboardAdded", { count: nextReferences.length }));
    } catch {
      message.error(t("videoWorkbench.clipboardEmpty"));
    }
  };
  const generate = async () => {
    const agentTaskId = agentTaskIdRef.current;
    agentTaskIdRef.current = void 0;
    const snapshot = buildRequestSnapshot();
    if (!snapshot) {
      if (agentTaskId) updateAgentTask(agentTaskId, { status: "failed", error: t("videoWorkbench.invalidParams") });
      return;
    }
    setElapsedMs(0);
    setRunning(true);
    if (agentTaskId) updateAgentTask(agentTaskId, { status: "running", error: void 0 });
    setPreviewLog(null);
    setResults([{ id: nanoid(), status: "pending" }]);
    const batchStartedAt = performance.now();
    setStartedAt(batchStartedAt);
    try {
      const task = await createVideoGenerationTask(snapshot.config, snapshot.text, snapshot.references);
      const log = buildLog({ prompt: snapshot.text, model, config: snapshot.config, references: snapshot.references, durationMs: 0, status: "pending", task });
      await saveLog(log, false);
      void pollGenerationLog(log, snapshot.config, agentTaskId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("workbench.generationFailed");
      setResults([{ id: nanoid(), status: "failed", error: errorMessage }]);
      if (agentTaskId) updateAgentTask(agentTaskId, { status: "failed", successCount: 0, failCount: 1, error: errorMessage });
      await saveLog(buildLog({ prompt: snapshot.text, model, config: snapshot.config, references: snapshot.references, durationMs: performance.now() - batchStartedAt, status: "failed", error: errorMessage }));
      message.error(errorMessage);
      setRunning(false);
    }
  };
  useEffect(() => {
    if (!videoCommand || videoCommand.nonce === processedCommandRef.current) return;
    processedCommandRef.current = videoCommand.nonce;
    clearVideoCommand();
    if (typeof videoCommand.prompt === "string") setPrompt(videoCommand.prompt);
    if (videoCommand.run && running) {
      if (videoCommand.taskId) updateAgentTask(videoCommand.taskId, { status: "failed", error: t("videoWorkbench.busy") });
      return;
    }
    if (videoCommand.run) {
      agentTaskIdRef.current = videoCommand.taskId;
      setAutoRunToken((value) => value + 1);
    }
  }, [videoCommand, clearVideoCommand, running, updateAgentTask]);
  useEffect(() => {
    if (!autoRunToken) return;
    void generate();
  }, [autoRunToken]);
  const buildRequestSnapshot = () => {
    const text = prompt.trim();
    if (!text) {
      message.error(t("videoWorkbench.promptRequired"));
      return null;
    }
    if (!isAiConfigReady(effectiveConfig, model)) {
      message.warning(t("workbench.configFirst"));
      openConfigDialog(true);
      return null;
    }
    return { text, config: buildVideoConfig(effectiveConfig, model), references: [...references] };
  };
  const retryResult = () => {
    void generate();
  };
  const downloadVideo = (video) => {
    saveAs(video.url, "video.mp4");
  };
  const saveResultToAssets = (video) => {
    addAsset({
      kind: "video",
      title: t("videoWorkbench.resultTitle"),
      coverUrl: "",
      tags: [],
      source: t("videoWorkbench.source"),
      data: { url: video.url, storageKey: video.storageKey, width: video.width, height: video.height, bytes: video.bytes, mimeType: video.mimeType },
      metadata: { source: "video-page", prompt }
    });
    message.success(t("common.addedToAssets"));
  };
  const insertPickedAsset = async (payload) => {
    if (payload.kind === "text") {
      setPrompt(payload.content);
    } else if (payload.kind === "image") {
      const stored = await uploadImage(payload.dataUrl);
      setReferences((value) => [...value, { id: nanoid(), name: payload.title, type: stored.mimeType, dataUrl: stored.url, storageKey: stored.storageKey }].slice(0, 7));
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
    const mediaKeys = logs.filter((log) => selectedLogIds.includes(log.id)).map((log) => log.video?.storageKey).filter((key) => Boolean(key));
    void Promise.all([deleteStoredMedia(mediaKeys), ...selectedLogIds.map((id) => logStore.removeItem(id))]).then(() => refreshLogs());
    if (previewLog && selectedLogIds.includes(previewLog.id)) {
      setPreviewLog(null);
      setResults([]);
    }
    setSelectedLogIds([]);
    setDeleteConfirmOpen(false);
  };
  const saveLog = async (log, resumePending = true) => {
    await logStore.setItem(log.id, serializeLog(log));
    await refreshLogs(resumePending);
  };
  const refreshLogs = async (resumePending = true) => {
    const nextLogs = await readStoredLogs();
    setLogs(nextLogs);
    if (resumePending) resumePendingLogs(nextLogs);
    return nextLogs;
  };
  const resumePendingLogs = (items) => {
    for (const log of items) {
      if (log.status === "pending" && log.task) void pollGenerationLog(log);
    }
  };
  const pollGenerationLog = async (log, configOverride, agentTaskId) => {
    if (!log.task || activeLogIdsRef.current.has(log.id)) return;
    activeLogIdsRef.current.add(log.id);
    setRunning(true);
    setStartedAt((value) => value || performance.now());
    setResults((value) => value.length ? value : [{ id: log.id, status: "pending" }]);
    const taskConfig = buildVideoConfig({ ...effectiveConfig, ...log.config }, log.task.model || log.model);
    try {
      for (let attempt = 0; attempt < 120; attempt += 1) {
        const state = await pollVideoGenerationTask(configOverride || taskConfig, log.task);
        if (state.status === "completed") {
          const stored = await storeGeneratedVideo(state.result);
          const nextVideo = {
            id: nanoid(),
            url: stored.url,
            storageKey: stored.storageKey,
            durationMs: Date.now() - log.createdAt,
            width: stored.width || 1280,
            height: stored.height || 720,
            bytes: stored.bytes,
            mimeType: stored.mimeType
          };
          setResults([{ id: nextVideo.id, status: "success", video: nextVideo }]);
          if (agentTaskId) updateAgentTask(agentTaskId, { status: "succeeded", successCount: 1, failCount: 0, error: void 0 });
          await saveLog({ ...log, status: "success", durationMs: nextVideo.durationMs, video: nextVideo, error: void 0 });
          message.success(t("videoWorkbench.generated"));
          return;
        }
        if (state.status === "failed") throw new Error(state.error);
        if (attempt === 119) throw new Error(t("videoWorkbench.timeout"));
        await delay(2500);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("workbench.generationFailed");
      setResults([{ id: log.id, status: "failed", error: errorMessage }]);
      if (agentTaskId) updateAgentTask(agentTaskId, { status: "failed", successCount: 0, failCount: 1, error: errorMessage });
      await saveLog({ ...log, status: "failed", durationMs: Date.now() - log.createdAt, error: errorMessage });
      message.error(errorMessage);
    } finally {
      activeLogIdsRef.current.delete(log.id);
      if (!activeLogIdsRef.current.size) {
        setRunning(false);
        setStartedAt(0);
      }
    }
  };
  const previewGenerationLog = (log) => {
    setPreviewLog(log);
    setLogsOpen(false);
    setPrompt(log.prompt);
    setReferences(log.references || []);
    if (log.config.videoModel || log.model) updateConfig("videoModel", log.config.videoModel || log.model);
    if (log.config.size) updateConfig("size", log.config.size);
    if (log.config.vquality) updateConfig("vquality", log.config.vquality);
    if (log.config.videoSeconds) updateConfig("videoSeconds", log.config.videoSeconds);
    if (log.config.videoGenerateAudio) updateConfig("videoGenerateAudio", log.config.videoGenerateAudio);
    if (log.config.videoWatermark) updateConfig("videoWatermark", log.config.videoWatermark);
    setResults(log.status === "pending" ? [{ id: log.id, status: "pending" }] : log.video ? [{ id: log.video.id, status: "success", video: log.video }] : [{ id: log.id, status: "failed", error: log.error || t("workbench.generationFailed") }]);
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "flex h-full flex-col overflow-hidden bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100", children: [
    /* @__PURE__ */ jsxDEV("main", { className: "grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 lg:grid-cols-[300px_minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)]", children: [
      /* @__PURE__ */ jsxDEV("aside", { className: "thin-scrollbar hidden min-h-0 overflow-y-auto rounded-lg border border-stone-200 bg-card p-4 shadow-sm dark:border-stone-800 lg:block", children: /* @__PURE__ */ jsxDEV(LogPanel, { logs, selectedLogIds, activeLogId: previewLog?.id, onSelectedLogIdsChange: setSelectedLogIds, onCreateSession: createSession, onDeleteSelected: () => setDeleteConfirmOpen(true), onPreviewLog: previewGenerationLog }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 373,
        columnNumber: 21
      }, this) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 372,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("section", { className: "grid gap-3 lg:min-h-0 lg:overflow-hidden xl:grid-cols-[420px_minmax(0,1fr)]", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "thin-scrollbar flex flex-col rounded-lg border border-stone-200 bg-card p-4 shadow-sm dark:border-stone-800 lg:min-h-0 lg:overflow-y-auto", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-semibold text-stone-950 dark:text-stone-100", children: t("videoWorkbench.title") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
              lineNumber: 379,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex shrink-0 gap-2 lg:hidden", children: [
              /* @__PURE__ */ jsxDEV(Button, { icon: /* @__PURE__ */ jsxDEV(History, { className: "size-4" }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                lineNumber: 381,
                columnNumber: 47
              }, this), onClick: () => setLogsOpen(true), children: t("workbench.logs") }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                lineNumber: 381,
                columnNumber: 33
              }, this),
              /* @__PURE__ */ jsxDEV(Button, { icon: /* @__PURE__ */ jsxDEV(SlidersHorizontal, { className: "size-4" }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                lineNumber: 384,
                columnNumber: 47
              }, this), onClick: () => setSettingsOpen(true), children: t("workbench.settings") }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                lineNumber: 384,
                columnNumber: 33
              }, this)
            ] }, void 0, true, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
              lineNumber: 380,
              columnNumber: 29
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
            lineNumber: 378,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "mt-6 space-y-5", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { className: "mb-2 flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-base font-semibold", children: t("workbench.prompt") }, void 0, false, {
                  fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                  lineNumber: 393,
                  columnNumber: 37
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(BookOpen, { className: "size-3.5" }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                    lineNumber: 395,
                    columnNumber: 68
                  }, this), onClick: () => setPromptDialogOpen(true), children: t("workbench.viewPrompts") }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                    lineNumber: 395,
                    columnNumber: 41
                  }, this),
                  /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(FolderPlus, { className: "size-3.5" }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                    lineNumber: 398,
                    columnNumber: 68
                  }, this), onClick: () => setAssetPickerOpen(true), children: t("workbench.viewAssets") }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                    lineNumber: 398,
                    columnNumber: 41
                  }, this)
                ] }, void 0, true, {
                  fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                  lineNumber: 394,
                  columnNumber: 37
                }, this)
              ] }, void 0, true, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                lineNumber: 392,
                columnNumber: 33
              }, this),
              /* @__PURE__ */ jsxDEV(Input.TextArea, { value: prompt, onChange: (event) => setPrompt(event.target.value), rows: 7, placeholder: t("videoWorkbench.promptPlaceholder") }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                lineNumber: 403,
                columnNumber: 33
              }, this)
            ] }, void 0, true, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
              lineNumber: 391,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "mb-2 flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-base font-semibold", children: t("videoWorkbench.references") }, void 0, false, {
                  fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                  lineNumber: 408,
                  columnNumber: 37
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(ClipboardPaste, { className: "size-3.5" }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                    lineNumber: 410,
                    columnNumber: 68
                  }, this), onClick: () => void addReferencesFromClipboard(), children: t("workbench.clipboard") }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                    lineNumber: 410,
                    columnNumber: 41
                  }, this),
                  /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(Upload, { className: "size-3.5" }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                    lineNumber: 413,
                    columnNumber: 68
                  }, this), onClick: () => fileInputRef.current?.click(), children: t("workbench.upload") }, void 0, false, {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                    lineNumber: 413,
                    columnNumber: 41
                  }, this)
                ] }, void 0, true, {
                  fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                  lineNumber: 409,
                  columnNumber: 37
                }, this)
              ] }, void 0, true, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                lineNumber: 407,
                columnNumber: 33
              }, this),
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  className: `hover-scrollbar hover-scrollbar-hint flex min-h-24 w-full min-w-0 max-w-full gap-2 overflow-x-scroll overflow-y-hidden rounded-lg border border-dashed p-2 pb-3 overscroll-x-contain transition-colors ${referenceDragTarget ? "border-stone-900 bg-stone-100/80 dark:border-stone-100 dark:bg-stone-900/80" : "border-stone-300 dark:border-stone-700"}`,
                  onDragEnter: handleReferenceDragEnter,
                  onDragOver: (event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "copy";
                  },
                  onDragLeave: handleReferenceDragLeave,
                  onDrop: handleReferenceDrop,
                  children: [
                    references.map(
                      (item, index) => /* @__PURE__ */ jsxDEV("div", { className: "group relative size-20 shrink-0 overflow-hidden rounded-md border border-stone-200 dark:border-stone-800", children: [
                        /* @__PURE__ */ jsxDEV("img", { src: item.dataUrl, alt: item.name, className: "size-full object-cover" }, void 0, false, {
                          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                          lineNumber: 430,
                          columnNumber: 45
                        }, this),
                        /* @__PURE__ */ jsxDEV("span", { className: "absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white", children: index + 1 }, void 0, false, {
                          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                          lineNumber: 431,
                          columnNumber: 45
                        }, this),
                        /* @__PURE__ */ jsxDEV(ReferenceOrderButtons, { index, total: references.length, onMove: (offset) => setReferences((value) => moveListItem(value, index, offset)) }, void 0, false, {
                          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                          lineNumber: 432,
                          columnNumber: 45
                        }, this),
                        /* @__PURE__ */ jsxDEV("button", { type: "button", className: "absolute right-1 top-1 hidden size-6 items-center justify-center rounded bg-black/60 text-white group-hover:flex", onClick: () => setReferences((value) => value.filter((ref) => ref.id !== item.id)), "aria-label": t("videoWorkbench.removeImage"), children: /* @__PURE__ */ jsxDEV(Trash2, { className: "size-3.5" }, void 0, false, {
                          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                          lineNumber: 434,
                          columnNumber: 49
                        }, this) }, void 0, false, {
                          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                          lineNumber: 433,
                          columnNumber: 45
                        }, this)
                      ] }, item.id, true, {
                        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                        lineNumber: 429,
                        columnNumber: 19
                      }, this)
                    ),
                    !references.length ? /* @__PURE__ */ jsxDEV("div", { className: "flex min-w-full items-center justify-center text-sm text-stone-500", children: referenceDragTarget ? t("videoWorkbench.dropReferences") : t("videoWorkbench.noImages") }, void 0, false, {
                      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                      lineNumber: 438,
                      columnNumber: 59
                    }, this) : null
                  ]
                },
                void 0,
                true,
                {
                  fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                  lineNumber: 418,
                  columnNumber: 33
                },
                this
              )
            ] }, void 0, true, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
              lineNumber: 406,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-800 dark:bg-stone-900 sm:hidden", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "truncate text-stone-500 dark:text-stone-400", children: [
                modelOptionLabel(effectiveConfig, model),
                " · ",
                normalizeResolution(effectiveConfig.vquality),
                "p · ",
                videoSizeLabel(effectiveConfig.size),
                " · ",
                normalizeVideoSeconds(effectiveConfig.videoSeconds),
                "s"
              ] }, void 0, true, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                lineNumber: 443,
                columnNumber: 33
              }, this),
              /* @__PURE__ */ jsxDEV(Button, { size: "small", type: "text", icon: /* @__PURE__ */ jsxDEV(SlidersHorizontal, { className: "size-4" }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                lineNumber: 446,
                columnNumber: 72
              }, this), onClick: () => setSettingsOpen(true), children: t("workbench.adjust") }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
                lineNumber: 446,
                columnNumber: 33
              }, this)
            ] }, void 0, true, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
              lineNumber: 442,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "hidden gap-4 sm:grid sm:grid-cols-2", children: /* @__PURE__ */ jsxDEV(GenerationSettings, { config: effectiveConfig, model, updateConfig, openConfigDialog }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
              lineNumber: 452,
              columnNumber: 33
            }, this) }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
              lineNumber: 451,
              columnNumber: 29
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
            lineNumber: 390,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "mt-auto pt-6", children: /* @__PURE__ */ jsxDEV(Button, { type: "primary", size: "large", block: true, icon: /* @__PURE__ */ jsxDEV(Sparkles, { className: "size-4" }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
            lineNumber: 457,
            columnNumber: 77
          }, this), loading: running, disabled: !canGenerate || running, onClick: () => void generate(), children: t("workbench.generate") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
            lineNumber: 457,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
            lineNumber: 456,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
          lineNumber: 377,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "thin-scrollbar rounded-lg border border-stone-200 bg-card p-4 shadow-sm dark:border-stone-800 lg:min-h-0 lg:overflow-y-auto lg:p-5", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "mb-4 flex items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxDEV("h2", { className: "text-xl font-semibold", children: t("workbench.results") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
              lineNumber: 465,
              columnNumber: 29
            }, this),
            running ? /* @__PURE__ */ jsxDEV(Tag, { className: "m-0 px-2 py-1", children: t("workbench.waiting", { time: formatDuration(elapsedMs) }) }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
              lineNumber: 466,
              columnNumber: 40
            }, this) : null
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
            lineNumber: 464,
            columnNumber: 25
          }, this),
          results.length ? /* @__PURE__ */ jsxDEV("div", { className: "grid gap-4", children: results.map((result) => result.status === "success" && result.video ? /* @__PURE__ */ jsxDEV(ResultVideoCard, { video: result.video, onDownload: downloadVideo, onSaveAsset: saveResultToAssets }, result.id, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
            lineNumber: 470,
            columnNumber: 104
          }, this) : result.status === "failed" ? /* @__PURE__ */ jsxDEV(FailedVideoCard, { error: result.error || t("workbench.generationFailed"), onRetry: retryResult }, result.id, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
            lineNumber: 470,
            columnNumber: 252
          }, this) : /* @__PURE__ */ jsxDEV(PendingVideoCard, {}, result.id, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
            lineNumber: 470,
            columnNumber: 368
          }, this)) }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
            lineNumber: 469,
            columnNumber: 13
          }, this) : /* @__PURE__ */ jsxDEV("div", { className: "flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 text-center dark:border-stone-700 lg:min-h-[560px]", children: [
            /* @__PURE__ */ jsxDEV(VideoIcon, { className: "mb-4 size-11 text-stone-400" }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
              lineNumber: 474,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE, description: t("videoWorkbench.empty") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
              lineNumber: 475,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
            lineNumber: 473,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
          lineNumber: 463,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 376,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 371,
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
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 481,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(Drawer, { title: t("workbench.logs"), placement: "bottom", size: "large", open: logsOpen, onClose: () => setLogsOpen(false), children: /* @__PURE__ */ jsxDEV(LogPanel, { logs, selectedLogIds, activeLogId: previewLog?.id, onSelectedLogIdsChange: setSelectedLogIds, onCreateSession: createSession, onDeleteSelected: () => setDeleteConfirmOpen(true), onPreviewLog: previewGenerationLog }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 493,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 492,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(Drawer, { title: t("workbench.settings"), placement: "bottom", height: "82vh", open: settingsOpen, onClose: () => setSettingsOpen(false), children: /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-3 pb-4", children: /* @__PURE__ */ jsxDEV(GenerationSettings, { config: effectiveConfig, model, updateConfig, openConfigDialog }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 497,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 496,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 495,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(PromptSelectDialog, { open: promptDialogOpen, onOpenChange: setPromptDialogOpen, onSelect: setPrompt }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 500,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(AssetPickerModal, { open: assetPickerOpen, defaultTab: "my-assets", onInsert: (payload) => void insertPickedAsset(payload), onClose: () => setAssetPickerOpen(false) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 501,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(Modal, { title: t("workbench.deleteLogs"), open: deleteConfirmOpen, onCancel: () => setDeleteConfirmOpen(false), onOk: deleteSelectedLogs, okText: t("common.delete"), okButtonProps: { danger: true }, cancelText: t("common.cancel"), children: t("workbench.deleteLogsConfirm", { count: selectedLogIds.length }) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 502,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
    lineNumber: 370,
    columnNumber: 5
  }, this);
}
_s(VideoPage, "SXZ6o1VqKT09AhcSx0JG9CtSfVI=", false, function() {
  return [App.useApp, useTranslation, useConfigStore, useEffectiveConfig, useConfigStore, useConfigStore, useConfigStore, useAssetStore, useWorkbenchAgentStore, useWorkbenchAgentStore, useWorkbenchAgentStore];
});
_c = VideoPage;
function GenerationSettings({ config, model, updateConfig, openConfigDialog }) {
  _s2();
  const theme = canvasThemes[useThemeStore((state) => state.theme)];
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("label", { className: "col-span-2 block min-w-0 sm:col-span-1", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "mb-1.5 block text-sm font-semibold sm:mb-2 sm:text-base", children: t("workbench.model") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 516,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(ModelPicker, { config, value: model, onChange: (value) => updateConfig("videoModel", value), capability: "video", fullWidth: true, onMissingConfig: () => openConfigDialog(false) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 517,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 515,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "col-span-2", children: /* @__PURE__ */ jsxDEV(VideoSettingsPanel, { config, onConfigChange: (key, value) => updateConfig(key, value), theme, showTitle: false, className: "space-y-4" }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 520,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 519,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
    lineNumber: 514,
    columnNumber: 5
  }, this);
}
_s2(GenerationSettings, "iJIaOj/6JHJYKQ0OzJb+lER2vC0=", false, function() {
  return [useThemeStore, useTranslation];
});
_c2 = GenerationSettings;
function ResultVideoCard({ video, onDownload, onSaveAsset }) {
  _s3();
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxDEV("div", { className: "overflow-hidden rounded-lg border border-stone-200 bg-background dark:border-stone-800", children: [
    /* @__PURE__ */ jsxDEV("video", { src: video.url, controls: true, className: "aspect-video w-full bg-black object-contain" }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 530,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-stone-200 px-3 py-2.5 dark:border-stone-800", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-xs text-stone-500 dark:text-stone-400", children: [
        /* @__PURE__ */ jsxDEV("span", { children: [
          video.width,
          "x",
          video.height
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
          lineNumber: 533,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: formatBytes(video.bytes) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
          lineNumber: 536,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: formatDuration(video.durationMs) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
          lineNumber: 537,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 532,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex shrink-0 gap-1", children: [
        /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(FolderPlus, { className: "size-3.5" }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
          lineNumber: 540,
          columnNumber: 48
        }, this), onClick: () => onSaveAsset(video), children: t("common.addToAssets") }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
          lineNumber: 540,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(Download, { className: "size-3.5" }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
          lineNumber: 543,
          columnNumber: 48
        }, this), onClick: () => onDownload(video), children: t("common.download") }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
          lineNumber: 543,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 539,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 531,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
    lineNumber: 529,
    columnNumber: 5
  }, this);
}
_s3(ResultVideoCard, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
  return [useTranslation];
});
_c3 = ResultVideoCard;
function PendingVideoCard() {
  _s4();
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxDEV("div", { className: "relative aspect-video overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-50 dark:border-stone-700 dark:bg-stone-900", children: /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-stone-500 dark:text-stone-400", children: [
    /* @__PURE__ */ jsxDEV(LoaderCircle, { className: "size-6 animate-spin" }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 557,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("span", { children: t("workbench.generating") }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 558,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
    lineNumber: 556,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
    lineNumber: 555,
    columnNumber: 5
  }, this);
}
_s4(PendingVideoCard, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
  return [useTranslation];
});
_c4 = PendingVideoCard;
function FailedVideoCard({ error, onRetry }) {
  _s5();
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxDEV("div", { className: "overflow-hidden rounded-lg border border-red-200 bg-red-50 dark:border-red-950 dark:bg-red-950/20", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex aspect-video flex-col items-center justify-center gap-3 p-5 text-center", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-medium text-red-600 dark:text-red-300", children: t("workbench.failed") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 569,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(Typography.Paragraph, { ellipsis: { rows: 4 }, className: "!mb-0 !text-xs !text-red-500 dark:!text-red-300", children: error }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 570,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 568,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex justify-end border-t border-red-200 p-3 dark:border-red-950", children: /* @__PURE__ */ jsxDEV(Button, { size: "small", danger: true, onClick: onRetry, children: t("workbench.retry") }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 575,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 574,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
    lineNumber: 567,
    columnNumber: 5
  }, this);
}
_s5(FailedVideoCard, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
  return [useTranslation];
});
_c5 = FailedVideoCard;
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
      /* @__PURE__ */ jsxDEV("h2", { className: "text-base font-semibold", children: t("workbench.logs") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 607,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(Tag, { className: "m-0", children: logs.length }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 608,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 606,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "mb-4 flex flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(Plus, { className: "size-3.5" }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 611,
        columnNumber: 44
      }, this), onClick: onCreateSession, children: t("workbench.new") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 611,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(CheckSquare, { className: "size-3.5" }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 614,
        columnNumber: 44
      }, this), disabled: !logs.length, onClick: toggleAll, children: allSelected ? t("common.cancel") : t("workbench.selectAll") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 614,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(Button, { size: "small", danger: true, icon: /* @__PURE__ */ jsxDEV(Trash2, { className: "size-3.5" }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 617,
        columnNumber: 51
      }, this), disabled: !selectedLogIds.length, onClick: onDeleteSelected, children: t("common.delete") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 617,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 610,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
      logs.map(
        (log) => /* @__PURE__ */ jsxDEV(LogCard, { log, selected: selectedLogIds.includes(log.id), active: activeLogId === log.id, onSelectedChange: (checked) => onSelectedLogIdsChange(checked ? [...selectedLogIds, log.id] : selectedLogIds.filter((id) => id !== log.id)), onClick: () => onPreviewLog(log) }, log.id, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
          lineNumber: 623,
          columnNumber: 9
        }, this)
      ),
      !logs.length ? /* @__PURE__ */ jsxDEV("div", { className: "flex min-h-48 items-center justify-center rounded-lg border border-dashed border-stone-300 text-center text-sm text-stone-500 dark:border-stone-700", children: t("workbench.noLogs") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 625,
        columnNumber: 33
      }, this) : null
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 621,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
    lineNumber: 605,
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
  return /* @__PURE__ */ jsxDEV("button", { type: "button", className: `block w-full rounded-lg border p-2 text-left transition ${active ? "border-stone-900 bg-blue-50 dark:border-stone-100 dark:bg-blue-950/20" : "border-stone-200 bg-background hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-900"}`, onClick, children: /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2", children: [
    /* @__PURE__ */ jsxDEV(Checkbox, { className: "mt-0.5", checked: selected, onClick: (event) => event.stopPropagation(), onChange: (event) => onSelectedChange(event.target.checked) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 636,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "truncate text-sm font-semibold leading-5", children: log.title }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 638,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "mt-2 flex flex-wrap gap-1", children: [
        /* @__PURE__ */ jsxDEV(Tag, { className: "m-0 flex h-6 items-center rounded-md px-1.5 text-xs leading-none", children: log.size }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
          lineNumber: 640,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV(Tag, { className: "m-0 flex h-6 items-center rounded-md px-1.5 text-xs leading-none", children: [
          log.resolution,
          "p"
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
          lineNumber: 641,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV(Tag, { className: "m-0 flex h-6 items-center rounded-md px-1.5 text-xs leading-none", children: [
          log.seconds,
          "s"
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
          lineNumber: 642,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 639,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 637,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "grid justify-items-end gap-2", children: [
      /* @__PURE__ */ jsxDEV(Tag, { className: "m-0 flex h-6 items-center rounded-md px-1.5 text-xs leading-none", color: log.status === "success" ? "blue" : log.status === "pending" ? "processing" : "red", children: t(`workbench.${log.status === "success" ? "success" : log.status === "pending" ? "generating" : "failed"}`) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 646,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV(Tag, { className: "m-0 flex h-6 items-center rounded-md px-1.5 text-xs leading-none", color: "green", children: formatDuration(log.durationMs) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
        lineNumber: 649,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 645,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
    lineNumber: 635,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
    lineNumber: 634,
    columnNumber: 5
  }, this);
}
_s7(LogCard, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
  return [useTranslation];
});
_c7 = LogCard;
async function readStoredLogs() {
  if (typeof window === "undefined") return [];
  try {
    const logs = [];
    await logStore.iterate((value) => {
      logs.push(value);
    });
    return (await Promise.all(logs.map(normalizeLog))).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch {
    return [];
  }
}
async function normalizeLog(log) {
  const video = log.video?.storageKey ? { ...log.video, url: await resolveMediaUrl(log.video.storageKey, log.video.url) } : log.video;
  const references = await Promise.all(
    (log.references || []).map(async (item) => ({
      ...item,
      dataUrl: await resolveImageUrl(item.storageKey, item.dataUrl)
    }))
  );
  const config = normalizeLogConfig(log);
  return {
    id: log.id || nanoid(),
    createdAt: log.createdAt || Date.now(),
    title: log.title || log.model || i18n.t("workbench.untitled"),
    prompt: log.prompt || "",
    time: log.time || (/* @__PURE__ */ new Date()).toLocaleString(i18n.resolvedLanguage, { hour12: false }),
    model: log.model || config.videoModel || "",
    config,
    references,
    durationMs: log.durationMs || 0,
    size: log.size || config.size || "",
    resolution: normalizeResolution(log.resolution || config.vquality || ""),
    seconds: log.seconds || config.videoSeconds || "",
    status: log.status || "success",
    task: log.task,
    video,
    error: log.error
  };
}
function serializeLog(log) {
  return {
    ...log,
    references: log.references.map((item) => ({ ...item, dataUrl: item.storageKey ? "" : item.dataUrl })),
    video: log.video?.storageKey ? { ...log.video, url: "" } : log.video
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
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 720,
      columnNumber: 114
    }, this), disabled: index <= 0, onClick: () => onMove(-1) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 720,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(Button, { size: "small", className: "!h-6 !w-6 !min-w-6 !rounded-full !bg-white/85 !p-0 !shadow-sm", icon: /* @__PURE__ */ jsxDEV(ArrowRight, { className: "size-3" }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 721,
      columnNumber: 114
    }, this), disabled: index >= total - 1, onClick: () => onMove(1) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
      lineNumber: 721,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx",
    lineNumber: 719,
    columnNumber: 5
  }, this);
}
_c8 = ReferenceOrderButtons;
function normalizeLogConfig(log) {
  return {
    model: log.config?.model || log.model || "",
    videoModel: log.config?.videoModel || log.model || "",
    size: log.config?.size || log.size || "",
    vquality: normalizeResolution(log.config?.vquality || log.resolution || ""),
    videoSeconds: log.config?.videoSeconds || log.seconds || "",
    videoGenerateAudio: log.config?.videoGenerateAudio || "true",
    videoWatermark: log.config?.videoWatermark || "false"
  };
}
function buildLog({ prompt, model, config, references, durationMs, status, task, video, error }) {
  const logConfig = {
    model: config.model,
    videoModel: config.videoModel,
    size: config.size,
    vquality: normalizeResolution(config.vquality),
    videoSeconds: config.videoSeconds,
    videoGenerateAudio: config.videoGenerateAudio,
    videoWatermark: config.videoWatermark
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
    size: logConfig.size,
    resolution: logConfig.vquality,
    seconds: logConfig.videoSeconds,
    status,
    task,
    video,
    error
  };
}
function buildVideoConfig(config, model) {
  return {
    ...config,
    model,
    videoModel: model,
    size: normalizeVideoSize(config.size),
    videoSeconds: normalizeVideoSeconds(config.videoSeconds),
    vquality: normalizeResolution(config.vquality),
    videoGenerateAudio: String(boolConfig(config.videoGenerateAudio, true)),
    videoWatermark: String(boolConfig(config.videoWatermark, false))
  };
}
function normalizeVideoSeconds(value) {
  if (String(value).trim() === "-1") return "-1";
  const seconds = Math.floor(Number(value) || 6);
  return String(Math.max(1, Math.min(20, seconds)));
}
function normalizeVideoSize(value) {
  return normalizeVideoSizeValue(value);
}
function normalizeResolution(value) {
  return normalizeVideoResolutionValue(value);
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
var _c, _c2, _c3, _c4, _c5, _c6, _c7, _c8;
$RefreshReg$(_c, "VideoPage");
$RefreshReg$(_c2, "GenerationSettings");
$RefreshReg$(_c3, "ResultVideoCard");
$RefreshReg$(_c4, "PendingVideoCard");
$RefreshReg$(_c5, "FailedVideoCard");
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
    RefreshRuntime.registerExportsForReactRefresh("E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/video/index.tsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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QVNRLHNCQUFzQnJHLE9BQWU7QUFDMUMsTUFBSTJKLE9BQU8zSixLQUFLLEVBQUVoQyxLQUFLLE1BQU0sS0FBTSxRQUFPO0FBQzFDLFFBQU13SyxVQUFVL0gsS0FBS21KLE1BQU1DLE9BQU83SixLQUFLLEtBQUssQ0FBQztBQUM3QyxTQUFPMkosT0FBT2xKLEtBQUtDLElBQUksR0FBR0QsS0FBS3FKLElBQUksSUFBSXRCLE9BQU8sQ0FBQyxDQUFDO0FBQ3BEO0FBRUEsU0FBU2tCLG1CQUFtQjFKLE9BQWU7QUFDdkMsU0FBT3BILHdCQUF3Qm9ILEtBQUs7QUFDeEM7QUFFQSxTQUFTb0csb0JBQW9CcEcsT0FBZTtBQUN4QyxTQUFPckgsOEJBQThCcUgsS0FBSztBQUM5QztBQUVBLFNBQVNzRixNQUFNeUUsSUFBWTtBQUN2QixTQUFPLElBQUl4SyxRQUFRLENBQUN5SyxZQUFZQyxXQUFXRCxTQUFTRCxFQUFFLENBQUM7QUFDM0Q7QUFBQyxJQUFBRyxJQUFBQyxLQUFBQyxLQUFBQyxLQUFBQyxLQUFBQyxLQUFBQyxLQUFBaEI7QUFBQSxhQUFBVSxJQUFBO0FBQUEsYUFBQUMsS0FBQTtBQUFBLGFBQUFDLEtBQUE7QUFBQSxhQUFBQyxLQUFBO0FBQUEsYUFBQUMsS0FBQTtBQUFBLGFBQUFDLEtBQUE7QUFBQSxhQUFBQyxLQUFBO0FBQUEsYUFBQWhCLEtBQUEiLCJuYW1lcyI6WyJBcnJvd0xlZnQiLCJBcnJvd1JpZ2h0IiwiQm9va09wZW4iLCJDaGVja1NxdWFyZSIsIkNsaXBib2FyZFBhc3RlIiwiRG93bmxvYWQiLCJGb2xkZXJQbHVzIiwiSGlzdG9yeSIsIkxvYWRlckNpcmNsZSIsIlBsdXMiLCJTbGlkZXJzSG9yaXpvbnRhbCIsIlNwYXJrbGVzIiwiVHJhc2gyIiwiVXBsb2FkIiwiVmlkZW9JY29uIiwidXNlRWZmZWN0IiwidXNlUmVmIiwidXNlU3RhdGUiLCJBcHAiLCJCdXR0b24iLCJDaGVja2JveCIsIkRyYXdlciIsIkVtcHR5IiwiSW5wdXQiLCJNb2RhbCIsIlRhZyIsIlR5cG9ncmFwaHkiLCJsb2NhbGZvcmFnZSIsIm5hbm9pZCIsInNhdmVBcyIsInVzZVRyYW5zbGF0aW9uIiwiQXNzZXRQaWNrZXJNb2RhbCIsIk1vZGVsUGlja2VyIiwiUHJvbXB0U2VsZWN0RGlhbG9nIiwiVmlkZW9TZXR0aW5nc1BhbmVsIiwibm9ybWFsaXplVmlkZW9SZXNvbHV0aW9uVmFsdWUiLCJub3JtYWxpemVWaWRlb1NpemVWYWx1ZSIsInZpZGVvU2l6ZUxhYmVsIiwiY2FudmFzVGhlbWVzIiwiZm9ybWF0Qnl0ZXMiLCJmb3JtYXREdXJhdGlvbiIsImRlbGV0ZVN0b3JlZE1lZGlhIiwicmVzb2x2ZU1lZGlhVXJsIiwicmVzb2x2ZUltYWdlVXJsIiwidXBsb2FkSW1hZ2UiLCJjcmVhdGVWaWRlb0dlbmVyYXRpb25UYXNrIiwicG9sbFZpZGVvR2VuZXJhdGlvblRhc2siLCJzdG9yZUdlbmVyYXRlZFZpZGVvIiwidXNlQXNzZXRTdG9yZSIsInVzZVdvcmtiZW5jaEFnZW50U3RvcmUiLCJib29sQ29uZmlnIiwibW9kZWxPcHRpb25MYWJlbCIsInVzZUNvbmZpZ1N0b3JlIiwidXNlRWZmZWN0aXZlQ29uZmlnIiwidXNlVGhlbWVTdG9yZSIsImkxOG4iLCJMT0dfU1RPUkVfS0VZIiwibG9nU3RvcmUiLCJjcmVhdGVJbnN0YW5jZSIsIm5hbWUiLCJzdG9yZU5hbWUiLCJWaWRlb1BhZ2UiLCJfcyIsIm1lc3NhZ2UiLCJ1c2VBcHAiLCJ0IiwiZmlsZUlucHV0UmVmIiwiZHJhZ0RlcHRoUmVmIiwiYWN0aXZlTG9nSWRzUmVmIiwiU2V0IiwiY29uZmlnIiwic3RhdGUiLCJlZmZlY3RpdmVDb25maWciLCJ1cGRhdGVDb25maWciLCJpc0FpQ29uZmlnUmVhZHkiLCJvcGVuQ29uZmlnRGlhbG9nIiwiYWRkQXNzZXQiLCJwcm9tcHQiLCJzZXRQcm9tcHQiLCJyZWZlcmVuY2VzIiwic2V0UmVmZXJlbmNlcyIsInJlc3VsdHMiLCJzZXRSZXN1bHRzIiwibG9ncyIsInNldExvZ3MiLCJydW5uaW5nIiwic2V0UnVubmluZyIsImxvZ3NPcGVuIiwic2V0TG9nc09wZW4iLCJzZXR0aW5nc09wZW4iLCJzZXRTZXR0aW5nc09wZW4iLCJwcm9tcHREaWFsb2dPcGVuIiwic2V0UHJvbXB0RGlhbG9nT3BlbiIsImFzc2V0UGlja2VyT3BlbiIsInNldEFzc2V0UGlja2VyT3BlbiIsInN0YXJ0ZWRBdCIsInNldFN0YXJ0ZWRBdCIsImVsYXBzZWRNcyIsInNldEVsYXBzZWRNcyIsInNlbGVjdGVkTG9nSWRzIiwic2V0U2VsZWN0ZWRMb2dJZHMiLCJwcmV2aWV3TG9nIiwic2V0UHJldmlld0xvZyIsImRlbGV0ZUNvbmZpcm1PcGVuIiwic2V0RGVsZXRlQ29uZmlybU9wZW4iLCJyZWZlcmVuY2VEcmFnVGFyZ2V0Iiwic2V0UmVmZXJlbmNlRHJhZ1RhcmdldCIsImF1dG9SdW5Ub2tlbiIsInNldEF1dG9SdW5Ub2tlbiIsInZpZGVvQ29tbWFuZCIsImNsZWFyVmlkZW9Db21tYW5kIiwidXBkYXRlQWdlbnRUYXNrIiwidXBkYXRlVGFzayIsInByb2Nlc3NlZENvbW1hbmRSZWYiLCJhZ2VudFRhc2tJZFJlZiIsInVuZGVmaW5lZCIsIm1vZGVsIiwidmlkZW9Nb2RlbCIsImNhbkdlbmVyYXRlIiwiQm9vbGVhbiIsInRyaW0iLCJ0aW1lciIsIndpbmRvdyIsInNldEludGVydmFsIiwicGVyZm9ybWFuY2UiLCJub3ciLCJjbGVhckludGVydmFsIiwicmVmcmVzaExvZ3MiLCJhZGRSZWZlcmVuY2VzIiwiZmlsZXMiLCJzZWxlY3RlZEZpbGVzIiwiQXJyYXkiLCJmcm9tIiwidW5zdXBwb3J0ZWQiLCJmaWx0ZXIiLCJmaWxlIiwidHlwZSIsInN0YXJ0c1dpdGgiLCJsZW5ndGgiLCJ3YXJuaW5nIiwiaW1hZ2VGaWxlcyIsInNsaWNlIiwibmV4dFJlZmVyZW5jZXMiLCJQcm9taXNlIiwiYWxsIiwibWFwIiwiaW1hZ2UiLCJpZCIsIm1pbWVUeXBlIiwiZGF0YVVybCIsInVybCIsInN0b3JhZ2VLZXkiLCJ2YWx1ZSIsImhhbmRsZVJlZmVyZW5jZURyYWdFbnRlciIsImV2ZW50IiwicHJldmVudERlZmF1bHQiLCJjdXJyZW50IiwiZGF0YVRyYW5zZmVyIiwidHlwZXMiLCJpbmNsdWRlcyIsImhhbmRsZVJlZmVyZW5jZURyYWdMZWF2ZSIsIk1hdGgiLCJtYXgiLCJoYW5kbGVSZWZlcmVuY2VEcm9wIiwiYWRkUmVmZXJlbmNlc0Zyb21DbGlwYm9hcmQiLCJpdGVtcyIsIm5hdmlnYXRvciIsImNsaXBib2FyZCIsInJlYWQiLCJibG9icyIsImZsYXRNYXAiLCJpdGVtIiwiZ2V0VHlwZSIsImVycm9yIiwiYmxvYiIsImluZGV4Iiwic3VjY2VzcyIsImNvdW50IiwiZ2VuZXJhdGUiLCJhZ2VudFRhc2tJZCIsInNuYXBzaG90IiwiYnVpbGRSZXF1ZXN0U25hcHNob3QiLCJzdGF0dXMiLCJiYXRjaFN0YXJ0ZWRBdCIsInRhc2siLCJ0ZXh0IiwibG9nIiwiYnVpbGRMb2ciLCJkdXJhdGlvbk1zIiwic2F2ZUxvZyIsInBvbGxHZW5lcmF0aW9uTG9nIiwiZXJyb3JNZXNzYWdlIiwiRXJyb3IiLCJzdWNjZXNzQ291bnQiLCJmYWlsQ291bnQiLCJub25jZSIsInJ1biIsInRhc2tJZCIsImJ1aWxkVmlkZW9Db25maWciLCJyZXRyeVJlc3VsdCIsImRvd25sb2FkVmlkZW8iLCJ2aWRlbyIsInNhdmVSZXN1bHRUb0Fzc2V0cyIsImtpbmQiLCJ0aXRsZSIsImNvdmVyVXJsIiwidGFncyIsInNvdXJjZSIsImRhdGEiLCJ3aWR0aCIsImhlaWdodCIsImJ5dGVzIiwibWV0YWRhdGEiLCJpbnNlcnRQaWNrZWRBc3NldCIsInBheWxvYWQiLCJjb250ZW50Iiwic3RvcmVkIiwiY3JlYXRlU2Vzc2lvbiIsImRlbGV0ZVNlbGVjdGVkTG9ncyIsIm1lZGlhS2V5cyIsImtleSIsInJlbW92ZUl0ZW0iLCJ0aGVuIiwicmVzdW1lUGVuZGluZyIsInNldEl0ZW0iLCJzZXJpYWxpemVMb2ciLCJuZXh0TG9ncyIsInJlYWRTdG9yZWRMb2dzIiwicmVzdW1lUGVuZGluZ0xvZ3MiLCJjb25maWdPdmVycmlkZSIsImhhcyIsImFkZCIsInRhc2tDb25maWciLCJhdHRlbXB0IiwicmVzdWx0IiwibmV4dFZpZGVvIiwiRGF0ZSIsImNyZWF0ZWRBdCIsImRlbGF5IiwiZGVsZXRlIiwic2l6ZSIsInByZXZpZXdHZW5lcmF0aW9uTG9nIiwidnF1YWxpdHkiLCJ2aWRlb1NlY29uZHMiLCJ2aWRlb0dlbmVyYXRlQXVkaW8iLCJ2aWRlb1dhdGVybWFyayIsInRhcmdldCIsImNsaWNrIiwiZHJvcEVmZmVjdCIsIm9mZnNldCIsIm1vdmVMaXN0SXRlbSIsInJlZiIsIm5vcm1hbGl6ZVJlc29sdXRpb24iLCJub3JtYWxpemVWaWRlb1NlY29uZHMiLCJ0aW1lIiwiUFJFU0VOVEVEX0lNQUdFX1NJTVBMRSIsImRhbmdlciIsIkdlbmVyYXRpb25TZXR0aW5ncyIsIl9zMiIsInRoZW1lIiwiUmVzdWx0VmlkZW9DYXJkIiwib25Eb3dubG9hZCIsIm9uU2F2ZUFzc2V0IiwiX3MzIiwiUGVuZGluZ1ZpZGVvQ2FyZCIsIl9zNCIsIkZhaWxlZFZpZGVvQ2FyZCIsIm9uUmV0cnkiLCJfczUiLCJyb3dzIiwiTG9nUGFuZWwiLCJhY3RpdmVMb2dJZCIsIm9uU2VsZWN0ZWRMb2dJZHNDaGFuZ2UiLCJvbkNyZWF0ZVNlc3Npb24iLCJvbkRlbGV0ZVNlbGVjdGVkIiwib25QcmV2aWV3TG9nIiwiX3M2IiwiYWxsU2VsZWN0ZWQiLCJ0b2dnbGVBbGwiLCJjaGVja2VkIiwiTG9nQ2FyZCIsInNlbGVjdGVkIiwiYWN0aXZlIiwib25TZWxlY3RlZENoYW5nZSIsIm9uQ2xpY2siLCJfczciLCJzdG9wUHJvcGFnYXRpb24iLCJyZXNvbHV0aW9uIiwic2Vjb25kcyIsIml0ZXJhdGUiLCJwdXNoIiwibm9ybWFsaXplTG9nIiwic29ydCIsImEiLCJiIiwibm9ybWFsaXplTG9nQ29uZmlnIiwidG9Mb2NhbGVTdHJpbmciLCJyZXNvbHZlZExhbmd1YWdlIiwiaG91cjEyIiwidGFyZ2V0SW5kZXgiLCJuZXh0IiwiUmVmZXJlbmNlT3JkZXJCdXR0b25zIiwidG90YWwiLCJvbk1vdmUiLCJfYzgiLCJsb2dDb25maWciLCJub3JtYWxpemVWaWRlb1NpemUiLCJTdHJpbmciLCJmbG9vciIsIk51bWJlciIsIm1pbiIsIm1zIiwicmVzb2x2ZSIsInNldFRpbWVvdXQiLCJfYyIsIl9jMiIsIl9jMyIsIl9jNCIsIl9jNSIsIl9jNiIsIl9jNyJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJpbmRleC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXJyb3dMZWZ0LCBBcnJvd1JpZ2h0LCBCb29rT3BlbiwgQ2hlY2tTcXVhcmUsIENsaXBib2FyZFBhc3RlLCBEb3dubG9hZCwgRm9sZGVyUGx1cywgSGlzdG9yeSwgTG9hZGVyQ2lyY2xlLCBQbHVzLCBTbGlkZXJzSG9yaXpvbnRhbCwgU3BhcmtsZXMsIFRyYXNoMiwgVXBsb2FkLCBWaWRlb0ljb24gfSBmcm9tIFwibHVjaWRlLXJlYWN0XCI7XG5pbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUsIHR5cGUgRHJhZ0V2ZW50IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBBcHAsIEJ1dHRvbiwgQ2hlY2tib3gsIERyYXdlciwgRW1wdHksIElucHV0LCBNb2RhbCwgVGFnLCBUeXBvZ3JhcGh5IH0gZnJvbSBcImFudGRcIjtcbmltcG9ydCBsb2NhbGZvcmFnZSBmcm9tIFwibG9jYWxmb3JhZ2VcIjtcbmltcG9ydCB7IG5hbm9pZCB9IGZyb20gXCJuYW5vaWRcIjtcbmltcG9ydCB7IHNhdmVBcyB9IGZyb20gXCJmaWxlLXNhdmVyXCI7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gXCJyZWFjdC1pMThuZXh0XCI7XG5cbmltcG9ydCB7IEFzc2V0UGlja2VyTW9kYWwsIHR5cGUgSW5zZXJ0QXNzZXRQYXlsb2FkIH0gZnJvbSBcIkAvY29tcG9uZW50cy9jYW52YXMvYXNzZXQtcGlja2VyLW1vZGFsXCI7XG5pbXBvcnQgeyBNb2RlbFBpY2tlciB9IGZyb20gXCJAL2NvbXBvbmVudHMvbW9kZWwtcGlja2VyXCI7XG5pbXBvcnQgeyBQcm9tcHRTZWxlY3REaWFsb2cgfSBmcm9tIFwiQC9jb21wb25lbnRzL3Byb21wdHMvcHJvbXB0LXNlbGVjdC1kaWFsb2dcIjtcbmltcG9ydCB7IFZpZGVvU2V0dGluZ3NQYW5lbCwgbm9ybWFsaXplVmlkZW9SZXNvbHV0aW9uVmFsdWUsIG5vcm1hbGl6ZVZpZGVvU2l6ZVZhbHVlLCB2aWRlb1NpemVMYWJlbCB9IGZyb20gXCJAL2NvbXBvbmVudHMvdmlkZW8tc2V0dGluZ3MtcGFuZWxcIjtcbmltcG9ydCB7IGNhbnZhc1RoZW1lcyB9IGZyb20gXCJAL2xpYi9jYW52YXMtdGhlbWVcIjtcbmltcG9ydCB7IGZvcm1hdEJ5dGVzLCBmb3JtYXREdXJhdGlvbiB9IGZyb20gXCJAL2xpYi9pbWFnZS11dGlsc1wiO1xuaW1wb3J0IHsgZGVsZXRlU3RvcmVkTWVkaWEsIHJlc29sdmVNZWRpYVVybCB9IGZyb20gXCJAL3NlcnZpY2VzL2ZpbGUtc3RvcmFnZVwiO1xuaW1wb3J0IHsgcmVzb2x2ZUltYWdlVXJsLCB1cGxvYWRJbWFnZSB9IGZyb20gXCJAL3NlcnZpY2VzL2ltYWdlLXN0b3JhZ2VcIjtcbmltcG9ydCB7IGNyZWF0ZVZpZGVvR2VuZXJhdGlvblRhc2ssIHBvbGxWaWRlb0dlbmVyYXRpb25UYXNrLCBzdG9yZUdlbmVyYXRlZFZpZGVvLCB0eXBlIFZpZGVvR2VuZXJhdGlvblRhc2sgfSBmcm9tIFwiQC9zZXJ2aWNlcy9hcGkvdmlkZW9cIjtcbmltcG9ydCB7IHVzZUFzc2V0U3RvcmUgfSBmcm9tIFwiQC9zdG9yZXMvdXNlLWFzc2V0LXN0b3JlXCI7XG5pbXBvcnQgeyB1c2VXb3JrYmVuY2hBZ2VudFN0b3JlIH0gZnJvbSBcIkAvc3RvcmVzL3VzZS13b3JrYmVuY2gtYWdlbnQtc3RvcmVcIjtcbmltcG9ydCB7IGJvb2xDb25maWcsIG1vZGVsT3B0aW9uTGFiZWwsIHVzZUNvbmZpZ1N0b3JlLCB1c2VFZmZlY3RpdmVDb25maWcsIHR5cGUgQWlDb25maWcgfSBmcm9tIFwiQC9zdG9yZXMvdXNlLWNvbmZpZy1zdG9yZVwiO1xuaW1wb3J0IHsgdXNlVGhlbWVTdG9yZSB9IGZyb20gXCJAL3N0b3Jlcy91c2UtdGhlbWUtc3RvcmVcIjtcbmltcG9ydCB0eXBlIHsgUmVmZXJlbmNlSW1hZ2UgfSBmcm9tIFwiQC90eXBlcy9pbWFnZVwiO1xuaW1wb3J0IGkxOG4gZnJvbSBcIkAvaTE4blwiO1xuXG50eXBlIEdlbmVyYXRlZFZpZGVvID0ge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgdXJsOiBzdHJpbmc7XG4gICAgc3RvcmFnZUtleTogc3RyaW5nO1xuICAgIGR1cmF0aW9uTXM6IG51bWJlcjtcbiAgICB3aWR0aDogbnVtYmVyO1xuICAgIGhlaWdodDogbnVtYmVyO1xuICAgIGJ5dGVzOiBudW1iZXI7XG4gICAgbWltZVR5cGU6IHN0cmluZztcbn07XG5cbnR5cGUgR2VuZXJhdGlvblJlc3VsdCA9IHtcbiAgICBpZDogc3RyaW5nO1xuICAgIHN0YXR1czogXCJwZW5kaW5nXCIgfCBcInN1Y2Nlc3NcIiB8IFwiZmFpbGVkXCI7XG4gICAgdmlkZW8/OiBHZW5lcmF0ZWRWaWRlbztcbiAgICBlcnJvcj86IHN0cmluZztcbn07XG5cbnR5cGUgR2VuZXJhdGlvbkxvZyA9IHtcbiAgICBpZDogc3RyaW5nO1xuICAgIGNyZWF0ZWRBdDogbnVtYmVyO1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgcHJvbXB0OiBzdHJpbmc7XG4gICAgdGltZTogc3RyaW5nO1xuICAgIG1vZGVsOiBzdHJpbmc7XG4gICAgY29uZmlnOiBHZW5lcmF0aW9uTG9nQ29uZmlnO1xuICAgIHJlZmVyZW5jZXM6IFJlZmVyZW5jZUltYWdlW107XG4gICAgZHVyYXRpb25NczogbnVtYmVyO1xuICAgIHNpemU6IHN0cmluZztcbiAgICByZXNvbHV0aW9uOiBzdHJpbmc7XG4gICAgc2Vjb25kczogc3RyaW5nO1xuICAgIHN0YXR1czogXCJwZW5kaW5nXCIgfCBcInN1Y2Nlc3NcIiB8IFwiZmFpbGVkXCI7XG4gICAgdGFzaz86IFZpZGVvR2VuZXJhdGlvblRhc2s7XG4gICAgdmlkZW8/OiBHZW5lcmF0ZWRWaWRlbztcbiAgICBlcnJvcj86IHN0cmluZztcbn07XG5cbnR5cGUgR2VuZXJhdGlvbkxvZ0NvbmZpZyA9IFBpY2s8QWlDb25maWcsIFwibW9kZWxcIiB8IFwidmlkZW9Nb2RlbFwiIHwgXCJzaXplXCIgfCBcInZxdWFsaXR5XCIgfCBcInZpZGVvU2Vjb25kc1wiIHwgXCJ2aWRlb0dlbmVyYXRlQXVkaW9cIiB8IFwidmlkZW9XYXRlcm1hcmtcIj47XG5cbnR5cGUgVXBkYXRlQWlDb25maWcgPSA8SyBleHRlbmRzIGtleW9mIEFpQ29uZmlnPihrZXk6IEssIHZhbHVlOiBBaUNvbmZpZ1tLXSkgPT4gdm9pZDtcblxuY29uc3QgTE9HX1NUT1JFX0tFWSA9IFwiaW5maW5pdGUtY2FudmFzOnZpZGVvX2dlbmVyYXRpb25fbG9nc1wiO1xuY29uc3QgbG9nU3RvcmUgPSBsb2NhbGZvcmFnZS5jcmVhdGVJbnN0YW5jZSh7IG5hbWU6IFwiaW5maW5pdGUtY2FudmFzXCIsIHN0b3JlTmFtZTogXCJ2aWRlb19nZW5lcmF0aW9uX2xvZ3NcIiB9KTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gVmlkZW9QYWdlKCkge1xuICAgIGNvbnN0IHsgbWVzc2FnZSB9ID0gQXBwLnVzZUFwcCgpO1xuICAgIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgICBjb25zdCBmaWxlSW5wdXRSZWYgPSB1c2VSZWY8SFRNTElucHV0RWxlbWVudD4obnVsbCk7XG4gICAgY29uc3QgZHJhZ0RlcHRoUmVmID0gdXNlUmVmKDApO1xuICAgIGNvbnN0IGFjdGl2ZUxvZ0lkc1JlZiA9IHVzZVJlZjxTZXQ8c3RyaW5nPj4obmV3IFNldCgpKTtcbiAgICBjb25zdCBjb25maWcgPSB1c2VDb25maWdTdG9yZSgoc3RhdGUpID0+IHN0YXRlLmNvbmZpZyk7XG4gICAgY29uc3QgZWZmZWN0aXZlQ29uZmlnID0gdXNlRWZmZWN0aXZlQ29uZmlnKCk7XG4gICAgY29uc3QgdXBkYXRlQ29uZmlnID0gdXNlQ29uZmlnU3RvcmUoKHN0YXRlKSA9PiBzdGF0ZS51cGRhdGVDb25maWcpO1xuICAgIGNvbnN0IGlzQWlDb25maWdSZWFkeSA9IHVzZUNvbmZpZ1N0b3JlKChzdGF0ZSkgPT4gc3RhdGUuaXNBaUNvbmZpZ1JlYWR5KTtcbiAgICBjb25zdCBvcGVuQ29uZmlnRGlhbG9nID0gdXNlQ29uZmlnU3RvcmUoKHN0YXRlKSA9PiBzdGF0ZS5vcGVuQ29uZmlnRGlhbG9nKTtcbiAgICBjb25zdCBhZGRBc3NldCA9IHVzZUFzc2V0U3RvcmUoKHN0YXRlKSA9PiBzdGF0ZS5hZGRBc3NldCk7XG4gICAgY29uc3QgW3Byb21wdCwgc2V0UHJvbXB0XSA9IHVzZVN0YXRlKFwiXCIpO1xuICAgIGNvbnN0IFtyZWZlcmVuY2VzLCBzZXRSZWZlcmVuY2VzXSA9IHVzZVN0YXRlPFJlZmVyZW5jZUltYWdlW10+KFtdKTtcbiAgICBjb25zdCBbcmVzdWx0cywgc2V0UmVzdWx0c10gPSB1c2VTdGF0ZTxHZW5lcmF0aW9uUmVzdWx0W10+KFtdKTtcbiAgICBjb25zdCBbbG9ncywgc2V0TG9nc10gPSB1c2VTdGF0ZTxHZW5lcmF0aW9uTG9nW10+KFtdKTtcbiAgICBjb25zdCBbcnVubmluZywgc2V0UnVubmluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW2xvZ3NPcGVuLCBzZXRMb2dzT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW3NldHRpbmdzT3Blbiwgc2V0U2V0dGluZ3NPcGVuXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgICBjb25zdCBbcHJvbXB0RGlhbG9nT3Blbiwgc2V0UHJvbXB0RGlhbG9nT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW2Fzc2V0UGlja2VyT3Blbiwgc2V0QXNzZXRQaWNrZXJPcGVuXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgICBjb25zdCBbc3RhcnRlZEF0LCBzZXRTdGFydGVkQXRdID0gdXNlU3RhdGUoMCk7XG4gICAgY29uc3QgW2VsYXBzZWRNcywgc2V0RWxhcHNlZE1zXSA9IHVzZVN0YXRlKDApO1xuICAgIGNvbnN0IFtzZWxlY3RlZExvZ0lkcywgc2V0U2VsZWN0ZWRMb2dJZHNdID0gdXNlU3RhdGU8c3RyaW5nW10+KFtdKTtcbiAgICBjb25zdCBbcHJldmlld0xvZywgc2V0UHJldmlld0xvZ10gPSB1c2VTdGF0ZTxHZW5lcmF0aW9uTG9nIHwgbnVsbD4obnVsbCk7XG4gICAgY29uc3QgW2RlbGV0ZUNvbmZpcm1PcGVuLCBzZXREZWxldGVDb25maXJtT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW3JlZmVyZW5jZURyYWdUYXJnZXQsIHNldFJlZmVyZW5jZURyYWdUYXJnZXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICAgIGNvbnN0IFthdXRvUnVuVG9rZW4sIHNldEF1dG9SdW5Ub2tlbl0gPSB1c2VTdGF0ZSgwKTtcbiAgICBjb25zdCB2aWRlb0NvbW1hbmQgPSB1c2VXb3JrYmVuY2hBZ2VudFN0b3JlKChzdGF0ZSkgPT4gc3RhdGUudmlkZW9Db21tYW5kKTtcbiAgICBjb25zdCBjbGVhclZpZGVvQ29tbWFuZCA9IHVzZVdvcmtiZW5jaEFnZW50U3RvcmUoKHN0YXRlKSA9PiBzdGF0ZS5jbGVhclZpZGVvQ29tbWFuZCk7XG4gICAgY29uc3QgdXBkYXRlQWdlbnRUYXNrID0gdXNlV29ya2JlbmNoQWdlbnRTdG9yZSgoc3RhdGUpID0+IHN0YXRlLnVwZGF0ZVRhc2spO1xuICAgIGNvbnN0IHByb2Nlc3NlZENvbW1hbmRSZWYgPSB1c2VSZWYoMCk7XG4gICAgY29uc3QgYWdlbnRUYXNrSWRSZWYgPSB1c2VSZWY8c3RyaW5nIHwgdW5kZWZpbmVkPih1bmRlZmluZWQpO1xuXG4gICAgY29uc3QgbW9kZWwgPSBlZmZlY3RpdmVDb25maWcudmlkZW9Nb2RlbCB8fCBlZmZlY3RpdmVDb25maWcubW9kZWw7XG4gICAgY29uc3QgY2FuR2VuZXJhdGUgPSBCb29sZWFuKHByb21wdC50cmltKCkpO1xuXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgaWYgKCFydW5uaW5nIHx8ICFzdGFydGVkQXQpIHJldHVybjtcbiAgICAgICAgY29uc3QgdGltZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4gc2V0RWxhcHNlZE1zKHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnRlZEF0KSwgMTAwMCk7XG4gICAgICAgIHJldHVybiAoKSA9PiB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgfSwgW3J1bm5pbmcsIHN0YXJ0ZWRBdF0pO1xuXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgdm9pZCByZWZyZXNoTG9ncygpO1xuICAgIH0sIFtdKTtcblxuICAgIGNvbnN0IGFkZFJlZmVyZW5jZXMgPSBhc3luYyAoZmlsZXM/OiBGaWxlTGlzdCB8IG51bGwpID0+IHtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRGaWxlcyA9IEFycmF5LmZyb20oZmlsZXMgfHwgW10pO1xuICAgICAgICBjb25zdCB1bnN1cHBvcnRlZCA9IHNlbGVjdGVkRmlsZXMuZmlsdGVyKChmaWxlKSA9PiAhZmlsZS50eXBlLnN0YXJ0c1dpdGgoXCJpbWFnZS9cIikpO1xuICAgICAgICBpZiAodW5zdXBwb3J0ZWQubGVuZ3RoKSBtZXNzYWdlLndhcm5pbmcodChcInZpZGVvV29ya2JlbmNoLnVuc3VwcG9ydGVkRmlsZXNcIikpO1xuICAgICAgICBjb25zdCBpbWFnZUZpbGVzID0gc2VsZWN0ZWRGaWxlcy5maWx0ZXIoKGZpbGUpID0+IGZpbGUudHlwZS5zdGFydHNXaXRoKFwiaW1hZ2UvXCIpKS5zbGljZSgwLCA3IC0gcmVmZXJlbmNlcy5sZW5ndGgpO1xuICAgICAgICBjb25zdCBuZXh0UmVmZXJlbmNlcyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgICAgaW1hZ2VGaWxlcy5tYXAoYXN5bmMgKGZpbGUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbWFnZSA9IGF3YWl0IHVwbG9hZEltYWdlKGZpbGUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGlkOiBuYW5vaWQoKSwgbmFtZTogZmlsZS5uYW1lLCB0eXBlOiBpbWFnZS5taW1lVHlwZSwgZGF0YVVybDogaW1hZ2UudXJsLCBzdG9yYWdlS2V5OiBpbWFnZS5zdG9yYWdlS2V5IH07XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgICAgc2V0UmVmZXJlbmNlcygodmFsdWUpID0+IFsuLi52YWx1ZSwgLi4ubmV4dFJlZmVyZW5jZXNdLnNsaWNlKDAsIDcpKTtcbiAgICB9O1xuXG4gICAgY29uc3QgaGFuZGxlUmVmZXJlbmNlRHJhZ0VudGVyID0gKGV2ZW50OiBEcmFnRXZlbnQ8SFRNTERpdkVsZW1lbnQ+KSA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGRyYWdEZXB0aFJlZi5jdXJyZW50ICs9IDE7XG4gICAgICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIudHlwZXMuaW5jbHVkZXMoXCJGaWxlc1wiKSkgc2V0UmVmZXJlbmNlRHJhZ1RhcmdldCh0cnVlKTtcbiAgICB9O1xuXG4gICAgY29uc3QgaGFuZGxlUmVmZXJlbmNlRHJhZ0xlYXZlID0gKGV2ZW50OiBEcmFnRXZlbnQ8SFRNTERpdkVsZW1lbnQ+KSA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGRyYWdEZXB0aFJlZi5jdXJyZW50ID0gTWF0aC5tYXgoMCwgZHJhZ0RlcHRoUmVmLmN1cnJlbnQgLSAxKTtcbiAgICAgICAgaWYgKCFkcmFnRGVwdGhSZWYuY3VycmVudCkgc2V0UmVmZXJlbmNlRHJhZ1RhcmdldChmYWxzZSk7XG4gICAgfTtcblxuICAgIGNvbnN0IGhhbmRsZVJlZmVyZW5jZURyb3AgPSAoZXZlbnQ6IERyYWdFdmVudDxIVE1MRGl2RWxlbWVudD4pID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZHJhZ0RlcHRoUmVmLmN1cnJlbnQgPSAwO1xuICAgICAgICBzZXRSZWZlcmVuY2VEcmFnVGFyZ2V0KGZhbHNlKTtcbiAgICAgICAgdm9pZCBhZGRSZWZlcmVuY2VzKGV2ZW50LmRhdGFUcmFuc2Zlci5maWxlcyk7XG4gICAgfTtcblxuICAgIGNvbnN0IGFkZFJlZmVyZW5jZXNGcm9tQ2xpcGJvYXJkID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLnJlYWQoKTtcbiAgICAgICAgICAgIGNvbnN0IGJsb2JzID0gYXdhaXQgUHJvbWlzZS5hbGwoaXRlbXMuZmxhdE1hcCgoaXRlbSkgPT4gaXRlbS50eXBlcy5maWx0ZXIoKHR5cGUpID0+IHR5cGUuc3RhcnRzV2l0aChcImltYWdlL1wiKSkubWFwKCh0eXBlKSA9PiBpdGVtLmdldFR5cGUodHlwZSkpKSk7XG4gICAgICAgICAgICBpZiAoIWJsb2JzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UuZXJyb3IodChcInZpZGVvV29ya2JlbmNoLmNsaXBib2FyZEVtcHR5XCIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBuZXh0UmVmZXJlbmNlcyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgICAgICAgIGJsb2JzLnNsaWNlKDAsIDcgLSByZWZlcmVuY2VzLmxlbmd0aCkubWFwKGFzeW5jIChibG9iLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWFnZSA9IGF3YWl0IHVwbG9hZEltYWdlKGJsb2IpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBpZDogbmFub2lkKCksIG5hbWU6IGBjbGlwYm9hcmQtJHtpbmRleCArIDF9LnBuZ2AsIHR5cGU6IGltYWdlLm1pbWVUeXBlLCBkYXRhVXJsOiBpbWFnZS51cmwsIHN0b3JhZ2VLZXk6IGltYWdlLnN0b3JhZ2VLZXkgfTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBzZXRSZWZlcmVuY2VzKCh2YWx1ZSkgPT4gWy4uLnZhbHVlLCAuLi5uZXh0UmVmZXJlbmNlc10uc2xpY2UoMCwgNykpO1xuICAgICAgICAgICAgbWVzc2FnZS5zdWNjZXNzKHQoXCJ2aWRlb1dvcmtiZW5jaC5jbGlwYm9hcmRBZGRlZFwiLCB7IGNvdW50OiBuZXh0UmVmZXJlbmNlcy5sZW5ndGggfSkpO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIG1lc3NhZ2UuZXJyb3IodChcInZpZGVvV29ya2JlbmNoLmNsaXBib2FyZEVtcHR5XCIpKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgY29uc3QgZ2VuZXJhdGUgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGFnZW50VGFza0lkID0gYWdlbnRUYXNrSWRSZWYuY3VycmVudDtcbiAgICAgICAgYWdlbnRUYXNrSWRSZWYuY3VycmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3Qgc25hcHNob3QgPSBidWlsZFJlcXVlc3RTbmFwc2hvdCgpO1xuICAgICAgICBpZiAoIXNuYXBzaG90KSB7XG4gICAgICAgICAgICBpZiAoYWdlbnRUYXNrSWQpIHVwZGF0ZUFnZW50VGFzayhhZ2VudFRhc2tJZCwgeyBzdGF0dXM6IFwiZmFpbGVkXCIsIGVycm9yOiB0KFwidmlkZW9Xb3JrYmVuY2guaW52YWxpZFBhcmFtc1wiKSB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzZXRFbGFwc2VkTXMoMCk7XG4gICAgICAgIHNldFJ1bm5pbmcodHJ1ZSk7XG4gICAgICAgIGlmIChhZ2VudFRhc2tJZCkgdXBkYXRlQWdlbnRUYXNrKGFnZW50VGFza0lkLCB7IHN0YXR1czogXCJydW5uaW5nXCIsIGVycm9yOiB1bmRlZmluZWQgfSk7XG4gICAgICAgIHNldFByZXZpZXdMb2cobnVsbCk7XG4gICAgICAgIHNldFJlc3VsdHMoW3sgaWQ6IG5hbm9pZCgpLCBzdGF0dXM6IFwicGVuZGluZ1wiIH1dKTtcbiAgICAgICAgY29uc3QgYmF0Y2hTdGFydGVkQXQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgc2V0U3RhcnRlZEF0KGJhdGNoU3RhcnRlZEF0KTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHRhc2sgPSBhd2FpdCBjcmVhdGVWaWRlb0dlbmVyYXRpb25UYXNrKHNuYXBzaG90LmNvbmZpZywgc25hcHNob3QudGV4dCwgc25hcHNob3QucmVmZXJlbmNlcyk7XG4gICAgICAgICAgICBjb25zdCBsb2cgPSBidWlsZExvZyh7IHByb21wdDogc25hcHNob3QudGV4dCwgbW9kZWwsIGNvbmZpZzogc25hcHNob3QuY29uZmlnLCByZWZlcmVuY2VzOiBzbmFwc2hvdC5yZWZlcmVuY2VzLCBkdXJhdGlvbk1zOiAwLCBzdGF0dXM6IFwicGVuZGluZ1wiLCB0YXNrIH0pO1xuICAgICAgICAgICAgYXdhaXQgc2F2ZUxvZyhsb2csIGZhbHNlKTtcbiAgICAgICAgICAgIHZvaWQgcG9sbEdlbmVyYXRpb25Mb2cobG9nLCBzbmFwc2hvdC5jb25maWcsIGFnZW50VGFza0lkKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogdChcIndvcmtiZW5jaC5nZW5lcmF0aW9uRmFpbGVkXCIpO1xuICAgICAgICAgICAgc2V0UmVzdWx0cyhbeyBpZDogbmFub2lkKCksIHN0YXR1czogXCJmYWlsZWRcIiwgZXJyb3I6IGVycm9yTWVzc2FnZSB9XSk7XG4gICAgICAgICAgICBpZiAoYWdlbnRUYXNrSWQpIHVwZGF0ZUFnZW50VGFzayhhZ2VudFRhc2tJZCwgeyBzdGF0dXM6IFwiZmFpbGVkXCIsIHN1Y2Nlc3NDb3VudDogMCwgZmFpbENvdW50OiAxLCBlcnJvcjogZXJyb3JNZXNzYWdlIH0pO1xuICAgICAgICAgICAgYXdhaXQgc2F2ZUxvZyhidWlsZExvZyh7IHByb21wdDogc25hcHNob3QudGV4dCwgbW9kZWwsIGNvbmZpZzogc25hcHNob3QuY29uZmlnLCByZWZlcmVuY2VzOiBzbmFwc2hvdC5yZWZlcmVuY2VzLCBkdXJhdGlvbk1zOiBwZXJmb3JtYW5jZS5ub3coKSAtIGJhdGNoU3RhcnRlZEF0LCBzdGF0dXM6IFwiZmFpbGVkXCIsIGVycm9yOiBlcnJvck1lc3NhZ2UgfSkpO1xuICAgICAgICAgICAgbWVzc2FnZS5lcnJvcihlcnJvck1lc3NhZ2UpO1xuICAgICAgICAgICAgc2V0UnVubmluZyhmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gSGFuZGxlIHZpZGVvLWdlbmVyYXRpb24gY29tbWFuZHMgZnJvbSB0aGUgQWdlbnQgcGFuZWwgYnkgc2V0dGluZyB0aGUgcHJvbXB0IGFuZCBvcHRpb25hbGx5IHN0YXJ0aW5nIGdlbmVyYXRpb24uXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgaWYgKCF2aWRlb0NvbW1hbmQgfHwgdmlkZW9Db21tYW5kLm5vbmNlID09PSBwcm9jZXNzZWRDb21tYW5kUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgcHJvY2Vzc2VkQ29tbWFuZFJlZi5jdXJyZW50ID0gdmlkZW9Db21tYW5kLm5vbmNlO1xuICAgICAgICBjbGVhclZpZGVvQ29tbWFuZCgpO1xuICAgICAgICBpZiAodHlwZW9mIHZpZGVvQ29tbWFuZC5wcm9tcHQgPT09IFwic3RyaW5nXCIpIHNldFByb21wdCh2aWRlb0NvbW1hbmQucHJvbXB0KTtcbiAgICAgICAgaWYgKHZpZGVvQ29tbWFuZC5ydW4gJiYgcnVubmluZykge1xuICAgICAgICAgICAgaWYgKHZpZGVvQ29tbWFuZC50YXNrSWQpIHVwZGF0ZUFnZW50VGFzayh2aWRlb0NvbW1hbmQudGFza0lkLCB7IHN0YXR1czogXCJmYWlsZWRcIiwgZXJyb3I6IHQoXCJ2aWRlb1dvcmtiZW5jaC5idXN5XCIpIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2aWRlb0NvbW1hbmQucnVuKSB7XG4gICAgICAgICAgICBhZ2VudFRhc2tJZFJlZi5jdXJyZW50ID0gdmlkZW9Db21tYW5kLnRhc2tJZDtcbiAgICAgICAgICAgIHNldEF1dG9SdW5Ub2tlbigodmFsdWUpID0+IHZhbHVlICsgMSk7XG4gICAgICAgIH1cbiAgICB9LCBbdmlkZW9Db21tYW5kLCBjbGVhclZpZGVvQ29tbWFuZCwgcnVubmluZywgdXBkYXRlQWdlbnRUYXNrXSk7XG5cbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAoIWF1dG9SdW5Ub2tlbikgcmV0dXJuO1xuICAgICAgICB2b2lkIGdlbmVyYXRlKCk7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgICB9LCBbYXV0b1J1blRva2VuXSk7XG5cbiAgICBjb25zdCBidWlsZFJlcXVlc3RTbmFwc2hvdCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IHByb21wdC50cmltKCk7XG4gICAgICAgIGlmICghdGV4dCkge1xuICAgICAgICAgICAgbWVzc2FnZS5lcnJvcih0KFwidmlkZW9Xb3JrYmVuY2gucHJvbXB0UmVxdWlyZWRcIikpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc0FpQ29uZmlnUmVhZHkoZWZmZWN0aXZlQ29uZmlnLCBtb2RlbCkpIHtcbiAgICAgICAgICAgIG1lc3NhZ2Uud2FybmluZyh0KFwid29ya2JlbmNoLmNvbmZpZ0ZpcnN0XCIpKTtcbiAgICAgICAgICAgIG9wZW5Db25maWdEaWFsb2codHJ1ZSk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyB0ZXh0LCBjb25maWc6IGJ1aWxkVmlkZW9Db25maWcoZWZmZWN0aXZlQ29uZmlnLCBtb2RlbCksIHJlZmVyZW5jZXM6IFsuLi5yZWZlcmVuY2VzXSB9O1xuICAgIH07XG5cbiAgICBjb25zdCByZXRyeVJlc3VsdCA9ICgpID0+IHtcbiAgICAgICAgdm9pZCBnZW5lcmF0ZSgpO1xuICAgIH07XG5cbiAgICBjb25zdCBkb3dubG9hZFZpZGVvID0gKHZpZGVvOiBHZW5lcmF0ZWRWaWRlbykgPT4ge1xuICAgICAgICBzYXZlQXModmlkZW8udXJsLCBcInZpZGVvLm1wNFwiKTtcbiAgICB9O1xuXG4gICAgY29uc3Qgc2F2ZVJlc3VsdFRvQXNzZXRzID0gKHZpZGVvOiBHZW5lcmF0ZWRWaWRlbykgPT4ge1xuICAgICAgICBhZGRBc3NldCh7XG4gICAgICAgICAgICBraW5kOiBcInZpZGVvXCIsXG4gICAgICAgICAgICB0aXRsZTogdChcInZpZGVvV29ya2JlbmNoLnJlc3VsdFRpdGxlXCIpLFxuICAgICAgICAgICAgY292ZXJVcmw6IFwiXCIsXG4gICAgICAgICAgICB0YWdzOiBbXSxcbiAgICAgICAgICAgIHNvdXJjZTogdChcInZpZGVvV29ya2JlbmNoLnNvdXJjZVwiKSxcbiAgICAgICAgICAgIGRhdGE6IHsgdXJsOiB2aWRlby51cmwsIHN0b3JhZ2VLZXk6IHZpZGVvLnN0b3JhZ2VLZXksIHdpZHRoOiB2aWRlby53aWR0aCwgaGVpZ2h0OiB2aWRlby5oZWlnaHQsIGJ5dGVzOiB2aWRlby5ieXRlcywgbWltZVR5cGU6IHZpZGVvLm1pbWVUeXBlIH0sXG4gICAgICAgICAgICBtZXRhZGF0YTogeyBzb3VyY2U6IFwidmlkZW8tcGFnZVwiLCBwcm9tcHQgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIG1lc3NhZ2Uuc3VjY2Vzcyh0KFwiY29tbW9uLmFkZGVkVG9Bc3NldHNcIikpO1xuICAgIH07XG5cbiAgICBjb25zdCBpbnNlcnRQaWNrZWRBc3NldCA9IGFzeW5jIChwYXlsb2FkOiBJbnNlcnRBc3NldFBheWxvYWQpID0+IHtcbiAgICAgICAgaWYgKHBheWxvYWQua2luZCA9PT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgICAgIHNldFByb21wdChwYXlsb2FkLmNvbnRlbnQpO1xuICAgICAgICB9IGVsc2UgaWYgKHBheWxvYWQua2luZCA9PT0gXCJpbWFnZVwiKSB7XG4gICAgICAgICAgICBjb25zdCBzdG9yZWQgPSBhd2FpdCB1cGxvYWRJbWFnZShwYXlsb2FkLmRhdGFVcmwpO1xuICAgICAgICAgICAgc2V0UmVmZXJlbmNlcygodmFsdWUpID0+IFsuLi52YWx1ZSwgeyBpZDogbmFub2lkKCksIG5hbWU6IHBheWxvYWQudGl0bGUsIHR5cGU6IHN0b3JlZC5taW1lVHlwZSwgZGF0YVVybDogc3RvcmVkLnVybCwgc3RvcmFnZUtleTogc3RvcmVkLnN0b3JhZ2VLZXkgfV0uc2xpY2UoMCwgNykpO1xuICAgICAgICB9XG4gICAgICAgIHNldEFzc2V0UGlja2VyT3BlbihmYWxzZSk7XG4gICAgfTtcblxuICAgIGNvbnN0IGNyZWF0ZVNlc3Npb24gPSAoKSA9PiB7XG4gICAgICAgIHNldFByb21wdChcIlwiKTtcbiAgICAgICAgc2V0UmVmZXJlbmNlcyhbXSk7XG4gICAgICAgIHNldFJlc3VsdHMoW10pO1xuICAgICAgICBzZXRFbGFwc2VkTXMoMCk7XG4gICAgICAgIHNldFN0YXJ0ZWRBdCgwKTtcbiAgICAgICAgc2V0U2VsZWN0ZWRMb2dJZHMoW10pO1xuICAgICAgICBzZXRQcmV2aWV3TG9nKG51bGwpO1xuICAgIH07XG5cbiAgICBjb25zdCBkZWxldGVTZWxlY3RlZExvZ3MgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG1lZGlhS2V5cyA9IGxvZ3NcbiAgICAgICAgICAgIC5maWx0ZXIoKGxvZykgPT4gc2VsZWN0ZWRMb2dJZHMuaW5jbHVkZXMobG9nLmlkKSlcbiAgICAgICAgICAgIC5tYXAoKGxvZykgPT4gbG9nLnZpZGVvPy5zdG9yYWdlS2V5KVxuICAgICAgICAgICAgLmZpbHRlcigoa2V5KToga2V5IGlzIHN0cmluZyA9PiBCb29sZWFuKGtleSkpO1xuICAgICAgICB2b2lkIFByb21pc2UuYWxsKFtkZWxldGVTdG9yZWRNZWRpYShtZWRpYUtleXMpLCAuLi5zZWxlY3RlZExvZ0lkcy5tYXAoKGlkKSA9PiBsb2dTdG9yZS5yZW1vdmVJdGVtKGlkKSldKS50aGVuKCgpID0+IHJlZnJlc2hMb2dzKCkpO1xuICAgICAgICBpZiAocHJldmlld0xvZyAmJiBzZWxlY3RlZExvZ0lkcy5pbmNsdWRlcyhwcmV2aWV3TG9nLmlkKSkge1xuICAgICAgICAgICAgc2V0UHJldmlld0xvZyhudWxsKTtcbiAgICAgICAgICAgIHNldFJlc3VsdHMoW10pO1xuICAgICAgICB9XG4gICAgICAgIHNldFNlbGVjdGVkTG9nSWRzKFtdKTtcbiAgICAgICAgc2V0RGVsZXRlQ29uZmlybU9wZW4oZmFsc2UpO1xuICAgIH07XG5cbiAgICBjb25zdCBzYXZlTG9nID0gYXN5bmMgKGxvZzogR2VuZXJhdGlvbkxvZywgcmVzdW1lUGVuZGluZyA9IHRydWUpID0+IHtcbiAgICAgICAgYXdhaXQgbG9nU3RvcmUuc2V0SXRlbShsb2cuaWQsIHNlcmlhbGl6ZUxvZyhsb2cpKTtcbiAgICAgICAgYXdhaXQgcmVmcmVzaExvZ3MocmVzdW1lUGVuZGluZyk7XG4gICAgfTtcblxuICAgIGNvbnN0IHJlZnJlc2hMb2dzID0gYXN5bmMgKHJlc3VtZVBlbmRpbmcgPSB0cnVlKSA9PiB7XG4gICAgICAgIGNvbnN0IG5leHRMb2dzID0gYXdhaXQgcmVhZFN0b3JlZExvZ3MoKTtcbiAgICAgICAgc2V0TG9ncyhuZXh0TG9ncyk7XG4gICAgICAgIGlmIChyZXN1bWVQZW5kaW5nKSByZXN1bWVQZW5kaW5nTG9ncyhuZXh0TG9ncyk7XG4gICAgICAgIHJldHVybiBuZXh0TG9ncztcbiAgICB9O1xuXG4gICAgY29uc3QgcmVzdW1lUGVuZGluZ0xvZ3MgPSAoaXRlbXM6IEdlbmVyYXRpb25Mb2dbXSkgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IGxvZyBvZiBpdGVtcykge1xuICAgICAgICAgICAgaWYgKGxvZy5zdGF0dXMgPT09IFwicGVuZGluZ1wiICYmIGxvZy50YXNrKSB2b2lkIHBvbGxHZW5lcmF0aW9uTG9nKGxvZyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgcG9sbEdlbmVyYXRpb25Mb2cgPSBhc3luYyAobG9nOiBHZW5lcmF0aW9uTG9nLCBjb25maWdPdmVycmlkZT86IEFpQ29uZmlnLCBhZ2VudFRhc2tJZD86IHN0cmluZykgPT4ge1xuICAgICAgICBpZiAoIWxvZy50YXNrIHx8IGFjdGl2ZUxvZ0lkc1JlZi5jdXJyZW50Lmhhcyhsb2cuaWQpKSByZXR1cm47XG4gICAgICAgIGFjdGl2ZUxvZ0lkc1JlZi5jdXJyZW50LmFkZChsb2cuaWQpO1xuICAgICAgICBzZXRSdW5uaW5nKHRydWUpO1xuICAgICAgICBzZXRTdGFydGVkQXQoKHZhbHVlKSA9PiB2YWx1ZSB8fCBwZXJmb3JtYW5jZS5ub3coKSk7XG4gICAgICAgIHNldFJlc3VsdHMoKHZhbHVlKSA9PiAodmFsdWUubGVuZ3RoID8gdmFsdWUgOiBbeyBpZDogbG9nLmlkLCBzdGF0dXM6IFwicGVuZGluZ1wiIH1dKSk7XG4gICAgICAgIGNvbnN0IHRhc2tDb25maWcgPSBidWlsZFZpZGVvQ29uZmlnKHsgLi4uZWZmZWN0aXZlQ29uZmlnLCAuLi5sb2cuY29uZmlnIH0sIGxvZy50YXNrLm1vZGVsIHx8IGxvZy5tb2RlbCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IDEyMDsgYXR0ZW1wdCArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSBhd2FpdCBwb2xsVmlkZW9HZW5lcmF0aW9uVGFzayhjb25maWdPdmVycmlkZSB8fCB0YXNrQ29uZmlnLCBsb2cudGFzayk7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlLnN0YXR1cyA9PT0gXCJjb21wbGV0ZWRcIikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdG9yZWQgPSBhd2FpdCBzdG9yZUdlbmVyYXRlZFZpZGVvKHN0YXRlLnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5leHRWaWRlbzogR2VuZXJhdGVkVmlkZW8gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogbmFub2lkKCksXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHN0b3JlZC51cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdG9yYWdlS2V5OiBzdG9yZWQuc3RvcmFnZUtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uTXM6IERhdGUubm93KCkgLSBsb2cuY3JlYXRlZEF0LFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHN0b3JlZC53aWR0aCB8fCAxMjgwLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBzdG9yZWQuaGVpZ2h0IHx8IDcyMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ5dGVzOiBzdG9yZWQuYnl0ZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW1lVHlwZTogc3RvcmVkLm1pbWVUeXBlLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBzZXRSZXN1bHRzKFt7IGlkOiBuZXh0VmlkZW8uaWQsIHN0YXR1czogXCJzdWNjZXNzXCIsIHZpZGVvOiBuZXh0VmlkZW8gfV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWdlbnRUYXNrSWQpIHVwZGF0ZUFnZW50VGFzayhhZ2VudFRhc2tJZCwgeyBzdGF0dXM6IFwic3VjY2VlZGVkXCIsIHN1Y2Nlc3NDb3VudDogMSwgZmFpbENvdW50OiAwLCBlcnJvcjogdW5kZWZpbmVkIH0pO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBzYXZlTG9nKHsgLi4ubG9nLCBzdGF0dXM6IFwic3VjY2Vzc1wiLCBkdXJhdGlvbk1zOiBuZXh0VmlkZW8uZHVyYXRpb25NcywgdmlkZW86IG5leHRWaWRlbywgZXJyb3I6IHVuZGVmaW5lZCB9KTtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZS5zdWNjZXNzKHQoXCJ2aWRlb1dvcmtiZW5jaC5nZW5lcmF0ZWRcIikpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5zdGF0dXMgPT09IFwiZmFpbGVkXCIpIHRocm93IG5ldyBFcnJvcihzdGF0ZS5lcnJvcik7XG4gICAgICAgICAgICAgICAgaWYgKGF0dGVtcHQgPT09IDExOSkgdGhyb3cgbmV3IEVycm9yKHQoXCJ2aWRlb1dvcmtiZW5jaC50aW1lb3V0XCIpKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBkZWxheSgyNTAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogdChcIndvcmtiZW5jaC5nZW5lcmF0aW9uRmFpbGVkXCIpO1xuICAgICAgICAgICAgc2V0UmVzdWx0cyhbeyBpZDogbG9nLmlkLCBzdGF0dXM6IFwiZmFpbGVkXCIsIGVycm9yOiBlcnJvck1lc3NhZ2UgfV0pO1xuICAgICAgICAgICAgaWYgKGFnZW50VGFza0lkKSB1cGRhdGVBZ2VudFRhc2soYWdlbnRUYXNrSWQsIHsgc3RhdHVzOiBcImZhaWxlZFwiLCBzdWNjZXNzQ291bnQ6IDAsIGZhaWxDb3VudDogMSwgZXJyb3I6IGVycm9yTWVzc2FnZSB9KTtcbiAgICAgICAgICAgIGF3YWl0IHNhdmVMb2coeyAuLi5sb2csIHN0YXR1czogXCJmYWlsZWRcIiwgZHVyYXRpb25NczogRGF0ZS5ub3coKSAtIGxvZy5jcmVhdGVkQXQsIGVycm9yOiBlcnJvck1lc3NhZ2UgfSk7XG4gICAgICAgICAgICBtZXNzYWdlLmVycm9yKGVycm9yTWVzc2FnZSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBhY3RpdmVMb2dJZHNSZWYuY3VycmVudC5kZWxldGUobG9nLmlkKTtcbiAgICAgICAgICAgIGlmICghYWN0aXZlTG9nSWRzUmVmLmN1cnJlbnQuc2l6ZSkge1xuICAgICAgICAgICAgICAgIHNldFJ1bm5pbmcoZmFsc2UpO1xuICAgICAgICAgICAgICAgIHNldFN0YXJ0ZWRBdCgwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBwcmV2aWV3R2VuZXJhdGlvbkxvZyA9IChsb2c6IEdlbmVyYXRpb25Mb2cpID0+IHtcbiAgICAgICAgc2V0UHJldmlld0xvZyhsb2cpO1xuICAgICAgICBzZXRMb2dzT3BlbihmYWxzZSk7XG4gICAgICAgIHNldFByb21wdChsb2cucHJvbXB0KTtcbiAgICAgICAgc2V0UmVmZXJlbmNlcyhsb2cucmVmZXJlbmNlcyB8fCBbXSk7XG4gICAgICAgIGlmIChsb2cuY29uZmlnLnZpZGVvTW9kZWwgfHwgbG9nLm1vZGVsKSB1cGRhdGVDb25maWcoXCJ2aWRlb01vZGVsXCIsIGxvZy5jb25maWcudmlkZW9Nb2RlbCB8fCBsb2cubW9kZWwpO1xuICAgICAgICBpZiAobG9nLmNvbmZpZy5zaXplKSB1cGRhdGVDb25maWcoXCJzaXplXCIsIGxvZy5jb25maWcuc2l6ZSk7XG4gICAgICAgIGlmIChsb2cuY29uZmlnLnZxdWFsaXR5KSB1cGRhdGVDb25maWcoXCJ2cXVhbGl0eVwiLCBsb2cuY29uZmlnLnZxdWFsaXR5KTtcbiAgICAgICAgaWYgKGxvZy5jb25maWcudmlkZW9TZWNvbmRzKSB1cGRhdGVDb25maWcoXCJ2aWRlb1NlY29uZHNcIiwgbG9nLmNvbmZpZy52aWRlb1NlY29uZHMpO1xuICAgICAgICBpZiAobG9nLmNvbmZpZy52aWRlb0dlbmVyYXRlQXVkaW8pIHVwZGF0ZUNvbmZpZyhcInZpZGVvR2VuZXJhdGVBdWRpb1wiLCBsb2cuY29uZmlnLnZpZGVvR2VuZXJhdGVBdWRpbyk7XG4gICAgICAgIGlmIChsb2cuY29uZmlnLnZpZGVvV2F0ZXJtYXJrKSB1cGRhdGVDb25maWcoXCJ2aWRlb1dhdGVybWFya1wiLCBsb2cuY29uZmlnLnZpZGVvV2F0ZXJtYXJrKTtcbiAgICAgICAgc2V0UmVzdWx0cyhsb2cuc3RhdHVzID09PSBcInBlbmRpbmdcIiA/IFt7IGlkOiBsb2cuaWQsIHN0YXR1czogXCJwZW5kaW5nXCIgfV0gOiBsb2cudmlkZW8gPyBbeyBpZDogbG9nLnZpZGVvLmlkLCBzdGF0dXM6IFwic3VjY2Vzc1wiLCB2aWRlbzogbG9nLnZpZGVvIH1dIDogW3sgaWQ6IGxvZy5pZCwgc3RhdHVzOiBcImZhaWxlZFwiLCBlcnJvcjogbG9nLmVycm9yIHx8IHQoXCJ3b3JrYmVuY2guZ2VuZXJhdGlvbkZhaWxlZFwiKSB9XSk7XG4gICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBoLWZ1bGwgZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIGJnLXN0b25lLTUwIHRleHQtc3RvbmUtOTAwIGRhcms6Ymctc3RvbmUtOTUwIGRhcms6dGV4dC1zdG9uZS0xMDBcIj5cbiAgICAgICAgICAgIDxtYWluIGNsYXNzTmFtZT1cImdyaWQgbWluLWgtMCBmbGV4LTEgZ3JpZC1jb2xzLTEgZ2FwLTMgb3ZlcmZsb3cteS1hdXRvIHAtMyBsZzpncmlkLWNvbHMtWzMwMHB4X21pbm1heCgwLDFmcildIGxnOm92ZXJmbG93LWhpZGRlbiB4bDpncmlkLWNvbHMtWzMyMHB4X21pbm1heCgwLDFmcildXCI+XG4gICAgICAgICAgICAgICAgPGFzaWRlIGNsYXNzTmFtZT1cInRoaW4tc2Nyb2xsYmFyIGhpZGRlbiBtaW4taC0wIG92ZXJmbG93LXktYXV0byByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItc3RvbmUtMjAwIGJnLWNhcmQgcC00IHNoYWRvdy1zbSBkYXJrOmJvcmRlci1zdG9uZS04MDAgbGc6YmxvY2tcIj5cbiAgICAgICAgICAgICAgICAgICAgPExvZ1BhbmVsIGxvZ3M9e2xvZ3N9IHNlbGVjdGVkTG9nSWRzPXtzZWxlY3RlZExvZ0lkc30gYWN0aXZlTG9nSWQ9e3ByZXZpZXdMb2c/LmlkfSBvblNlbGVjdGVkTG9nSWRzQ2hhbmdlPXtzZXRTZWxlY3RlZExvZ0lkc30gb25DcmVhdGVTZXNzaW9uPXtjcmVhdGVTZXNzaW9ufSBvbkRlbGV0ZVNlbGVjdGVkPXsoKSA9PiBzZXREZWxldGVDb25maXJtT3Blbih0cnVlKX0gb25QcmV2aWV3TG9nPXtwcmV2aWV3R2VuZXJhdGlvbkxvZ30gLz5cbiAgICAgICAgICAgICAgICA8L2FzaWRlPlxuXG4gICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwiZ3JpZCBnYXAtMyBsZzptaW4taC0wIGxnOm92ZXJmbG93LWhpZGRlbiB4bDpncmlkLWNvbHMtWzQyMHB4X21pbm1heCgwLDFmcildXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGhpbi1zY3JvbGxiYXIgZmxleCBmbGV4LWNvbCByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItc3RvbmUtMjAwIGJnLWNhcmQgcC00IHNoYWRvdy1zbSBkYXJrOmJvcmRlci1zdG9uZS04MDAgbGc6bWluLWgtMCBsZzpvdmVyZmxvdy15LWF1dG9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1zdGFydCBqdXN0aWZ5LWJldHdlZW4gZ2FwLTNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDEgY2xhc3NOYW1lPVwidGV4dC0yeGwgZm9udC1zZW1pYm9sZCB0ZXh0LXN0b25lLTk1MCBkYXJrOnRleHQtc3RvbmUtMTAwXCI+e3QoXCJ2aWRlb1dvcmtiZW5jaC50aXRsZVwiKX08L2gxPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBzaHJpbmstMCBnYXAtMiBsZzpoaWRkZW5cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiBpY29uPXs8SGlzdG9yeSBjbGFzc05hbWU9XCJzaXplLTRcIiAvPn0gb25DbGljaz17KCkgPT4gc2V0TG9nc09wZW4odHJ1ZSl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3QoXCJ3b3JrYmVuY2gubG9nc1wiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gaWNvbj17PFNsaWRlcnNIb3Jpem9udGFsIGNsYXNzTmFtZT1cInNpemUtNFwiIC8+fSBvbkNsaWNrPXsoKSA9PiBzZXRTZXR0aW5nc09wZW4odHJ1ZSl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3QoXCJ3b3JrYmVuY2guc2V0dGluZ3NcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtNiBzcGFjZS15LTVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1iLTIgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KFwid29ya2JlbmNoLnByb21wdFwiKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIHNpemU9XCJzbWFsbFwiIGljb249ezxCb29rT3BlbiBjbGFzc05hbWU9XCJzaXplLTMuNVwiIC8+fSBvbkNsaWNrPXsoKSA9PiBzZXRQcm9tcHREaWFsb2dPcGVuKHRydWUpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3QoXCJ3b3JrYmVuY2gudmlld1Byb21wdHNcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiBzaXplPVwic21hbGxcIiBpY29uPXs8Rm9sZGVyUGx1cyBjbGFzc05hbWU9XCJzaXplLTMuNVwiIC8+fSBvbkNsaWNrPXsoKSA9PiBzZXRBc3NldFBpY2tlck9wZW4odHJ1ZSl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dChcIndvcmtiZW5jaC52aWV3QXNzZXRzXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8SW5wdXQuVGV4dEFyZWEgdmFsdWU9e3Byb21wdH0gb25DaGFuZ2U9eyhldmVudCkgPT4gc2V0UHJvbXB0KGV2ZW50LnRhcmdldC52YWx1ZSl9IHJvd3M9ezd9IHBsYWNlaG9sZGVyPXt0KFwidmlkZW9Xb3JrYmVuY2gucHJvbXB0UGxhY2Vob2xkZXJcIil9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYi0yIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtM1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1iYXNlIGZvbnQtc2VtaWJvbGRcIj57dChcInZpZGVvV29ya2JlbmNoLnJlZmVyZW5jZXNcIil9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiBzaXplPVwic21hbGxcIiBpY29uPXs8Q2xpcGJvYXJkUGFzdGUgY2xhc3NOYW1lPVwic2l6ZS0zLjVcIiAvPn0gb25DbGljaz17KCkgPT4gdm9pZCBhZGRSZWZlcmVuY2VzRnJvbUNsaXBib2FyZCgpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3QoXCJ3b3JrYmVuY2guY2xpcGJvYXJkXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cInNtYWxsXCIgaWNvbj17PFVwbG9hZCBjbGFzc05hbWU9XCJzaXplLTMuNVwiIC8+fSBvbkNsaWNrPXsoKSA9PiBmaWxlSW5wdXRSZWYuY3VycmVudD8uY2xpY2soKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0KFwid29ya2JlbmNoLnVwbG9hZFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgaG92ZXItc2Nyb2xsYmFyIGhvdmVyLXNjcm9sbGJhci1oaW50IGZsZXggbWluLWgtMjQgdy1mdWxsIG1pbi13LTAgbWF4LXctZnVsbCBnYXAtMiBvdmVyZmxvdy14LXNjcm9sbCBvdmVyZmxvdy15LWhpZGRlbiByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItZGFzaGVkIHAtMiBwYi0zIG92ZXJzY3JvbGwteC1jb250YWluIHRyYW5zaXRpb24tY29sb3JzICR7cmVmZXJlbmNlRHJhZ1RhcmdldCA/IFwiYm9yZGVyLXN0b25lLTkwMCBiZy1zdG9uZS0xMDAvODAgZGFyazpib3JkZXItc3RvbmUtMTAwIGRhcms6Ymctc3RvbmUtOTAwLzgwXCIgOiBcImJvcmRlci1zdG9uZS0zMDAgZGFyazpib3JkZXItc3RvbmUtNzAwXCJ9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRHJhZ0VudGVyPXtoYW5kbGVSZWZlcmVuY2VEcmFnRW50ZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRyYWdPdmVyPXsoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gXCJjb3B5XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EcmFnTGVhdmU9e2hhbmRsZVJlZmVyZW5jZURyYWdMZWF2ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRHJvcD17aGFuZGxlUmVmZXJlbmNlRHJvcH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3JlZmVyZW5jZXMubWFwKChpdGVtLCBpbmRleCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtpdGVtLmlkfSBjbGFzc05hbWU9XCJncm91cCByZWxhdGl2ZSBzaXplLTIwIHNocmluay0wIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLW1kIGJvcmRlciBib3JkZXItc3RvbmUtMjAwIGRhcms6Ym9yZGVyLXN0b25lLTgwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17aXRlbS5kYXRhVXJsfSBhbHQ9e2l0ZW0ubmFtZX0gY2xhc3NOYW1lPVwic2l6ZS1mdWxsIG9iamVjdC1jb3ZlclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFic29sdXRlIGxlZnQtMSB0b3AtMSByb3VuZGVkIGJnLWJsYWNrLzYwIHB4LTEuNSBweS0wLjUgdGV4dC1bMTBweF0gZm9udC1tZWRpdW0gdGV4dC13aGl0ZVwiPntpbmRleCArIDF9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UmVmZXJlbmNlT3JkZXJCdXR0b25zIGluZGV4PXtpbmRleH0gdG90YWw9e3JlZmVyZW5jZXMubGVuZ3RofSBvbk1vdmU9eyhvZmZzZXQpID0+IHNldFJlZmVyZW5jZXMoKHZhbHVlKSA9PiBtb3ZlTGlzdEl0ZW0odmFsdWUsIGluZGV4LCBvZmZzZXQpKX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYWJzb2x1dGUgcmlnaHQtMSB0b3AtMSBoaWRkZW4gc2l6ZS02IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciByb3VuZGVkIGJnLWJsYWNrLzYwIHRleHQtd2hpdGUgZ3JvdXAtaG92ZXI6ZmxleFwiIG9uQ2xpY2s9eygpID0+IHNldFJlZmVyZW5jZXMoKHZhbHVlKSA9PiB2YWx1ZS5maWx0ZXIoKHJlZikgPT4gcmVmLmlkICE9PSBpdGVtLmlkKSl9IGFyaWEtbGFiZWw9e3QoXCJ2aWRlb1dvcmtiZW5jaC5yZW1vdmVJbWFnZVwiKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VHJhc2gyIGNsYXNzTmFtZT1cInNpemUtMy41XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHshcmVmZXJlbmNlcy5sZW5ndGggPyA8ZGl2IGNsYXNzTmFtZT1cImZsZXggbWluLXctZnVsbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1zbSB0ZXh0LXN0b25lLTUwMFwiPntyZWZlcmVuY2VEcmFnVGFyZ2V0ID8gdChcInZpZGVvV29ya2JlbmNoLmRyb3BSZWZlcmVuY2VzXCIpIDogdChcInZpZGVvV29ya2JlbmNoLm5vSW1hZ2VzXCIpfTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXN0b25lLTIwMCBiZy1zdG9uZS01MCBweC0zIHB5LTIgdGV4dC1zbSBkYXJrOmJvcmRlci1zdG9uZS04MDAgZGFyazpiZy1zdG9uZS05MDAgc206aGlkZGVuXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRydW5jYXRlIHRleHQtc3RvbmUtNTAwIGRhcms6dGV4dC1zdG9uZS00MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHttb2RlbE9wdGlvbkxhYmVsKGVmZmVjdGl2ZUNvbmZpZywgbW9kZWwpfSDCtyB7bm9ybWFsaXplUmVzb2x1dGlvbihlZmZlY3RpdmVDb25maWcudnF1YWxpdHkpfXAgwrcge3ZpZGVvU2l6ZUxhYmVsKGVmZmVjdGl2ZUNvbmZpZy5zaXplKX0gwrcge25vcm1hbGl6ZVZpZGVvU2Vjb25kcyhlZmZlY3RpdmVDb25maWcudmlkZW9TZWNvbmRzKX1zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiBzaXplPVwic21hbGxcIiB0eXBlPVwidGV4dFwiIGljb249ezxTbGlkZXJzSG9yaXpvbnRhbCBjbGFzc05hbWU9XCJzaXplLTRcIiAvPn0gb25DbGljaz17KCkgPT4gc2V0U2V0dGluZ3NPcGVuKHRydWUpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0KFwid29ya2JlbmNoLmFkanVzdFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImhpZGRlbiBnYXAtNCBzbTpncmlkIHNtOmdyaWQtY29scy0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxHZW5lcmF0aW9uU2V0dGluZ3MgY29uZmlnPXtlZmZlY3RpdmVDb25maWd9IG1vZGVsPXttb2RlbH0gdXBkYXRlQ29uZmlnPXt1cGRhdGVDb25maWd9IG9wZW5Db25maWdEaWFsb2c9e29wZW5Db25maWdEaWFsb2d9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC1hdXRvIHB0LTZcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIHR5cGU9XCJwcmltYXJ5XCIgc2l6ZT1cImxhcmdlXCIgYmxvY2sgaWNvbj17PFNwYXJrbGVzIGNsYXNzTmFtZT1cInNpemUtNFwiIC8+fSBsb2FkaW5nPXtydW5uaW5nfSBkaXNhYmxlZD17IWNhbkdlbmVyYXRlIHx8IHJ1bm5pbmd9IG9uQ2xpY2s9eygpID0+IHZvaWQgZ2VuZXJhdGUoKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0KFwid29ya2JlbmNoLmdlbmVyYXRlXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGhpbi1zY3JvbGxiYXIgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXN0b25lLTIwMCBiZy1jYXJkIHAtNCBzaGFkb3ctc20gZGFyazpib3JkZXItc3RvbmUtODAwIGxnOm1pbi1oLTAgbGc6b3ZlcmZsb3cteS1hdXRvIGxnOnAtNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYi00IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtM1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtc2VtaWJvbGRcIj57dChcIndvcmtiZW5jaC5yZXN1bHRzXCIpfTwvaDI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3J1bm5pbmcgPyA8VGFnIGNsYXNzTmFtZT1cIm0tMCBweC0yIHB5LTFcIj57dChcIndvcmtiZW5jaC53YWl0aW5nXCIsIHsgdGltZTogZm9ybWF0RHVyYXRpb24oZWxhcHNlZE1zKSB9KX08L1RhZz4gOiBudWxsfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICB7cmVzdWx0cy5sZW5ndGggPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdhcC00XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtyZXN1bHRzLm1hcCgocmVzdWx0KSA9PiAocmVzdWx0LnN0YXR1cyA9PT0gXCJzdWNjZXNzXCIgJiYgcmVzdWx0LnZpZGVvID8gPFJlc3VsdFZpZGVvQ2FyZCBrZXk9e3Jlc3VsdC5pZH0gdmlkZW89e3Jlc3VsdC52aWRlb30gb25Eb3dubG9hZD17ZG93bmxvYWRWaWRlb30gb25TYXZlQXNzZXQ9e3NhdmVSZXN1bHRUb0Fzc2V0c30gLz4gOiByZXN1bHQuc3RhdHVzID09PSBcImZhaWxlZFwiID8gPEZhaWxlZFZpZGVvQ2FyZCBrZXk9e3Jlc3VsdC5pZH0gZXJyb3I9e3Jlc3VsdC5lcnJvciB8fCB0KFwid29ya2JlbmNoLmdlbmVyYXRpb25GYWlsZWRcIil9IG9uUmV0cnk9e3JldHJ5UmVzdWx0fSAvPiA6IDxQZW5kaW5nVmlkZW9DYXJkIGtleT17cmVzdWx0LmlkfSAvPikpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggbWluLWgtWzMyMHB4XSBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLWRhc2hlZCBib3JkZXItc3RvbmUtMzAwIHRleHQtY2VudGVyIGRhcms6Ym9yZGVyLXN0b25lLTcwMCBsZzptaW4taC1bNTYwcHhdXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxWaWRlb0ljb24gY2xhc3NOYW1lPVwibWItNCBzaXplLTExIHRleHQtc3RvbmUtNDAwXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEVtcHR5IGltYWdlPXtFbXB0eS5QUkVTRU5URURfSU1BR0VfU0lNUExFfSBkZXNjcmlwdGlvbj17dChcInZpZGVvV29ya2JlbmNoLmVtcHR5XCIpfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxuICAgICAgICAgICAgPC9tYWluPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgcmVmPXtmaWxlSW5wdXRSZWZ9XG4gICAgICAgICAgICAgICAgdHlwZT1cImZpbGVcIlxuICAgICAgICAgICAgICAgIGFjY2VwdD1cImltYWdlLypcIlxuICAgICAgICAgICAgICAgIG11bHRpcGxlXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaGlkZGVuXCJcbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHZvaWQgYWRkUmVmZXJlbmNlcyhldmVudC50YXJnZXQuZmlsZXMpO1xuICAgICAgICAgICAgICAgICAgICBldmVudC50YXJnZXQudmFsdWUgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPERyYXdlciB0aXRsZT17dChcIndvcmtiZW5jaC5sb2dzXCIpfSBwbGFjZW1lbnQ9XCJib3R0b21cIiBzaXplPVwibGFyZ2VcIiBvcGVuPXtsb2dzT3Blbn0gb25DbG9zZT17KCkgPT4gc2V0TG9nc09wZW4oZmFsc2UpfT5cbiAgICAgICAgICAgICAgICA8TG9nUGFuZWwgbG9ncz17bG9nc30gc2VsZWN0ZWRMb2dJZHM9e3NlbGVjdGVkTG9nSWRzfSBhY3RpdmVMb2dJZD17cHJldmlld0xvZz8uaWR9IG9uU2VsZWN0ZWRMb2dJZHNDaGFuZ2U9e3NldFNlbGVjdGVkTG9nSWRzfSBvbkNyZWF0ZVNlc3Npb249e2NyZWF0ZVNlc3Npb259IG9uRGVsZXRlU2VsZWN0ZWQ9eygpID0+IHNldERlbGV0ZUNvbmZpcm1PcGVuKHRydWUpfSBvblByZXZpZXdMb2c9e3ByZXZpZXdHZW5lcmF0aW9uTG9nfSAvPlxuICAgICAgICAgICAgPC9EcmF3ZXI+XG4gICAgICAgICAgICA8RHJhd2VyIHRpdGxlPXt0KFwid29ya2JlbmNoLnNldHRpbmdzXCIpfSBwbGFjZW1lbnQ9XCJib3R0b21cIiBoZWlnaHQ9XCI4MnZoXCIgb3Blbj17c2V0dGluZ3NPcGVufSBvbkNsb3NlPXsoKSA9PiBzZXRTZXR0aW5nc09wZW4oZmFsc2UpfT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTMgcGItNFwiPlxuICAgICAgICAgICAgICAgICAgICA8R2VuZXJhdGlvblNldHRpbmdzIGNvbmZpZz17ZWZmZWN0aXZlQ29uZmlnfSBtb2RlbD17bW9kZWx9IHVwZGF0ZUNvbmZpZz17dXBkYXRlQ29uZmlnfSBvcGVuQ29uZmlnRGlhbG9nPXtvcGVuQ29uZmlnRGlhbG9nfSAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9EcmF3ZXI+XG4gICAgICAgICAgICA8UHJvbXB0U2VsZWN0RGlhbG9nIG9wZW49e3Byb21wdERpYWxvZ09wZW59IG9uT3BlbkNoYW5nZT17c2V0UHJvbXB0RGlhbG9nT3Blbn0gb25TZWxlY3Q9e3NldFByb21wdH0gLz5cbiAgICAgICAgICAgIDxBc3NldFBpY2tlck1vZGFsIG9wZW49e2Fzc2V0UGlja2VyT3Blbn0gZGVmYXVsdFRhYj1cIm15LWFzc2V0c1wiIG9uSW5zZXJ0PXsocGF5bG9hZCkgPT4gdm9pZCBpbnNlcnRQaWNrZWRBc3NldChwYXlsb2FkKX0gb25DbG9zZT17KCkgPT4gc2V0QXNzZXRQaWNrZXJPcGVuKGZhbHNlKX0gLz5cbiAgICAgICAgICAgIDxNb2RhbCB0aXRsZT17dChcIndvcmtiZW5jaC5kZWxldGVMb2dzXCIpfSBvcGVuPXtkZWxldGVDb25maXJtT3Blbn0gb25DYW5jZWw9eygpID0+IHNldERlbGV0ZUNvbmZpcm1PcGVuKGZhbHNlKX0gb25Paz17ZGVsZXRlU2VsZWN0ZWRMb2dzfSBva1RleHQ9e3QoXCJjb21tb24uZGVsZXRlXCIpfSBva0J1dHRvblByb3BzPXt7IGRhbmdlcjogdHJ1ZSB9fSBjYW5jZWxUZXh0PXt0KFwiY29tbW9uLmNhbmNlbFwiKX0+XG4gICAgICAgICAgICAgICAge3QoXCJ3b3JrYmVuY2guZGVsZXRlTG9nc0NvbmZpcm1cIiwgeyBjb3VudDogc2VsZWN0ZWRMb2dJZHMubGVuZ3RoIH0pfVxuICAgICAgICAgICAgPC9Nb2RhbD5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cblxuZnVuY3Rpb24gR2VuZXJhdGlvblNldHRpbmdzKHsgY29uZmlnLCBtb2RlbCwgdXBkYXRlQ29uZmlnLCBvcGVuQ29uZmlnRGlhbG9nIH06IHsgY29uZmlnOiBBaUNvbmZpZzsgbW9kZWw6IHN0cmluZzsgdXBkYXRlQ29uZmlnOiBVcGRhdGVBaUNvbmZpZzsgb3BlbkNvbmZpZ0RpYWxvZzogKHNob3VsZFByb21wdENvbnRpbnVlPzogYm9vbGVhbikgPT4gdm9pZCB9KSB7XG4gICAgY29uc3QgdGhlbWUgPSBjYW52YXNUaGVtZXNbdXNlVGhlbWVTdG9yZSgoc3RhdGUpID0+IHN0YXRlLnRoZW1lKV07XG4gICAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPD5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJjb2wtc3Bhbi0yIGJsb2NrIG1pbi13LTAgc206Y29sLXNwYW4tMVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1iLTEuNSBibG9jayB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgc206bWItMiBzbTp0ZXh0LWJhc2VcIj57dChcIndvcmtiZW5jaC5tb2RlbFwiKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPE1vZGVsUGlja2VyIGNvbmZpZz17Y29uZmlnfSB2YWx1ZT17bW9kZWx9IG9uQ2hhbmdlPXsodmFsdWUpID0+IHVwZGF0ZUNvbmZpZyhcInZpZGVvTW9kZWxcIiwgdmFsdWUpfSBjYXBhYmlsaXR5PVwidmlkZW9cIiBmdWxsV2lkdGggb25NaXNzaW5nQ29uZmlnPXsoKSA9PiBvcGVuQ29uZmlnRGlhbG9nKGZhbHNlKX0gLz5cbiAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1zcGFuLTJcIj5cbiAgICAgICAgICAgICAgICA8VmlkZW9TZXR0aW5nc1BhbmVsIGNvbmZpZz17Y29uZmlnfSBvbkNvbmZpZ0NoYW5nZT17KGtleSwgdmFsdWUpID0+IHVwZGF0ZUNvbmZpZyhrZXksIHZhbHVlKX0gdGhlbWU9e3RoZW1lfSBzaG93VGl0bGU9e2ZhbHNlfSBjbGFzc05hbWU9XCJzcGFjZS15LTRcIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvPlxuICAgICk7XG59XG5cbmZ1bmN0aW9uIFJlc3VsdFZpZGVvQ2FyZCh7IHZpZGVvLCBvbkRvd25sb2FkLCBvblNhdmVBc3NldCB9OiB7IHZpZGVvOiBHZW5lcmF0ZWRWaWRlbzsgb25Eb3dubG9hZDogKHZpZGVvOiBHZW5lcmF0ZWRWaWRlbykgPT4gdm9pZDsgb25TYXZlQXNzZXQ6ICh2aWRlbzogR2VuZXJhdGVkVmlkZW8pID0+IHZvaWQgfSkge1xuICAgIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm92ZXJmbG93LWhpZGRlbiByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItc3RvbmUtMjAwIGJnLWJhY2tncm91bmQgZGFyazpib3JkZXItc3RvbmUtODAwXCI+XG4gICAgICAgICAgICA8dmlkZW8gc3JjPXt2aWRlby51cmx9IGNvbnRyb2xzIGNsYXNzTmFtZT1cImFzcGVjdC12aWRlbyB3LWZ1bGwgYmctYmxhY2sgb2JqZWN0LWNvbnRhaW5cIiAvPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC14LTMgZ2FwLXktMiBib3JkZXItdCBib3JkZXItc3RvbmUtMjAwIHB4LTMgcHktMi41IGRhcms6Ym9yZGVyLXN0b25lLTgwMFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBtaW4tdy0wIGZsZXgtd3JhcCBnYXAteC0yIGdhcC15LTEgdGV4dC14cyB0ZXh0LXN0b25lLTUwMCBkYXJrOnRleHQtc3RvbmUtNDAwXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAge3ZpZGVvLndpZHRofXh7dmlkZW8uaGVpZ2h0fVxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPntmb3JtYXRCeXRlcyh2aWRlby5ieXRlcyl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj57Zm9ybWF0RHVyYXRpb24odmlkZW8uZHVyYXRpb25Ncyl9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBzaHJpbmstMCBnYXAtMVwiPlxuICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIHNpemU9XCJzbWFsbFwiIGljb249ezxGb2xkZXJQbHVzIGNsYXNzTmFtZT1cInNpemUtMy41XCIgLz59IG9uQ2xpY2s9eygpID0+IG9uU2F2ZUFzc2V0KHZpZGVvKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICB7dChcImNvbW1vbi5hZGRUb0Fzc2V0c1wiKX1cbiAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cInNtYWxsXCIgaWNvbj17PERvd25sb2FkIGNsYXNzTmFtZT1cInNpemUtMy41XCIgLz59IG9uQ2xpY2s9eygpID0+IG9uRG93bmxvYWQodmlkZW8pfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHt0KFwiY29tbW9uLmRvd25sb2FkXCIpfVxuICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufVxuXG5mdW5jdGlvbiBQZW5kaW5nVmlkZW9DYXJkKCkge1xuICAgIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIGFzcGVjdC12aWRlbyBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLWRhc2hlZCBib3JkZXItc3RvbmUtMzAwIGJnLXN0b25lLTUwIGRhcms6Ym9yZGVyLXN0b25lLTcwMCBkYXJrOmJnLXN0b25lLTkwMFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0yIHRleHQtc20gdGV4dC1zdG9uZS01MDAgZGFyazp0ZXh0LXN0b25lLTQwMFwiPlxuICAgICAgICAgICAgICAgIDxMb2FkZXJDaXJjbGUgY2xhc3NOYW1lPVwic2l6ZS02IGFuaW1hdGUtc3BpblwiIC8+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3QoXCJ3b3JrYmVuY2guZ2VuZXJhdGluZ1wiKX08L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cblxuZnVuY3Rpb24gRmFpbGVkVmlkZW9DYXJkKHsgZXJyb3IsIG9uUmV0cnkgfTogeyBlcnJvcjogc3RyaW5nOyBvblJldHJ5OiAoKSA9PiB2b2lkIH0pIHtcbiAgICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXJlZC0yMDAgYmctcmVkLTUwIGRhcms6Ym9yZGVyLXJlZC05NTAgZGFyazpiZy1yZWQtOTUwLzIwXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggYXNwZWN0LXZpZGVvIGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMyBwLTUgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1yZWQtNjAwIGRhcms6dGV4dC1yZWQtMzAwXCI+e3QoXCJ3b3JrYmVuY2guZmFpbGVkXCIpfTwvZGl2PlxuICAgICAgICAgICAgICAgIDxUeXBvZ3JhcGh5LlBhcmFncmFwaCBlbGxpcHNpcz17eyByb3dzOiA0IH19IGNsYXNzTmFtZT1cIiFtYi0wICF0ZXh0LXhzICF0ZXh0LXJlZC01MDAgZGFyazohdGV4dC1yZWQtMzAwXCI+XG4gICAgICAgICAgICAgICAgICAgIHtlcnJvcn1cbiAgICAgICAgICAgICAgICA8L1R5cG9ncmFwaHkuUGFyYWdyYXBoPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1lbmQgYm9yZGVyLXQgYm9yZGVyLXJlZC0yMDAgcC0zIGRhcms6Ym9yZGVyLXJlZC05NTBcIj5cbiAgICAgICAgICAgICAgICA8QnV0dG9uIHNpemU9XCJzbWFsbFwiIGRhbmdlciBvbkNsaWNrPXtvblJldHJ5fT5cbiAgICAgICAgICAgICAgICAgICAge3QoXCJ3b3JrYmVuY2gucmV0cnlcIil9XG4gICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cblxuZnVuY3Rpb24gTG9nUGFuZWwoe1xuICAgIGxvZ3MsXG4gICAgc2VsZWN0ZWRMb2dJZHMsXG4gICAgYWN0aXZlTG9nSWQsXG4gICAgb25TZWxlY3RlZExvZ0lkc0NoYW5nZSxcbiAgICBvbkNyZWF0ZVNlc3Npb24sXG4gICAgb25EZWxldGVTZWxlY3RlZCxcbiAgICBvblByZXZpZXdMb2csXG59OiB7XG4gICAgbG9nczogR2VuZXJhdGlvbkxvZ1tdO1xuICAgIHNlbGVjdGVkTG9nSWRzOiBzdHJpbmdbXTtcbiAgICBhY3RpdmVMb2dJZD86IHN0cmluZztcbiAgICBvblNlbGVjdGVkTG9nSWRzQ2hhbmdlOiAoaWRzOiBzdHJpbmdbXSkgPT4gdm9pZDtcbiAgICBvbkNyZWF0ZVNlc3Npb246ICgpID0+IHZvaWQ7XG4gICAgb25EZWxldGVTZWxlY3RlZDogKCkgPT4gdm9pZDtcbiAgICBvblByZXZpZXdMb2c6IChsb2c6IEdlbmVyYXRpb25Mb2cpID0+IHZvaWQ7XG59KSB7XG4gICAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICAgIGNvbnN0IGFsbFNlbGVjdGVkID0gQm9vbGVhbihsb2dzLmxlbmd0aCkgJiYgc2VsZWN0ZWRMb2dJZHMubGVuZ3RoID09PSBsb2dzLmxlbmd0aDtcbiAgICBjb25zdCB0b2dnbGVBbGwgPSAoKSA9PiBvblNlbGVjdGVkTG9nSWRzQ2hhbmdlKGFsbFNlbGVjdGVkID8gW10gOiBsb2dzLm1hcCgobG9nKSA9PiBsb2cuaWQpKTtcblxuICAgIHJldHVybiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1iLTMgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zXCI+XG4gICAgICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cInRleHQtYmFzZSBmb250LXNlbWlib2xkXCI+e3QoXCJ3b3JrYmVuY2gubG9nc1wiKX08L2gyPlxuICAgICAgICAgICAgICAgIDxUYWcgY2xhc3NOYW1lPVwibS0wXCI+e2xvZ3MubGVuZ3RofTwvVGFnPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1iLTQgZmxleCBmbGV4LXdyYXAgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8QnV0dG9uIHNpemU9XCJzbWFsbFwiIGljb249ezxQbHVzIGNsYXNzTmFtZT1cInNpemUtMy41XCIgLz59IG9uQ2xpY2s9e29uQ3JlYXRlU2Vzc2lvbn0+XG4gICAgICAgICAgICAgICAgICAgIHt0KFwid29ya2JlbmNoLm5ld1wiKX1cbiAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICA8QnV0dG9uIHNpemU9XCJzbWFsbFwiIGljb249ezxDaGVja1NxdWFyZSBjbGFzc05hbWU9XCJzaXplLTMuNVwiIC8+fSBkaXNhYmxlZD17IWxvZ3MubGVuZ3RofSBvbkNsaWNrPXt0b2dnbGVBbGx9PlxuICAgICAgICAgICAgICAgICAgICB7YWxsU2VsZWN0ZWQgPyB0KFwiY29tbW9uLmNhbmNlbFwiKSA6IHQoXCJ3b3JrYmVuY2guc2VsZWN0QWxsXCIpfVxuICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cInNtYWxsXCIgZGFuZ2VyIGljb249ezxUcmFzaDIgY2xhc3NOYW1lPVwic2l6ZS0zLjVcIiAvPn0gZGlzYWJsZWQ9eyFzZWxlY3RlZExvZ0lkcy5sZW5ndGh9IG9uQ2xpY2s9e29uRGVsZXRlU2VsZWN0ZWR9PlxuICAgICAgICAgICAgICAgICAgICB7dChcImNvbW1vbi5kZWxldGVcIil9XG4gICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0zXCI+XG4gICAgICAgICAgICAgICAge2xvZ3MubWFwKChsb2cpID0+IChcbiAgICAgICAgICAgICAgICAgICAgPExvZ0NhcmQga2V5PXtsb2cuaWR9IGxvZz17bG9nfSBzZWxlY3RlZD17c2VsZWN0ZWRMb2dJZHMuaW5jbHVkZXMobG9nLmlkKX0gYWN0aXZlPXthY3RpdmVMb2dJZCA9PT0gbG9nLmlkfSBvblNlbGVjdGVkQ2hhbmdlPXsoY2hlY2tlZCkgPT4gb25TZWxlY3RlZExvZ0lkc0NoYW5nZShjaGVja2VkID8gWy4uLnNlbGVjdGVkTG9nSWRzLCBsb2cuaWRdIDogc2VsZWN0ZWRMb2dJZHMuZmlsdGVyKChpZCkgPT4gaWQgIT09IGxvZy5pZCkpfSBvbkNsaWNrPXsoKSA9PiBvblByZXZpZXdMb2cobG9nKX0gLz5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICB7IWxvZ3MubGVuZ3RoID8gPGRpdiBjbGFzc05hbWU9XCJmbGV4IG1pbi1oLTQ4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItZGFzaGVkIGJvcmRlci1zdG9uZS0zMDAgdGV4dC1jZW50ZXIgdGV4dC1zbSB0ZXh0LXN0b25lLTUwMCBkYXJrOmJvcmRlci1zdG9uZS03MDBcIj57dChcIndvcmtiZW5jaC5ub0xvZ3NcIil9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8Lz5cbiAgICApO1xufVxuXG5mdW5jdGlvbiBMb2dDYXJkKHsgbG9nLCBzZWxlY3RlZCwgYWN0aXZlLCBvblNlbGVjdGVkQ2hhbmdlLCBvbkNsaWNrIH06IHsgbG9nOiBHZW5lcmF0aW9uTG9nOyBzZWxlY3RlZDogYm9vbGVhbjsgYWN0aXZlOiBib29sZWFuOyBvblNlbGVjdGVkQ2hhbmdlOiAoY2hlY2tlZDogYm9vbGVhbikgPT4gdm9pZDsgb25DbGljazogKCkgPT4gdm9pZCB9KSB7XG4gICAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICAgIHJldHVybiAoXG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT17YGJsb2NrIHctZnVsbCByb3VuZGVkLWxnIGJvcmRlciBwLTIgdGV4dC1sZWZ0IHRyYW5zaXRpb24gJHthY3RpdmUgPyBcImJvcmRlci1zdG9uZS05MDAgYmctYmx1ZS01MCBkYXJrOmJvcmRlci1zdG9uZS0xMDAgZGFyazpiZy1ibHVlLTk1MC8yMFwiIDogXCJib3JkZXItc3RvbmUtMjAwIGJnLWJhY2tncm91bmQgaG92ZXI6Ymctc3RvbmUtNTAgZGFyazpib3JkZXItc3RvbmUtODAwIGRhcms6aG92ZXI6Ymctc3RvbmUtOTAwXCJ9YH0gb25DbGljaz17b25DbGlja30+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLVthdXRvX21pbm1heCgwLDFmcilfYXV0b10gaXRlbXMtc3RhcnQgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8Q2hlY2tib3ggY2xhc3NOYW1lPVwibXQtMC41XCIgY2hlY2tlZD17c2VsZWN0ZWR9IG9uQ2xpY2s9eyhldmVudCkgPT4gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCl9IG9uQ2hhbmdlPXsoZXZlbnQpID0+IG9uU2VsZWN0ZWRDaGFuZ2UoZXZlbnQudGFyZ2V0LmNoZWNrZWQpfSAvPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRydW5jYXRlIHRleHQtc20gZm9udC1zZW1pYm9sZCBsZWFkaW5nLTVcIj57bG9nLnRpdGxlfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTIgZmxleCBmbGV4LXdyYXAgZ2FwLTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxUYWcgY2xhc3NOYW1lPVwibS0wIGZsZXggaC02IGl0ZW1zLWNlbnRlciByb3VuZGVkLW1kIHB4LTEuNSB0ZXh0LXhzIGxlYWRpbmctbm9uZVwiPntsb2cuc2l6ZX08L1RhZz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxUYWcgY2xhc3NOYW1lPVwibS0wIGZsZXggaC02IGl0ZW1zLWNlbnRlciByb3VuZGVkLW1kIHB4LTEuNSB0ZXh0LXhzIGxlYWRpbmctbm9uZVwiPntsb2cucmVzb2x1dGlvbn1wPC9UYWc+XG4gICAgICAgICAgICAgICAgICAgICAgICA8VGFnIGNsYXNzTmFtZT1cIm0tMCBmbGV4IGgtNiBpdGVtcy1jZW50ZXIgcm91bmRlZC1tZCBweC0xLjUgdGV4dC14cyBsZWFkaW5nLW5vbmVcIj57bG9nLnNlY29uZHN9czwvVGFnPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQganVzdGlmeS1pdGVtcy1lbmQgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgPFRhZyBjbGFzc05hbWU9XCJtLTAgZmxleCBoLTYgaXRlbXMtY2VudGVyIHJvdW5kZWQtbWQgcHgtMS41IHRleHQteHMgbGVhZGluZy1ub25lXCIgY29sb3I9e2xvZy5zdGF0dXMgPT09IFwic3VjY2Vzc1wiID8gXCJibHVlXCIgOiBsb2cuc3RhdHVzID09PSBcInBlbmRpbmdcIiA/IFwicHJvY2Vzc2luZ1wiIDogXCJyZWRcIn0+XG4gICAgICAgICAgICAgICAgICAgICAgICB7dChgd29ya2JlbmNoLiR7bG9nLnN0YXR1cyA9PT0gXCJzdWNjZXNzXCIgPyBcInN1Y2Nlc3NcIiA6IGxvZy5zdGF0dXMgPT09IFwicGVuZGluZ1wiID8gXCJnZW5lcmF0aW5nXCIgOiBcImZhaWxlZFwifWApfVxuICAgICAgICAgICAgICAgICAgICA8L1RhZz5cbiAgICAgICAgICAgICAgICAgICAgPFRhZyBjbGFzc05hbWU9XCJtLTAgZmxleCBoLTYgaXRlbXMtY2VudGVyIHJvdW5kZWQtbWQgcHgtMS41IHRleHQteHMgbGVhZGluZy1ub25lXCIgY29sb3I9XCJncmVlblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge2Zvcm1hdER1cmF0aW9uKGxvZy5kdXJhdGlvbk1zKX1cbiAgICAgICAgICAgICAgICAgICAgPC9UYWc+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9idXR0b24+XG4gICAgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVhZFN0b3JlZExvZ3MoKSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09IFwidW5kZWZpbmVkXCIpIHJldHVybiBbXTtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBsb2dzOiBHZW5lcmF0aW9uTG9nW10gPSBbXTtcbiAgICAgICAgYXdhaXQgbG9nU3RvcmUuaXRlcmF0ZTxHZW5lcmF0aW9uTG9nLCB2b2lkPigodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGxvZ3MucHVzaCh2YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gKGF3YWl0IFByb21pc2UuYWxsKGxvZ3MubWFwKG5vcm1hbGl6ZUxvZykpKS5zb3J0KChhLCBiKSA9PiAoYi5jcmVhdGVkQXQgfHwgMCkgLSAoYS5jcmVhdGVkQXQgfHwgMCkpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBub3JtYWxpemVMb2cobG9nOiBQYXJ0aWFsPEdlbmVyYXRpb25Mb2c+KTogUHJvbWlzZTxHZW5lcmF0aW9uTG9nPiB7XG4gICAgY29uc3QgdmlkZW8gPSBsb2cudmlkZW8/LnN0b3JhZ2VLZXkgPyB7IC4uLmxvZy52aWRlbywgdXJsOiBhd2FpdCByZXNvbHZlTWVkaWFVcmwobG9nLnZpZGVvLnN0b3JhZ2VLZXksIGxvZy52aWRlby51cmwpIH0gOiBsb2cudmlkZW87XG4gICAgY29uc3QgcmVmZXJlbmNlcyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAobG9nLnJlZmVyZW5jZXMgfHwgW10pLm1hcChhc3luYyAoaXRlbSkgPT4gKHtcbiAgICAgICAgICAgIC4uLml0ZW0sXG4gICAgICAgICAgICBkYXRhVXJsOiBhd2FpdCByZXNvbHZlSW1hZ2VVcmwoaXRlbS5zdG9yYWdlS2V5LCBpdGVtLmRhdGFVcmwpLFxuICAgICAgICB9KSksXG4gICAgKTtcbiAgICBjb25zdCBjb25maWcgPSBub3JtYWxpemVMb2dDb25maWcobG9nKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBpZDogbG9nLmlkIHx8IG5hbm9pZCgpLFxuICAgICAgICBjcmVhdGVkQXQ6IGxvZy5jcmVhdGVkQXQgfHwgRGF0ZS5ub3coKSxcbiAgICAgICAgdGl0bGU6IGxvZy50aXRsZSB8fCBsb2cubW9kZWwgfHwgaTE4bi50KFwid29ya2JlbmNoLnVudGl0bGVkXCIpLFxuICAgICAgICBwcm9tcHQ6IGxvZy5wcm9tcHQgfHwgXCJcIixcbiAgICAgICAgdGltZTogbG9nLnRpbWUgfHwgbmV3IERhdGUoKS50b0xvY2FsZVN0cmluZyhpMThuLnJlc29sdmVkTGFuZ3VhZ2UsIHsgaG91cjEyOiBmYWxzZSB9KSxcbiAgICAgICAgbW9kZWw6IGxvZy5tb2RlbCB8fCBjb25maWcudmlkZW9Nb2RlbCB8fCBcIlwiLFxuICAgICAgICBjb25maWcsXG4gICAgICAgIHJlZmVyZW5jZXMsXG4gICAgICAgIGR1cmF0aW9uTXM6IGxvZy5kdXJhdGlvbk1zIHx8IDAsXG4gICAgICAgIHNpemU6IGxvZy5zaXplIHx8IGNvbmZpZy5zaXplIHx8IFwiXCIsXG4gICAgICAgIHJlc29sdXRpb246IG5vcm1hbGl6ZVJlc29sdXRpb24obG9nLnJlc29sdXRpb24gfHwgY29uZmlnLnZxdWFsaXR5IHx8IFwiXCIpLFxuICAgICAgICBzZWNvbmRzOiBsb2cuc2Vjb25kcyB8fCBjb25maWcudmlkZW9TZWNvbmRzIHx8IFwiXCIsXG4gICAgICAgIHN0YXR1czogbG9nLnN0YXR1cyB8fCBcInN1Y2Nlc3NcIixcbiAgICAgICAgdGFzazogbG9nLnRhc2ssXG4gICAgICAgIHZpZGVvLFxuICAgICAgICBlcnJvcjogbG9nLmVycm9yLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNlcmlhbGl6ZUxvZyhsb2c6IEdlbmVyYXRpb25Mb2cpOiBHZW5lcmF0aW9uTG9nIHtcbiAgICByZXR1cm4ge1xuICAgICAgICAuLi5sb2csXG4gICAgICAgIHJlZmVyZW5jZXM6IGxvZy5yZWZlcmVuY2VzLm1hcCgoaXRlbSkgPT4gKHsgLi4uaXRlbSwgZGF0YVVybDogaXRlbS5zdG9yYWdlS2V5ID8gXCJcIiA6IGl0ZW0uZGF0YVVybCB9KSksXG4gICAgICAgIHZpZGVvOiBsb2cudmlkZW8/LnN0b3JhZ2VLZXkgPyB7IC4uLmxvZy52aWRlbywgdXJsOiBcIlwiIH0gOiBsb2cudmlkZW8sXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gbW92ZUxpc3RJdGVtPFQ+KGl0ZW1zOiBUW10sIGluZGV4OiBudW1iZXIsIG9mZnNldDogbnVtYmVyKSB7XG4gICAgY29uc3QgdGFyZ2V0SW5kZXggPSBpbmRleCArIG9mZnNldDtcbiAgICBpZiAodGFyZ2V0SW5kZXggPCAwIHx8IHRhcmdldEluZGV4ID49IGl0ZW1zLmxlbmd0aCkgcmV0dXJuIGl0ZW1zO1xuICAgIGNvbnN0IG5leHQgPSBbLi4uaXRlbXNdO1xuICAgIFtuZXh0W2luZGV4XSwgbmV4dFt0YXJnZXRJbmRleF1dID0gW25leHRbdGFyZ2V0SW5kZXhdLCBuZXh0W2luZGV4XV07XG4gICAgcmV0dXJuIG5leHQ7XG59XG5cbmZ1bmN0aW9uIFJlZmVyZW5jZU9yZGVyQnV0dG9ucyh7IGluZGV4LCB0b3RhbCwgb25Nb3ZlIH06IHsgaW5kZXg6IG51bWJlcjsgdG90YWw6IG51bWJlcjsgb25Nb3ZlOiAob2Zmc2V0OiBudW1iZXIpID0+IHZvaWQgfSkge1xuICAgIGlmICh0b3RhbCA8PSAxKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LXgtMSBib3R0b20tMSBmbGV4IGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgPEJ1dHRvbiBzaXplPVwic21hbGxcIiBjbGFzc05hbWU9XCIhaC02ICF3LTYgIW1pbi13LTYgIXJvdW5kZWQtZnVsbCAhYmctd2hpdGUvODUgIXAtMCAhc2hhZG93LXNtXCIgaWNvbj17PEFycm93TGVmdCBjbGFzc05hbWU9XCJzaXplLTNcIiAvPn0gZGlzYWJsZWQ9e2luZGV4IDw9IDB9IG9uQ2xpY2s9eygpID0+IG9uTW92ZSgtMSl9IC8+XG4gICAgICAgICAgICA8QnV0dG9uIHNpemU9XCJzbWFsbFwiIGNsYXNzTmFtZT1cIiFoLTYgIXctNiAhbWluLXctNiAhcm91bmRlZC1mdWxsICFiZy13aGl0ZS84NSAhcC0wICFzaGFkb3ctc21cIiBpY29uPXs8QXJyb3dSaWdodCBjbGFzc05hbWU9XCJzaXplLTNcIiAvPn0gZGlzYWJsZWQ9e2luZGV4ID49IHRvdGFsIC0gMX0gb25DbGljaz17KCkgPT4gb25Nb3ZlKDEpfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVMb2dDb25maWcobG9nOiBQYXJ0aWFsPEdlbmVyYXRpb25Mb2c+KTogR2VuZXJhdGlvbkxvZ0NvbmZpZyB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbW9kZWw6IGxvZy5jb25maWc/Lm1vZGVsIHx8IGxvZy5tb2RlbCB8fCBcIlwiLFxuICAgICAgICB2aWRlb01vZGVsOiBsb2cuY29uZmlnPy52aWRlb01vZGVsIHx8IGxvZy5tb2RlbCB8fCBcIlwiLFxuICAgICAgICBzaXplOiBsb2cuY29uZmlnPy5zaXplIHx8IGxvZy5zaXplIHx8IFwiXCIsXG4gICAgICAgIHZxdWFsaXR5OiBub3JtYWxpemVSZXNvbHV0aW9uKGxvZy5jb25maWc/LnZxdWFsaXR5IHx8IGxvZy5yZXNvbHV0aW9uIHx8IFwiXCIpLFxuICAgICAgICB2aWRlb1NlY29uZHM6IGxvZy5jb25maWc/LnZpZGVvU2Vjb25kcyB8fCBsb2cuc2Vjb25kcyB8fCBcIlwiLFxuICAgICAgICB2aWRlb0dlbmVyYXRlQXVkaW86IGxvZy5jb25maWc/LnZpZGVvR2VuZXJhdGVBdWRpbyB8fCBcInRydWVcIixcbiAgICAgICAgdmlkZW9XYXRlcm1hcms6IGxvZy5jb25maWc/LnZpZGVvV2F0ZXJtYXJrIHx8IFwiZmFsc2VcIixcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBidWlsZExvZyh7IHByb21wdCwgbW9kZWwsIGNvbmZpZywgcmVmZXJlbmNlcywgZHVyYXRpb25Ncywgc3RhdHVzLCB0YXNrLCB2aWRlbywgZXJyb3IgfTogeyBwcm9tcHQ6IHN0cmluZzsgbW9kZWw6IHN0cmluZzsgY29uZmlnOiBBaUNvbmZpZzsgcmVmZXJlbmNlczogUmVmZXJlbmNlSW1hZ2VbXTsgZHVyYXRpb25NczogbnVtYmVyOyBzdGF0dXM6IEdlbmVyYXRpb25Mb2dbXCJzdGF0dXNcIl07IHRhc2s/OiBWaWRlb0dlbmVyYXRpb25UYXNrOyB2aWRlbz86IEdlbmVyYXRlZFZpZGVvOyBlcnJvcj86IHN0cmluZyB9KTogR2VuZXJhdGlvbkxvZyB7XG4gICAgY29uc3QgbG9nQ29uZmlnID0ge1xuICAgICAgICBtb2RlbDogY29uZmlnLm1vZGVsLFxuICAgICAgICB2aWRlb01vZGVsOiBjb25maWcudmlkZW9Nb2RlbCxcbiAgICAgICAgc2l6ZTogY29uZmlnLnNpemUsXG4gICAgICAgIHZxdWFsaXR5OiBub3JtYWxpemVSZXNvbHV0aW9uKGNvbmZpZy52cXVhbGl0eSksXG4gICAgICAgIHZpZGVvU2Vjb25kczogY29uZmlnLnZpZGVvU2Vjb25kcyxcbiAgICAgICAgdmlkZW9HZW5lcmF0ZUF1ZGlvOiBjb25maWcudmlkZW9HZW5lcmF0ZUF1ZGlvLFxuICAgICAgICB2aWRlb1dhdGVybWFyazogY29uZmlnLnZpZGVvV2F0ZXJtYXJrLFxuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6IG5hbm9pZCgpLFxuICAgICAgICBjcmVhdGVkQXQ6IERhdGUubm93KCksXG4gICAgICAgIHRpdGxlOiBwcm9tcHQuc2xpY2UoMCwgMTIpIHx8IGkxOG4udChcIndvcmtiZW5jaC51bnRpdGxlZFwiKSxcbiAgICAgICAgcHJvbXB0LFxuICAgICAgICB0aW1lOiBuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKGkxOG4ucmVzb2x2ZWRMYW5ndWFnZSwgeyBob3VyMTI6IGZhbHNlIH0pLFxuICAgICAgICBtb2RlbCxcbiAgICAgICAgY29uZmlnOiBsb2dDb25maWcsXG4gICAgICAgIHJlZmVyZW5jZXMsXG4gICAgICAgIGR1cmF0aW9uTXMsXG4gICAgICAgIHNpemU6IGxvZ0NvbmZpZy5zaXplLFxuICAgICAgICByZXNvbHV0aW9uOiBsb2dDb25maWcudnF1YWxpdHksXG4gICAgICAgIHNlY29uZHM6IGxvZ0NvbmZpZy52aWRlb1NlY29uZHMsXG4gICAgICAgIHN0YXR1cyxcbiAgICAgICAgdGFzayxcbiAgICAgICAgdmlkZW8sXG4gICAgICAgIGVycm9yLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGJ1aWxkVmlkZW9Db25maWcoY29uZmlnOiBBaUNvbmZpZywgbW9kZWw6IHN0cmluZyk6IEFpQ29uZmlnIHtcbiAgICByZXR1cm4ge1xuICAgICAgICAuLi5jb25maWcsXG4gICAgICAgIG1vZGVsLFxuICAgICAgICB2aWRlb01vZGVsOiBtb2RlbCxcbiAgICAgICAgc2l6ZTogbm9ybWFsaXplVmlkZW9TaXplKGNvbmZpZy5zaXplKSxcbiAgICAgICAgdmlkZW9TZWNvbmRzOiBub3JtYWxpemVWaWRlb1NlY29uZHMoY29uZmlnLnZpZGVvU2Vjb25kcyksXG4gICAgICAgIHZxdWFsaXR5OiBub3JtYWxpemVSZXNvbHV0aW9uKGNvbmZpZy52cXVhbGl0eSksXG4gICAgICAgIHZpZGVvR2VuZXJhdGVBdWRpbzogU3RyaW5nKGJvb2xDb25maWcoY29uZmlnLnZpZGVvR2VuZXJhdGVBdWRpbywgdHJ1ZSkpLFxuICAgICAgICB2aWRlb1dhdGVybWFyazogU3RyaW5nKGJvb2xDb25maWcoY29uZmlnLnZpZGVvV2F0ZXJtYXJrLCBmYWxzZSkpLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVZpZGVvU2Vjb25kcyh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKFN0cmluZyh2YWx1ZSkudHJpbSgpID09PSBcIi0xXCIpIHJldHVybiBcIi0xXCI7XG4gICAgY29uc3Qgc2Vjb25kcyA9IE1hdGguZmxvb3IoTnVtYmVyKHZhbHVlKSB8fCA2KTtcbiAgICByZXR1cm4gU3RyaW5nKE1hdGgubWF4KDEsIE1hdGgubWluKDIwLCBzZWNvbmRzKSkpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVWaWRlb1NpemUodmFsdWU6IHN0cmluZykge1xuICAgIHJldHVybiBub3JtYWxpemVWaWRlb1NpemVWYWx1ZSh2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJlc29sdXRpb24odmFsdWU6IHN0cmluZykge1xuICAgIHJldHVybiBub3JtYWxpemVWaWRlb1Jlc29sdXRpb25WYWx1ZSh2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGRlbGF5KG1zOiBudW1iZXIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbn1cbiJdLCJmaWxlIjoiRTovY29kZXgvbmlhbm5pYW5haS96aHVhbmh1aXl1YW5nb25nL2luZmluaXRlLWNhbnZhcy93ZWIvc3JjL3BhZ2VzL3ZpZGVvL2luZGV4LnRzeCJ9