const API_KEY = import.meta.env.VITE_QWEN_API_KEY || 'YOUR_API_KEY';
const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL_NAME = 'qwen-plus';

const ELO_SCORES = {
  L1: { correct: 20, wrong: -10 },
  L2: { correct: 40, wrong: -20 },
  L3: { correct: 60, wrong: -30 },
  L4: { correct: 100, wrong: -50 }
};

const buildGraderPrompt = (question, standardAnswer, userAnswer, level, questionMeta) => {
  const questionCount = questionMeta?.questions?.length || 1;
  const levelDescriptions = questionMeta?.questions?.map((q, i) => 
    `第${i + 1}问难度: ${q.level || level}`
  ).join('\n') || `整体难度: ${level}`;

  return {
    system: `你是一位经验丰富、宽容且严谨的高中数学金牌阅卷老师。
你的任务是批改学生的作业。你需要对比【题目】、【标准答案】和【学生作答】。

核心阅卷原则 (必须严格遵守)：
1. 数学本质优先：
   - 只要数学含义等价，即判为正确
   - 允许格式混用：LaTeX (sqrt{2})、纯文本 (根号2)、近似值 (1.414) 视为等价
   - 允许集合/区间/不等式混用：{x|x>1}、(1, +∞)、x>1 视为等价

2. 自然语言容错：
   - 忽略非关键动词/名词的缺失
   - 例如："点C在..."与"C在..."等价
   - "直线AB"与"线段AB所在直线"在语境明确时等价

3. 步骤与结论：
   - 如果题目只要求"求结果"，学生只写结果且正确，判对
   - 核心结论正确，通常判为正确

4. 多问处理：
   - 仔细识别学生答案中的 (1), (2) 或 ①, ② 标记
   - 如果学生漏答某问，该问判错
   - 如果学生标号混乱但内容对应，尝试智能匹配

输出格式：
- 严禁输出任何多余的文字、寒暄或 Markdown 代码块标记
- 必须且只能输出一个合法的 JSON 对象`,

    user: `【题目内容】：
${question}

【标准答案与解析】：
${JSON.stringify(standardAnswer)}

【学生作答】：
${userAnswer}

【题目信息】：
共 ${questionCount} 问
${levelDescriptions}

请执行判卷：
1. 逐问分析学生答案与标准答案的数学等价性
2. 判断每问是否正确
3. 给出简短、有针对性的点评 (reason)

输出 JSON 格式（必须严格遵循）：
{
  "isCorrect": true/false,
  "reason": "简短点评",
  "details": [
    {"index": 0, "isCorrect": true},
    {"index": 1, "isCorrect": false}
  ]
}

注意：details 数组中每个元素必须包含 index (从0开始) 和 isCorrect 字段。`
  };
};

export const judgeAnswerWithAI = async (question, standardAnswer, userAnswer, level = 'L2', questionMeta = null) => {
  const messages = buildGraderPrompt(question, standardAnswer, userAnswer, level, questionMeta);
  const questionCount = questionMeta?.questions?.length || 1;

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: messages.system },
          { role: 'user', content: messages.user }
        ],
        temperature: 0.1,
        top_p: 0.5,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      content = content.substring(jsonStart, jsonEnd + 1);
    }

    const result = JSON.parse(content);

    const processedDetails = [];
    let totalDelta = 0;

    for (let i = 0; i < questionCount; i++) {
      const detailFromAI = result.details?.find(d => d.index === i || d.questionIndex === i + 1 || d.questionIndex === i);
      const questionLevel = questionMeta?.questions?.[i]?.level || level;
      const scores = ELO_SCORES[questionLevel] || ELO_SCORES.L2;
      const isCorrect = detailFromAI?.isCorrect ?? false;
      const delta = isCorrect ? scores.correct : scores.wrong;

      processedDetails.push({
        index: i,
        level: questionLevel,
        isCorrect,
        delta
      });
      totalDelta += delta;
    }

    const isAllCorrect = processedDetails.every(d => d.isCorrect);

    console.log('[AI判题] 结果:', { 
      isCorrect: isAllCorrect, 
      reason: result.reason, 
      totalDelta,
      details: processedDetails
    });

    return {
      isCorrect: isAllCorrect,
      reason: result.reason || (isAllCorrect ? '回答正确' : '存在错误'),
      delta: totalDelta,
      details: processedDetails
    };

  } catch (error) {
    console.error('[AI判题] 失败:', error);
    throw error;
  }
};

export const judgeAnswerWithFallback = async (
  question, 
  standardAnswer, 
  userAnswer, 
  level, 
  fallbackCompare,
  questionMeta = null
) => {
  try {
    return await judgeAnswerWithAI(question, standardAnswer, userAnswer, level, questionMeta);
  } catch (error) {
    console.warn('[AI判题] 降级为本地匹配');
    
    const isCorrect = fallbackCompare(userAnswer, standardAnswer);
    const scores = ELO_SCORES[level] || ELO_SCORES.L2;
    const delta = isCorrect ? scores.correct : scores.wrong;
    
    return {
      isCorrect,
      reason: isCorrect ? '本地匹配：答案正确' : '本地匹配：答案有误（AI服务暂时不可用）',
      delta,
      details: [{
        index: 0,
        level,
        isCorrect,
        delta
      }],
      isFallback: true
    };
  }
};
