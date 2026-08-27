import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/assets/index.tsx");import { jsxDEV } from "/node_modules/react/jsx-dev-runtime.js";
var _s = $RefreshSig$(), _s2 = $RefreshSig$(), _s3 = $RefreshSig$();
import { Copy, Download, PencilLine, Search, Trash2, Upload } from "/node_modules/lucide-react/dist/esm/lucide-react.mjs";
import { useEffect, useMemo, useRef, useState } from "/node_modules/react/index.js";
import { App, Button, Card, Drawer, Empty, Form, Image, Input, Modal, Pagination, Select, Space, Tag, Typography } from "/node_modules/antd/es/index.js";
import { saveAs } from "/node_modules/file-saver/dist/FileSaver.min.js";
import { useTranslation } from "/node_modules/react-i18next/dist/es/index.js";
import { useCopyText } from "/src/hooks/use-copy-text.ts";
import { formatBytes, readFileAsDataUrl } from "/src/lib/image-utils.ts";
import { uploadImage } from "/src/services/image-storage.ts";
import { cn } from "/src/lib/utils.ts";
import { useAssetStore } from "/src/stores/use-asset-store.ts";
import { exportAssets, readAssetPackage } from "/src/pages/assets/asset-transfer.ts";
const kindOptions = ["all", "text", "image", "video"];
export default function AssetsPage() {
  _s();
  const { message } = App.useApp();
  const { t } = useTranslation();
  const copyText = useCopyText();
  const [form] = Form.useForm();
  const coverInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const assetInputRef = useRef(null);
  const assets = useAssetStore((state) => state.assets);
  const addAsset = useAssetStore((state) => state.addAsset);
  const updateAsset = useAssetStore((state) => state.updateAsset);
  const removeAsset = useAssetStore((state) => state.removeAsset);
  const [keyword, setKeyword] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingAsset, setEditingAsset] = useState(null);
  const [isAssetOpen, setIsAssetOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [deletingAsset, setDeletingAsset] = useState(null);
  const [formKind, setFormKind] = useState("text");
  const [imageDraft, setImageDraft] = useState(null);
  const coverUrl = Form.useWatch("coverUrl", form) || "";
  const title = Form.useWatch("title", form) || "";
  const tags = Form.useWatch("tags", form) || [];
  const content = Form.useWatch("content", form) || "";
  const validAssets = useMemo(() => assets.filter((asset) => asset.kind === "text" || asset.kind === "image" || asset.kind === "video"), [assets]);
  const filteredAssets = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return validAssets.filter((asset) => {
      if (kindFilter !== "all" && asset.kind !== kindFilter) return false;
      if (!query) return true;
      return assetSearchText(asset).includes(query);
    });
  }, [validAssets, keyword, kindFilter]);
  const visibleAssets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, page, pageSize]);
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredAssets.length / pageSize));
    setPage((value) => Math.min(value, maxPage));
  }, [filteredAssets.length, pageSize]);
  const openCreate = () => {
    setEditingAsset(null);
    setImageDraft(null);
    setFormKind("text");
    form.setFieldsValue({ kind: "text", title: "", coverUrl: "", tags: [], source: t("assets.manual"), note: "", content: "" });
    setIsAssetOpen(true);
  };
  const openEdit = (asset) => {
    setEditingAsset(asset);
    setFormKind(asset.kind);
    setImageDraft(asset.kind === "image" ? asset.data : null);
    form.setFieldsValue({
      kind: asset.kind,
      title: asset.title,
      coverUrl: asset.coverUrl,
      tags: asset.tags || [],
      source: asset.source,
      note: asset.note,
      content: asset.kind === "text" ? asset.data.content : ""
    });
    setIsAssetOpen(true);
  };
  const saveAsset = async () => {
    const values = await form.validateFields();
    const base = {
      title: values.title.trim(),
      coverUrl: values.coverUrl?.trim() || (values.kind === "image" && imageDraft ? imageDraft.dataUrl : ""),
      tags: values.tags || [],
      source: values.source?.trim(),
      note: values.note?.trim(),
      metadata: editingAsset?.metadata || { source: "manual" }
    };
    if (values.kind === "text") {
      const asset = { ...base, kind: "text", data: { content: (values.content || "").trim() } };
      editingAsset ? updateAsset(editingAsset.id, asset) : addAsset(asset);
    } else {
      if (!imageDraft) {
        message.error(t("assets.selectImage"));
        return;
      }
      const asset = { ...base, kind: "image", data: imageDraft };
      editingAsset ? updateAsset(editingAsset.id, asset) : addAsset(asset);
    }
    message.success(editingAsset ? t("assets.updated") : t("assets.saved"));
    setIsAssetOpen(false);
  };
  const readCoverFile = async (file) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    form.setFieldValue("coverUrl", dataUrl);
  };
  const readImageFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const image = await uploadImage(file);
    const draft = { dataUrl: image.url, storageKey: image.storageKey, width: image.width, height: image.height, bytes: image.bytes, mimeType: image.mimeType };
    setImageDraft(draft);
    if (!form.getFieldValue("coverUrl")) form.setFieldValue("coverUrl", draft.dataUrl);
    if (!form.getFieldValue("title")) form.setFieldValue("title", file.name);
  };
  const copyAssetText = async (asset) => {
    if (asset.kind !== "text") return;
    copyText(asset.data.content, t("assets.textCopied"));
  };
  const downloadImage = (asset) => {
    if (asset.kind !== "image" && asset.kind !== "video") return;
    saveAs(asset.kind === "video" ? asset.data.url : asset.data.dataUrl, `${asset.title || "asset"}.${asset.data.mimeType.split("/")[1] || "png"}`);
  };
  const exportAllAssets = async () => {
    if (!validAssets.length) {
      message.warning(t("assets.noneToExport"));
      return;
    }
    await exportAssets(validAssets, t("assets.packageName"));
  };
  const importAssetZip = async (file) => {
    if (!file) return;
    try {
      const importedAssets = await readAssetPackage(file);
      importedAssets.forEach((asset) => {
        const payload = { ...asset };
        delete payload.id;
        delete payload.createdAt;
        delete payload.updatedAt;
        addAsset(payload);
      });
      message.success(t("assets.imported", { count: importedAssets.length }));
    } catch {
      message.error(t("assets.importFailed"));
    } finally {
      if (assetInputRef.current) assetInputRef.current.value = "";
    }
  };
  const confirmDelete = () => {
    if (!deletingAsset) return;
    removeAsset(deletingAsset.id);
    message.success(t("assets.deleted"));
    setDeletingAsset(null);
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "flex h-full flex-col overflow-hidden bg-background text-stone-900 dark:text-stone-100", children: [
    /* @__PURE__ */ jsxDEV("main", { className: "min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] px-6 py-8 [background-size:16px_16px] dark:bg-[radial-gradient(rgba(245,245,244,.14)_1px,transparent_1px)]", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "pb-8", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "mx-auto max-w-5xl text-center", children: [
          /* @__PURE__ */ jsxDEV("h1", { className: "text-4xl font-semibold tracking-tight text-stone-950 dark:text-stone-100", children: t("assets.title") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 190,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "mt-3 text-sm text-stone-500 dark:text-stone-400", children: t("assets.description") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 191,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
          lineNumber: 189,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "mx-auto mt-8 w-full max-w-2xl", children: /* @__PURE__ */ jsxDEV(
          Input.Search,
          {
            className: "w-full",
            size: "large",
            allowClear: true,
            prefix: /* @__PURE__ */ jsxDEV(Search, { className: "size-4 text-stone-400" }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 199,
              columnNumber: 23
            }, this),
            value: keyword,
            placeholder: t("assets.search"),
            onChange: (event) => {
              setPage(1);
              setKeyword(event.target.value);
            },
            onSearch: (value) => {
              setPage(1);
              setKeyword(value);
            }
          },
          void 0,
          false,
          {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 195,
            columnNumber: 25
          },
          this
        ) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
          lineNumber: 194,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "mx-auto mt-6 grid max-w-6xl gap-3 text-left", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "grid gap-2 sm:grid-cols-[56px_minmax(0,1fr)] sm:items-center", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-xs font-medium text-stone-500 dark:text-stone-400", children: t("assets.type") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 216,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap gap-2", children: kindOptions.map(
              (option) => /* @__PURE__ */ jsxDEV(
                Tag.CheckableTag,
                {
                  checked: kindFilter === option,
                  className: cn("prompt-filter-tag", kindFilter === option && "is-active"),
                  onChange: () => {
                    setPage(1);
                    setKindFilter(option);
                  },
                  children: option === "all" ? t("common.all") : t(`assets.kinds.${option}`)
                },
                option,
                false,
                {
                  fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
                  lineNumber: 219,
                  columnNumber: 19
                },
                this
              )
            ) }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 217,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 215,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap gap-4", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                className: "cursor-pointer text-sm font-medium text-stone-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline dark:text-stone-300",
                onClick: () => void exportAllAssets(),
                children: t("assets.export")
              },
              void 0,
              false,
              {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
                lineNumber: 234,
                columnNumber: 33
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                className: "cursor-pointer text-sm font-medium text-stone-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline dark:text-stone-300",
                onClick: () => assetInputRef.current?.click(),
                children: t("assets.import")
              },
              void 0,
              false,
              {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
                lineNumber: 241,
                columnNumber: 33
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                className: "cursor-pointer text-sm font-medium text-stone-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline dark:text-stone-300",
                onClick: openCreate,
                children: t("assets.add")
              },
              void 0,
              false,
              {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
                lineNumber: 248,
                columnNumber: 33
              },
              this
            )
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 233,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
          lineNumber: 214,
          columnNumber: 25
        }, this) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
          lineNumber: 213,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 188,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "mx-auto flex max-w-7xl flex-col gap-5", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: visibleAssets.map(
          (asset) => /* @__PURE__ */ jsxDEV(AssetCard, { asset, onOpen: () => setPreviewAsset(asset), onEdit: () => openEdit(asset), onCopy: copyAssetText, onDownload: downloadImage, onDelete: () => setDeletingAsset(asset) }, asset.id, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 263,
            columnNumber: 13
          }, this)
        ) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
          lineNumber: 261,
          columnNumber: 21
        }, this),
        !visibleAssets.length ? /* @__PURE__ */ jsxDEV(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE, description: t("assets.empty"), className: "py-20" }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
          lineNumber: 267,
          columnNumber: 46
        }, this) : null,
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxDEV(
          Pagination,
          {
            current: page,
            pageSize,
            total: filteredAssets.length,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            }
          },
          void 0,
          false,
          {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 270,
            columnNumber: 25
          },
          this
        ) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
          lineNumber: 269,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 260,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
      lineNumber: 187,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(Modal, { title: editingAsset ? t("assets.edit") : t("assets.add"), open: isAssetOpen, width: 980, onCancel: () => setIsAssetOpen(false), onOk: () => void saveAsset(), okText: t("common.save"), cancelText: t("common.cancel"), destroyOnHidden: true, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "grid gap-6 pt-1 lg:grid-cols-[minmax(0,1fr)_320px]", children: [
        /* @__PURE__ */ jsxDEV(Form, { form, layout: "vertical", requiredMark: false, initialValues: { kind: "text", tags: [] }, children: [
          /* @__PURE__ */ jsxDEV(Form.Item, { name: "kind", label: t("assets.type"), children: /* @__PURE__ */ jsxDEV(
            Select,
            {
              options: [
                { label: t("assets.kinds.text"), value: "text" },
                { label: t("assets.kinds.image"), value: "image" }
              ],
              onChange: (value) => setFormKind(value)
            },
            void 0,
            false,
            {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 289,
              columnNumber: 29
            },
            this
          ) }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 288,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV(Form.Item, { name: "title", label: t("assets.fields.title"), rules: [{ required: true, message: t("assets.fields.titleRequired") }], children: /* @__PURE__ */ jsxDEV(Input, { size: "large", placeholder: t("assets.fields.titlePlaceholder") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 298,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 297,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV(Form.Item, { name: "coverUrl", label: t("assets.fields.coverUrl"), children: /* @__PURE__ */ jsxDEV(Space.Compact, { className: "w-full", children: [
            /* @__PURE__ */ jsxDEV(Input, { placeholder: t("assets.fields.coverPlaceholder") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 302,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV(Button, { icon: /* @__PURE__ */ jsxDEV(Upload, { className: "size-3.5" }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 303,
              columnNumber: 47
            }, this), onClick: () => coverInputRef.current?.click(), children: t("common.upload") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 303,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 301,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 300,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV(Form.Item, { name: "tags", label: t("assets.fields.tags"), children: /* @__PURE__ */ jsxDEV(Select, { mode: "tags", tokenSeparators: [",", "，"], placeholder: t("assets.fields.tagsPlaceholder") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 309,
            columnNumber: 29
          }, this) }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 308,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxDEV(Form.Item, { name: "source", label: t("assets.fields.source"), children: /* @__PURE__ */ jsxDEV(Input, { placeholder: t("assets.fields.sourcePlaceholder") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 313,
              columnNumber: 33
            }, this) }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 312,
              columnNumber: 29
            }, this),
            /* @__PURE__ */ jsxDEV(Form.Item, { name: "note", label: t("assets.fields.note"), children: /* @__PURE__ */ jsxDEV(Input, { placeholder: t("assets.fields.optional") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 316,
              columnNumber: 33
            }, this) }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 315,
              columnNumber: 29
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 311,
            columnNumber: 25
          }, this),
          formKind === "text" ? /* @__PURE__ */ jsxDEV(Form.Item, { name: "content", label: t("assets.fields.textContent"), rules: [{ required: true, message: t("assets.fields.textRequired") }], children: /* @__PURE__ */ jsxDEV(Input.TextArea, { rows: 8, placeholder: t("assets.fields.textPlaceholder") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 321,
            columnNumber: 33
          }, this) }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 320,
            columnNumber: 13
          }, this) : /* @__PURE__ */ jsxDEV(Form.Item, { label: t("assets.fields.imageContent"), required: true, children: /* @__PURE__ */ jsxDEV("div", { className: "rounded-lg border border-dashed border-stone-300 p-4 dark:border-stone-700", children: [
            /* @__PURE__ */ jsxDEV(Button, { icon: /* @__PURE__ */ jsxDEV(Upload, { className: "size-4" }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 326,
              columnNumber: 51
            }, this), onClick: () => imageInputRef.current?.click(), children: t("assets.selectImageFile") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 326,
              columnNumber: 37
            }, this),
            imageDraft ? /* @__PURE__ */ jsxDEV(Typography.Text, { type: "secondary", className: "ml-3 text-xs", children: [
              imageDraft.width,
              "x",
              imageDraft.height,
              " · ",
              formatBytes(imageDraft.bytes)
            ] }, void 0, true, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 330,
              columnNumber: 17
            }, this) : /* @__PURE__ */ jsxDEV(Typography.Text, { type: "secondary", className: "ml-3 text-xs", children: t("assets.noImageSelected") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 334,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 325,
            columnNumber: 33
          }, this) }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 324,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
          lineNumber: 287,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950", children: [
          /* @__PURE__ */ jsxDEV(Typography.Text, { strong: true, children: t("assets.preview") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 343,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "mt-3 overflow-hidden rounded-lg border border-stone-200 bg-background dark:border-stone-800", children: [
            coverUrl || imageDraft?.dataUrl ? /* @__PURE__ */ jsxDEV("img", { src: coverUrl || imageDraft?.dataUrl, alt: "", className: "aspect-[4/3] w-full object-cover" }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 346,
              columnNumber: 15
            }, this) : /* @__PURE__ */ jsxDEV("div", { className: "flex aspect-[4/3] items-center justify-center bg-stone-100 p-5 text-center text-sm text-stone-500 dark:bg-stone-900", children: content || t("assets.noCover") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 348,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "p-4", children: [
              /* @__PURE__ */ jsxDEV(Typography.Text, { strong: true, ellipsis: true, className: "block", children: title || t("assets.untitled") }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
                lineNumber: 351,
                columnNumber: 33
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "mt-2 flex flex-wrap gap-1.5", children: tags.length ? tags.map(
                (tag) => /* @__PURE__ */ jsxDEV(Tag, { className: "m-0", children: tag }, tag, false, {
                  fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
                  lineNumber: 357,
                  columnNumber: 19
                }, this)
              ) : /* @__PURE__ */ jsxDEV(Tag, { className: "m-0", children: t("assets.untagged") }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
                lineNumber: 362,
                columnNumber: 19
              }, this) }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
                lineNumber: 354,
                columnNumber: 33
              }, this)
            ] }, void 0, true, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 350,
              columnNumber: 29
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 344,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
          lineNumber: 342,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 286,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          ref: coverInputRef,
          type: "file",
          accept: "image/*",
          className: "hidden",
          onChange: (event) => {
            void readCoverFile(event.target.files?.[0]);
            event.target.value = "";
          }
        },
        void 0,
        false,
        {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
          lineNumber: 369,
          columnNumber: 17
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          ref: imageInputRef,
          type: "file",
          accept: "image/*",
          className: "hidden",
          onChange: (event) => {
            void readImageFile(event.target.files?.[0]);
            event.target.value = "";
          }
        },
        void 0,
        false,
        {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
          lineNumber: 379,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
      lineNumber: 285,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(AssetDrawer, { asset: previewAsset, onClose: () => setPreviewAsset(null), onCopy: copyAssetText, onDownload: downloadImage }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
      lineNumber: 391,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("input", { ref: assetInputRef, type: "file", accept: "application/zip,.zip", className: "hidden", onChange: (event) => void importAssetZip(event.target.files?.[0]) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
      lineNumber: 393,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(Modal, { title: t("assets.deleteTitle"), open: Boolean(deletingAsset), onCancel: () => setDeletingAsset(null), onOk: confirmDelete, okText: t("common.delete"), okButtonProps: { danger: true }, cancelText: t("common.cancel"), children: t("assets.deleteConfirm", { name: deletingAsset?.title }) }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
      lineNumber: 395,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
    lineNumber: 186,
    columnNumber: 5
  }, this);
}
_s(AssetsPage, "yrAEDMhh1+qcPcx0FK9MluLnGJ8=", false, function() {
  return [App.useApp, useTranslation, useCopyText, Form.useForm, useAssetStore, useAssetStore, useAssetStore, useAssetStore, Form.useWatch, Form.useWatch, Form.useWatch, Form.useWatch];
});
_c = AssetsPage;
function AssetCard({ asset, onOpen, onEdit, onCopy, onDownload, onDelete }) {
  _s2();
  const { t } = useTranslation();
  const cover = asset.coverUrl || (asset.kind === "image" ? asset.data.dataUrl : "");
  const summary = assetSummary(asset);
  return /* @__PURE__ */ jsxDEV(
    Card,
    {
      hoverable: true,
      className: "overflow-hidden",
      styles: { body: { padding: 0 } },
      cover: /* @__PURE__ */ jsxDEV("button", { type: "button", className: "block w-full text-left", onClick: onOpen, children: cover ? /* @__PURE__ */ jsxDEV("img", { src: cover, alt: asset.title, className: "aspect-[4/3] w-full object-cover" }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 414,
        columnNumber: 9
      }, this) : /* @__PURE__ */ jsxDEV("div", { className: "flex aspect-[4/3] items-center justify-center bg-stone-100 p-5 text-center text-sm leading-6 text-stone-600 dark:bg-stone-900 dark:text-stone-300", children: asset.kind === "text" ? asset.data.content : t("assets.noCover") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 416,
        columnNumber: 9
      }, this) }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 412,
        columnNumber: 7
      }, this),
      children: [
        /* @__PURE__ */ jsxDEV("button", { type: "button", className: "block w-full text-left", onClick: onOpen, children: /* @__PURE__ */ jsxDEV("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxDEV("h2", { className: "line-clamp-1 text-sm font-semibold text-stone-950 dark:text-stone-100", children: asset.title }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
                lineNumber: 425,
                columnNumber: 29
              }, this),
              /* @__PURE__ */ jsxDEV(Typography.Text, { type: "secondary", className: "mt-1 block text-xs", children: asset.source || t("assets.unknownSource") }, void 0, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
                lineNumber: 426,
                columnNumber: 29
              }, this)
            ] }, void 0, true, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 424,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV(Tag, { className: "m-0 shrink-0 text-[11px]", children: t(`assets.kinds.${asset.kind}`) }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 430,
              columnNumber: 25
            }, this)
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 423,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV(Typography.Paragraph, { type: "secondary", ellipsis: { rows: 3 }, className: "!mb-0 !mt-2 !text-xs !leading-5", children: summary }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 432,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "mt-3 flex flex-wrap gap-1.5", children: [
            (asset.tags || []).slice(0, 3).map(
              (tag) => /* @__PURE__ */ jsxDEV(Tag, { className: "m-0 text-[11px]", children: tag }, tag, false, {
                fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
                lineNumber: 437,
                columnNumber: 13
              }, this)
            ),
            !asset.tags?.length ? /* @__PURE__ */ jsxDEV(Tag, { className: "m-0 text-[11px]", children: t("assets.noTags") }, void 0, false, {
              fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
              lineNumber: 441,
              columnNumber: 48
            }, this) : null
          ] }, void 0, true, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 435,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
          lineNumber: 422,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
          lineNumber: 421,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 px-4 pb-4", children: [
          /* @__PURE__ */ jsxDEV(Button, { size: "small", onClick: onOpen, children: t("common.view") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 446,
            columnNumber: 17
          }, this),
          asset.kind !== "video" ? /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(PencilLine, { className: "size-3.5" }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 450,
            columnNumber: 36
          }, this), onClick: onEdit, children: t("common.edit") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 450,
            columnNumber: 9
          }, this) : null,
          asset.kind === "text" ? /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(Copy, { className: "size-3.5" }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 455,
            columnNumber: 36
          }, this), onClick: () => void onCopy(asset), children: t("common.copy") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 455,
            columnNumber: 9
          }, this) : null,
          asset.kind === "image" || asset.kind === "video" ? /* @__PURE__ */ jsxDEV(Button, { size: "small", icon: /* @__PURE__ */ jsxDEV(Download, { className: "size-3.5" }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 460,
            columnNumber: 36
          }, this), onClick: () => onDownload(asset), children: t("common.download") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 460,
            columnNumber: 9
          }, this) : null,
          /* @__PURE__ */ jsxDEV(Button, { size: "small", danger: true, icon: /* @__PURE__ */ jsxDEV(Trash2, { className: "size-3.5" }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 464,
            columnNumber: 51
          }, this), onClick: onDelete, children: t("common.delete") }, void 0, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 464,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
          lineNumber: 445,
          columnNumber: 13
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
      lineNumber: 407,
      columnNumber: 5
    },
    this
  );
}
_s2(AssetCard, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
  return [useTranslation];
});
_c2 = AssetCard;
function AssetDrawer({ asset, onClose, onCopy, onDownload }) {
  _s3();
  const { t } = useTranslation();
  const cover = asset ? asset.coverUrl || (asset.kind === "image" ? asset.data.dataUrl : "") : "";
  return /* @__PURE__ */ jsxDEV(Drawer, { title: t("assets.details"), open: Boolean(asset), size: "large", onClose, children: asset ? /* @__PURE__ */ jsxDEV("div", { className: "space-y-5", children: [
    cover ? /* @__PURE__ */ jsxDEV(Image, { src: cover, alt: asset.title, className: "rounded-lg" }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
      lineNumber: 480,
      columnNumber: 9
    }, this) : /* @__PURE__ */ jsxDEV("div", { className: "rounded-lg border border-stone-200 bg-stone-50 p-5 text-sm leading-6 text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300", children: asset.kind === "text" ? asset.data.content : t("assets.noCover") }, void 0, false, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
      lineNumber: 482,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV(Typography.Title, { level: 4, className: "!mb-2", children: asset.title }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 485,
        columnNumber: 25
      }, this),
      /* @__PURE__ */ jsxDEV(Space, { size: [4, 4], wrap: true, children: [
        /* @__PURE__ */ jsxDEV(Tag, { children: t(`assets.kinds.${asset.kind}`) }, void 0, false, {
          fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
          lineNumber: 489,
          columnNumber: 29
        }, this),
        (asset.tags || []).map(
          (tag) => /* @__PURE__ */ jsxDEV(Tag, { children: tag }, tag, false, {
            fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
            lineNumber: 491,
            columnNumber: 13
          }, this)
        )
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 488,
        columnNumber: 25
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
      lineNumber: 484,
      columnNumber: 21
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "rounded-lg border border-stone-200 p-4 dark:border-stone-800", children: [
      /* @__PURE__ */ jsxDEV(Typography.Text, { type: "secondary", className: "block text-xs", children: t("assets.fields.textContent") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 496,
        columnNumber: 25
      }, this),
      asset.kind === "text" ? /* @__PURE__ */ jsxDEV(Typography.Paragraph, { className: "mt-2 whitespace-pre-wrap", children: asset.data.content }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 500,
        columnNumber: 11
      }, this) : asset.kind === "video" ? /* @__PURE__ */ jsxDEV("video", { src: asset.data.url, controls: true, className: "mt-2 aspect-video w-full rounded-lg bg-black" }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 502,
        columnNumber: 11
      }, this) : /* @__PURE__ */ jsxDEV(Typography.Text, { className: "mt-2 block", children: [
        asset.data.width,
        "x",
        asset.data.height,
        " · ",
        formatBytes(asset.data.bytes),
        " · ",
        asset.data.mimeType
      ] }, void 0, true, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 504,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
      lineNumber: 495,
      columnNumber: 21
    }, this),
    asset.note ? /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV(Typography.Text, { type: "secondary", children: t("assets.fields.note") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 511,
        columnNumber: 29
      }, this),
      /* @__PURE__ */ jsxDEV(Typography.Paragraph, { className: "mt-1", children: asset.note }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 512,
        columnNumber: 29
      }, this)
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
      lineNumber: 510,
      columnNumber: 9
    }, this) : null,
    /* @__PURE__ */ jsxDEV(Space, { children: [
      asset.kind === "text" ? /* @__PURE__ */ jsxDEV(Button, { type: "primary", icon: /* @__PURE__ */ jsxDEV(Copy, { className: "size-4" }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 517,
        columnNumber: 40
      }, this), onClick: () => onCopy(asset), children: t("assets.copyText") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 517,
        columnNumber: 11
      }, this) : null,
      asset.kind === "image" || asset.kind === "video" ? /* @__PURE__ */ jsxDEV(Button, { type: "primary", icon: /* @__PURE__ */ jsxDEV(Download, { className: "size-4" }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 522,
        columnNumber: 40
      }, this), onClick: () => onDownload(asset), children: asset.kind === "video" ? t("assets.downloadVideo") : t("assets.downloadImage") }, void 0, false, {
        fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
        lineNumber: 522,
        columnNumber: 11
      }, this) : null
    ] }, void 0, true, {
      fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
      lineNumber: 515,
      columnNumber: 21
    }, this)
  ] }, void 0, true, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
    lineNumber: 478,
    columnNumber: 7
  }, this) : null }, void 0, false, {
    fileName: "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx",
    lineNumber: 476,
    columnNumber: 5
  }, this);
}
_s3(AssetDrawer, "zlIdU9EjM2llFt74AbE2KsUJXyM=", false, function() {
  return [useTranslation];
});
_c3 = AssetDrawer;
function assetSummary(asset) {
  if (asset.kind === "text") return asset.data.content;
  return `${asset.data.width}x${asset.data.height} · ${formatBytes(asset.data.bytes)} · ${asset.data.mimeType}`;
}
function assetSearchText(asset) {
  return [asset.title, asset.source || "", asset.note || "", (asset.tags || []).join(" "), asset.kind === "text" ? asset.data.content : asset.data.mimeType].join(" ").toLowerCase();
}
var _c, _c2, _c3;
$RefreshReg$(_c, "AssetsPage");
$RefreshReg$(_c2, "AssetCard");
$RefreshReg$(_c3, "AssetDrawer");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web/src/pages/assets/index.tsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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LGdCQUFNQyxTQUFTLFVBQVV4QyxFQUFFLHNCQUFzQixJQUFJQSxFQUFFLHNCQUFzQixLQURsRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGFBRUEsSUFDQTtBQUFBLFNBVlI7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQVdBO0FBQUEsT0FoREo7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQWlEQSxJQUNBLFFBcERSO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FxREE7QUFFUjtBQUFDbUksSUEzRFFGLGFBQVc7QUFBQSxVQUNGL0ksY0FBYztBQUFBO0FBQUEsTUFEdkIrSTtBQTZEVCxTQUFTSixhQUFhdEYsT0FBYztBQUNoQyxNQUFJQSxNQUFNQyxTQUFTLE9BQVEsUUFBT0QsTUFBTXVCLEtBQUsxQjtBQUM3QyxTQUFPLEdBQUdHLE1BQU11QixLQUFLb0IsS0FBSyxJQUFJM0MsTUFBTXVCLEtBQUtxQixNQUFNLE1BQU0vRixZQUFZbUQsTUFBTXVCLEtBQUtzQixLQUFLLENBQUMsTUFBTTdDLE1BQU11QixLQUFLdUIsUUFBUTtBQUMvRztBQUVBLFNBQVN4QyxnQkFBZ0JOLE9BQWM7QUFDbkMsU0FBTyxDQUFDQSxNQUFNTCxPQUFPSyxNQUFNb0IsVUFBVSxJQUFJcEIsTUFBTXFCLFFBQVEsS0FBS3JCLE1BQU1KLFFBQVEsSUFBSWlHLEtBQUssR0FBRyxHQUFHN0YsTUFBTUMsU0FBUyxTQUFTRCxNQUFNdUIsS0FBSzFCLFVBQVVHLE1BQU11QixLQUFLdUIsUUFBUSxFQUFFK0MsS0FBSyxHQUFHLEVBQUV4RixZQUFZO0FBQ3JMO0FBQUMsSUFBQXlGLElBQUFDLEtBQUFDO0FBQUEsYUFBQUYsSUFBQTtBQUFBLGFBQUFDLEtBQUE7QUFBQSxhQUFBQyxLQUFBIiwibmFtZXMiOlsiQ29weSIsIkRvd25sb2FkIiwiUGVuY2lsTGluZSIsIlNlYXJjaCIsIlRyYXNoMiIsIlVwbG9hZCIsInVzZUVmZmVjdCIsInVzZU1lbW8iLCJ1c2VSZWYiLCJ1c2VTdGF0ZSIsIkFwcCIsIkJ1dHRvbiIsIkNhcmQiLCJEcmF3ZXIiLCJFbXB0eSIsIkZvcm0iLCJJbWFnZSIsIklucHV0IiwiTW9kYWwiLCJQYWdpbmF0aW9uIiwiU2VsZWN0IiwiU3BhY2UiLCJUYWciLCJUeXBvZ3JhcGh5Iiwic2F2ZUFzIiwidXNlVHJhbnNsYXRpb24iLCJ1c2VDb3B5VGV4dCIsImZvcm1hdEJ5dGVzIiwicmVhZEZpbGVBc0RhdGFVcmwiLCJ1cGxvYWRJbWFnZSIsImNuIiwidXNlQXNzZXRTdG9yZSIsImV4cG9ydEFzc2V0cyIsInJlYWRBc3NldFBhY2thZ2UiLCJraW5kT3B0aW9ucyIsIkFzc2V0c1BhZ2UiLCJfcyIsIm1lc3NhZ2UiLCJ1c2VBcHAiLCJ0IiwiY29weVRleHQiLCJmb3JtIiwidXNlRm9ybSIsImNvdmVySW5wdXRSZWYiLCJpbWFnZUlucHV0UmVmIiwiYXNzZXRJbnB1dFJlZiIsImFzc2V0cyIsInN0YXRlIiwiYWRkQXNzZXQiLCJ1cGRhdGVBc3NldCIsInJlbW92ZUFzc2V0Iiwia2V5d29yZCIsInNldEtleXdvcmQiLCJraW5kRmlsdGVyIiwic2V0S2luZEZpbHRlciIsInBhZ2UiLCJzZXRQYWdlIiwicGFnZVNpemUiLCJzZXRQYWdlU2l6ZSIsImVkaXRpbmdBc3NldCIsInNldEVkaXRpbmdBc3NldCIsImlzQXNzZXRPcGVuIiwic2V0SXNBc3NldE9wZW4iLCJwcmV2aWV3QXNzZXQiLCJzZXRQcmV2aWV3QXNzZXQiLCJkZWxldGluZ0Fzc2V0Iiwic2V0RGVsZXRpbmdBc3NldCIsImZvcm1LaW5kIiwic2V0Rm9ybUtpbmQiLCJpbWFnZURyYWZ0Iiwic2V0SW1hZ2VEcmFmdCIsImNvdmVyVXJsIiwidXNlV2F0Y2giLCJ0aXRsZSIsInRhZ3MiLCJjb250ZW50IiwidmFsaWRBc3NldHMiLCJmaWx0ZXIiLCJhc3NldCIsImtpbmQiLCJmaWx0ZXJlZEFzc2V0cyIsInF1ZXJ5IiwidHJpbSIsInRvTG93ZXJDYXNlIiwiYXNzZXRTZWFyY2hUZXh0IiwiaW5jbHVkZXMiLCJ2aXNpYmxlQXNzZXRzIiwic3RhcnQiLCJzbGljZSIsIm1heFBhZ2UiLCJNYXRoIiwibWF4IiwiY2VpbCIsImxlbmd0aCIsInZhbHVlIiwibWluIiwib3BlbkNyZWF0ZSIsInNldEZpZWxkc1ZhbHVlIiwic291cmNlIiwibm90ZSIsIm9wZW5FZGl0IiwiZGF0YSIsInNhdmVBc3NldCIsInZhbHVlcyIsInZhbGlkYXRlRmllbGRzIiwiYmFzZSIsImRhdGFVcmwiLCJtZXRhZGF0YSIsImlkIiwiZXJyb3IiLCJzdWNjZXNzIiwicmVhZENvdmVyRmlsZSIsImZpbGUiLCJzZXRGaWVsZFZhbHVlIiwicmVhZEltYWdlRmlsZSIsInR5cGUiLCJzdGFydHNXaXRoIiwiaW1hZ2UiLCJkcmFmdCIsInVybCIsInN0b3JhZ2VLZXkiLCJ3aWR0aCIsImhlaWdodCIsImJ5dGVzIiwibWltZVR5cGUiLCJnZXRGaWVsZFZhbHVlIiwibmFtZSIsImNvcHlBc3NldFRleHQiLCJkb3dubG9hZEltYWdlIiwic3BsaXQiLCJleHBvcnRBbGxBc3NldHMiLCJ3YXJuaW5nIiwiaW1wb3J0QXNzZXRaaXAiLCJpbXBvcnRlZEFzc2V0cyIsImZvckVhY2giLCJwYXlsb2FkIiwiY3JlYXRlZEF0IiwidXBkYXRlZEF0IiwiY291bnQiLCJjdXJyZW50IiwiY29uZmlybURlbGV0ZSIsImV2ZW50IiwidGFyZ2V0IiwibWFwIiwib3B0aW9uIiwiY2xpY2siLCJQUkVTRU5URURfSU1BR0VfU0lNUExFIiwibmV4dFBhZ2UiLCJuZXh0UGFnZVNpemUiLCJsYWJlbCIsInJlcXVpcmVkIiwidGFnIiwiZmlsZXMiLCJCb29sZWFuIiwiZGFuZ2VyIiwiQXNzZXRDYXJkIiwib25PcGVuIiwib25FZGl0Iiwib25Db3B5Iiwib25Eb3dubG9hZCIsIm9uRGVsZXRlIiwiX3MyIiwiY292ZXIiLCJzdW1tYXJ5IiwiYXNzZXRTdW1tYXJ5IiwiYm9keSIsInBhZGRpbmciLCJyb3dzIiwiQXNzZXREcmF3ZXIiLCJvbkNsb3NlIiwiX3MzIiwiam9pbiIsIl9jIiwiX2MyIiwiX2MzIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb3B5LCBEb3dubG9hZCwgUGVuY2lsTGluZSwgU2VhcmNoLCBUcmFzaDIsIFVwbG9hZCB9IGZyb20gXCJsdWNpZGUtcmVhY3RcIjtcbmltcG9ydCB7IHVzZUVmZmVjdCwgdXNlTWVtbywgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgQXBwLCBCdXR0b24sIENhcmQsIERyYXdlciwgRW1wdHksIEZvcm0sIEltYWdlLCBJbnB1dCwgTW9kYWwsIFBhZ2luYXRpb24sIFNlbGVjdCwgU3BhY2UsIFRhZywgVHlwb2dyYXBoeSB9IGZyb20gXCJhbnRkXCI7XG5pbXBvcnQgeyBzYXZlQXMgfSBmcm9tIFwiZmlsZS1zYXZlclwiO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tIFwicmVhY3QtaTE4bmV4dFwiO1xuXG5pbXBvcnQgeyB1c2VDb3B5VGV4dCB9IGZyb20gXCJAL2hvb2tzL3VzZS1jb3B5LXRleHRcIjtcbmltcG9ydCB7IGZvcm1hdEJ5dGVzLCByZWFkRmlsZUFzRGF0YVVybCB9IGZyb20gXCJAL2xpYi9pbWFnZS11dGlsc1wiO1xuaW1wb3J0IHsgdXBsb2FkSW1hZ2UgfSBmcm9tIFwiQC9zZXJ2aWNlcy9pbWFnZS1zdG9yYWdlXCI7XG5pbXBvcnQgeyBjbiB9IGZyb20gXCJAL2xpYi91dGlsc1wiO1xuaW1wb3J0IHsgdXNlQXNzZXRTdG9yZSwgdHlwZSBBc3NldCwgdHlwZSBBc3NldEtpbmQsIHR5cGUgSW1hZ2VBc3NldCB9IGZyb20gXCJAL3N0b3Jlcy91c2UtYXNzZXQtc3RvcmVcIjtcbmltcG9ydCB7IGV4cG9ydEFzc2V0cywgcmVhZEFzc2V0UGFja2FnZSB9IGZyb20gXCIuL2Fzc2V0LXRyYW5zZmVyXCI7XG5cbnR5cGUgQXNzZXRGb3JtVmFsdWVzID0ge1xuICAgIGtpbmQ6IEFzc2V0S2luZDtcbiAgICB0aXRsZTogc3RyaW5nO1xuICAgIGNvdmVyVXJsOiBzdHJpbmc7XG4gICAgdGFnczogc3RyaW5nW107XG4gICAgc291cmNlPzogc3RyaW5nO1xuICAgIG5vdGU/OiBzdHJpbmc7XG4gICAgY29udGVudD86IHN0cmluZztcbn07XG5cbnR5cGUgSW1hZ2VEcmFmdCA9IEltYWdlQXNzZXRbXCJkYXRhXCJdIHwgbnVsbDtcblxuY29uc3Qga2luZE9wdGlvbnMgPSBbXCJhbGxcIiwgXCJ0ZXh0XCIsIFwiaW1hZ2VcIiwgXCJ2aWRlb1wiXSBhcyBjb25zdDtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQXNzZXRzUGFnZSgpIHtcbiAgICBjb25zdCB7IG1lc3NhZ2UgfSA9IEFwcC51c2VBcHAoKTtcbiAgICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gICAgY29uc3QgY29weVRleHQgPSB1c2VDb3B5VGV4dCgpO1xuICAgIGNvbnN0IFtmb3JtXSA9IEZvcm0udXNlRm9ybTxBc3NldEZvcm1WYWx1ZXM+KCk7XG4gICAgY29uc3QgY292ZXJJbnB1dFJlZiA9IHVzZVJlZjxIVE1MSW5wdXRFbGVtZW50PihudWxsKTtcbiAgICBjb25zdCBpbWFnZUlucHV0UmVmID0gdXNlUmVmPEhUTUxJbnB1dEVsZW1lbnQ+KG51bGwpO1xuICAgIGNvbnN0IGFzc2V0SW5wdXRSZWYgPSB1c2VSZWY8SFRNTElucHV0RWxlbWVudD4obnVsbCk7XG4gICAgY29uc3QgYXNzZXRzID0gdXNlQXNzZXRTdG9yZSgoc3RhdGUpID0+IHN0YXRlLmFzc2V0cyk7XG4gICAgY29uc3QgYWRkQXNzZXQgPSB1c2VBc3NldFN0b3JlKChzdGF0ZSkgPT4gc3RhdGUuYWRkQXNzZXQpO1xuICAgIGNvbnN0IHVwZGF0ZUFzc2V0ID0gdXNlQXNzZXRTdG9yZSgoc3RhdGUpID0+IHN0YXRlLnVwZGF0ZUFzc2V0KTtcbiAgICBjb25zdCByZW1vdmVBc3NldCA9IHVzZUFzc2V0U3RvcmUoKHN0YXRlKSA9PiBzdGF0ZS5yZW1vdmVBc3NldCk7XG4gICAgY29uc3QgW2tleXdvcmQsIHNldEtleXdvcmRdID0gdXNlU3RhdGUoXCJcIik7XG4gICAgY29uc3QgW2tpbmRGaWx0ZXIsIHNldEtpbmRGaWx0ZXJdID0gdXNlU3RhdGU8QXNzZXRLaW5kIHwgXCJhbGxcIj4oXCJhbGxcIik7XG4gICAgY29uc3QgW3BhZ2UsIHNldFBhZ2VdID0gdXNlU3RhdGUoMSk7XG4gICAgY29uc3QgW3BhZ2VTaXplLCBzZXRQYWdlU2l6ZV0gPSB1c2VTdGF0ZSgxMCk7XG4gICAgY29uc3QgW2VkaXRpbmdBc3NldCwgc2V0RWRpdGluZ0Fzc2V0XSA9IHVzZVN0YXRlPEFzc2V0IHwgbnVsbD4obnVsbCk7XG4gICAgY29uc3QgW2lzQXNzZXRPcGVuLCBzZXRJc0Fzc2V0T3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW3ByZXZpZXdBc3NldCwgc2V0UHJldmlld0Fzc2V0XSA9IHVzZVN0YXRlPEFzc2V0IHwgbnVsbD4obnVsbCk7XG4gICAgY29uc3QgW2RlbGV0aW5nQXNzZXQsIHNldERlbGV0aW5nQXNzZXRdID0gdXNlU3RhdGU8QXNzZXQgfCBudWxsPihudWxsKTtcbiAgICBjb25zdCBbZm9ybUtpbmQsIHNldEZvcm1LaW5kXSA9IHVzZVN0YXRlPEFzc2V0S2luZD4oXCJ0ZXh0XCIpO1xuICAgIGNvbnN0IFtpbWFnZURyYWZ0LCBzZXRJbWFnZURyYWZ0XSA9IHVzZVN0YXRlPEltYWdlRHJhZnQ+KG51bGwpO1xuICAgIGNvbnN0IGNvdmVyVXJsID0gRm9ybS51c2VXYXRjaChcImNvdmVyVXJsXCIsIGZvcm0pIHx8IFwiXCI7XG4gICAgY29uc3QgdGl0bGUgPSBGb3JtLnVzZVdhdGNoKFwidGl0bGVcIiwgZm9ybSkgfHwgXCJcIjtcbiAgICBjb25zdCB0YWdzID0gRm9ybS51c2VXYXRjaChcInRhZ3NcIiwgZm9ybSkgfHwgW107XG4gICAgY29uc3QgY29udGVudCA9IEZvcm0udXNlV2F0Y2goXCJjb250ZW50XCIsIGZvcm0pIHx8IFwiXCI7XG4gICAgY29uc3QgdmFsaWRBc3NldHMgPSB1c2VNZW1vKCgpID0+IGFzc2V0cy5maWx0ZXIoKGFzc2V0KSA9PiBhc3NldC5raW5kID09PSBcInRleHRcIiB8fCBhc3NldC5raW5kID09PSBcImltYWdlXCIgfHwgYXNzZXQua2luZCA9PT0gXCJ2aWRlb1wiKSwgW2Fzc2V0c10pO1xuXG4gICAgY29uc3QgZmlsdGVyZWRBc3NldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICAgICAgY29uc3QgcXVlcnkgPSBrZXl3b3JkLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICByZXR1cm4gdmFsaWRBc3NldHMuZmlsdGVyKChhc3NldCkgPT4ge1xuICAgICAgICAgICAgaWYgKGtpbmRGaWx0ZXIgIT09IFwiYWxsXCIgJiYgYXNzZXQua2luZCAhPT0ga2luZEZpbHRlcikgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKCFxdWVyeSkgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICByZXR1cm4gYXNzZXRTZWFyY2hUZXh0KGFzc2V0KS5pbmNsdWRlcyhxdWVyeSk7XG4gICAgICAgIH0pO1xuICAgIH0sIFt2YWxpZEFzc2V0cywga2V5d29yZCwga2luZEZpbHRlcl0pO1xuXG4gICAgY29uc3QgdmlzaWJsZUFzc2V0cyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgICAgICBjb25zdCBzdGFydCA9IChwYWdlIC0gMSkgKiBwYWdlU2l6ZTtcbiAgICAgICAgcmV0dXJuIGZpbHRlcmVkQXNzZXRzLnNsaWNlKHN0YXJ0LCBzdGFydCArIHBhZ2VTaXplKTtcbiAgICB9LCBbZmlsdGVyZWRBc3NldHMsIHBhZ2UsIHBhZ2VTaXplXSk7XG5cbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBjb25zdCBtYXhQYWdlID0gTWF0aC5tYXgoMSwgTWF0aC5jZWlsKGZpbHRlcmVkQXNzZXRzLmxlbmd0aCAvIHBhZ2VTaXplKSk7XG4gICAgICAgIHNldFBhZ2UoKHZhbHVlKSA9PiBNYXRoLm1pbih2YWx1ZSwgbWF4UGFnZSkpO1xuICAgIH0sIFtmaWx0ZXJlZEFzc2V0cy5sZW5ndGgsIHBhZ2VTaXplXSk7XG5cbiAgICBjb25zdCBvcGVuQ3JlYXRlID0gKCkgPT4ge1xuICAgICAgICBzZXRFZGl0aW5nQXNzZXQobnVsbCk7XG4gICAgICAgIHNldEltYWdlRHJhZnQobnVsbCk7XG4gICAgICAgIHNldEZvcm1LaW5kKFwidGV4dFwiKTtcbiAgICAgICAgZm9ybS5zZXRGaWVsZHNWYWx1ZSh7IGtpbmQ6IFwidGV4dFwiLCB0aXRsZTogXCJcIiwgY292ZXJVcmw6IFwiXCIsIHRhZ3M6IFtdLCBzb3VyY2U6IHQoXCJhc3NldHMubWFudWFsXCIpLCBub3RlOiBcIlwiLCBjb250ZW50OiBcIlwiIH0pO1xuICAgICAgICBzZXRJc0Fzc2V0T3Blbih0cnVlKTtcbiAgICB9O1xuXG4gICAgY29uc3Qgb3BlbkVkaXQgPSAoYXNzZXQ6IEFzc2V0KSA9PiB7XG4gICAgICAgIHNldEVkaXRpbmdBc3NldChhc3NldCk7XG4gICAgICAgIHNldEZvcm1LaW5kKGFzc2V0LmtpbmQpO1xuICAgICAgICBzZXRJbWFnZURyYWZ0KGFzc2V0LmtpbmQgPT09IFwiaW1hZ2VcIiA/IGFzc2V0LmRhdGEgOiBudWxsKTtcbiAgICAgICAgZm9ybS5zZXRGaWVsZHNWYWx1ZSh7XG4gICAgICAgICAgICBraW5kOiBhc3NldC5raW5kLFxuICAgICAgICAgICAgdGl0bGU6IGFzc2V0LnRpdGxlLFxuICAgICAgICAgICAgY292ZXJVcmw6IGFzc2V0LmNvdmVyVXJsLFxuICAgICAgICAgICAgdGFnczogYXNzZXQudGFncyB8fCBbXSxcbiAgICAgICAgICAgIHNvdXJjZTogYXNzZXQuc291cmNlLFxuICAgICAgICAgICAgbm90ZTogYXNzZXQubm90ZSxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGFzc2V0LmtpbmQgPT09IFwidGV4dFwiID8gYXNzZXQuZGF0YS5jb250ZW50IDogXCJcIixcbiAgICAgICAgfSk7XG4gICAgICAgIHNldElzQXNzZXRPcGVuKHRydWUpO1xuICAgIH07XG5cbiAgICBjb25zdCBzYXZlQXNzZXQgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IGF3YWl0IGZvcm0udmFsaWRhdGVGaWVsZHMoKTtcbiAgICAgICAgY29uc3QgYmFzZSA9IHtcbiAgICAgICAgICAgIHRpdGxlOiB2YWx1ZXMudGl0bGUudHJpbSgpLFxuICAgICAgICAgICAgY292ZXJVcmw6IHZhbHVlcy5jb3ZlclVybD8udHJpbSgpIHx8ICh2YWx1ZXMua2luZCA9PT0gXCJpbWFnZVwiICYmIGltYWdlRHJhZnQgPyBpbWFnZURyYWZ0LmRhdGFVcmwgOiBcIlwiKSxcbiAgICAgICAgICAgIHRhZ3M6IHZhbHVlcy50YWdzIHx8IFtdLFxuICAgICAgICAgICAgc291cmNlOiB2YWx1ZXMuc291cmNlPy50cmltKCksXG4gICAgICAgICAgICBub3RlOiB2YWx1ZXMubm90ZT8udHJpbSgpLFxuICAgICAgICAgICAgbWV0YWRhdGE6IGVkaXRpbmdBc3NldD8ubWV0YWRhdGEgfHwgeyBzb3VyY2U6IFwibWFudWFsXCIgfSxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodmFsdWVzLmtpbmQgPT09IFwidGV4dFwiKSB7XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHsgLi4uYmFzZSwga2luZDogXCJ0ZXh0XCIgYXMgY29uc3QsIGRhdGE6IHsgY29udGVudDogKHZhbHVlcy5jb250ZW50IHx8IFwiXCIpLnRyaW0oKSB9IH07XG4gICAgICAgICAgICBlZGl0aW5nQXNzZXQgPyB1cGRhdGVBc3NldChlZGl0aW5nQXNzZXQuaWQsIGFzc2V0KSA6IGFkZEFzc2V0KGFzc2V0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghaW1hZ2VEcmFmdCkge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UuZXJyb3IodChcImFzc2V0cy5zZWxlY3RJbWFnZVwiKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB7IC4uLmJhc2UsIGtpbmQ6IFwiaW1hZ2VcIiBhcyBjb25zdCwgZGF0YTogaW1hZ2VEcmFmdCB9O1xuICAgICAgICAgICAgZWRpdGluZ0Fzc2V0ID8gdXBkYXRlQXNzZXQoZWRpdGluZ0Fzc2V0LmlkLCBhc3NldCkgOiBhZGRBc3NldChhc3NldCk7XG4gICAgICAgIH1cblxuICAgICAgICBtZXNzYWdlLnN1Y2Nlc3MoZWRpdGluZ0Fzc2V0ID8gdChcImFzc2V0cy51cGRhdGVkXCIpIDogdChcImFzc2V0cy5zYXZlZFwiKSk7XG4gICAgICAgIHNldElzQXNzZXRPcGVuKGZhbHNlKTtcbiAgICB9O1xuXG4gICAgY29uc3QgcmVhZENvdmVyRmlsZSA9IGFzeW5jIChmaWxlPzogRmlsZSkgPT4ge1xuICAgICAgICBpZiAoIWZpbGUpIHJldHVybjtcbiAgICAgICAgY29uc3QgZGF0YVVybCA9IGF3YWl0IHJlYWRGaWxlQXNEYXRhVXJsKGZpbGUpO1xuICAgICAgICBmb3JtLnNldEZpZWxkVmFsdWUoXCJjb3ZlclVybFwiLCBkYXRhVXJsKTtcbiAgICB9O1xuXG4gICAgY29uc3QgcmVhZEltYWdlRmlsZSA9IGFzeW5jIChmaWxlPzogRmlsZSkgPT4ge1xuICAgICAgICBpZiAoIWZpbGUgfHwgIWZpbGUudHlwZS5zdGFydHNXaXRoKFwiaW1hZ2UvXCIpKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGltYWdlID0gYXdhaXQgdXBsb2FkSW1hZ2UoZmlsZSk7XG4gICAgICAgIGNvbnN0IGRyYWZ0ID0geyBkYXRhVXJsOiBpbWFnZS51cmwsIHN0b3JhZ2VLZXk6IGltYWdlLnN0b3JhZ2VLZXksIHdpZHRoOiBpbWFnZS53aWR0aCwgaGVpZ2h0OiBpbWFnZS5oZWlnaHQsIGJ5dGVzOiBpbWFnZS5ieXRlcywgbWltZVR5cGU6IGltYWdlLm1pbWVUeXBlIH07XG4gICAgICAgIHNldEltYWdlRHJhZnQoZHJhZnQpO1xuICAgICAgICBpZiAoIWZvcm0uZ2V0RmllbGRWYWx1ZShcImNvdmVyVXJsXCIpKSBmb3JtLnNldEZpZWxkVmFsdWUoXCJjb3ZlclVybFwiLCBkcmFmdC5kYXRhVXJsKTtcbiAgICAgICAgaWYgKCFmb3JtLmdldEZpZWxkVmFsdWUoXCJ0aXRsZVwiKSkgZm9ybS5zZXRGaWVsZFZhbHVlKFwidGl0bGVcIiwgZmlsZS5uYW1lKTtcbiAgICB9O1xuXG4gICAgY29uc3QgY29weUFzc2V0VGV4dCA9IGFzeW5jIChhc3NldDogQXNzZXQpID0+IHtcbiAgICAgICAgaWYgKGFzc2V0LmtpbmQgIT09IFwidGV4dFwiKSByZXR1cm47XG4gICAgICAgIGNvcHlUZXh0KGFzc2V0LmRhdGEuY29udGVudCwgdChcImFzc2V0cy50ZXh0Q29waWVkXCIpKTtcbiAgICB9O1xuXG4gICAgY29uc3QgZG93bmxvYWRJbWFnZSA9IChhc3NldDogQXNzZXQpID0+IHtcbiAgICAgICAgaWYgKGFzc2V0LmtpbmQgIT09IFwiaW1hZ2VcIiAmJiBhc3NldC5raW5kICE9PSBcInZpZGVvXCIpIHJldHVybjtcbiAgICAgICAgc2F2ZUFzKGFzc2V0LmtpbmQgPT09IFwidmlkZW9cIiA/IGFzc2V0LmRhdGEudXJsIDogYXNzZXQuZGF0YS5kYXRhVXJsLCBgJHthc3NldC50aXRsZSB8fCBcImFzc2V0XCJ9LiR7YXNzZXQuZGF0YS5taW1lVHlwZS5zcGxpdChcIi9cIilbMV0gfHwgXCJwbmdcIn1gKTtcbiAgICB9O1xuXG4gICAgY29uc3QgZXhwb3J0QWxsQXNzZXRzID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBpZiAoIXZhbGlkQXNzZXRzLmxlbmd0aCkge1xuICAgICAgICAgICAgbWVzc2FnZS53YXJuaW5nKHQoXCJhc3NldHMubm9uZVRvRXhwb3J0XCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBleHBvcnRBc3NldHModmFsaWRBc3NldHMsIHQoXCJhc3NldHMucGFja2FnZU5hbWVcIikpO1xuICAgIH07XG5cbiAgICBjb25zdCBpbXBvcnRBc3NldFppcCA9IGFzeW5jIChmaWxlPzogRmlsZSkgPT4ge1xuICAgICAgICBpZiAoIWZpbGUpIHJldHVybjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGltcG9ydGVkQXNzZXRzID0gYXdhaXQgcmVhZEFzc2V0UGFja2FnZShmaWxlKTtcbiAgICAgICAgICAgIGltcG9ydGVkQXNzZXRzLmZvckVhY2goKGFzc2V0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGF5bG9hZCA9IHsgLi4uYXNzZXQgfSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICAgICAgICAgICAgICBkZWxldGUgcGF5bG9hZC5pZDtcbiAgICAgICAgICAgICAgICBkZWxldGUgcGF5bG9hZC5jcmVhdGVkQXQ7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHBheWxvYWQudXBkYXRlZEF0O1xuICAgICAgICAgICAgICAgIGFkZEFzc2V0KHBheWxvYWQgYXMgUGFyYW1ldGVyczx0eXBlb2YgYWRkQXNzZXQ+WzBdKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbWVzc2FnZS5zdWNjZXNzKHQoXCJhc3NldHMuaW1wb3J0ZWRcIiwgeyBjb3VudDogaW1wb3J0ZWRBc3NldHMubGVuZ3RoIH0pKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICBtZXNzYWdlLmVycm9yKHQoXCJhc3NldHMuaW1wb3J0RmFpbGVkXCIpKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGlmIChhc3NldElucHV0UmVmLmN1cnJlbnQpIGFzc2V0SW5wdXRSZWYuY3VycmVudC52YWx1ZSA9IFwiXCI7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgY29uZmlybURlbGV0ZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKCFkZWxldGluZ0Fzc2V0KSByZXR1cm47XG4gICAgICAgIHJlbW92ZUFzc2V0KGRlbGV0aW5nQXNzZXQuaWQpO1xuICAgICAgICBtZXNzYWdlLnN1Y2Nlc3ModChcImFzc2V0cy5kZWxldGVkXCIpKTtcbiAgICAgICAgc2V0RGVsZXRpbmdBc3NldChudWxsKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGgtZnVsbCBmbGV4LWNvbCBvdmVyZmxvdy1oaWRkZW4gYmctYmFja2dyb3VuZCB0ZXh0LXN0b25lLTkwMCBkYXJrOnRleHQtc3RvbmUtMTAwXCI+XG4gICAgICAgICAgICA8bWFpbiBjbGFzc05hbWU9XCJtaW4taC0wIGZsZXgtMSBvdmVyZmxvdy15LWF1dG8gYmctW3JhZGlhbC1ncmFkaWVudCgjZTVlN2ViXzFweCx0cmFuc3BhcmVudF8xcHgpXSBweC02IHB5LTggW2JhY2tncm91bmQtc2l6ZToxNnB4XzE2cHhdIGRhcms6YmctW3JhZGlhbC1ncmFkaWVudChyZ2JhKDI0NSwyNDUsMjQ0LC4xNClfMXB4LHRyYW5zcGFyZW50XzFweCldXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYi04XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXgtYXV0byBtYXgtdy01eGwgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMSBjbGFzc05hbWU9XCJ0ZXh0LTR4bCBmb250LXNlbWlib2xkIHRyYWNraW5nLXRpZ2h0IHRleHQtc3RvbmUtOTUwIGRhcms6dGV4dC1zdG9uZS0xMDBcIj57dChcImFzc2V0cy50aXRsZVwiKX08L2gxPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwibXQtMyB0ZXh0LXNtIHRleHQtc3RvbmUtNTAwIGRhcms6dGV4dC1zdG9uZS00MDBcIj57dChcImFzc2V0cy5kZXNjcmlwdGlvblwiKX08L3A+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXgtYXV0byBtdC04IHctZnVsbCBtYXgtdy0yeGxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxJbnB1dC5TZWFyY2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU9XCJsYXJnZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dDbGVhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWZpeD17PFNlYXJjaCBjbGFzc05hbWU9XCJzaXplLTQgdGV4dC1zdG9uZS00MDBcIiAvPn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17a2V5d29yZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17dChcImFzc2V0cy5zZWFyY2hcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRQYWdlKDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRLZXl3b3JkKGV2ZW50LnRhcmdldC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblNlYXJjaD17KHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFBhZ2UoMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEtleXdvcmQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14LWF1dG8gbXQtNiBncmlkIG1heC13LTZ4bCBnYXAtMyB0ZXh0LWxlZnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtMyBzbTpmbGV4LXJvdyBzbTppdGVtcy1jZW50ZXIgc206anVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdhcC0yIHNtOmdyaWQtY29scy1bNTZweF9taW5tYXgoMCwxZnIpXSBzbTppdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtc3RvbmUtNTAwIGRhcms6dGV4dC1zdG9uZS00MDBcIj57dChcImFzc2V0cy50eXBlXCIpfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7a2luZE9wdGlvbnMubWFwKChvcHRpb24pID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFnLkNoZWNrYWJsZVRhZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e29wdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZD17a2luZEZpbHRlciA9PT0gb3B0aW9ufVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NuKFwicHJvbXB0LWZpbHRlci10YWdcIiwga2luZEZpbHRlciA9PT0gb3B0aW9uICYmIFwiaXMtYWN0aXZlXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0UGFnZSgxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEtpbmRGaWx0ZXIob3B0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtvcHRpb24gPT09IFwiYWxsXCIgPyB0KFwiY29tbW9uLmFsbFwiKSA6IHQoYGFzc2V0cy5raW5kcy4ke29wdGlvbn1gKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L1RhZy5DaGVja2FibGVUYWc+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBnYXAtNFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImN1cnNvci1wb2ludGVyIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1zdG9uZS03MDAgdW5kZXJsaW5lLW9mZnNldC00IGhvdmVyOnVuZGVybGluZSBmb2N1cy12aXNpYmxlOm91dGxpbmUtbm9uZSBmb2N1cy12aXNpYmxlOnVuZGVybGluZSBkYXJrOnRleHQtc3RvbmUtMzAwXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHZvaWQgZXhwb3J0QWxsQXNzZXRzKCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0KFwiYXNzZXRzLmV4cG9ydFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiY3Vyc29yLXBvaW50ZXIgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LXN0b25lLTcwMCB1bmRlcmxpbmUtb2Zmc2V0LTQgaG92ZXI6dW5kZXJsaW5lIGZvY3VzLXZpc2libGU6b3V0bGluZS1ub25lIGZvY3VzLXZpc2libGU6dW5kZXJsaW5lIGRhcms6dGV4dC1zdG9uZS0zMDBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gYXNzZXRJbnB1dFJlZi5jdXJyZW50Py5jbGljaygpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dChcImFzc2V0cy5pbXBvcnRcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImN1cnNvci1wb2ludGVyIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1zdG9uZS03MDAgdW5kZXJsaW5lLW9mZnNldC00IGhvdmVyOnVuZGVybGluZSBmb2N1cy12aXNpYmxlOm91dGxpbmUtbm9uZSBmb2N1cy12aXNpYmxlOnVuZGVybGluZSBkYXJrOnRleHQtc3RvbmUtMzAwXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e29wZW5DcmVhdGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0KFwiYXNzZXRzLmFkZFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14LWF1dG8gZmxleCBtYXgtdy03eGwgZmxleC1jb2wgZ2FwLTVcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdhcC01IHNtOmdyaWQtY29scy0yIGxnOmdyaWQtY29scy0zIHhsOmdyaWQtY29scy00XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7dmlzaWJsZUFzc2V0cy5tYXAoKGFzc2V0KSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEFzc2V0Q2FyZCBrZXk9e2Fzc2V0LmlkfSBhc3NldD17YXNzZXR9IG9uT3Blbj17KCkgPT4gc2V0UHJldmlld0Fzc2V0KGFzc2V0KX0gb25FZGl0PXsoKSA9PiBvcGVuRWRpdChhc3NldCl9IG9uQ29weT17Y29weUFzc2V0VGV4dH0gb25Eb3dubG9hZD17ZG93bmxvYWRJbWFnZX0gb25EZWxldGU9eygpID0+IHNldERlbGV0aW5nQXNzZXQoYXNzZXQpfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgIHshdmlzaWJsZUFzc2V0cy5sZW5ndGggPyA8RW1wdHkgaW1hZ2U9e0VtcHR5LlBSRVNFTlRFRF9JTUFHRV9TSU1QTEV9IGRlc2NyaXB0aW9uPXt0KFwiYXNzZXRzLmVtcHR5XCIpfSBjbGFzc05hbWU9XCJweS0yMFwiIC8+IDogbnVsbH1cblxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxQYWdpbmF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudD17cGFnZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWdlU2l6ZT17cGFnZVNpemV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWw9e2ZpbHRlcmVkQXNzZXRzLmxlbmd0aH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93U2l6ZUNoYW5nZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWdlU2l6ZU9wdGlvbnM9e1sxMCwgMjAsIDUwLCAxMDBdfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsobmV4dFBhZ2UsIG5leHRQYWdlU2l6ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRQYWdlKG5leHRQYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0UGFnZVNpemUobmV4dFBhZ2VTaXplKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L21haW4+XG5cbiAgICAgICAgICAgIDxNb2RhbCB0aXRsZT17ZWRpdGluZ0Fzc2V0ID8gdChcImFzc2V0cy5lZGl0XCIpIDogdChcImFzc2V0cy5hZGRcIil9IG9wZW49e2lzQXNzZXRPcGVufSB3aWR0aD17OTgwfSBvbkNhbmNlbD17KCkgPT4gc2V0SXNBc3NldE9wZW4oZmFsc2UpfSBvbk9rPXsoKSA9PiB2b2lkIHNhdmVBc3NldCgpfSBva1RleHQ9e3QoXCJjb21tb24uc2F2ZVwiKX0gY2FuY2VsVGV4dD17dChcImNvbW1vbi5jYW5jZWxcIil9IGRlc3Ryb3lPbkhpZGRlbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ2FwLTYgcHQtMSBsZzpncmlkLWNvbHMtW21pbm1heCgwLDFmcilfMzIwcHhdXCI+XG4gICAgICAgICAgICAgICAgICAgIDxGb3JtIGZvcm09e2Zvcm19IGxheW91dD1cInZlcnRpY2FsXCIgcmVxdWlyZWRNYXJrPXtmYWxzZX0gaW5pdGlhbFZhbHVlcz17eyBraW5kOiBcInRleHRcIiwgdGFnczogW10gfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9ybS5JdGVtIG5hbWU9XCJraW5kXCIgbGFiZWw9e3QoXCJhc3NldHMudHlwZVwiKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFNlbGVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zPXtbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiB0KFwiYXNzZXRzLmtpbmRzLnRleHRcIiksIHZhbHVlOiBcInRleHRcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogdChcImFzc2V0cy5raW5kcy5pbWFnZVwiKSwgdmFsdWU6IFwiaW1hZ2VcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KHZhbHVlKSA9PiBzZXRGb3JtS2luZCh2YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9ybS5JdGVtPlxuICAgICAgICAgICAgICAgICAgICAgICAgPEZvcm0uSXRlbSBuYW1lPVwidGl0bGVcIiBsYWJlbD17dChcImFzc2V0cy5maWVsZHMudGl0bGVcIil9IHJ1bGVzPXtbeyByZXF1aXJlZDogdHJ1ZSwgbWVzc2FnZTogdChcImFzc2V0cy5maWVsZHMudGl0bGVSZXF1aXJlZFwiKSB9XX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPElucHV0IHNpemU9XCJsYXJnZVwiIHBsYWNlaG9sZGVyPXt0KFwiYXNzZXRzLmZpZWxkcy50aXRsZVBsYWNlaG9sZGVyXCIpfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9Gb3JtLkl0ZW0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9ybS5JdGVtIG5hbWU9XCJjb3ZlclVybFwiIGxhYmVsPXt0KFwiYXNzZXRzLmZpZWxkcy5jb3ZlclVybFwiKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFNwYWNlLkNvbXBhY3QgY2xhc3NOYW1lPVwidy1mdWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxJbnB1dCBwbGFjZWhvbGRlcj17dChcImFzc2V0cy5maWVsZHMuY292ZXJQbGFjZWhvbGRlclwiKX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiBpY29uPXs8VXBsb2FkIGNsYXNzTmFtZT1cInNpemUtMy41XCIgLz59IG9uQ2xpY2s9eygpID0+IGNvdmVySW5wdXRSZWYuY3VycmVudD8uY2xpY2soKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dChcImNvbW1vbi51cGxvYWRcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvU3BhY2UuQ29tcGFjdD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9ybS5JdGVtPlxuICAgICAgICAgICAgICAgICAgICAgICAgPEZvcm0uSXRlbSBuYW1lPVwidGFnc1wiIGxhYmVsPXt0KFwiYXNzZXRzLmZpZWxkcy50YWdzXCIpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8U2VsZWN0IG1vZGU9XCJ0YWdzXCIgdG9rZW5TZXBhcmF0b3JzPXtbXCIsXCIsIFwi77yMXCJdfSBwbGFjZWhvbGRlcj17dChcImFzc2V0cy5maWVsZHMudGFnc1BsYWNlaG9sZGVyXCIpfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9Gb3JtLkl0ZW0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ2FwLTQgc206Z3JpZC1jb2xzLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Rm9ybS5JdGVtIG5hbWU9XCJzb3VyY2VcIiBsYWJlbD17dChcImFzc2V0cy5maWVsZHMuc291cmNlXCIpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPElucHV0IHBsYWNlaG9sZGVyPXt0KFwiYXNzZXRzLmZpZWxkcy5zb3VyY2VQbGFjZWhvbGRlclwiKX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0Zvcm0uSXRlbT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Rm9ybS5JdGVtIG5hbWU9XCJub3RlXCIgbGFiZWw9e3QoXCJhc3NldHMuZmllbGRzLm5vdGVcIil9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8SW5wdXQgcGxhY2Vob2xkZXI9e3QoXCJhc3NldHMuZmllbGRzLm9wdGlvbmFsXCIpfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9ybS5JdGVtPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICB7Zm9ybUtpbmQgPT09IFwidGV4dFwiID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JtLkl0ZW0gbmFtZT1cImNvbnRlbnRcIiBsYWJlbD17dChcImFzc2V0cy5maWVsZHMudGV4dENvbnRlbnRcIil9IHJ1bGVzPXtbeyByZXF1aXJlZDogdHJ1ZSwgbWVzc2FnZTogdChcImFzc2V0cy5maWVsZHMudGV4dFJlcXVpcmVkXCIpIH1dfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPElucHV0LlRleHRBcmVhIHJvd3M9ezh9IHBsYWNlaG9sZGVyPXt0KFwiYXNzZXRzLmZpZWxkcy50ZXh0UGxhY2Vob2xkZXJcIil9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9Gb3JtLkl0ZW0+XG4gICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JtLkl0ZW0gbGFiZWw9e3QoXCJhc3NldHMuZmllbGRzLmltYWdlQ29udGVudFwiKX0gcmVxdWlyZWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLWRhc2hlZCBib3JkZXItc3RvbmUtMzAwIHAtNCBkYXJrOmJvcmRlci1zdG9uZS03MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gaWNvbj17PFVwbG9hZCBjbGFzc05hbWU9XCJzaXplLTRcIiAvPn0gb25DbGljaz17KCkgPT4gaW1hZ2VJbnB1dFJlZi5jdXJyZW50Py5jbGljaygpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dChcImFzc2V0cy5zZWxlY3RJbWFnZUZpbGVcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpbWFnZURyYWZ0ID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUeXBvZ3JhcGh5LlRleHQgdHlwZT1cInNlY29uZGFyeVwiIGNsYXNzTmFtZT1cIm1sLTMgdGV4dC14c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aW1hZ2VEcmFmdC53aWR0aH14e2ltYWdlRHJhZnQuaGVpZ2h0fSDCtyB7Zm9ybWF0Qnl0ZXMoaW1hZ2VEcmFmdC5ieXRlcyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9UeXBvZ3JhcGh5LlRleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUeXBvZ3JhcGh5LlRleHQgdHlwZT1cInNlY29uZGFyeVwiIGNsYXNzTmFtZT1cIm1sLTMgdGV4dC14c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dChcImFzc2V0cy5ub0ltYWdlU2VsZWN0ZWRcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9UeXBvZ3JhcGh5LlRleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0Zvcm0uSXRlbT5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvRm9ybT5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3VuZGVkLXhsIGJvcmRlciBib3JkZXItc3RvbmUtMjAwIGJnLXN0b25lLTUwIHAtNCBkYXJrOmJvcmRlci1zdG9uZS04MDAgZGFyazpiZy1zdG9uZS05NTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxUeXBvZ3JhcGh5LlRleHQgc3Ryb25nPnt0KFwiYXNzZXRzLnByZXZpZXdcIil9PC9UeXBvZ3JhcGh5LlRleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTMgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci1zdG9uZS0yMDAgYmctYmFja2dyb3VuZCBkYXJrOmJvcmRlci1zdG9uZS04MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y292ZXJVcmwgfHwgaW1hZ2VEcmFmdD8uZGF0YVVybCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e2NvdmVyVXJsIHx8IGltYWdlRHJhZnQ/LmRhdGFVcmx9IGFsdD1cIlwiIGNsYXNzTmFtZT1cImFzcGVjdC1bNC8zXSB3LWZ1bGwgb2JqZWN0LWNvdmVyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggYXNwZWN0LVs0LzNdIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBiZy1zdG9uZS0xMDAgcC01IHRleHQtY2VudGVyIHRleHQtc20gdGV4dC1zdG9uZS01MDAgZGFyazpiZy1zdG9uZS05MDBcIj57Y29udGVudCB8fCB0KFwiYXNzZXRzLm5vQ292ZXJcIil9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VHlwb2dyYXBoeS5UZXh0IHN0cm9uZyBlbGxpcHNpcyBjbGFzc05hbWU9XCJibG9ja1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3RpdGxlIHx8IHQoXCJhc3NldHMudW50aXRsZWRcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvVHlwb2dyYXBoeS5UZXh0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTIgZmxleCBmbGV4LXdyYXAgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3RhZ3MubGVuZ3RoID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ3MubWFwKCh0YWcpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhZyBrZXk9e3RhZ30gY2xhc3NOYW1lPVwibS0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dGFnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L1RhZz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFnIGNsYXNzTmFtZT1cIm0tMFwiPnt0KFwiYXNzZXRzLnVudGFnZ2VkXCIpfTwvVGFnPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgIHJlZj17Y292ZXJJbnB1dFJlZn1cbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImZpbGVcIlxuICAgICAgICAgICAgICAgICAgICBhY2NlcHQ9XCJpbWFnZS8qXCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaGlkZGVuXCJcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdm9pZCByZWFkQ292ZXJGaWxlKGV2ZW50LnRhcmdldC5maWxlcz8uWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnRhcmdldC52YWx1ZSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgcmVmPXtpbWFnZUlucHV0UmVmfVxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiZmlsZVwiXG4gICAgICAgICAgICAgICAgICAgIGFjY2VwdD1cImltYWdlLypcIlxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJoaWRkZW5cIlxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2b2lkIHJlYWRJbWFnZUZpbGUoZXZlbnQudGFyZ2V0LmZpbGVzPy5bMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0LnZhbHVlID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9Nb2RhbD5cblxuICAgICAgICAgICAgPEFzc2V0RHJhd2VyIGFzc2V0PXtwcmV2aWV3QXNzZXR9IG9uQ2xvc2U9eygpID0+IHNldFByZXZpZXdBc3NldChudWxsKX0gb25Db3B5PXtjb3B5QXNzZXRUZXh0fSBvbkRvd25sb2FkPXtkb3dubG9hZEltYWdlfSAvPlxuXG4gICAgICAgICAgICA8aW5wdXQgcmVmPXthc3NldElucHV0UmVmfSB0eXBlPVwiZmlsZVwiIGFjY2VwdD1cImFwcGxpY2F0aW9uL3ppcCwuemlwXCIgY2xhc3NOYW1lPVwiaGlkZGVuXCIgb25DaGFuZ2U9eyhldmVudCkgPT4gdm9pZCBpbXBvcnRBc3NldFppcChldmVudC50YXJnZXQuZmlsZXM/LlswXSl9IC8+XG5cbiAgICAgICAgICAgIDxNb2RhbCB0aXRsZT17dChcImFzc2V0cy5kZWxldGVUaXRsZVwiKX0gb3Blbj17Qm9vbGVhbihkZWxldGluZ0Fzc2V0KX0gb25DYW5jZWw9eygpID0+IHNldERlbGV0aW5nQXNzZXQobnVsbCl9IG9uT2s9e2NvbmZpcm1EZWxldGV9IG9rVGV4dD17dChcImNvbW1vbi5kZWxldGVcIil9IG9rQnV0dG9uUHJvcHM9e3sgZGFuZ2VyOiB0cnVlIH19IGNhbmNlbFRleHQ9e3QoXCJjb21tb24uY2FuY2VsXCIpfT5cbiAgICAgICAgICAgICAgICB7dChcImFzc2V0cy5kZWxldGVDb25maXJtXCIsIHsgbmFtZTogZGVsZXRpbmdBc3NldD8udGl0bGUgfSl9XG4gICAgICAgICAgICA8L01vZGFsPlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufVxuXG5mdW5jdGlvbiBBc3NldENhcmQoeyBhc3NldCwgb25PcGVuLCBvbkVkaXQsIG9uQ29weSwgb25Eb3dubG9hZCwgb25EZWxldGUgfTogeyBhc3NldDogQXNzZXQ7IG9uT3BlbjogKCkgPT4gdm9pZDsgb25FZGl0OiAoKSA9PiB2b2lkOyBvbkNvcHk6IChhc3NldDogQXNzZXQpID0+IHZvaWQ7IG9uRG93bmxvYWQ6IChhc3NldDogQXNzZXQpID0+IHZvaWQ7IG9uRGVsZXRlOiAoKSA9PiB2b2lkIH0pIHtcbiAgICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gICAgY29uc3QgY292ZXIgPSBhc3NldC5jb3ZlclVybCB8fCAoYXNzZXQua2luZCA9PT0gXCJpbWFnZVwiID8gYXNzZXQuZGF0YS5kYXRhVXJsIDogXCJcIik7XG4gICAgY29uc3Qgc3VtbWFyeSA9IGFzc2V0U3VtbWFyeShhc3NldCk7XG4gICAgcmV0dXJuIChcbiAgICAgICAgPENhcmRcbiAgICAgICAgICAgIGhvdmVyYWJsZVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwib3ZlcmZsb3ctaGlkZGVuXCJcbiAgICAgICAgICAgIHN0eWxlcz17eyBib2R5OiB7IHBhZGRpbmc6IDAgfSB9fVxuICAgICAgICAgICAgY292ZXI9e1xuICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJsb2NrIHctZnVsbCB0ZXh0LWxlZnRcIiBvbkNsaWNrPXtvbk9wZW59PlxuICAgICAgICAgICAgICAgICAgICB7Y292ZXIgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17Y292ZXJ9IGFsdD17YXNzZXQudGl0bGV9IGNsYXNzTmFtZT1cImFzcGVjdC1bNC8zXSB3LWZ1bGwgb2JqZWN0LWNvdmVyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBhc3BlY3QtWzQvM10gaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJnLXN0b25lLTEwMCBwLTUgdGV4dC1jZW50ZXIgdGV4dC1zbSBsZWFkaW5nLTYgdGV4dC1zdG9uZS02MDAgZGFyazpiZy1zdG9uZS05MDAgZGFyazp0ZXh0LXN0b25lLTMwMFwiPnthc3NldC5raW5kID09PSBcInRleHRcIiA/IGFzc2V0LmRhdGEuY29udGVudCA6IHQoXCJhc3NldHMubm9Db3ZlclwiKX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIH1cbiAgICAgICAgPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYmxvY2sgdy1mdWxsIHRleHQtbGVmdFwiIG9uQ2xpY2s9e29uT3Blbn0+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLXN0YXJ0IGp1c3RpZnktYmV0d2VlbiBnYXAtM1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtaW4tdy0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cImxpbmUtY2xhbXAtMSB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgdGV4dC1zdG9uZS05NTAgZGFyazp0ZXh0LXN0b25lLTEwMFwiPnthc3NldC50aXRsZX08L2gyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUeXBvZ3JhcGh5LlRleHQgdHlwZT1cInNlY29uZGFyeVwiIGNsYXNzTmFtZT1cIm10LTEgYmxvY2sgdGV4dC14c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7YXNzZXQuc291cmNlIHx8IHQoXCJhc3NldHMudW5rbm93blNvdXJjZVwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L1R5cG9ncmFwaHkuVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPFRhZyBjbGFzc05hbWU9XCJtLTAgc2hyaW5rLTAgdGV4dC1bMTFweF1cIj57dChgYXNzZXRzLmtpbmRzLiR7YXNzZXQua2luZH1gKX08L1RhZz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxUeXBvZ3JhcGh5LlBhcmFncmFwaCB0eXBlPVwic2Vjb25kYXJ5XCIgZWxsaXBzaXM9e3sgcm93czogMyB9fSBjbGFzc05hbWU9XCIhbWItMCAhbXQtMiAhdGV4dC14cyAhbGVhZGluZy01XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7c3VtbWFyeX1cbiAgICAgICAgICAgICAgICAgICAgPC9UeXBvZ3JhcGh5LlBhcmFncmFwaD5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC0zIGZsZXggZmxleC13cmFwIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsoYXNzZXQudGFncyB8fCBbXSkuc2xpY2UoMCwgMykubWFwKCh0YWcpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFnIGtleT17dGFnfSBjbGFzc05hbWU9XCJtLTAgdGV4dC1bMTFweF1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3RhZ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L1RhZz5cbiAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgeyFhc3NldC50YWdzPy5sZW5ndGggPyA8VGFnIGNsYXNzTmFtZT1cIm0tMCB0ZXh0LVsxMXB4XVwiPnt0KFwiYXNzZXRzLm5vVGFnc1wiKX08L1RhZz4gOiBudWxsfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBweC00IHBiLTRcIj5cbiAgICAgICAgICAgICAgICA8QnV0dG9uIHNpemU9XCJzbWFsbFwiIG9uQ2xpY2s9e29uT3Blbn0+XG4gICAgICAgICAgICAgICAgICAgIHt0KFwiY29tbW9uLnZpZXdcIil9XG4gICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAge2Fzc2V0LmtpbmQgIT09IFwidmlkZW9cIiA/IChcbiAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiBzaXplPVwic21hbGxcIiBpY29uPXs8UGVuY2lsTGluZSBjbGFzc05hbWU9XCJzaXplLTMuNVwiIC8+fSBvbkNsaWNrPXtvbkVkaXR9PlxuICAgICAgICAgICAgICAgICAgICAgICAge3QoXCJjb21tb24uZWRpdFwiKX1cbiAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgKSA6IG51bGx9XG4gICAgICAgICAgICAgICAge2Fzc2V0LmtpbmQgPT09IFwidGV4dFwiID8gKFxuICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIHNpemU9XCJzbWFsbFwiIGljb249ezxDb3B5IGNsYXNzTmFtZT1cInNpemUtMy41XCIgLz59IG9uQ2xpY2s9eygpID0+IHZvaWQgb25Db3B5KGFzc2V0KX0+XG4gICAgICAgICAgICAgICAgICAgICAgICB7dChcImNvbW1vbi5jb3B5XCIpfVxuICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICApIDogbnVsbH1cbiAgICAgICAgICAgICAgICB7YXNzZXQua2luZCA9PT0gXCJpbWFnZVwiIHx8IGFzc2V0LmtpbmQgPT09IFwidmlkZW9cIiA/IChcbiAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiBzaXplPVwic21hbGxcIiBpY29uPXs8RG93bmxvYWQgY2xhc3NOYW1lPVwic2l6ZS0zLjVcIiAvPn0gb25DbGljaz17KCkgPT4gb25Eb3dubG9hZChhc3NldCl9PlxuICAgICAgICAgICAgICAgICAgICAgICAge3QoXCJjb21tb24uZG93bmxvYWRcIil9XG4gICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICkgOiBudWxsfVxuICAgICAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cInNtYWxsXCIgZGFuZ2VyIGljb249ezxUcmFzaDIgY2xhc3NOYW1lPVwic2l6ZS0zLjVcIiAvPn0gb25DbGljaz17b25EZWxldGV9PlxuICAgICAgICAgICAgICAgICAgICB7dChcImNvbW1vbi5kZWxldGVcIil9XG4gICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9DYXJkPlxuICAgICk7XG59XG5cbmZ1bmN0aW9uIEFzc2V0RHJhd2VyKHsgYXNzZXQsIG9uQ2xvc2UsIG9uQ29weSwgb25Eb3dubG9hZCB9OiB7IGFzc2V0OiBBc3NldCB8IG51bGw7IG9uQ2xvc2U6ICgpID0+IHZvaWQ7IG9uQ29weTogKGFzc2V0OiBBc3NldCkgPT4gdm9pZDsgb25Eb3dubG9hZDogKGFzc2V0OiBBc3NldCkgPT4gdm9pZCB9KSB7XG4gICAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICAgIGNvbnN0IGNvdmVyID0gYXNzZXQgPyBhc3NldC5jb3ZlclVybCB8fCAoYXNzZXQua2luZCA9PT0gXCJpbWFnZVwiID8gYXNzZXQuZGF0YS5kYXRhVXJsIDogXCJcIikgOiBcIlwiO1xuICAgIHJldHVybiAoXG4gICAgICAgIDxEcmF3ZXIgdGl0bGU9e3QoXCJhc3NldHMuZGV0YWlsc1wiKX0gb3Blbj17Qm9vbGVhbihhc3NldCl9IHNpemU9XCJsYXJnZVwiIG9uQ2xvc2U9e29uQ2xvc2V9PlxuICAgICAgICAgICAge2Fzc2V0ID8gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS01XCI+XG4gICAgICAgICAgICAgICAgICAgIHtjb3ZlciA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxJbWFnZSBzcmM9e2NvdmVyfSBhbHQ9e2Fzc2V0LnRpdGxlfSBjbGFzc05hbWU9XCJyb3VuZGVkLWxnXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXN0b25lLTIwMCBiZy1zdG9uZS01MCBwLTUgdGV4dC1zbSBsZWFkaW5nLTYgdGV4dC1zdG9uZS02MDAgZGFyazpib3JkZXItc3RvbmUtODAwIGRhcms6Ymctc3RvbmUtOTAwIGRhcms6dGV4dC1zdG9uZS0zMDBcIj57YXNzZXQua2luZCA9PT0gXCJ0ZXh0XCIgPyBhc3NldC5kYXRhLmNvbnRlbnQgOiB0KFwiYXNzZXRzLm5vQ292ZXJcIil9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8VHlwb2dyYXBoeS5UaXRsZSBsZXZlbD17NH0gY2xhc3NOYW1lPVwiIW1iLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7YXNzZXQudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L1R5cG9ncmFwaHkuVGl0bGU+XG4gICAgICAgICAgICAgICAgICAgICAgICA8U3BhY2Ugc2l6ZT17WzQsIDRdfSB3cmFwPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWc+e3QoYGFzc2V0cy5raW5kcy4ke2Fzc2V0LmtpbmR9YCl9PC9UYWc+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyhhc3NldC50YWdzIHx8IFtdKS5tYXAoKHRhZykgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFnIGtleT17dGFnfT57dGFnfTwvVGFnPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9TcGFjZT5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXN0b25lLTIwMCBwLTQgZGFyazpib3JkZXItc3RvbmUtODAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8VHlwb2dyYXBoeS5UZXh0IHR5cGU9XCJzZWNvbmRhcnlcIiBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3QoXCJhc3NldHMuZmllbGRzLnRleHRDb250ZW50XCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9UeXBvZ3JhcGh5LlRleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICB7YXNzZXQua2luZCA9PT0gXCJ0ZXh0XCIgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFR5cG9ncmFwaHkuUGFyYWdyYXBoIGNsYXNzTmFtZT1cIm10LTIgd2hpdGVzcGFjZS1wcmUtd3JhcFwiPnthc3NldC5kYXRhLmNvbnRlbnR9PC9UeXBvZ3JhcGh5LlBhcmFncmFwaD5cbiAgICAgICAgICAgICAgICAgICAgICAgICkgOiBhc3NldC5raW5kID09PSBcInZpZGVvXCIgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHZpZGVvIHNyYz17YXNzZXQuZGF0YS51cmx9IGNvbnRyb2xzIGNsYXNzTmFtZT1cIm10LTIgYXNwZWN0LXZpZGVvIHctZnVsbCByb3VuZGVkLWxnIGJnLWJsYWNrXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFR5cG9ncmFwaHkuVGV4dCBjbGFzc05hbWU9XCJtdC0yIGJsb2NrXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHthc3NldC5kYXRhLndpZHRofXh7YXNzZXQuZGF0YS5oZWlnaHR9IMK3IHtmb3JtYXRCeXRlcyhhc3NldC5kYXRhLmJ5dGVzKX0gwrcge2Fzc2V0LmRhdGEubWltZVR5cGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9UeXBvZ3JhcGh5LlRleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAge2Fzc2V0Lm5vdGUgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUeXBvZ3JhcGh5LlRleHQgdHlwZT1cInNlY29uZGFyeVwiPnt0KFwiYXNzZXRzLmZpZWxkcy5ub3RlXCIpfTwvVHlwb2dyYXBoeS5UZXh0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUeXBvZ3JhcGh5LlBhcmFncmFwaCBjbGFzc05hbWU9XCJtdC0xXCI+e2Fzc2V0Lm5vdGV9PC9UeXBvZ3JhcGh5LlBhcmFncmFwaD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApIDogbnVsbH1cbiAgICAgICAgICAgICAgICAgICAgPFNwYWNlPlxuICAgICAgICAgICAgICAgICAgICAgICAge2Fzc2V0LmtpbmQgPT09IFwidGV4dFwiID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gdHlwZT1cInByaW1hcnlcIiBpY29uPXs8Q29weSBjbGFzc05hbWU9XCJzaXplLTRcIiAvPn0gb25DbGljaz17KCkgPT4gb25Db3B5KGFzc2V0KX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt0KFwiYXNzZXRzLmNvcHlUZXh0XCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAgICB7YXNzZXQua2luZCA9PT0gXCJpbWFnZVwiIHx8IGFzc2V0LmtpbmQgPT09IFwidmlkZW9cIiA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIHR5cGU9XCJwcmltYXJ5XCIgaWNvbj17PERvd25sb2FkIGNsYXNzTmFtZT1cInNpemUtNFwiIC8+fSBvbkNsaWNrPXsoKSA9PiBvbkRvd25sb2FkKGFzc2V0KX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHthc3NldC5raW5kID09PSBcInZpZGVvXCIgPyB0KFwiYXNzZXRzLmRvd25sb2FkVmlkZW9cIikgOiB0KFwiYXNzZXRzLmRvd25sb2FkSW1hZ2VcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICApIDogbnVsbH1cbiAgICAgICAgICAgICAgICAgICAgPC9TcGFjZT5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICkgOiBudWxsfVxuICAgICAgICA8L0RyYXdlcj5cbiAgICApO1xufVxuXG5mdW5jdGlvbiBhc3NldFN1bW1hcnkoYXNzZXQ6IEFzc2V0KSB7XG4gICAgaWYgKGFzc2V0LmtpbmQgPT09IFwidGV4dFwiKSByZXR1cm4gYXNzZXQuZGF0YS5jb250ZW50O1xuICAgIHJldHVybiBgJHthc3NldC5kYXRhLndpZHRofXgke2Fzc2V0LmRhdGEuaGVpZ2h0fSDCtyAke2Zvcm1hdEJ5dGVzKGFzc2V0LmRhdGEuYnl0ZXMpfSDCtyAke2Fzc2V0LmRhdGEubWltZVR5cGV9YDtcbn1cblxuZnVuY3Rpb24gYXNzZXRTZWFyY2hUZXh0KGFzc2V0OiBBc3NldCkge1xuICAgIHJldHVybiBbYXNzZXQudGl0bGUsIGFzc2V0LnNvdXJjZSB8fCBcIlwiLCBhc3NldC5ub3RlIHx8IFwiXCIsIChhc3NldC50YWdzIHx8IFtdKS5qb2luKFwiIFwiKSwgYXNzZXQua2luZCA9PT0gXCJ0ZXh0XCIgPyBhc3NldC5kYXRhLmNvbnRlbnQgOiBhc3NldC5kYXRhLm1pbWVUeXBlXS5qb2luKFwiIFwiKS50b0xvd2VyQ2FzZSgpO1xufVxuIl0sImZpbGUiOiJFOi9jb2RleC9uaWFubmlhbmFpL3podWFuaHVpeXVhbmdvbmcvaW5maW5pdGUtY2FudmFzL3dlYi9zcmMvcGFnZXMvYXNzZXRzL2luZGV4LnRzeCJ9