import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './HomePage.module.css'

const pages = [
  {
    path: '/maze',
    emoji: '🌀',
    title: '迷宫寻路',
    desc: 'DFS 深度优先搜索与 BFS 广度优先搜索的动画对比，同屏双迷宫实时展示搜索过程',
    tags: ['DFS', 'BFS', '回溯'],
  },
  {
    path: '/expression',
    emoji: '🧮',
    title: '表达式求值',
    desc: '中缀表达式转后缀表达式并计算的完整过程展示，双栈联动动画演示',
    tags: ['栈', '后缀表达式', '运算符优先级'],
  },
  {
    path: '/huffman',
    emoji: '🌳',
    title: '霍夫曼编码',
    desc: '根据输入文本动态构建霍夫曼树，生成最优前缀编码，展示压缩效果',
    tags: ['二叉树', '贪心算法', '数据压缩'],
  },
  {
    path: '/dijkstra',
    emoji: '🗺️',
    title: '最短路径',
    desc: 'Dijkstra 算法在网格地图上寻找最短路径，支持自定义起点终点和障碍',
    tags: ['Dijkstra', '优先队列', '最短路径'],
  },
  {
    path: '/topo',
    emoji: '📋',
    title: '拓扑排序',
    desc: '有向无环图的拓扑排序过程，模拟大学先修课程安排的依赖关系',
    tags: ['DAG', '入度表', '课程安排'],
  },
]

export default function HomePage() {
  const [showAbout, setShowAbout] = useState(false)

  return (
    <div className={styles.homePage}>
      <button className={styles.aboutBtn} onClick={() => setShowAbout(true)}>
        ℹ️ 关于
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>数据结构经典算法可视化</h1>
        <p className={styles.subtitle}>
          基于 <span className={styles.subtitleHighlight}>DeepSeek</span> &{' '}
          <span className={styles.subtitleHighlight}>Trae</span> 协同构建
        </p>
      </div>

      <div className={styles.cardGrid}>
        {pages.map((page) => (
          <Link key={page.path} to={page.path} className={styles.card}>
            <span className={styles.cardEmoji}>{page.emoji}</span>
            <h2 className={styles.cardTitle}>{page.title}</h2>
            <p className={styles.cardDesc}>{page.desc}</p>
            <div className={styles.cardTags}>
              {page.tags.map((tag) => (
                <span key={tag} className={styles.cardTag}>
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {showAbout && (
        <div className={styles.overlay} onClick={() => setShowAbout(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>ℹ️ 关于本项目</h2>
            <div className={styles.techGrid}>
              <div className={styles.techItem}>
                <span className={styles.techItemEmoji}>⚛️</span>
                React 18 + TypeScript
              </div>
              <div className={styles.techItem}>
                <span className={styles.techItemEmoji}>⚡</span>
                Vite 6 构建工具
              </div>
              <div className={styles.techItem}>
                <span className={styles.techItemEmoji}>🎨</span>
                CSS Modules 样式
              </div>
              <div className={styles.techItem}>
                <span className={styles.techItemEmoji}>🖼️</span>
                Canvas / SVG 动画
              </div>
              <div className={styles.techItem}>
                <span className={styles.techItemEmoji}>🔄</span>
                requestAnimationFrame
              </div>
              <div className={styles.techItem}>
                <span className={styles.techItemEmoji}>🤖</span>
                DeepSeek & Trae 协同
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.8' }}>
              本项目是一个数据结构经典算法的交互式可视化演示系统，涵盖迷宫寻路、表达式求值、霍夫曼编码、最短路径和拓扑排序五大算法。所有动画均基于 Canvas/SVG 和 requestAnimationFrame 实现，支持暂停、速度调节和单步执行。
            </p>
            <button className={styles.closeBtn} onClick={() => setShowAbout(false)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
