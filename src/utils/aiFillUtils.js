const API_KEY = import.meta.env.VITE_QWEN_API_KEY || 'YOUR_API_KEY';

const MOTIF_DATA_FILES = {
  'M01': () => import('../data/M01.json'),
  'M02': () => import('../data/M02.json'),
  'M03': () => import('../data/M03.json'),
  'M04': () => import('../data/M04.json'),
  'M05': () => import('../data/M05.json'),
  'M06': () => import('../data/M06.json'),
  'M07': () => import('../data/M07.json'),
  'M08': () => import('../data/M08.json'),
  'M09': () => import('../data/M09.json'),
  'M10': () => import('../data/M10.json'),
  'M11': () => import('../data/M11.json'),
  'M12': () => import('../data/M12.json'),
  'M13': () => import('../data/M13.json'),
  'M14': () => import('../data/M14.json'),
  'M15': () => import('../data/M15.json'),
  'M16': () => import('../data/M16.json'),
  'M17': () => import('../data/M17.json'),
};

const getVariationInfo = async (motifId, specId, varId) => {
  try {
    const loader = MOTIF_DATA_FILES[motifId];
    if (!loader) return { weapons: [], specName: '', varName: '' };
    
    const data = await loader();
    const motif = data.default || data;
    
    const specialty = motif.specialties?.find(s => s.spec_id === specId);
    if (!specialty) return { weapons: [], specName: '', varName: '' };
    
    const variation = specialty.variations?.find(v => v.var_id === varId);
    if (!variation) return { weapons: [], specName: specialty.spec_name || '', varName: '' };
    
    return {
      weapons: variation.toolkit?.linked_weapons || [],
      specName: specialty.spec_name || '',
      varName: variation.name || ''
    };
  } catch (error) {
    console.error('[获取变例信息] 失败:', error);
    return { weapons: [], specName: '', varName: '' };
  }
};

const getExistingIds = async (motifId) => {
  try {
    const loader = MOTIF_DATA_FILES[motifId];
    if (!loader) return [];
    
    const data = await loader();
    const motif = data.default || data;
    
    const ids = [];
    motif.specialties?.forEach(spec => {
      spec.variations?.forEach(vari => {
        vari.original_pool?.forEach(q => ids.push(q.id));
      });
    });
    
    return ids;
  } catch (error) {
    console.error('[获取现有ID] 失败:', error);
    return [];
  }
};

const generateUniqueQuestionId = (motifId, specId, varId, level, existingIds) => {
  const baseId = `${motifId}_${specId}_${varId}_${level}_USER`;
  
  let suffix = 1;
  let newId = `${baseId}_${String(suffix).padStart(3, '0')}`;
  
  while (existingIds.includes(newId)) {
    suffix++;
    newId = `${baseId}_${String(suffix).padStart(3, '0')}`;
  }
  
  return newId;
};

export const aiFillAnswerAndKeyPoints = async (question, motifName) => {
  if (!question) return null;
  
  try {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: `你是一位高中数学专家。请分析以下数学题目，给出答案和解析要点。返回JSON格式：
{
  "answer": "最终答案",
  "key_points": ["关键步骤1", "关键步骤2", "关键步骤3"]
}`
          },
          {
            role: 'user',
            content: `题目：${question}\n母题：${motifName || ''}`
          }
        ],
        temperature: 0.3
      })
    });
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('[AI补全] 失败:', error);
    return null;
  }
};

export const aiFillFullRagFields = async (
  question, 
  motifId, 
  motifName, 
  specId, 
  varId, 
  level = 'L3',
  userPoolIds = []
) => {
  if (!question) return null;
  
  try {
    const [existingIds, variationInfo] = await Promise.all([
      getExistingIds(motifId),
      getVariationInfo(motifId, specId, varId)
    ]);
    
    const allExistingIds = [...existingIds, ...userPoolIds];
    const uniqueId = generateUniqueQuestionId(motifId, specId, varId, level, allExistingIds);
    const { weapons: matchedWeapons, specName, varName } = variationInfo;
    
    const weaponsHint = matchedWeapons.length > 0 
      ? `根据该变例的分析，推荐的杀手锏有：${matchedWeapons.join(', ')}。请从中选择最相关的。`
      : '请根据题目特点，推断可能适用的杀手锏编号（如S-LOG-02, S-FUNC-04等格式）。';
    
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: `你是一位高中数学专家。请分析以下数学题目，补全RAG数据库所需的完整字段。

重要规则：
1. 编号必须使用：${uniqueId}（这是系统生成的唯一编号，不能修改）
2. 来源必须是："error_import"（表示错题导入，区别于original）
3. 杀手锏(weapons)：${weaponsHint}

返回JSON格式（注意字段名称必须完全一致）：
{
  "id": "${uniqueId}",
  "data_source": "error_import",
  "source": "错题导入",
  "problem": "题目内容",
  "answer": "最终答案",
  "key_points": ["关键步骤1", "关键步骤2"],
  "level": "${level}",
  "tags": ["标签1", "标签2"],
  "quality_score": 80,
  "meta": {
    "core_logic": ["核心逻辑1", "核心逻辑2"],
    "trap_tags": ["易错点1", "易错点2"],
    "weapons": ["S-XXX-01"],
    "strategy_hint": ""
  },
  "specId": "${specId}",
  "specName": "",
  "varId": "${varId}",
  "varName": "",
  "analysis": "详细解析"
}`
          },
          {
            role: 'user',
            content: `题目：${question}\n母题ID：${motifId}\n母题名称：${motifName}\n专项ID：${specId}\n变例ID：${varId}\n难度：${level}`
          }
        ],
        temperature: 0.3
      })
    });
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      
      result.id = uniqueId;
      result.data_source = 'error_import';
      result.source = result.source || '错题导入';
      result.level = level;
      result.specId = specId;
      result.specName = specName;
      result.varId = varId;
      result.varName = varName;
      result.quality_score = result.quality_score || 80;
      
      if (!result.meta) {
        result.meta = {};
      }
      
      if (matchedWeapons.length > 0 && (!result.meta.weapons || result.meta.weapons.length === 0)) {
        result.meta.weapons = matchedWeapons.slice(0, 2);
      }
      
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('[AI补全RAG字段] 失败:', error);
    return null;
  }
};

export const getVariationNames = async (motifId, specId, varId) => {
  const info = await getVariationInfo(motifId, specId, varId);
  return {
    specName: info.specName,
    varName: info.varName
  };
};
