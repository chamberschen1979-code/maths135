import { ELO_SCORES } from './eloEngine'

const API_KEY = import.meta.env.VITE_QWEN_API_KEY || 'YOUR_API_KEY';
const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL_NAME = 'qwen-turbo';
const VISION_MODEL_NAME = 'qwen-vl-max';

const buildGraderPrompt = (question, standardAnswer, userAnswer, level, questionMeta) => {
  const questionCount = questionMeta?.questions?.length || 1;
  const levelDescriptions = questionMeta?.questions?.map((q, i) => 
    `第${i + 1}问难度: ${q.level || level}`
  ).join('\n') || `整体难度: ${level}`;

  return {
    system: `你是高中数学阅卷老师。对比【题目】、【标准答案】和【学生作答】。

判卷原则：
1. 数学本质优先：只要数学含义等价即判正确
2. 自然语言容错：忽略非关键动词/名词缺失
3. 歸结论正确即判对

输出纯JSON（无Markdown）：
{"isCorrect":true/false,"reason":"简短点评","details":[{"index":0,"isCorrect":true}]}`,

    user: `【题目】：
${question}

【标准答案】：
${JSON.stringify(standardAnswer)}

【学生作答】：
${userAnswer}

【题目信息】：
共 ${questionCount} 问
${levelDescriptions}

请判卷，输出JSON。`
  };
};

const buildVisionGraderPrompt = (question, standardAnswer, level, questionMeta) => {
  const questionCount = questionMeta?.questions?.length || 1;
  
  return `你是高中数学阅卷老师。请批改学生上传的解题过程图片。

【题目】：
${question}

【标准答案】：
${JSON.stringify(standardAnswer)}

【题目信息】：
共 ${questionCount} 问，难度 ${level}

判卷原则：
1. 数学本质优先，步骤正确即可
2. 检查是否有核心解题步骤
3. 计算结果是否正确

输出纯JSON（无Markdown）：
{"isCorrect":true/false,"reason":"简短点评","details":[{"index":0,"isCorrect":true}]}`;
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
  questionMeta = null,
  answerType = 'text'
) => {
  try {
    if (answerType === 'image') {
      return await judgeImageWithAI(question, standardAnswer, userAnswer, level, questionMeta);
    }
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

export const judgeImageWithAI = async (question, standardAnswer, imageBase64, level = 'L2', questionMeta = null) => {
  const questionCount = questionMeta?.questions?.length || 1;
  const prompt = buildVisionGraderPrompt(question, standardAnswer, level, questionMeta);

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: VISION_MODEL_NAME,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
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

    return {
      isCorrect: isAllCorrect,
      reason: result.reason || (isAllCorrect ? '回答正确' : '存在错误'),
      delta: totalDelta,
      details: processedDetails
    };

  } catch (error) {
    console.error('[AI图片判题] 失败:', error);
    throw error;
  }
};
