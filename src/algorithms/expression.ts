export interface ExprStep {
  type: 'scan' | 'pushOp' | 'popOp' | 'pushNum' | 'calc' | 'result' | 'error'
  currentChar?: string
  index?: number
  operatorStack: string[]
  operandStack: number[]
  postfix: string[]
  description: string
  result?: number
}

function precedence(op: string): number {
  if (op === '+' || op === '-') return 1
  if (op === '*' || op === '/') return 2
  return 0
}

function applyOp(a: number, b: number, op: string): number {
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '*': return a * b
    case '/': return Math.floor(a / b)
    default: return 0
  }
}

export function* evaluateExpression(expr: string): Generator<ExprStep> {
  const opStack: string[] = []
  const numStack: number[] = []
  const postfix: string[] = []
  const tokens = expr.replace(/\s+/g, '').split('')

  if (tokens.length === 0) {
    yield {
      type: 'error',
      operatorStack: [...opStack],
      operandStack: [...numStack],
      postfix: [...postfix],
      description: '表达式为空',
    }
    return
  }

  let i = 0
  while (i < tokens.length) {
    const ch = tokens[i]

    if (ch === '(') {
      opStack.push(ch)
      yield {
        type: 'pushOp',
        currentChar: ch,
        index: i,
        operatorStack: [...opStack],
        operandStack: [...numStack],
        postfix: [...postfix],
        description: `扫描到 '('，压入运算符栈`,
      }
      i++
    } else if (ch === ')') {
      while (opStack.length > 0 && opStack[opStack.length - 1] !== '(') {
        const op = opStack.pop()!
        postfix.push(op)

        const b = numStack.pop()!
        const a = numStack.pop()!
        const val = applyOp(a, b, op)
        numStack.push(val)

        yield {
          type: 'calc',
          currentChar: op,
          index: i,
          operatorStack: [...opStack],
          operandStack: [...numStack],
          postfix: [...postfix],
          description: `遇到 ')'，弹出运算符 '${op}'，后缀: ${postfix.join(' ')}，计算 ${a} ${op} ${b} = ${val}`,
        }
      }
      if (opStack.length > 0 && opStack[opStack.length - 1] === '(') {
        opStack.pop()
        yield {
          type: 'popOp',
          currentChar: '(',
          index: i,
          operatorStack: [...opStack],
          operandStack: [...numStack],
          postfix: [...postfix],
          description: `弹出并丢弃 '('`,
        }
      }
      i++
    } else if ('+-*/'.includes(ch)) {
      while (
        opStack.length > 0 &&
        opStack[opStack.length - 1] !== '(' &&
        precedence(opStack[opStack.length - 1]) >= precedence(ch)
      ) {
        const op = opStack.pop()!
        postfix.push(op)

        const b = numStack.pop()!
        const a = numStack.pop()!
        const val = applyOp(a, b, op)
        numStack.push(val)

        yield {
          type: 'calc',
          currentChar: op,
          index: i,
          operatorStack: [...opStack],
          operandStack: [...numStack],
          postfix: [...postfix],
          description: `扫描到 '${ch}'，弹出高优先级运算符 '${op}'，后缀: ${postfix.join(' ')}，计算 ${a} ${op} ${b} = ${val}`,
        }
      }
      opStack.push(ch)
      yield {
        type: 'pushOp',
        currentChar: ch,
        index: i,
        operatorStack: [...opStack],
        operandStack: [...numStack],
        postfix: [...postfix],
        description: `运算符 '${ch}' 压入运算符栈`,
      }
      i++
    } else if (ch >= '0' && ch <= '9') {
      let numStr = ''
      while (i < tokens.length && tokens[i] >= '0' && tokens[i] <= '9') {
        numStr += tokens[i]
        i++
      }
      const num = parseInt(numStr, 10)
      numStack.push(num)
      postfix.push(numStr)
      yield {
        type: 'pushNum',
        currentChar: numStr,
        index: i - numStr.length,
        operatorStack: [...opStack],
        operandStack: [...numStack],
        postfix: [...postfix],
        description: `扫描到操作数 ${numStr}，压入操作数栈，后缀: ${postfix.join(' ')}`,
      }
    } else {
      yield {
        type: 'error',
        currentChar: ch,
        index: i,
        operatorStack: [...opStack],
        operandStack: [...numStack],
        postfix: [...postfix],
        description: `非法字符: '${ch}'`,
      }
      return
    }
  }

  while (opStack.length > 0) {
    const op = opStack.pop()!
    if (op === '(' || op === ')') continue
    postfix.push(op)

    const b = numStack.pop()!
    const a = numStack.pop()!
    const val = applyOp(a, b, op)
    numStack.push(val)

    yield {
      type: 'calc',
      currentChar: op,
      index: tokens.length,
      operatorStack: [...opStack],
      operandStack: [...numStack],
      postfix: [...postfix],
      description: `弹出剩余运算符 '${op}'，后缀: ${postfix.join(' ')}，计算 ${a} ${op} ${b} = ${val}`,
    }
  }

  yield {
    type: 'result',
    operatorStack: [...opStack],
    operandStack: [...numStack],
    postfix: [...postfix],
    description: `计算完成！后缀表达式: ${postfix.join(' ')}，结果: ${numStack[0]}`,
    result: numStack[0],
  }
}
