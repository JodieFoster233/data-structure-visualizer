import { Link } from 'react-router-dom'
import styles from './Navbar.module.css'

interface NavbarProps {
  title: string
  emoji?: string
  hint?: string
  stats?: string
  showBack?: boolean
  onHintClick?: () => void
}

export default function Navbar({ title, emoji, hint, stats, showBack = true, onHintClick }: NavbarProps) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarLeft}>
        {showBack && (
          <Link to="/" className={styles.backBtn}>
            ← 返回首页
          </Link>
        )}
        <span className={styles.pageTitle}>
          {emoji && <span className={styles.pageTitleEmoji}>{emoji}</span>}
          {title}
        </span>
      </div>
      <div className={styles.navbarRight}>
        {stats && <span className={styles.statsBadge}>{stats}</span>}
        {hint && (
          <button className={styles.hintBtn} onClick={onHintClick}>
            💡 操作提示
          </button>
        )}
      </div>
    </nav>
  )
}
