import { ReactNode } from 'react'
import styles from './ControlPanel.module.css'

interface ControlPanelProps {
  title?: string
  children: ReactNode
  hint?: string
}

export function ControlPanel({ title = '控制面板', children, hint }: ControlPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>{title}</div>
      {children}
      {hint && <div className={styles.hintBox}>{hint}</div>}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'secondary',
  disabled,
  style,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  style?: React.CSSProperties
}) {
  const cls = `${styles.btn} ${variant === 'primary' ? styles.btnPrimary : variant === 'danger' ? styles.btnDanger : styles.btnSecondary}`
  return (
    <button className={cls} onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  )
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className={styles.controlGroup}>
      <span className={styles.label}>{label}</span>
      <select className={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function RangeInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  unit?: string
}) {
  return (
    <div className={styles.controlGroup}>
      <span className={styles.label}>{label}</span>
      <div className={styles.rangeGroup}>
        <input
          type="range"
          className={styles.rangeInput}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className={styles.rangeValue}>
          {value}
          {unit}
        </span>
      </div>
    </div>
  )
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className={styles.controlGroup}>
      <span className={styles.label}>{label}</span>
      <input
        className={styles.input}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export { styles as controlStyles }
