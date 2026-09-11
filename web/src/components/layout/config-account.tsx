/**
 * 账号与云同步。
 *
 * 这一页存在的理由：之前数据只活在浏览器的 IndexedDB 里，清一次缓存就全没了，
 * 而且画布里那些 CDN 外链（Agnes 平台的临时地址，缓存只有 1 小时）同步引擎根本
 * 看不见 —— 备份里没有它们。登录后，数据落在服务端，外链也能主动抓回来存档。
 */
import { App, Button, Form, Input, Progress, Space } from "antd";
import { CloudDownload, LogIn, LogOut, RefreshCw, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { syncAppData, type AppSyncDomainKey, type AppSyncProgressEvent } from "@/services/app-sync";
import {
    createBackendTransport,
    fetchBackendUser,
    importExternalUrl,
    listBackendSync,
    loginBackend,
    logoutBackend,
    type BackendUser,
} from "@/services/backend-sync";

type DomainProgress = { stage: string; current?: number; total?: number; status?: "active" | "success" | "exception" };

const domainKeys: AppSyncDomainKey[] = ["canvas", "assets", "image-workbench", "video-workbench"];

function emptyProgress(): Record<AppSyncDomainKey, DomainProgress> {
    return domainKeys.reduce((acc, key) => ({ ...acc, [key]: { stage: "" } }), {} as Record<AppSyncDomainKey, DomainProgress>);
}

function formatBytes(bytes: number) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

export function ConfigAccount() {
    const { message } = App.useApp();
    const { t } = useTranslation();

    const [user, setUser] = useState<BackendUser | null>(null);
    const [checking, setChecking] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loggingIn, setLoggingIn] = useState(false);

    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState("");
    const [progress, setProgress] = useState(emptyProgress);

    const [usage, setUsage] = useState<{ count: number; bytes: number } | null>(null);
    const [checkingUsage, setCheckingUsage] = useState(false);

    const [externalUrl, setExternalUrl] = useState("");
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        let alive = true;
        void fetchBackendUser()
            .then((found) => {
                if (alive) setUser(found);
            })
            .catch(() => {
                /* 服务端不可用时保持未登录态，不打断用户配置其它项 */
            })
            .finally(() => {
                if (alive) setChecking(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    const login = async () => {
        if (!email.trim() || !password) {
            message.error(t("config.account.needLogin"));
            return;
        }
        setLoggingIn(true);
        try {
            const account = await loginBackend(email.trim(), password);
            setUser(account);
            setPassword("");
            message.success(t("config.account.loggedInAs", { email: account.email }));
        } catch (error) {
            message.error(error instanceof Error ? error.message : t("config.account.loginFailed"));
        } finally {
            setLoggingIn(false);
        }
    };

    const logout = async () => {
        await logoutBackend();
        setUser(null);
        setUsage(null);
        message.success(t("config.account.logoutDone"));
    };

    const updateProgress = (event: AppSyncProgressEvent) => {
        setSyncStatus(event.stage);
        if (!event.domain) return;
        setProgress((current) => ({
            ...current,
            [event.domain as AppSyncDomainKey]: { stage: event.stage, current: event.current, total: event.total, status: event.status },
        }));
    };

    const syncToCloud = async () => {
        if (!user) {
            message.error(t("config.account.needLogin"));
            return;
        }
        setSyncing(true);
        setProgress(emptyProgress());
        setSyncStatus(t("config.account.preparing"));
        try {
            const result = await syncAppData(createBackendTransport(), updateProgress);
            message.success(t("config.account.completed", { projects: result.projects, assets: result.assets, records: result.imageLogs + result.videoLogs, files: result.uploadedFiles, bytes: formatBytes(result.uploadedBytes) }));
            if (result.failedFiles.length) {
                const names = result.failedFiles.slice(0, 3).map((key) => key.split(":").pop() || key).join("、");
                message.warning(t("config.account.partialFailed", { count: result.failedFiles.length, files: names }), 8);
            }
            void checkUsage();
        } catch (error) {
            setSyncStatus(error instanceof Error ? error.message : t("config.account.failed"));
            message.error(error instanceof Error ? error.message : t("config.account.failed"));
        } finally {
            setSyncing(false);
        }
    };

    const checkUsage = async () => {
        setCheckingUsage(true);
        try {
            const data = await listBackendSync();
            setUsage({ count: data.items.length, bytes: data.totalBytes });
        } catch (error) {
            message.error(error instanceof Error ? error.message : t("config.account.failed"));
        } finally {
            setCheckingUsage(false);
        }
    };

    const importExternal = async () => {
        const url = externalUrl.trim();
        if (!/^https?:\/\//i.test(url)) {
            message.error(t("config.account.importFailed"));
            return;
        }
        setImporting(true);
        try {
            const saved = await importExternalUrl(url, /\.(mp4|webm|mov|m4v|avi)(\?|$)/i.test(url) ? "video" : "image");
            setExternalUrl("");
            message.success(t("config.account.importDone", { storageKey: saved.storageKey, bytes: formatBytes(saved.bytes) }));
            void checkUsage();
        } catch (error) {
            message.error(error instanceof Error ? error.message : t("config.account.importFailed"));
        } finally {
            setImporting(false);
        }
    };

    return (
        <Form layout="vertical" requiredMark={false}>
            <section className="rounded-lg border border-stone-200 p-3 dark:border-stone-800">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <UserRound className="size-4" />
                            {t("config.account.title")}
                        </div>
                        <div className="mt-1 text-xs text-stone-500">{t("config.account.description")}</div>
                    </div>
                    <div className="text-xs text-stone-500">
                        {checking ? "…" : user ? t("config.account.loggedInAs", { email: user.email }) : t("config.account.notLoggedIn")}
                    </div>
                </div>

                {user ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="primary" icon={<RefreshCw className="size-4" />} loading={syncing} onClick={() => void syncToCloud()}>
                            {t(syncing ? "config.account.syncing" : "config.account.syncNow")}
                        </Button>
                        <Button icon={<CloudDownload className="size-4" />} loading={checkingUsage} onClick={() => void checkUsage()}>
                            {t("config.account.refreshUsage")}
                        </Button>
                        <Button icon={<LogOut className="size-4" />} onClick={() => void logout()}>
                            {t("config.account.logout")}
                        </Button>
                        {usage ? <span className="text-xs text-stone-500">{t("config.account.cloudUsage", { count: usage.count, bytes: formatBytes(usage.bytes) })}</span> : null}
                        {syncStatus ? <span className="text-xs text-stone-500">{syncStatus}</span> : null}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        <Form.Item label={t("config.account.email")} className="mb-4">
                            <Input value={email} autoComplete="username" placeholder="you@example.com" onChange={(event) => setEmail(event.target.value)} />
                        </Form.Item>
                        <Form.Item label={t("config.account.password")} className="mb-0">
                            <Input.Password value={password} autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} onPressEnter={() => void login()} />
                        </Form.Item>
                    </div>
                )}

                {!user ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button type="primary" icon={<LogIn className="size-4" />} loading={loggingIn} onClick={() => void login()}>
                            {t(loggingIn ? "config.account.loggingIn" : "config.account.login")}
                        </Button>
                        <span className="text-xs text-stone-500">{t("config.account.registrationClosed")}</span>
                    </div>
                ) : null}

                {user ? (
                    <div className="mt-4 border-t border-stone-200 pt-3 dark:border-stone-800">
                        <div className="mb-2 text-xs text-stone-500">
                            画布里指向别家 CDN 的媒体（如 Agnes 临时地址）同步是带不走的 —— 贴进来，服务端会抓回来存档并记住原始出处。
                        </div>
                        <Space.Compact className="w-full">
                            <Input value={externalUrl} placeholder={t("config.account.externalUrlPlaceholder")} onChange={(event) => setExternalUrl(event.target.value)} />
                            <Button icon={<CloudDownload className="size-4" />} loading={importing} disabled={!externalUrl.trim()} onClick={() => void importExternal()}>
                                {t("config.account.importExternal")}
                            </Button>
                        </Space.Compact>
                    </div>
                ) : null}

                {syncing || syncStatus ? (
                    <div className="mt-3 grid gap-2">
                        {domainKeys.map((key) => {
                            const item = progress[key];
                            const percent = item.total ? Math.floor(((item.current || 0) / item.total) * 100) : item.status === "success" ? 100 : 0;
                            return (
                                <div key={key} className="rounded-md border border-stone-200 px-3 py-2 dark:border-stone-800">
                                    <div className="mb-1 flex min-w-0 items-center justify-between gap-3 text-xs">
                                        <span className="shrink-0 font-medium text-stone-700 dark:text-stone-200">{t(`config.webdav.domains.${key === "image-workbench" ? "imageWorkbench" : key === "video-workbench" ? "videoWorkbench" : key}`)}</span>
                                        <span className="min-w-0 truncate text-right text-stone-500">{item.stage}</span>
                                    </div>
                                    <Progress percent={percent} size="small" status={item.status === "exception" ? "exception" : undefined} showInfo={false} />
                                </div>
                            );
                        })}
                    </div>
                ) : null}
            </section>
        </Form>
    );
}
