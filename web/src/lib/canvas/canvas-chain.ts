export type CanvasChainNode = { id: string };
export type CanvasChainConnection = { fromNodeId: string; toNodeId: string };

/**
 * Return upstream node ids in deterministic breadth-first order.
 * `shouldStopAt` marks resource nodes: they are included, but their parents
 * are not traversed, preventing unrelated ancestors from leaking into input.
 */
export function collectUpstreamNodeIds<T extends CanvasChainNode>(targetNodeId: string, nodes: T[], connections: CanvasChainConnection[], shouldStopAt: (node: T) => boolean = () => false) {
    const nodesById = new Map(nodes.map((node) => [node.id, node]));
    const incomingByNodeId = new Map<string, string[]>();
    connections.forEach((connection) => {
        const incoming = incomingByNodeId.get(connection.toNodeId);
        if (incoming) incoming.push(connection.fromNodeId);
        else incomingByNodeId.set(connection.toNodeId, [connection.fromNodeId]);
    });

    const queue = [...(incomingByNodeId.get(targetNodeId) || [])];
    const visited = new Set<string>();
    const result: string[] = [];
    while (queue.length) {
        const nodeId = queue.shift();
        if (!nodeId || visited.has(nodeId)) continue;
        visited.add(nodeId);
        const node = nodesById.get(nodeId);
        if (!node) continue;
        result.push(node.id);
        if (shouldStopAt(node)) continue;
        for (const parentId of incomingByNodeId.get(node.id) || []) queue.push(parentId);
    }
    return result;
}
