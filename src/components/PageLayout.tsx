import { ReactNode } from 'react'
import Navbar from './Navbar'
import styles from './PageLayout.module.css'

interface PageLayoutProps {
  title: string
  emoji?: string
  hint?: string
  stats?: string
  controlPanel: ReactNode
  visualization: ReactNode
  infoPanel: ReactNode
  onHintClick?: () => void
}

export default function PageLayout({
  title,
  emoji,
  hint,
  stats,
  controlPanel,
  visualization,
  infoPanel,
  onHintClick,
}: PageLayoutProps) {
  return (
    <div className={styles.container}>
      <Navbar
        title={title}
        emoji={emoji}
        hint={hint}
        stats={stats}
        onHintClick={onHintClick}
      />
      <div className={styles.main}>
        <div className={styles.left}>{controlPanel}</div>
        <div className={styles.center}>{visualization}</div>
        <div className={styles.right}>{infoPanel}</div>
      </div>
    </div>
  )
}
