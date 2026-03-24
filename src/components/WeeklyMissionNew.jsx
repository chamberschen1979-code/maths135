import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { TopicScopeCard, TaskGenerator, TaskDisplay, PrintPreview } from './weekly';
import { buildSystemPrompt, buildUserPrompt } from '../utils/promptBuilder';
import { parseAIResponse } from '../utils/responseParser';
import { 
  findMotifData,
  getDifficultyByElo,
  selectBenchmark, 
  selectVariableKnobs, 
  getVariationInfo,
  getAvailableVariations,
  buildCrossFileIndex,
  selectSeedQuestion
} from '../utils/problemLogic';
import { loadMotifData } from '../utils/dataLoader';
import { judgeAnswerWithFallback } from '../utils/aiGrader';
import { getWeaponNameById, getWeaponLogicFlow } from '../utils/weaponUtils';
import { verifyQuestionWithRetry } from '../services/questionVerifier';

const API_KEY = import.meta.env.VITE_QWEN_API_KEY || 'YOUR_API_KEY';
const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL_NAME = 'qwen-turbo';
const PROBLEMS_PER_MOTIF = 3;

const normalizeLatex = (str) => {
  if (!str || typeof str !== 'string') return '';
  let result = str;
  
  result = result.replace(/\$\s*/g, '').replace(/\s*\$/g, '');
  result = result.replace(/\\\(/g, '').replace(/\\\)/g, '');
  result = result.replace(/\\\[/g, '').replace(/\\\]/g, '');
  
  result = result.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
  result = result.replace(/\\dfrac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
  result = result.replace(/\\tfrac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
  result = result.replace(/\\cfrac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
  
  result = result.replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)');
  result = result.replace(/\\sqrt\[(\d+)\]\{([^{}]+)\}/g, 'root($1,$2)');
  result = result.replace(/\\sqrt\s+(\S+)/g, 'sqrt($1)');
  
  result = result.replace(/\\sqrt\{\\frac\{([^{}]+)\}\{([^{}]+)\}\}/g, 'sqrt(($1)/($2))');
  
  result = result.replace(/\\log\s*_?\s*(\d+)?\s*\(?([^)\s]+)\)?/gi, (match, base, arg) => {
    return base ? `log${base}(${arg})` : `log(${arg})`;
  });
  result = result.replace(/\\ln\s*\(?([^)\s]+)\)?/gi, 'ln($1)');
  result = result.replace(/\\lg\s*\(?([^)\s]+)\)?/gi, 'lg($1)');
  
  result = result.replace(/\\sin\s*\(?([^)\s]+)\)?/gi, 'sin($1)');
  result = result.replace(/\\cos\s*\(?([^)\s]+)\)?/gi, 'cos($1)');
  result = result.replace(/\\tan\s*\(?([^)\s]+)\)?/gi, 'tan($1)');
  result = result.replace(/\\cot\s*\(?([^)\s]+)\)?/gi, 'cot($1)');
  result = result.replace(/\\sec\s*\(?([^)\s]+)\)?/gi, 'sec($1)');
  result = result.replace(/\\csc\s*\(?([^)\s]+)\)?/gi, 'csc($1)');
  
  result = result.replace(/\\arcsin\s*\(?([^)\s]+)\)?/gi, 'arcsin($1)');
  result = result.replace(/\\arccos\s*\(?([^)\s]+)\)?/gi, 'arccos($1)');
  result = result.replace(/\\arctan\s*\(?([^)\s]+)\)?/gi, 'arctan($1)');
  
  result = result.replace(/\\sinh\s*\(?([^)\s]+)\)?/gi, 'sinh($1)');
  result = result.replace(/\\cosh\s*\(?([^)\s]+)\)?/gi, 'cosh($1)');
  result = result.replace(/\\tanh\s*\(?([^)\s]+)\)?/gi, 'tanh($1)');
  
  result = result.replace(/\\exp\s*\(?([^)\s]+)\)?/gi, 'exp($1)');
  
  result = result.replace(/\\lim_\{([^{}]+)\}/gi, 'lim($1)');
  result = result.replace(/\\sum_\{([^{}]+)\}\^\{([^{}]+)\}/gi, 'sum($1,$2)');
  result = result.replace(/\\prod_\{([^{}]+)\}\^\{([^{}]+)\}/gi, 'prod($1,$2)');
  result = result.replace(/\\int_\{([^{}]+)\}\^\{([^{}]+)\}/gi, 'int($1,$2)');
  
  result = result.replace(/\\pi/gi, 'pi');
  result = result.replace(/\\e(?![a-z])/gi, 'e');
  result = result.replace(/\\infty/gi, 'inf');
  result = result.replace(/\\emptyset/gi, 'empty');
  result = result.replace(/\\varnothing/gi, 'empty');
  
  result = result.replace(/\\alpha/gi, 'alpha');
  result = result.replace(/\\beta/gi, 'beta');
  result = result.replace(/\\gamma/gi, 'gamma');
  result = result.replace(/\\delta/gi, 'delta');
  result = result.replace(/\\theta/gi, 'theta');
  result = result.replace(/\\lambda/gi, 'lambda');
  result = result.replace(/\\mu/gi, 'mu');
  result = result.replace(/\\sigma/gi, 'sigma');
  result = result.replace(/\\phi/gi, 'phi');
  result = result.replace(/\\omega/gi, 'omega');
  result = result.replace(/\\epsilon/gi, 'epsilon');
  result = result.replace(/\\rho/gi, 'rho');
  result = result.replace(/\\eta/gi, 'eta');
  result = result.replace(/\\xi/gi, 'xi');
  result = result.replace(/\\zeta/gi, 'zeta');
  
  result = result.replace(/\\cdot/g, '*');
  result = result.replace(/\\times/g, '*');
  result = result.replace(/\\div/g, '/');
  result = result.replace(/\\pm/g, '+-');
  result = result.replace(/\\mp/g, '-+');
  
  result = result.replace(/\\leq?/g, '<=');
  result = result.replace(/\\geq?/g, '>=');
  result = result.replace(/\\lt/g, '<');
  result = result.replace(/\\gt/g, '>');
  result = result.replace(/\\neq?/g, '!=');
  result = result.replace(/\\approx/g, '~');
  result = result.replace(/\\equiv/g, '==');
  result = result.replace(/\\sim/g, '~');
  result = result.replace(/\\propto/g, 'prop');
  
  result = result.replace(/\\subset/g, 'subset');
  result = result.replace(/\\supset/g, 'supset');
  result = result.replace(/\\subseteq/g, 'subseteq');
  result = result.replace(/\\supseteq/g, 'supseteq');
  result = result.replace(/\\cup/g, 'union');
  result = result.replace(/\\cap/g, 'intersect');
  result = result.replace(/\\in/g, 'in');
  result = result.replace(/\\notin/g, 'notin');
  result = result.replace(/\\forall/g, 'forall');
  result = result.replace(/\\exists/g, 'exists');
  
  result = result.replace(/\\rightarrow/g, '->');
  result = result.replace(/\\leftarrow/g, '<-');
  result = result.replace(/\\Rightarrow/g, '=>');
  result = result.replace(/\\Leftarrow/g, '<=');
  result = result.replace(/\\leftrightarrow/g, '<->');
  result = result.replace(/\\Leftrightarrow/g, '<=>');
  
  result = result.replace(/\\left\s*/g, '');
  result = result.replace(/\\right\s*/g, '');
  result = result.replace(/\\big/g, '');
  result = result.replace(/\\Big/g, '');
  result = result.replace(/\\bigg/g, '');
  result = result.replace(/\\Bigg/g, '');
  
  result = result.replace(/\\{([^{}]+)\}/g, '($1)');
  
  result = result.replace(/\\text\s*\{([^{}]+)\}/gi, '$1');
  result = result.replace(/\\mathrm\s*\{([^{}]+)\}/gi, '$1');
  result = result.replace(/\\mathbf\s*\{([^{}]+)\}/gi, '$1');
  result = result.replace(/\\mathit\s*\{([^{}]+)\}/gi, '$1');
  result = result.replace(/\\mathbb\s*\{([^{}]+)\}/gi, '$1');
  
  result = result.replace(/\\quad/g, ' ');
  result = result.replace(/\\qquad/g, ' ');
  result = result.replace(/\\,/g, ' ');
  result = result.replace(/\\;/g, ' ');
  result = result.replace(/\\!/g, '');
  result = result.replace(/\\ /g, ' ');
  
  result = result.replace(/\\\\/g, '');
  result = result.replace(/\\/g, '');
  
  return result;
};

const normalizeMathSymbols = (str) => {
  if (!str || typeof str !== 'string') return '';
  let result = str;
  
  result = normalizeLatex(result);
  
  result = result
    .replace(/[（(]/g, '(')
    .replace(/[）)]/g, ')')
    .replace(/[［\[]/g, '[')
    .replace(/[］\]]/g, ']')
    .replace(/[｛{]/g, '{')
    .replace(/[｝}]/g, '}')
    .replace(/−|－|—|–/g, '-')
    .replace(/×|✕|✖/g, '*')
    .replace(/÷|∕/g, '/')
    .replace(/＝/g, '=')
    .replace(/≠/g, '!=')
    .replace(/≤|≦/g, '<=')
    .replace(/≥|≧/g, '>=')
    .replace(/＜/g, '<')
    .replace(/＞/g, '>')
    .replace(/±/g, '+-')
    .replace(/·|⋅|∙/g, '*')
    .replace(/π/g, 'pi')
    .replace(/∞/g, 'inf')
    .replace(/√/g, 'sqrt')
    .replace(/根号/g, 'sqrt')
    .replace(/∑/g, 'sum')
    .replace(/∏/g, 'prod')
    .replace(/∫/g, 'int')
    .replace(/∂/g, 'd')
    .replace(/∆/g, 'delta')
    .replace(/α/g, 'alpha')
    .replace(/β/g, 'beta')
    .replace(/γ/g, 'gamma')
    .replace(/θ/g, 'theta')
    .replace(/λ/g, 'lambda')
    .replace(/μ/g, 'mu')
    .replace(/σ/g, 'sigma')
    .replace(/φ/g, 'phi')
    .replace(/ω/g, 'omega')
    .replace(/\s+/g, '')
    .replace(/[，。；：！？、]/g, '')
    .replace(/[,.:;!?]/g, '')
    .toLowerCase();
    
  return result;
};

const WeeklyMission = ({
  tacticalData,
  errorNotebook,
  setErrorNotebook,
  isAcademicMode,
  onNavigateToErrorLibrary,
  currentGrade,
  weeklyTasks,
  setWeeklyTasks,
  onUpdateMotifElo
}) => {
  const [selectedMotifs, setSelectedMotifs] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [loadedMotifData, setLoadedMotifData] = useState({});
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  const allEncounters = tacticalData?.tactical_maps?.flatMap(m => m.encounters) || [];

  const CROSS_FILE_INDEX = useMemo(() => {
    return buildCrossFileIndex(loadedMotifData);
  }, [loadedMotifData]);

  useEffect(() => {
    const loadRequiredMotifs = async () => {
      const requiredMotifs = new Set();
      
      errorNotebook?.forEach(e => { 
        if (!e.resolved && e.targetId) requiredMotifs.add(e.targetId); 
      });
      allEncounters.forEach(e => {
        if (e.target_id && e.elo_score >= 1001) requiredMotifs.add(e.target_id);
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
  }, [errorNotebook, allEncounters, loadedMotifData]);

  const errorMotifIds = useMemo(() => {
    const ids = new Set();
    errorNotebook?.filter(e => !e.resolved).forEach(err => {
      if (err.targetId) ids.add(err.targetId);
    });
    return ids;
  }, [errorNotebook]);

  const activeMotifs = useMemo(() => {
    return allEncounters.filter(e => e.elo_score >= 1001);
  }, [allEncounters]);

  const reinforcementMotifs = useMemo(() => {
    const excludedIds = new Set([
      ...Array.from(errorMotifIds),
      ...(selectedMotifs?.map(s => s.motifId) || [])
    ]);
    
    return activeMotifs
      .filter(m => !excludedIds.has(m.target_id))
      .sort((a, b) => a.elo_score - b.elo_score)
      .slice(0, 2);
  }, [activeMotifs, errorMotifIds, selectedMotifs]);

  const allSelectedMotifs = useMemo(() => {
    const motifSet = new Set();
    
    errorMotifIds.forEach(id => motifSet.add(id));
    selectedMotifs?.forEach(s => motifSet.add(s.motifId));
    reinforcementMotifs.forEach(m => motifSet.add(m.target_id));
    
    return Array.from(motifSet);
  }, [errorMotifIds, selectedMotifs, reinforcementMotifs]);

  const generateSingleProblem = useCallback(async (targetId, encounter, problemIndex, dualLevelContext = {}, source = 'active', constraints = {}) => {
    const eloScore = encounter?.elo_score || 2000;
    const difficultyConfig = getDifficultyByElo(eloScore);
    
    // 简化版：固定温度 0.7
    const temperature = 0.7
    
    if (eloScore < 1001) return null;

    const motifData = await findMotifData(targetId, CROSS_FILE_INDEX, loadMotifData);
    if (!motifData) {
      console.warn(`未找到母题数据: ${targetId}`);
      return null;
    }

    const benchmark = selectBenchmark(motifData, difficultyConfig.level, problemIndex, { 
      ...constraints, 
      grade: currentGrade || '高三' 
    });
    const selectedStrategy = selectVariableKnobs(motifData, difficultyConfig.level, problemIndex, { 
      ...constraints, 
      grade: currentGrade || '高三' 
    }, benchmark);
    
    const seedQuestion = selectSeedQuestion(motifData, difficultyConfig.level, benchmark, problemIndex);
    
    const variationInfo = getVariationInfo(benchmark);
    
    const specName = variationInfo.specName;
    const varName = variationInfo.varName;
    const linkedWeapons = variationInfo.linkedWeapons;

    // 构建杀手锏约束信息
    const weaponConstraints = {}
    if (constraints.weaponId) {
      const weaponName = getWeaponNameById(constraints.weaponId);
      const weaponLogicFlow = getWeaponLogicFlow(constraints.weaponId);
      
      if (weaponName) {
        weaponConstraints.weaponId = constraints.weaponId;
        weaponConstraints.weaponName = weaponName;
        weaponConstraints.weaponLogicFlow = weaponLogicFlow;
        console.log(`[周任务] 注入杀手锏约束: ${weaponName} (${constraints.weaponId})`);
      }
    }

    const systemPrompt = buildSystemPrompt(currentGrade || '高一');
    
    // 提取 hard_constraints 和 system_instruction_template
    const hardConstraints = selectedStrategy?.hard_constraints || null;
    const systemInstructionTemplate = motifData.system_instruction_template || null;
    
    // 提取 module_constraints (模块专属约束)
    const moduleConstraints = motifData.module_constraints || null;
    
    // 提取 math_invariants (数学不变量)
    const mathInvariants = motifData.math_invariants || null;
    
    const userPrompt = buildUserPrompt({
      motifName: motifData.motif_name || motifData.name,
      specName: specName || '通用数学',
      varName: varName || '基础变式',
      difficultyConfig,
      variableKnobs: selectedStrategy,
      benchmarkQuestion: benchmark,
      seedQuestion: seedQuestion,
      dualLevelContext,
      constraints: weaponConstraints,
      hardConstraints,
      systemInstructionTemplate,
      moduleConstraints,
      mathInvariants,
      userGrade: currentGrade || '高三',
      motifId: motifData.id || motifData.motif_id || '',
      problemIndex,
      totalProblems: PROBLEMS_PER_MOTIF
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
        temperature: temperature, // 🚀 V5.1 使用动态温度
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
    
    const extractQuestion = (q) => {
      if (!q) return '';
      if (typeof q === 'string') return q;
      if (q.content) return q.content;
      if (q.text) return q.text;
      return q;
    };

    return {
      id: `task-${targetId}-${problemIndex}-${Date.now()}`,
      motifId: targetId,
      motifName: motifData.motif_name || motifData.name,
      specName: specName,
      varName: varName,
      level: difficultyConfig.level,
      targetLevel: difficultyConfig.level,
      variant: {
        question: extractQuestion(parseResult.data.question),
        analysis: parseResult.data.analysis,
        answer: parseResult.data.answer
      },
      variableKnobs: selectedStrategy,
      benchmark: {
        ...benchmark,
        linked_weapons: linkedWeapons || benchmark?.linked_weapons || []
      },
      isAIGenerated: true,
      aiLabel: `[${difficultyConfig.tier}: ${eloScore}战力]`,
      problemIndex,
      source: source,
      questionMeta: {
        questions: difficultyConfig.multiQuestion 
          ? [{ level: 'L2' }, { level: difficultyConfig.level }]
          : [{ level: difficultyConfig.level }]
      }
    };
  }, [CROSS_FILE_INDEX, loadMotifData, API_KEY, BASE_URL, MODEL_NAME]);

  const handleImportError = useCallback((errorData) => {
    setErrorNotebook?.(prev => [...(prev || []), errorData]);
  }, [setErrorNotebook]);

  const handleGenerateTasks = useCallback(async () => {
    if (allSelectedMotifs.length === 0) return;
    
    setIsGenerating(true);
    setDebugInfo(null);
    setWeeklyTasks([]);
    setGeneratedQuestions([]);
    setVerificationStatus(null);

    try {
      const selectedMotifTasks = [];
      const errorMotifIdSet = errorMotifIds;
      const customMotifIdSet = new Set(selectedMotifs?.map(s => s.motifId) || []);
      const reinforcementMotifIdSet = new Set(reinforcementMotifs.map(m => m.target_id));
      
      allSelectedMotifs.forEach(motifId => {
        const enc = allEncounters.find(e => e.target_id === motifId);
        if (enc && enc.elo_score >= 1001) {
          const errorInfo = errorNotebook?.find(e => e.targetId === motifId && !e.resolved);
          
          let source = 'active';
          let constraints = {};
          
          if (errorMotifIdSet.has(motifId)) {
            source = 'error';
            if (errorInfo?.specId) constraints.specId = errorInfo.specId;
            if (errorInfo?.varId) constraints.varId = errorInfo.varId;
            if (errorInfo?.specName) constraints.specName = errorInfo.specName;
            if (errorInfo?.varName) constraints.varName = errorInfo.varName;
            
            const suggestedWeapons = errorInfo?.diagnosisDetails?.suggestedWeapons || 
                                     errorInfo?.diagnosis?.suggestedWeapons || [];
            if (suggestedWeapons.length > 0) {
              constraints.weaponId = suggestedWeapons[0];
            }
          } else if (customMotifIdSet.has(motifId)) {
            source = 'custom';
            const customSelection = selectedMotifs?.find(s => s.motifId === motifId);
            if (customSelection) {
              if (customSelection.specId) constraints.specId = customSelection.specId;
              if (customSelection.varId) constraints.varId = customSelection.varId;
              if (customSelection.specName) constraints.specName = customSelection.specName;
              if (customSelection.varName) constraints.varName = customSelection.varName;
            }
          } else if (reinforcementMotifIdSet.has(motifId)) {
            source = 'reinforcement';
          }
          
          selectedMotifTasks.push({
            motifId,
            encounter: enc,
            targetName: enc.target_name,
            dualLevelContext: errorInfo ? { errorPoint: errorInfo.diagnosis } : {},
            source,
            constraints
          });
        }
      });

      if (selectedMotifTasks.length === 0) {
        setDebugInfo("暂无可用任务");
        setIsGenerating(false);
        return;
      }

      const totalProblems = selectedMotifTasks.length * PROBLEMS_PER_MOTIF;
      setDebugInfo(`正在为 ${selectedMotifTasks.length} 个母题生成 ${totalProblems} 道定制题目...`);

      const generateWithVerification = async (motifTask, problemIndex, existingQuestions, maxRetries = 3) => { // 🚀 增加重试次数从 2 到 3
        const targetLevel = motifTask.encounter?.elo_score 
          ? getDifficultyByElo(motifTask.encounter.elo_score).level 
          : 'L3';
        
        const generateFn = async (negativeConstraints, retryCount = 0) => {
          const extraConstraints = negativeConstraints.length > 0 
            ? { ...motifTask.constraints, negativeHints: negativeConstraints }
            : motifTask.constraints;
          
          // 简化版：固定温度 0.7，保持创造力
          const temperature = 0.7
          
          return await generateSingleProblem(
            motifTask.motifId, 
            motifTask.encounter, 
            problemIndex,
            motifTask.dualLevelContext,
            motifTask.source,
            extraConstraints,
            { temperature, retryCount } // 🚀 传递动态温度
          );
        };
        
        const onStatusUpdate = (status) => {
          setVerificationStatus({
            motifId: motifTask.motifId,
            problemIndex,
            ...status
          });
          
          const phaseMessages = {
            'generating': `正在生成第 ${problemIndex} 题...`,
            'verifying_math': `正在验算数学逻辑 (母题 ${motifTask.motifId})...`,
            'evaluating_fitness': `正在评估难度匹配度 (目标 ${targetLevel})...`,
            'retrying': `题目质量不足，正在重新构思...`,
            'passed': `✅ 题目验证通过`,
            'failed': `❌ 验证失败`
          };
          
          setDebugInfo(phaseMessages[status.phase] || status.phase);
        };
        
        const result = await verifyQuestionWithRetry(
          generateFn,
          motifTask.motifId,
          targetLevel,
          existingQuestions,
          maxRetries,
          onStatusUpdate
        );
        
        if (result.success) {
          const task = result.question;
          if (task) {
            task.verification = result.verification;
            task.fitnessScore = result.fitnessScore;
            task.fitnessDetails = result.verification?.fitnessDetails;
            // 🆕 存储指纹，用于后续去重
            if (result.fingerprint) {
              task.fingerprint = result.fingerprint;
            }
          }
          return task;
        }
        
        return null;
      };

      const results = [];
      const failedTasks = [];
      
      for (const motifTask of selectedMotifTasks) {
        for (let i = 0; i < PROBLEMS_PER_MOTIF; i++) {
          // 🔧 修复4: 增强异常处理，防止单个题目解析失败导致整个批量生成中断
          try {
            const task = await generateWithVerification(
              motifTask, 
              i + 1, 
              [...results, ...generatedQuestions],
              2
            );
            
            if (task) {
              results.push(task);
              setGeneratedQuestions(prev => [...prev, task]);
            } else {
              failedTasks.push({ motifId: motifTask.motifId, index: i + 1, reason: '返回空结果' });
            }
          } catch (error) {
            // 🚨 捕获异常但不中断流程，保证其他题目能继续生成
            console.error(`[WeeklyMission] 题目 ${motifTask.motifId}#${i + 1} 处理异常:`, error);
            failedTasks.push({ 
              motifId: motifTask.motifId, 
              index: i + 1, 
              reason: error?.message || '未知异常',
              error: error
            });
            
            // 更新 UI 显示错误信息
            setDebugInfo(`⚠️ 题目 ${motifTask.motifId}#${i + 1} 生成异常: ${error?.message?.substring(0, 50) || '未知错误'}，跳过继续...`);
            
            // 短暂延迟后继续，避免快速重试导致 API 压力
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      if (results.length === 0) {
        throw new Error("所有题目生成失败，请检查网络或 API 配额");
      }

      const failedCount = totalProblems - results.length;
      if (failedCount > 0) {
        console.warn(`有 ${failedCount} 道题目生成失败`);
      }

      setWeeklyTasks(results);
      setGeneratedQuestions(results);
      
      const avgFitness = results.reduce((sum, t) => sum + (t.fitnessScore || 0), 0) / results.length;
      setDebugInfo(`✅ 成功生成 ${results.length} 道题目${failedCount > 0 ? `（${failedCount} 道失败）` : ''}，平均适配度 ${avgFitness.toFixed(1)}/5.0`);

    } catch (err) {
      console.error("批量生成出错:", err);
      setDebugInfo(`❌ 生成失败: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setVerificationStatus(null);
    }
  }, [allSelectedMotifs, allEncounters, errorNotebook, generateSingleProblem, errorMotifIds, selectedMotifs, reinforcementMotifs]);

  const parseMultiQuestionAnswer = useCallback((rawInput, expectedCount) => {
    if (!rawInput) return { status: 'EMPTY', answers: [] };
    
    let answers = [];
    let normalized = rawInput
      .replace(/[（(]/g, '(')
      .replace(/[）)]/g, ')');
    
    for (let i = 1; i <= expectedCount; i++) {
      const pattern1 = new RegExp(`\\(${i}\\)\\s*([\\s\\S]*?)(?=\\(${i + 1}\\)|$)`, 'i');
      let match = normalized.match(pattern1);
      
      if (!match || !match[1]) {
        const pattern2 = new RegExp(`^\\s*${i}\\)\\s*([\\s\\S]*?)(?=${i + 1}\\)|$)`, 'im');
        match = normalized.match(pattern2);
      }
      
      if (!match || !match[1]) {
        const pattern3 = new RegExp(`[\\n^]\\s*${i}\\)\\s*([\\s\\S]*?)(?=${i + 1}\\)|$)`, 'im');
        match = normalized.match(pattern3);
      }
      
      if (match && match[1]) {
        answers.push(match[1].trim());
      } else {
        answers.push('');
      }
    }
    
    if (answers.every(a => a === '')) {
      answers = [];
      const chineseNumPattern = /[①②③④⑤⑥⑦⑧⑨⑩]/g;
      const chineseMatches = normalized.split(chineseNumPattern).filter(s => s.trim());
      if (chineseMatches.length >= expectedCount) {
        answers = chineseMatches.slice(0, expectedCount).map(s => s.trim());
      }
    }
    
    if (answers.length === 0 || answers.every(a => a === '')) {
      if (normalized.includes('\n')) {
        const lines = normalized.split('\n').map(s => s.trim()).filter(Boolean);
        if (lines.length >= expectedCount) {
          answers = lines.slice(0, expectedCount);
        }
      }
    }
    
    if (answers.length === 0 || answers.every(a => a === '')) {
      const semicolonParts = normalized.split(/[;；]/).map(s => s.trim()).filter(Boolean);
      if (semicolonParts.length >= expectedCount) {
        answers = semicolonParts.slice(0, expectedCount);
      }
    }
    
    if (answers.length === 0 || answers.every(a => a === '')) {
      if (expectedCount === 1) {
        answers = [normalized.trim()];
      }
    }
    
    if (answers.length < expectedCount) {
      while (answers.length < expectedCount) {
        answers.push('');
      }
    }
    
    console.log('[parseMultiQuestionAnswer] 解析结果:', { expectedCount, answers, rawInput: rawInput.substring(0, 100) });
    
    return { status: 'OK', answers: answers.slice(0, expectedCount) };
  }, []);

  const strictCompare = useCallback((userAnswer, correctAnswer) => {
    const userNorm = normalizeMathSymbols(userAnswer);
    const correctNorm = normalizeMathSymbols(correctAnswer);

    console.log('[strictCompare] 比较:', { userNorm, correctNorm, userAnswer, correctAnswer });

    if (!userNorm) return false;
    if (!correctNorm) return false;

    if (userNorm === correctNorm) return true;

    const extractNumbers = (str) => {
      if (!str || typeof str !== 'string') return [];
      const normalized = normalizeMathSymbols(str);
      const matches = normalized.match(/-?\d+\.?\d*/g) || [];
      return matches.map(n => parseFloat(n));
    };

    const userNums = extractNumbers(userAnswer);
    const correctNums = extractNumbers(correctAnswer);

    console.log('[strictCompare] 数字提取:', { userNums, correctNums });

    if (correctNums.length > 0 && userNums.length > 0) {
      if (correctNums.length !== userNums.length) {
        console.log('[strictCompare] 数字数量不匹配');
        return false;
      }
      
      for (let i = 0; i < correctNums.length; i++) {
        if (Math.abs(userNums[i] - correctNums[i]) >= 0.001) {
          console.log('[strictCompare] 数字值不匹配:', userNums[i], correctNums[i]);
          return false;
        }
      }
      console.log('[strictCompare] 数字匹配成功');
      return true;
    }

    const extractInequalities = (str) => {
      if (!str || typeof str !== 'string') return [];
      const normalized = normalizeMathSymbols(str);
      const matches = normalized.match(/[<>]=?|!=?[^<>!=]*/g) || [];
      return matches.map(m => m.trim());
    };

    const userIneqs = extractInequalities(userAnswer);
    const correctIneqs = extractInequalities(correctAnswer);

    if (correctIneqs.length > 0 && userIneqs.length > 0) {
      const userIneqNorm = userIneqs.map(i => normalizeMathSymbols(i)).sort().join(',');
      const correctIneqNorm = correctIneqs.map(i => normalizeMathSymbols(i)).sort().join(',');
      
      if (userIneqNorm === correctIneqNorm) {
        console.log('[strictCompare] 不等式匹配成功');
        return true;
      }
    }

    const normalizeChineseText = (str) => {
      if (!str || typeof str !== 'string') return '';
      return str
        .replace(/[点个只条项步件本张位次颗根段节章部]/g, '')
        .replace(/[的在了着过吗呢吧呀啊哦嗯]/g, '')
        .replace(/直线/g, '线')
        .replace(/曲线/g, '线')
        .replace(/函数/g, 'f')
        .replace(/\s+/g, '')
        .toLowerCase();
    };

    const userChineseNorm = normalizeChineseText(userNorm);
    const correctChineseNorm = normalizeChineseText(correctNorm);

    if (userChineseNorm === correctChineseNorm) {
      console.log('[strictCompare] 中文模糊匹配成功');
      return true;
    }

    if (userChineseNorm.includes(correctChineseNorm) || correctChineseNorm.includes(userChineseNorm)) {
      const shorter = Math.min(userChineseNorm.length, correctChineseNorm.length);
      const longer = Math.max(userChineseNorm.length, correctChineseNorm.length);
      if (shorter / longer >= 0.8) {
        console.log('[strictCompare] 包含关系匹配成功');
        return true;
      }
    }

    const extractMathExpr = (str) => {
      if (!str || typeof str !== 'string') return '';
      return str
        .replace(/[a-z]+\([^)]*\)/gi, m => m)
        .replace(/[a-z]+/gi, '')
        .replace(/[<>]=?|=/g, m => m);
    };

    const userMathExpr = extractMathExpr(userNorm);
    const correctMathExpr = extractMathExpr(correctNorm);

    if (userMathExpr && correctMathExpr && userMathExpr === correctMathExpr) {
      console.log('[strictCompare] 数学表达式匹配成功');
      return true;
    }

    console.log('[strictCompare] 匹配失败');
    return false;
  }, []);

  const evaluateAnswers = useCallback((userAnswer, correctAnswer, questionMeta) => {
    const expectedCount = questionMeta?.questions?.length || 1;
    
    const parseResult = parseMultiQuestionAnswer(userAnswer, expectedCount);

    if (parseResult.status === 'FORMAT_ERROR') {
      return {
        status: 'FORMAT_ERROR',
        message: parseResult.message,
        details: [],
        totalDelta: -5,
        isAllCorrect: false,
        isInvalidSubmit: true
      };
    }

    if (parseResult.status === 'EMPTY') {
      return {
        status: 'EMPTY',
        message: '请输入答案',
        details: [],
        totalDelta: 0,
        isAllCorrect: false,
        isInvalidSubmit: true
      };
    }

    const userAnswers = parseResult.answers;

    let correctAnswersArray = [];
    
    if (typeof correctAnswer === 'object' && correctAnswer !== null) {
      for (let i = 0; i < expectedCount; i++) {
        const keyByL = `l${i + 1}`;
        const keyByNum = String(i + 1);
        if (correctAnswer[keyByL]) {
          correctAnswersArray.push(correctAnswer[keyByL]);
        } else if (correctAnswer[keyByNum]) {
          correctAnswersArray.push(correctAnswer[keyByNum]);
        } else {
          correctAnswersArray.push('');
        }
      }
    } else if (typeof correctAnswer === 'string') {
      const normalized = correctAnswer
        .replace(/[（(]/g, '(')
        .replace(/[）)]/g, ')');
      
      const parts = [];
      for (let i = 1; i <= expectedCount; i++) {
        const regex = new RegExp(`\\(${i}\\)\\s*([\\s\\S]*?)(?=\\(${i + 1}\\)|$)`, 'i');
        const match = normalized.match(regex);
        if (match && match[1]) {
          parts.push(match[1].trim());
        } else {
          parts.push('');
        }
      }
      
      if (parts.every(p => p === '') && normalized.includes('\n')) {
        const lines = normalized.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length >= expectedCount) {
          correctAnswersArray = lines.slice(0, expectedCount);
        } else {
          correctAnswersArray = parts;
        }
      } else {
        correctAnswersArray = parts;
      }
      
      if (expectedCount === 1 && correctAnswersArray[0] === '') {
        correctAnswersArray = [normalized.trim()];
      }
    } else {
      correctAnswersArray = [String(correctAnswer || '')];
    }

    const ELO_SCORES = {
      L1: { correct: 20, wrong: -10 },
      L2: { correct: 40, wrong: -20 },
      L3: { correct: 60, wrong: -30 },
      L4: { correct: 100, wrong: -50 }
    };

    const details = [];
    let totalDelta = 0;

    console.log(`[开始评价] 共 ${expectedCount} 问`, { userAnswers, correctAnswersArray });

    for (let i = 0; i < expectedCount; i++) {
      const userQ = userAnswers[i] || '';
      const correctQ = correctAnswersArray[i] || '';
      const level = questionMeta?.questions?.[i]?.level || 'L2';

      const isCorrect = strictCompare(userQ, correctQ);
      const scores = ELO_SCORES[level] || ELO_SCORES.L2;
      const delta = isCorrect ? scores.correct : scores.wrong;

      console.log(`  - 第${i + 1}问 [${level}]: ${isCorrect ? '✅' : '❌'} (${delta >= 0 ? '+' : ''}${delta})`, { userQ, correctQ });

      details.push({
        index: i,
        level,
        isCorrect,
        delta,
        userAnswer: userQ,
        correctAnswer: correctQ
      });
      totalDelta += delta;
    }

    return {
      status: 'OK',
      details,
      totalDelta,
      isAllCorrect: details.every(d => d.isCorrect),
      isInvalidSubmit: false
    };
  }, [parseMultiQuestionAnswer, strictCompare]);

  const handleSubmitAnswer = useCallback(async (taskIndex, answer, answerType = 'text') => {
    setWeeklyTasks(prev => prev.map((task, idx) => 
      idx === taskIndex ? { ...task, isSubmitting: true } : task
    ));

    try {
      const task = weeklyTasks[taskIndex];
      if (!task || task.isSubmitted) {
        console.log('[handleSubmitAnswer] 任务不存在或已提交');
        setWeeklyTasks(prev => prev.map((t, idx) => 
          idx === taskIndex ? { ...t, isSubmitting: false } : t
        ));
        return;
      }

      const question = task.variant?.question || task.question || '';
      const correctAnswer = task.variant?.answer || task.answer || '';
      const level = task.targetLevel || 'L2';

      console.log('[handleSubmitAnswer] 开始 AI 判题...', { 
        motifId: task.motifId,
        question: question.substring(0, 50) + '...',
        level,
        answerType
      });

      const questionMeta = task.questionMeta || { questions: [{ level }] };

      const aiResult = await judgeAnswerWithFallback(
        question,
        correctAnswer,
        answer,
        level,
        (userAns, correctAns) => {
          const result = evaluateAnswers(userAns, correctAns, questionMeta);
          return result.isAllCorrect;
        },
        questionMeta,
        answerType
      );

      console.log('[handleSubmitAnswer] AI 判题结果:', aiResult);

      const evaluationResult = {
        status: 'OK',
        isAllCorrect: aiResult.isCorrect,
        totalDelta: aiResult.delta,
        aiReason: aiResult.reason,
        isFallback: aiResult.isFallback || false,
        details: aiResult.details || [{
          index: 0,
          level,
          isCorrect: aiResult.isCorrect,
          delta: aiResult.delta,
          userAnswer: answerType === 'text' ? answer : '[图片答案]',
          correctAnswer: correctAnswer
        }]
      };

      setWeeklyTasks(prev => prev.map((t, idx) => {
        if (idx !== taskIndex) return t;
        
        return {
          ...t,
          userAnswer: answerType === 'text' ? answer : '[图片答案]',
          userAnswerType: answerType,
          score: aiResult.delta,
          evaluationResult,
          isSubmitted: true,
          isSubmitting: false
        };
      }));

      if (onUpdateMotifElo) {
        onUpdateMotifElo(task.motifId, aiResult.delta);
      }

      if (setErrorNotebook && !aiResult.isCorrect) {
        const errorEntry = {
          id: `error-${task.id}-${Date.now()}`,
          targetId: task.motifId,
          motifName: task.motifName,
          specName: task.specName,
          question: question,
          userAnswer: answerType === 'text' ? answer : '[图片答案]',
          correctAnswer: correctAnswer,
          aiReason: aiResult.reason,
          score: aiResult.delta,
          createdAt: new Date().toISOString(),
          resolved: false
        };
        
        setErrorNotebook(prev => {
          const newNotebook = [...prev, errorEntry];
          console.log('[错题本] 添加错题:', errorEntry);
          return newNotebook;
        });
      }

    } catch (error) {
      console.error('[handleSubmitAnswer] 判题出错:', error);
      
      setWeeklyTasks(prev => prev.map((t, idx) => 
        idx === taskIndex ? { 
          ...t, 
          isSubmitting: false,
          submitError: '判题服务暂时繁忙，请稍后重试'
        } : t
      ));
    }
  }, [weeklyTasks, evaluateAnswers, onUpdateMotifElo, setErrorNotebook]);

  return (
    <div className="h-full overflow-y-auto pb-4">
      <div className="space-y-4">
        <div className={`flex items-center justify-between sticky top-0 z-10 py-2 ${
          isAcademicMode ? 'bg-white' : 'bg-zinc-900'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <h1 className="text-xl font-bold">每周任务</h1>
          </div>
          <div className={`text-xs px-3 py-1 rounded-full ${
            isAcademicMode ? 'bg-slate-100 text-slate-600' : 'bg-zinc-700 text-zinc-400'
          }`}>
            {currentGrade || '高三数学'}
          </div>
        </div>

      <TopicScopeCard
        errorNotebook={errorNotebook}
        tacticalData={tacticalData}
        selectedMotifs={selectedMotifs}
        onSelectionChange={setSelectedMotifs}
        onImportError={handleImportError}
        onNavigateToErrorLibrary={onNavigateToErrorLibrary}
        isAcademicMode={isAcademicMode}
      />

      <TaskGenerator
        allSelectedMotifs={allSelectedMotifs}
        onGenerate={handleGenerateTasks}
        onPrint={() => setShowPrintPreview(true)}
        onClear={() => {
          setWeeklyTasks([]);
          setGeneratedQuestions([]);
        }}
        isGenerating={isGenerating}
        hasTasks={weeklyTasks.length > 0}
        debugInfo={debugInfo}
        isAcademicMode={isAcademicMode}
        verificationStatus={verificationStatus}
      />

      {weeklyTasks.length > 0 && (
        <TaskDisplay
          tasks={weeklyTasks}
          onSubmitAnswer={handleSubmitAnswer}
          isAcademicMode={isAcademicMode}
          CROSS_FILE_INDEX={CROSS_FILE_INDEX}
          errorNotebook={errorNotebook}
        />
      )}

      <PrintPreview
        tasks={weeklyTasks}
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        isAcademicMode={isAcademicMode}
      />
      </div>
    </div>
  );
};

export default WeeklyMission;
