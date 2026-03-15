import { describe, it, expect } from 'vitest'
import {
  normalizeId,
  getDifficultyByElo,
  selectBenchmark,
  selectVariableKnobs,
  buildCrossFileIndex
} from './problemLogic.js'

describe('normalizeId', () => {
  it('应该将下划线转换为连字符', () => {
    expect(normalizeId('test_id_123')).toBe('test-id-123')
  })

  it('应该转换为小写', () => {
    expect(normalizeId('TEST_ID')).toBe('test-id')
  })

  it('应该去除首尾空格', () => {
    expect(normalizeId('  test-id  ')).toBe('test-id')
  })

  it('空输入应返回 null', () => {
    expect(normalizeId(null)).toBe(null)
    expect(normalizeId(undefined)).toBe(null)
    expect(normalizeId('')).toBe(null)
  })

  it('非字符串输入应返回 null', () => {
    expect(normalizeId(123)).toBe(null)
    expect(normalizeId({})).toBe(null)
  })
})

describe('getDifficultyByElo', () => {
  it('Elo <= 1800 应返回 L2 基础筑基', () => {
    const result = getDifficultyByElo(1500)
    expect(result.level).toBe('L2')
    expect(result.tier).toBe('基础筑基')
    expect(result.complexity).toBe(1)
    expect(result.traps).toBe(0)
  })

  it('Elo 1801-2500 应返回 L3 深度复合', () => {
    const result = getDifficultyByElo(2000)
    expect(result.level).toBe('L3')
    expect(result.tier).toBe('深度复合')
    expect(result.complexity).toBe(3)
    expect(result.traps).toBe(1)
  })

  it('Elo > 2500 应返回 L4 战术压轴', () => {
    const result = getDifficultyByElo(2800)
    expect(result.level).toBe('L4')
    expect(result.tier).toBe('战术压轴')
    expect(result.complexity).toBe(5)
    expect(result.traps).toBe(2)
  })

  it('边界值测试：Elo = 1800', () => {
    const result = getDifficultyByElo(1800)
    expect(result.level).toBe('L2')
  })

  it('边界值测试：Elo = 2500', () => {
    const result = getDifficultyByElo(2500)
    expect(result.level).toBe('L3')
  })

  it('空值应返回 L2', () => {
    const result = getDifficultyByElo(null)
    expect(result.level).toBe('L2')
  })

  it('应包含 minParams 和 maxParams', () => {
    const result = getDifficultyByElo(1500)
    expect(result.minParams).toBeDefined()
    expect(result.maxParams).toBeDefined()
  })
})

describe('selectBenchmark', () => {
  it('空数据应返回 null', () => {
    expect(selectBenchmark(null, 'L2')).toBe(null)
    expect(selectBenchmark(undefined, 'L2')).toBe(null)
  })

  it('应从 specialties.variations.master_benchmarks 中查找匹配', () => {
    const mockData = {
      specialties: [{
        variations: [{
          master_benchmarks: [
            { level: 'L2', content: 'test L2' },
            { level: 'L3', content: 'test L3' }
          ]
        }]
      }]
    }
    const result = selectBenchmark(mockData, 'L2')
    expect(result.content).toBe('test L2')
  })

  it('应从 original_pool 中查找作为备选', () => {
    const mockData = {
      specialties: [{
        variations: [{
          original_pool: [
            { level: 'L3', content: 'pool L3' }
          ]
        }]
      }]
    }
    const result = selectBenchmark(mockData, 'L3')
    expect(result.content).toBe('pool L3')
  })

  it('应从 master_benchmarks 中查找作为最终备选', () => {
    const mockData = {
      master_benchmarks: [
        { level: 'L4', content: 'final L4' }
      ]
    }
    const result = selectBenchmark(mockData, 'L4')
    expect(result.content).toBe('final L4')
  })
})

describe('selectVariableKnobs (M 文件驱动)', () => {
  it('空 motifData 应返回 fallback', () => {
    const result = selectVariableKnobs(null, 'L3')
    expect(result.fallback).toBe(true)
  })

  it('无 variable_knobs 应返回 fallback', () => {
    const mockData = {
      specialties: [{
        variations: [{}]
      }]
    }
    const result = selectVariableKnobs(mockData, 'L3')
    expect(result.fallback).toBe(true)
  })

  it('应根据权重选择策略', () => {
    const mockData = {
      specialties: [{
        variations: [{
          variable_knobs: {
            property_type: [
              { type: 'index_sum', weight: 0.9, desc: '下标和性质' },
              { type: 'segment_sum', weight: 0.1, desc: '片段和成数列' }
            ]
          }
        }]
      }]
    }

    const results = { index_sum: 0, segment_sum: 0 }
    for (let i = 0; i < 100; i++) {
      const selected = selectVariableKnobs(mockData, 'L3')
      if (selected.property_type) {
        results[selected.property_type.type]++
      }
    }
    expect(results.index_sum).toBeGreaterThan(results.segment_sum)
  })

  it('L2 应过滤掉 difficulty_delta > 0 的选项', () => {
    const mockData = {
      specialties: [{
        variations: [{
          variable_knobs: {
            property_type: [
              { type: 'basic', weight: 1, desc: '基础' },
              { type: 'hard', weight: 1, difficulty_delta: '+1', desc: '困难' }
            ]
          }
        }]
      }]
    }

    for (let i = 0; i < 20; i++) {
      const selected = selectVariableKnobs(mockData, 'L2')
      expect(selected.property_type?.type).toBe('basic')
    }
  })

  it('L3 应过滤掉 difficulty_delta > 0.5 的选项', () => {
    const mockData = {
      specialties: [{
        variations: [{
          variable_knobs: {
            property_type: [
              { type: 'basic', weight: 1, desc: '基础' },
              { type: 'medium', weight: 1, difficulty_delta: '+0.5', desc: '中等' },
              { type: 'hard', weight: 1, difficulty_delta: '+1', desc: '困难' }
            ]
          }
        }]
      }]
    }

    for (let i = 0; i < 20; i++) {
      const selected = selectVariableKnobs(mockData, 'L3')
      expect(['basic', 'medium']).toContain(selected.property_type?.type)
    }
  })

  it('L4 应允许所有选项', () => {
    const mockData = {
      specialties: [{
        variations: [{
          variable_knobs: {
            property_type: [
              { type: 'basic', weight: 1, desc: '基础' },
              { type: 'hard', weight: 1, difficulty_delta: '+1', desc: '困难' }
            ]
          }
        }]
      }]
    }

    const types = new Set()
    for (let i = 0; i < 50; i++) {
      const selected = selectVariableKnobs(mockData, 'L4')
      types.add(selected.property_type?.type)
    }
    expect(types.size).toBe(2)
  })

  it('应处理多个维度', () => {
    const mockData = {
      specialties: [{
        variations: [{
          variable_knobs: {
            property_type: [
              { type: 'index_sum', weight: 1, desc: '下标和性质' }
            ],
            trap_condition: [
              { type: 'q_sign', weight: 1, desc: '公比符号多解' }
            ]
          }
        }]
      }]
    }

    const selected = selectVariableKnobs(mockData, 'L3')
    expect(selected.property_type).toBeDefined()
    expect(selected.trap_condition).toBeDefined()
  })
})

describe('buildCrossFileIndex', () => {
  it('应构建规范化 ID 索引', () => {
    const motifDataMap = {
      'TEST_ID': { name: 'test' },
      'Another_ID': { name: 'another' }
    }
    const index = buildCrossFileIndex(motifDataMap)
    expect(index['test-id']).toBeDefined()
    expect(index['test-id'][0].name).toBe('test')
    expect(index['another-id']).toBeDefined()
  })

  it('空输入应返回空对象', () => {
    expect(buildCrossFileIndex(null)).toEqual({})
    expect(buildCrossFileIndex(undefined)).toEqual({})
    expect(buildCrossFileIndex({})).toEqual({})
  })

  it('非对象输入应返回空对象', () => {
    expect(buildCrossFileIndex('string')).toEqual({})
    expect(buildCrossFileIndex(123)).toEqual({})
  })
})
