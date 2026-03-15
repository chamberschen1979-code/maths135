// src/components/LatexRenderer.jsx
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css' // 确保引入 KaTeX 样式

class LatexErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-500 text-xs font-mono bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
          <div className="font-bold mb-1">⚠️ 公式渲染失败</div>
          <div className="opacity-75 break-all">{this.props.content}</div>
        </div>
      )
    }
    return this.props.children
  }
}

const LatexRenderer = ({ content }) => {
  if (!content) return null

  // 1. 确保内容是字符串
  let contentStr = typeof content === 'string' ? content : String(content)

  // 2. 【关键修复】清理可能干扰 Markdown 解析的多余转义
  // 如果 Parser 已经修复了 JSON 转义，这里主要是为了防御性编程
  // 将 \\n 还原为换行，但保留 LaTeX 命令中的反斜杠
  contentStr = contentStr.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n')

  // 3. 【核心逻辑】确保行内公式 $...$ 不被 Markdown 误伤
  // react-markdown + remark-math 通常能自动识别 $...$
  // 但有时如果 $ 前后没有空格或紧挨着标点，可能需要额外注意
  // 这里我们不做过度的正则替换，信任插件的能力
  
  // 4. 针对 "答案" 字段的特殊优化
  // 如果内容看起来像纯公式 (以 $ 开头和结尾，且中间没有明显的 Markdown 结构)
  // 我们可以选择直接渲染，或者包裹一个空段落以确保插件触发
  const isPureFormula = /^(\$.*\$)$/.test(contentStr.trim()) && !contentStr.includes('\n') && !contentStr.includes('**') && !contentStr.includes('#')
  
  // 如果是纯公式，直接传入，让 remark-math 处理
  // 如果不是，作为普通 Markdown 处理
  
  return (
    <LatexErrorBoundary content={contentStr}>
      <div className="latex-content break-words leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[[rehypeKatex, { 
            strict: false, 
            trust: true,
            output: 'htmlAndMathml' // 兼容性更好
          }]]}
          components={{
            // 移除默认段落间距，使行内公式更紧凑
            p: ({node, children, ...props}) => {
              // 如果段落里只有一个公式，去掉 margin
              const isSingleFormula = children?.length === 1 && typeof children[0] === 'string' && /^\$.*\$$/.test(children[0])
              return (
                <p 
                  style={{ margin: isSingleFormula ? '0' : '0.5em 0' }} 
                  className={isSingleFormula ? 'inline' : ''}
                  {...props}
                >
                  {children}
                </p>
              )
            },
            // 确保数学节点不被额外包裹
            math: ({node, children, ...props}) => <span className="inline-block" {...props}>{children}</span>,
            inlineMath: ({node, children, ...props}) => <span className="inline-block" {...props}>{children}</span>,
          }}
        >
          {contentStr}
        </ReactMarkdown>
      </div>
    </LatexErrorBoundary>
  )
}

export default LatexRenderer