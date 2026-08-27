import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/canvas/project.tsx");import { Fragment, jsxDEV } from "/node_modules/react/jsx-dev-runtime.js";
var _s = $RefreshSig$(), _s2 = $RefreshSig$();
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "/node_modules/react/index.js";
import { useNavigate, useParams, useSearchParams } from "/node_modules/react-router-dom/dist/index.mjs";
import { saveAs } from "/node_modules/file-saver/dist/FileSaver.min.js";
import { useTranslation } from "/node_modules/react-i18next/dist/es/index.js";
import { requestEdit, requestGeneration, requestImageQuestion } from "/src/services/api/image.ts";
import { requestAudioGeneration, storeGeneratedAudio } from "/src/services/api/audio.ts";
import { requestVideoGeneration, storeGeneratedVideo } from "/src/services/api/video.ts";
import { defaultConfig, useConfigStore, useEffectiveConfig } from "/src/stores/use-config-store.ts";
import { uploadImage } from "/src/services/image-storage.ts";
import { uploadMediaFile } from "/src/services/file-storage.ts";
import { nanoid } from "/node_modules/nanoid/index.browser.js";
import { getDataUrlByteSize, readImageMeta } from "/src/lib/image-utils.ts";
import { canvasThemes } from "/src/lib/canvas-theme.ts";
import { useAssetStore } from "/src/stores/use-asset-store.ts";
import { useThemeStore } from "/src/stores/use-theme-store.ts";
import { cropDataUrl, splitDataUrl, upscaleDataUrl } from "/src/lib/canvas/canvas-image-data.ts";
import { fitNodeSize, nodeSizeFromRatio } from "/src/lib/canvas/canvas-node-size.ts";
import { captureVideoFrame } from "/src/lib/canvas/canvas-video-frame.ts";
import { App, Button, Modal } from "/node_modules/antd/es/index.js";
import { NODE_DEFAULT_SIZE, getNodeSpec } from "/src/constant/canvas.ts";
import { ActiveConnectionPath, ConnectionPath } from "/src/components/canvas/canvas-connections.tsx";
import { CanvasConfigComposer } from "/src/components/canvas/canvas-config-composer.tsx";
import { CanvasConfigNodePanel } from "/src/components/canvas/canvas-config-node-panel.tsx";
import { CanvasNodeContextMenu } from "/src/components/canvas/canvas-context-menu.tsx";
import { CanvasNodeAngleDialog } from "/src/components/canvas/canvas-node-angle-dialog.tsx";
import { CanvasNodeCropDialog } from "/src/components/canvas/canvas-node-crop-dialog.tsx";
import { CanvasNodeMaskEditDialog } from "/src/components/canvas/canvas-node-mask-edit-dialog.tsx";
import { CanvasNodeSplitDialog } from "/src/components/canvas/canvas-node-split-dialog.tsx";
import { CanvasNodeUpscaleDialog } from "/src/components/canvas/canvas-node-upscale-dialog.tsx";
import { buildNodeGenerationContext, buildNodeGenerationInputs, buildNodeResponseMessages, hydrateNodeGenerationContext } from "/src/components/canvas/canvas-node-generation.ts";
import { CanvasNodeHoverToolbar, CanvasNodeInfoModal } from "/src/components/canvas/canvas-node-hover-toolbar.tsx";
import { InfiniteCanvas } from "/src/components/canvas/infinite-canvas.tsx";
import { Minimap } from "/src/components/canvas/canvas-mini-map.tsx";
import { CanvasNode } from "/src/components/canvas/canvas-node.tsx";
import { CanvasNodePromptPanel } from "/src/components/canvas/canvas-node-prompt-panel.tsx";
import { CanvasToolbar } from "/src/components/canvas/canvas-toolbar.tsx";
import { AssetPickerModal } from "/src/components/canvas/asset-picker-modal.tsx";
import { CanvasSidePanel } from "/src/components/canvas/canvas-side-panel.tsx";
import { CanvasZoomControls } from "/src/components/canvas/canvas-zoom-controls.tsx";
import { useAgentStore } from "/src/stores/use-agent-store.ts";
import { useCanvasStore } from "/src/stores/canvas/use-canvas-store.ts";
import { useAgentBridge } from "/src/pages/canvas/hooks/use-agent-bridge.ts";
import { usePluginHost } from "/src/pages/canvas/hooks/use-plugin-host.tsx";
import { buildNodeMentionReferences, getGroupResourceNodes, isCanvasReferenceNode } from "/src/lib/canvas/canvas-resource-references.ts";
import { exportCanvasProjects } from "/src/lib/canvas/canvas-export.ts";
import { applyNodeConfigPatch, audioMetadata, buildAudioGenerationMetadata, buildImageGenerationMetadata, createCanvasNode, imageMetadata, videoMetadata } from "/src/lib/canvas/canvas-node-factory.ts";
import { findContainingGroupId, findGroupDropTarget, getConnectionTargetAnchor, normalizeConnection, snapNodesIntoGroup } from "/src/lib/canvas/canvas-node-geometry.ts";
import {
  audioExtension,
  buildAngleLabel,
  buildAnglePrompt,
  buildGenerationConfig,
  findRetrySourceNode,
  generationReferenceUrls,
  getGenerationCount,
  getInputSummary,
  hydrateAssistantImages,
  hydrateCanvasImages,
  imageExtension,
  isAudioFile,
  isGenerationCanceled,
  resetInterruptedGeneration,
  resolveMetadataReferences,
  sourceNodeReferenceImages
} from "/src/lib/canvas/canvas-generation-helpers.ts";
import { getNodeDefinition, isBuiltinNodeType as isBuiltinType, useNodeRegistryVersion } from "/src/lib/canvas/node-registry.ts";
import { registerBuiltinNodes } from "/src/components/canvas/nodes/builtin-nodes.tsx";
import { CanvasPluginManagerModal } from "/src/components/canvas/canvas-plugin-manager-modal.tsx";
import { CanvasRefreshShell } from "/src/components/canvas/canvas-refresh-shell.tsx";
import { CanvasTopBar } from "/src/components/canvas/canvas-top-bar.tsx";
import { ConnectionCreateMenu, NodeCreateMenu } from "/src/components/canvas/canvas-create-menus.tsx";
import {
  CanvasNodeType
} from "/src/types/canvas.ts";
registerBuiltinNodes();
const VIDEO_NODE_MAX_WIDTH = 420;
const VIDEO_NODE_MAX_HEIGHT = 420;
const EMPTY_REFERENCES = [];
const CONNECTION_HANDLE_HIT_RADIUS = 40;
const CONNECTION_NODE_HIT_PADDING = 32;
const NODE_STATUS_IDLE = "idle";
const NODE_STATUS_LOADING = "loading";
const NODE_STATUS_SUCCESS = "success";
const NODE_STATUS_ERROR = "error";
export default function CanvasPage() {
  _s();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return /* @__PURE__ */ jsxDEV(CanvasRefreshShell, {}, void 0, false, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
    lineNumber: 138,
    columnNumber: 24
  }, this);
  return /* @__PURE__ */ jsxDEV(InfiniteCanvasPage, {}, void 0, false, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
    lineNumber: 140,
    columnNumber: 10
  }, this);
}
_s(CanvasPage, "LrrVfNW3d1raFE0BNzCTILYmIfo=");
_c = CanvasPage;
function InfiniteCanvasPage() {
  _s2();
  const { message, modal } = App.useApp();
  const { t } = useTranslation();
  const nodeRegistryVersion = useNodeRegistryVersion((state) => state.version);
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = params.id || "";
  const localAgentConnected = useAgentStore((state) => state.connected);
  const localAgentActivity = useAgentStore((state) => state.activity);
  const localAgentEnabled = useAgentStore((state) => state.enabled);
  const fragmentBootstrap = useAgentStore((state) => state.fragmentBootstrap);
  const agentPanelOpen = useAgentStore((state) => state.panelOpen);
  const toggleAgentPanel = useAgentStore((state) => state.togglePanel);
  const openAgentPanel = useAgentStore((state) => state.openPanel);
  const containerRef = useRef(null);
  const imageInputRef = useRef(null);
  const uploadTargetRef = useRef(null);
  const clipboardRef = useRef(null);
  const historyRef = useRef({ past: [], future: [] });
  const lastHistoryRef = useRef(null);
  const historyCommitTimerRef = useRef(null);
  const viewportSaveTimerRef = useRef(null);
  const applyingHistoryRef = useRef(false);
  const historyPausedRef = useRef(false);
  const didInitialCenterRef = useRef(false);
  const rafRef = useRef(null);
  const nodeDraggingRef = useRef(false);
  const dragRef = useRef({
    isDraggingNode: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    initialSelectedNodes: []
  });
  const config = useConfigStore((state) => state.config);
  const effectiveConfig = useEffectiveConfig();
  const isAiConfigReady = useConfigStore((state) => state.isAiConfigReady);
  const openConfigDialog = useConfigStore((state) => state.openConfigDialog);
  const addAsset = useAssetStore((state) => state.addAsset);
  const cleanupAssetImages = useAssetStore((state) => state.cleanupImages);
  const hydrated = useCanvasStore((state) => state.hydrated);
  const createProject = useCanvasStore((state) => state.createProject);
  const openProject = useCanvasStore((state) => state.openProject);
  const updateProject = useCanvasStore((state) => state.updateProject);
  const renameProject = useCanvasStore((state) => state.renameProject);
  const deleteProjects = useCanvasStore((state) => state.deleteProjects);
  const currentProject = useCanvasStore((state) => state.projects.find((project) => project.id === projectId));
  const theme = canvasThemes[useThemeStore((state) => state.theme)];
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, k: 1 });
  const [canvasTool, setCanvasTool] = useState("pan");
  const [size, setSize] = useState({ width: 1200, height: 720 });
  const [selectedNodeIds, setSelectedNodeIds] = useState(/* @__PURE__ */ new Set());
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [connectingParams, setConnectingParams] = useState(null);
  const [connectionTargetNodeId, setConnectionTargetNodeId] = useState(null);
  const [pendingConnectionCreate, setPendingConnectionCreate] = useState(null);
  const [mouseWorld, setMouseWorld] = useState({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [nodeCreatePosition, setNodeCreatePosition] = useState(null);
  const [runningNodeId, setRunningNodeId] = useState(null);
  const [isMiniMapOpen, setIsMiniMapOpen] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState("lines");
  const [showImageInfo, setShowImageInfo] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [toolbarNodeId, setToolbarNodeId] = useState(null);
  const [nodeImageSettingsOpen, setNodeImageSettingsOpen] = useState(false);
  const [dialogNodeId, setDialogNodeId] = useState(null);
  const [infoNodeId, setInfoNodeId] = useState(null);
  const [pluginManagerOpen, setPluginManagerOpen] = useState(false);
  const [cropNodeId, setCropNodeId] = useState(null);
  const [maskEditNodeId, setMaskEditNodeId] = useState(null);
  const [splitNodeId, setSplitNodeId] = useState(null);
  const [upscaleNodeId, setUpscaleNodeId] = useState(null);
  const [superResolveNodeId, setSuperResolveNodeId] = useState(null);
  const [angleNodeId, setAngleNodeId] = useState(null);
  const [previewNodeId, setPreviewNodeId] = useState(null);
  const [previewImageId, setPreviewImageId] = useState(null);
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [expandedBatchNodeIds, setExpandedBatchNodeIds] = useState(/* @__PURE__ */ new Set());
  const [isNodeDragging, setIsNodeDragging] = useState(false);
  const [isNodeResizing, setIsNodeResizing] = useState(false);
  const [dropTargetGroupId, setDropTargetGroupId] = useState(null);
  const [referencePickerNodeId, setReferencePickerNodeId] = useState(null);
  const nodesRef = useRef(nodes);
  const connectionsRef = useRef(connections);
  const selectedNodeIdsRef = useRef(selectedNodeIds);
  const viewportRef = useRef(viewport);
  const focusAnimRef = useRef(null);
  const generateNodeRef = useRef(null);
  const connectingParamsRef = useRef(connectingParams);
  const connectionTargetNodeIdRef = useRef(connectionTargetNodeId);
  const selectionBoxRef = useRef(selectionBox);
  const pendingConnectionCreateRef = useRef(pendingConnectionCreate);
  const generationRequestsRef = useRef(/* @__PURE__ */ new Map());
  const createHistoryEntry = useCallback(
    () => ({
      nodes: nodesRef.current,
      connections: connectionsRef.current,
      chatSessions,
      activeChatId,
      backgroundMode,
      showImageInfo
    }),
    [activeChatId, backgroundMode, chatSessions, showImageInfo]
  );
  const cleanupCanvasFiles = useCallback(
    (extra) => {
      cleanupAssetImages({ extra, history: historyRef.current, lastHistory: lastHistoryRef.current });
    },
    [cleanupAssetImages]
  );
  const startGenerationRequest = useCallback((targetNodeId, originNodeId, runningId = originNodeId, controller = new AbortController()) => {
    const previous = generationRequestsRef.current.get(targetNodeId);
    if (previous?.controller !== controller) previous?.controller.abort();
    generationRequestsRef.current.set(targetNodeId, { targetNodeId, originNodeId, runningNodeId: runningId, controller });
    return controller;
  }, []);
  const finishGenerationRequest = useCallback((targetNodeId, controller) => {
    const request = generationRequestsRef.current.get(targetNodeId);
    if (request?.controller === controller) generationRequestsRef.current.delete(targetNodeId);
  }, []);
  const stopGenerationByRunningId = useCallback((runningId) => {
    const affectedNodeIds = /* @__PURE__ */ new Set();
    generationRequestsRef.current.forEach((request) => {
      if (request.runningNodeId !== runningId) return;
      request.controller.abort();
      generationRequestsRef.current.delete(request.targetNodeId);
      affectedNodeIds.add(request.targetNodeId);
      affectedNodeIds.add(request.originNodeId);
    });
    setRunningNodeId((current) => current === runningId ? null : current);
    if (!affectedNodeIds.size) return;
    setNodes(
      (prev) => prev.map(
        (node) => affectedNodeIds.has(node.id) && node.metadata?.status === NODE_STATUS_LOADING ? {
          ...node,
          metadata: {
            ...node.metadata,
            status: NODE_STATUS_IDLE,
            errorDetails: void 0,
            images: node.metadata.images?.map((image) => image.status === NODE_STATUS_LOADING ? { ...image, status: NODE_STATUS_ERROR, errorDetails: t("common.requestCanceled") } : image),
            texts: node.metadata.texts?.map((text) => text.status === NODE_STATUS_LOADING ? { ...text, status: NODE_STATUS_ERROR, errorDetails: t("common.requestCanceled") } : text)
          }
        } : node
      )
    );
  }, [t]);
  const confirmStopGeneration = useCallback(
    (nodeId) => {
      modal.confirm({
        title: t("canvas.projectPage.stopTitle"),
        content: t("canvas.projectPage.stopDescription"),
        okText: t("canvas.projectPage.stop"),
        cancelText: t("canvas.projectPage.continue"),
        okButtonProps: { danger: true },
        onOk: () => stopGenerationByRunningId(nodeId)
      });
    },
    [modal, stopGenerationByRunningId, t]
  );
  useEffect(() => {
    if (!hydrated) return;
    setProjectLoaded(false);
    const project = openProject(projectId);
    if (!project) {
      navigate("/canvas", { replace: true });
      return;
    }
    const restore = async () => {
      const restoredNodes = await hydrateCanvasImages(resetInterruptedGeneration(project.nodes));
      const restoredSessions = await hydrateAssistantImages(project.chatSessions || []);
      setNodes(restoredNodes);
      setConnections(project.connections);
      setChatSessions(restoredSessions);
      setActiveChatId(project.activeChatId || null);
      setBackgroundMode(project.backgroundMode);
      setShowImageInfo(project.showImageInfo || false);
      setViewport(project.viewport);
      historyRef.current = { past: [], future: [] };
      if (historyCommitTimerRef.current) {
        clearTimeout(historyCommitTimerRef.current);
        historyCommitTimerRef.current = null;
      }
      lastHistoryRef.current = {
        nodes: restoredNodes,
        connections: project.connections,
        chatSessions: restoredSessions,
        activeChatId: project.activeChatId || null,
        backgroundMode: project.backgroundMode,
        showImageInfo: project.showImageInfo || false
      };
      setHistoryState({ canUndo: false, canRedo: false });
      setProjectLoaded(true);
    };
    void restore();
  }, [hydrated, navigate, openProject, projectId]);
  useEffect(() => {
    if (!projectLoaded || !["new", "recent", "choose"].includes(searchParams.get("mode") || "")) return;
    if (!searchParams.has("agentUrl") && !localAgentEnabled && !fragmentBootstrap) openAgentPanel();
  }, [fragmentBootstrap, localAgentEnabled, openAgentPanel, projectLoaded, searchParams]);
  useEffect(() => {
    if (!projectLoaded || applyingHistoryRef.current || historyPausedRef.current) return;
    const next = createHistoryEntry();
    const previous = lastHistoryRef.current;
    if (previous?.nodes === next.nodes && previous.connections === next.connections && previous.chatSessions === next.chatSessions && previous.activeChatId === next.activeChatId && previous.backgroundMode === next.backgroundMode && previous.showImageInfo === next.showImageInfo)
      return;
    if (historyCommitTimerRef.current) clearTimeout(historyCommitTimerRef.current);
    historyCommitTimerRef.current = setTimeout(() => {
      const current = createHistoryEntry();
      const last = lastHistoryRef.current;
      if (!last) return;
      historyRef.current.past = [...historyRef.current.past.slice(-49), last];
      historyRef.current.future = [];
      setHistoryState({ canUndo: true, canRedo: false });
      lastHistoryRef.current = current;
      historyCommitTimerRef.current = null;
    }, 180);
    return () => {
      if (historyCommitTimerRef.current) {
        clearTimeout(historyCommitTimerRef.current);
        historyCommitTimerRef.current = null;
      }
    };
  }, [activeChatId, backgroundMode, chatSessions, connections, createHistoryEntry, nodes, projectLoaded, showImageInfo]);
  useEffect(() => {
    if (!projectLoaded || historyPausedRef.current) return;
    updateProject(projectId, { nodes, connections, chatSessions, activeChatId, backgroundMode, showImageInfo });
  }, [activeChatId, backgroundMode, chatSessions, connections, nodes, projectId, projectLoaded, showImageInfo, updateProject]);
  useEffect(() => {
    if (!dialogNodeId) setNodeImageSettingsOpen(false);
  }, [dialogNodeId]);
  useEffect(() => {
    if (!projectLoaded) return;
    if (viewportSaveTimerRef.current) clearTimeout(viewportSaveTimerRef.current);
    viewportSaveTimerRef.current = setTimeout(() => {
      updateProject(projectId, { viewport: viewportRef.current });
      viewportSaveTimerRef.current = null;
    }, 500);
    return () => {
      if (viewportSaveTimerRef.current) clearTimeout(viewportSaveTimerRef.current);
    };
  }, [projectId, projectLoaded, updateProject, viewport]);
  useLayoutEffect(() => {
    nodesRef.current = nodes;
    connectionsRef.current = connections;
    selectedNodeIdsRef.current = selectedNodeIds;
    viewportRef.current = viewport;
    connectingParamsRef.current = connectingParams;
    connectionTargetNodeIdRef.current = connectionTargetNodeId;
    pendingConnectionCreateRef.current = pendingConnectionCreate;
  }, [nodes, connections, selectedNodeIds, viewport, connectingParams, connectionTargetNodeId, pendingConnectionCreate]);
  useLayoutEffect(() => {
    selectionBoxRef.current = selectionBox;
  }, [selectionBox]);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
      if (!didInitialCenterRef.current) {
        didInitialCenterRef.current = true;
        setViewport({ x: rect.width / 2, y: rect.height / 2, k: 1 });
      }
    };
    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);
  const screenToCanvas = useCallback((clientX, clientY) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const currentViewport = viewportRef.current;
    const localX = clientX - (rect?.left || 0);
    const localY = clientY - (rect?.top || 0);
    return {
      x: (localX - currentViewport.x) / currentViewport.k,
      y: (localY - currentViewport.y) / currentViewport.k
    };
  }, []);
  const getCanvasCenter = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    return screenToCanvas((rect?.left || 0) + (rect?.width || size.width) / 2, (rect?.top || 0) + (rect?.height || size.height) / 2);
  }, [screenToCanvas, size.height, size.width]);
  const setConnecting = useCallback((next) => {
    connectingParamsRef.current = next;
    setConnectingParams(next);
    if (!next) {
      connectionTargetNodeIdRef.current = null;
      setConnectionTargetNodeId(null);
    }
  }, []);
  const keepNodeToolbar = useCallback(
    (nodeId) => {
      if (nodeDraggingRef.current || nodeImageSettingsOpen || !selectedNodeIdsRef.current.has(nodeId)) return;
      setToolbarNodeId(nodeId);
    },
    [nodeImageSettingsOpen]
  );
  const hideNodeToolbar = useCallback(() => {
  }, []);
  const connectNodes = useCallback(
    (current, targetNodeId) => {
      if (current.nodeId === targetNodeId) return;
      const connection = normalizeConnection(current.nodeId, targetNodeId, nodesRef.current, current.handleType);
      if (!connection) {
        message.warning(t("canvas.projectPage.configConnection"));
        return;
      }
      const { fromNodeId, toNodeId } = connection;
      const exists = connectionsRef.current.some((conn) => conn.fromNodeId === fromNodeId && conn.toNodeId === toNodeId);
      if (!exists) {
        setConnections((prev) => [...prev, { id: `conn-${Date.now()}`, fromNodeId, toNodeId }]);
      }
      setContextMenu(null);
    },
    [message, t]
  );
  const createConnectedNode = useCallback(
    (type, pending) => {
      const metadata = type === CanvasNodeType.Config ? { model: effectiveConfig.imageModel || effectiveConfig.model, size: effectiveConfig.size, count: getGenerationCount(effectiveConfig.canvasImageCount || effectiveConfig.count) } : void 0;
      const newNode = createCanvasNode(type, pending.position, metadata);
      const connection = normalizeConnection(pending.connection.nodeId, newNode.id, [...nodesRef.current, newNode], pending.connection.handleType);
      if (!connection) {
        message.warning(t("canvas.projectPage.configConnection"));
        return;
      }
      setNodes((prev) => [...prev, newNode]);
      setConnections((prev) => [...prev, { id: nanoid(), ...connection }]);
      setSelectedNodeIds(/* @__PURE__ */ new Set([newNode.id]));
      setSelectedConnectionId(null);
      if (type !== CanvasNodeType.Text && type !== CanvasNodeType.Audio) setDialogNodeId(newNode.id);
      setPendingConnectionCreate(null);
      setConnecting(null);
    },
    [effectiveConfig.canvasImageCount, effectiveConfig.count, effectiveConfig.imageModel, effectiveConfig.model, effectiveConfig.size, message, setConnecting, t]
  );
  const cancelPendingConnectionCreate = useCallback(() => {
    setPendingConnectionCreate(null);
    setConnecting(null);
  }, [setConnecting]);
  const getConnectionDropTarget = useCallback(
    (clientX, clientY, current) => {
      const world = screenToCanvas(clientX, clientY);
      const scale = Math.max(viewportRef.current.k, 0.05);
      const padding = CONNECTION_NODE_HIT_PADDING / scale;
      const handleRadius = CONNECTION_HANDLE_HIT_RADIUS / scale;
      let isNearNode = false;
      let bestNodeId = null;
      let bestPriority = Number.POSITIVE_INFINITY;
      [...nodesRef.current].reverse().forEach((node) => {
        const anchor = getConnectionTargetAnchor(node, current);
        const dx = world.x - anchor.x;
        const dy = world.y - anchor.y;
        const hitsHandle = dx * dx + dy * dy <= handleRadius * handleRadius;
        const hitsInside = world.x >= node.position.x && world.x <= node.position.x + node.width && world.y >= node.position.y && world.y <= node.position.y + node.height;
        const hitsExpanded = world.x >= node.position.x - padding && world.x <= node.position.x + node.width + padding && world.y >= node.position.y - padding && world.y <= node.position.y + node.height + padding;
        if (!hitsHandle && !hitsInside && !hitsExpanded) return;
        isNearNode = true;
        if (node.id === current.nodeId || !normalizeConnection(current.nodeId, node.id, nodesRef.current, current.handleType)) return;
        const priority = hitsInside ? 0 : hitsHandle ? 1 : 2;
        if (priority < bestPriority) {
          bestNodeId = node.id;
          bestPriority = priority;
        }
      });
      return { nodeId: bestNodeId, isNearNode };
    },
    [screenToCanvas]
  );
  const visibleNodes = useMemo(() => {
    const padding = 280;
    const rect = containerRef.current?.getBoundingClientRect();
    const width = rect?.width || size.width;
    const height = rect?.height || size.height;
    const viewLeft = -viewport.x / viewport.k - padding;
    const viewTop = -viewport.y / viewport.k - padding;
    const viewRight = viewLeft + width / viewport.k + padding * 2;
    const viewBottom = viewTop + height / viewport.k + padding * 2;
    return nodes.filter((node) => node.position.x + node.width > viewLeft && node.position.x < viewRight && node.position.y + node.height > viewTop && node.position.y < viewBottom);
  }, [nodes, size.height, size.width, viewport.k, viewport.x, viewport.y]);
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const singleSelectedNodeId = selectedNodeIds.size === 1 ? Array.from(selectedNodeIds)[0] : null;
  const toolbarNode = (toolbarNodeId ? nodeById.get(toolbarNodeId) || null : null) || (singleSelectedNodeId ? nodeById.get(singleSelectedNodeId) || null : null);
  const infoNode = infoNodeId ? nodeById.get(infoNodeId) || null : null;
  const cropNode = cropNodeId ? nodeById.get(cropNodeId) || null : null;
  const maskEditNode = maskEditNodeId ? nodeById.get(maskEditNodeId) || null : null;
  const splitNode = splitNodeId ? nodeById.get(splitNodeId) || null : null;
  const upscaleNode = upscaleNodeId ? nodeById.get(upscaleNodeId) || null : null;
  const superResolveNode = superResolveNodeId ? nodeById.get(superResolveNodeId) || null : null;
  const angleNode = angleNodeId ? nodeById.get(angleNodeId) || null : null;
  const contextMenuNode = contextMenu?.type === "node" ? nodeById.get(contextMenu.nodeId) || null : null;
  const previewNode = previewNodeId ? nodeById.get(previewNodeId) || null : null;
  const previewContent = previewImageId ? previewNode?.metadata?.images?.find((image) => image.id === previewImageId)?.content : previewNode?.metadata?.content;
  const hasMultipleSelectedNodes = selectedNodeIds.size > 1;
  const activeNodeId = hasMultipleSelectedNodes ? null : hoveredNodeId || (selectedNodeIds.size === 1 ? Array.from(selectedNodeIds)[0] : null);
  const groupChildCountById = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    nodes.forEach((node) => {
      const groupId = node.metadata?.groupId;
      if (groupId) map.set(groupId, (map.get(groupId) || 0) + 1);
    });
    return map;
  }, [nodes]);
  const relatedHighlight = useMemo(() => {
    const nodeIds = /* @__PURE__ */ new Set();
    const connectionIds = /* @__PURE__ */ new Set();
    if (!activeNodeId) return { nodeIds, connectionIds };
    const addNode = (nodeId) => {
      nodeIds.add(nodeId);
      if (nodeById.get(nodeId)?.type === CanvasNodeType.Group) nodes.forEach((node) => node.metadata?.groupId === nodeId && nodeIds.add(node.id));
    };
    addNode(activeNodeId);
    connections.forEach((connection) => {
      if (connection.fromNodeId !== activeNodeId && connection.toNodeId !== activeNodeId) return;
      connectionIds.add(connection.id);
      addNode(connection.fromNodeId);
      addNode(connection.toNodeId);
    });
    return { nodeIds, connectionIds };
  }, [activeNodeId, connections, nodeById, nodes]);
  const configInputsById = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    nodes.forEach((node) => {
      if (node.type !== CanvasNodeType.Config) return;
      map.set(node.id, buildNodeGenerationInputs(node.id, nodes, connections));
    });
    return map;
  }, [connections, nodes]);
  const mentionReferencesByNodeId = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    nodes.forEach((node) => map.set(node.id, buildNodeMentionReferences(node, nodes, connections)));
    return map;
  }, [connections, nodes]);
  const connectedNodesByNodeId = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    connections.forEach((connection) => {
      const source = nodeById.get(connection.fromNodeId);
      if (!source) return;
      const connected = map.get(connection.toNodeId);
      if (connected) connected.push(source);
      else
        map.set(connection.toNodeId, [source]);
    });
    return map;
  }, [connections, nodeById]);
  const referenceConnectedNodeIds = useMemo(() => new Set([referencePickerNodeId, ...referencePickerNodeId ? connectedNodesByNodeId.get(referencePickerNodeId)?.flatMap((node) => node.type === CanvasNodeType.Group ? [node.id, ...getGroupResourceNodes(node.id, nodes).map((child) => child.id)] : [node.id]) || [] : []].filter((id) => Boolean(id))), [connectedNodesByNodeId, nodes, referencePickerNodeId]);
  const { applyAgentOps } = useAgentBridge({
    projectId,
    title: currentProject?.title,
    nodes,
    connections,
    selectedNodeIds,
    viewport,
    nodesRef,
    connectionsRef,
    selectedNodeIdsRef,
    viewportRef,
    generateNodeRef,
    setNodes,
    setConnections,
    setSelectedNodeIds,
    setSelectedConnectionId,
    setViewport,
    setContextMenu
  });
  const { pluginHost, renderPluginPanel, buildNodeToolbarItems } = usePluginHost({
    effectiveConfig,
    isAiConfigReady,
    openConfigDialog,
    theme,
    nodesRef,
    connectionsRef,
    viewportRef,
    setNodes,
    setDialogNodeId,
    applyAgentOps
  });
  const createNode = useCallback(
    (type, position) => {
      const targetPosition = position || getCanvasCenter();
      const configMetadata = type === CanvasNodeType.Config ? {
        model: effectiveConfig.imageModel || effectiveConfig.model,
        size: effectiveConfig.size,
        count: getGenerationCount(effectiveConfig.canvasImageCount || effectiveConfig.count)
      } : void 0;
      const newNode = createCanvasNode(type, targetPosition, configMetadata);
      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeIds(/* @__PURE__ */ new Set([newNode.id]));
      setSelectedConnectionId(null);
      const definition = getNodeDefinition(type);
      const wantsPanel = definition?.hidePanel ? false : definition?.Panel ? Boolean(definition.autoOpenPanel) : definition?.useBuiltinPanel ? true : isBuiltinType(type) && type !== CanvasNodeType.Text && type !== CanvasNodeType.Audio && type !== CanvasNodeType.Group;
      if (wantsPanel) setDialogNodeId(newNode.id);
    },
    [effectiveConfig.canvasImageCount, effectiveConfig.count, effectiveConfig.imageModel, effectiveConfig.model, effectiveConfig.size, getCanvasCenter]
  );
  const deleteNodes = useCallback(
    (ids) => {
      if (!ids.size) return;
      const allIds = new Set(ids);
      setNodes((prev) => {
        const next = prev.filter((node) => !allIds.has(node.id));
        return next.map((node) => {
          const groupId = node.metadata?.groupId;
          if (groupId && allIds.has(groupId)) return { ...node, metadata: { ...node.metadata, groupId: void 0 } };
          return node;
        });
      });
      setConnections((prev) => prev.filter((conn) => !allIds.has(conn.fromNodeId) && !allIds.has(conn.toNodeId)));
      setSelectedNodeIds(/* @__PURE__ */ new Set());
      setSelectedConnectionId(null);
      setHoveredNodeId((current) => current && allIds.has(current) ? null : current);
      setToolbarNodeId((current) => current && allIds.has(current) ? null : current);
      setDialogNodeId((current) => current && allIds.has(current) ? null : current);
      setInfoNodeId((current) => current && allIds.has(current) ? null : current);
      setCropNodeId((current) => current && allIds.has(current) ? null : current);
      setMaskEditNodeId((current) => current && allIds.has(current) ? null : current);
      setAngleNodeId((current) => current && allIds.has(current) ? null : current);
      setPreviewNodeId((current) => current && allIds.has(current) ? null : current);
      setRunningNodeId((current) => current && allIds.has(current) ? null : current);
      setReferencePickerNodeId((current) => current && allIds.has(current) ? null : current);
      setExpandedBatchNodeIds((current) => new Set([...current].filter((nodeId) => !allIds.has(nodeId))));
      setContextMenu((current) => current?.type === "node" && allIds.has(current.nodeId) ? null : current);
      cleanupCanvasFiles({ projectId, nodes: nodesRef.current.filter((node) => !allIds.has(node.id)), chatSessions });
    },
    [chatSessions, cleanupCanvasFiles, projectId]
  );
  const deleteConnection = useCallback((connectionId) => {
    setConnections((prev) => prev.filter((conn) => conn.id !== connectionId));
    setSelectedConnectionId((current) => current === connectionId ? null : current);
    setContextMenu((current) => current?.type === "connection" && current.connectionId === connectionId ? null : current);
  }, []);
  const disconnectNodeReference = useCallback((fromNodeId, toNodeId) => {
    setConnections((prev) => prev.filter((connection) => connection.fromNodeId !== fromNodeId || connection.toNodeId !== toNodeId));
  }, []);
  const startNodeReferenceSelection = useCallback((nodeId) => {
    setReferencePickerNodeId(nodeId);
    setSelectedNodeIds(/* @__PURE__ */ new Set([nodeId]));
    setSelectedConnectionId(null);
    setDialogNodeId(null);
  }, []);
  const exitNodeReferenceSelection = useCallback(() => {
    if (!referencePickerNodeId) return;
    setSelectedNodeIds(/* @__PURE__ */ new Set([referencePickerNodeId]));
    setDialogNodeId(referencePickerNodeId);
    setReferencePickerNodeId(null);
  }, [referencePickerNodeId]);
  const selectNodeReference = useCallback((fromNodeId) => {
    if (!referencePickerNodeId || referenceConnectedNodeIds.has(fromNodeId)) return;
    const source = nodesRef.current.find((node) => node.id === fromNodeId);
    if (!source || !isCanvasReferenceNode(source, nodesRef.current)) return;
    setConnections((prev) => [...prev, { id: nanoid(), fromNodeId, toNodeId: referencePickerNodeId }]);
  }, [referenceConnectedNodeIds, referencePickerNodeId]);
  useEffect(() => {
    if (!referencePickerNodeId) return;
    const exit = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      exitNodeReferenceSelection();
    };
    window.addEventListener("keydown", exit, true);
    return () => window.removeEventListener("keydown", exit, true);
  }, [exitNodeReferenceSelection, referencePickerNodeId]);
  const deselectCanvas = useCallback(() => {
    cancelPendingConnectionCreate();
    setSelectedNodeIds(/* @__PURE__ */ new Set());
    setSelectedConnectionId(null);
    setContextMenu(null);
    setSelectionBox(null);
    setHoveredNodeId(null);
    setToolbarNodeId(null);
    setDialogNodeId(null);
  }, [cancelPendingConnectionCreate]);
  const clearCanvas = useCallback(() => {
    setNodes([]);
    setConnections([]);
    setInfoNodeId(null);
    setCropNodeId(null);
    setMaskEditNodeId(null);
    setAngleNodeId(null);
    setPreviewNodeId(null);
    setRunningNodeId(null);
    deselectCanvas();
    setClearConfirmOpen(false);
    cleanupCanvasFiles({ projectId, nodes: [], chatSessions: [] });
  }, [cleanupCanvasFiles, deselectCanvas, projectId]);
  const duplicateNode = useCallback((nodeId) => {
    const source = nodesRef.current.find((node) => node.id === nodeId);
    if (!source) return;
    const id = `${source.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const next = {
      ...source,
      id,
      title: `${source.title} Copy`,
      position: { x: source.position.x + 36, y: source.position.y + 36 }
    };
    setNodes((prev) => [...prev, next]);
    setSelectedNodeIds(/* @__PURE__ */ new Set([id]));
    setSelectedConnectionId(null);
    if (next.type !== CanvasNodeType.Group) setDialogNodeId(id);
  }, []);
  const copySelectedNodes = useCallback(() => {
    const selectedIds = selectedNodeIdsRef.current;
    if (!selectedIds.size) return;
    const copiedNodes = nodesRef.current.filter((node) => selectedIds.has(node.id)).map((node) => ({
      ...node,
      position: { ...node.position },
      metadata: node.metadata ? { ...node.metadata } : void 0
    }));
    if (!copiedNodes.length) return;
    clipboardRef.current = {
      nodes: copiedNodes,
      connections: connectionsRef.current.filter((connection) => selectedIds.has(connection.fromNodeId) && selectedIds.has(connection.toNodeId)).map((connection) => ({ ...connection }))
    };
  }, []);
  const pasteCopiedNodes = useCallback(() => {
    const clipboard = clipboardRef.current;
    if (!clipboard?.nodes.length) return false;
    const center = getCanvasCenter();
    const bounds = clipboard.nodes.reduce(
      (acc, node) => ({
        left: Math.min(acc.left, node.position.x),
        top: Math.min(acc.top, node.position.y),
        right: Math.max(acc.right, node.position.x + node.width),
        bottom: Math.max(acc.bottom, node.position.y + node.height)
      }),
      { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
    );
    const dx = center.x - (bounds.left + bounds.right) / 2;
    const dy = center.y - (bounds.top + bounds.bottom) / 2;
    const idMap = /* @__PURE__ */ new Map();
    const nextNodes = clipboard.nodes.map((node, index) => {
      const id = `${node.type}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;
      idMap.set(node.id, id);
      return {
        ...node,
        id,
        title: node.title.endsWith(" Copy") ? node.title : `${node.title} Copy`,
        position: {
          x: node.position.x + dx,
          y: node.position.y + dy
        },
        metadata: node.metadata ? { ...node.metadata } : void 0
      };
    });
    const pastedNodes = nextNodes.map((node) => {
      const groupId = node.metadata?.groupId;
      if (!groupId) return node;
      return { ...node, metadata: { ...node.metadata, groupId: idMap.get(groupId) } };
    });
    const nextConnections = clipboard.connections.flatMap((connection, index) => {
      const fromNodeId = idMap.get(connection.fromNodeId);
      const toNodeId = idMap.get(connection.toNodeId);
      if (!fromNodeId || !toNodeId) return [];
      return [
        {
          ...connection,
          id: `conn-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
          fromNodeId,
          toNodeId
        }
      ];
    });
    setNodes((prev) => [...prev, ...pastedNodes]);
    setConnections((prev) => [...prev, ...nextConnections]);
    setSelectedNodeIds(new Set(pastedNodes.map((node) => node.id)));
    setSelectedConnectionId(null);
    setContextMenu(null);
    setDialogNodeId(pastedNodes[0]?.type === CanvasNodeType.Group ? null : pastedNodes[0]?.id || null);
    return true;
  }, [getCanvasCenter]);
  const resetViewport = useCallback(() => {
    setViewport({ x: size.width / 2, y: size.height / 2, k: 1 });
    setContextMenu(null);
  }, [size.height, size.width]);
  const focusNode = useCallback(
    (nodeId) => {
      const node = nodesRef.current.find((item) => item.id === nodeId);
      if (!node) return;
      const worldX = node.position.x + node.width / 2;
      const worldY = node.position.y + node.height / 2;
      const k = Math.min(Math.max(Math.min(size.width * 0.6 / node.width, size.height * 0.6 / node.height), 0.05), 1);
      const target = { x: size.width / 2 - worldX * k, y: size.height / 2 - worldY * k, k };
      setSelectedNodeIds(/* @__PURE__ */ new Set([nodeId]));
      setSelectedConnectionId(null);
      setContextMenu(null);
      if (focusAnimRef.current) cancelAnimationFrame(focusAnimRef.current);
      const start = { ...viewportRef.current };
      const duration = 450;
      const easeOutCubic = (t2) => 1 - Math.pow(1 - t2, 3);
      let startTime = null;
      const step = (now) => {
        if (startTime === null) startTime = now;
        const progress = Math.min((now - startTime) / duration, 1);
        const t2 = easeOutCubic(progress);
        setViewport({ x: start.x + (target.x - start.x) * t2, y: start.y + (target.y - start.y) * t2, k: start.k + (target.k - start.k) * t2 });
        focusAnimRef.current = progress < 1 ? requestAnimationFrame(step) : null;
      };
      focusAnimRef.current = requestAnimationFrame(step);
    },
    [size.height, size.width]
  );
  useEffect(() => () => void (focusAnimRef.current && cancelAnimationFrame(focusAnimRef.current)), []);
  const setZoomScale = useCallback(
    (scale) => {
      const nextScale = Math.min(Math.max(scale, 0.05), 5);
      setViewport((prev) => ({
        x: size.width / 2 - (size.width / 2 - prev.x) / prev.k * nextScale,
        y: size.height / 2 - (size.height / 2 - prev.y) / prev.k * nextScale,
        k: nextScale
      }));
      setContextMenu(null);
    },
    [size.height, size.width]
  );
  const applyHistory = useCallback((entry) => {
    if (historyCommitTimerRef.current) {
      clearTimeout(historyCommitTimerRef.current);
      historyCommitTimerRef.current = null;
    }
    applyingHistoryRef.current = true;
    setNodes(entry.nodes);
    setConnections(entry.connections);
    setChatSessions(entry.chatSessions);
    setActiveChatId(entry.activeChatId);
    setBackgroundMode(entry.backgroundMode);
    setShowImageInfo(entry.showImageInfo);
    setSelectedNodeIds(/* @__PURE__ */ new Set());
    setSelectedConnectionId(null);
    setContextMenu(null);
    setTimeout(() => {
      lastHistoryRef.current = entry;
      applyingHistoryRef.current = false;
      setHistoryState({ canUndo: historyRef.current.past.length > 0, canRedo: historyRef.current.future.length > 0 });
    });
  }, []);
  const undoCanvas = useCallback(() => {
    const previous = historyRef.current.past.pop();
    const current = lastHistoryRef.current;
    if (!previous || !current) return;
    historyRef.current.future.push(current);
    applyHistory(previous);
  }, [applyHistory]);
  const redoCanvas = useCallback(() => {
    const next = historyRef.current.future.pop();
    const current = lastHistoryRef.current;
    if (!next || !current) return;
    historyRef.current.past.push(current);
    applyHistory(next);
  }, [applyHistory]);
  const createAndOpenProject = useCallback(() => {
    const id = createProject(t("canvas.defaultTitle", { count: useCanvasStore.getState().projects.length + 1 }));
    navigate(`/canvas/${id}`);
  }, [createProject, navigate, t]);
  const deleteCurrentProject = useCallback(() => {
    deleteProjects([projectId]);
    cleanupAssetImages();
    navigate("/canvas");
  }, [cleanupAssetImages, deleteProjects, navigate, projectId]);
  const exportCurrentProject = useCallback(async () => {
    const project = useCanvasStore.getState().projects.find((item) => item.id === projectId);
    if (!project) return message.error(t("canvas.projectPage.notFound"));
    const hide = message.loading(t("canvas.projectPage.exporting"), 0);
    try {
      await exportCanvasProjects([project], project.title || t("canvas.title"));
      message.success(t("canvas.projectPage.exported"));
    } catch (error) {
      console.error(error);
      message.error(t("canvas.sidePanel.exportFailed"));
    } finally {
      hide();
    }
  }, [message, projectId, t]);
  const handleCanvasMouseDown = useCallback(
    (event) => {
      setContextMenu(null);
      setNodeCreatePosition(null);
      setHoveredNodeId(null);
      setToolbarNodeId(null);
      setDialogNodeId(null);
      if (pendingConnectionCreateRef.current) cancelPendingConnectionCreate();
      if (event.button !== 0) return;
      const world = screenToCanvas(event.clientX, event.clientY);
      const nextSelectionBox = {
        startWorldX: world.x,
        startWorldY: world.y,
        currentWorldX: world.x,
        currentWorldY: world.y,
        additive: event.shiftKey,
        initialSelectedNodeIds: event.shiftKey ? Array.from(selectedNodeIdsRef.current) : []
      };
      selectionBoxRef.current = nextSelectionBox;
      setSelectionBox(nextSelectionBox);
      if (!event.shiftKey) {
        setSelectedNodeIds(/* @__PURE__ */ new Set());
      }
      setSelectedConnectionId(null);
    },
    [cancelPendingConnectionCreate, screenToCanvas]
  );
  const selectNodeByEvent = useCallback((event, nodeId) => {
    const nextSelected = new Set(selectedNodeIdsRef.current);
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      if (nextSelected.has(nodeId)) nextSelected.delete(nodeId);
      else
        nextSelected.add(nodeId);
    } else if (!nextSelected.has(nodeId)) {
      nextSelected.clear();
      nextSelected.add(nodeId);
    }
    setSelectedNodeIds(nextSelected);
    const soloId = nextSelected.size === 1 && nextSelected.has(nodeId) ? nodeId : null;
    setToolbarNodeId(soloId);
    return { nextSelected, soloId };
  }, []);
  const pendingSelectionRef = useRef(null);
  const handleNodeSelectCapture = useCallback(
    (event, nodeId) => {
      if (event.button !== 0) return;
      setContextMenu(null);
      setHoveredNodeId(null);
      setSelectedConnectionId(null);
      const { nextSelected } = selectNodeByEvent(event, nodeId);
      pendingSelectionRef.current = nextSelected;
    },
    [selectNodeByEvent]
  );
  const handleNodeMouseDown = useCallback((event, nodeId) => {
    event.stopPropagation();
    const currentNodes = nodesRef.current;
    const nextSelected = pendingSelectionRef.current ?? selectNodeByEvent(event, nodeId).nextSelected;
    pendingSelectionRef.current = null;
    const dragIds = new Set(nextSelected);
    currentNodes.forEach((node) => {
      if (!nextSelected.has(node.id)) return;
      if (node.type === CanvasNodeType.Group) {
        currentNodes.forEach((child) => {
          if (child.metadata?.groupId === node.id) dragIds.add(child.id);
        });
      }
    });
    dragRef.current = {
      isDraggingNode: true,
      hasMoved: false,
      startX: event.clientX,
      startY: event.clientY,
      initialSelectedNodes: currentNodes.filter((node) => dragIds.has(node.id)).map((node) => ({ id: node.id, x: node.position.x, y: node.position.y }))
    };
    historyPausedRef.current = true;
    nodeDraggingRef.current = true;
    setIsNodeDragging(true);
  }, []);
  const finishNodeDrag = useCallback((clientX, clientY) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (!dragRef.current.isDraggingNode) return;
    const wasClick = !dragRef.current.hasMoved && dragRef.current.initialSelectedNodes.length === 1;
    const clickedNodeId = dragRef.current.initialSelectedNodes[0]?.id;
    const currentViewport = viewportRef.current;
    const dx = clientX == null ? 0 : (clientX - dragRef.current.startX) / currentViewport.k;
    const dy = clientY == null ? 0 : (clientY - dragRef.current.startY) / currentViewport.k;
    const initialPositions = dragRef.current.initialSelectedNodes;
    historyPausedRef.current = false;
    nodeDraggingRef.current = false;
    setIsNodeDragging(false);
    setDropTargetGroupId(null);
    if (dragRef.current.hasMoved && clientX != null && clientY != null) {
      const movedIds = new Set(initialPositions.map((item) => item.id));
      setNodes((prev) => {
        const moved = prev.map((node) => {
          const initial = initialPositions.find((item) => item.id === node.id);
          return initial ? { ...node, position: { x: initial.x + dx, y: initial.y + dy } } : node;
        });
        const targetGroup = findGroupDropTarget(movedIds, moved);
        if (targetGroup) return snapNodesIntoGroup(movedIds, moved, targetGroup);
        return moved.map((node) => {
          if (!movedIds.has(node.id) || node.type === CanvasNodeType.Group) return node;
          const groupId = findContainingGroupId(node, moved);
          if (node.metadata?.groupId === groupId) return node;
          return { ...node, metadata: { ...node.metadata, groupId } };
        });
      });
    }
    dragRef.current.isDraggingNode = false;
    dragRef.current.hasMoved = false;
    dragRef.current.initialSelectedNodes = [];
    if (wasClick && clickedNodeId) {
      const clickedNode = nodesRef.current.find((node) => node.id === clickedNodeId);
      const clickedDefinition = clickedNode ? getNodeDefinition(clickedNode.type) : void 0;
      if (clickedDefinition?.hidePanel) {
        setDialogNodeId((current) => current === clickedNodeId ? current : null);
      } else if (clickedNode?.type !== CanvasNodeType.Group) {
        setDialogNodeId(clickedNodeId);
      }
    }
  }, []);
  const handleGlobalMouseMove = useCallback(
    (event) => {
      const currentViewport = viewportRef.current;
      if (dragRef.current.isDraggingNode) {
        const dx = (event.clientX - dragRef.current.startX) / currentViewport.k;
        const dy = (event.clientY - dragRef.current.startY) / currentViewport.k;
        const initialPositions = dragRef.current.initialSelectedNodes;
        if (Math.abs(event.clientX - dragRef.current.startX) > 3 || Math.abs(event.clientY - dragRef.current.startY) > 3) {
          dragRef.current.hasMoved = true;
        }
        const movedIds = new Set(initialPositions.map((item) => item.id));
        const previewNodes = nodesRef.current.map((node) => {
          const initial = initialPositions.find((item) => item.id === node.id);
          return initial ? { ...node, position: { x: initial.x + dx, y: initial.y + dy } } : node;
        });
        setDropTargetGroupId(findGroupDropTarget(movedIds, previewNodes)?.id || null);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          setNodes(
            (prev) => prev.map((node) => {
              const initial = initialPositions.find((item) => item.id === node.id);
              return initial ? { ...node, position: { x: initial.x + dx, y: initial.y + dy } } : node;
            })
          );
          rafRef.current = null;
        });
        return;
      }
      if (connectingParamsRef.current && !pendingConnectionCreateRef.current) {
        const dropTarget = getConnectionDropTarget(event.clientX, event.clientY, connectingParamsRef.current);
        connectionTargetNodeIdRef.current = dropTarget.nodeId;
        setConnectionTargetNodeId(dropTarget.nodeId);
        setMouseWorld(screenToCanvas(event.clientX, event.clientY));
      }
    },
    [finishNodeDrag, getConnectionDropTarget, screenToCanvas]
  );
  const handleGlobalPointerMove = useCallback(
    (event) => {
      const currentSelection = selectionBoxRef.current;
      if (!currentSelection) return;
      if (event.buttons === 0) {
        selectionBoxRef.current = null;
        setSelectionBox(null);
        return;
      }
      const world = screenToCanvas(event.clientX, event.clientY);
      const rectX = Math.min(currentSelection.startWorldX, world.x);
      const rectY = Math.min(currentSelection.startWorldY, world.y);
      const rectW = Math.abs(world.x - currentSelection.startWorldX);
      const rectH = Math.abs(world.y - currentSelection.startWorldY);
      const nextSelected = new Set(currentSelection.additive ? currentSelection.initialSelectedNodeIds : []);
      nodesRef.current.forEach((node) => {
        const intersects = rectX < node.position.x + node.width && rectX + rectW > node.position.x && rectY < node.position.y + node.height && rectY + rectH > node.position.y;
        if (intersects) nextSelected.add(node.id);
      });
      const nextSelectionBox = { ...currentSelection, currentWorldX: world.x, currentWorldY: world.y };
      selectionBoxRef.current = nextSelectionBox;
      setSelectionBox(nextSelectionBox);
      setSelectedNodeIds(nextSelected);
    },
    [screenToCanvas]
  );
  const handleGlobalMouseUp = useCallback(
    (event) => {
      finishNodeDrag(event.clientX, event.clientY);
      selectionBoxRef.current = null;
      setSelectionBox(null);
      if (pendingConnectionCreateRef.current) return;
      const currentConnection = connectingParamsRef.current;
      if (currentConnection) {
        const dropTarget = getConnectionDropTarget(event.clientX, event.clientY, currentConnection);
        if (dropTarget.nodeId) {
          connectNodes(currentConnection, dropTarget.nodeId);
          setConnecting(null);
        } else if (dropTarget.isNearNode) {
          setConnecting(null);
        } else {
          setMouseWorld(screenToCanvas(event.clientX, event.clientY));
          setPendingConnectionCreate({ connection: currentConnection, position: screenToCanvas(event.clientX, event.clientY) });
        }
      }
    },
    [connectNodes, finishNodeDrag, getConnectionDropTarget, screenToCanvas, setConnecting]
  );
  useEffect(() => {
    const handlePointerUp = (event) => finishNodeDrag(event.clientX, event.clientY);
    const cancelNodeDrag = () => finishNodeDrag();
    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", cancelNodeDrag);
    window.addEventListener("blur", cancelNodeDrag);
    window.addEventListener("pointermove", handleGlobalPointerMove);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", cancelNodeDrag);
      window.removeEventListener("blur", cancelNodeDrag);
      window.removeEventListener("pointermove", handleGlobalPointerMove);
    };
  }, [finishNodeDrag, handleGlobalMouseMove, handleGlobalMouseUp, handleGlobalPointerMove]);
  const createImageFileNode = useCallback(async (file, position) => {
    const image = await uploadImage(file);
    const size2 = fitNodeSize(image.width, image.height);
    const id = `image-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newNode = {
      id,
      type: CanvasNodeType.Image,
      title: file.name,
      position: { x: position.x - size2.width / 2, y: position.y - size2.height / 2 },
      width: size2.width,
      height: size2.height,
      metadata: imageMetadata(image)
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeIds(/* @__PURE__ */ new Set([id]));
    setSelectedConnectionId(null);
    setDialogNodeId(id);
  }, []);
  const createVideoFileNode = useCallback(async (file, position) => {
    const video = await uploadMediaFile(file, "video");
    const size2 = fitNodeSize(video.width || 1280, video.height || 720, VIDEO_NODE_MAX_WIDTH, VIDEO_NODE_MAX_HEIGHT);
    const id = `video-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setNodes(
      (prev) => [
        ...prev,
        {
          id,
          type: CanvasNodeType.Video,
          title: file.name,
          position: { x: position.x - size2.width / 2, y: position.y - size2.height / 2 },
          width: size2.width,
          height: size2.height,
          metadata: videoMetadata(video)
        }
      ]
    );
    setSelectedNodeIds(/* @__PURE__ */ new Set([id]));
    setSelectedConnectionId(null);
    setDialogNodeId(id);
  }, []);
  const createAudioFileNode = useCallback(async (file, position) => {
    const audio = await uploadMediaFile(file, "audio");
    const spec = NODE_DEFAULT_SIZE[CanvasNodeType.Audio];
    const id = `audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setNodes(
      (prev) => [
        ...prev,
        {
          id,
          type: CanvasNodeType.Audio,
          title: file.name,
          position: { x: position.x - spec.width / 2, y: position.y - spec.height / 2 },
          width: spec.width,
          height: spec.height,
          metadata: audioMetadata(audio)
        }
      ]
    );
    setSelectedNodeIds(/* @__PURE__ */ new Set([id]));
    setSelectedConnectionId(null);
  }, []);
  const createTextNodeFromClipboard = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      const node = {
        ...createCanvasNode(CanvasNodeType.Text, getCanvasCenter(), { content: trimmed, status: NODE_STATUS_SUCCESS }),
        title: trimmed.slice(0, 32) || t("canvas.projectPage.clipboardText")
      };
      setNodes((prev) => [...prev, node]);
      setSelectedNodeIds(/* @__PURE__ */ new Set([node.id]));
      setSelectedConnectionId(null);
      setContextMenu(null);
      setDialogNodeId(node.id);
      return true;
    },
    [getCanvasCenter, t]
  );
  const pasteSystemClipboard = useCallback(async () => {
    if (!navigator.clipboard) return;
    const items = await navigator.clipboard.read();
    const imageItem = items.find((item) => item.types.some((type) => type.startsWith("image/")));
    if (imageItem) {
      const imageType = imageItem.types.find((type) => type.startsWith("image/"));
      if (!imageType) return;
      const blob = await imageItem.getType(imageType);
      const file = new File([blob], "clipboard-image.png", { type: imageType });
      void createImageFileNode(file, getCanvasCenter());
      message.success(t("canvas.projectPage.clipboardImageAdded"));
      return;
    }
    const text = await navigator.clipboard.readText();
    if (createTextNodeFromClipboard(text)) message.success(t("canvas.projectPage.clipboardTextAdded"));
  }, [createImageFileNode, createTextNodeFromClipboard, getCanvasCenter, message, t]);
  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement || target?.closest("[contenteditable='true'],[data-canvas-no-zoom],[data-canvas-shortcuts-ignore]")) return;
      const key = event.key.toLowerCase();
      const isModifierShortcut = event.metaKey || event.ctrlKey;
      if (isModifierShortcut && key === "c" && window.getSelection()?.toString()) return;
      if (isModifierShortcut && !event.altKey && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redoCanvas();
        else
          undoCanvas();
        return;
      }
      if (isModifierShortcut && !event.altKey && key === "y") {
        event.preventDefault();
        redoCanvas();
        return;
      }
      if (isModifierShortcut && !event.altKey && key === "a") {
        event.preventDefault();
        setSelectedNodeIds(new Set(nodesRef.current.map((node) => node.id)));
        setSelectedConnectionId(null);
        setContextMenu(null);
        setSelectionBox(null);
        return;
      }
      if (isModifierShortcut && !event.altKey && key === "c") {
        event.preventDefault();
        copySelectedNodes();
        return;
      }
      if (isModifierShortcut && !event.altKey && key === "v") {
        event.preventDefault();
        if (!pasteCopiedNodes()) void pasteSystemClipboard();
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedNodeIdsRef.current.size) {
          deleteNodes(new Set(selectedNodeIdsRef.current));
        } else if (selectedConnectionId) {
          deleteConnection(selectedConnectionId);
        }
      }
      if (event.key === "Escape") {
        setSelectedNodeIds(/* @__PURE__ */ new Set());
        setSelectedConnectionId(null);
        setContextMenu(null);
        setNodeCreatePosition(null);
        setSelectionBox(null);
        setConnecting(null);
        setHoveredNodeId(null);
        setToolbarNodeId(null);
        setDialogNodeId(null);
        setInfoNodeId(null);
        setCropNodeId(null);
        setMaskEditNodeId(null);
        setPendingConnectionCreate(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [copySelectedNodes, deleteConnection, deleteNodes, pasteCopiedNodes, pasteSystemClipboard, redoCanvas, selectedConnectionId, setConnecting, undoCanvas]);
  const handleConnectStart = useCallback(
    (event, nodeId, handleType) => {
      event.stopPropagation();
      setMouseWorld(screenToCanvas(event.clientX, event.clientY));
      setConnecting({ nodeId, handleType });
      connectionTargetNodeIdRef.current = null;
      setConnectionTargetNodeId(null);
      setSelectedConnectionId(null);
    },
    [screenToCanvas, setConnecting]
  );
  const handleNodeResize = useCallback((nodeId, width, height, position) => {
    setNodes((prev) => prev.map((node) => node.id === nodeId ? { ...node, width, height, position: position || node.position } : node));
  }, []);
  const handleNodeResizeStart = useCallback(() => {
    setIsNodeResizing(true);
  }, []);
  const handleNodeResizeEnd = useCallback(() => setIsNodeResizing(false), []);
  const toggleNodeFreeResize = useCallback((nodeId) => {
    setNodes(
      (prev) => prev.map((node) => {
        if (node.id !== nodeId) return node;
        const freeResize = !node.metadata?.freeResize;
        if (freeResize || node.type !== CanvasNodeType.Image) return { ...node, metadata: { ...node.metadata, freeResize } };
        const ratio = (node.metadata?.naturalWidth || node.width) / (node.metadata?.naturalHeight || node.height || 1);
        const height = node.width / ratio;
        return { ...node, height, position: { x: node.position.x, y: node.position.y + node.height / 2 - height / 2 }, metadata: { ...node.metadata, freeResize } };
      })
    );
  }, []);
  const handleNodeContentChange = useCallback((nodeId, content) => {
    setNodes(
      (prev) => prev.map(
        (node) => node.id === nodeId ? { ...node, metadata: { ...node.metadata, content, texts: node.metadata?.texts?.map((text) => text.id === node.metadata?.primaryTextId ? { ...text, content } : text) } } : node
      )
    );
  }, []);
  const handleNodeTitleChange = useCallback((nodeId, title) => {
    setNodes((prev) => prev.map((node) => node.id === nodeId ? { ...node, title } : node));
  }, []);
  const toggleBatchExpanded = useCallback((nodeId) => {
    setExpandedBatchNodeIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else
        next.add(nodeId);
      return next;
    });
  }, []);
  const setBatchPrimary = useCallback((nodeId, itemId) => {
    setNodes(
      (prev) => prev.map((node) => {
        if (node.id !== nodeId) return node;
        if (node.type === CanvasNodeType.Text) {
          const text = node.metadata?.texts?.find((item) => item.id === itemId);
          return text?.content ? { ...node, metadata: { ...node.metadata, content: text.content, primaryTextId: text.id } } : node;
        }
        const image = node.metadata?.images?.find((item) => item.id === itemId);
        if (!image?.content) return node;
        const edge = Math.max(node.width, node.height);
        const size2 = node.metadata?.freeResize ? { width: node.width, height: node.height } : fitNodeSize(image.naturalWidth, image.naturalHeight, edge, edge);
        return {
          ...node,
          position: { x: node.position.x + node.width / 2 - size2.width / 2, y: node.position.y + node.height / 2 - size2.height / 2 },
          ...size2,
          metadata: {
            ...node.metadata,
            content: image.content,
            storageKey: image.storageKey,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            bytes: image.bytes,
            mimeType: image.mimeType,
            primaryImageId: image.id
          }
        };
      })
    );
  }, []);
  const duplicateBatchImage = useCallback((node, imageId) => {
    const image = node.metadata?.images?.find((item) => item.id === imageId);
    if (!image?.content) return;
    const id = nanoid();
    const edge = Math.max(node.width, node.height);
    const size2 = fitNodeSize(image.naturalWidth, image.naturalHeight, edge, edge);
    const copy = {
      id,
      type: CanvasNodeType.Image,
      title: node.title,
      position: { x: node.position.x + node.width * 2 + 96, y: node.position.y + node.height / 2 - size2.height / 2 },
      ...size2,
      metadata: {
        content: image.content,
        storageKey: image.storageKey,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        bytes: image.bytes,
        mimeType: image.mimeType,
        status: NODE_STATUS_SUCCESS,
        prompt: node.metadata?.prompt,
        generationType: node.metadata?.generationType,
        model: node.metadata?.model,
        size: node.metadata?.size,
        quality: node.metadata?.quality,
        background: node.metadata?.background,
        references: node.metadata?.references
      }
    };
    setNodes((prev) => [...prev, copy]);
    setSelectedNodeIds(/* @__PURE__ */ new Set([id]));
    setSelectedConnectionId(null);
    setDialogNodeId(id);
  }, []);
  const handleNodePromptChange = useCallback((nodeId, prompt) => {
    setNodes((prev) => prev.map((node) => node.id === nodeId ? { ...node, metadata: { ...node.metadata, prompt } } : node));
  }, []);
  const handleConfigNodeChange = useCallback((nodeId, patch) => {
    setNodes((prev) => prev.map((node) => node.id === nodeId ? applyNodeConfigPatch(node, patch) : node));
  }, []);
  const downloadNodeImage = useCallback((node) => {
    if (node.type !== CanvasNodeType.Image && node.type !== CanvasNodeType.Video && node.type !== CanvasNodeType.Audio || !node.metadata?.content) return;
    saveAs(node.metadata.content, `canvas-${node.type}-${node.id}.${node.type === CanvasNodeType.Video ? "mp4" : node.type === CanvasNodeType.Audio ? audioExtension(node.metadata.mimeType) : imageExtension(node.metadata.content)}`);
  }, []);
  const downloadBatchImage = useCallback((node, imageId) => {
    const image = node.metadata?.images?.find((item) => item.id === imageId);
    if (!image?.content) return;
    saveAs(image.content, `canvas-image-${node.id}-${image.id}.${imageExtension(image.content)}`);
  }, []);
  const captureVideoNodeFrame = useCallback(
    async (nodeId, position) => {
      setContextMenu(null);
      const node = nodesRef.current.find((item) => item.id === nodeId);
      const video = Array.from(containerRef.current.querySelectorAll("video[data-canvas-video]")).find((item) => item.dataset.canvasVideo === nodeId);
      if (node?.type !== CanvasNodeType.Video || !node.metadata?.content || !video) return message.error(t("canvas.videoFrames.failed"));
      try {
        const image = await uploadImage(await captureVideoFrame(node.metadata.content, position, video.currentTime));
        const size2 = fitNodeSize(image.width, image.height, VIDEO_NODE_MAX_WIDTH, VIDEO_NODE_MAX_HEIGHT);
        const id = nanoid();
        const x = node.position.x + node.width + 96;
        let y = node.position.y + node.height / 2 - size2.height / 2;
        while (nodesRef.current.some((item) => item.id !== node.id && item.position.x < x + size2.width && item.position.x + item.width > x && item.position.y < y + size2.height && item.position.y + item.height > y)) y += size2.height + 24;
        const child = {
          id,
          type: CanvasNodeType.Image,
          title: t(`canvas.videoFrames.${position}Title`, { name: node.title || t("assets.kinds.video") }),
          position: { x, y },
          ...size2,
          metadata: imageMetadata(image)
        };
        setNodes((prev) => [...prev, child]);
        setConnections((prev) => [...prev, { id: nanoid(), fromNodeId: node.id, toNodeId: id }]);
        setSelectedNodeIds(/* @__PURE__ */ new Set([id]));
        setSelectedConnectionId(null);
        setDialogNodeId(id);
        message.success(t("canvas.videoFrames.captured"));
      } catch {
        message.error(t("canvas.videoFrames.failed"));
      }
    },
    [message, t]
  );
  const saveNodeAsset = useCallback(
    async (node) => {
      if (node.type === CanvasNodeType.Text) {
        const content = node.metadata?.content?.trim();
        if (!content) return message.error(t("canvas.projectPage.noTextToSave"));
        addAsset({ kind: "text", title: node.metadata?.prompt?.slice(0, 24) || t("canvas.projectPage.canvasText"), coverUrl: "", tags: [], source: "Canvas", data: { content }, metadata: { source: "canvas", nodeId: node.id } });
        message.success(t("common.addedToAssets"));
        return;
      }
      if (node.type === CanvasNodeType.Video) {
        if (!node.metadata?.content) return message.error(t("canvas.projectPage.noVideoToSave"));
        addAsset({
          kind: "video",
          title: node.metadata?.prompt?.slice(0, 24) || t("canvas.projectPage.canvasVideo"),
          coverUrl: "",
          tags: [],
          source: "Canvas",
          data: { url: node.metadata.content, storageKey: node.metadata.storageKey, width: node.width, height: node.height, bytes: node.metadata.bytes || 0, mimeType: node.metadata.mimeType || "video/mp4" },
          metadata: { source: "canvas", nodeId: node.id, prompt: node.metadata?.prompt }
        });
        message.success(t("common.addedToAssets"));
        return;
      }
      if (!node.metadata?.content) return message.error(t("canvas.projectPage.noImageToSave"));
      const dataUrl = node.metadata.storageKey ? "" : node.metadata.content;
      addAsset({
        kind: "image",
        title: node.metadata?.prompt?.slice(0, 24) || t("canvas.projectPage.canvasImage"),
        coverUrl: node.metadata.content,
        tags: [],
        source: "Canvas",
        data: {
          dataUrl,
          storageKey: node.metadata.storageKey,
          width: node.metadata.naturalWidth || node.width,
          height: node.metadata.naturalHeight || node.height,
          bytes: node.metadata.bytes || getDataUrlByteSize(dataUrl),
          mimeType: node.metadata.mimeType || "image/png"
        },
        metadata: { source: "canvas", nodeId: node.id, prompt: node.metadata?.prompt }
      });
      message.success(t("common.addedToAssets"));
    },
    [addAsset, message, t]
  );
  const createImageReversePromptNodes = useCallback(
    (node) => {
      if (node.type !== CanvasNodeType.Image || !node.metadata?.content) {
        message.warning(t("canvas.projectPage.emptyReverse"));
        return;
      }
      const gap = 96;
      const textSpec = NODE_DEFAULT_SIZE[CanvasNodeType.Text];
      const configSpec = NODE_DEFAULT_SIZE[CanvasNodeType.Config];
      const centerY = node.position.y + node.height / 2;
      const textNode = {
        ...createCanvasNode(CanvasNodeType.Text, { x: node.position.x + node.width + gap + textSpec.width / 2, y: centerY }, { content: t("canvas.projectPage.reversePreset"), prompt: t("canvas.projectPage.reversePreset"), status: NODE_STATUS_SUCCESS, fontSize: 14 }),
        title: t("canvas.projectPage.reverseTitle")
      };
      const configNode = {
        ...createCanvasNode(
          CanvasNodeType.Config,
          { x: textNode.position.x + textNode.width + gap + configSpec.width / 2, y: centerY },
          {
            generationMode: "text",
            model: effectiveConfig.textModel || effectiveConfig.model || defaultConfig.textModel,
            count: 1,
            composerContent: t("canvas.reverseComposer", { imageId: node.id, textId: textNode.id })
          }
        ),
        title: t("canvas.projectPage.reverseConfigTitle")
      };
      setNodes((prev) => [...prev, textNode, configNode]);
      setConnections((prev) => [...prev, { id: nanoid(), fromNodeId: node.id, toNodeId: configNode.id }, { id: nanoid(), fromNodeId: textNode.id, toNodeId: configNode.id }]);
      setSelectedNodeIds(/* @__PURE__ */ new Set([configNode.id]));
      setSelectedConnectionId(null);
      setDialogNodeId(configNode.id);
      setContextMenu(null);
    },
    [effectiveConfig.model, effectiveConfig.textModel, message, t]
  );
  const cropImageNode = useCallback(async (node, crop) => {
    if (!node.metadata?.content) return;
    const cropped = await cropDataUrl(node.metadata.content, crop);
    const image = await uploadImage(cropped);
    const width = Math.min(node.width, Math.max(220, image.width));
    const childId = nanoid();
    const child = {
      id: childId,
      type: CanvasNodeType.Image,
      title: "Cropped Image",
      position: { x: node.position.x + node.width + 96, y: node.position.y },
      width,
      height: width * (image.height / image.width),
      metadata: {
        ...imageMetadata(image),
        prompt: node.metadata?.prompt
      }
    };
    setNodes((prev) => [...prev, child]);
    setConnections((prev) => [...prev, { id: nanoid(), fromNodeId: node.id, toNodeId: childId }]);
    setSelectedNodeIds(/* @__PURE__ */ new Set([childId]));
    setDialogNodeId(childId);
    setCropNodeId(null);
  }, []);
  const splitImageNode = useCallback(
    async (node, params2) => {
      if (!node.metadata?.content) return;
      setSplitNodeId(null);
      const pieces = await splitDataUrl(node.metadata.content, params2);
      const gap = 16;
      const cellWidth = node.width / params2.columns;
      const cellHeight = node.height / params2.rows;
      const startX = node.position.x + node.width + 96;
      const startY = node.position.y;
      const childNodes = await Promise.all(
        pieces.map(async (piece) => {
          const image = await uploadImage(piece.dataUrl);
          const id = nanoid();
          return {
            id,
            type: CanvasNodeType.Image,
            title: t("canvas.projectPage.splitTitle", { name: node.title || t("assets.kinds.image"), row: piece.row + 1, column: piece.column + 1 }),
            position: { x: startX + piece.column * (cellWidth + gap), y: startY + piece.row * (cellHeight + gap) },
            width: cellWidth,
            height: cellHeight,
            metadata: {
              ...imageMetadata(image),
              prompt: node.metadata?.prompt
            }
          };
        })
      );
      setNodes((prev) => [...prev, ...childNodes]);
      setConnections((prev) => [...prev, ...childNodes.map((child) => ({ id: nanoid(), fromNodeId: node.id, toNodeId: child.id }))]);
      setSelectedNodeIds(new Set(childNodes.map((child) => child.id)));
      setSelectedConnectionId(null);
      setDialogNodeId(null);
      message.success(t("canvas.projectPage.splitSuccess", { count: childNodes.length }));
    },
    [message, t]
  );
  const maskEditImageNode = useCallback(
    async (node, payload) => {
      if (!node.metadata?.content) return;
      const generationConfig = { ...buildGenerationConfig(effectiveConfig, node, "image"), count: "1", size: node.metadata?.size || "auto" };
      if (!isAiConfigReady(generationConfig, generationConfig.model)) {
        openConfigDialog(true);
        return;
      }
      const userPrompt = payload.prompt.trim();
      const prompt = t("canvas.projectPage.maskPrompt", { prompt: userPrompt });
      const childId = nanoid();
      const source = { id: node.id, name: `${node.title || node.id}.png`, type: node.metadata.mimeType || "image/png", dataUrl: node.metadata.content, storageKey: node.metadata.storageKey };
      const generationMetadata = buildImageGenerationMetadata("edit", generationConfig, 1, [source]);
      setMaskEditNodeId(null);
      setRunningNodeId(childId);
      setNodes(
        (prev) => [
          ...prev,
          {
            id: childId,
            type: CanvasNodeType.Image,
            title: userPrompt.slice(0, 32) || t("canvas.projectPage.maskResult"),
            position: { x: node.position.x + node.width + 96, y: node.position.y },
            width: node.width,
            height: node.height,
            metadata: { prompt, status: NODE_STATUS_LOADING, ...generationMetadata }
          }
        ]
      );
      setConnections((prev) => [...prev, { id: nanoid(), fromNodeId: node.id, toNodeId: childId }]);
      setSelectedNodeIds(/* @__PURE__ */ new Set([childId]));
      setSelectedConnectionId(null);
      setDialogNodeId(childId);
      const controller = startGenerationRequest(childId, node.id, childId);
      try {
        const image = await requestEdit(generationConfig, prompt, [source], { id: `${node.id}-mask`, name: "mask.png", type: "image/png", dataUrl: payload.maskDataUrl }, { signal: controller.signal }).then((items) => items[0]);
        const uploaded = await uploadImage(image.dataUrl, { signal: controller.signal });
        const size2 = fitNodeSize(uploaded.width, uploaded.height, node.width, node.height);
        setNodes((prev) => prev.map((item) => item.id === childId ? { ...item, width: size2.width, height: size2.height, metadata: { ...item.metadata, ...imageMetadata(uploaded), prompt, ...generationMetadata } } : item));
      } catch (error) {
        if (isGenerationCanceled(error)) return;
        const errorDetails = error instanceof Error ? error.message : t("canvas.projectPage.maskFailed");
        message.error(errorDetails);
        setNodes((prev) => prev.map((item) => item.id === childId ? { ...item, metadata: { ...item.metadata, status: NODE_STATUS_ERROR, errorDetails } } : item));
      } finally {
        finishGenerationRequest(childId, controller);
        setRunningNodeId(null);
      }
    },
    [effectiveConfig, finishGenerationRequest, isAiConfigReady, message, openConfigDialog, startGenerationRequest, t]
  );
  const upscaleImageNode = useCallback(async (node, params2) => {
    if (!node.metadata?.content) return;
    setUpscaleNodeId(null);
    const upscaled = await upscaleDataUrl(node.metadata.content, params2);
    const image = await uploadImage(upscaled);
    const size2 = fitNodeSize(image.width, image.height);
    const childId = nanoid();
    const child = {
      id: childId,
      type: CanvasNodeType.Image,
      title: "Upscaled Image",
      position: { x: node.position.x + node.width + 96, y: node.position.y },
      width: size2.width,
      height: size2.height,
      metadata: {
        ...imageMetadata(image),
        prompt: node.metadata?.prompt
      }
    };
    setNodes((prev) => [...prev, child]);
    setConnections((prev) => [...prev, { id: nanoid(), fromNodeId: node.id, toNodeId: childId }]);
    setSelectedNodeIds(/* @__PURE__ */ new Set([childId]));
    setDialogNodeId(childId);
  }, []);
  const generateAngleNode = useCallback(
    async (node, params2) => {
      if (!node.metadata?.content) return;
      const generationConfig = { ...buildGenerationConfig(effectiveConfig, node, "image"), count: "1" };
      if (!isAiConfigReady(generationConfig, generationConfig.model)) {
        openConfigDialog(true);
        return;
      }
      const childId = nanoid();
      const imageConfig = NODE_DEFAULT_SIZE[CanvasNodeType.Image];
      const title = buildAngleLabel(params2);
      const prompt = buildAnglePrompt(params2);
      const generationMetadata = buildImageGenerationMetadata(
        "edit",
        generationConfig,
        1,
        [
          { id: node.id, name: `${node.title || node.id}.png`, type: node.metadata.mimeType || "image/png", dataUrl: node.metadata.content, storageKey: node.metadata.storageKey }
        ]
      );
      setAngleNodeId(null);
      setRunningNodeId(childId);
      setNodes(
        (prev) => [
          ...prev,
          {
            id: childId,
            type: CanvasNodeType.Image,
            title,
            position: { x: node.position.x + node.width + 96, y: node.position.y },
            width: imageConfig.width,
            height: imageConfig.height,
            metadata: { prompt, status: NODE_STATUS_LOADING, ...generationMetadata }
          }
        ]
      );
      setConnections((prev) => [...prev, { id: nanoid(), fromNodeId: node.id, toNodeId: childId }]);
      setSelectedNodeIds(/* @__PURE__ */ new Set([childId]));
      setDialogNodeId(childId);
      const controller = startGenerationRequest(childId, node.id, childId);
      try {
        const image = await requestEdit(
          generationConfig,
          prompt,
          [{ id: node.id, name: `${node.title || node.id}.png`, type: node.metadata.mimeType || "image/png", dataUrl: node.metadata.content, storageKey: node.metadata.storageKey }],
          void 0,
          { signal: controller.signal }
        ).then((items) => items[0]);
        const uploaded = await uploadImage(image.dataUrl, { signal: controller.signal });
        const size2 = fitNodeSize(uploaded.width, uploaded.height, imageConfig.width, imageConfig.height);
        setNodes((prev) => prev.map((item) => item.id === childId ? { ...item, width: size2.width, height: size2.height, metadata: { ...item.metadata, ...imageMetadata(uploaded), prompt, ...generationMetadata } } : item));
      } catch (error) {
        if (isGenerationCanceled(error)) return;
        const errorDetails = error instanceof Error ? error.message : t("canvas.projectPage.generationFailed");
        setNodes((prev) => prev.map((item) => item.id === childId ? { ...item, metadata: { ...item.metadata, status: NODE_STATUS_ERROR, errorDetails } } : item));
      } finally {
        finishGenerationRequest(childId, controller);
        setRunningNodeId(null);
      }
    },
    [effectiveConfig, finishGenerationRequest, openConfigDialog, startGenerationRequest, t]
  );
  const handleFontSizeChange = useCallback((nodeId, fontSize) => {
    setNodes((prev) => prev.map((node) => node.id === nodeId ? { ...node, metadata: { ...node.metadata, fontSize } } : node));
  }, []);
  const handleUploadRequest = useCallback((nodeId, position) => {
    uploadTargetRef.current = { nodeId, position };
    imageInputRef.current?.click();
  }, []);
  const handleImageInputChange = useCallback(
    async (event) => {
      const files = Array.from(event.target.files || []).filter(
        (f) => f.type.startsWith("image/") || f.type.startsWith("video/") || isAudioFile(f)
      );
      if (!files.length) {
        uploadTargetRef.current = null;
        event.target.value = "";
        return;
      }
      const target = uploadTargetRef.current;
      const basePosition = target?.position || screenToCanvas(
        (containerRef.current?.getBoundingClientRect().left || 0) + size.width / 2,
        (containerRef.current?.getBoundingClientRect().top || 0) + size.height / 2
      );
      const STAGGER = 40;
      if (target?.nodeId) {
        const [first, ...rest] = files;
        if (isAudioFile(first)) {
          const audio = await uploadMediaFile(first, "audio");
          const spec = NODE_DEFAULT_SIZE[CanvasNodeType.Audio];
          setNodes(
            (prev) => prev.map(
              (node) => node.id === target.nodeId ? {
                ...node,
                type: CanvasNodeType.Audio,
                title: first.name,
                position: { x: node.position.x + node.width / 2 - spec.width / 2, y: node.position.y + node.height / 2 - spec.height / 2 },
                width: spec.width,
                height: spec.height,
                metadata: { ...node.metadata, ...audioMetadata(audio), errorDetails: void 0 }
              } : node
            )
          );
          setSelectedNodeIds(/* @__PURE__ */ new Set([target.nodeId]));
          setSelectedConnectionId(null);
        } else if (first.type.startsWith("video/")) {
          const video = await uploadMediaFile(first, "video");
          const nextSize = fitNodeSize(video.width || 1280, video.height || 720, VIDEO_NODE_MAX_WIDTH, VIDEO_NODE_MAX_HEIGHT);
          setNodes(
            (prev) => prev.map(
              (node) => node.id === target.nodeId ? {
                ...node,
                type: CanvasNodeType.Video,
                title: first.name,
                position: { x: node.position.x + node.width / 2 - nextSize.width / 2, y: node.position.y + node.height / 2 - nextSize.height / 2 },
                width: nextSize.width,
                height: nextSize.height,
                metadata: { ...node.metadata, ...videoMetadata(video), errorDetails: void 0 }
              } : node
            )
          );
          setSelectedNodeIds(/* @__PURE__ */ new Set([target.nodeId]));
          setSelectedConnectionId(null);
        } else {
          const image = await uploadImage(first);
          const s = fitNodeSize(image.width, image.height);
          setNodes(
            (prev) => prev.map(
              (node) => node.id === target.nodeId ? {
                ...node,
                type: CanvasNodeType.Image,
                title: first.name,
                width: s.width,
                height: s.height,
                metadata: {
                  ...node.metadata,
                  ...imageMetadata(image),
                  errorDetails: void 0,
                  freeResize: false,
                  images: void 0,
                  generationType: void 0,
                  model: void 0,
                  size: void 0,
                  quality: void 0,
                  count: void 0,
                  references: void 0,
                  primaryImageId: void 0
                }
              } : node
            )
          );
          setSelectedNodeIds(/* @__PURE__ */ new Set([target.nodeId]));
          setSelectedConnectionId(null);
        }
        for (let i = 0; i < rest.length; i++) {
          const offsetPos = { x: basePosition.x + (i + 1) * STAGGER, y: basePosition.y + (i + 1) * STAGGER };
          const f = rest[i];
          if (isAudioFile(f)) {
            void createAudioFileNode(f, offsetPos);
          } else if (f.type.startsWith("video/")) {
            void createVideoFileNode(f, offsetPos);
          } else {
            void createImageFileNode(f, offsetPos);
          }
        }
      } else {
        for (let i = 0; i < files.length; i++) {
          const offsetPos = { x: basePosition.x + i * STAGGER, y: basePosition.y + i * STAGGER };
          const f = files[i];
          if (isAudioFile(f)) {
            void createAudioFileNode(f, offsetPos);
          } else if (f.type.startsWith("video/")) {
            void createVideoFileNode(f, offsetPos);
          } else {
            void createImageFileNode(f, offsetPos);
          }
        }
      }
      uploadTargetRef.current = null;
      event.target.value = "";
    },
    [createAudioFileNode, createImageFileNode, createVideoFileNode, screenToCanvas, size.height, size.width]
  );
  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files).filter(
        (item) => item.type.startsWith("image/") || item.type.startsWith("video/") || isAudioFile(item)
      );
      if (!files.length) return;
      const basePos = screenToCanvas(event.clientX, event.clientY);
      const STAGGER = 40;
      for (let i = 0; i < files.length; i++) {
        const pos = { x: basePos.x + i * STAGGER, y: basePos.y + i * STAGGER };
        const f = files[i];
        if (isAudioFile(f)) {
          void createAudioFileNode(f, pos);
        } else if (f.type.startsWith("video/")) {
          void createVideoFileNode(f, pos);
        } else {
          void createImageFileNode(f, pos);
        }
      }
    },
    [createAudioFileNode, createImageFileNode, createVideoFileNode, screenToCanvas]
  );
  const startTitleEditing = useCallback(() => {
    setTitleDraft(currentProject?.title || t("canvas.projectPage.untitledCanvas"));
    setTitleEditing(true);
  }, [currentProject?.title, t]);
  const finishTitleEditing = useCallback(() => {
    const nextTitle = titleDraft.trim();
    if (nextTitle) renameProject(projectId, nextTitle);
    setTitleEditing(false);
  }, [projectId, renameProject, titleDraft]);
  const preventCanvasContextMenu = useCallback((event) => {
    if (event.target.closest("[data-node-id]")) return;
    event.preventDefault();
    setContextMenu(null);
  }, []);
  const handleGenerateNode = useCallback(
    async (nodeId, mode, prompt) => {
      const sourceNode = nodesRef.current.find((node) => node.id === nodeId);
      const generationConfig = buildGenerationConfig(effectiveConfig, sourceNode, mode);
      if (!isAiConfigReady(generationConfig, generationConfig.model)) {
        openConfigDialog(true);
        return;
      }
      const builtinPanel = sourceNode ? getNodeDefinition(sourceNode.type)?.useBuiltinPanel : void 0;
      if (sourceNode && builtinPanel?.writeBackToSelf && builtinPanel.mode === "image") {
        const scene = prompt.trim();
        if (!scene) return;
        setRunningNodeId(nodeId);
        const controller = startGenerationRequest(nodeId, nodeId, nodeId);
        setNodes((prev) => prev.map((node) => node.id === nodeId ? { ...node, metadata: { ...node.metadata, prompt: scene, status: NODE_STATUS_LOADING, errorDetails: void 0 } } : node));
        try {
          const fullPrompt = (builtinPanel.promptPrefix || "") + scene;
          const context = await hydrateNodeGenerationContext(buildNodeGenerationContext(nodeId, nodesRef.current, connectionsRef.current, fullPrompt));
          const refs = context.referenceImages;
          const image = refs.length ? await requestEdit({ ...generationConfig, count: "1" }, context.prompt, refs, void 0, { signal: controller.signal }).then((items) => items[0]) : await requestGeneration({ ...generationConfig, count: "1" }, context.prompt, { signal: controller.signal }).then((items) => items[0]);
          const uploaded = await uploadImage(image.dataUrl, { signal: controller.signal });
          setNodes(
            (prev) => prev.map((node) => node.id === nodeId ? { ...node, metadata: { ...node.metadata, ...imageMetadata(uploaded), prompt: scene, model: generationConfig.model, status: NODE_STATUS_SUCCESS, errorDetails: void 0 } } : node)
          );
          setDialogNodeId(null);
        } catch (error) {
          if (!isGenerationCanceled(error)) {
            const errorDetails = error instanceof Error ? error.message : t("canvas.projectPage.generationFailed");
            message.error(errorDetails);
            setNodes((prev) => prev.map((node) => node.id === nodeId ? { ...node, metadata: { ...node.metadata, status: NODE_STATUS_ERROR, errorDetails } } : node));
          }
        } finally {
          finishGenerationRequest(nodeId, controller);
        }
        return;
      }
      setRunningNodeId(nodeId);
      const runController = startGenerationRequest(nodeId, nodeId, nodeId);
      const sourceTextContent = sourceNode?.type === CanvasNodeType.Text ? sourceNode.metadata?.content?.trim() || "" : "";
      const editingTextNode = mode === "text" && Boolean(sourceTextContent);
      const generationContext = await hydrateNodeGenerationContext(
        buildNodeGenerationContext(nodeId, nodesRef.current, connectionsRef.current, editingTextNode ? t("canvas.projectPage.editTextPrompt", { source: sourceTextContent, prompt }) : prompt)
      );
      const effectivePrompt = generationContext.prompt.trim();
      if (runController.signal.aborted) {
        finishGenerationRequest(nodeId, runController);
        setRunningNodeId(null);
        return;
      }
      const markSourceStatus = sourceNode?.type !== CanvasNodeType.Image && !editingTextNode;
      if (!effectivePrompt && (mode === "text" || mode === "audio")) {
        finishGenerationRequest(nodeId, runController);
        setRunningNodeId(null);
        return;
      }
      let pendingChildIds = [];
      if (markSourceStatus) setNodes((prev) => prev.map((node) => node.id === nodeId ? { ...node, metadata: { ...node.metadata, ...node.type === CanvasNodeType.Config ? {} : { prompt }, status: NODE_STATUS_LOADING, errorDetails: void 0 } } : node));
      try {
        if (mode === "image") {
          const count = getGenerationCount(generationConfig.count);
          const isConfigNode2 = sourceNode?.type === CanvasNodeType.Config;
          const isImageNode = sourceNode?.type === CanvasNodeType.Image;
          const isEmptyImageNode = isImageNode && !sourceNode?.metadata?.content;
          const sourceReference = isImageNode && sourceNode?.metadata?.content ? [{ id: sourceNode.id, name: `${sourceNode.title || sourceNode.id}.png`, type: sourceNode.metadata.mimeType || "image/png", dataUrl: sourceNode.metadata.content, storageKey: sourceNode.metadata.storageKey }] : [];
          const referenceImages = [...new Map([...sourceReference, ...generationContext.referenceImages].map((image) => [image.id, image])).values()];
          const generationType = referenceImages.length ? "edit" : "generation";
          const generationMetadata = buildImageGenerationMetadata(generationType, generationConfig, count, referenceImages);
          const parentConfig2 = NODE_DEFAULT_SIZE[isConfigNode2 ? CanvasNodeType.Config : isImageNode ? CanvasNodeType.Image : CanvasNodeType.Text];
          const imageConfig = NODE_DEFAULT_SIZE[CanvasNodeType.Image];
          const parentPosition2 = sourceNode?.position || { x: 0, y: 0 };
          const rootId2 = isEmptyImageNode ? nodeId : nanoid();
          const imageIds = Array.from({ length: count }, () => nanoid());
          pendingChildIds = [rootId2];
          const rootNode2 = {
            id: rootId2,
            type: CanvasNodeType.Image,
            title: effectivePrompt.slice(0, 32) || "Generated Image",
            position: {
              x: isEmptyImageNode ? parentPosition2.x : parentPosition2.x + parentConfig2.width + 96,
              y: parentPosition2.y + parentConfig2.height / 2 - imageConfig.height / 2
            },
            width: isEmptyImageNode ? sourceNode?.width || imageConfig.width : imageConfig.width,
            height: isEmptyImageNode ? sourceNode?.height || imageConfig.height : imageConfig.height,
            metadata: {
              prompt: effectivePrompt,
              status: NODE_STATUS_LOADING,
              images: imageIds.map((id) => ({ id, status: NODE_STATUS_LOADING, content: "", naturalWidth: 0, naturalHeight: 0, bytes: 0, mimeType: "" })),
              ...generationMetadata
            }
          };
          setNodes(
            (prev) => [
              ...prev.map(
                (node) => node.id === nodeId ? isConfigNode2 ? {
                  ...node,
                  metadata: { ...node.metadata, status: NODE_STATUS_LOADING, errorDetails: void 0 }
                } : isEmptyImageNode ? {
                  ...node,
                  position: rootNode2.position,
                  width: rootNode2.width,
                  height: rootNode2.height,
                  title: rootNode2.title,
                  metadata: { ...node.metadata, ...rootNode2.metadata, errorDetails: void 0 }
                } : isImageNode ? {
                  ...node,
                  metadata: { ...node.metadata, status: NODE_STATUS_SUCCESS, errorDetails: void 0 }
                } : {
                  ...node,
                  type: CanvasNodeType.Text,
                  title: prompt.slice(0, 32) || "Prompt",
                  width: parentConfig2.width,
                  height: parentConfig2.height,
                  metadata: { ...node.metadata, content: prompt, prompt, status: NODE_STATUS_SUCCESS, fontSize: 14, errorDetails: void 0 }
                } : node
              ),
              ...isEmptyImageNode ? [] : [rootNode2]
            ]
          );
          if (!isEmptyImageNode) setConnections((prev) => [...prev, { id: nanoid(), fromNodeId: nodeId, toNodeId: rootId2 }]);
          setSelectedNodeIds(/* @__PURE__ */ new Set([nodeId]));
          setSelectedConnectionId(null);
          setDialogNodeId(nodeId);
          const controller2 = rootId2 === nodeId ? runController : startGenerationRequest(rootId2, nodeId, nodeId, runController);
          let hasSuccess = false;
          let hasFailure = false;
          let firstError = "";
          await Promise.all(
            imageIds.map(async (imageId) => {
              try {
                const image = referenceImages.length ? await requestEdit({ ...generationConfig, count: "1" }, effectivePrompt, referenceImages, void 0, { signal: controller2.signal }).then((items) => items[0]) : await requestGeneration({ ...generationConfig, count: "1" }, effectivePrompt, { signal: controller2.signal }).then((items) => items[0]);
                const uploaded = await uploadImage(image.dataUrl, { signal: controller2.signal });
                const imageSize = fitNodeSize(uploaded.width, uploaded.height, imageConfig.width, imageConfig.height);
                const item = { id: imageId, status: NODE_STATUS_SUCCESS, content: uploaded.url, storageKey: uploaded.storageKey, naturalWidth: uploaded.width, naturalHeight: uploaded.height, bytes: uploaded.bytes, mimeType: uploaded.mimeType };
                setNodes(
                  (prev) => prev.map((node) => {
                    if (node.id !== rootId2) return node;
                    const images = node.metadata?.images?.map((image2) => image2.id === imageId ? item : image2) || [];
                    if (node.metadata?.primaryImageId) return { ...node, metadata: { ...node.metadata, images } };
                    const center = { x: node.position.x + node.width / 2, y: node.position.y + node.height / 2 };
                    return {
                      ...node,
                      position: { x: center.x - imageSize.width / 2, y: center.y - imageSize.height / 2 },
                      ...imageSize,
                      metadata: {
                        ...node.metadata,
                        content: item.content,
                        storageKey: item.storageKey,
                        naturalWidth: item.naturalWidth,
                        naturalHeight: item.naturalHeight,
                        bytes: item.bytes,
                        mimeType: item.mimeType,
                        images,
                        primaryImageId: imageId
                      }
                    };
                  })
                );
                hasSuccess = true;
                if (isConfigNode2) setNodes((prev) => prev.map((node) => node.id === nodeId ? { ...node, metadata: { ...node.metadata, status: NODE_STATUS_SUCCESS, errorDetails: void 0 } } : node));
                return true;
              } catch (error) {
                if (isGenerationCanceled(error)) return false;
                const errorDetails = error instanceof Error ? error.message : t("canvas.projectPage.generationFailed");
                if (!firstError) firstError = errorDetails;
                hasFailure = true;
                setNodes((prev) => prev.map((node) => node.id === rootId2 ? { ...node, metadata: { ...node.metadata, images: node.metadata?.images?.map((image) => image.id === imageId ? { ...image, status: NODE_STATUS_ERROR, errorDetails } : image) } } : node));
              }
              return false;
            })
          );
          if (rootId2 !== nodeId) finishGenerationRequest(rootId2, controller2);
          if (controller2.signal.aborted) {
            setNodes((prev) => prev.map((node) => node.id === nodeId && isConfigNode2 && node.metadata?.status === NODE_STATUS_LOADING ? { ...node, metadata: { ...node.metadata, status: NODE_STATUS_IDLE, errorDetails: void 0 } } : node));
            return;
          }
          if (hasFailure) {
            message.error(hasSuccess ? t("canvas.projectPage.partialFailed") : firstError || t("canvas.projectPage.generationFailed"));
          }
          setNodes(
            (prev) => prev.map(
              (node) => node.id === nodeId && isConfigNode2 ? { ...node, metadata: { ...node.metadata, status: hasSuccess ? NODE_STATUS_SUCCESS : NODE_STATUS_ERROR, errorDetails: hasSuccess ? void 0 : t("canvas.projectPage.generationFailed") } } : node.id === rootId2 ? { ...node, metadata: { ...node.metadata, status: hasSuccess ? NODE_STATUS_SUCCESS : NODE_STATUS_ERROR, errorDetails: hasSuccess ? void 0 : t("canvas.projectPage.allFailed") } } : node
            )
          );
          return;
        }
        if (mode === "video") {
          const spec = nodeSizeFromRatio(generationConfig.size, NODE_DEFAULT_SIZE[CanvasNodeType.Video].width, NODE_DEFAULT_SIZE[CanvasNodeType.Video].height) || NODE_DEFAULT_SIZE[CanvasNodeType.Video];
          const isEmptyVideoNode = sourceNode?.type === CanvasNodeType.Video && !sourceNode.metadata?.content;
          const videoId = isEmptyVideoNode ? nodeId : nanoid();
          const parent = sourceNode?.position || { x: 0, y: 0 };
          const videoNode = {
            id: videoId,
            type: CanvasNodeType.Video,
            title: effectivePrompt.slice(0, 32) || "Generated Video",
            position: isEmptyVideoNode ? sourceNode.position : { x: parent.x + (sourceNode?.width || spec.width) + 96, y: parent.y },
            width: isEmptyVideoNode ? sourceNode.width : spec.width,
            height: isEmptyVideoNode ? sourceNode.height : spec.height,
            metadata: {
              prompt: effectivePrompt,
              status: NODE_STATUS_LOADING,
              model: generationConfig.model,
              size: generationConfig.size,
              seconds: generationConfig.videoSeconds,
              vquality: generationConfig.vquality,
              generateAudio: generationConfig.videoGenerateAudio,
              watermark: generationConfig.videoWatermark,
              references: generationReferenceUrls(generationContext)
            }
          };
          pendingChildIds = [videoId];
          setNodes(
            (prev) => isEmptyVideoNode ? prev.map((node) => node.id === nodeId ? { ...node, ...videoNode } : node) : [...prev.map((node) => node.id === nodeId ? { ...node, metadata: { ...node.metadata, status: NODE_STATUS_SUCCESS } } : node), videoNode]
          );
          if (!isEmptyVideoNode) setConnections((prev) => [...prev, { id: nanoid(), fromNodeId: nodeId, toNodeId: videoId }]);
          const controller2 = startGenerationRequest(videoId, nodeId, nodeId, runController);
          try {
            const video = await storeGeneratedVideo(
              await requestVideoGeneration(generationConfig, effectivePrompt, generationContext.referenceImages, { signal: controller2.signal })
            );
            const videoSize = fitNodeSize(video.width || spec.width, video.height || spec.height, VIDEO_NODE_MAX_WIDTH, VIDEO_NODE_MAX_HEIGHT);
            setNodes(
              (prev) => prev.map(
                (node) => node.id === videoId ? {
                  ...node,
                  width: videoSize.width,
                  height: videoSize.height,
                  position: { x: node.position.x + node.width / 2 - videoSize.width / 2, y: node.position.y + node.height / 2 - videoSize.height / 2 },
                  metadata: {
                    ...node.metadata,
                    ...videoMetadata(video),
                    prompt: effectivePrompt,
                    model: generationConfig.model,
                    size: generationConfig.size,
                    seconds: generationConfig.videoSeconds,
                    vquality: generationConfig.vquality,
                    generateAudio: generationConfig.videoGenerateAudio,
                    watermark: generationConfig.videoWatermark,
                    references: generationReferenceUrls(generationContext)
                  }
                } : node
              )
            );
          } finally {
            finishGenerationRequest(videoId, controller2);
          }
          return;
        }
        if (mode === "audio") {
          const spec = NODE_DEFAULT_SIZE[CanvasNodeType.Audio];
          const isEmptyAudioNode = sourceNode?.type === CanvasNodeType.Audio && !sourceNode.metadata?.content;
          const audioId = isEmptyAudioNode ? nodeId : nanoid();
          const parent = sourceNode?.position || { x: 0, y: 0 };
          const audioNode = {
            id: audioId,
            type: CanvasNodeType.Audio,
            title: effectivePrompt.slice(0, 32) || "Generated Audio",
            position: isEmptyAudioNode ? sourceNode.position : { x: parent.x + (sourceNode?.width || spec.width) + 96, y: parent.y + ((sourceNode?.height || spec.height) - spec.height) / 2 },
            width: isEmptyAudioNode ? sourceNode.width : spec.width,
            height: isEmptyAudioNode ? sourceNode.height : spec.height,
            metadata: { prompt: effectivePrompt, status: NODE_STATUS_LOADING, ...buildAudioGenerationMetadata(generationConfig) }
          };
          pendingChildIds = [audioId];
          setNodes(
            (prev) => isEmptyAudioNode ? prev.map((node) => node.id === nodeId ? { ...node, ...audioNode } : node) : [...prev.map((node) => node.id === nodeId ? { ...node, metadata: { ...node.metadata, status: NODE_STATUS_SUCCESS } } : node), audioNode]
          );
          if (!isEmptyAudioNode) setConnections((prev) => [...prev, { id: nanoid(), fromNodeId: nodeId, toNodeId: audioId }]);
          const controller2 = startGenerationRequest(audioId, nodeId, nodeId, runController);
          try {
            const audio = await storeGeneratedAudio(await requestAudioGeneration(generationConfig, effectivePrompt, { signal: controller2.signal }), generationConfig.audioFormat);
            setNodes((prev) => prev.map((node) => node.id === audioId ? { ...node, metadata: { ...node.metadata, ...audioMetadata(audio), prompt: effectivePrompt, ...buildAudioGenerationMetadata(generationConfig) } } : node));
          } finally {
            finishGenerationRequest(audioId, controller2);
          }
          return;
        }
        const isConfigNode = sourceNode?.type === CanvasNodeType.Config;
        const textCount = getGenerationCount(String(sourceNode?.metadata?.textCount || 1));
        const parentConfig = NODE_DEFAULT_SIZE[isConfigNode ? CanvasNodeType.Config : CanvasNodeType.Text];
        const textConfig = NODE_DEFAULT_SIZE[CanvasNodeType.Text];
        const parentPosition = sourceNode?.position || { x: 0, y: 0 };
        const isEmptyTextNode = sourceNode?.type === CanvasNodeType.Text && !sourceTextContent;
        const rootId = isEmptyTextNode ? nodeId : nanoid();
        const textIds = Array.from({ length: textCount }, () => nanoid());
        const rootNode = {
          id: rootId,
          type: CanvasNodeType.Text,
          title: effectivePrompt.slice(0, 32) || "Generated Text",
          position: isEmptyTextNode ? sourceNode.position : { x: parentPosition.x + parentConfig.width + 96, y: parentPosition.y + parentConfig.height / 2 - textConfig.height / 2 },
          width: isEmptyTextNode ? sourceNode.width : textConfig.width,
          height: isEmptyTextNode ? sourceNode.height : textConfig.height,
          metadata: {
            prompt: effectivePrompt,
            status: NODE_STATUS_LOADING,
            fontSize: 14,
            model: generationConfig.model,
            reasoningEffort: generationConfig.reasoningEffort,
            textCount,
            texts: textIds.map((id) => ({ id, status: NODE_STATUS_LOADING, content: "" })),
            primaryTextId: textIds[0]
          }
        };
        pendingChildIds = [rootId];
        setNodes(
          (prev) => isEmptyTextNode ? prev.map((node) => node.id === nodeId ? { ...node, ...rootNode } : node) : [...prev.map((node) => node.id === nodeId && isConfigNode ? { ...node, metadata: { ...node.metadata, status: NODE_STATUS_LOADING, errorDetails: void 0 } } : node), rootNode]
        );
        if (!isEmptyTextNode) setConnections((prev) => [...prev, { id: nanoid(), fromNodeId: nodeId, toNodeId: rootId }]);
        setSelectedNodeIds(/* @__PURE__ */ new Set([nodeId]));
        setSelectedConnectionId(null);
        setDialogNodeId(nodeId);
        const controller = rootId === nodeId ? runController : startGenerationRequest(rootId, nodeId, nodeId, runController);
        const results = await Promise.all(
          textIds.map(async (textId) => {
            let streamed = "";
            try {
              const answer = await requestImageQuestion(
                generationConfig,
                buildNodeResponseMessages({ ...generationContext, prompt: effectivePrompt }),
                (text) => {
                  streamed = text;
                  setNodes(
                    (prev) => prev.map(
                      (node) => node.id === rootId ? {
                        ...node,
                        metadata: {
                          ...node.metadata,
                          ...node.metadata?.primaryTextId === textId ? { content: text } : {},
                          texts: node.metadata?.texts?.map((item) => item.id === textId ? { ...item, content: text } : item)
                        }
                      } : node
                    )
                  );
                },
                { signal: controller.signal }
              );
              const content = answer || streamed;
              setNodes(
                (prev) => prev.map(
                  (node) => node.id === rootId ? {
                    ...node,
                    metadata: {
                      ...node.metadata,
                      ...node.metadata?.primaryTextId === textId ? { content } : {},
                      texts: node.metadata?.texts?.map((item) => item.id === textId ? { ...item, content, status: NODE_STATUS_SUCCESS } : item)
                    }
                  } : node
                )
              );
              return { id: textId, status: NODE_STATUS_SUCCESS, content };
            } catch (error) {
              if (isGenerationCanceled(error)) return null;
              const errorDetails = error instanceof Error ? error.message : t("canvas.projectPage.generationFailed");
              setNodes((prev) => prev.map((node) => node.id === rootId ? { ...node, metadata: { ...node.metadata, texts: node.metadata?.texts?.map((item) => item.id === textId ? { ...item, status: NODE_STATUS_ERROR, errorDetails } : item) } } : node));
              return { id: textId, status: NODE_STATUS_ERROR, content: "", errorDetails };
            }
          })
        );
        if (rootId !== nodeId) finishGenerationRequest(rootId, controller);
        if (controller.signal.aborted) return;
        const completedTexts = results.flatMap((item) => item?.status === NODE_STATUS_SUCCESS ? [item] : []);
        const failedTexts = results.filter((item) => item?.status === NODE_STATUS_ERROR);
        const firstText = completedTexts[0];
        if (completedTexts.length <= 1) setExpandedBatchNodeIds((current) => new Set([...current].filter((id) => id !== rootId)));
        if (failedTexts.length) message.error(firstText ? t("canvas.projectPage.partialTextFailed") : failedTexts[0]?.errorDetails || t("canvas.projectPage.generationFailed"));
        setNodes(
          (prev) => prev.map((node) => {
            if (node.id === rootId) {
              const primaryText = completedTexts.find((text) => text.id === node.metadata?.primaryTextId) || firstText;
              return {
                ...node,
                metadata: {
                  ...node.metadata,
                  content: primaryText?.content || "",
                  texts: completedTexts,
                  primaryTextId: primaryText?.id,
                  status: primaryText ? NODE_STATUS_SUCCESS : NODE_STATUS_ERROR,
                  errorDetails: primaryText ? void 0 : t("canvas.projectPage.generationFailed")
                }
              };
            }
            return node.id === nodeId && isConfigNode ? { ...node, metadata: { ...node.metadata, status: firstText ? NODE_STATUS_SUCCESS : NODE_STATUS_ERROR, errorDetails: firstText ? void 0 : t("canvas.projectPage.generationFailed") } } : node;
          })
        );
      } catch (error) {
        if (isGenerationCanceled(error)) return;
        const errorDetails = error instanceof Error ? error.message : t("canvas.projectPage.generationFailed");
        message.error(errorDetails);
        setNodes(
          (prev) => prev.map((node) => node.id === nodeId || pendingChildIds.includes(node.id) ? node.id === nodeId && !markSourceStatus ? node : { ...node, metadata: { ...node.metadata, status: NODE_STATUS_ERROR, errorDetails } } : node)
        );
      } finally {
        finishGenerationRequest(nodeId, runController);
        setRunningNodeId(null);
      }
    },
    [effectiveConfig, finishGenerationRequest, isAiConfigReady, message, openConfigDialog, startGenerationRequest, t]
  );
  useEffect(() => {
    generateNodeRef.current = handleGenerateNode;
  }, [handleGenerateNode]);
  const handleRetryNode = useCallback(
    async (node, imageId) => {
      const sourceNode = findRetrySourceNode(node.id, nodesRef.current, connectionsRef.current) || node;
      const savedImageMetadata = node.type === CanvasNodeType.Image ? node.metadata : void 0;
      const hasSavedImageMetadata = Boolean(savedImageMetadata?.generationType);
      const generationConfig = hasSavedImageMetadata && savedImageMetadata ? {
        ...effectiveConfig,
        model: savedImageMetadata.model || effectiveConfig.imageModel || effectiveConfig.model,
        quality: savedImageMetadata.quality || effectiveConfig.quality,
        size: savedImageMetadata.size || effectiveConfig.size,
        background: savedImageMetadata.background ?? effectiveConfig.background,
        count: "1"
      } : { ...buildGenerationConfig(effectiveConfig, sourceNode, node.type === CanvasNodeType.Text ? "text" : node.type === CanvasNodeType.Video ? "video" : node.type === CanvasNodeType.Audio ? "audio" : "image"), count: "1" };
      if (!isAiConfigReady(generationConfig, generationConfig.model)) {
        openConfigDialog(true);
        return;
      }
      const context = hasSavedImageMetadata ? null : await hydrateNodeGenerationContext(buildNodeGenerationContext(sourceNode.id, nodesRef.current, connectionsRef.current, sourceNode.metadata?.prompt || node.metadata?.prompt || ""));
      const prompt = (savedImageMetadata?.prompt || context?.prompt || "").trim();
      if (!prompt) {
        message.warning(t("canvas.projectPage.retryPromptMissing"));
        return;
      }
      const generationType = savedImageMetadata?.generationType;
      const useReferenceImages = generationType ? generationType === "edit" : Boolean(context?.referenceImages.length);
      const retryReferenceImages = hasSavedImageMetadata && savedImageMetadata ? await resolveMetadataReferences(savedImageMetadata) : useReferenceImages ? context?.referenceImages.length ? context.referenceImages : sourceNodeReferenceImages(sourceNode) : [];
      if (useReferenceImages && !retryReferenceImages) {
        message.error(t("canvas.projectPage.referenceMissing"));
        setNodes((prev) => prev.map((item) => item.id === node.id ? { ...item, metadata: { ...item.metadata, status: item.metadata?.content ? NODE_STATUS_SUCCESS : NODE_STATUS_ERROR, errorDetails: item.metadata?.content ? void 0 : t("canvas.projectPage.referenceMissing"), images: item.metadata?.images?.map((image) => image.id === imageId ? { ...image, status: NODE_STATUS_ERROR, errorDetails: t("canvas.projectPage.referenceMissing") } : image) } } : item));
        return;
      }
      const retryImages = retryReferenceImages || [];
      setRunningNodeId(node.id);
      setNodes((prev) => prev.map((item) => item.id === node.id ? { ...item, metadata: { ...item.metadata, status: NODE_STATUS_LOADING, errorDetails: void 0, images: item.metadata?.images?.map((image) => image.id === imageId ? { ...image, status: NODE_STATUS_LOADING, errorDetails: void 0 } : image) } } : item));
      const controller = startGenerationRequest(node.id, sourceNode.id, node.id);
      try {
        if (node.type === CanvasNodeType.Text) {
          if (!context) return;
          let streamed = "";
          const answer = await requestImageQuestion(
            generationConfig,
            buildNodeResponseMessages({ ...context, prompt }),
            (text) => {
              streamed = text;
              setNodes((prev) => prev.map((item) => item.id === node.id ? { ...item, type: CanvasNodeType.Text, metadata: { ...item.metadata, content: text, status: NODE_STATUS_LOADING } } : item));
            },
            { signal: controller.signal }
          );
          setNodes((prev) => prev.map((item) => item.id === node.id ? { ...item, type: CanvasNodeType.Text, metadata: { ...item.metadata, content: answer || streamed, prompt, status: NODE_STATUS_SUCCESS } } : item));
          return;
        }
        if (node.type === CanvasNodeType.Video) {
          const video = await storeGeneratedVideo(await requestVideoGeneration(generationConfig, prompt, retryImages, { signal: controller.signal }));
          const videoSize = fitNodeSize(video.width || node.width, video.height || node.height, VIDEO_NODE_MAX_WIDTH, VIDEO_NODE_MAX_HEIGHT);
          setNodes(
            (prev) => prev.map(
              (item) => item.id === node.id ? {
                ...item,
                width: videoSize.width,
                height: videoSize.height,
                position: { x: item.position.x + item.width / 2 - videoSize.width / 2, y: item.position.y + item.height / 2 - videoSize.height / 2 },
                metadata: {
                  ...item.metadata,
                  ...videoMetadata(video),
                  prompt,
                  model: generationConfig.model,
                  size: generationConfig.size,
                  seconds: generationConfig.videoSeconds,
                  vquality: generationConfig.vquality,
                  generateAudio: generationConfig.videoGenerateAudio,
                  watermark: generationConfig.videoWatermark
                }
              } : item
            )
          );
          return;
        }
        if (node.type === CanvasNodeType.Audio) {
          const audio = await storeGeneratedAudio(await requestAudioGeneration(generationConfig, prompt, { signal: controller.signal }), generationConfig.audioFormat);
          setNodes((prev) => prev.map((item) => item.id === node.id ? { ...item, metadata: { ...item.metadata, ...audioMetadata(audio), prompt, ...buildAudioGenerationMetadata(generationConfig) } } : item));
          return;
        }
        const image = useReferenceImages ? await requestEdit(generationConfig, prompt, retryImages, void 0, { signal: controller.signal }).then((items) => items[0]) : await requestGeneration(generationConfig, prompt, { signal: controller.signal }).then((items) => items[0]);
        const uploadedImage = await uploadImage(image.dataUrl, { signal: controller.signal });
        const imageConfig = NODE_DEFAULT_SIZE[CanvasNodeType.Image];
        const retryImage = {
          id: imageId || node.metadata?.primaryImageId || nanoid(),
          status: NODE_STATUS_SUCCESS,
          content: uploadedImage.url,
          storageKey: uploadedImage.storageKey,
          naturalWidth: uploadedImage.width,
          naturalHeight: uploadedImage.height,
          bytes: uploadedImage.bytes,
          mimeType: uploadedImage.mimeType
        };
        const generationMetadata = savedImageMetadata?.generationType ? {
          generationType: savedImageMetadata.generationType,
          model: generationConfig.model,
          size: generationConfig.size,
          quality: generationConfig.quality,
          ...generationConfig.background ? { background: generationConfig.background } : {},
          count: savedImageMetadata.count || 1,
          references: savedImageMetadata.references
        } : buildImageGenerationMetadata(useReferenceImages ? "edit" : "generation", generationConfig, 1, retryImages);
        setNodes(
          (prev) => prev.map((item) => {
            if (item.id !== node.id) return item;
            const makePrimary = !imageId || !item.metadata?.content;
            const edge = imageId ? Math.max(item.width, item.height) : 0;
            const imageSize = imageId && item.metadata?.freeResize ? { width: item.width, height: item.height } : imageId ? fitNodeSize(uploadedImage.width, uploadedImage.height, edge, edge) : fitNodeSize(uploadedImage.width, uploadedImage.height, imageConfig.width, imageConfig.height);
            return {
              ...item,
              type: CanvasNodeType.Image,
              ...makePrimary ? { width: imageSize.width, height: imageSize.height, ...imageId ? { position: { x: item.position.x + item.width / 2 - imageSize.width / 2, y: item.position.y + item.height / 2 - imageSize.height / 2 } } : {} } : {},
              metadata: {
                ...item.metadata,
                ...makePrimary ? imageMetadata(uploadedImage) : { status: NODE_STATUS_SUCCESS },
                images: item.metadata?.images?.map((current) => current.id === retryImage.id ? retryImage : current),
                primaryImageId: makePrimary ? retryImage.id : item.metadata?.primaryImageId,
                prompt,
                ...generationMetadata
              }
            };
          })
        );
      } catch (error) {
        if (isGenerationCanceled(error)) return;
        const errorDetails = error instanceof Error ? error.message : t("canvas.projectPage.generationFailed");
        message.error(errorDetails);
        setNodes((prev) => prev.map((item) => item.id === node.id ? { ...item, metadata: { ...item.metadata, status: item.metadata?.content ? NODE_STATUS_SUCCESS : NODE_STATUS_ERROR, errorDetails: item.metadata?.content ? void 0 : errorDetails, images: item.metadata?.images?.map((image) => image.id === imageId ? { ...image, status: NODE_STATUS_ERROR, errorDetails } : image) } } : item));
      } finally {
        finishGenerationRequest(node.id, controller);
        setRunningNodeId(null);
      }
    },
    [effectiveConfig, finishGenerationRequest, isAiConfigReady, message, openConfigDialog, startGenerationRequest, t]
  );
  const deleteBatchImage = useCallback((nodeId, imageId) => {
    const node = nodesRef.current.find((item) => item.id === nodeId);
    if ((node?.metadata?.images?.length || 0) <= 2) setExpandedBatchNodeIds((current) => new Set([...current].filter((id) => id !== nodeId)));
    setNodes(
      (prev) => prev.map((item) => {
        if (item.id !== nodeId) return item;
        const images = item.metadata?.images?.filter((image) => image.id !== imageId) || [];
        return { ...item, metadata: { ...item.metadata, images, count: images.length, primaryImageId: item.metadata?.primaryImageId === imageId ? images[0]?.id : item.metadata?.primaryImageId } };
      })
    );
  }, []);
  const retryBatchImage = useCallback((node, imageId) => void handleRetryNode(node, imageId), [handleRetryNode]);
  const generateImageFromTextNode = useCallback(
    (node) => {
      const prompt = (node.metadata?.content || node.metadata?.prompt || "").trim();
      if (!prompt) {
        message.warning(t("canvas.projectPage.emptyTextImage"));
        return;
      }
      const sourceNode = nodesRef.current.find((item) => item.id === node.id);
      if (!sourceNode) return;
      const nodeSize = getNodeSpec(CanvasNodeType.Config);
      const configNode = createCanvasNode(
        CanvasNodeType.Config,
        {
          x: sourceNode.position.x + sourceNode.width + 96 + nodeSize.width / 2,
          y: sourceNode.position.y + sourceNode.height / 2
        },
        {
          prompt: "",
          model: effectiveConfig.imageModel || effectiveConfig.model,
          size: effectiveConfig.size,
          count: getGenerationCount(effectiveConfig.canvasImageCount || effectiveConfig.count)
        }
      );
      const connection = { id: nanoid(), fromNodeId: sourceNode.id, toNodeId: configNode.id };
      const nextNodes = nodesRef.current.map((item) => item.id === sourceNode.id ? { ...item, metadata: { ...item.metadata, content: prompt, prompt, status: NODE_STATUS_SUCCESS } } : item).concat(configNode);
      const nextConnections = [...connectionsRef.current, connection];
      nodesRef.current = nextNodes;
      connectionsRef.current = nextConnections;
      setNodes(nextNodes);
      setConnections(nextConnections);
      setSelectedNodeIds(/* @__PURE__ */ new Set([configNode.id]));
      setSelectedConnectionId(null);
      setDialogNodeId(configNode.id);
    },
    [effectiveConfig.canvasImageCount, effectiveConfig.count, effectiveConfig.imageModel, effectiveConfig.model, effectiveConfig.size, message, t]
  );
  const insertAssistantImage = useCallback(
    async (image) => {
      const storedImage = image.storageKey ? { url: image.dataUrl, storageKey: image.storageKey, width: 1, height: 1, bytes: 0, mimeType: "image/png" } : await uploadImage(image.dataUrl);
      const meta = storedImage.width === 1 && storedImage.height === 1 ? await readImageMeta(storedImage.url) : storedImage;
      const config2 = fitNodeSize(meta.width, meta.height);
      const center = screenToCanvas((containerRef.current?.getBoundingClientRect().left || 0) + size.width / 2, (containerRef.current?.getBoundingClientRect().top || 0) + size.height / 2);
      const id = `image-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const node = {
        id,
        type: CanvasNodeType.Image,
        title: image.prompt.slice(0, 32) || "Generated Image",
        position: { x: center.x - config2.width / 2, y: center.y - config2.height / 2 },
        width: config2.width,
        height: config2.height,
        metadata: { ...imageMetadata({ ...storedImage, width: meta.width, height: meta.height }), prompt: image.prompt }
      };
      setNodes((prev) => [...prev, node]);
      setSelectedNodeIds(/* @__PURE__ */ new Set([id]));
      setSelectedConnectionId(null);
      setDialogNodeId(id);
    },
    [screenToCanvas, size.height, size.width]
  );
  const insertAssistantText = useCallback(
    (text, title) => {
      const center = screenToCanvas((containerRef.current?.getBoundingClientRect().left || 0) + size.width / 2, (containerRef.current?.getBoundingClientRect().top || 0) + size.height / 2);
      const node = {
        ...createCanvasNode(CanvasNodeType.Text, center, { content: text, status: NODE_STATUS_SUCCESS }),
        title: title || text.slice(0, 32) || "Assistant Text"
      };
      setNodes((prev) => [...prev, node]);
      setSelectedNodeIds(/* @__PURE__ */ new Set([node.id]));
      setSelectedConnectionId(null);
    },
    [screenToCanvas, size.height, size.width]
  );
  const handleAssetInsert = useCallback(
    (payload) => {
      if (payload.kind === "text") {
        insertAssistantText(payload.content, payload.title);
      } else if (payload.kind === "video") {
        const spec = NODE_DEFAULT_SIZE[CanvasNodeType.Video];
        const center = screenToCanvas((containerRef.current?.getBoundingClientRect().left || 0) + size.width / 2, (containerRef.current?.getBoundingClientRect().top || 0) + size.height / 2);
        const id = `video-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const nextSize = fitNodeSize(payload.width || spec.width, payload.height || spec.height, VIDEO_NODE_MAX_WIDTH, VIDEO_NODE_MAX_HEIGHT);
        setNodes(
          (prev) => [
            ...prev,
            {
              id,
              type: CanvasNodeType.Video,
              title: payload.title,
              position: { x: center.x - nextSize.width / 2, y: center.y - nextSize.height / 2 },
              width: nextSize.width,
              height: nextSize.height,
              metadata: { content: payload.url, storageKey: payload.storageKey, status: NODE_STATUS_SUCCESS, naturalWidth: payload.width, naturalHeight: payload.height }
            }
          ]
        );
        setSelectedNodeIds(/* @__PURE__ */ new Set([id]));
      } else {
        insertAssistantImage({ id: `asset-${Date.now()}`, prompt: payload.title, dataUrl: payload.dataUrl, storageKey: payload.storageKey });
      }
      setAssetPickerOpen(false);
    },
    [insertAssistantImage, insertAssistantText, screenToCanvas, size.height, size.width]
  );
  const handleNodeHoverStart = useCallback((nodeId) => {
    if (nodeDraggingRef.current) return;
    setHoveredNodeId(nodeId);
  }, []);
  const handleNodeHoverEnd = useCallback((nodeId) => {
    setHoveredNodeId((current) => current === nodeId ? null : current);
  }, []);
  const handleNodeViewImage = useCallback((node, imageId) => {
    setPreviewNodeId(node.id);
    setPreviewImageId(imageId || null);
  }, []);
  const handleNodeRetry = useCallback(
    (node) => {
      if (node.type === CanvasNodeType.Text && (node.metadata?.textCount || 1) > 1) {
        void generateNodeRef.current?.(node.id, "text", node.metadata?.prompt || "");
        return;
      }
      void handleRetryNode(node);
    },
    [handleRetryNode]
  );
  const handleNodeContextMenu = useCallback((event, nodeId) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ type: "node", x: event.clientX, y: event.clientY, nodeId });
  }, []);
  const renderNodePanel = useCallback(
    (panelNode) => getNodeDefinition(panelNode.type)?.Panel ? renderPluginPanel(panelNode) : panelNode.type === CanvasNodeType.Config ? /* @__PURE__ */ jsxDEV(
      CanvasConfigComposer,
      {
        nodeId: panelNode.id,
        nodes,
        value: panelNode.metadata?.composerContent ?? panelNode.metadata?.prompt ?? "",
        inputs: configInputsById.get(panelNode.id) || [],
        connectedNodes: connectedNodesByNodeId.get(panelNode.id) || [],
        onChange: (composerContent) => handleConfigNodeChange(panelNode.id, { composerContent }),
        onClose: () => setDialogNodeId(null),
        onDisconnectReference: disconnectNodeReference,
        onStartReferenceSelection: startNodeReferenceSelection
      },
      void 0,
      false,
      {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
        lineNumber: 2860,
        columnNumber: 5
      },
      this
    ) : /* @__PURE__ */ jsxDEV(
      CanvasNodePromptPanel,
      {
        node: panelNode,
        nodes,
        isRunning: runningNodeId === panelNode.id,
        mentionReferences: mentionReferencesByNodeId.get(panelNode.id) || EMPTY_REFERENCES,
        connectedNodes: connectedNodesByNodeId.get(panelNode.id) || [],
        onPromptChange: handleNodePromptChange,
        onConfigChange: handleConfigNodeChange,
        onGenerate: handleGenerateNode,
        onStop: confirmStopGeneration,
        onDisconnectReference: disconnectNodeReference,
        onStartReferenceSelection: startNodeReferenceSelection,
        modeOverride: getNodeDefinition(panelNode.type)?.useBuiltinPanel?.mode,
        onImageSettingsOpenChange: (open) => {
          setNodeImageSettingsOpen(open);
          if (open) setToolbarNodeId(null);
        }
      },
      void 0,
      false,
      {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
        lineNumber: 2872,
        columnNumber: 5
      },
      this
    ),
    [configInputsById, confirmStopGeneration, connectedNodesByNodeId, disconnectNodeReference, handleConfigNodeChange, handleGenerateNode, handleNodePromptChange, mentionReferencesByNodeId, nodes, renderPluginPanel, runningNodeId, startNodeReferenceSelection]
  );
  const renderNodeContentPanel = useCallback(
    (contentNode) => /* @__PURE__ */ jsxDEV(
      CanvasConfigNodePanel,
      {
        node: contentNode,
        isRunning: runningNodeId === contentNode.id,
        inputSummary: getInputSummary(configInputsById.get(contentNode.id) || []),
        onConfigChange: handleConfigNodeChange,
        onComposerToggle: () => setDialogNodeId((current) => current === contentNode.id ? null : contentNode.id),
        onStop: confirmStopGeneration,
        onGenerate: (nodeId) => {
          const target = nodesRef.current.find((item) => item.id === nodeId);
          void handleGenerateNode(nodeId, target?.metadata?.generationMode || "image", target?.metadata?.composerContent ?? target?.metadata?.prompt ?? "");
        }
      },
      void 0,
      false,
      {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
        lineNumber: 2896,
        columnNumber: 5
      },
      this
    ),
    [configInputsById, confirmStopGeneration, handleConfigNodeChange, handleGenerateNode, runningNodeId]
  );
  if (!projectLoaded) return /* @__PURE__ */ jsxDEV(CanvasRefreshShell, {}, void 0, false, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
    lineNumber: 2912,
    columnNumber: 30
  }, this);
  return /* @__PURE__ */ jsxDEV("main", { className: "flex h-full min-h-0 overflow-hidden", style: { background: theme.canvas.background, color: theme.node.text }, children: [
    /* @__PURE__ */ jsxDEV(CanvasSidePanel, { nodes, selectedNodeIds, onFocusNode: focusNode, onPreviewNode: setPreviewNodeId, onInsertAsset: handleAssetInsert }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
      lineNumber: 2916,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "relative min-w-0 flex-1 overflow-hidden", children: [
      /* @__PURE__ */ jsxDEV(
        CanvasTopBar,
        {
          title: currentProject?.title || t("canvas.projectPage.untitledCanvas"),
          titleDraft,
          isTitleEditing: titleEditing,
          onTitleDraftChange: setTitleDraft,
          onStartTitleEditing: startTitleEditing,
          onFinishTitleEditing: finishTitleEditing,
          onCancelTitleEditing: () => setTitleEditing(false),
          canUndo: historyState.canUndo,
          canRedo: historyState.canRedo,
          onHome: () => navigate("/"),
          onProjects: () => navigate("/canvas"),
          onCreateProject: createAndOpenProject,
          onDeleteProject: deleteCurrentProject,
          onExportProject: exportCurrentProject,
          onImportImage: () => handleUploadRequest(),
          onOpenPlugins: () => setPluginManagerOpen(true),
          onUndo: undoCanvas,
          onRedo: redoCanvas,
          agentOpen: agentPanelOpen,
          compactAgentStatus: { connected: localAgentConnected, enabled: localAgentEnabled, activity: localAgentActivity },
          onToggleAgent: toggleAgentPanel
        },
        void 0,
        false,
        {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
          lineNumber: 2918,
          columnNumber: 17
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        InfiniteCanvas,
        {
          containerRef,
          viewport,
          tool: canvasTool,
          backgroundMode,
          onViewportChange: (next) => {
            setViewport(next);
            setContextMenu(null);
          },
          onCanvasMouseDown: (event) => {
            if (!referencePickerNodeId) handleCanvasMouseDown(event);
          },
          onCanvasDeselect: referencePickerNodeId ? void 0 : deselectCanvas,
          onCanvasDoubleClick: (event) => {
            if (referencePickerNodeId) return;
            setContextMenu(null);
            setNodeCreatePosition(screenToCanvas(event.clientX, event.clientY));
          },
          onContextMenu: preventCanvasContextMenu,
          onDrop: handleDrop,
          children: [
            /* @__PURE__ */ jsxDEV("svg", { className: "absolute left-0 top-0 h-[10000px] w-[10000px] overflow-visible", style: { pointerEvents: "none", transform: "translateZ(0)", zIndex: 0 }, children: [
              connections.map((connection) => {
                const from = nodeById.get(connection.fromNodeId);
                const to = nodeById.get(connection.toNodeId);
                if (!from || !to) return null;
                return /* @__PURE__ */ jsxDEV(
                  ConnectionPath,
                  {
                    connection,
                    from,
                    to,
                    active: selectedConnectionId === connection.id || relatedHighlight.connectionIds.has(connection.id),
                    onSelect: () => {
                      setSelectedConnectionId(connection.id);
                      setSelectedNodeIds(/* @__PURE__ */ new Set());
                      setContextMenu(null);
                    },
                    onContextMenu: (event) => {
                      setSelectedConnectionId(connection.id);
                      setSelectedNodeIds(/* @__PURE__ */ new Set());
                      setContextMenu({ type: "connection", x: event.clientX, y: event.clientY, connectionId: connection.id });
                    }
                  },
                  connection.id,
                  false,
                  {
                    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
                    lineNumber: 2971,
                    columnNumber: 17
                  },
                  this
                );
              }),
              connectingParams ? /* @__PURE__ */ jsxDEV(ActiveConnectionPath, { node: nodeById.get(connectingParams.nodeId), handle: connectingParams, mouseWorld, target: connectionTargetNodeId ? nodeById.get(connectionTargetNodeId) : void 0 }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
                lineNumber: 2990,
                columnNumber: 45
              }, this) : null
            ] }, void 0, true, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
              lineNumber: 2963,
              columnNumber: 21
            }, this),
            visibleNodes.map(
              (node) => /* @__PURE__ */ jsxDEV(
                CanvasNode,
                {
                  data: node,
                  scale: viewport.k,
                  isSelected: selectedNodeIds.has(node.id),
                  isRelated: relatedHighlight.nodeIds.has(node.id),
                  isFocusRelated: activeNodeId === node.id,
                  isConnectionTarget: connectionTargetNodeId === node.id,
                  isConnecting: Boolean(connectingParams),
                  referenceSelectionState: !referencePickerNodeId ? void 0 : node.id === referencePickerNodeId ? "target" : referenceConnectedNodeIds.has(node.id) || !isCanvasReferenceNode(node, nodes) ? "disabled" : "available",
                  showPanel: !isNodeResizing && dialogNodeId === node.id && !selectionBox && !getNodeDefinition(node.type)?.hidePanel,
                  groupChildCount: groupChildCountById.get(node.id) || 0,
                  isGroupDropTarget: dropTargetGroupId === node.id,
                  batchExpanded: expandedBatchNodeIds.has(node.id),
                  showImageInfo,
                  mentionReferences: mentionReferencesByNodeId.get(node.id) || EMPTY_REFERENCES,
                  pluginHost,
                  registryVersion: nodeRegistryVersion,
                  renderPanel: renderNodePanel,
                  renderNodeContent: renderNodeContentPanel,
                  onMouseDown: handleNodeMouseDown,
                  onSelectCapture: handleNodeSelectCapture,
                  onHoverStart: handleNodeHoverStart,
                  onHoverEnd: handleNodeHoverEnd,
                  onConnectStart: handleConnectStart,
                  onResizeStart: handleNodeResizeStart,
                  onResize: handleNodeResize,
                  onResizeEnd: handleNodeResizeEnd,
                  onContentChange: handleNodeContentChange,
                  onTitleChange: handleNodeTitleChange,
                  onToggleBatch: toggleBatchExpanded,
                  onSetBatchPrimary: setBatchPrimary,
                  onDuplicateBatchImage: duplicateBatchImage,
                  onDownloadBatchImage: downloadBatchImage,
                  onRetryBatchImage: retryBatchImage,
                  onDeleteBatchImage: deleteBatchImage,
                  onRetry: handleNodeRetry,
                  onViewImage: handleNodeViewImage,
                  onSelectReference: selectNodeReference,
                  onContextMenu: handleNodeContextMenu
                },
                node.id,
                false,
                {
                  fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
                  lineNumber: 2994,
                  columnNumber: 11
                },
                this
              )
            ),
            referencePickerNodeId ? /* @__PURE__ */ jsxDEV("button", { type: "button", className: "absolute left-1/2 top-4 z-[90] -translate-x-1/2 rounded-full border px-4 py-2 text-sm font-medium shadow-lg backdrop-blur", style: { background: theme.toolbar.panel, borderColor: theme.toolbar.border }, onClick: exitNodeReferenceSelection, children: t("canvas.references.selectingHint") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
              lineNumber: 3037,
              columnNumber: 46
            }, this) : null,
            selectionBox ? /* @__PURE__ */ jsxDEV(
              "svg",
              {
                className: "pointer-events-none absolute z-[100] overflow-visible",
                style: {
                  left: Math.min(selectionBox.startWorldX, selectionBox.currentWorldX),
                  top: Math.min(selectionBox.startWorldY, selectionBox.currentWorldY),
                  width: Math.abs(selectionBox.currentWorldX - selectionBox.startWorldX),
                  height: Math.abs(selectionBox.currentWorldY - selectionBox.startWorldY)
                },
                children: /* @__PURE__ */ jsxDEV("rect", { width: "100%", height: "100%", fill: theme.canvas.selectionFill, stroke: theme.canvas.selectionStroke, strokeOpacity: 0.55, strokeWidth: 1 / viewport.k, strokeDasharray: `${6 / viewport.k} ${4 / viewport.k}` }, void 0, false, {
                  fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
                  lineNumber: 3049,
                  columnNumber: 29
                }, this)
              },
              void 0,
              false,
              {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
                lineNumber: 3040,
                columnNumber: 11
              },
              this
            ) : null,
            pendingConnectionCreate ? /* @__PURE__ */ jsxDEV(ConnectionCreateMenu, { pending: pendingConnectionCreate, onCreate: (type) => createConnectedNode(type, pendingConnectionCreate), onClose: cancelPendingConnectionCreate }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
              lineNumber: 3052,
              columnNumber: 48
            }, this) : null,
            nodeCreatePosition ? /* @__PURE__ */ jsxDEV(
              NodeCreateMenu,
              {
                position: nodeCreatePosition,
                onCreate: (type) => {
                  createNode(type, nodeCreatePosition);
                  setNodeCreatePosition(null);
                },
                onClose: () => setNodeCreatePosition(null)
              },
              void 0,
              false,
              {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
                lineNumber: 3054,
                columnNumber: 11
              },
              this
            ) : null
          ]
        },
        void 0,
        true,
        {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
          lineNumber: 2942,
          columnNumber: 17
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        CanvasNodeHoverToolbar,
        {
          node: isNodeDragging || isNodeResizing || nodeImageSettingsOpen || expandedBatchNodeIds.has(toolbarNode?.id || "") ? null : toolbarNode,
          viewport,
          extraTools: toolbarNode ? buildNodeToolbarItems(toolbarNode) : void 0,
          onKeep: keepNodeToolbar,
          onLeave: hideNodeToolbar,
          onInfo: (node) => setInfoNodeId(node.id),
          onDecreaseFont: (node) => handleFontSizeChange(node.id, Math.max(10, (node.metadata?.fontSize || 14) - 2)),
          onIncreaseFont: (node) => handleFontSizeChange(node.id, Math.min(32, (node.metadata?.fontSize || 14) + 2)),
          onToggleDialog: (node) => setDialogNodeId((current) => current === node.id ? null : node.id),
          onGenerateImage: generateImageFromTextNode,
          onUpload: (node) => handleUploadRequest(node.id),
          onDownload: downloadNodeImage,
          onSaveAsset: (node) => void saveNodeAsset(node),
          onMaskEdit: (node) => setMaskEditNodeId(node.id),
          onCrop: (node) => setCropNodeId(node.id),
          onSplit: (node) => setSplitNodeId(node.id),
          onUpscale: (node) => setUpscaleNodeId(node.id),
          onSuperResolve: (node) => setSuperResolveNodeId(node.id),
          onAngle: (node) => setAngleNodeId(node.id),
          onViewImage: handleNodeViewImage,
          onReversePrompt: createImageReversePromptNodes,
          onRetry: (node) => void handleRetryNode(node),
          onToggleFreeResize: (node) => toggleNodeFreeResize(node.id),
          onDelete: (node) => deleteNodes(/* @__PURE__ */ new Set([node.id]))
        },
        void 0,
        false,
        {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
          lineNumber: 3065,
          columnNumber: 17
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        CanvasToolbar,
        {
          selectedCount: selectedNodeIds.size,
          canvasTool,
          canUndo: historyState.canUndo,
          canRedo: historyState.canRedo,
          backgroundMode,
          showImageInfo,
          onAddImage: () => createNode(CanvasNodeType.Image),
          onAddVideo: () => createNode(CanvasNodeType.Video),
          onAddAudio: () => createNode(CanvasNodeType.Audio),
          onAddText: () => createNode(CanvasNodeType.Text),
          onAddConfig: () => createNode(CanvasNodeType.Config),
          onAddGroup: () => createNode(CanvasNodeType.Group),
          onAddExtensionNode: (type) => createNode(type),
          onUndo: undoCanvas,
          onRedo: redoCanvas,
          onUpload: () => handleUploadRequest(),
          onDelete: () => deleteNodes(new Set(selectedNodeIds)),
          onClear: () => setClearConfirmOpen(true),
          onCanvasToolChange: setCanvasTool,
          onBackgroundModeChange: setBackgroundMode,
          onShowImageInfoChange: setShowImageInfo
        },
        void 0,
        false,
        {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
          lineNumber: 3092,
          columnNumber: 17
        },
        this
      ),
      isMiniMapOpen ? /* @__PURE__ */ jsxDEV(Minimap, { nodes, viewport, viewportSize: size, onViewportChange: setViewport }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
        lineNumber: 3116,
        columnNumber: 34
      }, this) : null,
      /* @__PURE__ */ jsxDEV(CanvasZoomControls, { scale: viewport.k, onScaleChange: setZoomScale, onReset: resetViewport, isMiniMapOpen, onToggleMiniMap: () => setIsMiniMapOpen((value) => !value) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
        lineNumber: 3118,
        columnNumber: 17
      }, this),
      contextMenu ? /* @__PURE__ */ jsxDEV(
        CanvasNodeContextMenu,
        {
          menu: contextMenu,
          canCaptureVideoFrame: contextMenuNode?.type === CanvasNodeType.Video && Boolean(contextMenuNode.metadata?.content),
          onClose: () => setContextMenu(null),
          onCaptureVideoFrame: (position) => {
            if (contextMenu.type !== "node") return;
            void captureVideoNodeFrame(contextMenu.nodeId, position);
          },
          onDuplicate: () => {
            if (contextMenu.type !== "node") return;
            duplicateNode(contextMenu.nodeId);
            setContextMenu(null);
          },
          onDelete: () => {
            if (contextMenu.type === "node") {
              deleteNodes(/* @__PURE__ */ new Set([contextMenu.nodeId]));
            } else {
              deleteConnection(contextMenu.connectionId);
            }
            setContextMenu(null);
          }
        },
        void 0,
        false,
        {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
          lineNumber: 3121,
          columnNumber: 9
        },
        this
      ) : null,
      /* @__PURE__ */ jsxDEV("input", { ref: imageInputRef, type: "file", multiple: true, accept: "image/*,video/*,audio/mpeg,audio/wav,audio/x-wav,.mp3,.wav", className: "hidden", onChange: handleImageInputChange }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
        lineNumber: 3145,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(CanvasNodeInfoModal, { node: infoNode, open: Boolean(infoNode), onClose: () => setInfoNodeId(null) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
        lineNumber: 3147,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(CanvasPluginManagerModal, { open: pluginManagerOpen, onClose: () => setPluginManagerOpen(false) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
        lineNumber: 3148,
        columnNumber: 17
      }, this),
      cropNode?.metadata?.content ? /* @__PURE__ */ jsxDEV(CanvasNodeCropDialog, { dataUrl: cropNode.metadata.content, open: Boolean(cropNode), onClose: () => setCropNodeId(null), onConfirm: (crop) => void cropImageNode(cropNode, crop) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
        lineNumber: 3150,
        columnNumber: 48
      }, this) : null,
      maskEditNode?.metadata?.content ? /* @__PURE__ */ jsxDEV(CanvasNodeMaskEditDialog, { dataUrl: maskEditNode.metadata.content, open: Boolean(maskEditNode), onClose: () => setMaskEditNodeId(null), onConfirm: (payload) => void maskEditImageNode(maskEditNode, payload) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
        lineNumber: 3153,
        columnNumber: 9
      }, this) : null,
      splitNode?.metadata?.content ? /* @__PURE__ */ jsxDEV(CanvasNodeSplitDialog, { dataUrl: splitNode.metadata.content, open: Boolean(splitNode), onClose: () => setSplitNodeId(null), onConfirm: (params2) => void splitImageNode(splitNode, params2) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
        lineNumber: 3156,
        columnNumber: 49
      }, this) : null,
      upscaleNode?.metadata?.content ? /* @__PURE__ */ jsxDEV(CanvasNodeUpscaleDialog, { dataUrl: upscaleNode.metadata.content, open: Boolean(upscaleNode), onClose: () => setUpscaleNodeId(null), onConfirm: (params2) => void upscaleImageNode(upscaleNode, params2) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
        lineNumber: 3159,
        columnNumber: 9
      }, this) : null,
      /* @__PURE__ */ jsxDEV(Modal, { title: t("canvas.projectPage.superResolve"), open: Boolean(superResolveNode?.metadata?.content), centered: true, footer: null, onCancel: () => setSuperResolveNodeId(null), children: /* @__PURE__ */ jsxDEV("div", { className: "py-8 text-center text-base font-medium", children: t("canvas.projectPage.notImplemented") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
        lineNumber: 3163,
        columnNumber: 21
      }, this) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
        lineNumber: 3162,
        columnNumber: 17
      }, this),
      angleNode?.metadata?.content ? /* @__PURE__ */ jsxDEV(CanvasNodeAngleDialog, { dataUrl: angleNode.metadata.content, open: Boolean(angleNode), onClose: () => setAngleNodeId(null), onConfirm: (params2) => void generateAngleNode(angleNode, params2) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
        lineNumber: 3166,
        columnNumber: 49
      }, this) : null,
      /* @__PURE__ */ jsxDEV(
        Modal,
        {
          title: t("canvas.projectPage.imageDetails"),
          open: Boolean(previewContent),
          centered: true,
          onCancel: () => setPreviewNodeId(null),
          footer: null,
          width: "auto",
          styles: { body: { padding: 0, display: "flex", justifyContent: "center", alignItems: "center", maxHeight: "80vh" } },
          children: previewContent ? /* @__PURE__ */ jsxDEV("img", { src: previewContent, alt: previewNode?.title || t("assets.kinds.image"), style: { maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" } }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
            lineNumber: 3177,
            columnNumber: 39
          }, this) : null
        },
        void 0,
        false,
        {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
          lineNumber: 3168,
          columnNumber: 17
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        Modal,
        {
          title: t("canvas.projectPage.clearTitle"),
          open: clearConfirmOpen,
          centered: true,
          onCancel: () => setClearConfirmOpen(false),
          footer: /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV(Button, { onClick: () => setClearConfirmOpen(false), children: t("common.cancel") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
              lineNumber: 3187,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV(Button, { danger: true, type: "primary", onClick: clearCanvas, children: t("canvas.projectPage.clear") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
              lineNumber: 3188,
              columnNumber: 29
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
            lineNumber: 3186,
            columnNumber: 11
          }, this),
          children: /* @__PURE__ */ jsxDEV("p", { className: "text-sm opacity-60", children: t("canvas.projectPage.clearDescription") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
            lineNumber: 3194,
            columnNumber: 21
          }, this)
        },
        void 0,
        false,
        {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
          lineNumber: 3180,
          columnNumber: 17
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(AssetPickerModal, { open: assetPickerOpen, onInsert: handleAssetInsert, onClose: () => setAssetPickerOpen(false) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
        lineNumber: 3197,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
      lineNumber: 2917,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx",
    lineNumber: 2915,
    columnNumber: 5
  }, this);
}
_s2(InfiniteCanvasPage, "ms2xh69QBVF3HbN/UtEfBCEqTzI=", false, function() {
  return [App.useApp, useTranslation, useNodeRegistryVersion, useParams, useNavigate, useSearchParams, useAgentStore, useAgentStore, useAgentStore, useAgentStore, useAgentStore, useAgentStore, useAgentStore, useConfigStore, useEffectiveConfig, useConfigStore, useConfigStore, useAssetStore, useAssetStore, useCanvasStore, useCanvasStore, useCanvasStore, useCanvasStore, useCanvasStore, useCanvasStore, useCanvasStore, useThemeStore, useAgentBridge, usePluginHost];
});
_c2 = InfiniteCanvasPage;
var _c, _c2;
$RefreshReg$(_c, "CanvasPage");
$RefreshReg$(_c2, "InfiniteCanvasPage");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/canvas/project.tsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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U0Msb0JBQ0FELGdCQUNDQSxnQkFDUlEsZUFDVUEsZUFDVnNDLGdCQUNLQSxnQkFDRkEsZ0JBQ0VBLGdCQUNBQSxnQkFDQ0EsZ0JBQ0FBLGdCQUNJckMsZUFnZERzQyxnQkFvQnVDQyxhQUFhO0FBQUE7QUFBQSxNQTVoQnpFeUQ7QUFBa0IsSUFBQW10QixJQUFBQztBQUFBLGFBQUFELElBQUE7QUFBQSxhQUFBQyxLQUFBIiwibmFtZXMiOlsidXNlQ2FsbGJhY2siLCJ1c2VFZmZlY3QiLCJ1c2VMYXlvdXRFZmZlY3QiLCJ1c2VNZW1vIiwidXNlUmVmIiwidXNlU3RhdGUiLCJ1c2VOYXZpZ2F0ZSIsInVzZVBhcmFtcyIsInVzZVNlYXJjaFBhcmFtcyIsInNhdmVBcyIsInVzZVRyYW5zbGF0aW9uIiwicmVxdWVzdEVkaXQiLCJyZXF1ZXN0R2VuZXJhdGlvbiIsInJlcXVlc3RJbWFnZVF1ZXN0aW9uIiwicmVxdWVzdEF1ZGlvR2VuZXJhdGlvbiIsInN0b3JlR2VuZXJhdGVkQXVkaW8iLCJyZXF1ZXN0VmlkZW9HZW5lcmF0aW9uIiwic3RvcmVHZW5lcmF0ZWRWaWRlbyIsImRlZmF1bHRDb25maWciLCJ1c2VDb25maWdTdG9yZSIsInVzZUVmZmVjdGl2ZUNvbmZpZyIsInVwbG9hZEltYWdlIiwidXBsb2FkTWVkaWFGaWxlIiwibmFub2lkIiwiZ2V0RGF0YVVybEJ5dGVTaXplIiwicmVhZEltYWdlTWV0YSIsImNhbnZhc1RoZW1lcyIsInVzZUFzc2V0U3RvcmUiLCJ1c2VUaGVtZVN0b3JlIiwiY3JvcERhdGFVcmwiLCJzcGxpdERhdGFVcmwiLCJ1cHNjYWxlRGF0YVVybCIsImZpdE5vZGVTaXplIiwibm9kZVNpemVGcm9tUmF0aW8iLCJjYXB0dXJlVmlkZW9GcmFtZSIsIkFwcCIsIkJ1dHRvbiIsIk1vZGFsIiwiTk9ERV9ERUZBVUxUX1NJWkUiLCJnZXROb2RlU3BlYyIsIkFjdGl2ZUNvbm5lY3Rpb25QYXRoIiwiQ29ubmVjdGlvblBhdGgiLCJDYW52YXNDb25maWdDb21wb3NlciIsIkNhbnZhc0NvbmZpZ05vZGVQYW5lbCIsIkNhbnZhc05vZGVDb250ZXh0TWVudSIsIkNhbnZhc05vZGVBbmdsZURpYWxvZyIsIkNhbnZhc05vZGVDcm9wRGlhbG9nIiwiQ2FudmFzTm9kZU1hc2tFZGl0RGlhbG9nIiwiQ2FudmFzTm9kZVNwbGl0RGlhbG9nIiwiQ2FudmFzTm9kZVVwc2NhbGVEaWFsb2ciLCJidWlsZE5vZGVHZW5lcmF0aW9uQ29udGV4dCIsImJ1aWxkTm9kZUdlbmVyYXRpb25JbnB1dHMiLCJidWlsZE5vZGVSZXNwb25zZU1lc3NhZ2VzIiwiaHlkcmF0ZU5vZGVHZW5lcmF0aW9uQ29udGV4dCIsIkNhbnZhc05vZGVIb3ZlclRvb2xiYXIiLCJDYW52YXNOb2RlSW5mb01vZGFsIiwiSW5maW5pdGVDYW52YXMiLCJNaW5pbWFwIiwiQ2FudmFzTm9kZSIsIkNhbnZhc05vZGVQcm9tcHRQYW5lbCIsIkNhbnZhc1Rvb2xiYXIiLCJBc3NldFBpY2tlck1vZGFsIiwiQ2FudmFzU2lkZVBhbmVsIiwiQ2FudmFzWm9vbUNvbnRyb2xzIiwidXNlQWdlbnRTdG9yZSIsInVzZUNhbnZhc1N0b3JlIiwidXNlQWdlbnRCcmlkZ2UiLCJ1c2VQbHVnaW5Ib3N0IiwiYnVpbGROb2RlTWVudGlvblJlZmVyZW5jZXMiLCJnZXRHcm91cFJlc291cmNlTm9kZXMiLCJpc0NhbnZhc1JlZmVyZW5jZU5vZGUiLCJleHBvcnRDYW52YXNQcm9qZWN0cyIsImFwcGx5Tm9kZUNvbmZpZ1BhdGNoIiwiYXVkaW9NZXRhZGF0YSIsImJ1aWxkQXVkaW9HZW5lcmF0aW9uTWV0YWRhdGEiLCJidWlsZEltYWdlR2VuZXJhdGlvbk1ldGFkYXRhIiwiY3JlYXRlQ2FudmFzTm9kZSIsImltYWdlTWV0YWRhdGEiLCJ2aWRlb01ldGFkYXRhIiwiZmluZENvbnRhaW5pbmdHcm91cElkIiwiZmluZEdyb3VwRHJvcFRhcmdldCIsImdldENvbm5lY3Rpb25UYXJnZXRBbmNob3IiLCJub3JtYWxpemVDb25uZWN0aW9uIiwic25hcE5vZGVzSW50b0dyb3VwIiwiYXVkaW9FeHRlbnNpb24iLCJidWlsZEFuZ2xlTGFiZWwiLCJidWlsZEFuZ2xlUHJvbXB0IiwiYnVpbGRHZW5lcmF0aW9uQ29uZmlnIiwiZmluZFJldHJ5U291cmNlTm9kZSIsImdlbmVyYXRpb25SZWZlcmVuY2VVcmxzIiwiZ2V0R2VuZXJhdGlvbkNvdW50IiwiZ2V0SW5wdXRTdW1tYXJ5IiwiaHlkcmF0ZUFzc2lzdGFudEltYWdlcyIsImh5ZHJhdGVDYW52YXNJbWFnZXMiLCJpbWFnZUV4dGVuc2lvbiIsImlzQXVkaW9GaWxlIiwiaXNHZW5lcmF0aW9uQ2FuY2VsZWQiLCJyZXNldEludGVycnVwdGVkR2VuZXJhdGlvbiIsInJlc29sdmVNZXRhZGF0YVJlZmVyZW5jZXMiLCJzb3VyY2VOb2RlUmVmZXJlbmNlSW1hZ2VzIiwiZ2V0Tm9kZURlZmluaXRpb24iLCJpc0J1aWx0aW5Ob2RlVHlwZSIsImlzQnVpbHRpblR5cGUiLCJ1c2VOb2RlUmVnaXN0cnlWZXJzaW9uIiwicmVnaXN0ZXJCdWlsdGluTm9kZXMiLCJDYW52YXNQbHVnaW5NYW5hZ2VyTW9kYWwiLCJDYW52YXNSZWZyZXNoU2hlbGwiLCJDYW52YXNUb3BCYXIiLCJDb25uZWN0aW9uQ3JlYXRlTWVudSIsIk5vZGVDcmVhdGVNZW51IiwiQ2FudmFzTm9kZVR5cGUiLCJWSURFT19OT0RFX01BWF9XSURUSCIsIlZJREVPX05PREVfTUFYX0hFSUdIVCIsIkVNUFRZX1JFRkVSRU5DRVMiLCJDT05ORUNUSU9OX0hBTkRMRV9ISVRfUkFESVVTIiwiQ09OTkVDVElPTl9OT0RFX0hJVF9QQURESU5HIiwiTk9ERV9TVEFUVVNfSURMRSIsIk5PREVfU1RBVFVTX0xPQURJTkciLCJOT0RFX1NUQVRVU19TVUNDRVNTIiwiTk9ERV9TVEFUVVNfRVJST1IiLCJDYW52YXNQYWdlIiwiX3MiLCJtb3VudGVkIiwic2V0TW91bnRlZCIsIkluZmluaXRlQ2FudmFzUGFnZSIsIl9zMiIsIm1lc3NhZ2UiLCJtb2RhbCIsInVzZUFwcCIsInQiLCJub2RlUmVnaXN0cnlWZXJzaW9uIiwic3RhdGUiLCJ2ZXJzaW9uIiwicGFyYW1zIiwibmF2aWdhdGUiLCJzZWFyY2hQYXJhbXMiLCJwcm9qZWN0SWQiLCJpZCIsImxvY2FsQWdlbnRDb25uZWN0ZWQiLCJjb25uZWN0ZWQiLCJsb2NhbEFnZW50QWN0aXZpdHkiLCJhY3Rpdml0eSIsImxvY2FsQWdlbnRFbmFibGVkIiwiZW5hYmxlZCIsImZyYWdtZW50Qm9vdHN0cmFwIiwiYWdlbnRQYW5lbE9wZW4iLCJwYW5lbE9wZW4iLCJ0b2dnbGVBZ2VudFBhbmVsIiwidG9nZ2xlUGFuZWwiLCJvcGVuQWdlbnRQYW5lbCIsIm9wZW5QYW5lbCIsImNvbnRhaW5lclJlZiIsImltYWdlSW5wdXRSZWYiLCJ1cGxvYWRUYXJnZXRSZWYiLCJjbGlwYm9hcmRSZWYiLCJoaXN0b3J5UmVmIiwicGFzdCIsImZ1dHVyZSIsImxhc3RIaXN0b3J5UmVmIiwiaGlzdG9yeUNvbW1pdFRpbWVyUmVmIiwidmlld3BvcnRTYXZlVGltZXJSZWYiLCJhcHBseWluZ0hpc3RvcnlSZWYiLCJoaXN0b3J5UGF1c2VkUmVmIiwiZGlkSW5pdGlhbENlbnRlclJlZiIsInJhZlJlZiIsIm5vZGVEcmFnZ2luZ1JlZiIsImRyYWdSZWYiLCJpc0RyYWdnaW5nTm9kZSIsImhhc01vdmVkIiwic3RhcnRYIiwic3RhcnRZIiwiaW5pdGlhbFNlbGVjdGVkTm9kZXMiLCJjb25maWciLCJlZmZlY3RpdmVDb25maWciLCJpc0FpQ29uZmlnUmVhZHkiLCJvcGVuQ29uZmlnRGlhbG9nIiwiYWRkQXNzZXQiLCJjbGVhbnVwQXNzZXRJbWFnZXMiLCJjbGVhbnVwSW1hZ2VzIiwiaHlkcmF0ZWQiLCJjcmVhdGVQcm9qZWN0Iiwib3BlblByb2plY3QiLCJ1cGRhdGVQcm9qZWN0IiwicmVuYW1lUHJvamVjdCIsImRlbGV0ZVByb2plY3RzIiwiY3VycmVudFByb2plY3QiLCJwcm9qZWN0cyIsImZpbmQiLCJwcm9qZWN0IiwidGhlbWUiLCJub2RlcyIsInNldE5vZGVzIiwiY29ubmVjdGlvbnMiLCJzZXRDb25uZWN0aW9ucyIsImNoYXRTZXNzaW9ucyIsInNldENoYXRTZXNzaW9ucyIsImFjdGl2ZUNoYXRJZCIsInNldEFjdGl2ZUNoYXRJZCIsInZpZXdwb3J0Iiwic2V0Vmlld3BvcnQiLCJ4IiwieSIsImsiLCJjYW52YXNUb29sIiwic2V0Q2FudmFzVG9vbCIsInNpemUiLCJzZXRTaXplIiwid2lkdGgiLCJoZWlnaHQiLCJzZWxlY3RlZE5vZGVJZHMiLCJzZXRTZWxlY3RlZE5vZGVJZHMiLCJTZXQiLCJzZWxlY3RlZENvbm5lY3Rpb25JZCIsInNldFNlbGVjdGVkQ29ubmVjdGlvbklkIiwiaG92ZXJlZE5vZGVJZCIsInNldEhvdmVyZWROb2RlSWQiLCJjb25uZWN0aW5nUGFyYW1zIiwic2V0Q29ubmVjdGluZ1BhcmFtcyIsImNvbm5lY3Rpb25UYXJnZXROb2RlSWQiLCJzZXRDb25uZWN0aW9uVGFyZ2V0Tm9kZUlkIiwicGVuZGluZ0Nvbm5lY3Rpb25DcmVhdGUiLCJzZXRQZW5kaW5nQ29ubmVjdGlvbkNyZWF0ZSIsIm1vdXNlV29ybGQiLCJzZXRNb3VzZVdvcmxkIiwic2VsZWN0aW9uQm94Iiwic2V0U2VsZWN0aW9uQm94IiwiY29udGV4dE1lbnUiLCJzZXRDb250ZXh0TWVudSIsIm5vZGVDcmVhdGVQb3NpdGlvbiIsInNldE5vZGVDcmVhdGVQb3NpdGlvbiIsInJ1bm5pbmdOb2RlSWQiLCJzZXRSdW5uaW5nTm9kZUlkIiwiaXNNaW5pTWFwT3BlbiIsInNldElzTWluaU1hcE9wZW4iLCJiYWNrZ3JvdW5kTW9kZSIsInNldEJhY2tncm91bmRNb2RlIiwic2hvd0ltYWdlSW5mbyIsInNldFNob3dJbWFnZUluZm8iLCJjbGVhckNvbmZpcm1PcGVuIiwic2V0Q2xlYXJDb25maXJtT3BlbiIsImFzc2V0UGlja2VyT3BlbiIsInNldEFzc2V0UGlja2VyT3BlbiIsInByb2plY3RMb2FkZWQiLCJzZXRQcm9qZWN0TG9hZGVkIiwidG9vbGJhck5vZGVJZCIsInNldFRvb2xiYXJOb2RlSWQiLCJub2RlSW1hZ2VTZXR0aW5nc09wZW4iLCJzZXROb2RlSW1hZ2VTZXR0aW5nc09wZW4iLCJkaWFsb2dOb2RlSWQiLCJzZXREaWFsb2dOb2RlSWQiLCJpbmZvTm9kZUlkIiwic2V0SW5mb05vZGVJZCIsInBsdWdpbk1hbmFnZXJPcGVuIiwic2V0UGx1Z2luTWFuYWdlck9wZW4iLCJjcm9wTm9kZUlkIiwic2V0Q3JvcE5vZGVJZCIsIm1hc2tFZGl0Tm9kZUlkIiwic2V0TWFza0VkaXROb2RlSWQiLCJzcGxpdE5vZGVJZCIsInNldFNwbGl0Tm9kZUlkIiwidXBzY2FsZU5vZGVJZCIsInNldFVwc2NhbGVOb2RlSWQiLCJzdXBlclJlc29sdmVOb2RlSWQiLCJzZXRTdXBlclJlc29sdmVOb2RlSWQiLCJhbmdsZU5vZGVJZCIsInNldEFuZ2xlTm9kZUlkIiwicHJldmlld05vZGVJZCIsInNldFByZXZpZXdOb2RlSWQiLCJwcmV2aWV3SW1hZ2VJZCIsInNldFByZXZpZXdJbWFnZUlkIiwidGl0bGVFZGl0aW5nIiwic2V0VGl0bGVFZGl0aW5nIiwidGl0bGVEcmFmdCIsInNldFRpdGxlRHJhZnQiLCJoaXN0b3J5U3RhdGUiLCJzZXRIaXN0b3J5U3RhdGUiLCJjYW5VbmRvIiwiY2FuUmVkbyIsImV4cGFuZGVkQmF0Y2hOb2RlSWRzIiwic2V0RXhwYW5kZWRCYXRjaE5vZGVJZHMiLCJpc05vZGVEcmFnZ2luZyIsInNldElzTm9kZURyYWdnaW5nIiwiaXNOb2RlUmVzaXppbmciLCJzZXRJc05vZGVSZXNpemluZyIsImRyb3BUYXJnZXRHcm91cElkIiwic2V0RHJvcFRhcmdldEdyb3VwSWQiLCJyZWZlcmVuY2VQaWNrZXJOb2RlSWQiLCJzZXRSZWZlcmVuY2VQaWNrZXJOb2RlSWQiLCJub2Rlc1JlZiIsImNvbm5lY3Rpb25zUmVmIiwic2VsZWN0ZWROb2RlSWRzUmVmIiwidmlld3BvcnRSZWYiLCJmb2N1c0FuaW1SZWYiLCJnZW5lcmF0ZU5vZGVSZWYiLCJjb25uZWN0aW5nUGFyYW1zUmVmIiwiY29ubmVjdGlvblRhcmdldE5vZGVJZFJlZiIsInNlbGVjdGlvbkJveFJlZiIsInBlbmRpbmdDb25uZWN0aW9uQ3JlYXRlUmVmIiwiZ2VuZXJhdGlvblJlcXVlc3RzUmVmIiwiTWFwIiwiY3JlYXRlSGlzdG9yeUVudHJ5IiwiY3VycmVudCIsImNsZWFudXBDYW52YXNGaWxlcyIsImV4dHJhIiwiaGlzdG9yeSIsImxhc3RIaXN0b3J5Iiwic3RhcnRHZW5lcmF0aW9uUmVxdWVzdCIsInRhcmdldE5vZGVJZCIsIm9yaWdpbk5vZGVJZCIsInJ1bm5pbmdJZCIsImNvbnRyb2xsZXIiLCJBYm9ydENvbnRyb2xsZXIiLCJwcmV2aW91cyIsImdldCIsImFib3J0Iiwic2V0IiwiZmluaXNoR2VuZXJhdGlvblJlcXVlc3QiLCJyZXF1ZXN0IiwiZGVsZXRlIiwic3RvcEdlbmVyYXRpb25CeVJ1bm5pbmdJZCIsImFmZmVjdGVkTm9kZUlkcyIsImZvckVhY2giLCJhZGQiLCJwcmV2IiwibWFwIiwibm9kZSIsImhhcyIsIm1ldGFkYXRhIiwic3RhdHVzIiwiZXJyb3JEZXRhaWxzIiwidW5kZWZpbmVkIiwiaW1hZ2VzIiwiaW1hZ2UiLCJ0ZXh0cyIsInRleHQiLCJjb25maXJtU3RvcEdlbmVyYXRpb24iLCJub2RlSWQiLCJjb25maXJtIiwidGl0bGUiLCJjb250ZW50Iiwib2tUZXh0IiwiY2FuY2VsVGV4dCIsIm9rQnV0dG9uUHJvcHMiLCJkYW5nZXIiLCJvbk9rIiwicmVwbGFjZSIsInJlc3RvcmUiLCJyZXN0b3JlZE5vZGVzIiwicmVzdG9yZWRTZXNzaW9ucyIsImNsZWFyVGltZW91dCIsImluY2x1ZGVzIiwibmV4dCIsInNldFRpbWVvdXQiLCJsYXN0Iiwic2xpY2UiLCJlbCIsInVwZGF0ZVNpemUiLCJyZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwicmVzaXplT2JzZXJ2ZXIiLCJSZXNpemVPYnNlcnZlciIsIm9ic2VydmUiLCJkaXNjb25uZWN0Iiwic2NyZWVuVG9DYW52YXMiLCJjbGllbnRYIiwiY2xpZW50WSIsImN1cnJlbnRWaWV3cG9ydCIsImxvY2FsWCIsImxlZnQiLCJsb2NhbFkiLCJ0b3AiLCJnZXRDYW52YXNDZW50ZXIiLCJzZXRDb25uZWN0aW5nIiwia2VlcE5vZGVUb29sYmFyIiwiaGlkZU5vZGVUb29sYmFyIiwiY29ubmVjdE5vZGVzIiwiY29ubmVjdGlvbiIsImhhbmRsZVR5cGUiLCJ3YXJuaW5nIiwiZnJvbU5vZGVJZCIsInRvTm9kZUlkIiwiZXhpc3RzIiwic29tZSIsImNvbm4iLCJEYXRlIiwibm93IiwiY3JlYXRlQ29ubmVjdGVkTm9kZSIsInR5cGUiLCJwZW5kaW5nIiwiQ29uZmlnIiwibW9kZWwiLCJpbWFnZU1vZGVsIiwiY291bnQiLCJjYW52YXNJbWFnZUNvdW50IiwibmV3Tm9kZSIsInBvc2l0aW9uIiwiVGV4dCIsIkF1ZGlvIiwiY2FuY2VsUGVuZGluZ0Nvbm5lY3Rpb25DcmVhdGUiLCJnZXRDb25uZWN0aW9uRHJvcFRhcmdldCIsIndvcmxkIiwic2NhbGUiLCJNYXRoIiwibWF4IiwicGFkZGluZyIsImhhbmRsZVJhZGl1cyIsImlzTmVhck5vZGUiLCJiZXN0Tm9kZUlkIiwiYmVzdFByaW9yaXR5IiwiTnVtYmVyIiwiUE9TSVRJVkVfSU5GSU5JVFkiLCJyZXZlcnNlIiwiYW5jaG9yIiwiZHgiLCJkeSIsImhpdHNIYW5kbGUiLCJoaXRzSW5zaWRlIiwiaGl0c0V4cGFuZGVkIiwicHJpb3JpdHkiLCJ2aXNpYmxlTm9kZXMiLCJ2aWV3TGVmdCIsInZpZXdUb3AiLCJ2aWV3UmlnaHQiLCJ2aWV3Qm90dG9tIiwiZmlsdGVyIiwibm9kZUJ5SWQiLCJzaW5nbGVTZWxlY3RlZE5vZGVJZCIsIkFycmF5IiwiZnJvbSIsInRvb2xiYXJOb2RlIiwiaW5mb05vZGUiLCJjcm9wTm9kZSIsIm1hc2tFZGl0Tm9kZSIsInNwbGl0Tm9kZSIsInVwc2NhbGVOb2RlIiwic3VwZXJSZXNvbHZlTm9kZSIsImFuZ2xlTm9kZSIsImNvbnRleHRNZW51Tm9kZSIsInByZXZpZXdOb2RlIiwicHJldmlld0NvbnRlbnQiLCJoYXNNdWx0aXBsZVNlbGVjdGVkTm9kZXMiLCJhY3RpdmVOb2RlSWQiLCJncm91cENoaWxkQ291bnRCeUlkIiwiZ3JvdXBJZCIsInJlbGF0ZWRIaWdobGlnaHQiLCJub2RlSWRzIiwiY29ubmVjdGlvbklkcyIsImFkZE5vZGUiLCJHcm91cCIsImNvbmZpZ0lucHV0c0J5SWQiLCJtZW50aW9uUmVmZXJlbmNlc0J5Tm9kZUlkIiwiY29ubmVjdGVkTm9kZXNCeU5vZGVJZCIsInNvdXJjZSIsInB1c2giLCJyZWZlcmVuY2VDb25uZWN0ZWROb2RlSWRzIiwiZmxhdE1hcCIsImNoaWxkIiwiQm9vbGVhbiIsImFwcGx5QWdlbnRPcHMiLCJwbHVnaW5Ib3N0IiwicmVuZGVyUGx1Z2luUGFuZWwiLCJidWlsZE5vZGVUb29sYmFySXRlbXMiLCJjcmVhdGVOb2RlIiwidGFyZ2V0UG9zaXRpb24iLCJjb25maWdNZXRhZGF0YSIsImRlZmluaXRpb24iLCJ3YW50c1BhbmVsIiwiaGlkZVBhbmVsIiwiUGFuZWwiLCJhdXRvT3BlblBhbmVsIiwidXNlQnVpbHRpblBhbmVsIiwiZGVsZXRlTm9kZXMiLCJpZHMiLCJhbGxJZHMiLCJkZWxldGVDb25uZWN0aW9uIiwiY29ubmVjdGlvbklkIiwiZGlzY29ubmVjdE5vZGVSZWZlcmVuY2UiLCJzdGFydE5vZGVSZWZlcmVuY2VTZWxlY3Rpb24iLCJleGl0Tm9kZVJlZmVyZW5jZVNlbGVjdGlvbiIsInNlbGVjdE5vZGVSZWZlcmVuY2UiLCJleGl0IiwiZXZlbnQiLCJrZXkiLCJwcmV2ZW50RGVmYXVsdCIsInN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiZGVzZWxlY3RDYW52YXMiLCJjbGVhckNhbnZhcyIsImR1cGxpY2F0ZU5vZGUiLCJyYW5kb20iLCJ0b1N0cmluZyIsImNvcHlTZWxlY3RlZE5vZGVzIiwic2VsZWN0ZWRJZHMiLCJjb3BpZWROb2RlcyIsImxlbmd0aCIsInBhc3RlQ29waWVkTm9kZXMiLCJjbGlwYm9hcmQiLCJjZW50ZXIiLCJib3VuZHMiLCJyZWR1Y2UiLCJhY2MiLCJtaW4iLCJyaWdodCIsImJvdHRvbSIsIkluZmluaXR5IiwiaWRNYXAiLCJuZXh0Tm9kZXMiLCJpbmRleCIsImVuZHNXaXRoIiwicGFzdGVkTm9kZXMiLCJuZXh0Q29ubmVjdGlvbnMiLCJyZXNldFZpZXdwb3J0IiwiZm9jdXNOb2RlIiwiaXRlbSIsIndvcmxkWCIsIndvcmxkWSIsInRhcmdldCIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwic3RhcnQiLCJkdXJhdGlvbiIsImVhc2VPdXRDdWJpYyIsInBvdyIsInN0YXJ0VGltZSIsInN0ZXAiLCJwcm9ncmVzcyIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInNldFpvb21TY2FsZSIsIm5leHRTY2FsZSIsImFwcGx5SGlzdG9yeSIsImVudHJ5IiwidW5kb0NhbnZhcyIsInBvcCIsInJlZG9DYW52YXMiLCJjcmVhdGVBbmRPcGVuUHJvamVjdCIsImdldFN0YXRlIiwiZGVsZXRlQ3VycmVudFByb2plY3QiLCJleHBvcnRDdXJyZW50UHJvamVjdCIsImVycm9yIiwiaGlkZSIsImxvYWRpbmciLCJzdWNjZXNzIiwiY29uc29sZSIsImhhbmRsZUNhbnZhc01vdXNlRG93biIsImJ1dHRvbiIsIm5leHRTZWxlY3Rpb25Cb3giLCJzdGFydFdvcmxkWCIsInN0YXJ0V29ybGRZIiwiY3VycmVudFdvcmxkWCIsImN1cnJlbnRXb3JsZFkiLCJhZGRpdGl2ZSIsInNoaWZ0S2V5IiwiaW5pdGlhbFNlbGVjdGVkTm9kZUlkcyIsInNlbGVjdE5vZGVCeUV2ZW50IiwibmV4dFNlbGVjdGVkIiwibWV0YUtleSIsImN0cmxLZXkiLCJjbGVhciIsInNvbG9JZCIsInBlbmRpbmdTZWxlY3Rpb25SZWYiLCJoYW5kbGVOb2RlU2VsZWN0Q2FwdHVyZSIsImhhbmRsZU5vZGVNb3VzZURvd24iLCJzdG9wUHJvcGFnYXRpb24iLCJjdXJyZW50Tm9kZXMiLCJkcmFnSWRzIiwiZmluaXNoTm9kZURyYWciLCJ3YXNDbGljayIsImNsaWNrZWROb2RlSWQiLCJpbml0aWFsUG9zaXRpb25zIiwibW92ZWRJZHMiLCJtb3ZlZCIsImluaXRpYWwiLCJ0YXJnZXRHcm91cCIsImNsaWNrZWROb2RlIiwiY2xpY2tlZERlZmluaXRpb24iLCJoYW5kbGVHbG9iYWxNb3VzZU1vdmUiLCJhYnMiLCJwcmV2aWV3Tm9kZXMiLCJkcm9wVGFyZ2V0IiwiaGFuZGxlR2xvYmFsUG9pbnRlck1vdmUiLCJjdXJyZW50U2VsZWN0aW9uIiwiYnV0dG9ucyIsInJlY3RYIiwicmVjdFkiLCJyZWN0VyIsInJlY3RIIiwiaW50ZXJzZWN0cyIsImhhbmRsZUdsb2JhbE1vdXNlVXAiLCJjdXJyZW50Q29ubmVjdGlvbiIsImhhbmRsZVBvaW50ZXJVcCIsImNhbmNlbE5vZGVEcmFnIiwiY3JlYXRlSW1hZ2VGaWxlTm9kZSIsImZpbGUiLCJJbWFnZSIsIm5hbWUiLCJjcmVhdGVWaWRlb0ZpbGVOb2RlIiwidmlkZW8iLCJWaWRlbyIsImNyZWF0ZUF1ZGlvRmlsZU5vZGUiLCJhdWRpbyIsInNwZWMiLCJjcmVhdGVUZXh0Tm9kZUZyb21DbGlwYm9hcmQiLCJ0cmltbWVkIiwidHJpbSIsInBhc3RlU3lzdGVtQ2xpcGJvYXJkIiwibmF2aWdhdG9yIiwiaXRlbXMiLCJyZWFkIiwiaW1hZ2VJdGVtIiwidHlwZXMiLCJzdGFydHNXaXRoIiwiaW1hZ2VUeXBlIiwiYmxvYiIsImdldFR5cGUiLCJGaWxlIiwicmVhZFRleHQiLCJoYW5kbGVLZXlEb3duIiwiRWxlbWVudCIsIkhUTUxJbnB1dEVsZW1lbnQiLCJIVE1MVGV4dEFyZWFFbGVtZW50IiwiSFRNTFNlbGVjdEVsZW1lbnQiLCJjbG9zZXN0IiwidG9Mb3dlckNhc2UiLCJpc01vZGlmaWVyU2hvcnRjdXQiLCJnZXRTZWxlY3Rpb24iLCJhbHRLZXkiLCJoYW5kbGVDb25uZWN0U3RhcnQiLCJoYW5kbGVOb2RlUmVzaXplIiwiaGFuZGxlTm9kZVJlc2l6ZVN0YXJ0IiwiaGFuZGxlTm9kZVJlc2l6ZUVuZCIsInRvZ2dsZU5vZGVGcmVlUmVzaXplIiwiZnJlZVJlc2l6ZSIsInJhdGlvIiwibmF0dXJhbFdpZHRoIiwibmF0dXJhbEhlaWdodCIsImhhbmRsZU5vZGVDb250ZW50Q2hhbmdlIiwicHJpbWFyeVRleHRJZCIsImhhbmRsZU5vZGVUaXRsZUNoYW5nZSIsInRvZ2dsZUJhdGNoRXhwYW5kZWQiLCJzZXRCYXRjaFByaW1hcnkiLCJpdGVtSWQiLCJlZGdlIiwic3RvcmFnZUtleSIsImJ5dGVzIiwibWltZVR5cGUiLCJwcmltYXJ5SW1hZ2VJZCIsImR1cGxpY2F0ZUJhdGNoSW1hZ2UiLCJpbWFnZUlkIiwiY29weSIsInByb21wdCIsImdlbmVyYXRpb25UeXBlIiwicXVhbGl0eSIsImJhY2tncm91bmQiLCJyZWZlcmVuY2VzIiwiaGFuZGxlTm9kZVByb21wdENoYW5nZSIsImhhbmRsZUNvbmZpZ05vZGVDaGFuZ2UiLCJwYXRjaCIsImRvd25sb2FkTm9kZUltYWdlIiwiZG93bmxvYWRCYXRjaEltYWdlIiwiY2FwdHVyZVZpZGVvTm9kZUZyYW1lIiwicXVlcnlTZWxlY3RvckFsbCIsImRhdGFzZXQiLCJjYW52YXNWaWRlbyIsImN1cnJlbnRUaW1lIiwic2F2ZU5vZGVBc3NldCIsImtpbmQiLCJjb3ZlclVybCIsInRhZ3MiLCJkYXRhIiwidXJsIiwiZGF0YVVybCIsImNyZWF0ZUltYWdlUmV2ZXJzZVByb21wdE5vZGVzIiwiZ2FwIiwidGV4dFNwZWMiLCJjb25maWdTcGVjIiwiY2VudGVyWSIsInRleHROb2RlIiwiZm9udFNpemUiLCJjb25maWdOb2RlIiwiZ2VuZXJhdGlvbk1vZGUiLCJ0ZXh0TW9kZWwiLCJjb21wb3NlckNvbnRlbnQiLCJ0ZXh0SWQiLCJjcm9wSW1hZ2VOb2RlIiwiY3JvcCIsImNyb3BwZWQiLCJjaGlsZElkIiwic3BsaXRJbWFnZU5vZGUiLCJwaWVjZXMiLCJjZWxsV2lkdGgiLCJjb2x1bW5zIiwiY2VsbEhlaWdodCIsInJvd3MiLCJjaGlsZE5vZGVzIiwiUHJvbWlzZSIsImFsbCIsInBpZWNlIiwicm93IiwiY29sdW1uIiwibWFza0VkaXRJbWFnZU5vZGUiLCJwYXlsb2FkIiwiZ2VuZXJhdGlvbkNvbmZpZyIsInVzZXJQcm9tcHQiLCJnZW5lcmF0aW9uTWV0YWRhdGEiLCJtYXNrRGF0YVVybCIsInNpZ25hbCIsInRoZW4iLCJ1cGxvYWRlZCIsIkVycm9yIiwidXBzY2FsZUltYWdlTm9kZSIsInVwc2NhbGVkIiwiZ2VuZXJhdGVBbmdsZU5vZGUiLCJpbWFnZUNvbmZpZyIsImhhbmRsZUZvbnRTaXplQ2hhbmdlIiwiaGFuZGxlVXBsb2FkUmVxdWVzdCIsImNsaWNrIiwiaGFuZGxlSW1hZ2VJbnB1dENoYW5nZSIsImZpbGVzIiwiZiIsInZhbHVlIiwiYmFzZVBvc2l0aW9uIiwiU1RBR0dFUiIsImZpcnN0IiwicmVzdCIsIm5leHRTaXplIiwicyIsImkiLCJvZmZzZXRQb3MiLCJoYW5kbGVEcm9wIiwiZGF0YVRyYW5zZmVyIiwiYmFzZVBvcyIsInBvcyIsInN0YXJ0VGl0bGVFZGl0aW5nIiwiZmluaXNoVGl0bGVFZGl0aW5nIiwibmV4dFRpdGxlIiwicHJldmVudENhbnZhc0NvbnRleHRNZW51IiwiaGFuZGxlR2VuZXJhdGVOb2RlIiwibW9kZSIsInNvdXJjZU5vZGUiLCJidWlsdGluUGFuZWwiLCJ3cml0ZUJhY2tUb1NlbGYiLCJzY2VuZSIsImZ1bGxQcm9tcHQiLCJwcm9tcHRQcmVmaXgiLCJjb250ZXh0IiwicmVmcyIsInJlZmVyZW5jZUltYWdlcyIsInJ1bkNvbnRyb2xsZXIiLCJzb3VyY2VUZXh0Q29udGVudCIsImVkaXRpbmdUZXh0Tm9kZSIsImdlbmVyYXRpb25Db250ZXh0IiwiZWZmZWN0aXZlUHJvbXB0IiwiYWJvcnRlZCIsIm1hcmtTb3VyY2VTdGF0dXMiLCJwZW5kaW5nQ2hpbGRJZHMiLCJpc0NvbmZpZ05vZGUiLCJpc0ltYWdlTm9kZSIsImlzRW1wdHlJbWFnZU5vZGUiLCJzb3VyY2VSZWZlcmVuY2UiLCJ2YWx1ZXMiLCJwYXJlbnRDb25maWciLCJwYXJlbnRQb3NpdGlvbiIsInJvb3RJZCIsImltYWdlSWRzIiwicm9vdE5vZGUiLCJoYXNTdWNjZXNzIiwiaGFzRmFpbHVyZSIsImZpcnN0RXJyb3IiLCJpbWFnZVNpemUiLCJpc0VtcHR5VmlkZW9Ob2RlIiwidmlkZW9JZCIsInBhcmVudCIsInZpZGVvTm9kZSIsInNlY29uZHMiLCJ2aWRlb1NlY29uZHMiLCJ2cXVhbGl0eSIsImdlbmVyYXRlQXVkaW8iLCJ2aWRlb0dlbmVyYXRlQXVkaW8iLCJ3YXRlcm1hcmsiLCJ2aWRlb1dhdGVybWFyayIsInZpZGVvU2l6ZSIsImlzRW1wdHlBdWRpb05vZGUiLCJhdWRpb0lkIiwiYXVkaW9Ob2RlIiwiYXVkaW9Gb3JtYXQiLCJ0ZXh0Q291bnQiLCJTdHJpbmciLCJ0ZXh0Q29uZmlnIiwiaXNFbXB0eVRleHROb2RlIiwidGV4dElkcyIsInJlYXNvbmluZ0VmZm9ydCIsInJlc3VsdHMiLCJzdHJlYW1lZCIsImFuc3dlciIsImNvbXBsZXRlZFRleHRzIiwiZmFpbGVkVGV4dHMiLCJmaXJzdFRleHQiLCJwcmltYXJ5VGV4dCIsImhhbmRsZVJldHJ5Tm9kZSIsInNhdmVkSW1hZ2VNZXRhZGF0YSIsImhhc1NhdmVkSW1hZ2VNZXRhZGF0YSIsInVzZVJlZmVyZW5jZUltYWdlcyIsInJldHJ5UmVmZXJlbmNlSW1hZ2VzIiwicmV0cnlJbWFnZXMiLCJ1cGxvYWRlZEltYWdlIiwicmV0cnlJbWFnZSIsIm1ha2VQcmltYXJ5IiwiZGVsZXRlQmF0Y2hJbWFnZSIsInJldHJ5QmF0Y2hJbWFnZSIsImdlbmVyYXRlSW1hZ2VGcm9tVGV4dE5vZGUiLCJub2RlU2l6ZSIsImNvbmNhdCIsImluc2VydEFzc2lzdGFudEltYWdlIiwic3RvcmVkSW1hZ2UiLCJtZXRhIiwiaW5zZXJ0QXNzaXN0YW50VGV4dCIsImhhbmRsZUFzc2V0SW5zZXJ0IiwiaGFuZGxlTm9kZUhvdmVyU3RhcnQiLCJoYW5kbGVOb2RlSG92ZXJFbmQiLCJoYW5kbGVOb2RlVmlld0ltYWdlIiwiaGFuZGxlTm9kZVJldHJ5IiwiaGFuZGxlTm9kZUNvbnRleHRNZW51IiwicmVuZGVyTm9kZVBhbmVsIiwicGFuZWxOb2RlIiwib3BlbiIsInJlbmRlck5vZGVDb250ZW50UGFuZWwiLCJjb250ZW50Tm9kZSIsImNhbnZhcyIsImNvbG9yIiwicG9pbnRlckV2ZW50cyIsInRyYW5zZm9ybSIsInpJbmRleCIsInRvIiwidG9vbGJhciIsInBhbmVsIiwiYm9yZGVyQ29sb3IiLCJib3JkZXIiLCJzZWxlY3Rpb25GaWxsIiwic2VsZWN0aW9uU3Ryb2tlIiwiYm9keSIsImRpc3BsYXkiLCJqdXN0aWZ5Q29udGVudCIsImFsaWduSXRlbXMiLCJtYXhIZWlnaHQiLCJtYXhXaWR0aCIsIm9iamVjdEZpdCIsIl9jIiwiX2MyIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbInByb2plY3QudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZUNhbGxiYWNrLCB1c2VFZmZlY3QsIHVzZUxheW91dEVmZmVjdCwgdXNlTWVtbywgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHR5cGUgeyBDaGFuZ2VFdmVudCBhcyBSZWFjdENoYW5nZUV2ZW50LCBEcmFnRXZlbnQgYXMgUmVhY3REcmFnRXZlbnQsIE1vdXNlRXZlbnQgYXMgUmVhY3RNb3VzZUV2ZW50LCBQb2ludGVyRXZlbnQgYXMgUmVhY3RQb2ludGVyRXZlbnQgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IHVzZU5hdmlnYXRlLCB1c2VQYXJhbXMsIHVzZVNlYXJjaFBhcmFtcyB9IGZyb20gXCJyZWFjdC1yb3V0ZXItZG9tXCI7XG5pbXBvcnQgeyBHcm91cCwgVmlkZW8gfSBmcm9tIFwibHVjaWRlLXJlYWN0XCI7XG5pbXBvcnQgeyBzYXZlQXMgfSBmcm9tIFwiZmlsZS1zYXZlclwiO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tIFwicmVhY3QtaTE4bmV4dFwiO1xuXG5pbXBvcnQgeyByZXF1ZXN0RWRpdCwgcmVxdWVzdEdlbmVyYXRpb24sIHJlcXVlc3RJbWFnZVF1ZXN0aW9uIH0gZnJvbSBcIkAvc2VydmljZXMvYXBpL2ltYWdlXCI7XG5pbXBvcnQgeyByZXF1ZXN0QXVkaW9HZW5lcmF0aW9uLCBzdG9yZUdlbmVyYXRlZEF1ZGlvIH0gZnJvbSBcIkAvc2VydmljZXMvYXBpL2F1ZGlvXCI7XG5pbXBvcnQgeyByZXF1ZXN0VmlkZW9HZW5lcmF0aW9uLCBzdG9yZUdlbmVyYXRlZFZpZGVvIH0gZnJvbSBcIkAvc2VydmljZXMvYXBpL3ZpZGVvXCI7XG5pbXBvcnQgeyBkZWZhdWx0Q29uZmlnLCB1c2VDb25maWdTdG9yZSwgdXNlRWZmZWN0aXZlQ29uZmlnIH0gZnJvbSBcIkAvc3RvcmVzL3VzZS1jb25maWctc3RvcmVcIjtcbmltcG9ydCB7IHVwbG9hZEltYWdlIH0gZnJvbSBcIkAvc2VydmljZXMvaW1hZ2Utc3RvcmFnZVwiO1xuaW1wb3J0IHsgdXBsb2FkTWVkaWFGaWxlIH0gZnJvbSBcIkAvc2VydmljZXMvZmlsZS1zdG9yYWdlXCI7XG5pbXBvcnQgeyBuYW5vaWQgfSBmcm9tIFwibmFub2lkXCI7XG5pbXBvcnQgeyBnZXREYXRhVXJsQnl0ZVNpemUsIHJlYWRJbWFnZU1ldGEgfSBmcm9tIFwiQC9saWIvaW1hZ2UtdXRpbHNcIjtcbmltcG9ydCB7IGNhbnZhc1RoZW1lcywgdHlwZSBDYW52YXNCYWNrZ3JvdW5kTW9kZSB9IGZyb20gXCJAL2xpYi9jYW52YXMtdGhlbWVcIjtcbmltcG9ydCB7IHVzZUFzc2V0U3RvcmUgfSBmcm9tIFwiQC9zdG9yZXMvdXNlLWFzc2V0LXN0b3JlXCI7XG5pbXBvcnQgeyB1c2VUaGVtZVN0b3JlIH0gZnJvbSBcIkAvc3RvcmVzL3VzZS10aGVtZS1zdG9yZVwiO1xuaW1wb3J0IHsgY3JvcERhdGFVcmwsIHNwbGl0RGF0YVVybCwgdXBzY2FsZURhdGFVcmwgfSBmcm9tIFwiQC9saWIvY2FudmFzL2NhbnZhcy1pbWFnZS1kYXRhXCI7XG5pbXBvcnQgeyBmaXROb2RlU2l6ZSwgbm9kZVNpemVGcm9tUmF0aW8gfSBmcm9tIFwiQC9saWIvY2FudmFzL2NhbnZhcy1ub2RlLXNpemVcIjtcbmltcG9ydCB7IGNhcHR1cmVWaWRlb0ZyYW1lLCB0eXBlIFZpZGVvRnJhbWVQb3NpdGlvbiB9IGZyb20gXCJAL2xpYi9jYW52YXMvY2FudmFzLXZpZGVvLWZyYW1lXCI7XG5pbXBvcnQgeyBBcHAsIEJ1dHRvbiwgTW9kYWwgfSBmcm9tIFwiYW50ZFwiO1xuaW1wb3J0IHsgTk9ERV9ERUZBVUxUX1NJWkUsIGdldE5vZGVTcGVjIH0gZnJvbSBcIkAvY29uc3RhbnQvY2FudmFzXCI7XG5pbXBvcnQgeyBBY3RpdmVDb25uZWN0aW9uUGF0aCwgQ29ubmVjdGlvblBhdGggfSBmcm9tIFwiQC9jb21wb25lbnRzL2NhbnZhcy9jYW52YXMtY29ubmVjdGlvbnNcIjtcbmltcG9ydCB7IENhbnZhc0NvbmZpZ0NvbXBvc2VyIH0gZnJvbSBcIkAvY29tcG9uZW50cy9jYW52YXMvY2FudmFzLWNvbmZpZy1jb21wb3NlclwiO1xuaW1wb3J0IHsgQ2FudmFzQ29uZmlnTm9kZVBhbmVsIH0gZnJvbSBcIkAvY29tcG9uZW50cy9jYW52YXMvY2FudmFzLWNvbmZpZy1ub2RlLXBhbmVsXCI7XG5pbXBvcnQgeyBDYW52YXNOb2RlQ29udGV4dE1lbnUgfSBmcm9tIFwiQC9jb21wb25lbnRzL2NhbnZhcy9jYW52YXMtY29udGV4dC1tZW51XCI7XG5pbXBvcnQgeyBDYW52YXNOb2RlQW5nbGVEaWFsb2csIHR5cGUgQ2FudmFzSW1hZ2VBbmdsZVBhcmFtcyB9IGZyb20gXCJAL2NvbXBvbmVudHMvY2FudmFzL2NhbnZhcy1ub2RlLWFuZ2xlLWRpYWxvZ1wiO1xuaW1wb3J0IHsgQ2FudmFzTm9kZUNyb3BEaWFsb2csIHR5cGUgQ2FudmFzSW1hZ2VDcm9wUmVjdCB9IGZyb20gXCJAL2NvbXBvbmVudHMvY2FudmFzL2NhbnZhcy1ub2RlLWNyb3AtZGlhbG9nXCI7XG5pbXBvcnQgeyBDYW52YXNOb2RlTWFza0VkaXREaWFsb2csIHR5cGUgQ2FudmFzSW1hZ2VNYXNrRWRpdFBheWxvYWQgfSBmcm9tIFwiQC9jb21wb25lbnRzL2NhbnZhcy9jYW52YXMtbm9kZS1tYXNrLWVkaXQtZGlhbG9nXCI7XG5pbXBvcnQgeyBDYW52YXNOb2RlU3BsaXREaWFsb2csIHR5cGUgQ2FudmFzSW1hZ2VTcGxpdFBhcmFtcyB9IGZyb20gXCJAL2NvbXBvbmVudHMvY2FudmFzL2NhbnZhcy1ub2RlLXNwbGl0LWRpYWxvZ1wiO1xuaW1wb3J0IHsgQ2FudmFzTm9kZVVwc2NhbGVEaWFsb2csIHR5cGUgQ2FudmFzSW1hZ2VVcHNjYWxlUGFyYW1zIH0gZnJvbSBcIkAvY29tcG9uZW50cy9jYW52YXMvY2FudmFzLW5vZGUtdXBzY2FsZS1kaWFsb2dcIjtcbmltcG9ydCB7IGJ1aWxkTm9kZUdlbmVyYXRpb25Db250ZXh0LCBidWlsZE5vZGVHZW5lcmF0aW9uSW5wdXRzLCBidWlsZE5vZGVSZXNwb25zZU1lc3NhZ2VzLCBoeWRyYXRlTm9kZUdlbmVyYXRpb25Db250ZXh0LCB0eXBlIE5vZGVHZW5lcmF0aW9uSW5wdXQgfSBmcm9tIFwiQC9jb21wb25lbnRzL2NhbnZhcy9jYW52YXMtbm9kZS1nZW5lcmF0aW9uXCI7XG5pbXBvcnQgeyBDYW52YXNOb2RlSG92ZXJUb29sYmFyLCBDYW52YXNOb2RlSW5mb01vZGFsIH0gZnJvbSBcIkAvY29tcG9uZW50cy9jYW52YXMvY2FudmFzLW5vZGUtaG92ZXItdG9vbGJhclwiO1xuaW1wb3J0IHsgSW5maW5pdGVDYW52YXMgfSBmcm9tIFwiQC9jb21wb25lbnRzL2NhbnZhcy9pbmZpbml0ZS1jYW52YXNcIjtcbmltcG9ydCB7IE1pbmltYXAgfSBmcm9tIFwiQC9jb21wb25lbnRzL2NhbnZhcy9jYW52YXMtbWluaS1tYXBcIjtcbmltcG9ydCB7IENhbnZhc05vZGUgfSBmcm9tIFwiQC9jb21wb25lbnRzL2NhbnZhcy9jYW52YXMtbm9kZVwiO1xuaW1wb3J0IHsgQ2FudmFzTm9kZVByb21wdFBhbmVsLCB0eXBlIENhbnZhc05vZGVHZW5lcmF0aW9uTW9kZSB9IGZyb20gXCJAL2NvbXBvbmVudHMvY2FudmFzL2NhbnZhcy1ub2RlLXByb21wdC1wYW5lbFwiO1xuaW1wb3J0IHsgQ2FudmFzVG9vbGJhciB9IGZyb20gXCJAL2NvbXBvbmVudHMvY2FudmFzL2NhbnZhcy10b29sYmFyXCI7XG5pbXBvcnQgeyBBc3NldFBpY2tlck1vZGFsLCB0eXBlIEluc2VydEFzc2V0UGF5bG9hZCB9IGZyb20gXCJAL2NvbXBvbmVudHMvY2FudmFzL2Fzc2V0LXBpY2tlci1tb2RhbFwiO1xuaW1wb3J0IHsgQ2FudmFzU2lkZVBhbmVsIH0gZnJvbSBcIkAvY29tcG9uZW50cy9jYW52YXMvY2FudmFzLXNpZGUtcGFuZWxcIjtcbmltcG9ydCB7IENhbnZhc1pvb21Db250cm9scyB9IGZyb20gXCJAL2NvbXBvbmVudHMvY2FudmFzL2NhbnZhcy16b29tLWNvbnRyb2xzXCI7XG5pbXBvcnQgeyB1c2VBZ2VudFN0b3JlIH0gZnJvbSBcIkAvc3RvcmVzL3VzZS1hZ2VudC1zdG9yZVwiO1xuaW1wb3J0IHsgdXNlQ2FudmFzU3RvcmUgfSBmcm9tIFwiQC9zdG9yZXMvY2FudmFzL3VzZS1jYW52YXMtc3RvcmVcIjtcbmltcG9ydCB7IHVzZUFnZW50QnJpZGdlIH0gZnJvbSBcIkAvcGFnZXMvY2FudmFzL2hvb2tzL3VzZS1hZ2VudC1icmlkZ2VcIjtcbmltcG9ydCB7IHVzZVBsdWdpbkhvc3QgfSBmcm9tIFwiQC9wYWdlcy9jYW52YXMvaG9va3MvdXNlLXBsdWdpbi1ob3N0XCI7XG5pbXBvcnQgeyBidWlsZE5vZGVNZW50aW9uUmVmZXJlbmNlcywgZ2V0R3JvdXBSZXNvdXJjZU5vZGVzLCBpc0NhbnZhc1JlZmVyZW5jZU5vZGUsIHR5cGUgQ2FudmFzUmVzb3VyY2VSZWZlcmVuY2UgfSBmcm9tIFwiQC9saWIvY2FudmFzL2NhbnZhcy1yZXNvdXJjZS1yZWZlcmVuY2VzXCI7XG5pbXBvcnQgeyBleHBvcnRDYW52YXNQcm9qZWN0cyB9IGZyb20gXCJAL2xpYi9jYW52YXMvY2FudmFzLWV4cG9ydFwiO1xuaW1wb3J0IHsgYXBwbHlOb2RlQ29uZmlnUGF0Y2gsIGF1ZGlvTWV0YWRhdGEsIGJ1aWxkQXVkaW9HZW5lcmF0aW9uTWV0YWRhdGEsIGJ1aWxkSW1hZ2VHZW5lcmF0aW9uTWV0YWRhdGEsIGNyZWF0ZUNhbnZhc05vZGUsIGltYWdlTWV0YWRhdGEsIHZpZGVvTWV0YWRhdGEgfSBmcm9tIFwiQC9saWIvY2FudmFzL2NhbnZhcy1ub2RlLWZhY3RvcnlcIjtcbmltcG9ydCB7IGZpbmRDb250YWluaW5nR3JvdXBJZCwgZmluZEdyb3VwRHJvcFRhcmdldCwgZ2V0Q29ubmVjdGlvblRhcmdldEFuY2hvciwgbm9ybWFsaXplQ29ubmVjdGlvbiwgc25hcE5vZGVzSW50b0dyb3VwIH0gZnJvbSBcIkAvbGliL2NhbnZhcy9jYW52YXMtbm9kZS1nZW9tZXRyeVwiO1xuaW1wb3J0IHtcbiAgICBhdWRpb0V4dGVuc2lvbixcbiAgICBidWlsZEFuZ2xlTGFiZWwsXG4gICAgYnVpbGRBbmdsZVByb21wdCxcbiAgICBidWlsZEdlbmVyYXRpb25Db25maWcsXG4gICAgZmluZFJldHJ5U291cmNlTm9kZSxcbiAgICBnZW5lcmF0aW9uUmVmZXJlbmNlVXJscyxcbiAgICBnZXRHZW5lcmF0aW9uQ291bnQsXG4gICAgZ2V0SW5wdXRTdW1tYXJ5LFxuICAgIGh5ZHJhdGVBc3Npc3RhbnRJbWFnZXMsXG4gICAgaHlkcmF0ZUNhbnZhc0ltYWdlcyxcbiAgICBpbWFnZUV4dGVuc2lvbixcbiAgICBpc0F1ZGlvRmlsZSxcbiAgICBpc0dlbmVyYXRpb25DYW5jZWxlZCxcbiAgICByZXNldEludGVycnVwdGVkR2VuZXJhdGlvbixcbiAgICByZXNvbHZlTWV0YWRhdGFSZWZlcmVuY2VzLFxuICAgIHNvdXJjZU5vZGVSZWZlcmVuY2VJbWFnZXMsXG59IGZyb20gXCJAL2xpYi9jYW52YXMvY2FudmFzLWdlbmVyYXRpb24taGVscGVyc1wiO1xuaW1wb3J0IHsgZ2V0Tm9kZURlZmluaXRpb24sIGlzQnVpbHRpbk5vZGVUeXBlIGFzIGlzQnVpbHRpblR5cGUsIHVzZU5vZGVSZWdpc3RyeVZlcnNpb24gfSBmcm9tIFwiQC9saWIvY2FudmFzL25vZGUtcmVnaXN0cnlcIjtcbmltcG9ydCB7IHJlZ2lzdGVyQnVpbHRpbk5vZGVzIH0gZnJvbSBcIkAvY29tcG9uZW50cy9jYW52YXMvbm9kZXMvYnVpbHRpbi1ub2Rlc1wiO1xuaW1wb3J0IHsgQ2FudmFzUGx1Z2luTWFuYWdlck1vZGFsIH0gZnJvbSBcIkAvY29tcG9uZW50cy9jYW52YXMvY2FudmFzLXBsdWdpbi1tYW5hZ2VyLW1vZGFsXCI7XG5pbXBvcnQgeyBDYW52YXNSZWZyZXNoU2hlbGwgfSBmcm9tIFwiQC9jb21wb25lbnRzL2NhbnZhcy9jYW52YXMtcmVmcmVzaC1zaGVsbFwiO1xuaW1wb3J0IHsgQ2FudmFzVG9wQmFyIH0gZnJvbSBcIkAvY29tcG9uZW50cy9jYW52YXMvY2FudmFzLXRvcC1iYXJcIjtcbmltcG9ydCB7IENvbm5lY3Rpb25DcmVhdGVNZW51LCBOb2RlQ3JlYXRlTWVudSwgdHlwZSBQZW5kaW5nQ29ubmVjdGlvbkNyZWF0ZSB9IGZyb20gXCJAL2NvbXBvbmVudHMvY2FudmFzL2NhbnZhcy1jcmVhdGUtbWVudXNcIjtcbmltcG9ydCB7XG4gICAgQ2FudmFzTm9kZVR5cGUsXG4gICAgdHlwZSBDYW52YXNBc3Npc3RhbnRJbWFnZSxcbiAgICB0eXBlIENhbnZhc0Fzc2lzdGFudFNlc3Npb24sXG4gICAgdHlwZSBDYW52YXNDb25uZWN0aW9uLFxuICAgIHR5cGUgQ2FudmFzTm9kZURhdGEsXG4gICAgdHlwZSBDYW52YXNOb2RlSW1hZ2UsXG4gICAgdHlwZSBDYW52YXNOb2RlVGV4dCxcbiAgICB0eXBlIENhbnZhc05vZGVNZXRhZGF0YSxcbiAgICB0eXBlIENhbnZhc05vZGVUeXBlSWQsXG4gICAgdHlwZSBDb25uZWN0aW9uSGFuZGxlLFxuICAgIHR5cGUgQ29udGV4dE1lbnVTdGF0ZSxcbiAgICB0eXBlIFBvc2l0aW9uLFxuICAgIHR5cGUgU2VsZWN0aW9uQm94LFxuICAgIHR5cGUgVmlld3BvcnRUcmFuc2Zvcm0sXG59IGZyb20gXCJAL3R5cGVzL2NhbnZhc1wiO1xuaW1wb3J0IHR5cGUgeyBSZWZlcmVuY2VJbWFnZSB9IGZyb20gXCJAL3R5cGVzL2ltYWdlXCI7XG5pbXBvcnQgdHlwZSB7IFJlZmVyZW5jZUF1ZGlvIH0gZnJvbSBcIkAvdHlwZXMvbWVkaWFcIjtcblxuLy8gUmVnaXN0ZXIgYnVpbHQtaW4gbm9kZXMgaW4gdGhlIHNoYXJlZCByZWdpc3RyeSBvbmNlIHdoZW4gdGhlIG1vZHVsZSBsb2Fkcy5cbnJlZ2lzdGVyQnVpbHRpbk5vZGVzKCk7XG5cbnR5cGUgQ2FudmFzQ2xpcGJvYXJkID0ge1xuICAgIG5vZGVzOiBDYW52YXNOb2RlRGF0YVtdO1xuICAgIGNvbm5lY3Rpb25zOiBDYW52YXNDb25uZWN0aW9uW107XG59O1xuXG50eXBlIENvbm5lY3Rpb25Ecm9wVGFyZ2V0ID0ge1xuICAgIG5vZGVJZDogc3RyaW5nIHwgbnVsbDtcbiAgICBpc05lYXJOb2RlOiBib29sZWFuO1xufTtcblxudHlwZSBDYW52YXNIaXN0b3J5RW50cnkgPSBQaWNrPENhbnZhc0NsaXBib2FyZCwgXCJub2Rlc1wiIHwgXCJjb25uZWN0aW9uc1wiPiAmIHtcbiAgICBjaGF0U2Vzc2lvbnM6IENhbnZhc0Fzc2lzdGFudFNlc3Npb25bXTtcbiAgICBhY3RpdmVDaGF0SWQ6IHN0cmluZyB8IG51bGw7XG4gICAgYmFja2dyb3VuZE1vZGU6IENhbnZhc0JhY2tncm91bmRNb2RlO1xuICAgIHNob3dJbWFnZUluZm86IGJvb2xlYW47XG59O1xuXG50eXBlIENhbnZhc0dlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgIHRhcmdldE5vZGVJZDogc3RyaW5nO1xuICAgIG9yaWdpbk5vZGVJZDogc3RyaW5nO1xuICAgIHJ1bm5pbmdOb2RlSWQ6IHN0cmluZztcbiAgICBjb250cm9sbGVyOiBBYm9ydENvbnRyb2xsZXI7XG59O1xuXG5jb25zdCBWSURFT19OT0RFX01BWF9XSURUSCA9IDQyMDtcbmNvbnN0IFZJREVPX05PREVfTUFYX0hFSUdIVCA9IDQyMDtcbi8vIFN0YWJsZSBlbXB0eSByZWZlcmVuY2UgYXJyYXkgcHJldmVudHMgYC4uLiB8fCBbXWAgZnJvbSBpbnZhbGlkYXRpbmcgQ2FudmFzTm9kZSdzIFJlYWN0Lm1lbW8gb24gZXZlcnkgcmVuZGVyLlxuY29uc3QgRU1QVFlfUkVGRVJFTkNFUzogQ2FudmFzUmVzb3VyY2VSZWZlcmVuY2VbXSA9IFtdO1xuY29uc3QgQ09OTkVDVElPTl9IQU5ETEVfSElUX1JBRElVUyA9IDQwO1xuY29uc3QgQ09OTkVDVElPTl9OT0RFX0hJVF9QQURESU5HID0gMzI7XG5jb25zdCBOT0RFX1NUQVRVU19JRExFID0gXCJpZGxlXCIgYXMgY29uc3Q7XG5jb25zdCBOT0RFX1NUQVRVU19MT0FESU5HID0gXCJsb2FkaW5nXCIgYXMgY29uc3Q7XG5jb25zdCBOT0RFX1NUQVRVU19TVUNDRVNTID0gXCJzdWNjZXNzXCIgYXMgY29uc3Q7XG5jb25zdCBOT0RFX1NUQVRVU19FUlJPUiA9IFwiZXJyb3JcIiBhcyBjb25zdDtcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIENhbnZhc1BhZ2UoKSB7XG4gICAgY29uc3QgW21vdW50ZWQsIHNldE1vdW50ZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgc2V0TW91bnRlZCh0cnVlKTtcbiAgICB9LCBbXSk7XG5cbiAgICBpZiAoIW1vdW50ZWQpIHJldHVybiA8Q2FudmFzUmVmcmVzaFNoZWxsIC8+O1xuXG4gICAgcmV0dXJuIDxJbmZpbml0ZUNhbnZhc1BhZ2UgLz47XG59XG5cbmZ1bmN0aW9uIEluZmluaXRlQ2FudmFzUGFnZSgpIHtcbiAgICBjb25zdCB7IG1lc3NhZ2UsIG1vZGFsIH0gPSBBcHAudXNlQXBwKCk7XG4gICAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICAgIC8vIFN1YnNjcmliZSB0byB0aGUgcmVnaXN0cnkgdmVyc2lvbiBzbyBwbHVnaW4gcmVnaXN0cmF0aW9uIGNoYW5nZXMgcmVyZW5kZXIgdGhlIGNhbnZhcy5cbiAgICBjb25zdCBub2RlUmVnaXN0cnlWZXJzaW9uID0gdXNlTm9kZVJlZ2lzdHJ5VmVyc2lvbigoc3RhdGUpID0+IHN0YXRlLnZlcnNpb24pO1xuICAgIGNvbnN0IHBhcmFtcyA9IHVzZVBhcmFtczx7IGlkOiBzdHJpbmcgfT4oKTtcbiAgICBjb25zdCBuYXZpZ2F0ZSA9IHVzZU5hdmlnYXRlKCk7XG4gICAgY29uc3QgW3NlYXJjaFBhcmFtc10gPSB1c2VTZWFyY2hQYXJhbXMoKTtcbiAgICBjb25zdCBwcm9qZWN0SWQgPSBwYXJhbXMuaWQgfHwgXCJcIjtcbiAgICBjb25zdCBsb2NhbEFnZW50Q29ubmVjdGVkID0gdXNlQWdlbnRTdG9yZSgoc3RhdGUpID0+IHN0YXRlLmNvbm5lY3RlZCk7XG4gICAgY29uc3QgbG9jYWxBZ2VudEFjdGl2aXR5ID0gdXNlQWdlbnRTdG9yZSgoc3RhdGUpID0+IHN0YXRlLmFjdGl2aXR5KTtcbiAgICBjb25zdCBsb2NhbEFnZW50RW5hYmxlZCA9IHVzZUFnZW50U3RvcmUoKHN0YXRlKSA9PiBzdGF0ZS5lbmFibGVkKTtcbiAgICBjb25zdCBmcmFnbWVudEJvb3RzdHJhcCA9IHVzZUFnZW50U3RvcmUoKHN0YXRlKSA9PiBzdGF0ZS5mcmFnbWVudEJvb3RzdHJhcCk7XG4gICAgY29uc3QgYWdlbnRQYW5lbE9wZW4gPSB1c2VBZ2VudFN0b3JlKChzdGF0ZSkgPT4gc3RhdGUucGFuZWxPcGVuKTtcbiAgICBjb25zdCB0b2dnbGVBZ2VudFBhbmVsID0gdXNlQWdlbnRTdG9yZSgoc3RhdGUpID0+IHN0YXRlLnRvZ2dsZVBhbmVsKTtcbiAgICBjb25zdCBvcGVuQWdlbnRQYW5lbCA9IHVzZUFnZW50U3RvcmUoKHN0YXRlKSA9PiBzdGF0ZS5vcGVuUGFuZWwpO1xuICAgIGNvbnN0IGNvbnRhaW5lclJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gICAgY29uc3QgaW1hZ2VJbnB1dFJlZiA9IHVzZVJlZjxIVE1MSW5wdXRFbGVtZW50PihudWxsKTtcbiAgICBjb25zdCB1cGxvYWRUYXJnZXRSZWYgPSB1c2VSZWY8eyBub2RlSWQ/OiBzdHJpbmc7IHBvc2l0aW9uPzogUG9zaXRpb24gfSB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IGNsaXBib2FyZFJlZiA9IHVzZVJlZjxDYW52YXNDbGlwYm9hcmQgfCBudWxsPihudWxsKTtcbiAgICBjb25zdCBoaXN0b3J5UmVmID0gdXNlUmVmPHsgcGFzdDogQ2FudmFzSGlzdG9yeUVudHJ5W107IGZ1dHVyZTogQ2FudmFzSGlzdG9yeUVudHJ5W10gfT4oeyBwYXN0OiBbXSwgZnV0dXJlOiBbXSB9KTtcbiAgICBjb25zdCBsYXN0SGlzdG9yeVJlZiA9IHVzZVJlZjxDYW52YXNIaXN0b3J5RW50cnkgfCBudWxsPihudWxsKTtcbiAgICBjb25zdCBoaXN0b3J5Q29tbWl0VGltZXJSZWYgPSB1c2VSZWY8UmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsPihudWxsKTtcbiAgICBjb25zdCB2aWV3cG9ydFNhdmVUaW1lclJlZiA9IHVzZVJlZjxSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IGFwcGx5aW5nSGlzdG9yeVJlZiA9IHVzZVJlZihmYWxzZSk7XG4gICAgY29uc3QgaGlzdG9yeVBhdXNlZFJlZiA9IHVzZVJlZihmYWxzZSk7XG4gICAgY29uc3QgZGlkSW5pdGlhbENlbnRlclJlZiA9IHVzZVJlZihmYWxzZSk7XG4gICAgY29uc3QgcmFmUmVmID0gdXNlUmVmPG51bWJlciB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IG5vZGVEcmFnZ2luZ1JlZiA9IHVzZVJlZihmYWxzZSk7XG4gICAgY29uc3QgZHJhZ1JlZiA9IHVzZVJlZjx7XG4gICAgICAgIGlzRHJhZ2dpbmdOb2RlOiBib29sZWFuO1xuICAgICAgICBoYXNNb3ZlZDogYm9vbGVhbjtcbiAgICAgICAgc3RhcnRYOiBudW1iZXI7XG4gICAgICAgIHN0YXJ0WTogbnVtYmVyO1xuICAgICAgICBpbml0aWFsU2VsZWN0ZWROb2RlczogeyBpZDogc3RyaW5nOyB4OiBudW1iZXI7IHk6IG51bWJlciB9W107XG4gICAgfT4oe1xuICAgICAgICBpc0RyYWdnaW5nTm9kZTogZmFsc2UsXG4gICAgICAgIGhhc01vdmVkOiBmYWxzZSxcbiAgICAgICAgc3RhcnRYOiAwLFxuICAgICAgICBzdGFydFk6IDAsXG4gICAgICAgIGluaXRpYWxTZWxlY3RlZE5vZGVzOiBbXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNvbmZpZyA9IHVzZUNvbmZpZ1N0b3JlKChzdGF0ZSkgPT4gc3RhdGUuY29uZmlnKTtcbiAgICBjb25zdCBlZmZlY3RpdmVDb25maWcgPSB1c2VFZmZlY3RpdmVDb25maWcoKTtcbiAgICBjb25zdCBpc0FpQ29uZmlnUmVhZHkgPSB1c2VDb25maWdTdG9yZSgoc3RhdGUpID0+IHN0YXRlLmlzQWlDb25maWdSZWFkeSk7XG4gICAgY29uc3Qgb3BlbkNvbmZpZ0RpYWxvZyA9IHVzZUNvbmZpZ1N0b3JlKChzdGF0ZSkgPT4gc3RhdGUub3BlbkNvbmZpZ0RpYWxvZyk7XG4gICAgY29uc3QgYWRkQXNzZXQgPSB1c2VBc3NldFN0b3JlKChzdGF0ZSkgPT4gc3RhdGUuYWRkQXNzZXQpO1xuICAgIGNvbnN0IGNsZWFudXBBc3NldEltYWdlcyA9IHVzZUFzc2V0U3RvcmUoKHN0YXRlKSA9PiBzdGF0ZS5jbGVhbnVwSW1hZ2VzKTtcbiAgICBjb25zdCBoeWRyYXRlZCA9IHVzZUNhbnZhc1N0b3JlKChzdGF0ZSkgPT4gc3RhdGUuaHlkcmF0ZWQpO1xuICAgIGNvbnN0IGNyZWF0ZVByb2plY3QgPSB1c2VDYW52YXNTdG9yZSgoc3RhdGUpID0+IHN0YXRlLmNyZWF0ZVByb2plY3QpO1xuICAgIGNvbnN0IG9wZW5Qcm9qZWN0ID0gdXNlQ2FudmFzU3RvcmUoKHN0YXRlKSA9PiBzdGF0ZS5vcGVuUHJvamVjdCk7XG4gICAgY29uc3QgdXBkYXRlUHJvamVjdCA9IHVzZUNhbnZhc1N0b3JlKChzdGF0ZSkgPT4gc3RhdGUudXBkYXRlUHJvamVjdCk7XG4gICAgY29uc3QgcmVuYW1lUHJvamVjdCA9IHVzZUNhbnZhc1N0b3JlKChzdGF0ZSkgPT4gc3RhdGUucmVuYW1lUHJvamVjdCk7XG4gICAgY29uc3QgZGVsZXRlUHJvamVjdHMgPSB1c2VDYW52YXNTdG9yZSgoc3RhdGUpID0+IHN0YXRlLmRlbGV0ZVByb2plY3RzKTtcbiAgICBjb25zdCBjdXJyZW50UHJvamVjdCA9IHVzZUNhbnZhc1N0b3JlKChzdGF0ZSkgPT4gc3RhdGUucHJvamVjdHMuZmluZCgocHJvamVjdCkgPT4gcHJvamVjdC5pZCA9PT0gcHJvamVjdElkKSk7XG4gICAgY29uc3QgdGhlbWUgPSBjYW52YXNUaGVtZXNbdXNlVGhlbWVTdG9yZSgoc3RhdGUpID0+IHN0YXRlLnRoZW1lKV07XG4gICAgY29uc3QgW25vZGVzLCBzZXROb2Rlc10gPSB1c2VTdGF0ZTxDYW52YXNOb2RlRGF0YVtdPihbXSk7XG4gICAgY29uc3QgW2Nvbm5lY3Rpb25zLCBzZXRDb25uZWN0aW9uc10gPSB1c2VTdGF0ZTxDYW52YXNDb25uZWN0aW9uW10+KFtdKTtcbiAgICBjb25zdCBbY2hhdFNlc3Npb25zLCBzZXRDaGF0U2Vzc2lvbnNdID0gdXNlU3RhdGU8Q2FudmFzQXNzaXN0YW50U2Vzc2lvbltdPihbXSk7XG4gICAgY29uc3QgW2FjdGl2ZUNoYXRJZCwgc2V0QWN0aXZlQ2hhdElkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IFt2aWV3cG9ydCwgc2V0Vmlld3BvcnRdID0gdXNlU3RhdGU8Vmlld3BvcnRUcmFuc2Zvcm0+KHsgeDogMCwgeTogMCwgazogMSB9KTtcbiAgICBjb25zdCBbY2FudmFzVG9vbCwgc2V0Q2FudmFzVG9vbF0gPSB1c2VTdGF0ZTxcInNlbGVjdFwiIHwgXCJwYW5cIj4oXCJwYW5cIik7XG4gICAgY29uc3QgW3NpemUsIHNldFNpemVdID0gdXNlU3RhdGUoeyB3aWR0aDogMTIwMCwgaGVpZ2h0OiA3MjAgfSk7XG4gICAgY29uc3QgW3NlbGVjdGVkTm9kZUlkcywgc2V0U2VsZWN0ZWROb2RlSWRzXSA9IHVzZVN0YXRlPFNldDxzdHJpbmc+PihuZXcgU2V0KCkpO1xuICAgIGNvbnN0IFtzZWxlY3RlZENvbm5lY3Rpb25JZCwgc2V0U2VsZWN0ZWRDb25uZWN0aW9uSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gICAgY29uc3QgW2hvdmVyZWROb2RlSWQsIHNldEhvdmVyZWROb2RlSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gICAgY29uc3QgW2Nvbm5lY3RpbmdQYXJhbXMsIHNldENvbm5lY3RpbmdQYXJhbXNdID0gdXNlU3RhdGU8Q29ubmVjdGlvbkhhbmRsZSB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IFtjb25uZWN0aW9uVGFyZ2V0Tm9kZUlkLCBzZXRDb25uZWN0aW9uVGFyZ2V0Tm9kZUlkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IFtwZW5kaW5nQ29ubmVjdGlvbkNyZWF0ZSwgc2V0UGVuZGluZ0Nvbm5lY3Rpb25DcmVhdGVdID0gdXNlU3RhdGU8UGVuZGluZ0Nvbm5lY3Rpb25DcmVhdGUgfCBudWxsPihudWxsKTtcbiAgICBjb25zdCBbbW91c2VXb3JsZCwgc2V0TW91c2VXb3JsZF0gPSB1c2VTdGF0ZTxQb3NpdGlvbj4oeyB4OiAwLCB5OiAwIH0pO1xuICAgIGNvbnN0IFtzZWxlY3Rpb25Cb3gsIHNldFNlbGVjdGlvbkJveF0gPSB1c2VTdGF0ZTxTZWxlY3Rpb25Cb3ggfCBudWxsPihudWxsKTtcbiAgICBjb25zdCBbY29udGV4dE1lbnUsIHNldENvbnRleHRNZW51XSA9IHVzZVN0YXRlPENvbnRleHRNZW51U3RhdGUgfCBudWxsPihudWxsKTtcbiAgICBjb25zdCBbbm9kZUNyZWF0ZVBvc2l0aW9uLCBzZXROb2RlQ3JlYXRlUG9zaXRpb25dID0gdXNlU3RhdGU8UG9zaXRpb24gfCBudWxsPihudWxsKTtcbiAgICBjb25zdCBbcnVubmluZ05vZGVJZCwgc2V0UnVubmluZ05vZGVJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgICBjb25zdCBbaXNNaW5pTWFwT3Blbiwgc2V0SXNNaW5pTWFwT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW2JhY2tncm91bmRNb2RlLCBzZXRCYWNrZ3JvdW5kTW9kZV0gPSB1c2VTdGF0ZTxDYW52YXNCYWNrZ3JvdW5kTW9kZT4oXCJsaW5lc1wiKTtcbiAgICBjb25zdCBbc2hvd0ltYWdlSW5mbywgc2V0U2hvd0ltYWdlSW5mb10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW2NsZWFyQ29uZmlybU9wZW4sIHNldENsZWFyQ29uZmlybU9wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xuICAgIGNvbnN0IFthc3NldFBpY2tlck9wZW4sIHNldEFzc2V0UGlja2VyT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW3Byb2plY3RMb2FkZWQsIHNldFByb2plY3RMb2FkZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICAgIGNvbnN0IFt0b29sYmFyTm9kZUlkLCBzZXRUb29sYmFyTm9kZUlkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IFtub2RlSW1hZ2VTZXR0aW5nc09wZW4sIHNldE5vZGVJbWFnZVNldHRpbmdzT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW2RpYWxvZ05vZGVJZCwgc2V0RGlhbG9nTm9kZUlkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IFtpbmZvTm9kZUlkLCBzZXRJbmZvTm9kZUlkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IFtwbHVnaW5NYW5hZ2VyT3Blbiwgc2V0UGx1Z2luTWFuYWdlck9wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xuICAgIGNvbnN0IFtjcm9wTm9kZUlkLCBzZXRDcm9wTm9kZUlkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IFttYXNrRWRpdE5vZGVJZCwgc2V0TWFza0VkaXROb2RlSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gICAgY29uc3QgW3NwbGl0Tm9kZUlkLCBzZXRTcGxpdE5vZGVJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgICBjb25zdCBbdXBzY2FsZU5vZGVJZCwgc2V0VXBzY2FsZU5vZGVJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgICBjb25zdCBbc3VwZXJSZXNvbHZlTm9kZUlkLCBzZXRTdXBlclJlc29sdmVOb2RlSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gICAgY29uc3QgW2FuZ2xlTm9kZUlkLCBzZXRBbmdsZU5vZGVJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgICBjb25zdCBbcHJldmlld05vZGVJZCwgc2V0UHJldmlld05vZGVJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgICBjb25zdCBbcHJldmlld0ltYWdlSWQsIHNldFByZXZpZXdJbWFnZUlkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IFt0aXRsZUVkaXRpbmcsIHNldFRpdGxlRWRpdGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW3RpdGxlRHJhZnQsIHNldFRpdGxlRHJhZnRdID0gdXNlU3RhdGUoXCJcIik7XG4gICAgY29uc3QgW2hpc3RvcnlTdGF0ZSwgc2V0SGlzdG9yeVN0YXRlXSA9IHVzZVN0YXRlKHsgY2FuVW5kbzogZmFsc2UsIGNhblJlZG86IGZhbHNlIH0pO1xuICAgIGNvbnN0IFtleHBhbmRlZEJhdGNoTm9kZUlkcywgc2V0RXhwYW5kZWRCYXRjaE5vZGVJZHNdID0gdXNlU3RhdGU8U2V0PHN0cmluZz4+KG5ldyBTZXQoKSk7XG4gICAgY29uc3QgW2lzTm9kZURyYWdnaW5nLCBzZXRJc05vZGVEcmFnZ2luZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW2lzTm9kZVJlc2l6aW5nLCBzZXRJc05vZGVSZXNpemluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW2Ryb3BUYXJnZXRHcm91cElkLCBzZXREcm9wVGFyZ2V0R3JvdXBJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgICBjb25zdCBbcmVmZXJlbmNlUGlja2VyTm9kZUlkLCBzZXRSZWZlcmVuY2VQaWNrZXJOb2RlSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG5cbiAgICBjb25zdCBub2Rlc1JlZiA9IHVzZVJlZihub2Rlcyk7XG4gICAgY29uc3QgY29ubmVjdGlvbnNSZWYgPSB1c2VSZWYoY29ubmVjdGlvbnMpO1xuICAgIGNvbnN0IHNlbGVjdGVkTm9kZUlkc1JlZiA9IHVzZVJlZihzZWxlY3RlZE5vZGVJZHMpO1xuICAgIGNvbnN0IHZpZXdwb3J0UmVmID0gdXNlUmVmKHZpZXdwb3J0KTtcbiAgICBjb25zdCBmb2N1c0FuaW1SZWYgPSB1c2VSZWY8bnVtYmVyIHwgbnVsbD4obnVsbCk7XG4gICAgY29uc3QgZ2VuZXJhdGVOb2RlUmVmID0gdXNlUmVmPCgobm9kZUlkOiBzdHJpbmcsIG1vZGU6IENhbnZhc05vZGVHZW5lcmF0aW9uTW9kZSwgcHJvbXB0OiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD4pIHwgbnVsbD4obnVsbCk7XG4gICAgY29uc3QgY29ubmVjdGluZ1BhcmFtc1JlZiA9IHVzZVJlZihjb25uZWN0aW5nUGFyYW1zKTtcbiAgICBjb25zdCBjb25uZWN0aW9uVGFyZ2V0Tm9kZUlkUmVmID0gdXNlUmVmKGNvbm5lY3Rpb25UYXJnZXROb2RlSWQpO1xuICAgIGNvbnN0IHNlbGVjdGlvbkJveFJlZiA9IHVzZVJlZihzZWxlY3Rpb25Cb3gpO1xuICAgIGNvbnN0IHBlbmRpbmdDb25uZWN0aW9uQ3JlYXRlUmVmID0gdXNlUmVmKHBlbmRpbmdDb25uZWN0aW9uQ3JlYXRlKTtcbiAgICBjb25zdCBnZW5lcmF0aW9uUmVxdWVzdHNSZWYgPSB1c2VSZWYobmV3IE1hcDxzdHJpbmcsIENhbnZhc0dlbmVyYXRpb25SZXF1ZXN0PigpKTtcblxuICAgIGNvbnN0IGNyZWF0ZUhpc3RvcnlFbnRyeSA9IHVzZUNhbGxiYWNrKFxuICAgICAgICAoKTogQ2FudmFzSGlzdG9yeUVudHJ5ID0+ICh7XG4gICAgICAgICAgICBub2Rlczogbm9kZXNSZWYuY3VycmVudCxcbiAgICAgICAgICAgIGNvbm5lY3Rpb25zOiBjb25uZWN0aW9uc1JlZi5jdXJyZW50LFxuICAgICAgICAgICAgY2hhdFNlc3Npb25zLFxuICAgICAgICAgICAgYWN0aXZlQ2hhdElkLFxuICAgICAgICAgICAgYmFja2dyb3VuZE1vZGUsXG4gICAgICAgICAgICBzaG93SW1hZ2VJbmZvLFxuICAgICAgICB9KSxcbiAgICAgICAgW2FjdGl2ZUNoYXRJZCwgYmFja2dyb3VuZE1vZGUsIGNoYXRTZXNzaW9ucywgc2hvd0ltYWdlSW5mb10sXG4gICAgKTtcblxuICAgIGNvbnN0IGNsZWFudXBDYW52YXNGaWxlcyA9IHVzZUNhbGxiYWNrKFxuICAgICAgICAoZXh0cmE/OiB1bmtub3duKSA9PiB7XG4gICAgICAgICAgICBjbGVhbnVwQXNzZXRJbWFnZXMoeyBleHRyYSwgaGlzdG9yeTogaGlzdG9yeVJlZi5jdXJyZW50LCBsYXN0SGlzdG9yeTogbGFzdEhpc3RvcnlSZWYuY3VycmVudCB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgW2NsZWFudXBBc3NldEltYWdlc10sXG4gICAgKTtcblxuICAgIGNvbnN0IHN0YXJ0R2VuZXJhdGlvblJlcXVlc3QgPSB1c2VDYWxsYmFjaygodGFyZ2V0Tm9kZUlkOiBzdHJpbmcsIG9yaWdpbk5vZGVJZDogc3RyaW5nLCBydW5uaW5nSWQgPSBvcmlnaW5Ob2RlSWQsIGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCkpID0+IHtcbiAgICAgICAgY29uc3QgcHJldmlvdXMgPSBnZW5lcmF0aW9uUmVxdWVzdHNSZWYuY3VycmVudC5nZXQodGFyZ2V0Tm9kZUlkKTtcbiAgICAgICAgaWYgKHByZXZpb3VzPy5jb250cm9sbGVyICE9PSBjb250cm9sbGVyKSBwcmV2aW91cz8uY29udHJvbGxlci5hYm9ydCgpO1xuICAgICAgICBnZW5lcmF0aW9uUmVxdWVzdHNSZWYuY3VycmVudC5zZXQodGFyZ2V0Tm9kZUlkLCB7IHRhcmdldE5vZGVJZCwgb3JpZ2luTm9kZUlkLCBydW5uaW5nTm9kZUlkOiBydW5uaW5nSWQsIGNvbnRyb2xsZXIgfSk7XG4gICAgICAgIHJldHVybiBjb250cm9sbGVyO1xuICAgIH0sIFtdKTtcblxuICAgIGNvbnN0IGZpbmlzaEdlbmVyYXRpb25SZXF1ZXN0ID0gdXNlQ2FsbGJhY2soKHRhcmdldE5vZGVJZDogc3RyaW5nLCBjb250cm9sbGVyOiBBYm9ydENvbnRyb2xsZXIpID0+IHtcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IGdlbmVyYXRpb25SZXF1ZXN0c1JlZi5jdXJyZW50LmdldCh0YXJnZXROb2RlSWQpO1xuICAgICAgICBpZiAocmVxdWVzdD8uY29udHJvbGxlciA9PT0gY29udHJvbGxlcikgZ2VuZXJhdGlvblJlcXVlc3RzUmVmLmN1cnJlbnQuZGVsZXRlKHRhcmdldE5vZGVJZCk7XG4gICAgfSwgW10pO1xuXG4gICAgY29uc3Qgc3RvcEdlbmVyYXRpb25CeVJ1bm5pbmdJZCA9IHVzZUNhbGxiYWNrKChydW5uaW5nSWQ6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBhZmZlY3RlZE5vZGVJZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgZ2VuZXJhdGlvblJlcXVlc3RzUmVmLmN1cnJlbnQuZm9yRWFjaCgocmVxdWVzdCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcXVlc3QucnVubmluZ05vZGVJZCAhPT0gcnVubmluZ0lkKSByZXR1cm47XG4gICAgICAgICAgICByZXF1ZXN0LmNvbnRyb2xsZXIuYWJvcnQoKTtcbiAgICAgICAgICAgIGdlbmVyYXRpb25SZXF1ZXN0c1JlZi5jdXJyZW50LmRlbGV0ZShyZXF1ZXN0LnRhcmdldE5vZGVJZCk7XG4gICAgICAgICAgICBhZmZlY3RlZE5vZGVJZHMuYWRkKHJlcXVlc3QudGFyZ2V0Tm9kZUlkKTtcbiAgICAgICAgICAgIGFmZmVjdGVkTm9kZUlkcy5hZGQocmVxdWVzdC5vcmlnaW5Ob2RlSWQpO1xuICAgICAgICB9KTtcbiAgICAgICAgc2V0UnVubmluZ05vZGVJZCgoY3VycmVudCkgPT4gKGN1cnJlbnQgPT09IHJ1bm5pbmdJZCA/IG51bGwgOiBjdXJyZW50KSk7XG4gICAgICAgIGlmICghYWZmZWN0ZWROb2RlSWRzLnNpemUpIHJldHVybjtcbiAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+XG4gICAgICAgICAgICBwcmV2Lm1hcCgobm9kZSkgPT5cbiAgICAgICAgICAgICAgICBhZmZlY3RlZE5vZGVJZHMuaGFzKG5vZGUuaWQpICYmIG5vZGUubWV0YWRhdGE/LnN0YXR1cyA9PT0gTk9ERV9TVEFUVVNfTE9BRElOR1xuICAgICAgICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLi4ubm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLm5vZGUubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IE5PREVfU1RBVFVTX0lETEUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvckRldGFpbHM6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlczogbm9kZS5tZXRhZGF0YS5pbWFnZXM/Lm1hcCgoaW1hZ2UpID0+IChpbWFnZS5zdGF0dXMgPT09IE5PREVfU1RBVFVTX0xPQURJTkcgPyB7IC4uLmltYWdlLCBzdGF0dXM6IE5PREVfU1RBVFVTX0VSUk9SLCBlcnJvckRldGFpbHM6IHQoXCJjb21tb24ucmVxdWVzdENhbmNlbGVkXCIpIH0gOiBpbWFnZSkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dHM6IG5vZGUubWV0YWRhdGEudGV4dHM/Lm1hcCgodGV4dCkgPT4gKHRleHQuc3RhdHVzID09PSBOT0RFX1NUQVRVU19MT0FESU5HID8geyAuLi50ZXh0LCBzdGF0dXM6IE5PREVfU1RBVFVTX0VSUk9SLCBlcnJvckRldGFpbHM6IHQoXCJjb21tb24ucmVxdWVzdENhbmNlbGVkXCIpIH0gOiB0ZXh0KSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICA6IG5vZGUsXG4gICAgICAgICAgICApLFxuICAgICAgICApO1xuICAgIH0sIFt0XSk7XG5cbiAgICBjb25zdCBjb25maXJtU3RvcEdlbmVyYXRpb24gPSB1c2VDYWxsYmFjayhcbiAgICAgICAgKG5vZGVJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBtb2RhbC5jb25maXJtKHtcbiAgICAgICAgICAgICAgICB0aXRsZTogdChcImNhbnZhcy5wcm9qZWN0UGFnZS5zdG9wVGl0bGVcIiksXG4gICAgICAgICAgICAgICAgY29udGVudDogdChcImNhbnZhcy5wcm9qZWN0UGFnZS5zdG9wRGVzY3JpcHRpb25cIiksXG4gICAgICAgICAgICAgICAgb2tUZXh0OiB0KFwiY2FudmFzLnByb2plY3RQYWdlLnN0b3BcIiksXG4gICAgICAgICAgICAgICAgY2FuY2VsVGV4dDogdChcImNhbnZhcy5wcm9qZWN0UGFnZS5jb250aW51ZVwiKSxcbiAgICAgICAgICAgICAgICBva0J1dHRvblByb3BzOiB7IGRhbmdlcjogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgIG9uT2s6ICgpID0+IHN0b3BHZW5lcmF0aW9uQnlSdW5uaW5nSWQobm9kZUlkKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBbbW9kYWwsIHN0b3BHZW5lcmF0aW9uQnlSdW5uaW5nSWQsIHRdLFxuICAgICk7XG5cbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAoIWh5ZHJhdGVkKSByZXR1cm47XG4gICAgICAgIHNldFByb2plY3RMb2FkZWQoZmFsc2UpO1xuICAgICAgICBjb25zdCBwcm9qZWN0ID0gb3BlblByb2plY3QocHJvamVjdElkKTtcbiAgICAgICAgaWYgKCFwcm9qZWN0KSB7XG4gICAgICAgICAgICBuYXZpZ2F0ZShcIi9jYW52YXNcIiwgeyByZXBsYWNlOiB0cnVlIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzdG9yZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3RvcmVkTm9kZXMgPSBhd2FpdCBoeWRyYXRlQ2FudmFzSW1hZ2VzKHJlc2V0SW50ZXJydXB0ZWRHZW5lcmF0aW9uKHByb2plY3Qubm9kZXMpKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3RvcmVkU2Vzc2lvbnMgPSBhd2FpdCBoeWRyYXRlQXNzaXN0YW50SW1hZ2VzKHByb2plY3QuY2hhdFNlc3Npb25zIHx8IFtdKTtcbiAgICAgICAgICAgIHNldE5vZGVzKHJlc3RvcmVkTm9kZXMpO1xuICAgICAgICAgICAgc2V0Q29ubmVjdGlvbnMocHJvamVjdC5jb25uZWN0aW9ucyk7XG4gICAgICAgICAgICBzZXRDaGF0U2Vzc2lvbnMocmVzdG9yZWRTZXNzaW9ucyk7XG4gICAgICAgICAgICBzZXRBY3RpdmVDaGF0SWQocHJvamVjdC5hY3RpdmVDaGF0SWQgfHwgbnVsbCk7XG4gICAgICAgICAgICBzZXRCYWNrZ3JvdW5kTW9kZShwcm9qZWN0LmJhY2tncm91bmRNb2RlKTtcbiAgICAgICAgICAgIHNldFNob3dJbWFnZUluZm8ocHJvamVjdC5zaG93SW1hZ2VJbmZvIHx8IGZhbHNlKTtcbiAgICAgICAgICAgIHNldFZpZXdwb3J0KHByb2plY3Qudmlld3BvcnQpO1xuICAgICAgICAgICAgaGlzdG9yeVJlZi5jdXJyZW50ID0geyBwYXN0OiBbXSwgZnV0dXJlOiBbXSB9O1xuICAgICAgICAgICAgaWYgKGhpc3RvcnlDb21taXRUaW1lclJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGhpc3RvcnlDb21taXRUaW1lclJlZi5jdXJyZW50KTtcbiAgICAgICAgICAgICAgICBoaXN0b3J5Q29tbWl0VGltZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYXN0SGlzdG9yeVJlZi5jdXJyZW50ID0ge1xuICAgICAgICAgICAgICAgIG5vZGVzOiByZXN0b3JlZE5vZGVzLFxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zOiBwcm9qZWN0LmNvbm5lY3Rpb25zLFxuICAgICAgICAgICAgICAgIGNoYXRTZXNzaW9uczogcmVzdG9yZWRTZXNzaW9ucyxcbiAgICAgICAgICAgICAgICBhY3RpdmVDaGF0SWQ6IHByb2plY3QuYWN0aXZlQ2hhdElkIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZE1vZGU6IHByb2plY3QuYmFja2dyb3VuZE1vZGUsXG4gICAgICAgICAgICAgICAgc2hvd0ltYWdlSW5mbzogcHJvamVjdC5zaG93SW1hZ2VJbmZvIHx8IGZhbHNlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHNldEhpc3RvcnlTdGF0ZSh7IGNhblVuZG86IGZhbHNlLCBjYW5SZWRvOiBmYWxzZSB9KTtcbiAgICAgICAgICAgIHNldFByb2plY3RMb2FkZWQodHJ1ZSk7XG4gICAgICAgIH07XG4gICAgICAgIHZvaWQgcmVzdG9yZSgpO1xuICAgIH0sIFtoeWRyYXRlZCwgbmF2aWdhdGUsIG9wZW5Qcm9qZWN0LCBwcm9qZWN0SWRdKTtcblxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGlmICghcHJvamVjdExvYWRlZCB8fCAhW1wibmV3XCIsIFwicmVjZW50XCIsIFwiY2hvb3NlXCJdLmluY2x1ZGVzKHNlYXJjaFBhcmFtcy5nZXQoXCJtb2RlXCIpIHx8IFwiXCIpKSByZXR1cm47XG4gICAgICAgIGlmICghc2VhcmNoUGFyYW1zLmhhcyhcImFnZW50VXJsXCIpICYmICFsb2NhbEFnZW50RW5hYmxlZCAmJiAhZnJhZ21lbnRCb290c3RyYXApIG9wZW5BZ2VudFBhbmVsKCk7XG4gICAgfSwgW2ZyYWdtZW50Qm9vdHN0cmFwLCBsb2NhbEFnZW50RW5hYmxlZCwgb3BlbkFnZW50UGFuZWwsIHByb2plY3RMb2FkZWQsIHNlYXJjaFBhcmFtc10pO1xuXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgaWYgKCFwcm9qZWN0TG9hZGVkIHx8IGFwcGx5aW5nSGlzdG9yeVJlZi5jdXJyZW50IHx8IGhpc3RvcnlQYXVzZWRSZWYuY3VycmVudCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBuZXh0ID0gY3JlYXRlSGlzdG9yeUVudHJ5KCk7XG4gICAgICAgIGNvbnN0IHByZXZpb3VzID0gbGFzdEhpc3RvcnlSZWYuY3VycmVudDtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgcHJldmlvdXM/Lm5vZGVzID09PSBuZXh0Lm5vZGVzICYmXG4gICAgICAgICAgICBwcmV2aW91cy5jb25uZWN0aW9ucyA9PT0gbmV4dC5jb25uZWN0aW9ucyAmJlxuICAgICAgICAgICAgcHJldmlvdXMuY2hhdFNlc3Npb25zID09PSBuZXh0LmNoYXRTZXNzaW9ucyAmJlxuICAgICAgICAgICAgcHJldmlvdXMuYWN0aXZlQ2hhdElkID09PSBuZXh0LmFjdGl2ZUNoYXRJZCAmJlxuICAgICAgICAgICAgcHJldmlvdXMuYmFja2dyb3VuZE1vZGUgPT09IG5leHQuYmFja2dyb3VuZE1vZGUgJiZcbiAgICAgICAgICAgIHByZXZpb3VzLnNob3dJbWFnZUluZm8gPT09IG5leHQuc2hvd0ltYWdlSW5mb1xuICAgICAgICApXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgaWYgKGhpc3RvcnlDb21taXRUaW1lclJlZi5jdXJyZW50KSBjbGVhclRpbWVvdXQoaGlzdG9yeUNvbW1pdFRpbWVyUmVmLmN1cnJlbnQpO1xuICAgICAgICBoaXN0b3J5Q29tbWl0VGltZXJSZWYuY3VycmVudCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudCA9IGNyZWF0ZUhpc3RvcnlFbnRyeSgpO1xuICAgICAgICAgICAgY29uc3QgbGFzdCA9IGxhc3RIaXN0b3J5UmVmLmN1cnJlbnQ7XG4gICAgICAgICAgICBpZiAoIWxhc3QpIHJldHVybjtcbiAgICAgICAgICAgIGhpc3RvcnlSZWYuY3VycmVudC5wYXN0ID0gWy4uLmhpc3RvcnlSZWYuY3VycmVudC5wYXN0LnNsaWNlKC00OSksIGxhc3RdO1xuICAgICAgICAgICAgaGlzdG9yeVJlZi5jdXJyZW50LmZ1dHVyZSA9IFtdO1xuICAgICAgICAgICAgc2V0SGlzdG9yeVN0YXRlKHsgY2FuVW5kbzogdHJ1ZSwgY2FuUmVkbzogZmFsc2UgfSk7XG4gICAgICAgICAgICBsYXN0SGlzdG9yeVJlZi5jdXJyZW50ID0gY3VycmVudDtcbiAgICAgICAgICAgIGhpc3RvcnlDb21taXRUaW1lclJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgfSwgMTgwKTtcblxuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGhpc3RvcnlDb21taXRUaW1lclJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGhpc3RvcnlDb21taXRUaW1lclJlZi5jdXJyZW50KTtcbiAgICAgICAgICAgICAgICBoaXN0b3J5Q29tbWl0VGltZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSwgW2FjdGl2ZUNoYXRJZCwgYmFja2dyb3VuZE1vZGUsIGNoYXRTZXNzaW9ucywgY29ubmVjdGlvbnMsIGNyZWF0ZUhpc3RvcnlFbnRyeSwgbm9kZXMsIHByb2plY3RMb2FkZWQsIHNob3dJbWFnZUluZm9dKTtcblxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGlmICghcHJvamVjdExvYWRlZCB8fCBoaXN0b3J5UGF1c2VkUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgdXBkYXRlUHJvamVjdChwcm9qZWN0SWQsIHsgbm9kZXMsIGNvbm5lY3Rpb25zLCBjaGF0U2Vzc2lvbnMsIGFjdGl2ZUNoYXRJZCwgYmFja2dyb3VuZE1vZGUsIHNob3dJbWFnZUluZm8gfSk7XG4gICAgfSwgW2FjdGl2ZUNoYXRJZCwgYmFja2dyb3VuZE1vZGUsIGNoYXRTZXNzaW9ucywgY29ubmVjdGlvbnMsIG5vZGVzLCBwcm9qZWN0SWQsIHByb2plY3RMb2FkZWQsIHNob3dJbWFnZUluZm8sIHVwZGF0ZVByb2plY3RdKTtcblxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGlmICghZGlhbG9nTm9kZUlkKSBzZXROb2RlSW1hZ2VTZXR0aW5nc09wZW4oZmFsc2UpO1xuICAgIH0sIFtkaWFsb2dOb2RlSWRdKTtcblxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGlmICghcHJvamVjdExvYWRlZCkgcmV0dXJuO1xuICAgICAgICBpZiAodmlld3BvcnRTYXZlVGltZXJSZWYuY3VycmVudCkgY2xlYXJUaW1lb3V0KHZpZXdwb3J0U2F2ZVRpbWVyUmVmLmN1cnJlbnQpO1xuICAgICAgICB2aWV3cG9ydFNhdmVUaW1lclJlZi5jdXJyZW50ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB1cGRhdGVQcm9qZWN0KHByb2plY3RJZCwgeyB2aWV3cG9ydDogdmlld3BvcnRSZWYuY3VycmVudCB9KTtcbiAgICAgICAgICAgIHZpZXdwb3J0U2F2ZVRpbWVyUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgICB9LCA1MDApO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHZpZXdwb3J0U2F2ZVRpbWVyUmVmLmN1cnJlbnQpIGNsZWFyVGltZW91dCh2aWV3cG9ydFNhdmVUaW1lclJlZi5jdXJyZW50KTtcbiAgICAgICAgfTtcbiAgICB9LCBbcHJvamVjdElkLCBwcm9qZWN0TG9hZGVkLCB1cGRhdGVQcm9qZWN0LCB2aWV3cG9ydF0pO1xuXG4gICAgdXNlTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICAgICAgbm9kZXNSZWYuY3VycmVudCA9IG5vZGVzO1xuICAgICAgICBjb25uZWN0aW9uc1JlZi5jdXJyZW50ID0gY29ubmVjdGlvbnM7XG4gICAgICAgIHNlbGVjdGVkTm9kZUlkc1JlZi5jdXJyZW50ID0gc2VsZWN0ZWROb2RlSWRzO1xuICAgICAgICB2aWV3cG9ydFJlZi5jdXJyZW50ID0gdmlld3BvcnQ7XG4gICAgICAgIGNvbm5lY3RpbmdQYXJhbXNSZWYuY3VycmVudCA9IGNvbm5lY3RpbmdQYXJhbXM7XG4gICAgICAgIGNvbm5lY3Rpb25UYXJnZXROb2RlSWRSZWYuY3VycmVudCA9IGNvbm5lY3Rpb25UYXJnZXROb2RlSWQ7XG4gICAgICAgIHBlbmRpbmdDb25uZWN0aW9uQ3JlYXRlUmVmLmN1cnJlbnQgPSBwZW5kaW5nQ29ubmVjdGlvbkNyZWF0ZTtcbiAgICB9LCBbbm9kZXMsIGNvbm5lY3Rpb25zLCBzZWxlY3RlZE5vZGVJZHMsIHZpZXdwb3J0LCBjb25uZWN0aW5nUGFyYW1zLCBjb25uZWN0aW9uVGFyZ2V0Tm9kZUlkLCBwZW5kaW5nQ29ubmVjdGlvbkNyZWF0ZV0pO1xuXG4gICAgdXNlTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICAgICAgc2VsZWN0aW9uQm94UmVmLmN1cnJlbnQgPSBzZWxlY3Rpb25Cb3g7XG4gICAgfSwgW3NlbGVjdGlvbkJveF0pO1xuXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgY29uc3QgZWwgPSBjb250YWluZXJSZWYuY3VycmVudDtcbiAgICAgICAgaWYgKCFlbCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHVwZGF0ZVNpemUgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICBzZXRTaXplKHsgd2lkdGg6IHJlY3Qud2lkdGgsIGhlaWdodDogcmVjdC5oZWlnaHQgfSk7XG4gICAgICAgICAgICBpZiAoIWRpZEluaXRpYWxDZW50ZXJSZWYuY3VycmVudCkge1xuICAgICAgICAgICAgICAgIGRpZEluaXRpYWxDZW50ZXJSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2V0Vmlld3BvcnQoeyB4OiByZWN0LndpZHRoIC8gMiwgeTogcmVjdC5oZWlnaHQgLyAyLCBrOiAxIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHVwZGF0ZVNpemUoKTtcbiAgICAgICAgY29uc3QgcmVzaXplT2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIodXBkYXRlU2l6ZSk7XG4gICAgICAgIHJlc2l6ZU9ic2VydmVyLm9ic2VydmUoZWwpO1xuICAgICAgICByZXR1cm4gKCkgPT4gcmVzaXplT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgIH0sIFtdKTtcblxuICAgIGNvbnN0IHNjcmVlblRvQ2FudmFzID0gdXNlQ2FsbGJhY2soKGNsaWVudFg6IG51bWJlciwgY2xpZW50WTogbnVtYmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlY3QgPSBjb250YWluZXJSZWYuY3VycmVudD8uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRWaWV3cG9ydCA9IHZpZXdwb3J0UmVmLmN1cnJlbnQ7XG4gICAgICAgIGNvbnN0IGxvY2FsWCA9IGNsaWVudFggLSAocmVjdD8ubGVmdCB8fCAwKTtcbiAgICAgICAgY29uc3QgbG9jYWxZID0gY2xpZW50WSAtIChyZWN0Py50b3AgfHwgMCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IChsb2NhbFggLSBjdXJyZW50Vmlld3BvcnQueCkgLyBjdXJyZW50Vmlld3BvcnQuayxcbiAgICAgICAgICAgIHk6IChsb2NhbFkgLSBjdXJyZW50Vmlld3BvcnQueSkgLyBjdXJyZW50Vmlld3BvcnQuayxcbiAgICAgICAgfTtcbiAgICB9LCBbXSk7XG5cbiAgICBjb25zdCBnZXRDYW52YXNDZW50ZXIgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlY3QgPSBjb250YWluZXJSZWYuY3VycmVudD8uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHJldHVybiBzY3JlZW5Ub0NhbnZhcygocmVjdD8ubGVmdCB8fCAwKSArIChyZWN0Py53aWR0aCB8fCBzaXplLndpZHRoKSAvIDIsIChyZWN0Py50b3AgfHwgMCkgKyAocmVjdD8uaGVpZ2h0IHx8IHNpemUuaGVpZ2h0KSAvIDIpO1xuICAgIH0sIFtzY3JlZW5Ub0NhbnZhcywgc2l6ZS5oZWlnaHQsIHNpemUud2lkdGhdKTtcblxuICAgIGNvbnN0IHNldENvbm5lY3RpbmcgPSB1c2VDYWxsYmFjaygobmV4dDogQ29ubmVjdGlvbkhhbmRsZSB8IG51bGwpID0+IHtcbiAgICAgICAgY29ubmVjdGluZ1BhcmFtc1JlZi5jdXJyZW50ID0gbmV4dDtcbiAgICAgICAgc2V0Q29ubmVjdGluZ1BhcmFtcyhuZXh0KTtcbiAgICAgICAgaWYgKCFuZXh0KSB7XG4gICAgICAgICAgICBjb25uZWN0aW9uVGFyZ2V0Tm9kZUlkUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgICAgICAgc2V0Q29ubmVjdGlvblRhcmdldE5vZGVJZChudWxsKTtcbiAgICAgICAgfVxuICAgIH0sIFtdKTtcblxuICAgIGNvbnN0IGtlZXBOb2RlVG9vbGJhciA9IHVzZUNhbGxiYWNrKFxuICAgICAgICAobm9kZUlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmIChub2RlRHJhZ2dpbmdSZWYuY3VycmVudCB8fCBub2RlSW1hZ2VTZXR0aW5nc09wZW4gfHwgIXNlbGVjdGVkTm9kZUlkc1JlZi5jdXJyZW50Lmhhcyhub2RlSWQpKSByZXR1cm47XG4gICAgICAgICAgICBzZXRUb29sYmFyTm9kZUlkKG5vZGVJZCk7XG4gICAgICAgIH0sXG4gICAgICAgIFtub2RlSW1hZ2VTZXR0aW5nc09wZW5dLFxuICAgICk7XG5cbiAgICBjb25zdCBoaWRlTm9kZVRvb2xiYXIgPSB1c2VDYWxsYmFjaygoKSA9PiB7fSwgW10pO1xuXG4gICAgY29uc3QgY29ubmVjdE5vZGVzID0gdXNlQ2FsbGJhY2soXG4gICAgICAgIChjdXJyZW50OiBDb25uZWN0aW9uSGFuZGxlLCB0YXJnZXROb2RlSWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnQubm9kZUlkID09PSB0YXJnZXROb2RlSWQpIHJldHVybjtcblxuICAgICAgICAgICAgY29uc3QgY29ubmVjdGlvbiA9IG5vcm1hbGl6ZUNvbm5lY3Rpb24oY3VycmVudC5ub2RlSWQsIHRhcmdldE5vZGVJZCwgbm9kZXNSZWYuY3VycmVudCwgY3VycmVudC5oYW5kbGVUeXBlKTtcbiAgICAgICAgICAgIGlmICghY29ubmVjdGlvbikge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2Uud2FybmluZyh0KFwiY2FudmFzLnByb2plY3RQYWdlLmNvbmZpZ0Nvbm5lY3Rpb25cIikpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHsgZnJvbU5vZGVJZCwgdG9Ob2RlSWQgfSA9IGNvbm5lY3Rpb247XG4gICAgICAgICAgICBjb25zdCBleGlzdHMgPSBjb25uZWN0aW9uc1JlZi5jdXJyZW50LnNvbWUoKGNvbm4pID0+IGNvbm4uZnJvbU5vZGVJZCA9PT0gZnJvbU5vZGVJZCAmJiBjb25uLnRvTm9kZUlkID09PSB0b05vZGVJZCk7XG4gICAgICAgICAgICBpZiAoIWV4aXN0cykge1xuICAgICAgICAgICAgICAgIHNldENvbm5lY3Rpb25zKChwcmV2KSA9PiBbLi4ucHJldiwgeyBpZDogYGNvbm4tJHtEYXRlLm5vdygpfWAsIGZyb21Ob2RlSWQsIHRvTm9kZUlkIH1dKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNldENvbnRleHRNZW51KG51bGwpO1xuICAgICAgICB9LFxuICAgICAgICBbbWVzc2FnZSwgdF0sXG4gICAgKTtcblxuICAgIGNvbnN0IGNyZWF0ZUNvbm5lY3RlZE5vZGUgPSB1c2VDYWxsYmFjayhcbiAgICAgICAgKHR5cGU6IENhbnZhc05vZGVUeXBlLkltYWdlIHwgQ2FudmFzTm9kZVR5cGUuVGV4dCB8IENhbnZhc05vZGVUeXBlLkNvbmZpZyB8IENhbnZhc05vZGVUeXBlLlZpZGVvIHwgQ2FudmFzTm9kZVR5cGUuQXVkaW8sIHBlbmRpbmc6IFBlbmRpbmdDb25uZWN0aW9uQ3JlYXRlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtZXRhZGF0YSA9IHR5cGUgPT09IENhbnZhc05vZGVUeXBlLkNvbmZpZyA/IHsgbW9kZWw6IGVmZmVjdGl2ZUNvbmZpZy5pbWFnZU1vZGVsIHx8IGVmZmVjdGl2ZUNvbmZpZy5tb2RlbCwgc2l6ZTogZWZmZWN0aXZlQ29uZmlnLnNpemUsIGNvdW50OiBnZXRHZW5lcmF0aW9uQ291bnQoZWZmZWN0aXZlQ29uZmlnLmNhbnZhc0ltYWdlQ291bnQgfHwgZWZmZWN0aXZlQ29uZmlnLmNvdW50KSB9IDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgY29uc3QgbmV3Tm9kZSA9IGNyZWF0ZUNhbnZhc05vZGUodHlwZSwgcGVuZGluZy5wb3NpdGlvbiwgbWV0YWRhdGEpO1xuICAgICAgICAgICAgY29uc3QgY29ubmVjdGlvbiA9IG5vcm1hbGl6ZUNvbm5lY3Rpb24ocGVuZGluZy5jb25uZWN0aW9uLm5vZGVJZCwgbmV3Tm9kZS5pZCwgWy4uLm5vZGVzUmVmLmN1cnJlbnQsIG5ld05vZGVdLCBwZW5kaW5nLmNvbm5lY3Rpb24uaGFuZGxlVHlwZSk7XG4gICAgICAgICAgICBpZiAoIWNvbm5lY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlLndhcm5pbmcodChcImNhbnZhcy5wcm9qZWN0UGFnZS5jb25maWdDb25uZWN0aW9uXCIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZXROb2RlcygocHJldikgPT4gWy4uLnByZXYsIG5ld05vZGVdKTtcbiAgICAgICAgICAgIHNldENvbm5lY3Rpb25zKChwcmV2KSA9PiBbLi4ucHJldiwgeyBpZDogbmFub2lkKCksIC4uLmNvbm5lY3Rpb24gfV0pO1xuICAgICAgICAgICAgc2V0U2VsZWN0ZWROb2RlSWRzKG5ldyBTZXQoW25ld05vZGUuaWRdKSk7XG4gICAgICAgICAgICBzZXRTZWxlY3RlZENvbm5lY3Rpb25JZChudWxsKTtcbiAgICAgICAgICAgIGlmICh0eXBlICE9PSBDYW52YXNOb2RlVHlwZS5UZXh0ICYmIHR5cGUgIT09IENhbnZhc05vZGVUeXBlLkF1ZGlvKSBzZXREaWFsb2dOb2RlSWQobmV3Tm9kZS5pZCk7XG4gICAgICAgICAgICBzZXRQZW5kaW5nQ29ubmVjdGlvbkNyZWF0ZShudWxsKTtcbiAgICAgICAgICAgIHNldENvbm5lY3RpbmcobnVsbCk7XG4gICAgICAgIH0sXG4gICAgICAgIFtlZmZlY3RpdmVDb25maWcuY2FudmFzSW1hZ2VDb3VudCwgZWZmZWN0aXZlQ29uZmlnLmNvdW50LCBlZmZlY3RpdmVDb25maWcuaW1hZ2VNb2RlbCwgZWZmZWN0aXZlQ29uZmlnLm1vZGVsLCBlZmZlY3RpdmVDb25maWcuc2l6ZSwgbWVzc2FnZSwgc2V0Q29ubmVjdGluZywgdF0sXG4gICAgKTtcblxuICAgIGNvbnN0IGNhbmNlbFBlbmRpbmdDb25uZWN0aW9uQ3JlYXRlID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgICAgICBzZXRQZW5kaW5nQ29ubmVjdGlvbkNyZWF0ZShudWxsKTtcbiAgICAgICAgc2V0Q29ubmVjdGluZyhudWxsKTtcbiAgICB9LCBbc2V0Q29ubmVjdGluZ10pO1xuXG4gICAgY29uc3QgZ2V0Q29ubmVjdGlvbkRyb3BUYXJnZXQgPSB1c2VDYWxsYmFjayhcbiAgICAgICAgKGNsaWVudFg6IG51bWJlciwgY2xpZW50WTogbnVtYmVyLCBjdXJyZW50OiBDb25uZWN0aW9uSGFuZGxlKTogQ29ubmVjdGlvbkRyb3BUYXJnZXQgPT4ge1xuICAgICAgICAgICAgY29uc3Qgd29ybGQgPSBzY3JlZW5Ub0NhbnZhcyhjbGllbnRYLCBjbGllbnRZKTtcbiAgICAgICAgICAgIGNvbnN0IHNjYWxlID0gTWF0aC5tYXgodmlld3BvcnRSZWYuY3VycmVudC5rLCAwLjA1KTtcbiAgICAgICAgICAgIGNvbnN0IHBhZGRpbmcgPSBDT05ORUNUSU9OX05PREVfSElUX1BBRERJTkcgLyBzY2FsZTtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZVJhZGl1cyA9IENPTk5FQ1RJT05fSEFORExFX0hJVF9SQURJVVMgLyBzY2FsZTtcbiAgICAgICAgICAgIGxldCBpc05lYXJOb2RlID0gZmFsc2U7XG4gICAgICAgICAgICBsZXQgYmVzdE5vZGVJZDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgICAgICAgICBsZXQgYmVzdFByaW9yaXR5ID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuXG4gICAgICAgICAgICBbLi4ubm9kZXNSZWYuY3VycmVudF1cbiAgICAgICAgICAgICAgICAucmV2ZXJzZSgpXG4gICAgICAgICAgICAgICAgLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYW5jaG9yID0gZ2V0Q29ubmVjdGlvblRhcmdldEFuY2hvcihub2RlLCBjdXJyZW50KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHggPSB3b3JsZC54IC0gYW5jaG9yLng7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGR5ID0gd29ybGQueSAtIGFuY2hvci55O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBoaXRzSGFuZGxlID0gZHggKiBkeCArIGR5ICogZHkgPD0gaGFuZGxlUmFkaXVzICogaGFuZGxlUmFkaXVzO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBoaXRzSW5zaWRlID0gd29ybGQueCA+PSBub2RlLnBvc2l0aW9uLnggJiYgd29ybGQueCA8PSBub2RlLnBvc2l0aW9uLnggKyBub2RlLndpZHRoICYmIHdvcmxkLnkgPj0gbm9kZS5wb3NpdGlvbi55ICYmIHdvcmxkLnkgPD0gbm9kZS5wb3NpdGlvbi55ICsgbm9kZS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhpdHNFeHBhbmRlZCA9IHdvcmxkLnggPj0gbm9kZS5wb3NpdGlvbi54IC0gcGFkZGluZyAmJiB3b3JsZC54IDw9IG5vZGUucG9zaXRpb24ueCArIG5vZGUud2lkdGggKyBwYWRkaW5nICYmIHdvcmxkLnkgPj0gbm9kZS5wb3NpdGlvbi55IC0gcGFkZGluZyAmJiB3b3JsZC55IDw9IG5vZGUucG9zaXRpb24ueSArIG5vZGUuaGVpZ2h0ICsgcGFkZGluZztcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWhpdHNIYW5kbGUgJiYgIWhpdHNJbnNpZGUgJiYgIWhpdHNFeHBhbmRlZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBpc05lYXJOb2RlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUuaWQgPT09IGN1cnJlbnQubm9kZUlkIHx8ICFub3JtYWxpemVDb25uZWN0aW9uKGN1cnJlbnQubm9kZUlkLCBub2RlLmlkLCBub2Rlc1JlZi5jdXJyZW50LCBjdXJyZW50LmhhbmRsZVR5cGUpKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJpb3JpdHkgPSBoaXRzSW5zaWRlID8gMCA6IGhpdHNIYW5kbGUgPyAxIDogMjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByaW9yaXR5IDwgYmVzdFByaW9yaXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZUlkID0gbm9kZS5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RQcmlvcml0eSA9IHByaW9yaXR5O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB7IG5vZGVJZDogYmVzdE5vZGVJZCwgaXNOZWFyTm9kZSB9O1xuICAgICAgICB9LFxuICAgICAgICBbc2NyZWVuVG9DYW52YXNdLFxuICAgICk7XG5cbiAgICBjb25zdCB2aXNpYmxlTm9kZXMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICAgICAgY29uc3QgcGFkZGluZyA9IDI4MDtcbiAgICAgICAgY29uc3QgcmVjdCA9IGNvbnRhaW5lclJlZi5jdXJyZW50Py5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3Qgd2lkdGggPSByZWN0Py53aWR0aCB8fCBzaXplLndpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSByZWN0Py5oZWlnaHQgfHwgc2l6ZS5oZWlnaHQ7XG4gICAgICAgIGNvbnN0IHZpZXdMZWZ0ID0gLXZpZXdwb3J0LnggLyB2aWV3cG9ydC5rIC0gcGFkZGluZztcbiAgICAgICAgY29uc3Qgdmlld1RvcCA9IC12aWV3cG9ydC55IC8gdmlld3BvcnQuayAtIHBhZGRpbmc7XG4gICAgICAgIGNvbnN0IHZpZXdSaWdodCA9IHZpZXdMZWZ0ICsgd2lkdGggLyB2aWV3cG9ydC5rICsgcGFkZGluZyAqIDI7XG4gICAgICAgIGNvbnN0IHZpZXdCb3R0b20gPSB2aWV3VG9wICsgaGVpZ2h0IC8gdmlld3BvcnQuayArIHBhZGRpbmcgKiAyO1xuXG4gICAgICAgIHJldHVybiBub2Rlcy5maWx0ZXIoKG5vZGUpID0+IG5vZGUucG9zaXRpb24ueCArIG5vZGUud2lkdGggPiB2aWV3TGVmdCAmJiBub2RlLnBvc2l0aW9uLnggPCB2aWV3UmlnaHQgJiYgbm9kZS5wb3NpdGlvbi55ICsgbm9kZS5oZWlnaHQgPiB2aWV3VG9wICYmIG5vZGUucG9zaXRpb24ueSA8IHZpZXdCb3R0b20pO1xuICAgIH0sIFtub2Rlcywgc2l6ZS5oZWlnaHQsIHNpemUud2lkdGgsIHZpZXdwb3J0LmssIHZpZXdwb3J0LngsIHZpZXdwb3J0LnldKTtcblxuICAgIGNvbnN0IG5vZGVCeUlkID0gdXNlTWVtbygoKSA9PiBuZXcgTWFwKG5vZGVzLm1hcCgobm9kZSkgPT4gW25vZGUuaWQsIG5vZGVdKSksIFtub2Rlc10pO1xuICAgIC8vIFRoZSB0b29sYmFyIGZvbGxvd3MgYSBzaW5nbGUgc2VsZWN0ZWQgbm9kZSBzZWxlY3RlZCBieSBjbGljaywgY3JlYXRpb24sIG1hcnF1ZWUsIG9yIGtleWJvYXJkLlxuICAgIC8vIEl0IHN0YXlzIGhpZGRlbiBmb3IgbXVsdGktc2VsZWN0aW9uIGFuZCB3aGlsZSBpc05vZGVEcmFnZ2luZyBpcyB0cnVlLlxuICAgIGNvbnN0IHNpbmdsZVNlbGVjdGVkTm9kZUlkID0gc2VsZWN0ZWROb2RlSWRzLnNpemUgPT09IDEgPyBBcnJheS5mcm9tKHNlbGVjdGVkTm9kZUlkcylbMF0gOiBudWxsO1xuICAgIGNvbnN0IHRvb2xiYXJOb2RlID0gKHRvb2xiYXJOb2RlSWQgPyBub2RlQnlJZC5nZXQodG9vbGJhck5vZGVJZCkgfHwgbnVsbCA6IG51bGwpIHx8IChzaW5nbGVTZWxlY3RlZE5vZGVJZCA/IG5vZGVCeUlkLmdldChzaW5nbGVTZWxlY3RlZE5vZGVJZCkgfHwgbnVsbCA6IG51bGwpO1xuICAgIGNvbnN0IGluZm9Ob2RlID0gaW5mb05vZGVJZCA/IG5vZGVCeUlkLmdldChpbmZvTm9kZUlkKSB8fCBudWxsIDogbnVsbDtcbiAgICBjb25zdCBjcm9wTm9kZSA9IGNyb3BOb2RlSWQgPyBub2RlQnlJZC5nZXQoY3JvcE5vZGVJZCkgfHwgbnVsbCA6IG51bGw7XG4gICAgY29uc3QgbWFza0VkaXROb2RlID0gbWFza0VkaXROb2RlSWQgPyBub2RlQnlJZC5nZXQobWFza0VkaXROb2RlSWQpIHx8IG51bGwgOiBudWxsO1xuICAgIGNvbnN0IHNwbGl0Tm9kZSA9IHNwbGl0Tm9kZUlkID8gbm9kZUJ5SWQuZ2V0KHNwbGl0Tm9kZUlkKSB8fCBudWxsIDogbnVsbDtcbiAgICBjb25zdCB1cHNjYWxlTm9kZSA9IHVwc2NhbGVOb2RlSWQgPyBub2RlQnlJZC5nZXQodXBzY2FsZU5vZGVJZCkgfHwgbnVsbCA6IG51bGw7XG4gICAgY29uc3Qgc3VwZXJSZXNvbHZlTm9kZSA9IHN1cGVyUmVzb2x2ZU5vZGVJZCA/IG5vZGVCeUlkLmdldChzdXBlclJlc29sdmVOb2RlSWQpIHx8IG51bGwgOiBudWxsO1xuICAgIGNvbnN0IGFuZ2xlTm9kZSA9IGFuZ2xlTm9kZUlkID8gbm9kZUJ5SWQuZ2V0KGFuZ2xlTm9kZUlkKSB8fCBudWxsIDogbnVsbDtcbiAgICBjb25zdCBjb250ZXh0TWVudU5vZGUgPSBjb250ZXh0TWVudT8udHlwZSA9PT0gXCJub2RlXCIgPyBub2RlQnlJZC5nZXQoY29udGV4dE1lbnUubm9kZUlkKSB8fCBudWxsIDogbnVsbDtcbiAgICBjb25zdCBwcmV2aWV3Tm9kZSA9IHByZXZpZXdOb2RlSWQgPyBub2RlQnlJZC5nZXQocHJldmlld05vZGVJZCkgfHwgbnVsbCA6IG51bGw7XG4gICAgY29uc3QgcHJldmlld0NvbnRlbnQgPSBwcmV2aWV3SW1hZ2VJZCA/IHByZXZpZXdOb2RlPy5tZXRhZGF0YT8uaW1hZ2VzPy5maW5kKChpbWFnZSkgPT4gaW1hZ2UuaWQgPT09IHByZXZpZXdJbWFnZUlkKT8uY29udGVudCA6IHByZXZpZXdOb2RlPy5tZXRhZGF0YT8uY29udGVudDtcbiAgICBjb25zdCBoYXNNdWx0aXBsZVNlbGVjdGVkTm9kZXMgPSBzZWxlY3RlZE5vZGVJZHMuc2l6ZSA+IDE7XG4gICAgY29uc3QgYWN0aXZlTm9kZUlkID0gaGFzTXVsdGlwbGVTZWxlY3RlZE5vZGVzID8gbnVsbCA6IGhvdmVyZWROb2RlSWQgfHwgKHNlbGVjdGVkTm9kZUlkcy5zaXplID09PSAxID8gQXJyYXkuZnJvbShzZWxlY3RlZE5vZGVJZHMpWzBdIDogbnVsbCk7XG4gICAgY29uc3QgZ3JvdXBDaGlsZENvdW50QnlJZCA9IHVzZU1lbW8oKCkgPT4ge1xuICAgICAgICBjb25zdCBtYXAgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICAgICAgICBub2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBncm91cElkID0gbm9kZS5tZXRhZGF0YT8uZ3JvdXBJZDtcbiAgICAgICAgICAgIGlmIChncm91cElkKSBtYXAuc2V0KGdyb3VwSWQsIChtYXAuZ2V0KGdyb3VwSWQpIHx8IDApICsgMSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbWFwO1xuICAgIH0sIFtub2Rlc10pO1xuICAgIGNvbnN0IHJlbGF0ZWRIaWdobGlnaHQgPSB1c2VNZW1vKCgpID0+IHtcbiAgICAgICAgY29uc3Qgbm9kZUlkcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICBjb25zdCBjb25uZWN0aW9uSWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgICAgICAgaWYgKCFhY3RpdmVOb2RlSWQpIHJldHVybiB7IG5vZGVJZHMsIGNvbm5lY3Rpb25JZHMgfTtcblxuICAgICAgICBjb25zdCBhZGROb2RlID0gKG5vZGVJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBub2RlSWRzLmFkZChub2RlSWQpO1xuICAgICAgICAgICAgaWYgKG5vZGVCeUlkLmdldChub2RlSWQpPy50eXBlID09PSBDYW52YXNOb2RlVHlwZS5Hcm91cCkgbm9kZXMuZm9yRWFjaCgobm9kZSkgPT4gbm9kZS5tZXRhZGF0YT8uZ3JvdXBJZCA9PT0gbm9kZUlkICYmIG5vZGVJZHMuYWRkKG5vZGUuaWQpKTtcbiAgICAgICAgfTtcbiAgICAgICAgYWRkTm9kZShhY3RpdmVOb2RlSWQpO1xuICAgICAgICBjb25uZWN0aW9ucy5mb3JFYWNoKChjb25uZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5mcm9tTm9kZUlkICE9PSBhY3RpdmVOb2RlSWQgJiYgY29ubmVjdGlvbi50b05vZGVJZCAhPT0gYWN0aXZlTm9kZUlkKSByZXR1cm47XG4gICAgICAgICAgICBjb25uZWN0aW9uSWRzLmFkZChjb25uZWN0aW9uLmlkKTtcbiAgICAgICAgICAgIGFkZE5vZGUoY29ubmVjdGlvbi5mcm9tTm9kZUlkKTtcbiAgICAgICAgICAgIGFkZE5vZGUoY29ubmVjdGlvbi50b05vZGVJZCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB7IG5vZGVJZHMsIGNvbm5lY3Rpb25JZHMgfTtcbiAgICB9LCBbYWN0aXZlTm9kZUlkLCBjb25uZWN0aW9ucywgbm9kZUJ5SWQsIG5vZGVzXSk7XG5cbiAgICBjb25zdCBjb25maWdJbnB1dHNCeUlkID0gdXNlTWVtbygoKSA9PiB7XG4gICAgICAgIGNvbnN0IG1hcCA9IG5ldyBNYXA8c3RyaW5nLCBOb2RlR2VuZXJhdGlvbklucHV0W10+KCk7XG4gICAgICAgIG5vZGVzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgICAgIGlmIChub2RlLnR5cGUgIT09IENhbnZhc05vZGVUeXBlLkNvbmZpZykgcmV0dXJuO1xuICAgICAgICAgICAgbWFwLnNldChub2RlLmlkLCBidWlsZE5vZGVHZW5lcmF0aW9uSW5wdXRzKG5vZGUuaWQsIG5vZGVzLCBjb25uZWN0aW9ucykpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG1hcDtcbiAgICB9LCBbY29ubmVjdGlvbnMsIG5vZGVzXSk7XG4gICAgY29uc3QgbWVudGlvblJlZmVyZW5jZXNCeU5vZGVJZCA9IHVzZU1lbW8oKCkgPT4ge1xuICAgICAgICBjb25zdCBtYXAgPSBuZXcgTWFwPHN0cmluZywgUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGROb2RlTWVudGlvblJlZmVyZW5jZXM+PigpO1xuICAgICAgICBub2Rlcy5mb3JFYWNoKChub2RlKSA9PiBtYXAuc2V0KG5vZGUuaWQsIGJ1aWxkTm9kZU1lbnRpb25SZWZlcmVuY2VzKG5vZGUsIG5vZGVzLCBjb25uZWN0aW9ucykpKTtcbiAgICAgICAgcmV0dXJuIG1hcDtcbiAgICB9LCBbY29ubmVjdGlvbnMsIG5vZGVzXSk7XG4gICAgY29uc3QgY29ubmVjdGVkTm9kZXNCeU5vZGVJZCA9IHVzZU1lbW8oKCkgPT4ge1xuICAgICAgICBjb25zdCBtYXAgPSBuZXcgTWFwPHN0cmluZywgQ2FudmFzTm9kZURhdGFbXT4oKTtcbiAgICAgICAgY29ubmVjdGlvbnMuZm9yRWFjaCgoY29ubmVjdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc291cmNlID0gbm9kZUJ5SWQuZ2V0KGNvbm5lY3Rpb24uZnJvbU5vZGVJZCk7XG4gICAgICAgICAgICBpZiAoIXNvdXJjZSkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3QgY29ubmVjdGVkID0gbWFwLmdldChjb25uZWN0aW9uLnRvTm9kZUlkKTtcbiAgICAgICAgICAgIGlmIChjb25uZWN0ZWQpIGNvbm5lY3RlZC5wdXNoKHNvdXJjZSk7XG4gICAgICAgICAgICBlbHNlIG1hcC5zZXQoY29ubmVjdGlvbi50b05vZGVJZCwgW3NvdXJjZV0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG1hcDtcbiAgICB9LCBbY29ubmVjdGlvbnMsIG5vZGVCeUlkXSk7XG4gICAgY29uc3QgcmVmZXJlbmNlQ29ubmVjdGVkTm9kZUlkcyA9IHVzZU1lbW8oKCkgPT4gbmV3IFNldChbcmVmZXJlbmNlUGlja2VyTm9kZUlkLCAuLi4ocmVmZXJlbmNlUGlja2VyTm9kZUlkID8gY29ubmVjdGVkTm9kZXNCeU5vZGVJZC5nZXQocmVmZXJlbmNlUGlja2VyTm9kZUlkKT8uZmxhdE1hcCgobm9kZSkgPT4gbm9kZS50eXBlID09PSBDYW52YXNOb2RlVHlwZS5Hcm91cCA/IFtub2RlLmlkLCAuLi5nZXRHcm91cFJlc291cmNlTm9kZXMobm9kZS5pZCwgbm9kZXMpLm1hcCgoY2hpbGQpID0+IGNoaWxkLmlkKV0gOiBbbm9kZS5pZF0pIHx8IFtdIDogW10pXS5maWx0ZXIoKGlkKTogaWQgaXMgc3RyaW5nID0+IEJvb2xlYW4oaWQpKSksIFtjb25uZWN0ZWROb2Rlc0J5Tm9kZUlkLCBub2RlcywgcmVmZXJlbmNlUGlja2VyTm9kZUlkXSk7XG4gICAgY29uc3QgeyBhcHBseUFnZW50T3BzIH0gPSB1c2VBZ2VudEJyaWRnZSh7XG4gICAgICAgIHByb2plY3RJZCxcbiAgICAgICAgdGl0bGU6IGN1cnJlbnRQcm9qZWN0Py50aXRsZSxcbiAgICAgICAgbm9kZXMsXG4gICAgICAgIGNvbm5lY3Rpb25zLFxuICAgICAgICBzZWxlY3RlZE5vZGVJZHMsXG4gICAgICAgIHZpZXdwb3J0LFxuICAgICAgICBub2Rlc1JlZixcbiAgICAgICAgY29ubmVjdGlvbnNSZWYsXG4gICAgICAgIHNlbGVjdGVkTm9kZUlkc1JlZixcbiAgICAgICAgdmlld3BvcnRSZWYsXG4gICAgICAgIGdlbmVyYXRlTm9kZVJlZixcbiAgICAgICAgc2V0Tm9kZXMsXG4gICAgICAgIHNldENvbm5lY3Rpb25zLFxuICAgICAgICBzZXRTZWxlY3RlZE5vZGVJZHMsXG4gICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkLFxuICAgICAgICBzZXRWaWV3cG9ydCxcbiAgICAgICAgc2V0Q29udGV4dE1lbnUsXG4gICAgfSk7XG5cbiAgICBjb25zdCB7IHBsdWdpbkhvc3QsIHJlbmRlclBsdWdpblBhbmVsLCBidWlsZE5vZGVUb29sYmFySXRlbXMgfSA9IHVzZVBsdWdpbkhvc3Qoe1xuICAgICAgICBlZmZlY3RpdmVDb25maWcsXG4gICAgICAgIGlzQWlDb25maWdSZWFkeSxcbiAgICAgICAgb3BlbkNvbmZpZ0RpYWxvZyxcbiAgICAgICAgdGhlbWUsXG4gICAgICAgIG5vZGVzUmVmLFxuICAgICAgICBjb25uZWN0aW9uc1JlZixcbiAgICAgICAgdmlld3BvcnRSZWYsXG4gICAgICAgIHNldE5vZGVzLFxuICAgICAgICBzZXREaWFsb2dOb2RlSWQsXG4gICAgICAgIGFwcGx5QWdlbnRPcHMsXG4gICAgfSk7XG4gICAgY29uc3QgY3JlYXRlTm9kZSA9IHVzZUNhbGxiYWNrKFxuICAgICAgICAodHlwZTogQ2FudmFzTm9kZVR5cGVJZCwgcG9zaXRpb24/OiBQb3NpdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0UG9zaXRpb24gPSBwb3NpdGlvbiB8fCBnZXRDYW52YXNDZW50ZXIoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZ01ldGFkYXRhID1cbiAgICAgICAgICAgICAgICB0eXBlID09PSBDYW52YXNOb2RlVHlwZS5Db25maWdcbiAgICAgICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBlZmZlY3RpdmVDb25maWcuaW1hZ2VNb2RlbCB8fCBlZmZlY3RpdmVDb25maWcubW9kZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IGVmZmVjdGl2ZUNvbmZpZy5zaXplLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogZ2V0R2VuZXJhdGlvbkNvdW50KGVmZmVjdGl2ZUNvbmZpZy5jYW52YXNJbWFnZUNvdW50IHx8IGVmZmVjdGl2ZUNvbmZpZy5jb3VudCksXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGNvbnN0IG5ld05vZGUgPSBjcmVhdGVDYW52YXNOb2RlKHR5cGUsIHRhcmdldFBvc2l0aW9uLCBjb25maWdNZXRhZGF0YSk7XG5cbiAgICAgICAgICAgIHNldE5vZGVzKChwcmV2KSA9PiBbLi4ucHJldiwgbmV3Tm9kZV0pO1xuICAgICAgICAgICAgc2V0U2VsZWN0ZWROb2RlSWRzKG5ldyBTZXQoW25ld05vZGUuaWRdKSk7XG4gICAgICAgICAgICBzZXRTZWxlY3RlZENvbm5lY3Rpb25JZChudWxsKTtcbiAgICAgICAgICAgIGNvbnN0IGRlZmluaXRpb24gPSBnZXROb2RlRGVmaW5pdGlvbih0eXBlKTtcbiAgICAgICAgICAgIC8vIERpc3BsYXktb25seSBwbHVnaW4gbm9kZXMgd2l0aCBoaWRlUGFuZWwgZG8gbm90IG9wZW4gYSBwYW5lbDsgY3VzdG9tIFBhbmVscyByZXF1aXJlIGF1dG9PcGVuUGFuZWwgb24gY3JlYXRpb24uXG4gICAgICAgICAgICAvLyBQbHVnaW4gbm9kZXMgZGVjbGFyaW5nIHVzZUJ1aWx0aW5QYW5lbCBvcGVuIHRoZSBidWlsdC1pbiBnZW5lcmF0aW9uIHBhbmVsIG9uIGNyZWF0aW9uLCBsaWtlIGltYWdlIG5vZGVzLlxuICAgICAgICAgICAgLy8gQnVpbHQtaW4gaW1hZ2UsIHZpZGVvLCBhbmQgY29uZmlnIG5vZGVzIHJldGFpbiB0aGVpciBleGlzdGluZyBvcGVuLW9uLWNyZWF0ZSBiZWhhdmlvci5cbiAgICAgICAgICAgIGNvbnN0IHdhbnRzUGFuZWwgPSBkZWZpbml0aW9uPy5oaWRlUGFuZWxcbiAgICAgICAgICAgICAgICA/IGZhbHNlXG4gICAgICAgICAgICAgICAgOiBkZWZpbml0aW9uPy5QYW5lbFxuICAgICAgICAgICAgICAgICAgPyBCb29sZWFuKGRlZmluaXRpb24uYXV0b09wZW5QYW5lbClcbiAgICAgICAgICAgICAgICAgIDogZGVmaW5pdGlvbj8udXNlQnVpbHRpblBhbmVsXG4gICAgICAgICAgICAgICAgICAgID8gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICA6IGlzQnVpbHRpblR5cGUodHlwZSkgJiYgdHlwZSAhPT0gQ2FudmFzTm9kZVR5cGUuVGV4dCAmJiB0eXBlICE9PSBDYW52YXNOb2RlVHlwZS5BdWRpbyAmJiB0eXBlICE9PSBDYW52YXNOb2RlVHlwZS5Hcm91cDtcbiAgICAgICAgICAgIGlmICh3YW50c1BhbmVsKSBzZXREaWFsb2dOb2RlSWQobmV3Tm9kZS5pZCk7XG4gICAgICAgIH0sXG4gICAgICAgIFtlZmZlY3RpdmVDb25maWcuY2FudmFzSW1hZ2VDb3VudCwgZWZmZWN0aXZlQ29uZmlnLmNvdW50LCBlZmZlY3RpdmVDb25maWcuaW1hZ2VNb2RlbCwgZWZmZWN0aXZlQ29uZmlnLm1vZGVsLCBlZmZlY3RpdmVDb25maWcuc2l6ZSwgZ2V0Q2FudmFzQ2VudGVyXSxcbiAgICApO1xuXG4gICAgY29uc3QgZGVsZXRlTm9kZXMgPSB1c2VDYWxsYmFjayhcbiAgICAgICAgKGlkczogU2V0PHN0cmluZz4pID0+IHtcbiAgICAgICAgICAgIGlmICghaWRzLnNpemUpIHJldHVybjtcbiAgICAgICAgICAgIGNvbnN0IGFsbElkcyA9IG5ldyBTZXQoaWRzKTtcbiAgICAgICAgICAgIHNldE5vZGVzKChwcmV2KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dCA9IHByZXYuZmlsdGVyKChub2RlKSA9PiAhYWxsSWRzLmhhcyhub2RlLmlkKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHQubWFwKChub2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwSWQgPSBub2RlLm1ldGFkYXRhPy5ncm91cElkO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZ3JvdXBJZCAmJiBhbGxJZHMuaGFzKGdyb3VwSWQpKSByZXR1cm4geyAuLi5ub2RlLCBtZXRhZGF0YTogeyAuLi5ub2RlLm1ldGFkYXRhLCBncm91cElkOiB1bmRlZmluZWQgfSB9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc2V0Q29ubmVjdGlvbnMoKHByZXYpID0+IHByZXYuZmlsdGVyKChjb25uKSA9PiAhYWxsSWRzLmhhcyhjb25uLmZyb21Ob2RlSWQpICYmICFhbGxJZHMuaGFzKGNvbm4udG9Ob2RlSWQpKSk7XG4gICAgICAgICAgICBzZXRTZWxlY3RlZE5vZGVJZHMobmV3IFNldCgpKTtcbiAgICAgICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKG51bGwpO1xuICAgICAgICAgICAgc2V0SG92ZXJlZE5vZGVJZCgoY3VycmVudCkgPT4gKGN1cnJlbnQgJiYgYWxsSWRzLmhhcyhjdXJyZW50KSA/IG51bGwgOiBjdXJyZW50KSk7XG4gICAgICAgICAgICBzZXRUb29sYmFyTm9kZUlkKChjdXJyZW50KSA9PiAoY3VycmVudCAmJiBhbGxJZHMuaGFzKGN1cnJlbnQpID8gbnVsbCA6IGN1cnJlbnQpKTtcbiAgICAgICAgICAgIHNldERpYWxvZ05vZGVJZCgoY3VycmVudCkgPT4gKGN1cnJlbnQgJiYgYWxsSWRzLmhhcyhjdXJyZW50KSA/IG51bGwgOiBjdXJyZW50KSk7XG4gICAgICAgICAgICBzZXRJbmZvTm9kZUlkKChjdXJyZW50KSA9PiAoY3VycmVudCAmJiBhbGxJZHMuaGFzKGN1cnJlbnQpID8gbnVsbCA6IGN1cnJlbnQpKTtcbiAgICAgICAgICAgIHNldENyb3BOb2RlSWQoKGN1cnJlbnQpID0+IChjdXJyZW50ICYmIGFsbElkcy5oYXMoY3VycmVudCkgPyBudWxsIDogY3VycmVudCkpO1xuICAgICAgICAgICAgc2V0TWFza0VkaXROb2RlSWQoKGN1cnJlbnQpID0+IChjdXJyZW50ICYmIGFsbElkcy5oYXMoY3VycmVudCkgPyBudWxsIDogY3VycmVudCkpO1xuICAgICAgICAgICAgc2V0QW5nbGVOb2RlSWQoKGN1cnJlbnQpID0+IChjdXJyZW50ICYmIGFsbElkcy5oYXMoY3VycmVudCkgPyBudWxsIDogY3VycmVudCkpO1xuICAgICAgICAgICAgc2V0UHJldmlld05vZGVJZCgoY3VycmVudCkgPT4gKGN1cnJlbnQgJiYgYWxsSWRzLmhhcyhjdXJyZW50KSA/IG51bGwgOiBjdXJyZW50KSk7XG4gICAgICAgICAgICBzZXRSdW5uaW5nTm9kZUlkKChjdXJyZW50KSA9PiAoY3VycmVudCAmJiBhbGxJZHMuaGFzKGN1cnJlbnQpID8gbnVsbCA6IGN1cnJlbnQpKTtcbiAgICAgICAgICAgIHNldFJlZmVyZW5jZVBpY2tlck5vZGVJZCgoY3VycmVudCkgPT4gKGN1cnJlbnQgJiYgYWxsSWRzLmhhcyhjdXJyZW50KSA/IG51bGwgOiBjdXJyZW50KSk7XG4gICAgICAgICAgICBzZXRFeHBhbmRlZEJhdGNoTm9kZUlkcygoY3VycmVudCkgPT4gbmV3IFNldChbLi4uY3VycmVudF0uZmlsdGVyKChub2RlSWQpID0+ICFhbGxJZHMuaGFzKG5vZGVJZCkpKSk7XG4gICAgICAgICAgICBzZXRDb250ZXh0TWVudSgoY3VycmVudCkgPT4gKGN1cnJlbnQ/LnR5cGUgPT09IFwibm9kZVwiICYmIGFsbElkcy5oYXMoY3VycmVudC5ub2RlSWQpID8gbnVsbCA6IGN1cnJlbnQpKTtcbiAgICAgICAgICAgIGNsZWFudXBDYW52YXNGaWxlcyh7IHByb2plY3RJZCwgbm9kZXM6IG5vZGVzUmVmLmN1cnJlbnQuZmlsdGVyKChub2RlKSA9PiAhYWxsSWRzLmhhcyhub2RlLmlkKSksIGNoYXRTZXNzaW9ucyB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgW2NoYXRTZXNzaW9ucywgY2xlYW51cENhbnZhc0ZpbGVzLCBwcm9qZWN0SWRdLFxuICAgICk7XG5cbiAgICBjb25zdCBkZWxldGVDb25uZWN0aW9uID0gdXNlQ2FsbGJhY2soKGNvbm5lY3Rpb25JZDogc3RyaW5nKSA9PiB7XG4gICAgICAgIHNldENvbm5lY3Rpb25zKChwcmV2KSA9PiBwcmV2LmZpbHRlcigoY29ubikgPT4gY29ubi5pZCAhPT0gY29ubmVjdGlvbklkKSk7XG4gICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKChjdXJyZW50KSA9PiAoY3VycmVudCA9PT0gY29ubmVjdGlvbklkID8gbnVsbCA6IGN1cnJlbnQpKTtcbiAgICAgICAgc2V0Q29udGV4dE1lbnUoKGN1cnJlbnQpID0+IChjdXJyZW50Py50eXBlID09PSBcImNvbm5lY3Rpb25cIiAmJiBjdXJyZW50LmNvbm5lY3Rpb25JZCA9PT0gY29ubmVjdGlvbklkID8gbnVsbCA6IGN1cnJlbnQpKTtcbiAgICB9LCBbXSk7XG5cbiAgICBjb25zdCBkaXNjb25uZWN0Tm9kZVJlZmVyZW5jZSA9IHVzZUNhbGxiYWNrKChmcm9tTm9kZUlkOiBzdHJpbmcsIHRvTm9kZUlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgc2V0Q29ubmVjdGlvbnMoKHByZXYpID0+IHByZXYuZmlsdGVyKChjb25uZWN0aW9uKSA9PiBjb25uZWN0aW9uLmZyb21Ob2RlSWQgIT09IGZyb21Ob2RlSWQgfHwgY29ubmVjdGlvbi50b05vZGVJZCAhPT0gdG9Ob2RlSWQpKTtcbiAgICB9LCBbXSk7XG5cbiAgICBjb25zdCBzdGFydE5vZGVSZWZlcmVuY2VTZWxlY3Rpb24gPSB1c2VDYWxsYmFjaygobm9kZUlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgc2V0UmVmZXJlbmNlUGlja2VyTm9kZUlkKG5vZGVJZCk7XG4gICAgICAgIHNldFNlbGVjdGVkTm9kZUlkcyhuZXcgU2V0KFtub2RlSWRdKSk7XG4gICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKG51bGwpO1xuICAgICAgICBzZXREaWFsb2dOb2RlSWQobnVsbCk7XG4gICAgfSwgW10pO1xuXG4gICAgY29uc3QgZXhpdE5vZGVSZWZlcmVuY2VTZWxlY3Rpb24gPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgIGlmICghcmVmZXJlbmNlUGlja2VyTm9kZUlkKSByZXR1cm47XG4gICAgICAgIHNldFNlbGVjdGVkTm9kZUlkcyhuZXcgU2V0KFtyZWZlcmVuY2VQaWNrZXJOb2RlSWRdKSk7XG4gICAgICAgIHNldERpYWxvZ05vZGVJZChyZWZlcmVuY2VQaWNrZXJOb2RlSWQpO1xuICAgICAgICBzZXRSZWZlcmVuY2VQaWNrZXJOb2RlSWQobnVsbCk7XG4gICAgfSwgW3JlZmVyZW5jZVBpY2tlck5vZGVJZF0pO1xuXG4gICAgY29uc3Qgc2VsZWN0Tm9kZVJlZmVyZW5jZSA9IHVzZUNhbGxiYWNrKChmcm9tTm9kZUlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgaWYgKCFyZWZlcmVuY2VQaWNrZXJOb2RlSWQgfHwgcmVmZXJlbmNlQ29ubmVjdGVkTm9kZUlkcy5oYXMoZnJvbU5vZGVJZCkpIHJldHVybjtcbiAgICAgICAgY29uc3Qgc291cmNlID0gbm9kZXNSZWYuY3VycmVudC5maW5kKChub2RlKSA9PiBub2RlLmlkID09PSBmcm9tTm9kZUlkKTtcbiAgICAgICAgaWYgKCFzb3VyY2UgfHwgIWlzQ2FudmFzUmVmZXJlbmNlTm9kZShzb3VyY2UsIG5vZGVzUmVmLmN1cnJlbnQpKSByZXR1cm47XG4gICAgICAgIHNldENvbm5lY3Rpb25zKChwcmV2KSA9PiBbLi4ucHJldiwgeyBpZDogbmFub2lkKCksIGZyb21Ob2RlSWQsIHRvTm9kZUlkOiByZWZlcmVuY2VQaWNrZXJOb2RlSWQgfV0pO1xuICAgIH0sIFtyZWZlcmVuY2VDb25uZWN0ZWROb2RlSWRzLCByZWZlcmVuY2VQaWNrZXJOb2RlSWRdKTtcblxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGlmICghcmVmZXJlbmNlUGlja2VyTm9kZUlkKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGV4aXQgPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC5rZXkgIT09IFwiRXNjYXBlXCIpIHJldHVybjtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV4aXROb2RlUmVmZXJlbmNlU2VsZWN0aW9uKCk7XG4gICAgICAgIH07XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBleGl0LCB0cnVlKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBleGl0LCB0cnVlKTtcbiAgICB9LCBbZXhpdE5vZGVSZWZlcmVuY2VTZWxlY3Rpb24sIHJlZmVyZW5jZVBpY2tlck5vZGVJZF0pO1xuXG4gICAgY29uc3QgZGVzZWxlY3RDYW52YXMgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgIGNhbmNlbFBlbmRpbmdDb25uZWN0aW9uQ3JlYXRlKCk7XG4gICAgICAgIHNldFNlbGVjdGVkTm9kZUlkcyhuZXcgU2V0KCkpO1xuICAgICAgICBzZXRTZWxlY3RlZENvbm5lY3Rpb25JZChudWxsKTtcbiAgICAgICAgc2V0Q29udGV4dE1lbnUobnVsbCk7XG4gICAgICAgIHNldFNlbGVjdGlvbkJveChudWxsKTtcbiAgICAgICAgc2V0SG92ZXJlZE5vZGVJZChudWxsKTtcbiAgICAgICAgc2V0VG9vbGJhck5vZGVJZChudWxsKTtcbiAgICAgICAgc2V0RGlhbG9nTm9kZUlkKG51bGwpO1xuICAgIH0sIFtjYW5jZWxQZW5kaW5nQ29ubmVjdGlvbkNyZWF0ZV0pO1xuXG4gICAgY29uc3QgY2xlYXJDYW52YXMgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgIHNldE5vZGVzKFtdKTtcbiAgICAgICAgc2V0Q29ubmVjdGlvbnMoW10pO1xuICAgICAgICBzZXRJbmZvTm9kZUlkKG51bGwpO1xuICAgICAgICBzZXRDcm9wTm9kZUlkKG51bGwpO1xuICAgICAgICBzZXRNYXNrRWRpdE5vZGVJZChudWxsKTtcbiAgICAgICAgc2V0QW5nbGVOb2RlSWQobnVsbCk7XG4gICAgICAgIHNldFByZXZpZXdOb2RlSWQobnVsbCk7XG4gICAgICAgIHNldFJ1bm5pbmdOb2RlSWQobnVsbCk7XG4gICAgICAgIGRlc2VsZWN0Q2FudmFzKCk7XG4gICAgICAgIHNldENsZWFyQ29uZmlybU9wZW4oZmFsc2UpO1xuICAgICAgICBjbGVhbnVwQ2FudmFzRmlsZXMoeyBwcm9qZWN0SWQsIG5vZGVzOiBbXSwgY2hhdFNlc3Npb25zOiBbXSB9KTtcbiAgICB9LCBbY2xlYW51cENhbnZhc0ZpbGVzLCBkZXNlbGVjdENhbnZhcywgcHJvamVjdElkXSk7XG5cbiAgICBjb25zdCBkdXBsaWNhdGVOb2RlID0gdXNlQ2FsbGJhY2soKG5vZGVJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IG5vZGVzUmVmLmN1cnJlbnQuZmluZCgobm9kZSkgPT4gbm9kZS5pZCA9PT0gbm9kZUlkKTtcbiAgICAgICAgaWYgKCFzb3VyY2UpIHJldHVybjtcblxuICAgICAgICBjb25zdCBpZCA9IGAke3NvdXJjZS50eXBlfS0ke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNyl9YDtcbiAgICAgICAgY29uc3QgbmV4dDogQ2FudmFzTm9kZURhdGEgPSB7XG4gICAgICAgICAgICAuLi5zb3VyY2UsXG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIHRpdGxlOiBgJHtzb3VyY2UudGl0bGV9IENvcHlgLFxuICAgICAgICAgICAgcG9zaXRpb246IHsgeDogc291cmNlLnBvc2l0aW9uLnggKyAzNiwgeTogc291cmNlLnBvc2l0aW9uLnkgKyAzNiB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIHNldE5vZGVzKChwcmV2KSA9PiBbLi4ucHJldiwgbmV4dF0pO1xuICAgICAgICBzZXRTZWxlY3RlZE5vZGVJZHMobmV3IFNldChbaWRdKSk7XG4gICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKG51bGwpO1xuICAgICAgICBpZiAobmV4dC50eXBlICE9PSBDYW52YXNOb2RlVHlwZS5Hcm91cCkgc2V0RGlhbG9nTm9kZUlkKGlkKTtcbiAgICB9LCBbXSk7XG5cbiAgICBjb25zdCBjb3B5U2VsZWN0ZWROb2RlcyA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRJZHMgPSBzZWxlY3RlZE5vZGVJZHNSZWYuY3VycmVudDtcbiAgICAgICAgaWYgKCFzZWxlY3RlZElkcy5zaXplKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgY29waWVkTm9kZXMgPSBub2Rlc1JlZi5jdXJyZW50XG4gICAgICAgICAgICAuZmlsdGVyKChub2RlKSA9PiBzZWxlY3RlZElkcy5oYXMobm9kZS5pZCkpXG4gICAgICAgICAgICAubWFwKChub2RlKSA9PiAoe1xuICAgICAgICAgICAgICAgIC4uLm5vZGUsXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHsgLi4ubm9kZS5wb3NpdGlvbiB9LFxuICAgICAgICAgICAgICAgIG1ldGFkYXRhOiBub2RlLm1ldGFkYXRhID8geyAuLi5ub2RlLm1ldGFkYXRhIH0gOiB1bmRlZmluZWQsXG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgaWYgKCFjb3BpZWROb2Rlcy5sZW5ndGgpIHJldHVybjtcblxuICAgICAgICBjbGlwYm9hcmRSZWYuY3VycmVudCA9IHtcbiAgICAgICAgICAgIG5vZGVzOiBjb3BpZWROb2RlcyxcbiAgICAgICAgICAgIGNvbm5lY3Rpb25zOiBjb25uZWN0aW9uc1JlZi5jdXJyZW50LmZpbHRlcigoY29ubmVjdGlvbikgPT4gc2VsZWN0ZWRJZHMuaGFzKGNvbm5lY3Rpb24uZnJvbU5vZGVJZCkgJiYgc2VsZWN0ZWRJZHMuaGFzKGNvbm5lY3Rpb24udG9Ob2RlSWQpKS5tYXAoKGNvbm5lY3Rpb24pID0+ICh7IC4uLmNvbm5lY3Rpb24gfSkpLFxuICAgICAgICB9O1xuICAgIH0sIFtdKTtcblxuICAgIGNvbnN0IHBhc3RlQ29waWVkTm9kZXMgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNsaXBib2FyZCA9IGNsaXBib2FyZFJlZi5jdXJyZW50O1xuICAgICAgICBpZiAoIWNsaXBib2FyZD8ubm9kZXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgY29uc3QgY2VudGVyID0gZ2V0Q2FudmFzQ2VudGVyKCk7XG4gICAgICAgIGNvbnN0IGJvdW5kcyA9IGNsaXBib2FyZC5ub2Rlcy5yZWR1Y2UoXG4gICAgICAgICAgICAoYWNjLCBub2RlKSA9PiAoe1xuICAgICAgICAgICAgICAgIGxlZnQ6IE1hdGgubWluKGFjYy5sZWZ0LCBub2RlLnBvc2l0aW9uLngpLFxuICAgICAgICAgICAgICAgIHRvcDogTWF0aC5taW4oYWNjLnRvcCwgbm9kZS5wb3NpdGlvbi55KSxcbiAgICAgICAgICAgICAgICByaWdodDogTWF0aC5tYXgoYWNjLnJpZ2h0LCBub2RlLnBvc2l0aW9uLnggKyBub2RlLndpZHRoKSxcbiAgICAgICAgICAgICAgICBib3R0b206IE1hdGgubWF4KGFjYy5ib3R0b20sIG5vZGUucG9zaXRpb24ueSArIG5vZGUuaGVpZ2h0KSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgeyBsZWZ0OiBJbmZpbml0eSwgdG9wOiBJbmZpbml0eSwgcmlnaHQ6IC1JbmZpbml0eSwgYm90dG9tOiAtSW5maW5pdHkgfSxcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgZHggPSBjZW50ZXIueCAtIChib3VuZHMubGVmdCArIGJvdW5kcy5yaWdodCkgLyAyO1xuICAgICAgICBjb25zdCBkeSA9IGNlbnRlci55IC0gKGJvdW5kcy50b3AgKyBib3VuZHMuYm90dG9tKSAvIDI7XG4gICAgICAgIGNvbnN0IGlkTWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgICAgICAgY29uc3QgbmV4dE5vZGVzID0gY2xpcGJvYXJkLm5vZGVzLm1hcCgobm9kZSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gYCR7bm9kZS50eXBlfS0ke0RhdGUubm93KCl9LSR7aW5kZXh9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNyl9YDtcbiAgICAgICAgICAgIGlkTWFwLnNldChub2RlLmlkLCBpZCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIC4uLm5vZGUsXG4gICAgICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICAgICAgdGl0bGU6IG5vZGUudGl0bGUuZW5kc1dpdGgoXCIgQ29weVwiKSA/IG5vZGUudGl0bGUgOiBgJHtub2RlLnRpdGxlfSBDb3B5YCxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICB4OiBub2RlLnBvc2l0aW9uLnggKyBkeCxcbiAgICAgICAgICAgICAgICAgICAgeTogbm9kZS5wb3NpdGlvbi55ICsgZHksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBtZXRhZGF0YTogbm9kZS5tZXRhZGF0YSA/IHsgLi4ubm9kZS5tZXRhZGF0YSB9IDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgcGFzdGVkTm9kZXMgPSBuZXh0Tm9kZXMubWFwKChub2RlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBncm91cElkID0gbm9kZS5tZXRhZGF0YT8uZ3JvdXBJZDtcbiAgICAgICAgICAgIGlmICghZ3JvdXBJZCkgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICByZXR1cm4geyAuLi5ub2RlLCBtZXRhZGF0YTogeyAuLi5ub2RlLm1ldGFkYXRhLCBncm91cElkOiBpZE1hcC5nZXQoZ3JvdXBJZCkgfSB9O1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBuZXh0Q29ubmVjdGlvbnMgPSBjbGlwYm9hcmQuY29ubmVjdGlvbnMuZmxhdE1hcCgoY29ubmVjdGlvbiwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZyb21Ob2RlSWQgPSBpZE1hcC5nZXQoY29ubmVjdGlvbi5mcm9tTm9kZUlkKTtcbiAgICAgICAgICAgIGNvbnN0IHRvTm9kZUlkID0gaWRNYXAuZ2V0KGNvbm5lY3Rpb24udG9Ob2RlSWQpO1xuICAgICAgICAgICAgaWYgKCFmcm9tTm9kZUlkIHx8ICF0b05vZGVJZCkgcmV0dXJuIFtdO1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIC4uLmNvbm5lY3Rpb24sXG4gICAgICAgICAgICAgICAgICAgIGlkOiBgY29ubi0ke0RhdGUubm93KCl9LSR7aW5kZXh9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNyl9YCxcbiAgICAgICAgICAgICAgICAgICAgZnJvbU5vZGVJZCxcbiAgICAgICAgICAgICAgICAgICAgdG9Ob2RlSWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNldE5vZGVzKChwcmV2KSA9PiBbLi4ucHJldiwgLi4ucGFzdGVkTm9kZXNdKTtcbiAgICAgICAgc2V0Q29ubmVjdGlvbnMoKHByZXYpID0+IFsuLi5wcmV2LCAuLi5uZXh0Q29ubmVjdGlvbnNdKTtcbiAgICAgICAgc2V0U2VsZWN0ZWROb2RlSWRzKG5ldyBTZXQocGFzdGVkTm9kZXMubWFwKChub2RlKSA9PiBub2RlLmlkKSkpO1xuICAgICAgICBzZXRTZWxlY3RlZENvbm5lY3Rpb25JZChudWxsKTtcbiAgICAgICAgc2V0Q29udGV4dE1lbnUobnVsbCk7XG4gICAgICAgIHNldERpYWxvZ05vZGVJZChwYXN0ZWROb2Rlc1swXT8udHlwZSA9PT0gQ2FudmFzTm9kZVR5cGUuR3JvdXAgPyBudWxsIDogcGFzdGVkTm9kZXNbMF0/LmlkIHx8IG51bGwpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LCBbZ2V0Q2FudmFzQ2VudGVyXSk7XG5cbiAgICBjb25zdCByZXNldFZpZXdwb3J0ID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgICAgICBzZXRWaWV3cG9ydCh7IHg6IHNpemUud2lkdGggLyAyLCB5OiBzaXplLmhlaWdodCAvIDIsIGs6IDEgfSk7XG4gICAgICAgIHNldENvbnRleHRNZW51KG51bGwpO1xuICAgIH0sIFtzaXplLmhlaWdodCwgc2l6ZS53aWR0aF0pO1xuXG4gICAgY29uc3QgZm9jdXNOb2RlID0gdXNlQ2FsbGJhY2soXG4gICAgICAgIChub2RlSWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzUmVmLmN1cnJlbnQuZmluZCgoaXRlbSkgPT4gaXRlbS5pZCA9PT0gbm9kZUlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3Qgd29ybGRYID0gbm9kZS5wb3NpdGlvbi54ICsgbm9kZS53aWR0aCAvIDI7XG4gICAgICAgICAgICBjb25zdCB3b3JsZFkgPSBub2RlLnBvc2l0aW9uLnkgKyBub2RlLmhlaWdodCAvIDI7XG4gICAgICAgICAgICBjb25zdCBrID0gTWF0aC5taW4oTWF0aC5tYXgoTWF0aC5taW4oKHNpemUud2lkdGggKiAwLjYpIC8gbm9kZS53aWR0aCwgKHNpemUuaGVpZ2h0ICogMC42KSAvIG5vZGUuaGVpZ2h0KSwgMC4wNSksIDEpO1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0geyB4OiBzaXplLndpZHRoIC8gMiAtIHdvcmxkWCAqIGssIHk6IHNpemUuaGVpZ2h0IC8gMiAtIHdvcmxkWSAqIGssIGsgfTtcbiAgICAgICAgICAgIHNldFNlbGVjdGVkTm9kZUlkcyhuZXcgU2V0KFtub2RlSWRdKSk7XG4gICAgICAgICAgICBzZXRTZWxlY3RlZENvbm5lY3Rpb25JZChudWxsKTtcbiAgICAgICAgICAgIHNldENvbnRleHRNZW51KG51bGwpO1xuXG4gICAgICAgICAgICBpZiAoZm9jdXNBbmltUmVmLmN1cnJlbnQpIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGZvY3VzQW5pbVJlZi5jdXJyZW50KTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0geyAuLi52aWV3cG9ydFJlZi5jdXJyZW50IH07XG4gICAgICAgICAgICBjb25zdCBkdXJhdGlvbiA9IDQ1MDtcbiAgICAgICAgICAgIGNvbnN0IGVhc2VPdXRDdWJpYyA9ICh0OiBudW1iZXIpID0+IDEgLSBNYXRoLnBvdygxIC0gdCwgMyk7XG4gICAgICAgICAgICBsZXQgc3RhcnRUaW1lOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IHN0ZXAgPSAobm93OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhcnRUaW1lID09PSBudWxsKSBzdGFydFRpbWUgPSBub3c7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBNYXRoLm1pbigobm93IC0gc3RhcnRUaW1lKSAvIGR1cmF0aW9uLCAxKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0ID0gZWFzZU91dEN1YmljKHByb2dyZXNzKTtcbiAgICAgICAgICAgICAgICBzZXRWaWV3cG9ydCh7IHg6IHN0YXJ0LnggKyAodGFyZ2V0LnggLSBzdGFydC54KSAqIHQsIHk6IHN0YXJ0LnkgKyAodGFyZ2V0LnkgLSBzdGFydC55KSAqIHQsIGs6IHN0YXJ0LmsgKyAodGFyZ2V0LmsgLSBzdGFydC5rKSAqIHQgfSk7XG4gICAgICAgICAgICAgICAgZm9jdXNBbmltUmVmLmN1cnJlbnQgPSBwcm9ncmVzcyA8IDEgPyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoc3RlcCkgOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGZvY3VzQW5pbVJlZi5jdXJyZW50ID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHN0ZXApO1xuICAgICAgICB9LFxuICAgICAgICBbc2l6ZS5oZWlnaHQsIHNpemUud2lkdGhdLFxuICAgICk7XG5cbiAgICB1c2VFZmZlY3QoKCkgPT4gKCkgPT4gdm9pZCAoZm9jdXNBbmltUmVmLmN1cnJlbnQgJiYgY2FuY2VsQW5pbWF0aW9uRnJhbWUoZm9jdXNBbmltUmVmLmN1cnJlbnQpKSwgW10pO1xuXG4gICAgY29uc3Qgc2V0Wm9vbVNjYWxlID0gdXNlQ2FsbGJhY2soXG4gICAgICAgIChzY2FsZTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuZXh0U2NhbGUgPSBNYXRoLm1pbihNYXRoLm1heChzY2FsZSwgMC4wNSksIDUpO1xuICAgICAgICAgICAgc2V0Vmlld3BvcnQoKHByZXYpID0+ICh7XG4gICAgICAgICAgICAgICAgeDogc2l6ZS53aWR0aCAvIDIgLSAoKHNpemUud2lkdGggLyAyIC0gcHJldi54KSAvIHByZXYuaykgKiBuZXh0U2NhbGUsXG4gICAgICAgICAgICAgICAgeTogc2l6ZS5oZWlnaHQgLyAyIC0gKChzaXplLmhlaWdodCAvIDIgLSBwcmV2LnkpIC8gcHJldi5rKSAqIG5leHRTY2FsZSxcbiAgICAgICAgICAgICAgICBrOiBuZXh0U2NhbGUsXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBzZXRDb250ZXh0TWVudShudWxsKTtcbiAgICAgICAgfSxcbiAgICAgICAgW3NpemUuaGVpZ2h0LCBzaXplLndpZHRoXSxcbiAgICApO1xuXG4gICAgY29uc3QgYXBwbHlIaXN0b3J5ID0gdXNlQ2FsbGJhY2soKGVudHJ5OiBDYW52YXNIaXN0b3J5RW50cnkpID0+IHtcbiAgICAgICAgaWYgKGhpc3RvcnlDb21taXRUaW1lclJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoaGlzdG9yeUNvbW1pdFRpbWVyUmVmLmN1cnJlbnQpO1xuICAgICAgICAgICAgaGlzdG9yeUNvbW1pdFRpbWVyUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGFwcGx5aW5nSGlzdG9yeVJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgc2V0Tm9kZXMoZW50cnkubm9kZXMpO1xuICAgICAgICBzZXRDb25uZWN0aW9ucyhlbnRyeS5jb25uZWN0aW9ucyk7XG4gICAgICAgIHNldENoYXRTZXNzaW9ucyhlbnRyeS5jaGF0U2Vzc2lvbnMpO1xuICAgICAgICBzZXRBY3RpdmVDaGF0SWQoZW50cnkuYWN0aXZlQ2hhdElkKTtcbiAgICAgICAgc2V0QmFja2dyb3VuZE1vZGUoZW50cnkuYmFja2dyb3VuZE1vZGUpO1xuICAgICAgICBzZXRTaG93SW1hZ2VJbmZvKGVudHJ5LnNob3dJbWFnZUluZm8pO1xuICAgICAgICBzZXRTZWxlY3RlZE5vZGVJZHMobmV3IFNldCgpKTtcbiAgICAgICAgc2V0U2VsZWN0ZWRDb25uZWN0aW9uSWQobnVsbCk7XG4gICAgICAgIHNldENvbnRleHRNZW51KG51bGwpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGxhc3RIaXN0b3J5UmVmLmN1cnJlbnQgPSBlbnRyeTtcbiAgICAgICAgICAgIGFwcGx5aW5nSGlzdG9yeVJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICBzZXRIaXN0b3J5U3RhdGUoeyBjYW5VbmRvOiBoaXN0b3J5UmVmLmN1cnJlbnQucGFzdC5sZW5ndGggPiAwLCBjYW5SZWRvOiBoaXN0b3J5UmVmLmN1cnJlbnQuZnV0dXJlLmxlbmd0aCA+IDAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sIFtdKTtcblxuICAgIGNvbnN0IHVuZG9DYW52YXMgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgIGNvbnN0IHByZXZpb3VzID0gaGlzdG9yeVJlZi5jdXJyZW50LnBhc3QucG9wKCk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSBsYXN0SGlzdG9yeVJlZi5jdXJyZW50O1xuICAgICAgICBpZiAoIXByZXZpb3VzIHx8ICFjdXJyZW50KSByZXR1cm47XG4gICAgICAgIGhpc3RvcnlSZWYuY3VycmVudC5mdXR1cmUucHVzaChjdXJyZW50KTtcbiAgICAgICAgYXBwbHlIaXN0b3J5KHByZXZpb3VzKTtcbiAgICB9LCBbYXBwbHlIaXN0b3J5XSk7XG5cbiAgICBjb25zdCByZWRvQ2FudmFzID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgICAgICBjb25zdCBuZXh0ID0gaGlzdG9yeVJlZi5jdXJyZW50LmZ1dHVyZS5wb3AoKTtcbiAgICAgICAgY29uc3QgY3VycmVudCA9IGxhc3RIaXN0b3J5UmVmLmN1cnJlbnQ7XG4gICAgICAgIGlmICghbmV4dCB8fCAhY3VycmVudCkgcmV0dXJuO1xuICAgICAgICBoaXN0b3J5UmVmLmN1cnJlbnQucGFzdC5wdXNoKGN1cnJlbnQpO1xuICAgICAgICBhcHBseUhpc3RvcnkobmV4dCk7XG4gICAgfSwgW2FwcGx5SGlzdG9yeV0pO1xuXG4gICAgY29uc3QgY3JlYXRlQW5kT3BlblByb2plY3QgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgIGNvbnN0IGlkID0gY3JlYXRlUHJvamVjdCh0KFwiY2FudmFzLmRlZmF1bHRUaXRsZVwiLCB7IGNvdW50OiB1c2VDYW52YXNTdG9yZS5nZXRTdGF0ZSgpLnByb2plY3RzLmxlbmd0aCArIDEgfSkpO1xuICAgICAgICBuYXZpZ2F0ZShgL2NhbnZhcy8ke2lkfWApO1xuICAgIH0sIFtjcmVhdGVQcm9qZWN0LCBuYXZpZ2F0ZSwgdF0pO1xuXG4gICAgY29uc3QgZGVsZXRlQ3VycmVudFByb2plY3QgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgIGRlbGV0ZVByb2plY3RzKFtwcm9qZWN0SWRdKTtcbiAgICAgICAgY2xlYW51cEFzc2V0SW1hZ2VzKCk7XG4gICAgICAgIG5hdmlnYXRlKFwiL2NhbnZhc1wiKTtcbiAgICB9LCBbY2xlYW51cEFzc2V0SW1hZ2VzLCBkZWxldGVQcm9qZWN0cywgbmF2aWdhdGUsIHByb2plY3RJZF0pO1xuXG4gICAgY29uc3QgZXhwb3J0Q3VycmVudFByb2plY3QgPSB1c2VDYWxsYmFjayhhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHByb2plY3QgPSB1c2VDYW52YXNTdG9yZS5nZXRTdGF0ZSgpLnByb2plY3RzLmZpbmQoKGl0ZW0pID0+IGl0ZW0uaWQgPT09IHByb2plY3RJZCk7XG4gICAgICAgIGlmICghcHJvamVjdCkgcmV0dXJuIG1lc3NhZ2UuZXJyb3IodChcImNhbnZhcy5wcm9qZWN0UGFnZS5ub3RGb3VuZFwiKSk7XG4gICAgICAgIGNvbnN0IGhpZGUgPSBtZXNzYWdlLmxvYWRpbmcodChcImNhbnZhcy5wcm9qZWN0UGFnZS5leHBvcnRpbmdcIiksIDApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgZXhwb3J0Q2FudmFzUHJvamVjdHMoW3Byb2plY3RdLCBwcm9qZWN0LnRpdGxlIHx8IHQoXCJjYW52YXMudGl0bGVcIikpO1xuICAgICAgICAgICAgbWVzc2FnZS5zdWNjZXNzKHQoXCJjYW52YXMucHJvamVjdFBhZ2UuZXhwb3J0ZWRcIikpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICBtZXNzYWdlLmVycm9yKHQoXCJjYW52YXMuc2lkZVBhbmVsLmV4cG9ydEZhaWxlZFwiKSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBoaWRlKCk7XG4gICAgICAgIH1cbiAgICB9LCBbbWVzc2FnZSwgcHJvamVjdElkLCB0XSk7XG5cbiAgICBjb25zdCBoYW5kbGVDYW52YXNNb3VzZURvd24gPSB1c2VDYWxsYmFjayhcbiAgICAgICAgKGV2ZW50OiBSZWFjdFBvaW50ZXJFdmVudDxIVE1MRGl2RWxlbWVudD4pID0+IHtcbiAgICAgICAgICAgIHNldENvbnRleHRNZW51KG51bGwpO1xuICAgICAgICAgICAgc2V0Tm9kZUNyZWF0ZVBvc2l0aW9uKG51bGwpO1xuICAgICAgICAgICAgc2V0SG92ZXJlZE5vZGVJZChudWxsKTtcbiAgICAgICAgICAgIHNldFRvb2xiYXJOb2RlSWQobnVsbCk7XG4gICAgICAgICAgICBzZXREaWFsb2dOb2RlSWQobnVsbCk7XG4gICAgICAgICAgICBpZiAocGVuZGluZ0Nvbm5lY3Rpb25DcmVhdGVSZWYuY3VycmVudCkgY2FuY2VsUGVuZGluZ0Nvbm5lY3Rpb25DcmVhdGUoKTtcbiAgICAgICAgICAgIGlmIChldmVudC5idXR0b24gIT09IDApIHJldHVybjtcblxuICAgICAgICAgICAgY29uc3Qgd29ybGQgPSBzY3JlZW5Ub0NhbnZhcyhldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKTtcbiAgICAgICAgICAgIGNvbnN0IG5leHRTZWxlY3Rpb25Cb3ggPSB7XG4gICAgICAgICAgICAgICAgc3RhcnRXb3JsZFg6IHdvcmxkLngsXG4gICAgICAgICAgICAgICAgc3RhcnRXb3JsZFk6IHdvcmxkLnksXG4gICAgICAgICAgICAgICAgY3VycmVudFdvcmxkWDogd29ybGQueCxcbiAgICAgICAgICAgICAgICBjdXJyZW50V29ybGRZOiB3b3JsZC55LFxuICAgICAgICAgICAgICAgIGFkZGl0aXZlOiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgICAgICBpbml0aWFsU2VsZWN0ZWROb2RlSWRzOiBldmVudC5zaGlmdEtleSA/IEFycmF5LmZyb20oc2VsZWN0ZWROb2RlSWRzUmVmLmN1cnJlbnQpIDogW10sXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgc2VsZWN0aW9uQm94UmVmLmN1cnJlbnQgPSBuZXh0U2VsZWN0aW9uQm94O1xuICAgICAgICAgICAgc2V0U2VsZWN0aW9uQm94KG5leHRTZWxlY3Rpb25Cb3gpO1xuICAgICAgICAgICAgaWYgKCFldmVudC5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkTm9kZUlkcyhuZXcgU2V0KCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXRTZWxlY3RlZENvbm5lY3Rpb25JZChudWxsKTtcbiAgICAgICAgfSxcbiAgICAgICAgW2NhbmNlbFBlbmRpbmdDb25uZWN0aW9uQ3JlYXRlLCBzY3JlZW5Ub0NhbnZhc10sXG4gICAgKTtcblxuICAgIC8vIFNlbGVjdGlvbi1vbmx5IGxvZ2ljIHNoYXJlZCBieSB0aGUgYnViYmxpbmcgZHJhZyBlbnRyeSBwb2ludCBhbmQgb3V0ZXIgY2FwdHVyZSBoYW5kbGVyLlxuICAgIC8vIFJldHVybnMgdGhlIHNpbmdsZSB0YXJnZXQgSUQgYWZ0ZXIgdGhlIGNsaWNrLCBvciBudWxsIGZvciBtdWx0aS1zZWxlY3Rpb24gb3IgZGVzZWxlY3Rpb24sIHRvIHN5bmMgdGhlIHRvb2xiYXIuXG4gICAgY29uc3Qgc2VsZWN0Tm9kZUJ5RXZlbnQgPSB1c2VDYWxsYmFjaygoZXZlbnQ6IFBpY2s8UmVhY3RNb3VzZUV2ZW50LCBcInNoaWZ0S2V5XCIgfCBcIm1ldGFLZXlcIiB8IFwiY3RybEtleVwiPiwgbm9kZUlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3QgbmV4dFNlbGVjdGVkID0gbmV3IFNldChzZWxlY3RlZE5vZGVJZHNSZWYuY3VycmVudCk7XG4gICAgICAgIGlmIChldmVudC5zaGlmdEtleSB8fCBldmVudC5tZXRhS2V5IHx8IGV2ZW50LmN0cmxLZXkpIHtcbiAgICAgICAgICAgIGlmIChuZXh0U2VsZWN0ZWQuaGFzKG5vZGVJZCkpIG5leHRTZWxlY3RlZC5kZWxldGUobm9kZUlkKTtcbiAgICAgICAgICAgIGVsc2UgbmV4dFNlbGVjdGVkLmFkZChub2RlSWQpO1xuICAgICAgICB9IGVsc2UgaWYgKCFuZXh0U2VsZWN0ZWQuaGFzKG5vZGVJZCkpIHtcbiAgICAgICAgICAgIG5leHRTZWxlY3RlZC5jbGVhcigpO1xuICAgICAgICAgICAgbmV4dFNlbGVjdGVkLmFkZChub2RlSWQpO1xuICAgICAgICB9XG4gICAgICAgIHNldFNlbGVjdGVkTm9kZUlkcyhuZXh0U2VsZWN0ZWQpO1xuICAgICAgICBjb25zdCBzb2xvSWQgPSBuZXh0U2VsZWN0ZWQuc2l6ZSA9PT0gMSAmJiBuZXh0U2VsZWN0ZWQuaGFzKG5vZGVJZCkgPyBub2RlSWQgOiBudWxsO1xuICAgICAgICBzZXRUb29sYmFyTm9kZUlkKHNvbG9JZCk7XG4gICAgICAgIHJldHVybiB7IG5leHRTZWxlY3RlZCwgc29sb0lkIH07XG4gICAgfSwgW10pO1xuXG4gICAgLy8gQ2FwdHVyZS1waGFzZSBzZWxlY3Rpb24gbGV0cyBhbnkgaW5uZXIgZWxlbWVudCwgaW5jbHVkaW5nIHRleHRhcmVhIG9yIGlmcmFtZSwgc2VsZWN0IHRoZSBub2RlIGFuZCBzaG93IGl0cyB0b29sYmFyLlxuICAgIC8vIEl0IG9ubHkgc2VsZWN0czsgYm9keSBvbk1vdXNlRG93biBzdGlsbCBzdGFydHMgZHJhZ2dpbmcsIHNvIHRleHQgc2VsZWN0aW9uIGluc2lkZSBlZGl0b3JzIGRvZXMgbm90IGRyYWcgdGhlIG5vZGUuXG4gICAgLy8gQ2FjaGUgdGhlIGNhcHR1cmUgcmVzdWx0IGZvciB0aGUgZm9sbG93aW5nIGJ1YmJsaW5nIGRyYWcgaGFuZGxlciB0byBhdm9pZCBhcHBseWluZyBzaGlmdC1zZWxlY3Rpb24gdHdpY2UuXG4gICAgY29uc3QgcGVuZGluZ1NlbGVjdGlvblJlZiA9IHVzZVJlZjxTZXQ8c3RyaW5nPiB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IGhhbmRsZU5vZGVTZWxlY3RDYXB0dXJlID0gdXNlQ2FsbGJhY2soXG4gICAgICAgIChldmVudDogUmVhY3RNb3VzZUV2ZW50LCBub2RlSWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiAhPT0gMCkgcmV0dXJuO1xuICAgICAgICAgICAgc2V0Q29udGV4dE1lbnUobnVsbCk7XG4gICAgICAgICAgICBzZXRIb3ZlcmVkTm9kZUlkKG51bGwpO1xuICAgICAgICAgICAgc2V0U2VsZWN0ZWRDb25uZWN0aW9uSWQobnVsbCk7XG4gICAgICAgICAgICBjb25zdCB7IG5leHRTZWxlY3RlZCB9ID0gc2VsZWN0Tm9kZUJ5RXZlbnQoZXZlbnQsIG5vZGVJZCk7XG4gICAgICAgICAgICBwZW5kaW5nU2VsZWN0aW9uUmVmLmN1cnJlbnQgPSBuZXh0U2VsZWN0ZWQ7XG4gICAgICAgIH0sXG4gICAgICAgIFtzZWxlY3ROb2RlQnlFdmVudF0sXG4gICAgKTtcblxuICAgIGNvbnN0IGhhbmRsZU5vZGVNb3VzZURvd24gPSB1c2VDYWxsYmFjaygoZXZlbnQ6IFJlYWN0TW91c2VFdmVudCwgbm9kZUlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIC8vIENhcHR1cmUgYWxyZWFkeSBzZWxlY3RlZCB0aGUgbm9kZTsgdGhpcyBvbmx5IHN0YXJ0cyBkcmFnZ2luZywgd2l0aCBhIGZhbGxiYWNrIHNlbGVjdGlvbiBpZiBjYXB0dXJlIGRpZCBub3QgcnVuLlxuICAgICAgICBjb25zdCBjdXJyZW50Tm9kZXMgPSBub2Rlc1JlZi5jdXJyZW50O1xuICAgICAgICBjb25zdCBuZXh0U2VsZWN0ZWQgPSBwZW5kaW5nU2VsZWN0aW9uUmVmLmN1cnJlbnQgPz8gc2VsZWN0Tm9kZUJ5RXZlbnQoZXZlbnQsIG5vZGVJZCkubmV4dFNlbGVjdGVkO1xuICAgICAgICBwZW5kaW5nU2VsZWN0aW9uUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgICBjb25zdCBkcmFnSWRzID0gbmV3IFNldChuZXh0U2VsZWN0ZWQpO1xuICAgICAgICBjdXJyZW50Tm9kZXMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFuZXh0U2VsZWN0ZWQuaGFzKG5vZGUuaWQpKSByZXR1cm47XG4gICAgICAgICAgICBpZiAobm9kZS50eXBlID09PSBDYW52YXNOb2RlVHlwZS5Hcm91cCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnROb2Rlcy5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQubWV0YWRhdGE/Lmdyb3VwSWQgPT09IG5vZGUuaWQpIGRyYWdJZHMuYWRkKGNoaWxkLmlkKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRyYWdSZWYuY3VycmVudCA9IHtcbiAgICAgICAgICAgIGlzRHJhZ2dpbmdOb2RlOiB0cnVlLFxuICAgICAgICAgICAgaGFzTW92ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgc3RhcnRYOiBldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgc3RhcnRZOiBldmVudC5jbGllbnRZLFxuICAgICAgICAgICAgaW5pdGlhbFNlbGVjdGVkTm9kZXM6IGN1cnJlbnROb2Rlcy5maWx0ZXIoKG5vZGUpID0+IGRyYWdJZHMuaGFzKG5vZGUuaWQpKS5tYXAoKG5vZGUpID0+ICh7IGlkOiBub2RlLmlkLCB4OiBub2RlLnBvc2l0aW9uLngsIHk6IG5vZGUucG9zaXRpb24ueSB9KSksXG4gICAgICAgIH07XG4gICAgICAgIGhpc3RvcnlQYXVzZWRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgICAgIG5vZGVEcmFnZ2luZ1JlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgc2V0SXNOb2RlRHJhZ2dpbmcodHJ1ZSk7XG4gICAgfSwgW10pO1xuXG4gICAgY29uc3QgZmluaXNoTm9kZURyYWcgPSB1c2VDYWxsYmFjaygoY2xpZW50WD86IG51bWJlciwgY2xpZW50WT86IG51bWJlcikgPT4ge1xuICAgICAgICBpZiAocmFmUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHJhZlJlZi5jdXJyZW50KTtcbiAgICAgICAgICAgIHJhZlJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRyYWdSZWYuY3VycmVudC5pc0RyYWdnaW5nTm9kZSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHdhc0NsaWNrID0gIWRyYWdSZWYuY3VycmVudC5oYXNNb3ZlZCAmJiBkcmFnUmVmLmN1cnJlbnQuaW5pdGlhbFNlbGVjdGVkTm9kZXMubGVuZ3RoID09PSAxO1xuICAgICAgICBjb25zdCBjbGlja2VkTm9kZUlkID0gZHJhZ1JlZi5jdXJyZW50LmluaXRpYWxTZWxlY3RlZE5vZGVzWzBdPy5pZDtcbiAgICAgICAgY29uc3QgY3VycmVudFZpZXdwb3J0ID0gdmlld3BvcnRSZWYuY3VycmVudDtcbiAgICAgICAgY29uc3QgZHggPSBjbGllbnRYID09IG51bGwgPyAwIDogKGNsaWVudFggLSBkcmFnUmVmLmN1cnJlbnQuc3RhcnRYKSAvIGN1cnJlbnRWaWV3cG9ydC5rO1xuICAgICAgICBjb25zdCBkeSA9IGNsaWVudFkgPT0gbnVsbCA/IDAgOiAoY2xpZW50WSAtIGRyYWdSZWYuY3VycmVudC5zdGFydFkpIC8gY3VycmVudFZpZXdwb3J0Lms7XG4gICAgICAgIGNvbnN0IGluaXRpYWxQb3NpdGlvbnMgPSBkcmFnUmVmLmN1cnJlbnQuaW5pdGlhbFNlbGVjdGVkTm9kZXM7XG5cbiAgICAgICAgaGlzdG9yeVBhdXNlZFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgIG5vZGVEcmFnZ2luZ1JlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgIHNldElzTm9kZURyYWdnaW5nKGZhbHNlKTtcbiAgICAgICAgc2V0RHJvcFRhcmdldEdyb3VwSWQobnVsbCk7XG4gICAgICAgIGlmIChkcmFnUmVmLmN1cnJlbnQuaGFzTW92ZWQgJiYgY2xpZW50WCAhPSBudWxsICYmIGNsaWVudFkgIT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc3QgbW92ZWRJZHMgPSBuZXcgU2V0KGluaXRpYWxQb3NpdGlvbnMubWFwKChpdGVtKSA9PiBpdGVtLmlkKSk7XG4gICAgICAgICAgICBzZXROb2RlcygocHJldikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1vdmVkID0gcHJldi5tYXAoKG5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5pdGlhbCA9IGluaXRpYWxQb3NpdGlvbnMuZmluZCgoaXRlbSkgPT4gaXRlbS5pZCA9PT0gbm9kZS5pZCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbml0aWFsID8geyAuLi5ub2RlLCBwb3NpdGlvbjogeyB4OiBpbml0aWFsLnggKyBkeCwgeTogaW5pdGlhbC55ICsgZHkgfSB9IDogbm9kZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRHcm91cCA9IGZpbmRHcm91cERyb3BUYXJnZXQobW92ZWRJZHMsIG1vdmVkKTtcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0R3JvdXApIHJldHVybiBzbmFwTm9kZXNJbnRvR3JvdXAobW92ZWRJZHMsIG1vdmVkLCB0YXJnZXRHcm91cCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vdmVkLm1hcCgobm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1vdmVkSWRzLmhhcyhub2RlLmlkKSB8fCBub2RlLnR5cGUgPT09IENhbnZhc05vZGVUeXBlLkdyb3VwKSByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JvdXBJZCA9IGZpbmRDb250YWluaW5nR3JvdXBJZChub2RlLCBtb3ZlZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLm1ldGFkYXRhPy5ncm91cElkID09PSBncm91cElkKSByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgLi4ubm9kZSwgbWV0YWRhdGE6IHsgLi4ubm9kZS5tZXRhZGF0YSwgZ3JvdXBJZCB9IH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRyYWdSZWYuY3VycmVudC5pc0RyYWdnaW5nTm9kZSA9IGZhbHNlO1xuICAgICAgICBkcmFnUmVmLmN1cnJlbnQuaGFzTW92ZWQgPSBmYWxzZTtcbiAgICAgICAgZHJhZ1JlZi5jdXJyZW50LmluaXRpYWxTZWxlY3RlZE5vZGVzID0gW107XG4gICAgICAgIGlmICh3YXNDbGljayAmJiBjbGlja2VkTm9kZUlkKSB7XG4gICAgICAgICAgICBjb25zdCBjbGlja2VkTm9kZSA9IG5vZGVzUmVmLmN1cnJlbnQuZmluZCgobm9kZSkgPT4gbm9kZS5pZCA9PT0gY2xpY2tlZE5vZGVJZCk7XG4gICAgICAgICAgICBjb25zdCBjbGlja2VkRGVmaW5pdGlvbiA9IGNsaWNrZWROb2RlID8gZ2V0Tm9kZURlZmluaXRpb24oY2xpY2tlZE5vZGUudHlwZSkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAoY2xpY2tlZERlZmluaXRpb24/LmhpZGVQYW5lbCkge1xuICAgICAgICAgICAgICAgIC8vIENsaWNraW5nIGEgZGlzcGxheS1vbmx5IHBsdWdpbiBub2RlIHNlbGVjdHMgaXQgd2l0aG91dCBvcGVuaW5nIGEgbG93ZXIgcGFuZWwuXG4gICAgICAgICAgICAgICAgc2V0RGlhbG9nTm9kZUlkKChjdXJyZW50KSA9PiAoY3VycmVudCA9PT0gY2xpY2tlZE5vZGVJZCA/IGN1cnJlbnQgOiBudWxsKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNsaWNrZWROb2RlPy50eXBlICE9PSBDYW52YXNOb2RlVHlwZS5Hcm91cCkge1xuICAgICAgICAgICAgICAgIHNldERpYWxvZ05vZGVJZChjbGlja2VkTm9kZUlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIFtdKTtcblxuICAgIGNvbnN0IGhhbmRsZUdsb2JhbE1vdXNlTW92ZSA9IHVzZUNhbGxiYWNrKFxuICAgICAgICAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRWaWV3cG9ydCA9IHZpZXdwb3J0UmVmLmN1cnJlbnQ7XG5cbiAgICAgICAgICAgIGlmIChkcmFnUmVmLmN1cnJlbnQuaXNEcmFnZ2luZ05vZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkeCA9IChldmVudC5jbGllbnRYIC0gZHJhZ1JlZi5jdXJyZW50LnN0YXJ0WCkgLyBjdXJyZW50Vmlld3BvcnQuaztcbiAgICAgICAgICAgICAgICBjb25zdCBkeSA9IChldmVudC5jbGllbnRZIC0gZHJhZ1JlZi5jdXJyZW50LnN0YXJ0WSkgLyBjdXJyZW50Vmlld3BvcnQuaztcbiAgICAgICAgICAgICAgICBjb25zdCBpbml0aWFsUG9zaXRpb25zID0gZHJhZ1JlZi5jdXJyZW50LmluaXRpYWxTZWxlY3RlZE5vZGVzO1xuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhldmVudC5jbGllbnRYIC0gZHJhZ1JlZi5jdXJyZW50LnN0YXJ0WCkgPiAzIHx8IE1hdGguYWJzKGV2ZW50LmNsaWVudFkgLSBkcmFnUmVmLmN1cnJlbnQuc3RhcnRZKSA+IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgZHJhZ1JlZi5jdXJyZW50Lmhhc01vdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBtb3ZlZElkcyA9IG5ldyBTZXQoaW5pdGlhbFBvc2l0aW9ucy5tYXAoKGl0ZW0pID0+IGl0ZW0uaWQpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcmV2aWV3Tm9kZXMgPSBub2Rlc1JlZi5jdXJyZW50Lm1hcCgobm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbml0aWFsID0gaW5pdGlhbFBvc2l0aW9ucy5maW5kKChpdGVtKSA9PiBpdGVtLmlkID09PSBub2RlLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluaXRpYWwgPyB7IC4uLm5vZGUsIHBvc2l0aW9uOiB7IHg6IGluaXRpYWwueCArIGR4LCB5OiBpbml0aWFsLnkgKyBkeSB9IH0gOiBub2RlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHNldERyb3BUYXJnZXRHcm91cElkKGZpbmRHcm91cERyb3BUYXJnZXQobW92ZWRJZHMsIHByZXZpZXdOb2Rlcyk/LmlkIHx8IG51bGwpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJhZlJlZi5jdXJyZW50KSBjYW5jZWxBbmltYXRpb25GcmFtZShyYWZSZWYuY3VycmVudCk7XG4gICAgICAgICAgICAgICAgcmFmUmVmLmN1cnJlbnQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzZXROb2RlcygocHJldikgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXYubWFwKChub2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5pdGlhbCA9IGluaXRpYWxQb3NpdGlvbnMuZmluZCgoaXRlbSkgPT4gaXRlbS5pZCA9PT0gbm9kZS5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluaXRpYWwgPyB7IC4uLm5vZGUsIHBvc2l0aW9uOiB7IHg6IGluaXRpYWwueCArIGR4LCB5OiBpbml0aWFsLnkgKyBkeSB9IH0gOiBub2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHJhZlJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjb25uZWN0aW5nUGFyYW1zUmVmLmN1cnJlbnQgJiYgIXBlbmRpbmdDb25uZWN0aW9uQ3JlYXRlUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkcm9wVGFyZ2V0ID0gZ2V0Q29ubmVjdGlvbkRyb3BUYXJnZXQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSwgY29ubmVjdGluZ1BhcmFtc1JlZi5jdXJyZW50KTtcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uVGFyZ2V0Tm9kZUlkUmVmLmN1cnJlbnQgPSBkcm9wVGFyZ2V0Lm5vZGVJZDtcbiAgICAgICAgICAgICAgICBzZXRDb25uZWN0aW9uVGFyZ2V0Tm9kZUlkKGRyb3BUYXJnZXQubm9kZUlkKTtcbiAgICAgICAgICAgICAgICBzZXRNb3VzZVdvcmxkKHNjcmVlblRvQ2FudmFzKGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgW2ZpbmlzaE5vZGVEcmFnLCBnZXRDb25uZWN0aW9uRHJvcFRhcmdldCwgc2NyZWVuVG9DYW52YXNdLFxuICAgICk7XG5cbiAgICBjb25zdCBoYW5kbGVHbG9iYWxQb2ludGVyTW92ZSA9IHVzZUNhbGxiYWNrKFxuICAgICAgICAoZXZlbnQ6IFBvaW50ZXJFdmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudFNlbGVjdGlvbiA9IHNlbGVjdGlvbkJveFJlZi5jdXJyZW50O1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50U2VsZWN0aW9uKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmIChldmVudC5idXR0b25zID09PSAwKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uQm94UmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIHNldFNlbGVjdGlvbkJveChudWxsKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHdvcmxkID0gc2NyZWVuVG9DYW52YXMoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSk7XG4gICAgICAgICAgICBjb25zdCByZWN0WCA9IE1hdGgubWluKGN1cnJlbnRTZWxlY3Rpb24uc3RhcnRXb3JsZFgsIHdvcmxkLngpO1xuICAgICAgICAgICAgY29uc3QgcmVjdFkgPSBNYXRoLm1pbihjdXJyZW50U2VsZWN0aW9uLnN0YXJ0V29ybGRZLCB3b3JsZC55KTtcbiAgICAgICAgICAgIGNvbnN0IHJlY3RXID0gTWF0aC5hYnMod29ybGQueCAtIGN1cnJlbnRTZWxlY3Rpb24uc3RhcnRXb3JsZFgpO1xuICAgICAgICAgICAgY29uc3QgcmVjdEggPSBNYXRoLmFicyh3b3JsZC55IC0gY3VycmVudFNlbGVjdGlvbi5zdGFydFdvcmxkWSk7XG4gICAgICAgICAgICBjb25zdCBuZXh0U2VsZWN0ZWQgPSBuZXcgU2V0PHN0cmluZz4oY3VycmVudFNlbGVjdGlvbi5hZGRpdGl2ZSA/IGN1cnJlbnRTZWxlY3Rpb24uaW5pdGlhbFNlbGVjdGVkTm9kZUlkcyA6IFtdKTtcblxuICAgICAgICAgICAgbm9kZXNSZWYuY3VycmVudFxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGludGVyc2VjdHMgPSByZWN0WCA8IG5vZGUucG9zaXRpb24ueCArIG5vZGUud2lkdGggJiYgcmVjdFggKyByZWN0VyA+IG5vZGUucG9zaXRpb24ueCAmJiByZWN0WSA8IG5vZGUucG9zaXRpb24ueSArIG5vZGUuaGVpZ2h0ICYmIHJlY3RZICsgcmVjdEggPiBub2RlLnBvc2l0aW9uLnk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyc2VjdHMpIG5leHRTZWxlY3RlZC5hZGQobm9kZS5pZCk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IG5leHRTZWxlY3Rpb25Cb3ggPSB7IC4uLmN1cnJlbnRTZWxlY3Rpb24sIGN1cnJlbnRXb3JsZFg6IHdvcmxkLngsIGN1cnJlbnRXb3JsZFk6IHdvcmxkLnkgfTtcbiAgICAgICAgICAgIHNlbGVjdGlvbkJveFJlZi5jdXJyZW50ID0gbmV4dFNlbGVjdGlvbkJveDtcbiAgICAgICAgICAgIHNldFNlbGVjdGlvbkJveChuZXh0U2VsZWN0aW9uQm94KTtcbiAgICAgICAgICAgIHNldFNlbGVjdGVkTm9kZUlkcyhuZXh0U2VsZWN0ZWQpO1xuICAgICAgICB9LFxuICAgICAgICBbc2NyZWVuVG9DYW52YXNdLFxuICAgICk7XG5cbiAgICBjb25zdCBoYW5kbGVHbG9iYWxNb3VzZVVwID0gdXNlQ2FsbGJhY2soXG4gICAgICAgIChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgZmluaXNoTm9kZURyYWcoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSk7XG5cbiAgICAgICAgICAgIHNlbGVjdGlvbkJveFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgICAgIHNldFNlbGVjdGlvbkJveChudWxsKTtcblxuICAgICAgICAgICAgaWYgKHBlbmRpbmdDb25uZWN0aW9uQ3JlYXRlUmVmLmN1cnJlbnQpIHJldHVybjtcblxuICAgICAgICAgICAgY29uc3QgY3VycmVudENvbm5lY3Rpb24gPSBjb25uZWN0aW5nUGFyYW1zUmVmLmN1cnJlbnQ7XG4gICAgICAgICAgICBpZiAoY3VycmVudENvbm5lY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkcm9wVGFyZ2V0ID0gZ2V0Q29ubmVjdGlvbkRyb3BUYXJnZXQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSwgY3VycmVudENvbm5lY3Rpb24pO1xuICAgICAgICAgICAgICAgIGlmIChkcm9wVGFyZ2V0Lm5vZGVJZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25uZWN0Tm9kZXMoY3VycmVudENvbm5lY3Rpb24sIGRyb3BUYXJnZXQubm9kZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0Q29ubmVjdGluZyhudWxsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRyb3BUYXJnZXQuaXNOZWFyTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRDb25uZWN0aW5nKG51bGwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNldE1vdXNlV29ybGQoc2NyZWVuVG9DYW52YXMoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpO1xuICAgICAgICAgICAgICAgICAgICBzZXRQZW5kaW5nQ29ubmVjdGlvbkNyZWF0ZSh7IGNvbm5lY3Rpb246IGN1cnJlbnRDb25uZWN0aW9uLCBwb3NpdGlvbjogc2NyZWVuVG9DYW52YXMoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBbY29ubmVjdE5vZGVzLCBmaW5pc2hOb2RlRHJhZywgZ2V0Q29ubmVjdGlvbkRyb3BUYXJnZXQsIHNjcmVlblRvQ2FudmFzLCBzZXRDb25uZWN0aW5nXSxcbiAgICApO1xuXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgY29uc3QgaGFuZGxlUG9pbnRlclVwID0gKGV2ZW50OiBQb2ludGVyRXZlbnQpID0+IGZpbmlzaE5vZGVEcmFnKGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpO1xuICAgICAgICBjb25zdCBjYW5jZWxOb2RlRHJhZyA9ICgpID0+IGZpbmlzaE5vZGVEcmFnKCk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIGhhbmRsZUdsb2JhbE1vdXNlTW92ZSk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBoYW5kbGVHbG9iYWxNb3VzZVVwKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVydXBcIiwgaGFuZGxlUG9pbnRlclVwKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVyY2FuY2VsXCIsIGNhbmNlbE5vZGVEcmFnKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsIGNhbmNlbE5vZGVEcmFnKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVybW92ZVwiLCBoYW5kbGVHbG9iYWxQb2ludGVyTW92ZSk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBoYW5kbGVHbG9iYWxNb3VzZU1vdmUpO1xuICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIGhhbmRsZUdsb2JhbE1vdXNlVXApO1xuICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVydXBcIiwgaGFuZGxlUG9pbnRlclVwKTtcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwicG9pbnRlcmNhbmNlbFwiLCBjYW5jZWxOb2RlRHJhZyk7XG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgY2FuY2VsTm9kZURyYWcpO1xuICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVybW92ZVwiLCBoYW5kbGVHbG9iYWxQb2ludGVyTW92ZSk7XG4gICAgICAgIH07XG4gICAgfSwgW2ZpbmlzaE5vZGVEcmFnLCBoYW5kbGVHbG9iYWxNb3VzZU1vdmUsIGhhbmRsZUdsb2JhbE1vdXNlVXAsIGhhbmRsZUdsb2JhbFBvaW50ZXJNb3ZlXSk7XG5cbiAgICBjb25zdCBjcmVhdGVJbWFnZUZpbGVOb2RlID0gdXNlQ2FsbGJhY2soYXN5bmMgKGZpbGU6IEZpbGUsIHBvc2l0aW9uOiBQb3NpdGlvbikgPT4ge1xuICAgICAgICBjb25zdCBpbWFnZSA9IGF3YWl0IHVwbG9hZEltYWdlKGZpbGUpO1xuICAgICAgICBjb25zdCBzaXplID0gZml0Tm9kZVNpemUoaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XG4gICAgICAgIGNvbnN0IGlkID0gYGltYWdlLSR7RGF0ZS5ub3coKX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA3KX1gO1xuICAgICAgICBjb25zdCBuZXdOb2RlOiBDYW52YXNOb2RlRGF0YSA9IHtcbiAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgdHlwZTogQ2FudmFzTm9kZVR5cGUuSW1hZ2UsXG4gICAgICAgICAgICB0aXRsZTogZmlsZS5uYW1lLFxuICAgICAgICAgICAgcG9zaXRpb246IHsgeDogcG9zaXRpb24ueCAtIHNpemUud2lkdGggLyAyLCB5OiBwb3NpdGlvbi55IC0gc2l6ZS5oZWlnaHQgLyAyIH0sXG4gICAgICAgICAgICB3aWR0aDogc2l6ZS53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogc2l6ZS5oZWlnaHQsXG4gICAgICAgICAgICBtZXRhZGF0YTogaW1hZ2VNZXRhZGF0YShpbWFnZSksXG4gICAgICAgIH07XG5cbiAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+IFsuLi5wcmV2LCBuZXdOb2RlXSk7XG4gICAgICAgIHNldFNlbGVjdGVkTm9kZUlkcyhuZXcgU2V0KFtpZF0pKTtcbiAgICAgICAgc2V0U2VsZWN0ZWRDb25uZWN0aW9uSWQobnVsbCk7XG4gICAgICAgIHNldERpYWxvZ05vZGVJZChpZCk7XG4gICAgfSwgW10pO1xuXG4gICAgY29uc3QgY3JlYXRlVmlkZW9GaWxlTm9kZSA9IHVzZUNhbGxiYWNrKGFzeW5jIChmaWxlOiBGaWxlLCBwb3NpdGlvbjogUG9zaXRpb24pID0+IHtcbiAgICAgICAgY29uc3QgdmlkZW8gPSBhd2FpdCB1cGxvYWRNZWRpYUZpbGUoZmlsZSwgXCJ2aWRlb1wiKTtcbiAgICAgICAgY29uc3Qgc2l6ZSA9IGZpdE5vZGVTaXplKHZpZGVvLndpZHRoIHx8IDEyODAsIHZpZGVvLmhlaWdodCB8fCA3MjAsIFZJREVPX05PREVfTUFYX1dJRFRILCBWSURFT19OT0RFX01BWF9IRUlHSFQpO1xuICAgICAgICBjb25zdCBpZCA9IGB2aWRlby0ke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNyl9YDtcbiAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+IFtcbiAgICAgICAgICAgIC4uLnByZXYsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICAgICAgdHlwZTogQ2FudmFzTm9kZVR5cGUuVmlkZW8sXG4gICAgICAgICAgICAgICAgdGl0bGU6IGZpbGUubmFtZSxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyB4OiBwb3NpdGlvbi54IC0gc2l6ZS53aWR0aCAvIDIsIHk6IHBvc2l0aW9uLnkgLSBzaXplLmhlaWdodCAvIDIgfSxcbiAgICAgICAgICAgICAgICB3aWR0aDogc2l6ZS53aWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHNpemUuaGVpZ2h0LFxuICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB2aWRlb01ldGFkYXRhKHZpZGVvKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0pO1xuICAgICAgICBzZXRTZWxlY3RlZE5vZGVJZHMobmV3IFNldChbaWRdKSk7XG4gICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKG51bGwpO1xuICAgICAgICBzZXREaWFsb2dOb2RlSWQoaWQpO1xuICAgIH0sIFtdKTtcblxuICAgIGNvbnN0IGNyZWF0ZUF1ZGlvRmlsZU5vZGUgPSB1c2VDYWxsYmFjayhhc3luYyAoZmlsZTogRmlsZSwgcG9zaXRpb246IFBvc2l0aW9uKSA9PiB7XG4gICAgICAgIGNvbnN0IGF1ZGlvID0gYXdhaXQgdXBsb2FkTWVkaWFGaWxlKGZpbGUsIFwiYXVkaW9cIik7XG4gICAgICAgIGNvbnN0IHNwZWMgPSBOT0RFX0RFRkFVTFRfU0laRVtDYW52YXNOb2RlVHlwZS5BdWRpb107XG4gICAgICAgIGNvbnN0IGlkID0gYGF1ZGlvLSR7RGF0ZS5ub3coKX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA3KX1gO1xuICAgICAgICBzZXROb2RlcygocHJldikgPT4gW1xuICAgICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZCxcbiAgICAgICAgICAgICAgICB0eXBlOiBDYW52YXNOb2RlVHlwZS5BdWRpbyxcbiAgICAgICAgICAgICAgICB0aXRsZTogZmlsZS5uYW1lLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IHg6IHBvc2l0aW9uLnggLSBzcGVjLndpZHRoIC8gMiwgeTogcG9zaXRpb24ueSAtIHNwZWMuaGVpZ2h0IC8gMiB9LFxuICAgICAgICAgICAgICAgIHdpZHRoOiBzcGVjLndpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogc3BlYy5oZWlnaHQsXG4gICAgICAgICAgICAgICAgbWV0YWRhdGE6IGF1ZGlvTWV0YWRhdGEoYXVkaW8pLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSk7XG4gICAgICAgIHNldFNlbGVjdGVkTm9kZUlkcyhuZXcgU2V0KFtpZF0pKTtcbiAgICAgICAgc2V0U2VsZWN0ZWRDb25uZWN0aW9uSWQobnVsbCk7XG4gICAgfSwgW10pO1xuXG4gICAgY29uc3QgY3JlYXRlVGV4dE5vZGVGcm9tQ2xpcGJvYXJkID0gdXNlQ2FsbGJhY2soXG4gICAgICAgICh0ZXh0OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgICAgICAgICAgIGlmICghdHJpbW1lZCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICBjb25zdCBub2RlID0ge1xuICAgICAgICAgICAgICAgIC4uLmNyZWF0ZUNhbnZhc05vZGUoQ2FudmFzTm9kZVR5cGUuVGV4dCwgZ2V0Q2FudmFzQ2VudGVyKCksIHsgY29udGVudDogdHJpbW1lZCwgc3RhdHVzOiBOT0RFX1NUQVRVU19TVUNDRVNTIH0pLFxuICAgICAgICAgICAgICAgIHRpdGxlOiB0cmltbWVkLnNsaWNlKDAsIDMyKSB8fCB0KFwiY2FudmFzLnByb2plY3RQYWdlLmNsaXBib2FyZFRleHRcIiksXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXROb2RlcygocHJldikgPT4gWy4uLnByZXYsIG5vZGVdKTtcbiAgICAgICAgICAgIHNldFNlbGVjdGVkTm9kZUlkcyhuZXcgU2V0KFtub2RlLmlkXSkpO1xuICAgICAgICAgICAgc2V0U2VsZWN0ZWRDb25uZWN0aW9uSWQobnVsbCk7XG4gICAgICAgICAgICBzZXRDb250ZXh0TWVudShudWxsKTtcbiAgICAgICAgICAgIHNldERpYWxvZ05vZGVJZChub2RlLmlkKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBbZ2V0Q2FudmFzQ2VudGVyLCB0XSxcbiAgICApO1xuXG4gICAgY29uc3QgcGFzdGVTeXN0ZW1DbGlwYm9hcmQgPSB1c2VDYWxsYmFjayhhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICghbmF2aWdhdG9yLmNsaXBib2FyZCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC5yZWFkKCk7XG4gICAgICAgIGNvbnN0IGltYWdlSXRlbSA9IGl0ZW1zLmZpbmQoKGl0ZW0pID0+IGl0ZW0udHlwZXMuc29tZSgodHlwZSkgPT4gdHlwZS5zdGFydHNXaXRoKFwiaW1hZ2UvXCIpKSk7XG4gICAgICAgIGlmIChpbWFnZUl0ZW0pIHtcbiAgICAgICAgICAgIGNvbnN0IGltYWdlVHlwZSA9IGltYWdlSXRlbS50eXBlcy5maW5kKCh0eXBlKSA9PiB0eXBlLnN0YXJ0c1dpdGgoXCJpbWFnZS9cIikpO1xuICAgICAgICAgICAgaWYgKCFpbWFnZVR5cGUpIHJldHVybjtcbiAgICAgICAgICAgIGNvbnN0IGJsb2IgPSBhd2FpdCBpbWFnZUl0ZW0uZ2V0VHlwZShpbWFnZVR5cGUpO1xuICAgICAgICAgICAgY29uc3QgZmlsZSA9IG5ldyBGaWxlKFtibG9iXSwgXCJjbGlwYm9hcmQtaW1hZ2UucG5nXCIsIHsgdHlwZTogaW1hZ2VUeXBlIH0pO1xuICAgICAgICAgICAgdm9pZCBjcmVhdGVJbWFnZUZpbGVOb2RlKGZpbGUsIGdldENhbnZhc0NlbnRlcigpKTtcbiAgICAgICAgICAgIG1lc3NhZ2Uuc3VjY2Vzcyh0KFwiY2FudmFzLnByb2plY3RQYWdlLmNsaXBib2FyZEltYWdlQWRkZWRcIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQucmVhZFRleHQoKTtcbiAgICAgICAgaWYgKGNyZWF0ZVRleHROb2RlRnJvbUNsaXBib2FyZCh0ZXh0KSkgbWVzc2FnZS5zdWNjZXNzKHQoXCJjYW52YXMucHJvamVjdFBhZ2UuY2xpcGJvYXJkVGV4dEFkZGVkXCIpKTtcbiAgICB9LCBbY3JlYXRlSW1hZ2VGaWxlTm9kZSwgY3JlYXRlVGV4dE5vZGVGcm9tQ2xpcGJvYXJkLCBnZXRDYW52YXNDZW50ZXIsIG1lc3NhZ2UsIHRdKTtcblxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGhhbmRsZUtleURvd24gPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBpbnN0YW5jZW9mIEVsZW1lbnQgPyBldmVudC50YXJnZXQgOiBudWxsO1xuICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQgfHwgZXZlbnQudGFyZ2V0IGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCB8fCBldmVudC50YXJnZXQgaW5zdGFuY2VvZiBIVE1MU2VsZWN0RWxlbWVudCB8fCB0YXJnZXQ/LmNsb3Nlc3QoXCJbY29udGVudGVkaXRhYmxlPSd0cnVlJ10sW2RhdGEtY2FudmFzLW5vLXpvb21dLFtkYXRhLWNhbnZhcy1zaG9ydGN1dHMtaWdub3JlXVwiKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBjb25zdCBrZXkgPSBldmVudC5rZXkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGNvbnN0IGlzTW9kaWZpZXJTaG9ydGN1dCA9IGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuY3RybEtleTtcblxuICAgICAgICAgICAgaWYgKGlzTW9kaWZpZXJTaG9ydGN1dCAmJiBrZXkgPT09IFwiY1wiICYmIHdpbmRvdy5nZXRTZWxlY3Rpb24oKT8udG9TdHJpbmcoKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoaXNNb2RpZmllclNob3J0Y3V0ICYmICFldmVudC5hbHRLZXkgJiYga2V5ID09PSBcInpcIikge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnNoaWZ0S2V5KSByZWRvQ2FudmFzKCk7XG4gICAgICAgICAgICAgICAgZWxzZSB1bmRvQ2FudmFzKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaXNNb2RpZmllclNob3J0Y3V0ICYmICFldmVudC5hbHRLZXkgJiYga2V5ID09PSBcInlcIikge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgcmVkb0NhbnZhcygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGlzTW9kaWZpZXJTaG9ydGN1dCAmJiAhZXZlbnQuYWx0S2V5ICYmIGtleSA9PT0gXCJhXCIpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkTm9kZUlkcyhuZXcgU2V0KG5vZGVzUmVmLmN1cnJlbnQubWFwKChub2RlKSA9PiBub2RlLmlkKSkpO1xuICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKG51bGwpO1xuICAgICAgICAgICAgICAgIHNldENvbnRleHRNZW51KG51bGwpO1xuICAgICAgICAgICAgICAgIHNldFNlbGVjdGlvbkJveChudWxsKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpc01vZGlmaWVyU2hvcnRjdXQgJiYgIWV2ZW50LmFsdEtleSAmJiBrZXkgPT09IFwiY1wiKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICBjb3B5U2VsZWN0ZWROb2RlcygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGlzTW9kaWZpZXJTaG9ydGN1dCAmJiAhZXZlbnQuYWx0S2V5ICYmIGtleSA9PT0gXCJ2XCIpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIGlmICghcGFzdGVDb3BpZWROb2RlcygpKSB2b2lkIHBhc3RlU3lzdGVtQ2xpcGJvYXJkKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkRlbGV0ZVwiIHx8IGV2ZW50LmtleSA9PT0gXCJCYWNrc3BhY2VcIikge1xuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZE5vZGVJZHNSZWYuY3VycmVudC5zaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZU5vZGVzKG5ldyBTZXQoc2VsZWN0ZWROb2RlSWRzUmVmLmN1cnJlbnQpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNlbGVjdGVkQ29ubmVjdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZUNvbm5lY3Rpb24oc2VsZWN0ZWRDb25uZWN0aW9uSWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFc2NhcGVcIikge1xuICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkTm9kZUlkcyhuZXcgU2V0KCkpO1xuICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKG51bGwpO1xuICAgICAgICAgICAgICAgIHNldENvbnRleHRNZW51KG51bGwpO1xuICAgICAgICAgICAgICAgIHNldE5vZGVDcmVhdGVQb3NpdGlvbihudWxsKTtcbiAgICAgICAgICAgICAgICBzZXRTZWxlY3Rpb25Cb3gobnVsbCk7XG4gICAgICAgICAgICAgICAgc2V0Q29ubmVjdGluZyhudWxsKTtcbiAgICAgICAgICAgICAgICBzZXRIb3ZlcmVkTm9kZUlkKG51bGwpO1xuICAgICAgICAgICAgICAgIHNldFRvb2xiYXJOb2RlSWQobnVsbCk7XG4gICAgICAgICAgICAgICAgc2V0RGlhbG9nTm9kZUlkKG51bGwpO1xuICAgICAgICAgICAgICAgIHNldEluZm9Ob2RlSWQobnVsbCk7XG4gICAgICAgICAgICAgICAgc2V0Q3JvcE5vZGVJZChudWxsKTtcbiAgICAgICAgICAgICAgICBzZXRNYXNrRWRpdE5vZGVJZChudWxsKTtcbiAgICAgICAgICAgICAgICBzZXRQZW5kaW5nQ29ubmVjdGlvbkNyZWF0ZShudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgaGFuZGxlS2V5RG93bik7XG4gICAgICAgIHJldHVybiAoKSA9PiB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgaGFuZGxlS2V5RG93bik7XG4gICAgfSwgW2NvcHlTZWxlY3RlZE5vZGVzLCBkZWxldGVDb25uZWN0aW9uLCBkZWxldGVOb2RlcywgcGFzdGVDb3BpZWROb2RlcywgcGFzdGVTeXN0ZW1DbGlwYm9hcmQsIHJlZG9DYW52YXMsIHNlbGVjdGVkQ29ubmVjdGlvbklkLCBzZXRDb25uZWN0aW5nLCB1bmRvQ2FudmFzXSk7XG5cbiAgICBjb25zdCBoYW5kbGVDb25uZWN0U3RhcnQgPSB1c2VDYWxsYmFjayhcbiAgICAgICAgKGV2ZW50OiBSZWFjdE1vdXNlRXZlbnQsIG5vZGVJZDogc3RyaW5nLCBoYW5kbGVUeXBlOiBcInNvdXJjZVwiIHwgXCJ0YXJnZXRcIikgPT4ge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBzZXRNb3VzZVdvcmxkKHNjcmVlblRvQ2FudmFzKGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpKTtcbiAgICAgICAgICAgIHNldENvbm5lY3RpbmcoeyBub2RlSWQsIGhhbmRsZVR5cGUgfSk7XG4gICAgICAgICAgICBjb25uZWN0aW9uVGFyZ2V0Tm9kZUlkUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgICAgICAgc2V0Q29ubmVjdGlvblRhcmdldE5vZGVJZChudWxsKTtcbiAgICAgICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKG51bGwpO1xuICAgICAgICB9LFxuICAgICAgICBbc2NyZWVuVG9DYW52YXMsIHNldENvbm5lY3RpbmddLFxuICAgICk7XG5cbiAgICBjb25zdCBoYW5kbGVOb2RlUmVzaXplID0gdXNlQ2FsbGJhY2soKG5vZGVJZDogc3RyaW5nLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgcG9zaXRpb24/OiBQb3NpdGlvbikgPT4ge1xuICAgICAgICBzZXROb2RlcygocHJldikgPT4gcHJldi5tYXAoKG5vZGUpID0+IChub2RlLmlkID09PSBub2RlSWQgPyB7IC4uLm5vZGUsIHdpZHRoLCBoZWlnaHQsIHBvc2l0aW9uOiBwb3NpdGlvbiB8fCBub2RlLnBvc2l0aW9uIH0gOiBub2RlKSkpO1xuICAgIH0sIFtdKTtcblxuICAgIGNvbnN0IGhhbmRsZU5vZGVSZXNpemVTdGFydCA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgc2V0SXNOb2RlUmVzaXppbmcodHJ1ZSk7XG4gICAgfSwgW10pO1xuICAgIGNvbnN0IGhhbmRsZU5vZGVSZXNpemVFbmQgPSB1c2VDYWxsYmFjaygoKSA9PiBzZXRJc05vZGVSZXNpemluZyhmYWxzZSksIFtdKTtcblxuICAgIGNvbnN0IHRvZ2dsZU5vZGVGcmVlUmVzaXplID0gdXNlQ2FsbGJhY2soKG5vZGVJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgIHNldE5vZGVzKChwcmV2KSA9PlxuICAgICAgICAgICAgcHJldi5tYXAoKG5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5pZCAhPT0gbm9kZUlkKSByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgICAgICBjb25zdCBmcmVlUmVzaXplID0gIW5vZGUubWV0YWRhdGE/LmZyZWVSZXNpemU7XG4gICAgICAgICAgICAgICAgaWYgKGZyZWVSZXNpemUgfHwgbm9kZS50eXBlICE9PSBDYW52YXNOb2RlVHlwZS5JbWFnZSkgcmV0dXJuIHsgLi4ubm9kZSwgbWV0YWRhdGE6IHsgLi4ubm9kZS5tZXRhZGF0YSwgZnJlZVJlc2l6ZSB9IH07XG4gICAgICAgICAgICAgICAgY29uc3QgcmF0aW8gPSAobm9kZS5tZXRhZGF0YT8ubmF0dXJhbFdpZHRoIHx8IG5vZGUud2lkdGgpIC8gKG5vZGUubWV0YWRhdGE/Lm5hdHVyYWxIZWlnaHQgfHwgbm9kZS5oZWlnaHQgfHwgMSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gbm9kZS53aWR0aCAvIHJhdGlvO1xuICAgICAgICAgICAgICAgIHJldHVybiB7IC4uLm5vZGUsIGhlaWdodCwgcG9zaXRpb246IHsgeDogbm9kZS5wb3NpdGlvbi54LCB5OiBub2RlLnBvc2l0aW9uLnkgKyBub2RlLmhlaWdodCAvIDIgLSBoZWlnaHQgLyAyIH0sIG1ldGFkYXRhOiB7IC4uLm5vZGUubWV0YWRhdGEsIGZyZWVSZXNpemUgfSB9O1xuICAgICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgfSwgW10pO1xuXG4gICAgY29uc3QgaGFuZGxlTm9kZUNvbnRlbnRDaGFuZ2UgPSB1c2VDYWxsYmFjaygobm9kZUlkOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZykgPT4ge1xuICAgICAgICBzZXROb2RlcygocHJldikgPT5cbiAgICAgICAgICAgIHByZXYubWFwKChub2RlKSA9PlxuICAgICAgICAgICAgICAgIG5vZGUuaWQgPT09IG5vZGVJZFxuICAgICAgICAgICAgICAgICAgICA/IHsgLi4ubm9kZSwgbWV0YWRhdGE6IHsgLi4ubm9kZS5tZXRhZGF0YSwgY29udGVudCwgdGV4dHM6IG5vZGUubWV0YWRhdGE/LnRleHRzPy5tYXAoKHRleHQpID0+ICh0ZXh0LmlkID09PSBub2RlLm1ldGFkYXRhPy5wcmltYXJ5VGV4dElkID8geyAuLi50ZXh0LCBjb250ZW50IH0gOiB0ZXh0KSkgfSB9XG4gICAgICAgICAgICAgICAgICAgIDogbm9kZSxcbiAgICAgICAgICAgICksXG4gICAgICAgICk7XG4gICAgfSwgW10pO1xuXG4gICAgY29uc3QgaGFuZGxlTm9kZVRpdGxlQ2hhbmdlID0gdXNlQ2FsbGJhY2soKG5vZGVJZDogc3RyaW5nLCB0aXRsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHNldE5vZGVzKChwcmV2KSA9PiBwcmV2Lm1hcCgobm9kZSkgPT4gKG5vZGUuaWQgPT09IG5vZGVJZCA/IHsgLi4ubm9kZSwgdGl0bGUgfSA6IG5vZGUpKSk7XG4gICAgfSwgW10pO1xuXG4gICAgY29uc3QgdG9nZ2xlQmF0Y2hFeHBhbmRlZCA9IHVzZUNhbGxiYWNrKChub2RlSWQ6IHN0cmluZykgPT4ge1xuICAgICAgICBzZXRFeHBhbmRlZEJhdGNoTm9kZUlkcygoY3VycmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV4dCA9IG5ldyBTZXQoY3VycmVudCk7XG4gICAgICAgICAgICBpZiAobmV4dC5oYXMobm9kZUlkKSkgbmV4dC5kZWxldGUobm9kZUlkKTtcbiAgICAgICAgICAgIGVsc2UgbmV4dC5hZGQobm9kZUlkKTtcbiAgICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICB9KTtcbiAgICB9LCBbXSk7XG5cbiAgICBjb25zdCBzZXRCYXRjaFByaW1hcnkgPSB1c2VDYWxsYmFjaygobm9kZUlkOiBzdHJpbmcsIGl0ZW1JZDogc3RyaW5nKSA9PiB7XG4gICAgICAgIHNldE5vZGVzKChwcmV2KSA9PlxuICAgICAgICAgICAgcHJldi5tYXAoKG5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5pZCAhPT0gbm9kZUlkKSByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS50eXBlID09PSBDYW52YXNOb2RlVHlwZS5UZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBub2RlLm1ldGFkYXRhPy50ZXh0cz8uZmluZCgoaXRlbSkgPT4gaXRlbS5pZCA9PT0gaXRlbUlkKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRleHQ/LmNvbnRlbnQgPyB7IC4uLm5vZGUsIG1ldGFkYXRhOiB7IC4uLm5vZGUubWV0YWRhdGEsIGNvbnRlbnQ6IHRleHQuY29udGVudCwgcHJpbWFyeVRleHRJZDogdGV4dC5pZCB9IH0gOiBub2RlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBpbWFnZSA9IG5vZGUubWV0YWRhdGE/LmltYWdlcz8uZmluZCgoaXRlbSkgPT4gaXRlbS5pZCA9PT0gaXRlbUlkKTtcbiAgICAgICAgICAgICAgICBpZiAoIWltYWdlPy5jb250ZW50KSByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgICAgICBjb25zdCBlZGdlID0gTWF0aC5tYXgobm9kZS53aWR0aCwgbm9kZS5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNpemUgPSBub2RlLm1ldGFkYXRhPy5mcmVlUmVzaXplID8geyB3aWR0aDogbm9kZS53aWR0aCwgaGVpZ2h0OiBub2RlLmhlaWdodCB9IDogZml0Tm9kZVNpemUoaW1hZ2UubmF0dXJhbFdpZHRoLCBpbWFnZS5uYXR1cmFsSGVpZ2h0LCBlZGdlLCBlZGdlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAuLi5ub2RlLFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyB4OiBub2RlLnBvc2l0aW9uLnggKyBub2RlLndpZHRoIC8gMiAtIHNpemUud2lkdGggLyAyLCB5OiBub2RlLnBvc2l0aW9uLnkgKyBub2RlLmhlaWdodCAvIDIgLSBzaXplLmhlaWdodCAvIDIgfSxcbiAgICAgICAgICAgICAgICAgICAgLi4uc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLm5vZGUubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBpbWFnZS5jb250ZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcmFnZUtleTogaW1hZ2Uuc3RvcmFnZUtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hdHVyYWxXaWR0aDogaW1hZ2UubmF0dXJhbFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmF0dXJhbEhlaWdodDogaW1hZ2UubmF0dXJhbEhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ5dGVzOiBpbWFnZS5ieXRlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbWVUeXBlOiBpbWFnZS5taW1lVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW1hcnlJbWFnZUlkOiBpbWFnZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgfSwgW10pO1xuXG4gICAgY29uc3QgZHVwbGljYXRlQmF0Y2hJbWFnZSA9IHVzZUNhbGxiYWNrKChub2RlOiBDYW52YXNOb2RlRGF0YSwgaW1hZ2VJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGltYWdlID0gbm9kZS5tZXRhZGF0YT8uaW1hZ2VzPy5maW5kKChpdGVtKSA9PiBpdGVtLmlkID09PSBpbWFnZUlkKTtcbiAgICAgICAgaWYgKCFpbWFnZT8uY29udGVudCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBpZCA9IG5hbm9pZCgpO1xuICAgICAgICBjb25zdCBlZGdlID0gTWF0aC5tYXgobm9kZS53aWR0aCwgbm9kZS5oZWlnaHQpO1xuICAgICAgICBjb25zdCBzaXplID0gZml0Tm9kZVNpemUoaW1hZ2UubmF0dXJhbFdpZHRoLCBpbWFnZS5uYXR1cmFsSGVpZ2h0LCBlZGdlLCBlZGdlKTtcbiAgICAgICAgY29uc3QgY29weTogQ2FudmFzTm9kZURhdGEgPSB7XG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIHR5cGU6IENhbnZhc05vZGVUeXBlLkltYWdlLFxuICAgICAgICAgICAgdGl0bGU6IG5vZGUudGl0bGUsXG4gICAgICAgICAgICBwb3NpdGlvbjogeyB4OiBub2RlLnBvc2l0aW9uLnggKyBub2RlLndpZHRoICogMiArIDk2LCB5OiBub2RlLnBvc2l0aW9uLnkgKyBub2RlLmhlaWdodCAvIDIgLSBzaXplLmhlaWdodCAvIDIgfSxcbiAgICAgICAgICAgIC4uLnNpemUsXG4gICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGltYWdlLmNvbnRlbnQsXG4gICAgICAgICAgICAgICAgc3RvcmFnZUtleTogaW1hZ2Uuc3RvcmFnZUtleSxcbiAgICAgICAgICAgICAgICBuYXR1cmFsV2lkdGg6IGltYWdlLm5hdHVyYWxXaWR0aCxcbiAgICAgICAgICAgICAgICBuYXR1cmFsSGVpZ2h0OiBpbWFnZS5uYXR1cmFsSGVpZ2h0LFxuICAgICAgICAgICAgICAgIGJ5dGVzOiBpbWFnZS5ieXRlcyxcbiAgICAgICAgICAgICAgICBtaW1lVHlwZTogaW1hZ2UubWltZVR5cGUsXG4gICAgICAgICAgICAgICAgc3RhdHVzOiBOT0RFX1NUQVRVU19TVUNDRVNTLFxuICAgICAgICAgICAgICAgIHByb21wdDogbm9kZS5tZXRhZGF0YT8ucHJvbXB0LFxuICAgICAgICAgICAgICAgIGdlbmVyYXRpb25UeXBlOiBub2RlLm1ldGFkYXRhPy5nZW5lcmF0aW9uVHlwZSxcbiAgICAgICAgICAgICAgICBtb2RlbDogbm9kZS5tZXRhZGF0YT8ubW9kZWwsXG4gICAgICAgICAgICAgICAgc2l6ZTogbm9kZS5tZXRhZGF0YT8uc2l6ZSxcbiAgICAgICAgICAgICAgICBxdWFsaXR5OiBub2RlLm1ldGFkYXRhPy5xdWFsaXR5LFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IG5vZGUubWV0YWRhdGE/LmJhY2tncm91bmQsXG4gICAgICAgICAgICAgICAgcmVmZXJlbmNlczogbm9kZS5tZXRhZGF0YT8ucmVmZXJlbmNlcyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIHNldE5vZGVzKChwcmV2KSA9PiBbLi4ucHJldiwgY29weV0pO1xuICAgICAgICBzZXRTZWxlY3RlZE5vZGVJZHMobmV3IFNldChbaWRdKSk7XG4gICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKG51bGwpO1xuICAgICAgICBzZXREaWFsb2dOb2RlSWQoaWQpO1xuICAgIH0sIFtdKTtcblxuICAgIGNvbnN0IGhhbmRsZU5vZGVQcm9tcHRDaGFuZ2UgPSB1c2VDYWxsYmFjaygobm9kZUlkOiBzdHJpbmcsIHByb21wdDogc3RyaW5nKSA9PiB7XG4gICAgICAgIHNldE5vZGVzKChwcmV2KSA9PiBwcmV2Lm1hcCgobm9kZSkgPT4gKG5vZGUuaWQgPT09IG5vZGVJZCA/IHsgLi4ubm9kZSwgbWV0YWRhdGE6IHsgLi4ubm9kZS5tZXRhZGF0YSwgcHJvbXB0IH0gfSA6IG5vZGUpKSk7XG4gICAgfSwgW10pO1xuXG4gICAgY29uc3QgaGFuZGxlQ29uZmlnTm9kZUNoYW5nZSA9IHVzZUNhbGxiYWNrKChub2RlSWQ6IHN0cmluZywgcGF0Y2g6IFBhcnRpYWw8Q2FudmFzTm9kZURhdGFbXCJtZXRhZGF0YVwiXT4pID0+IHtcbiAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+IHByZXYubWFwKChub2RlKSA9PiAobm9kZS5pZCA9PT0gbm9kZUlkID8gYXBwbHlOb2RlQ29uZmlnUGF0Y2gobm9kZSwgcGF0Y2gpIDogbm9kZSkpKTtcbiAgICB9LCBbXSk7XG5cbiAgICBjb25zdCBkb3dubG9hZE5vZGVJbWFnZSA9IHVzZUNhbGxiYWNrKChub2RlOiBDYW52YXNOb2RlRGF0YSkgPT4ge1xuICAgICAgICBpZiAoKG5vZGUudHlwZSAhPT0gQ2FudmFzTm9kZVR5cGUuSW1hZ2UgJiYgbm9kZS50eXBlICE9PSBDYW52YXNOb2RlVHlwZS5WaWRlbyAmJiBub2RlLnR5cGUgIT09IENhbnZhc05vZGVUeXBlLkF1ZGlvKSB8fCAhbm9kZS5tZXRhZGF0YT8uY29udGVudCkgcmV0dXJuO1xuICAgICAgICBzYXZlQXMobm9kZS5tZXRhZGF0YS5jb250ZW50LCBgY2FudmFzLSR7bm9kZS50eXBlfS0ke25vZGUuaWR9LiR7bm9kZS50eXBlID09PSBDYW52YXNOb2RlVHlwZS5WaWRlbyA/IFwibXA0XCIgOiBub2RlLnR5cGUgPT09IENhbnZhc05vZGVUeXBlLkF1ZGlvID8gYXVkaW9FeHRlbnNpb24obm9kZS5tZXRhZGF0YS5taW1lVHlwZSkgOiBpbWFnZUV4dGVuc2lvbihub2RlLm1ldGFkYXRhLmNvbnRlbnQpfWApO1xuICAgIH0sIFtdKTtcblxuICAgIGNvbnN0IGRvd25sb2FkQmF0Y2hJbWFnZSA9IHVzZUNhbGxiYWNrKChub2RlOiBDYW52YXNOb2RlRGF0YSwgaW1hZ2VJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGltYWdlID0gbm9kZS5tZXRhZGF0YT8uaW1hZ2VzPy5maW5kKChpdGVtKSA9PiBpdGVtLmlkID09PSBpbWFnZUlkKTtcbiAgICAgICAgaWYgKCFpbWFnZT8uY29udGVudCkgcmV0dXJuO1xuICAgICAgICBzYXZlQXMoaW1hZ2UuY29udGVudCwgYGNhbnZhcy1pbWFnZS0ke25vZGUuaWR9LSR7aW1hZ2UuaWR9LiR7aW1hZ2VFeHRlbnNpb24oaW1hZ2UuY29udGVudCl9YCk7XG4gICAgfSwgW10pO1xuXG4gICAgY29uc3QgY2FwdHVyZVZpZGVvTm9kZUZyYW1lID0gdXNlQ2FsbGJhY2soXG4gICAgICAgIGFzeW5jIChub2RlSWQ6IHN0cmluZywgcG9zaXRpb246IFZpZGVvRnJhbWVQb3NpdGlvbikgPT4ge1xuICAgICAgICAgICAgc2V0Q29udGV4dE1lbnUobnVsbCk7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXNSZWYuY3VycmVudC5maW5kKChpdGVtKSA9PiBpdGVtLmlkID09PSBub2RlSWQpO1xuICAgICAgICAgICAgY29uc3QgdmlkZW8gPSBBcnJheS5mcm9tKGNvbnRhaW5lclJlZi5jdXJyZW50IS5xdWVyeVNlbGVjdG9yQWxsPEhUTUxWaWRlb0VsZW1lbnQ+KFwidmlkZW9bZGF0YS1jYW52YXMtdmlkZW9dXCIpKS5maW5kKChpdGVtKSA9PiBpdGVtLmRhdGFzZXQuY2FudmFzVmlkZW8gPT09IG5vZGVJZCk7XG4gICAgICAgICAgICBpZiAobm9kZT8udHlwZSAhPT0gQ2FudmFzTm9kZVR5cGUuVmlkZW8gfHwgIW5vZGUubWV0YWRhdGE/LmNvbnRlbnQgfHwgIXZpZGVvKSByZXR1cm4gbWVzc2FnZS5lcnJvcih0KFwiY2FudmFzLnZpZGVvRnJhbWVzLmZhaWxlZFwiKSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlID0gYXdhaXQgdXBsb2FkSW1hZ2UoYXdhaXQgY2FwdHVyZVZpZGVvRnJhbWUobm9kZS5tZXRhZGF0YS5jb250ZW50LCBwb3NpdGlvbiwgdmlkZW8uY3VycmVudFRpbWUpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzaXplID0gZml0Tm9kZVNpemUoaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCwgVklERU9fTk9ERV9NQVhfV0lEVEgsIFZJREVPX05PREVfTUFYX0hFSUdIVCk7XG4gICAgICAgICAgICAgICAgY29uc3QgaWQgPSBuYW5vaWQoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gbm9kZS5wb3NpdGlvbi54ICsgbm9kZS53aWR0aCArIDk2O1xuICAgICAgICAgICAgICAgIGxldCB5ID0gbm9kZS5wb3NpdGlvbi55ICsgbm9kZS5oZWlnaHQgLyAyIC0gc2l6ZS5oZWlnaHQgLyAyO1xuICAgICAgICAgICAgICAgIHdoaWxlIChub2Rlc1JlZi5jdXJyZW50LnNvbWUoKGl0ZW0pID0+IGl0ZW0uaWQgIT09IG5vZGUuaWQgJiYgaXRlbS5wb3NpdGlvbi54IDwgeCArIHNpemUud2lkdGggJiYgaXRlbS5wb3NpdGlvbi54ICsgaXRlbS53aWR0aCA+IHggJiYgaXRlbS5wb3NpdGlvbi55IDwgeSArIHNpemUuaGVpZ2h0ICYmIGl0ZW0ucG9zaXRpb24ueSArIGl0ZW0uaGVpZ2h0ID4geSkpIHkgKz0gc2l6ZS5oZWlnaHQgKyAyNDtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZDogQ2FudmFzTm9kZURhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBDYW52YXNOb2RlVHlwZS5JbWFnZSxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHQoYGNhbnZhcy52aWRlb0ZyYW1lcy4ke3Bvc2l0aW9ufVRpdGxlYCwgeyBuYW1lOiBub2RlLnRpdGxlIHx8IHQoXCJhc3NldHMua2luZHMudmlkZW9cIikgfSksXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IHgsIHkgfSxcbiAgICAgICAgICAgICAgICAgICAgLi4uc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGE6IGltYWdlTWV0YWRhdGEoaW1hZ2UpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+IFsuLi5wcmV2LCBjaGlsZF0pO1xuICAgICAgICAgICAgICAgIHNldENvbm5lY3Rpb25zKChwcmV2KSA9PiBbLi4ucHJldiwgeyBpZDogbmFub2lkKCksIGZyb21Ob2RlSWQ6IG5vZGUuaWQsIHRvTm9kZUlkOiBpZCB9XSk7XG4gICAgICAgICAgICAgICAgc2V0U2VsZWN0ZWROb2RlSWRzKG5ldyBTZXQoW2lkXSkpO1xuICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKG51bGwpO1xuICAgICAgICAgICAgICAgIHNldERpYWxvZ05vZGVJZChpZCk7XG4gICAgICAgICAgICAgICAgbWVzc2FnZS5zdWNjZXNzKHQoXCJjYW52YXMudmlkZW9GcmFtZXMuY2FwdHVyZWRcIikpO1xuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZS5lcnJvcih0KFwiY2FudmFzLnZpZGVvRnJhbWVzLmZhaWxlZFwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFttZXNzYWdlLCB0XSxcbiAgICApO1xuXG4gICAgY29uc3Qgc2F2ZU5vZGVBc3NldCA9IHVzZUNhbGxiYWNrKFxuICAgICAgICBhc3luYyAobm9kZTogQ2FudmFzTm9kZURhdGEpID0+IHtcbiAgICAgICAgICAgIGlmIChub2RlLnR5cGUgPT09IENhbnZhc05vZGVUeXBlLlRleHQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gbm9kZS5tZXRhZGF0YT8uY29udGVudD8udHJpbSgpO1xuICAgICAgICAgICAgICAgIGlmICghY29udGVudCkgcmV0dXJuIG1lc3NhZ2UuZXJyb3IodChcImNhbnZhcy5wcm9qZWN0UGFnZS5ub1RleHRUb1NhdmVcIikpO1xuICAgICAgICAgICAgICAgIGFkZEFzc2V0KHsga2luZDogXCJ0ZXh0XCIsIHRpdGxlOiBub2RlLm1ldGFkYXRhPy5wcm9tcHQ/LnNsaWNlKDAsIDI0KSB8fCB0KFwiY2FudmFzLnByb2plY3RQYWdlLmNhbnZhc1RleHRcIiksIGNvdmVyVXJsOiBcIlwiLCB0YWdzOiBbXSwgc291cmNlOiBcIkNhbnZhc1wiLCBkYXRhOiB7IGNvbnRlbnQgfSwgbWV0YWRhdGE6IHsgc291cmNlOiBcImNhbnZhc1wiLCBub2RlSWQ6IG5vZGUuaWQgfSB9KTtcbiAgICAgICAgICAgICAgICBtZXNzYWdlLnN1Y2Nlc3ModChcImNvbW1vbi5hZGRlZFRvQXNzZXRzXCIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZS50eXBlID09PSBDYW52YXNOb2RlVHlwZS5WaWRlbykge1xuICAgICAgICAgICAgICAgIGlmICghbm9kZS5tZXRhZGF0YT8uY29udGVudCkgcmV0dXJuIG1lc3NhZ2UuZXJyb3IodChcImNhbnZhcy5wcm9qZWN0UGFnZS5ub1ZpZGVvVG9TYXZlXCIpKTtcbiAgICAgICAgICAgICAgICBhZGRBc3NldCh7XG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6IFwidmlkZW9cIixcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IG5vZGUubWV0YWRhdGE/LnByb21wdD8uc2xpY2UoMCwgMjQpIHx8IHQoXCJjYW52YXMucHJvamVjdFBhZ2UuY2FudmFzVmlkZW9cIiksXG4gICAgICAgICAgICAgICAgICAgIGNvdmVyVXJsOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICB0YWdzOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgc291cmNlOiBcIkNhbnZhc1wiLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IHVybDogbm9kZS5tZXRhZGF0YS5jb250ZW50LCBzdG9yYWdlS2V5OiBub2RlLm1ldGFkYXRhLnN0b3JhZ2VLZXksIHdpZHRoOiBub2RlLndpZHRoLCBoZWlnaHQ6IG5vZGUuaGVpZ2h0LCBieXRlczogbm9kZS5tZXRhZGF0YS5ieXRlcyB8fCAwLCBtaW1lVHlwZTogbm9kZS5tZXRhZGF0YS5taW1lVHlwZSB8fCBcInZpZGVvL21wNFwiIH0sXG4gICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7IHNvdXJjZTogXCJjYW52YXNcIiwgbm9kZUlkOiBub2RlLmlkLCBwcm9tcHQ6IG5vZGUubWV0YWRhdGE/LnByb21wdCB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIG1lc3NhZ2Uuc3VjY2Vzcyh0KFwiY29tbW9uLmFkZGVkVG9Bc3NldHNcIikpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghbm9kZS5tZXRhZGF0YT8uY29udGVudCkgcmV0dXJuIG1lc3NhZ2UuZXJyb3IodChcImNhbnZhcy5wcm9qZWN0UGFnZS5ub0ltYWdlVG9TYXZlXCIpKTtcbiAgICAgICAgICAgIGNvbnN0IGRhdGFVcmwgPSBub2RlLm1ldGFkYXRhLnN0b3JhZ2VLZXkgPyBcIlwiIDogbm9kZS5tZXRhZGF0YS5jb250ZW50O1xuICAgICAgICAgICAgYWRkQXNzZXQoe1xuICAgICAgICAgICAgICAgIGtpbmQ6IFwiaW1hZ2VcIixcbiAgICAgICAgICAgICAgICB0aXRsZTogbm9kZS5tZXRhZGF0YT8ucHJvbXB0Py5zbGljZSgwLCAyNCkgfHwgdChcImNhbnZhcy5wcm9qZWN0UGFnZS5jYW52YXNJbWFnZVwiKSxcbiAgICAgICAgICAgICAgICBjb3ZlclVybDogbm9kZS5tZXRhZGF0YS5jb250ZW50LFxuICAgICAgICAgICAgICAgIHRhZ3M6IFtdLFxuICAgICAgICAgICAgICAgIHNvdXJjZTogXCJDYW52YXNcIixcbiAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFVcmwsXG4gICAgICAgICAgICAgICAgICAgIHN0b3JhZ2VLZXk6IG5vZGUubWV0YWRhdGEuc3RvcmFnZUtleSxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IG5vZGUubWV0YWRhdGEubmF0dXJhbFdpZHRoIHx8IG5vZGUud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogbm9kZS5tZXRhZGF0YS5uYXR1cmFsSGVpZ2h0IHx8IG5vZGUuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBieXRlczogbm9kZS5tZXRhZGF0YS5ieXRlcyB8fCBnZXREYXRhVXJsQnl0ZVNpemUoZGF0YVVybCksXG4gICAgICAgICAgICAgICAgICAgIG1pbWVUeXBlOiBub2RlLm1ldGFkYXRhLm1pbWVUeXBlIHx8IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBtZXRhZGF0YTogeyBzb3VyY2U6IFwiY2FudmFzXCIsIG5vZGVJZDogbm9kZS5pZCwgcHJvbXB0OiBub2RlLm1ldGFkYXRhPy5wcm9tcHQgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbWVzc2FnZS5zdWNjZXNzKHQoXCJjb21tb24uYWRkZWRUb0Fzc2V0c1wiKSk7XG4gICAgICAgIH0sXG4gICAgICAgIFthZGRBc3NldCwgbWVzc2FnZSwgdF0sXG4gICAgKTtcblxuICAgIGNvbnN0IGNyZWF0ZUltYWdlUmV2ZXJzZVByb21wdE5vZGVzID0gdXNlQ2FsbGJhY2soXG4gICAgICAgIChub2RlOiBDYW52YXNOb2RlRGF0YSkgPT4ge1xuICAgICAgICAgICAgaWYgKG5vZGUudHlwZSAhPT0gQ2FudmFzTm9kZVR5cGUuSW1hZ2UgfHwgIW5vZGUubWV0YWRhdGE/LmNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlLndhcm5pbmcodChcImNhbnZhcy5wcm9qZWN0UGFnZS5lbXB0eVJldmVyc2VcIikpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZ2FwID0gOTY7XG4gICAgICAgICAgICBjb25zdCB0ZXh0U3BlYyA9IE5PREVfREVGQVVMVF9TSVpFW0NhbnZhc05vZGVUeXBlLlRleHRdO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnU3BlYyA9IE5PREVfREVGQVVMVF9TSVpFW0NhbnZhc05vZGVUeXBlLkNvbmZpZ107XG4gICAgICAgICAgICBjb25zdCBjZW50ZXJZID0gbm9kZS5wb3NpdGlvbi55ICsgbm9kZS5oZWlnaHQgLyAyO1xuICAgICAgICAgICAgY29uc3QgdGV4dE5vZGUgPSB7XG4gICAgICAgICAgICAgICAgLi4uY3JlYXRlQ2FudmFzTm9kZShDYW52YXNOb2RlVHlwZS5UZXh0LCB7IHg6IG5vZGUucG9zaXRpb24ueCArIG5vZGUud2lkdGggKyBnYXAgKyB0ZXh0U3BlYy53aWR0aCAvIDIsIHk6IGNlbnRlclkgfSwgeyBjb250ZW50OiB0KFwiY2FudmFzLnByb2plY3RQYWdlLnJldmVyc2VQcmVzZXRcIiksIHByb21wdDogdChcImNhbnZhcy5wcm9qZWN0UGFnZS5yZXZlcnNlUHJlc2V0XCIpLCBzdGF0dXM6IE5PREVfU1RBVFVTX1NVQ0NFU1MsIGZvbnRTaXplOiAxNCB9KSxcbiAgICAgICAgICAgICAgICB0aXRsZTogdChcImNhbnZhcy5wcm9qZWN0UGFnZS5yZXZlcnNlVGl0bGVcIiksXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgY29uZmlnTm9kZSA9IHtcbiAgICAgICAgICAgICAgICAuLi5jcmVhdGVDYW52YXNOb2RlKFxuICAgICAgICAgICAgICAgICAgICBDYW52YXNOb2RlVHlwZS5Db25maWcsXG4gICAgICAgICAgICAgICAgICAgIHsgeDogdGV4dE5vZGUucG9zaXRpb24ueCArIHRleHROb2RlLndpZHRoICsgZ2FwICsgY29uZmlnU3BlYy53aWR0aCAvIDIsIHk6IGNlbnRlclkgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGlvbk1vZGU6IFwidGV4dFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWw6IGVmZmVjdGl2ZUNvbmZpZy50ZXh0TW9kZWwgfHwgZWZmZWN0aXZlQ29uZmlnLm1vZGVsIHx8IGRlZmF1bHRDb25maWcudGV4dE1vZGVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb3NlckNvbnRlbnQ6IHQoXCJjYW52YXMucmV2ZXJzZUNvbXBvc2VyXCIsIHsgaW1hZ2VJZDogbm9kZS5pZCwgdGV4dElkOiB0ZXh0Tm9kZS5pZCB9KSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIHRpdGxlOiB0KFwiY2FudmFzLnByb2plY3RQYWdlLnJldmVyc2VDb25maWdUaXRsZVwiKSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNldE5vZGVzKChwcmV2KSA9PiBbLi4ucHJldiwgdGV4dE5vZGUsIGNvbmZpZ05vZGVdKTtcbiAgICAgICAgICAgIHNldENvbm5lY3Rpb25zKChwcmV2KSA9PiBbLi4ucHJldiwgeyBpZDogbmFub2lkKCksIGZyb21Ob2RlSWQ6IG5vZGUuaWQsIHRvTm9kZUlkOiBjb25maWdOb2RlLmlkIH0sIHsgaWQ6IG5hbm9pZCgpLCBmcm9tTm9kZUlkOiB0ZXh0Tm9kZS5pZCwgdG9Ob2RlSWQ6IGNvbmZpZ05vZGUuaWQgfV0pO1xuICAgICAgICAgICAgc2V0U2VsZWN0ZWROb2RlSWRzKG5ldyBTZXQoW2NvbmZpZ05vZGUuaWRdKSk7XG4gICAgICAgICAgICBzZXRTZWxlY3RlZENvbm5lY3Rpb25JZChudWxsKTtcbiAgICAgICAgICAgIHNldERpYWxvZ05vZGVJZChjb25maWdOb2RlLmlkKTtcbiAgICAgICAgICAgIHNldENvbnRleHRNZW51KG51bGwpO1xuICAgICAgICB9LFxuICAgICAgICBbZWZmZWN0aXZlQ29uZmlnLm1vZGVsLCBlZmZlY3RpdmVDb25maWcudGV4dE1vZGVsLCBtZXNzYWdlLCB0XSxcbiAgICApO1xuXG4gICAgY29uc3QgY3JvcEltYWdlTm9kZSA9IHVzZUNhbGxiYWNrKGFzeW5jIChub2RlOiBDYW52YXNOb2RlRGF0YSwgY3JvcDogQ2FudmFzSW1hZ2VDcm9wUmVjdCkgPT4ge1xuICAgICAgICBpZiAoIW5vZGUubWV0YWRhdGE/LmNvbnRlbnQpIHJldHVybjtcbiAgICAgICAgY29uc3QgY3JvcHBlZCA9IGF3YWl0IGNyb3BEYXRhVXJsKG5vZGUubWV0YWRhdGEuY29udGVudCwgY3JvcCk7XG4gICAgICAgIGNvbnN0IGltYWdlID0gYXdhaXQgdXBsb2FkSW1hZ2UoY3JvcHBlZCk7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gTWF0aC5taW4obm9kZS53aWR0aCwgTWF0aC5tYXgoMjIwLCBpbWFnZS53aWR0aCkpO1xuICAgICAgICBjb25zdCBjaGlsZElkID0gbmFub2lkKCk7XG4gICAgICAgIGNvbnN0IGNoaWxkOiBDYW52YXNOb2RlRGF0YSA9IHtcbiAgICAgICAgICAgIGlkOiBjaGlsZElkLFxuICAgICAgICAgICAgdHlwZTogQ2FudmFzTm9kZVR5cGUuSW1hZ2UsXG4gICAgICAgICAgICB0aXRsZTogXCJDcm9wcGVkIEltYWdlXCIsXG4gICAgICAgICAgICBwb3NpdGlvbjogeyB4OiBub2RlLnBvc2l0aW9uLnggKyBub2RlLndpZHRoICsgOTYsIHk6IG5vZGUucG9zaXRpb24ueSB9LFxuICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IHdpZHRoICogKGltYWdlLmhlaWdodCAvIGltYWdlLndpZHRoKSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgICAgLi4uaW1hZ2VNZXRhZGF0YShpbWFnZSksXG4gICAgICAgICAgICAgICAgcHJvbXB0OiBub2RlLm1ldGFkYXRhPy5wcm9tcHQsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICBzZXROb2RlcygocHJldikgPT4gWy4uLnByZXYsIGNoaWxkXSk7XG4gICAgICAgIHNldENvbm5lY3Rpb25zKChwcmV2KSA9PiBbLi4ucHJldiwgeyBpZDogbmFub2lkKCksIGZyb21Ob2RlSWQ6IG5vZGUuaWQsIHRvTm9kZUlkOiBjaGlsZElkIH1dKTtcbiAgICAgICAgc2V0U2VsZWN0ZWROb2RlSWRzKG5ldyBTZXQoW2NoaWxkSWRdKSk7XG4gICAgICAgIHNldERpYWxvZ05vZGVJZChjaGlsZElkKTtcbiAgICAgICAgc2V0Q3JvcE5vZGVJZChudWxsKTtcbiAgICB9LCBbXSk7XG5cbiAgICBjb25zdCBzcGxpdEltYWdlTm9kZSA9IHVzZUNhbGxiYWNrKFxuICAgICAgICBhc3luYyAobm9kZTogQ2FudmFzTm9kZURhdGEsIHBhcmFtczogQ2FudmFzSW1hZ2VTcGxpdFBhcmFtcykgPT4ge1xuICAgICAgICAgICAgaWYgKCFub2RlLm1ldGFkYXRhPy5jb250ZW50KSByZXR1cm47XG4gICAgICAgICAgICBzZXRTcGxpdE5vZGVJZChudWxsKTtcbiAgICAgICAgICAgIGNvbnN0IHBpZWNlcyA9IGF3YWl0IHNwbGl0RGF0YVVybChub2RlLm1ldGFkYXRhLmNvbnRlbnQsIHBhcmFtcyk7XG4gICAgICAgICAgICBjb25zdCBnYXAgPSAxNjtcbiAgICAgICAgICAgIGNvbnN0IGNlbGxXaWR0aCA9IG5vZGUud2lkdGggLyBwYXJhbXMuY29sdW1ucztcbiAgICAgICAgICAgIGNvbnN0IGNlbGxIZWlnaHQgPSBub2RlLmhlaWdodCAvIHBhcmFtcy5yb3dzO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnRYID0gbm9kZS5wb3NpdGlvbi54ICsgbm9kZS53aWR0aCArIDk2O1xuICAgICAgICAgICAgY29uc3Qgc3RhcnRZID0gbm9kZS5wb3NpdGlvbi55O1xuICAgICAgICAgICAgY29uc3QgY2hpbGROb2RlcyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgICAgICAgIHBpZWNlcy5tYXAoYXN5bmMgKHBpZWNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlID0gYXdhaXQgdXBsb2FkSW1hZ2UocGllY2UuZGF0YVVybCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlkID0gbmFub2lkKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IENhbnZhc05vZGVUeXBlLkltYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHQoXCJjYW52YXMucHJvamVjdFBhZ2Uuc3BsaXRUaXRsZVwiLCB7IG5hbWU6IG5vZGUudGl0bGUgfHwgdChcImFzc2V0cy5raW5kcy5pbWFnZVwiKSwgcm93OiBwaWVjZS5yb3cgKyAxLCBjb2x1bW46IHBpZWNlLmNvbHVtbiArIDEgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyB4OiBzdGFydFggKyBwaWVjZS5jb2x1bW4gKiAoY2VsbFdpZHRoICsgZ2FwKSwgeTogc3RhcnRZICsgcGllY2Uucm93ICogKGNlbGxIZWlnaHQgKyBnYXApIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogY2VsbFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBjZWxsSGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5pbWFnZU1ldGFkYXRhKGltYWdlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IG5vZGUubWV0YWRhdGE/LnByb21wdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0gc2F0aXNmaWVzIENhbnZhc05vZGVEYXRhO1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHNldE5vZGVzKChwcmV2KSA9PiBbLi4ucHJldiwgLi4uY2hpbGROb2Rlc10pO1xuICAgICAgICAgICAgc2V0Q29ubmVjdGlvbnMoKHByZXYpID0+IFsuLi5wcmV2LCAuLi5jaGlsZE5vZGVzLm1hcCgoY2hpbGQpID0+ICh7IGlkOiBuYW5vaWQoKSwgZnJvbU5vZGVJZDogbm9kZS5pZCwgdG9Ob2RlSWQ6IGNoaWxkLmlkIH0pKV0pO1xuICAgICAgICAgICAgc2V0U2VsZWN0ZWROb2RlSWRzKG5ldyBTZXQoY2hpbGROb2Rlcy5tYXAoKGNoaWxkKSA9PiBjaGlsZC5pZCkpKTtcbiAgICAgICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKG51bGwpO1xuICAgICAgICAgICAgc2V0RGlhbG9nTm9kZUlkKG51bGwpO1xuICAgICAgICAgICAgbWVzc2FnZS5zdWNjZXNzKHQoXCJjYW52YXMucHJvamVjdFBhZ2Uuc3BsaXRTdWNjZXNzXCIsIHsgY291bnQ6IGNoaWxkTm9kZXMubGVuZ3RoIH0pKTtcbiAgICAgICAgfSxcbiAgICAgICAgW21lc3NhZ2UsIHRdLFxuICAgICk7XG5cbiAgICBjb25zdCBtYXNrRWRpdEltYWdlTm9kZSA9IHVzZUNhbGxiYWNrKFxuICAgICAgICBhc3luYyAobm9kZTogQ2FudmFzTm9kZURhdGEsIHBheWxvYWQ6IENhbnZhc0ltYWdlTWFza0VkaXRQYXlsb2FkKSA9PiB7XG4gICAgICAgICAgICBpZiAoIW5vZGUubWV0YWRhdGE/LmNvbnRlbnQpIHJldHVybjtcbiAgICAgICAgICAgIGNvbnN0IGdlbmVyYXRpb25Db25maWcgPSB7IC4uLmJ1aWxkR2VuZXJhdGlvbkNvbmZpZyhlZmZlY3RpdmVDb25maWcsIG5vZGUsIFwiaW1hZ2VcIiksIGNvdW50OiBcIjFcIiwgc2l6ZTogbm9kZS5tZXRhZGF0YT8uc2l6ZSB8fCBcImF1dG9cIiB9O1xuICAgICAgICAgICAgaWYgKCFpc0FpQ29uZmlnUmVhZHkoZ2VuZXJhdGlvbkNvbmZpZywgZ2VuZXJhdGlvbkNvbmZpZy5tb2RlbCkpIHtcbiAgICAgICAgICAgICAgICBvcGVuQ29uZmlnRGlhbG9nKHRydWUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHVzZXJQcm9tcHQgPSBwYXlsb2FkLnByb21wdC50cmltKCk7XG4gICAgICAgICAgICBjb25zdCBwcm9tcHQgPSB0KFwiY2FudmFzLnByb2plY3RQYWdlLm1hc2tQcm9tcHRcIiwgeyBwcm9tcHQ6IHVzZXJQcm9tcHQgfSk7XG4gICAgICAgICAgICBjb25zdCBjaGlsZElkID0gbmFub2lkKCk7XG4gICAgICAgICAgICBjb25zdCBzb3VyY2UgPSB7IGlkOiBub2RlLmlkLCBuYW1lOiBgJHtub2RlLnRpdGxlIHx8IG5vZGUuaWR9LnBuZ2AsIHR5cGU6IG5vZGUubWV0YWRhdGEubWltZVR5cGUgfHwgXCJpbWFnZS9wbmdcIiwgZGF0YVVybDogbm9kZS5tZXRhZGF0YS5jb250ZW50LCBzdG9yYWdlS2V5OiBub2RlLm1ldGFkYXRhLnN0b3JhZ2VLZXkgfTtcbiAgICAgICAgICAgIGNvbnN0IGdlbmVyYXRpb25NZXRhZGF0YSA9IGJ1aWxkSW1hZ2VHZW5lcmF0aW9uTWV0YWRhdGEoXCJlZGl0XCIsIGdlbmVyYXRpb25Db25maWcsIDEsIFtzb3VyY2VdKTtcbiAgICAgICAgICAgIHNldE1hc2tFZGl0Tm9kZUlkKG51bGwpO1xuICAgICAgICAgICAgc2V0UnVubmluZ05vZGVJZChjaGlsZElkKTtcbiAgICAgICAgICAgIHNldE5vZGVzKChwcmV2KSA9PiBbXG4gICAgICAgICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBjaGlsZElkLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBDYW52YXNOb2RlVHlwZS5JbWFnZSxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHVzZXJQcm9tcHQuc2xpY2UoMCwgMzIpIHx8IHQoXCJjYW52YXMucHJvamVjdFBhZ2UubWFza1Jlc3VsdFwiKSxcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHsgeDogbm9kZS5wb3NpdGlvbi54ICsgbm9kZS53aWR0aCArIDk2LCB5OiBub2RlLnBvc2l0aW9uLnkgfSxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IG5vZGUud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogbm9kZS5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7IHByb21wdCwgc3RhdHVzOiBOT0RFX1NUQVRVU19MT0FESU5HLCAuLi5nZW5lcmF0aW9uTWV0YWRhdGEgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICBzZXRDb25uZWN0aW9ucygocHJldikgPT4gWy4uLnByZXYsIHsgaWQ6IG5hbm9pZCgpLCBmcm9tTm9kZUlkOiBub2RlLmlkLCB0b05vZGVJZDogY2hpbGRJZCB9XSk7XG4gICAgICAgICAgICBzZXRTZWxlY3RlZE5vZGVJZHMobmV3IFNldChbY2hpbGRJZF0pKTtcbiAgICAgICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKG51bGwpO1xuICAgICAgICAgICAgc2V0RGlhbG9nTm9kZUlkKGNoaWxkSWQpO1xuICAgICAgICAgICAgY29uc3QgY29udHJvbGxlciA9IHN0YXJ0R2VuZXJhdGlvblJlcXVlc3QoY2hpbGRJZCwgbm9kZS5pZCwgY2hpbGRJZCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlID0gYXdhaXQgcmVxdWVzdEVkaXQoZ2VuZXJhdGlvbkNvbmZpZywgcHJvbXB0LCBbc291cmNlXSwgeyBpZDogYCR7bm9kZS5pZH0tbWFza2AsIG5hbWU6IFwibWFzay5wbmdcIiwgdHlwZTogXCJpbWFnZS9wbmdcIiwgZGF0YVVybDogcGF5bG9hZC5tYXNrRGF0YVVybCB9LCB7IHNpZ25hbDogY29udHJvbGxlci5zaWduYWwgfSkudGhlbigoaXRlbXMpID0+IGl0ZW1zWzBdKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1cGxvYWRlZCA9IGF3YWl0IHVwbG9hZEltYWdlKGltYWdlLmRhdGFVcmwsIHsgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBzaXplID0gZml0Tm9kZVNpemUodXBsb2FkZWQud2lkdGgsIHVwbG9hZGVkLmhlaWdodCwgbm9kZS53aWR0aCwgbm9kZS5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIHNldE5vZGVzKChwcmV2KSA9PiBwcmV2Lm1hcCgoaXRlbSkgPT4gKGl0ZW0uaWQgPT09IGNoaWxkSWQgPyB7IC4uLml0ZW0sIHdpZHRoOiBzaXplLndpZHRoLCBoZWlnaHQ6IHNpemUuaGVpZ2h0LCBtZXRhZGF0YTogeyAuLi5pdGVtLm1ldGFkYXRhLCAuLi5pbWFnZU1ldGFkYXRhKHVwbG9hZGVkKSwgcHJvbXB0LCAuLi5nZW5lcmF0aW9uTWV0YWRhdGEgfSB9IDogaXRlbSkpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzR2VuZXJhdGlvbkNhbmNlbGVkKGVycm9yKSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yRGV0YWlscyA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogdChcImNhbnZhcy5wcm9qZWN0UGFnZS5tYXNrRmFpbGVkXCIpO1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UuZXJyb3IoZXJyb3JEZXRhaWxzKTtcbiAgICAgICAgICAgICAgICBzZXROb2RlcygocHJldikgPT4gcHJldi5tYXAoKGl0ZW0pID0+IChpdGVtLmlkID09PSBjaGlsZElkID8geyAuLi5pdGVtLCBtZXRhZGF0YTogeyAuLi5pdGVtLm1ldGFkYXRhLCBzdGF0dXM6IE5PREVfU1RBVFVTX0VSUk9SLCBlcnJvckRldGFpbHMgfSB9IDogaXRlbSkpKTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgZmluaXNoR2VuZXJhdGlvblJlcXVlc3QoY2hpbGRJZCwgY29udHJvbGxlcik7XG4gICAgICAgICAgICAgICAgc2V0UnVubmluZ05vZGVJZChudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgW2VmZmVjdGl2ZUNvbmZpZywgZmluaXNoR2VuZXJhdGlvblJlcXVlc3QsIGlzQWlDb25maWdSZWFkeSwgbWVzc2FnZSwgb3BlbkNvbmZpZ0RpYWxvZywgc3RhcnRHZW5lcmF0aW9uUmVxdWVzdCwgdF0sXG4gICAgKTtcblxuICAgIGNvbnN0IHVwc2NhbGVJbWFnZU5vZGUgPSB1c2VDYWxsYmFjayhhc3luYyAobm9kZTogQ2FudmFzTm9kZURhdGEsIHBhcmFtczogQ2FudmFzSW1hZ2VVcHNjYWxlUGFyYW1zKSA9PiB7XG4gICAgICAgIGlmICghbm9kZS5tZXRhZGF0YT8uY29udGVudCkgcmV0dXJuO1xuICAgICAgICBzZXRVcHNjYWxlTm9kZUlkKG51bGwpO1xuICAgICAgICBjb25zdCB1cHNjYWxlZCA9IGF3YWl0IHVwc2NhbGVEYXRhVXJsKG5vZGUubWV0YWRhdGEuY29udGVudCwgcGFyYW1zKTtcbiAgICAgICAgY29uc3QgaW1hZ2UgPSBhd2FpdCB1cGxvYWRJbWFnZSh1cHNjYWxlZCk7XG4gICAgICAgIGNvbnN0IHNpemUgPSBmaXROb2RlU2l6ZShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcbiAgICAgICAgY29uc3QgY2hpbGRJZCA9IG5hbm9pZCgpO1xuICAgICAgICBjb25zdCBjaGlsZDogQ2FudmFzTm9kZURhdGEgPSB7XG4gICAgICAgICAgICBpZDogY2hpbGRJZCxcbiAgICAgICAgICAgIHR5cGU6IENhbnZhc05vZGVUeXBlLkltYWdlLFxuICAgICAgICAgICAgdGl0bGU6IFwiVXBzY2FsZWQgSW1hZ2VcIixcbiAgICAgICAgICAgIHBvc2l0aW9uOiB7IHg6IG5vZGUucG9zaXRpb24ueCArIG5vZGUud2lkdGggKyA5NiwgeTogbm9kZS5wb3NpdGlvbi55IH0sXG4gICAgICAgICAgICB3aWR0aDogc2l6ZS53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogc2l6ZS5oZWlnaHQsXG4gICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICAgIC4uLmltYWdlTWV0YWRhdGEoaW1hZ2UpLFxuICAgICAgICAgICAgICAgIHByb21wdDogbm9kZS5tZXRhZGF0YT8ucHJvbXB0LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+IFsuLi5wcmV2LCBjaGlsZF0pO1xuICAgICAgICBzZXRDb25uZWN0aW9ucygocHJldikgPT4gWy4uLnByZXYsIHsgaWQ6IG5hbm9pZCgpLCBmcm9tTm9kZUlkOiBub2RlLmlkLCB0b05vZGVJZDogY2hpbGRJZCB9XSk7XG4gICAgICAgIHNldFNlbGVjdGVkTm9kZUlkcyhuZXcgU2V0KFtjaGlsZElkXSkpO1xuICAgICAgICBzZXREaWFsb2dOb2RlSWQoY2hpbGRJZCk7XG4gICAgfSwgW10pO1xuXG4gICAgY29uc3QgZ2VuZXJhdGVBbmdsZU5vZGUgPSB1c2VDYWxsYmFjayhcbiAgICAgICAgYXN5bmMgKG5vZGU6IENhbnZhc05vZGVEYXRhLCBwYXJhbXM6IENhbnZhc0ltYWdlQW5nbGVQYXJhbXMpID0+IHtcbiAgICAgICAgICAgIGlmICghbm9kZS5tZXRhZGF0YT8uY29udGVudCkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3QgZ2VuZXJhdGlvbkNvbmZpZyA9IHsgLi4uYnVpbGRHZW5lcmF0aW9uQ29uZmlnKGVmZmVjdGl2ZUNvbmZpZywgbm9kZSwgXCJpbWFnZVwiKSwgY291bnQ6IFwiMVwiIH07XG4gICAgICAgICAgICBpZiAoIWlzQWlDb25maWdSZWFkeShnZW5lcmF0aW9uQ29uZmlnLCBnZW5lcmF0aW9uQ29uZmlnLm1vZGVsKSkge1xuICAgICAgICAgICAgICAgIG9wZW5Db25maWdEaWFsb2codHJ1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY2hpbGRJZCA9IG5hbm9pZCgpO1xuICAgICAgICAgICAgY29uc3QgaW1hZ2VDb25maWcgPSBOT0RFX0RFRkFVTFRfU0laRVtDYW52YXNOb2RlVHlwZS5JbWFnZV07XG4gICAgICAgICAgICBjb25zdCB0aXRsZSA9IGJ1aWxkQW5nbGVMYWJlbChwYXJhbXMpO1xuICAgICAgICAgICAgY29uc3QgcHJvbXB0ID0gYnVpbGRBbmdsZVByb21wdChwYXJhbXMpO1xuICAgICAgICAgICAgY29uc3QgZ2VuZXJhdGlvbk1ldGFkYXRhID0gYnVpbGRJbWFnZUdlbmVyYXRpb25NZXRhZGF0YShcImVkaXRcIiwgZ2VuZXJhdGlvbkNvbmZpZywgMSwgW1xuICAgICAgICAgICAgICAgIHsgaWQ6IG5vZGUuaWQsIG5hbWU6IGAke25vZGUudGl0bGUgfHwgbm9kZS5pZH0ucG5nYCwgdHlwZTogbm9kZS5tZXRhZGF0YS5taW1lVHlwZSB8fCBcImltYWdlL3BuZ1wiLCBkYXRhVXJsOiBub2RlLm1ldGFkYXRhLmNvbnRlbnQsIHN0b3JhZ2VLZXk6IG5vZGUubWV0YWRhdGEuc3RvcmFnZUtleSB9LFxuICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICBzZXRBbmdsZU5vZGVJZChudWxsKTtcbiAgICAgICAgICAgIHNldFJ1bm5pbmdOb2RlSWQoY2hpbGRJZCk7XG4gICAgICAgICAgICBzZXROb2RlcygocHJldikgPT4gW1xuICAgICAgICAgICAgICAgIC4uLnByZXYsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZDogY2hpbGRJZCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogQ2FudmFzTm9kZVR5cGUuSW1hZ2UsXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyB4OiBub2RlLnBvc2l0aW9uLnggKyBub2RlLndpZHRoICsgOTYsIHk6IG5vZGUucG9zaXRpb24ueSB9LFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogaW1hZ2VDb25maWcud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaW1hZ2VDb25maWcuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YTogeyBwcm9tcHQsIHN0YXR1czogTk9ERV9TVEFUVVNfTE9BRElORywgLi4uZ2VuZXJhdGlvbk1ldGFkYXRhIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgc2V0Q29ubmVjdGlvbnMoKHByZXYpID0+IFsuLi5wcmV2LCB7IGlkOiBuYW5vaWQoKSwgZnJvbU5vZGVJZDogbm9kZS5pZCwgdG9Ob2RlSWQ6IGNoaWxkSWQgfV0pO1xuICAgICAgICAgICAgc2V0U2VsZWN0ZWROb2RlSWRzKG5ldyBTZXQoW2NoaWxkSWRdKSk7XG4gICAgICAgICAgICBzZXREaWFsb2dOb2RlSWQoY2hpbGRJZCk7XG4gICAgICAgICAgICBjb25zdCBjb250cm9sbGVyID0gc3RhcnRHZW5lcmF0aW9uUmVxdWVzdChjaGlsZElkLCBub2RlLmlkLCBjaGlsZElkKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW1hZ2UgPSBhd2FpdCByZXF1ZXN0RWRpdChcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGlvbkNvbmZpZyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0LFxuICAgICAgICAgICAgICAgICAgICBbeyBpZDogbm9kZS5pZCwgbmFtZTogYCR7bm9kZS50aXRsZSB8fCBub2RlLmlkfS5wbmdgLCB0eXBlOiBub2RlLm1ldGFkYXRhLm1pbWVUeXBlIHx8IFwiaW1hZ2UvcG5nXCIsIGRhdGFVcmw6IG5vZGUubWV0YWRhdGEuY29udGVudCwgc3RvcmFnZUtleTogbm9kZS5tZXRhZGF0YS5zdG9yYWdlS2V5IH1dLFxuICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIHsgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9LFxuICAgICAgICAgICAgICAgICkudGhlbigoaXRlbXMpID0+IGl0ZW1zWzBdKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1cGxvYWRlZCA9IGF3YWl0IHVwbG9hZEltYWdlKGltYWdlLmRhdGFVcmwsIHsgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBzaXplID0gZml0Tm9kZVNpemUodXBsb2FkZWQud2lkdGgsIHVwbG9hZGVkLmhlaWdodCwgaW1hZ2VDb25maWcud2lkdGgsIGltYWdlQ29uZmlnLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+IHByZXYubWFwKChpdGVtKSA9PiAoaXRlbS5pZCA9PT0gY2hpbGRJZCA/IHsgLi4uaXRlbSwgd2lkdGg6IHNpemUud2lkdGgsIGhlaWdodDogc2l6ZS5oZWlnaHQsIG1ldGFkYXRhOiB7IC4uLml0ZW0ubWV0YWRhdGEsIC4uLmltYWdlTWV0YWRhdGEodXBsb2FkZWQpLCBwcm9tcHQsIC4uLmdlbmVyYXRpb25NZXRhZGF0YSB9IH0gOiBpdGVtKSkpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNHZW5lcmF0aW9uQ2FuY2VsZWQoZXJyb3IpKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyb3JEZXRhaWxzID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiB0KFwiY2FudmFzLnByb2plY3RQYWdlLmdlbmVyYXRpb25GYWlsZWRcIik7XG4gICAgICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+IHByZXYubWFwKChpdGVtKSA9PiAoaXRlbS5pZCA9PT0gY2hpbGRJZCA/IHsgLi4uaXRlbSwgbWV0YWRhdGE6IHsgLi4uaXRlbS5tZXRhZGF0YSwgc3RhdHVzOiBOT0RFX1NUQVRVU19FUlJPUiwgZXJyb3JEZXRhaWxzIH0gfSA6IGl0ZW0pKSk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGZpbmlzaEdlbmVyYXRpb25SZXF1ZXN0KGNoaWxkSWQsIGNvbnRyb2xsZXIpO1xuICAgICAgICAgICAgICAgIHNldFJ1bm5pbmdOb2RlSWQobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFtlZmZlY3RpdmVDb25maWcsIGZpbmlzaEdlbmVyYXRpb25SZXF1ZXN0LCBvcGVuQ29uZmlnRGlhbG9nLCBzdGFydEdlbmVyYXRpb25SZXF1ZXN0LCB0XSxcbiAgICApO1xuXG4gICAgY29uc3QgaGFuZGxlRm9udFNpemVDaGFuZ2UgPSB1c2VDYWxsYmFjaygobm9kZUlkOiBzdHJpbmcsIGZvbnRTaXplOiBudW1iZXIpID0+IHtcbiAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+IHByZXYubWFwKChub2RlKSA9PiAobm9kZS5pZCA9PT0gbm9kZUlkID8geyAuLi5ub2RlLCBtZXRhZGF0YTogeyAuLi5ub2RlLm1ldGFkYXRhLCBmb250U2l6ZSB9IH0gOiBub2RlKSkpO1xuICAgIH0sIFtdKTtcblxuICAgIGNvbnN0IGhhbmRsZVVwbG9hZFJlcXVlc3QgPSB1c2VDYWxsYmFjaygobm9kZUlkPzogc3RyaW5nLCBwb3NpdGlvbj86IFBvc2l0aW9uKSA9PiB7XG4gICAgICAgIHVwbG9hZFRhcmdldFJlZi5jdXJyZW50ID0geyBub2RlSWQsIHBvc2l0aW9uIH07XG4gICAgICAgIGltYWdlSW5wdXRSZWYuY3VycmVudD8uY2xpY2soKTtcbiAgICB9LCBbXSk7XG5cbiAgICBjb25zdCBoYW5kbGVJbWFnZUlucHV0Q2hhbmdlID0gdXNlQ2FsbGJhY2soXG4gICAgICAgIGFzeW5jIChldmVudDogUmVhY3RDaGFuZ2VFdmVudDxIVE1MSW5wdXRFbGVtZW50PikgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmlsZXMgPSBBcnJheS5mcm9tKGV2ZW50LnRhcmdldC5maWxlcyB8fCBbXSkuZmlsdGVyKFxuICAgICAgICAgICAgICAgIChmKSA9PiBmLnR5cGUuc3RhcnRzV2l0aChcImltYWdlL1wiKSB8fCBmLnR5cGUuc3RhcnRzV2l0aChcInZpZGVvL1wiKSB8fCBpc0F1ZGlvRmlsZShmKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAoIWZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHVwbG9hZFRhcmdldFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBldmVudC50YXJnZXQudmFsdWUgPSBcIlwiO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gdXBsb2FkVGFyZ2V0UmVmLmN1cnJlbnQ7XG4gICAgICAgICAgICBjb25zdCBiYXNlUG9zaXRpb24gPVxuICAgICAgICAgICAgICAgIHRhcmdldD8ucG9zaXRpb24gfHxcbiAgICAgICAgICAgICAgICBzY3JlZW5Ub0NhbnZhcyhcbiAgICAgICAgICAgICAgICAgICAgKGNvbnRhaW5lclJlZi5jdXJyZW50Py5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0IHx8IDApICsgc2l6ZS53aWR0aCAvIDIsXG4gICAgICAgICAgICAgICAgICAgIChjb250YWluZXJSZWYuY3VycmVudD8uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wIHx8IDApICsgc2l6ZS5oZWlnaHQgLyAyLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjb25zdCBTVEFHR0VSID0gNDA7IC8vIE9mZnNldCBiZXR3ZWVuIG11bHRpcGxlIGltcG9ydGVkIGZpbGVzLlxuXG4gICAgICAgICAgICAvLyBXaGVuIHJlcGxhY2luZyBhIHRhcmdldCBub2RlLCB1c2UgdGhlIGZpcnN0IGZpbGUgYXMgdGhlIHJlcGxhY2VtZW50IGFuZCBjcmVhdGUgdGhlIHJlc3QgbmVhcmJ5LlxuICAgICAgICAgICAgaWYgKHRhcmdldD8ubm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgW2ZpcnN0LCAuLi5yZXN0XSA9IGZpbGVzO1xuXG4gICAgICAgICAgICAgICAgLy8gUmVwbGFjZSB0aGUgdGFyZ2V0IG5vZGUgd2l0aCB0aGUgZmlyc3QgZmlsZS5cbiAgICAgICAgICAgICAgICBpZiAoaXNBdWRpb0ZpbGUoZmlyc3QpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1ZGlvID0gYXdhaXQgdXBsb2FkTWVkaWFGaWxlKGZpcnN0LCBcImF1ZGlvXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzcGVjID0gTk9ERV9ERUZBVUxUX1NJWkVbQ2FudmFzTm9kZVR5cGUuQXVkaW9dO1xuICAgICAgICAgICAgICAgICAgICBzZXROb2RlcygocHJldikgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXYubWFwKChub2RlKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuaWQgPT09IHRhcmdldC5ub2RlSWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLm5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IENhbnZhc05vZGVUeXBlLkF1ZGlvLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogZmlyc3QubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHsgeDogbm9kZS5wb3NpdGlvbi54ICsgbm9kZS53aWR0aCAvIDIgLSBzcGVjLndpZHRoIC8gMiwgeTogbm9kZS5wb3NpdGlvbi55ICsgbm9kZS5oZWlnaHQgLyAyIC0gc3BlYy5oZWlnaHQgLyAyIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBzcGVjLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHNwZWMuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YTogeyAuLi5ub2RlLm1ldGFkYXRhLCAuLi5hdWRpb01ldGFkYXRhKGF1ZGlvKSwgZXJyb3JEZXRhaWxzOiB1bmRlZmluZWQgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkTm9kZUlkcyhuZXcgU2V0KFt0YXJnZXQubm9kZUlkXSkpO1xuICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZENvbm5lY3Rpb25JZChudWxsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpcnN0LnR5cGUuc3RhcnRzV2l0aChcInZpZGVvL1wiKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2aWRlbyA9IGF3YWl0IHVwbG9hZE1lZGlhRmlsZShmaXJzdCwgXCJ2aWRlb1wiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV4dFNpemUgPSBmaXROb2RlU2l6ZSh2aWRlby53aWR0aCB8fCAxMjgwLCB2aWRlby5oZWlnaHQgfHwgNzIwLCBWSURFT19OT0RFX01BWF9XSURUSCwgVklERU9fTk9ERV9NQVhfSEVJR0hUKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2Lm1hcCgobm9kZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLmlkID09PSB0YXJnZXQubm9kZUlkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5ub2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBDYW52YXNOb2RlVHlwZS5WaWRlbyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGZpcnN0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IHg6IG5vZGUucG9zaXRpb24ueCArIG5vZGUud2lkdGggLyAyIC0gbmV4dFNpemUud2lkdGggLyAyLCB5OiBub2RlLnBvc2l0aW9uLnkgKyBub2RlLmhlaWdodCAvIDIgLSBuZXh0U2l6ZS5oZWlnaHQgLyAyIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBuZXh0U2l6ZS53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBuZXh0U2l6ZS5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7IC4uLm5vZGUubWV0YWRhdGEsIC4uLnZpZGVvTWV0YWRhdGEodmlkZW8pLCBlcnJvckRldGFpbHM6IHVuZGVmaW5lZCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBub2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0U2VsZWN0ZWROb2RlSWRzKG5ldyBTZXQoW3RhcmdldC5ub2RlSWRdKSk7XG4gICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKG51bGwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlID0gYXdhaXQgdXBsb2FkSW1hZ2UoZmlyc3QpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gZml0Tm9kZVNpemUoaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIHNldE5vZGVzKChwcmV2KSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldi5tYXAoKG5vZGUpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5pZCA9PT0gdGFyZ2V0Lm5vZGVJZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4ubm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogQ2FudmFzTm9kZVR5cGUuSW1hZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBmaXJzdC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogcy53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBzLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLm5vZGUubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5pbWFnZU1ldGFkYXRhKGltYWdlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yRGV0YWlsczogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJlZVJlc2l6ZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWFnZXM6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVyYXRpb25UeXBlOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGl0eTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZXM6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW1hcnlJbWFnZUlkOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IG5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZE5vZGVJZHMobmV3IFNldChbdGFyZ2V0Lm5vZGVJZF0pKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0U2VsZWN0ZWRDb25uZWN0aW9uSWQobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSByZW1haW5pbmcgZmlsZXMgbmVhciB0aGUgdGFyZ2V0IG5vZGUuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldFBvcyA9IHsgeDogYmFzZVBvc2l0aW9uLnggKyAoaSArIDEpICogU1RBR0dFUiwgeTogYmFzZVBvc2l0aW9uLnkgKyAoaSArIDEpICogU1RBR0dFUiB9O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmID0gcmVzdFtpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzQXVkaW9GaWxlKGYpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2b2lkIGNyZWF0ZUF1ZGlvRmlsZU5vZGUoZiwgb2Zmc2V0UG9zKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmLnR5cGUuc3RhcnRzV2l0aChcInZpZGVvL1wiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdm9pZCBjcmVhdGVWaWRlb0ZpbGVOb2RlKGYsIG9mZnNldFBvcyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2b2lkIGNyZWF0ZUltYWdlRmlsZU5vZGUoZiwgb2Zmc2V0UG9zKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gV2l0aG91dCBhIHJlcGxhY2VtZW50IHRhcmdldCwgY3JlYXRlIGFsbCBmaWxlcyBuZWFyIHRoZSBjYW52YXMgY2VudGVyLlxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0UG9zID0geyB4OiBiYXNlUG9zaXRpb24ueCArIGkgKiBTVEFHR0VSLCB5OiBiYXNlUG9zaXRpb24ueSArIGkgKiBTVEFHR0VSIH07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGYgPSBmaWxlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzQXVkaW9GaWxlKGYpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2b2lkIGNyZWF0ZUF1ZGlvRmlsZU5vZGUoZiwgb2Zmc2V0UG9zKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmLnR5cGUuc3RhcnRzV2l0aChcInZpZGVvL1wiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdm9pZCBjcmVhdGVWaWRlb0ZpbGVOb2RlKGYsIG9mZnNldFBvcyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2b2lkIGNyZWF0ZUltYWdlRmlsZU5vZGUoZiwgb2Zmc2V0UG9zKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdXBsb2FkVGFyZ2V0UmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgICAgICAgZXZlbnQudGFyZ2V0LnZhbHVlID0gXCJcIjtcbiAgICAgICAgfSxcbiAgICAgICAgW2NyZWF0ZUF1ZGlvRmlsZU5vZGUsIGNyZWF0ZUltYWdlRmlsZU5vZGUsIGNyZWF0ZVZpZGVvRmlsZU5vZGUsIHNjcmVlblRvQ2FudmFzLCBzaXplLmhlaWdodCwgc2l6ZS53aWR0aF0sXG4gICAgKTtcblxuICAgIGNvbnN0IGhhbmRsZURyb3AgPSB1c2VDYWxsYmFjayhcbiAgICAgICAgKGV2ZW50OiBSZWFjdERyYWdFdmVudDxIVE1MRGl2RWxlbWVudD4pID0+IHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBjb25zdCBmaWxlcyA9IEFycmF5LmZyb20oZXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzKS5maWx0ZXIoXG4gICAgICAgICAgICAgICAgKGl0ZW0pID0+IGl0ZW0udHlwZS5zdGFydHNXaXRoKFwiaW1hZ2UvXCIpIHx8IGl0ZW0udHlwZS5zdGFydHNXaXRoKFwidmlkZW8vXCIpIHx8IGlzQXVkaW9GaWxlKGl0ZW0pLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGlmICghZmlsZXMubGVuZ3RoKSByZXR1cm47XG5cbiAgICAgICAgICAgIGNvbnN0IGJhc2VQb3MgPSBzY3JlZW5Ub0NhbnZhcyhldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKTtcbiAgICAgICAgICAgIGNvbnN0IFNUQUdHRVIgPSA0MDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwb3MgPSB7IHg6IGJhc2VQb3MueCArIGkgKiBTVEFHR0VSLCB5OiBiYXNlUG9zLnkgKyBpICogU1RBR0dFUiB9O1xuICAgICAgICAgICAgICAgIGNvbnN0IGYgPSBmaWxlc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoaXNBdWRpb0ZpbGUoZikpIHtcbiAgICAgICAgICAgICAgICAgICAgdm9pZCBjcmVhdGVBdWRpb0ZpbGVOb2RlKGYsIHBvcyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmLnR5cGUuc3RhcnRzV2l0aChcInZpZGVvL1wiKSkge1xuICAgICAgICAgICAgICAgICAgICB2b2lkIGNyZWF0ZVZpZGVvRmlsZU5vZGUoZiwgcG9zKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2b2lkIGNyZWF0ZUltYWdlRmlsZU5vZGUoZiwgcG9zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFtjcmVhdGVBdWRpb0ZpbGVOb2RlLCBjcmVhdGVJbWFnZUZpbGVOb2RlLCBjcmVhdGVWaWRlb0ZpbGVOb2RlLCBzY3JlZW5Ub0NhbnZhc10sXG4gICAgKTtcblxuICAgIGNvbnN0IHN0YXJ0VGl0bGVFZGl0aW5nID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgICAgICBzZXRUaXRsZURyYWZ0KGN1cnJlbnRQcm9qZWN0Py50aXRsZSB8fCB0KFwiY2FudmFzLnByb2plY3RQYWdlLnVudGl0bGVkQ2FudmFzXCIpKTtcbiAgICAgICAgc2V0VGl0bGVFZGl0aW5nKHRydWUpO1xuICAgIH0sIFtjdXJyZW50UHJvamVjdD8udGl0bGUsIHRdKTtcblxuICAgIGNvbnN0IGZpbmlzaFRpdGxlRWRpdGluZyA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgY29uc3QgbmV4dFRpdGxlID0gdGl0bGVEcmFmdC50cmltKCk7XG4gICAgICAgIGlmIChuZXh0VGl0bGUpIHJlbmFtZVByb2plY3QocHJvamVjdElkLCBuZXh0VGl0bGUpO1xuICAgICAgICBzZXRUaXRsZUVkaXRpbmcoZmFsc2UpO1xuICAgIH0sIFtwcm9qZWN0SWQsIHJlbmFtZVByb2plY3QsIHRpdGxlRHJhZnRdKTtcblxuICAgIGNvbnN0IHByZXZlbnRDYW52YXNDb250ZXh0TWVudSA9IHVzZUNhbGxiYWNrKChldmVudDogUmVhY3RNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgIGlmICgoZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5jbG9zZXN0KFwiW2RhdGEtbm9kZS1pZF1cIikpIHJldHVybjtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgc2V0Q29udGV4dE1lbnUobnVsbCk7XG4gICAgfSwgW10pO1xuXG4gICAgY29uc3QgaGFuZGxlR2VuZXJhdGVOb2RlID0gdXNlQ2FsbGJhY2soXG4gICAgICAgIGFzeW5jIChub2RlSWQ6IHN0cmluZywgbW9kZTogQ2FudmFzTm9kZUdlbmVyYXRpb25Nb2RlLCBwcm9tcHQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc291cmNlTm9kZSA9IG5vZGVzUmVmLmN1cnJlbnQuZmluZCgobm9kZSkgPT4gbm9kZS5pZCA9PT0gbm9kZUlkKTtcbiAgICAgICAgICAgIGNvbnN0IGdlbmVyYXRpb25Db25maWcgPSBidWlsZEdlbmVyYXRpb25Db25maWcoZWZmZWN0aXZlQ29uZmlnLCBzb3VyY2VOb2RlLCBtb2RlKTtcbiAgICAgICAgICAgIGlmICghaXNBaUNvbmZpZ1JlYWR5KGdlbmVyYXRpb25Db25maWcsIGdlbmVyYXRpb25Db25maWcubW9kZWwpKSB7XG4gICAgICAgICAgICAgICAgb3BlbkNvbmZpZ0RpYWxvZyh0cnVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHVzZUJ1aWx0aW5QYW5lbC53cml0ZUJhY2tUb1NlbGYgcmV1c2VzIGJ1aWx0LWluIGdlbmVyYXRpb24gd2hpbGUgd3JpdGluZyB0aGUgcmVzdWx0IGJhY2sgdG8gdGhlIHBsdWdpbiBub2RlLlxuICAgICAgICAgICAgLy8gSW1hZ2UgbW9kZSBjdXJyZW50bHkgc3VwcG9ydHMgZGlzcGxheS1vbmx5IG5vZGVzIHN1Y2ggYXMgcGFub3JhbWFzLCB3aXRoIGEgdXNlQnVpbHRpblBhbmVsLnByb21wdFByZWZpeC5cbiAgICAgICAgICAgIGNvbnN0IGJ1aWx0aW5QYW5lbCA9IHNvdXJjZU5vZGUgPyBnZXROb2RlRGVmaW5pdGlvbihzb3VyY2VOb2RlLnR5cGUpPy51c2VCdWlsdGluUGFuZWwgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAoc291cmNlTm9kZSAmJiBidWlsdGluUGFuZWw/LndyaXRlQmFja1RvU2VsZiAmJiBidWlsdGluUGFuZWwubW9kZSA9PT0gXCJpbWFnZVwiKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBwcm9tcHQudHJpbSgpO1xuICAgICAgICAgICAgICAgIGlmICghc2NlbmUpIHJldHVybjtcbiAgICAgICAgICAgICAgICBzZXRSdW5uaW5nTm9kZUlkKG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udHJvbGxlciA9IHN0YXJ0R2VuZXJhdGlvblJlcXVlc3Qobm9kZUlkLCBub2RlSWQsIG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+IHByZXYubWFwKChub2RlKSA9PiAobm9kZS5pZCA9PT0gbm9kZUlkID8geyAuLi5ub2RlLCBtZXRhZGF0YTogeyAuLi5ub2RlLm1ldGFkYXRhLCBwcm9tcHQ6IHNjZW5lLCBzdGF0dXM6IE5PREVfU1RBVFVTX0xPQURJTkcsIGVycm9yRGV0YWlsczogdW5kZWZpbmVkIH0gfSA6IG5vZGUpKSk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZnVsbFByb21wdCA9IChidWlsdGluUGFuZWwucHJvbXB0UHJlZml4IHx8IFwiXCIpICsgc2NlbmU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCBoeWRyYXRlTm9kZUdlbmVyYXRpb25Db250ZXh0KGJ1aWxkTm9kZUdlbmVyYXRpb25Db250ZXh0KG5vZGVJZCwgbm9kZXNSZWYuY3VycmVudCwgY29ubmVjdGlvbnNSZWYuY3VycmVudCwgZnVsbFByb21wdCkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZWZzID0gY29udGV4dC5yZWZlcmVuY2VJbWFnZXM7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlID0gcmVmcy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgID8gYXdhaXQgcmVxdWVzdEVkaXQoeyAuLi5nZW5lcmF0aW9uQ29uZmlnLCBjb3VudDogXCIxXCIgfSwgY29udGV4dC5wcm9tcHQsIHJlZnMsIHVuZGVmaW5lZCwgeyBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsIH0pLnRoZW4oKGl0ZW1zKSA9PiBpdGVtc1swXSlcbiAgICAgICAgICAgICAgICAgICAgICAgIDogYXdhaXQgcmVxdWVzdEdlbmVyYXRpb24oeyAuLi5nZW5lcmF0aW9uQ29uZmlnLCBjb3VudDogXCIxXCIgfSwgY29udGV4dC5wcm9tcHQsIHsgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KS50aGVuKChpdGVtcykgPT4gaXRlbXNbMF0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1cGxvYWRlZCA9IGF3YWl0IHVwbG9hZEltYWdlKGltYWdlLmRhdGFVcmwsIHsgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KTtcbiAgICAgICAgICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2Lm1hcCgobm9kZSkgPT4gKG5vZGUuaWQgPT09IG5vZGVJZCA/IHsgLi4ubm9kZSwgbWV0YWRhdGE6IHsgLi4ubm9kZS5tZXRhZGF0YSwgLi4uaW1hZ2VNZXRhZGF0YSh1cGxvYWRlZCksIHByb21wdDogc2NlbmUsIG1vZGVsOiBnZW5lcmF0aW9uQ29uZmlnLm1vZGVsLCBzdGF0dXM6IE5PREVfU1RBVFVTX1NVQ0NFU1MsIGVycm9yRGV0YWlsczogdW5kZWZpbmVkIH0gfSA6IG5vZGUpKSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0RGlhbG9nTm9kZUlkKG51bGwpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNHZW5lcmF0aW9uQ2FuY2VsZWQoZXJyb3IpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnJvckRldGFpbHMgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IHQoXCJjYW52YXMucHJvamVjdFBhZ2UuZ2VuZXJhdGlvbkZhaWxlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UuZXJyb3IoZXJyb3JEZXRhaWxzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldE5vZGVzKChwcmV2KSA9PiBwcmV2Lm1hcCgobm9kZSkgPT4gKG5vZGUuaWQgPT09IG5vZGVJZCA/IHsgLi4ubm9kZSwgbWV0YWRhdGE6IHsgLi4ubm9kZS5tZXRhZGF0YSwgc3RhdHVzOiBOT0RFX1NUQVRVU19FUlJPUiwgZXJyb3JEZXRhaWxzIH0gfSA6IG5vZGUpKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICBmaW5pc2hHZW5lcmF0aW9uUmVxdWVzdChub2RlSWQsIGNvbnRyb2xsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNldFJ1bm5pbmdOb2RlSWQobm9kZUlkKTtcbiAgICAgICAgICAgIGNvbnN0IHJ1bkNvbnRyb2xsZXIgPSBzdGFydEdlbmVyYXRpb25SZXF1ZXN0KG5vZGVJZCwgbm9kZUlkLCBub2RlSWQpO1xuICAgICAgICAgICAgY29uc3Qgc291cmNlVGV4dENvbnRlbnQgPSBzb3VyY2VOb2RlPy50eXBlID09PSBDYW52YXNOb2RlVHlwZS5UZXh0ID8gc291cmNlTm9kZS5tZXRhZGF0YT8uY29udGVudD8udHJpbSgpIHx8IFwiXCIgOiBcIlwiO1xuICAgICAgICAgICAgY29uc3QgZWRpdGluZ1RleHROb2RlID0gbW9kZSA9PT0gXCJ0ZXh0XCIgJiYgQm9vbGVhbihzb3VyY2VUZXh0Q29udGVudCk7XG4gICAgICAgICAgICBjb25zdCBnZW5lcmF0aW9uQ29udGV4dCA9IGF3YWl0IGh5ZHJhdGVOb2RlR2VuZXJhdGlvbkNvbnRleHQoXG4gICAgICAgICAgICAgICAgYnVpbGROb2RlR2VuZXJhdGlvbkNvbnRleHQobm9kZUlkLCBub2Rlc1JlZi5jdXJyZW50LCBjb25uZWN0aW9uc1JlZi5jdXJyZW50LCBlZGl0aW5nVGV4dE5vZGUgPyB0KFwiY2FudmFzLnByb2plY3RQYWdlLmVkaXRUZXh0UHJvbXB0XCIsIHsgc291cmNlOiBzb3VyY2VUZXh0Q29udGVudCwgcHJvbXB0IH0pIDogcHJvbXB0KSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjb25zdCBlZmZlY3RpdmVQcm9tcHQgPSBnZW5lcmF0aW9uQ29udGV4dC5wcm9tcHQudHJpbSgpO1xuICAgICAgICAgICAgaWYgKHJ1bkNvbnRyb2xsZXIuc2lnbmFsLmFib3J0ZWQpIHtcbiAgICAgICAgICAgICAgICBmaW5pc2hHZW5lcmF0aW9uUmVxdWVzdChub2RlSWQsIHJ1bkNvbnRyb2xsZXIpO1xuICAgICAgICAgICAgICAgIHNldFJ1bm5pbmdOb2RlSWQobnVsbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbWFya1NvdXJjZVN0YXR1cyA9IHNvdXJjZU5vZGU/LnR5cGUgIT09IENhbnZhc05vZGVUeXBlLkltYWdlICYmICFlZGl0aW5nVGV4dE5vZGU7XG4gICAgICAgICAgICBpZiAoIWVmZmVjdGl2ZVByb21wdCAmJiAobW9kZSA9PT0gXCJ0ZXh0XCIgfHwgbW9kZSA9PT0gXCJhdWRpb1wiKSkge1xuICAgICAgICAgICAgICAgIGZpbmlzaEdlbmVyYXRpb25SZXF1ZXN0KG5vZGVJZCwgcnVuQ29udHJvbGxlcik7XG4gICAgICAgICAgICAgICAgc2V0UnVubmluZ05vZGVJZChudWxsKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgcGVuZGluZ0NoaWxkSWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgaWYgKG1hcmtTb3VyY2VTdGF0dXMpIHNldE5vZGVzKChwcmV2KSA9PiBwcmV2Lm1hcCgobm9kZSkgPT4gKG5vZGUuaWQgPT09IG5vZGVJZCA/IHsgLi4ubm9kZSwgbWV0YWRhdGE6IHsgLi4ubm9kZS5tZXRhZGF0YSwgLi4uKG5vZGUudHlwZSA9PT0gQ2FudmFzTm9kZVR5cGUuQ29uZmlnID8ge30gOiB7IHByb21wdCB9KSwgc3RhdHVzOiBOT0RFX1NUQVRVU19MT0FESU5HLCBlcnJvckRldGFpbHM6IHVuZGVmaW5lZCB9IH0gOiBub2RlKSkpO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChtb2RlID09PSBcImltYWdlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY291bnQgPSBnZXRHZW5lcmF0aW9uQ291bnQoZ2VuZXJhdGlvbkNvbmZpZy5jb3VudCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQ29uZmlnTm9kZSA9IHNvdXJjZU5vZGU/LnR5cGUgPT09IENhbnZhc05vZGVUeXBlLkNvbmZpZztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNJbWFnZU5vZGUgPSBzb3VyY2VOb2RlPy50eXBlID09PSBDYW52YXNOb2RlVHlwZS5JbWFnZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNFbXB0eUltYWdlTm9kZSA9IGlzSW1hZ2VOb2RlICYmICFzb3VyY2VOb2RlPy5tZXRhZGF0YT8uY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc291cmNlUmVmZXJlbmNlID1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlzSW1hZ2VOb2RlICYmIHNvdXJjZU5vZGU/Lm1ldGFkYXRhPy5jb250ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBbeyBpZDogc291cmNlTm9kZS5pZCwgbmFtZTogYCR7c291cmNlTm9kZS50aXRsZSB8fCBzb3VyY2VOb2RlLmlkfS5wbmdgLCB0eXBlOiBzb3VyY2VOb2RlLm1ldGFkYXRhLm1pbWVUeXBlIHx8IFwiaW1hZ2UvcG5nXCIsIGRhdGFVcmw6IHNvdXJjZU5vZGUubWV0YWRhdGEuY29udGVudCwgc3RvcmFnZUtleTogc291cmNlTm9kZS5tZXRhZGF0YS5zdG9yYWdlS2V5IH1dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBbXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVmZXJlbmNlSW1hZ2VzID0gWy4uLm5ldyBNYXAoWy4uLnNvdXJjZVJlZmVyZW5jZSwgLi4uZ2VuZXJhdGlvbkNvbnRleHQucmVmZXJlbmNlSW1hZ2VzXS5tYXAoKGltYWdlKSA9PiBbaW1hZ2UuaWQsIGltYWdlXSkpLnZhbHVlcygpXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ2VuZXJhdGlvblR5cGUgPSByZWZlcmVuY2VJbWFnZXMubGVuZ3RoID8gKFwiZWRpdFwiIGFzIGNvbnN0KSA6IChcImdlbmVyYXRpb25cIiBhcyBjb25zdCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdlbmVyYXRpb25NZXRhZGF0YSA9IGJ1aWxkSW1hZ2VHZW5lcmF0aW9uTWV0YWRhdGEoZ2VuZXJhdGlvblR5cGUsIGdlbmVyYXRpb25Db25maWcsIGNvdW50LCByZWZlcmVuY2VJbWFnZXMpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnRDb25maWcgPSBOT0RFX0RFRkFVTFRfU0laRVtpc0NvbmZpZ05vZGUgPyBDYW52YXNOb2RlVHlwZS5Db25maWcgOiBpc0ltYWdlTm9kZSA/IENhbnZhc05vZGVUeXBlLkltYWdlIDogQ2FudmFzTm9kZVR5cGUuVGV4dF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlQ29uZmlnID0gTk9ERV9ERUZBVUxUX1NJWkVbQ2FudmFzTm9kZVR5cGUuSW1hZ2VdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnRQb3NpdGlvbiA9IHNvdXJjZU5vZGU/LnBvc2l0aW9uIHx8IHsgeDogMCwgeTogMCB9O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290SWQgPSBpc0VtcHR5SW1hZ2VOb2RlID8gbm9kZUlkIDogbmFub2lkKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlSWRzID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogY291bnQgfSwgKCkgPT4gbmFub2lkKCkpO1xuICAgICAgICAgICAgICAgICAgICBwZW5kaW5nQ2hpbGRJZHMgPSBbcm9vdElkXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdE5vZGU6IENhbnZhc05vZGVEYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHJvb3RJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IENhbnZhc05vZGVUeXBlLkltYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGVmZmVjdGl2ZVByb21wdC5zbGljZSgwLCAzMikgfHwgXCJHZW5lcmF0ZWQgSW1hZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogaXNFbXB0eUltYWdlTm9kZSA/IHBhcmVudFBvc2l0aW9uLnggOiBwYXJlbnRQb3NpdGlvbi54ICsgcGFyZW50Q29uZmlnLndpZHRoICsgOTYsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogcGFyZW50UG9zaXRpb24ueSArIHBhcmVudENvbmZpZy5oZWlnaHQgLyAyIC0gaW1hZ2VDb25maWcuaGVpZ2h0IC8gMixcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogaXNFbXB0eUltYWdlTm9kZSA/IHNvdXJjZU5vZGU/LndpZHRoIHx8IGltYWdlQ29uZmlnLndpZHRoIDogaW1hZ2VDb25maWcud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGlzRW1wdHlJbWFnZU5vZGUgPyBzb3VyY2VOb2RlPy5oZWlnaHQgfHwgaW1hZ2VDb25maWcuaGVpZ2h0IDogaW1hZ2VDb25maWcuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGVmZmVjdGl2ZVByb21wdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IE5PREVfU1RBVFVTX0xPQURJTkcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2VzOiBpbWFnZUlkcy5tYXAoKGlkKSA9PiAoeyBpZCwgc3RhdHVzOiBOT0RFX1NUQVRVU19MT0FESU5HLCBjb250ZW50OiBcIlwiLCBuYXR1cmFsV2lkdGg6IDAsIG5hdHVyYWxIZWlnaHQ6IDAsIGJ5dGVzOiAwLCBtaW1lVHlwZTogXCJcIiB9KSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uZ2VuZXJhdGlvbk1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBzZXROb2RlcygocHJldikgPT4gW1xuICAgICAgICAgICAgICAgICAgICAgICAgLi4ucHJldi5tYXAoKG5vZGUpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5pZCA9PT0gbm9kZUlkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gaXNDb25maWdOb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLm5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YTogeyAuLi5ub2RlLm1ldGFkYXRhLCBzdGF0dXM6IE5PREVfU1RBVFVTX0xPQURJTkcsIGVycm9yRGV0YWlsczogdW5kZWZpbmVkIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogaXNFbXB0eUltYWdlTm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4ubm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHJvb3ROb2RlLnBvc2l0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogcm9vdE5vZGUud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogcm9vdE5vZGUuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogcm9vdE5vZGUudGl0bGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7IC4uLm5vZGUubWV0YWRhdGEsIC4uLnJvb3ROb2RlLm1ldGFkYXRhLCBlcnJvckRldGFpbHM6IHVuZGVmaW5lZCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBpc0ltYWdlTm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLm5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGE6IHsgLi4ubm9kZS5tZXRhZGF0YSwgc3RhdHVzOiBOT0RFX1NUQVRVU19TVUNDRVNTLCBlcnJvckRldGFpbHM6IHVuZGVmaW5lZCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLm5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogQ2FudmFzTm9kZVR5cGUuVGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogcHJvbXB0LnNsaWNlKDAsIDMyKSB8fCBcIlByb21wdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBwYXJlbnRDb25maWcud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJlbnRDb25maWcuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7IC4uLm5vZGUubWV0YWRhdGEsIGNvbnRlbnQ6IHByb21wdCwgcHJvbXB0LCBzdGF0dXM6IE5PREVfU1RBVFVTX1NVQ0NFU1MsIGZvbnRTaXplOiAxNCwgZXJyb3JEZXRhaWxzOiB1bmRlZmluZWQgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBub2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLihpc0VtcHR5SW1hZ2VOb2RlID8gW10gOiBbcm9vdE5vZGVdKSxcbiAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNFbXB0eUltYWdlTm9kZSkgc2V0Q29ubmVjdGlvbnMoKHByZXYpID0+IFsuLi5wcmV2LCB7IGlkOiBuYW5vaWQoKSwgZnJvbU5vZGVJZDogbm9kZUlkLCB0b05vZGVJZDogcm9vdElkIH1dKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0U2VsZWN0ZWROb2RlSWRzKG5ldyBTZXQoW25vZGVJZF0pKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0U2VsZWN0ZWRDb25uZWN0aW9uSWQobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHNldERpYWxvZ05vZGVJZChub2RlSWQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRyb2xsZXIgPSByb290SWQgPT09IG5vZGVJZCA/IHJ1bkNvbnRyb2xsZXIgOiBzdGFydEdlbmVyYXRpb25SZXF1ZXN0KHJvb3RJZCwgbm9kZUlkLCBub2RlSWQsIHJ1bkNvbnRyb2xsZXIpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgaGFzU3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBsZXQgaGFzRmFpbHVyZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZmlyc3RFcnJvciA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2VJZHMubWFwKGFzeW5jIChpbWFnZUlkKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1hZ2UgPSByZWZlcmVuY2VJbWFnZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGF3YWl0IHJlcXVlc3RFZGl0KHsgLi4uZ2VuZXJhdGlvbkNvbmZpZywgY291bnQ6IFwiMVwiIH0sIGVmZmVjdGl2ZVByb21wdCwgcmVmZXJlbmNlSW1hZ2VzLCB1bmRlZmluZWQsIHsgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KS50aGVuKChpdGVtcykgPT4gaXRlbXNbMF0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGF3YWl0IHJlcXVlc3RHZW5lcmF0aW9uKHsgLi4uZ2VuZXJhdGlvbkNvbmZpZywgY291bnQ6IFwiMVwiIH0sIGVmZmVjdGl2ZVByb21wdCwgeyBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsIH0pLnRoZW4oKGl0ZW1zKSA9PiBpdGVtc1swXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHVwbG9hZGVkID0gYXdhaXQgdXBsb2FkSW1hZ2UoaW1hZ2UuZGF0YVVybCwgeyBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWFnZVNpemUgPSBmaXROb2RlU2l6ZSh1cGxvYWRlZC53aWR0aCwgdXBsb2FkZWQuaGVpZ2h0LCBpbWFnZUNvbmZpZy53aWR0aCwgaW1hZ2VDb25maWcuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbTogQ2FudmFzTm9kZUltYWdlID0geyBpZDogaW1hZ2VJZCwgc3RhdHVzOiBOT0RFX1NUQVRVU19TVUNDRVNTLCBjb250ZW50OiB1cGxvYWRlZC51cmwsIHN0b3JhZ2VLZXk6IHVwbG9hZGVkLnN0b3JhZ2VLZXksIG5hdHVyYWxXaWR0aDogdXBsb2FkZWQud2lkdGgsIG5hdHVyYWxIZWlnaHQ6IHVwbG9hZGVkLmhlaWdodCwgYnl0ZXM6IHVwbG9hZGVkLmJ5dGVzLCBtaW1lVHlwZTogdXBsb2FkZWQubWltZVR5cGUgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2Lm1hcCgobm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmlkICE9PSByb290SWQpIHJldHVybiBub2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlcyA9IG5vZGUubWV0YWRhdGE/LmltYWdlcz8ubWFwKChpbWFnZSkgPT4gKGltYWdlLmlkID09PSBpbWFnZUlkID8gaXRlbSA6IGltYWdlKSkgfHwgW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUubWV0YWRhdGE/LnByaW1hcnlJbWFnZUlkKSByZXR1cm4geyAuLi5ub2RlLCBtZXRhZGF0YTogeyAuLi5ub2RlLm1ldGFkYXRhLCBpbWFnZXMgfSB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNlbnRlciA9IHsgeDogbm9kZS5wb3NpdGlvbi54ICsgbm9kZS53aWR0aCAvIDIsIHk6IG5vZGUucG9zaXRpb24ueSArIG5vZGUuaGVpZ2h0IC8gMiB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLm5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IHg6IGNlbnRlci54IC0gaW1hZ2VTaXplLndpZHRoIC8gMiwgeTogY2VudGVyLnkgLSBpbWFnZVNpemUuaGVpZ2h0IC8gMiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5pbWFnZVNpemUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5ub2RlLm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogaXRlbS5jb250ZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RvcmFnZUtleTogaXRlbS5zdG9yYWdlS2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmF0dXJhbFdpZHRoOiBpdGVtLm5hdHVyYWxXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdHVyYWxIZWlnaHQ6IGl0ZW0ubmF0dXJhbEhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ5dGVzOiBpdGVtLmJ5dGVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWltZVR5cGU6IGl0ZW0ubWltZVR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWFnZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmltYXJ5SW1hZ2VJZDogaW1hZ2VJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc1N1Y2Nlc3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNDb25maWdOb2RlKSBzZXROb2RlcygocHJldikgPT4gcHJldi5tYXAoKG5vZGUpID0+IChub2RlLmlkID09PSBub2RlSWQgPyB7IC4uLm5vZGUsIG1ldGFkYXRhOiB7IC4uLm5vZGUubWV0YWRhdGEsIHN0YXR1czogTk9ERV9TVEFUVVNfU1VDQ0VTUywgZXJyb3JEZXRhaWxzOiB1bmRlZmluZWQgfSB9IDogbm9kZSkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzR2VuZXJhdGlvbkNhbmNlbGVkKGVycm9yKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnJvckRldGFpbHMgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IHQoXCJjYW52YXMucHJvamVjdFBhZ2UuZ2VuZXJhdGlvbkZhaWxlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmaXJzdEVycm9yKSBmaXJzdEVycm9yID0gZXJyb3JEZXRhaWxzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNGYWlsdXJlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+IHByZXYubWFwKChub2RlKSA9PiAobm9kZS5pZCA9PT0gcm9vdElkID8geyAuLi5ub2RlLCBtZXRhZGF0YTogeyAuLi5ub2RlLm1ldGFkYXRhLCBpbWFnZXM6IG5vZGUubWV0YWRhdGE/LmltYWdlcz8ubWFwKChpbWFnZSkgPT4gKGltYWdlLmlkID09PSBpbWFnZUlkID8geyAuLi5pbWFnZSwgc3RhdHVzOiBOT0RFX1NUQVRVU19FUlJPUiwgZXJyb3JEZXRhaWxzIH0gOiBpbWFnZSkpIH0gfSA6IG5vZGUpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBpZiAocm9vdElkICE9PSBub2RlSWQpIGZpbmlzaEdlbmVyYXRpb25SZXF1ZXN0KHJvb3RJZCwgY29udHJvbGxlcik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250cm9sbGVyLnNpZ25hbC5hYm9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXROb2RlcygocHJldikgPT4gcHJldi5tYXAoKG5vZGUpID0+IChub2RlLmlkID09PSBub2RlSWQgJiYgaXNDb25maWdOb2RlICYmIG5vZGUubWV0YWRhdGE/LnN0YXR1cyA9PT0gTk9ERV9TVEFUVVNfTE9BRElORyA/IHsgLi4ubm9kZSwgbWV0YWRhdGE6IHsgLi4ubm9kZS5tZXRhZGF0YSwgc3RhdHVzOiBOT0RFX1NUQVRVU19JRExFLCBlcnJvckRldGFpbHM6IHVuZGVmaW5lZCB9IH0gOiBub2RlKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChoYXNGYWlsdXJlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlLmVycm9yKGhhc1N1Y2Nlc3MgPyB0KFwiY2FudmFzLnByb2plY3RQYWdlLnBhcnRpYWxGYWlsZWRcIikgOiBmaXJzdEVycm9yIHx8IHQoXCJjYW52YXMucHJvamVjdFBhZ2UuZ2VuZXJhdGlvbkZhaWxlZFwiKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2Lm1hcCgobm9kZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLmlkID09PSBub2RlSWQgJiYgaXNDb25maWdOb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8geyAuLi5ub2RlLCBtZXRhZGF0YTogeyAuLi5ub2RlLm1ldGFkYXRhLCBzdGF0dXM6IGhhc1N1Y2Nlc3MgPyBOT0RFX1NUQVRVU19TVUNDRVNTIDogTk9ERV9TVEFUVVNfRVJST1IsIGVycm9yRGV0YWlsczogaGFzU3VjY2VzcyA/IHVuZGVmaW5lZCA6IHQoXCJjYW52YXMucHJvamVjdFBhZ2UuZ2VuZXJhdGlvbkZhaWxlZFwiKSB9IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBub2RlLmlkID09PSByb290SWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHsgLi4ubm9kZSwgbWV0YWRhdGE6IHsgLi4ubm9kZS5tZXRhZGF0YSwgc3RhdHVzOiBoYXNTdWNjZXNzID8gTk9ERV9TVEFUVVNfU1VDQ0VTUyA6IE5PREVfU1RBVFVTX0VSUk9SLCBlcnJvckRldGFpbHM6IGhhc1N1Y2Nlc3MgPyB1bmRlZmluZWQgOiB0KFwiY2FudmFzLnByb2plY3RQYWdlLmFsbEZhaWxlZFwiKSB9IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAobW9kZSA9PT0gXCJ2aWRlb1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNwZWMgPSBub2RlU2l6ZUZyb21SYXRpbyhnZW5lcmF0aW9uQ29uZmlnLnNpemUsIE5PREVfREVGQVVMVF9TSVpFW0NhbnZhc05vZGVUeXBlLlZpZGVvXS53aWR0aCwgTk9ERV9ERUZBVUxUX1NJWkVbQ2FudmFzTm9kZVR5cGUuVmlkZW9dLmhlaWdodCkgfHwgTk9ERV9ERUZBVUxUX1NJWkVbQ2FudmFzTm9kZVR5cGUuVmlkZW9dO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0VtcHR5VmlkZW9Ob2RlID0gc291cmNlTm9kZT8udHlwZSA9PT0gQ2FudmFzTm9kZVR5cGUuVmlkZW8gJiYgIXNvdXJjZU5vZGUubWV0YWRhdGE/LmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZpZGVvSWQgPSBpc0VtcHR5VmlkZW9Ob2RlID8gbm9kZUlkIDogbmFub2lkKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHNvdXJjZU5vZGU/LnBvc2l0aW9uIHx8IHsgeDogMCwgeTogMCB9O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2aWRlb05vZGU6IENhbnZhc05vZGVEYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHZpZGVvSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBDYW52YXNOb2RlVHlwZS5WaWRlbyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBlZmZlY3RpdmVQcm9tcHQuc2xpY2UoMCwgMzIpIHx8IFwiR2VuZXJhdGVkIFZpZGVvXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogaXNFbXB0eVZpZGVvTm9kZSA/IHNvdXJjZU5vZGUucG9zaXRpb24gOiB7IHg6IHBhcmVudC54ICsgKHNvdXJjZU5vZGU/LndpZHRoIHx8IHNwZWMud2lkdGgpICsgOTYsIHk6IHBhcmVudC55IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogaXNFbXB0eVZpZGVvTm9kZSA/IHNvdXJjZU5vZGUud2lkdGggOiBzcGVjLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBpc0VtcHR5VmlkZW9Ob2RlID8gc291cmNlTm9kZS5oZWlnaHQgOiBzcGVjLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBlZmZlY3RpdmVQcm9tcHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBOT0RFX1NUQVRVU19MT0FESU5HLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBnZW5lcmF0aW9uQ29uZmlnLm1vZGVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IGdlbmVyYXRpb25Db25maWcuc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWNvbmRzOiBnZW5lcmF0aW9uQ29uZmlnLnZpZGVvU2Vjb25kcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2cXVhbGl0eTogZ2VuZXJhdGlvbkNvbmZpZy52cXVhbGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUF1ZGlvOiBnZW5lcmF0aW9uQ29uZmlnLnZpZGVvR2VuZXJhdGVBdWRpbyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3YXRlcm1hcms6IGdlbmVyYXRpb25Db25maWcudmlkZW9XYXRlcm1hcmssXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNlczogZ2VuZXJhdGlvblJlZmVyZW5jZVVybHMoZ2VuZXJhdGlvbkNvbnRleHQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZ0NoaWxkSWRzID0gW3ZpZGVvSWRdO1xuICAgICAgICAgICAgICAgICAgICBzZXROb2RlcygocHJldikgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlzRW1wdHlWaWRlb05vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHByZXYubWFwKChub2RlKSA9PiAobm9kZS5pZCA9PT0gbm9kZUlkID8geyAuLi5ub2RlLCAuLi52aWRlb05vZGUgfSA6IG5vZGUpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogWy4uLnByZXYubWFwKChub2RlKSA9PiAobm9kZS5pZCA9PT0gbm9kZUlkID8geyAuLi5ub2RlLCBtZXRhZGF0YTogeyAuLi5ub2RlLm1ldGFkYXRhLCBzdGF0dXM6IE5PREVfU1RBVFVTX1NVQ0NFU1MgfSB9IDogbm9kZSkpLCB2aWRlb05vZGVdLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRW1wdHlWaWRlb05vZGUpIHNldENvbm5lY3Rpb25zKChwcmV2KSA9PiBbLi4ucHJldiwgeyBpZDogbmFub2lkKCksIGZyb21Ob2RlSWQ6IG5vZGVJZCwgdG9Ob2RlSWQ6IHZpZGVvSWQgfV0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250cm9sbGVyID0gc3RhcnRHZW5lcmF0aW9uUmVxdWVzdCh2aWRlb0lkLCBub2RlSWQsIG5vZGVJZCwgcnVuQ29udHJvbGxlcik7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2aWRlbyA9IGF3YWl0IHN0b3JlR2VuZXJhdGVkVmlkZW8oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgcmVxdWVzdFZpZGVvR2VuZXJhdGlvbihnZW5lcmF0aW9uQ29uZmlnLCBlZmZlY3RpdmVQcm9tcHQsIGdlbmVyYXRpb25Db250ZXh0LnJlZmVyZW5jZUltYWdlcywgeyBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZpZGVvU2l6ZSA9IGZpdE5vZGVTaXplKHZpZGVvLndpZHRoIHx8IHNwZWMud2lkdGgsIHZpZGVvLmhlaWdodCB8fCBzcGVjLmhlaWdodCwgVklERU9fTk9ERV9NQVhfV0lEVEgsIFZJREVPX05PREVfTUFYX0hFSUdIVCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXROb2RlcygocHJldikgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2Lm1hcCgobm9kZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5pZCA9PT0gdmlkZW9JZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5ub2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHZpZGVvU2l6ZS53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogdmlkZW9TaXplLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IHg6IG5vZGUucG9zaXRpb24ueCArIG5vZGUud2lkdGggLyAyIC0gdmlkZW9TaXplLndpZHRoIC8gMiwgeTogbm9kZS5wb3NpdGlvbi55ICsgbm9kZS5oZWlnaHQgLyAyIC0gdmlkZW9TaXplLmhlaWdodCAvIDIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4ubm9kZS5tZXRhZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi52aWRlb01ldGFkYXRhKHZpZGVvKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGVmZmVjdGl2ZVByb21wdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbDogZ2VuZXJhdGlvbkNvbmZpZy5tb2RlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiBnZW5lcmF0aW9uQ29uZmlnLnNpemUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Vjb25kczogZ2VuZXJhdGlvbkNvbmZpZy52aWRlb1NlY29uZHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdnF1YWxpdHk6IGdlbmVyYXRpb25Db25maWcudnF1YWxpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVBdWRpbzogZ2VuZXJhdGlvbkNvbmZpZy52aWRlb0dlbmVyYXRlQXVkaW8sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2F0ZXJtYXJrOiBnZW5lcmF0aW9uQ29uZmlnLnZpZGVvV2F0ZXJtYXJrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZXM6IGdlbmVyYXRpb25SZWZlcmVuY2VVcmxzKGdlbmVyYXRpb25Db250ZXh0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbmlzaEdlbmVyYXRpb25SZXF1ZXN0KHZpZGVvSWQsIGNvbnRyb2xsZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAobW9kZSA9PT0gXCJhdWRpb1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNwZWMgPSBOT0RFX0RFRkFVTFRfU0laRVtDYW52YXNOb2RlVHlwZS5BdWRpb107XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzRW1wdHlBdWRpb05vZGUgPSBzb3VyY2VOb2RlPy50eXBlID09PSBDYW52YXNOb2RlVHlwZS5BdWRpbyAmJiAhc291cmNlTm9kZS5tZXRhZGF0YT8uY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXVkaW9JZCA9IGlzRW1wdHlBdWRpb05vZGUgPyBub2RlSWQgOiBuYW5vaWQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gc291cmNlTm9kZT8ucG9zaXRpb24gfHwgeyB4OiAwLCB5OiAwIH07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1ZGlvTm9kZTogQ2FudmFzTm9kZURhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogYXVkaW9JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IENhbnZhc05vZGVUeXBlLkF1ZGlvLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGVmZmVjdGl2ZVByb21wdC5zbGljZSgwLCAzMikgfHwgXCJHZW5lcmF0ZWQgQXVkaW9cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBpc0VtcHR5QXVkaW9Ob2RlID8gc291cmNlTm9kZS5wb3NpdGlvbiA6IHsgeDogcGFyZW50LnggKyAoc291cmNlTm9kZT8ud2lkdGggfHwgc3BlYy53aWR0aCkgKyA5NiwgeTogcGFyZW50LnkgKyAoKHNvdXJjZU5vZGU/LmhlaWdodCB8fCBzcGVjLmhlaWdodCkgLSBzcGVjLmhlaWdodCkgLyAyIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogaXNFbXB0eUF1ZGlvTm9kZSA/IHNvdXJjZU5vZGUud2lkdGggOiBzcGVjLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBpc0VtcHR5QXVkaW9Ob2RlID8gc291cmNlTm9kZS5oZWlnaHQgOiBzcGVjLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7IHByb21wdDogZWZmZWN0aXZlUHJvbXB0LCBzdGF0dXM6IE5PREVfU1RBVFVTX0xPQURJTkcsIC4uLmJ1aWxkQXVkaW9HZW5lcmF0aW9uTWV0YWRhdGEoZ2VuZXJhdGlvbkNvbmZpZykgfSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZ0NoaWxkSWRzID0gW2F1ZGlvSWRdO1xuICAgICAgICAgICAgICAgICAgICBzZXROb2RlcygocHJldikgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlzRW1wdHlBdWRpb05vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHByZXYubWFwKChub2RlKSA9PiAobm9kZS5pZCA9PT0gbm9kZUlkID8geyAuLi5ub2RlLCAuLi5hdWRpb05vZGUgfSA6IG5vZGUpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogWy4uLnByZXYubWFwKChub2RlKSA9PiAobm9kZS5pZCA9PT0gbm9kZUlkID8geyAuLi5ub2RlLCBtZXRhZGF0YTogeyAuLi5ub2RlLm1ldGFkYXRhLCBzdGF0dXM6IE5PREVfU1RBVFVTX1NVQ0NFU1MgfSB9IDogbm9kZSkpLCBhdWRpb05vZGVdLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRW1wdHlBdWRpb05vZGUpIHNldENvbm5lY3Rpb25zKChwcmV2KSA9PiBbLi4ucHJldiwgeyBpZDogbmFub2lkKCksIGZyb21Ob2RlSWQ6IG5vZGVJZCwgdG9Ob2RlSWQ6IGF1ZGlvSWQgfV0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250cm9sbGVyID0gc3RhcnRHZW5lcmF0aW9uUmVxdWVzdChhdWRpb0lkLCBub2RlSWQsIG5vZGVJZCwgcnVuQ29udHJvbGxlcik7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhdWRpbyA9IGF3YWl0IHN0b3JlR2VuZXJhdGVkQXVkaW8oYXdhaXQgcmVxdWVzdEF1ZGlvR2VuZXJhdGlvbihnZW5lcmF0aW9uQ29uZmlnLCBlZmZlY3RpdmVQcm9tcHQsIHsgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KSwgZ2VuZXJhdGlvbkNvbmZpZy5hdWRpb0Zvcm1hdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXROb2RlcygocHJldikgPT4gcHJldi5tYXAoKG5vZGUpID0+IChub2RlLmlkID09PSBhdWRpb0lkID8geyAuLi5ub2RlLCBtZXRhZGF0YTogeyAuLi5ub2RlLm1ldGFkYXRhLCAuLi5hdWRpb01ldGFkYXRhKGF1ZGlvKSwgcHJvbXB0OiBlZmZlY3RpdmVQcm9tcHQsIC4uLmJ1aWxkQXVkaW9HZW5lcmF0aW9uTWV0YWRhdGEoZ2VuZXJhdGlvbkNvbmZpZykgfSB9IDogbm9kZSkpKTtcbiAgICAgICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbmlzaEdlbmVyYXRpb25SZXF1ZXN0KGF1ZGlvSWQsIGNvbnRyb2xsZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBpc0NvbmZpZ05vZGUgPSBzb3VyY2VOb2RlPy50eXBlID09PSBDYW52YXNOb2RlVHlwZS5Db25maWc7XG4gICAgICAgICAgICAgICAgY29uc3QgdGV4dENvdW50ID0gZ2V0R2VuZXJhdGlvbkNvdW50KFN0cmluZyhzb3VyY2VOb2RlPy5tZXRhZGF0YT8udGV4dENvdW50IHx8IDEpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnRDb25maWcgPSBOT0RFX0RFRkFVTFRfU0laRVtpc0NvbmZpZ05vZGUgPyBDYW52YXNOb2RlVHlwZS5Db25maWcgOiBDYW52YXNOb2RlVHlwZS5UZXh0XTtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0Q29uZmlnID0gTk9ERV9ERUZBVUxUX1NJWkVbQ2FudmFzTm9kZVR5cGUuVGV4dF07XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50UG9zaXRpb24gPSBzb3VyY2VOb2RlPy5wb3NpdGlvbiB8fCB7IHg6IDAsIHk6IDAgfTtcbiAgICAgICAgICAgICAgICBjb25zdCBpc0VtcHR5VGV4dE5vZGUgPSBzb3VyY2VOb2RlPy50eXBlID09PSBDYW52YXNOb2RlVHlwZS5UZXh0ICYmICFzb3VyY2VUZXh0Q29udGVudDtcbiAgICAgICAgICAgICAgICBjb25zdCByb290SWQgPSBpc0VtcHR5VGV4dE5vZGUgPyBub2RlSWQgOiBuYW5vaWQoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0SWRzID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogdGV4dENvdW50IH0sICgpID0+IG5hbm9pZCgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCByb290Tm9kZTogQ2FudmFzTm9kZURhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiByb290SWQsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IENhbnZhc05vZGVUeXBlLlRleHQsXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBlZmZlY3RpdmVQcm9tcHQuc2xpY2UoMCwgMzIpIHx8IFwiR2VuZXJhdGVkIFRleHRcIixcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGlzRW1wdHlUZXh0Tm9kZSA/IHNvdXJjZU5vZGUucG9zaXRpb24gOiB7IHg6IHBhcmVudFBvc2l0aW9uLnggKyBwYXJlbnRDb25maWcud2lkdGggKyA5NiwgeTogcGFyZW50UG9zaXRpb24ueSArIHBhcmVudENvbmZpZy5oZWlnaHQgLyAyIC0gdGV4dENvbmZpZy5oZWlnaHQgLyAyIH0sXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBpc0VtcHR5VGV4dE5vZGUgPyBzb3VyY2VOb2RlLndpZHRoIDogdGV4dENvbmZpZy53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBpc0VtcHR5VGV4dE5vZGUgPyBzb3VyY2VOb2RlLmhlaWdodCA6IHRleHRDb25maWcuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBlZmZlY3RpdmVQcm9tcHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IE5PREVfU1RBVFVTX0xPQURJTkcsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogMTQsXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RlbDogZ2VuZXJhdGlvbkNvbmZpZy5tb2RlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlYXNvbmluZ0VmZm9ydDogZ2VuZXJhdGlvbkNvbmZpZy5yZWFzb25pbmdFZmZvcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0Q291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0czogdGV4dElkcy5tYXAoKGlkKSA9PiAoeyBpZCwgc3RhdHVzOiBOT0RFX1NUQVRVU19MT0FESU5HLCBjb250ZW50OiBcIlwiIH0pKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW1hcnlUZXh0SWQ6IHRleHRJZHNbMF0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBwZW5kaW5nQ2hpbGRJZHMgPSBbcm9vdElkXTtcbiAgICAgICAgICAgICAgICBzZXROb2RlcygocHJldikgPT5cbiAgICAgICAgICAgICAgICAgICAgaXNFbXB0eVRleHROb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHByZXYubWFwKChub2RlKSA9PiAobm9kZS5pZCA9PT0gbm9kZUlkID8geyAuLi5ub2RlLCAuLi5yb290Tm9kZSB9IDogbm9kZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IFsuLi5wcmV2Lm1hcCgobm9kZSkgPT4gKG5vZGUuaWQgPT09IG5vZGVJZCAmJiBpc0NvbmZpZ05vZGUgPyB7IC4uLm5vZGUsIG1ldGFkYXRhOiB7IC4uLm5vZGUubWV0YWRhdGEsIHN0YXR1czogTk9ERV9TVEFUVVNfTE9BRElORywgZXJyb3JEZXRhaWxzOiB1bmRlZmluZWQgfSB9IDogbm9kZSkpLCByb290Tm9kZV0sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzRW1wdHlUZXh0Tm9kZSkgc2V0Q29ubmVjdGlvbnMoKHByZXYpID0+IFsuLi5wcmV2LCB7IGlkOiBuYW5vaWQoKSwgZnJvbU5vZGVJZDogbm9kZUlkLCB0b05vZGVJZDogcm9vdElkIH1dKTtcbiAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZE5vZGVJZHMobmV3IFNldChbbm9kZUlkXSkpO1xuICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKG51bGwpO1xuICAgICAgICAgICAgICAgIHNldERpYWxvZ05vZGVJZChub2RlSWQpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgY29udHJvbGxlciA9IHJvb3RJZCA9PT0gbm9kZUlkID8gcnVuQ29udHJvbGxlciA6IHN0YXJ0R2VuZXJhdGlvblJlcXVlc3Qocm9vdElkLCBub2RlSWQsIG5vZGVJZCwgcnVuQ29udHJvbGxlcik7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgICAgICAgICAgICB0ZXh0SWRzLm1hcChhc3luYyAodGV4dElkKTogUHJvbWlzZTxDYW52YXNOb2RlVGV4dCB8IG51bGw+ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzdHJlYW1lZCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFuc3dlciA9IGF3YWl0IHJlcXVlc3RJbWFnZVF1ZXN0aW9uKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0aW9uQ29uZmlnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWlsZE5vZGVSZXNwb25zZU1lc3NhZ2VzKHsgLi4uZ2VuZXJhdGlvbkNvbnRleHQsIHByb21wdDogZWZmZWN0aXZlUHJvbXB0IH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodGV4dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtZWQgPSB0ZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldi5tYXAoKG5vZGUpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuaWQgPT09IHJvb3RJZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5ub2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5ub2RlLm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLihub2RlLm1ldGFkYXRhPy5wcmltYXJ5VGV4dElkID09PSB0ZXh0SWQgPyB7IGNvbnRlbnQ6IHRleHQgfSA6IHt9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0czogbm9kZS5tZXRhZGF0YT8udGV4dHM/Lm1hcCgoaXRlbSkgPT4gKGl0ZW0uaWQgPT09IHRleHRJZCA/IHsgLi4uaXRlbSwgY29udGVudDogdGV4dCB9IDogaXRlbSkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBub2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHNpZ25hbDogY29udHJvbGxlci5zaWduYWwgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhbnN3ZXIgfHwgc3RyZWFtZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXYubWFwKChub2RlKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5pZCA9PT0gcm9vdElkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4ubm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5ub2RlLm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi4obm9kZS5tZXRhZGF0YT8ucHJpbWFyeVRleHRJZCA9PT0gdGV4dElkID8geyBjb250ZW50IH0gOiB7fSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRzOiBub2RlLm1ldGFkYXRhPy50ZXh0cz8ubWFwKChpdGVtKSA9PiAoaXRlbS5pZCA9PT0gdGV4dElkID8geyAuLi5pdGVtLCBjb250ZW50LCBzdGF0dXM6IE5PREVfU1RBVFVTX1NVQ0NFU1MgfSA6IGl0ZW0pKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IGlkOiB0ZXh0SWQsIHN0YXR1czogTk9ERV9TVEFUVVNfU1VDQ0VTUywgY29udGVudCB9IHNhdGlzZmllcyBDYW52YXNOb2RlVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzR2VuZXJhdGlvbkNhbmNlbGVkKGVycm9yKSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3JEZXRhaWxzID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiB0KFwiY2FudmFzLnByb2plY3RQYWdlLmdlbmVyYXRpb25GYWlsZWRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+IHByZXYubWFwKChub2RlKSA9PiAobm9kZS5pZCA9PT0gcm9vdElkID8geyAuLi5ub2RlLCBtZXRhZGF0YTogeyAuLi5ub2RlLm1ldGFkYXRhLCB0ZXh0czogbm9kZS5tZXRhZGF0YT8udGV4dHM/Lm1hcCgoaXRlbSkgPT4gKGl0ZW0uaWQgPT09IHRleHRJZCA/IHsgLi4uaXRlbSwgc3RhdHVzOiBOT0RFX1NUQVRVU19FUlJPUiwgZXJyb3JEZXRhaWxzIH0gOiBpdGVtKSkgfSB9IDogbm9kZSkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBpZDogdGV4dElkLCBzdGF0dXM6IE5PREVfU1RBVFVTX0VSUk9SLCBjb250ZW50OiBcIlwiLCBlcnJvckRldGFpbHMgfSBzYXRpc2ZpZXMgQ2FudmFzTm9kZVRleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgaWYgKHJvb3RJZCAhPT0gbm9kZUlkKSBmaW5pc2hHZW5lcmF0aW9uUmVxdWVzdChyb290SWQsIGNvbnRyb2xsZXIpO1xuICAgICAgICAgICAgICAgIGlmIChjb250cm9sbGVyLnNpZ25hbC5hYm9ydGVkKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgY29tcGxldGVkVGV4dHMgPSByZXN1bHRzLmZsYXRNYXAoKGl0ZW0pID0+IChpdGVtPy5zdGF0dXMgPT09IE5PREVfU1RBVFVTX1NVQ0NFU1MgPyBbaXRlbV0gOiBbXSkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhaWxlZFRleHRzID0gcmVzdWx0cy5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0/LnN0YXR1cyA9PT0gTk9ERV9TVEFUVVNfRVJST1IpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0VGV4dCA9IGNvbXBsZXRlZFRleHRzWzBdO1xuICAgICAgICAgICAgICAgIGlmIChjb21wbGV0ZWRUZXh0cy5sZW5ndGggPD0gMSkgc2V0RXhwYW5kZWRCYXRjaE5vZGVJZHMoKGN1cnJlbnQpID0+IG5ldyBTZXQoWy4uLmN1cnJlbnRdLmZpbHRlcigoaWQpID0+IGlkICE9PSByb290SWQpKSk7XG4gICAgICAgICAgICAgICAgaWYgKGZhaWxlZFRleHRzLmxlbmd0aCkgbWVzc2FnZS5lcnJvcihmaXJzdFRleHQgPyB0KFwiY2FudmFzLnByb2plY3RQYWdlLnBhcnRpYWxUZXh0RmFpbGVkXCIpIDogZmFpbGVkVGV4dHNbMF0/LmVycm9yRGV0YWlscyB8fCB0KFwiY2FudmFzLnByb2plY3RQYWdlLmdlbmVyYXRpb25GYWlsZWRcIikpO1xuICAgICAgICAgICAgICAgIHNldE5vZGVzKChwcmV2KSA9PlxuICAgICAgICAgICAgICAgICAgICBwcmV2Lm1hcCgobm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUuaWQgPT09IHJvb3RJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByaW1hcnlUZXh0ID0gY29tcGxldGVkVGV4dHMuZmluZCgodGV4dCkgPT4gdGV4dC5pZCA9PT0gbm9kZS5tZXRhZGF0YT8ucHJpbWFyeVRleHRJZCkgfHwgZmlyc3RUZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLm5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5ub2RlLm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogcHJpbWFyeVRleHQ/LmNvbnRlbnQgfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRzOiBjb21wbGV0ZWRUZXh0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW1hcnlUZXh0SWQ6IHByaW1hcnlUZXh0Py5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogcHJpbWFyeVRleHQgPyBOT0RFX1NUQVRVU19TVUNDRVNTIDogTk9ERV9TVEFUVVNfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvckRldGFpbHM6IHByaW1hcnlUZXh0ID8gdW5kZWZpbmVkIDogdChcImNhbnZhcy5wcm9qZWN0UGFnZS5nZW5lcmF0aW9uRmFpbGVkXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbm9kZS5pZCA9PT0gbm9kZUlkICYmIGlzQ29uZmlnTm9kZSA/IHsgLi4ubm9kZSwgbWV0YWRhdGE6IHsgLi4ubm9kZS5tZXRhZGF0YSwgc3RhdHVzOiBmaXJzdFRleHQgPyBOT0RFX1NUQVRVU19TVUNDRVNTIDogTk9ERV9TVEFUVVNfRVJST1IsIGVycm9yRGV0YWlsczogZmlyc3RUZXh0ID8gdW5kZWZpbmVkIDogdChcImNhbnZhcy5wcm9qZWN0UGFnZS5nZW5lcmF0aW9uRmFpbGVkXCIpIH0gfSA6IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGlmIChpc0dlbmVyYXRpb25DYW5jZWxlZChlcnJvcikpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnJvckRldGFpbHMgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IHQoXCJjYW52YXMucHJvamVjdFBhZ2UuZ2VuZXJhdGlvbkZhaWxlZFwiKTtcbiAgICAgICAgICAgICAgICBtZXNzYWdlLmVycm9yKGVycm9yRGV0YWlscyk7XG4gICAgICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+XG4gICAgICAgICAgICAgICAgICAgIHByZXYubWFwKChub2RlKSA9PiAobm9kZS5pZCA9PT0gbm9kZUlkIHx8IHBlbmRpbmdDaGlsZElkcy5pbmNsdWRlcyhub2RlLmlkKSA/IChub2RlLmlkID09PSBub2RlSWQgJiYgIW1hcmtTb3VyY2VTdGF0dXMgPyBub2RlIDogeyAuLi5ub2RlLCBtZXRhZGF0YTogeyAuLi5ub2RlLm1ldGFkYXRhLCBzdGF0dXM6IE5PREVfU1RBVFVTX0VSUk9SLCBlcnJvckRldGFpbHMgfSB9KSA6IG5vZGUpKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBmaW5pc2hHZW5lcmF0aW9uUmVxdWVzdChub2RlSWQsIHJ1bkNvbnRyb2xsZXIpO1xuICAgICAgICAgICAgICAgIHNldFJ1bm5pbmdOb2RlSWQobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFtlZmZlY3RpdmVDb25maWcsIGZpbmlzaEdlbmVyYXRpb25SZXF1ZXN0LCBpc0FpQ29uZmlnUmVhZHksIG1lc3NhZ2UsIG9wZW5Db25maWdEaWFsb2csIHN0YXJ0R2VuZXJhdGlvblJlcXVlc3QsIHRdLFxuICAgICk7XG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgZ2VuZXJhdGVOb2RlUmVmLmN1cnJlbnQgPSBoYW5kbGVHZW5lcmF0ZU5vZGU7XG4gICAgfSwgW2hhbmRsZUdlbmVyYXRlTm9kZV0pO1xuXG4gICAgY29uc3QgaGFuZGxlUmV0cnlOb2RlID0gdXNlQ2FsbGJhY2soXG4gICAgICAgIGFzeW5jIChub2RlOiBDYW52YXNOb2RlRGF0YSwgaW1hZ2VJZD86IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc291cmNlTm9kZSA9IGZpbmRSZXRyeVNvdXJjZU5vZGUobm9kZS5pZCwgbm9kZXNSZWYuY3VycmVudCwgY29ubmVjdGlvbnNSZWYuY3VycmVudCkgfHwgbm9kZTtcbiAgICAgICAgICAgIGNvbnN0IHNhdmVkSW1hZ2VNZXRhZGF0YSA9IG5vZGUudHlwZSA9PT0gQ2FudmFzTm9kZVR5cGUuSW1hZ2UgPyBub2RlLm1ldGFkYXRhIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgY29uc3QgaGFzU2F2ZWRJbWFnZU1ldGFkYXRhID0gQm9vbGVhbihzYXZlZEltYWdlTWV0YWRhdGE/LmdlbmVyYXRpb25UeXBlKTtcbiAgICAgICAgICAgIGNvbnN0IGdlbmVyYXRpb25Db25maWcgPVxuICAgICAgICAgICAgICAgIGhhc1NhdmVkSW1hZ2VNZXRhZGF0YSAmJiBzYXZlZEltYWdlTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmVmZmVjdGl2ZUNvbmZpZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWw6IHNhdmVkSW1hZ2VNZXRhZGF0YS5tb2RlbCB8fCBlZmZlY3RpdmVDb25maWcuaW1hZ2VNb2RlbCB8fCBlZmZlY3RpdmVDb25maWcubW9kZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6IHNhdmVkSW1hZ2VNZXRhZGF0YS5xdWFsaXR5IHx8IGVmZmVjdGl2ZUNvbmZpZy5xdWFsaXR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiBzYXZlZEltYWdlTWV0YWRhdGEuc2l6ZSB8fCBlZmZlY3RpdmVDb25maWcuc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogc2F2ZWRJbWFnZU1ldGFkYXRhLmJhY2tncm91bmQgPz8gZWZmZWN0aXZlQ29uZmlnLmJhY2tncm91bmQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBcIjFcIixcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIDogeyAuLi5idWlsZEdlbmVyYXRpb25Db25maWcoZWZmZWN0aXZlQ29uZmlnLCBzb3VyY2VOb2RlLCBub2RlLnR5cGUgPT09IENhbnZhc05vZGVUeXBlLlRleHQgPyBcInRleHRcIiA6IG5vZGUudHlwZSA9PT0gQ2FudmFzTm9kZVR5cGUuVmlkZW8gPyBcInZpZGVvXCIgOiBub2RlLnR5cGUgPT09IENhbnZhc05vZGVUeXBlLkF1ZGlvID8gXCJhdWRpb1wiIDogXCJpbWFnZVwiKSwgY291bnQ6IFwiMVwiIH07XG4gICAgICAgICAgICBpZiAoIWlzQWlDb25maWdSZWFkeShnZW5lcmF0aW9uQ29uZmlnLCBnZW5lcmF0aW9uQ29uZmlnLm1vZGVsKSkge1xuICAgICAgICAgICAgICAgIG9wZW5Db25maWdEaWFsb2codHJ1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjb250ZXh0ID0gaGFzU2F2ZWRJbWFnZU1ldGFkYXRhID8gbnVsbCA6IGF3YWl0IGh5ZHJhdGVOb2RlR2VuZXJhdGlvbkNvbnRleHQoYnVpbGROb2RlR2VuZXJhdGlvbkNvbnRleHQoc291cmNlTm9kZS5pZCwgbm9kZXNSZWYuY3VycmVudCwgY29ubmVjdGlvbnNSZWYuY3VycmVudCwgc291cmNlTm9kZS5tZXRhZGF0YT8ucHJvbXB0IHx8IG5vZGUubWV0YWRhdGE/LnByb21wdCB8fCBcIlwiKSk7XG4gICAgICAgICAgICBjb25zdCBwcm9tcHQgPSAoc2F2ZWRJbWFnZU1ldGFkYXRhPy5wcm9tcHQgfHwgY29udGV4dD8ucHJvbXB0IHx8IFwiXCIpLnRyaW0oKTtcbiAgICAgICAgICAgIGlmICghcHJvbXB0KSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZS53YXJuaW5nKHQoXCJjYW52YXMucHJvamVjdFBhZ2UucmV0cnlQcm9tcHRNaXNzaW5nXCIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBnZW5lcmF0aW9uVHlwZSA9IHNhdmVkSW1hZ2VNZXRhZGF0YT8uZ2VuZXJhdGlvblR5cGU7XG4gICAgICAgICAgICBjb25zdCB1c2VSZWZlcmVuY2VJbWFnZXMgPSBnZW5lcmF0aW9uVHlwZSA/IGdlbmVyYXRpb25UeXBlID09PSBcImVkaXRcIiA6IEJvb2xlYW4oY29udGV4dD8ucmVmZXJlbmNlSW1hZ2VzLmxlbmd0aCk7XG4gICAgICAgICAgICBjb25zdCByZXRyeVJlZmVyZW5jZUltYWdlcyA9XG4gICAgICAgICAgICAgICAgaGFzU2F2ZWRJbWFnZU1ldGFkYXRhICYmIHNhdmVkSW1hZ2VNZXRhZGF0YSA/IGF3YWl0IHJlc29sdmVNZXRhZGF0YVJlZmVyZW5jZXMoc2F2ZWRJbWFnZU1ldGFkYXRhKSA6IHVzZVJlZmVyZW5jZUltYWdlcyA/IChjb250ZXh0Py5yZWZlcmVuY2VJbWFnZXMubGVuZ3RoID8gY29udGV4dC5yZWZlcmVuY2VJbWFnZXMgOiBzb3VyY2VOb2RlUmVmZXJlbmNlSW1hZ2VzKHNvdXJjZU5vZGUpKSA6IFtdO1xuICAgICAgICAgICAgaWYgKHVzZVJlZmVyZW5jZUltYWdlcyAmJiAhcmV0cnlSZWZlcmVuY2VJbWFnZXMpIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlLmVycm9yKHQoXCJjYW52YXMucHJvamVjdFBhZ2UucmVmZXJlbmNlTWlzc2luZ1wiKSk7XG4gICAgICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+IHByZXYubWFwKChpdGVtKSA9PiAoaXRlbS5pZCA9PT0gbm9kZS5pZCA/IHsgLi4uaXRlbSwgbWV0YWRhdGE6IHsgLi4uaXRlbS5tZXRhZGF0YSwgc3RhdHVzOiBpdGVtLm1ldGFkYXRhPy5jb250ZW50ID8gTk9ERV9TVEFUVVNfU1VDQ0VTUyA6IE5PREVfU1RBVFVTX0VSUk9SLCBlcnJvckRldGFpbHM6IGl0ZW0ubWV0YWRhdGE/LmNvbnRlbnQgPyB1bmRlZmluZWQgOiB0KFwiY2FudmFzLnByb2plY3RQYWdlLnJlZmVyZW5jZU1pc3NpbmdcIiksIGltYWdlczogaXRlbS5tZXRhZGF0YT8uaW1hZ2VzPy5tYXAoKGltYWdlKSA9PiAoaW1hZ2UuaWQgPT09IGltYWdlSWQgPyB7IC4uLmltYWdlLCBzdGF0dXM6IE5PREVfU1RBVFVTX0VSUk9SLCBlcnJvckRldGFpbHM6IHQoXCJjYW52YXMucHJvamVjdFBhZ2UucmVmZXJlbmNlTWlzc2luZ1wiKSB9IDogaW1hZ2UpKSB9IH0gOiBpdGVtKSkpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJldHJ5SW1hZ2VzID0gcmV0cnlSZWZlcmVuY2VJbWFnZXMgfHwgW107XG5cbiAgICAgICAgICAgIHNldFJ1bm5pbmdOb2RlSWQobm9kZS5pZCk7XG4gICAgICAgICAgICBzZXROb2RlcygocHJldikgPT4gcHJldi5tYXAoKGl0ZW0pID0+IChpdGVtLmlkID09PSBub2RlLmlkID8geyAuLi5pdGVtLCBtZXRhZGF0YTogeyAuLi5pdGVtLm1ldGFkYXRhLCBzdGF0dXM6IE5PREVfU1RBVFVTX0xPQURJTkcsIGVycm9yRGV0YWlsczogdW5kZWZpbmVkLCBpbWFnZXM6IGl0ZW0ubWV0YWRhdGE/LmltYWdlcz8ubWFwKChpbWFnZSkgPT4gKGltYWdlLmlkID09PSBpbWFnZUlkID8geyAuLi5pbWFnZSwgc3RhdHVzOiBOT0RFX1NUQVRVU19MT0FESU5HLCBlcnJvckRldGFpbHM6IHVuZGVmaW5lZCB9IDogaW1hZ2UpKSB9IH0gOiBpdGVtKSkpO1xuICAgICAgICAgICAgY29uc3QgY29udHJvbGxlciA9IHN0YXJ0R2VuZXJhdGlvblJlcXVlc3Qobm9kZS5pZCwgc291cmNlTm9kZS5pZCwgbm9kZS5pZCk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gQ2FudmFzTm9kZVR5cGUuVGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWNvbnRleHQpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHN0cmVhbWVkID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYW5zd2VyID0gYXdhaXQgcmVxdWVzdEltYWdlUXVlc3Rpb24oXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0aW9uQ29uZmlnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnVpbGROb2RlUmVzcG9uc2VNZXNzYWdlcyh7IC4uLmNvbnRleHQsIHByb21wdCB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICh0ZXh0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtZWQgPSB0ZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldE5vZGVzKChwcmV2KSA9PiBwcmV2Lm1hcCgoaXRlbSkgPT4gKGl0ZW0uaWQgPT09IG5vZGUuaWQgPyB7IC4uLml0ZW0sIHR5cGU6IENhbnZhc05vZGVUeXBlLlRleHQsIG1ldGFkYXRhOiB7IC4uLml0ZW0ubWV0YWRhdGEsIGNvbnRlbnQ6IHRleHQsIHN0YXR1czogTk9ERV9TVEFUVVNfTE9BRElORyB9IH0gOiBpdGVtKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9LFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBzZXROb2RlcygocHJldikgPT4gcHJldi5tYXAoKGl0ZW0pID0+IChpdGVtLmlkID09PSBub2RlLmlkID8geyAuLi5pdGVtLCB0eXBlOiBDYW52YXNOb2RlVHlwZS5UZXh0LCBtZXRhZGF0YTogeyAuLi5pdGVtLm1ldGFkYXRhLCBjb250ZW50OiBhbnN3ZXIgfHwgc3RyZWFtZWQsIHByb21wdCwgc3RhdHVzOiBOT0RFX1NUQVRVU19TVUNDRVNTIH0gfSA6IGl0ZW0pKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gQ2FudmFzTm9kZVR5cGUuVmlkZW8pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmlkZW8gPSBhd2FpdCBzdG9yZUdlbmVyYXRlZFZpZGVvKGF3YWl0IHJlcXVlc3RWaWRlb0dlbmVyYXRpb24oZ2VuZXJhdGlvbkNvbmZpZywgcHJvbXB0LCByZXRyeUltYWdlcywgeyBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmlkZW9TaXplID0gZml0Tm9kZVNpemUodmlkZW8ud2lkdGggfHwgbm9kZS53aWR0aCwgdmlkZW8uaGVpZ2h0IHx8IG5vZGUuaGVpZ2h0LCBWSURFT19OT0RFX01BWF9XSURUSCwgVklERU9fTk9ERV9NQVhfSEVJR0hUKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2Lm1hcCgoaXRlbSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmlkID09PSBub2RlLmlkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5pdGVtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogdmlkZW9TaXplLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHZpZGVvU2l6ZS5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IHg6IGl0ZW0ucG9zaXRpb24ueCArIGl0ZW0ud2lkdGggLyAyIC0gdmlkZW9TaXplLndpZHRoIC8gMiwgeTogaXRlbS5wb3NpdGlvbi55ICsgaXRlbS5oZWlnaHQgLyAyIC0gdmlkZW9TaXplLmhlaWdodCAvIDIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLml0ZW0ubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi52aWRlb01ldGFkYXRhKHZpZGVvKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21wdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBnZW5lcmF0aW9uQ29uZmlnLm1vZGVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogZ2VuZXJhdGlvbkNvbmZpZy5zaXplLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Vjb25kczogZ2VuZXJhdGlvbkNvbmZpZy52aWRlb1NlY29uZHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2cXVhbGl0eTogZ2VuZXJhdGlvbkNvbmZpZy52cXVhbGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlQXVkaW86IGdlbmVyYXRpb25Db25maWcudmlkZW9HZW5lcmF0ZUF1ZGlvLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2F0ZXJtYXJrOiBnZW5lcmF0aW9uQ29uZmlnLnZpZGVvV2F0ZXJtYXJrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBpdGVtLFxuICAgICAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm9kZS50eXBlID09PSBDYW52YXNOb2RlVHlwZS5BdWRpbykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdWRpbyA9IGF3YWl0IHN0b3JlR2VuZXJhdGVkQXVkaW8oYXdhaXQgcmVxdWVzdEF1ZGlvR2VuZXJhdGlvbihnZW5lcmF0aW9uQ29uZmlnLCBwcm9tcHQsIHsgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KSwgZ2VuZXJhdGlvbkNvbmZpZy5hdWRpb0Zvcm1hdCk7XG4gICAgICAgICAgICAgICAgICAgIHNldE5vZGVzKChwcmV2KSA9PiBwcmV2Lm1hcCgoaXRlbSkgPT4gKGl0ZW0uaWQgPT09IG5vZGUuaWQgPyB7IC4uLml0ZW0sIG1ldGFkYXRhOiB7IC4uLml0ZW0ubWV0YWRhdGEsIC4uLmF1ZGlvTWV0YWRhdGEoYXVkaW8pLCBwcm9tcHQsIC4uLmJ1aWxkQXVkaW9HZW5lcmF0aW9uTWV0YWRhdGEoZ2VuZXJhdGlvbkNvbmZpZykgfSB9IDogaXRlbSkpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlID0gdXNlUmVmZXJlbmNlSW1hZ2VzXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgcmVxdWVzdEVkaXQoZ2VuZXJhdGlvbkNvbmZpZywgcHJvbXB0LCByZXRyeUltYWdlcywgdW5kZWZpbmVkLCB7IHNpZ25hbDogY29udHJvbGxlci5zaWduYWwgfSkudGhlbigoaXRlbXMpID0+IGl0ZW1zWzBdKVxuICAgICAgICAgICAgICAgICAgICA6IGF3YWl0IHJlcXVlc3RHZW5lcmF0aW9uKGdlbmVyYXRpb25Db25maWcsIHByb21wdCwgeyBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsIH0pLnRoZW4oKGl0ZW1zKSA9PiBpdGVtc1swXSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXBsb2FkZWRJbWFnZSA9IGF3YWl0IHVwbG9hZEltYWdlKGltYWdlLmRhdGFVcmwsIHsgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbWFnZUNvbmZpZyA9IE5PREVfREVGQVVMVF9TSVpFW0NhbnZhc05vZGVUeXBlLkltYWdlXTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXRyeUltYWdlOiBDYW52YXNOb2RlSW1hZ2UgPSB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBpbWFnZUlkIHx8IG5vZGUubWV0YWRhdGE/LnByaW1hcnlJbWFnZUlkIHx8IG5hbm9pZCgpLFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IE5PREVfU1RBVFVTX1NVQ0NFU1MsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHVwbG9hZGVkSW1hZ2UudXJsLFxuICAgICAgICAgICAgICAgICAgICBzdG9yYWdlS2V5OiB1cGxvYWRlZEltYWdlLnN0b3JhZ2VLZXksXG4gICAgICAgICAgICAgICAgICAgIG5hdHVyYWxXaWR0aDogdXBsb2FkZWRJbWFnZS53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgbmF0dXJhbEhlaWdodDogdXBsb2FkZWRJbWFnZS5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIGJ5dGVzOiB1cGxvYWRlZEltYWdlLmJ5dGVzLFxuICAgICAgICAgICAgICAgICAgICBtaW1lVHlwZTogdXBsb2FkZWRJbWFnZS5taW1lVHlwZSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGNvbnN0IGdlbmVyYXRpb25NZXRhZGF0YSA9IHNhdmVkSW1hZ2VNZXRhZGF0YT8uZ2VuZXJhdGlvblR5cGVcbiAgICAgICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVyYXRpb25UeXBlOiBzYXZlZEltYWdlTWV0YWRhdGEuZ2VuZXJhdGlvblR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBnZW5lcmF0aW9uQ29uZmlnLm1vZGVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiBnZW5lcmF0aW9uQ29uZmlnLnNpemUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6IGdlbmVyYXRpb25Db25maWcucXVhbGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uKGdlbmVyYXRpb25Db25maWcuYmFja2dyb3VuZCA/IHsgYmFja2dyb3VuZDogZ2VuZXJhdGlvbkNvbmZpZy5iYWNrZ3JvdW5kIH0gOiB7fSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBzYXZlZEltYWdlTWV0YWRhdGEuY291bnQgfHwgMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNlczogc2F2ZWRJbWFnZU1ldGFkYXRhLnJlZmVyZW5jZXMsXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICA6IGJ1aWxkSW1hZ2VHZW5lcmF0aW9uTWV0YWRhdGEodXNlUmVmZXJlbmNlSW1hZ2VzID8gXCJlZGl0XCIgOiBcImdlbmVyYXRpb25cIiwgZ2VuZXJhdGlvbkNvbmZpZywgMSwgcmV0cnlJbWFnZXMpO1xuICAgICAgICAgICAgICAgIHNldE5vZGVzKChwcmV2KSA9PlxuICAgICAgICAgICAgICAgICAgICBwcmV2Lm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uaWQgIT09IG5vZGUuaWQpIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWFrZVByaW1hcnkgPSAhaW1hZ2VJZCB8fCAhaXRlbS5tZXRhZGF0YT8uY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVkZ2UgPSBpbWFnZUlkID8gTWF0aC5tYXgoaXRlbS53aWR0aCwgaXRlbS5oZWlnaHQpIDogMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlU2l6ZSA9IGltYWdlSWQgJiYgaXRlbS5tZXRhZGF0YT8uZnJlZVJlc2l6ZSA/IHsgd2lkdGg6IGl0ZW0ud2lkdGgsIGhlaWdodDogaXRlbS5oZWlnaHQgfSA6IGltYWdlSWQgPyBmaXROb2RlU2l6ZSh1cGxvYWRlZEltYWdlLndpZHRoLCB1cGxvYWRlZEltYWdlLmhlaWdodCwgZWRnZSwgZWRnZSkgOiBmaXROb2RlU2l6ZSh1cGxvYWRlZEltYWdlLndpZHRoLCB1cGxvYWRlZEltYWdlLmhlaWdodCwgaW1hZ2VDb25maWcud2lkdGgsIGltYWdlQ29uZmlnLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLml0ZW0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogQ2FudmFzTm9kZVR5cGUuSW1hZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uKG1ha2VQcmltYXJ5ID8geyB3aWR0aDogaW1hZ2VTaXplLndpZHRoLCBoZWlnaHQ6IGltYWdlU2l6ZS5oZWlnaHQsIC4uLihpbWFnZUlkID8geyBwb3NpdGlvbjogeyB4OiBpdGVtLnBvc2l0aW9uLnggKyBpdGVtLndpZHRoIC8gMiAtIGltYWdlU2l6ZS53aWR0aCAvIDIsIHk6IGl0ZW0ucG9zaXRpb24ueSArIGl0ZW0uaGVpZ2h0IC8gMiAtIGltYWdlU2l6ZS5oZWlnaHQgLyAyIH0gfSA6IHt9KSB9IDoge30pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLml0ZW0ubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLihtYWtlUHJpbWFyeSA/IGltYWdlTWV0YWRhdGEodXBsb2FkZWRJbWFnZSkgOiB7IHN0YXR1czogTk9ERV9TVEFUVVNfU1VDQ0VTUyB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2VzOiBpdGVtLm1ldGFkYXRhPy5pbWFnZXM/Lm1hcCgoY3VycmVudCkgPT4gKGN1cnJlbnQuaWQgPT09IHJldHJ5SW1hZ2UuaWQgPyByZXRyeUltYWdlIDogY3VycmVudCkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmltYXJ5SW1hZ2VJZDogbWFrZVByaW1hcnkgPyByZXRyeUltYWdlLmlkIDogaXRlbS5tZXRhZGF0YT8ucHJpbWFyeUltYWdlSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21wdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uZ2VuZXJhdGlvbk1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNHZW5lcmF0aW9uQ2FuY2VsZWQoZXJyb3IpKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyb3JEZXRhaWxzID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiB0KFwiY2FudmFzLnByb2plY3RQYWdlLmdlbmVyYXRpb25GYWlsZWRcIik7XG4gICAgICAgICAgICAgICAgbWVzc2FnZS5lcnJvcihlcnJvckRldGFpbHMpO1xuICAgICAgICAgICAgICAgIHNldE5vZGVzKChwcmV2KSA9PiBwcmV2Lm1hcCgoaXRlbSkgPT4gKGl0ZW0uaWQgPT09IG5vZGUuaWQgPyB7IC4uLml0ZW0sIG1ldGFkYXRhOiB7IC4uLml0ZW0ubWV0YWRhdGEsIHN0YXR1czogaXRlbS5tZXRhZGF0YT8uY29udGVudCA/IE5PREVfU1RBVFVTX1NVQ0NFU1MgOiBOT0RFX1NUQVRVU19FUlJPUiwgZXJyb3JEZXRhaWxzOiBpdGVtLm1ldGFkYXRhPy5jb250ZW50ID8gdW5kZWZpbmVkIDogZXJyb3JEZXRhaWxzLCBpbWFnZXM6IGl0ZW0ubWV0YWRhdGE/LmltYWdlcz8ubWFwKChpbWFnZSkgPT4gKGltYWdlLmlkID09PSBpbWFnZUlkID8geyAuLi5pbWFnZSwgc3RhdHVzOiBOT0RFX1NUQVRVU19FUlJPUiwgZXJyb3JEZXRhaWxzIH0gOiBpbWFnZSkpIH0gfSA6IGl0ZW0pKSk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGZpbmlzaEdlbmVyYXRpb25SZXF1ZXN0KG5vZGUuaWQsIGNvbnRyb2xsZXIpO1xuICAgICAgICAgICAgICAgIHNldFJ1bm5pbmdOb2RlSWQobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFtlZmZlY3RpdmVDb25maWcsIGZpbmlzaEdlbmVyYXRpb25SZXF1ZXN0LCBpc0FpQ29uZmlnUmVhZHksIG1lc3NhZ2UsIG9wZW5Db25maWdEaWFsb2csIHN0YXJ0R2VuZXJhdGlvblJlcXVlc3QsIHRdLFxuICAgICk7XG5cbiAgICBjb25zdCBkZWxldGVCYXRjaEltYWdlID0gdXNlQ2FsbGJhY2soKG5vZGVJZDogc3RyaW5nLCBpbWFnZUlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzUmVmLmN1cnJlbnQuZmluZCgoaXRlbSkgPT4gaXRlbS5pZCA9PT0gbm9kZUlkKTtcbiAgICAgICAgaWYgKChub2RlPy5tZXRhZGF0YT8uaW1hZ2VzPy5sZW5ndGggfHwgMCkgPD0gMikgc2V0RXhwYW5kZWRCYXRjaE5vZGVJZHMoKGN1cnJlbnQpID0+IG5ldyBTZXQoWy4uLmN1cnJlbnRdLmZpbHRlcigoaWQpID0+IGlkICE9PSBub2RlSWQpKSk7XG4gICAgICAgIHNldE5vZGVzKChwcmV2KSA9PlxuICAgICAgICAgICAgcHJldi5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5pZCAhPT0gbm9kZUlkKSByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbWFnZXMgPSBpdGVtLm1ldGFkYXRhPy5pbWFnZXM/LmZpbHRlcigoaW1hZ2UpID0+IGltYWdlLmlkICE9PSBpbWFnZUlkKSB8fCBbXTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyAuLi5pdGVtLCBtZXRhZGF0YTogeyAuLi5pdGVtLm1ldGFkYXRhLCBpbWFnZXMsIGNvdW50OiBpbWFnZXMubGVuZ3RoLCBwcmltYXJ5SW1hZ2VJZDogaXRlbS5tZXRhZGF0YT8ucHJpbWFyeUltYWdlSWQgPT09IGltYWdlSWQgPyBpbWFnZXNbMF0/LmlkIDogaXRlbS5tZXRhZGF0YT8ucHJpbWFyeUltYWdlSWQgfSB9O1xuICAgICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgfSwgW10pO1xuXG4gICAgY29uc3QgcmV0cnlCYXRjaEltYWdlID0gdXNlQ2FsbGJhY2soKG5vZGU6IENhbnZhc05vZGVEYXRhLCBpbWFnZUlkOiBzdHJpbmcpID0+IHZvaWQgaGFuZGxlUmV0cnlOb2RlKG5vZGUsIGltYWdlSWQpLCBbaGFuZGxlUmV0cnlOb2RlXSk7XG5cbiAgICBjb25zdCBnZW5lcmF0ZUltYWdlRnJvbVRleHROb2RlID0gdXNlQ2FsbGJhY2soXG4gICAgICAgIChub2RlOiBDYW52YXNOb2RlRGF0YSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvbXB0ID0gKG5vZGUubWV0YWRhdGE/LmNvbnRlbnQgfHwgbm9kZS5tZXRhZGF0YT8ucHJvbXB0IHx8IFwiXCIpLnRyaW0oKTtcbiAgICAgICAgICAgIGlmICghcHJvbXB0KSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZS53YXJuaW5nKHQoXCJjYW52YXMucHJvamVjdFBhZ2UuZW1wdHlUZXh0SW1hZ2VcIikpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZU5vZGUgPSBub2Rlc1JlZi5jdXJyZW50LmZpbmQoKGl0ZW0pID0+IGl0ZW0uaWQgPT09IG5vZGUuaWQpO1xuICAgICAgICAgICAgaWYgKCFzb3VyY2VOb2RlKSByZXR1cm47XG4gICAgICAgICAgICBjb25zdCBub2RlU2l6ZSA9IGdldE5vZGVTcGVjKENhbnZhc05vZGVUeXBlLkNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBjb25maWdOb2RlID0gY3JlYXRlQ2FudmFzTm9kZShcbiAgICAgICAgICAgICAgICBDYW52YXNOb2RlVHlwZS5Db25maWcsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB4OiBzb3VyY2VOb2RlLnBvc2l0aW9uLnggKyBzb3VyY2VOb2RlLndpZHRoICsgOTYgKyBub2RlU2l6ZS53aWR0aCAvIDIsXG4gICAgICAgICAgICAgICAgICAgIHk6IHNvdXJjZU5vZGUucG9zaXRpb24ueSArIHNvdXJjZU5vZGUuaGVpZ2h0IC8gMixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBtb2RlbDogZWZmZWN0aXZlQ29uZmlnLmltYWdlTW9kZWwgfHwgZWZmZWN0aXZlQ29uZmlnLm1vZGVsLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiBlZmZlY3RpdmVDb25maWcuc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgY291bnQ6IGdldEdlbmVyYXRpb25Db3VudChlZmZlY3RpdmVDb25maWcuY2FudmFzSW1hZ2VDb3VudCB8fCBlZmZlY3RpdmVDb25maWcuY291bnQpLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3QgY29ubmVjdGlvbiA9IHsgaWQ6IG5hbm9pZCgpLCBmcm9tTm9kZUlkOiBzb3VyY2VOb2RlLmlkLCB0b05vZGVJZDogY29uZmlnTm9kZS5pZCB9O1xuICAgICAgICAgICAgY29uc3QgbmV4dE5vZGVzID0gbm9kZXNSZWYuY3VycmVudC5tYXAoKGl0ZW0pID0+IChpdGVtLmlkID09PSBzb3VyY2VOb2RlLmlkID8geyAuLi5pdGVtLCBtZXRhZGF0YTogeyAuLi5pdGVtLm1ldGFkYXRhLCBjb250ZW50OiBwcm9tcHQsIHByb21wdCwgc3RhdHVzOiBOT0RFX1NUQVRVU19TVUNDRVNTIH0gfSA6IGl0ZW0pKS5jb25jYXQoY29uZmlnTm9kZSk7XG4gICAgICAgICAgICBjb25zdCBuZXh0Q29ubmVjdGlvbnMgPSBbLi4uY29ubmVjdGlvbnNSZWYuY3VycmVudCwgY29ubmVjdGlvbl07XG4gICAgICAgICAgICBub2Rlc1JlZi5jdXJyZW50ID0gbmV4dE5vZGVzO1xuICAgICAgICAgICAgY29ubmVjdGlvbnNSZWYuY3VycmVudCA9IG5leHRDb25uZWN0aW9ucztcbiAgICAgICAgICAgIHNldE5vZGVzKG5leHROb2Rlcyk7XG4gICAgICAgICAgICBzZXRDb25uZWN0aW9ucyhuZXh0Q29ubmVjdGlvbnMpO1xuICAgICAgICAgICAgc2V0U2VsZWN0ZWROb2RlSWRzKG5ldyBTZXQoW2NvbmZpZ05vZGUuaWRdKSk7XG4gICAgICAgICAgICBzZXRTZWxlY3RlZENvbm5lY3Rpb25JZChudWxsKTtcbiAgICAgICAgICAgIHNldERpYWxvZ05vZGVJZChjb25maWdOb2RlLmlkKTtcbiAgICAgICAgfSxcbiAgICAgICAgW2VmZmVjdGl2ZUNvbmZpZy5jYW52YXNJbWFnZUNvdW50LCBlZmZlY3RpdmVDb25maWcuY291bnQsIGVmZmVjdGl2ZUNvbmZpZy5pbWFnZU1vZGVsLCBlZmZlY3RpdmVDb25maWcubW9kZWwsIGVmZmVjdGl2ZUNvbmZpZy5zaXplLCBtZXNzYWdlLCB0XSxcbiAgICApO1xuXG4gICAgY29uc3QgaW5zZXJ0QXNzaXN0YW50SW1hZ2UgPSB1c2VDYWxsYmFjayhcbiAgICAgICAgYXN5bmMgKGltYWdlOiBDYW52YXNBc3Npc3RhbnRJbWFnZSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3RvcmVkSW1hZ2UgPSBpbWFnZS5zdG9yYWdlS2V5ID8geyB1cmw6IGltYWdlLmRhdGFVcmwsIHN0b3JhZ2VLZXk6IGltYWdlLnN0b3JhZ2VLZXksIHdpZHRoOiAxLCBoZWlnaHQ6IDEsIGJ5dGVzOiAwLCBtaW1lVHlwZTogXCJpbWFnZS9wbmdcIiB9IDogYXdhaXQgdXBsb2FkSW1hZ2UoaW1hZ2UuZGF0YVVybCk7XG4gICAgICAgICAgICBjb25zdCBtZXRhID0gc3RvcmVkSW1hZ2Uud2lkdGggPT09IDEgJiYgc3RvcmVkSW1hZ2UuaGVpZ2h0ID09PSAxID8gYXdhaXQgcmVhZEltYWdlTWV0YShzdG9yZWRJbWFnZS51cmwpIDogc3RvcmVkSW1hZ2U7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSBmaXROb2RlU2l6ZShtZXRhLndpZHRoLCBtZXRhLmhlaWdodCk7XG4gICAgICAgICAgICBjb25zdCBjZW50ZXIgPSBzY3JlZW5Ub0NhbnZhcygoY29udGFpbmVyUmVmLmN1cnJlbnQ/LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgfHwgMCkgKyBzaXplLndpZHRoIC8gMiwgKGNvbnRhaW5lclJlZi5jdXJyZW50Py5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgfHwgMCkgKyBzaXplLmhlaWdodCAvIDIpO1xuICAgICAgICAgICAgY29uc3QgaWQgPSBgaW1hZ2UtJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDcpfWA7XG4gICAgICAgICAgICBjb25zdCBub2RlOiBDYW52YXNOb2RlRGF0YSA9IHtcbiAgICAgICAgICAgICAgICBpZCxcbiAgICAgICAgICAgICAgICB0eXBlOiBDYW52YXNOb2RlVHlwZS5JbWFnZSxcbiAgICAgICAgICAgICAgICB0aXRsZTogaW1hZ2UucHJvbXB0LnNsaWNlKDAsIDMyKSB8fCBcIkdlbmVyYXRlZCBJbWFnZVwiLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IHg6IGNlbnRlci54IC0gY29uZmlnLndpZHRoIC8gMiwgeTogY2VudGVyLnkgLSBjb25maWcuaGVpZ2h0IC8gMiB9LFxuICAgICAgICAgICAgICAgIHdpZHRoOiBjb25maWcud2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBjb25maWcuaGVpZ2h0LFxuICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7IC4uLmltYWdlTWV0YWRhdGEoeyAuLi5zdG9yZWRJbWFnZSwgd2lkdGg6IG1ldGEud2lkdGgsIGhlaWdodDogbWV0YS5oZWlnaHQgfSksIHByb21wdDogaW1hZ2UucHJvbXB0IH0sXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXROb2RlcygocHJldikgPT4gWy4uLnByZXYsIG5vZGVdKTtcbiAgICAgICAgICAgIHNldFNlbGVjdGVkTm9kZUlkcyhuZXcgU2V0KFtpZF0pKTtcbiAgICAgICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKG51bGwpO1xuICAgICAgICAgICAgc2V0RGlhbG9nTm9kZUlkKGlkKTtcbiAgICAgICAgfSxcbiAgICAgICAgW3NjcmVlblRvQ2FudmFzLCBzaXplLmhlaWdodCwgc2l6ZS53aWR0aF0sXG4gICAgKTtcblxuICAgIGNvbnN0IGluc2VydEFzc2lzdGFudFRleHQgPSB1c2VDYWxsYmFjayhcbiAgICAgICAgKHRleHQ6IHN0cmluZywgdGl0bGU/OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNlbnRlciA9IHNjcmVlblRvQ2FudmFzKChjb250YWluZXJSZWYuY3VycmVudD8uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCB8fCAwKSArIHNpemUud2lkdGggLyAyLCAoY29udGFpbmVyUmVmLmN1cnJlbnQ/LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCB8fCAwKSArIHNpemUuaGVpZ2h0IC8gMik7XG4gICAgICAgICAgICBjb25zdCBub2RlID0ge1xuICAgICAgICAgICAgICAgIC4uLmNyZWF0ZUNhbnZhc05vZGUoQ2FudmFzTm9kZVR5cGUuVGV4dCwgY2VudGVyLCB7IGNvbnRlbnQ6IHRleHQsIHN0YXR1czogTk9ERV9TVEFUVVNfU1VDQ0VTUyB9KSxcbiAgICAgICAgICAgICAgICB0aXRsZTogdGl0bGUgfHwgdGV4dC5zbGljZSgwLCAzMikgfHwgXCJBc3Npc3RhbnQgVGV4dFwiLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+IFsuLi5wcmV2LCBub2RlXSk7XG4gICAgICAgICAgICBzZXRTZWxlY3RlZE5vZGVJZHMobmV3IFNldChbbm9kZS5pZF0pKTtcbiAgICAgICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKG51bGwpO1xuICAgICAgICB9LFxuICAgICAgICBbc2NyZWVuVG9DYW52YXMsIHNpemUuaGVpZ2h0LCBzaXplLndpZHRoXSxcbiAgICApO1xuXG4gICAgY29uc3QgaGFuZGxlQXNzZXRJbnNlcnQgPSB1c2VDYWxsYmFjayhcbiAgICAgICAgKHBheWxvYWQ6IEluc2VydEFzc2V0UGF5bG9hZCkgPT4ge1xuICAgICAgICAgICAgaWYgKHBheWxvYWQua2luZCA9PT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgICAgICAgICBpbnNlcnRBc3Npc3RhbnRUZXh0KHBheWxvYWQuY29udGVudCwgcGF5bG9hZC50aXRsZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHBheWxvYWQua2luZCA9PT0gXCJ2aWRlb1wiKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3BlYyA9IE5PREVfREVGQVVMVF9TSVpFW0NhbnZhc05vZGVUeXBlLlZpZGVvXTtcbiAgICAgICAgICAgICAgICBjb25zdCBjZW50ZXIgPSBzY3JlZW5Ub0NhbnZhcygoY29udGFpbmVyUmVmLmN1cnJlbnQ/LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgfHwgMCkgKyBzaXplLndpZHRoIC8gMiwgKGNvbnRhaW5lclJlZi5jdXJyZW50Py5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgfHwgMCkgKyBzaXplLmhlaWdodCAvIDIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlkID0gYHZpZGVvLSR7RGF0ZS5ub3coKX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA3KX1gO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHRTaXplID0gZml0Tm9kZVNpemUocGF5bG9hZC53aWR0aCB8fCBzcGVjLndpZHRoLCBwYXlsb2FkLmhlaWdodCB8fCBzcGVjLmhlaWdodCwgVklERU9fTk9ERV9NQVhfV0lEVEgsIFZJREVPX05PREVfTUFYX0hFSUdIVCk7XG4gICAgICAgICAgICAgICAgc2V0Tm9kZXMoKHByZXYpID0+IFtcbiAgICAgICAgICAgICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBDYW52YXNOb2RlVHlwZS5WaWRlbyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBwYXlsb2FkLnRpdGxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHsgeDogY2VudGVyLnggLSBuZXh0U2l6ZS53aWR0aCAvIDIsIHk6IGNlbnRlci55IC0gbmV4dFNpemUuaGVpZ2h0IC8gMiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IG5leHRTaXplLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBuZXh0U2l6ZS5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YTogeyBjb250ZW50OiBwYXlsb2FkLnVybCwgc3RvcmFnZUtleTogcGF5bG9hZC5zdG9yYWdlS2V5LCBzdGF0dXM6IE5PREVfU1RBVFVTX1NVQ0NFU1MsIG5hdHVyYWxXaWR0aDogcGF5bG9hZC53aWR0aCwgbmF0dXJhbEhlaWdodDogcGF5bG9hZC5oZWlnaHQgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZE5vZGVJZHMobmV3IFNldChbaWRdKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGluc2VydEFzc2lzdGFudEltYWdlKHsgaWQ6IGBhc3NldC0ke0RhdGUubm93KCl9YCwgcHJvbXB0OiBwYXlsb2FkLnRpdGxlLCBkYXRhVXJsOiBwYXlsb2FkLmRhdGFVcmwsIHN0b3JhZ2VLZXk6IHBheWxvYWQuc3RvcmFnZUtleSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNldEFzc2V0UGlja2VyT3BlbihmYWxzZSk7XG4gICAgICAgIH0sXG4gICAgICAgIFtpbnNlcnRBc3Npc3RhbnRJbWFnZSwgaW5zZXJ0QXNzaXN0YW50VGV4dCwgc2NyZWVuVG9DYW52YXMsIHNpemUuaGVpZ2h0LCBzaXplLndpZHRoXSxcbiAgICApO1xuXG4gICAgLy8gTWVtb2l6ZSBldmVyeSBjYWxsYmFjayBhbmQgcmVuZGVyIGZ1bmN0aW9uIHBhc3NlZCB0byBDYW52YXNOb2RlLlxuICAgIC8vIENhbnZhc05vZGUgdXNlcyBSZWFjdC5tZW1vLCBidXQgbmV3IHByb3AgcmVmZXJlbmNlcyB3b3VsZCBpbnZhbGlkYXRlIGl0IG9uIGV2ZXJ5IHJlbmRlciBhbmQgcmVyZW5kZXIgZXZlcnkgbm9kZVxuICAgIC8vIGR1cmluZyBjbGljaywgaG92ZXIsIG9yIHZpZXdwb3J0IGNoYW5nZXMsIHdoaWNoIGlzIGVzcGVjaWFsbHkgZXhwZW5zaXZlIGZvciBNYXJrZG93bi4gVGhlc2UgdXNlQ2FsbGJhY2sgdmFsdWVzXG4gICAgLy8gYW5kIHRoZWlyIG1lbW9pemVkIG1hcC9oYW5kbGVyIGRlcGVuZGVuY2llcyByZW1haW4gc3RhYmxlIGR1cmluZyBpbnRlcmFjdGlvbiwgc28gdW5jaGFuZ2VkIG5vZGVzIGRvIG5vdCByZXJlbmRlci5cbiAgICBjb25zdCBoYW5kbGVOb2RlSG92ZXJTdGFydCA9IHVzZUNhbGxiYWNrKChub2RlSWQ6IHN0cmluZykgPT4ge1xuICAgICAgICBpZiAobm9kZURyYWdnaW5nUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgc2V0SG92ZXJlZE5vZGVJZChub2RlSWQpO1xuICAgIH0sIFtdKTtcbiAgICBjb25zdCBoYW5kbGVOb2RlSG92ZXJFbmQgPSB1c2VDYWxsYmFjaygobm9kZUlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgc2V0SG92ZXJlZE5vZGVJZCgoY3VycmVudCkgPT4gKGN1cnJlbnQgPT09IG5vZGVJZCA/IG51bGwgOiBjdXJyZW50KSk7XG4gICAgfSwgW10pO1xuICAgIGNvbnN0IGhhbmRsZU5vZGVWaWV3SW1hZ2UgPSB1c2VDYWxsYmFjaygobm9kZTogQ2FudmFzTm9kZURhdGEsIGltYWdlSWQ/OiBzdHJpbmcpID0+IHtcbiAgICAgICAgc2V0UHJldmlld05vZGVJZChub2RlLmlkKTtcbiAgICAgICAgc2V0UHJldmlld0ltYWdlSWQoaW1hZ2VJZCB8fCBudWxsKTtcbiAgICB9LCBbXSk7XG4gICAgY29uc3QgaGFuZGxlTm9kZVJldHJ5ID0gdXNlQ2FsbGJhY2soXG4gICAgICAgIChub2RlOiBDYW52YXNOb2RlRGF0YSkgPT4ge1xuICAgICAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gQ2FudmFzTm9kZVR5cGUuVGV4dCAmJiAobm9kZS5tZXRhZGF0YT8udGV4dENvdW50IHx8IDEpID4gMSkge1xuICAgICAgICAgICAgICAgIHZvaWQgZ2VuZXJhdGVOb2RlUmVmLmN1cnJlbnQ/Lihub2RlLmlkLCBcInRleHRcIiwgbm9kZS5tZXRhZGF0YT8ucHJvbXB0IHx8IFwiXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZvaWQgaGFuZGxlUmV0cnlOb2RlKG5vZGUpO1xuICAgICAgICB9LFxuICAgICAgICBbaGFuZGxlUmV0cnlOb2RlXSxcbiAgICApO1xuICAgIGNvbnN0IGhhbmRsZU5vZGVDb250ZXh0TWVudSA9IHVzZUNhbGxiYWNrKChldmVudDogUmVhY3RNb3VzZUV2ZW50LCBub2RlSWQ6IHN0cmluZykgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgc2V0Q29udGV4dE1lbnUoeyB0eXBlOiBcIm5vZGVcIiwgeDogZXZlbnQuY2xpZW50WCwgeTogZXZlbnQuY2xpZW50WSwgbm9kZUlkIH0pO1xuICAgIH0sIFtdKTtcblxuICAgIGNvbnN0IHJlbmRlck5vZGVQYW5lbCA9IHVzZUNhbGxiYWNrKFxuICAgICAgICAocGFuZWxOb2RlOiBDYW52YXNOb2RlRGF0YSkgPT5cbiAgICAgICAgICAgIGdldE5vZGVEZWZpbml0aW9uKHBhbmVsTm9kZS50eXBlKT8uUGFuZWwgPyAoXG4gICAgICAgICAgICAgICAgcmVuZGVyUGx1Z2luUGFuZWwocGFuZWxOb2RlKVxuICAgICAgICAgICAgKSA6IHBhbmVsTm9kZS50eXBlID09PSBDYW52YXNOb2RlVHlwZS5Db25maWcgPyAoXG4gICAgICAgICAgICAgICAgPENhbnZhc0NvbmZpZ0NvbXBvc2VyXG4gICAgICAgICAgICAgICAgICAgIG5vZGVJZD17cGFuZWxOb2RlLmlkfVxuICAgICAgICAgICAgICAgICAgICBub2Rlcz17bm9kZXN9XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtwYW5lbE5vZGUubWV0YWRhdGE/LmNvbXBvc2VyQ29udGVudCA/PyBwYW5lbE5vZGUubWV0YWRhdGE/LnByb21wdCA/PyBcIlwifVxuICAgICAgICAgICAgICAgICAgICBpbnB1dHM9e2NvbmZpZ0lucHV0c0J5SWQuZ2V0KHBhbmVsTm9kZS5pZCkgfHwgW119XG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3RlZE5vZGVzPXtjb25uZWN0ZWROb2Rlc0J5Tm9kZUlkLmdldChwYW5lbE5vZGUuaWQpIHx8IFtdfVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGNvbXBvc2VyQ29udGVudCkgPT4gaGFuZGxlQ29uZmlnTm9kZUNoYW5nZShwYW5lbE5vZGUuaWQsIHsgY29tcG9zZXJDb250ZW50IH0pfVxuICAgICAgICAgICAgICAgICAgICBvbkNsb3NlPXsoKSA9PiBzZXREaWFsb2dOb2RlSWQobnVsbCl9XG4gICAgICAgICAgICAgICAgICAgIG9uRGlzY29ubmVjdFJlZmVyZW5jZT17ZGlzY29ubmVjdE5vZGVSZWZlcmVuY2V9XG4gICAgICAgICAgICAgICAgICAgIG9uU3RhcnRSZWZlcmVuY2VTZWxlY3Rpb249e3N0YXJ0Tm9kZVJlZmVyZW5jZVNlbGVjdGlvbn1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICA8Q2FudmFzTm9kZVByb21wdFBhbmVsXG4gICAgICAgICAgICAgICAgICAgIG5vZGU9e3BhbmVsTm9kZX1cbiAgICAgICAgICAgICAgICAgICAgbm9kZXM9e25vZGVzfVxuICAgICAgICAgICAgICAgICAgICBpc1J1bm5pbmc9e3J1bm5pbmdOb2RlSWQgPT09IHBhbmVsTm9kZS5pZH1cbiAgICAgICAgICAgICAgICAgICAgbWVudGlvblJlZmVyZW5jZXM9e21lbnRpb25SZWZlcmVuY2VzQnlOb2RlSWQuZ2V0KHBhbmVsTm9kZS5pZCkgfHwgRU1QVFlfUkVGRVJFTkNFU31cbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGVkTm9kZXM9e2Nvbm5lY3RlZE5vZGVzQnlOb2RlSWQuZ2V0KHBhbmVsTm9kZS5pZCkgfHwgW119XG4gICAgICAgICAgICAgICAgICAgIG9uUHJvbXB0Q2hhbmdlPXtoYW5kbGVOb2RlUHJvbXB0Q2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICBvbkNvbmZpZ0NoYW5nZT17aGFuZGxlQ29uZmlnTm9kZUNoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgb25HZW5lcmF0ZT17aGFuZGxlR2VuZXJhdGVOb2RlfVxuICAgICAgICAgICAgICAgICAgICBvblN0b3A9e2NvbmZpcm1TdG9wR2VuZXJhdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgb25EaXNjb25uZWN0UmVmZXJlbmNlPXtkaXNjb25uZWN0Tm9kZVJlZmVyZW5jZX1cbiAgICAgICAgICAgICAgICAgICAgb25TdGFydFJlZmVyZW5jZVNlbGVjdGlvbj17c3RhcnROb2RlUmVmZXJlbmNlU2VsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBtb2RlT3ZlcnJpZGU9e2dldE5vZGVEZWZpbml0aW9uKHBhbmVsTm9kZS50eXBlKT8udXNlQnVpbHRpblBhbmVsPy5tb2RlfVxuICAgICAgICAgICAgICAgICAgICBvbkltYWdlU2V0dGluZ3NPcGVuQ2hhbmdlPXsob3BlbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Tm9kZUltYWdlU2V0dGluZ3NPcGVuKG9wZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wZW4pIHNldFRvb2xiYXJOb2RlSWQobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICksXG4gICAgICAgIFtjb25maWdJbnB1dHNCeUlkLCBjb25maXJtU3RvcEdlbmVyYXRpb24sIGNvbm5lY3RlZE5vZGVzQnlOb2RlSWQsIGRpc2Nvbm5lY3ROb2RlUmVmZXJlbmNlLCBoYW5kbGVDb25maWdOb2RlQ2hhbmdlLCBoYW5kbGVHZW5lcmF0ZU5vZGUsIGhhbmRsZU5vZGVQcm9tcHRDaGFuZ2UsIG1lbnRpb25SZWZlcmVuY2VzQnlOb2RlSWQsIG5vZGVzLCByZW5kZXJQbHVnaW5QYW5lbCwgcnVubmluZ05vZGVJZCwgc3RhcnROb2RlUmVmZXJlbmNlU2VsZWN0aW9uXSxcbiAgICApO1xuXG4gICAgY29uc3QgcmVuZGVyTm9kZUNvbnRlbnRQYW5lbCA9IHVzZUNhbGxiYWNrKFxuICAgICAgICAoY29udGVudE5vZGU6IENhbnZhc05vZGVEYXRhKSA9PiAoXG4gICAgICAgICAgICA8Q2FudmFzQ29uZmlnTm9kZVBhbmVsXG4gICAgICAgICAgICAgICAgbm9kZT17Y29udGVudE5vZGV9XG4gICAgICAgICAgICAgICAgaXNSdW5uaW5nPXtydW5uaW5nTm9kZUlkID09PSBjb250ZW50Tm9kZS5pZH1cbiAgICAgICAgICAgICAgICBpbnB1dFN1bW1hcnk9e2dldElucHV0U3VtbWFyeShjb25maWdJbnB1dHNCeUlkLmdldChjb250ZW50Tm9kZS5pZCkgfHwgW10pfVxuICAgICAgICAgICAgICAgIG9uQ29uZmlnQ2hhbmdlPXtoYW5kbGVDb25maWdOb2RlQ2hhbmdlfVxuICAgICAgICAgICAgICAgIG9uQ29tcG9zZXJUb2dnbGU9eygpID0+IHNldERpYWxvZ05vZGVJZCgoY3VycmVudCkgPT4gKGN1cnJlbnQgPT09IGNvbnRlbnROb2RlLmlkID8gbnVsbCA6IGNvbnRlbnROb2RlLmlkKSl9XG4gICAgICAgICAgICAgICAgb25TdG9wPXtjb25maXJtU3RvcEdlbmVyYXRpb259XG4gICAgICAgICAgICAgICAgb25HZW5lcmF0ZT17KG5vZGVJZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBub2Rlc1JlZi5jdXJyZW50LmZpbmQoKGl0ZW0pID0+IGl0ZW0uaWQgPT09IG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgICAgIHZvaWQgaGFuZGxlR2VuZXJhdGVOb2RlKG5vZGVJZCwgdGFyZ2V0Py5tZXRhZGF0YT8uZ2VuZXJhdGlvbk1vZGUgfHwgXCJpbWFnZVwiLCB0YXJnZXQ/Lm1ldGFkYXRhPy5jb21wb3NlckNvbnRlbnQgPz8gdGFyZ2V0Py5tZXRhZGF0YT8ucHJvbXB0ID8/IFwiXCIpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAvPlxuICAgICAgICApLFxuICAgICAgICBbY29uZmlnSW5wdXRzQnlJZCwgY29uZmlybVN0b3BHZW5lcmF0aW9uLCBoYW5kbGVDb25maWdOb2RlQ2hhbmdlLCBoYW5kbGVHZW5lcmF0ZU5vZGUsIHJ1bm5pbmdOb2RlSWRdLFxuICAgICk7XG5cbiAgICBpZiAoIXByb2plY3RMb2FkZWQpIHJldHVybiA8Q2FudmFzUmVmcmVzaFNoZWxsIC8+O1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPG1haW4gY2xhc3NOYW1lPVwiZmxleCBoLWZ1bGwgbWluLWgtMCBvdmVyZmxvdy1oaWRkZW5cIiBzdHlsZT17eyBiYWNrZ3JvdW5kOiB0aGVtZS5jYW52YXMuYmFja2dyb3VuZCwgY29sb3I6IHRoZW1lLm5vZGUudGV4dCB9fT5cbiAgICAgICAgICAgIDxDYW52YXNTaWRlUGFuZWwgbm9kZXM9e25vZGVzfSBzZWxlY3RlZE5vZGVJZHM9e3NlbGVjdGVkTm9kZUlkc30gb25Gb2N1c05vZGU9e2ZvY3VzTm9kZX0gb25QcmV2aWV3Tm9kZT17c2V0UHJldmlld05vZGVJZH0gb25JbnNlcnRBc3NldD17aGFuZGxlQXNzZXRJbnNlcnR9IC8+XG4gICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBtaW4tdy0wIGZsZXgtMSBvdmVyZmxvdy1oaWRkZW5cIj5cbiAgICAgICAgICAgICAgICA8Q2FudmFzVG9wQmFyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPXtjdXJyZW50UHJvamVjdD8udGl0bGUgfHwgdChcImNhbnZhcy5wcm9qZWN0UGFnZS51bnRpdGxlZENhbnZhc1wiKX1cbiAgICAgICAgICAgICAgICAgICAgdGl0bGVEcmFmdD17dGl0bGVEcmFmdH1cbiAgICAgICAgICAgICAgICAgICAgaXNUaXRsZUVkaXRpbmc9e3RpdGxlRWRpdGluZ31cbiAgICAgICAgICAgICAgICAgICAgb25UaXRsZURyYWZ0Q2hhbmdlPXtzZXRUaXRsZURyYWZ0fVxuICAgICAgICAgICAgICAgICAgICBvblN0YXJ0VGl0bGVFZGl0aW5nPXtzdGFydFRpdGxlRWRpdGluZ31cbiAgICAgICAgICAgICAgICAgICAgb25GaW5pc2hUaXRsZUVkaXRpbmc9e2ZpbmlzaFRpdGxlRWRpdGluZ31cbiAgICAgICAgICAgICAgICAgICAgb25DYW5jZWxUaXRsZUVkaXRpbmc9eygpID0+IHNldFRpdGxlRWRpdGluZyhmYWxzZSl9XG4gICAgICAgICAgICAgICAgICAgIGNhblVuZG89e2hpc3RvcnlTdGF0ZS5jYW5VbmRvfVxuICAgICAgICAgICAgICAgICAgICBjYW5SZWRvPXtoaXN0b3J5U3RhdGUuY2FuUmVkb31cbiAgICAgICAgICAgICAgICAgICAgb25Ib21lPXsoKSA9PiBuYXZpZ2F0ZShcIi9cIil9XG4gICAgICAgICAgICAgICAgICAgIG9uUHJvamVjdHM9eygpID0+IG5hdmlnYXRlKFwiL2NhbnZhc1wiKX1cbiAgICAgICAgICAgICAgICAgICAgb25DcmVhdGVQcm9qZWN0PXtjcmVhdGVBbmRPcGVuUHJvamVjdH1cbiAgICAgICAgICAgICAgICAgICAgb25EZWxldGVQcm9qZWN0PXtkZWxldGVDdXJyZW50UHJvamVjdH1cbiAgICAgICAgICAgICAgICAgICAgb25FeHBvcnRQcm9qZWN0PXtleHBvcnRDdXJyZW50UHJvamVjdH1cbiAgICAgICAgICAgICAgICAgICAgb25JbXBvcnRJbWFnZT17KCkgPT4gaGFuZGxlVXBsb2FkUmVxdWVzdCgpfVxuICAgICAgICAgICAgICAgICAgICBvbk9wZW5QbHVnaW5zPXsoKSA9PiBzZXRQbHVnaW5NYW5hZ2VyT3Blbih0cnVlKX1cbiAgICAgICAgICAgICAgICAgICAgb25VbmRvPXt1bmRvQ2FudmFzfVxuICAgICAgICAgICAgICAgICAgICBvblJlZG89e3JlZG9DYW52YXN9XG4gICAgICAgICAgICAgICAgICAgIGFnZW50T3Blbj17YWdlbnRQYW5lbE9wZW59XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhY3RBZ2VudFN0YXR1cz17eyBjb25uZWN0ZWQ6IGxvY2FsQWdlbnRDb25uZWN0ZWQsIGVuYWJsZWQ6IGxvY2FsQWdlbnRFbmFibGVkLCBhY3Rpdml0eTogbG9jYWxBZ2VudEFjdGl2aXR5IH19XG4gICAgICAgICAgICAgICAgICAgIG9uVG9nZ2xlQWdlbnQ9e3RvZ2dsZUFnZW50UGFuZWx9XG4gICAgICAgICAgICAgICAgLz5cblxuICAgICAgICAgICAgICAgIDxJbmZpbml0ZUNhbnZhc1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJSZWY9e2NvbnRhaW5lclJlZn1cbiAgICAgICAgICAgICAgICAgICAgdmlld3BvcnQ9e3ZpZXdwb3J0fVxuICAgICAgICAgICAgICAgICAgICB0b29sPXtjYW52YXNUb29sfVxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kTW9kZT17YmFja2dyb3VuZE1vZGV9XG4gICAgICAgICAgICAgICAgICAgIG9uVmlld3BvcnRDaGFuZ2U9eyhuZXh0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRWaWV3cG9ydChuZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldENvbnRleHRNZW51KG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICBvbkNhbnZhc01vdXNlRG93bj17KGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlZmVyZW5jZVBpY2tlck5vZGVJZCkgaGFuZGxlQ2FudmFzTW91c2VEb3duKGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgb25DYW52YXNEZXNlbGVjdD17cmVmZXJlbmNlUGlja2VyTm9kZUlkID8gdW5kZWZpbmVkIDogZGVzZWxlY3RDYW52YXN9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2FudmFzRG91YmxlQ2xpY2s9eyhldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlZmVyZW5jZVBpY2tlck5vZGVJZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q29udGV4dE1lbnUobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXROb2RlQ3JlYXRlUG9zaXRpb24oc2NyZWVuVG9DYW52YXMoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpO1xuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICBvbkNvbnRleHRNZW51PXtwcmV2ZW50Q2FudmFzQ29udGV4dE1lbnV9XG4gICAgICAgICAgICAgICAgICAgIG9uRHJvcD17aGFuZGxlRHJvcH1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxzdmcgY2xhc3NOYW1lPVwiYWJzb2x1dGUgbGVmdC0wIHRvcC0wIGgtWzEwMDAwcHhdIHctWzEwMDAwcHhdIG92ZXJmbG93LXZpc2libGVcIiBzdHlsZT17eyBwb2ludGVyRXZlbnRzOiBcIm5vbmVcIiwgdHJhbnNmb3JtOiBcInRyYW5zbGF0ZVooMClcIiwgekluZGV4OiAwIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAge2Nvbm5lY3Rpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoY29ubmVjdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmcm9tID0gbm9kZUJ5SWQuZ2V0KGNvbm5lY3Rpb24uZnJvbU5vZGVJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvID0gbm9kZUJ5SWQuZ2V0KGNvbm5lY3Rpb24udG9Ob2RlSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZyb20gfHwgIXRvKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPENvbm5lY3Rpb25QYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtjb25uZWN0aW9uLmlkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb249e2Nvbm5lY3Rpb259XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbT17ZnJvbX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0bz17dG99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlPXtzZWxlY3RlZENvbm5lY3Rpb25JZCA9PT0gY29ubmVjdGlvbi5pZCB8fCByZWxhdGVkSGlnaGxpZ2h0LmNvbm5lY3Rpb25JZHMuaGFzKGNvbm5lY3Rpb24uaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uU2VsZWN0PXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkQ29ubmVjdGlvbklkKGNvbm5lY3Rpb24uaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZE5vZGVJZHMobmV3IFNldCgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q29udGV4dE1lbnUobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNvbnRleHRNZW51PXsoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0U2VsZWN0ZWRDb25uZWN0aW9uSWQoY29ubmVjdGlvbi5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkTm9kZUlkcyhuZXcgU2V0KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRDb250ZXh0TWVudSh7IHR5cGU6IFwiY29ubmVjdGlvblwiLCB4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZLCBjb25uZWN0aW9uSWQ6IGNvbm5lY3Rpb24uaWQgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICB7Y29ubmVjdGluZ1BhcmFtcyA/IDxBY3RpdmVDb25uZWN0aW9uUGF0aCBub2RlPXtub2RlQnlJZC5nZXQoY29ubmVjdGluZ1BhcmFtcy5ub2RlSWQpfSBoYW5kbGU9e2Nvbm5lY3RpbmdQYXJhbXN9IG1vdXNlV29ybGQ9e21vdXNlV29ybGR9IHRhcmdldD17Y29ubmVjdGlvblRhcmdldE5vZGVJZCA/IG5vZGVCeUlkLmdldChjb25uZWN0aW9uVGFyZ2V0Tm9kZUlkKSA6IHVuZGVmaW5lZH0gLz4gOiBudWxsfVxuICAgICAgICAgICAgICAgICAgICA8L3N2Zz5cblxuICAgICAgICAgICAgICAgICAgICB7dmlzaWJsZU5vZGVzLm1hcCgobm9kZSkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPENhbnZhc05vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e25vZGUuaWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YT17bm9kZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZT17dmlld3BvcnQua31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc1NlbGVjdGVkPXtzZWxlY3RlZE5vZGVJZHMuaGFzKG5vZGUuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzUmVsYXRlZD17cmVsYXRlZEhpZ2hsaWdodC5ub2RlSWRzLmhhcyhub2RlLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0ZvY3VzUmVsYXRlZD17YWN0aXZlTm9kZUlkID09PSBub2RlLmlkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQ29ubmVjdGlvblRhcmdldD17Y29ubmVjdGlvblRhcmdldE5vZGVJZCA9PT0gbm9kZS5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0Nvbm5lY3Rpbmc9e0Jvb2xlYW4oY29ubmVjdGluZ1BhcmFtcyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNlU2VsZWN0aW9uU3RhdGU9eyFyZWZlcmVuY2VQaWNrZXJOb2RlSWQgPyB1bmRlZmluZWQgOiBub2RlLmlkID09PSByZWZlcmVuY2VQaWNrZXJOb2RlSWQgPyBcInRhcmdldFwiIDogcmVmZXJlbmNlQ29ubmVjdGVkTm9kZUlkcy5oYXMobm9kZS5pZCkgfHwgIWlzQ2FudmFzUmVmZXJlbmNlTm9kZShub2RlLCBub2RlcykgPyBcImRpc2FibGVkXCIgOiBcImF2YWlsYWJsZVwifVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3dQYW5lbD17IWlzTm9kZVJlc2l6aW5nICYmIGRpYWxvZ05vZGVJZCA9PT0gbm9kZS5pZCAmJiAhc2VsZWN0aW9uQm94ICYmICFnZXROb2RlRGVmaW5pdGlvbihub2RlLnR5cGUpPy5oaWRlUGFuZWx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBDaGlsZENvdW50PXtncm91cENoaWxkQ291bnRCeUlkLmdldChub2RlLmlkKSB8fCAwfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzR3JvdXBEcm9wVGFyZ2V0PXtkcm9wVGFyZ2V0R3JvdXBJZCA9PT0gbm9kZS5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXRjaEV4cGFuZGVkPXtleHBhbmRlZEJhdGNoTm9kZUlkcy5oYXMobm9kZS5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd0ltYWdlSW5mbz17c2hvd0ltYWdlSW5mb31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZW50aW9uUmVmZXJlbmNlcz17bWVudGlvblJlZmVyZW5jZXNCeU5vZGVJZC5nZXQobm9kZS5pZCkgfHwgRU1QVFlfUkVGRVJFTkNFU31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbHVnaW5Ib3N0PXtwbHVnaW5Ib3N0fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2lzdHJ5VmVyc2lvbj17bm9kZVJlZ2lzdHJ5VmVyc2lvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJQYW5lbD17cmVuZGVyTm9kZVBhbmVsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlck5vZGVDb250ZW50PXtyZW5kZXJOb2RlQ29udGVudFBhbmVsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VEb3duPXtoYW5kbGVOb2RlTW91c2VEb3dufVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uU2VsZWN0Q2FwdHVyZT17aGFuZGxlTm9kZVNlbGVjdENhcHR1cmV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Ib3ZlclN0YXJ0PXtoYW5kbGVOb2RlSG92ZXJTdGFydH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkhvdmVyRW5kPXtoYW5kbGVOb2RlSG92ZXJFbmR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Db25uZWN0U3RhcnQ9e2hhbmRsZUNvbm5lY3RTdGFydH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblJlc2l6ZVN0YXJ0PXtoYW5kbGVOb2RlUmVzaXplU3RhcnR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25SZXNpemU9e2hhbmRsZU5vZGVSZXNpemV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25SZXNpemVFbmQ9e2hhbmRsZU5vZGVSZXNpemVFbmR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Db250ZW50Q2hhbmdlPXtoYW5kbGVOb2RlQ29udGVudENoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblRpdGxlQ2hhbmdlPXtoYW5kbGVOb2RlVGl0bGVDaGFuZ2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Ub2dnbGVCYXRjaD17dG9nZ2xlQmF0Y2hFeHBhbmRlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblNldEJhdGNoUHJpbWFyeT17c2V0QmF0Y2hQcmltYXJ5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRHVwbGljYXRlQmF0Y2hJbWFnZT17ZHVwbGljYXRlQmF0Y2hJbWFnZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRvd25sb2FkQmF0Y2hJbWFnZT17ZG93bmxvYWRCYXRjaEltYWdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uUmV0cnlCYXRjaEltYWdlPXtyZXRyeUJhdGNoSW1hZ2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EZWxldGVCYXRjaEltYWdlPXtkZWxldGVCYXRjaEltYWdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uUmV0cnk9e2hhbmRsZU5vZGVSZXRyeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblZpZXdJbWFnZT17aGFuZGxlTm9kZVZpZXdJbWFnZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblNlbGVjdFJlZmVyZW5jZT17c2VsZWN0Tm9kZVJlZmVyZW5jZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNvbnRleHRNZW51PXtoYW5kbGVOb2RlQ29udGV4dE1lbnV9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICApKX1cblxuICAgICAgICAgICAgICAgICAgICB7cmVmZXJlbmNlUGlja2VyTm9kZUlkID8gPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYWJzb2x1dGUgbGVmdC0xLzIgdG9wLTQgei1bOTBdIC10cmFuc2xhdGUteC0xLzIgcm91bmRlZC1mdWxsIGJvcmRlciBweC00IHB5LTIgdGV4dC1zbSBmb250LW1lZGl1bSBzaGFkb3ctbGcgYmFja2Ryb3AtYmx1clwiIHN0eWxlPXt7IGJhY2tncm91bmQ6IHRoZW1lLnRvb2xiYXIucGFuZWwsIGJvcmRlckNvbG9yOiB0aGVtZS50b29sYmFyLmJvcmRlciB9fSBvbkNsaWNrPXtleGl0Tm9kZVJlZmVyZW5jZVNlbGVjdGlvbn0+e3QoXCJjYW52YXMucmVmZXJlbmNlcy5zZWxlY3RpbmdIaW50XCIpfTwvYnV0dG9uPiA6IG51bGx9XG5cbiAgICAgICAgICAgICAgICAgICAge3NlbGVjdGlvbkJveCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzdmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwb2ludGVyLWV2ZW50cy1ub25lIGFic29sdXRlIHotWzEwMF0gb3ZlcmZsb3ctdmlzaWJsZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogTWF0aC5taW4oc2VsZWN0aW9uQm94LnN0YXJ0V29ybGRYLCBzZWxlY3Rpb25Cb3guY3VycmVudFdvcmxkWCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogTWF0aC5taW4oc2VsZWN0aW9uQm94LnN0YXJ0V29ybGRZLCBzZWxlY3Rpb25Cb3guY3VycmVudFdvcmxkWSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBNYXRoLmFicyhzZWxlY3Rpb25Cb3guY3VycmVudFdvcmxkWCAtIHNlbGVjdGlvbkJveC5zdGFydFdvcmxkWCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogTWF0aC5hYnMoc2VsZWN0aW9uQm94LmN1cnJlbnRXb3JsZFkgLSBzZWxlY3Rpb25Cb3guc3RhcnRXb3JsZFkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHJlY3Qgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiIGZpbGw9e3RoZW1lLmNhbnZhcy5zZWxlY3Rpb25GaWxsfSBzdHJva2U9e3RoZW1lLmNhbnZhcy5zZWxlY3Rpb25TdHJva2V9IHN0cm9rZU9wYWNpdHk9ezAuNTV9IHN0cm9rZVdpZHRoPXsxIC8gdmlld3BvcnQua30gc3Ryb2tlRGFzaGFycmF5PXtgJHs2IC8gdmlld3BvcnQua30gJHs0IC8gdmlld3BvcnQua31gfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgICAgICkgOiBudWxsfVxuICAgICAgICAgICAgICAgICAgICB7cGVuZGluZ0Nvbm5lY3Rpb25DcmVhdGUgPyA8Q29ubmVjdGlvbkNyZWF0ZU1lbnUgcGVuZGluZz17cGVuZGluZ0Nvbm5lY3Rpb25DcmVhdGV9IG9uQ3JlYXRlPXsodHlwZSkgPT4gY3JlYXRlQ29ubmVjdGVkTm9kZSh0eXBlLCBwZW5kaW5nQ29ubmVjdGlvbkNyZWF0ZSl9IG9uQ2xvc2U9e2NhbmNlbFBlbmRpbmdDb25uZWN0aW9uQ3JlYXRlfSAvPiA6IG51bGx9XG4gICAgICAgICAgICAgICAgICAgIHtub2RlQ3JlYXRlUG9zaXRpb24gPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8Tm9kZUNyZWF0ZU1lbnVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbj17bm9kZUNyZWF0ZVBvc2l0aW9ufVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ3JlYXRlPXsodHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVOb2RlKHR5cGUsIG5vZGVDcmVhdGVQb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldE5vZGVDcmVhdGVQb3NpdGlvbihudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xvc2U9eygpID0+IHNldE5vZGVDcmVhdGVQb3NpdGlvbihudWxsKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICkgOiBudWxsfVxuICAgICAgICAgICAgICAgIDwvSW5maW5pdGVDYW52YXM+XG5cbiAgICAgICAgICAgICAgICA8Q2FudmFzTm9kZUhvdmVyVG9vbGJhclxuICAgICAgICAgICAgICAgICAgICBub2RlPXtpc05vZGVEcmFnZ2luZyB8fCBpc05vZGVSZXNpemluZyB8fCBub2RlSW1hZ2VTZXR0aW5nc09wZW4gfHwgZXhwYW5kZWRCYXRjaE5vZGVJZHMuaGFzKHRvb2xiYXJOb2RlPy5pZCB8fCBcIlwiKSA/IG51bGwgOiB0b29sYmFyTm9kZX1cbiAgICAgICAgICAgICAgICAgICAgdmlld3BvcnQ9e3ZpZXdwb3J0fVxuICAgICAgICAgICAgICAgICAgICBleHRyYVRvb2xzPXt0b29sYmFyTm9kZSA/IGJ1aWxkTm9kZVRvb2xiYXJJdGVtcyh0b29sYmFyTm9kZSkgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgICAgIG9uS2VlcD17a2VlcE5vZGVUb29sYmFyfVxuICAgICAgICAgICAgICAgICAgICBvbkxlYXZlPXtoaWRlTm9kZVRvb2xiYXJ9XG4gICAgICAgICAgICAgICAgICAgIG9uSW5mbz17KG5vZGUpID0+IHNldEluZm9Ob2RlSWQobm9kZS5pZCl9XG4gICAgICAgICAgICAgICAgICAgIG9uRGVjcmVhc2VGb250PXsobm9kZSkgPT4gaGFuZGxlRm9udFNpemVDaGFuZ2Uobm9kZS5pZCwgTWF0aC5tYXgoMTAsIChub2RlLm1ldGFkYXRhPy5mb250U2l6ZSB8fCAxNCkgLSAyKSl9XG4gICAgICAgICAgICAgICAgICAgIG9uSW5jcmVhc2VGb250PXsobm9kZSkgPT4gaGFuZGxlRm9udFNpemVDaGFuZ2Uobm9kZS5pZCwgTWF0aC5taW4oMzIsIChub2RlLm1ldGFkYXRhPy5mb250U2l6ZSB8fCAxNCkgKyAyKSl9XG4gICAgICAgICAgICAgICAgICAgIG9uVG9nZ2xlRGlhbG9nPXsobm9kZSkgPT4gc2V0RGlhbG9nTm9kZUlkKChjdXJyZW50KSA9PiAoY3VycmVudCA9PT0gbm9kZS5pZCA/IG51bGwgOiBub2RlLmlkKSl9XG4gICAgICAgICAgICAgICAgICAgIG9uR2VuZXJhdGVJbWFnZT17Z2VuZXJhdGVJbWFnZUZyb21UZXh0Tm9kZX1cbiAgICAgICAgICAgICAgICAgICAgb25VcGxvYWQ9eyhub2RlKSA9PiBoYW5kbGVVcGxvYWRSZXF1ZXN0KG5vZGUuaWQpfVxuICAgICAgICAgICAgICAgICAgICBvbkRvd25sb2FkPXtkb3dubG9hZE5vZGVJbWFnZX1cbiAgICAgICAgICAgICAgICAgICAgb25TYXZlQXNzZXQ9eyhub2RlKSA9PiB2b2lkIHNhdmVOb2RlQXNzZXQobm9kZSl9XG4gICAgICAgICAgICAgICAgICAgIG9uTWFza0VkaXQ9eyhub2RlKSA9PiBzZXRNYXNrRWRpdE5vZGVJZChub2RlLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgb25Dcm9wPXsobm9kZSkgPT4gc2V0Q3JvcE5vZGVJZChub2RlLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgb25TcGxpdD17KG5vZGUpID0+IHNldFNwbGl0Tm9kZUlkKG5vZGUuaWQpfVxuICAgICAgICAgICAgICAgICAgICBvblVwc2NhbGU9eyhub2RlKSA9PiBzZXRVcHNjYWxlTm9kZUlkKG5vZGUuaWQpfVxuICAgICAgICAgICAgICAgICAgICBvblN1cGVyUmVzb2x2ZT17KG5vZGUpID0+IHNldFN1cGVyUmVzb2x2ZU5vZGVJZChub2RlLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgb25BbmdsZT17KG5vZGUpID0+IHNldEFuZ2xlTm9kZUlkKG5vZGUuaWQpfVxuICAgICAgICAgICAgICAgICAgICBvblZpZXdJbWFnZT17aGFuZGxlTm9kZVZpZXdJbWFnZX1cbiAgICAgICAgICAgICAgICAgICAgb25SZXZlcnNlUHJvbXB0PXtjcmVhdGVJbWFnZVJldmVyc2VQcm9tcHROb2Rlc31cbiAgICAgICAgICAgICAgICAgICAgb25SZXRyeT17KG5vZGUpID0+IHZvaWQgaGFuZGxlUmV0cnlOb2RlKG5vZGUpfVxuICAgICAgICAgICAgICAgICAgICBvblRvZ2dsZUZyZWVSZXNpemU9eyhub2RlKSA9PiB0b2dnbGVOb2RlRnJlZVJlc2l6ZShub2RlLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgb25EZWxldGU9eyhub2RlKSA9PiBkZWxldGVOb2RlcyhuZXcgU2V0KFtub2RlLmlkXSkpfVxuICAgICAgICAgICAgICAgIC8+XG5cbiAgICAgICAgICAgICAgICA8Q2FudmFzVG9vbGJhclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZENvdW50PXtzZWxlY3RlZE5vZGVJZHMuc2l6ZX1cbiAgICAgICAgICAgICAgICAgICAgY2FudmFzVG9vbD17Y2FudmFzVG9vbH1cbiAgICAgICAgICAgICAgICAgICAgY2FuVW5kbz17aGlzdG9yeVN0YXRlLmNhblVuZG99XG4gICAgICAgICAgICAgICAgICAgIGNhblJlZG89e2hpc3RvcnlTdGF0ZS5jYW5SZWRvfVxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kTW9kZT17YmFja2dyb3VuZE1vZGV9XG4gICAgICAgICAgICAgICAgICAgIHNob3dJbWFnZUluZm89e3Nob3dJbWFnZUluZm99XG4gICAgICAgICAgICAgICAgICAgIG9uQWRkSW1hZ2U9eygpID0+IGNyZWF0ZU5vZGUoQ2FudmFzTm9kZVR5cGUuSW1hZ2UpfVxuICAgICAgICAgICAgICAgICAgICBvbkFkZFZpZGVvPXsoKSA9PiBjcmVhdGVOb2RlKENhbnZhc05vZGVUeXBlLlZpZGVvKX1cbiAgICAgICAgICAgICAgICAgICAgb25BZGRBdWRpbz17KCkgPT4gY3JlYXRlTm9kZShDYW52YXNOb2RlVHlwZS5BdWRpbyl9XG4gICAgICAgICAgICAgICAgICAgIG9uQWRkVGV4dD17KCkgPT4gY3JlYXRlTm9kZShDYW52YXNOb2RlVHlwZS5UZXh0KX1cbiAgICAgICAgICAgICAgICAgICAgb25BZGRDb25maWc9eygpID0+IGNyZWF0ZU5vZGUoQ2FudmFzTm9kZVR5cGUuQ29uZmlnKX1cbiAgICAgICAgICAgICAgICAgICAgb25BZGRHcm91cD17KCkgPT4gY3JlYXRlTm9kZShDYW52YXNOb2RlVHlwZS5Hcm91cCl9XG4gICAgICAgICAgICAgICAgICAgIG9uQWRkRXh0ZW5zaW9uTm9kZT17KHR5cGUpID0+IGNyZWF0ZU5vZGUodHlwZSl9XG4gICAgICAgICAgICAgICAgICAgIG9uVW5kbz17dW5kb0NhbnZhc31cbiAgICAgICAgICAgICAgICAgICAgb25SZWRvPXtyZWRvQ2FudmFzfVxuICAgICAgICAgICAgICAgICAgICBvblVwbG9hZD17KCkgPT4gaGFuZGxlVXBsb2FkUmVxdWVzdCgpfVxuICAgICAgICAgICAgICAgICAgICBvbkRlbGV0ZT17KCkgPT4gZGVsZXRlTm9kZXMobmV3IFNldChzZWxlY3RlZE5vZGVJZHMpKX1cbiAgICAgICAgICAgICAgICAgICAgb25DbGVhcj17KCkgPT4gc2V0Q2xlYXJDb25maXJtT3Blbih0cnVlKX1cbiAgICAgICAgICAgICAgICAgICAgb25DYW52YXNUb29sQ2hhbmdlPXtzZXRDYW52YXNUb29sfVxuICAgICAgICAgICAgICAgICAgICBvbkJhY2tncm91bmRNb2RlQ2hhbmdlPXtzZXRCYWNrZ3JvdW5kTW9kZX1cbiAgICAgICAgICAgICAgICAgICAgb25TaG93SW1hZ2VJbmZvQ2hhbmdlPXtzZXRTaG93SW1hZ2VJbmZvfVxuICAgICAgICAgICAgICAgIC8+XG5cbiAgICAgICAgICAgICAgICB7aXNNaW5pTWFwT3BlbiA/IDxNaW5pbWFwIG5vZGVzPXtub2Rlc30gdmlld3BvcnQ9e3ZpZXdwb3J0fSB2aWV3cG9ydFNpemU9e3NpemV9IG9uVmlld3BvcnRDaGFuZ2U9e3NldFZpZXdwb3J0fSAvPiA6IG51bGx9XG5cbiAgICAgICAgICAgICAgICA8Q2FudmFzWm9vbUNvbnRyb2xzIHNjYWxlPXt2aWV3cG9ydC5rfSBvblNjYWxlQ2hhbmdlPXtzZXRab29tU2NhbGV9IG9uUmVzZXQ9e3Jlc2V0Vmlld3BvcnR9IGlzTWluaU1hcE9wZW49e2lzTWluaU1hcE9wZW59IG9uVG9nZ2xlTWluaU1hcD17KCkgPT4gc2V0SXNNaW5pTWFwT3BlbigodmFsdWUpID0+ICF2YWx1ZSl9IC8+XG5cbiAgICAgICAgICAgICAgICB7Y29udGV4dE1lbnUgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxDYW52YXNOb2RlQ29udGV4dE1lbnVcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lbnU9e2NvbnRleHRNZW51fVxuICAgICAgICAgICAgICAgICAgICAgICAgY2FuQ2FwdHVyZVZpZGVvRnJhbWU9e2NvbnRleHRNZW51Tm9kZT8udHlwZSA9PT0gQ2FudmFzTm9kZVR5cGUuVmlkZW8gJiYgQm9vbGVhbihjb250ZXh0TWVudU5vZGUubWV0YWRhdGE/LmNvbnRlbnQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0Q29udGV4dE1lbnUobnVsbCl9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNhcHR1cmVWaWRlb0ZyYW1lPXsocG9zaXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGV4dE1lbnUudHlwZSAhPT0gXCJub2RlXCIpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2b2lkIGNhcHR1cmVWaWRlb05vZGVGcmFtZShjb250ZXh0TWVudS5ub2RlSWQsIHBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkR1cGxpY2F0ZT17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250ZXh0TWVudS50eXBlICE9PSBcIm5vZGVcIikgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cGxpY2F0ZU5vZGUoY29udGV4dE1lbnUubm9kZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRDb250ZXh0TWVudShudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkRlbGV0ZT17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250ZXh0TWVudS50eXBlID09PSBcIm5vZGVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGVOb2RlcyhuZXcgU2V0KFtjb250ZXh0TWVudS5ub2RlSWRdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlQ29ubmVjdGlvbihjb250ZXh0TWVudS5jb25uZWN0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRDb250ZXh0TWVudShudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAgICAgICAgICA8aW5wdXQgcmVmPXtpbWFnZUlucHV0UmVmfSB0eXBlPVwiZmlsZVwiIG11bHRpcGxlIGFjY2VwdD1cImltYWdlLyosdmlkZW8vKixhdWRpby9tcGVnLGF1ZGlvL3dhdixhdWRpby94LXdhdiwubXAzLC53YXZcIiBjbGFzc05hbWU9XCJoaWRkZW5cIiBvbkNoYW5nZT17aGFuZGxlSW1hZ2VJbnB1dENoYW5nZX0gLz5cblxuICAgICAgICAgICAgICAgIDxDYW52YXNOb2RlSW5mb01vZGFsIG5vZGU9e2luZm9Ob2RlfSBvcGVuPXtCb29sZWFuKGluZm9Ob2RlKX0gb25DbG9zZT17KCkgPT4gc2V0SW5mb05vZGVJZChudWxsKX0gLz5cbiAgICAgICAgICAgICAgICA8Q2FudmFzUGx1Z2luTWFuYWdlck1vZGFsIG9wZW49e3BsdWdpbk1hbmFnZXJPcGVufSBvbkNsb3NlPXsoKSA9PiBzZXRQbHVnaW5NYW5hZ2VyT3BlbihmYWxzZSl9IC8+XG5cbiAgICAgICAgICAgICAgICB7Y3JvcE5vZGU/Lm1ldGFkYXRhPy5jb250ZW50ID8gPENhbnZhc05vZGVDcm9wRGlhbG9nIGRhdGFVcmw9e2Nyb3BOb2RlLm1ldGFkYXRhLmNvbnRlbnR9IG9wZW49e0Jvb2xlYW4oY3JvcE5vZGUpfSBvbkNsb3NlPXsoKSA9PiBzZXRDcm9wTm9kZUlkKG51bGwpfSBvbkNvbmZpcm09eyhjcm9wKSA9PiB2b2lkIGNyb3BJbWFnZU5vZGUoY3JvcE5vZGUhLCBjcm9wKX0gLz4gOiBudWxsfVxuXG4gICAgICAgICAgICAgICAge21hc2tFZGl0Tm9kZT8ubWV0YWRhdGE/LmNvbnRlbnQgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxDYW52YXNOb2RlTWFza0VkaXREaWFsb2cgZGF0YVVybD17bWFza0VkaXROb2RlLm1ldGFkYXRhLmNvbnRlbnR9IG9wZW49e0Jvb2xlYW4obWFza0VkaXROb2RlKX0gb25DbG9zZT17KCkgPT4gc2V0TWFza0VkaXROb2RlSWQobnVsbCl9IG9uQ29uZmlybT17KHBheWxvYWQpID0+IHZvaWQgbWFza0VkaXRJbWFnZU5vZGUobWFza0VkaXROb2RlISwgcGF5bG9hZCl9IC8+XG4gICAgICAgICAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAgICAgICAgICB7c3BsaXROb2RlPy5tZXRhZGF0YT8uY29udGVudCA/IDxDYW52YXNOb2RlU3BsaXREaWFsb2cgZGF0YVVybD17c3BsaXROb2RlLm1ldGFkYXRhLmNvbnRlbnR9IG9wZW49e0Jvb2xlYW4oc3BsaXROb2RlKX0gb25DbG9zZT17KCkgPT4gc2V0U3BsaXROb2RlSWQobnVsbCl9IG9uQ29uZmlybT17KHBhcmFtcykgPT4gdm9pZCBzcGxpdEltYWdlTm9kZShzcGxpdE5vZGUhLCBwYXJhbXMpfSAvPiA6IG51bGx9XG5cbiAgICAgICAgICAgICAgICB7dXBzY2FsZU5vZGU/Lm1ldGFkYXRhPy5jb250ZW50ID8gKFxuICAgICAgICAgICAgICAgICAgICA8Q2FudmFzTm9kZVVwc2NhbGVEaWFsb2cgZGF0YVVybD17dXBzY2FsZU5vZGUubWV0YWRhdGEuY29udGVudH0gb3Blbj17Qm9vbGVhbih1cHNjYWxlTm9kZSl9IG9uQ2xvc2U9eygpID0+IHNldFVwc2NhbGVOb2RlSWQobnVsbCl9IG9uQ29uZmlybT17KHBhcmFtcykgPT4gdm9pZCB1cHNjYWxlSW1hZ2VOb2RlKHVwc2NhbGVOb2RlISwgcGFyYW1zKX0gLz5cbiAgICAgICAgICAgICAgICApIDogbnVsbH1cblxuICAgICAgICAgICAgICAgIDxNb2RhbCB0aXRsZT17dChcImNhbnZhcy5wcm9qZWN0UGFnZS5zdXBlclJlc29sdmVcIil9IG9wZW49e0Jvb2xlYW4oc3VwZXJSZXNvbHZlTm9kZT8ubWV0YWRhdGE/LmNvbnRlbnQpfSBjZW50ZXJlZCBmb290ZXI9e251bGx9IG9uQ2FuY2VsPXsoKSA9PiBzZXRTdXBlclJlc29sdmVOb2RlSWQobnVsbCl9PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB5LTggdGV4dC1jZW50ZXIgdGV4dC1iYXNlIGZvbnQtbWVkaXVtXCI+e3QoXCJjYW52YXMucHJvamVjdFBhZ2Uubm90SW1wbGVtZW50ZWRcIil9PC9kaXY+XG4gICAgICAgICAgICAgICAgPC9Nb2RhbD5cblxuICAgICAgICAgICAgICAgIHthbmdsZU5vZGU/Lm1ldGFkYXRhPy5jb250ZW50ID8gPENhbnZhc05vZGVBbmdsZURpYWxvZyBkYXRhVXJsPXthbmdsZU5vZGUubWV0YWRhdGEuY29udGVudH0gb3Blbj17Qm9vbGVhbihhbmdsZU5vZGUpfSBvbkNsb3NlPXsoKSA9PiBzZXRBbmdsZU5vZGVJZChudWxsKX0gb25Db25maXJtPXsocGFyYW1zKSA9PiB2b2lkIGdlbmVyYXRlQW5nbGVOb2RlKGFuZ2xlTm9kZSEsIHBhcmFtcyl9IC8+IDogbnVsbH1cblxuICAgICAgICAgICAgICAgIDxNb2RhbFxuICAgICAgICAgICAgICAgICAgICB0aXRsZT17dChcImNhbnZhcy5wcm9qZWN0UGFnZS5pbWFnZURldGFpbHNcIil9XG4gICAgICAgICAgICAgICAgICAgIG9wZW49e0Jvb2xlYW4ocHJldmlld0NvbnRlbnQpfVxuICAgICAgICAgICAgICAgICAgICBjZW50ZXJlZFxuICAgICAgICAgICAgICAgICAgICBvbkNhbmNlbD17KCkgPT4gc2V0UHJldmlld05vZGVJZChudWxsKX1cbiAgICAgICAgICAgICAgICAgICAgZm9vdGVyPXtudWxsfVxuICAgICAgICAgICAgICAgICAgICB3aWR0aD1cImF1dG9cIlxuICAgICAgICAgICAgICAgICAgICBzdHlsZXM9e3sgYm9keTogeyBwYWRkaW5nOiAwLCBkaXNwbGF5OiBcImZsZXhcIiwganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsIG1heEhlaWdodDogXCI4MHZoXCIgfSB9fVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAge3ByZXZpZXdDb250ZW50ID8gPGltZyBzcmM9e3ByZXZpZXdDb250ZW50fSBhbHQ9e3ByZXZpZXdOb2RlPy50aXRsZSB8fCB0KFwiYXNzZXRzLmtpbmRzLmltYWdlXCIpfSBzdHlsZT17eyBtYXhXaWR0aDogXCIxMDAlXCIsIG1heEhlaWdodDogXCI4MHZoXCIsIG9iamVjdEZpdDogXCJjb250YWluXCIgfX0gLz4gOiBudWxsfVxuICAgICAgICAgICAgICAgIDwvTW9kYWw+XG5cbiAgICAgICAgICAgICAgICA8TW9kYWxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9e3QoXCJjYW52YXMucHJvamVjdFBhZ2UuY2xlYXJUaXRsZVwiKX1cbiAgICAgICAgICAgICAgICAgICAgb3Blbj17Y2xlYXJDb25maXJtT3Blbn1cbiAgICAgICAgICAgICAgICAgICAgY2VudGVyZWRcbiAgICAgICAgICAgICAgICAgICAgb25DYW5jZWw9eygpID0+IHNldENsZWFyQ29uZmlybU9wZW4oZmFsc2UpfVxuICAgICAgICAgICAgICAgICAgICBmb290ZXI9e1xuICAgICAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldENsZWFyQ29uZmlybU9wZW4oZmFsc2UpfT57dChcImNvbW1vbi5jYW5jZWxcIil9PC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiBkYW5nZXIgdHlwZT1cInByaW1hcnlcIiBvbkNsaWNrPXtjbGVhckNhbnZhc30+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0KFwiY2FudmFzLnByb2plY3RQYWdlLmNsZWFyXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gb3BhY2l0eS02MFwiPnt0KFwiY2FudmFzLnByb2plY3RQYWdlLmNsZWFyRGVzY3JpcHRpb25cIil9PC9wPlxuICAgICAgICAgICAgICAgIDwvTW9kYWw+XG5cbiAgICAgICAgICAgICAgICA8QXNzZXRQaWNrZXJNb2RhbCBvcGVuPXthc3NldFBpY2tlck9wZW59IG9uSW5zZXJ0PXtoYW5kbGVBc3NldEluc2VydH0gb25DbG9zZT17KCkgPT4gc2V0QXNzZXRQaWNrZXJPcGVuKGZhbHNlKX0gLz5cbiAgICAgICAgICAgIDwvc2VjdGlvbj5cbiAgICAgICAgPC9tYWluPlxuICAgICk7XG59XG4iXSwiZmlsZSI6IkU6L2NvZGV4L25pYW5uaWFuYWkvemh1YW5odWl5dWFuZ29uZy9pbmZpbml0ZS1jYW52YXMvd2ViL3NyYy9wYWdlcy9jYW52YXMvcHJvamVjdC50c3gifQ==