import { useState, useRef, useEffect, useCallback } from 'react'
import PageLayout from '../components/PageLayout'
import { ControlPanel, Button, RangeInput } from '../components/ControlPanel'
import InfoPanel, { infoPanelStyles } from '../components/InfoPanel'
import { dijkstra, DijkstraStep } from '../algorithms/dijkstra'
import styles from './DijkstraPage.module.css'

const CELL_SIZE = 36
const COLS = 18
const ROWS = 12

type CellState = 'empty' | 'wall' | 'start' | 'end' | 'visited' | 'visiting' | 'relaxing' | 'path'

export default function DijkstraPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  const [grid, setGrid] = useState<CellState[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill('empty'))
  )
  const [startCell, setStartCell] = useState<[number, number] | null>([2, 3])
  const [endCell, setEndCell] = useState<[number, number] | null>([9, 14])
  const [walls, setWalls] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<'start' | 'end' | 'wall' | 'erase'>('wall')
  const [speed, setSpeed] = useState(5)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<DijkstraStep[]>([])
  const [pathCells, setPathCells] = useState<string[]>([])
  const [distMap, setDistMap] = useState<Map<string, number>>(new Map())
  const [statusText, setStatusText] = useState('点击网格设置起点/终点和障碍，再点击"开始"')
  const [hintVisible, setHintVisible] = useState(true)

  useEffect(() => {
    const newGrid = Array.from({ length: ROWS }, () => Array(COLS).fill('empty') as CellState[])
    if (startCell) newGrid[startCell[0]][startCell[1]] = 'start'
    if (endCell) newGrid[endCell[0]][endCell[1]] = 'end'
    for (const k of walls) {
      const [r, c] = k.split(',').map(Number)
      newGrid[r][c] = 'wall'
    }
    setGrid(newGrid)
  }, [startCell, endCell, walls])

  useEffect(() => {
    if (pathCells.length === 0) return
    setGrid((g) => {
      const newGrid = g.map((row) => [...row])
      for (const key of pathCells) {
        const [r, c] = key.split(',').map(Number)
        if (newGrid[r]?.[c] && newGrid[r][c] !== 'start' && newGrid[r][c] !== 'end') {
          newGrid[r][c] = 'path'
        }
      }
      return newGrid
    })
  }, [pathCells])

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const w = COLS * CELL_SIZE
    const h = ROWS * CELL_SIZE

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0d0d24'
    ctx.fillRect(0, 0, w, h)

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * CELL_SIZE
        const y = r * CELL_SIZE

        if (grid[r]?.[c] === 'wall') {
          ctx.fillStyle = '#1a1a4a'
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)
          ctx.strokeStyle = '#2a2a5a'
          ctx.lineWidth = 0.5
          ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE)
        } else if (grid[r]?.[c] === 'path') {
          ctx.fillStyle = 'rgba(255, 215, 64, 0.6)'
          ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4)
        } else if (grid[r]?.[c] === 'visited') {
          ctx.fillStyle = 'rgba(0, 229, 255, 0.25)'
          ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4)
        } else if (grid[r]?.[c] === 'visiting') {
          ctx.fillStyle = 'rgba(0, 229, 255, 0.5)'
          ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4)
        } else if (grid[r]?.[c] === 'relaxing') {
          ctx.fillStyle = 'rgba(179, 136, 255, 0.5)'
          ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4)
        } else {
          ctx.fillStyle = '#0d0d24'
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)
          ctx.strokeStyle = '#1a1a3a'
          ctx.lineWidth = 0.3
          ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE)
        }

        if (grid[r]?.[c] === 'start') {
          ctx.fillStyle = '#69f0ae'
          ctx.beginPath()
          ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 2 - 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#000'
          ctx.font = 'bold 12px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('S', x + CELL_SIZE / 2, y + CELL_SIZE / 2)
        } else if (grid[r]?.[c] === 'end') {
          ctx.fillStyle = '#ff5252'
          ctx.beginPath()
          ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 2 - 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 12px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('E', x + CELL_SIZE / 2, y + CELL_SIZE / 2)
        }
      }
    }
  }, [grid])

  useEffect(() => {
    drawGrid()
  }, [drawGrid])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPlaying) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const col = Math.floor(x / CELL_SIZE)
    const row = Math.floor(y / CELL_SIZE)

    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return
    const key = `${row},${col}`

    if (mode === 'start') {
      setStartCell([row, col])
      if (walls.has(key)) {
        setWalls((prev) => { const n = new Set(prev); n.delete(key); return n })
      }
    } else if (mode === 'end') {
      setEndCell([row, col])
      if (walls.has(key)) {
        setWalls((prev) => { const n = new Set(prev); n.delete(key); return n })
      }
    } else if (mode === 'wall') {
      const isStart = startCell && startCell[0] === row && startCell[1] === col
      const isEnd = endCell && endCell[0] === row && endCell[1] === col
      if (!isStart && !isEnd) {
        setWalls((prev) => { const n = new Set(prev); n.add(key); return n })
      }
    } else if (mode === 'erase') {
      const isStart = startCell && startCell[0] === row && startCell[1] === col
      const isEnd = endCell && endCell[0] === row && endCell[1] === col
      if (!isStart && !isEnd) {
        setWalls((prev) => { const n = new Set(prev); n.delete(key); return n })
      }
    }
  }

  const computeSteps = useCallback(() => {
    if (!startCell || !endCell) {
      setStatusText('请先设置起点和终点')
      return
    }
    const s: DijkstraStep[] = []
    for (const step of dijkstra(ROWS, COLS, walls, startCell[0], startCell[1], endCell[0], endCell[1])) {
      s.push(step)
    }
    setSteps(s)
    setCurrentStep(0)
    setPathCells([])
    setDistMap(new Map())
    setIsPlaying(false)
    setStatusText(`生成 ${s.length} 个动画步骤，请点击开始`)
  }, [walls, startCell, endCell])

  useEffect(() => {
    computeSteps()
  }, [])

  const animate = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1
      if (next >= steps.length) {
        setIsPlaying(false)
        setStatusText('Dijkstra 搜索完成！')
        const finalStep = steps[steps.length - 1]
        if (finalStep && finalStep.distances) {
          setDistMap(finalStep.distances)
          setPathCells(tracePath(finalStep.distances))
        }
        return prev
      }
      const step = steps[next]
      setStatusText(step?.description || '')
      setDistMap(step?.distances || new Map())

      // Update grid
      setGrid((g) => {
        const newGrid = g.map((r) => [...r])
        if (step?.type === 'visit') {
          newGrid[step.currentRow][step.currentCol] = 'visiting'
        }
        if (step?.type === 'relax') {
          newGrid[step.currentRow][step.currentCol] = 'relaxing'
          if (step.neighborRow !== undefined && step.neighborCol !== undefined) {
            if (newGrid[step.neighborRow][step.neighborCol] === 'empty') {
              newGrid[step.neighborRow][step.neighborCol] = 'visited'
            }
          }
        }
        // Reset prev visiting
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (newGrid[r][c] === 'visiting' && !(step?.type === 'visit' && step.currentRow === r && step.currentCol === c)) {
              newGrid[r][c] = 'visited'
            }
            if (newGrid[r][c] === 'relaxing') {
              newGrid[r][c] = 'visited'
            }
          }
        }
        // Restore start/end
        if (startCell) newGrid[startCell[0]][startCell[1]] = 'start'
        if (endCell) newGrid[endCell[0]][endCell[1]] = 'end'
        for (const k of walls) {
          const [r, c] = k.split(',').map(Number)
          newGrid[r][c] = 'wall'
        }
        return newGrid
      })
      return next
    })
  }, [steps, startCell, endCell, walls])

  const tracePath = (finalDistances: Map<string, number>): string[] => {
    const pathKeys: string[] = []
    if (!endCell) return pathKeys
    if (!startCell) return pathKeys

    let cr = endCell[0]
    let cc = endCell[1]
    const visited = new Set<string>()

    while (cr !== startCell[0] || cc !== startCell[1]) {
      const key = `${cr},${cc}`
      visited.add(key)
      pathKeys.push(key)

      let minDist = Infinity
      let minR = cr
      let minC = cc
      for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
        const nr = cr + dr
        const nc = cc + dc
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
        const nk = `${nr},${nc}`
        if (visited.has(nk)) continue
        if (walls.has(nk)) continue
        const d = finalDistances.get(nk)
        if (d !== undefined && d < minDist && d < Infinity) {
          minDist = d
          minR = nr
          minC = nc
        }
      }
      if (minR === cr && minC === cc) break
      cr = minR
      cc = minC
    }
    return pathKeys
  }

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      return
    }

    let lastTime = 0
    const interval = Math.max(16, 400 - speed * 35)

    const loop = (time: number) => {
      if (time - lastTime >= interval) {
        lastTime = time
        animate()
      }
      animFrameRef.current = requestAnimationFrame(loop)
    }
    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isPlaying, speed, animate])

  const handleStart = () => {
    if (currentStep >= steps.length - 1) {
      setGrid((g) => g.map((row) => row.map((cell) =>
        cell === 'visited' || cell === 'visiting' || cell === 'path' || cell === 'relaxing' ? 'empty' : cell
      )))
      computeSteps()
      setTimeout(() => setIsPlaying(true), 100)
      return
    }
    setIsPlaying(!isPlaying)
  }

  const handleStepForward = () => {
    if (currentStep >= steps.length - 1) return
    animate()
  }

  const handleReset = () => {
    setGrid((g) => g.map((row) => row.map((cell) =>
      cell === 'visited' || cell === 'visiting' || cell === 'path' || cell === 'relaxing' ? 'empty' : cell
    )))
    setWalls(new Set())
    computeSteps()
    setIsPlaying(false)
  }

  const currentData = steps[currentStep]
  const visitedCount = currentData ? Array.from(currentData.distances.values()).filter(d => d < Infinity).length : 0

  return (
    <PageLayout
      title="最短路径"
      emoji="🗺️"
      hint={hintVisible ? '点击隐藏提示' : '点击显示提示'}
      stats={`访问: ${visitedCount} | 步: ${currentStep}/${steps.length}`}
      onHintClick={() => setHintVisible(!hintVisible)}
      controlPanel={
        <ControlPanel title="参数设置">
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>画笔模式</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant={mode === 'start' ? 'primary' : 'secondary'}
              onClick={() => setMode('start')}
              style={{ flex: 1 }}
            >
              🟢 起点
            </Button>
            <Button
              variant={mode === 'end' ? 'primary' : 'secondary'}
              onClick={() => setMode('end')}
              style={{ flex: 1 }}
            >
              🔴 终点
            </Button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant={mode === 'wall' ? 'primary' : 'secondary'}
              onClick={() => setMode('wall')}
              style={{ flex: 1 }}
            >
              ⬛ 障碍
            </Button>
            <Button
              variant={mode === 'erase' ? 'primary' : 'secondary'}
              onClick={() => setMode('erase')}
              style={{ flex: 1 }}
            >
              🧹 擦除
            </Button>
          </div>
          <RangeInput label="动画速度" value={speed} min={1} max={10} step={1} onChange={setSpeed} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={handleStart}>{isPlaying ? '⏸️ 暂停' : '▶️ 开始'}</Button>
            <Button onClick={handleStepForward} disabled={currentStep >= steps.length - 1}>⏭️ 单步</Button>
            <Button variant="danger" onClick={handleReset}>🔄 重置</Button>
          </div>
          {hintVisible && (
            <div style={{
              background: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: 'var(--accent-cyan)',
              lineHeight: '1.8',
            }}>
              💡 点击网格放置起点(S)、终点(E)和障碍物。Dijkstra 算法保证找到从起点到终点的最短路径。
            </div>
          )}
        </ControlPanel>
      }
      visualization={
        <div className={styles.visualization}>
          <canvas
            ref={canvasRef}
            width={COLS * CELL_SIZE}
            height={ROWS * CELL_SIZE}
            className={styles.canvas}
            onClick={handleCanvasClick}
            style={{ cursor: isPlaying ? 'default' : 'crosshair' }}
          />
        </div>
      }
      infoPanel={
        <InfoPanel title="算法详情">
          <span className={infoPanelStyles.sectionTitle}>当前步骤</span>
          <div className={infoPanelStyles.stepText}>
            {currentData?.description || statusText}
          </div>
          <span className={infoPanelStyles.sectionTitle}>距离数组 (Top-10)</span>
          <div className={infoPanelStyles.tableWrapper}>
            <table className={infoPanelStyles.table} style={{ fontSize: '10px' }}>
              <thead>
                <tr>
                  <th>节点</th>
                  <th>距离</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(distMap.entries())
                  .filter(([, v]) => v < Infinity)
                  .sort(([, a], [, b]) => a - b)
                  .slice(0, 10)
                  .map(([k, v]) => (
                    <tr key={k}>
                      <td>{k}</td>
                      <td className={infoPanelStyles.highlightCell}>{v}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <span className={infoPanelStyles.sectionTitle}>颜色图例</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
            <div>🟦 已访问节点</div>
            <div>🟪 正在松弛边</div>
            <div>🟨 最短路径</div>
            <div>🟢 起点 S</div>
            <div>🔴 终点 E</div>
            <div>⬛ 障碍物</div>
          </div>
          <span className={infoPanelStyles.sectionTitle}>算法复杂度</span>
          <div className={infoPanelStyles.complexityBox}>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>时间</span>
              <span className={infoPanelStyles.complexityValue}>O(V² + E)</span>
            </div>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>空间</span>
              <span className={infoPanelStyles.complexityValue}>O(V)</span>
            </div>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>网格大小</span>
              <span className={infoPanelStyles.complexityValue}>{ROWS}×{COLS}</span>
            </div>
          </div>
        </InfoPanel>
      }
    />
  )
}
