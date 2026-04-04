import fs from 'fs';

const weaponDetailsPath = './src/data/weapon_details.json';
const m04Path = './src/data/M04.json';
const m05Path = './src/data/M05.json';

const weaponDetails = JSON.parse(fs.readFileSync(weaponDetailsPath, 'utf-8'));
const m04 = JSON.parse(fs.readFileSync(m04Path, 'utf-8'));
const m05 = JSON.parse(fs.readFileSync(m05Path, 'utf-8'));

const validWeaponIds = Object.keys(weaponDetails);

console.log('=== 分析可能缺失杀手锏的题目 ===\n');

// 定义可能需要的杀手锏（weapon_details.json 中没有的）
const suggestedWeapons = {
  'S-LOG-01': {
    name: '换底公式',
    keywords: ['换底公式', 'log.*log', '链式换底', 'log_a b'],
    description: '对数换底公式的应用'
  },
  'S-LOG-02': {
    name: '指对同构',
    keywords: ['指对同构', '同构式', '指数对数互化', 'a^x.*log'],
    description: '指数与对数的同构变换'
  },
  'S-LOG-03': {
    name: '对数方程',
    keywords: ['对数方程', 'log.*=', '解对数'],
    description: '对数方程的求解'
  },
  'S-LOG-04': {
    name: '对数定义域',
    keywords: ['定义域', '真数.*大于', 'log.*定义域'],
    description: '对数函数定义域问题'
  },
  'S-LOG-05': {
    name: '指数运算',
    keywords: ['指数运算', 'a^x', '指数化简', '幂运算'],
    description: '指数的运算与化简'
  },
  'S-LOG-06': {
    name: '对数恒等式',
    keywords: ['对数恒等式', 'a^log_a', 'log_a a'],
    description: '对数恒等式的应用'
  },
  'S-LOG-07': {
    name: '对数比较大小',
    keywords: ['比较大小', 'log.*大小', '对数比较'],
    description: '对数大小的比较方法'
  },
  'S-EXP-01': {
    name: '指数方程',
    keywords: ['指数方程', 'a^x.*=', '解指数'],
    description: '指数方程的求解'
  },
  'S-EXP-02': {
    name: '指数函数性质',
    keywords: ['指数函数', 'y=a^x', '底数.*范围'],
    description: '指数函数的性质分析'
  }
};

// 收集需要杀手锏但缺失的题目
const needsNewWeapon = [];

function analyzeQuestion(q, varName, motifId) {
  const content = `${q.problem} ${q.answer} ${(q.key_points || []).join(' ')}`;
  const currentWeapons = q.meta?.weapons || [];
  
  // 如果已经有杀手锏，跳过
  if (currentWeapons.length > 0) return;
  
  // 检查是否匹配建议的新杀手锏
  for (const [weaponId, weapon] of Object.entries(suggestedWeapons)) {
    let matchCount = 0;
    const matchedKeywords = [];
    
    for (const keyword of weapon.keywords) {
      const pattern = new RegExp(keyword, 'i');
      if (pattern.test(content)) {
        matchCount++;
        matchedKeywords.push(keyword);
      }
    }
    
    // 匹配到至少 1 个关键词
    if (matchCount >= 1) {
      needsNewWeapon.push({
        questionId: q.id,
        motifId,
        varName,
        problem: q.problem?.substring(0, 80),
        suggestedWeapon: weaponId,
        weaponName: weapon.name,
        matchedKeywords,
        description: weapon.description
      });
      break; // 只记录第一个匹配的
    }
  }
}

// 分析 M04
for (const spec of m04.specialties) {
  for (const variation of spec.variations) {
    for (const q of variation.original_pool) {
      analyzeQuestion(q, variation.name, 'M04');
    }
  }
}

// 分析 M05
for (const spec of m05.specialties) {
  for (const variation of spec.variations) {
    for (const q of variation.original_pool) {
      analyzeQuestion(q, variation.name, 'M05');
    }
  }
}

// 输出结果
console.log('【需要新增杀手锏的题目】\n');

if (needsNewWeapon.length === 0) {
  console.log('✅ 所有题目都已正确匹配或不需要杀手锏');
} else {
  // 按建议的杀手锏分组
  const grouped = {};
  needsNewWeapon.forEach(item => {
    if (!grouped[item.suggestedWeapon]) {
      grouped[item.suggestedWeapon] = [];
    }
    grouped[item.suggestedWeapon].push(item);
  });
  
  for (const [weaponId, items] of Object.entries(grouped)) {
    const weapon = suggestedWeapons[weaponId];
    console.log(`\n【${weaponId}: ${weapon.name}】`);
    console.log(`描述: ${weapon.description}`);
    console.log(`涉及题目: ${items.length} 道\n`);
    
    items.slice(0, 5).forEach(item => {
      console.log(`  - ${item.questionId}`);
      console.log(`    题目: ${item.problem}...`);
      console.log(`    匹配关键词: ${item.matchedKeywords.join(', ')}`);
    });
    
    if (items.length > 5) {
      console.log(`  ... 还有 ${items.length - 5} 道`);
    }
  }
  
  console.log('\n\n【建议新增的杀手锏列表】');
  const uniqueWeapons = [...new Set(needsNewWeapon.map(i => i.suggestedWeapon))];
  uniqueWeapons.forEach(id => {
    const w = suggestedWeapons[id];
    console.log(`  ${id}: ${w.name} - ${w.description}`);
  });
}

console.log('\n\n【总结】');
console.log(`需要新增杀手锏的题目: ${needsNewWeapon.length} 道`);
console.log(`建议新增的杀手锏数量: ${new Set(needsNewWeapon.map(i => i.suggestedWeapon)).size} 个`);
