import { useRef, useEffect, useState, useCallback } from 'react'
import PageLayout from '../components/PageLayout'
import { ControlPanel, Button, Select, RangeInput } from '../components/ControlPanel'
import InfoPanel, { infoPanelStyles } from '../components/InfoPanel'
import { generateMaze, dfsMaze, bfsMaze, reconstructPath, MazeStep } from '../algorithms/maze'
import styles from './MazePage.module.css'

const CELL_SIZE = 18

type MazeViewMode = 'single' | 'dual'

export default function MazePage() {
  const dfsCanvasRef = useRef<HTMLCanvasElement>(null)
  const bfsCanvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  const [size, setSize] = useState(21)
  const [wallDensity, setWallDensity] = useState(0.3)
  const [algorithm, setAlgorithm] = useState<'dfs' | 'bfs'>('dfs')
  const [viewMode, setViewMode] = useState<MazeViewMode>('dual')

  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(5)
  const [currentStep, setCurrentStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)

  const [dfsSteps, setDfsSteps] = useState<MazeStep[]>([])
  const [bfsSteps, setBfsSteps] = useState<MazeStep[]>([])
  const [dfsGrid, setDfsGrid] = useState<number[][]>([])
  const [bfsGrid, setBfsGrid] = useState<number[][]>([])
  const [dfsParent, setDfsParent] = useState<Map<string, [number, number]>>(new Map())
  const [bfsParent, setBfsParent] = useState<Map<string, [number, number]>>(new Map())
  const [dfsPath, setDfsPath] = useState<MazeStep[]>([])
  const [bfsPath, setBfsPath] = useState<MazeStep[]>([])
  const [dfsVisited, setDfsVisited] = useState(0)
  const [bfsVisited, setBfsVisited] = useState(0)
  const [statusText, setStatusText] = useState('请点击"生成迷宫"开始')
  const [hintVisible, setHintVisible] = useState(true)
  const [maze, setMaze] = useState<ReturnType<typeof generateMaze> | null>(null)

  const resetMaze = useCallback(() => {
    const m = generateMaze(size, size, wallDensity)
    setMaze(m)
    setDfsGrid(m.grid)
    setBfsGrid(m.grid.map((r) => [...r]))
    setDfsSteps([])
    setBfsSteps([])
    setDfsParent(new Map())
    setBfsParent(new Map())
    setDfsPath([])
    setBfsPath([])
    setCurrentStep(0)
    setTotalSteps(0)
    setIsPlaying(false)
    setDfsVisited(0)
    setBfsVisited(0)
    setStatusText('迷宫已生成，请选择算法并点击开始')

    const canvasDfs = dfsCanvasRef.current
    const canvasBfs = bfsCanvasRef.current

    // 获取 2D 上下文，确保安全
    const ctxDfs = canvasDfs?.getContext('2d')
    const ctxBfs = canvasBfs?.getContext('2d')

    if (ctxDfs && m) {
      drawMaze(ctxDfs, m.grid, m.startRow, m.startCol, m.endRow, m.endCol, [], [])
    }
    if (ctxBfs && m) {
      drawMaze(ctxBfs, m.grid, m.startRow, m.startCol, m.endRow, m.endCol, [], [])
    }

    // Pre-compute steps (原代码保持不变)
    const dVisited = m.grid.map((r) => r.map(() => false))
    dVisited[m.startRow][m.startCol] = true
    const dParent = new Map<string, [number, number]>()
    const dSteps: MazeStep[] = []
    for (const step of dfsMaze(m.grid, m.startRow, m.startCol, m.endRow, m.endCol, dVisited, dParent)) {
      dSteps.push(step)
    }
    const dPathSteps = reconstructPath(dParent, m.endRow, m.endCol, m.startRow, m.startCol)
    for (const s of dPathSteps) dSteps.push(s)

    const bVisited = m.grid.map((r) => r.map(() => false))
    bVisited[m.startRow][m.startCol] = true
    const bParent = new Map<string, [number, number]>()
    const bSteps: MazeStep[] = []
    for (const step of bfsMaze(m.grid, m.startRow, m.startCol, m.endRow, m.endCol, bVisited, bParent)) {
      bSteps.push(step)
    }
    const bPathSteps = reconstructPath(bParent, m.endRow, m.endCol, m.startRow, m.startCol)
    for (const s of bPathSteps) bSteps.push(s)

    setDfsSteps(dSteps)
    setBfsSteps(bSteps)
    setDfsParent(dParent)
    setBfsParent(bParent)
    setTotalSteps(Math.max(dSteps.length, bSteps.length))
  }, [size, wallDensity])

  useEffect(() => {
    resetMaze()
  }, [size, wallDensity])

  const drawMaze = (
    ctx: CanvasRenderingContext2D,
    grid: number[][],
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    dfsS: MazeStep[],
    bfsS: MazeStep[],
    stepIdx: number = currentStep,
    pathSteps: MazeStep[] = []
  ) => {
    const w = size * CELL_SIZE
    ctx.clearRect(0, 0, w, w)
    ctx.fillStyle = '#0d0d24'
    ctx.fillRect(0, 0, w, w)

    const dfsSet = new Set<string>()
    const dfsBtSet = new Set<string>()
    const bfsSet = new Set<string>()
    const bfsBtSet = new Set<string>()
    const dfsEndFound = new Set<string>()
    const bfsEndFound = new Set<string>()
    const pathSet = new Set<string>()

    for (let i = 0; i <= stepIdx && i < dfsS.length; i++) {
      const s = dfsS[i]
      const k = `${s.row},${s.col}`
      if (s.type === 'end') dfsEndFound.add(k)
      if (s.type === 'backtrack') {
        dfsBtSet.add(k)
        dfsSet.delete(k)
      } else if (s.type === 'visit' || s.type === 'explore' || s.type === 'end') {
        if (!dfsBtSet.has(k)) dfsSet.add(k)
      }
    }

    for (let i = 0; i <= stepIdx && i < bfsS.length; i++) {
      const s = bfsS[i]
      const k = `${s.row},${s.col}`
      if (s.type === 'end') bfsEndFound.add(k)
      if (s.type === 'visit' || s.type === 'explore' || s.type === 'end') {
        bfsSet.add(k)
      }
    }

    for (const s of pathSteps) {
      pathSet.add(`${s.row},${s.col}`)
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const x = c * CELL_SIZE
        const y = r * CELL_SIZE
        const k = `${r},${c}`

        if (grid[r][c] === 1) {
          ctx.fillStyle = '#1a1a4a'
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)
          ctx.strokeStyle = '#2a2a5a'
          ctx.lineWidth = 0.5
          ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE)
        } else {
          ctx.fillStyle = '#0d0d24'
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)
          ctx.strokeStyle = '#1a1a3a'
          ctx.lineWidth = 0.5
          ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE)

          if (pathSet.has(k)) {
            ctx.fillStyle = '#ffd740'
            ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4)
          } else if (dfsSet.has(k)) {
            ctx.fillStyle = 'rgba(0, 229, 255, 0.4)'
            ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4)
          } else if (bfsSet.has(k)) {
            ctx.fillStyle = 'rgba(179, 136, 255, 0.4)'
            ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4)
          }

          if (dfsBtSet.has(k)) {
            ctx.fillStyle = 'rgba(255, 82, 82, 0.3)'
            ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4)
          }
        }
      }
    }

    // Draw start and end
    const drawPoint = (row: number, col: number, color: string, label: string) => {
      const x = col * CELL_SIZE + CELL_SIZE / 2
      const y = row * CELL_SIZE + CELL_SIZE / 2
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, CELL_SIZE / 2 - 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, x, y)
    }

    drawPoint(startRow, startCol, '#69f0ae', 'S')
    drawPoint(endRow, endCol, '#ff5252', 'E')
  }

  const animate = useCallback(() => {
    setCurrentStep((prev) => {
      const max = Math.max(dfsSteps.length, bfsSteps.length)
      if (prev >= max) {
        setIsPlaying(false)
        return prev
      }
      const next = prev + 1

      const canvasDfs = dfsCanvasRef.current
      const canvasBfs = bfsCanvasRef.current

      if (canvasDfs && maze) {
        const ctxDfs = canvasDfs.getContext('2d')!
        const dfsDone = next >= dfsSteps.length
        let dfsCount = 0
        for (let i = 0; i < Math.min(next, dfsSteps.length); i++) {
          if (dfsSteps[i].type === 'visit' || dfsSteps[i].type === 'explore') dfsCount++
        }
        setDfsVisited(dfsCount)

        if (viewMode === 'dual') {
          drawMaze(ctxDfs, maze.grid, maze.startRow, maze.startCol, maze.endRow, maze.endCol, dfsSteps, [], next, dfsDone ? dfsPath : [])
          drawLabel(canvasDfs, 'DFS', '#00e5ff')
        } else {
          const s = algorithm === 'dfs' ? dfsSteps : bfsSteps
          const p = algorithm === 'dfs' ? dfsPath : bfsPath
          const allDone = next >= s.length
          drawMaze(ctxDfs, maze.grid, maze.startRow, maze.startCol, maze.endRow, maze.endCol,
            algorithm === 'dfs' ? s : [],
            algorithm === 'bfs' ? s : [],
            next, allDone ? p : [])
          drawLabel(canvasDfs, algorithm.toUpperCase(), '#00e5ff')
        }
      }

      if (canvasBfs && maze && viewMode === 'dual') {
        const ctxBfs = canvasBfs.getContext('2d')!
        const bfsDone = next >= bfsSteps.length
        let bfsCount = 0
        for (let i = 0; i < Math.min(next, bfsSteps.length); i++) {
          if (bfsSteps[i].type === 'visit' || bfsSteps[i].type === 'explore') bfsCount++
        }
        setBfsVisited(bfsCount)
        drawMaze(ctxBfs, maze.grid, maze.startRow, maze.startCol, maze.endRow, maze.endCol, [], bfsSteps, next, bfsDone ? bfsPath : [])
        drawLabel(canvasBfs, 'BFS', '#b388ff')
      }

      if (next >= max) {
        setStatusText('搜索完成！')
        setIsPlaying(false)
      }

      return next
    })
  }, [dfsSteps, bfsSteps, dfsPath, bfsPath, maze, algorithm, viewMode])

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      return
    }

    let lastTime = 0
    const interval = Math.max(16, 500 - speed * 45)

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

  const drawLabel = (canvas: HTMLCanvasElement, text: string, color: string) => {
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = color
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(text, 6, size * CELL_SIZE - 6)
  }

  const handleStepForward = () => {
    if (currentStep >= Math.max(dfsSteps.length, bfsSteps.length)) return
    animate()
  }

  const handleStart = () => {
    if (currentStep >= Math.max(dfsSteps.length, bfsSteps.length)) {
      setCurrentStep(0)
      setStatusText('重新开始...')
    } else {
      setStatusText('搜索进行中...')
    }
    setIsPlaying(true)
  }

  const currentAlgSteps = algorithm === 'dfs' ? dfsSteps : bfsSteps
  const currentAlgPath = algorithm === 'dfs' ? dfsPath : bfsPath
  const currentAlgVisited = algorithm === 'dfs' ? dfsVisited : bfsVisited
  const currentStepData = currentAlgSteps[currentStep]

  return (
    <PageLayout
      title="迷宫寻路"
      emoji="🌀"
      hint={hintVisible ? '点击隐藏提示' : '点击显示提示'}
      stats={
        viewMode === 'dual'
          ? `DFS: ${dfsVisited} | BFS: ${bfsVisited} | 步: ${currentStep}/${Math.max(dfsSteps.length, bfsSteps.length)}`
          : `${algorithm.toUpperCase()}: ${currentAlgVisited} 探索 | 步: ${currentStep}/${currentAlgSteps.length}`
      }
      onHintClick={() => setHintVisible(!hintVisible)}
      controlPanel={
        <ControlPanel title="参数设置">
          <RangeInput label="迷宫大小" value={size} min={9} max={41} step={2} onChange={(v) => { setSize(v); setIsPlaying(false) }} />
          <RangeInput label="障碍密度" value={Math.round(wallDensity * 100)} min={10} max={50} step={5} unit="%" onChange={(v) => { setWallDensity(v / 100); setIsPlaying(false) }} />
          <Select label="显示模式" value={viewMode} onChange={(v) => { setViewMode(v as MazeViewMode); setIsPlaying(false) }} options={[
            { value: 'dual', label: '同屏对比 (DFS ⚔️ BFS)' },
            { value: 'single', label: '单算法视图' },
          ]} />
          {viewMode === 'single' && (
            <Select label="算法选择" value={algorithm} onChange={(v) => { setAlgorithm(v as 'dfs' | 'bfs'); setIsPlaying(false) }} options={[
              { value: 'dfs', label: 'DFS 深度优先搜索' },
              { value: 'bfs', label: 'BFS 广度优先搜索' },
            ]} />
          )}
          <RangeInput label="动画速度" value={speed} min={1} max={10} step={1} onChange={setSpeed} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={handleStart}>{isPlaying ? '⏸️ 暂停' : '▶️ 开始'}</Button>
            <Button onClick={handleStepForward} disabled={currentStep >= Math.max(dfsSteps.length, bfsSteps.length)}>⏭️ 单步</Button>
            <Button variant="danger" onClick={resetMaze}>🔄 重置</Button>
          </div>
          {hintVisible && (
            <div className={infoPanelStyles.hintBox || ''} style={{
              background: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: 'var(--accent-cyan)',
              lineHeight: '1.8',
            }}>
              💡 同屏对比模式下，左侧青色为 DFS 搜索，右侧紫色为 BFS 搜索。DFS 适合路径深但分支少的场景，BFS 保证找到最短路径。
            </div>
          )}
        </ControlPanel>
      }
      visualization={
        <div className={styles.visualization}>
          <div className={styles.mazeRow}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {viewMode === 'dual' && <span className={styles.mazeLabel} style={{ color: '#00e5ff' }}>🔵 DFS</span>}
              {viewMode === 'single' && algorithm === 'dfs' && <span className={styles.mazeLabel} style={{ color: '#00e5ff' }}>🔵 DFS</span>}
              {viewMode === 'single' && algorithm === 'bfs' && <span className={styles.mazeLabel} style={{ color: '#b388ff' }}>🟣 BFS</span>}
              <canvas
                ref={dfsCanvasRef}
                width={size * CELL_SIZE}
                height={size * CELL_SIZE}
                className={styles.canvas}
              />
            </div>
            {viewMode === 'dual' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className={styles.mazeLabel} style={{ color: '#b388ff' }}>🟣 BFS</span>
                <canvas
                  ref={bfsCanvasRef}
                  width={size * CELL_SIZE}
                  height={size * CELL_SIZE}
                  className={styles.canvas}
                />
              </div>
            )}
          </div>
        </div>
      }
      infoPanel={
        <InfoPanel title="步骤详情">
          <span className={infoPanelStyles.sectionTitle}>当前步骤</span>
          <div className={infoPanelStyles.stepText}>
            {currentStepData?.description || statusText}
          </div>
          <span className={infoPanelStyles.sectionTitle}>颜色图例</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
            <div>🟦 已探索 (DFS)</div>
            <div>🟪 已探索 (BFS)</div>
            <div>🟥 回溯节点</div>
            <div>🟨 最短路径</div>
            <div>🟢 起点 S</div>
            <div>🔴 终点 E</div>
            <div>⬛ 墙壁</div>
          </div>
          <span className={infoPanelStyles.sectionTitle}>算法复杂度</span>
          <div className={infoPanelStyles.complexityBox}>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>DFS 时间</span>
              <span className={infoPanelStyles.complexityValue}>O(V + E)</span>
            </div>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>BFS 时间</span>
              <span className={infoPanelStyles.complexityValue}>O(V + E)</span>
            </div>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>空间复杂度</span>
              <span className={infoPanelStyles.complexityValue}>O(V)</span>
            </div>
          </div>
          <span className={infoPanelStyles.sectionTitle}>探索统计</span>
          <div className={infoPanelStyles.complexityBox}>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>DFS 探索节点</span>
              <span className={infoPanelStyles.complexityValue}>{dfsVisited}</span>
            </div>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>BFS 探索节点</span>
              <span className={infoPanelStyles.complexityValue}>{bfsVisited}</span>
            </div>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>DFS 路径长度</span>
              <span className={infoPanelStyles.complexityValue}>{dfsPath.length || '-'}</span>
            </div>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>BFS 路径长度</span>
              <span className={infoPanelStyles.complexityValue}>{bfsPath.length || '-'}</span>
            </div>
          </div>
        </InfoPanel>
      }
    />
  )
}
