import { useState, useRef, useEffect, useCallback } from 'react'
import PageLayout from '../components/PageLayout'
import { ControlPanel, Button, TextInput, RangeInput } from '../components/ControlPanel'
import InfoPanel, { infoPanelStyles } from '../components/InfoPanel'
import { buildHuffmanTree, generateCodeTable, HuffmanStep } from '../algorithms/huffman'
import styles from './HuffmanPage.module.css'

const NODE_RADIUS = 22
const LEVEL_HEIGHT = 70

export default function HuffmanPage() {
  const [text, setText] = useState('hello world')
  const [speed, setSpeed] = useState(5)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<HuffmanStep[]>([])
  const [selectedLeaf, setSelectedLeaf] = useState<string | null>(null)
  const [statusText, setStatusText] = useState('请输入文本并点击"构建"')
  const [hintVisible, setHintVisible] = useState(true)
  const animFrameRef = useRef<number>(0)
  const svgRef = useRef<SVGSVGElement>(null)

  const computeSteps = useCallback(() => {
    const s: HuffmanStep[] = []
    for (const step of buildHuffmanTree(text)) {
      s.push(step)
    }
    setSteps(s)
    setCurrentStep(0)
    setIsPlaying(false)
    setSelectedLeaf(null)
    setStatusText(`生成 ${s.length} 个动画步骤，请点击开始`)
  }, [text])

  useEffect(() => {
    computeSteps()
  }, [])

  const currentData = steps[currentStep]
  const root = currentData?.nodes?.[currentData.nodes.length - 1] || null
  const codeTable = root ? generateCodeTable(root) : new Map<string, string>()

  const originalBits = text.length * 8
  const compressedBits = Array.from(text).reduce((sum, ch) => sum + (codeTable.get(ch)?.length || 8), 0)
  const compressionRatio = originalBits > 0 ? ((1 - compressedBits / originalBits) * 100).toFixed(1) : '0'

  const computeLayout = (
    node: typeof root,
    xOff: number,
    yOff: number,
    levelWidth: number,
    posMap: Map<string, { x: number; y: number }>
  ): void => {
    if (!node) return
    posMap.set(node.id, { x: xOff, y: yOff })
    if (!node.left && !node.right) return
    const leftSize = countLeaves(node.left)
    const rightSize = countLeaves(node.right)
    if (node.left) computeLayout(node.left, xOff - (rightSize * levelWidth) / 2, yOff + LEVEL_HEIGHT, levelWidth, posMap)
    if (node.right) computeLayout(node.right, xOff + (leftSize * levelWidth) / 2, yOff + LEVEL_HEIGHT, levelWidth, posMap)
  }

  const countLeaves = (node: typeof root): number => {
    if (!node) return 0
    if (!node.left && !node.right) return 1
    return countLeaves(node.left) + countLeaves(node.right)
  }

  const renderTree = () => {
    if (!root) return null
    const totalLeaves = countLeaves(root)
    const spacing = Math.max(40, 800 / totalLeaves)
    const posMap = new Map<string, { x: number; y: number }>()
    computeLayout(root, 400, 50, spacing, posMap)

    const elements: JSX.Element[] = []

    const renderNode = (node: typeof root): void => {
      if (!node) return
      const pos = posMap.get(node.id)
      if (!pos) return
      const cx = pos.x
      const cy = pos.y
      const isLeaf = !node.left && !node.right
      const isHighlighted = currentData?.highlightIds?.includes(node.id)
      const isNew = currentData?.newId === node.id
      const isSelected = selectedLeaf === node.char

      if (node.left) {
        const leftPos = posMap.get(node.left.id)
        if (leftPos) {
          elements.push(
            <line
              key={`line-${node.id}-l`}
              x1={cx} y1={cy + NODE_RADIUS}
              x2={leftPos.x} y2={leftPos.y - NODE_RADIUS}
              stroke={isHighlighted ? '#ffd740' : '#3a3a6a'}
              strokeWidth={isHighlighted ? 3 : 1.5}
            />
          )
          renderNode(node.left)
        }
      }
      if (node.right) {
        const rightPos = posMap.get(node.right.id)
        if (rightPos) {
          elements.push(
            <line
              key={`line-${node.id}-r`}
              x1={cx} y1={cy + NODE_RADIUS}
              x2={rightPos.x} y2={rightPos.y - NODE_RADIUS}
              stroke={isHighlighted ? '#ffd740' : '#3a3a6a'}
              strokeWidth={isHighlighted ? 3 : 1.5}
            />
          )
          renderNode(node.right)
        }
      }

      elements.push(
        <g
          key={node.id}
          className={isNew ? styles.nodeEnter : ''}
          onClick={isLeaf ? () => setSelectedLeaf(selectedLeaf === node.char ? null : node.char) : undefined}
        >
          <circle
            cx={cx} cy={cy} r={NODE_RADIUS}
            fill={
              isNew ? 'rgba(255, 215, 64, 0.8)' :
              isHighlighted ? 'rgba(255, 171, 64, 0.8)' :
              isSelected ? 'rgba(0, 229, 255, 0.8)' :
              isLeaf ? '#16163a' : '#1a1a4a'
            }
            stroke={
              isHighlighted ? '#ffd740' :
              isNew ? '#ffab40' :
              isSelected ? '#00e5ff' :
              isLeaf ? '#4a4a8a' : '#3a3a6a'
            }
            strokeWidth={isHighlighted || isNew || isSelected ? 3 : 1.5}
            className={isLeaf ? styles.leafClickable : ''}
          />
          <text
            x={cx} y={cy - 4}
            textAnchor="middle"
            fill={isSelected ? '#fff' : isHighlighted ? '#fff' : '#e0e0f0'}
            fontSize="11"
            fontWeight={isLeaf ? 700 : 400}
          >
            {isLeaf ? `'${node.char}'` : node.freq}
          </text>
          <text
            x={cx} y={cy + 14}
            textAnchor="middle"
            fill={isSelected ? '#fff' : '#9090b0'}
            fontSize="10"
          >
            {isLeaf ? node.freq : ''}
          </text>
        </g>
      )
    }

    renderNode(root)
    return elements
  }

  const animate = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1
      if (next >= steps.length) {
        setIsPlaying(false)
        setStatusText('霍夫曼树构建完成！点击叶子节点查看编码')
        return prev
      }
      setStatusText(steps[next]?.description || '')
      return next
    })
  }, [steps])

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      return
    }
    let lastTime = 0
    const interval = Math.max(50, 800 - speed * 75)
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
    computeSteps()
    setIsPlaying(false)
  }

  return (
    <PageLayout
      title="霍夫曼编码"
      emoji="🌳"
      hint={hintVisible ? '点击隐藏提示' : '点击显示提示'}
      stats={`步骤: ${currentStep}/${steps.length}`}
      onHintClick={() => setHintVisible(!hintVisible)}
      controlPanel={
        <ControlPanel title="参数设置">
          <TextInput
            label="输入文本"
            value={text}
            onChange={(v) => { setText(v); setIsPlaying(false) }}
            placeholder="例如: hello world"
          />
          <RangeInput label="动画速度" value={speed} min={1} max={10} step={1} onChange={setSpeed} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={handleStart}>{isPlaying ? '⏸️ 暂停' : '▶️ 构建'}</Button>
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
              💡 橙色高亮节点为当前合并的最小频率节点。构建完成后，点击任意叶节点查看其霍夫曼编码。
            </div>
          )}
        </ControlPanel>
      }
      visualization={
        <div className={styles.visualization}>
          <svg
            ref={svgRef}
            width="800"
            height="500"
            style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}
            viewBox="0 0 800 500"
          >
            {renderTree()}
          </svg>
        </div>
      }
      infoPanel={
        <InfoPanel title="编码详情">
          <span className={infoPanelStyles.sectionTitle}>当前步骤</span>
          <div className={infoPanelStyles.stepText}>
            {currentData?.description || statusText}
          </div>
          {selectedLeaf && (
            <>
              <span className={infoPanelStyles.sectionTitle}>选中字符</span>
              <div className={infoPanelStyles.dataDisplay}>
                字符: '{selectedLeaf}' → 编码: {codeTable.get(selectedLeaf) || '(未计算)'}
              </div>
            </>
          )}
          <span className={infoPanelStyles.sectionTitle}>编码表</span>
          <div className={infoPanelStyles.tableWrapper}>
            {codeTable.size > 0 && (
              <table className={infoPanelStyles.table}>
                <thead>
                  <tr>
                    <th>字符</th>
                    <th>频率</th>
                    <th>编码</th>
                    <th>位数</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(codeTable.entries()).map(([char, code]) => (
                    <tr key={char} className={selectedLeaf === char ? infoPanelStyles.highlightRow : ''}>
                      <td>{char === ' ' ? '␣' : char}</td>
                      <td>{currentData?.nodes?.find(n => n.char === char)?.freq || '-'}</td>
                      <td className={infoPanelStyles.highlightCell}>{code}</td>
                      <td>{code.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <span className={infoPanelStyles.sectionTitle}>压缩统计</span>
          <div className={infoPanelStyles.complexityBox}>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>原始比特数</span>
              <span className={infoPanelStyles.complexityValue}>{originalBits} bits</span>
            </div>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>压缩后比特数</span>
              <span className={infoPanelStyles.complexityValue}>{compressedBits} bits</span>
            </div>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>压缩率</span>
              <span className={infoPanelStyles.complexityValue}>{compressionRatio}%</span>
            </div>
          </div>
          <span className={infoPanelStyles.sectionTitle}>算法复杂度</span>
          <div className={infoPanelStyles.complexityBox}>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>时间</span>
              <span className={infoPanelStyles.complexityValue}>O(n log n)</span>
            </div>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>空间</span>
              <span className={infoPanelStyles.complexityValue}>O(n)</span>
            </div>
          </div>
        </InfoPanel>
      }
    />
  )
}
