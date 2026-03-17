import { AlertTriangle, Lock, Wrench } from 'lucide-react';

const CriticalAlertsPanel = ({ alerts, isAcademicMode, onFix }) => {
  if (alerts.length === 0) return null;

  return (
    <div className={`mb-6 rounded-xl overflow-hidden ${
      isAcademicMode 
        ? 'bg-red-50 border-2 border-red-200' 
        : 'bg-red-900/10 border-2 border-red-500/30'
    }`}>
      <div className={`px-4 py-3 ${
        isAcademicMode ? 'bg-red-100' : 'bg-red-900/20'
      }`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-5 h-5 ${isAcademicMode ? 'text-red-600' : 'text-red-400'}`} />
          <span className={`font-bold ${isAcademicMode ? 'text-red-700' : 'text-red-400'}`}>
            ⚠️ 紧急修复区
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isAcademicMode ? 'bg-red-200 text-red-700' : 'bg-red-800 text-red-300'
          }`}>
            {alerts.length} 项
          </span>
        </div>
        <p className={`text-xs mt-1 ${isAcademicMode ? 'text-red-600' : 'text-red-400/80'}`}>
          检测到基础能力退化，高阶挑战已锁定，请立即修复
        </p>
      </div>

      <div className="p-3 space-y-2">
        {alerts.map((alert, index) => (
          <div 
            key={`${alert.motifId}-${alert.varId}-${index}`}
            className={`flex items-center justify-between p-3 rounded-lg ${
              isAcademicMode 
                ? 'bg-white border border-red-100' 
                : 'bg-zinc-900 border border-red-500/20'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Lock className={`w-4 h-4 ${isAcademicMode ? 'text-red-500' : 'text-red-400'}`} />
                <span className={`font-medium ${isAcademicMode ? 'text-slate-800' : 'text-zinc-200'}`}>
                  [{alert.topicName}] {alert.motifName}
                </span>
              </div>
              <div className={`text-sm ${isAcademicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                <span className="text-red-500 font-medium">{alert.level} 基础熔断</span>
                <span className="mx-2">·</span>
                <span>{alert.varName}</span>
              </div>
            </div>
            
            <button
              onClick={() => onFix && onFix(alert)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                isAcademicMode 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              <Wrench className="w-4 h-4" />
              立即修复
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CriticalAlertsPanel;
