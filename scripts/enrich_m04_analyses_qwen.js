/**
 * M04 题库解析智能补全脚本 (通义千问直连版)
 * 特点：
 * 1. 复用前端 .env 配置，无需新 Key。
 * 2. 智能跳过已有高质量解析的题目。
 * 3. 断点续传，支持中途停止。
 * 4. 自动降级重试机制。
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.VITE_QWEN_API_KEY;
const MODEL_NAME = process.env.QWEN_MODEL_FOR_ANALYSIS || 'qwen-max';

// 开发环境跳过SSL验证（仅用于沙箱环境）
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
} 

if (!API_KEY) {
  console.error("❌ 错误: 未在 .env 中找到 VITE_QWEN_API_KEY");
  process.exit(1);
}

const CONFIG = {
  inputPath: path.join(__dirname, '../src/data/M04.json'),
  outputPath: path.join(__dirname, '../src/data/M04.json'),
  checkpointPath: path.join(__dirname, '../src/data/.m04_checkpoint.json'),
  batchSize: 3,
  retryLimit: 3,
  minAnalysisLength: 80,
  blackListKeywords: ['略', '见解析', '省略', '同上', '易得', '略解', '参考原题'], 
};

// ================= 核心逻辑 =================

async function loadData() {
  if (!fs.existsSync(CONFIG.inputPath)) {
    throw new Error(`找不到输入文件: ${CONFIG.inputPath}`);
  }
  const content = fs.readFileSync(CONFIG.inputPath, 'utf-8');
  const data = JSON.parse(content);
  
  // 提取所有题目到扁平数组
  const allQuestions = [];
  if (data.specialties) {
    for (const spec of data.specialties) {
      for (const vari of spec.variations || []) {
        for (const q of vari.original_pool || []) {
          allQuestions.push({
            ...q,
            specId: spec.spec_id,
            specName: spec.spec_name,
            varId: vari.var_id,
            varName: vari.name
          });
        }
      }
    }
  }
  return { flatQuestions: allQuestions, originalData: data };
}

async function loadCheckpoint() {
  if (fs.existsSync(CONFIG.checkpointPath)) {
    const content = fs.readFileSync(CONFIG.checkpointPath, 'utf-8');
    return JSON.parse(content);
  }
  return { processedIds: [], failedIds: [] };
}

async function saveCheckpoint(checkpoint, originalData, flatQuestions) {
  // 更新 originalData 中的题目
  for (const q of flatQuestions) {
    // 找到对应的题目位置并更新
    for (const spec of originalData.specialties || []) {
      if (spec.spec_id !== q.specId) continue;
      for (const vari of spec.variations || []) {
        if (vari.var_id !== q.varId) continue;
        const idx = (vari.original_pool || []).findIndex(item => item.id === q.id);
        if (idx !== -1) {
          vari.original_pool[idx] = q;
        }
      }
    }
  }
  
  fs.writeFileSync(CONFIG.checkpointPath, JSON.stringify(checkpoint, null, 2), 'utf-8');
  fs.writeFileSync(CONFIG.outputPath.replace('.json', '_backup.json'), JSON.stringify(originalData, null, 2), 'utf-8');
  console.log(`💾 进度已保存 (已完成: ${checkpoint.processedIds.length})`);
}

function needsUpdate(item) {
  if (item.needs_update === true) return true;

  const analysis = item.analysis || "";
  
  if (analysis.length < CONFIG.minAnalysisLength) return true;

  const hasBlackList = CONFIG.blackListKeywords.some(keyword => analysis.includes(keyword));
  if (hasBlackList) return true;

  if (!item.answer || (typeof item.answer === 'string' && item.answer.length < 5)) return true;

  return false;
}

function buildPrompt(item) {
  const difficulty = item.level || 'L2';
  let toneInstruction = "";
  
  if (difficulty === 'L2') {
    toneInstruction = "【L2 基础题要求】步骤规范，强调基础公式的运用，指出常见的计算符号错误或概念混淆点。语气亲切鼓励。";
  } else if (difficulty === 'L3') {
    toneInstruction = "【L3 提升题要求】逻辑链条完整，禁止跳步。必须展示关键的推导过程（如设变量、列方程）。必须包含至少一个易错点警示。";
  } else {
    toneInstruction = "【L4 难题要求】深度剖析。必须包含：1.解题思路拆解；2.详细的代数/几何推导（严禁直接给结论）；3.边界值/定义域的严格讨论；4.数值验算步骤；5.易错点深度总结。逻辑必须闭环。";
  }

  return `你是一位经验丰富的高中数学教研员。请为以下题目撰写一份完美的解析。

【题目信息】
难度：${difficulty}
题目：${item.problem}
现有答案(参考): ${JSON.stringify(item.answer)}
现有解析(可能不完整): ${item.analysis || "无"}

${toneInstruction}

【输出格式要求】
请严格返回一个 JSON 对象，不要包含 markdown 标记，格式如下：
{
  "answer": "优化后的答案",
  "analysis": "【解题思路】...\\n\\n【详细推导】...\\n\\n【易错点警示】...", 
  "core_logic": "一句话概括核心考点",
  "trap_tags": ["标签1", "标签2"]
}

注意：解析内容要详实，LaTeX 公式用 $...$ 包裹。`;
}

async function callQwen(messages) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: MODEL_NAME,
      messages: messages,
      temperature: 0.3,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    });

    const options = {
      hostname: 'dashscope.aliyuncs.com',
      port: 443,
      path: '/compatible-mode/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    console.log(`📡 正在调用 API: https://${options.hostname}${options.path}`);

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📡 API 响应状态: ${res.statusCode}`);
        
        if (res.statusCode !== 200) {
          console.error(`API 请求失败详情: ${data}`);
          reject(new Error(`API 请求失败: ${res.statusCode} - ${data}`));
          return;
        }
        
        try {
          const jsonData = JSON.parse(data);
          const content = jsonData.choices?.[0]?.message?.content;
          
          if (!content) {
            reject(new Error("AI 返回内容为空"));
            return;
          }
          
          const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
          
          try {
            resolve(JSON.parse(cleanContent));
          } catch (e) {
            reject(new Error(`JSON 解析失败: ${e.message}`));
          }
        } catch (e) {
          reject(new Error(`响应解析失败: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error(`callQwen 错误详情: ${e.message}`);
      reject(e);
    });

    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.write(requestBody);
    req.end();
  });
}

async function generateWithRetry(item, attempt = 1) {
  try {
    const messages = [
      { role: "system", content: "你是一个严谨的数学解题专家，只输出合法的 JSON 数据，不要有任何多余的文字。" },
      { role: "user", content: buildPrompt(item) }
    ];

    return await callQwen(messages);
  } catch (error) {
    if (attempt < CONFIG.retryLimit) {
      console.warn(`⚠️ 题目 ${item.id} 生成失败 (尝试 ${attempt}/${CONFIG.retryLimit}): ${error.message}. 重试中...`);
      await new Promise(r => setTimeout(r, 2000 * attempt));
      return generateWithRetry(item, attempt + 1);
    }
    throw error;
  }
}

async function main() {
  console.log(`🚀 开始 M04 题库解析补全任务 (使用模型: ${MODEL_NAME})...`);
  console.log(`📂 输入文件: ${CONFIG.inputPath}`);
  
  const { flatQuestions, originalData } = await loadData();
  const checkpoint = await loadCheckpoint();
  
  const toProcess = flatQuestions.filter(q => !checkpoint.processedIds.includes(q.id) && needsUpdate(q));
  
  console.log(`📊 统计:`);
  console.log(`   - 总题目数: ${flatQuestions.length}`);
  console.log(`   - 需处理数: ${toProcess.length}`);
  console.log(`   - 已跳过数: ${flatQuestions.length - toProcess.length - checkpoint.failedIds.length}`);
  console.log(`   - 历史失败数: ${checkpoint.failedIds.length}`);

  if (toProcess.length === 0) {
    console.log("✅ 所有题目已完成或无需更新！");
    return;
  }

  let batchCount = 0;

  for (let i = 0; i < toProcess.length; i += CONFIG.batchSize) {
    batchCount++;
    const batch = toProcess.slice(i, i + CONFIG.batchSize);
    console.log(`\n🔄 处理批次 ${batchCount} (${i + 1} ~ ${Math.min(i + CONFIG.batchSize, toProcess.length)})`);

    const promises = batch.map(async (item) => {
      try {
        console.log(`✍️ 正在生成: ${item.id} (${item.level})`);
        const result = await generateWithRetry(item);
        
        if (!result.analysis || result.analysis.length < 50) {
          throw new Error("生成的解析过短，视为无效");
        }

        // 更新内存中的题目
        const idx = flatQuestions.findIndex(q => q.id === item.id);
        if (idx !== -1) {
          flatQuestions[idx] = {
            ...flatQuestions[idx],
            answer: result.answer || flatQuestions[idx].answer,
            analysis: result.analysis,
            updated_at: new Date().toISOString(),
            model_used: MODEL_NAME
          };
          
          // 更新 meta 字段
          if (!flatQuestions[idx].meta) flatQuestions[idx].meta = {};
          if (result.core_logic) {
            flatQuestions[idx].meta.core_logic = [result.core_logic];
          }
          if (result.trap_tags) {
            flatQuestions[idx].meta.trap_tags = result.trap_tags;
          }
        }
        
        checkpoint.processedIds.push(item.id);
        console.log(`✅ 成功: ${item.id}`);
      } catch (err) {
        console.error(`❌ 彻底失败: ${item.id} - ${err.message}`);
        if (!checkpoint.failedIds.includes(item.id)) {
          checkpoint.failedIds.push(item.id);
        }
      }
    });

    await Promise.all(promises);
    
    await saveCheckpoint(checkpoint, originalData, flatQuestions);
    
    if (i + CONFIG.batchSize < toProcess.length) {
      console.log(`⏳ 等待 1.5 秒后继续下一批...`);
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  // 最终保存
  fs.writeFileSync(CONFIG.outputPath, JSON.stringify(originalData, null, 2), 'utf-8');
  console.log("\n🎉 全部完成！");
  console.log(`📝 成功: ${checkpoint.processedIds.length}`);
  console.log(`💥 失败: ${checkpoint.failedIds.length}`);
  console.log(`💾 完整数据已保存至: ${CONFIG.outputPath}`);
  console.log(`💾 备份数据位于: ${CONFIG.outputPath.replace('.json', '_backup.json')}`);
}

main().catch(console.error);
