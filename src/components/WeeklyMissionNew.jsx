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
  buildCrossFileIndex
} from '../utils/problemLogic';
import { loadMotifData } from '../utils/dataLoader';

const API_KEY = import.meta.env.VITE_QWEN_API_KEY || 'YOUR_API_KEY';
const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL_NAME = 'qwen-turbo';
const PROBLEMS_PER_MOTIF = 3;

const WeeklyMission = ({
  tacticalData,
  errorNotebook,
  setErrorNotebook,
  isAcademicMode,
  onNavigateToErrorLibrary,
  currentGrade,
  weeklyTasks,
  setWeeklyTasks
}) => {
  const [selectedMotifs, setSelectedMotifs] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [loadedMotifData, setLoadedMotifData] = useState({});

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
    
    if (eloScore < 1001) return null;

    const motifData = await findMotifData(targetId, CROSS_FILE_INDEX, loadMotifData);
    if (!motifData) {
      console.warn(`未找到母题数据: ${targetId}`);
      return null;
    }

    const benchmark = selectBenchmark(motifData, difficultyConfig.level, problemIndex, constraints);
    const selectedStrategy = selectVariableKnobs(motifData, difficultyConfig.level, problemIndex, constraints, benchmark);
    const variationInfo = getVariationInfo(benchmark);
    
    const specName = variationInfo.specName;
    const varName = variationInfo.varName;
    const linkedWeapons = variationInfo.linkedWeapons;

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt({
      motifName: motifData.motif_name || motifData.name,
      specName: specName || '通用数学',
      varName: varName || '基础变式',
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
      source: source
    };
  }, [CROSS_FILE_INDEX, findMotifData, getDifficultyByElo, selectBenchmark, selectVariableKnobs, getVariationInfo, buildSystemPrompt, buildUserPrompt, parseAIResponse, loadMotifData, API_KEY, BASE_URL, MODEL_NAME]);

  const handleImportError = useCallback((errorData) => {
    setErrorNotebook?.(prev => [...(prev || []), errorData]);
  }, [setErrorNotebook]);

  const handleGenerateTasks = useCallback(async () => {
    if (allSelectedMotifs.length === 0) return;
    
    setIsGenerating(true);
    setDebugInfo(null);
    setWeeklyTasks([]);

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

      const generateWithRetry = async (motifTask, problemIndex, maxRetries = 2) => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const task = await generateSingleProblem(
              motifTask.motifId, 
              motifTask.encounter, 
              problemIndex,
              motifTask.dualLevelContext,
              motifTask.source,
              motifTask.constraints
            );
            if (task) return task;
          } catch (err) {
            console.error(`生成任务 ${motifTask.motifId} #${problemIndex} 尝试 ${attempt + 1} 失败:`, err);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        return null;
      };

      const promises = [];
      selectedMotifTasks.forEach((motifTask) => {
        for (let i = 0; i < PROBLEMS_PER_MOTIF; i++) {
          promises.push(generateWithRetry(motifTask, i + 1));
        }
      });

      const results = (await Promise.all(promises)).filter(Boolean);
      
      if (results.length === 0) {
        throw new Error("所有题目生成失败，请检查网络或 API 配额");
      }

      const failedCount = totalProblems - results.length;
      if (failedCount > 0) {
        console.warn(`有 ${failedCount} 道题目生成失败`);
      }

      setWeeklyTasks(results);
      setDebugInfo(`✅ 成功生成 ${results.length} 道题目${failedCount > 0 ? `（${failedCount} 道失败）` : ''}`);

    } catch (err) {
      console.error("批量生成出错:", err);
      setDebugInfo(`❌ 生成失败: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [allSelectedMotifs, allEncounters, errorNotebook, generateSingleProblem]);

  const parseMultiQuestionAnswer = useCallback((rawInput, expectedCount) => {
    if (!rawInput) return { status: 'EMPTY', answers: [] };
    
    let answers = [];
    const normalized = rawInput.replace(/[（(]/g, '(').replace(/[）)]/g, ')');
    
    const bracketPattern = /\((\d+)\)/g;
    const bracketMatches = normalized.split(bracketPattern).filter(s => s.trim());
    
    if (bracketMatches.length >= expectedCount * 2) {
      for (let i = 1; i < bracketMatches.length; i += 2) {
        answers.push(bracketMatches[i + 1]?.trim() || '');
      }
      if (answers.length >= expectedCount) {
        return { status: 'OK', answers: answers.slice(0, expectedCount) };
      }
    }
    
    const chineseNumPattern = /[①②③④⑤⑥⑦⑧⑨⑩]/g;
    const chineseMatches = normalized.split(chineseNumPattern).filter(s => s.trim());
    if (chineseMatches.length >= expectedCount) {
      return { status: 'OK', answers: chineseMatches.slice(0, expectedCount).map(s => s.trim()) };
    }
    
    if (normalized.includes('\n')) {
      answers = normalized.split('\n').map(s => s.trim()).filter(Boolean);
      if (answers.length >= expectedCount) {
        return { status: 'OK', answers: answers.slice(0, expectedCount) };
      }
    }
    
    answers = normalized.split(/[;；,，]/).map(s => s.trim()).filter(Boolean);
    if (answers.length >= expectedCount) {
      return { status: 'OK', answers: answers.slice(0, expectedCount) };
    }
    
    if (expectedCount === 1) {
      return { status: 'OK', answers: [normalized.trim()] };
    }
    
    return {
      status: 'FORMAT_ERROR',
      message: `检测到答案格式不完整（期望${expectedCount}问，实际${answers.length}问），请明确区分各问答案。`,
      answers: []
    };
  }, []);

  const strictCompare = useCallback((userAnswer, correctAnswer) => {
    const normalizeStr = (str) => {
      if (!str || typeof str !== 'string') return '';
      return str
        .replace(/\s+/g, '')
        .replace(/[，。；：！？、]/g, '')
        .replace(/[,.:;!?]/g, '')
        .replace(/\$/g, '')
        .toLowerCase();
    };

    const userNorm = normalizeStr(userAnswer);
    const correctNorm = normalizeStr(correctAnswer);

    if (!userNorm) return false;
    if (!correctNorm) return false;

    if (userNorm === correctNorm) return true;

    const extractNumbers = (str) => {
      if (!str || typeof str !== 'string') return [];
      const matches = str.match(/-?\d+\.?\d*/g) || [];
      return matches.map(n => parseFloat(n));
    };

    const userNums = extractNumbers(userAnswer);
    const correctNums = extractNumbers(correctAnswer);

    if (correctNums.length > 0 && userNums.length > 0) {
      const matchedNums = correctNums.filter(n =>
        userNums.some(un => Math.abs(un - n) < 0.001)
      );
      if (matchedNums.length === correctNums.length && userNums.length === correctNums.length) {
        return true;
      }
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
    const correctQuestions = {};
    if (typeof correctAnswer === 'object') {
      if (correctAnswer.l1) correctQuestions['1'] = correctAnswer.l1;
      if (correctAnswer.l2) correctQuestions['2'] = correctAnswer.l2;
      if (correctAnswer.l3) correctQuestions['3'] = correctAnswer.l3;
      if (correctAnswer.l4) correctQuestions['4'] = correctAnswer.l4;
      if (Object.keys(correctQuestions).length === 0 && correctAnswer.content) {
        correctQuestions['1'] = correctAnswer.content;
      }
    } else if (typeof correctAnswer === 'string') {
      const normalized = correctAnswer.replace(/[（(]/g, '(').replace(/[）)]/g, ')');
      const patterns = [
        /\(1\)\s*([^()]+?)(?=\(2\)|$)/,
        /\(2\)\s*([^()]+?)(?=\(3\)|$)/,
        /\(3\)\s*([^()]+?)(?=\(4\)|$)/,
        /\(4\)\s*([^()]+?)$/
      ];
      patterns.forEach((pattern, idx) => {
        const match = normalized.match(pattern);
        if (match && match[1]) {
          correctQuestions[String(idx + 1)] = match[1].trim();
        }
      });
      if (Object.keys(correctQuestions).length === 0) {
        correctQuestions['1'] = correctAnswer;
      }
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
      const correctQ = correctQuestions[String(i + 1)] || '';
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

  const handleSubmitAnswer = useCallback((taskIndex, answer) => {
    setWeeklyTasks(prev => prev.map((task, idx) => {
      if (idx !== taskIndex) return task;
      
      const correctAnswer = task.variant?.answer || task.answer || '';
      const questionMeta = task.questionMeta || { questions: [{ level: task.level || 'L2' }] };
      
      const result = evaluateAnswers(answer, correctAnswer, questionMeta);
      
      return { 
        ...task, 
        userAnswer: answer, 
        score: result.totalDelta,
        evaluationResult: result
      };
    }));
  }, [setWeeklyTasks, evaluateAnswers]);

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
        onClear={() => setWeeklyTasks([])}
        isGenerating={isGenerating}
        hasTasks={weeklyTasks.length > 0}
        debugInfo={debugInfo}
        isAcademicMode={isAcademicMode}
      />

      {weeklyTasks.length > 0 && (
        <TaskDisplay
          tasks={weeklyTasks}
          onSubmitAnswer={handleSubmitAnswer}
          isAcademicMode={isAcademicMode}
          CROSS_FILE_INDEX={CROSS_FILE_INDEX}
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
