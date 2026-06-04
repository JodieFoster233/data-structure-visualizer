import { useState, useRef, useEffect, useCallback } from 'react'
import PageLayout from '../components/PageLayout'
import { ControlPanel, Button, RangeInput } from '../components/ControlPanel'
import InfoPanel, { infoPanelStyles } from '../components/InfoPanel'
import { topologicalSort, TopoStep } from '../algorithms/topo'
import type { TopoNode, TopoEdge } from '../algorithms/topo'
import styles from './TopoPage.module.css'

const NODE_R = 36

const defaultNodes: TopoNode[] = [
  { id: 'math1', label: '微积分Ⅰ', indegree: 0, x: 150, y: 50 },
  { id: 'prog', label: '程序设计基础', indegree: 0, x: 450, y: 30 },
  { id: 'math2', label: '线性代数', indegree: 1, x: 60, y: 200 },
  { id: 'ds', label: '数据结构', indegree: 1, x: 340, y: 160 },
  { id: 'discrete', label: '离散数学', indegree: 1, x: 560, y: 150 },
  { id: 'org', label: '计算机组成原理', indegree: 1, x: 650, y: 50 },
  { id: 'algo', label: '算法设计与分析', indegree: 2, x: 340, y: 310 },
  { id: 'os', label: '操作系统', indegree: 2, x: 460, y: 280 },
  { id: 'net', label: '计算机网络', indegree: 1, x: 600, y: 280 },
  { id: 'db', label: '数据库系统', indegree: 1, x: 220, y: 290 },
]

const defaultEdges: TopoEdge[] = [
  { from: 'math1', to: 'math2' },
  { from: 'prog', to: 'ds' },
  { from: 'prog', to: 'discrete' },
  { from: 'prog', to: 'org' },
  { from: 'ds', to: 'algo' },
  { from: 'discrete', to: 'algo' },
  { from: 'ds', to: 'os' },
  { from: 'org', to: 'os' },
  { from: 'os', to: 'net' },
  { from: 'ds', to: 'db' },
]

export default function TopoPage() {
  const [nodes] = useState<TopoNode[]>(defaultNodes)
  const [edges] = useState<TopoEdge[]>(defaultEdges)
  const [speed, setSpeed] = useState(5)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<TopoStep[]>([])
  const [removedEdges, setRemovedEdges] = useState<Set<string>>(new Set())
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [statusText, setStatusText] = useState('预设为大学先修课程依赖图，点击"开始排序"')
  const [hintVisible, setHintVisible] = useState(true)
  const animFrameRef = useRef<number>(0)

  const computeSteps = useCallback(() => {
    const s: TopoStep[] = []
    for (const step of topologicalSort(defaultNodes, defaultEdges)) {
      s.push(step)
    }
    setSteps(s)
    setCurrentStep(0)
    setRemovedEdges(new Set())
    setActiveNode(null)
    setIsPlaying(false)
    setStatusText(`生成 ${s.length} 个动画步骤，请点击开始`)
  }, [])

  useEffect(() => {
    computeSteps()
  }, [computeSteps])

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const currentData = steps[currentStep]
  const sortedNodes = currentData?.sortedNodes || []
  const indegreeMap = currentData?.indegreeMap || new Map()

  const animate = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1
      if (next >= steps.length) {
        setIsPlaying(false)
        setActiveNode(null)
        setStatusText('拓扑排序完成！')
        return prev
      }
      const step = steps[next]
      setStatusText(step?.description || '')

      if (step?.type === 'select') {
        setActiveNode(step.currentNode || null)
      }

      if (step?.type === 'remove' && step.removedEdges) {
        setRemovedEdges((prevRemoved) => {
          const nextSet = new Set(prevRemoved)
          for (const e of step.removedEdges!) {
            nextSet.add(`${e.from}→${e.to}`)
          }
          return nextSet
        })
        setActiveNode(null)
      }

      return next
    })
  }, [steps])

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      return
    }

    let lastTime = 0
    const interval = Math.max(50, 900 - speed * 85)

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
      setRemovedEdges(new Set())
      setActiveNode(null)
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
    setRemovedEdges(new Set())
    setActiveNode(null)
    computeSteps()
    setIsPlaying(false)
  }

  const getNodeColor = (nodeId: string): string => {
    if (activeNode === nodeId) return '#69f0ae'
    if (sortedNodes.includes(nodeId)) return '#1b5e20'
    return '#16163a'
  }

  const getNodeStroke = (nodeId: string): string => {
    if (activeNode === nodeId) return '#69f0ae'
    if (sortedNodes.includes(nodeId)) return '#4caf50'
    return '#4a4a8a'
  }

  const getNodeFlash = (nodeId: string): string | undefined => {
    return activeNode === nodeId ? styles.nodeFlash : undefined
  }

  return (
    <PageLayout
      title="拓扑排序"
      emoji="📋"
      hint={hintVisible ? '点击隐藏提示' : '点击显示提示'}
      stats={`已排序: ${sortedNodes.length}/${nodes.length} | 步: ${currentStep}/${steps.length}`}
      onHintClick={() => setHintVisible(!hintVisible)}
      controlPanel={
        <ControlPanel title="参数设置">
          <RangeInput label="动画速度" value={speed} min={1} max={10} step={1} onChange={setSpeed} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={handleStart}>
              {isPlaying ? '⏸️ 暂停' : '▶️ 开始排序'}
            </Button>
            <Button onClick={handleStepForward} disabled={currentStep >= steps.length - 1}>
              ⏭️ 单步
            </Button>
            <Button variant="danger" onClick={handleReset}>
              🔄 重置
            </Button>
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
              💡 观察拓扑排序过程：绿色闪烁节点为当前选出的入度为 0 的节点，其出边将被移除，已排序节点变为深绿色。
            </div>
          )}
        </ControlPanel>
      }
      visualization={
        <div className={styles.visualization}>
          <svg
            width="760"
            height="400"
            viewBox="0 0 760 400"
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              minHeight: 400,
            }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#5a5a8a" />
              </marker>
              <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#69f0ae" />
              </marker>
              <marker id="arrowhead-removed" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,82,82,0.5)" />
              </marker>
            </defs>

            {edges.map((edge) => {
              const fromNode = nodeMap.get(edge.from)
              const toNode = nodeMap.get(edge.to)
              if (!fromNode || !toNode) return null

              const key = `${edge.from}→${edge.to}`
              const isRemoved = removedEdges.has(key)
              if (isRemoved) return null

              const dx = (toNode.x || 0) - (fromNode.x || 0)
              const dy = (toNode.y || 0) - (fromNode.y || 0)
              const dist = Math.sqrt(dx * dx + dy * dy)
              const ux = dx / dist
              const uy = dy / dist

              const sx = (fromNode.x || 0) + ux * NODE_R
              const sy = (fromNode.y || 0) + uy * NODE_R
              const ex = (toNode.x || 0) - ux * NODE_R
              const ey = (toNode.y || 0) - uy * NODE_R

              const isFromActive = activeNode === edge.from
              const isFromSorted = sortedNodes.includes(edge.from)

              return (
                <line
                  key={key}
                  x1={sx}
                  y1={sy}
                  x2={ex}
                  y2={ey}
                  stroke={isFromActive ? '#69f0ae' : isFromSorted ? 'rgba(255,82,82,0.6)' : '#5a5a8a'}
                  strokeWidth={isFromActive ? 2.5 : 1.5}
                  strokeDasharray={isFromSorted ? '6 3' : undefined}
                  markerEnd={isFromActive ? 'url(#arrowhead-active)' : isFromSorted ? 'url(#arrowhead-removed)' : 'url(#arrowhead)'}
                  className={isFromActive ? styles.edgePulse : ''}
                />
              )
            })}

            {nodes.map((node) => {
              const cx = node.x || 0
              const cy = node.y || 0
              const deg = indegreeMap.get(node.id)
              const isSorted = sortedNodes.includes(node.id)

              return (
                <g key={node.id}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={NODE_R}
                    fill={getNodeColor(node.id)}
                    stroke={getNodeStroke(node.id)}
                    strokeWidth={activeNode === node.id ? 3 : 2}
                    className={`${activeNode === node.id ? styles.nodeFlash : ''} ${isSorted ? styles.nodeDone : ''}`}
                  />
                  <text
                    x={cx}
                    y={cy - 4}
                    textAnchor="middle"
                    fill={isSorted ? '#a5d6a7' : '#e0e0f0'}
                    fontSize="13"
                    fontWeight={600}
                  >
                    {node.label}
                  </text>
                  <text
                    x={cx}
                    y={cy + 16}
                    textAnchor="middle"
                    fill={isSorted ? '#81c784' : '#9090b0'}
                    fontSize="11"
                  >
                    入度:{deg !== undefined ? deg : node.indegree}
                  </text>
                </g>
              )
            })}
          </svg>

          {sortedNodes.length > 0 && (
            <div className={styles.resultBar}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginRight: 8 }}>
                排序结果:
              </span>
              {sortedNodes.map((nodeId, idx) => (
                <span
                  key={nodeId}
                  className={`${styles.resultNode} ${idx === sortedNodes.length - 1 ? styles.resultNodeEnter : ''}`}
                >
                  {idx + 1}. {nodeMap.get(nodeId)?.label || nodeId}
                </span>
              ))}
            </div>
          )}
        </div>
      }
      infoPanel={
        <InfoPanel title="排序详情">
          <span className={infoPanelStyles.sectionTitle}>当前步骤</span>
          <div className={infoPanelStyles.stepText}>
            {currentData?.description || statusText}
          </div>
          <span className={infoPanelStyles.sectionTitle}>入度表</span>
          <div className={infoPanelStyles.tableWrapper}>
            <table className={infoPanelStyles.table}>
              <thead>
                <tr>
                  <th>课程</th>
                  <th>入度</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node) => {
                  const deg = indegreeMap.get(node.id)
                  const isSorted = sortedNodes.includes(node.id)
                  const isActive = activeNode === node.id
                  return (
                    <tr key={node.id} className={isActive ? infoPanelStyles.highlightRow : ''}>
                      <td>{node.label}</td>
                      <td className={isActive ? infoPanelStyles.highlightCell : ''}>
                        {deg !== undefined ? deg : node.indegree}
                      </td>
                      <td className={isActive ? infoPanelStyles.highlightCell : ''}>
                        {isActive ? '🔄 选中' : isSorted ? '✅ 已排序' : '⏳ 等待'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <span className={infoPanelStyles.sectionTitle}>已移除的边</span>
          <div className={infoPanelStyles.badgeList}>
            {removedEdges.size === 0 ? (
              <span className={infoPanelStyles.badge}>(无)</span>
            ) : (
              Array.from(removedEdges).map((key) => {
                const [from, to] = key.split('→')
                return (
                  <span key={key} className={infoPanelStyles.badge}>
                    {nodeMap.get(from)?.label || from} → {nodeMap.get(to)?.label || to}
                  </span>
                )
              })
            )}
          </div>
          <span className={infoPanelStyles.sectionTitle}>排序结果</span>
          <div className={infoPanelStyles.dataDisplay}>
            {sortedNodes.length > 0
              ? sortedNodes.map((id) => nodeMap.get(id)?.label || id).join(' → ')
              : '(尚未开始排序)'}
          </div>
          <span className={infoPanelStyles.sectionTitle}>算法复杂度</span>
          <div className={infoPanelStyles.complexityBox}>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>时间</span>
              <span className={infoPanelStyles.complexityValue}>O(V + E)</span>
            </div>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>空间</span>
              <span className={infoPanelStyles.complexityValue}>O(V + E)</span>
            </div>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>节点数</span>
              <span className={infoPanelStyles.complexityValue}>{nodes.length}</span>
            </div>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>边数</span>
              <span className={infoPanelStyles.complexityValue}>{edges.length}</span>
            </div>
          </div>
        </InfoPanel>
      }
    />
  )
}
