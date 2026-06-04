export interface MazeGenResult {
  grid: number[][]
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

export interface MazeStep {
  type: 'visit' | 'explore' | 'backtrack' | 'path' | 'start' | 'end'
  row: number
  col: number
  description: string
}

export function generateMaze(
  rows: number,
  cols: number,
  wallDensity: number
): MazeGenResult {
  const grid: number[][] = []
  for (let r = 0; r < rows; r++) {
    grid[r] = []
    for (let c = 0; c < cols; c++) {
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
        grid[r][c] = 1
      } else {
        grid[r][c] = Math.random() < wallDensity ? 1 : 0
      }
    }
  }

  const startRow = 1
  const startCol = 1
  const endRow = rows - 2
  const endCol = cols - 2
  grid[startRow][startCol] = 0
  grid[endRow][endCol] = 0
  grid[startRow][startCol + 1] = 0
  grid[startRow + 1][startCol] = 0
  grid[endRow - 1][endCol] = 0
  grid[endRow][endCol - 1] = 0

  return { grid, startRow, startCol, endRow, endCol }
}

export function* dfsMaze(
  grid: number[][],
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  visited: boolean[][],
  parent: Map<string, [number, number]>
): Generator<MazeStep> {
  const rows = grid.length
  const cols = grid[0].length
  const directions: [number, number][] = [
    [-1, 0], [0, 1], [1, 0], [0, -1],
  ]

  function* dfs(r: number, c: number): Generator<MazeStep, boolean> {
    if (r === endRow && c === endCol) {
      yield { type: 'end', row: r, col: c, description: `DFS: 到达终点 (${r}, ${c})` }
      return true
    }

    yield { type: 'visit', row: r, col: c, description: `DFS 访问节点 (${r}, ${c})` }

    for (const [dr, dc] of directions) {
      const nr = r + dr
      const nc = c + dc
      if (
        nr >= 0 && nr < rows &&
        nc >= 0 && nc < cols &&
        !visited[nr][nc] &&
        grid[nr][nc] === 0
      ) {
        visited[nr][nc] = true
        parent.set(`${nr},${nc}`, [r, c])
        yield { type: 'explore', row: nr, col: nc, description: `DFS 探索 (${nr}, ${nc})` }

        const found: boolean = yield* dfs(nr, nc)
        if (found) return true

        yield { type: 'backtrack', row: nr, col: nc, description: `DFS 回溯 (${nr}, ${nc})` }
      }
    }

    return false
  }

  yield { type: 'start', row: startRow, col: startCol, description: `DFS 从起点 (${startRow}, ${startCol}) 开始搜索` }
  yield* dfs(startRow, startCol)
}

export function* bfsMaze(
  grid: number[][],
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  visited: boolean[][],
  parent: Map<string, [number, number]>
): Generator<MazeStep> {
  const rows = grid.length
  const cols = grid[0].length
  const directions: [number, number][] = [
    [-1, 0], [0, 1], [1, 0], [0, -1],
  ]

  yield { type: 'start', row: startRow, col: startCol, description: `BFS 从起点 (${startRow}, ${startCol}) 开始搜索` }

  const queue: [number, number][] = [[startRow, startCol]]
  visited[startRow][startCol] = true

  while (queue.length > 0) {
    const [r, c] = queue.shift()!

    if (r === endRow && c === endCol) {
      yield { type: 'end', row: r, col: c, description: `BFS: 到达终点 (${r}, ${c})` }
      return
    }

    yield { type: 'visit', row: r, col: c, description: `BFS 访问节点 (${r}, ${c})，队列长度: ${queue.length}` }

    for (const [dr, dc] of directions) {
      const nr = r + dr
      const nc = c + dc
      if (
        nr >= 0 && nr < rows &&
        nc >= 0 && nc < cols &&
        !visited[nr][nc] &&
        grid[nr][nc] === 0
      ) {
        visited[nr][nc] = true
        parent.set(`${nr},${nc}`, [r, c])
        queue.push([nr, nc])
        yield { type: 'explore', row: nr, col: nc, description: `BFS 发现新节点 (${nr}, ${nc})，入队，队列长度: ${queue.length}` }
      }
    }
  }
}

export function reconstructPath(
  parent: Map<string, [number, number]>,
  endRow: number,
  endCol: number,
  startRow: number,
  startCol: number
): { type: 'path'; row: number; col: number; description: string }[] {
  const path: { type: 'path'; row: number; col: number; description: string }[] = []
  let r = endRow
  let c = endCol

  while (r !== startRow || c !== startCol) {
    path.push({ type: 'path', row: r, col: c, description: `路径: (${r}, ${c})` })
    const key = `${r},${c}`
    const prev = parent.get(key)
    if (!prev) break
    ;[r, c] = prev
  }

  path.push({ type: 'path', row: startRow, col: startCol, description: `路径起点: (${startRow}, ${startCol})` })
  path.reverse()
  return path
}
