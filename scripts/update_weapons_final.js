import fs from 'fs';

const weaponDetailsPath = './src/data/weapon_details.json';
const m04Path = './src/data/M04.json';
const m05Path = './src/data/M05.json';

const weaponDetails = JSON.parse(fs.readFileSync(weaponDetailsPath, 'utf-8'));
const m04 = JSON.parse(fs.readFileSync(m04Path, 'utf-8'));
const m05 = JSON.parse(fs.readFileSync(m05Path, 'utf-8'));

const validWeaponIds = Object.keys(weaponDetails);

// 完整的杀手锏匹配规则
const weaponKeywords = {
  // M04 指对数模块专用杀手锏
  'S-LOG-01': ['换底公式', 'log.*log', '链式', 'log_a b', 'log₂.*log₃', 'log_2.*log_3'],
  'S-LOG-02': ['指对同构', '同构', 'xe^x', 'ye^y', 'e^x.*x', '超越方程'],
  'S-LOG-03': ['定点', '恒过', '图象恒过', '过定点', '反函数'],
  'S-LOG-04': ['定义域', '真数.*大于', '定义域优先', '单调区间'],
  'S-LOG-05': ['对数平均', '极值点偏移', 'ALG不等式', 'ln.*ln'],
  
  // 函数类杀手锏
  'S-FUNC-02': ['复合函数', '单调性', '同增异减', '内外层', '外层递增', '外层递减'],
  'S-FUNC-04': ['零点', '交点', '根的个数', '方程.*解', 'f(x)=0', '解的个数'],
  'S-FUNC-05': ['周期', '对称', '周期性', '对称轴', '对称中心', 'T='],
  'S-FUNC-06': ['奇偶', '偶函数', '奇函数', 'f(-x)', '脱壳'],
  'S-FUNC-08': ['复合零点', '剥洋葱', 'f(f(x))', '嵌套'],
  
  // 导数类杀手锏
  'S-DERIV-03': ['含参讨论', '单调区间', '导数含参', '求导', '参数讨论'],
  'S-DERIV-04': ['端点效应', '恒成立', '参数范围', '最值'],
  'S-DERIV-09': ['洛必达', '极限', '临界值'],
  'S-DERIV-10': ['极值点偏移', '比值代换', '双变量', 'x1.*x2'],
  'S-DERIV-11': ['对数平均', '极值点偏移', 'ALG不等式'],
  
  // 不等式类杀手锏
  'S-INEQ-02': ['乘1法', '基本不等式', '条件最值', '和为定值'],
  'S-INEQ-05': ['琴生', '凹凸函数', '凸函数', '凹函数'],
  'S-INEQ-06': ['柯西', '柯西不等式'],
  'S-INEQ-07': ['权方和', '分式最值'],
  'S-INEQ-10': ['均值不等式', 'AM-GM', '算术平均', '几何平均'],
  
  // 数列类杀手锏
  'S-SEQ-02': ['Sn最值', '前n项和最值', '二次函数'],
  'S-SEQ-04': ['裂项', '错位相减', '并项求和', '求和'],
  'S-SEQ-08': ['特征根', '递推', '线性递推', 'an+1'],
  'S-SEQ-09': ['不动点', '递推数列', '极限'],
  'S-SEQ-10': ['切线放缩', '数列不等式', '放缩'],
  
  // M05 向量模块专用杀手锏
  'S-VEC-01': ['投影向量', '投影长度', '在.*上的投影'],
  'S-VEC-02': ['极化恒等式', '数量积最值', 'PA.*PB', '中点', 'M是中点'],
  'S-VEC-03': ['线性运算', '基底', '向量表示', '三点共线', '系数和'],
  'S-VEC-04': ['建系', '坐标', '模长最值', '平方配方', '坐标系'],
  'S-VEC-05': ['极化恒等式', '数量积', 'PA.*PB', '奔驰定理', '面积比', '重心'],
  
  // 通用杀手锏
  'S-SET-01': ['空集', '子集', '包含关系', '集合.*子集'],
  'S-SET-02': ['端点验证', '集合边界', '取等'],
  'S-TRIG-01': ['辅助角', 'asinx.*bcosx', '配角', '化一'],
  'S-TRIG-02': ['图象变换', '平移', '伸缩', '相位'],
  'S-TRIG-03': ['化边为角', '正弦定理', '余弦定理', '三角形最值'],
  'S-TRI-02': ['SSA', '解的个数', '三角形解的个数'],
  'S-TRI-04': ['中线', '角平分线', '面积法'],
  'S-SEQ-01': ['等差', '等比', '下标和', '片段和'],
  'S-GEO-02': ['线面角', '二面角', '法向量'],
  'S-GEO-03': ['等体积', '点面距', '体积法'],
  'S-PROB-01': ['概率', '条件概率', '全概率', '贝叶斯'],
  'S-CONIC-01': ['椭圆', '双曲线', '抛物线', '焦点', '离心率', '圆锥曲线'],
  'S-CONIC-02': ['焦点三角形', '面积公式'],
  'S-CONIC-03': ['渐近线', '焦点到渐近线'],
  'S-CONIC-05': ['仿射变换', '椭圆内接'],
  'S-CONIC-06': ['齐次化', '斜率关系'],
  'S-CONIC-07': ['参数方程', '椭圆上点'],
  'S-COMP-01': ['复数', '复数模', 'z=']
};

// 模块优先级
const modulePriority = {
  'M04': ['S-LOG-01', 'S-LOG-02', 'S-LOG-03', 'S-LOG-04', 'S-LOG-05', 'S-FUNC-02', 'S-FUNC-04', 'S-FUNC-05', 'S-FUNC-06', 'S-DERIV-03', 'S-DERIV-04', 'S-INEQ-02', 'S-INEQ-10'],
  'M05': ['S-VEC-01', 'S-VEC-02', 'S-VEC-03', 'S-VEC-04', 'S-VEC-05']
};

// 精确匹配函数
function matchWeaponsPrecise(problem, answer, keyPoints, analysis, level, varName, motifId) {
  const content = `${problem} ${answer} ${(keyPoints || []).join(' ')} ${analysis || ''} ${varName || ''}`;
  const scores = {};
  
  const priority = modulePriority[motifId] || [];
  
  for (const [weaponId, keywords] of Object.entries(weaponKeywords)) {
    if (!validWeaponIds.includes(weaponId)) continue;
    
    let score = 0;
    let matchedKeywords = [];
    
    for (const keyword of keywords) {
      const pattern = new RegExp(keyword, 'i');
      if (pattern.test(content)) {
        score += 1;
        matchedKeywords.push(keyword);
      }
    }
    
    // 必须匹配至少 1 个关键词
    if (score >= 1) {
      // 模块优先杀手锏加分
      if (priority.includes(weaponId)) {
        score += 2;
      }
      scores[weaponId] = { score, matchedKeywords };
    }
  }
  
  // 按分数排序，取前 2 个
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 2)
    .map(([id]) => id);
  
  return sorted;
}

// 处理单个文件
function processFile(data, motifId, filePath) {
  let updatedCount = 0;
  let clearedCount = 0;
  let totalQuestions = 0;
  
  console.log(`\n=== 处理 ${motifId} ===\n`);
  
  for (const spec of data.specialties) {
    for (const variation of spec.variations) {
      for (const q of variation.original_pool) {
        totalQuestions++;
        const oldWeapons = q.meta?.weapons || [];
        
        const newWeapons = matchWeaponsPrecise(
          q.problem,
          q.answer,
          q.key_points,
          q.analysis,
          q.level,
          variation.name,
          motifId
        );
        
        if (!q.meta) q.meta = {};
        
        const hasChanged = JSON.stringify(oldWeapons) !== JSON.stringify(newWeapons);
        
        if (newWeapons.length === 0) {
          if (oldWeapons.length > 0) {
            q.meta.weapons = [];
            clearedCount++;
            console.log(`清空: ${q.id}`);
          }
        } else if (hasChanged) {
          q.meta.weapons = newWeapons;
          updatedCount++;
          console.log(`更新: ${q.id} -> [${newWeapons.join(', ')}]`);
        }
      }
    }
  }
  
  data.last_updated = new Date().toISOString().split('T')[0];
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  
  console.log(`\n${motifId} 统计:`);
  console.log(`  总题目: ${totalQuestions}`);
  console.log(`  更新: ${updatedCount}`);
  console.log(`  清空: ${clearedCount}`);
  
  return { totalQuestions, updatedCount, clearedCount };
}

// 处理 M04 和 M05
const m04Result = processFile(m04, 'M04', m04Path);
const m05Result = processFile(m05, 'M05', m05Path);

console.log('\n=== 总结 ===');
console.log(`M04: ${m04Result.totalQuestions} 题, 更新 ${m04Result.updatedCount}, 清空 ${m04Result.clearedCount}`);
console.log(`M05: ${m05Result.totalQuestions} 题, 更新 ${m05Result.updatedCount}, 清空 ${m05Result.clearedCount}`);
