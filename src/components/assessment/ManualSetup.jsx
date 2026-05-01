import { addLegacyIdsToMotifData } from '../../utils/migrateDataStructure'

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

const ManualSetup = ({
  isAcademicMode,
  tacticalData,
  setTacticalData,
  initGradeFilter,
  setInitGradeFilter
}) => {
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
                if (v.master_benchmarks) {
                  v.master_benchmarks.forEach(b => {
                    if (b.level === 'L2') {
                      b.is_mastered = l2Status === 'green' ? true : (l2Status === 'red' ? false : null)
                      b.consecutive_correct = l2Status === 'green' ? 3 : (l2Status === 'red' ? 0 : null)
                      b.l2_status = l2Status === 'green' ? 'GREEN' : (l2Status === 'red' ? 'RED' : 'GREEN')
                    }
                    if (b.level === 'L3') {
                      b.is_mastered = l3Status === 'green' ? true : (l3Status === 'red' ? false : null)
                      b.consecutive_correct = l3Status === 'green' ? 3 : (l3Status === 'red' ? 0 : null)
                      b.l2_status = l3Status === 'green' ? 'GREEN' : (l3Status === 'red' ? 'RED' : 'GREEN')
                    }
                    if (b.level === 'L4') {
                      b.is_mastered = l4Status === 'green' ? true : (l4Status === 'red' ? false : null)
                      b.consecutive_correct = l4Status === 'green' ? 3 : (l4Status === 'red' ? 0 : null)
                      b.l2_status = l4Status === 'green' ? 'GREEN' : (l4Status === 'red' ? 'RED' : 'GREEN')
                    }
                  })
                }

                if (v.original_pool) {
                  v.original_pool.forEach(q => {
                    if (q.level === 'L2') {
                      q.is_mastered = l2Status === 'green' ? true : (l2Status === 'red' ? false : null)
                      q.consecutive_correct = l2Status === 'green' ? 3 : (l2Status === 'red' ? 0 : null)
                      q.l2_status = l2Status === 'green' ? 'GREEN' : (l2Status === 'red' ? 'RED' : 'GREEN')
                    }
                    if (q.level === 'L3') {
                      q.is_mastered = l3Status === 'green' ? true : (l3Status === 'red' ? false : null)
                      q.consecutive_correct = l3Status === 'green' ? 3 : (l3Status === 'red' ? 0 : null)
                      q.l2_status = l3Status === 'green' ? 'GREEN' : (l3Status === 'red' ? 'RED' : 'GREEN')
                    }
                    if (q.level === 'L4') {
                      q.is_mastered = l4Status === 'green' ? true : (l4Status === 'red' ? false : null)
                      q.consecutive_correct = l4Status === 'green' ? 3 : (l4Status === 'red' ? 0 : null)
                      q.l2_status = l4Status === 'green' ? 'GREEN' : (l4Status === 'red' ? 'RED' : 'GREEN')
                    }
                  })
                }
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
        e.specialties?.forEach(spec => {
          spec.variations?.forEach(v => {
            ;(v.master_benchmarks || []).forEach(b => {
              b.is_mastered = null
              b.consecutive_correct = 0
              b.l2_status = 'GREEN'
            })
            ;(v.original_pool || []).forEach(q => {
              q.is_mastered = null
              q.consecutive_correct = 0
              q.l2_status = 'GREEN'
            })
          })
        })
      }
    }
    setTacticalData(newData)
  }

  return (
    <div className="space-y-3">
      <p className={`text-sm ${isAcademicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
        点击灯泡切换状态（灰→红→绿），快速初始化母题数据：
      </p>

      <div className="flex gap-2">
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

      <div className="space-y-2 max-h-[55vh] overflow-y-auto">
        {filteredEncounters.map(encounter => {
          const motifData = getMotifData(encounter.target_id)
          let hasL2 = false, hasL3 = false, hasL4 = false

          if (motifData?.specialties) {
            motifData.specialties.forEach(spec => spec.variations?.forEach(v => {
              if (v.master_benchmarks) {
                v.master_benchmarks.forEach(b => {
                  if (b.level === 'L2') hasL2 = true
                  if (b.level === 'L3') hasL3 = true
                  if (b.level === 'L4') hasL4 = true
                })
              }
              if (v.original_pool) {
                v.original_pool.forEach(q => {
                  if (q.level === 'L2') hasL2 = true
                  if (q.level === 'L3') hasL3 = true
                  if (q.level === 'L4') hasL4 = true
                })
              }
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
                <span className="text-sm font-bold text-purple-500 ml-4 mr-8">
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

      <div className="pt-2">
        <button
          onClick={handleClearAll}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isAcademicMode ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
          }`}
        >
          🗑️ 清空配置
        </button>
      </div>
    </div>
  )
}

export default ManualSetup
