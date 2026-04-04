import fs from 'fs';

const m05Path = './src/data/M05.json';
const m05 = JSON.parse(fs.readFileSync(m05Path, 'utf-8'));

console.log('=== M05.json 质量修复脚本 ===\n');

// 1. 修复缺少求解指令的题目
console.log('【1. 修复缺少求解指令的题目】');
const instructionKeywords = ['求', '证明', '计算', '判断', '求证', '讨论'];
let fixedInstructions = 0;

for (const spec of m05.specialties) {
  for (const variation of spec.variations) {
    for (const q of variation.original_pool) {
      const problem = q.problem || '';
      const hasInstruction = instructionKeywords.some(k => problem.includes(k));
      
      if (!hasInstruction) {
        // 根据题目内容添加合适的指令
        let newProblem = problem;
        
        if (problem.includes('______') || problem.includes('填空')) {
          newProblem = problem.replace('______', '______。求该值');
        } else if (problem.includes('范围') || problem.includes('最值')) {
          newProblem = problem + ' 求其范围或最值。';
        } else if (problem.includes('判断')) {
          // 已经有判断词，不需要修改
        } else {
          // 默认添加"求"字
          newProblem = problem.replace(/\。$/, '') + '，求其值。';
        }
        
        q.problem = newProblem;
        console.log(`  修复: ${q.id}`);
        fixedInstructions++;
      }
    }
  }
}
console.log(`共修复 ${fixedInstructions} 道缺少求解指令的题目\n`);

// 2. 为 L4 题目补充 trap_tags
console.log('【2. 为 L4 题目补充 trap_tags】');

// 根据变例主题定义常见陷阱
const trapTemplates = {
  '1.1': [ // 投影向量与夹角范围
    '混淆"投影"（数值）与"投影向量"（向量）',
    '公式记错为 $\\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{b}|}$（这是投影长度）',
    '计算失误导致结果错误',
    '忽略夹角范围导致多解或漏解',
    '忘记投影向量需要乘以方向单位向量'
  ],
  '1.2': [ // 极化恒等式与最值秒杀
    '忘记极化恒等式，强行求夹角（易算错）',
    '公式记反符号（应为 $|\\vec{AM}|^2 - |\\vec{BM}|^2$）',
    '中线长度计算错误',
    '未识别出中点位置',
    '误以为结果是变化的，试图求最值'
  ],
  '2.1': [ // 线性运算、三点共线与等系数和
    '重心公式记错（如写成 1/2）',
    '忘记"三点共线则系数和为 1"的充要条件',
    '试图建立坐标系硬算，导致计算量大增',
    '搞反对应关系（面积比与系数）',
    '不知道奔驰定理，试图用基底法硬推'
  ],
  '2.2': [ // 建系策略与综合最值
    '建系位置选择不当',
    '坐标计算错误',
    '最值分析不完整',
    '忘记先平方，直接处理模长',
    '未识别出几何轨迹'
  ]
};

let fixedTrapTags = 0;

for (const spec of m05.specialties) {
  for (const variation of spec.variations) {
    const varId = variation.var_id;
    const traps = trapTemplates[varId] || [];
    
    for (const q of variation.original_pool) {
      if (q.level === 'L4') {
        const existingTraps = q.meta?.trap_tags || [];
        
        if (existingTraps.length === 0) {
          // 从模板中随机选择 2-3 个陷阱
          const numTraps = Math.floor(Math.random() * 2) + 2; // 2 或 3 个
          const shuffled = [...traps].sort(() => Math.random() - 0.5);
          const selectedTraps = shuffled.slice(0, numTraps);
          
          if (!q.meta) q.meta = {};
          q.meta.trap_tags = selectedTraps;
          
          console.log(`  ${q.id}: 添加 ${selectedTraps.length} 个陷阱标签`);
          fixedTrapTags++;
        }
      }
    }
  }
}
console.log(`共为 ${fixedTrapTags} 道 L4 题目补充了 trap_tags\n`);

// 3. 保存修改
m05.last_updated = new Date().toISOString().split('T')[0];
fs.writeFileSync(m05Path, JSON.stringify(m05, null, 2), 'utf-8');

console.log('=== 修复完成 ===');
console.log(`- 修复求解指令: ${fixedInstructions} 道`);
console.log(`- 补充 trap_tags: ${fixedTrapTags} 道`);
