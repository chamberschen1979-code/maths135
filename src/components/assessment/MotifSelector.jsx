import { useState } from 'react'

const MotifSelector = ({ questionBank, selectedMotifs, onSelectionChange, isAcademicMode }) => {
  const [searchTerm, setSearchTerm] = useState('')

  if (!questionBank) {
    return (
      <div className={`text-center py-8 ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
        题库加载中...
      </div>
    )
  }

  const motifList = Object.entries(questionBank).map(([id, data]) => ({
    id,
    name: data.motif_name,
    variationCount: data.specialties.reduce((sum, s) => sum + s.variations.length, 0)
  }))

  const filtered = motifList.filter(m =>
    m.name.includes(searchTerm) || m.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const allSelected = filtered.length > 0 && filtered.every(m => selectedMotifs.includes(m.id))

  const handleToggleAll = () => {
    if (allSelected) {
      onSelectionChange(selectedMotifs.filter(id => !filtered.find(m => m.id === id)))
    } else {
      const newSelection = new Set(selectedMotifs)
      filtered.forEach(m => newSelection.add(m.id))
      onSelectionChange([...newSelection])
    }
  }

  const handleToggle = (motifId) => {
    if (selectedMotifs.includes(motifId)) {
      onSelectionChange(selectedMotifs.filter(id => id !== motifId))
    } else {
      onSelectionChange([...selectedMotifs, motifId])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className={`text-sm font-medium ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
          选择摸底母题
        </h4>
        <span className={`text-xs ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
          已选 {selectedMotifs.length} 个
        </span>
      </div>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="搜索母题..."
        className={`w-full px-3 py-2 rounded-lg text-sm border ${
          isAcademicMode
            ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-400'
            : 'bg-zinc-800 border-zinc-600 text-zinc-200 placeholder-zinc-500 focus:border-blue-500'
        } focus:outline-none focus:ring-1`}
      />

      <button
        onClick={handleToggleAll}
        className={`w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          allSelected
            ? isAcademicMode
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              : 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
            : isAcademicMode
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
        }`}
      >
        {allSelected ? '取消全选' : '全选'}
      </button>

      <div className="max-h-[50vh] overflow-y-auto space-y-1">
        {filtered.map(motif => {
          const isSelected = selectedMotifs.includes(motif.id)
          return (
            <button
              key={motif.id}
              onClick={() => handleToggle(motif.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                isSelected
                  ? isAcademicMode
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : 'bg-blue-900/20 border border-blue-700 text-blue-300'
                  : isAcademicMode
                    ? 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  isSelected
                    ? isAcademicMode ? 'bg-blue-500 border-blue-500' : 'bg-blue-600 border-blue-600'
                    : isAcademicMode ? 'border-slate-300' : 'border-zinc-600'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="font-medium">{motif.id}</span>
                <span className={isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}>
                  {motif.name}
                </span>
              </div>
              <span className={`text-xs ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                {motif.variationCount}变例
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MotifSelector
