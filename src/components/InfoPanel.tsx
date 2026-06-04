import { ReactNode } from 'react'
import styles from './InfoPanel.module.css'

interface InfoPanelProps {
  title?: string
  children: ReactNode
}

export default function InfoPanel({ title = '信息面板', children }: InfoPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>{title}</div>
      <div className={styles.content}>{children}</div>
    </div>
  )
}

export { styles as infoPanelStyles }
