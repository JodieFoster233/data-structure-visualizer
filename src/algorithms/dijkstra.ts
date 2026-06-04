export interface DijkstraStep {
  type: 'init' | 'visit' | 'relax' | 'complete' | 'path'
  currentRow: number
  currentCol: number
  neighborRow?: number
  neighborCol?: number
  distances: Map<string, number>
  description: string
}

export function* dijkstra(
  rows: number,
  cols: number,
  walls: Set<string>,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): Generator<DijkstraStep> {
  const dist = new Map<string, number>()
  const visited = new Set<string>()
  const prev = new Map<string, [number, number]>()
  const directions: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]]

  const key = (r: number, c: number) => `${r},${c}`

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dist.set(key(r, c), Infinity)
    }
  }

  dist.set(key(startRow, startCol), 0)

  yield {
    type: 'init',
    currentRow: startRow,
    currentCol: startCol,
    distances: new Map(dist),
    description: `Dijkstra 初始化，起点 (${startRow}, ${startCol}) 距离=0`,
  }

  while (true) {
    let minDist = Infinity
    let minR = -1
    let minC = -1

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const k = key(r, c)
        if (!visited.has(k) && !walls.has(k)) {
          const d = dist.get(k)!
          if (d < minDist) {
            minDist = d
            minR = r
            minC = c
          }
        }
      }
    }

    if (minR === -1 || minDist === Infinity) break

    const currentKey = key(minR, minC)
    visited.add(currentKey)

    yield {
      type: 'visit',
      currentRow: minR,
      currentCol: minC,
      distances: new Map(dist),
      description: `访问节点 (${minR}, ${minC})，距离=${minDist}${minR === endRow && minC === endCol ? ' ← 到达终点！' : ''}`,
    }

    if (minR === endRow && minC === endCol) {
      yield {
        type: 'complete',
        currentRow: endRow,
        currentCol: endCol,
        distances: new Map(dist),
        description: `找到最短路径，总距离: ${minDist}`,
      }
      return
    }

    for (const [dr, dc] of directions) {
      const nr = minR + dr
      const nc = minC + dc
      const nk = key(nr, nc)

      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(nk) && !walls.has(nk)) {
        const newDist = minDist + 1
        if (newDist < dist.get(nk)!) {
          dist.set(nk, newDist)
          prev.set(nk, [minR, minC])

          yield {
            type: 'relax',
            currentRow: minR,
            currentCol: minC,
            neighborRow: nr,
            neighborCol: nc,
            distances: new Map(dist),
            description: `松弛边 (${minR},${minC}) → (${nr},${nc})，新距离: ${newDist}`,
          }
        }
      }
    }
  }
}
