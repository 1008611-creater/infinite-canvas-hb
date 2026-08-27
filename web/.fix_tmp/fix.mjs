import { execSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync } from "node:fs";

const REG = "https://registry.npmmirror.com";
const base = "/e/codex/niannianai/zhuanhuiyuangong/infinite-canvas/web";
const target = `${base}/node_modules/streamdown/node_modules`;

// 版本都从损坏包自身 package.json 读出（除了 visit-parents 整个包都残）
const pkgs = {
  "unified": "11.0.5",
  "unist-util-visit": "5.1.0",
  "remark-parse": "11.0.0",
  "remark-rehype": "11.1.2",
  "vfile": "6.0.3",
  "micromark": "4.0.2",
  "micromark-util-symbol": "2.0.1",
  "mdast-util-from-markdown": "2.0.3",
  "mdast-util-to-hast": "13.2.1",
};

for (const [name, ver] of Object.entries(pkgs)) {
  const tarUrl = `${REG}/${name}/-/${name}-${ver}.tgz`;
  const work = `${base}/.fix_tmp/${name}`;
  mkdirSync(work, { recursive: true });
  try {
    console.log(`== ${name}@${ver} ==`);
    execSync(`curl -sL -m 60 -o ${work}/pkg.tgz ${tarUrl}`, { stdio: "pipe" });
    rmSync(`${work}/x`, { recursive: true, force: true });
    mkdirSync(`${work}/x`, { recursive: true });
    execSync(`tar -xzf ${work}/pkg.tgz -C ${work}/x`, { stdio: "pipe" });
    rmSync(`${target}/${name}`, { recursive: true, force: true });
    mkdirSync(`${target}/${name}`, { recursive: true });
    execSync(`cp -r ${work}/x/package/. ${target}/${name}/`, { stdio: "pipe" });
    const v = execSync(`node -e "console.log(require('${target}/${name}/package.json').version)"`, { encoding: "utf8" }).trim();
    console.log(`   RESTORED ${name}@${v}`);
  } catch (e) {
    console.log(`   FAIL ${name}: ${String(e.message).split("\\n")[0]}`);
  }
}

// unist-util-visit-parents: 整个包残缺失可知版本；从 lockfile 找准确版本
console.log("== unist-util-visit-parents: 尝试从 streamdown package.json 依赖定位 ==");
try {
  const sd = JSON.parse(require("fs").readFileSync(`${base}/node_modules/streamdown/package.json`, "utf8"));
  console.log("   streamdown dep spec:", sd.dependencies["unist-util-visit-parents"]);
} catch (e) {
  console.log("   (无法读取 streamdown package.json)");
}