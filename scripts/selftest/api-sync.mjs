/**
 * 线上 API 自检（账号 + 同步文件柜）
 *
 * 跑法：node scratch/api-sync-selftest.mjs
 * 默认打 https://hb.cauai.fun ，可用 BASE= 覆盖。
 *
 * 每次会新建随机账号，所以可以反复跑，不会撞「邮箱已存在」。
 */
const BASE = process.env.BASE || "https://hb.cauai.fun";
const failures = [];
let pass = 0;

function check(name, cond, extra = "") {
    if (cond) {
        pass += 1;
        console.log(`  ✓ ${name}`);
    } else {
        failures.push(name + (extra ? ` — ${extra}` : ""));
        console.log(`  ✗ ${name}${extra ? ` — ${extra}` : ""}`);
    }
    return cond;
}

async function call(pathname, init = {}) {
    const res = await fetch(BASE + pathname, {
        ...init,
        headers: { ...(init.headers || {}) },
    });
    const text = await res.text();
    let json = null;
    try {
        json = JSON.parse(text);
    } catch {
        /* 非 JSON 响应保持 null */
    }
    return { status: res.status, json, text, headers: res.headers };
}

function cookieOf(res) {
    const all = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    return all.map((c) => String(c).split(";")[0]).join("; ");
}

async function register() {
    const email = `selftest+${Date.now()}@hb.cauai.fun`;
    const password = "selftest-2026";
    const res = await call("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, displayName: "自检账号" }),
    });
    return { email, password, res, cookie: cookieOf(res) };
}

const main = async () => {
    console.log(`== 目标 ${BASE} ==`);

    console.log("\n[1] 健康检查");
    const health = await call("/api/health");
    check("health 200", health.status === 200, `status=${health.status}`);
    check("数据库连通", health.json?.db === true, JSON.stringify(health.json));

    console.log("\n[2] 注册账号 A");
    const a = await register();
    check("注册 201", a.res.status === 201, `status=${a.res.status} ${a.res.text?.slice(0, 120)}`);
    check("下发会话 cookie", Boolean(a.cookie));
    const me = await call("/api/auth/me", { headers: { cookie: a.cookie } });
    check("me 返回用户", me.status === 200 && Boolean(me.json?.user?.id), `status=${me.status}`);

    // 小文件（不分片）
    console.log("\n[3] 小文件整包写入");
    const smallPath = "media/selftest-small.txt";
    const smallBody = "念念画布小文件 " + Date.now();
    const put1 = await call(`/api/sync/${smallPath}`, {
        method: "PUT",
        headers: { cookie: a.cookie, "content-type": "text/plain" },
        body: smallBody,
    });
    check("PUT 201", put1.status === 201, `status=${put1.status} ${put1.text?.slice(0, 120)}`);
    const get1 = await call(`/api/sync/${smallPath}`, { headers: { cookie: a.cookie } });
    check("读回内容一致", get1.text === smallBody, `got=${String(get1.text).slice(0, 60)}`);

    // 大文件（分片）
    console.log("\n[4] 大文件分片写入（3 片）");
    const bigPath = "nested/dir/selftest-big.bin";
    const chunk = Buffer.alloc(1024 * 1024, 7); // 1MB
    const total = chunk.length * 3;
    let lastChunk = null;
    for (let i = 0; i < 3; i += 1) {
        const start = i * chunk.length;
        const end = start + chunk.length - 1;
        const r = await call(`/api/sync/${bigPath}`, {
            method: "PATCH",
            headers: {
                cookie: a.cookie,
                "content-type": "application/octet-stream",
                "content-range": `bytes ${start}-${end}/${total}`,
            },
            body: chunk,
        });
        lastChunk = r;
        const isLast = i === 2;
        const expected = isLast ? 201 : 204;
        check(
            `第 ${i + 1} 片 → ${expected}`,
            r.status === expected,
            `status=${r.status} ${r.text?.slice(0, 120)}`,
        );
        if (r.status !== expected) break;
    }
    check("末片带完成标记", lastChunk?.headers.get("x-upload-complete") === "1");

    const get2 = await fetch(`${BASE}/api/sync/${bigPath}`, { headers: { cookie: a.cookie } });
    const buf = Buffer.from(await get2.arrayBuffer());
    check("分片文件读回长度正确", buf.length === total, `got=${buf.length} want=${total}`);
    check("分片文件读回内容正确", buf.equals(Buffer.concat([chunk, chunk, chunk])));

    console.log("\n[5] 域列表");
    const list = await call("/api/sync", { headers: { cookie: a.cookie } });
    check("列出同步文件", list.status === 200 && Array.isArray(list.json?.items), `status=${list.status}`);
    const small = (list.json?.items || []).find((i) => i.path.startsWith("media/"));
    check("media 域文件在列且非空", Boolean(small) && small.bytes > 0, JSON.stringify(list.json?.items?.slice(0, 3)));
    const big = (list.json?.items || []).find((i) => i.path.startsWith("nested/"));
    check("子目录文件在列且尺寸正确", big?.bytes === total, `bytes=${big?.bytes}`);

    console.log("\n[6] 账号隔离");
    const b = await register();
    const crossRead = await call(`/api/sync/${smallPath}`, { headers: { cookie: b.cookie } });
    check("账号 B 读不到账号 A 的文件", crossRead.status === 404, `status=${crossRead.status}`);
    const listB = await call("/api/sync", { headers: { cookie: b.cookie } });
    check("账号 B 的文件列表为空", (listB.json?.items || []).length === 0, JSON.stringify(listB.json?.items));

    console.log("\n[7] 未登录访问");
    const anon = await call("/api/auth/me");
    check("无凭证 401", anon.status === 401, `status=${anon.status}`);

    console.log("\n[8] 登录 + 刷新");
    const relogin = await call("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: a.email, password: a.password }),
    });
    check("登录 200", relogin.status === 200, `status=${relogin.status}`);
    const refresh = await call("/api/auth/refresh", {
        method: "POST",
        headers: { cookie: cookieOf(relogin) },
    });
    check("刷新 200", refresh.status === 200, `status=${refresh.status}`);

    console.log(`\n== 结果：${pass} 通过 / ${failures.length} 失败 ==`);
    if (failures.length) {
        failures.forEach((f) => console.log(`  ! ${f}`));
        process.exit(1);
    }
};

main().catch((e) => {
    console.error("自检脚本自身异常:", e);
    process.exit(1);
});
