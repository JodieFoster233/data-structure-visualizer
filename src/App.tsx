import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MazePage from './pages/MazePage'
import ExpressionPage from './pages/ExpressionPage'
import HuffmanPage from './pages/HuffmanPage'
import DijkstraPage from './pages/DijkstraPage'
import TopoPage from './pages/TopoPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/maze" element={<MazePage />} />
      <Route path="/expression" element={<ExpressionPage />} />
      <Route path="/huffman" element={<HuffmanPage />} />
      <Route path="/dijkstra" element={<DijkstraPage />} />
      <Route path="/topo" element={<TopoPage />} />
    </Routes>
  )
}
