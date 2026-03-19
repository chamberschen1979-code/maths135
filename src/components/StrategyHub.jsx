import { useState, useMemo, useEffect, useRef } from 'react'
import { ChevronDown, Lock, CheckCircle, PenTool, Target } from 'lucide-react'
import { getLinkedMotifsForWeapon, getWeaponStatus } from '../utils/motifWeaponMapper'
import strategyLib from '../data/strategy_lib.json'
import CertificationExam from './strategy/CertificationExam'

const RANK_LABELS = {
  killer: '杀手锏',
  advanced: '进阶',
  basic: '基础'
}

const RANK_COLORS = {
  killer: 'bg-amber-100 text-amber-700 border-amber-200',
  advanced: 'bg-purple-100 text-purple-700 border-purple-200',
  basic: 'bg-blue-100 text-blue-700 border-blue-200'
}

const StrategyHub = ({ 
  isAcademicMode = true, 
  tacticalData, 
  highlightWeaponId, 
  highlightMotifId,
  onClearHighlight, 
  onClearMotifHighlight,
  onNavigate,
  onWeaponCertified
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [examWeapon, setExamWeapon] = useState(null)
  const highlightRef = useRef(null)

  useEffect(() => {
    if (highlightWeaponId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => {
        if (onClearHighlight) onClearHighlight()
      }, 3000)
    }
  }, [highlightWeaponId, onClearHighlight])

  const allWeapons = useMemo(() => {
    const weapons = []
    strategyLib.categories?.forEach(category => {
      category.weapons?.forEach(weapon => {
        weapons.push({
          ...weapon,
          categoryId: category.id,
          categoryName: category.name
        })
      })
    })
    return weapons
  }, [])

  const groupedWeapons = useMemo(() => {
    const groups = {}
    
    console.log('[StrategyHub] 加载数据', strategyLib)
    
    strategyLib.categories?.forEach(category => {
      groups[category.name] = category.weapons?.map(weapon => ({
        ...weapon,
        categoryId: category.id,
        categoryName: category.name,
        _userState: weapon._userState || { status: 'LOCKED', progress: 0 }
      })) || []
    })
    
    console.log('[StrategyHub] groupedWeapons:', groups)
    
    return groups
  }, [])

  const filteredGroups = useMemo(() => {
    let groups = groupedWeapons
    
    if (selectedCategory) {
      groups = { [selectedCategory]: groupedWeapons[selectedCategory] || [] }
    }
    
    if (!searchTerm) return groups
    
    const filtered = {}
    Object.entries(groups).forEach(([category, weapons]) => {
      const matched = weapons.filter(w => 
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.trigger_keywords?.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      if (matched.length > 0) {
        filtered[category] = matched
      }
    })
    return filtered
  }, [groupedWeapons, searchTerm, selectedCategory])

  const categories = useMemo(() => {
    return strategyLib.categories?.map(c => c.name) || []
  }, [])

  const getCategoryColor = (categoryName) => {
    const colors = {
      '集合与逻辑思维': { bg: 'bg-blue-100', text: 'text-blue-700', active: 'bg-blue-600' },
      '复数几何思维': { bg: 'bg-cyan-100', text: 'text-cyan-700', active: 'bg-cyan-600' },
      '不等式思维': { bg: 'bg-purple-100', text: 'text-purple-700', active: 'bg-purple-600' },
      '函数思维': { bg: 'bg-indigo-100', text: 'text-indigo-700', active: 'bg-indigo-600' },
      '数形结合与动态分析': { bg: 'bg-emerald-100', text: 'text-emerald-700', active: 'bg-emerald-600' },
      '指对数函数思维': { bg: 'bg-orange-100', text: 'text-orange-700', active: 'bg-orange-600' },
      '平面向量思维': { bg: 'bg-teal-100', text: 'text-teal-700', active: 'bg-teal-600' },
      '三角与解三角形思维': { bg: 'bg-pink-100', text: 'text-pink-700', active: 'bg-pink-600' },
      '解三角形核心技法': { bg: 'bg-rose-100', text: 'text-rose-700', active: 'bg-rose-600' },
      '数列思维': { bg: 'bg-amber-100', text: 'text-amber-700', active: 'bg-amber-600' },
      '立体几何思维': { bg: 'bg-slate-100', text: 'text-slate-700', active: 'bg-slate-600' },
      '圆锥曲线思维': { bg: 'bg-violet-100', text: 'text-violet-700', active: 'bg-violet-600' },
      '圆相关技法': { bg: 'bg-lime-100', text: 'text-lime-700', active: 'bg-lime-600' },
      '解析几何大题技法': { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', active: 'bg-fuchsia-600' },
      '导数思维': { bg: 'bg-red-100', text: 'text-red-700', active: 'bg-red-600' },
      '概率统计思维': { bg: 'bg-sky-100', text: 'text-sky-700', active: 'bg-sky-600' },
      '排列组合与二项式思维': { bg: 'bg-yellow-100', text: 'text-yellow-700', active: 'bg-yellow-600' },
      '创新思维与逻辑建模': { bg: 'bg-green-100', text: 'text-green-700', active: 'bg-green-600' },
    }
    return colors[categoryName] || { bg: 'bg-gray-100', text: 'text-gray-700', active: 'bg-gray-600' }
  }

  const renderWeaponCard = (weapon) => {
    const isHighlighted = highlightWeaponId === weapon.id
    
    // 基于母题激活状态动态计算杀手锏状态
    const status = getWeaponStatus(weapon, tacticalData)
    const isLocked = status === 'LOCKED'
    const isCertified = status === 'CERTIFIED'
    const isTraining = status === 'UNLOCKED'
    
    // 获取关联母题
    const linkedMotifs = weapon.linked_motifs || []
    
    return (
      <div
        key={weapon.id}
        ref={isHighlighted ? highlightRef : null}
        className={`rounded-lg border p-4 transition-all flex flex-col h-44 ${
          isHighlighted 
            ? 'ring-2 ring-blue-500 ring-offset-2 ' + (isAcademicMode ? 'bg-blue-50 border-blue-300' : 'bg-blue-900/30 border-blue-500')
            : isAcademicMode 
              ? 'bg-white border-slate-200 hover:border-slate-300'
              : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
        } ${isLocked ? 'opacity-60' : ''}`}
      >
        {/* 顶部：ID 与状态徽章 */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
              {weapon.id}
            </span>
            {isCertified && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <CheckCircle size={18} className="text-green-500" />
                已认证
              </span>
            )}
            {isLocked && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Lock size={12} />
                未解锁
              </span>
            )}
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${RANK_COLORS[weapon.rank] || RANK_COLORS.basic}`}>
            {RANK_LABELS[weapon.rank] || '基础'}
          </span>
        </div>

        {/* 中部：核心内容 */}
        <div className="flex-grow">
          <h3 className={`font-bold mb-1.5 leading-tight ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
            {weapon.name}
          </h3>
          <p className={`text-xs line-clamp-2 ${isAcademicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
            {weapon.description}
          </p>
        </div>

        {/* 底部：母题场景 + 认证按钮（同一行） */}
        <div className="flex justify-between items-end pt-2 border-t border-slate-100 mt-auto">
          {/* 左侧：适用母题场景 */}
          <div className="flex flex-wrap gap-1.5">
            {linkedMotifs.length > 0 ? (
              linkedMotifs.slice(0, 2).map(motif => (
                <button
                  key={`${weapon.id}-${motif.id}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onNavigate && onNavigate('dashboard', motif.id)
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all border ${
                    isLocked
                      ? 'bg-slate-100 border-slate-200 text-slate-400'
                      : isAcademicMode
                        ? 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-200'
                        : 'bg-indigo-900/30 border-indigo-700 text-indigo-300 hover:bg-indigo-900/50'
                  } cursor-pointer`}
                >
                  <Target size={12} />
                  <span className="font-mono font-bold">{motif.id}</span>
                  <span className="truncate max-w-[60px]">{motif.title}</span>
                </button>
              ))
            ) : (
              <span className="text-xs text-slate-400">暂无关联母题</span>
            )}
          </div>

          {/* 右侧：去认证按钮或已认证印章 */}
          {!isLocked && (
            isCertified ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle size={20} className="text-green-500" />
              </div>
            ) : isTraining && (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setExamWeapon(weapon)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <PenTool size={14} />
                去认证
              </button>
            )
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full overflow-auto p-6 ${isAcademicMode ? 'bg-slate-50' : 'bg-zinc-900'}`}>
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className={`flex items-center gap-1 text-sm mb-3 ${
              isAcademicMode ? 'text-blue-600 hover:text-blue-700' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
            返回知识图谱
          </button>
          <h1 className={`text-2xl font-bold ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
            📚 核心方法和定理库
          </h1>
          <p className={`mt-1 text-sm ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
            高中数学核心解题策略的系统化整理 — 共 {allWeapons.length} 招杀手锏
          </p>
        </header>

        <div className="mb-6">
          <input
            type="text"
            placeholder="搜索杀手锏名称、描述或触发关键词..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full max-w-md px-4 py-2 rounded-lg border text-sm ${
              isAcademicMode 
                ? 'bg-white border-slate-200 text-slate-700 placeholder-slate-400'
                : 'bg-zinc-800 border-zinc-700 text-zinc-200 placeholder-zinc-500'
            }`}
          />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all min-w-[80px] text-center ${
              selectedCategory === null
                ? 'bg-slate-700 text-white'
                : isAcademicMode
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            全部 ({allWeapons.length})
          </button>
          {categories.map(category => {
            const color = getCategoryColor(category)
            const count = groupedWeapons[category]?.length || 0
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all min-w-[80px] text-center ${
                  selectedCategory === category
                    ? `${color.active} text-white`
                    : isAcademicMode
                      ? `${color.bg} ${color.text} hover:opacity-80`
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {category.replace('思维', '').replace('核心技法', '').replace('技法', '')} ({count})
              </button>
            )
          })}
        </div>

        <div className="space-y-8">
          {Object.entries(filteredGroups).map(([category, weapons]) => {
            const color = getCategoryColor(category)
            
            return (
              <div key={category}>
                <h2 className={`text-lg font-bold mb-4 ${isAcademicMode ? 'text-slate-700' : 'text-zinc-200'}`}>
                  <span className={`px-3 py-1 rounded-lg ${color.bg} ${color.text}`}>
                    {category}
                  </span>
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {weapons.map(weapon => renderWeaponCard(weapon))}
                </div>
              </div>
            )
          })}
        </div>

        {Object.keys(filteredGroups).length === 0 && (
          <div className={`text-center py-20 ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
            <p className="text-lg">未找到匹配的武器</p>
          </div>
        )}
      </div>

      {examWeapon && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
            <button 
              onClick={() => setExamWeapon(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full text-slate-600 hover:text-red-600 transition-colors"
            >
              ✕
            </button>
            <CertificationExam 
              weapon={examWeapon} 
              onComplete={(result) => {
                console.log('认证完成:', result)
                if (onWeaponCertified && examWeapon) {
                  onWeaponCertified(examWeapon.id)
                }
                setExamWeapon(null)
              }}
              onExit={() => setExamWeapon(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default StrategyHub
