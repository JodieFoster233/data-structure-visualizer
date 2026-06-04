export interface TopoNode {
  id: string
  label: string
  indegree: number
  x?: number
  y?: number
}

export interface TopoEdge {
  from: string
  to: string
}

export interface TopoStep {
  type: 'init' | 'select' | 'remove' | 'complete'
  currentNode?: string
  removedEdges?: TopoEdge[]
  sortedNodes: string[]
  indegreeMap: Map<string, number>
  description: string
}

export function* topologicalSort(
  nodes: TopoNode[],
  edges: TopoEdge[]
): Generator<TopoStep> {
  const indegreeMap = new Map<string, number>()
  const adjList = new Map<string, string[]>()

  for (const node of nodes) {
    indegreeMap.set(node.id, 0)
    adjList.set(node.id, [])
  }

  for (const edge of edges) {
    indegreeMap.set(edge.to, (indegreeMap.get(edge.to) || 0) + 1)
    const list = adjList.get(edge.from) || []
    list.push(edge.to)
    adjList.set(edge.from, list)
  }

  yield {
    type: 'init',
    sortedNodes: [],
    indegreeMap: new Map(indegreeMap),
    description: `初始化入度表，共 ${nodes.length} 个节点`,
  }

  const sorted: string[] = []
  const queue: string[] = []

  for (const [id, deg] of indegreeMap) {
    if (deg === 0) {
      queue.push(id)
    }
  }

  while (queue.length > 0) {
    queue.sort()
    const current = queue.shift()!
    sorted.push(current)

    yield {
      type: 'select',
      currentNode: current,
      sortedNodes: [...sorted],
      indegreeMap: new Map(indegreeMap),
      description: `选出节点 '${current}' (入度=0)，加入排序序列`,
    }

    const neighbors = adjList.get(current) || []
    const removedEdges: TopoEdge[] = []

    for (const neighbor of neighbors) {
      removedEdges.push({ from: current, to: neighbor })
      const newDeg = (indegreeMap.get(neighbor) || 0) - 1
      indegreeMap.set(neighbor, newDeg)

      if (newDeg === 0) {
        queue.push(neighbor)
      }
    }

    if (removedEdges.length > 0) {
      yield {
        type: 'remove',
        currentNode: current,
        removedEdges,
        sortedNodes: [...sorted],
        indegreeMap: new Map(indegreeMap),
        description: `移除节点 '${current}' 的所有出边，更新邻居入度`,
      }
    }
  }

  yield {
    type: 'complete',
    sortedNodes: [...sorted],
    indegreeMap: new Map(indegreeMap),
    description:
      sorted.length === nodes.length
        ? `拓扑排序完成！排序: ${sorted.map((id) => nodes.find((n) => n.id === id)?.label || id).join(' → ')}`
        : '图中存在环，无法完成拓扑排序',
  }
}
