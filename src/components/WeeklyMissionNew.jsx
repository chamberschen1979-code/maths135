import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { TopicScopeCard, TaskGenerator, TaskDisplay, PrintPreview, QuestionHistoryPanel } from './weekly';
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
import { useUserProgress } from '../context/UserProgressContext';
import ManualEntryModal from './weekly/ManualEntryModal';
import { aiFillAnswerAndKeyPoints } from '../utils/aiFillUtils';
import { 
  updateHistoryOnIssue, 
  updateHistoryOnAnswer
} from '../utils/questionHistoryUtils';

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
  questionHistory,
  setQuestionHistory,
  onUpdateMotifElo
}) => {
  const [selectedMotifs, setSelectedMotifs] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [loadedMotifData, setLoadedMotifData] = useState({});
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [allSelectedMotifs, setAllSelectedMotifs] = useState([]);

  const { 
    markAsMastered, 
    markAsWeak, 
    userProgress,
    isLoaded: progressLoaded 
  } = useUserProgress();

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

  const generateSingleProblem = useCallback(async (targetId, encounter, problemIndex, dualLevelContext = {}, source = 'active', constraints = {}) => {
    const eloScore = encounter?.elo_score || 2000;
    const difficultyConfig = getDifficultyByElo(eloScore);
    
    if (eloScore < 1001) return null;

    const motifData = await findMotifData(targetId, CROSS_FILE_INDEX, loadMotifData);
    if (!motifData) {
      console.warn(`未找到母题数据: ${targetId}`);
      return null;
    }

    const benchmark = selectBenchmark(motifData, difficultyConfig.level, problemIndex, { 
      ...constraints, 
      grade: currentGrade || '高三'
    }, userProgress);
    
    // 🔥 修改：使用 selectSeedQuestion 返回的增强对象
    const seedResult = selectSeedQuestion(motifData, difficultyConfig.level, benchmark, problemIndex);
    const seedQuestion = seedResult?.question || seedResult;
    
    const variationInfo = getVariationInfo(benchmark);
    
    const specName = variationInfo.specName;
    const varName = variationInfo.varName;
    const linkedWeapons = variationInfo.linkedWeapons;

    console.log('[变体信息]', { specName, varName, linkedWeapons, benchmarkLinkedWeapons: benchmark?.linkedWeapons, benchmarkWeapons: benchmark?.weapons });

    // 🚀 【核心重构】纯 RAG 模式：直接返回库里的原始数据，不经过 AI

    console.log('[调试] seedQuestion:', { id: seedQuestion?.id, hasProblem: !!seedQuestion?.problem, problemPreview: seedQuestion?.problem?.substring(0, 50), hasAnalysis: !!seedQuestion?.analysis });
    console.log('[调试] benchmark:', { id: benchmark?.id, hasProblem: !!benchmark?.problem, problemPreview: benchmark?.problem?.substring(0, 50), hasAnalysis: !!benchmark?.analysis });
    
    // 🔥 【字段对齐修复】RAG 库字段映射
    // RAG 库字段: problem, answer, key_points, analysis
    // 前端需要字段: question, answer, analysis
    
    // 1. 题干：优先使用 problem 字段
    const rawQuestion = seedQuestion?.problem || benchmark?.problem || '';
    
    // 2. 解析：优先使用 analysis，备选使用 key_points（排除最后一步答案）
    let rawAnalysis = seedQuestion?.analysis || benchmark?.analysis || '';
    if (!rawAnalysis && (seedQuestion?.key_points || benchmark?.key_points)) {
      const keyPoints = seedQuestion?.key_points || benchmark?.key_points || [];
      // 🔥 排除最后一步（通常包含答案），只保留分析步骤
      const analysisSteps = keyPoints.slice(0, -1);
      rawAnalysis = analysisSteps.join('\n');
    }
    
    // 🔥 移除解析末尾的【答案】部分（避免与答案区域重复）
    if (rawAnalysis) {
      // 匹配【答案】或【答案：】及其后面的所有内容
      rawAnalysis = rawAnalysis.replace(/【答案[：:]?】[\s\S]*$/g, '').trim();
      // 也匹配"答案："格式
      rawAnalysis = rawAnalysis.replace(/答案[：:][\s\S]*$/g, '').trim();
    }
    
    // 3. 答案：直接使用 answer 字段
    const rawAnswer = seedQuestion?.answer || benchmark?.answer || '';

    // 🔥 检查关键字段
    if (!rawQuestion) {
      console.warn('[⚠️ 字段缺失] RAG 库中未找到题目内容', { seedQuestion, benchmark });
      return null;
    }

    console.log('[调试] 生成任务:', { id: seedQuestion?.id || benchmark?.id, questionLength: rawQuestion.length, hasAnalysis: !!rawAnalysis, hasAnswer: !!rawAnswer });

    const taskResult = {
      id: `task-${targetId}-${seedQuestion?.id || benchmark?.id || problemIndex}-${Date.now()}`,
      motifId: targetId,
      motifName: motifData.motif_name || motifData.name,
      specName: specName,
      varName: varName,
      level: difficultyConfig.level,
      targetLevel: difficultyConfig.level,
      questionId: seedQuestion?.id || benchmark?.id,
      variant: {
        question: rawQuestion,
        analysis: rawAnalysis || '暂无解析',
        answer: rawAnswer || '暂无答案'
      },
      variableKnobs: seedResult?.variableKnobs || {},
      benchmark: {
        ...benchmark,
        linked_weapons: linkedWeapons || benchmark?.linked_weapons || []
      },
      isAIGenerated: false,
      aiLabel: `[RAG库: ${seedQuestion?.id || benchmark?.id}]`,
      problemIndex,
      source: source,
      questionMeta: {
        questions: [{ level: difficultyConfig.level }]
      }
    };
    
    if (setQuestionHistory && questionHistory !== undefined) {
      const questionId = seedQuestion?.id || benchmark?.id;
      if (questionId) {
        setQuestionHistory(prev => updateHistoryOnIssue(
          prev, 
          questionId, 
          targetId, 
          varName, 
          difficultyConfig.level,
          {
            motifName: motifData.motif_name || motifData.name,
            specId: benchmark?.specId || '',
            specName: specName,
            varName: varName,
            questionText: rawQuestion
          }
        ));
      }
    }

    return taskResult;
  }, [CROSS_FILE_INDEX, loadMotifData]);

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
        
        const generateFn = async (negativeConstraints = [], retryCount = 0) => {
          const extraConstraints = negativeConstraints?.length > 0 
            ? { ...motifTask.constraints, negativeHints: negativeConstraints }
            : motifTask.constraints;
          
          return await generateSingleProblem(
            motifTask.motifId, 
            motifTask.encounter, 
            problemIndex,
            motifTask.dualLevelContext,
            motifTask.source,
            extraConstraints
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
            'verifying_math': `🔍 正在核对题目指纹 (RAG 校验)...`,
            'evaluating_fitness': `📊 正在评估难度匹配度 (目标 ${targetLevel})...`,
            'retrying': `🔄 数据不一致，正在重新同步...`,
            'passed': `✅ 源头验证通过`,
            'failed': `❌ 源头同步失败`
          };
          
          setDebugInfo(phaseMessages[status.phase] || status.phase);
        };
        
        // 🔥 RAG 模式：验证器只核对一致性，不需要复杂的难度适配
        // TODO: 当 verifyQuestionWithRetry 接口重构后，可简化传参：
        // const result = await verifyQuestionWithRetry(generateFn, motifTask.motifId, onStatusUpdate);
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
  }, [allSelectedMotifs, allEncounters, errorNotebook, generateSingleProblem, errorMotifIds, selectedMotifs]);

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
    
    
    return { status: 'OK', answers: answers.slice(0, expectedCount) };
  }, []);

  const strictCompare = useCallback((userAnswer, correctAnswer) => {
    const userNorm = normalizeMathSymbols(userAnswer);
    const correctNorm = normalizeMathSymbols(correctAnswer);


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


    if (correctNums.length > 0 && userNums.length > 0) {
      if (correctNums.length !== userNums.length) {
        return false;
      }
      
      for (let i = 0; i < correctNums.length; i++) {
        if (Math.abs(userNums[i] - correctNums[i]) >= 0.001) {
          return false;
        }
      }
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
      return true;
    }

    if (userChineseNorm.includes(correctChineseNorm) || correctChineseNorm.includes(userChineseNorm)) {
      const shorter = Math.min(userChineseNorm.length, correctChineseNorm.length);
      const longer = Math.max(userChineseNorm.length, correctChineseNorm.length);
      if (shorter / longer >= 0.8) {
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
      return true;
    }

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


    for (let i = 0; i < expectedCount; i++) {
      const userQ = userAnswers[i] || '';
      const correctQ = correctAnswersArray[i] || '';
      const level = questionMeta?.questions?.[i]?.level || 'L2';

      const isCorrect = strictCompare(userQ, correctQ);
      const scores = ELO_SCORES[level] || ELO_SCORES.L2;
      const delta = isCorrect ? scores.correct : scores.wrong;


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
        setWeeklyTasks(prev => prev.map((t, idx) => 
          idx === taskIndex ? { ...t, isSubmitting: false } : t
        ));
        return;
      }

      const question = task.variant?.question || task.question || '';
      const correctAnswer = task.variant?.answer || task.answer || '';
      const level = task.targetLevel || 'L2';
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

      const questionId = task.benchmark?.id || task.id;
      const questionLevel = task.targetLevel || task.level;

      if (aiResult.isCorrect) {
        const result = markAsMastered(questionId, questionLevel);
        
        if (setQuestionHistory && task.questionId) {
          const grade = aiResult.delta >= 30 ? 'S' : aiResult.delta >= 15 ? 'A' : 'B';
          setQuestionHistory(prev => updateHistoryOnAnswer(
            prev,
            task.questionId,
            task.motifId,
            task.varName,
            grade,
            true
          ));
        }
        
        if (setErrorNotebook) {
          const specId = task.benchmark?.specId || task.specId;
          const varId = task.benchmark?.varId || task.varId;
          
          if (specId && varId) {
            setErrorNotebook(prev => {
              const beforeCount = prev.filter(e => !e.resolved).length;
              const updated = prev.map(e => 
                e.targetId === task.motifId 
                && e.specId === specId 
                && e.varId === varId 
                && !e.resolved
                  ? { ...e, resolved: true, resolvedAt: new Date().toISOString(), resolvedBy: 'auto' }
                  : e
              );
              const afterCount = updated.filter(e => !e.resolved).length;
              const resolvedCount = beforeCount - afterCount;
              
              if (resolvedCount > 0) {
              }
              return updated;
            });
          }
        }
      } else {
        markAsWeak(questionId, questionLevel, task.motifId);
        
        if (setQuestionHistory && task.questionId) {
          setQuestionHistory(prev => updateHistoryOnAnswer(
            prev,
            task.questionId,
            task.motifId,
            task.varName,
            'C',
            false
          ));
        }
      }

      if (setErrorNotebook && !aiResult.isCorrect) {
        const specId = task.benchmark?.specId || task.specId;
        const varId = task.benchmark?.varId || task.varId;
        
        const errorEntry = {
          id: `error-${task.id}-${Date.now()}`,
          targetId: task.motifId,
          motifName: task.motifName,
          specId: specId,
          specName: task.specName,
          varId: varId,
          varName: task.varName,
          level: task.targetLevel || task.level,
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
          
          aiFillAnswerAndKeyPoints(question, task.motifName).then(result => {
            if (result) {
              setErrorNotebook(prev => prev.map(e => 
                e.id === errorEntry.id 
                  ? { ...e, correctAnswer: result.answer, keyPoints: result.keyPoints }
                  : e
              ));
            }
          });
          
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
        isAcademicMode={isAcademicMode}
        onAllSelectedChange={setAllSelectedMotifs}
      />

      <TaskGenerator
        allSelectedMotifs={allSelectedMotifs}
        onGenerate={handleGenerateTasks}
        onRegenerate={handleGenerateTasks}
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

      {questionHistory && Object.keys(questionHistory).length > 0 && (
        <QuestionHistoryPanel
          questionHistory={questionHistory}
          setQuestionHistory={setQuestionHistory}
          isAcademicMode={isAcademicMode}
        />
      )}

      <PrintPreview
        tasks={weeklyTasks}
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        isAcademicMode={isAcademicMode}
      />

      <ManualEntryModal
        isOpen={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        motifId={selectedMotifs[0]?.motifId || selectedMotifs[0]?.id || 'M04'}
        specId={selectedMotifs[0]?.specId || 'V1'}
        varId={selectedMotifs[0]?.varId || '1.1'}
        motifName={selectedMotifs[0]?.motifName || selectedMotifs[0]?.name || '未选择'}
      />
      </div>
    </div>
  );
};

export default WeeklyMission;
