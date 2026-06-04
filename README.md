# 数据结构经典算法可视化演示系统

> 基于 React + TypeScript + Canvas 的数据结构经典算法交互式可视化系统，支持迷宫寻路、表达式求值、霍夫曼编码、Dijkstra 最短路径、拓扑排序五大模块。

## ✨ 功能亮点

- 🎮 **迷宫寻路**：DFS（深度优先）与 BFS（广度优先）同屏对比，展示栈/队列工作过程
- 🧮 **表达式求值**：中缀转后缀双栈可视化，逐字符动画展示计算步骤
- 🌳 **霍夫曼编码**：动态构建霍夫曼树，展示编码表与压缩率
- 🗺️ **最短路径**：Dijkstra 算法在网格地图上寻找最短路径，距离数组实时更新
- 📋 **拓扑排序**：有向无环图拓扑排序动画，支持课程依赖场景模拟

## 🛠 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **路由**：React Router v6 (Hash 路由)
- **可视化**：Canvas 2D + SVG
- **样式**：CSS Modules + 深色科技风

## 📁 项目结构

\`\`\`
src/
├── algorithms/        # 各算法核心逻辑（迷宫生成、DFS、BFS、Dijkstra 等）
├── components/        # 通用组件（PageLayout、ControlPanel、InfoPanel、Icons）
├── pages/             # 五大算法页面（MazePage、ExpressionPage 等）
├── App.tsx            # 主路由与卡片式主页
└── main.tsx           # 入口文件
\`\`\`

## 🚀 本地运行

> 确保已安装 Node.js (推荐 v18+)，然后执行：

```bash

# 1. 克隆仓库
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```
>浏览器访问 http://localhost:5173 即可查看系统。


## 📦 构建生产版本

```bash

npm run build
npm run preview   # 预览生产构建



```
## 🧪 算法演示

>每个子页面均提供：
- 参数调节（大小、速度、障碍密度等）
- 播放/暂停/单步/重置控制
- 实时算法状态面板（栈、队列、距离表、入度表等）
- 颜色图例与复杂度分析
## 📝 开发说明

>本项目为数据结构课程大作业，部分代码在 **DeepSeek** 与 **Trae 编辑器** 的辅助下生成，旨在探索 AI 协同编程在算法可视化中的实践。

## 📸 截图


## 📄 License

>仅供学习交流使用。
