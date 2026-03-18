import { useState } from 'react'
import { X } from 'lucide-react'
import { calculateGearLevelFromSpecialties } from '../utils/benchmarkUtils'
import { addLegacyIdsToMotifData } from '../utils/migrateDataStructure'

const motifModules = import.meta.glob('/src/data/M*.json', { eager: true })

const getGearLevelFromElo = (elo) => {
  if (elo > 2500) return 'L4'
  if (elo > 1800) return 'L3'
  if (elo > 1000) return 'L2'
  return 'L1'
}

const getMotifData = (motifId) => {
  const key = `/src/data/${motifId}.json`
  const rawData = motifModules[key]?.default
  if (!rawData) return null
  return addLegacyIdsToMotifData(rawData)
}

const InitModal = ({
  isOpen,
  onClose,
  isAcademicMode,
  tacticalData,
  setTacticalData,
  initGradeFilter,
  setInitGradeFilter
}) => {
  if (!isOpen) return null

  const allEncounters = tacticalData?.tactical_maps?.flatMap(map => map.encounters) || []
  const selectedGrade = initGradeFilter || '高三'
  
  const filteredEncounters = allEncounters.filter(encounter => {
    const grades = encounter.grades || []
    if (selectedGrade === '高三') return true
    if (selectedGrade === '高二') return grades.includes('高一') || grades.includes('高二')
    if (selectedGrade === '高一') return grades.includes('高一')
    return true
  })

  const handleLightClick = (encounter, level) => {
    const elo = encounter.elo_score || 800
    const l2Gray = elo < 1001
    const l2Green = elo >= 1800
    const l3Gray = elo < 1801
    const l3Green = elo >= 2500
    const l4Gray = elo < 2501
    const l4Green = elo >= 3000

    const newData = JSON.parse(JSON.stringify(tacticalData))
    for (const m of newData.tactical_maps) {
      for (const e of m.encounters) {
        if (e.target_id === encounter.target_id) {
          if (level === 'L2') {
            if (l2Gray) { e.elo_score = 1001 }
            else if (!l2Green) { e.elo_score = 1800 }
            else { e.elo_score = 800 }
          }
          if (level === 'L3') {
            if (l3Gray) { e.elo_score = 1801 }
            else if (!l3Green) { e.elo_score = 2500 }
            else { e.elo_score = 1800 }
          }
          if (level === 'L4') {
            if (l4Gray) { e.elo_score = 2501 }
            else if (!l4Green) { e.elo_score = 3000 }
            else { e.elo_score = 2500 }
          }
          e.gear_level = getGearLevelFromElo(e.elo_score)
          
          const newElo = e.elo_score
          const l2Status = newElo < 1001 ? 'gray' : (newElo >= 1800 ? 'green' : 'red')
          const l3Status = newElo < 1801 ? 'gray' : (newElo >= 2500 ? 'green' : 'red')
          const l4Status = newElo < 2501 ? 'gray' : (newElo >= 3000 ? 'green' : 'red')
          
          const motifData = getMotifData(e.target_id)
          if (motifData?.specialties) {
            e.specialties = JSON.parse(JSON.stringify(motifData.specialties))
            e.specialties.forEach(spec => {
              spec.variations?.forEach(v => {
                v.master_benchmarks?.forEach(b => {
                  if (b.level === 'L2') {
                    if (l2Status === 'green') {
                      b.is_mastered = true
                      b.consecutive_correct = 3
                    } else if (l2Status === 'red') {
                      b.is_mastered = false
                      b.consecutive_correct = 0
                    } else {
                      b.is_mastered = null
                      b.consecutive_correct = null
                    }
                  }
                  if (b.level === 'L3') {
                    if (l3Status === 'green') {
                      b.is_mastered = true
                      b.consecutive_correct = 3
                    } else if (l3Status === 'red') {
                      b.is_mastered = false
                      b.consecutive_correct = 0
                    } else {
                      b.is_mastered = null
                      b.consecutive_correct = null
                    }
                  }
                  if (b.level === 'L4') {
                    if (l4Status === 'green') {
                      b.is_mastered = true
                      b.consecutive_correct = 3
                    } else if (l4Status === 'red') {
                      b.is_mastered = false
                      b.consecutive_correct = 0
                    } else {
                      b.is_mastered = null
                      b.consecutive_correct = null
                    }
                  }
                })
              })
            })
          }
        }
      }
    }
    setTacticalData(newData)
  }

  const handleClearAll = () => {
    const newData = JSON.parse(JSON.stringify(tacticalData))
    for (const m of newData.tactical_maps) {
      for (const e of m.encounters) {
        e.elo_score = 800
        e.gear_level = 'L1'
      }
    }
    setTacticalData(newData)
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className={`max-w-2xl max-h-[85vh] overflow-auto mx-4 rounded-lg border p-6 ${
          isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-700'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
            ⚡ 母题初始化调试面板
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded ${isAcademicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-800'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className={`text-sm mb-4 ${isAcademicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
          点击灯泡切换状态（灰→红→绿），快速初始化母题数据：
        </p>
        
        <div className="flex gap-2 mb-4">
          {['高一', '高二', '高三'].map(grade => (
            <button
              key={grade}
              onClick={() => setInitGradeFilter(grade)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                (initGradeFilter || '高三') === grade
                  ? isAcademicMode 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-blue-600 text-white'
                  : isAcademicMode
                    ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {grade}
            </button>
          ))}
        </div>
        
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {filteredEncounters.map(encounter => {
            const motifData = getMotifData(encounter.target_id)
            let hasL2 = false, hasL3 = false, hasL4 = false
            
            if (motifData?.specialties) {
              motifData.specialties.forEach(spec => spec.variations?.forEach(v => {
                v.master_benchmarks?.forEach(b => {
                  if (b.level === 'L2') hasL2 = true
                  if (b.level === 'L3') hasL3 = true
                  if (b.level === 'L4') hasL4 = true
                })
              }))
            } else {
              hasL2 = true
              hasL3 = true
              hasL4 = true
            }

            const elo = encounter.elo_score || 800
            const l2Gray = elo < 1001
            const l2Green = elo >= 1800
            const l3Gray = elo < 1801
            const l3Green = elo >= 2500
            const l4Gray = elo < 2501
            const l4Green = elo >= 3000

            return (
              <div 
                key={encounter.target_id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isAcademicMode ? 'bg-slate-50 border-slate-200' : 'bg-zinc-800 border-zinc-700'
                }`}
              >
                <div className="flex items-center">
                  <span className={`text-sm font-medium w-36 truncate ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                    {encounter.target_name}
                  </span>
                  <span className={`text-sm font-bold text-purple-500 ml-4 mr-8`}>
                    Elo: {elo}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {hasL2 && (
                    <button
                      onClick={() => handleLightClick(encounter, 'L2')}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                        l2Gray 
                          ? 'bg-slate-200 border-slate-300 text-slate-500' 
                          : l2Green 
                            ? 'bg-emerald-500 border-emerald-600 text-white' 
                            : 'bg-red-500 border-red-600 text-white'
                      }`}
                    >
                      L2
                    </button>
                  )}
                  
                  {hasL3 && (
                    <button
                      onClick={() => handleLightClick(encounter, 'L3')}
                      disabled={l2Gray}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                        l2Gray 
                          ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                          : l3Gray && !l2Gray
                            ? 'bg-slate-200 border-slate-300 text-slate-500' 
                            : l3Green 
                              ? 'bg-emerald-500 border-emerald-600 text-white' 
                              : 'bg-red-500 border-red-600 text-white'
                      }`}
                    >
                      L3
                    </button>
                  )}
                  
                  {hasL4 && (
                    <button
                      onClick={() => handleLightClick(encounter, 'L4')}
                      disabled={l3Gray}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                        l3Gray 
                          ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                          : l4Gray && !l3Gray
                            ? 'bg-slate-200 border-slate-300 text-slate-500' 
                            : l4Green 
                              ? 'bg-emerald-500 border-emerald-600 text-white' 
                              : 'bg-red-500 border-red-600 text-white'
                      }`}
                    >
                      L4
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t flex justify-between gap-2" style={{ borderColor: isAcademicMode ? '#e2e8f0' : '#3f3f46' }}>
          <button
            onClick={handleClearAll}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              isAcademicMode ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
            }`}
          >
            🗑️ 清空配置
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isAcademicMode ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              取消
            </button>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isAcademicMode ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              ✓ 确认配置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InitModal
