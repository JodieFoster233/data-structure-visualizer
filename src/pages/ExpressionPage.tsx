import { useState, useRef, useEffect, useCallback } from 'react'
import PageLayout from '../components/PageLayout'
import { ControlPanel, Button, TextInput, RangeInput } from '../components/ControlPanel'
import InfoPanel, { infoPanelStyles } from '../components/InfoPanel'
import { evaluateExpression, ExprStep } from '../algorithms/expression'
import styles from './ExpressionPage.module.css'

export default function ExpressionPage() {
  const [expression, setExpression] = useState('3+5*(2-8)')
  const [speed, setSpeed] = useState(5)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<ExprStep[]>([])
  const [result, setResult] = useState<number | null>(null)
  const [statusText, setStatusText] = useState('请输入表达式并点击"开始计算"')
  const [hintVisible, setHintVisible] = useState(true)
  const animFrameRef = useRef<number>(0)

  const computeSteps = useCallback(() => {
    const s: ExprStep[] = []
    try {
      for (const step of evaluateExpression(expression)) {
        s.push(step)
      }
    } catch {
      // handle error
    }
    setSteps(s)
    setCurrentStep(0)
    setResult(null)
    setIsPlaying(false)
    setStatusText(`生成 ${s.length} 个动画步骤，请点击开始`)
  }, [expression])

  useEffect(() => {
    computeSteps()
  }, [])

  const currentData = steps[currentStep]

  const animate = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1
      if (next >= steps.length) {
        setIsPlaying(false)
        const lastStep = steps[steps.length - 1]
        if (lastStep?.type === 'result' && lastStep.result !== undefined) {
          setResult(lastStep.result)
        }
        setStatusText('计算完成！')
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

  const tokens = expression.replace(/\s+/g, '').split('')

  return (
    <PageLayout
      title="表达式求值"
      emoji="🧮"
      hint={hintVisible ? '点击隐藏提示' : '点击显示提示'}
      stats={`步骤: ${currentStep}/${steps.length}`}
      onHintClick={() => setHintVisible(!hintVisible)}
      controlPanel={
        <ControlPanel title="参数设置">
          <TextInput
            label="输入表达式"
            value={expression}
            onChange={(v) => { setExpression(v); setIsPlaying(false) }}
            placeholder="例如: 3+5*(2-8)"
          />
          <RangeInput label="动画速度" value={speed} min={1} max={10} step={1} onChange={setSpeed} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={handleStart}>{isPlaying ? '⏸️ 暂停' : '▶️ 计算'}</Button>
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
              💡 支持 +、-、*、/ 运算和括号，操作数为整数。观察运算符栈和操作数栈的联动变化，理解中缀转后缀的完整过程。
            </div>
          )}
        </ControlPanel>
      }
      visualization={
        <div className={styles.visualization}>
          <div className={styles.expressionBar}>
            {tokens.map((ch, i) => (
              <span
                key={i}
                className={
                  currentData?.index === i
                    ? styles.highlightChar
                    : (currentData?.index !== undefined && i < (currentData.index + (currentData.currentChar?.length || 1)))
                    ? styles.scannedChar
                    : undefined
                }
              >
                {ch}
              </span>
            ))}
          </div>

          <div className={styles.stackContainer}>
            <div className={styles.stackBox}>
              <span className={styles.stackTitle}>📦 运算符栈</span>
              <div className={styles.stackVisual}>
                {currentData?.operatorStack?.map((item, i) => (
                  <div
                    key={i}
                    className={`${styles.stackItem} ${
                      currentData.type === 'pushOp' && currentData.currentChar === item ? styles.stackItemNew : ''
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.stackBox}>
              <span className={styles.stackTitle}>🔢 操作数栈</span>
              <div className={styles.stackVisual}>
                {currentData?.operandStack?.map((item, i) => (
                  <div
                    key={i}
                    className={`${styles.stackItem} ${
                      currentData.type === 'pushNum' && currentData.operandStack[0] === item ? styles.stackItemNew : ''
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {result !== null && (
            <div className={styles.resultBox}>
              📝 后缀表达式: {currentData?.postfix?.join(' ')}<br />
              ✨ 计算结果: {result}
            </div>
          )}

          <div className={styles.stepList}>
            {steps.slice(0, currentStep + 1).map((s, i) => (
              <div key={i} className={`${styles.stepLine} ${i === currentStep ? styles.stepLineActive : ''}`}>
                [{i}] {s.description}
              </div>
            ))}
          </div>
        </div>
      }
      infoPanel={
        <InfoPanel title="步骤详情">
          <span className={infoPanelStyles.sectionTitle}>当前操作</span>
          <div className={infoPanelStyles.stepText}>
            {currentData?.description || statusText}
          </div>
          <span className={infoPanelStyles.sectionTitle}>后缀表达式</span>
          <div className={infoPanelStyles.dataDisplay}>
            {currentData?.postfix?.join(' ') || '(等待计算)'}
          </div>
          <span className={infoPanelStyles.sectionTitle}>运算符栈</span>
          <div className={infoPanelStyles.dataDisplay}>
            [{currentData?.operatorStack?.join(', ') || ''}]
          </div>
          <span className={infoPanelStyles.sectionTitle}>操作数栈</span>
          <div className={infoPanelStyles.dataDisplay}>
            [{currentData?.operandStack?.join(', ') || ''}]
          </div>
          <span className={infoPanelStyles.sectionTitle}>算法复杂度</span>
          <div className={infoPanelStyles.complexityBox}>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>时间</span>
              <span className={infoPanelStyles.complexityValue}>O(n)</span>
            </div>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>空间</span>
              <span className={infoPanelStyles.complexityValue}>O(n)</span>
            </div>
            <div className={infoPanelStyles.complexityRow}>
              <span className={infoPanelStyles.complexityLabel}>表达式长度</span>
              <span className={infoPanelStyles.complexityValue}>{expression.length}</span>
            </div>
          </div>
        </InfoPanel>
      }
    />
  )
}
