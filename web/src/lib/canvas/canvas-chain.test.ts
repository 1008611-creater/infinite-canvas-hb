import assert from "node:assert/strict";
import { test } from "node:test";

// Node's native TypeScript test runner needs the extension; Vite excludes this test file.
import { collectUpstreamNodeIds } from "./canvas-chain.ts";

test("collects resources through an intermediate config node", () => {
    const nodes = [{ id: "image" }, { id: "config" }, { id: "video" }];
    const connections = [
        { fromNodeId: "image", toNodeId: "config" },
        { fromNodeId: "config", toNodeId: "video" },
    ];
    assert.deepEqual(
        collectUpstreamNodeIds("video", nodes, connections, (node) => node.id === "image"),
        ["config", "image"],
    );
});

test("deduplicates converging branches and terminates on cycles", () => {
    const nodes = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "target" }];
    const connections = [
        { fromNodeId: "a", toNodeId: "b" },
        { fromNodeId: "a", toNodeId: "c" },
        { fromNodeId: "b", toNodeId: "target" },
        { fromNodeId: "c", toNodeId: "target" },
        { fromNodeId: "c", toNodeId: "a" },
    ];
    assert.deepEqual(
        collectUpstreamNodeIds("target", nodes, connections, (node) => node.id === "a"),
        ["b", "c", "a"],
    );
});
