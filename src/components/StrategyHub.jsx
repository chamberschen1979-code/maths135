import { useState, useMemo, useEffect, useRef } from 'react'
import { ChevronDown, Lock, CheckCircle, PenTool, Target, BookOpen, Eye } from 'lucide-react'
import { getLinkedMotifsForWeapon, getWeaponStatus } from '../utils/motifWeaponMapper'
import { isLearned } from '../utils/weaponProgress'
import weaponDetails from '../data/weapon_details.json'
import CertificationExam from './strategy/CertificationExam'
import InsightModal from './strategy/InsightModal'

const MOTIF_CATEGORIES = {
  'M01': { id: 'M01', name: '集合逻辑...', fullName: 'M01-集合、逻辑用语与复数' },
  'M02': { id: 'M02', name: '不等式...', fullName: 'M02-不等式性质' },
  'M03': { id: 'M03', name: '函数概念...', fullName: 'M03-函数概念与性质' },
  'M04': { id: 'M04', name: '指数对数...', fullName: 'M04-指数与对数' },
  'M05': { id: 'M05', name: '平面向量...', fullName: 'M05-平面向量' },
  'M06': { id: 'M06', name: '三角函数...', fullName: 'M06-三角函数' },
  'M07': { id: 'M07', name: '解三角形...', fullName: 'M07-解三角形' },
  'M08': { id: 'M08', name: '数列基础...', fullName: 'M08-数列基础' },
  'M09': { id: 'M09', name: '立体几何...', fullName: 'M09-立体几何' },
  'M10': { id: 'M10', name: '圆锥曲线...', fullName: 'M10-圆锥曲线' },
  'M11': { id: 'M11', name: '导数基础...', fullName: 'M11-导数基础' },
  'M12': { id: 'M12', name: '概率统计...', fullName: 'M12-概率与统计' },
  'M13': { id: 'M13', name: '解析几何...', fullName: 'M13-解析几何' },
  'M14': { id: 'M14', name: '导数综合...', fullName: 'M14-导数综合压轴' },
  'M15': { id: 'M15', name: '数列综合...', fullName: 'M15-数列综合压轴' },
  'M16': { id: 'M16', name: '排列组合...', fullName: 'M16-排列组合与概率' },
  'M17': { id: 'M17', name: '创新思维...', fullName: 'M17-创新思维与情境' },
}

const extractWeaponName = (weaponId, detail) => {
  const coreLogic = detail.coreLogic || ''
  const match = coreLogic.match(/^([^：：]+)/)
  if (match) {
    return match[1].trim()
  }
  return weaponId
}

const extractWeaponDescription = (detail) => {
  const coreLogic = detail.coreLogic || ''
  const colonIndex = coreLogic.indexOf('：')
  if (colonIndex !== -1) {
    return coreLogic.slice(colonIndex + 1).slice(0, 100)
  }
  return coreLogic.slice(0, 100)
}

const getCategoryColor = (motifId) => {
  const colors = {
    'M01': { bg: 'bg-blue-100', text: 'text-blue-700', active: 'bg-blue-600' },
    'M02': { bg: 'bg-purple-100', text: 'text-purple-700', active: 'bg-purple-600' },
    'M03': { bg: 'bg-indigo-100', text: 'text-indigo-700', active: 'bg-indigo-600' },
    'M04': { bg: 'bg-orange-100', text: 'text-orange-700', active: 'bg-orange-600' },
    'M05': { bg: 'bg-teal-100', text: 'text-teal-700', active: 'bg-teal-600' },
    'M06': { bg: 'bg-pink-100', text: 'text-pink-700', active: 'bg-pink-600' },
    'M07': { bg: 'bg-rose-100', text: 'text-rose-700', active: 'bg-rose-600' },
    'M08': { bg: 'bg-amber-100', text: 'text-amber-700', active: 'bg-amber-600' },
    'M09': { bg: 'bg-slate-100', text: 'text-slate-700', active: 'bg-slate-600' },
    'M10': { bg: 'bg-violet-100', text: 'text-violet-700', active: 'bg-violet-600' },
    'M11': { bg: 'bg-red-100', text: 'text-red-700', active: 'bg-red-600' },
    'M12': { bg: 'bg-sky-100', text: 'text-sky-700', active: 'bg-sky-600' },
    'M13': { bg: 'bg-lime-100', text: 'text-lime-700', active: 'bg-lime-600' },
    'M14': { bg: 'bg-red-100', text: 'text-red-700', active: 'bg-red-600' },
    'M15': { bg: 'bg-amber-100', text: 'text-amber-700', active: 'bg-amber-600' },
    'M16': { bg: 'bg-yellow-100', text: 'text-yellow-700', active: 'bg-yellow-600' },
    'M17': { bg: 'bg-green-100', text: 'text-green-700', active: 'bg-green-600' },
  }
  return colors[motifId] || { bg: 'bg-gray-100', text: 'text-gray-700', active: 'bg-gray-600' }
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
  const certifiedWeapons = tacticalData?.user_profile?.certifiedWeapons || []
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showCertifiedOnly, setShowCertifiedOnly] = useState(false)
  const [examWeapon, setExamWeapon] = useState(null)
  const [insightWeapon, setInsightWeapon] = useState(null)
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
    Object.entries(weaponDetails).forEach(([weaponId, detail]) => {
      const linkedMotifs = getLinkedMotifsForWeapon(weaponId)
      weapons.push({
        id: weaponId,
        name: extractWeaponName(weaponId, detail),
        description: extractWeaponDescription(detail),
        linked_motifs: linkedMotifs.map(m => ({
          id: m.id,
          title: MOTIF_CATEGORIES[m.id]?.fullName || m.name || m.id
        })),
        ...detail
      })
    })
    return weapons
  }, [weaponDetails])

  const groupedWeapons = useMemo(() => {
    const groups = {}
    
    Object.keys(MOTIF_CATEGORIES).forEach(motifId => {
      groups[motifId] = []
    })
    
    Object.entries(weaponDetails).forEach(([weaponId, detail]) => {
      const linkedMotifs = getLinkedMotifsForWeapon(weaponId)
      
      linkedMotifs.forEach(motif => {
        const motifId = motif.id
        if (groups[motifId]) {
          groups[motifId].push({
            id: weaponId,
            name: extractWeaponName(weaponId, detail),
            description: extractWeaponDescription(detail),
            linked_motifs: linkedMotifs.map(m => ({
              id: m.id,
              title: MOTIF_CATEGORIES[m.id]?.fullName || m.name || m.id
            })),
            _userState: { status: 'LOCKED', progress: 0 },
            ...detail
          })
        }
      })
    })
    
    return groups
  }, [weaponDetails])

  const filteredGroups = useMemo(() => {
    let groups = groupedWeapons

    if (selectedCategory) {
      groups = { [selectedCategory]: groupedWeapons[selectedCategory] || [] }
    }

    if (showCertifiedOnly) {
      const filtered = {}
      Object.entries(groups).forEach(([motifId, weapons]) => {
        const matched = weapons.filter(w => certifiedWeapons.includes(w.id))
        if (matched.length > 0) filtered[motifId] = matched
      })
      groups = filtered
    }

    if (!searchTerm) return groups

    const filtered = {}
    Object.entries(groups).forEach(([motifId, weapons]) => {
      const matched = weapons.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.coreLogic?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (matched.length > 0) filtered[motifId] = matched
    })
    return filtered
  }, [groupedWeapons, searchTerm, selectedCategory, showCertifiedOnly, certifiedWeapons])

  const categories = useMemo(() => {
    return Object.keys(MOTIF_CATEGORIES)
  }, [])

  const renderWeaponCard = (weapon) => {
    const isHighlighted = highlightWeaponId === weapon.id
    
    const status = getWeaponStatus(weapon, tacticalData)
    const isLocked = status === 'LOCKED'
    const isCertified = status === 'CERTIFIED'
    const isTraining = status === 'UNLOCKED'
    
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
          <span className="px-2 py-0.5 rounded text-xs font-medium border bg-amber-100 text-amber-700 border-amber-200">
            杀手锏
          </span>
        </div>

        <div className="flex-grow">
          <h3 className={`font-bold mb-1.5 leading-tight ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
            {weapon.name}
          </h3>
          <p className={`text-xs line-clamp-2 ${isAcademicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
            {weapon.description}
          </p>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-auto gap-2">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {linkedMotifs.length > 0 ? (
              linkedMotifs.slice(0, 2).map(motif => (
                <span
                  key={`${weapon.id}-${motif.id}`}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 whitespace-nowrap flex-shrink-0"
                >
                  <Target size={10} className="flex-shrink-0" />
                  <span className="font-mono font-bold">{motif.id}</span>
                  <span className="text-indigo-500 hidden sm:inline truncate max-w-[60px]">{motif.title?.replace(/^[M\d]+\s*/, '')}</span>
                </span>
              ))
            ) : (
              <span className="text-[10px] text-slate-300">暂无关联母题</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setInsightWeapon(weapon)
              }}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold rounded-md border transition-all whitespace-nowrap shadow-sm 
                ${isLearned(weapon.id) 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'} 
              `}
              style={{ minWidth: '60px' }}
            >
              {isLearned(weapon.id) ? '👁 已读' : '📖 要点'}
            </button>

            {!isLocked && (
              isCertified ? (
                <div className="flex items-center justify-center gap-1 px-2 py-1.5 bg-green-100 text-green-700 text-[11px] font-bold rounded-md border border-green-200 whitespace-nowrap">
                  ✓ 已掌握
                </div>
              ) : isTraining && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setExamWeapon(weapon)
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-md shadow-md hover:bg-slate-800 transition-all whitespace-nowrap"
                  style={{ minWidth: '60px' }}
                >
                  ⚔️ 认证
                </button>
              )
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full overflow-auto p-6 ${isAcademicMode ? 'bg-slate-50' : 'bg-zinc-900'}`}>
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className={`text-2xl font-bold ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
            📚 方法工具
          </h1>
          <p className={`mt-1 text-sm ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
            高中数学核心解题策略的系统化整理 — 共 {allWeapons.length} 招杀手锏
          </p>
        </header>

        <div className="mb-6">
          <input
            type="text"
            placeholder="搜索杀手锏名称或描述..."
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
            onClick={() => { setSelectedCategory(null); setShowCertifiedOnly(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all min-w-[80px] text-center ${
              selectedCategory === null && !showCertifiedOnly
                ? 'bg-slate-700 text-white'
                : isAcademicMode
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            全部 ({showCertifiedOnly ? certifiedWeapons.length : allWeapons.length})
          </button>
          <button
            onClick={() => { setSelectedCategory(null); setShowCertifiedOnly(!showCertifiedOnly); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all min-w-[80px] text-center ${
              showCertifiedOnly
                ? 'bg-green-600 text-white'
                : isAcademicMode
                  ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            已认证 ({certifiedWeapons.length})
          </button>
          {categories.map(motifId => {
            const color = getCategoryColor(motifId)
            const category = MOTIF_CATEGORIES[motifId]
            const count = groupedWeapons[motifId]?.length || 0
            return (
              <button
                key={motifId}
                onClick={() => setSelectedCategory(motifId)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all min-w-[80px] text-center ${
                  selectedCategory === motifId
                    ? `${color.active} text-white`
                    : isAcademicMode
                      ? `${color.bg} ${color.text} hover:opacity-80`
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {category.name} ({count})
              </button>
            )
          })}
        </div>

        <div className="space-y-8">
          {Object.entries(filteredGroups).map(([motifId, weapons]) => {
            const color = getCategoryColor(motifId)
            const category = MOTIF_CATEGORIES[motifId]
            
            return (
              <div key={motifId}>
                <h2 className={`text-lg font-bold mb-4 ${isAcademicMode ? 'text-slate-700' : 'text-zinc-200'}`}>
                  <span className={`px-3 py-1 rounded-lg ${color.bg} ${color.text}`}>
                    {category.fullName}
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
            <p className="text-lg">未找到匹配的杀手锏</p>
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

      <InsightModal 
        weapon={insightWeapon}
        isOpen={!!insightWeapon}
        onClose={() => setInsightWeapon(null)}
      />
    </div>
  )
}

export default StrategyHub
