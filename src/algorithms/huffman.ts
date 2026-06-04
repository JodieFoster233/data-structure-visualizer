export interface HuffmanNode {
  char: string
  freq: number
  left: HuffmanNode | null
  right: HuffmanNode | null
  id: string
}

export interface HuffmanStep {
  type: 'init' | 'select' | 'merge' | 'complete'
  nodes: HuffmanNode[]
  highlightIds: string[]
  newId?: string
  description: string
}

let nodeIdCounter = 0

function makeNode(char: string, freq: number, left: HuffmanNode | null = null, right: HuffmanNode | null = null): HuffmanNode {
  return { char, freq, left, right, id: `node-${nodeIdCounter++}` }
}

export function* buildHuffmanTree(text: string): Generator<HuffmanStep> {
  nodeIdCounter = 0

  const freqMap = new Map<string, number>()
  for (const ch of text) {
    freqMap.set(ch, (freqMap.get(ch) || 0) + 1)
  }

  if (freqMap.size === 0) {
    yield {
      type: 'complete',
      nodes: [],
      highlightIds: [],
      description: '输入文本为空',
    }
    return
  }

  const nodes: HuffmanNode[] = []
  for (const [char, freq] of freqMap) {
    nodes.push(makeNode(char, freq))
  }
  nodes.sort((a, b) => a.freq - b.freq)

  yield {
    type: 'init',
    nodes: [...nodes],
    highlightIds: [],
    description: `统计完成，共 ${freqMap.size} 个不同字符`,
  }

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq)
    const left = nodes.shift()!
    const right = nodes.shift()!

    yield {
      type: 'select',
      nodes: [...nodes, left, right],
      highlightIds: [left.id, right.id],
      description: `选出频率最小的两个节点: '${left.char}'(${left.freq}) 和 '${right.char}'(${right.freq})`,
    }

    const parent = makeNode(left.char + right.char, left.freq + right.freq, left, right)
    nodes.push(parent)

    yield {
      type: 'merge',
      nodes: [...nodes],
      highlightIds: [],
      newId: parent.id,
      description: `合并 '${left.char}' 和 '${right.char}' → 新节点频率: ${parent.freq}`,
    }
  }

  yield {
    type: 'complete',
    nodes: [...nodes],
    highlightIds: [],
    description: `霍夫曼树构建完成`,
  }
}

export function generateCodeTable(root: HuffmanNode): Map<string, string> {
  const codeTable = new Map<string, string>()

  function traverse(node: HuffmanNode, code: string) {
    if (!node.left && !node.right) {
      codeTable.set(node.char, code)
      return
    }
    if (node.left) traverse(node.left, code + '0')
    if (node.right) traverse(node.right, code + '1')
  }

  if (root) traverse(root, '')
  return codeTable
}

export function getLeaves(root: HuffmanNode): HuffmanNode[] {
  const leaves: HuffmanNode[] = []
  function traverse(node: HuffmanNode) {
    if (!node.left && !node.right) {
      leaves.push(node)
      return
    }
    if (node.left) traverse(node.left)
    if (node.right) traverse(node.right)
  }
  if (root) traverse(root)
  return leaves
}
