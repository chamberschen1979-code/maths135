import { useState, useMemo, useEffect, useRef } from 'react'
import { ChevronDown, Lock, CheckCircle, PenTool, Target, BookOpen, Eye } from 'lucide-react'
import { getLinkedMotifsForWeapon, getWeaponStatus } from '../utils/motifWeaponMapper'
import { isLearned } from '../utils/weaponProgress'
import weaponDetails from '../data/weapon_details.json'
import CertificationExam from './strategy/CertificationExam'
import InsightModal from './strategy/InsightModal'

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

const WEAPON_NAMES = {
  'S-SET-01': '空集陷阱自动检测',
  'S-FUNC-02': '同增异减',
  'S-FUNC-04': '零点个数=交点个数',
  'S-TRIG-02': '图象变换铁律',
  'S-VEC-04': '建系策略',
  'S-VEC-01': '投影向量',
  'S-VEC-05': '极化恒等式',
  'S-SEQ-01': '下标和性质',
  'S-SEQ-02': 'Sn最值(二次函数)',
  'S-SEQ-04': '求和三法',
  'S-SEQ-08': '特征根法',
  'S-SEQ-09': '不动点法',
  'S-SEQ-10': '切线放缩',
  'S-GEO-02': '建系秒杀',
  'S-GEO-03': '等体积法',
  'S-PROB-01': '概率树/全概率',
  'S-CONIC-02': '焦点三角形面积',
  'S-CONIC-05': '仿射变换',
  'S-CONIC-06': '齐次化联立',
  'S-CONIC-07': '参数方程',
  'S-DERIV-03': '含参讨论通法',
  'S-DERIV-04': '端点效应',
  'S-DERIV-09': '洛必达法则',
  'S-DERIV-10': '极值点偏移(比值代换)',
  'S-DERIV-11': '对数平均不等式',
  'S-INEQ-02': '乘1法',
  'S-INEQ-05': '琴生不等式',
  'S-INEQ-06': '柯西不等式',
  'S-INEQ-07': '权方和不等式',
  'S-INEQ-08': '赫尔德不等式',
  'S-INEQ-09': '切比雪夫不等式',
  'S-INEQ-10': '均值不等式链',
  'S-TRIG-01': '配角公式',
  'S-TRIG-03': '化边为角',
  'S-TRI-04': '中线/角平分线',
  'S-FUNC-05': '双对称推周期',
  'S-FUNC-06': '脱壳法',
  'S-FUNC-08': '复合零点(剥洋葱)',
  'S-LOG-02': '指对同构',
  'S-LOG-05': '对数平均不等式',
}

const WEAPON_CATEGORIES = {
  'S-SET': { id: 'S-SET', name: '集合与逻辑思维' },
  'S-FUNC': { id: 'S-FUNC', name: '函数思维' },
  'S-TRIG': { id: 'S-TRIG', name: '三角函数思维' },
  'S-VEC': { id: 'S-VEC', name: '平面向量思维' },
  'S-SEQ': { id: 'S-SEQ', name: '数列思维' },
  'S-GEO': { id: 'S-GEO', name: '立体几何思维' },
  'S-PROB': { id: 'S-PROB', name: '概率统计思维' },
  'S-CONIC': { id: 'S-CONIC', name: '圆锥曲线思维' },
  'S-DERIV': { id: 'S-DERIV', name: '导数思维' },
  'S-INEQ': { id: 'S-INEQ', name: '不等式思维' },
  'S-TRI': { id: 'S-TRI', name: '解三角形思维' },
  'S-LOG': { id: 'S-LOG', name: '指对数函数思维' },
}

const WEAPON_RANKS = {
  'S-DERIV-09': 'killer', 'S-DERIV-10': 'killer', 'S-DERIV-11': 'killer',
  'S-CONIC-05': 'killer', 'S-CONIC-06': 'killer', 'S-SEQ-08': 'killer',
  'S-SEQ-09': 'killer', 'S-SEQ-10': 'killer', 'S-INEQ-05': 'killer',
  'S-INEQ-06': 'killer', 'S-INEQ-07': 'killer', 'S-INEQ-08': 'killer',
  'S-INEQ-09': 'killer', 'S-LOG-05': 'killer',
  'S-FUNC-04': 'advanced', 'S-VEC-05': 'advanced', 'S-CONIC-02': 'advanced',
  'S-CONIC-07': 'advanced', 'S-DERIV-04': 'advanced', 'S-TRIG-03': 'advanced',
  'S-FUNC-05': 'advanced', 'S-FUNC-06': 'advanced', 'S-FUNC-08': 'advanced',
  'S-INEQ-10': 'advanced', 'S-LOG-02': 'advanced',
}

const TRIGGER_KEYWORDS = {
  'S-SET-01': ['子集', '包含', 'A⊆B', '空集', '分类讨论'],
  'S-FUNC-02': ['复合函数', '单调性', '单调区间', '同增异减'],
  'S-FUNC-04': ['零点', '根的个数', '交点', 'f(x)=g(x)'],
  'S-TRIG-02': ['平移', '图象变换', '左加右减', '伸缩'],
  'S-VEC-04': ['建系', '坐标系', '坐标法', '最值'],
  'S-VEC-01': ['投影向量', '投影', '在...上的投影'],
  'S-VEC-05': ['极化恒等式', 'PA·PB', '数量积最值'],
  'S-SEQ-01': ['等差数列', '等比数列', '下标和', '片段和'],
  'S-SEQ-02': ['Sn最值', '前n项和最值'],
  'S-SEQ-04': ['裂项', '错位相减', '并项', '求和'],
  'S-SEQ-08': ['特征根', '递推', '二阶线性'],
  'S-SEQ-09': ['不动点', 'f(x)=x', '收敛'],
  'S-SEQ-10': ['切线放缩', 'e^x≥x+1', 'ln x≤x-1'],
  'S-GEO-02': ['线面角', '二面角', '法向量', '立体几何'],
  'S-GEO-03': ['等体积', '点面距', '体积法'],
  'S-PROB-01': ['条件概率', '全概率', '贝叶斯', '概率树'],
  'S-CONIC-02': ['焦点三角形', 'PF1', 'PF2', 'tan(θ/2)'],
  'S-CONIC-05': ['仿射', '椭圆变圆', '面积比'],
  'S-CONIC-06': ['齐次化', '斜率关系', 'k1+k2'],
  'S-CONIC-07': ['参数方程', 'acosθ', 'bsinθ'],
  'S-DERIV-03': ['含参', '参数讨论', '分类讨论', '单调区间'],
  'S-DERIV-04': ['恒成立', '端点', '探路'],
  'S-DERIV-09': ['洛必达', '极限', '0/0'],
  'S-DERIV-10': ['极值点偏移', '双变量', 'x1+x2'],
  'S-DERIV-11': ['对数平均', 'L(a,b)', '√(ab)'],
  'S-INEQ-02': ['乘1法', '常数代换', 'x+y=1'],
  'S-INEQ-05': ['琴生', '凸函数', '凹函数'],
  'S-INEQ-06': ['柯西', '(a²+b²)(c²+d²)'],
  'S-INEQ-07': ['权方和', 'a²/x+b²/y'],
  'S-INEQ-08': ['赫尔德', 'Holder'],
  'S-INEQ-09': ['切比雪夫', '同序和', '乱序和'],
  'S-INEQ-10': ['均值不等式', '调和平均', '平方平均'],
  'S-TRIG-01': ['辅助角', 'asinx+bcosx', '配角'],
  'S-TRIG-03': ['化边为角', '周长最值', '面积最值'],
  'S-TRI-04': ['中线', '角平分线', '面积法'],
  'S-FUNC-05': ['双对称', '周期', '对称轴'],
  'S-FUNC-06': ['脱壳', 'f(A)>f(B)', '抽象不等式'],
  'S-FUNC-08': ['f(f(x))', '复合零点', '剥洋葱'],
  'S-LOG-02': ['同构', 'xe^x', 'ye^y'],
  'S-LOG-05': ['对数平均', '极值点偏移', '双变量'],
}

const LINKED_MOTIFS = {}

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
      const prefix = weaponId.split('-').slice(0, 2).join('-')
      const category = WEAPON_CATEGORIES[prefix] || { id: prefix, name: '其他' }
      weapons.push({
        id: weaponId,
        name: WEAPON_NAMES[weaponId] || weaponId,
        rank: WEAPON_RANKS[weaponId] || 'basic',
        description: detail.coreLogic?.slice(0, 100) || '',
        trigger_keywords: TRIGGER_KEYWORDS[weaponId] || [],
        linked_motifs: LINKED_MOTIFS[weaponId] || [],
        categoryId: category.id,
        categoryName: category.name,
        ...detail
      })
    })
    return weapons
  }, [])

  const groupedWeapons = useMemo(() => {
    const groups = {}
    
    Object.entries(weaponDetails).forEach(([weaponId, detail]) => {
      const prefix = weaponId.split('-').slice(0, 2).join('-')
      const category = WEAPON_CATEGORIES[prefix] || { id: prefix, name: '其他' }
      
      if (!groups[category.name]) {
        groups[category.name] = []
      }
      
      groups[category.name].push({
        id: weaponId,
        name: WEAPON_NAMES[weaponId] || weaponId,
        rank: WEAPON_RANKS[weaponId] || 'basic',
        description: detail.coreLogic?.slice(0, 100) || '',
        trigger_keywords: TRIGGER_KEYWORDS[weaponId] || [],
        linked_motifs: getLinkedMotifsForWeapon(weaponId).map(m => ({
          id: m.id,
          title: m.name
        })),
        categoryId: category.id,
        categoryName: category.name,
        _userState: { status: 'LOCKED', progress: 0 },
        ...detail
      })
    })
    
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
    return Object.keys(groupedWeapons)
  }, [groupedWeapons])

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

        {/* 底部：母题场景 + 双按钮（同一行） */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-auto gap-2">
          {/* 左侧：适用母题场景 */}
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

          {/* 右侧：双按钮组 */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 按钮 1: 要点解析 */}
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

            {/* 按钮 2: 去认证 */}
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
            📚 方法工具
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

      {/* 要点解析弹窗 */}
      <InsightModal 
        weapon={insightWeapon}
        isOpen={!!insightWeapon}
        onClose={() => setInsightWeapon(null)}
      />
    </div>
  )
}

export default StrategyHub
