// 动画控制状态
export interface AnimationState {
  isPlaying: boolean;
  speed: number;
  currentStep: number;
  totalSteps: number;
}

// 动画步骤基础接口
export interface AnimationStep {
  type: string;
  description: string;
}

// 迷宫相关类型
export type CellType = 'wall' | 'empty' | 'visited' | 'exploring' | 'backtrack' | 'path' | 'start' | 'end';

export interface MazeCell {
  row: number;
  col: number;
  type: CellType;
}

export type AlgorithmType = 'dfs' | 'bfs';

// 表达式求值相关类型
export interface ExprStep extends AnimationStep {
  currentChar?: string;
  index?: number;
  operatorStack?: string[];
  operandStack?: number[];
  postfix?: string[];
}

// 霍夫曼编码相关类型
export interface HuffmanNode {
  char: string;
  freq: number;
  left: HuffmanNode | null;
  right: HuffmanNode | null;
  id: string;
}

export interface HuffmanStep extends AnimationStep {
  nodes?: HuffmanNode[];
  mergeLeft?: HuffmanNode;
  mergeRight?: HuffmanNode;
  newNode?: HuffmanNode;
  codeTable?: Map<string, string>;
}

// Dijkstra 相关类型
export interface GridNode {
  row: number;
  col: number;
  isWall: boolean;
  isStart: boolean;
  isEnd: boolean;
  distance: number;
  visited: boolean;
  previous: GridNode | null;
}

export interface DijkstraStep extends AnimationStep {
  currentRow?: number;
  currentCol?: number;
  visitedCount?: number;
  distances?: Map<string, number>;
}

// 拓扑排序相关类型
export interface TopoNode {
  id: string;
  label: string;
  indegree: number;
}

export interface TopoEdge {
  from: string;
  to: string;
}

export interface TopoStep extends AnimationStep {
  currentNode?: string;
  removedEdges?: TopoEdge[];
  sortedNodes?: string[];
  indegreeMap?: Map<string, number>;
}
