import { describe, it, expect } from 'vitest'
import { parseAIResponse } from './responseParser.js'

describe('parseAIResponse', () => {
  describe('JSON 提取', () => {
    it('应从混合文本中提取 JSON', () => {
      const rawText = '这是一些前置文本 {"question": "测试题目", "answer": "答案"} 后置文本'
      const result = parseAIResponse(rawText)
      expect(result.success).toBe(true)
      expect(result.data.question).toBe('测试题目')
    })

    it('应处理嵌套 JSON 结构', () => {
      const rawText = JSON.stringify({
        question: { content: '题目内容' },
        analysis: { core_idea: '核心思想', steps: ['步骤1', '步骤2'] },
        answer: { l1: '答案1', l2: '答案2' }
      })
      const result = parseAIResponse(rawText)
      expect(result.success).toBe(true)
      expect(result.data.question.content).toBe('题目内容')
      expect(result.data.analysis.steps).toHaveLength(2)
    })

    it('无 JSON 时应返回错误', () => {
      const rawText = '这是一段没有 JSON 的纯文本'
      const result = parseAIResponse(rawText)
      expect(result.success).toBe(false)
      expect(result.error).toContain('未在响应中找到有效的 JSON')
    })
  })

  describe('LaTeX 清洗', () => {
    it('应去除 Markdown 代码块标记', () => {
      const rawText = '{"question": "```json\\n题目内容\\n```", "answer": "答案"}'
      const result = parseAIResponse(rawText)
      expect(result.success).toBe(true)
      expect(result.data.question).not.toContain('```')
    })

    it('应修复双重包裹的 LaTeX', () => {
      const rawText = '{"question": "$ $x^2$ $", "answer": "答案"}'
      const result = parseAIResponse(rawText)
      expect(result.success).toBe(true)
      expect(result.data.question).toBe('$x^{2}$')
    })

    it('应保留 $$ 块级公式', () => {
      const rawText = '{"question": "$$x^2$$", "answer": "答案"}'
      const result = parseAIResponse(rawText)
      expect(result.success).toBe(true)
      expect(result.data.question).toBe('$$x^{2}$$')
    })
  })

  describe('字段验证', () => {
    it('缺少必要字段时应返回错误', () => {
      const rawText = '{"other_field": "值"}'
      const result = parseAIResponse(rawText)
      expect(result.success).toBe(false)
      expect(result.error).toContain('缺失必要字段')
    })

    it('有 question 字段时应成功', () => {
      const rawText = '{"question": "题目"}'
      const result = parseAIResponse(rawText)
      expect(result.success).toBe(true)
    })

    it('有 analysis 字段时应成功', () => {
      const rawText = '{"analysis": "解析内容"}'
      const result = parseAIResponse(rawText)
      expect(result.success).toBe(true)
    })

    it('有 answer 字段时应成功', () => {
      const rawText = '{"answer": "答案"}'
      const result = parseAIResponse(rawText)
      expect(result.success).toBe(true)
    })
  })

  describe('Reasoning 清洗', () => {
    it('应移除 reasoning 中的 LaTeX 符号', () => {
      const rawText = JSON.stringify({
        question: '题目',
        reasoning: {
          q1_params: { values: '$a=2$, $b=1$', reason: 'L2难度' }
        }
      })
      const result = parseAIResponse(rawText)
      expect(result.success).toBe(true)
      expect(result.data.reasoning.q1_params.values).not.toContain('$')
    })

    it('应递归清洗嵌套的 reasoning 对象', () => {
      const rawText = JSON.stringify({
        question: '题目',
        reasoning: {
          nested: {
            deep: '$x^2$',
            array: ['$a$', '$b$']
          }
        }
      })
      const result = parseAIResponse(rawText)
      expect(result.data.reasoning.nested.deep).toBe('x^2')
      expect(result.data.reasoning.nested.array[0]).toBe('a')
    })
  })

  describe('错误处理', () => {
    it('应返回原始文本预览', () => {
      const rawText = '无效 JSON {broken'
      const result = parseAIResponse(rawText)
      expect(result.success).toBe(false)
      expect(result.rawPreview).toBeDefined()
      expect(result.rawPreview.length).toBeLessThanOrEqual(300)
    })

    it('JSON 格式错误时应返回详细错误信息', () => {
      const rawText = '{"question": "题目", "broken": }'
      const result = parseAIResponse(rawText)
      expect(result.success).toBe(false)
      expect(result.error).toContain('JSON')
    })
  })

  describe('完整响应解析', () => {
    it('应正确解析完整的 AI 响应', () => {
      const rawText = JSON.stringify({
        reasoning: {
          q1_params: { values: 'a=2, b=1', reason: 'L2难度基础题' },
          verification: '验证通过'
        },
        question: {
          content: '已知集合 $A = \\{x \\mid x^2 - ax + b = 0\\}$，求 $a, b$ 的值。'
        },
        analysis: {
          core_idea: '利用集合的性质求解',
          steps: ['步骤1：分析集合', '步骤2：求解方程'],
          trap_hint: '注意判别式'
        },
        answer: {
          l1: '$a=2, b=1$',
          l2: '$x_1 > 0, x_2 > 0$'
        }
      })
      
      const result = parseAIResponse(rawText)
      expect(result.success).toBe(true)
      expect(result.data.question.content).toContain('x^{2}')
      expect(result.data.analysis.steps).toHaveLength(2)
      expect(result.data.answer.l1).toBeDefined()
    })
  })
})
