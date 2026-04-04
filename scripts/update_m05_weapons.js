import fs from 'fs';

const weaponDetailsPath = './src/data/weapon_details.json';
const m05Path = './src/data/M05.json';

const weaponDetails = JSON.parse(fs.readFileSync(weaponDetailsPath, 'utf-8'));
const m05 = JSON.parse(fs.readFileSync(m05Path, 'utf-8'));

// 获取所有有效的杀手锏 ID
const validWeaponIds = Object.keys(weaponDetails);
console.log(`共 ${validWeaponIds.length} 个有效杀手锏\n`);

// 杀手锏关键词映射
const weaponKeywords = {
  'S-VEC-01': ['投影', '投影向量', '投影长度'],
  'S-VEC-02': ['极化恒等式', '数量积最值', 'PA.*PB', '中点'],
  'S-VEC-03': ['线性运算', '基底', '向量表示', '三点共线'],
  'S-VEC-04': ['建系', '坐标', '模长最值', '平方配方'],
  'S-VEC-05': ['极化恒等式', '数量积', 'PA.*PB', '奔驰定理', '面积比'],
  'S-TRIG-01': ['辅助角', 'asinx.*bcosx', '配角'],
  'S-TRIG-02': ['图象变换', '平移', '伸缩', '相位'],
  'S-TRIG-03': ['化边为角', '正弦定理', '余弦定理'],
  'S-TRI-02': ['SSA', '解的个数'],
  'S-TRI-04': ['中线', '角平分线', '面积法'],
  'S-SEQ-01': ['等差', '等比', '下标和', '片段和'],
  'S-SEQ-02': ['Sn最值', '前n项和最值'],
  'S-SEQ-04': ['裂项', '错位相减', '并项求和'],
  'S-FUNC-02': ['复合函数', '单调性', '同增异减'],
  'S-FUNC-04': ['零点', '交点', '根的个数'],
  'S-FUNC-05': ['周期', '对称', '周期性'],
  'S-FUNC-06': ['奇偶', '偶函数', '奇函数', '脱壳'],
  'S-INEQ-02': ['乘1法', '基本不等式', '条件最值'],
  'S-INEQ-05': ['琴生', '凹凸函数'],
  'S-INEQ-10': ['均值不等式', 'AM-GM', '算术平均'],
  'S-CONIC-01': ['椭圆', '双曲线', '定义', '焦点'],
  'S-CONIC-02': ['焦点三角形', '面积公式'],
  'S-CONIC-07': ['参数方程', '椭圆上点'],
  'S-DERIV-03': ['含参讨论', '单调区间'],
  'S-DERIV-04': ['端点效应', '恒成立'],
  'S-GEO-02': ['建系', '线面角', '二面角'],
  'S-GEO-03': ['等体积', '点面距'],
  'S-PROB-01': ['概率', '条件概率', '全概率'],
  'S-SET-01': ['空集', '子集'],
  'S-SET-02': ['端点验证', '集合边界'],
  'S-COMP-01': ['复数', '模', '复数模']
};

// 根据题目内容匹配杀手锏
function matchWeapons(problem, answer, keyPoints, analysis, level, varName) {
  const content = `${problem} ${answer} ${(keyPoints || []).join(' ')} ${analysis || ''} ${varName || ''}`.toLowerCase();
  const matchedWeapons = [];
  const scores = {};
  
  for (const [weaponId, keywords] of Object.entries(weaponKeywords)) {
    if (!validWeaponIds.includes(weaponId)) continue;
    
    let score = 0;
    for (const keyword of keywords) {
      const pattern = new RegExp(keyword.toLowerCase(), 'i');
      if (pattern.test(content)) {
        score += 1;
      }
    }
    if (score > 0) {
      scores[weaponId] = score;
    }
  }
  
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => id);
  
  return sorted;
}

// 遍历 M05.json 更新杀手锏
let updatedCount = 0;
let clearedCount = 0;

for (const spec of m05.specialties) {
  for (const variation of spec.variations) {
    for (const q of variation.original_pool) {
      const oldWeapons = q.meta?.weapons || [];
      
      const newWeapons = matchWeapons(
        q.problem,
        q.answer,
        q.key_points,
        q.analysis,
        q.level,
        variation.name
      );
      
      if (!q.meta) q.meta = {};
      
      if (newWeapons.length === 0) {
        if (oldWeapons.length > 0) {
          q.meta.weapons = [];
          clearedCount++;
          console.log(`清空: ${q.id} (原: ${oldWeapons.join(', ')})`);
        }
      } else {
        const hasChanged = JSON.stringify(oldWeapons) !== JSON.stringify(newWeapons);
        if (hasChanged) {
          q.meta.weapons = newWeapons;
          updatedCount++;
          console.log(`更新: ${q.id} -> [${newWeapons.join(', ')}]`);
        }
      }
    }
  }
}

m05.last_updated = new Date().toISOString().split('T')[0];
fs.writeFileSync(m05Path, JSON.stringify(m05, null, 2), 'utf-8');

console.log(`\n=== M05.json 更新完成 ===`);
console.log(`更新了 ${updatedCount} 道题目的杀手锏`);
console.log(`清空了 ${clearedCount} 道题目的杀手锏（无匹配）`);
