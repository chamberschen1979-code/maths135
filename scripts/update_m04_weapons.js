import fs from 'fs';

const weaponDetailsPath = './src/data/weapon_details.json';
const m04Path = './src/data/M04.json';

const weaponDetails = JSON.parse(fs.readFileSync(weaponDetailsPath, 'utf-8'));
const m04 = JSON.parse(fs.readFileSync(m04Path, 'utf-8'));

// 获取所有有效的杀手锏 ID
const validWeaponIds = Object.keys(weaponDetails);
console.log('=== 有效杀手锏 ID 列表 ===');
console.log(validWeaponIds.join(', '));
console.log(`\n共 ${validWeaponIds.length} 个杀手锏\n`);

// 杀手锏关键词映射（用于智能匹配）
const weaponKeywords = {
  'S-LOG-01': ['对数', 'log', 'lg', 'ln', '换底公式', '指对数'],
  'S-LOG-02': ['指对同构', '同构', '指数对数'],
  'S-LOG-03': ['对数不等式', 'log.*不等', '对数.*范围'],
  'S-LOG-04': ['复合函数', '单调性', '同增异减'],
  'S-FUNC-02': ['复合函数', '单调性', '同增异减', '内外层'],
  'S-FUNC-04': ['零点', '交点', '根的个数', '方程.*解'],
  'S-FUNC-05': ['周期', '对称', '周期性'],
  'S-FUNC-06': ['奇偶', '偶函数', '奇函数', '脱壳'],
  'S-FUNC-08': ['复合零点', '剥洋葱', 'f(f(x))'],
  'S-TRIG-01': ['辅助角', 'asinx.*bcosx', '配角'],
  'S-TRIG-02': ['图象变换', '平移', '伸缩', '相位'],
  'S-TRIG-03': ['化边为角', '正弦定理', '余弦定理', '三角形最值'],
  'S-TRI-02': ['SSA', '解的个数', '三角形解'],
  'S-TRI-04': ['中线', '角平分线', '面积法'],
  'S-VEC-01': ['投影', '投影向量', '投影长度'],
  'S-VEC-02': ['极化恒等式', '数量积最值', 'PA.*PB'],
  'S-VEC-03': ['线性运算', '基底', '向量表示'],
  'S-VEC-04': ['建系', '坐标', '模长最值'],
  'S-VEC-05': ['极化恒等式', '数量积', 'PA.*PB'],
  'S-SEQ-01': ['等差', '等比', '下标和', '片段和'],
  'S-SEQ-02': ['Sn最值', '前n项和最值', '二次函数'],
  'S-SEQ-04': ['裂项', '错位相减', '并项求和'],
  'S-SEQ-08': ['特征根', '递推', '线性递推'],
  'S-SEQ-09': ['不动点', '递推数列', '极限'],
  'S-SEQ-10': ['切线放缩', '数列不等式', '放缩'],
  'S-GEO-02': ['建系', '线面角', '二面角', '法向量'],
  'S-GEO-03': ['等体积', '点面距', '体积'],
  'S-PROB-01': ['概率', '条件概率', '全概率', '贝叶斯'],
  'S-CONIC-01': ['椭圆', '双曲线', '定义', '焦点', '离心率'],
  'S-CONIC-02': ['焦点三角形', '面积公式'],
  'S-CONIC-03': ['渐近线', '焦点到渐近线'],
  'S-CONIC-05': ['仿射变换', '椭圆内接'],
  'S-CONIC-06': ['齐次化', '斜率关系'],
  'S-CONIC-07': ['参数方程', '椭圆上点'],
  'S-DERIV-03': ['含参讨论', '单调区间', '导数含参'],
  'S-DERIV-04': ['端点效应', '恒成立', '参数范围'],
  'S-DERIV-09': ['洛必达', '极限', '临界值'],
  'S-DERIV-10': ['极值点偏移', '比值代换', '双变量'],
  'S-DERIV-11': ['对数平均', '极值点偏移'],
  'S-INEQ-02': ['乘1法', '基本不等式', '条件最值'],
  'S-INEQ-05': ['琴生', '凹凸函数'],
  'S-INEQ-06': ['柯西', '柯西不等式'],
  'S-INEQ-07': ['权方和', '分式最值'],
  'S-INEQ-10': ['均值不等式', 'AM-GM', '算术平均'],
  'S-SET-01': ['空集', '子集', '包含关系'],
  'S-SET-02': ['端点验证', '集合边界'],
  'S-COMP-01': ['复数', '模', '复数模']
};

// 根据题目内容匹配杀手锏
function matchWeapons(problem, answer, keyPoints, analysis, level, varName) {
  const content = `${problem} ${answer} ${(keyPoints || []).join(' ')} ${analysis || ''} ${varName || ''}`.toLowerCase();
  const matchedWeapons = [];
  const scores = {};
  
  // 计算每个杀手锏的匹配分数
  for (const [weaponId, keywords] of Object.entries(weaponKeywords)) {
    // 只匹配有效的杀手锏 ID
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
  
  // 按分数排序，取前 2 个
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => id);
  
  return sorted;
}

// 遍历 M04.json 更新杀手锏
let updatedCount = 0;
let clearedCount = 0;

for (const spec of m04.specialties) {
  for (const variation of spec.variations) {
    for (const q of variation.original_pool) {
      const oldWeapons = q.meta?.weapons || [];
      
      // 根据题目内容匹配杀手锏
      const newWeapons = matchWeapons(
        q.problem,
        q.answer,
        q.key_points,
        q.analysis,
        q.level,
        variation.name
      );
      
      // 更新 weapons
      if (!q.meta) q.meta = {};
      
      // 如果没有匹配到合适的杀手锏，清空
      if (newWeapons.length === 0) {
        if (oldWeapons.length > 0) {
          q.meta.weapons = [];
          clearedCount++;
          console.log(`清空: ${q.id} (原: ${oldWeapons.join(', ')})`);
        }
      } else {
        // 检查是否有变化
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

// 保存
m04.last_updated = new Date().toISOString().split('T')[0];
fs.writeFileSync(m04Path, JSON.stringify(m04, null, 2), 'utf-8');

console.log(`\n=== M04.json 更新完成 ===`);
console.log(`更新了 ${updatedCount} 道题目的杀手锏`);
console.log(`清空了 ${clearedCount} 道题目的杀手锏（无匹配）`);
