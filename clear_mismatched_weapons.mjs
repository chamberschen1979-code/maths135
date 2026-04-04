import fs from 'fs';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         清空不匹配的杀手锏配置                                ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

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

const motifFiles = ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09'];

let totalCleared = 0;
const clearedByMotif = {};

for (const motif of motifFiles) {
  const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
  let clearedCount = 0;
  
  data.specialties?.forEach(spec => {
    spec.variations?.forEach(vari => {
      vari.original_pool?.forEach(p => {
        let level = p.level || p.meta?.level || 'L2';
        if (p.id && p.id.includes('_L2')) level = 'L2';
        if (p.id && p.id.includes('_L3')) level = 'L3';
        if (p.id && p.id.includes('_L4')) level = 'L4';
        
        if ((level === 'L3' || level === 'L4') && p.weapons && p.weapons.length > 0) {
          const problem = (p.problem || '') + ' ' + (p.strategy_hint || '');
          
          // 过滤掉不匹配的武器
          const matchedWeapons = p.weapons.filter(w => {
            const scenarios = weaponScenarios[w] || [];
            if (scenarios.length === 0) return true; // 没有定义场景的武器保留
            return scenarios.some(s => problem.includes(s));
          });
          
          if (matchedWeapons.length !== p.weapons.length) {
            const removed = p.weapons.filter(w => !matchedWeapons.includes(w));
            clearedCount += removed.length;
            p.weapons = matchedWeapons;
          }
        }
      });
    });
  });
  
  fs.writeFileSync(`./src/data/${motif}.json`, JSON.stringify(data, null, 2), 'utf8');
  clearedByMotif[motif] = clearedCount;
  totalCleared += clearedCount;
  console.log(`${motif}: 清理了 ${clearedCount} 处不匹配的杀手锏`);
}

console.log(`\n总计清理: ${totalCleared} 处不匹配的杀手锏配置`);
console.log('\n完成！现在杀手锏配置更加精准。');
