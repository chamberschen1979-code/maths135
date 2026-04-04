import fs from 'fs';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         杀手锏匹配准确性审计                                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// 读取 weapon_details.json
let weaponDetails = {};
try {
  weaponDetails = JSON.parse(fs.readFileSync('./src/data/weapon_details.json', 'utf8'));
} catch (e) {}

// 定义杀手锏的适用场景关键词
const weaponScenarios = {
  'S-SET-01': ['空集', 'A ⊆ B', 'A⊆B', '子集', '包含', '参数'],
  'S-LOG-02': ['指对同构', 'xe^x', 'ye^y', 'e^x', 'ln', '指数', '对数', '同构'],
  'S-VIS-01': ['动区间', '动轴', '最值', '图像', '临界', '二次函数'],
  'S-FUNC-05': ['对称', '周期', '轴', '心'],
  'S-FUNC-06': ['奇偶', '单调', '抽象不等式', 'f(A)', 'f(B)'],
  'S-FUNC-08': ['零点', '复合', '剥洋葱'],
  'S-INEQ-02': ['乘1法', '齐次', '系数匹配'],
  'S-TRI-04': ['中线', '角平分线'],
  'S-TRI-06': ['中线长', '向量法'],
  'S-TRI-08': ['边化角', '正弦定理'],
  'S-TRI-09': ['余弦定理', 'sinA+sinB'],
  'S-SEQ-01': ['整体代换', '下标和'],
  'S-SEQ-02': ['变号点', 'Sn最值'],
  'S-SEQ-03': ['递推', '配凑', 'aₙ₊₁=paₙ+q'],
  'S-SEQ-04': ['裂项', '求和'],
  'S-COMPLEX-01': ['单位根', '周期', 'ω'],
  'S-COMPLEX-02': ['平行四边形', '|z₁+z₂|'],
  'S-VEC-02': ['极化恒等式', 'PA·PB', '中点'],
  'S-VEC-03': ['三点共线', '等和线', 'λ+μ=1']
};

const motifFiles = ['M01', 'M02', 'M04', 'M07', 'M08'];

let totalChecked = 0;
let totalMismatch = 0;
const mismatchDetails = [];

for (const motif of motifFiles) {
  const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
  
  data.specialties?.forEach(spec => {
    spec.variations?.forEach(vari => {
      vari.original_pool?.forEach(p => {
        let level = p.level || p.meta?.level || 'L2';
        if (p.id && p.id.includes('_L2')) level = 'L2';
        if (p.id && p.id.includes('_L3')) level = 'L3';
        if (p.id && p.id.includes('_L4')) level = 'L4';
        
        if (level === 'L3' || level === 'L4') {
          totalChecked++;
          
          const problem = (p.problem || '') + ' ' + (p.strategy_hint || '');
          const weapons = p.weapons || [];
          
          weapons.forEach(w => {
            const scenarios = weaponScenarios[w] || [];
            const hasMatch = scenarios.some(s => problem.includes(s));
            
            if (!hasMatch && scenarios.length > 0) {
              totalMismatch++;
              mismatchDetails.push({
                motif,
                id: p.id,
                level,
                weapon: w,
                problem: p.problem?.substring(0, 80),
                hint: p.strategy_hint,
                expectedKeywords: scenarios.slice(0, 5)
              });
            }
          });
        }
      });
    });
  });
}

console.log(`检查了 ${totalChecked} 道 L3/L4 题目`);
console.log(`发现 ${totalMismatch} 处可能的杀手锏不匹配\n`);

if (mismatchDetails.length > 0) {
  console.log('【不匹配详情】\n');
  
  // 按武器分组
  const byWeapon = {};
  mismatchDetails.forEach(d => {
    if (!byWeapon[d.weapon]) byWeapon[d.weapon] = [];
    byWeapon[d.weapon].push(d);
  });
  
  Object.entries(byWeapon).forEach(([w, list]) => {
    console.log(`\n${w} (${list.length} 处不匹配):`);
    const detail = weaponDetails[w];
    console.log(`  定义: ${detail?.coreLogic?.substring(0, 50)}...`);
    console.log(`  期望关键词: ${list[0].expectedKeywords.join(', ')}`);
    console.log(`  不匹配题目:`);
    list.slice(0, 5).forEach(d => {
      console.log(`    - ${d.id}: ${d.problem}...`);
    });
    if (list.length > 5) {
      console.log(`    ... 还有 ${list.length - 5} 道`);
    }
  });
}

console.log(`\n\n【总结】`);
console.log(`不匹配率: ${(totalMismatch / totalChecked * 100).toFixed(1)}%`);
console.log(`\n建议：重新审视这些题目的杀手锏配置，确保"宁缺毋滥"`);
