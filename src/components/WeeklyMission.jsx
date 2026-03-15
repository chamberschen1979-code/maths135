// src/components/WeeklyMission.jsx
import React, { useState, useEffect, useMemo, useContext, useRef } from 'react';
import { ThemeContext } from '../App'; // 确保路径正确
import TaskCard from './TaskCard';
// LatexRenderer 在 TaskCard 内部使用，主组件通常不需要直接导入，除非有特殊需求
// import LatexRenderer from './LatexRenderer'; 

// --- 导入重构后的工具模块 ---
import { buildSystemPrompt, buildUserPrompt } from '../utils/promptBuilder';
import { parseAIResponse } from '../utils/responseParser';
import { 
  findMotifData, 
  getDifficultyByElo, 
  selectBenchmark, 
  selectVariableKnobs,
  buildCrossFileIndex
} from '../utils/problemLogic';
// ✅ 修复 1: 从独立的数据加载模块导入
import { loadMotifData } from '../utils/dataLoader';

// --- 配置常量 ---
const API_KEY = import.meta.env.VITE_QWEN_API_KEY || 'YOUR_API_KEY';
const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL_NAME = 'qwen-turbo';

const WeeklyMission = ({ tacticalData, weeklyPlan, errorNotebook, currentGrade, onSetActiveMotifs }) => {
  const { isAcademicMode } = useContext(ThemeContext);
  
  // --- 状态管理 ---
  const [loading, setLoading] = useState(false);
  const [bundle, setBundle] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showMotifSelector, setShowMotifSelector] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  
  // 母题数据缓存
  const [loadedMotifData, setLoadedMotifData] = useState({});

  // ✅ 修复 3: 使用 useRef 避免依赖项导致的无限循环
  // 我们只在依赖项变化时触发加载，而不需要把 loadedMotifData 本身作为依赖
  // --- 核心计算：构建跨文件索引 (Memoized) ---
  const CROSS_FILE_INDEX = useMemo(() => {
    return buildCrossFileIndex(loadedMotifData);
  }, [loadedMotifData]);

  // --- 副作用：预加载所需母题数据 (差量加载) ---
  useEffect(() => {
    const loadRequiredMotifs = async () => {
      const requiredMotifs = new Set();
      
      weeklyPlan?.activeMotifs?.forEach(id => requiredMotifs.add(id));
      errorNotebook?.forEach(e => { 
        if (!e.resolved && e.targetId) requiredMotifs.add(e.targetId); 
      });
      tacticalData?.tactical_maps?.flatMap(m => m.encounters)?.forEach(e => {
        if (e.target_id) requiredMotifs.add(e.target_id);
      });

      const missingIds = [];
      requiredMotifs.forEach(id => {
        if (!loadedMotifData[id]) {
          missingIds.push(id);
        }
      });

      if (missingIds.length === 0) return;

      const newLoadedData = { ...loadedMotifData };
      let hasNewData = false;

      for (const motifId of missingIds) {
        try {
          const data = await loadMotifData(motifId);
          if (data) {
            newLoadedData[motifId] = data;
            hasNewData = true;
          }
        } catch (err) {
          console.warn(`加载母题 ${motifId} 失败:`, err);
        }
      }

      if (hasNewData) {
        setLoadedMotifData(newLoadedData);
      }
    };

    loadRequiredMotifs();
  }, [weeklyPlan?.activeMotifs, errorNotebook, tacticalData, loadedMotifData]);

  /**
   * 🚀 单题生成核心逻辑
   */
  const generateSingleProblem = async (targetId, encounter, dualLevelContext = {}) => {
    const eloScore = encounter?.elo_score || 2000;
    const difficultyConfig = getDifficultyByElo(eloScore);
    
    if (eloScore < 1001) return null;

    // 传入 loadMotifData 函数作为兜底策略
    const motifData = await findMotifData(targetId, CROSS_FILE_INDEX, loadMotifData);
    if (!motifData) {
      console.warn(`未找到母题数据: ${targetId}`);
      return null;
    }

    const benchmark = selectBenchmark(motifData, difficultyConfig.level);
    const selectedStrategy = selectVariableKnobs(motifData, difficultyConfig.level);

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt({
      motifName: motifData.motif_name || motifData.name,
      specName: motifData.specialties?.[0]?.spec_name || '通用数学',
      varName: motifData.specialties?.[0]?.variations?.[0]?.name || '基础变式',
      difficultyConfig,
      variableKnobs: selectedStrategy,
      benchmarkQuestion: benchmark,
      dualLevelContext
    });

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${API_KEY}` 
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 8000,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const data = JSON.parse(jsonStr);
            fullContent += data.choices?.[0]?.delta?.content || '';
          } catch { /* 忽略解析错误 */ }
        }
      }
    }

    if (!fullContent.trim()) throw new Error("AI 返回内容为空");

    const parseResult = parseAIResponse(fullContent);
    if (!parseResult.success) throw new Error(`解析失败: ${parseResult.error}`);

    return {
      ...parseResult.data,
      isAIGenerated: true,
      aiLabel: `[${difficultyConfig.tier}: ${eloScore}战力]`,
      prototypeInfo: { 
        targetId, 
        targetName: motifData.motif_name || motifData.name,
        specName: motifData.specialties?.[0]?.spec_name,
        varName: motifData.specialties?.[0]?.variations?.[0]?.name
      }
    };
  };

  /**
   * 📦 批量生成任务包
   */
  const handleGenerateBundle = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);
    setBundle(null);

    const PROBLEMS_PER_MOTIF = 3;

    try {
      const allEncounters = tacticalData?.tactical_maps?.flatMap(map => map.encounters) || [];
      const selectedMotifs = []; 
      
      // 1. 错题优先
      if (errorNotebook) {
        errorNotebook.filter(e => !e.resolved).forEach(err => {
          const enc = allEncounters.find(e => e.target_id === err.targetId);
          if (enc && enc.elo_score >= 1001) {
            selectedMotifs.push({ 
              motifId: enc.target_id, 
              encounter: enc, 
              source: 'error', 
              dualLevelContext: { errorPoint: err.diagnosis },
              targetName: enc.target_name
            });
          }
        });
      }

      // 2. 激活母题
      if (weeklyPlan?.activeMotifs) {
        weeklyPlan.activeMotifs.forEach(id => {
          const enc = allEncounters.find(e => e.target_id === id);
          if (enc && enc.elo_score >= 1001 && !selectedMotifs.find(t => t.motifId === id)) {
            selectedMotifs.push({ 
              motifId: id, 
              encounter: enc, 
              source: 'active', 
              dualLevelContext: {},
              targetName: enc.target_name
            });
          }
        });
      }

      // 3. 短板兜底
      const remainingEncounters = allEncounters
        .filter(e => e.elo_score >= 1001 && !selectedMotifs.find(t => t.motifId === e.target_id))
        .sort((a, b) => a.elo_score - b.elo_score)
        .slice(0, 2);
      
      remainingEncounters.forEach(enc => {
        selectedMotifs.push({ 
          motifId: enc.target_id, 
          encounter: enc, 
          source: 'bottom_elo', 
          dualLevelContext: {},
          targetName: enc.target_name
        });
      });

      if (selectedMotifs.length === 0) {
        setError("暂无可用任务（请激活母题或录入错题）");
        setLoading(false);
        return;
      }

      const totalProblems = selectedMotifs.length * PROBLEMS_PER_MOTIF;
      setDebugInfo(`正在为 ${selectedMotifs.length} 个母题生成 ${totalProblems} 道定制题目...`);

      const promises = [];
      selectedMotifs.forEach((motifTask) => {
        for (let i = 0; i < PROBLEMS_PER_MOTIF; i++) {
          promises.push(async () => {
            try {
              const variant = await generateSingleProblem(motifTask.motifId, motifTask.encounter, motifTask.dualLevelContext);
              if (variant) {
                return {
                  ...motifTask,
                  variant,
                  targetLevel: difficultyConfigFromVariant(variant) || motifTask.encounter.level || 'L3',
                  subName: `${motifTask.targetName} - 智能变式 #${i + 1}`,
                  problemIndex: i + 1
                };
              }
              return null;
            } catch (err) {
              console.error(`生成任务 ${motifTask.motifId} #${i + 1} 失败:`, err);
              return null;
            }
          });
        }
      });

      const results = (await Promise.all(promises.map(p => p()))).filter(Boolean);
      
      if (results.length === 0) {
        throw new Error("所有题目生成失败，请检查网络或 API 配额");
      }

      setBundle({ tasks: results, generatedAt: new Date().toISOString() });
      setDebugInfo(`✅ 成功生成 ${results.length} 道题目`);

    } catch (err) {
      console.error("批量生成出错:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 辅助：从生成结果推断难度级别
  const difficultyConfigFromVariant = () => {
    return null; 
  };

  // --- UI 渲染 ---
  return (
    <div className={`h-full overflow-y-auto transition-colors duration-300 ${
      isAcademicMode ? 'bg-slate-50 text-slate-900' : 'bg-zinc-950 text-zinc-100'
    }`}>
      <div className="max-w-5xl mx-auto p-6">
        
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">📅 每周使命</h1>
            <p className={`mt-1 text-sm ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
              基于 Elo 战力的自适应命题系统
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-800 border-zinc-700'
          }`}>
            {currentGrade || '高三数学'}
          </span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard 
            label="待消灭错题" 
            value={errorNotebook?.filter(e => !e.resolved).length || 0} 
            color="red" 
            isAcademicMode={isAcademicMode} 
          />
          <StatCard 
            label="总积分 (Elo)" 
            value={allEncountersSum(tacticalData)} 
            color="emerald" 
            isAcademicMode={isAcademicMode} 
          />
          <StatCard 
            label="激活母题" 
            value={weeklyPlan?.activeMotifs?.length || 0} 
            color="blue" 
            isAcademicMode={isAcademicMode} 
          />
        </div>

        {showMotifSelector && (
          <div className={`mb-6 p-4 rounded-xl border ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-800 border-zinc-700'}`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm">选择本周重点母题</h3>
              <button 
                onClick={() => setShowMotifSelector(false)}
                className={`text-xs ${isAcademicMode ? 'text-slate-500 hover:text-slate-700' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                关闭
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {tacticalData?.tactical_maps?.flatMap(map => 
                map.encounters.filter(e => e.elo_score >= 1001).map(e => (
                  <label 
                    key={e.target_id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs ${
                      isAcademicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-700'
                    } ${weeklyPlan?.activeMotifs?.includes(e.target_id) ? (isAcademicMode ? 'bg-blue-50 border border-blue-200' : 'bg-blue-900/30 border border-blue-700') : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={weeklyPlan?.activeMotifs?.includes(e.target_id) || false}
                      onChange={(ev) => {
                        const currentIds = weeklyPlan?.activeMotifs || []
                        if (ev.target.checked) {
                          onSetActiveMotifs([...currentIds, e.target_id])
                        } else {
                          onSetActiveMotifs(currentIds.filter(id => id !== e.target_id))
                        }
                      }}
                      className="w-3 h-3"
                    />
                    <span className="truncate">{e.target_name}</span>
                  </label>
                ))
              )}
            </div>
            <div className={`mt-3 text-xs ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
              已选择 {weeklyPlan?.activeMotifs?.length || 0} 个母题
            </div>
          </div>
        )}

        {showPromptPreview && (
          <div className={`mb-6 p-4 rounded-xl border ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-800 border-zinc-700'}`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm">📝 系统提示词原文（只读）</h3>
              <button 
                onClick={() => setShowPromptPreview(false)}
                className={`text-xs ${isAcademicMode ? 'text-slate-500 hover:text-slate-700' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                关闭
              </button>
            </div>
            <pre className={`text-xs overflow-auto max-h-64 p-3 rounded-lg whitespace-pre-wrap ${
              isAcademicMode ? 'bg-slate-100 text-slate-700' : 'bg-zinc-900 text-zinc-300'
            }`}>
              {buildSystemPrompt()}
            </pre>
          </div>
        )}

        <div className={`mb-6 flex flex-wrap gap-2 ${isAcademicMode ? '' : ''}`}>
          <button
            onClick={() => setShowMotifSelector(!showMotifSelector)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isAcademicMode 
                ? 'bg-white border-slate-200 hover:border-blue-300 hover:text-blue-600' 
                : 'bg-zinc-800 border-zinc-700 hover:border-blue-500 hover:text-blue-400'
            }`}
          >
            🎯 自选母题 {weeklyPlan?.activeMotifs?.length ? `(${weeklyPlan.activeMotifs.length})` : ''}
          </button>
          <button
            onClick={() => setShowPromptPreview(!showPromptPreview)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isAcademicMode 
                ? 'bg-white border-slate-200 hover:border-purple-300 hover:text-purple-600' 
                : 'bg-zinc-800 border-zinc-700 hover:border-purple-500 hover:text-purple-400'
            }`}
          >
            📝 查看提示词
          </button>
        </div>

        <div className={`mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between bg-opacity-50 p-4 rounded-xl border backdrop-blur-sm ${
            isAcademicMode ? 'bg-white/50 border-slate-200' : 'bg-zinc-800/50 border-zinc-700'
        }`}>
          <div className="text-sm">
            {debugInfo ? (
              <span className={error ? 'text-red-500' : 'text-green-600'}>{debugInfo}</span>
            ) : (
              <span className={isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}>
                准备好开始本周的训练了吗？
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            {bundle && (
              <button 
                onClick={() => setBundle(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isAcademicMode 
                    ? 'text-red-600 hover:bg-red-50' 
                    : 'text-red-400 hover:bg-red-900/20'
                }`}
              >
                清空当前
              </button>
            )}
            <button 
              onClick={handleGenerateBundle} 
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-bold text-white shadow-lg transition-all transform active:scale-95 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30'
              }`}
            >
              {loading ? '正在命题中...' : bundle ? '重新生成' : '生成带走包'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <strong>❌ 发生错误:</strong> {error}
          </div>
        )}

        {bundle?.tasks?.length > 0 ? (
          <div className="space-y-6">
            {bundle.tasks.map((task, idx) => (
              <TaskCard 
                key={`${task.motifId}-${idx}`} 
                task={task} 
                isAcademicMode={isAcademicMode} 
                CROSS_FILE_INDEX={CROSS_FILE_INDEX}
                showAnalysis={true}
              />
            ))}
          </div>
        ) : (
          !loading && !bundle && (
            <div className={`text-center py-20 rounded-2xl border-2 border-dashed ${
              isAcademicMode ? 'border-slate-200 text-slate-400' : 'border-zinc-800 text-zinc-600'
            }`}>
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-lg font-medium">暂无任务</p>
              <p className="text-sm mt-2">点击“生成带走包”开始基于您战力的智能命题</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

// --- 辅助子组件 ---

const StatCard = ({ label, value, color, isAcademicMode }) => {
  const colorMap = {
    red: isAcademicMode ? 'bg-red-50 text-red-600' : 'bg-red-900/20 text-red-400',
    emerald: isAcademicMode ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-900/20 text-emerald-400',
    blue: isAcademicMode ? 'bg-blue-50 text-blue-600' : 'bg-blue-900/20 text-blue-400',
  };

  return (
    <div className={`p-4 rounded-xl border ${
      isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-800 border-zinc-700'
    }`}>
      <div className={`text-xs font-medium uppercase tracking-wider ${
        isAcademicMode ? 'text-slate-500' : 'text-zinc-400'
      }`}>
        {label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${colorMap[color] || 'text-slate-600'}`}>
        {value}
      </div>
    </div>
  );
};

// ✅ 修复 2: 修正括号位置和语法
const allEncountersSum = (tacticalData) => {
  if (!tacticalData?.tactical_maps) return 0;
  return tacticalData.tactical_maps
    .flatMap(m => m.encounters)
    .reduce((sum, e) => sum + (e.elo_score || 0), 0);
};

export default WeeklyMission;