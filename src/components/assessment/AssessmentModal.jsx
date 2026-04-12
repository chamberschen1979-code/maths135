import { useState } from 'react'
import { X } from 'lucide-react'
import SmartAssessment from './SmartAssessment'
import ManualSetup from './ManualSetup'

const AssessmentModal = ({
  isOpen,
  onClose,
  isAcademicMode,
  tacticalData,
  setTacticalData,
  initGradeFilter,
  setInitGradeFilter,
  assessmentHistory,
  setAssessmentHistory
}) => {
  const [activeTab, setActiveTab] = useState('smart')

  if (!isOpen) return null

  const tabs = [
    { id: 'smart', label: '🎯 智能测评', desc: '经典题摸底' },
    { id: 'manual', label: '⚡ 手动设置', desc: '调试面板' }
  ]

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={`max-w-3xl w-full max-h-[90vh] overflow-hidden mx-4 rounded-xl border shadow-2xl ${
          isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-700'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isAcademicMode ? 'border-slate-200' : 'border-zinc-700'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className={`text-lg font-bold ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
                学情评估
              </h2>
              <p className={`text-xs ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                精准定位知识水平，智能推荐学习路径
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all ${
              isAcademicMode ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`flex border-b ${isAcademicMode ? 'border-slate-200' : 'border-zinc-700'}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === tab.id
                  ? isAcademicMode
                    ? 'text-blue-600'
                    : 'text-blue-400'
                  : isAcademicMode
                    ? 'text-slate-500 hover:text-slate-700'
                    : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div>{tab.label}</div>
              <div className={`text-xs ${activeTab === tab.id ? 'opacity-80' : 'opacity-50'}`}>
                {tab.desc}
              </div>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'smart' && (
            <SmartAssessment
              tacticalData={tacticalData}
              setTacticalData={setTacticalData}
              isAcademicMode={isAcademicMode}
              onClose={onClose}
              assessmentHistory={assessmentHistory}
              setAssessmentHistory={setAssessmentHistory}
            />
          )}

          {activeTab === 'manual' && (
            <ManualSetup
              isAcademicMode={isAcademicMode}
              tacticalData={tacticalData}
              setTacticalData={setTacticalData}
              initGradeFilter={initGradeFilter}
              setInitGradeFilter={setInitGradeFilter}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default AssessmentModal
